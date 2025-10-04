// Test database connectivity for webhooks
// Run: node test-webhook-db.js

require('dotenv').config();
const { connectDB, query } = require('./src/database/connection');

async function testWebhookDB() {
  try {
    console.log('🧪 Testing database for webhook compatibility...');
    
    // Initialize database connection first
    await connectDB();
    console.log('✅ Database connected\n');
    
    // Test 1: Check if users table has required columns
    console.log('\n1️⃣ Testing users table structure...');
    const userTest = await query('SELECT id, email, stripe_customer_id, subscription_plan, subscription_status FROM users LIMIT 1');
    console.log('✅ Users table has required columns');
    
    // Test 2: Check if subscriptions table has required columns  
    console.log('\n2️⃣ Testing subscriptions table structure...');
    const subTest = await query('SELECT id, user_id, stripe_subscription_id, stripe_customer_id, plan, status, current_period_start, current_period_end, canceled_at FROM subscriptions LIMIT 1');
    console.log('✅ Subscriptions table has required columns');
    
    // Test 3: Verify stripe_customer_id column exists (we already confirmed this above)
    console.log('\n3️⃣ Testing stripe_customer_id column exists...');
    console.log('✅ stripe_customer_id column confirmed in both users and subscriptions tables');
    
    console.log('\n🎉 All critical database tests passed! Your database structure is ready for webhooks.');
    console.log('\n📋 Summary:');
    console.log('   ✅ Users table has: stripe_customer_id, subscription_plan, subscription_status');
    console.log('   ✅ Subscriptions table has: stripe_customer_id, plan, canceled_at');
    console.log('   ✅ All required webhook columns are present');
    console.log('\n🔧 Next steps:');
    console.log('   1. Verify STRIPE_WEBHOOK_SECRET is set in your .env');
    console.log('   2. Test webhook endpoint: curl https://your-backend/api/webhooks/test');
    console.log('   3. Configure webhook in Stripe Dashboard');
    console.log('   4. Test with a real payment');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.error('Fix the error above before webhooks will work.');
  }
}

testWebhookDB();
