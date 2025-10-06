#!/usr/bin/env python3
"""
Import historical voter registration data to production database.

This script imports CSV files directly to the Render PostgreSQL database
for the 2017 and 2022 election years.
"""

import os
import sys
import csv
import psycopg2
from psycopg2.extras import execute_batch
from datetime import datetime

# Production database connection
DB_CONFIG = {
    'host': 'dpg-d3ginq7fte5s73c6j060-a.oregon-postgres.render.com',
    'database': 'kenpolimarket',
    'user': 'kenpolimarket',
    'password': os.environ.get('DB_PASSWORD', ''),  # Set via environment variable
    'port': 5432,
    'sslmode': 'require',
    'connect_timeout': 30
}

def parse_2022_csv(filepath):
    """Parse 2022 CSV format"""
    print(f"📖 Reading 2022 CSV: {filepath}")
    
    stations = []
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        
        # Skip header rows (first 5 lines)
        for _ in range(5):
            next(reader)
        
        for row in reader:
            if len(row) < 10 or not row[0].strip():
                continue
            
            try:
                station = {
                    'county_code': row[0].strip(),
                    'county_name': row[1].strip(),
                    'const_code': row[2].strip(),
                    'const_name': row[3].strip(),
                    'ward_code': row[4].strip(),
                    'ward_name': row[5].strip(),
                    'center_code': row[6].strip(),
                    'center_name': row[7].strip(),
                    'station_code': row[8].strip(),
                    'station_name': row[9].strip(),
                    'registered_voters': int(row[10].strip()) if row[10].strip() else 0,
                    'year': 2022
                }
                stations.append(station)
            except (ValueError, IndexError) as e:
                print(f"⚠️  Skipping row: {e}")
                continue
    
    print(f"✅ Parsed {len(stations):,} stations from 2022 CSV")
    return stations


def parse_2017_csv(filepath):
    """Parse 2017 CSV format"""
    print(f"📖 Reading 2017 CSV: {filepath}")
    
    stations = []
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        
        # Skip header rows (first 5 lines)
        for _ in range(5):
            next(reader)
        
        for row in reader:
            if len(row) < 9 or not row[0].strip():
                continue
            
            try:
                station = {
                    'county_code': row[0].strip(),
                    'county_name': row[1].strip(),
                    'const_code': row[2].strip(),
                    'const_name': row[3].strip(),
                    'ward_code': row[4].strip(),
                    'ward_name': row[5].strip(),
                    'center_code': row[6].strip(),
                    'center_name': row[7].strip(),
                    'station_code': row[8].strip(),
                    'registered_voters': int(row[9].strip()) if len(row) > 9 and row[9].strip() else 0,
                    'year': 2017
                }
                stations.append(station)
            except (ValueError, IndexError) as e:
                print(f"⚠️  Skipping row: {e}")
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
    
    if not os.path.exists(csv_2017):
        print(f"❌ Error: {csv_2017} not found!")
        return 1
    
    # Parse CSVs
    print("📖 Step 1: Parsing CSV files...")
    print("-" * 60)
    
    stations_2022 = parse_2022_csv(csv_2022)
    stations_2017 = parse_2017_csv(csv_2017)
    
    print()
    print("📊 Summary:")
    print(f"   - 2022: {len(stations_2022):,} stations")
    print(f"   - 2017: {len(stations_2017):,} stations")
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
    success_2017 = import_to_database(stations_2017, 2017)
    
    print()
    print("=" * 60)
    if success_2022 and success_2017:
        print("✅ Import completed successfully!")
        print()
        print("🎉 Next steps:")
        print("   1. Visit https://your-app.vercel.app/explorer")
        print("   2. Click year selector (2017 or 2022)")
        print("   3. View historical voter registration data!")
    else:
        print("❌ Import failed. Please check errors above.")
        return 1
    print("=" * 60)
    
    return 0


if __name__ == '__main__':
    sys.exit(main())

