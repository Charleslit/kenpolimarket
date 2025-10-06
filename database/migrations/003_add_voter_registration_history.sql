-- Migration 003: Add Multi-Year Voter Registration History
-- Purpose: Store historical voter registration data across multiple election years
-- Date: 2025-10-06

-- ============================================================================
-- 1. CREATE VOTER REGISTRATION HISTORY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS voter_registration_history (
    id SERIAL PRIMARY KEY,
    
    -- Foreign Keys
    polling_station_id INTEGER REFERENCES polling_stations(id) ON DELETE CASCADE,
    
    -- Election Year
    election_year INTEGER NOT NULL,
    
    -- Voter Statistics
    registered_voters INTEGER NOT NULL DEFAULT 0,
    actual_turnout INTEGER,
    turnout_percentage DECIMAL(5,2),
    
    -- Metadata
    data_source VARCHAR(255),
    verified BOOLEAN DEFAULT FALSE,
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT unique_station_year UNIQUE(polling_station_id, election_year),
    CONSTRAINT valid_year CHECK (election_year >= 2013 AND election_year <= 2030),
    CONSTRAINT valid_voters CHECK (registered_voters >= 0),
    CONSTRAINT valid_turnout CHECK (actual_turnout IS NULL OR actual_turnout >= 0),
    CONSTRAINT valid_turnout_pct CHECK (turnout_percentage IS NULL OR (turnout_percentage >= 0 AND turnout_percentage <= 100))
);

-- ============================================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_vrh_polling_station 
    ON voter_registration_history(polling_station_id);

CREATE INDEX IF NOT EXISTS idx_vrh_election_year 
    ON voter_registration_history(election_year);

CREATE INDEX IF NOT EXISTS idx_vrh_station_year 
    ON voter_registration_history(polling_station_id, election_year);

CREATE INDEX IF NOT EXISTS idx_vrh_registered_voters 
    ON voter_registration_history(registered_voters);

CREATE INDEX IF NOT EXISTS idx_vrh_verified 
    ON voter_registration_history(verified);

-- ============================================================================
-- 3. CREATE AGGREGATE TABLES FOR WARD/CONSTITUENCY/COUNTY LEVEL
-- ============================================================================

CREATE TABLE IF NOT EXISTS ward_registration_history (
    id SERIAL PRIMARY KEY,
    ward_id INTEGER REFERENCES wards(id) ON DELETE CASCADE,
    election_year INTEGER NOT NULL,
    registered_voters INTEGER NOT NULL DEFAULT 0,
    actual_turnout INTEGER,
    turnout_percentage DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_ward_year UNIQUE(ward_id, election_year)
);

CREATE TABLE IF NOT EXISTS constituency_registration_history (
    id SERIAL PRIMARY KEY,
    constituency_id INTEGER REFERENCES constituencies(id) ON DELETE CASCADE,
    election_year INTEGER NOT NULL,
    registered_voters INTEGER NOT NULL DEFAULT 0,
    actual_turnout INTEGER,
    turnout_percentage DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_constituency_year UNIQUE(constituency_id, election_year)
);

CREATE TABLE IF NOT EXISTS county_registration_history (
    id SERIAL PRIMARY KEY,
    county_id INTEGER REFERENCES counties(id) ON DELETE CASCADE,
    election_year INTEGER NOT NULL,
    registered_voters INTEGER NOT NULL DEFAULT 0,
    actual_turnout INTEGER,
    turnout_percentage DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_county_year UNIQUE(county_id, election_year)
);

-- ============================================================================
-- 4. CREATE INDEXES FOR AGGREGATE TABLES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_wrh_ward ON ward_registration_history(ward_id);
CREATE INDEX IF NOT EXISTS idx_wrh_year ON ward_registration_history(election_year);

CREATE INDEX IF NOT EXISTS idx_crh_constituency ON constituency_registration_history(constituency_id);
CREATE INDEX IF NOT EXISTS idx_crh_year ON constituency_registration_history(election_year);

CREATE INDEX IF NOT EXISTS idx_corh_county ON county_registration_history(county_id);
CREATE INDEX IF NOT EXISTS idx_corh_year ON county_registration_history(election_year);

-- ============================================================================
-- 5. CREATE TRIGGER FUNCTIONS FOR AUTO-UPDATE
-- ============================================================================

-- Update ward totals when polling station history changes
CREATE OR REPLACE FUNCTION update_ward_registration_history()
RETURNS TRIGGER AS $$
DECLARE
    v_ward_id INTEGER;
    v_year INTEGER;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_ward_id := OLD.polling_station_id;
        v_year := OLD.election_year;
    ELSE
        v_ward_id := NEW.polling_station_id;
        v_year := NEW.election_year;
    END IF;
    
    -- Get ward_id from polling_station
    SELECT ward_id INTO v_ward_id 
    FROM polling_stations 
    WHERE id = v_ward_id;
    
    IF v_ward_id IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;
    
    -- Update or insert ward registration history
    INSERT INTO ward_registration_history (ward_id, election_year, registered_voters, actual_turnout)
    SELECT 
        v_ward_id,
        v_year,
        COALESCE(SUM(vrh.registered_voters), 0),
        COALESCE(SUM(vrh.actual_turnout), 0)
    FROM voter_registration_history vrh
    JOIN polling_stations ps ON vrh.polling_station_id = ps.id
    WHERE ps.ward_id = v_ward_id AND vrh.election_year = v_year
    ON CONFLICT (ward_id, election_year) 
    DO UPDATE SET 
        registered_voters = EXCLUDED.registered_voters,
        actual_turnout = EXCLUDED.actual_turnout,
        turnout_percentage = CASE 
            WHEN EXCLUDED.registered_voters > 0 
            THEN (EXCLUDED.actual_turnout::DECIMAL / EXCLUDED.registered_voters * 100)
            ELSE NULL 
        END,
        updated_at = CURRENT_TIMESTAMP;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Update constituency totals when ward history changes
CREATE OR REPLACE FUNCTION update_constituency_registration_history()
RETURNS TRIGGER AS $$
DECLARE
    v_constituency_id INTEGER;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_constituency_id := OLD.ward_id;
    ELSE
        v_constituency_id := NEW.ward_id;
    END IF;
    
    -- Get constituency_id from ward
    SELECT constituency_id INTO v_constituency_id 
    FROM wards 
    WHERE id = v_constituency_id;
    
    IF v_constituency_id IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;
    
    -- Update or insert constituency registration history
    INSERT INTO constituency_registration_history (constituency_id, election_year, registered_voters, actual_turnout)
    SELECT 
        v_constituency_id,
        NEW.election_year,
        COALESCE(SUM(wrh.registered_voters), 0),
        COALESCE(SUM(wrh.actual_turnout), 0)
    FROM ward_registration_history wrh
    JOIN wards w ON wrh.ward_id = w.id
    WHERE w.constituency_id = v_constituency_id AND wrh.election_year = NEW.election_year
    ON CONFLICT (constituency_id, election_year) 
    DO UPDATE SET 
        registered_voters = EXCLUDED.registered_voters,
        actual_turnout = EXCLUDED.actual_turnout,
        turnout_percentage = CASE 
            WHEN EXCLUDED.registered_voters > 0 
            THEN (EXCLUDED.actual_turnout::DECIMAL / EXCLUDED.registered_voters * 100)
            ELSE NULL 
        END,
        updated_at = CURRENT_TIMESTAMP;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Update county totals when constituency history changes
CREATE OR REPLACE FUNCTION update_county_registration_history()
RETURNS TRIGGER AS $$
DECLARE
    v_county_id INTEGER;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_county_id := OLD.constituency_id;
    ELSE
        v_county_id := NEW.constituency_id;
    END IF;
    
    -- Get county_id from constituency
    SELECT county_id INTO v_county_id 
    FROM constituencies 
    WHERE id = v_county_id;
    
    IF v_county_id IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;
    
    -- Update or insert county registration history
    INSERT INTO county_registration_history (county_id, election_year, registered_voters, actual_turnout)
    SELECT 
        v_county_id,
        NEW.election_year,
        COALESCE(SUM(crh.registered_voters), 0),
        COALESCE(SUM(crh.actual_turnout), 0)
    FROM constituency_registration_history crh
    JOIN constituencies c ON crh.constituency_id = c.id
    WHERE c.county_id = v_county_id AND crh.election_year = NEW.election_year
    ON CONFLICT (county_id, election_year) 
    DO UPDATE SET 
        registered_voters = EXCLUDED.registered_voters,
        actual_turnout = EXCLUDED.actual_turnout,
        turnout_percentage = CASE 
            WHEN EXCLUDED.registered_voters > 0 
            THEN (EXCLUDED.actual_turnout::DECIMAL / EXCLUDED.registered_voters * 100)
            ELSE NULL 
        END,
        updated_at = CURRENT_TIMESTAMP;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. CREATE TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS trg_update_ward_registration_history ON voter_registration_history;
CREATE TRIGGER trg_update_ward_registration_history
    AFTER INSERT OR UPDATE OR DELETE ON voter_registration_history
    FOR EACH ROW
    EXECUTE FUNCTION update_ward_registration_history();

DROP TRIGGER IF EXISTS trg_update_constituency_registration_history ON ward_registration_history;
CREATE TRIGGER trg_update_constituency_registration_history
    AFTER INSERT OR UPDATE OR DELETE ON ward_registration_history
    FOR EACH ROW
    EXECUTE FUNCTION update_constituency_registration_history();

DROP TRIGGER IF EXISTS trg_update_county_registration_history ON constituency_registration_history;
CREATE TRIGGER trg_update_county_registration_history
    AFTER INSERT OR UPDATE OR DELETE ON constituency_registration_history
    FOR EACH ROW
    EXECUTE FUNCTION update_county_registration_history();

-- ============================================================================
-- 7. MIGRATE EXISTING 2022 DATA
-- ============================================================================

-- Migrate existing polling_stations.registered_voters_2022 to history table
INSERT INTO voter_registration_history (polling_station_id, election_year, registered_voters, data_source, verified)
SELECT 
    id,
    2022,
    registered_voters_2022,
    'Migration from polling_stations table',
    TRUE
FROM polling_stations
WHERE registered_voters_2022 IS NOT NULL AND registered_voters_2022 > 0
ON CONFLICT (polling_station_id, election_year) DO NOTHING;

-- ============================================================================
-- 8. CREATE HELPFUL VIEWS
-- ============================================================================

-- View: Latest voter registration by polling station
CREATE OR REPLACE VIEW latest_voter_registration AS
SELECT DISTINCT ON (polling_station_id)
    vrh.*,
    ps.code as station_code,
    ps.name as station_name,
    w.name as ward_name,
    c.name as constituency_name,
    co.name as county_name
FROM voter_registration_history vrh
JOIN polling_stations ps ON vrh.polling_station_id = ps.id
LEFT JOIN wards w ON ps.ward_id = w.id
LEFT JOIN constituencies c ON ps.constituency_id = c.id
LEFT JOIN counties co ON ps.county_id = co.id
ORDER BY polling_station_id, election_year DESC;

-- View: Voter registration trends by county
CREATE OR REPLACE VIEW county_registration_trends AS
SELECT 
    co.id as county_id,
    co.name as county_name,
    corh.election_year,
    corh.registered_voters,
    corh.actual_turnout,
    corh.turnout_percentage,
    LAG(corh.registered_voters) OVER (PARTITION BY co.id ORDER BY corh.election_year) as previous_year_voters,
    corh.registered_voters - LAG(corh.registered_voters) OVER (PARTITION BY co.id ORDER BY corh.election_year) as voter_growth
FROM county_registration_history corh
JOIN counties co ON corh.county_id = co.id
ORDER BY co.name, corh.election_year;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Add comment
COMMENT ON TABLE voter_registration_history IS 'Historical voter registration data by polling station and election year';
COMMENT ON TABLE ward_registration_history IS 'Aggregated voter registration data by ward and election year';
COMMENT ON TABLE constituency_registration_history IS 'Aggregated voter registration data by constituency and election year';
COMMENT ON TABLE county_registration_history IS 'Aggregated voter registration data by county and election year';

