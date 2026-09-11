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
    "audit_logs": []
}

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
        "timestamp": datetime.datetime.utcnow().isoformat()
    })
    return log

# --- AUTHENTICATION ENDPOINTS ---
@router.post("/auth/register", response_model=schemas.AuthResponse)
def register_user(user_in: schemas.UserRegister, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user_in.email.lower().strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pwd = hash_password(user_in.password)
    new_user = models.User(
        name=user_in.name,
        email=user_in.email.lower().strip(),
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
        message="User registered successfully"
    )

@router.post("/auth/login", response_model=schemas.AuthResponse)
def login_user(login_in: schemas.UserLogin, db: Session = Depends(get_db)):
    email_clean = login_in.email.lower().strip()
    user = db.query(models.User).filter(models.User.email == email_clean).first()
    
    # Check if user exists or if password matches
    if not user or not user.hashed_password or not verify_password(login_in.password, user.hashed_password):
        # Fallback for demo users if unhashed/seeded
        if user and not user.hashed_password and login_in.password == "password123":
            pass # allow demo user
        else:
            raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_access_token(user.id, user.email, user.role, user.name)
    log_audit(db, "User", str(user.id), "LOGIN_USER", {"email": user.email, "role": user.role})
    
    return schemas.AuthResponse(
        user_id=user.id,
        name=user.name,
        email=user.email or email_clean,
        role=user.role,
        token=token,
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

# --- DEMO RESET & SEED DATA ENDPOINT ---
@router.post("/demo/reset")
def reset_demo_data(db: Session = Depends(get_db)):
    """
    Resets the database with the exact PRD Section 29 4-Farm Demo Scenario.
    """
    CURRENT_STATE["last_allocation"] = None
    db.query(models.AuditLog).delete()
    db.query(models.Agreement).delete()
    db.query(models.MediationSession).delete()
    db.query(models.Dispute).delete()
    db.query(models.Allocation).delete()
    db.query(models.WaterRequirement).delete()
    db.query(models.Crop).delete()
    db.query(models.Farm).delete()
    db.query(models.WaterSource).delete()
    db.query(models.User).delete()
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
            breakdown=req_calc.dict()
        )
        db.add(water_req)
        db.commit()

        total_demand += req_calc.final_estimated_liters
        created_farms.append(farm)

        farms_optimizer_input.append({
            "id": farm.id,
            "farmer_name": f["name"],
            "crop_name": f["crop"],
            "area_acres": f["area"],
            "growth_stage": f["stage"],
            "required_liters": req_calc.final_estimated_liters,
            "soil_type": f["soil"],
            "is_critical_stage": (f["stage"] == "Flowering")
        })

    # Run OR-Tools Optimization v1
    allocation_v1 = solve_water_allocation(
        farms_data=farms_optimizer_input,
        available_water_liters=180000.0,
        version=1
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

# --- FARMS ENDPOINTS ---
@router.get("/farms", response_model=List[schemas.FarmResponse])
def get_farms(db: Session = Depends(get_db)):
    farms = db.query(models.Farm).all()
    res = []
    for f in farms:
        crop = db.query(models.Crop).filter(models.Crop.farm_id == f.id).first()
        res.append(schemas.FarmResponse(
            id=f.id,
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
def create_farm(farm_in: schemas.FarmCreate, db: Session = Depends(get_db)):
    CURRENT_STATE["last_allocation"] = None
    user = None
    if farm_in.user_id:
        user = db.query(models.User).filter(models.User.id == farm_in.user_id).first()
    if not user:
        user = db.query(models.User).filter(models.User.name == farm_in.farmer_name).first()
    if not user:
        user = models.User(name=farm_in.farmer_name, role="farmer")
        db.add(user)
        db.commit()

    farm = models.Farm(
        user_id=user.id,
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
        breakdown=req_calc.dict()
    )
    db.add(water_req)
    db.commit()

    log_audit(db, "Farm", str(farm.id), "REGISTER_FARM", {"farmer_name": farm_in.farmer_name, "area": farm_in.area_acres})

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
@router.post("/weather")
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
    farms = db.query(models.Farm).all()
    farms_data = []
    for f in farms:
        crop = db.query(models.Crop).filter(models.Crop.farm_id == f.id).first()
        req = db.query(models.WaterRequirement).filter(models.WaterRequirement.farm_id == f.id).order_by(models.WaterRequirement.id.desc()).first()
        req_vol = req.estimated_volume_liters if req else 50000.0
        farms_data.append({
            "id": f.id,
            "farmer_name": f.farmer_name,
            "crop_name": crop.name if crop else "Crop",
            "area_acres": f.area_acres,
            "growth_stage": crop.growth_stage if crop else "Vegetative",
            "required_liters": req_vol,
            "soil_type": f.soil_type,
            "is_critical_stage": f.is_critical_stage
        })

    allocation = solve_water_allocation(farms_data, available_water_liters=CURRENT_STATE["water_source_available"], version=1)
    CURRENT_STATE["last_allocation"] = allocation
    log_audit(db, "Allocation", "v1", "GENERATE_INITIAL_ALLOCATION", {"is_conflict": allocation.is_conflict, "shortage": allocation.shortage_liters})
    return allocation

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

    # Re-run allocation solver with all farms
    farms = db.query(models.Farm).all()
    farms_data = []
    for f in farms:
        crop = db.query(models.Crop).filter(models.Crop.farm_id == f.id).first()
        req = db.query(models.WaterRequirement).filter(models.WaterRequirement.farm_id == f.id).order_by(models.WaterRequirement.id.desc()).first()
        req_vol = req.estimated_volume_liters if req else 50000.0
        farms_data.append({
            "id": f.id,
            "farmer_name": f.farmer_name,
            "crop_name": crop.name if crop else "Crop",
            "area_acres": f.area_acres,
            "growth_stage": crop.growth_stage if crop else "Vegetative",
            "required_liters": req_vol,
            "soil_type": f.soil_type,
            "is_critical_stage": f.is_critical_stage
        })

    last_v = CURRENT_STATE["last_allocation"].version if CURRENT_STATE.get("last_allocation") else 1
    new_v = last_v + 1
    allocation = solve_water_allocation(farms_data, available_water_liters=new_vol, version=new_v)
    CURRENT_STATE["last_allocation"] = allocation

    log_audit(db, "WaterSource", "1", "UPDATE_CANAL_SUPPLY", {
        "new_available_liters": new_vol,
        "new_version": new_v,
        "is_conflict": allocation.is_conflict,
        "shortage": allocation.shortage_liters
    })

    return allocation

# --- MEDIATION & DISPUTE ENDPOINTS ---
@router.post("/mediation/propose", response_model=schemas.MediationProposalResponse)
def propose_mediation(objection: schemas.ObjectionRequest, db: Session = Depends(get_db)):
    current_alloc = CURRENT_STATE["last_allocation"]
    if not current_alloc:
        # Fallback reset if needed
        reset_demo_data(db)
        current_alloc = CURRENT_STATE["last_allocation"]

    proposal = agent_engine.run_mediation_workflow(
        dispute_id=1,
        farmer_name=objection.farmer_name,
        farm_id=objection.farm_id,
        objection_text=objection.objection_reason,
        current_allocation_result=current_alloc,
        requested_additional_liters=objection.requested_additional_liters
    )

    CURRENT_STATE["last_allocation"] = proposal.revised_allocation
    log_audit(db, "Dispute", str(objection.farm_id), "AI_MEDIATION_PROPOSAL", {
        "farmer": objection.farmer_name,
        "objection": objection.objection_reason,
        "validated": proposal.is_validated_by_optimizer
    })
    return proposal

@router.post("/agreements/accept")
def accept_agreement(version: int = 1, farm_id: Optional[int] = None, db: Session = Depends(get_db)):
    agreement = models.Agreement(allocation_version=version, status="Accepted")
    db.add(agreement)
    db.commit()
    log_audit(db, "Agreement", str(farm_id) if farm_id else f"v{version}", "ACCEPT_AGREEMENT", {
        "status": "Accepted",
        "farm_id": farm_id,
        "version": version,
        "accepted_at": datetime.datetime.utcnow().isoformat()
    })
    return {"status": "success", "message": f"Agreement accepted for farm #{farm_id or version}"}

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
