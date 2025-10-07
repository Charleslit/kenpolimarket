"""
KenPoliMarket Backend API
FastAPI application for political forecasting platform
"""
from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Optional
from datetime import datetime
import os

from config import settings
from database import engine
from models import Base
from routers import forecasts, elections, counties, surveys, markets, candidates, scenarios, constituencies, wards, polling_stations
from middleware import privacy_middleware, rate_limit_middleware

# Note: Database tables are already created via init script
# Base.metadata.create_all(bind=engine)  # Uncomment if needed

# Initialize FastAPI app
app = FastAPI(
    title="KenPoliMarket API",
    description="Kenya Political Forecasting & Analysis Platform",
    version="0.1.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# CORS middleware - Allow Vercel and local development
# For production, you can restrict this to specific domains
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://kenpolimarket.vercel.app",
]

# Allow all Vercel preview deployments (*.vercel.app)
def is_allowed_origin(origin: str) -> bool:
    if origin in allowed_origins:
        return True
    if origin and origin.endswith(".vercel.app"):
        return True
    return False

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://.*\.vercel\.app",  # Allow all Vercel deployments
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom middleware
app.middleware("http")(privacy_middleware)
# Rate limiting disabled for development
# app.middleware("http")(rate_limit_middleware)

# Include routers (routers already have /api prefix defined)
app.include_router(forecasts.router, prefix="/api")
app.include_router(elections.router, prefix="/api")
app.include_router(counties.router, prefix="/api")
app.include_router(constituencies.router, prefix="/api")
app.include_router(wards.router, prefix="/api")
app.include_router(surveys.router, prefix="/api")
app.include_router(markets.router, prefix="/api")
app.include_router(candidates.router, prefix="/api")
app.include_router(scenarios.router, prefix="/api")
app.include_router(polling_stations.router, prefix="/api/polling_stations", tags=["polling_stations"])


@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "name": "KenPoliMarket API",
        "version": "0.1.0",
        "status": "operational",
        "timestamp": datetime.utcnow().isoformat(),
        "docs": "/api/docs"
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "database": "connected",  # TODO: Add actual DB health check
        "redis": "connected"  # TODO: Add actual Redis health check
    }


@app.get("/api/privacy-policy")
async def privacy_policy():
    """
    Privacy policy endpoint
    
    Returns information about data handling and privacy safeguards
    """
    return {
        "policy": "KenPoliMarket Privacy Policy",
        "compliance": ["Kenya Data Protection Act 2019"],
        "principles": [
            "No individual-level PII processing",
            "Aggregate-only ethnicity data (county-level minimum)",
            "Minimum aggregate size: 10 individuals",
            "No real-money gambling or betting",
            "Transparent methodology and data sources"
        ],
        "data_sources": [
            "IEBC official election results",
            "KNBS 2019 Census (aggregate only)",
            "Consented survey responses (aggregated)",
            "Play-money market data (non-monetary)"
        ],
        "user_rights": [
            "Right to access aggregated data",
            "Right to withdraw survey consent",
            "Right to data portability (own data)",
            "Right to deletion (personal data only)"
        ],
        "contact": "privacy@kenpolimarket.com"
    }


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Custom HTTP exception handler"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "timestamp": datetime.utcnow().isoformat()
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

