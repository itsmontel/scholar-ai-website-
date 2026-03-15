/**
 * Content script on WriteScholar - syncs auth token, API base URL, and listens for unlock success
 */
console.log('[WriteScholar Content] Script loaded on:', window.location.href);

(function syncAuthToken() {
  try {
    const token = localStorage.getItem('authToken');
    const origin = window.location.origin;
    console.log('[WriteScholar Content] Syncing auth token, origin:', origin);
    fetch(`${origin}/api-config.json`)
      .then((r) => r.ok ? r.json() : null)
      .then((cfg) => {
        const apiBase = cfg?.apiUrl?.replace(/\/$/, '') || null;
        if (token || apiBase) {
          chrome.runtime.sendMessage({
            type: 'AUTH_TOKEN',
            token: token || '',
            apiBase: apiBase || undefined
          }, () => {
            console.log('[WriteScholar Content] AUTH_TOKEN sent');
          });
        }
      })
      .catch(() => {
        if (token) chrome.runtime.sendMessage({ type: 'AUTH_TOKEN', token }, () => {});
      });
  } catch (_e) {
    console.error('[WriteScholar Content] syncAuthToken error:', _e);
  }
})();

function isValidRedirect(site, redirect) {
  if (!redirect || typeof redirect !== 'string') return false;
  const s = site.replace(/^https?:\/\//, '').split('/')[0].toLowerCase();
  try {
    const url = new URL(redirect);
    if (url.protocol !== 'https:') return false;
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    const siteHost = s.replace(/^www\./, '');
    return host === siteHost || host.endsWith('.' + siteHost);
  } catch (_) {
    return false;
  }
}

function handleUnlockRequest(site, redirect, source) {
  console.log('[WriteScholar Content] handleUnlockRequest called from:', source, 'site:', site);
  if (!site) {
    console.warn('[WriteScholar Content] No site provided, aborting');
    return;
  }
  const safeRedirect = isValidRedirect(site, redirect) ? redirect : `https://${site.replace(/^https?:\/\//, '').split('/')[0]}`;
  console.log('[WriteScholar Content] Sending UNLOCK_SITE to background...');
  chrome.runtime.sendMessage(
    { type: 'UNLOCK_SITE', site, redirect: safeRedirect },
    (response) => {
      console.log('[WriteScholar Content] Background response:', response, 'lastError:', chrome.runtime.lastError);
      if (chrome.runtime.lastError) {
        console.warn('[WriteScholar Content] Runtime error:', chrome.runtime.lastError.message);
        window.postMessage({ type: 'WRITESCHOLAR_UNLOCK_FAILED' }, '*');
        return;
      }
      if (response?.ok && safeRedirect) {
        console.log('[WriteScholar Content] Unlock succeeded! Redirecting to:', safeRedirect);
        window.location.replace(safeRedirect);
      } else {
        console.warn('[WriteScholar Content] Unlock failed or no redirect. Response:', response);
        window.postMessage({ type: 'WRITESCHOLAR_UNLOCK_FAILED' }, '*');
      }
    }
  );
}

document.addEventListener('focus-mode-unlock', (e) => {
  console.log('[WriteScholar Content] Received CustomEvent focus-mode-unlock:', e.detail);
  const { site, redirect } = e.detail || {};
  handleUnlockRequest(site, redirect, 'CustomEvent');
});

window.addEventListener('message', (e) => {
  if (e.source !== window) return;
  if (e.data?.type === 'WRITESCHOLAR_FOCUS_UNLOCK') {
    console.log('[WriteScholar Content] Received postMessage WRITESCHOLAR_FOCUS_UNLOCK:', e.data);
    const { site, redirect } = e.data;
    handleUnlockRequest(site, redirect, 'postMessage');
  }
});

// Method 3: DOM-based communication (most reliable fallback)
function checkForDOMUnlockRequest() {
  const el = document.getElementById('writescholar-unlock-request');
  if (el) {
    const site = el.dataset.site;
    const redirect = el.dataset.redirect;
    console.log('[WriteScholar Content] Found DOM unlock request. site:', site, 'redirect:', redirect);
    el.remove(); // Remove to prevent duplicate processing
    if (site) {
      handleUnlockRequest(site, redirect, 'DOM');
    }
  }
}

// Check immediately and observe for future additions
checkForDOMUnlockRequest();

function setupObserver() {
  const target = document.body || document.documentElement;
  if (!target) {
    console.log('[WriteScholar Content] No body yet, waiting...');
    setTimeout(setupObserver, 100);
    return;
  }
  
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === 1 && node.id === 'writescholar-unlock-request') {
          console.log('[WriteScholar Content] MutationObserver detected unlock request');
          checkForDOMUnlockRequest();
          return;
        }
      }
    }
  });

  observer.observe(target, {
    childList: true,
    subtree: true
  });
  console.log('[WriteScholar Content] MutationObserver attached to:', target.nodeName);
}

setupObserver();
console.log('[WriteScholar Content] All listeners and observers set up. Ready for unlock requests.');
