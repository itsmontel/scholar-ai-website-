/**
 * Credits
 *
 * Every essay analysis, study pack and citation search costs 1 credit.
 *   Free     FREE_CREDITS within 7 days (never-paid accounts; 0 = off, current)
 *   Trial    5 credits ($1, 7-day trial)
 *   Pro      99 credits per billing period
 *   Premium  199 credits per billing period
 *
 * Free credits buy the preview: essay grades come back with the
 * highlights and the overall grade but no comments or rubric (see
 * analysisRedaction.js), and study packs open the lesson and quiz.
 * Accounts that have ever had a trial or a paid plan get no free credits.
 *
 * Unused credits roll into the next period, up to CREDIT_CAP in total.
 * Trial credits roll into the first paid month. A period that starts
 * while the subscription is paused grants nothing, so a pause freezes
 * the balance. When the subscription ends the balance resets to 0.
 *
 * Spending is not stored here: it is counted from document_analyses,
 * citation_searches and quiz_usage (study packs), the same rows the
 * combined pool always counted. The users row only remembers what was
 * carried into the current period (see migrations/20261014_credit_rollover.sql).
 * The rollover is applied lazily the first time a new period is seen,
 * and eagerly from the Stripe webhook when the period renews.
 */
const { createClient } = require('@supabase/supabase-js');

const supabaseServiceRole = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

const CREDIT_CAP = 499;
const TRIAL_CREDITS = 5;
const TRIAL_DAYS = 7;
const MONTHLY_CREDITS = { pro: 99, premium: 199 };
// Free week for never-paid accounts. Off since the $1 trial became the
// way in (2026-10-27); set FREE_CREDITS=3 to bring it back.
const FREE_CREDITS = process.env.FREE_CREDITS != null && process.env.FREE_CREDITS !== '' && Number.isFinite(Number(process.env.FREE_CREDITS))
  ? Math.max(0, Math.floor(Number(process.env.FREE_CREDITS)))
  : 0;
const FREE_CREDIT_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;
const FREE_CREDITS_STAT_KEY = 'free_credits_started_at';

// Stripe can report the same period start a few ms apart between calls.
const PERIOD_TOLERANCE_MS = 60 * 1000;

let rolloverColumnsMissing = false;

function isMissingColumn(error) {
  const msg = `${error?.message || ''}`.toLowerCase();
  return msg.includes('credits_') && (msg.includes('column') || msg.includes('schema cache'));
}

function toIso(value) {
  if (value == null) return null;
  if (typeof value === 'number') return new Date(value * 1000).toISOString();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** Newer Stripe API versions moved the period onto the subscription item. */
function subscriptionPeriod(subscription) {
  const item = subscription?.items?.data?.[0];
  return {
    periodStart: toIso(subscription?.current_period_start ?? item?.current_period_start),
    periodEnd: toIso(subscription?.current_period_end ?? item?.current_period_end),
  };
}

function monthlyCreditsFor(plan) {
  return MONTHLY_CREDITS[plan] || 0;
}

/** Credits spent in [fromIso, toIso). toIso null = up to now. */
async function countCreditsUsed(userId, fromIso, toIso = null) {
  const count = (table, extra) => {
    let q = supabaseServiceRole
      .from(table)
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', fromIso);
    if (toIso) q = q.lt('created_at', toIso);
    if (extra) q = extra(q);
    return q;
  };
  const [analyses, citations, packs] = await Promise.all([
    count('document_analyses'),
    count('citation_searches'),
    count('quiz_usage', (q) => q.eq('quiz_type', 'study_pack')),
  ]);
  for (const r of [analyses, citations, packs]) {
    if (r.error) throw r.error;
  }
  return (analyses.count || 0) + (citations.count || 0) + (packs.count || 0);
}

async function readRollover(userId) {
  if (rolloverColumnsMissing) return null;
  const { data, error } = await supabaseServiceRole
    .from('users')
    .select('credits_rollover, credits_period_start, credits_period_allowance')
    .eq('id', userId)
    .maybeSingle();
  if (error) {
    if (isMissingColumn(error)) {
      rolloverColumnsMissing = true;
      console.warn('credits: rollover columns missing — run migrations/20261014_credit_rollover.sql');
      return null;
    }
    throw error;
  }
  return data || {};
}

async function writeRollover(userId, fields, expectedPeriodStart) {
  if (rolloverColumnsMissing) return;
  let q = supabaseServiceRole.from('users').update(fields).eq('id', userId);
  // Two requests can notice the new period at once. Both compute the same
  // values, but only let the first one write.
  q = expectedPeriodStart ? q.eq('credits_period_start', expectedPeriodStart) : q.is('credits_period_start', null);
  const { error } = await q;
  if (error) {
    if (isMissingColumn(error)) {
      rolloverColumnsMissing = true;
      return;
    }
    throw error;
  }
}

/** The balance goes back to 0 when a subscription ends. */
async function resetCredits(userId) {
  if (!userId || rolloverColumnsMissing) return;
  const { error } = await supabaseServiceRole
    .from('users')
    .update({ credits_rollover: 0, credits_period_start: null, credits_period_allowance: null })
    .eq('id', userId);
  if (error) {
    if (isMissingColumn(error)) {
      rolloverColumnsMissing = true;
      return;
    }
    throw error;
  }
}

/** Load the live subscription: Stripe first, then our own subscriptions row. */
async function loadSubscriptionState(userId, stripeCustomerId, subscription) {
  const subscriptionService = require('./subscriptionService');
  let sub = subscription || null;
  if (!sub && stripeCustomerId) {
    sub = await subscriptionService.getActiveSubscriptionByCustomer(stripeCustomerId);
  }
  if (sub) {
    const { periodStart, periodEnd } = subscriptionPeriod(sub);
    if (periodStart && periodEnd) {
      return {
        status: sub.status,
        periodStart,
        periodEnd,
        paused: Boolean(sub.pause_collection),
        cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
      };
    }
  }
  const { data: row } = await supabaseServiceRole
    .from('subscriptions')
    .select('status, current_period_start, current_period_end, cancel_at_period_end')
    .eq('user_id', userId)
    .in('status', ['active', 'trialing', 'past_due'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (row?.current_period_start && row?.current_period_end) {
    return {
      status: row.status,
      periodStart: toIso(row.current_period_start),
      periodEnd: toIso(row.current_period_end),
      paused: false,
      cancelAtPeriodEnd: Boolean(row.cancel_at_period_end),
    };
  }
  // Comped accounts without a Stripe subscription: fall back to the
  // usage period the rest of the app already uses.
  const { periodStart, periodEnd } = await subscriptionService.getUsagePeriod(userId);
  return { status: 'active', periodStart, periodEnd, paused: false, cancelAtPeriodEnd: false };
}

function freeState() {
  return {
    plan: 'free',
    isTrial: false,
    isPaused: false,
    cancelAtPeriodEnd: false,
    allowance: 0,
    rollover: 0,
    total: 0,
    used: 0,
    remaining: 0,
    cap: CREDIT_CAP,
    nextTopUp: 0,
    wouldLoseAtRenewal: 0,
    periodStart: null,
    periodEnd: null,
    daysUntilReset: null,
    trialCredits: TRIAL_CREDITS,
    trialDays: TRIAL_DAYS,
    freeCredits: 0,
    freeCreditDays: FREE_CREDIT_DAYS,
    freeExpiresAt: null,
    freeDaysLeft: null,
    freeExpired: false,
  };
}

/**
 * When the user's free-credit week began. Stamped once on the
 * achievements row; mergeStats in achievementsService copies the
 * existing stats first, so badge syncs keep it and clients cannot set it.
 * The week starts the first time we see the account after signup, which
 * also gives older never-paid accounts a full week when they come back.
 */
async function freeCreditsStartedAt(userId) {
  const { data: existing, error: readErr } = await supabaseServiceRole
    .from('user_achievements')
    .select('stats')
    .eq('user_id', userId)
    .maybeSingle();
  if (readErr) throw readErr;
  const stats = existing?.stats && typeof existing.stats === 'object' ? existing.stats : {};
  const stamped = stats[FREE_CREDITS_STAT_KEY];
  if (typeof stamped === 'string' && !Number.isNaN(Date.parse(stamped))) return stamped;

  const now = new Date().toISOString();
  const nextStats = { ...stats, [FREE_CREDITS_STAT_KEY]: now };
  const { error: writeErr } = existing
    ? await supabaseServiceRole
        .from('user_achievements')
        .update({ stats: nextStats, updated_at: now })
        .eq('user_id', userId)
    : await supabaseServiceRole
        .from('user_achievements')
        .insert({ user_id: userId, stats: nextStats, unlocked_badges: {}, updated_at: now });
  if (writeErr) {
    // Another request created the row first: use its stamp.
    const { data: again } = await supabaseServiceRole
      .from('user_achievements')
      .select('stats')
      .eq('user_id', userId)
      .maybeSingle();
    const raced = again?.stats?.[FREE_CREDITS_STAT_KEY];
    if (typeof raced === 'string' && !Number.isNaN(Date.parse(raced))) return raced;
    throw writeErr;
  }
  return now;
}

/** Signup time, used when the stamp cannot be read so old accounts fail closed. */
async function signupTime(userId) {
  const { data } = await supabaseServiceRole.from('users').select('created_at').eq('id', userId).maybeSingle();
  return toIso(data?.created_at);
}

/** Free accounts: FREE_CREDITS to spend within FREE_CREDIT_DAYS. */
async function freeCreditState(userId) {
  const subscriptionService = require('./subscriptionService');
  const base = freeState();
  if (FREE_CREDITS <= 0) return base;
  if (await subscriptionService.hasEverHadPaidPlan(userId)) return base;

  let start;
  try {
    start = await freeCreditsStartedAt(userId);
  } catch (err) {
    console.error('credits: free credit stamp failed, using signup time:', err);
    start = await signupTime(userId);
  }
  const startMs = start ? Date.parse(start) : NaN;
  if (Number.isNaN(startMs)) return base;

  const endMs = startMs + FREE_CREDIT_DAYS * DAY_MS;
  const end = new Date(endMs).toISOString();
  const expired = Date.now() >= endMs;
  const used = await countCreditsUsed(userId, new Date(startMs).toISOString(), end);
  return {
    ...base,
    allowance: FREE_CREDITS,
    total: FREE_CREDITS,
    used: Math.min(used, FREE_CREDITS),
    remaining: expired ? 0 : Math.max(0, FREE_CREDITS - used),
    periodStart: new Date(startMs).toISOString(),
    periodEnd: end,
    freeCredits: FREE_CREDITS,
    freeExpiresAt: end,
    freeDaysLeft: expired ? 0 : Math.max(1, Math.ceil((endMs - Date.now()) / DAY_MS)),
    freeExpired: expired,
  };
}

/**
 * Current credit balance for a user, applying any rollover that is due.
 * options.subscription: a Stripe subscription object to use instead of
 * fetching one (the webhook passes the one it received).
 */
async function getCreditState(userId, options = {}) {
  const subscriptionService = require('./subscriptionService');
  const { plan: rawPlan, stripeCustomerId } = await subscriptionService.getUserSubscriptionDetails(userId);
  const plan = subscriptionService.normalizePlanForLimits(rawPlan);
  if (!subscriptionService.isPaidSubscriptionTier(plan)) return freeCreditState(userId);

  const sub = await loadSubscriptionState(userId, stripeCustomerId, options.subscription);
  const isTrial = sub.status === 'trialing';
  const monthly = monthlyCreditsFor(plan);
  const grantNow = isTrial ? TRIAL_CREDITS : sub.paused ? 0 : monthly;

  let rollover = 0;
  let allowance = grantNow;
  const stored = await readRollover(userId);

  if (stored) {
    const storedStart = stored.credits_period_start ? toIso(stored.credits_period_start) : null;
    const storedStartMs = storedStart ? Date.parse(storedStart) : NaN;
    const currentStartMs = Date.parse(sub.periodStart);
    const storedRollover = Math.max(0, Number(stored.credits_rollover) || 0);
    const storedAllowance = Number.isFinite(Number(stored.credits_period_allowance))
      ? Number(stored.credits_period_allowance)
      : grantNow;

    if (!storedStart || Number.isNaN(storedStartMs)) {
      // First time we see this subscription: nothing to carry in.
      await writeRollover(
        userId,
        { credits_rollover: 0, credits_period_start: sub.periodStart, credits_period_allowance: grantNow },
        null
      );
    } else if (currentStartMs > storedStartMs + PERIOD_TOLERANCE_MS) {
      // New period: carry over what was left, capped so the new total is at most CREDIT_CAP.
      const usedLastPeriod = await countCreditsUsed(userId, storedStart, sub.periodStart);
      const leftover = Math.max(0, storedRollover + storedAllowance - usedLastPeriod);
      rollover = Math.max(0, Math.min(leftover, CREDIT_CAP - grantNow));
      await writeRollover(
        userId,
        { credits_rollover: rollover, credits_period_start: sub.periodStart, credits_period_allowance: grantNow },
        stored.credits_period_start
      );
    } else if (currentStartMs < storedStartMs - PERIOD_TOLERANCE_MS) {
      // The period moved backwards (a new subscription replaced an old
      // one). Start the new subscription without a carry-over.
      await writeRollover(
        userId,
        { credits_rollover: 0, credits_period_start: sub.periodStart, credits_period_allowance: grantNow },
        stored.credits_period_start
      );
    } else {
      rollover = storedRollover;
      allowance = storedAllowance;
      // Upgrading mid-period tops the period up to the bigger plan.
      // A period that started paused (allowance 0) stays at 0 until it renews.
      if (storedAllowance > 0 && grantNow > storedAllowance) {
        allowance = grantNow;
        rollover = Math.min(rollover, CREDIT_CAP - allowance);
        await writeRollover(
          userId,
          { credits_rollover: rollover, credits_period_allowance: allowance },
          stored.credits_period_start
        );
      }
    }
  }

  const total = Math.min(CREDIT_CAP, rollover + allowance);
  const used = await countCreditsUsed(userId, sub.periodStart);
  const remaining = Math.max(0, total - used);
  const nextTopUp = sub.paused || sub.cancelAtPeriodEnd ? 0 : monthly;
  const wouldLoseAtRenewal = sub.cancelAtPeriodEnd ? remaining : Math.max(0, remaining + nextTopUp - CREDIT_CAP);
  const periodEndMs = Date.parse(sub.periodEnd);
  const daysUntilReset = Number.isNaN(periodEndMs)
    ? null
    : Math.max(0, Math.ceil((periodEndMs - Date.now()) / (24 * 60 * 60 * 1000)));

  return {
    plan,
    isTrial,
    isPaused: sub.paused,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    allowance,
    rollover,
    total,
    used,
    remaining,
    cap: CREDIT_CAP,
    nextTopUp,
    wouldLoseAtRenewal,
    periodStart: sub.periodStart,
    periodEnd: sub.periodEnd,
    daysUntilReset,
    trialCredits: TRIAL_CREDITS,
    trialDays: TRIAL_DAYS,
    freeCredits: 0,
    freeCreditDays: FREE_CREDIT_DAYS,
    freeExpiresAt: null,
    freeDaysLeft: null,
    freeExpired: false,
  };
}

module.exports = {
  CREDIT_CAP,
  TRIAL_CREDITS,
  TRIAL_DAYS,
  MONTHLY_CREDITS,
  FREE_CREDITS,
  FREE_CREDIT_DAYS,
  getCreditState,
  countCreditsUsed,
  resetCredits,
  subscriptionPeriod,
};
