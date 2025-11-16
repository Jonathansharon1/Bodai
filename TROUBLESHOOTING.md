# Troubleshooting Guide

## Common Issues and Solutions

### 1. Supabase Not Connected

**Symptoms:**
- "Supabase credentials not found" warning in console
- Data not saving to database
- Dashboard not loading analyses

**Solution:**
1. Check `.env` file in root directory has:
   ```env
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
   OR
   ```env
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_SERVICE_API_KEY=your-service-role-key
   ```

2. **Important:** Use the **service_role** key (NOT the anon key)
   - Go to Supabase Dashboard → Settings → API
   - Copy the **service_role** key (click "Reveal")
   - It should start with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

3. Restart your backend server after adding/updating `.env`

### 2. Database Schema Not Created

**Symptoms:**
- Tables don't exist in Supabase
- Errors when trying to save data

**Solution:**
1. Go to Supabase Dashboard → SQL Editor
2. Run `supabase/schema.sql` (for new projects)
3. OR run `supabase/migration_add_subscription.sql` (if you already have users table)

### 3. CORS Errors

**Symptoms:**
- Network errors in browser console
- "CORS policy" errors

**Solution:**
- Check `CLIENT_ORIGIN` in `.env` matches your frontend URL
- Default: `http://localhost:3000`

### 4. Clerk Authentication Issues

**Symptoms:**
- "Missing Clerk Publishable Key" error
- Sign in not working

**Solution:**
1. Check `client/.env` has:
   ```env
   REACT_APP_CLERK_PUBLISHABLE_KEY=pk_test_...
   ```
2. Restart React dev server after adding key

### 5. Environment Variables Not Loading

**Solution:**
- Backend `.env` → root directory
- Frontend `.env` → `client/` directory
- Restart servers after changes
- Check variable names match exactly (case-sensitive)

## Testing Database Connection

1. Check backend console for Supabase warnings
2. Try uploading a video - should save to database
3. Check Supabase Table Editor - should see new rows
4. Check browser console for API errors

## Quick Checklist

- [ ] `.env` in root has `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `client/.env` has `REACT_APP_CLERK_PUBLISHABLE_KEY`
- [ ] Database schema created in Supabase
- [ ] Backend server restarted after `.env` changes
- [ ] Frontend server restarted after `.env` changes
- [ ] Using service_role key (not anon key)

