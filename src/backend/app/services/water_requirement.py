from typing import Dict, Any, List
from app.schemas import RequirementBreakdown

# Base reference water demand per acre (Liters) for standard 10-14 day irrigation cycle
CROP_BASE_DEMAND = {
    "Wheat": 36000.0,
    "Tomato": 38000.0,
    "Sugarcane": 27000.0,
    "Onion": 37000.0,
    "Cotton": 35000.0,
    "Rice": 48000.0,
    "Default": 35000.0
}

# Growth stage multipliers
STAGE_MULTIPLIERS = {
    "Flowering": 1.18,
    "Fruit Development": 1.15,
    "Bulb Development": 1.12,
    "Pod Formation": 1.15,
    "Grain Filling": 1.15,
    "Vegetative": 1.00,
    "Initial / Germination": 0.85,
    "Maturity / Harvest": 0.75
}

# Soil type water retention factors
SOIL_FACTORS = {
    "Clay": 0.92,       # High water retention, lower irrigation needed
    "Black": 0.90,      # Excellent retention (Regur soil)
    "Loam": 1.00,       # Ideal baseline retention
    "Sandy": 1.18       # Low retention, fast percolation
}

def calculate_water_requirement(
    crop_name: str,
    area_acres: float,
    growth_stage: str,
    soil_type: str,
    irrigation_efficiency: float = 0.75,
    temperature_c: float = 32.0,
    rainfall_mm: float = 0.0,
    forecast_rainfall_mm: float = 0.0,
    previous_irrigation_liters: float = 0.0
) -> RequirementBreakdown:
    
    # 1. Base Crop Requirement
    base_per_acre = CROP_BASE_DEMAND.get(crop_name, CROP_BASE_DEMAND["Default"])
    raw_base = base_per_acre * area_acres

    # 2. Growth Stage Factor
    stage_factor = STAGE_MULTIPLIERS.get(growth_stage, 1.0)
    stage_adj_pct = (stage_factor - 1.0) * 100.0

    # 3. Weather Factor (Evapotranspiration stress)
    if temperature_c > 35.0:
        weather_factor = 1.10
    elif temperature_c >= 30.0:
        weather_factor = 1.05
    elif temperature_c < 22.0:
        weather_factor = 0.92
    else:
        weather_factor = 1.00
    weather_adj_pct = (weather_factor - 1.0) * 100.0

    # 4. Soil Factor
    soil_factor = SOIL_FACTORS.get(soil_type, 1.0)
    soil_adj_pct = (soil_factor - 1.0) * 100.0

    # 5. Irrigation Efficiency Adjustment (e.g. drip 85% vs flood 60%)
    eff = max(min(irrigation_efficiency, 0.95), 0.50)
    eff_multiplier = 0.75 / eff # normalized to 75% standard baseline

    # Intermediate requirement before rain & previous irrigation credit
    subtotal = raw_base * stage_factor * weather_factor * soil_factor * eff_multiplier

    # 6. Rainfall deductions (1 mm rain per acre = 4,046.86 Liters of water)
    # Effective rainfall factor ~70% usable by crop
    usable_rain_mm = (rainfall_mm + forecast_rainfall_mm * 0.8)
    forecast_rain_deduction = usable_rain_mm * 4046.86 * area_acres * 0.7

    # 7. Previous irrigation credit (decay factor for recent watering)
    prev_irrigation_credit = previous_irrigation_liters * 0.35

    min_floor = max(area_acres * 5000.0, 5000.0)
    final_requirement = max(subtotal - forecast_rain_deduction - prev_irrigation_credit, min_floor)

    explanations = [
        f"🌱 Base crop demand for {area_acres} acres of {crop_name}: {raw_base:,.0f} L.",
        f"🌿 Growth stage '{growth_stage}' adjustment: {stage_adj_pct:+.1f}% factor ({stage_factor:.2f}x).",
        f"🌡️ Weather stress at {temperature_c}°C: {weather_adj_pct:+.1f}% evapotranspiration adjustment.",
        f"🪨 Soil type '{soil_type}' retention factor: {soil_adj_pct:+.1f}% requirement adjustment.",
        f"⚙️ Irrigation efficiency ({eff*100:.0f}%): multiplier {eff_multiplier:.2f}x."
    ]

    if forecast_rain_deduction > 0:
        explanations.append(f"🌧️ Rain forecast deduction: -{forecast_rain_deduction:,.0f} L based on rain expected.")
    
    if prev_irrigation_credit > 0:
        explanations.append(f"💧 Previous irrigation credit: -{prev_irrigation_credit:,.0f} L credited.")

    explanations.append(f"✅ Final Estimated Irrigation Requirement: {final_requirement:,.0f} L.")

    return RequirementBreakdown(
        base_requirement_liters=round(raw_base, 2),
        growth_stage_adjustment_pct=round(stage_adj_pct, 1),
        weather_adjustment_pct=round(weather_adj_pct, 1),
        soil_factor_adjustment_pct=round(soil_adj_pct, 1),
        forecast_rainfall_deduction_liters=round(forecast_rain_deduction, 2),
        previous_irrigation_deduction_liters=round(prev_irrigation_credit, 2),
        final_estimated_liters=round(final_requirement, 2),
        explanation=explanations
    )
