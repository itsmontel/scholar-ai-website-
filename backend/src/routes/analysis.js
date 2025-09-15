const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { 
  validateCreateAnalysis,
  validateSaveAnalysis,
  validateGetAnalysisHistory,
  validateAnalysisId
} = require('../middleware/validation');
const aiAnalysisService = require('../services/aiAnalysisService');
const documentService = require('../services/documentService');

// Note: Validation schemas are now imported from middleware/validation.js

/**
 * @route POST /api/analysis/analyze
 * @desc Analyze a document with AI
 * @access Private
 */
router.post('/analyze', authenticateToken, validateCreateAnalysis, async (req, res) => {
  try {
    const { documentId, content, analysisType, citationStyle } = req.body;
    const userId = req.user.id;

    console.log('=== ANALYSIS REQUEST DEBUG ===');
    console.log('Received documentId:', documentId);
    console.log('Received content length:', content?.length);
    console.log('Received analysisType:', analysisType);
    console.log('User ID:', userId);

    let analysisContent = '';
    let analysisDocumentId = documentId;

    if (content && !documentId) {
      // Text analysis from dashboard (no document ID)
      analysisContent = content;
      analysisDocumentId = null; // No document ID for text analysis
      console.log('Text analysis from dashboard - no document ID');
    } else if (documentId) {
      // Document analysis
      const document = await documentService.getDocumentById(documentId, userId);
      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found or access denied'
        });
      }

      analysisContent = document.content_text;
      if (!analysisContent) {
        return res.status(400).json({
          success: false,
          message: 'Document content not available for analysis'
        });
      }
      console.log('Document analysis - document ID:', documentId, 'title:', document.title);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Either documentId or content must be provided'
      });
    }

    // Perform AI analysis
    const analysisResult = await aiAnalysisService.analyzeDocument(
      analysisDocumentId,
      analysisContent,
      analysisType,
      userId,
      citationStyle
    );

    // Automatically save the analysis to database
    try {
      console.log('=== SAVING ANALYSIS DEBUG ===');
      console.log('analysisDocumentId:', analysisDocumentId);
      console.log('userId:', userId);
      console.log('analysisType:', analysisType);
      
      const savedAnalysis = await aiAnalysisService.saveAnalysis(
        analysisDocumentId,
        userId,
        analysisType,
        analysisResult.result,
        analysisContent,
        analysisResult.annotations,
        citationStyle
      );
      
      console.log('Analysis automatically saved to database:', savedAnalysis.id);
      
      // Add the saved analysis ID to the response
      analysisResult.savedAnalysisId = savedAnalysis.id;
    } catch (saveError) {
      console.error('Failed to auto-save analysis:', saveError);
      // Don't fail the request if save fails, just log it
    }

    res.json({
      success: true,
      message: 'Analysis completed successfully',
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
 * @route POST /api/analysis/save
 * @desc Save analysis results to history
 * @access Private
 */
router.post('/save', authenticateToken, validateSaveAnalysis, async (req, res) => {
  try {
    const { documentId, content, analysisResult, annotations, analysisType, citationStyle } = req.body;
    const userId = req.user.id;

    console.log('Saving analysis with data:', {
      documentId,
      userId,
      analysisType,
      contentLength: content?.length,
      analysisResultLength: analysisResult?.length,
      annotationsCount: annotations?.length,
      citationStyle
    });

    // Save the analysis
    const savedAnalysis = await aiAnalysisService.saveAnalysis(
      documentId,
      userId,
      analysisType,
      analysisResult,
      content,
      annotations,
      citationStyle
    );

    console.log('Analysis saved successfully:', savedAnalysis);

    res.json({
      success: true,
      message: 'Analysis saved successfully',
      data: savedAnalysis
    });

  } catch (error) {
    console.error('Save analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save analysis',
      error: error.message
    });
  }
});

/**
 * @route GET /api/analysis/history
 * @desc Get user's analysis history
 * @access Private
 */
router.get('/history', authenticateToken, validateGetAnalysisHistory, async (req, res) => {
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
router.get('/:analysisId', authenticateToken, validateAnalysisId, async (req, res) => {
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

    // If documentId is 'null' (string), treat it as null
    const actualDocumentId = documentId === 'null' ? null : documentId;

    // Only verify document ownership if documentId is not null
    if (actualDocumentId) {
      const document = await documentService.getDocumentById(actualDocumentId, userId);
      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found or access denied'
        });
      }
    }

    // Get analyses for this document
    // Use service role key to bypass RLS for analysis retrieval
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    );

    const { data, error } = await supabase
      .from('document_analyses')
      .select('*')
      .eq('document_id', actualDocumentId)
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

/**
 * @route DELETE /api/analysis/:id
 * @desc Delete a specific analysis
 * @access Private
 */
router.delete('/:id', authenticateToken, validateAnalysisId, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // First, check if the analysis exists and belongs to the user
    const { data: analysis, error: fetchError } = await supabase
      .from('document_analyses')
      .select('id, user_id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !analysis) {
      return res.status(404).json({
        success: false,
        message: 'Analysis not found or access denied'
      });
    }

    // Delete the analysis
    const { error: deleteError } = await supabase
      .from('document_analyses')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (deleteError) {
      throw deleteError;
    }

    res.json({
      success: true,
      message: 'Analysis deleted successfully'
    });

  } catch (error) {
    console.error('Delete analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete analysis',
      error: error.message
    });
  }
});

module.exports = router;