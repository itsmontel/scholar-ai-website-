const { createClient } = require('@supabase/supabase-js');

let supabase;

const connectDB = async () => {
  try {
    console.log('🔗 Connecting to Supabase...');
    console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
    console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
    
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    // Test the connection
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      throw error;
    }
    
    console.log('✅ Supabase connected successfully');
    return supabase;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
    throw error;
  }
};

const getSupabase = () => {
  if (!supabase) {
    throw new Error('Supabase not initialized. Call connectDB() first.');
  }
  return supabase;
};

const databaseService = require('../services/databaseService');

const query = async (text, params) => {
  if (!supabase) {
    throw new Error('Supabase not initialized. Call connectDB() first.');
  }

  return await databaseService.query(text, params);
};

const getClient = async () => {
  return supabase;
};

const closePool = async () => {
  // Supabase client doesn't need explicit closing
  console.log('Supabase connection closed');
};

module.exports = {
  connectDB,
  getSupabase,
  query,
  getClient,
  closePool
};
