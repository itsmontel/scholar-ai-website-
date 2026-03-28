import React from 'react';

/** Matches `pageUrlMap` in CompleteAcademicAIApp for correct `href` + SPA navigation. */
const PAGE_HREF: Record<string, string> = {
  landing: '/',
  summarizer: '/tools/summarizer',
  'quiz-generator': '/tools/quiz-generator',
  'create-flashcards': '/tools/create-flashcards',
  'crossword-generator': '/tools/crossword-generator',
  'word-counter': '/tools/word-counter',
  'citation-generator-tool': '/tools/citation-generator',
  'readability-score': '/tools/readability-score',
  'paraphrasing-tips': '/tools/paraphrasing-tips',
  'essay-outline': '/tools/essay-outline',
  'text-case-converter': '/tools/text-case-converter',
  'thesis-generator': '/tools/thesis-generator',
  'grammar-checker': '/tools/grammar-checker',
  'gpa-calculator': '/tools/gpa-calculator',
  'pomodoro-timer': '/tools/pomodoro-timer',
  'crater-blast': '/tools/crater-blast',
  'study-pack-viewer': '/study-pack-viewer',
  analyze: '/tools/analyze',
  citations: '/tools/citations',
  'study-pack': '/tools/study-pack',
  'more-tools': '/more-tools',
  badges: '/badges',
  'why-students-choose': '/why-students-choose',
  'study-tools-comparison': '/vs-quizlet-knowt',
};

function hrefForPage(page: string): string {
  return PAGE_HREF[page] ?? `/${page}`;
}

interface BlogPostCtaProps {
  onNavigate: (page: string) => void;
  primaryPage: string;
  primaryLabel: string;
  secondaryPage?: string;
  secondaryLabel?: string;
  footnote?: string;
}

/**
 * End-of-article CTA band (grey card + violet actions). Uses `p` for the headline so it is not listed in the article TOC.
 */
const BlogPostCta: React.FC<BlogPostCtaProps> = ({
  onNavigate,
  primaryPage,
  primaryLabel,
  secondaryPage = 'analysis',
  secondaryLabel = 'Open essay analyzer',
  footnote = 'No credit card required to get started.',
}) => {
  const go =
    (page: string) =>
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      onNavigate(page);
    };

  return (
    <section className="mt-12 scroll-mt-28" aria-label="Get started">
      <div className="rounded-2xl border border-stone-200/95 dark:border-stone-600/80 bg-stone-100/90 dark:bg-stone-800/50 px-5 py-7 sm:px-8 sm:py-8">
        <p
          className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 mb-2 font-serif"
          style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
        >
          Ready to{' '}
          <span className="underline decoration-violet-500/90 dark:decoration-violet-400 decoration-2 underline-offset-[5px]">level up</span>{' '}
          your writing?
        </p>
        <p className="text-stone-600 dark:text-stone-400 text-[15px] sm:text-base leading-relaxed mb-6 max-w-xl">
          Get line-level AI feedback and tools tuned for real coursework—not generic tips.
        </p>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <a
            href={hrefForPage(primaryPage)}
            onClick={go(primaryPage)}
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm sm:text-base shadow-lg shadow-violet-500/20 transition-colors"
          >
            {primaryLabel}
          </a>
          <a
            href={hrefForPage(secondaryPage)}
            onClick={go(secondaryPage)}
            className="text-violet-600 dark:text-violet-400 font-semibold text-sm sm:text-base underline underline-offset-4 hover:text-violet-700 dark:hover:text-violet-300"
          >
            {secondaryLabel}
          </a>
        </div>
        {footnote ? <p className="mt-4 text-xs text-stone-500 dark:text-stone-400">{footnote}</p> : null}
      </div>
    </section>
  );
};

export default BlogPostCta;
