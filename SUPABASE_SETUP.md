# Supabase Setup Instructions

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in:
   - **Name**: BodAI (or your choice)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to you
4. Wait for project to be created (~2 minutes)

## 2. Get Your Credentials

1. Go to **Settings** → **API**
2. Copy:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **service_role key** (under "Project API keys" → "service_role" - **Keep this secret!**)

## 3. Set Up Database Schema

1. Go to **SQL Editor** in Supabase dashboard
2. Click "New Query"
3. Copy and paste the contents of `supabase/schema.sql`
4. Click "Run" (or press Ctrl+Enter)
5. Verify tables were created:
   - Go to **Table Editor**
   - You should see `users` and `analyses` tables

## 4. Configure Environment Variables

Add to your `.env` file (root directory):

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Important**: 
- Use the **service_role** key (not the anon key) for backend
- Never commit this key to git
- The service_role key bypasses RLS, so keep it secure

## 5. Install Dependencies

```bash
npm install
```

## 6. Test the Setup

1. Start your backend: `npm run dev`
2. Upload a video and analyze it
3. Check Supabase dashboard → **Table Editor** → `analyses` table
4. You should see a new row with your analysis

## Troubleshooting

### "Supabase is not configured" error
- Check that `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set in `.env`
- Restart your backend server after adding env variables

### RLS Policy errors
- Make sure you ran the `schema.sql` file completely
- Check that RLS is enabled on tables
- Verify policies were created in **Authentication** → **Policies**

### User not found errors
- The `getOrCreateUser` function should create users automatically
- Check the `users` table in Supabase dashboard

## Next Steps

- ✅ Database setup complete
- ✅ Analyses are being saved
- 🔜 Add course tables when ready
- 🔜 Add payment tracking when ready

