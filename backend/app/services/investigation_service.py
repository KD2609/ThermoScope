"""Natural-Language Investigation Assistant & What-If Risk Simulation Service.
Translates analyst inquiries into structured queries against live database models,
and evaluates speculative 'What-If' scenarios with clear simulation watermarks without touching ML weights.
"""

import re
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from backend.app.models.models import FireDetection, FirePrediction, Incident, IndustrialSite, Alert
from backend.app.services.risk_service import calculate_risk_and_response
from backend.app.schemas.schemas import WhatIfSimulationRequest, WhatIfSimulationResponse


def process_investigation_query(query_text: str, db: Session) -> Dict[str, Any]:
    """Parse a natural-language query from an investigator and execute structured SQL queries.
    Grounds all responses in real database records without hallucinating data.
    """
    q = query_text.lower().replace("-", " ").strip()
    now = datetime.now(timezone.utc)

    # 1. Intent: High risk fires / critical emergencies
    if any(k in q for k in ["high risk", "critical", "severe", "danger", "emergency"]):
        fires = (
            db.query(FireDetection)
            .join(FirePrediction)
            .filter(FirePrediction.severity.in_(["HIGH", "CRITICAL"]))
            .order_by(desc(FirePrediction.risk_score))
            .limit(5)
            .all()
        )
        entities = [f.to_dict() for f in fires]
        count = len(entities)
        answer = (
            f"Found {count} high-priority thermal anomaly detections with elevated risk scores. "
            + (f"The highest severity event is {entities[0]['id']} with risk score {entities[0]['prediction']['risk_score']}." if entities else "No active critical events in database.")
        )
        return {
            "query": query_text,
            "intent": "QUERY_HIGH_RISK",
            "structured_findings": {"count": count, "severity_filter": ["HIGH", "CRITICAL"]},
            "direct_answer": answer,
            "supporting_entities": entities,
            "evidence_sources": ["fire_detections", "fire_predictions"]
        }

    # 2. Intent: Queries about a specific facility or location (e.g. Jamnagar, refinery, steel)
    matched_site = None
    sites = db.query(IndustrialSite).all()
    for s in sites:
        if s.name.lower() in q or (s.type and s.type.lower() in q):
            matched_site = s
            break

    if matched_site:
        # Query nearby fires within 10 km
        delta_deg = 10.0 / 111.0
        nearby = (
            db.query(FireDetection)
            .filter(
                FireDetection.latitude.between(matched_site.latitude - delta_deg, matched_site.latitude + delta_deg),
                FireDetection.longitude.between(matched_site.longitude - delta_deg, matched_site.longitude + delta_deg)
            )
            .order_by(desc(FireDetection.detection_time))
            .limit(6)
            .all()
        )
        entities = [f.to_dict() for f in nearby]
        answer = (
            f"Analyzed surveillance perimeter around '{matched_site.name}' ({matched_site.type}). "
            f"Found {len(entities)} registered satellite thermal observation(s) within a 10 km operational buffer."
        )
        return {
            "query": query_text,
            "intent": "QUERY_FACILITY_PROXIMITY",
            "structured_findings": {
                "facility": matched_site.to_dict(),
                "nearby_fire_count": len(entities)
            },
            "direct_answer": answer,
            "supporting_entities": entities,
            "evidence_sources": ["industrial_sites", "fire_detections"]
        }

    # 3. Intent: Queries asking "Why" about a specific Fire ID
    id_match = re.search(r'(fire-[a-z0-9]+|inc-[a-z0-9]+)', q)
    if id_match:
        target_id = id_match.group(1).upper()
        fire = db.query(FireDetection).filter(FireDetection.id.ilike(f"%{target_id}%")).first()
        if fire:
            pred = fire.prediction
            answer = (
                f"Detection {fire.id} is classified as '{pred.predicted_class if pred else 'Unknown'}' "
                f"with a risk score of {pred.risk_score if pred else 50.0}/100 ({pred.severity if pred else 'MEDIUM'}). "
                f"Primary factors include thermal radiation power ({fire.frp or 0.0:.1f} MW), "
                f"brightness temperature ({fire.brightness_temperature:.1f} K), and proximity to {pred.nearby_industrial_name if pred else 'regional facilities'}."
            )
            return {
                "query": query_text,
                "intent": "EXPLAIN_SPECIFIC_EVENT",
                "structured_findings": {"fire": fire.to_dict()},
                "direct_answer": answer,
                "supporting_entities": [fire.to_dict()],
                "evidence_sources": ["fire_detections", "fire_predictions"]
            }

    # 4. Default / General Overview Intent
    total_fires = db.query(FireDetection).count()
    active_incidents = db.query(Incident).filter(Incident.status != "CLOSED").count()
    active_alerts = db.query(Alert).filter(Alert.status == "NEW").count()

    latest_fires = db.query(FireDetection).order_by(desc(FireDetection.detection_time)).limit(3).all()
    answer = (
        f"ThermoScope is currently tracking {total_fires} total thermal detections and {active_incidents} active incidents. "
        f"There are currently {active_alerts} unacknowledged operational early warnings in the system."
    )
    return {
        "query": query_text,
        "intent": "GENERAL_SUMMARY",
        "structured_findings": {
            "total_detections": total_fires,
            "active_incidents": active_incidents,
            "new_alerts": active_alerts
        },
        "direct_answer": answer,
        "supporting_entities": [f.to_dict() for f in latest_fires],
        "evidence_sources": ["fire_detections", "incidents", "alerts"]
    }


def simulate_what_if_risk(req: WhatIfSimulationRequest, db: Session) -> Dict[str, Any]:
    """Execute a speculative risk simulation under hypothetical parameters using real existing fire data.
    Clearly marks outputs with simulation headers and disclaimers.
    """
    base_det = None
    baseline_risk = None
    if req.base_fire_id:
        base_det = db.query(FireDetection).filter(FireDetection.id == req.base_fire_id).first()
        if base_det and base_det.prediction:
            baseline_risk = base_det.prediction.risk_score

    frp_mult = req.frp_multiplier if req.frp_multiplier is not None else 1.0
    extra_det = req.additional_detections_count if req.additional_detections_count is not None else 0
    wind_spd = req.wind_speed_kmh if req.wind_speed_kmh is not None else 0.0
    pers_mult = req.persistence_multiplier if req.persistence_multiplier is not None else 1.0

    if base_det:
        pred = base_det.prediction
        base_bt = float(base_det.brightness_temperature) if base_det.brightness_temperature is not None else 335.0
        base_frp = float(base_det.frp) if base_det.frp is not None else 10.0
        base_conf = float(base_det.confidence) if base_det.confidence is not None else 80.0
        base_class = pred.predicted_class if (pred and pred.predicted_class) else "Wildfire / Natural Fire"
        base_ind_dist = float(pred.distance_to_industrial_km) if (pred and pred.distance_to_industrial_km is not None) else 10.0
        base_ind_type = pred.nearby_industrial_type if (pred and pred.nearby_industrial_type) else None
        base_res_dist = float(pred.distance_to_residential_km) if (pred and pred.distance_to_residential_km is not None) else 15.0
        base_pers = 0.2
    else:
        base_bt = req.brightness_temp if req.brightness_temp is not None else 380.0
        base_frp = req.frp if req.frp is not None else 120.0
        base_conf = req.confidence if req.confidence is not None else 85.0
        base_class = req.predicted_class or "Industrial Fire"
        base_ind_dist = req.distance_to_industrial_km if req.distance_to_industrial_km is not None else 0.8
        base_ind_type = "refinery" if base_ind_dist < 2.0 else None
        base_res_dist = req.distance_to_residential_km if req.distance_to_residential_km is not None else 2.0
        base_pers = req.persistence_score if req.persistence_score is not None else 0.5

    # Apply hypothetical parameter adjustments
    sim_frp = max(0.1, round(base_frp * frp_mult, 2))
    sim_bt = max(300.0, round(base_bt + (frp_mult - 1.0) * 15.0, 1))
    sim_conf = min(100.0, max(10.0, round(base_conf + (frp_mult - 1.0) * 5.0, 1)))
    sim_pers = min(1.0, max(0.0, round((base_pers * pers_mult) + (extra_det * 0.05), 2)))

    # Wind speed enhances intensity and flame propagation
    if wind_spd > 15.0:
        wind_factor = 1.0 + ((wind_spd - 15.0) / 100.0)
        sim_frp = round(sim_frp * wind_factor, 2)

    # Compute risk with calculate_risk_and_response
    sim_result = calculate_risk_and_response(
        brightness_temp=sim_bt,
        frp=sim_frp,
        confidence=sim_conf,
        predicted_class=base_class,
        distance_to_industrial_km=base_ind_dist,
        industrial_site_type=base_ind_type,
        distance_to_residential_km=base_res_dist,
        persistence_score=sim_pers,
        historical_fire_count=int(sim_pers * 20) + extra_det
    )

    sim_score = sim_result["risk_score"]
    delta = round(sim_score - baseline_risk, 1) if baseline_risk is not None else None

    return {
        "is_simulation": True,
        "disclaimer": "SIMULATION ONLY — THIS IS NOT A REAL SATELLITE OBSERVATION",
        "simulated_risk_score": sim_score,
        "simulated_severity": sim_result["severity"],
        "recommended_response": sim_result["recommended_response"],
        "risk_delta_vs_baseline": delta,
        "input_parameters": {
            "brightness_temperature": sim_bt,
            "frp": sim_frp,
            "confidence": sim_conf,
            "frp_multiplier": frp_mult,
            "additional_detections_count": extra_det,
            "wind_speed_kmh": wind_spd,
            "distance_to_industrial_km": base_ind_dist,
            "distance_to_residential_km": base_res_dist,
            "persistence_score": sim_pers,
            "predicted_class": base_class,
            "base_fire_id": req.base_fire_id
        }
    }

