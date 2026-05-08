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
      'bg-[#E5F8D0] text-[#58CC02] border-[#58CC02]',
    'Subscription Required':
      'bg-[#FFF4E0] text-[#FF9600] border-[#FF9600]',
    'Library Access':
      'bg-[#FAFAFA] text-[#777] border-[#E5E5E5]',
  };
  return map[a] || 'bg-[#FAFAFA] text-[#777] border-[#E5E5E5]';
}

export default function LandingCitationResultsPreview() {
  return (
    <div className="mt-12 sm:mt-16" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
      <div className="text-center max-w-2xl mx-auto mb-8">
        <span className="inline-block px-3 py-1 rounded-xl text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.2em] text-[#1CB0F6] bg-[#DDF4FF] border-2 border-[#1CB0F6] mb-2">
          After you search
        </span>
        <h3
          className="text-xl sm:text-2xl font-extrabold text-[#3C3C3C] mb-2 tracking-tight"
          style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
        >
          What your citation results look like
        </h3>
        <p className="text-sm sm:text-base text-[#777] leading-relaxed">
          Full references, in-text snippets, publication year, and a short "why this helps your paper" note—so you can drop sources into your draft with confidence.
        </p>
      </div>

      <div className="rounded-2xl border-2 border-b-4 border-[#E5E5E5] bg-white overflow-hidden">
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b-2 border-[#E5E5E5] bg-white">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[#777]">
            <span className="font-extrabold text-[#AFAFAF]">Topic</span>
            <span className="font-extrabold text-[#3C3C3C]">{DEMO_TOPIC}</span>
            <span className="text-[#E5E5E5]" aria-hidden>
              ·
            </span>
            <span className="px-2.5 py-0.5 rounded-xl text-xs font-extrabold bg-[#DDF4FF] text-[#1CB0F6] border-2 border-[#1CB0F6]">
              APA 7th
            </span>
            <span className="px-2.5 py-0.5 rounded-xl text-xs font-extrabold bg-[#FAFAFA] text-[#3C3C3C] border-2 border-[#E5E5E5]">
              {PREVIEW_CITATIONS.length} sources
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-5 max-h-[min(70vh,820px)] overflow-y-auto overscroll-contain bg-[#FAFAFA]">
          {PREVIEW_CITATIONS.map((c, index) => (
            <article
              key={index}
              className="rounded-2xl border-2 border-b-4 border-[#E5E5E5] bg-white p-5 sm:p-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="text-2xl shrink-0" aria-hidden>
                    {typeIcon(c.type)}
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-extrabold text-[#3C3C3C]">[{index + 1}]</span>
                      <span
                        className={`px-2 py-0.5 rounded-xl text-[11px] font-extrabold border-2 ${accessibilityClass(c.accessibility)}`}
                      >
                        {c.accessibility}
                      </span>
                      <span className="px-2 py-0.5 bg-[#FAFAFA] text-[#3C3C3C] rounded-xl text-[11px] font-extrabold border-2 border-[#E5E5E5]">
                        {c.year}
                      </span>
                    </div>
                    <p className="text-xs text-[#AFAFAF] capitalize">{c.type.replace(/_/g, ' ')}</p>
                  </div>
                </div>
                <span className="text-xs font-extrabold text-[#1CB0F6] sm:text-right shrink-0">
                  Sample layout
                </span>
              </div>

              <div className="bg-[#FAFAFA] rounded-xl p-4 mb-4 border-2 border-[#E5E5E5]">
                <p
                  className="text-sm sm:text-[15px] text-[#3C3C3C] leading-relaxed font-serif [&_i]:italic"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(c.citation, { ADD_ATTR: ['target', 'rel', 'class'] }) }}
                />
              </div>

              <div className="mb-4">
                <h4 className="font-extrabold text-[#3C3C3C] mb-2 flex flex-wrap items-center gap-2 text-sm">
                  <span className="inline-flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-[#1CB0F6] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Ready-to-use sentence
                  </span>
                  <span className="text-[10px] uppercase tracking-wide bg-[#DDF4FF] text-[#1CB0F6] px-2 py-0.5 rounded-xl font-extrabold border-2 border-[#1CB0F6]">
                    In your paper
                  </span>
                </h4>
                <div className="rounded-xl p-4 border-2 border-[#1CB0F6] bg-[#DDF4FF]">
                  <p className="text-sm text-[#3C3C3C] leading-relaxed">{c.ready_to_use_sentence}</p>
                  <div className="mt-3 pt-3 border-t-2 border-[#1CB0F6]/30">
                    <p className="text-xs text-[#1899D6]">
                      <strong className="font-extrabold">In-text:</strong>{' '}
                      <code className="bg-white px-2 py-0.5 rounded-lg text-[13px] font-mono text-[#1899D6] border border-[#E5E5E5]">
                        {c.in_text_citation}
                      </code>
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-extrabold text-[#3C3C3C] mb-2 flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-[#58CC02] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Why this source is relevant
                </h4>
                <p className="text-sm text-[#777] leading-relaxed">{c.relevance}</p>
              </div>

              <div>
                <h4 className="font-extrabold text-[#3C3C3C] mb-2 flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-[#A560E8] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Key points
                </h4>
                <ul className="space-y-2">
                  {c.key_points.map((point, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-[#777]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#A560E8] mt-2 shrink-0" aria-hidden />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>

        <p className="px-4 sm:px-6 py-3 text-[11px] sm:text-xs text-[#AFAFAF] border-t-2 border-[#E5E5E5] bg-[#FFF4E0]">
          Illustrative sample. Live results are AI-assisted—always verify each reference and format against your course style guide before submitting.
        </p>
      </div>
    </div>
  );
}
