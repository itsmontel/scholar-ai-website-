const AWS = require('aws-sdk');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

// Configure multer for memory storage
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default
  }
});

// Upload file to S3
const uploadToS3 = async (file, userId, originalName) => {
  try {
    const fileExtension = path.extname(originalName);
    const fileName = `${userId}/${uuidv4()}${fileExtension}`;
    
    const uploadParams = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'private', // Make files private
      Metadata: {
        'original-name': originalName,
        'uploaded-by': userId,
        'upload-date': new Date().toISOString()
      }
    };

    const result = await s3.upload(uploadParams).promise();
    
    return {
      s3Key: fileName,
      s3Url: result.Location,
      bucket: process.env.AWS_S3_BUCKET
    };
  } catch (error) {
    console.error('S3 upload error:', error);
    throw new Error('Failed to upload file to storage');
  }
};

// Get signed URL for file download
const getSignedUrl = async (s3Key, expiresIn = 3600) => {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: s3Key,
      Expires: expiresIn
    };

    const url = await s3.getSignedUrlPromise('getObject', params);
    return url;
  } catch (error) {
    console.error('S3 signed URL error:', error);
    throw new Error('Failed to generate download URL');
  }
};

// Delete file from S3
const deleteFromS3 = async (s3Key) => {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: s3Key
    };

    await s3.deleteObject(params).promise();
    return true;
  } catch (error) {
    console.error('S3 delete error:', error);
    throw new Error('Failed to delete file from storage');
  }
};

// Get file metadata from S3
const getFileMetadata = async (s3Key) => {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: s3Key
    };

    const result = await s3.headObject(params).promise();
    return {
      size: result.ContentLength,
      lastModified: result.LastModified,
      contentType: result.ContentType,
      metadata: result.Metadata
    };
  } catch (error) {
    console.error('S3 metadata error:', error);
    throw new Error('Failed to get file metadata');
  }
};

// Check if S3 bucket exists and is accessible
const checkS3Connection = async () => {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET
    };

    await s3.headBucket(params).promise();
    return true;
  } catch (error) {
    console.error('S3 connection check failed:', error);
    return false;
  }
};

module.exports = {
  upload,
  uploadToS3,
  getSignedUrl,
  deleteFromS3,
  getFileMetadata,
  checkS3Connection
};
