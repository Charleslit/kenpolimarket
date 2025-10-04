"""
Counties API Router
Endpoints for county data and demographics
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from database import get_db
from models import County, CountyDemographics, CountyEthnicityAggregate, ElectionResultCounty
from schemas import (
    CountyListSchema,
    CountyDetailSchema,
    CountyDemographicsSchema,
    CountyEthnicityAggregateSchema
)

router = APIRouter(prefix="/counties", tags=["counties"])


@router.get("/", response_model=List[CountyListSchema])
async def list_counties(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=100, description="Maximum number of records to return"),
    db: Session = Depends(get_db)
):
    """
    Get list of all counties

    Returns county-level data including:
    - Basic information (code, name)
    - Population statistics (2019 census)
    - Registered voters (2022)

    **Privacy Note**: Only aggregate county-level data is returned.
    """
    counties = db.query(County).offset(skip).limit(limit).all()
    return counties


@router.get("/{code}", response_model=CountyDetailSchema)
async def get_county(
    code: str,
    include_demographics: bool = Query(True, description="Include demographic data"),
    include_ethnicity: bool = Query(True, description="Include ethnicity aggregates"),
    db: Session = Depends(get_db)
):
    """
    Get detailed information for a specific county

    Args:
        code: County code (e.g., "001" for Mombasa, "047" for Nairobi)
        include_demographics: Include census demographics
        include_ethnicity: Include ethnicity aggregates (privacy-preserving)

    Returns:
        Detailed county information including:
        - Basic county data
        - Demographics (if requested)
        - Ethnicity aggregates (if requested, minimum 10 individuals per group)

    **Privacy Note**: Ethnicity data is aggregated at county level only,
    with minimum 10 individuals per group to protect privacy.
    """
    # Build query with optional eager loading
    query = db.query(County).filter(County.code == code)

    if include_demographics:
        query = query.options(joinedload(County.demographics))

    if include_ethnicity:
        query = query.options(joinedload(County.ethnicity_aggregates))

    county = query.first()

    if not county:
        raise HTTPException(
            status_code=404,
            detail=f"County with code '{code}' not found"
        )

    return county


@router.get("/{code}/demographics", response_model=List[CountyDemographicsSchema])
async def get_county_demographics(
    code: str,
    census_year: Optional[int] = Query(None, description="Filter by census year"),
    db: Session = Depends(get_db)
):
    """
    Get demographic data for a specific county

    Args:
        code: County code
        census_year: Optional filter by census year (e.g., 2019)

    Returns:
        List of demographic records for the county
    """
    # Get county
    county = db.query(County).filter(County.code == code).first()
    if not county:
        raise HTTPException(status_code=404, detail=f"County '{code}' not found")

    # Query demographics
    query = db.query(CountyDemographics).filter(CountyDemographics.county_id == county.id)

    if census_year:
        query = query.filter(CountyDemographics.census_year == census_year)

    demographics = query.all()

    return demographics


@router.get("/{code}/ethnicity", response_model=List[CountyEthnicityAggregateSchema])
async def get_county_ethnicity(
    code: str,
    census_year: Optional[int] = Query(None, description="Filter by census year"),
    min_percentage: Optional[float] = Query(None, ge=0, le=100, description="Minimum percentage threshold"),
    db: Session = Depends(get_db)
):
    """
    Get ethnicity aggregates for a specific county (PRIVACY-PRESERVING)

    Args:
        code: County code
        census_year: Optional filter by census year
        min_percentage: Optional minimum percentage threshold

    Returns:
        List of ethnicity aggregates (minimum 10 individuals per group)

    **Privacy Guarantee**: All returned aggregates have at least 10 individuals.
    County-level only - no sub-county or individual-level data.
    """
    # Get county
    county = db.query(County).filter(County.code == code).first()
    if not county:
        raise HTTPException(status_code=404, detail=f"County '{code}' not found")

    # Query ethnicity aggregates
    query = db.query(CountyEthnicityAggregate).filter(
        CountyEthnicityAggregate.county_id == county.id
    )

    if census_year:
        query = query.filter(CountyEthnicityAggregate.census_year == census_year)

    if min_percentage:
        query = query.filter(CountyEthnicityAggregate.percentage >= min_percentage)

    # Order by percentage descending
    query = query.order_by(CountyEthnicityAggregate.percentage.desc())

    aggregates = query.all()

    return aggregates


@router.get("/{code}/election-history")
async def get_county_election_history(
    code: str,
    db: Session = Depends(get_db)
):
    """
    Get election history for a specific county

    Args:
        code: County code

    Returns:
        Historical election results for the county across all elections
    """
    # Get county
    county = db.query(County).filter(County.code == code).first()
    if not county:
        raise HTTPException(status_code=404, detail=f"County '{code}' not found")

    # Get election results with related data
    results = db.query(ElectionResultCounty).filter(
        ElectionResultCounty.county_id == county.id
    ).options(
        joinedload(ElectionResultCounty.election),
        joinedload(ElectionResultCounty.candidate)
    ).all()

    # Group by election
    elections_data = {}
    for result in results:
        election_id = result.election_id
        if election_id not in elections_data:
            elections_data[election_id] = {
                "election": {
                    "id": result.election.id,
                    "year": result.election.year,
                    "type": result.election.election_type,
                    "date": result.election.election_date.isoformat() if result.election.election_date else None
                },
                "registered_voters": result.registered_voters,
                "total_votes_cast": result.total_votes_cast,
                "turnout_percentage": float(result.turnout_percentage) if result.turnout_percentage else None,
                "candidates": []
            }

        elections_data[election_id]["candidates"].append({
            "id": result.candidate.id,
            "name": result.candidate.name,
            "party": result.candidate.party,
            "votes": result.votes,
            "percentage": (result.votes / result.total_votes_cast * 100) if result.total_votes_cast else None
        })

    return {
        "county": {
            "code": county.code,
            "name": county.name
        },
        "elections": list(elections_data.values())
    }

