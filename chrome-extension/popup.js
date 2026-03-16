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

function escapeHtml(str) {
  if (str == null || typeof str !== 'string') return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function showToast(message, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}

async function saveSettingsToServer(updates) {
  const { authToken, config } = await chrome.storage.local.get(['authToken', 'config']);
  if (!authToken) return false;
  const apiBase = await new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'GET_API_BASE' }, (r) => resolve(r?.apiBase || 'https://api.writescholar.com/api'));
  });
  try {
    const body = {
      blockedDomains: config?.blockedDomains || [],
      question_count: updates.question_count ?? config?.question_count ?? 5,
      pass_threshold: updates.pass_threshold ?? config?.pass_threshold ?? 4,
      unlock_duration_ms: updates.unlock_duration_ms ?? parseInt(document.getElementById('unlockDuration')?.value || '1800000', 10)
    };
    const res = await fetch(`${apiBase}/focus-mode/settings`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (data.success && data.data) {
      const newConfig = { ...config, ...data.data, blockedDomains: data.data.blockedDomains };
      await chrome.storage.local.set({ config: newConfig });
      return true;
    }
  } catch (e) {
    console.error('saveSettingsToServer:', e);
  }
  return false;
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
  { domain: 'discord.com', label: 'Discord' }
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

  // Quiz settings from config (synced from server) or defaults
  let questionCount = config?.question_count ?? 5;
  let passThreshold = config?.pass_threshold ?? 4;
  
  // Unlock duration: prefer local (user's last selection), then server config, then default
  const defaultDuration = 1800000; // 30 minutes
  const serverUnlockMs = config?.unlock_duration_ms;
  const effectiveUnlockMs = unlockDurationMs ?? serverUnlockMs ?? defaultDuration;
  const optionExists = Array.from(unlockDurationSelect.options).some(o => o.value === effectiveUnlockMs.toString());
  unlockDurationSelect.value = optionExists ? effectiveUnlockMs.toString() : defaultDuration.toString();
  if (!unlockDurationMs && serverUnlockMs) {
    await chrome.storage.local.set({ unlockDurationMs: serverUnlockMs });
  }
  
  // Save unlock duration when changed (persist locally first, then sync to server)
  unlockDurationSelect.addEventListener('change', async () => {
    const duration = parseInt(unlockDurationSelect.value, 10);
    await chrome.storage.local.set({ unlockDurationMs: duration });
    const ok = await saveSettingsToServer({ unlock_duration_ms: duration });
    if (ok) {
      showToast('Unlock duration saved');
    } else {
      showToast('Saved locally; sync when online', 'error');
    }
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
            <span class="unlock-domain">${escapeHtml(domain)}</span>
            <span class="unlock-time ${isExpiringSoon ? 'expired' : ''}">${escapeHtml(formatted)}</span>
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

  // Free: 3 sites. Pro: 20 sites. Premium: unlimited (99999). Use API value when available.
  const maxBlocked = config?.maxSites ?? (isPaid ? (plan === 'premium' ? 99999 : 10) : 1);

  planBadge.textContent = isPaid ? (plan === 'premium' ? 'Premium' : 'Pro') : 'Free';
  planBadge.style.display = 'inline-block';
  sitesSection.classList.add('visible');
  unlockDurationSelect.style.display = 'block';
  actionsRow.style.display = 'flex';

  // Quiz customization UI - free and paid users can customize questions and unlock duration
  const quizSettings = document.getElementById('quizSettings');
  const passThresholdSelect = document.getElementById('passThreshold');
  const subtitleEl = document.querySelector('#subtitle');
  const quizCountBtns = document.querySelectorAll('.quiz-count-btn');
  quizSettings.style.display = 'block';

  function updateSubtitle() {
    if (subtitleEl) {
      const limitText = maxBlocked >= 99999 ? 'sites (unlimited)' : `${maxBlocked} site${maxBlocked > 1 ? 's' : ''}`;
      const base = `Block ${limitText} until you answer ${questionCount} study questions (get ${passThreshold}+ correct).`;
      subtitleEl.textContent = isPaid ? base : `${base} Upgrade for more sites.`;
    }
  }
  updateSubtitle();

  function renderPassThresholdOptions() {
    passThresholdSelect.innerHTML = '';
    for (let i = 1; i <= questionCount; i++) {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = `${i} of ${questionCount} correct`;
      if (i === passThreshold) opt.selected = true;
      passThresholdSelect.appendChild(opt);
    }
  }

  function setQuestionCountUI(val) {
    questionCount = val;
    if (passThreshold > questionCount) passThreshold = questionCount;
    quizCountBtns.forEach((btn) => {
      btn.classList.toggle('active', parseInt(btn.dataset.val, 10) === questionCount);
    });
    renderPassThresholdOptions();
    updateSubtitle();
  }

  function setPassThresholdUI(val) {
    passThreshold = Math.min(questionCount, Math.max(1, val));
    renderPassThresholdOptions();
    updateSubtitle();
  }

  setQuestionCountUI(questionCount);

  quizCountBtns.forEach((btn) => {
    btn.onclick = async () => {
      const val = parseInt(btn.dataset.val, 10);
      setQuestionCountUI(val);
      const ok = await saveSettingsToServer({ question_count: val, pass_threshold: passThreshold });
      showToast(ok ? 'Saved' : 'Sync when online to save', ok ? 'success' : 'error');
    };
  });

  passThresholdSelect.addEventListener('change', async () => {
    const val = parseInt(passThresholdSelect.value, 10);
    setPassThresholdUI(val);
    const ok = await saveSettingsToServer({ pass_threshold: val });
    showToast(ok ? 'Saved' : 'Sync when online to save', ok ? 'success' : 'error');
  });
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
        const isRemoving = blocked.includes(p.domain);
        const next = isRemoving
          ? blocked.filter(d => d !== p.domain)
          : [...blocked, p.domain];
        if (!isRemoving && next.length > maxBlocked) {
          showToast(maxBlocked <= 3 ? `Free plan: block up to ${maxBlocked} sites. Upgrade for more.` : `Max ${maxBlocked} sites`, 'error');
          btn.disabled = false;
          return;
        }
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
    if (blocked.length >= maxBlocked) {
      showToast(maxBlocked <= 3 ? `Free plan: block up to ${maxBlocked} sites. Upgrade for more.` : `Max ${maxBlocked} sites`, 'error');
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
