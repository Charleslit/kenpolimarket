#!/usr/bin/env python3
"""Check for database locks"""
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
    
    # Check for locks
    print("📊 Checking for locks...")
    cur.execute("""
        SELECT 
            pid,
            usename,
            application_name,
            state,
            query,
            wait_event_type,
            wait_event
        FROM pg_stat_activity
        WHERE datname = 'kenpolimarket'
        AND state != 'idle'
        ORDER BY query_start;
    """)
    
    activities = cur.fetchall()
    
    if activities:
        print(f"Found {len(activities)} active connections:")
        for act in activities:
            print(f"  PID: {act[0]}, User: {act[1]}, App: {act[2]}, State: {act[3]}")
            print(f"  Query: {act[4][:100]}...")
            print(f"  Wait: {act[5]} / {act[6]}")
            print("")
    else:
        print("No active connections found")
    
    print("")
    
    # Check for table locks
    print("📊 Checking for table locks...")
    cur.execute("""
        SELECT 
            l.locktype,
            l.relation::regclass,
            l.mode,
            l.granted,
            a.usename,
            a.query,
            a.pid
        FROM pg_locks l
        JOIN pg_stat_activity a ON l.pid = a.pid
        WHERE a.datname = 'kenpolimarket'
        AND l.relation IS NOT NULL
        ORDER BY l.granted, l.pid;
    """)
    
    locks = cur.fetchall()
    
    if locks:
        print(f"Found {len(locks)} locks:")
        for lock in locks:
            print(f"  Type: {lock[0]}, Table: {lock[1]}, Mode: {lock[2]}, Granted: {lock[3]}")
            print(f"  User: {lock[4]}, PID: {lock[6]}")
            print(f"  Query: {lock[5][:100] if lock[5] else 'N/A'}...")
            print("")
    else:
        print("No table locks found")
    
    cur.close()
    conn.close()
    
    sys.exit(0)
    
except Exception as e:
    print(f'❌ Error: {e}')
    import traceback
    traceback.print_exc()
    sys.exit(1)

