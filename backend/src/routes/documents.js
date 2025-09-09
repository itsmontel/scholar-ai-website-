const express = require('express');
const multer = require('multer');
const { authenticateToken } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const s3Service = process.env.NODE_ENV === 'production' 
  ? require('../services/s3Service')
  : require('../services/mockS3Service');
const documentParser = require('../services/documentParser');
const documentService = require('../services/documentService');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check if file type is supported
    if (documentParser.isSupportedFileType(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Please upload PDF, DOCX, DOC, or TXT files.'), false);
    }
  },
});

// @route   POST /api/documents/upload
// @desc    Upload a new document
// @access  Private
router.post('/upload', authenticateToken, upload.single('document'), async (req, res) => {
  try {
    const { title, citationStyle, focusAreas } = req.body;
    const file = req.file;
    const userId = req.user.id;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Validate file size
    const maxSize = documentParser.getMaxFileSize(file.mimetype);
    if (file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: `File size exceeds limit. Maximum size for ${file.mimetype} is ${Math.round(maxSize / 1024 / 1024)}MB`
      });
    }

    console.log(`📄 Processing document upload: ${file.originalname} (${file.size} bytes)`);

    // Parse document content
    const parsedContent = await documentParser.parseDocument(
      file.buffer,
      file.mimetype,
      file.originalname
    );

    console.log(`✅ Document parsed: ${parsedContent.wordCount} words, ${parsedContent.pageCount} pages`);

    // Upload file to S3
    const uploadResult = await s3Service.uploadFile(
      file.buffer,
      file.originalname,
      userId,
      file.mimetype
    );

    if (!uploadResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to upload file to storage',
        error: uploadResult.error
      });
    }

    console.log(`☁️ File uploaded to S3: ${uploadResult.s3Key}`);

    // Save document to database
    const documentData = {
      userId,
      title: title || file.originalname,
      originalFilename: file.originalname,
      fileType: parsedContent.fileType,
      fileSize: file.size,
      s3Key: uploadResult.s3Key,
      s3Url: uploadResult.s3Url,
      contentText: parsedContent.content,
      wordCount: parsedContent.wordCount,
      pageCount: parsedContent.pageCount
    };

    const document = await documentService.createDocument(documentData);

    console.log(`💾 Document saved to database: ${document.id}`);

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: {
        document: {
          id: document.id,
          title: document.title,
          originalFilename: document.original_filename,
          fileType: document.file_type,
          fileSize: document.file_size,
          wordCount: document.word_count,
          pageCount: document.page_count,
          uploadStatus: document.upload_status,
          createdAt: document.created_at
        }
      }
    });

  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload document',
      error: error.message
    });
  }
});

// @route   GET /api/documents
// @desc    Get user's documents
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0, sortBy = 'created_at', sortOrder = 'desc' } = req.query;

    const documents = await documentService.getUserDocuments(userId, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      sortBy,
      sortOrder
    });

    res.json({
      success: true,
      data: {
        documents: documents.map(doc => ({
          id: doc.id,
          title: doc.title,
          originalFilename: doc.original_filename,
          fileType: doc.file_type,
          fileSize: doc.file_size,
          wordCount: doc.word_count,
          pageCount: doc.page_count,
          uploadStatus: doc.upload_status,
          createdAt: doc.created_at,
          updatedAt: doc.updated_at
        })),
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: documents.length
        }
      }
    });

  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve documents',
      error: error.message
    });
  }
});

// @route   GET /api/documents/:id
// @desc    Get specific document
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const document = await documentService.getDocumentById(id, userId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    res.json({
      success: true,
      data: {
        document: {
          id: document.id,
          title: document.title,
          originalFilename: document.original_filename,
          fileType: document.file_type,
          fileSize: document.file_size,
          wordCount: document.word_count,
          pageCount: document.page_count,
          uploadStatus: document.upload_status,
          createdAt: document.created_at,
          updatedAt: document.updated_at
        }
      }
    });

  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve document',
      error: error.message
    });
  }
});

// @route   GET /api/documents/:id/download
// @desc    Get download URL for document
// @access  Private
router.get('/:id/download', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const document = await documentService.getDocumentById(id, userId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    const downloadUrl = await s3Service.getSignedDownloadUrl(document.s3_key, 3600); // 1 hour expiry

    res.json({
      success: true,
      data: {
        downloadUrl,
        expiresIn: 3600,
        fileName: document.original_filename
      }
    });

  } catch (error) {
    console.error('Get download URL error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate download URL',
      error: error.message
    });
  }
});

// @route   PUT /api/documents/:id
// @desc    Update document metadata
// @access  Private
router.put('/:id', authenticateToken, validate(schemas.documentUpdate), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { title } = req.body;

    const document = await documentService.updateDocument(id, userId, { title });

    res.json({
      success: true,
      message: 'Document updated successfully',
      data: {
        document: {
          id: document.id,
          title: document.title,
          originalFilename: document.original_filename,
          fileType: document.file_type,
          fileSize: document.file_size,
          wordCount: document.word_count,
          pageCount: document.page_count,
          uploadStatus: document.upload_status,
          createdAt: document.created_at,
          updatedAt: document.updated_at
        }
      }
    });

  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update document',
      error: error.message
    });
  }
});

// @route   DELETE /api/documents/:id
// @desc    Delete document
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get document to get S3 key
    const document = await documentService.getDocumentById(id, userId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Delete from S3
    const s3Deleted = await s3Service.deleteFile(document.s3_key);

    // Delete from database
    await documentService.deleteDocument(id, userId);

    res.json({
      success: true,
      message: 'Document deleted successfully',
      data: {
        s3Deleted
      }
    });

  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete document',
      error: error.message
    });
  }
});

// @route   GET /api/documents/stats/overview
// @desc    Get document statistics
// @access  Private
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await documentService.getDocumentStats(userId);

    res.json({
      success: true,
      data: {
        stats
      }
    });

  } catch (error) {
    console.error('Get document stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve document statistics',
      error: error.message
    });
  }
});

// @route   GET /api/documents/search
// @desc    Search documents
// @access  Private
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { q: searchTerm } = req.query;

    if (!searchTerm || searchTerm.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search term must be at least 2 characters long'
      });
    }

    const documents = await documentService.searchDocuments(userId, searchTerm.trim());

    res.json({
      success: true,
      data: {
        documents: documents.map(doc => ({
          id: doc.id,
          title: doc.title,
          originalFilename: doc.original_filename,
          fileType: doc.file_type,
          fileSize: doc.file_size,
          wordCount: doc.word_count,
          pageCount: doc.page_count,
          uploadStatus: doc.upload_status,
          createdAt: doc.created_at
        })),
        searchTerm: searchTerm.trim(),
        totalResults: documents.length
      }
    });

  } catch (error) {
    console.error('Search documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search documents',
      error: error.message
    });
  }
});

module.exports = router;