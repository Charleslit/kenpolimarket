#!/usr/bin/env python3
"""
Load Sample Data into KenPoliMarket Database
Loads the generated sample data into PostgreSQL
"""

import sys
import os
from pathlib import Path
import pandas as pd
from sqlalchemy import create_engine, text
from datetime import datetime

# Get database URL from environment or use default
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://kenpolimarket:password@localhost:5433/kenpolimarket')


def get_db_engine():
    """Create database engine"""
    return create_engine(DATABASE_URL)


def load_counties(engine):
    """Load county data"""
    print("📊 Loading counties...")

    csv_path = Path("data/processed/counties.csv")
    if not csv_path.exists():
        print(f"❌ File not found: {csv_path}")
        return 0

    df = pd.read_csv(csv_path)

    with engine.connect() as conn:
        # Clear existing data
        conn.execute(text("DELETE FROM county_demographics"))
        conn.execute(text("DELETE FROM counties"))
        conn.commit()

        # Insert counties
        for _, row in df.iterrows():
            # Insert county basic info
            result = conn.execute(text("""
                INSERT INTO counties (code, name, population_2019, registered_voters_2022)
                VALUES (:code, :name, :population, :registered)
                RETURNING id
            """), {
                'code': row['code'],
                'name': row['name'],
                'population': int(row['population']),
                'registered': int(row['registered_voters_2022'])
            })

            county_id = result.fetchone()[0]

            # Insert demographics
            urban_pop = int(row['population'] * row['urban_pct'] / 100)
            rural_pop = int(row['population']) - urban_pop

            conn.execute(text("""
                INSERT INTO county_demographics (
                    county_id, census_year, total_population,
                    urban_population, rural_population
                )
                VALUES (:county_id, 2019, :total, :urban, :rural)
            """), {
                'county_id': county_id,
                'total': int(row['population']),
                'urban': urban_pop,
                'rural': rural_pop
            })

        conn.commit()

    print(f"✅ Loaded {len(df)} counties")
    return len(df)


def load_election_results(engine, year):
    """Load election results for a specific year"""
    print(f"📊 Loading {year} election results...")

    csv_path = Path(f"data/processed/election_results_{year}.csv")
    if not csv_path.exists():
        print(f"❌ File not found: {csv_path}")
        return 0

    df = pd.read_csv(csv_path)

    with engine.connect() as conn:
        # Get or create election
        result = conn.execute(text("""
            SELECT id FROM elections WHERE year = :year AND election_type = 'Presidential'
        """), {'year': year})

        election_row = result.fetchone()

        if election_row:
            election_id = election_row[0]
        else:
            # Create election
            result = conn.execute(text("""
                INSERT INTO elections (year, election_type, election_date, description)
                VALUES (:year, 'Presidential', :date, :desc)
                RETURNING id
            """), {
                'year': year,
                'date': f'{year}-08-09',
                'desc': f'{year} Kenya General Election'
            })
            election_id = result.fetchone()[0]

        conn.commit()

        # Get or create candidates
        if year == 2022:
            candidates = [('William Ruto', 'UDA'), ('Raila Odinga', 'Azimio')]
            vote_cols = ['ruto_votes', 'raila_votes']
        else:  # 2017
            candidates = [('Uhuru Kenyatta', 'Jubilee'), ('Raila Odinga', 'NASA')]
            vote_cols = ['uhuru_votes', 'raila_votes']

        candidate_ids = []
        for name, party in candidates:
            result = conn.execute(text("""
                SELECT id FROM candidates WHERE name = :name AND election_id = :election_id
            """), {'name': name, 'election_id': election_id})

            cand_row = result.fetchone()
            if cand_row:
                candidate_ids.append(cand_row[0])
            else:
                result = conn.execute(text("""
                    INSERT INTO candidates (election_id, name, party, position)
                    VALUES (:election_id, :name, :party, 'President')
                    RETURNING id
                """), {'election_id': election_id, 'name': name, 'party': party})
                candidate_ids.append(result.fetchone()[0])

        conn.commit()

        # Clear existing results for this election
        conn.execute(text("""
            DELETE FROM election_results_county WHERE election_id = :election_id
        """), {'election_id': election_id})
        conn.commit()

        # Insert results
        for _, row in df.iterrows():
            # Get county_id
            result = conn.execute(text("""
                SELECT id FROM counties WHERE code = :code
            """), {'code': str(row['county_code'])})

            county_row = result.fetchone()
            if not county_row:
                print(f"⚠️  County not found: {row['county_code']}")
                continue

            county_id = county_row[0]

            # Insert result for each candidate
            for i, (candidate_id, vote_col) in enumerate(zip(candidate_ids, vote_cols)):
                conn.execute(text("""
                    INSERT INTO election_results_county (
                        election_id, county_id, candidate_id, votes,
                        total_votes_cast, registered_voters, turnout_percentage
                    )
                    VALUES (
                        :election_id, :county_id, :candidate_id, :votes,
                        :total_cast, :registered, :turnout
                    )
                """), {
                    'election_id': election_id,
                    'county_id': county_id,
                    'candidate_id': candidate_id,
                    'votes': int(row[vote_col]),
                    'total_cast': int(row['votes_cast']),
                    'registered': int(row['registered_voters']),
                    'turnout': float(row['turnout_percentage'])
                })

        conn.commit()

    print(f"✅ Loaded {len(df)} results for {year}")
    return len(df)


def load_ethnicity_aggregates(engine):
    """Load ethnicity aggregates (privacy-preserving)"""
    print("📊 Loading ethnicity aggregates...")
    
    csv_path = Path("data/processed/ethnicity_aggregates.csv")
    if not csv_path.exists():
        print(f"❌ File not found: {csv_path}")
        return 0
    
    df = pd.read_csv(csv_path)
    
    # Verify privacy threshold
    min_count = df['population_count'].min()
    if min_count < 10:
        print(f"❌ PRIVACY VIOLATION: Minimum count is {min_count} (must be >= 10)")
        return 0
    
    print(f"✓ Privacy check passed: minimum count = {min_count}")
    
    with engine.connect() as conn:
        # Clear existing data
        conn.execute(text("DELETE FROM county_ethnicity_aggregate"))
        conn.commit()
        
        # Insert aggregates
        for _, row in df.iterrows():
            # Get county_id
            result = conn.execute(text("""
                SELECT id FROM counties WHERE code = :code
            """), {'code': str(row['county_code'])})
            
            county_row = result.fetchone()
            if not county_row:
                print(f"⚠️  County not found: {row['county_code']}")
                continue
            
            county_id = county_row[0]
            
            # Insert aggregate
            conn.execute(text("""
                INSERT INTO county_ethnicity_aggregate (
                    county_id, census_year, ethnicity_group,
                    population_count, percentage, source
                )
                VALUES (
                    :county_id, :year, :group, :count, :pct, :source
                )
            """), {
                'county_id': county_id,
                'year': int(row['census_year']),
                'group': row['ethnicity_group'],
                'count': int(row['population_count']),
                'pct': float(row['percentage']),
                'source': row['source']
            })
        
        conn.commit()
    
    print(f"✅ Loaded {len(df)} ethnicity aggregates")
    return len(df)


def verify_data(engine):
    """Verify loaded data"""
    print("\n📊 Verifying loaded data...")
    
    with engine.connect() as conn:
        # Count counties
        result = conn.execute(text("SELECT COUNT(*) FROM counties"))
        county_count = result.fetchone()[0]
        print(f"   Counties: {county_count}")
        
        # Count elections
        result = conn.execute(text("SELECT COUNT(*) FROM elections"))
        election_count = result.fetchone()[0]
        print(f"   Elections: {election_count}")
        
        # Count results
        result = conn.execute(text("SELECT COUNT(*) FROM election_results_county"))
        result_count = result.fetchone()[0]
        print(f"   Election results: {result_count}")
        
        # Count ethnicity aggregates
        result = conn.execute(text("SELECT COUNT(*) FROM county_ethnicity_aggregate"))
        ethnicity_count = result.fetchone()[0]
        print(f"   Ethnicity aggregates: {ethnicity_count}")
        
        # Verify privacy threshold
        result = conn.execute(text("""
            SELECT MIN(population_count) FROM county_ethnicity_aggregate
        """))
        min_count = result.fetchone()[0]
        
        if min_count and min_count >= 10:
            print(f"   ✓ Privacy threshold: {min_count} >= 10")
        else:
            print(f"   ❌ Privacy violation: {min_count} < 10")
        
        # Sample data
        print("\n📋 Sample data:")
        result = conn.execute(text("""
            SELECT c.name, e.registered_voters, e.total_votes_cast, e.turnout_percentage
            FROM election_results_county e
            JOIN counties c ON e.county_id = c.id
            JOIN elections el ON e.election_id = el.id
            WHERE el.year = 2022
            GROUP BY c.name, e.registered_voters, e.total_votes_cast, e.turnout_percentage
            ORDER BY e.turnout_percentage DESC
            LIMIT 5
        """))

        print("\n   Top 5 counties by turnout (2022):")
        for row in result:
            print(f"   - {row[0]}: {row[3]:.2f}% ({row[2]:,} / {row[1]:,})")


def main():
    """Main function"""
    print("🇰🇪 KenPoliMarket Sample Data Loader")
    print("=" * 60)
    print()
    
    # Check if sample data exists
    if not Path("data/processed/counties.csv").exists():
        print("❌ Sample data not found!")
        print("Run: python etl/scripts/generate_sample_data.py")
        sys.exit(1)
    
    # Create database engine
    try:
        engine = get_db_engine()
        print("✅ Connected to database")
        print()
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        print("\nMake sure:")
        print("1. PostgreSQL is running")
        print("2. Database is initialized: bash scripts/init_database.sh")
        print("3. .env file has correct DATABASE_URL")
        sys.exit(1)
    
    # Load data
    try:
        counties_loaded = load_counties(engine)
        print()
        
        results_2022 = load_election_results(engine, 2022)
        print()
        
        results_2017 = load_election_results(engine, 2017)
        print()
        
        ethnicity_loaded = load_ethnicity_aggregates(engine)
        print()
        
        # Verify
        verify_data(engine)
        
        print("\n" + "=" * 60)
        print("✅ Data loading complete!")
        print("=" * 60)
        print()
        print("📝 Next Steps:")
        print("1. Test API: curl http://localhost:8000/api/counties/")
        print("2. View in database: PGPASSWORD=password psql -h localhost -U kenpolimarket -d kenpolimarket")
        print("3. Fit models: cd models && python hierarchical_bayesian.py --fit")
        print()
        
    except Exception as e:
        print(f"\n❌ Error loading data: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()

