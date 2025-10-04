# KenPoliMarket Quick Start Guide

Get the platform running locally in under 10 minutes.

## Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.11+
- **PostgreSQL** 15+ with PostGIS extension
- **Docker** and Docker Compose (recommended)
- **Git**

## Option 1: Docker Compose (Recommended)

### 1. Clone and Setup

```bash
git clone https://github.com/yourusername/kenpolimarket.git
cd kenpolimarket
cp .env.example .env
```

### 2. Edit `.env` File

Update the following variables:
```env
DATABASE_URL=postgresql://kenpolimarket:password@postgres:5432/kenpolimarket
REDIS_URL=redis://redis:6379/0
API_SECRET_KEY=your-secret-key-change-in-production
NEXTAUTH_SECRET=your-nextauth-secret-change-in-production
```

### 3. Start All Services

```bash
docker-compose up -d
```

This starts:
- PostgreSQL with PostGIS
- Redis
- Backend API (FastAPI)
- Frontend (Next.js)
- Celery workers

### 4. Initialize Database

```bash
docker-compose exec backend python -c "from database import Base, engine; Base.metadata.create_all(bind=engine)"
```

Or run the SQL schema directly:
```bash
docker-compose exec postgres psql -U kenpolimarket -d kenpolimarket -f /docker-entrypoint-initdb.d/schema.sql
```

### 5. Access the Platform

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/api/docs

---

## Option 2: Manual Setup

### 1. Install Dependencies

#### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

#### Frontend
```bash
cd frontend
npm install
```

#### ETL
```bash
cd etl
pip install -r requirements.txt
```

### 2. Setup PostgreSQL

```bash
# Create database
createdb kenpolimarket

# Enable PostGIS
psql kenpolimarket -c "CREATE EXTENSION postgis;"

# Run schema
psql kenpolimarket < database/schema.sql
```

### 3. Setup Redis

```bash
# Install Redis (Ubuntu/Debian)
sudo apt-get install redis-server

# Start Redis
redis-server
```

### 4. Start Services

#### Terminal 1: Backend API
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

#### Terminal 2: Frontend
```bash
cd frontend
npm run dev
```

#### Terminal 3: Celery Worker (optional)
```bash
cd backend
source venv/bin/activate
celery -A tasks.celery_app worker --loglevel=info
```

### 5. Access the Platform

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/api/docs

---

## Next Steps

### 1. Ingest Data

#### IEBC Election Results
```bash
cd etl
python scripts/ingest_iebc.py --year 2022 --election-type presidential
```

#### KNBS Census Data
```bash
python scripts/ingest_knbs.py --census-year 2019
```

### 2. Run Forecasting Models

```bash
cd models
python hierarchical_bayesian.py
```

### 3. Explore the API

Visit http://localhost:8000/api/docs for interactive API documentation.

**Key Endpoints:**
- `GET /api/forecasts/latest` - Latest election forecasts
- `GET /api/forecasts/ethnicity-aggregate` - Tribe-wise projections (aggregate)
- `GET /api/counties/` - List all counties
- `GET /api/elections/` - List elections

### 4. View the Dashboard

Navigate to http://localhost:3000 to see the homepage and explore features.

---

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check connection
psql -U kenpolimarket -d kenpolimarket -c "SELECT version();"
```

### Port Already in Use

```bash
# Find process using port 8000
lsof -i :8000

# Kill process
kill -9 <PID>
```

### Frontend Build Errors

```bash
cd frontend
rm -rf node_modules .next
npm install
npm run dev
```

### Python Package Issues

```bash
cd backend
pip install --upgrade pip
pip install -r requirements.txt --force-reinstall
```

---

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes

Edit code, add tests, update documentation.

### 3. Run Tests

```bash
# Backend tests
cd backend
pytest tests/ -v

# Frontend tests
cd frontend
npm test
```

### 4. Lint and Format

```bash
# Backend
cd backend
ruff check .
ruff format .

# Frontend
cd frontend
npm run lint
```

### 5. Commit and Push

```bash
git add .
git commit -m "feat: your feature description"
git push origin feature/your-feature-name
```

---

## Production Deployment

See [docs/deployment.md](deployment.md) for production deployment guide.

**Key considerations:**
- Use managed PostgreSQL (AWS RDS, GCP Cloud SQL)
- Use managed Redis (AWS ElastiCache, GCP Memorystore)
- Deploy backend on AWS ECS, GCP Cloud Run, or Kubernetes
- Deploy frontend on Vercel or Netlify
- Set up CI/CD with GitHub Actions
- Configure monitoring (Sentry, Prometheus, Grafana)

---

## Resources

- [Architecture Overview](architecture.md)
- [Data Pipeline Documentation](data-pipeline.md)
- [Modeling Approach](modeling.md)
- [API Reference](api.md)
- [Privacy & Ethics](privacy.md)

---

## Support

- **Email**: info@kenpolimarket.com
- **Issues**: https://github.com/yourusername/kenpolimarket/issues
- **Discussions**: https://github.com/yourusername/kenpolimarket/discussions

---

**Happy Forecasting! 🇰🇪📊**

