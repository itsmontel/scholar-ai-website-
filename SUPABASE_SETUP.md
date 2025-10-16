# 🚀 Supabase Setup Guide for WriteScholar

This guide will help you set up Supabase as your database for the WriteScholar application.

## 📋 **Prerequisites**

- Node.js installed on your system
- A Supabase account (free at [supabase.com](https://supabase.com))
- Your WriteScholar backend code

## 🎯 **Step 1: Create Supabase Project**

1. **Go to [supabase.com](https://supabase.com)** and sign up/login
2. **Click "New Project"**
3. **Fill in project details:**
   - **Name**: `writescholar-database`
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is perfect to start

4. **Wait for project creation** (takes 1-2 minutes)

## 🔑 **Step 2: Get Your Database Credentials**

Once your project is ready:

### **Database Settings**
1. **Go to Settings → Database**
2. **Copy these values:**
   - **Host**: `db.your-project-ref.supabase.co`
   - **Database name**: `postgres`
   - **Port**: `5432`
   - **Username**: `postgres`
   - **Password**: (the one you created)

### **API Settings**
1. **Go to Settings → API**
2. **Copy these values:**
   - **Project URL**: `https://your-project-ref.supabase.co`
   - **Anon public key**: `eyJ...` (starts with eyJ)
   - **Service role key**: `eyJ...` (starts with eyJ)

## ⚙️ **Step 3: Configure Your Backend**

1. **Navigate to your backend directory:**
   ```bash
   cd backend
   ```

2. **Copy the environment template:**
   ```bash
   cp env.example .env
   ```

3. **Edit your `.env` file with Supabase credentials:**
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # Database Configuration (Supabase)
   DB_HOST=db.your-project-ref.supabase.co
   DB_PORT=5432
   DB_NAME=postgres
   DB_USER=postgres
   DB_PASSWORD=your_supabase_password

   # Supabase Configuration
   SUPABASE_URL=https://your-project-ref.supabase.co
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRES_IN=7d

   # AWS S3 Configuration
   AWS_ACCESS_KEY_ID=your_aws_access_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret_key
   AWS_REGION=us-east-1
   AWS_S3_BUCKET=writescholar-documents

   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key_here

   # Stripe Configuration
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
   STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   ```

## 🗄️ **Step 4: Set Up Database Tables**

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the Supabase setup script:**
   ```bash
   npm run setup-supabase
   ```

   This will:
   - Test your database connection
   - Create all required tables
   - Seed initial data
   - Verify everything is working

## 🧪 **Step 5: Test Your Setup**

1. **Start your backend server:**
   ```bash
   npm run dev
   ```

2. **Check the console output:**
   - You should see: `✅ Database connected successfully`
   - Server should start on `http://localhost:5000`

3. **Test the API:**
   ```bash
   curl http://localhost:5000/api/health
   ```

## 📊 **Step 6: Verify in Supabase Dashboard**

1. **Go to your Supabase project dashboard**
2. **Navigate to Table Editor**
3. **You should see these tables:**
   - `users`
   - `subscriptions`
   - `documents`
   - `analyses`
   - `usage_tracking`
   - `notifications`

## 🔧 **Troubleshooting**

### **Connection Issues**
- **Check your credentials** in `.env` file
- **Verify your Supabase project is active**
- **Ensure your database password is correct**
- **Check your internet connection**

### **SSL Issues**
- Supabase requires SSL connections
- The setup script handles this automatically
- If you get SSL errors, check your connection string

### **Permission Issues**
- Make sure you're using the correct database user
- Verify your Supabase project permissions
- Check if your IP is whitelisted (if using IP restrictions)

## 🚀 **Next Steps**

Once your Supabase setup is complete:

1. **Test your backend API endpoints**
2. **Connect your frontend to the backend**
3. **Test the full user flow**
4. **Deploy to production**

## 📚 **Additional Resources**

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Node.js PostgreSQL Guide](https://node-postgres.com/)

## 🆘 **Need Help?**

If you encounter any issues:

1. **Check the console output** for error messages
2. **Verify your Supabase credentials**
3. **Test your database connection** in Supabase dashboard
4. **Check the troubleshooting section** above

---

**🎉 Congratulations!** Your Supabase database is now ready for WriteScholar!
