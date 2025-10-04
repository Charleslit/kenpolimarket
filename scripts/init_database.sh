#!/bin/bash

# KenPoliMarket Database Initialization Script
# Initializes PostgreSQL database with schema and PostGIS extensions

set -e  # Exit on error

echo "🇰🇪 KenPoliMarket Database Initialization"
echo "=========================================="
echo ""

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "❌ .env file not found!"
    exit 1
fi

# Database connection parameters
DB_HOST=${DATABASE_HOST:-localhost}
DB_PORT=${DATABASE_PORT:-5432}
DB_NAME=${DATABASE_NAME:-kenpolimarket}
DB_USER=${DATABASE_USER:-kenpolimarket}
DB_PASSWORD=${DATABASE_PASSWORD:-password}

echo "📋 Database Configuration:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo ""

# Function to run SQL command
run_sql() {
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "$1"
}

# Function to run SQL file
run_sql_file() {
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$1"
}

# Check if PostgreSQL is accessible
echo "🔍 Checking PostgreSQL connection..."
if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "SELECT version();" > /dev/null 2>&1; then
    echo "✅ PostgreSQL is accessible"
else
    echo "❌ Cannot connect to PostgreSQL!"
    echo ""
    echo "Troubleshooting:"
    echo "1. Check if PostgreSQL is running:"
    echo "   sudo systemctl status postgresql"
    echo ""
    echo "2. Check if database user exists:"
    echo "   sudo -u postgres psql -c \"\\du\""
    echo ""
    echo "3. Create database and user if needed:"
    echo "   sudo -u postgres psql"
    echo "   CREATE DATABASE $DB_NAME;"
    echo "   CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
    echo "   GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
    echo ""
    exit 1
fi
echo ""

# Check if database exists
echo "🔍 Checking if database exists..."
if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    echo "✅ Database '$DB_NAME' exists"
else
    echo "⚠️  Database '$DB_NAME' does not exist"
    echo "Creating database..."
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
    echo "✅ Database created"
fi
echo ""

# Enable PostGIS extension
echo "🗺️  Enabling PostGIS extension..."
if run_sql "CREATE EXTENSION IF NOT EXISTS postgis;" > /dev/null 2>&1; then
    echo "✅ PostGIS extension enabled"
else
    echo "⚠️  Could not enable PostGIS extension"
    echo "You may need to install PostGIS:"
    echo "  sudo apt install postgresql-15-postgis-3  # Ubuntu/Debian"
    echo "  brew install postgis  # macOS"
fi

if run_sql "CREATE EXTENSION IF NOT EXISTS postgis_topology;" > /dev/null 2>&1; then
    echo "✅ PostGIS Topology extension enabled"
fi
echo ""

# Check if schema is already initialized
echo "🔍 Checking if schema is initialized..."
TABLE_COUNT=$(run_sql "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | sed -n 3p | tr -d ' ')

if [ "$TABLE_COUNT" -gt 0 ]; then
    echo "⚠️  Database already has $TABLE_COUNT tables"
    echo ""
    read -p "Do you want to drop all tables and reinitialize? (yes/no): " CONFIRM
    
    if [ "$CONFIRM" = "yes" ]; then
        echo "🗑️  Dropping all tables..."
        run_sql "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
        echo "✅ Tables dropped"
    else
        echo "ℹ️  Skipping schema initialization"
        exit 0
    fi
fi
echo ""

# Initialize schema
echo "📊 Initializing database schema..."
if [ -f "database/schema.sql" ]; then
    if run_sql_file "database/schema.sql" > /dev/null 2>&1; then
        echo "✅ Schema initialized successfully"
    else
        echo "❌ Error initializing schema"
        echo "Check database/schema.sql for errors"
        exit 1
    fi
else
    echo "❌ Schema file not found: database/schema.sql"
    exit 1
fi
echo ""

# Verify tables were created
echo "🔍 Verifying tables..."
TABLE_LIST=$(run_sql "\dt" | grep public | awk '{print $3}')
TABLE_COUNT=$(echo "$TABLE_LIST" | wc -l)

echo "✅ Created $TABLE_COUNT tables:"
echo "$TABLE_LIST" | sed 's/^/  - /'
echo ""

# Verify PostGIS is working
echo "🗺️  Verifying PostGIS..."
POSTGIS_VERSION=$(run_sql "SELECT PostGIS_version();" | sed -n 3p | tr -d ' ')
echo "✅ PostGIS version: $POSTGIS_VERSION"
echo ""

# Create initial data (optional)
echo "📝 Creating initial data..."

# Insert election metadata
run_sql "INSERT INTO elections (year, election_type, election_date, description) VALUES 
    (2022, 'Presidential', '2022-08-09', '2022 Kenya General Election'),
    (2017, 'Presidential', '2017-08-08', '2017 Kenya General Election'),
    (2013, 'Presidential', '2013-03-04', '2013 Kenya General Election')
ON CONFLICT DO NOTHING;" > /dev/null 2>&1

echo "✅ Initial election records created"
echo ""

# Summary
echo "📋 Database Initialization Summary"
echo "===================================="
echo ""
echo "✅ Database: $DB_NAME"
echo "✅ PostGIS: Enabled"
echo "✅ Tables: $TABLE_COUNT created"
echo "✅ Initial data: Elections metadata"
echo ""
echo "📝 Next Steps:"
echo "1. Run data download: bash scripts/download_data.sh"
echo "2. Inspect PDFs: python scripts/inspect_pdfs.py"
echo "3. Run ETL ingestion: npm run etl:iebc && npm run etl:knbs"
echo "4. Verify data: PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME"
echo ""
echo "✅ Database initialization complete!"

