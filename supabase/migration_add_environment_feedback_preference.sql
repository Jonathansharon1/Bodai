-- Migration: add environment feedback preference column to users table
BEGIN;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS include_environment_feedback BOOLEAN DEFAULT true;

COMMIT;

