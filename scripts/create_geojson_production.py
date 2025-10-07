#!/usr/bin/env python3
"""
Create GeoJSON files for constituencies and wards from production database.
This script fetches data from the database and creates lightweight GeoJSON files
with approximate centroids based on county locations.
"""

import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

# Production database connection
DB_CONFIG = {
    'host': '35.227.164.209',
    'database': 'kenpolimarket',
    'user': 'kenpolimarket',
    'password': 'bC41dQ7drjIr5Fa7iWfxNoPjHLmyEUzV',
    'port': 5432,
    'sslmode': 'require',
    'connect_timeout': 30
}

# Output directory
OUTPUT_DIR = 'frontend/public/geojson'

# Kenya county coordinates (from InteractiveMap.tsx)
KENYA_COUNTIES_COORDS = {
    'Mombasa': [-4.0435, 39.6682],
    'Kwale': [-4.1742, 39.4520],
    'Kilifi': [-3.6309, 39.8493],
    'Tana River': [-1.5236, 39.9872],
    'Lamu': [-2.2717, 40.9020],
    'Taita Taveta': [-3.3167, 38.4833],
    'Garissa': [-0.4536, 39.6401],
    'Wajir': [1.7471, 40.0629],
    'Mandera': [3.9366, 41.8550],
    'Marsabit': [2.3284, 37.9899],
    'Isiolo': [0.3556, 37.5833],
    'Meru': [0.3556, 37.6500],
    'Tharaka Nithi': [-0.3667, 37.7333],
    'Embu': [-0.5310, 37.4575],
    'Kitui': [-1.3667, 38.0167],
    'Machakos': [-1.5177, 37.2634],
    'Makueni': [-2.2667, 37.8333],
    'Nyandarua': [-0.1833, 36.4833],
    'Nyeri': [-0.4167, 36.9500],
    'Kirinyaga': [-0.6589, 37.3833],
    "Murang'a": [-0.7833, 37.1500],
    'Kiambu': [-1.1714, 36.8356],
    'Turkana': [3.1167, 35.6167],
    'West Pokot': [1.6167, 35.3833],
    'Samburu': [1.2153, 36.9453],
    'Trans Nzoia': [1.0500, 34.9500],
    'Uasin Gishu': [0.5500, 35.3000],
    'Elgeyo Marakwet': [0.8667, 35.4667],
    'Nandi': [0.1833, 35.1167],
    'Baringo': [0.4667, 36.0833],
    'Laikipia': [0.3667, 36.7833],
    'Nakuru': [-0.3031, 36.0800],
    'Narok': [-1.0833, 35.8667],
    'Kajiado': [-2.0978, 36.7820],
    'Kericho': [-0.3667, 35.2833],
    'Bomet': [-0.7833, 35.3167],
    'Kakamega': [0.2827, 34.7519],
    'Vihiga': [0.0667, 34.7167],
    'Bungoma': [0.5635, 34.5606],
    'Busia': [0.4346, 34.1115],
    'Siaya': [0.0667, 34.2833],
    'Kisumu': [-0.0917, 34.7680],
    'Homa Bay': [-0.5167, 34.4500],
    'Migori': [-1.0634, 34.4731],
    'Kisii': [-0.6817, 34.7680],
    'Nyamira': [-0.5667, 34.9333],
    'Nairobi': [-1.2864, 36.8172]
}


def create_constituencies_geojson(cursor, output_path: str):
    """Create GeoJSON file for constituencies with approximate centroids."""
    print("📍 Creating constituencies GeoJSON...")

    # Fetch all constituencies with their counties
    cursor.execute("""
        SELECT 
            c.id, c.code, c.name, c.county_id,
            co.name as county_name
        FROM constituencies c
        JOIN counties co ON c.county_id = co.id
        ORDER BY c.id
    """)
    
    constituencies = cursor.fetchall()
    
    # Group by county
    constituencies_per_county = {}
    for const in constituencies:
        county_name = const['county_name']
        if county_name not in constituencies_per_county:
            constituencies_per_county[county_name] = []
        constituencies_per_county[county_name].append(const)
    
    features = []
    
    # Create features with distributed centroids
    for county_name, county_constituencies in constituencies_per_county.items():
        if county_name not in KENYA_COUNTIES_COORDS:
            print(f"⚠️  Warning: No coordinates for county '{county_name}'")
            continue

        county_lat, county_lng = KENYA_COUNTIES_COORDS[county_name]
        num_const = len(county_constituencies)

        # Distribute constituencies in a grid around county center
        import math
        grid_size = math.ceil(math.sqrt(num_const))
        offset = 0.15  # degrees offset for distribution

        for idx, const in enumerate(county_constituencies):
            # Calculate position in grid
            row = idx // grid_size
            col = idx % grid_size

            # Offset from county center
            lat_offset = (row - grid_size / 2) * offset
            lng_offset = (col - grid_size / 2) * offset

            feature = {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [county_lng + lng_offset, county_lat + lat_offset]
                },
                "properties": {
                    "id": const['id'],
                    "code": const['code'],
                    "name": const['name'],
                    "county_id": const['county_id'],
                    "county_name": county_name
                }
            }
            features.append(feature)

    geojson = {
        "type": "FeatureCollection",
        "features": features
    }

    # Ensure output directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    with open(output_path, 'w') as f:
        json.dump(geojson, f, indent=2)

    print(f"✅ Created {output_path} with {len(features)} constituencies")


def create_wards_geojson(cursor, output_path: str, const_geojson_path: str):
    """Create GeoJSON file for wards with approximate centroids."""
    print("📍 Creating wards GeoJSON...")

    # Fetch all wards with their constituencies
    cursor.execute("""
        SELECT 
            w.id, w.code, w.name, w.constituency_id,
            c.name as constituency_name
        FROM wards w
        JOIN constituencies c ON w.constituency_id = c.id
        ORDER BY w.id
    """)
    
    wards = cursor.fetchall()
    
    # Load constituency coordinates from the constituencies GeoJSON
    constituency_coords = {}
    if os.path.exists(const_geojson_path):
        with open(const_geojson_path, 'r') as f:
            const_data = json.load(f)
            for feature in const_data['features']:
                const_id = feature['properties']['id']
                coords = feature['geometry']['coordinates']
                constituency_coords[const_id] = coords
    
    # Group by constituency
    wards_per_constituency = {}
    for ward in wards:
        const_id = ward['constituency_id']
        if const_id not in wards_per_constituency:
            wards_per_constituency[const_id] = []
        wards_per_constituency[const_id].append(ward)
    
    features = []
    
    # Create features with distributed centroids
    for const_id, const_wards in wards_per_constituency.items():
        if const_id not in constituency_coords:
            print(f"⚠️  Warning: No coordinates for constituency ID {const_id}")
            continue

        const_lng, const_lat = constituency_coords[const_id]
        num_wards = len(const_wards)

        # Distribute wards in a grid around constituency center
        import math
        grid_size = math.ceil(math.sqrt(num_wards))
        offset = 0.05  # smaller offset for wards

        for idx, ward in enumerate(const_wards):
            # Calculate position in grid
            row = idx // grid_size
            col = idx % grid_size

            # Offset from constituency center
            lat_offset = (row - grid_size / 2) * offset
            lng_offset = (col - grid_size / 2) * offset

            feature = {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [const_lng + lng_offset, const_lat + lat_offset]
                },
                "properties": {
                    "id": ward['id'],
                    "code": ward['code'],
                    "name": ward['name'],
                    "constituency_id": const_id,
                    "constituency_name": ward['constituency_name']
                }
            }
            features.append(feature)

    geojson = {
        "type": "FeatureCollection",
        "features": features
    }

    # Ensure output directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    with open(output_path, 'w') as f:
        json.dump(geojson, f, indent=2)

    print(f"✅ Created {output_path} with {len(features)} wards")


def main():
    print("=" * 70)
    print("📊 CREATING GEOJSON FILES FROM PRODUCTION DATABASE")
    print("=" * 70)
    print()
    
    # Connect to database
    try:
        print(f"🔌 Connecting to production database...")
        conn = psycopg2.connect(**DB_CONFIG, cursor_factory=RealDictCursor)
        cursor = conn.cursor()
        print(f"✅ Connected!")
    except Exception as e:
        print(f"❌ Failed to connect: {e}")
        return 1
    
    # Create output directory
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Create GeoJSON files
    const_path = os.path.join(OUTPUT_DIR, 'constituencies.geojson')
    wards_path = os.path.join(OUTPUT_DIR, 'wards.geojson')
    
    create_constituencies_geojson(cursor, const_path)
    create_wards_geojson(cursor, wards_path, const_path)
    
    cursor.close()
    conn.close()
    
    print()
    print("=" * 70)
    print("✅ GEOJSON GENERATION COMPLETE")
    print("=" * 70)
    print(f"Output directory: {OUTPUT_DIR}")
    print(f"  - constituencies.geojson")
    print(f"  - wards.geojson")
    print("=" * 70)
    
    return 0


if __name__ == '__main__':
    exit(main())

