-- Migration: add delivery metrics columns to communication_metrics
BEGIN;

ALTER TABLE communication_metrics
  ADD COLUMN IF NOT EXISTS speaking_rate_wpm NUMERIC,
  ADD COLUMN IF NOT EXISTS filler_word_count INTEGER,
  ADD COLUMN IF NOT EXISTS sentiment_label TEXT,
  ADD COLUMN IF NOT EXISTS posture_flag TEXT;

COMMIT;

