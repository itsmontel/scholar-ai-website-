import { Suspense, useEffect, useState, type MouseEvent, type ReactNode } from 'react';
import Footer from '../../common/Footer';
import LoggedInPageShell from '../../workspace/LoggedInPageShell';
import { trackEvent } from '../../../utils/analytics';
import { rememberDoor } from '../../../utils/tryFirst';
import { hrefForPage } from '../../../utils/pageHref';
import { applyPageSeoTags, injectJsonLd, injectToolProductSchema, removeJsonLd } from '../../../utils/seo';
import { TOOL_SEO_META } from '../../../constants/toolSeoMeta';
import { FINALS_FREE_LABEL, FREE_CREDITS, FREE_GRADE_MAX_WORDS, FREE_GRADE_MIN_WORDS, finalsFreeActive } from '../../../config/pricing';
import { BTN_GREEN, BTN_WHITE, CARD, EYEBROW, FONT } from '../../landing/webStyle';
import { lazyWithRetry } from '../../../utils/lazyWithRetry';

/** The sample essay report shown on the home page: a real report on a sample draft. */
const InteractiveDocumentAnalysis = lazyWithRetry(() => import('../../landing/InteractiveDocumentAnalysis'));

/**
 * Public page for the study pack, the quiz generator, the flashcard maker,
 * the essay checker and the summarizer, as a signed-out visitor sees them.
 *
 * The three study pages are one product now: a study pack holds a lesson,
 * flashcards, a quiz, a crossword and three games, so they share this layout
 * and differ only in what they lead with. A visitor types a topic, makes a
 * free account, and finds the topic waiting in the dashboard's "make a pack"
 * box. The essay page leads to the same sign-up through the essay door.
 * Nothing is generated on this page.
 */
export type StudyToolVariant = 'study-pack' | 'quiz' | 'flashcards' | 'essay' | 'summarizer';
type HeroKind = 'topic' | 'button' | 'text';

type Navigate = (page: string, slug?: string, options?: unknown) => void;

/** Read by the dashboard's "make a pack" box (StudyPacksPanel). */
const NOTES_DRAFT_KEY = 'writescholar_dashboard_draft';
const TOPIC_DRAFT_KEY = 'writescholar_dashboard_topic_draft';
/** Read by the summarizer when it opens (SummarizerPage). */
const SUMMARIZER_DRAFT_KEY = 'summarizerOpenData';
/** Free accounts get this many credits a month while the finals offer runs (creditService.js). */
const FINALS_FREE_CREDITS = 9;
const TOPIC_EXAMPLES = ["Aristotle's ethics", 'Statistics 101', 'Cell respiration', 'The French Revolution'];

interface Faq { q: string; a: string }
interface Part { title: string; body: string; mine?: boolean }
interface Copy {
  metaKey: 'study-pack' | 'quiz-generator' | 'create-flashcards' | 'analyze' | 'summarizer';
  schemaName: string;
  hero: HeroKind;
  /** Line under the hero box for a signed-out visitor. */
  nextStep: string;
  partsEyebrow: string;
  partsTitle: string;
  partsSub: string;
  parts: Part[];
  steps: { t: string; b: string }[];
  free: string[];
  closingSub: string;
  eyebrow: string;
  title: ReactNode;
  sub: string;
  cta: string;
  demoTitle: string;
  demoSub: string;
  tipsTitle: string;
  tips: { title: string; body: string }[];
  faqs: Faq[];
}

/** Real cards and questions from a pack made for "Cell biology: mitosis and meiosis". */
const DEMO_CARDS = [
  { q: 'What is cell division, and why is it important?', a: 'Cell division is the process by which one cell produces new cells. It is essential for growth, development, tissue repair, replacement of damaged cells, and reproduction.' },
  { q: 'What are the two major types of nuclear division in eukaryotic cells?', a: 'The two major types are mitosis and meiosis. Mitosis produces genetically identical cells, while meiosis produces genetically different haploid cells.' },
  { q: 'What happens during interphase?', a: 'During interphase, the cell grows, carries out normal functions, copies its DNA, and prepares for nuclear division. Interphase includes the G1, S, and G2 phases.' },
];
const DEMO_QUESTIONS = [
  {
    kind: 'Fill in the blank',
    q: 'In plant cells, cytokinesis occurs when a ___ forms between the two nuclei.',
    options: ['Cleavage furrow', 'Centromere', 'Cell plate', 'Kinetochore'],
    answer: 2,
    why: 'Plant cells form a cell plate that develops into a new cell wall, whereas animal cells form a cleavage furrow.',
  },
  {
    kind: 'Multiple choice',
    q: 'A human cell has 46 chromosomes before meiosis begins. Assuming normal chromosome separation, how many chromosomes should each final meiotic cell contain?',
    options: ['12', '23', '46', '92'],
    answer: 1,
    why: 'Meiosis reduces the diploid chromosome number by half, producing haploid human cells with 23 chromosomes.',
  },
];

const FINALS = finalsFreeActive();

/** One sentence on what a free account gets for study packs. */
function packFreeLine(): string {
  const base = `A free account gets ${FREE_CREDITS} credits a month, and one study pack costs 1 credit.`;
  return FINALS ? `${base} Until ${FINALS_FREE_LABEL} that is ${FINALS_FREE_CREDITS} credits a month.` : base;
}

const ACCOUNT_FAQ: Faq = { q: 'Do I need an account?', a: 'Yes. You make a free account first, with no card, and work from your dashboard.' };
const WRONG_FAQ: Faq = { q: 'Can it get things wrong?', a: 'Yes, sometimes. It is written by AI, so check anything that looks off against your notes or the original text.' };
const PACK_FAQS: Faq[] = [
  ACCOUNT_FAQ,
  { q: 'What can I make it from?', a: 'A topic in one line, your own notes (at least 50 words), or a file: PDF, Word or plain text. If you paste one lecture or one chapter, every question comes from that text.' },
  WRONG_FAQ,
  { q: 'Are my packs kept?', a: 'Yes. Packs you make stay in your account, and you can also save a pack as a file.' },
];

const PACK_PARTS: (Part & { key: string })[] = [
  { key: 'lesson', title: 'Lesson', body: 'Short slides to read first, so the rest makes sense.' },
  { key: 'flashcards', title: 'Flashcards', body: 'A deck to flip and recall. Mark what you know.' },
  { key: 'quiz', title: 'Quiz', body: 'Questions with the reason for each answer.' },
  { key: 'crossword', title: 'Crossword', body: 'The key terms, as clues to fill in.' },
  { key: 'games', title: 'Games', body: 'Three quick games on the same terms.' },
];
const packParts = (mine?: string): Part[] => PACK_PARTS.map((p) => ({ title: p.title, body: p.body, mine: p.key === mine }));

/** Shared by the three study pages. */
const PACK_BASE = {
  hero: 'topic' as HeroKind,
  nextStep: 'Next step: a free account. No card needed.',
  partsEyebrow: 'One pack, five ways to study',
  partsSub: 'You make one study pack and get all five, built from the same topic or notes.',
  steps: [
    { t: 'Say what you are studying', b: 'Type the topic in one line, or paste your own notes so the questions match your course.' },
    { t: 'Make a free account', b: 'No card. It is where your packs are kept.' },
    { t: 'Study the pack', b: 'Read the lesson, flip the cards, take the quiz, then use the crossword and games on the terms that will not stick.' },
  ],
  free: [
    'A free account, with no card.',
    `${FREE_CREDITS} credits a month. One study pack costs 1 credit.`,
    ...(FINALS ? [`Until ${FINALS_FREE_LABEL}: ${FINALS_FREE_CREDITS} credits a month instead of ${FREE_CREDITS}.`] : []),
    'Every pack is whole: lesson, flashcards, quiz, crossword and games.',
  ],
  closingSub: 'Make a free account and build your first pack. No card needed.',
};

const COPY: Record<StudyToolVariant, Copy> = {
  'study-pack': {
    ...PACK_BASE,
    metaKey: 'study-pack',
    schemaName: 'WriteScholar Study Pack',
    eyebrow: 'AI study pack',
    title: <>Type your exam topic. Get a full <span className="text-[#FFD84D]">study pack</span>.</>,
    sub: 'One line is enough. You get a lesson, flashcards, a quiz, a crossword and three games.',
    cta: 'Make my study pack',
    demoTitle: 'Try a card and a question',
    demoSub: 'These are real: they come from a pack made for "Cell biology: mitosis and meiosis".',
    partsTitle: 'What is in every pack',
    parts: packParts(),
    tipsTitle: 'How to use a study pack',
    tips: [
      { title: 'Go in order the first time', body: 'Read the lesson, then the flashcards, then the quiz. The crossword and games are for the terms that still will not stick.' },
      { title: 'Make one pack per topic', body: 'A pack on one chapter asks sharper questions than a pack on a whole course. Split a big exam into its parts.' },
      { title: 'Use your own notes for your own course', body: 'A topic gives you the standard version of a subject. Your notes give you what your lecturer actually covered.' },
      { title: 'Come back to it', body: 'One pass the night before is the weakest way to use it. A short session on a few different days does more.' },
    ],
    faqs: [
      { q: 'Is the study pack free?', a: `Yes, with a free account and no card. ${packFreeLine()} Paid plans have more credits.` },
      { q: 'What is in a study pack?', a: 'A short lesson, a deck of flashcards, a quiz with the reason for each answer, a crossword of the key terms, and three games: Word Blitz, Word Tower and Crater Blast.' },
      ...PACK_FAQS,
    ],
  },
  quiz: {
    ...PACK_BASE,
    metaKey: 'quiz-generator',
    schemaName: 'WriteScholar AI Quiz Generator',
    eyebrow: 'AI quiz generator',
    title: <>A practice quiz on your topic that tells you <span className="text-[#FFD84D]">why</span>.</>,
    sub: 'Type what your exam is on, or paste your notes. You get multiple choice, true or false and fill in the blank questions, each with the reason for the answer.',
    cta: 'Make my quiz',
    demoTitle: 'Try two real questions',
    demoSub: 'They come from a quiz made for "Cell biology: mitosis and meiosis". Pick a wrong answer to see what happens.',
    partsTitle: 'The quiz comes with the rest of the pack',
    parts: packParts('quiz'),
    tipsTitle: 'How to get more out of a practice quiz',
    tips: [
      { title: 'Quiz the parts you are unsure of', body: 'A quiz on what you already know feels good and teaches little. Make it from the chapter that is still murky.' },
      { title: 'Read the reason on every wrong answer', body: 'Do not just note the right option. Say in your own words why your pick was wrong. That is the part that sticks.' },
      { title: 'Answer before you look at the options', body: 'Cover the choices and try to recall the answer first. Recognising the right option is easier than recalling it, and exams usually ask for recall.' },
      { title: 'Spread it out', body: 'Take the quiz again a few days later instead of three times in one night.' },
    ],
    faqs: [
      { q: 'Is the quiz generator free?', a: `Yes, with a free account and no card. The quiz comes as part of a study pack. ${packFreeLine()} Paid plans have more credits.` },
      { q: 'What question types does it write?', a: 'Multiple choice, true or false, and fill in the blank. Every answer comes with a short explanation.' },
      { q: 'What else do I get with the quiz?', a: 'The quiz is one part of a study pack. The same pack also has a short lesson, flashcards, a crossword and three games on the same material.' },
      ...PACK_FAQS,
    ],
  },
  flashcards: {
    ...PACK_BASE,
    metaKey: 'create-flashcards',
    schemaName: 'WriteScholar AI Flashcard Maker',
    eyebrow: 'AI flashcard maker',
    title: <>Flashcards made for you. Skip the <span className="text-[#FFD84D]">typing</span>.</>,
    sub: 'Type a topic or paste your notes and get a deck to flip through. Mark each card "I knew it" or "Show me again later".',
    cta: 'Make my flashcards',
    demoTitle: 'Flip a few real cards',
    demoSub: 'They come from a deck made for "Cell biology: mitosis and meiosis".',
    partsTitle: 'The deck comes with the rest of the pack',
    parts: packParts('flashcards'),
    tipsTitle: 'How to study with flashcards',
    tips: [
      { title: 'Answer out loud before you flip', body: 'Flipping straight away turns the deck into reading. Say or write your answer first, then check it.' },
      { title: 'Be honest with "I knew it"', body: 'If you only half knew it, send it back. The cards you get wrong are the ones worth your time.' },
      { title: 'Keep decks to one topic', body: 'A deck for one chapter is easier to finish and easier to repeat than one deck for a whole course.' },
      { title: 'Little and often', body: 'Ten minutes on several days beats one long session the night before.' },
    ],
    faqs: [
      { q: 'Is the flashcard maker free?', a: `Yes, with a free account and no card. The deck comes as part of a study pack. ${packFreeLine()} Paid plans have more credits.` },
      { q: 'Can I change the cards?', a: 'Yes. Each deck has an "Edit, shuffle or print this deck" option.' },
      { q: 'What else do I get with the flashcards?', a: 'The deck is one part of a study pack. The same pack also has a short lesson, a quiz with the reason for each answer, a crossword and three games on the same material.' },
      ...PACK_FAQS,
    ],
  },
  essay: {
    metaKey: 'analyze',
    schemaName: 'WriteScholar AI Essay Checker',
    hero: 'button',
    nextStep: 'Next step: a free account. No card needed.',
    eyebrow: 'AI essay checker',
    title: <>See your essay&apos;s <span className="text-[#FFD84D]">grade</span> before your professor does.</>,
    sub: 'Paste or import a draft and get an estimated grade, a score for each part of the rubric, and feedback on your sentences.',
    cta: 'Grade my essay free',
    demoTitle: 'Open a real report',
    demoSub: 'This is a whole report on a sample draft, not your work. Click a highlighted sentence to read its feedback.',
    partsEyebrow: 'What you get',
    partsTitle: 'What is in a report',
    partsSub: 'One report covers the whole draft.',
    parts: [
      { title: 'Estimated grade', body: 'A letter grade and a score out of 100. It is an estimate to guide your edits, not your official mark.' },
      { title: 'Rubric scores', body: 'A score for each part: thesis, response to the question, structure, clarity, analysis and evidence.' },
      { title: 'Sentence feedback', body: 'Sentences marked strong, needs improvement or needs revision, each with a note.' },
      { title: 'A file to keep', body: 'Save the report as a PDF or Word file.' },
    ],
    steps: [
      { t: 'Make a free account', b: 'No card. It is where your essays and reports are kept.' },
      { t: 'Paste or import your essay', b: `Word, PDF or plain text, from ${FREE_GRADE_MIN_WORDS} words.` },
      { t: 'Fix the weakest parts first', b: 'Start with the lowest rubric score and the sentences marked "needs revision".' },
    ],
    free: [
      'A free account, with no card.',
      `${FREE_CREDITS} credits a month. One essay report costs 1 credit.`,
      FINALS
        ? `Until ${FINALS_FREE_LABEL}: ${FINALS_FREE_CREDITS} credits a month, and every report is complete.`
        : 'Your first report is complete. After that, free reports show part of the feedback.',
      `Essays from ${FREE_GRADE_MIN_WORDS} to ${FREE_GRADE_MAX_WORDS.toLocaleString('en-US')} words.`,
    ],
    closingSub: 'Make a free account and grade your first essay. No card needed.',
    tipsTitle: 'How to use an essay report',
    tips: [
      { title: 'Start with the lowest score', body: 'Two weak categories fixed properly move a grade more than polishing sentences everywhere.' },
      { title: 'Rewrite the "needs revision" sentences', body: 'Those are the places a marker loses the thread. Fix them before you touch anything else.' },
      { title: 'Treat the grade as an estimate', body: 'Your professor and their rubric decide the real mark. Use the report to find problems, not to predict the number.' },
      { title: 'Leave time for a second pass', body: 'Grade a draft a day or two before the deadline, so you can act on what it finds.' },
    ],
    faqs: [
      { q: 'Is the essay checker free?', a: `Yes, with a free account and no card. A free account gets ${FREE_CREDITS} credits a month and one essay report costs 1 credit. ${FINALS ? `Until ${FINALS_FREE_LABEL} that is ${FINALS_FREE_CREDITS} credits a month and every report is complete.` : 'Your first report is complete; after that, free reports show part of the feedback and paid plans show all of it.'}` },
      { q: 'Is the grade accurate?', a: 'It is an estimate, written by AI against a general academic rubric. Use it to find weak spots, not as your official mark.' },
      { q: 'What can I give it?', a: `Paste the text, or import a Word, PDF or plain text file. An essay needs at least ${FREE_GRADE_MIN_WORDS} words.` },
      ACCOUNT_FAQ,
      WRONG_FAQ,
    ],
  },
  summarizer: {
    metaKey: 'summarizer',
    schemaName: 'WriteScholar AI Summarizer',
    hero: 'text',
    nextStep: 'Next step: a free account. No card needed. Your text stays on this device, ready when you open the summarizer.',
    eyebrow: 'AI summarizer',
    title: <>Long reading in. The <span className="text-[#FFD84D]">key points</span> out.</>,
    sub: 'Paste a paper, an article or a chapter and get a summary of the main points.',
    cta: 'Summarize my text',
    demoTitle: 'Watch it work',
    demoSub: 'A recording of the summarizer on a set of psychology notes.',
    partsEyebrow: 'Four styles',
    partsTitle: 'Pick how you want it',
    partsSub: 'Free accounts get bullet points at medium length. Paid plans add the other styles and a short or long length.',
    parts: [
      { title: 'Bullet points', body: 'The main points as a list. On every plan.', mine: true },
      { title: 'Paragraph', body: 'The same points as flowing prose. Paid plans.' },
      { title: 'TL;DR', body: 'The shortest version. Paid plans.' },
      { title: 'Detailed', body: 'A longer, fuller summary. Paid plans.' },
    ],
    steps: [
      { t: 'Make a free account', b: 'No card.' },
      { t: 'Paste your text or upload a document', b: 'At least 50 words.' },
      { t: 'Read the summary', b: 'Copy it into your notes, then go back to the original for the parts that matter.' },
    ],
    free: [
      'A free account, with no card.',
      '5,000 words a month.',
      'Bullet-point summaries at medium length.',
      'Paid plans: every style and length, and up to 15,000 words at a time.',
    ],
    closingSub: 'Make a free account to summarize your first reading. No card needed.',
    tipsTitle: 'How to use a summary well',
    tips: [
      { title: 'Use it to decide what to read closely', body: 'A summary tells you which sections matter. It does not replace reading them.' },
      { title: 'Do not paste a summary into your essay', body: 'It is not your writing and not a source you can cite. Go back to the original for quotes and page numbers.' },
      { title: 'Check names, numbers and dates', body: 'An AI summary can state something the source did not say. Check anything you plan to rely on.' },
      { title: 'One reading at a time', body: 'Summarize each paper on its own. Mixing several texts in one go blurs who said what.' },
    ],
    faqs: [
      { q: 'Is the summarizer free?', a: 'Yes, with a free account and no card. A free account can summarize 5,000 words a month, as bullet points at medium length. Paid plans add the other styles and lengths, and longer texts.' },
      { q: 'How long can the text be?', a: 'At least 50 words. Up to 5,000 words at a time on a free account, and up to 15,000 on a paid plan.' },
      ACCOUNT_FAQ,
      WRONG_FAQ,
    ],
  },
};

const check = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12l5 5L20 7" /></svg>
);
const arrow = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);

/* ── Flashcard demo ─────────────────────────────────────────────── */
function FlashcardDemo() {
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const card = DEMO_CARDS[i];
  const next = (knew: boolean) => {
    if (knew) setKnown((k) => Math.min(DEMO_CARDS.length, k + 1));
    setFlipped(false);
    setI((n) => (n + 1) % DEMO_CARDS.length);
  };
  return (
    <div className={`${CARD} flex flex-col gap-4 p-5 sm:p-6`}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="m-0 text-[19px] font-black text-stone-900">Card {i + 1} of {DEMO_CARDS.length}</h3>
        <span className="inline-flex min-h-[32px] items-center rounded-full bg-[#E6F9D2] px-3 text-[13px] font-extrabold text-[#2F6B00]">{known} known</span>
      </div>
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        aria-label={flipped ? 'Show the question' : 'Show the answer'}
        className={`flex min-h-[230px] w-full flex-col items-center justify-center gap-3 rounded-[26px] border-2 border-b-[6px] px-5 py-6 text-center transition-colors ${flipped ? 'border-[#58CC02] bg-[#F4FCEB]' : 'border-[#D2B5F3] bg-white'}`}
      >
        <span className={`inline-flex min-h-[28px] items-center rounded-full px-3 text-[12px] font-black uppercase tracking-[0.14em] ${flipped ? 'bg-[#E6F9D2] text-[#2F6B00]' : 'bg-[#F3EAFF] text-[#7733B5]'}`}>{flipped ? 'Answer' : 'Question'}</span>
        <span className={`font-black leading-[1.3] text-stone-900 ${flipped ? 'text-[17px]' : 'text-[21px]'}`}>{flipped ? card.a : card.q}</span>
        <span className="text-[13.5px] font-extrabold text-[#7733B5]">{flipped ? 'Tap to see the question' : 'Tap the card to see the answer'}</span>
      </button>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => next(false)} className="inline-flex min-h-[54px] flex-[1_1_180px] items-center justify-center rounded-[18px] border-2 border-b-[5px] border-[#E0A800] bg-[#FFC800] px-4 text-[16px] font-black text-[#3A2A00] transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-2">Show me again later</button>
        <button type="button" onClick={() => next(true)} className={`${BTN_GREEN} min-h-[54px] flex-[1_1_180px] px-4 text-[16px]`}>{check} I knew it</button>
      </div>
    </div>
  );
}

/* ── Quiz demo ──────────────────────────────────────────────────── */
function QuizDemo() {
  const [i, setI] = useState(0);
  const [pick, setPick] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const q = DEMO_QUESTIONS[i];
  const right = pick === q.answer;
  const nextQ = () => { setI((n) => (n + 1) % DEMO_QUESTIONS.length); setPick(null); setChecked(false); };
  return (
    <div className={`${CARD} flex flex-col gap-4 p-5 sm:p-6`}>
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex min-h-[28px] items-center rounded-full bg-[#DDF9E8] px-3 text-[12px] font-black uppercase tracking-[0.1em] text-[#0B7A43]">{q.kind}</span>
        <span className="text-[14px] font-extrabold text-stone-500">{i + 1} / {DEMO_QUESTIONS.length}</span>
      </div>
      <h3 className="m-0 text-[18px] font-black leading-[1.35] text-stone-900">{q.q}</h3>
      <div className="flex flex-col gap-2.5" role="radiogroup" aria-label="Answers">
        {q.options.map((o, n) => {
          const isPick = pick === n;
          const state = !checked ? (isPick ? 'pick' : 'idle') : n === q.answer ? 'right' : isPick ? 'wrong' : 'idle';
          const cls = state === 'right' ? 'border-[#16A34A] bg-[#22C55E] text-white'
            : state === 'wrong' ? 'border-[#B91C1C] bg-[#EF4444] text-white'
            : state === 'pick' ? 'border-[#0284C7] bg-[#38BDF8] text-white'
            : 'border-stone-200 bg-white text-stone-900 hover:border-[#C9A0F0]';
          return (
            <button
              key={o}
              type="button"
              role="radio"
              aria-checked={isPick}
              disabled={checked}
              onClick={() => setPick(n)}
              className={`flex min-h-[54px] w-full items-center gap-3 rounded-2xl border-2 border-b-4 px-3.5 text-left text-[15.5px] font-extrabold transition-colors disabled:cursor-default ${cls}`}
            >
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[12.5px] font-black ${state === 'idle' ? 'bg-stone-100 text-stone-500' : 'bg-white/25 text-white'}`}>{String.fromCharCode(65 + n)}</span>
              <span className="min-w-0 flex-1">{o}</span>
              {state === 'right' && <span aria-hidden className="text-[18px]">✓</span>}
              {state === 'wrong' && <span aria-hidden className="text-[18px]">✗</span>}
            </button>
          );
        })}
      </div>
      {checked && (
        <div aria-live="polite" className="flex flex-col gap-2.5">
          <p className={`m-0 rounded-2xl border-2 px-4 py-3 text-[16px] font-black ${right ? 'border-[#58CC02] bg-[#D7FFB8] text-[#2F6B00]' : 'border-[#F87171] bg-[#FEE2E2] text-[#B91C1C]'}`}>
            {right ? 'Nice work!' : `Not quite. Correct answer: ${q.options[q.answer]}`}
          </p>
          <div className="rounded-2xl border-2 border-[#DDD6FE] bg-[#F5F3FF] px-4 py-3">
            <p className="m-0 text-[12px] font-black uppercase tracking-[0.1em] text-[#5B21B6]">Explanation</p>
            <p className="m-0 mt-1 text-[15px] font-bold leading-[1.45] text-[#5B21B6]">{q.why}</p>
          </div>
        </div>
      )}
      <div className="flex justify-end">
        {checked
          ? <button type="button" onClick={nextQ} className="inline-flex min-h-[50px] items-center rounded-2xl border-2 border-b-4 border-[#0284C7] bg-[#0EA5E9] px-6 text-[15px] font-black uppercase tracking-wide text-white transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-2">Next question</button>
          : <button type="button" disabled={pick === null} onClick={() => setChecked(true)} className={`${BTN_GREEN} min-h-[50px] px-6 text-[15px] uppercase tracking-wide`}>Check</button>}
      </div>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────── */
export default function StudyToolLanding({ variant, onNavigate, user, onLogout }: { variant: StudyToolVariant; onNavigate: Navigate; user?: Record<string, unknown> | null; onLogout?: () => void }) {
  const copy = COPY[variant];
  const signedIn = !!user;
  const finals = FINALS;
  const isPack = copy.hero === 'topic';
  const [mode, setMode] = useState<'topic' | 'notes'>('topic');
  const [text, setText] = useState('');
  const [topic, setTopic] = useState('');
  const [notes, setNotes] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const countWords = (v: string) => (v.trim() ? v.trim().split(/\s+/).filter(Boolean).length : 0);
  const wordCount = countWords(notes);
  const textWords = countWords(text);
  const ready = copy.hero === 'button' ? true : copy.hero === 'text' ? textWords >= 50 : mode === 'topic' ? topic.trim().length >= 2 : wordCount >= 50;

  useEffect(() => {
    const meta = TOOL_SEO_META[copy.metaKey];
    applyPageSeoTags({ title: meta.title, description: meta.description });
    injectToolProductSchema({ name: copy.schemaName, description: meta.description, usesCredits: variant !== 'summarizer' });
    injectJsonLd('tool-faq', {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: copy.faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    });
    return () => { removeJsonLd('tool-product'); removeJsonLd('tool-faq'); };
  }, [copy, variant]);

  /** Keep what was typed, then send the visitor on: sign-up first, or straight to the tool. */
  const start = (from: string) => {
    try {
      if (variant === 'summarizer') {
        if (text.trim()) localStorage.setItem(SUMMARIZER_DRAFT_KEY, JSON.stringify({ inputText: text }));
      } else if (isPack) {
        if (mode === 'notes' && notes.trim()) sessionStorage.setItem(NOTES_DRAFT_KEY, notes);
        else if (topic.trim()) { sessionStorage.removeItem(NOTES_DRAFT_KEY); sessionStorage.setItem(TOPIC_DRAFT_KEY, topic.trim()); }
      }
    } catch { /* storage off: they simply type it again */ }
    if (isPack) rememberDoor('exam');
    if (variant === 'essay') rememberDoor('essay');
    trackEvent('tool_next_step', { tool: copy.metaKey, from, signed_in: signedIn });
    onNavigate(signedIn ? (isPack ? 'study-pack-hub' : variant === 'essay' ? 'analyze' : 'summarizer') : 'signup');
  };

  const link = (page: string) => ({
    href: hrefForPage(page),
    onClick: (e: MouseEvent<HTMLAnchorElement>) => { e.preventDefault(); onNavigate(page.startsWith('/blog/') ? 'blog-post' : page, page.startsWith('/blog/') ? page.replace('/blog/', '') : undefined); },
  });

  const ALL = {
    'study-pack': { page: 'study-pack', title: 'Study pack', body: 'A lesson, flashcards, a quiz, a crossword and games from one topic.' },
    quiz: { page: 'quiz-generator', title: 'AI quiz generator', body: 'Practice questions with the reason for each answer.' },
    flashcards: { page: 'create-flashcards', title: 'AI flashcard maker', body: 'A deck made from your topic or notes.' },
    essay: { page: 'analyze', title: 'AI essay checker', body: 'A grade and feedback on your sentences.' },
    summarizer: { page: 'summarizer', title: 'AI summarizer', body: 'The key points of a long reading.' },
  } as const;
  const RELATED: Record<StudyToolVariant, (keyof typeof ALL)[]> = {
    'study-pack': ['quiz', 'flashcards', 'essay'],
    quiz: ['study-pack', 'flashcards', 'essay'],
    flashcards: ['study-pack', 'quiz', 'essay'],
    essay: ['study-pack', 'quiz', 'summarizer'],
    summarizer: ['study-pack', 'essay', 'quiz'],
  };
  const others = RELATED[variant].map((k) => ALL[k]);
  const guides = isPack
    ? [{ href: '/blog/how-to-study-for-finals', label: 'how to study for finals' }, { href: '/blog/how-to-memorize-things-fast', label: 'how to memorize things fast' }]
    : variant === 'essay'
      ? [{ href: '/blog/grade-my-essay-before-submitting', label: 'grading your essay before you submit' }, { href: '/blog/how-to-write-a-thesis-statement', label: 'how to write a thesis statement' }]
      : [{ href: '/blog/turn-lecture-notes-into-study-guide', label: 'turning lecture notes into a study guide' }, { href: '/blog/how-to-study-effectively-complete-guide', label: 'how to study effectively' }];

  return (
    <LoggedInPageShell user={user} onNavigate={onNavigate as (page: string, slug?: string) => void} onLogout={onLogout} currentPage={copy.metaKey} headerProps={{ sticky: true }}>
    <div className="bg-white text-stone-900" style={FONT}>
      {/* ── Hero: the "make a pack" box on the site's purple ground ── */}
      <section className="relative overflow-hidden text-white">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#A863EA] via-[#8E48CF] via-[38%] to-[#5E1F96]" />
          <div className="absolute left-1/2 top-[260px] h-[1100px] w-[1100px] -translate-x-1/2 rounded-full bg-[#8A45C8]" />
          <div className="absolute left-1/2 top-[400px] h-[760px] w-[760px] -translate-x-1/2 rounded-full bg-[#9652D3]" />
        </div>
        <div className="relative mx-auto flex w-full max-w-[1040px] flex-col items-center px-4 pb-14 pt-12 text-center sm:px-6 sm:pb-20 sm:pt-16">
          {finals && variant !== 'summarizer' && (
            <p className="m-0 mb-5 inline-flex items-center gap-2 rounded-full border-2 border-b-[3px] border-[#E0A800] bg-[#FFC800] px-3.5 py-1 text-[13px] font-black text-[#3A2A00] sm:text-[14px]">
              {variant === 'essay' ? `Free for finals: whole essay reports until ${FINALS_FREE_LABEL}` : `Free for finals: ${FINALS_FREE_CREDITS} study packs a month until ${FINALS_FREE_LABEL}`}
            </p>
          )}
          <p className="m-0 text-[12px] font-extrabold uppercase tracking-[0.18em] text-[#F3EAFF]">{copy.eyebrow}</p>
          <h1 className="m-0 mt-2.5 max-w-[880px] text-[2.1rem] font-black leading-[1.05] tracking-[-0.03em] [text-wrap:balance] sm:text-[3.3rem]">{copy.title}</h1>
          <p className="m-0 mt-4 max-w-[680px] text-[16px] font-bold leading-[1.45] text-[#F3EAFF] [text-wrap:pretty] sm:text-[18.5px]">{copy.sub}</p>

          {copy.hero === 'topic' && (
          <div className="mt-8 flex w-full max-w-[860px] flex-col gap-3 rounded-[26px] border-b-[6px] border-[#D9C2F2] bg-white p-4 text-left text-stone-900 shadow-[0_30px_50px_-22px_rgba(42,21,64,0.55)]">
            {mode === 'topic' ? (
              <>
                <form className="flex flex-wrap gap-3" onSubmit={(e) => { e.preventDefault(); if (ready) start('hero'); }}>
                  <label htmlFor="tool-topic" className="sr-only">What is the exam on?</label>
                  <input
                    id="tool-topic"
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    maxLength={200}
                    placeholder="A course, a chapter or one idea"
                    className="min-h-[60px] min-w-0 flex-[1_1_300px] rounded-[18px] border-2 border-[#DCC3F6] bg-[#FBF8FF] px-[18px] text-[18px] font-extrabold text-stone-900 placeholder:text-stone-400 focus:border-[#A560E8] focus:outline-none focus:ring-4 focus:ring-[#A560E8]/20"
                  />
                  <button type="submit" disabled={!ready} className={`${BTN_GREEN} min-h-[60px] w-full whitespace-nowrap rounded-[18px] px-[26px] text-[18px] sm:w-auto`}>{copy.cta}{arrow}</button>
                </form>
                <div className="flex flex-wrap items-center gap-2">
                  {TOPIC_EXAMPLES.map((ex) => (
                    <button key={ex} type="button" onClick={() => setTopic(ex)} className="min-h-[44px] rounded-full border-2 border-b-4 border-[#E4D4F8] bg-[#F7F1FF] px-3.5 text-[14px] font-extrabold text-stone-900 transition-all hover:-translate-y-0.5 hover:border-[#C9A0F0] active:translate-y-0.5 active:border-b-2">{ex}</button>
                  ))}
                  <button type="button" onClick={() => setMode('notes')} className="inline-flex min-h-[44px] items-center px-1.5 text-[14.5px] font-black text-[#7733B5] underline hover:text-[#5F2594] sm:ml-auto">Use my notes instead</button>
                </div>
              </>
            ) : (
              <>
                <label htmlFor="tool-notes" className="sr-only">Your notes</label>
                <textarea
                  id="tool-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={6}
                  placeholder="Paste one lecture or one chapter. Every question will come from this."
                  className="w-full resize-y rounded-[18px] border-2 border-[#DCC3F6] bg-[#FBF8FF] px-[18px] py-3.5 text-[16px] font-bold text-stone-900 placeholder:text-stone-400 focus:border-[#A560E8] focus:outline-none focus:ring-4 focus:ring-[#A560E8]/20"
                />
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`text-[14px] font-extrabold ${wordCount >= 50 ? 'text-[#3F8F00]' : 'text-stone-500'}`}>{wordCount === 0 ? 'At least 50 words' : wordCount >= 50 ? `${wordCount} words` : `${50 - wordCount} more words needed`}</span>
                  <button type="button" onClick={() => setMode('topic')} className="min-h-[44px] px-1.5 text-[14.5px] font-black text-[#7733B5] underline hover:text-[#5F2594]">Type a topic instead</button>
                  <button type="button" disabled={!ready} onClick={() => start('hero')} className={`${BTN_GREEN} ml-auto min-h-[56px] whitespace-nowrap rounded-[18px] px-[24px] text-[17px]`}>{copy.cta}{arrow}</button>
                </div>
              </>
            )}
          </div>
          )}
          {copy.hero === 'text' && (
            <div className="mt-8 flex w-full max-w-[860px] flex-col gap-3 rounded-[26px] border-b-[6px] border-[#D9C2F2] bg-white p-4 text-left text-stone-900 shadow-[0_30px_50px_-22px_rgba(42,21,64,0.55)]">
              <label htmlFor="tool-text" className="sr-only">Text to summarize</label>
              <textarea
                id="tool-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={6}
                placeholder="Paste your article, paper or chapter here."
                className="w-full resize-y rounded-[18px] border-2 border-[#DCC3F6] bg-[#FBF8FF] px-[18px] py-3.5 text-[16px] font-bold text-stone-900 placeholder:text-stone-400 focus:border-[#A560E8] focus:outline-none focus:ring-4 focus:ring-[#A560E8]/20"
              />
              <div className="flex flex-wrap items-center gap-3">
                <span className={`text-[14px] font-extrabold ${textWords >= 50 ? 'text-[#3F8F00]' : 'text-stone-500'}`}>{textWords === 0 ? 'At least 50 words' : textWords >= 50 ? `${textWords.toLocaleString('en-US')} words` : `${50 - textWords} more words needed`}</span>
                <button type="button" disabled={!ready} onClick={() => start('hero')} className={`${BTN_GREEN} min-h-[56px] w-full whitespace-nowrap rounded-[18px] px-[24px] text-[17px] sm:ml-auto sm:w-auto`}>{copy.cta}{arrow}</button>
              </div>
            </div>
          )}
          {copy.hero === 'button' && (
            <div className="mt-8 flex flex-col items-center gap-5">
              <button type="button" onClick={() => start('hero')} className={`${BTN_GREEN} min-h-[68px] w-full whitespace-nowrap rounded-[20px] px-9 text-[20px] sm:w-auto sm:text-[22px]`}>{copy.cta}{arrow}</button>
              <ul className="m-0 flex list-none flex-wrap justify-center gap-x-5 gap-y-2 p-0 text-[14.5px] font-extrabold text-white sm:text-[15.5px]">
                {['Estimated grade', 'Rubric scores', 'Feedback on your sentences'].map((t) => (
                  <li key={t} className="flex items-center gap-2"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#58CC02] text-white">{check}</span>{t}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="m-0 mt-4 text-[14.5px] font-extrabold text-[#F3EAFF] sm:text-[15.5px]">
            {signedIn ? (isPack ? 'Opens your study packs with this filled in. A pack costs 1 credit.' : 'Opens the tool in your account.') : copy.nextStep}
          </p>
        </div>
      </section>

      {/* ── Live demo ── */}
      <section className="bg-[#FBF8FF] px-4 py-14 sm:px-6 sm:py-20" aria-labelledby="tool-demo">
        <div className={`mx-auto w-full ${variant === 'essay' ? 'max-w-[1160px]' : 'max-w-[1040px]'}`}>
          <p className={`${EYEBROW} m-0 text-center`}>See it first</p>
          <h2 id="tool-demo" className="m-0 mt-2 text-center text-[1.75rem] font-black leading-[1.1] tracking-[-0.02em] sm:text-[2.3rem]">{copy.demoTitle}</h2>
          <p className="m-0 mx-auto mt-3 max-w-[620px] text-center text-[16px] font-bold leading-[1.45] text-stone-600">{copy.demoSub}</p>
          {isPack && (
            <div className={`mt-8 grid gap-5 ${variant === 'study-pack' ? 'lg:grid-cols-2' : 'mx-auto max-w-[680px]'}`}>
              {variant !== 'quiz' && <FlashcardDemo />}
              {variant !== 'flashcards' && <QuizDemo />}
            </div>
          )}
          {variant === 'essay' && (
            <div className="mt-8 overflow-hidden rounded-[24px] border-2 border-[#C9A0F0] bg-white shadow-[0_22px_50px_-34px_rgba(90,45,140,0.55)]">
              <Suspense fallback={<div className="min-h-[480px] w-full bg-white" aria-hidden />}>
                <InteractiveDocumentAnalysis onNavigate={onNavigate as (page: string) => void} landingHeroEmbed />
              </Suspense>
            </div>
          )}
          {variant === 'summarizer' && (
            <div className={`${CARD} mx-auto mt-8 max-w-[900px] overflow-hidden p-2 sm:p-3`}>
              <video src="/writescholar-summarizer-demo.mp4" autoPlay muted loop playsInline preload="metadata" className="block w-full rounded-[16px]" aria-label="Recording of the summarizer turning notes into a short summary" />
            </div>
          )}
        </div>
      </section>

      {/* ── What you get ── */}
      <section className="px-4 py-14 sm:px-6 sm:py-20" aria-labelledby="tool-pack">
        <div className="mx-auto w-full max-w-[1100px]">
          <p className={`${EYEBROW} m-0 text-center`}>{copy.partsEyebrow}</p>
          <h2 id="tool-pack" className="m-0 mt-2 text-center text-[1.75rem] font-black leading-[1.1] tracking-[-0.02em] sm:text-[2.3rem]">{copy.partsTitle}</h2>
          <p className="m-0 mx-auto mt-3 max-w-[640px] text-center text-[16px] font-bold leading-[1.45] text-stone-600">{copy.partsSub}</p>
          <ol className={`m-0 mt-8 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 ${copy.parts.length === 5 ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}>
            {copy.parts.map((p, n) => (
              <li key={p.title} className={`flex flex-col gap-2 rounded-[22px] p-[18px] ${p.mine ? 'border-2 border-[#A560E8] bg-[#F7F1FF] shadow-[0_18px_34px_-22px_rgba(90,45,140,0.6)]' : 'border border-[#E4D4F8] bg-white'}`}>
                <span className="flex items-center gap-2.5">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[15px] font-black ${p.mine ? 'bg-[#A560E8] text-white' : 'bg-[#F3EAFF] text-[#7733B5]'}`}>{n + 1}</span>
                  <span className="text-[19px] font-black text-stone-900">{p.title}</span>
                </span>
                <span className="text-[14.5px] font-bold leading-[1.4] text-stone-600">{p.body}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── How it works + what free means ── */}
      <section className="bg-[#FBF8FF] px-4 py-14 sm:px-6 sm:py-20" aria-labelledby="tool-how">
        <div className="mx-auto grid w-full max-w-[1040px] gap-6 lg:grid-cols-[1.25fr_1fr]">
          <div>
            <p className={`${EYEBROW} m-0`}>How it works</p>
            <h2 id="tool-how" className="m-0 mt-2 text-[1.75rem] font-black leading-[1.1] tracking-[-0.02em] sm:text-[2.2rem]">Three steps</h2>
            <ol className="m-0 mt-6 flex list-none flex-col gap-3 p-0">
              {copy.steps.map((s, n) => (
                <li key={s.t} className={`${CARD} flex items-start gap-4 p-[18px]`}>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#A560E8] text-[17px] font-black text-white">{n + 1}</span>
                  <span>
                    <span className="block text-[18px] font-black text-stone-900">{s.t}</span>
                    <span className="mt-0.5 block text-[15px] font-bold leading-[1.45] text-stone-600">{s.b}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <aside className="flex flex-col justify-center gap-3 rounded-[26px] border-2 border-dashed border-[#C9A0F0] bg-white p-6" aria-label="What free means">
            <h3 className="m-0 text-[22px] font-black text-stone-900">What free means here</h3>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0 text-[15.5px] font-bold leading-[1.4] text-stone-700">
              {copy.free.map((t) => (
                <li key={t} className="flex items-start gap-2.5"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#58CC02] text-white">{check}</span>{t}</li>
              ))}
            </ul>
            <a {...link('pricing')} className="mt-1 text-[15px] font-black text-[#7733B5] underline hover:text-[#5F2594]">See what paid plans add</a>
          </aside>
        </div>
      </section>

      {/* ── Study advice ── */}
      <section className="px-4 py-14 sm:px-6 sm:py-20" aria-labelledby="tool-tips">
        <div className="mx-auto w-full max-w-[1040px]">
          <h2 id="tool-tips" className="m-0 text-center text-[1.75rem] font-black leading-[1.1] tracking-[-0.02em] sm:text-[2.2rem]">{copy.tipsTitle}</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {copy.tips.map((t) => (
              <div key={t.title} className="rounded-[22px] border border-[#E4D4F8] bg-white p-5">
                <h3 className="m-0 text-[18px] font-black text-stone-900">{t.title}</h3>
                <p className="m-0 mt-1.5 text-[15.5px] font-bold leading-[1.5] text-stone-600">{t.body}</p>
              </div>
            ))}
          </div>
          <p className="m-0 mt-6 text-center text-[15.5px] font-bold text-stone-600">
            More on this: <a {...link(guides[0].href)} className="font-black text-[#7733B5] underline">{guides[0].label}</a> and <a {...link(guides[1].href)} className="font-black text-[#7733B5] underline">{guides[1].label}</a>.
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-[#FBF8FF] px-4 py-14 sm:px-6 sm:py-20" aria-labelledby="tool-faq">
        <div className="mx-auto w-full max-w-[800px]">
          <h2 id="tool-faq" className="m-0 text-center text-[1.75rem] font-black leading-[1.1] tracking-[-0.02em] sm:text-[2.2rem]">Questions</h2>
          <div className="mt-7 flex flex-col gap-3">
            {copy.faqs.map((f, n) => {
              const open = openFaq === n;
              return (
                <div key={f.q} className="rounded-[20px] border border-[#E4D4F8] bg-white">
                  <h3 className="m-0">
                    <button type="button" aria-expanded={open} aria-controls={`tool-faq-${n}`} onClick={() => setOpenFaq(open ? null : n)} className="flex min-h-[60px] w-full items-center justify-between gap-4 px-5 py-3 text-left text-[17px] font-black text-stone-900">
                      {f.q}
                      <span aria-hidden className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F3EAFF] text-[20px] font-black leading-none text-[#7733B5] transition-transform ${open ? 'rotate-45' : ''}`}>+</span>
                    </button>
                  </h3>
                  <p id={`tool-faq-${n}`} hidden={!open} className="m-0 px-5 pb-5 text-[15.5px] font-bold leading-[1.55] text-stone-600">{f.a}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Related ── */}
      <section className="px-4 py-14 sm:px-6 sm:py-16" aria-labelledby="tool-related">
        <div className="mx-auto w-full max-w-[1040px]">
          <h2 id="tool-related" className="m-0 text-[1.4rem] font-black tracking-[-0.01em] sm:text-[1.7rem]">Also on WriteScholar</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {others.map((o) => (
              <a key={o.page} {...link(o.page)} className="group rounded-[22px] border border-[#E4D4F8] bg-white p-5 no-underline transition-all hover:-translate-y-0.5 hover:border-[#C9A0F0]">
                <span className="block text-[18px] font-black text-stone-900 group-hover:text-[#7733B5]">{o.title}</span>
                <span className="mt-1 block text-[15px] font-bold leading-[1.45] text-stone-600">{o.body}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Closing ── */}
      <section className="px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="relative mx-auto flex w-full max-w-[1040px] flex-wrap items-center gap-6 overflow-hidden rounded-[30px] bg-gradient-to-b from-[#A863EA] via-[#8E48CF] to-[#6A2AA6] px-6 py-8 text-white shadow-[0_30px_60px_-34px_rgba(90,45,140,0.8)] sm:px-10 sm:py-10">
          <span aria-hidden className="pointer-events-none absolute -right-40 -top-[120px] h-[520px] w-[520px] rounded-full bg-[#9652D3]" />
          <img src="/mascot-pointing.webp" alt="" width={130} height={130} loading="lazy" className="relative hidden h-[130px] w-[130px] shrink-0 object-contain sm:block" />
          <div className="relative min-w-0 flex-[1_1_320px]">
            <h2 className="m-0 text-[1.7rem] font-black leading-[1.08] tracking-[-0.02em] sm:text-[2.2rem]">{isPack ? <>What are we studying <span className="text-[#FFD84D]">next</span>?</> : variant === 'essay' ? <>Got a draft <span className="text-[#FFD84D]">ready</span>?</> : <>Got a long <span className="text-[#FFD84D]">reading</span>?</>}</h2>
            <p className="m-0 mt-2 text-[16px] font-bold text-[#F3EAFF]">{signedIn ? 'It is one click away in your account.' : copy.closingSub}</p>
          </div>
          <div className="relative flex flex-wrap gap-3">
            <button type="button" onClick={() => start('closing')} className={`${BTN_GREEN} min-h-[60px] whitespace-nowrap rounded-[18px] px-[26px] text-[18px]`}>{signedIn ? copy.cta : variant === 'summarizer' ? 'Make a free account' : copy.cta}{arrow}</button>
            {!signedIn && <a {...link('login')} className={`${BTN_WHITE} min-h-[60px] whitespace-nowrap rounded-[18px] px-[22px] text-[17px] no-underline`}>Log in</a>}
          </div>
        </div>
      </section>

      <Footer onNavigate={onNavigate as (page: string) => void} />
    </div>
    </LoggedInPageShell>
  );
}
