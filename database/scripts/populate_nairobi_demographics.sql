-- ============================================================================
-- Populate Nairobi Voter Demographics - Sample Data
-- ============================================================================
-- Purpose: Populate gender and disability statistics for Nairobi County
-- Based on realistic distributions for testing the explorer drill-down
-- ============================================================================

-- ============================================================================
-- HELPER FUNCTION: Generate realistic demographic splits
-- ============================================================================

-- This function generates realistic voter demographics based on total voters
-- Typical Kenya voter demographics:
-- - Male: ~48-52% of voters
-- - Female: ~48-52% of voters  
-- - PWD: ~2-3% of voters

CREATE OR REPLACE FUNCTION generate_voter_demographics(
    p_total_voters INTEGER,
    OUT o_male INTEGER,
    OUT o_female INTEGER,
    OUT o_pwd INTEGER
) AS $$
BEGIN
    -- Generate male voters (48-52% range)
    o_male := FLOOR(p_total_voters * (0.48 + random() * 0.04));
    
    -- Female voters is the remainder to ensure sum equals total
    o_female := p_total_voters - o_male;
    
    -- PWD voters (2-3% of total)
    o_pwd := FLOOR(p_total_voters * (0.02 + random() * 0.01));
    
    -- Ensure PWD doesn't exceed total
    IF o_pwd > p_total_voters THEN
        o_pwd := FLOOR(p_total_voters * 0.025);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 1. POPULATE NAIROBI COUNTY DEMOGRAPHICS
-- ============================================================================

DO $$
DECLARE
    v_nairobi_id INTEGER;
    v_total_voters INTEGER;
    v_male INTEGER;
    v_female INTEGER;
    v_pwd INTEGER;
BEGIN
    -- Get Nairobi county ID and total voters
    SELECT id, registered_voters_2022 
    INTO v_nairobi_id, v_total_voters
    FROM counties 
    WHERE name = 'Nairobi' OR code = '047';
    
    IF v_nairobi_id IS NOT NULL AND v_total_voters IS NOT NULL THEN
        -- Generate demographics
        SELECT * INTO v_male, v_female, v_pwd 
        FROM generate_voter_demographics(v_total_voters);
        
        -- Insert county demographics for 2022
        INSERT INTO county_voter_demographics (
            county_id, 
            election_year, 
            total_registered_voters,
            male_voters,
            female_voters,
            pwd_voters,
            data_source,
            verified
        ) VALUES (
            v_nairobi_id,
            2022,
            v_total_voters,
            v_male,
            v_female,
            v_pwd,
            'Sample data for testing',
            FALSE
        )
        ON CONFLICT (county_id, election_year) 
        DO UPDATE SET
            total_registered_voters = EXCLUDED.total_registered_voters,
            male_voters = EXCLUDED.male_voters,
            female_voters = EXCLUDED.female_voters,
            pwd_voters = EXCLUDED.pwd_voters,
            updated_at = CURRENT_TIMESTAMP;
        
        RAISE NOTICE 'Populated Nairobi County demographics: Total=%, Male=%, Female=%, PWD=%', 
            v_total_voters, v_male, v_female, v_pwd;
    ELSE
        RAISE NOTICE 'Nairobi county not found or has no voter data';
    END IF;
END $$;

-- ============================================================================
-- 2. POPULATE NAIROBI CONSTITUENCIES DEMOGRAPHICS
-- ============================================================================

DO $$
DECLARE
    v_constituency RECORD;
    v_male INTEGER;
    v_female INTEGER;
    v_pwd INTEGER;
BEGIN
    FOR v_constituency IN 
        SELECT c.id, c.name, c.registered_voters_2022
        FROM constituencies c
        JOIN counties co ON c.county_id = co.id
        WHERE co.name = 'Nairobi' OR co.code = '047'
        AND c.registered_voters_2022 IS NOT NULL
    LOOP
        -- Generate demographics for this constituency
        SELECT * INTO v_male, v_female, v_pwd 
        FROM generate_voter_demographics(v_constituency.registered_voters_2022);
        
        -- Insert constituency demographics
        INSERT INTO constituency_voter_demographics (
            constituency_id,
            election_year,
            total_registered_voters,
            male_voters,
            female_voters,
            pwd_voters,
            data_source,
            verified
        ) VALUES (
            v_constituency.id,
            2022,
            v_constituency.registered_voters_2022,
            v_male,
            v_female,
            v_pwd,
            'Sample data for testing',
            FALSE
        )
        ON CONFLICT (constituency_id, election_year)
        DO UPDATE SET
            total_registered_voters = EXCLUDED.total_registered_voters,
            male_voters = EXCLUDED.male_voters,
            female_voters = EXCLUDED.female_voters,
            pwd_voters = EXCLUDED.pwd_voters,
            updated_at = CURRENT_TIMESTAMP;
        
        RAISE NOTICE 'Populated % constituency: Total=%, Male=%, Female=%, PWD=%',
            v_constituency.name, v_constituency.registered_voters_2022, v_male, v_female, v_pwd;
    END LOOP;
END $$;

-- ============================================================================
-- 3. POPULATE NAIROBI WARDS DEMOGRAPHICS
-- ============================================================================

DO $$
DECLARE
    v_ward RECORD;
    v_male INTEGER;
    v_female INTEGER;
    v_pwd INTEGER;
    v_count INTEGER := 0;
BEGIN
    FOR v_ward IN 
        SELECT w.id, w.name, w.registered_voters_2022
        FROM wards w
        JOIN constituencies c ON w.constituency_id = c.id
        JOIN counties co ON c.county_id = co.id
        WHERE co.name = 'Nairobi' OR co.code = '047'
        AND w.registered_voters_2022 IS NOT NULL
    LOOP
        -- Generate demographics for this ward
        SELECT * INTO v_male, v_female, v_pwd 
        FROM generate_voter_demographics(v_ward.registered_voters_2022);
        
        -- Insert ward demographics
        INSERT INTO ward_voter_demographics (
            ward_id,
            election_year,
            total_registered_voters,
            male_voters,
            female_voters,
            pwd_voters,
            data_source,
            verified
        ) VALUES (
            v_ward.id,
            2022,
            v_ward.registered_voters_2022,
            v_male,
            v_female,
            v_pwd,
            'Sample data for testing',
            FALSE
        )
        ON CONFLICT (ward_id, election_year)
        DO UPDATE SET
            total_registered_voters = EXCLUDED.total_registered_voters,
            male_voters = EXCLUDED.male_voters,
            female_voters = EXCLUDED.female_voters,
            pwd_voters = EXCLUDED.pwd_voters,
            updated_at = CURRENT_TIMESTAMP;
        
        v_count := v_count + 1;
    END LOOP;
    
    RAISE NOTICE 'Populated % Nairobi wards with demographics', v_count;
END $$;

-- ============================================================================
-- 4. POPULATE NAIROBI POLLING STATIONS DEMOGRAPHICS
-- ============================================================================

DO $$
DECLARE
    v_station RECORD;
    v_male INTEGER;
    v_female INTEGER;
    v_pwd INTEGER;
    v_count INTEGER := 0;
BEGIN
    FOR v_station IN 
        SELECT ps.id, ps.name, ps.registered_voters_2022
        FROM polling_stations ps
        JOIN wards w ON ps.ward_id = w.id
        JOIN constituencies c ON w.constituency_id = c.id
        JOIN counties co ON c.county_id = co.id
        WHERE co.name = 'Nairobi' OR co.code = '047'
        AND ps.registered_voters_2022 IS NOT NULL
        AND ps.registered_voters_2022 > 0
    LOOP
        -- Generate demographics for this polling station
        SELECT * INTO v_male, v_female, v_pwd 
        FROM generate_voter_demographics(v_station.registered_voters_2022);
        
        -- Insert polling station demographics
        INSERT INTO polling_station_voter_demographics (
            polling_station_id,
            election_year,
            total_registered_voters,
            male_voters,
            female_voters,
            pwd_voters,
            data_source,
            verified
        ) VALUES (
            v_station.id,
            2022,
            v_station.registered_voters_2022,
            v_male,
            v_female,
            v_pwd,
            'Sample data for testing',
            FALSE
        )
        ON CONFLICT (polling_station_id, election_year)
        DO UPDATE SET
            total_registered_voters = EXCLUDED.total_registered_voters,
            male_voters = EXCLUDED.male_voters,
            female_voters = EXCLUDED.female_voters,
            pwd_voters = EXCLUDED.pwd_voters,
            updated_at = CURRENT_TIMESTAMP;
        
        v_count := v_count + 1;
    END LOOP;
    
    RAISE NOTICE 'Populated % Nairobi polling stations with demographics', v_count;
END $$;

-- ============================================================================
-- 5. VERIFICATION QUERIES
-- ============================================================================

-- Check county level
SELECT 
    'County' AS level,
    c.name,
    cd.total_registered_voters,
    cd.male_voters,
    cd.female_voters,
    cd.pwd_voters,
    ROUND((cd.male_voters::DECIMAL / cd.total_registered_voters * 100), 2) AS male_pct,
    ROUND((cd.female_voters::DECIMAL / cd.total_registered_voters * 100), 2) AS female_pct,
    ROUND((cd.pwd_voters::DECIMAL / cd.total_registered_voters * 100), 2) AS pwd_pct
FROM county_voter_demographics cd
JOIN counties c ON cd.county_id = c.id
WHERE c.name = 'Nairobi' AND cd.election_year = 2022;

-- Check constituency level summary
SELECT 
    'Constituencies' AS level,
    COUNT(*) AS count,
    SUM(total_registered_voters) AS total_voters,
    SUM(male_voters) AS total_male,
    SUM(female_voters) AS total_female,
    SUM(pwd_voters) AS total_pwd
FROM constituency_voter_demographics cd
JOIN constituencies c ON cd.constituency_id = c.id
JOIN counties co ON c.county_id = co.id
WHERE co.name = 'Nairobi' AND cd.election_year = 2022;

-- Check ward level summary
SELECT 
    'Wards' AS level,
    COUNT(*) AS count,
    SUM(total_registered_voters) AS total_voters,
    SUM(male_voters) AS total_male,
    SUM(female_voters) AS total_female,
    SUM(pwd_voters) AS total_pwd
FROM ward_voter_demographics wd
JOIN wards w ON wd.ward_id = w.id
JOIN constituencies c ON w.constituency_id = c.id
JOIN counties co ON c.county_id = co.id
WHERE co.name = 'Nairobi' AND wd.election_year = 2022;

-- ============================================================================
-- CLEANUP
-- ============================================================================

-- Drop the helper function (optional - comment out if you want to keep it)
-- DROP FUNCTION IF EXISTS generate_voter_demographics(INTEGER);

-- ============================================================================
-- SCRIPT COMPLETE
-- ============================================================================

