"""
Store forecast results in database
"""
import pandas as pd
import uuid
import json
from datetime import datetime, date
from sqlalchemy import create_engine, text
import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL')
engine = create_engine(DATABASE_URL)

def create_forecast_run(election_year=2027, model_name='SimpleBayesianForecast', model_version='v1.0'):
    """Create forecast run record and return its ID"""
    forecast_run_id = str(uuid.uuid4())

    query = text("""
    INSERT INTO forecast_runs (
        id, election_id, model_name, model_version,
        run_timestamp, data_cutoff_date, status, parameters
    ) VALUES (
        :id, :election_id, :model_name, :model_version,
        :run_timestamp, :data_cutoff_date, :status, :parameters
    )
    """)

    # For 2027 election, we'll create a placeholder election_id
    # In production, this would reference an actual election record
    election_id = 3  # Assuming 1=2017, 2=2022, 3=2027

    parameters = {
        'description': f'Forecast for {election_year} election based on 2022 and 2017 historical data',
        'monte_carlo_samples': 2000,
        'confidence_level': 0.90
    }

    with engine.begin() as conn:
        conn.execute(query, {
            'id': forecast_run_id,
            'election_id': election_id,
            'model_name': model_name,
            'model_version': model_version,
            'run_timestamp': datetime.now(),
            'data_cutoff_date': date.today(),
            'status': 'completed',
            'parameters': json.dumps(parameters)  # Convert to proper JSON string
        })

    return forecast_run_id

def create_2027_candidates():
    """Create candidate records for 2027 election"""
    print("\n👥 Creating 2027 candidate records...")

    # Check if candidates already exist for 2027
    check_query = text("SELECT id, name, party FROM candidates WHERE election_id = 3")

    with engine.begin() as conn:
        existing = conn.execute(check_query).fetchall()

        if existing:
            print(f"   ℹ️  {len(existing)} candidates already exist for 2027")
            return {(row[1], row[2]): row[0] for row in existing}

        # Create candidates based on 2022 data (placeholder for 2027)
        candidates = [
            {'name': 'William Ruto', 'party': 'UDA', 'position': 'Presidential'},
            {'name': 'Raila Odinga', 'party': 'Azimio', 'position': 'Presidential'}
        ]

        candidate_ids = {}

        for candidate in candidates:
            insert_query = text("""
            INSERT INTO candidates (election_id, name, party, position)
            VALUES (:election_id, :name, :party, :position)
            RETURNING id
            """)

            result = conn.execute(insert_query, {
                'election_id': 3,
                'name': candidate['name'],
                'party': candidate['party'],
                'position': candidate['position']
            })

            candidate_id = result.fetchone()[0]
            candidate_ids[(candidate['name'], candidate['party'])] = candidate_id
            print(f"   ✅ Created: {candidate['name']} ({candidate['party']}) - ID: {candidate_id}")

        return candidate_ids

def store_county_forecasts(forecast_run_id, forecasts_df, candidate_ids):
    """Store county-level forecasts"""
    print("\n📊 Storing county-level forecasts...")

    # Get county IDs from database
    county_query = "SELECT id, code FROM counties"
    counties = pd.read_sql(county_query, engine)
    county_id_map = dict(zip(counties['code'].astype(str), counties['id']))

    # Prepare forecast records
    forecast_records = []

    for _, row in forecasts_df.iterrows():
        county_code = str(row['county_code'])
        county_id = county_id_map.get(county_code)

        if county_id is None:
            print(f"   ⚠️  Warning: County code {county_code} not found in database")
            continue

        # Get candidate ID
        candidate_key = (row['candidate_name'], row['party'])
        candidate_id = candidate_ids.get(candidate_key)

        if candidate_id is None:
            print(f"   ⚠️  Warning: Candidate {candidate_key} not found")
            continue

        forecast_records.append({
            'forecast_run_id': forecast_run_id,
            'county_id': county_id,
            'candidate_id': candidate_id,
            'predicted_vote_share': float(row['predicted_vote_share']),
            'lower_bound_90': float(row['vote_share_lower_90']),
            'upper_bound_90': float(row['vote_share_upper_90']),
            'predicted_turnout': float(row['predicted_turnout']),
            'predicted_votes': int(row['predicted_votes'])
        })

    # Insert into database
    if forecast_records:
        forecast_df = pd.DataFrame(forecast_records)
        forecast_df.to_sql('forecast_county', engine, if_exists='append', index=False)
        print(f"   ✅ Stored {len(forecast_records)} county forecasts")
    else:
        print("   ⚠️  No forecast records to store")

    return len(forecast_records)

def create_2027_election_record():
    """Create election record for 2027 if it doesn't exist"""
    check_query = text("SELECT id FROM elections WHERE year = 2027")
    
    with engine.begin() as conn:
        result = conn.execute(check_query).fetchone()
        
        if result is None:
            # Create 2027 election record
            insert_query = text("""
            INSERT INTO elections (id, year, election_type, election_date, description)
            VALUES (:id, :year, :election_type, :election_date, :description)
            """)
            
            conn.execute(insert_query, {
                'id': 3,
                'year': 2027,
                'election_type': 'Presidential',
                'election_date': date(2027, 8, 9),  # Estimated date
                'description': '2027 Presidential Election (Forecast)'
            })
            print("   ✅ Created 2027 election record")
            return 3
        else:
            print("   ℹ️  2027 election record already exists")
            return result[0]

def main():
    print("=" * 60)
    print("💾 STORING FORECASTS IN DATABASE")
    print("=" * 60)

    # Load forecasts
    forecasts_file = Path(__file__).parent.parent / 'data' / 'processed' / 'forecasts_2027.csv'

    if not forecasts_file.exists():
        print(f"\n❌ Error: Forecasts file not found: {forecasts_file}")
        print("   Please run: python models/simple_forecast_model.py first")
        sys.exit(1)

    print(f"\n📂 Loading forecasts from: {forecasts_file}")
    forecasts_df = pd.read_csv(forecasts_file)
    print(f"   ✅ Loaded {len(forecasts_df)} forecast records")

    # Create 2027 election record
    print("\n🗳️  Creating 2027 election record...")
    election_id = create_2027_election_record()

    # Create 2027 candidates
    candidate_ids = create_2027_candidates()

    # Create forecast run
    print("\n🔮 Creating forecast run record...")
    forecast_run_id = create_forecast_run(
        election_year=2027,
        model_name='SimpleBayesianForecast',
        model_version='v1.0'
    )
    print(f"   ✅ Forecast run ID: {forecast_run_id}")

    # Store county forecasts
    num_stored = store_county_forecasts(forecast_run_id, forecasts_df, candidate_ids)

    # Display summary
    print("\n" + "=" * 60)
    print("✅ FORECASTS STORED SUCCESSFULLY!")
    print("=" * 60)
    print(f"\n📊 Summary:")
    print(f"   - Forecast run ID: {forecast_run_id}")
    print(f"   - Election year: 2027")
    print(f"   - County forecasts: {num_stored}")
    print(f"   - Model: SimpleBayesianForecast v1.0")

    print("\n🎯 Next steps:")
    print("   1. Restart backend API to load new data")
    print("   2. View forecasts at: http://localhost:8001/api/forecasts/")
    print("   3. View in dashboard: http://localhost:3000/forecasts")

    return forecast_run_id

if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

