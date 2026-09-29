"""API endpoints for Facility Watchlist and Surveillance Alerts.
"""

from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc

from backend.app.database import get_db
from backend.app.models.models import FacilityWatchlist, IndustrialSite, FireDetection
from backend.app.schemas.schemas import WatchlistSchema, WatchlistCreateRequest
from backend.app.services.facility_analytics_service import get_facility_risk_profile

router = APIRouter(prefix="/api/watchlist", tags=["Watchlist"])


@router.get("", response_model=List[WatchlistSchema])
def list_watchlist(user_email: Optional[str] = Query(None), db: Session = Depends(get_db)):
    """Retrieve all monitored facilities with real-time risk profile and nearest active fire."""
    query = db.query(FacilityWatchlist).options(joinedload(FacilityWatchlist.facility))
    if user_email:
        query = query.filter(FacilityWatchlist.user_email == user_email)

    items = query.order_by(desc(FacilityWatchlist.created_at)).all()
    results = []
    for item in items:
        prof = get_facility_risk_profile(item.facility_id, db) if item.facility_id else None
        res_dict = item.to_dict()
        res_dict["latest_activity"] = prof
        results.append(res_dict)

    return results


@router.post("", response_model=WatchlistSchema)
def add_to_watchlist(payload: WatchlistCreateRequest, db: Session = Depends(get_db)):
    """Add a critical facility to the analyst watchlist."""
    facility = db.query(IndustrialSite).filter(IndustrialSite.id == payload.facility_id).first()
    if not facility:
        raise HTTPException(status_code=404, detail=f"Facility '{payload.facility_id}' not found.")

    existing = (
        db.query(FacilityWatchlist)
        .filter(
            FacilityWatchlist.facility_id == payload.facility_id,
            FacilityWatchlist.user_email == payload.user_email
        )
        .first()
    )
    if existing:
        return existing.to_dict()

    watch = FacilityWatchlist(
        facility_id=payload.facility_id,
        user_email=payload.user_email,
        notes=payload.notes,
        created_at=datetime.now(timezone.utc)
    )
    db.add(watch)
    db.commit()
    db.refresh(watch)
    return watch.to_dict()


@router.delete("/{id}")
def remove_from_watchlist(id: int, db: Session = Depends(get_db)):
    """Remove a facility from the analyst watchlist."""
    item = db.query(FacilityWatchlist).filter(FacilityWatchlist.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Watchlist entry not found.")
    db.delete(item)
    db.commit()
    return {"message": "Facility removed from surveillance watchlist."}
