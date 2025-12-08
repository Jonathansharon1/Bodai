-- Add tip_section column to action_items table to separate communication and body language tips
ALTER TABLE action_items ADD COLUMN IF NOT EXISTS tip_section TEXT;

-- Create index for filtering by tip_section
CREATE INDEX IF NOT EXISTS idx_action_items_tip_section ON action_items(tip_section);

-- Add comment to explain the column
COMMENT ON COLUMN action_items.tip_section IS 'Section for tips: communication, bodyLanguage, or NULL (for non-tip items)';

