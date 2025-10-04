"""Update Fred Matiang'i's party from Independent to Jubilee"""

import sys
from pathlib import Path

backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from database import SessionLocal
from models import Candidate, ForecastCounty

db = SessionLocal()

try:
    print("\n🔄 Updating Fred Matiang'i's party affiliation...")
    print("=" * 60)
    
    # Find all Matiang'i candidates (case-insensitive)
    candidates = db.query(Candidate).filter(
        Candidate.name.ilike('%matiang%')
    ).all()
    
    if not candidates:
        print("❌ No Matiang'i candidates found in database")
        sys.exit(1)
    
    print(f"\n📋 Found {len(candidates)} candidate record(s):")
    for candidate in candidates:
        print(f"   - ID: {candidate.id}, Name: {candidate.name}, Party: {candidate.party}")
    
    # Update party from Independent to Jubilee
    updated_count = 0
    for candidate in candidates:
        if candidate.party == 'Independent':
            old_party = candidate.party
            candidate.party = 'Jubilee'
            updated_count += 1
            print(f"\n✅ Updated candidate ID {candidate.id}:")
            print(f"   Name: {candidate.name}")
            print(f"   Party: {old_party} → {candidate.party}")
    
    if updated_count == 0:
        print("\n⚠️  No candidates with 'Independent' party found")
        print("   They may already be updated to 'Jubilee'")
    else:
        # Commit changes
        db.commit()
        print(f"\n✅ Successfully updated {updated_count} candidate record(s)")
    
    # Check forecast records
    print("\n📊 Checking forecast records...")
    forecast_count = db.query(ForecastCounty).filter(
        ForecastCounty.candidate_id.in_([c.id for c in candidates])
    ).count()
    
    print(f"   Found {forecast_count} forecast records for Matiang'i")
    print("   (These will automatically use the updated party from the candidate table)")
    
    print("\n" + "=" * 60)
    print("✅ Update complete!")
    print("\n📝 Next steps:")
    print("   1. Restart the backend API if it's running")
    print("   2. Refresh the frontend to see Matiang'i with Jubilee (red)")
    print("   3. Verify the color appears as crimson red (#DC143C)")
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    db.rollback()
    raise
finally:
    db.close()

