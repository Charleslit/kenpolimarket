#!/usr/bin/env python3
"""
Create GeoJSON files for constituencies and wards from database data.
This script fetches data from the database and creates lightweight GeoJSON files
with approximate centroids based on county locations.
"""

import json
import sys
import os
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'backend'))

try:
    from database import SessionLocal
    from models import County, Constituency, Ward
    from sqlalchemy.orm import defer
except ImportError:
    print("❌ Error: Could not import database modules")
    print("   Make sure you're running this from the project root")
    sys.exit(1)

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


def create_constituencies_geojson(output_path: str):
    """Create GeoJSON file for constituencies with approximate centroids."""
    print("📍 Creating constituencies GeoJSON...")
    
    db = SessionLocal()
    try:
        # Fetch all constituencies with their counties
        # Defer optional columns that might not exist in the database
        constituencies = db.query(Constituency).options(
            defer(Constituency.registered_voters),
            defer(Constituency.geometry)
        ).all()
        
        features = []
        constituencies_per_county = {}
        
        # Count constituencies per county for spacing
        for const in constituencies:
            county = db.query(County).filter(County.id == const.county_id).first()
            if county:
                county_name = county.name
                if county_name not in constituencies_per_county:
                    constituencies_per_county[county_name] = []
                constituencies_per_county[county_name].append(const)
        
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
                lat_offset = (row - grid_size/2) * (offset / grid_size)
                lng_offset = (col - grid_size/2) * (offset / grid_size)
                
                properties = {
                    "id": const.id,
                    "code": const.code,
                    "name": const.name,
                    "county_id": const.county_id,
                    "county_name": county_name
                }

                # Add optional fields if they exist
                if hasattr(const, 'registered_voters'):
                    properties["registered_voters"] = const.registered_voters

                feature = {
                    "type": "Feature",
                    "properties": properties,
                    "geometry": {
                        "type": "Point",
                        "coordinates": [
                            county_lng + lng_offset,
                            county_lat + lat_offset
                        ]
                    }
                }
                features.append(feature)
        
        geojson = {
            "type": "FeatureCollection",
            "features": features
        }
        
        # Write to file
        with open(output_path, 'w') as f:
            json.dump(geojson, f, indent=2)
        
        print(f"✅ Created {len(features)} constituency features")
        print(f"   Saved to: {output_path}")
        
    finally:
        db.close()


def create_wards_geojson(output_path: str):
    """Create GeoJSON file for wards with approximate centroids."""
    print("📍 Creating wards GeoJSON...")
    
    db = SessionLocal()
    try:
        # Fetch all wards with their constituencies
        # Defer optional columns that might not exist in the database
        wards = db.query(Ward).options(
            defer(Ward.population_2019),
            defer(Ward.geometry)
        ).all()
        
        features = []
        wards_per_constituency = {}
        constituency_coords = {}
        
        # First, get constituency coordinates from the constituencies GeoJSON we just created
        const_geojson_path = output_path.replace('wards', 'constituencies')
        if os.path.exists(const_geojson_path):
            with open(const_geojson_path, 'r') as f:
                const_data = json.load(f)
                for feature in const_data['features']:
                    const_id = feature['properties']['id']
                    coords = feature['geometry']['coordinates']
                    constituency_coords[const_id] = coords
        
        # Count wards per constituency
        for ward in wards:
            const_id = ward.constituency_id
            if const_id not in wards_per_constituency:
                wards_per_constituency[const_id] = []
            wards_per_constituency[const_id].append(ward)
        
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
                lat_offset = (row - grid_size/2) * (offset / grid_size)
                lng_offset = (col - grid_size/2) * (offset / grid_size)
                
                properties = {
                    "id": ward.id,
                    "code": ward.code,
                    "name": ward.name,
                    "constituency_id": ward.constituency_id
                }

                # Add optional fields if they exist
                if hasattr(ward, 'population_2019'):
                    properties["population_2019"] = ward.population_2019

                feature = {
                    "type": "Feature",
                    "properties": properties,
                    "geometry": {
                        "type": "Point",
                        "coordinates": [
                            const_lng + lng_offset,
                            const_lat + lat_offset
                        ]
                    }
                }
                features.append(feature)
        
        geojson = {
            "type": "FeatureCollection",
            "features": features
        }
        
        # Write to file
        with open(output_path, 'w') as f:
            json.dump(geojson, f, indent=2)
        
        print(f"✅ Created {len(features)} ward features")
        print(f"   Saved to: {output_path}")
        
    finally:
        db.close()


def main():
    print("🗺️  GeoJSON Creator from Database")
    print("===================================")
    print("")
    print("This script creates GeoJSON files for constituencies and wards")
    print("using data from your database with approximate centroids.")
    print("")
    
    # Determine output directory
    frontend_public = Path(__file__).parent.parent / 'frontend' / 'public'
    
    if not frontend_public.exists():
        print(f"❌ Error: Frontend public directory not found: {frontend_public}")
        sys.exit(1)
    
    constituencies_path = frontend_public / 'kenya-constituencies.geojson'
    wards_path = frontend_public / 'kenya-wards.geojson'
    
    try:
        # Create constituencies GeoJSON
        create_constituencies_geojson(str(constituencies_path))
        print("")
        
        # Create wards GeoJSON
        create_wards_geojson(str(wards_path))
        print("")
        
        # Show file sizes
        print("📊 File Information:")
        print("====================")
        const_size = constituencies_path.stat().st_size / 1024
        wards_size = wards_path.stat().st_size / 1024
        print(f"kenya-constituencies.geojson: {const_size:.1f} KB")
        print(f"kenya-wards.geojson: {wards_size:.1f} KB")
        print("")
        
        print("✅ Done!")
        print("")
        print("📝 Next steps:")
        print("1. Restart your Next.js dev server")
        print("2. Navigate to /explorer")
        print("3. The map will now show constituencies and wards at approximate locations")
        print("")
        print("💡 Note: These are approximate centroids based on county locations.")
        print("   For exact boundaries, obtain official shapefiles from IEBC.")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()

