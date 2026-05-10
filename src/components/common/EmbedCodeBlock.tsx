import { useState } from 'react';

/**
 * "Embed this tool on your site" block. Shown at the bottom of free tool
 * pages with a copy-to-clipboard iframe snippet. The whole point of this
 * is backlinks: every site that copies the snippet onto their page gives
 * us a do-follow backlink with the WriteScholar branded "Powered by"
 * footer baked into the embed widget.
 *
 * Why this is a high-leverage SEO move:
 *   - University writing centers love embedding free tools
 *   - Productivity blogs embed Pomodoro timers
 *   - Each embed = a permanent backlink from a real, relevant site
 *   - Combined with the embed's UTM-tagged "Try the full app" CTA,
 *     we also get conversion traffic, not just SEO juice.
 */

interface EmbedCodeBlockProps {
  /** Slug used in the embed URL — e.g. "gpa-calculator" */
  slug: string;
  /** Display name — e.g. "GPA Calculator" */
  toolName: string;
  /** Recommended iframe height in pixels (depends on tool complexity) */
  height?: number;
  /** Accent colour to match the parent tool */
  accent?: string;
}

const EmbedCodeBlock = ({ slug, toolName, height = 600, accent = '#A560E8' }: EmbedCodeBlockProps) => {
  const [copied, setCopied] = useState(false);

  const iframeCode = `<iframe src="https://writescholar.com/embed/${slug}"
  width="100%"
  height="${height}"
  frameborder="0"
  loading="lazy"
  title="${toolName} - WriteScholar"
  style="border: 2px solid #e7e5e4; border-radius: 16px; max-width: 720px;">
</iframe>`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(iframeCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard might be blocked in some embeds; fall back to selectAll
    }
  };

  return (
    <section
      className="border-t-2 border-stone-200 dark:border-stone-800 py-12 sm:py-16 bg-stone-50 dark:bg-stone-950"
      aria-labelledby="embed-block-heading"
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-extrabold uppercase tracking-wider mb-4"
            style={{ backgroundColor: `${accent}15`, color: accent }}
          >
            Free for any site
          </span>
          <h2 id="embed-block-heading" className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-50 mb-3">
            Embed the {toolName} on your site
          </h2>
          <p className="text-stone-700 dark:text-stone-300 max-w-xl mx-auto leading-relaxed text-[15px]">
            Add this {toolName.toLowerCase()} to your blog, university page, or class resources page. Free, no attribution required beyond the small "Powered by WriteScholar" footer in the widget.
          </p>
        </div>

        {/* The iframe code snippet, monospace with copy button */}
        <div className="relative rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden">
          <div
            className="flex items-center justify-between px-4 py-2 border-b border-stone-200 dark:border-stone-800"
            style={{ backgroundColor: `${accent}08` }}
          >
            <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider" style={{ color: accent }}>
              Copy &amp; paste this into your HTML
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] sm:text-xs font-extrabold text-white border-2 border-b-2 transition-transform hover:-translate-y-0.5"
              style={{ backgroundColor: accent, borderColor: accent }}
            >
              {copied ? '✓ Copied' : 'Copy code'}
            </button>
          </div>
          <pre
            className="px-4 py-4 text-[12px] sm:text-[13px] text-stone-800 dark:text-stone-200 font-mono overflow-x-auto whitespace-pre"
            onClick={(e) => {
              const range = document.createRange();
              range.selectNodeContents(e.currentTarget);
              const sel = window.getSelection();
              sel?.removeAllRanges();
              sel?.addRange(range);
            }}
          >
            {iframeCode}
          </pre>
        </div>

        {/* Quick "what you get" reassurance */}
        <div className="grid sm:grid-cols-3 gap-3 mt-5">
          <div className="rounded-xl border-2 border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3 text-center">
            <div className="text-base mb-1" aria-hidden>✨</div>
            <div className="text-[12px] font-extrabold text-stone-900 dark:text-stone-50">Always up to date</div>
            <div className="text-[11px] text-stone-600 dark:text-stone-400 mt-0.5">Embed updates as we improve the tool</div>
          </div>
          <div className="rounded-xl border-2 border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3 text-center">
            <div className="text-base mb-1" aria-hidden>📱</div>
            <div className="text-[12px] font-extrabold text-stone-900 dark:text-stone-50">Mobile-friendly</div>
            <div className="text-[11px] text-stone-600 dark:text-stone-400 mt-0.5">Responsive, works on any device</div>
          </div>
          <div className="rounded-xl border-2 border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3 text-center">
            <div className="text-base mb-1" aria-hidden>🆓</div>
            <div className="text-[12px] font-extrabold text-stone-900 dark:text-stone-50">Free forever</div>
            <div className="text-[11px] text-stone-600 dark:text-stone-400 mt-0.5">No license, no usage limits</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EmbedCodeBlock;
