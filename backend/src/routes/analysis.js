const express = require('express');
const { v4: uuidv4 } = require('uuid');

const { query } = require('../database/connection');
const { authenticateToken, requireSubscription } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const aiAnalysisService = require('../services/aiAnalysis');

const router = express.Router();

// @route   POST /api/analysis/analyze
// @desc    Analyze a document
// @access  Private
router.post('/analyze', authenticateToken, requireSubscription('basic'), validate(schemas.analysisRequest), async (req, res) => {
  try {
    const { documentId, analysisType, citationStyle, focusAreas, targetJournal, researchField } = req.body;
    const userId = req.user.id;

    // Get document content
    const docResult = await query(
      'SELECT content_text, word_count, title FROM documents WHERE id = $1 AND user_id = $2',
      [documentId, userId]
    );

    if (docResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    const { content_text, word_count, title } = docResult.rows[0];

    // Check word count limits based on subscription
    const subscriptionPlan = req.user.subscription_plan;
    const wordLimits = {
      'free': 1000,
      'basic': 5000,
      'premium': 50000
    };

    if (word_count > wordLimits[subscriptionPlan]) {
      return res.status(403).json({
        success: false,
        message: `Document exceeds word limit for ${subscriptionPlan} plan (${wordLimits[subscriptionPlan]} words max)`,
        currentWordCount: word_count,
        planLimit: wordLimits[subscriptionPlan]
      });
    }

    // Create analysis record
    const analysisId = uuidv4();
    await query(
      `INSERT INTO document_analyses (id, document_id, user_id, analysis_type, citation_style, focus_areas, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [analysisId, documentId, userId, analysisType, citationStyle, focusAreas, 'processing']
    );

    // Perform AI analysis
    const startTime = Date.now();
    const analysisResult = await aiAnalysisService.analyzeDocument(
      content_text,
      analysisType,
      { citationStyle, focusAreas, targetJournal, researchField }
    );
    const processingTime = Date.now() - startTime;

    // Update analysis record with results
    await query(
      `UPDATE document_analyses 
       SET status = $1, analysis_results = $2, ai_model_used = $3, processing_time_ms = $4, completed_at = CURRENT_TIMESTAMP
       WHERE id = $5`,
      ['completed', JSON.stringify(analysisResult), 'gpt-4-turbo-preview', processingTime, analysisId]
    );

    // Track usage
    const creditsUsed = this.calculateCreditsUsed(word_count, analysisType, subscriptionPlan);
    await query(
      'INSERT INTO usage_tracking (user_id, document_id, action_type, credits_used) VALUES ($1, $2, $3, $4)',
      [userId, documentId, 'analysis', creditsUsed]
    );

    res.json({
      success: true,
      message: 'Document analysis completed successfully',
      data: {
        analysisId,
        documentId,
        analysisType,
        results: analysisResult.results,
        processingTime,
        creditsUsed,
        timestamp: analysisResult.timestamp
      }
    });
  } catch (error) {
    console.error('Document analysis error:', error);
    
    // Update analysis status to failed if we have an analysisId
    if (req.body.documentId) {
      try {
        await query(
          'UPDATE document_analyses SET status = $1 WHERE document_id = $2 AND user_id = $3',
          ['failed', req.body.documentId, req.user.id]
        );
      } catch (updateError) {
        console.error('Failed to update analysis status:', updateError);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Document analysis failed'
    });
  }
});

// @route   GET /api/analysis/:analysisId
// @desc    Get analysis results
// @access  Private
router.get('/:analysisId', authenticateToken, async (req, res) => {
  try {
    const { analysisId } = req.params;
    const userId = req.user.id;

    const result = await query(
      `SELECT da.*, d.title as document_title, d.original_filename
       FROM document_analyses da
       JOIN documents d ON da.document_id = d.id
       WHERE da.id = $1 AND da.user_id = $2`,
      [analysisId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Analysis not found'
      });
    }

    const analysis = result.rows[0];

    res.json({
      success: true,
      data: {
        analysis: {
          id: analysis.id,
          documentId: analysis.document_id,
          documentTitle: analysis.document_title,
          originalFilename: analysis.original_filename,
          analysisType: analysis.analysis_type,
          citationStyle: analysis.citation_style,
          focusAreas: analysis.focus_areas,
          status: analysis.status,
          results: analysis.analysis_results,
          aiModelUsed: analysis.ai_model_used,
          processingTimeMs: analysis.processing_time_ms,
          createdAt: analysis.created_at,
          completedAt: analysis.completed_at
        }
      }
    });
  } catch (error) {
    console.error('Get analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve analysis'
    });
  }
});

// @route   GET /api/analysis/document/:documentId
// @desc    Get all analyses for a document
// @access  Private
router.get('/document/:documentId', authenticateToken, async (req, res) => {
  try {
    const { documentId } = req.params;
    const userId = req.user.id;

    const result = await query(
      `SELECT id, analysis_type, citation_style, focus_areas, status, 
              ai_model_used, processing_time_ms, created_at, completed_at
       FROM document_analyses 
       WHERE document_id = $1 AND user_id = $2
       ORDER BY created_at DESC`,
      [documentId, userId]
    );

    res.json({
      success: true,
      data: {
        analyses: result.rows
      }
    });
  } catch (error) {
    console.error('Get document analyses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve document analyses'
    });
  }
});

// @route   POST /api/analysis/suggestions
// @desc    Get writing suggestions for specific focus area
// @access  Private
router.post('/suggestions', authenticateToken, requireSubscription('basic'), async (req, res) => {
  try {
    const { content, focusArea } = req.body;

    if (!content || !focusArea) {
      return res.status(400).json({
        success: false,
        message: 'Content and focus area are required'
      });
    }

    const suggestions = await aiAnalysisService.generateWritingSuggestions(content, focusArea);

    res.json({
      success: true,
      data: {
        focusArea,
        suggestions: suggestions.suggestions,
        timestamp: suggestions.timestamp
      }
    });
  } catch (error) {
    console.error('Writing suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate writing suggestions'
    });
  }
});

// @route   POST /api/analysis/citations/check
// @desc    Check citation formatting
// @access  Private
router.post('/citations/check', authenticateToken, requireSubscription('basic'), async (req, res) => {
  try {
    const { citations, citationStyle } = req.body;

    if (!citations || !Array.isArray(citations) || !citationStyle) {
      return res.status(400).json({
        success: false,
        message: 'Citations array and citation style are required'
      });
    }

    const citationCheck = await aiAnalysisService.checkCitationFormat(citations, citationStyle);

    res.json({
      success: true,
      data: {
        citationStyle,
        analysis: citationCheck.analysis,
        timestamp: citationCheck.timestamp
      }
    });
  } catch (error) {
    console.error('Citation check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check citations'
    });
  }
});

// @route   POST /api/analysis/summarize
// @desc    Summarize document content
// @access  Private
router.post('/summarize', authenticateToken, requireSubscription('basic'), async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }

    const summary = await aiAnalysisService.summarizeDocument(content);

    res.json({
      success: true,
      data: {
        summary: summary.summary,
        timestamp: summary.timestamp
      }
    });
  } catch (error) {
    console.error('Document summarization error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to summarize document'
    });
  }
});

// @route   POST /api/analysis/peer-review
// @desc    Perform peer review analysis
// @access  Private
router.post('/peer-review', authenticateToken, requireSubscription('premium'), async (req, res) => {
  try {
    const { content, targetJournal, researchField } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }

    const peerReview = await aiAnalysisService.performPeerReviewAnalysis(content, targetJournal, researchField);

    res.json({
      success: true,
      data: {
        review: peerReview.review,
        targetJournal: peerReview.targetJournal,
        researchField: peerReview.researchField,
        timestamp: peerReview.timestamp
      }
    });
  } catch (error) {
    console.error('Peer review analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform peer review analysis'
    });
  }
});


// Helper function to calculate credits used
function calculateCreditsUsed(wordCount, analysisType, subscriptionPlan) {
  const baseCredits = {
    'general': 1,
    'citation': 1,
    'grammar': 1,
    'plagiarism': 2,
    'comprehensive': 3
  };

  const wordMultiplier = Math.ceil(wordCount / 1000);
  const baseCredit = baseCredits[analysisType] || 1;
  
  // Free users get limited credits
  if (subscriptionPlan === 'free') {
    return Math.min(baseCredit * wordMultiplier, 5);
  }
  
  return baseCredit * wordMultiplier;
}

module.exports = router;
