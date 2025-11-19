# How to Check if Videos are Being Saved to S3

## Quick Check

1. **Check Server Logs** - When you upload a video, look for:
   - `✅ Video uploaded to S3 successfully: videos/...` = **Working!**
   - `⚠️  S3 not configured: AWS_S3_BUCKET_NAME is not set` = **Not configured**
   - `❌ Failed to upload video to S3` = **Error - check details**

2. **Check Database** - In Supabase, check the `analyses` table:
   - If `s3_key` column has values like `videos/user-id/uuid-filename.mp4` = **Working!**
   - If `s3_key` is `NULL` = **Not saving to S3**

## Setup Steps

### 1. Check if S3 Column Exists in Database

Run this in Supabase SQL Editor:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'analyses' AND column_name = 's3_key';
```

If no results, run the migration:
```sql
ALTER TABLE analyses 
ADD COLUMN IF NOT EXISTS s3_key TEXT;

CREATE INDEX IF NOT EXISTS idx_analyses_s3_key ON analyses(s3_key) WHERE s3_key IS NOT NULL;
```

### 2. Configure AWS S3 in .env

Add these to your `.env` file (root directory):
```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_secret_access_key_here
AWS_REGION=us-east-1  # or your preferred region
AWS_S3_BUCKET_NAME=your-bucket-name-here
```

### 3. Create S3 Bucket (if you don't have one)

1. Go to [AWS S3 Console](https://s3.console.aws.amazon.com/)
2. Click "Create bucket"
3. Enter bucket name (e.g., `bodai-user-videos`)
4. Choose region (match `AWS_REGION` in .env)
5. **Uncheck "Block all public access"** (or configure CORS if needed)
6. Click "Create bucket"

### 4. Create IAM User for S3 Access

1. Go to [IAM Console](https://console.aws.amazon.com/iam/)
2. Click "Users" → "Create user"
3. Enter username (e.g., `bodai-s3-user`)
4. Select "Programmatic access"
5. Attach policy: `AmazonS3FullAccess` (or create custom policy with only needed permissions)
6. **Save the Access Key ID and Secret Access Key** - you'll need them for .env

### 5. Restart Server

After adding S3 config to .env:
```bash
# Stop the server (Ctrl+C)
# Start it again
npm run dev
```

### 6. Test Upload

1. Upload a video
2. Check server logs for S3 upload message
3. Check Supabase `analyses` table - `s3_key` should have a value

## Troubleshooting

### "S3 not configured" warning
- **Solution**: Add `AWS_S3_BUCKET_NAME` to `.env` file
- **Restart server** after adding

### "Failed to upload video to S3" error
- **Check**: AWS credentials are correct
- **Check**: Bucket name matches exactly
- **Check**: Region matches bucket region
- **Check**: IAM user has `s3:PutObject` permission

### Videos upload but don't display
- **Check**: `s3_key` is saved in database
- **Check**: Pre-signed URL generation works
- **Check**: CORS configuration on S3 bucket (if needed)

### CORS Configuration (if videos don't play in browser)

Add this to your S3 bucket CORS configuration:
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

## Cost Estimate

For 100 videos/month (50MB each):
- **Storage**: ~5 GB = ~$0.12/month
- **Requests**: ~200 requests = ~$0.001/month
- **Total**: ~$0.12/month

Very affordable! 💰

