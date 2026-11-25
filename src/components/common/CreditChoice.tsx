import { useEffect, useState } from 'react';
import { FIRST_MONTH_PRICE, MONTHLY_CREDITS, STANDARD_MONTHLY_PRICE, TOPUP_MONTHS, TOPUP_PACKS } from '../../config/pricing';
import { trackEvent } from '../../utils/analytics';
import { buyTopUp, CREDIT_CHOICE_EVENT, isPaidCreditPlan, shortDate, startPlanCheckout, useCreditState } from '../../utils/credits';
import { BTN_GREEN, BTN_WHITE, FONT } from '../landing/webStyle';

interface Detail { need?: number; source: string; heading?: string }

const per = (price: number, credits: number) => `${Math.round((price / credits) * 100)}¢`;

/**
 * "You are out of credits" and "get more": the top-up and plan choice with the
 * price per credit, so the plan reads as the better deal. Opened from anywhere
 * with openCreditChoice(); mounted once in the app.
 */
export default function CreditChoice() {
  const credits = useCreditState();
  const [open, setOpen] = useState<Detail | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const on = (e: Event) => { setOpen((e as CustomEvent<Detail>).detail ?? { source: 'unknown' }); setError(''); };
    window.addEventListener(CREDIT_CHOICE_EVENT, on);
    return () => window.removeEventListener(CREDIT_CHOICE_EVENT, on);
  }, []);
  useEffect(() => {
    if (!open) return;
    trackEvent('credit_choice_view', { source: open.source, left: credits?.remaining ?? -1 });
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;
  const plan = (credits?.plan ?? 'free').toLowerCase();
  const paid = isPaidCreditPlan(plan);
  const premium = plan === 'premium';
  const left = credits?.remaining ?? 0;
  const empty = left <= 0 || (open.need != null && left < open.need);
  const back = shortDate(paid ? credits?.periodEnd ?? null : credits?.freeResetsAt ?? credits?.periodEnd ?? null);
  const small = TOPUP_PACKS[0];
  const large = TOPUP_PACKS[1];

  const go = async (key: string, fn: () => Promise<void>) => {
    setBusy(key); setError('');
    trackEvent('upgrade_clicked', { source: `credit_choice_${open.source}`, plan: key });
    try { await fn(); } catch (e) { setBusy(null); setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.'); }
  };

  const card = (hi: boolean) => `flex flex-col gap-2 rounded-[20px] p-5 ${hi ? 'border-[3px] border-[#FFC800] bg-[#FFFDF3]' : 'border-2 border-[#E7E5E4] bg-white'}`;
  const topUp = (pack: typeof small | typeof large, name: string, note: string) => (
    <div className={card(false)}>
      <span className="text-[20px] font-black">{name}</span>
      <p className="m-0 text-[30px] font-black leading-none">${pack.price}<span className="text-[14px] font-extrabold text-[#57534E]"> once</span></p>
      <p className="m-0 text-[15px] font-black text-[#2F6B00]">{pack.credits} credits</p>
      <p className="m-0 text-[14px] font-extrabold text-[#57534E]">About {per(pack.price, pack.credits)} a credit. Lasts {TOPUP_MONTHS} months.</p>
      <p className="m-0 flex-1 text-[14px] font-bold text-[#44403C]">{note}</p>
      <button type="button" disabled={!!busy} onClick={() => go(pack.id, () => buyTopUp(pack.id))} className={`${BTN_WHITE} min-h-[52px] text-[16.5px]`}>{busy === pack.id ? 'Opening checkout…' : `Buy ${pack.credits} credits`}</button>
    </div>
  );
  const planCard = (id: 'pro' | 'premium', hi: boolean, badge: string, note: string, cta: string) => (
    <div className={card(hi)}>
      <div className="flex min-h-[28px] items-center justify-between">
        <span className="text-[20px] font-black">{id === 'pro' ? 'Pro' : 'Premium'}</span>
        {badge && <span className="rounded-full bg-[#FFC800] px-2.5 py-1 text-[12.5px] font-black text-[#3A2A00]">{badge}</span>}
      </div>
      <p className="m-0 text-[30px] font-black leading-none">${paid ? STANDARD_MONTHLY_PRICE[id] : FIRST_MONTH_PRICE[id]}<span className="text-[14px] font-extrabold text-[#57534E]"> {paid ? 'a month' : `first month, then $${STANDARD_MONTHLY_PRICE[id]}`}</span></p>
      <p className="m-0 text-[15px] font-black text-[#2F6B00]">{MONTHLY_CREDITS[id]} credits a month</p>
      <p className="m-0 text-[14px] font-extrabold text-[#57534E]">About {per(STANDARD_MONTHLY_PRICE[id], MONTHLY_CREDITS[id])} a credit{paid ? ', from today' : ' after the first month'}.</p>
      <p className="m-0 flex-1 text-[14px] font-bold text-[#44403C]">{note}</p>
      <button type="button" disabled={!!busy} onClick={() => go(id, () => startPlanCheckout(id, !paid))} className={`${hi ? BTN_GREEN : BTN_WHITE} min-h-[52px] text-[16.5px]`}>{busy === id ? 'Opening checkout…' : cta}</button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[250] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="credit-choice-title" style={FONT}>
      <div className="absolute inset-0 bg-[#2A1540]/70" onClick={() => setOpen(null)} aria-hidden />
      <div className="relative flex max-h-[94dvh] w-full max-w-[1000px] flex-col gap-5 overflow-y-auto rounded-t-[28px] bg-white p-5 text-[#1C1917] sm:rounded-[28px] sm:p-8">
        <div className="flex items-center gap-4">
          <img src="/icons/credits.webp" alt="" width={56} height={56} className="h-14 w-14 shrink-0 object-contain" />
          <div className="min-w-0 flex-1">
            <h2 id="credit-choice-title" className="m-0 text-[24px] font-black leading-tight sm:text-[28px]">{open.heading ?? (empty ? (paid ? 'You have used your credits for this period' : 'You are out of credits for now') : `You have ${left} credit${left === 1 ? '' : 's'} left`)}</h2>
            <p className="m-0 mt-1 text-[15.5px] font-bold text-[#57534E]">{open.need ? `This needs ${open.need}. ` : ''}Whatever you were working on is saved, so nothing is lost.</p>
          </div>
          <button type="button" onClick={() => setOpen(null)} aria-label="Close" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#57534E] hover:bg-[#F3EAFF]">
            <svg aria-hidden width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
          {paid ? (
            <>
              {topUp(small, 'Top up', 'Enough to finish this week. Added straight away.')}
              {topUp(large, 'Bigger top up', 'For a busy stretch before your plan renews.')}
              {premium ? null : planCard('premium', true, 'Most credits', 'Twice the credits of Pro every month, and 250 outlines. Switch any time.', 'Switch to Premium')}
            </>
          ) : (
            <>
              {topUp(small, 'Top up', 'No subscription. Good for one essay you need now.')}
              {planCard('pro', true, 'Best value', 'Full reports, rewrites, one-click fixes. Unused credits roll over.', 'Go Pro')}
              {planCard('premium', false, '', 'For finals and dissertations. 250 outlines and 1,000 writing helps.', 'Go Premium')}
            </>
          )}
        </div>
        {error && <p role="alert" className="m-0 text-[14.5px] font-extrabold text-[#C2410C]">{error}</p>}
        <div className="flex items-center justify-between gap-3">
          <p className="m-0 text-[14.5px] font-extrabold text-[#57534E]">{back ? (paid ? `Or wait: your credits arrive on ${back}.` : `Or wait: free credits come back on ${back}.`) : ''}</p>
          <button type="button" onClick={() => setOpen(null)} className="min-h-[44px] text-[14.5px] font-black text-[#57534E] underline">Not now</button>
        </div>
      </div>
    </div>
  );
}
