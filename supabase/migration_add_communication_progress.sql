-- Migration: add personal communication progress system tables
BEGIN;

CREATE TABLE IF NOT EXISTS communication_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  presence NUMERIC(4,1) CHECK (presence BETWEEN 0 AND 10),
  voice_expression NUMERIC(4,1) CHECK (voice_expression BETWEEN 0 AND 10),
  clarity NUMERIC(4,1) CHECK (clarity BETWEEN 0 AND 10),
  authenticity NUMERIC(4,1) CHECK (authenticity BETWEEN 0 AND 10),
  impact NUMERIC(4,1) CHECK (impact BETWEEN 0 AND 10),
  confidence NUMERIC(4,1) CHECK (confidence BETWEEN 0 AND 10),
  overall_score NUMERIC(5,2) CHECK (overall_score BETWEEN 0 AND 100),
  stage_title TEXT,
  trend_snapshot JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comm_metrics_user ON communication_metrics(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comm_metrics_analysis ON communication_metrics(analysis_id);

CREATE TABLE IF NOT EXISTS communication_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES analyses(id) ON DELETE SET NULL,
  insight_type TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comm_insights_user ON communication_insights(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS communication_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  achievement_key TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES communication_achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB,
  UNIQUE (user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id, earned_at DESC);

-- Enable RLS and permissive policies (service role)
ALTER TABLE communication_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist, then create them
DROP POLICY IF EXISTS "Service role can manage communication metrics" ON communication_metrics;
CREATE POLICY "Service role can manage communication metrics"
  ON communication_metrics FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage communication insights" ON communication_insights;
CREATE POLICY "Service role can manage communication insights"
  ON communication_insights FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage communication achievements" ON communication_achievements;
CREATE POLICY "Service role can manage communication achievements"
  ON communication_achievements FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage user achievements" ON user_achievements;
CREATE POLICY "Service role can manage user achievements"
  ON user_achievements FOR ALL
  USING (true)
  WITH CHECK (true);

-- Triggers
DROP TRIGGER IF EXISTS update_comm_metrics_updated_at ON communication_metrics;
CREATE TRIGGER update_comm_metrics_updated_at
  BEFORE UPDATE ON communication_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Seed default achievements (idempotent)
INSERT INTO communication_achievements (achievement_key, title, description, icon)
VALUES
  ('eye_contact_master', 'Eye Contact Master', 'Maintain strong presence with consistent eye contact across sessions.', '👁️'),
  ('confident_speaker', 'Confident Speaker', 'Achieve a communication confidence score above 80.', '💬'),
  ('natural_flow', 'Natural Flow', 'Show a steady rise in authenticity over multiple sessions.', '🌊')
ON CONFLICT (achievement_key) DO NOTHING;

COMMIT;

