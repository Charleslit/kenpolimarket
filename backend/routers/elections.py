"""
Elections API Router
Endpoints for election data and results
"""
from fastapi import APIRouter, HTTPException, Depends, Query, UploadFile, File
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
import csv
import json
import io
from database import get_db
from models import Election, Candidate, ElectionResultCounty, County
from schemas import (
    ElectionBaseSchema,
    ElectionDetailSchema,
    ElectionResultCountySchema,
    CandidateSchema
)


class ElectionCreate(BaseModel):
    """Schema for creating an election"""
    year: int = Field(..., ge=2000, le=2100)
    type: str = Field(..., min_length=1, max_length=100)
    date: str = Field(..., description="Date in YYYY-MM-DD format")
    description: Optional[str] = None


class ElectionResultCreate(BaseModel):
    """Schema for creating an election result"""
    county_id: int
    candidate_id: int
    votes: int = Field(..., ge=0)

router = APIRouter(prefix="/elections", tags=["elections"])


@router.post("/", response_model=ElectionDetailSchema, status_code=201)
async def create_election(
    election_data: ElectionCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new election

    Args:
        election_data: Election information

    Returns:
        Created election
    """
    # Check if election already exists
    existing = db.query(Election).filter(
        Election.year == election_data.year,
        Election.election_type == election_data.type
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Election for {election_data.year} ({election_data.type}) already exists"
        )

    # Parse date
    try:
        election_date = datetime.strptime(election_data.date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid date format. Use YYYY-MM-DD"
        )

    # Create new election
    new_election = Election(
        year=election_data.year,
        election_type=election_data.type,
        election_date=election_date,
        description=election_data.description
    )

    db.add(new_election)
    db.commit()
    db.refresh(new_election)

    return new_election


@router.get("/", response_model=List[ElectionDetailSchema])
async def list_elections(
    election_type: Optional[str] = Query(None, description="Filter by election type (e.g., 'Presidential')"),
    year: Optional[int] = Query(None, description="Filter by year"),
    db: Session = Depends(get_db)
):
    """
    Get list of all elections

    Args:
        election_type: Optional filter by election type
        year: Optional filter by year

    Returns:
        List of elections with candidate information
    """
    query = db.query(Election).options(joinedload(Election.candidates))

    if election_type:
        query = query.filter(Election.election_type == election_type)

    if year:
        query = query.filter(Election.year == year)

    # Order by year descending (most recent first)
    query = query.order_by(desc(Election.year))

    elections = query.all()

    return elections


@router.get("/{election_id}", response_model=ElectionDetailSchema)
async def get_election(
    election_id: int,
    db: Session = Depends(get_db)
):
    """
    Get detailed information for a specific election

    Args:
        election_id: Election ID

    Returns:
        Detailed election information including candidates
    """
    election = db.query(Election).options(
        joinedload(Election.candidates)
    ).filter(Election.id == election_id).first()

    if not election:
        raise HTTPException(
            status_code=404,
            detail=f"Election with ID {election_id} not found"
        )

    return election


@router.get("/{election_id}/results")
async def get_election_results(
    election_id: int,
    county_code: Optional[str] = Query(None, description="Filter by county code"),
    candidate_id: Optional[int] = Query(None, description="Filter by candidate ID"),
    db: Session = Depends(get_db)
):
    """
    Get results for a specific election

    Args:
        election_id: Election ID
        county_code: Optional filter by county code
        candidate_id: Optional filter by candidate ID

    Returns:
        Election results with county and candidate details, plus summary statistics
    """
    # Verify election exists
    election = db.query(Election).filter(Election.id == election_id).first()
    if not election:
        raise HTTPException(status_code=404, detail=f"Election {election_id} not found")

    # Build results query
    query = db.query(ElectionResultCounty).filter(
        ElectionResultCounty.election_id == election_id
    ).options(
        joinedload(ElectionResultCounty.county),
        joinedload(ElectionResultCounty.candidate)
    )

    # Apply filters
    if county_code:
        county = db.query(County).filter(County.code == county_code).first()
        if not county:
            raise HTTPException(status_code=404, detail=f"County '{county_code}' not found")
        query = query.filter(ElectionResultCounty.county_id == county.id)

    if candidate_id:
        query = query.filter(ElectionResultCounty.candidate_id == candidate_id)

    results = query.all()

    # Calculate summary statistics
    total_registered = db.query(func.sum(ElectionResultCounty.registered_voters)).filter(
        ElectionResultCounty.election_id == election_id
    ).scalar() or 0

    total_votes_cast = db.query(func.sum(ElectionResultCounty.total_votes_cast)).filter(
        ElectionResultCounty.election_id == election_id
    ).scalar() or 0

    # Get candidate vote totals
    candidate_totals = db.query(
        Candidate.id,
        Candidate.name,
        Candidate.party,
        func.sum(ElectionResultCounty.votes).label('total_votes')
    ).join(
        ElectionResultCounty, ElectionResultCounty.candidate_id == Candidate.id
    ).filter(
        ElectionResultCounty.election_id == election_id
    ).group_by(
        Candidate.id, Candidate.name, Candidate.party
    ).order_by(
        desc('total_votes')
    ).all()

    # Format results
    formatted_results = []
    for result in results:
        formatted_results.append({
            "id": result.id,
            "county": {
                "code": result.county.code,
                "name": result.county.name
            },
            "candidate": {
                "id": result.candidate.id,
                "name": result.candidate.name,
                "party": result.candidate.party
            },
            "votes": result.votes,
            "total_votes_cast": result.total_votes_cast,
            "registered_voters": result.registered_voters,
            "turnout_percentage": float(result.turnout_percentage) if result.turnout_percentage else None
        })

    return {
        "election": {
            "id": election.id,
            "year": election.year,
            "type": election.election_type,
            "date": election.election_date.isoformat() if election.election_date else None,
            "description": election.description
        },
        "summary": {
            "total_registered_voters": total_registered,
            "total_votes_cast": total_votes_cast,
            "national_turnout_percentage": (total_votes_cast / total_registered * 100) if total_registered > 0 else 0,
            "candidate_totals": [
                {
                    "candidate_id": c.id,
                    "name": c.name,
                    "party": c.party,
                    "total_votes": c.total_votes,
                    "percentage": (c.total_votes / total_votes_cast * 100) if total_votes_cast > 0 else 0
                }
                for c in candidate_totals
            ]
        },
        "results": formatted_results
    }


@router.get("/{election_id}/candidates", response_model=List[CandidateSchema])
async def get_election_candidates(
    election_id: int,
    db: Session = Depends(get_db)
):
    """
    Get all candidates for a specific election

    Args:
        election_id: Election ID

    Returns:
        List of candidates
    """
    # Verify election exists
    election = db.query(Election).filter(Election.id == election_id).first()
    if not election:
        raise HTTPException(status_code=404, detail=f"Election {election_id} not found")

    candidates = db.query(Candidate).filter(Candidate.election_id == election_id).all()

    return candidates


@router.post("/{election_id}/results", status_code=201)
async def add_election_result(
    election_id: int,
    result_data: ElectionResultCreate,
    db: Session = Depends(get_db)
):
    """
    Add a single election result

    Args:
        election_id: Election ID
        result_data: Result information

    Returns:
        Created result
    """
    # Verify election exists
    election = db.query(Election).filter(Election.id == election_id).first()
    if not election:
        raise HTTPException(status_code=404, detail=f"Election {election_id} not found")

    # Verify county exists
    county = db.query(County).filter(County.id == result_data.county_id).first()
    if not county:
        raise HTTPException(status_code=404, detail=f"County {result_data.county_id} not found")

    # Verify candidate exists
    candidate = db.query(Candidate).filter(Candidate.id == result_data.candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail=f"Candidate {result_data.candidate_id} not found")

    # Check if result already exists
    existing = db.query(ElectionResultCounty).filter(
        ElectionResultCounty.election_id == election_id,
        ElectionResultCounty.county_id == result_data.county_id,
        ElectionResultCounty.candidate_id == result_data.candidate_id
    ).first()

    if existing:
        # Update existing result
        existing.votes = result_data.votes
        db.commit()
        db.refresh(existing)
        return {"message": "Result updated", "id": existing.id}

    # Create new result
    new_result = ElectionResultCounty(
        election_id=election_id,
        county_id=result_data.county_id,
        candidate_id=result_data.candidate_id,
        votes=result_data.votes
    )

    db.add(new_result)
    db.commit()
    db.refresh(new_result)

    return {"message": "Result created", "id": new_result.id}


@router.post("/import")
async def import_election_data(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Import election data from CSV or JSON file

    CSV Format:
        election_year,county_code,candidate_name,party,position,votes

    JSON Format:
        [
            {
                "election_year": 2022,
                "county_code": "001",
                "candidate_name": "William Ruto",
                "party": "UDA",
                "position": "President",
                "votes": 7176141
            },
            ...
        ]

    Returns:
        Import results with statistics
    """
    errors = []
    records_imported = 0
    candidates_created = 0
    elections_created = 0

    try:
        # Read file content
        content = await file.read()

        # Determine file type and parse
        if file.filename.endswith('.csv'):
            # Parse CSV
            csv_content = content.decode('utf-8')
            csv_reader = csv.DictReader(io.StringIO(csv_content))
            records = list(csv_reader)
        elif file.filename.endswith('.json'):
            # Parse JSON
            records = json.loads(content.decode('utf-8'))
        else:
            raise HTTPException(
                status_code=400,
                detail="Unsupported file format. Use CSV or JSON"
            )

        # Process each record
        for idx, record in enumerate(records, start=1):
            try:
                # Extract data
                election_year = int(record.get('election_year', 0))
                county_code = record.get('county_code', '').strip()
                candidate_name = record.get('candidate_name', '').strip()
                party = record.get('party', '').strip()
                position = record.get('position', 'President').strip()
                votes = int(record.get('votes', 0))

                # Validate required fields
                if not all([election_year, county_code, candidate_name, party, votes >= 0]):
                    errors.append(f"Row {idx}: Missing required fields")
                    continue

                # Get or create election
                election = db.query(Election).filter(
                    Election.year == election_year
                ).first()

                if not election:
                    # Create election
                    election = Election(
                        year=election_year,
                        election_type="General",
                        election_date=datetime(election_year, 8, 9).date(),
                        description=f"{election_year} General Election"
                    )
                    db.add(election)
                    db.flush()
                    elections_created += 1

                # Get county
                county = db.query(County).filter(County.code == county_code).first()
                if not county:
                    errors.append(f"Row {idx}: County code '{county_code}' not found")
                    continue

                # Get or create candidate
                candidate = db.query(Candidate).filter(
                    Candidate.election_id == election.id,
                    Candidate.name == candidate_name,
                    Candidate.party == party
                ).first()

                if not candidate:
                    candidate = Candidate(
                        election_id=election.id,
                        name=candidate_name,
                        party=party,
                        position=position
                    )
                    db.add(candidate)
                    db.flush()
                    candidates_created += 1

                # Check if result already exists
                existing_result = db.query(ElectionResultCounty).filter(
                    ElectionResultCounty.election_id == election.id,
                    ElectionResultCounty.county_id == county.id,
                    ElectionResultCounty.candidate_id == candidate.id
                ).first()

                if existing_result:
                    # Update existing
                    existing_result.votes = votes
                else:
                    # Create new result
                    result = ElectionResultCounty(
                        election_id=election.id,
                        county_id=county.id,
                        candidate_id=candidate.id,
                        votes=votes
                    )
                    db.add(result)

                records_imported += 1

            except Exception as e:
                errors.append(f"Row {idx}: {str(e)}")
                continue

        # Commit all changes
        db.commit()

        return {
            "success": True,
            "message": f"Import completed successfully",
            "records_imported": records_imported,
            "candidates_created": candidates_created,
            "elections_created": elections_created,
            "errors": errors if errors else None
        }

    except Exception as e:
        db.rollback()
        return {
            "success": False,
            "message": f"Import failed: {str(e)}",
            "records_imported": 0,
            "errors": [str(e)]
        }

