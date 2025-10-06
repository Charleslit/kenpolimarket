#!/usr/bin/env python3
"""
Simple polling station importer - optimized for slow connections
Imports data in larger batches with better error handling
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
    parser = argparse.ArgumentParser(description='Import IEBC polling station data')
    parser.add_argument('--database-url', required=True, help='Database URL')
    parser.add_argument('--csv-file', required=True, help='Path to CSV file')
    
    args = parser.parse_args()
    
    if not os.path.exists(args.csv_file):
        print(f"❌ CSV file not found: {args.csv_file}")
        sys.exit(1)
    
    print(f"📊 Starting import from {args.csv_file}")
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
    
    # Statistics
    stats = {
        'total_rows': 0,
        'skipped_rows': 0,
        'created_stations': 0,
        'errors': 0
    }
    
    # Prepare batch insert
    insert_query = """
        INSERT INTO polling_stations 
        (code, name, county_id, constituency_id, ward_id, registered_voters_2022)
        VALUES (%s, %s, %s, %s, %s, %s)
        ON CONFLICT (code) DO UPDATE 
        SET registered_voters_2022 = EXCLUDED.registered_voters_2022
    """
    
    batch_data = []
    batch_size = 500
    
    # Cache for geographic IDs
    county_cache = {}
    constituency_cache = {}
    ward_cache = {}
    
    # Load existing geographic data
    print("📍 Loading geographic data...")
    cursor.execute("SELECT id, code FROM counties")
    for row in cursor.fetchall():
        county_cache[row[1]] = row[0]
    
    cursor.execute("SELECT id, code FROM constituencies")
    for row in cursor.fetchall():
        constituency_cache[row[1]] = row[0]
    
    cursor.execute("SELECT id, code FROM wards")
    for row in cursor.fetchall():
        ward_cache[row[1]] = row[0]
    
    print(f"✅ Loaded {len(county_cache)} counties, {len(constituency_cache)} constituencies, {len(ward_cache)} wards")
    print()
    
    try:
        with open(args.csv_file, 'r', encoding='utf-8') as f:
            # Skip header rows
            for _ in range(5):
                next(f)
            
            print("📥 Importing polling stations...")
            
            for line_num, line in enumerate(f, start=6):
                stats['total_rows'] += 1
                
                # Parse line
                line = line.strip().strip('"')
                if not line:
                    stats['skipped_rows'] += 1
                    continue
                
                # Split by whitespace
                parts = [p for p in line.split() if p]
                
                if len(parts) < 11:
                    stats['skipped_rows'] += 1
                    continue
                
                try:
                    # Find polling station code (15 digits)
                    ps_code = None
                    ps_code_idx = None
                    for i, part in enumerate(parts):
                        if len(part) == 15 and part.isdigit():
                            ps_code = part
                            ps_code_idx = i
                            break
                    
                    if not ps_code:
                        stats['skipped_rows'] += 1
                        continue
                    
                    # Extract data (strip leading zeros to match database format)
                    county_code = parts[0].lstrip('0') or '0'
                    const_code = parts[2].lstrip('0') or '0'
                    ward_code = parts[4].lstrip('0') or '0'
                    voters = int(parts[-1])
                    
                    # Get name (everything between PS code and voters)
                    ps_name = ' '.join(parts[ps_code_idx+1:-1]) if ps_code_idx+1 < len(parts)-1 else ' '.join(parts[7:ps_code_idx])
                    
                    # Get IDs from cache
                    county_id = county_cache.get(county_code)
                    const_id = constituency_cache.get(const_code)
                    ward_id = ward_cache.get(ward_code)

                    # Skip if we can't find the geographic entities
                    if not county_id or not const_id or not ward_id:
                        stats['skipped_rows'] += 1
                        if stats['errors'] < 5:
                            print(f"  ⚠ Line {line_num}: Missing IDs - county:{county_code}={county_id}, const:{const_code}={const_id}, ward:{ward_code}={ward_id}")
                        continue

                    # Add to batch
                    batch_data.append((
                        ps_code,
                        ps_name,
                        county_id,
                        const_id,
                        ward_id,
                        voters
                    ))
                    
                    # Execute batch when full
                    if len(batch_data) >= batch_size:
                        try:
                            execute_batch(cursor, insert_query, batch_data)
                            conn.commit()
                            stats['created_stations'] += len(batch_data)
                            print(f"  ✓ Imported {stats['created_stations']:,} stations...")
                        except Exception as batch_error:
                            conn.rollback()
                            print(f"  ❌ Batch error: {batch_error}")
                            print(f"  First item in batch: {batch_data[0] if batch_data else 'empty'}")
                            stats['errors'] += len(batch_data)
                        batch_data = []

                except Exception as e:
                    stats['errors'] += 1
                    if stats['errors'] < 10:
                        print(f"  ⚠ Error on line {line_num}: {e}")
            
            # Insert remaining batch
            if batch_data:
                try:
                    execute_batch(cursor, insert_query, batch_data)
                    conn.commit()
                    stats['created_stations'] += len(batch_data)
                except Exception as batch_error:
                    conn.rollback()
                    print(f"  ❌ Final batch error: {batch_error}")
                    stats['errors'] += len(batch_data)
            
            print()
            print("✅ Import completed!")
            
    except Exception as e:
        conn.rollback()
        print(f"❌ Import failed: {e}")
        sys.exit(1)
    finally:
        cursor.close()
        conn.close()
    
    # Print statistics
    print()
    print("=" * 60)
    print("IMPORT STATISTICS")
    print("=" * 60)
    print(f"Total rows processed:     {stats['total_rows']:,}")
    print(f"Polling stations created: {stats['created_stations']:,}")
    print(f"Rows skipped:             {stats['skipped_rows']:,}")
    print(f"Errors:                   {stats['errors']}")
    print("=" * 60)
    
    # Verify
    print()
    print("🔍 Verifying import...")
    conn = psycopg2.connect(**parse_database_url(args.database_url))
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM polling_stations")
    ps_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COALESCE(SUM(registered_voters_2022), 0) FROM polling_stations")
    total_voters = cursor.fetchone()[0]
    
    print(f"✅ Polling stations in database: {ps_count:,}")
    print(f"✅ Total registered voters: {total_voters:,}")
    
    cursor.close()
    conn.close()
    
    print()
    print("🎉 Done!")

if __name__ == '__main__':
    main()

