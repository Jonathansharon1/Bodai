-- Migration: add analysis + metrics versioning metadata
BEGIN;

ALTER TABLE analyses
  ADD COLUMN IF NOT EXISTS video_hash TEXT,
  ADD COLUMN IF NOT EXISTS video_duration_seconds NUMERIC,
  ADD COLUMN IF NOT EXISTS video_width INTEGER,
  ADD COLUMN IF NOT EXISTS video_height INTEGER,
  ADD COLUMN IF NOT EXISTS ai_model_version TEXT,
  ADD COLUMN IF NOT EXISTS metrics_version TEXT,
  ADD COLUMN IF NOT EXISTS raw_metrics JSONB;

CREATE UNIQUE INDEX IF NOT EXISTS idx_analyses_user_video_hash
  ON analyses(user_id, video_hash)
  WHERE video_hash IS NOT NULL;

ALTER TABLE communication_metrics
  ADD COLUMN IF NOT EXISTS model_version TEXT,
  ADD COLUMN IF NOT EXISTS processor_version TEXT;

COMMIT;

