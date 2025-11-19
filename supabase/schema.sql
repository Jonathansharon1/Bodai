-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (sync with Clerk)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  email TEXT,
  subscription_type TEXT DEFAULT 'free' CHECK (subscription_type IN ('free', 'basic', 'premium', 'pro')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'expired')),
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  subscription_started_at TIMESTAMP WITH TIME ZONE,
  free_analysis_used BOOLEAN DEFAULT FALSE,
  -- Onboarding questions data
  primary_goal TEXT, -- e.g., 'confidence', 'interview', 'presentation'
  confidence_level TEXT, -- e.g., 'very-high', 'high', 'medium', 'low', 'very-low'
  onboarding_completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Journeys allow multiple personalized focuses per user
CREATE TABLE IF NOT EXISTS user_journeys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  focus_slug TEXT NOT NULL,
  focus_label TEXT,
  display_name TEXT,
  confidence_level TEXT,
  goal_context JSONB,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  is_default BOOLEAN DEFAULT false,
  started_from TEXT DEFAULT 'onboarding',
  last_active_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_journeys_user ON user_journeys(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_journeys_default ON user_journeys(user_id) WHERE is_default = true;

-- Analyses table
CREATE TABLE IF NOT EXISTS analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  journey_id UUID REFERENCES user_journeys(id) ON DELETE SET NULL,
  video_filename TEXT,
  video_size BIGINT,
  mime_type TEXT,
  user_context JSONB, -- {primaryGoal, confidenceLevel}
  analysis_result TEXT, -- Markdown result
  -- Future: denormalized references to communication metrics can be added here if needed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_journey ON analyses(journey_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_type ON users(subscription_type);
CREATE INDEX IF NOT EXISTS idx_users_clerk_user_id ON users(clerk_user_id);

-- Communication metrics captured per analysis (historical tracking)
CREATE TABLE IF NOT EXISTS communication_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  journey_id UUID REFERENCES user_journeys(id) ON DELETE SET NULL,
  
  -- Main category scores (calculated from sub-metrics)
  presence NUMERIC(4,1) CHECK (presence BETWEEN 0 AND 10),
  voice_expression NUMERIC(4,1) CHECK (voice_expression BETWEEN 0 AND 10),
  clarity NUMERIC(4,1) CHECK (clarity BETWEEN 0 AND 10),
  authenticity NUMERIC(4,1) CHECK (authenticity BETWEEN 0 AND 10),
  impact NUMERIC(4,1) CHECK (impact BETWEEN 0 AND 10),
  confidence NUMERIC(4,1) CHECK (confidence BETWEEN 0 AND 10),
  overall_score NUMERIC(5,2) CHECK (overall_score BETWEEN 0 AND 100),
  stage_title TEXT,
  
  -- VOICE sub-metrics
  voice_volume_stability NUMERIC(4,1) CHECK (voice_volume_stability BETWEEN 0 AND 10),
  voice_tone_variation NUMERIC(4,1) CHECK (voice_tone_variation BETWEEN 0 AND 10),
  voice_pace_control NUMERIC(4,1) CHECK (voice_pace_control BETWEEN 0 AND 10),
  voice_articulation NUMERIC(4,1) CHECK (voice_articulation BETWEEN 0 AND 10),
  voice_warmth NUMERIC(4,1) CHECK (voice_warmth BETWEEN 0 AND 10),
  
  -- PRESENCE sub-metrics
  presence_eye_contact NUMERIC(4,1) CHECK (presence_eye_contact BETWEEN 0 AND 10),
  presence_facial_relaxation NUMERIC(4,1) CHECK (presence_facial_relaxation BETWEEN 0 AND 10),
  presence_body_posture NUMERIC(4,1) CHECK (presence_body_posture BETWEEN 0 AND 10),
  presence_hand_naturalness NUMERIC(4,1) CHECK (presence_hand_naturalness BETWEEN 0 AND 10),
  presence_openness NUMERIC(4,1) CHECK (presence_openness BETWEEN 0 AND 10),
  
  -- CLARITY sub-metrics
  clarity_structure NUMERIC(4,1) CHECK (clarity_structure BETWEEN 0 AND 10),
  clarity_focus NUMERIC(4,1) CHECK (clarity_focus BETWEEN 0 AND 10),
  clarity_example_usage NUMERIC(4,1) CHECK (clarity_example_usage BETWEEN 0 AND 10),
  clarity_transition_quality NUMERIC(4,1) CHECK (clarity_transition_quality BETWEEN 0 AND 10),
  clarity_repetition_control NUMERIC(4,1) CHECK (clarity_repetition_control BETWEEN 0 AND 10),
  
  -- AUTHENTICITY sub-metrics
  authenticity_naturalness NUMERIC(4,1) CHECK (authenticity_naturalness BETWEEN 0 AND 10),
  authenticity_emotional_transparency NUMERIC(4,1) CHECK (authenticity_emotional_transparency BETWEEN 0 AND 10),
  authenticity_forced_expression_reduction NUMERIC(4,1) CHECK (authenticity_forced_expression_reduction BETWEEN 0 AND 10),
  
  -- IMPACT sub-metrics
  impact_energy NUMERIC(4,1) CHECK (impact_energy BETWEEN 0 AND 10),
  impact_engagement NUMERIC(4,1) CHECK (impact_engagement BETWEEN 0 AND 10),
  impact_persuasiveness NUMERIC(4,1) CHECK (impact_persuasiveness BETWEEN 0 AND 10),
  
  -- CONFIDENCE sub-metrics
  confidence_filler_word_control NUMERIC(4,1) CHECK (confidence_filler_word_control BETWEEN 0 AND 10),
  confidence_pause_control NUMERIC(4,1) CHECK (confidence_pause_control BETWEEN 0 AND 10),
  confidence_physical_tension NUMERIC(4,1) CHECK (confidence_physical_tension BETWEEN 0 AND 10),
  confidence_vocal_stability NUMERIC(4,1) CHECK (confidence_vocal_stability BETWEEN 0 AND 10),
  confidence_comfort_level NUMERIC(4,1) CHECK (confidence_comfort_level BETWEEN 0 AND 10),
  
  -- Structured data
  sub_scores JSONB, -- All sub-scores in structured format
  sub_score_evidence JSONB, -- LLM's evidence/observations for each sub-score
  validation_metadata JSONB, -- Jump detection, confidence scores, etc.
  trend_snapshot JSONB, -- Cached comparison vs previous analyses
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comm_metrics_user ON communication_metrics(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comm_metrics_analysis ON communication_metrics(analysis_id);
CREATE INDEX IF NOT EXISTS idx_comm_metrics_journey ON communication_metrics(journey_id);

-- Communication insights journal entries
CREATE TABLE IF NOT EXISTS communication_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES analyses(id) ON DELETE SET NULL,
  journey_id UUID REFERENCES user_journeys(id) ON DELETE SET NULL,
  insight_type TEXT, -- e.g., 'strength', 'focus', 'trend'
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comm_insights_user ON communication_insights(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comm_insights_journey ON communication_insights(journey_id);

-- Action items table for To-Do List
CREATE TABLE IF NOT EXISTS action_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES analyses(id) ON DELETE SET NULL,
  journey_id UUID REFERENCES user_journeys(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  details JSONB, -- Store action details (What to do, Why it matters, Example)
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  practice_prompt_title TEXT,
  practice_prompt_description TEXT,
  practice_prompt_setup TEXT,
  practice_prompt_notice TEXT,
  practice_prompt_tip TEXT,
  practice_prompt_target_metric TEXT,
  practice_prompt_difficulty TEXT,
  practice_prompt_time TEXT,
  practice_prompt_version INTEGER,
  practice_prompt_source TEXT,
  practice_prompt_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_action_items_user_id ON action_items(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_action_items_status ON action_items(user_id, status);
CREATE INDEX IF NOT EXISTS idx_action_items_title ON action_items(user_id, title);
CREATE INDEX IF NOT EXISTS idx_action_items_journey ON action_items(journey_id);

-- Gamification achievements catalog
CREATE TABLE IF NOT EXISTS communication_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  achievement_key TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User achievement unlocks
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES communication_achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB,
  UNIQUE (user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id, earned_at DESC);

-- User personal baselines table
CREATE TABLE IF NOT EXISTS user_baselines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- VOICE baselines
  voice_volume_stability_baseline NUMERIC(4,1),
  voice_tone_variation_baseline NUMERIC(4,1),
  voice_pace_control_baseline NUMERIC(4,1),
  voice_articulation_baseline NUMERIC(4,1),
  voice_warmth_baseline NUMERIC(4,1),
  
  -- PRESENCE baselines
  presence_eye_contact_baseline NUMERIC(4,1),
  presence_facial_relaxation_baseline NUMERIC(4,1),
  presence_body_posture_baseline NUMERIC(4,1),
  presence_hand_naturalness_baseline NUMERIC(4,1),
  presence_openness_baseline NUMERIC(4,1),
  
  -- CLARITY baselines
  clarity_structure_baseline NUMERIC(4,1),
  clarity_focus_baseline NUMERIC(4,1),
  clarity_example_usage_baseline NUMERIC(4,1),
  clarity_transition_quality_baseline NUMERIC(4,1),
  clarity_repetition_control_baseline NUMERIC(4,1),
  
  -- AUTHENTICITY baselines
  authenticity_naturalness_baseline NUMERIC(4,1),
  authenticity_emotional_transparency_baseline NUMERIC(4,1),
  authenticity_forced_expression_reduction_baseline NUMERIC(4,1),
  
  -- IMPACT baselines
  impact_energy_baseline NUMERIC(4,1),
  impact_engagement_baseline NUMERIC(4,1),
  impact_persuasiveness_baseline NUMERIC(4,1),
  
  -- CONFIDENCE baselines
  confidence_filler_word_control_baseline NUMERIC(4,1),
  confidence_pause_control_baseline NUMERIC(4,1),
  confidence_physical_tension_baseline NUMERIC(4,1),
  confidence_vocal_stability_baseline NUMERIC(4,1),
  confidence_comfort_level_baseline NUMERIC(4,1),
  
  -- Metadata
  baseline_calculation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  analyses_count INTEGER DEFAULT 0,
  confidence_score NUMERIC(3,2) CHECK (confidence_score BETWEEN 0 AND 1),
  is_stable BOOLEAN DEFAULT FALSE,
  baselines_json JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_baselines_user ON user_baselines(user_id);

-- Baseline history table
CREATE TABLE IF NOT EXISTS user_baseline_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  baseline_snapshot JSONB NOT NULL,
  analyses_count INTEGER,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_baseline_history_user ON user_baseline_history(user_id, calculated_at DESC);

-- Global statistics table (for normalization)
CREATE TABLE IF NOT EXISTS global_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sub_metric_key TEXT NOT NULL,
  mean_value NUMERIC(6,3),
  median_value NUMERIC(6,3),
  std_deviation NUMERIC(6,3),
  percentile_25 NUMERIC(6,3),
  percentile_50 NUMERIC(6,3),
  percentile_75 NUMERIC(6,3),
  percentile_90 NUMERIC(6,3),
  sample_count INTEGER DEFAULT 0,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  calculation_method TEXT,
  stats_json JSONB,
  UNIQUE (sub_metric_key)
);

CREATE INDEX IF NOT EXISTS idx_global_stats_key ON global_stats(sub_metric_key);

-- Global stats history
CREATE TABLE IF NOT EXISTS global_stats_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sub_metric_key TEXT NOT NULL,
  stats_snapshot JSONB NOT NULL,
  sample_count INTEGER,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_global_stats_history_key ON global_stats_history(sub_metric_key, calculated_at DESC);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_baseline_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_stats_history ENABLE ROW LEVEL SECURITY;

-- Note: Since we're using Clerk for authentication (not Supabase Auth),
-- RLS policies are managed through the backend service role key.
-- The backend validates user identity before database operations.
-- For now, we'll use permissive policies that work with service role.
-- In production, you may want to implement custom RLS using JWT claims from Clerk.

-- Permissive policies (backend handles auth via Clerk)
-- These allow the service role to manage all operations
-- Backend ensures users can only access their own data

CREATE POLICY "Service role can manage users"
  ON users FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage user journeys"
  ON user_journeys FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage analyses"
  ON analyses FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage communication metrics"
  ON communication_metrics FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage communication insights"
  ON communication_insights FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage action items"
  ON action_items FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage communication achievements"
  ON communication_achievements FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage user achievements"
  ON user_achievements FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage user baselines"
  ON user_baselines FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage baseline history"
  ON user_baseline_history FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage global stats"
  ON global_stats FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage global stats history"
  ON global_stats_history FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_journeys_updated_at
  BEFORE UPDATE ON user_journeys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analyses_updated_at
  BEFORE UPDATE ON analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comm_metrics_updated_at
  BEFORE UPDATE ON communication_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_baselines_updated_at
  BEFORE UPDATE ON user_baselines
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_action_items_updated_at
  BEFORE UPDATE ON action_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

