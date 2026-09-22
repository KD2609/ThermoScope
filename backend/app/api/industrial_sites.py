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


@router.get("", response_model=List[IndustrialSiteSchema])
def list_industrial_sites(db: Session = Depends(get_db)):
    """List all registered industrial facilities and critical infrastructure."""
    sites = db.query(IndustrialSite).all()
    return [s.to_dict() for s in sites]


@router.get("/nearby", response_model=List[IndustrialSiteSchema])
def get_nearby_industrial_sites(
    lat: float = Query(..., ge=-90.0, le=90.0),
    lon: float = Query(..., ge=-180.0, le=180.0),
    max_range_km: float = Query(25.0, ge=1.0, le=100.0),
    db: Session = Depends(get_db)
):
    """Find industrial facilities within max_range_km of a point."""
    return find_nearby_industrial_sites(lat, lon, db, max_range_km=max_range_km)
