#!/usr/bin/env python3
"""Apply database migration to production"""

import psycopg2
import sys

DB_CONFIG = {
    'host': 'dpg-d3ginq7fte5s73c6j060-a.oregon-postgres.render.com',
    'database': 'kenpolimarket',
    'user': 'kenpolimarket',
    'password': 'bC41dQ7drjIr5Fa7iWfxNoPjHLmyEUzV',
    'port': 5432,
    'sslmode': 'require',
    'connect_timeout': 30
}

print("🔌 Connecting to production database...")

try:
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    
    print("✅ Connected successfully!")
    
    # Read migration file
    print("📖 Reading migration file...")
    with open('database/migrations/003_add_voter_registration_history.sql', 'r') as f:
        migration_sql = f.read()
    
    print("🚀 Applying migration...")
    cur.execute(migration_sql)
    conn.commit()
    
    print("✅ Migration applied successfully!")
    
    # Verify tables created
    cur.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name LIKE '%registration_history%'
        ORDER BY table_name
    """)
    
    tables = cur.fetchall()
    print(f"\n📊 Created {len(tables)} tables:")
    for table in tables:
        print(f"   ✅ {table[0]}")
    
    cur.close()
    conn.close()
    
    print("\n🎉 Ready to import data!")
    
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)

