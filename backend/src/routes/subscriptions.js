const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { createClient } = require('@supabase/supabase-js');

const { authenticateToken } = require('../middleware/auth');
// const { validate, schemas } = require('../middleware/validation');
const stripeService = require('../services/stripeService');

const router = express.Router();

// @route   POST /api/subscriptions/create-checkout-session
// @desc    Create a Stripe Checkout session
// @access  Private
router.post('/create-checkout-session', authenticateToken, async (req, res) => {
  try {
    const { planType, billingCycle } = req.body;
    const userId = req.user.id;

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Get user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, institution, research_field, stripe_customer_id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let customerId = user.stripe_customer_id;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customerResult = await stripeService.createCustomer({
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        institution: user.institution,
        researchField: user.research_field
      });

      customerId = customerResult.customerId;

      // Update user with Stripe customer ID
      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);
    }

    // Create Stripe Checkout session
    const checkoutSession = await stripeService.createCheckoutSession(
      customerId,
      planType,
      billingCycle,
      userId
    );

    res.json({
      success: true,
      message: 'Checkout session created successfully',
      data: {
        checkoutUrl: checkoutSession.url
      }
    });
  } catch (error) {
    console.error('Create checkout session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create checkout session'
    });
  }
});

// @route   POST /api/subscriptions/create
// @desc    Create a new subscription
// @access  Private
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { planType, billingCycle } = req.body;
    const userId = req.user.id;

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Check if user already has an active subscription
    const { data: existingSubscription, error: existingError } = await supabase
      .from('subscriptions')
      .select('id, stripe_subscription_id, status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (existingSubscription && !existingError) {
      return res.status(400).json({
        success: false,
        message: 'User already has an active subscription'
      });
    }

    // Get user data for Stripe customer creation
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, institution, research_field, stripe_customer_id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let customerId = user.stripe_customer_id;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customerResult = await stripeService.createCustomer({
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        institution: user.institution,
        researchField: user.research_field
      });

      customerId = customerResult.customerId;

      // Update user with Stripe customer ID
      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);
    }

    // Create Stripe subscription
    const subscriptionResult = await stripeService.createSubscription(customerId, planType, billingCycle);

    // Save subscription to database
    const subscriptionId = uuidv4();
    await supabase
      .from('subscriptions')
      .insert({
        id: subscriptionId,
        user_id: userId,
        stripe_subscription_id: subscriptionResult.subscriptionId,
        plan_type: planType,
        status: 'pending',
        created_at: new Date().toISOString()
      });

    // Update user subscription plan
    await supabase
      .from('users')
      .update({ subscription_plan: planType })
      .eq('id', userId);

    res.json({
      success: true,
      message: 'Subscription created successfully',
      data: {
        subscriptionId,
        clientSecret: subscriptionResult.clientSecret,
        planType,
        billingCycle
      }
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create subscription'
    });
  }
});

// @route   GET /api/subscriptions/current
// @desc    Get current user subscription
// @access  Private
router.get('/current', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(
      `SELECT s.*, u.subscription_plan, u.subscription_status
       FROM subscriptions s
       JOIN users u ON s.user_id = u.id
       WHERE s.user_id = $1 AND s.status = $2
       ORDER BY s.created_at DESC
       LIMIT 1`,
      [userId, 'active']
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        data: {
          subscription: null,
          message: 'No active subscription found'
        }
      });
    }

    const subscription = result.rows[0];

    // Get detailed subscription info from Stripe
    try {
      const stripeSubscription = await stripeService.getSubscription(subscription.stripe_subscription_id);
      
      res.json({
        success: true,
        data: {
          subscription: {
            id: subscription.id,
            planType: subscription.plan_type,
            status: subscription.status,
            currentPeriodStart: subscription.current_period_start,
            currentPeriodEnd: subscription.current_period_end,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            createdAt: subscription.created_at,
            stripeSubscription: stripeSubscription.subscription
          }
        }
      });
    } catch (stripeError) {
      // If Stripe call fails, return basic subscription info
      res.json({
        success: true,
        data: {
          subscription: {
            id: subscription.id,
            planType: subscription.plan_type,
            status: subscription.status,
            currentPeriodStart: subscription.current_period_start,
            currentPeriodEnd: subscription.current_period_end,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            createdAt: subscription.created_at
          }
        }
      });
    }
  } catch (error) {
    console.error('Get current subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get current subscription'
    });
  }
});

// @route   PUT /api/subscriptions/update
// @desc    Update subscription plan
// @access  Private
router.put('/update', authenticateToken, async (req, res) => {
  try {
    const { planType, billingCycle } = req.body;
    const userId = req.user.id;

    // Get current subscription
    const result = await query(
      'SELECT id, stripe_subscription_id, plan_type FROM subscriptions WHERE user_id = $1 AND status = $2',
      [userId, 'active']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found'
      });
    }

    const currentSubscription = result.rows[0];

    // Update Stripe subscription
    const updateResult = await stripeService.updateSubscription(
      currentSubscription.stripe_subscription_id,
      planType,
      billingCycle
    );

    // Update database
    await query(
      'UPDATE subscriptions SET plan_type = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [planType, currentSubscription.id]
    );

    // Update user subscription plan
    await query(
      'UPDATE users SET subscription_plan = $1 WHERE id = $2',
      [planType, userId]
    );

    res.json({
      success: true,
      message: 'Subscription updated successfully',
      data: {
        subscriptionId: currentSubscription.id,
        newPlanType: planType,
        newBillingCycle: billingCycle
      }
    });
  } catch (error) {
    console.error('Update subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update subscription'
    });
  }
});

// @route   POST /api/subscriptions/cancel
// @desc    Cancel subscription
// @access  Private
router.post('/cancel', authenticateToken, async (req, res) => {
  try {
    const { cancelAtPeriodEnd = true } = req.body;
    const userId = req.user.id;

    // Get current subscription
    const result = await query(
      'SELECT id, stripe_subscription_id FROM subscriptions WHERE user_id = $1 AND status = $2',
      [userId, 'active']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found'
      });
    }

    const subscription = result.rows[0];

    // Cancel Stripe subscription
    const cancelResult = await stripeService.cancelSubscription(
      subscription.stripe_subscription_id,
      cancelAtPeriodEnd
    );

    // Update database
    await query(
      'UPDATE subscriptions SET cancel_at_period_end = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [cancelAtPeriodEnd, subscription.id]
    );

    res.json({
      success: true,
      message: cancelResult.message,
      data: {
        subscriptionId: subscription.id,
        cancelAtPeriodEnd
      }
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel subscription'
    });
  }
});

// @route   GET /api/subscriptions/payment-methods
// @desc    Get user's payment methods
// @access  Private
router.get('/payment-methods', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's Stripe customer ID
    const userResult = await query(
      'SELECT stripe_customer_id FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].stripe_customer_id) {
      return res.json({
        success: true,
        data: {
          paymentMethods: []
        }
      });
    }

    const customerId = userResult.rows[0].stripe_customer_id;
    const paymentMethodsResult = await stripeService.getPaymentMethods(customerId);

    res.json({
      success: true,
      data: {
        paymentMethods: paymentMethodsResult.paymentMethods
      }
    });
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment methods'
    });
  }
});

// @route   POST /api/subscriptions/setup-payment-method
// @desc    Create setup intent for adding payment method
// @access  Private
router.post('/setup-payment-method', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's Stripe customer ID
    const userResult = await query(
      'SELECT stripe_customer_id FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let customerId = userResult.rows[0].stripe_customer_id;

    // Create customer if doesn't exist
    if (!customerId) {
      const user = await query(
        'SELECT id, email, first_name, last_name FROM users WHERE id = $1',
        [userId]
      );

      const customerResult = await stripeService.createCustomer({
        id: user.rows[0].id,
        email: user.rows[0].email,
        firstName: user.rows[0].first_name,
        lastName: user.rows[0].last_name
      });

      customerId = customerResult.customerId;

      // Update user with Stripe customer ID
      await query(
        'UPDATE users SET stripe_customer_id = $1 WHERE id = $2',
        [customerId, userId]
      );
    }

    // Create setup intent
    const setupResult = await stripeService.createSetupIntent(customerId);

    res.json({
      success: true,
      data: {
        clientSecret: setupResult.clientSecret
      }
    });
  } catch (error) {
    console.error('Setup payment method error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to setup payment method'
    });
  }
});

// @route   POST /api/subscriptions/billing-portal
// @desc    Create billing portal session
// @access  Private
router.post('/billing-portal', authenticateToken, async (req, res) => {
  try {
    const { returnUrl } = req.body;
    const userId = req.user.id;

    // Get user's Stripe customer ID
    const userResult = await query(
      'SELECT stripe_customer_id FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].stripe_customer_id) {
      return res.status(404).json({
        success: false,
        message: 'No Stripe customer found'
      });
    }

    const customerId = userResult.rows[0].stripe_customer_id;
    const portalResult = await stripeService.createBillingPortalSession(
      customerId,
      returnUrl || `${process.env.FRONTEND_URL}/account`
    );

    res.json({
      success: true,
      data: {
        url: portalResult.url
      }
    });
  } catch (error) {
    console.error('Create billing portal session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create billing portal session'
    });
  }
});

// @route   GET /api/subscriptions/usage
// @desc    Get subscription usage statistics
// @access  Private
router.get('/usage', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = '30' } = req.query; // days

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Get usage statistics
    const usageResult = await query(
      `SELECT 
         action_type,
         COUNT(*) as count,
         SUM(credits_used) as total_credits
       FROM usage_tracking 
       WHERE user_id = $1 AND created_at >= $2
       GROUP BY action_type`,
      [userId, startDate]
    );

    // Get document count
    const docResult = await query(
      'SELECT COUNT(*) as document_count FROM documents WHERE user_id = $1 AND created_at >= $2',
      [userId, startDate]
    );

    // Get analysis count
    const analysisResult = await query(
      'SELECT COUNT(*) as analysis_count FROM document_analyses WHERE user_id = $1 AND created_at >= $2',
      [userId, startDate]
    );

    res.json({
      success: true,
      data: {
        period: `${period} days`,
        usage: usageResult.rows,
        documentCount: parseInt(docResult.rows[0].document_count),
        analysisCount: parseInt(analysisResult.rows[0].analysis_count)
      }
    });
  } catch (error) {
    console.error('Get usage statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get usage statistics'
    });
  }
});

module.exports = router;
