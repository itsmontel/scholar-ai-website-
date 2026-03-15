/**
 * WriteScholar Focus Mode - Background Service Worker
 * Blocks configured sites and redirects to unlock quiz. Syncs with WriteScholar API.
 */

const RULE_ID_BASE = 1000;
const BLOCK_ALL_SENTINEL = '__ALL__';
const UNLOCK_DURATION_MS_DEFAULT = 30 * 60 * 1000; // 30 minutes default
const SCHOLAR_BASE = 'https://writescholar.com';
const API_BASE_FALLBACK = 'https://api.writescholar.com/api';

async function getUnlockDuration() {
  const { unlockDurationMs } = await chrome.storage.local.get('unlockDurationMs');
  return unlockDurationMs || UNLOCK_DURATION_MS_DEFAULT;
}

function getScholarBase() {
  return SCHOLAR_BASE;
}

async function getApiBase() {
  const { apiBase } = await chrome.storage.local.get('apiBase');
  if (apiBase) return apiBase;
  try {
    const res = await fetch(`${SCHOLAR_BASE}/api-config.json`);
    if (res.ok) {
      const cfg = await res.json();
      const url = cfg?.apiUrl?.replace(/\/$/, '');
      if (url) {
        await chrome.storage.local.set({ apiBase: url });
        return url;
      }
    }
  } catch (_e) {}
  return API_BASE_FALLBACK;
}

async function getStoredConfig() {
  const { config } = await chrome.storage.local.get('config');
  return config || { blockedDomains: [], plan: 'free', enabled: false };
}

async function getUnlocks() {
  const { unlocks } = await chrome.storage.local.get('unlocks');
  return unlocks || {};
}

async function setUnlock(domain, expiresAt) {
  console.log('[WriteScholar BG] setUnlock called for domain:', domain, 'expiresAt:', expiresAt);
  const unlocks = await getUnlocks();
  unlocks[domain] = expiresAt;
  await chrome.storage.local.set({ unlocks });
  console.log('[WriteScholar BG] Unlock saved. All unlocks now:', unlocks);
}

async function removeUnlock(domain) {
  const unlocks = await getUnlocks();
  delete unlocks[domain];
  await chrome.storage.local.set({ unlocks });
}

function domainToRuleId(domain, idx) {
  return RULE_ID_BASE + idx;
}

function normalizeDomains(domains) {
  return [...new Set(
    domains
      .slice(0, 500)
      .map(d => String(d).trim())
      .filter(d => d.length > 0)
      .map(d => {
        if (d === BLOCK_ALL_SENTINEL) return d;
        const lower = d.toLowerCase();
        const parts = lower.replace(/^https?:\/\//, '').split('/')[0].split('.');
        if (parts.length >= 2) {
          return parts.slice(-2).join('.');
        }
        return lower;
      })
  )];
}

async function syncRules() {
  console.log('[WriteScholar BG] syncRules called');
  const config = await getStoredConfig();
  const unlocks = await getUnlocks();
  const now = Date.now();
  const blocked = config.blockedDomains || [];
  
  console.log('[WriteScholar BG] Config blockedDomains:', blocked);
  console.log('[WriteScholar BG] Current unlocks:', unlocks);

  const isBlockAll = blocked.includes(BLOCK_ALL_SENTINEL);
  const allUnlocked = unlocks[BLOCK_ALL_SENTINEL] && unlocks[BLOCK_ALL_SENTINEL] > now;
  const toBlock = isBlockAll
    ? (allUnlocked ? [] : [BLOCK_ALL_SENTINEL])
    : blocked.filter((d) => d !== BLOCK_ALL_SENTINEL && (!unlocks[d] || unlocks[d] < now));
  
  console.log('[WriteScholar BG] toBlock (after unlock filter):', toBlock);

  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  const removeIds = existing.map((r) => r.id);

  if (toBlock.length === 0) {
    console.log('[WriteScholar BG] No domains to block, clearing all rules');
    if (removeIds.length > 0) {
      await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: removeIds });
    }
    console.log('[WriteScholar BG] Rules cleared');
    return;
  }

  const base = getScholarBase();
  let rules = [];

  if (toBlock.includes(BLOCK_ALL_SENTINEL)) {
    rules.push({
      id: RULE_ID_BASE,
      priority: 1,
      action: {
        type: 'redirect',
        redirect: {
          regexSubstitution: `${base}/unlock-quiz?mode=all&site=${BLOCK_ALL_SENTINEL}#\\0`,
        },
      },
      condition: {
        regexFilter: '^https?://(?!([^/]*\\.)?writescholar\\.com)(?!localhost)[^\\s]+$',
        resourceTypes: ['main_frame'],
      },
    });
  } else {
    rules = toBlock.map((domain, idx) => ({
      id: domainToRuleId(domain, idx),
      priority: 1,
      action: {
        type: 'redirect',
        redirect: {
          url: `${base}/unlock-quiz?site=${encodeURIComponent(domain)}&redirect=${encodeURIComponent(`https://${domain}`)}`,
        },
      },
      condition: {
        urlFilter: `||${domain}`,
        resourceTypes: ['main_frame'],
      },
    }));
  }

  console.log('[WriteScholar BG] Removing old rules:', removeIds);
  console.log('[WriteScholar BG] Adding new rules:', rules.length);
  
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: removeIds,
    addRules: rules,
  });
  
  console.log('[WriteScholar BG] Rules updated successfully');
}

async function fetchConfig(token) {
  if (!token) return null;
  const apiBase = await getApiBase();
  try {
    const res = await fetch(`${apiBase}/focus-mode/config`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
      console.error('Focus mode: API returned non-JSON (', ct?.slice(0, 30), '). Ensure backend is at', apiBase);
      return null;
    }
    const data = await res.json();
    if (data.success && data.data) {
      const cfg = data.data;
      const { unlockDurationMs: existing } = await chrome.storage.local.get('unlockDurationMs');
      if (cfg.unlock_duration_ms && existing == null) {
        await chrome.storage.local.set({ unlockDurationMs: cfg.unlock_duration_ms });
      }
      return cfg;
    }
  } catch (e) {
    console.error('Focus mode fetch config:', e);
  }
  return null;
}

async function syncFromServer() {
  const { authToken } = await chrome.storage.local.get('authToken');
  const config = await fetchConfig(authToken);
  if (config) {
    await chrome.storage.local.set({ config });
    await syncRules();
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  await syncRules();
  await checkUnlockExpiryAndRedirect();
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log('[WriteScholar BG] Message received:', msg.type, 'from:', sender?.url);
  
  if (msg.type === 'AUTH_TOKEN') {
    const updates = { authToken: msg.token };
    if (msg.apiBase) updates.apiBase = msg.apiBase;
    chrome.storage.local.set(updates, () => {
      console.log('[WriteScholar BG] AUTH_TOKEN stored');
      syncFromServer().then(() => sendResponse({ ok: true }));
    });
    return true;
  }
  if (msg.type === 'UNLOCK_SITE') {
    const { site, redirect } = msg;
    console.log('[WriteScholar BG] UNLOCK_SITE request. site:', site, 'redirect:', redirect);
    if (!site) {
      console.warn('[WriteScholar BG] No site provided');
      sendResponse({ ok: false });
      return true;
    }
    getUnlockDuration().then((duration) => {
      const expiresAt = Date.now() + duration;
      const durationHours = (duration / (60 * 60 * 1000)).toFixed(1);
      console.log('[WriteScholar BG] Setting unlock for', site, 'duration:', durationHours, 'hours, expires:', new Date(expiresAt).toISOString());
      return setUnlock(site, expiresAt)
        .then(() => {
          console.log('[WriteScholar BG] Unlock stored, syncing rules...');
          return syncRules();
        })
        .then(() => {
          console.log('[WriteScholar BG] Rules synced, sending ok response');
          sendResponse({ ok: true });
        })
        .catch((e) => {
          console.error('[WriteScholar BG] Unlock site failed:', e);
          sendResponse({ ok: false });
        });
    });
    return true;
  }
  if (msg.type === 'SYNC_CONFIG') {
    syncFromServer().then(() => sendResponse({ ok: true }));
    return true;
  }
  if (msg.type === 'GET_API_BASE') {
    getApiBase().then(apiBase => sendResponse({ apiBase }));
    return true;
  }
  if (msg.type === 'FETCH_PRESETS') {
    getApiBase().then(async (apiBase) => {
      try {
        const res = await fetch(`${apiBase}/focus-mode/presets`);
        const data = await res.json();
        sendResponse({ ok: true, presets: data?.data || [] });
      } catch (e) {
        sendResponse({ ok: false, presets: [] });
      }
    });
    return true;
  }
  if (msg.type === 'UPDATE_BLOCKED_SITES') {
    const { blockedDomains } = msg;
    if (!Array.isArray(blockedDomains)) {
      sendResponse({ ok: false, error: 'Invalid input' });
      return true;
    }
    const normalized = normalizeDomains(blockedDomains);
    (async () => {
      let replied = false;
      const reply = (r) => {
        if (!replied) {
          replied = true;
          sendResponse(r);
        }
      };
      try {
        const apiBase = await getApiBase();
        const { authToken } = await chrome.storage.local.get('authToken');
        if (authToken) {
          const res = await fetch(`${apiBase}/focus-mode/blocked-sites`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ blockedDomains: normalized }),
          });
          const ct = res.headers.get('content-type') || '';
          if (ct.includes('application/json')) {
            const data = await res.json();
            if (data.success) {
              const serverDomains = data.data?.blockedDomains || normalized;
              const config = await getStoredConfig();
              await chrome.storage.local.set({
                config: {
                  ...config,
                  blockedDomains: serverDomains,
                  plan: config.plan || 'free',
                  enabled: serverDomains.length > 0
                }
              });
              await syncRules();
              reply({ ok: true, blockedDomains: serverDomains, savedToServer: true });
              return;
            }
          }
        }
      } catch (e) {
        console.error('Focus mode API update failed:', e);
      }
      const config = await getStoredConfig();
      await chrome.storage.local.set({
        config: {
          ...config,
          blockedDomains: normalized,
          enabled: normalized.length > 0
        }
      });
      await syncRules();
      reply({ ok: true, blockedDomains: normalized, savedToServer: false });
    })();
    return true;
  }
});

/** Check interval for unlock expiry (ms) */
const UNLOCK_EXPIRY_CHECK_MS = 15000;

function isTabOnBlockedDomain(tabUrl, blockedDomains) {
  if (!tabUrl || !blockedDomains.length) return false;
  if (blockedDomains.includes(BLOCK_ALL_SENTINEL)) {
    try {
      const host = new URL(tabUrl).hostname.toLowerCase();
      return !host.endsWith('writescholar.com') && !host.includes('localhost');
    } catch (_) {
      return false;
    }
  }
  try {
    const host = new URL(tabUrl).hostname.toLowerCase();
    return blockedDomains.some((d) => d !== BLOCK_ALL_SENTINEL && (host === d || host.endsWith('.' + d)));
  } catch (_) {
    return false;
  }
}

/**
 * Check for expired unlocks, sync rules, and redirect only tabs on blocked domains that expired.
 * Called every 15s so when timer hits zero, user gets blocked immediately (no refresh needed).
 */
async function checkUnlockExpiryAndRedirect() {
  const config = await getStoredConfig();
  const unlocks = await getUnlocks();
  const now = Date.now();
  const blocked = config.blockedDomains || [];

  const hasBlockAll = blocked.includes(BLOCK_ALL_SENTINEL);
  const allExpired = hasBlockAll && (!unlocks[BLOCK_ALL_SENTINEL] || unlocks[BLOCK_ALL_SENTINEL] < now);
  const expiredDomains = hasBlockAll
    ? (allExpired ? [BLOCK_ALL_SENTINEL] : [])
    : blocked.filter((d) => d !== BLOCK_ALL_SENTINEL && unlocks[d] && unlocks[d] < now);
  if (expiredDomains.length === 0) return;

  console.log('[WriteScholar BG] Unlock(s) expired for:', expiredDomains);
  await syncRules();

  const base = getScholarBase();
  for (const domain of expiredDomains) {
    try {
      let tabs;
      if (domain === BLOCK_ALL_SENTINEL) {
        tabs = await chrome.tabs.query({ url: ['http://*/*', 'https://*/*'] });
      } else {
        tabs = await chrome.tabs.query({ url: [`*://*.${domain}/*`, `*://${domain}/*`] });
      }
      for (const tab of tabs) {
        if (!tab.id || !tab.url || tab.url.includes('/unlock-quiz')) continue;
        if (!isTabOnBlockedDomain(tab.url, blocked)) continue;
        const redirectUrl = domain === BLOCK_ALL_SENTINEL
          ? `${base}/unlock-quiz?mode=all&site=${BLOCK_ALL_SENTINEL}#${encodeURIComponent(tab.url)}`
          : `${base}/unlock-quiz?site=${encodeURIComponent(domain)}&redirect=${encodeURIComponent(`https://${domain}`)}`;
        await chrome.tabs.update(tab.id, { url: redirectUrl });
        console.log('[WriteScholar BG] Redirected tab', tab.id, 'to unlock quiz (unlock expired)');
      }
    } catch (e) {
      console.error('[WriteScholar BG] Failed to redirect tabs for', domain, e);
    }
  }
}

function scheduleUnlockExpiryCheck() {
  chrome.alarms.create('unlockExpiryCheck', { when: Date.now() + UNLOCK_EXPIRY_CHECK_MS });
}

chrome.alarms.create('focusModeSync', { periodInMinutes: 5 });
scheduleUnlockExpiryCheck();
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'focusModeSync') {
    syncFromServer();
  } else if (alarm.name === 'unlockExpiryCheck') {
    checkUnlockExpiryAndRedirect().then(scheduleUnlockExpiryCheck);
  }
});
