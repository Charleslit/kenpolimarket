# Manual Database Setup Instructions

Since automated setup requires sudo access, please run these commands manually in your terminal:

## Step 1: Create Database and User

```bash
# Switch to postgres user and create database
sudo -u postgres psql << 'EOF'
CREATE DATABASE kenpolimarket;
CREATE USER kenpolimarket WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE kenpolimarket TO kenpolimarket;
ALTER DATABASE kenpolimarket OWNER TO kenpolimarket;
\c kenpolimarket
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
\q
EOF
```

## Step 2: Initialize Schema

```bash
cd /home/charles/Documents/augment-projects/kenpolimarket
PGPASSWORD=password psql -h localhost -U kenpolimarket -d kenpolimarket < database/schema.sql
```

## Step 3: Load Sample Data

```bash
cd /home/charles/Documents/augment-projects/kenpolimarket
source backend/venv/bin/activate
python etl/scripts/load_sample_data.py
```

## Step 4: Verify Data

```bash
PGPASSWORD=password psql -h localhost -U kenpolimarket -d kenpolimarket << 'EOF'
SELECT COUNT(*) as county_count FROM counties;
SELECT COUNT(*) as results_count FROM election_results_county;
SELECT COUNT(*) as ethnicity_count FROM county_ethnicity_aggregate;
SELECT MIN(population_count) as min_ethnicity_count FROM county_ethnicity_aggregate;
\q
EOF
```

## Step 5: Start Backend API

```bash
cd /home/charles/Documents/augment-projects/kenpolimarket/backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Step 6: Start Frontend (in another terminal)

```bash
cd /home/charles/Documents/augment-projects/kenpolimarket/frontend
npm run dev
```

## Verification

Once everything is running:

```bash
# Test backend
curl http://localhost:8000/api/health

# Test counties endpoint
curl http://localhost:8000/api/counties/

# Open frontend in browser
xdg-open http://localhost:3000
```

---

**After completing these steps, you'll have:**
- ✅ PostgreSQL database with schema
- ✅ Sample data loaded (47 counties, 2022 & 2017 results, ethnicity aggregates)
- ✅ Backend API running
- ✅ Frontend running

Then you can proceed to Priority 2 (Backend API completion) and Priority 3 (Frontend dashboard).

