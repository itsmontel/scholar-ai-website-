# Security Vulnerability Audit — WriteScholar

**Date:** March 2026  
**Scope:** Full codebase (frontend, backend, config, auth, data handling)  
**Last Updated:** March 2026 (all major security fixes applied)

---

## Executive summary

The application has **strong security**: authenticated API routes, rate limiting, CORS, Helmet, parameterized DB access, and JWT-based auth with httpOnly cookies. **All major security issues have been addressed.** No critical SQL injection or auth-bypass issues were found.

### Security improvements implemented:
- ✅ JWT tokens stored in httpOnly cookies (not accessible to JavaScript)
- ✅ OAuth callback uses URL fragment instead of query string
- ✅ Session and JWT secrets validated at startup in production
- ✅ Stripe webhook bypass removed
- ✅ XSS vulnerabilities fixed with HTML escaping
- ✅ Sensitive data logging reduced
- ✅ Error messages no longer expose internal details

---

## 1. Authentication & session

### 1.1 JWT in httpOnly cookies ✅ FIXED

- **Previous Finding:** Tokens were stored in `localStorage` (e.g. `authToken`, `user`).
- **Fix Applied:** JWT tokens are now stored in httpOnly cookies with `Secure` and `SameSite` attributes. Only user profile data (non-sensitive) is stored in localStorage for UI purposes. JavaScript cannot access the token.
- **Status:** ✅ RESOLVED

### 1.2 Token in URL (OAuth callback) ✅ FIXED

- **Previous Finding:** Google OAuth redirected to `/auth/callback?token=JWT&user=...`. Token appeared in the URL query string.
- **Fix Applied:** Token is now set as httpOnly cookie by the server. Only user data is passed in the URL fragment (`#user=...`), and the fragment is cleared immediately after reading with `history.replaceState`. Token never appears in URL, Referer headers, or browser history.
- **Status:** ✅ RESOLVED

### 1.3 Session secret default ✅ FIXED

- **Previous Finding:** `session({ secret: process.env.SESSION_SECRET || 'your-session-secret-key' })` used a default secret.
- **Fix Applied:** Server now validates required env vars (`SESSION_SECRET`, `JWT_SECRET`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`) at startup and exits if missing in production.
- **Status:** ✅ RESOLVED

### 1.4 JWT_SECRET not validated at startup ✅ FIXED

- **Previous Finding:** `process.env.JWT_SECRET` was used without validation.
- **Fix Applied:** Included in startup validation; server exits if missing in production.
- **Status:** ✅ RESOLVED

---

## 2. API & backend

### 2.1 Stripe webhook signature bypass ✅ FIXED

- **Previous Finding:** Webhook signature verification could be bypassed with `'fake_signature_for_testing'` string.
- **Fix Applied:** Bypass removed entirely. All webhooks now require valid Stripe signature verification.
- **Status:** ✅ RESOLVED

### 2.2 Sensitive data in logs ✅ FIXED

- **Previous Finding:** Verification tokens, query parameters, and user data were logged.
- **Fix Applied:** Token logging removed from auth routes. Database query logging now only shows query type in production, with truncated parameters in development.
- **Status:** ✅ RESOLVED

### 2.3 Error messages returned to client ✅ FIXED

- **Previous Finding:** Routes returned `error.message` to clients, potentially exposing internal details.
- **Fix Applied:** Routes in `documents.js` and `analysis.js` now return generic error messages. Internal error details are logged server-side only.
- **Status:** ✅ RESOLVED

### 2.4 Resource authorization (good)

- **Finding:** Quiz, analysis, document, and citation endpoints use `req.user.id` from the JWT and pass it to the service layer. No reliance on client-supplied user IDs for authorization.
- **Conclusion:** Resource-level authorization is correctly enforced.

### 2.5 SQL / NoSQL injection (good)

- **Finding:** Queries use parameterized patterns (Supabase `.eq()`, `.insert()`, etc., and raw SQL with `$1`, `$2` and params). No string concatenation of user input into SQL.
- **Conclusion:** No SQL injection vulnerability identified.

### 2.6 Rate limiting & CORS (good)

- **Finding:** `express-rate-limit` is used (general, auth, analysis, upload, email subscription). CORS is restricted by origin (env-driven in production). Helmet and body size limits are in place.
- **Conclusion:** Configuration is appropriate.

---

## 3. Frontend & XSS

### 3.1 dangerouslySetInnerHTML ✅ FIXED

- **Previous Finding:** Citation pages rendered user/API content with `dangerouslySetInnerHTML` without escaping.
- **Fix Applied:** Both `CitationResultsPage.tsx` and `CitationGeneratorToolPage.tsx` now use `escapeHtml()` to escape HTML before linkification or emphasis formatting, then render with `dangerouslySetInnerHTML`.
- **Status:** ✅ RESOLVED

### 3.2 User object in localStorage (low - acceptable)

- **Finding:** `user` is stored as JSON in localStorage and may include name, email, plan, etc.
- **Status:** Acceptable risk. Only non-sensitive profile data is stored. Token is in httpOnly cookie, not accessible to JavaScript.

---

## 4. Data & privacy

### 4.1 Pending actions in localStorage (low - acceptable)

- **Finding:** Landing page stores `pendingHumanize`, `pendingCitationSearch`, `pendingSummary`, `pendingStudyTool`, `pendingAnalysis` with user text so that after login the action can be retried.
- **Status:** Acceptable for UX. Content is cleared after use.

### 4.2 .env and secrets (good)

- **Finding:** `.env` and `backend/.env` are in `.gitignore`. No `.env` files were found in the repo. API keys and secrets are read from `process.env` / `import.meta.env`.
- **Conclusion:** No accidental commit of env files observed.

### 4.3 Seed / demo password (low)

- **Finding:** `backend/src/database/seed.js` contains a hardcoded demo password hash.
- **Recommendation:** Use seed only in development; ensure production DB is never seeded with default credentials.

---

## 5. Infrastructure & config

### 5.1 Content-Type enforcement (good)

- **Finding:** Security middleware requires `application/json` for POST/PUT/PATCH except for multipart upload paths. Webhook route uses `express.raw({ type: 'application/json' })` and is mounted before general JSON body parsing.
- **Conclusion:** No conflict; Stripe webhook receives raw body and verification can be done correctly.

### 5.2 Refresh token flow (good)

- **Finding:** `POST /api/auth/refresh` uses httpOnly cookie for authentication. Token is refreshed and new cookie is set by server.
- **Conclusion:** Secure design; token never exposed to JavaScript.

### 5.3 Cookie security (good)

- **Finding:** Auth cookies use:
  - `httpOnly: true` - JavaScript cannot access
  - `secure: true` in production - HTTPS only
  - `sameSite: 'strict'` in production - CSRF protection
  - `maxAge: 30 days` - Reasonable session length
- **Conclusion:** Cookie configuration follows best practices.

---

## 6. Checklist of recommended actions

| Priority | Action | Status |
|----------|--------|--------|
| High | Remove Stripe webhook signature bypass | ✅ Done |
| High | Require `SESSION_SECRET` and `JWT_SECRET` in production | ✅ Done |
| High | Move JWT to httpOnly cookies | ✅ Done |
| Medium | Stop logging verification/reset tokens | ✅ Done |
| Medium | Fix XSS: escape HTML before `dangerouslySetInnerHTML` | ✅ Done |
| Medium | Move token out of OAuth callback URL | ✅ Done |
| Medium | Return generic error messages in production | ✅ Done |
| Low | Ensure production logs never contain sensitive URLs | ✅ Done |

---

## 7. Summary

All major security vulnerabilities have been addressed:

- **Authentication:** JWT tokens in httpOnly cookies; OAuth callback secure; secrets validated at startup
- **Backend:** No SQL injection; webhook bypass removed; error messages sanitized; logging reduced
- **Frontend:** XSS vulnerabilities fixed with HTML escaping
- **Data:** Env and secrets handling is good; no sensitive data exposed

The application now follows security best practices for web authentication and data handling.
