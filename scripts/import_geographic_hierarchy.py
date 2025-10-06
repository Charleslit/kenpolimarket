#!/usr/bin/env python3
"""
Import geographic hierarchy (constituencies and wards) from polling station CSV
This must be run before importing polling stations
"""

import csv
import os
import sys
import argparse
import psycopg2
from psycopg2.extras import execute_batch
from urllib.parse import urlparse

def parse_database_url(database_url):
    """Parse database URL into connection parameters"""
    parsed = urlparse(database_url)
    return {
        'host': parsed.hostname,
        'port': parsed.port or 5432,
        'database': parsed.path[1:],
        'user': parsed.username,
        'password': parsed.password,
        'connect_timeout': 30
    }

def main():
    parser = argparse.ArgumentParser(description='Import geographic hierarchy from CSV')
    parser.add_argument('--database-url', required=True, help='Database URL')
    parser.add_argument('--csv-file', required=True, help='Path to CSV file')
    
    args = parser.parse_args()
    
    if not os.path.exists(args.csv_file):
        print(f"❌ CSV file not found: {args.csv_file}")
        sys.exit(1)
    
    print(f"📊 Extracting geographic hierarchy from {args.csv_file}")
    print()
    
    # Connect to database
    try:
        conn_params = parse_database_url(args.database_url)
        print(f"🔌 Connecting to {conn_params['database']}...")
        conn = psycopg2.connect(**conn_params)
        conn.autocommit = False
        cursor = conn.cursor()
        print(f"✅ Connected!")
    except Exception as e:
        print(f"❌ Failed to connect: {e}")
        sys.exit(1)
    
    # Load existing counties
    print("📍 Loading existing counties...")
    cursor.execute("SELECT id, code FROM counties")
    county_cache = {row[1]: row[0] for row in cursor.fetchall()}
    print(f"✅ Found {len(county_cache)} counties")
    
    # Extract unique constituencies and wards from CSV
    print("📖 Reading CSV...")
    constituencies = {}  # {code: (name, county_code)}
    wards = {}  # {code: (name, const_code)}
    
    with open(args.csv_file, 'r', encoding='utf-8') as f:
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
    print()
    
    # Import constituencies
    print("📥 Importing constituencies...")
    const_insert = """
        INSERT INTO constituencies (code, name, county_id)
        VALUES (%s, %s, %s)
    """

    const_data = []
    for code, (name, county_code) in constituencies.items():
        county_id = county_cache.get(county_code)
        if county_id:
            const_data.append((code, name, county_id))

    if const_data:
        execute_batch(cursor, const_insert, const_data)
        conn.commit()
    print(f"✅ Imported {len(const_data)} constituencies")
    
    # Load constituency IDs
    cursor.execute("SELECT id, code FROM constituencies")
    const_cache = {row[1]: row[0] for row in cursor.fetchall()}
    
    # Import wards
    print("📥 Importing wards...")
    ward_insert = """
        INSERT INTO wards (code, name, constituency_id)
        VALUES (%s, %s, %s)
    """

    ward_data = []
    for code, (name, const_code) in wards.items():
        const_id = const_cache.get(const_code)
        if const_id:
            ward_data.append((code, name, const_id))

    if ward_data:
        execute_batch(cursor, ward_insert, ward_data)
        conn.commit()
    print(f"✅ Imported {len(ward_data)} wards")
    
    cursor.close()
    conn.close()
    
    print()
    print("=" * 60)
    print("IMPORT COMPLETE")
    print("=" * 60)
    print(f"Counties:       {len(county_cache)}")
    print(f"Constituencies: {len(const_data)}")
    print(f"Wards:          {len(ward_data)}")
    print("=" * 60)
    print()
    print("✅ You can now import polling stations!")

if __name__ == '__main__':
    main()

