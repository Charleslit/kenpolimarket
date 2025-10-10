"""
Forecasts API Router
Endpoints for accessing election forecasts
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_
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
from pydantic import BaseModel, Field
from decimal import Decimal
import json



@router.get("/", response_model=List[ForecastRunSchema])
async def list_forecast_runs(
    skip: int = 0,
    limit: int = 100,
    election_year: Optional[int] = None,
    election_type: Optional[str] = None,
    visibility: Optional[str] = Query(None, description="Comma-separated: draft,published,archived"),
    official_only: Optional[bool] = Query(None, description="If true, only official runs"),
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

    if election_year or election_type:
        query = query.join(Election)
        if election_year:
            query = query.filter(Election.year == election_year)
        if election_type:
            query = query.filter(Election.election_type == election_type)

    # Visibility / official filtering
    if official_only:
        query = query.filter(ForecastRun.is_official == True)
    elif visibility:
        vis_list = [v.strip() for v in visibility.split(',') if v.strip()]
        if vis_list:
            query = query.filter(ForecastRun.visibility.in_(vis_list))
    else:
        # Default public: published or official
        query = query.filter(or_(ForecastRun.is_official == True, ForecastRun.visibility == 'published'))

    forecast_runs = query.order_by(ForecastRun.run_timestamp.desc()).offset(skip).limit(limit).all()

    return forecast_runs


@router.get("/latest", response_model=ForecastRunSchema)
async def get_latest_forecast(
    election_year: Optional[int] = Query(2027, description="Election year to get forecast for"),
    election_type: Optional[str] = Query(None, description="Election type filter, e.g., 'Governor'"),
    official: bool = Query(True, description="Prefer official baseline if available"),
    db: Session = Depends(get_db)
):
    """
    Get the default forecast run for a specific election year/type.
    Default behavior returns the official baseline if available; otherwise latest published;
    otherwise falls back to any latest run.
    """
    base_q = db.query(ForecastRun).options(joinedload(ForecastRun.election)).join(Election)
    if election_year:
        base_q = base_q.filter(Election.year == election_year)
    if election_type:
        base_q = base_q.filter(Election.election_type == election_type)

    if official:
        fr = base_q.filter(ForecastRun.is_official == True).order_by(ForecastRun.run_timestamp.desc()).first()
        if fr:
            return fr
    # fallback to published
    fr = base_q.filter(ForecastRun.visibility == 'published').order_by(ForecastRun.run_timestamp.desc()).first()
    if fr:
        return fr
    # final fallback to any run
    fr = base_q.order_by(ForecastRun.run_timestamp.desc()).first()
    if not fr:
        raise HTTPException(status_code=404, detail=f"No forecast found for election year {election_year}")
    return fr


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
    election_type: str | None = Query(None, description="Election type filter, e.g., 'Governor'"),
    official: bool = Query(True, description="Prefer official baseline if available"),
    db: Session = Depends(get_db)
):
    """
    Get the latest forecast for a specific county
    """
    # First, get the default forecast run for the election year (optionally filtered by type)
    q = db.query(ForecastRun).join(Election).filter(Election.year == election_year)
    if election_type:
        q = q.filter(Election.election_type == election_type)
    if official:
        latest_run = q.filter(ForecastRun.is_official == True).order_by(ForecastRun.run_timestamp.desc()).first()
        if not latest_run:
            latest_run = q.filter(ForecastRun.visibility == 'published').order_by(ForecastRun.run_timestamp.desc()).first()
    else:
        latest_run = q.filter(ForecastRun.visibility == 'published').order_by(ForecastRun.run_timestamp.desc()).first()
    if not latest_run:
        latest_run = q.order_by(ForecastRun.run_timestamp.desc()).first()

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
    election_type: str | None = Query(None, description="Election type filter, e.g., 'Governor'"),
    official: bool = Query(True, description="Prefer official baseline if available"),
    db: Session = Depends(get_db)
):
    """
    Get national-level forecast summary (aggregated from county forecasts)
    """
    # Get default forecast run (optionally filtered by type)
    q = db.query(ForecastRun).join(Election).filter(Election.year == election_year)
    if election_type:
        q = q.filter(Election.election_type == election_type)
    if official:
        latest_run = q.filter(ForecastRun.is_official == True).order_by(ForecastRun.run_timestamp.desc()).first()
        if not latest_run:
            latest_run = q.filter(ForecastRun.visibility == 'published').order_by(ForecastRun.run_timestamp.desc()).first()
    else:
        latest_run = q.filter(ForecastRun.visibility == 'published').order_by(ForecastRun.run_timestamp.desc()).first()
    if not latest_run:
        latest_run = q.order_by(ForecastRun.run_timestamp.desc()).first()

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


# ------------------------------
# County scenario seeding endpoint
# ------------------------------
class CountyScenarioCandidate(BaseModel):
    name: str
    party: Optional[str] = None
    votes: Optional[int] = None
    predicted_vote_share: Optional[float] = None

class CountyScenarioRequest(BaseModel):
    county_code: str = Field(..., description="County code, e.g., '45' for Kisii")
    election_year: int = Field(2027, description="Election year")
    election_type: str = Field("Governor", description="Election type, e.g., Governor")
    scenario_name: str = Field("County Scenario", description="Scenario name")
    registered_voters: int = Field(..., description="Registered voters in county")
    turnout: float = Field(..., description="Turnout percentage (0-100)")
    candidates: List[CountyScenarioCandidate]

@router.post("/scenario/county")
async def seed_county_scenario(
    payload: CountyScenarioRequest,
    db: Session = Depends(get_db)
):
    """
    Create a forecast run for a single county (e.g., Kisii) with provided candidate votes.
    - Ensures election exists (by year + type)
    - Ensures candidates exist (by name + election), creating if needed
    - Creates a new ForecastRun and ForecastCounty rows for that county only
    Returns the created run and forecast summaries.
    """
    # 1) Ensure election exists
    election = db.query(Election).filter(
        Election.year == payload.election_year,
        Election.election_type == payload.election_type
    ).first()
    if not election:
        election = Election(
            year=payload.election_year,
            election_type=payload.election_type,
            election_date=datetime(payload.election_year, 8, 8),
            description=f"{payload.election_type} Election {payload.election_year}"
        )
        db.add(election)
        db.commit()
        db.refresh(election)

    # 2) Resolve county
    county = db.query(County).filter(County.code == payload.county_code).first()
    if not county:
        raise HTTPException(status_code=404, detail=f"County code '{payload.county_code}' not found")

    # 3) Compute totals and shares
    total_votes = max(0, int(round(payload.registered_voters * (payload.turnout / 100.0))))

    # Determine if payload uses vote shares or raw votes
    uses_shares = all((c.predicted_vote_share is not None) for c in payload.candidates)

    if uses_shares:
        # Validate shares are non-negative
        if all((c.predicted_vote_share or 0) >= 0 for c in payload.candidates):
            scale = 1.0
        else:
            raise HTTPException(status_code=400, detail="predicted_vote_share must be >= 0")
    else:
        provided_votes = sum((c.votes or 0) for c in payload.candidates)
        if provided_votes <= 0:
            raise HTTPException(status_code=400, detail="Sum of candidate votes must be > 0")
        # Normalize to turnout total to respect requested turnout
        scale = (total_votes / provided_votes) if provided_votes > 0 else 0

    # 4) Create or fetch candidates
    created_candidates = {}
    position = payload.election_type.lower()
    for c in payload.candidates:
        cand = db.query(Candidate).filter(
            Candidate.election_id == election.id,
            Candidate.name == c.name
        ).first()
        if not cand:
            cand = Candidate(
                election_id=election.id,
                name=c.name,
                party=c.party,
                position=position,
                county_id=county.id if position == 'governor' else None
            )
            db.add(cand)
            db.commit()
            db.refresh(cand)
        created_candidates[c.name] = cand

    # 5) Create forecast run
    run = ForecastRun(
        model_name=f"{payload.scenario_name}",
        model_version="1.0",
        election_id=election.id,
        parameters=json.dumps({
            "county_code": payload.county_code,
            "turnout": payload.turnout,
            "registered_voters": payload.registered_voters,
            "candidates": [{"name": c.name, "party": c.party, "votes": c.votes, "predicted_vote_share": c.predicted_vote_share} for c in payload.candidates]
        }),
        status="completed",
        visibility="draft",
        is_official=False
    )
    db.add(run)
    db.commit()
    db.refresh(run)

    # 6) Insert county forecasts
    created_forecasts = []
    for c in payload.candidates:
        if uses_shares and c.predicted_vote_share is not None:
            share = float(c.predicted_vote_share)
            scaled_votes = int(round(total_votes * (share / 100.0)))
        else:
            scaled_votes = int(round((c.votes or 0) * scale))
            share = (scaled_votes / total_votes * 100.0) if total_votes > 0 else 0.0
        fc = ForecastCounty(
            forecast_run_id=run.id,
            county_id=county.id,
            candidate_id=created_candidates[c.name].id,
            predicted_vote_share=Decimal(str(round(share, 2))),
            lower_bound_90=Decimal(str(round(max(0.0, share - 3.0), 2))),
            upper_bound_90=Decimal(str(round(min(100.0, share + 3.0), 2))),
            predicted_votes=scaled_votes,
            predicted_turnout=Decimal(str(round(payload.turnout, 2)))
        )
        db.add(fc)
        created_forecasts.append(fc)

    db.commit()

    return {
        "forecast_run_id": str(run.id),
        "election_year": election.year,
        "election_type": election.election_type,
        "county": {"code": county.code, "name": county.name},
        "total_votes": total_votes,
        "forecasts": [
            {
                "candidate": c.name,
                "party": c.party,
                "scaled_votes": int(round(c.votes * scale)),
                "share": round(((c.votes * scale) / total_votes * 100.0) if total_votes else 0.0, 2)
            }
            for c in payload.candidates
        ]
    }




# ------------------------------
# Multi-county scenario run endpoint
# ------------------------------
class MultiCountyCandidate(BaseModel):
    name: str
    party: Optional[str] = None
    votes: Optional[int] = None
    predicted_vote_share: Optional[float] = None

class MultiCountyCountyPayload(BaseModel):
    county_code: str = Field(..., description="County code, e.g., '45' for Kisii")
    registered_voters: int = Field(..., description="Registered voters in county")
    turnout: float = Field(..., description="Turnout percentage (0-100)")
    candidates: List[MultiCountyCandidate]

class MultiCountyRunRequest(BaseModel):
    election_year: int = Field(2027, description="Election year")
    election_type: str = Field("Governor", description="Election type, e.g., Governor, Presidential")
    scenario_name: str = Field("Scenario Run", description="Scenario name to display in UI")
    description: Optional[str] = Field(None, description="Optional description/assumptions JSON or text")
    counties: List[MultiCountyCountyPayload]

@router.post("/scenario/run")
async def seed_multi_county_run(
    payload: MultiCountyRunRequest,
    db: Session = Depends(get_db)
):
    """
    Create a forecast run that includes forecasts for multiple counties at once.
    - Ensures election exists (by year + type)
    - Ensures candidates exist (by name + election), creating if needed
    - Creates a single ForecastRun and ForecastCounty rows per county/candidate
    Returns the created run id and aggregate info.
    """
    # 1) Ensure election exists
    election = db.query(Election).filter(
        Election.year == payload.election_year,
        Election.election_type == payload.election_type
    ).first()
    if not election:
        election = Election(
            year=payload.election_year,
            election_type=payload.election_type,
            election_date=datetime(payload.election_year, 8, 8),
            description=f"{payload.election_type} Election {payload.election_year}"
        )
        db.add(election)
        db.commit()
        db.refresh(election)

    # 2) Create forecast run metadata
    parameters_obj = {
        "scenario_name": payload.scenario_name,
        "description": payload.description,
        "counties": [c.county_code for c in payload.counties],
    }
    run = ForecastRun(
        model_name=payload.scenario_name,
        model_version="1.0",
        election_id=election.id,
        parameters=json.dumps(parameters_obj),
        status="completed",
        visibility="draft",
        is_official=False
    )
    db.add(run)
    db.commit()
    db.refresh(run)

    created_counties = 0
    total_inserted_rows = 0

    # 3) For each county payload, insert forecasts
    position = payload.election_type.lower()
    for county_payload in payload.counties:


        county = db.query(County).filter(County.code == county_payload.county_code).first()
        if not county:
            # skip silently to allow partials, but you could also raise
            continue

        total_votes = max(0, int(round(county_payload.registered_voters * (county_payload.turnout / 100.0))))
        uses_shares = all((c.predicted_vote_share is not None) for c in county_payload.candidates)
        if not uses_shares:
            provided_votes = sum((c.votes or 0) for c in county_payload.candidates)
            if provided_votes <= 0 or total_votes <= 0:
                continue
            scale = (total_votes / provided_votes)
        else:
            if total_votes <= 0:
                continue
            scale = 1.0

        # ensure candidates exist for this election
        candidate_map = {}
        for c in county_payload.candidates:
            cand = db.query(Candidate).filter(
                Candidate.election_id == election.id,
                Candidate.name == c.name
            ).first()
            if not cand:
                cand = Candidate(
                    election_id=election.id,
                    name=c.name,
                    party=c.party,
                    position=position,
                    county_id=county.id if position == 'governor' else None
                )
                db.add(cand)
                db.commit()
                db.refresh(cand)
            candidate_map[c.name] = cand

        # insert ForecastCounty rows per candidate
        for c in county_payload.candidates:
            if uses_shares and c.predicted_vote_share is not None:
                share = float(c.predicted_vote_share)
                scaled_votes = int(round(total_votes * (share / 100.0)))
            else:
                scaled_votes = int(round((c.votes or 0) * scale))
                share = (scaled_votes / total_votes * 100.0) if total_votes > 0 else 0.0
            fc = ForecastCounty(
                forecast_run_id=run.id,
                county_id=county.id,
                candidate_id=candidate_map[c.name].id,
                predicted_vote_share=Decimal(str(round(share, 2))),
                lower_bound_90=Decimal(str(round(max(0.0, share - 3.0), 2))),
                upper_bound_90=Decimal(str(round(min(100.0, share + 3.0), 2))),
                predicted_votes=scaled_votes,
                predicted_turnout=Decimal(str(round(county_payload.turnout, 2)))
            )
            db.add(fc)
            total_inserted_rows += 1

        created_counties += 1

    db.commit()

    return {
        "forecast_run_id": str(run.id),
        "election_year": election.year,
        "election_type": election.election_type,
        "scenario_name": payload.scenario_name,
        "description": payload.description,
        "counties_included": created_counties,
        "rows_created": total_inserted_rows,
    }


# ------------------------------
# Admin: publish/unpublish/official/archive
# ------------------------------
@router.patch("/{forecast_run_id}/publish")
async def publish_run(forecast_run_id: str, db: Session = Depends(get_db)):
    run = db.query(ForecastRun).filter(ForecastRun.id == forecast_run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    run.visibility = 'published'
    run.published_at = datetime.utcnow()
    db.commit()
    db.refresh(run)
    return {"id": str(run.id), "visibility": run.visibility, "published_at": run.published_at}

@router.patch("/{forecast_run_id}/unpublish")
async def unpublish_run(forecast_run_id: str, db: Session = Depends(get_db)):
    run = db.query(ForecastRun).filter(ForecastRun.id == forecast_run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    run.visibility = 'draft'
    run.published_at = None
    if run.is_official:
        run.is_official = False
    db.commit()
    db.refresh(run)
    return {"id": str(run.id), "visibility": run.visibility, "is_official": run.is_official}

@router.patch("/{forecast_run_id}/official")
async def set_official_run(forecast_run_id: str, db: Session = Depends(get_db)):
    run = db.query(ForecastRun).options(joinedload(ForecastRun.election)).filter(ForecastRun.id == forecast_run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    # Unset other officials for this election
    db.query(ForecastRun).filter(
        ForecastRun.election_id == run.election_id,
        ForecastRun.is_official == True
    ).update({ForecastRun.is_official: False})
    # Ensure published visibility
    run.is_official = True
    run.visibility = 'published'
    if not run.published_at:
        run.published_at = datetime.utcnow()
    db.commit()
    db.refresh(run)
    return {"id": str(run.id), "is_official": run.is_official, "visibility": run.visibility}

@router.patch("/{forecast_run_id}/archive")
async def archive_run(forecast_run_id: str, db: Session = Depends(get_db)):
    run = db.query(ForecastRun).filter(ForecastRun.id == forecast_run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    run.visibility = 'archived'
    if run.is_official:
        run.is_official = False
    db.commit()
    db.refresh(run)
    return {"id": str(run.id), "visibility": run.visibility, "is_official": run.is_official}
