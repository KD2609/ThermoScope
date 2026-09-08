import json
from datetime import datetime
from typing import Optional, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import ThermalAnomaly, IndustrialAsset, ClassificationResult, RiskAssessment, Alert, Investigation, AuditLog, TemporalObservation
from app.schemas.schemas import AnomalyResponse, GeoJSONFeatureCollection, AnomalyIntelligenceResponse
from app.services.features import extract_features
from app.services.classification import classifier
from app.services.persistence import evaluate_persistence_and_baseline
from app.services.risk import calculate_risk

router = APIRouter(prefix="/api/anomalies", tags=["Anomalies"])

@router.get("", response_model=list[dict[str, Any]])
def list_anomalies(
    classification: Optional[str] = None,
    severity: Optional[str] = None,
    min_frp: Optional[float] = None,
    source: Optional[str] = None,
    limit: int = Query(100, le=500),
    offset: int = 0,
    db: Session = Depends(get_db)
):
    query = db.query(ThermalAnomaly).order_by(ThermalAnomaly.timestamp.desc())

    if source:
        query = query.filter(ThermalAnomaly.source == source)
    if min_frp is not None:
        query = query.filter(ThermalAnomaly.frp >= min_frp)

    records = query.offset(offset).limit(limit).all()
    results = []

    for rec in records:
        clf_class = rec.classification.predicted_class if rec.classification else "Unknown"
        clf_conf = rec.classification.confidence_score if rec.classification else 0.70
        risk_score = rec.risk_assessment.risk_score if rec.risk_assessment else 40.0
        risk_level = rec.risk_assessment.risk_level if rec.risk_assessment else "MEDIUM"
        
        # Apply filter post-join
        if classification and classification.lower() not in clf_class.lower():
            continue
        if severity and severity.upper() != risk_level.upper():
            continue

        nearest_facility = rec.alert.facility_name if rec.alert else "Regional Cluster"

        results.append({
            "id": rec.id,
            "event_id": rec.event_id,
            "latitude": rec.latitude,
            "longitude": rec.longitude,
            "timestamp": rec.timestamp,
            "satellite": rec.satellite,
            "frp": rec.frp,
            "brightness": rec.brightness,
            "source_confidence": rec.source_confidence,
            "daynight": rec.daynight,
            "source": rec.source,
            "processing_status": rec.processing_status,
            "is_simulated": rec.is_simulated,
            "created_at": rec.created_at,
            "classification_class": clf_class,
            "classification_confidence": clf_conf,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "facility_name": nearest_facility
        })

    return results

@router.get("/geojson", response_model=GeoJSONFeatureCollection)
def get_anomalies_geojson(db: Session = Depends(get_db)):
    records = db.query(ThermalAnomaly).all()
    features = []

    for rec in records:
        clf_class = rec.classification.predicted_class if rec.classification else "Unknown Thermal Anomaly"
        risk_score = rec.risk_assessment.risk_score if rec.risk_assessment else 40.0
        risk_level = rec.risk_assessment.risk_level if rec.risk_assessment else "MEDIUM"
        facility = rec.alert.facility_name if rec.alert else "Regional Cluster"

        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [rec.longitude, rec.latitude]
            },
            "properties": {
                "id": rec.id,
                "event_id": rec.event_id,
                "frp": rec.frp,
                "brightness": rec.brightness,
                "satellite": rec.satellite,
                "daynight": rec.daynight,
                "timestamp": rec.timestamp.isoformat(),
                "classification": clf_class,
                "confidence": rec.classification.confidence_score if rec.classification else 0.70,
                "risk_score": risk_score,
                "risk_level": risk_level,
                "facility_name": facility,
                "is_simulated": rec.is_simulated
            }
        })

    return {"type": "FeatureCollection", "features": features}

@router.get("/{id}/intelligence", response_model=AnomalyIntelligenceResponse)
def get_anomaly_intelligence(id: int, db: Session = Depends(get_db)):
    anomaly = db.query(ThermalAnomaly).filter(ThermalAnomaly.id == id).first()
    if not anomaly:
        raise HTTPException(status_code=404, detail=f"Thermal anomaly ID {id} not found.")

    assets = db.query(IndustrialAsset).all()
    history = db.query(TemporalObservation).all()

    # Extract dynamic features
    features = extract_features(anomaly, assets, history)
    
    # Check if precomputed or calculate dynamically
    if not anomaly.classification:
        classification = classifier.classify(features)
        risk = calculate_risk(features, classification)
    else:
        classification = {
            "predicted_class": anomaly.classification.predicted_class,
            "confidence_score": anomaly.classification.confidence_score,
            "class_probabilities": json.loads(anomaly.classification.class_probabilities),
            "supporting_evidence": json.loads(anomaly.classification.supporting_evidence),
            "uncertainty_factors": json.loads(anomaly.classification.uncertainty_factors),
            "feature_contributions": json.loads(anomaly.classification.feature_contributions or "{}"),
            "model_name": anomaly.classification.model_name
        }
        risk = {
            "risk_score": anomaly.risk_assessment.risk_score,
            "risk_level": anomaly.risk_assessment.risk_level,
            "investigation_priority": anomaly.risk_assessment.investigation_priority,
            "components": {
                "intensity": anomaly.risk_assessment.intensity_component,
                "proximity": anomaly.risk_assessment.proximity_component,
                "abnormality": anomaly.risk_assessment.abnormality_component,
                "persistence": anomaly.risk_assessment.persistence_component,
                "criticality": anomaly.risk_assessment.criticality_component,
                "confidence": anomaly.risk_assessment.confidence_component
            },
            "formula_weights": json.loads(anomaly.risk_assessment.formula_weights or "{}")
        }

    temporal = evaluate_persistence_and_baseline(anomaly, history)

    # Investigation data
    if not anomaly.investigation:
        inv = {
            "id": 0,
            "anomaly_id": anomaly.id,
            "status": "NEW",
            "assigned_analyst": "Unassigned",
            "notes": [],
            "recommendation": "Review multi-source evidence and request high-res verification if necessary.",
            "verified_at": None,
            "created_at": anomaly.created_at,
            "updated_at": anomaly.created_at
        }
    else:
        inv_record = anomaly.investigation
        inv = {
            "id": inv_record.id,
            "anomaly_id": anomaly.id,
            "status": inv_record.status,
            "assigned_analyst": inv_record.assigned_analyst,
            "notes": json.loads(inv_record.notes or "[]"),
            "recommendation": inv_record.recommendation,
            "verified_at": inv_record.verified_at,
            "created_at": inv_record.created_at,
            "updated_at": inv_record.updated_at
        }

    # Audit Logs
    audit_records = db.query(AuditLog).filter(AuditLog.entity_id == anomaly.event_id).order_by(AuditLog.timestamp.desc()).all()
    audit_logs = [
        {
            "id": log.id,
            "action": log.action,
            "user_name": log.user_name,
            "details": log.details,
            "timestamp": log.timestamp.strftime("%Y-%m-%d %H:%M:%S UTC")
        }
        for log in audit_records
    ]

    # Record VIEW audit log
    view_log = AuditLog(
        action="EVENT_OPENED",
        entity_type="ANOMALY",
        entity_id=anomaly.event_id,
        user_name="Analyst Demo",
        details="Accessed full intelligence dossier."
    )
    db.add(view_log)
    db.commit()

    return {
        "event": {
            "id": anomaly.id,
            "event_id": anomaly.event_id,
            "latitude": anomaly.latitude,
            "longitude": anomaly.longitude,
            "timestamp": anomaly.timestamp,
            "satellite": anomaly.satellite,
            "frp": anomaly.frp,
            "brightness": anomaly.brightness,
            "source_confidence": anomaly.source_confidence,
            "daynight": anomaly.daynight,
            "source": anomaly.source,
            "processing_status": anomaly.processing_status,
            "is_simulated": anomaly.is_simulated,
            "created_at": anomaly.created_at,
            "classification_class": classification["predicted_class"],
            "classification_confidence": classification["confidence_score"],
            "risk_score": risk["risk_score"],
            "risk_level": risk["risk_level"],
            "facility_name": features["nearest_asset_name"]
        },
        "spatial": {
            "nearest_asset_name": features["nearest_asset_name"],
            "nearest_asset_id": features["nearest_asset_id"],
            "distance_to_nearest_asset_m": features["distance_to_nearest_asset_m"],
            "is_inside_boundary": bool(features["is_inside_boundary"]),
            "distance_to_boundary_m": features["distance_to_boundary_m"],
            "asset_category": features["asset_category"],
            "land_context": features["land_context"],
            "settlement_distance_m": features["settlement_distance_m"]
        },
        "thermal": {
            "frp": anomaly.frp,
            "brightness": anomaly.brightness,
            "daynight": anomaly.daynight,
            "satellite": anomaly.satellite,
            "source_confidence": anomaly.source_confidence
        },
        "temporal": temporal,
        "classification": classification,
        "risk": risk,
        "investigation": inv,
        "audit_logs": audit_logs,
        "source_metadata": {
            "source_provider": anomaly.source,
            "processing_pipeline": "ThermoScope AI Automated Thermal Fusion Engine",
            "is_simulated_record": anomaly.is_simulated,
            "generated_at": datetime.utcnow()
        }
    }

@router.get("/{id}/history")
def get_anomaly_history(id: int, db: Session = Depends(get_db)):
    anomaly = db.query(ThermalAnomaly).filter(ThermalAnomaly.id == id).first()
    if not anomaly:
        raise HTTPException(status_code=404, detail="Anomaly not found")
    
    # Get nearby temporal observations
    history = db.query(TemporalObservation).all()
    from app.services.geospatial import haversine_distance_meters
    nearby = []
    for o in history:
        if haversine_distance_meters(anomaly.latitude, anomaly.longitude, o.latitude, o.longitude) <= 4000.0:
            nearby.append({
                "timestamp": o.timestamp.isoformat(),
                "frp": o.frp,
                "daynight": o.daynight,
                "satellite": o.satellite
            })
    return sorted(nearby, key=lambda x: x["timestamp"])
