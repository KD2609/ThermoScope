"""Incident Clustering, Trajectory, and Lifecycle Management Service.
Groups individual spatial thermal detections into cohesive Fire Incidents,
calculates sequential observed movement/displacement vectors, and manages the incident lifecycle.
"""

from datetime import datetime, timezone, timedelta
import math
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
from geoalchemy2.elements import WKTElement

from backend.app.models.models import FireDetection, Incident, FirePrediction, Alert, AnalystReview
from backend.app.services.geospatial_service import haversine_distance_km, find_closest_industrial_site
from backend.app.services.weather_service import get_weather_context, correlate_movement_and_wind, degrees_to_cardinal


def calculate_bearing_deg(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the initial compass bearing from point (lat1, lon1) to (lat2, lon2) in degrees [0, 360)."""
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_lambda = math.radians(lon2 - lon1)

    y = math.sin(delta_lambda) * math.cos(phi2)
    x = math.cos(phi1) * math.sin(phi2) - math.sin(phi1) * math.cos(phi2) * math.cos(delta_lambda)

    bearing = (math.degrees(math.atan2(y, x)) + 360.0) % 360.0
    return round(bearing, 1)


def cluster_detections_into_incidents(db: Session, max_distance_km: float = 5.0, max_time_gap_hours: float = 24.0) -> int:
    """Group unassigned or recent fire detections into unified incidents based on spatiotemporal proximity.
    Prevents duplicate incidents by joining to existing active incidents first.
    Returns the count of newly clustered detections.
    """
    # Fast indexed guard: if all detections are already clustered, return 0 immediately
    has_unassigned = db.query(FireDetection.id).filter(FireDetection.incident_id.is_(None)).first()
    if not has_unassigned:
        return 0

    # Only fetch unassigned detections (bounded to batch of 100 for safety)
    detections = (
        db.query(FireDetection)
        .options(joinedload(FireDetection.prediction))
        .filter(FireDetection.incident_id.is_(None))
        .order_by(FireDetection.detection_time.asc())
        .limit(100)
        .all()
    )

    if not detections:
        return 0

    assigned_count = 0

    for det in detections:
        det_time = det.detection_time
        if det_time.tzinfo is None:
            det_time = det_time.replace(tzinfo=timezone.utc)

        # Check existing open incidents within distance & time threshold
        existing_incidents = (
            db.query(Incident)
            .filter(
                Incident.status != "CLOSED",
                Incident.latitude.between(det.latitude - 0.1, det.latitude + 0.1),
                Incident.longitude.between(det.longitude - 0.1, det.longitude + 0.1)
            )
            .all()
        )

        matched_incident = None
        for inc in existing_incidents:
            dist = haversine_distance_km(det.latitude, det.longitude, inc.latitude, inc.longitude)
            if dist <= max_distance_km:
                inc_last = inc.last_detected_at
                if inc_last.tzinfo is None:
                    inc_last = inc_last.replace(tzinfo=timezone.utc)
                # Check time proximity: within max_time_gap_hours
                time_diff = abs((det_time - inc_last).total_seconds()) / 3600.0
                if time_diff <= max_time_gap_hours:
                    matched_incident = inc
                    break

        if matched_incident:
            # Add to existing incident if not already assigned
            if det.incident_id != matched_incident.id:
                det.incident_id = matched_incident.id
                assigned_count += 1

            # Update incident aggregated statistics
            inc_dets = db.query(FireDetection).filter(FireDetection.incident_id == matched_incident.id).all()
            all_dets = list(inc_dets)
            if det not in all_dets:
                all_dets.append(det)

            frp_vals = [d.frp for d in all_dets if d.frp is not None and d.frp >= 0.0]
            lats = [d.latitude for d in all_dets]
            lons = [d.longitude for d in all_dets]
            times = [d.detection_time for d in all_dets]

            center_lat = sum(lats) / len(lats)
            center_lon = sum(lons) / len(lons)
            max_r = max(haversine_distance_km(center_lat, center_lon, lat, lon) for lat, lon in zip(lats, lons)) if lats else 1.0

            matched_incident.detection_count = len(all_dets)
            matched_incident.latitude = center_lat
            matched_incident.longitude = center_lon
            matched_incident.geom = WKTElement(f"POINT({center_lon} {center_lat})", srid=4326)
            matched_incident.radius_km = max(0.5, round(max_r, 2))
            matched_incident.max_frp = max(frp_vals) if frp_vals else 0.0
            matched_incident.avg_frp = sum(frp_vals) / len(frp_vals) if frp_vals else 0.0
            matched_incident.first_detected_at = min(times)
            matched_incident.last_detected_at = max(times)

            # Update severity if current detection is higher
            if det.prediction:
                sev = det.prediction.severity
                if sev == "CRITICAL":
                    matched_incident.severity = "CRITICAL"
                elif sev == "HIGH" and matched_incident.severity in ("LOW", "MEDIUM"):
                    matched_incident.severity = "HIGH"

        else:
            if det.incident_id:
                continue

            # Create new Incident
            closest_ind_name, closest_ind_type, dist_ind_km = find_closest_industrial_site(det.latitude, det.longitude, db)
            
            site_label = f"near {closest_ind_name}" if closest_ind_name and dist_ind_km and dist_ind_km <= 5.0 else f"Zone ({round(det.latitude, 2)}N, {round(det.longitude, 2)}E)"
            title = f"Thermal Event {site_label}"
            inc_id = f"INC-{det.id[:16].upper()}"

            pred_class = det.prediction.predicted_class if det.prediction else "Industrial Fire"
            severity = det.prediction.severity if det.prediction else "MEDIUM"

            new_incident = Incident(
                id=inc_id,
                title=title,
                status="NEW",
                severity=severity,
                first_detected_at=det_time,
                last_detected_at=det_time,
                detection_count=1,
                latitude=det.latitude,
                longitude=det.longitude,
                geom=WKTElement(f"POINT({det.longitude} {det.latitude})", srid=4326),
                radius_km=1.0,
                max_frp=det.frp or 0.0,
                avg_frp=det.frp or 0.0,
                primary_class=pred_class,
                nearby_facility_name=closest_ind_name,
                distance_to_facility_km=dist_ind_km,
                summary=f"Automated incident initialized from thermal detection {det.id}."
            )
            db.add(new_incident)
            db.flush()

            det.incident_id = new_incident.id
            assigned_count += 1

    db.commit()
    return assigned_count


def calculate_incident_trajectory(incident: Incident, db: Session) -> Dict[str, Any]:
    """Calculate sequential observed movement trajectory across repeated detections.
    Computes speed, bearings, displacement, trend, and ambient wind correlation.
    """
    detections = (
        db.query(FireDetection)
        .filter(FireDetection.incident_id == incident.id)
        .order_by(FireDetection.detection_time.asc())
        .all()
    )

    if not detections or len(detections) < 2:
        pts = []
        if detections:
            d = detections[0]
            pts.append({
                "fire_id": d.id,
                "detection_time": d.detection_time.isoformat() if d.detection_time else None,
                "latitude": d.latitude,
                "longitude": d.longitude,
                "frp": d.frp or 0.0,
                "distance_from_prev_km": 0.0,
                "bearing_degrees": None,
                "bearing_cardinal": None,
                "speed_kmh": None
            })
        return {
            "incident_id": incident.id,
            "observation_count": len(detections),
            "total_displacement_km": 0.0,
            "net_distance_km": 0.0,
            "net_bearing_degrees": None,
            "net_bearing_cardinal": None,
            "average_speed_kmh": 0.0,
            "movement_trend": "STATIONARY",
            "observed_movement_summary": "Single observation recorded; movement trajectory requires multiple sequential satellite passes.",
            "points": pts,
            "wind_correlation": None
        }

    points = []
    total_dist = 0.0
    speeds = []

    for i, curr in enumerate(detections):
        if i == 0:
            points.append({
                "fire_id": curr.id,
                "detection_time": curr.detection_time.isoformat(),
                "latitude": curr.latitude,
                "longitude": curr.longitude,
                "frp": curr.frp or 0.0,
                "distance_from_prev_km": 0.0,
                "bearing_degrees": None,
                "bearing_cardinal": None,
                "speed_kmh": None
            })
        else:
            prev = detections[i - 1]
            dist = haversine_distance_km(prev.latitude, prev.longitude, curr.latitude, curr.longitude)
            total_dist += dist

            bearing = calculate_bearing_deg(prev.latitude, prev.longitude, curr.latitude, curr.longitude)
            cardinal = degrees_to_cardinal(bearing)

            # Elapsed time in hours
            dt_curr = curr.detection_time
            dt_prev = prev.detection_time
            if dt_curr.tzinfo is None:
                dt_curr = dt_curr.replace(tzinfo=timezone.utc)
            if dt_prev.tzinfo is None:
                dt_prev = dt_prev.replace(tzinfo=timezone.utc)

            hours = max(0.01, (dt_curr - dt_prev).total_seconds() / 3600.0)
            spd = round(dist / hours, 2)
            speeds.append(spd)

            points.append({
                "fire_id": curr.id,
                "detection_time": curr.detection_time.isoformat(),
                "latitude": curr.latitude,
                "longitude": curr.longitude,
                "frp": curr.frp or 0.0,
                "distance_from_prev_km": dist,
                "bearing_degrees": bearing,
                "bearing_cardinal": cardinal,
                "speed_kmh": spd
            })

    first = detections[0]
    last = detections[-1]
    net_dist = haversine_distance_km(first.latitude, first.longitude, last.latitude, last.longitude)
    net_bearing = calculate_bearing_deg(first.latitude, first.longitude, last.latitude, last.longitude) if net_dist > 0.05 else None
    net_cardinal = degrees_to_cardinal(net_bearing) if net_bearing is not None else None
    avg_speed = round(sum(speeds) / len(speeds), 2) if speeds else 0.0

    # Trend categorization
    if net_dist < 0.3:
        trend = "STATIONARY"
        trend_summary = f"Observed activity remains localized within a 300m radius across {len(detections)} observations (consistent with stationary flare or facility process)."
    elif net_dist > 2.0 and avg_speed > 0.5:
        trend = "LINEAR_EXPANSION"
        trend_summary = f"Net displacement of {net_dist} km toward {net_cardinal} ({net_bearing}°) observed over {len(detections)} passes at an average rate of {avg_speed} km/h."
    elif total_dist > net_dist * 2.0:
        trend = "CLUSTERED"
        trend_summary = f"Activity exhibits clustered multi-point thermal fluctuations within an area of {round(incident.radius_km, 1)} km radius."
    else:
        trend = "SCATTERED"
        trend_summary = f"Discontinuous thermal detections observed across {len(detections)} passes totaling {round(total_dist, 1)} km cumulative track."

    # Weather & wind correlation
    weather = get_weather_context(incident.latitude, incident.longitude, db)
    wind_corr = correlate_movement_and_wind(
        movement_bearing_deg=net_bearing,
        wind_direction_deg=weather.get("wind_direction"),
        wind_speed_kmh=weather.get("wind_speed")
    )

    return {
        "incident_id": incident.id,
        "observation_count": len(detections),
        "total_displacement_km": round(total_dist, 2),
        "net_distance_km": round(net_dist, 2),
        "net_bearing_degrees": net_bearing,
        "net_bearing_cardinal": net_cardinal,
        "average_speed_kmh": avg_speed,
        "movement_trend": trend,
        "observed_movement_summary": trend_summary,
        "points": points,
        "wind_correlation": wind_corr
    }


def get_incident_timeline(incident: Incident, db: Session) -> List[Dict[str, Any]]:
    """Generate a unified, chronological timeline of all observations, risk changes, alerts, and reviews."""
    events = []

    # 1. Detection events
    detections = (
        db.query(FireDetection)
        .options(joinedload(FireDetection.prediction))
        .filter(FireDetection.incident_id == incident.id)
        .order_by(FireDetection.detection_time.asc())
        .all()
    )

    for i, d in enumerate(detections):
        sev = d.prediction.severity if d.prediction else "LOW"
        frp_str = f"FRP: {d.frp:.1f} MW" if d.frp else "Thermal anomaly"
        cls_str = d.prediction.predicted_class if d.prediction else "Thermal Detection"

        events.append({
            "type": "INITIAL_DETECTION" if i == 0 else "SUBSEQUENT_DETECTION",
            "timestamp": d.detection_time.isoformat() if d.detection_time else None,
            "title": f"Initial Satellite Detection ({d.satellite})" if i == 0 else f"Follow-up Observation ({d.satellite})",
            "description": f"{cls_str} identified at ({d.latitude:.4f}, {d.longitude:.4f}). {frp_str}, Temp: {d.brightness_temperature:.1f} K.",
            "severity": sev,
            "entity_id": d.id,
            "metadata": {
                "frp": d.frp,
                "brightness_temp": d.brightness_temperature,
                "confidence": d.confidence,
                "satellite": d.satellite,
                "instrument": d.instrument
            }
        })

    # 2. Alert events
    alerts = db.query(Alert).filter(Alert.incident_id == incident.id).all()
    for a in alerts:
        events.append({
            "type": "ALERT_DISPATCHED",
            "timestamp": a.created_at.isoformat() if a.created_at else None,
            "title": f"Early Warning Dispatched: {a.title}",
            "description": a.message,
            "severity": a.severity,
            "entity_id": a.id,
            "metadata": {
                "alert_type": a.alert_type,
                "status": a.status,
                "assigned_to": a.assigned_to
            }
        })

        if a.acknowledged_at:
            events.append({
                "type": "ALERT_ACKNOWLEDGED",
                "timestamp": a.acknowledged_at.isoformat(),
                "title": f"Alert Acknowledged by {a.acknowledged_by or 'Operator'}",
                "description": f"Incident acknowledged for operational investigation.",
                "severity": "INFO",
                "entity_id": a.id,
                "metadata": {"acknowledged_by": a.acknowledged_by}
            })

        if a.resolved_at:
            events.append({
                "type": "ALERT_RESOLVED",
                "timestamp": a.resolved_at.isoformat(),
                "title": "Alert Marked Resolved",
                "description": a.resolution_notes or "On-site verification completed and containment verified.",
                "severity": "SUCCESS",
                "entity_id": a.id,
                "metadata": {"resolution_notes": a.resolution_notes}
            })

    # 3. Analyst Review events
    reviews = db.query(AnalystReview).filter(AnalystReview.incident_id == incident.id).all()
    for r in reviews:
        events.append({
            "type": "ANALYST_VERIFICATION",
            "timestamp": r.reviewed_at.isoformat() if r.reviewed_at else None,
            "title": f"Analyst Review: {r.decision.replace('_', ' ')}",
            "description": f"{r.analyst_name} verified this event: {r.notes or 'No additional remarks.'}",
            "severity": "INFO" if r.decision == "CONFIRMED" else "WARNING",
            "entity_id": str(r.id),
            "metadata": {
                "decision": r.decision,
                "corrected_class": r.corrected_class,
                "analyst_name": r.analyst_name
            }
        })

    # Sort all events chronologically
    events.sort(key=lambda x: x["timestamp"] or "")
    return events


def get_incident_replay_states(incident: Incident, db: Session) -> List[Dict[str, Any]]:
    """Return chronological state snapshots for interactive incident replay in the frontend."""
    detections = (
        db.query(FireDetection)
        .options(joinedload(FireDetection.prediction))
        .filter(FireDetection.incident_id == incident.id)
        .order_by(FireDetection.detection_time.asc())
        .all()
    )

    steps = []
    cumulative_points = []

    for idx, d in enumerate(detections):
        pt = {
            "id": d.id,
            "latitude": d.latitude,
            "longitude": d.longitude,
            "detection_time": d.detection_time.isoformat(),
            "frp": d.frp,
            "brightness_temp": d.brightness_temperature,
            "satellite": d.satellite,
            "severity": d.prediction.severity if d.prediction else "LOW",
            "predicted_class": d.prediction.predicted_class if d.prediction else "Unknown",
            "risk_score": d.prediction.risk_score if d.prediction else 50.0
        }
        cumulative_points.append(pt)

        steps.append({
            "step_index": idx + 1,
            "timestamp": d.detection_time.isoformat(),
            "current_observation": pt,
            "all_points_so_far": list(cumulative_points),
            "total_count": len(cumulative_points),
            "current_max_frp": max(p["frp"] or 0.0 for p in cumulative_points),
            "current_severity": d.prediction.severity if d.prediction else "LOW",
            "headline": f"Pass {idx + 1}: {d.satellite} captured {d.frp:.1f} MW anomaly"
        })

    return steps
