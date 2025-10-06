"""
Wards API Router
Endpoints for ward data
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from database import get_db
from models import Ward, Constituency
from schemas import WardBaseSchema, WardDetailSchema

router = APIRouter(prefix="/wards", tags=["wards"])


@router.get("/", response_model=List[WardBaseSchema])
async def list_wards(
    constituency_id: Optional[int] = Query(None, description="Filter by constituency ID"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=500, description="Maximum number of records to return"),
    db: Session = Depends(get_db)
):
    """
    Get list of wards
    
    Args:
        constituency_id: Optional filter by constituency ID
        skip: Number of records to skip
        limit: Maximum number of records to return
        
    Returns:
        List of wards
    """
    query = db.query(Ward)
    
    if constituency_id:
        query = query.filter(Ward.constituency_id == constituency_id)
    
    wards = query.offset(skip).limit(limit).all()
    return wards


@router.get("/{ward_id}", response_model=WardDetailSchema)
async def get_ward(
    ward_id: int,
    db: Session = Depends(get_db)
):
    """
    Get detailed information for a specific ward
    
    Args:
        ward_id: Ward ID
        
    Returns:
        Detailed ward information
    """
    ward = db.query(Ward).options(
        joinedload(Ward.constituency)
    ).filter(Ward.id == ward_id).first()
    
    if not ward:
        raise HTTPException(
            status_code=404,
            detail=f"Ward with ID {ward_id} not found"
        )
    
    return ward


@router.get("/by-code/{code}", response_model=WardDetailSchema)
async def get_ward_by_code(
    code: str,
    db: Session = Depends(get_db)
):
    """
    Get ward by code
    
    Args:
        code: Ward code
        
    Returns:
        Ward information
    """
    ward = db.query(Ward).options(
        joinedload(Ward.constituency)
    ).filter(Ward.code == code).first()
    
    if not ward:
        raise HTTPException(
            status_code=404,
            detail=f"Ward with code '{code}' not found"
        )
    
    return ward

