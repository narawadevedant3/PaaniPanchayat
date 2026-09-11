export type Language = 'en' | 'hi' | 'mr';

export type UserRole = 'farmer' | 'admin';

export interface AuthUser {
  user_id: number;
  name: string;
  email: string;
  role: UserRole;
  token: string;
  contact?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  contact?: string;
  language?: Language;
}

export interface Farm {
  id: number;
  user_id?: number;
  user_email?: string;
  farmer_name: string;
  location: string;
  latitude: number;
  longitude: number;
  area_acres: number;
  soil_type: string;
  irrigation_efficiency: number;
  is_critical_stage: boolean;
  emergency_priority: boolean;
  crop_name?: string;
  growth_stage?: string;
  criticality_score?: number;
}

export interface RequirementBreakdown {
  base_requirement_liters: number;
  growth_stage_adjustment_pct: number;
  weather_adjustment_pct: number;
  soil_factor_adjustment_pct: number;
  forecast_rainfall_deduction_liters: number;
  previous_irrigation_deduction_liters: number;
  final_estimated_liters: number;
  explanation: string[];
}

export interface WaterRequirementResponse {
  farm_id?: number;
  estimated_volume_liters: number;
  breakdown: RequirementBreakdown;
}

export interface AllocationItem {
  farm_id: number;
  user_id?: number;
  user_email?: string;
  farmer_name: string;
  crop_name: string;
  area_acres: number;
  growth_stage: string;
  required_liters: number;
  allocated_liters: number;
  unmet_liters: number;
  fairness_score: number;
  schedule_start: string;
  schedule_end: string;
  reasoning: string[];
}

export interface AllocationResult {
  water_source_id: number;
  water_source_name: string;
  available_volume_liters: number;
  total_demand_liters: number;
  shortage_liters: number;
  is_conflict: boolean;
  version: number;
  allocations: AllocationItem[];
  overall_fairness_score: number;
  optimization_status: string;
  cycle_number?: number;
  is_accepted?: boolean;
}

export interface WaterCycleResponse {
  cycle_number: number;
  message: string;
  available_volume_liters: number;
  allocation: AllocationResult;
}

export interface MediationProposalResponse {
  dispute_id: number;
  farmer_name: string;
  objection_summary: string;
  ai_mediation_analysis: string;
  proposed_reallocation_text: string;
  revised_allocation: AllocationResult;
  is_validated_by_optimizer: boolean;
  status: string;
}

export interface AuditLogItem {
  id: number;
  entity_type: string;
  entity_id: string;
  action: string;
  details: Record<string, unknown> | string | number | boolean | null;
  timestamp: string;
}

export interface FarmFormData {
  farmer_name: string;
  crop_name: string;
  area_acres: number;
  growth_stage: string;
  soil_type: string;
  irrigation_efficiency: number;
  previous_irrigation_liters: number;
  is_critical_stage: boolean;
  emergency_priority?: boolean;
}

export interface WeatherData {
  temperature_c: number;
  rainfall_mm: number;
  forecast_rainfall_mm: number;
  condition: string;
  source: string;
}
