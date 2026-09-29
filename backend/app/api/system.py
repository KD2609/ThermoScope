from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, Query
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from backend.app.database import get_db, check_db_health
from backend.app.models.models import FireDetection, FirePrediction, Alert, SyncLog, AnalystReview
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


@router.get("/data-quality")
def get_data_quality_report(db: Session = Depends(get_db)):
    """Inspect data ingestion quality, record validation counts, and freshness."""
    now = datetime.now(timezone.utc)
    last_sync = db.query(SyncLog).order_by(desc(SyncLog.sync_time)).first()

    is_stale = False
    minutes_since_sync = None
    if last_sync and last_sync.sync_time:
        sync_t = last_sync.sync_time
        if sync_t.tzinfo is None:
            sync_t = sync_t.replace(tzinfo=timezone.utc)
        minutes_since_sync = round((now - sync_t).total_seconds() / 60.0, 1)
        if minutes_since_sync > 30.0:
            is_stale = True

    total_fetched = db.query(func.sum(SyncLog.records_fetched)).scalar() or 0
    total_inserted = db.query(func.sum(SyncLog.records_inserted)).scalar() or 0
    total_duplicates_or_filtered = max(0, total_fetched - total_inserted)

    db_health = check_db_health()

    return {
        "timestamp": now.isoformat(),
        "is_data_stale": is_stale,
        "minutes_since_last_sync": minutes_since_sync,
        "freshness_status": "STALE_DATA" if is_stale else "UP_TO_DATE",
        "last_sync_time": last_sync.sync_time.isoformat() if last_sync and last_sync.sync_time else None,
        "last_sync_status": last_sync.status if last_sync else "NOT_SYNCED",
        "lifetime_records_fetched": total_fetched,
        "lifetime_records_inserted": total_inserted,
        "lifetime_duplicates_or_filtered": total_duplicates_or_filtered,
        "database_connected": db_health.get("connected", False),
        "postgis_enabled": db_health.get("is_postgis_enabled", False),
        "postgis_version": db_health.get("postgis_version"),
        "quality_score_pct": 100.0 if not is_stale else 75.0
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


# Admin Operations
admin_router = APIRouter(prefix="/api/admin", tags=["Administration"])


@admin_router.post("/sync")
def trigger_manual_sync(db: Session = Depends(get_db)):
    """Manually trigger a NASA FIRMS ingestion and prediction cycle."""
    res = firms_service.sync_firms_data(db)
    return {
        "message": "Synchronization triggered successfully.",
        "details": res
    }


@admin_router.get("/model-monitoring")
@router.get("/admin/model-monitoring")
def get_model_monitoring(db: Session = Depends(get_db)):
    """Monitor model inference volume, class distributions, and analyst agreement without modifying ml/."""
    ml_instance = ThermalClassifier.get_instance()
    total_preds = db.query(FirePrediction).count()

    # Class distribution
    class_rows = (
        db.query(FirePrediction.predicted_class, func.count(FirePrediction.id))
        .group_by(FirePrediction.predicted_class)
        .all()
    )
    class_dist = {cls: cnt for cls, cnt in class_rows}

    # Average confidence
    avg_conf = db.query(func.avg(FirePrediction.confidence)).scalar() or 0.7

    # Analyst Reviews
    reviews = db.query(AnalystReview).all()
    review_counts = {"CONFIRMED": 0, "FALSE_POSITIVE": 0, "INCORRECT_CLASSIFICATION": 0, "UNKNOWN": 0}
    for r in reviews:
        if r.decision in review_counts:
            review_counts[r.decision] += 1

    total_reviewed = len(reviews)
    accuracy_ratio = round((review_counts["CONFIRMED"] / max(1, total_reviewed)) * 100.0, 1) if total_reviewed > 0 else 100.0

    return {
        "model_version": ml_instance.model_version,
        "total_inferences": total_preds,
        "average_confidence": round(float(avg_conf), 3),
        "class_distribution": class_dist,
        "analyst_reviews_total": total_reviewed,
        "analyst_review_breakdown": review_counts,
        "analyst_confirmed_accuracy_pct": accuracy_ratio,
        "status": "OPERATIONAL"
    }


@admin_router.get("/feedback-dataset")
@router.get("/admin/feedback-dataset")
def export_analyst_feedback_dataset(format: str = Query("json", description="json or csv"), db: Session = Depends(get_db)):
    """Export analyst-verified event dataset for future offline model evaluation without modifying ml/."""
    reviews = (
        db.query(AnalystReview)
        .order_by(desc(AnalystReview.reviewed_at))
        .all()
    )

    records = []
    for r in reviews:
        det = r.detection
        pred = det.prediction if det else None
        records.append({
            "review_id": r.id,
            "fire_id": r.fire_detection_id,
            "incident_id": r.incident_id,
            "analyst_decision": r.decision,
            "analyst_corrected_class": r.corrected_class or (pred.predicted_class if pred else "Unknown"),
            "original_predicted_class": pred.predicted_class if pred else "Unknown",
            "model_confidence": pred.confidence if pred else None,
            "latitude": det.latitude if det else None,
            "longitude": det.longitude if det else None,
            "frp": det.frp if det else None,
            "brightness_temp": det.brightness_temperature if det else None,
            "analyst_notes": r.notes,
            "reviewed_at": r.reviewed_at.isoformat() if r.reviewed_at else None
        })

    if format.lower() == "csv":
        import csv
        import io
        output = io.StringIO()
        if records:
            writer = csv.DictWriter(output, fieldnames=list(records[0].keys()))
            writer.writeheader()
            writer.writerows(records)
        return PlainTextResponse(output.getvalue(), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=analyst_feedback_dataset.csv"})

    return {
        "total_records": len(records),
        "dataset": records
    }
