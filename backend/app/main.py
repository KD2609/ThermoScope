"""FastAPI Application Entry Point for ThermoScope AI.
Production-oriented geospatial intelligence backend.
"""

import os
import sys
import threading

# Bootstrap paths so both `backend.app` and `app` imports resolve cleanly
_current_dir = os.path.dirname(os.path.abspath(__file__))
_backend_dir = os.path.dirname(_current_dir)
_workspace_dir = os.path.dirname(_backend_dir)
for _p in [_workspace_dir, _backend_dir]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.config import settings
from backend.app.database import engine, Base, SessionLocal, init_db
from backend.app.api.fires import router as fires_router
from backend.app.api.incidents import router as incidents_router
from backend.app.api.alerts import router as alerts_router
from backend.app.api.industrial_sites import router as industrial_router
from backend.app.api.subscriptions import router as subscriptions_router
from backend.app.api.dashboard import router as dashboard_router
from backend.app.api.hotspots import router as hotspots_router
from backend.app.api.analytics import router as analytics_router
from backend.app.api.watchlist import router as watchlist_router
from backend.app.api.events import router as events_router
from backend.app.api.search import router as search_router
from backend.app.api.system import router as system_router, admin_router
from backend.app.services.firms_service import firms_service
from backend.app.services.osm_service import seed_osm_facilities_if_empty
from backend.app.services.scheduler_service import start_background_scheduler, stop_background_scheduler
from ml.predict import ThermalClassifier


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Ensure PostGIS extension and database tables exist
    init_db()
    print("[Lifespan] Database tables and spatial schema verified.")

    # 2. Seed OSM industrial sites & residential settlements if empty
    db = SessionLocal()
    try:
        seed_osm_facilities_if_empty(db)
    except Exception as e:
        print(f"[Lifespan] OSM seed warning on startup: {e}")
    finally:
        db.close()

    # Initial FIRMS sync runs in background thread to avoid blocking server readiness
    def initial_sync():
        import time
        time.sleep(1.5)
        sync_db = SessionLocal()
        try:
            from backend.app.models.models import FireDetection
            existing = sync_db.query(FireDetection.id).first()
            if not existing:
                res = firms_service.sync_firms_data(sync_db)
                print(f"[Lifespan] Initial Ingestion Status: {res['status']} ({res['records_inserted']} inserted)")
            else:
                print("[Lifespan] Active fire detections verified in Supabase PostgreSQL.")
        except Exception as e:
            print(f"[Lifespan] Ingestion warning on startup: {e}")
        finally:
            sync_db.close()

    threading.Thread(target=initial_sync, daemon=True, name="initial-firms-sync").start()

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

# CORS configuration - supports production Vercel frontend, preview deployments, and localhost
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=r"^https://.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Register API Routers
app.include_router(fires_router)
app.include_router(incidents_router)
app.include_router(alerts_router)
app.include_router(industrial_router)
app.include_router(subscriptions_router)
app.include_router(dashboard_router)
app.include_router(hotspots_router)
app.include_router(analytics_router)
app.include_router(watchlist_router)
app.include_router(events_router)
app.include_router(search_router)
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
