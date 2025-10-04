#!/usr/bin/env python3
"""
Export local database data to Render PostgreSQL database

This script will:
1. Connect to your local database
2. Export all data (elections, candidates, counties, forecasts)
3. Import to Render database
"""

import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import json
from datetime import datetime

# Add parent directory to path to import models
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models import Base, Election, Candidate, County, Forecast

# Local database connection (Docker PostgreSQL on port 5433)
LOCAL_DB_URL = "postgresql://kenpolimarket:password@localhost:5433/kenpolimarket"
local_engine = create_engine(LOCAL_DB_URL)


def get_render_db_url():
    """Get Render database URL from user"""
    print("🚀 KenPoliMarket - Export Data to Render")
    print("=" * 50)
    print()
    print("📋 Get Render Database Connection String")
    print("-" * 50)
    print()
    print("Go to your Render dashboard:")
    print("1. Click on 'kenpolimarket-db' (PostgreSQL)")
    print("2. Scroll down to 'Connections'")
    print("3. Copy the 'External Database URL'")
    print()
    print("It should look like:")
    print("postgresql://kenpolimarket:xxxxx@dpg-xxxxx.oregon-postgres.render.com/kenpolimarket")
    print()
    
    render_url = input("Paste your Render Database URL here: ").strip()
    
    if not render_url:
        print("❌ Database URL is required")
        sys.exit(1)
    
    if not render_url.startswith("postgresql://"):
        print("❌ Invalid database URL. Should start with 'postgresql://'")
        sys.exit(1)
    
    print()
    print("✅ Database URL received")
    print()
    
    return render_url


def export_data(local_session):
    """Export data from local database"""
    print("📋 Step 1: Export Local Database")
    print("=" * 50)
    print()
    
    data = {
        'elections': [],
        'candidates': [],
        'counties': [],
        'forecasts': []
    }
    
    # Export elections
    print("Exporting elections...")
    elections = local_session.query(Election).all()
    for election in elections:
        data['elections'].append({
            'id': election.id,
            'name': election.name,
            'election_date': election.election_date.isoformat() if election.election_date else None,
            'election_type': election.election_type,
            'status': election.status,
            'description': election.description,
            'created_at': election.created_at.isoformat() if election.created_at else None,
            'updated_at': election.updated_at.isoformat() if election.updated_at else None,
        })
    print(f"  ✅ {len(elections)} elections")
    
    # Export candidates
    print("Exporting candidates...")
    candidates = local_session.query(Candidate).all()
    for candidate in candidates:
        data['candidates'].append({
            'id': candidate.id,
            'election_id': candidate.election_id,
            'name': candidate.name,
            'party': candidate.party,
            'party_color': candidate.party_color,
            'running_mate': candidate.running_mate,
            'bio': candidate.bio,
            'photo_url': candidate.photo_url,
            'created_at': candidate.created_at.isoformat() if candidate.created_at else None,
            'updated_at': candidate.updated_at.isoformat() if candidate.updated_at else None,
        })
    print(f"  ✅ {len(candidates)} candidates")
    
    # Export counties
    print("Exporting counties...")
    counties = local_session.query(County).all()
    for county in counties:
        data['counties'].append({
            'id': county.id,
            'code': county.code,
            'name': county.name,
            'region': county.region,
            'population_2019': county.population_2019,
            'registered_voters_2022': county.registered_voters_2022,
            'created_at': county.created_at.isoformat() if county.created_at else None,
            'updated_at': county.updated_at.isoformat() if county.updated_at else None,
        })
    print(f"  ✅ {len(counties)} counties")
    
    # Export forecasts
    print("Exporting forecasts...")
    forecasts = local_session.query(Forecast).all()
    for forecast in forecasts:
        data['forecasts'].append({
            'id': forecast.id,
            'election_id': forecast.election_id,
            'candidate_id': forecast.candidate_id,
            'county_id': forecast.county_id,
            'forecast_date': forecast.forecast_date.isoformat() if forecast.forecast_date else None,
            'vote_share_mean': float(forecast.vote_share_mean) if forecast.vote_share_mean else None,
            'vote_share_lower': float(forecast.vote_share_lower) if forecast.vote_share_lower else None,
            'vote_share_upper': float(forecast.vote_share_upper) if forecast.vote_share_upper else None,
            'win_probability': float(forecast.win_probability) if forecast.win_probability else None,
            'model_version': forecast.model_version,
            'created_at': forecast.created_at.isoformat() if forecast.created_at else None,
            'updated_at': forecast.updated_at.isoformat() if forecast.updated_at else None,
        })
    print(f"  ✅ {len(forecasts)} forecasts")
    
    print()
    print(f"Total records to export: {sum(len(v) for v in data.values())}")
    print()
    
    return data


def import_data(render_engine, data):
    """Import data to Render database"""
    print("📋 Step 2: Import to Render Database")
    print("=" * 50)
    print()
    
    Session = sessionmaker(bind=render_engine)
    render_session = Session()
    
    try:
        # Import elections
        print("Importing elections...")
        for election_data in data['elections']:
            election = Election(**election_data)
            render_session.merge(election)
        render_session.commit()
        print(f"  ✅ {len(data['elections'])} elections imported")
        
        # Import candidates
        print("Importing candidates...")
        for candidate_data in data['candidates']:
            candidate = Candidate(**candidate_data)
            render_session.merge(candidate)
        render_session.commit()
        print(f"  ✅ {len(data['candidates'])} candidates imported")
        
        # Import counties
        print("Importing counties...")
        for county_data in data['counties']:
            county = County(**county_data)
            render_session.merge(county)
        render_session.commit()
        print(f"  ✅ {len(data['counties'])} counties imported")
        
        # Import forecasts
        print("Importing forecasts...")
        for forecast_data in data['forecasts']:
            forecast = Forecast(**forecast_data)
            render_session.merge(forecast)
        render_session.commit()
        print(f"  ✅ {len(data['forecasts'])} forecasts imported")
        
        print()
        print("✅ All data imported successfully!")
        
    except Exception as e:
        print(f"❌ Error importing data: {e}")
        render_session.rollback()
        raise
    finally:
        render_session.close()


def verify_data(render_engine):
    """Verify data in Render database"""
    print()
    print("📋 Step 3: Verify Data")
    print("=" * 50)
    print()
    
    Session = sessionmaker(bind=render_engine)
    render_session = Session()
    
    try:
        elections_count = render_session.query(Election).count()
        candidates_count = render_session.query(Candidate).count()
        counties_count = render_session.query(County).count()
        forecasts_count = render_session.query(Forecast).count()
        
        print(f"Elections:  {elections_count}")
        print(f"Candidates: {candidates_count}")
        print(f"Counties:   {counties_count}")
        print(f"Forecasts:  {forecasts_count}")
        print()
        print(f"Total:      {elections_count + candidates_count + counties_count + forecasts_count} records")
        
    finally:
        render_session.close()


def main():
    """Main function"""
    
    # Get Render database URL
    render_db_url = get_render_db_url()
    
    # Create Render engine
    print("Connecting to Render database...")
    try:
        render_engine = create_engine(render_db_url)
        # Test connection
        with render_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("✅ Connected to Render database")
        print()
    except Exception as e:
        print(f"❌ Failed to connect to Render database: {e}")
        sys.exit(1)
    
    # Create local session
    print("Connecting to local database...")
    try:
        Session = sessionmaker(bind=local_engine)
        local_session = Session()
        print("✅ Connected to local database")
        print()
    except Exception as e:
        print(f"❌ Failed to connect to local database: {e}")
        sys.exit(1)
    
    # Export data from local database
    data = export_data(local_session)
    local_session.close()
    
    # Confirm import
    print("⚠️  WARNING: This will add/update data in your Render database.")
    print()
    confirm = input("Continue with import? (yes/no): ").strip().lower()
    
    if confirm != 'yes':
        print("Import cancelled.")
        sys.exit(0)
    
    print()
    
    # Import data to Render database
    import_data(render_engine, data)
    
    # Verify data
    verify_data(render_engine)
    
    print()
    print("🎉 Export Complete!")
    print()
    print("Next steps:")
    print("  1. Test your backend: https://kenpolimarket-backend.onrender.com/api/docs")
    print("  2. Test your frontend: https://kenpolimarket.vercel.app")
    print()
    print("🚀 Your app is now live with data!")


if __name__ == "__main__":
    main()

