-- Migration: add user profile fields from Clerk
BEGIN;

-- Add user profile fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS profile_image_url TEXT,
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS language_preference TEXT DEFAULT 'en';

-- Create index for full_name for search functionality
CREATE INDEX IF NOT EXISTS idx_users_full_name ON users(full_name) WHERE full_name IS NOT NULL;

-- Create index for email for lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email IS NOT NULL;

COMMIT;

