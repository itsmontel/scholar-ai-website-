const express = require('express');
const router = express.Router();
const subscriptionService = require('../services/subscriptionService');

// @route   GET /api/webhooks/test
// @desc    Test webhook endpoint
// @access  Public
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Webhook endpoint is working!',
    timestamp: new Date().toISOString()
  });
});

// @route   POST /api/webhooks/stripe
// @desc    Handle Stripe webhook events
// @access  Public (but verified with signature)
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    const payload = req.body;

    // Verify webhook signature
    const verificationResult = subscriptionService.verifyWebhookSignature(payload, signature);
    
    if (!verificationResult.success) {
      console.error('Webhook signature verification failed:', verificationResult.error);
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = verificationResult.event;
    console.log(`Received Stripe webhook: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
      
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;
      
      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });

  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Handle successful checkout session
async function handleCheckoutSessionCompleted(session) {
  try {
    console.log('Processing checkout session completed:', session.id);
    
    // Get customer ID from session
    const customerId = session.customer;
    
    // Find user by Stripe customer ID
    const { data: user, error: userError } = await subscriptionService.supabase
      .from('users')
      .select('id, email')
      .eq('stripe_customer_id', customerId)
      .single();

    if (userError || !user) {
      console.error('User not found for customer:', customerId);
      return;
    }

    // Get subscription details from Stripe
    const subscriptionId = session.subscription;
    if (!subscriptionId) {
      console.error('No subscription ID in checkout session');
      return;
    }

    const stripeResult = await subscriptionService.getStripeSubscription(subscriptionId);
    if (!stripeResult.success) {
      console.error('Failed to fetch subscription from Stripe:', stripeResult.error);
      return;
    }

    const subscription = stripeResult.subscription;
    
    // Determine plan based on price ID
    const priceId = subscription.items.data[0].price.id;
    let plan = 'free';
    
    if (priceId === process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || priceId === process.env.STRIPE_STARTER_YEARLY_PRICE_ID) {
      plan = 'starter';
    } else if (priceId === process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID || priceId === process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID) {
      plan = 'premium';
    }

    // Update user's subscription plan
    const { error: updateError } = await subscriptionService.supabase
      .from('users')
      .update({ subscription_plan: plan })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating user plan:', updateError);
    }

    // Record subscription in database
    const { error: subError } = await subscriptionService.supabase
      .from('subscriptions')
      .insert({
        user_id: user.id,
        stripe_subscription_id: subscriptionId,
        stripe_customer_id: customerId,
        plan: plan,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        created_at: new Date().toISOString()
      });

    if (subError) {
      console.error('Error recording subscription:', subError);
    }

    console.log(`Successfully processed subscription for user ${user.id}: ${plan} plan`);

  } catch (error) {
    console.error('Error handling checkout session completed:', error);
  }
}

// Handle subscription created
async function handleSubscriptionCreated(subscription) {
  try {
    console.log('Processing subscription created:', subscription.id);
    
    // Find user by customer ID
    const { data: user, error: userError } = await subscriptionService.supabase
      .from('users')
      .select('id')
      .eq('stripe_customer_id', subscription.customer)
      .single();

    if (userError || !user) {
      console.error('User not found for customer:', subscription.customer);
      return;
    }

    // Determine plan based on price ID
    const priceId = subscription.items.data[0].price.id;
    let plan = 'free';
    
    if (priceId === process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || priceId === process.env.STRIPE_STARTER_YEARLY_PRICE_ID) {
      plan = 'starter';
    } else if (priceId === process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID || priceId === process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID) {
      plan = 'premium';
    }

    // Update user's subscription plan
    const { error: updateError } = await subscriptionService.supabase
      .from('users')
      .update({ subscription_plan: plan })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating user plan:', updateError);
    }

    console.log(`Subscription created for user ${user.id}: ${plan} plan`);

  } catch (error) {
    console.error('Error handling subscription created:', error);
  }
}

// Handle subscription updated
async function handleSubscriptionUpdated(subscription) {
  try {
    console.log('Processing subscription updated:', subscription.id);
    
    // Find user by customer ID
    const { data: user, error: userError } = await subscriptionService.supabase
      .from('users')
      .select('id')
      .eq('stripe_customer_id', subscription.customer)
      .single();

    if (userError || !user) {
      console.error('User not found for customer:', subscription.customer);
      return;
    }

    // Determine plan based on price ID
    const priceId = subscription.items.data[0].price.id;
    let plan = 'free';
    
    if (priceId === process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || priceId === process.env.STRIPE_STARTER_YEARLY_PRICE_ID) {
      plan = 'starter';
    } else if (priceId === process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID || priceId === process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID) {
      plan = 'premium';
    }

    // Update subscription in database
    const { error: updateError } = await subscriptionService.supabase
      .from('subscriptions')
      .update({
        plan: plan,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id);

    if (updateError) {
      console.error('Error updating subscription:', updateError);
    }

    // Update user's subscription plan
    const { error: userUpdateError } = await subscriptionService.supabase
      .from('users')
      .update({ subscription_plan: plan })
      .eq('id', user.id);

    if (userUpdateError) {
      console.error('Error updating user plan:', userUpdateError);
    }

    console.log(`Subscription updated for user ${user.id}: ${plan} plan`);

  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

// Handle subscription deleted
async function handleSubscriptionDeleted(subscription) {
  try {
    console.log('Processing subscription deleted:', subscription.id);
    
    // Find user by customer ID
    const { data: user, error: userError } = await subscriptionService.supabase
      .from('users')
      .select('id')
      .eq('stripe_customer_id', subscription.customer)
      .single();

    if (userError || !user) {
      console.error('User not found for customer:', subscription.customer);
      return;
    }

    // Update subscription status in database
    const { error: updateError } = await subscriptionService.supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id);

    if (updateError) {
      console.error('Error updating subscription status:', updateError);
    }

    // Downgrade user to free plan
    const { error: userUpdateError } = await subscriptionService.supabase
      .from('users')
      .update({ subscription_plan: 'free' })
      .eq('id', user.id);

    if (userUpdateError) {
      console.error('Error downgrading user:', userUpdateError);
    }

    console.log(`Subscription canceled for user ${user.id}, downgraded to free plan`);

  } catch (error) {
    console.error('Error handling subscription deleted:', error);
  }
}

// Handle successful invoice payment
async function handleInvoicePaymentSucceeded(invoice) {
  try {
    console.log('Processing invoice payment succeeded:', invoice.id);
    
    // Find user by customer ID
    const { data: user, error: userError } = await subscriptionService.supabase
      .from('users')
      .select('id')
      .eq('stripe_customer_id', invoice.customer)
      .single();

    if (userError || !user) {
      console.error('User not found for customer:', invoice.customer);
      return;
    }

    // Update subscription status to active
    const { error: updateError } = await subscriptionService.supabase
      .from('subscriptions')
      .update({ status: 'active' })
      .eq('stripe_customer_id', invoice.customer)
      .eq('status', 'past_due');

    if (updateError) {
      console.error('Error updating subscription status:', updateError);
    }

    console.log(`Invoice payment succeeded for user ${user.id}`);

  } catch (error) {
    console.error('Error handling invoice payment succeeded:', error);
  }
}

// Handle failed invoice payment
async function handleInvoicePaymentFailed(invoice) {
  try {
    console.log('Processing invoice payment failed:', invoice.id);
    
    // Find user by customer ID
    const { data: user, error: userError } = await subscriptionService.supabase
      .from('users')
      .select('id')
      .eq('stripe_customer_id', invoice.customer)
      .single();

    if (userError || !user) {
      console.error('User not found for customer:', invoice.customer);
      return;
    }

    // Update subscription status to past_due
    const { error: updateError } = await subscriptionService.supabase
      .from('subscriptions')
      .update({ status: 'past_due' })
      .eq('stripe_customer_id', invoice.customer);

    if (updateError) {
      console.error('Error updating subscription status:', updateError);
    }

    console.log(`Invoice payment failed for user ${user.id}`);

  } catch (error) {
    console.error('Error handling invoice payment failed:', error);
  }
}

// Handle trial will end
async function handleTrialWillEnd(subscription) {
  try {
    console.log('Processing trial will end:', subscription.id);
    
    // Find user by customer ID
    const { data: user, error: userError } = await subscriptionService.supabase
      .from('users')
      .select('id, email')
      .eq('stripe_customer_id', subscription.customer)
      .single();

    if (userError || !user) {
      console.error('User not found for customer:', subscription.customer);
      return;
    }

    // TODO: Send notification email about trial ending
    console.log(`Trial ending soon for user ${user.id} (${user.email})`);

  } catch (error) {
    console.error('Error handling trial will end:', error);
  }
}

module.exports = router;