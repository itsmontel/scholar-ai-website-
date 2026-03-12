# Chrome Extension Security Audit

**Extension:** WriteScholar Focus Mode  
**Date:** 2025  
**Manifest:** v3  

---

## Summary

| Severity | Count |
|----------|-------|
| High     | 0 (after fixes) |
| Medium   | 0 (after fixes) |
| Low      | 2 (addressed)  |
| Info     | 2 |

---

## Findings

### 1. [FIXED] Open Redirect via postMessage (Medium)

**Location:** `content.js` – `handleUnlockRequest()` → `window.location.replace(redirect)`

**Issue:** The `redirect` URL is passed from `postMessage`, `CustomEvent`, or DOM and used directly without validation. A compromised page (e.g. XSS on writescholar.com) could redirect users to a malicious site after they pass the quiz.

**Fix:** Validate that `redirect` matches the expected pattern: `https://` + validated site hostname only. Reject any redirect that does not match.

---

### 2. [FIXED] Potential XSS in popup unlock timer (Low)

**Location:** `popup.js` – `unlockTimerList.innerHTML = activeUnlocks.map(...)`

**Issue:** The `domain` value is interpolated into HTML. Although domains are normalized when stored, a malformed or future source could inject HTML/script.

**Fix:** Escape domain before inserting: replace `<`, `>`, `&`, `"` with HTML entities.

---

### 3. [INFO] Broad host permission `<all_urls>`

**Location:** `manifest.json`

**Note:** Required for `declarativeNetRequest` to block arbitrary sites. The extension only performs redirects to writescholar.com, not arbitrary fetches. Acceptable for stated functionality.

---

### 4. [INFO] Console logging in production

**Location:** `background.js`, `content.js`

**Note:** Multiple `console.log` statements. No sensitive data (tokens) are logged. Consider removing or gating behind a debug flag for production to reduce noise.

---

## Positive Practices

- ✅ Auth token stored in `chrome.storage.local` (not localStorage)
- ✅ API calls use Bearer token, no token in URLs
- ✅ Domain normalization limits to 20, trims, lowercases, extracts root
- ✅ `Array.isArray` validation for `UPDATE_BLOCKED_SITES`
- ✅ Content script restricted to writescholar.com and localhost
- ✅ No `eval()`, `new Function()`, or `document.write`
- ✅ Manifest v3 (service worker, declarativeNetRequest)

---

## Recommendations

1. **Content Security Policy:** Manifest v3 enforces a strict CSP; ensure no inline scripts in popup.
2. **Updates:** Keep dependencies (e.g. Google Fonts) and review new permissions on updates.
3. **Token handling:** Consider short-lived tokens or refresh flow if backend supports it.
