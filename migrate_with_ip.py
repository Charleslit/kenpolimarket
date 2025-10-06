#!/usr/bin/env python3
"""Migration script using IP address to avoid DNS issues"""
import psycopg2
import sys
import os
from datetime import datetime

# Log file
LOG_FILE = "migration_log.txt"

def log(message):
    """Log to both console and file"""
    print(message, flush=True)
    with open(LOG_FILE, 'a') as f:
        f.write(f"{datetime.now()}: {message}\n")

try:
    log("=" * 60)
    log("🔌 Connecting to Render database (using IP)...")
    
    # Using IP address to avoid DNS issues
    # 35.227.164.209 = dpg-d3ginq7fte5s73c6j060-a.oregon-postgres.render.com
    conn = psycopg2.connect(
        host='35.227.164.209',
        database='kenpolimarket',
        user='kenpolimarket',
        password='bC41dQ7drjIr5Fa7iWfxNoPjHLmyEUzV',
        port=5432,
        sslmode='require',
        connect_timeout=30
    )
    
    log("✅ Connected successfully!")
    log("")
    
    cur = conn.cursor()
    
    # Check if table exists
    log("📊 Checking if voter_registration_history table exists...")
    cur.execute("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'voter_registration_history'
        )
    """)
    
    exists = cur.fetchone()[0]
    
    if exists:
        log("✅ Table already exists!")
        cur.execute("SELECT COUNT(*) FROM voter_registration_history")
        count = cur.fetchone()[0]
        log(f"   Current records: {count:,}")
    else:
        log("📊 Creating voter_registration_history table...")
        cur.execute('''
            CREATE TABLE IF NOT EXISTS voter_registration_history (
                id SERIAL PRIMARY KEY,
                polling_station_id INTEGER REFERENCES polling_stations(id) ON DELETE CASCADE,
                election_year INTEGER NOT NULL,
                registered_voters INTEGER NOT NULL DEFAULT 0,
                actual_turnout INTEGER,
                data_source VARCHAR(255),
                verified BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT unique_station_year UNIQUE(polling_station_id, election_year),
                CONSTRAINT valid_year CHECK (election_year >= 2013 AND election_year <= 2030)
            );
        ''')
        
        log("✅ Table created!")
        log("")
        
        # Create indexes
        log("📊 Creating indexes...")
        cur.execute('CREATE INDEX IF NOT EXISTS idx_vrh_station_year ON voter_registration_history(polling_station_id, election_year);')
        cur.execute('CREATE INDEX IF NOT EXISTS idx_vrh_year ON voter_registration_history(election_year);')
        
        log("✅ Indexes created!")
        
        conn.commit()
    
    # Migrate existing 2022 data
    log("")
    log("📊 Migrating existing 2022 data from polling_stations...")
    cur.execute('''
        INSERT INTO voter_registration_history 
            (polling_station_id, election_year, registered_voters, data_source, verified)
        SELECT id, 2022, registered_voters_2022, 'Migration from polling_stations table', TRUE
        FROM polling_stations
        WHERE registered_voters_2022 IS NOT NULL AND registered_voters_2022 > 0
        ON CONFLICT (polling_station_id, election_year) DO NOTHING;
    ''')
    
    conn.commit()
    
    cur.execute('SELECT COUNT(*) FROM voter_registration_history WHERE election_year = 2022')
    count = cur.fetchone()[0]
    
    log(f'✅ Migrated {count:,} records for 2022!')
    log("")
    
    cur.close()
    conn.close()
    
    log("🎉 Migration complete!")
    log("=" * 60)
    sys.exit(0)
    
except Exception as e:
    log(f'❌ Error: {e}')
    import traceback
    error_details = traceback.format_exc()
    log(error_details)
    sys.exit(1)

