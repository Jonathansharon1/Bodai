-- Add S3 key column to analyses table
-- Run this in your Supabase SQL Editor

ALTER TABLE analyses 
ADD COLUMN IF NOT EXISTS s3_key TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_analyses_s3_key ON analyses(s3_key) WHERE s3_key IS NOT NULL;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'analyses' AND column_name = 's3_key';


