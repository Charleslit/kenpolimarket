#!/usr/bin/env python3
"""
Apply voter demographics migration to Render production database
"""

import psycopg2
import sys
from pathlib import Path

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

def apply_migration(conn):
    """Apply the voter demographics migration"""
    migration_file = Path(__file__).parent.parent / 'database' / 'migrations' / '005_add_voter_demographics.sql'
    
    if not migration_file.exists():
        print(f"❌ Migration file not found: {migration_file}")
        return False
    
    print(f"📄 Reading migration file: {migration_file}")
    with open(migration_file, 'r') as f:
        migration_sql = f.read()
    
    cursor = conn.cursor()
    
    try:
        print("🚀 Applying migration...")
        cursor.execute(migration_sql)
        conn.commit()
        print("✅ Migration applied successfully!")
        return True
    except Exception as e:
        print(f"❌ Error applying migration: {e}")
        conn.rollback()
        return False
    finally:
        cursor.close()

def verify_tables(conn):
    """Verify that the new tables were created"""
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name LIKE '%voter_demographics%'
            ORDER BY table_name;
        """)
        
        tables = cursor.fetchall()
        
        if tables:
            print("\n✅ Voter demographics tables created:")
            for table in tables:
                print(f"   - {table[0]}")
            return True
        else:
            print("\n❌ No voter demographics tables found!")
            return False
            
    finally:
        cursor.close()

def check_nairobi_data(conn):
    """Check if Nairobi county exists"""
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT id, code, name, registered_voters_2022 
            FROM counties 
            WHERE name = 'Nairobi' OR code = '47';
        """)
        
        result = cursor.fetchone()
        
        if result:
            print(f"\n✅ Nairobi County found:")
            print(f"   ID: {result[0]}")
            print(f"   Code: {result[1]}")
            print(f"   Name: {result[2]}")
            print(f"   Registered Voters 2022: {result[3]:,}")
            return result[0]  # Return county ID
        else:
            print("\n❌ Nairobi County not found in database!")
            return None
            
    finally:
        cursor.close()

def main():
    print("=" * 60)
    print("🚀 Apply Voter Demographics Migration to Production")
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
        # Check if tables already exist
        cursor = conn.cursor()
        cursor.execute("""
            SELECT COUNT(*) 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'county_voter_demographics';
        """)
        exists = cursor.fetchone()[0] > 0
        cursor.close()
        
        if exists:
            print("\n⚠️  Voter demographics tables already exist!")
            response = input("Do you want to continue anyway? (yes/no): ")
            if response.lower() != 'yes':
                print("❌ Migration cancelled.")
                return
        
        # Apply migration
        if not apply_migration(conn):
            sys.exit(1)
        
        # Verify tables
        if not verify_tables(conn):
            sys.exit(1)
        
        # Check Nairobi data
        nairobi_id = check_nairobi_data(conn)
        
        if nairobi_id:
            print("\n" + "=" * 60)
            print("✅ Migration Complete!")
            print("=" * 60)
            print("\nNext steps:")
            print("1. Run the Nairobi demographics population script")
            print("2. Test the API endpoints")
            print("3. Verify the frontend displays the data correctly")
        
    finally:
        conn.close()
        print("\n🔌 Database connection closed.")

if __name__ == '__main__':
    main()

