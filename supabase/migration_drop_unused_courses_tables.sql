-- Migration: Drop unused courses-related tables (courses, course_enrollments, course_modules, module_baselines)
-- NOTE: Only run this after verifying in production that these tables are not needed
-- and no application code depends on them.

DO $$
BEGIN
  -- Drop module_baselines first due to foreign key dependencies
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'module_baselines') THEN
    DROP TABLE module_baselines;
  END IF;

  -- Drop course_modules next
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'course_modules') THEN
    DROP TABLE course_modules;
  END IF;

  -- Drop course_enrollments next
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'course_enrollments') THEN
    DROP TABLE course_enrollments;
  END IF;

  -- Finally drop courses
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courses') THEN
    DROP TABLE courses;
  END IF;
END $$;


