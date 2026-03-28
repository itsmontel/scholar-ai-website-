import React from 'react';

interface BlogKeyTakeawaysProps {
  bullets: string[];
}

/**
 * Mint-tinted summary card (matches editorial blog pattern; uses violet accent for WriteScholar theme).
 */
const BlogKeyTakeaways: React.FC<BlogKeyTakeawaysProps> = ({ bullets }) => {
  if (!bullets.length) return null;

  return (
    <section className="mt-12 scroll-mt-28" aria-labelledby="blog-takeaways-heading">
      <h2
        id="blog-takeaways-heading"
        className="blog-section-heading text-2xl sm:text-[1.65rem] font-bold text-stone-800 dark:text-stone-100 mb-4 pb-2 border-b border-violet-200/90 dark:border-violet-700/50"
      >
        Key takeaways
      </h2>
      <div className="rounded-2xl border border-violet-200/80 dark:border-violet-700/50 bg-violet-50/70 dark:bg-violet-950/35 px-5 py-5 sm:px-6 sm:py-6">
        <ul className="list-disc pl-5 space-y-2.5 text-stone-700 dark:text-stone-300 text-[15px] sm:text-base leading-relaxed marker:text-violet-600 dark:marker:text-violet-400">
          {bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default BlogKeyTakeaways;
