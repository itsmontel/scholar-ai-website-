# AWS S3 Configuration Guide for Scholar AI

This guide will help you set up proper AWS S3 configuration for your Scholar AI application.

## 🚀 Quick Setup (Recommended)

### 1. Create AWS Account & IAM User

1. **Sign up for AWS** (if you don't have an account)
   - Go to [aws.amazon.com](https://aws.amazon.com)
   - Create a free account (12 months free tier available)

2. **Create IAM User for Scholar AI**
   ```bash
   # Navigate to IAM in AWS Console
   # Create User: scholar-ai-s3-user
   # Attach Policy: AmazonS3FullAccess (for development)
   # Or create custom policy (recommended for production)
   ```

### 2. Create S3 Bucket

1. **Create Bucket**
   ```bash
   # Bucket name: scholar-ai-documents-[your-unique-suffix]
   # Region: us-east-1 (or your preferred region)
   # Block all public access: YES (recommended)
   ```

2. **Configure CORS (if needed)**
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": ["http://localhost:5173", "https://yourdomain.com"],
       "ExposeHeaders": []
     }
   ]
   ```

### 3. Environment Variables

Create/update your `.env` file in the `backend` directory:

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=AKIA...your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_access_key_here
AWS_REGION=us-east-1
AWS_S3_BUCKET=scholar-ai-documents-your-unique-suffix

# Set to production to use real S3
NODE_ENV=production
```

## 🔧 Production Security Setup

### 1. Create Custom IAM Policy

Instead of `AmazonS3FullAccess`, create a custom policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:GetObjectMetadata"
      ],
      "Resource": "arn:aws:s3:::scholar-ai-documents-your-unique-suffix/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::scholar-ai-documents-your-unique-suffix"
    }
  ]
}
```

### 2. Bucket Policy (Optional)

Add bucket policy for additional security:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyInsecureConnections",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": [
        "arn:aws:s3:::scholar-ai-documents-your-unique-suffix",
        "arn:aws:s3:::scholar-ai-documents-your-unique-suffix/*"
      ],
      "Condition": {
        "Bool": {
          "aws:SecureTransport": "false"
        }
      }
    }
  ]
}
```

## 📁 File Structure & Organization

Your S3 bucket will be organized as:

```
scholar-ai-documents/
├── documents/
│   ├── user-id-1/
│   │   ├── uuid1.pdf
│   │   ├── uuid2.docx
│   │   └── uuid3.txt
│   ├── user-id-2/
│   │   ├── uuid4.pdf
│   │   └── uuid5.docx
│   └── ...
```

## 🔄 Switching Between Mock and Real S3

### Development (Mock S3)
```env
NODE_ENV=development
# Uses local file storage in backend/uploads/
```

### Production (Real S3)
```env
NODE_ENV=production
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
```

## 🛠️ Testing Your Setup

### 1. Test S3 Connection

Create a test script:

```javascript
// test-s3.js
const s3Service = require('./src/services/s3Service');

async function testS3() {
  try {
    const testBuffer = Buffer.from('Hello, S3!');
    const result = await s3Service.uploadFile(
      testBuffer, 
      'test.txt', 
      'test-user', 
      'text/plain'
    );
    
    console.log('✅ S3 Upload Success:', result);
    
    // Test download URL
    const downloadUrl = await s3Service.getSignedDownloadUrl(result.s3Key);
    console.log('✅ Download URL:', downloadUrl);
    
    // Clean up
    await s3Service.deleteFile(result.s3Key);
    console.log('✅ Test file deleted');
    
  } catch (error) {
    console.error('❌ S3 Test Failed:', error);
  }
}

testS3();
```

### 2. Run the Test

```bash
cd backend
node test-s3.js
```

## 💰 Cost Optimization

### 1. S3 Storage Classes

Consider using different storage classes:

```javascript
// In s3Service.js, add storage class option
const command = new PutObjectCommand({
  Bucket: this.bucketName,
  Key: s3Key,
  Body: fileBuffer,
  ContentType: mimeType,
  StorageClass: 'STANDARD_IA', // For infrequently accessed files
  Metadata: {
    originalName: fileName,
    userId: userId,
    uploadedAt: new Date().toISOString(),
  },
});
```

### 2. Lifecycle Policies

Set up lifecycle policies in AWS Console:

```json
{
  "Rules": [
    {
      "ID": "DeleteOldFiles",
      "Status": "Enabled",
      "Filter": {
        "Prefix": "documents/"
      },
      "Expiration": {
        "Days": 365
      }
    }
  ]
}
```

## 🔒 Security Best Practices

### 1. Environment Variables Security

```bash
# Never commit .env files
echo ".env" >> .gitignore
echo "*.env" >> .gitignore
```

### 2. IAM User Rotation

- Rotate access keys every 90 days
- Use AWS Secrets Manager for production
- Enable MFA on AWS account

### 3. Bucket Security

- Enable versioning (optional)
- Enable server-side encryption
- Set up CloudTrail for audit logs

## 🚨 Troubleshooting

### Common Issues

1. **Access Denied**
   ```bash
   # Check IAM permissions
   # Verify bucket name and region
   # Ensure credentials are correct
   ```

2. **Bucket Not Found**
   ```bash
   # Verify bucket name in .env
   # Check region matches bucket region
   # Ensure bucket exists in AWS Console
   ```

3. **CORS Issues**
   ```bash
   # Add CORS configuration to bucket
   # Check allowed origins match your domain
   ```

### Debug Mode

Add debug logging to s3Service.js:

```javascript
// Add at the top of s3Service.js
const debug = process.env.DEBUG_S3 === 'true';

// Add debug logs
if (debug) {
  console.log('S3 Config:', {
    region: process.env.AWS_REGION,
    bucket: process.env.AWS_S3_BUCKET,
    hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
    hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY
  });
}
```

## 📊 Monitoring & Analytics

### 1. CloudWatch Metrics

Monitor your S3 usage:
- Storage metrics
- Request metrics
- Error rates

### 2. Cost Alerts

Set up billing alerts:
- Monthly spend alerts
- Unusual activity alerts

## 🎯 Next Steps

1. **Set up AWS account and create bucket**
2. **Configure environment variables**
3. **Test the connection**
4. **Deploy to production**
5. **Set up monitoring and alerts**

## 📞 Support

If you encounter issues:
1. Check AWS CloudTrail logs
2. Verify IAM permissions
3. Test with AWS CLI
4. Check network connectivity

---

**Note**: Always test in a development environment before deploying to production!
