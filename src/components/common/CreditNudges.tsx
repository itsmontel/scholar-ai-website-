import { useState } from 'react';
import { CREDIT_COSTS, FIRST_MONTH_PRICE, MONTHLY_CREDITS, STANDARD_MONTHLY_PRICE } from '../../config/pricing';
import { trackEvent } from '../../utils/analytics';
import { isPaidCreditPlan, openCreditChoice, shortDate, startPlanCheckout, useCreditState, type CreditState } from '../../utils/credits';
import { BTN_GREEN, BTN_PURPLE, BTN_WHITE, FONT } from '../landing/webStyle';

const today = () => new Date().toISOString().slice(0, 10);
const readDay = (key: string) => { try { return localStorage.getItem(key) === today(); } catch { return false; } };
const writeDay = (key: string) => { try { localStorage.setItem(key, today()); } catch { /* ignore */ } };

const LOW = 3;
const STRIP_KEY = 'ws_credit_strip_hidden';
const PREMIUM_KEY = 'ws_premium_card_hidden';

/** Free and paid accounts that are not on a trial, with a known balance. */
const eligible = (c: CreditState | null): c is CreditState => !!c && !c.isTrial && !c.isPaused;

/** Credits of the next paid step up: what the line says, from real plan numbers. */
const upgradeLine = (c: CreditState) =>
  c.plan === 'premium'
    ? 'Top up to keep going.'
    : isPaidCreditPlan(c.plan)
      ? `Premium gives you ${MONTHLY_CREDITS.premium} a month instead of ${MONTHLY_CREDITS.pro}.`
      : `An essay grade uses ${c.analysisCost}, a study pack ${CREDIT_COSTS.studyPack}.`;

/**
 * One line at the top of the home screen when credits run low: at most once a
 * day, gone for the day once closed. Free accounts are offered Pro, Pro accounts Premium.
 */
export function LowCreditsStrip() {
  const credits = useCreditState();
  const [hidden, setHidden] = useState(() => readDay(STRIP_KEY));
  const [busy, setBusy] = useState(false);
  if (hidden || !eligible(credits) || credits.remaining > LOW) return null;
  const paid = isPaidCreditPlan(credits.plan);
  const back = shortDate(paid ? credits.periodEnd : credits.freeResetsAt ?? credits.periodEnd);
  const out = credits.remaining <= 0;
  const track = (what: string) => trackEvent('credit_nudge_click', { where: 'strip', how: what, left: credits.remaining });
  if (!hidden) trackOnce('strip', credits.remaining);

  return (
    <div role="status" style={FONT} className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-[20px] border-2 border-[#FFE08A] bg-[#FFF8E1] px-4 py-3.5 sm:px-5">
      <img src="/icons/credits.webp" alt="" width={44} height={44} className="h-11 w-11 shrink-0 object-contain" />
      <div className="min-w-0 flex-1 basis-[240px]">
        <p className="m-0 text-[17px] font-black text-[#1C1917]">{out ? 'You are out of credits' : `${credits.remaining} credit${credits.remaining === 1 ? '' : 's'} left${paid ? '' : ' this month'}`}</p>
        <p className="m-0 mt-0.5 text-[14.5px] font-bold text-[#57534E]">{upgradeLine(credits)}{back ? ` ${paid ? 'Your credits arrive' : 'Free credits come back'} on ${back}.` : ''}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {credits.plan === 'premium' ? null : (
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              track(paid ? 'premium' : 'pro');
              setBusy(true);
              try { await startPlanCheckout(paid ? 'premium' : 'pro', !paid); } catch { setBusy(false); openCreditChoice({ source: 'strip' }); }
            }}
            className={`${paid ? BTN_PURPLE : BTN_GREEN} min-h-[48px] rounded-[14px] px-4 text-[15.5px]`}
          >
            {paid ? 'See Premium' : `Go Pro, $${FIRST_MONTH_PRICE.pro} first month`}
          </button>
        )}
        <button type="button" onClick={() => { track('top_up'); openCreditChoice({ source: 'strip' }); }} className={`${BTN_WHITE} min-h-[48px] rounded-[14px] px-4 text-[15.5px]`}>Top up</button>
        <button type="button" aria-label="Hide for today" onClick={() => { writeDay(STRIP_KEY); setHidden(true); trackEvent('credit_nudge_dismiss', { where: 'strip' }); }} className="flex h-11 w-11 items-center justify-center rounded-full text-[#57534E] hover:bg-[#FFEFB8]">
          <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>
    </div>
  );
}

const seen = new Set<string>();
function trackOnce(where: string, left: number) {
  if (seen.has(where)) return;
  seen.add(where);
  trackEvent('credit_nudge_view', { where, left });
}

/**
 * Right under a finished result, when credits are nearly gone. People pay most
 * readily straight after something worked. Never shown to Premium (nothing to offer but a top-up).
 */
export function ResultUpsell({ source }: { source: string }) {
  const credits = useCreditState();
  const [busy, setBusy] = useState(false);
  if (!eligible(credits) || credits.remaining > 2) return null;
  const paid = isPaidCreditPlan(credits.plan);
  const need = credits.analysisCost;
  const left = credits.remaining;
  trackOnce(`result_${source}`, left);
  const plan = paid ? 'premium' : 'pro';

  return (
    <section style={FONT} className="rounded-[24px] bg-[#7733B5] p-5 text-white sm:p-7" aria-label="Get more credits">
      <div className="flex items-center gap-4">
        <img src="/icons/credits.webp" alt="" width={56} height={56} className="h-14 w-14 shrink-0 object-contain" />
        <div className="min-w-0">
          <h2 className="m-0 text-[22px] font-black leading-tight sm:text-[26px]">{left <= 0 ? 'That was your last credit.' : `${left} credit${left === 1 ? '' : 's'} left.`} Grading it again needs {need}.</h2>
          <p className="m-0 mt-1 text-[15.5px] font-bold text-[#EBDDFB]">Make the fixes, then check they worked. Pick what suits you.</p>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {credits.plan === 'premium' ? null : (
          <div className="flex flex-col gap-2 rounded-[20px] border-[3px] border-[#FFC800] bg-white p-5 text-[#1C1917]">
            <span className="text-[20px] font-black">{paid ? 'Premium' : 'Pro'}</span>
            <p className="m-0 text-[15px] font-extrabold text-[#44403C]">{MONTHLY_CREDITS[plan]} credits every month{paid ? '' : ', unused ones roll over. Full reports, rewrites and one-click fixes'}.</p>
            <p className="m-0 text-[24px] font-black">${paid ? STANDARD_MONTHLY_PRICE.premium : FIRST_MONTH_PRICE.pro} <span className="text-[15px] font-extrabold text-[#57534E]">{paid ? 'a month' : `first month, then $${STANDARD_MONTHLY_PRICE.pro}`}</span></p>
            <button type="button" disabled={busy} onClick={async () => { trackEvent('credit_nudge_click', { where: `result_${source}`, how: plan }); setBusy(true); try { await startPlanCheckout(plan, !paid); } catch { setBusy(false); openCreditChoice({ source: `result_${source}`, need }); } }} className={`${BTN_GREEN} min-h-[54px] text-[17px]`}>{busy ? 'Opening checkout…' : paid ? 'See Premium' : 'Go Pro'}</button>
          </div>
        )}
        <div className="flex flex-col gap-2 rounded-[20px] bg-white p-5 text-[#1C1917]">
          <span className="text-[20px] font-black">Just top up</span>
          <p className="m-0 text-[15px] font-extrabold text-[#44403C]">25 credits, no subscription. They last 12 months.</p>
          <p className="m-0 text-[24px] font-black">$7.99 <span className="text-[15px] font-extrabold text-[#57534E]">once</span></p>
          <button type="button" onClick={() => { trackEvent('credit_nudge_click', { where: `result_${source}`, how: 'top_up' }); openCreditChoice({ source: `result_${source}`, need }); }} className={`${BTN_WHITE} min-h-[54px] text-[17px]`}>Buy 25 credits</button>
        </div>
      </div>
    </section>
  );
}

/** The cost shown on an action: "Uses 2 of your 3 credits. 1 left after.", or the way to get more when short. */
export function CostLine({ kind, source, className = '' }: { kind: 'analysis' | 'pack'; source: string; className?: string }) {
  const credits = useCreditState();
  if (!eligible(credits)) return null;
  const cost = kind === 'analysis' ? credits.analysisCost : CREDIT_COSTS.studyPack;
  const left = credits.remaining;
  const short = left < cost;
  return (
    <p className={`m-0 text-[14px] font-extrabold ${short ? 'text-[#8F3A0C]' : 'text-[#57534E]'} ${className}`} style={FONT}>
      {short ? (
        <>
          This uses {cost}. You have {left}.{' '}
          <button type="button" onClick={() => { trackEvent('credit_nudge_click', { where: source, how: 'cost_line' }); openCreditChoice({ source, need: cost }); }} className="font-black text-[#7733B5] underline">Top up or go Pro</button>
        </>
      ) : (
        <>Uses {cost} of your {left} credits. {left - cost === 0 ? 'This is your last.' : `${left - cost} left after.`}</>
      )}
    </p>
  );
}

/**
 * For Pro accounts that bought a top-up in each of the last two months: the
 * honest comparison with Premium, once, on the billing page. Never a pop-up.
 */
export function PremiumSavingsCard() {
  const credits = useCreditState();
  const [hidden, setHidden] = useState(() => readDay(PREMIUM_KEY));
  const [busy, setBusy] = useState(false);
  if (hidden || !eligible(credits) || credits.plan !== 'pro' || credits.topUpMonths < 2) return null;
  trackOnce('premium_card', credits.remaining);
  const extra = MONTHLY_CREDITS.premium - MONTHLY_CREDITS.pro;
  const more = (STANDARD_MONTHLY_PRICE.premium - STANDARD_MONTHLY_PRICE.pro).toFixed(2);
  return (
    <section style={FONT} className="rounded-[24px] border-[3px] border-[#FFC800] bg-[#FFFDF3] p-5 text-[#1C1917] sm:p-6">
      <div className="flex items-start gap-4">
        <img src="/icons/pro.webp" alt="" width={56} height={56} className="h-14 w-14 shrink-0 object-contain" />
        <div className="min-w-0">
          <h2 className="m-0 text-[22px] font-black leading-tight">You bought extra credits two months running</h2>
          <p className="m-0 mt-1 text-[15.5px] font-bold text-[#57534E]">Premium gives you {MONTHLY_CREDITS.premium} credits a month, {extra} more than Pro, for ${more} more. It also lifts your essay writer to 250 outlines and 1,000 writing helps. Check it against what you spent on top-ups.</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" disabled={busy} onClick={async () => { trackEvent('credit_nudge_click', { where: 'premium_card', how: 'premium' }); setBusy(true); try { await startPlanCheckout('premium', false); } catch { setBusy(false); } }} className={`${BTN_GREEN} min-h-[52px] rounded-2xl px-6 text-[16.5px]`}>{busy ? 'Opening billing…' : 'Switch to Premium'}</button>
        <button type="button" onClick={() => { writeDay(PREMIUM_KEY); setHidden(true); trackEvent('credit_nudge_dismiss', { where: 'premium_card' }); }} className={`${BTN_WHITE} min-h-[52px] rounded-2xl px-5 text-[16.5px]`}>Keep Pro</button>
      </div>
    </section>
  );
}
