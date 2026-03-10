/**
 * Content script on WriteScholar - syncs auth token and listens for unlock success
 */
(function syncAuthToken() {
  try {
    const token = localStorage.getItem('authToken');
    if (token) chrome.runtime.sendMessage({ type: 'AUTH_TOKEN', token }, () => {});
  } catch (_e) {}
})();

document.addEventListener('focus-mode-unlock', (e) => {
  const { site, redirect } = e.detail || {};
  if (!site) return;
  chrome.runtime.sendMessage(
    { type: 'UNLOCK_SITE', site, redirect },
    (response) => {
      if (response?.ok && redirect) {
        window.location.href = redirect;
      }
    }
  );
});
