import { useId, useRef, useState, type ReactNode } from 'react';
import CreditCoin from '../common/CreditCoin';
import { SCHOLAR } from './onboardingContent';
import { Eyebrow, FlowShell, FlowTopBar, PrimaryButton, ScholarStage, Screen } from './CreditsOnboardingFlow';

/* ═══════════════════════════════════════════════════════════════
   The step after the onboarding questions: their essay (or notes)
   in, their free grade (or study pack) out. Built on the question
   flow's own stage (Scholar and a speech bubble on the left, the card
   on the right, the sticky button on phones) so the last step reads
   as part of the flow rather than a separate form.
   ═══════════════════════════════════════════════════════════════ */

export type UploadKind = 'essay' | 'notes';

interface Get {
  label: string;
  icon: ReactNode;
}

const COPY: Record<UploadKind, {
  eyebrow: string;
  title: ReactNode;
  sub: string;
  placeholder: string;
  dropHint: string;
  cta: string;
  ctaEmpty: string;
  skip: string;
  scholar: string;
  bubble: { empty: string; short: string; ready: string; over: string; parsing: string };
  gets: Get[];
}> = {
  essay: {
    eyebrow: 'Your free grade',
    title: <>Let&apos;s grade <span className="text-[#A560E8]">your essay</span></>,
    sub: 'Any draft, however rough. In about a minute you will see the grade it is heading for, with every line marked.',
    placeholder: 'Paste your essay here…',
    dropHint: 'Drop your essay to upload it',
    cta: 'Grade my essay free',
    ctaEmpty: 'Paste or upload your essay',
    skip: "I don't have an essay right now",
    scholar: SCHOLAR.paper,
    bubble: {
      empty: "Paste it in. I'll mark every line.",
      short: 'Keep going, I need at least 50 words.',
      ready: "Looks good. Hit grade when you're ready!",
      over: "That's a long one! Trim it down a little for me.",
      parsing: 'Reading your file…',
    },
    gets: [
      {
        label: 'Predicted grade',
        icon: <span className="text-[15px] font-black text-[#7733B5] dark:text-[#C9A0F0]">B+</span>,
      },
      {
        label: 'Section strengths',
        icon: (
          <span className="flex items-end gap-[3px] h-5" aria-hidden>
            <span className="block w-[5px] h-3 rounded-sm bg-[#C9A0F0]" />
            <span className="block w-[5px] h-5 rounded-sm bg-[#A560E8]" />
            <span className="block w-[5px] h-2 rounded-sm bg-[#D9BFF5]" />
            <span className="block w-[5px] h-4 rounded-sm bg-[#8A48C7]" />
          </span>
        ),
      },
      {
        label: 'Every line marked',
        icon: (
          <span className="flex flex-col gap-[3px]" aria-hidden>
            <span className="block h-[4px] w-5 rounded-full bg-[#58CC02]" />
            <span className="block h-[4px] w-4 rounded-full bg-[#FF9600]" />
            <span className="block h-[4px] w-5 rounded-full bg-[#FF4B4B]" />
          </span>
        ),
      },
    ],
  },
  notes: {
    eyebrow: 'Your free study pack',
    title: <>Turn your notes into a <span className="text-[#A560E8]">study pack</span></>,
    sub: 'Lecture notes, a reading or a study guide. In about a minute you will have a lesson, a quiz and flashcards.',
    placeholder: 'Paste your notes here…',
    dropHint: 'Drop your notes to upload them',
    cta: 'Build my study pack free',
    ctaEmpty: 'Paste or upload your notes',
    skip: "I don't have notes right now",
    scholar: SCHOLAR.laptop,
    bubble: {
      empty: "Drop in your notes. I'll turn them into a lesson and a quiz.",
      short: 'A little more, I need at least 50 words.',
      ready: "Perfect. Let's build your pack!",
      over: 'That is a lot of notes! Trim them down a little for me.',
      parsing: 'Reading your file…',
    },
    gets: [
      {
        label: 'A lesson',
        icon: (
          <svg className="w-5 h-5 text-[#7733B5] dark:text-[#C9A0F0]" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
            <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" />
            <path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5" />
          </svg>
        ),
      },
      {
        label: 'A full quiz',
        icon: (
          <svg className="w-5 h-5 text-[#46A302]" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
            <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
            <path d="M8 12.5l2.6 2.6L16.5 9" />
          </svg>
        ),
      },
      {
        label: 'Flashcards',
        icon: (
          <svg className="w-5 h-5 text-[#D97F00]" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
            <rect x="7" y="7" width="13" height="13" rx="3" />
            <path d="M4 15V6a2 2 0 0 1 2-2h9" />
          </svg>
        ),
      },
    ],
  },
};

const GET_TILE: string[] = [
  'bg-[#F3EAFF] dark:bg-[#A560E8]/20',
  'bg-[#F7F1FD] dark:bg-[#A560E8]/10',
  'bg-white dark:bg-stone-800 border-2 border-[#EDE6F5] dark:border-stone-700',
];
const NOTES_TILE: string[] = [
  'bg-[#F3EAFF] dark:bg-[#A560E8]/20',
  'bg-[#E5F8D0] dark:bg-[#58CC02]/15',
  'bg-[#FFF4E0] dark:bg-[#FF9600]/15',
];

const CITATION_STYLES = [
  { value: 'None', label: 'None' },
  { value: 'APA', label: 'APA' },
  { value: 'MLA', label: 'MLA' },
  { value: 'Harvard', label: 'Harvard' },
  { value: 'Chicago', label: 'Chicago' },
  { value: 'IEEE', label: 'IEEE' },
  { value: 'Vancouver', label: 'Vancouver' },
];

interface UploadStepProps {
  kind: UploadKind;
  text: string;
  onTextChange: (text: string) => void;
  fileName: string | null;
  onFile: (file: File) => void;
  onClearFile: () => void;
  parsing: boolean;
  error: string | null;
  wordCount: number;
  minWords: number;
  /** The most it will take; the meter counts up to this. */
  maxWords: number;
  /** Essay only. */
  citationStyle?: string;
  onCitationStyleChange?: (style: string) => void;
  gradingStyle?: 'us' | 'uk';
  onGradingStyleChange?: (style: 'us' | 'uk') => void;
  freeCredits: number;
  onSubmit: () => void;
  onSkip: () => void;
  onBack?: () => void;
  onLogout?: () => void;
}

export function OnboardingUploadStep({
  kind,
  text,
  onTextChange,
  fileName,
  onFile,
  onClearFile,
  parsing,
  error,
  wordCount,
  minWords,
  maxWords,
  citationStyle,
  onCitationStyleChange,
  gradingStyle,
  onGradingStyleChange,
  freeCredits,
  onSubmit,
  onSkip,
  onBack,
  onLogout,
}: UploadStepProps) {
  const copy = COPY[kind];
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dropActive, setDropActive] = useState(false);
  const notEnough = wordCount < minWords;
  const tooMany = wordCount > maxWords;
  const bubble = parsing
    ? copy.bubble.parsing
    : wordCount === 0
      ? copy.bubble.empty
      : notEnough
        ? copy.bubble.short
        : tooMany
          ? copy.bubble.over
          : copy.bubble.ready;

  const footer = (
    <>
      {error && (
        <div role="alert" className="mb-3 rounded-2xl border-2 border-[#FF4B4B]/30 bg-[#FFE8E8] dark:bg-[#FF4B4B]/10 px-3.5 py-2.5 text-[13px] font-bold leading-snug text-[#D63A3A]">
          {error}
        </div>
      )}
      <PrimaryButton onClick={onSubmit} disabled={parsing || notEnough || tooMany}>
        {parsing
          ? 'Reading your file…'
          : wordCount === 0
            ? copy.ctaEmpty
            : notEnough
              ? `${minWords - wordCount} more ${minWords - wordCount === 1 ? 'word' : 'words'} to go`
              : tooMany
                ? `Cut ${(wordCount - maxWords).toLocaleString()} ${wordCount - maxWords === 1 ? 'word' : 'words'} to continue`
                : copy.cta}
      </PrimaryButton>
      <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-[12px] leading-snug font-bold text-stone-500 dark:text-stone-400">
        <CreditCoin size={15} />
        Uses 1 of your {freeCredits} free credits · no card needed
      </p>
      <button
        type="button"
        onClick={onSkip}
        className="mt-1 w-full py-1.5 text-[13px] font-extrabold text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
      >
        {copy.skip}
      </button>
    </>
  );

  return (
    <FlowShell
      topBar={<FlowTopBar progress={100} onBack={onBack} onLogout={onLogout} credits={freeCredits} />}
      dropHandlers={{
        onDragOver: (e) => { e.preventDefault(); setDropActive(true); },
        onDragLeave: (e) => {
          // Only clear when the pointer leaves the page, not on every
          // child boundary crossing.
          if (e.currentTarget === e.target) setDropActive(false);
        },
        onDrop: (e) => {
          e.preventDefault();
          setDropActive(false);
          const f = e.dataTransfer.files?.[0];
          if (f) onFile(f);
        },
      }}
    >
      <div className="relative z-[1] flex-1 flex flex-col min-h-0">
        <Screen stage={{ src: copy.scholar, bubble }} footer={footer}>
          <div className="lg:hidden flex items-end gap-2.5">
            <img src={copy.scholar} alt="" className="w-16 h-16 shrink-0 object-contain" width="64" height="64" />
            <div key={bubble} className="wso-bubble flex-1 bg-white dark:bg-stone-900 border-2 border-[#E5E5E5] dark:border-stone-700 rounded-[18px] rounded-bl-[4px] px-3.5 py-2.5 text-[14px] leading-snug font-bold text-[#4B4B4B] dark:text-stone-200">
              {bubble}
            </div>
          </div>

          <Eyebrow>
            <span className="inline-flex items-center gap-1.5">
              <CreditCoin size={16} />
              {copy.eyebrow}
            </span>
          </Eyebrow>
          <h1 className="-mt-1.5 text-[26px] sm:text-[30px] lg:text-[34px] leading-[1.1] font-black tracking-tight [text-wrap:balance]">{copy.title}</h1>
          <p className="-mt-1 text-[14.5px] lg:text-[15.5px] leading-relaxed font-semibold text-stone-500 dark:text-stone-400">{copy.sub}</p>

          {/* What comes back — the payoff before the effort. */}
          <div className="grid grid-cols-3 gap-2">
            {copy.gets.map((g, i) => (
              <div
                key={g.label}
                className="wso-card-in flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-2.5 rounded-2xl bg-white/80 dark:bg-stone-900/70 border-2 border-[#EFE6FA] dark:border-stone-700 px-2 py-2.5 sm:px-3 text-center sm:text-left"
                style={{ animationDelay: `${0.1 + i * 0.06}s` }}
              >
                <span className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center ${(kind === 'essay' ? GET_TILE : NOTES_TILE)[i]}`}>
                  {g.icon}
                </span>
                <span className="text-[12px] sm:text-[13px] font-extrabold leading-tight">{g.label}</span>
              </div>
            ))}
          </div>

          {/* The input: paste, type, or drop/upload a file. */}
          <div
            className={`relative rounded-[22px] border-2 border-b-4 transition-colors ${
              dropActive
                ? 'border-dashed border-[#A560E8] bg-[#FBF7FF] dark:bg-[#A560E8]/10'
                : 'border-[#E5E5E5] dark:border-stone-700 bg-white dark:bg-stone-900 focus-within:border-[#A560E8] focus-within:border-b-[#7733B5]'
            }`}
          >
            <label htmlFor={inputId} className="sr-only">{copy.placeholder}</label>
            <textarea
              id={inputId}
              value={text}
              onChange={(e) => onTextChange(e.target.value)}
              disabled={parsing}
              placeholder={`${copy.placeholder}\n\nOr drop a PDF or Word file anywhere on this page.`}
              className="block w-full resize-none rounded-t-[20px] bg-transparent px-4 pt-4 pb-3 min-h-[150px] lg:min-h-[170px] text-[15px] leading-relaxed font-semibold text-[#3C3C3C] dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-600 focus:outline-none disabled:opacity-60"
            />
            <div className="flex items-center justify-between gap-2 border-t-2 border-[#F2ECF8] dark:border-stone-800 px-2.5 py-2">
              {fileName ? (
                <span className="inline-flex min-w-0 items-center gap-1.5 rounded-xl bg-[#F3EAFF] dark:bg-[#A560E8]/15 pl-2.5 pr-1 py-1 text-[12.5px] font-extrabold text-[#7733B5] dark:text-[#C9A0F0]">
                  <FileIcon />
                  <span className="truncate max-w-[9rem] sm:max-w-[14rem]">{fileName}</span>
                  <button
                    type="button"
                    onClick={onClearFile}
                    aria-label="Remove file"
                    className="ml-0.5 w-6 h-6 rounded-lg flex items-center justify-center hover:bg-[#A560E8]/15"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={parsing}
                  className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[12.5px] font-extrabold text-[#7733B5] dark:text-[#C9A0F0] hover:bg-[#F3EAFF] dark:hover:bg-[#A560E8]/15 disabled:opacity-60 transition-colors"
                >
                  {parsing ? (
                    <span className="h-3.5 w-3.5 rounded-full border-2 border-[#A560E8]/30 border-t-[#A560E8] animate-spin" aria-hidden />
                  ) : (
                    <ClipIcon />
                  )}
                  {parsing ? 'Reading your file…' : 'Upload PDF or Word'}
                </button>
              )}
              <WordMeter count={wordCount} min={minWords} max={maxWords} />
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile(f);
                e.target.value = '';
              }}
            />
            {dropActive && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1.5 rounded-[20px] bg-[#F3EAFF]/95 dark:bg-[#A560E8]/25 pointer-events-none">
                <span className="w-12 h-12 rounded-2xl bg-white dark:bg-stone-900 border-2 border-b-4 border-[#D8BDF2] flex items-center justify-center text-[#7733B5]">
                  <UploadIcon />
                </span>
                <p className="text-[14px] font-extrabold text-[#7733B5] dark:text-[#E9DBFF]">{copy.dropHint}</p>
              </div>
            )}
          </div>

          {kind === 'essay' && gradingStyle && onGradingStyleChange && onCitationStyleChange && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="block mb-1.5 text-[11px] font-black uppercase tracking-[0.12em] text-stone-400">Grade format</span>
                <div role="radiogroup" aria-label="Grade format" className="grid grid-cols-2 gap-1 rounded-xl bg-[#F1EAF9] dark:bg-stone-800 p-1">
                  {([
                    { id: 'us' as const, label: 'US', hint: 'A–F' },
                    { id: 'uk' as const, label: 'UK', hint: 'class' },
                  ]).map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      role="radio"
                      aria-checked={gradingStyle === g.id}
                      onClick={() => onGradingStyleChange(g.id)}
                      className={`py-1.5 rounded-lg text-[12.5px] font-extrabold transition-all ${
                        gradingStyle === g.id
                          ? 'bg-white dark:bg-stone-900 text-[#7733B5] dark:text-[#C9A0F0] shadow-[0_2px_0_#E3D3F6] dark:shadow-none'
                          : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
                      }`}
                    >
                      {g.label} <span className="font-bold opacity-70">({g.hint})</span>
                    </button>
                  ))}
                </div>
              </div>
              <label className="block">
                <span className="block mb-1.5 text-[11px] font-black uppercase tracking-[0.12em] text-stone-400">Citation style</span>
                <span className="relative block">
                  <select
                    value={citationStyle ?? 'None'}
                    onChange={(e) => onCitationStyleChange(e.target.value)}
                    className="w-full appearance-none rounded-xl bg-[#F1EAF9] dark:bg-stone-800 pl-3 pr-8 py-[9px] text-[12.5px] font-extrabold text-[#7733B5] dark:text-[#C9A0F0] focus:outline-none focus:ring-2 focus:ring-[#A560E8]/40 cursor-pointer"
                  >
                    {CITATION_STYLES.map((c) => (
                      <option key={c.value} value={c.value}>{c.value === 'None' ? 'None needed' : c.label}</option>
                    ))}
                  </select>
                  <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#7733B5] dark:text-[#C9A0F0]" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" /></svg>
                </span>
              </label>
            </div>
          )}

          <p className="flex items-center gap-1.5 text-[12px] font-bold text-stone-400 dark:text-stone-500">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.6} viewBox="0 0 24 24" aria-hidden>
              <rect x="5" y="11" width="14" height="9" rx="2" />
              <path strokeLinecap="round" d="M8 11V8a4 4 0 0 1 8 0v3" />
            </svg>
            Private to your account · never used to train AI
          </p>
        </Screen>
      </div>
    </FlowShell>
  );
}

/** The wait while the grade (or pack) is made — same look as "Building your plan". */
export function OnboardingWorkingStep({
  kind,
  wordCount,
  steps,
  activeStep,
  onLogout,
}: {
  kind: UploadKind;
  wordCount: number;
  steps: readonly string[];
  activeStep: number;
  onLogout?: () => void;
}) {
  // The last stage holds until the result lands, so never show a full bar.
  const pct = Math.min(92, ((activeStep + 0.6) / steps.length) * 100);
  return (
    <FlowShell topBar={<FlowTopBar progress={100} onLogout={onLogout} />}>
      <div className="relative z-[1] flex-1 flex flex-col items-center justify-center gap-5 px-7 py-10 text-center max-w-md lg:max-w-lg mx-auto w-full">
        <ScholarStage src={SCHOLAR.thinking} size="build" />
        <h1 className="text-[26px] lg:text-[34px] font-black tracking-tight" aria-live="polite">
          {kind === 'essay' ? 'Marking your essay…' : 'Building your study pack…'}
        </h1>
        <p className="-mt-3 text-[15px] lg:text-[16px] font-extrabold text-stone-500 dark:text-stone-400">
          {wordCount.toLocaleString()} words · usually under a minute
        </p>
        <div
          className="relative w-full h-3.5 rounded-full bg-[#E5E5E5] dark:bg-stone-800 overflow-hidden"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pct)}
        >
          <div className="relative h-full rounded-full bg-[#A560E8] transition-all duration-1000 ease-out overflow-hidden" style={{ width: `${pct}%` }}>
            <div className="absolute inset-0 wso-shimmer" aria-hidden />
          </div>
        </div>
        <ul className="w-full flex flex-col gap-3 text-left lg:bg-white/80 lg:dark:bg-stone-900/80 lg:border-2 lg:border-[#EADFF8] lg:dark:border-stone-700 lg:rounded-3xl lg:p-6">
          {steps.map((label, i) => {
            const done = i < activeStep;
            const active = i === activeStep;
            return (
              <li key={label} className="flex items-center gap-3 text-[15px] lg:text-[16px] font-extrabold">
                <span
                  className={`w-[26px] h-[26px] shrink-0 rounded-full flex items-center justify-center transition-colors ${
                    done
                      ? 'bg-[#58CC02]'
                      : active
                        ? 'border-[3px] border-[#A560E8]/25 border-t-[#A560E8] animate-spin'
                        : 'bg-white dark:bg-stone-800 border-2 border-[#E5E5E5] dark:border-stone-600'
                  }`}
                >
                  {done && (
                    <svg className="w-3.5 h-3.5 text-white wso-scale-in" fill="none" stroke="currentColor" strokeWidth={3.6} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                  )}
                </span>
                <span className={done || active ? '' : 'text-stone-400'}>{label}</span>
              </li>
            );
          })}
        </ul>
        <p className="text-[12.5px] font-bold text-stone-400 dark:text-stone-500">Hang tight, don&apos;t close this page.</p>
      </div>
    </FlowShell>
  );
}

/** Counts up to the maximum; the ring fills to the minimum, then turns into a tick. */
function WordMeter({ count, min, max }: { count: number; min: number; max: number }) {
  const ready = count >= min && count <= max;
  const over = count > max;
  const r = 7.5;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, count / min);
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 pr-1 text-[12.5px] font-extrabold tabular-nums ${
        over ? 'text-[#D63A3A]' : ready ? 'text-[#46A302]' : 'text-stone-500 dark:text-stone-400'
      }`}
    >
      {over ? (
        <span className="w-[18px] h-[18px] rounded-full bg-[#FF4B4B] flex items-center justify-center text-white text-[12px] font-black leading-none" aria-hidden>!</span>
      ) : ready ? (
        <span className="w-[18px] h-[18px] rounded-full bg-[#58CC02] flex items-center justify-center" aria-hidden>
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={4} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12.5l4.5 4.5L19 7.5" /></svg>
        </span>
      ) : (
        <svg width="18" height="18" viewBox="0 0 20 20" className="-rotate-90" aria-hidden>
          <circle cx="10" cy="10" r={r} fill="none" stroke="#EDE6F5" strokeWidth="3" />
          <circle
            cx="10"
            cy="10"
            r={r}
            fill="none"
            stroke="#A560E8"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={(1 - pct) * c}
            style={{ transition: 'stroke-dashoffset 0.3s ease' }}
          />
        </svg>
      )}
      {count.toLocaleString()} / {max.toLocaleString()} words
    </span>
  );
}

function ClipIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
      <path d="M21 11.5l-8.6 8.6a5 5 0 0 1-7.1-7.1l8.6-8.6a3.4 3.4 0 0 1 4.8 4.8l-8.6 8.6a1.7 1.7 0 0 1-2.4-2.4l7.9-7.9" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5M9 13h6M9 17h4" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
      <path d="M12 16V4M7 9l5-5 5 5" />
      <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </svg>
  );
}
