/**
 * Layout wrapper for embeddable tool widgets.
 *
 * Embed widgets are stripped-down versions of our free tools that other
 * websites can drop into their pages via <iframe>. Each iframe carries our
 * branding + a "Powered by WriteScholar" backlink — that's the SEO play.
 * Every embed = a backlink that earns Google trust for our domain.
 *
 * Critical design rules:
 *   - No global header/footer (would break iframe sizing)
 *   - Single colour accent so it adapts to host site styles loosely
 *   - Compact, no marketing fluff (we already converted them; this serves
 *     the embedding site's audience)
 *   - Persistent "Powered by" footer link with rel="noopener" and a
 *     UTM-tagged URL so we can track traffic in analytics
 */

interface EmbedFrameProps {
  /** Display name shown in the embed header — e.g. "GPA Calculator" */
  title: string;
  /** Tool path on writescholar.com (without leading slash). Used for the
   *  branded "Powered by" backlink at the bottom. */
  toolPath: string;
  /** Accent colour for headings/buttons (defaults to purple) */
  accent?: string;
  children: React.ReactNode;
}

const EmbedFrame = ({ title, toolPath, accent = '#A560E8', children }: EmbedFrameProps) => {
  // UTM tags so we can see traffic from embeds in Google Analytics:
  // utm_source = embed (channel), utm_medium = iframe, utm_campaign = tool slug
  const slug = toolPath.replace(/^\//, '').split('/').pop() || 'embed';
  const brandedHref = `https://writescholar.com${toolPath.startsWith('/') ? toolPath : `/${toolPath}`}?utm_source=embed&utm_medium=iframe&utm_campaign=${slug}`;
  const homeHref = `https://writescholar.com/?utm_source=embed&utm_medium=iframe&utm_campaign=${slug}`;

  return (
    <div className="min-h-screen bg-white dark:bg-stone-950 flex flex-col">
      {/* Compact header — no nav, just the tool title + WriteScholar wordmark */}
      <header
        className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b-2"
        style={{ borderColor: `${accent}40`, backgroundColor: `${accent}08` }}
      >
        <h1 className="text-base sm:text-lg font-extrabold text-stone-900 dark:text-stone-50">
          {title}
        </h1>
        <a
          href={homeHref}
          target="_blank"
          rel="noopener"
          className="flex items-center gap-1.5 text-[12px] font-bold opacity-70 hover:opacity-100 transition-opacity text-stone-700 dark:text-stone-300"
          aria-label="WriteScholar — opens in new tab"
        >
          <span style={{ color: accent }} className="font-extrabold">WriteScholar</span>
        </a>
      </header>

      {/* Tool body */}
      <main className="flex-1 overflow-auto px-4 sm:px-5 py-4 sm:py-5">
        {children}
      </main>

      {/* Persistent "Powered by" footer — this is the backlink that makes
          the embed worthwhile for SEO. Bold so it's visible but compact. */}
      <footer
        className="flex items-center justify-between gap-3 px-4 sm:px-5 py-2.5 border-t"
        style={{ borderColor: `${accent}30`, backgroundColor: `${accent}05` }}
      >
        <a
          href={brandedHref}
          target="_blank"
          rel="noopener"
          className="text-[11px] sm:text-xs font-bold text-stone-700 dark:text-stone-300 hover:underline"
        >
          Powered by{' '}
          <span style={{ color: accent }} className="font-extrabold">WriteScholar</span>
          <span className="ml-1 opacity-60" aria-hidden>↗</span>
        </a>
        <a
          href={`${homeHref}&cta=try-full`}
          target="_blank"
          rel="noopener"
          className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-extrabold text-white border-2 border-b-2 transition-transform hover:-translate-y-0.5"
          style={{ backgroundColor: accent, borderColor: accent }}
        >
          Try the full app
          <span aria-hidden>→</span>
        </a>
      </footer>
    </div>
  );
};

export default EmbedFrame;
