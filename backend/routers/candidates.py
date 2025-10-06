"""
Candidate management API endpoints
Allows dynamic creation, editing, and deletion of candidates
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime

from database import get_db
from models import Candidate, County, Constituency, Ward

router = APIRouter(prefix="/candidates", tags=["candidates"])


# Pydantic schemas
class CandidateCreate(BaseModel):
    """Schema for creating a new candidate"""
    name: str = Field(..., min_length=1, max_length=200, description="Candidate full name")
    party: str = Field(..., min_length=1, max_length=200, description="Political party")
    position: str = Field(default="President", description="Position: President, Governor, MP, MCA, Senator")
    county_id: Optional[int] = Field(None, description="County ID (required for Governor)")
    constituency_id: Optional[int] = Field(None, description="Constituency ID (required for MP)")
    ward_id: Optional[int] = Field(None, description="Ward ID (required for MCA)")

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Raila Odinga",
                "party": "Azimio",
                "position": "President"
            }
        }


class CandidateUpdate(BaseModel):
    """Schema for updating a candidate"""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    party: Optional[str] = Field(None, min_length=1, max_length=200)
    position: Optional[str] = None
    county_id: Optional[int] = None
    constituency_id: Optional[int] = None
    ward_id: Optional[int] = None

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Raila Amollo Odinga",
                "party": "Azimio la Umoja"
            }
        }


class CandidateResponse(BaseModel):
    """Schema for candidate response"""
    id: int
    name: str
    party: str
    position: str
    county_id: Optional[int] = None
    constituency_id: Optional[int] = None
    ward_id: Optional[int] = None

    class Config:
        from_attributes = True


# API Endpoints

@router.get("/", response_model=List[CandidateResponse])
async def get_all_candidates(
    position: Optional[str] = Query(None, description="Filter by position"),
    db: Session = Depends(get_db)
):
    """
    Get all candidates
    
    Args:
        position: Optional filter by position (e.g., "President")
        
    Returns:
        List of all candidates
    """
    query = db.query(Candidate)
    
    if position:
        query = query.filter(Candidate.position == position)
    
    candidates = query.order_by(Candidate.name).all()
    return candidates


@router.get("/{candidate_id}", response_model=CandidateResponse)
async def get_candidate(
    candidate_id: int,
    db: Session = Depends(get_db)
):
    """
    Get a specific candidate by ID
    
    Args:
        candidate_id: Candidate ID
        
    Returns:
        Candidate details
    """
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    
    if not candidate:
        raise HTTPException(status_code=404, detail=f"Candidate with ID {candidate_id} not found")
    
    return candidate


@router.post("/", response_model=CandidateResponse, status_code=201)
async def create_candidate(
    candidate_data: CandidateCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new candidate

    Args:
        candidate_data: Candidate information

    Returns:
        Created candidate
    """
    # Validate position-specific requirements
    position_lower = candidate_data.position.lower()

    if position_lower == 'governor':
        if not candidate_data.county_id:
            raise HTTPException(
                status_code=400,
                detail="County ID is required for Governor candidates"
            )
        # Verify county exists
        county = db.query(County).filter(County.id == candidate_data.county_id).first()
        if not county:
            raise HTTPException(
                status_code=404,
                detail=f"County with ID {candidate_data.county_id} not found"
            )

    elif position_lower == 'mp':
        if not candidate_data.constituency_id:
            raise HTTPException(
                status_code=400,
                detail="Constituency ID is required for MP candidates"
            )
        # Verify constituency exists
        constituency = db.query(Constituency).filter(Constituency.id == candidate_data.constituency_id).first()
        if not constituency:
            raise HTTPException(
                status_code=404,
                detail=f"Constituency with ID {candidate_data.constituency_id} not found"
            )

    elif position_lower == 'mca':
        if not candidate_data.ward_id:
            raise HTTPException(
                status_code=400,
                detail="Ward ID is required for MCA candidates"
            )
        # Verify ward exists
        ward = db.query(Ward).filter(Ward.id == candidate_data.ward_id).first()
        if not ward:
            raise HTTPException(
                status_code=404,
                detail=f"Ward with ID {candidate_data.ward_id} not found"
            )

    # Check if candidate already exists
    existing = db.query(Candidate).filter(
        Candidate.name == candidate_data.name,
        Candidate.party == candidate_data.party,
        Candidate.position == candidate_data.position
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Candidate '{candidate_data.name}' from '{candidate_data.party}' for position '{candidate_data.position}' already exists"
        )

    # Create new candidate
    new_candidate = Candidate(
        name=candidate_data.name,
        party=candidate_data.party,
        position=candidate_data.position,
        county_id=candidate_data.county_id,
        constituency_id=candidate_data.constituency_id,
        ward_id=candidate_data.ward_id
    )

    db.add(new_candidate)
    db.commit()
    db.refresh(new_candidate)

    return new_candidate


@router.put("/{candidate_id}", response_model=CandidateResponse)
async def update_candidate(
    candidate_id: int,
    candidate_data: CandidateUpdate,
    db: Session = Depends(get_db)
):
    """
    Update an existing candidate

    Args:
        candidate_id: Candidate ID
        candidate_data: Updated candidate information

    Returns:
        Updated candidate
    """
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()

    if not candidate:
        raise HTTPException(status_code=404, detail=f"Candidate with ID {candidate_id} not found")

    # Update fields if provided
    if candidate_data.name is not None:
        candidate.name = candidate_data.name
    if candidate_data.party is not None:
        candidate.party = candidate_data.party
    if candidate_data.position is not None:
        candidate.position = candidate_data.position

    # Update geographic fields
    if candidate_data.county_id is not None:
        if candidate_data.county_id > 0:
            # Verify county exists
            county = db.query(County).filter(County.id == candidate_data.county_id).first()
            if not county:
                raise HTTPException(
                    status_code=404,
                    detail=f"County with ID {candidate_data.county_id} not found"
                )
        candidate.county_id = candidate_data.county_id if candidate_data.county_id > 0 else None

    if candidate_data.constituency_id is not None:
        if candidate_data.constituency_id > 0:
            # Verify constituency exists
            constituency = db.query(Constituency).filter(Constituency.id == candidate_data.constituency_id).first()
            if not constituency:
                raise HTTPException(
                    status_code=404,
                    detail=f"Constituency with ID {candidate_data.constituency_id} not found"
                )
        candidate.constituency_id = candidate_data.constituency_id if candidate_data.constituency_id > 0 else None

    if candidate_data.ward_id is not None:
        if candidate_data.ward_id > 0:
            # Verify ward exists
            ward = db.query(Ward).filter(Ward.id == candidate_data.ward_id).first()
            if not ward:
                raise HTTPException(
                    status_code=404,
                    detail=f"Ward with ID {candidate_data.ward_id} not found"
                )
        candidate.ward_id = candidate_data.ward_id if candidate_data.ward_id > 0 else None

    db.commit()
    db.refresh(candidate)

    return candidate


@router.delete("/{candidate_id}", status_code=204)
async def delete_candidate(
    candidate_id: int,
    db: Session = Depends(get_db)
):
    """
    Delete a candidate
    
    WARNING: This will also delete all associated forecasts!
    
    Args:
        candidate_id: Candidate ID
    """
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    
    if not candidate:
        raise HTTPException(status_code=404, detail=f"Candidate with ID {candidate_id} not found")
    
    # Delete candidate (cascades to forecasts)
    db.delete(candidate)
    db.commit()
    
    return None


@router.get("/{candidate_id}/stats")
async def get_candidate_stats(
    candidate_id: int,
    election_year: int = Query(2027, description="Election year"),
    db: Session = Depends(get_db)
):
    """
    Get statistics for a candidate
    
    Args:
        candidate_id: Candidate ID
        election_year: Election year
        
    Returns:
        Candidate statistics including vote totals, counties leading, etc.
    """
    from models import ForecastCounty, ForecastRun, Election, County
    from sqlalchemy import func
    
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    
    if not candidate:
        raise HTTPException(status_code=404, detail=f"Candidate with ID {candidate_id} not found")
    
    # Get latest forecast run for the election year
    latest_run = db.query(ForecastRun).join(Election).filter(
        Election.year == election_year
    ).order_by(ForecastRun.run_timestamp.desc()).first()
    
    if not latest_run:
        raise HTTPException(status_code=404, detail=f"No forecast found for {election_year}")
    
    # Get candidate's forecasts
    forecasts = db.query(ForecastCounty).filter(
        ForecastCounty.forecast_run_id == latest_run.id,
        ForecastCounty.candidate_id == candidate_id
    ).all()
    
    if not forecasts:
        return {
            "candidate_id": candidate_id,
            "candidate_name": candidate.name,
            "party": candidate.party,
            "total_votes": 0,
            "vote_share": 0,
            "counties_leading": 0,
            "counties_total": 0
        }
    
    # Calculate total votes
    total_votes = sum([f.predicted_votes for f in forecasts])
    
    # Get national total
    national_total = db.query(func.sum(ForecastCounty.predicted_votes)).filter(
        ForecastCounty.forecast_run_id == latest_run.id
    ).scalar() or 1
    
    vote_share = (total_votes / national_total * 100) if national_total > 0 else 0
    
    # Count counties where this candidate is leading
    counties_leading = 0
    for forecast in forecasts:
        # Get all candidates' votes in this county
        county_forecasts = db.query(ForecastCounty).filter(
            ForecastCounty.forecast_run_id == latest_run.id,
            ForecastCounty.county_id == forecast.county_id
        ).all()
        
        # Check if this candidate has the most votes
        max_votes = max([f.predicted_votes for f in county_forecasts])
        if forecast.predicted_votes == max_votes:
            counties_leading += 1
    
    return {
        "candidate_id": candidate_id,
        "candidate_name": candidate.name,
        "party": candidate.party,
        "total_votes": total_votes,
        "vote_share": round(vote_share, 2),
        "counties_leading": counties_leading,
        "counties_total": len(forecasts)
    }

