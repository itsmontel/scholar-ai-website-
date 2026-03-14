const express = require('express');
const router = express.Router();
const subscriptionService = require('../services/subscriptionService');
const { authenticateToken } = require('../middleware/auth');
const { getSupabase } = require('../database/connection');

// @route   POST /api/subscriptions/create-checkout-session
// @desc    Create a Stripe checkout session for subscription
// @access  Private
router.post('/create-checkout-session', authenticateToken, async (req, res) => {
  try {
    const { planType, billingCycle, successUrl, cancelUrl, promoCode } = req.body;
    const userId = req.user.id;

    if (!planType || !billingCycle || !successUrl || !cancelUrl) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: planType, billingCycle, successUrl, cancelUrl'
      });
    }

    // Get user details from the authenticated user (already available from auth middleware)
    const user = req.user;
    let customerId = user.stripe_customer_id;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customerResult = await subscriptionService.createStripeCustomer(
        user.email,
        user.name || user.email
      );

      if (!customerResult.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to create customer',
          error: customerResult.error
        });
      }

      customerId = customerResult.customerId;

      // Update user with Stripe customer ID (service role required - anon blocked by RLS)
      const { error: updateError } = await getSupabase()
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating user with Stripe customer ID:', updateError);
      }
    }

    // Create checkout session with optional promo code
    // Pass user email to check trial eligibility and custom redirect URLs
    const sessionResult = await subscriptionService.createCheckoutSession(
      customerId,
      planType,
      billingCycle,
      userId,
      promoCode || null,
      user.email,  // Pass email for trial eligibility check
      successUrl,  // Use URL from request (e.g., from onboarding)
      cancelUrl    // Use URL from request (redirects to dashboard on cancel)
    );

    if (!sessionResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create checkout session',
        error: sessionResult.error
      });
    }

    res.json({
      success: true,
      data: {
        sessionId: sessionResult.sessionId,
        checkoutUrl: sessionResult.url
      }
    });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create checkout session',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/subscriptions/current
// @desc    Get user's current subscription
// @access  Private
router.get('/current', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const subscriptionDetails = await subscriptionService.getUserSubscriptionDetails(userId);

    // If user has a paid plan, get details from Stripe
    let stripeSubscription = null;
    if (subscriptionDetails.plan !== 'free' && subscriptionDetails.stripeCustomerId) {
      // Get the most recent active subscription (service role required - subscriptions table has RLS)
      const { data: subscription, error } = await getSupabase()
        .from('subscriptions')
        .select('stripe_subscription_id, status, current_period_start, current_period_end')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!error && subscription) {
        const stripeResult = await subscriptionService.getStripeSubscription(subscription.stripe_subscription_id);
        if (stripeResult.success) {
          stripeSubscription = stripeResult.subscription;
        }
      }
    }

    res.json({
      success: true,
      plan: subscriptionDetails.plan,
      stripeSubscription,
      planLimits: subscriptionService.PLAN_LIMITS[subscriptionDetails.plan]
    });

  } catch (error) {
    console.error('Error fetching current subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/subscriptions/update
// @desc    Update user's subscription plan
// @access  Private
router.put('/update', authenticateToken, async (req, res) => {
  try {
    const { newPlan } = req.body;
    const userId = req.user.id;

    if (!newPlan || !['pro', 'premium'].includes(newPlan)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan. Must be pro or premium.'
      });
    }

    const subscriptionDetails = await subscriptionService.getUserSubscriptionDetails(userId);

    if (subscriptionDetails.plan === 'free') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update free plan. Please use checkout to upgrade.'
      });
    }

    // Get current subscription (service role required - RLS on subscriptions)
    const { data: subscription, error: subError } = await getSupabase()
      .from('subscriptions')
      .select('stripe_subscription_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (subError || !subscription) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found'
      });
    }

    // Get current subscription details from Stripe to determine billing cycle
    const stripeSubscription = await subscriptionService.getStripeSubscription(subscription.stripe_subscription_id);
    if (!stripeSubscription.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve current subscription details'
      });
    }

    // Determine current billing cycle based on Stripe subscription
    const currentPriceId = stripeSubscription.subscription.items.data[0].price.id;
    const isMonthly = currentPriceId.includes('monthly') || currentPriceId === process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || currentPriceId === process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID;
    const billingCycle = isMonthly ? 'monthly' : 'yearly';

    const newPriceId = subscriptionService.getPriceId(newPlan, billingCycle);
    if (!newPriceId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan configuration'
      });
    }

    // Update subscription in Stripe
    const updateResult = await subscriptionService.updateStripeSubscription(
      subscription.stripe_subscription_id,
      newPriceId
    );

    if (!updateResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update subscription',
        error: updateResult.error
      });
    }

    // Update user's plan in database (service role required - RLS on users)
    const { error: updateError } = await getSupabase()
      .from('users')
      .update({ subscription_plan: newPlan })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating user plan:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Failed to update user plan'
      });
    }

    res.json({
      success: true,
      message: 'Subscription updated successfully',
      newPlan,
      planLimits: subscriptionService.PLAN_LIMITS[newPlan]
    });

  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update subscription',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/subscriptions/cancel
// @desc    Cancel user's subscription
// @access  Private
router.post('/cancel', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const subscriptionDetails = await subscriptionService.getUserSubscriptionDetails(userId);

    if (subscriptionDetails.plan === 'free') {
      return res.status(400).json({
        success: false,
        message: 'No active subscription to cancel'
      });
    }

    // Get current subscription (service role required - RLS on subscriptions)
    const { data: subscription, error: subError } = await getSupabase()
      .from('subscriptions')
      .select('stripe_subscription_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (subError || !subscription) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found'
      });
    }

    // Cancel subscription in Stripe
    const cancelResult = await subscriptionService.cancelStripeSubscription(
      subscription.stripe_subscription_id
    );

    if (!cancelResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to cancel subscription',
        error: cancelResult.error
      });
    }

    // Update subscription status in database (service role required - RLS)
    const { error: updateError } = await getSupabase()
      .from('subscriptions')
      .update({ 
        status: 'canceled',
        canceled_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('stripe_subscription_id', subscription.stripe_subscription_id);

    if (updateError) {
      console.error('Error updating subscription status:', updateError);
    }

    // Get user email before downgrading (service role required - RLS on users)
    const { data: userData, error: userFetchError } = await getSupabase()
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    // Downgrade user to free plan (service role required - RLS on users)
    const { error: userUpdateError } = await getSupabase()
      .from('users')
      .update({ subscription_plan: 'free' })
      .eq('id', userId);

    if (userUpdateError) {
      console.error('Error downgrading user:', userUpdateError);
    }

    // Add user to email subscription list if they haven't unsubscribed
    if (userData && userData.email) {
      try {
        const { query } = require('../database/connection');
        const normalizedEmail = userData.email.toLowerCase().trim();
        
        // Check if email is already unsubscribed
        const unsubscribeCheck = await query(
          'SELECT id, is_subscribed FROM email_subscriptions WHERE email = $1',
          [normalizedEmail]
        );

        if (unsubscribeCheck.rows.length === 0) {
          // Email not in list, add it
          await query(
            `INSERT INTO email_subscriptions (email, user_id, is_subscribed, subscription_type, created_at, updated_at)
             VALUES ($1, $2, true, 'marketing', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
             ON CONFLICT (email) DO UPDATE SET user_id = $2, is_subscribed = true, updated_at = CURRENT_TIMESTAMP`,
            [normalizedEmail, userId]
          );
        } else if (unsubscribeCheck.rows[0].is_subscribed === false) {
          // Email exists but is unsubscribed - don't add them back
        } else {
          // Email exists and is subscribed, update user_id if needed
          await query(
            'UPDATE email_subscriptions SET user_id = $1, updated_at = CURRENT_TIMESTAMP WHERE email = $2',
            [userId, normalizedEmail]
          );
        }
      } catch (emailSubError) {
        console.error('Error adding user to email subscription list after downgrade:', emailSubError);
        // Don't fail the cancellation if email subscription fails
      }
    }

    res.json({
      success: true,
      message: 'Subscription canceled successfully',
      newPlan: 'free',
      planLimits: subscriptionService.PLAN_LIMITS.free
    });

  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel subscription',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/subscriptions/payment-methods
// @desc    Get user's payment methods
// @access  Private
router.get('/payment-methods', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const subscriptionDetails = await subscriptionService.getUserSubscriptionDetails(userId);

    if (!subscriptionDetails.stripeCustomerId) {
      return res.json({
        success: true,
        paymentMethods: []
      });
    }

    const paymentMethodsResult = await subscriptionService.getPaymentMethods(
      subscriptionDetails.stripeCustomerId
    );

    if (!paymentMethodsResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch payment methods',
        error: paymentMethodsResult.error
      });
    }

    res.json({
      success: true,
      paymentMethods: paymentMethodsResult.paymentMethods
    });

  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment methods',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/subscriptions/setup-payment-method
// @desc    Create setup intent for adding payment method
// @access  Private
router.post('/setup-payment-method', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const subscriptionDetails = await subscriptionService.getUserSubscriptionDetails(userId);

    if (!subscriptionDetails.stripeCustomerId) {
      return res.status(400).json({
        success: false,
        message: 'No Stripe customer found'
      });
    }

    const setupIntentResult = await subscriptionService.createSetupIntent(
      subscriptionDetails.stripeCustomerId
    );

    if (!setupIntentResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create setup intent',
        error: setupIntentResult.error
      });
    }

    res.json({
      success: true,
      clientSecret: setupIntentResult.clientSecret
    });

  } catch (error) {
    console.error('Error creating setup intent:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create setup intent',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/subscriptions/billing-portal
// @desc    Create billing portal session
// @access  Private
router.post('/billing-portal', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const subscriptionDetails = await subscriptionService.getUserSubscriptionDetails(userId);

    if (!subscriptionDetails.stripeCustomerId) {
      return res.status(400).json({
        success: false,
        message: 'No Stripe customer found'
      });
    }

    const returnUrl = req.body.returnUrl || `${process.env.FRONTEND_URL}/billing`;

    const portalResult = await subscriptionService.createBillingPortalSession(
      subscriptionDetails.stripeCustomerId,
      returnUrl
    );

    if (!portalResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create billing portal session',
        error: portalResult.error
      });
    }

    res.json({
      success: true,
      url: portalResult.url
    });

  } catch (error) {
    console.error('Error creating billing portal session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create billing portal session',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/subscriptions/validate-promo-code
// @desc    Validate a promo code
// @access  Private
router.post('/validate-promo-code', authenticateToken, async (req, res) => {
  try {
    const { promoCode } = req.body;

    if (!promoCode) {
      return res.status(400).json({
        success: false,
        message: 'Promo code is required'
      });
    }

    const validationResult = await subscriptionService.validatePromoCode(promoCode);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: validationResult.error || 'Invalid promo code'
      });
    }

    res.json({
      success: true,
      data: {
        valid: validationResult.valid,
        discount: validationResult.discount,
        message: validationResult.message
      }
    });

  } catch (error) {
    console.error('Error validating promo code:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate promo code',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/subscriptions/trial-eligibility
// @desc    Check if user is eligible for a free trial
// @access  Private
router.get('/trial-eligibility', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    if (!user.email) {
      return res.status(400).json({
        success: false,
        message: 'User email not found'
      });
    }

    const eligibility = await subscriptionService.checkTrialEligibility(user.email);

    res.json({
      success: true,
      eligible: eligibility.eligible,
      reason: eligibility.reason || null,
      previousTrialDate: eligibility.previousTrialDate || null
    });

  } catch (error) {
    console.error('Error checking trial eligibility:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check trial eligibility',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/subscriptions/usage
// @desc    Get user's usage statistics
// @access  Private
router.get('/usage', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const subscriptionDetails = await subscriptionService.getUserSubscriptionDetails(userId);
    const planLimits = subscriptionService.PLAN_LIMITS[subscriptionDetails.plan];

    const { periodStart, periodEnd, daysUntilReset } = await subscriptionService.getUsagePeriod(userId);

    // Use service role key to bypass RLS for usage statistics
    // This is safe because user is already authenticated via JWT
    const { createClient } = require('@supabase/supabase-js');
    const supabaseServiceRole = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    );

    // Get documents uploaded this period
    const { data: documents, error: docsError } = await supabaseServiceRole
      .from('documents')
      .select('id, file_size')
      .eq('user_id', userId)
      .gte('created_at', periodStart);

    // Get analyses performed this period
    const { data: analyses, error: analysesError } = await supabaseServiceRole
      .from('document_analyses')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', periodStart);

    // Get citation searches this period
    const { data: citationSearches, error: citationsError } = await supabaseServiceRole
      .from('citation_searches')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', periodStart);

    // Get study pack generations this period (recorded in quiz_usage with quiz_type='study_pack')
    const { data: studyPacks, error: studyPacksError } = await supabaseServiceRole
      .from('quiz_usage')
      .select('id')
      .eq('user_id', userId)
      .eq('quiz_type', 'study_pack')
      .gte('created_at', periodStart);

    // Calculate current storage used (only existing documents - decreases when files are deleted)
    const { data: currentDocuments, error: currentDocsError } = await supabaseServiceRole
      .from('documents')
      .select('file_size')
      .eq('user_id', userId);

    const documentsUploaded = documents ? documents.length : 0;
    const documentsAnalyzed = analyses ? analyses.length : 0;
    const citationSearchesUsed = citationSearches ? citationSearches.length : 0;
    const studyPacksGenerated = studyPacks ? studyPacks.length : 0;
    const storageUsed = currentDocuments ? currentDocuments.reduce((total, doc) => total + (doc.file_size || 0), 0) : 0;

    const isPaid = subscriptionDetails.plan === 'pro' || subscriptionDetails.plan === 'premium';

    // Pro/Premium: combined pool (analyses + citations + study packs) and combined words (humanize + summarize)
    let combinedActionsUsed, combinedActionsRemaining, combinedWordsUsed, combinedWordsRemaining;
    if (isPaid && planLimits.combinedActionsPerMonth) {
      combinedActionsUsed = documentsAnalyzed + citationSearchesUsed + studyPacksGenerated;
      combinedActionsRemaining = Math.max(0, planLimits.combinedActionsPerMonth - combinedActionsUsed);

      // Get humanize + summarize words for combined words pool
      const { data: humanizeData } = await supabaseServiceRole
        .from('humanize_usage')
        .select('words_count')
        .eq('user_id', userId)
        .gte('created_at', periodStart);
      const { data: summarizeData } = await supabaseServiceRole
        .from('summarize_usage')
        .select('words_count')
        .eq('user_id', userId)
        .gte('created_at', periodStart);
      const humanizeWords = (humanizeData || []).reduce((s, r) => s + (r.words_count || 0), 0);
      const summarizeWords = (summarizeData || []).reduce((s, r) => s + (r.words_count || 0), 0);
      combinedWordsUsed = humanizeWords + summarizeWords;
      combinedWordsRemaining = Math.max(0, (planLimits.combinedWordsPerMonth || 0) - combinedWordsUsed);
    }

    // Calculate remaining usage (legacy per-feature for free plan)
    const uploadsRemaining = planLimits.documentsPerMonth === -1 ? -1 : Math.max(0, planLimits.documentsPerMonth - documentsUploaded);
    const analysesRemaining = planLimits.analysesPerMonth === -1 ? -1 : Math.max(0, planLimits.analysesPerMonth - documentsAnalyzed);
    const citationsRemaining = planLimits.citationSearchesPerMonth === -1 ? -1 : Math.max(0, planLimits.citationSearchesPerMonth - citationSearchesUsed);
    const studyPacksRemaining = planLimits.studyPackGenerationsPerMonth === -1 ? -1 : Math.max(0, planLimits.studyPackGenerationsPerMonth - studyPacksGenerated);
    const storageRemaining = planLimits.maxTotalStorage ? Math.max(0, planLimits.maxTotalStorage - storageUsed) : -1;

    const payload = {
      success: true,
      documentsUploaded,
      documentsAnalyzed,
      citationSearchesUsed,
      studyPacksGenerated,
      storageUsed,
      storageLimit: planLimits.maxTotalStorage,
      storageRemaining,
      uploadsRemaining,
      analysesRemaining,
      citationsRemaining,
      studyPacksRemaining,
      plan: subscriptionDetails.plan,
      planLimits,
      periodEnd,
      daysUntilReset
    };
    if (isPaid) {
      payload.combinedActionsUsed = combinedActionsUsed;
      payload.combinedActionsRemaining = combinedActionsRemaining;
      payload.combinedWordsUsed = combinedWordsUsed;
      payload.combinedWordsRemaining = combinedWordsRemaining;
    }
    res.json(payload);

  } catch (error) {
    console.error('Error fetching usage statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch usage statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;