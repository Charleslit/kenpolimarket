"""
Forecasts API Router
Endpoints for accessing election forecasts
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime

from database import get_db
from models import ForecastRun, ForecastCounty, County, Candidate, Election
from schemas import (
    ForecastRunSchema,
    ForecastCountySchema,
    ForecastRunDetailSchema
)

router = APIRouter(prefix="/forecasts", tags=["forecasts"])


@router.get("/", response_model=List[ForecastRunSchema])
async def list_forecast_runs(
    skip: int = 0,
    limit: int = 100,
    election_year: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    List all forecast runs

    Query parameters:
    - skip: Number of records to skip (pagination)
    - limit: Maximum number of records to return
    - election_year: Filter by election year
    """
    query = db.query(ForecastRun).options(joinedload(ForecastRun.election))

    if election_year:
        query = query.join(Election).filter(Election.year == election_year)

    forecast_runs = query.order_by(ForecastRun.run_timestamp.desc()).offset(skip).limit(limit).all()

    return forecast_runs


@router.get("/latest", response_model=ForecastRunSchema)
async def get_latest_forecast(
    election_year: Optional[int] = Query(2027, description="Election year to get forecast for"),
    db: Session = Depends(get_db)
):
    """
    Get the most recent forecast run for a specific election year
    """
    query = db.query(ForecastRun).options(joinedload(ForecastRun.election))

    if election_year:
        query = query.join(Election).filter(Election.year == election_year)

    forecast_run = query.order_by(ForecastRun.run_timestamp.desc()).first()

    if not forecast_run:
        raise HTTPException(
            status_code=404,
            detail=f"No forecast found for election year {election_year}"
        )

    return forecast_run


@router.get("/{forecast_run_id}", response_model=ForecastRunDetailSchema)
async def get_forecast_run(
    forecast_run_id: str,
    db: Session = Depends(get_db)
):
    """
    Get detailed information about a specific forecast run
    """
    forecast_run = db.query(ForecastRun).options(
        joinedload(ForecastRun.election),
        joinedload(ForecastRun.county_forecasts)
    ).filter(ForecastRun.id == forecast_run_id).first()

    if not forecast_run:
        raise HTTPException(
            status_code=404,
            detail=f"Forecast run with ID '{forecast_run_id}' not found"
        )

    return forecast_run


@router.get("/{forecast_run_id}/counties", response_model=List[ForecastCountySchema])
async def get_forecast_counties(
    forecast_run_id: str,
    county_code: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get county-level forecasts for a specific forecast run

    Query parameters:
    - county_code: Filter by specific county code
    """
    query = db.query(ForecastCounty).options(
        joinedload(ForecastCounty.county),
        joinedload(ForecastCounty.candidate)
    ).filter(ForecastCounty.forecast_run_id == forecast_run_id)

    if county_code:
        query = query.join(County).filter(County.code == county_code)

    forecasts = query.all()

    if not forecasts:
        raise HTTPException(
            status_code=404,
            detail=f"No forecasts found for forecast run '{forecast_run_id}'"
        )

    return forecasts


@router.get("/county/{county_code}/latest", response_model=List[ForecastCountySchema])
async def get_county_latest_forecast(
    county_code: str,
    election_year: int = Query(2027, description="Election year"),
    db: Session = Depends(get_db)
):
    """
    Get the latest forecast for a specific county
    """
    # First, get the latest forecast run for the election year
    latest_run = db.query(ForecastRun).join(Election).filter(
        Election.year == election_year
    ).order_by(ForecastRun.run_timestamp.desc()).first()

    if not latest_run:
        raise HTTPException(
            status_code=404,
            detail=f"No forecast found for election year {election_year}"
        )

    # Get forecasts for this county
    forecasts = db.query(ForecastCounty).options(
        joinedload(ForecastCounty.county),
        joinedload(ForecastCounty.candidate)
    ).join(County).filter(
        ForecastCounty.forecast_run_id == latest_run.id,
        County.code == county_code
    ).all()

    if not forecasts:
        raise HTTPException(
            status_code=404,
            detail=f"No forecasts found for county '{county_code}'"
        )

    return forecasts


@router.get("/summary/national")
async def get_national_forecast_summary(
    election_year: int = Query(2027, description="Election year"),
    db: Session = Depends(get_db)
):
    """
    Get national-level forecast summary (aggregated from county forecasts)
    """
    # Get latest forecast run
    latest_run = db.query(ForecastRun).join(Election).filter(
        Election.year == election_year
    ).order_by(ForecastRun.run_timestamp.desc()).first()

    if not latest_run:
        raise HTTPException(
            status_code=404,
            detail=f"No forecast found for election year {election_year}"
        )

    # Get all county forecasts for this run
    forecasts = db.query(ForecastCounty).options(
        joinedload(ForecastCounty.candidate)
    ).filter(ForecastCounty.forecast_run_id == latest_run.id).all()

    # Aggregate by candidate
    candidate_totals = {}
    total_votes = 0

    for forecast in forecasts:
        candidate_name = forecast.candidate.name
        party = forecast.candidate.party

        if candidate_name not in candidate_totals:
            candidate_totals[candidate_name] = {
                'candidate_name': candidate_name,
                'party': party,
                'predicted_votes': 0,
                'counties_won': 0
            }

        candidate_totals[candidate_name]['predicted_votes'] += forecast.predicted_votes or 0
        total_votes += forecast.predicted_votes or 0

    # Calculate vote shares
    summary = []
    for candidate_name, data in candidate_totals.items():
        vote_share = (data['predicted_votes'] / total_votes * 100) if total_votes > 0 else 0
        summary.append({
            'candidate_name': candidate_name,
            'party': data['party'],
            'predicted_votes': data['predicted_votes'],
            'predicted_vote_share': round(vote_share, 2)
        })

    # Sort by vote share descending
    summary.sort(key=lambda x: x['predicted_vote_share'], reverse=True)

    return {
        'forecast_run_id': str(latest_run.id),
        'election_year': election_year,
        'model_name': latest_run.model_name,
        'model_version': latest_run.model_version,
        'run_timestamp': latest_run.run_timestamp,
        'total_predicted_votes': total_votes,
        'candidates': summary
    }

