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
    analysesPerMonth: 2,
    citationSearchesPerMonth: 2,
    humanizeWordsPerMonth: 5000,
    summarizeWordsPerMonth: 5000,
    studyPackGenerationsPerMonth: 2,
    studyPackMaxWordsPerGeneration: 5000,
    quizWordsPerMonth: 15000,
    quizGenerationsPerMonth: 2,
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
    combinedActionsPerMonth: 49, // analyses + study packs + citations share this pool
    combinedWordsPerMonth: 999999, // Paper Summarizer word pool
    analysesPerMonth: 49, // used for combined check
    citationSearchesPerMonth: 49,
    humanizeWordsPerMonth: 999999,
    summarizeWordsPerMonth: 999999,
    studyPackGenerationsPerMonth: 49,
    studyPackMaxWordsPerGeneration: 10000,
    quizWordsPerMonth: 999999,
    quizGenerationsPerMonth: 49,
    quizMaxWordsPerGeneration: 10000,
    craterBlastMaxWordsPerGeneration: 10000,
    lessonWordsPerMonth: 999999,
    lessonGenerationsPerMonth: 49,
    lessonMaxWordsPerGeneration: 10000,
    // Essay analysis uses OPENAI_PREMIUM_MODEL (default gpt-5-mini); same tier as former Premium
    aiModel: 'gpt-5-mini',
    maxDocumentSize: 100 * 1024 * 1024, // 100MB per file
    maxTotalStorage: 100 * 1024 * 1024, // 100MB total library storage
    name: 'Pro',
    price: 19.99
  },
  premium: {
    documentsPerMonth: -1,
    combinedActionsPerMonth: 199,
    combinedWordsPerMonth: 4999999,
    analysesPerMonth: 199,
    citationSearchesPerMonth: 199,
    humanizeWordsPerMonth: 4999999,
    summarizeWordsPerMonth: 4999999,
    studyPackGenerationsPerMonth: 199,
    studyPackMaxWordsPerGeneration: 10000,
    quizWordsPerMonth: 4999999,
    quizGenerationsPerMonth: 199,
    quizMaxWordsPerGeneration: 10000,
    craterBlastMaxWordsPerGeneration: 10000,
    lessonWordsPerMonth: 4999999,
    lessonGenerationsPerMonth: 199,
    lessonMaxWordsPerGeneration: 10000,
    aiModel: 'gpt-5-mini',
    maxDocumentSize: 100 * 1024 * 1024,
    maxTotalStorage: 1024 * 1024 * 1024, // 1GB library total
    name: 'Premium',
    price: 39.99
  },
};

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

    const { periodStart, periodEnd, daysUntilReset } = await getUsagePeriod(userId);
    
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
 * Daily reconciliation: walk every paid user in our DB, compare against
 * Stripe, and downgrade anyone whose Stripe subscription is no longer in an
 * access state. Safety net for missed/failed webhooks and silent trial expiry.
 *
 * Returns { reconciled, errors, total }.
 */
const reconcileSubscriptions = async () => {
  let reconciled = 0;
  let errors = 0;

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

    const users = result.rows || [];
    console.log(`🔄 Reconcile: checking ${users.length} paid users against Stripe`);

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

        await query(
          `UPDATE users
              SET subscription_plan = 'free',
                  subscription_status = $1,
                  updated_at = NOW()
            WHERE id = $2`,
          [dbStatus, user.id]
        );

        await query(
          `UPDATE subscriptions
              SET status = $1,
                  canceled_at = COALESCE(canceled_at, NOW()),
                  updated_at = NOW()
            WHERE user_id = $2
              AND status NOT IN ('canceled')`,
          [dbStatus, user.id]
        );

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
      `✅ Reconcile complete: ${reconciled} downgraded, ${errors} errors, ${users.length} checked`
    );
    return { reconciled, errors, total: users.length };
  } catch (error) {
    console.error('🔄 Reconcile: fatal error:', error);
    return { reconciled, errors: errors + 1, total: 0 };
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
  checkOff10Eligibility,
  recordTrialUsage,
  recordTrialDecline,
  createStripeCustomer,
  createCheckoutSession,
  syncCheckoutSessionForUser,
  getStripeSubscription,
  updateStripeSubscription,
  cancelStripeSubscription,
  getPaymentMethods,
  createSetupIntent,
  createBillingPortalSession,
  verifyWebhookSignature,
  validatePromoCode,
  cleanupOldCitations,
  reconcileSubscriptions,
  STRIPE_ACCESS_STATUSES,
  mapPriceIdToPlan,
  resolveEffectivePlan,
};

