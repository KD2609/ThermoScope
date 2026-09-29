"""API endpoints for Industrial Facilities and Infrastructure.
"""

from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.models import IndustrialSite
from backend.app.schemas.schemas import IndustrialSiteSchema
from backend.app.services.geospatial_service import find_nearby_industrial_sites

router = APIRouter(prefix="/api/industrial-sites", tags=["Industrial Sites"])


from backend.app.services.cache_service import memory_cache


@router.get("", response_model=List[IndustrialSiteSchema])
def list_industrial_sites(db: Session = Depends(get_db)):
    """List all registered industrial facilities and critical infrastructure."""
    cached = memory_cache.get("industrial_sites:all")
    if cached is not None:
        return cached

    sites = db.query(IndustrialSite).all()
    result = [s.to_dict() for s in sites]
    memory_cache.set("industrial_sites:all", result, ttl=300.0)
    return result


@router.get("/nearby", response_model=List[IndustrialSiteSchema])
def get_nearby_industrial_sites(
    lat: float = Query(..., ge=-90.0, le=90.0),
    lon: float = Query(..., ge=-180.0, le=180.0),
    max_range_km: float = Query(25.0, ge=1.0, le=100.0),
    db: Session = Depends(get_db)
):
    """Find industrial facilities within max_range_km of a point."""
    return find_nearby_industrial_sites(lat, lon, db, max_range_km=max_range_km)


@router.get("/{id}", response_model=IndustrialSiteSchema)
def get_industrial_site_by_id(id: str, db: Session = Depends(get_db)):
    """Retrieve details for a single industrial site."""
    from fastapi import HTTPException
    site = db.query(IndustrialSite).filter(IndustrialSite.id == id).first()
    if not site:
        raise HTTPException(status_code=404, detail=f"Industrial facility '{id}' not found.")
    return site.to_dict()


@router.get("/{id}/profile")
def get_industrial_site_risk_profile(id: str, db: Session = Depends(get_db)):
    """Retrieve dynamic 90-day facility risk profile, flare recurrence, and anomaly detection."""
    from fastapi import HTTPException
    from backend.app.services.facility_analytics_service import get_facility_risk_profile
    profile = get_facility_risk_profile(id, db)
    if not profile:
        raise HTTPException(status_code=404, detail=f"Industrial facility '{id}' not found.")
    return profile
