"""Update candidate name from Saidi Matiangiwill to Fred Matiang'i"""

import sys
from pathlib import Path

backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from database import SessionLocal
from models import Candidate

db = SessionLocal()

try:
    # Find the candidate
    candidate = db.query(Candidate).filter(
        Candidate.name == "Saidi Matiangiwill"
    ).first()
    
    if candidate:
        old_name = candidate.name
        candidate.name = "Fred Matiang'i"
        db.commit()
        print(f"✅ Updated candidate name: '{old_name}' → '{candidate.name}'")
    else:
        print("❌ Candidate 'Saidi Matiangiwill' not found")
        
finally:
    db.close()

