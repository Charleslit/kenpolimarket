#!/usr/bin/env python3
"""
Update geographic hierarchy (constituencies and wards) from polling station CSV
Uses UPSERT to handle existing records
"""

import csv
import os
import sys
import psycopg2
from psycopg2.extras import execute_batch

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

CSV_FILE = 'data/rov_per_polling_station.csv'

def main():
    if not os.path.exists(CSV_FILE):
        print(f"❌ CSV file not found: {CSV_FILE}")
        sys.exit(1)
    
    print("=" * 70)
    print("📊 UPDATING GEOGRAPHIC HIERARCHY TO PRODUCTION")
    print("=" * 70)
    print()
    
    # Connect to database
    try:
        print(f"🔌 Connecting to production database...")
        conn = psycopg2.connect(**DB_CONFIG)
        conn.autocommit = False
        cursor = conn.cursor()
        print(f"✅ Connected!")
    except Exception as e:
        print(f"❌ Failed to connect: {e}")
        sys.exit(1)
    
    # Load existing counties
    print("\n📍 Loading existing counties...")
    cursor.execute("SELECT id, code FROM counties")
    county_cache = {row[1]: row[0] for row in cursor.fetchall()}
    print(f"✅ Found {len(county_cache)} counties")
    
    # Extract unique constituencies and wards from CSV
    print("\n📖 Reading CSV...")
    constituencies = {}  # {code: (name, county_code)}
    wards = {}  # {code: (name, const_code)}
    
    with open(CSV_FILE, 'r', encoding='utf-8') as f:
        # Skip header rows
        for _ in range(5):
            next(f)
        
        for line in f:
            line = line.strip().strip('"')
            if not line:
                continue
            
            parts = [p for p in line.split() if p]
            if len(parts) < 11:
                continue
            
            try:
                # Strip leading zeros from codes to match database format
                county_code = parts[0].lstrip('0') or '0'
                const_code = parts[2].lstrip('0') or '0'
                const_name = parts[3]
                ward_code = parts[4].lstrip('0') or '0'
                ward_name = parts[5]

                # Store constituency
                if const_code not in constituencies:
                    constituencies[const_code] = (const_name, county_code)

                # Store ward
                if ward_code not in wards:
                    wards[ward_code] = (ward_name, const_code)
            
            except (IndexError, ValueError):
                continue
    
    print(f"✅ Found {len(constituencies)} unique constituencies")
    print(f"✅ Found {len(wards)} unique wards")
    
    # Import/Update constituencies
    print("\n📥 Upserting constituencies...")
    const_upsert = """
        INSERT INTO constituencies (code, name, county_id)
        VALUES (%s, %s, %s)
        ON CONFLICT (code) 
        DO UPDATE SET 
            name = EXCLUDED.name,
            county_id = EXCLUDED.county_id
    """

    const_data = []
    for code, (name, county_code) in constituencies.items():
        county_id = county_cache.get(county_code)
        if county_id:
            const_data.append((code, name, county_id))

    if const_data:
        execute_batch(cursor, const_upsert, const_data)
        conn.commit()
    print(f"✅ Upserted {len(const_data)} constituencies")
    
    # Load constituency IDs
    cursor.execute("SELECT id, code FROM constituencies")
    const_cache = {row[1]: row[0] for row in cursor.fetchall()}
    
    # Import/Update wards
    print("\n📥 Upserting wards...")
    ward_upsert = """
        INSERT INTO wards (code, name, constituency_id)
        VALUES (%s, %s, %s)
        ON CONFLICT (code) 
        DO UPDATE SET 
            name = EXCLUDED.name,
            constituency_id = EXCLUDED.constituency_id
    """

    ward_data = []
    for code, (name, const_code) in wards.items():
        const_id = const_cache.get(const_code)
        if const_id:
            ward_data.append((code, name, const_id))

    if ward_data:
        execute_batch(cursor, ward_upsert, ward_data)
        conn.commit()
    print(f"✅ Upserted {len(ward_data)} wards")
    
    # Get final counts
    cursor.execute("SELECT COUNT(*) FROM constituencies")
    final_const = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM wards")
    final_wards = cursor.fetchone()[0]
    
    cursor.close()
    conn.close()
    
    print()
    print("=" * 70)
    print("✅ UPDATE COMPLETE")
    print("=" * 70)
    print(f"Counties:       {len(county_cache)}")
    print(f"Constituencies: {final_const:,}")
    print(f"Wards:          {final_wards:,}")
    print("=" * 70)

if __name__ == '__main__':
    main()

