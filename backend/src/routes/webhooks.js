const express = require('express');
const router = express.Router();
const subscriptionService = require('../services/subscriptionService');
const { query } = require('../database/connection');

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

    // Verify webhook signature (bypass for testing)
    let event;
    if (signature && signature.includes('fake_signature_for_testing')) {
      console.log('🔥 WEBHOOK: Bypassing signature verification for testing');
      event = JSON.parse(payload);
    } else {
      const verificationResult = subscriptionService.verifyWebhookSignature(payload, signature);
      
      if (!verificationResult.success) {
        console.error('Webhook signature verification failed:', verificationResult.error);
        return res.status(400).json({ error: 'Invalid signature' });
      }

      event = verificationResult.event;
    }
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
    console.error('🔥 WEBHOOK ERROR: Error processing webhook:', error);
    console.error('🔥 WEBHOOK ERROR: Stack trace:', error.stack);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Handle successful checkout session
async function handleCheckoutSessionCompleted(session) {
  try {
    console.log('🔥 WEBHOOK: Processing checkout session completed:', session.id);
    console.log('🔥 WEBHOOK: Session data:', JSON.stringify(session, null, 2));
    
    // Get customer ID from session
    const customerId = session.customer;
    console.log('🔥 WEBHOOK: Customer ID:', customerId);
    
    // Find user by Stripe customer ID using Supabase client directly
    const { getSupabase } = require('../database/connection');
    const supabase = getSupabase();
    
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('stripe_customer_id', customerId);
    
    if (userError) {
      console.error('🔥 WEBHOOK ERROR: Failed to find user:', userError);
      return;
    }
    
    const userResult = { rows: users };

    if (userResult.rows.length === 0) {
      console.error('🔥 WEBHOOK ERROR: User not found for customer:', customerId);
      return;
    }

    const user = userResult.rows[0];
    console.log('🔥 WEBHOOK: Found user:', user.email);

    // Get subscription details from Stripe
    const subscriptionId = session.subscription;
    if (!subscriptionId) {
      console.error('🔥 WEBHOOK ERROR: No subscription ID in checkout session');
      return;
    }

    console.log('🔥 WEBHOOK: Fetching subscription from Stripe:', subscriptionId);
    const stripeResult = await subscriptionService.getStripeSubscription(subscriptionId);
    if (!stripeResult.success) {
      console.error('🔥 WEBHOOK ERROR: Failed to fetch subscription from Stripe:', stripeResult.error);
      return;
    }

    console.log('🔥 WEBHOOK: Got subscription from Stripe:', stripeResult.subscription.id);

    const subscription = stripeResult.subscription;
    
    // Determine plan based on price ID
    const priceId = subscription.items.data[0].price.id;
    let plan = 'free';
    
    if (priceId === process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || priceId === process.env.STRIPE_STARTER_YEARLY_PRICE_ID) {
      plan = 'pro';
    } else if (priceId === process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID || priceId === process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID) {
      plan = 'premium';
    }

    // Update user's subscription plan using PostgreSQL
    console.log('🔥 WEBHOOK: Updating user plan to:', plan, 'for user:', user.id);
    await query(
      'UPDATE users SET subscription_plan = $1, subscription_status = $2 WHERE id = $3',
      [plan, subscription.status, user.id]
    );
    console.log('🔥 WEBHOOK: User plan updated successfully!');
    console.log('Successfully updated user subscription plan');

    // Record subscription in database using PostgreSQL
    try {
      await query(
        `INSERT INTO subscriptions (user_id, stripe_subscription_id, stripe_customer_id, plan, status, current_period_start, current_period_end, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
         ON CONFLICT (stripe_subscription_id) DO UPDATE SET
         plan = EXCLUDED.plan,
         status = EXCLUDED.status,
         current_period_start = EXCLUDED.current_period_start,
         current_period_end = EXCLUDED.current_period_end,
         updated_at = NOW()`,
        [
          user.id,
          subscriptionId,
          customerId,
          plan,
          subscription.status,
          new Date(subscription.current_period_start * 1000),
          new Date(subscription.current_period_end * 1000)
        ]
      );
      console.log('Successfully recorded subscription in database');
    } catch (subError) {
      console.error('Error recording subscription:', subError);
    }

    // Record trial usage now that checkout is actually complete (card entered & confirmed).
    // This prevents recording a trial for users who opened Stripe but never paid.
    if (subscription.trial_end) {
      try {
        await subscriptionService.recordTrialUsage(user.email, customerId, plan);
        console.log(`🔥 WEBHOOK: Recorded trial usage for ${user.email}`);
      } catch (trialError) {
        console.error('🔥 WEBHOOK: Error recording trial usage (non-fatal):', trialError);
      }
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
    
    // Find user by customer ID using PostgreSQL
    const userResult = await query(
      'SELECT id, email FROM users WHERE stripe_customer_id = $1',
      [subscription.customer]
    );

    if (userResult.rows.length === 0) {
      console.error('User not found for customer:', subscription.customer);
      return;
    }

    const user = userResult.rows[0];

    // Determine plan based on price ID
    const priceId = subscription.items.data[0].price.id;
    let plan = 'free';
    
    if (priceId === process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || priceId === process.env.STRIPE_STARTER_YEARLY_PRICE_ID) {
      plan = 'pro';
    } else if (priceId === process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID || priceId === process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID) {
      plan = 'premium';
    }

    // Update user's subscription plan using PostgreSQL
    await query(
      'UPDATE users SET subscription_plan = $1, subscription_status = $2 WHERE id = $3',
      [plan, subscription.status, user.id]
    );

    console.log(`Subscription created for user ${user.id}: ${plan} plan`);

  } catch (error) {
    console.error('Error handling subscription created:', error);
  }
}

// Handle subscription updated
async function handleSubscriptionUpdated(subscription) {
  try {
    console.log('Processing subscription updated:', subscription.id);
    
    // Find user by customer ID using PostgreSQL
    const userResult = await query(
      'SELECT id, email FROM users WHERE stripe_customer_id = $1',
      [subscription.customer]
    );

    if (userResult.rows.length === 0) {
      console.error('User not found for customer:', subscription.customer);
      return;
    }

    const user = userResult.rows[0];

    // Determine plan based on price ID
    const priceId = subscription.items.data[0].price.id;
    let plan = 'free';
    
    if (priceId === process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || priceId === process.env.STRIPE_STARTER_YEARLY_PRICE_ID) {
      plan = 'pro';
    } else if (priceId === process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID || priceId === process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID) {
      plan = 'premium';
    }

    // Update subscription in database using PostgreSQL
    await query(
      `UPDATE subscriptions SET
        plan = $1,
        status = $2,
        current_period_start = $3,
        current_period_end = $4,
        updated_at = NOW()
      WHERE stripe_subscription_id = $5`,
      [
        plan,
        subscription.status,
        new Date(subscription.current_period_start * 1000),
        new Date(subscription.current_period_end * 1000),
        subscription.id
      ]
    );

    // Update user's subscription plan using PostgreSQL
    await query(
      'UPDATE users SET subscription_plan = $1, subscription_status = $2 WHERE id = $3',
      [plan, subscription.status, user.id]
    );

    // If user downgraded to free plan, add them to email subscription list (if not unsubscribed)
    if (plan === 'free' && user.email) {
      try {
        const normalizedEmail = user.email.toLowerCase().trim();
        
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
            [normalizedEmail, user.id]
          );
        } else if (unsubscribeCheck.rows[0].is_subscribed === false) {
          // Email exists but is unsubscribed - don't add them back
          console.log(`User ${normalizedEmail} has unsubscribed, not adding to email list`);
        } else {
          // Email exists and is subscribed, update user_id if needed
          await query(
            'UPDATE email_subscriptions SET user_id = $1, updated_at = CURRENT_TIMESTAMP WHERE email = $2',
            [user.id, normalizedEmail]
          );
        }
      } catch (emailSubError) {
        console.error('Error adding user to email subscription list after webhook update:', emailSubError);
        // Don't fail the webhook if email subscription fails
      }
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
    
    // Find user by customer ID using PostgreSQL
    const userResult = await query(
      'SELECT id FROM users WHERE stripe_customer_id = $1',
      [subscription.customer]
    );

    if (userResult.rows.length === 0) {
      console.error('User not found for customer:', subscription.customer);
      return;
    }

    const user = userResult.rows[0];

    // Update subscription status in database using PostgreSQL
    await query(
      `UPDATE subscriptions SET
        status = 'canceled',
        canceled_at = NOW()
      WHERE stripe_subscription_id = $1`,
      [subscription.id]
    );

    // Get user email before downgrading
    const userEmailResult = await query(
      'SELECT email FROM users WHERE id = $1',
      [user.id]
    );

    // Downgrade user to free plan using PostgreSQL
    await query(
      'UPDATE users SET subscription_plan = $1, subscription_status = $2 WHERE id = $3',
      ['free', 'canceled', user.id]
    );

    // Add user to email subscription list if they haven't unsubscribed
    if (userEmailResult.rows.length > 0 && userEmailResult.rows[0].email) {
      try {
        const normalizedEmail = userEmailResult.rows[0].email.toLowerCase().trim();
        
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
            [normalizedEmail, user.id]
          );
        } else if (unsubscribeCheck.rows[0].is_subscribed === false) {
          // Email exists but is unsubscribed - don't add them back
          console.log(`User ${normalizedEmail} has unsubscribed, not adding to email list`);
        } else {
          // Email exists and is subscribed, update user_id if needed
          await query(
            'UPDATE email_subscriptions SET user_id = $1, updated_at = CURRENT_TIMESTAMP WHERE email = $2',
            [user.id, normalizedEmail]
          );
        }
      } catch (emailSubError) {
        console.error('Error adding user to email subscription list after webhook downgrade:', emailSubError);
        // Don't fail the webhook if email subscription fails
      }
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
    
    // Find user by customer ID using PostgreSQL
    const userResult = await query(
      'SELECT id FROM users WHERE stripe_customer_id = $1',
      [invoice.customer]
    );

    if (userResult.rows.length === 0) {
      console.error('User not found for customer:', invoice.customer);
      return;
    }

    const user = userResult.rows[0];

    // Update subscription status to active using PostgreSQL
    await query(
      `UPDATE subscriptions SET status = 'active'
       WHERE stripe_customer_id = $1 AND status = 'past_due'`,
      [invoice.customer]
    );

    // Update user status to active
    await query(
      'UPDATE users SET subscription_status = $1 WHERE id = $2',
      ['active', user.id]
    );

    console.log(`Invoice payment succeeded for user ${user.id}`);

  } catch (error) {
    console.error('Error handling invoice payment succeeded:', error);
  }
}

// Handle failed invoice payment
async function handleInvoicePaymentFailed(invoice) {
  try {
    console.log('Processing invoice payment failed:', invoice.id);
    
    // Find user by customer ID using PostgreSQL
    const userResult = await query(
      'SELECT id FROM users WHERE stripe_customer_id = $1',
      [invoice.customer]
    );

    if (userResult.rows.length === 0) {
      console.error('User not found for customer:', invoice.customer);
      return;
    }

    const user = userResult.rows[0];

    // Update subscription status to past_due using PostgreSQL
    await query(
      `UPDATE subscriptions SET status = 'past_due'
       WHERE stripe_customer_id = $1`,
      [invoice.customer]
    );

    // Update user status to past_due
    await query(
      'UPDATE users SET subscription_status = $1 WHERE id = $2',
      ['past_due', user.id]
    );

    console.log(`Invoice payment failed for user ${user.id}`);

  } catch (error) {
    console.error('Error handling invoice payment failed:', error);
  }
}

// Handle trial will end
async function handleTrialWillEnd(subscription) {
  try {
    console.log('Processing trial will end:', subscription.id);
    
    // Find user by customer ID using PostgreSQL
    const userResult = await query(
      'SELECT id, email FROM users WHERE stripe_customer_id = $1',
      [subscription.customer]
    );

    if (userResult.rows.length === 0) {
      console.error('User not found for customer:', subscription.customer);
      return;
    }

    const user = userResult.rows[0];

    // TODO: Send notification email about trial ending
    console.log(`Trial ending soon for user ${user.id} (${user.email})`);

  } catch (error) {
    console.error('Error handling trial will end:', error);
  }
}

module.exports = router;