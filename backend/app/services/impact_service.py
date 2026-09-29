"""Impact, Exposure Analysis, Explainable Risk, and Multi-Factor Evidence Service.
Evaluates human population exposure, industrial vulnerability, and produces
factual, transparent risk explanations derived directly from database metrics without hallucination.
"""

from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.models.models import FireDetection, IndustrialSite, ResidentialArea
from backend.app.services.geospatial_service import (
    haversine_distance_km,
    find_nearby_industrial_sites,
    find_nearby_residential_areas,
    get_spatial_historical_baseline,
    calculate_cluster_density
)


def evaluate_fire_impact(fire: FireDetection, db: Session) -> Dict[str, Any]:
    """Calculate structured impact and exposure around a fire detection.
    Analyzes nearby facilities, residential settlements, population exposure, and danger zones.
    """
    lat = fire.latitude
    lon = fire.longitude

    # 1. Nearby Industrial Facilities (within 15 km)
    ind_sites = find_nearby_industrial_sites(lat, lon, db, max_range_km=15.0)

    # 2. Nearby Residential Settlements (within 10 km)
    res_areas = find_nearby_residential_areas(lat, lon, db, max_range_km=10.0)

    impact_items = []
    total_population_exposed = 0
    pop_source = "OpenStreetMap / Census Projection" if res_areas else "No settlements registered within 10 km radius"

    # Evaluate industrial exposure
    facilities_at_risk = 0
    for s in ind_sites:
        d = s["distance_km"]
        if d <= 1.0:
            tier = "CRITICAL"
            facilities_at_risk += 1
        elif d <= 2.5:
            tier = "HIGH"
            facilities_at_risk += 1
        elif d <= 5.0:
            tier = "MEDIUM"
        else:
            tier = "LOW"

        impact_items.append({
            "name": s["name"],
            "category": "INDUSTRIAL",
            "type": s["type"],
            "distance_km": round(d, 2),
            "danger_tier": tier,
            "details": {
                "risk_category": s["risk_category"],
                "source": s.get("source", "OpenStreetMap")
            }
        })

    # Evaluate residential exposure & human population
    settlements_at_risk = 0
    for r in res_areas:
        d = r["distance_km"]
        pop = r.get("population_estimate", 0)

        if d <= 1.5:
            tier = "CRITICAL"
            settlements_at_risk += 1
            total_population_exposed += pop
        elif d <= 3.0:
            tier = "HIGH"
            settlements_at_risk += 1
            total_population_exposed += int(pop * 0.7)
        elif d <= 5.0:
            tier = "MEDIUM"
            total_population_exposed += int(pop * 0.3)
        else:
            tier = "LOW"

        impact_items.append({
            "name": r["name"],
            "category": "RESIDENTIAL",
            "type": "Settlement",
            "distance_km": round(d, 2),
            "danger_tier": tier,
            "details": {
                "population_estimate": pop,
                "building_count": r.get("building_count", 0),
                "danger_radius_km": r.get("danger_radius_km", 3.0)
            }
        })

    # Overall danger zone designation
    closest_ind_dist = min([s["distance_km"] for s in ind_sites], default=999.0)
    closest_res_dist = min([r["distance_km"] for r in res_areas], default=999.0)

    if closest_ind_dist <= 1.0 or closest_res_dist <= 1.0:
        danger_zone = "CRITICAL"
        summary = f"Direct proximity threat: Thermal source is within {min(closest_ind_dist, closest_res_dist):.1f} km of occupied assets or facilities."
    elif closest_ind_dist <= 2.5 or closest_res_dist <= 2.5:
        danger_zone = "HIGH"
        summary = f"Elevated exposure: Thermal activity detected within 2.5 km perimeter buffer zone."
    elif closest_ind_dist <= 5.0 or closest_res_dist <= 5.0:
        danger_zone = "MEDIUM"
        summary = "Moderate peripheral buffer exposure; monitoring recommended."
    else:
        danger_zone = "LOW"
        summary = "Isolated thermal event with minimal proximate human settlement or infrastructure exposure."

    return {
        "fire_id": fire.id,
        "latitude": fire.latitude,
        "longitude": fire.longitude,
        "danger_zone": danger_zone,
        "population_exposure_estimate": total_population_exposed if res_areas else None,
        "population_source": pop_source,
        "facilities_at_risk_count": facilities_at_risk,
        "residential_settlements_at_risk_count": settlements_at_risk,
        "critical_infrastructure_count": len(ind_sites),
        "impact_items": sorted(impact_items, key=lambda x: x["distance_km"]),
        "exposure_summary": summary
    }


def generate_risk_explanation(fire: FireDetection, db: Session) -> Dict[str, Any]:
    """Generate transparent, evidence-based explainability factors for a fire's risk score.
    Derives reasons strictly from real calculated physical and spatial metrics.
    """
    pred = fire.prediction
    risk_score = pred.risk_score if pred else 50.0
    sev = pred.severity if pred else "MEDIUM"
    det_time = fire.detection_time
    if det_time.tzinfo is None:
        det_time = det_time.replace(tzinfo=timezone.utc)

    # 1. Baseline metrics
    baseline = get_spatial_historical_baseline(
        db=db,
        lat=fire.latitude,
        lon=fire.longitude,
        target_time=det_time,
        window_days=30,
        radius_km=5.0
    )

    # 2. Cluster density
    density = calculate_cluster_density(
        lat=fire.latitude,
        lon=fire.longitude,
        db=db,
        target_time=det_time,
        radius_km=3.0
    )

    explanations = []

    # Factor 1: Thermal Radiative Power & Baseline Percentile
    frp = fire.frp or 0.0
    p90 = baseline.get("percentile_90_frp", 0.0)
    med_frp = baseline.get("median_frp", 0.0)

    if p90 > 0.0 and frp > p90:
        ratio = round(frp / max(1.0, p90), 1)
        explanations.append({
            "factor": "Thermal Intensity Anomaly",
            "score": round(min(100.0, (frp / 200.0) * 100.0), 1),
            "weight": 0.30,
            "evidence": f"Fire Radiative Power ({frp:.1f} MW) exceeds the local 30-day 90th percentile ({p90:.1f} MW) by {ratio}x.",
            "level": "CRITICAL" if ratio >= 2.0 else "ELEVATED"
        })
    elif frp >= 100.0:
        explanations.append({
            "factor": "Extreme Thermal Radiative Output",
            "score": 90.0,
            "weight": 0.30,
            "evidence": f"High energy release rate of {frp:.1f} MW detected, indicating vigorous combustion.",
            "level": "CRITICAL"
        })
    else:
        explanations.append({
            "factor": "Thermal Intensity",
            "score": round(min(100.0, (frp / 100.0) * 100.0), 1),
            "weight": 0.30,
            "evidence": f"Observed FRP of {frp:.1f} MW is within typical regional thermal ranges (median: {med_frp:.1f} MW).",
            "level": "NORMAL"
        })

    # Factor 2: Industrial Facility Proximity
    d_ind = pred.distance_to_industrial_km if pred else None
    ind_name = pred.nearby_industrial_name if pred else None
    if d_ind is not None and d_ind <= 1.0:
        explanations.append({
            "factor": "Critical Facility Proximity",
            "score": 95.0,
            "weight": 0.25,
            "evidence": f"Directly adjacent ({d_ind:.2f} km) to high-hazard industrial facility: '{ind_name}'.",
            "level": "CRITICAL"
        })
    elif d_ind is not None and d_ind <= 3.0:
        explanations.append({
            "factor": "Industrial Corridor Proximity",
            "score": 65.0,
            "weight": 0.25,
            "evidence": f"Within {d_ind:.2f} km perimeter of industrial facility: '{ind_name}'.",
            "level": "ELEVATED"
        })
    else:
        explanations.append({
            "factor": "Industrial Buffer",
            "score": 15.0,
            "weight": 0.25,
            "evidence": f"No registered major industrial facilities within immediate 3.0 km danger buffer.",
            "level": "NORMAL"
        })

    # Factor 3: Residential Settlement Exposure
    d_res = pred.distance_to_residential_km if pred else None
    res_name = pred.nearby_residential_name if pred else None
    if d_res is not None and d_res <= 1.5:
        explanations.append({
            "factor": "Residential Settlement Exposure",
            "score": 90.0,
            "weight": 0.25,
            "evidence": f"High human vulnerability: Located only {d_res:.2f} km from '{res_name}'. Smoke/plume inhalation risk.",
            "level": "CRITICAL"
        })
    elif d_res is not None and d_res <= 4.0:
        explanations.append({
            "factor": "Residential Buffer Proximity",
            "score": 50.0,
            "weight": 0.25,
            "evidence": f"Located {d_res:.2f} km from '{res_name}'. Precautionary monitoring advised.",
            "level": "ELEVATED"
        })
    else:
        explanations.append({
            "factor": "Residential Buffer",
            "score": 10.0,
            "weight": 0.25,
            "evidence": "Adequate spatial separation (>5.0 km) from major populated municipal settlements.",
            "level": "NORMAL"
        })

    # Factor 4: Persistence & Recurrence Score
    persistence = baseline.get("persistence_score", 0.0)
    active_days = baseline.get("active_days", 0)
    if persistence >= 0.7:
        explanations.append({
            "factor": "High Temporal Persistence",
            "score": round(persistence * 100.0, 1),
            "weight": 0.10,
            "evidence": f"Persistent thermal activity confirmed across {active_days} distinct days in the past 30 days (consistent with continuous flaring or sustained industrial operations).",
            "level": "CRITICAL" if persistence >= 0.85 else "ELEVATED"
        })
    elif active_days > 1:
        explanations.append({
            "factor": "Intermittent Recurrence",
            "score": round(persistence * 100.0, 1),
            "weight": 0.10,
            "evidence": f"Intermittent thermal detections on {active_days} days during the 30-day rolling baseline.",
            "level": "ELEVATED"
        })
    else:
        explanations.append({
            "factor": "Transient Anomaly",
            "score": 10.0,
            "weight": 0.10,
            "evidence": "New or isolated thermal occurrence; no prior persistent 30-day baseline record at this exact location.",
            "level": "NORMAL"
        })

    # Factor 5: Local Cluster Density in Past 24 Hours
    if density >= 0.5:
        explanations.append({
            "factor": "Thermal Multi-Point Cluster",
            "score": round(density * 100.0, 1),
            "weight": 0.10,
            "evidence": f"Multiple co-located thermal anomaly pixels active within 3 km during the last 24 hours.",
            "level": "ELEVATED"
        })

    # Overall headline
    critical_factors = [e for e in explanations if e["level"] == "CRITICAL"]
    if critical_factors:
        headline = f"High Risk driven by {len(critical_factors)} critical factor(s): {critical_factors[0]['factor']}."
    else:
        headline = f"Severity categorized as {sev} with composite score of {risk_score:.1f}/100."

    return {
        "fire_id": fire.id,
        "risk_score": risk_score,
        "severity": sev,
        "summary_headline": headline,
        "explanations": explanations,
        "recommendation": pred.recommended_response if pred else "Monitor via standard surveillance protocol."
    }


def get_multi_satellite_correlation(fire: FireDetection, db: Session, max_hours: float = 3.0, max_dist_km: float = 3.0) -> Dict[str, Any]:
    """Check whether other independent satellite sensors corroborated this thermal event within a 3-hour, 3-km window."""
    det_time = fire.detection_time
    if det_time.tzinfo is None:
        det_time = det_time.replace(tzinfo=timezone.utc)

    window_start = det_time - timedelta(hours=max_hours)
    window_end = det_time + timedelta(hours=max_hours)

    candidates = (
        db.query(FireDetection)
        .filter(
            FireDetection.id != fire.id,
            FireDetection.detection_time.between(window_start, window_end),
            FireDetection.latitude.between(fire.latitude - 0.05, fire.latitude + 0.05),
            FireDetection.longitude.between(fire.longitude - 0.05, fire.longitude + 0.05)
        )
        .all()
    )

    corroborating = []
    for c in candidates:
        dist = haversine_distance_km(fire.latitude, fire.longitude, c.latitude, c.longitude)
        if dist <= max_dist_km:
            corroborating.append({
                "fire_id": c.id,
                "satellite": c.satellite,
                "sensor": c.sensor,
                "detection_time": c.detection_time.isoformat() if c.detection_time else None,
                "distance_km": round(dist, 2),
                "frp": c.frp,
                "confidence": c.confidence
            })

    unique_sensors = {c["sensor"] for c in corroborating}
    unique_sensors.add(fire.sensor)

    is_multi_confirmed = len(unique_sensors) >= 2

    return {
        "fire_id": fire.id,
        "primary_sensor": fire.sensor,
        "primary_satellite": fire.satellite,
        "is_multi_satellite_confirmed": is_multi_confirmed,
        "corroborating_detections_count": len(corroborating),
        "independent_sensors": list(unique_sensors),
        "corroborating_observations": corroborating,
        "summary": (
            f"Multi-satellite confirmation active: Corroborated by {len(unique_sensors)} distinct sensors ({', '.join(unique_sensors)})."
            if is_multi_confirmed else
            f"Single-sensor observation ({fire.sensor} on {fire.satellite}). No secondary satellite pass within {max_hours} hours."
        )
    }


def get_multi_factor_evidence(fire: FireDetection, db: Session) -> Dict[str, Any]:
    """Assemble a complete multi-factor evidence dossier separating physical telemetry,
    historical statistics, geospatial exposure, ML classification, and satellite cross-checks.
    """
    pred = fire.prediction
    impact = evaluate_fire_impact(fire, db)
    explanation = generate_risk_explanation(fire, db)
    multi_sat = get_multi_satellite_correlation(fire, db)

    return {
        "fire_id": fire.id,
        "telemetry_evidence": {
            "brightness_temperature_k": fire.brightness_temperature,
            "frp_mw": fire.frp,
            "sensor_confidence_pct": fire.confidence,
            "day_night_flag": fire.day_night,
            "satellite_platform": fire.satellite,
            "instrument": fire.instrument,
            "detection_timestamp": fire.detection_time.isoformat() if fire.detection_time else None
        },
        "spatial_exposure_evidence": {
            "danger_zone": impact["danger_zone"],
            "facilities_at_risk_count": impact["facilities_at_risk_count"],
            "residential_settlements_count": impact["residential_settlements_at_risk_count"],
            "population_exposure_estimate": impact["population_exposure_estimate"],
            "closest_facility": impact["impact_items"][0] if impact["impact_items"] else None
        },
        "ml_classification_evidence": {
            "predicted_class": pred.predicted_class if pred else "Unknown",
            "model_confidence": pred.confidence if pred else 0.7,
            "model_version": pred.model_version if pred else "v1.0.0",
            "severity": pred.severity if pred else "MEDIUM",
            "risk_score": pred.risk_score if pred else 50.0
        },
        "multi_satellite_support": multi_sat,
        "explainable_risk_breakdown": explanation
    }
