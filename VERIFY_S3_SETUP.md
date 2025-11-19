# Verify S3 Setup - Final Steps

## ✅ What You've Done
- Added AWS credentials to `.env` file
- Created S3 bucket
- Created IAM user

## 🔍 What to Check Now

### Step 1: Verify .env File

Make sure your `.env` file (in root directory) has all 4 values:

```env
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=wJalr...
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-bucket-name
```

**Important:**
- No quotes around values
- No spaces before/after `=`
- No extra spaces

### Step 2: Verify Database Column Exists

Go to **Supabase Dashboard → SQL Editor** and run:

```sql
-- Check if s3_key column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'analyses' AND column_name = 's3_key';
```

**If you see a result** → Column exists, you're good! ✅

**If you see no results** → Run this migration:

```sql
ALTER TABLE analyses 
ADD COLUMN IF NOT EXISTS s3_key TEXT;

CREATE INDEX IF NOT EXISTS idx_analyses_s3_key 
ON analyses(s3_key) WHERE s3_key IS NOT NULL;
```

### Step 3: Restart Server ⚠️ CRITICAL!

**You MUST restart the server** for `.env` changes to take effect:

```bash
# Stop the server (Ctrl+C in the terminal where it's running)
# Then start it again:
npm run dev
```

### Step 4: Test Upload

1. **Upload a video** through your app
2. **Check server logs** - You should see:
   ```
   S3 configuration found, attempting to upload video...
   S3 Config: { bucket: 'your-bucket', region: 'us-east-1', hasAccessKey: true, hasSecretKey: true }
   ✅ Video uploaded to S3 successfully: videos/user-id/uuid-filename.mp4
   S3 Key to save: videos/user-id/uuid-filename.mp4
   ✅ Analysis saved with S3 key: videos/user-id/uuid-filename.mp4
   ```

3. **Check Supabase** - Go to `analyses` table:
   - `s3_key` column should have a value like `videos/user-id/uuid-filename.mp4`
   - If it's still `NULL`, check the server logs for errors

---

## 🐛 Troubleshooting

### Still seeing "s3_key is NULL"

**Check server logs for:**

1. **"S3 not configured" warning**
   - → `.env` file not loaded
   - → Server not restarted
   - → Wrong file location

2. **"Failed to upload video to S3" error**
   - → Check error message
   - → Verify credentials are correct
   - → Check bucket name matches exactly
   - → Check region matches

3. **"s3_key column not found"**
   - → Run the migration (Step 2)

### Common Issues

**Issue**: Server still shows "S3 not configured"
- **Solution**: Make sure you restarted the server after adding `.env` values

**Issue**: "Access Denied" error
- **Solution**: Check IAM user has `AmazonS3FullAccess` policy

**Issue**: "Bucket does not exist"
- **Solution**: Verify bucket name in `.env` matches exactly (case-sensitive)

**Issue**: "Invalid credentials"
- **Solution**: Check Access Key ID and Secret Key are correct (no extra spaces)

---

## ✅ Success Indicators

You'll know it's working when you see:

1. **Server logs show:**
   ```
   ✅ Video uploaded to S3 successfully: videos/...
   ✅ Analysis saved with S3 key: videos/...
   ```

2. **Supabase `analyses` table:**
   - `s3_key` column has values (not NULL)

3. **No errors in server logs**

---

## 🚀 Next Steps

Once it's working:
- Videos will be stored in S3
- You can view them via pre-signed URLs
- Old videos won't have S3 keys (only new ones)

If you still have issues, share the server logs and I'll help debug!

