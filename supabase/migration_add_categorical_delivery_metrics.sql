-- Migration: add categorical delivery metrics columns to communication_metrics
BEGIN;

ALTER TABLE communication_metrics
  ADD COLUMN IF NOT EXISTS speaking_rate_label TEXT,
  ADD COLUMN IF NOT EXISTS filler_word_level TEXT;

COMMIT;
