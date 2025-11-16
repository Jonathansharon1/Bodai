-- Force add s3_key column (will fail if already exists, but that's okay)
-- Run this in Supabase SQL Editor

-- First, check if column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'analyses' 
        AND column_name = 's3_key'
    ) THEN
        ALTER TABLE analyses ADD COLUMN s3_key TEXT;
        RAISE NOTICE 'Column s3_key added successfully';
    ELSE
        RAISE NOTICE 'Column s3_key already exists';
    END IF;
END $$;

-- Add index
CREATE INDEX IF NOT EXISTS idx_analyses_s3_key ON analyses(s3_key) WHERE s3_key IS NOT NULL;

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'analyses' 
AND column_name = 's3_key';


