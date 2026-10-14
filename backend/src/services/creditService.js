/**
 * Credits
 *
 * Every essay analysis, study pack and citation search costs 1 credit.
 *   Trial    3 credits (3-day trial)
 *   Pro      99 credits per billing period
 *   Premium  199 credits per billing period
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
const TRIAL_CREDITS = 3;
const TRIAL_DAYS = 3;
const MONTHLY_CREDITS = { pro: 99, premium: 199 };

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
  if (!subscriptionService.isPaidSubscriptionTier(plan)) return freeState();

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
  };
}

module.exports = {
  CREDIT_CAP,
  TRIAL_CREDITS,
  TRIAL_DAYS,
  MONTHLY_CREDITS,
  getCreditState,
  countCreditsUsed,
  resetCredits,
  subscriptionPeriod,
};
