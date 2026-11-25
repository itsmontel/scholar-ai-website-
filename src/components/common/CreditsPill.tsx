import { useEffect, useRef, useState, type ReactNode } from 'react';
import CreditCoin from './CreditCoin';
import { trackEvent } from '../../utils/analytics';
import { buyTopUp, confirmTopUpFromUrl, isPaidCreditPlan, openCreditChoice, shortDate, type CreditState } from '../../utils/credits';
import { TOPUP_MONTHS, TOPUP_PACKS, MONTHLY_CREDITS, STANDARD_MONTHLY_PRICE, LIST_MONTHLY_PRICE, LAUNCH_OFFER_ENABLED, WELCOME_DISCOUNT_AT_SIGNUP } from '../../config/pricing';

/**
 * Top-right credit counter + its dropdown. An essay analysis costs 2
 * credits, a study pack or citation search 1. Sells credit top-ups. Shows the free plan's
 * monthly grades (and when they reset), the trial's credits, the paid
 * balance (with rollover), a low/empty state, and the 499 cap.
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
  const [buying, setBuying] = useState<string | null>(null);
  const [topUpNote, setTopUpNote] = useState<{ text: string; tone: 'info' | 'warn' } | null>(null);

  // Back from Stripe after a top-up: add the credits and say so.
  useEffect(() => {
    let alive = true;
    void confirmTopUpFromUrl().then((added) => {
      if (!alive || added == null) return;
      setTopUpNote({ text: `${added} credits added. They last ${TOPUP_MONTHS} months.`, tone: 'info' });
      setOpen(true);
    });
    return () => { alive = false; };
  }, []);

  const buy = async (pack: string) => {
    if (buying) return;
    setBuying(pack);
    setTopUpNote(null);
    trackEvent('upgrade_clicked', { source: 'credit_topup', plan: pack });
    try {
      await buyTopUp(pack);
    } catch (e) {
      setTopUpNote({ text: e instanceof Error ? e.message : 'We could not start checkout. Please try again.', tone: 'warn' });
      setBuying(null);
    }
  };

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
  /** Free plan with a monthly grade allowance. */
  const freeWeek = !paid && !!credits && credits.freeCredits > 0;
  const freeLive = freeWeek && !credits?.freeExpired;
  const freeResets = shortDate(credits?.freeResetsAt ?? credits?.periodEnd ?? null);
  const atCap = paid && !!credits && credits.total >= credits.cap;
  const low = paid && !credits?.isTrial && remaining <= 3;
  const empty = (!paid && !freeLive) || remaining <= 0;
  // Free accounts always see "Get more" (they have at most a few grades);
  // paid accounts only once they are out.
  const showGetMore = empty || (!paid && remaining <= 3);

  const openPaywall = () => {
    setOpen(false);
    if (credits?.isTrial) {
      window.dispatchEvent(new CustomEvent('writescholar-open-paywall', { detail: { force: true, trigger: 'credits_pill' } }));
    } else {
      openCreditChoice({ source: 'credits_pill' });
    }
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
        className={`inline-flex items-center gap-1.5 h-10 sm:h-11 pl-1.5 ${showGetMore ? 'pr-1' : 'pr-3.5'} rounded-full border-2 border-b-4 transition-transform duration-200 hover:scale-[1.03] active:border-b-2 ${pillTone}`}
      >
        <img src="/icons/credits.webp" alt="" width={28} height={28} className="h-7 w-7 shrink-0 object-contain" />
        <span className="text-[16px] font-black tabular-nums text-[#3C3C3C] dark:text-stone-50">{remaining}</span>
        {atCap ? (
          <span className="px-1.5 py-0.5 rounded-full bg-[#A560E8] text-white text-[10px] font-black">MAX</span>
        ) : (
          <span className={`text-[12.5px] font-extrabold ${low ? 'text-[#8F3A0C] dark:text-orange-300' : 'text-[#6B4E00] dark:text-[#F5D670]'}`}>{label}</span>
        )}
        {showGetMore && (
          <span className="ws-get-more ml-1 h-7 sm:h-8 px-3 rounded-full border-2 border-[#7733B5] bg-[#A560E8] text-white text-[12px] font-black flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 2l2.4 6.9H22l-6.1 4.4 2.3 7.1L12 16l-6.2 4.4 2.3-7.1L2 8.9h7.6z" /></svg>
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
                  ? freeResets ? `Resets ${freeResets}` : 'Resets monthly'
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
              {!paid ? (freeWeek && credits ? `of ${credits.total} free grade${credits.total === 1 ? '' : 's'}` : 'credits') : credits?.isTrial ? `of ${credits.total} free` : `of ${credits?.cap ?? 499} max`}
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
                ? `Free credits buy study packs and essay grades. Your first essay report is complete; later free grades show your score, every rubric score and feedback on the first part. Pro opens the rest, the rewrites, one-click fixes and citations.`
                : `You've used your ${credits.total} free credits this month. They reset ${freeResets ?? 'on the 1st'}, or Pro gives you ${MONTHLY_CREDITS.pro} credits a month and every rewrite.`}
            </Note>
          )}

          <Note>
            {paid
              ? `An essay analysis costs 2 credits; a study pack or citation search costs 1. Unused credits roll over every month, up to ${credits?.cap ?? 499}.`
              : 'An essay grade costs 2 credits and a study pack costs 1. Citation searches are part of Pro.'}
          </Note>

          {credits && credits.topUp > 0 && (
            <Note>
              Includes {credits.topUp} top-up credit{credits.topUp === 1 ? '' : 's'}{credits.topUpExpiresAt ? `, good until ${shortDate(credits.topUpExpiresAt) ?? 'next year'}` : ''}. They are used after your {paid ? "plan's" : 'free'} credits.
            </Note>
          )}
          {topUpNote && <Note tone={topUpNote.tone}>{topUpNote.text}</Note>}

          <div className="flex flex-col gap-2">
            <p className="m-0 text-[12.5px] font-black uppercase tracking-[0.08em] text-stone-500 dark:text-stone-400">Need more now?</p>
            <div className="grid grid-cols-2 gap-2">
              {TOPUP_PACKS.map((pack) => (
                <button
                  key={pack.id}
                  type="button"
                  disabled={!!buying}
                  onClick={() => void buy(pack.id)}
                  className="flex min-h-[58px] flex-col items-center justify-center rounded-2xl border-2 border-b-4 border-[#F0C94A] bg-[#FFF8DD] px-2 py-1.5 text-[#3C3C3C] transition-transform hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-2 disabled:opacity-60 dark:border-[#6B5A1C] dark:bg-[#2E2814] dark:text-stone-50"
                >
                  <span className="text-[14.5px] font-black">{buying === pack.id ? 'Opening…' : `${pack.credits} credits`}</span>
                  <span className="text-[12.5px] font-extrabold text-stone-600 dark:text-stone-300">${pack.price}</span>
                </button>
              ))}
            </div>
            <p className="m-0 text-[12px] font-bold leading-snug text-stone-500 dark:text-stone-400">One-off purchase. Top-up credits last {TOPUP_MONTHS} months.</p>
          </div>

          {!paid ? (
            <button type="button" onClick={openPaywall} className="h-12 rounded-2xl bg-[#A560E8] hover:bg-[#7733B5] border-2 border-b-4 border-[#7733B5] text-white text-[14px] font-extrabold uppercase tracking-wide active:border-b-2">
              {WELCOME_DISCOUNT_AT_SIGNUP && freeWeek
                ? 'Get Pro · 50% off month 1'
                : LAUNCH_OFFER_ENABLED
                  ? `Get Pro · $${STANDARD_MONTHLY_PRICE.pro}/mo, not $${LIST_MONTHLY_PRICE.pro}`
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
