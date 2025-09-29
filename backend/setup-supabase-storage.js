#!/usr/bin/env node

/**
 * Supabase Storage Setup Script
 * 
 * This script sets up Supabase Storage for Scholar AI, including:
 * - Creating the storage bucket
 * - Setting up RLS policies
 * - Testing the configuration
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function setupSupabaseStorage() {
  console.log('🚀 Setting up Supabase Storage for Scholar AI\n');

  // Check environment variables
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing required environment variables:');
    console.error('   SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
    console.error('   Please check your .env file');
    return;
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const bucketName = 'scholar-ai-documents';

  try {
    // Step 1: Create storage bucket
    console.log('📦 Step 1: Setting up storage bucket...');
    
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      return;
    }

    const bucketExists = buckets.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      console.log(`   Creating bucket: ${bucketName}`);
      
      const { data, error } = await supabase.storage.createBucket(bucketName, {
        public: false, // Private bucket
        allowedMimeTypes: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
          'text/markdown'
        ],
        fileSizeLimit: 10485760 // 10MB
      });

      if (error) {
        console.error('❌ Error creating bucket:', error);
        return;
      }
      
      console.log('✅ Bucket created successfully');
    } else {
      console.log('✅ Bucket already exists');
    }

    // Step 2: Set up RLS policies
    console.log('\n🔒 Step 2: Setting up Row Level Security policies...');
    
    // Enable RLS on the bucket
    const rlsPolicies = [
      {
        name: 'Users can upload their own documents',
        sql: `
          CREATE POLICY "Users can upload their own documents" ON storage.objects
          FOR INSERT WITH CHECK (
            bucket_id = '${bucketName}' AND
            (storage.foldername(name))[1] = 'documents' AND
            (storage.foldername(name))[2] = auth.uid()::text
          );
        `
      },
      {
        name: 'Users can view their own documents',
        sql: `
          CREATE POLICY "Users can view their own documents" ON storage.objects
          FOR SELECT USING (
            bucket_id = '${bucketName}' AND
            (storage.foldername(name))[1] = 'documents' AND
            (storage.foldername(name))[2] = auth.uid()::text
          );
        `
      },
      {
        name: 'Users can delete their own documents',
        sql: `
          CREATE POLICY "Users can delete their own documents" ON storage.objects
          FOR DELETE USING (
            bucket_id = '${bucketName}' AND
            (storage.foldername(name))[1] = 'documents' AND
            (storage.foldername(name))[2] = auth.uid()::text
          );
        `
      }
    ];

    console.log('   Note: RLS policies should be set up in the Supabase Dashboard');
    console.log('   Go to: Storage > Policies in your Supabase project');
    console.log('   Add the following policies for the objects table:\n');
    
    rlsPolicies.forEach((policy, index) => {
      console.log(`   Policy ${index + 1}: ${policy.name}`);
      console.log(`   ${policy.sql}\n`);
    });

    // Step 3: Test the configuration
    console.log('🧪 Step 3: Testing storage configuration...');
    
    // Test upload
    const testContent = `Scholar AI Storage Test
Created: ${new Date().toISOString()}
This is a test file to verify Supabase Storage configuration.`;
    
    const testBuffer = Buffer.from(testContent, 'utf8');
    const testPath = 'test/storage-test.txt';
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(testPath, testBuffer, {
        contentType: 'text/plain',
        metadata: {
          test: true,
          createdAt: new Date().toISOString()
        }
      });

    if (uploadError) {
      console.error('❌ Upload test failed:', uploadError);
      return;
    }

    console.log('✅ Upload test successful');

    // Test signed URL
    const { data: urlData, error: urlError } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(testPath, 3600);

    if (urlError) {
      console.error('❌ Signed URL test failed:', urlError);
      return;
    }

    console.log('✅ Signed URL test successful');

    // Clean up test file
    const { error: deleteError } = await supabase.storage
      .from(bucketName)
      .remove([testPath]);

    if (deleteError) {
      console.log('⚠️  Could not clean up test file (this is ok)');
    } else {
      console.log('✅ Test cleanup successful');
    }

    // Step 4: Summary
    console.log('\n🎉 Supabase Storage Setup Complete!');
    console.log('\n📋 Next Steps:');
    console.log('1. Set USE_SUPABASE_STORAGE=true in your .env file');
    console.log('2. Set up RLS policies in Supabase Dashboard (see above)');
    console.log('3. Restart your backend server');
    console.log('4. Test file uploads in your application');
    
    console.log('\n💰 Cost Benefits:');
    console.log('• Free tier: 1GB storage + 2GB bandwidth/month');
    console.log('• Pro plan: $25/month for 100GB storage + 250GB bandwidth');
    console.log('• Much cheaper than AWS S3 for most use cases');
    
    console.log('\n🔗 Useful Links:');
    console.log(`• Storage Dashboard: ${process.env.SUPABASE_URL.replace('https://', 'https://app.supabase.com/project/')}/storage/buckets`);
    console.log(`• Policies: ${process.env.SUPABASE_URL.replace('https://', 'https://app.supabase.com/project/')}/storage/policies`);

  } catch (error) {
    console.error('❌ Setup failed:', error);
    console.log('\n💡 Troubleshooting:');
    console.log('• Check your SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    console.log('• Ensure you have admin access to your Supabase project');
    console.log('• Verify your internet connection');
  }
}

// Run setup
if (require.main === module) {
  setupSupabaseStorage().catch(console.error);
}

module.exports = setupSupabaseStorage;
