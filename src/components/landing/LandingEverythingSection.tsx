import LandingScrollReveal from './LandingScrollReveal';
import { BTN_WHITE, EYEBROW, FONT } from './webStyle';
import { FREE_CREDITS } from '../../config/pricing';

/**
 * Write, grade, study: what one account covers. Every line here is a thing the
 * product does today, taken from src/constants/freePlanCopy.ts and the editor.
 * No levels, XP or badges, and no price comparison with other apps.
 */
type Ask = 'write' | 'grade' | 'exam';

const ask = (which: Ask) => window.dispatchEvent(new CustomEvent('writescholar-hero-ask', { detail: { ask: which } }));

const tick = (
  <svg className="mt-[3px] h-[18px] w-[18px] shrink-0 text-[#58CC02]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12l5 5L20 7" /></svg>
);

const PILLARS: { key: Ask; label: string; title: string; icon: string; points: string[]; cost: string; cta: string }[] = [
  {
    key: 'write',
    label: 'Write',
    title: 'Write the essay',
    icon: '/icons/write.webp',
    points: [
      'An outline with a word budget for every paragraph',
      'Paragraph starters, paragraph checks and rewrites',
      'References in APA, MLA, Chicago, Harvard, IEEE and Vancouver',
      'Word in, Word out, and PDF export',
    ],
    cost: 'Free: 2 outlines and 10 writing helps a month.',
    cta: 'Start an essay',
  },
  {
    key: 'grade',
    label: 'Grade',
    title: 'Grade the draft',
    icon: '/icons/grade-essay.webp',
    points: [
      'An estimated grade and a score for every rubric category',
      'Green, amber and red highlights with comments, right in your draft',
      'Marked the US or the UK way',
      'Your citations checked in the style you use',
    ],
    cost: 'Your first report is complete. A grade costs 2 credits.',
    cta: 'Grade my essay',
  },
  {
    key: 'exam',
    label: 'Study',
    title: 'Study for the exam',
    icon: '/icons/study-pack.webp',
    points: [
      'A pack from a topic or from your own notes',
      'A lesson, flashcards, a quiz and a crossword',
      'Word Blitz, Word Tower and Crater Blast on the same terms',
      'Free packs are complete, and kept for 30 days',
    ],
    cost: 'A study pack costs 1 credit.',
    cta: 'Make a study pack',
  },
];

export default function LandingEverythingSection() {
  return (
    <section aria-labelledby="everything-heading" className="relative bg-[#F7F1FF] py-16 dark:bg-[#1A0B2E] sm:py-24" style={FONT}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <LandingScrollReveal>
          <div className="mx-auto mb-10 max-w-3xl text-center sm:mb-14">
            <p className={`${EYEBROW} m-0`}>One account</p>
            <h2 id="everything-heading" className="m-0 mt-2 text-[34px] font-black leading-[1.08] tracking-[-0.02em] text-[#2A1540] dark:text-white sm:text-[48px]">
              The essay <span className="text-[#8A48C7]">and</span> the exam
            </h2>
            <p className="m-0 mx-auto mt-4 max-w-2xl text-[18px] font-bold leading-[1.5] text-stone-600 dark:text-stone-300 sm:text-[20px]">
              Write it, grade it, study for it. {FREE_CREDITS} free credits a month, and no card to start.
            </p>
          </div>
        </LandingScrollReveal>

        <ul className="m-0 grid list-none grid-cols-1 gap-5 p-0 md:grid-cols-3">
          {PILLARS.map((p, i) => (
            <li key={p.key} className="flex">
              <LandingScrollReveal delayMs={i * 70} className="flex w-full">
                <div className="flex w-full flex-col rounded-[26px] border border-[#E4D4F8] bg-white p-6 shadow-[0_2px_4px_rgba(60,40,90,0.04),0_22px_50px_-34px_rgba(90,45,140,0.55)] dark:border-stone-700 dark:bg-stone-900 sm:p-7">
                  <div className="flex items-center gap-3.5">
                    <img src={p.icon} width={56} height={56} alt="" loading="lazy" decoding="async" className="h-14 w-14 shrink-0 object-contain" />
                    <div>
                      <p className={`${EYEBROW} m-0`}>{p.label}</p>
                      <h3 className="m-0 text-[24px] font-black leading-[1.15] text-[#2A1540] dark:text-white">{p.title}</h3>
                    </div>
                  </div>
                  <ul className="m-0 mt-5 flex list-none flex-1 flex-col gap-3 p-0">
                    {p.points.map((t) => (
                      <li key={t} className="flex gap-2.5 text-[16px] font-bold leading-[1.45] text-stone-800 dark:text-stone-100">{tick}<span>{t}</span></li>
                    ))}
                  </ul>
                  <p className="m-0 mt-5 rounded-2xl bg-[#F7F1FF] px-4 py-3 text-[14.5px] font-extrabold leading-[1.4] text-[#5B2491] dark:bg-[#2A0E40] dark:text-[#C9A0F0]">{p.cost}</p>
                  <button type="button" onClick={() => ask(p.key)} className={`${BTN_WHITE} mt-4 min-h-[54px] w-full px-5 text-[16.5px]`}>{p.cta}</button>
                </div>
              </LandingScrollReveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
