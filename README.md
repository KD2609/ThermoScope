# ThermoScope AI

> **Production-Oriented Geospatial Intelligence Platform for Industrial Fire & Persistent Thermal Source Monitoring**  
> *Smart India Hackathon (SIH) Problem Statement ID 26162 (NTRO)*

---

## Overview

**ThermoScope AI** is an AI-powered geospatial intelligence web application built to distinguish genuine industrial thermal emergencies from persistent operational gas flaring, natural wildfires, and agricultural burns.

The system connects live **NASA FIRMS** satellite thermal observations with **OpenStreetMap** industrial infrastructure and residential settlements, running calibrated **Ensemble Machine Learning classification**, spatial danger buffer evaluation, and deduplicated early-warning alerting.

---

## System Architecture

```
NASA FIRMS (VIIRS/MODIS)
        ↓
Data Ingestion (Deduplication + Normalization)
        ↓
PostgreSQL + PostGIS (or Local SQLite Fallback)
        ↓
Geospatial Context Fusion (OpenStreetMap Industrial + Residential)
        ↓
Historical / Temporal Feature Engineering
        ↓
Scikit-Learn Machine Learning Classifier (v1.0.0)
        ↓
Multi-Factor Risk Engine (Intensity + Proximity + Class)
        ↓
Alert Engine & Public Awareness Subscriptions
        ↓
Interactive GIS Web Dashboard (Leaflet + Marker Clustering)
```

---

## Directory Structure

```
├── data/
│   ├── training_data.csv          # Editable CSV dataset for ML training
│   ├── industrial_sites_seed.json # Curated OSM industrial facilities
│   ├── residential_areas_seed.json# Curated settlement boundaries & danger buffers
│   └── demo_fallback.json         # Explicitly marked offline fallback observations
├── ml/
│   ├── feature_extractor.py       # Shared vectorizer for training & inference
│   ├── train.py                   # Model training and evaluation script
│   ├── predict.py                 # Real-time inference engine
│   └── models/
│       ├── fire_classifier_v1.pkl # Serialized trained model bundle
│       └── metrics.json           # Accuracy, F1, and confusion matrix
├── data-ingestion/
│   ├── firms_ingestion.py         # NASA FIRMS API client with retry & deduplication
│   ├── osm_ingestion.py           # OpenStreetMap Overpass client & seeding
│   └── scheduler.py               # Periodic background polling worker
├── alert-service/
│   └── dispatcher.py              # Notification dispatch & channel abstraction
├── backend/
│   ├── requirements.txt           # Python dependencies
│   ├── tests/
│   │   └── test_backend.py        # Pytest unit & API integration tests
│   └── app/
│       ├── main.py                # FastAPI entrypoint with lifespan startup
│       ├── config.py              # Pydantic Settings (.env)
│       ├── database.py            # SQLAlchemy engine (Postgres/PostGIS + SQLite)
│       ├── models/models.py       # Database schema models
│       ├── schemas/schemas.py     # Pydantic request/response schemas
│       ├── api/                   # REST API routes (fires, alerts, sites, system)
│       └── services/              # Geospatial, Risk, Satellite, FIRMS services
├── frontend/
│   ├── package.json               # Node dependencies
│   ├── vite.config.ts             # Vite dev server with /api proxy
│   ├── tailwind.config.js         # Geospatial light theme configuration
│   └── src/
│       ├── pages/                 # Landing, Dashboard, Explorer, Dossier, Alerts, Settings, Admin
│       ├── components/            # Leaflet Map with clustering, Navbar, Badges
│       └── services/api.ts        # Centralized API client
└── docs/
    ├── architecture.md            # Complete architecture & data pipeline specs
    ├── ml_training.md             # Dataset guide and model retraining instructions
    ├── deployment.md              # Cloud deployment instructions (Vercel, Render, AWS)
    └── api_reference.md           # REST API endpoints documentation
```

---

## Quickstart Guide

### 1. Backend Setup

```bash
# Optional: Set up virtual environment
python -m venv venv
venv\Scripts\activate  # Windows (or source venv/bin/activate on Linux/Mac)

# Install Python dependencies
pip install -r backend/requirements.txt

# (Optional) Retrain or verify the ML model
python ml/train.py

# Run unit and API integration tests
python -m pytest backend/tests/test_backend.py -v

# Start FastAPI backend server
uvicorn backend.app.main:app --reload --port 8000
```

The backend API will be available at:
- **API Base**: `http://localhost:8000`
- **Interactive OpenAPI Documentation**: `http://localhost:8000/docs`
- **Health Check**: `http://localhost:8000/api/system/health`

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

Open `http://localhost:5173` in your browser:
- `/`: Separate, polished Public Landing Page
- `/dashboard`: Live GIS Monitoring Console with Leaflet marker clustering
- `/fires`: Fire & Incident Explorer table
- `/fires/:id`: Technical Incident Dossier & Satellite Context
- `/alerts`: Operational Alert Center with Acknowledge/Resolve workflow
- `/analytics`: Thermal Intelligence & Classification Analytics
- `/settings`: Public Awareness Geographic Subscriptions
- `/admin`: System Health & Manual NASA FIRMS Synchronization

---

## Key Capabilities

1. **Official NASA FIRMS API Integration**: Real-time ingest of VIIRS and MODIS observations using `NASA_FIRMS_MAP_KEY` with SHA-256 cryptographic deduplication.
2. **Transparent Offline Fallback**: If the NASA API key is omitted or the network is unreachable, clearly labeled sample baselines are loaded without presenting fake data as live.
3. **Calibrated ML Classification**: 6-class model trained on `data/training_data.csv` identifying Industrial Fires, Gas Flares, Wildfires, Agricultural burns, Mining activity, and Uncertain signatures.
4. **Spatial Topology Analysis**: Automatic OpenStreetMap proximity matching against refineries, chemical plants, power stations, and residential settlements.
5. **Satellite Context Imagery Abstraction**: Provider architecture delivering NASA GIBS NRT orbital reflectance tiles or transparently stating "Satellite imagery unavailable for this detection" (zero fabricated evidence).
6. **Public Geographic Subscriptions**: Allows citizens and observers to monitor custom radiuses with responsible, non-alarmist warning notifications.
7. **Production Light-Mode Design**: Restrained, professional styling adhering to geospatial intelligence conventions with zero generic neon clutter.

---

## License & Attribution

Developed for **Smart India Hackathon (SIH) 2026 - Problem Statement ID 26162 (NTRO)**.  
Data provided by NASA Earthdata FIRMS and OpenStreetMap contributors.
