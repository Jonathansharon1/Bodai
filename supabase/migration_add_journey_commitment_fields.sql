-- Migration: enrich user_journeys with template + commitment metadata
BEGIN;

ALTER TABLE user_journeys
  ADD COLUMN IF NOT EXISTS template_id TEXT,
  ADD COLUMN IF NOT EXISTS difficulty_baseline TEXT,
  ADD COLUMN IF NOT EXISTS commitment_level TEXT,
  ADD COLUMN IF NOT EXISTS practice_commitment TEXT,
  ADD COLUMN IF NOT EXISTS consent_version TEXT,
  ADD COLUMN IF NOT EXISTS consent_accepted_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS consent_version TEXT,
  ADD COLUMN IF NOT EXISTS consent_accepted_at TIMESTAMP WITH TIME ZONE;

COMMIT;

