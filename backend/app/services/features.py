from datetime import datetime, timedelta
from typing import Optional, Any
import math
from app.services.geospatial import (
    haversine_distance_meters, is_point_in_polygon,
    distance_to_polygon_meters, count_assets_within_radius_meters,
    infer_land_context, estimate_settlement_distance_meters
)

# Formal feature group definitions for model training and ablation studies
FEATURE_COLUMNS_BASELINE = [
    "frp",
    "distance_to_nearest_asset_m",
]

FEATURE_COLUMNS_THERMAL = FEATURE_COLUMNS_BASELINE + [
    "log_frp",
    "brightness",
    "brightness_norm",
    "frp_to_brightness_ratio",
    "frp_intensity_bucket",
    "is_night",
    "frp_night_interaction",
]

FEATURE_COLUMNS_SPATIAL = FEATURE_COLUMNS_THERMAL + [
    "distance_to_boundary_m",
    "is_inside_boundary",
    "asset_cat_code",
    "asset_crit_code",
    "asset_density_5km",
    "asset_density_10km",
    "nearest_asset_is_mining",
    "nearest_asset_is_flaring_type",
    "land_code",
    "settlement_distance_m",
]

FEATURE_COLUMNS_TEMPORAL = FEATURE_COLUMNS_SPATIAL + [
    "count_24h",
    "count_7d",
    "count_30d",
    "distinct_active_days_30d",
    "recurrence_freq_per_week",
    "night_ratio",
    "has_sufficient_history_flag",
    "historical_median_frp_val",
    "baseline_deviation_val",
    "recent_vs_hist_ratio",
]

FEATURE_COLUMNS_ALL = FEATURE_COLUMNS_TEMPORAL + [
    "high_frp_inside_boundary",
    "high_frp_high_abnormality",
    "industrial_proximity_and_persistence",
    "flare_candidate_interaction",
    "forest_isolated_interaction",
    "agri_remote_interaction",
]

FEATURE_GROUPS = {
    "group1_baseline": FEATURE_COLUMNS_BASELINE,
    "group2_thermal": FEATURE_COLUMNS_THERMAL,
    "group3_spatial": FEATURE_COLUMNS_SPATIAL,
    "group4_temporal": FEATURE_COLUMNS_TEMPORAL,
    "group5_interactions": FEATURE_COLUMNS_ALL,
}

def extract_features(
    anomaly: Any,
    assets: list[Any],
    historical_observations: list[Any]
) -> dict[str, Any]:
    """
    Extract dynamic thermal, spatial, and temporal features for an anomaly.
    Enforces strict temporal ordering: only observations occurring at or before
    the anomaly timestamp are considered (prevents future data leakage).
    """
    lat = anomaly.latitude
    lon = anomaly.longitude
    frp = float(anomaly.frp)
    brightness = float(anomaly.brightness) if anomaly.brightness else 320.0
    daynight = anomaly.daynight or "N"
    is_night = 1 if daynight == "N" else 0
    ts = anomaly.timestamp or datetime.utcnow()

    # 1. Thermal Features
    log_frp = round(math.log1p(max(0.0, frp)), 3)
    brightness_norm = round((brightness - 300.0) / 100.0, 3)
    frp_to_brightness_ratio = round(frp / max(1.0, brightness), 4)
    if frp < 25.0:
        frp_intensity_bucket = 0
    elif frp < 75.0:
        frp_intensity_bucket = 1
    elif frp < 150.0:
        frp_intensity_bucket = 2
    else:
        frp_intensity_bucket = 3
    frp_night_interaction = round(frp * is_night, 2)

    # 2. Spatial Features: Find nearest industrial asset
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

    # Density of industrial infrastructure
    asset_density_5km = count_assets_within_radius_meters(lat, lon, assets, 5000.0)
    asset_density_10km = count_assets_within_radius_meters(lat, lon, assets, 10000.0)

    # Categorical encodings
    # Land code: 0=Industrial, 1=Agricultural, 2=Forest, 3=Urban, 4=Mining, 5=Open
    if "Industrial" in land_context:
        land_code = 0
    elif "Agricultural" in land_context:
        land_code = 1
    elif "Forest" in land_context:
        land_code = 2
    elif "Urban" in land_context or "Settlement" in land_context:
        land_code = 3
    elif "Mining" in land_context:
        land_code = 4
    else:
        land_code = 5

    # Asset category code: 0=Refinery/Petrochemical, 1=Power Plant, 2=LNG/Gas, 3=Steel/Metal, 4=Mining Site, 5=Other
    if asset_category in ["Refinery", "Petrochemical"]:
        asset_cat_code = 0
    elif asset_category == "Power Plant":
        asset_cat_code = 1
    elif asset_category == "LNG / Gas":
        asset_cat_code = 2
    elif asset_category == "Steel / Metal":
        asset_cat_code = 3
    elif asset_category == "Mining Site":
        asset_cat_code = 4
    else:
        asset_cat_code = 5

    # Asset criticality code: 0=LOW, 1=MEDIUM, 2=HIGH, 3=CRITICAL
    crit_map = {"LOW": 0, "MEDIUM": 1, "HIGH": 2, "CRITICAL": 3}
    asset_crit_code = crit_map.get(asset_criticality, 0)

    nearest_asset_is_mining = 1 if asset_cat_code == 4 or land_code == 4 else 0
    nearest_asset_is_flaring_type = 1 if asset_cat_code in [0, 2] else 0

    # 3. Temporal Features (strictly leak-free: obs.timestamp <= anomaly.timestamp)
    spatial_window_m = 5000.0
    relevant_history = []
    for obs in historical_observations:
        obs_ts = getattr(obs, "timestamp", None)
        # Enforce temporal validity (never leak future observations)
        if obs_ts and obs_ts > ts:
            continue
        obs_dist = haversine_distance_meters(lat, lon, obs.latitude, obs.longitude)
        if obs_dist <= spatial_window_m:
            relevant_history.append(obs)

    count_24h = sum(1 for o in relevant_history if o.timestamp and ts - o.timestamp <= timedelta(days=1))
    count_7d = sum(1 for o in relevant_history if o.timestamp and ts - o.timestamp <= timedelta(days=7))
    count_30d = len(relevant_history)

    night_count = sum(1 for o in relevant_history if getattr(o, 'daynight', 'N') == 'N')
    night_ratio = (night_count / len(relevant_history)) if relevant_history else (1.0 if is_night == 1 else 0.0)

    obs_dates = set(o.timestamp.date() for o in relevant_history if getattr(o, "timestamp", None))
    distinct_active_days_30d = len(obs_dates)
    recurrence_freq_per_week = round(count_30d * 7.0 / 30.0, 1)
    recent_vs_hist_ratio = round(count_24h / max(1, count_30d), 2)

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

    # 4. Interaction Features
    high_frp_inside_boundary = 1 if (frp > 100.0 and is_inside_boundary) else 0
    dev_val = baseline_deviation_percent if baseline_deviation_percent is not None else 0.0
    high_frp_high_abnormality = 1 if (frp > 100.0 and dev_val > 50.0) else 0
    industrial_proximity_and_persistence = 1 if (min_dist_m < 2000.0 and count_7d >= 3) else 0
    flare_candidate_interaction = 1 if (nearest_asset_is_flaring_type and is_inside_boundary and abs(dev_val) < 30.0) else 0
    forest_isolated_interaction = 1 if (land_code == 2 and count_30d <= 2) else 0
    agri_remote_interaction = 1 if (land_code == 1 and min_dist_m > 3000.0) else 0

    return {
        # Core Thermal
        "frp": frp,
        "log_frp": log_frp,
        "brightness": brightness,
        "brightness_norm": brightness_norm,
        "frp_to_brightness_ratio": frp_to_brightness_ratio,
        "frp_intensity_bucket": frp_intensity_bucket,
        "is_night": is_night,
        "frp_night_interaction": frp_night_interaction,
        "satellite": getattr(anomaly, "satellite", "VIIRS-NOAA21") or "VIIRS-NOAA21",

        # Core Spatial
        "distance_to_nearest_asset_m": round(min_dist_m, 1),
        "is_inside_boundary": 1 if is_inside_boundary else 0,
        "distance_to_boundary_m": round(dist_to_boundary_m, 1) if dist_to_boundary_m is not None else round(min_dist_m, 1),
        "nearest_asset_name": nearest_asset.name if nearest_asset else "No mapped asset nearby",
        "nearest_asset_id": nearest_asset.asset_id if nearest_asset else None,
        "asset_category": asset_category,
        "asset_criticality": asset_criticality,
        "asset_cat_code": asset_cat_code,
        "asset_crit_code": asset_crit_code,
        "asset_density_5km": asset_density_5km,
        "asset_density_10km": asset_density_10km,
        "nearest_asset_is_mining": nearest_asset_is_mining,
        "nearest_asset_is_flaring_type": nearest_asset_is_flaring_type,
        "land_context": land_context,
        "land_code": land_code,
        "settlement_distance_m": round(settlement_dist_m, 1),

        # Core Temporal
        "count_24h": count_24h,
        "count_7d": count_7d,
        "count_30d": count_30d,
        "distinct_active_days_30d": distinct_active_days_30d,
        "recurrence_freq_per_week": recurrence_freq_per_week,
        "night_ratio": round(night_ratio, 2),
        "has_sufficient_history": has_sufficient_history,
        "has_sufficient_history_flag": 1 if has_sufficient_history else 0,
        "historical_median_frp": round(historical_median, 1) if historical_median is not None else None,
        "historical_median_frp_val": round(historical_median, 1) if historical_median is not None else 0.0,
        "baseline_deviation_percent": baseline_deviation_percent,
        "baseline_deviation_val": dev_val,
        "recent_vs_hist_ratio": recent_vs_hist_ratio,

        # Interactions
        "high_frp_inside_boundary": high_frp_inside_boundary,
        "high_frp_high_abnormality": high_frp_high_abnormality,
        "industrial_proximity_and_persistence": industrial_proximity_and_persistence,
        "flare_candidate_interaction": flare_candidate_interaction,
        "forest_isolated_interaction": forest_isolated_interaction,
        "agri_remote_interaction": agri_remote_interaction,
    }
