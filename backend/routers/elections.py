"""
Elections API Router
Endpoints for election data and results
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc
from typing import List, Optional
from database import get_db
from models import Election, Candidate, ElectionResultCounty, County
from schemas import (
    ElectionBaseSchema,
    ElectionDetailSchema,
    ElectionResultCountySchema,
    CandidateSchema
)

router = APIRouter(prefix="/elections", tags=["elections"])


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

