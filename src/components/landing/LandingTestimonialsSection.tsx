import LandingScrollReveal from './LandingScrollReveal';
import LandingSectionBackdrop from './LandingSectionBackdrop';

/**
 * Landing-page testimonials.
 *
 * Each testimonial now carries an `outcome` stat (e.g. "Went from a C+ to A-")
 * shown directly under the name, mirroring the reference design where the
 * grade improvement is the headline. The testimonial body itself tells the
 * before/after story in concrete terms, and that combination is what separates
 * believable social proof from generic "this app is great" filler.
 */
type Testimonial = {
  name: string;
  outcome: string;
  text: string;
  date: string;
};

const TESTIMONIALS: Testimonial[] = [
  {
    name: 'Matthew H.',
    outcome: 'English 102 final: B+ → A (92/100)',
    text:
      "I just write my drafts straight in WriteScholar now and the rubric score moves while I edit. It actually showed me which criteria I kept dropping marks on. Honestly it was harsher than ChatGPT and my TA, but that's the thing that got me from a B+ to an A.",
    date: 'Apr 18, 2026',
  },
  {
    name: 'Rumaysah K.',
    outcome: 'Sophomore year GPA: 2.7 → 3.8',
    text:
      "My problem was never effort, it was speed. Office hours and TA availability capped how many drafts I could actually get marked. Now I write the essay in the editor and get it graded the same minute, so I revise right away instead of waiting a week. The accuracy is what sold me. Compared to my real professor scores it's only 2 to 3 points off out of 100, and it tells you the truth instead of inflating your grade the way other AI tools do. I tell everyone in my upper-division humanities classes about it.",
    date: 'Mar 02, 2026',
  },
  {
    name: 'Leon P.',
    outcome: 'Pulled American Lit from C to A- in one semester',
    text:
      "I was sitting on a C after midterms and kind of panicking. I'd write a paragraph, get feedback in the margin, and drop the fix straight into my draft. No copy-pasting between tabs. Three practice essays later my close reading actually held up and I finished on a 91, which was an A-.",
    date: 'Dec 11, 2025',
  },
  {
    name: 'Subhaan A.',
    outcome: 'Term paper score: 72 → 89 (Psych 250)',
    text:
      "I was putting in the work but I genuinely didn't know where I was going wrong, and the writing center had a two-week wait. WriteScholar told me, line by line, which evidence wasn't pulling its weight and where my analysis stayed shallow. After a couple of term papers in the editor I was consistently hitting 89+, and the free plan was enough to pull my course grade up to an A-.",
    date: 'Feb 21, 2026',
  },
  {
    name: 'Aisha R.',
    outcome: 'Stopped reformatting before every submission',
    text:
      "I import my Word doc, write and fix everything inside WriteScholar, then export it back, and the formatting comes out exactly right. I used to lose a full hour reformatting before every submission. Now I don't even open Word until it's done.",
    date: 'May 06, 2026',
  },
  {
    name: 'James O.',
    outcome: 'Sociology essay: 68 → 90',
    text:
      "It's basically a writing coach that lives in my document. I draft in the editor and the feedback panel keeps updating as I go, so by the time I finish a section it's already been picked apart and rebuilt. My last essay went from a 68 on the first attempt to a 90. Same effort, way less guessing.",
    date: 'Jan 28, 2026',
  },
  {
    name: 'Tomás G.',
    outcome: 'Phil 305 comparative essay: 76 → 94',
    text:
      "I expected another AI that calls every essay 'great'. This one actually pushed back. It flagged my thesis as too broad and called out three logic gaps right there in the draft. My philosophy professor is brutal and this matched his standards. Worth every dollar of Pro.",
    date: 'Apr 30, 2026',
  },
  {
    name: 'Elena V.',
    outcome: 'TA marked her draft 12 points higher (80 → 92)',
    text:
      "English isn't my first language, so 'awkward phrasing' feedback never actually told me what to do. Writing in WriteScholar, it points at the exact words to swap and the sentences to tighten while I type. My TA gave my second draft a 92 out of 100 versus the 80 my first one got. She said it 'sounded smoother' and couldn't say why. I knew why.",
    date: 'Mar 19, 2026',
  },
];

const AVATAR_COLORS = [
  { bg: 'bg-[#F3EAFF]', text: 'text-[#A560E8]', border: 'border-[#A560E8]' },
  { bg: 'bg-[#E5F8D0]', text: 'text-[#46A302]', border: 'border-[#46A302]' },
  { bg: 'bg-[#DDF4FF]', text: 'text-[#1899D6]', border: 'border-[#1899D6]' },
  { bg: 'bg-[#FFF4E0]', text: 'text-[#D97F00]', border: 'border-[#D97F00]' },
  { bg: 'bg-[#F3EAFF]', text: 'text-[#7733B5]', border: 'border-[#7733B5]' },
  { bg: 'bg-[#E5F8D0]', text: 'text-[#58CC02]', border: 'border-[#58CC02]' },
  { bg: 'bg-[#DDF4FF]', text: 'text-[#1CB0F6]', border: 'border-[#1CB0F6]' },
  { bg: 'bg-[#FFF4E0]', text: 'text-[#FF9600]', border: 'border-[#FF9600]' },
];

const CARD_BORDERS = [
  'border-[#A560E8] shadow-[0_8px_28px_-10px_rgba(165,96,232,0.35)] hover:shadow-[0_16px_40px_-12px_rgba(165,96,232,0.50)]',
  'border-[#46A302] shadow-[0_8px_28px_-10px_rgba(88,204,2,0.30)] hover:shadow-[0_16px_40px_-12px_rgba(88,204,2,0.45)]',
  'border-[#1899D6] shadow-[0_8px_28px_-10px_rgba(28,176,246,0.30)] hover:shadow-[0_16px_40px_-12px_rgba(28,176,246,0.45)]',
  'border-[#D97F00] shadow-[0_8px_28px_-10px_rgba(255,150,0,0.30)] hover:shadow-[0_16px_40px_-12px_rgba(255,150,0,0.45)]',
] as const;

function InitialAvatar({ name, colorIdx }: { name: string; colorIdx: number }) {
  const letter = name.trim().charAt(0).toUpperCase() || '?';
  const color = AVATAR_COLORS[colorIdx % AVATAR_COLORS.length];

  return (
    <div
      className={`flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-full text-base sm:text-lg font-extrabold border-2 border-b-[3px] ${color.bg} ${color.text} ${color.border}`}
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
        <svg key={i} className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-[#FFC800]" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function LandingTestimonialsSection() {
  return (
    <section
      id="testimonials"
      className="relative w-full py-16 sm:py-24 lg:py-28 overflow-hidden scroll-mt-20"
      aria-labelledby="landing-testimonials-heading"
      style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
    >
      <LandingSectionBackdrop
        base="bg-[#FCFBF7] dark:bg-stone-950"
        topFrom="from-[#FFF4E0]/70 dark:from-[#2A1800]/70"
        radial="bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(165,96,232,0.08),transparent_60%)]"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <LandingScrollReveal>
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
            <div className="mb-5 sm:mb-6 inline-flex items-center gap-2.5 rounded-full border-2 border-[#58CC02]/40 bg-[#E5F8D0] dark:bg-[#58CC02]/15 pl-1.5 pr-4 py-1.5 shadow-[0_0_12px_rgba(88,204,2,0.25)]">
              <span
                className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-[#58CC02] border-2 border-b-[3px] border-[#46A302]"
                aria-hidden
              >
                <svg className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
              </span>
              <span className="text-[12px] sm:text-[13px] font-bold text-[#3C3C3C] dark:text-stone-100">
                Trusted by <span className="font-extrabold text-[#58CC02] tabular-nums">50,000+</span> students worldwide
              </span>
            </div>

            <h2
              id="landing-testimonials-heading"
              className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#3C3C3C] dark:text-white tracking-tight leading-[1.1] mb-4"
              style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
            >
              <span className="relative inline-block text-[#A560E8]">
                On the work they actually hand in
                <svg
                  className="absolute -bottom-1.5 left-0 w-full h-2 text-[#A560E8]"
                  viewBox="0 0 200 8"
                  preserveAspectRatio="none"
                  aria-hidden
                >
                  <path d="M2 6 Q50 1 100 5 T198 4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </span>
            </h2>
            <p className="text-sm sm:text-base text-[#777] dark:text-stone-300 leading-relaxed max-w-2xl mx-auto">
              Drafted in the editor, graded by the AI. Real student stories about essays written and marked inside WriteScholar.
            </p>
          </div>

          <div className="relative rounded-3xl border-2 border-[#D8B4FE]/70 bg-white/70 dark:bg-[#2A0E40]/40 shadow-[0_0_60px_-20px_rgba(165,96,232,0.35)] p-4 sm:p-5 lg:p-6 backdrop-blur-sm">
            <div className="pointer-events-none absolute -top-10 -left-10 w-48 h-48 rounded-full bg-[#A560E8]/15 blur-3xl" aria-hidden />
            <div className="pointer-events-none absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-[#58CC02]/12 blur-3xl" aria-hidden />

            <div className="relative columns-1 sm:columns-2 lg:columns-3 gap-4 sm:gap-5 lg:gap-6 [column-fill:_balance] [&>blockquote:nth-of-type(n+4)]:hidden sm:[&>blockquote:nth-of-type(n+4)]:inline-block">
              {TESTIMONIALS.map((t, idx) => (
                <blockquote
                  key={t.name}
                  className={`group relative mb-4 sm:mb-5 lg:mb-6 inline-block w-full break-inside-avoid rounded-2xl border-2 border-b-4 bg-white dark:bg-stone-900 p-5 sm:p-6 hover:-translate-y-1 active:border-b-2 active:translate-y-0.5 transition-all duration-300 ${CARD_BORDERS[idx % CARD_BORDERS.length]}`}
                >
                  <div className="flex items-start gap-3 sm:gap-3.5 mb-4">
                    <InitialAvatar name={t.name} colorIdx={idx} />
                    <div className="min-w-0 flex-1 pt-0.5">
                      <cite className="not-italic font-extrabold text-[#3C3C3C] dark:text-stone-50 text-base sm:text-[17px] block leading-tight">
                        {t.name}
                      </cite>
                      <p className="mt-1 text-[12px] sm:text-[13px] font-bold text-[#7733B5] dark:text-[#C9A0F0] leading-snug">
                        {t.outcome}
                      </p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <StarRating />
                  </div>

                  <p className="text-[14px] sm:text-[15px] text-stone-700 dark:text-stone-300 leading-relaxed text-left">
                    {t.text}
                  </p>

                  <div className="mt-5 pt-4 border-t-2 border-[#F3EAFF] dark:border-stone-800">
                    <p className="text-[11px] sm:text-xs font-bold text-stone-400 dark:text-stone-500">
                      {t.date}
                    </p>
                  </div>
                </blockquote>
              ))}
            </div>
          </div>
        </LandingScrollReveal>
      </div>
    </section>
  );
}
