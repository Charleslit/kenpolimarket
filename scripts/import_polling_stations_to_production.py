#!/usr/bin/env python3
"""
Import polling stations to production database
Handles the production schema which includes constituency_id and county_id
"""

import psycopg2
from psycopg2 import sql
import re
import sys

# Production database connection
PROD_DB_CONFIG = {
    'host': '35.227.164.209',
    'database': 'kenpolimarket',
    'user': 'kenpolimarket',
    'password': 'bC41dQ7drjIr5Fa7iWfxNoPjHLmyEUzV',
    'port': 5432,
    'sslmode': 'require',
    'connect_timeout': 30
}

def parse_iebc_line(line):
    """Parse a line from the IEBC CSV file."""
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
        
        # Check if county name is split
        if county_name in ['UASIN', 'NAIROBI', 'TAITA', 'ELGEYO', 'THARAKA', 'TRANS']:
            county_name = f"{county_name} {parts[2].strip()}"
            offset = 1
        
        const_code = parts[2 + offset].strip()
        const_name = parts[3 + offset].strip()
        ward_code = parts[4 + offset].strip()
        ward_name = parts[5 + offset].strip()
        reg_center_code = parts[6 + offset].strip()
        
        # Find the 15-digit polling station code
        combined = ' '.join(parts[7 + offset:])
        match = re.search(r'(\d{15})', combined)
        
        if not match:
            return None
        
        ps_code = match.group(1)
        prefix = combined[:match.start()].strip()
        suffix = combined[match.end():].strip()
        
        # Extract registration center name and polling station name
        reg_center_name = prefix if prefix else parts[7 + offset].strip()
        
        # Get voters from the last part
        voters_match = re.search(r'(\d+)$', suffix)
        if voters_match:
            voters = int(voters_match.group(1))
            ps_name = suffix[:voters_match.start()].strip()
        else:
            return None
        
        # Validate voters is reasonable
        if voters > 2147483647 or voters < 0:
            return None
        
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
            'ps_name': ps_name if ps_name else reg_center_name,
            'voters': voters
        }
    except (ValueError, IndexError) as e:
        return None


def main():
    print("🚀 Starting polling stations import to PRODUCTION...")
    print("=" * 70)
    
    # Connect to production database
    print("\n📡 Connecting to production database...")
    try:
        conn = psycopg2.connect(**PROD_DB_CONFIG)
        conn.autocommit = False
        cur = conn.cursor()
        print("✅ Connected to production database")
    except Exception as e:
        print(f"❌ Failed to connect to production database: {e}")
        sys.exit(1)
    
    # Get current counts
    cur.execute("SELECT COUNT(*) FROM polling_stations")
    initial_count = cur.fetchone()[0]
    print(f"\n📊 Current polling stations in production: {initial_count:,}")
    
    # Build lookup caches
    print("\n🔍 Building lookup caches...")
    
    # Counties - map both "001" and "1" formats
    cur.execute("SELECT id, code FROM counties")
    county_map = {}
    for id, code in cur.fetchall():
        county_map[code] = id
        # Also map with leading zeros (e.g., "1" -> "001")
        county_map[code.zfill(3)] = id
    print(f"   Counties: {len(county_map)}")
    
    # Constituencies - map both "001" and "1" formats
    cur.execute("SELECT id, code FROM constituencies")
    const_map = {}
    for id, code in cur.fetchall():
        const_map[code] = id
        # Also map with leading zeros (e.g., "1" -> "001")
        const_map[code.zfill(3)] = id
    print(f"   Constituencies: {len(const_map)}")
    
    # Wards - build map with both formats
    cur.execute("SELECT id, code FROM wards")
    ward_map = {}
    for id, code in cur.fetchall():
        ward_map[code] = id
        # Also map without the constituency prefix (e.g., "001-0001" -> "0001")
        if '-' in code:
            ward_only = code.split('-')[1]
            ward_map[ward_only] = id
    print(f"   Wards: {len(ward_map)}")
    
    # Parse CSV and import
    print("\n📥 Parsing IEBC data and importing...")
    
    csv_file = 'data/rov_per_polling_station.csv'
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    total_lines = 0
    imported = 0
    updated = 0
    skipped = 0
    errors = []
    
    batch = []
    batch_size = 1000
    
    for line in lines[5:]:  # Skip header
        total_lines += 1
        
        data = parse_iebc_line(line)
        if not data:
            skipped += 1
            continue
        
        # Get IDs
        county_id = county_map.get(data['county_code'])
        const_id = const_map.get(data['const_code'])
        ward_id = ward_map.get(data['ward_code'])
        
        if not all([county_id, const_id, ward_id]):
            skipped += 1
            if len(errors) < 10:
                errors.append(f"Missing IDs for {data['ps_code']}: county={county_id}, const={const_id}, ward={ward_id}")
            continue
        
        batch.append({
            'code': data['ps_code'],
            'name': data['ps_name'],
            'ward_id': ward_id,
            'constituency_id': const_id,
            'county_id': county_id,
            'voters': data['voters']
        })
        
        # Process batch
        if len(batch) >= batch_size:
            for item in batch:
                try:
                    cur.execute("""
                        INSERT INTO polling_stations 
                        (code, name, ward_id, constituency_id, county_id, registered_voters_2022)
                        VALUES (%s, %s, %s, %s, %s, %s)
                        ON CONFLICT (code) DO UPDATE SET
                            registered_voters_2022 = EXCLUDED.registered_voters_2022,
                            ward_id = EXCLUDED.ward_id,
                            constituency_id = EXCLUDED.constituency_id,
                            county_id = EXCLUDED.county_id,
                            updated_at = CURRENT_TIMESTAMP
                    """, (item['code'], item['name'], item['ward_id'], 
                          item['constituency_id'], item['county_id'], item['voters']))
                    
                    if cur.rowcount == 1:
                        imported += 1
                    else:
                        updated += 1
                except Exception as e:
                    skipped += 1
                    if len(errors) < 10:
                        errors.append(f"Error inserting {item['code']}: {str(e)}")
            
            conn.commit()
            print(f"   Processed {total_lines:,} lines... (imported: {imported:,}, updated: {updated:,}, skipped: {skipped:,})")
            batch = []
    
    # Process remaining batch
    if batch:
        for item in batch:
            try:
                cur.execute("""
                    INSERT INTO polling_stations 
                    (code, name, ward_id, constituency_id, county_id, registered_voters_2022)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    ON CONFLICT (code) DO UPDATE SET
                        registered_voters_2022 = EXCLUDED.registered_voters_2022,
                        ward_id = EXCLUDED.ward_id,
                        constituency_id = EXCLUDED.constituency_id,
                        county_id = EXCLUDED.county_id,
                        updated_at = CURRENT_TIMESTAMP
                """, (item['code'], item['name'], item['ward_id'], 
                      item['constituency_id'], item['county_id'], item['voters']))
                
                if cur.rowcount == 1:
                    imported += 1
                else:
                    updated += 1
            except Exception as e:
                skipped += 1
                if len(errors) < 10:
                    errors.append(f"Error inserting {item['code']}: {str(e)}")
        
        conn.commit()
    
    # Get final count
    cur.execute("SELECT COUNT(*) FROM polling_stations")
    final_count = cur.fetchone()[0]
    
    print("\n" + "=" * 70)
    print("✅ IMPORT COMPLETE!")
    print("=" * 70)
    print(f"\nTotal lines processed: {total_lines:,}")
    print(f"Polling stations imported: {imported:,}")
    print(f"Polling stations updated: {updated:,}")
    print(f"Lines skipped: {skipped:,}")
    print(f"\nBefore: {initial_count:,} polling stations")
    print(f"After:  {final_count:,} polling stations")
    print(f"Change: +{final_count - initial_count:,}")
    
    if errors:
        print(f"\n⚠️  Sample errors (showing first {len(errors)}):")
        for error in errors:
            print(f"   {error}")
    
    cur.close()
    conn.close()
    
    print("\n🎉 Production import successful!")


if __name__ == '__main__':
    main()

