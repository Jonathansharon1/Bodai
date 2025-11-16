import 'dotenv/config';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import path from 'path';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;
const UPLOAD_PREFIX = 'videos/'; // Videos will be stored in videos/ folder

/**
 * Upload video to S3
 * @param {Buffer} videoBuffer - Video file buffer
 * @param {string} originalFilename - Original filename
 * @param {string} mimeType - MIME type (e.g., 'video/mp4')
 * @param {string} userId - User ID (for organizing files)
 * @returns {Promise<{key: string, url: string}>} S3 key and URL
 */
export const uploadVideoToS3 = async (videoBuffer, originalFilename, mimeType, userId) => {
  if (!BUCKET_NAME) {
    throw new Error('AWS_S3_BUCKET_NAME is not configured');
  }

  // Generate unique key: videos/{userId}/{uuid}-{originalFilename}
  const fileExtension = path.extname(originalFilename);
  const uniqueId = randomUUID();
  const sanitizedFilename = originalFilename.replace(/[^a-zA-Z0-9.-]/g, '_');
  const key = `${UPLOAD_PREFIX}${userId}/${uniqueId}-${sanitizedFilename}`;

  // Upload to S3
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: videoBuffer,
    ContentType: mimeType,
    // Make videos private (only accessible via pre-signed URLs)
    ACL: 'private',
    // Add metadata
    Metadata: {
      originalFilename: originalFilename,
      userId: userId,
      uploadedAt: new Date().toISOString(),
    },
  });

  try {
    await s3Client.send(command);
    return {
      key: key,
      bucket: BUCKET_NAME,
      region: process.env.AWS_REGION || 'us-east-1',
    };
  } catch (error) {
    console.error('Error uploading video to S3:', error);
    throw new Error(`Failed to upload video to S3: ${error.message}`);
  }
};

/**
 * Get pre-signed URL for viewing video (expires in 1 hour by default)
 * @param {string} s3Key - S3 object key
 * @param {number} expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @returns {Promise<string>} Pre-signed URL
 */
export const getVideoUrl = async (s3Key, expiresIn = 3600) => {
  if (!BUCKET_NAME || !s3Key) {
    return null;
  }

  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error('Error generating pre-signed URL:', error);
    return null;
  }
};

/**
 * Delete video from S3
 * @param {string} s3Key - S3 object key
 * @returns {Promise<boolean>} Success status
 */
export const deleteVideoFromS3 = async (s3Key) => {
  if (!BUCKET_NAME || !s3Key) {
    return false;
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error('Error deleting video from S3:', error);
    return false;
  }
};

