# ThermoScope AI: REST API Reference

All endpoints return JSON responses and standard HTTP status codes.

Base URL: `http://localhost:8000/api`

---

## 1. Fire Detections

### `GET /api/fires`
Query list of thermal anomaly detections with pagination and filtering.

**Parameters:**
- `page` (int, default `1`): Page number.
- `page_size` (int, default `25`): Number of items per page.
- `severity` (string, optional): Filter by `LOW`, `MEDIUM`, `HIGH`, or `CRITICAL`.
- `predicted_class` (string, optional): Filter by class name substring.
- `min_confidence` (float, optional): Minimum confidence percentage (0-100).
- `sensor` (string, optional): Filter by sensor name (`VIIRS`, `MODIS`).
- `is_industrial_only` (bool, optional): Return only industrial events.

**Sample Response:**
```json
{
  "total": 48,
  "page": 1,
  "page_size": 25,
  "items": [
    {
      "id": "DET-JAM-LIVE-01",
      "source": "NASA_FIRMS",
      "sensor": "VIIRS_SNPP",
      "latitude": 22.474,
      "longitude": 70.055,
      "detection_time": "2026-09-17T18:30:00Z",
      "brightness_temperature": 455.4,
      "frp": 512.6,
      "confidence": 99.0,
      "day_night": "N",
      "satellite": "Suomi-NPP",
      "instrument": "VIIRS",
      "is_demo_fallback": false,
      "prediction": {
        "predicted_class": "Industrial Fire",
        "confidence": 0.94,
        "risk_score": 92.4,
        "severity": "CRITICAL",
        "model_version": "v1.0.0",
        "nearby_industrial_name": "Jamnagar Mega Refinery Complex",
        "distance_to_industrial_km": 0.5
      }
    }
  ]
}
```

### `GET /api/fires/active`
Retrieve all active observations within the specified hours window (default 48 hours).

### `GET /api/fires/nearby`
Search thermal detections within a radius of a coordinate:
- `lat` (float, required)
- `lon` (float, required)
- `radius_km` (float, default 25.0)

### `GET /api/fires/{id}`
Retrieve full dossier for an incident.

### `GET /api/fires/{id}/prediction`
Retrieve model prediction, version, and full 6-class probability distribution.

### `GET /api/fires/{id}/risk`
Retrieve multi-factor risk components, intensity score, and response guidelines.

### `GET /api/fires/{id}/satellite`
Retrieve satellite context tile or explicit unavailable notice via `SatelliteProvider`.

---

## 2. Alerts & Incident Management

### `GET /api/alerts`
List operational alerts.
- `status` (string, optional): `NEW`, `ACKNOWLEDGED`, `RESOLVED`.
- `severity` (string, optional): `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`.

### `POST /api/alerts/{id}/acknowledge`
Acknowledge an alert.
**Body:**
```json
{
  "user_name": "Senior Incident Commander"
}
```

### `POST /api/alerts/{id}/resolve`
Resolve an alert with field notes.
**Body:**
```json
{
  "user_name": "Field Safety Team",
  "notes": "Verified on-site conditions. Thermal emission contained."
}
```

---

## 3. Industrial Sites & Infrastructure

### `GET /api/industrial-sites`
Retrieve registered industrial infrastructure facilities.

### `GET /api/industrial-sites/nearby`
Find registered facilities within a given radius (`lat`, `lon`, `max_range_km`).

---

## 4. Geographic Subscriptions (Public Awareness)

### `GET /api/subscriptions`
List subscriptions for user email.

### `POST /api/subscriptions`
Register geographic watch area:
```json
{
  "user_email": "resident@thermoscope.local",
  "area_name": "Moti Khavdi Settlement Watch",
  "latitude": 22.4900,
  "longitude": 70.0750,
  "radius_km": 5.0,
  "email_enabled": true,
  "browser_enabled": true,
  "sms_enabled": false
}
```

### `DELETE /api/subscriptions/{id}`
Remove a registered watch area.

---

## 5. System Observability & Sync

### `GET /api/system/health`
Observability status for Database, NASA FIRMS, and ML Engine.

### `GET /api/system/firms-status`
Telemetry details on FIRMS sync state, last sync timestamp, and records processed.

### `POST /api/admin/sync`
Manually trigger an on-demand NASA FIRMS fetch and classification cycle.
