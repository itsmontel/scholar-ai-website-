const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const stripeService = require('../services/stripeService');

const router = express.Router();

// Stripe webhook endpoint
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    const payload = req.body;

    // Verify webhook signature
    const verification = stripeService.verifyWebhookSignature(payload, signature);
    if (!verification.success) {
      console.error('Webhook signature verification failed:', verification.error);
      return res.status(400).send('Webhook signature verification failed');
    }

    const event = verification.event;

    // Handle the event
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
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).send('Webhook error');
  }
});

// Handle checkout session completed
async function handleCheckoutSessionCompleted(session) {
  try {
    console.log('Checkout session completed:', session.id);
    
    const { userId, planType, billingCycle } = session.metadata;
    
    if (!userId) {
      console.error('No userId in checkout session metadata');
      return;
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Get the subscription from the session
    const subscription = await stripeService.getSubscription(session.subscription);
    
    if (!subscription) {
      console.error('No subscription found for session:', session.id);
      return;
    }

    // Save subscription to database
    const { error: subError } = await supabase
      .from('subscriptions')
      .upsert({
        id: require('uuid').v4(),
        user_id: userId,
        stripe_subscription_id: subscription.id,
        plan_type: planType,
        billing_cycle: billingCycle,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'stripe_subscription_id'
      });

    if (subError) {
      console.error('Error saving subscription:', subError);
      return;
    }

    // Update user subscription plan and status
    const { error: userError } = await supabase
      .from('users')
      .update({
        subscription_plan: planType,
        subscription_status: subscription.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (userError) {
      console.error('Error updating user subscription:', userError);
      return;
    }

    console.log('Checkout session completed successfully for user:', userId);
  } catch (error) {
    console.error('Error handling checkout session completed:', error);
  }
}

// Handle subscription created
async function handleSubscriptionCreated(subscription) {
  try {
    console.log('Subscription created:', subscription.id);

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Get customer ID from subscription
    const customerId = subscription.customer;
    
    // Find user by Stripe customer ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single();

    if (userError || !user) {
      console.error('User not found for customer:', customerId);
      return;
    }

    const userId = user.id;

    // Update subscription status
    const { error: subError } = await supabase
      .from('subscriptions')
      .update({
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id);

    if (subError) {
      console.error('Error updating subscription:', subError);
    }

    // Update user subscription status
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({
        subscription_status: subscription.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (userUpdateError) {
      console.error('Error updating user subscription status:', userUpdateError);
    }

    console.log('Subscription created successfully for user:', userId);
  } catch (error) {
    console.error('Error handling subscription created:', error);
  }
}

// Handle subscription updated
async function handleSubscriptionUpdated(subscription) {
  try {
    console.log('Subscription updated:', subscription.id);

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Update subscription in database
    const { error: subError } = await supabase
      .from('subscriptions')
      .update({
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id);

    if (subError) {
      console.error('Error updating subscription:', subError);
    }

    // Get user ID for status update
    const { data: subData, error: subDataError } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    if (subDataError || !subData) {
      console.error('Error finding subscription:', subDataError);
      return;
    }

    const userId = subData.user_id;
    
    // Update user subscription status
    const { error: userError } = await supabase
      .from('users')
      .update({
        subscription_status: subscription.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (userError) {
      console.error('Error updating user subscription status:', userError);
    }

    // If subscription is cancelled, downgrade to free plan
    if (subscription.status === 'canceled') {
      const { error: downgradeError } = await supabase
        .from('users')
        .update({
          subscription_plan: 'free',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (downgradeError) {
        console.error('Error downgrading user to free plan:', downgradeError);
      }
    }

    console.log('Subscription updated successfully');
  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

// Handle subscription deleted
async function handleSubscriptionDeleted(subscription) {
  try {
    console.log('Subscription deleted:', subscription.id);

    // Get user ID
    const userResult = await query(
      'SELECT user_id FROM subscriptions WHERE stripe_subscription_id = $1',
      [subscription.id]
    );

    if (userResult.rows.length > 0) {
      const userId = userResult.rows[0].user_id;

      // Update subscription status
      await query(
        'UPDATE subscriptions SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE stripe_subscription_id = $2',
        ['canceled', subscription.id]
      );

      // Downgrade user to free plan
      await query(
        'UPDATE users SET subscription_plan = $1, subscription_status = $2 WHERE id = $3',
        ['free', 'canceled', userId]
      );

      console.log('User downgraded to free plan:', userId);
    }
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
  }
}

// Handle payment succeeded
async function handlePaymentSucceeded(invoice) {
  try {
    console.log('Payment succeeded:', invoice.id);

    if (invoice.subscription) {
      // Get user ID from subscription
      const userResult = await query(
        'SELECT user_id FROM subscriptions WHERE stripe_subscription_id = $1',
        [invoice.subscription]
      );

      if (userResult.rows.length > 0) {
        const userId = userResult.rows[0].user_id;

        // Update subscription status to active
        await query(
          'UPDATE subscriptions SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE stripe_subscription_id = $2',
          ['active', invoice.subscription]
        );

        await query(
          'UPDATE users SET subscription_status = $1 WHERE id = $2',
          ['active', userId]
        );

        // Create notification for successful payment
        await query(
          `INSERT INTO notifications (user_id, type, title, message, metadata)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            userId,
            'payment_success',
            'Payment Successful',
            'Your subscription payment has been processed successfully.',
            JSON.stringify({ invoiceId: invoice.id, amount: invoice.amount_paid })
          ]
        );

        console.log('Payment processed successfully for user:', userId);
      }
    }
  } catch (error) {
    console.error('Error handling payment succeeded:', error);
  }
}

// Handle payment failed
async function handlePaymentFailed(invoice) {
  try {
    console.log('Payment failed:', invoice.id);

    if (invoice.subscription) {
      // Get user ID from subscription
      const userResult = await query(
        'SELECT user_id FROM subscriptions WHERE stripe_subscription_id = $1',
        [invoice.subscription]
      );

      if (userResult.rows.length > 0) {
        const userId = userResult.rows[0].user_id;

        // Update subscription status
        await query(
          'UPDATE subscriptions SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE stripe_subscription_id = $2',
          ['past_due', invoice.subscription]
        );

        await query(
          'UPDATE users SET subscription_status = $1 WHERE id = $2',
          ['past_due', userId]
        );

        // Create notification for failed payment
        await query(
          `INSERT INTO notifications (user_id, type, title, message, metadata)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            userId,
            'payment_failed',
            'Payment Failed',
            'Your subscription payment failed. Please update your payment method to continue using the service.',
            JSON.stringify({ invoiceId: invoice.id, amount: invoice.amount_due })
          ]
        );

        console.log('Payment failed notification created for user:', userId);
      }
    }
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}

// Handle trial will end
async function handleTrialWillEnd(subscription) {
  try {
    console.log('Trial will end:', subscription.id);

    // Get user ID from subscription
    const userResult = await query(
      'SELECT user_id FROM subscriptions WHERE stripe_subscription_id = $1',
      [subscription.id]
    );

    if (userResult.rows.length > 0) {
      const userId = userResult.rows[0].user_id;

      // Create notification about trial ending
      await query(
        `INSERT INTO notifications (user_id, type, title, message, metadata)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          userId,
          'trial_ending',
          'Trial Ending Soon',
          'Your free trial will end soon. Please add a payment method to continue using the service.',
          JSON.stringify({ subscriptionId: subscription.id, trialEnd: subscription.trial_end })
        ]
      );

      console.log('Trial ending notification created for user:', userId);
    }
  } catch (error) {
    console.error('Error handling trial will end:', error);
  }
}

module.exports = router;
