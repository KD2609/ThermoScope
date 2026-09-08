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
    
    # Default Risk Weights
    RISK_WEIGHTS = {
        "intensity": float(os.getenv("RISK_WEIGHT_INTENSITY", "0.25")),
        "proximity": float(os.getenv("RISK_WEIGHT_PROXIMITY", "0.25")),
        "abnormality": float(os.getenv("RISK_WEIGHT_ABNORMALITY", "0.20")),
        "persistence": float(os.getenv("RISK_WEIGHT_PERSISTENCE", "0.15")),
        "criticality": float(os.getenv("RISK_WEIGHT_CRITICALITY", "0.10")),
        "confidence": float(os.getenv("RISK_WEIGHT_CONFIDENCE", "0.05")),
    }

settings = Settings()
