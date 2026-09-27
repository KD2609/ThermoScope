# ML & Alert Service - Backend Integration Contract

This document defines the interface and data contracts for backend and frontend teams consuming output from the ML Risk & Alert Pipeline.

## 1. Input Expected by ML Pipeline
The ML pipeline expects a raw thermal detection containing, at a minimum, location and basic features. Any missing features will be imputed with defaults, though this may reduce prediction accuracy.

### Expected Fields (Raw Detection)
- `observation_id` (str): Unique identifier for the raw detection.
- `latitude` (float): Latitude of the detection.
- `longitude` (float): Longitude of the detection.
- `acq_date_time` (str): ISO 8601 timestamp.
- *Plus all 24 required raw/context features (FRP, brightness_temperature, distance_to_residential_area, etc.)*

## 2. Prediction Output
The internal inference module outputs a `PredictionResult`:
- `predicted_class`: The determined event type (e.g., "Wildfire / Natural Fire").
- `confidence`: ML confidence score (0.0 to 1.0).
- `model_version`: Identifier for the currently active ML model.
- `probabilities`: (Optional) Dictionary of probabilities for all known classes.

## 3. Risk Output
The Risk Engine assigns operational priority based on predictions and contextual physics:
- `risk_score`: A normalized score from 0.0 to 100.0.
- `risk_level`: Enumerated priority (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
- `reasons`: Human-readable strings summarizing why the score was given.
- `evidence`: Structured array of `{factor, value, message}` for precise UI rendering.

## 4. Alert Output
The Alert Dispatcher orchestrates prediction, risk calculation, and duplicate suppression. It outputs an `AlertPayload`. This is the final JSON payload sent to backend webhooks or notification streams.

### Example JSON Payload
```json
{
  "alert_id": "ALT_8A9B1C2D",
  "detection_id": "DET_12345",
  "timestamp": "2026-09-23T12:30:00Z",
  "latitude": 21.103,
  "longitude": 72.635,
  "classification": "Wildfire / Natural Fire",
  "confidence": 0.91,
  "risk_score": 87.5,
  "risk_level": "CRITICAL",
  "reasons": [
    "High classification confidence (91.0%)",
    "Thermal intensity is extreme (FRP=120.5)",
    "Detection is extremely close (1.5 km) to a residential area",
    "Multiple nearby detections form a dense cluster of thermal activity"
  ],
  "evidence": [
    {
      "factor": "ml_confidence",
      "value": 0.91,
      "message": "High classification confidence (91.0%)"
    },
    {
      "factor": "residential_distance",
      "value": 1.5,
      "message": "Detection is extremely close (1.5 km) to a residential area"
    }
  ],
  "model_version": "v2",
  "status": "NEW"
}
```

## 5. Alert Statuses
Alerts follow a simple lifecycle:
- `NEW`: Just dispatched, untouched by operators.
- `ACTIVE`: Acknowledged/investigated by an operator.
- `ACKNOWLEDGED`: Assigned to field units or recognized as a false positive.
- `RESOLVED`: The event has concluded.

## 6. Error Cases
- `Missing Coordinates`: Request is rejected immediately.
- `Model Loading Failure`: System fails to start (fails fast during init).
- `Invalid Feature Data`: Feature values out of physical bounds (e.g., NaN/Inf) are logged and replaced with safe defaults before model prediction.
- `Duplicate Suppression`: If a detection belongs to an active event, it is silently suppressed (returns `None` without dispatching).
