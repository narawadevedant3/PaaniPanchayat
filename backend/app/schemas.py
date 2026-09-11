from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import datetime

# User Schemas
class UserBase(BaseModel):
    name: str
    email: Optional[str] = None
    role: str = "farmer"
    contact: Optional[str] = None
    language: str = "en"

class UserCreate(UserBase):
    pass

class UserRegister(BaseModel):
    name: str
    email: str
    password: str
    role: str = "farmer" # farmer or admin
    contact: Optional[str] = None
    language: str = "en"

class UserLogin(BaseModel):
    email: str
    password: str

class AuthResponse(BaseModel):
    user_id: int
    name: str
    email: str
    role: str
    token: str
    message: str

class UserResponse(UserBase):
    id: int

    class Config:
        from_attributes = True

# Farm Schemas
class FarmCreate(BaseModel):
    farmer_name: str
    location: str = "Pune Region, MH"
    latitude: float = 18.5204
    longitude: float = 73.8567
    area_acres: float
    soil_type: str = "Clay" # Clay, Loam, Sandy, Black
    irrigation_efficiency: float = 0.75
    crop_name: str
    growth_stage: str
    criticality_score: float = 1.0
    previous_irrigation_liters: float = 0.0
    is_critical_stage: bool = False
    emergency_priority: bool = False

class FarmResponse(BaseModel):
    id: int
    farmer_name: str
    location: str
    latitude: float
    longitude: float
    area_acres: float
    soil_type: str
    irrigation_efficiency: float
    is_critical_stage: bool
    emergency_priority: bool
    crop_name: Optional[str] = None
    growth_stage: Optional[str] = None
    criticality_score: Optional[float] = 1.0

    class Config:
        from_attributes = True

# Requirement Intelligence Schemas
class WaterRequirementCalculationRequest(BaseModel):
    farm_id: Optional[int] = None
    crop_name: str = "Wheat"
    area_acres: float = 2.0
    growth_stage: str = "Flowering"
    soil_type: str = "Clay"
    irrigation_efficiency: float = 0.75
    temperature_c: float = 32.0
    rainfall_mm: float = 0.0
    forecast_rainfall_mm: float = 2.0
    previous_irrigation_liters: float = 10000.0

class RequirementBreakdown(BaseModel):
    base_requirement_liters: float
    growth_stage_adjustment_pct: float
    weather_adjustment_pct: float
    soil_factor_adjustment_pct: float
    forecast_rainfall_deduction_liters: float
    previous_irrigation_deduction_liters: float
    final_estimated_liters: float
    explanation: List[str]

class WaterRequirementResponse(BaseModel):
    farm_id: Optional[int]
    estimated_volume_liters: float
    breakdown: RequirementBreakdown

# Optimization & Allocation Schemas
class AllocationItem(BaseModel):
    farm_id: int
    farmer_name: str
    crop_name: str
    area_acres: float
    growth_stage: str
    required_liters: float
    allocated_liters: float
    unmet_liters: float
    fairness_score: float
    schedule_start: str
    schedule_end: str
    reasoning: List[str]

class AllocationResult(BaseModel):
    water_source_id: int
    water_source_name: str
    available_volume_liters: float
    total_demand_liters: float
    shortage_liters: float
    is_conflict: bool
    version: int
    allocations: List[AllocationItem]
    overall_fairness_score: float
    optimization_status: str

# Dispute & Mediation Schemas
class ObjectionRequest(BaseModel):
    allocation_id: int
    farm_id: int
    farmer_name: str
    objection_reason: str # e.g. "My crop is at critical flowering stage, I need 8000L more"
    requested_additional_liters: float = 8000.0

class MediationProposalResponse(BaseModel):
    dispute_id: int
    farmer_name: str
    objection_summary: str
    ai_mediation_analysis: str
    proposed_reallocation_text: str
    revised_allocation: AllocationResult
    is_validated_by_optimizer: bool
    status: str

# Audit Log Schemas
class AuditLogResponse(BaseModel):
    id: int
    entity_type: str
    entity_id: str
    action: str
    details: Any
    timestamp: datetime.datetime

    class Config:
        from_attributes = True

class AgreementResponse(BaseModel):
    id: int
    allocation_version: int
    status: str
    accepted_at: datetime.datetime
