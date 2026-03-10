/**
 * WriteScholar Focus Mode - Background Service Worker
 * Blocks configured sites and redirects to unlock quiz. Syncs with WriteScholar API.
 */

const RULE_ID_BASE = 1000;
const UNLOCK_DURATION_MS = 60 * 60 * 1000; // 1 hour
const SCHOLAR_BASE = 'https://writescholar.com';
const API_BASE = 'https://writescholar.com/api';

function getScholarBase() {
  return SCHOLAR_BASE;
}

function getApiBase() {
  return API_BASE;
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
  try {
    const res = await fetch(`${getApiBase()}/focus-mode/config`, {
      headers: { Authorization: `Bearer ${token}` },
    });
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
    chrome.storage.local.set({ authToken: msg.token }, () => {
      syncFromServer().then(() => sendResponse({ ok: true }));
    });
    return true;
  }
  if (msg.type === 'UNLOCK_SITE') {
    const { site, redirect } = msg;
    if (!site) {
      sendResponse({ ok: false });
      return;
    }
    const expiresAt = Date.now() + UNLOCK_DURATION_MS;
    setUnlock(site, expiresAt).then(() => {
      syncRules().then(() => sendResponse({ ok: true }));
    });
    return true;
  }
  if (msg.type === 'SYNC_CONFIG') {
    syncFromServer().then(() => sendResponse({ ok: true }));
    return true;
  }
});

chrome.alarms.create('focusModeSync', { periodInMinutes: 5 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'focusModeSync') {
    syncFromServer();
  }
});
