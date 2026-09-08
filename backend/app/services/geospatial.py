import math
import json
from typing import Optional, Tuple, Any
from shapely.geometry import shape, Point

def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance between two points on the Earth in meters."""
    R = 6371000.0  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

def is_point_in_polygon(lat: float, lon: float, boundary_geojson_str: Optional[str]) -> bool:
    """Check whether a (lat, lon) coordinate lies inside a GeoJSON Polygon boundary."""
    if not boundary_geojson_str:
        return False
    try:
        geom_dict = json.loads(boundary_geojson_str)
        polygon_geom = shape(geom_dict)
        # GeoJSON is [longitude, latitude]
        point = Point(lon, lat)
        return bool(polygon_geom.contains(point))
    except Exception:
        return False

def distance_to_polygon_meters(lat: float, lon: float, boundary_geojson_str: Optional[str]) -> Optional[float]:
    """Calculate approximate distance in meters to a GeoJSON polygon boundary."""
    if not boundary_geojson_str:
        return None
    try:
        geom_dict = json.loads(boundary_geojson_str)
        polygon_geom = shape(geom_dict)
        point = Point(lon, lat)
        if polygon_geom.contains(point):
            return 0.0
        
        # Approximate degree-to-meter conversion at given latitude
        deg_dist = polygon_geom.distance(point)
        meters = deg_dist * 111320.0 * math.cos(math.radians(lat))
        return max(0.0, meters)
    except Exception:
        return None

def infer_land_context(lat: float, lon: float, nearest_asset_distance_m: float) -> str:
    """
    Infer local land context using proximity and spatial heuristics.
    Returns: 'Industrial / Commercial', 'Agricultural Farmland', 'Forest / Woodland', 'Dense Settlement / Urban'
    """
    if nearest_asset_distance_m < 800.0:
        return "Industrial / Commercial"
    
    # Specific regional land context signatures based on coordinate bounds
    # Punjab / Haryana agricultural plains
    if 29.0 <= lat <= 32.0 and 74.0 <= lon <= 77.5:
        return "Agricultural Farmland"
    
    # Central/Eastern forest reserves (Similipal, Bastar, Sundarbans)
    if (21.5 <= lat <= 22.5 and 86.0 <= lon <= 87.0) or (18.5 <= lat <= 20.0 and 80.5 <= lon <= 82.0):
        return "Forest / Woodland"
    
    # Major urban metro belts (Mumbai, Delhi)
    if (18.8 <= lat <= 19.3 and 72.7 <= lon <= 73.2) or (28.4 <= lat <= 28.9 and 76.9 <= lon <= 77.4):
        return "Dense Settlement / Urban"
    
    if nearest_asset_distance_m < 3500.0:
        return "Mixed Industrial Peripheral"
        
    return "Open Land / Semi-Arid"

def estimate_settlement_distance_meters(lat: float, lon: float) -> float:
    """
    Estimate proximity to mapped human settlements.
    High-density metros (Mumbai Trombay) return low distance (< 800m).
    Remote industrial corridors (Jamnagar, Angul) return ~2.5 - 5 km.
    """
    # Mumbai urban corridor
    if 18.8 <= lat <= 19.3 and 72.7 <= lon <= 73.2:
        return 650.0
    # Jharia / Dhanbad mining settlements
    if 23.6 <= lat <= 23.9 and 86.2 <= lon <= 86.6:
        return 1200.0
    # Punjab rural villages
    if 29.0 <= lat <= 32.0 and 74.0 <= lon <= 77.5:
        return 1800.0
    # General industrial peripheral estimate
    return 3200.0
