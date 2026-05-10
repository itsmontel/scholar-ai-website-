import { lazy, Suspense, useEffect } from 'react';
import { applyNoIndex } from '../../utils/seo';

/**
 * Embed page router. Renders the matching embed widget based on the URL
 * pathname (/embed/[slug]). Lazy-loaded so the embed bundle is separate
 * from the main app — embedding sites only download what they need.
 *
 * Embed pages are noindex by design — we don't want the standalone embed
 * URL to compete with the full tool page in search results. The host site's
 * embed (with our backlink) is what we want indexed instead.
 */

const EmbedGPACalculator = lazy(() => import('../embed/EmbedGPACalculator'));
const EmbedWordCounter = lazy(() => import('../embed/EmbedWordCounter'));
const EmbedPomodoroTimer = lazy(() => import('../embed/EmbedPomodoroTimer'));

const EMBED_REGISTRY: Record<string, React.ComponentType> = {
  'gpa-calculator': EmbedGPACalculator,
  'word-counter': EmbedWordCounter,
  'pomodoro-timer': EmbedPomodoroTimer,
};

const EmbedPage = () => {
  // Strip /embed/ prefix to get the slug
  const path = typeof window !== 'undefined' ? window.location.pathname : '';
  const slug = path.replace(/^\/embed\/?/, '').replace(/\/$/, '');
  const Widget = EMBED_REGISTRY[slug];

  useEffect(() => {
    // Embed pages must not appear in search results — host site's embedded
    // version (with the iframe pointing at us) is what should be indexed.
    applyNoIndex();
    // Also disable the global header/footer from showing through. The
    // <html> element gets a class so global CSS can target embed pages.
    document.documentElement.classList.add('embed-mode');
    document.title = 'WriteScholar Embed';
    return () => {
      document.documentElement.classList.remove('embed-mode');
    };
  }, []);

  if (!Widget) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-stone-950 p-8 text-center">
        <h1 className="text-xl font-extrabold text-stone-900 dark:text-stone-50 mb-2">Embed not found</h1>
        <p className="text-stone-600 dark:text-stone-400 text-sm mb-4">
          No widget exists at <code className="px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800">/embed/{slug}</code>.
        </p>
        <a
          href="https://writescholar.com/tools/gpa-calculator"
          target="_blank"
          rel="noopener"
          className="text-sm font-bold text-[#A560E8] hover:underline"
        >
          Browse free tools on WriteScholar →
        </a>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-stone-950">
        <div className="text-stone-500 text-sm">Loading…</div>
      </div>
    }>
      <Widget />
    </Suspense>
  );
};

export default EmbedPage;
