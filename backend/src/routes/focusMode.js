/**
 * Focus Mode API - Block addictive sites until user passes unlock quiz
 * Paid users only (Pro/Premium)
 */
const express = require('express');
const router = express.Router();
const { authenticateToken, requireSubscription } = require('../middleware/auth');
const { createClient } = require('@supabase/supabase-js');
const aiAnalysisService = require('../services/aiAnalysisService');
const achievementsService = require('../services/achievementsService');

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
  { domain: 'discord.com', label: 'Discord' }
];

const QUESTION_COUNT_OPTIONS = [5, 10, 15];
const DEFAULT_QUESTION_COUNT = 5;
const DEFAULT_PASS_THRESHOLD = 4;
const DEFAULT_UNLOCK_MS = 30 * 60 * 1000;
const UNLOCK_DURATION_OPTIONS = [
  { value: 15 * 60 * 1000, label: '15 minutes' },
  { value: 30 * 60 * 1000, label: '30 minutes' },
  { value: 60 * 60 * 1000, label: '1 hour' },
  { value: 2 * 60 * 60 * 1000, label: '2 hours' },
  { value: 3 * 60 * 60 * 1000, label: '3 hours' },
  { value: 4 * 60 * 60 * 1000, label: '4 hours' },
  { value: 6 * 60 * 60 * 1000, label: '6 hours' },
  { value: 8 * 60 * 60 * 1000, label: '8 hours' },
  { value: 12 * 60 * 60 * 1000, label: '12 hours' },
  { value: 24 * 60 * 60 * 1000, label: '24 hours' },
];

// Pro: 10 sites, Premium: unlimited, Free: 1 site
function getMaxSites(plan) {
  const p = (plan || 'free').toLowerCase();
  if (p === 'premium') return 99999;
  if (p === 'pro') return 10;
  return 1;
}

function clampSettings(settings) {
  const q = Math.min(15, Math.max(5, parseInt(settings.question_count, 10) || DEFAULT_QUESTION_COUNT));
  const qc = QUESTION_COUNT_OPTIONS.includes(q) ? q : DEFAULT_QUESTION_COUNT;
  const pt = Math.min(qc, Math.max(1, parseInt(settings.pass_threshold, 10) || Math.max(1, Math.floor(qc * 0.8))));
  const ms = parseInt(settings.unlock_duration_ms, 10);
  const validMs = UNLOCK_DURATION_OPTIONS.some(o => o.value === ms) ? ms : DEFAULT_UNLOCK_MS;
  return { question_count: qc, pass_threshold: pt, unlock_duration_ms: validMs };
}

// @route   GET /api/focus-mode/settings
// @desc    Get full Focus Mode settings (free: 1, pro: 10, premium: unlimited)
router.get('/settings', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const plan = req.user.subscription_plan || 'free';
    const maxSites = getMaxSites(plan);
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('focus_mode_settings')
      .select('blocked_domains, question_count, pass_threshold, unlock_duration_ms')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    const domains = (data?.blocked_domains || []).slice(0, maxSites);
    const questionCount = [5, 10, 15].includes(data?.question_count) ? data.question_count : DEFAULT_QUESTION_COUNT;
    const passThreshold = typeof data?.pass_threshold === 'number' && data.pass_threshold >= 1 && data.pass_threshold <= questionCount
      ? data.pass_threshold : Math.max(1, Math.floor(questionCount * 0.8));
    const unlockMs = data?.unlock_duration_ms || DEFAULT_UNLOCK_MS;
    res.json({
      success: true,
      data: {
        blockedDomains: domains,
        question_count: questionCount,
        pass_threshold: passThreshold,
        unlock_duration_ms: unlockMs,
        maxSites
      }
    });
  } catch (err) {
    console.error('Focus mode get settings:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch settings' });
  }
});

// @route   PUT /api/focus-mode/settings
// @desc    Update Focus Mode settings (free: 1, pro: 10, premium: unlimited)
router.put('/settings', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const plan = req.user.subscription_plan || 'free';
    const maxSites = getMaxSites(plan);
    const { blockedDomains, question_count, pass_threshold, unlock_duration_ms } = req.body;
    const supabase = getSupabase();

    let finalDomains = [];
    if (Array.isArray(blockedDomains)) {
      finalDomains = [...new Set(
        blockedDomains.slice(0, maxSites).map(d => String(d).toLowerCase().trim()).filter(d => d.length > 0)
          .map(d => {
            const parts = d.replace(/^https?:\/\//, '').split('/')[0].split('.');
            return parts.length >= 2 ? parts.slice(-2).join('.') : d;
          })
      )];
    } else {
      const { data: existing } = await supabase
        .from('focus_mode_settings')
        .select('blocked_domains')
        .eq('user_id', userId)
        .maybeSingle();
      finalDomains = existing?.blocked_domains || [];
    }

    const { question_count: qc, pass_threshold: pt, unlock_duration_ms: ums } = clampSettings({
      question_count,
      pass_threshold,
      unlock_duration_ms
    });

    const { error } = await supabase
      .from('focus_mode_settings')
      .upsert({
        user_id: userId,
        blocked_domains: finalDomains,
        question_count: qc,
        pass_threshold: pt,
        unlock_duration_ms: ums,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (error) throw error;
    achievementsService.upsertAchievements(userId, { stats: { focus_mode_sites_blocked: finalDomains.length } }).catch(() => {});
    res.json({
      success: true,
      data: {
        blockedDomains: finalDomains,
        question_count: qc,
        pass_threshold: pt,
        unlock_duration_ms: ums
      }
    });
  } catch (err) {
    console.error('Focus mode update settings:', err);
    res.status(500).json({ success: false, message: 'Failed to update settings' });
  }
});

// @route   GET /api/focus-mode/blocked-sites
// @desc    Get user's blocked sites (free: 1, pro: 10, premium: unlimited)
router.get('/blocked-sites', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const plan = req.user.subscription_plan || 'free';
    const maxSites = getMaxSites(plan);
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('focus_mode_settings')
      .select('blocked_domains')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;

    const allDomains = data?.blocked_domains || [];
    const domains = allDomains.slice(0, maxSites);
    res.json({ success: true, data: { blockedDomains: domains, maxSites } });
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
// @desc    Update blocked sites (free: 1, pro: 10, premium: unlimited)
router.put('/blocked-sites', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const plan = req.user.subscription_plan || 'free';
    const maxSites = getMaxSites(plan);
    const { blockedDomains } = req.body;

    if (!Array.isArray(blockedDomains)) {
      return res.status(400).json({ success: false, message: 'blockedDomains must be an array' });
    }

    // Normalize: lowercase, strip subdomains to base domain, limit by plan
    const normalized = [...new Set(
      blockedDomains
        .slice(0, maxSites)
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

    // Track focus_mode_sites_blocked for achievements (fire-and-forget)
    achievementsService.upsertAchievements(userId, {
      stats: { focus_mode_sites_blocked: normalized.length }
    }).catch(() => { /* ignore */ });

    res.json({ success: true, data: { blockedDomains: normalized, maxSites } });
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
// @desc    Get random questions from user's study tools for unlock quiz
// Free users: default 5 questions, paid users: customizable (5/10/15)
router.get('/unlock-quiz', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const plan = (req.user.subscription_plan || 'free').toLowerCase();
    const isPaid = plan === 'pro' || plan === 'premium';
    const limit = 30;

    const supabase = getSupabase();
    const { data: fmSettings } = await supabase
      .from('focus_mode_settings')
      .select('question_count, pass_threshold')
      .eq('user_id', userId)
      .maybeSingle();
    // All users (free and paid) can customize; use saved settings or defaults
    const totalQuestions = [5, 10, 15].includes(fmSettings?.question_count) ? fmSettings.question_count : DEFAULT_QUESTION_COUNT;
    const passThreshold = typeof fmSettings?.pass_threshold === 'number' && fmSettings.pass_threshold >= 1 && fmSettings.pass_threshold <= totalQuestions
      ? fmSettings.pass_threshold : Math.max(1, Math.floor(totalQuestions * 0.8));

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

    const isStudyPack = (t) => t.quiz_type === 'study_pack';
    const isQuiz = (t) => !['flashcards', 'crossword', 'study_pack'].includes(t.quiz_type);
    const isFlashcards = (t) => t.quiz_type === 'flashcards';

    for (const tool of tools) {
      // Handle unified study packs (contains quiz, flashcards, crossword, lesson, craterBlast)
      if (isStudyPack(tool)) {
        const packData = tool.questions || {};
        
        // Extract quiz questions from study pack
        const quizData = packData.quiz;
        if (quizData?.questions?.length) {
          const qs = quizData.questions.filter(q => q && q.question && (q.options?.length || q.correctAnswer));
          qs.slice(0, 6).forEach(q => allItems.push({ type: 'quiz', data: { ...q, sourceTitle: tool.title } }));
        }
        
        // Extract flashcards from study pack
        const flashcardsData = packData.flashcards;
        if (Array.isArray(flashcardsData) && flashcardsData.length) {
          const cards = flashcardsData.filter(c => c && c.front && c.back).slice(0, 6);
          cards.forEach(c => allItems.push({
            type: 'flashcard',
            data: { front: c.front, back: c.back, sourceTitle: tool.title }
          }));
        }
        
        // Extract Crater Blast questions from study pack (they work like quiz questions)
        const craterBlastData = packData.craterBlast;
        if (Array.isArray(craterBlastData) && craterBlastData.length) {
          const cbQs = craterBlastData.filter(q => q && q.question && (q.options?.length || q.correctAnswer));
          cbQs.slice(0, 4).forEach(q => allItems.push({ type: 'quiz', data: { ...q, sourceTitle: tool.title } }));
        }
      } else if (isQuiz(tool)) {
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
    const selected = shuffled.slice(0, totalQuestions);

    // Shuffle options for each quiz question so the answer isn't always in the same position
    const shuffleOptions = (item) => {
      if (item.type !== 'quiz' || !item.data.options?.length) return item;
      const { options, correctAnswer } = item.data;
      
      // Find the correct answer text
      let correctText = correctAnswer;
      const letter = String(correctAnswer).toUpperCase();
      if (letter >= 'A' && letter <= 'Z' && letter.length === 1) {
        const idx = letter.charCodeAt(0) - 65;
        if (idx >= 0 && idx < options.length) {
          correctText = options[idx];
        }
      }
      
      // Shuffle options
      const shuffledOptions = [...options].sort(() => Math.random() - 0.5);
      
      // Find new index of correct answer and convert to letter
      const newIdx = shuffledOptions.findIndex(opt => opt === correctText);
      const newLetter = newIdx >= 0 ? String.fromCharCode(65 + newIdx) : correctAnswer;
      
      return {
        ...item,
        data: {
          ...item.data,
          options: shuffledOptions,
          correctAnswer: newLetter
        }
      };
    };
    
    const finalQuestions = selected.map(shuffleOptions);

    if (finalQuestions.length < totalQuestions) {
      return res.status(400).json({
        success: false,
        message: `You need at least ${totalQuestions} questions in your study tools to use Focus Mode. Create some quizzes or flashcards first.`,
        needsMoreContent: true
      });
    }

    res.json({
      success: true,
      data: {
        questions: finalQuestions,
        passThreshold,
        totalQuestions
      }
    });
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
// Free: 1, Pro: 10, Premium: unlimited
router.get('/config', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const plan = req.user.subscription_plan || 'free';
    const maxSites = getMaxSites(plan);

    const supabase = getSupabase();
    const { data } = await supabase
      .from('focus_mode_settings')
      .select('blocked_domains, question_count, pass_threshold, unlock_duration_ms')
      .eq('user_id', userId)
      .maybeSingle();

    const allDomains = data?.blocked_domains || [];
    const domains = allDomains.slice(0, maxSites);
    const questionCount = [5, 10, 15].includes(data?.question_count) ? data.question_count : DEFAULT_QUESTION_COUNT;
    const passThreshold = typeof data?.pass_threshold === 'number' && data.pass_threshold >= 1 && data.pass_threshold <= questionCount
      ? data.pass_threshold : Math.max(1, Math.floor(questionCount * 0.8));
    const unlockMs = data?.unlock_duration_ms || DEFAULT_UNLOCK_MS;

    res.json({
      success: true,
      data: {
        blockedDomains: domains,
        plan,
        enabled: domains.length > 0,
        question_count: questionCount,
        pass_threshold: passThreshold,
        unlock_duration_ms: unlockMs,
        maxSites
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
