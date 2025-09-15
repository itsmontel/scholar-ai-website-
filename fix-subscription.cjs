const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixUserSubscription() {
  try {
    console.log('🔍 Checking user: tabsmosaic@gmail.com');
    
    // Get user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'tabsmosaic@gmail.com')
      .single();
    
    if (userError) {
      console.error('❌ Error finding user:', userError);
      return;
    }
    
    console.log('👤 Current user data:');
    console.log('  - ID:', user.id);
    console.log('  - Email:', user.email);
    console.log('  - Subscription Plan:', user.subscription_plan);
    console.log('  - Subscription Status:', user.subscription_status);
    console.log('  - Stripe Customer ID:', user.stripe_customer_id);
    
    // Check if user has any subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id);
    
    if (subError) {
      console.error('❌ Error checking subscriptions:', subError);
    } else {
      console.log('📋 User subscriptions:', subscriptions);
    }
    
    // Update user to starter plan
    console.log('🔄 Updating user to starter plan...');
    const { error: updateError } = await supabase
      .from('users')
      .update({
        subscription_plan: 'starter',
        subscription_status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);
    
    if (updateError) {
      console.error('❌ Error updating user:', updateError);
    } else {
      console.log('✅ User updated to starter plan successfully!');
    }
    
    // Create a subscription record if none exists
    if (!subscriptions || subscriptions.length === 0) {
      console.log('📝 Creating subscription record...');
      const { error: createSubError } = await supabase
        .from('subscriptions')
        .insert({
          id: require('uuid').v4(),
          user_id: user.id,
          stripe_subscription_id: 'manual_starter_' + Date.now(),
          plan_type: 'starter',
          billing_cycle: 'monthly',
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (createSubError) {
        console.error('❌ Error creating subscription:', createSubError);
      } else {
        console.log('✅ Subscription record created successfully!');
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixUserSubscription();
