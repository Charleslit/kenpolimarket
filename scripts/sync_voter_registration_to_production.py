#!/usr/bin/env python3
"""
Sync voter registration data from local database to production.
This ensures production has the correct registered_voters_2022 counts.
"""

import psycopg2
import sys

# Local database configuration
LOCAL_DB_CONFIG = {
    'host': 'localhost',
    'database': 'kenpolimarket',
    'user': 'kenpolimarket',
    'password': 'password',
    'port': 5433
}

# Production database configuration
PROD_DB_CONFIG = {
    'host': '35.227.164.209',
    'database': 'kenpolimarket',
    'user': 'kenpolimarket',
    'password': 'bC41dQ7drjIr5Fa7iWfxNoPjHLmyEUzV',
    'port': 5432,
    'sslmode': 'require',
    'connect_timeout': 30
}

def get_local_data(level='all'):
    """Get voter registration data from local database"""
    print(f"\n📥 Fetching data from local database...")
    
    try:
        conn = psycopg2.connect(**LOCAL_DB_CONFIG)
        cursor = conn.cursor()
        
        data = {}
        
        # Get counties
        if level in ['all', 'counties']:
            cursor.execute("""
                SELECT id, code, name, registered_voters_2022
                FROM counties
                WHERE registered_voters_2022 IS NOT NULL
                ORDER BY code;
            """)
            data['counties'] = cursor.fetchall()
            print(f"   ✅ Found {len(data['counties'])} counties with voter data")
        
        # Get constituencies
        if level in ['all', 'constituencies']:
            cursor.execute("""
                SELECT c.id, c.code, c.name, c.registered_voters_2022, co.code as county_code
                FROM constituencies c
                JOIN counties co ON c.county_id = co.id
                WHERE c.registered_voters_2022 IS NOT NULL
                ORDER BY c.code;
            """)
            data['constituencies'] = cursor.fetchall()
            print(f"   ✅ Found {len(data['constituencies'])} constituencies with voter data")
        
        # Get wards
        if level in ['all', 'wards']:
            cursor.execute("""
                SELECT w.id, w.code, w.name, w.registered_voters_2022, c.code as constituency_code
                FROM wards w
                JOIN constituencies c ON w.constituency_id = c.id
                WHERE w.registered_voters_2022 IS NOT NULL
                ORDER BY w.code;
            """)
            data['wards'] = cursor.fetchall()
            print(f"   ✅ Found {len(data['wards'])} wards with voter data")
        
        # Get polling stations
        if level in ['all', 'polling_stations']:
            cursor.execute("""
                SELECT ps.id, ps.code, ps.name, ps.registered_voters_2022, w.code as ward_code
                FROM polling_stations ps
                JOIN wards w ON ps.ward_id = w.id
                WHERE ps.registered_voters_2022 IS NOT NULL
                AND ps.registered_voters_2022 > 0
                ORDER BY ps.code;
            """)
            data['polling_stations'] = cursor.fetchall()
            print(f"   ✅ Found {len(data['polling_stations'])} polling stations with voter data")
        
        cursor.close()
        conn.close()
        
        return data
        
    except Exception as e:
        print(f"❌ Error fetching local data: {e}")
        return None

def update_production_data(data):
    """Update production database with local data"""
    print(f"\n📤 Updating production database...")
    
    try:
        conn = psycopg2.connect(**PROD_DB_CONFIG)
        cursor = conn.cursor()
        
        # Update counties
        if 'counties' in data:
            print(f"\n🏛️  Updating counties...")
            updated = 0
            for county_id, code, name, voters in data['counties']:
                cursor.execute("""
                    UPDATE counties
                    SET registered_voters_2022 = %s
                    WHERE code = %s;
                """, (voters, code))
                if cursor.rowcount > 0:
                    updated += 1
            
            conn.commit()
            print(f"   ✅ Updated {updated} counties")
        
        # Update constituencies
        if 'constituencies' in data:
            print(f"\n🏢 Updating constituencies...")
            updated = 0
            for const_id, code, name, voters, county_code in data['constituencies']:
                cursor.execute("""
                    UPDATE constituencies
                    SET registered_voters_2022 = %s
                    WHERE code = %s;
                """, (voters, code))
                if cursor.rowcount > 0:
                    updated += 1
            
            conn.commit()
            print(f"   ✅ Updated {updated} constituencies")
        
        # Update wards
        if 'wards' in data:
            print(f"\n🏘️  Updating wards...")
            updated = 0
            for ward_id, code, name, voters, const_code in data['wards']:
                cursor.execute("""
                    UPDATE wards
                    SET registered_voters_2022 = %s
                    WHERE code = %s;
                """, (voters, code))
                if cursor.rowcount > 0:
                    updated += 1
            
            conn.commit()
            print(f"   ✅ Updated {updated} wards")
        
        # Update polling stations
        if 'polling_stations' in data:
            print(f"\n🗳️  Updating polling stations...")
            updated = 0
            batch_size = 100
            
            for i, (ps_id, code, name, voters, ward_code) in enumerate(data['polling_stations']):
                cursor.execute("""
                    UPDATE polling_stations
                    SET registered_voters_2022 = %s
                    WHERE code = %s;
                """, (voters, code))
                if cursor.rowcount > 0:
                    updated += 1
                
                # Commit in batches
                if (i + 1) % batch_size == 0:
                    conn.commit()
                    print(f"   Progress: {i + 1}/{len(data['polling_stations'])} polling stations...")
            
            conn.commit()
            print(f"   ✅ Updated {updated} polling stations")
        
        cursor.close()
        conn.close()
        
        return True
        
    except Exception as e:
        print(f"❌ Error updating production: {e}")
        return False

def verify_sync(level='constituencies'):
    """Verify the sync by comparing a sample"""
    print(f"\n🔍 Verifying sync for {level}...")
    
    try:
        # Connect to both databases
        local_conn = psycopg2.connect(**LOCAL_DB_CONFIG)
        prod_conn = psycopg2.connect(**PROD_DB_CONFIG)
        
        local_cursor = local_conn.cursor()
        prod_cursor = prod_conn.cursor()
        
        if level == 'constituencies':
            # Check Nairobi constituencies
            local_cursor.execute("""
                SELECT c.code, c.name, c.registered_voters_2022
                FROM constituencies c
                JOIN counties co ON c.county_id = co.id
                WHERE co.name = 'Nairobi'
                ORDER BY c.code;
            """)
            local_data = local_cursor.fetchall()
            
            prod_cursor.execute("""
                SELECT c.code, c.name, c.registered_voters_2022
                FROM constituencies c
                JOIN counties co ON c.county_id = co.id
                WHERE co.name = 'Nairobi'
                ORDER BY c.code;
            """)
            prod_data = prod_cursor.fetchall()
            
            print(f"\n📊 Nairobi Constituencies Comparison:")
            print(f"{'Code':<6} {'Name':<25} {'Local Voters':<15} {'Prod Voters':<15} {'Status'}")
            print("-" * 80)
            
            # Create dict for easy comparison
            prod_dict = {row[0]: row for row in prod_data}
            
            mismatches = 0
            for code, name, local_voters in local_data:
                if code in prod_dict:
                    prod_name, prod_voters = prod_dict[code][1], prod_dict[code][2]
                    status = "✅" if local_voters == prod_voters else "❌"
                    if local_voters != prod_voters:
                        mismatches += 1
                    print(f"{code:<6} {name:<25} {local_voters or 0:<15,} {prod_voters or 0:<15,} {status}")
                else:
                    print(f"{code:<6} {name:<25} {local_voters or 0:<15,} {'NOT FOUND':<15} ❌")
                    mismatches += 1
            
            if mismatches == 0:
                print(f"\n✅ All constituencies in sync!")
            else:
                print(f"\n⚠️  {mismatches} constituencies have mismatches")
        
        local_cursor.close()
        prod_cursor.close()
        local_conn.close()
        prod_conn.close()
        
        return mismatches == 0
        
    except Exception as e:
        print(f"❌ Error verifying sync: {e}")
        return False

def main():
    print("=" * 80)
    print("🔄 Sync Voter Registration Data: Local → Production")
    print("=" * 80)
    
    # Ask user what to sync
    print("\nWhat would you like to sync?")
    print("1. Counties only")
    print("2. Constituencies only")
    print("3. Wards only")
    print("4. Polling stations only")
    print("5. All levels (recommended)")
    
    choice = input("\nEnter choice (1-5) [default: 5]: ").strip() or "5"
    
    level_map = {
        '1': 'counties',
        '2': 'constituencies',
        '3': 'wards',
        '4': 'polling_stations',
        '5': 'all'
    }
    
    level = level_map.get(choice, 'all')
    
    print(f"\n📋 Selected: {level}")
    
    # Confirm
    response = input("\n⚠️  This will update production database. Continue? (yes/no): ")
    if response.lower() != 'yes':
        print("❌ Sync cancelled.")
        return
    
    # Get local data
    data = get_local_data(level)
    if not data:
        print("❌ Failed to fetch local data")
        sys.exit(1)
    
    # Update production
    if not update_production_data(data):
        print("❌ Failed to update production")
        sys.exit(1)
    
    # Verify sync
    if level in ['all', 'constituencies']:
        verify_sync('constituencies')
    
    print("\n" + "=" * 80)
    print("✅ Sync Complete!")
    print("=" * 80)
    print("\nNext steps:")
    print("1. Re-run the demographics population script")
    print("2. Verify the data in production")
    print("3. Test the API endpoints")

if __name__ == '__main__':
    main()

