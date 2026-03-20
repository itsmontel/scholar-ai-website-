# Focus Mode Sync Audit: Extension vs Website

## Summary

The Focus Mode logic is **largely correct and in sync** between the extension and website. A few minor issues were found and fixed.

---

## What's Aligned ✓

### Plan limits
- **Backend:** Free=3 sites, Pro=20, Premium/focus=99999
- **Extension:** Uses `config.maxSites` from `/focus-mode/config`
- **Website:** Uses `maxSites` from `/focus-mode/settings`

### API endpoints
| Action | Extension | Website |
|--------|-----------|---------|
| Get settings | `/focus-mode/config` | `/focus-mode/settings` |
| Update sites | `/focus-mode/blocked-sites` PUT | `/focus-mode/settings` PUT |
| Update full settings | `/focus-mode/settings` PUT (popup) | `/focus-mode/settings` PUT |
| Presets | `/focus-mode/presets` | `/focus-mode/presets` |
| Unlock quiz | N/A (page fetches) | `/focus-mode/unlock-quiz` |

### Domain normalization
All three use the same logic: lowercase, trim, strip protocol, take base domain (last 2 parts of host).

### Domain settings
- **block** – full block, redirect to unlock quiz
- **daily_limit** – allow X minutes/day (Pro+), then redirect
- `dailyLimitMinutes` clamped to 15–480 on backend

### Preset sites
Identical list: YouTube, TikTok, Instagram, Facebook, X, Reddit, Netflix, Twitch, Pinterest, Discord.

### Unlock flow
1. User visits blocked site → extension redirects to `writescholar.com/unlock-quiz?site=X&redirect=Y`
2. UnlockQuizPage loads, fetches quiz from API
3. User passes → content script receives unlock request → sends `UNLOCK_SITE` to background
4. Background stores unlock with expiry, syncs rules, content script redirects

---

## Issues Found & Fixed

### 1. Unlock duration not syncing from website to extension (FIXED)
**Problem:** In `background.js` fetchConfig, `unlockDurationMs` was only set when `existing == null`. If the user changed unlock duration on the website, the extension kept the old value.

**Fix:** Always sync `unlock_duration_ms` from config to `unlockDurationMs` when the server returns it.

### 2. Website missing 5-minute unlock option (MINOR)
**Problem:** Backend and extension support 5 minutes; website `FocusModeSettingsSection` only has 15 min as the shortest option.

**Status:** Left as-is (15 min minimum on website is reasonable). Can add 5 min if desired.

---

## Data Flow

```
Website (FocusModeSettingsSection)     Extension (popup)
         |                                      |
         v                                      v
    PUT /focus-mode/settings              PUT /focus-mode/settings
    PUT /focus-mode/settings              PUT /focus-mode/blocked-sites
         |                                      |
         v                                      v
    Supabase focus_mode_settings  <----->  chrome.storage.local (config)
         ^                                      ^
         |                                      |
    GET /focus-mode/config  <-------------  syncFromServer (every 5 min)
```

---

## Auth & Token Sync

- Content script runs on `writescholar.com` and `localhost:5173`
- On load, it reads `localStorage.authToken` and sends `AUTH_TOKEN` to background
- Background fetches `/focus-mode/config` with the token
- Token is also synced on visibility change and `writescholar-auth-changed` event
