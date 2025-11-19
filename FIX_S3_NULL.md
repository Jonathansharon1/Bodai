# How to Fix "s3_key is NULL" Issue

## The Problem
You're seeing: `Analysis saved but s3_key is NULL. S3 may not be configured or upload failed.`

This means videos are not being saved to S3. Here's how to fix it:

## Step 1: Check Server Logs

When you upload a video, look for one of these messages:

### Option A: S3 Not Configured
If you see:
```
⚠️  S3 not configured: AWS_S3_BUCKET_NAME is not set in .env file
```

**Solution**: Add S3 configuration to `.env` file (see Step 2)

### Option B: S3 Upload Failed
If you see:
```
❌ Failed to upload video to S3 (continuing anyway): [error message]
```

**Solution**: Check the error message and fix the issue (see Step 3)

### Option C: S3 Config Found But Still NULL
If you see:
```
S3 configuration found, attempting to upload video...
S3 Config: { bucket: '...', region: '...', hasAccessKey: true, hasSecretKey: true }
```

But still getting NULL, check for errors in the logs.

## Step 2: Configure S3 in .env File

Add these lines to your `.env` file (in the root directory):

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_secret_access_key_here
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-bucket-name-here
```

### How to Get AWS Credentials:

1. **Create AWS Account** (if you don't have one):
   - Go to [aws.amazon.com](https://aws.amazon.com)
   - Sign up for free tier account

2. **Create S3 Bucket**:
   - Go to [S3 Console](https://s3.console.aws.amazon.com/)
   - Click "Create bucket"
   - Enter bucket name (e.g., `bodai-user-videos`)
   - Choose region (e.g., `us-east-1`)
   - **Uncheck "Block all public access"** (or configure CORS)
   - Click "Create bucket"

3. **Create IAM User**:
   - Go to [IAM Console](https://console.aws.amazon.com/iam/)
   - Click "Users" → "Create user"
   - Enter username (e.g., `bodai-s3-user`)
   - Select "Programmatic access"
   - Attach policy: `AmazonS3FullAccess` (or create custom policy)
   - **Save the Access Key ID and Secret Access Key** - you'll need them!

4. **Add to .env**:
   ```env
   AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
   AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
   AWS_REGION=us-east-1
   AWS_S3_BUCKET_NAME=bodai-user-videos
   ```

## Step 3: Verify Database Column Exists

Make sure the `s3_key` column exists in your `analyses` table:

1. Go to Supabase Dashboard → SQL Editor
2. Run this query:
   ```sql
   -- Check if column exists
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'analyses' AND column_name = 's3_key';
   ```

3. If no results, run this migration:
   ```sql
   ALTER TABLE analyses 
   ADD COLUMN IF NOT EXISTS s3_key TEXT;

   CREATE INDEX IF NOT EXISTS idx_analyses_s3_key 
   ON analyses(s3_key) WHERE s3_key IS NOT NULL;
   ```

## Step 4: Restart Server

After adding S3 config to `.env`:
```bash
# Stop server (Ctrl+C)
# Start again
npm run dev
```

## Step 5: Test Upload

1. Upload a new video
2. Check server logs for:
   - `✅ Video uploaded to S3 successfully: videos/...`
   - `✅ Analysis saved with S3 key: videos/...`
3. Check Supabase `analyses` table - `s3_key` should have a value

## Common Issues

### Issue: "Access Denied" Error
**Solution**: 
- Check IAM user has `s3:PutObject` permission
- Verify bucket name is correct
- Check region matches

### Issue: "Bucket does not exist"
**Solution**:
- Verify bucket name in `.env` matches exactly
- Check region matches bucket region

### Issue: "Invalid credentials"
**Solution**:
- Verify `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are correct
- Make sure there are no extra spaces in `.env` file

### Issue: Column exists but still NULL
**Solution**:
- Check server logs for S3 upload errors
- Verify S3 credentials are correct
- Test S3 connection manually

## Testing S3 Connection

You can test if S3 is working by checking the server logs when uploading:

**Good logs:**
```
S3 configuration found, attempting to upload video...
S3 Config: { bucket: 'bodai-videos', region: 'us-east-1', hasAccessKey: true, hasSecretKey: true }
✅ Video uploaded to S3 successfully: videos/user-id/uuid-filename.mp4
S3 Key to save: videos/user-id/uuid-filename.mp4
✅ Analysis saved with S3 key: videos/user-id/uuid-filename.mp4
```

**Bad logs:**
```
⚠️  S3 not configured: AWS_S3_BUCKET_NAME is not set in .env file
S3 Key to save: NULL (S3 not configured or upload failed)
⚠️  Analysis saved but s3_key is NULL. S3 may not be configured or upload failed.
```

## Cost Estimate

S3 is very cheap:
- **Storage**: ~$0.023 per GB/month
- **100 videos/month (50MB each)**: ~$0.12/month

## Next Steps

1. Add S3 config to `.env`
2. Run database migration (if needed)
3. Restart server
4. Upload test video
5. Check logs and database

If you still have issues, share the server logs and I'll help debug!

