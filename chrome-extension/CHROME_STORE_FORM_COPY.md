# Chrome Web Store Dashboard – Form Copy

Use this copy when filling out the extension listing in the Chrome Web Store developer dashboard. Updated to match Focus Mode (puzzle + study quiz) and avoid brand names.

---

## Single purpose (180/1,000 chars)

```
Blocks distracting websites until the user unlocks access by solving a short puzzle (Sudoku, Memory, or Pattern) or passing a study quiz from their own WriteScholar notes. Users choose which sites to block and earn access—no scroll until you've studied. Single purpose: focus and productivity.
```

---

## Permission justification

### storage
```
Stores the user's blocked site list, auth token, and settings (question count, pass threshold, unlock duration) locally. Required so the extension remembers preferences and blocked domains between sessions.
```

### declarativeNetRequest (first)
```
Redirects requests to blocked websites to the WriteScholar unlock page. Users must solve a puzzle or pass a study quiz before the site loads. Used only for URLs matching the user's configured blocked domains.
```

### declarativeNetRequestWithHostAccess (second)
```
Same as declarativeNetRequest. Required because the redirect targets vary by user. The extension only redirects domains the user has explicitly chosen to block.
```

### alarms
```
Runs a periodic check (every 15 seconds) to detect when unlock timers expire, and a sync check (every 5 minutes) to keep blocked sites in sync with the user's WriteScholar account. Required so the extension redirects tabs when time runs out without keeping the service worker running constantly.
```

### tabs
```
Used to detect when the user is on a blocked website whose unlock timer has expired, and redirect that tab to the unlock page. When the unlock duration ends, the extension checks open tabs and redirects only tabs on blocked domains so the block applies immediately without a page refresh. Without this permission, users would need to refresh to be blocked again after their earned time runs out.
```

### host permission
```
Required for: (1) writescholar.com—API calls for config, blocked sites, and auth; (2) <all_urls>—to intercept navigation to user-configured blocked domains and redirect to the unlock page. No page content is read or modified; the extension only redirects matching requests.
```

---

## Data usage

- **Authentication information:** Checked (correct—login token for WriteScholar)
- **All certification checkboxes:** Keep checked

---

## Privacy policy

- **URL:** https://writescholar.com/privacy

---

## Summary of changes

| Field | What changed |
|-------|--------------|
| Single purpose | Added puzzle option (Sudoku, Memory, Pattern); removed "YouTube, TikTok"; added tagline |
| declarativeNetRequest | "study quiz" → "solve a puzzle or pass a study quiz"; removed site examples |
| declarativeNetRequestWithHostAccess | Removed "youtube.com, reddit.com" |
| alarms | Added "15 seconds" unlock check; clarified sync |
| tabs | Shortened slightly; "unlock quiz" → "unlock page" |
| host permission | "youtube.com, reddit.com" → "user-configured blocked domains" |
