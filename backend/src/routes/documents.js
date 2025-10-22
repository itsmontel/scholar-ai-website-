const express = require('express');
const multer = require('multer');
const path = require('path');
const { authenticateToken } = require('../middleware/auth');
const { 
  validateUploadDocument,
  validateUpdateDocument,
  validateGetDocuments,
  validateDocumentId
} = require('../middleware/validation');
// Storage service selection based on environment
const getStorageService = () => {
  if (process.env.USE_SUPABASE_STORAGE === 'true') {
    return require('../services/supabaseStorage');
  } else if (process.env.NODE_ENV === 'production') {
    return require('../services/s3Service');
  } else {
    return require('../services/mockS3Service');
  }
};

const storageService = getStorageService();
const documentParser = require('../services/documentParser');
const documentService = require('../services/documentService');
const subscriptionService = require('../services/subscriptionService');

const router = express.Router();

// Enhanced file validation function
const validateFile = (req, file, cb) => {
  // Check MIME type
  if (!documentParser.isSupportedFileType(file.mimetype)) {
    return cb(new Error('Unsupported file type. Please upload PDF, DOCX, DOC, or TXT files.'), false);
  }
  
  // Validate file extension matches MIME type
  const allowedExtensions = {
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'text/plain': ['.txt']
  };
  
  const fileExtension = path.extname(file.originalname).toLowerCase();
  const expectedExtensions = allowedExtensions[file.mimetype];
  
  if (!expectedExtensions || !expectedExtensions.includes(fileExtension)) {
    return cb(new Error('File extension does not match content type'), false);
  }
  
  // Validate filename (prevent path traversal)
  const sanitizedName = path.basename(file.originalname);
  if (sanitizedName !== file.originalname || sanitizedName.includes('..')) {
    return cb(new Error('Invalid filename'), false);
  }
  
  // Check for suspicious file patterns
  const suspiciousPatterns = [
    /\.exe$/i, /\.bat$/i, /\.cmd$/i, /\.scr$/i, /\.pif$/i,
    /\.com$/i, /\.jar$/i, /\.js$/i, /\.vbs$/i, /\.php$/i
  ];
  
  if (suspiciousPatterns.some(pattern => pattern.test(file.originalname))) {
    return cb(new Error('Potentially dangerous file type'), false);
  }
  
  cb(null, true);
};

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 1, // Only allow one file at a time
    fields: 10, // Limit number of fields
    fieldNameSize: 100, // Limit field name size
    fieldSize: 1024 * 1024 // 1MB limit for field values
  },
  fileFilter: validateFile,
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

    console.log(`📄 Upload: ${file.originalname} (${file.size} bytes) for user ${userId}`);

    // Get user's plan limits
    let planLimits;
    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Plan limits check timeout')), 5000);
      });
      const planLimitsPromise = subscriptionService.getPlanLimits(userId);
      planLimits = await Promise.race([planLimitsPromise, timeoutPromise]);
    } catch (error) {
      console.error('Error getting plan limits, using free plan defaults:', error);
      planLimits = subscriptionService.PLAN_LIMITS.free;
    }

    // Check monthly upload limit
    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Upload limit check timeout')), 5000);
      });
      const uploadLimitPromise = subscriptionService.checkLimit(userId, 'documentsPerMonth');
      const uploadLimitCheck = await Promise.race([uploadLimitPromise, timeoutPromise]);
      
      if (!uploadLimitCheck.allowed) {
        return res.status(429).json({
          success: false,
          message: uploadLimitCheck.message || 'Monthly upload limit exceeded',
          limit: planLimits.documentsPerMonth,
          used: uploadLimitCheck.used || 0
        });
      }
    } catch (error) {
      console.error('Error checking upload limits, allowing upload:', error);
    }

    // Check file size against plan limits
    if (file.size > planLimits.maxDocumentSize) {
      return res.status(413).json({
        success: false,
        message: `File size exceeds ${planLimits.name} plan limit of ${(planLimits.maxDocumentSize / 1024 / 1024).toFixed(1)}MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`,
        maxFileSize: planLimits.maxDocumentSize,
        currentFileSize: file.size,
        plan: planLimits.name
      });
    }

    // Parse document content
    let parsedContent;
    try {
      console.log(`🔍 Parsing document: ${file.originalname} (${file.mimetype})`);
      const parseTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Document parsing timeout')), 15000);
      });
      const parsePromise = documentParser.parseDocument(file.buffer, file.mimetype, file.originalname);
      parsedContent = await Promise.race([parsePromise, parseTimeout]);
      
      console.log(`📝 Parsed content length: ${parsedContent.content ? parsedContent.content.length : 0} characters`);
      console.log(`📊 Word count: ${parsedContent.wordCount}, Page count: ${parsedContent.pageCount}`);
      
      if (!parsedContent.content || parsedContent.content.trim().length === 0) {
        console.warn('⚠️ Warning: Parsed content is empty or null');
      }
    } catch (error) {
      console.error('Document parsing failed:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to parse document content',
        error: error.message
      });
    }

    // Upload file to S3
    let uploadResult;
    try {
      const uploadTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Storage upload timeout')), 10000);
      });
      const uploadPromise = storageService.uploadFile(file.buffer, file.originalname, userId, file.mimetype);
      uploadResult = await Promise.race([uploadPromise, uploadTimeout]);
    } catch (error) {
      console.error('Storage upload failed:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to upload file to storage',
        error: error.message
      });
    }

    if (!uploadResult.success) {
      return res.status(500).json({
        success: false,
        message: 'File upload failed',
        error: uploadResult.error
      });
    }

    // Save document to database
    let document;
    try {
      const dbTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Database save timeout')), 5000);
      });
      
      // Map long MIME types to shorter ones to fit database column limit (50 characters)
      const getShortFileType = (mimetype) => {
        if (mimetype.includes('pdf')) return 'application/pdf';
        if (mimetype.includes('word') || mimetype.includes('document')) return 'application/msword';
        if (mimetype.includes('text')) return 'text/plain';
        if (mimetype.includes('rtf')) return 'application/rtf';
        // Fallback: truncate if still too long
        return mimetype.length > 50 ? mimetype.substring(0, 47) + '...' : mimetype;
      };
      
      const shortFileType = getShortFileType(file.mimetype);

      const documentData = {
        userId: userId,
        title: title || file.originalname,
        originalFilename: file.originalname,
        fileType: shortFileType,
        fileSize: file.size,
        s3Key: uploadResult.s3Key,
        s3Url: uploadResult.s3Url,
        contentText: parsedContent.content,
        wordCount: parsedContent.wordCount || 0,
        pageCount: parsedContent.pageCount || 1
      };
      
      console.log(`💾 Saving to database - Content length: ${documentData.contentText ? documentData.contentText.length : 0} characters`);
      console.log(`💾 Document data:`, {
        title: documentData.title,
        fileType: documentData.fileType,
        fileSize: documentData.fileSize,
        wordCount: documentData.wordCount,
        pageCount: documentData.pageCount,
        hasContent: !!documentData.contentText
      });
      
      const dbPromise = documentService.createDocument(documentData);
      document = await Promise.race([dbPromise, dbTimeout]);
    } catch (error) {
      console.error('Database save failed:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to save document to database',
        error: error.message
      });
    }

    console.log(`✅ Upload completed: ${document.id}`);

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
          createdAt: document.created_at,
          hasAnalysis: false
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

// @route   GET /api/documents/:id/content
// @desc    Get document content
// @access  Private
router.get('/:id/content', authenticateToken, validateDocumentId, async (req, res) => {
  try {
    const documentId = req.params.id;
    const userId = req.user.id;

    const document = await documentService.getDocumentById(documentId, userId);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    res.json({
      success: true,
      data: {
        content: document.content_text || '',
        title: document.title,
        wordCount: document.word_count
      }
    });
  } catch (error) {
    console.error('Error fetching document content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch document content',
      error: error.message
    });
  }
});



// @route   GET /api/documents
// @desc    Get user's documents
// @access  Private
router.get('/', authenticateToken, validateGetDocuments, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0, sortBy = 'created_at', sortOrder = 'desc' } = req.query;

    const documents = await documentService.getUserDocuments(userId, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      sortBy,
      sortOrder
    });

    // Get analysis status for each document
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    );

    // Get analysis counts for all documents
    const documentIds = documents.map(doc => doc.id);
    const { data: analyses, error: analysisError } = await supabase
      .from('document_analyses')
      .select('document_id, status, created_at')
      .in('document_id', documentIds)
      .eq('user_id', userId)
      .eq('status', 'completed');

    if (analysisError) {
      console.error('Error fetching analysis status:', analysisError);
    }

    // Create a map of document_id to analysis status
    const analysisStatusMap = {};
    if (analyses) {
      analyses.forEach(analysis => {
        if (!analysisStatusMap[analysis.document_id] || 
            new Date(analysis.created_at) > new Date(analysisStatusMap[analysis.document_id].created_at)) {
          analysisStatusMap[analysis.document_id] = {
            hasAnalysis: true,
            lastAnalyzed: analysis.created_at
          };
        }
      });
    }

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
          updatedAt: doc.updated_at,
          analysisStatus: analysisStatusMap[doc.id] || { hasAnalysis: false, lastAnalyzed: null }
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
router.get('/:id', authenticateToken, validateDocumentId, async (req, res) => {
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
          updatedAt: document.updated_at,
          content_text: document.content_text
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

    const downloadUrl = await storageService.getSignedDownloadUrl(document.s3_key, 3600); // 1 hour expiry

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
router.put('/:id', authenticateToken, validateDocumentId, validateUpdateDocument, async (req, res) => {
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
router.delete('/:id', authenticateToken, validateDocumentId, async (req, res) => {
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

    // Delete from storage
    const storageDeleted = await storageService.deleteFile(document.s3_key);

    // Delete from database
    await documentService.deleteDocument(id, userId);

    res.json({
      success: true,
      message: 'Document deleted successfully',
      data: {
        storageDeleted
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