#!/bin/bash

# Setup script for polling station data
# This script will:
# 1. Apply database migration
# 2. Import CSV data
# 3. Verify the import

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}KenPoliMarket - Polling Station Setup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if DATABASE_URL is provided
if [ -z "$1" ]; then
    echo -e "${YELLOW}Usage: $0 <DATABASE_URL>${NC}"
    echo ""
    echo "Examples:"
    echo "  Local:  $0 'postgresql://kenpolimarket:password@localhost:5433/kenpolimarket'"
    echo "  Render: $0 'postgresql://kenpolimarket:***@dpg-xxx.oregon-postgres.render.com/kenpolimarket'"
    echo ""
    exit 1
fi

DATABASE_URL="$1"

echo -e "${YELLOW}Database:${NC} ${DATABASE_URL:0:40}... (truncated)"
echo ""

# Step 1: Apply Migration
echo -e "${YELLOW}Step 1: Applying database migration...${NC}"
if psql "$DATABASE_URL" -f database/migrations/002_add_polling_stations.sql > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Migration applied successfully${NC}"
else
    echo -e "${RED}✗ Migration failed${NC}"
    echo "This might be okay if the tables already exist."
    echo "Continuing..."
fi
echo ""

# Step 2: Check if CSV file exists
CSV_FILE="data/rov_per_polling_station.csv"
if [ ! -f "$CSV_FILE" ]; then
    echo -e "${RED}✗ CSV file not found: $CSV_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Found CSV file: $CSV_FILE${NC}"
FILE_SIZE=$(du -h "$CSV_FILE" | cut -f1)
LINE_COUNT=$(wc -l < "$CSV_FILE")
echo -e "  Size: $FILE_SIZE"
echo -e "  Lines: $LINE_COUNT"
echo ""

# Step 3: Import Data
echo -e "${YELLOW}Step 2: Importing polling station data...${NC}"
echo -e "${YELLOW}This may take several minutes for 52,000+ records...${NC}"
echo ""

python3 scripts/import_polling_stations.py \
    --database-url "$DATABASE_URL" \
    --csv-file "$CSV_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ Data import completed${NC}"
else
    echo ""
    echo -e "${RED}✗ Data import failed${NC}"
    exit 1
fi
echo ""

# Step 4: Verify Import
echo -e "${YELLOW}Step 3: Verifying import...${NC}"

# Check polling stations count
PS_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM polling_stations;" 2>/dev/null | tr -d ' ')
RC_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM registration_centers;" 2>/dev/null | tr -d ' ')
TOTAL_VOTERS=$(psql "$DATABASE_URL" -t -c "SELECT COALESCE(SUM(registered_voters_2022), 0) FROM polling_stations;" 2>/dev/null | tr -d ' ')

echo -e "${GREEN}✓ Verification Results:${NC}"
echo -e "  Polling Stations: ${BLUE}$PS_COUNT${NC}"
echo -e "  Registration Centers: ${BLUE}$RC_COUNT${NC}"
echo -e "  Total Registered Voters: ${BLUE}$TOTAL_VOTERS${NC}"
echo ""

# Check if counts are reasonable
if [ "$PS_COUNT" -lt 50000 ]; then
    echo -e "${YELLOW}⚠ Warning: Expected ~52,000 polling stations, got $PS_COUNT${NC}"
fi

if [ "$TOTAL_VOTERS" -lt 20000000 ]; then
    echo -e "${YELLOW}⚠ Warning: Expected ~22M voters, got $TOTAL_VOTERS${NC}"
fi

# Show sample data
echo -e "${YELLOW}Sample Data:${NC}"
psql "$DATABASE_URL" -c "
SELECT 
    ps.code,
    ps.name,
    ps.registered_voters_2022,
    co.name as county
FROM polling_stations ps
LEFT JOIN counties co ON ps.county_id = co.id
ORDER BY ps.registered_voters_2022 DESC
LIMIT 5;
" 2>/dev/null

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Setup Complete! ✓${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Next steps:"
echo "  1. Start your backend: cd backend && uvicorn main:app --reload"
echo "  2. Start your frontend: cd frontend && npm run dev"
echo "  3. Visit: http://localhost:3000/voter-registration"
echo ""

