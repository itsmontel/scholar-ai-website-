/**
 * Funnel events: the site's own record of where people drop.
 *
 * POST /api/events  { event, anonId?, path?, props? }
 *
 * Anyone can post (the steps before sign-up matter most), so the event
 * name is allow-listed, props are trimmed to a small object and the
 * general rate limit applies. Rows land in funnel_events
 * (migrations/20261101_funnel_events.sql), which has the queries that
 * read the funnel back.
 */
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

const ALLOWED_EVENTS = new Set([
  'landing_view',
  'essay_pasted',
  'gate_view',
  'verify_email_prompt',
  'signed_up',
  'grade_started',
  'grade_completed',
  'grade_failed',
  'grade_question_answered',
  'paywall_view',
  'paywall_dismiss',
  'checkout_started',
  'subscription_converted',
  'free_limit_hit',
  'pro_only_hit',
  // First result before sign-up (landing page).
  'door_selected',
  // Sign-up page: seen, and Google button tapped.
  'signup_view',
  'signup_google_click',
  // Written by the server when a study pack is saved to an account.
  'pack_created',
  // Written by the server when a Stripe checkout is opened.
  'checkout_session_created',
  'preview_started',
  'preview_completed',
  'preview_failed',
  'preview_save_click',
  'onboarding_answer',
  'pack_started',
  'pack_completed',
  'tool_next_step',
  // First real use of each study tool, and the essay writer's limits.
  'first_quiz',
  'first_flashcards',
  'first_game',
  'blank_draft_started',
  'outline_limit_hit',
  'door_flow_closed',
  'door_flow_done',
]);

const ALLOWED_PROP_KEYS = new Set([
  'method', 'plan', 'source', 'trigger', 'words', 'grade', 'score', 'purpose', 'due',
  'code', 'reason', 'page', 'variant', 'feature', 'cycle', 'referrer',
  'door', 'kind', 'question', 'answer', 'utm_source', 'utm_medium', 'utm_campaign',
  // Which tool or step, where it came from, which game, and the hero box's mode.
  'tool', 'from', 'ask', 'typed', 'game', 'where', 'paid', 'left',
  // The landing pop-up: which step it was closed on, and how the account was made.
  'step', 'how',
]);

let tableMissing = false;

function cleanProps(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out = {};
  for (const [k, v] of Object.entries(raw)) {
    if (!ALLOWED_PROP_KEYS.has(k)) continue;
    if (typeof v === 'string') out[k] = v.slice(0, 120);
    else if (typeof v === 'number' && Number.isFinite(v)) out[k] = v;
    else if (typeof v === 'boolean') out[k] = v;
  }
  return out;
}

router.post('/', optionalAuth, async (req, res) => {
  try {
    const { event, anonId, path, props } = req.body || {};
    if (typeof event !== 'string' || !ALLOWED_EVENTS.has(event)) {
      return res.status(400).json({ success: false, message: 'Unknown event' });
    }
    if (tableMissing) return res.json({ success: true, stored: false });

    const row = {
      event,
      user_id: req.user?.id || null,
      anon_id: typeof anonId === 'string' && /^[A-Za-z0-9_-]{6,64}$/.test(anonId) ? anonId : null,
      path: typeof path === 'string' ? path.slice(0, 255) : null,
      props: cleanProps(props),
    };
    const { error } = await supabase.from('funnel_events').insert(row);
    if (error) {
      const msg = `${error.message || ''}`.toLowerCase();
      if (msg.includes('funnel_events') && (msg.includes('relation') || msg.includes('schema cache') || msg.includes('does not exist'))) {
        tableMissing = true;
        console.warn('[events] funnel_events table missing. Run migrations/20261101_funnel_events.sql');
        return res.json({ success: true, stored: false });
      }
      throw error;
    }
    res.json({ success: true, stored: true });
  } catch (error) {
    console.error('[events] insert failed:', error.message || error);
    // Analytics must never break the page that sent them.
    res.json({ success: true, stored: false });
  }
});

/**
 * Record a funnel step from the server (for steps every client shares,
 * such as a study pack being made). Never throws.
 */
async function recordServerEvent(event, userId, props = {}) {
  try {
    if (tableMissing || !ALLOWED_EVENTS.has(event)) return;
    const { error } = await supabase.from('funnel_events').insert({
      event,
      user_id: userId || null,
      anon_id: null,
      path: null,
      props: cleanProps(props),
    });
    if (error) console.error('[events] server event failed:', error.message);
  } catch (err) {
    console.error('[events] server event failed:', err?.message || err);
  }
}

module.exports = router;
module.exports.recordServerEvent = recordServerEvent;
