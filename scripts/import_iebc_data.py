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
    from models import County, Constituency, Ward, PollingStation, Base
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
        # Handle special cases where county name is split across columns
        # This happens for "UASIN GISHU" and "NAIROBI CITY"
        county_code = parts[0].strip()
        county_name = parts[1].strip()
        offset = 0

        # Check if county name is split (e.g., "UASIN" in one column, "GISHU" in next)
        # This happens when the county name has single spaces that get treated as delimiters
        if county_name in ['UASIN', 'NAIROBI', 'TAITA', 'ELGEYO', 'THARAKA', 'TRANS']:
            # Merge with next part
            county_name = f"{county_name} {parts[2].strip()}"
            offset = 1

        const_code = parts[2 + offset].strip()
        const_name = parts[3 + offset].strip()
        ward_code = parts[4 + offset].strip()
        ward_name = parts[5 + offset].strip()

        # Extract polling station code and name
        # Sometimes the reg center name and PS code are concatenated without spaces
        # Format: "REG_CENTER_NAME003011005403301     PS_NAME        352"
        ps_code = None
        ps_name = None
        reg_center_code = parts[6 + offset].strip() if len(parts) > 6 + offset else None
        reg_center_name = parts[7 + offset].strip() if len(parts) > 7 + offset else None

        if len(parts) > 8 + offset:
            # The 8th column might have reg_center_name+ps_code concatenated
            combined = parts[8 + offset].strip()

            # Try to extract a 15-digit code from the end of the string
            # PS codes are typically 15 digits: CCCSSSSWWWRRRPP
            match = re.search(r'(\d{15})$', combined)
            if match:
                ps_code = match.group(1)
                # If there's text before the code, it's part of reg_center_name
                prefix = combined[:match.start()].strip()
                if prefix and not reg_center_name:
                    reg_center_name = prefix
            else:
                # No 15-digit code found, treat as ps_code as-is
                ps_code = combined if combined else None

            # PS name is in the next column
            ps_name = parts[9 + offset].strip() if len(parts) > 9 + offset else None

        # Registered voters
        registered_voters = 0
        if len(parts) > 10 + offset:
            voters_str = parts[10 + offset].strip()
            if voters_str.isdigit():
                registered_voters = int(voters_str)

        return {
            'county_code': county_code,
            'county_name': county_name,
            'const_code': const_code,
            'const_name': const_name,
            'ward_code': ward_code,
            'ward_name': ward_name,
            'reg_center_code': reg_center_code,
            'reg_center_name': reg_center_name,
            'ps_code': ps_code,
            'ps_name': ps_name,
            'registered_voters': registered_voters
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
            'THARAKA NITHI': 'Tharaka Nithi',
            'NAIROBI CITY': 'Nairobi',
            'UASIN GISHU': 'Uasin Gishu',
            'ELGEYO/MARAKWET': 'Elgeyo Marakwet',
            'ELGEYO-MARAKWET': 'Elgeyo Marakwet',
            'ELGEYO MARAKWET': 'Elgeyo Marakwet',
            'TAITA TAVETA': 'Taita Taveta',
            'TAITA-TAVETA': 'Taita Taveta',
            'TRANS NZOIA': 'Trans Nzoia',
            'TRANS-NZOIA': 'Trans Nzoia',
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

        # Import Polling Stations
        print("📥 Importing polling stations...")
        imported_ps = 0
        skipped_ps = 0
        ps_voters = {}  # Track voters per ward for aggregation

        # Group polling stations by unique code to avoid duplicates
        unique_ps = {}
        for row in polling_stations_data:
            ps_code = row['ps_code']
            if ps_code and ps_code not in unique_ps:
                unique_ps[ps_code] = row

        # Use raw SQL for better performance and to avoid ORM batching issues
        from sqlalchemy import text as sql_text

        for ps_code, row in unique_ps.items():
            # Find ward ID using the unique ward code
            ward_unique_code = f"{row['const_code']}-{row['ward_code']}"[:20]
            ward_id = ward_map.get((row['const_code'], ward_unique_code))

            if not ward_id:
                skipped_ps += 1
                continue

            # Validate data types
            try:
                ward_id = int(ward_id)
                voters = int(row['registered_voters']) if row['registered_voters'] else 0

                # Ensure values are within INTEGER range
                if ward_id > 2147483647 or voters > 2147483647:
                    print(f"⚠️  Skipping {ps_code} - value out of range (ward_id={ward_id}, voters={voters})")
                    skipped_ps += 1
                    continue

            except (ValueError, TypeError) as e:
                print(f"⚠️  Skipping {ps_code} - invalid data: {e}")
                skipped_ps += 1
                continue

            # Track voters per ward for aggregation
            if ward_id not in ps_voters:
                ps_voters[ward_id] = 0
            ps_voters[ward_id] += voters

            # Insert using raw SQL
            try:
                db.execute(sql_text("""
                    INSERT INTO polling_stations
                    (ward_id, code, name, registration_center_code, registration_center_name,
                     registered_voters_2022, created_at, updated_at)
                    VALUES (:ward_id, :code, :name, :reg_code, :reg_name, :voters, NOW(), NOW())
                    ON CONFLICT (code) DO UPDATE SET
                        registered_voters_2022 = EXCLUDED.registered_voters_2022,
                        updated_at = NOW()
                """), {
                    'ward_id': ward_id,
                    'code': ps_code[:100],  # Truncate to column size
                    'name': (row['ps_name'] or '')[:200],
                    'reg_code': (row['reg_center_code'] or '')[:50],
                    'reg_name': (row['reg_center_name'] or '')[:200],
                    'voters': voters
                })
                imported_ps += 1

                # Commit in batches
                if imported_ps % 1000 == 0:
                    db.commit()
                    print(f"   ... {imported_ps} polling stations imported")

            except Exception as e:
                print(f"⚠️  Error importing {ps_code}: {e}")
                skipped_ps += 1
                continue

        db.commit()
        print(f"✅ Imported {imported_ps} polling stations")
        if skipped_ps > 0:
            print(f"⚠️  Skipped {skipped_ps} polling stations (ward not found or invalid data)")
        print()

        # Update ward voter counts
        print("📊 Updating ward voter counts...")
        for ward_id, voters in ps_voters.items():
            db.query(Ward).filter(Ward.id == ward_id).update({
                'registered_voters_2022': voters
            })
        db.commit()
        print(f"✅ Updated {len(ps_voters)} wards with voter counts")
        print()

        # Update constituency voter counts (aggregate from wards)
        print("📊 Updating constituency voter counts...")
        db.execute(text("""
            UPDATE constituencies c
            SET registered_voters_2022 = (
                SELECT COALESCE(SUM(w.registered_voters_2022), 0)
                FROM wards w
                WHERE w.constituency_id = c.id
            )
        """))
        db.commit()
        print("✅ Updated constituency voter counts")
        print()

        # Update county voter counts (aggregate from constituencies)
        print("📊 Updating county voter counts...")
        db.execute(text("""
            UPDATE counties co
            SET registered_voters_2022 = (
                SELECT COALESCE(SUM(c.registered_voters_2022), 0)
                FROM constituencies c
                WHERE c.county_id = co.id
            )
        """))
        db.commit()
        print("✅ Updated county voter counts")
        print()

        # Summary
        print("=" * 60)
        print("✅ Import Complete!")
        print()
        print("📊 Final Database Counts:")
        print(f"   Counties: {db.query(County).count()}")
        print(f"   Constituencies: {db.query(Constituency).count()}")
        print(f"   Wards: {db.query(Ward).count()}")
        print(f"   Polling Stations: {db.query(PollingStation).count()}")
        print()

        # Show sample voter counts
        print("📊 Sample Voter Counts:")
        sample_county = db.query(County).filter(County.name == 'Nairobi').first()
        if sample_county:
            print(f"   Nairobi County: {sample_county.registered_voters_2022:,} voters")
            sample_const = db.query(Constituency).filter(
                Constituency.county_id == sample_county.id
            ).first()
            if sample_const:
                print(f"   {sample_const.name} Constituency: {sample_const.registered_voters_2022:,} voters")
                sample_ward = db.query(Ward).filter(
                    Ward.constituency_id == sample_const.id
                ).first()
                if sample_ward:
                    print(f"   {sample_ward.name} Ward: {sample_ward.registered_voters_2022:,} voters")
        
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

