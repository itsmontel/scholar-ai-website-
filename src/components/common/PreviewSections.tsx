import React from 'react';

/**
 * Preview sections for the dashboard's three feature tools (Analyze,
 * Study Pack, Citations).
 *
 * Originally each preview lived inline inside its respective "create" flow
 * (DashboardPageNew analyze-create, StudyPackPage embedded, CitationsPage
 * embedded). They were extracted here so the SAME preview can also render
 * on each tool's "hub" view between Recent and Quick Access — visitors now
 * see a sample of the output before committing to creating something.
 *
 * One file, three exported components — they're closely related, share the
 * same `embedded` spacing prop, and live or die together. Splitting them
 * into separate files would just spray imports around for no benefit.
 */

interface PreviewSectionProps {
  /**
   * When true, the preview sits inside another panel (dashboard hub or the
   * embedded create flow) and uses tighter top spacing. When false (used on
   * standalone Page renders), the preview gets more generous margins.
   */
  embedded?: boolean;
}

// ============================================================================
// Analysis preview — "See what your analysis looks like"
// ============================================================================

export function AnalysisPreviewSection({ embedded = false }: PreviewSectionProps) {
  return (
    <section
      aria-labelledby="analyze-output-examples-heading"
      className={`rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50 p-4 sm:p-6 ${
        embedded ? 'mt-6 sm:mt-7' : 'mt-8 sm:mt-10'
      }`}
    >
      <h3
        id="analyze-output-examples-heading"
        className="text-center dash-serif text-sm sm:text-base font-extrabold text-stone-800 dark:text-stone-100"
      >
        See what your analysis looks like
      </h3>
      <p className="mt-1 text-center text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 mx-auto px-2 sm:px-0 text-balance max-w-[min(100%,36rem)] font-bold">
        Muted previews for your draft—not canned advice.
      </p>

      {/* All three figure borders use the analyze tool's brand red
          (#FF4B4B) so the preview row reads as part of the same surface
          rather than three competing accent colors. */}
      <div className="mt-4 flex flex-nowrap gap-3 lg:gap-4 justify-between overflow-x-auto pb-3 snap-x snap-mandatory [scrollbar-width:thin]">
        <figure className="snap-center shrink-0 w-[min(72vw,260px)] sm:w-[min(34vw,260px)] lg:w-0 lg:min-w-0 lg:flex-1 rounded-xl overflow-hidden bg-stone-950 border-2 border-b-4 border-[#FF4B4B] flex flex-col">
          <div className="relative aspect-[16/11] w-full bg-black/80">
            <video
              className="absolute inset-0 h-full w-full object-cover object-center"
              aria-label="Quick walkthrough of essay analysis"
              title="Essay analyzer walkthrough"
              muted
              loop
              playsInline
              autoPlay
              preload="metadata"
            >
              <source src="/quick-walkthrough.mp4" type="video/mp4" />
            </video>
          </div>
          <figcaption className="px-2 py-1.5 text-center text-[10px] sm:text-[11px] font-extrabold text-stone-600 dark:text-stone-400 border-t-2 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900">
            Quick walkthrough
          </figcaption>
        </figure>
        <figure className="snap-center shrink-0 w-[min(72vw,260px)] sm:w-[min(34vw,260px)] lg:w-0 lg:min-w-0 lg:flex-1 rounded-xl overflow-hidden bg-stone-950 border-2 border-b-4 border-[#FF4B4B] flex flex-col">
          <div className="relative aspect-[16/11] w-full bg-stone-900">
            <img
              src="/rubric-and-notes.png"
              alt="Sample rubric and feedback notes from an analyzed essay"
              className="absolute inset-0 h-full w-full object-cover object-top"
              loading="lazy"
              decoding="async"
            />
          </div>
          <figcaption className="px-2 py-1.5 text-center text-[10px] sm:text-[11px] font-extrabold text-stone-600 dark:text-stone-400 border-t-2 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900">
            Rubric & notes
          </figcaption>
        </figure>
        <figure className="snap-center shrink-0 w-[min(72vw,260px)] sm:w-[min(34vw,260px)] lg:w-0 lg:min-w-0 lg:flex-1 rounded-xl overflow-hidden bg-stone-950 border-2 border-b-4 border-[#FF4B4B] flex flex-col">
          <div className="relative aspect-[16/11] w-full bg-stone-900">
            <img
              src="/full-report.png"
              alt="Sample full written breakdown from an analyzed essay"
              className="absolute inset-0 h-full w-full object-cover object-top"
              loading="lazy"
              decoding="async"
            />
          </div>
          <figcaption className="px-2 py-1.5 text-center text-[10px] sm:text-[11px] font-extrabold text-stone-600 dark:text-stone-400 border-t-2 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900">
            Full report
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

// ============================================================================
// Study pack preview — "What's included in your pack"
// ============================================================================

const STUDY_PACK_PREVIEW_SLOTS: {
  label: string;
  video?: { src: string; alt: string };
  /** Used only when no product video exists yet (e.g. Word Tower). */
  fallbackImage?: { src: string; alt: string };
}[] = [
  {
    label: 'Lesson',
    fallbackImage: {
      src: '/study-pack-previews/lesson-plan.png',
      alt: 'Preview of AI lesson plan layout from pasted study notes',
    },
  },
  {
    label: 'Flashcards',
    video: {
      src: '/writescholar-flashcards-demo.mp4',
      alt: 'Preview of flip flashcards generated from notes',
    },
  },
  {
    label: 'Quiz',
    video: {
      src: '/writescholar-quiz-generator-demo.mp4',
      alt: 'Preview of multiple-choice quiz from study notes',
    },
  },
  {
    label: 'Crossword',
    video: {
      src: '/writescholar-crossword-demo.mp4',
      alt: 'Preview of crossword puzzle from vocabulary',
    },
  },
  {
    label: 'Crater Blast',
    video: {
      src: '/writescholar-crater-blast-demo.mp4',
      alt: 'Preview of Crater Blast quiz game built from quiz content',
    },
  },
  {
    label: 'Word Tower',
    fallbackImage: {
      src: '/study-pack-previews/word-tower.png',
      alt: 'Word Tower stacking quiz game catching correct falling answers',
    },
  },
  {
    label: 'Word Blitz',
    fallbackImage: {
      src: '/study-pack-previews/word-blitz.png',
      alt: 'Word Blitz fill-in-the-blank speed quiz built from your notes',
    },
  },
];

export function StudyPackPreviewSection({ embedded = false }: PreviewSectionProps) {
  return (
    <section
      className={`rounded-2xl bg-[#FFF4E0] dark:bg-[#FF9600]/10 border-2 border-b-4 border-[#FF9600]/30 p-4 sm:p-6 ${
        embedded ? 'mt-7 sm:mt-8' : 'mt-8 sm:mt-10 pt-6 sm:pt-8'
      }`}
      aria-labelledby="study-pack-previews-heading"
    >
      <h2
        id="study-pack-previews-heading"
        className="text-center text-base sm:text-lg font-extrabold text-stone-900 dark:text-stone-100"
      >
        What&apos;s included in your pack
      </h2>
      <p className="mt-1 text-center text-xs sm:text-sm text-stone-500 dark:text-stone-400">
        Quick previews for each study activity.
      </p>
      <div className="mt-4 flex flex-nowrap gap-2 sm:gap-3 justify-between overflow-x-auto pb-3 snap-x snap-mandatory [scrollbar-width:thin] max-w-5xl mx-auto">
        {STUDY_PACK_PREVIEW_SLOTS.map((slot) => (
          <figure
            key={slot.label}
            className="snap-center shrink-0 w-[min(46vw,220px)] sm:w-[min(20vw,220px)] lg:w-0 lg:min-w-0 lg:flex-1 rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-950 border-2 border-b-4 border-[#FF9600] flex flex-col"
          >
            <div className="relative aspect-[4/5] w-full bg-stone-950/5 dark:bg-black/40">
              {slot.video ? (
                <video
                  className="absolute inset-0 h-full w-full object-cover object-center"
                  src={slot.video.src}
                  title={slot.video.alt}
                  aria-label={slot.video.alt}
                  muted
                  loop
                  playsInline
                  autoPlay
                  preload="metadata"
                />
              ) : slot.fallbackImage ? (
                <img
                  src={slot.fallbackImage.src}
                  alt={slot.fallbackImage.alt}
                  className="absolute inset-0 h-full w-full object-cover object-top"
                  loading="lazy"
                  decoding="async"
                />
              ) : null}
            </div>
            <figcaption className="px-2 py-1.5 text-center text-[10px] sm:text-[11px] font-extrabold text-stone-600 dark:text-stone-400 border-t-2 border-[#FF9600] bg-white dark:bg-stone-900">
              {slot.label}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

// ============================================================================
// Citations preview — "What your sources can look like"
// ============================================================================

const CITATION_PREVIEW_ITEMS: (
  | { id: string; kind: 'image'; src: string; label: string; alt: string }
  | { id: string; kind: 'video'; src: string; label: string; description: string }
)[] = [
  {
    id: 'demo',
    kind: 'video',
    src: '/writescholar-citation-finder-demo.mp4',
    label: 'Walkthrough',
    description: 'Find sources, choose a style, and copy ready-to-use citations',
  },
  {
    id: 'screenshot',
    kind: 'image',
    src: '/citations-preview.png',
    label: 'Citation layout',
    alt: 'Preview of citation finder results and formatting',
  },
];

export function CitationsPreviewSection({ embedded = false }: PreviewSectionProps) {
  return (
    <section
      className={`rounded-2xl bg-[#DDF4FF] dark:bg-[#1CB0F6]/10 border-2 border-b-4 border-[#1CB0F6]/30 p-4 sm:p-6 ${
        embedded ? 'mt-7 sm:mt-8' : 'mt-8 sm:mt-10 pt-6 sm:pt-8'
      }`}
      aria-labelledby="citation-previews-heading"
    >
      <h2
        id="citation-previews-heading"
        className="text-center text-base sm:text-lg font-extrabold text-stone-900 dark:text-stone-100"
        style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
      >
        What your sources can look like
      </h2>
      <p className="mt-1 text-center text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-xl mx-auto">
        Muted demo and a static preview — your results follow your topic and style.
      </p>
      <div className="mt-4 flex flex-nowrap gap-3 sm:gap-4 justify-between overflow-x-auto pb-3 snap-x snap-mandatory [scrollbar-width:thin] max-w-5xl mx-auto">
        {CITATION_PREVIEW_ITEMS.map((item) => (
          <figure
            key={item.id}
            className="snap-center shrink-0 w-[min(72vw,280px)] sm:w-[min(40vw,340px)] lg:w-0 lg:min-w-0 lg:flex-1 rounded-xl overflow-hidden bg-stone-950 border-2 border-b-4 border-[#1CB0F6] flex flex-col"
          >
            <div className="relative aspect-[16/11] w-full bg-black/80">
              {item.kind === 'image' ? (
                <img
                  src={item.src}
                  alt={item.alt}
                  className="absolute inset-0 h-full w-full object-cover object-top"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <video
                  className="absolute inset-0 h-full w-full object-cover object-center"
                  aria-label={item.description}
                  title={item.description}
                  muted
                  loop
                  playsInline
                  autoPlay
                  preload="metadata"
                >
                  <source src={item.src} type="video/mp4" />
                </video>
              )}
            </div>
            <figcaption
              className="px-2 py-1.5 text-center text-[10px] sm:text-[11px] font-extrabold text-stone-600 dark:text-stone-400 border-t-2 border-[#1CB0F6]/30 bg-white dark:bg-stone-900"
              style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
            >
              {item.label}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
