-- Check if s3_key column exists in analyses table
-- Run this in Supabase SQL Editor to verify

-- Check all columns in analyses table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'analyses'
ORDER BY ordinal_position;

-- Try to see the table structure
SELECT * FROM analyses LIMIT 1;


