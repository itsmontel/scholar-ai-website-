# WriteScholar Security Audit Report

**Date:** March 2026  
**Scope:** Full-stack application (React/Vite frontend, Node/Express backend, Supabase)

---

## Executive Summary

The application has a solid security foundation (Helmet, rate limiting, JWT auth, bcrypt, input validation) but several issues require attention. **3 critical** and **5 high** priority findings were identified.

---

## Critical Findings

### 1. Stripe Webhook Signature Bypass (CRITICAL)

**Location:** `backend/src/routes/webhooks.js` (lines 26-28)

**Issue:** A test bypass allows unverified webhooks when the signature contains `'fake_signature_for_testing'`. An attacker could forge Stripe events (e.g., grant premium access) by sending requests with this string in the header.

**Fix:** Remove the bypass entirely. Use Stripe CLI or test mode for local development instead.

```javascript
// REMOVE this block:
if (signature && signature.includes('fake_signature_for_testing')) {
  console.log('🔥 WEBHOOK: Bypassing signature verification for testing');
  event = JSON.parse(payload);
} else {
```

---

### 2. Session Secret Fallback (CRITICAL)

**Location:** `backend/src/server.js` (line 58)

**Issue:** Falls back to hardcoded `'your-session-secret-key'` if `SESSION_SECRET` is not set. In production, this could allow session hijacking.

**Fix:** Fail fast if `SESSION_SECRET` is missing in production:

```javascript
secret: process.env.SESSION_SECRET || (process.env.NODE_ENV === 'production' ? (() => { throw new Error('SESSION_SECRET required'); })() : 'dev-secret'),
```

---

### 3. XSS via dangerouslySetInnerHTML (CRITICAL)

**Locations:**
- `src/components/pages/CitationResultsPage.tsx` (line 294)
- `src/components/pages/tools/CitationGeneratorToolPage.tsx` (line 1238)

**Issue:** User-controlled content is rendered with `dangerouslySetInnerHTML` without sanitization. Citation text from the API or user input could contain `<script>`, `<img onerror>`, or other XSS payloads.

**CitationResultsPage:** `makeLinksClickable()` only wraps URLs in `<a>` tags but does not sanitize the rest of the string.

**CitationGeneratorToolPage:** `citation.replace(/\*([^*]+)\*/g, '<em>$1</em>')` passes through any other HTML.

**Fix:** Sanitize with DOMPurify before rendering:

```javascript
import DOMPurify from 'dompurify';

// CitationResultsPage
__html: DOMPurify.sanitize(makeLinksClickable(citation.citation), { ADD_ATTR: ['target', 'rel'] })

// CitationGeneratorToolPage  
__html: DOMPurify.sanitize(citation.replace(/\*([^*]+)\*/g, '<em>$1</em>'))
```

---

## High Priority Findings

### 4. Sensitive Data in Logs (HIGH)

**Locations:**
- `backend/src/services/databaseService.js` (line 23): Logs full SQL and params on every query
- `backend/src/database/connection.js` (lines 8-9): Logs `SUPABASE_URL` on startup

**Issue:** Production logs could expose passwords, tokens, PII, and database structure.

**Fix:** Remove or guard with `NODE_ENV !== 'production'`. Never log `SUPABASE_URL` or query params in production.

---

### 5. Vulnerable Dependencies (HIGH)

**npm audit** reported multiple vulnerabilities:

| Package | Severity | Issue |
|---------|----------|-------|
| jspdf | Critical | PDF injection, LFI, DoS |
| dompurify | Moderate | XSS (CVE) |
| basic-ftp | Critical | Path traversal |
| rollup | High | Arbitrary file write |
| minimatch | High | ReDoS |

**Fix:** Run `npm audit fix` and `npm audit fix --force` (for breaking changes). Update jspdf to 4.2.0+ and dompurify to latest patched version.

---

### 6. Auth Rate Limit in Development (MEDIUM)

**Location:** `backend/src/middleware/rateLimiting.js` (line 4-5)

**Issue:** Rate limiting is **fully disabled** when `NODE_ENV === 'development'`. If dev is ever exposed or misconfigured, brute-force attacks would be possible.

**Fix:** Consider a higher limit instead of full skip, or use a separate env flag for "no rate limit."

---

### 7. Verification Token in Registration Response (MEDIUM)

**Location:** `backend/src/routes/auth.js` (line 118)

**Issue:** In development, `verificationToken` is returned in the API response. If a dev build is ever deployed, this could allow account takeover.

**Fix:** Never return verification tokens in API responses. Use email-only verification flow.

---

### 8. Content Security Policy (MEDIUM)

**Location:** `backend/src/middleware/security.js`

**Issue:** `connectSrc: ["'self'"]` may block API calls if frontend and backend are on different origins (e.g., `app.writescholar.com` vs `api.writescholar.com`).

**Fix:** Add API origin to CSP in production:
```javascript
connectSrc: ["'self'", process.env.FRONTEND_URL || "https://writescholar.com", process.env.API_URL || "https://api.writescholar.com"]
```

---

## Positive Findings

- **Authentication:** JWT with `authenticateToken`, bcrypt (12 rounds), proper token refresh
- **Input validation:** Joi schemas for register, login, change-password
- **Rate limiting:** General, auth, analysis, upload, email subscription limiters
- **Security headers:** Helmet with CSP, HPP, XSS-clean, mongo-sanitize
- **Request size limit:** 50MB max, content-type validation for JSON
- **Database:** Supabase/parameterized queries via databaseService (no raw SQL concatenation)
- **CORS:** Configured with credentials, origin whitelist
- **No .env in git:** Secrets not committed

---

## Recommendations Summary

| Priority | Action |
|----------|--------|
| P0 | Remove Stripe webhook bypass |
| P0 | Sanitize all dangerouslySetInnerHTML with DOMPurify |
| P0 | Require SESSION_SECRET in production |
| P1 | Remove/disable SQL and URL logging in production |
| P1 | Run `npm audit fix` and update vulnerable packages |
| P2 | Review CSP connectSrc for multi-origin setup |
| P2 | Remove verification token from registration response |

---

## Estimated Remediation Time

- **Critical fixes:** 1–2 hours
- **High priority:** 2–3 hours  
- **Full remediation:** 4–6 hours
