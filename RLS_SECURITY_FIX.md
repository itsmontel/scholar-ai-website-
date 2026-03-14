# Row Level Security (RLS) Fix

This document describes how to fix Security Advisor errors and warnings related to Row Level Security.

## What Was Done

1. **Migration 023**: `backend/src/database/migrations/023_enable_row_level_security.sql`
   - Enables RLS on all 21 affected tables

2. **Migration 024**: `backend/src/database/migrations/024_fix_rls_policies_and_function_search_path.sql`
   - Drops overly permissive RLS policies (USING true) on citation_searches, humanize_usage, quiz_usage, quizzes, summarize_usage
   - Sets search_path on generate_friend_code, set_friend_code, update_updated_at_column

3. **Backend updated** to use `SUPABASE_SERVICE_ROLE_KEY`:
   - `backend/src/services/databaseService.js`
   - `backend/src/database/connection.js`
   - The service role bypasses RLS, so your backend continues to work normally

## Steps to Apply the Fix

### 1. Ensure `SUPABASE_SERVICE_ROLE_KEY` is set

In your backend `.env`:

```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

Get it from: **Supabase Dashboard → Settings → API → Service role key** (under "Project API keys").

⚠️ **Never** expose the service role key in frontend code or public repos.

### 2. Run the migrations in Supabase

1. Go to **Supabase Dashboard** → **SQL Editor**
2. **Migration 023** (if not already run): Copy `023_enable_row_level_security.sql` → New query → Run
3. **Migration 024** (fixes the 9 warnings): Copy `024_fix_rls_policies_and_function_search_path.sql` → New query → Run

### 3. Verify

1. In Supabase, go to **Database** → **Security Advisor**
2. Refresh the report — the 22 errors should be resolved
3. Restart your backend and test that signup, login, documents, quizzes, etc. still work

## Why This Works

- **Before**: RLS was disabled. Anyone with the anon key could access all data via PostgREST.
- **After**: RLS is enabled. With no permissive policies for `anon`/`authenticated`, direct API access returns no rows.
- **Backend**: Uses service role key, which bypasses RLS, so your API continues to function as before.
- **Result**: Direct database access is blocked; only your backend (with the service role) can read/write data.
