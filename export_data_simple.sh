#!/bin/bash

# Simple script to export Docker PostgreSQL data to Render
# This uses pg_dump and psql directly

set -e

echo "🚀 Export KenPoliMarket Data to Render"
echo "======================================"
echo ""

# Render database URL
RENDER_DB_URL="postgresql://kenpolimarket:bC41dQ7drjIr5Fa7iWfxNoPjHLmyEUzV@dpg-d3ginq7fte5s73c6j060-a.oregon-postgres.render.com/kenpolimarket"

echo "📋 Step 1: Export from Docker PostgreSQL"
echo "========================================="
echo ""

# Create backup directory
mkdir -p database_backups
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="database_backups/kenpolimarket_${TIMESTAMP}.sql"

echo "Exporting data from Docker container..."
echo "Container: kenpolimarket-postgres"
echo "Database: kenpolimarket"
echo ""

# Export data from Docker PostgreSQL
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
echo "📋 Step 2: Import to Render Database"
echo "====================================="
echo ""
echo "⚠️  This will import data to your Render database."
echo ""
read -p "Continue with import? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Import cancelled."
    echo "Backup file saved at: $BACKUP_FILE"
    exit 0
fi

echo ""
echo "Importing to Render..."
echo ""

# Import to Render
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
echo "📋 Step 3: Verify Data"
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
echo "🎉 Export Complete!"
echo ""
echo "Summary:"
echo "  ✅ Data exported from Docker PostgreSQL"
echo "  ✅ Data imported to Render"
echo "  ✅ Backup saved: $BACKUP_FILE"
echo ""
echo "Next steps:"
echo "  1. Test backend: https://kenpolimarket-backend.onrender.com/api/docs"
echo "  2. Test frontend: https://kenpolimarket.vercel.app"
echo ""
echo "🚀 Your app is now live with data!"

