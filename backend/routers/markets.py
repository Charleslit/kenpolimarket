"""Play-Money Markets API Router"""
from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def list_markets():
    return {"markets": [], "note": "Play-money only, no real gambling"}

