from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.models.models import ThermalAnomaly, IndustrialAsset, Alert
from app.schemas.schemas import SystemHealthResponse

router = APIRouter(prefix="/api/system", tags=["System & Health"])

@router.get("/health")
def health_check():
    return {
        "status": "HEALTHY",
        "service": "ThermoScope AI Intelligence Engine",
        "version": "1.0.0-hackathon",
        "timestamp": datetime.utcnow().isoformat()
    }

@router.get("/status", response_model=SystemHealthResponse)
def get_system_status(db: Session = Depends(get_db)):
    active_anomalies = db.query(ThermalAnomaly).count()
    industrial_assets = db.query(IndustrialAsset).count()
    critical_alerts = db.query(Alert).filter(Alert.severity == "CRITICAL", Alert.status != "RESOLVED").count()

    firms_status = "CONNECTED" if (settings.NASA_FIRMS_MAP_KEY and settings.SYSTEM_MODE == "LIVE") else "FALLBACK / DEMO"
    firms_msg = "Live FIRMS feed active." if firms_status == "CONNECTED" else "Using local high-resolution demo records (MAP_KEY optional)."

    sources = [
        {
            "source_name": "NASA FIRMS (VIIRS/MODIS)",
            "status": firms_status,
            "record_count": active_anomalies,
            "last_sync": datetime.utcnow(),
            "latency_ms": 140 if firms_status == "CONNECTED" else 15,
            "message": firms_msg
        },
        {
            "source_name": "OpenStreetMap Industrial Infrastructure",
            "status": "AVAILABLE",
            "record_count": industrial_assets,
            "last_sync": datetime.utcnow(),
            "latency_ms": 25,
            "message": "Local cached industrial asset registry operational."
        },
        {
            "source_name": "Satellite Visual Layer (Carto / ESRI Tiles)",
            "status": "OPTIONAL",
            "record_count": 1,
            "last_sync": datetime.utcnow(),
            "latency_ms": 85,
            "message": "High-contrast visual context tiles loaded."
        },
        {
            "source_name": "Demo Prototype Dataset",
            "status": "ACTIVE" if settings.SYSTEM_MODE == "DEMO" else "STANDBY",
            "record_count": active_anomalies,
            "last_sync": datetime.utcnow(),
            "latency_ms": 5,
            "message": "Full offline capability enabled for hackathon demonstration."
        }
    ]

    return {
        "system_mode": settings.SYSTEM_MODE,
        "status": "OPERATIONAL",
        "timestamp": datetime.utcnow(),
        "sources": sources,
        "active_anomalies": active_anomalies,
        "industrial_assets": industrial_assets,
        "critical_alerts": critical_alerts
    }

@router.post("/mode")
def toggle_system_mode(mode: str):
    new_mode = mode.upper()
    if new_mode in ["LIVE", "DEMO"]:
        settings.SYSTEM_MODE = new_mode
        return {"status": "SUCCESS", "current_mode": settings.SYSTEM_MODE}
    return {"status": "ERROR", "message": "Invalid mode. Use 'LIVE' or 'DEMO'."}
