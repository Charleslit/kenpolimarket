-- Migration: Add position-specific fields to candidates table
-- Date: 2025-10-05
-- Description: Add county_id, constituency_id, ward_id fields to support position-specific candidates

-- Add new columns to candidates table
ALTER TABLE candidates 
ADD COLUMN county_id INTEGER REFERENCES counties(id) ON DELETE SET NULL,
ADD COLUMN constituency_id INTEGER REFERENCES constituencies(id) ON DELETE SET NULL,
ADD COLUMN ward_id INTEGER REFERENCES wards(id) ON DELETE SET NULL;

-- Add indexes for performance
CREATE INDEX idx_candidates_county ON candidates(county_id);
CREATE INDEX idx_candidates_constituency ON candidates(constituency_id);
CREATE INDEX idx_candidates_ward ON candidates(ward_id);

-- Add comments for documentation
COMMENT ON COLUMN candidates.county_id IS 'County for Governor candidates';
COMMENT ON COLUMN candidates.constituency_id IS 'Constituency for MP candidates';
COMMENT ON COLUMN candidates.ward_id IS 'Ward for MCA candidates';

-- Add check constraint to ensure position-specific fields are set correctly
-- Presidential candidates: no geographic restriction
-- Governor candidates: must have county_id
-- MP candidates: must have constituency_id (and implicitly county_id through constituency)
-- MCA candidates: must have ward_id (and implicitly constituency_id and county_id through ward)

-- Note: We'll enforce this in application logic rather than database constraints
-- to allow for flexibility during data entry and migration

