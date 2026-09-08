import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Investigation, ThermalAnomaly, AuditLog
from app.schemas.schemas import UpdateInvestigationRequest, AddNoteRequest

router = APIRouter(prefix="/api/investigations", tags=["Investigations"])

@router.patch("/{id}")
def update_investigation(id: int, req: UpdateInvestigationRequest, db: Session = Depends(get_db)):
    inv = db.query(Investigation).filter(Investigation.id == id).first()
    if not inv:
        raise HTTPException(status_code=404, detail=f"Investigation ID {id} not found.")

    old_status = inv.status
    if req.status:
        inv.status = req.status
        if req.status in ["VERIFIED", "RESOLVED"]:
            inv.verified_at = datetime.utcnow()

    if req.assigned_analyst:
        inv.assigned_analyst = req.assigned_analyst

    if req.recommendation:
        inv.recommendation = req.recommendation

    inv.updated_at = datetime.utcnow()

    # Record Audit Log
    anom = db.query(ThermalAnomaly).filter(ThermalAnomaly.id == inv.anomaly_id).first()
    entity_id = anom.event_id if anom else f"INV-{inv.id}"
    
    details = f"Investigation updated: status {old_status} -> {inv.status}, assigned to {inv.assigned_analyst}."
    audit = AuditLog(
        action="STATUS_CHANGED" if req.status and req.status != old_status else "ASSIGNMENT_CHANGED",
        entity_type="INVESTIGATION",
        entity_id=entity_id,
        user_name=req.author,
        details=details
    )
    db.add(audit)
    db.commit()
    db.refresh(inv)

    return {
        "status": "SUCCESS",
        "message": "Investigation updated successfully.",
        "investigation": {
            "id": inv.id,
            "status": inv.status,
            "assigned_analyst": inv.assigned_analyst,
            "recommendation": inv.recommendation,
            "updated_at": inv.updated_at
        }
    }

@router.post("/{id}/notes")
def add_investigation_note(id: int, req: AddNoteRequest, db: Session = Depends(get_db)):
    inv = db.query(Investigation).filter(Investigation.id == id).first()
    if not inv:
        raise HTTPException(status_code=404, detail=f"Investigation ID {id} not found.")

    notes = json.loads(inv.notes or "[]")
    new_note = {
        "id": f"NOTE-{len(notes) + 1}",
        "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
        "author": req.author,
        "text": req.text
    }
    notes.append(new_note)
    inv.notes = json.dumps(notes)
    inv.updated_at = datetime.utcnow()

    anom = db.query(ThermalAnomaly).filter(ThermalAnomaly.id == inv.anomaly_id).first()
    entity_id = anom.event_id if anom else f"INV-{inv.id}"

    audit = AuditLog(
        action="NOTE_ADDED",
        entity_type="INVESTIGATION",
        entity_id=entity_id,
        user_name=req.author,
        details=f"Analyst note added: '{req.text[:60]}...'"
    )
    db.add(audit)
    db.commit()

    return {"status": "SUCCESS", "message": "Note recorded.", "note": new_note, "notes": notes}
