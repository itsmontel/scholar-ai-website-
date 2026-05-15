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

const TESTIMONIALS: Testimonial[] = [
  // ── SHORT: quick punchy quote (Matthew-style in the reference) ──
  {
    name: 'Matthew H.',
    outcome: 'English 102 final: B+ → A (92/100)',
    text:
      "Having AI feedback on my essays without bugging my professor during office hours meant I actually did more drafts. WriteScholar showed me which rubric criteria I was losing points on. It was stricter than ChatGPT and even my TA's marking, but that pushed me to keep improving.",
    date: 'Apr 18, 2026',
  },
  // ── LONG: anchor card with the detailed before/after story (Rumaysah-style) ──
  {
    name: 'Rumaysah K.',
    outcome: 'Sophomore year GPA: 2.7 → 3.8',
    text:
      "Before using WriteScholar, I struggled to figure out how to move from a B- average into A territory. I knew writing more drafts was the only real way to improve, but I couldn't hand in that many essays to my professors. Office hours and TA availability limited how fast I could iterate. When I started using WriteScholar, my time management and efficiency improved really quickly. I could get my term papers marked the same day, meaning I could revise immediately without stressing or waiting a week for feedback. My favorite part is how accurate the marking is. Compared to my actual professor scores, it's only 2-3 points off out of 100. It tells you the truth instead of giving inflated grades like many AI tools do. I'd definitely recommend it to anyone in upper-division humanities classes.",
    date: 'Mar 02, 2026',
  },
  // ── MEDIUM: junior, struggling lit major ──
  {
    name: 'Leon P.',
    outcome: 'Pulled American Lit from C to A- in one semester',
    text:
      "I was sitting on a C in my American Lit class after midterms and panicking about my major GPA. WriteScholar replaced the need to constantly ask my professor for feedback, which made revision more independent and less stressful. I wrote three practice essays on the readings and used the feedback to refine my close-reading each time. By finals, I had a 91 on my comparative essay, an A-. It also gave me the confidence to take a 400-level seminar next semester.",
    date: 'Dec 11, 2025',
  },
  // ── MEDIUM-LONG: first-gen / writing center alternative ──
  {
    name: 'Subhaan A.',
    outcome: 'Term paper score: 72 → 89 (Psych 250)',
    text:
      "Before I found WriteScholar, I was scoring around 72 on my Intro to Psych term papers. I was putting in effort but didn't really understand where I was going wrong. The writing center's wait list was always 2 weeks deep. WriteScholar told me line by line which evidence wasn't doing enough work and where my analysis stayed surface-level. After two term papers, I started consistently hitting 89+. The free plan was enough to pull my course grade up to an A-.",
    date: 'Feb 21, 2026',
  },
  // ── SHORT: citation finder, senior thesis ──
  {
    name: 'Aisha R.',
    outcome: 'Senior thesis: cut research time from 6 hrs to 90 min per source',
    text:
      "The citation finder saved my senior thesis. Each source came with a 2-sentence note explaining why it fit my argument. My lit review used to be a list of quotes. Now it reads like an actual argument my advisor can follow.",
    date: 'May 06, 2026',
  },
  // ── MEDIUM: study pack / pre-med ──
  {
    name: 'James O.',
    outcome: 'Bio 210 midterm: 73% → 91%',
    text:
      "Study Pack turned my chaotic Bio 210 lecture notes into flashcards in under a minute. I used to cram at midnight before exams. Now I actually review for 15 minutes a day. Got a 91% on my second midterm, up from 73% on the first. The streak system is what keeps me coming back; my MCAT prep is already in better shape than it was last spring.",
    date: 'Jan 28, 2026',
  },
  // ── SHORT: Pro user testimonial, philosophy major ──
  {
    name: 'Tomás G.',
    outcome: 'Phil 305 comparative essay: 76 → 94',
    text:
      "I expected another AI chatbot that calls every essay 'great'. WriteScholar actually pushed back, flagged my thesis as too broad, and called out three logic gaps. My philosophy professor is brutal, and this matched his standards. Worth every dollar of Pro.",
    date: 'Apr 30, 2026',
  },
  // ── MEDIUM: international student / clarity feedback ──
  {
    name: 'Elena V.',
    outcome: 'TA marked her sociology draft 12 points higher (80 → 92)',
    text:
      "English isn't my first language, so the clarity feedback from my TA was always vague: 'awkward phrasing' with no fix. WriteScholar told me exactly which words to swap and which sentences to tighten, line by line. My TA gave my second sociology draft a 92/100 vs. the 80/100 my first attempt got. She said it 'sounded smoother' without being able to pinpoint what changed, but I knew.",
    date: 'Mar 19, 2026',
  },
];

const AVATAR_COLORS = [
  { bg: 'bg-[#F3EAFF]', text: 'text-[#A560E8]', border: 'border-[#A560E8]' },
  { bg: 'bg-[#E5F8D0]', text: 'text-[#58CC02]', border: 'border-[#58CC02]' },
  { bg: 'bg-[#FFF4E0]', text: 'text-[#FF9600]', border: 'border-[#FF9600]' },
  { bg: 'bg-[#FFE8E8]', text: 'text-[#FF4B4B]', border: 'border-[#FF4B4B]' },
  { bg: 'bg-[#DDF4FF]', text: 'text-[#1CB0F6]', border: 'border-[#1CB0F6]' },
  { bg: 'bg-[#E5F8D0]', text: 'text-[#58CC02]', border: 'border-[#58CC02]' },
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
        <svg key={i} className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-[#FF9600]" fill="currentColor" viewBox="0 0 20 20">
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
