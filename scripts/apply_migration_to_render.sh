#!/bin/bash

# Script to apply database migrations to Render PostgreSQL
# Usage: ./scripts/apply_migration_to_render.sh <RENDER_DATABASE_URL>

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}KenPoliMarket - Render Migration Script${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if DATABASE_URL is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: DATABASE_URL not provided${NC}"
    echo ""
    echo "Usage: $0 <RENDER_DATABASE_URL>"
    echo ""
    echo "Example:"
    echo "  $0 'postgresql://user:password@host:5432/database'"
    echo ""
    echo "To get your Render DATABASE_URL:"
    echo "  1. Go to https://dashboard.render.com"
    echo "  2. Select your PostgreSQL database"
    echo "  3. Copy the 'External Database URL' or 'Internal Database URL'"
    echo ""
    exit 1
fi

DATABASE_URL="$1"

echo -e "${YELLOW}Database URL:${NC} ${DATABASE_URL:0:30}... (truncated for security)"
echo ""

# Test connection
echo -e "${YELLOW}Testing database connection...${NC}"
if psql "$DATABASE_URL" -c "SELECT version();" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Connection successful${NC}"
else
    echo -e "${RED}✗ Connection failed${NC}"
    echo ""
    echo "Please check:"
    echo "  - Database URL is correct"
    echo "  - Database is accessible from your network"
    echo "  - PostgreSQL client (psql) is installed"
    exit 1
fi
echo ""

# Check if migration has already been applied
echo -e "${YELLOW}Checking if migration is needed...${NC}"
COLUMN_EXISTS=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.columns WHERE table_name='candidates' AND column_name='county_id';" 2>/dev/null | tr -d ' ')

if [ "$COLUMN_EXISTS" = "1" ]; then
    echo -e "${YELLOW}⚠ Migration already applied (county_id column exists)${NC}"
    echo ""
    read -p "Do you want to re-apply the migration? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${GREEN}Skipping migration${NC}"
        exit 0
    fi
    echo -e "${YELLOW}Re-applying migration...${NC}"
fi
echo ""

# Apply migration
echo -e "${YELLOW}Applying migration: 001_add_position_specific_fields.sql${NC}"
if psql "$DATABASE_URL" -f database/migrations/001_add_position_specific_fields.sql; then
    echo -e "${GREEN}✓ Migration applied successfully${NC}"
else
    echo -e "${RED}✗ Migration failed${NC}"
    exit 1
fi
echo ""

# Verify migration
echo -e "${YELLOW}Verifying migration...${NC}"
COLUMNS=$(psql "$DATABASE_URL" -t -c "SELECT column_name FROM information_schema.columns WHERE table_name='candidates' AND column_name IN ('county_id', 'constituency_id', 'ward_id') ORDER BY column_name;" 2>/dev/null)

if echo "$COLUMNS" | grep -q "county_id" && echo "$COLUMNS" | grep -q "constituency_id" && echo "$COLUMNS" | grep -q "ward_id"; then
    echo -e "${GREEN}✓ All columns created successfully:${NC}"
    echo "  - county_id"
    echo "  - constituency_id"
    echo "  - ward_id"
else
    echo -e "${RED}✗ Verification failed - some columns missing${NC}"
    exit 1
fi
echo ""

# Check indexes
echo -e "${YELLOW}Verifying indexes...${NC}"
INDEXES=$(psql "$DATABASE_URL" -t -c "SELECT indexname FROM pg_indexes WHERE tablename='candidates' AND indexname LIKE 'idx_candidates_%';" 2>/dev/null)

if echo "$INDEXES" | grep -q "idx_candidates_county" && echo "$INDEXES" | grep -q "idx_candidates_constituency" && echo "$INDEXES" | grep -q "idx_candidates_ward"; then
    echo -e "${GREEN}✓ All indexes created successfully:${NC}"
    echo "  - idx_candidates_county"
    echo "  - idx_candidates_constituency"
    echo "  - idx_candidates_ward"
else
    echo -e "${YELLOW}⚠ Some indexes may be missing${NC}"
fi
echo ""

# Show current candidates table structure
echo -e "${YELLOW}Current candidates table structure:${NC}"
psql "$DATABASE_URL" -c "\d candidates"
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Migration completed successfully! ✓${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Next steps:"
echo "  1. Verify your backend deployment on Render"
echo "  2. Test the candidate creation with position-specific fields"
echo "  3. Check that cascading dropdowns work in the admin panel"
echo ""

