"""Configuration settings for ThermoScope Backend.
Loads variables from environment or .env file with production-ready defaults.
"""

import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


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

    # Database: Default SQLite for zero-config local runs, PostgreSQL+PostGIS for production
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./thermoscope.db")

    # Security & Auth
    JWT_SECRET: str = os.getenv("JWT_SECRET", "production-secret-thermoscope-sih-26162-key")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*"
    ]

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

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
