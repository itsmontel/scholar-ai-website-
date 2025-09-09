const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

class MockS3Service {
  constructor() {
    this.uploadDir = path.join(__dirname, '../../uploads');
    this.ensureUploadDir();
  }

  ensureUploadDir() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Upload a file to local storage (mock S3)
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} fileName - Original file name
   * @param {string} userId - User ID for folder organization
   * @param {string} mimeType - File MIME type
   * @returns {Promise<Object>} Upload result with mock S3 key and URL
   */
  async uploadFile(fileBuffer, fileName, userId, mimeType) {
    try {
      const fileExtension = fileName.split('.').pop();
      const uniqueFileName = `${uuidv4()}.${fileExtension}`;
      const userDir = path.join(this.uploadDir, userId);
      
      // Create user directory if it doesn't exist
      if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: true });
      }

      const filePath = path.join(userDir, uniqueFileName);
      const s3Key = `documents/${userId}/${uniqueFileName}`;
      const s3Url = `http://localhost:3001/uploads/${userId}/${uniqueFileName}`;

      // Write file to local storage
      fs.writeFileSync(filePath, fileBuffer);

      console.log(`📁 Mock S3: File saved to ${filePath}`);

      return {
        success: true,
        s3Key,
        s3Url,
        fileName: uniqueFileName,
        originalName: fileName,
      };
    } catch (error) {
      console.error('Mock S3 upload error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get a download URL for a file (mock)
   * @param {string} s3Key - S3 object key
   * @param {number} expiresIn - URL expiration time in seconds (ignored in mock)
   * @returns {Promise<string>} Download URL
   */
  async getSignedDownloadUrl(s3Key, expiresIn = 3600) {
    try {
      // Extract user ID and filename from s3Key
      const parts = s3Key.split('/');
      const userId = parts[1];
      const fileName = parts[2];
      
      const downloadUrl = `http://localhost:3001/uploads/${userId}/${fileName}`;
      return downloadUrl;
    } catch (error) {
      console.error('Mock S3 signed URL error:', error);
      throw error;
    }
  }

  /**
   * Delete a file from local storage (mock)
   * @param {string} s3Key - S3 object key
   * @returns {Promise<boolean>} Success status
   */
  async deleteFile(s3Key) {
    try {
      // Extract user ID and filename from s3Key
      const parts = s3Key.split('/');
      const userId = parts[1];
      const fileName = parts[2];
      
      const filePath = path.join(this.uploadDir, userId, fileName);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Mock S3: File deleted ${filePath}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Mock S3 delete error:', error);
      return false;
    }
  }

  /**
   * Get file metadata from local storage (mock)
   * @param {string} s3Key - S3 object key
   * @returns {Promise<Object>} File metadata
   */
  async getFileMetadata(s3Key) {
    try {
      // Extract user ID and filename from s3Key
      const parts = s3Key.split('/');
      const userId = parts[1];
      const fileName = parts[2];
      
      const filePath = path.join(this.uploadDir, userId, fileName);
      
      if (!fs.existsSync(filePath)) {
        throw new Error('File not found');
      }

      const stats = fs.statSync(filePath);
      
      return {
        contentType: 'application/octet-stream',
        contentLength: stats.size,
        lastModified: stats.mtime,
        metadata: {
          originalName: fileName,
          userId: userId,
          uploadedAt: stats.birthtime.toISOString(),
        },
      };
    } catch (error) {
      console.error('Mock S3 metadata error:', error);
      throw error;
    }
  }
}

module.exports = new MockS3Service();
