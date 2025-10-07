-- ============================================================================
-- Migration 005: Add Voter Demographics (Gender & Disability Statistics)
-- ============================================================================
-- Purpose: Add detailed voter statistics including gender and disability data
-- at all administrative levels (county, constituency, ward, polling station)
-- ============================================================================

-- ============================================================================
-- 1. CREATE VOTER DEMOGRAPHICS TABLES
-- ============================================================================

-- County Level Demographics
CREATE TABLE IF NOT EXISTS county_voter_demographics (
    id SERIAL PRIMARY KEY,
    county_id INTEGER REFERENCES counties(id) ON DELETE CASCADE,
    election_year INTEGER NOT NULL,
    
    -- Total voters
    total_registered_voters INTEGER NOT NULL DEFAULT 0,
    
    -- Gender breakdown
    male_voters INTEGER DEFAULT 0,
    female_voters INTEGER DEFAULT 0,
    
    -- Disability statistics
    pwd_voters INTEGER DEFAULT 0,  -- Persons with Disabilities
    
    -- Metadata
    data_source VARCHAR(255),
    verified BOOLEAN DEFAULT FALSE,
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT unique_county_year_demo UNIQUE(county_id, election_year),
    CONSTRAINT valid_year_county CHECK (election_year >= 2013 AND election_year <= 2030),
    CONSTRAINT valid_total_county CHECK (total_registered_voters >= 0),
    CONSTRAINT valid_male_county CHECK (male_voters >= 0),
    CONSTRAINT valid_female_county CHECK (female_voters >= 0),
    CONSTRAINT valid_pwd_county CHECK (pwd_voters >= 0),
    CONSTRAINT valid_gender_sum_county CHECK (male_voters + female_voters <= total_registered_voters)
);

-- Constituency Level Demographics
CREATE TABLE IF NOT EXISTS constituency_voter_demographics (
    id SERIAL PRIMARY KEY,
    constituency_id INTEGER REFERENCES constituencies(id) ON DELETE CASCADE,
    election_year INTEGER NOT NULL,
    
    -- Total voters
    total_registered_voters INTEGER NOT NULL DEFAULT 0,
    
    -- Gender breakdown
    male_voters INTEGER DEFAULT 0,
    female_voters INTEGER DEFAULT 0,
    
    -- Disability statistics
    pwd_voters INTEGER DEFAULT 0,
    
    -- Metadata
    data_source VARCHAR(255),
    verified BOOLEAN DEFAULT FALSE,
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT unique_constituency_year_demo UNIQUE(constituency_id, election_year),
    CONSTRAINT valid_year_const CHECK (election_year >= 2013 AND election_year <= 2030),
    CONSTRAINT valid_total_const CHECK (total_registered_voters >= 0),
    CONSTRAINT valid_male_const CHECK (male_voters >= 0),
    CONSTRAINT valid_female_const CHECK (female_voters >= 0),
    CONSTRAINT valid_pwd_const CHECK (pwd_voters >= 0),
    CONSTRAINT valid_gender_sum_const CHECK (male_voters + female_voters <= total_registered_voters)
);

-- Ward Level Demographics
CREATE TABLE IF NOT EXISTS ward_voter_demographics (
    id SERIAL PRIMARY KEY,
    ward_id INTEGER REFERENCES wards(id) ON DELETE CASCADE,
    election_year INTEGER NOT NULL,
    
    -- Total voters
    total_registered_voters INTEGER NOT NULL DEFAULT 0,
    
    -- Gender breakdown
    male_voters INTEGER DEFAULT 0,
    female_voters INTEGER DEFAULT 0,
    
    -- Disability statistics
    pwd_voters INTEGER DEFAULT 0,
    
    -- Metadata
    data_source VARCHAR(255),
    verified BOOLEAN DEFAULT FALSE,
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT unique_ward_year_demo UNIQUE(ward_id, election_year),
    CONSTRAINT valid_year_ward CHECK (election_year >= 2013 AND election_year <= 2030),
    CONSTRAINT valid_total_ward CHECK (total_registered_voters >= 0),
    CONSTRAINT valid_male_ward CHECK (male_voters >= 0),
    CONSTRAINT valid_female_ward CHECK (female_voters >= 0),
    CONSTRAINT valid_pwd_ward CHECK (pwd_voters >= 0),
    CONSTRAINT valid_gender_sum_ward CHECK (male_voters + female_voters <= total_registered_voters)
);

-- Polling Station Level Demographics
CREATE TABLE IF NOT EXISTS polling_station_voter_demographics (
    id SERIAL PRIMARY KEY,
    polling_station_id INTEGER REFERENCES polling_stations(id) ON DELETE CASCADE,
    election_year INTEGER NOT NULL,
    
    -- Total voters
    total_registered_voters INTEGER NOT NULL DEFAULT 0,
    
    -- Gender breakdown
    male_voters INTEGER DEFAULT 0,
    female_voters INTEGER DEFAULT 0,
    
    -- Disability statistics
    pwd_voters INTEGER DEFAULT 0,
    
    -- Metadata
    data_source VARCHAR(255),
    verified BOOLEAN DEFAULT FALSE,
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT unique_ps_year_demo UNIQUE(polling_station_id, election_year),
    CONSTRAINT valid_year_ps CHECK (election_year >= 2013 AND election_year <= 2030),
    CONSTRAINT valid_total_ps CHECK (total_registered_voters >= 0),
    CONSTRAINT valid_male_ps CHECK (male_voters >= 0),
    CONSTRAINT valid_female_ps CHECK (female_voters >= 0),
    CONSTRAINT valid_pwd_ps CHECK (pwd_voters >= 0),
    CONSTRAINT valid_gender_sum_ps CHECK (male_voters + female_voters <= total_registered_voters)
);

-- ============================================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- County demographics indexes
CREATE INDEX IF NOT EXISTS idx_county_demo_county ON county_voter_demographics(county_id);
CREATE INDEX IF NOT EXISTS idx_county_demo_year ON county_voter_demographics(election_year);
CREATE INDEX IF NOT EXISTS idx_county_demo_county_year ON county_voter_demographics(county_id, election_year);

-- Constituency demographics indexes
CREATE INDEX IF NOT EXISTS idx_const_demo_const ON constituency_voter_demographics(constituency_id);
CREATE INDEX IF NOT EXISTS idx_const_demo_year ON constituency_voter_demographics(election_year);
CREATE INDEX IF NOT EXISTS idx_const_demo_const_year ON constituency_voter_demographics(constituency_id, election_year);

-- Ward demographics indexes
CREATE INDEX IF NOT EXISTS idx_ward_demo_ward ON ward_voter_demographics(ward_id);
CREATE INDEX IF NOT EXISTS idx_ward_demo_year ON ward_voter_demographics(election_year);
CREATE INDEX IF NOT EXISTS idx_ward_demo_ward_year ON ward_voter_demographics(ward_id, election_year);

-- Polling station demographics indexes
CREATE INDEX IF NOT EXISTS idx_ps_demo_ps ON polling_station_voter_demographics(polling_station_id);
CREATE INDEX IF NOT EXISTS idx_ps_demo_year ON polling_station_voter_demographics(election_year);
CREATE INDEX IF NOT EXISTS idx_ps_demo_ps_year ON polling_station_voter_demographics(polling_station_id, election_year);

-- ============================================================================
-- 3. CREATE HELPFUL VIEWS
-- ============================================================================

-- View: County demographics with calculated percentages
CREATE OR REPLACE VIEW county_demographics_summary AS
SELECT 
    cd.id,
    cd.county_id,
    c.name AS county_name,
    c.code AS county_code,
    cd.election_year,
    cd.total_registered_voters,
    cd.male_voters,
    cd.female_voters,
    cd.pwd_voters,
    CASE 
        WHEN cd.total_registered_voters > 0 
        THEN ROUND((cd.male_voters::DECIMAL / cd.total_registered_voters * 100), 2)
        ELSE 0 
    END AS male_percentage,
    CASE 
        WHEN cd.total_registered_voters > 0 
        THEN ROUND((cd.female_voters::DECIMAL / cd.total_registered_voters * 100), 2)
        ELSE 0 
    END AS female_percentage,
    CASE 
        WHEN cd.total_registered_voters > 0 
        THEN ROUND((cd.pwd_voters::DECIMAL / cd.total_registered_voters * 100), 2)
        ELSE 0 
    END AS pwd_percentage,
    cd.verified,
    cd.data_source
FROM county_voter_demographics cd
JOIN counties c ON cd.county_id = c.id;

-- View: Ward demographics with full hierarchy
CREATE OR REPLACE VIEW ward_demographics_full AS
SELECT 
    wd.id,
    wd.ward_id,
    w.name AS ward_name,
    w.code AS ward_code,
    const.name AS constituency_name,
    co.name AS county_name,
    wd.election_year,
    wd.total_registered_voters,
    wd.male_voters,
    wd.female_voters,
    wd.pwd_voters,
    CASE 
        WHEN wd.total_registered_voters > 0 
        THEN ROUND((wd.male_voters::DECIMAL / wd.total_registered_voters * 100), 2)
        ELSE 0 
    END AS male_percentage,
    CASE 
        WHEN wd.total_registered_voters > 0 
        THEN ROUND((wd.female_voters::DECIMAL / wd.total_registered_voters * 100), 2)
        ELSE 0 
    END AS female_percentage,
    CASE 
        WHEN wd.total_registered_voters > 0 
        THEN ROUND((wd.pwd_voters::DECIMAL / wd.total_registered_voters * 100), 2)
        ELSE 0 
    END AS pwd_percentage
FROM ward_voter_demographics wd
JOIN wards w ON wd.ward_id = w.id
JOIN constituencies const ON w.constituency_id = const.id
JOIN counties co ON const.county_id = co.id;

-- ============================================================================
-- 4. ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE county_voter_demographics IS 'Voter demographics including gender and disability statistics at county level';
COMMENT ON TABLE constituency_voter_demographics IS 'Voter demographics including gender and disability statistics at constituency level';
COMMENT ON TABLE ward_voter_demographics IS 'Voter demographics including gender and disability statistics at ward level';
COMMENT ON TABLE polling_station_voter_demographics IS 'Voter demographics including gender and disability statistics at polling station level';

COMMENT ON COLUMN county_voter_demographics.pwd_voters IS 'Number of registered voters with disabilities (Persons with Disabilities)';
COMMENT ON COLUMN constituency_voter_demographics.pwd_voters IS 'Number of registered voters with disabilities (Persons with Disabilities)';
COMMENT ON COLUMN ward_voter_demographics.pwd_voters IS 'Number of registered voters with disabilities (Persons with Disabilities)';
COMMENT ON COLUMN polling_station_voter_demographics.pwd_voters IS 'Number of registered voters with disabilities (Persons with Disabilities)';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

