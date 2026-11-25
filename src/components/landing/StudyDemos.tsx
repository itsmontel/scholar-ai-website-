import { useState } from 'react';
import { BTN_GREEN, CARD } from './webStyle';

/**
 * Two working demos of what a study pack contains: flashcards you flip and a
 * quiz that explains each answer. Used on the home page and on the study
 * tool pages. The cards and questions are real ones from a pack made for
 * "Cell biology: mitosis and meiosis".
 */
const check = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12l5 5L20 7" /></svg>
);

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

/* ── Flashcard demo ─────────────────────────────────────────────── */
export function FlashcardDemo() {
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
export function QuizDemo() {
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
