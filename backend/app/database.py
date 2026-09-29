"""Database connection and session management.
Dedicated Supabase PostgreSQL + PostGIS integration for ThermoScope production.
SQLite fallback is strictly prohibited.
"""

import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.app.config import settings

Base = declarative_base()

_engine = None
_session_factory = None


def get_engine():
    """Retrieve or create the PostgreSQL engine with Supabase connection pooling."""
    global _engine
    if _engine is None:
        db_url = settings.normalized_database_url
        pool_size = int(os.getenv("DB_POOL_SIZE", "20"))
        max_overflow = int(os.getenv("DB_MAX_OVERFLOW", "15"))
        pool_recycle = int(os.getenv("DB_POOL_RECYCLE", "1800"))

        _engine = create_engine(
            db_url,
            pool_size=pool_size,
            max_overflow=max_overflow,
            pool_recycle=pool_recycle,
            pool_pre_ping=False,
            pool_use_lifo=True,
            connect_args={
                "connect_timeout": 30,
                "keepalives": 1,
                "keepalives_idle": 30,
                "keepalives_interval": 10,
                "keepalives_count": 5
            }
        )
    return _engine


def get_session_factory():
    """Retrieve or create the sessionmaker factory bound to the PostgreSQL engine."""
    global _session_factory
    if _session_factory is None:
        eng = get_engine()
        _session_factory = sessionmaker(autocommit=False, autoflush=False, bind=eng)
    return _session_factory


class _SessionLocalProxy:
    """Proxy object so SessionLocal() works transparently while deferring engine creation until invoked."""
    def __call__(self, *args, **kwargs):
        factory = get_session_factory()
        return factory(*args, **kwargs)


SessionLocal = _SessionLocalProxy()


class _EngineProxy:
    """Proxy object for module-level engine access (e.g. engine.dialect)."""
    def __getattr__(self, name):
        return getattr(get_engine(), name)


engine = _EngineProxy()


def verify_database_setup():
    """Verify PostgreSQL connectivity, verify PostGIS extension, and initialize tables.
    Fails fast with clear descriptive error if PostgreSQL is unreachable or PostGIS is missing.
    """
    eng = get_engine()

    # 1. Verify dialect is PostgreSQL
    if "postgres" not in eng.dialect.name:
        raise RuntimeError(
            f"CRITICAL DATABASE ERROR: Database dialect '{eng.dialect.name}' is not supported. "
            "ThermoScope production requires Supabase PostgreSQL with PostGIS."
        )

    # 2. Test connection & reachability
    try:
        with eng.connect() as conn:
            conn.execute(text("SELECT 1;"))
    except Exception as e:
        raise RuntimeError(
            f"CRITICAL DATABASE CONNECTION ERROR: Unable to reach PostgreSQL at {eng.url.host}:{eng.url.port or 5432}. "
            f"Ensure Supabase PostgreSQL is reachable and DATABASE_URL credentials are valid. Details: {e}"
        ) from e

    # 3. Ensure PostGIS extension is enabled (idempotent for Supabase)
    try:
        with eng.connect() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
            conn.commit()
    except Exception as e:
        print(f"[Database] PostGIS extension note (extension may be managed via Supabase UI): {e}")

    # 4. Verify PostGIS availability & version
    try:
        with eng.connect() as conn:
            version = conn.execute(text("SELECT PostGIS_Version();")).scalar()
            if not version:
                raise RuntimeError("PostGIS_Version() returned empty result.")
            print(f"[Database] PostGIS extension verified active (Version: {version}).")
    except Exception as e:
        raise RuntimeError(
            "CRITICAL POSTGIS ERROR: PostGIS extension is not active on the PostgreSQL database. "
            "Please ensure PostGIS is enabled on your Supabase project (Extensions -> postgis). "
            f"Details: {e}"
        ) from e

    # 5. Create / verify application tables and spatial indexes
    try:
        Base.metadata.create_all(bind=eng)
        # Verify and apply any incremental column migrations safely without locking tables if already present
        try:
            from sqlalchemy import inspect
            insp = inspect(eng)
            existing_alert_cols = {c['name'] for c in insp.get_columns('alerts')}
            existing_fire_cols = {c['name'] for c in insp.get_columns('fire_detections')}

            with eng.connect() as conn:
                needed_alters = []
                if 'incident_id' not in existing_alert_cols:
                    needed_alters.append("ALTER TABLE alerts ADD COLUMN IF NOT EXISTS incident_id VARCHAR(64);")
                if 'assigned_to' not in existing_alert_cols:
                    needed_alters.append("ALTER TABLE alerts ADD COLUMN IF NOT EXISTS assigned_to VARCHAR(64);")
                if 'assigned_at' not in existing_alert_cols:
                    needed_alters.append("ALTER TABLE alerts ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;")
                if 'escalation_level' not in existing_alert_cols:
                    needed_alters.append("ALTER TABLE alerts ADD COLUMN IF NOT EXISTS escalation_level INTEGER DEFAULT 1;")
                if 'escalated_at' not in existing_alert_cols:
                    needed_alters.append("ALTER TABLE alerts ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMPTZ;")
                if 'incident_id' not in existing_fire_cols:
                    needed_alters.append("ALTER TABLE fire_detections ADD COLUMN IF NOT EXISTS incident_id VARCHAR(64);")

                needed_alters.append("CREATE INDEX IF NOT EXISTS idx_subs_email_created ON notification_subscriptions (user_email, created_at DESC);")
                needed_alters.append("CREATE INDEX IF NOT EXISTS idx_incident_status_last_time ON incidents (status, last_detected_at DESC);")
                needed_alters.append("CREATE INDEX IF NOT EXISTS idx_fire_det_time_sensor ON fire_detections (detection_time DESC, sensor);")

                for sql in needed_alters:
                    conn.execute(text(sql))
                if needed_alters:
                    conn.commit()
        except Exception as mig_err:
            print(f"[Database] Incremental migration check note: {mig_err}")

        print("[Database] Schema tables and spatial GIST indexes verified in Supabase PostgreSQL.")
    except Exception as e:
        raise RuntimeError(
            f"CRITICAL SCHEMA ERROR: Failed to create or verify database tables in PostgreSQL: {e}"
        ) from e


def init_db():
    """Verify database setup and initialize schema."""
    verify_database_setup()


def get_db():
    """FastAPI dependency for obtaining a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


_db_health_cache = {"result": None, "ts": 0.0}

def check_db_health(force_fresh: bool = False) -> dict:
    """Verify PostgreSQL connectivity and PostGIS status for observability APIs."""
    import time
    global _db_health_cache
    now = time.time()
    if not force_fresh and _db_health_cache["result"] is not None and (now - _db_health_cache["ts"] < 30.0):
        return _db_health_cache["result"]

    postgis_version = None
    has_postgis = False
    try:
        eng = get_engine()
        with eng.connect() as conn:
            conn.execute(text("SELECT 1;"))
            try:
                res = conn.execute(text("SELECT PostGIS_Version();")).scalar()
                postgis_version = str(res) if res else None
                has_postgis = bool(postgis_version)
            except Exception:
                has_postgis = False

        result = {
            "status": "HEALTHY",
            "dialect": eng.dialect.name,
            "is_postgis_enabled": has_postgis,
            "postgis_version": postgis_version,
            "connected": True
        }
        _db_health_cache["result"] = result
        _db_health_cache["ts"] = now
        return result
    except Exception as e:
        return {
            "status": "DEGRADED",
            "dialect": "postgresql",
            "is_postgis_enabled": False,
            "postgis_version": None,
            "connected": False,
            "error": str(e)
        }
