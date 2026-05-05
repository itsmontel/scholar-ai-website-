import DOMPurify from 'dompurify';

/**
 * Static preview of the post-search citation results page (matches CitationResultsPage layout).
 */
const DEMO_TOPIC = 'Climate change mitigation strategies';

const PREVIEW_CITATIONS = [
  {
    type: 'journal_article' as const,
    accessibility: 'Open Access' as const,
    year: '2022',
    citation:
      'Kumar, P., & Ahmed, S. (2022). Renewable energy adoption and grid stability: A meta-analysis. <i>Energy Policy</i>, 168, 113–128.',
    ready_to_use_sentence:
      'Recent evidence suggests that scaling renewable generation improves grid stability when paired with storage and demand-side measures (Kumar & Ahmed, 2022).',
    in_text_citation: '(Kumar & Ahmed, 2022)',
    relevance:
      'Directly supports arguments about low-carbon transitions: it synthesizes empirical studies on renewables and reliability—useful for policy sections or literature reviews on mitigation pathways.',
    key_points: [
      'Meta-analysis across multiple regions and technologies.',
      'Links mitigation strategies (renewables) to operational grid outcomes.',
    ],
  },
  {
    type: 'journal_article' as const,
    accessibility: 'Library Access' as const,
    year: '2020',
    citation:
      'Stokes, L. C., & Dolan, W. W. (2020). Public opinion on climate policy: A cross-national study. <i>Nature Climate Change</i>, 10(4), 313–320.',
    ready_to_use_sentence:
      'Cross-national surveys show sustained public support for mitigation policies when costs are framed as investments in jobs and health (Stokes & Dolan, 2020).',
    in_text_citation: '(Stokes & Dolan, 2020)',
    relevance:
      'Helps you connect technical mitigation options to political feasibility—strong for discussion sections on stakeholders, equity, or implementation barriers.',
    key_points: [
      'Compares attitudes across countries and policy instruments.',
      'Useful when your paper addresses social acceptance of mitigation.',
    ],
  },
];

function typeIcon(t: string) {
  const icons: Record<string, string> = {
    journal_article: '📄',
    book: '📚',
    book_chapter: '📖',
    report: '📊',
  };
  return icons[t] || '📄';
}

function accessibilityClass(a: string) {
  const map: Record<string, string> = {
    'Open Access':
      'bg-blue-50 text-blue-800 border-blue-200/90 dark:bg-blue-950/50 dark:text-blue-200 dark:border-blue-800/60',
    'Subscription Required':
      'bg-amber-50 text-amber-800 border-amber-200/90 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800/50',
    'Library Access':
      'bg-stone-100 text-stone-800 border-stone-200/90 dark:bg-stone-800/80 dark:text-stone-200 dark:border-stone-600',
  };
  return map[a] || 'bg-stone-100 text-stone-700 border-stone-200';
}

export default function LandingCitationResultsPreview() {
  return (
    <div className="mt-12 sm:mt-16">
      <div className="text-center max-w-2xl mx-auto mb-8">
        <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-blue-800/90 dark:text-blue-300/95 mb-2">
          After you search
        </p>
        <h3
          className="text-xl sm:text-2xl font-semibold text-stone-900 dark:text-stone-50 mb-2 tracking-tight"
          style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
        >
          What your citation results look like
        </h3>
        <p className="text-sm sm:text-base text-stone-600 dark:text-stone-400 leading-relaxed">
          Full references, in-text snippets, publication year, and a short “why this helps your paper” note—so you can drop sources into your draft with confidence.
        </p>
      </div>

      <div className="rounded-2xl border border-stone-200/90 dark:border-stone-700/90 bg-stone-50/80 dark:bg-stone-950/40 overflow-hidden shadow-inner ring-1 ring-black/5 dark:ring-white/5">
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-stone-200/80 dark:border-stone-700/80 bg-white/70 dark:bg-stone-900/50">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-stone-600 dark:text-stone-400">
            <span className="font-medium text-stone-500 dark:text-stone-500">Topic</span>
            <span className="font-semibold text-stone-900 dark:text-stone-100">{DEMO_TOPIC}</span>
            <span className="text-stone-300 dark:text-stone-600" aria-hidden>
              ·
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-200 border border-blue-200/80 dark:border-blue-800/50">
              APA 7th
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-200/90 text-stone-800 dark:bg-stone-800 dark:text-stone-200">
              {PREVIEW_CITATIONS.length} sources
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-5 max-h-[min(70vh,820px)] overflow-y-auto overscroll-contain">
          {PREVIEW_CITATIONS.map((c, index) => (
            <article
              key={index}
              className="rounded-2xl border border-stone-200/90 dark:border-stone-600/80 bg-white dark:bg-stone-900/70 p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="text-2xl shrink-0" aria-hidden>
                    {typeIcon(c.type)}
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-bold text-stone-900 dark:text-stone-50">[{index + 1}]</span>
                      <span
                        className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold border ${accessibilityClass(c.accessibility)}`}
                      >
                        {c.accessibility}
                      </span>
                      <span className="px-2 py-0.5 bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 rounded-lg text-[11px] font-semibold">
                        {c.year}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 dark:text-stone-400 capitalize">{c.type.replace(/_/g, ' ')}</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 sm:text-right shrink-0">
                  Sample layout
                </span>
              </div>

              <div className="bg-stone-50 dark:bg-stone-950/50 rounded-xl p-4 mb-4 border border-stone-200/80 dark:border-stone-700/80">
                <p
                  className="text-sm sm:text-[15px] text-stone-800 dark:text-stone-200 leading-relaxed font-serif [&_i]:italic"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(c.citation, { ADD_ATTR: ['target', 'rel', 'class'] }) }}
                />
              </div>

              <div className="mb-4">
                <h4 className="font-semibold text-stone-900 dark:text-stone-100 mb-2 flex flex-wrap items-center gap-2 text-sm">
                  <span className="inline-flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Ready-to-use sentence
                  </span>
                  <span className="text-[10px] uppercase tracking-wide bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-full font-bold">
                    In your paper
                  </span>
                </h4>
                <div className="rounded-xl p-4 border border-blue-200/90 dark:border-blue-800/50 bg-blue-50/90 dark:bg-blue-950/25">
                  <p className="text-sm text-stone-800 dark:text-stone-200 leading-relaxed">{c.ready_to_use_sentence}</p>
                  <div className="mt-3 pt-3 border-t border-blue-200/80 dark:border-blue-800/40">
                    <p className="text-xs text-blue-800 dark:text-blue-300">
                      <strong className="font-semibold">In-text:</strong>{' '}
                      <code className="bg-white/90 dark:bg-stone-900 px-2 py-0.5 rounded text-[13px] font-mono text-blue-900 dark:text-blue-200">
                        {c.in_text_citation}
                      </code>
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold text-stone-900 dark:text-stone-100 mb-2 flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Why this source is relevant
                </h4>
                <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">{c.relevance}</p>
              </div>

              <div>
                <h4 className="font-semibold text-stone-900 dark:text-stone-100 mb-2 flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Key points
                </h4>
                <ul className="space-y-2">
                  {c.key_points.map((point, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-stone-700 dark:text-stone-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-500 mt-2 shrink-0" aria-hidden />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>

        <p className="px-4 sm:px-6 py-3 text-[11px] sm:text-xs text-stone-500 dark:text-stone-500 border-t border-stone-200/80 dark:border-stone-700/80 bg-amber-50/50 dark:bg-amber-950/20">
          Illustrative sample. Live results are AI-assisted—always verify each reference and format against your course style guide before submitting.
        </p>
      </div>
    </div>
  );
}
