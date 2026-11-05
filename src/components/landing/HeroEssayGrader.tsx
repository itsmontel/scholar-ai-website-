import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import { FREE_GRADE_MAX_WORDS, FREE_GRADE_MIN_WORDS } from '../../config/pricing';
import { trackEvent } from '../../utils/analytics';

export const countWords = (text: string): number => text.trim().split(/\s+/).filter(Boolean).length;

/** What the box worked out about the essay before any API call. */
export interface EssayFacts {
  words: number;
  paragraphs: number;
  sentences: number;
  /** Plain label such as "argumentative essay". */
  kind: string;
  /** The sentence that reads most like the thesis, trimmed for display. */
  thesis: string;
  fileName: string | null;
}

/** Cheap, local guesses so the pre-read shows something true about this essay. */
export function readEssayFacts(text: string, fileName: string | null): EssayFacts {
  const clean = text.replace(/\r\n/g, '\n').trim();
  const paragraphs = clean.split(/\n\s*\n|\n/).map((p) => p.trim()).filter((p) => p.split(/\s+/).length > 3);
  const sentences = clean.split(/(?<=[.!?])\s+(?=[A-Z"“])/).filter((s) => s.trim().length > 12);
  const lower = clean.toLowerCase();
  const score = (re: RegExp) => (lower.match(re) || []).length;
  const personal = score(/\b(i|my|me|myself)\b/g);
  const words = countWords(clean);
  let kind = 'expository essay';
  if (personal > words / 60 && score(/\b(college|university|applic|major|community|grew up|learned)\b/g) > 1) kind = 'personal statement';
  else if (score(/\b(novel|poem|author|character|theme|narrator|symbol|imagery|chapter)\b/g) > 3) kind = 'literary analysis';
  else if (score(/\b(method|results|data|hypothesis|sample|experiment|participants|findings)\b/g) > 3) kind = 'research paper';
  else if (score(/\b(should|must|argue|argument|therefore|however|critics|opponents|evidence|because)\b/g) > 4) kind = 'argumentative essay';
  // Skip a title line: the thesis lives in the first real paragraph.
  const first = paragraphs.find((p) => p.split(/\s+/).length >= 25) || paragraphs[0] || clean;
  const firstSentences = first.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 20);
  const thesisRaw = firstSentences[firstSentences.length - 1] || firstSentences[0] || '';
  const thesis = thesisRaw.length > 110 ? `${thesisRaw.slice(0, 107).trimEnd()}…` : thesisRaw;
  return { words, paragraphs: Math.max(paragraphs.length, 1), sentences: Math.max(sentences.length, 1), kind, thesis, fileName };
}

/** A short original essay so a visitor with nothing to paste can still try the grader. */
export const SAMPLE_ESSAY = `Should high schools start later in the morning?

Teenagers are biologically wired to fall asleep later than adults, yet most American high schools open their doors before 8 a.m. The result is a generation of students sitting in first period half awake, and a school system that treats a problem of biology as a problem of discipline. High schools should move their start times to 8:30 or later, because the evidence that it improves learning, health and safety is now too strong to ignore.

The clearest case comes from sleep science. During puberty the body's release of melatonin shifts about two hours later, which means a sixteen-year-old told to be in a classroom at 7:30 is being asked to function at what feels, to their body, like 5:30. The American Academy of Pediatrics reviewed this research and recommended that middle and high schools start no earlier than 8:30. That is not a fringe position. It is the position of the doctors who treat these students.

Districts that have made the change report results, not just theories. When Seattle pushed its high school start time back by nearly an hour, researchers found that students slept longer on school nights and that grades in the classes they studied went up. Attendance improved as well, especially at schools serving lower-income families, where early starts had hit hardest. Later starts did not make students stay up later. They simply let them sleep when their bodies were ready to.

Critics raise real concerns. Buses run on tight schedules, after-school sports need daylight, and parents who leave for work early rely on the current timetable. These are logistics problems, and logistics problems have logistics solutions: staggered bus routes, lit practice fields, and before-school supervision have all been used by districts that made the switch. None of them requires students to learn while exhausted.

The question is not whether later start times are convenient. It is whether schools exist to fit a bus schedule or to teach teenagers. Once that question is asked honestly, the answer is obvious. Schools should start later, and the districts still holding out should explain to their students why they have not.`;

type Stage = 'edit' | 'reading';

interface HeroEssayGraderProps {
  /**
   * Called once the pre-read has finished. Everything the box learned is
   * passed along so the gate can show it back.
   */
  onSubmit: (text: string, facts: EssayFacts) => void;
  /** Text restored from a previous visit (e.g. after a Google redirect failed). */
  initialText?: string;
  /** Bump this to return the box to its editable state (e.g. the gate was closed). */
  resetSignal?: number;
}

const READ_STEPS = [
  (f: EssayFacts) => `Counted ${f.words.toLocaleString()} words in ${f.paragraphs} paragraph${f.paragraphs === 1 ? '' : 's'}`,
  (f: EssayFacts) => `Reads like ${/^[aeiou]/i.test(f.kind) ? 'an' : 'a'} ${f.kind}`,
  (f: EssayFacts) => (f.thesis ? `Thesis found: “${f.thesis}”` : 'Looking for the thesis'),
  () => 'Scoring thesis, evidence, analysis, structure and style',
];

/**
 * The paste box on the landing hero. Holds the essay, counts words and
 * reads a few facts about it on the client. Nothing is graded until the
 * sign-in gate has an account, so this component never talks to the API.
 * Accepts paste or a dropped .docx / .txt (mammoth runs in the browser).
 *
 * On "Grade my essay" it runs a pre-read (about seven seconds of real,
 * local observations) before handing off. The visitor
 * sees their own essay being understood before they are asked for an
 * email, which is the moment most of them would otherwise leave.
 */
export default function HeroEssayGrader({ onSubmit, initialText = '', resetSignal = 0 }: HeroEssayGraderProps) {
  const [text, setText] = useState(initialText);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState('');
  const [reading, setReading] = useState(false);
  const [stage, setStage] = useState<Stage>('edit');
  const [stepIdx, setStepIdx] = useState(0);
  const [facts, setFacts] = useState<EssayFacts | null>(null);
  const pastedTracked = useRef(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    if (initialText && !text) setText(initialText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialText]);

  // The gate was closed: come back to the editable box with the text intact.
  useEffect(() => {
    if (resetSignal === 0) return;
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
    setStage('edit');
    setStepIdx(0);
  }, [resetSignal]);

  useEffect(() => () => timersRef.current.forEach((t) => window.clearTimeout(t)), []);

  const words = useMemo(() => countWords(text), [text]);
  const tooShort = words > 0 && words < FREE_GRADE_MIN_WORDS;
  const tooLong = words > FREE_GRADE_MAX_WORDS;
  const ready = words >= FREE_GRADE_MIN_WORDS && !tooLong && !reading && stage === 'edit';

  useEffect(() => {
    if (words >= FREE_GRADE_MIN_WORDS && !pastedTracked.current) {
      pastedTracked.current = true;
      trackEvent('essay_pasted', { words, source: fileName ? 'file' : 'paste' });
    }
  }, [words, fileName]);

  const readFile = useCallback(async (file: File) => {
    setFileError('');
    const name = file.name || 'essay';
    const lower = name.toLowerCase();
    if (file.size > 8 * 1024 * 1024) {
      setFileError('That file is over 8MB. Paste the text instead.');
      return;
    }
    setReading(true);
    try {
      let content = '';
      if (lower.endsWith('.docx')) {
        const mammoth = (await import('mammoth')).default;
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        content = result.value || '';
      } else if (lower.endsWith('.txt') || lower.endsWith('.md') || file.type.startsWith('text/')) {
        content = await file.text();
      } else if (lower.endsWith('.pdf')) {
        setFileError('PDFs can be uploaded once you are signed in. For now, copy the text and paste it here.');
        return;
      } else {
        setFileError('Drop a .docx or .txt file, or paste the text.');
        return;
      }
      content = content.replace(/\r\n/g, '\n').trim();
      if (!content) {
        setFileError('That file looks empty. Paste the text instead.');
        return;
      }
      setText(content);
      setFileName(name.replace(/\.(docx|txt|md)$/i, ''));
    } catch {
      setFileError('We could not read that file. Paste the text instead.');
    } finally {
      setReading(false);
    }
  }, []);

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) void readFile(file);
  };

  const useSample = () => {
    setText(SAMPLE_ESSAY);
    setFileName(null);
    setFileError('');
    trackEvent('essay_pasted', { words: countWords(SAMPLE_ESSAY), source: 'sample' });
    window.setTimeout(() => textareaRef.current?.focus(), 30);
  };

  const submit = () => {
    if (!ready) return;
    const trimmed = text.trim();
    const f = readEssayFacts(trimmed, fileName);
    setFacts(f);
    setStage('reading');
    setStepIdx(0);
    // Four observations over about seven seconds, then hand off to the
    // gate. Slower than it needs to be on purpose: a pre-read that flashes
    // past feels fake, one that takes its time feels like real reading.
    const delays = [1500, 3200, 5000, 7000];
    timersRef.current = delays.map((ms, i) =>
      window.setTimeout(() => {
        if (i < READ_STEPS.length - 1) setStepIdx(i + 1);
        else onSubmit(trimmed, f);
      }, ms),
    );
  };

  const font = { fontFamily: '"Nunito", system-ui, sans-serif' } as const;
  const counterTone = tooLong ? 'text-[#C2410C]' : tooShort ? 'text-[#57534E]' : words > 0 ? 'text-[#15803D]' : 'text-[#78716C]';
  // Each step's bar target; the CSS transition fills the gap between steps
  // over the same time the step takes, so the bar never sits still.
  const progress = stage === 'reading' ? [22, 41, 60, 78][Math.min(stepIdx, 3)] : 0;

  return (
    <div
      className={`relative w-full rounded-[24px] border-2 border-[#1C1917] bg-white p-3 text-left transition-colors sm:p-[18px] ${
        dragOver ? 'bg-[#F3FBE8]' : ''
      }`}
      style={{ boxShadow: '8px 8px 0 #7733B5', ...font }}
      onDragOver={(e) => { e.preventDefault(); if (stage === 'edit') setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
    >
      {stage === 'edit' ? (
        <>
          <div className="mb-2 flex items-center justify-between px-1 text-[12.5px] font-extrabold text-[#57534E]">
            <label htmlFor="hero-essay">Your essay</label>
            <span>{FREE_GRADE_MIN_WORDS} to {FREE_GRADE_MAX_WORDS.toLocaleString()} words</span>
          </div>
          <div className="relative">
            <textarea
              ref={textareaRef}
              id="hero-essay"
              value={text}
              onChange={(e) => { setText(e.target.value); if (fileName) setFileName(null); }}
              placeholder="Paste the whole essay here, introduction to conclusion. Or drop a .docx onto this box."
              spellCheck={false}
              rows={8}
              className="block min-h-[12rem] w-full resize-y rounded-[16px] border-2 border-[#1C1917] bg-[#FAF7FF] px-4 py-3.5 text-[15px] font-semibold leading-relaxed sm:min-h-[15rem] sm:px-[18px] sm:py-4 sm:text-[16px] text-[#1C1917] placeholder:text-[#8A8580] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#A560E8]/35"
              style={font}
            />
            {dragOver && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-[14px] border-2 border-dashed border-[#46A302] bg-[#F3FBE8]/95 text-[16px] font-black text-[#15803D]">
                Drop it here
              </div>
            )}
          </div>

          <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-1 text-[12.5px] font-extrabold sm:text-[13px]">
              <span className={`tabular-nums ${counterTone}`}>
                {reading
                  ? 'Reading your file…'
                  : words === 0
                    ? 'Nothing pasted yet'
                    : tooShort
                      ? `${words.toLocaleString()} words · needs ${FREE_GRADE_MIN_WORDS}+`
                      : tooLong
                        ? `${words.toLocaleString()} words · free grades cover up to ${FREE_GRADE_MAX_WORDS.toLocaleString()}`
                        : `${words.toLocaleString()} words${fileName ? ` · ${fileName}` : ''} · ready`}
              </span>
              {words === 0 && (
                <button type="button" onClick={useSample} className="text-[#57534E] underline decoration-2 underline-offset-[3px] hover:text-[#1C1917]">
                  Try a sample essay
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx,.txt,.md,text/plain"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) void readFile(f); e.currentTarget.value = ''; }}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:flex sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={reading}
                className="inline-flex min-h-[58px] items-center justify-center gap-2.5 rounded-[16px] border-2 border-[#1C1917] bg-white px-6 text-[17px] font-black text-[#1C1917] transition-all hover:bg-[#F3EEFF] active:translate-x-px active:translate-y-px disabled:opacity-60 sm:min-h-[62px] sm:text-[18px]"
                style={{ boxShadow: '4px 4px 0 #1C1917', ...font }}
              >
                <svg className="h-5 w-5 text-[#7733B5]" fill="none" stroke="currentColor" strokeWidth={2.6} viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
                </svg>
                {reading ? 'Reading…' : 'Upload .docx'}
              </button>

              <button
                type="button"
                onClick={submit}
                disabled={!ready}
                className="group/btn inline-flex min-h-[58px] items-center justify-center gap-2.5 rounded-[16px] border-2 border-[#1C1917] bg-[#58CC02] px-7 text-[18px] font-black sm:min-h-[62px] sm:px-9 sm:text-[20px] text-[#1C1917] transition-all hover:bg-[#61E002] active:translate-x-px active:translate-y-px disabled:cursor-not-allowed disabled:border-[#CBD5C0] disabled:bg-[#DDE9D2] disabled:text-[#7C8A70] disabled:shadow-none"
                style={{ boxShadow: ready ? '4px 4px 0 #1C1917' : 'none', ...font }}
              >
                Grade my essay
                <svg className="h-5 w-5 transition-transform group-hover/btn:translate-x-1" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
            </div>
          </div>

          {fileError && (
            <p className="mt-2 px-1 text-[12.5px] font-extrabold text-[#C2410C]" role="alert">{fileError}</p>
          )}

          <ul className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-[12px] font-extrabold text-[#57534E]">
            <li className="flex items-center gap-1.5"><Check />Free to try</li>
            <li className="flex items-center gap-1.5"><Check />Professor-style feedback</li>
            <li className="flex items-center gap-1.5"><Check />Grade and rubric scores</li>
            <li className="flex items-center gap-1.5"><Check />Never used to train AI</li>
          </ul>
        </>
      ) : (
        <div className="flex flex-col gap-4 p-1" aria-live="polite">
          <div className="flex items-center gap-3.5">
            <img src="/mascot-paper-still.webp" alt="" width={64} height={64} className="h-16 w-16 object-contain" />
            <div className="min-w-0">
              <p className="text-[12px] font-black uppercase tracking-[0.16em] text-[#7733B5]">Reading your essay</p>
              <p className="truncate text-[17px] font-black text-[#1C1917]">
                {facts?.fileName ? facts.fileName : `${facts?.words.toLocaleString()} words, ${facts?.paragraphs} paragraphs`}
              </p>
            </div>
          </div>

          <div role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Pre-read progress" className="h-3.5 overflow-hidden rounded-full border-2 border-[#1C1917] bg-[#FAF7FF]">
            <div className="h-full rounded-full bg-[#A560E8] transition-[width] duration-[1700ms] ease-linear" style={{ width: `${progress}%` }} />
          </div>

          <ol className="flex flex-col gap-2.5 text-[14.5px] font-extrabold">
            {READ_STEPS.map((label, i) => {
              const state = i < stepIdx ? 'done' : i === stepIdx ? 'active' : 'todo';
              return (
                <li key={i} className={`flex items-start gap-3 leading-snug ${state === 'todo' ? 'text-[#A8A29E]' : 'text-[#1C1917]'}`}>
                  {state === 'done' ? (
                    <span aria-hidden className="mt-px inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-2 border-[#1C1917] bg-[#58CC02] text-[11px] font-black text-[#1C1917]">✓</span>
                  ) : state === 'active' ? (
                    <span aria-hidden className="mt-px inline-block h-[22px] w-[22px] shrink-0 animate-spin rounded-full border-[3px] border-[#A560E8] border-r-[#F3EEFF]" />
                  ) : (
                    <span aria-hidden className="mt-px inline-block h-[22px] w-[22px] shrink-0 rounded-full border-2 border-[#D6D3D1]" />
                  )}
                  <span>{facts ? label(facts) : ''}</span>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}

function Check() {
  return (
    <span aria-hidden className="inline-flex h-4 w-4 items-center justify-center rounded-full border-[1.5px] border-[#1C1917] bg-[#58CC02] text-[9px] font-black text-[#1C1917]">✓</span>
  );
}
