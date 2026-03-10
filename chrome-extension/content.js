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

document.addEventListener('focus-mode-unlock', (e) => {
  const { site, redirect } = e.detail || {};
  if (!site) return;
  chrome.runtime.sendMessage(
    { type: 'UNLOCK_SITE', site, redirect },
    (response) => {
      if (response?.ok && redirect) {
        window.location.replace(redirect);
      }
    }
  );
});
