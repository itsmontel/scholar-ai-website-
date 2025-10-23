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
    maxDocumentSize: 1024 * 1024, // 1MB per document
    maxTotalStorage: 1024 * 1024, // 1MB total storage
    maxAnalysisPercentage: 50, // 50% of document
    name: 'Free'
  },
  starter: {
    documentsPerMonth: -1, // unlimited
    analysesPerMonth: 999, // 999 analyses per month
    maxDocumentSize: 25 * 1024 * 1024, // 25MB per document
    maxTotalStorage: 25 * 1024 * 1024, // 25MB total storage
    maxAnalysisPercentage: 100, // 100% of document
    name: 'Starter',
    price: 19.99
  },
  premium: {
    documentsPerMonth: -1, // unlimited
    analysesPerMonth: 999, // 999 analyses per month
    maxDocumentSize: 1024 * 1024 * 1024, // 1GB per document
    maxTotalStorage: 1024 * 1024 * 1024, // 1GB total storage
    maxAnalysisPercentage: 100, // 100% of document
    name: 'Premium',
    price: 39.99
  }
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
      const { data: analyses, error } = await supabaseServiceRole
        .from('document_analyses')
        .select('id')
        .eq('user_id', userId)
        .gte('created_at', startOfMonth.toISOString());
      
      if (!error) {
        usage = analyses.length;
      }
      console.log(`checkLimit: Found ${usage} analyses for user ${userId} this month (limit: ${planLimits[limitType]})`);
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
const createCheckoutSession = async (customerId, planType, billingCycle, userId) => {
  try {
    console.log('🔥 STRIPE: Creating checkout session for:', { customerId, planType, billingCycle, userId });
    
    // Get price ID based on plan and billing cycle
    const priceId = getPriceId(planType, billingCycle);
    console.log('🔥 STRIPE: Using price ID:', priceId);
    
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
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?payment=success`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/pricing?payment=cancelled`,
      metadata: {
        userId,
        planType,
        billingCycle,
        source: 'writescholar'
      },
      custom_text: {
        submit: {
          message: 'Subscribe to WriteScholar'
        }
      }
    };
    
    console.log('🔥 STRIPE: Session config:', JSON.stringify(sessionConfig, null, 2));
    
    const session = await stripe.checkout.sessions.create(sessionConfig);
    
    console.log('🔥 STRIPE: Session created successfully:', { id: session.id, url: session.url });
    return { success: true, sessionId: session.id, url: session.url };
  } catch (error) {
    console.error('🔥 STRIPE ERROR: Failed to create checkout session:', error);
    console.error('🔥 STRIPE ERROR: Error details:', {
      message: error.message,
      type: error.type,
      code: error.code,
      param: error.param
    });
    return { success: false, error: error.message };
  }
};

// Get price ID based on plan and billing cycle
const getPriceId = (planType, billingCycle) => {
  console.log('🔥 STRIPE: Getting price ID for:', { planType, billingCycle });
  
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

  console.log('🔥 STRIPE: Available prices:', prices);
  console.log('🔥 STRIPE: Environment variables:', {
    STRIPE_STARTER_MONTHLY_PRICE_ID: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID,
    STRIPE_STARTER_YEARLY_PRICE_ID: process.env.STRIPE_STARTER_YEARLY_PRICE_ID,
    STRIPE_PREMIUM_MONTHLY_PRICE_ID: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID,
    STRIPE_PREMIUM_YEARLY_PRICE_ID: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID
  });

  const priceId = prices[planType]?.[billingCycle];
  if (!priceId) {
    console.error('🔥 STRIPE ERROR: Invalid plan/billing combination:', { planType, billingCycle });
    throw new Error(`Invalid plan type or billing cycle: ${planType}/${billingCycle}`);
  }

  console.log('🔥 STRIPE: Selected price ID:', priceId);
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

module.exports = {
  supabase,
  PLAN_LIMITS,
  getPriceId,
  getUserSubscriptionDetails,
  checkLimit,
  getRemainingUsage,
  getPlanDetails,
  getPlanLimits,
  createStripeCustomer,
  createCheckoutSession,
  getStripeSubscription,
  updateStripeSubscription,
  cancelStripeSubscription,
  getPaymentMethods,
  createSetupIntent,
  createBillingPortalSession,
  verifyWebhookSignature
};

