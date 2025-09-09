const express = require('express');
const { query } = require('../database/connection');
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

// Handle subscription created
async function handleSubscriptionCreated(subscription) {
  try {
    console.log('Subscription created:', subscription.id);

    // Get customer ID from subscription
    const customerId = subscription.customer;
    
    // Find user by Stripe customer ID
    const userResult = await query(
      'SELECT id FROM users WHERE stripe_customer_id = $1',
      [customerId]
    );

    if (userResult.rows.length === 0) {
      console.error('User not found for customer:', customerId);
      return;
    }

    const userId = userResult.rows[0].id;

    // Update subscription status
    await query(
      `UPDATE subscriptions 
       SET status = $1, 
           current_period_start = $2, 
           current_period_end = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE stripe_subscription_id = $4`,
      [
        subscription.status,
        new Date(subscription.current_period_start * 1000),
        new Date(subscription.current_period_end * 1000),
        subscription.id
      ]
    );

    // Update user subscription status
    await query(
      'UPDATE users SET subscription_status = $1 WHERE id = $2',
      [subscription.status, userId]
    );

    console.log('Subscription created successfully for user:', userId);
  } catch (error) {
    console.error('Error handling subscription created:', error);
  }
}

// Handle subscription updated
async function handleSubscriptionUpdated(subscription) {
  try {
    console.log('Subscription updated:', subscription.id);

    // Update subscription in database
    await query(
      `UPDATE subscriptions 
       SET status = $1, 
           current_period_start = $2, 
           current_period_end = $3,
           cancel_at_period_end = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE stripe_subscription_id = $5`,
      [
        subscription.status,
        new Date(subscription.current_period_start * 1000),
        new Date(subscription.current_period_end * 1000),
        subscription.cancel_at_period_end,
        subscription.id
      ]
    );

    // Get user ID for status update
    const userResult = await query(
      'SELECT user_id FROM subscriptions WHERE stripe_subscription_id = $1',
      [subscription.id]
    );

    if (userResult.rows.length > 0) {
      const userId = userResult.rows[0].user_id;
      
      // Update user subscription status
      await query(
        'UPDATE users SET subscription_status = $1 WHERE id = $2',
        [subscription.status, userId]
      );

      // If subscription is cancelled, downgrade to free plan
      if (subscription.status === 'canceled') {
        await query(
          'UPDATE users SET subscription_plan = $1 WHERE id = $2',
          ['free', userId]
        );
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
