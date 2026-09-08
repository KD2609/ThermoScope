# THERMOSCOPE AI
### AI-Powered Industrial Thermal Intelligence & Early Warning System
**Smart India Hackathon (SIH) | Problem Statement ID:** 26162  
**Organization:** National Technical Research Organisation (NTRO)  
**Theme:** Disaster Management | **Category:** Software  

---

## 1. Problem Overview & NTRO Context

Industrial facilities such as oil refineries, petrochemical complexes, thermal power plants, steel mills, mining zones, and LNG terminals generate thermal signatures that can be observed from space.

Current satellite fire monitoring systems (such as NASA FIRMS) detect thermal anomalies (hotspots), but **cannot reliably distinguish between:**
* Catastrophic industrial fires
* Gas flares & combustion stacks
* Routine operational industrial heat sources
* Agricultural stubble burning
* Forest / wild vegetation fires
* Subsurface coalfield fires & mining activity
* Unverified transient thermal anomalies

### The Core Problem NASA FIRMS Leaves Unanswered:
> NASA FIRMS answers: **"WHERE is a thermal anomaly?"**  
> ThermoScope AI answers: **"WHAT is this anomaly likely to represent, WHAT evidence supports that assessment, IS it persistent or abnormal compared to baseline, and SHOULD an analyst investigate it?"**

ThermoScope AI is an **AI-assisted geospatial thermal anomaly classification and investigation-prioritisation platform**. It transforms raw thermal anomalies into actionable intelligence.

---

## 2. Key Technical Differentiator: Thermal Context Fusion

Instead of treating satellite fire pixels as isolated points:
$$\text{NASA FIRMS} + \text{Industrial GIS (OSM)} + \text{Land-Use Context} + \text{30-Day Baseline} + \text{Hybrid AI} \longrightarrow \mathbf{Industrial\ Thermal\ Intelligence}$$

```
Thermal Anomaly (FRP, Brightness, Orbit)
         ↓
Spatial Join (Shapely Point-in-Polygon & Distance to Asset)
         ↓
Temporal Baseline Engine (30-Day Median & Deviation)
         ↓
Hybrid AI Classifier (Random Forest + Geospatial Rules)
         ↓
Explainable Evidence Fusion (Contributing Factors + Uncertainties)
         ↓
Multi-Factor Risk Scoring (0–100 Investigation Priority)
         ↓
Command Center GIS Map & Printable Incident Dossier
```

---

## 3. Core Screens & Capabilities

1. **Executive Command Center:** Top KPI telemetry strip, full GIS map with clustering, live alert triage feed, and quick facility jump.
2. **Thermal Intelligence Map:** Interactive GIS map with multi-layer toggles (Satellite Context, Industrial Assets, Thermal Hotspots) and multi-attribute filters (Classification, Severity, Min FRP, Region).
3. **Incident / Anomaly Explorer:** High-density data grid with search, multi-column sorting, severity badges, and CSV export.
4. **Incident Intelligence Dossier (Centerpiece):** Comprehensive investigation dossier:
   - FRP vs 30-Day Baseline Median with deviation % (requires $\ge 3$ observations for statistical validity; no fabricated baselines).
   - Contributing Evidence Factors & Known Uncertainty Limitations.
   - 6-Factor Risk Breakdown (Intensity, Proximity, Abnormality, Persistence, Criticality, Confidence).
   - Live Operational Investigation Workflow (`NEW` $\rightarrow$ `UNDER REVIEW` $\rightarrow$ `VERIFIED` / `FALSE POSITIVE` $\rightarrow$ `RESOLVED`).
   - Analyst notes stream and tamper-evident audit trail.
5. **Industrial Asset Registry:** Facility catalog (Jamnagar, Hazira, Angul, Korba, Dhanbad Jharia, Trombay, Mundra, Digboi) with operational baseline envelopes.
6. **Alert & Investigation Center:** Triage queue with Acknowledge, Assign Responder, and Resolve capabilities.
7. **Analytics & Reports:** Visual breakdown by class, risk, region, and industrial vs natural ratio.
8. **System Health Telemetry:** NASA FIRMS connection status with graceful fallback, local OSM registry status, and Live vs Demo mode switcher.
9. **One-Click SIH Key Scenario Runner:** Deterministic scenarios (Industrial Fire, Agricultural false-positive avoidance, Persistent power station heat).

---

## 4. Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Leaflet GIS |
| **Backend** | Python 3.13, FastAPI, Uvicorn, SQLAlchemy, SQLite (PostGIS-ready) |
| **Geospatial & ML** | Shapely, Scikit-Learn (Random Forest), NumPy, Pandas |
| **Testing** | Pytest, FastAPI TestClient, Automated End-to-End Smoke Test |

---

## 5. Quickstart & Local Setup

### Prerequisites
* Node.js v18+ & npm
* Python 3.10+

### Option A: Local Run (Two Terminal Setup)

#### 1. Start the Backend API (FastAPI)
```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
* Backend will initialize the database, seed 8 major Indian industrial facilities, and pre-classify 10 thermal anomalies on startup.
* API Documentation: `http://127.0.0.1:8000/docs`

#### 2. Start the Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
* Open your browser at: `http://localhost:5173`

---

## 6. Verification & Test Suite

Run the full automated test suite:
```bash
# Run backend pytest suite (10 unit/integration tests)
cd backend
python -m pytest tests/test_backend.py -v

# Run end-to-end smoke audit test from root
cd ..
python smoke_test.py

# Verify frontend production build
cd frontend
npm run build
```

---

## 7. SIH Demo Walkthrough (Deterministic Scenarios)

The application includes a prominent **SIH Demo Engine** bar at the top of the interface:

1. **Scenario A: Industrial Fire (Jamnagar Mega Refinery Complex)**
   - Click **"Scenario A: Industrial Fire"**.
   - A new high-intensity anomaly (FRP 188.5 MW) is injected inside the refinery boundary.
   - System flags: **Potential Industrial Fire (91% confidence)** with **CRITICAL Risk (88.5/100)**.
   - Explains that FRP is **+125.0% above the 58 MW operational baseline**.
   - Demonstrates status update (`UNDER REVIEW`), note logging, and printable dossier export.

2. **Scenario B: Agricultural Burn False-Positive (Sangrur, Punjab)**
   - Click **"Scenario B: Agricultural False-Positive"**.
   - A hotspot appears near an industrial transit corridor.
   - The spatial engine identifies agricultural land context, typical stubble FRP (26.5 MW), and zero facility boundary overlap.
   - Classified as **Agricultural / Biomass Burn (88% confidence, LOW Risk)**.
   - **Emergency alarm is suppressed**, proving the system does not simply assume *"hotspot near factory = fire"*.

3. **Scenario C: Persistent Industrial Source (Korba Super Thermal Power Station)**
   - Click **"Scenario C: Persistent Source"**.
   - Identifies steady operational heat (49.5 MW vs 50.0 MW median across 31 observations).
   - Classified as **Routine / Persistent Industrial Thermal Source (92% confidence)** without false alarms.

---

## 8. Responsible AI & Data Transparency

* **Probabilistic Indicator Notice:** Satellite thermal anomalies are radiometric heat measurements and do not constitute ground confirmation of an uncontained fire.
* **No Fabricated Baselines:** If fewer than 3 observations exist for a coordinate cluster, the system explicitly reports *"Insufficient historical observations to establish a baseline"*.
* **No Fabricated Model Metrics:** The prototype classifier is labeled as a *"Hybrid AI + Geospatial Evidence Model"* trained on curated representative feature distributions.

---

## 9. Default Demo Credentials

| Role | Username | Permissions |
|---|---|---|
| **Incident Commander** | `admin` | Full system access, mode toggle, configuration |
| **Intelligence Analyst** | `analyst` | Triage, classification review, notes, dossier generation |
| **Field Dispatcher** | `responder` | Alert acknowledgement, responder assignment, resolution |
| **Observer** | `viewer` | Read-only inspection of maps and statistics |

---

## 10. License & Attribution
Developed for the **Smart India Hackathon** by the Autonomous Geospatial AI Engineering Team.
Data sources: NASA FIRMS (VIIRS/MODIS), OpenStreetMap (OSM) contributors, CartoDB, ESRI.
