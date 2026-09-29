"""API endpoints for Fire and Thermal Anomaly Detections.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from sqlalchemy.orm import Session, joinedload, defer
from sqlalchemy import desc, func

from backend.app.database import get_db
from backend.app.models.models import FireDetection, FirePrediction, AnalystReview, Incident
from backend.app.schemas.schemas import (
    FireDetectionSchema, FireListResponse, FirePredictionSchema, SatelliteContextResponse,
    AnalystReviewCreateRequest, AnalystReviewSchema, WeatherContextResponse,
    RiskExplanationResponse, ImpactAnalysisResponse, WhatIfSimulationRequest, WhatIfSimulationResponse
)
from backend.app.services.geospatial_service import haversine_distance_km, get_spatial_historical_baseline
from backend.app.services.satellite_service import get_satellite_context_image
from backend.app.services.weather_service import get_weather_context, correlate_movement_and_wind
from backend.app.services.impact_service import evaluate_fire_impact, generate_risk_explanation, get_multi_factor_evidence
from backend.app.services.investigation_service import simulate_what_if_risk
from backend.app.services.incident_service import calculate_bearing_deg

router = APIRouter(prefix="/api/fires", tags=["Fire Detections"])



from backend.app.services.cache_service import memory_cache


@router.get("", response_model=FireListResponse)
def list_fires(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=200),
    search: Optional[str] = Query(None, description="Search term for ID, facility, or class"),
    severity: Optional[str] = Query(None, description="Filter by severity: LOW, MEDIUM, HIGH, CRITICAL"),
    predicted_class: Optional[str] = Query(None, description="Filter by predicted class"),
    min_confidence: Optional[float] = Query(None, ge=0.0, le=100.0),
    sensor: Optional[str] = Query(None),
    is_industrial_only: bool = Query(False),
    min_frp: Optional[float] = Query(None, ge=0.0),
    max_frp: Optional[float] = Query(None, ge=0.0),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    incident_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    page_num = page if isinstance(page, int) else 1
    limit_num = page_size if isinstance(page_size, int) else 25

    cache_key = f"fires:list:{page_num}:{limit_num}:{search}:{severity}:{predicted_class}:{min_confidence}:{sensor}:{is_industrial_only}:{min_frp}:{max_frp}:{incident_id}"
    cached = memory_cache.get(cache_key)
    if cached is not None:
        return cached

    # Filter conditions for FireDetection
    det_filters = []
    if min_confidence is not None and isinstance(min_confidence, (int, float)):
        det_filters.append(FireDetection.confidence >= min_confidence)
    if sensor and isinstance(sensor, str):
        det_filters.append(FireDetection.sensor.ilike(f"%{sensor}%"))
    if min_frp is not None and isinstance(min_frp, (int, float)):
        det_filters.append(FireDetection.frp >= min_frp)
    if max_frp is not None and isinstance(max_frp, (int, float)):
        det_filters.append(FireDetection.frp <= max_frp)
    if start_date and isinstance(start_date, str):
        try:
            sd = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
            det_filters.append(FireDetection.detection_time >= sd)
        except Exception:
            pass
    if end_date and isinstance(end_date, str):
        try:
            ed = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
            det_filters.append(FireDetection.detection_time <= ed)
        except Exception:
            pass
    if incident_id and isinstance(incident_id, str):
        det_filters.append(FireDetection.incident_id == incident_id)

    # Filter conditions for FirePrediction
    pred_filters = []
    if severity and isinstance(severity, str):
        pred_filters.append(FirePrediction.severity == severity.upper())
    if predicted_class and isinstance(predicted_class, str):
        pred_filters.append(FirePrediction.predicted_class.ilike(f"%{predicted_class}%"))
    if is_industrial_only and isinstance(is_industrial_only, bool) and is_industrial_only:
        pred_filters.append(
            FirePrediction.predicted_class.in_(["Industrial Fire", "Gas Flare / Persistent Thermal Source", "Mining / Industrial Thermal Activity"])
        )
    if search and isinstance(search, str) and search.strip():
        s = f"%{search.strip()}%"
        pred_filters.append(
            (FireDetection.id.ilike(s)) |
            (FirePrediction.nearby_industrial_name.ilike(s)) |
            (FirePrediction.predicted_class.ilike(s))
        )

    # Build items query (defer large raw_payload text blobs)
    items_query = db.query(FireDetection).options(
        joinedload(FireDetection.prediction),
        defer(FireDetection.raw_payload)
    )

    if pred_filters:
        items_query = items_query.join(FirePrediction)
        for pf in pred_filters:
            items_query = items_query.filter(pf)

    for df in det_filters:
        items_query = items_query.filter(df)

    items = (
        items_query.order_by(desc(FireDetection.detection_time))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    # Fast count calculation
    if page == 1 and len(items) < page_size:
        total = len(items)
    else:
        if pred_filters:
            count_query = db.query(func.count(FireDetection.id)).join(FirePrediction)
            for pf in pred_filters:
                count_query = count_query.filter(pf)
        else:
            count_query = db.query(func.count(FireDetection.id))

        for df in det_filters:
            count_query = count_query.filter(df)
        total = count_query.scalar() or 0

    result = {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": [item.to_dict() for item in items]
    }
    memory_cache.set(cache_key, result, ttl=30.0)
    return result


@router.get("/active", response_model=List[FireDetectionSchema])
def get_active_fires(
    hours: int = Query(48, ge=1, le=168, description="Time window in hours"),
    limit: int = Query(250, ge=1, le=1000, description="Max points to return for viewport/map"),
    bbox: Optional[str] = Query(None, description="Bounding box min_lon,min_lat,max_lon,max_lat"),
    db: Session = Depends(get_db)
):
    """Retrieve all active fire detections within the specified time window for GIS map layer."""
    cache_key = f"active_fires:{hours}:{limit}:{bbox}"
    cached = memory_cache.get(cache_key)
    if cached is not None:
        return cached

    cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
    query = (
        db.query(FireDetection)
        .options(
            joinedload(FireDetection.prediction),
            defer(FireDetection.raw_payload)
        )
        .filter(FireDetection.detection_time >= cutoff)
    )

    # Optional viewport bounding box filtering
    if bbox:
        try:
            parts = [float(x.strip()) for x in bbox.split(",")]
            if len(parts) == 4:
                min_lon, min_lat, max_lon, max_lat = parts
                query = query.filter(
                    FireDetection.latitude.between(min_lat, max_lat),
                    FireDetection.longitude.between(min_lon, max_lon)
                )
        except Exception:
            pass

    fires = (
        query.order_by(desc(FireDetection.detection_time))
        .limit(limit)
        .all()
    )

    # If database is fresh or has historical records outside cutoff, return latest bounded
    if not fires:
        fallback_query = (
            db.query(FireDetection)
            .options(
                joinedload(FireDetection.prediction),
                defer(FireDetection.raw_payload)
            )
        )
        if bbox:
            try:
                parts = [float(x.strip()) for x in bbox.split(",")]
                if len(parts) == 4:
                    min_lon, min_lat, max_lon, max_lat = parts
                    fallback_query = fallback_query.filter(
                        FireDetection.latitude.between(min_lat, max_lat),
                        FireDetection.longitude.between(min_lon, max_lon)
                    )
            except Exception:
                pass
        fires = (
            fallback_query.order_by(desc(FireDetection.detection_time))
            .limit(min(limit, 100))
            .all()
        )

    result = [f.to_dict() for f in fires]
    memory_cache.set(cache_key, result, ttl=20.0)
    return result


@router.get("/nearby", response_model=List[FireDetectionSchema])
def get_nearby_fires(
    lat: float = Query(..., ge=-90.0, le=90.0),
    lon: float = Query(..., ge=-180.0, le=180.0),
    radius_km: float = Query(25.0, ge=1.0, le=200.0),
    db: Session = Depends(get_db)
):
    """Query fire detections within radius_km of a geographic coordinate."""
    # Bounding box pre-filter for performance
    delta_lat = radius_km / 111.0
    delta_lon = radius_km / (111.0 * max(0.1, abs(3.14159 / 180.0 * lat)))

    candidates = (
        db.query(FireDetection)
        .options(joinedload(FireDetection.prediction))
        .filter(
            FireDetection.latitude >= lat - delta_lat,
            FireDetection.latitude <= lat + delta_lat,
            FireDetection.longitude >= lon - delta_lon,
            FireDetection.longitude <= lon + delta_lon
        )
        .all()
    )

    results = []
    for c in candidates:
        d = haversine_distance_km(lat, lon, c.latitude, c.longitude)
        if d <= radius_km:
            results.append(c.to_dict())

    return results


@router.get("/{id}", response_model=FireDetectionSchema)
def get_fire_by_id(id: str, db: Session = Depends(get_db)):
    """Retrieve detailed information for a single thermal anomaly."""
    fire = (
        db.query(FireDetection)
        .options(joinedload(FireDetection.prediction))
        .filter(FireDetection.id == id)
        .first()
    )
    if not fire:
        raise HTTPException(status_code=404, detail=f"Thermal detection '{id}' not found.")
    return fire.to_dict()


@router.get("/{id}/prediction", response_model=FirePredictionSchema)
def get_fire_prediction(id: str, db: Session = Depends(get_db)):
    """Retrieve the AI classification prediction and class probabilities."""
    pred = db.query(FirePrediction).filter(FirePrediction.fire_detection_id == id).first()
    if not pred:
        raise HTTPException(status_code=404, detail=f"Prediction for detection '{id}' not found.")
    return pred.to_dict()


@router.get("/{id}/risk")
def get_fire_risk(id: str, db: Session = Depends(get_db)):
    """Retrieve detailed multi-factor risk components."""
    pred = db.query(FirePrediction).filter(FirePrediction.fire_detection_id == id).first()
    if not pred:
        raise HTTPException(status_code=404, detail=f"Risk assessment for detection '{id}' not found.")

    return {
        "fire_detection_id": pred.fire_detection_id,
        "risk_score": pred.risk_score,
        "severity": pred.severity,
        "recommended_response": pred.recommended_response,
        "nearby_industrial_name": pred.nearby_industrial_name,
        "distance_to_industrial_km": pred.distance_to_industrial_km,
        "nearby_residential_name": pred.nearby_residential_name,
        "distance_to_residential_km": pred.distance_to_residential_km
    }


@router.get("/{id}/satellite", response_model=SatelliteContextResponse)
def get_fire_satellite_context(id: str, request: Request, db: Session = Depends(get_db)):
    """Retrieve satellite/context imagery metadata for this detection via SatelliteProvider."""
    fire = db.query(FireDetection).filter(FireDetection.id == id).first()
    if not fire:
        raise HTTPException(status_code=404, detail=f"Detection '{id}' not found.")

    res = get_satellite_context_image(fire.latitude, fire.longitude, fire.detection_time)
    # Route imagery through the backend proxy for high availability and instant tile caching
    base_url = str(request.base_url).rstrip("/")
    res["image_url"] = f"{base_url}/api/fires/{id}/satellite/tile"
    return res


@router.get("/{id}/satellite/tile")
def get_fire_satellite_tile(id: str, db: Session = Depends(get_db)):
    """Proxy and cache real NASA GIBS satellite true-color imagery for instant, reliable rendering."""
    fire = db.query(FireDetection).filter(FireDetection.id == id).first()
    if not fire:
        raise HTTPException(status_code=404, detail=f"Detection '{id}' not found.")

    res = get_satellite_context_image(fire.latitude, fire.longitude, fire.detection_time)
    raw_gibs_url = res.get("image_url")
    if not res.get("available") or not raw_gibs_url:
        raise HTTPException(status_code=404, detail="Satellite imagery unavailable")

    cache_key = f"satellite_tile:{id}:{res.get('capture_date')}"
    cached_tile = memory_cache.get(cache_key)
    if cached_tile:
        return Response(content=cached_tile, media_type="image/jpeg", headers={"Cache-Control": "public, max-age=86400"})

    try:
        import urllib.request
        req = urllib.request.Request(raw_gibs_url, headers={"User-Agent": "Mozilla/5.0 ThermoScope/1.0"})
        with urllib.request.urlopen(req, timeout=12) as response:
            tile_bytes = response.read()
            if len(tile_bytes) < 2500:
                raise HTTPException(status_code=404, detail="No satellite coverage for this pass")
            memory_cache.set(cache_key, tile_bytes, ttl=86400.0)
            return Response(content=tile_bytes, media_type="image/jpeg", headers={"Cache-Control": "public, max-age=86400"})
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Satellite imagery fetch error: {e}")


@router.get("/{id}/history")
def get_fire_history(
    id: str,
    days: int = Query(30, ge=1, le=180, description="Rolling historical window in days (e.g. 1, 7, 30, 90)"),
    radius_km: float = Query(5.0, ge=0.5, le=50.0, description="Spatial comparison radius in kilometers"),
    db: Session = Depends(get_db)
):
    """Retrieve rolling spatial historical baseline for this specific fire observation.
    Calculates observation count, active days, FRP percentiles, and persistence score
    strictly without future data leakage.
    """
    fire = db.query(FireDetection).filter(FireDetection.id == id).first()
    if not fire:
        raise HTTPException(status_code=404, detail=f"Detection '{id}' not found.")

    baseline = get_spatial_historical_baseline(
        db=db,
        lat=fire.latitude,
        lon=fire.longitude,
        target_time=fire.detection_time,
        window_days=days,
        radius_km=radius_km
    )
    return {
        "fire_detection_id": fire.id,
        "detection_time": fire.detection_time.isoformat() if fire.detection_time else None,
        "latitude": fire.latitude,
        "longitude": fire.longitude,
        "history": baseline
    }


@router.get("/{id}/weather", response_model=WeatherContextResponse)
def get_fire_weather_endpoint(id: str, db: Session = Depends(get_db)):
    """Retrieve real weather data (temperature, wind, humidity, precipitation) for fire location."""
    fire = db.query(FireDetection).filter(FireDetection.id == id).first()
    if not fire:
        raise HTTPException(status_code=404, detail=f"Detection '{id}' not found.")
    return get_weather_context(fire.latitude, fire.longitude, db)


@router.get("/{id}/explanation", response_model=RiskExplanationResponse)
def get_fire_explanation_endpoint(id: str, db: Session = Depends(get_db)):
    """Explain why this fire was classified as high risk using actual database evidence."""
    fire = db.query(FireDetection).filter(FireDetection.id == id).first()
    if not fire:
        raise HTTPException(status_code=404, detail=f"Detection '{id}' not found.")
    return generate_risk_explanation(fire, db)


@router.get("/{id}/evidence")
def get_fire_evidence_endpoint(id: str, db: Session = Depends(get_db)):
    """Retrieve structured multi-factor evidence separating telemetry, baseline, exposure, and ML."""
    fire = db.query(FireDetection).filter(FireDetection.id == id).first()
    if not fire:
        raise HTTPException(status_code=404, detail=f"Detection '{id}' not found.")
    return get_multi_factor_evidence(fire, db)


@router.get("/{id}/impact", response_model=ImpactAnalysisResponse)
def get_fire_impact_endpoint(id: str, db: Session = Depends(get_db)):
    """Evaluate nearby facilities, residential settlements, and population exposure."""
    fire = db.query(FireDetection).filter(FireDetection.id == id).first()
    if not fire:
        raise HTTPException(status_code=404, detail=f"Detection '{id}' not found.")
    return evaluate_fire_impact(fire, db)


@router.get("/{id}/movement")
def get_fire_movement_endpoint(id: str, db: Session = Depends(get_db)):
    """Evaluate observed local activity displacement between this detection and proximate observations."""
    fire = db.query(FireDetection).filter(FireDetection.id == id).first()
    if not fire:
        raise HTTPException(status_code=404, detail=f"Detection '{id}' not found.")

    # Find previous detection within 15 km in the 48 hours prior
    det_time = fire.detection_time
    if det_time.tzinfo is None:
        det_time = det_time.replace(tzinfo=timezone.utc)

    prev_det = (
        db.query(FireDetection)
        .filter(
            FireDetection.id != fire.id,
            FireDetection.detection_time < det_time,
            FireDetection.detection_time >= det_time - timedelta(hours=48),
            FireDetection.latitude.between(fire.latitude - 0.15, fire.latitude + 0.15),
            FireDetection.longitude.between(fire.longitude - 0.15, fire.longitude + 0.15)
        )
        .order_by(desc(FireDetection.detection_time))
        .first()
    )

    if not prev_det:
        return {
            "fire_id": fire.id,
            "has_prior_observation": False,
            "displacement_km": 0.0,
            "net_distance_km": 0.0,
            "movement_trend": "STATIONARY",
            "bearing_degrees": None,
            "speed_kmh": None,
            "summary": "Initial isolated observation; no proximate predecessor within 48 hours."
        }

    dist = haversine_distance_km(prev_det.latitude, prev_det.longitude, fire.latitude, fire.longitude)
    bearing = calculate_bearing_deg(prev_det.latitude, prev_det.longitude, fire.latitude, fire.longitude)
    prev_time = prev_det.detection_time
    if prev_time.tzinfo is None:
        prev_time = prev_time.replace(tzinfo=timezone.utc)
    hours = max(0.1, (det_time - prev_time).total_seconds() / 3600.0)
    speed = round(dist / hours, 2)

    weather = get_weather_context(fire.latitude, fire.longitude, db)
    wind_corr = correlate_movement_and_wind(bearing, weather.get("wind_direction"), weather.get("wind_speed"))

    return {
        "fire_id": fire.id,
        "has_prior_observation": True,
        "prior_fire_id": prev_det.id,
        "displacement_km": round(dist, 2),
        "net_distance_km": round(dist, 2),
        "movement_trend": "LINEAR_EXPANSION" if dist > 0.5 else "STATIONARY",
        "bearing_degrees": bearing,
        "speed_kmh": speed,
        "time_interval_hours": round(hours, 1),
        "wind_correlation": wind_corr,
        "summary": f"Observed activity relocated {round(dist, 2)} km over {round(hours, 1)} hrs toward bearing {bearing}°."
    }


@router.get("/{id}/similar")
def get_similar_historical_events(id: str, limit: int = 5, db: Session = Depends(get_db)):
    """Find similar historical fire detections based on FRP magnitude, predicted class, and facility context."""
    fire = db.query(FireDetection).filter(FireDetection.id == id).first()
    if not fire:
        raise HTTPException(status_code=404, detail=f"Detection '{id}' not found.")

    pred = fire.prediction
    target_class = pred.predicted_class if pred else "Industrial Fire"
    target_frp = fire.frp or 50.0

    candidates = (
        db.query(FireDetection)
        .options(joinedload(FireDetection.prediction))
        .filter(FireDetection.id != fire.id)
        .limit(100)
        .all()
    )

    scored = []
    for c in candidates:
        score = 0
        c_pred = c.prediction
        if c_pred and c_pred.predicted_class == target_class:
            score += 40
        c_frp = c.frp or 0.0
        frp_diff_ratio = abs(c_frp - target_frp) / max(10.0, target_frp)
        score += max(0, int(40 * (1.0 - min(1.0, frp_diff_ratio))))
        if c_pred and pred and c_pred.nearby_industrial_type == pred.nearby_industrial_type:
            score += 20
        scored.append((score, c))

    scored.sort(key=lambda x: x[0], reverse=True)

    return {
        "base_fire_id": fire.id,
        "similar_events": [
            {
                "similarity_score_pct": s,
                "fire": item.to_dict()
            }
            for s, item in scored[:limit]
        ]
    }


@router.post("/{id}/review", response_model=AnalystReviewSchema)
def submit_analyst_review(
    id: str,
    payload: AnalystReviewCreateRequest,
    db: Session = Depends(get_db)
):
    """Submit analyst verification decision: CONFIRMED, FALSE_POSITIVE, INCORRECT_CLASSIFICATION, UNKNOWN."""
    fire = db.query(FireDetection).filter(FireDetection.id == id).first()
    if not fire:
        raise HTTPException(status_code=404, detail=f"Detection '{id}' not found.")

    valid_decisions = ["CONFIRMED", "FALSE_POSITIVE", "INCORRECT_CLASSIFICATION", "UNKNOWN"]
    if payload.decision.upper() not in valid_decisions:
        raise HTTPException(status_code=400, detail=f"Invalid decision. Must be one of: {', '.join(valid_decisions)}")

    review = AnalystReview(
        fire_detection_id=fire.id,
        incident_id=fire.incident_id,
        decision=payload.decision.upper(),
        corrected_class=payload.corrected_class,
        analyst_id=payload.analyst_id,
        analyst_name=payload.analyst_name,
        notes=payload.notes,
        reviewed_at=datetime.now(timezone.utc)
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review.to_dict()


@router.get("/{id}/reviews", response_model=List[AnalystReviewSchema])
def get_fire_reviews(id: str, db: Session = Depends(get_db)):
    """Retrieve all analyst verification records for this detection."""
    reviews = db.query(AnalystReview).filter(AnalystReview.fire_detection_id == id).all()
    return [r.to_dict() for r in reviews]


@router.post("/{id}/simulate-risk", response_model=WhatIfSimulationResponse)
def simulate_fire_risk_endpoint(id: str, payload: Optional[WhatIfSimulationRequest] = None, db: Session = Depends(get_db)):
    """Simulate hypothetical risk response for a specific fire detection."""
    req = payload or WhatIfSimulationRequest()
    req.base_fire_id = id
    return simulate_what_if_risk(req, db)


@router.post("/simulate-risk", response_model=WhatIfSimulationResponse)
def simulate_risk_endpoint(payload: WhatIfSimulationRequest, db: Session = Depends(get_db)):
    """Simulate hypothetical risk response with modified FRP, distance, or persistence."""
    return simulate_what_if_risk(payload, db)



