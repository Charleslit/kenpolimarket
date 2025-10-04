"""
Prepare training data from database for Bayesian model
"""
import pandas as pd
import psycopg2
from sqlalchemy import create_engine
import os
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL')
engine = create_engine(DATABASE_URL)

def fetch_county_data():
    """Fetch county-level features"""
    query = """
    SELECT 
        c.id as county_id,
        c.code,
        c.name,
        c.population_2019,
        c.registered_voters_2022,
        cd.urban_population,
        cd.rural_population,
        cd.total_population,
        (cd.urban_population::float / NULLIF(cd.total_population, 0)) as urban_percentage
    FROM counties c
    LEFT JOIN county_demographics cd ON c.id = cd.county_id
    WHERE cd.census_year = 2019
    ORDER BY c.code::integer
    """
    return pd.read_sql(query, engine)

def fetch_ethnicity_data():
    """Fetch county-level ethnicity aggregates (privacy-preserving)"""
    query = """
    SELECT 
        county_id,
        ethnicity_group,
        population_count,
        percentage as population_share
    FROM county_ethnicity_aggregate
    WHERE census_year = 2019
    AND population_count >= 10  -- Privacy threshold
    ORDER BY county_id, ethnicity_group
    """
    return pd.read_sql(query, engine)

def fetch_historical_results():
    """Fetch historical election results"""
    query = """
    SELECT 
        erc.election_id,
        e.year as election_year,
        erc.county_id,
        c_county.code as county_code,
        c_county.name as county_name,
        erc.candidate_id,
        c.name as candidate_name,
        c.party,
        erc.votes,
        erc.total_votes_cast,
        erc.registered_voters,
        erc.turnout_percentage as turnout
    FROM election_results_county erc
    JOIN elections e ON erc.election_id = e.id
    JOIN candidates c ON erc.candidate_id = c.id
    JOIN counties c_county ON erc.county_id = c_county.id
    ORDER BY e.year DESC, erc.county_id, erc.candidate_id
    """
    return pd.read_sql(query, engine)

def prepare_training_data():
    """Prepare all data for model training"""
    print("=" * 60)
    print("📊 PREPARING TRAINING DATA FOR BAYESIAN MODEL")
    print("=" * 60)
    
    print("\n1️⃣  Fetching county data...")
    county_data = fetch_county_data()
    print(f"   ✅ Loaded {len(county_data)} counties")
    print(f"   📍 Sample: {county_data['name'].head(3).tolist()}")
    
    print("\n2️⃣  Fetching ethnicity data...")
    ethnicity_data = fetch_ethnicity_data()
    print(f"   ✅ Loaded {len(ethnicity_data)} ethnicity aggregates")
    print(f"   🔒 Privacy threshold: ≥10 individuals per aggregate")
    
    print("\n3️⃣  Fetching historical results...")
    historical_results = fetch_historical_results()
    print(f"   ✅ Loaded {len(historical_results)} historical results")
    
    # Display summary statistics
    print("\n" + "=" * 60)
    print("📈 DATA SUMMARY")
    print("=" * 60)
    
    print(f"\n🗳️  Elections:")
    for year in sorted(historical_results['election_year'].unique(), reverse=True):
        count = len(historical_results[historical_results['election_year'] == year])
        print(f"   - {year}: {count} results")
    
    print(f"\n👥 Candidates:")
    candidates = historical_results.groupby(['candidate_name', 'party']).size().reset_index(name='counties')
    for _, row in candidates.iterrows():
        print(f"   - {row['candidate_name']} ({row['party']}): {row['counties']} counties")
    
    print(f"\n📊 Turnout Statistics:")
    print(f"   - Mean: {historical_results['turnout'].mean():.1f}%")
    print(f"   - Min:  {historical_results['turnout'].min():.1f}%")
    print(f"   - Max:  {historical_results['turnout'].max():.1f}%")
    
    # Create output directory
    output_dir = Path(__file__).parent.parent / 'data' / 'processed'
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Save to CSV for model training
    county_file = output_dir / 'model_county_data.csv'
    ethnicity_file = output_dir / 'model_ethnicity_data.csv'
    historical_file = output_dir / 'model_historical_results.csv'
    
    county_data.to_csv(county_file, index=False)
    ethnicity_data.to_csv(ethnicity_file, index=False)
    historical_results.to_csv(historical_file, index=False)
    
    print("\n" + "=" * 60)
    print("💾 FILES SAVED")
    print("=" * 60)
    print(f"   ✅ {county_file}")
    print(f"   ✅ {ethnicity_file}")
    print(f"   ✅ {historical_file}")
    
    print("\n" + "=" * 60)
    print("✅ DATA PREPARATION COMPLETE!")
    print("=" * 60)
    print(f"\n📁 Total files: 3")
    print(f"📊 Total records:")
    print(f"   - Counties: {len(county_data)}")
    print(f"   - Ethnicity aggregates: {len(ethnicity_data)}")
    print(f"   - Historical results: {len(historical_results)}")
    
    return county_data, ethnicity_data, historical_results

if __name__ == '__main__':
    try:
        prepare_training_data()
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

