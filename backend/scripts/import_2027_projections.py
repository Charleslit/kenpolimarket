"""
Import 2027 Election Projections with Historical 2022 Data
This script imports comprehensive 2027 projections including Ruto vs Matiang'i scenario
"""

import sys
import os
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import County, Candidate, Election, ForecastRun, ForecastCounty
import uuid
from datetime import datetime
from decimal import Decimal
import json

# 2027 Projection Data
PROJECTION_DATA = {
    # Mount Kenya Region
    1: {"name": "Mombasa", "ruto_2027": 190514, "matiangi_2027": 285772, "registered_2027": 680408},
    2: {"name": "Kwale", "ruto_2027": 112503, "matiangi_2027": 168754, "registered_2027": 366439},
    3: {"name": "Kilifi", "ruto_2027": 193686, "matiangi_2027": 290530, "registered_2027": 691778},
    4: {"name": "Tana River", "ruto_2027": 43097, "matiangi_2027": 64646, "registered_2027": 139673},
    5: {"name": "Lamu", "ruto_2027": 22747, "matiangi_2027": 34121, "registered_2027": 81240},
    6: {"name": "Taita Taveta", "ruto_2027": 67919, "matiangi_2027": 101879, "registered_2027": 215536},
    7: {"name": "Garissa", "ruto_2027": 83961, "matiangi_2027": 65971, "registered_2027": 214189},
    8: {"name": "Wajir", "ruto_2027": 90067, "matiangi_2027": 70766, "registered_2027": 229762},
    9: {"name": "Mandera", "ruto_2027": 99268, "matiangi_2027": 81220, "registered_2027": 257840},
    10: {"name": "Marsabit", "ruto_2027": 77585, "matiangi_2027": 60961, "registered_2027": 197923},
    11: {"name": "Isiolo", "ruto_2027": 46243, "matiangi_2027": 36333, "registered_2027": 117965},
    12: {"name": "Meru", "ruto_2027": 200515, "matiangi_2027": 467867, "registered_2027": 954831},
    13: {"name": "Tharaka Nithi", "ruto_2027": 61229, "matiangi_2027": 142867, "registered_2027": 291566},
    14: {"name": "Embu", "ruto_2027": 82103, "matiangi_2027": 191574, "registered_2027": 390967},
    15: {"name": "Kitui", "ruto_2027": 130380, "matiangi_2027": 304220, "registered_2027": 620857},
    16: {"name": "Machakos", "ruto_2027": 179371, "matiangi_2027": 418533, "registered_2027": 854148},
    17: {"name": "Makueni", "ruto_2027": 118298, "matiangi_2027": 275695, "registered_2027": 563321},
    18: {"name": "Nyandarua", "ruto_2027": 104541, "matiangi_2027": 243929, "registered_2027": 497814},
    19: {"name": "Nyeri", "ruto_2027": 137434, "matiangi_2027": 320678, "registered_2027": 654446},
    20: {"name": "Kirinyaga", "ruto_2027": 103315, "matiangi_2027": 241068, "registered_2027": 491975},
    21: {"name": "Murang'a", "ruto_2027": 147464, "matiangi_2027": 344081, "registered_2027": 702207},
    22: {"name": "Kiambu", "ruto_2027": 374230, "matiangi_2027": 873203, "registered_2027": 1782045},
    23: {"name": "Turkana", "ruto_2027": 119582, "matiangi_2027": 93958, "registered_2027": 305057},
    24: {"name": "West Pokot", "ruto_2027": 108335, "matiangi_2027": 27030, "registered_2027": 259093},
    25: {"name": "Samburu", "ruto_2027": 57022, "matiangi_2027": 14256, "registered_2027": 136111},
    26: {"name": "Trans Nzoia", "ruto_2027": 103123, "matiangi_2027": 242474, "registered_2027": 493731},
    27: {"name": "Uasin Gishu", "ruto_2027": 351886, "matiangi_2027": 87972, "registered_2027": 628368},
    28: {"name": "Elgeyo Marakwet", "ruto_2027": 165110, "matiangi_2027": 41278, "registered_2027": 294840},
    29: {"name": "Nandi", "ruto_2027": 288690, "matiangi_2027": 72173, "registered_2027": 516710},
    30: {"name": "Baringo", "ruto_2027": 123810, "matiangi_2027": 134128, "registered_2027": 368483},
    31: {"name": "Laikipia", "ruto_2027": 91655, "matiangi_2027": 137482, "registered_2027": 327338},
    32: {"name": "Nakuru", "ruto_2027": 384058, "matiangi_2027": 576087, "registered_2027": 1371636},
    33: {"name": "Narok", "ruto_2027": 181252, "matiangi_2027": 271878, "registered_2027": 649167},
    34: {"name": "Kajiado", "ruto_2027": 191610, "matiangi_2027": 287415, "registered_2027": 684322},
    35: {"name": "Kericho", "ruto_2027": 345364, "matiangi_2027": 86341, "registered_2027": 616721},
    36: {"name": "Bomet", "ruto_2027": 311511, "matiangi_2027": 77878, "registered_2027": 556270},
    37: {"name": "Kakamega", "ruto_2027": 278964, "matiangi_2027": 418447, "registered_2027": 996301},
    38: {"name": "Vihiga", "ruto_2027": 95933, "matiangi_2027": 143900, "registered_2027": 342619},
    39: {"name": "Bungoma", "ruto_2027": 267516, "matiangi_2027": 327515, "registered_2027": 850044},
    40: {"name": "Busia", "ruto_2027": 138741, "matiangi_2027": 208112, "registered_2027": 495505},
    41: {"name": "Siaya", "ruto_2027": 152273, "matiangi_2027": 228410, "registered_2027": 543833},
    42: {"name": "Kisumu", "ruto_2027": 215476, "matiangi_2027": 323215, "registered_2027": 769559},
    43: {"name": "Homa Bay", "ruto_2027": 198904, "matiangi_2027": 298356, "registered_2027": 710372},
    44: {"name": "Migori", "ruto_2027": 163358, "matiangi_2027": 245036, "registered_2027": 583420},
    45: {"name": "Kisii", "ruto_2027": 108655, "matiangi_2027": 434621, "registered_2027": 776109},
    46: {"name": "Nyamira", "ruto_2027": 57223, "matiangi_2027": 228894, "registered_2027": 408738},
    47: {"name": "Nairobi", "ruto_2027": 898559, "matiangi_2027": 1347839, "registered_2027": 3209140},
}

def calculate_other_candidates(ruto_votes: int, matiangi_votes: int, registered: int) -> dict:
    """
    Calculate votes for other candidates (Raila, Kalonzo, Musalia)
    Assuming 70% turnout and distributing remaining votes
    """
    total_votes = int(registered * 0.70)
    ruto_matiangi_total = ruto_votes + matiangi_votes
    remaining_votes = total_votes - ruto_matiangi_total
    
    # Distribute remaining votes: Raila 50%, Kalonzo 30%, Musalia 20%
    raila_votes = int(remaining_votes * 0.50)
    kalonzo_votes = int(remaining_votes * 0.30)
    musalia_votes = remaining_votes - raila_votes - kalonzo_votes
    
    return {
        "raila": raila_votes,
        "kalonzo": kalonzo_votes,
        "musalia": musalia_votes,
        "total_votes": total_votes
    }

def import_projections():
    """Import 2027 projections into the database"""
    db = SessionLocal()
    
    try:
        print("🚀 Starting 2027 Projection Import...")
        
        # Get 2027 election
        election_2027 = db.query(Election).filter(Election.year == 2027).first()
        if not election_2027:
            print("❌ 2027 election not found!")
            return
        
        # Get all candidates
        candidates = {
            "William Ruto": db.query(Candidate).filter(Candidate.name == "William Ruto").first(),
            "Fred Matiang'i": db.query(Candidate).filter(Candidate.name == "Fred Matiang'i").first(),
            "Raila Odinga": db.query(Candidate).filter(Candidate.name == "Raila Odinga").first(),
            "Kalonzo Musyoka": db.query(Candidate).filter(Candidate.name == "Kalonzo Musyoka").first(),
            "Musalia Mudavadi": db.query(Candidate).filter(Candidate.name == "Musalia Mudavadi").first(),
        }
        
        # Verify all candidates exist
        for name, candidate in candidates.items():
            if not candidate:
                print(f"❌ Candidate '{name}' not found!")
                return
        
        # Delete existing 2027 forecasts
        print("🗑️  Deleting existing 2027 forecasts...")
        existing_runs = db.query(ForecastRun).filter(
            ForecastRun.election_id == election_2027.id
        ).all()
        
        for run in existing_runs:
            db.query(ForecastCounty).filter(
                ForecastCounty.forecast_run_id == run.id
            ).delete()
            db.delete(run)
        
        db.commit()
        
        # Create new forecast run
        print("📊 Creating new forecast run...")
        forecast_run = ForecastRun(
            id=uuid.uuid4(),  # Use UUID object, not string
            election_id=election_2027.id,
            model_name="Comprehensive 2027 Projection",
            model_version="2.0",
            run_timestamp=datetime.now(),
            parameters=json.dumps({
                "description": "Ruto vs Matiang'i scenario with Mount Kenya realignment",
                "turnout_assumption": 0.70,
                "key_narrative": "Mount Kenya cataclysm + Opposition merger"
            }),
            data_cutoff_date=datetime.now().date(),
            status="completed"
        )
        
        db.add(forecast_run)
        db.commit()
        
        print(f"✅ Created forecast run: {forecast_run.id}")
        
        # Import county-level projections
        print("📍 Importing county projections...")
        counties_processed = 0
        
        for county_code, data in PROJECTION_DATA.items():
            # Get county (convert code to string)
            county = db.query(County).filter(County.code == str(county_code)).first()
            if not county:
                print(f"⚠️  County {county_code} ({data['name']}) not found, skipping...")
                continue
            
            # Calculate other candidates' votes
            other_votes = calculate_other_candidates(
                data["ruto_2027"],
                data["matiangi_2027"],
                data["registered_2027"]
            )
            
            total_votes = other_votes["total_votes"]
            
            # Create forecasts for each candidate
            forecasts_data = [
                {
                    "candidate": candidates["William Ruto"],
                    "votes": data["ruto_2027"],
                },
                {
                    "candidate": candidates["Fred Matiang'i"],
                    "votes": data["matiangi_2027"],
                },
                {
                    "candidate": candidates["Raila Odinga"],
                    "votes": other_votes["raila"],
                },
                {
                    "candidate": candidates["Kalonzo Musyoka"],
                    "votes": other_votes["kalonzo"],
                },
                {
                    "candidate": candidates["Musalia Mudavadi"],
                    "votes": other_votes["musalia"],
                },
            ]
            
            for fc_data in forecasts_data:
                votes = fc_data["votes"]
                vote_share = (votes / total_votes * 100) if total_votes > 0 else 0
                
                # Calculate uncertainty bounds (±5% for main candidates, ±3% for others)
                is_main = fc_data["candidate"].name in ["William Ruto", "Fred Matiang'i"]
                uncertainty = 5.0 if is_main else 3.0
                
                lower_bound = max(0, vote_share - uncertainty)
                upper_bound = min(100, vote_share + uncertainty)
                
                forecast = ForecastCounty(
                    forecast_run_id=forecast_run.id,
                    county_id=county.id,
                    candidate_id=fc_data["candidate"].id,
                    predicted_vote_share=Decimal(str(round(vote_share, 2))),
                    lower_bound_90=Decimal(str(round(lower_bound, 2))),
                    upper_bound_90=Decimal(str(round(upper_bound, 2))),
                    predicted_votes=votes,
                    predicted_turnout=Decimal("70.00")
                )
                
                db.add(forecast)

            counties_processed += 1

            # Commit every 5 counties to avoid batch issues
            if counties_processed % 5 == 0:
                db.commit()
                print(f"  ✓ Processed {counties_processed} counties...")

        # Final commit
        db.commit()
        
        print(f"\n✅ Successfully imported projections for {counties_processed} counties!")
        print(f"📊 Total forecasts created: {counties_processed * 5}")
        
        # Print summary
        print("\n" + "="*60)
        print("📈 PROJECTION SUMMARY")
        print("="*60)
        
        # Calculate national totals
        ruto_total = sum(d["ruto_2027"] for d in PROJECTION_DATA.values())
        matiangi_total = sum(d["matiangi_2027"] for d in PROJECTION_DATA.values())
        registered_total = sum(d["registered_2027"] for d in PROJECTION_DATA.values())
        
        other_national = calculate_other_candidates(ruto_total, matiangi_total, registered_total)
        total_votes = other_national["total_votes"]
        
        print(f"\n🗳️  Total Registered Voters: {registered_total:,}")
        print(f"📊 Projected Turnout (70%): {total_votes:,}")
        print(f"\n🏆 PROJECTED RESULTS:")
        print(f"   1. Fred Matiang'i:   {matiangi_total:,} ({matiangi_total/total_votes*100:.1f}%)")
        print(f"   2. William Ruto:     {ruto_total:,} ({ruto_total/total_votes*100:.1f}%)")
        print(f"   3. Raila Odinga:     {other_national['raila']:,} ({other_national['raila']/total_votes*100:.1f}%)")
        print(f"   4. Kalonzo Musyoka:  {other_national['kalonzo']:,} ({other_national['kalonzo']/total_votes*100:.1f}%)")
        print(f"   5. Musalia Mudavadi: {other_national['musalia']:,} ({other_national['musalia']/total_votes*100:.1f}%)")

        print(f"\n🎯 Winner: Fred Matiang'i by {matiangi_total - ruto_total:,} votes")
        print(f"   Margin: {(matiangi_total - ruto_total)/total_votes*100:.1f}%")
        
        print("\n" + "="*60)
        print("✅ Import Complete! Refresh your dashboard to see the new projections.")
        print("="*60)
        
    except Exception as e:
        print(f"\n❌ Error during import: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    import_projections()

