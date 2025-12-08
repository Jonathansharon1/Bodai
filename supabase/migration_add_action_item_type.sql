-- Add item_type column to action_items table to distinguish between tips, quick wins, and recording notes
ALTER TABLE action_items ADD COLUMN IF NOT EXISTS item_type TEXT;

-- Create index for filtering by item_type
CREATE INDEX IF NOT EXISTS idx_action_items_type ON action_items(item_type);

-- Add comment to explain the column
COMMENT ON COLUMN action_items.item_type IS 'Type of action item: tip, quick_win, recording_note, or NULL (legacy)';

