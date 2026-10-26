import { useEffect, useRef, useState, type ReactNode } from 'react';
import CreditCoin from './CreditCoin';
import { trackEvent } from '../../utils/analytics';
import { freeDaysLeftLabel, isPaidCreditPlan, shortDate, type CreditState } from '../../utils/credits';
import { MONTHLY_CREDITS, TRIAL_CREDITS, TRIAL_DAYS, WELCOME_DISCOUNT_AT_SIGNUP } from '../../config/pricing';

/**
 * Top-right credit counter + its dropdown. One credit = one essay
 * analysis, study pack or citation search. Shows the free week's
 * credits (and when they expire), the trial's credits, the paid balance
 * (with rollover), a low/empty state, and the 499 cap.
 */
export default function CreditsPill({
  credits,
  loading,
  onNavigate,
}: {
  credits: CreditState | null;
  loading: boolean;
  onNavigate: (page: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (loading && !credits) {
    return <span className="inline-block h-10 sm:h-11 w-[104px] rounded-full bg-[#FFF6DB] dark:bg-stone-800 animate-pulse" aria-hidden />;
  }

  const paid = credits ? isPaidCreditPlan(credits.plan) : false;
  const remaining = credits?.remaining ?? 0;
  /** Never-paid account inside (or just past) its free week. */
  const freeWeek = !paid && !!credits && credits.freeCredits > 0;
  const freeLive = freeWeek && !credits?.freeExpired;
  const atCap = paid && !!credits && credits.total >= credits.cap;
  const low = paid && !credits?.isTrial && remaining <= 3;
  const empty = (!paid && !freeLive) || remaining <= 0;

  const openPaywall = () => {
    setOpen(false);
    window.dispatchEvent(new CustomEvent('writescholar-open-paywall', { detail: { force: true, trigger: 'credits_pill' } }));
  };

  const pillTone = !paid && !(freeLive && remaining > 0)
    ? 'bg-white dark:bg-stone-900 border-[#E5E5E5] dark:border-stone-700'
    : atCap
      ? 'bg-[#F3EAFF] dark:bg-[#A560E8]/15 border-[#A560E8]'
      : low
        ? 'bg-[#FFE9DC] dark:bg-orange-500/15 border-[#F2B48F] dark:border-orange-400/40'
        : 'bg-[#FFF6DB] dark:bg-[#F5B70A]/10 border-[#F3DB93] dark:border-[#F5B70A]/40';

  const label = !paid
    ? freeLive ? 'free' : 'credits'
    : credits?.isTrial
      ? 'free'
      : low
        ? 'left'
        : 'credits';

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => {
          if (!open) trackEvent('credits_pill_open', { plan: credits?.plan ?? 'free', remaining });
          setOpen((o) => !o);
        }}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`${remaining} credits${paid ? '' : ', get credits'}. Open credit details`}
        className={`inline-flex items-center gap-1.5 h-10 sm:h-11 pl-1.5 ${empty ? 'pr-1' : 'pr-3.5'} rounded-full border-2 border-b-4 transition-transform duration-200 hover:scale-[1.03] active:border-b-2 ${pillTone}`}
      >
        <CreditCoin size={26} />
        <span className="text-[16px] font-black tabular-nums text-[#3C3C3C] dark:text-stone-50">{remaining}</span>
        {atCap ? (
          <span className="px-1.5 py-0.5 rounded-full bg-[#A560E8] text-white text-[10px] font-black">MAX</span>
        ) : (
          <span className={`text-[12.5px] font-extrabold ${low ? 'text-[#8F3A0C] dark:text-orange-300' : 'text-[#6B4E00] dark:text-[#F5D670]'}`}>{label}</span>
        )}
        {empty && (
          <span className="ml-1 h-7 sm:h-8 px-2.5 rounded-full bg-[#A560E8] text-white text-[11.5px] font-black flex items-center">
            Get more
          </span>
        )}
      </button>

      {open && (
        <div role="dialog" aria-label="Your credits" className="absolute top-full right-0 mt-2.5 w-[min(92vw,340px)] z-50 rounded-[22px] border-2 border-b-4 border-[#E5E5E5] dark:border-stone-700 bg-white dark:bg-stone-900 shadow-[0_24px_50px_-24px_rgba(60,30,90,0.35)] p-4 flex flex-col gap-3.5 text-[#3C3C3C] dark:text-stone-100" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
          <div className="flex items-center justify-between">
            <p className="text-[16px] font-black">Your credits</p>
            <p className="text-[12px] font-extrabold text-stone-500 dark:text-stone-400">
              {!paid
                ? freeLive && credits
                  ? freeDaysLeftLabel(credits) ?? ''
                  : freeWeek && credits
                    ? `Expired ${shortDate(credits.freeExpiresAt) ?? ''}`.trim()
                    : 'No plan yet'
                : credits?.isTrial
                  ? `Trial ends ${shortDate(credits.periodEnd) ?? 'soon'}`
                  : credits?.isPaused
                    ? 'Paused'
                    : credits?.cancelAtPeriodEnd
                      ? `Plan ends ${shortDate(credits.periodEnd) ?? 'soon'}`
                      : credits && credits.nextTopUp > 0
                        ? `+${credits.nextTopUp} on ${shortDate(credits.periodEnd) ?? 'renewal'}`
                        : ''}
            </p>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-[44px] leading-none font-black tracking-tight tabular-nums">{remaining}</span>
            <span className="text-[14px] font-extrabold text-stone-500 dark:text-stone-400">
              {!paid ? (freeWeek && credits ? `of ${credits.total} free` : 'credits') : credits?.isTrial ? `of ${credits.total} free` : `of ${credits?.cap ?? 499} max`}
            </span>
          </div>

          {freeWeek && credits && (
            <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${Math.max(1, credits.total)}, minmax(0, 1fr))` }} aria-hidden>
              {Array.from({ length: Math.max(1, credits.total) }, (_, i) => (
                <span key={i} className={`h-2.5 rounded-full ${credits.freeExpired || i < credits.used ? 'bg-[#E5E5E5] dark:bg-stone-700' : 'bg-[#F5B70A]'}`} />
              ))}
            </div>
          )}

          {paid && credits && (
            credits.isTrial ? (
              <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${Math.max(1, credits.total)}, minmax(0, 1fr))` }} aria-hidden>
                {Array.from({ length: Math.max(1, credits.total) }, (_, i) => (
                  <span key={i} className={`h-2.5 rounded-full ${i < credits.used ? 'bg-[#E5E5E5] dark:bg-stone-700' : 'bg-[#F5B70A]'}`} />
                ))}
              </div>
            ) : (
              <>
                <div className="relative h-3.5 rounded-full bg-[#E5E5E5] dark:bg-stone-800 overflow-hidden flex" aria-hidden>
                  <span className="bg-[#F5B70A]" style={{ width: `${(Math.min(credits.allowance, remaining) / credits.cap) * 100}%` }} />
                  <span className="bg-[#A560E8]" style={{ width: `${(Math.max(0, remaining - credits.allowance) / credits.cap) * 100}%` }} />
                </div>
                <div className="flex flex-col gap-1.5 text-[13px] font-bold text-[#4B4B4B] dark:text-stone-300">
                  <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-[3px] bg-[#F5B70A]" aria-hidden /><span className="flex-1">This month&apos;s credits</span><span className="font-black tabular-nums">{credits.allowance}</span></div>
                  {credits.rollover > 0 && (
                    <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-[3px] bg-[#A560E8]" aria-hidden /><span className="flex-1">Rolled over</span><span className="font-black tabular-nums">{credits.rollover}</span></div>
                  )}
                  <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-[3px] bg-[#E5E5E5] dark:bg-stone-700" aria-hidden /><span className="flex-1">Used so far</span><span className="font-black tabular-nums">{credits.used}</span></div>
                </div>
              </>
            )
          )}

          {paid && credits?.isPaused && (
            <Note>Paused: no new credits until you resume. You keep all {remaining} you have.</Note>
          )}
          {paid && credits?.cancelAtPeriodEnd && remaining > 0 && (
            <Note tone="warn">Your plan ends on {shortDate(credits.periodEnd) ?? 'your renewal date'}. Your {remaining} credits reset to 0 then.</Note>
          )}
          {paid && credits && !credits.cancelAtPeriodEnd && !credits.isPaused && credits.wouldLoseAtRenewal > 0 && (
            <Note tone="warn">You&apos;re near the {credits.cap} cap. Use {credits.wouldLoseAtRenewal} credits before {shortDate(credits.periodEnd) ?? 'your renewal'} or they won&apos;t carry over.</Note>
          )}

          {freeLive && credits && (
            <Note tone={remaining <= 0 ? 'warn' : 'info'}>
              {remaining > 0
                ? `Use them by ${shortDate(credits.freeExpiresAt) ?? 'the end of the week'} or they expire. Free grades show your grade and every highlight; Pro opens the comments, section scores and fixes.`
                : `You've used your ${credits.total} free credits. Pro gives you ${MONTHLY_CREDITS.pro} a month and opens every comment and fix.`}
            </Note>
          )}
          {freeWeek && credits?.freeExpired && (
            <Note tone="warn">Your free credits expired on {shortDate(credits.freeExpiresAt) ?? 'day 7'}. Pro gives you {MONTHLY_CREDITS.pro} a month, and anything you don&apos;t use rolls over.</Note>
          )}

          <Note>
            1 credit = 1 essay analysis, study pack or citation search.
            {paid ? ` Unused credits roll over every month, up to ${credits?.cap ?? 499}.` : ''}
          </Note>

          {!paid ? (
            <button type="button" onClick={openPaywall} className="h-12 rounded-2xl bg-[#A560E8] hover:bg-[#7733B5] border-2 border-b-4 border-[#7733B5] text-white text-[14px] font-extrabold uppercase tracking-wide active:border-b-2">
              {TRIAL_DAYS > 0
                ? `Start free trial · ${TRIAL_CREDITS} credits`
                : WELCOME_DISCOUNT_AT_SIGNUP && freeWeek
                  ? 'Get Pro · 50% off month 1'
                  : `Get ${MONTHLY_CREDITS.pro} credits a month`}
            </button>
          ) : credits?.isTrial ? (
            <button type="button" onClick={() => { setOpen(false); onNavigate('billing'); }} className="h-12 rounded-2xl bg-[#A560E8] hover:bg-[#7733B5] border-2 border-b-4 border-[#7733B5] text-white text-[14px] font-extrabold uppercase tracking-wide active:border-b-2">
              {MONTHLY_CREDITS[credits.plan] ?? MONTHLY_CREDITS.pro} credits after your trial
            </button>
          ) : (
            <button type="button" onClick={() => { setOpen(false); onNavigate('pricing'); }} className="h-12 rounded-2xl bg-[#A560E8] hover:bg-[#7733B5] border-2 border-b-4 border-[#7733B5] text-white text-[14px] font-extrabold uppercase tracking-wide active:border-b-2">
              {credits?.plan === 'premium' ? 'Manage plan' : `Get ${MONTHLY_CREDITS.premium} a month with Premium`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Note({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'warn' }) {
  return (
    <p className={`px-3 py-2.5 rounded-xl text-[12.5px] leading-snug font-bold ${
      tone === 'warn'
        ? 'bg-[#FFE9DC] dark:bg-orange-500/15 text-[#8F3A0C] dark:text-orange-200'
        : 'bg-[#F3EAFF] dark:bg-[#A560E8]/15 text-[#4B4B4B] dark:text-stone-300'
    }`}>
      {children}
    </p>
  );
}
