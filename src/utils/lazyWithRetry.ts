import { lazy, LazyExoticComponent, ComponentType } from 'react';

/** After idle tabs / flaky networks, extra attempts + longer backoff help before we surface an error. */
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 800;

/** Marker we set in sessionStorage so a reload-loop is impossible if a real
 *  bug breaks the chunk load even on fresh HTML. */
const RELOAD_FLAG_KEY = 'writescholar-chunk-reload-attempted';

/**
 * Detect "chunk-load-failed" errors. These happen primarily when the user
 * has cached stale HTML that points to chunk filenames the server no
 * longer has after a deploy (filenames include content-hashes, so deploys
 * invalidate every chunk). The right recovery is to force a reload so the
 * user gets fresh HTML referencing the current chunk filenames.
 */
function isChunkLoadError(err: unknown): boolean {
  if (!err) return false;
  const msg = (err as Error)?.message ?? String(err);
  return (
    /Loading chunk [\w]+ failed/i.test(msg) ||
    /Loading CSS chunk [\w]+ failed/i.test(msg) ||
    /Failed to fetch dynamically imported module/i.test(msg) ||
    /ChunkLoadError/i.test(msg) ||
    /Importing a module script failed/i.test(msg)
  );
}

/**
 * Wraps React.lazy() with retry logic + post-deploy chunk recovery.
 *
 * Two failure modes handled:
 *
 *   1. Transient network blip: retry up to MAX_RETRIES times with
 *      exponential backoff (this is the original behavior).
 *
 *   2. Stale deploy: the user has old HTML pointing to chunk filenames
 *      that no longer exist (Vite content-hashes change on every deploy).
 *      Retrying never succeeds because the chunks are simply gone. The fix
 *      is to force a hard reload so the user gets fresh HTML with the
 *      current chunk references.
 *
 * We use a sessionStorage flag to prevent infinite reload loops if a real
 * bug (not a stale deploy) is the cause. After one reload attempt, we let
 * the error surface so the user sees a proper error boundary instead of
 * an endless reload spinner.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  retries = MAX_RETRIES,
  delay = RETRY_DELAY_MS
): LazyExoticComponent<T> {
  return lazy(async () => {
    let lastError: unknown;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await importFn();
      } catch (err) {
        lastError = err;
        if (attempt < retries) {
          const jitter = Math.random() * 300;
          await new Promise((r) => setTimeout(r, delay * Math.pow(2, attempt) + jitter));
        }
      }
    }

    /* All retries failed. If this looks like a stale-deploy chunk error AND
       we haven't already tried reloading once this session, force a reload
       to pick up fresh HTML. The sessionStorage flag prevents reload loops. */
    if (typeof window !== 'undefined' && isChunkLoadError(lastError)) {
      const alreadyReloaded = sessionStorage.getItem(RELOAD_FLAG_KEY) === '1';
      if (!alreadyReloaded) {
        try {
          sessionStorage.setItem(RELOAD_FLAG_KEY, '1');
        } catch {
          /* ignore quota/private-mode errors */
        }
        /* Cache-bust the reload so we definitely get a fresh document. */
        const url = new URL(window.location.href);
        url.searchParams.set('_chunkRecovery', String(Date.now()));
        window.location.replace(url.toString());
        /* Return a never-resolving promise so React doesn't render the error
           boundary while the reload is in flight. */
        return new Promise(() => {}) as Promise<{ default: T }>;
      }
    }

    /* Either it's not a chunk-load error, or we already tried reloading and
       still failed. Surface the error so the upstream error boundary can
       handle it gracefully. */
    throw lastError;
  });
}

/**
 * Listen at the window level for chunk-load errors that bubble up from
 * React's lazy() suspense path before our wrapper sees them (e.g. during
 * route transitions). Same recovery: one reload, then give up.
 *
 * Call this once at app startup.
 */
export function installChunkLoadErrorHandler(): void {
  if (typeof window === 'undefined') return;

  // Successful load — clear the reload flag so a future failure can trigger
  // a fresh recovery cycle.
  if (sessionStorage.getItem(RELOAD_FLAG_KEY) === '1') {
    /* The page loaded successfully after a reload; clear the flag so the
       next deploy can recover too. Wait a beat so we don't clear it during
       the actual load failure. */
    setTimeout(() => {
      try { sessionStorage.removeItem(RELOAD_FLAG_KEY); } catch { /* ignore */ }
    }, 5000);
  }

  const handler = (event: ErrorEvent | PromiseRejectionEvent) => {
    const err = 'reason' in event ? event.reason : event.error;
    if (!isChunkLoadError(err)) return;
    const alreadyReloaded = sessionStorage.getItem(RELOAD_FLAG_KEY) === '1';
    if (alreadyReloaded) return;
    try { sessionStorage.setItem(RELOAD_FLAG_KEY, '1'); } catch { /* ignore */ }
    const url = new URL(window.location.href);
    url.searchParams.set('_chunkRecovery', String(Date.now()));
    window.location.replace(url.toString());
  };

  window.addEventListener('error', handler);
  window.addEventListener('unhandledrejection', handler);
}
