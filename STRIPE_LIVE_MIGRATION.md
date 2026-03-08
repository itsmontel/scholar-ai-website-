# Stripe Live Keys Migration Guide

## 🔄 Step-by-Step Migration from Test to Live

### **1. Stripe Dashboard Setup**

#### **Switch to Live Mode**
1. Log into Stripe Dashboard
2. Toggle from "Test Data" to "Live Data" (top left)

#### **Get Live API Keys**
1. Go to **Developers → API Keys**
2. Copy these keys:
   - **Publishable Key**: `pk_live_...`
   - **Secret Key**: `sk_live_...`

#### **Create Live Products**
1. Go to **Products** (in Live mode)
2. Create **Pro Plan**:
   - Name: "WriteScholar Pro"
   - Monthly: $19.99 USD
   - Yearly: $199.99 USD (save price IDs)
3. Create **Premium Plan**:
   - Name: "WriteScholar Premium" 
   - Monthly: $39.99 USD
   - Yearly: $399.99 USD (save price IDs)

### **2. Railway Environment Variables**

Update these variables in Railway:

```bash
# Replace test keys with live keys
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_PUBLISHABLE_KEY

# Update with your live price IDs
STRIPE_STARTER_MONTHLY_PRICE_ID=price_YOUR_LIVE_STARTER_MONTHLY_ID
STRIPE_STARTER_YEARLY_PRICE_ID=price_YOUR_LIVE_STARTER_YEARLY_ID
STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_YOUR_LIVE_PREMIUM_MONTHLY_ID
STRIPE_PREMIUM_YEARLY_PRICE_ID=price_YOUR_LIVE_PREMIUM_YEARLY_ID

# Create new live webhook secret
STRIPE_WEBHOOK_SECRET=whsec_YOUR_LIVE_WEBHOOK_SECRET
```

### **3. Frontend Environment Variables**

Update in Netlify:

```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_PUBLISHABLE_KEY
```

### **4. Configure Live Webhooks**

1. Go to **Developers → Webhooks** (in Live mode)
2. **Add endpoint**: `https://lucky-luck-production-4e5c.up.railway.app/api/webhooks/stripe`
3. **Select events**:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. **Copy the webhook secret** (`whsec_...`)

### **5. Test with Small Amount**

1. Create a test subscription with a real card
2. Use a small amount first ($0.50 test charge)
3. Verify webhook events are received
4. Check database updates are working

### **6. Billing Portal Configuration**

1. Go to **Settings → Billing Portal** (in Live mode)
2. **Configure**:
   - Allow customers to update payment methods
   - Allow customers to view invoices
   - Allow customers to cancel subscriptions
   - Set return URL: `https://writescholar.com/billing`

## ⚠️ **Important Notes**

- **Test thoroughly** before going fully live
- **Keep test keys** as backup for development
- **Monitor webhook events** in Stripe Dashboard
- **Check all subscription flows** work correctly
- **Verify email notifications** are sent properly

## 🔍 **Verification Checklist**

- [ ] Live keys updated in Railway
- [ ] Live publishable key updated in Netlify
- [ ] Live products created in Stripe
- [ ] Live webhooks configured and working
- [ ] Test subscription flow works
- [ ] Billing portal accessible
- [ ] Email notifications working
- [ ] Database updates correctly
