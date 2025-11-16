-- Add S3 key column to analyses table
ALTER TABLE analyses 
ADD COLUMN IF NOT EXISTS s3_key TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_analyses_s3_key ON analyses(s3_key) WHERE s3_key IS NOT NULL;


