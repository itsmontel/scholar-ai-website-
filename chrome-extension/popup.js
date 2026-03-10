const SCHOLAR_BASE = 'https://writescholar.com';

function parseDomain(input) {
  if (!input || typeof input !== 'string') return null;
  const s = input.trim().toLowerCase();
  if (s.length < 4) return null;
  let host = s.replace(/^https?:\/\//, '').split('/')[0];
  const parts = host.split('.');
  if (parts.length >= 2) {
    host = parts.slice(-2).join('.');
  }
  return host;
}

function showToast(message, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}

// Fallback presets when API is unreachable
const PRESET_SITES = [
  { domain: 'youtube.com', label: 'YouTube' },
  { domain: 'tiktok.com', label: 'TikTok' },
  { domain: 'instagram.com', label: 'Instagram' },
  { domain: 'facebook.com', label: 'Facebook' },
  { domain: 'twitter.com', label: 'X (Twitter)' },
  { domain: 'reddit.com', label: 'Reddit' },
  { domain: 'netflix.com', label: 'Netflix' },
  { domain: 'twitch.tv', label: 'Twitch' },
  { domain: 'pinterest.com', label: 'Pinterest' },
  { domain: 'snapchat.com', label: 'Snapchat' }
];

document.addEventListener('DOMContentLoaded', async () => {
  const statusEl = document.getElementById('status');
  const loginBtn = document.getElementById('loginBtn');
  const sitesSection = document.getElementById('sitesSection');
  const sitesGrid = document.getElementById('sitesGrid');
  const customDomainInput = document.getElementById('customDomain');
  const addDomainBtn = document.getElementById('addDomainBtn');
  const actionsRow = document.getElementById('actionsRow');
  const planBadge = document.getElementById('planBadge');
  const accountBtn = document.getElementById('accountBtn');
  const syncBtn = document.getElementById('syncBtn');
  const unlockDurationSelect = document.getElementById('unlockDuration');
  const unlockTimer = document.getElementById('unlockTimer');
  const unlockTimerList = document.getElementById('unlockTimerList');

  // Trigger sync on popup open to get fresh plan/config from server
  const { authToken } = await chrome.storage.local.get('authToken');
  if (authToken) {
    await new Promise(resolve => chrome.runtime.sendMessage({ type: 'SYNC_CONFIG' }, resolve));
  }

  const { authToken: token, config, unlockDurationMs } = await chrome.storage.local.get(['authToken', 'config', 'unlockDurationMs']);
  let blocked = config?.blockedDomains || [];
  const plan = (config?.plan || 'free').toLowerCase();
  const isPaid = plan === 'pro' || plan === 'premium';
  
  // Load unlock duration preference (default: 30 minutes)
  const defaultDuration = 1800000; // 30 minutes
  if (unlockDurationMs) {
    unlockDurationSelect.value = unlockDurationMs.toString();
  } else {
    unlockDurationSelect.value = defaultDuration.toString();
  }
  
  // Save unlock duration when changed
  unlockDurationSelect.addEventListener('change', async () => {
    const duration = parseInt(unlockDurationSelect.value, 10);
    await chrome.storage.local.set({ unlockDurationMs: duration });
    showToast('Unlock duration saved');
  });

  // Format remaining time
  function formatRemainingTime(ms) {
    if (ms <= 0) return 'Expired';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  // Update unlock timer display
  function updateUnlockTimer() {
    chrome.storage.local.get('unlocks', ({ unlocks = {} }) => {
      const now = Date.now();
      const activeUnlocks = Object.entries(unlocks)
        .filter(([domain, expiresAt]) => expiresAt > now)
        .map(([domain, expiresAt]) => ({
          domain,
          expiresAt,
          remaining: expiresAt - now
        }))
        .sort((a, b) => a.expiresAt - b.expiresAt);

      if (activeUnlocks.length === 0) {
        unlockTimer.style.display = 'none';
        return;
      }

      unlockTimer.style.display = 'block';
      unlockTimerList.innerHTML = activeUnlocks.map(({ domain, remaining }) => {
        const formatted = formatRemainingTime(remaining);
        const isExpiringSoon = remaining < 5 * 60 * 1000; // Less than 5 minutes
        return `
          <div class="unlock-item">
            <span class="unlock-domain">${domain}</span>
            <span class="unlock-time ${isExpiringSoon ? 'expired' : ''}">${formatted}</span>
          </div>
        `;
      }).join('');
    });
  }

  // Update timer every second
  let timerInterval = null;
  function startTimer() {
    updateUnlockTimer();
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(updateUnlockTimer, 1000);
  }

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

  // Paid user: show sites to block directly in popup
  planBadge.textContent = plan === 'premium' ? 'Premium' : 'Pro';
  planBadge.style.display = 'inline-block';
  sitesSection.classList.add('visible');
  unlockDurationSelect.style.display = 'block';
  actionsRow.style.display = 'flex';
  accountBtn.onclick = () => chrome.tabs.create({ url: `${SCHOLAR_BASE}/account` });
  syncBtn.onclick = async () => {
    syncBtn.disabled = true;
    syncBtn.textContent = 'Syncing...';
    chrome.runtime.sendMessage({ type: 'SYNC_CONFIG' }, () => {
      syncBtn.disabled = false;
      syncBtn.textContent = 'Sync';
      window.close();
    });
  };
  
  // Start timer for paid users
  startTimer();

  const updateStatus = () => {
    if (blocked.length > 0) {
      statusEl.className = 'status active';
      statusEl.textContent = `Blocking ${blocked.length} site(s): ${blocked.slice(0, 3).join(', ')}${blocked.length > 3 ? '...' : ''}`;
    } else {
      statusEl.className = 'status inactive';
      statusEl.textContent = 'Tap a site below to block it.';
    }
  };

  const updateBlocked = (next, source) => {
    chrome.runtime.sendMessage({ type: 'UPDATE_BLOCKED_SITES', blockedDomains: next }, (r) => {
      if (r?.ok) {
        blocked = r.blockedDomains || next;
        renderSites();
        updateStatus();
        updateUnlockTimer(); // Refresh timer when sites change
        showToast(r.savedToServer ? 'Saved' : 'Saved locally (sync when online)');
      } else {
        showToast('Failed to save', 'error');
      }
      if (source) source.disabled = false;
    });
  };

  let presets = [];
  const allDomains = () => {
    const presetDomains = new Set(presets.map(p => p.domain));
    const custom = blocked.filter(d => !presetDomains.has(d));
    return [...presets, ...custom.map(d => ({ domain: d, label: d }))];
  };

  const renderSites = () => {
    sitesGrid.innerHTML = '';
    for (const p of allDomains()) {
      const btn = document.createElement('button');
      btn.className = 'site-btn' + (blocked.includes(p.domain) ? ' blocked' : '');
      btn.textContent = p.label;
      btn.onclick = () => {
        btn.disabled = true;
        const next = blocked.includes(p.domain)
          ? blocked.filter(d => d !== p.domain)
          : [...blocked, p.domain];
        updateBlocked(next, btn);
      };
      sitesGrid.appendChild(btn);
    }
  };

  addDomainBtn.onclick = () => {
    const domain = parseDomain(customDomainInput.value);
    if (!domain) {
      showToast('Enter a domain (e.g. youtube.com)', 'error');
      return;
    }
    if (blocked.includes(domain)) {
      showToast('Already blocked', 'error');
      return;
    }
    if (blocked.length >= 20) {
      showToast('Max 20 sites', 'error');
      return;
    }
    customDomainInput.value = '';
    addDomainBtn.disabled = true;
    updateBlocked([...blocked, domain], addDomainBtn);
  };

  customDomainInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addDomainBtn.click();
  });

  updateStatus();
  presets = [...PRESET_SITES];
  renderSites();
  chrome.runtime.sendMessage({ type: 'FETCH_PRESETS' }, (r) => {
    if (r?.presets?.length) presets = r.presets;
    renderSites();
  });

  // Clean up timer when popup closes
  window.addEventListener('beforeunload', () => {
    if (timerInterval) clearInterval(timerInterval);
  });
});
