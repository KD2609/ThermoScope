"""OSM and GIS facility seeding service.
"""

import json
import os
from sqlalchemy.orm import Session
from geoalchemy2.elements import WKTElement
from backend.app.models.models import IndustrialSite, ResidentialArea


def seed_osm_facilities_if_empty(db: Session):
    """Seed industrial sites and residential areas from curated real datasets if empty."""
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    data_dir = os.path.join(base_dir, "data")
    ind_file = os.path.join(data_dir, "industrial_sites_seed.json")
    res_file = os.path.join(data_dir, "residential_areas_seed.json")

    if db.query(IndustrialSite).count() == 0 and os.path.exists(ind_file):
        with open(ind_file, "r") as f:
            items = json.load(f)
            for it in items:
                lat = float(it["latitude"])
                lon = float(it["longitude"])
                site = IndustrialSite(
                    id=it["id"],
                    name=it["name"],
                    type=it["type"],
                    latitude=lat,
                    longitude=lon,
                    geom=WKTElement(f"POINT({lon} {lat})", srid=4326),
                    source=it.get("source", "OpenStreetMap/Overpass"),
                    risk_category=it.get("risk_category", "HIGH"),
                    description=it.get("description")
                )
                db.add(site)
            db.commit()
            print(f"[OSM Service] Seeded {len(items)} industrial facilities with PostGIS coordinates.")

    if db.query(ResidentialArea).count() == 0 and os.path.exists(res_file):
        with open(res_file, "r") as f:
            items = json.load(f)
            for it in items:
                lat = float(it["latitude"])
                lon = float(it["longitude"])
                area = ResidentialArea(
                    id=it["id"],
                    name=it["name"],
                    latitude=lat,
                    longitude=lon,
                    geom=WKTElement(f"POINT({lon} {lat})", srid=4326),
                    building_count=it.get("building_count", 500),
                    population_estimate=it.get("population_estimate", 2500),
                    source=it.get("source", "OpenStreetMap/Census"),
                    danger_radius_km=it.get("danger_radius_km", 3.0)
                )
                db.add(area)
            db.commit()
            print(f"[OSM Service] Seeded {len(items)} residential settlements with PostGIS coordinates.")

