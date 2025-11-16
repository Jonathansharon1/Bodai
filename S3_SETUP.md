# S3 Video Storage Setup

## Overview
Videos are now stored in Amazon S3 instead of being kept only in memory. This provides:
- **Durable storage**: Videos persist even after analysis
- **Scalability**: Handle large files without server storage limits
- **Security**: Private videos accessible only via pre-signed URLs
- **Cost efficiency**: Pay only for what you store

## Environment Variables Required

Add these to your `.env` file (root directory):

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_REGION=us-east-1  # or your preferred region
AWS_S3_BUCKET_NAME=your-bucket-name
```

## Database Migration

Run the migration to add the `s3_key` column to the `analyses` table:

```sql
-- Run this in your Supabase SQL editor
ALTER TABLE analyses 
ADD COLUMN IF NOT EXISTS s3_key TEXT;

CREATE INDEX IF NOT EXISTS idx_analyses_s3_key ON analyses(s3_key) WHERE s3_key IS NOT NULL;
```

Or use the migration file:
```bash
# In Supabase dashboard, go to SQL Editor and run:
supabase/migration_add_s3_key.sql
```

## S3 Bucket Setup

1. **Create S3 Bucket**:
   - Go to AWS S3 Console
   - Create a new bucket (e.g., `bodai-user-videos`)
   - Choose a region close to your users
   - **Disable public access** (videos should be private)

2. **Bucket Policy** (Optional - for additional security):
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Principal": {
           "AWS": "arn:aws:iam::YOUR_ACCOUNT_ID:user/YOUR_IAM_USER"
         },
         "Action": [
           "s3:PutObject",
           "s3:GetObject",
           "s3:DeleteObject"
         ],
         "Resource": "arn:aws:s3:::your-bucket-name/*"
       }
     ]
   }
   ```

3. **IAM User Setup**:
   - Create an IAM user with programmatic access
   - Attach policy with S3 permissions:
     - `s3:PutObject`
     - `s3:GetObject`
     - `s3:DeleteObject`
   - Use the access key ID and secret access key in your `.env`

## How It Works

### Upload Flow
1. User uploads video → Backend receives file
2. Backend uploads video to S3 → Gets S3 key
3. Backend analyzes video with Gemini
4. Backend saves analysis + S3 key to database

### Viewing Flow
1. User clicks "View Full Analysis" → Frontend requests analysis
2. Backend generates pre-signed URL (expires in 1 hour)
3. Frontend displays video using pre-signed URL
4. Video is accessible only to the authenticated user

## API Endpoints

### Get Video URL
```
GET /api/analyses/:id/video-url
Headers:
  X-Clerk-User-Id: <user_id>

Response:
{
  "video_url": "https://s3.amazonaws.com/..."
}
```

### Get Analysis (includes video_url if available)
```
GET /api/analyses/:id
Headers:
  X-Clerk-User-Id: <user_id>

Response:
{
  "analysis": {
    "id": "...",
    "video_filename": "...",
    "s3_key": "videos/user-id/uuid-filename.mp4",
    "video_url": "https://s3.amazonaws.com/...", // Pre-signed URL
    "analysis_result": "...",
    ...
  }
}
```

## File Structure in S3

```
your-bucket/
  videos/
    {user-id-1}/
      {uuid}-video1.mp4
      {uuid}-video2.mp4
    {user-id-2}/
      {uuid}-video1.mp4
```

## Security Features

- **Private Storage**: All videos are stored with `ACL: 'private'`
- **Pre-signed URLs**: Videos accessible only via time-limited URLs (1 hour default)
- **User Verification**: Backend verifies user owns the analysis before generating URL
- **No Public Access**: Bucket configured to block public access

## Troubleshooting

### Videos not uploading
- Check AWS credentials in `.env`
- Verify bucket name is correct
- Check IAM user has `s3:PutObject` permission
- Check bucket region matches `AWS_REGION`

### Videos not displaying
- Check `s3_key` is saved in database
- Verify pre-signed URL generation is working
- Check browser console for CORS errors (may need CORS config on bucket)

### CORS Configuration (if needed)
If videos don't play in browser, add CORS configuration to your S3 bucket:

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

## Cost Considerations

- **Storage**: ~$0.023 per GB/month (Standard storage)
- **Requests**: 
  - PUT requests: $0.005 per 1,000 requests
  - GET requests: $0.0004 per 1,000 requests
- **Data Transfer**: First 100 GB/month free, then $0.09 per GB

For a typical use case (100 videos/month, 50MB each):
- Storage: ~5 GB = ~$0.12/month
- Requests: ~200 requests = ~$0.001/month
- **Total: ~$0.12/month**

## Lifecycle Policies (Optional)

To automatically delete old videos, set up a lifecycle policy:

```json
{
  "Rules": [
    {
      "Id": "DeleteOldVideos",
      "Status": "Enabled",
      "Prefix": "videos/",
      "Expiration": {
        "Days": 365  // Delete videos older than 1 year
      }
    }
  ]
}
```


