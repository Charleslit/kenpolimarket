# KenPoliMarket

**Kenya's Premier Political Forecasting & Analysis Platform**

A data-first platform that provides probabilistic forecasts for political outcomes in Kenya using official IEBC and KNBS data, advanced statistical modeling, and privacy-preserving aggregation techniques.

## 🎯 Vision

Deliver accurate, auditable, and transparent election forecasts with:
- Probabilistic predictions (not point estimates)
- County/constituency/ward-level granularity
- Demographic-aware projections (aggregate, privacy-preserving)
- Real-time signal via crowdsourced surveys
- Legal-compliant prediction mechanisms (play-money markets)

## 🏗️ Architecture

### Monorepo Structure
```
kenpolimarket/
├── frontend/          # Next.js + React + TypeScript
├── backend/           # FastAPI + Python
├── etl/              # Data ingestion & processing
├── models/           # Forecasting models & ML
├── database/         # Schema, migrations, seeds
├── plugins/          # Plugin marketplace system
├── docs/             # Documentation & specs
└── infrastructure/   # IaC, Docker, K8s configs
```

### Tech Stack

**Frontend**
- Next.js 14 (App Router)
- React 18 + TypeScript
- TailwindCSS + ShadCN UI
- D3.js + Recharts for visualizations
- TopoJSON for maps

**Backend**
- FastAPI (Python 3.11+)
- PostgreSQL 15 + PostGIS
- Redis for caching
- Celery for async tasks

**Data & ML**
- PyMC / NumPyro (Bayesian models)
- XGBoost / LightGBM (feature-based)
- Prophet (time series)
- Pandas, Polars for ETL

**Infrastructure**
- Docker + Docker Compose
- AWS/GCP (S3, RDS, ECS/Cloud Run)
- Terraform for IaC
- GitHub Actions for CI/CD

## 🔒 Legal & Privacy

**Compliance First**
- ✅ Kenya Data Protection Act 2019 compliant
- ✅ No PII processing or individual-level ethnicity inference
- ✅ Aggregate-only outputs with privacy safeguards
- ✅ Play-money markets (no real-money gambling)
- ✅ Transparent methodology & open data

## 📊 Data Sources

**Official & Authoritative**
- IEBC election results (2022, 2017, 2013)
- KNBS 2019 Census (population, demographics)
- IEBC voter registration data
- Afrobarometer surveys
- Academic polling data

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- PostgreSQL 15+
- Docker & Docker Compose

### Development Setup

```bash
# Clone repository
git clone https://github.com/yourusername/kenpolimarket.git
cd kenpolimarket

# Install dependencies
npm install                    # Root workspace
cd frontend && npm install     # Frontend
cd ../backend && pip install -r requirements.txt  # Backend

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Start development servers
docker-compose up -d postgres redis  # Start services
npm run dev                          # Start all dev servers
```

### Running ETL Pipeline

```bash
cd etl
python -m pipenv install
python scripts/ingest_iebc.py --year 2022
python scripts/ingest_knbs.py --census 2019
```

## 📈 Features

### Core Forecasting
- [x] Hierarchical Bayesian models (national → county → constituency)
- [x] Tribe-wise aggregate projections
- [x] Turnout modeling with demographic features
- [x] Uncertainty quantification (90% credible intervals)
- [x] Ensemble forecasts

### Dashboard & Visualizations
- [ ] Real-time forecast dashboard
- [ ] Interactive county/constituency maps
- [ ] Time-slider for forecast evolution
- [ ] Explainable AI (feature importance, SHAP)
- [ ] Historical accuracy tracking

### Plugin Marketplace
- [ ] Survey plugin (mobile-first, consent-driven)
- [ ] Play-money prediction market
- [ ] Reputation & leaderboard system
- [ ] Plugin sandbox & governance

### API & Data Access
- [ ] Public REST API
- [ ] CSV/JSON exports
- [ ] Researcher data access (licensed)
- [ ] Webhook notifications

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest tests/ -v --cov

# Frontend tests
cd frontend
npm test

# E2E tests
npm run test:e2e
```

## 📚 Documentation

- [Architecture Overview](docs/architecture.md)
- [Data Pipeline](docs/data-pipeline.md)
- [Modeling Approach](docs/modeling.md)
- [API Reference](docs/api.md)
- [Plugin Development](docs/plugins.md)
- [Privacy & Ethics](docs/privacy.md)

## 🛣️ Roadmap

### Phase 1: Foundation (Weeks 1-6)
- [x] Project setup & architecture
- [ ] ETL pipeline for IEBC & KNBS
- [ ] Database schema & privacy layer
- [ ] Basic API endpoints

### Phase 2: Core Forecasting (Weeks 6-10)
- [ ] Hierarchical Bayesian models
- [ ] Tribe-wise projections
- [ ] Forecast dashboard UI
- [ ] Model explainability

### Phase 3: Plugins & Markets (Weeks 10-14)
- [ ] Survey plugin
- [ ] Play-money market
- [ ] Plugin marketplace
- [ ] Reputation system

### Phase 4: Launch (Weeks 14-20)
- [ ] Security & privacy audit
- [ ] Legal review
- [ ] Beta launch
- [ ] Production deployment

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

[MIT License](LICENSE) - See LICENSE file for details

## ⚖️ Legal Notice

This platform is for informational and research purposes only. Forecasts are probabilistic and should not be used as the sole basis for decision-making. We do not operate real-money gambling or betting services.

## 📧 Contact

- Website: https://kenpolimarket.com
- Email: info@kenpolimarket.com
- Twitter: @kenpolimarket

---

**Built with ❤️ for transparent, data-driven political analysis in Kenya**

