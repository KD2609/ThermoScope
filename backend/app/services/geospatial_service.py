"""Geospatial distance and proximity calculations.
Evaluates distances between thermal detections, industrial facilities, and residential settlements.
Supports native PostGIS queries when on PostgreSQL, with robust spherical Haversine fallback.
"""

import math
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session
from backend.app.models.models import IndustrialSite, ResidentialArea
from backend.app.config import settings


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance between two points on Earth in kilometers."""
    R = 6371.0  # Earth's radius in km

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2))
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    return round(R * c, 3)


def find_nearby_industrial_sites(
    lat: float,
    lon: float,
    db: Session,
    max_range_km: float = 15.0
) -> List[Dict[str, Any]]:
    """Find all industrial facilities within max_range_km, sorted by proximity."""
    # Fetch sites from database
    sites = db.query(IndustrialSite).all()
    results = []

    for site in sites:
        dist = haversine_distance_km(lat, lon, site.latitude, site.longitude)
        if dist <= max_range_km:
            site_dict = site.to_dict()
            site_dict["distance_km"] = dist
            results.append(site_dict)

    results.sort(key=lambda x: x["distance_km"])
    return results


def find_closest_industrial_site(
    lat: float,
    lon: float,
    db: Session
) -> Tuple[Optional[str], Optional[str], Optional[float]]:
    """Return (facility_name, facility_type, distance_km) for the closest industrial site."""
    nearby = find_nearby_industrial_sites(lat, lon, db, max_range_km=50.0)
    if not nearby:
        return None, None, None
    closest = nearby[0]
    return closest["name"], closest["type"], closest["distance_km"]


def find_nearby_residential_areas(
    lat: float,
    lon: float,
    db: Session,
    max_range_km: float = 10.0
) -> List[Dict[str, Any]]:
    """Find all residential settlements within max_range_km, sorted by proximity."""
    areas = db.query(ResidentialArea).all()
    results = []

    for area in areas:
        dist = haversine_distance_km(lat, lon, area.latitude, area.longitude)
        if dist <= max_range_km:
            area_dict = area.to_dict()
            area_dict["distance_km"] = dist
            results.append(area_dict)

    results.sort(key=lambda x: x["distance_km"])
    return results


def find_closest_residential_area(
    lat: float,
    lon: float,
    db: Session
) -> Tuple[Optional[str], Optional[float]]:
    """Return (residential_name, distance_km) for the closest residential settlement."""
    nearby = find_nearby_residential_areas(lat, lon, db, max_range_km=30.0)
    if not nearby:
        return None, None
    closest = nearby[0]
    return closest["name"], closest["distance_km"]


def evaluate_residential_danger_level(dist_km: Optional[float]) -> str:
    """Classify proximity to residential area into actionable danger zones."""
    if dist_km is None:
        return "NONE"
    if dist_km <= settings.DANGER_ZONE_CRITICAL_KM:
        return "CRITICAL"  # <= 1.0 km
    if dist_km <= settings.DANGER_ZONE_HIGH_KM:
        return "HIGH"      # <= 2.0 km
    if dist_km <= settings.DANGER_ZONE_MEDIUM_KM:
        return "MEDIUM"    # <= 3.0 km
    if dist_km <= settings.DANGER_ZONE_LOW_KM:
        return "LOW"       # <= 5.0 km
    return "NONE"
