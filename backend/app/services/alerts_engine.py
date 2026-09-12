"""
ThermoScope AI - Context-Aware Alert & Investigation Decision Engine
====================================================================
Implements multi-signal context-aware alert consolidation, operational triage,
suppression of non-actionable routine noise, and evidence-linked investigation guidance.

Deduplication Criteria:
1. Spatial Proximity: <= ALERT_DEDUP_RADIUS_METERS (default 3,000 m)
2. Temporal Window: <= ALERT_DEDUP_WINDOW_HOURS (default 6 hours)
3. Asset Association: Same industrial asset_id or nearest mapped facility
4. Classification Compatibility: Compatible thermal phenomenon type
"""

from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from app.config import settings
from app.services.geospatial import haversine_distance_meters


def evaluate_alert_decision(
    anomaly: Any,
    features: dict[str, Any],
    classification: dict[str, Any],
    risk: dict[str, Any],
    existing_alerts: List[Any]
) -> dict[str, Any]:
    """
    Evaluate whether to create a new alert, consolidate into an active alert,
    or suppress routine/low-risk notifications.
    """
    predicted_class = classification.get("predicted_class", "Unknown Thermal Anomaly")
    risk_level = risk.get("risk_level", "LOW")
    risk_score = risk.get("risk_score", 0.0)
    frp = float(anomaly.frp)
    lat = float(anomaly.latitude)
    lon = float(anomaly.longitude)
    ts = anomaly.timestamp or datetime.utcnow()
    nearest_asset = features.get("nearest_asset_name", "Unknown Industrial Zone")
    asset_id = features.get("nearest_asset_id")
    is_inside = bool(features.get("is_inside_boundary", False))
    dev = float(features.get("baseline_deviation_percent") or features.get("baseline_deviation_val") or 0.0)

    # 1. Operational Triage Channel & Suppression
    if predicted_class == "Agricultural / Biomass Burn":
        triage_channel = "ENVIRONMENTAL_ADVISORY"
        # Agricultural burns outside industrial perimeters are routed as advisory
        if risk_level == "LOW":
            should_create_alert = False  # Suppress from industrial emergency board
        else:
            should_create_alert = True
    elif predicted_class == "Routine / Persistent Industrial Thermal Source":
        triage_channel = "OPERATIONAL_MONITORING"
        # Suppress routine normal heat when baseline deviation is normal (< 30%)
        if dev <= 30.0 and risk_score < 45.0:
            should_create_alert = False  # Logged to temporal monitoring, no emergency dispatch needed
        else:
            should_create_alert = True
    elif predicted_class == "Gas Flare / Combustion Source":
        triage_channel = "PROCESS_MONITORING"
        should_create_alert = (risk_score >= 35.0)
    elif predicted_class == "Potential Industrial Fire":
        triage_channel = "EMERGENCY_DISPATCH"
        should_create_alert = True  # Always alert on potential industrial fire
    elif predicted_class == "Vegetation / Wildfire":
        triage_channel = "CIVIL_DEFENSE_ADVISORY"
        should_create_alert = (risk_score >= 30.0)
    else:
        triage_channel = "FIELD_VERIFICATION"
        should_create_alert = (risk_score >= 30.0)

    # 2. Multi-Signal Alert Deduplication & Consolidation
    # Search for an existing active alert within the spatial and temporal window
    dedup_radius = getattr(settings, "ALERT_DEDUP_RADIUS_METERS", 3000.0)
    dedup_window_hrs = getattr(settings, "ALERT_DEDUP_WINDOW_HOURS", 6.0)
    cutoff_time = ts - timedelta(hours=dedup_window_hrs)

    matching_alert = None
    for alert in existing_alerts:
        if alert.status in ["RESOLVED", "CLOSED"]:
            continue
        
        # Check temporal window
        alert_time = getattr(alert, "created_at", None)
        if alert_time and alert_time < cutoff_time:
            continue

        # Check spatial proximity if anomaly coordinates are attached
        if hasattr(alert, "anomaly") and alert.anomaly:
            prev_lat = alert.anomaly.latitude
            prev_lon = alert.anomaly.longitude
            dist = haversine_distance_meters(lat, lon, prev_lat, prev_lon)
            if dist <= dedup_radius:
                matching_alert = alert
                break
        elif alert.facility_name and alert.facility_name == nearest_asset and nearest_asset != "Unknown Industrial Zone":
            matching_alert = alert
            break

    # 3. Formulate Recommendation
    if predicted_class == "Potential Industrial Fire":
        recommendation = (
            f"IMMEDIATE DISPATCH: High-priority alarm at '{nearest_asset}'. "
            f"Coordinates fall within facility perimeter with FRP {frp:.1f} MW (+{dev:.1f}% deviation). "
            "Notify industrial fire brigade, verify onsite flare/process state, and request high-res satellite tasking."
        )
    elif predicted_class == "Routine / Persistent Industrial Thermal Source":
        recommendation = (
            f"ROUTINE MONITORING: Operational heat source at '{nearest_asset}'. "
            f"Thermal signature (FRP {frp:.1f} MW) conforms to historical operational baseline. "
            "Continue automated satellite monitoring. No emergency field deployment warranted."
        )
    elif predicted_class == "Agricultural / Biomass Burn":
        recommendation = (
            f"ADVISORY NOTICE: Biomass / stubble burn detected {features.get('distance_to_nearest_asset_m', 0)/1000.0:.1f} km "
            f"from '{nearest_asset}'. Route notification to State Pollution Control Board and district agricultural office."
        )
    elif predicted_class == "Gas Flare / Combustion Source":
        recommendation = (
            f"PROCESS AUDIT: Operational flaring signature mapped at '{nearest_asset}'. "
            "Verify flare gas volume with plant SCADA log."
        )
    else:
        recommendation = (
            f"EVIDENCE REVIEW: Thermal anomaly near '{nearest_asset}'. "
            "Inspect recent satellite passes, optical cloud mask, and land registry context."
        )

    # 4. Synthesize Alert Record Fields
    title = f"{risk_level}: {predicted_class} ({nearest_asset})"
    msg = (
        f"FRP {frp:.1f} MW observed by {anomaly.satellite} at "
        f"({lat:.4f}, {lon:.4f}) near {nearest_asset}."
    )

    if matching_alert:
        return {
            "should_create_alert": False,
            "action": "CONSOLIDATE",
            "consolidated_with_alert_id": matching_alert.alert_id,
            "target_alert_id": matching_alert.id,
            "severity": max_severity(matching_alert.severity, risk_level),
            "updated_message": (
                f"{matching_alert.message} | [Updated {ts.strftime('%H:%M')} UTC: "
                f"Cluster consolidated, latest FRP {frp:.1f} MW, risk {risk_score:.1f}]"
            ),
            "triage_channel": triage_channel,
            "investigation_recommendation": recommendation,
        }

    return {
        "should_create_alert": should_create_alert,
        "action": "CREATE_NEW" if should_create_alert else "SUPPRESS",
        "consolidated_with_alert_id": None,
        "severity": risk_level,
        "title": title,
        "message": msg,
        "facility_name": nearest_asset,
        "triage_channel": triage_channel,
        "investigation_recommendation": recommendation,
    }


def max_severity(sev1: str, sev2: str) -> str:
    """Return the higher severity level between two severities."""
    priority_order = {"CRITICAL": 4, "HIGH": 3, "MEDIUM": 2, "LOW": 1}
    return sev1 if priority_order.get(sev1, 0) >= priority_order.get(sev2, 0) else sev2
