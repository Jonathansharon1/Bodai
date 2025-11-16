# How to Create the action_items Table

The `action_items` table is missing from your Supabase database. Follow these steps to create it:

## Option 1: Using Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - Open your Supabase project at [supabase.com](https://supabase.com)
   - Navigate to your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the Migration**
   - Copy the entire contents of `supabase/migration_add_action_items.sql`
   - Paste it into the SQL Editor
   - Click "Run" (or press Ctrl+Enter)

4. **Verify the Table was Created**
   - Go to "Table Editor" in the left sidebar
   - You should now see the `action_items` table
   - Check that it has these columns:
     - `id` (UUID)
     - `user_id` (UUID)
     - `analysis_id` (UUID)
     - `title` (TEXT)
     - `details` (JSONB)
     - `status` (TEXT)
     - `created_at` (TIMESTAMP)
     - `completed_at` (TIMESTAMP)
     - `updated_at` (TIMESTAMP)

## Option 2: Using Supabase CLI (If you have it installed)

```bash
# Make sure you're in the project root directory
cd "C:/Users/user/OneDrive/שולחן העבודה/Bodai"

# Run the migration
supabase db push
```

## After Running the Migration

1. **Restart your backend server** (if it's running)
2. **Refresh your Dashboard** in the browser
3. **Upload a new video** to test if Action Items are now being saved

## Troubleshooting

If you get an error about `update_updated_at_column()` function not existing:

1. First run this in SQL Editor:
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

2. Then run the migration again.

## What This Migration Does

- Creates the `action_items` table
- Sets up indexes for faster queries
- Enables Row Level Security (RLS)
- Creates policies for service role and users
- Sets up a trigger to automatically update `updated_at` timestamp

