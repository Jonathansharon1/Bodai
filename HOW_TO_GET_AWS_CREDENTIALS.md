# How to Get AWS S3 Credentials - Step by Step Guide

## Overview
You need 4 things for S3 configuration:
1. **AWS_ACCESS_KEY_ID** - From IAM user
2. **AWS_SECRET_ACCESS_KEY** - From IAM user  
3. **AWS_REGION** - Choose a region (e.g., us-east-1)
4. **AWS_S3_BUCKET_NAME** - Name of your S3 bucket

---

## Step 1: Create AWS Account (if you don't have one)

1. Go to [aws.amazon.com](https://aws.amazon.com)
2. Click "Create an AWS Account" (top right)
3. Fill in your details:
   - Email address
   - Password
   - Account name
4. Enter payment information (AWS Free Tier includes 5GB S3 storage free for 12 months)
5. Verify your phone number
6. Choose a support plan (Basic is free)
7. **Wait for account activation** (usually a few minutes)

---

## Step 2: Create S3 Bucket

1. **Login to AWS Console**
   - Go to [console.aws.amazon.com](https://console.aws.amazon.com)
   - Sign in with your account

2. **Go to S3 Service**
   - In the search bar at the top, type "S3"
   - Click on "S3" service

3. **Create Bucket**
   - Click the orange "Create bucket" button
   - **Bucket name**: Enter a unique name (e.g., `bodai-user-videos-2024`)
     - Must be globally unique (no one else can have this name)
     - Use lowercase letters, numbers, and hyphens only
     - Example: `bodai-videos-yourname` or `bodai-user-videos-123`
   
4. **Choose Region**
   - Select a region close to you (e.g., `us-east-1` for US East)
   - **Remember this region** - you'll need it for `AWS_REGION` in .env
   - Common regions:
     - `us-east-1` - US East (N. Virginia) - Cheapest
     - `eu-west-1` - Europe (Ireland)
     - `ap-southeast-1` - Asia Pacific (Singapore)

5. **Configure Options**
   - **Object Ownership**: Leave default (ACLs disabled)
   - **Block Public Access**: 
     - **Uncheck "Block all public access"** (or configure CORS later)
     - Or leave checked if you only use pre-signed URLs (recommended)
   - **Bucket Versioning**: Disable (unless you need it)
   - **Default encryption**: Enable (recommended)
   - **Object Lock**: Disable

6. **Create Bucket**
   - Scroll down and click "Create bucket"
   - **Copy the bucket name** - this is your `AWS_S3_BUCKET_NAME`

---

## Step 3: Create IAM User (for programmatic access)

1. **Go to IAM Service**
   - In AWS Console search bar, type "IAM"
   - Click on "IAM" service

2. **Create User**
   - Click "Users" in the left sidebar
   - Click "Create user" button (top right)

3. **User Details**
   - **User name**: Enter a name (e.g., `bodai-s3-user`)
   - **AWS credential type**: 
     - ✅ Check "Provide user access to the AWS Management Console" (optional)
     - ✅ **MUST check "Access key - Programmatic access"** (required!)

4. **Set Permissions**
   - Click "Next" (skip console access if you don't need it)
   - **Attach policies directly**:
     - Search for "S3"
     - ✅ Check "AmazonS3FullAccess" (or create custom policy with only needed permissions)
     - Click "Next"

5. **Review and Create**
   - Review the settings
   - Click "Create user"

6. **Save Credentials** ⚠️ **IMPORTANT!**
   - You'll see a success page with:
     - **Access key ID** - This is your `AWS_ACCESS_KEY_ID`
     - **Secret access key** - This is your `AWS_SECRET_ACCESS_KEY`
   - **⚠️ DOWNLOAD THE CSV FILE OR COPY THESE VALUES NOW!**
   - **You can only see the secret key once!** If you lose it, you'll need to create a new access key.

---

## Step 4: Add to .env File

Open your `.env` file (in the root directory) and add:

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=bodai-user-videos-2024
```

**Replace with your actual values:**
- `AWS_ACCESS_KEY_ID` = The Access key ID from Step 3
- `AWS_SECRET_ACCESS_KEY` = The Secret access key from Step 3
- `AWS_REGION` = The region you chose in Step 2 (e.g., `us-east-1`)
- `AWS_S3_BUCKET_NAME` = The bucket name from Step 2

---

## Step 5: Restart Server

```bash
# Stop server (Ctrl+C)
# Start again
npm run dev
```

---

## Step 6: Test

1. Upload a video
2. Check server logs for:
   - `✅ Video uploaded to S3 successfully: videos/...`
   - `✅ Analysis saved with S3 key: videos/...`
3. Check Supabase `analyses` table - `s3_key` should have a value

---

## Troubleshooting

### "Access Denied" Error
- **Check**: IAM user has `AmazonS3FullAccess` policy attached
- **Check**: Access key ID and secret key are correct
- **Check**: No extra spaces in `.env` file

### "Bucket does not exist"
- **Check**: Bucket name in `.env` matches exactly (case-sensitive)
- **Check**: Region matches bucket region

### "Invalid credentials"
- **Check**: Access key ID and secret key are correct
- **Check**: No quotes around values in `.env` file
- **Check**: No extra spaces before/after values

### Can't find Secret Access Key
- **Solution**: You need to create a new access key:
  1. Go to IAM → Users → Your user
  2. Click "Security credentials" tab
  3. Click "Create access key"
  4. Choose "Application running outside AWS"
  5. Save the credentials

---

## Cost Estimate

**AWS Free Tier** (first 12 months):
- 5 GB S3 storage - **FREE**
- 20,000 GET requests - **FREE**
- 2,000 PUT requests - **FREE**

**After Free Tier** (very cheap):
- Storage: ~$0.023 per GB/month
- 100 videos/month (50MB each) = ~$0.12/month

---

## Security Best Practices

1. **Never commit `.env` to git** (already in `.gitignore`)
2. **Use IAM user** (not root account credentials)
3. **Limit permissions** - Create custom policy with only needed S3 permissions:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
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

---

## Quick Reference

| What You Need | Where to Get It |
|--------------|----------------|
| `AWS_ACCESS_KEY_ID` | IAM → Users → Your User → Security credentials → Access keys |
| `AWS_SECRET_ACCESS_KEY` | Same place (only shown once when created) |
| `AWS_REGION` | S3 → Your Bucket → Properties → Region |
| `AWS_S3_BUCKET_NAME` | S3 → Your Bucket → Name |

---

## Need Help?

If you get stuck:
1. Check AWS Console for error messages
2. Check server logs for detailed error messages
3. Verify all 4 values in `.env` are correct
4. Make sure server was restarted after adding `.env` values

