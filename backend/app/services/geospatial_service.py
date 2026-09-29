"""Geospatial distance and proximity calculations.
Evaluates distances between thermal detections, industrial facilities, and residential settlements.
Supports PostGIS spatial indexes and rolling spatial historical baseline analytics.
"""

from datetime import datetime, timedelta
import math
import statistics
from typing import List, Optional, Tuple, Dict, Any
import numpy as np
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.models.models import FireDetection, IndustrialSite, ResidentialArea
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


def get_bounding_box_offsets(lat: float, radius_km: float) -> Tuple[float, float]:
    """Calculate latitude and longitude delta for a bounding box enclosing radius_km."""
    delta_lat = radius_km / 111.0
    cos_lat = math.cos(math.radians(lat))
    delta_lon = radius_km / (111.0 * max(0.1, abs(cos_lat)))
    return delta_lat, delta_lon


def find_nearby_industrial_sites(
    lat: float,
    lon: float,
    db: Session,
    max_range_km: float = 15.0
) -> List[Dict[str, Any]]:
    """Find all industrial facilities within max_range_km using indexed bounding box and distance filtering."""
    delta_lat, delta_lon = get_bounding_box_offsets(lat, max_range_km)

    candidates = db.query(IndustrialSite).filter(
        IndustrialSite.latitude.between(lat - delta_lat, lat + delta_lat),
        IndustrialSite.longitude.between(lon - delta_lon, lon + delta_lon)
    ).all()

    results = []
    for site in candidates:
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
    """Find all residential settlements within max_range_km using indexed bounding box filtering."""
    delta_lat, delta_lon = get_bounding_box_offsets(lat, max_range_km)

    candidates = db.query(ResidentialArea).filter(
        ResidentialArea.latitude.between(lat - delta_lat, lat + delta_lat),
        ResidentialArea.longitude.between(lon - delta_lon, lon + delta_lon)
    ).all()

    results = []
    for area in candidates:
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


def calculate_cluster_density(
    lat: float,
    lon: float,
    db: Session,
    target_time: datetime,
    radius_km: float = 3.0
) -> float:
    """Calculate real fire cluster density in the surrounding area within the past 24 hours.
    Returns normalized density score in [0.0, 1.0].
    """
    cutoff = target_time - timedelta(hours=24)
    delta_lat, delta_lon = get_bounding_box_offsets(lat, radius_km)

    candidates = db.query(FireDetection).filter(
        FireDetection.detection_time >= cutoff,
        FireDetection.detection_time < target_time,
        FireDetection.latitude.between(lat - delta_lat, lat + delta_lat),
        FireDetection.longitude.between(lon - delta_lon, lon + delta_lon)
    ).all()

    count = 0
    for det in candidates:
        if haversine_distance_km(lat, lon, det.latitude, det.longitude) <= radius_km:
            count += 1

    return round(min(1.0, count / 10.0), 3)


def get_spatial_historical_baseline(
    db: Session,
    lat: float,
    lon: float,
    target_time: datetime,
    window_days: int = 30,
    radius_km: float = 5.0
) -> Dict[str, Any]:
    """Calculate rolling spatial historical baseline for an observation at target_time.
    
    CRITICAL INVARIANTS:
    1. Rolling Window: [target_time - window_days, target_time)
    2. Zero Future Data Leakage: strictly < target_time.
    3. Spatially Relevant: only observations within radius_km.
    4. Real Statistics: observation count, active days, median/avg/max/90th percentile FRP.
    5. Insufficient Data: if samples < MIN_HISTORICAL_SAMPLES_REQUIRED, returns insufficient_data=True.
    """
    start_time = target_time - timedelta(days=window_days)
    delta_lat, delta_lon = get_bounding_box_offsets(lat, radius_km)

    # Query historical observations strictly within rolling window before target_time
    candidates = (
        db.query(FireDetection)
        .filter(
            FireDetection.detection_time >= start_time,
            FireDetection.detection_time < target_time,
            FireDetection.latitude.between(lat - delta_lat, lat + delta_lat),
            FireDetection.longitude.between(lon - delta_lon, lon + delta_lon)
        )
        .order_by(desc(FireDetection.detection_time))
        .all()
    )

    # Spatial distance verification
    observations = [
        d for d in candidates
        if haversine_distance_km(lat, lon, d.latitude, d.longitude) <= radius_km
    ]

    obs_count = len(observations)
    active_dates = {d.detection_time.date() for d in observations if d.detection_time}
    active_days_count = len(active_dates)
    frp_vals = [d.frp for d in observations if d.frp is not None and d.frp >= 0.0]

    # Check for insufficient data
    if obs_count < settings.MIN_HISTORICAL_SAMPLES_REQUIRED:
        persistence = round(min(1.0, active_days_count / 15.0), 3) if active_days_count > 0 else 0.0
        return {
            "insufficient_data": True,
            "observation_count": obs_count,
            "active_days": active_days_count,
            "window_days": window_days,
            "radius_km": radius_km,
            "median_frp": round(statistics.median(frp_vals), 1) if frp_vals else 0.0,
            "avg_frp": round(sum(frp_vals) / len(frp_vals), 1) if frp_vals else 0.0,
            "max_frp": round(max(frp_vals), 1) if frp_vals else 0.0,
            "percentile_90_frp": round(float(np.percentile(frp_vals, 90)), 1) if frp_vals else 0.0,
            "persistence_score": persistence,
            "window_start": start_time.isoformat(),
            "window_end": target_time.isoformat(),
            "message": "Insufficient historical observations in rolling window for full statistical baseline"
        }

    # Robust baseline calculations
    med_frp = round(statistics.median(frp_vals), 1) if frp_vals else 0.0
    avg_frp = round(sum(frp_vals) / len(frp_vals), 1) if frp_vals else 0.0
    max_frp = round(max(frp_vals), 1) if frp_vals else 0.0
    p90_frp = round(float(np.percentile(frp_vals, 90)), 1) if frp_vals else 0.0
    # Deterministic persistence score: recurring on >=15 days in 30 days = 1.0 (continuous flare/furnace)
    persistence_score = round(min(1.0, active_days_count / 15.0), 3)

    return {
        "insufficient_data": False,
        "observation_count": obs_count,
        "active_days": active_days_count,
        "window_days": window_days,
        "radius_km": radius_km,
        "median_frp": med_frp,
        "avg_frp": avg_frp,
        "max_frp": max_frp,
        "percentile_90_frp": p90_frp,
        "persistence_score": persistence_score,
        "window_start": start_time.isoformat(),
        "window_end": target_time.isoformat(),
        "message": "Historical baseline computed from real observations"
    }

