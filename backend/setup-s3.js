#!/usr/bin/env node

/**
 * S3 Setup Helper Script
 * 
 * This script helps you set up AWS S3 configuration for Scholar AI.
 * It will guide you through the process and create the necessary .env entries.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupS3() {
  console.log('🚀 Scholar AI S3 Setup Helper\n');
  console.log('This script will help you configure AWS S3 for your Scholar AI application.\n');

  // Check if .env file exists
  const envPath = path.join(__dirname, '.env');
  const envExamplePath = path.join(__dirname, 'env.example');
  
  if (!fs.existsSync(envPath)) {
    console.log('📄 Creating .env file from env.example...');
    if (fs.existsSync(envExamplePath)) {
      fs.copyFileSync(envExamplePath, envPath);
      console.log('✅ .env file created!\n');
    } else {
      console.log('⚠️  env.example not found. Creating basic .env file...');
      fs.writeFileSync(envPath, '# Scholar AI Environment Variables\n\n');
    }
  }

  console.log('📋 Please provide your AWS S3 configuration:\n');

  // Get AWS credentials
  const accessKeyId = await question('AWS Access Key ID: ');
  const secretAccessKey = await question('AWS Secret Access Key: ');
  const region = await question('AWS Region (default: us-east-1): ') || 'us-east-1';
  const bucketName = await question('S3 Bucket Name: ');

  // Validate inputs
  if (!accessKeyId || !secretAccessKey || !bucketName) {
    console.log('\n❌ Error: All fields are required. Please run the script again.');
    rl.close();
    return;
  }

  // Read current .env file
  let envContent = fs.readFileSync(envPath, 'utf8');

  // Update or add S3 configuration
  const s3Config = `
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=${accessKeyId}
AWS_SECRET_ACCESS_KEY=${secretAccessKey}
AWS_REGION=${region}
AWS_S3_BUCKET=${bucketName}
`;

  // Remove existing S3 config if present
  envContent = envContent.replace(/# AWS S3 Configuration[\s\S]*?(?=\n#|\n$|$)/, '');
  
  // Add new S3 config
  envContent += s3Config;

  // Write updated .env file
  fs.writeFileSync(envPath, envContent);

  console.log('\n✅ S3 configuration saved to .env file!');
  console.log('\n📋 Next steps:');
  console.log('1. Create your S3 bucket in AWS Console');
  console.log('2. Set up IAM user with S3 permissions');
  console.log('3. Test your configuration: node test-s3.js');
  console.log('4. Set NODE_ENV=production to use real S3');

  // Ask if they want to test the configuration
  const testNow = await question('\n🧪 Would you like to test the S3 configuration now? (y/n): ');
  
  if (testNow.toLowerCase() === 'y' || testNow.toLowerCase() === 'yes') {
    console.log('\n🧪 Testing S3 configuration...');
    try {
      const testS3 = require('./test-s3');
      await testS3();
    } catch (error) {
      console.error('❌ Test failed:', error.message);
      console.log('\n💡 Make sure you have:');
      console.log('   - Created the S3 bucket');
      console.log('   - Set up IAM user with correct permissions');
      console.log('   - Verified your AWS credentials');
    }
  }

  console.log('\n🎉 Setup complete! Check AWS_S3_SETUP.md for detailed instructions.');
  rl.close();
}

// Handle Ctrl+C
rl.on('SIGINT', () => {
  console.log('\n\n👋 Setup cancelled. You can run this script again anytime.');
  rl.close();
});

// Run setup
setupS3().catch(console.error);
