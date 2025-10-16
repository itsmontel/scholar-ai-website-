const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');

class S3Service {
  constructor() {
    // Validate required environment variables
    this.validateConfiguration();
    
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
    this.bucketName = process.env.AWS_S3_BUCKET || 'writescholar-documents';
    
    console.log(`🔗 S3 Service initialized - Bucket: ${this.bucketName}, Region: ${process.env.AWS_REGION || 'us-east-1'}`);
  }

  /**
   * Validate S3 configuration
   */
  validateConfiguration() {
    const requiredVars = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_S3_BUCKET'];
    const missing = requiredVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
      console.error('❌ Missing required S3 environment variables:', missing.join(', '));
      console.error('Please check your .env file and ensure all AWS S3 variables are set.');
      throw new Error(`Missing S3 configuration: ${missing.join(', ')}`);
    }
  }

  /**
   * Upload a file to S3
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} fileName - Original file name
   * @param {string} userId - User ID for folder organization
   * @param {string} mimeType - File MIME type
   * @returns {Promise<Object>} Upload result with S3 key and URL
   */
  async uploadFile(fileBuffer, fileName, userId, mimeType) {
    try {
      console.log(`📤 Uploading file to S3: ${fileName} (${fileBuffer.length} bytes)`);
      
      const fileExtension = fileName.split('.').pop();
      const uniqueFileName = `${uuidv4()}.${fileExtension}`;
      const s3Key = `documents/${userId}/${uniqueFileName}`;

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
        Body: fileBuffer,
        ContentType: mimeType,
        Metadata: {
          originalName: fileName,
          userId: userId,
          uploadedAt: new Date().toISOString(),
        },
      });

      const startTime = Date.now();
      await this.s3Client.send(command);
      const uploadTime = Date.now() - startTime;

      const s3Url = `https://${this.bucketName}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${s3Key}`;

      console.log(`✅ S3 upload successful: ${s3Key} (${uploadTime}ms)`);

      return {
        success: true,
        s3Key,
        s3Url,
        fileName: uniqueFileName,
        originalName: fileName,
        uploadTime,
      };
    } catch (error) {
      console.error('❌ S3 upload error:', {
        fileName,
        userId,
        error: error.message,
        code: error.code,
        statusCode: error.$metadata?.httpStatusCode
      });
      
      // Provide more specific error messages
      let errorMessage = error.message;
      if (error.code === 'NoSuchBucket') {
        errorMessage = `S3 bucket '${this.bucketName}' does not exist`;
      } else if (error.code === 'AccessDenied') {
        errorMessage = 'Access denied. Check IAM permissions for S3';
      } else if (error.code === 'InvalidAccessKeyId') {
        errorMessage = 'Invalid AWS access key ID';
      } else if (error.code === 'SignatureDoesNotMatch') {
        errorMessage = 'Invalid AWS secret access key';
      }
      
      return {
        success: false,
        error: errorMessage,
        code: error.code,
      };
    }
  }

  /**
   * Get a signed URL for downloading a file
   * @param {string} s3Key - S3 object key
   * @param {number} expiresIn - URL expiration time in seconds (default: 3600)
   * @returns {Promise<string>} Signed URL
   */
  async getSignedDownloadUrl(s3Key, expiresIn = 3600) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
      });

      const signedUrl = await getSignedUrl(this.s3Client, command, { expiresIn });
      return signedUrl;
    } catch (error) {
      console.error('S3 signed URL error:', error);
      throw error;
    }
  }

  /**
   * Delete a file from S3
   * @param {string} s3Key - S3 object key
   * @returns {Promise<boolean>} Success status
   */
  async deleteFile(s3Key) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      console.error('S3 delete error:', error);
      return false;
    }
  }

  /**
   * Get file metadata from S3
   * @param {string} s3Key - S3 object key
   * @returns {Promise<Object>} File metadata
   */
  async getFileMetadata(s3Key) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
      });

      const response = await this.s3Client.send(command);
      return {
        contentType: response.ContentType,
        contentLength: response.ContentLength,
        lastModified: response.LastModified,
        metadata: response.Metadata,
      };
    } catch (error) {
      console.error('S3 metadata error:', error);
      throw error;
    }
  }
}

module.exports = new S3Service();
