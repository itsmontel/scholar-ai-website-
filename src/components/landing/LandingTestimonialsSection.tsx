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
      'English isn\'t my first language. The comments on clarity were concrete: swap this word, tighten that sentence. My TA said the draft sounded smoother.',
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

const AVATAR_COLORS = [
  { bg: 'bg-[#F3EAFF]', text: 'text-[#A560E8]', border: 'border-[#A560E8]' },
  { bg: 'bg-[#E5F8D0]', text: 'text-[#58CC02]', border: 'border-[#58CC02]' },
  { bg: 'bg-[#FFF4E0]', text: 'text-[#FF9600]', border: 'border-[#FF9600]' },
  { bg: 'bg-[#FFE8E8]', text: 'text-[#FF4B4B]', border: 'border-[#FF4B4B]' },
  { bg: 'bg-[#DDF4FF]', text: 'text-[#1CB0F6]', border: 'border-[#1CB0F6]' },
  { bg: 'bg-[#E5F8D0]', text: 'text-[#58CC02]', border: 'border-[#58CC02]' },
];

function InitialAvatar({ name }: { name: string }) {
  const letter = name.trim().charAt(0).toUpperCase() || '?';
  const idx = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length;
  const color = AVATAR_COLORS[idx];

  return (
    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-b-4 text-sm font-extrabold ${color.bg} ${color.text} ${color.border}`}
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
        <svg key={i} className="w-4 h-4 text-[#FF9600]" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function LandingTestimonialsSection() {
  return (
    <section
      className="relative py-16 sm:py-24 overflow-hidden border-t-2 border-[#E5E5E5] scroll-mt-20 bg-white"
      aria-labelledby="landing-testimonials-heading"
      style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
    >
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <LandingScrollReveal>
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-14">
          <span className="inline-block px-4 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-[0.22em] text-[#1CB0F6] bg-[#DDF4FF] border-2 border-b-4 border-[#1CB0F6] mb-4">
            Student stories
          </span>
          <h2
            id="landing-testimonials-heading"
            className="text-2xl sm:text-3xl lg:text-[2.15rem] font-extrabold text-[#3C3C3C] mb-4 tracking-tight leading-tight px-2"
            style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
          >
            Join the{' '}
            <span className="text-[#58CC02]">50,000+ students</span> who've transformed their writing
          </h2>
          <p className="text-base sm:text-lg text-[#777] leading-relaxed">
            Essays, citations, and revision passes that match how assignments actually get graded.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {TESTIMONIALS.map((t, idx) => {
            const color = AVATAR_COLORS[idx % AVATAR_COLORS.length];
            return (
              <blockquote
                key={t.name}
                className="rounded-2xl border-2 border-b-4 border-[#E5E5E5] bg-white p-5 sm:p-6"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <InitialAvatar name={t.name} />
                    <footer className="min-w-0 pt-0.5">
                      <cite className="not-italic font-extrabold text-[#3C3C3C] text-sm sm:text-base block">
                        {t.name}
                      </cite>
                    </footer>
                  </div>
                  <StarRating />
                </div>
                <p className="text-sm sm:text-[15px] text-[#777] leading-relaxed text-left">
                  "{t.text}"
                </p>
              </blockquote>
            );
          })}
        </div>

        <p className="mt-8 text-center text-xs text-[#AFAFAF] max-w-2xl mx-auto">
          Sample quotes only. Not from real customers.
        </p>
        </LandingScrollReveal>
      </div>
    </section>
  );
}
