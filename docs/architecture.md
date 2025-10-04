# KenPoliMarket Architecture

## System Overview

KenPoliMarket is a full-stack political forecasting platform built with privacy, accuracy, and transparency as core principles.

```
┌─────────────────────────────────────────────────────────────┐
│                        Users                                 │
│  (Researchers, Journalists, Public, Developers)             │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│                   Frontend (Next.js)                         │
│  • Interactive dashboards                                    │
│  • County/constituency maps                                  │
│  • Real-time forecast visualization                          │
│  • Plugin marketplace UI                                     │
└────────────┬────────────────────────────────────────────────┘
             │ HTTPS/REST
             ▼
┌─────────────────────────────────────────────────────────────┐
│                  Backend API (FastAPI)                       │
│  • RESTful endpoints                                         │
│  • Authentication & authorization                            │
│  • Rate limiting & privacy middleware                        │
│  • Model serving                                             │
└────────────┬────────────────────────────────────────────────┘
             │
      ┌──────┴──────┬──────────────┬──────────────┐
      ▼             ▼              ▼              ▼
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│PostgreSQL│  │  Redis   │  │  Models  │  │  Celery  │
│+ PostGIS │  │  Cache   │  │  (PyMC)  │  │  Workers │
└──────────┘  └──────────┘  └──────────┘  └──────────┘
      ▲
      │
┌─────┴────────────────────────────────────────────────────────┐
│                    ETL Pipeline                               │
│  • IEBC data ingestion (PDF parsing)                         │
│  • KNBS census processing (privacy-preserving)               │
│  • Data validation & normalization                           │
│  • Audit logging                                             │
└──────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **UI Components**: ShadCN UI (planned)
- **Visualization**: D3.js, Recharts
- **Maps**: TopoJSON, Leaflet (planned)
- **State Management**: React Context / Zustand (planned)

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **ORM**: SQLAlchemy
- **Validation**: Pydantic
- **Authentication**: JWT (python-jose)
- **Task Queue**: Celery
- **Caching**: Redis

### Database
- **Primary**: PostgreSQL 15
- **Extensions**: PostGIS (geospatial)
- **Migrations**: Alembic

### Data & ML
- **ETL**: Pandas, Polars
- **PDF Parsing**: pdfplumber, tabula-py
- **Bayesian Models**: PyMC, NumPyro
- **Tree Models**: XGBoost, LightGBM
- **Time Series**: Prophet
- **Uncertainty**: ArviZ

### Infrastructure
- **Containerization**: Docker, Docker Compose
- **IaC**: Terraform (planned)
- **CI/CD**: GitHub Actions (planned)
- **Monitoring**: Prometheus, Grafana (planned)
- **Error Tracking**: Sentry (planned)

## Data Flow

### 1. Data Ingestion

```
IEBC PDFs → ETL Parser → Validation → PostgreSQL
KNBS PDFs → ETL Parser → Privacy Filter → PostgreSQL
Surveys → API → Aggregation → PostgreSQL
```

**Privacy Safeguards:**
- Minimum aggregate size: 10
- County-level ethnicity only
- No individual-level PII

### 2. Model Training

```
PostgreSQL → Feature Engineering → Bayesian Model → Posterior Samples
                                 ↓
                          Validation & Diagnostics
                                 ↓
                          Model Artifacts (S3)
```

### 3. Forecasting

```
Model Artifacts + New Data → Posterior Predictive → Credible Intervals
                                                   ↓
                                            PostgreSQL (forecasts)
                                                   ↓
                                              API Endpoints
                                                   ↓
                                            Frontend Visualization
```

### 4. API Access

```
User Request → Rate Limiter → Auth → Privacy Middleware → Database → Response
```

## Database Schema

### Core Tables

**Geographic Entities**
- `counties` - 47 Kenyan counties with geometries
- `constituencies` - 290 constituencies
- `wards` - Ward-level data

**Election Data**
- `elections` - Election metadata
- `candidates` - Candidate information
- `election_results_county` - County-level results
- `election_results_constituency` - Constituency-level results

**Demographics (Aggregate Only)**
- `county_ethnicity_aggregate` - County-level ethnicity distributions (min 10)
- `county_demographics` - County-level demographic features

**Forecasts**
- `forecast_runs` - Model run metadata
- `forecast_county` - County-level predictions with uncertainty
- `forecast_constituency` - Constituency-level predictions
- `forecast_ethnicity_aggregate` - Tribe-wise projections (aggregate, min 10)

**Surveys & Markets**
- `surveys` - Survey metadata
- `survey_responses_aggregate` - Aggregated responses (min 5)
- `market_questions` - Play-money market questions
- `market_outcomes` - Market-implied probabilities

**Audit**
- `data_ingestion_log` - ETL audit trail

## API Design

### RESTful Endpoints

**Forecasts**
- `GET /api/forecasts/latest` - Latest forecasts
- `GET /api/forecasts/county/{code}` - County-specific forecast
- `GET /api/forecasts/ethnicity-aggregate` - Tribe-wise aggregates
- `GET /api/forecasts/national-summary` - National-level summary
- `GET /api/forecasts/accuracy-history` - Historical accuracy

**Elections**
- `GET /api/elections/` - List elections
- `GET /api/elections/{id}` - Election details
- `GET /api/elections/{id}/results` - Official results

**Counties**
- `GET /api/counties/` - List counties
- `GET /api/counties/{code}` - County details
- `GET /api/counties/{code}/demographics` - Demographics (aggregate)

**Surveys**
- `GET /api/surveys/` - List surveys
- `POST /api/surveys/{id}/respond` - Submit response
- `GET /api/surveys/{id}/results` - Aggregated results

**Markets (Play-Money)**
- `GET /api/markets/` - List markets
- `GET /api/markets/{id}` - Market details
- `POST /api/markets/{id}/trade` - Place trade (virtual currency)

### Authentication

- **Public endpoints**: Forecasts, county data (read-only)
- **Authenticated endpoints**: Survey responses, market trades
- **Admin endpoints**: Data ingestion, model management

## Privacy Architecture

### Middleware Stack

```
Request
  ↓
Rate Limiter (60/min, 1000/hr)
  ↓
Authentication (JWT)
  ↓
Privacy Middleware
  ├─ Check minimum aggregate size
  ├─ Suppress small counts
  └─ Add privacy headers
  ↓
Business Logic
  ↓
Response
```

### Privacy Filters

1. **Minimum Aggregate Size**: All ethnicity data ≥ 10 individuals
2. **County-Level Only**: No sub-county ethnicity data
3. **No PII**: No names, IDs, or individual-level data
4. **Audit Logging**: All data access logged

## Modeling Architecture

### Hierarchical Structure

```
National Level (Hyperpriors)
  ↓
County Level (Partial Pooling)
  ↓
Constituency Level (Partial Pooling)
  ↓
Ethnicity Aggregates (County-level multipliers)
```

### Model Components

1. **Turnout Model**
   - Hierarchical Bayesian
   - Features: urban %, youth %, historical turnout
   - Ethnicity multipliers (aggregate)

2. **Vote Share Model**
   - Hierarchical Dirichlet
   - Features: demographics, historical results
   - County-level partial pooling

3. **Ensemble**
   - Bayesian model averaging
   - XGBoost for feature importance
   - Prophet for time trends

### Uncertainty Quantification

- **Credible Intervals**: 90% by default (configurable)
- **Posterior Predictive**: Full distribution, not just point estimates
- **Diagnostics**: R-hat, ESS, divergences
- **Calibration**: Cross-validation on historical elections

## Deployment Architecture

### Development

```
Local Machine
  ├─ Docker Compose
  │   ├─ PostgreSQL + PostGIS
  │   ├─ Redis
  │   ├─ Backend (hot reload)
  │   └─ Celery
  └─ Next.js Dev Server (port 3000)
```

### Production (Planned)

```
Vercel (Frontend)
  ↓ HTTPS
AWS/GCP
  ├─ ECS/Cloud Run (Backend API)
  ├─ RDS/Cloud SQL (PostgreSQL)
  ├─ ElastiCache/Memorystore (Redis)
  ├─ S3/Cloud Storage (Model artifacts, data)
  └─ CloudWatch/Stackdriver (Monitoring)
```

## Security

### Data Security
- TLS 1.3 for all connections
- Encrypted database backups
- Secrets management (AWS Secrets Manager / GCP Secret Manager)

### Application Security
- JWT authentication
- Rate limiting
- CORS configuration
- Input validation (Pydantic)
- SQL injection prevention (SQLAlchemy ORM)

### Privacy Security
- Minimum aggregate size enforcement
- Audit logging
- Data retention policies
- GDPR/DPA-aligned user rights

## Scalability

### Horizontal Scaling
- Stateless API servers (scale with load balancer)
- Celery workers (scale independently)
- Read replicas for PostgreSQL

### Caching Strategy
- Redis for API responses (TTL: 1 hour)
- CDN for static assets (Vercel Edge)
- Database query caching

### Performance Targets
- API response time: < 200ms (p95)
- Forecast generation: < 5 minutes
- Dashboard load time: < 2 seconds

## Monitoring & Observability

### Metrics
- Request rate, latency, error rate
- Database query performance
- Model inference time
- Cache hit rate

### Logging
- Structured JSON logs
- Log levels: DEBUG, INFO, WARNING, ERROR
- Centralized logging (CloudWatch / Stackdriver)

### Alerting
- API downtime
- High error rate (> 1%)
- Database connection issues
- Model inference failures

## Future Enhancements

1. **Real-time Updates**: WebSocket for live forecast updates
2. **Mobile App**: React Native app
3. **Advanced Visualizations**: 3D maps, animated time series
4. **Multi-language**: Swahili, other Kenyan languages
5. **SMS Alerts**: Forecast updates via SMS
6. **Researcher Portal**: Advanced data access for academics

---

**Last Updated**: 2025-10-03

