"""
Constituencies API Router
Endpoints for constituency data
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from database import get_db
from models import Constituency, County, Ward
from schemas import ConstituencyBaseSchema, ConstituencyDetailSchema, WardBaseSchema

router = APIRouter(prefix="/constituencies", tags=["constituencies"])


@router.get("/", response_model=List[ConstituencyBaseSchema])
async def list_constituencies(
    county_id: Optional[int] = Query(None, description="Filter by county ID"),
    county_code: Optional[str] = Query(None, description="Filter by county code"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=500, description="Maximum number of records to return"),
    db: Session = Depends(get_db)
):
    """
    Get list of constituencies
    
    Args:
        county_id: Optional filter by county ID
        county_code: Optional filter by county code
        skip: Number of records to skip
        limit: Maximum number of records to return
        
    Returns:
        List of constituencies
    """
    query = db.query(Constituency)
    
    if county_id:
        query = query.filter(Constituency.county_id == county_id)
    elif county_code:
        # Join with County to filter by code
        county = db.query(County).filter(County.code == county_code).first()
        if not county:
            raise HTTPException(status_code=404, detail=f"County with code '{county_code}' not found")
        query = query.filter(Constituency.county_id == county.id)
    
    constituencies = query.offset(skip).limit(limit).all()
    return constituencies


@router.get("/{constituency_id}", response_model=ConstituencyDetailSchema)
async def get_constituency(
    constituency_id: int,
    db: Session = Depends(get_db)
):
    """
    Get detailed information for a specific constituency
    
    Args:
        constituency_id: Constituency ID
        
    Returns:
        Detailed constituency information
    """
    constituency = db.query(Constituency).options(
        joinedload(Constituency.county)
    ).filter(Constituency.id == constituency_id).first()
    
    if not constituency:
        raise HTTPException(
            status_code=404,
            detail=f"Constituency with ID {constituency_id} not found"
        )
    
    return constituency


@router.get("/{constituency_id}/wards", response_model=List[WardBaseSchema])
async def get_constituency_wards(
    constituency_id: int,
    db: Session = Depends(get_db)
):
    """
    Get all wards in a specific constituency
    
    Args:
        constituency_id: Constituency ID
        
    Returns:
        List of wards in the constituency
    """
    # Verify constituency exists
    constituency = db.query(Constituency).filter(Constituency.id == constituency_id).first()
    if not constituency:
        raise HTTPException(
            status_code=404,
            detail=f"Constituency with ID {constituency_id} not found"
        )
    
    wards = db.query(Ward).filter(Ward.constituency_id == constituency_id).all()
    return wards


@router.get("/by-code/{code}", response_model=ConstituencyDetailSchema)
async def get_constituency_by_code(
    code: str,
    db: Session = Depends(get_db)
):
    """
    Get constituency by code
    
    Args:
        code: Constituency code
        
    Returns:
        Constituency information
    """
    constituency = db.query(Constituency).options(
        joinedload(Constituency.county)
    ).filter(Constituency.code == code).first()
    
    if not constituency:
        raise HTTPException(
            status_code=404,
            detail=f"Constituency with code '{code}' not found"
        )
    
    return constituency

