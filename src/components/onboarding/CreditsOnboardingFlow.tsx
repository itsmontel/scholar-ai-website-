import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import CreditCoin from '../common/CreditCoin';
import { trackEvent } from '../../utils/analytics';
import {
  QUESTIONS,
  SOURCE_QUESTION,
  RECOMMENDATIONS,
  TRIAL_CREDIT_PLAN,
  TRIAL_CREDITS,
  PRO_MONTHLY_CREDITS,
  CREDIT_CAP,
  LIFE_SHORT,
  bubbleFor,
  empathyFor,
  gradeJump,
  lifeLineFor,
  outcomesFor,
  outcomeScholar,
  pathFor,
  QUESTION_SCHOLAR,
  SCHOLAR,
  type OnboardingAnswers,
  type OnboardingQuestion,
} from './onboardingContent';
import { STANDARD_MONTHLY_PRICE, TRIAL_DAYS } from '../../config/pricing';

/* ═══════════════════════════════════════════════════════════════
   The question-by-question onboarding (same flow as the iOS app).

     0      Welcome: the B → A promise
     1–8    Questions, Scholar replies to every answer
     9      "We hear you": their answers played back
     10–11  Outcomes, chosen by what's weighing on them
     12     Their week now vs. with WriteScholar
     13     How did you find us?
     14     Building your plan
     15     Plan + 3 free credits → start the trial

   Answers live in localStorage so a cancelled Stripe checkout comes
   back to the plan instead of the first question.
   ═══════════════════════════════════════════════════════════════ */

export const PLAN_STEP = 15;
const S = { WELCOME: 0, EMPATHY: 9, OUT_A: 10, OUT_B: 11, LIFE: 12, SOURCE: 13, BUILD: 14, PLAN: PLAN_STEP };
const STORAGE_PREFIX = 'ws_onboarding_v2_';

export function storedOnboardingAnswers(userKey: string): OnboardingAnswers | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + userKey);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed.answers === 'object' ? (parsed.answers as OnboardingAnswers) : null;
  } catch {
    return null;
  }
}

/** The Scholar animation for a step (also used to preload the next one). */
function scholarForStep(step: number, answers: OnboardingAnswers): string {
  const q = questionAt(step);
  if (q) return QUESTION_SCHOLAR[q.key];
  const [outA, outB] = outcomesFor(pathFor(answers));
  switch (step) {
    case S.WELCOME: return SCHOLAR.celebrating;
    case S.EMPATHY: return SCHOLAR.thinking;
    case S.OUT_A: return outcomeScholar(outA).src;
    case S.OUT_B: return outcomeScholar(outB).src;
    case S.LIFE: return SCHOLAR.dance;
    case S.BUILD: return SCHOLAR.juggling;
    default: return SCHOLAR.jumpingJoy;
  }
}

function questionAt(step: number): OnboardingQuestion | null {
  if (step >= 1 && step <= QUESTIONS.length) return QUESTIONS[step - 1];
  if (step === S.SOURCE) return SOURCE_QUESTION;
  return null;
}

interface Props {
  /** Scopes the saved answers (user id, or 'preview'). */
  userKey: string;
  firstName?: string;
  /** null while unknown: assume the trial is available. */
  trialEligible: boolean | null;
  starting: boolean;
  error: string | null;
  initialStep?: number;
  onStartTrial: (answers: OnboardingAnswers) => void;
  onLookAround: (answers: OnboardingAnswers) => void;
  /** Called once, when the last question is answered. */
  onAnswersReady: (answers: OnboardingAnswers) => void;
  onLogout?: () => void;
}

export default function CreditsOnboardingFlow({
  userKey,
  firstName,
  trialEligible,
  starting,
  error,
  initialStep,
  onStartTrial,
  onLookAround,
  onAnswersReady,
  onLogout,
}: Props) {
  const saved = useMemo(() => {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + userKey);
      return raw ? (JSON.parse(raw) as { step?: number; answers?: OnboardingAnswers }) : null;
    } catch {
      return null;
    }
  }, [userKey]);
  const [answers, setAnswers] = useState<OnboardingAnswers>(saved?.answers ?? {});
  const [step, setStep] = useState<number>(() => {
    if (typeof initialStep === 'number') return initialStep;
    const s = saved?.step;
    // Never resume mid-animation; the building screen restarts itself.
    return typeof s === 'number' && s >= 0 && s <= S.PLAN ? (s === S.BUILD ? S.PLAN : s) : 0;
  });
  const [buildTick, setBuildTick] = useState(0);
  const reportedRef = useRef(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PREFIX + userKey, JSON.stringify({ step, answers }));
    } catch {
      /* ignore */
    }
  }, [step, answers, userKey]);

  useEffect(() => {
    trackEvent('onboarding_v2_step', { step });
    if (typeof window !== 'undefined') window.scrollTo({ top: 0 });
  }, [step]);

  useEffect(() => {
    if (step !== S.BUILD) return;
    setBuildTick(0);
    const id = window.setInterval(() => {
      setBuildTick((t) => {
        if (t >= 4) {
          window.clearInterval(id);
          setStep(S.PLAN);
          return t;
        }
        return t + 1;
      });
    }, 700);
    return () => window.clearInterval(id);
  }, [step]);

  const q = questionAt(step);
  const path = pathFor(answers);
  const { from, to } = gradeJump(answers);
  const [outA, outB] = outcomesFor(path);
  const rec = RECOMMENDATIONS[path];
  const offerTrial = trialEligible !== false && TRIAL_DAYS > 0;
  const progress = Math.round((Math.min(step, S.PLAN) / S.PLAN) * 100);

  const go = (n: number) => setStep(Math.max(0, Math.min(S.PLAN, n)));
  const next = () => {
    if (step === S.SOURCE && !reportedRef.current) {
      reportedRef.current = true;
      onAnswersReady(answers);
    }
    go(step + 1);
  };
  const back = () => go(step === S.PLAN ? S.SOURCE : step - 1);

  const pick = (question: OnboardingQuestion, id: string) => {
    setAnswers((prev) => {
      if (question.multi) {
        const cur = (prev[question.key] as string[] | undefined) ?? [];
        const nextList = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
        return { ...prev, [question.key]: nextList };
      }
      return { ...prev, [question.key]: id };
    });
  };

  const hasAnswer = (() => {
    if (!q) return true;
    const v = answers[q.key];
    return Array.isArray(v) ? v.length > 0 : Boolean(v);
  })();

  const showTopBar = step !== S.WELCOME && step !== S.BUILD;
  const scholar = scholarForStep(step, answers);
  const nextScholar = step < S.PLAN ? scholarForStep(step + 1, answers) : null;

  return (
    <div className="relative min-h-[100dvh] flex flex-col bg-gradient-to-br from-[#FAF7FF] via-[#FBF7FF] to-[#F3EAFF] dark:from-stone-950 dark:via-stone-950 dark:to-stone-900 text-[#3C3C3C] dark:text-stone-100" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
      <div className="absolute inset-0 pointer-events-none wso-bg-cycle" aria-hidden />
      <div className="hidden lg:block absolute -top-40 left-[8%] h-[28rem] w-[28rem] rounded-full bg-[#A560E8]/15 blur-3xl pointer-events-none" aria-hidden />
      <div className="hidden lg:block absolute bottom-0 right-[5%] h-[24rem] w-[24rem] rounded-full bg-[#F5B70A]/10 blur-3xl pointer-events-none" aria-hidden />
      {/* Warm the next animation so it plays the moment the step changes. */}
      {nextScholar && nextScholar !== scholar && <img src={nextScholar} alt="" aria-hidden className="hidden" />}

      {showTopBar && (
        <div className="relative z-10">
          <div className="bg-white/95 dark:bg-stone-900/95 backdrop-blur border-b-2 border-[#E5E5E5] dark:border-stone-800">
            <div className="mx-auto w-full max-w-6xl px-3 sm:px-5 lg:px-10 py-2.5 flex items-center gap-2 lg:gap-4">
              <button type="button" onClick={back} aria-label="Back" className="w-11 h-11 flex items-center justify-center rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 dark:hover:text-stone-200 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden border-2 border-b-4 border-[#E5E5E5] dark:border-stone-700 bg-white dark:bg-stone-800">
                  <img src="/main-logo.png" alt="WriteScholar" className="w-full h-full object-contain" width="120" height="120" />
                </div>
                <span className="hidden min-[360px]:inline text-lg font-extrabold tracking-tight">WriteScholar</span>
              </div>
              {/* Desktop: progress sits in the bar itself. */}
              <div className="hidden lg:flex flex-1 items-center gap-3 px-6" aria-hidden>
                <div className="relative flex-1 h-3.5 rounded-full bg-[#ECE6F3] dark:bg-stone-800 overflow-hidden">
                  <div className="relative h-full bg-[#A560E8] rounded-full transition-all duration-500 ease-out overflow-hidden" style={{ width: `${progress}%` }}>
                    <div className="absolute inset-0 wso-shimmer" />
                  </div>
                </div>
                <span className="text-[12px] font-black text-stone-400 tabular-nums w-10 text-right">{progress}%</span>
              </div>
              <span className="ml-auto lg:ml-0 inline-flex items-center gap-1.5 h-8 pl-1.5 pr-3 rounded-full bg-[#FFF6DB] border-2 border-[#F3DB93] text-[13px] font-black text-[#7A5A00]">
                <CreditCoin size={18} />
                {TRIAL_CREDITS} free
              </span>
              {onLogout && (
                <button type="button" onClick={onLogout} className="hidden sm:inline-flex h-9 px-3 items-center rounded-xl text-[12px] font-extrabold uppercase tracking-wide text-stone-400 hover:text-stone-700 dark:hover:text-stone-200">
                  Sign out
                </button>
              )}
            </div>
          </div>
          <div className="lg:hidden h-3 bg-[#E5E5E5] dark:bg-stone-800 overflow-hidden">
            <div className="relative h-full bg-[#A560E8] rounded-r-full transition-all duration-500 ease-out overflow-hidden" style={{ width: `${progress}%` }}>
              <div className="absolute inset-0 wso-shimmer" aria-hidden />
            </div>
          </div>
        </div>
      )}

      <div key={step} className="relative z-[1] flex-1 flex flex-col min-h-0">
        {step === S.WELCOME && (
          <Welcome onNext={next} onLogout={onLogout} firstName={firstName} />
        )}

        {q && (
          <Screen
            stage={{ src: scholar, bubble: bubbleFor(q, answers) }}
            footer={<PrimaryButton onClick={next} disabled={!hasAnswer}>Continue</PrimaryButton>}
          >
            <div className="lg:hidden flex items-end gap-2.5">
              <img src={scholar} alt="" className="w-16 h-16 shrink-0 object-contain" width="64" height="64" />
              <div key={bubbleFor(q, answers)} className="wso-bubble flex-1 bg-white dark:bg-stone-900 border-2 border-[#E5E5E5] dark:border-stone-700 rounded-[18px] rounded-bl-[4px] px-3.5 py-2.5 text-[14px] leading-snug font-bold text-[#4B4B4B] dark:text-stone-200">
                {bubbleFor(q, answers)}
              </div>
            </div>
            <Eyebrow>{q.eyebrow}</Eyebrow>
            <h1 className="-mt-1.5 text-[25px] sm:text-[28px] lg:text-[34px] leading-[1.15] font-black tracking-tight">{q.title}</h1>
            {q.multi && <div className="-mt-1.5 text-[13px] lg:text-[14px] font-bold text-stone-500 dark:text-stone-400">Pick as many as you like</div>}
            <div className={`grid gap-2.5 lg:gap-3 ${q.options.length > 5 && !q.options.some((o) => o.sub) ? 'lg:grid-cols-2' : ''}`} role={q.multi ? 'group' : 'radiogroup'} aria-label={q.title}>
              {q.options.map((o, i) => {
                const v = answers[q.key];
                const selected = Array.isArray(v) ? v.includes(o.id) : v === o.id;
                return (
                  <button
                    key={o.id}
                    type="button"
                    role={q.multi ? 'checkbox' : 'radio'}
                    aria-checked={selected}
                    onClick={() => pick(q, o.id)}
                    className={`wso-card-in w-full min-h-[58px] lg:min-h-[64px] flex items-center gap-3.5 px-3.5 lg:px-4 py-2.5 rounded-2xl border-2 border-b-4 text-left transition-all active:translate-y-0.5 hover:-translate-y-px ${
                      selected
                        ? 'bg-[#F3EAFF] dark:bg-[#A560E8]/15 border-[#A560E8] shadow-[0_10px_24px_-16px_rgba(119,51,181,0.7)]'
                        : 'bg-white dark:bg-stone-900 border-[#E5E5E5] dark:border-stone-700 hover:border-[#D4BEF3]'
                    }`}
                    style={{ animationDelay: `${0.08 + i * 0.05}s` }}
                  >
                    <span
                      className={`w-8 h-8 shrink-0 flex items-center justify-center border-2 font-black text-[15px] ${
                        q.multi ? 'rounded-[9px]' : o.badge ? 'rounded-[10px]' : 'rounded-full'
                      } ${selected ? 'bg-[#A560E8] border-[#A560E8] text-white' : 'bg-white dark:bg-stone-800 border-[#E5E5E5] dark:border-stone-600 text-stone-500'}`}
                    >
                      {o.badge && !(selected && q.multi) ? o.badge : selected ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={3.4} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                      ) : null}
                    </span>
                    <span className="flex-1 flex flex-col gap-0.5">
                      <span className="text-[16px] font-extrabold">{o.label}</span>
                      {o.sub && <span className="text-[13px] font-semibold text-stone-500 dark:text-stone-400 leading-snug">{o.sub}</span>}
                    </span>
                  </button>
                );
              })}
            </div>
            {q.key === 'target' && answers.target && answers.target !== 'pass' && (
              <div className="wso-scale-in flex items-center justify-center gap-3.5 p-3.5 rounded-2xl bg-[#F3EAFF] dark:bg-[#A560E8]/15 border-2 border-[#E4D2F8] dark:border-[#A560E8]/30">
                <GradeTile grade={from} muted />
                <Arrow />
                <GradeTile grade={to} />
              </div>
            )}
          </Screen>
        )}

        {step === S.EMPATHY && (() => {
          const e = empathyFor(answers);
          return (
            <Screen
              stage={{ src: scholar, bubble: "I get it. Let me show you how we fix that." }}
              footer={<PrimaryButton onClick={next}>Show me how</PrimaryButton>}
            >
              <img src={scholar} alt="" className="lg:hidden wso-scale-in w-36 h-36 mx-auto object-contain" width="144" height="144" />
              <Eyebrow className="text-center lg:text-left">We hear you</Eyebrow>
              <h1 className="-mt-1 text-[27px] lg:text-[34px] leading-[1.15] font-black tracking-tight text-center lg:text-left">{e.title}</h1>
              <p className="wso-subtitle text-[15px] lg:text-[16px] leading-relaxed font-semibold text-stone-500 dark:text-stone-400 text-center lg:text-left">{e.body}</p>
              <div className="wso-card-in bg-white dark:bg-stone-900 lg:bg-[#FBF8FF] lg:dark:bg-stone-800/60 border-2 border-b-4 border-[#E5E5E5] dark:border-stone-700 rounded-2xl px-4 py-3.5 flex flex-col gap-2.5" style={{ animationDelay: '0.5s' }}>
                {e.points.map((p) => (
                  <div key={p} className="flex gap-2.5 items-start text-[14px] lg:text-[15px] font-bold leading-snug text-[#4B4B4B] dark:text-stone-200">
                    <span className="w-[22px] h-[22px] mt-px shrink-0 rounded-full bg-[#A560E8] flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={4} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                    </span>
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            </Screen>
          );
        })()}

        {(step === S.OUT_A || step === S.OUT_B) && (() => {
          const o = step === S.OUT_A ? outA : outB;
          const sc = outcomeScholar(o);
          return (
            <Screen stage={{ src: sc.src, bubble: sc.line }} footer={<PrimaryButton onClick={next}>Continue</PrimaryButton>}>
              <Tag>{o.tag}</Tag>
              <h1 className="-mt-0.5 text-[27px] lg:text-[34px] leading-[1.12] font-black tracking-tight">{o.title}</h1>
              <div className="wso-card-in rounded-2xl overflow-hidden border-2 border-b-4 border-[#E5E5E5] dark:border-stone-700 bg-white aspect-[16/10]">
                <video src={o.video} autoPlay muted loop playsInline aria-label={o.videoLabel} className="w-full h-full object-cover object-left-top" />
              </div>
              {o.showsScore && (
                <div className="wso-card-in flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-white dark:bg-stone-900 border-2 border-[#E5E5E5] dark:border-stone-700" style={{ animationDelay: '0.2s' }}>
                  <div className="flex-1">
                    <div className="text-[12px] font-extrabold text-stone-500 dark:text-stone-400">Example draft</div>
                    <div className="text-[20px] font-black text-stone-400">B · 80/100</div>
                  </div>
                  <Arrow />
                  <div className="flex-1 text-right">
                    <div className="text-[12px] font-extrabold text-stone-500 dark:text-stone-400">After the fixes</div>
                    <div className="text-[20px] font-black text-[#7733B5] dark:text-[#C9A0F0]">A · 90/100</div>
                  </div>
                </div>
              )}
              <ul className="flex flex-col gap-2.5">
                {o.points.map((p) => (
                  <li key={p} className="flex gap-2.5 items-start text-[14px] lg:text-[15px] font-bold leading-snug text-[#4B4B4B] dark:text-stone-200">
                    <Check />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
              <div className="lg:hidden wso-bubble flex gap-2.5 items-center px-3.5 py-3 rounded-2xl bg-[#F3EAFF] dark:bg-[#A560E8]/15" style={{ animationDelay: '0.4s' }}>
                <img src={sc.src} alt="" className="w-12 h-12 shrink-0 object-contain" width="48" height="48" />
                <span className="text-[14px] font-extrabold leading-snug">{sc.line}</span>
              </div>
            </Screen>
          );
        })()}

        {step === S.LIFE && (() => {
          const picks = answers.life?.length ? answers.life : ['friends', 'sleep'];
          const before = ['Essay', 'Essay', 'Cram', 'Essay', 'Stress', 'Cram', 'Essay'];
          const after: (number | 'study')[] = ['study', 0, 'study', 1, 0, 1, 'study'];
          const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
          return (
            <Screen stage={{ src: scholar, bubble: lifeLineFor(answers) }} footer={<PrimaryButton onClick={next}>I want that</PrimaryButton>}>
              <Tag>The real outcome</Tag>
              <h1 className="-mt-0.5 text-[27px] lg:text-[34px] leading-[1.12] font-black tracking-tight">Better grades. And your evenings back.</h1>
              <p className="text-[15px] lg:text-[16px] leading-relaxed font-semibold text-stone-500 dark:text-stone-400">No more rewriting the same essay at 2am, guessing if it&apos;s good enough.</p>
              <Week title="Your week now" days={days} cells={before.map((l) => ({ label: l, tone: 'grey' as const }))} />
              <div className="flex justify-center -my-1" aria-hidden>
                <svg className="w-6 h-6 text-[#A560E8]" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M6 13l6 6 6-6" /></svg>
              </div>
              <Week
                highlight
                title="Your week with WriteScholar"
                days={days}
                cells={after.map((p) => (p === 'study'
                  ? { label: '20 min', tone: 'purple' as const }
                  : { label: LIFE_SHORT[picks[p % picks.length]] ?? 'Free', tone: 'gold' as const }))}
              />
              <p className="lg:hidden text-center text-[14px] font-extrabold leading-snug text-[#4B4B4B] dark:text-stone-200">{lifeLineFor(answers)}</p>
            </Screen>
          );
        })()}

        {step === S.BUILD && (
          <div className="flex-1 flex flex-col items-center justify-center gap-5 px-7 py-10 text-center max-w-md lg:max-w-lg mx-auto w-full">
            <ScholarStage src={scholar} size="build" />
            <h1 className="text-[26px] lg:text-[34px] font-black tracking-tight">Building your plan…</h1>
            <div className="relative w-full h-3.5 rounded-full bg-[#E5E5E5] dark:bg-stone-800 overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, buildTick * 25)}>
              <div className="relative h-full bg-[#A560E8] rounded-full transition-all duration-500 overflow-hidden" style={{ width: `${Math.min(100, buildTick * 25)}%` }}>
                <div className="absolute inset-0 wso-shimmer" aria-hidden />
              </div>
            </div>
            <ul className="w-full flex flex-col gap-3 text-left lg:bg-white/80 lg:dark:bg-stone-900/80 lg:border-2 lg:border-[#EADFF8] lg:dark:border-stone-700 lg:rounded-3xl lg:p-6">
              {['Reading your answers', `Matching your goal: ${from} to ${to}`, 'Choosing where to start', `Planning your ${TRIAL_CREDITS} free credits`].map((label, i) => {
                const done = buildTick > i;
                return (
                  <li key={label} className="flex items-center gap-3 text-[15px] lg:text-[16px] font-extrabold">
                    <span className={`w-[26px] h-[26px] shrink-0 rounded-full flex items-center justify-center transition-colors ${done ? 'bg-[#58CC02]' : 'bg-white dark:bg-stone-800 border-2 border-[#E5E5E5] dark:border-stone-600'}`}>
                      {done && <svg className="w-3.5 h-3.5 text-white wso-scale-in" fill="none" stroke="currentColor" strokeWidth={3.6} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M5 12.5l4.5 4.5L19 7.5" /></svg>}
                    </span>
                    <span className={done ? '' : 'text-stone-400'}>{label}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {step === S.PLAN && (
          <Screen
            stage={{ src: scholar, bubble: `Your plan is ready${firstName ? `, ${firstName}` : ''}! Let's get you that ${to === 'Pass' ? 'pass' : to}.` }}
            footer={
              <>
                <PrimaryButton onClick={() => onStartTrial(answers)} disabled={starting}>
                  {starting ? 'Opening secure checkout…' : offerTrial ? 'Start my free trial' : `Get Pro · $${STANDARD_MONTHLY_PRICE.pro}/mo`}
                </PrimaryButton>
                <p className="mt-2 text-center text-[12px] leading-snug font-bold text-stone-500 dark:text-stone-400">
                  {offerTrial
                    ? `${TRIAL_DAYS} days free with ${TRIAL_CREDITS} credits · then $${STANDARD_MONTHLY_PRICE.pro}/mo for ${PRO_MONTHLY_CREDITS} credits · cancel anytime. We'll email you before it ends.`
                    : `${PRO_MONTHLY_CREDITS} credits a month · unused credits roll over · cancel anytime`}
                </p>
                <button type="button" onClick={() => onLookAround(answers)} className="mt-1 w-full py-2 text-[13px] font-extrabold text-stone-400 hover:text-stone-600 dark:hover:text-stone-300">
                  Look around first
                </button>
              </>
            }
          >
            <div className="flex items-center gap-3">
              <img src={scholar} alt="" className="lg:hidden w-16 h-16 shrink-0 object-contain" width="64" height="64" />
              <div>
                <Eyebrow>Your plan is ready{firstName ? `, ${firstName}` : ''}</Eyebrow>
                <h1 className="mt-0.5 text-[24px] lg:text-[32px] leading-[1.12] font-black tracking-tight">{from} to {to}, without losing your evenings</h1>
              </div>
            </div>

            <div className="wso-card-in bg-[#A560E8] border-2 border-b-4 border-[#7733B5] text-white rounded-2xl p-4 lg:p-5 flex flex-col gap-2">
              <span className="self-start px-2.5 py-1 rounded-full bg-white text-[#7733B5] text-[11px] font-black tracking-wide">START HERE</span>
              <div className="text-[21px] lg:text-[23px] font-black leading-tight">{rec.title}</div>
              <div className="text-[14px] lg:text-[15px] font-bold leading-relaxed">{rec.body}</div>
            </div>

            {offerTrial && (
              <div className="wso-card-in bg-[#FFF6DB] dark:bg-[#F5B70A]/10 border-2 border-b-4 border-[#F3DB93] dark:border-[#F5B70A]/40 rounded-2xl px-4 py-3.5 lg:px-5 lg:py-4 flex flex-col gap-2.5" style={{ animationDelay: '0.15s' }}>
                <div className="flex items-center justify-between">
                  <div className="text-[17px] font-black">Your {TRIAL_CREDITS} free credits</div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: TRIAL_CREDITS }, (_, i) => (
                      <CreditCoin key={i} size={22} className="wso-coin" style={{ animationDelay: `${0.3 + i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
                {TRIAL_CREDIT_PLAN[path].map((c, i) => (
                  <div key={c.label} className="flex items-center gap-2.5 text-[14px] font-bold">
                    <span className="w-[22px] h-[22px] shrink-0 rounded-full bg-[#F5B70A] text-[#3C2A00] text-[12px] font-black flex items-center justify-center">{i + 1}</span>
                    <span className="flex-1">{c.label}</span>
                    <span className="text-[12px] font-black text-[#7A5A00] dark:text-[#F5D670]">{c.when}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="wso-card-in bg-white dark:bg-stone-900 lg:bg-[#FBF8FF] lg:dark:bg-stone-800/60 border-2 border-[#E5E5E5] dark:border-stone-700 rounded-2xl px-4 py-3.5 flex flex-col gap-2" style={{ animationDelay: '0.3s' }}>
              <div className="text-[14px] font-black">How credits work</div>
              <div className="flex gap-2 text-[13px] font-bold leading-snug text-[#4B4B4B] dark:text-stone-300">
                <CreditCoin size={16} className="mt-px" />
                1 credit = 1 essay analysis, study pack or citation search
              </div>
              <div className="flex gap-2 text-[13px] font-bold leading-snug text-[#4B4B4B] dark:text-stone-300">
                <svg className="w-4 h-4 mt-px shrink-0 text-[#7733B5] dark:text-[#C9A0F0]" fill="none" stroke="currentColor" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden><path d="M3 12a9 9 0 0 1 15.5-6.2L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-15.5 6.2L3 16" /><path d="M3 21v-5h5" /></svg>
                Unused credits roll over every month, up to {CREDIT_CAP}
              </div>
            </div>

            {error && (
              <div role="alert" className="rounded-xl bg-[#F3EAFF] dark:bg-[#A560E8]/10 border-2 border-[#A560E8]/30 px-3 py-2.5 text-[13px] text-[#7733B5] dark:text-[#C9A0F0] font-bold">
                {error}
              </div>
            )}
          </Screen>
        )}
      </div>

      <style>{FLOW_CSS}</style>
    </div>
  );
}

/* ─── Pieces ─── */

const WELCOME_PROMISES = [
  { label: 'Know your grade before you hand it in', icon: 'M4 19V5M4 19h16M8 15l4-4 3 3 5-6' },
  { label: 'Actually remember it on exam day', icon: 'M12 3a6 6 0 0 0-3.5 10.9V17h7v-3.1A6 6 0 0 0 12 3zM9.5 21h5' },
  { label: 'Get your evenings back', icon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z' },
];

function Welcome({ onNext, onLogout, firstName }: { onNext: () => void; onLogout?: () => void; firstName?: string }) {
  const words: { w: string; tone?: 'muted' | 'accent' }[] = [
    { w: "Let's" }, { w: 'turn' }, { w: 'your' }, { w: 'B', tone: 'muted' }, { w: 'into' }, { w: 'an' }, { w: 'A.', tone: 'accent' },
  ];
  const headline = (
    <h1 className="text-[34px] sm:text-[40px] lg:text-[60px] leading-[1.05] font-black tracking-tight">
      {words.map(({ w, tone }, i) => (
        <span key={i}>
          <span className={`inline-block wso-word ${tone === 'muted' ? 'text-stone-400' : tone === 'accent' ? 'text-[#A560E8]' : ''}`} style={{ animationDelay: `${0.1 + i * 0.08}s` }}>{w}</span>{' '}
        </span>
      ))}
    </h1>
  );
  const greeting = `Hi${firstName ? ` ${firstName}` : ''}! I'm Scholar. Let's get you that A.`;
  return (
    <>
      <div className="h-1.5 bg-gradient-to-r from-[#A560E8] via-[#8A48C7] to-[#A560E8]" aria-hidden />
      <div className="mx-auto w-full max-w-6xl flex items-center justify-between px-4 lg:px-10 pt-3">
        <div className="hidden lg:flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden border-2 border-b-4 border-[#E5E5E5] dark:border-stone-700 bg-white dark:bg-stone-800">
            <img src="/main-logo.png" alt="" className="w-full h-full object-contain" width="120" height="120" />
          </div>
          <span className="text-xl font-extrabold tracking-tight">WriteScholar</span>
        </div>
        {onLogout && (
          <button type="button" onClick={onLogout} className="ml-auto h-9 px-3 rounded-xl text-[12px] font-extrabold uppercase tracking-wide text-stone-400 hover:text-stone-700 dark:hover:text-stone-200">
            Sign out
          </button>
        )}
      </div>

      {/* Phone */}
      <div className="lg:hidden flex-1 flex flex-col items-center justify-center gap-3 px-6 py-6 text-center">
        <SpeechBubble text={greeting} />
        <ScholarStage src={SCHOLAR.celebrating} size="welcome-sm" alt="Scholar the mascot waving hello" />
        <div className="mt-3 max-w-md">{headline}</div>
        <p className="wso-subtitle text-[16px] leading-relaxed font-semibold text-stone-500 dark:text-stone-400 max-w-[320px]">
          A few quick questions about your grades, your deadlines and your life. Then we&apos;ll build your plan.
        </p>
      </div>
      <Footer className="lg:hidden">
        <PrimaryButton onClick={onNext}>Let&apos;s go</PrimaryButton>
      </Footer>

      {/* Desktop */}
      <div className="hidden lg:grid flex-1 mx-auto w-full max-w-6xl px-10 py-10 grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] gap-16 items-center">
        <div className="flex flex-col items-center gap-5">
          <SpeechBubble text={greeting} large />
          <ScholarStage src={SCHOLAR.celebrating} size="lg" alt="Scholar the mascot waving hello" />
        </div>
        <div className="flex flex-col gap-6">
          <span className="self-start inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-stone-900 border-2 border-[#EADFF8] dark:border-stone-700 text-[12px] font-black uppercase tracking-[0.12em] text-[#7733B5] dark:text-[#C9A0F0]">
            <CreditCoin size={18} /> {TRIAL_CREDITS} free credits waiting
          </span>
          {headline}
          <p className="wso-subtitle text-[18px] leading-relaxed font-semibold text-stone-500 dark:text-stone-400 max-w-[30rem]">
            A few quick questions about your grades, your deadlines and your life. Then we&apos;ll build a plan that fits you.
          </p>
          <ul className="flex flex-col gap-3">
            {WELCOME_PROMISES.map((p, i) => (
              <li key={p.label} className="wso-card-in flex items-center gap-3 text-[16px] font-extrabold" style={{ animationDelay: `${0.7 + i * 0.1}s` }}>
                <span className="w-10 h-10 rounded-xl bg-[#F3EAFF] dark:bg-[#A560E8]/15 border-2 border-[#E4D2F8] dark:border-[#A560E8]/30 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-[#7733B5] dark:text-[#C9A0F0]" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden><path d={p.icon} /></svg>
                </span>
                {p.label}
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-4 pt-2">
            <div className="w-72"><PrimaryButton onClick={onNext}>Let&apos;s go</PrimaryButton></div>
            <span className="text-[13px] font-bold text-stone-400">Takes about a minute</span>
          </div>
        </div>
      </div>
    </>
  );
}

/** Desktop left column: the animated Scholar with what they're saying. */
function ScholarStage({ src, size, alt = '' }: { src: string; size: 'lg' | 'build' | 'welcome-sm'; alt?: string }) {
  const box = size === 'lg' ? 'w-[340px] h-[340px] xl:w-[380px] xl:h-[380px]' : size === 'build' ? 'w-44 h-44 lg:w-64 lg:h-64' : 'w-[210px] h-[210px]';
  const img = size === 'lg' ? 'w-[300px] h-[300px] xl:w-[340px] xl:h-[340px]' : size === 'build' ? 'w-40 h-40 lg:w-56 lg:h-56' : 'w-[190px] h-[190px]';
  return (
    <div className={`relative ${box} flex items-center justify-center shrink-0`}>
      <span className="absolute inset-[12%] rounded-full bg-[radial-gradient(circle,rgba(165,96,232,0.32),transparent_70%)] wso-glow" aria-hidden />
      <span className="absolute inset-[4%] rounded-full border-[3px] border-[#A560E8]/40 wso-ring" aria-hidden />
      <span className="absolute inset-[4%] rounded-full border-[3px] border-[#A560E8]/30 wso-ring" style={{ animationDelay: '1.1s' }} aria-hidden />
      <span className="absolute bottom-[3%] left-1/2 -translate-x-1/2 w-1/2 h-4 rounded-[50%] bg-[#7733B5]/15 blur-md" aria-hidden />
      <img src={src} alt={alt} className={`relative ${img} object-contain wso-bob`} />
    </div>
  );
}

function SpeechBubble({ text, large = false }: { text: string; large?: boolean }) {
  return (
    <div
      key={text}
      className={`wso-bubble relative bg-white dark:bg-stone-900 border-2 border-b-4 border-[#E5E5E5] dark:border-stone-700 text-center font-extrabold [text-wrap:balance] ${
        large
          ? 'max-w-[400px] rounded-[26px] px-6 py-4 text-[19px] leading-snug shadow-[0_20px_44px_-26px_rgba(119,51,181,0.55)]'
          : 'rounded-3xl px-5 py-3 text-[17px] shadow-md'
      }`}
    >
      {text}
      <span className="absolute left-1/2 -bottom-[9px] -ml-[8px] w-4 h-4 bg-white dark:bg-stone-900 border-r-2 border-b-[3px] border-[#E5E5E5] dark:border-stone-700 rotate-45" aria-hidden />
    </div>
  );
}

function Screen({ children, footer, stage }: { children: ReactNode; footer: ReactNode; stage: { src: string; bubble: string } }) {
  return (
    <>
      <div className="wso-slide-in flex-1 w-full mx-auto max-w-[560px] lg:max-w-6xl px-5 pt-5 pb-6 lg:px-10 lg:py-12 lg:grid lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.1fr)] lg:gap-14 xl:gap-20 lg:items-center">
        <div className="hidden lg:flex flex-col items-center gap-5 lg:sticky lg:top-28 self-center">
          <SpeechBubble text={stage.bubble} large />
          <ScholarStage src={stage.src} size="lg" />
        </div>
        <div className="flex flex-col gap-3.5 lg:gap-4 lg:rounded-[32px] lg:bg-white/95 lg:dark:bg-stone-900/95 lg:border-2 lg:border-b-[6px] lg:border-[#EADFF8] lg:dark:border-stone-700 lg:p-9 lg:shadow-[0_40px_90px_-45px_rgba(119,51,181,0.55)]">
          {children}
          <div className="hidden lg:block pt-3">{footer}</div>
        </div>
      </div>
      <Footer className="lg:hidden">{footer}</Footer>
    </>
  );
}

function Footer({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`sticky bottom-0 z-10 bg-white/95 dark:bg-stone-900/95 backdrop-blur border-t-2 border-[#E5E5E5] dark:border-stone-800 px-5 pt-3.5 pb-[max(1rem,env(safe-area-inset-bottom))] ${className}`}>
      <div className="max-w-[560px] mx-auto">{children}</div>
    </div>
  );
}

function PrimaryButton({ children, onClick, disabled = false }: { children: ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full h-[54px] lg:h-[58px] rounded-2xl border-2 border-b-4 text-[16px] font-extrabold uppercase tracking-wide transition-all ${
        disabled
          ? 'bg-[#E5E5E5] dark:bg-stone-800 border-[#E5E5E5] dark:border-stone-700 text-stone-500 cursor-not-allowed'
          : 'bg-[#A560E8] hover:bg-[#7733B5] border-[#7733B5] text-white active:border-b-2 active:translate-y-0.5 shadow-[0_14px_30px_-16px_rgba(119,51,181,0.8)]'
      }`}
    >
      {children}
    </button>
  );
}

function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`text-[12px] lg:text-[13px] font-black uppercase tracking-[0.12em] text-[#7733B5] dark:text-[#C9A0F0] ${className}`}>{children}</div>
  );
}

function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="self-start px-3 py-1 rounded-full bg-[#F3EAFF] dark:bg-[#A560E8]/15 text-[#7733B5] dark:text-[#C9A0F0] text-[12px] font-black uppercase tracking-wide">
      {children}
    </span>
  );
}

function Check() {
  return (
    <svg className="w-5 h-5 shrink-0 text-[#A560E8]" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

function Arrow() {
  return (
    <svg width="34" height="18" viewBox="0 0 34 18" fill="none" stroke="#A560E8" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2 9h28" /><path d="M23 2l7 7-7 7" />
    </svg>
  );
}

function GradeTile({ grade, muted = false }: { grade: string; muted?: boolean }) {
  return (
    <span className={`min-w-[50px] h-[50px] px-1.5 rounded-[14px] border-2 border-b-4 flex items-center justify-center text-[24px] font-black ${
      muted ? 'bg-white dark:bg-stone-800 border-[#E5E5E5] dark:border-stone-600 text-stone-400' : 'bg-[#A560E8] border-[#7733B5] text-white'
    }`}>
      {grade}
    </span>
  );
}

function Week({ title, days, cells, highlight = false }: { title: string; days: string[]; cells: { label: string; tone: 'grey' | 'purple' | 'gold' }[]; highlight?: boolean }) {
  const toneClass = {
    grey: 'bg-[#EDEDED] dark:bg-stone-800 border-[#DCDCDC] dark:border-stone-700 text-stone-500',
    purple: 'bg-[#F3EAFF] dark:bg-[#A560E8]/15 border-[#E4D2F8] dark:border-[#A560E8]/30 text-[#7733B5] dark:text-[#C9A0F0]',
    gold: 'bg-[#FFF1C2] dark:bg-[#F5B70A]/15 border-[#F3DB93] dark:border-[#F5B70A]/40 text-[#6B4E00] dark:text-[#F5D670]',
  };
  return (
    <div className={`wso-card-in bg-white dark:bg-stone-900 border-2 border-b-4 rounded-2xl p-3.5 flex flex-col gap-2.5 ${highlight ? 'border-[#A560E8]' : 'border-[#E5E5E5] dark:border-stone-700'}`} style={highlight ? { animationDelay: '0.25s' } : undefined}>
      <div className={`text-[13px] font-black ${highlight ? 'text-[#7733B5] dark:text-[#C9A0F0]' : 'text-stone-500 dark:text-stone-400'}`}>{title}</div>
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((c, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <span className="text-[11px] font-extrabold text-stone-500 dark:text-stone-400">{days[i]}</span>
            <span className={`w-full h-14 rounded-[10px] border-2 flex items-end justify-center pb-1.5 text-[9px] font-black uppercase tracking-wide ${toneClass[c.tone]}`}>
              {c.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Same motion as the dashboard / old onboarding (ob-* keyframes),
   prefixed so the two can live side by side. */
const FLOW_CSS = `
@keyframes wsoBgCycle {
  0%, 100% { background: radial-gradient(ellipse at 30% 30%, rgba(165,96,232,0.22), transparent 60%), radial-gradient(ellipse at 70% 70%, rgba(138,72,199,0.16), transparent 60%); }
  33%      { background: radial-gradient(ellipse at 70% 30%, rgba(181,122,240,0.20), transparent 60%), radial-gradient(ellipse at 30% 70%, rgba(119,51,181,0.16), transparent 60%); }
  66%      { background: radial-gradient(ellipse at 50% 80%, rgba(201,160,240,0.18), transparent 60%), radial-gradient(ellipse at 50% 20%, rgba(165,96,232,0.18), transparent 60%); }
}
.wso-bg-cycle { animation: wsoBgCycle 6s ease-in-out infinite; }
@keyframes wsoRing { 0% { transform: scale(0.8); opacity: 0.9; } 70%, 100% { transform: scale(1.25); opacity: 0; } }
.wso-ring { animation: wsoRing 2.2s cubic-bezier(0.16, 1, 0.3, 1) infinite; }
@keyframes wsoGlow { 0%, 100% { opacity: 0.6; transform: scale(1); } 50% { opacity: 0.85; transform: scale(1.08); } }
.wso-glow { animation: wsoGlow 2.4s ease-in-out infinite; }
@keyframes wsoBob { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-6px) scale(1.02); } }
.wso-bob { animation: wsoBob 2.4s ease-in-out infinite; }
@keyframes wsoWord { 0% { transform: translateY(18px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
.wso-word { animation: wsoWord 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
@keyframes wsoSubtitle { 0% { transform: translateY(8px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
.wso-subtitle { animation: wsoSubtitle 0.5s ease-out 0.6s both; }
@keyframes wsoBubble { 0% { transform: scale(0.6) translateY(10px); opacity: 0; } 60% { transform: scale(1.05) translateY(-2px); opacity: 1; } 100% { transform: scale(1) translateY(0); opacity: 1; } }
.wso-bubble { animation: wsoBubble 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s backwards; }
@keyframes wsoScaleIn { 0% { transform: scale(0.6); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
.wso-scale-in { animation: wsoScaleIn 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
@keyframes wsoSlideIn { 0% { opacity: 0; transform: translateX(28px); } 100% { opacity: 1; transform: none; } }
.wso-slide-in { animation: wsoSlideIn 0.45s cubic-bezier(0.22, 1, 0.36, 1) both; }
@keyframes wsoCardIn { 0% { opacity: 0; transform: translateY(14px) scale(0.97); } 100% { opacity: 1; transform: none; } }
.wso-card-in { animation: wsoCardIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
@keyframes wsoCoin { 0% { transform: scale(0) rotate(-40deg); opacity: 0; } 70% { transform: scale(1.18) rotate(8deg); opacity: 1; } 100% { transform: scale(1) rotate(0); } }
.wso-coin { animation: wsoCoin 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
@keyframes wsoShimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
.wso-shimmer { background: linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent); animation: wsoShimmer 1.4s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) {
  .wso-bg-cycle, .wso-ring, .wso-glow, .wso-bob, .wso-shimmer { animation: none !important; }
  .wso-word, .wso-subtitle, .wso-bubble, .wso-scale-in, .wso-slide-in, .wso-card-in, .wso-coin { animation: none !important; opacity: 1; transform: none; }
}
`;
