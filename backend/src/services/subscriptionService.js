const { createClient } = require('@supabase/supabase-js');
const { query } = require('../database/connection');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Service role client for trial_usage (bypasses RLS; trial_usage must never be blocked)
const supabaseServiceRole = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

// Plan limits configuration
// Study packs: one generation creates quiz + flashcards + crossword + lesson + crater blast
const PLAN_LIMITS = {
  free: {
    documentsPerMonth: 3,
    maxDocuments: 3, // hard cap on TOTAL documents owned (not monthly)
    // TWO lifetime analyses + TWO study packs — enough to feel the
    // product twice (onboarding + a second real run) before the ask.
    analysesPerMonth: 2,
    citationSearchesPerMonth: 1,
    humanizeWordsPerMonth: 5000,
    summarizeWordsPerMonth: 5000,
    studyPackGenerationsPerMonth: 2,
    studyPackMaxWordsPerGeneration: 5000,
    quizWordsPerMonth: 15000,
    quizGenerationsPerMonth: 1,
    quizMaxWordsPerGeneration: 5000,
    craterBlastMaxWordsPerGeneration: 5000,
    lessonWordsPerMonth: 5000,
    lessonGenerationsPerMonth: 2,
    lessonMaxWordsPerGeneration: 5000,
    aiModel: 'gpt-4.1-nano',
    maxDocumentSize: 2 * 1024 * 1024,
    maxTotalStorage: 2 * 1024 * 1024,
    name: 'Free'
  },
  pro: {
    documentsPerMonth: -1,
    maxDocuments: 99, // hard cap on TOTAL documents owned
    combinedActionsPerMonth: 99, // analyses + study packs + citations share this pool
    combinedWordsPerMonth: 999999, // Paper Summarizer word pool
    analysesPerMonth: 99, // used for combined check
    citationSearchesPerMonth: 99,
    humanizeWordsPerMonth: 999999,
    summarizeWordsPerMonth: 999999,
    studyPackGenerationsPerMonth: 99,
    studyPackMaxWordsPerGeneration: 10000,
    quizWordsPerMonth: 999999,
    quizGenerationsPerMonth: 99,
    quizMaxWordsPerGeneration: 10000,
    craterBlastMaxWordsPerGeneration: 10000,
    lessonWordsPerMonth: 999999,
    lessonGenerationsPerMonth: 99,
    lessonMaxWordsPerGeneration: 10000,
    // Essay analysis uses OPENAI_PREMIUM_MODEL (default gpt-5.6-luna)
    aiModel: 'gpt-5.6-luna',
    maxDocumentSize: 100 * 1024 * 1024, // 100MB per file
    maxTotalStorage: 100 * 1024 * 1024, // 100MB total library storage
    name: 'Pro',
    price: 19.99
  },
  premium: {
    documentsPerMonth: -1,
    maxDocuments: 99, // hard cap on TOTAL documents owned
    combinedActionsPerMonth: 499,
    combinedWordsPerMonth: 4999999,
    analysesPerMonth: 499,
    citationSearchesPerMonth: 499,
    humanizeWordsPerMonth: 4999999,
    summarizeWordsPerMonth: 4999999,
    studyPackGenerationsPerMonth: 499,
    studyPackMaxWordsPerGeneration: 10000,
    quizWordsPerMonth: 4999999,
    quizGenerationsPerMonth: 499,
    quizMaxWordsPerGeneration: 10000,
    craterBlastMaxWordsPerGeneration: 10000,
    lessonWordsPerMonth: 4999999,
    lessonGenerationsPerMonth: 499,
    lessonMaxWordsPerGeneration: 10000,
    aiModel: 'gpt-5.6-luna',
    maxDocumentSize: 100 * 1024 * 1024,
    maxTotalStorage: 1024 * 1024 * 1024, // 1GB library total
    name: 'Premium',
    price: 39.99
  },
};

/**
 * Freemium preview model: the three AI preview features (analyses, citation
 * searches, study packs) are ONE-TIME tastes for free users — counted over
 * the account's lifetime, never resetting. Monthly resets train free users
 * to ration instead of upgrading. Documents / summarizer word pools keep
 * their rolling 30-day periods (writing is the funnel into paid analysis).
 * Set to false to restore rolling 30-day resets for everything.
 */
const FREE_PREVIEW_LIFETIME = true;
const FREE_LIFETIME_EPOCH = '1970-01-01T00:00:00.000Z';
const LIFETIME_PREVIEW_LIMIT_TYPES = new Set([
  'analysesPerMonth',
  'citationSearchesPerMonth',
  'studyPackGenerationsPerMonth',
]);

/** Map legacy / alternate SKU names to canonical limit keys: free | pro | premium */
function normalizePlanForLimits(plan) {
  const p = (plan || 'free').toLowerCase();
  if (p === 'starter' || p === 'focus') return 'pro';
  if (p === 'premium') return 'premium';
  return p;
}

/** True when the user should receive paid-tier limits (Pro or Premium). */
function isPaidSubscriptionTier(plan) {
  const n = normalizePlanForLimits(plan);
  return n === 'pro' || n === 'premium';
}


// Get user's plan string (free, pro, premium) - for retention policies etc.
const getUserPlan = async (userId) => {
  const { plan } = await getUserSubscriptionDetails(userId);
  return plan || 'free';
};

// Get user's subscription details
// IMPORTANT: Uses supabaseServiceRole to bypass RLS. The anon client cannot read users table
// when RLS is enabled (migration 023); that caused all users to appear as 'free'.
const getUserSubscriptionDetails = async (userId) => {
  try {
    const { data: user, error } = await supabaseServiceRole
      .from('users')
      .select('subscription_plan, stripe_customer_id')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user subscription:', error);
      return { plan: 'free', stripeCustomerId: null };
    }

    let plan = user.subscription_plan || 'free';
    if (plan === 'starter') plan = 'pro'; // backward compat
    return {
      plan,
      stripeCustomerId: user.stripe_customer_id
    };
  } catch (error) {
    console.error('Error in getUserSubscriptionDetails:', error);
    return { plan: 'free', stripeCustomerId: null };
  }
};

/**
 * Get the current usage period start and end for a user.
 * - Paid (pro/premium): uses subscription current_period_start/end from Stripe
 * - Free: rolling period from signup (reset on same calendar day each month, e.g. Mar 4 → Apr 4)
 * - Fallback: calendar month (legacy users, missing created_at)
 */
const getUsagePeriod = async (userId) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  try {
    const { plan, stripeCustomerId } = await getUserSubscriptionDetails(userId);

    if (isPaidSubscriptionTier(plan)) {
      let periodStart = null;
      let periodEnd = null;

      // 1. Prefer Stripe as source of truth when we have customer ID (avoids stale Supabase data)
      let customerId = stripeCustomerId;
      if (!customerId) {
        const { data: u } = await supabaseServiceRole.from('users').select('stripe_customer_id').eq('id', userId).single();
        customerId = u?.stripe_customer_id;
      }
      if (customerId) {
        const stripeSub = await getActiveSubscriptionByCustomer(customerId);
        if (stripeSub?.current_period_start) {
          periodStart = new Date(stripeSub.current_period_start * 1000).toISOString();
          periodEnd = new Date(stripeSub.current_period_end * 1000).toISOString();
        }
      }

      // 2. Fallback to Supabase if Stripe didn't return data
      if (!periodStart) {
        const { data: sub, error } = await supabaseServiceRole
          .from('subscriptions')
          .select('current_period_start, current_period_end')
          .eq('user_id', userId)
          .in('status', ['active', 'trialing'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && sub?.current_period_start) {
          periodStart = typeof sub.current_period_start === 'string'
            ? sub.current_period_start
            : new Date(sub.current_period_start).toISOString();
          periodEnd = typeof sub.current_period_end === 'string'
            ? sub.current_period_end
            : new Date(sub.current_period_end).toISOString();
        }
      }

      if (periodStart && periodEnd) {
        const periodEndDate = new Date(periodEnd);
        const daysUntilReset = Math.max(0, Math.ceil((periodEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        return { periodStart, periodEnd, daysUntilReset };
      }
    }

    // Free users: rolling 30-day periods from signup (NOT calendar month)
    // e.g. signed up March 4 → period 1: Mar 4–Apr 3, period 2: Apr 4–May 3, reset Apr 4
    const MS_PER_30_DAYS = 30 * 24 * 60 * 60 * 1000;
    let anchorDate = null;

    // 1. Try users.created_at (created_at is standard for app signups)
    const { data: userRow, error: userError } = await supabaseServiceRole
      .from('users')
      .select('created_at')
      .eq('id', userId)
      .maybeSingle();
    if (!userError && userRow?.created_at) {
      const d = new Date(userRow.created_at);
      if (!isNaN(d.getTime())) anchorDate = d;
    }

    // 2. Fallback: auth.users.created_at (Supabase Auth always has signup date)
    if (!anchorDate) {
      try {
        const { data: authData, error: authErr } = await supabaseServiceRole.auth.admin.getUserById(userId);
        if (!authErr && authData?.user?.created_at) {
          const d = new Date(authData.user.created_at);
          if (!isNaN(d.getTime())) anchorDate = d;
        }
      } catch (_) {}
      // Fallback: RPC reads auth.users via SECURITY DEFINER (works when admin API unavailable)
      if (!anchorDate) {
        try {
          const { data: authCreated, error: rpcErr } = await supabaseServiceRole.rpc('get_auth_user_created_at', { user_uuid: userId });
          if (!rpcErr && authCreated) {
            const d = new Date(authCreated);
            if (!isNaN(d.getTime())) anchorDate = d;
          }
        } catch (_) {}
      }
    }

    // 3. Fallback: earliest activity as proxy (legacy users, missing created_at everywhere)
    if (!anchorDate) {
      const [q, d, a] = await Promise.all([
        supabaseServiceRole.from('quiz_usage').select('created_at').eq('user_id', userId).order('created_at', { ascending: true }).limit(1).maybeSingle(),
        supabaseServiceRole.from('documents').select('created_at').eq('user_id', userId).order('created_at', { ascending: true }).limit(1).maybeSingle(),
        supabaseServiceRole.from('document_analyses').select('created_at').eq('user_id', userId).order('created_at', { ascending: true }).limit(1).maybeSingle(),
      ]);
      const dates = [q?.data?.created_at, d?.data?.created_at, a?.data?.created_at].filter(Boolean);
      if (dates.length) {
        const earliest = new Date(dates.sort((x, y) => new Date(x) - new Date(y))[0]);
        if (!isNaN(earliest.getTime())) anchorDate = earliest;
      }
    }

    if (anchorDate) {
      const elapsed = now.getTime() - anchorDate.getTime();
      const periodsElapsed = Math.floor(elapsed / MS_PER_30_DAYS);
      const periodStartDate = new Date(anchorDate.getTime() + periodsElapsed * MS_PER_30_DAYS);
      const periodEndDate = new Date(periodStartDate.getTime() + MS_PER_30_DAYS);
      const periodStart = periodStartDate.toISOString();
      const periodEnd = periodEndDate.toISOString();
      const daysUntilReset = Math.max(0, Math.ceil((periodEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      return { periodStart, periodEnd, daysUntilReset };
    }
  } catch (err) {
    console.error('getUsagePeriod error:', err);
  }

  // Fallback: calendar month
  const daysUntilReset = Math.ceil((endOfMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return {
    periodStart: startOfMonth.toISOString(),
    periodEnd: endOfMonth.toISOString(),
    daysUntilReset: Math.max(0, daysUntilReset)
  };
};

// Check if user has exceeded a specific limit
const checkLimit = async (userId, limitType) => {
  try {
    const { plan } = await getUserSubscriptionDetails(userId);
    const effPlan = normalizePlanForLimits(plan);
    const planLimits = PLAN_LIMITS[effPlan] || PLAN_LIMITS.free;
    
    if (planLimits[limitType] === -1) {
      return { allowed: true, limit: -1, usage: 0, remaining: -1 };
    }

    // Free preview features never reset — count lifetime usage.
    const lifetimePreview =
      FREE_PREVIEW_LIFETIME &&
      effPlan === 'free' &&
      LIFETIME_PREVIEW_LIMIT_TYPES.has(limitType);

    const { periodStart, periodEnd, daysUntilReset } = lifetimePreview
      ? { periodStart: FREE_LIFETIME_EPOCH, periodEnd: null, daysUntilReset: null }
      : await getUsagePeriod(userId);
    
    // Use service role key to bypass RLS for limit checking
    // This is safe because we've already authenticated the user
    const { createClient } = require('@supabase/supabase-js');
    const supabaseServiceRole = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    );
    
    let usage = 0;
    
    if (limitType === 'documentsPerMonth') {
      const { data: documents, error } = await supabaseServiceRole
        .from('documents')
        .select('id')
        .eq('user_id', userId)
        .gte('created_at', periodStart);
      
      if (!error) {
        usage = documents.length;
      }
    } else if (limitType === 'analysesPerMonth') {
      const { data: analyses, error} = await supabaseServiceRole
        .from('document_analyses')
        .select('id')
        .eq('user_id', userId)
        .gte('created_at', periodStart);
      
      if (!error) {
        usage = analyses.length;
      }
    } else if (limitType === 'citationSearchesPerMonth') {
      const { data: citationSearches, error } = await supabaseServiceRole
        .from('citation_searches')
        .select('id')
        .eq('user_id', userId)
        .gte('created_at', periodStart);
      
      if (!error) {
        usage = citationSearches ? citationSearches.length : 0;
      }
    }

    const limit = planLimits[limitType];
    const remaining = Math.max(0, limit - usage);
    const allowed = usage < limit;

    return {
      allowed,
      limit,
      usage,
      remaining,
      planLimits,
      periodEnd,
      daysUntilReset
    };
  } catch (error) {
    console.error('Error checking limit:', error);
    return { allowed: true, limit: -1, usage: 0, remaining: -1 };
  }
};

// Get remaining usage for a specific limit
const getRemainingUsage = async (userId, limitType) => {
  const result = await checkLimit(userId, limitType);
  return result.remaining;
};

// For Pro/Premium: combined pool of analyses + study packs + citations
const checkCombinedActionsLimit = async (userId) => {
  try {
    const { plan } = await getUserSubscriptionDetails(userId);
    const effPlan = normalizePlanForLimits(plan);
    const planLimits = PLAN_LIMITS[effPlan] || PLAN_LIMITS.free;
    const limit = planLimits.combinedActionsPerMonth;
    if (!limit || limit === -1 || !isPaidSubscriptionTier(effPlan)) {
      return { allowed: true, limit: -1, usage: 0, remaining: -1 };
    }
    const { periodStart } = await getUsagePeriod(userId);
    const [analyses, citations, studyPacks] = await Promise.all([
      supabaseServiceRole.from('document_analyses').select('id').eq('user_id', userId).gte('created_at', periodStart),
      supabaseServiceRole.from('citation_searches').select('id').eq('user_id', userId).gte('created_at', periodStart),
      supabaseServiceRole.from('quiz_usage').select('id').eq('user_id', userId).eq('quiz_type', 'study_pack').gte('created_at', periodStart)
    ]);
    const used = (analyses.data?.length || 0) + (citations.data?.length || 0) + (studyPacks.data?.length || 0);
    const remaining = Math.max(0, limit - used);
    return { allowed: used < limit, limit, usage: used, remaining };
  } catch (err) {
    console.error('checkCombinedActionsLimit:', err);
    return { allowed: true, limit: -1, usage: 0, remaining: -1 };
  }
};

// For Pro/Premium: Paper Summarizer word pool
const checkCombinedWordsLimit = async (userId, additionalWords = 0) => {
  try {
    const { plan } = await getUserSubscriptionDetails(userId);
    const effPlan = normalizePlanForLimits(plan);
    const planLimits = PLAN_LIMITS[effPlan] || PLAN_LIMITS.free;
    const limit = planLimits.combinedWordsPerMonth;
    if (!limit || limit === -1 || !isPaidSubscriptionTier(effPlan)) {
      return { allowed: true, limit: -1, usage: 0, remaining: -1 };
    }
    const { periodStart } = await getUsagePeriod(userId);
    const [humanizeData, summarizeData] = await Promise.all([
      supabaseServiceRole.from('humanize_usage').select('words_count').eq('user_id', userId).gte('created_at', periodStart),
      supabaseServiceRole.from('summarize_usage').select('words_count').eq('user_id', userId).gte('created_at', periodStart)
    ]);
    const humanizeWords = (humanizeData.data || []).reduce((s, r) => s + (r.words_count || 0), 0);
    const summarizeWords = (summarizeData.data || []).reduce((s, r) => s + (r.words_count || 0), 0);
    const used = humanizeWords + summarizeWords;
    const remaining = Math.max(0, limit - used);
    const allowed = used + additionalWords <= limit;
    return { allowed, limit, usage: used, remaining };
  } catch (err) {
    console.error('checkCombinedWordsLimit:', err);
    return { allowed: true, limit: -1, usage: 0, remaining: -1 };
  }
};

// Get plan details
const getPlanDetails = (plan) => {
  return PLAN_LIMITS[normalizePlanForLimits(plan)] || PLAN_LIMITS.free;
};

// Get plan limits for a user
const getPlanLimits = async (userId) => {
  try {
    const { plan } = await getUserSubscriptionDetails(userId);
    return PLAN_LIMITS[normalizePlanForLimits(plan)] || PLAN_LIMITS.free;
  } catch (error) {
    console.error('Error getting plan limits:', error);
    return PLAN_LIMITS.free;
  }
};

/** First-time $10 off (OFF10) on Pro/Premium: still allowed after user forfeits the 7-day trial (`trial_plan: declined`). */
const checkOff10Eligibility = async (email) => {
  try {
    const normalizedEmail = email.toLowerCase().trim();

    const { data: row, error } = await supabaseServiceRole
      .from('trial_usage')
      .select('trial_plan')
      .ilike('email', normalizedEmail)
      .limit(1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking OFF10 eligibility:', error);
      return { eligible: false, reason: 'Error checking eligibility' };
    }

    if (!row) {
      return { eligible: true };
    }

    if (row.trial_plan === 'declined') {
      return { eligible: true };
    }

    if (row.trial_plan === 'pro' || row.trial_plan === 'premium') {
      return {
        eligible: false,
        reason: 'First-time discount already used',
      };
    }

    return { eligible: false, reason: 'Not eligible for first-time discount' };
  } catch (err) {
    console.error('Error in checkOff10Eligibility:', err);
    return { eligible: false, reason: 'Error checking eligibility' };
  }
};

// 7-day Stripe trial: not available if any trial_usage row exists (including declined/forfeited).
// Returns true if eligible, false if they've already interacted with trial/discount tracking
const checkTrialEligibility = async (email) => {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    
    // Check if this email has ever used a trial (service role bypasses RLS)
    const { data: existingTrial, error } = await supabaseServiceRole
      .from('trial_usage')
      .select('id, trial_started_at')
      .ilike('email', normalizedEmail)
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found, which is what we want
      console.error('Error checking trial eligibility:', error);
      // On error, be conservative and don't give trial
      return { eligible: false, reason: 'Error checking eligibility' };
    }

    if (existingTrial) {
      return {
        eligible: false,
        reason: 'This email is not eligible for a free trial period',
        previousTrialDate: existingTrial.trial_started_at,
      };
    }

    return { eligible: true };
  } catch (error) {
    console.error('Error in checkTrialEligibility:', error);
    return { eligible: false, reason: 'Error checking eligibility' };
  }
};

// True if the user has EVER had a subscription row (trial OR paid, any status).
// Backstop for trial eligibility: legacy accounts that subscribed BEFORE the
// trial_usage table existed (migration 011) and have since churned back to
// free have a `subscriptions` row but no `trial_usage` row — they must NOT be
// offered a new trial / shown the trial paywall again. The `subscriptions` row
// is only written on the `customer.subscription.created` webhook (a real
// trial/paid subscription), so abandoned checkouts never count here.
/**
 * True if this account has ever been on a paid plan. Used so library
 * items (documents, study packs, citations) stay forever after the
 * first paid month — even if they later cancel back to Free.
 */
const userKeepsLibraryForever = async (userId) => {
  if (!userId) return false;
  try {
    const { plan } = await getUserSubscriptionDetails(userId);
    if (isPaidSubscriptionTier(plan)) return true;
  } catch { /* fall through */ }
  try {
    const result = await query(
      `SELECT 1 FROM subscriptions
       WHERE user_id = $1
         AND lower(status) IN ('active','trialing','canceled','cancelled','past_due','paused','unpaid')
       LIMIT 1`,
      [userId],
    );
    if (result.rows.length > 0) return true;
  } catch (err) {
    console.error('Error checking subscription history for library retention:', err);
  }
  try {
    const { data } = await supabaseServiceRole
      .from('users')
      .select('paid_conversion_fired_at')
      .eq('id', userId)
      .maybeSingle();
    if (data?.paid_conversion_fired_at) return true;
  } catch { /* ignore */ }
  return false;
};

let freeLibraryExpiryColumnMissing = false;

/**
 * Never-paid Free users: existing library rows stay (expires_at null)
 * until they next use the app. Then we stamp a 30-day window so items
 * are not deleted while they are away. Idempotent via
 * users.free_library_expiry_started_at.
 */
const startFreeLibraryExpiryClock = async (userId, userRow = null) => {
  if (!userId || freeLibraryExpiryColumnMissing) return;
  if (userRow && userRow.free_library_expiry_started_at) return;

  const columnMissing = (err) => {
    const msg = `${err?.message || ''}`.toLowerCase();
    return msg.includes('free_library_expiry_started_at');
  };

  try {
    const { data: fresh, error: readErr } = await supabaseServiceRole
      .from('users')
      .select('free_library_expiry_started_at')
      .eq('id', userId)
      .maybeSingle();
    if (readErr) {
      if (columnMissing(readErr)) {
        freeLibraryExpiryColumnMissing = true;
        return;
      }
      throw readErr;
    }
    if (fresh?.free_library_expiry_started_at) return;

    const now = new Date().toISOString();
    const keepForever = await userKeepsLibraryForever(userId);
    if (!keepForever) {
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      await Promise.all([
        supabaseServiceRole.from('documents').update({ expires_at: expiresAt, updated_at: now }).eq('user_id', userId).is('expires_at', null),
        supabaseServiceRole.from('quizzes').update({ expires_at: expiresAt }).eq('user_id', userId).is('expires_at', null),
        supabaseServiceRole.from('citation_searches').update({ expires_at: expiresAt }).eq('user_id', userId).is('expires_at', null),
        supabaseServiceRole.from('lesson_plans').update({ expires_at: expiresAt }).eq('user_id', userId).is('expires_at', null),
      ]);
    }

    const { error: flagErr } = await supabaseServiceRole
      .from('users')
      .update({ free_library_expiry_started_at: now })
      .eq('id', userId)
      .is('free_library_expiry_started_at', null);
    if (flagErr) {
      if (columnMissing(flagErr)) {
        freeLibraryExpiryColumnMissing = true;
        return;
      }
      console.error('Error marking library expiry clock started:', flagErr);
    }
  } catch (err) {
    console.error('Error starting free library expiry clock:', err);
  }
};

const hasEverSubscribed = async (userId) => {
  if (!userId) return false;
  try {
    const result = await query('SELECT 1 FROM subscriptions WHERE user_id = $1 LIMIT 1', [userId]);
    return result.rows.length > 0;
  } catch (err) {
    console.error('Error in hasEverSubscribed:', err);
    // Fall back to the trial_usage signal (don't suppress the paywall on a
    // transient DB error — that would let it leak away for everyone).
    return false;
  }
};

// Record that an email has used the first-time offer (prevents OFF10 reuse)
const recordTrialUsage = async (email, stripeCustomerId, planType) => {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    const now = new Date().toISOString();
    const row = {
      email: normalizedEmail,
      stripe_customer_id: stripeCustomerId,
      trial_plan: planType,
      trial_started_at: now
    };

    const { data: existing, error: selErr } = await supabaseServiceRole
      .from('trial_usage')
      .select('id')
      .ilike('email', normalizedEmail)
      .limit(1)
      .maybeSingle();

    if (selErr && selErr.code !== 'PGRST116') {
      console.error('Error looking up trial_usage:', selErr);
    }

    if (existing?.id) {
      const { error: upErr } = await supabaseServiceRole
        .from('trial_usage')
        .update({
          stripe_customer_id: stripeCustomerId,
          trial_plan: planType,
          trial_started_at: now
        })
        .eq('id', existing.id);
      if (upErr) {
        console.error('Error updating trial usage:', upErr);
        return { success: false, error: upErr.message };
      }
      return { success: true, updated: true };
    }

    const { error } = await supabaseServiceRole.from('trial_usage').insert(row);

    if (error) {
      if (error.code === '23505') {
        return { success: true, alreadyRecorded: true };
      }
      console.error('Error recording trial usage:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in recordTrialUsage:', error);
    return { success: false, error: error.message };
  }
};

/** User explicitly gave up the one-time 7-day trial (e.g. after canceling Stripe from tutorial). Blocks future trial for this email. */
const recordTrialDecline = async (email) => {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    const { data: existing } = await supabaseServiceRole
      .from('trial_usage')
      .select('id')
      .ilike('email', normalizedEmail)
      .limit(1)
      .maybeSingle();

    if (existing?.id) {
      return { success: true, alreadyRecorded: true };
    }

    const { error } = await supabaseServiceRole.from('trial_usage').insert({
      email: normalizedEmail,
      stripe_customer_id: null,
      trial_plan: 'declined',
      trial_started_at: new Date().toISOString()
    });

    if (error) {
      if (error.code === '23505') {
        return { success: true, alreadyRecorded: true };
      }
      console.error('Error recording trial decline:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (error) {
    console.error('Error in recordTrialDecline:', error);
    return { success: false, error: error.message };
  }
};

// Create Stripe customer
const createStripeCustomer = async (email, name) => {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        source: 'writescholar'
      }
    });
    return { success: true, customerId: customer.id };
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    return { success: false, error: error.message };
  }
};

// Create checkout session
// options.trialPeriodDays: e.g. 7 — free trial before billing.
// Optional promoCode in the request applies that Stripe promotion code at checkout.
const createCheckoutSession = async (
  customerId,
  planType,
  billingCycle,
  userId,
  promoCode = null,
  userEmail = null,
  successUrl = null,
  cancelUrl = null,
  options = {}
) => {
  try {
    let trialPeriodDays =
      typeof options.trialPeriodDays === 'number' && options.trialPeriodDays > 0
        ? Math.min(30, Math.floor(options.trialPeriodDays))
        : 0;

    if (trialPeriodDays > 0 && userEmail) {
      const eligibility = await checkTrialEligibility(userEmail);
      if (!eligibility.eligible) {
        trialPeriodDays = 0;
      }
    }

    const effectivePromo = promoCode;

    // Get price ID based on plan and billing cycle
    const priceId = getPriceId(planType, billingCycle);
    
    // Use provided URLs or fallback to defaults
    const finalSuccessUrl = successUrl || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?payment=success`;
    const finalCancelUrl = cancelUrl || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?payment=cancelled`;
    
    const embedded = options.embedded === true;
    const embeddedReturnUrl =
      (typeof options.returnUrl === 'string' && options.returnUrl.trim()) ||
      `${process.env.FRONTEND_URL || 'http://localhost:5173'}/onboarding?session_id={CHECKOUT_SESSION_ID}`;

    const sessionConfig = {
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      subscription_data: {
        metadata: {
          userId,
          planType,
          billingCycle,
          source: 'writescholar'
        },
        ...(trialPeriodDays > 0 ? { trial_period_days: trialPeriodDays } : {})
      },
      metadata: {
        userId: String(userId),
        planType,
        billingCycle,
        source: 'writescholar'
      },
      // Allow customers to enter promo codes at checkout
      allow_promotion_codes: true
    };

    if (embedded) {
      sessionConfig.ui_mode = 'embedded';
      sessionConfig.return_url = embeddedReturnUrl;
    } else {
      sessionConfig.success_url = finalSuccessUrl;
      sessionConfig.cancel_url = finalCancelUrl;
    }

    // If a specific promo code is provided in the request, apply it directly
    if (effectivePromo) {
      try {
        // Find the promotion code in Stripe
        const promoCodes = await stripe.promotionCodes.list({
          code: effectivePromo,
          active: true,
          limit: 1
        });

        if (promoCodes.data.length > 0) {
          // Stripe does not allow both `discounts` and `allow_promotion_codes` simultaneously
          delete sessionConfig.allow_promotion_codes;
          sessionConfig.discounts = [{
            promotion_code: promoCodes.data[0].id
          }];
        } else {
          console.warn(`Promo code "${effectivePromo}" not found or inactive`);
        }
      } catch (promoError) {
        console.error('Error applying promo code:', promoError);
        // Continue without promo code if there's an error
      }
    }
    
    const session = await stripe.checkout.sessions.create(sessionConfig);

    return {
      success: true,
      sessionId: session.id,
      url: embedded ? null : session.url,
      clientSecret: embedded ? session.client_secret : null
    };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return { success: false, error: error.message };
  }
};

// Get price ID based on plan and billing cycle
const getPriceId = (planType, billingCycle) => {
  let planKey = planType === 'starter' ? 'pro' : planType;
  if (planKey !== 'pro' && planKey !== 'premium') {
    throw new Error(`Invalid plan type or billing cycle: ${planType}/${billingCycle}`);
  }
  const prices = {
    pro: {
      monthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || 'price_starter_monthly',
      yearly: process.env.STRIPE_STARTER_YEARLY_PRICE_ID || 'price_starter_yearly'
    },
    premium: {
      monthly: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID || 'price_premium_monthly',
      yearly: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID || 'price_premium_yearly'
    }
  };

  const priceId = prices[planKey]?.[billingCycle];
  if (!priceId) {
    throw new Error(`Invalid plan type or billing cycle: ${planType}/${billingCycle}`);
  }

  return priceId;
};

// Get subscription details from Stripe
const getStripeSubscription = async (subscriptionId) => {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return { success: true, subscription };
  } catch (error) {
    console.error('Error fetching Stripe subscription:', error);
    return { success: false, error: error.message };
  }
};

// List active subscriptions for a Stripe customer (fallback when DB is out of sync)
const getActiveSubscriptionByCustomer = async (stripeCustomerId) => {
  if (!stripeCustomerId) return null;
  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'active',
      limit: 1
    });
    if (subscriptions.data?.[0]) return subscriptions.data[0];
    // Also check trialing
    const trialing = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'trialing',
      limit: 1
    });
    return trialing.data?.[0] || null;
  } catch (error) {
    console.error('Error listing Stripe subscriptions:', error);
    return null;
  }
};

// Update subscription in Stripe
const updateStripeSubscription = async (subscriptionId, newPriceId) => {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: subscription.items.data[0].id,
        price: newPriceId,
      }],
      proration_behavior: 'create_prorations',
    });
    
    return { success: true, subscription: updatedSubscription };
  } catch (error) {
    console.error('Error updating Stripe subscription:', error);
    return { success: false, error: error.message };
  }
};

// Cancel subscription in Stripe
// Schedule cancellation at the end of the current billing period.
// The subscription stays `active` (with cancel_at_period_end: true) so the user
// keeps access until current_period_end, at which point Stripe fires
// `customer.subscription.deleted` and the webhook downgrades them to free.
const cancelStripeSubscription = async (subscriptionId) => {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
    return { success: true, subscription };
  } catch (error) {
    console.error('Error canceling Stripe subscription:', error);
    return { success: false, error: error.message };
  }
};

/* ─── Pause a subscription for N days ───
 *  Used by the cancellation retention flow ("Need a break? Pause for
 *  30 days?"). Uses Stripe's pause_collection with behavior='void',
 *  which stops billing during the pause window — Stripe still tracks
 *  the subscription as active, and resumes collecting on resumes_at.
 *
 *  We DON'T toggle the user's access during the pause — the user
 *  keeps Pro features for the duration. That's the deal: pause = no
 *  charge, keep using the product, come back to billing later. If you
 *  want to revoke access during a pause, switch behavior='void' to
 *  'keep_as_draft' and gate access on subscription_status.
 */
const pauseStripeSubscription = async (subscriptionId, days = 30) => {
  try {
    const resumesAt = Math.floor(Date.now() / 1000) + days * 24 * 60 * 60;
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      pause_collection: {
        behavior: 'void',
        resumes_at: resumesAt,
      },
    });
    return { success: true, subscription, resumesAt };
  } catch (error) {
    console.error('Error pausing Stripe subscription:', error);
    return { success: false, error: error.message };
  }
};

/* ─── Apply a retention discount coupon ───
 *  Used by the cancellation retention flow ("Stay for 50% off next
 *  month?"). Attaches a coupon to the subscription which Stripe
 *  applies to the next invoice. The coupon's own `duration` field
 *  controls how many cycles the discount lasts — set the coupon to
 *  duration='once' in the Stripe Dashboard for a single-month
 *  retention discount.
 *
 *  couponId is the Stripe coupon's ID (e.g. 'retention50'), not a
 *  promotion code. Configure STRIPE_RETENTION_COUPON_ID in env.
 */
const applyRetentionDiscount = async (subscriptionId, couponId) => {
  try {
    if (!couponId) {
      return { success: false, error: 'No retention coupon configured' };
    }
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      coupon: couponId,
    });
    return { success: true, subscription };
  } catch (error) {
    console.error('Error applying retention discount:', error);
    return { success: false, error: error.message };
  }
};

// Get customer's payment methods
const getPaymentMethods = async (customerId) => {
  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });
    return { success: true, paymentMethods: paymentMethods.data };
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return { success: false, error: error.message };
  }
};

// Create setup intent for adding payment method
const createSetupIntent = async (customerId) => {
  try {
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
    });
    return { success: true, clientSecret: setupIntent.client_secret };
  } catch (error) {
    console.error('Error creating setup intent:', error);
    return { success: false, error: error.message };
  }
};

// Create billing portal session
const createBillingPortalSession = async (customerId, returnUrl) => {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    return { success: true, url: session.url };
  } catch (error) {
    console.error('Error creating billing portal session:', error);
    return { success: false, error: error.message };
  }
};

// Verify webhook signature
const verifyWebhookSignature = (payload, signature) => {
  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    return { success: true, event };
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return { success: false, error: error.message };
  }
};

// Validate promo code
const validatePromoCode = async (promoCode) => {
  try {
    // Search for active promo codes matching the provided code
    const promoCodes = await stripe.promotionCodes.list({
      code: promoCode,
      active: true,
      limit: 1
    });

    if (promoCodes.data.length === 0) {
      return {
        success: false,
        valid: false,
        error: 'Invalid or expired promo code'
      };
    }

    const promoCodeData = promoCodes.data[0];
    const coupon = promoCodeData.coupon;

    // Check if the coupon is valid
    if (!coupon.valid) {
      return {
        success: false,
        valid: false,
        error: 'This promo code is no longer valid'
      };
    }

    // Check if coupon has usage limits
    if (promoCodeData.max_redemptions && promoCodeData.times_redeemed >= promoCodeData.max_redemptions) {
      return {
        success: false,
        valid: false,
        error: 'This promo code has reached its usage limit'
      };
    }

    // Check if coupon has expired
    if (coupon.redeem_by && coupon.redeem_by * 1000 < Date.now()) {
      return {
        success: false,
        valid: false,
        error: 'This promo code has expired'
      };
    }

    // Format discount information
    let discountText = '';
    if (coupon.percent_off) {
      discountText = `${coupon.percent_off}% off`;
    } else if (coupon.amount_off) {
      const amount = (coupon.amount_off / 100).toFixed(2);
      discountText = `$${amount} off`;
    }

    if (coupon.duration === 'forever') {
      discountText += ' forever';
    } else if (coupon.duration === 'repeating') {
      discountText += ` for ${coupon.duration_in_months} months`;
    } else if (coupon.duration === 'once') {
      discountText += ' on first payment';
    }

    return {
      success: true,
      valid: true,
      discount: {
        percentOff: coupon.percent_off,
        amountOff: coupon.amount_off,
        currency: coupon.currency,
        duration: coupon.duration,
        durationInMonths: coupon.duration_in_months
      },
      message: discountText
    };
  } catch (error) {
    console.error('Error validating promo code:', error);
    return {
      success: false,
      valid: false,
      error: 'Failed to validate promo code'
    };
  }
};

// Auto-delete citations older than 30 days to save space
const cleanupOldCitations = async () => {
  try {
    const now = new Date().toISOString();

    // Use service role key to delete across all users
    const { createClient } = require('@supabase/supabase-js');
    const supabaseServiceRole = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    );

    // Delete citations that have expired (expires_at is set and is in the past)
    // Citations with expires_at = null (paid users) are never deleted
    // Free users have 30-day expiration set when citation is created
    const { data, error } = await supabaseServiceRole
      .from('citation_searches')
      .delete()
      .not('expires_at', 'is', null)
      .lt('expires_at', now)
      .select('id');

    if (error) {
      console.error('Error cleaning up expired citations:', error);
      return { success: false, error: error.message };
    }

    const deletedCount = data?.length || 0;
    return { success: true, deletedCount };
  } catch (error) {
    console.error('Error in cleanupOldCitations:', error);
    return { success: false, error: error.message };
  }
};

// Stripe statuses that grant access to a paid tier. Anything outside this
// set means the user should be on the free plan.
const STRIPE_ACCESS_STATUSES = new Set(['active', 'trialing', 'past_due']);

// Map a Stripe price ID to our internal plan key.
function mapPriceIdToPlan(priceId) {
  if (!priceId) return 'free';
  if (priceId === process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || priceId === process.env.STRIPE_STARTER_YEARLY_PRICE_ID) {
    return 'pro';
  }
  if (priceId === process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID || priceId === process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID) {
    return 'premium';
  }
  if (priceId === process.env.STRIPE_FOCUS_MONTHLY_PRICE_ID || priceId === process.env.STRIPE_FOCUS_YEARLY_PRICE_ID || priceId === 'price_focus_monthly' || priceId === 'price_focus_yearly') {
    return 'focus';
  }
  return 'free';
}

// Resolve the effective user plan given a Stripe subscription object.
// Forces 'free' if the subscription is no longer in an access state — protects
// against stale price IDs on canceled / unpaid / expired subs.
function resolveEffectivePlan(subscription) {
  if (!subscription || !STRIPE_ACCESS_STATUSES.has(subscription.status)) {
    return 'free';
  }
  const priceId = subscription.items?.data?.[0]?.price?.id;
  return mapPriceIdToPlan(priceId);
}

/**
 * Hourly: find every trialing subscription whose trial expires roughly
 * 24 hours from now and hasn't been emailed yet, then send the
 * "trial ends in 24h" reminder and stamp `trial_ending_email_sent_at`
 * so subsequent cron ticks skip it.
 *
 * Eligibility window is 22–25h before trial_end so we still catch
 * trials if a cron tick is dropped (Node process restart, etc.). The
 * idempotency column ensures a single email per subscription
 * regardless of how many cron ticks fall inside the window.
 *
 * Stripe's `customer.subscription.trial_will_end` webhook fires 3 days
 * before, which is the wrong window for the 24h reminder — hence this
 * cron rather than just a webhook handler.
 *
 * Returns { sent, errors, candidates }.
 */
const notifyTrialsEndingSoon = async () => {
  const emailService = require('./emailService');
  let sent = 0;
  let errors = 0;
  try {
    const supabaseAdmin = supabaseServiceRole;
    const nowMs = Date.now();
    // 22h → 25h from now. Slightly wider than 24h±0.5h so a missed
    // tick (e.g. server restart) still catches the subscription on
    // the next run.
    const windowStartIso = new Date(nowMs + 22 * 60 * 60 * 1000).toISOString();
    const windowEndIso = new Date(nowMs + 25 * 60 * 60 * 1000).toISOString();

    const { data: candidates, error: queryError } = await supabaseAdmin
      .from('subscriptions')
      .select('id, user_id, plan, status, current_period_end, trial_ending_email_sent_at')
      .eq('status', 'trialing')
      .is('trial_ending_email_sent_at', null)
      .gte('current_period_end', windowStartIso)
      .lte('current_period_end', windowEndIso);

    if (queryError) {
      console.error('🔔 trial-ending: failed to query candidates:', queryError);
      return { sent: 0, errors: 1, candidates: 0 };
    }

    const candidateCount = candidates?.length || 0;
    if (candidateCount === 0) return { sent: 0, errors: 0, candidates: 0 };

    console.log(`🔔 trial-ending: ${candidateCount} subscription(s) entering the 24h window`);

    for (const row of candidates) {
      try {
        // Pull the user's email + name for personalisation. Done per
        // row rather than as a join because Supabase JS doesn't infer
        // FK joins on this schema.
        const { data: user, error: userErr } = await supabaseAdmin
          .from('users')
          .select('email, first_name, name')
          .eq('id', row.user_id)
          .single();
        if (userErr || !user?.email) {
          console.warn(`🔔 trial-ending: skipping sub ${row.id} — user lookup failed`, userErr?.message);
          continue;
        }

        const firstName =
          (user.first_name && String(user.first_name).trim()) ||
          (user.name && !String(user.name).includes('@')
            ? String(user.name).trim().split(/\s+/)[0]
            : '') ||
          '';

        // Compose the post-trial charge label. For the onboarding
        // flow, NEWCUSTOMER 50% off is auto-applied, so the actual
        // first charge is half the plan's headline price.
        //   yearly: pro $199 → $99 ; premium $399.99 → $199.99
        //   monthly: pro $19.99 → $9.99 ; premium $39.99 → $19.99
        const planLabel = row.plan === 'premium' ? 'Premium' : 'Pro';

        const emailResult = await emailService.sendTrialEndingEmail(user.email, {
          firstName,
          planName: planLabel,
          billingLabel: 'plan',
          firstChargeAt: row.current_period_end,
        });

        if (!emailResult.success) {
          console.error(`🔔 trial-ending: send failed for sub ${row.id}:`, emailResult.error);
          errors += 1;
          continue;
        }

        // Mark sent so the next cron tick (and any subsequent re-run
        // within the window) doesn't email this user again.
        const { error: stampErr } = await supabaseAdmin
          .from('subscriptions')
          .update({ trial_ending_email_sent_at: new Date().toISOString() })
          .eq('id', row.id);
        if (stampErr) {
          console.error(`🔔 trial-ending: stamp failed for sub ${row.id}:`, stampErr.message);
          errors += 1;
          continue;
        }

        sent += 1;
      } catch (rowErr) {
        console.error(`🔔 trial-ending: error for sub ${row.id}:`, rowErr.message);
        errors += 1;
      }
    }

    console.log(`🔔 trial-ending: complete — sent ${sent}, errors ${errors}, candidates ${candidateCount}`);
    return { sent, errors, candidates: candidateCount };
  } catch (error) {
    console.error('🔔 trial-ending: fatal error:', error);
    return { sent, errors: errors + 1, candidates: 0 };
  }
};

/**
 * Hourly: find free users who ran a preview (analysis / citation search /
 * study pack) 24–48 hours ago and never upgraded, then send the one-shot
 * "your results are still waiting" recovery email.
 *
 * Window is 24–48h (not open-ended) so a fresh deploy doesn't blast every
 * historical free user; idempotency via users.preview_followup_email_sent_at
 * guarantees at most one email per user, ever, no matter how many previews
 * they run or how many cron ticks land inside the window.
 *
 * Returns { sent, errors, candidates }.
 */
const notifyPreviewFollowups = async () => {
  const emailService = require('./emailService');
  let sent = 0;
  let errors = 0;
  try {
    const nowMs = Date.now();
    const windowStartIso = new Date(nowMs - 48 * 60 * 60 * 1000).toISOString();
    const windowEndIso = new Date(nowMs - 24 * 60 * 60 * 1000).toISOString();

    const [analyses, citations, packs] = await Promise.all([
      supabaseServiceRole.from('document_analyses').select('user_id').gte('created_at', windowStartIso).lte('created_at', windowEndIso),
      supabaseServiceRole.from('citation_searches').select('user_id').gte('created_at', windowStartIso).lte('created_at', windowEndIso),
      supabaseServiceRole.from('quiz_usage').select('user_id').eq('quiz_type', 'study_pack').gte('created_at', windowStartIso).lte('created_at', windowEndIso),
    ]);

    // user_id → which feature to lead the email with. Analysis wins ties —
    // "your fixes are waiting" is the strongest hook.
    const candidates = new Map();
    for (const [rows, feature] of [
      [packs.data, 'study pack'],
      [citations.data, 'citations'],
      [analyses.data, 'analysis'],
    ]) {
      for (const r of rows || []) {
        if (r?.user_id) candidates.set(r.user_id, feature);
      }
    }

    const candidateCount = candidates.size;
    if (candidateCount === 0) return { sent: 0, errors: 0, candidates: 0 };

    console.log(`💌 preview-followup: ${candidateCount} user(s) previewed 24–48h ago`);

    for (const [userId, feature] of candidates) {
      try {
        const { data: user, error: userErr } = await supabaseServiceRole
          .from('users')
          .select('email, first_name, name, subscription_plan, preview_followup_email_sent_at')
          .eq('id', userId)
          .single();
        if (userErr || !user?.email) {
          console.warn(`💌 preview-followup: skipping ${userId} — user lookup failed`, userErr?.message);
          continue;
        }
        if (user.preview_followup_email_sent_at) continue;
        if (isPaidSubscriptionTier(user.subscription_plan)) continue;

        const firstName =
          (user.first_name && String(user.first_name).trim()) ||
          (user.name && !String(user.name).includes('@')
            ? String(user.name).trim().split(/\s+/)[0]
            : '') ||
          '';

        const emailResult = await emailService.sendPreviewFollowupEmail(user.email, { firstName, feature });
        if (!emailResult.success) {
          console.error(`💌 preview-followup: send failed for ${userId}:`, emailResult.error);
          errors += 1;
          continue;
        }

        const { error: stampErr } = await supabaseServiceRole
          .from('users')
          .update({ preview_followup_email_sent_at: new Date().toISOString() })
          .eq('id', userId);
        if (stampErr) {
          console.error(`💌 preview-followup: stamp failed for ${userId}:`, stampErr.message);
          errors += 1;
          continue;
        }

        sent += 1;
      } catch (rowErr) {
        console.error(`💌 preview-followup: error for ${userId}:`, rowErr.message);
        errors += 1;
      }
    }

    console.log(`💌 preview-followup: complete — sent ${sent}, errors ${errors}, candidates ${candidateCount}`);
    return { sent, errors, candidates: candidateCount };
  } catch (error) {
    console.error('💌 preview-followup: fatal error:', error);
    return { sent, errors: errors + 1, candidates: 0 };
  }
};

/**
 * DISABLED in production cron (see server.js) — kept for optional re-enable.
 * Stacking this with the 24h ending email drove trial cancels.
 *
 * Hourly: find trialing subscriptions ~48h from expiry (day 5 of a
 * 7-day trial) and send the value-recap email.
 *
 * Deliberately separate from the 24h reminder above, and deliberately
 * earlier. The 24h email is a last call; this one arrives while there's
 * still time to act, reflects the user's own usage back at them, and
 * carries the plain-language charge notice. Users who were going to
 * churn cancel here — which routes them through the save offer instead
 * of into a chargeback after a surprise charge.
 *
 * Window is 46–49h (wider than 48h±0.5h) so a dropped tick still catches
 * the trial on the next run; `trial_recap_email_sent_at` guarantees one
 * email per subscription regardless of how many ticks land in the window.
 *
 * Returns { sent, errors, candidates }.
 */
const notifyTrialValueRecap = async () => {
  const emailService = require('./emailService');
  let sent = 0;
  let errors = 0;
  try {
    const supabaseAdmin = supabaseServiceRole;
    const nowMs = Date.now();
    const windowStartIso = new Date(nowMs + 46 * 60 * 60 * 1000).toISOString();
    const windowEndIso = new Date(nowMs + 49 * 60 * 60 * 1000).toISOString();

    const { data: candidates, error: queryError } = await supabaseAdmin
      .from('subscriptions')
      .select('id, user_id, plan, status, current_period_end, trial_recap_email_sent_at')
      .eq('status', 'trialing')
      .is('trial_recap_email_sent_at', null)
      .gte('current_period_end', windowStartIso)
      .lte('current_period_end', windowEndIso);

    if (queryError) {
      console.error('📈 trial-recap: failed to query candidates:', queryError);
      return { sent: 0, errors: 1, candidates: 0 };
    }

    const candidateCount = candidates?.length || 0;
    if (candidateCount === 0) return { sent: 0, errors: 0, candidates: 0 };

    console.log(`📈 trial-recap: ${candidateCount} subscription(s) entering the 48h window`);

    for (const row of candidates) {
      try {
        const { data: user, error: userErr } = await supabaseAdmin
          .from('users')
          .select('email, first_name, name')
          .eq('id', row.user_id)
          .single();
        if (userErr || !user?.email) {
          console.warn(`📈 trial-recap: skipping sub ${row.id} — user lookup failed`, userErr?.message);
          continue;
        }

        const firstName =
          (user.first_name && String(user.first_name).trim()) ||
          (user.name && !String(user.name).includes('@')
            ? String(user.name).trim().split(/\s+/)[0]
            : '') ||
          '';

        // Usage during the trial. Counts are best-effort: a failed
        // count renders as 0, which downgrades the email to the
        // "haven't tried it yet" variant rather than blocking the send
        // — the compliance notice matters more than the stats.
        const [analysesRes, packsRes, citationsRes] = await Promise.all([
          supabaseAdmin.from('document_analyses').select('id', { count: 'exact', head: true }).eq('user_id', row.user_id),
          supabaseAdmin.from('quiz_usage').select('id', { count: 'exact', head: true }).eq('user_id', row.user_id).eq('quiz_type', 'study_pack'),
          supabaseAdmin.from('citation_searches').select('id', { count: 'exact', head: true }).eq('user_id', row.user_id),
        ]);

        const planLabel = row.plan === 'premium' ? 'Premium' : 'Pro';
        const chargeAmount = row.plan === 'premium' ? '$39.99' : '$19.99';

        const emailResult = await emailService.sendTrialValueRecapEmail(user.email, {
          firstName,
          planName: planLabel,
          firstChargeAmount: chargeAmount,
          firstChargeAt: row.current_period_end,
          stats: {
            analyses: analysesRes?.count || 0,
            studyPacks: packsRes?.count || 0,
            citations: citationsRes?.count || 0,
          },
        });

        if (!emailResult.success) {
          console.error(`📈 trial-recap: send failed for sub ${row.id}:`, emailResult.error);
          errors += 1;
          continue;
        }

        const { error: stampErr } = await supabaseAdmin
          .from('subscriptions')
          .update({ trial_recap_email_sent_at: new Date().toISOString() })
          .eq('id', row.id);
        if (stampErr) {
          console.error(`📈 trial-recap: stamp failed for sub ${row.id}:`, stampErr.message);
          errors += 1;
          continue;
        }

        sent += 1;
      } catch (rowErr) {
        console.error(`📈 trial-recap: error for sub ${row.id}:`, rowErr.message);
        errors += 1;
      }
    }

    console.log(`📈 trial-recap: complete — sent ${sent}, errors ${errors}, candidates ${candidateCount}`);
    return { sent, errors, candidates: candidateCount };
  } catch (error) {
    console.error('📈 trial-recap: fatal error:', error);
    return { sent, errors: errors + 1, candidates: 0 };
  }
};

/** Stripe promotion code offered in the winback email. Separate from the
 *  welcome code because the backend deliberately strips welcome codes for
 *  anyone with prior subscription history — which is exactly who this
 *  email targets. Must exist in Stripe Dashboard → Coupons as 50% off,
 *  duration "once". */
const WINBACK_PROMO_CODE = process.env.STRIPE_WINBACK_PROMO_CODE || 'COMEBACK50';
/** Days after a subscription actually lapses before the winback goes out. */
const WINBACK_DELAY_DAYS = Number(process.env.WINBACK_DELAY_DAYS || 14);

/**
 * Daily: find users whose subscription lapsed ~WINBACK_DELAY_DAYS ago and
 * never came back, then send the one-shot half-price winback.
 *
 * This is where the 50% discount earns its keep. At signup it mostly
 * discounted users who would have paid full price; here every conversion
 * is revenue that was already written off.
 *
 * Timed off `canceled_at` (the actual lapse) rather than when the user
 * clicked cancel — they keep access until period end, so emailing "come
 * back" while they still have Pro reads as broken.
 *
 * Window is a 24h slice so a daily tick catches each user exactly once;
 * users.winback_email_sent_at guarantees one email per user, ever.
 *
 * Returns { sent, errors, candidates }.
 */
const notifyWinbacks = async () => {
  const emailService = require('./emailService');
  let sent = 0;
  let errors = 0;
  try {
    const supabaseAdmin = supabaseServiceRole;
    const nowMs = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const windowStartIso = new Date(nowMs - (WINBACK_DELAY_DAYS + 1) * dayMs).toISOString();
    const windowEndIso = new Date(nowMs - WINBACK_DELAY_DAYS * dayMs).toISOString();

    const { data: candidates, error: queryError } = await supabaseAdmin
      .from('subscriptions')
      .select('id, user_id, plan, status, canceled_at')
      .eq('status', 'canceled')
      .gte('canceled_at', windowStartIso)
      .lte('canceled_at', windowEndIso);

    if (queryError) {
      console.error('🔙 winback: failed to query candidates:', queryError);
      return { sent: 0, errors: 1, candidates: 0 };
    }

    const candidateCount = candidates?.length || 0;
    if (candidateCount === 0) return { sent: 0, errors: 0, candidates: 0 };

    console.log(`🔙 winback: ${candidateCount} subscription(s) lapsed ~${WINBACK_DELAY_DAYS}d ago`);

    for (const row of candidates) {
      try {
        const { data: user, error: userErr } = await supabaseAdmin
          .from('users')
          .select('email, first_name, name, subscription_plan, winback_email_sent_at')
          .eq('id', row.user_id)
          .single();
        if (userErr || !user?.email) {
          console.warn(`🔙 winback: skipping sub ${row.id} — user lookup failed`, userErr?.message);
          continue;
        }
        if (user.winback_email_sent_at) continue;
        // Already resubscribed since lapsing — don't offer a discount to
        // someone currently paying full price.
        if (isPaidSubscriptionTier(user.subscription_plan)) continue;

        const firstName =
          (user.first_name && String(user.first_name).trim()) ||
          (user.name && !String(user.name).includes('@')
            ? String(user.name).trim().split(/\s+/)[0]
            : '') ||
          '';

        const planLabel = row.plan === 'premium' ? 'Premium' : 'Pro';
        const priceLabel = row.plan === 'premium' ? '$19.99' : '$9.99';

        const emailResult = await emailService.sendWinbackEmail(user.email, {
          firstName,
          planName: planLabel,
          promoCode: WINBACK_PROMO_CODE,
          priceLabel,
        });

        if (!emailResult.success) {
          console.error(`🔙 winback: send failed for ${row.user_id}:`, emailResult.error);
          errors += 1;
          continue;
        }

        const { error: stampErr } = await supabaseAdmin
          .from('users')
          .update({ winback_email_sent_at: new Date().toISOString() })
          .eq('id', row.user_id);
        if (stampErr) {
          console.error(`🔙 winback: stamp failed for ${row.user_id}:`, stampErr.message);
          errors += 1;
          continue;
        }

        sent += 1;
      } catch (rowErr) {
        console.error(`🔙 winback: error for sub ${row.id}:`, rowErr.message);
        errors += 1;
      }
    }

    console.log(`🔙 winback: complete — sent ${sent}, errors ${errors}, candidates ${candidateCount}`);
    return { sent, errors, candidates: candidateCount };
  } catch (error) {
    console.error('🔙 winback: fatal error:', error);
    return { sent, errors: errors + 1, candidates: 0 };
  }
};

/**
 * Daily reconciliation: walk every paid user in our DB, compare against
 * Stripe, and downgrade anyone whose Stripe subscription is no longer in an
 * access state. Safety net for missed/failed webhooks and silent trial expiry.
 *
 * Returns { reconciled, errors, total }.
 */
const reconcileSubscriptions = async () => {
  let reconciled = 0;
  let errors = 0;
  let skippedEmptyCustomer = 0;

  try {
    // Skip rows with manual_grant = true (comped accounts, partner deals,
    // refunded users we want to keep on Pro). The cron will not touch them
    // even if their Stripe subscription is canceled or absent.
    // See add_manual_grant_column.sql migration.
    const result = await query(
      `SELECT id, email, stripe_customer_id, subscription_plan
         FROM users
        WHERE subscription_plan IS NOT NULL
          AND subscription_plan != 'free'
          AND stripe_customer_id IS NOT NULL
          AND manual_grant = false`
    );

    const allUsers = result.rows || [];
    // Some legacy rows have stripe_customer_id = '' (empty string), which
    // passes the IS NOT NULL filter but breaks Stripe's API. Drop them here.
    const users = allUsers.filter((u) => {
      if (!u.stripe_customer_id || String(u.stripe_customer_id).trim() === '') {
        skippedEmptyCustomer++;
        return false;
      }
      return true;
    });
    console.log(
      `🔄 Reconcile: checking ${users.length} paid users against Stripe (skipped ${skippedEmptyCustomer} with empty stripe_customer_id)`
    );

    const supabaseAdmin = supabaseServiceRole;

    for (const user of users) {
      try {
        const stripeSubs = await stripe.subscriptions.list({
          customer: user.stripe_customer_id,
          status: 'all',
          limit: 10,
        });

        const hasAccess = stripeSubs.data.some((sub) =>
          STRIPE_ACCESS_STATUSES.has(sub.status)
        );

        if (hasAccess) continue;

        // Stripe says no access, but our DB has them on a paid tier — downgrade.
        const newestSub = stripeSubs.data[0];
        const dbStatus = newestSub?.status || 'canceled';
        const nowIso = new Date().toISOString();

        // Use the Supabase client directly. The custom SQL parser in
        // databaseService.js can't handle COALESCE() or NOT IN, so raw SQL
        // updates fail — going through the builder is safer and simpler.
        const { error: userErr } = await supabaseAdmin
          .from('users')
          .update({
            subscription_plan: 'free',
            subscription_status: dbStatus,
            updated_at: nowIso,
          })
          .eq('id', user.id);
        if (userErr) throw userErr;

        const { error: subErr } = await supabaseAdmin
          .from('subscriptions')
          .update({
            status: dbStatus,
            canceled_at: nowIso,
            updated_at: nowIso,
          })
          .eq('user_id', user.id)
          .neq('status', 'canceled');
        if (subErr) throw subErr;

        console.log(
          `🔄 Reconcile: downgraded user ${user.id} (${user.email}) from ${user.subscription_plan} → free (Stripe status: ${dbStatus})`
        );
        reconciled++;
      } catch (userErr) {
        console.error(`🔄 Reconcile: error for user ${user.id}:`, userErr.message);
        errors++;
      }
    }

    console.log(
      `✅ Reconcile complete: ${reconciled} downgraded, ${errors} errors, ${users.length} checked, ${skippedEmptyCustomer} skipped (empty customer id)`
    );
    return { reconciled, errors, total: users.length, skippedEmptyCustomer };
  } catch (error) {
    console.error('🔄 Reconcile: fatal error:', error);
    return { reconciled, errors: errors + 1, total: 0, skippedEmptyCustomer };
  }
};

/**
 * After Embedded Checkout redirect; same DB updates as checkout.session.completed webhook.
 * Verifies session belongs to user (metadata + stripe_customer_id).
 */
const syncCheckoutSessionForUser = async (sessionId, appUserId) => {
  try {
    if (!sessionId || !appUserId) {
      return { success: false, error: 'Missing session or user' };
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription']
    });

    if (session.status !== 'complete') {
      return { success: false, error: 'Checkout not complete yet' };
    }

    const metaUid = session.metadata && session.metadata.userId;
    if (metaUid && String(metaUid) !== String(appUserId)) {
      return { success: false, error: 'Session does not match this account' };
    }

    const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
    if (!customerId) {
      return { success: false, error: 'No customer on session' };
    }

    const userResult = await query('SELECT id, email, stripe_customer_id FROM users WHERE id = $1', [
      appUserId
    ]);
    if (!userResult.rows.length) {
      return { success: false, error: 'User not found' };
    }
    const userRow = userResult.rows[0];
    if (userRow.stripe_customer_id && userRow.stripe_customer_id !== customerId) {
      return { success: false, error: 'Customer mismatch' };
    }
    if (!userRow.stripe_customer_id) {
      await query('UPDATE users SET stripe_customer_id = $1 WHERE id = $2', [customerId, appUserId]);
    }

    let subscriptionId =
      typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
    if (!subscriptionId) {
      return { success: false, error: 'No subscription on session' };
    }

    const stripeResult = await getStripeSubscription(subscriptionId);
    if (!stripeResult.success) {
      return { success: false, error: stripeResult.error || 'Failed to load subscription' };
    }

    const subscription = stripeResult.subscription;
    const plan = resolveEffectivePlan(subscription);

    await query(
      'UPDATE users SET subscription_plan = $1, subscription_status = $2, onboarding_completed = true WHERE id = $3',
      [plan, subscription.status, userRow.id]
    );

    try {
      const cancelAtPeriodEnd = Boolean(subscription.cancel_at_period_end);
      await query(
        `INSERT INTO subscriptions (user_id, stripe_subscription_id, stripe_customer_id, plan, status, current_period_start, current_period_end, cancel_at_period_end, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
         ON CONFLICT (stripe_subscription_id) DO UPDATE SET
         plan = EXCLUDED.plan,
         status = EXCLUDED.status,
         current_period_start = EXCLUDED.current_period_start,
         current_period_end = EXCLUDED.current_period_end,
         cancel_at_period_end = EXCLUDED.cancel_at_period_end,
         updated_at = NOW()`,
        [
          userRow.id,
          subscriptionId,
          customerId,
          plan,
          subscription.status,
          new Date(subscription.current_period_start * 1000),
          new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd
        ]
      );
    } catch (subError) {
      console.error('syncCheckoutSessionForUser: subscription row error:', subError);
    }

    try {
      await recordTrialUsage(userRow.email, customerId, plan);
    } catch (discountError) {
      if (discountError?.code !== '23505') {
        console.error('syncCheckoutSessionForUser: recordTrialUsage:', discountError);
      }
    }

    return { success: true, plan, subscriptionStatus: subscription.status };
  } catch (error) {
    console.error('syncCheckoutSessionForUser:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  supabase,
  PLAN_LIMITS,
  FREE_PREVIEW_LIFETIME,
  FREE_LIFETIME_EPOCH,
  normalizePlanForLimits,
  isPaidSubscriptionTier,
  getPriceId,
  getUserPlan,
  getUserSubscriptionDetails,
  getUsagePeriod,
  checkLimit,
  checkCombinedActionsLimit,
  checkCombinedWordsLimit,
  getRemainingUsage,
  getPlanDetails,
  getPlanLimits,
  checkTrialEligibility,
  hasEverSubscribed,
  userKeepsLibraryForever,
  startFreeLibraryExpiryClock,
  checkOff10Eligibility,
  recordTrialUsage,
  recordTrialDecline,
  createStripeCustomer,
  createCheckoutSession,
  syncCheckoutSessionForUser,
  getStripeSubscription,
  updateStripeSubscription,
  cancelStripeSubscription,
  pauseStripeSubscription,
  applyRetentionDiscount,
  getPaymentMethods,
  createSetupIntent,
  createBillingPortalSession,
  verifyWebhookSignature,
  validatePromoCode,
  cleanupOldCitations,
  reconcileSubscriptions,
  notifyTrialsEndingSoon,
  notifyTrialValueRecap,
  notifyWinbacks,
  notifyPreviewFollowups,
  WINBACK_PROMO_CODE,
  STRIPE_ACCESS_STATUSES,
  mapPriceIdToPlan,
  resolveEffectivePlan,
};

