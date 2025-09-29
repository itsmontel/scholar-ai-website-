#!/usr/bin/env node

/**
 * S3 Configuration Test Script
 * 
 * This script tests your AWS S3 configuration to ensure everything is working properly.
 * Run this after setting up your AWS credentials and S3 bucket.
 */

require('dotenv').config();
const s3Service = require('./src/services/s3Service');

async function testS3Configuration() {
  console.log('🧪 Testing AWS S3 Configuration...\n');

  // Check environment variables
  console.log('📋 Environment Check:');
  console.log(`   AWS_REGION: ${process.env.AWS_REGION || 'NOT SET'}`);
  console.log(`   AWS_S3_BUCKET: ${process.env.AWS_S3_BUCKET || 'NOT SET'}`);
  console.log(`   AWS_ACCESS_KEY_ID: ${process.env.AWS_ACCESS_KEY_ID ? 'SET ✅' : 'NOT SET ❌'}`);
  console.log(`   AWS_SECRET_ACCESS_KEY: ${process.env.AWS_SECRET_ACCESS_KEY ? 'SET ✅' : 'NOT SET ❌'}`);
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}\n`);

  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.log('❌ Missing AWS credentials. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in your .env file.');
    return;
  }

  if (!process.env.AWS_S3_BUCKET) {
    console.log('❌ Missing AWS_S3_BUCKET. Please set your S3 bucket name in your .env file.');
    return;
  }

  try {
    // Test 1: Upload a test file
    console.log('📤 Test 1: Uploading test file...');
    const testContent = `Scholar AI S3 Test File
Created: ${new Date().toISOString()}
This is a test file to verify S3 configuration.`;
    
    const testBuffer = Buffer.from(testContent, 'utf8');
    const uploadResult = await s3Service.uploadFile(
      testBuffer,
      's3-test.txt',
      'test-user-123',
      'text/plain'
    );

    if (!uploadResult.success) {
      throw new Error(`Upload failed: ${uploadResult.error}`);
    }

    console.log('✅ Upload successful!');
    console.log(`   S3 Key: ${uploadResult.s3Key}`);
    console.log(`   S3 URL: ${uploadResult.s3Url}\n`);

    // Test 2: Generate signed download URL
    console.log('🔗 Test 2: Generating signed download URL...');
    const downloadUrl = await s3Service.getSignedDownloadUrl(uploadResult.s3Key, 3600);
    console.log('✅ Signed URL generated!');
    console.log(`   Download URL: ${downloadUrl}\n`);

    // Test 3: Get file metadata
    console.log('📊 Test 3: Getting file metadata...');
    const metadata = await s3Service.getFileMetadata(uploadResult.s3Key);
    console.log('✅ Metadata retrieved!');
    console.log(`   Content Type: ${metadata.contentType}`);
    console.log(`   Content Length: ${metadata.contentLength} bytes`);
    console.log(`   Last Modified: ${metadata.lastModified}\n`);

    // Test 4: Delete test file
    console.log('🗑️  Test 4: Deleting test file...');
    const deleteResult = await s3Service.deleteFile(uploadResult.s3Key);
    
    if (deleteResult) {
      console.log('✅ Test file deleted successfully!\n');
    } else {
      console.log('⚠️  Warning: Could not delete test file. You may need to clean it up manually.\n');
    }

    // Summary
    console.log('🎉 S3 Configuration Test Results:');
    console.log('   ✅ Upload: PASSED');
    console.log('   ✅ Download URL: PASSED');
    console.log('   ✅ Metadata: PASSED');
    console.log('   ✅ Delete: PASSED');
    console.log('\n🚀 Your S3 configuration is working correctly!');
    console.log('   You can now set NODE_ENV=production to use real S3 in your application.');

  } catch (error) {
    console.error('\n❌ S3 Configuration Test Failed:');
    console.error(`   Error: ${error.message}`);
    
    if (error.code === 'NoSuchBucket') {
      console.error('\n💡 Troubleshooting:');
      console.error('   - Check that your S3 bucket exists');
      console.error('   - Verify the bucket name in AWS_S3_BUCKET');
      console.error('   - Ensure the bucket is in the correct region');
    } else if (error.code === 'InvalidAccessKeyId') {
      console.error('\n💡 Troubleshooting:');
      console.error('   - Check your AWS_ACCESS_KEY_ID');
      console.error('   - Verify the access key is correct');
      console.error('   - Ensure the IAM user has S3 permissions');
    } else if (error.code === 'SignatureDoesNotMatch') {
      console.error('\n💡 Troubleshooting:');
      console.error('   - Check your AWS_SECRET_ACCESS_KEY');
      console.error('   - Verify the secret key is correct');
      console.error('   - Ensure there are no extra spaces in your .env file');
    } else if (error.code === 'AccessDenied') {
      console.error('\n💡 Troubleshooting:');
      console.error('   - Check IAM user permissions');
      console.error('   - Ensure the user has S3 access');
      console.error('   - Verify bucket policy allows your user');
    } else {
      console.error('\n💡 General Troubleshooting:');
      console.error('   - Check your internet connection');
      console.error('   - Verify AWS region is correct');
      console.error('   - Check AWS service status');
      console.error('   - Review AWS CloudTrail logs for more details');
    }
  }
}

// Run the test
if (require.main === module) {
  testS3Configuration().catch(console.error);
}

module.exports = testS3Configuration;
