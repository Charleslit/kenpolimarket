#!/usr/bin/env python3
"""Check database status"""
import psycopg2
import sys

try:
    print("🔌 Connecting to Render database...")
    
    conn = psycopg2.connect(
        host='35.227.164.209',
        database='kenpolimarket',
        user='kenpolimarket',
        password='bC41dQ7drjIr5Fa7iWfxNoPjHLmyEUzV',
        port=5432,
        sslmode='require',
        connect_timeout=10
    )
    
    print("✅ Connected!")
    print("")
    
    cur = conn.cursor()
    
    # List all tables
    print("📊 Tables in database:")
    cur.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
    """)
    
    tables = cur.fetchall()
    for table in tables:
        print(f"   - {table[0]}")
    
    print("")
    
    # Check if voter_registration_history exists
    cur.execute("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'voter_registration_history'
        )
    """)
    
    exists = cur.fetchone()[0]
    
    if exists:
        print("✅ voter_registration_history table EXISTS")
        cur.execute("SELECT COUNT(*) FROM voter_registration_history")
        count = cur.fetchone()[0]
        print(f"   Records: {count:,}")
    else:
        print("❌ voter_registration_history table DOES NOT EXIST")
    
    print("")
    
    # Check polling_stations table
    cur.execute("SELECT COUNT(*) FROM polling_stations WHERE registered_voters_2022 IS NOT NULL AND registered_voters_2022 > 0")
    ps_count = cur.fetchone()[0]
    print(f"📊 Polling stations with 2022 data: {ps_count:,}")
    
    cur.close()
    conn.close()
    
    sys.exit(0)
    
except Exception as e:
    print(f'❌ Error: {e}')
    import traceback
    traceback.print_exc()
    sys.exit(1)

