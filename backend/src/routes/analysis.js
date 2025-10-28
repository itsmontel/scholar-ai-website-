const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { 
  validateCreateAnalysis,
  validateSaveAnalysis,
  validateGetAnalysisHistory,
  validateAnalysisId,
  validateCitationReview
} = require('../middleware/validation');
const aiAnalysisService = require('../services/aiAnalysisService');
const documentService = require('../services/documentService');
const subscriptionService = require('../services/subscriptionService');

// @route   POST /api/analysis/citation-search
// @desc    Search for relevant citations based on research topic
// @access  Private
router.post('/citation-search', authenticateToken, async (req, res) => {
  try {
    const { researchTopic, citationStyle, numberOfCitations } = req.body;
    const userId = req.user.id;

    console.log('=== CITATION SEARCH REQUEST ===');
    console.log('Research topic:', researchTopic);
    console.log('Citation style:', citationStyle);
    console.log('Number of citations:', numberOfCitations);
    console.log('User ID:', userId);

    // Validate input
    if (!researchTopic || researchTopic.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Research topic or essay question is required'
      });
    }

    const style = citationStyle || 'APA';
    const numCitations = numberOfCitations || 10;

    // Check user's analysis limits (citation search counts as a light operation)
    const limitCheck = await subscriptionService.checkLimit(userId, 'analysesPerMonth');
    if (!limitCheck.allowed) {
      return res.status(429).json({
        success: false,
        message: 'Monthly analysis limit reached. Please upgrade your plan or wait until next month.',
        limit: limitCheck.limit,
        usage: limitCheck.usage
      });
    }

    // Perform citation search
    const searchResults = await aiAnalysisService.searchCitations(
      researchTopic,
      style,
      numCitations
    );

    console.log('Citation search completed successfully');

    // Save search to history (don't block response if this fails)
    aiAnalysisService.saveCitationSearch(userId, researchTopic, style, searchResults)
      .catch(error => console.error('Failed to save citation search to history:', error));

    res.json({
      success: true,
      message: 'Citation search completed successfully',
      data: searchResults
    });

  } catch (error) {
    console.error('Citation search error:', error);
    res.status(500).json({
      success: false,
      message: 'Citation search failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/analysis/citation-history
// @desc    Get user's citation search history
// @access  Private
router.get('/citation-history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;

    console.log('=== CITATION HISTORY REQUEST ===');
    console.log('User ID:', userId);
    console.log('Limit:', limit);

    const citationHistory = await aiAnalysisService.getCitationHistory(userId, limit);

    console.log(`Found ${citationHistory.length} citation searches`);

    res.json({
      success: true,
      data: citationHistory
    });

  } catch (error) {
    console.error('Citation history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch citation history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/analysis/citation-review
// @desc    Citation review analysis (temporary, not saved to database)
// @access  Private
router.post('/citation-review', authenticateToken, validateCitationReview, async (req, res) => {
  try {
    const { content, citationStyle } = req.body;
    const userId = req.user.id;

    console.log('=== CITATION REVIEW REQUEST ===');
    console.log('Content length:', content?.length);
    console.log('Citation style:', citationStyle);
    console.log('User ID:', userId);

    // Validate input
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Document content is required for citation review'
      });
    }

    if (!citationStyle || citationStyle === 'None') {
      return res.status(400).json({
        success: false,
        message: 'Citation style must be specified for citation review'
      });
    }

    // Check user's analysis limits (citation review counts toward monthly limit)
    const limitCheck = await subscriptionService.checkLimit(userId, 'analysesPerMonth');
    if (!limitCheck.allowed) {
      return res.status(429).json({
        success: false,
        message: 'Monthly analysis limit reached. Please upgrade your plan or wait until next month.',
        limit: limitCheck.limit,
        usage: limitCheck.usage
      });
    }

    // Perform citation review analysis
    const analysisResult = await aiAnalysisService.analyzeCitationReview(
      content,
      citationStyle
    );

    console.log('Citation review completed successfully');

    // Return analysis result (not saved to database)
    res.json({
      success: true,
      message: 'Citation review completed successfully',
      data: {
        analysisType: 'citation_review',
        result: analysisResult.result,
        annotations: analysisResult.annotations,
        citationStyle: analysisResult.citationStyle,
        model: analysisResult.model,
        timestamp: analysisResult.timestamp,
        temporary: true // Indicates this is not saved
      }
    });

  } catch (error) {
    console.error('Citation review error:', error);
    res.status(500).json({
      success: false,
      message: 'Citation review failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/analysis/simple-analyze
// @desc    Simple analysis endpoint (bypasses external dependencies)
// @access  Private
router.post('/simple-analyze', authenticateToken, async (req, res) => {
  try {
    const { documentId, content, analysisType, citationStyle } = req.body;
    const userId = req.user.id;

    console.log('=== SIMPLE ANALYSIS REQUEST ===');
    console.log('Received documentId:', documentId);
    console.log('Received content length:', content?.length);
    console.log('User ID:', userId);

    let analysisContent = '';
    let analysisDocumentId = documentId;

    if (content && !documentId) {
      analysisContent = content;
      analysisDocumentId = null;
    } else if (documentId) {
      // Get document content from database
      try {
        const document = await documentService.getDocumentById(documentId, userId);
        if (!document) {
          return res.status(404).json({
            success: false,
            message: 'Document not found'
          });
        }
        analysisContent = document.content_text || '';
      } catch (error) {
        console.error('Error fetching document:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch document content'
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Either documentId or content must be provided'
      });
    }

    // Perform actual AI analysis
    try {
      const analysisResult = await aiAnalysisService.analyzeDocument(
        analysisDocumentId,
        analysisContent,
        analysisType,
        userId,
        citationStyle,
        focusAreas
      );

      console.log('✅ AI analysis completed');

      res.status(200).json({
        success: true,
        message: 'Document analyzed successfully',
        data: analysisResult
      });
    } catch (error) {
      console.error('AI analysis failed:', error);
      res.status(500).json({
        success: false,
        message: 'Analysis failed',
        error: error.message
      });
    }

  } catch (error) {
    console.error('SIMPLE Analysis Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform analysis',
      error: error.message
    });
  }
});

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

    // Additional validation for citation review
    if (analysisType === 'citation_review') {
      if (!citationStyle || citationStyle === 'None') {
        return res.status(400).json({
          success: false,
          message: 'Citation style is required for citation review. Please select APA, MLA, Chicago, Harvard, IEEE, or Vancouver.'
        });
      }
    }

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

    // Get user's plan limits and check analysis limits with timeout
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
    
    // Check monthly analysis limit for free users
    if (planLimits.analysesPerMonth !== -1) {
      try {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Analysis check timeout')), 3000);
        });
        
        const analysisCheckPromise = subscriptionService.checkLimit(userId, 'analysesPerMonth');
        const analysisCheck = await Promise.race([analysisCheckPromise, timeoutPromise]);
        
        if (!analysisCheck.allowed) {
          return res.status(403).json({
            success: false,
            message: `Monthly analysis limit exceeded. You have used ${analysisCheck.usage}/${analysisCheck.limit} analyses this month.`,
            usage: {
              limit: analysisCheck.limit,
              used: analysisCheck.usage,
              remaining: analysisCheck.remaining
            }
          });
        }
      } catch (error) {
        console.error('Error checking analysis limits, allowing analysis:', error);
        // Allow analysis to proceed if limit check fails
      }
    }

    // Store original content for full analysis, but note the limitation for display
    const originalContent = analysisContent;
    const isContentLimited = planLimits.maxAnalysisPercentage < 100;
    
    if (isContentLimited) {
      console.log(`Content will be analyzed in full but display limited to ${planLimits.maxAnalysisPercentage}% for ${planLimits.name} user`);
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
        originalContent, // Save the full content, not the limited one
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
      data: {
        ...analysisResult,
        isContentLimited: isContentLimited,
        maxAnalysisPercentage: planLimits.maxAnalysisPercentage
      }
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

    // Separate analyses by type and get the most recent of each
    const comprehensiveAnalyses = data?.filter(analysis => 
      analysis.analysis_type === 'comprehensive' || analysis.analysis_type === 'general'
    ) || [];
    
    const citationAnalyses = data?.filter(analysis => 
      analysis.analysis_type === 'citation_review'
    ) || [];

    // Get the most recent of each type
    const latestComprehensive = comprehensiveAnalyses.length > 0 ? comprehensiveAnalyses[0] : null;
    const latestCitation = citationAnalyses.length > 0 ? citationAnalyses[0] : null;

    res.json({
      success: true,
      data: {
        all: data || [],
        comprehensive: latestComprehensive,
        citation: latestCitation,
        hasComprehensive: !!latestComprehensive,
        hasCitation: !!latestCitation
      }
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