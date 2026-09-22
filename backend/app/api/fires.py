"""API endpoints for Fire and Thermal Anomaly Detections.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc

from backend.app.database import get_db
from backend.app.models.models import FireDetection, FirePrediction
from backend.app.schemas.schemas import (
    FireDetectionSchema, FireListResponse, FirePredictionSchema, SatelliteContextResponse
)
from backend.app.services.geospatial_service import haversine_distance_km
from backend.app.services.satellite_service import get_satellite_context_image

router = APIRouter(prefix="/api/fires", tags=["Fire Detections"])


@router.get("", response_model=FireListResponse)
def list_fires(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=200),
    severity: Optional[str] = Query(None, description="Filter by severity: LOW, MEDIUM, HIGH, CRITICAL"),
    predicted_class: Optional[str] = Query(None, description="Filter by predicted class"),
    min_confidence: Optional[float] = Query(None, ge=0.0, le=100.0),
    sensor: Optional[str] = Query(None),
    is_industrial_only: bool = Query(False),
    db: Session = Depends(get_db)
):
    """List fire detections with pagination, multi-criteria filtering, and joined predictions."""
    query = db.query(FireDetection).options(joinedload(FireDetection.prediction))

    if severity:
        query = query.join(FirePrediction).filter(FirePrediction.severity == severity.upper())

    if predicted_class:
        query = query.join(FirePrediction).filter(FirePrediction.predicted_class.ilike(f"%{predicted_class}%"))

    if min_confidence is not None:
        query = query.filter(FireDetection.confidence >= min_confidence)

    if sensor:
        query = query.filter(FireDetection.sensor.ilike(f"%{sensor}%"))

    if is_industrial_only:
        query = query.join(FirePrediction).filter(
            FirePrediction.predicted_class.in_(["Industrial Fire", "Gas Flare / Persistent Thermal Source", "Mining / Industrial Thermal Activity"])
        )

    total = query.count()
    items = query.order_by(desc(FireDetection.detection_time)).offset((page - 1) * page_size).limit(page_size).all()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": [item.to_dict() for item in items]
    }


@router.get("/active", response_model=List[FireDetectionSchema])
def get_active_fires(
    hours: int = Query(48, ge=1, le=168, description="Time window in hours"),
    db: Session = Depends(get_db)
):
    """Retrieve all active fire detections within the specified time window for GIS map layer."""
    cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
    fires = (
        db.query(FireDetection)
        .options(joinedload(FireDetection.prediction))
        .filter(FireDetection.detection_time >= cutoff)
        .order_by(desc(FireDetection.detection_time))
        .all()
    )
    # If database is fresh or has historical records outside cutoff, return latest 100
    if not fires:
        fires = (
            db.query(FireDetection)
            .options(joinedload(FireDetection.prediction))
            .order_by(desc(FireDetection.detection_time))
            .limit(100)
            .all()
        )

    return [f.to_dict() for f in fires]


@router.get("/nearby", response_model=List[FireDetectionSchema])
def get_nearby_fires(
    lat: float = Query(..., ge=-90.0, le=90.0),
    lon: float = Query(..., ge=-180.0, le=180.0),
    radius_km: float = Query(25.0, ge=1.0, le=200.0),
    db: Session = Depends(get_db)
):
    """Query fire detections within radius_km of a geographic coordinate."""
    # Bounding box pre-filter for performance
    delta_lat = radius_km / 111.0
    delta_lon = radius_km / (111.0 * max(0.1, abs(3.14159 / 180.0 * lat)))

    candidates = (
        db.query(FireDetection)
        .options(joinedload(FireDetection.prediction))
        .filter(
            FireDetection.latitude >= lat - delta_lat,
            FireDetection.latitude <= lat + delta_lat,
            FireDetection.longitude >= lon - delta_lon,
            FireDetection.longitude <= lon + delta_lon
        )
        .all()
    )

    results = []
    for c in candidates:
        d = haversine_distance_km(lat, lon, c.latitude, c.longitude)
        if d <= radius_km:
            results.append(c.to_dict())

    return results


@router.get("/{id}", response_model=FireDetectionSchema)
def get_fire_by_id(id: str, db: Session = Depends(get_db)):
    """Retrieve detailed information for a single thermal anomaly."""
    fire = (
        db.query(FireDetection)
        .options(joinedload(FireDetection.prediction))
        .filter(FireDetection.id == id)
        .first()
    )
    if not fire:
        raise HTTPException(status_code=404, detail=f"Thermal detection '{id}' not found.")
    return fire.to_dict()


@router.get("/{id}/prediction", response_model=FirePredictionSchema)
def get_fire_prediction(id: str, db: Session = Depends(get_db)):
    """Retrieve the AI classification prediction and class probabilities."""
    pred = db.query(FirePrediction).filter(FirePrediction.fire_detection_id == id).first()
    if not pred:
        raise HTTPException(status_code=404, detail=f"Prediction for detection '{id}' not found.")
    return pred.to_dict()


@router.get("/{id}/risk")
def get_fire_risk(id: str, db: Session = Depends(get_db)):
    """Retrieve detailed multi-factor risk components."""
    pred = db.query(FirePrediction).filter(FirePrediction.fire_detection_id == id).first()
    if not pred:
        raise HTTPException(status_code=404, detail=f"Risk assessment for detection '{id}' not found.")

    return {
        "fire_detection_id": pred.fire_detection_id,
        "risk_score": pred.risk_score,
        "severity": pred.severity,
        "recommended_response": pred.recommended_response,
        "nearby_industrial_name": pred.nearby_industrial_name,
        "distance_to_industrial_km": pred.distance_to_industrial_km,
        "nearby_residential_name": pred.nearby_residential_name,
        "distance_to_residential_km": pred.distance_to_residential_km
    }


@router.get("/{id}/satellite", response_model=SatelliteContextResponse)
def get_fire_satellite_context(id: str, db: Session = Depends(get_db)):
    """Retrieve satellite/context imagery for this detection via SatelliteProvider."""
    fire = db.query(FireDetection).filter(FireDetection.id == id).first()
    if not fire:
        raise HTTPException(status_code=404, detail=f"Detection '{id}' not found.")

    res = get_satellite_context_image(fire.latitude, fire.longitude, fire.detection_time)
    return res
