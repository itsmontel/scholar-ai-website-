/**
 * Content script on WriteScholar - syncs auth token, API base URL, and listens for unlock success
 */
(function syncAuthToken() {
  try {
    const token = localStorage.getItem('authToken');
    const origin = window.location.origin;
    fetch(`${origin}/api-config.json`)
      .then((r) => r.ok ? r.json() : null)
      .then((cfg) => {
        const apiBase = cfg?.apiUrl?.replace(/\/$/, '') || null;
        if (token || apiBase) {
          chrome.runtime.sendMessage({
            type: 'AUTH_TOKEN',
            token: token || '',
            apiBase: apiBase || undefined
          }, () => {});
        }
      })
      .catch(() => {
        if (token) chrome.runtime.sendMessage({ type: 'AUTH_TOKEN', token }, () => {});
      });
  } catch (_e) {}
})();

function handleUnlockRequest(site, redirect) {
  if (!site) return;
  chrome.runtime.sendMessage(
    { type: 'UNLOCK_SITE', site, redirect },
    (response) => {
      if (chrome.runtime.lastError) {
        console.warn('WriteScholar unlock:', chrome.runtime.lastError.message);
        window.postMessage({ type: 'WRITESCHOLAR_UNLOCK_FAILED' }, '*');
        return;
      }
      if (response?.ok && redirect) {
        window.location.replace(redirect);
      } else {
        window.postMessage({ type: 'WRITESCHOLAR_UNLOCK_FAILED' }, '*');
      }
    }
  );
}

document.addEventListener('focus-mode-unlock', (e) => {
  const { site, redirect } = e.detail || {};
  handleUnlockRequest(site, redirect);
});

window.addEventListener('message', (e) => {
  if (e.source !== window || e.data?.type !== 'WRITESCHOLAR_FOCUS_UNLOCK') return;
  const { site, redirect } = e.data;
  handleUnlockRequest(site, redirect);
});
