"""FastAPI Application Entry Point for ThermoScope AI.
Production-oriented geospatial intelligence backend.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.config import settings
from backend.app.database import engine, Base, SessionLocal
from backend.app.api.fires import router as fires_router
from backend.app.api.alerts import router as alerts_router
from backend.app.api.industrial_sites import router as industrial_router
from backend.app.api.subscriptions import router as subscriptions_router
from backend.app.api.dashboard import router as dashboard_router
from backend.app.api.system import router as system_router, admin_router
from backend.app.services.firms_service import firms_service
from backend.app.services.osm_service import seed_osm_facilities_if_empty
from backend.app.services.scheduler_service import start_background_scheduler, stop_background_scheduler
from ml.predict import ThermalClassifier


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Ensure database tables and schema exist
    Base.metadata.create_all(bind=engine)
    print("[Lifespan] Database tables verified.")

    # 2. Seed OSM industrial sites & residential settlements if empty
    db = SessionLocal()
    try:
        seed_osm_facilities_if_empty(db)
        res = firms_service.sync_firms_data(db)
        print(f"[Lifespan] Initial Ingestion Status: {res['status']} ({res['records_inserted']} inserted)")
    except Exception as e:
        print(f"[Lifespan] Ingestion warning on startup: {e}")
    finally:
        db.close()

    # 3. Load & warm up ML model
    ThermalClassifier.get_instance()

    # 5. Start background scheduler task
    scheduler_task = start_background_scheduler()

    yield

    # Cleanup on shutdown
    stop_background_scheduler()
    print("[Lifespan] Shutdown complete.")


app = FastAPI(
    title="ThermoScope Geospatial Intelligence API",
    description="Production-grade SIH platform for detecting, classifying, and monitoring industrial thermal anomalies & fires.",
    version=settings.APP_VERSION,
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(fires_router)
app.include_router(alerts_router)
app.include_router(industrial_router)
app.include_router(subscriptions_router)
app.include_router(dashboard_router)
app.include_router(system_router)
app.include_router(admin_router)


@app.get("/")
def root():
    return {
        "platform": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "api_documentation": "/docs",
        "system_health": "/api/system/health",
        "live_dashboard_stats": "/api/dashboard/stats"
    }
