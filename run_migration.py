#!/usr/bin/env python3
import psycopg2
import sys

try:
    print('🔌 Connecting to production database...')
    conn = psycopg2.connect(
        host='dpg-d3ginq7fte5s73c6j060-a.oregon-postgres.render.com',
        database='kenpolimarket',
        user='kenpolimarket',
        password='bC41dQ7drjIr5Fa7iWfxNoPjHLmyEUzV',
        port=5432,
        sslmode='require',
        connect_timeout=30
    )
    
    print('✅ Connected successfully!')
    
    cur = conn.cursor()
    
    # Create main table
    print('📊 Creating voter_registration_history table...')
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
    
    print('✅ Table created!')
    
    # Create indexes
    print('📊 Creating indexes...')
    cur.execute('CREATE INDEX IF NOT EXISTS idx_vrh_station_year ON voter_registration_history(polling_station_id, election_year);')
    cur.execute('CREATE INDEX IF NOT EXISTS idx_vrh_year ON voter_registration_history(election_year);')
    
    print('✅ Indexes created!')
    
    # Migrate existing 2022 data
    print('📊 Migrating existing 2022 data...')
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
    
    print(f'✅ Migrated {count:,} records for 2022!')
    
    cur.close()
    conn.close()
    
    print('')
    print('🎉 Migration complete! Ready to import historical data!')
    sys.exit(0)
    
except Exception as e:
    print(f'❌ Error: {e}')
    import traceback
    traceback.print_exc()
    sys.exit(1)

