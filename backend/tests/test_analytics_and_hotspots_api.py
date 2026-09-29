"""Tests for Analytics, Hotspot Rankings, and Model Monitoring API contracts.
Verifies:
- /api/hotspots/rankings (30D & 90D)
- /api/admin/model-monitoring and /api/system/admin/model-monitoring (no 404s)
- /api/analytics/trends (data & time_series buckets)
- /api/analytics/regions (30D & 90D)
- /api/analytics/anomalies
"""

import pytest
from fastapi.testclient import TestClient

from backend.app.main import app


@pytest.fixture
def client():
    return TestClient(app)


def test_hotspot_rankings_30d(client):
    res = client.get("/api/hotspots/rankings?window_days=30")
    assert res.status_code == 200
    data = res.json()
    assert "count" in data
    assert data["window_days"] == 30
    assert "rankings" in data
    assert "data" in data
    assert isinstance(data["rankings"], list)


def test_hotspot_rankings_90d(client):
    res = client.get("/api/hotspots/rankings?window_days=90")
    assert res.status_code == 200
    data = res.json()
    assert data["window_days"] == 90
    assert isinstance(data["rankings"], list)


def test_hotspot_ranking_singular_backward_compatibility(client):
    res = client.get("/api/hotspots/ranking?days=30")
    assert res.status_code == 200
    data = res.json()
    assert "rankings" in data


def test_model_monitoring_endpoints_not_404(client):
    res1 = client.get("/api/admin/model-monitoring")
    assert res1.status_code == 200
    data1 = res1.json()
    assert "total_inferences" in data1
    assert "average_confidence" in data1

    res2 = client.get("/api/system/admin/model-monitoring")
    assert res2.status_code == 200
    data2 = res2.json()
    assert "total_inferences" in data2


def test_analytics_historical_trends(client):
    for horizon in ["24h", "7d", "30d", "90d"]:
        res = client.get(f"/api/analytics/trends?horizon={horizon}")
        assert res.status_code == 200
        data = res.json()
        assert data["horizon"] == horizon
        assert "data" in data
        assert "time_series" in data
        if len(data["data"]) > 0:
            first = data["data"][0]
            assert "bucket" in first or "date" in first
            assert "count" in first or "fire_count" in first


def test_regional_analytics(client):
    res = client.get("/api/analytics/regions?days=30")
    assert res.status_code == 200
    data = res.json()
    assert "regions" in data
    assert isinstance(data["regions"], list)
    if len(data["regions"]) > 0:
        first = data["regions"][0]
        assert "region_name" in first
        assert "detection_count" in first
        assert "active_incidents" in first
        assert "avg_frp" in first
        assert "critical_incidents" in first
        assert "exposure_tier" in first


def test_facility_anomalies(client):
    res = client.get("/api/analytics/anomalies?days=7")
    assert res.status_code == 200
    data = res.json()
    assert "anomalies" in data
    assert "count" in data
    assert isinstance(data["anomalies"], list)
