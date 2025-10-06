#!/usr/bin/env python3
"""
Script to apply database migrations to Render PostgreSQL
Usage: python scripts/apply_migration_to_render.py
"""

import os
import sys
import psycopg2
from psycopg2 import sql
from urllib.parse import urlparse

# Colors for terminal output
class Colors:
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    RED = '\033[0;31m'
    NC = '\033[0m'  # No Color

def print_header():
    print(f"{Colors.GREEN}========================================{Colors.NC}")
    print(f"{Colors.GREEN}KenPoliMarket - Render Migration Script{Colors.NC}")
    print(f"{Colors.GREEN}========================================{Colors.NC}")
    print()

def print_success(message):
    print(f"{Colors.GREEN}✓ {message}{Colors.NC}")

def print_warning(message):
    print(f"{Colors.YELLOW}⚠ {message}{Colors.NC}")

def print_error(message):
    print(f"{Colors.RED}✗ {message}{Colors.NC}")

def print_info(message):
    print(f"{Colors.YELLOW}{message}{Colors.NC}")

def get_database_url():
    """Get database URL from environment or user input"""
    database_url = os.environ.get('RENDER_DATABASE_URL')
    
    if not database_url:
        print_info("Please enter your Render Database URL:")
        print()
        print("To get your Render DATABASE_URL:")
        print("  1. Go to https://dashboard.render.com")
        print("  2. Select your PostgreSQL database")
        print("  3. Copy the 'External Database URL'")
        print()
        database_url = input("Database URL: ").strip()
    
    if not database_url:
        print_error("Database URL is required")
        sys.exit(1)
    
    return database_url

def test_connection(conn_params):
    """Test database connection"""
    print_info("Testing database connection...")
    try:
        conn = psycopg2.connect(**conn_params)
        cursor = conn.cursor()
        cursor.execute("SELECT version();")
        version = cursor.fetchone()[0]
        cursor.close()
        conn.close()
        print_success("Connection successful")
        print(f"  PostgreSQL version: {version.split(',')[0]}")
        return True
    except Exception as e:
        print_error(f"Connection failed: {str(e)}")
        return False

def check_migration_status(conn_params):
    """Check if migration has already been applied"""
    print_info("Checking if migration is needed...")
    try:
        conn = psycopg2.connect(**conn_params)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT COUNT(*) 
            FROM information_schema.columns 
            WHERE table_name='candidates' AND column_name='county_id'
        """)
        
        column_exists = cursor.fetchone()[0] > 0
        cursor.close()
        conn.close()
        
        return column_exists
    except Exception as e:
        print_warning(f"Could not check migration status: {str(e)}")
        return False

def apply_migration(conn_params):
    """Apply the migration"""
    print_info("Applying migration: 001_add_position_specific_fields.sql")
    
    # Read migration file
    migration_file = 'database/migrations/001_add_position_specific_fields.sql'
    
    if not os.path.exists(migration_file):
        print_error(f"Migration file not found: {migration_file}")
        return False
    
    with open(migration_file, 'r') as f:
        migration_sql = f.read()
    
    try:
        conn = psycopg2.connect(**conn_params)
        cursor = conn.cursor()
        
        # Execute migration
        cursor.execute(migration_sql)
        conn.commit()
        
        cursor.close()
        conn.close()
        
        print_success("Migration applied successfully")
        return True
    except Exception as e:
        print_error(f"Migration failed: {str(e)}")
        return False

def verify_migration(conn_params):
    """Verify migration was applied correctly"""
    print_info("Verifying migration...")
    
    try:
        conn = psycopg2.connect(**conn_params)
        cursor = conn.cursor()
        
        # Check columns
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='candidates' 
            AND column_name IN ('county_id', 'constituency_id', 'ward_id')
            ORDER BY column_name
        """)
        
        columns = [row[0] for row in cursor.fetchall()]
        
        if len(columns) == 3:
            print_success("All columns created successfully:")
            for col in columns:
                print(f"  - {col}")
        else:
            print_error(f"Verification failed - only {len(columns)}/3 columns found")
            return False
        
        # Check indexes
        cursor.execute("""
            SELECT indexname 
            FROM pg_indexes 
            WHERE tablename='candidates' 
            AND indexname LIKE 'idx_candidates_%'
        """)
        
        indexes = [row[0] for row in cursor.fetchall()]
        
        if len(indexes) >= 3:
            print_success("Indexes created successfully:")
            for idx in indexes:
                print(f"  - {idx}")
        else:
            print_warning(f"Only {len(indexes)} indexes found")
        
        # Show table structure
        print()
        print_info("Current candidates table structure:")
        cursor.execute("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'candidates'
            ORDER BY ordinal_position
        """)
        
        print(f"\n{'Column':<30} {'Type':<20} {'Nullable':<10}")
        print("-" * 60)
        for row in cursor.fetchall():
            print(f"{row[0]:<30} {row[1]:<20} {row[2]:<10}")
        
        cursor.close()
        conn.close()
        
        return True
    except Exception as e:
        print_error(f"Verification failed: {str(e)}")
        return False

def parse_database_url(database_url):
    """Parse database URL into connection parameters"""
    parsed = urlparse(database_url)
    
    return {
        'host': parsed.hostname,
        'port': parsed.port or 5432,
        'database': parsed.path[1:],  # Remove leading slash
        'user': parsed.username,
        'password': parsed.password
    }

def main():
    print_header()
    
    # Get database URL
    database_url = get_database_url()
    
    # Parse connection parameters
    try:
        conn_params = parse_database_url(database_url)
        print(f"Database: {conn_params['database']} @ {conn_params['host']}:{conn_params['port']}")
        print()
    except Exception as e:
        print_error(f"Invalid database URL: {str(e)}")
        sys.exit(1)
    
    # Test connection
    if not test_connection(conn_params):
        print()
        print("Please check:")
        print("  - Database URL is correct")
        print("  - Database is accessible from your network")
        print("  - psycopg2 is installed (pip install psycopg2-binary)")
        sys.exit(1)
    print()
    
    # Check if migration already applied
    already_applied = check_migration_status(conn_params)
    
    if already_applied:
        print_warning("Migration already applied (county_id column exists)")
        print()
        response = input("Do you want to re-apply the migration? (y/N): ").strip().lower()
        if response != 'y':
            print_success("Skipping migration")
            sys.exit(0)
        print()
    
    # Apply migration
    if not apply_migration(conn_params):
        sys.exit(1)
    print()
    
    # Verify migration
    if not verify_migration(conn_params):
        sys.exit(1)
    print()
    
    # Success message
    print(f"{Colors.GREEN}========================================{Colors.NC}")
    print(f"{Colors.GREEN}Migration completed successfully! ✓{Colors.NC}")
    print(f"{Colors.GREEN}========================================{Colors.NC}")
    print()
    print("Next steps:")
    print("  1. Verify your backend deployment on Render")
    print("  2. Test the candidate creation with position-specific fields")
    print("  3. Check that cascading dropdowns work in the admin panel")
    print()

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print()
        print_warning("Migration cancelled by user")
        sys.exit(1)
    except Exception as e:
        print()
        print_error(f"Unexpected error: {str(e)}")
        sys.exit(1)

