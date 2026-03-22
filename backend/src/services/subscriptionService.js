const { createClient } = require('@supabase/supabase-js');
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
    maxDocumentSize: 1024 * 1024,
    maxTotalStorage: 1024 * 1024,
    name: 'Free'
  },
  pro: {
    documentsPerMonth: -1,
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
    // Essay analysis uses OPENAI_PREMIUM_MODEL (default gpt-5-mini); same tier as former Premium
    aiModel: 'gpt-5-mini',
    maxDocumentSize: 100 * 1024 * 1024, // 100MB per file
    maxTotalStorage: 500 * 1024 * 1024, // 500MB library total
    name: 'Pro',
    price: 19.99
  },
};

/** Legacy Stripe plan "premium" maps to Pro limits (single paid tier). */
function normalizePlanForLimits(plan) {
  const p = (plan || 'free').toLowerCase();
  // Single paid tier limits: Pro features (99 combined actions/mo, etc.)
  if (p === 'starter' || p === 'premium' || p === 'focus') return 'pro';
  return p;
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

    if (normalizePlanForLimits(plan) === 'pro') {
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
    if (!limit || limit === -1 || effPlan !== 'pro') {
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
    if (!limit || limit === -1 || effPlan !== 'pro') {
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

// Check if an email is eligible for the first-time $10 off (OFF10)
// Returns true if eligible, false if they've already used the offer
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
        reason: 'This email has already used a free trial',
        previousTrialDate: existingTrial.trial_started_at
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
    
    const { error } = await supabaseServiceRole
      .from('trial_usage')
      .insert({
        email: normalizedEmail,
        stripe_customer_id: stripeCustomerId,
        trial_plan: planType,
        trial_started_at: new Date().toISOString()
      });

    if (error) {
      // If it's a duplicate key error, that's fine - trial was already recorded
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
const createCheckoutSession = async (customerId, planType, billingCycle, userId, promoCode = null, userEmail = null, successUrl = null, cancelUrl = null) => {
  try {
    // Get price ID based on plan and billing cycle
    const priceId = getPriceId(planType, billingCycle);
    
    // Check if user is eligible for first-time discount (OFF10) — used for UI/eligibility only.
    // No trial period; OFF10 is auto-applied for first-time purchasers in the route.
    
    // Use provided URLs or fallback to defaults
    const finalSuccessUrl = successUrl || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?payment=success`;
    const finalCancelUrl = cancelUrl || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?payment=cancelled`;
    
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
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
      subscription_data: {
        metadata: {
          userId,
          planType,
          billingCycle,
          source: 'writescholar'
        }
      },
      metadata: {
        userId,
        planType,
        billingCycle,
        source: 'writescholar'
      },
      // Allow customers to enter promo codes at checkout
      allow_promotion_codes: true
    };

    // If a specific promo code is provided, apply it directly
    if (promoCode) {
      try {
        // Find the promotion code in Stripe
        const promoCodes = await stripe.promotionCodes.list({
          code: promoCode,
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
          console.warn(`Promo code "${promoCode}" not found or inactive`);
        }
      } catch (promoError) {
        console.error('Error applying promo code:', promoError);
        // Continue without promo code if there's an error
      }
    }
    
    const session = await stripe.checkout.sessions.create(sessionConfig);
    
    return { success: true, sessionId: session.id, url: session.url };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return { success: false, error: error.message };
  }
};

// Get price ID based on plan and billing cycle
const getPriceId = (planType, billingCycle) => {
  const planKey =
    planType === 'starter' || planType === 'premium' ? 'pro' : planType;
  const prices = {
    pro: {
      monthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || 'price_starter_monthly',
      yearly: process.env.STRIPE_STARTER_YEARLY_PRICE_ID || 'price_starter_yearly'
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
const cancelStripeSubscription = async (subscriptionId) => {
  try {
    const subscription = await stripe.subscriptions.cancel(subscriptionId);
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

module.exports = {
  supabase,
  PLAN_LIMITS,
  normalizePlanForLimits,
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
  recordTrialUsage,
  createStripeCustomer,
  createCheckoutSession,
  getStripeSubscription,
  updateStripeSubscription,
  cancelStripeSubscription,
  getPaymentMethods,
  createSetupIntent,
  createBillingPortalSession,
  verifyWebhookSignature,
  validatePromoCode,
  cleanupOldCitations
};

