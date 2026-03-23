import { DEMO_B_RUBRIC } from '../../data/landingPageDemoAnalysis';
import LandingScrollReveal from './LandingScrollReveal';

/** Slightly higher rubric lines for “after” mock (same categories as B demo) */
const AFTER_RUBRIC_HIGHLIGHTS: { name: string; score: number; maxScore: number; feedback: string }[] = [
  { name: 'Thesis And Argument', score: 18, maxScore: 20, feedback: 'Thesis is specific and arguable; paragraphs return to it consistently.' },
  { name: 'Response To Question', score: 18, maxScore: 20, feedback: 'Addresses the prompt fully with clear analytical framing.' },
  { name: 'Organization And Structure', score: 14, maxScore: 15, feedback: 'Logical progression; transitions signal why each section matters.' },
  { name: 'Writing Quality And Clarity', score: 9, maxScore: 10, feedback: 'Minor edits only; sentences are direct and academic in tone.' },
  { name: 'Analysis And Critical Thinking', score: 17, maxScore: 20, feedback: 'Strong synthesis of film and theory; avoids pure plot summary.' },
  { name: 'Use Of Evidence And Textual Support', score: 14, maxScore: 15, feedback: 'Sources integrated with clear MLA signal phrases and pages.' },
];

/** Readable text mock for comprehensive report (dense enough to reflect real output) */
function AnalysisReportMock({
  variant,
}: {
  variant: 'before' | 'after';
}) {
  const isBefore = variant === 'before';
  const rubricRows = isBefore ? DEMO_B_RUBRIC : AFTER_RUBRIC_HIGHLIGHTS;
  return (
    <div
      className={`rounded-2xl border overflow-hidden shadow-lg ring-1 text-left ${
        isBefore
          ? 'border-violet-200/90 dark:border-violet-800/50 bg-white dark:bg-stone-900/90 ring-violet-100/80 dark:ring-violet-950/30'
          : 'border-violet-400/75 dark:border-violet-600/45 bg-white dark:bg-stone-900/90 ring-violet-200/80 dark:ring-violet-950/30'
      }`}
    >
      <div
        className={`flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b ${
          isBefore
            ? 'bg-amber-50/95 dark:bg-amber-950/40 border-amber-200/70 dark:border-amber-800/40'
            : 'bg-emerald-50/95 dark:bg-emerald-950/35 border-emerald-200/70 dark:border-emerald-800/40'
        }`}
      >
        <span
          className={`text-xs font-bold uppercase tracking-[0.12em] ${
            isBefore ? 'text-violet-900 dark:text-violet-200' : 'text-violet-900 dark:text-violet-200'
          }`}
        >
          {isBefore ? 'Before' : 'After'}
        </span>
        <span
          className={`text-sm font-semibold tabular-nums ${
            isBefore ? 'text-violet-800 dark:text-violet-300' : 'text-violet-900 dark:text-violet-200'
          }`}
        >
          {isBefore ? '82/100 · Grade B' : '90/100 · Grade A'}
        </span>
      </div>
      <div className="p-4 sm:p-5 space-y-5 bg-stone-50/50 dark:bg-stone-950/40 max-h-[min(85vh,720px)] overflow-y-auto">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-500 mb-1.5">Executive summary</p>
          <p className="text-sm leading-relaxed text-stone-800 dark:text-stone-200">
            {isBefore ? (
              <>
                This draft shows you understand <span className="font-medium text-violet-800 dark:text-violet-300">Get Out</span> in relation to race and power, and you bring in serious sources (Bonilla-Silva, Sue et al.). The grade sits in the B range because the{' '}
                <span className="font-medium text-violet-800 dark:text-violet-300">thesis wanders</span>, several paragraphs read as plot recap, and{' '}
                <span className="font-medium text-violet-800 dark:text-violet-300">MLA citations are inconsistent</span>. Addressing those three areas typically moves a paper like this into the A band.
              </>
            ) : (
              <>
                After revision, the essay opens with a <span className="font-medium text-violet-800 dark:text-violet-300">single, debatable claim</span>, keeps analysis ahead of summary, and pairs each major scene with one scholarly anchor. Citations are cleaned up, and the conclusion tightens the “so what” without repeating the introduction. This is representative of the depth you get in a full WriteScholar report, not a single paragraph of generic praise.
              </>
            )}
          </p>
          <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300 mt-3">
            {isBefore ? (
              <>
                You receive <strong className="font-semibold text-stone-800 dark:text-stone-200">dozens of inline annotations</strong> plus this overview: category scores, clarity label, prioritized fixes, and (in the full export) category-by-category strengths and concerns. Nothing here is “one sentence and done.”
              </>
            ) : (
              <>
                The full product adds <strong className="font-semibold text-stone-800 dark:text-stone-200">exportable narrative sections</strong> (academic writing quality, citations, argument structure, grammar, content depth) with quoted lines from your draft, matching the interactive demo below.
              </>
            )}
          </p>
        </div>

        <div className="rounded-xl border border-stone-200/90 dark:border-stone-700 bg-white/90 dark:bg-stone-900/50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-500 mb-2">Rubric breakdown (excerpt)</p>
          <div className="space-y-2">
            {rubricRows.map((row) => (
              <div key={row.name} className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 border-b border-stone-100 dark:border-stone-800/80 pb-2 last:border-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-stone-800 dark:text-stone-200">{row.name}</p>
                  <p className="text-[11px] text-stone-600 dark:text-stone-400 leading-snug mt-0.5">{row.feedback}</p>
                </div>
                <span className="text-xs font-bold tabular-nums text-stone-700 dark:text-stone-300 shrink-0 sm:ml-2">
                  {row.score}/{row.maxScore}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border ${
              isBefore
                ? 'bg-violet-100/90 dark:bg-violet-950/50 text-violet-950 dark:text-violet-200 border-violet-200/80 dark:border-violet-800/50'
                : 'bg-violet-100/90 dark:bg-violet-950/50 text-violet-950 dark:text-violet-200 border-violet-300/80 dark:border-violet-700/50'
            }`}
          >
            Clarity: {isBefore ? 'Needs work' : 'Strong'}
          </span>
          <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border border-stone-200 dark:border-stone-600 bg-white/80 dark:bg-stone-800/80 text-stone-700 dark:text-stone-300">
            {isBefore ? '24+ inline notes on this draft' : 'Fewer “revise” flags; more “strong” spans'}
          </span>
          <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border border-stone-200 dark:border-stone-600 bg-white/80 dark:bg-stone-800/80 text-stone-700 dark:text-stone-300">
            Word count: {isBefore ? '~1,619' : '~1,620'}
          </span>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-500 mb-2">What we prioritize next</p>
          <ul className="text-sm text-stone-700 dark:text-stone-300 space-y-2.5 list-disc list-inside leading-snug">
            {isBefore ? (
              <>
                <li>
                  <span className="font-medium text-stone-800 dark:text-stone-200">Thesis &amp; roadmap:</span> Name your argument about the film in one sentence; use topic sentences to show how each paragraph proves it.
                </li>
                <li>
                  <span className="font-medium text-stone-800 dark:text-stone-200">Evidence &amp; MLA:</span> Every paraphrase needs author + page; align Works Cited with in-text names.
                </li>
                <li>
                  <span className="font-medium text-stone-800 dark:text-stone-200">Analysis vs. summary:</span> After you describe a scene, add a sentence that states what it does for your argument.
                </li>
                <li>
                  <span className="font-medium text-stone-800 dark:text-stone-200">Grammar &amp; cohesion:</span> Break up run-ons; check subject-verb agreement in long sentences.
                </li>
              </>
            ) : (
              <>
                <li>
                  <span className="font-medium text-stone-800 dark:text-stone-200">Maintain the pattern:</span> Keep thesis → topic sentence → evidence → link to theory in each body section.
                </li>
                <li>
                  <span className="font-medium text-stone-800 dark:text-stone-200">Optional depth:</span> Shorten one dense paragraph in the microaggressions section for readability.
                </li>
                <li>
                  <span className="font-medium text-stone-800 dark:text-stone-200">Citation polish:</span> Double-check italics for film title in Works Cited if your course requires it.
                </li>
                <li>
                  <span className="font-medium text-stone-800 dark:text-stone-200">Final pass:</span> Read aloud once for rhythm. You are now editing at the line level, not restructuring.
                </li>
              </>
            )}
          </ul>
        </div>

        <div className="rounded-lg border border-dashed border-stone-300/90 dark:border-stone-600 bg-stone-100/50 dark:bg-stone-800/30 px-3 py-2.5">
          <p className="text-[11px] text-stone-600 dark:text-stone-400 leading-snug">
            <span className="font-semibold text-stone-700 dark:text-stone-300">Also included in a real run:</span> seriousness-ordered concerns, suggested rewrites per highlight, priority recommendations, and a downloadable report. The mock above is only the summary panel.
          </p>
        </div>
      </div>
    </div>
  );
}

function SupplementalTextMock({ kind }: { kind: 'citations' | 'legend' | 'inline' }) {
  if (kind === 'citations') {
    return (
      <div className="rounded-2xl border border-stone-200/90 dark:border-stone-700/70 bg-white/95 dark:bg-stone-900/60 p-4 sm:p-5 shadow-md h-full flex flex-col text-left">
        <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-500 mb-2">In-text + Works cited (MLA)</p>
        <p className="text-xs text-stone-600 dark:text-stone-400 mb-3 leading-snug">
          WriteScholar flags mismatches between what you cite in the body and what appears in Works Cited so you do not lose marks on formatting.
        </p>
        <div className="rounded-lg bg-stone-100/90 dark:bg-stone-800/80 px-3 py-2.5 mb-3 border border-stone-200/80 dark:border-stone-700">
          <p className="text-[10px] font-bold text-stone-500 dark:text-stone-500 uppercase mb-1">Body (example)</p>
          <p className="font-mono text-[11px] text-stone-800 dark:text-stone-200 leading-relaxed">
            Bonilla-Silva argues that racism is often embedded in everyday routines rather than expressed only as slurs (3).
          </p>
        </div>
        <div className="space-y-2 font-mono text-[11px] text-stone-800 dark:text-stone-200 leading-relaxed flex-1 border-t border-stone-100 dark:border-stone-800 pt-3">
          <p>
            <span className="text-stone-500 dark:text-stone-500 not-italic font-sans text-[10px] uppercase block mb-1">Works cited</span>
            Bonilla-Silva, Eduardo. <em>Racism Without Racists: Color-Blind Racism and the Persistence of Racial Inequality in America</em>. 6th ed., Rowman &amp; Littlefield, 2022.
          </p>
          <p>
            Peele, Jordan, director. <em>Get Out</em>. Universal Pictures, 2017.
          </p>
        </div>
        <p className="text-xs font-medium text-violet-700 dark:text-violet-300 mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 leading-snug">
          Aligned citations: suggested sources that fit your actual sentences, exported in APA / MLA / Chicago.
        </p>
      </div>
    );
  }
  if (kind === 'legend') {
    return (
      <div className="rounded-2xl border border-stone-200/90 dark:border-stone-700/70 bg-white/95 dark:bg-stone-900/60 p-4 sm:p-5 shadow-md h-full flex flex-col text-left">
        <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-500 mb-2">Annotation map</p>
        <p className="text-xs text-stone-600 dark:text-stone-400 mb-3 leading-snug">
          Each color is a different job: celebrate what works, tighten weak analysis, or fix serious issues before submission.
        </p>
        <div className="flex flex-wrap gap-1.5 mb-4">
          <span className="inline-flex items-center gap-1 rounded-full pl-1 pr-2 py-0.5 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Strong (8+)
          </span>
          <span className="inline-flex items-center gap-1 rounded-full pl-1 pr-2 py-0.5 text-[10px] font-bold border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 text-amber-950 dark:text-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Improve (15+)
          </span>
          <span className="inline-flex items-center gap-1 rounded-full pl-1 pr-2 py-0.5 text-[10px] font-bold border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950 text-rose-900 dark:text-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Concern (9+)
          </span>
        </div>
        <div className="rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50/80 dark:bg-stone-800/50 px-3 py-2.5 text-xs text-stone-700 dark:text-stone-300 leading-snug flex-1">
          <span className="font-semibold text-stone-800 dark:text-stone-200">Tip:</span> Hover or tap any highlight to open the same comment you would see in the margin of a graded paper: feedback text, plus a suggested revision when something is off.
        </div>
        <p className="text-xs font-medium text-violet-700 dark:text-violet-300 mt-4 pt-3 border-t border-stone-100 dark:border-stone-800">
          Sentence-level map across the whole draft
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-stone-200/90 dark:border-stone-700/70 bg-white/95 dark:bg-stone-900/60 p-4 sm:p-5 shadow-md h-full text-left flex flex-col">
      <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-500 mb-2">Inline rewrite</p>
      <p className="text-xs text-stone-600 dark:text-stone-400 mb-3 leading-snug">
        Amber highlights include a concrete “try this instead” line — not just “be clearer.”
      </p>
      <div className="rounded-lg border border-amber-200/80 dark:border-amber-800/50 bg-amber-50/90 dark:bg-amber-950/30 px-3 py-2 mb-2">
        <p className="text-[10px] font-semibold text-amber-900 dark:text-amber-300 uppercase mb-1">Flagged</p>
        <p className="text-sm text-amber-950 dark:text-amber-100 leading-snug">
          This is because, they are the top of the hierarchy in our society and we see them in much of the high-power jobs…
        </p>
      </div>
      <div className="rounded-lg border border-emerald-200/80 dark:border-emerald-800/50 bg-emerald-50/80 dark:bg-emerald-950/25 px-3 py-2 flex-1">
        <p className="text-[10px] font-semibold text-emerald-900 dark:text-emerald-300 uppercase mb-1">Suggested revision</p>
        <p className="text-sm text-stone-800 dark:text-stone-200 leading-snug">
          Bonilla-Silva describes how white elites remain overrepresented in high-status roles, which helps explain why the Armitage family’s guests treat the auction as normal (3).
        </p>
      </div>
      <p className="text-xs font-medium text-violet-700 dark:text-violet-300 mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 leading-snug">
        Inline suggestions tied to your exact wording
      </p>
    </div>
  );
}

/**
 * Before/after: report mocks + citations/sentence examples (no tiny screenshots).
 */
export default function LandingBeforeAfterSection() {
  return (
    <section
      id="before-after"
      className="relative w-full -mx-4 sm:-mx-6 lg:-mx-8 scroll-mt-24 border-t border-b border-stone-200/80 dark:border-stone-700/80 bg-gradient-to-b from-[#f8fafc] via-[#fafafa] to-[#f4f4f5] dark:from-stone-950 dark:via-stone-950 dark:to-stone-950 py-14 sm:py-24 overflow-hidden"
      aria-labelledby="before-after-heading"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-20%,rgba(91,33,182,0.07),transparent_55%)] dark:bg-[radial-gradient(ellipse_90%_55%_at_50%_-15%,rgba(109,40,217,0.12),transparent_58%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.12] bg-[length:40px_40px] bg-[linear-gradient(to_right,rgba(148,163,184,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.06)_1px,transparent_1px)]"
        aria-hidden
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <LandingScrollReveal>
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="mx-auto mb-5 h-0.5 w-16 rounded-full bg-gradient-to-r from-violet-400 via-violet-500 to-violet-600 opacity-90" aria-hidden />
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase text-violet-800 dark:text-violet-200 bg-white/90 dark:bg-violet-950/50 border border-violet-200/90 dark:border-violet-800/50 shadow-sm mb-5">
            Before &amp; after
          </span>
          <h2
            id="before-after-heading"
            className="text-[1.75rem] sm:text-3xl lg:text-[2.35rem] font-semibold text-stone-900 dark:text-stone-50 tracking-tight mb-4 leading-tight"
            style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
          >
            Turn a Mid-B Essay Into an A
          </h2>
          <p className="text-base sm:text-lg text-stone-600 dark:text-stone-400 leading-relaxed">
            Real improvements based on structure, argument, and clarity. Below: report-style summaries, rubric lines, and citation-aligned feedback—how professors actually grade.
          </p>
        </div>

        <div className="space-y-16 sm:space-y-20">
          <div>
            <div className="mb-6 sm:mb-8 text-center sm:text-left max-w-2xl mx-auto sm:mx-0">
              <h3 className="text-lg sm:text-xl font-semibold text-stone-900 dark:text-stone-100 mb-1" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
                Comprehensive academic analysis
              </h3>
              <p className="text-sm sm:text-base text-stone-600 dark:text-stone-400">
                Same essay topic: executive summary, rubric lines, and next steps (abbreviated for the page; the live tool is longer).
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">
              <AnalysisReportMock variant="before" />
              <AnalysisReportMock variant="after" />
            </div>
          </div>
        </div>

        {/* Citations & sentence work */}
        <div className="mt-16 sm:mt-20 pt-12 sm:pt-14 border-t border-stone-200/90 dark:border-stone-800/80">
          <h3 className="text-center text-sm font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400 mb-2">
            Citations &amp; sentence work
          </h3>
          <p className="text-center text-sm text-stone-600 dark:text-stone-400 max-w-2xl mx-auto mb-8 leading-relaxed">
            Three slices of what “aligned citations” and inline feedback mean in practice, not decorative UI.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
            <SupplementalTextMock kind="citations" />
            <SupplementalTextMock kind="legend" />
            <SupplementalTextMock kind="inline" />
          </div>
        </div>
        </LandingScrollReveal>
      </div>
    </section>
  );
}
