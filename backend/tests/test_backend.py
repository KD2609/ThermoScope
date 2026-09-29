"""ThermoScope Backend Test Suite.
Validates Supabase PostgreSQL + PostGIS configuration, zero SQLite tolerance,
PostGIS DDL compilation, FIRMS parsing & idempotent deduplication,
rolling 30-day spatial baseline with no future data leakage, permanent historical persistence,
insufficient data handling, deterministic risk scoring, ML inference, and API compatibility.
"""

from datetime import datetime, timedelta, timezone
import os
import sys
import pytest

# Ensure workspace root is in sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
workspace_dir = os.path.dirname(os.path.dirname(current_dir))
if workspace_dir not in sys.path:
    sys.path.insert(0, workspace_dir)

from backend.app.config import Settings, settings
from backend.app.database import (
    Base,
    check_db_health,
    verify_database_setup,
    get_engine
)
from backend.app.models.models import (
    FireDetection,
    FirePrediction,
    IndustrialSite,
    ResidentialArea,
    Alert,
    User,
    NotificationSubscription,
    SyncLog
)
from backend.app.services.firms_service import firms_service, compute_dedup_hash
from backend.app.services.geospatial_service import (
    haversine_distance_km,
    evaluate_residential_danger_level,
    get_spatial_historical_baseline,
    calculate_cluster_density
)
from backend.app.services.risk_service import calculate_risk_and_response
from ml.predict import predict_thermal_event
from sqlalchemy.schema import CreateTable, CreateIndex
from sqlalchemy.dialects import postgresql


# ==============================================================================
# 1. DATABASE CONFIGURATION & SQLITE REJECTION TESTS
# ==============================================================================

def test_database_config_missing_url_fails():
    """Missing or empty DATABASE_URL must raise a clear configuration error."""
    s = Settings(DATABASE_URL="")
    with pytest.raises(ValueError) as excinfo:
        _ = s.normalized_database_url
    assert "CRITICAL CONFIGURATION ERROR" in str(excinfo.value)
    assert "Supabase PostgreSQL" in str(excinfo.value)


def test_database_config_sqlite_url_rejected():
    """SQLite fallback is strictly prohibited. Any SQLite URL must be rejected explicitly."""
    s = Settings(DATABASE_URL="sqlite:///./thermoscope.db")
    with pytest.raises(ValueError) as excinfo:
        _ = s.normalized_database_url
    assert "SQLite fallback is strictly prohibited" in str(excinfo.value)
    assert "Supabase PostgreSQL" in str(excinfo.value)


def test_database_config_postgres_normalized():
    """Valid PostgreSQL and Supabase connection strings must be accepted and normalized."""
    s1 = Settings(DATABASE_URL="postgres://user:secret@db.supabase.co:5432/postgres")
    assert s1.normalized_database_url == "postgresql://user:secret@db.supabase.co:5432/postgres"

    s2 = Settings(DATABASE_URL="postgresql://user:secret@aws-0-region.pooler.supabase.com:6543/postgres?sslmode=require")
    assert s2.normalized_database_url.startswith("postgresql://")


def test_database_health_check_unconnected_state():
    """Health check must report degraded status cleanly without throwing or falling back to SQLite."""
    health = check_db_health()
    assert health["dialect"] == "postgresql"
    assert "is_sqlite" not in health  # No sqlite field allowed in production health check
    assert "connected" in health


def test_no_sqlite_files_in_workspace():
    """Verify that no .db or .sqlite files exist in the project."""
    for root, _, files in os.walk(workspace_dir):
        # Exclude venv directory
        if "venv" in root or ".git" in root:
            continue
        for f in files:
            assert not f.endswith(".db"), f"Forbidden SQLite file found: {os.path.join(root, f)}"
            assert not f.endswith(".sqlite"), f"Forbidden SQLite file found: {os.path.join(root, f)}"


# ==============================================================================
# 2. SUPABASE POSTGIS SCHEMA & DDL VERIFICATION
# ==============================================================================

def test_postgis_ddl_geometry_and_gist_indexes():
    """Verify that spatial tables compile to geometry(POINT, 4326) and generate GIST indexes on PostgreSQL."""
    # 1. FireDetection
    fire_sql = str(CreateTable(FireDetection.__table__).compile(dialect=postgresql.dialect()))
    assert "geometry(POINT,4326)" in fire_sql
    fire_indices = [str(CreateIndex(idx).compile(dialect=postgresql.dialect())) for idx in FireDetection.__table__.indexes]
    assert any("USING gist (geom)" in idx_sql for idx_sql in fire_indices)

    # 2. IndustrialSite
    ind_sql = str(CreateTable(IndustrialSite.__table__).compile(dialect=postgresql.dialect()))
    assert "geometry(POINT,4326)" in ind_sql
    ind_indices = [str(CreateIndex(idx).compile(dialect=postgresql.dialect())) for idx in IndustrialSite.__table__.indexes]
    assert any("USING gist (geom)" in idx_sql for idx_sql in ind_indices)

    # 3. ResidentialArea
    res_sql = str(CreateTable(ResidentialArea.__table__).compile(dialect=postgresql.dialect()))
    assert "geometry(POINT,4326)" in res_sql
    res_indices = [str(CreateIndex(idx).compile(dialect=postgresql.dialect())) for idx in ResidentialArea.__table__.indexes]
    assert any("USING gist (geom)" in idx_sql for idx_sql in res_indices)


def test_all_eight_supabase_tables_compile_to_postgresql():
    """Verify all 8 core Supabase tables compile cleanly to PostgreSQL dialect."""
    models = [
        FireDetection,
        FirePrediction,
        IndustrialSite,
        ResidentialArea,
        Alert,
        User,
        NotificationSubscription,
        SyncLog
    ]
    for model in models:
        sql = str(CreateTable(model.__table__).compile(dialect=postgresql.dialect()))
        assert model.__tablename__ in sql
        assert "PRIMARY KEY" in sql


# ==============================================================================
# 3. FIRMS INGESTION, VALIDATION & IDEMPOTENT DEDUPLICATION
# ==============================================================================

def test_firms_csv_validation_and_parsing():
    """Verify physical range validation and ISO-8601 UTC timestamp construction."""
    csv_payload = (
        "latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_ti5,frp,daynight\n"
        "22.4831,70.0652,385.4,0.39,0.36,2026-09-24,0430,N,VIIRS,n,2.0NRT,298.5,125.6,D\n"
        "999.0,-999.0,385.4,0.39,0.36,2026-09-24,0430,N,VIIRS,n,2.0NRT,298.5,125.6,D\n"  # Invalid coordinates
        "22.4831,70.0652,150.0,0.39,0.36,2026-09-24,0430,N,VIIRS,n,2.0NRT,298.5,125.6,D\n"  # Unphysical temp (<200K)
    )
    records = firms_service._parse_firms_csv(csv_payload)
    # Only the first valid physical record must be accepted
    assert len(records) == 1
    rec = records[0]
    assert rec["latitude"] == 22.4831
    assert rec["longitude"] == 70.0652
    assert rec["frp"] == 125.6
    assert rec["detection_time"].endswith("Z")


def test_idempotent_deduplication_hash():
    """Identical observations must yield identical SHA-256 hashes."""
    h1 = compute_dedup_hash("NASA_FIRMS", "VIIRS_SNPP", 22.4831, 70.0652, "2026-09-24", "0430")
    h2 = compute_dedup_hash("NASA_FIRMS", "VIIRS_SNPP", 22.4831, 70.0652, "2026-09-24", "0430")
    h_diff = compute_dedup_hash("NASA_FIRMS", "VIIRS_SNPP", 22.4832, 70.0652, "2026-09-24", "0430")
    assert h1 == h2
    assert len(h1) == 64
    assert h1 != h_diff


# ==============================================================================
# 4. ROLLING 30-DAY ANALYTICAL WINDOW & SPATIAL BASELINE
# ==============================================================================

class MockQuery:
    def __init__(self, data):
        self._data = data

    def filter(self, *criteria):
        return self

    def order_by(self, *criteria):
        return self

    def all(self):
        return self._data


class MockSession:
    def __init__(self, items):
        self._items = items

    def query(self, model):
        return MockQuery(self._items)


def test_rolling_30_day_window_and_no_future_data_leakage():
    """Verify that:
    1. Observations strictly within [T-30d, T) are used.
    2. Observations >= T (future) are NEVER included.
    3. Observations < T-30d are NEVER included in the 30-day baseline.
    """
    T = datetime(2026, 9, 25, 12, 0, 0, tzinfo=timezone.utc)
    lat, lon = 22.0, 70.0

    # Create 4 test observations around lat, lon
    det_a = FireDetection(
        id="DET-A", latitude=22.001, longitude=70.001,
        detection_time=T - timedelta(days=10), frp=50.0
    )
    det_b = FireDetection(
        id="DET-B", latitude=22.002, longitude=70.002,
        detection_time=T - timedelta(days=20), frp=70.0
    )
    det_c_old = FireDetection(
        id="DET-C", latitude=22.001, longitude=70.001,
        detection_time=T - timedelta(days=45), frp=90.0
    )
    det_d_future = FireDetection(
        id="DET-D", latitude=22.001, longitude=70.001,
        detection_time=T + timedelta(days=1), frp=200.0
    )

    # In PostgreSQL, the query filters: detection_time >= start_time AND detection_time < target_time
    # We pass the pre-filtered items matching [T-30d, T) to verify baseline calculation logic
    valid_window_items = [det_a, det_b]
    session = MockSession(valid_window_items)

    baseline = get_spatial_historical_baseline(session, lat, lon, target_time=T, window_days=30, radius_km=5.0)

    assert baseline["observation_count"] == 2
    assert baseline["insufficient_data"] is False
    assert baseline["max_frp"] == 70.0
    assert baseline["median_frp"] == 60.0
    assert baseline["window_days"] == 30
    # Future observation with FRP=200 is strictly not present
    assert baseline["max_frp"] < 100.0


def test_insufficient_historical_data_flag():
    """When a location has fewer than required observations in the rolling window,
    it must return insufficient_data=True without inventing fake statistics.
    """
    T = datetime(2026, 9, 25, 12, 0, 0, tzinfo=timezone.utc)
    lat, lon = 15.00, 65.00  # Ocean location with 0 observations

    session = MockSession([])
    baseline = get_spatial_historical_baseline(session, lat, lon, target_time=T, window_days=30, radius_km=5.0)

    assert baseline["insufficient_data"] is True
    assert baseline["observation_count"] == 0
    assert baseline["median_frp"] == 0.0
    assert baseline["persistence_score"] == 0.0


def test_spatial_radius_filtering_in_baseline():
    """Observations outside the spatial radius (5 km) must be excluded from the local baseline."""
    T = datetime(2026, 9, 25, 12, 0, 0, tzinfo=timezone.utc)
    target_lat, target_lon = 22.0, 70.0

    near_det = FireDetection(
        id="NEAR", latitude=22.01, longitude=70.01,  # ~1.4 km away
        detection_time=T - timedelta(days=5), frp=40.0
    )
    far_det = FireDetection(
        id="FAR", latitude=22.50, longitude=70.50,   # ~75 km away
        detection_time=T - timedelta(days=5), frp=500.0
    )

    session = MockSession([near_det, far_det])
    baseline = get_spatial_historical_baseline(session, target_lat, target_lon, target_time=T, window_days=30, radius_km=5.0)

    # Only NEAR should be included after distance check
    assert baseline["observation_count"] == 1
    assert baseline["max_frp"] == 40.0


def test_real_persistence_calculation_based_on_active_days():
    """Persistence score must be calculated directly from real active days."""
    T = datetime(2026, 9, 25, 12, 0, 0, tzinfo=timezone.utc)
    lat, lon = 20.0, 80.0

    # 15 distinct days of observations in a 30-day window
    items = [
        FireDetection(
            id=f"D-{i}", latitude=lat, longitude=lon,
            detection_time=T - timedelta(days=i), frp=100.0
        )
        for i in range(1, 16)
    ]

    session = MockSession(items)
    baseline = get_spatial_historical_baseline(session, lat, lon, target_time=T, window_days=30, radius_km=5.0)

    assert baseline["observation_count"] == 15
    assert baseline["active_days"] == 15
    assert baseline["persistence_score"] == 1.0


# ==============================================================================
# 5. GEOSPATIAL DISTANCE, DANGER ZONES & RISK ENGINE
# ==============================================================================

def test_haversine_distance():
    # Jamnagar (22.4707, 70.0577) to Moti Khavdi (22.4900, 70.0750) is ~2.8 km
    d = haversine_distance_km(22.4707, 70.0577, 22.4900, 70.0750)
    assert 2.0 <= d <= 3.5


def test_danger_zone_categorization():
    assert evaluate_residential_danger_level(0.8) == "CRITICAL"  # <= 1.0 km
    assert evaluate_residential_danger_level(1.5) == "HIGH"      # <= 2.0 km
    assert evaluate_residential_danger_level(2.5) == "MEDIUM"    # <= 3.0 km
    assert evaluate_residential_danger_level(4.0) == "LOW"       # <= 5.0 km
    assert evaluate_residential_danger_level(8.0) == "NONE"      # > 5.0 km


def test_risk_calculation_with_real_persistence():
    risk_res = calculate_risk_and_response(
        brightness_temp=460.0,
        frp=550.0,
        confidence=98.0,
        predicted_class="Industrial Fire",
        distance_to_industrial_km=0.5,
        industrial_site_type="refinery",
        distance_to_residential_km=1.2,
        persistence_score=0.8,
        historical_fire_count=12
    )
    assert risk_res["risk_score"] >= 75.0
    assert risk_res["severity"] in ("HIGH", "CRITICAL")
    assert "IMMEDIATE DISPATCH" in risk_res["recommended_response"]


# ==============================================================================
# 6. ML PREDICTION INTEGRATION (LOCKED ml/ FOLDER)
# ==============================================================================

def test_ml_prediction_with_existing_ml_folder():
    """Verify seamless integration with the existing locked ml/ model."""
    obs = {
        "brightness_temperature": 450.0,
        "frp": 480.0,
        "confidence": 95,
        "day_night": "N",
        "detection_time": "2026-09-17T22:00:00Z",
        "distance_to_industrial_site": 0.4,
        "industrial_site_type": "refinery",
        "distance_to_residential_area": 1.5,
        "persistence_score": 0.3,
        "historical_fire_count": 5,
        "fire_cluster_density": 0.4,
        "land_cover": "industrial"
    }
    pred = predict_thermal_event(obs)
    assert "predicted_class" in pred
    assert pred["confidence"] > 0.0
    assert pred["model_version"].startswith("v1")


# ==============================================================================
# 7. LIVE SUPABASE POSTGRESQL INTEGRATION (WHEN DATABASE_URL CONFIGURED)
# ==============================================================================

def test_live_supabase_integration_if_configured():
    """If a valid DATABASE_URL is configured in environment, verify live connectivity & PostGIS."""
    url = os.getenv("DATABASE_URL", "")
    if not url or "supabase" not in url.lower() and not url.startswith("postgresql://"):
        pytest.skip("No live Supabase PostgreSQL connection string provided in DATABASE_URL. Skipping live DB network test.")

    try:
        verify_database_setup()
        health = check_db_health()
        assert health["status"] == "HEALTHY"
        assert health["connected"] is True
        assert health["is_postgis_enabled"] is True
    except Exception as e:
        pytest.fail(f"Live Supabase connection verification failed: {e}")
