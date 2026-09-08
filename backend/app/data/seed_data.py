import json
from datetime import datetime, timedelta

# Curated Indian Industrial Assets (OSM-derived / Prototype Registry)
INITIAL_ASSETS = [
    {
        "asset_id": "ASSET-IND-JAM-001",
        "name": "Jamnagar Mega Refinery Complex",
        "category": "Refinery",
        "latitude": 22.3650,
        "longitude": 69.8350,
        "radius_meters": 3500.0,
        "criticality_level": "CRITICAL",
        "operational_status": "OPERATIONAL",
        "source": "OSM-derived",
        "source_confidence": "HIGH",
        "baseline_frp_min": 35.0,
        "baseline_frp_max": 85.0,
        "baseline_frp_median": 58.0,
        "baseline_count": 28,
        # GeoJSON Polygon approximating the perimeter
        "boundary_geojson": json.dumps({
            "type": "Polygon",
            "coordinates": [[
                [69.815, 22.345], [69.855, 22.345],
                [69.860, 22.385], [69.820, 22.385],
                [69.815, 22.345]
            ]]
        })
    },
    {
        "asset_id": "ASSET-IND-HAZ-002",
        "name": "Hazira Petrochemical & LNG Terminal",
        "category": "LNG / Gas",
        "latitude": 21.1080,
        "longitude": 72.6780,
        "radius_meters": 2800.0,
        "criticality_level": "CRITICAL",
        "operational_status": "OPERATIONAL",
        "source": "OSM-derived",
        "source_confidence": "HIGH",
        "baseline_frp_min": 25.0,
        "baseline_frp_max": 65.0,
        "baseline_frp_median": 42.0,
        "baseline_count": 19,
        "boundary_geojson": json.dumps({
            "type": "Polygon",
            "coordinates": [[
                [72.660, 21.095], [72.695, 21.095],
                [72.695, 21.120], [72.660, 21.120],
                [72.660, 21.095]
            ]]
        })
    },
    {
        "asset_id": "ASSET-IND-ANG-003",
        "name": "Angul Integrated Steel Plant",
        "category": "Steel / Metal",
        "latitude": 20.8400,
        "longitude": 85.1450,
        "radius_meters": 3000.0,
        "criticality_level": "HIGH",
        "operational_status": "OPERATIONAL",
        "source": "OSM-derived",
        "source_confidence": "HIGH",
        "baseline_frp_min": 40.0,
        "baseline_frp_max": 95.0,
        "baseline_frp_median": 64.0,
        "baseline_count": 22,
        "boundary_geojson": json.dumps({
            "type": "Polygon",
            "coordinates": [[
                [85.125, 20.825], [85.165, 20.825],
                [85.165, 20.855], [85.125, 20.855],
                [85.125, 20.825]
            ]]
        })
    },
    {
        "asset_id": "ASSET-IND-KOR-004",
        "name": "Korba Super Thermal Power Station",
        "category": "Power Plant",
        "latitude": 22.3850,
        "longitude": 82.6850,
        "radius_meters": 2200.0,
        "criticality_level": "HIGH",
        "operational_status": "OPERATIONAL",
        "source": "OSM-derived",
        "source_confidence": "HIGH",
        "baseline_frp_min": 30.0,
        "baseline_frp_max": 75.0,
        "baseline_frp_median": 50.0,
        "baseline_count": 31,
        "boundary_geojson": json.dumps({
            "type": "Polygon",
            "coordinates": [[
                [82.670, 22.370], [82.700, 22.370],
                [82.700, 22.400], [82.670, 22.400],
                [82.670, 22.370]
            ]]
        })
    },
    {
        "asset_id": "ASSET-IND-DHA-005",
        "name": "Jharia Opencast & Coalfield Zone",
        "category": "Mining Site",
        "latitude": 23.7500,
        "longitude": 86.4150,
        "radius_meters": 4500.0,
        "criticality_level": "HIGH",
        "operational_status": "OPERATIONAL",
        "source": "OSM-derived",
        "source_confidence": "MEDIUM",
        "baseline_frp_min": 15.0,
        "baseline_frp_max": 55.0,
        "baseline_frp_median": 32.0,
        "baseline_count": 45,
        "boundary_geojson": json.dumps({
            "type": "Polygon",
            "coordinates": [[
                [86.380, 23.720], [86.450, 23.720],
                [86.450, 23.780], [86.380, 23.780],
                [86.380, 23.720]
            ]]
        })
    },
    {
        "asset_id": "ASSET-IND-TRO-006",
        "name": "Trombay Refinery & Chemical Complex",
        "category": "Petrochemical",
        "latitude": 19.0150,
        "longitude": 72.9050,
        "radius_meters": 2000.0,
        "criticality_level": "CRITICAL",
        "operational_status": "OPERATIONAL",
        "source": "OSM-derived",
        "source_confidence": "HIGH",
        "baseline_frp_min": 20.0,
        "baseline_frp_max": 60.0,
        "baseline_frp_median": 38.0,
        "baseline_count": 14,
        "boundary_geojson": json.dumps({
            "type": "Polygon",
            "coordinates": [[
                [72.890, 19.000], [72.920, 19.000],
                [72.920, 19.030], [72.890, 19.030],
                [72.890, 19.000]
            ]]
        })
    },
    {
        "asset_id": "ASSET-IND-DIG-007",
        "name": "Digboi Historic Oil Processing Complex",
        "category": "Refinery",
        "latitude": 27.3850,
        "longitude": 95.6350,
        "radius_meters": 1800.0,
        "criticality_level": "MEDIUM",
        "operational_status": "OPERATIONAL",
        "source": "OSM-derived",
        "source_confidence": "HIGH",
        "baseline_frp_min": 15.0,
        "baseline_frp_max": 45.0,
        "baseline_frp_median": 28.0,
        "baseline_count": 10,
        "boundary_geojson": json.dumps({
            "type": "Polygon",
            "coordinates": [[
                [95.620, 27.375], [95.650, 27.375],
                [95.650, 27.395], [95.620, 27.395],
                [95.620, 27.375]
            ]]
        })
    },
    {
        "asset_id": "ASSET-IND-MUN-008",
        "name": "Mundra Ultra Mega Power & Industrial Hub",
        "category": "Power Plant",
        "latitude": 22.8250,
        "longitude": 69.5350,
        "radius_meters": 3200.0,
        "criticality_level": "HIGH",
        "operational_status": "OPERATIONAL",
        "source": "OSM-derived",
        "source_confidence": "HIGH",
        "baseline_frp_min": 25.0,
        "baseline_frp_max": 70.0,
        "baseline_frp_median": 46.0,
        "baseline_count": 18,
        "boundary_geojson": json.dumps({
            "type": "Polygon",
            "coordinates": [[
                [69.515, 22.810], [69.555, 22.810],
                [69.555, 22.840], [69.515, 22.840],
                [69.515, 22.810]
            ]]
        })
    }
]

# Pre-seeded Thermal Anomalies covering all categories & testing edge cases
def get_initial_anomalies():
    now = datetime.utcnow()
    return [
        {
            "event_id": "ANOM-IND-JAM-0101",
            "latitude": 22.3685,
            "longitude": 69.8392,
            "timestamp": now - timedelta(hours=1, minutes=15),
            "satellite": "VIIRS-NOAA21",
            "frp": 178.5,  # High FRP exceeding 85 MW baseline
            "brightness": 358.4,
            "source_confidence": "high",
            "daynight": "N",
            "source": "DEMO_DATASET",
            "processing_status": "PROCESSED",
            "is_simulated": False
        },
        {
            "event_id": "ANOM-IND-JAM-0102",
            "latitude": 22.3620,
            "longitude": 69.8310,
            "timestamp": now - timedelta(hours=3, minutes=40),
            "satellite": "VIIRS-NOAA20",
            "frp": 54.2,  # Normal routine flare baseline
            "brightness": 328.6,
            "source_confidence": "nominal",
            "daynight": "N",
            "source": "DEMO_DATASET",
            "processing_status": "PROCESSED",
            "is_simulated": False
        },
        {
            "event_id": "ANOM-IND-HAZ-0201",
            "latitude": 21.1110,
            "longitude": 72.6815,
            "timestamp": now - timedelta(hours=2, minutes=20),
            "satellite": "VIIRS-NOAA21",
            "frp": 46.8,  # Gas flare combustion within baseline
            "brightness": 322.0,
            "source_confidence": "nominal",
            "daynight": "N",
            "source": "DEMO_DATASET",
            "processing_status": "PROCESSED",
            "is_simulated": False
        },
        {
            "event_id": "ANOM-IND-ANG-0301",
            "latitude": 20.8425,
            "longitude": 85.1480,
            "timestamp": now - timedelta(hours=4, minutes=50),
            "satellite": "VIIRS-NOAA21",
            "frp": 82.0,  # Routine steel slag/furnace heat
            "brightness": 332.1,
            "source_confidence": "nominal",
            "daynight": "D",
            "source": "DEMO_DATASET",
            "processing_status": "PROCESSED",
            "is_simulated": False
        },
        {
            "event_id": "ANOM-IND-DHA-0401",
            "latitude": 23.7535,
            "longitude": 86.4180,
            "timestamp": now - timedelta(hours=5, minutes=10),
            "satellite": "VIIRS-NOAA20",
            "frp": 38.5,  # Subsurface coal seam fire recurrence
            "brightness": 318.4,
            "source_confidence": "nominal",
            "daynight": "N",
            "source": "DEMO_DATASET",
            "processing_status": "PROCESSED",
            "is_simulated": False
        },
        {
            "event_id": "ANOM-IND-KOR-0501",
            "latitude": 22.3870,
            "longitude": 82.6875,
            "timestamp": now - timedelta(hours=6, minutes=30),
            "satellite": "VIIRS-NOAA21",
            "frp": 51.0,  # Routine thermal generator stack heat
            "brightness": 324.8,
            "source_confidence": "nominal",
            "daynight": "D",
            "source": "DEMO_DATASET",
            "processing_status": "PROCESSED",
            "is_simulated": False
        },
        {
            "event_id": "ANOM-IND-PUN-0601",
            "latitude": 30.2520,
            "longitude": 75.8540,
            "timestamp": now - timedelta(hours=7, minutes=15),
            "satellite": "VIIRS-NOAA21",
            "frp": 24.3,  # Agricultural stubble burn (near industrial corridor, but in open crop land)
            "brightness": 312.5,
            "source_confidence": "nominal",
            "daynight": "D",
            "source": "DEMO_DATASET",
            "processing_status": "PROCESSED",
            "is_simulated": False
        },
        {
            "event_id": "ANOM-IND-PUN-0602",
            "latitude": 30.2640,
            "longitude": 75.8690,
            "timestamp": now - timedelta(hours=7, minutes=20),
            "satellite": "VIIRS-NOAA21",
            "frp": 29.8,  # Agricultural stubble burn adjacent cluster
            "brightness": 315.0,
            "source_confidence": "nominal",
            "daynight": "D",
            "source": "DEMO_DATASET",
            "processing_status": "PROCESSED",
            "is_simulated": False
        },
        {
            "event_id": "ANOM-IND-SIM-0701",
            "latitude": 21.8540,
            "longitude": 86.3560,
            "timestamp": now - timedelta(hours=8, minutes=45),
            "satellite": "VIIRS-NOAA20",
            "frp": 115.0,  # Forest / Wildfire in deep reserve
            "brightness": 344.2,
            "source_confidence": "high",
            "daynight": "D",
            "source": "DEMO_DATASET",
            "processing_status": "PROCESSED",
            "is_simulated": False
        },
        {
            "event_id": "ANOM-IND-TRO-0801",
            "latitude": 19.0175,
            "longitude": 72.9080,
            "timestamp": now - timedelta(hours=2, minutes=50),
            "satellite": "VIIRS-NOAA21",
            "frp": 94.0,  # Elevated FRP in high-density urban industrial complex
            "brightness": 339.7,
            "source_confidence": "high",
            "daynight": "N",
            "source": "DEMO_DATASET",
            "processing_status": "PROCESSED",
            "is_simulated": False
        }
    ]

# Historical observations for baseline calculations
def get_historical_observations():
    now = datetime.utcnow()
    records = []
    
    # Jamnagar historical (28 observations over past 30 days, typical 40-75 MW)
    jam_coords = (22.3650, 69.8350)
    for day in range(1, 29):
        records.append({
            "asset_id_str": "ASSET-IND-JAM-001",
            "latitude": jam_coords[0] + (day % 3) * 0.002,
            "longitude": jam_coords[1] + (day % 4) * 0.002,
            "timestamp": now - timedelta(days=day, hours=(day * 3) % 24),
            "frp": 45.0 + (day % 7) * 5.5,
            "daynight": "N" if day % 2 == 0 else "D",
            "satellite": "VIIRS-NOAA21" if day % 2 == 0 else "VIIRS-NOAA20"
        })

    # Korba thermal power historical (31 observations, typical 35-65 MW)
    kor_coords = (22.3850, 82.6850)
    for day in range(1, 32):
        records.append({
            "asset_id_str": "ASSET-IND-KOR-004",
            "latitude": kor_coords[0] + (day % 2) * 0.001,
            "longitude": kor_coords[1] + (day % 3) * 0.001,
            "timestamp": now - timedelta(days=day, hours=(day * 4) % 24),
            "frp": 42.0 + (day % 5) * 4.0,
            "daynight": "D" if day % 3 != 0 else "N",
            "satellite": "VIIRS-NOAA21"
        })

    # Dhanbad Jharia mining fires historical (45 persistent night observations, typical 20-50 MW)
    dha_coords = (23.7500, 86.4150)
    for day in range(1, 30):
        records.append({
            "asset_id_str": "ASSET-IND-DHA-005",
            "latitude": dha_coords[0] + (day % 4) * 0.003,
            "longitude": dha_coords[1] + (day % 5) * 0.003,
            "timestamp": now - timedelta(days=day, hours=23 - (day % 4)),
            "frp": 25.0 + (day % 6) * 4.5,
            "daynight": "N",
            "satellite": "VIIRS-NOAA20"
        })

    return records
