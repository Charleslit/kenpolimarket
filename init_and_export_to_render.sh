#!/bin/bash

# Complete script to initialize Render database and import data
# This script:
# 1. Creates database schema on Render (tables, indexes, etc.)
# 2. Exports data from local Docker PostgreSQL
# 3. Imports data to Render

set -e

echo "🚀 Initialize Render Database and Import Data"
echo "=============================================="
echo ""

# Render database URL
RENDER_DB_URL="postgresql://kenpolimarket:bC41dQ7drjIr5Fa7iWfxNoPjHLmyEUzV@dpg-d3ginq7fte5s73c6j060-a.oregon-postgres.render.com/kenpolimarket"

echo "📋 Step 1: Create Database Schema on Render"
echo "============================================"
echo ""

# First, export the schema from local database
echo "Exporting schema from local Docker PostgreSQL..."
docker exec kenpolimarket-postgres pg_dump \
    -U kenpolimarket \
    -d kenpolimarket \
    --schema-only \
    --no-owner \
    --no-privileges \
    > database_backups/schema.sql

echo "✅ Schema exported"
echo ""

# Create schema on Render
echo "Creating schema on Render database..."
psql "$RENDER_DB_URL" < database_backups/schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Schema created on Render"
else
    echo "❌ Schema creation failed"
    exit 1
fi

echo ""
echo "📋 Step 2: Export Data from Docker PostgreSQL"
echo "=============================================="
echo ""

# Create backup directory
mkdir -p database_backups
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="database_backups/kenpolimarket_data_${TIMESTAMP}.sql"

echo "Exporting data from Docker container..."
docker exec kenpolimarket-postgres pg_dump \
    -U kenpolimarket \
    -d kenpolimarket \
    --data-only \
    --no-owner \
    --no-privileges \
    --column-inserts \
    > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Data exported successfully!"
    echo "   File: $BACKUP_FILE"
    echo "   Size: $(du -h "$BACKUP_FILE" | cut -f1)"
else
    echo "❌ Export failed"
    exit 1
fi

echo ""
echo "📋 Step 3: Import Data to Render Database"
echo "=========================================="
echo ""

echo "Importing data to Render..."
psql "$RENDER_DB_URL" < "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Data imported to Render successfully!"
else
    echo ""
    echo "❌ Import failed"
    echo "Backup file is still available at: $BACKUP_FILE"
    exit 1
fi

echo ""
echo "📋 Step 4: Verify Data"
echo "======================"
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
echo "🎉 Database Initialization Complete!"
echo ""
echo "Summary:"
echo "  ✅ Schema created on Render"
echo "  ✅ Data exported from Docker PostgreSQL"
echo "  ✅ Data imported to Render"
echo "  ✅ Backup saved: $BACKUP_FILE"
echo ""
echo "Next steps:"
echo "  1. Test backend: https://kenpolimarket-backend.onrender.com/api/docs"
echo "  2. Test frontend: https://kenpolimarket.vercel.app"
echo ""
echo "🚀 Your app is now live with data!"

