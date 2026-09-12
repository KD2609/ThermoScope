import os
from pathlib import Path

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent

class Settings:
    SYSTEM_MODE: str = os.getenv("SYSTEM_MODE", "DEMO").upper()
    NASA_FIRMS_MAP_KEY: str = os.getenv("NASA_FIRMS_MAP_KEY", "").strip()
    NASA_FIRMS_BASE_URL: str = os.getenv("NASA_FIRMS_BASE_URL", "https://firms.modaps.eosdis.nasa.gov/api/country/csv")
    NASA_FIRMS_COUNTRY_CODE: str = os.getenv("NASA_FIRMS_COUNTRY_CODE", "IND")
    NASA_FIRMS_SENSOR: str = os.getenv("NASA_FIRMS_SENSOR", "VIIRS_NOAA21_NRT")
    
    OSM_OVERPASS_URL: str = os.getenv("OSM_OVERPASS_URL", "https://overpass-api.de/api/interpreter")
    OSM_CACHE_TTL_HOURS: int = int(os.getenv("OSM_CACHE_TTL_HOURS", "72"))
    
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR}/thermoscope.db")
    
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    CORS_ORIGINS: list[str] = [
        origin.strip() for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173").split(",")
    ]
    
    AUTO_PERSISTENCE_MIN_OBSERVATIONS: int = int(os.getenv("AUTO_PERSISTENCE_MIN_OBSERVATIONS", "3"))
    
    # Default Risk Weights (Fallback)
    RISK_WEIGHTS = {
        "intensity": float(os.getenv("RISK_WEIGHT_INTENSITY", "0.25")),
        "proximity": float(os.getenv("RISK_WEIGHT_PROXIMITY", "0.25")),
        "abnormality": float(os.getenv("RISK_WEIGHT_ABNORMALITY", "0.20")),
        "persistence": float(os.getenv("RISK_WEIGHT_PERSISTENCE", "0.15")),
        "criticality": float(os.getenv("RISK_WEIGHT_CRITICALITY", "0.10")),
        "confidence": float(os.getenv("RISK_WEIGHT_CONFIDENCE", "0.05")),
    }

    # Model Artifact Paths
    MODEL_STORE_PATH: Path = BASE_DIR / "app" / "data" / "trained_model.joblib"
    MODEL_METRICS_PATH: Path = BASE_DIR / "app" / "data" / "model_metrics.json"

    # Complete 6-Component Class-Aware Base Risk Weights (each vector sums to exactly 1.0)
    # Note: These are initial expert-configured baseline weights, not scientifically learned weights.
    CLASS_AWARE_RISK_WEIGHTS: dict[str, dict[str, float]] = {
        "Potential Industrial Fire": {
            "intensity": 0.30,
            "proximity": 0.25,
            "abnormality": 0.25,
            "criticality": 0.10,
            "persistence": 0.05,
            "confidence": 0.05,
        },
        "Routine / Persistent Industrial Thermal Source": {
            "persistence": 0.35,
            "abnormality": 0.30,
            "intensity": 0.15,
            "proximity": 0.10,
            "criticality": 0.05,
            "confidence": 0.05,
        },
        "Gas Flare / Combustion Source": {
            "abnormality": 0.30,
            "proximity": 0.25,
            "intensity": 0.20,
            "persistence": 0.15,
            "criticality": 0.05,
            "confidence": 0.05,
        },
        "Agricultural / Biomass Burn": {
            "intensity": 0.30,
            "confidence": 0.25,
            "persistence": 0.20,
            "proximity": 0.10,
            "abnormality": 0.10,
            "criticality": 0.05,
        },
        "Vegetation / Wildfire": {
            "intensity": 0.35,
            "persistence": 0.30,
            "confidence": 0.15,
            "abnormality": 0.10,
            "proximity": 0.10,
            "criticality": 0.00,  # Zero industrial asset bias for wildfires
        },
        "Mining-Related Thermal Activity": {
            "persistence": 0.30,
            "abnormality": 0.25,
            "intensity": 0.20,
            "proximity": 0.15,
            "criticality": 0.05,
            "confidence": 0.05,
        },
        "Unknown Thermal Anomaly": {
            "intensity": 0.25,
            "proximity": 0.20,
            "abnormality": 0.20,
            "persistence": 0.15,
            "criticality": 0.10,
            "confidence": 0.10,
        },
    }

    # Explicit, Documented Second-Stage Contextual Risk Multipliers
    # These reflect operational consequence adjustment (e.g. non-industrial suppression, routine stability suppression)
    RISK_CONTEXT_ADJUSTMENTS: dict[str, float] = {
        "Agricultural / Biomass Burn": float(os.getenv("RISK_ADJ_AGRI", "0.45")),
        "Routine / Persistent Industrial Thermal Source": float(os.getenv("RISK_ADJ_ROUTINE", "0.60")),
        "Gas Flare / Combustion Source": float(os.getenv("RISK_ADJ_FLARE_NORMAL", "0.55")),
        "Vegetation / Wildfire": float(os.getenv("RISK_ADJ_WILDFIRE", "1.00")),
        "Potential Industrial Fire": float(os.getenv("RISK_ADJ_IND_FIRE", "1.00")),
        "Mining-Related Thermal Activity": float(os.getenv("RISK_ADJ_MINING", "0.90")),
        "Unknown Thermal Anomaly": float(os.getenv("RISK_ADJ_UNKNOWN", "0.75")),
    }

    # Context-Aware Alert Consolidation Defaults
    ALERT_DEDUP_RADIUS_METERS: float = float(os.getenv("ALERT_DEDUP_RADIUS_METERS", "3000.0"))
    ALERT_DEDUP_WINDOW_HOURS: float = float(os.getenv("ALERT_DEDUP_WINDOW_HOURS", "6.0"))

# Validate that all 6-component risk weight vectors sum to exactly 1.0 at import time
for _cls, _weights in Settings.CLASS_AWARE_RISK_WEIGHTS.items():
    _total = sum(_weights.values())
    assert abs(_total - 1.0) < 1e-6, f"CLASS_AWARE_RISK_WEIGHTS for '{_cls}' must sum to 1.0, got {_total}"

settings = Settings()
