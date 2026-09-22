# ThermoScope AI: System Architecture & Technical Specifications

> **SIH Problem Statement ID 26162 (NTRO)**  
> *AI-Powered Industrial Thermal Intelligence & Early Warning Geospatial Platform*

---

## 1. High-Level Architecture Overview

ThermoScope AI bridges satellite earth observation data with geospatial infrastructure topology and calibrated machine learning models to detect, classify, and track industrial fires, anomalous petrochemical flare spikes, and acute thermal emergencies.

```
+-------------------------------------------------------------------------+
|                              NASA LANCE                                 |
|               (VIIRS SNPP, NOAA-20, NOAA-21 / MODIS)                    |
+------------------------------------+------------------------------------+
                                     |
                          [Real-Time HTTP API]
                                     |
                                     v
+------------------------------------+------------------------------------+
|               DATA INGESTION ENGINE (data-ingestion/)                   |
|   * Deterministic SHA-256 Deduplication Hash                            |
|   * Rate-limiting & Backoff Retry Logic                                 |
|   * Field Normalization (VIIRS / MODIS)                                 |
|   * Scheduled Async Poller (15 min intervals)                           |
+------------------------------------+------------------------------------+
                                     |
                                     v
+------------------------------------+------------------------------------+
|               POSTGRESQL / POSTGIS (or Local SQLite)                    |
|   * fire_detections (Spatial Geometry, FRP, Brightness)                 |
|   * industrial_sites (Refineries, Steel Plants, Overpass)               |
|   * residential_areas (Settlements, Population, Buffers)                |
+------------------------------------+------------------------------------+
                                     |
                                     v
+------------------------------------+------------------------------------+
|            GEOSPATIAL & TOPOLOGY SERVICE (backend/services/)            |
|   * Geodesic Distance Matrix (1 km, 5 km, 10 km)                        |
|   * Residential Buffer Zones (Critical <1km, High <2km, Medium <3km)   |
|   * Dynamic OpenStreetMap Overpass Querying                             |
+------------------------------------+------------------------------------+
                                     |
                                     v
+------------------------------------+------------------------------------+
|             AI / MACHINE LEARNING SUBSYSTEM (ml/)                       |
|   * Scikit-Learn Calibrated Random Forest Ensemble                      |
|   * 6-Class Probabilities (Industrial Fire, Gas Flare, Wildfire...)      |
|   * Persistence Scoring & Baseline Anomaly Recurrence                   |
+------------------------------------+------------------------------------+
                                     |
                                     v
+------------------------------------+------------------------------------+
|             ALERT & PUBLIC AWARENESS ENGINE (alert-service/)             |
|   * Deduplication Key: {incident_id}_{alert_type}_{date}                |
|   * Multi-Factor Risk Normalization (0 - 100)                           |
|   * Geographic Awareness Circle Intersections                           |
|   * Responsible, Non-Alarmist Notifications                             |
+------------------------------------+------------------------------------+
                                     |
                                     v
+------------------------------------+------------------------------------+
|          FRONTEND WEB APPLICATION (React + TypeScript + Vite)           |
|   * Standalone High-Polished Landing Page (Framer Motion)               |
|   * Live GIS Map Console (Leaflet + Marker Clustering)                  |
|   * Incident Dossier & Satellite Context Imagery (NASA GIBS)            |
|   * Alert Management & Geographic Subscription Registry                 |
+-------------------------------------------------------------------------+
```

---

## 2. Component Boundaries

| Component | Directory | Responsibilities |
|---|---|---|
| **Data Ingestion** | `data-ingestion/` | Interfaces with NASA FIRMS API, handles retries, deduplication, and scheduled background polling. |
| **Machine Learning** | `ml/` | Offline training script (`train.py`), feature vectorization (`feature_extractor.py`), real-time inference (`predict.py`), model artifacts (`models/`). |
| **Backend API** | `backend/` | FastAPI REST services, SQLAlchemy session manager, geospatial calculations, risk engine, and system observability. |
| **Alert Service** | `alert-service/` | Deduplicated alert generation, subscriber buffer matching, and dispatch abstraction. |
| **GIS Frontend** | `frontend/` | Light-mode geospatial UI built with Vite, React, TypeScript, TailwindCSS, Leaflet, and Marker Clustering. |

---

## 3. Database Schema Design

### `fire_detections`
- `id` (VARCHAR PK): Formatted detection ID.
- `source` (VARCHAR): e.g. `NASA_FIRMS`.
- `sensor` (VARCHAR): e.g. `VIIRS_SNPP_NRT`, `MODIS_NRT`.
- `latitude` / `longitude` (FLOAT, Indexed): Coordinates.
- `detection_time` (TIMESTAMP, Indexed): UTC observation time.
- `brightness_temperature` (FLOAT): Kelvin reading.
- `frp` (FLOAT): Fire Radiative Power in Megawatts (MW).
- `confidence` (FLOAT): 0-100 confidence value.
- `day_night` (VARCHAR): 'D' (Day) or 'N' (Night).
- `dedup_hash` (VARCHAR UNIQUE): SHA-256 hash preventing identical records.
- `is_demo_fallback` (BOOLEAN): Explicit transparency flag.

### `fire_predictions`
- `id` (INT PK): Serial identifier.
- `fire_detection_id` (VARCHAR FK): Linked detection.
- `predicted_class` (VARCHAR): Industrial Fire, Gas Flare, etc.
- `confidence` (FLOAT): Calibrated confidence (0.0 - 1.0).
- `risk_score` (FLOAT): Multi-factor score (0.0 - 100.0).
- `severity` (VARCHAR): LOW, MEDIUM, HIGH, CRITICAL.
- `model_version` (VARCHAR): Tracks model release version.
- `class_probabilities` (TEXT JSON): Probabilities for all 6 classes.
- `recommended_response` (TEXT): Actionable guidelines.

### `industrial_sites`
- `id` (VARCHAR PK): Asset identifier.
- `name` (VARCHAR): Facility name.
- `type` (VARCHAR): refinery, steel_plant, power_plant, petrochemical, etc.
- `latitude` / `longitude` (FLOAT): Facility centroid.
- `risk_category` (VARCHAR): CRITICAL, HIGH, MEDIUM.

### `residential_areas`
- `id` (VARCHAR PK): Settlement ID.
- `name` (VARCHAR): Township / settlement name.
- `latitude` / `longitude` (FLOAT): Settlement center.
- `population_estimate` (INT): Census population estimate.
- `danger_radius_km` (FLOAT): Configured safety buffer.

### `alerts`
- `id` (VARCHAR PK): Alert identifier.
- `fire_detection_id` (VARCHAR FK): Linked fire.
- `alert_type` (VARCHAR): CRITICAL_INDUSTRIAL_FIRE, RESIDENTIAL_PROXIMITY_AWARENESS.
- `severity` (VARCHAR): Severity classification.
- `dedup_key` (VARCHAR UNIQUE): Prevents duplicate spamming.
- `status` (VARCHAR): NEW, ACKNOWLEDGED, RESOLVED.
