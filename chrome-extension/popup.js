const SCHOLAR_BASE = 'https://writescholar.com';

document.addEventListener('DOMContentLoaded', async () => {
  const statusEl = document.getElementById('status');
  const loginBtn = document.getElementById('loginBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const syncBtn = document.getElementById('syncBtn');

  // Trigger sync on popup open to get fresh plan/config from server
  const { authToken } = await chrome.storage.local.get('authToken');
  if (authToken) {
    await new Promise(resolve => chrome.runtime.sendMessage({ type: 'SYNC_CONFIG' }, resolve));
  }

  const { authToken: token, config } = await chrome.storage.local.get(['authToken', 'config']);
  const blocked = config?.blockedDomains || [];
  const enabled = config?.enabled && blocked.length > 0;
  const plan = (config?.plan || 'free').toLowerCase();
  const isPaid = plan === 'pro' || plan === 'premium';

  if (!token) {
    statusEl.className = 'status error';
    statusEl.textContent = 'Not logged in. Log in at WriteScholar to enable.';
    loginBtn.style.display = 'block';
    loginBtn.onclick = () => chrome.tabs.create({ url: `${SCHOLAR_BASE}/login` });
    return;
  }

  if (!isPaid) {
    statusEl.className = 'status inactive';
    statusEl.textContent = 'Focus Mode requires Pro or Premium. Upgrade to use.';
    loginBtn.textContent = 'Upgrade Plan';
    loginBtn.style.display = 'block';
    loginBtn.onclick = () => chrome.tabs.create({ url: `${SCHOLAR_BASE}/pricing` });
    return;
  }

  if (!enabled) {
    statusEl.className = 'status inactive';
    statusEl.textContent = 'No sites blocked. Add sites in Account to enable.';
    settingsBtn.style.display = 'block';
    settingsBtn.onclick = () => chrome.tabs.create({ url: `${SCHOLAR_BASE}/account` });
    return;
  }

  statusEl.className = 'status active';
  statusEl.textContent = `Blocking ${blocked.length} site(s): ${blocked.slice(0, 3).join(', ')}${blocked.length > 3 ? '...' : ''}`;
  settingsBtn.style.display = 'block';
  syncBtn.style.display = 'block';
  settingsBtn.onclick = () => chrome.tabs.create({ url: `${SCHOLAR_BASE}/account` });
  syncBtn.onclick = async () => {
    syncBtn.disabled = true;
    syncBtn.textContent = 'Syncing...';
    chrome.runtime.sendMessage({ type: 'SYNC_CONFIG' }, () => {
      syncBtn.disabled = false;
      syncBtn.textContent = 'Sync';
      window.close();
    });
  };
});
