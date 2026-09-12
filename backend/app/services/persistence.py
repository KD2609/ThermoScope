from datetime import datetime, timedelta
from typing import Optional, Any
from app.services.geospatial import haversine_distance_meters

def evaluate_persistence_and_baseline(
    anomaly: Any,
    historical_observations: list[Any],
    cluster_radius_m: float = 3000.0
) -> dict[str, Any]:
    """
    Temporal Persistence Engine.
    Evaluates baseline FRP and recurrence without fabricating baselines when data is sparse.
    """
    lat = anomaly.latitude
    lon = anomaly.longitude
    current_frp = float(anomaly.frp)
    ts = anomaly.timestamp or datetime.utcnow()

    # Filter observations in local cluster radius (strictly leak-free: obs.timestamp <= ts)
    cluster_obs = []
    for obs in historical_observations:
        obs_ts = getattr(obs, "timestamp", None)
        if obs_ts and obs_ts > ts:
            continue
        dist = haversine_distance_meters(lat, lon, obs.latitude, obs.longitude)
        if dist <= cluster_radius_m:
            cluster_obs.append(obs)

    count = len(cluster_obs)
    
    # Requirement: Minimum 3 observations required for statistical baseline
    if count < 3:
        return {
            "has_sufficient_history": False,
            "observation_count": count,
            "current_frp": current_frp,
            "historical_median_frp": None,
            "frp_min": None,
            "frp_max": None,
            "deviation_percent": None,
            "persistence_detected": False,
            "persistence_duration_days": 1,
            "recurrence_frequency_per_week": round(count * 7.0 / 30.0, 1),
            "interpretation": "Insufficient historical observations to establish a verified thermal baseline (minimum 3 required)."
        }

    # Compute actual baseline stats
    frp_values = sorted([float(o.frp) for o in cluster_obs])
    frp_min = frp_values[0]
    frp_max = frp_values[-1]
    mid = count // 2
    median_frp = frp_values[mid] if count % 2 != 0 else (frp_values[mid - 1] + frp_values[mid]) / 2.0
    
    deviation = round(((current_frp - median_frp) / median_frp) * 100.0, 1) if median_frp > 0 else 0.0

    # Persistence evaluation: observed across >= 4 distinct days or >= 3 times in past 7 days
    obs_dates = set(o.timestamp.date() for o in cluster_obs if hasattr(o, 'timestamp') and o.timestamp)
    first_ts = min((o.timestamp for o in cluster_obs if hasattr(o, 'timestamp') and o.timestamp), default=ts)
    duration_days = max(1, (ts.date() - first_ts.date()).days + 1)
    
    obs_last_7d = sum(1 for o in cluster_obs if hasattr(o, 'timestamp') and ts - o.timestamp <= timedelta(days=7))
    is_persistent = (len(obs_dates) >= 4) or (obs_last_7d >= 3)
    
    recurrence_per_week = round((count / max(1.0, duration_days / 7.0)), 1)

    # Narrative interpretation
    if deviation > 75.0:
        interpretation = f"Thermal intensity (+{deviation}%) is substantially elevated relative to historical baseline (median {median_frp:.1f} MW across {count} observations)."
    elif deviation < -30.0:
        interpretation = f"Thermal intensity ({deviation}%) is below typical operational levels (median {median_frp:.1f} MW)."
    elif is_persistent:
        interpretation = f"Thermal source demonstrates steady recurrence ({count} observations over {duration_days} days, median {median_frp:.1f} MW), consistent with persistent/routine source."
    else:
        interpretation = f"Thermal observation is within standard variance range of historical median ({median_frp:.1f} MW)."

    return {
        "has_sufficient_history": True,
        "observation_count": count,
        "current_frp": current_frp,
        "historical_median_frp": round(median_frp, 1),
        "frp_min": round(frp_min, 1),
        "frp_max": round(frp_max, 1),
        "deviation_percent": deviation,
        "persistence_detected": is_persistent,
        "persistence_duration_days": duration_days,
        "recurrence_frequency_per_week": recurrence_per_week,
        "interpretation": interpretation
    }
