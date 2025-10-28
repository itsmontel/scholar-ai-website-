/**
 * Test script for creating and testing Stripe promo codes
 * Run this with: node test-promo-code.js
 */

require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function createTestPromoCode() {
  try {
    console.log('🎫 Creating test promo code...\n');

    // Step 1: Create a coupon
    console.log('Step 1: Creating coupon...');
    const coupon = await stripe.coupons.create({
      percent_off: 20,
      duration: 'once',
      name: 'Test 20% Off First Payment',
      currency: 'usd'
    });
    console.log(`✅ Coupon created: ${coupon.id}`);
    console.log(`   - ${coupon.percent_off}% off`);
    console.log(`   - Duration: ${coupon.duration}\n`);

    // Step 2: Create a promotion code
    console.log('Step 2: Creating promotion code...');
    const promotionCode = await stripe.promotionCodes.create({
      coupon: coupon.id,
      code: 'TEST20OFF',
      max_redemptions: 10, // Limit to 10 uses
      expires_at: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days from now
    });
    console.log(`✅ Promotion code created: ${promotionCode.code}`);
    console.log(`   - Code: ${promotionCode.code}`);
    console.log(`   - Max redemptions: ${promotionCode.max_redemptions}`);
    console.log(`   - Active: ${promotionCode.active}\n`);

    // Step 3: Test validation
    console.log('Step 3: Testing validation...');
    const promoCodes = await stripe.promotionCodes.list({
      code: 'TEST20OFF',
      active: true,
      limit: 1
    });

    if (promoCodes.data.length > 0) {
      console.log('✅ Promo code is valid and can be used!');
      console.log(`   - Times redeemed: ${promoCodes.data[0].times_redeemed}`);
      console.log(`   - Expires: ${new Date(promotionCode.expires_at * 1000).toLocaleDateString()}\n`);
    }

    console.log('🎉 Success! You can now use the promo code "TEST20OFF" in your checkout.');
    console.log('\n📝 To test in your app:');
    console.log('   1. Go to the pricing page');
    console.log('   2. Select a plan');
    console.log('   3. Enter "TEST20OFF" in the promo code field');
    console.log('   4. Click "Apply" to validate');
    console.log('   5. Proceed to checkout\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.type === 'StripeInvalidRequestError') {
      console.log('\n💡 Tip: The promo code might already exist. Try a different code or delete the existing one in Stripe Dashboard.');
    }
  }
}

// List existing promo codes
async function listPromoCodes() {
  try {
    console.log('📋 Listing existing promo codes...\n');
    
    const promoCodes = await stripe.promotionCodes.list({
      limit: 10,
      active: true
    });

    if (promoCodes.data.length === 0) {
      console.log('No active promo codes found.');
      return;
    }

    console.log(`Found ${promoCodes.data.length} active promo codes:\n`);
    
    for (const code of promoCodes.data) {
      const coupon = code.coupon;
      let discountText = '';
      
      if (coupon.percent_off) {
        discountText = `${coupon.percent_off}% off`;
      } else if (coupon.amount_off) {
        discountText = `$${(coupon.amount_off / 100).toFixed(2)} off`;
      }

      console.log(`🎫 ${code.code}`);
      console.log(`   - Discount: ${discountText}`);
      console.log(`   - Duration: ${coupon.duration}`);
      console.log(`   - Used: ${code.times_redeemed}${code.max_redemptions ? `/${code.max_redemptions}` : ''}`);
      console.log(`   - Active: ${code.active}`);
      
      if (code.expires_at) {
        console.log(`   - Expires: ${new Date(code.expires_at * 1000).toLocaleDateString()}`);
      }
      console.log('');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Delete a promo code
async function deletePromoCode(code) {
  try {
    console.log(`🗑️  Looking for promo code: ${code}...\n`);
    
    const promoCodes = await stripe.promotionCodes.list({
      code: code,
      limit: 1
    });

    if (promoCodes.data.length === 0) {
      console.log(`❌ Promo code "${code}" not found.`);
      return;
    }

    const promoCode = promoCodes.data[0];
    
    // Deactivate instead of delete (Stripe doesn't allow deletion)
    await stripe.promotionCodes.update(promoCode.id, {
      active: false
    });

    console.log(`✅ Promo code "${code}" has been deactivated.`);
    console.log('   (Note: Stripe doesn\'t allow deletion, so it\'s been set to inactive)\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Main execution
const command = process.argv[2];
const arg = process.argv[3];

console.log('╔══════════════════════════════════════╗');
console.log('║   Stripe Promo Code Test Script     ║');
console.log('╚══════════════════════════════════════╝\n');

switch (command) {
  case 'create':
    createTestPromoCode();
    break;
  
  case 'list':
    listPromoCodes();
    break;
  
  case 'delete':
    if (!arg) {
      console.log('❌ Please specify a promo code to delete.');
      console.log('Usage: node test-promo-code.js delete TEST20OFF\n');
    } else {
      deletePromoCode(arg);
    }
    break;
  
  default:
    console.log('Usage:');
    console.log('  node test-promo-code.js create          - Create a test promo code');
    console.log('  node test-promo-code.js list            - List all active promo codes');
    console.log('  node test-promo-code.js delete CODE     - Deactivate a promo code\n');
    console.log('Example:');
    console.log('  node test-promo-code.js create');
    console.log('  node test-promo-code.js list');
    console.log('  node test-promo-code.js delete TEST20OFF\n');
}


