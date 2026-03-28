import React, { useState } from 'react';

export interface BlogFaqItem {
  question: string;
  answer: React.ReactNode;
}

interface BlogFaqAccordionProps {
  id?: string;
  items: BlogFaqItem[];
  subtitle?: string;
}

const p = 'text-stone-600 dark:text-stone-400 leading-relaxed text-[15px] sm:text-base';

/**
 * FAQ block with expandable rows (editorial blog layout).
 */
const BlogFaqAccordion: React.FC<BlogFaqAccordionProps> = ({ id, items, subtitle }) => {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id={id} className="mt-12 pt-2 scroll-mt-28" aria-label="Frequently asked questions">
      <h2 className="blog-section-heading text-2xl sm:text-[1.65rem] font-bold text-stone-800 dark:text-stone-100 mt-0 mb-2 pb-2 border-b border-violet-200/90 dark:border-violet-700/50">
        Frequently asked questions
      </h2>
      {subtitle ? (
        <p className="text-sm text-stone-500 dark:text-stone-400 mb-5">{subtitle}</p>
      ) : (
        <p className="text-sm text-stone-500 dark:text-stone-400 mb-5">Quick answers: tap a question to expand.</p>
      )}
      <ul className="list-none m-0 p-0 space-y-2" role="list">
        {items.map((item, idx) => {
          const isOpen = open === idx;
          return (
            <li key={idx} className="rounded-xl border border-stone-200/95 dark:border-stone-600/90 bg-white/80 dark:bg-stone-900/40 overflow-hidden">
              <button
                type="button"
                className="w-full flex items-center justify-between gap-3 text-left px-4 py-3.5 sm:px-5 sm:py-4 font-semibold text-stone-800 dark:text-stone-100 text-[15px] sm:text-base hover:bg-stone-50/90 dark:hover:bg-stone-800/50 transition-colors"
                onClick={() => setOpen(isOpen ? null : idx)}
                aria-expanded={isOpen}
                aria-controls={`blog-faq-panel-${idx}`}
                id={`blog-faq-trigger-${idx}`}
              >
                <span className="pr-2">{item.question}</span>
                <svg
                  className={`w-5 h-5 shrink-0 text-stone-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div
                id={`blog-faq-panel-${idx}`}
                role="region"
                aria-labelledby={`blog-faq-trigger-${idx}`}
                hidden={!isOpen}
                className={isOpen ? 'border-t border-stone-200/80 dark:border-stone-600/70 px-4 pb-4 pt-3 sm:px-5 sm:pb-5' : 'hidden'}
              >
                <div className={`${p} [&_a]:text-violet-600 dark:[&_a]:text-violet-400 [&_a]:underline [&_a]:underline-offset-2`}>
                  {item.answer}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default BlogFaqAccordion;
