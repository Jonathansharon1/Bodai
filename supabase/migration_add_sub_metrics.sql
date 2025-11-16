-- Migration: Add hierarchical sub-metrics to communication_metrics table
-- This adds all sub-scores for each major metric category

BEGIN;

-- Add sub-metrics columns to communication_metrics table
-- VOICE sub-metrics
ALTER TABLE communication_metrics 
  ADD COLUMN IF NOT EXISTS voice_volume_stability NUMERIC(4,1) CHECK (voice_volume_stability BETWEEN 0 AND 10),
  ADD COLUMN IF NOT EXISTS voice_tone_variation NUMERIC(4,1) CHECK (voice_tone_variation BETWEEN 0 AND 10),
  ADD COLUMN IF NOT EXISTS voice_pace_control NUMERIC(4,1) CHECK (voice_pace_control BETWEEN 0 AND 10),
  ADD COLUMN IF NOT EXISTS voice_articulation NUMERIC(4,1) CHECK (voice_articulation BETWEEN 0 AND 10),
  ADD COLUMN IF NOT EXISTS voice_warmth NUMERIC(4,1) CHECK (voice_warmth BETWEEN 0 AND 10);

-- PRESENCE sub-metrics
ALTER TABLE communication_metrics 
  ADD COLUMN IF NOT EXISTS presence_eye_contact NUMERIC(4,1) CHECK (presence_eye_contact BETWEEN 0 AND 10),
  ADD COLUMN IF NOT EXISTS presence_facial_relaxation NUMERIC(4,1) CHECK (presence_facial_relaxation BETWEEN 0 AND 10),
  ADD COLUMN IF NOT EXISTS presence_body_posture NUMERIC(4,1) CHECK (presence_body_posture BETWEEN 0 AND 10),
  ADD COLUMN IF NOT EXISTS presence_hand_naturalness NUMERIC(4,1) CHECK (presence_hand_naturalness BETWEEN 0 AND 10),
  ADD COLUMN IF NOT EXISTS presence_openness NUMERIC(4,1) CHECK (presence_openness BETWEEN 0 AND 10);

-- CLARITY sub-metrics
ALTER TABLE communication_metrics 
  ADD COLUMN IF NOT EXISTS clarity_structure NUMERIC(4,1) CHECK (clarity_structure BETWEEN 0 AND 10),
  ADD COLUMN IF NOT EXISTS clarity_focus NUMERIC(4,1) CHECK (clarity_focus BETWEEN 0 AND 10),
  ADD COLUMN IF NOT EXISTS clarity_example_usage NUMERIC(4,1) CHECK (clarity_example_usage BETWEEN 0 AND 10),
  ADD COLUMN IF NOT EXISTS clarity_transition_quality NUMERIC(4,1) CHECK (clarity_transition_quality BETWEEN 0 AND 10),
  ADD COLUMN IF NOT EXISTS clarity_repetition_control NUMERIC(4,1) CHECK (clarity_repetition_control BETWEEN 0 AND 10);

-- AUTHENTICITY sub-metrics
ALTER TABLE communication_metrics 
  ADD COLUMN IF NOT EXISTS authenticity_naturalness NUMERIC(4,1) CHECK (authenticity_naturalness BETWEEN 0 AND 10),
  ADD COLUMN IF NOT EXISTS authenticity_emotional_transparency NUMERIC(4,1) CHECK (authenticity_emotional_transparency BETWEEN 0 AND 10),
  ADD COLUMN IF NOT EXISTS authenticity_forced_expression_reduction NUMERIC(4,1) CHECK (authenticity_forced_expression_reduction BETWEEN 0 AND 10);

-- IMPACT sub-metrics
ALTER TABLE communication_metrics 
  ADD COLUMN IF NOT EXISTS impact_energy NUMERIC(4,1) CHECK (impact_energy BETWEEN 0 AND 10),
  ADD COLUMN IF NOT EXISTS impact_engagement NUMERIC(4,1) CHECK (impact_engagement BETWEEN 0 AND 10),
  ADD COLUMN IF NOT EXISTS impact_persuasiveness NUMERIC(4,1) CHECK (impact_persuasiveness BETWEEN 0 AND 10);

-- CONFIDENCE sub-metrics
ALTER TABLE communication_metrics 
  ADD COLUMN IF NOT EXISTS confidence_filler_word_control NUMERIC(4,1) CHECK (confidence_filler_word_control BETWEEN 0 AND 10),
  ADD COLUMN IF NOT EXISTS confidence_pause_control NUMERIC(4,1) CHECK (confidence_pause_control BETWEEN 0 AND 10),
  ADD COLUMN IF NOT EXISTS confidence_physical_tension NUMERIC(4,1) CHECK (confidence_physical_tension BETWEEN 0 AND 10),
  ADD COLUMN IF NOT EXISTS confidence_vocal_stability NUMERIC(4,1) CHECK (confidence_vocal_stability BETWEEN 0 AND 10),
  ADD COLUMN IF NOT EXISTS confidence_comfort_level NUMERIC(4,1) CHECK (confidence_comfort_level BETWEEN 0 AND 10);

-- Add sub-scores JSONB column for storing all sub-scores in structured format
ALTER TABLE communication_metrics 
  ADD COLUMN IF NOT EXISTS sub_scores JSONB;

-- Add validation metadata
ALTER TABLE communication_metrics 
  ADD COLUMN IF NOT EXISTS validation_metadata JSONB; -- stores jump detection, confidence scores, etc.

-- Add evidence/observations for each sub-metric
ALTER TABLE communication_metrics 
  ADD COLUMN IF NOT EXISTS sub_score_evidence JSONB; -- stores LLM's evidence for each sub-score

COMMIT;

