# Stripe Promo Codes Guide

## Overview
This guide explains how to create and manage promo codes (coupons) for your Stripe subscriptions. Your application now supports promo codes both through the Stripe Checkout UI and programmatically.

---

## How Promo Codes Work

### Two Methods:
1. **Stripe Checkout Built-in Field**: Users can enter promo codes directly in Stripe Checkout (enabled automatically)
2. **Pre-validated Codes**: Users can enter and validate promo codes before checkout in your app

Your implementation supports **both methods simultaneously**.

---

## Creating Promo Codes in Stripe

### Method 1: Using Stripe Dashboard (Recommended for most users)

#### Step 1: Create a Coupon
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Products** → **Coupons**
3. Click **Create coupon**
4. Configure your coupon:
   - **Name**: Internal name (e.g., "First Month 50% Off")
   - **ID**: Optional custom ID (or let Stripe generate one)
   - **Discount Type**:
     - **Percentage**: e.g., 50% off
     - **Fixed Amount**: e.g., $10 off
   - **Duration**:
     - **Once**: Applied to first payment only
     - **Forever**: Applied to all payments
     - **Repeating**: Applied for X months
   - **Redemption limits**: Optional max usage count

#### Step 2: Create a Promotion Code
1. After creating a coupon, click **Create promotion code**
2. Configure the promotion code:
   - **Code**: The actual code customers will enter (e.g., "SAVE50")
   - **Customer-facing code**: Optional display name
   - **Restrictions**:
     - First-time customers only
     - Specific customer
     - Minimum amount
   - **Expiration date**: Optional
   - **Max redemptions**: Optional limit on total uses

### Method 2: Using Stripe API (For programmatic creation)

```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Create a coupon first
const coupon = await stripe.coupons.create({
  percent_off: 25,
  duration: 'repeating',
  duration_in_months: 3,
  name: '25% off for 3 months'
});

// Create a promotion code for the coupon
const promotionCode = await stripe.promotionCodes.create({
  coupon: coupon.id,
  code: 'SAVE25',
  max_redemptions: 100,
  expires_at: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days
});
```

---

## Example Promo Code Configurations

### 1. First Month Free
```javascript
{
  percent_off: 100,
  duration: 'once',
  name: 'First Month Free'
}
// Promotion Code: FIRSTFREE
```

### 2. 50% Off Forever
```javascript
{
  percent_off: 50,
  duration: 'forever',
  name: '50% Off Lifetime'
}
// Promotion Code: LIFETIME50
```

### 3. $10 Off for 6 Months
```javascript
{
  amount_off: 1000, // in cents
  currency: 'usd',
  duration: 'repeating',
  duration_in_months: 6,
  name: '$10 off for 6 months'
}
// Promotion Code: SAVE10
```

### 4. Limited Quantity (First 100 customers)
```javascript
{
  percent_off: 20,
  duration: 'once',
  name: 'Early Bird Special'
}
// Promotion Code config:
{
  code: 'EARLYBIRD',
  max_redemptions: 100
}
```

### 5. Time-Limited Promotion
```javascript
{
  percent_off: 30,
  duration: 'once',
  name: 'Holiday Sale'
}
// Promotion Code config:
{
  code: 'HOLIDAY2025',
  expires_at: 1735689600 // Unix timestamp for end date
}
```

---

## Testing Promo Codes

### Using Test Mode
1. Create test promo codes in **Stripe Test Mode**
2. Use test credit card: `4242 4242 4242 4242`
3. Test various scenarios:
   - Valid promo codes
   - Expired promo codes
   - Used-up promo codes (max redemptions reached)
   - Invalid promo codes

### Testing in Your Application

#### Test the Validation Endpoint:
```bash
curl -X POST http://localhost:3001/api/subscriptions/validate-promo-code \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{"promoCode": "SAVE50"}'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "valid": true,
    "discount": {
      "percentOff": 50,
      "amountOff": null,
      "currency": null,
      "duration": "once",
      "durationInMonths": null
    },
    "message": "50% off on first payment"
  }
}
```

---

## User Flow

### How Users Apply Promo Codes:

1. **Before Checkout** (Pre-validation):
   - User enters promo code in your app
   - Code is validated via API
   - User sees discount details immediately
   - Code is applied automatically at checkout

2. **During Checkout** (Stripe's built-in field):
   - User is redirected to Stripe Checkout
   - They can enter a promo code in Stripe's interface
   - Stripe validates and applies it instantly

---

## Viewing Promo Code Usage

### In Stripe Dashboard:
1. Go to **Products** → **Coupons**
2. Click on a coupon to see:
   - Total redemptions
   - Revenue impact
   - Active subscriptions using the coupon

### In Your Application:
You can track promo code usage via Stripe webhooks:

```javascript
// In your webhook handler (backend/src/routes/webhooks.js)
case 'checkout.session.completed':
  const session = event.data.object;
  const discounts = session.total_details?.breakdown?.discounts;
  
  if (discounts && discounts.length > 0) {
    // Log or store promo code usage
    console.log('Promo code applied:', discounts[0].discount.coupon.name);
  }
  break;
```

---

## Best Practices

### 1. Code Naming
- Make codes memorable and easy to type
- Use uppercase letters only
- Avoid confusing characters (0 vs O, 1 vs l)
- Examples: `SAVE20`, `WELCOME`, `SUMMER2025`

### 2. Set Appropriate Limits
- **Max redemptions**: Prevent abuse
- **Expiration dates**: Create urgency
- **First-time customers only**: Encourage new signups

### 3. Marketing Strategy
- **Seasonal**: `SPRING25`, `BLACKFRIDAY`
- **Referral**: `FRIEND20`
- **Launch**: `LAUNCH50`, `EARLYBIRD`
- **Newsletter**: `SUBSCRIBER15`

### 4. Track Performance
- Monitor redemption rates
- Calculate revenue impact
- A/B test different discount percentages

---

## Troubleshooting

### Common Issues:

#### "Invalid promo code"
- Verify the code exists in Stripe
- Check if it's set to `active: true`
- Ensure it hasn't expired
- Verify it's in the correct mode (test/live)

#### "Promo code has reached its usage limit"
- Check max_redemptions in Stripe Dashboard
- Increase limit or create a new code

#### Code not appearing in checkout
- Ensure `allow_promotion_codes: true` is set in checkout session
- Verify Stripe API keys are correct

#### Validation endpoint returns 401
- Check Authorization header is included
- Verify JWT token is valid

---

## Security Considerations

1. **Always validate server-side**: Don't trust client-side validation alone
2. **Rate limiting**: Prevent brute-force attempts to guess codes
3. **Monitor usage**: Watch for suspicious patterns
4. **Unique codes**: Consider generating unique single-use codes for VIP customers

---

## Advanced: Creating Unique Per-Customer Codes

```javascript
// Generate unique codes for each customer
const createUniquePromoCode = async (customerId, discountPercent) => {
  // Create a unique code
  const uniqueCode = `VIP${customerId.slice(-8).toUpperCase()}`;
  
  // Create coupon
  const coupon = await stripe.coupons.create({
    percent_off: discountPercent,
    duration: 'once',
    name: `VIP Customer ${customerId}`
  });
  
  // Create promotion code
  const promoCode = await stripe.promotionCodes.create({
    coupon: coupon.id,
    code: uniqueCode,
    max_redemptions: 1, // Single use
    customer: customerId, // Restricted to specific customer
    expires_at: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
  });
  
  return uniqueCode;
};
```

---

## API Reference

### Validate Promo Code
```
POST /api/subscriptions/validate-promo-code
Authorization: Bearer {token}

Request:
{
  "promoCode": "SAVE50"
}

Response:
{
  "success": true,
  "data": {
    "valid": true,
    "discount": {
      "percentOff": 50,
      "amountOff": null,
      "currency": null,
      "duration": "once",
      "durationInMonths": null
    },
    "message": "50% off on first payment"
  }
}
```

### Create Checkout Session with Promo Code
```
POST /api/subscriptions/create-checkout-session
Authorization: Bearer {token}

Request:
{
  "planType": "premium",
  "billingCycle": "monthly",
  "successUrl": "https://yoursite.com/success",
  "cancelUrl": "https://yoursite.com/cancel",
  "promoCode": "SAVE50"  // Optional
}
```

---

## Quick Start Checklist

- [ ] Create a coupon in Stripe Dashboard
- [ ] Create a promotion code for the coupon
- [ ] Test the promo code in test mode
- [ ] Verify validation works in your app
- [ ] Test checkout with the promo code
- [ ] Monitor usage in Stripe Dashboard
- [ ] Set up webhook to track conversions
- [ ] Promote your promo code to users!

---

## Support

For more information:
- [Stripe Coupons Documentation](https://stripe.com/docs/billing/subscriptions/coupons)
- [Stripe Promotion Codes Documentation](https://stripe.com/docs/billing/subscriptions/discounts/codes)
- [Stripe API Reference](https://stripe.com/docs/api/coupons)


