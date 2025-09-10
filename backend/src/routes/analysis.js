const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const Joi = require('joi');
const aiAnalysisService = require('../services/aiAnalysisService');
const documentService = require('../services/documentService');

// Validation schemas
const analyzeDocumentSchema = Joi.object({
  documentId: Joi.string().uuid().required(),
  analysisType: Joi.string().valid('general', 'citation', 'grammar', 'plagiarism', 'comprehensive').required()
});

const getAnalysisSchema = Joi.object({
  analysisId: Joi.string().uuid().required()
});

/**
 * @route POST /api/analysis/analyze
 * @desc Analyze a document with AI
 * @access Private
 */
router.post('/analyze', authenticateToken, validate(analyzeDocumentSchema), async (req, res) => {
  try {
    const { documentId, analysisType } = req.body;
    const userId = req.user.id;

    // Get the document and verify ownership
    const document = await documentService.getDocumentById(documentId, userId);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found or access denied'
      });
    }

    // Get document content
    const content = document.content_text;
    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Document content not available for analysis'
      });
    }

    // Perform AI analysis
    const analysisResult = await aiAnalysisService.analyzeDocument(
      documentId,
      content,
      analysisType,
      userId
    );

    res.json({
      success: true,
      message: 'Document analyzed successfully',
      data: analysisResult
    });

  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Analysis failed',
      error: error.message
    });
  }
});

/**
 * @route GET /api/analysis/history
 * @desc Get user's analysis history
 * @access Private
 */
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;

    const analysisHistory = await aiAnalysisService.getAnalysisHistory(userId, limit);

    res.json({
      success: true,
      data: analysisHistory
    });

  } catch (error) {
    console.error('Analysis history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analysis history',
      error: error.message
    });
  }
});

/**
 * @route GET /api/analysis/types
 * @desc Get available analysis types
 * @access Private
 */
router.get('/types', authenticateToken, async (req, res) => {
  try {
    const analysisTypes = aiAnalysisService.getAnalysisTypes();

    res.json({
      success: true,
      data: analysisTypes
    });

  } catch (error) {
    console.error('Get analysis types error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analysis types',
      error: error.message
    });
  }
});

/**
 * @route GET /api/analysis/:analysisId
 * @desc Get specific analysis by ID
 * @access Private
 */
router.get('/:analysisId', authenticateToken, validate(getAnalysisSchema, 'params'), async (req, res) => {
  try {
    const { analysisId } = req.params;
    const userId = req.user.id;

    const analysis = await aiAnalysisService.getAnalysisById(analysisId, userId);

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Analysis not found or access denied'
      });
    }

    res.json({
      success: true,
      data: analysis
    });

  } catch (error) {
    console.error('Get analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analysis',
      error: error.message
    });
  }
});

/**
 * @route GET /api/analysis/document/:documentId
 * @desc Get all analyses for a specific document
 * @access Private
 */
router.get('/document/:documentId', authenticateToken, async (req, res) => {
  try {
    const { documentId } = req.params;
    const userId = req.user.id;

    // Verify document ownership
    const document = await documentService.getDocumentById(documentId, userId);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found or access denied'
      });
    }

    // Get analyses for this document
    const { getSupabaseClient } = require('../services/databaseService');
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('document_analyses')
      .select('*')
      .eq('document_id', documentId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: data || []
    });

  } catch (error) {
    console.error('Get document analyses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch document analyses',
      error: error.message
    });
  }
});

module.exports = router;