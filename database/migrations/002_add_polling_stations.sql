-- Migration: Add Polling Stations and Registration Centers
-- Date: 2025-10-06
-- Description: Add tables for IEBC registration centers and polling stations with voter registration data

-- ============================================================================
-- REGISTRATION CENTERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS registration_centers (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) NOT NULL,
    name VARCHAR(200) NOT NULL,
    ward_id INTEGER REFERENCES wards(id) ON DELETE CASCADE,
    constituency_id INTEGER REFERENCES constituencies(id) ON DELETE CASCADE,
    county_id INTEGER REFERENCES counties(id) ON DELETE CASCADE,
    geometry GEOMETRY(Point, 4326),  -- GPS coordinates if available
    total_registered_voters INTEGER DEFAULT 0,  -- Sum of all polling stations
    total_polling_stations INTEGER DEFAULT 0,  -- Count of polling stations
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ward_id, code)
);

-- ============================================================================
-- POLLING STATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS polling_stations (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,  -- 15-digit IEBC code
    name VARCHAR(200) NOT NULL,
    registration_center_id INTEGER REFERENCES registration_centers(id) ON DELETE CASCADE,
    ward_id INTEGER REFERENCES wards(id) ON DELETE CASCADE,
    constituency_id INTEGER REFERENCES constituencies(id) ON DELETE CASCADE,
    county_id INTEGER REFERENCES counties(id) ON DELETE CASCADE,
    registered_voters_2017 INTEGER,  -- For historical comparison
    registered_voters_2022 INTEGER,  -- Current registration
    geometry GEOMETRY(Point, 4326),  -- GPS coordinates if available
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Registration Centers Indexes
CREATE INDEX IF NOT EXISTS idx_registration_centers_ward 
    ON registration_centers(ward_id);
CREATE INDEX IF NOT EXISTS idx_registration_centers_constituency 
    ON registration_centers(constituency_id);
CREATE INDEX IF NOT EXISTS idx_registration_centers_county 
    ON registration_centers(county_id);
CREATE INDEX IF NOT EXISTS idx_registration_centers_code 
    ON registration_centers(code);

-- Polling Stations Indexes
CREATE INDEX IF NOT EXISTS idx_polling_stations_reg_center 
    ON polling_stations(registration_center_id);
CREATE INDEX IF NOT EXISTS idx_polling_stations_ward 
    ON polling_stations(ward_id);
CREATE INDEX IF NOT EXISTS idx_polling_stations_constituency 
    ON polling_stations(constituency_id);
CREATE INDEX IF NOT EXISTS idx_polling_stations_county 
    ON polling_stations(county_id);
CREATE INDEX IF NOT EXISTS idx_polling_stations_code 
    ON polling_stations(code);

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE registration_centers IS 
    'IEBC registration centers (typically schools, churches, community centers)';
COMMENT ON TABLE polling_stations IS 
    'Individual polling stations within registration centers';

COMMENT ON COLUMN registration_centers.code IS 
    'Registration center code within the ward';
COMMENT ON COLUMN registration_centers.total_registered_voters IS 
    'Total registered voters across all polling stations in this center';
COMMENT ON COLUMN registration_centers.total_polling_stations IS 
    'Number of polling stations in this registration center';

COMMENT ON COLUMN polling_stations.code IS 
    'IEBC 15-digit polling station code (hierarchical: county-const-ward-center-station)';
COMMENT ON COLUMN polling_stations.registered_voters_2017 IS 
    'Number of registered voters for 2017 general election';
COMMENT ON COLUMN polling_stations.registered_voters_2022 IS 
    'Number of registered voters for 2022 general election';

-- ============================================================================
-- TRIGGERS FOR AUTO-UPDATE
-- ============================================================================

-- Function to update registration center totals
CREATE OR REPLACE FUNCTION update_registration_center_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the registration center's total voters and station count
    UPDATE registration_centers
    SET 
        total_registered_voters = (
            SELECT COALESCE(SUM(registered_voters_2022), 0)
            FROM polling_stations
            WHERE registration_center_id = COALESCE(NEW.registration_center_id, OLD.registration_center_id)
        ),
        total_polling_stations = (
            SELECT COUNT(*)
            FROM polling_stations
            WHERE registration_center_id = COALESCE(NEW.registration_center_id, OLD.registration_center_id)
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = COALESCE(NEW.registration_center_id, OLD.registration_center_id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update registration center totals when polling stations change
DROP TRIGGER IF EXISTS trigger_update_reg_center_totals ON polling_stations;
CREATE TRIGGER trigger_update_reg_center_totals
    AFTER INSERT OR UPDATE OR DELETE ON polling_stations
    FOR EACH ROW
    EXECUTE FUNCTION update_registration_center_totals();

-- Function to update ward registered voters
CREATE OR REPLACE FUNCTION update_ward_registered_voters()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the ward's total registered voters from polling stations
    UPDATE wards
    SET registered_voters_2022 = (
        SELECT COALESCE(SUM(registered_voters_2022), 0)
        FROM polling_stations
        WHERE ward_id = COALESCE(NEW.ward_id, OLD.ward_id)
    )
    WHERE id = COALESCE(NEW.ward_id, OLD.ward_id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update ward totals when polling stations change
DROP TRIGGER IF EXISTS trigger_update_ward_voters ON polling_stations;
CREATE TRIGGER trigger_update_ward_voters
    AFTER INSERT OR UPDATE OR DELETE ON polling_stations
    FOR EACH ROW
    EXECUTE FUNCTION update_ward_registered_voters();

-- Function to update constituency registered voters
CREATE OR REPLACE FUNCTION update_constituency_registered_voters()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the constituency's total registered voters from wards
    UPDATE constituencies
    SET registered_voters_2022 = (
        SELECT COALESCE(SUM(registered_voters_2022), 0)
        FROM wards
        WHERE constituency_id = COALESCE(NEW.constituency_id, OLD.constituency_id)
    )
    WHERE id = COALESCE(NEW.constituency_id, OLD.constituency_id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update constituency totals when wards change
DROP TRIGGER IF EXISTS trigger_update_constituency_voters ON wards;
CREATE TRIGGER trigger_update_constituency_voters
    AFTER INSERT OR UPDATE ON wards
    FOR EACH ROW
    EXECUTE FUNCTION update_constituency_registered_voters();

-- Function to update county registered voters
CREATE OR REPLACE FUNCTION update_county_registered_voters()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the county's total registered voters from constituencies
    UPDATE counties
    SET registered_voters_2022 = (
        SELECT COALESCE(SUM(registered_voters_2022), 0)
        FROM constituencies
        WHERE county_id = COALESCE(NEW.county_id, OLD.county_id)
    )
    WHERE id = COALESCE(NEW.county_id, OLD.county_id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update county totals when constituencies change
DROP TRIGGER IF EXISTS trigger_update_county_voters ON constituencies;
CREATE TRIGGER trigger_update_county_voters
    AFTER INSERT OR UPDATE ON constituencies
    FOR EACH ROW
    EXECUTE FUNCTION update_county_registered_voters();

-- ============================================================================
-- VIEWS FOR EASY QUERYING
-- ============================================================================

-- View: Polling stations with full geographic hierarchy
CREATE OR REPLACE VIEW polling_stations_full AS
SELECT 
    ps.id,
    ps.code AS polling_station_code,
    ps.name AS polling_station_name,
    ps.registered_voters_2017,
    ps.registered_voters_2022,
    ps.registered_voters_2022 - COALESCE(ps.registered_voters_2017, 0) AS voter_growth,
    rc.code AS reg_center_code,
    rc.name AS reg_center_name,
    w.code AS ward_code,
    w.name AS ward_name,
    c.code AS constituency_code,
    c.name AS constituency_name,
    co.code AS county_code,
    co.name AS county_name,
    ps.geometry AS location
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
    CASE 
        WHEN rc.total_polling_stations > 0 
        THEN rc.total_registered_voters::DECIMAL / rc.total_polling_stations 
        ELSE 0 
    END AS avg_voters_per_station,
    w.name AS ward_name,
    c.name AS constituency_name,
    co.name AS county_name
FROM registration_centers rc
LEFT JOIN wards w ON rc.ward_id = w.id
LEFT JOIN constituencies c ON rc.constituency_id = c.id
LEFT JOIN counties co ON rc.county_id = co.id;

-- ============================================================================
-- GRANT PERMISSIONS (if using role-based access)
-- ============================================================================

-- Grant read access to all users (adjust as needed)
-- GRANT SELECT ON registration_centers TO public;
-- GRANT SELECT ON polling_stations TO public;
-- GRANT SELECT ON polling_stations_full TO public;
-- GRANT SELECT ON registration_centers_stats TO public;


