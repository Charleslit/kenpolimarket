#!/bin/bash

# KenPoliMarket Production Deployment Script
# This script automates the deployment process

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  KenPoliMarket Deployment Script      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker and Docker Compose are installed${NC}"
echo ""

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo -e "${YELLOW}⚠️  .env.production not found. Creating from template...${NC}"
    
    if [ -f .env.production.example ]; then
        cp .env.production.example .env.production
        echo -e "${GREEN}✅ Created .env.production from template${NC}"
        echo -e "${YELLOW}⚠️  IMPORTANT: Please edit .env.production with your configuration before continuing!${NC}"
        echo ""
        echo "Required changes:"
        echo "  1. POSTGRES_PASSWORD - Set a strong password"
        echo "  2. API_SECRET_KEY - Generate with: openssl rand -hex 32"
        echo "  3. NEXTAUTH_SECRET - Generate with: openssl rand -hex 32"
        echo "  4. NEXT_PUBLIC_API_URL - Your domain or server IP"
        echo ""
        read -p "Press Enter after you've edited .env.production..."
    else
        echo -e "${RED}❌ .env.production.example not found!${NC}"
        exit 1
    fi
fi

echo -e "${BLUE}📝 Loading environment variables...${NC}"
export $(cat .env.production | grep -v '^#' | xargs)
echo -e "${GREEN}✅ Environment variables loaded${NC}"
echo ""

# Ask for deployment mode
echo -e "${BLUE}Select deployment mode:${NC}"
echo "1) Fresh deployment (build and start)"
echo "2) Update deployment (rebuild and restart)"
echo "3) Stop all services"
echo "4) View logs"
echo "5) Backup database"
read -p "Enter choice [1-5]: " choice

case $choice in
    1)
        echo -e "${BLUE}🚀 Starting fresh deployment...${NC}"
        echo ""
        
        # Build images
        echo -e "${BLUE}📦 Building Docker images...${NC}"
        docker-compose -f docker-compose.prod.yml build
        echo -e "${GREEN}✅ Images built successfully${NC}"
        echo ""
        
        # Start services
        echo -e "${BLUE}🔄 Starting services...${NC}"
        docker-compose -f docker-compose.prod.yml up -d
        echo -e "${GREEN}✅ Services started${NC}"
        echo ""
        
        # Wait for PostgreSQL
        echo -e "${BLUE}⏳ Waiting for PostgreSQL to be ready...${NC}"
        sleep 15
        
        # Initialize database
        echo -e "${BLUE}🗄️  Initializing database...${NC}"
        docker-compose -f docker-compose.prod.yml exec -T postgres psql -U ${POSTGRES_USER:-kenpolimarket} -d ${POSTGRES_DB:-kenpolimarket} -f /docker-entrypoint-initdb.d/schema.sql || {
            echo -e "${YELLOW}⚠️  Database initialization failed. It may already be initialized.${NC}"
        }
        echo ""
        
        # Show status
        echo -e "${BLUE}📊 Service Status:${NC}"
        docker-compose -f docker-compose.prod.yml ps
        echo ""
        
        echo -e "${GREEN}✅ Deployment complete!${NC}"
        echo ""
        echo -e "${BLUE}Access your application:${NC}"
        echo "  Frontend: http://localhost or http://your-domain.com"
        echo "  API Docs: http://localhost/api/docs"
        echo ""
        echo -e "${YELLOW}💡 Tip: Run './deploy.sh' and select option 4 to view logs${NC}"
        ;;
        
    2)
        echo -e "${BLUE}🔄 Updating deployment...${NC}"
        echo ""
        
        # Pull latest changes
        echo -e "${BLUE}📥 Pulling latest changes...${NC}"
        git pull origin main || echo -e "${YELLOW}⚠️  Git pull failed or not a git repository${NC}"
        echo ""
        
        # Rebuild images
        echo -e "${BLUE}📦 Rebuilding Docker images...${NC}"
        docker-compose -f docker-compose.prod.yml build
        echo -e "${GREEN}✅ Images rebuilt${NC}"
        echo ""
        
        # Restart services
        echo -e "${BLUE}🔄 Restarting services...${NC}"
        docker-compose -f docker-compose.prod.yml up -d
        echo -e "${GREEN}✅ Services restarted${NC}"
        echo ""
        
        # Clean up old images
        echo -e "${BLUE}🧹 Cleaning up old images...${NC}"
        docker image prune -f
        echo -e "${GREEN}✅ Cleanup complete${NC}"
        echo ""
        
        echo -e "${GREEN}✅ Update complete!${NC}"
        ;;
        
    3)
        echo -e "${BLUE}🛑 Stopping all services...${NC}"
        docker-compose -f docker-compose.prod.yml down
        echo -e "${GREEN}✅ All services stopped${NC}"
        ;;
        
    4)
        echo -e "${BLUE}📋 Viewing logs (Ctrl+C to exit)...${NC}"
        echo ""
        docker-compose -f docker-compose.prod.yml logs -f
        ;;
        
    5)
        echo -e "${BLUE}💾 Creating database backup...${NC}"
        BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
        docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U ${POSTGRES_USER:-kenpolimarket} ${POSTGRES_DB:-kenpolimarket} > $BACKUP_FILE
        echo -e "${GREEN}✅ Backup created: $BACKUP_FILE${NC}"
        echo ""
        echo "To restore this backup later, run:"
        echo "  docker-compose -f docker-compose.prod.yml exec -T postgres psql -U ${POSTGRES_USER:-kenpolimarket} ${POSTGRES_DB:-kenpolimarket} < $BACKUP_FILE"
        ;;
        
    *)
        echo -e "${RED}❌ Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${GREEN}Deployment script completed!${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"

