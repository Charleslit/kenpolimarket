#!/usr/bin/env python3
"""
Import historical voter registration data to production database.

This script imports CSV files directly to the Render PostgreSQL database
for the 2017 and 2022 election years.
"""

import os
import sys
import csv
import re
import psycopg2
from psycopg2.extras import execute_batch
from datetime import datetime

# Production database connection
# Using IP address to avoid DNS issues: 35.227.164.209 = dpg-d3ginq7fte5s73c6j060-a.oregon-postgres.render.com
DB_CONFIG = {
    'host': '35.227.164.209',
    'database': 'kenpolimarket',
    'user': 'kenpolimarket',
    'password': os.environ.get('PGPASSWORD', os.environ.get('DB_PASSWORD', 'bC41dQ7drjIr5Fa7iWfxNoPjHLmyEUzV')),
    'port': 5432,
    'sslmode': 'require',
    'connect_timeout': 30
}

def parse_2022_csv(filepath):
    """Parse 2022 CSV format - space-separated fixed-width format"""
    print(f"📖 Reading 2022 CSV: {filepath}")

    stations = []
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()

        # Skip header rows (first 5 lines)
        for line in lines[5:]:
            line = line.strip()
            # Remove quotes if present
            if line.startswith('"') and line.endswith('"'):
                line = line[1:-1]

            if not line:
                continue

            try:
                # Use regex to extract the station code (15 digits) and registered voters (number at end)
                # Pattern: ... <15-digit-code> <station-name> <registered-voters>
                match = re.search(r'(\d{15})\s+(.+?)\s+(\d+)\s*$', line)
                if not match:
                    continue

                station_code = match.group(1)
                station_name = match.group(2).strip()
                registered_voters = int(match.group(3))

                # Extract other fields from the beginning
                parts = line.split()
                if len(parts) < 5:
                    continue

                station = {
                    'county_code': parts[0],
                    'county_name': parts[1],
                    'const_code': parts[2],
                    'const_name': parts[3],
                    'ward_code': parts[4],
                    'ward_name': '',  # Will be filled if needed
                    'center_code': '',
                    'center_name': '',
                    'station_code': station_code,
                    'station_name': station_name,
                    'registered_voters': registered_voters,
                    'year': 2022
                }
                stations.append(station)
            except (ValueError, IndexError) as e:
                # Skip invalid rows silently
                continue

    print(f"✅ Parsed {len(stations):,} stations from 2022 CSV")
    return stations


def parse_2017_csv(filepath):
    """Parse 2017 CSV format - space-separated fixed-width format"""
    print(f"📖 Reading 2017 CSV: {filepath}")

    stations = []
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()

        # Skip header rows (first 5 lines)
        for line in lines[5:]:
            line = line.strip()
            # Remove quotes if present
            if line.startswith('"') and line.endswith('"'):
                line = line[1:-1]

            if not line:
                continue

            try:
                # Use regex to extract the station code (14 digits) and registered voters
                # Pattern: ... <14-digit-code> <registered-voters> <stream-number>
                # Format: 001 MOMBASA001 CHANGAMWE 0001 PORT REITZ 001 BOMU PRIMARY SCHOOL 00100100010101 687 01
                match = re.search(r'(\d{14})\s+(\d+)\s+\d+\s*$', line)
                if not match:
                    continue

                station_code_2017 = match.group(1)
                registered_voters = int(match.group(2))

                # Convert 2017 14-digit code to 2022 15-digit format
                # 2017: County(3) + Const(3) + Ward(4) + Center(2) + Station(2) = 14
                # 2022: County(3) + Const(3) + Ward(4) + Center(3) + Station(2) = 15
                # We need to pad the center code from 2 to 3 digits
                county = station_code_2017[0:3]
                const = station_code_2017[3:6]
                ward = station_code_2017[6:10]
                center = station_code_2017[10:12]
                station_num = station_code_2017[12:14]

                # Pad center to 3 digits
                center_padded = center.zfill(3)
                station_code = county + const + ward + center_padded + station_num

                # Extract other fields from the beginning
                parts = line.split()
                if len(parts) < 5:
                    continue

                # Extract polling center name (everything between ward info and station code)
                # Find the station code position in the line
                code_pos = line.find(station_code_2017)
                before_code = line[:code_pos].strip()

                # Parse the beginning parts
                station = {
                    'county_code': parts[0],
                    'county_name': '',  # Will extract from parts
                    'const_code': '',
                    'const_name': '',
                    'ward_code': '',
                    'ward_name': '',
                    'center_code': '',
                    'center_name': before_code.split()[-3:] if len(before_code.split()) >= 3 else '',
                    'station_code': station_code,  # Use converted 15-digit code
                    'station_name': '',  # 2017 doesn't have separate station name
                    'registered_voters': registered_voters,
                    'year': 2017
                }

                # Clean up center name
                if isinstance(station['center_name'], list):
                    station['center_name'] = ' '.join(station['center_name'])

                stations.append(station)
            except (ValueError, IndexError) as e:
                # Skip invalid rows silently
                continue

    print(f"✅ Parsed {len(stations):,} stations from 2017 CSV")
    return stations


def import_to_database(stations, year):
    """Import stations to voter_registration_history table"""
    
    if not DB_CONFIG['password']:
        print("❌ Error: DB_PASSWORD environment variable not set!")
        print("   Run: export DB_PASSWORD='your_password'")
        return False
    
    print(f"\n🔌 Connecting to production database...")
    
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        print(f"✅ Connected to database")
        
        # Check if voter_registration_history table exists
        cur.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'voter_registration_history'
            )
        """)
        
        if not cur.fetchone()[0]:
            print("❌ Error: voter_registration_history table does not exist!")
            print("   Please apply migration 003_add_voter_registration_history.sql first")
            return False
        
        print(f"📊 Importing {len(stations):,} stations for year {year}...")
        
        # Prepare insert query
        insert_query = """
            INSERT INTO voter_registration_history
                (polling_station_id, election_year, registered_voters, data_source, verified, created_at)
            SELECT
                ps.id,
                %s,
                %s,
                %s,
                TRUE,
                NOW()
            FROM polling_stations ps
            WHERE ps.code = %s
            ON CONFLICT (polling_station_id, election_year)
            DO UPDATE SET
                registered_voters = EXCLUDED.registered_voters,
                updated_at = NOW()
        """
        
        # Batch insert
        batch_data = [
            (year, station['registered_voters'], f'IEBC {year} CSV Import', station['station_code'])
            for station in stations
        ]

        execute_batch(cur, insert_query, batch_data, page_size=1000)
        
        # Get statistics
        cur.execute("""
            SELECT COUNT(*) 
            FROM voter_registration_history 
            WHERE election_year = %s
        """, (year,))
        
        total_imported = cur.fetchone()[0]
        
        conn.commit()
        
        print(f"✅ Successfully imported {total_imported:,} records for {year}")
        
        # Show aggregated statistics
        cur.execute("""
            SELECT 
                COUNT(DISTINCT polling_station_id) as stations,
                SUM(registered_voters) as total_voters
            FROM voter_registration_history
            WHERE election_year = %s
        """, (year,))
        
        stats = cur.fetchone()
        print(f"📊 Statistics for {year}:")
        print(f"   - Polling Stations: {stats[0]:,}")
        print(f"   - Total Registered Voters: {stats[1]:,}")
        
        cur.close()
        conn.close()
        
        return True
        
    except psycopg2.Error as e:
        print(f"❌ Database error: {e}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def main():
    """Main import function"""

    print("=" * 60)
    print("🇰🇪 KenPoliMarket - Historical Data Import")
    print("=" * 60)
    print()

    # File paths
    csv_2022 = 'data/rov_per_polling_station.csv'
    csv_2017 = 'data/https___iebc.or.ke_docs_Registered-Voters-Per-Polling-Station-For-2017-General-Elections.csv'

    # Check files exist
    if not os.path.exists(csv_2022):
        print(f"❌ Error: {csv_2022} not found!")
        return 1

    has_2017_data = os.path.exists(csv_2017)
    if not has_2017_data:
        print(f"⚠️  Warning: {csv_2017} not found!")
        print(f"   Will only import 2022 data.")
        print()

    # Parse CSVs
    print("📖 Step 1: Parsing CSV files...")
    print("-" * 60)

    stations_2022 = parse_2022_csv(csv_2022)
    stations_2017 = []

    if has_2017_data:
        stations_2017 = parse_2017_csv(csv_2017)

    print()
    print("📊 Summary:")
    print(f"   - 2022: {len(stations_2022):,} stations")
    if has_2017_data:
        print(f"   - 2017: {len(stations_2017):,} stations")
    else:
        print(f"   - 2017: Skipped (file not found)")
    print()

    # Confirm import
    response = input("🤔 Proceed with import to PRODUCTION database? (yes/no): ")
    if response.lower() != 'yes':
        print("❌ Import cancelled")
        return 0

    # Import to database
    print()
    print("📤 Step 2: Importing to database...")
    print("-" * 60)

    success_2022 = import_to_database(stations_2022, 2022)
    success_2017 = True

    if has_2017_data and len(stations_2017) > 0:
        success_2017 = import_to_database(stations_2017, 2017)

    print()
    print("=" * 60)
    if success_2022 and success_2017:
        print("✅ Import completed successfully!")
        print()
        print("🎉 Next steps:")
        print("   1. Visit https://your-app.vercel.app/explorer")
        if has_2017_data:
            print("   2. Click year selector (2017 or 2022)")
        else:
            print("   2. Click year selector (2022)")
        print("   3. View historical voter registration data!")
    else:
        print("❌ Import failed. Please check errors above.")
        return 1
    print("=" * 60)

    return 0


if __name__ == '__main__':
    sys.exit(main())

