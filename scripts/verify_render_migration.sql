-- Verification script for Render database migration
-- Run this to verify the migration was applied successfully

\echo '========================================='
\echo 'KenPoliMarket - Migration Verification'
\echo '========================================='
\echo ''

\echo 'Checking new columns in candidates table...'
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name='candidates' 
AND column_name IN ('county_id', 'constituency_id', 'ward_id') 
ORDER BY column_name;

\echo ''
\echo 'Checking indexes on candidates table...'
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename='candidates' 
AND indexname LIKE 'idx_candidates_%'
ORDER BY indexname;

\echo ''
\echo 'Checking foreign key constraints...'
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name='candidates'
AND kcu.column_name IN ('county_id', 'constituency_id', 'ward_id')
ORDER BY tc.constraint_name;

\echo ''
\echo 'Sample candidates with position-specific fields...'
SELECT 
    id,
    name,
    position,
    county_id,
    constituency_id,
    ward_id
FROM candidates
LIMIT 5;

\echo ''
\echo '========================================='
\echo 'Verification Complete!'
\echo '========================================='

