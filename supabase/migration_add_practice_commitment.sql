-- Migration: add practice_commitment to users table
BEGIN;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS practice_commitment TEXT;

COMMIT;

