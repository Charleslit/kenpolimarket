# KenPoliMarket Development Workflow

**Current Status**: Sample data generated, ready for database setup and API development

---

## 🎯 **Priority 1: Data Ingestion & Verification** ✅ READY

### What's Been Done:
- ✅ Sample data generator created (`etl/scripts/generate_sample_data.py`)
- ✅ Sample data loader created (`etl/scripts/load_sample_data.py`)
- ✅ Generated realistic data for 47 counties
- ✅ Generated 2022 & 2017 election results
- ✅ Generated privacy-preserving ethnicity aggregates (min 10)

### Generated Data Files:
```
data/processed/
├── counties.csv (47 counties with demographics)
├── election_results_2022.csv (2022 presidential results)
├── election_results_2017.csv (2017 results for validation)
└── ethnicity_aggregates.csv (privacy-preserving, county-level only)
```

### Next Steps:
1. **Set up database** (see `MANUAL_SETUP_INSTRUCTIONS.md`)
2. **Load sample data** into PostgreSQL
3. **Verify data** meets privacy requirements
4. **Test API** endpoints with real data

---

## 🎯 **Priority 2: Backend API Completion** (NEXT)

### Current State:
- ✅ Basic FastAPI structure
- ✅ Database connection layer
- ✅ Privacy middleware
- ⚠️  Router endpoints are templates (need implementation)

### Tasks:

#### 2.1 Implement Counties Router
**File**: `backend/routers/counties.py`

```python
# Add real database queries
@router.get("/")
async def list_counties(db: Session = Depends(get_db)):
    counties = db.query(County).all()
    return counties

@router.get("/{code}")
async def get_county(code: str, db: Session = Depends(get_db)):
    county = db.query(County).filter(County.code == code).first()
    if not county:
        raise HTTPException(status_code=404, detail="County not found")
    return county
```

#### 2.2 Implement Elections Router
**File**: `backend/routers/elections.py`

```python
@router.get("/{election_id}/results")
async def get_election_results(election_id: int, db: Session = Depends(get_db)):
    results = db.query(ElectionResultCounty).filter(
        ElectionResultCounty.election_id == election_id
    ).all()
    return results
```

#### 2.3 Implement Forecasts Router
**File**: `backend/routers/forecasts.py`

```python
@router.get("/latest")
async def get_latest_forecasts(db: Session = Depends(get_db)):
    forecasts = db.query(ForecastCounty).filter(
        ForecastCounty.forecast_run_id == latest_run_id
    ).all()
    return forecasts
```

#### 2.4 Add Authentication (JWT)
**New File**: `backend/auth.py`

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    # Implement JWT verification
    pass
```

---

## 🎯 **Priority 3: Frontend Dashboard Development** (AFTER PRIORITY 2)

### Tasks:

#### 3.1 Create Forecasts Dashboard Page
**File**: `frontend/app/forecasts/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import CountyMap from '@/components/maps/CountyMap';
import ForecastChart from '@/components/charts/ForecastChart';

export default function ForecastsPage() {
  const [forecasts, setForecasts] = useState([]);
  
  useEffect(() => {
    fetch('http://localhost:8000/api/forecasts/latest')
      .then(res => res.json())
      .then(data => setForecasts(data));
  }, []);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">2027 Election Forecasts</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <CountyMap forecasts={forecasts} />
        <ForecastChart forecasts={forecasts} />
      </div>
      
      {/* County cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        {forecasts.map((forecast: any) => (
          <ForecastCard key={forecast.id} forecast={forecast} />
        ))}
      </div>
    </div>
  );
}
```

#### 3.2 Create County Map Component
**File**: `frontend/components/maps/CountyMap.tsx`

```typescript
'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export default function CountyMap({ forecasts }: { forecasts: any[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  
  useEffect(() => {
    if (!svgRef.current || !forecasts.length) return;
    
    // Load TopoJSON and render map
    // Color counties by forecast turnout
    // Add tooltips
  }, [forecasts]);
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">County Map</h2>
      <svg ref={svgRef} width="100%" height="500"></svg>
    </div>
  );
}
```

#### 3.3 Create Forecast Chart Component
**File**: `frontend/components/charts/ForecastChart.tsx`

```typescript
'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ForecastChart({ forecasts }: { forecasts: any[] }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">Turnout Forecast</h2>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={forecasts}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="county_name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="projected_turnout" stroke="#8884d8" />
          <Line type="monotone" dataKey="lower_bound_90" stroke="#82ca9d" strokeDasharray="5 5" />
          <Line type="monotone" dataKey="upper_bound_90" stroke="#82ca9d" strokeDasharray="5 5" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

---

## 🎯 **Priority 4: Model Training & Forecasting** (FINAL)

### Tasks:

#### 4.1 Fit Hierarchical Bayesian Model
**File**: `models/hierarchical_bayesian.py`

```bash
cd models
source ../backend/venv/bin/activate

# Fit model with 2022 data
python hierarchical_bayesian.py --fit --election-year 2022

# Validate on 2017 data
python hierarchical_bayesian.py --validate --election-year 2017

# Generate 2027 forecasts
python hierarchical_bayesian.py --predict --target-year 2027
```

#### 4.2 Run Diagnostics
```python
# Check R-hat (should be < 1.01)
# Check ESS (should be > 400)
# Check for divergences (should be 0)
```

#### 4.3 Store Forecasts in Database
```python
# Save forecast_run metadata
# Save county-level forecasts with uncertainty
# Save ethnicity-level aggregates (privacy-preserving)
```

---

## 📋 **Development Checklist**

### Phase 1: Database Setup ⏳
- [ ] Run manual database setup (see `MANUAL_SETUP_INSTRUCTIONS.md`)
- [ ] Load sample data
- [ ] Verify data in database
- [ ] Test database connection from backend

### Phase 2: Backend API 🔄
- [ ] Implement counties router with real queries
- [ ] Implement elections router with real queries
- [ ] Implement forecasts router (will be empty until models run)
- [ ] Add SQLAlchemy models for all tables
- [ ] Add JWT authentication
- [ ] Test all endpoints with curl/Postman
- [ ] Update API documentation

### Phase 3: Frontend Dashboard 📊
- [ ] Install D3.js and Recharts: `npm install d3 recharts`
- [ ] Create forecasts page
- [ ] Build county map component
- [ ] Build forecast chart component
- [ ] Add county detail pages
- [ ] Add methodology page
- [ ] Test responsive design

### Phase 4: Model Training 🤖
- [ ] Fit Bayesian model with sample data
- [ ] Run diagnostics
- [ ] Cross-validate on 2017 data
- [ ] Generate 2027 forecasts
- [ ] Store forecasts in database
- [ ] Verify forecasts appear in API
- [ ] Verify forecasts appear in frontend

---

## 🚀 **Quick Start Commands**

### Terminal 1: Backend
```bash
cd /home/charles/Documents/augment-projects/kenpolimarket/backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Terminal 2: Frontend
```bash
cd /home/charles/Documents/augment-projects/kenpolimarket/frontend
npm run dev
```

### Terminal 3: Development
```bash
cd /home/charles/Documents/augment-projects/kenpolimarket

# Test API
curl http://localhost:8000/api/health
curl http://localhost:8000/api/counties/

# Database queries
PGPASSWORD=password psql -h localhost -U kenpolimarket -d kenpolimarket

# Run models
cd models
source ../backend/venv/bin/activate
python hierarchical_bayesian.py --fit
```

---

## 📚 **Key Files Reference**

### Backend
- `backend/main.py` - FastAPI application
- `backend/routers/` - API endpoints
- `backend/database.py` - Database connection
- `backend/middleware.py` - Privacy middleware

### Frontend
- `frontend/app/page.tsx` - Homepage
- `frontend/app/forecasts/page.tsx` - Dashboard (to be created)
- `frontend/components/` - Reusable components (to be created)

### Data & Models
- `etl/scripts/generate_sample_data.py` - Sample data generator
- `etl/scripts/load_sample_data.py` - Database loader
- `models/hierarchical_bayesian.py` - Forecasting model

### Database
- `database/schema.sql` - Database schema
- `data/processed/` - Generated sample data

---

## 🎯 **Current Priority: Database Setup**

**Action Required**: Follow instructions in `MANUAL_SETUP_INSTRUCTIONS.md` to:
1. Create PostgreSQL database and user
2. Initialize schema
3. Load sample data
4. Verify data

**Once complete**, proceed to Priority 2 (Backend API implementation).

---

**Last Updated**: 2025-10-03

