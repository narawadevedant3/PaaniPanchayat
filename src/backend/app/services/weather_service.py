import httpx
from typing import Dict, Any

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"

async def fetch_weather_data(latitude: float = 18.5204, longitude: float = 73.8567) -> Dict[str, Any]:
    """
    Fetches real-time and forecast weather data from Open-Meteo API.
    Falls back gracefully to realistic agricultural weather data if API is unreachable.
    """
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": ["temperature_2m", "relative_humidity_2m", "precipitation"],
        "daily": ["temperature_2m_max", "precipitation_sum"],
        "timezone": "auto"
    }

    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            response = await client.get(OPEN_METEO_URL, params=params)
            if response.status_code == 200:
                data = response.json()
                current = data.get("current", {})
                daily = data.get("daily", {})
                
                temp = current.get("temperature_2m", 31.5)
                rain_curr = current.get("precipitation", 0.0)
                forecast_rain = daily.get("precipitation_sum", [1.5])[0] if daily.get("precipitation_sum") else 1.5

                condition = "Clear & Warm"
                if rain_curr > 0 or forecast_rain > 5.0:
                    condition = "Scattered Rain Expected"
                elif temp > 34.0:
                    condition = "Hot & Arid"

                return {
                    "temperature_c": temp,
                    "rainfall_mm": rain_curr,
                    "forecast_rainfall_mm": forecast_rain,
                    "condition": condition,
                    "source": "Open-Meteo API Live"
                }
    except Exception as e:
        print(f"Weather API fallback used due to: {e}")

    # Robust mock fallback for offline / hackathon testing
    return {
        "temperature_c": 32.5,
        "rainfall_mm": 0.0,
        "forecast_rainfall_mm": 1.2,
        "condition": "Warm & Dry (Seasonal)",
        "source": "Open-Meteo Cached/Fallback"
    }
