#!/usr/bin/env python3
"""
Populate Nairobi voter demographics in Render production database
"""

import psycopg2
import sys
import random

# Production database connection details
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

def generate_demographics(total_voters):
    """Generate realistic voter demographics"""
    if total_voters == 0:
        return 0, 0, 0
    
    # Male: 48-52% of voters
    male_voters = int(total_voters * (0.48 + random.random() * 0.04))
    
    # Female: remainder
    female_voters = total_voters - male_voters
    
    # PWD: 2-3% of total
    pwd_voters = int(total_voters * (0.02 + random.random() * 0.01))
    
    return male_voters, female_voters, pwd_voters

def populate_county_demographics(conn, county_id, total_voters):
    """Populate county level demographics"""
    cursor = conn.cursor()
    
    try:
        male, female, pwd = generate_demographics(total_voters)
        
        cursor.execute("""
            INSERT INTO county_voter_demographics (
                county_id, election_year, total_registered_voters,
                male_voters, female_voters, pwd_voters,
                data_source, verified
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (county_id, election_year) 
            DO UPDATE SET
                total_registered_voters = EXCLUDED.total_registered_voters,
                male_voters = EXCLUDED.male_voters,
                female_voters = EXCLUDED.female_voters,
                pwd_voters = EXCLUDED.pwd_voters,
                updated_at = CURRENT_TIMESTAMP;
        """, (county_id, 2022, total_voters, male, female, pwd, 
              'Generated for production', False))
        
        conn.commit()
        print(f"✅ County demographics: Total={total_voters:,}, Male={male:,}, Female={female:,}, PWD={pwd:,}")
        return True
        
    except Exception as e:
        print(f"❌ Error populating county demographics: {e}")
        conn.rollback()
        return False
    finally:
        cursor.close()

def populate_constituency_demographics(conn, county_id):
    """Populate constituency level demographics"""
    cursor = conn.cursor()
    
    try:
        # Get all constituencies in Nairobi
        cursor.execute("""
            SELECT id, name, registered_voters_2022
            FROM constituencies
            WHERE county_id = %s
            AND registered_voters_2022 IS NOT NULL;
        """, (county_id,))
        
        constituencies = cursor.fetchall()
        count = 0
        
        for const_id, name, total_voters in constituencies:
            if total_voters and total_voters > 0:
                male, female, pwd = generate_demographics(total_voters)
                
                cursor.execute("""
                    INSERT INTO constituency_voter_demographics (
                        constituency_id, election_year, total_registered_voters,
                        male_voters, female_voters, pwd_voters,
                        data_source, verified
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (constituency_id, election_year)
                    DO UPDATE SET
                        total_registered_voters = EXCLUDED.total_registered_voters,
                        male_voters = EXCLUDED.male_voters,
                        female_voters = EXCLUDED.female_voters,
                        pwd_voters = EXCLUDED.pwd_voters,
                        updated_at = CURRENT_TIMESTAMP;
                """, (const_id, 2022, total_voters, male, female, pwd,
                      'Generated for production', False))
                
                count += 1
        
        conn.commit()
        print(f"✅ Populated {count} constituencies with demographics")
        return True
        
    except Exception as e:
        print(f"❌ Error populating constituency demographics: {e}")
        conn.rollback()
        return False
    finally:
        cursor.close()

def populate_ward_demographics(conn, county_id):
    """Populate ward level demographics"""
    cursor = conn.cursor()
    
    try:
        # Get all wards in Nairobi
        cursor.execute("""
            SELECT w.id, w.name, w.registered_voters_2022
            FROM wards w
            JOIN constituencies c ON w.constituency_id = c.id
            WHERE c.county_id = %s
            AND w.registered_voters_2022 IS NOT NULL;
        """, (county_id,))
        
        wards = cursor.fetchall()
        count = 0
        
        for ward_id, name, total_voters in wards:
            if total_voters and total_voters > 0:
                male, female, pwd = generate_demographics(total_voters)
                
                cursor.execute("""
                    INSERT INTO ward_voter_demographics (
                        ward_id, election_year, total_registered_voters,
                        male_voters, female_voters, pwd_voters,
                        data_source, verified
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (ward_id, election_year)
                    DO UPDATE SET
                        total_registered_voters = EXCLUDED.total_registered_voters,
                        male_voters = EXCLUDED.male_voters,
                        female_voters = EXCLUDED.female_voters,
                        pwd_voters = EXCLUDED.pwd_voters,
                        updated_at = CURRENT_TIMESTAMP;
                """, (ward_id, 2022, total_voters, male, female, pwd,
                      'Generated for production', False))
                
                count += 1
        
        conn.commit()
        print(f"✅ Populated {count} wards with demographics")
        return True
        
    except Exception as e:
        print(f"❌ Error populating ward demographics: {e}")
        conn.rollback()
        return False
    finally:
        cursor.close()

def populate_polling_station_demographics(conn, county_id):
    """Populate polling station level demographics"""
    cursor = conn.cursor()
    
    try:
        # Get all polling stations in Nairobi
        cursor.execute("""
            SELECT ps.id, ps.name, ps.registered_voters_2022
            FROM polling_stations ps
            JOIN wards w ON ps.ward_id = w.id
            JOIN constituencies c ON w.constituency_id = c.id
            WHERE c.county_id = %s
            AND ps.registered_voters_2022 IS NOT NULL
            AND ps.registered_voters_2022 > 0;
        """, (county_id,))
        
        stations = cursor.fetchall()
        count = 0
        
        for station_id, name, total_voters in stations:
            male, female, pwd = generate_demographics(total_voters)
            
            cursor.execute("""
                INSERT INTO polling_station_voter_demographics (
                    polling_station_id, election_year, total_registered_voters,
                    male_voters, female_voters, pwd_voters,
                    data_source, verified
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (polling_station_id, election_year)
                DO UPDATE SET
                    total_registered_voters = EXCLUDED.total_registered_voters,
                    male_voters = EXCLUDED.male_voters,
                    female_voters = EXCLUDED.female_voters,
                    pwd_voters = EXCLUDED.pwd_voters,
                    updated_at = CURRENT_TIMESTAMP;
            """, (station_id, 2022, total_voters, male, female, pwd,
                  'Generated for production', False))
            
            count += 1
            
            # Commit in batches of 100
            if count % 100 == 0:
                conn.commit()
                print(f"   Progress: {count} polling stations...")
        
        conn.commit()
        print(f"✅ Populated {count} polling stations with demographics")
        return True
        
    except Exception as e:
        print(f"❌ Error populating polling station demographics: {e}")
        conn.rollback()
        return False
    finally:
        cursor.close()

def main():
    print("=" * 60)
    print("🚀 Populate Nairobi Demographics in Production")
    print("=" * 60)

    # Connect to production database
    print("\n🔌 Connecting to Render production database...")
    try:
        conn = psycopg2.connect(**PROD_DB_CONFIG)
        print("✅ Connected successfully!")
    except Exception as e:
        print(f"❌ Failed to connect: {e}")
        sys.exit(1)
    
    try:
        # Get Nairobi county info
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, name, registered_voters_2022
            FROM counties
            WHERE name = 'Nairobi' OR code = '47';
        """)
        
        result = cursor.fetchone()
        cursor.close()
        
        if not result:
            print("❌ Nairobi County not found!")
            sys.exit(1)
        
        county_id, county_name, total_voters = result
        print(f"\n📍 Found {county_name} County (ID: {county_id})")
        print(f"   Total Registered Voters: {total_voters:,}")
        
        # Populate demographics at all levels
        print("\n📊 Populating demographics...")
        
        if not populate_county_demographics(conn, county_id, total_voters):
            sys.exit(1)
        
        if not populate_constituency_demographics(conn, county_id):
            sys.exit(1)
        
        if not populate_ward_demographics(conn, county_id):
            sys.exit(1)
        
        if not populate_polling_station_demographics(conn, county_id):
            sys.exit(1)
        
        print("\n" + "=" * 60)
        print("✅ Nairobi Demographics Population Complete!")
        print("=" * 60)
        
    finally:
        conn.close()
        print("\n🔌 Database connection closed.")

if __name__ == '__main__':
    main()

