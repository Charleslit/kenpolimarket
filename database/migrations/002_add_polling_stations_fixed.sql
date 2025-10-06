-- ============================================================================
-- Migration 002: Add Polling Stations and Registration Centers
-- Fixed version - adds required columns first, then creates tables and triggers
-- ============================================================================

-- Add registered_voters_2022 column to existing tables if not exists
ALTER TABLE wards 
ADD COLUMN IF NOT EXISTS registered_voters_2022 INTEGER DEFAULT 0;

ALTER TABLE constituencies 
ADD COLUMN IF NOT EXISTS registered_voters_2022 INTEGER DEFAULT 0;

ALTER TABLE counties 
ADD COLUMN IF NOT EXISTS registered_voters_2022 INTEGER DEFAULT 0;

-- ============================================================================
-- TABLES
-- ============================================================================

-- Registration Centers (e.g., schools, churches where voters register)
CREATE TABLE IF NOT EXISTS registration_centers (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) NOT NULL,
    name VARCHAR(255) NOT NULL,
    ward_id INTEGER REFERENCES wards(id) ON DELETE SET NULL,
    constituency_id INTEGER REFERENCES constituencies(id) ON DELETE SET NULL,
    county_id INTEGER REFERENCES counties(id) ON DELETE SET NULL,
    geometry GEOMETRY(Point, 4326),
    total_registered_voters INTEGER DEFAULT 0,
    total_polling_stations INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Polling Stations (individual voting stations within registration centers)
CREATE TABLE IF NOT EXISTS polling_stations (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    registration_center_id INTEGER REFERENCES registration_centers(id) ON DELETE SET NULL,
    ward_id INTEGER REFERENCES wards(id) ON DELETE SET NULL,
    constituency_id INTEGER REFERENCES constituencies(id) ON DELETE SET NULL,
    county_id INTEGER REFERENCES counties(id) ON DELETE SET NULL,
    registered_voters_2017 INTEGER,
    registered_voters_2022 INTEGER,
    geometry GEOMETRY(Point, 4326),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Polling Stations indexes
CREATE INDEX IF NOT EXISTS idx_polling_stations_county ON polling_stations(county_id);
CREATE INDEX IF NOT EXISTS idx_polling_stations_constituency ON polling_stations(constituency_id);
CREATE INDEX IF NOT EXISTS idx_polling_stations_ward ON polling_stations(ward_id);
CREATE INDEX IF NOT EXISTS idx_polling_stations_reg_center ON polling_stations(registration_center_id);
CREATE INDEX IF NOT EXISTS idx_polling_stations_code ON polling_stations(code);

-- Registration Centers indexes
CREATE INDEX IF NOT EXISTS idx_reg_centers_county ON registration_centers(county_id);
CREATE INDEX IF NOT EXISTS idx_reg_centers_constituency ON registration_centers(constituency_id);
CREATE INDEX IF NOT EXISTS idx_reg_centers_ward ON registration_centers(ward_id);
CREATE INDEX IF NOT EXISTS idx_reg_centers_code ON registration_centers(code);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE registration_centers IS 'IEBC registration centers (schools, churches, etc.)';
COMMENT ON TABLE polling_stations IS 'Individual polling stations within registration centers';
COMMENT ON COLUMN polling_stations.code IS 'Unique 15-digit IEBC polling station code';
COMMENT ON COLUMN polling_stations.registered_voters_2017 IS 'Number of registered voters in 2017';
COMMENT ON COLUMN polling_stations.registered_voters_2022 IS 'Number of registered voters in 2022';
COMMENT ON COLUMN registration_centers.total_registered_voters IS 'Auto-calculated total from polling stations';
COMMENT ON COLUMN registration_centers.total_polling_stations IS 'Auto-calculated count of polling stations';
COMMENT ON COLUMN wards.registered_voters_2022 IS 'Auto-calculated total from polling stations';
COMMENT ON COLUMN constituencies.registered_voters_2022 IS 'Auto-calculated total from wards';
COMMENT ON COLUMN counties.registered_voters_2022 IS 'Auto-calculated total from constituencies';

-- ============================================================================
-- TRIGGERS FOR AUTO-UPDATING TOTALS
-- ============================================================================

-- Function to update registration center totals
CREATE OR REPLACE FUNCTION update_reg_center_totals()
RETURNS TRIGGER AS $$
DECLARE
    v_reg_center_id INTEGER;
BEGIN
    -- Determine which registration center to update
    IF TG_OP = 'DELETE' THEN
        v_reg_center_id := OLD.registration_center_id;
    ELSE
        v_reg_center_id := NEW.registration_center_id;
    END IF;
    
    -- Skip if no registration center
    IF v_reg_center_id IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;
    
    -- Update registration center totals
    UPDATE registration_centers
    SET 
        total_polling_stations = (
            SELECT COUNT(*) 
            FROM polling_stations 
            WHERE registration_center_id = v_reg_center_id
        ),
        total_registered_voters = (
            SELECT COALESCE(SUM(registered_voters_2022), 0)
            FROM polling_stations
            WHERE registration_center_id = v_reg_center_id
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = v_reg_center_id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_reg_center_totals ON polling_stations;
CREATE TRIGGER trigger_update_reg_center_totals
    AFTER INSERT OR UPDATE OR DELETE ON polling_stations
    FOR EACH ROW
    EXECUTE FUNCTION update_reg_center_totals();

-- Function to update ward registered voters
CREATE OR REPLACE FUNCTION update_ward_registered_voters()
RETURNS TRIGGER AS $$
DECLARE
    v_ward_id INTEGER;
BEGIN
    -- Determine which ward to update
    IF TG_OP = 'DELETE' THEN
        v_ward_id := OLD.ward_id;
    ELSE
        v_ward_id := NEW.ward_id;
    END IF;
    
    -- Skip if no ward
    IF v_ward_id IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;
    
    -- Update ward total
    UPDATE wards
    SET registered_voters_2022 = (
        SELECT COALESCE(SUM(registered_voters_2022), 0)
        FROM polling_stations
        WHERE ward_id = v_ward_id
    )
    WHERE id = v_ward_id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_ward_voters ON polling_stations;
CREATE TRIGGER trigger_update_ward_voters
    AFTER INSERT OR UPDATE OR DELETE ON polling_stations
    FOR EACH ROW
    EXECUTE FUNCTION update_ward_registered_voters();

-- Function to update constituency registered voters
CREATE OR REPLACE FUNCTION update_constituency_registered_voters()
RETURNS TRIGGER AS $$
DECLARE
    v_constituency_id INTEGER;
BEGIN
    -- Determine which constituency to update
    IF TG_OP = 'DELETE' THEN
        v_constituency_id := OLD.constituency_id;
    ELSE
        v_constituency_id := NEW.constituency_id;
    END IF;
    
    -- Skip if no constituency
    IF v_constituency_id IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;
    
    -- Update constituency total
    UPDATE constituencies
    SET registered_voters_2022 = (
        SELECT COALESCE(SUM(registered_voters_2022), 0)
        FROM wards
        WHERE constituency_id = v_constituency_id
    )
    WHERE id = v_constituency_id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_constituency_voters ON wards;
CREATE TRIGGER trigger_update_constituency_voters
    AFTER INSERT OR UPDATE OR DELETE ON wards
    FOR EACH ROW
    EXECUTE FUNCTION update_constituency_registered_voters();

-- Function to update county registered voters
CREATE OR REPLACE FUNCTION update_county_registered_voters()
RETURNS TRIGGER AS $$
DECLARE
    v_county_id INTEGER;
BEGIN
    -- Determine which county to update
    IF TG_OP = 'DELETE' THEN
        v_county_id := OLD.county_id;
    ELSE
        v_county_id := NEW.county_id;
    END IF;
    
    -- Skip if no county
    IF v_county_id IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;
    
    -- Update county total
    UPDATE counties
    SET registered_voters_2022 = (
        SELECT COALESCE(SUM(registered_voters_2022), 0)
        FROM constituencies
        WHERE county_id = v_county_id
    )
    WHERE id = v_county_id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_county_voters ON constituencies;
CREATE TRIGGER trigger_update_county_voters
    AFTER INSERT OR UPDATE OR DELETE ON constituencies
    FOR EACH ROW
    EXECUTE FUNCTION update_county_registered_voters();

-- ============================================================================
-- VIEWS FOR EASY QUERYING
-- ============================================================================

-- View: Polling stations with full geographic hierarchy
CREATE OR REPLACE VIEW polling_stations_full AS
SELECT 
    ps.id,
    ps.code,
    ps.name,
    ps.registered_voters_2017,
    ps.registered_voters_2022,
    rc.id as reg_center_id,
    rc.code as reg_center_code,
    rc.name as reg_center_name,
    w.id as ward_id,
    w.code as ward_code,
    w.name as ward_name,
    c.id as constituency_id,
    c.code as constituency_code,
    c.name as constituency_name,
    co.id as county_id,
    co.code as county_code,
    co.name as county_name,
    ps.created_at,
    ps.updated_at
FROM polling_stations ps
LEFT JOIN registration_centers rc ON ps.registration_center_id = rc.id
LEFT JOIN wards w ON ps.ward_id = w.id
LEFT JOIN constituencies c ON ps.constituency_id = c.id
LEFT JOIN counties co ON ps.county_id = co.id;

-- View: Registration centers with statistics
CREATE OR REPLACE VIEW registration_centers_stats AS
SELECT 
    rc.id,
    rc.code,
    rc.name,
    rc.total_polling_stations,
    rc.total_registered_voters,
    w.name as ward_name,
    c.name as constituency_name,
    co.name as county_name,
    rc.created_at,
    rc.updated_at
FROM registration_centers rc
LEFT JOIN wards w ON rc.ward_id = w.id
LEFT JOIN constituencies c ON rc.constituency_id = c.id
LEFT JOIN counties co ON rc.county_id = co.id;

-- ============================================================================
-- DONE
-- ============================================================================

