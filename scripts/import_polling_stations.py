#!/usr/bin/env python3
"""
Import polling station data from IEBC CSV file
Usage: python scripts/import_polling_stations.py [--database-url DATABASE_URL] [--csv-file CSV_FILE]
"""

import csv
import os
import sys
import argparse
import psycopg2
from psycopg2 import sql
from urllib.parse import urlparse
from collections import defaultdict

# Colors for terminal output
class Colors:
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    RED = '\033[0;31m'
    BLUE = '\033[0;34m'
    NC = '\033[0m'

def print_success(message):
    print(f"{Colors.GREEN}✓ {message}{Colors.NC}")

def print_warning(message):
    print(f"{Colors.YELLOW}⚠ {message}{Colors.NC}")

def print_error(message):
    print(f"{Colors.RED}✗ {message}{Colors.NC}")

def print_info(message):
    print(f"{Colors.BLUE}ℹ {message}{Colors.NC}")

def parse_database_url(database_url):
    """Parse database URL into connection parameters"""
    parsed = urlparse(database_url)
    return {
        'host': parsed.hostname,
        'port': parsed.port or 5432,
        'database': parsed.path[1:],
        'user': parsed.username,
        'password': parsed.password
    }

def clean_text(text):
    """Clean and normalize text"""
    if not text:
        return None
    return text.strip().upper()

def parse_csv_row(row):
    """Parse a row from the CSV file"""
    # The CSV has inconsistent spacing, so we need to split carefully
    parts = row.split()
    
    if len(parts) < 10:
        return None
    
    try:
        return {
            'county_code': parts[0],
            'county_name': parts[1],
            'const_code': parts[2],
            'const_name': parts[3],
            'ward_code': parts[4],
            'ward_name': parts[5],
            'reg_center_code': parts[6],
            'reg_center_name': ' '.join(parts[7:-2]),  # Everything between center code and station code
            'polling_station_code': parts[-2],
            'polling_station_name': ' '.join(parts[7:-1]),  # Similar to center name
            'registered_voters': int(parts[-1])
        }
    except (ValueError, IndexError) as e:
        return None

def get_or_create_county(cursor, code, name):
    """Get county ID by code, create if doesn't exist"""
    cursor.execute("SELECT id FROM counties WHERE code = %s", (code,))
    result = cursor.fetchone()
    
    if result:
        return result[0]
    
    # Create county
    cursor.execute(
        "INSERT INTO counties (code, name) VALUES (%s, %s) RETURNING id",
        (code, name)
    )
    return cursor.fetchone()[0]

def get_or_create_constituency(cursor, code, name, county_id):
    """Get constituency ID by code, create if doesn't exist"""
    cursor.execute("SELECT id FROM constituencies WHERE code = %s", (code,))
    result = cursor.fetchone()
    
    if result:
        return result[0]
    
    # Create constituency
    cursor.execute(
        "INSERT INTO constituencies (code, name, county_id) VALUES (%s, %s, %s) RETURNING id",
        (code, name, county_id)
    )
    return cursor.fetchone()[0]

def get_or_create_ward(cursor, code, name, constituency_id):
    """Get ward ID by code, create if doesn't exist"""
    cursor.execute("SELECT id FROM wards WHERE code = %s", (code,))
    result = cursor.fetchone()
    
    if result:
        return result[0]
    
    # Create ward
    cursor.execute(
        "INSERT INTO wards (code, name, constituency_id) VALUES (%s, %s, %s) RETURNING id",
        (code, name, constituency_id)
    )
    return cursor.fetchone()[0]

def get_or_create_registration_center(cursor, code, name, ward_id, constituency_id, county_id):
    """Get registration center ID, create if doesn't exist"""
    cursor.execute(
        "SELECT id FROM registration_centers WHERE ward_id = %s AND code = %s",
        (ward_id, code)
    )
    result = cursor.fetchone()
    
    if result:
        return result[0]
    
    # Create registration center
    cursor.execute(
        """INSERT INTO registration_centers 
           (code, name, ward_id, constituency_id, county_id) 
           VALUES (%s, %s, %s, %s, %s) RETURNING id""",
        (code, name, ward_id, constituency_id, county_id)
    )
    return cursor.fetchone()[0]

def import_polling_stations(database_url, csv_file):
    """Main import function"""
    print_info(f"Starting import from {csv_file}")
    print()
    
    # Connect to database
    try:
        conn_params = parse_database_url(database_url)
        conn = psycopg2.connect(**conn_params)
        cursor = conn.cursor()
        print_success(f"Connected to database: {conn_params['database']}")
    except Exception as e:
        print_error(f"Failed to connect to database: {e}")
        return False
    
    # Statistics
    stats = {
        'total_rows': 0,
        'skipped_rows': 0,
        'counties_created': 0,
        'constituencies_created': 0,
        'wards_created': 0,
        'reg_centers_created': 0,
        'polling_stations_created': 0,
        'polling_stations_updated': 0,
        'errors': []
    }
    
    # Cache for IDs to avoid repeated queries
    county_cache = {}
    constituency_cache = {}
    ward_cache = {}
    reg_center_cache = {}
    
    try:
        with open(csv_file, 'r', encoding='utf-8') as f:
            # Skip header rows
            for _ in range(5):
                next(f)

            for line_num, line in enumerate(f, start=6):
                stats['total_rows'] += 1

                # Parse line - remove quotes and split by whitespace
                line = line.strip().strip('"')

                if not line:
                    stats['skipped_rows'] += 1
                    continue

                # Split by whitespace and filter empty strings
                parts = [p for p in line.split() if p]

                if len(parts) < 11:  # Minimum fields needed
                    stats['skipped_rows'] += 1
                    continue

                try:
                    # Parse fixed positions based on CSV structure
                    # Format: County_Code County_Name Const_Code Const_Name Ward_Code Ward_Name RegCenter_Code RegCenter_Name PS_Code PS_Name Voters
                    county_code = parts[0]
                    county_name = parts[1]
                    const_code = parts[2]
                    const_name = parts[3]
                    ward_code = parts[4]
                    ward_name = parts[5]
                    reg_center_code = parts[6]

                    # Find the polling station code (15 digits)
                    ps_code_idx = None
                    for i, part in enumerate(parts):
                        if len(part) == 15 and part.isdigit():
                            ps_code_idx = i
                            break

                    if ps_code_idx is None:
                        stats['skipped_rows'] += 1
                        continue

                    polling_station_code = parts[ps_code_idx]
                    registered_voters = int(parts[-1])

                    # Registration center name is between code and PS code
                    reg_center_name = ' '.join(parts[7:ps_code_idx])

                    # Polling station name is between PS code and voters
                    polling_station_name = ' '.join(parts[ps_code_idx+1:-1]) if ps_code_idx+1 < len(parts)-1 else reg_center_name
                    
                    # Get or create geographic entities
                    if county_code not in county_cache:
                        county_id = get_or_create_county(cursor, county_code, county_name)
                        county_cache[county_code] = county_id
                        stats['counties_created'] += 1
                    else:
                        county_id = county_cache[county_code]
                    
                    const_key = f"{county_code}-{const_code}"
                    if const_key not in constituency_cache:
                        constituency_id = get_or_create_constituency(cursor, const_code, const_name, county_id)
                        constituency_cache[const_key] = constituency_id
                        stats['constituencies_created'] += 1
                    else:
                        constituency_id = constituency_cache[const_key]
                    
                    ward_key = f"{const_code}-{ward_code}"
                    if ward_key not in ward_cache:
                        ward_id = get_or_create_ward(cursor, ward_code, ward_name, constituency_id)
                        ward_cache[ward_key] = ward_id
                        stats['wards_created'] += 1
                    else:
                        ward_id = ward_cache[ward_key]
                    
                    reg_center_key = f"{ward_id}-{reg_center_code}"
                    if reg_center_key not in reg_center_cache:
                        reg_center_id = get_or_create_registration_center(
                            cursor, reg_center_code, reg_center_name, 
                            ward_id, constituency_id, county_id
                        )
                        reg_center_cache[reg_center_key] = reg_center_id
                        stats['reg_centers_created'] += 1
                    else:
                        reg_center_id = reg_center_cache[reg_center_key]
                    
                    # Insert or update polling station
                    cursor.execute(
                        "SELECT id FROM polling_stations WHERE code = %s",
                        (polling_station_code,)
                    )
                    existing = cursor.fetchone()
                    
                    if existing:
                        cursor.execute(
                            """UPDATE polling_stations 
                               SET registered_voters_2022 = %s, updated_at = CURRENT_TIMESTAMP
                               WHERE code = %s""",
                            (registered_voters, polling_station_code)
                        )
                        stats['polling_stations_updated'] += 1
                    else:
                        cursor.execute(
                            """INSERT INTO polling_stations 
                               (code, name, registration_center_id, ward_id, constituency_id, county_id, registered_voters_2022)
                               VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                            (polling_station_code, polling_station_name, reg_center_id, 
                             ward_id, constituency_id, county_id, registered_voters)
                        )
                        stats['polling_stations_created'] += 1
                    
                    # Commit every 1000 rows
                    if stats['total_rows'] % 1000 == 0:
                        conn.commit()
                        print_info(f"Processed {stats['total_rows']} rows...")
                
                except Exception as e:
                    stats['errors'].append(f"Line {line_num}: {str(e)}")
                    stats['skipped_rows'] += 1
                    if len(stats['errors']) < 10:  # Only store first 10 errors
                        print_warning(f"Error on line {line_num}: {e}")
        
        # Final commit
        conn.commit()
        print_success("Import completed successfully!")
        
    except Exception as e:
        conn.rollback()
        print_error(f"Import failed: {e}")
        return False
    finally:
        cursor.close()
        conn.close()
    
    # Print statistics
    print()
    print("=" * 60)
    print("IMPORT STATISTICS")
    print("=" * 60)
    print(f"Total rows processed:        {stats['total_rows']:,}")
    print(f"Rows skipped:                {stats['skipped_rows']:,}")
    print(f"Counties created:            {stats['counties_created']:,}")
    print(f"Constituencies created:      {stats['constituencies_created']:,}")
    print(f"Wards created:               {stats['wards_created']:,}")
    print(f"Registration centers created: {stats['reg_centers_created']:,}")
    print(f"Polling stations created:    {stats['polling_stations_created']:,}")
    print(f"Polling stations updated:    {stats['polling_stations_updated']:,}")
    print(f"Errors encountered:          {len(stats['errors'])}")
    print("=" * 60)
    
    return True

def main():
    parser = argparse.ArgumentParser(description='Import IEBC polling station data')
    parser.add_argument('--database-url', 
                       default=os.environ.get('DATABASE_URL', 'postgresql://kenpolimarket:password@localhost:5433/kenpolimarket'),
                       help='Database URL')
    parser.add_argument('--csv-file',
                       default='data/rov_per_polling_station.csv',
                       help='Path to CSV file')
    
    args = parser.parse_args()
    
    if not os.path.exists(args.csv_file):
        print_error(f"CSV file not found: {args.csv_file}")
        sys.exit(1)
    
    success = import_polling_stations(args.database_url, args.csv_file)
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()

