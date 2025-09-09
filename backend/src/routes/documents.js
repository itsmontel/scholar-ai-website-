const express = require('express');
const { v4: uuidv4 } = require('uuid');

const { query } = require('../database/connection');
const { authenticateToken, requireSubscription } = require('../middleware/auth');
const { validate, validateFileUpload, schemas } = require('../middleware/validation');
const { upload, uploadToS3, getSignedUrl, deleteFromS3 } = require('../services/fileUpload');
const DocumentParser = require('../services/documentParser');

const router = express.Router();

// @route   POST /api/documents/upload
// @desc    Upload a new document
// @access  Private
router.post('/upload', authenticateToken, upload.single('document'), validateFileUpload, async (req, res) => {
  try {
    const { title, citationStyle, focusAreas } = req.body;
    const file = req.file;
    const userId = req.user.id;

    // Upload file to S3
    const uploadResult = await uploadToS3(file, userId, file.originalname);

    // Parse document content
    const parsedContent = await DocumentParser.parseDocument(
      file.buffer,
      file.mimetype,
      file.originalname
    );

    // Save document to database
    const result = await query(
      `INSERT INTO documents (id, user_id, title, original_filename, file_type, file_size, s3_key, s3_url, content_text, word_count, page_count, upload_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id, title, original_filename, file_type, file_size, word_count, page_count, upload_status, created_at`,
      [
        uuidv4(),
        userId,
        title || file.originalname,
        file.originalname,
        file.mimetype,
        file.size,
        uploadResult.s3Key,
        uploadResult.s3Url,
        parsedContent.content,
        parsedContent.wordCount,
        parsedContent.pageCount,
        'processed'
      ]
    );

    const document = result.rows[0];

    // Track usage
    await query(
      'INSERT INTO usage_tracking (user_id, document_id, action_type, credits_used) VALUES ($1, $2, $3, $4)',
      [userId, document.id, 'upload', 1]
    );

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
      message: 'Document upload failed'
    });
  }
});

// @route   GET /api/documents
// @desc    Get user's documents
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc' } = req.query;

    const offset = (page - 1) * limit;
    const validSortColumns = ['created_at', 'title', 'word_count', 'file_size'];
    const validSortOrders = ['asc', 'desc'];

    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const order = validSortOrders.includes(sortOrder.toLowerCase()) ? sortOrder.toUpperCase() : 'DESC';

    const result = await query(
      `SELECT id, title, original_filename, file_type, file_size, word_count, page_count, upload_status, created_at, updated_at
       FROM documents 
       WHERE user_id = $1 
       ORDER BY ${sortColumn} ${order}
       LIMIT $2 OFFSET $3`,
      [userId, parseInt(limit), offset]
    );

    // Get total count
    const countResult = await query(
      'SELECT COUNT(*) as total FROM documents WHERE user_id = $1',
      [userId]
    );

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        documents: result.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalDocuments: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve documents'
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

    const result = await query(
      `SELECT id, title, original_filename, file_type, file_size, word_count, page_count, 
              upload_status, s3_key, created_at, updated_at
       FROM documents 
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    const document = result.rows[0];

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
      message: 'Failed to retrieve document'
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

    const result = await query(
      'SELECT s3_key, original_filename FROM documents WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    const { s3_key, original_filename } = result.rows[0];
    const downloadUrl = await getSignedUrl(s3_key, 3600); // 1 hour expiry

    // Track download usage
    await query(
      'INSERT INTO usage_tracking (user_id, document_id, action_type, credits_used) VALUES ($1, $2, $3, $4)',
      [userId, id, 'download', 0]
    );

    res.json({
      success: true,
      data: {
        downloadUrl,
        filename: original_filename,
        expiresIn: 3600
      }
    });
  } catch (error) {
    console.error('Get download URL error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate download URL'
    });
  }
});

// @route   PUT /api/documents/:id
// @desc    Update document metadata
// @access  Private
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    const userId = req.user.id;

    if (!title || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Title is required'
      });
    }

    const result = await query(
      'UPDATE documents SET title = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3 RETURNING id, title, updated_at',
      [title.trim(), id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    res.json({
      success: true,
      message: 'Document updated successfully',
      data: {
        document: {
          id: result.rows[0].id,
          title: result.rows[0].title,
          updatedAt: result.rows[0].updated_at
        }
      }
    });
  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update document'
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

    // Get document info before deletion
    const result = await query(
      'SELECT s3_key FROM documents WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    const { s3_key } = result.rows[0];

    // Delete from database (cascade will handle related records)
    await query('DELETE FROM documents WHERE id = $1 AND user_id = $2', [id, userId]);

    // Delete from S3
    try {
      await deleteFromS3(s3_key);
    } catch (s3Error) {
      console.error('S3 deletion error:', s3Error);
      // Don't fail the request if S3 deletion fails
    }

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete document'
    });
  }
});

// @route   GET /api/documents/:id/content
// @desc    Get document content for analysis
// @access  Private
router.get('/:id/content', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await query(
      'SELECT content_text, word_count FROM documents WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    const { content_text, word_count } = result.rows[0];

    res.json({
      success: true,
      data: {
        content: content_text,
        wordCount: word_count
      }
    });
  } catch (error) {
    console.error('Get document content error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve document content'
    });
  }
});

module.exports = router;
