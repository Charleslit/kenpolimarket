#!/usr/bin/env python3
"""
Import 2027 "Ruto vs Matiang'i" Scenario - TWO CANDIDATES ONLY
This imports EXACTLY the data provided - no artificial splitting to other candidates
"""

import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import uuid
from datetime import datetime
from decimal import Decimal
import json

from database import SessionLocal
from models import County, Election, Candidate, ForecastRun, ForecastCounty

# 2027 Projection Data - EXACTLY as provided (Ruto vs Matiang'i ONLY)
PROJECTION_DATA = {
    # MOUNT KENYA REGION - The Cataclysm
    22: {"name": "Kiambu", "ruto_2022": 776173, "raila_2022": 130121, "registered_2027": 1782045, "ruto_2027": 374230, "matiangi_2027": 873203},
    12: {"name": "Meru", "ruto_2022": 403244, "raila_2022": 81948, "registered_2027": 954831, "ruto_2027": 200515, "matiangi_2027": 467867},
    21: {"name": "Murang'a", "ruto_2022": 343257, "raila_2022": 43327, "registered_2027": 702207, "ruto_2027": 147464, "matiangi_2027": 344081},
    19: {"name": "Nyeri", "ruto_2022": 337766, "raila_2022": 24544, "registered_2027": 654446, "ruto_2027": 137434, "matiangi_2027": 320678},
    18: {"name": "Nyandarua", "ruto_2022": 266731, "raila_2022": 15243, "registered_2027": 497814, "ruto_2027": 104541, "matiangi_2027": 243929},
    20: {"name": "Kirinyaga", "ruto_2022": 249186, "raila_2022": 26353, "registered_2027": 491975, "ruto_2027": 103315, "matiangi_2027": 241068},
    14: {"name": "Embu", "ruto_2022": 181469, "raila_2022": 25024, "registered_2027": 390967, "ruto_2027": 82103, "matiangi_2027": 191574},
    13: {"name": "Tharaka Nithi", "ruto_2022": 139182, "raila_2022": 19772, "registered_2027": 291566, "ruto_2027": 61229, "matiangi_2027": 142867},
    
    # RIFT VALLEY REGION - Ruto's Strongholds
    27: {"name": "Uasin Gishu", "ruto_2022": 267125, "raila_2022": 51456, "registered_2027": 628368, "ruto_2027": 351886, "matiangi_2027": 87972},
    32: {"name": "Nakuru", "ruto_2022": 482028, "raila_2022": 200876, "registered_2027": 1371636, "ruto_2027": 384058, "matiangi_2027": 576087},
    36: {"name": "Bomet", "ruto_2022": 283596, "raila_2022": 31245, "registered_2027": 556270, "ruto_2027": 311511, "matiangi_2027": 77878},
    35: {"name": "Kericho", "ruto_2022": 307867, "raila_2022": 33664, "registered_2027": 616721, "ruto_2027": 345364, "matiangi_2027": 86341},
    29: {"name": "Nandi", "ruto_2022": 252886, "raila_2022": 31138, "registered_2027": 516710, "ruto_2027": 288690, "matiangi_2027": 72173},
    34: {"name": "Kajiado", "ruto_2022": 189873, "raila_2022": 151109, "registered_2027": 684322, "ruto_2027": 191610, "matiangi_2027": 287415},
    33: {"name": "Narok", "ruto_2022": 202580, "raila_2022": 125634, "registered_2027": 649167, "ruto_2027": 181252, "matiangi_2027": 271878},
    30: {"name": "Baringo", "ruto_2022": 171863, "raila_2022": 25385, "registered_2027": 368483, "ruto_2027": 123810, "matiangi_2027": 134128},
    28: {"name": "Elgeyo Marakwet", "ruto_2022": 150227, "raila_2022": 15253, "registered_2027": 294840, "ruto_2027": 165110, "matiangi_2027": 41278},
    26: {"name": "Trans Nzoia", "ruto_2022": 147544, "raila_2022": 112185, "registered_2027": 493731, "ruto_2027": 103123, "matiangi_2027": 242474},
    23: {"name": "Turkana", "ruto_2022": 49081, "raila_2022": 83452, "registered_2027": 305057, "ruto_2027": 119582, "matiangi_2027": 93958},
    24: {"name": "West Pokot", "ruto_2022": 109353, "raila_2022": 22669, "registered_2027": 259093, "ruto_2027": 108335, "matiangi_2027": 27030},
    31: {"name": "Laikipia", "ruto_2022": 115020, "raila_2022": 56360, "registered_2027": 327338, "ruto_2027": 91655, "matiangi_2027": 137482},
    25: {"name": "Samburu", "ruto_2022": 40551, "raila_2022": 24177, "registered_2027": 136111, "ruto_2027": 57022, "matiangi_2027": 14256},
    
    # NYANZA REGION - Opposition Territory
    42: {"name": "Kisumu", "ruto_2022": 42258, "raila_2022": 331192, "registered_2027": 769559, "ruto_2027": 215476, "matiangi_2027": 323215},
    43: {"name": "Homa Bay", "ruto_2022": 27793, "raila_2022": 333803, "registered_2027": 710372, "ruto_2027": 198904, "matiangi_2027": 298356},
    44: {"name": "Migori", "ruto_2022": 47262, "raila_2022": 256873, "registered_2027": 583420, "ruto_2027": 163358, "matiangi_2027": 245036},
    41: {"name": "Siaya", "ruto_2022": 17643, "raila_2022": 278295, "registered_2027": 543833, "ruto_2027": 152273, "matiangi_2027": 228410},
    45: {"name": "Kisii", "ruto_2022": 164965, "raila_2022": 266141, "registered_2027": 776109, "ruto_2027": 108655, "matiangi_2027": 434621},
    46: {"name": "Nyamira", "ruto_2022": 85258, "raila_2022": 145485, "registered_2027": 408738, "ruto_2027": 57223, "matiangi_2027": 228894},
    
    # WESTERN REGION
    37: {"name": "Kakamega", "ruto_2022": 97509, "raila_2022": 414518, "registered_2027": 996301, "ruto_2027": 278964, "matiangi_2027": 418447},
    39: {"name": "Bungoma", "ruto_2022": 184780, "raila_2022": 262522, "registered_2027": 850044, "ruto_2027": 267516, "matiangi_2027": 327515},
    40: {"name": "Busia", "ruto_2022": 33714, "raila_2022": 226777, "registered_2027": 495505, "ruto_2027": 138741, "matiangi_2027": 208112},
    38: {"name": "Vihiga", "ruto_2022": 47313, "raila_2022": 141664, "registered_2027": 342619, "ruto_2027": 95933, "matiangi_2027": 143900},
    
    # LOWER EASTERN REGION
    16: {"name": "Machakos", "ruto_2022": 154993, "raila_2022": 295622, "registered_2027": 854148, "ruto_2027": 179371, "matiangi_2027": 418533},
    17: {"name": "Makueni", "ruto_2022": 77648, "raila_2022": 221861, "registered_2027": 563321, "ruto_2027": 118298, "matiangi_2027": 275695},
    15: {"name": "Kitui", "ruto_2022": 93448, "raila_2022": 224848, "registered_2027": 620857, "ruto_2027": 130380, "matiangi_2027": 304220},
    
    # COAST REGION
    1: {"name": "Mombasa", "ruto_2022": 85803, "raila_2022": 215875, "registered_2027": 680408, "ruto_2027": 190514, "matiangi_2027": 285772},
    3: {"name": "Kilifi", "ruto_2022": 93116, "raila_2022": 242677, "registered_2027": 691778, "ruto_2027": 193686, "matiangi_2027": 290530},
    2: {"name": "Kwale", "ruto_2022": 48236, "raila_2022": 134806, "registered_2027": 366439, "ruto_2027": 112503, "matiangi_2027": 168754},
    6: {"name": "Taita Taveta", "ruto_2022": 44864, "raila_2022": 65234, "registered_2027": 215536, "ruto_2027": 67919, "matiangi_2027": 101879},
    4: {"name": "Tana River", "ruto_2022": 28663, "raila_2022": 34207, "registered_2027": 139673, "ruto_2027": 43097, "matiangi_2027": 64646},
    5: {"name": "Lamu", "ruto_2022": 17862, "raila_2022": 20122, "registered_2027": 81240, "ruto_2027": 22747, "matiangi_2027": 34121},
    
    # NORTHERN REGION
    9: {"name": "Mandera", "ruto_2022": 76336, "raila_2022": 30519, "registered_2027": 257840, "ruto_2027": 99268, "matiangi_2027": 81220},
    8: {"name": "Wajir", "ruto_2022": 61836, "raila_2022": 36399, "registered_2027": 229762, "ruto_2027": 90067, "matiangi_2027": 70766},
    7: {"name": "Garissa", "ruto_2022": 54010, "raila_2022": 36003, "registered_2027": 214189, "ruto_2027": 83961, "matiangi_2027": 65971},
    10: {"name": "Marsabit", "ruto_2022": 46110, "raila_2022": 41202, "registered_2027": 197923, "ruto_2027": 77585, "matiangi_2027": 60961},
    11: {"name": "Isiolo", "ruto_2022": 23485, "raila_2022": 30408, "registered_2027": 117965, "ruto_2027": 46243, "matiangi_2027": 36333},
    
    # NAIROBI - Urban Swing
    47: {"name": "Nairobi", "ruto_2022": 554091, "raila_2022": 747735, "registered_2027": 3209140, "ruto_2027": 898559, "matiangi_2027": 1347839},
}


def import_two_candidate_scenario():
    """Import ONLY Ruto vs Matiang'i - exactly as provided"""
    db = SessionLocal()
    
    try:
        print("🚀 Starting 'Ruto vs Matiang'i' Import (TWO CANDIDATES ONLY)...")
        print("📊 This imports EXACTLY the data provided - no artificial splitting\n")
        
        # Get 2027 election
        election_2027 = db.query(Election).filter(Election.year == 2027).first()
        if not election_2027:
            print("❌ Error: 2027 election not found in database")
            return
        
        # Get ONLY the two candidates we need
        ruto = db.query(Candidate).filter(Candidate.name == "William Ruto").first()
        matiangi = db.query(Candidate).filter(Candidate.name == "Fred Matiang'i").first()
        
        if not all([ruto, matiangi]):
            print("❌ Error: Ruto or Matiang'i not found in database")
            return
        
        print(f"✅ Found candidates: {ruto.name} and {matiangi.name}\n")
        
        # Delete existing 2027 forecasts
        print("🗑️  Deleting existing 2027 forecasts...")
        deleted = db.query(ForecastRun).filter(
            ForecastRun.election_id == election_2027.id
        ).delete()
        db.commit()
        print(f"   Deleted {deleted} existing forecast runs\n")
        
        # Create new forecast run
        print("📊 Creating new forecast run: 'Ruto vs Matiang'i (Two Candidates)'...")
        forecast_run = ForecastRun(
            id=uuid.uuid4(),
            election_id=election_2027.id,
            model_name="Ruto vs Matiang'i",
            model_version="4.0",
            run_timestamp=datetime.now(),
            parameters=json.dumps({
                "description": "Two-candidate race: Ruto vs Matiang'i",
                "scenario": "Mount Kenya cataclysm + Opposition merger",
                "candidates": 2,
                "includes_2022_data": True,
                "key_narrative": "Head-to-head battle between incumbent and unified opposition"
            }),
            data_cutoff_date=datetime.now().date(),
            status="completed"
        )
        
        db.add(forecast_run)
        db.commit()
        print(f"✅ Created forecast run: {forecast_run.id}\n")
        
        # Import county projections - ONLY TWO CANDIDATES
        print("📍 Importing county projections (2 candidates per county)...")
        
        counties_processed = 0
        ruto_total = 0
        matiangi_total = 0
        
        for county_code, data in PROJECTION_DATA.items():
            # Get county
            county = db.query(County).filter(County.code == str(county_code)).first()
            
            if not county:
                print(f"⚠️  County {county_code} ({data['name']}) not found, skipping...")
                continue
            
            # Calculate totals
            ruto_votes = data["ruto_2027"]
            matiangi_votes = data["matiangi_2027"]
            total_votes = ruto_votes + matiangi_votes
            
            ruto_total += ruto_votes
            matiangi_total += matiangi_votes
            
            # Calculate vote shares (only 2 candidates, so they sum to 100%)
            ruto_share = Decimal(str(round((ruto_votes / total_votes * 100), 2))) if total_votes > 0 else Decimal('0')
            matiangi_share = Decimal(str(round((matiangi_votes / total_votes * 100), 2))) if total_votes > 0 else Decimal('0')
            
            # Calculate turnout based on registered voters
            turnout = Decimal(str(round((total_votes / data["registered_2027"] * 100), 2)))
            
            # Create forecasts for ONLY the two candidates
            candidates_data = [
                (ruto.id, ruto_votes, ruto_share, 3.0),
                (matiangi.id, matiangi_votes, matiangi_share, 3.0),
            ]
            
            for candidate_id, votes, vote_share, uncertainty in candidates_data:
                forecast = ForecastCounty(
                    forecast_run_id=forecast_run.id,
                    county_id=county.id,
                    candidate_id=candidate_id,
                    predicted_vote_share=vote_share,
                    lower_bound_90=max(Decimal('0'), vote_share - Decimal(str(uncertainty))),
                    upper_bound_90=min(Decimal('100'), vote_share + Decimal(str(uncertainty))),
                    predicted_votes=votes,
                    predicted_turnout=turnout
                )
                
                db.add(forecast)
            
            counties_processed += 1
            
            # Commit every 5 counties
            if counties_processed % 5 == 0:
                db.commit()
                print(f"  ✓ Processed {counties_processed} counties...")
        
        # Final commit
        db.commit()
        
        print(f"\n✅ Successfully imported projections for {counties_processed} counties!")
        print(f"📊 Total forecasts created: {counties_processed * 2} (2 candidates per county)")
        
        # Print summary
        total_votes = ruto_total + matiangi_total
        
        print("\n" + "="*60)
        print("📈 PROJECTION SUMMARY: Ruto vs Matiang'i (TWO CANDIDATES)")
        print("="*60)
        print(f"\n🗳️  Total Projected Votes: {total_votes:,}")
        print(f"\n🏆 PROJECTED RESULTS:")
        print(f"   1. Fred Matiang'i:   {matiangi_total:,} ({matiangi_total/total_votes*100:.1f}%)")
        print(f"   2. William Ruto:     {ruto_total:,} ({ruto_total/total_votes*100:.1f}%)")
        
        print(f"\n🎯 Winner: Fred Matiang'i by {matiangi_total - ruto_total:,} votes")
        print(f"   Margin: {(matiangi_total - ruto_total)/total_votes*100:.1f}%")
        
        print("\n" + "="*60)
        print("✅ Import Complete! Refresh your dashboard to see the clean 2-candidate race.")
        print("="*60)
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Error during import: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    import_two_candidate_scenario()

