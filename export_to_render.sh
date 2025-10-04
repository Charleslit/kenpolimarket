#!/bin/bash

# Script to export local data and import to Render PostgreSQL database
# This script will:
# 1. Dump your local PostgreSQL data
# 2. Upload it to Render database
# 3. Run import scripts on Render

set -e  # Exit on error

echo "🚀 KenPoliMarket - Export Data to Render"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if required tools are installed
command -v pg_dump >/dev/null 2>&1 || { echo -e "${RED}❌ pg_dump is required but not installed. Install PostgreSQL client tools.${NC}" >&2; exit 1; }

echo "📋 Step 1: Get Render Database Connection String"
echo "================================================"
echo ""
echo "Go to your Render dashboard:"
echo "1. Click on 'kenpolimarket-db' (PostgreSQL)"
echo "2. Scroll down to 'Connections'"
echo "3. Copy the 'External Database URL'"
echo ""
echo "It should look like:"
echo "postgresql://kenpolimarket:xxxxx@dpg-xxxxx.oregon-postgres.render.com/kenpolimarket"
echo ""
read -p "Paste your Render Database URL here: " RENDER_DB_URL

if [ -z "$RENDER_DB_URL" ]; then
    echo -e "${RED}❌ Database URL is required${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Database URL received${NC}"
echo ""

# Local database settings
LOCAL_DB_HOST="localhost"
LOCAL_DB_PORT="5432"
LOCAL_DB_NAME="kenpolimarket"
LOCAL_DB_USER="kenpolimarket"

echo "📋 Step 2: Export Local Database"
echo "================================="
echo ""
echo "This will export data from your local database:"
echo "  Host: $LOCAL_DB_HOST"
echo "  Port: $LOCAL_DB_PORT"
echo "  Database: $LOCAL_DB_NAME"
echo "  User: $LOCAL_DB_USER"
echo ""

# Create backup directory
BACKUP_DIR="./database_backups"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/kenpolimarket_${TIMESTAMP}.sql"

echo "Exporting to: $BACKUP_FILE"
echo ""

# Export data only (no schema, since Render already has schema)
PGPASSWORD=password pg_dump \
    -h "$LOCAL_DB_HOST" \
    -p "$LOCAL_DB_PORT" \
    -U "$LOCAL_DB_USER" \
    -d "$LOCAL_DB_NAME" \
    --data-only \
    --no-owner \
    --no-privileges \
    -f "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Local database exported successfully${NC}"
    echo "   File: $BACKUP_FILE"
    echo "   Size: $(du -h "$BACKUP_FILE" | cut -f1)"
else
    echo -e "${RED}❌ Export failed${NC}"
    exit 1
fi

echo ""
echo "📋 Step 3: Import to Render Database"
echo "====================================="
echo ""
echo "⚠️  WARNING: This will add data to your Render database."
echo "   Make sure the database schema is already created."
echo ""
read -p "Continue with import? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Import cancelled."
    echo "Backup file saved at: $BACKUP_FILE"
    exit 0
fi

echo ""
echo "Importing data to Render..."
echo ""

# Import to Render database
psql "$RENDER_DB_URL" < "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Data imported to Render successfully!${NC}"
else
    echo ""
    echo -e "${RED}❌ Import failed${NC}"
    echo "Backup file is still available at: $BACKUP_FILE"
    exit 1
fi

echo ""
echo "📋 Step 4: Verify Data"
echo "======================"
echo ""
echo "Checking row counts..."
echo ""

# Check row counts
psql "$RENDER_DB_URL" -c "
SELECT 
    'elections' as table_name, COUNT(*) as rows FROM elections
UNION ALL
SELECT 'candidates', COUNT(*) FROM candidates
UNION ALL
SELECT 'counties', COUNT(*) FROM counties
UNION ALL
SELECT 'forecasts', COUNT(*) FROM forecasts
ORDER BY table_name;
"

echo ""
echo -e "${GREEN}🎉 Export Complete!${NC}"
echo ""
echo "Summary:"
echo "  ✅ Local data exported"
echo "  ✅ Data imported to Render"
echo "  ✅ Backup saved: $BACKUP_FILE"
echo ""
echo "Next steps:"
echo "  1. Test your backend: https://kenpolimarket-backend.onrender.com/api/docs"
echo "  2. Test your frontend: https://kenpolimarket.vercel.app"
echo ""
echo "🚀 Your app is now live with data!"

