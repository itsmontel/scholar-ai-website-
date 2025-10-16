#!/usr/bin/env node

/**
 * Supabase Setup Script for WriteScholar
 * 
 * This script helps you set up your Supabase database with the required tables
 * and initial data for the WriteScholar application.
 */

const { Pool } = require('pg');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const setupSupabase = async () => {
  log('\n🚀 Setting up Supabase for WriteScholar...\n', 'cyan');
  
  // Check if .env file exists
  if (!fs.existsSync('.env')) {
    log('❌ .env file not found!', 'red');
    log('Please copy env.example to .env and configure your Supabase credentials.', 'yellow');
    process.exit(1);
  }

  // Check required environment variables
  const requiredVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    log('❌ Missing required environment variables:', 'red');
    missingVars.forEach(varName => log(`   - ${varName}`, 'red'));
    log('\nPlease configure your .env file with Supabase credentials.', 'yellow');
    process.exit(1);
  }

  // Create database connection
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 10000
  });

  try {
    // Test connection
    log('🔌 Testing database connection...', 'blue');
    const client = await pool.connect();
    log('✅ Connected to Supabase successfully!', 'green');
    client.release();

    // Read and execute schema
    log('\n📋 Creating database tables...', 'blue');
    const schemaPath = path.join(__dirname, 'src', 'database', 'schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      log('❌ Schema file not found!', 'red');
      process.exit(1);
    }

    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      try {
        await pool.query(statement);
        log(`✅ Executed: ${statement.substring(0, 50)}...`, 'green');
      } catch (error) {
        if (error.message.includes('already exists')) {
          log(`⚠️  Table already exists: ${statement.substring(0, 50)}...`, 'yellow');
        } else {
          log(`❌ Error executing statement: ${error.message}`, 'red');
          throw error;
        }
      }
    }

    // Seed initial data
    log('\n🌱 Seeding initial data...', 'blue');
    const seedPath = path.join(__dirname, 'src', 'database', 'seed.js');
    
    if (fs.existsSync(seedPath)) {
      try {
        const { seedDatabase } = require('./src/database/seed.js');
        await seedDatabase();
        log('✅ Database seeded successfully!', 'green');
      } catch (error) {
        log(`⚠️  Seeding failed: ${error.message}`, 'yellow');
        log('You can run seeding manually later.', 'yellow');
      }
    }

    log('\n🎉 Supabase setup completed successfully!', 'green');
    log('\n📝 Next steps:', 'cyan');
    log('1. Test your backend: npm run dev', 'blue');
    log('2. Check your Supabase dashboard for the new tables', 'blue');
    log('3. Configure your frontend to connect to the backend', 'blue');
    
  } catch (error) {
    log(`\n❌ Setup failed: ${error.message}`, 'red');
    log('\n🔧 Troubleshooting tips:', 'yellow');
    log('1. Check your Supabase credentials in .env', 'blue');
    log('2. Ensure your Supabase project is active', 'blue');
    log('3. Check your internet connection', 'blue');
    log('4. Verify your database password is correct', 'blue');
    process.exit(1);
  } finally {
    await pool.end();
  }
};

// Run setup if called directly
if (require.main === module) {
  setupSupabase().catch(console.error);
}

module.exports = { setupSupabase };
