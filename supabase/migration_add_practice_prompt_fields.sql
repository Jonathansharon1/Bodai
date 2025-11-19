-- Migration: add rich practice prompt fields to action_items
BEGIN;

ALTER TABLE action_items
  ADD COLUMN IF NOT EXISTS practice_prompt_setup TEXT,
  ADD COLUMN IF NOT EXISTS practice_prompt_notice TEXT,
  ADD COLUMN IF NOT EXISTS practice_prompt_tip TEXT,
  ADD COLUMN IF NOT EXISTS practice_prompt_target_metric TEXT,
  ADD COLUMN IF NOT EXISTS practice_prompt_difficulty TEXT,
  ADD COLUMN IF NOT EXISTS practice_prompt_time TEXT,
  ADD COLUMN IF NOT EXISTS practice_prompt_version INTEGER,
  ADD COLUMN IF NOT EXISTS practice_prompt_source TEXT,
  ADD COLUMN IF NOT EXISTS practice_prompt_generated BOOLEAN DEFAULT false;

COMMIT;
-- Migration: add rich practice prompt fields to action_items
BEGIN;

ALTER TABLE action_items
  ADD COLUMN IF NOT EXISTS practice_prompt_setup TEXT,
  ADD COLUMN IF NOT EXISTS practice_prompt_notice TEXT,
  ADD COLUMN IF NOT EXISTS practice_prompt_tip TEXT,
  ADD COLUMN IF NOT EXISTS practice_prompt_target_metric TEXT,
  ADD COLUMN IF NOT EXISTS practice_prompt_difficulty TEXT,
  ADD COLUMN IF NOT EXISTS practice_prompt_time TEXT,
  ADD COLUMN IF NOT EXISTS practice_prompt_version INTEGER,
  ADD COLUMN IF NOT EXISTS practice_prompt_source TEXT,
  ADD COLUMN IF NOT EXISTS practice_prompt_generated BOOLEAN DEFAULT false;

COMMIT;


