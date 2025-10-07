-- Migration: Add polling stations table and voter registration fields
-- Date: 2025-10-07
-- Description: Adds polling_stations table and registered_voters_2022 to wards

-- Add registered_voters_2022 column to wards table
ALTER TABLE wards 
ADD COLUMN IF NOT EXISTS registered_voters_2022 INTEGER;

-- Create polling_stations table
CREATE TABLE IF NOT EXISTS polling_stations (
    id SERIAL PRIMARY KEY,
    ward_id INTEGER NOT NULL REFERENCES wards(id) ON DELETE CASCADE,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    registration_center_code VARCHAR(50),
    registration_center_name VARCHAR(200),
    registered_voters_2022 INTEGER DEFAULT 0,
    geometry geometry(Point, 4326),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_polling_stations_ward_id ON polling_stations(ward_id);
CREATE INDEX IF NOT EXISTS idx_polling_stations_code ON polling_stations(code);
CREATE INDEX IF NOT EXISTS idx_polling_stations_geometry ON polling_stations USING GIST(geometry);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_polling_stations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_polling_stations_updated_at
    BEFORE UPDATE ON polling_stations
    FOR EACH ROW
    EXECUTE FUNCTION update_polling_stations_updated_at();

-- Add comments for documentation
COMMENT ON TABLE polling_stations IS 'Polling stations - lowest level electoral units where voting takes place';
COMMENT ON COLUMN polling_stations.code IS 'Unique polling station code from IEBC';
COMMENT ON COLUMN polling_stations.name IS 'Polling station name (usually a school or public building)';
COMMENT ON COLUMN polling_stations.registration_center_code IS 'Registration center code (may differ from polling station)';
COMMENT ON COLUMN polling_stations.registration_center_name IS 'Registration center name';
COMMENT ON COLUMN polling_stations.registered_voters_2022 IS 'Number of registered voters at this polling station for 2022 general election';
COMMENT ON COLUMN polling_stations.geometry IS 'Geographic location (point) of the polling station';

COMMENT ON COLUMN wards.registered_voters_2022 IS 'Total registered voters in this ward for 2022 general election (aggregated from polling stations)';

