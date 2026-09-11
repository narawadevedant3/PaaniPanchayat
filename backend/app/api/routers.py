import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional

from app.database import get_db, engine, Base
from app import models, schemas
from app.services.water_requirement import calculate_water_requirement
from app.services.weather_service import fetch_weather_data
from app.services.optimizer import solve_water_allocation
from app.services.agent_engine import agent_engine
from app.services.auth import hash_password, verify_password, create_access_token, decode_access_token

# Initialize tables
Base.metadata.create_all(bind=engine)

router = APIRouter(prefix="/api")

# In-memory store for active allocation state during demo execution
CURRENT_STATE = {
    "water_source_available": 180000.0,
    "last_allocation": None,
    "disputes": [],
    "audit_logs": [],
    "cycle_number": 1,
    "accepted_version": None,
}


def _resolve_user(db: Session, token: Optional[str]) -> Optional[models.User]:
    """Resolve the logged-in user from a Bearer/query token. Returns None if invalid/missing."""
    if not token:
        return None
    payload = decode_access_token(token)
    if not payload:
        return None
    return db.query(models.User).filter(models.User.id == payload["user_id"]).first()


def _require_user(db: Session, token: Optional[str]) -> models.User:
    user = _resolve_user(db, token)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user


def _farm_optimizer_input(farm: models.Farm, crop: models.Crop, req_vol: float, user: Optional[models.User] = None) -> Dict[str, Any]:
    return {
        "id": farm.id,
        "user_id": farm.user_id,
        "user_email": user.email if user else None,
        "farmer_name": farm.farmer_name,
        "crop_name": crop.name if crop else "Crop",
        "area_acres": farm.area_acres,
        "growth_stage": crop.growth_stage if crop else "Vegetative",
        "required_liters": req_vol,
        "soil_type": farm.soil_type,
        "is_critical_stage": farm.is_critical_stage,
        "emergency_priority": farm.emergency_priority,
    }


def _build_farms_data(db: Session) -> List[Dict[str, Any]]:
    """Snapshot of every farm's real profile + latest water requirement for the optimizer."""
    farms_data = []
    for f in db.query(models.Farm).all():
        crop = db.query(models.Crop).filter(models.Crop.farm_id == f.id).first()
        req = (
            db.query(models.WaterRequirement)
            .filter(models.WaterRequirement.farm_id == f.id)
            .order_by(models.WaterRequirement.id.desc())
            .first()
        )
        req_vol = req.estimated_volume_liters if req else 50000.0
        u = db.query(models.User).filter(models.User.id == f.user_id).first() if f.user_id else None
        farms_data.append(_farm_optimizer_input(f, crop, req_vol, u))
    return farms_data


def _run_allocation(db: Session, version: int) -> schemas.AllocationResult:
    """Run the optimizer over real farm data and store the result as current state."""
    farms_data = _build_farms_data(db)
    allocation = solve_water_allocation(
        farms_data,
        available_water_liters=CURRENT_STATE["water_source_available"],
        version=version,
        cycle_number=CURRENT_STATE["cycle_number"],
    )
    allocation.is_accepted = CURRENT_STATE.get("accepted_version") == version
    CURRENT_STATE["last_allocation"] = allocation
    return allocation

def get_utc_now_iso() -> str:
    return datetime.datetime.now(datetime.timezone.utc).isoformat()

def log_audit(db: Session, entity_type: str, entity_id: str, action: str, details: Any):
    log = models.AuditLog(
        entity_type=entity_type,
        entity_id=str(entity_id),
        action=action,
        details=details
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    CURRENT_STATE["audit_logs"].insert(0, {
        "id": log.id,
        "entity_type": entity_type,
        "entity_id": str(entity_id),
        "action": action,
        "details": details,
        "timestamp": get_utc_now_iso()
    })
    return log

# --- AUTHENTICATION ENDPOINTS ---
@router.post("/auth/register", response_model=schemas.AuthResponse)
def register_user(user_in: schemas.UserRegister, db: Session = Depends(get_db)):
    email_clean = user_in.email.lower().strip()
    pwd_clean = user_in.password.strip()

    existing = db.query(models.User).filter(models.User.email == email_clean).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pwd = hash_password(pwd_clean)
    new_user = models.User(
        name=user_in.name.strip(),
        email=email_clean,
        hashed_password=hashed_pwd,
        role=user_in.role,
        contact=user_in.contact,
        language=user_in.language
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    token = create_access_token(new_user.id, new_user.email, new_user.role, new_user.name)
    log_audit(db, "User", str(new_user.id), "REGISTER_USER", {"email": new_user.email, "role": new_user.role})
    
    return schemas.AuthResponse(
        user_id=new_user.id,
        name=new_user.name,
        email=new_user.email,
        role=new_user.role,
        token=token,
        contact=new_user.contact,
        message="User registered successfully"
    )

@router.post("/auth/login", response_model=schemas.AuthResponse)
def login_user(login_in: schemas.UserLogin, db: Session = Depends(get_db)):
    email_clean = login_in.email.lower().strip()
    pwd_clean = login_in.password.strip()
    user = db.query(models.User).filter(models.User.email == email_clean).first()
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email address or password")
    
    # Check if user exists or if password matches
    if user.hashed_password:
        if not verify_password(pwd_clean, user.hashed_password):
            raise HTTPException(status_code=401, detail="Invalid email address or password")
    else:
        # Fallback for unhashed demo users
        if pwd_clean != "password123" and pwd_clean != "admin123":
            raise HTTPException(status_code=401, detail="Invalid email address or password")
    
    token = create_access_token(user.id, user.email, user.role, user.name)
    log_audit(db, "User", str(user.id), "LOGIN_USER", {"email": user.email, "role": user.role})
    
    return schemas.AuthResponse(
        user_id=user.id,
        name=user.name,
        email=user.email or email_clean,
        role=user.role,
        token=token,
        contact=user.contact,
        message="Login successful"
    )

@router.get("/auth/me")
def get_current_user(token: str, db: Session = Depends(get_db)):
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = db.query(models.User).filter(models.User.id == payload["user_id"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "user_id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "contact": user.contact,
        "language": user.language
    }

def init_server_state(db: Session):
    """
    Restores in-memory state from the persistent SQLite database on startup or restart.
    Preserves all existing users, farms, water source values, agreements, and requirements.
    """
    user_count = db.query(models.User).count()
    if user_count == 0:
        reset_demo_data(db)
        print("[SUCCESS] PaaniPanchayat Backend Initialized with Demo Farms!")
        return

    # 1. Restore Water Source available volume
    source = db.query(models.WaterSource).first()
    if source and source.available_volume_liters is not None:
        CURRENT_STATE["water_source_available"] = float(source.available_volume_liters)

    # 2. Restore latest accepted agreement version
    latest_agreement = (
        db.query(models.Agreement)
        .filter(models.Agreement.status == "Accepted")
        .order_by(models.Agreement.id.desc())
        .first()
    )
    if latest_agreement and latest_agreement.allocation_version:
        CURRENT_STATE["accepted_version"] = latest_agreement.allocation_version

    # 3. Restore cycle number if any in audit logs
    recent_cycle_log = (
        db.query(models.AuditLog)
        .filter(models.AuditLog.action == "NEW_WATER_CYCLE")
        .order_by(models.AuditLog.id.desc())
        .first()
    )
    if recent_cycle_log and isinstance(recent_cycle_log.details, dict):
        cycle_num = recent_cycle_log.details.get("cycle")
        if cycle_num:
            CURRENT_STATE["cycle_number"] = int(cycle_num)

    # 4. Pre-run allocation for all existing farms so state is immediately ready
    try:
        active_version = CURRENT_STATE["accepted_version"] or 1
        _run_allocation(db, version=active_version)
    except Exception as e:
        print(f"[WARN] Initial allocation calculation on restart: {e}")

    farm_count = db.query(models.Farm).count()
    print(f"[INFO] PaaniPanchayat loaded {user_count} users, {farm_count} farms, and canal supply of {CURRENT_STATE['water_source_available']:,.0f} L from persistent database.")

# --- DEMO RESET & SEED DATA ENDPOINT ---
@router.post("/demo/reset")
def reset_demo_data(db: Session = Depends(get_db)):
    """
    Resets the demo scenario without deleting custom registered user accounts.
    """
    CURRENT_STATE["last_allocation"] = None
    db.query(models.AuditLog).delete()
    CURRENT_STATE["audit_logs"] = []  # clear in-memory mirror too
    db.query(models.Agreement).delete()
    db.query(models.MediationSession).delete()
    db.query(models.Dispute).delete()
    db.query(models.Allocation).delete()
    db.query(models.WaterRequirement).delete()
    db.query(models.Crop).delete()

    # Delete demo users and their farms, preserving custom registered accounts
    demo_emails = ["admin@paanipanchayat.org", "ramesh@paanipanchayat.org", "suresh@paanipanchayat.org", "vijay@paanipanchayat.org", "anish@paanipanchayat.org"]
    demo_users = db.query(models.User).filter(models.User.email.in_(demo_emails)).all()
    demo_user_ids = [u.id for u in demo_users]

    if demo_user_ids:
        db.query(models.Farm).filter(models.Farm.user_id.in_(demo_user_ids)).delete(synchronize_session=False)
        db.query(models.User).filter(models.User.id.in_(demo_user_ids)).delete(synchronize_session=False)

    db.query(models.WaterSource).delete()
    db.commit()

    # Create Water Source
    source = models.WaterSource(
        name="Panchayat Shared Canal #1",
        total_capacity_liters=300000.0,
        available_volume_liters=180000.0,
        status="Scarce"
    )
    db.add(source)
    db.commit()

    # Create Demo Admin User
    admin_user = models.User(
        name="Panchayat Admin",
        email="admin@paanipanchayat.org",
        hashed_password=hash_password("admin123"),
        role="admin",
        language="en"
    )
    db.add(admin_user)
    db.commit()

    # Create Demo Farms (PRD Section 29)
    demo_farms_input = [
        {"name": "Ramesh (Farm A)", "email": "ramesh@paanipanchayat.org", "crop": "Wheat", "area": 2.0, "soil": "Clay", "stage": "Flowering", "eff": 0.75, "prev_irr": 10000.0},
        {"name": "Suresh (Farm B)", "email": "suresh@paanipanchayat.org", "crop": "Tomato", "area": 1.5, "soil": "Loam", "stage": "Fruit Development", "eff": 0.70, "prev_irr": 8000.0},
        {"name": "Vijay (Farm C)", "email": "vijay@paanipanchayat.org", "crop": "Sugarcane", "area": 3.0, "soil": "Black", "stage": "Vegetative", "eff": 0.65, "prev_irr": 15000.0},
        {"name": "Anish (Farm D)", "email": "anish@paanipanchayat.org", "crop": "Onion", "area": 1.0, "soil": "Sandy", "stage": "Bulb Development", "eff": 0.80, "prev_irr": 5000.0}
    ]

    created_farms = []
    farms_optimizer_input = []
    total_demand = 0.0

    for idx, f in enumerate(demo_farms_input, start=1):
        user = models.User(
            name=f["name"],
            email=f["email"],
            hashed_password=hash_password("password123"),
            role="farmer",
            language="en"
        )
        db.add(user)
        db.commit()

        farm = models.Farm(
            user_id=user.id,
            farmer_name=f["name"],
            location="Baramati Sector, MH",
            area_acres=f["area"],
            soil_type=f["soil"],
            irrigation_efficiency=f["eff"],
            is_critical_stage=(f["stage"] == "Flowering")
        )
        db.add(farm)
        db.commit()

        crop = models.Crop(
            farm_id=farm.id,
            name=f["crop"],
            growth_stage=f["stage"],
            criticality_score=1.5 if f["stage"] in ["Flowering", "Fruit Development"] else 1.0
        )
        db.add(crop)
        db.commit()

        req_calc = calculate_water_requirement(
            crop_name=f["crop"],
            area_acres=f["area"],
            growth_stage=f["stage"],
            soil_type=f["soil"],
            irrigation_efficiency=f["eff"],
            temperature_c=32.5,
            rainfall_mm=0.0,
            forecast_rainfall_mm=1.2,
            previous_irrigation_liters=f["prev_irr"]
        )

        water_req = models.WaterRequirement(
            farm_id=farm.id,
            estimated_volume_liters=req_calc.final_estimated_liters,
            breakdown=req_calc.model_dump()
        )
        db.add(water_req)
        db.commit()

        total_demand += req_calc.final_estimated_liters
        created_farms.append(farm)

        farms_optimizer_input.append({
            "id": farm.id,
            "user_id": user.id,
            "user_email": user.email,
            "farmer_name": f["name"],
            "crop_name": f["crop"],
            "area_acres": f["area"],
            "growth_stage": f["stage"],
            "required_liters": req_calc.final_estimated_liters,
            "soil_type": f["soil"],
            "is_critical_stage": (f["stage"] == "Flowering")
        })

    # Reset cycle state on demo reset
    CURRENT_STATE["cycle_number"] = 1
    CURRENT_STATE["accepted_version"] = None

    # Run OR-Tools Optimization v1
    allocation_v1 = solve_water_allocation(
        farms_data=farms_optimizer_input,
        available_water_liters=180000.0,
        version=1,
        cycle_number=1
    )
    CURRENT_STATE["last_allocation"] = allocation_v1

    log_audit(db, "System", "DemoReset", "INITIALIZE_DEMO_SCENARIO", {
        "farms_count": 4,
        "available_water": 180000.0,
        "total_demand": total_demand,
        "shortage": max(total_demand - 180000.0, 0)
    })

    return {
        "status": "success",
        "message": "Loaded 4 Demo Farms with 180,000 L Available Water",
        "allocation": allocation_v1
    }

# --- FARMS ENDPOINTS (owner-scoped) ---
@router.get("/farms", response_model=List[schemas.FarmResponse])
def get_farms(
    token: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Farmers see ONLY their own farms; admins see everyone's farms."""
    user = _resolve_user(db, token)

    query = db.query(models.Farm)
    if user and user.role != "admin":
        query = query.filter(models.Farm.user_id == user.id)
    farms = query.all()

    res = []
    for f in farms:
        crop = db.query(models.Crop).filter(models.Crop.farm_id == f.id).first()
        u = db.query(models.User).filter(models.User.id == f.user_id).first() if f.user_id else None
        res.append(schemas.FarmResponse(
            id=f.id,
            user_id=f.user_id,
            user_email=u.email if u else None,
            farmer_name=f.farmer_name,
            location=f.location,
            latitude=f.latitude,
            longitude=f.longitude,
            area_acres=f.area_acres,
            soil_type=f.soil_type,
            irrigation_efficiency=f.irrigation_efficiency,
            is_critical_stage=f.is_critical_stage,
            emergency_priority=f.emergency_priority,
            crop_name=crop.name if crop else "General Crop",
            growth_stage=crop.growth_stage if crop else "Vegetative",
            criticality_score=crop.criticality_score if crop else 1.0
        ))
    return res

@router.post("/farms", response_model=schemas.FarmResponse)
def create_farm(
    farm_in: schemas.FarmCreate,
    token: Optional[str] = None,
    db: Session = Depends(get_db)
):
    CURRENT_STATE["last_allocation"] = None
    current_user = _resolve_user(db, token)

    user = None
    if current_user and current_user.role != "admin":
        user = current_user
    elif farm_in.user_id:
        user = db.query(models.User).filter(models.User.id == farm_in.user_id).first()
    if not user:
        user = db.query(models.User).filter(models.User.name == farm_in.farmer_name).first()
    if not user:
        user = models.User(name=farm_in.farmer_name, role="farmer")
        db.add(user)
        db.commit()

    owner_id = user.id

    # Enforce 1 water request every 3 days rule per farmer
    now = datetime.datetime.utcnow()
    three_days_ago = now - datetime.timedelta(days=3)

    if user and user.id:
        user_farms = db.query(models.Farm).filter(models.Farm.user_id == user.id).all()
        target_farm_ids = [f.id for f in user_farms]
        if target_farm_ids:
            recent_req = (
                db.query(models.WaterRequirement)
                .filter(models.WaterRequirement.farm_id.in_(target_farm_ids))
                .filter(models.WaterRequirement.created_at >= three_days_ago)
                .order_by(models.WaterRequirement.created_at.desc())
                .first()
            )
            if recent_req:
                next_eligible = recent_req.created_at + datetime.timedelta(days=3)
                diff = next_eligible - now
                hours_rem = round(max(diff.total_seconds() / 3600.0, 0.1), 1)
                raise HTTPException(
                    status_code=400,
                    detail=f"Panchayat Policy Limit: 1 water request per farmer every 3 days. Last request was submitted on {recent_req.created_at.strftime('%b %d, %H:%M')}. Next eligible request in {hours_rem} hours."
                )

    farm = models.Farm(
        user_id=owner_id,
        farmer_name=farm_in.farmer_name,
        location=farm_in.location,
        latitude=farm_in.latitude,
        longitude=farm_in.longitude,
        area_acres=farm_in.area_acres,
        soil_type=farm_in.soil_type,
        irrigation_efficiency=farm_in.irrigation_efficiency,
        is_critical_stage=farm_in.is_critical_stage,
        emergency_priority=farm_in.emergency_priority
    )
    db.add(farm)
    db.commit()

    crop = models.Crop(
        farm_id=farm.id,
        name=farm_in.crop_name,
        growth_stage=farm_in.growth_stage,
        criticality_score=farm_in.criticality_score
    )
    db.add(crop)
    db.commit()

    # Calculate initial requirement
    req_calc = calculate_water_requirement(
        crop_name=farm_in.crop_name,
        area_acres=farm_in.area_acres,
        growth_stage=farm_in.growth_stage,
        soil_type=farm_in.soil_type,
        irrigation_efficiency=farm_in.irrigation_efficiency,
        previous_irrigation_liters=farm_in.previous_irrigation_liters
    )
    water_req = models.WaterRequirement(
        farm_id=farm.id,
        estimated_volume_liters=req_calc.final_estimated_liters,
        breakdown=req_calc.model_dump()
    )
    db.add(water_req)
    db.commit()

    log_audit(db, "Farm", str(farm.id), "REGISTER_FARM", {"farmer_name": farm_in.farmer_name, "area": farm_in.area_acres})

    # Automatically re-solve allocation to include newly added farm
    try:
        generate_allocation_endpoint(db)
    except Exception as e:
        print(f"Failed to auto-update allocation on farm creation: {e}")

    return schemas.FarmResponse(
        id=farm.id,
        farmer_name=farm.farmer_name,
        location=farm.location,
        latitude=farm.latitude,
        longitude=farm.longitude,
        area_acres=farm.area_acres,
        soil_type=farm.soil_type,
        irrigation_efficiency=farm.irrigation_efficiency,
        is_critical_stage=farm.is_critical_stage,
        emergency_priority=farm.emergency_priority,
        crop_name=crop.name,
        growth_stage=crop.growth_stage,
        criticality_score=crop.criticality_score
    )

# --- WEATHER ENDPOINT ---
@router.api_route("/weather", methods=["GET", "POST"])
async def get_weather(lat: float = 18.5204, lon: float = 73.8567):
    return await fetch_weather_data(lat, lon)

# --- WATER REQUIREMENT CALCULATION ENDPOINT ---
@router.post("/water-requirement/calculate", response_model=schemas.WaterRequirementResponse)
def calculate_req_endpoint(req: schemas.WaterRequirementCalculationRequest):
    breakdown = calculate_water_requirement(
        crop_name=req.crop_name,
        area_acres=req.area_acres,
        growth_stage=req.growth_stage,
        soil_type=req.soil_type,
        irrigation_efficiency=req.irrigation_efficiency,
        temperature_c=req.temperature_c,
        rainfall_mm=req.rainfall_mm,
        forecast_rainfall_mm=req.forecast_rainfall_mm,
        previous_irrigation_liters=req.previous_irrigation_liters
    )
    return schemas.WaterRequirementResponse(
        farm_id=req.farm_id,
        estimated_volume_liters=breakdown.final_estimated_liters,
        breakdown=breakdown
    )

# --- ALLOCATION & OPTIMIZATION ENDPOINT ---
@router.post("/allocation/generate", response_model=schemas.AllocationResult)
def generate_allocation_endpoint(db: Session = Depends(get_db)):
    allocation = _run_allocation(db, version=1)
    log_audit(db, "Allocation", "v1", "GENERATE_INITIAL_ALLOCATION", {"is_conflict": allocation.is_conflict, "shortage": allocation.shortage_liters})
    return allocation

@router.get("/allocation/current", response_model=schemas.AllocationResult)
def get_current_allocation(db: Session = Depends(get_db)):
    if CURRENT_STATE.get("last_allocation") is not None:
        return CURRENT_STATE["last_allocation"]
    return generate_allocation_endpoint(db)

# --- WATER CYCLE ENDPOINTS ---
# Lifecycle of one irrigation cycle:
#   1. Water arrives in the canal            -> POST /water-cycle/new-water
#   2. Demand is re-estimated per farm       -> (automatic, from latest requirements)
#   3. Allocation is re-computed by crop
#      stage urgency / emergency priority    -> automatic (OR-Tools with fairness floor)
#   4. Previous cycle's distribution is      -> done here (version/cycle reset)
#      archived so farmers start fresh
@router.post("/water-cycle/new-water", response_model=schemas.WaterCycleResponse)
def new_water_cycle(
    cycle: schemas.WaterCycleRequest,
    db: Session = Depends(get_db)
):
    """
    Simulates new water arriving in the shared canal:
    resets the previous distribution and re-allocates the fresh volume
    according to each farm's CURRENT crop stage and emergency priority.
    """
    new_volume = max(cycle.new_volume_liters, 0.0)
    CURRENT_STATE["water_source_available"] = new_volume
    CURRENT_STATE["cycle_number"] = CURRENT_STATE.get("cycle_number", 1) + 1
    CURRENT_STATE["accepted_version"] = None  # fresh water = fresh agreement

    source = db.query(models.WaterSource).first()
    if source:
        source.available_volume_liters = new_volume
        source.status = "Normal" if not any(
            r.estimated_volume_liters for r in db.query(models.WaterRequirement).all()
        ) else "Scarce"
        source.date = datetime.datetime.now(datetime.timezone.utc)
        db.commit()

    # Fresh allocation of the NEW water over CURRENT demand (version restarts at 1 per cycle)
    allocation = _run_allocation(db, version=1)

    log_audit(db, "WaterSource", str(source.id if source else 1), "NEW_WATER_CYCLE", {
        "cycle": CURRENT_STATE["cycle_number"],
        "new_volume_liters": new_volume,
        "reallocated": True,
    })

    return schemas.WaterCycleResponse(
        cycle_number=CURRENT_STATE["cycle_number"],
        message=f"Cycle {CURRENT_STATE['cycle_number']}: {new_volume:,.0f} L released. Previous distribution reset; fresh allocation generated by crop-stage urgency.",
        available_volume_liters=new_volume,
        allocation=allocation,
    )

@router.get("/water-cycle/current")
def get_current_cycle():
    return {
        "cycle_number": CURRENT_STATE.get("cycle_number", 1),
        "available_volume_liters": CURRENT_STATE["water_source_available"],
    }

@router.post("/water-cycle/reset-distribution")
def reset_distribution(db: Session = Depends(get_db)):
    """Archives the current distribution: farmers' allocations are cleared until
    the next water release (or a manual re-run of the solver)."""
    CURRENT_STATE["last_allocation"] = None
    CURRENT_STATE["accepted_version"] = None
    log_audit(db, "System", "Distribution", "RESET_DISTRIBUTION", {"message": "Allocation cleared; awaiting next water release"})
    return {"status": "success", "message": "Distribution reset. Add new water or re-run the solver to allocate."}

# --- WATER SOURCE ENDPOINT ---
@router.post("/water-source/update", response_model=schemas.AllocationResult)
def update_water_source(update_in: schemas.WaterSourceUpdate, db: Session = Depends(get_db)):
    """
    Updates the available canal water supply (liters) and automatically re-runs the OR-Tools linear solver.
    """
    new_vol = float(update_in.available_volume_liters)
    CURRENT_STATE["water_source_available"] = new_vol

    # Update database record
    source = db.query(models.WaterSource).first()
    if source:
        source.available_volume_liters = new_vol
        source.status = "Scarce" if new_vol < 200000.0 else "Adequate"
        source.date = datetime.datetime.now(datetime.timezone.utc)
        db.commit()
    else:
        source = models.WaterSource(
            name="Panchayat Shared Canal #1",
            total_capacity_liters=300000.0,
            available_volume_liters=new_vol,
            status="Scarce" if new_vol < 200000.0 else "Adequate"
        )
        db.add(source)
        db.commit()

    last_v = CURRENT_STATE["last_allocation"].version if CURRENT_STATE.get("last_allocation") else 1
    new_v = last_v + 1
    allocation = _run_allocation(db, version=new_v)

    log_audit(db, "WaterSource", str(source.id if source else 1), "UPDATE_CANAL_SUPPLY", {
        "new_available_liters": new_vol,
        "new_version": new_v,
        "is_conflict": allocation.is_conflict,
        "shortage": allocation.shortage_liters
    })

    return allocation

# --- MEDIATION & DISPUTE ENDPOINTS ---
@router.get("/water-request/cooldown")
def check_water_request_cooldown(farm_id: Optional[int] = None, user_id: Optional[int] = None, db: Session = Depends(get_db)):
    """
    Checks if a farmer/farm is eligible to raise a water request under the '1 request per 3 days' Panchayat policy.
    """
    now = datetime.datetime.utcnow()
    three_days_ago = now - datetime.timedelta(days=3)

    target_farm_ids = []
    if farm_id:
        target_farm_ids.append(farm_id)
        farm = db.query(models.Farm).filter(models.Farm.id == farm_id).first()
        if farm and farm.user_id:
            user_farms = db.query(models.Farm).filter(models.Farm.user_id == farm.user_id).all()
            target_farm_ids = list(set([f.id for f in user_farms]))
    elif user_id:
        user_farms = db.query(models.Farm).filter(models.Farm.user_id == user_id).all()
        target_farm_ids = [f.id for f in user_farms]

    if not target_farm_ids:
        return {"can_request": True, "message": "Eligible for water request"}

    recent_dispute = (
        db.query(models.Dispute)
        .filter(models.Dispute.farm_id.in_(target_farm_ids))
        .filter(models.Dispute.created_at >= three_days_ago)
        .order_by(models.Dispute.created_at.desc())
        .first()
    )

    if recent_dispute:
        next_eligible = recent_dispute.created_at + datetime.timedelta(days=3)
        diff = next_eligible - now
        hours_remaining = round(max(diff.total_seconds() / 3600.0, 0.1), 1)
        days_remaining = round(max(diff.total_seconds() / 86400.0, 0.1), 1)
        
        return {
            "can_request": False,
            "last_request_at": recent_dispute.created_at.isoformat(),
            "next_eligible_at": next_eligible.isoformat(),
            "hours_remaining": hours_remaining,
            "days_remaining": days_remaining,
            "message": f"Panchayat Policy Limit: 1 water request per farmer every 3 days. You last requested water on {recent_dispute.created_at.strftime('%b %d, %H:%M')}. Next request eligible in {hours_remaining} hours ({days_remaining} days)."
        }

    return {"can_request": True, "message": "Eligible for water request"}

@router.post("/mediation/propose", response_model=schemas.MediationProposalResponse)
def propose_mediation(objection: schemas.ObjectionRequest, db: Session = Depends(get_db)):
    now = datetime.datetime.utcnow()
    three_days_ago = now - datetime.timedelta(days=3)

    target_farm = db.query(models.Farm).filter(models.Farm.id == objection.farm_id).first()
    target_farm_ids = [objection.farm_id]
    if target_farm and target_farm.user_id:
        user_farms = db.query(models.Farm).filter(models.Farm.user_id == target_farm.user_id).all()
        target_farm_ids = list(set([f.id for f in user_farms]))

    # Enforce 1 request every 3 days per farmer
    recent_dispute = (
        db.query(models.Dispute)
        .filter(models.Dispute.farm_id.in_(target_farm_ids))
        .filter(models.Dispute.created_at >= three_days_ago)
        .order_by(models.Dispute.created_at.desc())
        .first()
    )

    if recent_dispute:
        next_eligible = recent_dispute.created_at + datetime.timedelta(days=3)
        diff = next_eligible - now
        hours_rem = round(max(diff.total_seconds() / 3600.0, 0.1), 1)
        raise HTTPException(
            status_code=400,
            detail=f"Panchayat Policy Limit: 1 water request allowed per farmer every 3 days. Last request was on {recent_dispute.created_at.strftime('%b %d, %H:%M')}. Next request eligible in {hours_rem} hours."
        )

    current_alloc = CURRENT_STATE["last_allocation"]
    if not current_alloc:
        current_alloc = _run_allocation(db, version=1)

    # Real profiles of ALL farms (soil, emergency flags) for the re-optimization
    farms_data = _build_farms_data(db)

    proposal = agent_engine.run_mediation_workflow(
        dispute_id=1,
        farmer_name=objection.farmer_name,
        farm_id=objection.farm_id,
        objection_text=objection.objection_reason,
        current_allocation_result=current_alloc,
        requested_additional_liters=objection.requested_additional_liters,
        farm_profiles=farms_data,
        cycle_number=CURRENT_STATE["cycle_number"],
    )

    # Save dispute record in DB to enforce 3-day policy for future requests
    new_dispute = models.Dispute(
        farm_id=objection.farm_id,
        objection_text=objection.objection_reason,
        requested_additional_liters=objection.requested_additional_liters,
        status="Mediated",
        created_at=now
    )
    db.add(new_dispute)
    db.commit()

    CURRENT_STATE["last_allocation"] = proposal.revised_allocation
    CURRENT_STATE["accepted_version"] = None  # new version pending acceptance
    log_audit(db, "Dispute", str(objection.farm_id), "AI_MEDIATION_PROPOSAL", {
        "farmer": objection.farmer_name,
        "objection": objection.objection_reason,
        "validated": proposal.is_validated_by_optimizer,
        "status": proposal.status,
        "dispute_id": new_dispute.id
    })
    return proposal

@router.post("/agreements/accept")
def accept_agreement(version: int = 1, farm_id: Optional[int] = None, db: Session = Depends(get_db)):
    agreement = models.Agreement(allocation_version=version, status="Accepted")
    db.add(agreement)
    db.commit()
    CURRENT_STATE["accepted_version"] = version
    if CURRENT_STATE.get("last_allocation") is not None and CURRENT_STATE["last_allocation"].version == version:
        CURRENT_STATE["last_allocation"].is_accepted = True
    log_audit(db, "Agreement", str(farm_id) if farm_id else f"v{version}", "ACCEPT_FINAL_AGREEMENT", {
        "status": "Accepted",
        "farm_id": farm_id,
        "version": version,
        "accepted_at": get_utc_now_iso()
    })
    return {"status": "success", "message": f"Allocation Version {version} Accepted and Saved to Immutable Audit Log!"}

# --- AUDIT LOGS ENDPOINT ---
@router.get("/audit")
def get_audit_trail(db: Session = Depends(get_db)):
    db_logs = db.query(models.AuditLog).order_by(models.AuditLog.id.desc()).all()
    res = []
    for log in db_logs:
        res.append({
            "id": log.id,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "action": log.action,
            "details": log.details,
            "timestamp": log.created_at.isoformat() if hasattr(log, 'created_at') and log.created_at else datetime.datetime.utcnow().isoformat()
        })
    if not res and CURRENT_STATE.get("audit_logs"):
        return CURRENT_STATE["audit_logs"]
    return res
