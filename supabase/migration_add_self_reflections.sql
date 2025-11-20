-- Migration: add self reflections table for post-analysis journaling
BEGIN;

CREATE TABLE IF NOT EXISTS self_reflections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES analyses(id) ON DELETE SET NULL,
  journey_id UUID REFERENCES user_journeys(id) ON DELETE SET NULL,
  confidence_rating INTEGER CHECK (confidence_rating BETWEEN 1 AND 5),
  mood_label TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_self_reflections_user_created_at
  ON self_reflections (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_self_reflections_analysis
  ON self_reflections (analysis_id);

COMMIT;


