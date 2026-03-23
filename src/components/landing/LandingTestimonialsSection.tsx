import LandingScrollReveal from './LandingScrollReveal';

const TESTIMONIALS: { name: string; text: string }[] = [
  {
    name: 'Priya N.',
    text:
      'The essay analyzer flagged weak transitions I kept skipping. I fixed them before the due date and my rubric score went up.',
  },
  {
    name: 'Marcus L.',
    text:
      'I use Write Scholar for the citation finder. I put in my topic, get refs that look like real journal entries, and paste APA without digging through databases for an hour.',
  },
  {
    name: 'Elena V.',
    text:
      'English isn’t my first language. The comments on clarity were concrete: swap this word, tighten that sentence. My TA said the draft sounded smoother.',
  },
  {
    name: 'James O.',
    text:
      'Study Pack made flashcards from my sloppy notes. I actually reviewed them instead of staring at a blank doc at midnight.',
  },
  {
    name: 'Aisha R.',
    text:
      'Each citation came with a short note on why the source fit my paper. Helped my lit review read like an argument, not a list of quotes.',
  },
  {
    name: 'Tomás G.',
    text:
      'I expected another generic chatbot. This one stays on structure, citations, and due dates. I pay for Pro and I use it.',
  },
];

function InitialAvatar({ name }: { name: string }) {
  const letter = name.trim().charAt(0).toUpperCase() || '?';
  const hues = [
    'bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-200 border-violet-200/80 dark:border-violet-800/50',
    'bg-teal-100 text-teal-800 dark:bg-teal-950/50 dark:text-teal-200 border-teal-200/80 dark:border-teal-800/50',
    'bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200 border-amber-200/80 dark:border-amber-800/50',
    'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200 border-rose-200/80 dark:border-rose-800/50',
    'bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200 border-sky-200/80 dark:border-sky-800/50',
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200 border-emerald-200/80 dark:border-emerald-800/50',
  ];
  const idx = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % hues.length;

  return (
    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${hues[idx]}`}
      aria-hidden
    >
      {letter}
    </div>
  );
}

export default function LandingTestimonialsSection() {
  return (
    <section
      className="relative py-16 sm:py-24 overflow-hidden border-t border-stone-200/90 dark:border-stone-800 scroll-mt-20"
      aria-labelledby="landing-testimonials-heading"
    >
      <div className="absolute inset-0 bg-white dark:bg-stone-950/80" aria-hidden />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(91,33,182,0.06),transparent_55%)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-8%,rgba(109,40,217,0.1),transparent_55%)] pointer-events-none"
        aria-hidden
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <LandingScrollReveal>
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-14">
          <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-violet-800/90 dark:text-violet-300/95 mb-3">
            Student stories
          </p>
          <h2
            id="landing-testimonials-heading"
            className="text-2xl sm:text-3xl lg:text-[2.15rem] font-semibold text-stone-900 dark:text-stone-100 mb-4 tracking-tight leading-tight px-2"
            style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
          >
            Join the{' '}
            <span className="text-violet-700 dark:text-violet-400">50,000+ students</span> who’ve transformed their writing
          </h2>
          <p className="text-base sm:text-lg text-stone-600 dark:text-stone-400 leading-relaxed">
            Essays, citations, and revision passes that match how assignments actually get graded.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {TESTIMONIALS.map((t) => (
            <blockquote
              key={t.name}
              className="rounded-2xl border border-stone-200/90 dark:border-stone-700/90 bg-white/80 dark:bg-stone-900/50 p-5 sm:p-6 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.1)] dark:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.35)] ring-1 ring-black/[0.03] dark:ring-white/[0.04]"
            >
              <div className="flex items-start gap-3 mb-4">
                <InitialAvatar name={t.name} />
                <footer className="min-w-0 pt-0.5">
                  <cite className="not-italic font-semibold text-stone-900 dark:text-stone-100 text-sm sm:text-base block">
                    {t.name}
                  </cite>
                </footer>
              </div>
              <p className="text-sm sm:text-[15px] text-stone-700 dark:text-stone-300 leading-relaxed text-left">
                “{t.text}”
              </p>
            </blockquote>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-stone-500 dark:text-stone-500 max-w-2xl mx-auto">
          Sample quotes only. Not from real customers.
        </p>
        </LandingScrollReveal>
      </div>
    </section>
  );
}
