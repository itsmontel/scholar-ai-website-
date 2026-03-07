const { createClient } = require('@supabase/supabase-js');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Plan limits configuration
const PLAN_LIMITS = {
  free: {
    documentsPerMonth: 3,
    analysesPerMonth: 3,
    citationSearchesPerMonth: 2,
    humanizeWordsPerMonth: 1000,
    summarizeWordsPerMonth: 1000,
    quizWordsPerMonth: 15000,
    quizGenerationsPerMonth: 3,
    quizMaxWordsPerGeneration: 5000,
    craterBlastMaxWordsPerGeneration: 5000,
    lessonWordsPerMonth: 5000,
    lessonGenerationsPerMonth: 3,
    lessonMaxWordsPerGeneration: 5000,
    aiModel: 'gpt-4.1-nano',
    maxDocumentSize: 1024 * 1024,
    maxTotalStorage: 1024 * 1024,
    maxAnalysisPercentage: 50,
    name: 'Free'
  },
  starter: {
    documentsPerMonth: -1,
    analysesPerMonth: 999,
    citationSearchesPerMonth: 999,
    humanizeWordsPerMonth: 999999,
    summarizeWordsPerMonth: 999999,
    quizWordsPerMonth: 999999,
    quizGenerationsPerMonth: 99,
    quizMaxWordsPerGeneration: 15000,
    craterBlastMaxWordsPerGeneration: 10000,
    lessonWordsPerMonth: 999999,
    lessonGenerationsPerMonth: 99,
    lessonMaxWordsPerGeneration: 10000,
    aiModel: 'gpt-4.1-nano',
    maxDocumentSize: 25 * 1024 * 1024,
    maxTotalStorage: 25 * 1024 * 1024,
    maxAnalysisPercentage: 100,
    name: 'Starter',
    price: 19.99
  },
  premium: {
    documentsPerMonth: -1,
    analysesPerMonth: 999,
    citationSearchesPerMonth: 999,
    humanizeWordsPerMonth: 999999,
    summarizeWordsPerMonth: 999999,
    quizWordsPerMonth: 999999,
    quizGenerationsPerMonth: 199,
    quizMaxWordsPerGeneration: 15000,
    craterBlastMaxWordsPerGeneration: 10000,
    lessonWordsPerMonth: 999999,
    lessonGenerationsPerMonth: 199,
    lessonMaxWordsPerGeneration: 10000,
    aiModel: 'gpt-4.1-mini',
    maxDocumentSize: 1024 * 1024 * 1024,
    maxTotalStorage: 1024 * 1024 * 1024,
    maxAnalysisPercentage: 100,
    name: 'Premium',
    price: 39.99
  }
};


// Get user's plan string (free, starter, premium) - for retention policies etc.
const getUserPlan = async (userId) => {
  const { plan } = await getUserSubscriptionDetails(userId);
  return plan || 'free';
};

// Get user's subscription details
const getUserSubscriptionDetails = async (userId) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('subscription_plan, stripe_customer_id')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user subscription:', error);
      return { plan: 'free', stripeCustomerId: null };
    }

    return {
      plan: user.subscription_plan || 'free',
      stripeCustomerId: user.stripe_customer_id
    };
  } catch (error) {
    console.error('Error in getUserSubscriptionDetails:', error);
    return { plan: 'free', stripeCustomerId: null };
  }
};

// Check if user has exceeded a specific limit
const checkLimit = async (userId, limitType) => {
  try {
    const { plan } = await getUserSubscriptionDetails(userId);
    const planLimits = PLAN_LIMITS[plan];
    
    if (planLimits[limitType] === -1) {
      return { allowed: true, limit: -1, usage: 0, remaining: -1 };
    }

    // Get current usage for this month
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    
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
        .gte('created_at', startOfMonth.toISOString());
      
      if (!error) {
        usage = documents.length;
      }
      console.log(`checkLimit: Found ${usage} documents for user ${userId} this month`);
    } else if (limitType === 'analysesPerMonth') {
      const { data: analyses, error} = await supabaseServiceRole
        .from('document_analyses')
        .select('id')
        .eq('user_id', userId)
        .gte('created_at', startOfMonth.toISOString());
      
      if (!error) {
        usage = analyses.length;
      }
      console.log(`checkLimit: Found ${usage} analyses for user ${userId} this month (limit: ${planLimits[limitType]})`);
    } else if (limitType === 'citationSearchesPerMonth') {
      const { data: citationSearches, error } = await supabaseServiceRole
        .from('citation_searches')
        .select('id')
        .eq('user_id', userId)
        .gte('created_at', startOfMonth.toISOString());
      
      if (!error) {
        usage = citationSearches ? citationSearches.length : 0;
      }
      console.log(`checkLimit: Found ${usage} citation searches for user ${userId} this month (limit: ${planLimits[limitType]})`);
    }

    const limit = planLimits[limitType];
    const remaining = Math.max(0, limit - usage);
    const allowed = usage < limit;

    return {
      allowed,
      limit,
      usage,
      remaining,
      planLimits
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

// Get plan details
const getPlanDetails = (plan) => {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
};

// Get plan limits for a user
const getPlanLimits = async (userId) => {
  try {
    const { plan } = await getUserSubscriptionDetails(userId);
    return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
  } catch (error) {
    console.error('Error getting plan limits:', error);
    return PLAN_LIMITS.free;
  }
};

// Check if an email is eligible for a free trial
// Returns true if eligible, false if they've already used a trial
const checkTrialEligibility = async (email) => {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    
    // Check if this email has ever used a trial
    const { data: existingTrial, error } = await supabase
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
      console.log(`Email ${normalizedEmail} already used trial on ${existingTrial.trial_started_at}`);
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

// Record that an email has used a trial
const recordTrialUsage = async (email, stripeCustomerId, planType) => {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    
    const { error } = await supabase
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
        console.log(`Trial already recorded for ${normalizedEmail}`);
        return { success: true, alreadyRecorded: true };
      }
      console.error('Error recording trial usage:', error);
      return { success: false, error: error.message };
    }

    console.log(`Recorded trial usage for ${normalizedEmail}`);
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
    
    // Check if user is eligible for a free trial
    let applyTrial = false;
    if (userEmail) {
      const trialEligibility = await checkTrialEligibility(userEmail);
      applyTrial = trialEligibility.eligible;
      
      if (applyTrial) {
        console.log(`User ${userEmail} is eligible for 7-day free trial`);
        // Trial usage is recorded in the webhook (checkout.session.completed) only after
        // the user actually enters card details and completes checkout — not just by opening it.
      } else {
        console.log(`User ${userEmail} is NOT eligible for trial: ${trialEligibility.reason}`);
      }
    }
    
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
          source: 'writescholar',
          hadTrial: applyTrial ? 'true' : 'false'
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
    
    // Only add trial period if user is eligible
    if (applyTrial) {
      sessionConfig.subscription_data.trial_period_days = 7;
    }

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
  const prices = {
    'starter': {
      'monthly': process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || 'price_starter_monthly',
      'yearly': process.env.STRIPE_STARTER_YEARLY_PRICE_ID || 'price_starter_yearly'
    },
    'premium': {
      'monthly': process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID || 'price_premium_monthly',
      'yearly': process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID || 'price_premium_yearly'
    }
  };

  const priceId = prices[planType]?.[billingCycle];
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
    console.log(`✅ Successfully cleaned up ${deletedCount} expired citations (free user 30-day retention)`);
    return { success: true, deletedCount };
  } catch (error) {
    console.error('Error in cleanupOldCitations:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  supabase,
  PLAN_LIMITS,
  getPriceId,
  getUserPlan,
  getUserSubscriptionDetails,
  checkLimit,
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

