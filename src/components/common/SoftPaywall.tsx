import { useState, useEffect, useRef } from 'react';
import { CHECKOUT_FROM_TUTORIAL_PAYWALL_KEY, LAST_TUTORIAL_CHECKOUT_PLAN_KEY } from '../../constants/paywallSession';

/* ═══════════════════════════════════════════════════════════════
   SoftPaywall — Duolingo-style upsell modal.

   Three branches:
   1. showLastChance — compact "Last chance" popup after the user
      tries to dismiss the soft paywall.
   2. hard — blocking modal after the activation tutorial; sticky
      CTA at the bottom, no dismiss button.
   3. default soft — full pitch with feature checklist.

   All three share Duolingo design tokens:
   - border-2 border-b-4 cards
   - solid hex colors (#58CC02 green, #A560E8 purple, #FF9600 orange, etc.)
   - Nunito heading font
   - mascot WEBP gifs (no React mascot component)
   - active:border-b-2 active:translate-y-0.5 button press
   ═══════════════════════════════════════════════════════════════ */

interface SoftPaywallProps {
  userName: string;
  onStartTrial: () => void;
  onDismiss: () => void;
  onNavigate?: (page: string) => void;
  /** After activation tutorial: stronger "you saw the product" framing */
  variant?: 'default' | 'postTutorial';
  /**
   * Blocking overlay: no backdrop click or corner X to dismiss (user uses CTA or "Maybe later").
   * Use after the interactive tour so the paywall is the focus, not a separate pricing page.
   */
  hard?: boolean;
  /**
   * When set, overrides GET /subscriptions/trial-eligibility for "7-day trial" copy and checkout trial length.
   * Omit to fetch eligibility inside this component (default).
   */
  canStartFreeTrial?: boolean | null;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const FEATURES = [
  { text: '99 combined analyses, study packs & citations/mo', icon: '📝', color: '#A560E8' },
  { text: 'Unlimited Focus Mode sites: block distractions until you study', icon: '🔒', color: '#1CB0F6' },
  { text: 'Full study tools: quiz, flashcards, crossword, Crater Blast & Word Tower', icon: '🎯', color: '#FF9600' },
  { text: 'Summarise unlimited research papers', icon: '📚', color: '#58CC02' },
  { text: 'Export to PDF & Word', icon: '📄', color: '#FF4B4B' },
  { text: 'Upload full dissertations and long papers', icon: '⚡', color: '#FF9600' },
];

const PREMIUM_FEATURES = [
  { text: 'Everything in Pro, with higher monthly limits', icon: '✨', color: '#FF9600' },
  { text: '499 combined analyses, study packs & citations/mo', icon: '📝', color: '#A560E8' },
  { text: 'Summarise unlimited research papers', icon: '📚', color: '#58CC02' },
  { text: '1GB document library storage (100MB max per upload)', icon: '💾', color: '#1CB0F6' },
  { text: 'Unlimited Focus Mode; full quiz, flashcards & study tools', icon: '🎯', color: '#FF9600' },
  { text: 'Export PDF & Word; Apply WriteScholar revisions', icon: '📄', color: '#FF4B4B' },
];

const SOCIAL_PROOF = [
  'Join 50k+ students already using Pro',
  'Average GPA improvement: +0.4 in the first semester',
  '#1 rated AI study platform by students',
];

const TRIAL_DAYS = 7;
const PRO_MONTHLY = '$19.99';
const PREMIUM_MONTHLY = '$39.99';

const SoftPaywall = ({
  userName,
  onStartTrial,
  onDismiss,
  onNavigate,
  variant = 'default',
  hard = false,
  canStartFreeTrial: canStartFreeTrialProp,
}: SoftPaywallProps) => {
  const [checkoutPlan, setCheckoutPlan] = useState<'pro' | 'premium'>('pro');
  const [fetchedTrialEligible, setFetchedTrialEligible] = useState<boolean | null>(null);
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [socialIndex, setSocialIndex] = useState(0);
  const [checkedFeatures, setCheckedFeatures] = useState<number[]>([]);
  const [showLastChance, setShowLastChance] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  useEffect(() => {
    if (canStartFreeTrialProp !== undefined && canStartFreeTrialProp !== null) return;
    let cancelled = false;
    (async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          if (!cancelled) setFetchedTrialEligible(false);
          return;
        }
        const res = await fetch(`${API_URL}/subscriptions/trial-eligibility`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          setFetchedTrialEligible(data.trialEligible === true);
        } else {
          setFetchedTrialEligible(false);
        }
      } catch {
        if (!cancelled) setFetchedTrialEligible(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canStartFreeTrialProp]);

  const showTrial =
    canStartFreeTrialProp !== undefined && canStartFreeTrialProp !== null
      ? canStartFreeTrialProp === true
      : fetchedTrialEligible === true;

  useEffect(() => {
    if (hard) setShowLastChance(false);
  }, [hard]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSocialIndex(i => (i + 1) % SOCIAL_PROOF.length);
    }, 3500);
    return () => clearInterval(intervalRef.current);
  }, []);

  const monthlyPrice = checkoutPlan === 'premium' ? PREMIUM_MONTHLY : PRO_MONTHLY;
  const planName = checkoutPlan === 'premium' ? 'Premium' : 'Pro';
  const hardPaywallFeatures = checkoutPlan === 'premium' ? PREMIUM_FEATURES : FEATURES;
  const planAccent = checkoutPlan === 'premium'
    ? { color: '#FF9600', border: '#D97F00', bg: '#FFF4E0' }
    : { color: '#A560E8', border: '#8A48C7', bg: '#F3EAFF' };

  useEffect(() => {
    if (!hard) return;
    const list = checkoutPlan === 'premium' ? PREMIUM_FEATURES : FEATURES;
    setCheckedFeatures(list.map((_, i) => i));
  }, [hard, checkoutPlan]);

  useEffect(() => {
    if (hard) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    FEATURES.forEach((_, i) => {
      timers.push(setTimeout(() => setCheckedFeatures(prev => [...prev, i]), 400 + i * 120));
    });
    return () => timers.forEach(clearTimeout);
  }, [hard]);

  const handleDismiss = () => {
    if (hard) return;
    if (!showLastChance) {
      setShowLastChance(true);
      return;
    }
    setExiting(true);
    setTimeout(onDismiss, 350);
  };

  const handleStartTrial = async (promoCode?: string, planType: 'pro' | 'premium' = 'pro') => {
    const code = typeof promoCode === 'string' ? promoCode : undefined;

    setCheckoutError(null);
    setIsCheckoutLoading(true);
    onStartTrial();

    try {
      const token = localStorage.getItem('authToken');
      const successUrl = `${window.location.origin}/dashboard?payment=success`;
      const cancelUrl = `${window.location.origin}/dashboard?payment=cancelled`;

      const res = await fetch(`${API_URL}/subscriptions/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          planType,
          billingCycle: 'monthly',
          successUrl,
          cancelUrl,
          trialPeriodDays: showTrial ? TRIAL_DAYS : 0,
          ...(code ? { promoCode: code } : {}),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create checkout session');

      const url = data?.data?.checkoutUrl;
      if (url) {
        if (hard || variant === 'postTutorial') {
          try {
            sessionStorage.setItem(CHECKOUT_FROM_TUTORIAL_PAYWALL_KEY, '1');
            sessionStorage.setItem(LAST_TUTORIAL_CHECKOUT_PLAN_KEY, planType);
          } catch {
            /* ignore */
          }
        }
        window.location.href = url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to start checkout';
      setCheckoutError(msg);
      setIsCheckoutLoading(false);
    }
  };

  const startPrimaryCheckout = () => {
    void handleStartTrial(undefined, checkoutPlan);
  };

  const firstName = userName?.split(' ')[0] || 'there';

  /* ─── Reusable Duolingo plan toggle ─── */
  const PlanToggle = () => (
    <div
      className="rounded-2xl border-2 border-b-4 border-[#E5E5E5] dark:border-stone-700 p-1 flex gap-1.5 bg-[#F7F7F7] dark:bg-stone-800/60"
      role="group"
      aria-label="Choose Pro or Premium"
    >
      <button
        type="button"
        onClick={() => setCheckoutPlan('pro')}
        className={`flex-1 min-w-0 rounded-xl px-3 py-2.5 text-left transition-all border-2 ${
          checkoutPlan === 'pro'
            ? 'bg-white dark:bg-stone-900 border-[#A560E8]'
            : 'border-transparent hover:bg-white/60 dark:hover:bg-stone-700/40'
        }`}
      >
        <div className="text-sm font-extrabold text-[#3C3C3C] dark:text-stone-100">Pro</div>
        <div className="text-[10px] font-bold text-stone-500 dark:text-stone-400">{PRO_MONTHLY}/mo</div>
      </button>
      <button
        type="button"
        onClick={() => setCheckoutPlan('premium')}
        className={`flex-1 min-w-0 rounded-xl px-3 py-2.5 text-left transition-all border-2 ${
          checkoutPlan === 'premium'
            ? 'bg-white dark:bg-stone-900 border-[#FF9600]'
            : 'border-transparent hover:bg-white/60 dark:hover:bg-stone-700/40'
        }`}
      >
        <div className="text-sm font-extrabold text-[#3C3C3C] dark:text-stone-100">Premium</div>
        <div className="text-[10px] font-bold text-stone-500 dark:text-stone-400">{PREMIUM_MONTHLY}/mo</div>
      </button>
    </div>
  );

  /* ─── The shared green CTA button ─── */
  const PrimaryCta = () => (
    <button
      type="button"
      onClick={startPrimaryCheckout}
      disabled={isCheckoutLoading}
      className="w-full py-4 rounded-2xl bg-[#58CC02] text-white font-extrabold text-base uppercase tracking-wide border-2 border-b-4 border-[#46A302] hover:bg-[#46A302] active:border-b-2 active:translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg"
    >
      {isCheckoutLoading ? (
        <>
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Opening checkout…
        </>
      ) : (
        <>
          {showTrial ? `Start my ${TRIAL_DAYS}-day free trial` : `Upgrade to ${planName}`}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </>
      )}
    </button>
  );

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center p-3 sm:p-5 ${
        hard ? 'z-[250]' : 'z-[110]'
      } ${exiting ? 'animate-pwOut' : visible ? 'animate-pwIn' : 'opacity-0'}`}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 backdrop-blur-sm ${hard ? 'bg-black/60' : 'bg-black/50'}`}
        onClick={hard ? undefined : handleDismiss}
        aria-hidden="true"
      />

      {/* Modal shell — Duolingo card with thick green top accent.
          Always flex-col + overflow-hidden so each branch can pin its
          primary CTA in a sticky footer (no scroll-to-button needed). */}
      <div className="relative w-full max-w-3xl sm:max-w-[52rem] rounded-2xl bg-white dark:bg-stone-900 shadow-2xl border-2 border-b-4 border-[#E5E5E5] dark:border-stone-700 max-h-[min(96dvh,96vh)] flex flex-col overflow-hidden">
        {/* Top accent — thick solid green bar */}
        <div className="h-1.5 bg-[#58CC02] rounded-t-2xl shrink-0" />

        {/* Dismiss X — hidden in hard mode (checkout only) */}
        {!hard && (
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center rounded-xl bg-[#F7F7F7] dark:bg-stone-800 text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700 transition-all border-2 border-b-4 border-[#E5E5E5] dark:border-stone-700 active:border-b-2 active:translate-y-0.5"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* ═══════════════════════════════════════════════════════════
            BRANCH 1: "Last chance" — compact popup after first dismiss
           ═══════════════════════════════════════════════════════════ */}
        {!hard && showLastChance ? (
          <>
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 sm:px-8 pt-6 sm:pt-8 pb-4 animate-pwIn">
              {/* Sad mascot pleading */}
              <div className="flex justify-center mb-4">
                <div className="inline-flex items-center justify-center w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-[#FF9600] bg-[#FFF4E0]" style={{ boxShadow: '0 0 30px rgba(255,150,0,0.25)' }}>
                  <img src="/mascot-sad.webp" alt="" width={96} height={96} className="object-contain w-24 h-24 sm:w-28 sm:h-28" loading="eager" />
                </div>
              </div>

              {/* Last chance badge */}
              <div className="flex justify-center mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFE8E8] border-2 border-[#FF4B4B]/40 text-[#FF4B4B] text-[10px] font-extrabold uppercase tracking-[0.2em]">
                  <span aria-hidden>⏳</span>
                  Last chance
                </span>
              </div>

              {/* Plan toggle */}
              <div className="mb-5">
                <PlanToggle />
              </div>

              {/* Headline */}
              <h3
                className="text-2xl sm:text-3xl font-extrabold text-center text-[#3C3C3C] dark:text-stone-50 leading-tight mb-3"
                style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
              >
                {showTrial
                  ? <>Your <span className="text-[#58CC02]">{TRIAL_DAYS}-day free trial</span> is still here</>
                  : <>Upgrade to <span style={{ color: planAccent.color }}>{planName}</span></>}
              </h3>

              {/* Subcopy */}
              <p className="text-center text-stone-500 dark:text-stone-400 text-sm font-bold leading-relaxed">
                {showTrial
                  ? <>Start your {planName} trial — then <span className="font-extrabold text-[#3C3C3C] dark:text-stone-200">{monthlyPrice}/mo</span> if you continue. Cancel anytime.</>
                  : <>Continue to checkout to subscribe. Cancel anytime — no free trial remaining.</>}
              </p>
            </div>

            {/* Sticky footer with CTA — always visible */}
            <div className="flex-shrink-0 border-t-2 border-[#E5E5E5] dark:border-stone-700 bg-white dark:bg-stone-900 px-6 sm:px-8 pt-4 pb-5 sm:pb-6 space-y-2">
              {checkoutError && (
                <div className="rounded-xl bg-[#FFE8E8] border-2 border-[#FF4B4B]/30 px-3 py-2 text-sm text-[#FF4B4B] font-bold">
                  {checkoutError}
                </div>
              )}
              <PrimaryCta />
              <button
                onClick={handleDismiss}
                className="w-full text-center text-sm text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 font-bold underline underline-offset-4"
              >
                No thanks
              </button>
            </div>
          </>
        ) : hard ? (
          /* ═══════════════════════════════════════════════════════════
              BRANCH 2: Hard paywall — blocking, sticky CTA
             ═══════════════════════════════════════════════════════════ */
          <>
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 sm:px-8 pt-5 pb-3 space-y-4">
              {/* Mascot + speech bubble */}
              <div className="flex items-start gap-3">
                <img src="/mascot-celebrating.webp" alt="" width={64} height={64} className="object-contain w-16 h-16 shrink-0" loading="eager" />
                <div className="relative flex-1 min-w-0 rounded-2xl border-2 border-b-4 border-[#46A302] bg-[#E5F8D0] dark:bg-[#58CC02]/15 px-3.5 py-2.5 mt-2">
                  <p className="text-xs sm:text-sm font-extrabold text-[#3C3C3C] dark:text-stone-100 leading-snug">
                    {showTrial
                      ? `${TRIAL_DAYS}-day free trial — pick Pro or Premium below.`
                      : 'Subscribe below — this account has already used its free trial.'}
                  </p>
                  <div aria-hidden className="absolute -left-1.5 top-3 w-3 h-3 bg-[#E5F8D0] dark:bg-[#58CC02]/15 border-l-2 border-b-2 border-[#46A302] rotate-45" />
                </div>
              </div>

              {/* Header */}
              <div className="text-center">
                <h2
                  className="text-2xl sm:text-3xl font-extrabold text-[#3C3C3C] dark:text-stone-50 mb-1.5 leading-tight"
                  style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
                >
                  {variant === 'postTutorial' ? <>Let&apos;s level up your grades, {firstName}.</> : <>Try WriteScholar free, {firstName}</>}
                </h2>
                <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 font-bold leading-snug">
                  {variant === 'postTutorial' ? (
                    showTrial
                      ? <>{TRIAL_DAYS}-day {planName} trial, then {monthlyPrice}/mo if you continue. Cancel anytime.</>
                      : <>{monthlyPrice}/mo. One free trial per account—yours was already used. Cancel anytime.</>
                  ) : showTrial ? (
                    <>Try {planName} free for {TRIAL_DAYS} days, then {monthlyPrice}/mo. Cancel anytime.</>
                  ) : (
                    <>Upgrade to {planName}: {monthlyPrice}/mo. Cancel anytime.</>
                  )}
                </p>
              </div>

              <PlanToggle />

              {/* Price card */}
              <div className="relative rounded-2xl border-2 border-b-4 p-4 sm:p-5" style={{ backgroundColor: planAccent.bg, borderColor: planAccent.border }}>
                <div className="absolute top-3 right-3">
                  <span
                    className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white rounded-full border-2 border-b-2"
                    style={{ backgroundColor: planAccent.color, borderColor: planAccent.border }}
                  >
                    {planName}
                  </span>
                </div>
                <div className="pr-16 flex items-baseline gap-2 mb-0.5">
                  {showTrial ? (
                    <>
                      <span className="text-4xl sm:text-5xl font-extrabold text-[#58CC02] tabular-nums">$0</span>
                      <span className="text-base text-[#3C3C3C] dark:text-stone-200 font-extrabold">today</span>
                    </>
                  ) : (
                    <>
                      <span className="text-4xl sm:text-5xl font-extrabold tabular-nums" style={{ color: planAccent.color }}>{monthlyPrice}</span>
                      <span className="text-base text-[#3C3C3C] dark:text-stone-200 font-extrabold">first month</span>
                    </>
                  )}
                </div>
                <p className="text-sm text-[#3C3C3C] dark:text-stone-100 font-extrabold mb-1">
                  {showTrial ? <>{TRIAL_DAYS}-day free trial · {planName}</> : <>Upgrade to {planName}</>}
                </p>
                <p className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 mb-2.5 font-bold leading-snug">
                  {showTrial
                    ? <>Then {monthlyPrice}/mo if you continue. Cancel before the trial ends to pay nothing.</>
                    : <>{monthlyPrice}/mo. Cancel anytime. No free trial remaining on this account.</>}
                </p>
                {checkoutPlan === 'premium' && (
                  <p className="text-[11px] sm:text-xs text-[#D97F00] font-extrabold mb-2.5 leading-snug">
                    Premium adds 5× usage caps and 1GB library — details below.
                  </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2.5 gap-y-1.5">
                  {hardPaywallFeatures.map((feat, i) => (
                    <div key={`${checkoutPlan}-${i}`} className="flex items-start gap-1.5 min-w-0">
                      <span className="text-base flex-shrink-0 leading-none mt-0.5" aria-hidden>{feat.icon}</span>
                      <span className="text-[11px] sm:text-xs leading-tight text-[#3C3C3C] dark:text-stone-200 font-bold">{feat.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sticky footer with CTA */}
            <div className="flex-shrink-0 border-t-2 border-[#E5E5E5] dark:border-stone-700 bg-white dark:bg-stone-900 px-5 sm:px-8 pt-4 pb-5 space-y-2">
              {checkoutError && (
                <div className="rounded-xl bg-[#FFE8E8] border-2 border-[#FF4B4B]/30 px-3 py-2 text-sm text-[#FF4B4B] font-bold">
                  {checkoutError}
                </div>
              )}
              <PrimaryCta />
              {onNavigate && (
                <p className="text-center text-[10px] text-stone-400 dark:text-stone-500 font-bold leading-snug">
                  By continuing, you agree to our{' '}
                  <button type="button" onClick={() => onNavigate('terms')} className="text-[#1CB0F6] hover:underline font-extrabold">Terms</button>
                  {' '}and{' '}
                  <button type="button" onClick={() => onNavigate('privacy')} className="text-[#1CB0F6] hover:underline font-extrabold">Privacy Policy</button>.
                </p>
              )}
              <p className="text-[10px] text-center text-stone-400 dark:text-stone-500 font-bold">
                {showTrial ? "This step can't be skipped — start your free trial to continue." : "This step can't be skipped — subscribe to continue."}
              </p>
            </div>
          </>
        ) : (
          /* ═══════════════════════════════════════════════════════════
              BRANCH 3: Soft paywall — full pitch with sticky CTA footer
             ═══════════════════════════════════════════════════════════ */
          <>
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 sm:px-10 pt-7 sm:pt-9 pb-4">
            {/* Mascot + speech bubble — top-left layout, Duolingo style */}
            <div className="flex items-start gap-3 sm:gap-4 mb-5">
              <img
                src="/mascot-celebrating.webp"
                alt=""
                width={88}
                height={88}
                className="object-contain w-20 h-20 sm:w-24 sm:h-24 shrink-0"
                loading="eager"
              />
              <div className="relative flex-1 min-w-0 mt-2 rounded-2xl border-2 border-b-4 border-[#46A302] bg-[#E5F8D0] dark:bg-[#58CC02]/15 px-4 py-3">
                <p className="text-xs sm:text-sm font-extrabold text-[#3C3C3C] dark:text-stone-100 leading-snug">
                  {showTrial
                    ? `${TRIAL_DAYS}-day free trial available — choose Pro or Premium below.`
                    : 'Subscribe to continue — this account has already used its free trial.'}
                </p>
                <div aria-hidden className="absolute -left-1.5 top-4 w-3 h-3 bg-[#E5F8D0] dark:bg-[#58CC02]/15 border-l-2 border-b-2 border-[#46A302] rotate-45" />
              </div>
            </div>

            {/* Header */}
            <div className="text-center mb-6">
              <h2
                className="text-2xl sm:text-[1.85rem] font-extrabold text-[#3C3C3C] dark:text-stone-50 mb-2 leading-tight"
                style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
              >
                {variant === 'postTutorial'
                  ? <>Let&apos;s level up your grades, {firstName}.</>
                  : showTrial ? <>Try WriteScholar <span className="text-[#58CC02]">free</span>, {firstName}</> : <>Upgrade to {planName}, {firstName}</>}
              </h2>
              <p className="text-stone-500 dark:text-stone-400 text-sm sm:text-[0.9375rem] font-bold leading-relaxed">
                {variant === 'postTutorial' ? (
                  showTrial
                    ? <>Start a <span className="font-extrabold text-[#3C3C3C] dark:text-stone-200">{TRIAL_DAYS}-day free trial</span> on {planName}. Essay analysis, study packs, citations, and games — then <span className="font-extrabold text-[#3C3C3C] dark:text-stone-200">{monthlyPrice}/mo</span> if you stay. Cancel anytime.</>
                    : <>Upgrade to {planName} for essay analysis, study packs, citations, and games — <span className="font-extrabold text-[#3C3C3C] dark:text-stone-200">{monthlyPrice}/mo</span>. Cancel anytime.</>
                ) : showTrial ? (
                  <>Try {planName} free for <span className="font-extrabold text-[#3C3C3C] dark:text-stone-200">{TRIAL_DAYS} days</span>, then <span className="font-extrabold text-[#3C3C3C] dark:text-stone-200">{monthlyPrice}/mo</span> if you continue. Cancel anytime.</>
                ) : (
                  <>Subscribe to {planName}: <span className="font-extrabold text-[#3C3C3C] dark:text-stone-200">{monthlyPrice}/mo</span>. Cancel anytime.</>
                )}
              </p>
            </div>

            <div className="mb-5"><PlanToggle /></div>

            {/* Price card */}
            <div className="relative rounded-2xl border-2 border-b-4 p-5 sm:p-6 mb-5" style={{ backgroundColor: planAccent.bg, borderColor: planAccent.border }}>
              <div className="absolute top-3 right-3">
                <span
                  className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white rounded-full border-2 border-b-2"
                  style={{ backgroundColor: planAccent.color, borderColor: planAccent.border }}
                >
                  {planName}
                </span>
              </div>

              <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                {showTrial ? (
                  <>
                    <span className="text-4xl sm:text-5xl font-extrabold text-[#58CC02] tabular-nums">$0</span>
                    <span className="text-base text-[#3C3C3C] dark:text-stone-200 font-extrabold">today</span>
                  </>
                ) : (
                  <>
                    <span className="text-4xl sm:text-5xl font-extrabold tabular-nums" style={{ color: planAccent.color }}>{monthlyPrice}</span>
                    <span className="text-base text-[#3C3C3C] dark:text-stone-200 font-extrabold">first month</span>
                  </>
                )}
              </div>
              <p className="text-sm text-[#3C3C3C] dark:text-stone-100 font-extrabold mb-1">
                {showTrial ? <>{TRIAL_DAYS}-day free trial · {planName}</> : <>Upgrade to {planName}</>}
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-bold mb-4 leading-snug">
                {showTrial
                  ? <>After your free trial: <span className="font-extrabold text-[#3C3C3C] dark:text-stone-200">{monthlyPrice}/mo</span>. Cancel before the trial ends and you won&apos;t be charged.</>
                  : <>{monthlyPrice}/mo. Cancel anytime. No free trial remaining on this account.</>}
              </p>
              {checkoutPlan === 'premium' && (
                <p className="text-xs text-[#D97F00] font-extrabold mb-3 leading-snug">
                  Premium adds higher usage limits and 1GB library storage.
                </p>
              )}

              {/* Features checklist — staggered fade-in. Picks the right
                  feature list based on the active plan so Premium shows
                  Premium's stats (499/mo, 1GB library, etc.) instead of
                  Pro's (99/mo). */}
              <div className="space-y-2.5">
                {(checkoutPlan === 'premium' ? PREMIUM_FEATURES : FEATURES).map((feat, i) => (
                  <div
                    key={`${checkoutPlan}-${i}`}
                    className="flex items-center gap-3"
                    style={{
                      opacity: checkedFeatures.includes(i) ? 1 : 0,
                      transform: checkedFeatures.includes(i) ? 'translateX(0)' : 'translateX(-8px)',
                      transition: 'all 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
                    }}
                  >
                    <span className="text-base flex-shrink-0" aria-hidden>{feat.icon}</span>
                    <span className="text-sm text-[#3C3C3C] dark:text-stone-200 font-bold">{feat.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Social proof ticker — stays in the scrollable area */}
            <div className="mt-4 text-center h-5 overflow-hidden">
              <p
                key={socialIndex}
                className="text-xs font-extrabold text-[#A560E8] animate-pwSocialIn"
              >
                {SOCIAL_PROOF[socialIndex]}
              </p>
            </div>
          </div>

          {/* Sticky footer — CTA always visible, no need to scroll to find it */}
          <div className="flex-shrink-0 border-t-2 border-[#E5E5E5] dark:border-stone-700 bg-white dark:bg-stone-900 px-6 sm:px-10 pt-4 pb-4 sm:pb-5 space-y-2.5">
            {checkoutError && (
              <div className="rounded-xl bg-[#FFE8E8] border-2 border-[#FF4B4B]/30 px-3 py-2 text-sm text-[#FF4B4B] font-bold">
                {checkoutError}
              </div>
            )}
            <PrimaryCta />

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] font-extrabold text-stone-400 dark:text-stone-500">
              <span className="inline-flex items-center gap-1"><span className="text-[#58CC02]">✓</span> Secure checkout</span>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1"><span className="text-[#58CC02]">✓</span> Cancel anytime</span>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1"><span className="text-[#58CC02]">✓</span> Money-back</span>
            </div>

            {/* Terms */}
            {onNavigate && (
              <p className="text-center text-[11px] text-stone-400 dark:text-stone-500 font-bold">
                By continuing, you agree to our{' '}
                <button type="button" onClick={() => onNavigate('terms')} className="text-[#1CB0F6] hover:underline font-extrabold">Terms</button>
                {' '}and{' '}
                <button type="button" onClick={() => onNavigate('privacy')} className="text-[#1CB0F6] hover:underline font-extrabold">Privacy Policy</button>.
              </p>
            )}

            {/* Maybe later — text link, low emphasis */}
            <button
              type="button"
              onClick={handleDismiss}
              className="w-full text-center text-xs text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 font-bold underline underline-offset-4"
            >
              Maybe later
            </button>
          </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes pwIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
        @keyframes pwOut { from { opacity: 1; } to { opacity: 0; } }
        .animate-pwIn { animation: pwIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .animate-pwOut { animation: pwOut 0.3s ease-in forwards; }

        @keyframes pwSocialIn {
          0%   { opacity: 0; transform: translateY(8px); }
          15%  { opacity: 1; transform: translateY(0); }
          85%  { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-8px); }
        }
        .animate-pwSocialIn { animation: pwSocialIn 3.5s ease-in-out forwards; }
      `}</style>
    </div>
  );
};

export default SoftPaywall;
