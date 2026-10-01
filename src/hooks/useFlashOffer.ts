import { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

let cache: { token: string; promise: Promise<number | null> } | null = null;

function fetchFlashOfferEndsAt(token: string): Promise<number | null> {
  if (cache && cache.token === token) return cache.promise;
  const promise = fetch(`${API_URL}/subscriptions/trial-eligibility`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      const iso = data?.flashOfferEndsAt;
      const ms = typeof iso === 'string' ? new Date(iso).getTime() : NaN;
      return Number.isFinite(ms) && ms > Date.now() ? ms : null;
    })
    .catch(() => {
      if (cache?.promise === promise) cache = null;
      return null;
    });
  cache = { token, promise };
  return promise;
}

export interface FlashOffer {
  active: boolean;
  msLeft: number;
  hours: string;
  minutes: string;
  seconds: string;
}

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Live countdown for the 24-hour $4.99 Pro offer. `active` is true only
 * while the backend-issued deadline is in the future.
 */
export function useFlashOffer(enabled = true): FlashOffer {
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!enabled) return;
    let token: string | null = null;
    try {
      token = localStorage.getItem('authToken');
    } catch {
      token = null;
    }
    if (!token) return;
    let cancelled = false;
    void fetchFlashOfferEndsAt(token).then((ms) => {
      if (!cancelled) setEndsAt(ms);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  useEffect(() => {
    if (!endsAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [endsAt]);

  const msLeft = enabled && endsAt ? Math.max(0, endsAt - now) : 0;
  const totalSeconds = Math.floor(msLeft / 1000);
  return {
    active: msLeft > 0,
    msLeft,
    hours: pad(Math.floor(totalSeconds / 3600)),
    minutes: pad(Math.floor((totalSeconds % 3600) / 60)),
    seconds: pad(totalSeconds % 60),
  };
}
