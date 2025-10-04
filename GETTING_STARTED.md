# 🚀 Getting Started with KenPoliMarket

**Complete step-by-step guide to get your local development environment running**

---

## ✅ What You Have Now

The setup script has completed and created:

- ✅ `.env` file with configuration
- ✅ Backend Python virtual environment (`backend/venv/`)
- ✅ Frontend Node.js dependencies
- ✅ Root workspace dependencies
- ✅ Helper scripts in `scripts/`

---

## 📋 Step-by-Step Setup

### **Step 1: Verify Prerequisites**

```bash
# Check your system
node --version    # Should be 18+
python3 --version # Should be 3.11+
psql --version    # Should be 15+

# Check if PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list | grep postgresql  # macOS
```

**If PostgreSQL is not installed:**

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql-15 postgresql-contrib-15 postgresql-15-postgis-3

# macOS
brew install postgresql@15 postgis

# Start PostgreSQL
sudo systemctl start postgresql  # Linux
brew services start postgresql@15  # macOS
```

---

### **Step 2: Initialize Database**

```bash
# Run the database initialization script
bash scripts/init_database.sh
```

**What this does:**
- Creates the `kenpolimarket` database
- Enables PostGIS extension
- Creates all tables from `database/schema.sql`
- Inserts initial election metadata

**If you get permission errors:**

```bash
# Create database and user manually
sudo -u postgres psql

# In PostgreSQL shell:
CREATE DATABASE kenpolimarket;
CREATE USER kenpolimarket WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE kenpolimarket TO kenpolimarket;
ALTER DATABASE kenpolimarket OWNER TO kenpolimarket;
\c kenpolimarket
CREATE EXTENSION IF NOT EXISTS postgis;
\q

# Then run the init script again
bash scripts/init_database.sh
```

---

### **Step 3: Start Backend API**

```bash
# Open a new terminal
cd backend

# Activate virtual environment
source venv/bin/activate

# Start the API server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Expected output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

**Test the API:**

```bash
# In another terminal
curl http://localhost:8000/api/health

# Should return:
# {"status":"healthy","database":"connected","redis":"connected"}

# View API documentation
xdg-open http://localhost:8000/api/docs  # Linux
open http://localhost:8000/api/docs      # macOS
```

---

### **Step 4: Start Frontend**

```bash
# Open a new terminal
cd frontend

# Start development server
npm run dev
```

**Expected output:**
```
  ▲ Next.js 15.5.4
  - Local:        http://localhost:3000
  - Network:      http://192.168.x.x:3000

 ✓ Starting...
 ✓ Ready in 2.3s
```

**Test the frontend:**

```bash
# Open in browser
xdg-open http://localhost:3000  # Linux
open http://localhost:3000      # macOS
```

You should see the KenPoliMarket homepage!

---

### **Step 5: Download Data**

```bash
# Run the data download script
bash scripts/download_data.sh
```

**What this does:**
- Creates `data/raw/iebc/` and `data/raw/knbs/` directories
- Attempts to download KNBS 2019 Census PDFs
- Provides instructions for manual IEBC downloads

**Manual IEBC Downloads:**

Since IEBC URLs change frequently, you'll need to download manually:

1. **Visit IEBC Website:**
   - Go to https://www.iebc.or.ke/
   - Navigate to: **Elections → 2022 General Election → Results**

2. **Download Presidential Results:**
   - Look for "Presidential Results" PDFs
   - Download county-level and constituency-level results
   - Save to `data/raw/iebc/`

3. **Alternative: Results Portal:**
   - Visit https://results.iebc.or.ke/
   - Download official PDF reports
   - Save to `data/raw/iebc/`

**Verify downloads:**

```bash
ls -lh data/raw/iebc/
ls -lh data/raw/knbs/
```

---

### **Step 6: Inspect PDF Structure**

Before running ETL, inspect the PDFs to understand their structure:

```bash
# Run the PDF inspection script
python scripts/inspect_pdfs.py
```

**What this does:**
- Opens each PDF
- Extracts text and tables from first few pages
- Shows table structure (rows, columns)
- Helps you understand how to parse the data

**Example output:**
```
📄 Inspecting: data/raw/iebc/2022_presidential_county.pdf
📊 Total pages: 50
📏 Page size: 612.0 x 792.0

📄 Page 1
────────────────────────────────────────
📝 Text Content:
2022 PRESIDENTIAL ELECTION RESULTS
COUNTY LEVEL SUMMARY
...

📊 Found 1 table(s) on this page

Table 1:
  Dimensions: 48 rows x 6 columns
  First 5 rows:
    Row 1: ['County', 'Registered Voters', 'Votes Cast', 'Turnout %', ...]
    Row 2: ['Mombasa', '645,283', '412,567', '63.9%', ...]
    ...
```

**Based on the inspection:**
- Note the column names and positions
- Check if there are header rows
- Identify county/constituency name formats
- Look for any special formatting

---

### **Step 7: Adjust ETL Parsers (If Needed)**

Based on the PDF inspection, you may need to adjust the ETL scripts:

**For IEBC data (`etl/scripts/ingest_iebc.py`):**

<augment_code_snippet path="etl/scripts/ingest_iebc.py" mode="EXCERPT">
````python
# Adjust these based on actual PDF structure
def parse_county_results(pdf_path: str):
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            tables = page.extract_tables()
            for table in tables:
                # Adjust column indices based on inspection
                county_name = table[row][0]  # Column 0
                registered_voters = table[row][1]  # Column 1
                # ... etc
````
</augment_code_snippet>

**For KNBS data (`etl/scripts/ingest_knbs.py`):**

<augment_code_snippet path="etl/scripts/ingest_knbs.py" mode="EXCERPT">
````python
# Adjust based on census PDF structure
def parse_ethnicity_table(pdf_path: str):
    # Find the ethnicity distribution table
    # Adjust page numbers and table indices
    page = pdf.pages[ETHNICITY_PAGE_NUMBER]
    tables = page.extract_tables()
    ethnicity_table = tables[TABLE_INDEX]
````
</augment_code_snippet>

---

### **Step 8: Run ETL Ingestion**

Once you've adjusted the parsers (or if you want to test with the defaults):

```bash
# Ingest IEBC data
cd etl
source ../backend/venv/bin/activate
python scripts/ingest_iebc.py --year 2022 --pdf-path ../data/raw/iebc/2022_presidential_county.pdf

# Ingest KNBS data
python scripts/ingest_knbs.py --census-year 2019 --volume-1 ../data/raw/knbs/2019_census_volume_1.pdf --volume-4 ../data/raw/knbs/2019_census_volume_4.pdf
```

**Or use npm scripts:**

```bash
# From project root
npm run etl:iebc
npm run etl:knbs
```

**Expected output:**
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

---

### **Step 9: Verify Data in Database**

```bash
# Connect to database
PGPASSWORD=password psql -h localhost -U kenpolimarket -d kenpolimarket

# Check counties
SELECT COUNT(*) FROM counties;
SELECT name, code FROM counties LIMIT 10;

# Check election results
SELECT COUNT(*) FROM election_results_county;
SELECT * FROM election_results_county LIMIT 5;

# Check ethnicity aggregates (privacy-preserving)
SELECT COUNT(*) FROM county_ethnicity_aggregate;
SELECT county_id, ethnicity_group, population_count 
FROM county_ethnicity_aggregate 
WHERE population_count >= 10  -- Privacy threshold
LIMIT 10;

# Exit
\q
```

---

### **Step 10: Test API with Real Data**

```bash
# Get all counties
curl http://localhost:8000/api/counties/

# Get specific county
curl http://localhost:8000/api/counties/001  # Mombasa

# Get latest forecasts (will be empty until models are run)
curl http://localhost:8000/api/forecasts/latest

# Get election results
curl http://localhost:8000/api/elections/1/results
```

---

## 🎯 Success Checklist

You're ready to proceed when:

- ✅ PostgreSQL is running
- ✅ Database initialized with schema
- ✅ Backend API running on http://localhost:8000
- ✅ Frontend running on http://localhost:3000
- ✅ API health check returns "healthy"
- ✅ IEBC and KNBS PDFs downloaded
- ✅ PDFs inspected and structure understood
- ✅ ETL scripts run successfully
- ✅ Data visible in database
- ✅ API returns real data

---

## 🚀 Next Steps

Once your environment is fully set up with data:

### 1. **Fit Forecasting Models**

```bash
cd models
source ../backend/venv/bin/activate
python hierarchical_bayesian.py --fit --election-year 2022
```

### 2. **Generate Forecasts**

```bash
python hierarchical_bayesian.py --predict --target-year 2027
```

### 3. **Build Dashboard**

Create the forecast dashboard page:

```bash
cd frontend/app
mkdir forecasts
# Create forecasts/page.tsx with visualization components
```

### 4. **Add Visualizations**

- County map (D3.js + TopoJSON)
- Forecast charts (Recharts)
- Uncertainty bands
- Historical accuracy

---

## 🔧 Troubleshooting

### Backend won't start

```bash
# Check if port 8000 is in use
lsof -i :8000

# Kill process if needed
kill -9 <PID>

# Check backend logs
cd backend
source venv/bin/activate
uvicorn main:app --reload --log-level debug
```

### Frontend won't start

```bash
# Check if port 3000 is in use
lsof -i :3000

# Clear Next.js cache
cd frontend
rm -rf .next
npm run dev
```

### Database connection errors

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check if database exists
PGPASSWORD=password psql -h localhost -U kenpolimarket -l

# Reinitialize if needed
bash scripts/init_database.sh
```

### ETL errors

```bash
# Check PDF files exist
ls -lh data/raw/iebc/
ls -lh data/raw/knbs/

# Run inspection first
python scripts/inspect_pdfs.py

# Check ETL logs
cd etl
source ../backend/venv/bin/activate
python scripts/ingest_iebc.py --debug
```

---

## 📚 Additional Resources

- **API Documentation**: http://localhost:8000/api/docs
- **Project README**: `README.md`
- **Architecture**: `docs/architecture.md`
- **Privacy Policy**: `docs/privacy.md`
- **Quick Start**: `docs/QUICKSTART.md`

---

**🎉 You're all set! Happy forecasting! 🇰🇪📊**

