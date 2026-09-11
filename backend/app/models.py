import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    role = Column(String, default="farmer") # farmer or admin
    contact = Column(String, nullable=True)
    language = Column(String, default="en") # en, hi, mr

    farms = relationship("Farm", back_populates="owner")

class Farm(Base):
    __tablename__ = "farms"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    farmer_name = Column(String, nullable=False)
    location = Column(String, default="Pune Region, MH")
    latitude = Column(Float, default=18.5204)
    longitude = Column(Float, default=73.8567)
    area_acres = Column(Float, nullable=False)
    soil_type = Column(String, default="Clay") # Clay, Loam, Sandy, Black
    irrigation_efficiency = Column(Float, default=0.75) # 0.5 to 0.95
    is_critical_stage = Column(Boolean, default=False)
    emergency_priority = Column(Boolean, default=False)

    owner = relationship("User", back_populates="farms")
    crops = relationship("Crop", back_populates="farm", cascade="all, delete-orphan")
    requirements = relationship("WaterRequirement", back_populates="farm", cascade="all, delete-orphan")
    allocations = relationship("Allocation", back_populates="farm", cascade="all, delete-orphan")
    disputes = relationship("Dispute", back_populates="farm", cascade="all, delete-orphan")

class Crop(Base):
    __tablename__ = "crops"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)
    name = Column(String, nullable=False) # Wheat, Tomato, Sugarcane, Onion, Cotton, Rice
    growth_stage = Column(String, nullable=False) # Vegetative, Flowering, Fruit Development, Bulb Development, Harvesting
    criticality_score = Column(Float, default=1.0) # 1.0 to 2.0

    farm = relationship("Farm", back_populates="crops")

class IrrigationHistory(Base):
    __tablename__ = "irrigation_history"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)
    amount_liters = Column(Float, nullable=False)
    date = Column(DateTime, default=datetime.datetime.utcnow)

class WeatherRecord(Base):
    __tablename__ = "weather_records"

    id = Column(Integer, primary_key=True, index=True)
    location = Column(String, nullable=False)
    temperature_c = Column(Float, default=32.0)
    rainfall_mm = Column(Float, default=0.0)
    forecast_rainfall_mm = Column(Float, default=2.0)
    condition = Column(String, default="Warm & Dry")
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class WaterSource(Base):
    __tablename__ = "water_sources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, default="Panchayat Shared Canal #1")
    total_capacity_liters = Column(Float, default=300000.0)
    available_volume_liters = Column(Float, default=180000.0)
    date = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String, default="Scarce") # Normal, Scarce, Emergency

    allocations = relationship("Allocation", back_populates="water_source")

class WaterRequirement(Base):
    __tablename__ = "water_requirements"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)
    estimated_volume_liters = Column(Float, nullable=False)
    breakdown = Column(JSON, nullable=True) # store factors
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    farm = relationship("Farm", back_populates="requirements")

class Allocation(Base):
    __tablename__ = "allocations"

    id = Column(Integer, primary_key=True, index=True)
    water_source_id = Column(Integer, ForeignKey("water_sources.id"), nullable=False)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)
    allocated_volume_liters = Column(Float, nullable=False)
    schedule_start = Column(String, nullable=True)
    schedule_end = Column(String, nullable=True)
    version = Column(Integer, default=1)
    fairness_score = Column(Float, default=80.0)
    reasoning = Column(Text, nullable=True)

    water_source = relationship("WaterSource", back_populates="allocations")
    farm = relationship("Farm", back_populates="allocations")

class Dispute(Base):
    __tablename__ = "disputes"

    id = Column(Integer, primary_key=True, index=True)
    allocation_id = Column(Integer, ForeignKey("allocations.id"), nullable=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)
    objection_text = Column(Text, nullable=False)
    requested_additional_liters = Column(Float, default=8000.0)
    status = Column(String, default="Open") # Open, Mediating, Resolved, Rejected
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    farm = relationship("Farm", back_populates="disputes")
    mediation_sessions = relationship("MediationSession", back_populates="dispute")

class MediationSession(Base):
    __tablename__ = "mediation_sessions"

    id = Column(Integer, primary_key=True, index=True)
    dispute_id = Column(Integer, ForeignKey("disputes.id"), nullable=False)
    proposal_text = Column(Text, nullable=False)
    proposal_json = Column(JSON, nullable=True)
    result_status = Column(String, default="Pending") # Pending, Validated, Accepted, Rejected
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    dispute = relationship("Dispute", back_populates="mediation_sessions")

class Agreement(Base):
    __tablename__ = "agreements"

    id = Column(Integer, primary_key=True, index=True)
    allocation_version = Column(Integer, default=1)
    status = Column(String, default="Accepted") # Pending, Accepted
    accepted_at = Column(DateTime, default=datetime.datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String, nullable=False) # Allocation, Dispute, Mediation, Agreement
    entity_id = Column(String, nullable=False)
    action = Column(String, nullable=False)
    details = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
