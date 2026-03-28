import { useEffect, useState, type RefObject } from 'react';

export interface BlogTocItem {
  id: string;
  label: string;
  number: number;
}

function slugify(text: string): string {
  const s = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
  return s || 'section';
}

/**
 * Builds a numbered TOC from `h2` elements inside the container, assigns stable `id`s, and tracks the active section while scrolling.
 */
export function useBlogArticleToc(
  containerRef: RefObject<HTMLElement | null>,
  slug: string
): { items: BlogTocItem[]; activeId: string | null } {
  const [items, setItems] = useState<BlogTocItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const run = () => {
      const root = containerRef.current;
      if (!root) return;

      const headings = root.querySelectorAll('h2');
      const toc: BlogTocItem[] = [];
      const used = new Set<string>();

      headings.forEach((h, i) => {
        const text = h.textContent?.trim() ?? '';
        if (!text) return;
        const base = slugify(text);
        let id = base;
        let n = 0;
        while (used.has(id)) {
          id = `${base}-${++n}`;
        }
        used.add(id);
        h.id = id;
        toc.push({ id, label: text, number: i + 1 });
      });

      setItems(toc);
    };

    run();
    const t = window.setTimeout(run, 0);
    return () => window.clearTimeout(t);
  }, [slug, containerRef]);

  useEffect(() => {
    if (items.length === 0) {
      setActiveId(null);
      return;
    }

    const ids = items.map((i) => i.id);
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        root: null,
        rootMargin: '-12% 0px -55% 0px',
        threshold: [0, 0.1, 0.25, 0.5, 1],
      }
    );

    elements.forEach((el) => observer.observe(el));

    const onScroll = () => {
      let best: { id: string; dist: number } | null = null;
      const mid = window.innerHeight * 0.28;
      for (const el of elements) {
        const r = el.getBoundingClientRect();
        const dist = Math.abs(r.top - mid);
        if (!best || dist < best.dist) best = { id: el.id, dist };
      }
      if (best) setActiveId(best.id);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, [items]);

  return { items, activeId };
}
