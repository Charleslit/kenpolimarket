#!/bin/bash

# KenPoliMarket Status Check Script
# Verifies that all components are properly set up

echo "🇰🇪 KenPoliMarket Status Check"
echo "==============================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Function to check command
check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✅${NC} $2"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌${NC} $2"
        ((FAILED++))
        return 1
    fi
}

# Function to check file
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅${NC} $2"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌${NC} $2"
        ((FAILED++))
        return 1
    fi
}

# Function to check directory
check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✅${NC} $2"
        ((PASSED++))
        return 0
    else
        echo -e "${YELLOW}⚠️${NC}  $2"
        ((WARNINGS++))
        return 1
    fi
}

# Function to check service
check_service() {
    if curl -s "$1" > /dev/null 2>&1; then
        echo -e "${GREEN}✅${NC} $2"
        ((PASSED++))
        return 0
    else
        echo -e "${YELLOW}⚠️${NC}  $2"
        ((WARNINGS++))
        return 1
    fi
}

# 1. Prerequisites
echo "📋 Prerequisites"
echo "────────────────"
check_command node "Node.js installed"
check_command python3 "Python 3 installed"
check_command psql "PostgreSQL client installed"
check_command pip3 "pip installed"
check_command npm "npm installed"
echo ""

# 2. Project Structure
echo "📁 Project Structure"
echo "────────────────────"
check_file ".env" ".env file exists"
check_file "package.json" "Root package.json"
check_file "docker-compose.yml" "Docker Compose config"
check_dir "backend" "Backend directory"
check_dir "frontend" "Frontend directory"
check_dir "etl" "ETL directory"
check_dir "models" "Models directory"
check_dir "database" "Database directory"
check_dir "docs" "Documentation directory"
echo ""

# 3. Dependencies
echo "📦 Dependencies"
echo "───────────────"
check_dir "node_modules" "Root node_modules"
check_dir "frontend/node_modules" "Frontend node_modules"
check_dir "backend/venv" "Backend virtual environment"
echo ""

# 4. Scripts
echo "🔧 Helper Scripts"
echo "─────────────────"
check_file "setup.sh" "Setup script"
check_file "scripts/init_database.sh" "Database init script"
check_file "scripts/download_data.sh" "Data download script"
check_file "scripts/inspect_pdfs.py" "PDF inspection script"
check_file "scripts/check_status.sh" "Status check script (this)"
echo ""

# 5. Database Files
echo "🗄️  Database"
echo "────────────"
check_file "database/schema.sql" "Database schema"

# Check if PostgreSQL is running
if pgrep -x postgres > /dev/null 2>&1; then
    echo -e "${GREEN}✅${NC} PostgreSQL process running"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️${NC}  PostgreSQL process not detected"
    ((WARNINGS++))
fi

# Check if database exists
if [ -f .env ]; then
    export $(cat .env | grep DATABASE_ | xargs)
    if PGPASSWORD=$DATABASE_PASSWORD psql -h $DATABASE_HOST -U $DATABASE_USER -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw $DATABASE_NAME; then
        echo -e "${GREEN}✅${NC} Database '$DATABASE_NAME' exists"
        ((PASSED++))
        
        # Check table count
        TABLE_COUNT=$(PGPASSWORD=$DATABASE_PASSWORD psql -h $DATABASE_HOST -U $DATABASE_USER -d $DATABASE_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')
        if [ ! -z "$TABLE_COUNT" ] && [ "$TABLE_COUNT" -gt 0 ]; then
            echo -e "${GREEN}✅${NC} Database has $TABLE_COUNT tables"
            ((PASSED++))
        else
            echo -e "${YELLOW}⚠️${NC}  Database has no tables (run: bash scripts/init_database.sh)"
            ((WARNINGS++))
        fi
    else
        echo -e "${YELLOW}⚠️${NC}  Database '$DATABASE_NAME' not found (run: bash scripts/init_database.sh)"
        ((WARNINGS++))
    fi
fi
echo ""

# 6. Services
echo "🌐 Services"
echo "───────────"
check_service "http://localhost:8000/api/health" "Backend API (http://localhost:8000)"
check_service "http://localhost:3000" "Frontend (http://localhost:3000)"

# Check Redis
if redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✅${NC} Redis running"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️${NC}  Redis not running"
    ((WARNINGS++))
fi
echo ""

# 7. Data Files
echo "📊 Data Files"
echo "─────────────"
check_dir "data" "Data directory"
check_dir "data/raw" "Raw data directory"
check_dir "data/raw/iebc" "IEBC data directory"
check_dir "data/raw/knbs" "KNBS data directory"

# Check for actual data files
IEBC_COUNT=$(find data/raw/iebc -name "*.pdf" 2>/dev/null | wc -l)
KNBS_COUNT=$(find data/raw/knbs -name "*.pdf" 2>/dev/null | wc -l)

if [ "$IEBC_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅${NC} Found $IEBC_COUNT IEBC PDF(s)"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️${NC}  No IEBC PDFs found (run: bash scripts/download_data.sh)"
    ((WARNINGS++))
fi

if [ "$KNBS_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅${NC} Found $KNBS_COUNT KNBS PDF(s)"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️${NC}  No KNBS PDFs found (run: bash scripts/download_data.sh)"
    ((WARNINGS++))
fi
echo ""

# 8. Documentation
echo "📚 Documentation"
echo "────────────────"
check_file "README.md" "README"
check_file "GETTING_STARTED.md" "Getting Started guide"
check_file "SETUP_GUIDE.md" "Setup guide"
check_file "IMPLEMENTATION_SUMMARY.md" "Implementation summary"
check_file "STATUS.md" "Status report"
check_file "docs/QUICKSTART.md" "Quick start guide"
check_file "docs/architecture.md" "Architecture docs"
check_file "docs/privacy.md" "Privacy policy"
echo ""

# Summary
echo "═══════════════════════════════════════"
echo "📊 Summary"
echo "═══════════════════════════════════════"
echo ""
echo -e "${GREEN}✅ Passed:${NC}   $PASSED"
echo -e "${YELLOW}⚠️  Warnings:${NC} $WARNINGS"
echo -e "${RED}❌ Failed:${NC}   $FAILED"
echo ""

# Overall status
TOTAL=$((PASSED + WARNINGS + FAILED))
SCORE=$((PASSED * 100 / TOTAL))

if [ $SCORE -ge 80 ]; then
    echo -e "${GREEN}🎉 Overall Status: EXCELLENT ($SCORE%)${NC}"
    echo ""
    echo "Your environment is well set up!"
    echo ""
    echo "📝 Next Steps:"
    if [ $WARNINGS -gt 0 ]; then
        echo "1. Address warnings above (optional)"
        echo "2. Start services if not running:"
        echo "   - Backend: cd backend && source venv/bin/activate && uvicorn main:app --reload"
        echo "   - Frontend: cd frontend && npm run dev"
        echo "3. Download data: bash scripts/download_data.sh"
        echo "4. Initialize database: bash scripts/init_database.sh"
        echo "5. Inspect PDFs: python scripts/inspect_pdfs.py"
        echo "6. Run ETL: npm run etl:iebc && npm run etl:knbs"
    else
        echo "1. Fit forecasting models: cd models && python hierarchical_bayesian.py"
        echo "2. Build dashboard: cd frontend/app && mkdir forecasts"
        echo "3. Add visualizations"
    fi
elif [ $SCORE -ge 60 ]; then
    echo -e "${YELLOW}⚠️  Overall Status: GOOD ($SCORE%)${NC}"
    echo ""
    echo "Most components are set up, but some work needed."
    echo ""
    echo "📝 Priority Actions:"
    echo "1. Review warnings above"
    echo "2. Run: bash scripts/init_database.sh"
    echo "3. Start services:"
    echo "   - Backend: cd backend && source venv/bin/activate && uvicorn main:app --reload"
    echo "   - Frontend: cd frontend && npm run dev"
    echo "4. Download data: bash scripts/download_data.sh"
else
    echo -e "${RED}❌ Overall Status: NEEDS WORK ($SCORE%)${NC}"
    echo ""
    echo "Several components need attention."
    echo ""
    echo "📝 Required Actions:"
    echo "1. Fix failed checks above"
    echo "2. Run: ./setup.sh"
    echo "3. Run: bash scripts/init_database.sh"
    echo "4. See GETTING_STARTED.md for detailed instructions"
fi

echo ""
echo "📚 Documentation:"
echo "  - Getting Started: GETTING_STARTED.md"
echo "  - Setup Guide: SETUP_GUIDE.md"
echo "  - Quick Start: docs/QUICKSTART.md"
echo ""

