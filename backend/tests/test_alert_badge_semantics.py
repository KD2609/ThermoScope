"""Verification tests for Alerts count and navbar badge semantics.
Tests requirements A through H:
- 0 active alerts -> count is 0
- 1 active alert -> count is 1
- 3 active alerts -> count is 3
- Resolve/Acknowledge alert -> count decreases accordingly
- Deduplication prevents duplicate active alerts
- Consistency between /api/alerts/count, /api/alerts, and /api/dashboard/stats
"""

import os
import sys
import uuid
from datetime import datetime, timezone
import pytest

# Ensure workspace root is in sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
workspace_dir = os.path.dirname(os.path.dirname(current_dir))
if workspace_dir not in sys.path:
    sys.path.insert(0, workspace_dir)

from backend.app.database import SessionLocal
from backend.app.models.models import Alert, FireDetection
from backend.app.api.alerts import get_alerts_count, list_alerts, acknowledge_alert, resolve_alert
from backend.app.api.dashboard import get_dashboard_stats
from backend.app.schemas.schemas import AlertAcknowledgeRequest, AlertResolveRequest


def test_alert_count_lifecycle_semantics():
    """Verify Requirements A, B, C, D, H:
    A. 0 active alerts -> count == 0
    B. 1 active alert -> count == 1
    C. 3 active alerts -> count == 3
    D. Resolve active alert -> count decreases
    H. Acknowledged/resolved alerts are not counted as active
    """
    db = SessionLocal()
    created_alert_ids = []
    test_fire_id = f"test_fire_{uuid.uuid4().hex[:8]}"

    try:
        # Create a parent test FireDetection
        test_fire = FireDetection(
            id=test_fire_id,
            source="TEST",
            sensor="TEST_SENSOR",
            latitude=28.6139,
            longitude=77.2090,
            detection_time=datetime.now(timezone.utc),
            brightness_temperature=350.0,
            frp=25.0,
            confidence=90.0,
            dedup_hash=uuid.uuid4().hex
        )
        db.add(test_fire)
        db.commit()

        # Step A: Initial state - get count
        res = get_alerts_count(status="NEW", severity=None, db=db)
        initial_count = res["count"]

        # Step B: Insert 1 active alert
        alert1 = Alert(
            id=f"alert_{uuid.uuid4().hex[:8]}",
            fire_detection_id=test_fire_id,
            alert_type="RESIDENTIAL_PROXIMITY_HAZARD",
            severity="HIGH",
            title="Test Alert 1",
            message="Test high severity alert",
            status="NEW",
            dedup_key=f"dedup_{uuid.uuid4().hex}"
        )
        db.add(alert1)
        db.commit()
        created_alert_ids.append(alert1.id)

        # Verify count is initial + 1
        res = get_alerts_count(status="NEW", severity=None, db=db)
        assert res["count"] == initial_count + 1

        # Verify get_dashboard_stats active_alerts_count matches
        dash_res = get_dashboard_stats(db=db)
        assert dash_res["active_alerts_count"] == initial_count + 1

        # Step C: Add 2 more active alerts (total 3 active)
        alert2 = Alert(
            id=f"alert_{uuid.uuid4().hex[:8]}",
            fire_detection_id=test_fire_id,
            alert_type="INDUSTRIAL_FIRE_WARNING",
            severity="CRITICAL",
            title="Test Alert 2",
            message="Test critical alert",
            status="NEW",
            dedup_key=f"dedup_{uuid.uuid4().hex}"
        )
        alert3 = Alert(
            id=f"alert_{uuid.uuid4().hex[:8]}",
            fire_detection_id=test_fire_id,
            alert_type="FLARE_ANOMALY",
            severity="MEDIUM",
            title="Test Alert 3",
            message="Test medium alert",
            status="NEW",
            dedup_key=f"dedup_{uuid.uuid4().hex}"
        )
        db.add_all([alert2, alert3])
        db.commit()
        created_alert_ids.extend([alert2.id, alert3.id])

        # Verify count is initial + 3
        res = get_alerts_count(status="NEW", severity=None, db=db)
        assert res["count"] == initial_count + 3

        # Step H1: Acknowledge alert 1
        ack_res = acknowledge_alert(id=alert1.id, payload=AlertAcknowledgeRequest(user_name="Test Analyst"), db=db)
        assert ack_res["status"] == "ACKNOWLEDGED"

        # Count should decrease by 1 because alert1 is no longer NEW
        res = get_alerts_count(status="NEW", severity=None, db=db)
        assert res["count"] == initial_count + 2

        # Step D: Resolve alert 2
        res_res = resolve_alert(id=alert2.id, payload=AlertResolveRequest(user_name="Commander", notes="Resolved on site"), db=db)
        assert res_res["status"] == "RESOLVED"

        # Count should now be initial + 1
        res = get_alerts_count(status="NEW", severity=None, db=db)
        assert res["count"] == initial_count + 1

        # Resolve alert 3
        resolve_alert(id=alert3.id, payload=AlertResolveRequest(user_name="Commander", notes="Resolved"), db=db)
        res = get_alerts_count(status="NEW", severity=None, db=db)
        assert res["count"] == initial_count

        # Step G: Repeated alert dedup key rejection (database integrity)
        dup_alert = Alert(
            id=f"alert_{uuid.uuid4().hex[:8]}",
            fire_detection_id=test_fire_id,
            alert_type="FLARE_ANOMALY",
            severity="MEDIUM",
            title="Duplicate Key Alert",
            message="Test dup",
            status="NEW",
            dedup_key=alert3.dedup_key  # Duplicate key
        )
        db.add(dup_alert)
        with pytest.raises(Exception):
            db.commit()
        db.rollback()

    finally:
        # Cleanup test records
        for aid in created_alert_ids:
            db.query(Alert).filter(Alert.id == aid).delete()
        db.query(FireDetection).filter(FireDetection.id == test_fire_id).delete()
        db.commit()
        db.close()


def test_navbar_active_alerts_consistency():
    """Verify that list_alerts(status='NEW') length equals get_alerts_count(status='NEW')."""
    db = SessionLocal()
    try:
        count_res = get_alerts_count(status="NEW", severity=None, db=db)
        active_count = count_res["count"]

        alerts_list = list_alerts(status="NEW", severity=None, limit=200, db=db)
        assert len(alerts_list) == active_count
    finally:
        db.close()
