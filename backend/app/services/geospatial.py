from typing import Optional, Tuple, Any
import json
import math
from shapely.geometry import shape, Point, Polygon, MultiPolygon
from shapely.ops import transform

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
    """
    Check whether a (lat, lon) coordinate lies inside a real GeoJSON Polygon boundary.
    Note: GeoJSON coordinates are in [longitude, latitude] order.
    """
    if not boundary_geojson_str:
        return False
    try:
        geom_dict = json.loads(boundary_geojson_str)
        polygon_geom = shape(geom_dict)
        point = Point(lon, lat)
        return bool(polygon_geom.contains(point))
    except Exception:
        return False

def distance_to_polygon_meters(lat: float, lon: float, boundary_geojson_str: Optional[str]) -> Optional[float]:
    """
    Calculate accurate distance in meters from a (lat, lon) point to a GeoJSON polygon boundary.
    Uses local metric projection centered at the observation point.
    Returns 0.0 if the point is inside the boundary.
    """
    if not boundary_geojson_str:
        return None
    try:
        geom_dict = json.loads(boundary_geojson_str)
        polygon_geom = shape(geom_dict)
        point = Point(lon, lat)
        if polygon_geom.contains(point):
            return 0.0

        # Planar projection to meters around the observation coordinate
        # 1 deg lat ~= 110,574 m; 1 deg lon ~= 111,320 m * cos(lat)
        cos_lat = math.cos(math.radians(lat))
        meters_per_deg_lon = 111320.0 * cos_lat
        meters_per_deg_lat = 110574.0

        def to_meters(x, y, z=None):
            return ((x - lon) * meters_per_deg_lon, (y - lat) * meters_per_deg_lat)

        projected_poly = transform(to_meters, polygon_geom)
        projected_point = Point(0.0, 0.0)
        dist_m = float(projected_poly.distance(projected_point))
        return max(0.0, dist_m)
    except Exception:
        return None

def count_assets_within_radius_meters(lat: float, lon: float, assets: list[Any], radius_m: float) -> int:
    """Calculate the density of industrial assets within a given search radius in meters."""
    count = 0
    for asset in assets:
        d = haversine_distance_meters(lat, lon, asset.latitude, asset.longitude)
        if d <= radius_m:
            count += 1
    return count

def is_in_mining_basin(lat: float, lon: float) -> bool:
    """
    Check if coordinates fall within known Indian mining basins.
    Note: Represents geographic bounding proxy for Jharia, Raniganj, Korba, Singrauli, Angul mining belts.
    """
    mining_basins = [
        # Jharia / Dhanbad Coalfields (Jharkhand)
        (23.65, 23.85, 86.20, 86.55),
        # Raniganj Coalfield (West Bengal / Jharkhand border)
        (23.55, 23.75, 86.85, 87.25),
        # Korba Coal Basin (Chhattisgarh)
        (22.25, 22.45, 82.55, 82.85),
        # Singrauli Coalfield (MP / UP border)
        (24.05, 24.25, 82.50, 82.80),
        # Angul / Talcher Coal & Mineral Corridor (Odisha)
        (20.80, 21.05, 85.00, 85.30),
    ]
    for min_lat, max_lat, min_lon, max_lon in mining_basins:
        if min_lat <= lat <= max_lat and min_lon <= lon <= max_lon:
            return True
    return False

def infer_land_context(lat: float, lon: float, nearest_asset_distance_m: float) -> str:
    """
    Infer local land context using a two-tier strategy:
    1. REAL GIS PRIORITY: Direct proximity to mapped industrial assets (< 800m).
    2. PROTOTYPE HEURISTIC FALLBACK: Regional coordinate bounds for distinct Indian terrain types.
    
    IMPORTANT: The coordinate bounds below are prototype heuristic proxies for demonstration
    and must not be claimed as true high-resolution satellite land-cover classifications.
    Returns:
      'Industrial / Commercial'
      'Agricultural Farmland'
      'Forest / Woodland'
      'Mining Basin / Opencast'
      'Dense Settlement / Urban'
      'Mixed Industrial Peripheral'
      'Open Land / Semi-Arid'
    """
    if nearest_asset_distance_m < 800.0:
        return "Industrial / Commercial"

    # Known mining basins
    if is_in_mining_basin(lat, lon):
        return "Mining Basin / Opencast"

    # Prototype Heuristic: Punjab / Haryana agricultural plains (Indo-Gangetic stubble belt)
    if 29.0 <= lat <= 32.0 and 74.0 <= lon <= 77.5:
        return "Agricultural Farmland"

    # Prototype Heuristic: Central/Eastern forest reserves (Similipal, Bastar, Sundarbans)
    if (21.5 <= lat <= 22.5 and 86.0 <= lon <= 87.0) or (18.5 <= lat <= 20.0 and 80.5 <= lon <= 82.0):
        return "Forest / Woodland"

    # Prototype Heuristic: Major urban metro belts (Mumbai Trombay, Delhi NCR)
    if (18.8 <= lat <= 19.3 and 72.7 <= lon <= 73.2) or (28.4 <= lat <= 28.9 and 76.9 <= lon <= 77.4):
        return "Dense Settlement / Urban"

    if nearest_asset_distance_m < 3500.0:
        return "Mixed Industrial Peripheral"

    return "Open Land / Semi-Arid"

def estimate_settlement_distance_meters(lat: float, lon: float) -> float:
    """
    Estimate proximity to mapped human settlements.
    PROTOTYPE HEURISTIC: Approximates settlement distance based on regional urbanization.
    High-density metros return < 800m; rural farming areas return ~1.5 - 2 km; remote sites return > 3 km.
    """
    # Mumbai urban corridor
    if 18.8 <= lat <= 19.3 and 72.7 <= lon <= 73.2:
        return 650.0
    # Delhi NCR belt
    if 28.4 <= lat <= 28.9 and 76.9 <= lon <= 77.4:
        return 750.0
    # Jharia / Dhanbad mining settlements
    if 23.6 <= lat <= 23.9 and 86.2 <= lon <= 86.6:
        return 1200.0
    # Punjab rural farming villages
    if 29.0 <= lat <= 32.0 and 74.0 <= lon <= 77.5:
        return 1800.0
    # General industrial peripheral estimate
    return 3200.0
