# System Architecture & Data Pipeline

**Platform:** THERMOSCOPE AI  
**Problem Statement:** NTRO SIH PS ID 26162  
**Tagline:** *AI-Powered Industrial Thermal Intelligence & Early Warning System*

---

## 1. High-Level Architecture

ThermoScope AI bridges raw satellite radiometric observations with industrial infrastructure context, eliminating the fundamental limitation of NASA FIRMS: answering not just **WHERE** heat was observed, but **WHAT** it represents, **WHY**, and **HOW CONFIDENT** the assessment is.

```mermaid
graph TD
    subgraph Data Sources
        F1[NASA FIRMS: VIIRS NOAA-21 / NOAA-20 / MODIS]
        F2[OSM Industrial Infrastructure Registry]
        F3[Multi-Temporal Historical Baseline DB]
        F4[Satellite Context Layer: ESRI / Carto]
    end

    subgraph Ingestion & Fallback Layer
        I1[FIRMS Ingestion Adapter: MAP_KEY or Demo Fallback]
        I2[OSM Overpass / Cached Local Asset Registry]
        I3[Data Normalization & Deduplication]
    end

    F1 --> I1
    F2 --> I2
    I1 --> I3
    I2 --> I3

    subgraph Geospatial Feature Engine
        FE1[Haversine Geodesic Distance]
        FE2[Shapely Point-in-Polygon Facility Boundary Match]
        FE3[Land-Cover Context Inferrer: Industrial / Agri / Forest]
        FE4[Settlement Proximity Estimator]
    end

    I3 --> FE1
    I3 --> FE2
    I3 --> FE3
    I3 --> FE4

    subgraph Temporal Persistence & Baseline Engine
        TE1[Temporal Cluster Aggregator]
        TE2[30-Day Operational Baseline: FRP Median & Variance]
        TE3[Baseline Deviation Calculator: Threshold >= 3 obs]
        TE4[Recurrence & Persistence Detector]
    end

    F3 --> TE1
    TE1 --> TE2
    TE2 --> TE3
    TE3 --> TE4

    subgraph Hybrid AI & Evidence Fusion
        ML1[Random Forest / Gradient Boosting Model]
        ML2[Geospatial Rule & Context Calibrator]
        ML3[Explainable AI Engine: Contributing Factors]
        ML4[Uncertainty & Limitation Generator]
    end

    FE1 & FE2 & FE3 & FE4 & TE3 & TE4 --> ML1
    FE1 & FE2 & FE3 & FE4 & TE3 & TE4 --> ML2
    ML1 & ML2 --> ML3
    ML1 & ML2 --> ML4

    subgraph Decision Support & Operations
        R1[Multi-Factor Weighted Risk Engine: 0-100]
        R2[Alert Triage Queue: Critical / High / Med / Low]
        R3[Investigation Workflow: New / Review / Verified / Resolved]
        R4[Printable Intelligence Dossier Generator]
    end

    ML3 & ML4 --> R1
    R1 --> R2
    R2 --> R3
    R3 --> R4

    subgraph Command Center UI
        UI1[FastAPI REST Backend: 127.0.0.1:8000]
        UI2[React + TypeScript + Tailwind + Leaflet GIS UI]
    end

    R1 & R2 & R3 & R4 --> UI1
    UI1 <--> UI2
```

---

## 2. Core Functional Pillars

1. **Dual Operational Modes:**
   - **LIVE MODE:** Queries live NASA FIRMS API when credentials are provided.
   - **DEMO MODE:** Uses pre-seeded, high-fidelity Indian industrial clusters (Jamnagar, Hazira, Angul, Korba, Dhanbad, Trombay, Digboi, Punjab). Works 100% offline without external internet.

2. **Geospatial Proximity & Point-in-Polygon:**
   - Shapely evaluates whether an anomaly coordinate falls inside mapped facility polygon boundaries.
   - Distance to nearest mapped asset is dynamically measured in meters.

3. **Statistical Baseline Cutoff Rule:**
   - To prevent fabricated baselines, a minimum of 3 historical observations is strictly required before calculating median FRP and deviation percentage. Otherwise, the system reports `"Insufficient historical data"`.

4. **Multi-Factor Risk Scoring:**
   - Combines Intensity (FRP), Proximity, Baseline Abnormality, Persistence, Asset Criticality, and AI Confidence into a transparent 0–100 score.
