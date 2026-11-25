const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const aiAnalysisService = require('../services/aiAnalysisService');
const subscriptionService = require('../services/subscriptionService');

const router = express.Router();

/**
 * Essay writing: "start an essay" (thesis + outline) and help while writing
 * (paragraph starters, clearer/shorter/more formal rewrites).
 *
 * These are many small AI calls rather than one big one, so they have their
 * own monthly allowance instead of spending credits. Uses are logged in the
 * humanize_usage table (the humanizer is retired) with words_count 0, so they
 * never eat into the summarizer word pool.
 */
const LIMITS = {
  free: { plans: 2, helps: 10 },
  pro: { plans: 100, helps: 500 },
  premium: { plans: 250, helps: 1000 },
};
const PLAN_MODE = 'essay_plan';
const HELP_MODE = 'writing_help';
const HELP_KINDS = ['start', 'next', 'check', 'clearer', 'shorter', 'formal', 'fix'];
/** A paragraph check reads one section of the draft, not a whole essay. */
const CHECK_MIN_WORDS = 40;
const CHECK_MAX_WORDS = 900;

/** Which allowance this account has: free, pro or premium. */
const tierOf = (req) => {
  const n = subscriptionService.normalizePlanForLimits(req.user?.subscription_plan || req.user?.plan || 'free');
  return n === 'premium' ? 'premium' : n === 'pro' ? 'pro' : 'free';
};
const isPaid = (req) => tierOf(req) !== 'free';

const db = () => {
  const { createClient } = require('@supabase/supabase-js');
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);
};

/** Uses of one mode since the start of the account's current period. Fails open (0) so a count error never blocks writing. */
async function usedThisPeriod(userId, mode, periodStart) {
  try {
    const { count, error } = await db()
      .from('humanize_usage')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('mode', mode)
      .gte('created_at', periodStart);
    if (error) throw error;
    return count || 0;
  } catch (err) {
    console.error('writing usage count failed:', err?.message || err);
    return 0;
  }
}

/** "Dec 20", for "More arrive on Dec 20". */
const resetDay = (iso) => {
  const d = iso ? new Date(iso) : null;
  return d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }) : null;
};

function record(userId, mode, detail) {
  db().from('humanize_usage')
    .insert({ user_id: userId, words_count: 0, mode, intensity: String(detail || '').slice(0, 20) })
    .then(({ error }) => { if (error) console.error('writing usage insert failed:', error.message); })
    .catch((err) => console.error('writing usage insert failed:', err?.message || err));
}

async function usageFor(req) {
  const limits = LIMITS[tierOf(req)];
  let period = null;
  try { period = await subscriptionService.getUsagePeriod(req.user.id); } catch (err) { console.error('writing usage period failed:', err?.message || err); }
  const since = period?.periodStart || new Date(Date.now() - 30 * 864e5).toISOString();
  const [plans, helps] = await Promise.all([usedThisPeriod(req.user.id, PLAN_MODE, since), usedThisPeriod(req.user.id, HELP_MODE, since)]);
  return {
    paid: isPaid(req),
    plansUsed: plans,
    plansLimit: limits.plans,
    plansLeft: Math.max(0, limits.plans - plans),
    helpsUsed: helps,
    helpsLimit: limits.helps,
    helpsLeft: Math.max(0, limits.helps - helps),
    /** When both allowances start again. */
    resetsAt: period?.periodEnd || null,
  };
}

/** The limit message, with the day the allowance comes back. */
function limitMessage(usage, what) {
  const day = resetDay(usage.resetsAt);
  const outlines = what === 'outlines';
  const n = outlines ? usage.plansLimit : usage.helpsLimit;
  const noun = outlines ? 'outlines' : 'writing helps';
  if (usage.paid) {
    return `You have used all ${n} ${noun} for this period. ${day ? `More arrive on ${day}.` : 'More arrive when your plan renews.'}`;
  }
  const pro = outlines ? LIMITS.pro.plans : LIMITS.pro.helps;
  return `You have used your ${n} free ${noun} this month. ${day ? `They come back on ${day}. ` : ''}Pro gives you ${pro} a month.`;
}

// @route   GET /api/writing/usage
// @desc    How much essay-writing help this account has left this period
router.get('/usage', authenticateToken, async (req, res) => {
  try {
    res.json({ success: true, data: await usageFor(req) });
  } catch (error) {
    console.error('writing usage error:', error);
    res.status(500).json({ success: false, message: 'Could not load your writing help allowance.' });
  }
});

// @route   POST /api/writing/plan
// @desc    Three possible theses for an essay question, each with an outline
router.post('/plan', authenticateToken, async (req, res) => {
  try {
    const { question, essayType, wordTarget, brief } = req.body || {};
    const q = typeof question === 'string' ? question.trim() : '';
    if (q.length < 12) {
      return res.status(400).json({ success: false, message: 'Type or paste the essay question first (a full sentence works best).' });
    }
    if (q.length > 2000) {
      return res.status(400).json({ success: false, message: 'That question is too long. Paste just the question, not the whole brief.' });
    }
    const usage = await usageFor(req);
    if (usage.plansLeft <= 0) {
      return res.status(429).json({
        success: false,
        message: limitMessage(usage, 'outlines'),
        upgrade: !usage.paid,
        usage,
      });
    }
    const plan = await aiAnalysisService.generateEssayPlan({ question: q, essayType, wordTarget, brief: typeof brief === 'string' ? brief : '' });
    record(req.user.id, PLAN_MODE, 'plan');
    res.json({ success: true, data: { ...plan, usage: { ...usage, plansUsed: usage.plansUsed + 1, plansLeft: usage.plansLeft - 1 } } });
  } catch (error) {
    console.error('writing plan error:', error);
    res.status(500).json({ success: false, message: error.message || 'Could not build the outline. Try again.' });
  }
});

/** Where a paragraph sits in the essay, sent with "what next". Anything odd is dropped rather than trusted. */
function cleanPlace(p) {
  if (!p || typeof p !== 'object') return null;
  const int = (v, max) => (Number.isFinite(Number(v)) ? Math.max(0, Math.min(max, Math.round(Number(v)))) : 0);
  const outline = (Array.isArray(p.outline) ? p.outline : []).slice(0, 20).map((h) => (typeof h === 'string' ? h.slice(0, 120) : '')).filter(Boolean);
  const total = int(p.total, 20);
  if (!total) return null;
  return { index: int(p.index, total - 1), total, outline, words: int(p.words, 5000), target: int(p.target, 5000), citations: int(p.citations, 200) };
}

// @route   POST /api/writing/help
// @desc    A paragraph starter, a paragraph check, a clearer/shorter/more formal version of a selected passage, or one sentence rewritten to fix a problem a check found
router.post('/help', authenticateToken, async (req, res) => {
  try {
    const { kind, question, thesis, heading, goal, context, selection, instruction, place } = req.body || {};
    if (!HELP_KINDS.includes(kind)) {
      return res.status(400).json({ success: false, message: 'Unknown kind of help.' });
    }
    if (kind === 'check') {
      const sel = typeof selection === 'string' ? selection.trim() : '';
      const words = sel ? sel.split(/\s+/).length : 0;
      if (words < CHECK_MIN_WORDS) return res.status(400).json({ success: false, message: `Write at least ${CHECK_MIN_WORDS} words in this paragraph first, then check it.` });
      if (words > CHECK_MAX_WORDS) return res.status(400).json({ success: false, message: `This section is over ${CHECK_MAX_WORDS} words. Split it into two paragraphs in your outline and check each one.` });
    } else if (kind === 'next') {
      // What the student has written of this paragraph so far.
      const sel = typeof selection === 'string' ? selection.trim() : '';
      const words = sel ? sel.split(/\s+/).length : 0;
      if (words < 5) return res.status(400).json({ success: false, message: 'Write a little of this paragraph first, then ask what to write next.' });
      if (words > CHECK_MAX_WORDS) return res.status(400).json({ success: false, message: `This paragraph is over ${CHECK_MAX_WORDS} words. Check it instead.` });
    } else if (kind !== 'start') {
      const sel = typeof selection === 'string' ? selection.trim() : '';
      const words = sel ? sel.split(/\s+/).length : 0;
      if (words < 3) return res.status(400).json({ success: false, message: 'Select at least a few words to get help with them.' });
      if (words > 250) return res.status(400).json({ success: false, message: 'Select a shorter passage: one paragraph at most.' });
      if (kind === 'fix' && !(typeof instruction === 'string' && instruction.trim())) return res.status(400).json({ success: false, message: 'Say what to fix first.' });
    }
    const usage = await usageFor(req);
    if (usage.helpsLeft <= 0) {
      return res.status(429).json({
        success: false,
        message: limitMessage(usage, 'helps'),
        upgrade: !usage.paid,
        usage,
      });
    }
    const result = await aiAnalysisService.generateWritingHelp({ kind, question, thesis, heading, goal, context, selection, instruction: typeof instruction === 'string' ? instruction.slice(0, 500) : '', place: cleanPlace(place) });
    record(req.user.id, HELP_MODE, kind);
    res.json({ success: true, data: { kind, ...result, usage: { ...usage, helpsUsed: usage.helpsUsed + 1, helpsLeft: usage.helpsLeft - 1 } } });
  } catch (error) {
    console.error('writing help error:', error);
    res.status(500).json({ success: false, message: error.message || 'Could not get a suggestion. Try again.' });
  }
});

module.exports = router;
