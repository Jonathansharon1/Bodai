-- Create action_items table for To-Do List
CREATE TABLE IF NOT EXISTS action_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES analyses(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  details JSONB, -- Store action details (What to do, Why it matters, Example)
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_action_items_user_id ON action_items(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_action_items_status ON action_items(user_id, status);
CREATE INDEX IF NOT EXISTS idx_action_items_title ON action_items(user_id, title);

-- Enable RLS
ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;

-- Service role can manage action items
DROP POLICY IF EXISTS "Service role can manage action items" ON action_items;
CREATE POLICY "Service role can manage action items"
  ON action_items FOR ALL
  USING (true)
  WITH CHECK (true);

-- Users can view and update their own action items
DROP POLICY IF EXISTS "Users can view their own action items" ON action_items;
CREATE POLICY "Users can view their own action items"
  ON action_items FOR SELECT
  USING (auth.uid()::text = (SELECT clerk_user_id FROM users WHERE id = action_items.user_id));

DROP POLICY IF EXISTS "Users can update their own action items" ON action_items;
CREATE POLICY "Users can update their own action items"
  ON action_items FOR UPDATE
  USING (auth.uid()::text = (SELECT clerk_user_id FROM users WHERE id = action_items.user_id));

-- Trigger to update updated_at
DROP TRIGGER IF EXISTS update_action_items_updated_at ON action_items;
CREATE TRIGGER update_action_items_updated_at
  BEFORE UPDATE ON action_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

