"""Persistent Hotspot Engine.
Discovers recurring spatial thermal clusters across 30-day and 90-day historical observation horizons
using spatial grid aggregation, FRP statistics, and active observation day density.
"""

from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
import statistics
from collections import defaultdict
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc

from backend.app.models.models import FireDetection, FirePrediction, IndustrialSite
from backend.app.services.geospatial_service import haversine_distance_km

_HOTSPOT_CACHE: Dict[str, Any] = {}
_HOTSPOT_CACHE_TTL_SEC = 30.0


def get_persistent_hotspots(
    db: Session,
    window_days: int = 30,
    grid_size_deg: float = 0.05,
    min_detections: int = 2
) -> List[Dict[str, Any]]:
    """Compute persistent thermal hotspots by spatially binning observations into ~5 km cells.
    Calculates centroid, detection count, active days count, FRP statistics, and persistence score.
    """
    cache_key = f"{window_days}_{grid_size_deg}_{min_detections}"
    now_ts = datetime.now(timezone.utc).timestamp()
    if cache_key in _HOTSPOT_CACHE:
        entry = _HOTSPOT_CACHE[cache_key]
        if (now_ts - entry["ts"]) < _HOTSPOT_CACHE_TTL_SEC:
            return [dict(h) for h in entry["data"]]

    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(days=window_days)

    detections = (
        db.query(FireDetection)
        .options(joinedload(FireDetection.prediction))
        .filter(FireDetection.detection_time >= cutoff)
        .order_by(desc(FireDetection.detection_time))
        .all()
    )

    if not detections:
        # Fallback to all available historical records if cutoff window is sparse
        detections = (
            db.query(FireDetection)
            .options(joinedload(FireDetection.prediction))
            .all()
        )

    # Pre-load industrial sites once to avoid per-hotspot database queries
    sites = db.query(IndustrialSite).all()

    # Spatial binning key: rounded grid coordinates
    grid_buckets = defaultdict(list)
    for d in detections:
        lat_bin = round(d.latitude / grid_size_deg) * grid_size_deg
        lon_bin = round(d.longitude / grid_size_deg) * grid_size_deg
        key = (round(lat_bin, 4), round(lon_bin, 4))
        grid_buckets[key].append(d)

    hotspots = []
    for (lat_bin, lon_bin), dets in grid_buckets.items():
        if len(dets) < min_detections:
            continue

        lats = [d.latitude for d in dets]
        lons = [d.longitude for d in dets]
        center_lat = round(sum(lats) / len(lats), 4)
        center_lon = round(sum(lons) / len(lons), 4)

        frp_vals = [d.frp for d in dets if d.frp is not None and d.frp >= 0.0]
        avg_frp = round(sum(frp_vals) / len(frp_vals), 1) if frp_vals else 0.0
        med_frp = round(statistics.median(frp_vals), 1) if frp_vals else 0.0
        max_frp = round(max(frp_vals), 1) if frp_vals else 0.0

        # Unique active days
        active_dates = {d.detection_time.date() for d in dets if d.detection_time}
        active_days = len(active_dates)

        # Persistence score normalized to active days vs total available window
        # >= 15 active days out of 30 = 1.0 (continuous industrial source)
        max_scale_days = min(window_days, 15)
        persistence = round(min(1.0, active_days / float(max_scale_days)), 3)

        # Nearest facility match (filtered to 8.0 km search range) using preloaded sites
        fac_name, fac_type, dist_km = None, None, None
        min_dist = float("inf")
        for site in sites:
            d_km = haversine_distance_km(center_lat, center_lon, site.latitude, site.longitude)
            if d_km < min_dist:
                min_dist = d_km
                if d_km <= 8.0:
                    fac_name, fac_type, dist_km = site.name, site.type, d_km

        # Dominant classification
        class_counts = defaultdict(int)
        for d in dets:
            if d.prediction and d.prediction.predicted_class:
                class_counts[d.prediction.predicted_class] += 1
        dominant_cls = max(class_counts.items(), key=lambda x: x[1])[0] if class_counts else "Industrial Thermal Activity"

        hotspot_id = f"HOTSPOT-{abs(hash((lat_bin, lon_bin))) % 1000000:06d}"

        hotspots.append({
            "hotspot_id": hotspot_id,
            "center_latitude": center_lat,
            "center_longitude": center_lon,
            "detection_count": len(dets),
            "active_days": active_days,
            "average_frp": avg_frp,
            "median_frp": med_frp,
            "max_frp": max_frp,
            "persistence_score": persistence,
            "window_days": window_days,
            "nearby_facility": f"{fac_name} ({dist_km:.1f} km)" if fac_name and dist_km else None,
            "dominant_class": dominant_cls
        })

    # Sort hotspots by persistence score desc, then detection count desc
    hotspots.sort(key=lambda h: (h["persistence_score"], h["detection_count"], h["max_frp"]), reverse=True)
    _HOTSPOT_CACHE[cache_key] = {"data": hotspots, "ts": now_ts}
    return hotspots


def get_hotspot_rankings(db: Session, window_days: int = 30, limit: int = 10) -> List[Dict[str, Any]]:
    """Return top ranked persistent thermal hotspots with rank index and risk score."""
    hotspots = get_persistent_hotspots(db, window_days=window_days)
    ranked = []
    for rank, h in enumerate(hotspots[:limit], start=1):
        # Composite hotspot risk score
        risk = round(min(99.0, (h["persistence_score"] * 45.0) + min(35.0, (h["max_frp"] / 10.0)) + min(20.0, h["detection_count"] * 2.0)), 1)
        item = dict(h)
        item["rank"] = rank
        item["composite_hotspot_risk"] = risk
        ranked.append(item)
    return ranked
