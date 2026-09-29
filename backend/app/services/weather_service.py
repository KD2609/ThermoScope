"""Weather Context and Wind Correlation Service.
Retrieves real ambient atmospheric observations from Open-Meteo with local DB caching,
and computes observed fire movement vs wind direction correlation without claiming unverified causal spread.
"""

from datetime import datetime, timezone, timedelta
import math
from typing import Dict, Any, Optional
import httpx
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.models.models import WeatherCache


def degrees_to_cardinal(deg: Optional[float]) -> Optional[str]:
    """Convert wind direction azimuth (0-360 degrees) to standard 16-point cardinal compass string."""
    if deg is None:
        return None
    val = int((deg / 22.5) + 0.5)
    directions = [
        "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
        "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"
    ]
    return directions[val % 16]


def get_weather_context(lat: float, lon: float, db: Session) -> Dict[str, Any]:
    """Retrieve real weather data for geographic coordinates.
    Checks DB cache within 1 hour and 5 km. If not cached, fetches from Open-Meteo.
    """
    now = datetime.now(timezone.utc)
    cache_cutoff = now - timedelta(hours=1)

    # Check local database cache within 0.05 deg (~5.5 km) and last 60 minutes
    cached = (
        db.query(WeatherCache)
        .filter(
            WeatherCache.fetched_at >= cache_cutoff,
            WeatherCache.latitude.between(lat - 0.05, lat + 0.05),
            WeatherCache.longitude.between(lon - 0.05, lon + 0.05)
        )
        .order_by(desc(WeatherCache.fetched_at))
        .first()
    )

    if cached:
        return {
            "latitude": lat,
            "longitude": lon,
            "temperature": cached.temperature,
            "relative_humidity": cached.relative_humidity,
            "wind_speed": cached.wind_speed,
            "wind_direction": cached.wind_direction,
            "wind_direction_cardinal": degrees_to_cardinal(cached.wind_direction),
            "precipitation": cached.precipitation,
            "weather_source": cached.weather_source,
            "fetched_at": cached.fetched_at.isoformat() if cached.fetched_at else now.isoformat(),
            "cached": True
        }

    # Fetch live weather from Open-Meteo (open access, no API key required)
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": round(lat, 4),
        "longitude": round(lon, 4),
        "current": "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,wind_direction_10m"
    }

    temp = None
    humidity = None
    wind_spd = None
    wind_dir = None
    precip = None
    source = "Open-Meteo (Live)"

    try:
        with httpx.Client(timeout=4.0) as client:
            resp = client.get(url, params=params)
            if resp.status_code == 200:
                data = resp.json()
                current = data.get("current", {})
                temp = current.get("temperature_2m")
                humidity = current.get("relative_humidity_2m")
                wind_spd = current.get("wind_speed_10m")
                wind_dir = current.get("wind_direction_10m")
                precip = current.get("precipitation")
            else:
                source = "Open-Meteo (Unavailable)"
    except Exception as e:
        source = f"Open-Meteo (Offline: {type(e).__name__})"

    # If live fetch succeeded, cache in DB
    if temp is not None:
        try:
            entry = WeatherCache(
                latitude=lat,
                longitude=lon,
                temperature=temp,
                relative_humidity=humidity,
                wind_speed=wind_spd,
                wind_direction=wind_dir,
                precipitation=precip,
                weather_source="Open-Meteo",
                fetched_at=now
            )
            db.add(entry)
            db.commit()
        except Exception:
            db.rollback()

    return {
        "latitude": lat,
        "longitude": lon,
        "temperature": temp,
        "relative_humidity": humidity,
        "wind_speed": wind_spd,
        "wind_direction": wind_dir,
        "wind_direction_cardinal": degrees_to_cardinal(wind_dir),
        "precipitation": precip,
        "weather_source": source,
        "fetched_at": now.isoformat(),
        "cached": False
    }


def correlate_movement_and_wind(
    movement_bearing_deg: Optional[float],
    wind_direction_deg: Optional[float],
    wind_speed_kmh: Optional[float]
) -> Dict[str, Any]:
    """Compare observed fire displacement vector against ambient wind vector.
    Labels alignment as ALIGNED, PARTIALLY_ALIGNED, NOT_ALIGNED, or INSUFFICIENT_DATA.
    Explicitly labels this as observed correlation without claiming causal spread.
    """
    if movement_bearing_deg is None or wind_direction_deg is None or wind_speed_kmh is None:
        return {
            "alignment_status": "INSUFFICIENT_DATA",
            "angular_difference_deg": None,
            "wind_speed_kmh": wind_speed_kmh,
            "correlation_summary": "Insufficient trajectory or weather telemetry to assess movement-wind correlation."
        }

    # Wind direction convention: direction the wind is blowing FROM.
    # Therefore, downwind direction = (wind_direction_deg + 180) % 360
    downwind_dir = (wind_direction_deg + 180.0) % 360.0

    # Angular difference between fire movement heading and downwind heading
    diff = abs(movement_bearing_deg - downwind_dir) % 360.0
    if diff > 180.0:
        diff = 360.0 - diff
    diff = round(diff, 1)

    if diff <= 45.0:
        status = "ALIGNED"
        summary = (
            f"Observed activity movement heading ({round(movement_bearing_deg, 1)}°) is aligned within {diff}° "
            f"of downwind direction ({round(downwind_dir, 1)}°, wind blowing from {degrees_to_cardinal(wind_direction_deg)} at {wind_speed_kmh} km/h). "
            f"Consistent with wind-driven particulate or smoke plume orientation."
        )
    elif diff <= 90.0:
        status = "PARTIALLY_ALIGNED"
        summary = (
            f"Observed activity movement heading ({round(movement_bearing_deg, 1)}°) is partially aligned ({diff}° offset) "
            f"with ambient wind vector ({degrees_to_cardinal(wind_direction_deg)} at {wind_speed_kmh} km/h)."
        )
    else:
        status = "NOT_ALIGNED"
        summary = (
            f"Observed activity movement heading ({round(movement_bearing_deg, 1)}°) is not aligned ({diff}° offset) "
            f"with prevailing wind direction ({degrees_to_cardinal(wind_direction_deg)} at {wind_speed_kmh} km/h). "
            f"Indicates localized industrial process relocation or multi-point ignition rather than downwind fire propagation."
        )

    return {
        "alignment_status": status,
        "angular_difference_deg": diff,
        "wind_speed_kmh": wind_speed_kmh,
        "downwind_bearing_deg": round(downwind_dir, 1),
        "correlation_summary": summary,
        "disclaimer": "Observed correlation only. Does not assert proven causal flame front propagation."
    }
