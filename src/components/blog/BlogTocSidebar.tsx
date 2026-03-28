import React from 'react';
import type { BlogTocItem } from '../../hooks/useBlogArticleToc';

interface BlogTocSidebarProps {
  items: BlogTocItem[];
  activeId: string | null;
}

const BlogTocSidebar: React.FC<BlogTocSidebarProps> = ({ items, activeId }) => {
  if (items.length === 0) return null;

  return (
    <nav aria-label="On this page" className="text-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400 mb-3">On this page</p>
      <ol className="space-y-1.5 list-none m-0 p-0">
        {items.map((item) => {
          const active = activeId === item.id;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  const el = document.getElementById(item.id);
                  el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  window.history.replaceState(null, '', `#${item.id}`);
                }}
                className={`block rounded-lg px-2.5 py-1.5 leading-snug transition-colors ${
                  active
                    ? 'bg-violet-100/90 dark:bg-violet-950/50 text-violet-800 dark:text-violet-200 font-semibold'
                    : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100/90 dark:hover:bg-stone-800/60 hover:text-stone-900 dark:hover:text-stone-100'
                }`}
              >
                <span className="text-stone-400 dark:text-stone-500 font-medium tabular-nums mr-1.5">{item.number}.</span>
                {item.label}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default BlogTocSidebar;
