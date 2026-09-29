"""Global Search API endpoint across all core entities.
"""

from typing import Dict, Any, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from backend.app.database import get_db
from backend.app.models.models import FireDetection, Incident, IndustrialSite, Alert

router = APIRouter(prefix="/api/search", tags=["Global Search"])


@router.get("")
def global_search(
    q: str = Query(..., min_length=1, description="Search term"),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Unified search across fires, incidents, monitored facilities, and alerts."""
    term = f"%{q.strip()}%"

    # 1. Search Incidents
    incidents = (
        db.query(Incident)
        .filter(or_(Incident.id.ilike(term), Incident.title.ilike(term), Incident.primary_class.ilike(term), Incident.nearby_facility_name.ilike(term)))
        .order_by(desc(Incident.last_detected_at))
        .limit(limit)
        .all()
    )

    # 2. Search Industrial Facilities
    facilities = (
        db.query(IndustrialSite)
        .filter(or_(IndustrialSite.name.ilike(term), IndustrialSite.type.ilike(term), IndustrialSite.id.ilike(term)))
        .limit(limit)
        .all()
    )

    # 3. Search Fire Detections
    fires = (
        db.query(FireDetection)
        .filter(or_(FireDetection.id.ilike(term), FireDetection.sensor.ilike(term), FireDetection.satellite.ilike(term)))
        .order_by(desc(FireDetection.detection_time))
        .limit(limit)
        .all()
    )

    # 4. Search Alerts
    alerts = (
        db.query(Alert)
        .filter(or_(Alert.title.ilike(term), Alert.id.ilike(term), Alert.facility_name.ilike(term), Alert.message.ilike(term)))
        .order_by(desc(Alert.created_at))
        .limit(limit)
        .all()
    )

    return {
        "query": q,
        "total_results": len(incidents) + len(facilities) + len(fires) + len(alerts),
        "results": {
            "incidents": [inc.to_dict() for inc in incidents],
            "facilities": [f.to_dict() for f in facilities],
            "fires": [f.to_dict() for f in fires],
            "alerts": [a.to_dict() for a in alerts]
        }
    }
