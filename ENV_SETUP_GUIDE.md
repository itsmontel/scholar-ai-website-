# Environment Variable Setup Guide - URGENT FIX for Mobile Issues

## Problem
Mobile users are getting "failed to fetch" errors because the frontend doesn't know your Railway backend URL.

## Solution: Set Environment Variables

### Step 1: Find Your Railway Backend URL

1. Go to your Railway dashboard
2. Find your backend service
3. Look for the **public URL** (it should look like: `https://your-app-name.railway.app`)

### Step 2: Configure Netlify Environment Variables

1. **Go to Netlify Dashboard**
   - Log into https://app.netlify.com
   - Select your WriteScholar site

2. **Add Environment Variable**
   - Go to: **Site settings** → **Environment variables** → **Add a variable**
   - Click "Add a variable"
   - Set:
     - **Key**: `VITE_API_URL`
     - **Value**: `https://your-railway-backend.railway.app/api`
     - **Scopes**: Check "Production" and "Deploy previews"
   - Click "Create variable"

3. **Trigger a Rebuild**
   - Go to **Deploys** tab
   - Click "Trigger deploy" → "Deploy site"
   - Wait for the build to complete

### Step 3: Local Development (Optional)

Create a `.env.local` file in your project root:

```bash
VITE_API_URL=http://localhost:3001/api
```

**Note**: This file is gitignored and won't be committed.

## Verification

After the rebuild completes:

1. **Test on Mobile**:
   - Open your site on a mobile phone
   - Try to run an AI analysis
   - It should now work!

2. **Check Browser Console**:
   - If there are still issues, open browser DevTools
   - Look for the network request to verify it's hitting the correct URL
   - You should see: `https://your-railway-backend.railway.app/api/analysis/analyze`
   - NOT: `http://localhost:3001/api/analysis/analyze`

## Common Issues

### Issue: Still seeing localhost in requests
**Solution**: Make sure you:
- Set the variable in Netlify (not just in netlify.toml)
- Triggered a new deploy AFTER setting the variable
- Cleared your browser cache

### Issue: CORS errors
**Solution**: Check your Railway backend's CORS configuration in `backend/src/server.js`:
- Make sure your Netlify URL is in the CORS_ORIGIN list
- Or set CORS_ORIGIN environment variable in Railway to include your Netlify domain

### Issue: 404 errors
**Solution**: Make sure your Railway backend URL includes `/api` at the end

## Quick Checklist

- [ ] Found Railway backend URL
- [ ] Added VITE_API_URL to Netlify environment variables
- [ ] Value includes `/api` at the end
- [ ] Triggered new deploy in Netlify
- [ ] Tested on mobile device
- [ ] Confirmed it's working

## Example Configuration

If your Railway backend is: `https://writescholar-backend.railway.app`

Then your `VITE_API_URL` should be: `https://writescholar-backend.railway.app/api`

---

**Need Help?**
- Check Railway logs for backend errors
- Check browser console for frontend errors
- Verify the environment variable is set correctly in Netlify

