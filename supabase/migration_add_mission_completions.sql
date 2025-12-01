-- Migration: Add mission_completions table for tracking practice mission completion
-- This enables progress tracking, gamification, and completion analytics

-- Create mission_completions table
CREATE TABLE IF NOT EXISTS mission_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  practice_mission_id UUID REFERENCES practice_missions(id) ON DELETE CASCADE,
  mission_index INTEGER NOT NULL, -- Which mission in the array (0, 1, etc.)
  parameter_key TEXT NOT NULL, -- Denormalized for easier queries
  journey_id UUID REFERENCES user_journeys(id) ON DELETE SET NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT, -- Optional user notes about completion
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure a user can only complete a specific mission once
  UNIQUE(user_id, practice_mission_id, mission_index)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_mission_completions_user_id ON mission_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_mission_completions_practice_mission_id ON mission_completions(practice_mission_id);
CREATE INDEX IF NOT EXISTS idx_mission_completions_parameter_key ON mission_completions(parameter_key);
CREATE INDEX IF NOT EXISTS idx_mission_completions_journey_id ON mission_completions(journey_id);
CREATE INDEX IF NOT EXISTS idx_mission_completions_completed_at ON mission_completions(completed_at DESC);

-- Add completion tracking columns to practice_missions table
ALTER TABLE practice_missions 
ADD COLUMN IF NOT EXISTS total_completions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_completed_at TIMESTAMP WITH TIME ZONE;

-- Create function to update completion counts
CREATE OR REPLACE FUNCTION update_mission_completion_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE practice_missions
  SET 
    total_completions = (
      SELECT COUNT(*) 
      FROM mission_completions 
      WHERE practice_mission_id = NEW.practice_mission_id
    ),
    last_completed_at = (
      SELECT MAX(completed_at) 
      FROM mission_completions 
      WHERE practice_mission_id = NEW.practice_mission_id
    )
  WHERE id = NEW.practice_mission_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update completion stats
DROP TRIGGER IF EXISTS trigger_update_mission_completion_stats ON mission_completions;
CREATE TRIGGER trigger_update_mission_completion_stats
  AFTER INSERT ON mission_completions
  FOR EACH ROW
  EXECUTE FUNCTION update_mission_completion_stats();

-- Add RLS policies
ALTER TABLE mission_completions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own completions
CREATE POLICY "Users can view their own mission completions"
  ON mission_completions
  FOR SELECT
  USING (auth.uid()::text = (SELECT clerk_user_id FROM users WHERE id = user_id));

-- Policy: Users can insert their own completions
CREATE POLICY "Users can insert their own mission completions"
  ON mission_completions
  FOR INSERT
  WITH CHECK (auth.uid()::text = (SELECT clerk_user_id FROM users WHERE id = user_id));

-- Policy: Users can update their own completions
CREATE POLICY "Users can update their own mission completions"
  ON mission_completions
  FOR UPDATE
  USING (auth.uid()::text = (SELECT clerk_user_id FROM users WHERE id = user_id));

-- Policy: Users can delete their own completions
CREATE POLICY "Users can delete their own mission completions"
  ON mission_completions
  FOR DELETE
  USING (auth.uid()::text = (SELECT clerk_user_id FROM users WHERE id = user_id));

