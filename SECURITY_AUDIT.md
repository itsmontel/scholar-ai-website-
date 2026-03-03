# Security Vulnerability Audit — WriteScholar

**Date:** March 2026  
**Scope:** Full codebase (frontend, backend, config, auth, data handling)

---

## Executive summary

The application has **solid baseline security**: authenticated API routes, rate limiting, CORS, Helmet, parameterized DB access, and JWT-based auth. Several issues should be fixed to reduce risk of data leakage, token exposure, and abuse. **No critical SQL injection or auth-bypass issues** were found; the main improvements are around token handling, logging, XSS, and production hardening.

---

## 1. Authentication & session

### 1.1 JWT in localStorage (medium – accepted risk)

- **Finding:** Tokens are stored in `localStorage` (e.g. `authToken`, `user`).
- **Risk:** XSS can read `localStorage` and steal the token; tokens are not httpOnly.
- **Mitigation in place:** No use of `dangerouslySetInnerHTML` with raw user input except in two controlled cases (see XSS section). React’s default escaping limits XSS.
- **Recommendation:** Document this as an accepted risk, or move to httpOnly cookies + CSRF for higher security. Ensure no sensitive data is stored in `user` beyond what’s needed for UI.

### 1.2 Token in URL (OAuth callback) (medium)

- **Finding:** Google OAuth redirects to `/auth/callback?token=JWT&user=...`. Token and user data appear in the URL.
- **Risk:** URL can leak via Referer, browser history, logs, or shared screens.
- **Location:** `backend/src/routes/auth.js` (Google callback), `AuthCallbackPage.tsx`.
- **Recommendation:** Prefer returning the token in the fragment (`#token=...`) or a one-time code exchanged server-side for a token, so the token never appears in the URL. Short term: redirect immediately after reading the token and replace the URL with `history.replaceState` (no token in path).

### 1.3 Session secret default (high in production)

- **Finding:** `session({ secret: process.env.SESSION_SECRET || 'your-session-secret-key' })` in `backend/src/server.js`.
- **Risk:** If `SESSION_SECRET` is not set in production, a fixed secret is used and session cookies could be forged.
- **Recommendation:** Require `SESSION_SECRET` in production (fail startup if missing when `NODE_ENV === 'production'`).

### 1.4 JWT_SECRET not validated at startup

- **Finding:** `process.env.JWT_SECRET` is used in `auth.js` and `middleware/auth.js` with no check that it is set.
- **Risk:** If unset, `jwt.sign`/`jwt.verify` can throw or behave unpredictably; in some setups weak/empty secrets could be used.
- **Recommendation:** Validate required env vars (including `JWT_SECRET`) at server startup and exit if missing in production.

---

## 2. API & backend

### 2.1 Stripe webhook signature bypass (high)

- **Finding:** In `backend/src/routes/webhooks.js`, when the Stripe signature header contains `'fake_signature_for_testing'`, signature verification is skipped and the event is parsed from the body.
- **Risk:** In production, anyone who knows or guesses this string could send fake webhook events and potentially alter subscription state.
- **Recommendation:** Remove this bypass entirely, or guard it with `process.env.NODE_ENV === 'development'` and a separate dev-only secret (e.g. `process.env.WEBHOOK_TEST_SECRET`). Never allow bypass in production.

### 2.2 Sensitive data in logs (medium)

- **Finding:**
  - `backend/src/routes/auth.js`: `console.log('Verification attempt with token:', token)` and `'No user found with token:', token` — logs verification tokens.
  - `backend/src/services/emailService.js`: logs verification and password-reset tokens in dev (e.g. `Token: ${verificationToken}`).
  - `backend/src/database/databaseService.js`: `console.log('Executing query:', { sql, params })` — logs every query and parameters (can include emails, tokens, IDs).
  - `backend/src/database/connection.js`: `console.log('SUPABASE_URL:', process.env.SUPABASE_URL)` — may log URLs that contain sensitive info depending on setup.
- **Risk:** If logs are captured (e.g. third-party logging, shared servers), tokens and PII can leak.
- **Recommendation:** Never log raw tokens or passwords. Log query only in development; in production log at most table name and operation. Restrict token/verification logs to development and redact in production.

### 2.3 Error messages returned to client (low–medium)

- **Finding:** Some routes return `error.message` to the client regardless of environment, e.g. in `documents.js`, parts of `analysis.js`, `emailSubscriptions.js`, `emailService.js`.
- **Risk:** Internal or third-party error messages can reveal paths, DB details, or implementation details.
- **Recommendation:** In production, return a generic message (e.g. “An error occurred”) and log the full error server-side. Use the existing pattern: `error: process.env.NODE_ENV === 'development' ? error.message : undefined`.

### 2.4 Resource authorization (good)

- **Finding:** Quiz, analysis, document, and citation endpoints use `req.user.id` from the JWT and pass it to the service layer (e.g. `getQuizById(userId, id)`, `deleteQuiz(userId, id)`). No reliance on client-supplied user IDs for authorization.
- **Conclusion:** Resource-level authorization is correctly enforced.

### 2.5 SQL / NoSQL injection (good)

- **Finding:** Queries use parameterized patterns (Supabase `.eq()`, `.insert()`, etc., and raw SQL with `$1`, `$2` and params). No string concatenation of user input into SQL.
- **Conclusion:** No SQL injection vulnerability identified.

### 2.6 Rate limiting & CORS (good)

- **Finding:** `express-rate-limit` is used (general, auth, analysis, upload, email subscription). CORS is restricted by origin (env-driven in production). Helmet and body size limits are in place.
- **Conclusion:** Configuration is appropriate; ensure production env (e.g. `CORS_ORIGIN`, `FRONTEND_URL`) is set correctly.

---

## 3. Frontend & XSS

### 3.1 dangerouslySetInnerHTML (medium)

- **Finding 1 – CitationResultsPage.tsx:** `makeLinksClickable(citation.citation)` wraps URLs in `<a>` tags then renders with `dangerouslySetInnerHTML`. The citation text itself is not escaped. If the API (or a compromised response) ever returns HTML/script in `citation`, it would execute.
- **Finding 2 – CitationGeneratorToolPage.tsx:** `citation.replace(/\*([^*]+)\*/g, '<em>$1</em>')` is rendered with `dangerouslySetInnerHTML`. Again, if `citation` contains HTML (e.g. `*<img src=x onerror=alert(1)>*`), it can lead to XSS.
- **Risk:** Stored XSS if citation content is ever user-influenced or if the API is compromised.
- **Recommendation:** Always escape HTML before linkification or emphasis. For example: escape `&`, `<`, `>`, `"`, `'` (e.g. with a small `escapeHtml(str)`), then apply `makeLinksClickable` or the `*...*` → `<em>` replacement, then use `dangerouslySetInnerHTML`. Prefer a small, well-tested sanitizer (e.g. DOMPurify) if you need to allow a limited set of tags.

### 3.2 User object in localStorage (low)

- **Finding:** `user` is stored as JSON in localStorage and may include name, email, plan, etc.
- **Risk:** XSS could read it; same origin can already access it.
- **Recommendation:** Keep only necessary fields for UI; ensure no passwords or tokens are stored in `user`. Rely on the same XSS mitigations as above.

---

## 4. Data & privacy

### 4.1 Pending actions in localStorage (low)

- **Finding:** Landing page stores `pendingHumanize`, `pendingCitationSearch`, `pendingSummary`, `pendingStudyTool`, `pendingAnalysis` with user text so that after login the action can be retried.
- **Risk:** Sensitive content in localStorage can be read by same-origin scripts or via physical access.
- **Recommendation:** Acceptable for UX; consider clearing these after successful use and avoiding storage of very long or highly sensitive content if possible.

### 4.2 .env and secrets (good)

- **Finding:** `.env` and `backend/.env` are in `.gitignore`. No `.env` files were found in the repo. API keys and secrets are read from `process.env` / `import.meta.env`.
- **Conclusion:** No accidental commit of env files observed; ensure production secrets are set in the host environment and never committed.

### 4.3 Seed / demo password (low)

- **Finding:** `backend/src/database/seed.js` (or similar) contains a hardcoded demo password hash.
- **Risk:** If seed is run in production or the hash is reused, accounts could be guessable.
- **Recommendation:** Use seed only in development; ensure production DB is never seeded with default credentials. If you ship a “demo” account, force password change on first login.

---

## 5. Infrastructure & config

### 5.1 Content-Type enforcement

- **Finding:** Security middleware requires `application/json` for POST/PUT/PATCH except for multipart upload paths. Webhook route uses `express.raw({ type: 'application/json' })` and is mounted before general JSON body parsing.
- **Conclusion:** No conflict; Stripe webhook receives raw body and verification can be done correctly.

### 5.2 Refresh token flow

- **Finding:** `POST /api/auth/refresh` is protected with `authenticateToken`, so the current JWT must be valid (not expired). Expired tokens get 401.
- **Conclusion:** Design choice; frontend should refresh before expiry or handle 401 and redirect to login. No vulnerability identified.

---

## 6. Checklist of recommended actions

| Priority | Action |
|----------|--------|
| High    | Remove or strictly gate Stripe webhook signature bypass (e.g. dev-only + secret). |
| High    | Require `SESSION_SECRET` and `JWT_SECRET` in production; fail startup if missing. |
| Medium  | Stop logging verification/reset tokens; restrict DB query logging to dev or redact. |
| Medium  | Fix XSS: escape HTML before any `dangerouslySetInnerHTML` (citations + linkification). |
| Medium  | Avoid token in URL for OAuth callback (fragment or one-time code). |
| Low     | Return generic error messages in production; use `error.message` only in development. |
| Low     | Ensure production logs never contain SUPABASE_URL if it is sensitive. |

---

## 7. Summary

- **Authentication:** JWT + resource checks are correct; main improvements are token-in-URL, session/JWT secret enforcement, and logging.
- **Backend:** No SQL injection or missing auth on protected routes; fix webhook bypass and logging.
- **Frontend:** Two XSS risks via `dangerouslySetInnerHTML`; add escaping/sanitization before rendering.
- **Data:** Env and secrets handling is good; reduce what is logged and what is returned in errors.

Addressing the high and medium items will materially reduce risk of token leakage, subscription tampering, and XSS. If you want, I can suggest concrete code changes (patches) for any of these items.
