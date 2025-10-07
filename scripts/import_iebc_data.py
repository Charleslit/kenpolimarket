#!/usr/bin/env python3
"""
Import constituencies, wards, and polling stations from IEBC 2022 data.
This script parses the rov_per_polling_station.csv file and populates the database.
"""

import sys
import re
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'backend'))

try:
    from database import SessionLocal, engine
    from models import County, Constituency, Ward, Base
    from sqlalchemy import text
except ImportError as e:
    print(f"❌ Error: Could not import database modules: {e}")
    print("   Make sure you're running this from the project root")
    sys.exit(1)


def parse_iebc_line(line):
    """Parse a line from the IEBC CSV file."""
    # Remove quotes and extra spaces
    line = line.strip().strip('"')
    
    # Skip empty lines or header lines
    if not line or 'County Name' in line or 'REGISTERED VOTERS' in line:
        return None
    
    # Split by multiple spaces (the delimiter in this file)
    parts = re.split(r'\s{2,}', line)
    
    if len(parts) < 10:
        return None
    
    try:
        return {
            'county_code': parts[0].strip(),
            'county_name': parts[1].strip(),
            'const_code': parts[2].strip(),
            'const_name': parts[3].strip(),
            'ward_code': parts[4].strip(),
            'ward_name': parts[5].strip(),
            'reg_center_code': parts[6].strip() if len(parts) > 6 else None,
            'reg_center_name': parts[7].strip() if len(parts) > 7 else None,
            'ps_code': parts[8].strip() if len(parts) > 8 else None,
            'ps_name': parts[9].strip() if len(parts) > 9 else None,
            'registered_voters': int(parts[10].strip()) if len(parts) > 10 and parts[10].strip().isdigit() else 0
        }
    except (ValueError, IndexError) as e:
        return None


def import_data(csv_path: str):
    """Import data from IEBC CSV file."""
    
    print("🗳️  IEBC Data Importer")
    print("=" * 60)
    print(f"Reading from: {csv_path}")
    print()
    
    db = SessionLocal()
    
    try:
        # Read and parse the file
        with open(csv_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        print(f"📄 Total lines in file: {len(lines)}")
        
        # Parse all lines
        parsed_data = []
        for line in lines[5:]:  # Skip header lines
            data = parse_iebc_line(line)
            if data:
                parsed_data.append(data)
        
        print(f"✅ Parsed {len(parsed_data)} data rows")
        print()
        
        # Get unique constituencies and wards
        constituencies_data = {}
        wards_data = {}
        polling_stations_data = []
        
        for row in parsed_data:
            # Constituency
            const_key = (row['county_code'], row['const_code'])
            if const_key not in constituencies_data:
                constituencies_data[const_key] = {
                    'county_code': row['county_code'],
                    'county_name': row['county_name'],
                    'const_code': row['const_code'],
                    'const_name': row['const_name']
                }
            
            # Ward - make code unique by combining const+ward codes (max 20 chars)
            ward_unique_code = f"{row['const_code']}-{row['ward_code']}"[:20]
            ward_key = (row['const_code'], row['ward_code'])
            if ward_key not in wards_data:
                wards_data[ward_key] = {
                    'const_code': row['const_code'],
                    'ward_code': ward_unique_code,  # Use unique code
                    'ward_name': row['ward_name']
                }
            
            # Polling Station
            if row['ps_code']:
                polling_stations_data.append(row)
        
        print(f"📊 Unique records found:")
        print(f"   Constituencies: {len(constituencies_data)}")
        print(f"   Wards: {len(wards_data)}")
        print(f"   Polling Stations: {len(polling_stations_data)}")
        print()
        
        # Get county mapping from database
        counties = db.query(County).all()
        county_map = {}

        # Special mappings for known mismatches
        special_mappings = {
            'THARAKA - NITHI': 'Tharaka Nithi',
            'THARAKA-NITHI': 'Tharaka Nithi',
            'NAIROBI CITY': 'Nairobi',
            'UASIN': 'Uasin Gishu',
            'ELGEYO/MARAKWET': 'Elgeyo Marakwet',
            'ELGEYO-MARAKWET': 'Elgeyo Marakwet',
        }

        for county in counties:
            # Try to match by code or name (with variations)
            county_map[county.code] = county.id
            county_map[county.name.upper()] = county.id
            # Handle name variations
            county_map[county.name.upper().replace(' ', '')] = county.id
            county_map[county.name.upper().replace('-', ' ')] = county.id
            county_map[county.name.upper().replace('/', '')] = county.id
            county_map[county.name.upper().replace(' ', '-')] = county.id

            # Add special mappings
            for iebc_name, db_name in special_mappings.items():
                if county.name == db_name:
                    county_map[iebc_name] = county.id
        
        print(f"📍 Found {len(counties)} counties in database")
        print()
        
        # Import Constituencies
        print("📥 Importing constituencies...")
        const_map = {}
        imported_const = 0
        skipped_const = 0
        
        for const_key, const_data in constituencies_data.items():
            county_code = const_data['county_code']
            
            # Find county ID
            county_id = county_map.get(county_code)
            if not county_id:
                # Try by name with variations
                county_name = const_data['county_name'].upper()
                county_id = (county_map.get(county_name) or
                           county_map.get(county_name.replace(' ', '')) or
                           county_map.get(county_name.replace('-', ' ')) or
                           county_map.get(county_name.replace('/', '')))
            
            if not county_id:
                print(f"⚠️  Skipping constituency {const_data['const_name']} - county not found: {const_data['county_name']}")
                skipped_const += 1
                continue
            
            # Check if constituency already exists
            existing = db.query(Constituency).filter(
                Constituency.code == const_data['const_code']
            ).first()
            
            if existing:
                const_map[const_data['const_code']] = existing.id
                continue
            
            # Create new constituency
            constituency = Constituency(
                county_id=county_id,
                code=const_data['const_code'],
                name=const_data['const_name']
            )
            db.add(constituency)
            db.flush()
            
            const_map[const_data['const_code']] = constituency.id
            imported_const += 1
        
        db.commit()
        print(f"✅ Imported {imported_const} constituencies")
        if skipped_const > 0:
            print(f"⚠️  Skipped {skipped_const} constituencies (county not found)")
        print()
        
        # Import Wards
        print("📥 Importing wards...")
        ward_map = {}
        imported_wards = 0
        skipped_wards = 0
        
        for ward_key, ward_data in wards_data.items():
            const_code = ward_data['const_code']
            
            # Find constituency ID
            const_id = const_map.get(const_code)
            if not const_id:
                skipped_wards += 1
                continue
            
            # Check if ward already exists
            existing = db.query(Ward).filter(
                Ward.code == ward_data['ward_code'],
                Ward.constituency_id == const_id
            ).first()
            
            if existing:
                ward_map[(const_code, ward_data['ward_code'])] = existing.id
                continue
            
            # Create new ward
            ward = Ward(
                constituency_id=const_id,
                code=ward_data['ward_code'],
                name=ward_data['ward_name']
            )
            db.add(ward)
            db.flush()
            
            ward_map[(const_code, ward_data['ward_code'])] = ward.id
            imported_wards += 1
        
        db.commit()
        print(f"✅ Imported {imported_wards} wards")
        if skipped_wards > 0:
            print(f"⚠️  Skipped {skipped_wards} wards (constituency not found)")
        print()
        
        # Skip Polling Stations (model doesn't exist yet)
        print("⏭️  Skipping polling stations (model not implemented)")
        print(f"   Found {len(polling_stations_data)} polling stations in data")
        print()
        
        # Summary
        print("=" * 60)
        print("✅ Import Complete!")
        print()
        print("📊 Final Database Counts:")
        print(f"   Counties: {db.query(County).count()}")
        print(f"   Constituencies: {db.query(Constituency).count()}")
        print(f"   Wards: {db.query(Ward).count()}")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()


def main():
    csv_path = Path(__file__).parent.parent / 'data' / 'rov_per_polling_station.csv'
    
    if not csv_path.exists():
        print(f"❌ Error: File not found: {csv_path}")
        sys.exit(1)
    
    import_data(str(csv_path))
    
    print()
    print("📝 Next steps:")
    print("1. Run: python scripts/create_geojson_from_db.py")
    print("2. Restart your Next.js dev server")
    print("3. Visit http://localhost:3000/explorer")
    print("4. Enjoy full drill-down functionality!")


if __name__ == '__main__':
    main()

