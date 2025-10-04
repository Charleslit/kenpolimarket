-- KenPoliMarket Database Schema
-- PostgreSQL 15 + PostGIS
-- Privacy-first design: NO individual-level PII or ethnicity data

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- GEOGRAPHIC ENTITIES
-- ============================================================================

CREATE TABLE counties (
    id SERIAL PRIMARY KEY,
    code VARCHAR(3) UNIQUE NOT NULL,  -- IEBC county code
    name VARCHAR(100) NOT NULL,
    geometry GEOMETRY(MultiPolygon, 4326),
    population_2019 INTEGER,
    registered_voters_2022 INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE constituencies (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    county_id INTEGER REFERENCES counties(id) ON DELETE CASCADE,
    geometry GEOMETRY(MultiPolygon, 4326),
    population_2019 INTEGER,
    registered_voters_2022 INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE wards (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    constituency_id INTEGER REFERENCES constituencies(id) ON DELETE CASCADE,
    geometry GEOMETRY(MultiPolygon, 4326),
    population_2019 INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- ELECTION RESULTS (OFFICIAL IEBC DATA)
-- ============================================================================

CREATE TABLE elections (
    id SERIAL PRIMARY KEY,
    year INTEGER NOT NULL,
    election_type VARCHAR(50) NOT NULL,  -- 'presidential', 'gubernatorial', 'parliamentary'
    election_date DATE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE candidates (
    id SERIAL PRIMARY KEY,
    election_id INTEGER REFERENCES elections(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    party VARCHAR(100),
    position VARCHAR(100),  -- 'president', 'governor', 'mp'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE election_results_county (
    id SERIAL PRIMARY KEY,
    election_id INTEGER REFERENCES elections(id) ON DELETE CASCADE,
    county_id INTEGER REFERENCES counties(id) ON DELETE CASCADE,
    candidate_id INTEGER REFERENCES candidates(id) ON DELETE CASCADE,
    votes INTEGER NOT NULL CHECK (votes >= 0),
    rejected_votes INTEGER DEFAULT 0,
    total_votes_cast INTEGER,
    registered_voters INTEGER,
    turnout_percentage DECIMAL(5,2),
    source_document VARCHAR(500),  -- Reference to Form 34A/B
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(election_id, county_id, candidate_id)
);

CREATE TABLE election_results_constituency (
    id SERIAL PRIMARY KEY,
    election_id INTEGER REFERENCES elections(id) ON DELETE CASCADE,
    constituency_id INTEGER REFERENCES constituencies(id) ON DELETE CASCADE,
    candidate_id INTEGER REFERENCES candidates(id) ON DELETE CASCADE,
    votes INTEGER NOT NULL CHECK (votes >= 0),
    rejected_votes INTEGER DEFAULT 0,
    total_votes_cast INTEGER,
    registered_voters INTEGER,
    turnout_percentage DECIMAL(5,2),
    source_document VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(election_id, constituency_id, candidate_id)
);

-- ============================================================================
-- DEMOGRAPHIC DATA (AGGREGATE ONLY - PRIVACY PRESERVING)
-- ============================================================================

-- Aggregate ethnicity distribution by county (from KNBS 2019 Census)
-- NO individual-level ethnicity data
CREATE TABLE county_ethnicity_aggregate (
    id SERIAL PRIMARY KEY,
    county_id INTEGER REFERENCES counties(id) ON DELETE CASCADE,
    census_year INTEGER NOT NULL,
    ethnicity_group VARCHAR(100) NOT NULL,  -- 'Kikuyu', 'Luhya', 'Kalenjin', etc.
    population_count INTEGER NOT NULL CHECK (population_count >= 10),  -- Min 10 for privacy
    percentage DECIMAL(5,2),
    source VARCHAR(200) DEFAULT 'KNBS 2019 Census',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(county_id, census_year, ethnicity_group)
);

-- Aggregate demographic features by county
CREATE TABLE county_demographics (
    id SERIAL PRIMARY KEY,
    county_id INTEGER REFERENCES counties(id) ON DELETE CASCADE,
    census_year INTEGER NOT NULL,
    total_population INTEGER,
    urban_population INTEGER,
    rural_population INTEGER,
    median_age DECIMAL(4,1),
    literacy_rate DECIMAL(5,2),
    employment_rate DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(county_id, census_year)
);

-- ============================================================================
-- FORECASTS & MODELS
-- ============================================================================

CREATE TABLE forecast_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    election_id INTEGER REFERENCES elections(id) ON DELETE CASCADE,
    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(50) NOT NULL,
    run_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    parameters JSONB,  -- Model hyperparameters
    data_cutoff_date DATE,  -- Last date of data included
    status VARCHAR(50) DEFAULT 'running',  -- 'running', 'completed', 'failed'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE forecast_county (
    id SERIAL PRIMARY KEY,
    forecast_run_id UUID REFERENCES forecast_runs(id) ON DELETE CASCADE,
    county_id INTEGER REFERENCES counties(id) ON DELETE CASCADE,
    candidate_id INTEGER REFERENCES candidates(id) ON DELETE CASCADE,
    predicted_vote_share DECIMAL(5,2),  -- Point estimate
    lower_bound_90 DECIMAL(5,2),  -- 90% credible interval lower
    upper_bound_90 DECIMAL(5,2),  -- 90% credible interval upper
    predicted_votes INTEGER,
    predicted_turnout DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(forecast_run_id, county_id, candidate_id)
);

CREATE TABLE forecast_constituency (
    id SERIAL PRIMARY KEY,
    forecast_run_id UUID REFERENCES forecast_runs(id) ON DELETE CASCADE,
    constituency_id INTEGER REFERENCES constituencies(id) ON DELETE CASCADE,
    candidate_id INTEGER REFERENCES candidates(id) ON DELETE CASCADE,
    predicted_vote_share DECIMAL(5,2),
    lower_bound_90 DECIMAL(5,2),
    upper_bound_90 DECIMAL(5,2),
    predicted_votes INTEGER,
    predicted_turnout DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(forecast_run_id, constituency_id, candidate_id)
);

-- Tribe-wise aggregate projections (PRIVACY PRESERVING)
CREATE TABLE forecast_ethnicity_aggregate (
    id SERIAL PRIMARY KEY,
    forecast_run_id UUID REFERENCES forecast_runs(id) ON DELETE CASCADE,
    county_id INTEGER REFERENCES counties(id) ON DELETE CASCADE,
    ethnicity_group VARCHAR(100) NOT NULL,
    projected_registered_voters INTEGER CHECK (projected_registered_voters >= 10),
    projected_turnout_percentage DECIMAL(5,2),
    projected_votes_cast INTEGER,
    lower_bound_90 INTEGER,
    upper_bound_90 INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(forecast_run_id, county_id, ethnicity_group)
);

-- ============================================================================
-- SURVEYS & CROWDSOURCED DATA
-- ============================================================================

CREATE TABLE surveys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active',  -- 'active', 'closed', 'draft'
    created_by INTEGER,  -- User ID (to be added)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Aggregate survey responses (NO individual responses stored)
CREATE TABLE survey_responses_aggregate (
    id SERIAL PRIMARY KEY,
    survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
    county_id INTEGER REFERENCES counties(id),
    question_id VARCHAR(100) NOT NULL,
    response_option VARCHAR(200) NOT NULL,
    response_count INTEGER NOT NULL CHECK (response_count >= 5),  -- Min 5 for privacy
    weighted_percentage DECIMAL(5,2),
    aggregation_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(survey_id, county_id, question_id, response_option)
);

-- ============================================================================
-- PLAY-MONEY PREDICTION MARKET (NO REAL MONEY)
-- ============================================================================

CREATE TABLE market_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    election_id INTEGER REFERENCES elections(id),
    question_text TEXT NOT NULL,
    resolution_criteria TEXT NOT NULL,
    resolution_date TIMESTAMP,
    status VARCHAR(50) DEFAULT 'open',  -- 'open', 'closed', 'resolved'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE market_outcomes (
    id SERIAL PRIMARY KEY,
    question_id UUID REFERENCES market_questions(id) ON DELETE CASCADE,
    outcome_text VARCHAR(200) NOT NULL,
    current_probability DECIMAL(5,4),  -- Market-implied probability
    total_shares_yes INTEGER DEFAULT 0,
    total_shares_no INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- DATA LINEAGE & AUDIT
-- ============================================================================

CREATE TABLE data_ingestion_log (
    id SERIAL PRIMARY KEY,
    source_name VARCHAR(100) NOT NULL,  -- 'IEBC', 'KNBS', 'Survey'
    source_url VARCHAR(500),
    file_hash VARCHAR(64),  -- SHA256 of source file
    ingestion_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    records_processed INTEGER,
    status VARCHAR(50),  -- 'success', 'partial', 'failed'
    error_log TEXT
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_counties_code ON counties(code);
CREATE INDEX idx_constituencies_county ON constituencies(county_id);
CREATE INDEX idx_wards_constituency ON wards(constituency_id);
CREATE INDEX idx_election_results_county_election ON election_results_county(election_id, county_id);
CREATE INDEX idx_election_results_constituency_election ON election_results_constituency(election_id, constituency_id);
CREATE INDEX idx_forecast_county_run ON forecast_county(forecast_run_id);
CREATE INDEX idx_forecast_constituency_run ON forecast_constituency(forecast_run_id);
CREATE INDEX idx_county_ethnicity_county ON county_ethnicity_aggregate(county_id);

-- Spatial indexes
CREATE INDEX idx_counties_geom ON counties USING GIST(geometry);
CREATE INDEX idx_constituencies_geom ON constituencies USING GIST(geometry);
CREATE INDEX idx_wards_geom ON wards USING GIST(geometry);

