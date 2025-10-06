#!/usr/bin/env python3
"""Terminate blocking database processes"""
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
    
    # Find blocking processes
    print("📊 Finding blocking processes...")
    cur.execute("""
        SELECT 
            pid,
            usename,
            application_name,
            state,
            query_start,
            LEFT(query, 100) as query_preview
        FROM pg_stat_activity
        WHERE datname = 'kenpolimarket'
        AND state != 'idle'
        AND pid != pg_backend_pid()
        ORDER BY query_start;
    """)
    
    processes = cur.fetchall()
    
    if not processes:
        print("No blocking processes found!")
        sys.exit(0)
    
    print(f"Found {len(processes)} active processes:")
    print("")
    
    for i, proc in enumerate(processes, 1):
        print(f"{i}. PID: {proc[0]}")
        print(f"   User: {proc[1]}")
        print(f"   State: {proc[3]}")
        print(f"   Started: {proc[4]}")
        print(f"   Query: {proc[5]}...")
        print("")
    
    # Terminate all blocking processes
    print("⚠️  Terminating all blocking processes...")
    print("")
    
    terminated = 0
    for proc in processes:
        pid = proc[0]
        try:
            cur.execute(f"SELECT pg_terminate_backend({pid});")
            result = cur.fetchone()[0]
            if result:
                print(f"✅ Terminated PID {pid}")
                terminated += 1
            else:
                print(f"❌ Failed to terminate PID {pid}")
        except Exception as e:
            print(f"❌ Error terminating PID {pid}: {e}")
    
    conn.commit()
    
    print("")
    print(f"🎉 Terminated {terminated} processes!")
    
    cur.close()
    conn.close()
    
    sys.exit(0)
    
except Exception as e:
    print(f'❌ Error: {e}')
    import traceback
    traceback.print_exc()
    sys.exit(1)

