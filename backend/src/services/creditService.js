/**
 * Credits
 *
 * An essay analysis costs 2 credits; a study pack or a citation search
 * costs 1 (CREDIT_COSTS). Essay outlines and writing help are free and
 * have their own monthly caps (routes/writing.js).
 *   Free     FREE_CREDITS credits per calendar month (current: 4): two
 *            essay grades, or four study packs
 *   Top-ups  bought credits (TOPUP_PACKS) that last TOPUP_MONTHS months,
 *            sit outside the cap and are spent after the plan's credits
 *   Trial    retired 2026-11-01 (TRIAL_DAYS = 0); constants kept for old copy
 *   Pro      99 credits per billing period
 *   Premium  199 credits per billing period
 *
 * Free credits buy essay grades only: the grade, score, rubric and every
 * comment come back in full, and the rewrites, one-click fixes, rubric
 * check and export stay locked (see analysisRedaction.js). Study packs
 * and citation searches are Pro, so a free account cannot spend a credit
 * on them. Free grades are 200 to 10,000 words (FREE_GRADE_MIN_WORDS /
 * FREE_GRADE_MAX_WORDS) and reset on the 1st of each month (UTC).
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
// The $1 trial is retired: the front door is now a free first grade
// (FREE_CREDITS a month, no card). 0 makes checkout ignore any
// trialPeriodDays a client still sends.
const TRIAL_DAYS = 0;
const MONTHLY_CREDITS = { pro: 99, premium: 199 };
// Free credits per calendar month for accounts without a paid plan. One
// credit is one essay grade or one study pack.
// FREE_CREDITS=0 in the environment turns the free tier off.
const FREE_CREDITS = process.env.FREE_CREDITS != null && process.env.FREE_CREDITS !== '' && Number.isFinite(Number(process.env.FREE_CREDITS))
  ? Math.max(0, Math.floor(Number(process.env.FREE_CREDITS)))
  : 4;
/** What each action costs. */
const CREDIT_COSTS = { analysis: 2, study_pack: 1, citation: 1 };
// Essay analyses made before this moment (UTC) cost 1 credit, so the price
// change never re-bills work already done. ANALYSIS_COST_2_FROM moves it.
const ANALYSIS_COST_2_FROM = process.env.ANALYSIS_COST_2_FROM || '2026-12-01T00:00:00Z';
/** What an essay analysis costs right now: 1 before the price change, CREDIT_COSTS.analysis after. */
function currentAnalysisCost(now = Date.now()) {
  const cutover = Date.parse(ANALYSIS_COST_2_FROM);
  return Number.isFinite(cutover) && now < cutover ? 1 : CREDIT_COSTS.analysis;
}
/**
 * Credit top-ups: a one-off purchase for anyone with an account. Priced
 * above the plans per credit (Pro is about 20c), so a plan stays the
 * better deal for regular use.
 */
const TOPUP_PACKS = {
  small: { credits: 25, priceCents: 799 },
  large: { credits: 60, priceCents: 1499 },
};
const TOPUP_MONTHS = 12;
// Kept for the credit-state shape older clients read; the free tier no
// longer expires after a week.
const FREE_CREDIT_DAYS = 0;
// Free for finals: until this moment (UTC) free accounts get
// FINALS_FREE_CREDITS a month (9, not the usual 3) and whole essay reports. FINALS_FREE_UNTIL='' turns it off;
// any ISO date moves it.
const FINALS_FREE_UNTIL = process.env.FINALS_FREE_UNTIL != null
  ? process.env.FINALS_FREE_UNTIL
  : '2026-12-02T23:59:59Z';
const FINALS_FREE_CREDITS = 9;
const finalsFreeActive = (now = Date.now()) => {
  const end = Date.parse(FINALS_FREE_UNTIL);
  return Number.isFinite(end) && now < end;
};
// Free grades: shorter than a real essay is not worth a model call,
// longer than this is a dissertation chapter. Paid plans go to 15,000.
const FREE_GRADE_MIN_WORDS = 200;
const FREE_GRADE_MAX_WORDS = 10000;
const DAY_MS = 24 * 60 * 60 * 1000;

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
  const [analyses, citations, packs, pricedAnalyses] = await Promise.all([
    count('document_analyses'),
    count('citation_searches'),
    count('quiz_usage', (q) => q.eq('quiz_type', 'study_pack')),
    countPricedAnalyses(userId, fromIso, toIso),
  ]);
  for (const r of [analyses, citations, packs]) {
    if (r.error) throw r.error;
  }
  return (analyses.count || 0) + (citations.count || 0) + (packs.count || 0) + pricedAnalyses * (CREDIT_COSTS.analysis - 1);
}

/**
 * Essay analyses in [fromIso, toIso) that cost the full CREDIT_COSTS.analysis:
 * those made since the price change, not counting citation reviews (1 credit).
 * A failure here falls back to 0 extra, so nobody is over-billed by an error.
 */
async function countPricedAnalyses(userId, fromIso, toIso = null) {
  try {
    const cutover = Date.parse(ANALYSIS_COST_2_FROM);
    const start = Number.isFinite(cutover) && cutover > Date.parse(fromIso) ? new Date(cutover).toISOString() : fromIso;
    if (toIso && Date.parse(start) >= Date.parse(toIso)) return 0;
    let q = supabaseServiceRole
      .from('document_analyses')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', start)
      .not('analysis_type', 'in', '(citation_review,citation)');
    if (toIso) q = q.lt('created_at', toIso);
    const { count, error } = await q;
    if (error) throw error;
    return count || 0;
  } catch (err) {
    console.error('credits: priced analysis count failed:', err?.message || err);
    return 0;
  }
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
    freeResetsAt: null,
    freeExpiresAt: null,
    freeDaysLeft: null,
    freeExpired: false,
    topUp: 0,
    topUpExpiresAt: null,
    costs: CREDIT_COSTS,
  };
}

/** Start and end (exclusive) of the current calendar month, UTC. */
function currentMonthWindow(now = new Date()) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { start: start.toISOString(), end: end.toISOString() };
}

/**
 * Free credits spent in [fromIso, toIso): essay grades plus study packs.
 * Citation searches stay Pro, so they are not counted here.
 */
async function countFreeGradesUsed(userId, fromIso, toIso) {
  const window = (q) => q.eq('user_id', userId).gte('created_at', fromIso).lt('created_at', toIso);
  const [grades, packs] = await Promise.all([
    window(supabaseServiceRole.from('document_analyses').select('id', { count: 'exact', head: true })),
    window(supabaseServiceRole.from('quiz_usage').select('id', { count: 'exact', head: true }).eq('quiz_type', 'study_pack')),
  ]);
  if (grades.error) throw grades.error;
  // A missing quiz_usage table must not block essay grades.
  if (packs.error) console.error('Free study pack count failed:', packs.error.message || packs.error);
  const priced = await countPricedAnalyses(userId, fromIso, toIso);
  return (grades.count || 0) + (packs.error ? 0 : packs.count || 0) + priced * (CREDIT_COSTS.analysis - 1);
}

/* ─── Top-ups ────────────────────────────────────────────────────
   Bought credits live in credit_topups. Spending is still counted from
   the action rows, so what a period spends beyond the plan's own credits
   ("overflow") is what it drew from top-ups. Each period's draw is kept
   in credit_topup_draws, and the balance is the top-ups minus every draw,
   oldest expiry first. See migrations/20261123_credit_topups.sql. */
let topUpTablesMissing = false;
const isMissingTable = (error) => {
  const msg = `${error?.message || ''}`.toLowerCase();
  return msg.includes('credit_topup') && (msg.includes('does not exist') || msg.includes('schema cache') || msg.includes('could not find'));
};
const NO_TOPUP = { available: 0, expiresAt: null, recentMonths: 0 };

/** Top-up credits still available, after this period has drawn `overflowNow`. */
async function topUpBalance(userId, periodStart, overflowNow) {
  if (topUpTablesMissing || !userId || !periodStart) return NO_TOPUP;
  try {
    const { data: topups, error } = await supabaseServiceRole
      .from('credit_topups')
      .select('id, credits, baseline_overflow, created_at, expires_at')
      .eq('user_id', userId)
      .order('expires_at', { ascending: true });
    if (error) throw error;
    if (!Array.isArray(topups) || topups.length === 0) return NO_TOPUP;

    const drawn = Math.max(0, Math.floor(overflowNow) || 0);
    const { error: upsertError } = await supabaseServiceRole
      .from('credit_topup_draws')
      .upsert({ user_id: userId, period_start: periodStart, drawn, updated_at: new Date().toISOString() }, { onConflict: 'user_id,period_start' });
    if (upsertError) throw upsertError;
    const { data: draws, error: drawsError } = await supabaseServiceRole
      .from('credit_topup_draws')
      .select('period_start, drawn')
      .eq('user_id', userId)
      .order('period_start', { ascending: true });
    if (drawsError) throw drawsError;

    // Months in the last two with a top-up bought: Pro users buying every month may be better off on Premium.
    const since = Date.now() - 62 * 86400000;
    const recentMonths = new Set(topups.filter((t) => Date.parse(t.created_at) >= since).map((t) => String(t.created_at).slice(0, 7))).size;
    return { ...allocateTopUps(topups, draws || [], Date.now()), recentMonths };
  } catch (err) {
    if (isMissingTable(err)) {
      topUpTablesMissing = true;
      console.warn('credits: top-up tables missing — run migrations/20261123_credit_topups.sql');
    } else {
      console.error('credits: top-up balance failed:', err?.message || err);
    }
    return NO_TOPUP;
  }
}

/** Pure: take each period's draw out of the top-ups that were live then, soonest expiry first. */
function allocateTopUps(topups, draws, nowMs) {
  const left = topups.map((t) => ({
    expiresMs: Date.parse(t.expires_at),
    createdMs: Date.parse(t.created_at),
    expiresAt: t.expires_at,
    // Anything already over the plan when it was bought is not charged to the top-up.
    left: Math.max(0, Number(t.credits) || 0) + Math.max(0, Number(t.baseline_overflow) || 0),
  }));
  for (const d of draws) {
    let need = Math.max(0, Number(d.drawn) || 0);
    const periodMs = Date.parse(d.period_start);
    for (const t of left) {
      if (need <= 0) break;
      if (!(t.expiresMs > periodMs)) continue;
      const take = Math.min(t.left, need);
      t.left -= take;
      need -= take;
    }
  }
  const live = left.filter((t) => t.expiresMs > nowMs && t.left > 0);
  return {
    available: live.reduce((a, t) => a + t.left, 0),
    expiresAt: live.length ? live[0].expiresAt : null,
  };
}

/** Add bought credits to an account. Safe to call twice for one Stripe session. */
async function grantTopUp(userId, pack, stripeSessionId) {
  const def = TOPUP_PACKS[pack];
  if (!userId || !def || !stripeSessionId) return { granted: false, reason: 'invalid' };
  const { data: existing, error: findError } = await supabaseServiceRole
    .from('credit_topups')
    .select('id')
    .eq('stripe_session_id', stripeSessionId)
    .maybeSingle();
  if (findError) throw findError;
  if (existing) return { granted: false, reason: 'already', credits: def.credits };

  // What this period is already over by is not the top-up's to pay for.
  let baseline = 0;
  try {
    const state = await getCreditState(userId);
    baseline = Math.max(0, (state.spent ?? state.used ?? 0) - (state.total || 0));
  } catch { /* a failed read just means no baseline */ }

  const expires = new Date();
  expires.setUTCMonth(expires.getUTCMonth() + TOPUP_MONTHS);
  const { error } = await supabaseServiceRole.from('credit_topups').insert({
    user_id: userId,
    credits: def.credits,
    baseline_overflow: baseline,
    pack,
    amount_cents: def.priceCents,
    stripe_session_id: stripeSessionId,
    expires_at: expires.toISOString(),
  });
  // A second request that lost the race hits the unique session id.
  if (error && !`${error.message || ''}`.toLowerCase().includes('duplicate')) throw error;
  return { granted: !error, credits: def.credits, expiresAt: expires.toISOString() };
}

/**
 * Accounts without a paid plan: FREE_CREDITS credits per calendar month,
 * spent on essay grades or study packs. Lapsed subscribers get the same allowance as anyone else, so
 * there is always a reason to come back.
 */
async function freeCreditState(userId) {
  const base = freeState();
  if (FREE_CREDITS <= 0) return base;

  const { start, end } = currentMonthWindow();
  const used = await countFreeGradesUsed(userId, start, end);
  const daysUntilReset = Math.max(1, Math.ceil((Date.parse(end) - Date.now()) / DAY_MS));
  const allowance = finalsFreeActive() ? Math.max(FREE_CREDITS, FINALS_FREE_CREDITS) : FREE_CREDITS;
  const topUp = await topUpBalance(userId, start, Math.max(0, used - allowance));
  return {
    ...base,
    allowance,
    total: allowance,
    spent: used,
    used: Math.min(used, allowance),
    remaining: Math.max(0, allowance - used) + topUp.available,
    topUp: topUp.available,
    topUpExpiresAt: topUp.expiresAt,
    topUpMonths: topUp.recentMonths || 0,
    analysisCost: currentAnalysisCost(),
    periodStart: start,
    periodEnd: end,
    daysUntilReset,
    freeCredits: allowance,
    finalsFreeUntil: finalsFreeActive() ? FINALS_FREE_UNTIL : null,
    freeResetsAt: end,
    freeExpiresAt: null,
    freeDaysLeft: null,
    freeExpired: false,
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
  const topUp = await topUpBalance(userId, sub.periodStart, Math.max(0, used - total));
  const planRemaining = Math.max(0, total - used);
  const remaining = planRemaining + topUp.available;
  const nextTopUp = sub.paused || sub.cancelAtPeriodEnd ? 0 : monthly;
  // Top-ups are outside the cap and survive a renewal or a cancellation.
  const wouldLoseAtRenewal = sub.cancelAtPeriodEnd ? planRemaining : Math.max(0, planRemaining + nextTopUp - CREDIT_CAP);
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
    spent: used,
    used: Math.min(used, total),
    remaining,
    topUp: topUp.available,
    topUpExpiresAt: topUp.expiresAt,
    topUpMonths: topUp.recentMonths || 0,
    analysisCost: currentAnalysisCost(),
    costs: CREDIT_COSTS,
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
  FREE_GRADE_MIN_WORDS,
  FREE_GRADE_MAX_WORDS,
  FINALS_FREE_UNTIL,
  FINALS_FREE_CREDITS,
  finalsFreeActive,
  CREDIT_COSTS,
  currentAnalysisCost,
  TOPUP_PACKS,
  TOPUP_MONTHS,
  allocateTopUps,
  grantTopUp,
  currentMonthWindow,
  getCreditState,
  countCreditsUsed,
  resetCredits,
  subscriptionPeriod,
};
