const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class StripeService {
  constructor() {
    this.stripe = stripe;
  }

  // Create a new customer
  async createCustomer(userData) {
    try {
      const customer = await this.stripe.customers.create({
        email: userData.email,
        name: `${userData.firstName} ${userData.lastName}`,
        metadata: {
          userId: userData.id,
          institution: userData.institution || '',
          researchField: userData.researchField || ''
        }
      });

      return {
        success: true,
        customerId: customer.id,
        customer
      };
    } catch (error) {
      console.error('Stripe customer creation error:', error);
      throw new Error(`Failed to create customer: ${error.message}`);
    }
  }

  // Create a Stripe Checkout session
  async createCheckoutSession(customerId, planType, billingCycle, userId) {
    try {
      const priceId = this.getPriceId(planType, billingCycle);
      
      const session = await this.stripe.checkout.sessions.create({
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
          billingCycle
        },
        subscription_data: {
          metadata: {
            userId,
            planType,
            billingCycle
          }
        }
      });

      return {
        success: true,
        sessionId: session.id,
        url: session.url
      };
    } catch (error) {
      console.error('Stripe checkout session creation error:', error);
      throw new Error(`Failed to create checkout session: ${error.message}`);
    }
  }

  // Get a subscription
  async getSubscription(subscriptionId) {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      return subscription;
    } catch (error) {
      console.error('Stripe get subscription error:', error);
      throw new Error(`Failed to get subscription: ${error.message}`);
    }
  }

  // Create a subscription
  async createSubscription(customerId, planType, billingCycle) {
    try {
      const priceId = this.getPriceId(planType, billingCycle);
      
      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          planType,
          billingCycle
        }
      });

      return {
        success: true,
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice.payment_intent.client_secret,
        subscription
      };
    } catch (error) {
      console.error('Stripe subscription creation error:', error);
      throw new Error(`Failed to create subscription: ${error.message}`);
    }
  }

  // Update subscription
  async updateSubscription(subscriptionId, newPlanType, newBillingCycle) {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      const newPriceId = this.getPriceId(newPlanType, newBillingCycle);

      const updatedSubscription = await this.stripe.subscriptions.update(subscriptionId, {
        items: [{
          id: subscription.items.data[0].id,
          price: newPriceId,
        }],
        proration_behavior: 'create_prorations',
        metadata: {
          planType: newPlanType,
          billingCycle: newBillingCycle
        }
      });

      return {
        success: true,
        subscription: updatedSubscription
      };
    } catch (error) {
      console.error('Stripe subscription update error:', error);
      throw new Error(`Failed to update subscription: ${error.message}`);
    }
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId, cancelAtPeriodEnd = true) {
    try {
      const subscription = await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: cancelAtPeriodEnd
      });

      return {
        success: true,
        subscription,
        message: cancelAtPeriodEnd 
          ? 'Subscription will be cancelled at the end of the current period'
          : 'Subscription cancelled immediately'
      };
    } catch (error) {
      console.error('Stripe subscription cancellation error:', error);
      throw new Error(`Failed to cancel subscription: ${error.message}`);
    }
  }

  // Get subscription details
  async getSubscription(subscriptionId) {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['latest_invoice', 'customer']
      });

      return {
        success: true,
        subscription
      };
    } catch (error) {
      console.error('Stripe subscription retrieval error:', error);
      throw new Error(`Failed to get subscription: ${error.message}`);
    }
  }

  // Get customer's payment methods
  async getPaymentMethods(customerId) {
    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });

      return {
        success: true,
        paymentMethods: paymentMethods.data
      };
    } catch (error) {
      console.error('Stripe payment methods retrieval error:', error);
      throw new Error(`Failed to get payment methods: ${error.message}`);
    }
  }

  // Create setup intent for saving payment method
  async createSetupIntent(customerId) {
    try {
      const setupIntent = await this.stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
        usage: 'off_session'
      });

      return {
        success: true,
        clientSecret: setupIntent.client_secret,
        setupIntent
      };
    } catch (error) {
      console.error('Stripe setup intent creation error:', error);
      throw new Error(`Failed to create setup intent: ${error.message}`);
    }
  }

  // Create billing portal session
  async createBillingPortalSession(customerId, returnUrl) {
    try {
      const session = await this.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });

      return {
        success: true,
        url: session.url
      };
    } catch (error) {
      console.error('Stripe billing portal session creation error:', error);
      throw new Error(`Failed to create billing portal session: ${error.message}`);
    }
  }

  // Get price ID based on plan and billing cycle
  getPriceId(planType, billingCycle) {
    const key = planType === 'premium' || planType === 'starter' ? 'pro' : planType;
    const prices = {
      pro: {
        monthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || 'price_starter_monthly',
        yearly: process.env.STRIPE_STARTER_YEARLY_PRICE_ID || 'price_starter_yearly'
      }
    };

    const priceId = prices[key]?.[billingCycle];
    if (!priceId) {
      throw new Error(`Invalid plan type or billing cycle: ${planType}/${billingCycle}`);
    }

    return priceId;
  }

  // Verify webhook signature
  verifyWebhookSignature(payload, signature) {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      return { success: true, event };
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Handle successful payment
  async handleSuccessfulPayment(paymentIntent) {
    try {
      // This would typically update your database
      // Implementation depends on your business logic
      console.log('Payment successful:', paymentIntent.id);
      return { success: true };
    } catch (error) {
      console.error('Handle successful payment error:', error);
      throw new Error(`Failed to handle successful payment: ${error.message}`);
    }
  }

  // Handle failed payment
  async handleFailedPayment(paymentIntent) {
    try {
      // This would typically update your database and notify the user
      console.log('Payment failed:', paymentIntent.id);
      return { success: true };
    } catch (error) {
      console.error('Handle failed payment error:', error);
      throw new Error(`Failed to handle failed payment: ${error.message}`);
    }
  }

  // Get usage-based billing information
  async getUsageRecords(subscriptionItemId, startTime, endTime) {
    try {
      const usageRecords = await this.stripe.subscriptionItems.listUsageRecordSummaries(
        subscriptionItemId,
        {
          start: startTime,
          end: endTime
        }
      );

      return {
        success: true,
        usageRecords: usageRecords.data
      };
    } catch (error) {
      console.error('Stripe usage records retrieval error:', error);
      throw new Error(`Failed to get usage records: ${error.message}`);
    }
  }

  // Create invoice
  async createInvoice(customerId, items, description) {
    try {
      const invoice = await this.stripe.invoices.create({
        customer: customerId,
        description: description,
        auto_advance: true
      });

      // Add line items
      for (const item of items) {
        await this.stripe.invoiceItems.create({
          customer: customerId,
          invoice: invoice.id,
          amount: item.amount,
          currency: 'usd',
          description: item.description
        });
      }

      // Finalize and send invoice
      const finalizedInvoice = await this.stripe.invoices.finalizeInvoice(invoice.id);
      await this.stripe.invoices.sendInvoice(finalizedInvoice.id);

      return {
        success: true,
        invoice: finalizedInvoice
      };
    } catch (error) {
      console.error('Stripe invoice creation error:', error);
      throw new Error(`Failed to create invoice: ${error.message}`);
    }
  }
}

module.exports = new StripeService();
