# 🚀 KenPoliMarket - Your Next Steps

**Current Status**: Foundation complete, ready for data ingestion and development

---

## ✅ What's Already Done

- ✅ Project structure created
- ✅ Dependencies installed (Node.js, Python)
- ✅ `.env` file configured
- ✅ Backend virtual environment set up
- ✅ Frontend dependencies installed
- ✅ Helper scripts created
- ✅ Documentation complete

---

## 📋 Immediate Action Plan

### **Option 1: Quick Start with Docker** (Recommended if Docker is available)

```bash
# 1. Check Docker status
docker --version
docker-compose --version

# 2. Start database services (PostgreSQL + Redis)
docker-compose up -d postgres redis

# 3. Wait for services to be ready (about 30 seconds)
sleep 30

# 4. Check services are running
docker-compose ps

# 5. Initialize database
bash scripts/init_database.sh

# 6. Start backend API
docker-compose up -d backend

# 7. Start frontend (in a new terminal)
cd frontend
npm run dev

# 8. Verify everything is running
bash scripts/check_status.sh
```

### **Option 2: Manual Setup** (If Docker is not available)

```bash
# 1. Install PostgreSQL locally
# Ubuntu/Debian:
sudo apt update
sudo apt install postgresql-15 postgresql-contrib-15 postgresql-15-postgis-3
sudo systemctl start postgresql

# macOS:
brew install postgresql@15 postgis
brew services start postgresql@15

# 2. Create database and user
sudo -u postgres psql
# In PostgreSQL shell:
CREATE DATABASE kenpolimarket;
CREATE USER kenpolimarket WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE kenpolimarket TO kenpolimarket;
ALTER DATABASE kenpolimarket OWNER TO kenpolimarket;
\c kenpolimarket
CREATE EXTENSION IF NOT EXISTS postgis;
\q

# 3. Initialize database schema
bash scripts/init_database.sh

# 4. Install and start Redis
# Ubuntu/Debian:
sudo apt install redis-server
sudo systemctl start redis

# macOS:
brew install redis
brew services start redis

# 5. Start backend API (in one terminal)
cd backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 6. Start frontend (in another terminal)
cd frontend
npm run dev

# 7. Verify everything is running
bash scripts/check_status.sh
```

---

## 📊 Data Ingestion Workflow

Once your services are running, follow these steps to get real data:

### **Step 1: Download Data**

```bash
# Run the download script
bash scripts/download_data.sh

# This will:
# - Create data directories
# - Attempt to download KNBS census PDFs
# - Provide instructions for manual IEBC downloads
```

### **Step 2: Manual IEBC Downloads**

Since IEBC URLs change frequently, download manually:

1. **Visit**: https://www.iebc.or.ke/
2. **Navigate to**: Elections → 2022 General Election → Results
3. **Download**:
   - Presidential Results (County Level)
   - Presidential Results (Constituency Level)
4. **Save to**: `data/raw/iebc/`

**Alternative**: Visit https://results.iebc.or.ke/ and download official PDF reports

### **Step 3: Inspect PDF Structure**

```bash
# Run the inspection script
python scripts/inspect_pdfs.py

# This will show you:
# - PDF structure (pages, tables)
# - Column names and positions
# - Data formats
```

**Example output**:
```
📄 Inspecting: data/raw/iebc/2022_presidential_county.pdf
📊 Total pages: 50

📄 Page 1
────────────────────────────────────────
📊 Found 1 table(s)

Table 1:
  Dimensions: 48 rows x 6 columns
  First 5 rows:
    Row 1: ['County', 'Registered Voters', 'Votes Cast', ...]
    Row 2: ['Mombasa', '645,283', '412,567', ...]
```

### **Step 4: Adjust ETL Parsers** (If Needed)

Based on the PDF inspection, you may need to update the ETL scripts:

**Edit `etl/scripts/ingest_iebc.py`**:
- Adjust column indices based on actual PDF structure
- Update page numbers if needed
- Modify parsing logic for specific formats

**Edit `etl/scripts/ingest_knbs.py`**:
- Adjust table extraction logic
- Update ethnicity group names
- Verify privacy thresholds

### **Step 5: Run ETL Ingestion**

```bash
# Activate Python environment
cd backend
source venv/bin/activate
cd ../etl

# Ingest IEBC data
python scripts/ingest_iebc.py \
  --year 2022 \
  --pdf-path ../data/raw/iebc/2022_presidential_county.pdf

# Ingest KNBS data
python scripts/ingest_knbs.py \
  --census-year 2019 \
  --volume-1 ../data/raw/knbs/2019_census_volume_1.pdf \
  --volume-4 ../data/raw/knbs/2019_census_volume_4.pdf
```

**Expected output**:
```
🇰🇪 IEBC Data Ingestion
=======================
📂 Processing: ../data/raw/iebc/2022_presidential_county.pdf
✅ Parsed 47 counties
✅ Inserted 47 records into database
📊 Summary:
   - Total registered voters: 22,120,458
   - Total votes cast: 14,213,137
   - National turnout: 64.3%
✅ Ingestion complete!
```

### **Step 6: Verify Data in Database**

```bash
# Connect to database
PGPASSWORD=password psql -h localhost -U kenpolimarket -d kenpolimarket

# Check data
SELECT COUNT(*) FROM counties;
SELECT COUNT(*) FROM election_results_county;
SELECT COUNT(*) FROM county_ethnicity_aggregate;

# View sample data
SELECT * FROM counties LIMIT 5;
SELECT * FROM election_results_county LIMIT 5;

# Verify privacy thresholds
SELECT MIN(population_count) FROM county_ethnicity_aggregate;
-- Should be >= 10

\q
```

---

## 🧪 Testing the API

Once data is ingested, test the API endpoints:

```bash
# Health check
curl http://localhost:8000/api/health

# Get all counties
curl http://localhost:8000/api/counties/

# Get specific county
curl http://localhost:8000/api/counties/001

# Get election results
curl http://localhost:8000/api/elections/1/results

# View API documentation
# Open in browser: http://localhost:8000/api/docs
```

---

## 🎨 Frontend Development

### **Current State**
- ✅ Homepage with feature showcase
- ✅ Responsive design
- ✅ TailwindCSS styling

### **Next: Build Dashboard**

```bash
cd frontend/app

# Create forecasts page
mkdir forecasts
touch forecasts/page.tsx

# Create components directory
mkdir -p components/charts
mkdir -p components/maps
mkdir -p components/ui
```

**Example forecast page** (`frontend/app/forecasts/page.tsx`):

```typescript
'use client';

import { useEffect, useState } from 'react';

export default function ForecastsPage() {
  const [forecasts, setForecasts] = useState([]);

  useEffect(() => {
    fetch('http://localhost:8000/api/forecasts/latest')
      .then(res => res.json())
      .then(data => setForecasts(data));
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">
        2027 Election Forecasts
      </h1>
      
      {/* Add visualizations here */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {forecasts.map((forecast: any) => (
          <div key={forecast.id} className="border rounded-lg p-6">
            <h3 className="font-bold">{forecast.county_name}</h3>
            <p>Turnout: {forecast.projected_turnout}%</p>
            <p className="text-sm text-gray-600">
              90% CI: [{forecast.lower_bound}, {forecast.upper_bound}]
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 📈 Model Training

Once you have data, train the forecasting models:

```bash
cd models
source ../backend/venv/bin/activate

# Fit hierarchical Bayesian model
python hierarchical_bayesian.py --fit --election-year 2022

# Generate forecasts for 2027
python hierarchical_bayesian.py --predict --target-year 2027

# View diagnostics
python hierarchical_bayesian.py --diagnostics
```

---

## 🔍 Troubleshooting

### Services Not Starting

```bash
# Check what's running
bash scripts/check_status.sh

# Check Docker logs
docker-compose logs postgres
docker-compose logs redis
docker-compose logs backend

# Restart services
docker-compose restart
```

### Database Connection Issues

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list | grep postgresql  # macOS

# Test connection
PGPASSWORD=password psql -h localhost -U kenpolimarket -d kenpolimarket -c "SELECT version();"

# Reinitialize if needed
bash scripts/init_database.sh
```

### Port Already in Use

```bash
# Check what's using port 8000
lsof -i :8000

# Check what's using port 3000
lsof -i :3000

# Kill process if needed
kill -9 <PID>
```

---

## 📚 Documentation Reference

- **Getting Started**: `GETTING_STARTED.md` - Detailed setup instructions
- **Setup Guide**: `SETUP_GUIDE.md` - Docker vs manual setup
- **Architecture**: `docs/architecture.md` - System design
- **Privacy Policy**: `docs/privacy.md` - Legal compliance
- **Quick Start**: `docs/QUICKSTART.md` - Fast track guide
- **Implementation Summary**: `IMPLEMENTATION_SUMMARY.md` - What's built
- **Status Report**: `STATUS.md` - Current progress

---

## 🎯 Success Checklist

Before proceeding to model training, ensure:

- [ ] PostgreSQL is running
- [ ] Redis is running
- [ ] Database initialized with schema
- [ ] Backend API running on http://localhost:8000
- [ ] Frontend running on http://localhost:3000
- [ ] API health check returns "healthy"
- [ ] IEBC PDFs downloaded to `data/raw/iebc/`
- [ ] KNBS PDFs downloaded to `data/raw/knbs/`
- [ ] PDFs inspected with `scripts/inspect_pdfs.py`
- [ ] ETL scripts run successfully
- [ ] Data visible in database (counties, results, ethnicity)
- [ ] API returns real data from database

**Run this to check**: `bash scripts/check_status.sh`

---

## 🚀 Development Workflow

### Daily Development

```bash
# Terminal 1: Backend
cd backend
source venv/bin/activate
uvicorn main:app --reload

# Terminal 2: Frontend
cd frontend
npm run dev

# Terminal 3: Database queries, ETL, etc.
PGPASSWORD=password psql -h localhost -U kenpolimarket -d kenpolimarket
```

### Making Changes

1. **Backend changes**: Auto-reload with `--reload` flag
2. **Frontend changes**: Hot reload automatically
3. **Database changes**: Create migration with Alembic (future)
4. **ETL changes**: Re-run ingestion scripts

---

## 🎉 You're Ready!

Your KenPoliMarket platform is set up and ready for development. Follow the steps above in order, and you'll have a fully functional forecasting system with real data.

**Start here**: Run `bash scripts/check_status.sh` to see what needs attention.

**Questions?** Check the documentation in the `docs/` folder or review the code comments.

**Happy forecasting! 🇰🇪📊**

