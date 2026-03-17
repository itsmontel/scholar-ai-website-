const express = require('express');
const multer = require('multer');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const documentParser = require('../services/documentParser');

const parseUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // Match the 50MB limit from regular uploads
  fileFilter: (req, file, cb) => {
    console.log('[multer] File received:', file.originalname, 'mimetype:', file.mimetype);
    if (documentParser.isSupportedFileType(file.mimetype)) {
      console.log('[multer] File type accepted');
      cb(null, true);
    } else {
      console.log('[multer] File type rejected:', file.mimetype);
      cb(new Error('Unsupported file type. Use PDF, DOCX, DOC, or TXT.'), false);
    }
  },
});

// Error handler for multer errors
const handleMulterError = (err, req, res, next) => {
  // Ensure CORS headers are set for multer errors too
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  if (err instanceof multer.MulterError) {
    console.error('[multer] MulterError:', err.code, err.message);
    return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
  } else if (err) {
    console.error('[multer] Error:', err.message);
    return res.status(400).json({ success: false, message: err.message });
  }
  next();
};
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

// Normalize plan for limit checks (starter -> pro for backward compat)
const getEffectivePlan = (req) => {
  const p = req.user?.subscription_plan || req.user?.plan || 'free';
  return p === 'starter' ? 'pro' : p;
};

// @route   GET /api/analysis/humanize-usage
// @desc    Get user's humanize word usage this period
// @access  Private
router.get('/humanize-usage', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userPlan = getEffectivePlan(req);
    const planLimits = subscriptionService.PLAN_LIMITS[userPlan] || subscriptionService.PLAN_LIMITS.free;

    const { periodStart, periodEnd, daysUntilReset } = await subscriptionService.getUsagePeriod(userId);

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    );

    const { data, error } = await supabase
      .from('humanize_usage')
      .select('words_count')
      .eq('user_id', userId)
      .gte('created_at', periodStart);

    const wordsUsed = (error || !data) ? 0 : (data || []).reduce((sum, row) => sum + (row.words_count || 0), 0);
    const wordLimit = planLimits.humanizeWordsPerMonth;

    res.json({
      success: true,
      data: {
        wordsUsed,
        wordLimit,
        wordsRemaining: Math.max(0, wordLimit - wordsUsed),
        plan: userPlan,
        periodEnd,
        daysUntilReset
      }
    });
  } catch (error) {
    console.error('Humanize usage error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch usage' });
  }
});

// @route   POST /api/analysis/parse-document
// @desc    Parse PDF, DOCX, DOC, or TXT to extract text (for Humanize/Summarize)
// @access  Private
router.post('/parse-document', authenticateToken, parseUpload.single('file'), handleMulterError, async (req, res) => {
  console.log('[parse-document] Request received');
  console.log('[parse-document] User:', req.user?.id);
  console.log('[parse-document] File:', req.file ? { name: req.file.originalname, size: req.file.size, type: req.file.mimetype } : 'No file');
  
  try {
    const file = req.file;
    if (!file) {
      console.log('[parse-document] Error: No file uploaded');
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const parsed = await documentParser.parseDocument(file.buffer, file.mimetype, file.originalname);
    if (!parsed.content || parsed.content.trim().length === 0) {
      console.log('[parse-document] Error: Could not extract text');
      return res.status(400).json({ success: false, message: 'Could not extract text from document' });
    }
    console.log('[parse-document] Success: Parsed', parsed.wordCount, 'words');
    res.json({
      success: true,
      data: { content: parsed.content, wordCount: parsed.wordCount },
    });
  } catch (error) {
    console.error('[parse-document] Error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to parse document',
    });
  }
});

// @route   POST /api/analysis/humanize
// @desc    Humanize AI-generated text using OpenAI
// @access  Private (all users, word-limited)
router.post('/humanize', authenticateToken, async (req, res) => {
  try {
    const { text, mode, intensity } = req.body;
    const userId = req.user.id;
    const userPlan = getEffectivePlan(req);
    const planLimits = subscriptionService.PLAN_LIMITS[userPlan] || subscriptionService.PLAN_LIMITS.free;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Text is required'
      });
    }

    const wordCount = text.trim().split(/\s+/).length;
    const maxWordsPerRequest = (userPlan === 'pro' || userPlan === 'premium') ? 15000 : 5000;

    if (wordCount > maxWordsPerRequest) {
      return res.status(400).json({
        success: false,
        message: `Text exceeds maximum of ${maxWordsPerRequest.toLocaleString()} words per request${userPlan === 'free' ? '. Upgrade for up to 15,000 words.' : ''}`
      });
    }

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    );

    let wordsUsedThisMonth, wordLimit;
    if (userPlan === 'pro' || userPlan === 'premium') {
      const combinedCheck = await subscriptionService.checkCombinedWordsLimit(userId, wordCount);
      if (!combinedCheck.allowed) {
        return res.status(429).json({
          success: false,
          message: `You've used all ${combinedCheck.limit.toLocaleString()} combined Humanizer & Summarizer words this period. Limit resets when your billing renews.`,
          wordsUsed: combinedCheck.usage,
          wordLimit: combinedCheck.limit,
          wordsRemaining: combinedCheck.remaining,
          upgrade: false
        });
      }
      wordsUsedThisMonth = combinedCheck.usage;
      wordLimit = combinedCheck.limit;
    } else {
      const { periodStart } = await subscriptionService.getUsagePeriod(userId);
      const { data: usageData, error: usageError } = await supabase
        .from('humanize_usage')
        .select('words_count')
        .eq('user_id', userId)
        .gte('created_at', periodStart);
      wordsUsedThisMonth = usageError ? 0 : (usageData || []).reduce((sum, row) => sum + (row.words_count || 0), 0);
      wordLimit = planLimits.humanizeWordsPerMonth;
      if (wordsUsedThisMonth + wordCount > wordLimit) {
        const remaining = Math.max(0, wordLimit - wordsUsedThisMonth);
        return res.status(429).json({
          success: false,
          message: remaining === 0
            ? `You've used all ${wordLimit.toLocaleString()} words this period. Upgrade for more.`
            : `This text is ${wordCount} words but you only have ${remaining} words remaining.`,
          wordsUsed: wordsUsedThisMonth,
          wordLimit,
          wordsRemaining: remaining,
          upgrade: true
        });
      }
    }

    const humanizedText = await aiAnalysisService.humanizeText(text, mode || 'standard', intensity || 'medium', userPlan);

    // Record usage (don't block response if this fails)
    supabase.from('humanize_usage').insert({
      user_id: userId,
      words_count: wordCount,
      mode: mode || 'standard',
      intensity: intensity || 'medium'
    }).then(() => {}).catch(err => console.error('Failed to record humanize usage:', err));

    // Record streak activity (fire and forget)

    res.json({
      success: true,
      message: 'Text humanized successfully',
      data: {
        originalText: text,
        humanizedText: humanizedText,
        mode: mode || 'standard',
        intensity: intensity || 'medium',
        wordsUsed: wordsUsedThisMonth + wordCount,
        wordLimit,
        wordsRemaining: Math.max(0, wordLimit - wordsUsedThisMonth - wordCount)
      }
    });

  } catch (error) {
    console.error('Humanize error:', error);
    res.status(500).json({
      success: false,
      message: 'Humanization failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/analysis/summarize-usage
// @desc    Get user's summarize word usage this period
// @access  Private
router.get('/summarize-usage', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userPlan = getEffectivePlan(req);
    const planLimits = subscriptionService.PLAN_LIMITS[userPlan] || subscriptionService.PLAN_LIMITS.free;

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    );

    const { periodStart, periodEnd, daysUntilReset } = await subscriptionService.getUsagePeriod(userId);

    const { data, error } = await supabase
      .from('summarize_usage')
      .select('words_count')
      .eq('user_id', userId)
      .gte('created_at', periodStart);

    const wordsUsed = (error || !data) ? 0 : (data || []).reduce((sum, row) => sum + (row.words_count || 0), 0);
    const wordLimit = planLimits.summarizeWordsPerMonth;

    res.json({
      success: true,
      data: {
        wordsUsed,
        wordLimit,
        wordsRemaining: Math.max(0, wordLimit - wordsUsed),
        plan: userPlan,
        periodEnd,
        daysUntilReset
      }
    });
  } catch (error) {
    console.error('Summarize usage error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch summarize usage' });
  }
});

// @route   POST /api/analysis/summarize
// @desc    Summarize text into key points
// @access  Private (all users with word limits)
router.post('/summarize', authenticateToken, async (req, res) => {
  try {
    const { text, style, length } = req.body;
    const userId = req.user.id;
    const userPlan = getEffectivePlan(req);
    const planLimits = subscriptionService.PLAN_LIMITS[userPlan] || subscriptionService.PLAN_LIMITS.free;

    // Enforce style/length restrictions for free users only (Pro & Premium get all styles & lengths)
    let effectiveStyle = style || 'bullet';
    let effectiveLength = length || 'medium';
    if (userPlan === 'free') {
      effectiveStyle = 'bullet';
      effectiveLength = 'medium';
    }

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Text is required'
      });
    }

    const wordCount = text.trim().split(/\s+/).length;
    const maxWordsPerRequest = (userPlan === 'pro' || userPlan === 'premium') ? 15000 : 5000;

    if (wordCount > maxWordsPerRequest) {
      return res.status(400).json({
        success: false,
        message: `Text exceeds maximum of ${maxWordsPerRequest.toLocaleString()} words per request${userPlan === 'free' ? '. Upgrade for up to 15,000 words.' : ''}`
      });
    }

    if (wordCount < 50) {
      return res.status(400).json({
        success: false,
        message: 'Text must be at least 50 words to summarize'
      });
    }

    // Check word usage (Pro/Premium: combined humanizer+summarizer pool)
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    );

    let wordsUsedThisMonth, wordLimit;
    if (userPlan === 'pro' || userPlan === 'premium') {
      const combinedCheck = await subscriptionService.checkCombinedWordsLimit(userId, wordCount);
      if (!combinedCheck.allowed) {
        return res.status(429).json({
          success: false,
          message: `You've used all ${combinedCheck.limit.toLocaleString()} combined Humanizer & Summarizer words this period. Limit resets when your billing renews.`,
          wordsUsed: combinedCheck.usage,
          wordLimit: combinedCheck.limit,
          wordsRemaining: combinedCheck.remaining,
          upgrade: false
        });
      }
      wordsUsedThisMonth = combinedCheck.usage;
      wordLimit = combinedCheck.limit;
    } else {
      const { periodStart } = await subscriptionService.getUsagePeriod(userId);
      const { data: usageData, error: usageError } = await supabase
        .from('summarize_usage')
        .select('words_count')
        .eq('user_id', userId)
        .gte('created_at', periodStart);
      wordsUsedThisMonth = usageError ? 0 : (usageData || []).reduce((sum, row) => sum + (row.words_count || 0), 0);
      wordLimit = planLimits.summarizeWordsPerMonth;
      if (wordsUsedThisMonth + wordCount > wordLimit) {
        const remaining = Math.max(0, wordLimit - wordsUsedThisMonth);
        return res.status(429).json({
          success: false,
          message: remaining === 0
            ? `You've used all ${wordLimit.toLocaleString()} summarize words this period. Upgrade for more.`
            : `This text is ${wordCount} words but you only have ${remaining} words remaining.`,
          wordsUsed: wordsUsedThisMonth,
          wordLimit,
          wordsRemaining: remaining,
          upgrade: true
        });
      }
    }

    const result = await aiAnalysisService.summarizeText(text, effectiveStyle, effectiveLength, userPlan);

    // Record usage
    supabase.from('summarize_usage').insert({
      user_id: userId,
      words_count: wordCount,
      style: effectiveStyle,
      length: effectiveLength
    }).then(() => {}).catch(err => console.error('Failed to record summarize usage:', err));

    // Record streak activity (fire and forget)

    res.json({
      success: true,
      message: 'Text summarized successfully',
      data: {
        ...result,
        wordsUsed: wordsUsedThisMonth + wordCount,
        wordLimit
      }
    });

  } catch (error) {
    console.error('Summarize error:', error);
    res.status(500).json({
      success: false,
      message: 'Summarization failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/analysis/generate-lesson
// @desc    Generate an interactive lesson from study material
// @access  Private (all users with word limits)
router.post('/generate-lesson', authenticateToken, async (req, res) => {
  try {
    const { text, style } = req.body;
    const userId = req.user.id;
    const userPlan = req.user.subscription_plan || 'free';
    const planLimits = subscriptionService.PLAN_LIMITS[userPlan] || subscriptionService.PLAN_LIMITS.free;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Text is required'
      });
    }

    const wordCount = text.trim().split(/\s+/).length;
    const maxWordsPerGen = planLimits.lessonMaxWordsPerGeneration || 5000;

    if (wordCount > maxWordsPerGen) {
      return res.status(400).json({
        success: false,
        message: `Text exceeds maximum of ${maxWordsPerGen.toLocaleString()} words per lesson. ${userPlan === 'free' ? 'Upgrade for up to 10,000 words.' : ''}`
      });
    }

    if (wordCount < 50) {
      return res.status(400).json({
        success: false,
        message: 'Text must be at least 50 words to create a lesson'
      });
    }

    // Check usage limits
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    );

    const { periodStart } = await subscriptionService.getUsagePeriod(userId);

    // Check word usage
    const { data: wordUsageData, error: wordUsageError } = await supabase
      .from('lesson_usage')
      .select('words_count')
      .eq('user_id', userId)
      .gte('created_at', periodStart);

    const wordsUsedThisMonth = wordUsageError ? 0 : (wordUsageData || []).reduce((sum, row) => sum + (row.words_count || 0), 0);
    const wordLimit = planLimits.lessonWordsPerMonth;

    // Check generation count
    const { data: genCountData, error: genCountError } = await supabase
      .from('lesson_usage')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', periodStart);

    const generationsUsed = genCountError ? 0 : (genCountData || []).length;
    const generationLimit = planLimits.lessonGenerationsPerMonth;

    // Check generation limit first
    if (generationsUsed >= generationLimit) {
      return res.status(429).json({
        success: false,
        message: `You've used all ${generationLimit} lesson generation${generationLimit === 1 ? '' : 's'} this period. ${userPlan === 'free' ? 'Upgrade for 99+ generations/month.' : 'Limit resets when your billing period renews.'}`,
        generationsUsed,
        generationLimit,
        generationsRemaining: 0,
        upgrade: userPlan === 'free'
      });
    }

    // Check word limit
    if (wordsUsedThisMonth + wordCount > wordLimit) {
      const remaining = Math.max(0, wordLimit - wordsUsedThisMonth);
      return res.status(429).json({
        success: false,
        message: remaining === 0
          ? `You've used all ${wordLimit.toLocaleString()} lesson words this period. ${userPlan === 'free' ? 'Upgrade for 999,999 words/month.' : 'Limit resets when your billing period renews.'}`
          : `This text is ${wordCount} words but you only have ${remaining} words remaining this period.`,
        wordsUsed: wordsUsedThisMonth,
        wordLimit,
        wordsRemaining: remaining,
        upgrade: userPlan === 'free'
      });
    }

    // Generate all 3 lesson styles in parallel (1 generation = 3 unique lessons)
    const allLessons = await aiAnalysisService.generateAllLessonStyles(text, userPlan);

    // Record usage in lesson_usage table (counts as 1 generation)
    supabase.from('lesson_usage').insert({
      user_id: userId,
      words_count: wordCount,
      lesson_style: 'all' // Generated all 3 styles
    }).then(() => {}).catch(err => console.error('Failed to record lesson usage:', err));

    res.json({
      success: true,
      message: 'Lessons generated successfully (3 styles)',
      data: allLessons
    });

  } catch (error) {
    console.error('Generate lesson error:', error);
    res.status(500).json({
      success: false,
      message: 'Lesson generation failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/analysis/lesson-usage
// @desc    Get user's lesson generation usage this period
// @access  Private
router.get('/lesson-usage', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userPlan = req.user.subscription_plan || 'free';
    const planLimits = subscriptionService.PLAN_LIMITS[userPlan] || subscriptionService.PLAN_LIMITS.free;

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    );

    const { periodStart, periodEnd, daysUntilReset } = await subscriptionService.getUsagePeriod(userId);

    // Get word usage
    const { data: wordData, error: wordError } = await supabase
      .from('lesson_usage')
      .select('words_count')
      .eq('user_id', userId)
      .gte('created_at', periodStart);

    // Get generation count
    const { data: genData, error: genError } = await supabase
      .from('lesson_usage')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', periodStart);

    const wordsUsed = (wordError || !wordData) ? 0 : (wordData || []).reduce((sum, row) => sum + (row.words_count || 0), 0);
    const generationsUsed = (genError || !genData) ? 0 : (genData || []).length;
    const wordLimit = planLimits.lessonWordsPerMonth;
    const generationLimit = planLimits.lessonGenerationsPerMonth;

    res.json({
      success: true,
      data: {
        wordsUsed,
        wordLimit,
        wordsRemaining: Math.max(0, wordLimit - wordsUsed),
        generationsUsed,
        generationLimit,
        generationsRemaining: Math.max(0, generationLimit - generationsUsed),
        plan: userPlan,
        periodEnd,
        daysUntilReset
      }
    });
  } catch (error) {
    console.error('Lesson usage error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch lesson usage' });
  }
});

// @route   POST /api/analysis/save-lesson
// @desc    Save a generated lesson to history
// @access  Private
router.post('/save-lesson', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userPlan = req.user.subscription_plan || req.user.plan || 'free';
    const { lesson, sourceText } = req.body;

    if (!lesson || !lesson.slides || lesson.slides.length === 0) {
      return res.status(400).json({ success: false, message: 'Lesson data is required' });
    }

    const saved = await aiAnalysisService.saveLesson(userId, lesson, sourceText, userPlan);

    if (!saved) {
      return res.status(500).json({ success: false, message: 'Failed to save lesson' });
    }

    res.json({ success: true, data: saved });
  } catch (error) {
    console.error('Save lesson error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to save lesson' });
  }
});

// @route   POST /api/analysis/save-flashcards
// @desc    Save a flashcard set to study tools (manual or generated)
// @access  Private
router.post('/save-flashcards', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userPlan = req.user.subscription_plan || req.user.plan || 'free';
    const { title, cards, sourceText } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Flashcard set name is required' });
    }
    if (!cards || !Array.isArray(cards) || cards.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one flashcard is required' });
    }

    const flashcards = {
      title: title.trim(),
      cards: cards.map(c => ({
        front: (c.front || '').trim(),
        back: (c.back || '').trim()
      })).filter(c => c.front || c.back)
    };

    if (flashcards.cards.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one flashcard with content is required' });
    }

    const saved = await aiAnalysisService.saveFlashcards(userId, flashcards, sourceText || '', userPlan);

    if (!saved) {
      return res.status(500).json({ success: false, message: 'Failed to save flashcards' });
    }

    res.json({ success: true, data: saved });
  } catch (error) {
    console.error('Save flashcards error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to save flashcards' });
  }
});

// @route   GET /api/analysis/lesson-history
// @desc    Get user's saved lessons
// @access  Private
router.get('/lesson-history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;

    console.log('=== LESSON HISTORY REQUEST ===');
    console.log('User ID:', userId);
    console.log('Limit:', limit);

    const lessonHistory = await aiAnalysisService.getLessonHistory(userId, limit);

    console.log(`Found ${lessonHistory.length} lessons`);

    res.json({
      success: true,
      data: lessonHistory
    });

  } catch (error) {
    console.error('Lesson history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lesson history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/analysis/lesson/:id
// @desc    Get a specific lesson by ID
// @access  Private
router.get('/lesson/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    console.log('=== GET LESSON REQUEST ===');
    console.log('Lesson ID:', id);
    console.log('User ID:', userId);

    const lesson = await aiAnalysisService.getLessonById(userId, id);

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found or has expired'
      });
    }

    res.json({
      success: true,
      data: lesson
    });

  } catch (error) {
    console.error('Get lesson error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lesson'
    });
  }
});

// @route   DELETE /api/analysis/lesson/:id
// @desc    Delete a lesson
// @access  Private
router.delete('/lesson/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const deleted = await aiAnalysisService.deleteLesson(userId, id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found or already deleted'
      });
    }

    res.json({ success: true, message: 'Lesson deleted successfully' });
  } catch (error) {
    console.error('Delete lesson error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete lesson' });
  }
});

// @route   PUT /api/analysis/lesson/:id/rename
// @desc    Rename a lesson
// @access  Private
router.put('/lesson/:id/rename', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    const userId = req.user.id;

    if (!title || title.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    const renamed = await aiAnalysisService.renameLesson(userId, id, title.trim());

    if (!renamed) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found or rename failed'
      });
    }

    res.json({ success: true, message: 'Lesson renamed successfully' });
  } catch (error) {
    console.error('Rename lesson error:', error);
    res.status(500).json({ success: false, message: 'Failed to rename lesson' });
  }
});

// @route   GET /api/analysis/quiz-usage
// @desc    Get user's quiz word usage this period
// @access  Private
router.get('/quiz-usage', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userPlan = req.user.subscription_plan || 'free';
    const planLimits = subscriptionService.PLAN_LIMITS[userPlan] || subscriptionService.PLAN_LIMITS.free;

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    );

    const { periodStart, periodEnd, daysUntilReset } = await subscriptionService.getUsagePeriod(userId);

    const { data, error } = await supabase
      .from('quiz_usage')
      .select('words_count')
      .eq('user_id', userId)
      .gte('created_at', periodStart);

    const generationsUsed = (error || !data) ? 0 : (data || []).length;
    const wordsUsed = (error || !data) ? 0 : (data || []).reduce((sum, row) => sum + (row.words_count || 0), 0);
    const wordLimit = planLimits.quizWordsPerMonth;
    const generationLimit = planLimits.quizGenerationsPerMonth;
    const maxWordsPerGeneration = planLimits.quizMaxWordsPerGeneration;

    res.json({
      success: true,
      data: {
        wordsUsed,
        wordLimit,
        wordsRemaining: Math.max(0, wordLimit - wordsUsed),
        generationsUsed,
        generationLimit,
        generationsRemaining: generationLimit === -1 ? -1 : Math.max(0, generationLimit - generationsUsed),
        maxWordsPerGeneration,
        plan: userPlan,
        periodEnd,
        daysUntilReset
      }
    });
  } catch (error) {
    console.error('Quiz usage error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch quiz usage' });
  }
});

// @route   POST /api/analysis/generate-quiz
// @desc    Generate quiz questions from text
// @access  Private (all users - free users limited to 3 generations/month with restrictions)
router.post('/generate-quiz', authenticateToken, async (req, res) => {
  try {
    const { text, quizType, difficulty, questionCount } = req.body;
    const userId = req.user.id;
    const userPlan = req.user.subscription_plan || 'free';
    const planLimits = subscriptionService.PLAN_LIMITS[userPlan] || subscriptionService.PLAN_LIMITS.free;

    // Enforce quiz type/difficulty/count restrictions based on plan
    // Free & Pro: mixed type, medium difficulty, 10 questions
    // Premium: full customization
    let effectiveType = quizType || 'mixed';
    let effectiveDifficulty = difficulty || 'medium';
    let effectiveCount = questionCount || 10;
    
    if (userPlan === 'free') {
      effectiveType = 'mixed';
      effectiveDifficulty = 'medium';
      effectiveCount = 10;
    } else if (userPlan === 'pro') {
      effectiveType = 'mixed';
      effectiveDifficulty = 'medium';
    }

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Text is required'
      });
    }

    const wordCount = text.trim().split(/\s+/).length;
    const maxWordsPerGeneration = planLimits.quizMaxWordsPerGeneration || 15000;

    if (wordCount > maxWordsPerGeneration) {
      return res.status(400).json({
        success: false,
        message: userPlan === 'free' 
          ? `Free plan allows up to ${maxWordsPerGeneration.toLocaleString()} words per quiz. Upgrade for up to 15,000 words.`
          : `Text exceeds maximum of ${maxWordsPerGeneration.toLocaleString()} words per request`
      });
    }

    if (wordCount < 100) {
      return res.status(400).json({
        success: false,
        message: 'Text must be at least 100 words to generate meaningful questions'
      });
    }

    // Check usage limits
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    );

    const { periodStart } = await subscriptionService.getUsagePeriod(userId);

    const { data: usageData, error: usageError } = await supabase
      .from('quiz_usage')
      .select('words_count')
      .eq('user_id', userId)
      .gte('created_at', periodStart);

    const generationsThisMonth = usageError ? 0 : (usageData || []).length;
    const wordsUsedThisMonth = usageError ? 0 : (usageData || []).reduce((sum, row) => sum + (row.words_count || 0), 0);
    const wordLimit = planLimits.quizWordsPerMonth;
    const generationLimit = planLimits.quizGenerationsPerMonth;

    // Check generation limit for free users
    if (generationLimit !== -1 && generationsThisMonth >= generationLimit) {
      return res.status(429).json({
        success: false,
        message: `You've used all ${generationLimit} quiz generations this period. Upgrade for unlimited quizzes.`,
        generationsUsed: generationsThisMonth,
        generationLimit,
        upgrade: true
      });
    }

    // Check word limit
    if (wordsUsedThisMonth + wordCount > wordLimit) {
      const remaining = Math.max(0, wordLimit - wordsUsedThisMonth);
      return res.status(429).json({
        success: false,
        message: remaining === 0
          ? `You've used all ${wordLimit.toLocaleString()} quiz words this period. ${userPlan === 'free' ? 'Upgrade for 999,999 words/month.' : 'Limit resets when your billing period renews.'}`
          : `This text is ${wordCount} words but you only have ${remaining} quiz words remaining this period.${userPlan === 'free' ? ' Upgrade for 999,999 words/month.' : ''}`,
        wordsUsed: wordsUsedThisMonth,
        wordLimit,
        wordsRemaining: remaining,
        upgrade: userPlan === 'free'
      });
    }

    const displayCount = Math.min(Math.max(effectiveCount, 5), 25);
    // Generate 3x question bank so each retake shows a different random subset
    const bankCount = Math.min(displayCount * 3, 60);
    const result = await aiAnalysisService.generateQuiz(
      text,
      effectiveType,
      effectiveDifficulty,
      bankCount,
      displayCount,
      userPlan
    );

    // Record usage
    supabase.from('quiz_usage').insert({
      user_id: userId,
      words_count: wordCount,
      quiz_type: effectiveType,
      difficulty: effectiveDifficulty
    }).then(() => {}).catch(err => console.error('Failed to record quiz usage:', err));

    // Save quiz to history (pass userPlan for expiration logic)
    aiAnalysisService.saveQuiz(userId, result, text, userPlan)
      .then(savedQuiz => {
        if (savedQuiz) {
          console.log('Quiz saved to history:', savedQuiz.id);
        }
      })
      .catch(error => console.error('Failed to save quiz to history:', error));

    // Record streak activity (fire and forget)

    res.json({
      success: true,
      message: 'Quiz generated successfully',
      data: result
    });

  } catch (error) {
    console.error('Quiz generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Quiz generation failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/analysis/generate-flashcards
// @desc    Generate flashcards from text
// @access  Private
router.post('/generate-flashcards', authenticateToken, async (req, res) => {
  try {
    const { text, cardCount } = req.body;
    const userId = req.user.id;
    const userPlan = req.user.subscription_plan || 'free';
    const planLimits = subscriptionService.PLAN_LIMITS[userPlan] || subscriptionService.PLAN_LIMITS.free;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Text is required' });
    }

    const wordCount = text.trim().split(/\s+/).length;
    const maxWordsPerGeneration = planLimits.quizMaxWordsPerGeneration || 15000;

    if (wordCount > maxWordsPerGeneration) {
      return res.status(400).json({
        success: false,
        message: userPlan === 'free'
          ? `Free plan allows up to ${maxWordsPerGeneration.toLocaleString()} words. Upgrade for up to 15,000 words.`
          : `Text exceeds maximum of ${maxWordsPerGeneration.toLocaleString()} words per request`
      });
    }

    if (wordCount < 50) {
      return res.status(400).json({
        success: false,
        message: 'Text must be at least 50 words to generate flashcards'
      });
    }

    // Check usage limits (shares quiz usage pool)
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    );

    const { periodStart } = await subscriptionService.getUsagePeriod(userId);

    const { data: usageData, error: usageError } = await supabase
      .from('quiz_usage')
      .select('words_count')
      .eq('user_id', userId)
      .gte('created_at', periodStart);

    const generationsThisMonth = usageError ? 0 : (usageData || []).length;
    const wordsUsedThisMonth = usageError ? 0 : (usageData || []).reduce((sum, row) => sum + (row.words_count || 0), 0);
    const generationLimit = planLimits.quizGenerationsPerMonth;
    const wordLimit = planLimits.quizWordsPerMonth;

    if (generationLimit !== -1 && generationsThisMonth >= generationLimit) {
      return res.status(429).json({
        success: false,
        message: `You've used all ${generationLimit} study tool generations this period. Upgrade for unlimited access.`,
        upgrade: true
      });
    }

    if (wordsUsedThisMonth + wordCount > wordLimit) {
      return res.status(429).json({
        success: false,
        message: `Word limit reached for this period.${userPlan === 'free' ? ' Upgrade for 999,999 words/month.' : ''}`,
        upgrade: userPlan === 'free'
      });
    }

    let effectiveCount = cardCount || 15;
    if (userPlan === 'free') effectiveCount = Math.min(effectiveCount, 15);
    effectiveCount = Math.min(Math.max(effectiveCount, 5), 30);

    const result = await aiAnalysisService.generateFlashcards(text, effectiveCount, userPlan);

    supabase.from('quiz_usage').insert({
      user_id: userId,
      words_count: wordCount,
      quiz_type: 'flashcards',
      difficulty: 'medium'
    }).then(() => {}).catch(err => console.error('Failed to record flashcard usage:', err));

    // Save flashcards to history (pass userPlan for expiration logic)
    aiAnalysisService.saveFlashcards(userId, result, text, userPlan)
      .then(savedFlashcards => {
        if (savedFlashcards) {
          console.log('Flashcards saved to history:', savedFlashcards.id);
        }
      })
      .catch(error => console.error('Failed to save flashcards to history:', error));

    // Record streak activity (fire and forget)

    res.json({ success: true, message: 'Flashcards generated successfully', data: result });
  } catch (error) {
    console.error('Flashcard generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Flashcard generation failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/analysis/generate-crossword
// @desc    Generate crossword puzzle from text
// @access  Private
router.post('/generate-crossword', authenticateToken, async (req, res) => {
  try {
    const { text, wordCount: requestedWordCount } = req.body;
    const userId = req.user.id;
    const userPlan = req.user.subscription_plan || 'free';
    const planLimits = subscriptionService.PLAN_LIMITS[userPlan] || subscriptionService.PLAN_LIMITS.free;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Text is required' });
    }

    const wordCount = text.trim().split(/\s+/).length;
    const maxWordsPerGeneration = planLimits.quizMaxWordsPerGeneration || 15000;

    if (wordCount > maxWordsPerGeneration) {
      return res.status(400).json({
        success: false,
        message: userPlan === 'free'
          ? `Free plan allows up to ${maxWordsPerGeneration.toLocaleString()} words. Upgrade for up to 15,000 words.`
          : `Text exceeds maximum of ${maxWordsPerGeneration.toLocaleString()} words per request`
      });
    }

    if (wordCount < 50) {
      return res.status(400).json({
        success: false,
        message: 'Text must be at least 50 words to generate a crossword'
      });
    }

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    );

    const { periodStart } = await subscriptionService.getUsagePeriod(userId);

    const { data: usageData, error: usageError } = await supabase
      .from('quiz_usage')
      .select('words_count')
      .eq('user_id', userId)
      .gte('created_at', periodStart);

    const generationsThisMonth = usageError ? 0 : (usageData || []).length;
    const wordsUsedThisMonth = usageError ? 0 : (usageData || []).reduce((sum, row) => sum + (row.words_count || 0), 0);
    const generationLimit = planLimits.quizGenerationsPerMonth;
    const wordLimitMonth = planLimits.quizWordsPerMonth;

    if (generationLimit !== -1 && generationsThisMonth >= generationLimit) {
      return res.status(429).json({
        success: false,
        message: `You've used all ${generationLimit} study tool generations this period. Upgrade for unlimited access.`,
        upgrade: true
      });
    }

    if (wordsUsedThisMonth + wordCount > wordLimitMonth) {
      return res.status(429).json({
        success: false,
        message: `Word limit reached for this period.${userPlan === 'free' ? ' Upgrade for 999,999 words/month.' : ''}`,
        upgrade: userPlan === 'free'
      });
    }

    let effectiveWordCount = requestedWordCount || 10;
    if (userPlan === 'free') effectiveWordCount = Math.min(effectiveWordCount, 10);
    effectiveWordCount = Math.min(Math.max(effectiveWordCount, 6), 15);

    const result = await aiAnalysisService.generateCrossword(text, effectiveWordCount, userPlan);

    supabase.from('quiz_usage').insert({
      user_id: userId,
      words_count: wordCount,
      quiz_type: 'crossword',
      difficulty: 'medium'
    }).then(() => {}).catch(err => console.error('Failed to record crossword usage:', err));

    // Save crossword to history (pass userPlan for expiration logic)
    aiAnalysisService.saveCrossword(userId, result, text, userPlan)
      .then(savedCrossword => {
        if (savedCrossword) {
          console.log('Crossword saved to history:', savedCrossword.id);
        }
      })
      .catch(error => console.error('Failed to save crossword to history:', error));

    // Record streak activity (fire and forget)

    res.json({ success: true, message: 'Crossword generated successfully', data: result });
  } catch (error) {
    console.error('Crossword generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Crossword generation failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/analysis/citation-search
// @desc    Search for relevant citations based on research topic
// @access  Private
router.post('/citation-search', authenticateToken, async (req, res) => {
  try {
    const { researchTopic, citationStyle, numberOfCitations, minYear, yearRange } = req.body;
    const userId = req.user.id;

    console.log('=== CITATION SEARCH REQUEST ===');
    console.log('Research topic:', researchTopic);
    console.log('Citation style:', citationStyle);
    console.log('Number of citations:', numberOfCitations);
    console.log('Min year:', minYear);
    console.log('Year range:', yearRange);
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

    const userPlan = getEffectivePlan(req);
    const limitCheck = (userPlan === 'pro' || userPlan === 'premium')
      ? await subscriptionService.checkCombinedActionsLimit(userId)
      : await subscriptionService.checkLimit(userId, 'citationSearchesPerMonth');
    if (!limitCheck.allowed) {
      return res.status(429).json({
        success: false,
        message: (userPlan === 'pro' || userPlan === 'premium')
          ? `You've used all ${limitCheck.limit} combined actions (analyses, study packs & citations) this period. Limit resets when your billing renews.`
          : `Citation search limit reached. You have used ${limitCheck.usage} of ${limitCheck.limit} searches this period. Upgrade to get more.`,
        limit: limitCheck.limit,
        usage: limitCheck.usage,
        remaining: limitCheck.remaining,
        upgrade: userPlan === 'free'
      });
    }

    // Perform citation search
    const searchResults = await aiAnalysisService.searchCitations(
      researchTopic,
      style,
      numCitations,
      minYear,
      yearRange
    );

    console.log('Citation search completed successfully');

    // Save search to history (don't block response if this fails)
    // Pass userPlan to determine retention: free users get 30-day expiration, paid users get permanent storage
    aiAnalysisService.saveCitationSearch(userId, researchTopic, style, searchResults, yearRange, userPlan)
      .catch(error => console.error('Failed to save citation search to history:', error));

    // Record streak activity (fire and forget)

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
    const userPlan = getEffectivePlan(req);
    const limitCheck = (userPlan === 'pro' || userPlan === 'premium')
      ? await subscriptionService.checkCombinedActionsLimit(userId)
      : await subscriptionService.checkLimit(userId, 'analysesPerMonth');
    if (!limitCheck.allowed) {
      return res.status(429).json({
        success: false,
        message: 'Analysis limit reached for this period. Please upgrade your plan or wait until your period resets.',
        limit: limitCheck.limit,
        usage: limitCheck.usage
      });
    }

    // Perform citation review analysis
    const analysisResult = await aiAnalysisService.analyzeCitationReview(
      content,
      citationStyle
    );

    // Save citation review to database so it counts toward combined actions pool
    try {
      await aiAnalysisService.saveAnalysis(
        null, // no document
        userId,
        'citation_review',
        analysisResult.result,
        content,
        analysisResult.annotations,
        citationStyle,
        null  // no rubric alignment
      );
    } catch (saveErr) {
      console.error('Failed to record citation review usage (non-blocking):', saveErr);
      // Still return success - user gets their result; usage may not be counted for this request
    }

    console.log('Citation review completed successfully');

    res.json({
      success: true,
      message: 'Citation review completed successfully',
      data: {
        analysisType: 'citation_review',
        result: analysisResult.result,
        annotations: analysisResult.annotations,
        citationStyle: analysisResult.citationStyle,
        model: analysisResult.model,
        timestamp: analysisResult.timestamp
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
    const { documentId, content, analysisType, citationStyle, educationLevel } = req.body;
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
        educationLevel || 'college'
      );

      console.log('✅ AI analysis completed');

      // Record streak activity (fire and forget)

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
    const { documentId, content, analysisType, citationStyle, educationLevel, rubricContent } = req.body;
    const userId = req.user.id;

    if (rubricContent) {
      console.log('Rubric/requirements content provided, length:', rubricContent.length);
    }

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
      // Text analysis from dashboard (pasted content) - create document so it saves to library
      analysisContent = content;
      try {
        const title = content.trim().slice(0, 80) + (content.trim().length > 80 ? '...' : '');
        const newDoc = await documentService.createDocumentFromText(userId, content, title || 'Pasted Essay');
        analysisDocumentId = newDoc.id;
        console.log('Created document from pasted text for library - documentId:', analysisDocumentId);
      } catch (createErr) {
        console.error('Failed to create document from pasted text:', createErr);
        analysisDocumentId = null; // Fallback: analysis will still run but won't appear in library
      }
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
    
    // Check monthly limit: Pro/Premium use combined pool; free uses analysesPerMonth
    const userPlan = (await subscriptionService.getUserSubscriptionDetails(userId)).plan;
    const useCombined = userPlan === 'pro' || userPlan === 'premium';
    if (useCombined ? (planLimits.combinedActionsPerMonth != null && planLimits.combinedActionsPerMonth !== -1) : (planLimits.analysesPerMonth !== -1)) {
      try {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Analysis check timeout')), 3000);
        });
        
        const analysisCheckPromise = useCombined
          ? subscriptionService.checkCombinedActionsLimit(userId)
          : subscriptionService.checkLimit(userId, 'analysesPerMonth');
        const analysisCheck = await Promise.race([analysisCheckPromise, timeoutPromise]);
        
        if (!analysisCheck.allowed) {
          return res.status(403).json({
            success: false,
            message: useCombined
              ? `Combined action limit exceeded for this period. You have used ${analysisCheck.usage}/${analysisCheck.limit} (analyses, study packs & citations).`
              : `Analysis limit exceeded for this period. You have used ${analysisCheck.usage}/${analysisCheck.limit} analyses.`,
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
      citationStyle,
      educationLevel || 'college'
    );

    // Run rubric alignment analysis first if rubric content was provided (so we can save it)
    let rubricAlignment = null;
    if (rubricContent && rubricContent.trim().length > 0) {
      try {
        console.log('Running rubric alignment analysis...');
        rubricAlignment = await aiAnalysisService.analyzeRubricAlignment(
          analysisContent,
          rubricContent,
          userId,
          educationLevel || 'college'
        );
        console.log('Rubric alignment analysis completed successfully');
      } catch (rubricError) {
        console.error('Rubric analysis failed (non-blocking):', rubricError);
      }
    }

    // Automatically save the analysis to database (including rubric alignment when present)
    try {
      console.log('=== SAVING ANALYSIS DEBUG ===');
      console.log('analysisDocumentId:', analysisDocumentId);
      console.log('userId:', userId);
      console.log('analysisType:', analysisType);
      console.log('rubricAlignment:', rubricAlignment ? 'included' : 'none');
      
      const savedAnalysis = await aiAnalysisService.saveAnalysis(
        analysisDocumentId,
        userId,
        analysisType,
        analysisResult.result,
        originalContent, // Save the full content, not the limited one
        analysisResult.annotations,
        citationStyle,
        rubricAlignment
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
        maxAnalysisPercentage: planLimits.maxAnalysisPercentage,
        rubricAlignment: rubricAlignment
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
 * @desc Get user's analysis history (Pro/Premium only)
 * @access Private
 */
router.get('/history', authenticateToken, validateGetAnalysisHistory, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;

    const subscriptionDetails = await subscriptionService.getUserSubscriptionDetails(userId);
    const plan = (subscriptionDetails.plan || 'free').toLowerCase();
    const isPaid = plan === 'pro' || plan === 'premium';

    if (!isPaid) {
      return res.status(403).json({
        success: false,
        message: 'Analysis history is a Pro feature. Upgrade to access your saved analyses.',
        upgradeRequired: true
      });
    }

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

// =====================
// Quiz History Endpoints (must be before /:analysisId catch-all)
// =====================

// @route   POST /api/analysis/save-crater-blast
// @desc    Save a Crater Blast game to history for replay
// @access  Private
router.post('/save-crater-blast', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userPlan = req.user.subscription_plan || req.user.plan || 'free';
    const { questions, title, inputType, sourceText } = req.body;

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, message: 'Questions are required' });
    }

    const saved = await aiAnalysisService.saveCraterBlastGame(userId, {
      questions,
      title: title || sourceText?.slice(0, 80) || 'Crater Blast Game',
      inputType: inputType || 'topic',
      sourceText: sourceText || ''
    }, userPlan);

    if (!saved) {
      return res.status(500).json({ success: false, message: 'Failed to save game' });
    }

    res.json({ success: true, data: saved });
  } catch (error) {
    console.error('Save Crater Blast error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to save game' });
  }
});

// @route   GET /api/analysis/quiz-history
// @desc    Get user's saved quizzes
// @access  Private (Premium only)
router.get('/quiz-history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;

    console.log('=== QUIZ HISTORY REQUEST ===');
    console.log('User ID:', userId);
    console.log('Limit:', limit);

    // Get quizzes
    const quizHistory = await aiAnalysisService.getQuizHistory(userId, limit);

    // Get lessons and transform to match quiz format
    let lessonHistory = [];
    try {
      const lessons = await aiAnalysisService.getLessonHistory(userId, limit);
      lessonHistory = lessons.map(lesson => ({
        id: lesson.id,
        title: lesson.title,
        quiz_type: 'lesson',
        difficulty: lesson.lesson_style || 'visual',
        question_count: lesson.slide_count || 0,
        questions: lesson.slides,
        quiz_bank: lesson.quiz_bank || [],
        quiz_display_count: lesson.quiz_display_count || 6,
        source_word_count: lesson.source_word_count || 0,
        created_at: lesson.created_at,
        expires_at: lesson.expires_at,
        estimated_read_time: lesson.estimated_read_time
      }));
    } catch (lessonError) {
      console.error('Error fetching lesson history:', lessonError);
    }

    // Combine and sort by created_at
    const combinedHistory = [...quizHistory, ...lessonHistory].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ).slice(0, limit);

    console.log(`Found ${quizHistory.length} quizzes, ${lessonHistory.length} lessons`);

    res.json({
      success: true,
      data: combinedHistory
    });

  } catch (error) {
    console.error('Quiz history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/analysis/quiz/:id
// @desc    Get a specific quiz by ID
// @access  Private (Premium only)
router.get('/quiz/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    console.log('=== GET QUIZ REQUEST ===');
    console.log('Quiz ID:', id);
    console.log('User ID:', userId);

    const quiz = await aiAnalysisService.getQuizById(userId, id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found or has expired'
      });
    }

    res.json({
      success: true,
      data: quiz
    });

  } catch (error) {
    console.error('Get quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PATCH /api/analysis/quiz/:id/rename
// @desc    Rename a specific quiz/study tool
// @access  Private
router.patch('/quiz/:id/rename', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    const userId = req.user.id;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    const trimmedTitle = title.trim().substring(0, 200);
    const renamed = await aiAnalysisService.renameQuiz(userId, id, trimmedTitle);

    if (!renamed) {
      return res.status(404).json({ success: false, message: 'Study tool not found or access denied' });
    }

    res.json({ success: true, message: 'Renamed successfully', title: trimmedTitle });
  } catch (error) {
    console.error('Rename quiz error:', error);
    res.status(500).json({ success: false, message: 'Failed to rename study tool' });
  }
});

// @route   DELETE /api/analysis/quiz/:id
// @desc    Delete a specific quiz
// @access  Private
router.delete('/quiz/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    console.log('=== DELETE QUIZ REQUEST ===');
    console.log('Quiz ID:', id);
    console.log('User ID:', userId);

    const deleted = await aiAnalysisService.deleteQuiz(userId, id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found or access denied'
      });
    }

    console.log('Quiz deleted successfully');

    res.json({
      success: true,
      message: 'Quiz deleted successfully'
    });

  } catch (error) {
    console.error('Delete quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete quiz',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/analysis/cleanup-quizzes
// @desc    Clean up expired quizzes (called by cron or admin)
// @access  Private (admin or cron job)
router.post('/cleanup-quizzes', async (req, res) => {
  try {
    const cronSecret = req.headers['x-cron-secret'];
    if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const result = await aiAnalysisService.cleanupExpiredQuizzes();

    res.json({
      success: true,
      message: `Cleaned up ${result.deleted} expired quizzes`
    });

  } catch (error) {
    console.error('Cleanup quizzes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup quizzes',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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

// @route   DELETE /api/analysis/citation/:id
// @desc    Delete a specific citation search from history
// @access  Private
router.delete('/citation/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    console.log('=== DELETE CITATION REQUEST ===');
    console.log('Citation ID:', id);
    console.log('User ID:', userId);

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    );

    // First, check if the citation search exists and belongs to the user
    const { data: citationSearch, error: fetchError } = await supabase
      .from('citation_searches')
      .select('id, user_id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !citationSearch) {
      return res.status(404).json({
        success: false,
        message: 'Citation search not found or access denied'
      });
    }

    // Delete the citation search
    const { error: deleteError } = await supabase
      .from('citation_searches')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (deleteError) {
      throw deleteError;
    }

    console.log('Citation search deleted successfully');

    res.json({
      success: true,
      message: 'Citation search deleted successfully'
    });

  } catch (error) {
    console.error('Delete citation search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete citation search',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/analysis/generate-reflex-questions
// @desc    Generate questions for Lightning Reflex Quiz from a topic or notes
// @access  Private
router.post('/generate-reflex-questions', authenticateToken, async (req, res) => {
  try {
    const { inputType, content } = req.body;
    const userPlan = req.user.subscription_plan || req.user.plan || 'free';
    const planLimits = subscriptionService.PLAN_LIMITS[userPlan] || subscriptionService.PLAN_LIMITS.free;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Content is required' });
    }

    if (!['topic', 'notes'].includes(inputType)) {
      return res.status(400).json({ success: false, message: 'inputType must be "topic" or "notes"' });
    }

    if (inputType === 'topic' && content.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Topic must be at least 2 characters' });
    }

    if (inputType === 'notes') {
      const wordCount = content.trim().split(/\s+/).length;
      if (wordCount < 20) {
        return res.status(400).json({ success: false, message: 'Notes must be at least 20 words' });
      }
      const maxWords = planLimits.craterBlastMaxWordsPerGeneration || 5000;
      if (wordCount > maxWords) {
        return res.status(400).json({
          success: false,
          message: `Notes exceed maximum of ${maxWords.toLocaleString()} words. ${userPlan === 'free' ? 'Upgrade for up to 10,000 words.' : ''}`
        });
      }
    }

    const result = await aiAnalysisService.generateReflexQuestions(inputType, content, userPlan);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Generate reflex questions error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate questions'
    });
  }
});

// ==================== STUDY EVENTS (Calendar) ====================

// @route   GET /api/analysis/study-events
// @desc    Get all study events for a user
// @access  Private
router.get('/study-events', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    );

    const { data, error } = await supabase
      .from('study_events')
      .select('*')
      .eq('user_id', userId)
      .order('event_date', { ascending: true });

    if (error) throw error;

    res.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Get study events error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch study events' });
  }
});

// @route   POST /api/analysis/study-events
// @desc    Create a new study event
// @access  Private
router.post('/study-events', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, event_date, event_time, event_type, course, notes } = req.body;

    if (!title || !event_date) {
      return res.status(400).json({ success: false, message: 'Title and date are required' });
    }

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    );

    const { data, error } = await supabase
      .from('study_events')
      .insert({
        user_id: userId,
        title,
        event_date,
        event_time: event_time || null,
        event_type: event_type || 'other',
        course: course || null,
        notes: notes || null
      })
      .select()
      .single();

    if (error) {
      console.error('Create study event Supabase error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to create study event'
      });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Create study event error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create study event'
    });
  }
});

// @route   PUT /api/analysis/study-events/:id
// @desc    Update a study event
// @access  Private
router.put('/study-events/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { title, event_date, event_time, event_type, course, notes } = req.body;

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    );

    const { data, error } = await supabase
      .from('study_events')
      .update({
        title,
        event_date,
        event_time,
        event_type,
        course,
        notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Update study event error:', error);
    res.status(500).json({ success: false, message: 'Failed to update study event' });
  }
});

// @route   DELETE /api/analysis/study-events/:id
// @desc    Delete a study event
// @access  Private
router.delete('/study-events/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    );

    const { error } = await supabase
      .from('study_events')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete study event error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete study event' });
  }
});

// @route   POST /api/analysis/generate-study-pack
// @desc    Generate a unified study pack (quiz + flashcards + crossword + lesson + crater blast)
// @access  Private
router.post('/generate-study-pack', authenticateToken, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Text content is required' });
    }

    const wordCount = text.trim().split(/\s+/).length;
    if (wordCount < 50) {
      return res.status(400).json({ success: false, message: 'Please provide at least 50 words for a study pack.' });
    }

    const userId = req.user.id;
    const userPlan = getEffectivePlan(req);
    const planLimits = subscriptionService.PLAN_LIMITS[userPlan] || subscriptionService.PLAN_LIMITS.free;

    const maxWords = planLimits.studyPackMaxWordsPerGeneration || planLimits.quizMaxWordsPerGeneration || 5000;
    if (wordCount > maxWords) {
      return res.status(400).json({
        success: false,
        message: `Text exceeds the ${maxWords.toLocaleString()} word limit for your plan. Please shorten your text.`
      });
    }

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    );

    const { periodStart } = await subscriptionService.getUsagePeriod(userId);

    let generationsUsed, generationLimit;
    // Pro/Premium: use combined actions pool; Free: use studyPackGenerationsPerMonth
    if (userPlan === 'pro' || userPlan === 'premium') {
      const combinedCheck = await subscriptionService.checkCombinedActionsLimit(userId);
      generationsUsed = combinedCheck.usage;
      generationLimit = combinedCheck.limit;
      if (!combinedCheck.allowed) {
        return res.status(429).json({
          success: false,
          message: `You've used all ${combinedCheck.limit} combined actions (analyses, study packs & citations) this period. Limit resets when your billing period renews.`,
          generationsUsed: combinedCheck.usage,
          generationLimit: combinedCheck.limit,
          generationsRemaining: 0,
          upgrade: false
        });
      }
    } else {
      const { data: usageData, error: usageError } = await supabase
        .from('quiz_usage')
        .select('id')
        .eq('user_id', userId)
        .eq('quiz_type', 'study_pack')
        .gte('created_at', periodStart);

      generationsUsed = usageError ? 0 : (usageData || []).length;
      generationLimit = planLimits.studyPackGenerationsPerMonth || planLimits.quizGenerationsPerMonth;

      if (generationLimit !== -1 && generationsUsed >= generationLimit) {
        return res.status(429).json({
          success: false,
          message: `You've used all ${generationLimit} study pack generation${generationLimit === 1 ? '' : 's'} this period. Upgrade for 99+ combined/month.`,
          generationsUsed,
          generationLimit,
          generationsRemaining: 0,
          upgrade: true
        });
      }
    }

    const pack = await aiAnalysisService.generateStudyPack(text, userPlan);
    pack.originalNotes = text.trim();

    supabase.from('quiz_usage').insert({
      user_id: userId,
      words_count: wordCount,
      quiz_type: 'study_pack',
      difficulty: 'mixed'
    }).then(() => {}).catch(err => console.error('Failed to record study pack usage:', err));

    const isPaidUser = userPlan === 'pro' || userPlan === 'premium';
    const expiresAt = isPaidUser ? null : (() => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString(); })();

    const packTitle = pack.quiz?.title || pack.flashcards?.title || pack.lesson?.title || 'Study Pack';

    supabase.from('quizzes').insert([{
      user_id: userId,
      title: packTitle,
      quiz_type: 'study_pack',
      difficulty: 'mixed',
      question_count: (pack.quiz?.questions?.length || 0) + (pack.flashcards?.cards?.length || 0),
      questions: {
        quiz: pack.quiz,
        flashcards: pack.flashcards,
        crossword: pack.crossword,
        lesson: pack.lesson,
        craterBlast: pack.craterBlast,
        originalNotes: pack.originalNotes,
      },
      source_word_count: wordCount,
      created_at: new Date().toISOString(),
      expires_at: expiresAt
    }]).select().then(({ data }) => {
      if (data?.[0]) console.log('Study pack saved:', data[0].id);
    }).catch(err => console.error('Failed to save study pack:', err));

    res.json({
      success: true,
      message: 'Study pack generated successfully',
      data: pack,
      generationsUsed: generationsUsed + 1,
      generationLimit,
      generationsRemaining: Math.max(0, generationLimit - generationsUsed - 1),
    });
  } catch (error) {
    console.error('Generate study pack error:', error);
    res.status(500).json({
      success: false,
      message: 'Study pack generation failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/analysis/study-pack-usage
// @desc    Get user's study pack generation usage this period
// @access  Private
router.get('/study-pack-usage', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userPlan = req.user.subscription_plan || 'free';
    const planLimits = subscriptionService.PLAN_LIMITS[userPlan] || subscriptionService.PLAN_LIMITS.free;

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    );

    const { periodStart, daysUntilReset } = await subscriptionService.getUsagePeriod(userId);

    const { data: usageData, error: usageError } = await supabase
      .from('quiz_usage')
      .select('id')
      .eq('user_id', userId)
      .eq('quiz_type', 'study_pack')
      .gte('created_at', periodStart);

    const generationsUsed = usageError ? 0 : (usageData || []).length;
    const generationLimit = planLimits.studyPackGenerationsPerMonth || planLimits.quizGenerationsPerMonth;
    const maxWords = planLimits.studyPackMaxWordsPerGeneration || planLimits.quizMaxWordsPerGeneration || 5000;

    res.json({
      success: true,
      data: {
        generationsUsed,
        generationLimit,
        generationsRemaining: Math.max(0, generationLimit - generationsUsed),
        maxWordsPerGeneration: maxWords,
        plan: userPlan,
        daysUntilReset
      }
    });
  } catch (error) {
    console.error('Study pack usage error:', error);
    res.status(500).json({ success: false, message: 'Failed to get study pack usage' });
  }
});

module.exports = router;