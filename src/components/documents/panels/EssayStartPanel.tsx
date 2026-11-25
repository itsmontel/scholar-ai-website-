import { useEffect, useMemo, useRef, useState } from 'react';
import { BTN_GREEN, BTN_WHITE, FONT } from '../../landing/webStyle';
import { trackEvent } from '../../../utils/analytics';
import { CITE_STYLES, isCiteStyle, type CiteStyle } from '../../../utils/citations';
import {
  BRIEF_MAX_CHARS,
  RUBRIC_ACCEPT,
  ESSAY_MAX_WORDS,
  ESSAY_MIN_WORDS,
  ESSAY_QUESTION_DRAFT_KEY,
  WritingError,
  clearEssayAutobuild,
  fetchWritingUsage,
  peekEssayAutobuild,
  takeEssayAnswers,
  resetDay,
  readRubricFile,
  requestEssayPlan,
  type EssayPlan,
  type OutlineSection,
  type ThesisOption,
  type WritingUsage,
} from '../../../utils/essayPlan';

/**
 * "Write an essay": the step before a draft exists.
 *
 * The student pastes the question they were set, answers four one-tap
 * questions (kind, citation style, length, rubric), picks one of three
 * arguments, adjusts the outline, and opens it in the editor as headings to
 * write under. Nothing here writes the essay; it only gets them started.
 */
const QUESTION_DRAFT_KEY = ESSAY_QUESTION_DRAFT_KEY;
const KINDS = ['Argumentative', 'Analytical', 'Compare and contrast', 'Reflective', 'Not sure'] as const;
const LENGTHS = [1000, 1500, 2000, 3000] as const;
const MIN_WORDS = ESSAY_MIN_WORDS;
const MAX_WORDS = ESSAY_MAX_WORDS;
// Short enough that all three sit on one line beside "Or try one".
const EXAMPLES = [
  'How does Shakespeare present ambition in Macbeth?',
  'Was the Treaty of Versailles too harsh?',
  'Should social media be regulated?',
];
const OWN = -1;
const STEP_COUNT = 4;
const KIND_HINT: Record<(typeof KINDS)[number], string> = {
  Argumentative: 'Take a side and defend it.',
  Analytical: 'Break something down and explain how it works.',
  'Compare and contrast': 'Set two things side by side.',
  Reflective: 'Write about your own experience and what it taught you.',
  'Not sure': 'Scholar will work it out from the question.',
};
/** Where each style is common, and what a citation in it looks like. */
const CITE_INFO: Record<CiteStyle, { where: string; example: string }> = {
  APA: { where: 'Psychology, education and the sciences', example: '(Smith, 2020)' },
  MLA: { where: 'English and the humanities', example: '(Smith 25)' },
  Chicago: { where: 'History and some social sciences', example: '(Smith 2020)' },
  Harvard: { where: 'Widely used at UK universities', example: '(Smith, 2020)' },
  IEEE: { where: 'Engineering, computing and technology', example: '[1]' },
  Vancouver: { where: 'Medicine, nursing and health sciences', example: '[1]' },
};
/** The banner asks one thing at a time: its heading for the question screen and each step after it. */
const STEP_HEAD = [
  { pre: 'What is the essay ', hi: 'about', post: '?', sub: 'Paste the question you were set. A few quick questions, then your outline.' },
  { pre: 'What ', hi: 'kind', post: ' of essay is it?', sub: 'Pick the closest. It shapes how the outline argues.' },
  { pre: 'Which ', hi: 'citation style', post: ' does your course use?', sub: 'It is usually named in your assignment brief. You can change it later.' },
  { pre: 'How many ', hi: 'words', post: ' does it need to be?', sub: 'Each paragraph gets a share of the total.' },
  { pre: 'Do you have a ', hi: 'rubric', post: ' or brief?', sub: 'Paste it or upload the file, and the outline follows what your marker asks for. Leave it empty if you have none.' },
];
const STEP_MASCOT = ['/mascot-pointing.webp', '/mascot-thinking-still.webp', '/mascot-thinking-still.webp', '/mascot-thinking-still.webp', '/mascot-paper-still.webp'];
/** Shared with the editor's Cite button and the grader, so the style is chosen once. */
const CITE_STYLE_KEY = 'writescholar_editor_citation_style';

const arrow = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
const tick = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12l5 5L20 7" /></svg>
);
const spin = (
  <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity={0.3} strokeWidth={3} />
    <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth={3} strokeLinecap="round" />
  </svg>
);

const BUILD_STEPS = ['Reading your question', 'Finding three arguments you could make', 'Planning each paragraph'];

/** While the outline is built: Scholar thinking, the three things being done, and the shape of what is coming. */
function Building() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setStep((n) => Math.min(n + 1, BUILD_STEPS.length - 1)), 2200);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div className="ws-rise flex flex-col gap-5">
      <p className="sr-only" aria-live="polite">Building three possible arguments and an outline for each. This takes a few seconds.</p>
      <div className="flex flex-wrap items-center gap-5 rounded-[26px] border border-[#E4D4F8] bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
        <img src="/mascot-thinking-still.webp" alt="" width={96} height={96} className="ws-bob h-24 w-24 shrink-0 object-contain" />
        <ol aria-hidden className="m-0 flex min-w-0 flex-1 basis-[260px] list-none flex-col gap-2.5 p-0">
          {BUILD_STEPS.map((label, i) => {
            const done = i < step;
            const now = i === step;
            return (
              <li key={label} className={`flex items-center gap-3 text-[16.5px] transition-colors duration-300 ${done ? 'font-extrabold text-stone-500 dark:text-stone-400' : now ? 'font-black text-stone-900 dark:text-stone-50' : 'font-extrabold text-stone-400 dark:text-stone-500'}`}>
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors duration-300 ${done ? 'bg-[#58CC02] text-white' : now ? 'bg-[#A560E8] text-white' : 'border-2 border-[#D9C2F2] dark:border-stone-600'}`}>
                  {done ? <span className="ws-tick">{tick}</span> : now ? <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity={0.3} strokeWidth={3} /><path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth={3} strokeLinecap="round" /></svg> : null}
                </span>
                {label}
              </li>
            );
          })}
        </ol>
      </div>
      <div aria-hidden className="grid gap-5 lg:grid-cols-2">
        {[0, 1].map((col) => (
          <div key={col} className="flex flex-col gap-3 rounded-[26px] border border-[#E4D4F8] bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
            <div className="ws-shimmer h-7 w-2/3 rounded-full" />
            {[0, 1, 2].map((r) => <div key={r} className="ws-shimmer h-[76px] rounded-[18px]" style={{ animationDelay: `${(col * 3 + r) * 120}ms` }} />)}
          </div>
        ))}
      </div>
    </div>
  );
}

const chip = (on: boolean) =>
  `min-h-[44px] rounded-full border-2 border-b-4 px-4 text-[14.5px] transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-2 ${
    on
      ? 'border-[#8A48C7] bg-[#A560E8] font-black text-white'
      : 'border-[#E4D4F8] bg-[#F7F1FF] font-extrabold text-stone-900 hover:border-[#C9A0F0] dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100'
  }`;
/** The same outline with its word counts scaled, in proportion, to add up to about `total`. */
const scaleOutline = (list: OutlineSection[], total: number): OutlineSection[] => {
  const sum = list.reduce((acc, x) => acc + (x.words || 0), 0) || 1;
  return list.map((x) => ({ ...x, words: Math.max(30, Math.round(((x.words || 0) * total) / sum / 10) * 10) }));
};

/** A big, one-tap answer on a step screen. */
const opt = (on: boolean) =>
  `min-h-[68px] rounded-[18px] border-2 border-b-4 px-4 py-3 text-left transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-2 ${
    on
      ? 'border-[#8A48C7] bg-[#A560E8] text-white'
      : 'border-[#E4D4F8] bg-[#FBF8FF] text-stone-900 hover:border-[#C9A0F0] dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100'
  }`;
const iconBtn = 'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-b-4 border-[#E4D4F8] bg-white text-[#7733B5] transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 dark:border-stone-700 dark:bg-stone-900 dark:text-[#C9A0F0]';

export default function EssayStartPanel({
  onStart,
  onBlankDraft,
  onGradeInstead,
  onUpgrade,
}: {
  /** Create the draft from the plan and open it. Resolves false if the document could not be made. */
  onStart: (plan: EssayPlan & { title: string }) => Promise<boolean>;
  /** Open an empty draft titled from the question, with no outline. Resolves false if the document could not be made. */
  onBlankDraft: (question: string) => Promise<boolean>;
  onGradeInstead: () => void;
  onUpgrade: (source?: string) => void;
}) {
  const [question, setQuestion] = useState(() => {
    try { return sessionStorage.getItem(QUESTION_DRAFT_KEY) || ''; } catch { return ''; }
  });
  const [brief, setBrief] = useState('');
  /** The rubric file being read, the one that was read, and anything to say about it. */
  const [briefReading, setBriefReading] = useState(false);
  const [briefFile, setBriefFile] = useState<string | null>(null);
  const [briefNote, setBriefNote] = useState<{ text: string; warn: boolean } | null>(null);
  const [briefDrag, setBriefDrag] = useState(false);
  const briefFileRef = useRef<HTMLInputElement | null>(null);
  /** 0 is the question; 1 to STEP_COUNT are the short questions asked before the outline is built. */
  const [step, setStep] = useState(0);
  const [kind, setKind] = useState<(typeof KINDS)[number]>('Not sure');
  const [length, setLength] = useState<number>(1500);
  const [cite, setCite] = useState<CiteStyle | null>(() => {
    try { const v = localStorage.getItem(CITE_STYLE_KEY); return isCiteStyle(v) ? v : null; } catch { return null; }
  });
  // An answer is only shown as chosen once the student has chosen it. The
  // citation style they used last time is the one exception.
  const [kindPicked, setKindPicked] = useState(false);
  const [lengthPicked, setLengthPicked] = useState(false);
  const [citePicked, setCitePicked] = useState(() => cite !== null);
  /** Text in the "another length" field. */
  const [customLen, setCustomLen] = useState('');
  /** True while answers are being changed after an outline exists. */
  const [editing, setEditing] = useState(false);
  /** The outline's own length control, opened from its "Change" link. */
  const [lengthOpen, setLengthOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [opening, setOpening] = useState(false);
  const [blanking, setBlanking] = useState(false);
  const [error, setError] = useState<{ message: string; upgrade: boolean } | null>(null);
  const [usage, setUsage] = useState<WritingUsage | null>(null);

  const [title, setTitle] = useState('');
  const [theses, setTheses] = useState<ThesisOption[] | null>(null);
  const [picked, setPicked] = useState(0);
  const [ownThesis, setOwnThesis] = useState('');
  /** Outline edits are kept per thesis, so switching back keeps the changes. */
  const [outlines, setOutlines] = useState<OutlineSection[][]>([]);
  const resultRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let alive = true;
    fetchWritingUsage().then((u) => { if (alive) setUsage(u); }).catch(() => { /* the allowance line just stays hidden */ });
    return () => { alive = false; };
  }, []);

  const lengthOk = length >= MIN_WORDS && length <= MAX_WORDS;
  const ready = question.trim().length >= 12 && lengthOk;
  const outlineIndex = picked === OWN ? 0 : picked;
  const sections = outlines[outlineIndex] ?? [];
  const totalWords = useMemo(() => sections.reduce((a, s) => a + (s.words || 0), 0), [sections]);
  const thesisText = picked === OWN ? ownThesis.trim() : theses?.[picked]?.thesis ?? '';
  /** No outlines left this period and none built yet: the way forward is a blank draft. */
  const outOfOutlines = !!usage && usage.plansLeft <= 0 && !theses;
  // Seen once per visit to this screen: how many people arrive with no outlines left.
  const limitSeen = useRef(false);
  useEffect(() => {
    if (!outOfOutlines || limitSeen.current || !usage) return;
    limitSeen.current = true;
    trackEvent('outline_limit_hit', { where: 'notice', paid: usage.paid });
  }, [outOfOutlines, usage]);
  const canStart = !!theses && lengthOk && thesisText.length >= 10 && sections.length >= 2 && sections.every((s) => s.heading.trim());

  const build = async (source: 'first' | 'more') => {
    if (!ready || loading) return;
    setLoading(true);
    setError(null);
    try {
      const plan = await requestEssayPlan({ question: question.trim(), essayType: kind, wordTarget: length, brief: brief.trim() || undefined });
      setTitle(plan.title);
      setTheses(plan.theses);
      // The word counts always add up to the length that was asked for.
      setOutlines(plan.theses.map((t) => scaleOutline(t.outline, length)));
      setPicked(0);
      setStep(0);
      setEditing(false);
      setLengthOpen(false);
      if (plan.usage) setUsage(plan.usage);
      trackEvent('tool_next_step', { tool: 'essay_plan', from: source, kind, length, has_brief: !!brief.trim() });
      window.setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    } catch (e) {
      const err = e instanceof WritingError ? e : new WritingError('Could not build the outline. Try again.');
      setError({ message: err.message, upgrade: err.upgrade });
      if (/outlines? this (month|period)/.test(err.message)) trackEvent('outline_limit_hit', { where: 'build', paid: !err.upgrade });
      // A limit error means the allowance changed since this screen opened; read it again.
      fetchWritingUsage().then(setUsage).catch(() => { /* keep what is shown */ });
    } finally {
      setLoading(false);
    }
  };

  /** Skip the outline: open an empty draft. Needs no outline, so it works at the limit. */
  const startBlank = async (where: 'link' | 'out_of_outlines' | 'limit_error') => {
    if (blanking || opening || loading) return;
    setBlanking(true);
    setError(null);
    trackEvent('blank_draft_started', { where, left: usage?.plansLeft ?? -1, paid: !!usage?.paid });
    const ok = await onBlankDraft(question.trim());
    if (ok) {
      try { sessionStorage.removeItem(QUESTION_DRAFT_KEY); } catch { /* noop */ }
    } else {
      setBlanking(false);
      setError({ message: 'Could not open the draft. Try again.', upgrade: false });
    }
  };

  // A question typed on the dashboard arrives ready: go straight to the short questions.
  // Answers already given in the landing pop-up: fill them in and build at once.
  const handedOver = useRef(false);
  const [autoBuild, setAutoBuild] = useState(false);
  useEffect(() => {
    if (handedOver.current || peekEssayAutobuild() == null) return;
    handedOver.current = true;
    clearEssayAutobuild();
    if (question.trim().length < 12) return;
    const a = takeEssayAnswers();
    if (!a) { setStep(1); return; }
    const k = KINDS.find((x) => x === a.kind);
    if (k) { setKind(k); setKindPicked(true); }
    if (isCiteStyle(a.cite)) {
      setCite(a.cite);
      setCitePicked(true);
      try { localStorage.setItem(CITE_STYLE_KEY, a.cite); } catch { /* ignore */ }
    }
    if (a.length >= MIN_WORDS && a.length <= MAX_WORDS) { setLength(a.length); setLengthPicked(true); }
    if (a.brief.trim()) setBrief(a.brief);
    setStep(STEP_COUNT);
    setAutoBuild(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!autoBuild || !ready) return;
    setAutoBuild(false);
    trackEvent('tool_next_step', { tool: 'essay_plan', from: 'landing_flow' });
    void build('first');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoBuild, ready]);

  /** A new length rescales every outline's word counts in proportion; nothing is rebuilt. */
  const changeLength = (n: number) => {
    setLength(n);
    if (!(n >= MIN_WORDS && n <= MAX_WORDS)) return;
    setOutlines((all) => all.map((list) => scaleOutline(list, n)));
  };

  const loadBriefFile = async (file: File) => {
    if (briefReading) return;
    setBriefReading(true);
    setBriefNote(null);
    try {
      const { text, cut } = await readRubricFile(file);
      setBrief(text);
      setBriefFile(file.name);
      setBriefNote(cut
        ? { text: `That file is long, so only the first ${BRIEF_MAX_CHARS.toLocaleString('en-US')} characters are used. Delete anything that is not marking criteria.`, warn: true }
        : null);
      trackEvent('tool_next_step', { tool: 'essay_plan', from: 'rubric_upload', kind: file.name.split('.').pop()?.toLowerCase() });
    } catch (e) {
      setBriefNote({ text: e instanceof WritingError ? e.message : 'We could not read that file. Paste the text instead.', warn: true });
    } finally {
      setBriefReading(false);
    }
  };

  const customN = Number(customLen);
  const customOk = customLen !== '' && customN >= MIN_WORDS && customN <= MAX_WORDS;
  const applyCustomLength = () => {
    if (!customOk) return;
    setLength(customN);
    setLengthPicked(true);
    setStep(4);
  };
  const head = STEP_HEAD[step] ?? STEP_HEAD[0];
  /** Once an outline exists the banner folds into one line, so the thesis and outline are what is in view. */
  const collapsed = !!theses && !editing;
  const summary = [kind, cite ?? 'Citation style later', `${length.toLocaleString('en-US')} words`, ...(brief.trim() ? ['Rubric added'] : [])];

  const editSections = (fn: (list: OutlineSection[]) => OutlineSection[]) =>
    setOutlines((all) => all.map((list, i) => (i === outlineIndex ? fn(list) : list)));
  const move = (i: number, by: number) => editSections((list) => {
    const j = i + by;
    if (j < 0 || j >= list.length) return list;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  });

  const start = async () => {
    if (!canStart || opening) return;
    setOpening(true);
    setError(null);
    // The Cite button and the grader both read this, so it is only asked here.
    if (cite) { try { localStorage.setItem(CITE_STYLE_KEY, cite); } catch { /* noop */ } }
    const ok = await onStart({
      title: title || 'Untitled essay',
      question: question.trim(),
      brief: brief.trim() || undefined,
      thesis: thesisText,
      sections: sections.map((s) => ({ ...s, heading: s.heading.trim() })),
      wordTarget: totalWords,
    });
    if (ok) {
      try { sessionStorage.removeItem(QUESTION_DRAFT_KEY); } catch { /* noop */ }
    } else {
      setOpening(false);
      setError({ message: 'Could not open the draft. Try again.', upgrade: false });
    }
  };

  return (
    <div className="flex flex-col gap-6" style={FONT}>
      {/* ── Ask: the purple banner. One thing is asked at a time, and the heading is that question. ── */}
      {collapsed ? (
        <section aria-label="Your essay" className="ws-rise flex flex-wrap items-center gap-4 rounded-[26px] bg-gradient-to-b from-[#A863EA] via-[#8E48CF] to-[#6A2AA6] px-5 py-4 text-white shadow-[0_30px_60px_-34px_rgba(90,45,140,0.8)] sm:px-6">
          <img src="/mascot-pointing.webp" alt="" width={64} height={64} className="h-14 w-14 shrink-0 object-contain sm:h-16 sm:w-16" />
          <div className="min-w-0 flex-1 basis-[280px]">
            <p className="m-0 text-[12px] font-black uppercase tracking-[0.12em] text-[#EBDDFB]">Your essay question</p>
            <p className="m-0 mt-0.5 line-clamp-2 text-[18px] font-black leading-snug">{question.trim()}</p>
            <ul className="m-0 mt-2 flex list-none flex-wrap gap-1.5 p-0">
              {summary.map((t) => (
                <li key={t} className="rounded-full bg-[#5A1F8F] px-3 py-1 text-[13px] font-extrabold">{t}</li>
              ))}
            </ul>
          </div>
          <button type="button" onClick={() => { setEditing(true); setStep(0); }} className={`${BTN_WHITE} min-h-[48px] rounded-[14px] px-5 text-[15px]`}>Change my answers</button>
        </section>
      ) : (
      <section
        aria-label="Start an essay"
        className="relative overflow-hidden rounded-[30px] bg-gradient-to-b from-[#A863EA] via-[#8E48CF] to-[#6A2AA6] px-5 pb-6 pt-5 text-white shadow-[0_30px_60px_-34px_rgba(90,45,140,0.8)] sm:px-[30px] sm:pb-[30px] sm:pt-[26px]"
      >
        <span aria-hidden className="pointer-events-none absolute left-1/2 top-[130px] h-[900px] w-[900px] -translate-x-1/2 rounded-full bg-[#8A45C8]" />
        <div className="relative flex flex-col gap-[18px]">
          <div className="flex items-center gap-4">
            <img src={STEP_MASCOT[step] ?? STEP_MASCOT[0]} alt="Scholar, the WriteScholar mascot" width={104} height={104} className="h-[76px] w-[76px] shrink-0 object-contain sm:h-[104px] sm:w-[104px]" />
            <div key={step} className="ws-rise min-w-0">
              <h1 className="m-0 text-[28px] font-black leading-[1.05] tracking-[-0.02em] sm:text-[38px]">
                {head.pre}<span className="text-[#FFD84D]">{head.hi}</span>{head.post}
              </h1>
              <p className="m-0 mt-1.5 text-[15px] font-bold text-[#F3EAFF] sm:text-[16.5px]">{head.sub}</p>
            </div>
          </div>

          <form
            className="flex flex-col gap-4 rounded-[26px] border-b-[6px] border-[#D9C2F2] bg-white p-4 text-stone-900 shadow-[0_30px_50px_-22px_rgba(42,21,64,0.55)] dark:bg-stone-900 dark:text-stone-50 sm:p-5"
            onSubmit={(e) => { e.preventDefault(); if (step === 0) { if (ready) setStep(1); } else if (step === STEP_COUNT) void build('first'); }}
          >
            {step === 0 ? (
              <>
              <div className="flex flex-col gap-2">
                <label htmlFor="essay-question" className="text-[12.5px] font-black uppercase tracking-[0.12em] text-[#7733B5] dark:text-[#C9A0F0]">Your essay question</label>
                <textarea
                  id="essay-question"
                  value={question}
                  onChange={(e) => {
                    setQuestion(e.target.value);
                    try { sessionStorage.setItem(QUESTION_DRAFT_KEY, e.target.value); } catch { /* noop */ }
                  }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); if (ready) setStep(1); } }}
                  rows={3}
                  maxLength={2000}
                  placeholder="For example: How does Shakespeare present ambition in Macbeth?"
                  className="w-full resize-y rounded-[18px] border-2 border-[#DCC3F6] bg-[#FBF8FF] px-[18px] py-3.5 text-[17px] font-extrabold leading-[1.4] text-stone-900 placeholder:font-bold placeholder:text-stone-400 focus:border-[#A560E8] focus:outline-none focus:ring-4 focus:ring-[#A560E8]/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-50"
                />
                {question.trim().length === 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[13.5px] font-extrabold text-stone-500 dark:text-stone-400">Or try one:</span>
                    {EXAMPLES.map((ex) => (
                      <button key={ex} type="button" onClick={() => setQuestion(ex)} className="min-h-[36px] rounded-full bg-[#F7F1FF] px-3 text-left text-[13px] font-extrabold text-[#7733B5] hover:bg-[#EADCFB] dark:bg-stone-800 dark:text-[#C9A0F0]">{ex}</button>
                    ))}
                  </div>
                )}
              </div>

                {outOfOutlines && usage && (
                  <div role="status" className="flex flex-col gap-3 rounded-[18px] border-2 border-[#F3D9A8] bg-[#FFF4E5] p-4 text-[15px] font-extrabold leading-snug text-[#7C2D12]">
                    <p className="m-0">
                      {usage.paid
                        ? `You have built all ${usage.plansLimit} outlines for this period. ${resetDay(usage.resetsAt) ? `More arrive on ${resetDay(usage.resetsAt)}.` : 'More arrive when your plan renews.'}`
                        : `You have used your ${usage.plansLimit} free outlines this month. ${resetDay(usage.resetsAt) ? `They come back on ${resetDay(usage.resetsAt)}. ` : ''}Pro gives you far more.`}
                      {' '}You can still write: start with a blank draft.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <button type="button" onClick={() => void startBlank('out_of_outlines')} disabled={blanking} className={`${BTN_GREEN} min-h-[52px] rounded-[16px] px-6 text-[16.5px]`}>
                        {blanking ? <>{spin} Opening your draft…</> : 'Start with a blank draft'}
                      </button>
                      {!usage.paid && (
                        <button type="button" onClick={() => onUpgrade('essay_plan_limit')} className={`${BTN_WHITE} min-h-[52px] rounded-[16px] px-5 text-[16px]`}>See Pro</button>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                  <button type="submit" disabled={!ready || loading || outOfOutlines} className={`${BTN_GREEN} min-h-[60px] w-full whitespace-nowrap rounded-[18px] px-[26px] text-[18px] sm:w-auto`}>
                    {theses ? 'Continue' : 'Start my essay'}
                    {arrow}
                  </button>
                  {theses ? (
                    <button type="button" onClick={() => { setEditing(false); setStep(0); }} className="min-h-[44px] text-[14.5px] font-black text-[#7733B5] underline hover:text-[#5F2594] dark:text-[#C9A0F0]">
                      Keep the outline I have
                    </button>
                  ) : (
                    <>
                      {!outOfOutlines && (
                        <button type="button" onClick={() => void startBlank('link')} disabled={blanking} className="min-h-[44px] text-[14.5px] font-black text-[#7733B5] underline hover:text-[#5F2594] disabled:opacity-60 dark:text-[#C9A0F0]">
                          {blanking ? 'Opening your draft…' : 'Skip the outline: start with a blank draft'}
                        </button>
                      )}
                      <button type="button" onClick={onGradeInstead} className="min-h-[44px] text-[14.5px] font-black text-[#7733B5] underline hover:text-[#5F2594] dark:text-[#C9A0F0]">
                        I already have a draft: grade it instead
                      </button>
                    </>
                  )}
                  {usage && (
                    <span className="text-[13.5px] font-extrabold text-stone-500 dark:text-stone-400 sm:ml-auto">
                      {usage.plansLeft} of {usage.plansLimit} outlines left {usage.paid ? 'this period' : 'this month'}
                    </span>
                  )}
                </div>
              </>
            ) : (
              <div key={step} className="ws-rise flex flex-col gap-4">
                {/* Where they are: back, four dots, and the question they typed. */}
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setStep(step - 1)} aria-label="Back" className={iconBtn}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
                  </button>
                  <div role="img" aria-label={`Question ${step} of ${STEP_COUNT}`} className="flex items-center gap-1.5">
                    {Array.from({ length: STEP_COUNT }, (_, i) => (
                      <span key={i} className={`h-2.5 rounded-full transition-all duration-300 ${i + 1 < step ? 'w-2.5 bg-[#58CC02]' : i + 1 === step ? 'w-7 bg-[#A560E8]' : 'w-2.5 bg-[#E4D4F8] dark:bg-stone-700'}`} />
                    ))}
                  </div>
                  <p className="m-0 min-w-0 flex-1 truncate text-[14px] font-extrabold text-stone-500 dark:text-stone-400">{question.trim()}</p>
                </div>

                {step === 1 && (
                  <fieldset className="m-0 min-w-0 border-0 p-0">
                    <legend className="sr-only">What kind of essay is it?</legend>
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {KINDS.map((k) => {
                        const on = kindPicked && kind === k;
                        return (
                          <button key={k} type="button" aria-pressed={on} onClick={() => { setKind(k); setKindPicked(true); setStep(2); }} className={`${opt(on)} ${k === 'Not sure' ? 'sm:col-span-2' : ''}`}>
                            <span className="block text-[17px] font-black">{k}</span>
                            <span className="block text-[13.5px] font-bold opacity-80">{KIND_HINT[k]}</span>
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                )}

                {step === 2 && (
                  <fieldset className="m-0 min-w-0 border-0 p-0">
                    <legend className="sr-only">Which citation style does your course use?</legend>
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {CITE_STYLES.map((c) => {
                        const on = citePicked && cite === c;
                        return (
                          <button key={c} type="button" aria-pressed={on} onClick={() => { setCite(c); setCitePicked(true); setStep(3); }} className={`${opt(on)} flex items-center justify-between gap-3`}>
                            <span className="min-w-0">
                              <span className="block text-[17px] font-black">{c}</span>
                              <span className="block text-[13.5px] font-bold opacity-80">{CITE_INFO[c].where}</span>
                            </span>
                            <span className={`shrink-0 rounded-lg px-2.5 py-1 text-[13.5px] font-extrabold ${on ? 'bg-white/20 text-white' : 'bg-white text-[#5B2491] ring-1 ring-[#E4D4F8] dark:bg-stone-900 dark:text-[#C9A0F0] dark:ring-stone-700'}`}>{CITE_INFO[c].example}</span>
                          </button>
                        );
                      })}
                      <button type="button" aria-pressed={false} onClick={() => { setCite(null); setCitePicked(false); setStep(3); }} className={`${opt(false)} sm:col-span-2`}>
                        <span className="block text-[17px] font-black">Not sure yet</span>
                        <span className="block text-[13.5px] font-bold opacity-80">Skip this. You will be asked when you add your first source.</span>
                      </button>
                    </div>
                  </fieldset>
                )}

                {step === 3 && (
                  <fieldset className="m-0 flex min-w-0 flex-col gap-3.5 border-0 p-0">
                    <legend className="sr-only">How many words does it need to be?</legend>
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                      {LENGTHS.map((n) => {
                        const on = lengthPicked && length === n;
                        return (
                          <button key={n} type="button" aria-pressed={on} onClick={() => { setLength(n); setLengthPicked(true); setCustomLen(''); setStep(4); }} className={`${opt(on)} text-center`}>
                            <span className="block text-[20px] font-black tabular-nums">{n.toLocaleString('en-US')}</span>
                            <span className="block text-[13.5px] font-bold opacity-80">words</span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <label htmlFor="essay-length-step" className="text-[15px] font-black text-stone-700 dark:text-stone-200">Another length</label>
                      <input
                        id="essay-length-step"
                        type="text"
                        inputMode="numeric"
                        value={customLen}
                        placeholder="2500"
                        onChange={(e) => setCustomLen(e.target.value.replace(/[^0-9]/g, '').slice(0, 5))}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyCustomLength(); } }}
                        className={`min-h-[48px] w-[110px] rounded-[14px] border-2 bg-[#FBF8FF] px-3 text-[16px] font-extrabold tabular-nums text-stone-900 placeholder:font-bold placeholder:text-stone-400 focus:border-[#A560E8] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#A560E8]/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-50 ${customLen && !customOk ? 'border-[#DC2626]' : 'border-[#DCC3F6]'}`}
                      />
                      <span className={`text-[14px] font-extrabold ${customLen && !customOk ? 'text-[#B91C1C]' : 'text-stone-600 dark:text-stone-300'}`}>
                        {customLen && !customOk ? `between ${MIN_WORDS} and ${MAX_WORDS.toLocaleString('en-US')} words` : 'words'}
                      </span>
                      <button type="button" disabled={!customOk} onClick={applyCustomLength} className={`${BTN_WHITE} min-h-[48px] rounded-[14px] px-5 text-[15px] disabled:opacity-50`}>Continue</button>
                    </div>
                  </fieldset>
                )}

                {step === 4 && (
                  <div className="flex flex-col gap-3.5">
                    <label htmlFor="essay-brief" className="sr-only">Your rubric or brief</label>
                    <div
                      onDragOver={(e) => { e.preventDefault(); if (!briefDrag) setBriefDrag(true); }}
                      onDragLeave={() => setBriefDrag(false)}
                      onDrop={(e) => { e.preventDefault(); setBriefDrag(false); const f = e.dataTransfer.files?.[0]; if (f) void loadBriefFile(f); }}
                      className={`flex flex-col gap-2.5 rounded-[18px] transition-colors ${briefDrag ? 'bg-[#F3EAFF] ring-4 ring-[#A560E8]/30 dark:bg-[#A560E8]/15' : ''}`}
                    >
                <textarea
                    id="essay-brief"
                    value={brief}
                    onChange={(e) => { setBrief(e.target.value); if (!e.target.value.trim()) { setBriefFile(null); setBriefNote(null); } }}
                    rows={5}
                    maxLength={BRIEF_MAX_CHARS}
                    placeholder="Paste the marking criteria or the assignment instructions, or upload the file below."
                    className="w-full resize-y rounded-[14px] border-2 border-[#DCC3F6] bg-white px-3.5 py-2.5 text-[15px] font-bold leading-[1.45] text-stone-900 placeholder:text-stone-400 focus:border-[#A560E8] focus:outline-none focus:ring-4 focus:ring-[#A560E8]/20 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-50"
                  />
                      <input
                        ref={briefFileRef}
                        type="file"
                        accept={RUBRIC_ACCEPT}
                        className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) void loadBriefFile(f); e.currentTarget.value = ''; }}
                      />
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                        <button type="button" disabled={briefReading} onClick={() => briefFileRef.current?.click()} className={`${BTN_WHITE} min-h-[48px] rounded-[14px] px-4 text-[15px]`}>
                          {briefReading ? (
                            <>{spin} Reading the file…</>
                          ) : (
                            <>
                              <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={2.6} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4M7 9l5-5 5 5M4 20h16" /></svg>
                              Upload a PDF or Word file
                            </>
                          )}
                        </button>
                        {briefFile && !briefReading ? (
                          <span className="inline-flex min-h-[40px] items-center gap-2 rounded-full bg-[#E6F9D2] px-3.5 text-[13.5px] font-extrabold text-[#14532D]">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12l5 5L20 7" /></svg>
                            <span className="max-w-[260px] truncate">{briefFile}</span>
                            <button type="button" onClick={() => { setBrief(''); setBriefFile(null); setBriefNote(null); }} aria-label={`Remove ${briefFile}`} className="-mr-1 flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#C8F0A8]">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" aria-hidden><path d="M6 6l12 12M18 6L6 18" /></svg>
                            </button>
                          </span>
                        ) : (
                          <span className="text-[13.5px] font-bold text-stone-500 dark:text-stone-400">PDF, Word or text. You can also drop the file here.</span>
                        )}
                      </div>
                      {briefNote && (
                        <p role={briefNote.warn ? 'alert' : undefined} className={`m-0 rounded-[14px] px-3.5 py-2.5 text-[13.5px] font-extrabold leading-snug ${briefNote.warn ? 'border border-[#F3D9A8] bg-[#FFF4E5] text-[#9A3412]' : 'bg-[#F3EAFF] text-[#5B2491]'}`}>{briefNote.text}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                      <button type="submit" disabled={!ready || loading || briefReading} className={`${BTN_GREEN} min-h-[60px] w-full whitespace-nowrap rounded-[18px] px-[26px] text-[18px] sm:w-auto`}>
                        {loading ? <>{spin} Building your outline…</> : 'Build my outline'}
                        {!loading && arrow}
                      </button>
                      {/* Their answers so far; each one goes back to its question. */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {([[kind, 1], [cite ?? 'Style later', 2], [`${length.toLocaleString('en-US')} words`, 3]] as [string, number][]).map(([label, to]) => (
                          <button key={to} type="button" onClick={() => setStep(to)} aria-label={`${label}: change`} className="min-h-[40px] rounded-full bg-[#F7F1FF] px-3.5 text-[13.5px] font-extrabold text-[#7733B5] hover:bg-[#EADCFB] dark:bg-stone-800 dark:text-[#C9A0F0]">{label}</button>
                        ))}
                      </div>
                      {usage && (
                        <span className="text-[13.5px] font-extrabold text-stone-500 dark:text-stone-400 sm:ml-auto">
                          {usage.plansLeft} of {usage.plansLimit} outlines left {usage.paid ? 'this period' : 'this month'}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </form>
        </div>
      </section>
      )}

      {error && (
        <div role="alert" className="flex flex-wrap items-center gap-3 rounded-[20px] border-2 border-[#F87171] bg-[#FEE2E2] px-5 py-4 text-[15px] font-extrabold text-[#991B1B]">
          <span className="min-w-0 flex-1">{error.message}</span>
          {usage && usage.plansLeft <= 0 && !theses && (
            <button type="button" onClick={() => void startBlank('limit_error')} disabled={blanking} className={`${BTN_GREEN} min-h-[46px] rounded-[14px] px-5 text-[15px]`}>Start with a blank draft</button>
          )}
          {error.upgrade && (
            <button type="button" onClick={() => onUpgrade('essay_plan_limit')} className={`${BTN_WHITE} min-h-[46px] rounded-[14px] px-5 text-[15px]`}>See Pro</button>
          )}
        </div>
      )}

      {/* ── Building: placeholders in the shape of what is coming ── */}
      {loading && !theses && <Building />}

      {/* ── Before a plan: what happens next ── */}
      {!theses && !loading && step === 0 && (
        <ol className="m-0 grid list-none gap-4 p-0 sm:grid-cols-3">
          {[
            { i: 'new-essay', t: 'Pick a thesis', b: 'Three arguments you could make. Choose one or write your own.' },
            { i: 'outline', t: 'Write into the outline', b: 'Each paragraph comes with a note on what it should argue. The words are yours.' },
            { i: 'grade-essay', t: 'Grade it when you finish', b: 'One click sends the draft to the essay grader.' },
          ].map((s, n) => (
            <li key={s.t} className="flex flex-col gap-2 rounded-[24px] border border-[#E4D4F8] bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
              <span className="flex items-center justify-between gap-3">
                <span className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-[#F3EAFF] text-[16px] font-black text-[#7733B5] dark:bg-[#A560E8]/20 dark:text-[#C9A0F0]">{n + 1}</span>
                <img src={`/icons/${s.i}.webp`} alt="" width={54} height={54} loading="lazy" className="h-[54px] w-[54px] object-contain" />
              </span>
              <h2 className="m-0 text-[20px] font-black text-stone-900 dark:text-stone-50">{s.t}</h2>
              <p className="m-0 text-[15px] font-bold leading-[1.45] text-stone-600 dark:text-stone-300">{s.b}</p>
            </li>
          ))}
        </ol>
      )}

      {/* ── Choose: thesis on the left, its outline on the right ── */}
      {theses && (
        <div ref={resultRef} className={`grid scroll-mt-6 items-start gap-5 transition-opacity duration-300 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] ${loading ? 'opacity-60' : ''}`}>
          <section aria-labelledby="essay-thesis" className="flex min-w-0 flex-col gap-3">
            <h2 id="essay-thesis" className="m-0 text-[24px] font-black tracking-[-0.01em] text-stone-900 dark:text-stone-50">1. Pick the argument you want to make</h2>
            <div role="radiogroup" aria-labelledby="essay-thesis" className="flex flex-col gap-3">
              {theses.map((t, i) => {
                const on = picked === i;
                return (
                  <button
                    key={t.thesis}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setPicked(i)}
                    style={{ animationDelay: `${i * 80}ms` }}
                    className={`ws-rise flex items-start gap-3.5 rounded-[22px] border-2 p-[18px] text-left transition-all duration-200 ${
                      on
                        ? 'border-[#A560E8] bg-[#F7F1FF] shadow-[0_18px_34px_-22px_rgba(90,45,140,0.6)] dark:bg-[#A560E8]/15'
                        : 'border-[#E4D4F8] bg-white hover:border-[#C9A0F0] dark:border-stone-700 dark:bg-stone-900'
                    }`}
                  >
                    <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${on ? 'bg-[#A560E8] text-white' : 'border-2 border-[#C9A0F0] bg-white dark:bg-stone-900'}`}>{on && <span className="ws-tick">{tick}</span>}</span>
                    <span className="min-w-0">
                      <span className={`block text-[16.5px] leading-[1.4] text-stone-900 dark:text-stone-50 ${on ? 'font-black' : 'font-extrabold'}`}>{t.thesis}</span>
                      {t.why && <span className="mt-1.5 block text-[14px] font-bold leading-[1.4] text-[#7733B5] dark:text-[#C9A0F0]">{t.why}</span>}
                    </span>
                  </button>
                );
              })}
              <div style={{ animationDelay: `${theses.length * 80}ms` }} className={`ws-rise rounded-[22px] border-2 p-[18px] transition-colors duration-200 ${picked === OWN ? 'border-[#A560E8] bg-[#F7F1FF] dark:bg-[#A560E8]/15' : 'border-dashed border-[#C9A0F0] bg-white dark:bg-stone-900'}`}>
                <label htmlFor="own-thesis" className="block text-[15px] font-black text-stone-900 dark:text-stone-50">Or write your own thesis</label>
                <textarea
                  id="own-thesis"
                  value={ownThesis}
                  onChange={(e) => { setOwnThesis(e.target.value); setPicked(OWN); }}
                  onFocus={() => setPicked(OWN)}
                  rows={2}
                  maxLength={400}
                  placeholder="One sentence that takes a side."
                  className="mt-2 w-full resize-y rounded-[14px] border-2 border-[#DCC3F6] bg-white px-3.5 py-2.5 text-[15.5px] font-bold text-stone-900 placeholder:text-stone-400 focus:border-[#A560E8] focus:outline-none focus:ring-4 focus:ring-[#A560E8]/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-50"
                />
                {picked === OWN && <p className="m-0 mt-2 text-[13.5px] font-bold text-stone-600 dark:text-stone-300">The outline on the right is the first one. Change its headings to fit your argument.</p>}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <button type="button" disabled={loading || (!!usage && usage.plansLeft <= 0)} onClick={() => void build('more')} className={`${BTN_WHITE} min-h-[46px] rounded-[14px] px-4 text-[15px]`}>
                {loading ? <>{spin} Thinking…</> : 'Show three different ones'}
              </button>
              {usage && (
                <span className="text-[13.5px] font-extrabold text-stone-500 dark:text-stone-400">
                  {usage.plansLeft <= 0
                    ? `No outlines left ${usage.paid ? 'this period' : 'this month'}. Pick one of these and start writing.`
                    : `Uses 1 outline. ${usage.plansLeft} left ${usage.paid ? 'this period' : 'this month'}.`}
                </span>
              )}
            </div>
          </section>

          <section aria-labelledby="essay-outline" style={{ animationDelay: '120ms' }} className="ws-rise flex min-w-0 flex-col gap-3.5 rounded-[26px] border border-[#E4D4F8] bg-white p-5 shadow-[0_22px_50px_-34px_rgba(90,45,140,0.55)] dark:border-stone-700 dark:bg-stone-900">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h2 id="essay-outline" className="m-0 text-[24px] font-black tracking-[-0.01em] text-stone-900 dark:text-stone-50">2. Your outline</h2>
              <span className="flex items-baseline gap-2 text-[14px] font-extrabold text-stone-500 dark:text-stone-400">
                About {totalWords.toLocaleString('en-US')} words
                <button type="button" onClick={() => setLengthOpen((v) => !v)} aria-expanded={lengthOpen} className="min-h-[44px] font-black text-[#7733B5] underline dark:text-[#C9A0F0]">{lengthOpen ? 'Done' : 'Change'}</button>
              </span>
            </div>
            <p className="m-0 text-[14.5px] font-bold text-stone-600 dark:text-stone-300">Rename, reorder or remove anything. These become the headings in your draft.</p>

            {/* Rescales the word counts in place; nothing is rebuilt and no outline is used. */}
            {lengthOpen && (
            <fieldset className="ws-rise m-0 flex min-w-0 flex-col gap-2 rounded-[16px] bg-[#FBF8FF] p-3 dark:bg-stone-800 border-0">
              <legend className="mb-2 p-0 text-[14px] font-black text-stone-700 dark:text-stone-200">New length. The word counts below adjust at once.</legend>
              <div className="flex flex-wrap items-center gap-2">
                {LENGTHS.map((n) => (
                  <button key={n} type="button" aria-pressed={length === n} onClick={() => changeLength(n)} className={chip(length === n)}>{n.toLocaleString('en-US')}</button>
                ))}
                <label htmlFor="essay-length" className="ml-1 text-[14px] font-extrabold text-stone-600 dark:text-stone-300">or</label>
                <input
                  id="essay-length"
                  type="number"
                  inputMode="numeric"
                  min={MIN_WORDS}
                  max={MAX_WORDS}
                  step={50}
                  value={Number.isFinite(length) && length > 0 ? length : ''}
                  onChange={(e) => changeLength(Math.round(Number(e.target.value)) || 0)}
                  aria-describedby="essay-length-hint"
                  className={`min-h-[44px] w-[104px] rounded-[14px] border-2 bg-[#FBF8FF] px-3 text-[15px] font-extrabold tabular-nums text-stone-900 focus:border-[#A560E8] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#A560E8]/20 dark:bg-stone-800 dark:text-stone-50 ${lengthOk ? 'border-[#DCC3F6] dark:border-stone-700' : 'border-[#F87171]'}`}
                />
                <span id="essay-length-hint" className={`text-[14px] font-extrabold ${lengthOk ? 'text-stone-600 dark:text-stone-300' : 'text-[#B91C1C]'}`}>
                  {lengthOk ? 'words' : `words (between ${MIN_WORDS} and ${MAX_WORDS.toLocaleString('en-US')})`}
                </span>
              </div>
            </fieldset>
            )}

            {/* Keyed by thesis, so choosing another argument brings its outline in afresh. */}
            <ol key={`${title}-${outlineIndex}`} className="m-0 flex list-none flex-col gap-2.5 p-0">
              {sections.map((s, i) => (
                <li key={i} style={{ animationDelay: `${160 + i * 55}ms` }} className="ws-rise flex items-start gap-2.5 rounded-[18px] border border-[#EFE5FA] bg-[#FBF8FF] p-3 dark:border-stone-700 dark:bg-stone-800">
                  <span className="mt-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F3EAFF] text-[14px] font-black text-[#7733B5] dark:bg-[#A560E8]/20 dark:text-[#C9A0F0]">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <input
                      type="text"
                      value={s.heading}
                      aria-label={`Heading for part ${i + 1}`}
                      maxLength={80}
                      onChange={(e) => editSections((list) => list.map((x, n) => (n === i ? { ...x, heading: e.target.value } : x)))}
                      className="w-full rounded-lg border-2 border-transparent bg-transparent px-1.5 py-1 text-[16px] font-black text-stone-900 hover:border-[#E4D4F8] focus:border-[#A560E8] focus:bg-white focus:outline-none dark:text-stone-50 dark:focus:bg-stone-900"
                    />
                    <p className="m-0 px-1.5 text-[14px] font-bold leading-[1.4] text-stone-600 dark:text-stone-300">{s.goal}</p>
                    <p className="m-0 mt-1 px-1.5 text-[12.5px] font-extrabold text-stone-500 dark:text-stone-400">About {s.words} words</p>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <button type="button" aria-label={`Move ${s.heading || 'part'} up`} disabled={i === 0} onClick={() => move(i, -1)} className={iconBtn}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 19V5M6 11l6-6 6 6" /></svg>
                    </button>
                    <button type="button" aria-label={`Move ${s.heading || 'part'} down`} disabled={i === sections.length - 1} onClick={() => move(i, 1)} className={iconBtn}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 5v14M6 13l6 6 6-6" /></svg>
                    </button>
                    <button type="button" aria-label={`Remove ${s.heading || 'part'}`} disabled={sections.length <= 2} onClick={() => editSections((list) => list.filter((_, n) => n !== i))} className={iconBtn}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M6 6l12 12M18 6L6 18" /></svg>
                    </button>
                  </div>
                </li>
              ))}
            </ol>

            <button
              type="button"
              disabled={sections.length >= 9}
              onClick={() => editSections((list) => {
                const at = Math.max(1, list.length - 1);
                return [...list.slice(0, at), { heading: 'New paragraph', goal: 'Say what this paragraph argues and what evidence it uses.', words: 250 }, ...list.slice(at)];
              })}
              className={`${BTN_WHITE} min-h-[46px] self-start rounded-[14px] px-4 text-[15px]`}
            >
              Add a paragraph
            </button>

          </section>

          {/* Stays at the bottom of the screen while the thesis and outline are in view. */}
          <div className="sticky bottom-3 z-20 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[22px] border border-[#E4D4F8] bg-white px-4 py-3 shadow-[0_18px_40px_-16px_rgba(42,21,64,0.5)] dark:border-stone-700 dark:bg-stone-900 lg:col-span-2">
            <img src="/icons/write.webp" alt="" width={44} height={44} className="hidden h-11 w-11 shrink-0 object-contain sm:block" />
            <div className="min-w-0 flex-1 basis-[240px]">
              <p className="m-0 truncate text-[15.5px] font-black text-stone-900 dark:text-stone-50">
                {picked === OWN && thesisText.length < 10 ? 'Write your thesis first.' : thesisText}
              </p>
              <p className="m-0 text-[13.5px] font-extrabold text-stone-500 dark:text-stone-400">
                {sections.length} paragraphs · about {totalWords.toLocaleString('en-US')} words · you write the essay
              </p>
            </div>
            <button type="button" disabled={!canStart || opening} onClick={() => void start()} className={`${BTN_GREEN} min-h-[56px] w-full whitespace-nowrap rounded-[18px] px-[26px] text-[18px] sm:w-auto`}>
              {opening ? <>{spin} Opening your draft…</> : 'Start writing'}
              {!opening && arrow}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
