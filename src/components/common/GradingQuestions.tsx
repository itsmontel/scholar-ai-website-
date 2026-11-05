import { useEffect, useRef, useState } from 'react';
import { trackEvent } from '../../utils/analytics';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const PURPOSES = [
  { value: 'assignment', label: 'A graded assignment' },
  { value: 'application', label: 'A college application' },
  { value: 'exam', label: 'Exam or timed practice' },
  { value: 'curious', label: 'Just curious' },
] as const;

const DUE = [
  { value: 'today', label: 'Today' },
  { value: 'tomorrow', label: 'Tomorrow' },
  { value: 'week', label: 'This week' },
  { value: 'none', label: 'No rush' },
] as const;

const STEPS = [
  (w: number) => `Read all ${w.toLocaleString()} words`,
  () => 'Found the thesis and checked it against every paragraph',
  () => 'Scoring evidence and analysis',
  () => 'Marking weak sentences',
  () => 'Writing your report',
];

interface GradingQuestionsProps {
  open: boolean;
  words: number;
  email?: string | null;
}

/**
 * Shown instead of the generic grading overlay for the first free grade.
 * Left: live progress. Right: the only two questions we ask. Answers go
 * to /users/onboarding-survey (purpose, due) and are optional; the grade
 * never waits for them.
 */
export default function GradingQuestions({ open, words, email }: GradingQuestionsProps) {
  const [stepIdx, setStepIdx] = useState(0);
  const [progress, setProgress] = useState(4);
  const [purpose, setPurpose] = useState<string | null>(null);
  const [due, setDue] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const savedRef = useRef<string>('');

  useEffect(() => {
    if (!open) return;
    setStepIdx(0);
    setProgress(4);
    const stepTimer = window.setInterval(() => setStepIdx((i) => Math.min(i + 1, STEPS.length - 1)), 9000);
    const progTimer = window.setInterval(() => {
      setProgress((p) => (p >= 94 ? 94 : p + (p < 30 ? 1.2 : p < 60 ? 0.7 : 0.3)));
    }, 400);
    return () => { window.clearInterval(stepTimer); window.clearInterval(progTimer); };
  }, [open]);

  // Save whenever an answer changes; the row is upserted per user.
  useEffect(() => {
    if (!purpose && !due) return;
    const key = `${purpose ?? ''}|${due ?? ''}`;
    if (savedRef.current === key) return;
    savedRef.current = key;
    const token = localStorage.getItem('authToken');
    if (!token) return;
    void fetch(`${API_URL}/users/onboarding-survey`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ answers: { ...(purpose ? { purpose } : {}), ...(due ? { due } : {}) } }),
      keepalive: true,
    }).catch(() => {});
  }, [purpose, due]);

  useEffect(() => {
    if (purpose && due) setDone(true);
  }, [purpose, due]);

  if (!open) return null;

  const font = { fontFamily: '"Nunito", system-ui, sans-serif' } as const;
  const pick = (kind: 'purpose' | 'due', value: string) => {
    if (kind === 'purpose') setPurpose(value); else setDue(value);
    trackEvent('grade_question_answered', { [kind]: value });
  };

  return (
    <div className="fixed inset-0 z-[90] overflow-y-auto bg-[#FAF7FF] dark:bg-stone-950" role="dialog" aria-modal="true" aria-labelledby="grading-h" style={font}>
      <header className="border-b border-[#E7E5E4] bg-white dark:border-stone-800 dark:bg-stone-900">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4 px-5 py-3.5 sm:px-10">
          <div className="flex items-center gap-2.5 text-[18px] font-black text-[#1C1917] dark:text-stone-50">
            <img src="/logo.png" alt="" width={32} height={32} className="h-8 w-8 rounded-[10px] object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
            WriteScholar
          </div>
          <p className="text-[13px] font-extrabold text-[#57534E] dark:text-stone-400">Grading your essay</p>
        </div>
      </header>

      <main className="mx-auto flex max-w-[1180px] flex-wrap items-stretch gap-8 px-5 py-8 sm:px-10 sm:py-12 lg:gap-12">
        <section
          aria-labelledby="grading-h"
          className="flex min-w-0 flex-1 basis-[340px] flex-col gap-5 rounded-3xl border-2 border-[#E7E5E4] bg-white p-6 dark:border-stone-700 dark:bg-stone-900 sm:p-8"
        >
          <div className="flex items-center gap-4">
            <img src="/hero-tiles/mascot-paper.webp" alt="" width={88} height={88} className="h-[88px] w-[88px] object-contain" />
            <div>
              <h1 id="grading-h" className="text-[24px] font-black leading-[1.1] text-[#1C1917] dark:text-stone-50 sm:text-[26px]">Grading your essay</h1>
              <p className="mt-1 text-[15px] font-bold text-[#57534E] dark:text-stone-400">About a minute. Stay on this page.</p>
            </div>
          </div>

          <div role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label="Grading progress" className="h-3.5 overflow-hidden rounded-full border-2 border-[#E7E5E4] bg-[#EDE9F3] dark:border-stone-700 dark:bg-stone-800">
            <div className="h-full rounded-full bg-[#A560E8] transition-[width] duration-500" style={{ width: `${progress}%` }} />
          </div>

          <ol className="flex flex-col gap-3.5 text-[15px] font-bold">
            {STEPS.map((label, i) => {
              const state = i < stepIdx ? 'done' : i === stepIdx ? 'active' : 'todo';
              return (
                <li key={i} className={`flex items-center gap-3 ${state === 'todo' ? 'text-stone-400' : 'text-[#1C1917] dark:text-stone-100'}`}>
                  {state === 'done' ? (
                    <span aria-hidden className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[#DCFCE7] text-[13px] font-black text-[#15803D]">✓</span>
                  ) : state === 'active' ? (
                    <span aria-hidden className="inline-block h-[26px] w-[26px] animate-spin rounded-full border-[3px] border-[#A560E8] border-r-[#EDE9F3]" />
                  ) : (
                    <span aria-hidden className="inline-block h-[26px] w-[26px] rounded-full border-2 border-[#E7E5E4] dark:border-stone-700" />
                  )}
                  {label(words)}
                </li>
              );
            })}
          </ol>

          {email && (
            <p className="mt-auto text-[13px] font-bold leading-relaxed text-stone-500">
              Report saved to <span className="text-[#1C1917] dark:text-stone-100">{email}</span> too, so you can come back to it.
            </p>
          )}
        </section>

        <section aria-labelledby="q-h" className="flex min-w-0 flex-1 basis-[420px] flex-col gap-5">
          <div>
            <p className="text-[12px] font-black uppercase tracking-[0.16em] text-[#7733B5]">While you wait · 2 questions</p>
            <h2 id="q-h" className="mt-1.5 text-[26px] font-black leading-[1.1] text-[#1C1917] dark:text-stone-50 sm:text-[30px]">
              {done ? 'Thanks. Your report is almost ready.' : 'Two quick questions so the feedback fits'}
            </h2>
          </div>

          <fieldset className="flex flex-col gap-3 rounded-[20px] border-2 border-[#E7E5E4] bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
            <legend className="px-2 text-[16px] font-black text-[#1C1917] dark:text-stone-50">What is this essay for?</legend>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {PURPOSES.map((o) => (
                <Option key={o.value} name="purpose" label={o.label} checked={purpose === o.value} onChange={() => pick('purpose', o.value)} />
              ))}
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-3 rounded-[20px] border-2 border-[#E7E5E4] bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
            <legend className="px-2 text-[16px] font-black text-[#1C1917] dark:text-stone-50">When is it due?</legend>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {DUE.map((o) => (
                <Option key={o.value} name="due" label={o.label} checked={due === o.value} onChange={() => pick('due', o.value)} compact />
              ))}
            </div>
          </fieldset>

          <p className="text-[14px] font-bold text-stone-500">That is all we ask. Everything else we learn from the essay itself.</p>
        </section>
      </main>
    </div>
  );
}

function Option({ name, label, checked, onChange, compact = false }: { name: string; label: string; checked: boolean; onChange: () => void; compact?: boolean }) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-2.5 rounded-2xl border-2 border-b-4 px-3.5 font-extrabold transition-colors ${
        compact ? 'min-h-[48px] justify-center text-[14px]' : 'min-h-[50px] text-[15px]'
      } ${checked ? 'border-[#A560E8] bg-[#F3EEFF] text-[#1C1917]' : 'border-[#E7E5E4] bg-white text-[#1C1917] hover:bg-[#FAFAF9] dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100'}`}
    >
      <input type="radio" name={name} checked={checked} onChange={onChange} className="h-4 w-4 accent-[#7733B5]" />
      {label}
    </label>
  );
}
