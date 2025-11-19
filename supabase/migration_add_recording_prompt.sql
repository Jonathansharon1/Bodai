ALTER TABLE analyses
  ADD COLUMN IF NOT EXISTS recording_prompt_id TEXT,
  ADD COLUMN IF NOT EXISTS recording_prompt_title TEXT,
  ADD COLUMN IF NOT EXISTS recording_prompt_description TEXT,
  ADD COLUMN IF NOT EXISTS recording_prompt_target_metric TEXT,
  ADD COLUMN IF NOT EXISTS recording_action_item_id UUID;

ALTER TABLE action_items
  ADD COLUMN IF NOT EXISTS practice_prompt_title TEXT,
  ADD COLUMN IF NOT EXISTS practice_prompt_description TEXT,
  ADD COLUMN IF NOT EXISTS practice_prompt_source TEXT,
  ADD COLUMN IF NOT EXISTS practice_prompt_generated BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS practice_prompt_target_metric TEXT;

