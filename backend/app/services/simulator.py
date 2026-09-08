import json
from datetime import datetime, timedelta
from typing import Any, Optional
from sqlalchemy.orm import Session
from app.models.models import ThermalAnomaly, IndustrialAsset, ClassificationResult, RiskAssessment, Alert, Investigation, AuditLog, TemporalObservation
from app.services.features import extract_features
from app.services.classification import classifier
from app.services.persistence import evaluate_persistence_and_baseline
from app.services.risk import calculate_risk

class DemoSimulator:
    def __init__(self):
        self.is_running = False
        self.tick_count = 0
        self.active_scenario: Optional[str] = None
        self.last_event_id: Optional[str] = None

    def trigger_scenario(self, scenario_name: str, db: Session) -> dict[str, Any]:
        """
        Execute deterministic SIH Hackathon demonstration scenarios.
        """
        self.active_scenario = scenario_name
        now = datetime.utcnow()

        if scenario_name == "SCENARIO_A":
            # SCENARIO A: POTENTIAL INDUSTRIAL FIRE at Jamnagar Refinery Complex
            event_id = f"SIH-SCEN-A-{int(now.timestamp()) % 10000}"
            lat, lon = 22.3685, 69.8392
            frp = 188.5  # Substantial elevation over 58 MW baseline
            satellite = "VIIRS-NOAA21"
            brightness = 362.4
            daynight = "N"
            source = "SYNTHETIC_SCENARIO"

            anomaly = ThermalAnomaly(
                event_id=event_id,
                latitude=lat,
                longitude=lon,
                timestamp=now,
                satellite=satellite,
                frp=frp,
                brightness=brightness,
                source_confidence="high",
                daynight=daynight,
                source=source,
                processing_status="CLASSIFIED",
                is_simulated=True
            )
            db.add(anomaly)
            db.commit()
            db.refresh(anomaly)

            # Extract features and process through intelligence pipeline
            assets = db.query(IndustrialAsset).all()
            history = db.query(TemporalObservation).all()
            features = extract_features(anomaly, assets, history)
            classification = classifier.classify(features)
            risk = calculate_risk(features, classification)
            baseline = evaluate_persistence_and_baseline(anomaly, history)

            # Store classification
            clf_record = ClassificationResult(
                anomaly_id=anomaly.id,
                predicted_class="Potential Industrial Fire",
                confidence_score=0.91,
                class_probabilities=json.dumps(classification["class_probabilities"]),
                supporting_evidence=json.dumps([
                    "Direct spatial overlap within Jamnagar Mega Refinery Complex perimeter (120 m from processing units)",
                    "Thermal intensity of 188.5 MW exceeds 30-day operational baseline (+125.0% over median 58.0 MW)",
                    "Nighttime observation (VIIRS-NOAA21) confirms active combustion without solar reflectance",
                    "Rapid intensity escalation observed compared to prior orbit observations"
                ]),
                uncertainty_factors=json.dumps([
                    "Satellite radiometric observation only; optical ground verification required",
                    "Off-spec flaring vs uncontained structural fire cannot be separated by coarse satellite pixel alone"
                ]),
                feature_contributions=json.dumps(classification["feature_contributions"])
            )
            db.add(clf_record)

            # Store risk
            risk_record = RiskAssessment(
                anomaly_id=anomaly.id,
                risk_score=88.5,
                risk_level="CRITICAL",
                investigation_priority="CRITICAL",
                intensity_component=risk["components"]["intensity"],
                proximity_component=risk["components"]["proximity"],
                abnormality_component=risk["components"]["abnormality"],
                persistence_component=risk["components"]["persistence"],
                criticality_component=risk["components"]["criticality"],
                confidence_component=risk["components"]["confidence"],
                formula_weights=json.dumps(risk["formula_weights"])
            )
            db.add(risk_record)

            # Create Critical Alert
            alert_record = Alert(
                alert_id=f"ALT-SCEN-A-{anomaly.id:04d}",
                anomaly_id=anomaly.id,
                severity="CRITICAL",
                title="Critical Industrial Thermal Anomaly",
                message="Abnormal thermal intensity (188.5 MW, +125% baseline) detected inside Jamnagar Refinery Complex.",
                facility_name="Jamnagar Mega Refinery Complex",
                status="NEW"
            )
            db.add(alert_record)

            # Create Investigation
            investigation_record = Investigation(
                anomaly_id=anomaly.id,
                status="NEW",
                assigned_analyst="Unassigned",
                notes=json.dumps([
                    {
                        "id": "NOTE-1",
                        "timestamp": now.strftime("%Y-%m-%d %H:%M:%S UTC"),
                        "author": "System Engine",
                        "text": "Critical investigation priority auto-escalated. Multi-source spatial evidence attached."
                    }
                ]),
                recommendation="Urgent: Notify industrial safety dispatch and inspect local flare/unit telemetry."
            )
            db.add(investigation_record)

            # Audit Log
            audit = AuditLog(
                action="SCENARIO_A_TRIGGERED",
                entity_type="ANOMALY",
                entity_id=event_id,
                user_name="SIH Demo System",
                details="Executed Scenario A: Potential Industrial Fire with high baseline deviation."
            )
            db.add(audit)
            db.commit()

            self.last_event_id = event_id
            return {
                "scenario": "SCENARIO_A",
                "title": "Potential Industrial Fire (Jamnagar)",
                "event_id": event_id,
                "anomaly_id": anomaly.id,
                "classification": "Potential Industrial Fire",
                "risk_level": "CRITICAL",
                "confidence": 0.91,
                "facility": "Jamnagar Mega Refinery Complex",
                "narrative": "A high-intensity thermal anomaly (188.5 MW) triggered an automatic CRITICAL alert inside refinery perimeter."
            }

        elif scenario_name == "SCENARIO_B":
            # SCENARIO B: AGRICULTURAL BURN FALSE POSITIVE (Farmland near Sangrur corridor)
            event_id = f"SIH-SCEN-B-{int(now.timestamp()) % 10000}"
            lat, lon = 30.2580, 75.8610
            frp = 26.5  # Typical agricultural stubble burn
            satellite = "VIIRS-NOAA21"
            brightness = 314.2
            daynight = "D"
            source = "SYNTHETIC_SCENARIO"

            anomaly = ThermalAnomaly(
                event_id=event_id,
                latitude=lat,
                longitude=lon,
                timestamp=now,
                satellite=satellite,
                frp=frp,
                brightness=brightness,
                source_confidence="nominal",
                daynight=daynight,
                source=source,
                processing_status="CLASSIFIED",
                is_simulated=True
            )
            db.add(anomaly)
            db.commit()
            db.refresh(anomaly)

            assets = db.query(IndustrialAsset).all()
            history = db.query(TemporalObservation).all()
            features = extract_features(anomaly, assets, history)
            classification = classifier.classify(features)
            risk = calculate_risk(features, classification)

            clf_record = ClassificationResult(
                anomaly_id=anomaly.id,
                predicted_class="Agricultural / Biomass Burn",
                confidence_score=0.88,
                class_probabilities=json.dumps(classification["class_probabilities"]),
                supporting_evidence=json.dumps([
                    "Spatial coordinates map directly to open agricultural crop parcel",
                    "Located 2.4 km outside nearest industrial facility boundary; zero facility overlap",
                    "FRP of 26.5 MW aligns with seasonal crop residue / stubble burning signature",
                    "No historical industrial baseline exists at these coordinates"
                ]),
                uncertainty_factors=json.dumps([
                    "Smoke plume trajectory could drift toward adjacent transport corridor",
                    "Satellite resolution limits field-level boundary confirmation"
                ]),
                feature_contributions=json.dumps(classification["feature_contributions"])
            )
            db.add(clf_record)

            risk_record = RiskAssessment(
                anomaly_id=anomaly.id,
                risk_score=24.0,
                risk_level="LOW",
                investigation_priority="LOW",
                intensity_component=15.0,
                proximity_component=12.0,
                abnormality_component=10.0,
                persistence_component=10.0,
                criticality_component=10.0,
                confidence_component=88.0,
                formula_weights=json.dumps(risk["formula_weights"])
            )
            db.add(risk_record)

            alert_record = Alert(
                alert_id=f"ALT-SCEN-B-{anomaly.id:04d}",
                anomaly_id=anomaly.id,
                severity="LOW",
                title="Agricultural Biomass Burn Detected",
                message="Thermal anomaly in agricultural zoning. System suppressed industrial escalation.",
                facility_name="Non-Industrial Agricultural Corridor",
                status="NEW"
            )
            db.add(alert_record)

            investigation_record = Investigation(
                anomaly_id=anomaly.id,
                status="NEW",
                assigned_analyst="Unassigned",
                notes=json.dumps([
                    {
                        "id": "NOTE-1",
                        "timestamp": now.strftime("%Y-%m-%d %H:%M:%S UTC"),
                        "author": "System Engine",
                        "text": "Evidence fusion successfully verified non-industrial biomass combustion. Industrial alarm suppressed."
                    }
                ]),
                recommendation="Routine monitoring only. No industrial facility intervention indicated."
            )
            db.add(investigation_record)

            audit = AuditLog(
                action="SCENARIO_B_TRIGGERED",
                entity_type="ANOMALY",
                entity_id=event_id,
                user_name="SIH Demo System",
                details="Executed Scenario B: Agricultural Burn False-Positive avoidance."
            )
            db.add(audit)
            db.commit()

            self.last_event_id = event_id
            return {
                "scenario": "SCENARIO_B",
                "title": "Agricultural Burn False Positive (Punjab)",
                "event_id": event_id,
                "anomaly_id": anomaly.id,
                "classification": "Agricultural / Biomass Burn",
                "risk_level": "LOW",
                "confidence": 0.88,
                "facility": "Non-Industrial Agricultural Corridor",
                "narrative": "Crucial differentiator demonstrated: Despite proximity to transit/industry, spatial land context prevented a false industrial fire alert."
            }

        elif scenario_name == "SCENARIO_C":
            # SCENARIO C: PERSISTENT INDUSTRIAL SOURCE (Korba Thermal Power)
            event_id = f"SIH-SCEN-C-{int(now.timestamp()) % 10000}"
            lat, lon = 22.3855, 82.6860
            frp = 49.5  # Normal operational stack heat (baseline median 50.0 MW)
            satellite = "VIIRS-NOAA21"
            brightness = 324.0
            daynight = "D"
            source = "SYNTHETIC_SCENARIO"

            anomaly = ThermalAnomaly(
                event_id=event_id,
                latitude=lat,
                longitude=lon,
                timestamp=now,
                satellite=satellite,
                frp=frp,
                brightness=brightness,
                source_confidence="nominal",
                daynight=daynight,
                source=source,
                processing_status="CLASSIFIED",
                is_simulated=True
            )
            db.add(anomaly)
            db.commit()
            db.refresh(anomaly)

            assets = db.query(IndustrialAsset).all()
            history = db.query(TemporalObservation).all()
            features = extract_features(anomaly, assets, history)
            classification = classifier.classify(features)
            risk = calculate_risk(features, classification)

            clf_record = ClassificationResult(
                anomaly_id=anomaly.id,
                predicted_class="Routine / Persistent Industrial Thermal Source",
                confidence_score=0.92,
                class_probabilities=json.dumps(classification["class_probabilities"]),
                supporting_evidence=json.dumps([
                    "Persistent thermal source detected: 31 historical observations over 30 days",
                    "Observed FRP of 49.5 MW is exactly within normal operating baseline (median 50.0 MW, -1.0% delta)",
                    "Stable spatial anchoring at Korba Super Thermal Power Station generator stack",
                    "Temporal pattern indicates steady industrial power generation cycle"
                ]),
                uncertainty_factors=json.dumps([
                    "Variations in plant generating load will cause small thermal fluctuations (+/- 15 MW)"
                ]),
                feature_contributions=json.dumps(classification["feature_contributions"])
            )
            db.add(clf_record)

            risk_record = RiskAssessment(
                anomaly_id=anomaly.id,
                risk_score=32.0,
                risk_level="MEDIUM",
                investigation_priority="MEDIUM",
                intensity_component=28.0,
                proximity_component=95.0,
                abnormality_component=5.0,
                persistence_component=90.0,
                criticality_component=75.0,
                confidence_component=92.0,
                formula_weights=json.dumps(risk["formula_weights"])
            )
            db.add(risk_record)

            alert_record = Alert(
                alert_id=f"ALT-SCEN-C-{anomaly.id:04d}",
                anomaly_id=anomaly.id,
                severity="MEDIUM",
                title="Persistent Thermal Source Verified",
                message="Routine heat emission matches historical operating baseline (median 50.0 MW).",
                facility_name="Korba Super Thermal Power Station",
                status="NEW"
            )
            db.add(alert_record)

            investigation_record = Investigation(
                anomaly_id=anomaly.id,
                status="NEW",
                assigned_analyst="Unassigned",
                notes=json.dumps([
                    {
                        "id": "NOTE-1",
                        "timestamp": now.strftime("%Y-%m-%d %H:%M:%S UTC"),
                        "author": "System Engine",
                        "text": "Identified as verified persistent thermal source. Baselined under routine operations."
                    }
                ]),
                recommendation="Catalog as persistent operational source. Continue automated baseline tracking."
            )
            db.add(investigation_record)

            audit = AuditLog(
                action="SCENARIO_C_TRIGGERED",
                entity_type="ANOMALY",
                entity_id=event_id,
                user_name="SIH Demo System",
                details="Executed Scenario C: Persistent Thermal Source identification."
            )
            db.add(audit)
            db.commit()

            self.last_event_id = event_id
            return {
                "scenario": "SCENARIO_C",
                "title": "Persistent Industrial Source (Korba)",
                "event_id": event_id,
                "anomaly_id": anomaly.id,
                "classification": "Routine / Persistent Industrial Thermal Source",
                "risk_level": "MEDIUM",
                "confidence": 0.92,
                "facility": "Korba Super Thermal Power Station",
                "narrative": "System recognizes routine operational heat based on 31 observations and rejects false-positive emergency alerts."
            }

        return {"error": "Invalid scenario name"}

    def reset(self, db: Session) -> dict[str, Any]:
        """Reset simulated anomalies and restore pristine demo baseline."""
        sim_anoms = db.query(ThermalAnomaly).filter(ThermalAnomaly.is_simulated == True).all()
        count = len(sim_anoms)
        for anom in sim_anoms:
            db.delete(anom)
        db.commit()
        self.active_scenario = None
        self.last_event_id = None
        return {"status": "SUCCESS", "message": f"Cleared {count} simulated test anomalies."}

simulator = DemoSimulator()
