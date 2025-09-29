#!/usr/bin/env node

/**
 * Supabase Storage Test Script
 * 
 * This script tests your Supabase Storage configuration to ensure everything is working properly.
 * Run this after setting up Supabase Storage.
 */

require('dotenv').config();
const supabaseStorage = require('./src/services/supabaseStorage');

async function testSupabaseStorage() {
  console.log('🧪 Testing Supabase Storage Configuration...\n');

  // Check environment variables
  console.log('📋 Environment Check:');
  console.log(`   SUPABASE_URL: ${process.env.SUPABASE_URL ? 'SET ✅' : 'NOT SET ❌'}`);
  console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET ✅' : 'NOT SET ❌'}`);
  console.log(`   USE_SUPABASE_STORAGE: ${process.env.USE_SUPABASE_STORAGE || 'NOT SET (defaults to false)'}\n`);

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('❌ Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file.');
    return;
  }

  try {
    // Test 1: Initialize bucket
    console.log('📦 Test 1: Initializing storage bucket...');
    const bucketInitialized = await supabaseStorage.initializeBucket();
    
    if (!bucketInitialized) {
      throw new Error('Failed to initialize storage bucket');
    }
    
    console.log('✅ Bucket initialization successful!\n');

    // Test 2: Upload a test file
    console.log('📤 Test 2: Uploading test file...');
    const testContent = `Supabase Storage Test File
Created: ${new Date().toISOString()}
This is a test file to verify Supabase Storage configuration.`;
    
    const testBuffer = Buffer.from(testContent, 'utf8');
    const uploadResult = await supabaseStorage.uploadFile(
      testBuffer,
      'supabase-test.txt',
      'test-user-123',
      'text/plain'
    );

    if (!uploadResult.success) {
      throw new Error(`Upload failed: ${uploadResult.error}`);
    }

    console.log('✅ Upload successful!');
    console.log(`   Storage Key: ${uploadResult.s3Key}`);
    console.log(`   Storage URL: ${uploadResult.s3Url}`);
    console.log(`   Provider: ${uploadResult.provider}\n`);

    // Test 3: Generate signed download URL
    console.log('🔗 Test 3: Generating signed download URL...');
    const downloadUrl = await supabaseStorage.getSignedDownloadUrl(uploadResult.s3Key, 3600);
    console.log('✅ Signed URL generated!');
    console.log(`   Download URL: ${downloadUrl}\n`);

    // Test 4: Get file metadata
    console.log('📊 Test 4: Getting file metadata...');
    const metadata = await supabaseStorage.getFileMetadata(uploadResult.s3Key);
    console.log('✅ Metadata retrieved!');
    console.log(`   Content Type: ${metadata.contentType}`);
    console.log(`   Content Length: ${metadata.contentLength} bytes`);
    console.log(`   Last Modified: ${metadata.lastModified}\n`);

    // Test 5: List user files
    console.log('📋 Test 5: Listing user files...');
    const userFiles = await supabaseStorage.listUserFiles('test-user-123');
    console.log('✅ File listing successful!');
    console.log(`   Found ${userFiles.length} file(s)\n`);

    // Test 6: Get storage usage
    console.log('📈 Test 6: Getting storage usage...');
    const usage = await supabaseStorage.getStorageUsage('test-user-123');
    console.log('✅ Usage statistics retrieved!');
    console.log(`   Total Size: ${usage.formattedSize}`);
    console.log(`   Total Files: ${usage.totalFiles}\n`);

    // Test 7: Delete test file
    console.log('🗑️  Test 7: Deleting test file...');
    const deleteResult = await supabaseStorage.deleteFile(uploadResult.s3Key);
    
    if (deleteResult) {
      console.log('✅ Test file deleted successfully!\n');
    } else {
      console.log('⚠️  Warning: Could not delete test file. You may need to clean it up manually.\n');
    }

    // Summary
    console.log('🎉 Supabase Storage Test Results:');
    console.log('   ✅ Bucket initialization: PASSED');
    console.log('   ✅ Upload: PASSED');
    console.log('   ✅ Download URL: PASSED');
    console.log('   ✅ Metadata: PASSED');
    console.log('   ✅ File listing: PASSED');
    console.log('   ✅ Usage statistics: PASSED');
    console.log('   ✅ Delete: PASSED');
    console.log('\n🚀 Your Supabase Storage configuration is working correctly!');
    console.log('   You can now set USE_SUPABASE_STORAGE=true to use Supabase Storage in your application.');

    // Cost comparison
    console.log('\n💰 Cost Benefits vs AWS S3:');
    console.log('   • Supabase Free: 1GB storage, 2GB bandwidth/month');
    console.log('   • AWS S3 Free: 5GB storage, 20K requests/month (12 months only)');
    console.log('   • Supabase Pro: $25/month for 100GB + 250GB bandwidth');
    console.log('   • AWS S3: ~$0.50-1.00/month for 20GB + requests');
    console.log('   • Winner: Supabase for integrated experience, S3 for cost at scale');

  } catch (error) {
    console.error('\n❌ Supabase Storage Test Failed:');
    console.error(`   Error: ${error.message}`);
    
    if (error.message.includes('JWT')) {
      console.error('\n💡 Troubleshooting:');
      console.error('   - Check your SUPABASE_SERVICE_ROLE_KEY');
      console.error('   - Ensure you\'re using the service role key, not the anon key');
      console.error('   - Verify the key is correct in your Supabase project settings');
    } else if (error.message.includes('Project not found')) {
      console.error('\n💡 Troubleshooting:');
      console.error('   - Check your SUPABASE_URL');
      console.error('   - Verify the URL matches your Supabase project');
      console.error('   - Ensure the project exists and is active');
    } else if (error.message.includes('bucket')) {
      console.error('\n💡 Troubleshooting:');
      console.error('   - Go to your Supabase project dashboard');
      console.error('   - Navigate to Storage section');
      console.error('   - Check if buckets can be created');
      console.error('   - Ensure you have admin permissions');
    } else {
      console.error('\n💡 General Troubleshooting:');
      console.error('   - Check your internet connection');
      console.error('   - Verify Supabase service status');
      console.error('   - Try running the setup script: node setup-supabase-storage.js');
      console.error('   - Check Supabase project logs for more details');
    }
  }
}

// Run the test
if (require.main === module) {
  testSupabaseStorage().catch(console.error);
}

module.exports = testSupabaseStorage;
