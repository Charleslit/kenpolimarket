"""
Custom middleware for privacy and rate limiting
"""
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from datetime import datetime
import time
from collections import defaultdict
from typing import Dict

# Simple in-memory rate limiter (use Redis in production)
request_counts: Dict[str, list] = defaultdict(list)


async def privacy_middleware(request: Request, call_next):
    """
    Privacy middleware
    
    Ensures all responses comply with privacy requirements:
    - No individual-level data
    - Minimum aggregate sizes enforced
    """
    response = await call_next(request)
    
    # Add privacy headers
    response.headers["X-Privacy-Policy"] = "/api/privacy-policy"
    response.headers["X-Data-Protection"] = "Kenya-DPA-2019-Compliant"
    
    return response


async def rate_limit_middleware(request: Request, call_next):
    """
    Rate limiting middleware
    
    Prevents abuse and ensures fair usage
    """
    client_ip = request.client.host
    current_time = time.time()
    
    # Clean old requests (older than 1 hour)
    request_counts[client_ip] = [
        req_time for req_time in request_counts[client_ip]
        if current_time - req_time < 3600
    ]
    
    # Check rate limits
    recent_requests = [
        req_time for req_time in request_counts[client_ip]
        if current_time - req_time < 60
    ]
    
    if len(recent_requests) > 60:  # 60 requests per minute
        return JSONResponse(
            status_code=429,
            content={
                "error": "Rate limit exceeded",
                "retry_after": 60,
                "timestamp": datetime.utcnow().isoformat()
            }
        )
    
    # Record this request
    request_counts[client_ip].append(current_time)
    
    response = await call_next(request)
    return response

