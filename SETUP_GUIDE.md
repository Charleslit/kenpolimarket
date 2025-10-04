# KenPoliMarket - Complete Local Setup Guide

## 🚀 Quick Start (Choose Your Path)

### Option A: Docker Setup (Recommended)
### Option B: Manual Setup (If Docker unavailable)

---

## 📋 Prerequisites Check

Run these commands to verify your system:

```bash
# Check Node.js (need 18+)
node --version

# Check Python (need 3.11+)
python3 --version

# Check PostgreSQL (need 15+)
psql --version

# Check Docker (optional but recommended)
docker --version
docker-compose --version
```

---

## 🐳 **Option A: Docker Setup** (Fastest)

### Step 1: Start Database Services

```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Verify services are running
docker-compose ps

# Check logs
docker-compose logs postgres
docker-compose logs redis
```

### Step 2: Initialize Database Schema

```bash
# Wait for PostgreSQL to be ready (about 10 seconds)
sleep 10

# Initialize the database schema
docker-compose exec postgres psql -U kenpolimarket -d kenpolimarket -f /docker-entrypoint-initdb.d/schema.sql

# Or manually:
PGPASSWORD=password psql -h localhost -U kenpolimarket -d kenpolimarket < database/schema.sql
```

### Step 3: Start Backend API

```bash
# Option 1: Using Docker
docker-compose up -d backend

# Option 2: Manually (for development with hot reload)
cd backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Step 4: Start Frontend

```bash
# In a new terminal
cd frontend
npm run dev
```

### Step 5: Verify Everything is Running

```bash
# Check all services
docker-compose ps

# Test backend API
curl http://localhost:8000/api/health

# Test frontend
curl http://localhost:3000
```

---

## 🔧 **Option B: Manual Setup** (No Docker)

### Step 1: Install PostgreSQL Locally

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql-15 postgresql-contrib-15 postgis

# macOS
brew install postgresql@15 postgis

# Start PostgreSQL
sudo systemctl start postgresql  # Linux
brew services start postgresql@15  # macOS
```

### Step 2: Create Database and User

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL shell:
CREATE DATABASE kenpolimarket;
CREATE USER kenpolimarket WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE kenpolimarket TO kenpolimarket;
ALTER DATABASE kenpolimarket OWNER TO kenpolimarket;

# Enable PostGIS extension
\c kenpolimarket
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

# Exit
\q
```

### Step 3: Initialize Database Schema

```bash
# Load the schema
PGPASSWORD=password psql -h localhost -U kenpolimarket -d kenpolimarket < database/schema.sql

# Verify tables were created
PGPASSWORD=password psql -h localhost -U kenpolimarket -d kenpolimarket -c "\dt"
```

### Step 4: Install Redis Locally

```bash
# Ubuntu/Debian
sudo apt install redis-server
sudo systemctl start redis

# macOS
brew install redis
brew services start redis

# Test Redis
redis-cli ping  # Should return "PONG"
```

### Step 5: Start Backend API

```bash
cd backend

# Activate virtual environment
source venv/bin/activate

# Install dependencies (if not already done)
pip install -r requirements.txt

# Start the API server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Step 6: Start Frontend

```bash
# In a new terminal
cd frontend

# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

---

## ✅ Verification Steps

### 1. Check Database Connection

```bash
# Test PostgreSQL connection
PGPASSWORD=password psql -h localhost -U kenpolimarket -d kenpolimarket -c "SELECT version();"

# List all tables
PGPASSWORD=password psql -h localhost -U kenpolimarket -d kenpolimarket -c "\dt"

# Check PostGIS extension
PGPASSWORD=password psql -h localhost -U kenpolimarket -d kenpolimarket -c "SELECT PostGIS_version();"
```

### 2. Check Redis Connection

```bash
redis-cli ping
redis-cli set test "Hello KenPoliMarket"
redis-cli get test
```

### 3. Test Backend API

```bash
# Health check
curl http://localhost:8000/api/health

# API documentation
curl http://localhost:8000/api/docs

# Privacy policy endpoint
curl http://localhost:8000/api/privacy-policy

# List counties (will be empty until data is ingested)
curl http://localhost:8000/api/counties/
```

### 4. Test Frontend

```bash
# Check if frontend is running
curl -I http://localhost:3000

# Open in browser
xdg-open http://localhost:3000  # Linux
open http://localhost:3000      # macOS
```

---

## 📊 **Next Step: Data Ingestion**

Once your environment is running, proceed to data ingestion:

### Create Data Directory

```bash
mkdir -p data/raw/iebc
mkdir -p data/raw/knbs
mkdir -p data/processed
```

### Download IEBC Data

The IEBC (Independent Electoral and Boundaries Commission) publishes official election results:

**2022 Presidential Results:**
- Official source: https://www.iebc.or.ke/
- Navigate to: Elections → 2022 General Election → Results
- Download county-level and constituency-level PDFs

**Manual download commands:**

```bash
cd data/raw/iebc

# 2022 Presidential Results (example - adjust URL based on actual IEBC site)
# Note: IEBC URLs change frequently, check their website for current links
wget https://www.iebc.or.ke/uploads/resources/2022_Presidential_Results.pdf

# Alternative: Use the IEBC results portal
# https://results.iebc.or.ke/
```

### Download KNBS Census Data

The Kenya National Bureau of Statistics (KNBS) publishes census data:

**2019 Census Data:**
- Official source: https://www.knbs.or.ke/
- Navigate to: Publications → Census → 2019 Kenya Population and Housing Census

**Required volumes:**

```bash
cd data/raw/knbs

# Volume I: Population by County and Sub-County
wget https://www.knbs.or.ke/download/2019-kenya-population-and-housing-census-volume-i-population-by-county-and-sub-county/

# Volume IV: Distribution of Population by Socio-Economic Characteristics
wget https://www.knbs.or.ke/download/2019-kenya-population-and-housing-census-volume-iv-distribution-of-population-by-socio-economic-characteristics/
```

### Inspect PDF Structure

Before running ETL scripts, inspect the PDFs to understand their structure:

```bash
# Install pdfplumber if not already installed
pip install pdfplumber

# Create a quick inspection script
python3 << 'EOF'
import pdfplumber

# Inspect IEBC PDF
with pdfplumber.open('data/raw/iebc/2022_Presidential_Results.pdf') as pdf:
    print(f"Total pages: {len(pdf.pages)}")
    print("\n=== First Page ===")
    print(pdf.pages[0].extract_text())
    print("\n=== Tables on First Page ===")
    tables = pdf.pages[0].extract_tables()
    for i, table in enumerate(tables):
        print(f"\nTable {i+1}:")
        for row in table[:5]:  # First 5 rows
            print(row)
EOF
```

---

## 🔍 Troubleshooting

### PostgreSQL Connection Issues

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-15-main.log

# Test connection
PGPASSWORD=password psql -h localhost -U kenpolimarket -d kenpolimarket
```

### Redis Connection Issues

```bash
# Check if Redis is running
sudo systemctl status redis

# Check Redis logs
sudo tail -f /var/log/redis/redis-server.log

# Test connection
redis-cli ping
```

### Backend API Issues

```bash
# Check if port 8000 is in use
lsof -i :8000

# Check backend logs
cd backend
source venv/bin/activate
uvicorn main:app --reload --log-level debug
```

### Frontend Issues

```bash
# Check if port 3000 is in use
lsof -i :3000

# Clear Next.js cache
cd frontend
rm -rf .next
npm run dev
```

### Docker Issues

```bash
# Check Docker daemon
sudo systemctl status docker

# Restart Docker
sudo systemctl restart docker

# Check Docker Compose logs
docker-compose logs -f

# Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

## 📝 Environment Variables

Make sure your `.env` file has the correct values:

```bash
# View current .env
cat .env

# Edit if needed
nano .env  # or vim .env
```

**Key variables to verify:**

- `DATABASE_URL`: Should match your PostgreSQL setup
- `REDIS_URL`: Should match your Redis setup
- `BACKEND_URL`: Should be http://localhost:8000
- `NEXT_PUBLIC_API_URL`: Should be http://localhost:8000

---

## 🎯 Success Criteria

You're ready to proceed when:

- ✅ PostgreSQL is running and accessible
- ✅ Redis is running and accessible
- ✅ Database schema is initialized (tables created)
- ✅ Backend API responds to http://localhost:8000/api/health
- ✅ Frontend loads at http://localhost:3000
- ✅ API docs accessible at http://localhost:8000/api/docs
- ✅ Data directories created

---

## 🚀 Next Steps

Once everything is verified:

1. **Download real IEBC and KNBS data** (see sections above)
2. **Inspect PDF structure** to adjust ETL parsers
3. **Run ETL scripts** to ingest data
4. **Verify data in database**
5. **Fit forecasting models**
6. **Build dashboard visualizations**

See `docs/QUICKSTART.md` for detailed next steps!

---

**Last Updated**: 2025-10-03

