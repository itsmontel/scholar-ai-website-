const SCHOLAR_BASE = 'https://writescholar.com';

function parseDomain(input) {
  if (!input || typeof input !== 'string') return null;
  const s = input.trim().toLowerCase();
  if (s.length < 4) return null;
  let host = s.replace(/^https?:\/\//, '').split('/')[0];
  const parts = host.split('.');
  if (parts.length >= 2) host = parts.slice(-2).join('.');
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
  setTimeout(() => {
    el.style.animation = 'toastOut 0.2s ease forwards';
    setTimeout(() => el.remove(), 200);
  }, 2400);
}

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

const DAILY_LIMIT_OPTIONS = [
  { value: 'block', label: 'Block' },
  { value: 15, label: '15 min/day' },
  { value: 30, label: '30 min/day' },
  { value: 60, label: '1 hr/day' },
  { value: 90, label: '90 min/day' },
  { value: 120, label: '2 hr/day' },
  { value: 180, label: '3 hr/day' },
  { value: 240, label: '4 hr/day' }
];

async function saveSettingsToServer(updates) {
  const { authToken, config } = await chrome.storage.local.get(['authToken', 'config']);
  if (!authToken) return false;
  const apiBase = await new Promise((r) => chrome.runtime.sendMessage({ type: 'GET_API_BASE' }, (res) => r(res?.apiBase || 'https://api.writescholar.com/api')));
  try {
    const unlockEl = document.getElementById('unlockDuration');
    const body = {
      blockedDomains: config?.blockedDomains || [],
      domainSettings: config?.domainSettings || {},
      question_count: updates.question_count ?? config?.question_count ?? 5,
      pass_threshold: updates.pass_threshold ?? config?.pass_threshold ?? 4,
      unlock_duration_ms: updates.unlock_duration_ms ?? parseInt(unlockEl?.value || '1800000', 10)
    };
    const res = await fetch(`${apiBase}/focus-mode/settings`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (data.success && data.data) {
      await chrome.storage.local.set({
        config: { ...config, ...data.data, blockedDomains: data.data.blockedDomains, domainSettings: data.data.domainSettings || {} }
      });
      return true;
    }
  } catch (e) {
    console.error('saveSettingsToServer:', e);
  }
  return false;
}

document.addEventListener('DOMContentLoaded', async () => {
  const statusEl = document.getElementById('status');
  const sitesSection = document.getElementById('sitesSection');
  const sitesGrid = document.getElementById('sitesGrid');
  const customDomainInput = document.getElementById('customDomain');
  const addDomainBtn = document.getElementById('addDomainBtn');
  const actionsRow = document.getElementById('actionsRow');
  const planBadge = document.getElementById('planBadge');
  const signOutBtn = document.getElementById('signOutBtn');
  const upgradeBtn = document.getElementById('upgradeBtn');
  const syncBtn = document.getElementById('syncBtn');
  const unlockTimer = document.getElementById('unlockTimer');
  const unlockTimerList = document.getElementById('unlockTimerList');
  const toggleSwitch = document.getElementById('toggleSwitch');
  const openSettingsBtn = document.getElementById('openSettingsBtn');

  const { authToken } = await chrome.storage.local.get('authToken');
  if (authToken) {
    await new Promise((r) => chrome.runtime.sendMessage({ type: 'SYNC_CONFIG' }, r));
  }

  const { authToken: token, config, extensionEnabled, unlockDurationMs, dailyUsage, userEmail } = await chrome.storage.local.get(['authToken', 'config', 'extensionEnabled', 'unlockDurationMs', 'dailyUsage', 'userEmail']);
  const isEnabled = extensionEnabled !== false;
  let blocked = config?.blockedDomains || [];
  let domainSettings = config?.domainSettings || {};
  const usageData = dailyUsage || {};
  const plan = (config?.plan || 'free').toLowerCase();
  const isPaid = plan === 'pro' || plan === 'premium' || plan === 'focus';
  const maxBlocked = config?.maxSites ?? (isPaid ? 99999 : 3);

  function setToggleUI(enabled) {
    if (toggleSwitch) toggleSwitch.classList.toggle('on', enabled);
  }

  function applyExtensionEnabledState(enabled) {
    const disabled = !enabled;
    if (sitesSection.classList.contains('visible')) {
      sitesSection.classList.toggle('disabled', disabled);
      sitesSection.querySelectorAll('button, input').forEach((el) => { el.disabled = disabled; });
      if (statusEl) {
        statusEl.textContent = disabled ? 'Extension is off. Turn it on above.' : (blocked.length > 0 ? `Blocking ${blocked.length} site(s)` : 'Add sites below or open Settings to configure.');
        statusEl.className = disabled ? 'status inactive' : (blocked.length > 0 ? 'status active' : 'status inactive');
      }
    }
  }

  if (!token) {
    statusEl.className = 'status inactive';
    statusEl.textContent = 'Not logged in. Create a free account to use the extension.';
    const loggedOutSection = document.getElementById('loggedOutSection');
    const googleBtn = document.getElementById('googleBtn');
    const signUpBtn = document.getElementById('signUpBtn');
    loggedOutSection.style.display = 'block';
    sitesSection.style.display = 'none';

    setToggleUI(isEnabled);
    toggleSwitch.onclick = async () => {
      const next = !toggleSwitch.classList.contains('on');
      await chrome.storage.local.set({ extensionEnabled: next });
      setToggleUI(next);
      chrome.runtime.sendMessage({ type: 'SYNC_RULES' }, () => {});
    };

    signUpBtn.onclick = () => chrome.tabs.create({ url: `${SCHOLAR_BASE}/signup` });

    const loggedOutButtons = document.getElementById('loggedOutButtons');
    const inlineLoginForm = document.getElementById('inlineLoginForm');
    const loginEmail = document.getElementById('loginEmail');
    const loginPassword = document.getElementById('loginPassword');
    const loginError = document.getElementById('loginError');
    const loginSubmitBtn = document.getElementById('loginSubmitBtn');
    const loginBackBtn = document.getElementById('loginBackBtn');

    loginBtn.onclick = () => {
      loggedOutButtons.style.display = 'none';
      googleBtn.style.display = 'none';
      inlineLoginForm.style.display = 'block';
      loginEmail.value = '';
      loginPassword.value = '';
      loginError.style.display = 'none';
    };

    loginBackBtn.onclick = () => {
      inlineLoginForm.style.display = 'none';
      loggedOutButtons.style.display = 'flex';
      googleBtn.style.display = 'flex';
    };

    loginSubmitBtn.onclick = async () => {
      const email = loginEmail.value.trim();
      const password = loginPassword.value;
      if (!email || !password) {
        loginError.textContent = 'Enter email and password';
        loginError.style.display = 'block';
        return;
      }
      loginError.style.display = 'none';
      loginSubmitBtn.disabled = true;
      loginSubmitBtn.textContent = 'Logging in...';
      try {
        const apiBase = await new Promise((r) => chrome.runtime.sendMessage({ type: 'GET_API_BASE' }, (res) => r(res?.apiBase || 'https://api.writescholar.com/api')));
        const res = await fetch(`${apiBase.replace(/\/$/, '')}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (data.success && data.data?.token) {
          const email = data.data.user?.email;
          await chrome.storage.local.set({ authToken: data.data.token, ...(email && { userEmail: email }) });
          chrome.runtime.sendMessage({ type: 'AUTH_TOKEN', token: data.data.token }, () => {
            showToast('Logged in!');
            location.reload();
          });
        } else {
          loginError.textContent = data.message || 'Login failed. Please try again.';
          loginError.style.display = 'block';
        }
      } catch (e) {
        loginError.textContent = 'Connection error. Please try again.';
        loginError.style.display = 'block';
      }
      loginSubmitBtn.disabled = false;
      loginSubmitBtn.textContent = 'Log in';
    };

    [loginEmail, loginPassword].forEach((el) => {
      el.addEventListener('keydown', (e) => { if (e.key === 'Enter') loginSubmitBtn.click(); });
    });

    googleBtn.onclick = async () => {
      const apiBase = await new Promise((r) => chrome.runtime.sendMessage({ type: 'GET_API_BASE' }, (res) => r(res?.apiBase || 'https://api.writescholar.com/api')));
      chrome.tabs.create({ url: `${apiBase.replace(/\/$/, '')}/auth/google` });
      showToast('Complete sign in in the new tab.');
    };
    return;
  }

  planBadge.textContent = isPaid ? (plan === 'premium' ? 'Premium' : 'Pro') : 'Free';
  planBadge.style.display = 'inline-block';
  sitesSection.classList.add('visible');
  actionsRow.style.display = 'flex';

  const userEmailEl = document.getElementById('userEmail');
  const showUserEmail = async (email) => {
    if (!userEmailEl) return;
    if (email) {
      userEmailEl.textContent = `Logged in as ${email}`;
      userEmailEl.style.display = 'block';
    } else {
      userEmailEl.style.display = 'none';
    }
  };
  if (userEmail) {
    showUserEmail(userEmail);
  } else {
    (async () => {
      try {
        const apiBase = await new Promise((r) => chrome.runtime.sendMessage({ type: 'GET_API_BASE' }, (res) => r(res?.apiBase || 'https://api.writescholar.com/api')));
        const res = await fetch(`${apiBase.replace(/\/$/, '')}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && data.data?.user?.email) {
          const email = data.data.user.email;
          await chrome.storage.local.set({ userEmail: email });
          showUserEmail(email);
        }
      } catch (_e) {}
    })();
  }

  setToggleUI(isEnabled);
  applyExtensionEnabledState(isEnabled);
  toggleSwitch.onclick = async () => {
    const next = !toggleSwitch.classList.contains('on');
    await chrome.storage.local.set({ extensionEnabled: next });
    setToggleUI(next);
    chrome.runtime.sendMessage({ type: 'SYNC_RULES' }, () => {});
    applyExtensionEnabledState(next);
  };

  const mainView = document.getElementById('mainView');
  const settingsView = document.getElementById('settingsView');

  openSettingsBtn.onclick = () => {
    mainView.style.display = 'none';
    settingsView.style.display = 'block';
    initSettingsView();
  };

  document.getElementById('backBtn').onclick = () => {
    settingsView.style.display = 'none';
    mainView.style.display = 'block';
    renderSites();
    updateStatus();
  };

  const FREE_UNLOCK_MS = 1800000; // 30 minutes
  const FREE_QUESTION_COUNT = 5;
  const FREE_PASS_THRESHOLD = 4;

  function initSettingsView() {
    const settingsUpgradeLink = document.getElementById('settingsUpgradeLink');
    if (settingsUpgradeLink) settingsUpgradeLink.style.display = isPaid ? 'none' : 'inline-block';

    const unlockDurationSelect = document.getElementById('unlockDuration');
    let effectiveUnlockMs = unlockDurationMs ?? config?.unlock_duration_ms ?? 1800000;
    if (!isPaid) {
      effectiveUnlockMs = FREE_UNLOCK_MS;
      // Force free users to 30 min; update if different
      if (unlockDurationMs !== FREE_UNLOCK_MS || (config?.unlock_duration_ms && config.unlock_duration_ms !== FREE_UNLOCK_MS)) {
        chrome.storage.local.set({ unlockDurationMs: FREE_UNLOCK_MS });
        saveSettingsToServer({ unlock_duration_ms: FREE_UNLOCK_MS });
      }
    }
    // Lock non-30-min options for free users
    Array.from(unlockDurationSelect.options).forEach((opt) => {
      const is30Min = opt.value === String(FREE_UNLOCK_MS);
      opt.disabled = !isPaid && !is30Min;
      const baseLabel = opt.textContent.replace(/\s*\(Pro\)$/, '');
      opt.textContent = opt.disabled ? `${baseLabel} (Pro)` : baseLabel;
    });
    unlockDurationSelect.value = String(effectiveUnlockMs);
    if (!isPaid) unlockDurationSelect.disabled = false; // Keep select enabled but only 30 min selectable
    unlockDurationSelect.onchange = async () => {
      const v = parseInt(unlockDurationSelect.value, 10);
      if (!isPaid && v !== FREE_UNLOCK_MS) {
        unlockDurationSelect.value = String(FREE_UNLOCK_MS);
        showToast('Upgrade to customize unlock duration', 'error');
        return;
      }
      await chrome.storage.local.set({ unlockDurationMs: v });
      const ok = await saveSettingsToServer({ unlock_duration_ms: v });
      showToast(ok ? 'Saved' : 'Saved locally', ok ? 'success' : 'error');
    };

    let questionCount = config?.question_count ?? 5;
    let passThreshold = config?.pass_threshold ?? 4;
    if (!isPaid) {
      questionCount = FREE_QUESTION_COUNT;
      passThreshold = FREE_PASS_THRESHOLD;
      const needsReset = (config?.question_count ?? 5) !== FREE_QUESTION_COUNT || (config?.pass_threshold ?? 4) !== FREE_PASS_THRESHOLD;
      if (needsReset) saveSettingsToServer({ question_count: FREE_QUESTION_COUNT, pass_threshold: FREE_PASS_THRESHOLD });
    }
    const passThresholdSelect = document.getElementById('passThreshold');
    function renderPassThreshold() {
      passThresholdSelect.innerHTML = '';
      for (let i = 1; i <= questionCount; i++) {
        const o = document.createElement('option');
        o.value = i;
        o.textContent = `${i} of ${questionCount}`;
        if (i === passThreshold) o.selected = true;
        passThresholdSelect.appendChild(o);
      }
      passThresholdSelect.disabled = !isPaid;
    }
    renderPassThreshold();
    passThresholdSelect.onchange = async () => {
      const v = parseInt(passThresholdSelect.value, 10);
      passThreshold = v;
      const ok = await saveSettingsToServer({ pass_threshold: v });
      showToast(ok ? 'Saved' : 'Saved locally', ok ? 'success' : 'error');
    };

    document.querySelectorAll('#settingsView .quiz-count-btn').forEach((btn) => {
      const val = parseInt(btn.dataset.val, 10);
      const isLocked = !isPaid && val !== FREE_QUESTION_COUNT;
      btn.disabled = isLocked;
      btn.classList.toggle('locked', isLocked);
      btn.textContent = isLocked ? `${val} (Pro)` : String(val);
      btn.onclick = async () => {
        if (!isPaid && val !== FREE_QUESTION_COUNT) {
          showToast('Upgrade to customize quiz questions', 'error');
          return;
        }
        const v = val;
        questionCount = v;
        if (passThreshold > questionCount) passThreshold = questionCount;
        document.querySelectorAll('#settingsView .quiz-count-btn').forEach((b) => b.classList.toggle('active', parseInt(b.dataset.val, 10) === questionCount));
        renderPassThreshold();
        const ok = await saveSettingsToServer({ question_count: v, pass_threshold: passThreshold });
        showToast(ok ? 'Saved' : 'Saved locally', ok ? 'success' : 'error');
      };
      btn.classList.toggle('active', val === questionCount);
    });

    renderSettingsSites();
    document.getElementById('settingsAddBtn').onclick = () => {
      const input = document.getElementById('settingsCustomDomain');
      const domain = parseDomain(input.value);
      if (!domain) {
        showToast('Enter a domain', 'error');
        return;
      }
      if (blocked.includes(domain)) {
        showToast('Already added', 'error');
        return;
      }
      if (blocked.length >= maxBlocked) {
        showToast(`Limit: ${maxBlocked} sites`, 'error');
        return;
      }
      input.value = '';
      const nextSettings = { ...domainSettings, [domain]: { mode: 'block' } };
      updateBlocked([...blocked, domain], nextSettings);
    };
    document.getElementById('settingsCustomDomain').onkeydown = (e) => {
      if (e.key === 'Enter') document.getElementById('settingsAddBtn').click();
    };
  }

  function getDomainModeKey(domain) {
    const s = domainSettings[domain];
    if (!s || s.mode !== 'daily_limit') return 'block';
    return s.dailyLimitMinutes || 60;
  }

  function formatDailyRemaining(domain) {
    const s = domainSettings[domain];
    if (!s || s.mode !== 'daily_limit') return '';
    const limit = s.dailyLimitMinutes || 60;
    const today = new Date().toDateString();
    const used = (usageData[domain] || {})[today] || 0;
    const remaining = Math.max(0, limit - used);
    if (remaining === 0) return 'Limit reached';
    if (remaining >= 60) {
      const h = Math.floor(remaining / 60);
      const m = remaining % 60;
      return m > 0 ? `${h}h ${m}m left` : `${h}h left`;
    }
    return `${remaining} min left`;
  }

  function setDomainMode(domain, modeOrMins) {
    const next = { ...domainSettings };
    if (modeOrMins === 'block') next[domain] = { mode: 'block' };
    else next[domain] = { mode: 'daily_limit', dailyLimitMinutes: modeOrMins };
    domainSettings = next;
    updateBlocked(blocked, next);
  }

  function renderSettingsSites() {
    // Free users: force all sites to block mode
    if (!isPaid) {
      const hasDailyLimit = Object.values(domainSettings || {}).some((s) => s?.mode === 'daily_limit');
      if (hasDailyLimit) {
        const nextSettings = {};
        for (const d of blocked) nextSettings[d] = { mode: 'block' };
        domainSettings = nextSettings;
        updateBlocked(blocked, nextSettings);
        return; // updateBlocked callback will re-render
      }
    }
    const list = document.getElementById('settingsSitesList');
    const allDomains = [...new Set([...presets.filter((p) => blocked.includes(p.domain)).map((p) => p.domain), ...blocked.filter((d) => !presets.some((p) => p.domain === d))])];
    if (allDomains.length === 0) {
      list.innerHTML = '<div class="empty-sites">No sites added. Add one below.</div>';
      return;
    }
    const modeKeyForDomain = (d) => (isPaid ? getDomainModeKey(d) : 'block');
    list.innerHTML = allDomains.map((domain) => {
      const modeKey = modeKeyForDomain(domain);
      const remaining = formatDailyRemaining(domain);
      const label = (presets.find((p) => p.domain === domain) || { label: domain }).label;
      return `
        <div class="site-row" data-domain="${escapeHtml(domain)}">
          <span class="site-name">${escapeHtml(label)}</span>
          <div class="site-mode-wrap">
            <select class="site-mode-select" data-domain="${escapeHtml(domain)}">
              ${DAILY_LIMIT_OPTIONS.map((o) => {
                const isBlock = o.value === 'block';
                const isLocked = !isPaid && !isBlock;
                const optLabel = isLocked ? `${o.label} (Pro)` : o.label;
                return `<option value="${o.value}" ${String(o.value) === String(modeKey) ? 'selected' : ''} ${isLocked ? 'disabled' : ''}>${optLabel}</option>`;
              }).join('')}
            </select>
            ${modeKey !== 'block' ? `<span class="site-remaining ${remaining === 'Limit reached' ? 'limit-reached' : ''}">${escapeHtml(remaining)}</span>` : ''}
            <button type="button" class="remove-btn" title="Remove"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
          </div>
        </div>
      `;
    }).join('');
    list.querySelectorAll('.site-mode-select').forEach((sel) => {
      sel.onchange = (e) => {
        const domain = e.target.dataset.domain;
        const val = e.target.value;
        const num = parseInt(val, 10);
        if (!isPaid && val !== 'block') {
          sel.value = 'block';
          showToast('Upgrade to set daily limits', 'error');
          return;
        }
        setDomainMode(domain, isNaN(num) ? 'block' : num);
      };
    });
    list.querySelectorAll('.remove-btn').forEach((btn) => {
      btn.onclick = () => {
        const domain = btn.closest('.site-row')?.dataset?.domain;
        if (!domain) return;
        const label = (presets.find((p) => p.domain === domain) || { label: domain }).label;
        if (!confirm(`Are you sure you want to remove ${label}?`)) return;
        const next = blocked.filter((d) => d !== domain);
        const nextSettings = { ...domainSettings };
        delete nextSettings[domain];
        updateBlocked(next, nextSettings);
      };
    });
  }

  if (upgradeBtn) {
    upgradeBtn.style.display = plan === 'free' ? 'block' : 'none';
    upgradeBtn.onclick = () => chrome.tabs.create({ url: `${SCHOLAR_BASE}/pricing` });
  }

  signOutBtn.onclick = async () => {
    await chrome.storage.local.set({ authToken: '', userEmail: '' });
    chrome.runtime.sendMessage({ type: 'AUTH_TOKEN', token: '' }, () => {
      showToast('Signed out');
      location.reload();
    });
  };

  syncBtn.onclick = async () => {
    syncBtn.disabled = true;
    syncBtn.textContent = 'Syncing...';
    chrome.runtime.sendMessage({ type: 'SYNC_CONFIG' }, () => {
      syncBtn.disabled = false;
      syncBtn.textContent = 'Sync';
      window.close();
    });
  };

  function formatRemainingTime(ms) {
    if (ms <= 0) return 'Expired';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  }

  function updateUnlockTimer() {
    chrome.storage.local.get('unlocks', ({ unlocks = {} }) => {
      const now = Date.now();
      const active = Object.entries(unlocks)
        .filter(([, expires]) => expires > now)
        .map(([domain, expiresAt]) => ({ domain, remaining: expiresAt - now }))
        .sort((a, b) => a.remaining - b.remaining);
      if (active.length === 0) {
        unlockTimer.classList.remove('visible');
        return;
      }
      unlockTimer.classList.add('visible');
      unlockTimerList.innerHTML = active.map(({ domain, remaining }) => {
        const fmt = formatRemainingTime(remaining);
        const expiring = remaining < 5 * 60 * 1000;
        return `<div class="unlock-item"><span class="unlock-domain">${escapeHtml(domain)}</span><span class="unlock-time ${expiring ? 'expired' : ''}">${escapeHtml(fmt)}</span></div>`;
      }).join('');
    });
  }

  let timerInterval;
  function startTimer() {
    updateUnlockTimer();
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(updateUnlockTimer, 1000);
  }
  startTimer();

  function updateStatus() {
    if (blocked.length > 0) {
      statusEl.className = 'status active';
      statusEl.textContent = `Blocking ${blocked.length} site(s)`;
    } else {
      statusEl.className = 'status inactive';
      statusEl.textContent = 'Add sites below or open Settings to configure.';
    }
  }

  const updateBlocked = (next, nextDomainSettings, source) => {
    const settings = nextDomainSettings !== undefined ? nextDomainSettings : domainSettings;
    chrome.runtime.sendMessage({ type: 'UPDATE_BLOCKED_SITES', blockedDomains: next, domainSettings: settings }, (r) => {
      if (r?.ok) {
        blocked = r.blockedDomains || next;
        domainSettings = r.domainSettings || domainSettings;
        renderSites();
        updateStatus();
        updateUnlockTimer();
        if (settingsView.style.display !== 'none') renderSettingsSites();
        showToast(r.savedToServer ? 'Saved' : 'Saved locally');
      } else {
        showToast('Failed to save', 'error');
      }
      if (source) source.disabled = false;
    });
  };

  let presets = [...PRESET_SITES];
  const allDomains = () => {
    const presetSet = new Set(presets.map((p) => p.domain));
    const custom = blocked.filter((d) => !presetSet.has(d));
    return [...presets, ...custom.map((d) => ({ domain: d, label: d }))];
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
        const next = isRemoving ? blocked.filter((d) => d !== p.domain) : [...blocked, p.domain];
        if (!isRemoving && next.length > maxBlocked) {
          showToast(`Limit: ${maxBlocked} sites. Upgrade for more.`, 'error');
          btn.disabled = false;
          return;
        }
        const nextSettings = { ...domainSettings };
        if (isRemoving) delete nextSettings[p.domain];
        else if (!nextSettings[p.domain]) nextSettings[p.domain] = { mode: 'block' };
        updateBlocked(next, nextSettings, btn);
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
      showToast('Already added', 'error');
      return;
    }
    if (blocked.length >= maxBlocked) {
      showToast(`Limit: ${maxBlocked} sites. Upgrade for more.`, 'error');
      return;
    }
    customDomainInput.value = '';
    addDomainBtn.disabled = true;
    const nextSettings = { ...domainSettings, [domain]: { mode: 'block' } };
    updateBlocked([...blocked, domain], nextSettings, addDomainBtn);
  };

  customDomainInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addDomainBtn.click();
  });

  updateStatus();
  renderSites();
  chrome.runtime.sendMessage({ type: 'FETCH_PRESETS' }, (r) => {
    if (r?.presets?.length) presets = r.presets;
    renderSites();
  });

  window.addEventListener('beforeunload', () => {
    if (timerInterval) clearInterval(timerInterval);
  });
});
