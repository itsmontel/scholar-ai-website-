#!/usr/bin/env node

/**
 * Email Setup Helper
 * Helps you configure email settings without needing a website
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 Email Setup Helper');
console.log('====================');
console.log('');
console.log('This will help you set up email sending without needing a website!');
console.log('');

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function setupEmail() {
  console.log('📧 Choose your email provider:');
  console.log('1. Gmail (Recommended - Free, No website needed)');
  console.log('2. SendGrid (Free tier: 100 emails/day)');
  console.log('3. Mailgun (Free tier: 5,000 emails/month)');
  console.log('4. Skip setup (Keep development mode)');
  console.log('');

  const choice = await askQuestion('Enter your choice (1-4): ');

  switch (choice) {
    case '1':
      await setupGmail();
      break;
    case '2':
      await setupSendGrid();
      break;
    case '3':
      await setupMailgun();
      break;
    case '4':
      console.log('✅ Keeping development mode - emails will be logged to console');
      break;
    default:
      console.log('❌ Invalid choice. Keeping development mode.');
  }

  rl.close();
}

async function setupGmail() {
  console.log('');
  console.log('📧 Gmail Setup');
  console.log('==============');
  console.log('');
  console.log('First, you need to:');
  console.log('1. Enable 2-Factor Authentication on your Google account');
  console.log('2. Generate an App Password for "Mail"');
  console.log('');
  console.log('📖 See GMAIL_SETUP.md for detailed instructions');
  console.log('');

  const email = await askQuestion('Enter your Gmail address: ');
  const appPassword = await askQuestion('Enter your 16-character app password: ');

  if (email && appPassword) {
    updateEnvFile({
      EMAIL_HOST: 'smtp.gmail.com',
      EMAIL_PORT: '587',
      EMAIL_USER: email,
      EMAIL_PASS: appPassword
    });
    console.log('✅ Gmail configuration updated!');
    console.log('🔄 Restart your server to apply changes');
  } else {
    console.log('❌ Setup incomplete. Keeping development mode.');
  }
}

async function setupSendGrid() {
  console.log('');
  console.log('📧 SendGrid Setup');
  console.log('=================');
  console.log('');
  console.log('1. Sign up at https://sendgrid.com');
  console.log('2. Verify your sender identity');
  console.log('3. Create an API key');
  console.log('');

  const apiKey = await askQuestion('Enter your SendGrid API key: ');

  if (apiKey) {
    updateEnvFile({
      EMAIL_HOST: 'smtp.sendgrid.net',
      EMAIL_PORT: '587',
      EMAIL_USER: 'apikey',
      EMAIL_PASS: apiKey
    });
    console.log('✅ SendGrid configuration updated!');
    console.log('🔄 Restart your server to apply changes');
  } else {
    console.log('❌ Setup incomplete. Keeping development mode.');
  }
}

async function setupMailgun() {
  console.log('');
  console.log('📧 Mailgun Setup');
  console.log('================');
  console.log('');
  console.log('1. Sign up at https://www.mailgun.com');
  console.log('2. Get your SMTP credentials');
  console.log('');

  const username = await askQuestion('Enter your Mailgun SMTP username: ');
  const password = await askQuestion('Enter your Mailgun SMTP password: ');

  if (username && password) {
    updateEnvFile({
      EMAIL_HOST: 'smtp.mailgun.org',
      EMAIL_PORT: '587',
      EMAIL_USER: username,
      EMAIL_PASS: password
    });
    console.log('✅ Mailgun configuration updated!');
    console.log('🔄 Restart your server to apply changes');
  } else {
    console.log('❌ Setup incomplete. Keeping development mode.');
  }
}

function updateEnvFile(config) {
  const envPath = path.join(__dirname, '.env');
  
  try {
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Update each configuration
    Object.entries(config).forEach(([key, value]) => {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, `${key}=${value}`);
      } else {
        envContent += `\n${key}=${value}`;
      }
    });
    
    fs.writeFileSync(envPath, envContent);
  } catch (error) {
    console.log('❌ Error updating .env file:', error.message);
  }
}

// Run the setup
setupEmail().catch(console.error);
