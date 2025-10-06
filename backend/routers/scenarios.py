"""
Scenario Calculator API endpoints
Allows users to create "what-if" scenarios by adjusting regional vote shares
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Optional
from pydantic import BaseModel, Field
from datetime import datetime
from decimal import Decimal

from database import get_db
from models import ForecastCounty, ForecastRun, Election, County, Candidate

router = APIRouter(prefix="/scenarios", tags=["scenarios"])


# Regional county mappings
REGIONS = {
    "Mount Kenya": ["22", "12", "21", "19", "18", "20", "14", "13"],  # Kiambu, Meru, Murang'a, Nyeri, Nyandarua, Kirinyaga, Embu, Tharaka Nithi
    "Rift Valley": ["27", "32", "36", "35", "29", "34", "33", "30", "28", "26", "23", "24", "31", "25"],  # Uasin Gishu, Nakuru, Bomet, Kericho, Nandi, Kajiado, Narok, Baringo, Elgeyo Marakwet, Trans Nzoia, Turkana, West Pokot, Laikipia, Samburu
    "Nyanza": ["42", "43", "44", "41", "45", "46"],  # Kisumu, Homa Bay, Migori, Siaya, Kisii, Nyamira
    "Western": ["37", "39", "40", "38"],  # Kakamega, Bungoma, Busia, Vihiga
    "Lower Eastern": ["16", "17", "15"],  # Machakos, Makueni, Kitui
    "Coast": ["1", "3", "2", "6", "4", "5"],  # Mombasa, Kilifi, Kwale, Taita Taveta, Tana River, Lamu
    "Northern": ["9", "8", "7", "10", "11"],  # Mandera, Wajir, Garissa, Marsabit, Isiolo
    "Nairobi": ["47"]  # Nairobi
}


# Pydantic schemas
class RegionalAdjustment(BaseModel):
    """Schema for adjusting vote shares in a region"""
    region: str = Field(..., description="Region name")
    candidate_shares: Dict[str, float] = Field(
        ...,
        description="Candidate name to vote share mapping (must sum to 100)"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "region": "Mount Kenya",
                "candidate_shares": {
                    "William Ruto": 50.0,
                    "Fred Matiang'i": 50.0
                }
            }
        }


class ScenarioRequest(BaseModel):
    """Schema for creating a scenario"""
    name: str = Field(..., min_length=1, max_length=100, description="Scenario name")
    description: Optional[str] = Field(None, description="Scenario description")
    base_forecast_run_id: Optional[str] = Field(None, description="Base forecast run ID (uses latest if not provided)")
    adjustments: List[RegionalAdjustment] = Field(..., description="Regional adjustments")
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "Ruto Wins Back Mount Kenya",
                "description": "What if Ruto regains 50% support in Mount Kenya?",
                "adjustments": [
                    {
                        "region": "Mount Kenya",
                        "candidate_shares": {
                            "William Ruto": 50.0,
                            "Fred Matiang'i": 50.0
                        }
                    }
                ]
            }
        }


class RegionalBreakdown(BaseModel):
    """Schema for regional breakdown in results"""
    region: str
    total_votes: int
    original_results: Dict[str, Dict[str, float]]  # candidate -> {votes, share}
    adjusted_results: Dict[str, Dict[str, float]]  # candidate -> {votes, share}
    changes: Dict[str, float]  # candidate -> change in share


class ScenarioResult(BaseModel):
    """Schema for scenario calculation result"""
    scenario_name: str
    description: Optional[str]
    base_forecast: str
    national_results: Dict[str, Dict[str, float]]  # candidate -> {votes, share, change}
    regional_changes: List[Dict]
    regional_breakdown: List[RegionalBreakdown]  # Enhanced regional details
    winner: str
    margin: float
    total_votes_original: int
    total_votes_adjusted: int

    class Config:
        json_schema_extra = {
            "example": {
                "scenario_name": "Ruto Wins Back Mount Kenya",
                "description": "What if Ruto regains 50% support in Mount Kenya?",
                "base_forecast": "Ruto vs Matiang'i (v4.0)",
                "national_results": {
                    "William Ruto": {
                        "votes": 9500000,
                        "share": 48.5,
                        "change": 7.2
                    },
                    "Fred Matiang'i": {
                        "votes": 10100000,
                        "share": 51.5,
                        "change": -7.2
                    }
                },
                "regional_changes": [],
                "regional_breakdown": [],
                "winner": "Fred Matiang'i",
                "margin": 3.0,
                "total_votes_original": 19600000,
                "total_votes_adjusted": 19600000
            }
        }


# API Endpoints

@router.post("/calculate", response_model=ScenarioResult)
async def calculate_scenario(
    scenario: ScenarioRequest,
    election_year: int = Query(2027, description="Election year"),
    db: Session = Depends(get_db)
):
    """
    Calculate a "what-if" scenario by adjusting regional vote shares
    
    Args:
        scenario: Scenario configuration with regional adjustments
        election_year: Election year
        
    Returns:
        Scenario results with national totals and changes
    """
    # Get base forecast run
    if scenario.base_forecast_run_id:
        base_run = db.query(ForecastRun).filter(
            ForecastRun.id == scenario.base_forecast_run_id
        ).first()
    else:
        # Use latest forecast for the election year
        base_run = db.query(ForecastRun).join(Election).filter(
            Election.year == election_year
        ).order_by(ForecastRun.run_timestamp.desc()).first()
    
    if not base_run:
        raise HTTPException(status_code=404, detail="No base forecast found")
    
    # Get all forecasts from base run
    base_forecasts = db.query(ForecastCounty, County, Candidate).join(
        County, ForecastCounty.county_id == County.id
    ).join(
        Candidate, ForecastCounty.candidate_id == Candidate.id
    ).filter(
        ForecastCounty.forecast_run_id == base_run.id
    ).all()
    
    # Calculate original national totals
    original_totals = {}
    for forecast, county, candidate in base_forecasts:
        if candidate.name not in original_totals:
            original_totals[candidate.name] = 0
        original_totals[candidate.name] += forecast.predicted_votes
    
    original_total_votes = sum(original_totals.values())
    
    # Create adjusted forecasts
    adjusted_forecasts = {}
    regional_changes = []
    
    for forecast, county, candidate in base_forecasts:
        key = (county.code, candidate.name)
        adjusted_forecasts[key] = forecast.predicted_votes
    
    # Apply regional adjustments and build enhanced breakdown
    regional_breakdown = []

    for adjustment in scenario.adjustments:
        region = adjustment.region

        if region not in REGIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid region: {region}. Valid regions: {list(REGIONS.keys())}"
            )

        # Validate that shares sum to 100
        total_share = sum(adjustment.candidate_shares.values())
        if abs(total_share - 100.0) > 0.1:
            raise HTTPException(
                status_code=400,
                detail=f"Candidate shares in {region} must sum to 100%, got {total_share}%"
            )

        # Get counties in this region
        region_counties = REGIONS[region]

        # Calculate regional totals before adjustment
        region_original = {}
        region_total_votes = 0

        for forecast, county, candidate in base_forecasts:
            if county.code in region_counties:
                if candidate.name not in region_original:
                    region_original[candidate.name] = 0
                region_original[candidate.name] += forecast.predicted_votes
                region_total_votes += forecast.predicted_votes

        # Apply new shares to region
        for forecast, county, candidate in base_forecasts:
            if county.code in region_counties:
                # Get county's total votes
                county_total = sum([
                    f.predicted_votes for f, c, cand in base_forecasts
                    if c.code == county.code
                ])

                # Calculate new votes based on adjusted share
                new_share = adjustment.candidate_shares.get(candidate.name, 0)
                new_votes = int(county_total * new_share / 100)

                key = (county.code, candidate.name)
                adjusted_forecasts[key] = new_votes

        # Track regional changes
        region_new = {}
        for candidate_name, new_share in adjustment.candidate_shares.items():
            region_new[candidate_name] = int(region_total_votes * new_share / 100)

        regional_changes.append({
            "region": region,
            "original": region_original,
            "adjusted": region_new,
            "total_votes": region_total_votes
        })

        # Build enhanced regional breakdown
        original_results = {}
        adjusted_results = {}
        changes = {}

        for candidate_name in set(list(region_original.keys()) + list(region_new.keys())):
            orig_votes = region_original.get(candidate_name, 0)
            new_votes = region_new.get(candidate_name, 0)
            orig_share = (orig_votes / region_total_votes * 100) if region_total_votes > 0 else 0
            new_share = (new_votes / region_total_votes * 100) if region_total_votes > 0 else 0

            original_results[candidate_name] = {
                "votes": orig_votes,
                "share": round(orig_share, 2)
            }
            adjusted_results[candidate_name] = {
                "votes": new_votes,
                "share": round(new_share, 2)
            }
            changes[candidate_name] = round(new_share - orig_share, 2)

        regional_breakdown.append({
            "region": region,
            "total_votes": region_total_votes,
            "original_results": original_results,
            "adjusted_results": adjusted_results,
            "changes": changes
        })
    
    # Calculate new national totals
    new_totals = {}
    for (county_code, candidate_name), votes in adjusted_forecasts.items():
        if candidate_name not in new_totals:
            new_totals[candidate_name] = 0
        new_totals[candidate_name] += votes
    
    new_total_votes = sum(new_totals.values())
    
    # Build results
    national_results = {}
    for candidate_name in set(list(original_totals.keys()) + list(new_totals.keys())):
        original_votes = original_totals.get(candidate_name, 0)
        new_votes = new_totals.get(candidate_name, 0)
        original_share = (original_votes / original_total_votes * 100) if original_total_votes > 0 else 0
        new_share = (new_votes / new_total_votes * 100) if new_total_votes > 0 else 0
        
        national_results[candidate_name] = {
            "votes": new_votes,
            "share": round(new_share, 2),
            "change": round(new_share - original_share, 2),
            "original_votes": original_votes,
            "original_share": round(original_share, 2)
        }
    
    # Determine winner
    if not new_totals:
        raise HTTPException(
            status_code=400,
            detail="No valid results after applying adjustments"
        )

    winner = max(new_totals.items(), key=lambda x: x[1])[0]
    sorted_candidates = sorted(new_totals.items(), key=lambda x: x[1], reverse=True)
    margin = (sorted_candidates[0][1] - sorted_candidates[1][1]) / new_total_votes * 100 if len(sorted_candidates) > 1 else 100

    return ScenarioResult(
        scenario_name=scenario.name,
        description=scenario.description,
        base_forecast=f"{base_run.model_name} (v{base_run.model_version})",
        national_results=national_results,
        regional_changes=regional_changes,
        regional_breakdown=regional_breakdown,
        winner=winner,
        margin=round(margin, 2),
        total_votes_original=original_total_votes,
        total_votes_adjusted=new_total_votes
    )


@router.get("/regions")
async def get_regions():
    """
    Get list of available regions for scenario adjustments

    Returns:
        Dictionary of region names to county codes
    """
    return {
        "regions": REGIONS,
        "region_names": list(REGIONS.keys())
    }


@router.get("/regions/{region_name}/counties")
async def get_region_counties(
    region_name: str,
    db: Session = Depends(get_db)
):
    """
    Get detailed county information for a specific region

    Args:
        region_name: Name of the region

    Returns:
        List of counties in the region with their details
    """
    if region_name not in REGIONS:
        raise HTTPException(
            status_code=404,
            detail=f"Region '{region_name}' not found. Valid regions: {list(REGIONS.keys())}"
        )

    county_codes = REGIONS[region_name]
    counties = db.query(County).filter(County.code.in_(county_codes)).all()

    return {
        "region": region_name,
        "counties": [
            {
                "code": c.code,
                "name": c.name,
                "population_2019": c.population_2019,
                "registered_voters_2022": c.registered_voters_2022
            }
            for c in counties
        ]
    }


@router.post("/validate")
async def validate_scenario(
    scenario: ScenarioRequest,
    db: Session = Depends(get_db)
):
    """
    Validate a scenario without calculating it

    Args:
        scenario: Scenario configuration to validate

    Returns:
        Validation result with any errors or warnings
    """
    errors = []
    warnings = []

    # Validate scenario name
    if not scenario.name or not scenario.name.strip():
        errors.append("Scenario name is required")
    elif len(scenario.name) > 100:
        errors.append("Scenario name must be 100 characters or less")

    # Validate adjustments
    if not scenario.adjustments or len(scenario.adjustments) == 0:
        errors.append("At least one regional adjustment is required")

    # Validate each adjustment
    for i, adjustment in enumerate(scenario.adjustments):
        # Check region validity
        if adjustment.region not in REGIONS:
            errors.append(
                f"Adjustment {i+1}: Invalid region '{adjustment.region}'. "
                f"Valid regions: {', '.join(REGIONS.keys())}"
            )

        # Check shares sum to 100
        total_share = sum(adjustment.candidate_shares.values())
        if abs(total_share - 100.0) > 0.1:
            errors.append(
                f"Adjustment {i+1} ({adjustment.region}): "
                f"Candidate shares must sum to 100%, got {total_share:.1f}%"
            )

        # Check for negative shares
        for candidate, share in adjustment.candidate_shares.items():
            if share < 0:
                errors.append(
                    f"Adjustment {i+1} ({adjustment.region}): "
                    f"Negative share for {candidate}: {share}%"
                )
            elif share > 100:
                errors.append(
                    f"Adjustment {i+1} ({adjustment.region}): "
                    f"Share for {candidate} exceeds 100%: {share}%"
                )

    # Check for duplicate regions
    regions_used = [adj.region for adj in scenario.adjustments]
    duplicates = [r for r in regions_used if regions_used.count(r) > 1]
    if duplicates:
        warnings.append(
            f"Duplicate regions found: {', '.join(set(duplicates))}. "
            "Only the last adjustment for each region will be used."
        )

    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings,
        "adjustments_count": len(scenario.adjustments),
        "regions_affected": list(set(regions_used))
    }

