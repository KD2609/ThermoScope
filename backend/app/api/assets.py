import json
from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import IndustrialAsset, ThermalAnomaly, TemporalObservation
from app.schemas.schemas import AssetResponse
from app.services.geospatial import haversine_distance_meters

router = APIRouter(prefix="/api/assets", tags=["Industrial Assets"])

@router.get("", response_model=list[dict[str, Any]])
def list_assets(db: Session = Depends(get_db)):
    assets = db.query(IndustrialAsset).all()
    anomalies = db.query(ThermalAnomaly).all()
    history = db.query(TemporalObservation).all()

    results = []
    for asset in assets:
        # Count anomalies within context radius
        active_count = 0
        current_highest_risk = "LOW"
        
        for anom in anomalies:
            d = haversine_distance_meters(asset.latitude, asset.longitude, anom.latitude, anom.longitude)
            if d <= asset.radius_meters:
                active_count += 1
                if anom.risk_assessment:
                    level = anom.risk_assessment.risk_level
                    if level == "CRITICAL":
                        current_highest_risk = "CRITICAL"
                    elif level == "HIGH" and current_highest_risk != "CRITICAL":
                        current_highest_risk = "HIGH"
                    elif level == "MEDIUM" and current_highest_risk in ["LOW"]:
                        current_highest_risk = "MEDIUM"

        hist_count = sum(1 for h in history if haversine_distance_meters(asset.latitude, asset.longitude, h.latitude, h.longitude) <= asset.radius_meters)

        results.append({
            "id": asset.id,
            "asset_id": asset.asset_id,
            "name": asset.name,
            "category": asset.category,
            "latitude": asset.latitude,
            "longitude": asset.longitude,
            "boundary_geojson": asset.boundary_geojson,
            "radius_meters": asset.radius_meters,
            "operational_status": asset.operational_status,
            "criticality_level": asset.criticality_level,
            "source": asset.source,
            "source_confidence": asset.source_confidence,
            "baseline_frp_min": asset.baseline_frp_min,
            "baseline_frp_max": asset.baseline_frp_max,
            "baseline_frp_median": asset.baseline_frp_median,
            "baseline_count": asset.baseline_count,
            "last_updated": asset.last_updated,
            "active_anomalies_count": active_count,
            "historical_observations_count": hist_count,
            "current_risk_level": current_highest_risk,
            "persistence_detected": hist_count >= 10
        })

    return results

@router.get("/{id}")
def get_asset_details(id: int, db: Session = Depends(get_db)):
    asset = db.query(IndustrialAsset).filter(IndustrialAsset.id == id).first()
    if not asset:
        raise HTTPException(status_code=404, detail=f"Asset ID {id} not found.")

    # Find associated anomalies
    anomalies = db.query(ThermalAnomaly).all()
    nearby_anoms = []
    for a in anomalies:
        if haversine_distance_meters(asset.latitude, asset.longitude, a.latitude, a.longitude) <= asset.radius_meters:
            nearby_anoms.append({
                "id": a.id,
                "event_id": a.event_id,
                "frp": a.frp,
                "timestamp": a.timestamp.isoformat(),
                "classification": a.classification.predicted_class if a.classification else "Unknown",
                "risk_level": a.risk_assessment.risk_level if a.risk_assessment else "LOW"
            })

    # Historical observations
    history = db.query(TemporalObservation).all()
    nearby_hist = [
        {"timestamp": h.timestamp.isoformat(), "frp": h.frp, "satellite": h.satellite, "daynight": h.daynight}
        for h in history
        if haversine_distance_meters(asset.latitude, asset.longitude, h.latitude, h.longitude) <= asset.radius_meters
    ]

    return {
        "asset": {
            "id": asset.id,
            "asset_id": asset.asset_id,
            "name": asset.name,
            "category": asset.category,
            "latitude": asset.latitude,
            "longitude": asset.longitude,
            "boundary_geojson": asset.boundary_geojson,
            "radius_meters": asset.radius_meters,
            "operational_status": asset.operational_status,
            "criticality_level": asset.criticality_level,
            "source": asset.source,
            "source_confidence": asset.source_confidence,
            "baseline_frp_min": asset.baseline_frp_min,
            "baseline_frp_max": asset.baseline_frp_max,
            "baseline_frp_median": asset.baseline_frp_median,
            "baseline_count": asset.baseline_count
        },
        "active_anomalies": nearby_anoms,
        "historical_observations": sorted(nearby_hist, key=lambda x: x["timestamp"]),
        "summary": {
            "active_count": len(nearby_anoms),
            "historical_count": len(nearby_hist),
            "persistence_status": "HIGH RECURRENCE" if len(nearby_hist) >= 15 else "NORMAL"
        }
    }
