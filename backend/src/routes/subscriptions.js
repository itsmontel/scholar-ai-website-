const express = require('express');
const router = express.Router();
const subscriptionService = require('../services/subscriptionService');
const { authenticateToken } = require('../middleware/auth');

// @route   POST /api/subscriptions/create-checkout-session
// @desc    Create a Stripe checkout session for subscription
// @access  Private
router.post('/create-checkout-session', authenticateToken, async (req, res) => {
  try {
    const { planType, billingCycle, successUrl, cancelUrl } = req.body;
    const userId = req.user.id;

    if (!planType || !billingCycle || !successUrl || !cancelUrl) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: planType, billingCycle, successUrl, cancelUrl'
      });
    }

    // Get user details from the authenticated user (already available from auth middleware)
    const user = req.user;
    console.log('Using authenticated user:', { id: user.id, email: user.email });

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

      // Update user with Stripe customer ID
      const { error: updateError } = await subscriptionService.supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating user with Stripe customer ID:', updateError);
      }
    }

    // Create checkout session
    const sessionResult = await subscriptionService.createCheckoutSession(
      customerId,
      planType,
      billingCycle,
      userId
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
      // Get the most recent active subscription
      const { data: subscription, error } = await subscriptionService.supabase
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

    if (!newPlan || !['starter', 'premium'].includes(newPlan)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan. Must be starter or premium.'
      });
    }

    const subscriptionDetails = await subscriptionService.getUserSubscriptionDetails(userId);

    if (subscriptionDetails.plan === 'free') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update free plan. Please use checkout to upgrade.'
      });
    }

    // Get current subscription
    const { data: subscription, error: subError } = await subscriptionService.supabase
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

    const newPriceId = subscriptionService.getPriceId(newPlan);
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

    // Update user's plan in database
    const { error: updateError } = await subscriptionService.supabase
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

    // Get current subscription
    const { data: subscription, error: subError } = await subscriptionService.supabase
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

    // Update subscription status in database
    const { error: updateError } = await subscriptionService.supabase
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

    // Downgrade user to free plan
    const { error: userUpdateError } = await subscriptionService.supabase
      .from('users')
      .update({ subscription_plan: 'free' })
      .eq('id', userId);

    if (userUpdateError) {
      console.error('Error downgrading user:', userUpdateError);
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

    const returnUrl = req.body.returnUrl || `${req.protocol}://${req.get('host')}/billing`;

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

// @route   GET /api/subscriptions/usage
// @desc    Get user's usage statistics
// @access  Private
router.get('/usage', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const subscriptionDetails = await subscriptionService.getUserSubscriptionDetails(userId);
    const planLimits = subscriptionService.PLAN_LIMITS[subscriptionDetails.plan];

    // Get current month usage
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

    // Get documents uploaded this month
    const { data: documents, error: docsError } = await subscriptionService.supabase
      .from('documents')
      .select('id, file_size')
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString());

    // Get analyses performed this month
    const { data: analyses, error: analysesError } = await subscriptionService.supabase
      .from('document_analyses')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString());

    // Calculate total storage used (persistent - doesn't decrease when files are deleted)
    const { data: allDocuments, error: allDocsError } = await subscriptionService.supabase
      .from('documents')
      .select('file_size')
      .eq('user_id', userId);

    const documentsUploaded = documents ? documents.length : 0;
    const documentsAnalyzed = analyses ? analyses.length : 0;
    const storageUsed = allDocuments ? allDocuments.reduce((total, doc) => total + (doc.file_size || 0), 0) : 0;

    // Calculate remaining usage
    const uploadsRemaining = planLimits.documentsPerMonth === -1 ? -1 : Math.max(0, planLimits.documentsPerMonth - documentsUploaded);
    const analysesRemaining = planLimits.analysesPerMonth === -1 ? -1 : Math.max(0, planLimits.analysesPerMonth - documentsAnalyzed);

    res.json({
      success: true,
      documentsUploaded,
      documentsAnalyzed,
      storageUsed,
      storageLimit: planLimits.maxDocumentSize,
      uploadsRemaining,
      analysesRemaining,
      plan: subscriptionDetails.plan,
      planLimits
    });

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