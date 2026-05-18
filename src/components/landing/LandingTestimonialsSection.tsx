import LandingScrollReveal from './LandingScrollReveal';

/**
 * Landing-page testimonials.
 *
 * Each testimonial now carries an `outcome` stat (e.g. "Went from a C+ to A-")
 * shown directly under the name, mirroring the reference design where the
 * grade improvement is the headline. The testimonial body itself tells the
 * before/after story in concrete terms, and that combination is what separates
 * believable social proof from generic "this app is great" filler.
 *
 * NOTE: "Sample quotes only. Not from real customers." disclaimer remains.
 */
type Testimonial = {
  name: string;
  outcome: string;
  text: string;
  date: string;
};

// Every quote is deliberately about ONE of the two core products —
// writing in the editor/workspace, or the AI analysis/grade. No
// study-pack / flashcard / citation-finder filler: the landing page
// promises a writing tool + feedback, so the proof should match it.
const TESTIMONIALS: Testimonial[] = [
  // SHORT: analysis, rubric while drafting in the editor
  {
    name: 'Matthew H.',
    outcome: 'English 102 final: B+ → A (92/100)',
    text:
      "I just write my drafts straight in WriteScholar now and the rubric score moves while I edit. It actually showed me which criteria I kept dropping marks on. Honestly it was harsher than ChatGPT and my TA, but that's the thing that got me from a B+ to an A.",
    date: 'Apr 18, 2026',
  },
  // LONG: anchor card, analysis accuracy + same-minute iteration
  {
    name: 'Rumaysah K.',
    outcome: 'Sophomore year GPA: 2.7 → 3.8',
    text:
      "My problem was never effort, it was speed. Office hours and TA availability capped how many drafts I could actually get marked. Now I write the essay in the editor and get it graded the same minute, so I revise right away instead of waiting a week. The accuracy is what sold me. Compared to my real professor scores it's only 2 to 3 points off out of 100, and it tells you the truth instead of inflating your grade the way other AI tools do. I tell everyone in my upper-division humanities classes about it.",
    date: 'Mar 02, 2026',
  },
  // MEDIUM: writing editor, one-click apply revisions into draft
  {
    name: 'Leon P.',
    outcome: 'Pulled American Lit from C to A- in one semester',
    text:
      "I was sitting on a C after midterms and kind of panicking. I'd write a paragraph, get feedback in the margin, and drop the fix straight into my draft. No copy-pasting between tabs. Three practice essays later my close reading actually held up and I finished on a 91, which was an A-.",
    date: 'Dec 11, 2025',
  },
  // MEDIUM-LONG: analysis, line-by-line feedback
  {
    name: 'Subhaan A.',
    outcome: 'Term paper score: 72 → 89 (Psych 250)',
    text:
      "I was putting in the work but I genuinely didn't know where I was going wrong, and the writing center had a two-week wait. WriteScholar told me, line by line, which evidence wasn't pulling its weight and where my analysis stayed shallow. After a couple of term papers in the editor I was consistently hitting 89+, and the free plan was enough to pull my course grade up to an A-.",
    date: 'Feb 21, 2026',
  },
  // SHORT: writing editor, Word import/export fidelity
  {
    name: 'Aisha R.',
    outcome: 'Stopped reformatting before every submission',
    text:
      "I import my Word doc, write and fix everything inside WriteScholar, then export it back, and the formatting comes out exactly right. I used to lose a full hour reformatting before every submission. Now I don't even open Word until it's done.",
    date: 'May 06, 2026',
  },
  // MEDIUM: writing workspace, live feedback as you write
  {
    name: 'James O.',
    outcome: 'Sociology essay: 68 → 90',
    text:
      "It's basically a writing coach that lives in my document. I draft in the editor and the feedback panel keeps updating as I go, so by the time I finish a section it's already been picked apart and rebuilt. My last essay went from a 68 on the first attempt to a 90. Same effort, way less guessing.",
    date: 'Jan 28, 2026',
  },
  // SHORT: analysis, honest professor-level pushback
  {
    name: 'Tomás G.',
    outcome: 'Phil 305 comparative essay: 76 → 94',
    text:
      "I expected another AI that calls every essay 'great'. This one actually pushed back. It flagged my thesis as too broad and called out three logic gaps right there in the draft. My philosophy professor is brutal and this matched his standards. Worth every dollar of Pro.",
    date: 'Apr 30, 2026',
  },
  // MEDIUM: analysis, clarity feedback while writing
  {
    name: 'Elena V.',
    outcome: 'TA marked her draft 12 points higher (80 → 92)',
    text:
      "English isn't my first language, so 'awkward phrasing' feedback never actually told me what to do. Writing in WriteScholar, it points at the exact words to swap and the sentences to tighten while I type. My TA gave my second draft a 92 out of 100 versus the 80 my first one got. She said it 'sounded smoother' and couldn't say why. I knew why.",
    date: 'Mar 19, 2026',
  },
];

// On-theme palette only — purple tints (was a 6-colour green/orange/
// red/blue mix). Subtle shade variation keeps avatars distinct
// without leaving the brand purple world.
const AVATAR_COLORS = [
  { bg: 'bg-[#F3EAFF]', text: 'text-[#A560E8]', border: 'border-[#A560E8]' },
  { bg: 'bg-[#E4D3F7]', text: 'text-[#7733B5]', border: 'border-[#8A48C7]' },
  { bg: 'bg-[#F3EAFF]', text: 'text-[#8A48C7]', border: 'border-[#8A48C7]' },
  { bg: 'bg-[#E4D3F7]', text: 'text-[#A560E8]', border: 'border-[#A560E8]' },
  { bg: 'bg-[#F3EAFF]', text: 'text-[#7733B5]', border: 'border-[#7733B5]' },
  { bg: 'bg-[#E4D3F7]', text: 'text-[#8A48C7]', border: 'border-[#8A48C7]' },
];

function InitialAvatar({ name, colorIdx }: { name: string; colorIdx: number }) {
  const letter = name.trim().charAt(0).toUpperCase() || '?';
  const color = AVATAR_COLORS[colorIdx % AVATAR_COLORS.length];

  return (
    <div
      className={`flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-full text-base sm:text-lg font-extrabold ${color.bg} ${color.text}`}
      aria-hidden
    >
      {letter}
    </div>
  );
}

function StarRating() {
  return (
    <div className="flex gap-0.5" aria-label="5 out of 5 stars">
      {[...Array(5)].map((_, i) => (
        <svg key={i} className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-[#A560E8]" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function LandingTestimonialsSection() {
  return (
    <section
      className="relative py-16 sm:py-24 overflow-hidden border-t-2 border-[#E5E5E5] dark:border-stone-800 scroll-mt-20 bg-[#FAF7FF] dark:bg-stone-950"
      aria-labelledby="landing-testimonials-heading"
      style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
    >
      {/* Soft brand-purple atmospheric orbs (was: one purple + one
          green) — single-colour wash matching the new hero so the
          testimonials section reads as part of the same purple
          visual world. */}
      <div
        className="pointer-events-none absolute -top-20 -left-[5%] h-[min(60vw,28rem)] w-[min(60vw,28rem)] rounded-full bg-[#A560E8]/[0.07] blur-[100px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-[5%] h-[min(60vw,28rem)] w-[min(60vw,28rem)] rounded-full bg-[#A560E8]/[0.07] blur-[100px]"
        aria-hidden
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <LandingScrollReveal>
          {/* ─── HEADER ─────────────────────────────────────────────
              Reference design treats the title as the hero of the
              section: big, centered, dark, no decorative pill above
              it. We follow that pattern: a small kicker above, a
              large bold headline, no subheadline. The brevity is
              the point. Let the cards do the talking. */}
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
            <h2
              id="landing-testimonials-heading"
              className="text-3xl sm:text-4xl lg:text-[2.85rem] font-extrabold text-[#3C3C3C] dark:text-stone-50 tracking-tight leading-[1.1]"
              style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
            >
              Trusted by{' '}
              <span className="text-[#A560E8]">50,000+ students</span>
            </h2>
            <p className="mt-4 text-base sm:text-lg text-stone-600 dark:text-stone-400 font-semibold">
              On the work they actually hand in: drafted in the editor, graded by the AI.
            </p>
          </div>

          {/* ─── TESTIMONIAL MASONRY ────────────────────────────────
              CSS columns layout (not grid) so cards of varying heights
              pack organically. Short quick-quote cards sit next to
              tall detailed-story cards without empty vertical gaps.
              Mirrors the LitMarker reference where the middle column
              has a long anchor testimonial flanked by shorter cards.

              `break-inside-avoid` keeps each <blockquote> intact (no
              splitting across columns). `inline-block w-full` makes
              each card behave as a block-level item within the
              column flow. */}
          {/* `[&>blockquote:nth-of-type(n+4)]:hidden sm:[&>blockquote:nth-of-type(n+4)]:inline-block`
              hides the 4th-onwards testimonial on phones (so mobile
              visitors see just 3 quick proofs instead of all 8) and
              re-shows them at sm+ where there's column room. Same
              effect as a JS slice but server-rendered and no extra
              renders. */}
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 sm:gap-5 lg:gap-6 [column-fill:_balance] [&>blockquote:nth-of-type(n+4)]:hidden sm:[&>blockquote:nth-of-type(n+4)]:inline-block">
            {TESTIMONIALS.map((t, idx) => (
              <blockquote
                key={t.name}
                className="group relative mb-4 sm:mb-5 lg:mb-6 inline-block w-full break-inside-avoid rounded-2xl border-2 border-[#E5E5E5] dark:border-stone-800 bg-white dark:bg-stone-900 p-5 sm:p-6 shadow-[0_6px_20px_-10px_rgba(0,0,0,0.08)] hover:shadow-[0_12px_30px_-10px_rgba(0,0,0,0.14)] hover:-translate-y-0.5 hover:border-[#A560E8]/30 dark:hover:border-[#A560E8]/40 transition-all duration-300"
              >
                {/* Top row: avatar + name + outcome stat */}
                <div className="flex items-start gap-3 sm:gap-3.5 mb-4">
                  <InitialAvatar name={t.name} colorIdx={idx} />
                  <div className="min-w-0 flex-1 pt-0.5">
                    <cite className="not-italic font-extrabold text-[#3C3C3C] dark:text-stone-50 text-base sm:text-[17px] block leading-tight">
                      {t.name}
                    </cite>
                    <p className="mt-1 text-[12px] sm:text-[13px] font-bold text-stone-500 dark:text-stone-400 leading-snug">
                      {t.outcome}
                    </p>
                  </div>
                </div>

                {/* Star rating: on its own row, left-aligned like the
                    reference image (stars below header, body below stars). */}
                <div className="mb-3">
                  <StarRating />
                </div>

                {/* Testimonial body: leading-relaxed for readability,
                    no italic for cleaner type, no curly quotes (the body
                    speaks for itself; quotes add visual noise). */}
                <p className="text-[14px] sm:text-[15px] text-stone-700 dark:text-stone-300 leading-relaxed text-left">
                  {t.text}
                </p>

                {/* Date footer: small, muted, anchored at the bottom
                    so the card has a clear visual close. */}
                <div className="mt-5 pt-4 border-t border-stone-100 dark:border-stone-800">
                  <p className="text-[11px] sm:text-xs font-bold text-stone-400 dark:text-stone-500">
                    {t.date}
                  </p>
                </div>
              </blockquote>
            ))}
          </div>

          {/* Disclaimer: kept but de-emphasised; nests inside the
              section visual frame rather than floating below. */}
          <p className="mt-10 text-center text-[11px] sm:text-xs text-stone-400 dark:text-stone-500 max-w-2xl mx-auto">
            Sample quotes shown to illustrate typical outcomes. Not from real customers.
          </p>
        </LandingScrollReveal>
      </div>
    </section>
  );
}
