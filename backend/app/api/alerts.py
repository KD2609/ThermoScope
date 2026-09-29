import time
from datetime import datetime, timezone
from typing import List, Optional, Dict, Tuple
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from backend.app.database import get_db
from backend.app.models.models import Alert
from backend.app.schemas.schemas import AlertSchema, AlertAcknowledgeRequest, AlertResolveRequest, AlertCountResponse

from backend.app.services.cache_service import memory_cache

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])


def invalidate_alert_count_cache():
    """Clear cached alert counts and listings on state-mutating actions (acknowledge, resolve, new alert)."""
    memory_cache.invalidate_prefix("alerts:")
    memory_cache.invalidate_prefix("alerts_count:")


@router.get("", response_model=List[AlertSchema])
def list_alerts(
    status: Optional[str] = Query(None, description="NEW, ACKNOWLEDGED, RESOLVED"),
    severity: Optional[str] = Query(None, description="CRITICAL, HIGH, MEDIUM, LOW"),
    limit: int = Query(50, ge=1, le=200),
    page: int = Query(1, ge=1),
    db: Session = Depends(get_db)
):
    """List operational alerts filtered by status and severity with pagination."""
    cache_key = f"alerts:{status}:{severity}:{page}:{limit}"
    cached = memory_cache.get(cache_key)
    if cached is not None:
        return cached

    query = db.query(Alert)

    if status and status.upper() != "ALL":
        query = query.filter(Alert.status == status.upper())

    if severity and severity.upper() != "ALL":
        query = query.filter(Alert.severity == severity.upper())

    page_num = page if isinstance(page, int) else 1
    limit_num = limit if isinstance(limit, int) else 50
    offset = (page_num - 1) * limit_num
    alerts = query.order_by(desc(Alert.created_at)).offset(offset).limit(limit_num).all()
    result = [a.to_dict() for a in alerts]
    memory_cache.set(cache_key, result, ttl=15.0)
    return result


@router.get("/count", response_model=AlertCountResponse)
def get_alerts_count(
    status: Optional[str] = Query("NEW", description="Filter by status (NEW, ACKNOWLEDGED, RESOLVED, ALL)"),
    severity: Optional[str] = Query(None, description="CRITICAL, HIGH, MEDIUM, LOW"),
    db: Session = Depends(get_db)
):
    """Retrieve fast, real-time count of alerts matching filter criteria utilizing index."""
    query = db.query(func.count(Alert.id))
    if status and status.upper() != "ALL":
        query = query.filter(Alert.status == status.upper())
    if severity and severity.upper() != "ALL":
        query = query.filter(Alert.severity == severity.upper())

    count = query.scalar() or 0
    return {"count": count, "status": status}


@router.get("/{id}", response_model=AlertSchema)
def get_alert_by_id(id: str, db: Session = Depends(get_db)):
    """Retrieve detailed information for a single alert."""
    alert = db.query(Alert).filter(Alert.id == id).first()
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert '{id}' not found.")
    return alert.to_dict()


@router.post("/{id}/acknowledge", response_model=AlertSchema)
def acknowledge_alert(
    id: str,
    payload: AlertAcknowledgeRequest,
    db: Session = Depends(get_db)
):
    """Mark an alert as ACKNOWLEDGED by an authorized user."""
    alert = db.query(Alert).filter(Alert.id == id).first()
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert '{id}' not found.")

    alert.status = "ACKNOWLEDGED"
    alert.acknowledged_by = payload.user_name
    alert.acknowledged_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(alert)
    invalidate_alert_count_cache()

    try:
        from backend.app.services.realtime_service import broadcast_event
        broadcast_event("alert_acknowledged", alert.to_dict())
    except Exception:
        pass

    return alert.to_dict()


@router.post("/{id}/resolve", response_model=AlertSchema)
def resolve_alert(
    id: str,
    payload: AlertResolveRequest,
    db: Session = Depends(get_db)
):
    """Mark an alert as RESOLVED with operational resolution notes."""
    alert = db.query(Alert).filter(Alert.id == id).first()
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert '{id}' not found.")

    alert.status = "RESOLVED"
    alert.resolved_at = datetime.now(timezone.utc)
    alert.resolution_notes = payload.notes
    db.commit()
    db.refresh(alert)
    invalidate_alert_count_cache()

    try:
        from backend.app.services.realtime_service import broadcast_event
        broadcast_event("alert_resolved", alert.to_dict())
    except Exception:
        pass

    return alert.to_dict()


@router.post("/{id}/assign", response_model=AlertSchema)
def assign_alert(
    id: str,
    user_name: str = Query(..., description="Analyst or responder name"),
    db: Session = Depends(get_db)
):
    """Assign alert to an analyst or responder for active monitoring."""
    alert = db.query(Alert).filter(Alert.id == id).first()
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert '{id}' not found.")

    alert.assigned_to = user_name
    alert.assigned_at = datetime.now(timezone.utc)
    if alert.status == "NEW":
        alert.status = "ACKNOWLEDGED"
        alert.acknowledged_by = user_name
        alert.acknowledged_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(alert)
    invalidate_alert_count_cache()

    try:
        from backend.app.services.realtime_service import broadcast_event
        broadcast_event("alert_assigned", alert.to_dict())
    except Exception:
        pass

    return alert.to_dict()


@router.post("/{id}/escalate", response_model=AlertSchema)
def escalate_alert(
    id: str,
    reason: Optional[str] = Query(None, description="Reason for escalation"),
    db: Session = Depends(get_db)
):
    """Escalate alert severity (e.g. from HIGH to CRITICAL)."""
    alert = db.query(Alert).filter(Alert.id == id).first()
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert '{id}' not found.")

    now_utc = datetime.now(timezone.utc)
    escalation_order = {"LOW": "MEDIUM", "MEDIUM": "HIGH", "HIGH": "CRITICAL", "CRITICAL": "CRITICAL"}
    old_sev = alert.severity
    new_sev = escalation_order.get(old_sev, "CRITICAL")
    alert.severity = new_sev
    alert.escalation_level = (alert.escalation_level or 1) + 1
    alert.escalated_at = now_utc
    if reason:
        alert.message += f" [MANUAL ESCALATION ({new_sev}): {reason}]"

    db.commit()
    db.refresh(alert)

    try:
        from backend.app.services.realtime_service import broadcast_event
        broadcast_event("alert_escalated", alert.to_dict())
    except Exception:
        pass

    return alert.to_dict()
