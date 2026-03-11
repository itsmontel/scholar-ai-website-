import { lazy, LazyExoticComponent, ComponentType } from 'react';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

/**
 * Wraps React.lazy() with retry logic for chunk load failures.
 * When dynamic import() fails (network error, 404, etc.), retries up to MAX_RETRIES times
 * with exponential backoff. Dramatically reduces "Oops! Something went wrong" from transient failures.
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
          await new Promise((r) => setTimeout(r, delay * Math.pow(2, attempt)));
        }
      }
    }
    throw lastError;
  });
}
