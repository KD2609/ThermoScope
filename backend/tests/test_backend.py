"""Unit and integration test suite for ThermoScope Backend.
Tests geospatial calculations, risk assessment, ML inference, alert deduplication, and REST APIs.
"""

import os
import sys
import pytest
from fastapi.testclient import TestClient

# Ensure workspace root is in sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
workspace_dir = os.path.dirname(os.path.dirname(current_dir))
if workspace_dir not in sys.path:
    sys.path.insert(0, workspace_dir)

from backend.app.main import app
from backend.app.database import engine, Base, SessionLocal
from backend.app.services.osm_service import seed_osm_facilities_if_empty
from backend.app.services.firms_service import firms_service
from backend.app.services.geospatial_service import (
    haversine_distance_km, evaluate_residential_danger_level
)
from backend.app.services.risk_service import calculate_risk_and_response
from ml.predict import predict_thermal_event

# Ensure database tables exist and initial seed data is loaded for tests
Base.metadata.create_all(bind=engine)
_db = SessionLocal()
seed_osm_facilities_if_empty(_db)
firms_service.sync_firms_data(_db)
_db.close()

client = TestClient(app)


def test_haversine_distance():
    # Jamnagar (22.4707, 70.0577) to Moti Khavdi (22.4900, 70.0750) is ~2.8 km
    d = haversine_distance_km(22.4707, 70.0577, 22.4900, 70.0750)
    assert 2.0 <= d <= 3.5


def test_danger_zone_categorization():
    assert evaluate_residential_danger_level(0.8) == "CRITICAL"
    assert evaluate_residential_danger_level(1.5) == "HIGH"
    assert evaluate_residential_danger_level(2.5) == "MEDIUM"
    assert evaluate_residential_danger_level(4.0) == "LOW"
    assert evaluate_residential_danger_level(8.0) == "NONE"


def test_risk_calculation():
    # High temperature + refinery proximity should yield CRITICAL severity
    risk_res = calculate_risk_and_response(
        brightness_temp=460.0,
        frp=550.0,
        confidence=98.0,
        predicted_class="Industrial Fire",
        distance_to_industrial_km=0.5,
        industrial_site_type="refinery",
        distance_to_residential_km=1.2
    )
    assert risk_res["risk_score"] >= 75.0
    assert risk_res["severity"] in ("HIGH", "CRITICAL")
    assert "IMMEDIATE DISPATCH" in risk_res["recommended_response"]


def test_ml_prediction():
    # Thermal anomaly inside refinery complex
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
        "historical_fire_count": 5
    }
    pred = predict_thermal_event(obs)
    assert "predicted_class" in pred
    assert pred["confidence"] > 0.0
    assert pred["model_version"].startswith("v1")


def test_system_health_api():
    resp = client.get("/api/system/health")
    assert resp.status_code == 200
    data = resp.json()
    assert "database" in data
    assert "ml_engine" in data
    assert data["database"]["connected"] is True


def test_fires_api_flow():
    # 1. Active fires endpoint
    resp = client.get("/api/fires/active")
    assert resp.status_code == 200
    fires = resp.json()
    assert isinstance(fires, list)

    # 2. List fires endpoint
    resp_list = client.get("/api/fires?page=1&page_size=10")
    assert resp_list.status_code == 200
    data = resp_list.json()
    assert "items" in data
    assert "total" in data


def test_dashboard_stats_api():
    resp = client.get("/api/dashboard/stats")
    assert resp.status_code == 200
    stats = resp.json()
    assert "total_detections" in stats
    assert "active_fires_count" in stats
    assert "class_distribution" in stats


def test_industrial_sites_api():
    resp = client.get("/api/industrial-sites")
    assert resp.status_code == 200
    sites = resp.json()
    assert len(sites) >= 5
    assert any("Jamnagar" in s["name"] for s in sites)


def test_satellite_context_api():
    resp = client.get("/api/fires/active")
    fires = resp.json()
    if fires:
        fire_id = fires[0]["id"]
        sat_resp = client.get(f"/api/fires/{fire_id}/satellite")
        assert sat_resp.status_code == 200
        sat_data = sat_resp.json()
        assert "available" in sat_data
        assert "disclaimer" in sat_data
