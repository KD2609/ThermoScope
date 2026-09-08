import sys
import os
from pathlib import Path

# Add backend to sys.path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR / "backend"))
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from fastapi.testclient import TestClient
from app.main import app, init_db_and_seed
from app.database import SessionLocal
from app.models.models import ThermalAnomaly, IndustrialAsset, Alert, Investigation

def run_smoke_tests():
    print("=" * 60)
    print("🚀 THERMOSCOPE AI - END-TO-END SMOKE AUDIT TEST")
    print("=" * 60)

    # 1. Database & Seed verification
    print("[1/8] Verifying Database Initialization & Seed Data...")
    init_db_and_seed()
    db = SessionLocal()
    anoms_count = db.query(ThermalAnomaly).count()
    assets_count = db.query(IndustrialAsset).count()
    alerts_count = db.query(Alert).count()
    db.close()
    assert anoms_count >= 10, f"Expected >= 10 anomalies, got {anoms_count}"
    assert assets_count >= 8, f"Expected >= 8 industrial assets, got {assets_count}"
    assert alerts_count >= 8, f"Expected >= 8 alerts, got {alerts_count}"
    print(f"  ✓ Database healthy: {anoms_count} anomalies, {assets_count} assets, {alerts_count} alerts.")

    client = TestClient(app)

    # 2. System Health
    print("[2/8] Testing System Health & Telemetry...")
    res = client.get("/api/system/status")
    assert res.status_code == 200
    status_data = res.json()
    assert status_data["status"] == "OPERATIONAL"
    print(f"  ✓ System mode: {status_data['system_mode']} (Sources: {len(status_data['sources'])})")

    # 3. GeoJSON Map API
    print("[3/8] Testing Geospatial GeoJSON API...")
    res = client.get("/api/anomalies/geojson")
    assert res.status_code == 200
    geo = res.json()
    assert geo["type"] == "FeatureCollection"
    assert len(geo["features"]) >= 10
    print(f"  ✓ GeoJSON layer ready with {len(geo['features'])} feature points.")

    # 4. Unified Intelligence Endpoint
    print("[4/8] Testing Consolidated Intelligence Endpoint...")
    res = client.get("/api/anomalies/1/intelligence")
    assert res.status_code == 200
    intel = res.json()
    assert "classification" in intel
    assert "supporting_evidence" in intel["classification"]
    assert "uncertainty_factors" in intel["classification"]
    assert "temporal" in intel
    print(f"  ✓ Classified as: {intel['classification']['predicted_class']} (Confidence: {intel['classification']['confidence_score']*100:.1f}%)")
    print(f"  ✓ Supporting Evidence Factors: {len(intel['classification']['supporting_evidence'])}")
    print(f"  ✓ Uncertainty Factors: {len(intel['classification']['uncertainty_factors'])}")

    # 5. Operational Workflow (Status transition & Notes)
    print("[5/8] Testing Operational Investigation Workflow...")
    # Add note
    res_note = client.post("/api/investigations/1/notes", json={"text": "Smoke test inspection verified.", "author": "QA Auditor"})
    assert res_note.status_code == 200
    # Change status
    res_patch = client.patch("/api/investigations/1", json={"status": "UNDER REVIEW", "assigned_analyst": "Officer Mehta"})
    assert res_patch.status_code == 200
    assert res_patch.json()["investigation"]["status"] == "UNDER REVIEW"
    print("  ✓ State transition & analyst notes successfully recorded in database.")

    # 6. Deterministic SIH Scenarios
    print("[6/8] Testing Deterministic SIH Scenarios...")
    # Scenario A: Industrial Fire
    res_a = client.post("/api/demo/scenario/start", json={"scenario": "SCENARIO_A"})
    assert res_a.status_code == 200
    data_a = res_a.json()
    assert data_a["classification"] == "Potential Industrial Fire"
    assert data_a["risk_level"] == "CRITICAL"
    print(f"  ✓ Scenario A: {data_a['title']} -> {data_a['classification']} ({data_a['risk_level']})")

    # Scenario B: Agricultural false positive
    res_b = client.post("/api/demo/scenario/start", json={"scenario": "SCENARIO_B"})
    assert res_b.status_code == 200
    data_b = res_b.json()
    assert data_b["classification"] == "Agricultural / Biomass Burn"
    assert data_b["risk_level"] == "LOW"
    print(f"  ✓ Scenario B: {data_b['title']} -> {data_b['classification']} ({data_b['risk_level']})")

    # Scenario C: Persistent Industrial Source
    res_c = client.post("/api/demo/scenario/start", json={"scenario": "SCENARIO_C"})
    assert res_c.status_code == 200
    data_c = res_c.json()
    assert data_c["classification"] == "Routine / Persistent Industrial Thermal Source"
    print(f"  ✓ Scenario C: {data_c['title']} -> {data_c['classification']}")

    # Reset
    res_reset = client.post("/api/demo/scenario/reset")
    assert res_reset.status_code == 200
    print("  ✓ Simulation reset clean.")

    # 7. Incident Intelligence Dossier Generation
    print("[7/8] Testing Incident Intelligence Dossier...")
    res_report = client.get("/api/incidents/1/report?format=html")
    assert res_report.status_code == 200
    assert "text/html" in res_report.headers["content-type"]
    assert "THERMOSCOPE AI" in res_report.text
    assert "PROBABILISTIC" in res_report.text or "probabilistic" in res_report.text
    print("  ✓ Printable Incident Dossier generated with responsible AI notices.")

    # 8. Frontend Assets Verification
    print("[8/8] Verifying Production Frontend Build...")
    dist_index = BASE_DIR / "frontend" / "dist" / "index.html"
    assert dist_index.exists(), "frontend/dist/index.html does not exist"
    print(f"  ✓ Production bundle verified in {dist_index}")

    print("=" * 60)
    print("🎉 ALL SMOKE AUDIT TESTS PASSED WITH 100% SUCCESS!")
    print("=" * 60)

if __name__ == "__main__":
    run_smoke_tests()
