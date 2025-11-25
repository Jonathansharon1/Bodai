-- Migration: add email notifications system
BEGIN;

-- Add email preferences to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS email_marketing_enabled BOOLEAN DEFAULT true;

-- Create email_notifications table to track sent emails
CREATE TABLE IF NOT EXISTS email_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'bounced')),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_email_notifications_user_id ON email_notifications(user_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_notifications_type ON email_notifications(email_type, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_notifications_status ON email_notifications(status, sent_at DESC);

-- Enable Row Level Security
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own email notifications
CREATE POLICY "Users can view their own email notifications"
  ON email_notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = email_notifications.user_id
      AND users.clerk_user_id = auth.jwt() ->> 'sub'
    )
  );

-- RLS Policy: Service role can manage all email notifications
CREATE POLICY "Service role can manage email notifications"
  ON email_notifications FOR ALL
  USING (true)
  WITH CHECK (true);

COMMIT;

