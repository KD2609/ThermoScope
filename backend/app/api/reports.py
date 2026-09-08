from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.api.anomalies import get_anomaly_intelligence
from app.services.reports import generate_incident_report_html
from app.models.models import AuditLog

router = APIRouter(prefix="/api/incidents", tags=["Reports"])

@router.get("/{id}/report")
def get_incident_report(id: int, format: str = "html", db: Session = Depends(get_db)):
    intel = get_anomaly_intelligence(id=id, db=db)
    
    # Log report generation
    audit = AuditLog(
        action="REPORT_GENERATED",
        entity_type="ANOMALY",
        entity_id=intel["event"]["event_id"],
        user_name="Analyst Demo",
        details="Generated official Incident Intelligence Dossier."
    )
    db.add(audit)
    db.commit()

    if format.lower() == "html":
        html_doc = generate_incident_report_html(intel)
        return Response(content=html_doc, media_type="text/html")
    
    return intel
