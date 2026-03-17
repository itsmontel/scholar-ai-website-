# Security Audit: RLS, Subscription & Rate Limit Isolation

**Audit Date:** March 16, 2025  
**Scope:** Row Level Security (RLS), subscription status vs. rate limit table separation, premium escalation prevention

---

## Executive Summary

Your setup is **reasonably secure** for preventing users from granting themselves premium or bypassing rate limits. Subscription and rate limit data are on separate tables, RLS is enabled on critical tables, and the backend uses the service role to bypass RLS. A few minor hardening recommendations are included.

---

## 1. Subscription vs. Rate Limits: Table Separation ✅

**Status: Secure**

Subscription and rate limit data are stored in separate tables:

| Data Type | Table(s) | Contents |
|-----------|----------|----------|
| **Subscription status** | `users` (denormalized), `subscriptions` | `subscription_plan`, `subscription_status`, Stripe IDs, billing period |
| **Rate limits / usage** | `usage_tracking`, `quiz_usage`, `trial_usage`, `humanize_usage`, `summarize_usage`, `citation_searches` | Credits, generations used, words used, etc. |

They are not mixed on the same table, so a user could not change both subscription and rate limits in a single row update.

---

## 2. Row Level Security (RLS) Status ✅

**Migrations 023 & 024:** RLS is enabled on all sensitive tables and overly permissive policies have been removed.

### Tables with RLS Enabled (023)
- `users`, `subscriptions`, `documents`, `document_analyses`, `usage_tracking`
- `api_keys`, `notifications`, `email_subscriptions`, `newsletter_subscriptions`
- `quizzes`, `quiz_usage`, `friends`, `friend_share_requests`, `blocked_users`
- `user_achievements`, `user_login_dates`, `study_events`, `trial_usage`
- `lesson_plans`, `lesson_usage`, `focus_mode_settings`

### Tables Not in 023 (created separately with RLS)
- `citation_searches` (008) – permissive policy dropped in 024
- `humanize_usage` (humanize_usage_table.sql) – permissive policy dropped in 024
- `summarize_usage` – permissive policy dropped in 024

### RLS Effect
- With RLS on and no permissive policies:
  - Direct PostgREST access via the **anon key** is denied.
- Backend uses **SUPABASE_SERVICE_ROLE_KEY**, which **bypasses RLS**, so the API works normally.

### Tables with User-Scoped Policies (Auth-Based)
- `document_analyses`: `auth.uid() = user_id` for SELECT, INSERT, UPDATE, DELETE (user-owned content)
- `humanize_usage`: `auth.uid() = user_id` for SELECT only (INSERT/UPDATE/DELETE blocked)

Neither of these tables stores subscription or rate limit data; they contain user content or usage records.

---

## 3. Who Can Update Subscription Status?

| Update Path | Who | Verification |
|-------------|-----|---------------|
| **Stripe Webhooks** | Stripe → your backend | Signature verification (`verifyWebhookSignature`) |
| **Change Plan** | User via `/api/subscriptions/change-plan` | Must have active Stripe subscription; plan is updated only after Stripe API succeeds |
| **Cancel** | User via `/api/subscriptions/cancel` | Downgrades to free, cannot upgrade |
| **Profile Update** | User via `PUT /api/users/profile` | Whitelist: `firstName`, `lastName`, `name`, `institution`, `researchField` – **no subscription fields** |
| **Create Checkout** | User | Only creates Stripe session; does not set premium in DB |

**Finding:** No user-facing endpoint updates `subscription_plan` or `subscription_status` in `users` based on arbitrary user input. Profile validation uses `allowUnknown: false` and a fixed schema, so extra fields are rejected.

---

## 4. Architecture: No Direct Supabase Access from Frontend ✅

- The frontend does **not** use `createClient` or the Supabase client.
- All data access goes through the backend API with JWT auth.
- Even with the anon key exposed, direct Supabase access would hit RLS and get no data or writes.

---

## 5. Recommendations

### 5.1 Ensure Service Role Key in Production

**File:** `backend/src/database/connection.js` (line 8)

```javascript
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
```

If `SUPABASE_SERVICE_ROLE_KEY` is unset, the backend falls back to the anon key and would be subject to RLS (and likely fail for writes). Ensure the service role key is always set in production and never committed.

### 5.2 Optional: Add RLS for `humanize_usage` and `citation_searches` to Migration 023

023 does not explicitly enable RLS on `humanize_usage`, `citation_searches`, or `summarize_usage`; they get it from their own creation scripts. If you consolidate migrations, consider adding these tables to 023 so RLS is clearly documented in one place. Functionally, RLS is already enabled on them.

### 5.3 Optional: Remove Denormalized Subscription from `users`

Currently `users.subscription_plan` and `users.subscription_status` are denormalized for speed. The canonical source of truth is `subscriptions` + Stripe. You could:

- Keep them for performance, but always treat Stripe + `subscriptions` as authoritative when checking entitlements.
- Or move fully to `subscriptions` + Stripe and remove these columns.

Your `getUserSubscriptionDetails` already reads from `users`, and Stripe is used as the authority for paid plans, so this is an optimization/cleanup choice rather than a security fix.

### 5.4 Verify Migrations 023 and 024 Have Been Run

In Supabase: **Database → Security Advisor** – confirm there are no remaining “RLS disabled” or “Policy Always True” warnings. Follow `RLS_SECURITY_FIX.md` if anything is missing.

---

## 6. Summary Checklist

| Check | Status |
|-------|--------|
| Subscription & rate limits on separate tables | ✅ |
| RLS enabled on sensitive tables | ✅ |
| Permissive policies (USING true) removed | ✅ |
| Backend uses service role key | ✅ |
| No profile update path for subscription fields | ✅ |
| Webhooks verify Stripe signature | ✅ |
| Frontend does not access Supabase directly | ✅ |
| Subscription updates gated by Stripe success | ✅ |

---

## Conclusion

The current design is sound: subscription and rate limit data are isolated, RLS is enabled and locked down, and subscription updates are driven only by Stripe and backend logic. Users cannot upgrade themselves to premium through the APIs reviewed in this audit.
