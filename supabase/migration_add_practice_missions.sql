-- Practice Missions Table
-- Stores AI-generated practice missions for user weaknesses/parameters

CREATE TABLE IF NOT EXISTS practice_missions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  journey_id UUID REFERENCES user_journeys(id) ON DELETE SET NULL,
  parameter_key TEXT NOT NULL,
  parameter_label TEXT NOT NULL,
  parameter_description TEXT,
  current_score NUMERIC NOT NULL,
  target_score NUMERIC DEFAULT 7.5,
  missions JSONB NOT NULL, -- Array of mission strings: ["mission 1", "mission 2"]
  trend_direction TEXT, -- 'improving', 'declining', 'stable'
  trend_change NUMERIC,
  user_context JSONB, -- Stores primaryGoal, confidenceLevel, etc.
  ai_model_version TEXT, -- Track which model generated these
  analysis_id UUID REFERENCES analyses(id) ON DELETE SET NULL, -- Track which analysis generated these missions
  score_at_generation NUMERIC NOT NULL, -- Store the score when missions were generated
  is_stale BOOLEAN DEFAULT false, -- Mark as stale if score changed significantly
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one set of missions per user/parameter/journey combination
  -- Regenerate by deleting old record and creating new one
  UNIQUE(user_id, journey_id, parameter_key)
);

CREATE INDEX IF NOT EXISTS idx_practice_missions_user ON practice_missions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_practice_missions_journey ON practice_missions(journey_id);
CREATE INDEX IF NOT EXISTS idx_practice_missions_parameter ON practice_missions(user_id, parameter_key);

-- Add comment
COMMENT ON TABLE practice_missions IS 'Stores AI-generated practice missions for user weaknesses. One record per user/parameter/journey. Regenerate by deleting and creating new record.';

