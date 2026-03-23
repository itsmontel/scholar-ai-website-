import { useEffect, useRef, useState } from 'react';

export function useScrollReveal(options?: { threshold?: number; rootMargin?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const threshold = options?.threshold ?? 0.08;
  const rootMargin = options?.rootMargin ?? '0px 0px -7% 0px';

  const [reduceMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      return false;
    }
  });

  const [visible, setVisible] = useState(reduceMotion);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      const onChange = () => {
        if (mq.matches) setVisible(true);
      };
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    } catch {
      return undefined;
    }
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold, rootMargin }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [reduceMotion, threshold, rootMargin]);

  return { ref, visible };
}
