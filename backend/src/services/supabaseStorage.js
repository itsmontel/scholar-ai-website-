const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

class SupabaseStorageService {
  constructor() {
    // Validate required environment variables
    this.validateConfiguration();
    
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    this.bucketName = 'writescholar-documents';
    
    console.log(`🔗 Supabase Storage Service initialized - Bucket: ${this.bucketName}`);
  }

  /**
   * Validate Supabase configuration
   */
  validateConfiguration() {
    const requiredVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
    const missing = requiredVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
      console.error('❌ Missing required Supabase environment variables:', missing.join(', '));
      console.error('Please check your .env file and ensure all Supabase variables are set.');
      throw new Error(`Missing Supabase configuration: ${missing.join(', ')}`);
    }
  }

  /**
   * Initialize storage bucket and policies
   */
  async initializeBucket() {
    try {
      // Check if bucket exists
      const { data: buckets, error: listError } = await this.supabase.storage.listBuckets();
      
      if (listError) {
        console.error('❌ Error listing buckets:', listError);
        return false;
      }

      const bucketExists = buckets.some(bucket => bucket.name === this.bucketName);
      
      if (!bucketExists) {
        console.log(`📦 Creating storage bucket: ${this.bucketName}`);
        
        const { data, error } = await this.supabase.storage.createBucket(this.bucketName, {
          public: false, // Private bucket - files accessible only with signed URLs
          allowedMimeTypes: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'text/markdown'
          ],
          fileSizeLimit: 10485760 // 10MB limit
        });

        if (error) {
          console.error('❌ Error creating bucket:', error);
          return false;
        }

        console.log('✅ Storage bucket created successfully');
      } else {
        console.log('✅ Storage bucket already exists');
      }

      return true;
    } catch (error) {
      console.error('❌ Error initializing bucket:', error);
      return false;
    }
  }

  /**
   * Upload a file to Supabase Storage
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} fileName - Original file name
   * @param {string} userId - User ID for folder organization
   * @param {string} mimeType - File MIME type
   * @returns {Promise<Object>} Upload result with storage key and URL
   */
  async uploadFile(fileBuffer, fileName, userId, mimeType) {
    try {
      console.log(`📤 Uploading file to Supabase Storage: ${fileName} (${fileBuffer.length} bytes)`);
      
      const fileExtension = fileName.split('.').pop();
      const uniqueFileName = `${uuidv4()}.${fileExtension}`;
      const filePath = `documents/${userId}/${uniqueFileName}`;

      const startTime = Date.now();
      
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(filePath, fileBuffer, {
          contentType: mimeType,
          metadata: {
            originalName: fileName,
            userId: userId,
            uploadedAt: new Date().toISOString(),
          },
          upsert: false // Don't overwrite existing files
        });

      if (error) {
        throw error;
      }

      const uploadTime = Date.now() - startTime;

      // Get public URL (this will be a signed URL for private buckets)
      const { data: { publicUrl } } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(filePath);

      console.log(`✅ Supabase Storage upload successful: ${filePath} (${uploadTime}ms)`);

      return {
        success: true,
        s3Key: filePath, // Keep same interface for compatibility
        s3Url: publicUrl,
        fileName: uniqueFileName,
        originalName: fileName,
        uploadTime,
        provider: 'supabase'
      };
    } catch (error) {
      console.error('❌ Supabase Storage upload error:', {
        fileName,
        userId,
        error: error.message,
        code: error.error || error.statusCode
      });
      
      // Provide more specific error messages
      let errorMessage = error.message;
      if (error.error === 'Duplicate') {
        errorMessage = 'File with this name already exists';
      } else if (error.statusCode === 413) {
        errorMessage = 'File size exceeds the maximum allowed limit';
      } else if (error.error === 'invalid_mime_type') {
        errorMessage = 'File type not allowed';
      }
      
      return {
        success: false,
        error: errorMessage,
        code: error.error || error.statusCode,
        provider: 'supabase'
      };
    }
  }

  /**
   * Get a signed URL for downloading a file
   * @param {string} filePath - Storage file path
   * @param {number} expiresIn - URL expiration time in seconds (default: 3600)
   * @returns {Promise<string>} Signed URL
   */
  async getSignedDownloadUrl(filePath, expiresIn = 3600) {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .createSignedUrl(filePath, expiresIn);
      
      if (error) {
        throw error;
      }

      return data.signedUrl;
    } catch (error) {
      console.error('❌ Supabase Storage signed URL error:', error);
      throw error;
    }
  }

  /**
   * Delete a file from Supabase Storage
   * @param {string} filePath - Storage file path
   * @returns {Promise<boolean>} Success status
   */
  async deleteFile(filePath) {
    try {
      console.log(`🗑️ Deleting file from Supabase Storage: ${filePath}`);
      
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([filePath]);
      
      if (error) {
        console.error('❌ Supabase Storage delete error:', error);
        return false;
      }

      console.log(`✅ File deleted successfully: ${filePath}`);
      return true;
    } catch (error) {
      console.error('❌ Supabase Storage delete error:', error);
      return false;
    }
  }

  /**
   * Get file metadata from Supabase Storage
   * @param {string} filePath - Storage file path
   * @returns {Promise<Object>} File metadata
   */
  async getFileMetadata(filePath) {
    try {
      // List files to get metadata
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .list(filePath.substring(0, filePath.lastIndexOf('/')), {
          limit: 1000,
          search: filePath.substring(filePath.lastIndexOf('/') + 1)
        });

      if (error) {
        throw error;
      }

      const file = data.find(f => f.name === filePath.substring(filePath.lastIndexOf('/') + 1));
      
      if (!file) {
        throw new Error('File not found');
      }

      return {
        contentType: file.metadata?.mimetype || 'application/octet-stream',
        contentLength: file.metadata?.size || 0,
        lastModified: new Date(file.updated_at || file.created_at),
        metadata: {
          originalName: file.metadata?.originalName || file.name,
          userId: file.metadata?.userId,
          uploadedAt: file.metadata?.uploadedAt || file.created_at,
        },
      };
    } catch (error) {
      console.error('❌ Supabase Storage metadata error:', error);
      throw error;
    }
  }

  /**
   * List files for a user
   * @param {string} userId - User ID
   * @param {number} limit - Maximum number of files to return
   * @returns {Promise<Array>} Array of file objects
   */
  async listUserFiles(userId, limit = 100) {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .list(`documents/${userId}`, {
          limit,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        throw error;
      }

      return data.map(file => ({
        name: file.name,
        path: `documents/${userId}/${file.name}`,
        size: file.metadata?.size || 0,
        createdAt: file.created_at,
        updatedAt: file.updated_at,
        metadata: file.metadata
      }));
    } catch (error) {
      console.error('❌ Error listing user files:', error);
      throw error;
    }
  }

  /**
   * Get storage usage statistics
   * @param {string} userId - User ID (optional)
   * @returns {Promise<Object>} Storage usage statistics
   */
  async getStorageUsage(userId = null) {
    try {
      const path = userId ? `documents/${userId}` : 'documents';
      
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .list(path, {
          limit: 1000
        });

      if (error) {
        throw error;
      }

      const totalSize = data.reduce((sum, file) => sum + (file.metadata?.size || 0), 0);
      const totalFiles = data.length;

      return {
        totalSize,
        totalFiles,
        formattedSize: this.formatFileSize(totalSize)
      };
    } catch (error) {
      console.error('❌ Error getting storage usage:', error);
      return {
        totalSize: 0,
        totalFiles: 0,
        formattedSize: '0 B'
      };
    }
  }

  /**
   * Format file size in human readable format
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted file size
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

module.exports = new SupabaseStorageService();
