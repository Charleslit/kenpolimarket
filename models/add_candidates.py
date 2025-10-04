"""
Add new presidential candidates to the database for 2027 election
"""

import psycopg2
from datetime import datetime

# Database connection
DB_CONFIG = {
    'dbname': 'kenpolimarket',
    'user': 'kenpolimarket_user',
    'password': 'secure_password_2024',
    'host': 'localhost',
    'port': 5433
}

def add_candidate(cursor, name, party, position='Presidential'):
    """Add a new candidate to the database"""
    
    # Check if candidate already exists
    cursor.execute("""
        SELECT id FROM candidates 
        WHERE name = %s AND party = %s
    """, (name, party))
    
    existing = cursor.fetchone()
    if existing:
        print(f"✓ Candidate already exists: {name} ({party}) - ID: {existing[0]}")
        return existing[0]
    
    # Insert new candidate
    cursor.execute("""
        INSERT INTO candidates (name, party, position)
        VALUES (%s, %s, %s)
        RETURNING id
    """, (name, party, position))
    
    candidate_id = cursor.fetchone()[0]
    print(f"✅ Added new candidate: {name} ({party}) - ID: {candidate_id}")
    return candidate_id


def main():
    """Add new presidential candidates for 2027"""
    
    # List of new candidates to add
    new_candidates = [
        {'name': 'Kalonzo Musyoka', 'party': 'Wiper', 'position': 'Presidential'},
        {'name': 'Musalia Mudavadi', 'party': 'ANC', 'position': 'Presidential'},
        {'name': 'Martha Karua', 'party': 'NARC-Kenya', 'position': 'Presidential'},
        {'name': 'George Wajackoyah', 'party': 'Roots Party', 'position': 'Presidential'},
        # Add more candidates as needed
    ]
    
    try:
        # Connect to database
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        print("\n🗳️  ADDING NEW PRESIDENTIAL CANDIDATES FOR 2027\n")
        print("=" * 60)
        
        candidate_ids = {}
        
        # Add each candidate
        for candidate in new_candidates:
            candidate_id = add_candidate(
                cursor,
                candidate['name'],
                candidate['party'],
                candidate['position']
            )
            candidate_ids[candidate['name']] = candidate_id
        
        # Commit changes
        conn.commit()
        
        print("\n" + "=" * 60)
        print(f"\n✅ Successfully added {len(new_candidates)} candidates!")
        print("\n📊 Candidate IDs:")
        for name, cid in candidate_ids.items():
            print(f"   - {name}: {cid}")
        
        # Show all candidates for 2027
        cursor.execute("""
            SELECT id, name, party, position
            FROM candidates
            ORDER BY id DESC
            LIMIT 10
        """)
        
        print("\n📋 Recent Candidates in Database:")
        for row in cursor.fetchall():
            print(f"   ID {row[0]}: {row[1]} ({row[2]}) - {row[3]}")
        
        cursor.close()
        conn.close()
        
        print("\n" + "=" * 60)
        print("\n🎯 Next Steps:")
        print("   1. Update forecasting model to include new candidates")
        print("   2. Generate forecasts for new candidates")
        print("   3. Store forecasts in database")
        print("   4. Frontend will automatically display new candidates")
        print("\n")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        if conn:
            conn.rollback()
        raise


if __name__ == "__main__":
    main()

