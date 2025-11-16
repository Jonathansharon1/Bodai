-- Migration: Add goal_specific_context column to users table
-- This column stores goal-specific onboarding answers as JSONB

-- Add the column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS goal_specific_context JSONB;

-- Add a comment to document the column
COMMENT ON COLUMN users.goal_specific_context IS 'Stores goal-specific onboarding answers (e.g., question1, question2) as JSONB for personalized analysis';


