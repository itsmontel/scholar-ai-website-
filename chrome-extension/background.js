/**
 * WriteScholar Focus Mode - Background Service Worker
 * Blocks configured sites and redirects to unlock quiz. Syncs with WriteScholar API.
 */

const RULE_ID_BASE = 1000;
const UNLOCK_DURATION_MS = 60 * 60 * 1000; // 1 hour
const SCHOLAR_BASE = 'https://writescholar.com';
const API_BASE_FALLBACK = 'https://api.writescholar.com/api';

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
  const unlocks = await getUnlocks();
  unlocks[domain] = expiresAt;
  await chrome.storage.local.set({ unlocks });
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
      .slice(0, 20)
      .map(d => String(d).toLowerCase().trim())
      .filter(d => d.length > 0)
      .map(d => {
        const parts = d.replace(/^https?:\/\//, '').split('/')[0].split('.');
        if (parts.length >= 2) {
          return parts.slice(-2).join('.');
        }
        return d;
      })
  )];
}

async function syncRules() {
  const config = await getStoredConfig();
  const unlocks = await getUnlocks();
  const now = Date.now();

  const toBlock = (config.blockedDomains || []).filter(
    (d) => !unlocks[d] || unlocks[d] < now
  );

  if (toBlock.length === 0) {
    await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: [] });
    const existing = await chrome.declarativeNetRequest.getDynamicRules();
    if (existing.length > 0) {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: existing.map((r) => r.id),
      });
    }
    return;
  }

  const base = getScholarBase();
  const rules = toBlock.map((domain, idx) => ({
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

  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  const removeIds = existing.map((r) => r.id);
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: removeIds,
    addRules: rules,
  });
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
      return data.data;
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
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'AUTH_TOKEN') {
    const updates = { authToken: msg.token };
    if (msg.apiBase) updates.apiBase = msg.apiBase;
    chrome.storage.local.set(updates, () => {
      syncFromServer().then(() => sendResponse({ ok: true }));
    });
    return true;
  }
  if (msg.type === 'UNLOCK_SITE') {
    const { site, redirect } = msg;
    if (!site) {
      sendResponse({ ok: false });
      return true;
    }
    const expiresAt = Date.now() + UNLOCK_DURATION_MS;
    setUnlock(site, expiresAt)
      .then(() => syncRules())
      .then(() => sendResponse({ ok: true }))
      .catch((e) => {
        console.error('Unlock site failed:', e);
        sendResponse({ ok: false });
      });
    return true;
  }
  if (msg.type === 'SYNC_CONFIG') {
    syncFromServer().then(() => sendResponse({ ok: true }));
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

chrome.alarms.create('focusModeSync', { periodInMinutes: 5 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'focusModeSync') {
    syncFromServer();
  }
});
