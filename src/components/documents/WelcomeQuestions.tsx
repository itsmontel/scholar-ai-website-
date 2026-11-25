import { useEffect, useMemo, useState } from 'react';
import { trackEvent } from '../../utils/analytics';
import { flushAnswers, readAnswers, rememberDoor, saveAnswer, type Door, type OnboardingAnswers } from '../../utils/tryFirst';

/**
 * The welcome flow: a full-screen "Welcome to WriteScholar", then a short
 * set of questions, the first time an account reaches the dashboard.
 *
 * The first answer sets up the dashboard (exams, essays or both). On the
 * essay side the second asks where the essay is, which decides whether they
 * land on the Start an essay screen or the grader. The rest are research:
 * who is signing up, where they came from and what they find hard. There is no skip and no close; every question needs an answer.
 * Anything already answered on the landing page is not asked again.
 *
 * Shown once per account on a device. Answers are saved to the account's
 * row in onboarding_survey_responses (flushAnswers in utils/tryFirst.ts).
 */

const DONE_KEY = (userId: string) => `ws_welcome_done2_${userId}`;
const MODE_KEY = 'ws_home_mode';

type StepKey = 'goal' | 'stage' | 'deadline' | 'due' | 'level' | 'current' | 'struggles' | 'referralSource';
interface Step {
  key: StepKey;
  ask: string;
  hint: string;
  multi?: boolean;
  options: { value: string; label: string; reply?: string }[];
  /** What Scholar says once an answer is picked, when the option has no reply of its own. */
  reply: string;
}

const GOAL: Step = {
  key: 'goal',
  ask: 'What brings you here?',
  hint: 'This sets up your dashboard. You can switch any time.',
  reply: 'Got it.',
  options: [
    { value: 'exam', label: 'Studying for an exam', reply: 'Exams it is. I will turn any topic into flashcards, a quiz and games.' },
    { value: 'essay', label: 'Working on an essay', reply: 'Essays it is. I will help you plan it, write it and grade it.' },
    { value: 'both', label: 'Both', reply: 'Both, then. Your dashboard will show your packs and your essays.' },
  ],
};
const STAGE: Step = {
  key: 'stage',
  ask: 'Where are you with your essay?',
  hint: 'So I open the right thing for you.',
  reply: 'Got it.',
  options: [
    { value: 'start', label: 'I have not started', reply: 'Then we start with the question. I will give you a thesis and an outline.' },
    { value: 'middle', label: 'I am part of the way through', reply: 'Good. We will build the outline and you can paste in what you have.' },
    { value: 'draft', label: 'I have a finished draft', reply: 'Then let us get it graded. You will see what to fix first.' },
  ],
};
const DEADLINE: Step = {
  key: 'deadline',
  ask: 'When is your next exam?',
  hint: 'So I know how much time we have.',
  reply: 'Good to know.',
  options: [
    { value: 'week', label: 'This week', reply: 'That is close. Short sessions every day will do the most.' },
    { value: 'twoweeks', label: 'Next week', reply: 'Plenty of time for a little every day.' },
    { value: 'month', label: 'In 2 to 4 weeks' },
    { value: 'later', label: 'Later than that' },
    { value: 'none', label: 'No date yet' },
  ],
};
const DUE: Step = {
  key: 'due',
  ask: 'When is your essay due?',
  hint: 'So I know how much time we have.',
  reply: 'Good to know.',
  options: [
    { value: 'today', label: 'Today', reply: 'Then let us get straight to it after this.' },
    { value: 'tomorrow', label: 'Tomorrow', reply: 'Enough time if we start now.' },
    { value: 'week', label: 'This week' },
    { value: 'later', label: 'Later than that' },
    { value: 'none', label: 'Already handed in' },
  ],
};
const LEVEL: Step = {
  key: 'level',
  ask: 'What level are you studying at?',
  hint: 'This helps me pitch the difficulty.',
  reply: 'Thanks. I will pitch things at that level.',
  options: [
    { value: 'highschool', label: 'High school' },
    { value: 'underclass', label: 'First or second year' },
    { value: 'upperclass', label: 'Third year or above' },
    { value: 'masters', label: 'Postgraduate' },
  ],
};
const CURRENT: Step = {
  key: 'current',
  ask: 'What grades do you usually get?',
  hint: 'Be honest. Only we see this.',
  reply: 'Thanks for being straight with me.',
  options: [
    { value: 'A', label: 'Mostly As', reply: 'Nice. Let us keep it that way.' },
    { value: 'B', label: 'Mostly Bs', reply: 'A B is a few fixes away from an A.' },
    { value: 'C', label: 'Mostly Cs', reply: 'There is a lot of room to move up from here.' },
    { value: 'D', label: 'Below a C', reply: 'That is what I am here for. We will take it a step at a time.' },
  ],
};
/** What is hard depends on what they are here for, so the choices follow the first answer. */
const EXAM_STRUGGLES = [
  { value: 'remember', label: 'Remembering the material' },
  { value: 'understand', label: 'Understanding the material' },
  { value: 'predict', label: 'Knowing what will be on the exam' },
  { value: 'focus', label: 'Staying focused' },
  { value: 'nerves', label: 'Nerves on the day' },
];
const ESSAY_STRUGGLES = [
  { value: 'structure', label: 'Structuring my argument' },
  { value: 'marker', label: 'Knowing what the marker wants' },
  { value: 'refs', label: 'Referencing' },
];
const SHARED_STRUGGLES = [
  { value: 'start', label: 'Getting started' },
  { value: 'time', label: 'Running out of time' },
];
function strugglesStep(goal: 'exam' | 'essay' | 'both'): Step {
  return {
    key: 'struggles',
    ask: goal === 'exam' ? 'What do you find hardest about exams?' : goal === 'essay' ? 'What do you find hardest about essays?' : 'What do you find hardest?',
    hint: 'Pick as many as you like.',
    multi: true,
    reply: 'That is useful. Thank you.',
    options: [
      ...(goal !== 'essay' ? EXAM_STRUGGLES : []),
      ...(goal !== 'exam' ? ESSAY_STRUGGLES : []),
      ...SHARED_STRUGGLES,
    ],
  };
}
const SOURCE: Step = {
  key: 'referralSource',
  ask: 'How did you hear about us?',
  hint: 'Last one.',
  reply: 'Glad you found us.',
  options: [
    { value: 'reddit', label: 'Reddit' },
    { value: 'google', label: 'Google' },
    { value: 'tiktok', label: 'TikTok' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'youtube', label: 'YouTube' },
    { value: 'friend', label: 'A friend' },
    { value: 'other', label: 'Somewhere else' },
  ],
};

function missingSteps(a: OnboardingAnswers, door: Door | null, both = !!a.both): Step[] {
  const list: Step[] = [];
  if (!a.door) list.push(GOAL);
  // Asked once they are known to be here for an essay (or for both).
  if ((both || (door ?? a.door) === 'essay') && !a.stage) list.push(STAGE);
  const timing = (door ?? a.door ?? 'exam') === 'exam' ? DEADLINE : DUE;
  if (!a[timing.key as 'deadline' | 'due']) list.push(timing);
  if (!a.level) list.push(LEVEL);
  if (!a.current) list.push(CURRENT);
  if (!a.struggles?.length) list.push(strugglesStep(both ? 'both' : door ?? a.door ?? 'exam'));
  if (!a.referralSource) list.push(SOURCE);
  return list;
}

/** True when this account still has questions to answer on this device. */
export function shouldAskWelcome(userId?: string | null): boolean {
  if (!userId) return false;
  try { if (localStorage.getItem(DONE_KEY(userId))) return false; } catch { return false; }
  return missingSteps(readAnswers(), null).length > 0;
}

const Arrow = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
const GREEN = 'inline-flex min-h-[62px] items-center justify-center gap-2.5 rounded-[20px] border-2 border-b-[6px] border-[#46A302] bg-[#58CC02] px-9 text-[19px] font-black text-white transition-all enabled:hover:-translate-y-0.5 enabled:active:translate-y-0.5 enabled:active:border-b-2 disabled:cursor-not-allowed disabled:border-[#D6D3D1] disabled:bg-[#E7E5E4] disabled:text-[#78716C]';

export default function WelcomeQuestions({ userId, firstName, onClose }: { userId: string; firstName?: string; onClose: (next?: 'write') => void }) {
  // Fixed for this visit: what the landing page already collected.
  const had = useMemo(() => readAnswers(), []);
  const [door, setDoor] = useState<Door | null>(had.door ?? null);
  const [both, setBoth] = useState(!!had.both);
  const steps = useMemo(() => missingSteps(had, door, both), [had, door, both]);

  // -1 is the welcome screen, steps.length is the "all set" screen.
  const [index, setIndex] = useState(-1);
  const [picked, setPicked] = useState<Record<string, string[]>>({});

  useEffect(() => {
    trackEvent('onboarding_answer', { question: 'welcome_shown', answer: 'shown' });
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const step = index >= 0 && index < steps.length ? steps[index] : null;
  const chosen = step ? picked[step.key] ?? [] : [];

  const choose = (value: string) => {
    if (!step) return;
    setPicked((p) => {
      const cur = p[step.key] ?? [];
      const next = step.multi ? (cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value]) : [value];
      return { ...p, [step.key]: next };
    });
  };

  const commit = () => {
    if (!step || chosen.length === 0) return;
    if (step.key === 'goal') {
      const value = chosen[0];
      const d: Door = value === 'essay' ? 'essay' : 'exam';
      setDoor(d);
      setBoth(value === 'both');
      // The choices for "what is hardest" follow this answer.
      setPicked((p) => ({ ...p, struggles: [] }));
      rememberDoor(d);
      saveAnswer({ door: d, both: value === 'both' });
      try { localStorage.setItem(MODE_KEY, value); } catch { /* noop */ }
    } else if (step.multi) {
      saveAnswer({ [step.key]: chosen } as OnboardingAnswers);
    } else {
      saveAnswer({ [step.key]: chosen[0] } as OnboardingAnswers);
    }
    trackEvent('onboarding_answer', { question: step.key, answer: chosen.join(','), source: 'welcome' });
    setIndex((i) => i + 1);
  };

  const finish = () => {
    try { localStorage.setItem(DONE_KEY(userId), '1'); } catch { /* noop */ }
    let token = '';
    try { token = localStorage.getItem('authToken') || ''; } catch { /* noop */ }
    if (token) void flushAnswers(token);
    onClose(startsEssay ? 'write' : undefined);
  };

  // Here only for an essay that is not finished: the next screen is Start an essay.
  const stage = picked.stage?.[0] ?? had.stage;
  const essayOnly = door === 'essay' && !both;
  const startsEssay = essayOnly && (stage === 'start' || stage === 'middle');

  const reply = step && chosen.length > 0
    ? (!step.multi && step.options.find((o) => o.value === chosen[0])?.reply) || step.reply
    : null;
  const total = steps.length;
  const progress = index < 0 ? 0 : Math.min(index, total) / total;

  return (
    <div
      className="fixed inset-0 z-[210] flex flex-col overflow-y-auto bg-[#FBF8FF]"
      style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to WriteScholar"
    >
      {/* Top bar: back, progress, count */}
      <div className="sticky top-0 z-10 flex items-center gap-4 bg-[#FBF8FF] px-4 py-4 sm:px-8">
        {index >= 0 && index < total ? (
          <button
            type="button"
            onClick={() => setIndex((i) => i - 1)}
            aria-label="Back"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] border-2 border-b-4 border-[#E4D4F8] bg-white text-[#7733B5] transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-2"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
          </button>
        ) : (
          <img src="/main-logo.png" alt="WriteScholar" width={48} height={48} className="h-12 w-12 shrink-0 rounded-[14px] object-contain" />
        )}
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={Math.max(0, Math.min(index, total))}
          aria-label="Questions answered"
          className="h-4 min-w-0 flex-1 overflow-hidden rounded-full bg-[#E9DAFB]"
        >
          <div className="h-full rounded-full bg-[#58CC02] transition-[width] duration-300" style={{ width: `${Math.max(progress * 100, index >= 0 ? 6 : 0)}%` }} />
        </div>
        <span className="w-12 shrink-0 text-right text-[15px] font-black text-[#5B2491]">
          {step ? `${index + 1}/${total}` : ''}
        </span>
      </div>

      <div className="mx-auto flex w-full max-w-[760px] flex-1 flex-col px-4 pb-8 sm:px-6">
        {index < 0 ? (
          /* ── WELCOME ─────────────────────────────────────────────── */
          <div className="flex flex-1 flex-col items-center justify-center gap-5 py-6 text-center">
            <img src="/mascot-jumping-joy.webp" alt="Scholar, the WriteScholar mascot, jumping for joy" width={240} height={240} className="h-[200px] w-[200px] object-contain sm:h-[240px] sm:w-[240px]" />
            <h1 className="m-0 text-[36px] font-black leading-[1.05] tracking-[-0.02em] text-stone-900 sm:text-[52px]">
              Welcome to <span className="text-[#7733B5]">WriteScholar</span>{firstName ? `, ${firstName}` : ''}
            </h1>
            <p className="m-0 max-w-[520px] text-[18px] font-bold leading-snug text-stone-600 sm:text-[20px]">
              I am Scholar. {!had.door ? 'A few quick questions' : total === 1 ? 'One quick question' : `${total} quick questions`} and I will set everything up for you.
            </p>
            <button type="button" onClick={() => setIndex(0)} autoFocus className={`mt-2 w-full sm:w-auto ${GREEN}`}>
              Let&apos;s go
              <Arrow />
            </button>
            <p className="m-0 text-[14.5px] font-bold text-stone-500">It takes about 30 seconds.</p>
          </div>
        ) : step ? (
          /* ── A QUESTION ──────────────────────────────────────────── */
          <div className="flex flex-1 flex-col gap-6 py-4">
            <div className="flex items-start gap-3 sm:gap-4">
              <img src={reply ? '/mascot-celebrating-still.webp' : '/mascot-thinking-still.webp'} alt="Scholar, the WriteScholar mascot" width={120} height={120} className="h-[88px] w-[88px] shrink-0 object-contain sm:h-[120px] sm:w-[120px]" />
              <div className="relative mt-1 min-w-0 flex-1 rounded-[24px] border-2 border-[#E4D4F8] bg-white px-5 py-4 shadow-[0_16px_34px_-26px_rgba(90,45,140,0.55)]">
                <span aria-hidden className="absolute -left-[9px] top-7 h-4 w-4 rotate-45 border-b-2 border-l-2 border-[#E4D4F8] bg-white" />
                <h1 id="welcome-question" className="m-0 text-[24px] font-black leading-tight tracking-[-0.01em] text-stone-900 sm:text-[30px]">{step.ask}</h1>
                <p aria-live="polite" className={`m-0 mt-1.5 text-[15.5px] font-bold sm:text-[16.5px] ${reply ? 'text-[#3A8A00]' : 'text-stone-600'}`}>{reply || step.hint}</p>
              </div>
            </div>

            <div role="group" aria-labelledby="welcome-question" className={`grid gap-3 ${step.options.length > 4 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
              {step.options.map((o) => {
                const on = chosen.includes(o.value);
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => choose(o.value)}
                    aria-pressed={on}
                    className={`flex min-h-[64px] items-center gap-3.5 rounded-[20px] border-2 border-b-[5px] px-5 text-left text-[18px] font-black transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-2 ${
                      on ? 'border-[#A560E8] bg-[#F3EAFF] text-[#3F1A66]' : 'border-[#E4D4F8] bg-white text-stone-900 hover:border-[#C9A0F0]'
                    }`}
                  >
                    <span aria-hidden className={`flex h-8 w-8 shrink-0 items-center justify-center ${step.multi ? 'rounded-[10px]' : 'rounded-full'} ${on ? 'bg-[#58CC02] text-white' : 'border-[3px] border-[#C9A0F0] bg-white'}`}>
                      {on && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>}
                    </span>
                    {o.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-auto flex flex-col items-stretch gap-2 pt-2 sm:items-end">
              <button type="button" onClick={commit} disabled={chosen.length === 0} className={GREEN}>
                {index === total - 1 ? 'Finish' : 'Continue'}
                <Arrow />
              </button>
              {chosen.length === 0 && <p className="m-0 text-center text-[14.5px] font-bold text-stone-500 sm:text-right">{step.multi ? 'Pick at least one to continue.' : 'Pick one to continue.'}</p>}
            </div>
          </div>
        ) : (
          /* ── ALL SET ─────────────────────────────────────────────── */
          <div className="flex flex-1 flex-col items-center justify-center gap-5 py-6 text-center">
            <img src="/mascot-celebrating.webp" alt="Scholar, the WriteScholar mascot, celebrating" width={240} height={240} className="h-[200px] w-[200px] object-contain sm:h-[240px] sm:w-[240px]" />
            <h1 className="m-0 text-[36px] font-black leading-[1.05] tracking-[-0.02em] text-stone-900 sm:text-[48px]">
              You are all <span className="text-[#7733B5]">set</span>{firstName ? `, ${firstName}` : ''}
            </h1>
            <p className="m-0 max-w-[520px] text-[18px] font-bold leading-snug text-stone-600 sm:text-[20px]">
              {startsEssay
                ? 'Next, paste your essay question and I will build your outline.'
                : essayOnly
                  ? 'Your dashboard is ready. Paste your essay and I will grade it.'
                  : 'Your dashboard is ready. Type a topic and I will make your first study pack.'}
            </p>
            <button type="button" onClick={finish} autoFocus className={`mt-2 w-full sm:w-auto ${GREEN}`}>
              {startsEssay ? 'Start my essay' : 'Go to my dashboard'}
              <Arrow />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
