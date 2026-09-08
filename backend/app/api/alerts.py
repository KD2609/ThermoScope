from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Alert, AuditLog
from app.schemas.schemas import AlertResponse, AlertActionRequest

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])

@router.get("", response_model=list[AlertResponse])
def list_alerts(
    severity: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Alert).order_by(Alert.created_at.desc())
    if severity:
        query = query.filter(Alert.severity == severity.upper())
    if status:
        query = query.filter(Alert.status == status.upper())
    return query.all()

@router.post("/{id}/acknowledge")
def acknowledge_alert(id: int, req: AlertActionRequest, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == id).first()
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert ID {id} not found.")

    alert.status = "ACKNOWLEDGED"
    alert.updated_at = datetime.utcnow()

    # Log action
    log = AuditLog(
        action="ALERT_ACKNOWLEDGED",
        entity_type="ALERT",
        entity_id=alert.alert_id,
        user_name=req.user_name,
        details=f"Alert {alert.alert_id} acknowledged by {req.user_name}."
    )
    db.add(log)
    db.commit()
    db.refresh(alert)
    return {"status": "SUCCESS", "message": f"Alert {alert.alert_id} acknowledged.", "alert": alert}

@router.post("/{id}/assign")
def assign_alert(id: int, req: AlertActionRequest, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == id).first()
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert ID {id} not found.")

    assigned_to = req.assigned_to or "Emergency Dispatch Officer"
    alert.assigned_to = assigned_to
    alert.status = "UNDER_REVIEW"
    alert.updated_at = datetime.utcnow()

    log = AuditLog(
        action="ASSIGNMENT_CHANGED",
        entity_type="ALERT",
        entity_id=alert.alert_id,
        user_name=req.user_name,
        details=f"Alert assigned to {assigned_to}."
    )
    db.add(log)
    db.commit()
    db.refresh(alert)
    return {"status": "SUCCESS", "message": f"Alert assigned to {assigned_to}.", "alert": alert}

@router.post("/{id}/resolve")
def resolve_alert(id: int, req: AlertActionRequest, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == id).first()
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert ID {id} not found.")

    alert.status = "RESOLVED"
    alert.updated_at = datetime.utcnow()

    log = AuditLog(
        action="STATUS_CHANGED",
        entity_type="ALERT",
        entity_id=alert.alert_id,
        user_name=req.user_name,
        details=f"Alert resolved by {req.user_name}."
    )
    db.add(log)
    db.commit()
    db.refresh(alert)
    return {"status": "SUCCESS", "message": f"Alert {alert.alert_id} resolved.", "alert": alert}
