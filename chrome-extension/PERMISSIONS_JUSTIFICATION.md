# Chrome Web Store – Permission Justifications

Use these when filling out the **Permissions justification** section in the Chrome Web Store dashboard.

---

## tabs

**Used to detect when the user is on a blocked website whose unlock timer has expired, and redirect that tab to the unlock page.** When the unlock duration ends, the extension checks open tabs and redirects only tabs on blocked domains so the block applies immediately without a page refresh. Without this permission, users would need to refresh to be blocked again after their earned time runs out.

---

## storage

Stores user preferences (blocked sites, unlock duration, quiz settings), auth token for API calls, and unlock state. All data stays local to the user's device.

---

## declarativeNetRequest / declarativeNetRequestWithHostAccess

Used to redirect requests to blocked websites to the WriteScholar unlock page. Users must solve a puzzle or pass a study quiz before the site loads. No request modification—only redirects to writescholar.com. The extension only redirects domains the user has explicitly chosen to block.

---

## alarms

Runs a periodic check (every 15 seconds) to detect when unlock timers expire, and a sync check (every 5 minutes) to keep blocked sites in sync with the user's account. Required so the extension can redirect tabs when time runs out without keeping the service worker running constantly.

---

## host_permissions: `<all_urls>`

Required for `declarativeNetRequest` to block user-configured websites. The extension only redirects blocked domains to writescholar.com—it does not fetch or read content from other sites.

---

## host_permissions: writescholar.com, api

Used to fetch user config (blocked sites, plan) from the WriteScholar API and to sync settings. The extension also loads from the website to receive the auth token when the user logs in.
