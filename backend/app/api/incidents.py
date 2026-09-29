"""API endpoints for Incident Clustering, Lifecycle, Trajectory, and Replay.
"""

from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc

from backend.app.database import get_db
from backend.app.models.models import Incident, FireDetection
from backend.app.schemas.schemas import (
    IncidentSchema,
    IncidentListResponse,
    IncidentStatusUpdateRequest,
    IncidentAssignRequest,
    IncidentTrajectoryResponse
)
from backend.app.services.incident_service import (
    calculate_incident_trajectory,
    get_incident_timeline,
    get_incident_replay_states,
    cluster_detections_into_incidents
)
from backend.app.services.impact_service import evaluate_fire_impact

router = APIRouter(prefix="/api/incidents", tags=["Incidents"])


from backend.app.services.cache_service import memory_cache


@router.get("", response_model=IncidentListResponse)
def list_incidents(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    status: Optional[str] = Query(None, description="NEW, INVESTIGATING, CONFIRMED, CONTAINED, CLOSED"),
    severity: Optional[str] = Query(None, description="LOW, MEDIUM, HIGH, CRITICAL"),
    db: Session = Depends(get_db)
):
    """List clustered fire incidents with pagination and status/severity filters."""
    cache_key = f"incidents:list:{status}:{severity}:{page}:{page_size}"
    cached = memory_cache.get(cache_key)
    if cached is not None:
        return cached

    query = db.query(Incident)

    if status:
        query = query.filter(Incident.status == status.upper())

    if severity:
        query = query.filter(Incident.severity == severity.upper())

    items = (
        query.order_by(desc(Incident.last_detected_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    if page == 1 and len(items) < page_size:
        total = len(items)
    else:
        total = query.count()

    result = {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": [inc.to_dict() for inc in items]
    }
    memory_cache.set(cache_key, result, ttl=30.0)
    return result


@router.get("/{id}", response_model=IncidentSchema)
def get_incident_by_id(id: str, db: Session = Depends(get_db)):
    """Retrieve detailed information for a single incident including all member detections."""
    inc = (
        db.query(Incident)
        .options(joinedload(Incident.detections))
        .filter(Incident.id == id)
        .first()
    )
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident '{id}' not found.")
    return inc.to_dict(include_detections=True)


@router.get("/{id}/timeline")
def get_incident_timeline_endpoint(id: str, db: Session = Depends(get_db)):
    """Retrieve unified chronological events: detections, risk changes, alerts, reviews, and resolution."""
    inc = db.query(Incident).filter(Incident.id == id).first()
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident '{id}' not found.")
    return {
        "incident_id": inc.id,
        "title": inc.title,
        "status": inc.status,
        "timeline": get_incident_timeline(inc, db)
    }


@router.get("/{id}/movement", response_model=IncidentTrajectoryResponse)
def get_incident_movement_endpoint(id: str, db: Session = Depends(get_db)):
    """Retrieve observed movement trajectory, velocity, displacement vector, and ambient wind correlation."""
    inc = db.query(Incident).filter(Incident.id == id).first()
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident '{id}' not found.")
    return calculate_incident_trajectory(inc, db)


@router.get("/{id}/replay")
def get_incident_replay_endpoint(id: str, db: Session = Depends(get_db)):
    """Retrieve step-by-step state snapshots for interactive replay in the frontend."""
    inc = db.query(Incident).filter(Incident.id == id).first()
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident '{id}' not found.")
    return {
        "incident_id": inc.id,
        "title": inc.title,
        "steps": get_incident_replay_states(inc, db)
    }


@router.get("/{id}/impact")
def get_incident_impact_endpoint(id: str, db: Session = Depends(get_db)):
    """Evaluate nearby facilities, residential settlements, and population exposure for this incident."""
    inc = db.query(Incident).filter(Incident.id == id).first()
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident '{id}' not found.")
    
    # Use centroid as virtual fire observation
    latest_det = db.query(FireDetection).filter(FireDetection.incident_id == inc.id).order_by(desc(FireDetection.detection_time)).first()
    if latest_det:
        return evaluate_fire_impact(latest_det, db)

    # Fallback to centroid if no detections linked
    dummy_det = FireDetection(
        id=inc.id,
        latitude=inc.latitude,
        longitude=inc.longitude,
        detection_time=inc.last_detected_at,
        brightness_temperature=350.0,
        frp=inc.max_frp,
        confidence=80.0
    )
    return evaluate_fire_impact(dummy_det, db)


@router.patch("/{id}/status", response_model=IncidentSchema)
def update_incident_status(
    id: str,
    payload: IncidentStatusUpdateRequest,
    db: Session = Depends(get_db)
):
    """Transition incident lifecycle: NEW -> INVESTIGATING -> CONFIRMED -> CONTAINED -> CLOSED."""
    inc = db.query(Incident).filter(Incident.id == id).first()
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident '{id}' not found.")

    valid_statuses = ["NEW", "INVESTIGATING", "CONFIRMED", "CONTAINED", "CLOSED"]
    new_status = payload.status.upper()
    if new_status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status '{payload.status}'. Valid choices: {', '.join(valid_statuses)}"
        )

    inc.status = new_status
    if payload.notes:
        inc.summary = (inc.summary or "") + f"\n[{datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}] Status changed to {new_status}: {payload.notes}"

    if new_status == "CLOSED":
        inc.closed_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(inc)
    memory_cache.invalidate_prefix("incidents:")

    # Broadcast incident update event
    try:
        from backend.app.services.realtime_service import broadcast_event
        broadcast_event("incident_updated", inc.to_dict())
    except Exception:
        pass

    return inc.to_dict(include_detections=True)


@router.post("/{id}/assign", response_model=IncidentSchema)
def assign_incident(
    id: str,
    payload: IncidentAssignRequest,
    db: Session = Depends(get_db)
):
    """Assign incident to an authorized responder or analyst."""
    inc = db.query(Incident).filter(Incident.id == id).first()
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident '{id}' not found.")

    inc.assigned_to = payload.assigned_to
    inc.assigned_at = datetime.now(timezone.utc)
    if inc.status == "NEW":
        inc.status = "INVESTIGATING"

    db.commit()
    db.refresh(inc)
    memory_cache.invalidate_prefix("incidents:")
    return inc.to_dict()
