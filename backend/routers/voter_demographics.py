"""
Voter Demographics API Router
Provides endpoints for voter statistics including gender and disability data
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from database import get_db
from models import (
    County, Constituency, Ward, PollingStation,
    CountyVoterDemographics, ConstituencyVoterDemographics,
    WardVoterDemographics, PollingStationVoterDemographics
)
from schemas import (
    CountyVoterDemographicsSchema, ConstituencyVoterDemographicsSchema,
    WardVoterDemographicsSchema, PollingStationVoterDemographicsSchema,
    VoterStatisticsSummary
)

router = APIRouter()


# ============================================================================
# COUNTY LEVEL DEMOGRAPHICS
# ============================================================================

@router.get("/counties/{county_id}", response_model=VoterStatisticsSummary)
async def get_county_demographics(
    county_id: int,
    year: int = Query(2022, description="Election year"),
    db: Session = Depends(get_db)
):
    """
    Get voter demographics for a specific county.
    
    Returns detailed statistics including gender breakdown and disability data.
    """
    county = db.query(County).filter(County.id == county_id).first()
    if not county:
        raise HTTPException(status_code=404, detail="County not found")
    
    demographics = db.query(CountyVoterDemographics).filter(
        CountyVoterDemographics.county_id == county_id,
        CountyVoterDemographics.election_year == year
    ).first()
    
    if not demographics:
        raise HTTPException(
            status_code=404, 
            detail=f"No demographics data found for county {county.name} in year {year}"
        )
    
    # Calculate percentages
    total = demographics.total_registered_voters or 0
    male_pct = round((demographics.male_voters or 0) / total * 100, 2) if total > 0 else 0
    female_pct = round((demographics.female_voters or 0) / total * 100, 2) if total > 0 else 0
    pwd_pct = round((demographics.pwd_voters or 0) / total * 100, 2) if total > 0 else 0
    
    return VoterStatisticsSummary(
        level="county",
        id=county.id,
        name=county.name,
        code=county.code,
        total_registered_voters=demographics.total_registered_voters,
        male_voters=demographics.male_voters or 0,
        female_voters=demographics.female_voters or 0,
        pwd_voters=demographics.pwd_voters or 0,
        male_percentage=male_pct,
        female_percentage=female_pct,
        pwd_percentage=pwd_pct,
        election_year=year
    )


# ============================================================================
# CONSTITUENCY LEVEL DEMOGRAPHICS
# ============================================================================

@router.get("/constituencies/{constituency_id}", response_model=VoterStatisticsSummary)
async def get_constituency_demographics(
    constituency_id: int,
    year: int = Query(2022, description="Election year"),
    db: Session = Depends(get_db)
):
    """
    Get voter demographics for a specific constituency.
    """
    constituency = db.query(Constituency).filter(
        Constituency.id == constituency_id
    ).first()
    
    if not constituency:
        raise HTTPException(status_code=404, detail="Constituency not found")
    
    demographics = db.query(ConstituencyVoterDemographics).filter(
        ConstituencyVoterDemographics.constituency_id == constituency_id,
        ConstituencyVoterDemographics.election_year == year
    ).first()
    
    if not demographics:
        raise HTTPException(
            status_code=404,
            detail=f"No demographics data found for constituency {constituency.name} in year {year}"
        )
    
    # Get county name for context
    county = db.query(County).filter(County.id == constituency.county_id).first()
    
    # Calculate percentages
    total = demographics.total_registered_voters or 0
    male_pct = round((demographics.male_voters or 0) / total * 100, 2) if total > 0 else 0
    female_pct = round((demographics.female_voters or 0) / total * 100, 2) if total > 0 else 0
    pwd_pct = round((demographics.pwd_voters or 0) / total * 100, 2) if total > 0 else 0
    
    return VoterStatisticsSummary(
        level="constituency",
        id=constituency.id,
        name=constituency.name,
        code=constituency.code,
        total_registered_voters=demographics.total_registered_voters,
        male_voters=demographics.male_voters or 0,
        female_voters=demographics.female_voters or 0,
        pwd_voters=demographics.pwd_voters or 0,
        male_percentage=male_pct,
        female_percentage=female_pct,
        pwd_percentage=pwd_pct,
        election_year=year,
        parent_name=county.name if county else None
    )


@router.get("/constituencies/by-county/{county_id}", response_model=List[VoterStatisticsSummary])
async def get_county_constituencies_demographics(
    county_id: int,
    year: int = Query(2022, description="Election year"),
    db: Session = Depends(get_db)
):
    """
    Get voter demographics for all constituencies in a county.
    """
    county = db.query(County).filter(County.id == county_id).first()
    if not county:
        raise HTTPException(status_code=404, detail="County not found")
    
    results = []
    constituencies = db.query(Constituency).filter(
        Constituency.county_id == county_id
    ).all()
    
    for constituency in constituencies:
        demographics = db.query(ConstituencyVoterDemographics).filter(
            ConstituencyVoterDemographics.constituency_id == constituency.id,
            ConstituencyVoterDemographics.election_year == year
        ).first()
        
        if demographics:
            total = demographics.total_registered_voters or 0
            male_pct = round((demographics.male_voters or 0) / total * 100, 2) if total > 0 else 0
            female_pct = round((demographics.female_voters or 0) / total * 100, 2) if total > 0 else 0
            pwd_pct = round((demographics.pwd_voters or 0) / total * 100, 2) if total > 0 else 0
            
            results.append(VoterStatisticsSummary(
                level="constituency",
                id=constituency.id,
                name=constituency.name,
                code=constituency.code,
                total_registered_voters=demographics.total_registered_voters,
                male_voters=demographics.male_voters or 0,
                female_voters=demographics.female_voters or 0,
                pwd_voters=demographics.pwd_voters or 0,
                male_percentage=male_pct,
                female_percentage=female_pct,
                pwd_percentage=pwd_pct,
                election_year=year,
                parent_name=county.name
            ))
    
    return results


# ============================================================================
# WARD LEVEL DEMOGRAPHICS
# ============================================================================

@router.get("/wards/{ward_id}", response_model=VoterStatisticsSummary)
async def get_ward_demographics(
    ward_id: int,
    year: int = Query(2022, description="Election year"),
    db: Session = Depends(get_db)
):
    """
    Get voter demographics for a specific ward.
    """
    ward = db.query(Ward).filter(Ward.id == ward_id).first()
    if not ward:
        raise HTTPException(status_code=404, detail="Ward not found")
    
    demographics = db.query(WardVoterDemographics).filter(
        WardVoterDemographics.ward_id == ward_id,
        WardVoterDemographics.election_year == year
    ).first()
    
    if not demographics:
        raise HTTPException(
            status_code=404,
            detail=f"No demographics data found for ward {ward.name} in year {year}"
        )
    
    # Get constituency name for context
    constituency = db.query(Constituency).filter(
        Constituency.id == ward.constituency_id
    ).first()
    
    # Calculate percentages
    total = demographics.total_registered_voters or 0
    male_pct = round((demographics.male_voters or 0) / total * 100, 2) if total > 0 else 0
    female_pct = round((demographics.female_voters or 0) / total * 100, 2) if total > 0 else 0
    pwd_pct = round((demographics.pwd_voters or 0) / total * 100, 2) if total > 0 else 0
    
    return VoterStatisticsSummary(
        level="ward",
        id=ward.id,
        name=ward.name,
        code=ward.code,
        total_registered_voters=demographics.total_registered_voters,
        male_voters=demographics.male_voters or 0,
        female_voters=demographics.female_voters or 0,
        pwd_voters=demographics.pwd_voters or 0,
        male_percentage=male_pct,
        female_percentage=female_pct,
        pwd_percentage=pwd_pct,
        election_year=year,
        parent_name=constituency.name if constituency else None
    )


@router.get("/wards/by-constituency/{constituency_id}", response_model=List[VoterStatisticsSummary])
async def get_constituency_wards_demographics(
    constituency_id: int,
    year: int = Query(2022, description="Election year"),
    db: Session = Depends(get_db)
):
    """
    Get voter demographics for all wards in a constituency.
    """
    constituency = db.query(Constituency).filter(
        Constituency.id == constituency_id
    ).first()
    
    if not constituency:
        raise HTTPException(status_code=404, detail="Constituency not found")
    
    results = []
    wards = db.query(Ward).filter(Ward.constituency_id == constituency_id).all()
    
    for ward in wards:
        demographics = db.query(WardVoterDemographics).filter(
            WardVoterDemographics.ward_id == ward.id,
            WardVoterDemographics.election_year == year
        ).first()
        
        if demographics:
            total = demographics.total_registered_voters or 0
            male_pct = round((demographics.male_voters or 0) / total * 100, 2) if total > 0 else 0
            female_pct = round((demographics.female_voters or 0) / total * 100, 2) if total > 0 else 0
            pwd_pct = round((demographics.pwd_voters or 0) / total * 100, 2) if total > 0 else 0
            
            results.append(VoterStatisticsSummary(
                level="ward",
                id=ward.id,
                name=ward.name,
                code=ward.code,
                total_registered_voters=demographics.total_registered_voters,
                male_voters=demographics.male_voters or 0,
                female_voters=demographics.female_voters or 0,
                pwd_voters=demographics.pwd_voters or 0,
                male_percentage=male_pct,
                female_percentage=female_pct,
                pwd_percentage=pwd_pct,
                election_year=year,
                parent_name=constituency.name
            ))
    
    return results


# ============================================================================
# POLLING STATION LEVEL DEMOGRAPHICS
# ============================================================================

@router.get("/polling-stations/{polling_station_id}", response_model=VoterStatisticsSummary)
async def get_polling_station_demographics(
    polling_station_id: int,
    year: int = Query(2022, description="Election year"),
    db: Session = Depends(get_db)
):
    """
    Get voter demographics for a specific polling station.
    """
    station = db.query(PollingStation).filter(
        PollingStation.id == polling_station_id
    ).first()
    
    if not station:
        raise HTTPException(status_code=404, detail="Polling station not found")
    
    demographics = db.query(PollingStationVoterDemographics).filter(
        PollingStationVoterDemographics.polling_station_id == polling_station_id,
        PollingStationVoterDemographics.election_year == year
    ).first()
    
    if not demographics:
        raise HTTPException(
            status_code=404,
            detail=f"No demographics data found for polling station {station.name} in year {year}"
        )
    
    # Get ward name for context
    ward = db.query(Ward).filter(Ward.id == station.ward_id).first()
    
    # Calculate percentages
    total = demographics.total_registered_voters or 0
    male_pct = round((demographics.male_voters or 0) / total * 100, 2) if total > 0 else 0
    female_pct = round((demographics.female_voters or 0) / total * 100, 2) if total > 0 else 0
    pwd_pct = round((demographics.pwd_voters or 0) / total * 100, 2) if total > 0 else 0
    
    return VoterStatisticsSummary(
        level="polling_station",
        id=station.id,
        name=station.name,
        code=station.code,
        total_registered_voters=demographics.total_registered_voters,
        male_voters=demographics.male_voters or 0,
        female_voters=demographics.female_voters or 0,
        pwd_voters=demographics.pwd_voters or 0,
        male_percentage=male_pct,
        female_percentage=female_pct,
        pwd_percentage=pwd_pct,
        election_year=year,
        parent_name=ward.name if ward else None
    )

