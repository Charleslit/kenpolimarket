#!/bin/bash
# KenPoliMarket Setup Script
# Automated setup for development environment

set -e  # Exit on error

echo "🇰🇪 KenPoliMarket Setup Script"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "📋 Checking prerequisites..."

command -v node >/dev/null 2>&1 || { echo -e "${RED}❌ Node.js is required but not installed.${NC}" >&2; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo -e "${RED}❌ Python 3 is required but not installed.${NC}" >&2; exit 1; }
command -v docker >/dev/null 2>&1 || { echo -e "${YELLOW}⚠️  Docker not found. Manual PostgreSQL/Redis setup required.${NC}"; }

echo -e "${GREEN}✅ Prerequisites check passed${NC}"
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo -e "${GREEN}✅ .env file created. Please edit it with your configuration.${NC}"
else
    echo -e "${YELLOW}⚠️  .env file already exists. Skipping.${NC}"
fi
echo ""

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install
echo -e "${GREEN}✅ Root dependencies installed${NC}"
echo ""

# Setup frontend
echo "🎨 Setting up frontend..."
cd frontend
npm install
cd ..
echo -e "${GREEN}✅ Frontend setup complete${NC}"
echo ""

# Setup backend
echo "🔧 Setting up backend..."
cd backend
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo -e "${GREEN}✅ Python virtual environment created${NC}"
fi

source venv/bin/activate || . venv/Scripts/activate
pip install --upgrade pip
pip install -r requirements.txt
deactivate
cd ..
echo -e "${GREEN}✅ Backend setup complete${NC}"
echo ""

# Setup ETL
echo "📊 Setting up ETL pipeline..."
cd etl
pip install -r requirements.txt
cd ..
echo -e "${GREEN}✅ ETL setup complete${NC}"
echo ""

# Create data directories
echo "📁 Creating data directories..."
mkdir -p data/raw/iebc data/raw/knbs data/processed data/cache
echo -e "${GREEN}✅ Data directories created${NC}"
echo ""

# Docker setup (if available)
if command -v docker >/dev/null 2>&1; then
    echo "🐳 Starting Docker services..."
    docker-compose up -d postgres redis
    
    # Wait for PostgreSQL to be ready
    echo "⏳ Waiting for PostgreSQL to be ready..."
    sleep 5
    
    # Initialize database
    echo "🗄️  Initializing database..."
    docker-compose exec -T postgres psql -U kenpolimarket -d kenpolimarket < database/schema.sql || {
        echo -e "${YELLOW}⚠️  Database initialization failed. You may need to run it manually.${NC}"
    }
    
    echo -e "${GREEN}✅ Docker services started${NC}"
else
    echo -e "${YELLOW}⚠️  Docker not available. Please set up PostgreSQL and Redis manually.${NC}"
    echo "   See docs/QUICKSTART.md for manual setup instructions."
fi
echo ""

# Summary
echo "================================"
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Start the development servers:"
echo "   ${YELLOW}npm run dev${NC}"
echo ""
echo "3. Access the platform:"
echo "   Frontend: ${YELLOW}http://localhost:3000${NC}"
echo "   Backend API: ${YELLOW}http://localhost:8000${NC}"
echo "   API Docs: ${YELLOW}http://localhost:8000/api/docs${NC}"
echo ""
echo "4. Ingest data:"
echo "   ${YELLOW}npm run etl:iebc${NC}"
echo "   ${YELLOW}npm run etl:knbs${NC}"
echo ""
echo "For more information, see ${YELLOW}docs/QUICKSTART.md${NC}"
echo ""

