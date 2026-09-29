"""API endpoints for Persistent Hotspot Engine and Dynamic Rankings.
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.schemas.schemas import HotspotSchema
from backend.app.services.hotspot_service import get_persistent_hotspots, get_hotspot_rankings

router = APIRouter(prefix="/api/hotspots", tags=["Hotspots"])


@router.get("", response_model=List[HotspotSchema])
@router.get("/list")
def list_persistent_hotspots(
    days: Optional[int] = Query(None, description="Analysis window in days (e.g. 30 or 90)"),
    window_days: Optional[int] = Query(None, description="Analysis window in days (e.g. 30 or 90)"),
    db: Session = Depends(get_db)
):
    """Retrieve recurring spatial thermal hotspots across the specified observation window."""
    w_days = window_days if window_days is not None else (days if days is not None else 30)
    return get_persistent_hotspots(db, window_days=w_days)


@router.get("/rankings")
@router.get("/ranking")
def get_ranked_hotspots(
    days: Optional[int] = Query(None, description="Analysis window in days"),
    window_days: Optional[int] = Query(None, description="Analysis window in days"),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """Return top dynamically ranked persistent hotspots sorted by recurrence and intensity."""
    w_days = window_days if window_days is not None else (days if days is not None else 30)
    ranked = get_hotspot_rankings(db, window_days=w_days, limit=limit)
    return {
        "count": len(ranked),
        "window_days": w_days,
        "rankings": ranked,
        "data": ranked
    }
