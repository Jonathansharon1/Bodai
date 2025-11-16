-- Migration: Add 'basic' subscription type and subscription_started_at field
-- This migration updates the subscription system to support the new pricing model:
-- Free, Basic, Premium, Pro, and Pay As You Go

-- Step 1: Drop the existing CHECK constraint on subscription_type
DO $$ 
BEGIN
    -- Drop the old constraint if it exists
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_subscription_type_check;
END $$;

-- Step 2: Add the new CHECK constraint with 'basic' included
ALTER TABLE users 
ADD CONSTRAINT users_subscription_type_check 
CHECK (subscription_type IN ('free', 'basic', 'premium', 'pro'));

-- Step 3: Add subscription_started_at field if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='users' AND column_name='subscription_started_at'
    ) THEN
        ALTER TABLE users 
        ADD COLUMN subscription_started_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Step 4: Update existing users who have premium/pro subscriptions to set started_at
-- (if they have an expires_at, we can estimate started_at as 30 days before)
UPDATE users 
SET subscription_started_at = subscription_expires_at - INTERVAL '30 days'
WHERE subscription_type IN ('premium', 'pro') 
  AND subscription_expires_at IS NOT NULL 
  AND subscription_started_at IS NULL;

-- Step 5: For users without expires_at but with active premium/pro subscriptions,
-- set started_at to their account creation date
UPDATE users 
SET subscription_started_at = created_at
WHERE subscription_type IN ('premium', 'pro') 
  AND subscription_status = 'active'
  AND subscription_started_at IS NULL;

-- Step 6: Create index on subscription_started_at for faster queries
CREATE INDEX IF NOT EXISTS idx_users_subscription_started_at 
ON users(subscription_started_at);

-- Note: Pay As You Go users don't need a subscription_type - they're tracked differently
-- They can be identified by having subscription_type = 'free' but making individual purchases

