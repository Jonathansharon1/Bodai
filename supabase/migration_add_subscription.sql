    -- Migration: Add subscription fields to existing users table
    -- Run this if you already have a users table without subscription fields

    -- Add subscription columns if they don't exist
    DO $$ 
    BEGIN
    -- Add subscription_type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name='users' AND column_name='subscription_type') THEN
        ALTER TABLE users ADD COLUMN subscription_type TEXT DEFAULT 'free' 
        CHECK (subscription_type IN ('free', 'premium', 'pro'));
    END IF;

    -- Add subscription_status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name='users' AND column_name='subscription_status') THEN
        ALTER TABLE users ADD COLUMN subscription_status TEXT DEFAULT 'active' 
        CHECK (subscription_status IN ('active', 'cancelled', 'expired'));
    END IF;

    -- Add subscription_expires_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name='users' AND column_name='subscription_expires_at') THEN
        ALTER TABLE users ADD COLUMN subscription_expires_at TIMESTAMP WITH TIME ZONE;
    END IF;

  -- Add free_analysis_used
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='users' AND column_name='free_analysis_used') THEN
    ALTER TABLE users ADD COLUMN free_analysis_used BOOLEAN DEFAULT FALSE;
  END IF;

  -- Add onboarding fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='users' AND column_name='primary_goal') THEN
    ALTER TABLE users ADD COLUMN primary_goal TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='users' AND column_name='confidence_level') THEN
    ALTER TABLE users ADD COLUMN confidence_level TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='users' AND column_name='onboarding_completed_at') THEN
    ALTER TABLE users ADD COLUMN onboarding_completed_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

    -- Update existing users to have free subscription
    UPDATE users 
    SET 
    subscription_type = 'free',
    subscription_status = 'active',
    free_analysis_used = (
        SELECT COUNT(*) > 0 
        FROM analyses 
        WHERE analyses.user_id = users.id
    )
    WHERE subscription_type IS NULL;

    -- Create indexes if they don't exist
    CREATE INDEX IF NOT EXISTS idx_users_subscription_type ON users(subscription_type);
    CREATE INDEX IF NOT EXISTS idx_users_clerk_user_id ON users(clerk_user_id);

