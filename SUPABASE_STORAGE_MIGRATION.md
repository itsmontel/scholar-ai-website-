# 🚀 Supabase Storage Migration Guide

This guide will help you migrate from AWS S3 to Supabase Storage for your WriteScholar application, which will save costs and simplify your infrastructure.

## 📊 **Cost Comparison**

| Service | Monthly Cost* | Free Tier | Integration |
|---------|---------------|-----------|-------------|
| **Supabase Storage** | $0-25 | 1GB storage, 2GB bandwidth | ✅ Already integrated |
| **AWS S3** | $0.50-1.00 | 5GB storage, 20K requests | ❌ Requires AWS setup |

*For 1000 users, ~20GB storage

## 🎯 **Migration Steps**

### **Step 1: Update Environment Variables**

Add to your `backend/.env` file:

```env
# Enable Supabase Storage
USE_SUPABASE_STORAGE=true
```

### **Step 2: Run Setup Script**

```bash
cd backend
node setup-supabase-storage.js
```

This will:
- ✅ Create the storage bucket
- ✅ Show you the RLS policies to set up
- ✅ Test the configuration

### **Step 3: Set Up RLS Policies**

1. Go to your [Supabase Dashboard](https://app.supabase.com/projects)
2. Navigate to **Storage** → **Policies**
3. Add these policies for the `objects` table:

**Policy 1: Users can upload their own documents**
```sql
CREATE POLICY "Users can upload their own documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'writescholar-documents' AND
  (storage.foldername(name))[1] = 'documents' AND
  (storage.foldername(name))[2] = auth.uid()::text
);
```

**Policy 2: Users can view their own documents**
```sql
CREATE POLICY "Users can view their own documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'writescholar-documents' AND
  (storage.foldername(name))[1] = 'documents' AND
  (storage.foldername(name))[2] = auth.uid()::text
);
```

**Policy 3: Users can delete their own documents**
```sql
CREATE POLICY "Users can delete their own documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'writescholar-documents' AND
  (storage.foldername(name))[1] = 'documents' AND
  (storage.foldername(name))[2] = auth.uid()::text
);
```

### **Step 4: Test Configuration**

```bash
cd backend
node test-supabase-storage.js
```

Expected output:
```
✅ Bucket initialization: PASSED
✅ Upload: PASSED
✅ Download URL: PASSED
✅ Metadata: PASSED
✅ File listing: PASSED
✅ Usage statistics: PASSED
✅ Delete: PASSED
```

### **Step 5: Restart Your Application**

```bash
# Kill existing processes
pkill -f "nodemon"

# Start backend with Supabase Storage
cd backend && npm run dev

# Start frontend (in another terminal)
npm run dev
```

## 🔄 **How It Works**

### **File Organization**
```
writescholar-documents/
├── documents/
│   ├── user-id-1/
│   │   ├── uuid1.pdf
│   │   ├── uuid2.docx
│   │   └── uuid3.txt
│   ├── user-id-2/
│   │   └── uuid4.pdf
│   └── ...
```

### **API Compatibility**
The Supabase Storage service maintains the same interface as S3:

```javascript
// Same methods work for both S3 and Supabase Storage
const result = await storageService.uploadFile(buffer, filename, userId, mimeType);
const downloadUrl = await storageService.getSignedDownloadUrl(key, 3600);
const deleted = await storageService.deleteFile(key);
```

## 🛡️ **Security Features**

### **Row Level Security (RLS)**
- ✅ Users can only access their own files
- ✅ No cross-user data leakage
- ✅ Automatic user isolation

### **File Type Restrictions**
- ✅ Only PDF, DOC, DOCX, TXT, MD files allowed
- ✅ 10MB file size limit
- ✅ MIME type validation

### **Private Storage**
- ✅ All files are private by default
- ✅ Access only via signed URLs
- ✅ URLs expire after 1 hour

## 🔧 **Troubleshooting**

### **Common Issues**

**1. "Missing Supabase configuration"**
```bash
# Check your .env file has:
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
USE_SUPABASE_STORAGE=true
```

**2. "Bucket creation failed"**
- Ensure you have admin access to your Supabase project
- Check if Storage is enabled in your project
- Verify your service role key has storage permissions

**3. "Upload failed: invalid_mime_type"**
- Only PDF, DOC, DOCX, TXT, MD files are allowed
- Check the file type being uploaded
- Update `allowedMimeTypes` in `supabaseStorage.js` if needed

**4. "RLS policy error"**
- Set up the RLS policies in Supabase Dashboard
- Ensure policies are applied to the `objects` table
- Check that `auth.uid()` matches your user authentication

### **Debug Mode**

Add this to your `.env` for detailed logging:
```env
DEBUG_STORAGE=true
```

## 🎛️ **Switching Back to S3**

If you need to switch back to S3:

```env
# Disable Supabase Storage
USE_SUPABASE_STORAGE=false

# For production, ensure AWS credentials are set:
NODE_ENV=production
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=writescholar-documents
```

## ⚡ **Performance Comparison**

| Feature | Supabase Storage | AWS S3 | Local Storage |
|---------|------------------|--------|---------------|
| **Setup Time** | 5 minutes | 30 minutes | 1 minute |
| **Cost (small app)** | Free/$25 | $0.50-1.00 | Free |
| **Integration** | Native | External | Development only |
| **Scalability** | High | Very High | None |
| **Security** | RLS + Auth | IAM + Policies | None |

## 🚀 **Next Steps**

After successful migration:

1. **Monitor Usage**: Check storage usage in Supabase Dashboard
2. **Set Alerts**: Configure usage alerts in Supabase
3. **Backup Strategy**: Consider backup policies for important documents
4. **Performance**: Monitor upload/download speeds
5. **Scale Plan**: Upgrade to Pro when you hit free tier limits

## 📞 **Support**

If you encounter issues:

1. Check the console logs for detailed error messages
2. Run the test script: `node test-supabase-storage.js`
3. Verify RLS policies in Supabase Dashboard
4. Check Supabase project logs
5. Review environment variables

---

**🎉 Congratulations!** You've successfully migrated to Supabase Storage and reduced your infrastructure complexity while saving costs!
