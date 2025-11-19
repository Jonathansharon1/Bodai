-- Migration: add user journeys for multi-focus dashboards
BEGIN;

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
CREATE INDEX IF NOT EXISTS idx_user_journeys_active ON user_journeys(user_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_user_journeys_default ON user_journeys(user_id) WHERE is_default = true;

ALTER TABLE user_journeys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage user journeys" ON user_journeys;
CREATE POLICY "Service role can manage user journeys"
  ON user_journeys FOR ALL
  USING (true)
  WITH CHECK (true);

DROP TRIGGER IF EXISTS update_user_journeys_updated_at ON user_journeys;
CREATE TRIGGER update_user_journeys_updated_at
  BEFORE UPDATE ON user_journeys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add journey references to core tables
ALTER TABLE analyses
  ADD COLUMN IF NOT EXISTS journey_id UUID REFERENCES user_journeys(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_analyses_journey ON analyses(journey_id);

ALTER TABLE communication_metrics
  ADD COLUMN IF NOT EXISTS journey_id UUID REFERENCES user_journeys(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_comm_metrics_journey ON communication_metrics(journey_id);

ALTER TABLE communication_insights
  ADD COLUMN IF NOT EXISTS journey_id UUID REFERENCES user_journeys(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_comm_insights_journey ON communication_insights(journey_id);

ALTER TABLE action_items
  ADD COLUMN IF NOT EXISTS journey_id UUID REFERENCES user_journeys(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_action_items_journey ON action_items(journey_id);

-- Backfill default journeys for existing users
WITH user_defaults AS (
  SELECT
    u.id AS user_id,
    COALESCE(NULLIF(u.primary_goal, ''), 'general') AS focus_slug,
    CASE COALESCE(NULLIF(u.primary_goal, ''), 'general')
      WHEN 'confidence' THEN 'Build Self-Confidence'
      WHEN 'interview' THEN 'Job Interview Preparation'
      WHEN 'presentation' THEN 'Improve Presentations'
      WHEN 'communication' THEN 'Better Communication'
      WHEN 'leadership' THEN 'Leadership Presence'
      WHEN 'dating' THEN 'Dating & Romantic'
      WHEN 'social' THEN 'Social Confidence'
      ELSE 'General Improvement'
    END AS focus_label,
    COALESCE(NULLIF(u.confidence_level, ''), 'medium') AS confidence_level,
    u.goal_specific_context AS goal_context
  FROM users u
)
INSERT INTO user_journeys (
  id,
  user_id,
  focus_slug,
  focus_label,
  confidence_level,
  goal_context,
  status,
  is_default,
  started_from,
  last_active_at
)
SELECT
  uuid_generate_v4(),
  ud.user_id,
  ud.focus_slug,
  ud.focus_label,
  ud.confidence_level,
  ud.goal_context,
  'active',
  true,
  'migration',
  NOW()
FROM user_defaults ud
WHERE NOT EXISTS (
  SELECT 1
  FROM user_journeys j
  WHERE j.user_id = ud.user_id
    AND j.is_default = true
);

-- Associate historic records with the default journey
UPDATE analyses a
SET journey_id = j.id
FROM user_journeys j
WHERE j.user_id = a.user_id
  AND j.is_default = true
  AND a.journey_id IS NULL;

UPDATE communication_metrics cm
SET journey_id = j.id
FROM user_journeys j
WHERE j.user_id = cm.user_id
  AND j.is_default = true
  AND cm.journey_id IS NULL;

UPDATE communication_insights ci
SET journey_id = j.id
FROM user_journeys j
WHERE j.user_id = ci.user_id
  AND j.is_default = true
  AND ci.journey_id IS NULL;

UPDATE action_items ai
SET journey_id = j.id
FROM user_journeys j
WHERE j.user_id = ai.user_id
  AND j.is_default = true
  AND ai.journey_id IS NULL;

COMMIT;



