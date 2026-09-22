"""OpenStreetMap Industrial and Residential Data Ingestion and Seeding Service.
Imports curated GIS seed data and provides dynamic Overpass API querying capability with local caching.
"""

import json
import os
import sys
from typing import List, Dict, Any
import requests

current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from backend.app.database import SessionLocal, engine, Base
from backend.app.models.models import IndustrialSite, ResidentialArea


def seed_osm_facilities_if_empty():
    """Seed industrial sites and residential areas from curated real datasets if empty."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        data_dir = os.path.join(parent_dir, "data")
        ind_file = os.path.join(data_dir, "industrial_sites_seed.json")
        res_file = os.path.join(data_dir, "residential_areas_seed.json")

        if db.query(IndustrialSite).count() == 0 and os.path.exists(ind_file):
            with open(ind_file, "r") as f:
                items = json.load(f)
                for it in items:
                    site = IndustrialSite(
                        id=it["id"],
                        name=it["name"],
                        type=it["type"],
                        latitude=it["latitude"],
                        longitude=it["longitude"],
                        source=it.get("source", "OpenStreetMap/Overpass"),
                        risk_category=it.get("risk_category", "HIGH"),
                        description=it.get("description")
                    )
                    db.add(site)
                db.commit()
                print(f"[OSM Ingestion] Seeded {len(items)} industrial facilities.")

        if db.query(ResidentialArea).count() == 0 and os.path.exists(res_file):
            with open(res_file, "r") as f:
                items = json.load(f)
                for it in items:
                    area = ResidentialArea(
                        id=it["id"],
                        name=it["name"],
                        latitude=it["latitude"],
                        longitude=it["longitude"],
                        building_count=it.get("building_count", 500),
                        population_estimate=it.get("population_estimate", 2500),
                        source=it.get("source", "OpenStreetMap/Census"),
                        danger_radius_km=it.get("danger_radius_km", 3.0)
                    )
                    db.add(area)
                db.commit()
                print(f"[OSM Ingestion] Seeded {len(items)} residential settlements.")

    finally:
        db.close()


def query_overpass_industrial(lat: float, lon: float, radius_m: int = 15000) -> List[Dict[str, Any]]:
    """Live query to OpenStreetMap Overpass API for industrial tags around a point."""
    overpass_url = "https://overpass-api.de/api/interpreter"
    query = f"""
    [out:json][timeout:15];
    (
      node["landuse"="industrial"](around:{radius_m},{lat},{lon});
      way["landuse"="industrial"](around:{radius_m},{lat},{lon});
      node["industrial"](around:{radius_m},{lat},{lon});
      way["industrial"](around:{radius_m},{lat},{lon});
      node["power"="plant"](around:{radius_m},{lat},{lon});
      way["power"="plant"](around:{radius_m},{lat},{lon});
    );
    out center 20;
    """
    try:
        resp = requests.post(overpass_url, data={"data": query}, timeout=15)
        if resp.status_code == 200:
            data = resp.json()
            results = []
            for el in data.get("elements", []):
                tags = el.get("tags", {})
                name = tags.get("name") or tags.get("operator") or f"Industrial Unit {el['id']}"
                type_val = tags.get("industrial") or tags.get("power") or "industrial_complex"
                pt = el if "lat" in el else el.get("center", {})
                if "lat" in pt and "lon" in pt:
                    results.append({
                        "name": name,
                        "type": type_val,
                        "latitude": pt["lat"],
                        "longitude": pt["lon"],
                        "source": "OpenStreetMap/LiveOverpass"
                    })
            return results
    except Exception as e:
        print(f"[OSM Overpass] Query failed or timed out: {e}")
    return []


if __name__ == "__main__":
    seed_osm_facilities_if_empty()
