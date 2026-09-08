from datetime import datetime, timedelta
from typing import Optional, Any
from app.services.geospatial import (
    haversine_distance_meters, is_point_in_polygon,
    distance_to_polygon_meters, infer_land_context, estimate_settlement_distance_meters
)

def extract_features(
    anomaly: Any,
    assets: list[Any],
    historical_observations: list[Any]
) -> dict[str, Any]:
    """
    Extract dynamic thermal, spatial, and temporal features for an anomaly.
    No hardcoded scores. Everything is computed from underlying observations.
    """
    lat = anomaly.latitude
    lon = anomaly.longitude
    frp = float(anomaly.frp)
    daynight = anomaly.daynight or "N"
    ts = anomaly.timestamp or datetime.utcnow()

    # 1. Spatial Features: Find nearest industrial asset
    nearest_asset = None
    min_dist_m = float("inf")
    is_inside_boundary = False
    dist_to_boundary_m = None

    for asset in assets:
        d = haversine_distance_meters(lat, lon, asset.latitude, asset.longitude)
        if d < min_dist_m:
            min_dist_m = d
            nearest_asset = asset

    if nearest_asset and nearest_asset.boundary_geojson:
        is_inside_boundary = is_point_in_polygon(lat, lon, nearest_asset.boundary_geojson)
        dist_to_boundary_m = distance_to_polygon_meters(lat, lon, nearest_asset.boundary_geojson)
    elif nearest_asset:
        # Fallback radius comparison if polygon missing
        is_inside_boundary = min_dist_m <= nearest_asset.radius_meters
        dist_to_boundary_m = max(0.0, min_dist_m - nearest_asset.radius_meters)

    asset_category = nearest_asset.category if nearest_asset else "Unknown"
    asset_criticality = nearest_asset.criticality_level if nearest_asset else "LOW"
    land_context = infer_land_context(lat, lon, min_dist_m)
    settlement_dist_m = estimate_settlement_distance_meters(lat, lon)

    # 2. Temporal Features: Observations in spatial proximity (< 5 km)
    spatial_window_m = 5000.0
    relevant_history = []
    for obs in historical_observations:
        obs_dist = haversine_distance_meters(lat, lon, obs.latitude, obs.longitude)
        if obs_dist <= spatial_window_m:
            relevant_history.append(obs)

    count_24h = sum(1 for o in relevant_history if ts - o.timestamp <= timedelta(days=1))
    count_7d = sum(1 for o in relevant_history if ts - o.timestamp <= timedelta(days=7))
    count_30d = len(relevant_history)

    night_count = sum(1 for o in relevant_history if getattr(o, 'daynight', 'N') == 'N')
    night_ratio = (night_count / len(relevant_history)) if relevant_history else (1.0 if daynight == 'N' else 0.0)

    # Baseline calculations
    has_sufficient_history = len(relevant_history) >= 3
    historical_median = None
    baseline_deviation_percent = None

    if has_sufficient_history:
        frp_vals = sorted([float(o.frp) for o in relevant_history])
        mid = len(frp_vals) // 2
        historical_median = (frp_vals[mid] if len(frp_vals) % 2 != 0 else (frp_vals[mid - 1] + frp_vals[mid]) / 2.0)
        if historical_median > 0:
            baseline_deviation_percent = round(((frp - historical_median) / historical_median) * 100.0, 1)

    return {
        # Thermal
        "frp": frp,
        "brightness": float(anomaly.brightness) if anomaly.brightness else 320.0,
        "is_night": 1 if daynight == "N" else 0,
        "satellite": anomaly.satellite or "VIIRS-NOAA21",
        # Spatial
        "distance_to_nearest_asset_m": round(min_dist_m, 1),
        "is_inside_boundary": 1 if is_inside_boundary else 0,
        "distance_to_boundary_m": round(dist_to_boundary_m, 1) if dist_to_boundary_m is not None else round(min_dist_m, 1),
        "nearest_asset_name": nearest_asset.name if nearest_asset else "No mapped asset nearby",
        "nearest_asset_id": nearest_asset.asset_id if nearest_asset else None,
        "asset_category": asset_category,
        "asset_criticality": asset_criticality,
        "land_context": land_context,
        "settlement_distance_m": round(settlement_dist_m, 1),
        # Temporal
        "count_24h": count_24h,
        "count_7d": count_7d,
        "count_30d": count_30d,
        "night_ratio": round(night_ratio, 2),
        "has_sufficient_history": has_sufficient_history,
        "historical_median_frp": round(historical_median, 1) if historical_median is not None else None,
        "baseline_deviation_percent": baseline_deviation_percent,
    }
