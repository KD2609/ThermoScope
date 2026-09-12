import json
from datetime import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base, SessionLocal
from app.models.models import (
    ThermalAnomaly, IndustrialAsset, ClassificationResult, RiskAssessment,
    Alert, Investigation, TemporalObservation, AuditLog, DataSourceStatus, User
)
from app.data.seed_data import INITIAL_ASSETS, get_initial_anomalies, get_historical_observations
from app.services.features import extract_features
from app.services.classification import classifier
from app.services.persistence import evaluate_persistence_and_baseline
from app.services.risk import calculate_risk
from app.services.alerts_engine import evaluate_alert_decision

# API Routers
from app.api.anomalies import router as anomalies_router
from app.api.assets import router as assets_router
from app.api.alerts import router as alerts_router
from app.api.investigations import router as investigations_router
from app.api.analytics import router as analytics_router
from app.api.system import router as system_router
from app.api.demo import router as demo_router
from app.api.reports import router as reports_router

def init_db_and_seed():
    """Create tables and populate initial curated datasets."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # 1. Seed Industrial Assets if empty
        if db.query(IndustrialAsset).count() == 0:
            for item in INITIAL_ASSETS:
                asset = IndustrialAsset(**item)
                db.add(asset)
            db.commit()

        assets = db.query(IndustrialAsset).all()

        # 2. Seed Historical Observations if empty
        if db.query(TemporalObservation).count() == 0:
            hist_records = get_historical_observations()
            asset_map = {a.asset_id: a.id for a in assets}
            for rec in hist_records:
                asset_db_id = asset_map.get(rec.get("asset_id_str"))
                obs = TemporalObservation(
                    asset_id=asset_db_id,
                    cluster_key=rec.get("asset_id_str", "HIST-CLUSTER"),
                    latitude=rec["latitude"],
                    longitude=rec["longitude"],
                    timestamp=rec["timestamp"],
                    frp=rec["frp"],
                    daynight=rec["daynight"],
                    satellite=rec["satellite"],
                    is_baseline_eligible=True
                )
                db.add(obs)
            db.commit()

        history = db.query(TemporalObservation).all()

        # 3. Seed Anomalies & run initial classification pipeline if empty
        if db.query(ThermalAnomaly).count() == 0:
            seed_anomalies = get_initial_anomalies()
            for item in seed_anomalies:
                anomaly = ThermalAnomaly(**item)
                db.add(anomaly)
                db.commit()
                db.refresh(anomaly)

                # Feature extraction
                features = extract_features(anomaly, assets, history)
                # Classification
                clf_res = classifier.classify(features)
                # Persistence & Baseline
                baseline_res = evaluate_persistence_and_baseline(anomaly, history)
                # Risk calculation
                risk_res = calculate_risk(features, clf_res)

                # Store classification result
                clf_db = ClassificationResult(
                    anomaly_id=anomaly.id,
                    predicted_class=clf_res["predicted_class"],
                    confidence_score=clf_res["confidence_score"],
                    class_probabilities=json.dumps(clf_res["class_probabilities"]),
                    supporting_evidence=json.dumps(clf_res["supporting_evidence"]),
                    uncertainty_factors=json.dumps(clf_res["uncertainty_factors"]),
                    feature_contributions=json.dumps(clf_res["feature_contributions"]),
                    model_name=clf_res["model_name"]
                )
                db.add(clf_db)

                # Store risk result
                risk_db = RiskAssessment(
                    anomaly_id=anomaly.id,
                    risk_score=risk_res["risk_score"],
                    risk_level=risk_res["risk_level"],
                    investigation_priority=risk_res["investigation_priority"],
                    intensity_component=risk_res["components"]["intensity"],
                    proximity_component=risk_res["components"]["proximity"],
                    abnormality_component=risk_res["components"]["abnormality"],
                    persistence_component=risk_res["components"]["persistence"],
                    criticality_component=risk_res["components"]["criticality"],
                    confidence_component=risk_res["components"]["confidence"],
                    formula_weights=json.dumps(risk_res["formula_weights"])
                )
                db.add(risk_db)

                # Store alert via context-aware decision engine
                existing_alerts = db.query(Alert).all()
                decision = evaluate_alert_decision(anomaly, features, clf_res, risk_res, existing_alerts)
                
                if decision["action"] == "CREATE_NEW":
                    alert_db = Alert(
                        alert_id=f"ALT-{anomaly.id:04d}",
                        anomaly_id=anomaly.id,
                        severity=decision["severity"],
                        title=decision["title"],
                        message=decision["message"],
                        facility_name=decision["facility_name"],
                        status="NEW"
                    )
                    db.add(alert_db)
                elif decision["action"] == "CONSOLIDATE" and decision.get("target_alert_id"):
                    target_alert = db.query(Alert).filter(Alert.id == decision["target_alert_id"]).first()
                    if target_alert:
                        target_alert.severity = decision["severity"]
                        target_alert.message = decision["updated_message"]

                # Store investigation record with evidence-linked recommendation
                inv_db = Investigation(
                    anomaly_id=anomaly.id,
                    status="NEW",
                    assigned_analyst="Unassigned",
                    notes=json.dumps([
                        {
                            "id": "NOTE-INIT",
                            "timestamp": anomaly.timestamp.strftime("%Y-%m-%d %H:%M:%S UTC"),
                            "author": "Automated Ingestion",
                            "text": f"Telemetry ingested from {anomaly.satellite}. Initial evidence fusion completed."
                        }
                    ]),
                    recommendation=decision["investigation_recommendation"]
                )
                db.add(inv_db)

                # Audit Log
                audit = AuditLog(
                    action="EVENT_INGESTED",
                    entity_type="ANOMALY",
                    entity_id=anomaly.event_id,
                    user_name="System Ingestion",
                    details=f"Anomaly ingested and classified as {clf_res['predicted_class']} ({risk_res['risk_level']} priority)."
                )
                db.add(audit)

            db.commit()

        # 4. Seed Demo Users if empty
        if db.query(User).count() == 0:
            demo_users = [
                {"username": "admin", "full_name": "Senior Incident Commander", "role": "ADMIN"},
                {"username": "analyst", "full_name": "Thermal Intelligence Analyst", "role": "ANALYST"},
                {"username": "responder", "full_name": "Field Safety Dispatcher", "role": "RESPONDER"},
                {"username": "viewer", "full_name": "Public Observer", "role": "VIEWER"},
            ]
            for u in demo_users:
                db.add(User(**u))
            db.commit()

    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db_and_seed()
    yield

app = FastAPI(
    title="ThermoScope AI API",
    description="AI-Powered Industrial Thermal Intelligence & Early Warning System (SIH PS ID 26162)",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(system_router)
app.include_router(anomalies_router)
app.include_router(assets_router)
app.include_router(alerts_router)
app.include_router(investigations_router)
app.include_router(analytics_router)
app.include_router(demo_router)
app.include_router(reports_router)

@app.get("/")
def root():
    return {
        "platform": "ThermoScope AI",
        "tagline": "AI-Powered Industrial Thermal Intelligence & Early Warning System",
        "problem_statement": "SIH PS ID 26162 (NTRO)",
        "docs_url": "/docs",
        "health_check": "/api/system/health"
    }
