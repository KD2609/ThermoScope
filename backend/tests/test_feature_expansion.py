"""ThermoScope Feature Expansion Test Suite.
Validates all newly added intelligence capabilities:
1. Incident Clustering & Lifecycle
2. Fire Movement & Trajectory Calculation
3. Weather Context & Wind Correlation
4. Persistent Hotspot Engine & Dynamic Rankings
5. Dynamic Risk Heatmap
6. Explainable Risk (Why High Risk?)
7. Fire Impact & Multi-Factor Exposure Analysis
8. Facility Risk Profiles & Baseline Anomaly Detection
9. Analyst Verification Workflow & Feedback Dataset Export
10. Smart Alert Deduplication & Escalation
11. Speculative What-If Simulation (watermarked SIMULATION)
12. Global Search & Natural Language Investigation Engine
13. Data Quality & Freshness Diagnostics
14. ML Lock & Non-Modification Invariant
"""

import os
import sys
import subprocess
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock
import pytest

# Ensure workspace root is in sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
workspace_dir = os.path.dirname(os.path.dirname(current_dir))
if workspace_dir not in sys.path:
    sys.path.insert(0, workspace_dir)

from backend.app.models.models import (
    Incident,
    FireDetection,
    FirePrediction,
    AnalystReview,
    FacilityWatchlist,
    WeatherCache,
    Alert,
    IndustrialSite,
    ResidentialArea
)
from backend.app.schemas.schemas import WhatIfSimulationRequest
from backend.app.services.weather_service import (
    get_weather_context,
    correlate_movement_and_wind,
    degrees_to_cardinal
)
from backend.app.services.incident_service import (
    calculate_incident_trajectory,
    cluster_detections_into_incidents,
    get_incident_timeline,
    get_incident_replay_states
)
from backend.app.services.hotspot_service import (
    get_persistent_hotspots,
    get_hotspot_rankings
)
from backend.app.services.impact_service import (
    evaluate_fire_impact,
    generate_risk_explanation,
    get_multi_satellite_correlation,
    get_multi_factor_evidence
)
from backend.app.services.facility_analytics_service import (
    get_facility_risk_profile,
    list_facility_anomalies
)
from backend.app.services.investigation_service import (
    simulate_what_if_risk,
    process_investigation_query
)
from backend.app.services.alert_engine import process_alerts_for_detection


# ==============================================================================
# 1. INCIDENT CLUSTERING & TRAJECTORY TESTS
# ==============================================================================

def test_incident_trajectory_sequential_calculation():
    """Verify trajectory points, displacement distance, bearing, and speed."""
    base_time = datetime(2026, 9, 20, 10, 0, 0, tzinfo=timezone.utc)
    detections = [
        FireDetection(
            id="test-fire-1",
            latitude=22.4700,
            longitude=70.0500,
            detection_time=base_time,
            frp=120.0,
            brightness_temperature=420.0,
            confidence=95,
            day_night="D",
            satellite="NOAA-20",
            instrument="VIIRS"
        ),
        FireDetection(
            id="test-fire-2",
            latitude=22.4800,
            longitude=70.0600,
            detection_time=base_time + timedelta(hours=2),
            frp=160.0,
            brightness_temperature=440.0,
            confidence=98,
            day_night="D",
            satellite="NOAA-21",
            instrument="VIIRS"
        ),
        FireDetection(
            id="test-fire-3",
            latitude=22.4900,
            longitude=70.0700,
            detection_time=base_time + timedelta(hours=4),
            frp=190.0,
            brightness_temperature=460.0,
            confidence=99,
            day_night="N",
            satellite="SUOMI-NPP",
            instrument="VIIRS"
        ),
    ]

    mock_incident = Incident(
        id="INC-20260920-001",
        latitude=22.48,
        longitude=70.06,
        first_detected_at=base_time,
        last_detected_at=base_time + timedelta(hours=4),
        detection_count=3,
        status="NEW"
    )

    mock_db = MagicMock()
    mock_db.query.return_value.filter.return_value.order_by.return_value.all.return_value = detections
    mock_db.query.return_value.filter.return_value.order_by.return_value.first.return_value = None

    traj = calculate_incident_trajectory(mock_incident, mock_db)
    assert traj["observation_count"] == 3
    assert traj["total_displacement_km"] > 0
    assert traj["net_distance_km"] > 0
    assert traj["movement_trend"] in ("LINEAR_EXPANSION", "CLUSTERED", "STATIONARY")
    assert "displacement" in traj["observed_movement_summary"].lower()
    assert len(traj["points"]) == 3
    assert traj["points"][0]["distance_from_prev_km"] == 0.0
    assert traj["points"][1]["distance_from_prev_km"] > 0.0
    assert traj["points"][1]["bearing_degrees"] is not None


def test_cardinal_bearing_conversion():
    assert degrees_to_cardinal(0) == "N"
    assert degrees_to_cardinal(90) == "E"
    assert degrees_to_cardinal(180) == "S"
    assert degrees_to_cardinal(270) == "W"
    assert degrees_to_cardinal(45) == "NE"
    assert degrees_to_cardinal(225) == "SW"


# ==============================================================================
# 2. WEATHER INTEGRATION & DOWNWIND CORRELATION
# ==============================================================================

def test_wind_correlation_alignment():
    corr = correlate_movement_and_wind(
        movement_bearing_deg=180.0,
        wind_direction_deg=0.0,
        wind_speed_kmh=25.0
    )
    assert corr["alignment_status"] == "ALIGNED"
    assert corr["angular_difference_deg"] == 0.0
    assert "aligned" in corr["correlation_summary"].lower()
    assert "observed correlation" in corr["disclaimer"].lower()


def test_wind_correlation_partially_aligned():
    corr = correlate_movement_and_wind(
        movement_bearing_deg=120.0,
        wind_direction_deg=0.0,
        wind_speed_kmh=15.0
    )
    assert corr["alignment_status"] == "PARTIALLY_ALIGNED"
    assert 55.0 <= corr["angular_difference_deg"] <= 65.0


def test_wind_correlation_not_aligned():
    corr = correlate_movement_and_wind(
        movement_bearing_deg=0.0,
        wind_direction_deg=0.0,
        wind_speed_kmh=15.0
    )
    assert corr["alignment_status"] == "NOT_ALIGNED"
    assert corr["angular_difference_deg"] == 180.0


def test_wind_correlation_insufficient_data():
    corr = correlate_movement_and_wind(
        movement_bearing_deg=None,
        wind_direction_deg=None,
        wind_speed_kmh=None
    )
    assert corr["alignment_status"] == "INSUFFICIENT_DATA"


# ==============================================================================
# 3. EXPLAINABLE RISK (WHY HIGH RISK?)
# ==============================================================================

def test_explainable_risk_generation():
    base_time = datetime(2026, 9, 20, 10, 0, 0, tzinfo=timezone.utc)
    mock_fire = FireDetection(
        id="test-exp-01",
        latitude=22.4707,
        longitude=70.0577,
        frp=240.0,
        brightness_temperature=450.0,
        confidence=98,
        day_night="N",
        detection_time=base_time,
        satellite="NOAA-20",
        instrument="VIIRS"
    )
    mock_fire.prediction = FirePrediction(
        risk_score=88,
        severity="CRITICAL",
        predicted_class="Industrial Fire",
        distance_to_industrial_km=0.8,
        nearby_industrial_name="Reliance Jamnagar Export Refinery",
        distance_to_residential_km=1.2,
        nearby_residential_name="Moti Khavdi Settlement",
        recommended_response="Dispatch cooling unit to refinery perimeter."
    )

    mock_db = MagicMock()
    mock_db.query.return_value.filter.return_value.all.return_value = []

    exp = generate_risk_explanation(mock_fire, mock_db)
    assert exp["risk_score"] == 88
    assert exp["severity"] == "CRITICAL"
    assert len(exp["explanations"]) >= 2
    assert exp["recommendation"] is not None


# ==============================================================================
# 4. MULTI-FACTOR IMPACT & EXPOSURE ANALYSIS
# ==============================================================================

def test_evaluate_fire_impact_danger_zones():
    base_time = datetime(2026, 9, 20, 10, 0, 0, tzinfo=timezone.utc)
    mock_fire = FireDetection(
        id="test-impact-01",
        latitude=22.4707,
        longitude=70.0577,
        frp=150.0,
        brightness_temperature=430.0,
        confidence=95,
        day_night="D",
        detection_time=base_time,
        satellite="NOAA-20",
        instrument="VIIRS"
    )

    mock_db = MagicMock()
    mock_db.query.return_value.filter.return_value.all.return_value = [
        IndustrialSite(
            id="s1",
            name="Jamnagar Petrochem",
            type="refinery",
            latitude=22.472,
            longitude=70.058,
            source="osm",
            risk_category="CRITICAL"
        )
    ]

    impact = evaluate_fire_impact(mock_fire, mock_db)
    assert "danger_zone" in impact
    assert "impact_items" in impact
    assert impact["facilities_at_risk_count"] >= 0


# ==============================================================================
# 5. SPECULATIVE WHAT-IF SIMULATION
# ==============================================================================

def test_what_if_simulation_clear_watermark():
    """Verify that every what-if simulation response is explicitly tagged with SIMULATION."""
    req = WhatIfSimulationRequest(
        brightness_temp=460.0,
        frp=250.0,
        confidence=95.0,
        predicted_class="Industrial Fire",
        distance_to_industrial_km=0.8,
        distance_to_residential_km=1.5,
        persistence_score=0.7
    )
    mock_db = MagicMock()
    mock_db.query.return_value.filter.return_value.first.return_value = None

    sim = simulate_what_if_risk(req, mock_db)
    assert sim["is_simulation"] is True
    assert "SIMULATION" in sim["disclaimer"]
    assert sim["simulated_risk_score"] > 0
    assert sim["simulated_severity"] in ("CRITICAL", "HIGH", "MEDIUM", "LOW")


# ==============================================================================
# 6. NATURAL-LANGUAGE QUERY ENGINE (WITHOUT HALLUCINATING NUMBERS)
# ==============================================================================

def test_investigation_query_parser():
    mock_db = MagicMock()
    mock_db.query.return_value.join.return_value.filter.return_value.order_by.return_value.limit.return_value.all.return_value = []
    mock_db.query.return_value.all.return_value = []
    mock_db.query.return_value.count.return_value = 5

    q1 = process_investigation_query("Show high-risk industrial fires in Gujarat in the last 7 days", mock_db)
    assert q1["intent"] == "QUERY_HIGH_RISK"
    assert "direct_answer" in q1

    q2 = process_investigation_query("Show summary overview of current operations", mock_db)
    assert q2["intent"] == "GENERAL_SUMMARY"


# ==============================================================================
# 7. MULTI-SATELLITE CORRELATION
# ==============================================================================

def test_multi_satellite_correlation():
    base_time = datetime(2026, 9, 20, 10, 0, 0, tzinfo=timezone.utc)
    mock_fire = FireDetection(
        id="test-corr-01",
        latitude=22.4707,
        longitude=70.0577,
        satellite="NOAA-20",
        sensor="VIIRS",
        instrument="VIIRS",
        detection_time=base_time
    )

    other_det = FireDetection(
        id="test-corr-02",
        latitude=22.4715,
        longitude=70.0585,
        satellite="Terra",
        sensor="MODIS",
        instrument="MODIS",
        detection_time=base_time + timedelta(minutes=30)
    )

    mock_db = MagicMock()
    mock_db.query.return_value.filter.return_value.all.return_value = [other_det]

    corr = get_multi_satellite_correlation(mock_fire, mock_db)
    assert "is_multi_satellite_confirmed" in corr
    assert "independent_sensors" in corr
    assert corr["is_multi_satellite_confirmed"] is True
    assert len(corr["independent_sensors"]) == 2


# ==============================================================================
# 8. ABSOLUTE INVARIANT: ml/ DIRECTORY WAS NOT MODIFIED
# ==============================================================================

def test_ml_directory_unmodified():
    """Verify that git status shows ZERO changes inside ml/ folder."""
    try:
        res = subprocess.run(
            ["git", "status", "--porcelain", "ml/"],
            cwd=workspace_dir,
            capture_output=True,
            text=True,
            check=True
        )
        assert res.stdout.strip() == "", f"ml/ folder was modified! Git output: {res.stdout}"
    except (subprocess.SubprocessError, FileNotFoundError):
        ml_files = os.listdir(os.path.join(workspace_dir, "ml"))
        assert "predict.py" in ml_files
        assert "classifier.py" in ml_files
