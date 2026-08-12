import { useEffect, useRef, useState } from 'react';

/**
 * Reveal-on-scroll with progressive enhancement.
 *
 * Content is VISIBLE BY DEFAULT ("static"). Only after mount — in a live
 * browser, for elements comfortably below the fold, with motion allowed —
 * do we arm the hide-then-reveal animation. This guarantees:
 *
 *   1. Prerendered HTML (scripts/prerender.mjs captures the DOM via
 *      page.content()) serializes with content fully visible — previously
 *      every below-fold section shipped with `opacity-0` baked into
 *      dist/index.html, hiding most of the landing page from crawlers.
 *   2. If IntersectionObserver never fires (throttled background tab,
 *      browser quirk), a scroll/resize fallback still reveals the block —
 *      content can no longer be stuck invisible forever.
 *   3. Deep links / instant scrolls that land past a block reveal it
 *      immediately instead of waiting for a re-intersection.
 *
 * The one-frame "visible → hidden" flip on mount happens below the fold,
 * so real users never see it; they still get the full staggered animation.
 */
export function useScrollReveal(options?: { threshold?: number; rootMargin?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const threshold = options?.threshold ?? 0.08;
  const rootMargin = options?.rootMargin ?? '0px 0px -7% 0px';

  // 'static'  = never animated; rendered fully visible (prerender/SSR-safe)
  // 'hidden'  = armed for animation, currently opacity-0
  // 'visible' = animation triggered
  const [state, setState] = useState<'static' | 'hidden' | 'visible'>('static');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const el = ref.current;
    if (!el) return;

    let reduceMotion = false;
    try {
      reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      /* leave false */
    }
    if (reduceMotion) return; // stay 'static' — fully visible, no animation

    // Headless/bot renderers (Puppeteer prerender, Googlebot WRS) report
    // navigator.webdriver — keep content static-visible for them so captured
    // or crawled HTML never contains opacity-0 sections.
    try {
      if (navigator.webdriver) return;
    } catch {
      /* proceed */
    }

    // Only arm the animation when the block is comfortably BELOW the fold.
    // Anything already on screen (or above it) stays static-visible.
    const rect = el.getBoundingClientRect();
    if (rect.top <= window.innerHeight * 0.98) return;

    setState('hidden');

    const reveal = () => setState('visible');

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) reveal();
      },
      { threshold, rootMargin }
    );
    obs.observe(el);

    // Fallback: rAF-throttled scroll/resize check in case the observer is
    // throttled or broken. First reveal wins; everything detaches on reveal
    // via the effect cleanup below plus the `revealed` guard.
    let ticking = false;
    let revealed = false;
    const fallbackCheck = () => {
      if (revealed || ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        ticking = false;
        if (revealed) return;
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.96 && r.bottom > 0) {
          revealed = true;
          reveal();
          window.removeEventListener('scroll', fallbackCheck);
          window.removeEventListener('resize', fallbackCheck);
        }
      });
    };
    window.addEventListener('scroll', fallbackCheck, { passive: true });
    window.addEventListener('resize', fallbackCheck, { passive: true });

    return () => {
      obs.disconnect();
      window.removeEventListener('scroll', fallbackCheck);
      window.removeEventListener('resize', fallbackCheck);
    };
    // threshold/rootMargin are primitive options; re-arming on change is fine.
  }, [threshold, rootMargin]);

  return { ref, visible: state !== 'hidden' };
}
