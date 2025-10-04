# 🤖 Priority 4: Model Training & Forecasting - Implementation Plan

## 📋 Overview

This priority involves building and training Bayesian forecasting models to generate probabilistic predictions for the 2027 Kenyan presidential election.

---

## 🎯 Goals

1. **Install ML dependencies** (PyMC, ArviZ, JAX)
2. **Prepare training data** from database
3. **Build hierarchical Bayesian model**
4. **Fit model** with MCMC sampling
5. **Generate 2027 forecasts** with uncertainty quantification
6. **Store forecasts** in database
7. **Update API** to serve forecast data
8. **Update frontend** to display forecasts with uncertainty bands

---

## 📦 Step 1: Install ML Dependencies

### Required Packages:
```bash
cd backend
source venv/bin/activate

# Core ML packages
pip install pymc==5.10.4
pip install arviz==0.17.0
pip install jax==0.4.23
pip install numpyro==0.13.2

# Additional utilities
pip install scikit-learn==1.4.0
pip install matplotlib==3.8.2
pip install seaborn==0.13.0
```

### Verify Installation:
```python
python -c "import pymc as pm; print(f'PyMC version: {pm.__version__}')"
python -c "import arviz as az; print(f'ArviZ version: {az.__version__}')"
python -c "import jax; print(f'JAX version: {jax.__version__}')"
```

---

## 📊 Step 2: Prepare Training Data

### Create Data Preparation Script

**File:** `models/prepare_data.py`

```python
"""
Prepare training data from database for Bayesian model
"""
import pandas as pd
import psycopg2
from sqlalchemy import create_engine
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL')
engine = create_engine(DATABASE_URL)

def fetch_county_data():
    """Fetch county-level features"""
    query = """
    SELECT 
        c.id as county_id,
        c.code,
        c.name,
        c.population_2019,
        c.registered_voters_2022,
        cd.urban_population,
        cd.rural_population,
        cd.total_population,
        (cd.urban_population::float / NULLIF(cd.total_population, 0)) as urban_percentage
    FROM counties c
    LEFT JOIN county_demographics cd ON c.id = cd.county_id
    WHERE cd.census_year = 2019
    ORDER BY c.code
    """
    return pd.read_sql(query, engine)

def fetch_ethnicity_data():
    """Fetch county-level ethnicity aggregates (privacy-preserving)"""
    query = """
    SELECT 
        county_id,
        ethnicity_group,
        population_count,
        percentage as population_share
    FROM county_ethnicity_aggregate
    WHERE census_year = 2019
    AND population_count >= 10  -- Privacy threshold
    ORDER BY county_id, ethnicity_group
    """
    return pd.read_sql(query, engine)

def fetch_historical_results():
    """Fetch historical election results"""
    query = """
    SELECT 
        erc.election_id,
        e.year as election_year,
        erc.county_id,
        erc.candidate_id,
        c.name as candidate_name,
        c.party,
        erc.votes,
        erc.total_votes_cast,
        erc.registered_voters,
        erc.turnout_percentage as turnout
    FROM election_results_county erc
    JOIN elections e ON erc.election_id = e.id
    JOIN candidates c ON erc.candidate_id = c.id
    ORDER BY e.year DESC, erc.county_id, erc.candidate_id
    """
    return pd.read_sql(query, engine)

def prepare_training_data():
    """Prepare all data for model training"""
    print("Fetching county data...")
    county_data = fetch_county_data()
    print(f"✅ Loaded {len(county_data)} counties")
    
    print("Fetching ethnicity data...")
    ethnicity_data = fetch_ethnicity_data()
    print(f"✅ Loaded {len(ethnicity_data)} ethnicity aggregates")
    
    print("Fetching historical results...")
    historical_results = fetch_historical_results()
    print(f"✅ Loaded {len(historical_results)} historical results")
    
    # Save to CSV for model training
    county_data.to_csv('data/processed/model_county_data.csv', index=False)
    ethnicity_data.to_csv('data/processed/model_ethnicity_data.csv', index=False)
    historical_results.to_csv('data/processed/model_historical_results.csv', index=False)
    
    print("\n✅ Data preparation complete!")
    print(f"   - Counties: {len(county_data)}")
    print(f"   - Ethnicity aggregates: {len(ethnicity_data)}")
    print(f"   - Historical results: {len(historical_results)}")
    
    return county_data, ethnicity_data, historical_results

if __name__ == '__main__':
    prepare_training_data()
```

### Run Data Preparation:
```bash
cd models
source ../backend/venv/bin/activate
python prepare_data.py
```

---

## 🧠 Step 3: Update Hierarchical Bayesian Model

The model template already exists in `models/hierarchical_bayesian.py`. We need to:

1. **Add command-line interface** for training and prediction
2. **Add database integration** for storing forecasts
3. **Add diagnostics** and validation
4. **Add visualization** of results

### Key Model Components:

#### Hyperpriors (National Level):
- National baseline turnout: `μ_turnout ~ Normal(0.70, 0.05)`
- National vote shares: `α_national ~ Dirichlet([1, 1, ...])`

#### County-Level Parameters (Partial Pooling):
- County turnout: `turnout_county ~ Hierarchical Normal`
- County vote shares: `vote_share_county ~ Hierarchical Dirichlet`

#### Feature Effects:
- Urban population effect: `β_urban ~ Normal(0, 0.1)`
- Youth population effect: `β_youth ~ Normal(0, 0.1)`
- Historical persistence: `β_historical ~ Normal(0.5, 0.2)`

#### Ethnicity Effects (Privacy-Preserving):
- Ethnicity turnout multipliers: `ethnicity_multiplier ~ Normal(1.0, 0.2)`
- Applied at county-level aggregates only

---

## 🎲 Step 4: Fit Model with MCMC

### Training Configuration:
```python
# MCMC sampling parameters
draws = 2000          # Number of posterior samples
tune = 1000           # Number of tuning steps
chains = 4            # Number of parallel chains
target_accept = 0.95  # Target acceptance rate
```

### Run Training:
```bash
cd models
source ../backend/venv/bin/activate

# Fit model with 2022 data
python hierarchical_bayesian.py --fit --election-year 2022 --draws 2000 --chains 4

# Expected output:
# - Sampling progress bars
# - Convergence diagnostics (R-hat, ESS)
# - Model summary statistics
# - Saved trace to models/traces/model_2022.nc
```

### Diagnostics to Check:
- **R-hat < 1.01** (convergence)
- **ESS > 400** (effective sample size)
- **Divergences = 0** (no sampling issues)
- **Energy plot** (no pathologies)

---

## 🔮 Step 5: Generate 2027 Forecasts

### Prediction Process:
1. Load fitted model trace
2. Sample from posterior predictive distribution
3. Generate county-level forecasts
4. Calculate 90% credible intervals
5. Aggregate to national level

### Run Prediction:
```bash
python hierarchical_bayesian.py --predict --target-year 2027 --output forecasts_2027.csv

# Expected output:
# - County-level predictions with uncertainty
# - National-level aggregates
# - Visualization plots
# - CSV file with all forecasts
```

### Forecast Output Format:
```csv
county_code,county_name,candidate_name,party,predicted_vote_share,lower_90,upper_90,predicted_turnout
1,Mombasa,Candidate A,Party A,45.2,42.1,48.3,68.5
1,Mombasa,Candidate B,Party B,52.8,49.7,55.9,68.5
...
```

---

## 💾 Step 6: Store Forecasts in Database

### Create Forecast Storage Script

**File:** `models/store_forecasts.py`

```python
"""
Store forecast results in database
"""
import pandas as pd
import uuid
from datetime import datetime
from sqlalchemy import create_engine
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL')
engine = create_engine(DATABASE_URL)

def store_forecast_run(election_id, model_name, model_version):
    """Create forecast run record"""
    forecast_run_id = str(uuid.uuid4())
    
    query = """
    INSERT INTO forecast_runs (
        id, election_id, model_name, model_version,
        run_timestamp, data_cutoff_date, status
    ) VALUES (
        %s, %s, %s, %s, %s, %s, 'completed'
    )
    """
    
    with engine.begin() as conn:
        conn.execute(query, (
            forecast_run_id,
            election_id,
            model_name,
            model_version,
            datetime.now(),
            datetime.now().date()
        ))
    
    return forecast_run_id

def store_county_forecasts(forecast_run_id, forecasts_df):
    """Store county-level forecasts"""
    forecasts_df['forecast_run_id'] = forecast_run_id
    forecasts_df.to_sql(
        'forecast_county',
        engine,
        if_exists='append',
        index=False
    )

# Usage:
# forecast_run_id = store_forecast_run(3, 'HierarchicalBayesian', 'v1.0')
# store_county_forecasts(forecast_run_id, forecasts_df)
```

---

## 🔌 Step 7: Update Backend API

### Add Forecasts Router

**File:** `backend/routers/forecasts.py`

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.database import get_db
from backend.models import ForecastRun, ForecastCounty
from backend.schemas import ForecastRunSchema, ForecastCountySchema

router = APIRouter(prefix="/forecasts", tags=["forecasts"])

@router.get("/", response_model=List[ForecastRunSchema])
async def list_forecast_runs(db: Session = Depends(get_db)):
    """List all forecast runs"""
    runs = db.query(ForecastRun).order_by(ForecastRun.run_timestamp.desc()).all()
    return runs

@router.get("/{forecast_run_id}", response_model=ForecastRunSchema)
async def get_forecast_run(forecast_run_id: str, db: Session = Depends(get_db)):
    """Get specific forecast run"""
    run = db.query(ForecastRun).filter(ForecastRun.id == forecast_run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Forecast run not found")
    return run

@router.get("/{forecast_run_id}/counties", response_model=List[ForecastCountySchema])
async def get_forecast_counties(forecast_run_id: str, db: Session = Depends(get_db)):
    """Get county-level forecasts for a run"""
    forecasts = db.query(ForecastCounty).filter(
        ForecastCounty.forecast_run_id == forecast_run_id
    ).all()
    return forecasts
```

### Update main.py:
```python
from backend.routers import forecasts

app.include_router(forecasts.router, prefix="/api")
```

---

## 🎨 Step 8: Update Frontend Dashboard

### Add Forecast Visualization Component

**File:** `frontend/components/charts/ForecastWithUncertainty.tsx`

```typescript
'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface ForecastData {
  candidate: string;
  mean: number;
  lower: number;
  upper: number;
}

export default function ForecastWithUncertainty({ data }: { data: ForecastData[] }) {
  return (
    <AreaChart width={600} height={400} data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="candidate" />
      <YAxis domain={[0, 100]} label={{ value: 'Vote Share %', angle: -90 }} />
      <Tooltip />
      <Legend />
      
      {/* Uncertainty band */}
      <Area
        type="monotone"
        dataKey="upper"
        stackId="1"
        stroke="#3b82f6"
        fill="#3b82f6"
        fillOpacity={0.2}
      />
      <Area
        type="monotone"
        dataKey="lower"
        stackId="1"
        stroke="#3b82f6"
        fill="#ffffff"
        fillOpacity={1}
      />
      
      {/* Point estimate */}
      <Area
        type="monotone"
        dataKey="mean"
        stroke="#1d4ed8"
        strokeWidth={3}
        fill="none"
      />
    </AreaChart>
  );
}
```

---

## ✅ Success Criteria

### Model Training:
- [ ] PyMC and dependencies installed
- [ ] Data prepared from database
- [ ] Model fits without errors
- [ ] R-hat < 1.01 for all parameters
- [ ] ESS > 400 for all parameters
- [ ] No divergences during sampling

### Forecasts:
- [ ] 2027 forecasts generated
- [ ] Uncertainty bands calculated (90% CI)
- [ ] Forecasts stored in database
- [ ] API returns forecast data
- [ ] Frontend displays forecasts with uncertainty

### Validation:
- [ ] Cross-validation on 2017 data
- [ ] Forecast accuracy metrics calculated
- [ ] Diagnostics plots generated
- [ ] Model documentation complete

---

## 📊 Expected Timeline

- **Step 1 (Dependencies):** 10 minutes
- **Step 2 (Data Prep):** 15 minutes
- **Step 3 (Model Update):** 30 minutes
- **Step 4 (Training):** 20-30 minutes (MCMC sampling)
- **Step 5 (Prediction):** 5 minutes
- **Step 6 (Database):** 15 minutes
- **Step 7 (API):** 20 minutes
- **Step 8 (Frontend):** 30 minutes

**Total:** ~2-3 hours

---

## 🚀 Quick Start Commands

```bash
# 1. Install dependencies
cd backend
source venv/bin/activate
pip install pymc arviz jax numpyro scikit-learn matplotlib seaborn

# 2. Prepare data
cd ../models
python prepare_data.py

# 3. Fit model
python hierarchical_bayesian.py --fit --election-year 2022

# 4. Generate forecasts
python hierarchical_bayesian.py --predict --target-year 2027

# 5. Store in database
python store_forecasts.py

# 6. Test API
curl http://localhost:8001/api/forecasts/

# 7. View in frontend
# Navigate to http://localhost:3000/forecasts
```

---

**Ready to start? Let's begin with Step 1: Installing ML dependencies!** 🚀🤖📊

