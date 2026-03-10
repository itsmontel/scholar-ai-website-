/**
 * Focus Mode API - Block addictive sites until user passes unlock quiz
 * Paid users only (Pro/Premium)
 */
const express = require('express');
const router = express.Router();
const { authenticateToken, requireSubscription } = require('../middleware/auth');
const { createClient } = require('@supabase/supabase-js');
const aiAnalysisService = require('../services/aiAnalysisService');

const getSupabase = () => createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

// Predefined addictive sites for quick-add
const PRESET_SITES = [
  { domain: 'youtube.com', label: 'YouTube' },
  { domain: 'tiktok.com', label: 'TikTok' },
  { domain: 'instagram.com', label: 'Instagram' },
  { domain: 'facebook.com', label: 'Facebook' },
  { domain: 'twitter.com', label: 'X (Twitter)' },
  { domain: 'reddit.com', label: 'Reddit' },
  { domain: 'netflix.com', label: 'Netflix' },
  { domain: 'twitch.tv', label: 'Twitch' },
  { domain: 'pinterest.com', label: 'Pinterest' },
  { domain: 'snapchat.com', label: 'Snapchat' }
];

// @route   GET /api/focus-mode/blocked-sites
// @desc    Get user's blocked sites (paid only)
router.get('/blocked-sites', authenticateToken, requireSubscription('pro'), async (req, res) => {
  try {
    const userId = req.user.id;
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('focus_mode_settings')
      .select('blocked_domains')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;

    const domains = data?.blocked_domains || [];
    res.json({ success: true, data: { blockedDomains: domains } });
  } catch (err) {
    console.error('Focus mode get blocked sites:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blocked sites',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// @route   PUT /api/focus-mode/blocked-sites
// @desc    Update user's blocked sites (paid only)
router.put('/blocked-sites', authenticateToken, requireSubscription('pro'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { blockedDomains } = req.body;

    if (!Array.isArray(blockedDomains)) {
      return res.status(400).json({ success: false, message: 'blockedDomains must be an array' });
    }

    // Normalize: lowercase, strip subdomains to base domain, limit 20
    const normalized = [...new Set(
      blockedDomains
        .slice(0, 20)
        .map(d => String(d).toLowerCase().trim())
        .filter(d => d.length > 0)
        .map(d => {
          // Extract base domain (youtube.com from www.youtube.com)
          const parts = d.replace(/^https?:\/\//, '').split('/')[0].split('.');
          if (parts.length >= 2) {
            return parts.slice(-2).join('.');
          }
          return d;
        })
    )];

    const supabase = getSupabase();
    const { error } = await supabase
      .from('focus_mode_settings')
      .upsert({
        user_id: userId,
        blocked_domains: normalized,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (error) throw error;

    res.json({ success: true, data: { blockedDomains: normalized } });
  } catch (err) {
    console.error('Focus mode update blocked sites:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to update blocked sites',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// @route   GET /api/focus-mode/presets
// @desc    Get preset sites (no auth, for UI)
router.get('/presets', (req, res) => {
  res.json({ success: true, data: PRESET_SITES });
});

// @route   GET /api/focus-mode/unlock-quiz
// @desc    Get 5 random questions from user's study tools for unlock quiz (paid only)
router.get('/unlock-quiz', authenticateToken, requireSubscription('pro'), async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = 30; // Fetch more to pick from

    const quizHistory = await aiAnalysisService.getQuizHistory(userId, limit);
    let lessonHistory = [];
    try {
      const lessons = await aiAnalysisService.getLessonHistory(userId, limit);
      lessonHistory = lessons.map(l => ({
        id: l.id,
        title: l.title,
        quiz_type: 'lesson',
        questions: l.slides,
        quiz_bank: l.quiz_bank || []
      }));
    } catch (_e) {}

    const tools = [...quizHistory, ...lessonHistory];
    const allItems = [];

    const isQuiz = (t) => !['flashcards', 'crossword'].includes(t.quiz_type);
    const isFlashcards = (t) => t.quiz_type === 'flashcards';

    for (const tool of tools) {
      if (isQuiz(tool)) {
        let qs = [];
        if (Array.isArray(tool.questions)) {
          qs = tool.questions.filter(q => q && q.question && (q.options?.length || q.correctAnswer));
        } else if (tool.questions?.questions) {
          qs = tool.questions.questions.filter(q => q && q.question && (q.options?.length || q.correctAnswer));
        } else if (tool.quiz_bank?.length) {
          qs = tool.quiz_bank.filter(q => q && q.question && (q.options?.length || q.correctAnswer));
        }
        qs.slice(0, 6).forEach(q => allItems.push({ type: 'quiz', data: { ...q, sourceTitle: tool.title } }));
      } else if (isFlashcards(tool) && Array.isArray(tool.questions)) {
        const cards = tool.questions.filter(c => c && c.front && c.back).slice(0, 6);
        cards.forEach(c => allItems.push({
          type: 'flashcard',
          data: { front: c.front, back: c.back, sourceTitle: tool.title }
        }));
      }
    }

    const shuffled = allItems.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 5);

    if (selected.length < 5) {
      return res.status(400).json({
        success: false,
        message: 'You need at least 5 questions in your study tools to use Focus Mode. Create some quizzes or flashcards first.',
        needsMoreContent: true
      });
    }

    res.json({ success: true, data: { questions: selected } });
  } catch (err) {
    console.error('Focus mode unlock quiz:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to load quiz questions',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// @route   GET /api/focus-mode/config
// @desc    Extension: get blocked domains + plan (requires token for sync)
router.get('/config', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const plan = (req.user.subscription_plan || 'free').toLowerCase();
    const isPaid = plan === 'pro' || plan === 'premium';

    if (!isPaid) {
      return res.json({
        success: true,
        data: { blockedDomains: [], plan, enabled: false }
      });
    }

    const supabase = getSupabase();
    const { data } = await supabase
      .from('focus_mode_settings')
      .select('blocked_domains')
      .eq('user_id', userId)
      .maybeSingle();

    const domains = data?.blocked_domains || [];
    res.json({
      success: true,
      data: {
        blockedDomains: domains,
        plan,
        enabled: domains.length > 0
      }
    });
  } catch (err) {
    console.error('Focus mode config:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch config'
    });
  }
});

module.exports = router;
