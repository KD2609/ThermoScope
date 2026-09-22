"""API endpoints for System Observability, Health Checks, and Administrative Sync.
"""

from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.database import get_db, check_db_health
from backend.app.models.models import FireDetection, Alert, SyncLog
from backend.app.schemas.schemas import SystemHealthResponse
from backend.app.services.firms_service import firms_service
from ml.predict import ThermalClassifier

router = APIRouter(prefix="/api/system", tags=["System & Observability"])


@router.get("/health", response_model=SystemHealthResponse)
def get_system_health(db: Session = Depends(get_db)):
    """Comprehensive observability health check for Database, NASA FIRMS, and ML Engine."""
    db_health = check_db_health()
    ml_instance = ThermalClassifier.get_instance()

    ml_status = {
        "status": "OPERATIONAL" if ml_instance.model is not None else "FALLBACK_RULES",
        "model_version": ml_instance.model_version,
        "classes_count": len(ml_instance.classes),
        "is_model_loaded": ml_instance.model is not None
    }

    last_sync = db.query(SyncLog).order_by(desc(SyncLog.sync_time)).first()
    firms_status = {
        "status": last_sync.status if last_sync else "NOT_SYNCED",
        "last_sync": last_sync.sync_time.isoformat() if last_sync and last_sync.sync_time else None,
        "source": firms_service.source,
        "is_api_key_set": bool(firms_service.api_key),
        "total_processed": firms_service.total_processed_records
    }

    total_records = db.query(FireDetection).count()
    active_alerts = db.query(Alert).filter(Alert.status == "NEW").count()

    return {
        "database": db_health,
        "nasa_firms": firms_status,
        "ml_engine": ml_status,
        "active_alerts_count": active_alerts,
        "total_records_processed": total_records,
        "last_ingestion_time": last_sync.sync_time.isoformat() if last_sync and last_sync.sync_time else None,
        "uptime_status": "HEALTHY" if db_health.get("connected") else "DEGRADED"
    }


@router.get("/firms-status")
def get_firms_status(db: Session = Depends(get_db)):
    """Inspect detailed NASA FIRMS integration state and latest sync records."""
    last_sync = db.query(SyncLog).order_by(desc(SyncLog.sync_time)).first()
    return {
        "configured_source": firms_service.source,
        "bounding_box": firms_service.bbox,
        "historical_days": firms_service.days,
        "api_key_configured": bool(firms_service.api_key),
        "last_sync_status": last_sync.status if last_sync else "NOT_SYNCED",
        "last_sync_time": last_sync.sync_time.isoformat() if last_sync and last_sync.sync_time else None,
        "records_fetched": last_sync.records_fetched if last_sync else 0,
        "records_inserted": last_sync.records_inserted if last_sync else 0,
        "duration_seconds": last_sync.duration_seconds if last_sync else 0.0,
        "error_message": last_sync.error_message if last_sync else None
    }


@router.get("/sync-logs")
def get_sync_logs(limit: int = 15, db: Session = Depends(get_db)):
    """Retrieve recent ingestion sync audit logs."""
    logs = db.query(SyncLog).order_by(desc(SyncLog.sync_time)).limit(limit).all()
    return [l.to_dict() for l in logs]


# Admin Manual Sync Trigger
admin_router = APIRouter(prefix="/api/admin", tags=["Administration"])


@admin_router.post("/sync")
def trigger_manual_sync(db: Session = Depends(get_db)):
    """Manually trigger a NASA FIRMS ingestion and prediction cycle."""
    res = firms_service.sync_firms_data(db)
    return {
        "message": "Synchronization triggered successfully.",
        "details": res
    }
