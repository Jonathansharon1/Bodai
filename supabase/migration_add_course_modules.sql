-- Migration: Add course modules and module baselines tables
-- Supports scalable course structure for multiple courses

-- Enhance courses table with additional fields
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS modules_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS estimated_duration_weeks INTEGER;

-- Create course_modules table
CREATE TABLE IF NOT EXISTS course_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  module_number INTEGER NOT NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content_json JSONB,
  estimated_duration_hours DECIMAL(5, 2),
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(course_id, module_number),
  UNIQUE(course_id, slug)
);

-- Create module_baselines table
CREATE TABLE IF NOT EXISTS module_baselines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES analyses(id) ON DELETE SET NULL,
  warmth_score DECIMAL(5, 2),
  competence_score DECIMAL(5, 2),
  quadrant TEXT CHECK (quadrant IN ('pity', 'threat', 'contempt', 'admiration')),
  raw_analysis_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, module_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_course_modules_course_id ON course_modules(course_id);
CREATE INDEX IF NOT EXISTS idx_course_modules_slug ON course_modules(slug);
CREATE INDEX IF NOT EXISTS idx_module_baselines_user_id ON module_baselines(user_id);
CREATE INDEX IF NOT EXISTS idx_module_baselines_module_id ON module_baselines(module_id);

-- Enable RLS
ALTER TABLE course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_baselines ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Service role can manage course_modules"
  ON course_modules FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view active course_modules"
  ON course_modules FOR SELECT
  USING (is_active = true);

CREATE POLICY "Service role can manage module_baselines"
  ON module_baselines FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view their own module_baselines"
  ON module_baselines FOR SELECT
  USING (auth.uid()::text = (SELECT clerk_user_id FROM users WHERE id = module_baselines.user_id));

-- Insert First Impression Mastery course (if not exists)
INSERT INTO courses (id, title, description, slug, modules_count, estimated_duration_weeks, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'First Impression Mastery: The Science of Social Signal',
  'Master the neuroscience and psychology behind first impressions. Learn to project warmth and competence in the critical first 7 seconds.',
  'first-impression-mastery',
  6,
  4,
  TRUE
)
ON CONFLICT (id) DO NOTHING;

-- Insert Module 1 (if not exists)
INSERT INTO course_modules (course_id, module_number, slug, title, description, order_index, estimated_duration_hours, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  1,
  'module-1',
  'The Neuroscience of Judgment',
  'Hacking the Survival Mechanism - Understanding the 100ms rule and the Warmth vs Competence framework.',
  1,
  2.0,
  TRUE
)
ON CONFLICT (course_id, module_number) DO NOTHING;


