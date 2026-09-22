"""API endpoints for Alert Management and Operations.
"""

from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.database import get_db
from backend.app.models.models import Alert
from backend.app.schemas.schemas import AlertSchema, AlertAcknowledgeRequest, AlertResolveRequest

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])


@router.get("", response_model=List[AlertSchema])
def list_alerts(
    status: Optional[str] = Query(None, description="NEW, ACKNOWLEDGED, RESOLVED"),
    severity: Optional[str] = Query(None, description="CRITICAL, HIGH, MEDIUM, LOW"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """List operational alerts filtered by status and severity."""
    query = db.query(Alert)

    if status:
        query = query.filter(Alert.status == status.upper())

    if severity:
        query = query.filter(Alert.severity == severity.upper())

    alerts = query.order_by(desc(Alert.created_at)).limit(limit).all()
    return [a.to_dict() for a in alerts]


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
    return alert.to_dict()
