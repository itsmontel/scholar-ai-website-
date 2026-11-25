import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { trackEvent } from '../../utils/analytics';
import { CITE_STYLES, type CiteStyle } from '../../utils/citations';
import { ESSAY_MAX_WORDS, ESSAY_MIN_WORDS, handOffEssayAnswers, handOffEssayQuestion } from '../../utils/essayPlan';
import { rememberDoor, saveAnswer, setAutoStart, stashLandingEssay, stashLandingTopic, stashPendingExamDate } from '../../utils/tryFirst';
import { FREE_GRADE_MAX_WORDS, FREE_GRADE_MIN_WORDS } from '../../config/pricing';
import { ESSAY_FILE_ACCEPT, EssayFileError, readEssayFile } from '../../utils/readEssayFile';
import { stashWorkspaceView } from '../workspace/workspaceNavigate';
import { countWords, readEssayFacts } from './HeroEssayGrader';
import { BTN_GREEN, BTN_WHITE, FONT, INPUT } from './webStyle';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export type FlowAsk = 'write' | 'exam' | 'grade';

/* The same choices as the Start an essay screen, so nothing is asked twice. */
const KINDS = [
  { value: 'Argumentative', hint: 'Take a side and defend it.' },
  { value: 'Analytical', hint: 'Pull something apart and explain it.' },
  { value: 'Compare and contrast', hint: 'Weigh two things against each other.' },
  { value: 'Reflective', hint: 'Your own experience, thought through.' },
  { value: 'Not sure', hint: 'We will work it out from the question.' },
] as const;
const LENGTHS = [1000, 1500, 2000, 3000] as const;
const TOPIC_MAX_CHARS = 200;

type Step = 'input' | 'kind' | 'cite' | 'length' | 'rubric' | 'date' | 'gate';

const HEAD: Record<FlowAsk, { label: string; icon: string; build: string; ready: string }> = {
  write: { label: 'Start my essay', icon: '/icons/write.webp', build: 'Build my outline', ready: 'Your outline is ready to build' },
  exam: { label: 'Make my pack', icon: '/icons/study-pack.webp', build: 'Make my study pack', ready: 'Your study pack is ready to make' },
  grade: { label: 'Grade my essay', icon: '/icons/grade-essay.webp', build: 'Grade my essay', ready: 'Your essay is ready to grade' },
};

const STEP_TITLE: Record<Exclude<Step, 'gate'>, { title: string; sub: string }> = {
  input: { title: '', sub: '' },
  kind: { title: 'What kind of essay is it?', sub: 'Pick the closest. It shapes how the outline argues.' },
  cite: { title: 'Which citation style does your course use?', sub: 'Usually named in your assignment brief. You can change it later.' },
  length: { title: 'How many words does it need to be?', sub: 'Every paragraph gets its own share of the total.' },
  rubric: { title: 'Do you have a rubric or brief?', sub: 'Paste it and the outline follows what your marker asks for. Skip it if you have none.' },
  date: { title: 'When is the exam?', sub: 'Your home screen counts down to it and plans what to study each day.' },
};

const fmtDate = (iso: string) => {
  const d = new Date(`${iso}T12:00:00`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};
const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const tick = (
  <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
);
const google = (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden><path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.4z" /><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z" /><path fill="#FBBC05" d="M6.4 14a6 6 0 0 1 0-3.9V7.5H3.1a10 10 0 0 0 0 9z" /><path fill="#EA4335" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.5l3.3 2.6C7.2 7.8 9.4 6 12 6z" /></svg>
);

/**
 * The landing pop-up behind "Start my essay", "Make my pack" and "Grade my
 * essay". The free part happens here: the essay questions, the exam date,
 * reading the pasted essay on the device. No AI runs and nothing is spent
 * until there is an account; then the job starts straight away with these
 * answers (Start an essay builds at once, the dashboard makes the pack or
 * grades the essay once).
 */
export default function DoorFlow({ ask, initial, signedIn, onClose, onNavigate }: {
  ask: FlowAsk;
  /** What was typed in the hero box; empty asks for it first. */
  initial: string;
  signedIn: boolean;
  onClose: () => void;
  onNavigate: (page: string) => void;
}) {
  const [text, setText] = useState(initial.trim());
  const [fileName, setFileName] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [inputError, setInputError] = useState('');
  const [kind, setKind] = useState<string | null>(null);
  const [cite, setCite] = useState<CiteStyle | 'later' | null>(null);
  const [length, setLength] = useState<number | null>(null);
  const [customLen, setCustomLen] = useState('');
  const [brief, setBrief] = useState('');
  const [examDate, setExamDate] = useState<string | null>(null);
  const [dateField, setDateField] = useState('');
  const [leaving, setLeaving] = useState(false);
  /** Which way the last move went, so the next step slides in from the right side. */
  const [dir, setDir] = useState<1 | -1>(1);

  const inputOk = (value: string) => {
    if (ask === 'write') return value.trim().length >= 12;
    if (ask === 'exam') return value.trim().length >= 2;
    const n = countWords(value);
    return n >= FREE_GRADE_MIN_WORDS && n <= FREE_GRADE_MAX_WORDS;
  };

  const steps = useMemo<Step[]>(() => {
    const first: Step[] = inputOk(initial) ? [] : ['input'];
    if (ask === 'write') return [...first, 'kind', 'cite', 'length', 'rubric', 'gate'];
    if (ask === 'exam') return [...first, 'date', 'gate'];
    return [...first, 'gate'];
    // The steps are fixed when the pop-up opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [at, setAt] = useState(0);
  const step = steps[at];
  const go = (to: number) => { setDir(to >= at ? 1 : -1); setAt(Math.max(0, Math.min(steps.length - 1, to))); };
  const next = () => go(at + 1);
  const jump = (s: Step) => { const i = steps.indexOf(s); if (i !== -1) go(i); };

  useEffect(() => {
    trackEvent('door_flow_step', { ask, step, n: at + 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Escape closes; the page behind does not scroll.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = overflow; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const panelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    // Focus the first thing to answer on each step.
    const t = window.setTimeout(() => {
      // Only a field takes focus by itself; a choice is never shown as picked before it is.
      const el = panelRef.current?.querySelector<HTMLElement>('[data-autofocus]');
      if (el) el.focus({ preventScroll: true });
      else panelRef.current?.focus({ preventScroll: true });
    }, 220);
    return () => window.clearTimeout(t);
  }, [at]);

  const close = () => {
    if (leaving) return;
    setLeaving(true);
    trackEvent('door_flow_closed', { ask, step });
    window.setTimeout(onClose, 180);
  };

  const facts = useMemo(() => (ask === 'grade' && inputOk(text) ? readEssayFacts(text, fileName) : null), [ask, text, fileName]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadFile = async (file: File) => {
    if (reading) return;
    setReading(true);
    setInputError('');
    try {
      const value = await readEssayFile(file);
      setText(value);
      setFileName(file.name);
    } catch (e) {
      setInputError(e instanceof EssayFileError ? e.message : 'We could not read that file. Paste the text instead.');
    } finally {
      setReading(false);
    }
  };

  const submitInput = () => {
    if (inputOk(text)) { setInputError(''); next(); return; }
    if (ask === 'write') setInputError('Paste the full question, as it was set.');
    else if (ask === 'exam') setInputError('Type what the exam is on, for example "Statistics 101".');
    else {
      const n = countWords(text);
      setInputError(n < FREE_GRADE_MIN_WORDS ? `Paste at least ${FREE_GRADE_MIN_WORDS} words of your essay.` : `That is over ${FREE_GRADE_MAX_WORDS.toLocaleString('en-US')} words. Paste one essay at a time.`);
    }
  };

  /** Save everything where the app looks for it, then on to the account (or straight in). */
  const finish = (how: 'google' | 'email' | 'signed_in') => {
    const value = text.trim();
    if (ask === 'write') {
      const words = length ?? 1500;
      handOffEssayQuestion(value, words);
      handOffEssayAnswers({ kind: kind ?? 'Not sure', cite: cite && cite !== 'later' ? cite : null, length: words, brief: brief.trim() });
      saveAnswer({ stage: 'start' });
      rememberDoor('essay');
      stashWorkspaceView('write');
    } else if (ask === 'exam') {
      stashLandingTopic(value.slice(0, TOPIC_MAX_CHARS));
      if (examDate) stashPendingExamDate(examDate);
      setAutoStart('pack');
      rememberDoor('exam');
    } else {
      stashLandingEssay(value);
      setAutoStart('grade');
      saveAnswer({ stage: 'draft' });
      rememberDoor('essay');
    }
    trackEvent('door_flow_done', { ask, how });
    trackEvent('door_selected', { door: ask === 'exam' ? 'exam' : 'essay', source: 'door_flow', ask, typed: true });
    if (how === 'google') { window.location.href = `${API_URL}/auth/google`; return; }
    onNavigate(how === 'signed_in' ? 'dashboard' : 'signup');
  };

  const head = HEAD[ask];
  const progress = Math.round(((at + 1) / steps.length) * 100);
  const customN = Number(customLen);
  const customOk = customLen !== '' && customN >= ESSAY_MIN_WORDS && customN <= ESSAY_MAX_WORDS;

  const opt = (on: boolean) =>
    `df-pop group flex min-h-[58px] w-full items-center justify-between gap-3 rounded-2xl border-2 border-b-4 px-4 py-3 text-left transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-2 ${
      on ? 'border-[#8A48C7] bg-[#F3EAFF]' : 'border-[#E7E5E4] bg-white hover:border-[#C9A0F0] hover:bg-[#FBF8FF]'
    }`;
  const pickTick = (on: boolean) => (
    <span aria-hidden className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all duration-200 ${on ? 'scale-100 bg-[#A560E8] text-white' : 'scale-90 border-2 border-[#E4D4F8] text-transparent group-hover:border-[#C9A0F0]'}`}>{tick}</span>
  );
  const stagger = (i: number) => ({ animationDelay: `${60 + i * 45}ms` });
  /** Pick an answer, show it chosen for a beat, then move on. */
  const pickThen = (fn: () => void) => { fn(); window.setTimeout(next, 260); };

  const summary: { label: string; to: Step }[] = ask === 'write'
    ? [
        { label: kind ?? 'Not sure', to: 'kind' },
        { label: cite && cite !== 'later' ? cite : 'Citation style later', to: 'cite' },
        { label: `${(length ?? 1500).toLocaleString('en-US')} words`, to: 'length' },
        ...(brief.trim() ? [{ label: 'Rubric added', to: 'rubric' as Step }] : []),
      ]
    : ask === 'exam'
      ? [{ label: examDate && examDate !== 'none' ? `Exam ${fmtDate(examDate)}` : 'No exam date', to: 'date' }]
      : [];

  let body: ReactNode = null;
  if (step === 'input') {
    body = (
      <form onSubmit={(e) => { e.preventDefault(); submitInput(); }} className="flex flex-col gap-3">
        <h2 id="door-flow-title" className="m-0 text-[25px] font-black leading-[1.15] sm:text-[28px]">
          {ask === 'write' ? 'What is the essay question?' : ask === 'exam' ? 'What is the exam on?' : 'Paste your essay'}
        </h2>
        <p className="m-0 text-[15.5px] font-bold leading-snug text-[#57534E]">
          {ask === 'write' ? 'Paste it as it was set. A few quick questions, then your outline.' : ask === 'exam' ? 'A course, a chapter or one idea.' : `Or upload it as a PDF or Word file. ${FREE_GRADE_MIN_WORDS} words or more.`}
        </p>
        <label htmlFor="door-flow-input" className="sr-only">{ask === 'write' ? 'Your essay question' : ask === 'exam' ? 'What the exam is on' : 'Your essay'}</label>
        {ask === 'exam' ? (
          <input id="door-flow-input" data-autofocus value={text} maxLength={TOPIC_MAX_CHARS} onChange={(e) => { setText(e.target.value); setInputError(''); }} placeholder="For example: Statistics 101" className={`${INPUT} min-h-[56px] px-4 text-[17px]`} />
        ) : (
          <textarea id="door-flow-input" data-autofocus value={text} rows={ask === 'grade' ? 7 : 3} onChange={(e) => { setText(e.target.value); setFileName(null); setInputError(''); }} placeholder={ask === 'write' ? 'For example: To what extent was the Treaty of Versailles too harsh?' : 'Paste your essay here'} className={`${INPUT} w-full resize-none px-4 py-3 text-[16.5px] leading-[1.5]`} />
        )}
        {inputError && <p role="alert" className="df-shake m-0 text-[14.5px] font-extrabold text-[#C2410C]">{inputError}</p>}
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className={`${BTN_GREEN} min-h-[54px] px-7 text-[17px]`}>Next</button>
          {ask === 'grade' && (
            <label className={`${BTN_WHITE} min-h-[54px] cursor-pointer px-5 text-[15.5px]`}>
              {reading ? 'Reading the file…' : fileName ? `Loaded ${fileName}` : 'Upload a file'}
              <input type="file" accept={ESSAY_FILE_ACCEPT} className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) void loadFile(f); e.target.value = ''; }} />
            </label>
          )}
          {ask === 'grade' && text.trim() && <span className="text-[14px] font-extrabold tabular-nums text-[#57534E]">{countWords(text).toLocaleString('en-US')} words</span>}
        </div>
      </form>
    );
  } else if (step === 'kind') {
    body = (
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {KINDS.map((k, i) => (
          <button key={k.value} type="button" aria-pressed={kind === k.value} style={stagger(i)} onClick={() => pickThen(() => setKind(k.value))} className={`${opt(kind === k.value)} ${k.value === 'Not sure' ? 'sm:col-span-2' : ''}`}>
            <span className="min-w-0">
              <span className="block text-[16.5px] font-black text-[#1C1917]">{k.value}</span>
              <span className="block text-[13.5px] font-bold text-[#57534E]">{k.hint}</span>
            </span>
            {pickTick(kind === k.value)}
          </button>
        ))}
      </div>
    );
  } else if (step === 'cite') {
    body = (
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {CITE_STYLES.map((c, i) => (
          <button key={c} type="button" aria-pressed={cite === c} style={stagger(i)} onClick={() => pickThen(() => setCite(c))} className={opt(cite === c)}>
            <span className="text-[16.5px] font-black text-[#1C1917]">{c}</span>
            {pickTick(cite === c)}
          </button>
        ))}
        <button type="button" aria-pressed={cite === 'later'} style={stagger(CITE_STYLES.length)} onClick={() => pickThen(() => setCite('later'))} className={`${opt(cite === 'later')} col-span-2 sm:col-span-3`}>
          <span className="text-[16px] font-black text-[#1C1917]">I am not sure yet</span>
          {pickTick(cite === 'later')}
        </button>
      </div>
    );
  } else if (step === 'length') {
    body = (
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {LENGTHS.map((n, i) => (
            <button key={n} type="button" aria-pressed={length === n} style={stagger(i)} onClick={() => pickThen(() => { setLength(n); setCustomLen(''); })} className={`${opt(length === n)} !flex-col !items-center !justify-center !gap-0 text-center`}>
              <span className="block text-[21px] font-black tabular-nums text-[#1C1917]">{n.toLocaleString('en-US')}</span>
              <span className="block text-[13px] font-bold text-[#57534E]">words</span>
            </button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); if (customOk) { setLength(customN); next(); } }} className="df-pop flex flex-wrap items-center gap-2.5" style={stagger(4)}>
          <label htmlFor="door-flow-len" className="text-[15px] font-extrabold text-[#57534E]">Another length</label>
          <input id="door-flow-len" inputMode="numeric" value={customLen} onChange={(e) => setCustomLen(e.target.value.replace(/[^\d]/g, '').slice(0, 5))} placeholder="2,500" className={`${INPUT} min-h-[48px] w-28 px-3 text-[16px] tabular-nums`} />
          <button type="submit" disabled={!customOk} className={`${BTN_WHITE} min-h-[48px] px-4 text-[15px]`}>Use it</button>
          {customLen && !customOk && <span className="text-[13.5px] font-bold text-[#C2410C]">Between {ESSAY_MIN_WORDS} and {ESSAY_MAX_WORDS.toLocaleString('en-US')} words</span>}
        </form>
      </div>
    );
  } else if (step === 'rubric') {
    body = (
      <div className="flex flex-col gap-3">
        <label htmlFor="door-flow-brief" className="sr-only">Your rubric or brief</label>
        <textarea id="door-flow-brief" data-autofocus value={brief} rows={5} onChange={(e) => setBrief(e.target.value.slice(0, 8000))} placeholder="Paste the marking criteria or assignment brief" className={`${INPUT} df-pop w-full resize-none px-4 py-3 text-[15.5px] leading-[1.5]`} />
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={next} className={`${BTN_GREEN} min-h-[54px] px-7 text-[17px]`}>{brief.trim() ? 'Use this rubric' : 'Skip, I have none'}</button>
          <span className="text-[14px] font-bold text-[#57534E]">You can upload a file later, on the outline screen.</span>
        </div>
      </div>
    );
  } else if (step === 'date') {
    const min = todayIso();
    body = (
      <div className="flex flex-col gap-3">
        <form onSubmit={(e) => { e.preventDefault(); if (dateField >= min) pickThen(() => setExamDate(dateField)); }} className="df-pop flex flex-wrap items-center gap-2.5" style={stagger(0)}>
          <label htmlFor="door-flow-date" className="sr-only">Exam date</label>
          <input id="door-flow-date" data-autofocus type="date" min={min} value={dateField} onChange={(e) => setDateField(e.target.value)} className={`${INPUT} min-h-[56px] flex-1 px-4 text-[17px]`} />
          <button type="submit" disabled={!dateField || dateField < min} className={`${BTN_GREEN} min-h-[56px] px-6 text-[16.5px]`}>
            {dateField && dateField >= min ? `Exam on ${fmtDate(dateField)}` : 'Pick a date'}
          </button>
        </form>
        <button type="button" style={stagger(1)} onClick={() => pickThen(() => setExamDate('none'))} className={opt(examDate === 'none')}>
          <span>
            <span className="block text-[16px] font-black text-[#1C1917]">No date yet</span>
            <span className="block text-[13.5px] font-bold text-[#57534E]">Add it later from your home screen.</span>
          </span>
          {pickTick(examDate === 'none')}
        </button>
      </div>
    );
  } else {
    // The gate: what was answered, what happens next, and the one action.
    body = (
      <div className="flex flex-col gap-4">
        {summary.length > 0 && (
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0" aria-label="Your answers">
            {summary.map((s, i) => (
              <li key={s.label} className="df-pop" style={stagger(i)}>
                <button type="button" onClick={() => jump(s.to)} aria-label={`${s.label}: change`} className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full border border-[#BFE89A] bg-[#F4FCEB] px-3.5 text-[14px] font-extrabold text-[#2F6B00] transition-colors hover:border-[#8FD14F]">
                  {tick}{s.label}
                </button>
              </li>
            ))}
          </ul>
        )}
        {facts && (
          <ul className="m-0 flex list-none flex-col gap-2 rounded-2xl border border-[#E4D4F8] bg-[#FBF8FF] p-4" aria-label="What we read on your device">
            {[
              `${facts.words.toLocaleString('en-US')} words in ${facts.paragraphs} paragraph${facts.paragraphs === 1 ? '' : 's'}`,
              `Reads like ${/^[aeiou]/i.test(facts.kind) ? 'an' : 'a'} ${facts.kind}`,
              facts.thesis ? `Thesis found: “${facts.thesis}”` : 'No clear thesis sentence found yet',
              'Next: scoring thesis, evidence, analysis, structure and style',
            ].map((line, i) => (
              <li key={line} className="df-line flex items-start gap-2.5 text-[15px] font-bold leading-snug text-[#1C1917]" style={{ animationDelay: `${150 + i * 380}ms` }}>
                <span aria-hidden className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${i === 3 ? 'bg-[#EADCFB] text-[#7733B5]' : 'bg-[#58CC02] text-white'}`}>{i === 3 ? <span className="df-dot h-1.5 w-1.5 rounded-full bg-[#7733B5]" /> : tick}</span>
                <span className="min-w-0">{line}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="flex items-center gap-4">
          <img src={ask === 'write' ? '/icons/outline.webp' : head.icon} alt="" width={64} height={64} className="df-bob h-14 w-14 shrink-0 object-contain sm:h-16 sm:w-16" />
          <div className="min-w-0">
            <h2 id="door-flow-title" className="m-0 text-[24px] font-black leading-[1.15] sm:text-[27px]">{head.ready}</h2>
            <p className="m-0 mt-1 text-[15.5px] font-bold leading-snug text-[#57534E]">
              {ask === 'write'
                ? 'Three ways to argue it, each with an outline and a word budget for every paragraph. You still write it.'
                : ask === 'exam'
                  ? 'Notes, a quiz, flashcards and games on your topic, made the moment you are in.'
                  : 'An estimated grade, every rubric score and what to fix first.'}
              {!signedIn && ' Make a free account and it starts straight away.'}
            </p>
          </div>
        </div>
        {signedIn ? (
          <button type="button" onClick={() => finish('signed_in')} className={`${BTN_GREEN} df-cta min-h-[58px] w-full text-[18px]`}>{head.build}</button>
        ) : (
          <div className="flex flex-col gap-2.5">
            <button type="button" onClick={() => finish('google')} className={`${BTN_GREEN} df-cta min-h-[58px] w-full text-[17.5px]`}>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white">{google}</span>
              Continue with Google
            </button>
            <button type="button" onClick={() => finish('email')} className={`${BTN_WHITE} min-h-[52px] w-full text-[16px]`}>Sign up with email</button>
            <p className="m-0 text-center text-[13.5px] font-bold text-[#57534E]">Free account, no card. {ask === 'grade' ? 'Your essay is saved.' : 'Your answers are saved.'}</p>
          </div>
        )}
      </div>
    );
  }

  const title = step !== 'input' && step !== 'gate' ? STEP_TITLE[step] : null;

  return (
    <div className="fixed inset-0 z-[230] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="door-flow-title" style={FONT}>
      <style>{CSS}</style>
      <div className={`absolute inset-0 bg-[#2A1540]/70 ${leaving ? 'df-fade-out' : 'df-fade'}`} onClick={close} aria-hidden />
      <div ref={panelRef} tabIndex={-1} className={`relative flex outline-none [&_button:focus-visible]:outline-none [&_button:focus-visible]:ring-4 [&_button:focus-visible]:ring-[#A560E8]/40 max-h-[94dvh] w-full max-w-[680px] flex-col overflow-hidden rounded-t-[28px] bg-white text-[#1C1917] shadow-[0_40px_90px_-30px_rgba(42,21,64,0.7)] sm:rounded-[28px] ${leaving ? 'df-out' : 'df-in'}`}>
        <div className="flex items-center gap-3 px-5 pt-5 sm:px-8 sm:pt-7">
          {at > 0 ? (
            <button type="button" onClick={() => go(at - 1)} aria-label="Back" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#57534E] transition-colors hover:bg-[#F3EAFF] hover:text-[#7733B5]">
              <svg aria-hidden width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
          ) : (
            <img src={head.icon} alt="" width={44} height={44} className="h-11 w-11 shrink-0 object-contain" />
          )}
          <div className="min-w-0 flex-1">
            <p className="m-0 text-[12px] font-black uppercase tracking-[0.14em] text-[#7733B5]">{head.label}</p>
            <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-[#EADCFB]" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-label={`Step ${at + 1} of ${steps.length}`}>
              <div className="df-bar h-full rounded-full bg-[#58CC02]" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <button type="button" onClick={close} aria-label="Close" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#57534E] transition-colors hover:bg-[#F3EAFF] hover:text-[#7733B5]">
            <svg aria-hidden width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        <div className="overflow-y-auto px-5 pb-6 pt-4 sm:px-8 sm:pb-8">
          {step !== 'input' && ask !== 'grade' && (
            <div className="mb-4 rounded-2xl border border-[#E4D4F8] bg-[#FBF8FF] px-4 py-3">
              <p className="m-0 text-[11.5px] font-black uppercase tracking-[0.14em] text-[#7733B5]">{ask === 'write' ? 'Your question' : 'Your exam'}</p>
              <p className="m-0 mt-0.5 line-clamp-2 text-[15.5px] font-extrabold leading-snug">{text.trim()}</p>
            </div>
          )}
          <div key={step} data-step className={dir === 1 ? 'df-step' : 'df-step-back'}>
            {title && (
              <>
                <h2 id="door-flow-title" className="m-0 text-[24px] font-black leading-[1.15] sm:text-[27px]">{title.title}</h2>
                <p className="m-0 mb-4 mt-1 text-[15px] font-bold leading-snug text-[#57534E]">{title.sub}</p>
              </>
            )}
            {body}
          </div>
        </div>
      </div>
    </div>
  );
}

const CSS = `
@keyframes df-fade { from { opacity: 0 } to { opacity: 1 } }
@keyframes df-in { from { opacity: 0; transform: translateY(28px) scale(.96) } to { opacity: 1; transform: none } }
@keyframes df-out { to { opacity: 0; transform: translateY(18px) scale(.97) } }
@keyframes df-step { from { opacity: 0; transform: translateX(26px) } to { opacity: 1; transform: none } }
@keyframes df-step-back { from { opacity: 0; transform: translateX(-26px) } to { opacity: 1; transform: none } }
@keyframes df-pop { from { opacity: 0; transform: translateY(10px) scale(.97) } to { opacity: 1; transform: none } }
@keyframes df-line { from { opacity: 0; transform: translateX(-8px) } to { opacity: 1; transform: none } }
@keyframes df-bob { 0%,100% { transform: translateY(0) rotate(-3deg) } 50% { transform: translateY(-5px) rotate(3deg) } }
@keyframes df-cta { 0%,100% { box-shadow: 0 0 0 0 rgba(88,204,2,.45) } 60% { box-shadow: 0 0 0 10px rgba(88,204,2,0) } }
@keyframes df-dot { 0%,100% { opacity: .35 } 50% { opacity: 1 } }
@keyframes df-shake { 0%,100% { transform: none } 25% { transform: translateX(-5px) } 75% { transform: translateX(5px) } }
.df-fade { animation: df-fade .22s ease-out both }
.df-fade-out { animation: df-fade .18s ease-in reverse both }
.df-in { animation: df-in .34s cubic-bezier(.2,.9,.3,1.15) both }
.df-out { animation: df-out .18s ease-in both }
.df-step { animation: df-step .28s cubic-bezier(.2,.8,.2,1) backwards }
.df-step-back { animation: df-step-back .28s cubic-bezier(.2,.8,.2,1) backwards }
.df-pop { animation: df-pop .32s cubic-bezier(.2,.8,.2,1) backwards }
.df-line { animation: df-line .3s ease-out backwards }
.df-bob { animation: df-bob 3.2s ease-in-out infinite }
.df-cta { animation: df-cta 2.2s ease-out 1.2s infinite }
.df-dot { animation: df-dot 1s ease-in-out infinite }
.df-shake { animation: df-shake .3s ease-in-out }
.df-bar { transition: width .45s cubic-bezier(.2,.8,.2,1) }
@media (prefers-reduced-motion: reduce) {
  .df-fade,.df-fade-out,.df-in,.df-out,.df-step,.df-step-back,.df-pop,.df-line,.df-bob,.df-cta,.df-dot,.df-shake { animation: none !important }
  .df-bar { transition: none }
}
`;
