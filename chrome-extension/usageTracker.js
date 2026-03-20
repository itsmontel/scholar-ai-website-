/**
 * Usage tracker for daily-limit mode. Runs on managed sites to track active time.
 * Sends heartbeat to background; when limit reached, redirects to unlock quiz.
 */
(function() {
  const SCHOLAR_BASE = 'https://writescholar.com';
  const HEARTBEAT_MS = 60 * 1000; // 1 minute

  function getBaseDomain(hostname) {
    if (!hostname) return '';
    const parts = hostname.toLowerCase().replace(/^www\./, '').split('.');
    return parts.length >= 2 ? parts.slice(-2).join('.') : hostname;
  }

  const currentDomain = getBaseDomain(window.location.hostname);
  if (!currentDomain) return;

  // Don't run on WriteScholar
  if (currentDomain === 'writescholar.com') return;

  let heartbeatInterval = null;
  let lastHeartbeat = 0;

  function sendHeartbeat() {
    const now = Date.now();
    if (now - lastHeartbeat < HEARTBEAT_MS * 0.9) return;
    lastHeartbeat = now;
    chrome.runtime.sendMessage(
      { type: 'ADD_DAILY_USAGE', domain: currentDomain, currentUrl: window.location.href },
      (r) => {
        if (r?.limitReached && r?.redirectUrl) {
          window.location.href = r.redirectUrl;
        }
      }
    );
  }

  function startTracking() {
    if (heartbeatInterval) return;
    sendHeartbeat();
    heartbeatInterval = setInterval(sendHeartbeat, HEARTBEAT_MS);
  }

  function stopTracking() {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
  }

  function init() {
    chrome.storage.local.get(['config', 'authToken', 'extensionEnabled'], (st) => {
      if (!st.authToken || st.extensionEnabled === false) return;
      const config = st.config || {};
      const domains = config.blockedDomains || [];
      const domainSettings = config.domainSettings || {};
      if (!domains.includes(currentDomain)) return;
      const settings = domainSettings[currentDomain];
      if (!settings || settings.mode !== 'daily_limit') return;
      startTracking();
    });
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopTracking();
    } else {
      init();
    }
  });

  init();
})();
