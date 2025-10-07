#!/usr/bin/env python3
"""
Import constituencies and wards to Render production database.
This script uses the enhanced parser to import all 290 constituencies.
"""

import sys
import re
from pathlib import Path

# Production database credentials
# Using IP address to avoid DNS issues: 35.227.164.209 = dpg-d3ginq7fte5s73c6j060-a.oregon-postgres.render.com
PROD_DB_CONFIG = {
    'host': '35.227.164.209',
    'database': 'kenpolimarket',
    'user': 'kenpolimarket',
    'password': 'bC41dQ7drjIr5Fa7iWfxNoPjHLmyEUzV',
    'port': 5432,
    'sslmode': 'require',
    'connect_timeout': 30
}

try:
    import psycopg2
    from psycopg2.extras import execute_values
except ImportError:
    print("❌ Error: psycopg2 not installed")
    print("   Install with: pip install psycopg2-binary")
    sys.exit(1)


def parse_iebc_line(line):
    """Parse a line from the IEBC CSV file with enhanced offset detection."""
    line = line.strip().strip('"')
    
    if not line or 'County Name' in line or 'REGISTERED VOTERS' in line:
        return None
    
    parts = re.split(r'\s{2,}', line)
    
    if len(parts) < 10:
        return None
    
    try:
        county_code = parts[0].strip()
        county_name = parts[1].strip()
        offset = 0
        
        # Check if county name is split (e.g., "UASIN" in one column, "GISHU" in next)
        if county_name in ['UASIN', 'NAIROBI', 'TAITA', 'ELGEYO', 'THARAKA', 'TRANS']:
            county_name = f"{county_name} {parts[2].strip()}"
            offset = 1
        
        const_code = parts[2 + offset].strip()
        const_name = parts[3 + offset].strip()
        ward_code = parts[4 + offset].strip()
        ward_name = parts[5 + offset].strip()
        
        return {
            'county_code': county_code,
            'county_name': county_name,
            'const_code': const_code,
            'const_name': const_name,
            'ward_code': ward_code,
            'ward_name': ward_name,
        }
    except (ValueError, IndexError) as e:
        return None


def import_to_production(csv_path: str):
    """Import data to production database."""
    
    print("🗳️  IEBC Data Importer - PRODUCTION")
    print("=" * 70)
    print(f"📍 Target: Render Production Database")
    print(f"📄 Source: {csv_path}")
    print()
    
    # Connect to production database
    print("🔌 Connecting to production database...")
    try:
        conn = psycopg2.connect(**PROD_DB_CONFIG)
        cur = conn.cursor()
        print("✅ Connected successfully!")
        print()
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        sys.exit(1)
    
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
        constituencies = {}
        wards = {}
        
        for row in parsed_data:
            # Skip special constituencies
            if row['county_name'] in ['DIASPORA', 'PRISONS']:
                continue
            
            const_key = row['const_code']
            if const_key not in constituencies:
                constituencies[const_key] = {
                    'code': row['const_code'],
                    'name': row['const_name'],
                    'county_name': row['county_name'],
                }
            
            ward_key = f"{row['const_code']}-{row['ward_code']}"
            if ward_key not in wards:
                wards[ward_key] = {
                    'code': f"{row['const_code']}-{row['ward_code']}"[:20],
                    'name': row['ward_name'],
                    'const_code': row['const_code'],
                }
        
        print(f"📊 Unique records found:")
        print(f"   Constituencies: {len(constituencies)}")
        print(f"   Wards: {len(wards)}")
        print()
        
        # Get county mapping
        print("📍 Fetching counties from production database...")
        cur.execute("SELECT id, code, name FROM counties")
        counties_db = cur.fetchall()
        
        county_map = {}
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
        
        for county_id, code, name in counties_db:
            county_map[code] = county_id
            county_map[name.upper()] = county_id
            county_map[name.upper().replace(' ', '')] = county_id
            county_map[name.upper().replace('-', ' ')] = county_id
            county_map[name.upper().replace('/', '')] = county_id
            county_map[name.upper().replace(' ', '-')] = county_id
            
            for iebc_name, db_name in special_mappings.items():
                if name == db_name:
                    county_map[iebc_name] = county_id
        
        print(f"✅ Found {len(counties_db)} counties in database")
        print()
        
        # Clear existing constituencies and wards
        print("🗑️  Clearing existing constituencies and wards...")
        cur.execute("DELETE FROM wards")
        wards_deleted = cur.rowcount
        cur.execute("DELETE FROM constituencies")
        const_deleted = cur.rowcount
        conn.commit()
        print(f"✅ Deleted {const_deleted} constituencies, {wards_deleted} wards")
        print()
        
        # Import constituencies
        print("📥 Importing constituencies...")
        imported_const = 0
        skipped_const = 0
        
        for const_data in constituencies.values():
            county_id = county_map.get(const_data['county_name'].upper())
            
            if not county_id:
                print(f"⚠️  Skipping constituency {const_data['name']} - county not found: {const_data['county_name']}")
                skipped_const += 1
                continue
            
            cur.execute("""
                INSERT INTO constituencies (code, name, county_id, created_at, updated_at)
                VALUES (%s, %s, %s, NOW(), NOW())
                ON CONFLICT (code) DO UPDATE SET
                    name = EXCLUDED.name,
                    county_id = EXCLUDED.county_id,
                    updated_at = NOW()
            """, (const_data['code'], const_data['name'], county_id))
            
            imported_const += 1
        
        conn.commit()
        print(f"✅ Imported {imported_const} constituencies")
        if skipped_const > 0:
            print(f"⚠️  Skipped {skipped_const} constituencies (county not found)")
        print()
        
        # Get constituency mapping
        cur.execute("SELECT id, code FROM constituencies")
        const_db = cur.fetchall()
        const_map = {code: id for id, code in const_db}
        
        # Import wards
        print("📥 Importing wards...")
        imported_wards = 0
        skipped_wards = 0
        
        for ward_data in wards.values():
            const_id = const_map.get(ward_data['const_code'])
            
            if not const_id:
                skipped_wards += 1
                continue
            
            cur.execute("""
                INSERT INTO wards (code, name, constituency_id, created_at, updated_at)
                VALUES (%s, %s, %s, NOW(), NOW())
                ON CONFLICT (code) DO UPDATE SET
                    name = EXCLUDED.name,
                    constituency_id = EXCLUDED.constituency_id,
                    updated_at = NOW()
            """, (ward_data['code'], ward_data['name'], const_id))
            
            imported_wards += 1
        
        conn.commit()
        print(f"✅ Imported {imported_wards} wards")
        if skipped_wards > 0:
            print(f"⚠️  Skipped {skipped_wards} wards (constituency not found)")
        print()
        
        # Final counts
        cur.execute("SELECT COUNT(*) FROM counties")
        county_count = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM constituencies")
        const_count = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM wards")
        ward_count = cur.fetchone()[0]
        
        print("=" * 70)
        print("✅ Import Complete!")
        print()
        print("📊 Final Production Database Counts:")
        print(f"   Counties: {county_count}")
        print(f"   Constituencies: {const_count}")
        print(f"   Wards: {ward_count}")
        print()
        
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        conn.rollback()
        sys.exit(1)


if __name__ == '__main__':
    csv_path = Path(__file__).parent.parent / 'data' / 'rov_per_polling_station.csv'
    
    if not csv_path.exists():
        print(f"❌ Error: CSV file not found: {csv_path}")
        sys.exit(1)
    
    import_to_production(str(csv_path))

