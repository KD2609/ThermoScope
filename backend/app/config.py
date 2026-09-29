"""Configuration settings for ThermoScope Backend.
Loads variables from environment or .env file with production-ready defaults.
"""

from pathlib import Path
import os
from typing import List
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

# Robust root-based .env resolution: backend/app/config.py -> backend/app -> backend -> ThermoScope
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
ROOT_ENV_FILE = PROJECT_ROOT / ".env"

# Explicitly load root .env into os.environ if present, regardless of CWD
if ROOT_ENV_FILE.exists():
    load_dotenv(dotenv_path=ROOT_ENV_FILE)


class Settings(BaseSettings):
    # App Information
    APP_NAME: str = "ThermoScope Geospatial Intelligence"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "False").lower() in ("true", "1")

    # NASA FIRMS API Credentials
    # Users can obtain a free MAP_KEY at https://firms.modaps.eosdis.nasa.gov/api/map_key/
    NASA_FIRMS_MAP_KEY: str = os.getenv("NASA_FIRMS_MAP_KEY", "")
    FIRMS_SOURCE: str = os.getenv("FIRMS_SOURCE", "VIIRS_SNPP_NRT")
    # Default to India bounding box (lon_min, lat_min, lon_max, lat_max)
    FIRMS_BBOX: str = os.getenv("FIRMS_BBOX", "68.0,6.0,97.5,37.5")
    FIRMS_DAYS: int = int(os.getenv("FIRMS_DAYS", "1"))
    POLL_INTERVAL_MINUTES: int = int(os.getenv("POLL_INTERVAL_MINUTES", "15"))

    # Database: Supabase PostgreSQL + PostGIS (Mandatory production database)
    # Configure via DATABASE_URL environment variable. SQLite fallback is strictly prohibited.
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")

    # Rolling Analytical Window & Spatial Baseline
    DEFAULT_ANALYTICAL_WINDOW_DAYS: int = int(os.getenv("DEFAULT_ANALYTICAL_WINDOW_DAYS", "30"))
    SPATIAL_ANALYTICAL_RADIUS_KM: float = float(os.getenv("SPATIAL_ANALYTICAL_RADIUS_KM", "5.0"))
    MIN_HISTORICAL_SAMPLES_REQUIRED: int = int(os.getenv("MIN_HISTORICAL_SAMPLES_REQUIRED", "2"))

    # Security & Auth
    JWT_SECRET: str = os.getenv("JWT_SECRET", "production-secret-thermoscope-sih-26162-key")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "production-secret-thermoscope-backend-key")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Frontend Production & CORS Configuration
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "https://frontend-psi-azure-17.vercel.app")
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:4173",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:4173",
        "https://frontend-psi-azure-17.vercel.app",
    ]

    @property
    def cors_origins(self) -> List[str]:
        """Returns clean allowed origins with whitespace and trailing slashes stripped to prevent origin mismatch."""
        origins = list(self.CORS_ORIGINS)
        if self.FRONTEND_URL:
            clean_url = self.FRONTEND_URL.strip().rstrip("/")
            if clean_url and clean_url not in origins:
                origins.append(clean_url)
        return origins

    # Proximity & Danger Zone Thresholds (in kilometers)
    DANGER_ZONE_CRITICAL_KM: float = 1.0
    DANGER_ZONE_HIGH_KM: float = 2.0
    DANGER_ZONE_MEDIUM_KM: float = 3.0
    DANGER_ZONE_LOW_KM: float = 5.0

    # Risk weights
    RISK_WEIGHT_INTENSITY: float = 0.30
    RISK_WEIGHT_INDUSTRIAL_PROXIMITY: float = 0.25
    RISK_WEIGHT_RESIDENTIAL_PROXIMITY: float = 0.25
    RISK_WEIGHT_PERSISTENCE: float = 0.10
    RISK_WEIGHT_CONFIDENCE: float = 0.10

    @property
    def normalized_database_url(self) -> str:
        url = (self.DATABASE_URL or "").strip()
        if not url:
            raise ValueError(
                "CRITICAL CONFIGURATION ERROR: 'DATABASE_URL' environment variable is missing or empty. "
                "ThermoScope production requires a Supabase PostgreSQL connection string with PostGIS enabled. "
                "Set DATABASE_URL in your environment or .env file. "
                "Example: DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres?sslmode=require"
            )
        if url.startswith("sqlite"):
            raise ValueError(
                "CRITICAL CONFIGURATION ERROR: SQLite fallback is strictly prohibited in ThermoScope. "
                "Production requires Supabase PostgreSQL with PostGIS. "
                "Please configure a valid PostgreSQL connection string in DATABASE_URL."
            )
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        if not url.startswith("postgresql://"):
            raise ValueError(
                f"CRITICAL CONFIGURATION ERROR: Invalid DATABASE_URL scheme '{url.split('://')[0]}'. "
                "ThermoScope requires a PostgreSQL connection string (postgresql://...)."
            )
        return url

    model_config = SettingsConfigDict(
        env_file=(str(ROOT_ENV_FILE), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
