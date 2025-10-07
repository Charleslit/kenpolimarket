"""
Polling Stations API Router
Provides endpoints for polling station data with voter registration information
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from database import get_db
from models import PollingStation, Ward, Constituency, County
from schemas import PollingStationBaseSchema, PollingStationDetailSchema

router = APIRouter()


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("/", response_model=List[PollingStationBaseSchema])
async def get_polling_stations(
    ward_id: Optional[int] = Query(None, description="Filter by ward ID"),
    constituency_id: Optional[int] = Query(None, description="Filter by constituency ID"),
    county_id: Optional[int] = Query(None, description="Filter by county ID"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return"),
    db: Session = Depends(get_db)
):
    """
    Get polling stations with optional filtering.

    - **ward_id**: Filter by specific ward
    - **constituency_id**: Filter by constituency (returns all polling stations in that constituency)
    - **county_id**: Filter by county (returns all polling stations in that county)
    - **skip**: Pagination offset
    - **limit**: Maximum results (max 1000)
    """
    query = db.query(PollingStation)

    # Filter by ward
    if ward_id is not None:
        query = query.filter(PollingStation.ward_id == ward_id)

    # Filter by constituency (join through ward)
    if constituency_id is not None:
        query = query.join(Ward).filter(Ward.constituency_id == constituency_id)

    # Filter by county (join through ward and constituency)
    if county_id is not None:
        query = query.join(Ward).join(Constituency).filter(Constituency.county_id == county_id)

    # Apply pagination
    polling_stations = query.offset(skip).limit(limit).all()

    return polling_stations

@router.get("/{polling_station_id}", response_model=PollingStationDetailSchema)
async def get_polling_station(
    polling_station_id: int,
    db: Session = Depends(get_db)
):
    """
    Get a specific polling station by ID.

    Returns detailed information including the ward it belongs to.
    """
    polling_station = db.query(PollingStation).filter(
        PollingStation.id == polling_station_id
    ).first()

    if not polling_station:
        raise HTTPException(
            status_code=404,
            detail=f"Polling station with ID {polling_station_id} not found"
        )

    return polling_station


@router.get("/by-code/{code}", response_model=PollingStationDetailSchema)
async def get_polling_station_by_code(
    code: str,
    db: Session = Depends(get_db)
):
    """
    Get a specific polling station by its code.

    Useful for looking up polling stations by their official IEBC code.
    """
    polling_station = db.query(PollingStation).filter(
        PollingStation.code == code
    ).first()

    if not polling_station:
        raise HTTPException(
            status_code=404,
            detail=f"Polling station with code '{code}' not found"
        )

    return polling_station


@router.get("/search/", response_model=List[PollingStationBaseSchema])
async def search_polling_stations(
    q: str = Query(..., min_length=3, description="Search query (minimum 3 characters)"),
    limit: int = Query(50, ge=1, le=100, description="Maximum results"),
    db: Session = Depends(get_db)
):
    """
    Search polling stations by name.

    - **q**: Search query (searches in polling station name and registration center name)
    - **limit**: Maximum results (max 100)
    """
    search_pattern = f"%{q}%"

    polling_stations = db.query(PollingStation).filter(
        (PollingStation.name.ilike(search_pattern)) |
        (PollingStation.registration_center_name.ilike(search_pattern))
    ).limit(limit).all()

    return polling_stations


@router.get("/stats/summary")
async def get_polling_station_stats(
    ward_id: Optional[int] = Query(None, description="Filter by ward ID"),
    constituency_id: Optional[int] = Query(None, description="Filter by constituency ID"),
    county_id: Optional[int] = Query(None, description="Filter by county ID"),
    db: Session = Depends(get_db)
):
    """
    Get summary statistics for polling stations.

    Returns:
    - Total number of polling stations
    - Total registered voters
    - Average voters per polling station
    - Min/max voters per polling station
    """
    query = db.query(
        func.count(PollingStation.id).label('total_stations'),
        func.sum(PollingStation.registered_voters_2022).label('total_voters'),
        func.avg(PollingStation.registered_voters_2022).label('avg_voters'),
        func.min(PollingStation.registered_voters_2022).label('min_voters'),
        func.max(PollingStation.registered_voters_2022).label('max_voters')
    )

    # Apply filters
    if ward_id is not None:
        query = query.filter(PollingStation.ward_id == ward_id)

    if constituency_id is not None:
        query = query.join(Ward).filter(Ward.constituency_id == constituency_id)

    if county_id is not None:
        query = query.join(Ward).join(Constituency).filter(Constituency.county_id == county_id)

    result = query.first()

    return {
        "total_polling_stations": result.total_stations or 0,
        "total_registered_voters": result.total_voters or 0,
        "average_voters_per_station": round(result.avg_voters, 2) if result.avg_voters else 0,
        "min_voters_per_station": result.min_voters or 0,
        "max_voters_per_station": result.max_voters or 0
    }
