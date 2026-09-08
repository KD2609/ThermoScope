import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.persistence import evaluate_persistence_and_baseline
from app.services.features import extract_features
from app.services.classification import classifier
from app.services.risk import calculate_risk
from app.models.models import ThermalAnomaly

client = TestClient(app)

def test_health():
    response = client.get("/api/system/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "HEALTHY"

def test_system_status():
    response = client.get("/api/system/status")
    assert response.status_code == 200
    data = response.json()
    assert "sources" in data
    assert data["active_anomalies"] >= 10

def test_anomalies_list_and_geojson():
    res = client.get("/api/anomalies")
    assert res.status_code == 200
    anomalies = res.json()
    assert len(anomalies) >= 10
    first_id = anomalies[0]["id"]

    # GeoJSON
    geo_res = client.get("/api/anomalies/geojson")
    assert geo_res.status_code == 200
    geo_data = geo_res.json()
    assert geo_data["type"] == "FeatureCollection"
    assert len(geo_data["features"]) >= 10

def test_unified_intelligence_endpoint():
    res = client.get("/api/anomalies/1/intelligence")
    assert res.status_code == 200
    intel = res.json()
    
    # Must have all required intelligence pillars
    assert "event" in intel
    assert "spatial" in intel
    assert "thermal" in intel
    assert "temporal" in intel
    assert "classification" in intel
    assert "risk" in intel
    assert "investigation" in intel
    assert "audit_logs" in intel

    # Check explainability
    clf = intel["classification"]
    assert "supporting_evidence" in clf
    assert len(clf["supporting_evidence"]) > 0
    assert "uncertainty_factors" in clf
    assert len(clf["uncertainty_factors"]) > 0

def test_persistence_baseline_rule():
    # Test sparse history (< 3 observations)
    class DummyAnomaly:
        latitude = 25.0
        longitude = 80.0
        frp = 50.0
        timestamp = None

    res_sparse = evaluate_persistence_and_baseline(DummyAnomaly(), [])
    assert res_sparse["has_sufficient_history"] is False
    assert res_sparse["historical_median_frp"] is None
    assert "minimum 3 required" in res_sparse["interpretation"].lower()

def test_assets_endpoints():
    res = client.get("/api/assets")
    assert res.status_code == 200
    assets = res.json()
    assert len(assets) >= 8
    first_asset_id = assets[0]["id"]

    detail_res = client.get(f"/api/assets/{first_asset_id}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert "asset" in detail
    assert "active_anomalies" in detail
    assert "historical_observations" in detail

def test_alerts_and_investigation_workflow():
    alerts_res = client.get("/api/alerts")
    assert alerts_res.status_code == 200
    alerts = alerts_res.json()
    assert len(alerts) > 0

    first_alert_id = alerts[0]["id"]
    # Acknowledge
    ack_res = client.post(f"/api/alerts/{first_alert_id}/acknowledge", json={"user_name": "Test Analyst"})
    assert ack_res.status_code == 200

    # Add Note to Investigation
    note_res = client.post("/api/investigations/1/notes", json={"text": "Checked local sensor telemetry.", "author": "Analyst Unit"})
    assert note_res.status_code == 200
    assert note_res.json()["status"] == "SUCCESS"

    # Status update: UNDER REVIEW -> VERIFIED
    patch_res = client.patch("/api/investigations/1", json={"status": "UNDER REVIEW", "assigned_analyst": "Officer Sharma"})
    assert patch_res.status_code == 200
    assert patch_res.json()["investigation"]["status"] == "UNDER REVIEW"

def test_analytics_summary():
    res = client.get("/api/analytics/summary")
    assert res.status_code == 200
    data = res.json()
    assert data["total_anomalies"] >= 10
    assert "by_classification" in data
    assert "by_region" in data
    assert "top_assets_by_risk" in data

def test_deterministic_scenarios():
    # Trigger Scenario A
    res_a = client.post("/api/demo/scenario/start", json={"scenario": "SCENARIO_A"})
    assert res_a.status_code == 200
    data_a = res_a.json()
    assert data_a["classification"] == "Potential Industrial Fire"
    assert data_a["risk_level"] == "CRITICAL"

    # Trigger Scenario B (Agricultural false-positive suppressor)
    res_b = client.post("/api/demo/scenario/start", json={"scenario": "SCENARIO_B"})
    assert res_b.status_code == 200
    data_b = res_b.json()
    assert data_b["classification"] == "Agricultural / Biomass Burn"
    assert data_b["risk_level"] == "LOW"

    # Trigger Scenario C (Persistent Source)
    res_c = client.post("/api/demo/scenario/start", json={"scenario": "SCENARIO_C"})
    assert res_c.status_code == 200
    data_c = res_c.json()
    assert data_c["classification"] == "Routine / Persistent Industrial Thermal Source"

    # Reset
    reset_res = client.post("/api/demo/scenario/reset")
    assert reset_res.status_code == 200

def test_incident_dossier_report():
    res = client.get("/api/incidents/1/report?format=html")
    assert res.status_code == 200
    assert "text/html" in res.headers["content-type"]
    html_text = res.text
    assert "THERMOSCOPE AI" in html_text
    assert "INCIDENT INTELLIGENCE DOSSIER" in html_text
    assert "Contributing Evidence Factors" in html_text
