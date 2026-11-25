import LandingScrollReveal from './LandingScrollReveal';
import { FlashcardDemo, QuizDemo } from './StudyDemos';
import { BTN_GREEN, EYEBROW, FONT } from './webStyle';
import { FREE_CREDITS } from '../../config/pricing';

/**
 * Study packs: a topic or your notes in, a lesson, flashcards, a quiz, a
 * crossword and three games out. The screens are captures of a real pack, and
 * the two demos are the real flashcard and quiz components, so what a visitor
 * plays here is what they get.
 */
/** Send the visitor back up to the box at the top of the page, in Study mode. */
const askToStudy = () => window.dispatchEvent(new CustomEvent('writescholar-hero-ask', { detail: { ask: 'exam' } }));

const TILES = [
  { src: '/landing/study-tile-0.webp', h: 482, alt: 'Step 1, the lesson: short slides to read first.' },
  { src: '/landing/study-tile-1.webp', h: 482, alt: 'Step 2, flashcards: a question on the front of a card to flip and recall.' },
  { src: '/landing/study-tile-2.webp', h: 482, alt: 'Step 3, the quiz: a multiple choice question, with the reason for each answer.' },
  { src: '/landing/study-tile-3.webp', h: 495, alt: 'Step 4, the crossword: key terms to fill in.' },
  { src: '/landing/study-tile-4.webp', h: 495, alt: 'Step 5, games: Word Blitz, Word Tower and Crater Blast on the same terms.' },
  { src: '/landing/study-tile-5.webp', h: 495, alt: 'Take it with you: reread your notes, or save the pack as a file.' },
];

export default function LandingStudySection() {
  return (
    <section id="study-section" aria-labelledby="study-heading" className="relative scroll-mt-24 bg-white py-16 dark:bg-stone-950 sm:py-24" style={FONT}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <LandingScrollReveal>
          <div className="mx-auto mb-10 max-w-3xl text-center sm:mb-14">
            <p className={`${EYEBROW} m-0`}>Study packs</p>
            <h2 id="study-heading" className="m-0 mt-2 text-[34px] font-black leading-[1.08] tracking-[-0.02em] text-[#2A1540] dark:text-white sm:text-[48px] lg:text-[56px]">
              Type an exam topic. <span className="text-[#8A48C7]">Study it five ways.</span>
            </h2>
            <p className="m-0 mx-auto mt-4 max-w-2xl text-[18px] font-bold leading-[1.5] text-stone-600 dark:text-stone-300 sm:text-[20px]">
              Or paste your notes. You get a lesson, flashcards, a quiz, a crossword and three games, all made from the same material.
            </p>
          </div>
        </LandingScrollReveal>

        <LandingScrollReveal>
          <div className="overflow-hidden rounded-[26px] border border-[#E4D4F8] shadow-[0_2px_4px_rgba(60,40,90,0.04),0_22px_50px_-34px_rgba(90,45,140,0.55)] dark:border-stone-700">
            <img
              src="/landing/study-pack-header.webp"
              width={1600}
              height={329}
              alt="A study pack for Cell Division: Mitosis, Meiosis, and Genetic Stability, with five steps to work through and a Start button."
              loading="lazy"
              decoding="async"
              className="block h-auto w-full"
            />
          </div>
        </LandingScrollReveal>

        <ul className="m-0 mt-5 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {TILES.map((t, i) => (
            <li key={t.src}>
              <LandingScrollReveal delayMs={i * 50}>
                <div className="overflow-hidden rounded-[22px] border border-[#E4D4F8] bg-white dark:border-stone-700">
                  <img src={t.src} width={760} height={t.h} alt={t.alt} loading="lazy" decoding="async" className="block h-auto w-full" />
                </div>
              </LandingScrollReveal>
            </li>
          ))}
        </ul>
        <p className="m-0 mt-3 text-center text-[14px] font-bold text-stone-500 dark:text-stone-400">Real screens from a pack made for &ldquo;Cell division&rdquo;.</p>

        <LandingScrollReveal>
          <div className="mx-auto mb-7 mt-14 max-w-2xl text-center sm:mt-20">
            <h3 className="m-0 text-[28px] font-black leading-[1.15] tracking-[-0.01em] text-[#2A1540] dark:text-white sm:text-[36px]">Try a card. Answer a question.</h3>
            <p className="m-0 mt-2 text-[17px] font-bold leading-[1.5] text-stone-600 dark:text-stone-300">These are the real thing, from a pack made for &ldquo;Cell biology: mitosis and meiosis&rdquo;.</p>
          </div>
        </LandingScrollReveal>
        <LandingScrollReveal>
          <div className="mx-auto grid max-w-5xl items-start gap-5 lg:grid-cols-2 lg:gap-7">
            <FlashcardDemo />
            <QuizDemo />
          </div>
        </LandingScrollReveal>

        <LandingScrollReveal>
          <div className="mt-12 flex flex-col items-center gap-3 text-center sm:mt-16">
            <button type="button" onClick={askToStudy} className={`${BTN_GREEN} min-h-[58px] px-8 text-[18px]`}>Make my study pack free</button>
            <p className="m-0 text-[14.5px] font-bold text-stone-500 dark:text-stone-400">One pack costs 1 credit. Free accounts get {FREE_CREDITS} credits a month.</p>
          </div>
        </LandingScrollReveal>
      </div>
    </section>
  );
}
