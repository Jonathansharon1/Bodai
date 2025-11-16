-- Migration: Add user baselines and global stats tables
BEGIN;

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
  analyses_count INTEGER DEFAULT 0, -- number of analyses used to calculate baseline
  confidence_score NUMERIC(3,2) CHECK (confidence_score BETWEEN 0 AND 1), -- how confident we are in this baseline
  is_stable BOOLEAN DEFAULT FALSE, -- true if baseline hasn't changed significantly
  
  -- Store all baselines in JSONB for easier access
  baselines_json JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_baselines_user ON user_baselines(user_id);

-- Baseline history table (to track changes over time)
CREATE TABLE IF NOT EXISTS user_baseline_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  baseline_snapshot JSONB NOT NULL, -- full baseline at this point in time
  analyses_count INTEGER,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_baseline_history_user ON user_baseline_history(user_id, calculated_at DESC);

-- Global statistics table (for normalization)
CREATE TABLE IF NOT EXISTS global_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Sub-metric name (e.g., 'voice_volume_stability')
  sub_metric_key TEXT NOT NULL,
  
  -- Statistics
  mean_value NUMERIC(6,3),
  median_value NUMERIC(6,3),
  std_deviation NUMERIC(6,3),
  percentile_25 NUMERIC(6,3),
  percentile_50 NUMERIC(6,3),
  percentile_75 NUMERIC(6,3),
  percentile_90 NUMERIC(6,3),
  
  -- Sample size
  sample_count INTEGER DEFAULT 0,
  
  -- Calculation metadata
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  calculation_method TEXT, -- 'trimmed_mean', 'median', etc.
  
  -- Store all stats in JSONB for easier access
  stats_json JSONB,
  
  UNIQUE (sub_metric_key)
);

CREATE INDEX IF NOT EXISTS idx_global_stats_key ON global_stats(sub_metric_key);

-- Global stats history (to track changes over time)
CREATE TABLE IF NOT EXISTS global_stats_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sub_metric_key TEXT NOT NULL,
  stats_snapshot JSONB NOT NULL,
  sample_count INTEGER,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_global_stats_history_key ON global_stats_history(sub_metric_key, calculated_at DESC);

-- Enable RLS
ALTER TABLE user_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_baseline_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_stats_history ENABLE ROW LEVEL SECURITY;

-- Permissive policies (service role)
DROP POLICY IF EXISTS "Service role can manage user baselines" ON user_baselines;
CREATE POLICY "Service role can manage user baselines"
  ON user_baselines FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage baseline history" ON user_baseline_history;
CREATE POLICY "Service role can manage baseline history"
  ON user_baseline_history FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage global stats" ON global_stats;
CREATE POLICY "Service role can manage global stats"
  ON global_stats FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage global stats history" ON global_stats_history;
CREATE POLICY "Service role can manage global stats history"
  ON global_stats_history FOR ALL
  USING (true)
  WITH CHECK (true);

-- Triggers
DROP TRIGGER IF EXISTS update_user_baselines_updated_at ON user_baselines;
CREATE TRIGGER update_user_baselines_updated_at
  BEFORE UPDATE ON user_baselines
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMIT;

