"""
Store multi-candidate forecasts in the database

This script:
1. Reads forecasts from CSV
2. Creates/updates candidate records
3. Creates a new forecast run
4. Stores all county-level forecasts
"""

import psycopg2
import pandas as pd
import uuid
from datetime import datetime
import json

# Database connection
DB_CONFIG = {
    'dbname': 'kenpolimarket',
    'user': 'kenpolimarket',
    'password': 'password',
    'host': 'localhost',
    'port': 5433
}


def get_or_create_candidate(cursor, name, party, position='Presidential'):
    """Get existing candidate or create new one"""
    
    # Check if candidate exists
    cursor.execute("""
        SELECT id FROM candidates 
        WHERE name = %s AND party = %s
    """, (name, party))
    
    result = cursor.fetchone()
    
    if result:
        return result[0]
    
    # Create new candidate
    cursor.execute("""
        INSERT INTO candidates (name, party, position)
        VALUES (%s, %s, %s)
        RETURNING id
    """, (name, party, position))
    
    candidate_id = cursor.fetchone()[0]
    print(f"   ✅ Created new candidate: {name} ({party}) - ID: {candidate_id}")
    
    return candidate_id


def get_or_create_election(cursor, year, election_type='Presidential'):
    """Get existing election or create new one"""
    
    # Check if election exists
    cursor.execute("""
        SELECT id FROM elections 
        WHERE year = %s AND election_type = %s
    """, (year, election_type))
    
    result = cursor.fetchone()
    
    if result:
        return result[0]
    
    # Create new election
    election_date = f"{year}-08-09"  # Typical Kenyan election date
    description = f"{year} Presidential Election"
    
    cursor.execute("""
        INSERT INTO elections (year, election_type, election_date, description)
        VALUES (%s, %s, %s, %s)
        RETURNING id
    """, (year, election_type, election_date, description))
    
    election_id = cursor.fetchone()[0]
    print(f"   ✅ Created election: {year} {election_type} - ID: {election_id}")
    
    return election_id


def create_forecast_run(cursor, election_id, model_name, model_version, parameters):
    """Create a new forecast run"""
    
    forecast_run_id = str(uuid.uuid4())
    run_timestamp = datetime.utcnow()
    data_cutoff_date = datetime.utcnow().date()
    
    cursor.execute("""
        INSERT INTO forecast_runs (
            id, election_id, model_name, model_version,
            run_timestamp, parameters, data_cutoff_date, status
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id
    """, (
        forecast_run_id,
        election_id,
        model_name,
        model_version,
        run_timestamp,
        json.dumps(parameters),
        data_cutoff_date,
        'completed'
    ))
    
    return forecast_run_id


def get_county_id(cursor, county_code):
    """Get county ID from county code"""

    # Convert to string if needed
    county_code_str = str(county_code)

    cursor.execute("""
        SELECT id FROM counties WHERE code = %s
    """, (county_code_str,))

    result = cursor.fetchone()

    if result:
        return result[0]
    else:
        raise ValueError(f"County not found: {county_code}")


def store_county_forecasts(cursor, forecast_run_id, forecasts_df, candidate_map):
    """Store all county-level forecasts"""
    
    print(f"\n📊 Storing {len(forecasts_df)} county forecasts...")
    
    stored_count = 0
    
    for _, row in forecasts_df.iterrows():
        # Get county ID
        county_id = get_county_id(cursor, row['county_code'])
        
        # Get candidate ID
        candidate_key = (row['candidate_name'], row['party'])
        candidate_id = candidate_map.get(candidate_key)
        
        if not candidate_id:
            print(f"   ⚠️  Candidate not found: {row['candidate_name']} ({row['party']})")
            continue
        
        # Insert forecast
        cursor.execute("""
            INSERT INTO forecast_county (
                forecast_run_id, county_id, candidate_id,
                predicted_vote_share, lower_bound_90, upper_bound_90,
                predicted_votes, predicted_turnout
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            forecast_run_id,
            county_id,
            candidate_id,
            row['predicted_vote_share'],
            row['lower_bound_90'],
            row['upper_bound_90'],
            row['predicted_votes'],
            row['predicted_turnout']
        ))
        
        stored_count += 1
        
        if stored_count % 50 == 0:
            print(f"   Stored {stored_count}/{len(forecasts_df)} forecasts...")
    
    print(f"   ✅ Stored {stored_count} forecasts")
    
    return stored_count


def main():
    """Main execution"""
    
    print("\n" + "=" * 80)
    print("💾 STORING MULTI-CANDIDATE FORECASTS IN DATABASE")
    print("=" * 80)
    
    # Load forecasts
    forecast_file = '../data/processed/forecasts_2027_multi_candidate.csv'
    
    try:
        forecasts_df = pd.read_csv(forecast_file)
        print(f"\n📂 Loaded {len(forecasts_df)} forecasts from {forecast_file}")
    except FileNotFoundError:
        print(f"\n❌ Forecast file not found: {forecast_file}")
        print("   Run multi_candidate_forecast.py first to generate forecasts")
        return
    
    # Get unique candidates
    candidates = forecasts_df[['candidate_name', 'party']].drop_duplicates()
    print(f"\n👥 Found {len(candidates)} candidates:")
    for _, row in candidates.iterrows():
        print(f"   - {row['candidate_name']} ({row['party']})")
    
    # Get election year
    election_year = int(forecasts_df['election_year'].iloc[0])
    print(f"\n🗳️  Election Year: {election_year}")
    
    try:
        # Connect to database
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        print("\n" + "=" * 80)
        print("STEP 1: Create/Update Candidates")
        print("=" * 80)
        
        # Create or get candidate IDs
        candidate_map = {}
        
        for _, row in candidates.iterrows():
            candidate_id = get_or_create_candidate(
                cursor,
                row['candidate_name'],
                row['party']
            )
            candidate_map[(row['candidate_name'], row['party'])] = candidate_id
        
        conn.commit()
        
        print("\n" + "=" * 80)
        print("STEP 2: Create/Get Election")
        print("=" * 80)
        
        # Create or get election
        election_id = get_or_create_election(cursor, election_year)
        conn.commit()
        
        print("\n" + "=" * 80)
        print("STEP 3: Create Forecast Run")
        print("=" * 80)
        
        # Create forecast run
        model_parameters = {
            'model_type': 'Dirichlet Multi-Candidate',
            'n_samples': 2000,
            'n_candidates': len(candidates),
            'candidates': [
                {'name': name, 'party': party}
                for (name, party) in candidate_map.keys()
            ],
            'prior_type': 'historical_informed',
            'uncertainty_method': '90% credible intervals'
        }
        
        forecast_run_id = create_forecast_run(
            cursor,
            election_id,
            'DirichletMultiCandidate',
            'v1.0',
            model_parameters
        )
        
        print(f"   ✅ Created forecast run: {forecast_run_id}")
        conn.commit()
        
        print("\n" + "=" * 80)
        print("STEP 4: Store County Forecasts")
        print("=" * 80)
        
        # Store forecasts
        stored_count = store_county_forecasts(
            cursor,
            forecast_run_id,
            forecasts_df,
            candidate_map
        )
        
        conn.commit()
        
        print("\n" + "=" * 80)
        print("✅ SUCCESS!")
        print("=" * 80)
        
        print(f"\n📊 Summary:")
        print(f"   - Forecast Run ID: {forecast_run_id}")
        print(f"   - Election: {election_year}")
        print(f"   - Candidates: {len(candidates)}")
        print(f"   - Counties: {forecasts_df['county_code'].nunique()}")
        print(f"   - Total Forecasts: {stored_count}")
        
        # Calculate national summary
        print(f"\n🇰🇪 National Forecast Summary:")
        
        national = forecasts_df.groupby('candidate_name').agg({
            'predicted_votes': 'sum'
        }).sort_values('predicted_votes', ascending=False)
        
        total_votes = national['predicted_votes'].sum()
        
        for idx, (candidate, row) in enumerate(national.iterrows(), 1):
            votes = row['predicted_votes']
            share = (votes / total_votes) * 100
            print(f"   {idx}. {candidate:25s} {share:6.2f}%  ({votes:,} votes)")
        
        cursor.close()
        conn.close()
        
        print("\n" + "=" * 80)
        print("\n🎯 Next Steps:")
        print("   1. Verify forecasts in database:")
        print(f"      curl http://localhost:8001/api/forecasts/latest?election_year={election_year}")
        print("   2. View in frontend:")
        print("      http://localhost:3000/forecasts")
        print("   3. Frontend will automatically display all candidates")
        print("\n")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        if conn:
            conn.rollback()
        raise


if __name__ == "__main__":
    main()

