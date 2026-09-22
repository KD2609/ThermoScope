"""Database connection and session management.
Supports PostgreSQL with PostGIS in production, with seamless SQLite fallback for local development.
"""

import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.app.config import settings

DATABASE_URL = settings.DATABASE_URL

# Handle Heroku / Render postgres:// vs postgresql:// prefix
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

is_sqlite = DATABASE_URL.startswith("sqlite")

connect_args = {}
if is_sqlite:
    connect_args = {"check_same_thread": False}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI dependency for obtaining a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_db_health() -> dict:
    """Verify database connection health."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {
            "status": "HEALTHY",
            "dialect": engine.dialect.name,
            "is_sqlite": is_sqlite,
            "connected": True
        }
    except Exception as e:
        return {
            "status": "DEGRADED",
            "dialect": engine.dialect.name,
            "is_sqlite": is_sqlite,
            "connected": False,
            "error": str(e)
        }
