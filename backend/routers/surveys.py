"""Surveys API Router"""
from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def list_surveys():
    return {"surveys": []}

