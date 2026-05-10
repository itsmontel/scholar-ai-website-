import { DEMO_B_RUBRIC } from '../../data/landingPageDemoAnalysis';
import LandingScrollReveal from './LandingScrollReveal';

/** Slightly higher rubric lines for "after" mock (same categories as B demo) */
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
      className={`rounded-2xl border-2 border-b-4 overflow-hidden text-left ${
        isBefore
          ? 'border-[#FF4B4B] bg-white'
          : 'border-[#58CC02] bg-white'
      }`}
      style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
    >
      <div
        className={`flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b-2 ${
          isBefore
            ? 'bg-[#FFE8E8] border-[#FF4B4B]'
            : 'bg-[#E5F8D0] border-[#58CC02]'
        }`}
      >
        <span
          className={`text-xs font-extrabold uppercase tracking-[0.12em] ${
            isBefore ? 'text-[#FF4B4B]' : 'text-[#58CC02]'
          }`}
        >
          {isBefore ? 'Before' : 'After'}
        </span>
        <span
          className={`text-sm font-extrabold tabular-nums ${
            isBefore ? 'text-[#FF4B4B]' : 'text-[#58CC02]'
          }`}
        >
          {isBefore ? '82/100 · Grade B' : '90/100 · Grade A'}
        </span>
      </div>
      <div className="p-4 sm:p-5 space-y-5 bg-white max-h-[min(85vh,720px)] overflow-y-auto">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#AFAFAF] mb-1.5">Executive summary</p>
          <p className="text-sm leading-relaxed text-[#3C3C3C]">
            {isBefore ? (
              <>
                This draft shows you understand <span className="font-extrabold text-[#A560E8]">Get Out</span> in relation to race and power, and you bring in serious sources (Bonilla-Silva, Sue et al.). The grade sits in the B range because the{' '}
                <span className="font-extrabold text-[#FF4B4B]">thesis wanders</span>, several paragraphs read as plot recap, and{' '}
                <span className="font-extrabold text-[#FF4B4B]">MLA citations are inconsistent</span>. Addressing those three areas typically moves a paper like this into the A band.
              </>
            ) : (
              <>
                After revision, the essay opens with a <span className="font-extrabold text-[#58CC02]">single, debatable claim</span>, keeps analysis ahead of summary, and pairs each major scene with one scholarly anchor. Citations are cleaned up, and the conclusion tightens the "so what" without repeating the introduction. This is representative of the depth you get in a full WriteScholar report, not a single paragraph of generic praise.
              </>
            )}
          </p>
          <p className="text-sm leading-relaxed text-[#777] mt-3">
            {isBefore ? (
              <>
                You receive <strong className="font-extrabold text-[#3C3C3C]">dozens of inline annotations</strong> plus this overview: category scores, clarity label, prioritized fixes, and (in the full export) category-by-category strengths and concerns. Nothing here is "one sentence and done."
              </>
            ) : (
              <>
                The full product adds <strong className="font-extrabold text-[#3C3C3C]">exportable narrative sections</strong> (academic writing quality, citations, argument structure, grammar, content depth) with quoted lines from your draft, matching the interactive demo below.
              </>
            )}
          </p>
        </div>

        <div className="rounded-2xl border-2 border-b-4 border-[#E5E5E5] bg-white p-3">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#AFAFAF] mb-2">Rubric breakdown (excerpt)</p>
          <div className="space-y-2">
            {rubricRows.map((row) => (
              <div key={row.name} className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 border-b border-[#E5E5E5] pb-2 last:border-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-extrabold text-[#3C3C3C]">{row.name}</p>
                  <p className="text-[11px] text-[#777] leading-snug mt-0.5">{row.feedback}</p>
                </div>
                <span className="text-xs font-extrabold tabular-nums text-[#3C3C3C] shrink-0 sm:ml-2">
                  {row.score}/{row.maxScore}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span
            className={`inline-flex items-center rounded-xl px-2.5 py-1 text-xs font-extrabold border-2 ${
              isBefore
                ? 'bg-[#FFE8E8] text-[#FF4B4B] border-[#FF4B4B]'
                : 'bg-[#E5F8D0] text-[#58CC02] border-[#58CC02]'
            }`}
          >
            Clarity: {isBefore ? 'Needs work' : 'Strong'}
          </span>
          <span className="inline-flex items-center rounded-xl px-2.5 py-1 text-xs font-extrabold border-2 border-[#E5E5E5] bg-white text-[#777]">
            {isBefore ? '24+ inline notes on this draft' : 'Fewer "revise" flags; more "strong" spans'}
          </span>
          <span className="inline-flex items-center rounded-xl px-2.5 py-1 text-xs font-extrabold border-2 border-[#E5E5E5] bg-white text-[#777]">
            Word count: {isBefore ? '~1,619' : '~1,620'}
          </span>
        </div>

        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#AFAFAF] mb-2">What we prioritize next</p>
          <ul className="text-sm text-[#777] space-y-2.5 list-disc list-inside leading-snug">
            {isBefore ? (
              <>
                <li>
                  <span className="font-extrabold text-[#3C3C3C]">Thesis &amp; roadmap:</span> Name your argument about the film in one sentence; use topic sentences to show how each paragraph proves it.
                </li>
                <li>
                  <span className="font-extrabold text-[#3C3C3C]">Evidence &amp; MLA:</span> Every paraphrase needs author + page; align Works Cited with in-text names.
                </li>
                <li>
                  <span className="font-extrabold text-[#3C3C3C]">Analysis vs. summary:</span> After you describe a scene, add a sentence that states what it does for your argument.
                </li>
                <li>
                  <span className="font-extrabold text-[#3C3C3C]">Grammar &amp; cohesion:</span> Break up run-ons; check subject-verb agreement in long sentences.
                </li>
              </>
            ) : (
              <>
                <li>
                  <span className="font-extrabold text-[#3C3C3C]">Maintain the pattern:</span> Keep thesis → topic sentence → evidence → link to theory in each body section.
                </li>
                <li>
                  <span className="font-extrabold text-[#3C3C3C]">Optional depth:</span> Shorten one dense paragraph in the microaggressions section for readability.
                </li>
                <li>
                  <span className="font-extrabold text-[#3C3C3C]">Citation polish:</span> Double-check italics for film title in Works Cited if your course requires it.
                </li>
                <li>
                  <span className="font-extrabold text-[#3C3C3C]">Final pass:</span> Read aloud once for rhythm. You are now editing at the line level, not restructuring.
                </li>
              </>
            )}
          </ul>
        </div>

        <div className="rounded-xl border-2 border-dashed border-[#E5E5E5] bg-[#FAFAFA] px-3 py-2.5">
          <p className="text-[11px] text-[#777] leading-snug">
            <span className="font-extrabold text-[#3C3C3C]">Also included in a real run:</span> seriousness-ordered concerns, suggested rewrites per highlight, priority recommendations, and a downloadable report. The mock above is only the summary panel.
          </p>
        </div>
      </div>
    </div>
  );
}

function SupplementalTextMock({ kind }: { kind: 'citations' | 'legend' | 'inline' }) {
  if (kind === 'citations') {
    return (
      <div className="rounded-2xl border-2 border-b-4 border-[#E5E5E5] bg-white p-4 sm:p-5 h-full flex flex-col text-left" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#AFAFAF] mb-2">In-text + Works cited (MLA)</p>
        <p className="text-xs text-[#777] mb-3 leading-snug">
          WriteScholar flags mismatches between what you cite in the body and what appears in Works Cited so you do not lose marks on formatting.
        </p>
        <div className="rounded-xl bg-[#FAFAFA] px-3 py-2.5 mb-3 border-2 border-[#E5E5E5]">
          <p className="text-[10px] font-extrabold text-[#AFAFAF] uppercase mb-1">Body (example)</p>
          <p className="font-mono text-[11px] text-[#3C3C3C] leading-relaxed">
            Bonilla-Silva argues that racism is often embedded in everyday routines rather than expressed only as slurs (3).
          </p>
        </div>
        <div className="space-y-2 font-mono text-[11px] text-[#3C3C3C] leading-relaxed flex-1 border-t-2 border-[#E5E5E5] pt-3">
          <p>
            <span className="text-[#AFAFAF] not-italic font-sans text-[10px] uppercase block mb-1">Works cited</span>
            Bonilla-Silva, Eduardo. <em>Racism Without Racists: Color-Blind Racism and the Persistence of Racial Inequality in America</em>. 6th ed., Rowman &amp; Littlefield, 2022.
          </p>
          <p>
            Peele, Jordan, director. <em>Get Out</em>. Universal Pictures, 2017.
          </p>
        </div>
        <p className="text-xs font-extrabold text-[#1CB0F6] mt-4 pt-3 border-t-2 border-[#E5E5E5] leading-snug">
          Aligned citations: suggested sources that fit your actual sentences, exported in APA / MLA / Chicago.
        </p>
      </div>
    );
  }
  if (kind === 'legend') {
    return (
      <div className="rounded-2xl border-2 border-b-4 border-[#E5E5E5] bg-white p-4 sm:p-5 h-full flex flex-col text-left" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#AFAFAF] mb-2">Annotation map</p>
        <p className="text-xs text-[#777] mb-3 leading-snug">
          Each color is a different job: celebrate what works, tighten weak analysis, or fix serious issues before submission.
        </p>
        <div className="flex flex-wrap gap-1.5 mb-4">
          <span className="inline-flex items-center gap-1 rounded-xl pl-1 pr-2 py-0.5 text-[10px] font-extrabold border-2 border-[#58CC02] bg-[#E5F8D0] text-[#58CC02]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#58CC02]" /> Strong (8+)
          </span>
          <span className="inline-flex items-center gap-1 rounded-xl pl-1 pr-2 py-0.5 text-[10px] font-extrabold border-2 border-[#FF9600] bg-[#FFF4E0] text-[#FF9600]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF9600]" /> Improve (15+)
          </span>
          <span className="inline-flex items-center gap-1 rounded-xl pl-1 pr-2 py-0.5 text-[10px] font-extrabold border-2 border-[#FF4B4B] bg-[#FFE8E8] text-[#FF4B4B]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF4B4B]" /> Concern (9+)
          </span>
        </div>
        <div className="rounded-xl border-2 border-[#E5E5E5] bg-[#FAFAFA] px-3 py-2.5 text-xs text-[#777] leading-snug flex-1">
          <span className="font-extrabold text-[#3C3C3C]">Tip:</span> Hover or tap any highlight to open the same comment you would see in the margin of a graded paper: feedback text, plus a suggested revision when something is off.
        </div>
        <p className="text-xs font-extrabold text-[#1CB0F6] mt-4 pt-3 border-t-2 border-[#E5E5E5]">
          Sentence-level map across the whole draft
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border-2 border-b-4 border-[#E5E5E5] bg-white p-4 sm:p-5 h-full text-left flex flex-col" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
      <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#AFAFAF] mb-2">Inline rewrite</p>
      <p className="text-xs text-[#777] mb-3 leading-snug">
        Amber highlights include a concrete "try this instead" line — not just "be clearer."
      </p>
      <div className="rounded-xl border-2 border-[#FF9600] bg-[#FFF4E0] px-3 py-2 mb-2">
        <p className="text-[10px] font-extrabold text-[#FF9600] uppercase mb-1">Flagged</p>
        <p className="text-sm text-[#3C3C3C] leading-snug">
          This is because, they are the top of the hierarchy in our society and we see them in much of the high-power jobs…
        </p>
      </div>
      <div className="rounded-xl border-2 border-[#58CC02] bg-[#E5F8D0] px-3 py-2 flex-1">
        <p className="text-[10px] font-extrabold text-[#58CC02] uppercase mb-1">Suggested revision</p>
        <p className="text-sm text-[#3C3C3C] leading-snug">
          Bonilla-Silva describes how white elites remain overrepresented in high-status roles, which helps explain why the Armitage family's guests treat the auction as normal (3).
        </p>
      </div>
      <p className="text-xs font-extrabold text-[#1CB0F6] mt-4 pt-3 border-t-2 border-[#E5E5E5] leading-snug">
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
      className="relative w-full min-w-0 sm:-mx-6 lg:-mx-8 scroll-mt-24 border-t-2 border-b-2 border-[#E5E5E5] bg-white py-12 sm:py-24 overflow-x-clip overflow-hidden"
      aria-labelledby="before-after-heading"
      style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
    >
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <LandingScrollReveal>
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <span className="inline-block px-4 py-1.5 rounded-xl text-xs font-extrabold tracking-wide uppercase text-[#A560E8] bg-[#F3EAFF] border-2 border-b-4 border-[#A560E8] mb-5">
            Before &amp; after
          </span>
          <h2
            id="before-after-heading"
            className="text-[1.75rem] sm:text-3xl lg:text-[2.35rem] font-extrabold text-[#3C3C3C] tracking-tight mb-4 leading-tight"
            style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
          >
            Turn a Mid-B Essay Into an A
          </h2>
          <p className="text-base sm:text-lg text-[#777] leading-relaxed">
            Real improvements based on structure, argument, and clarity. Below: report-style summaries, rubric lines, and citation-aligned feedback—how professors actually grade.
          </p>
        </div>

        <div className="space-y-16 sm:space-y-20">
          <div>
            <div className="mb-6 sm:mb-8 text-center sm:text-left max-w-2xl mx-auto sm:mx-0">
              <h3 className="text-lg sm:text-xl font-extrabold text-[#3C3C3C] mb-1" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
                Comprehensive academic analysis
              </h3>
              <p className="text-sm sm:text-base text-[#777]">
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
        <div className="mt-16 sm:mt-20 pt-12 sm:pt-14 border-t-2 border-[#E5E5E5]">
          <h3 className="text-center text-sm font-extrabold uppercase tracking-[0.18em] text-[#AFAFAF] mb-2">
            Citations &amp; sentence work
          </h3>
          <p className="text-center text-sm text-[#777] max-w-2xl mx-auto mb-8 leading-relaxed">
            Three slices of what "aligned citations" and inline feedback mean in practice, not decorative UI.
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
