import { useState, useEffect, useRef } from 'react';
import ScholarMascot from './ScholarMascot';
import { CHECKOUT_FROM_TUTORIAL_PAYWALL_KEY, LAST_TUTORIAL_CHECKOUT_PLAN_KEY } from '../../constants/paywallSession';

interface SoftPaywallProps {
  userName: string;
  onStartTrial: () => void;
  onDismiss: () => void;
  onNavigate?: (page: string) => void;
  /** After activation tutorial: stronger “you saw the product” framing */
  variant?: 'default' | 'postTutorial';
  /**
   * Blocking overlay: no backdrop click or corner X to dismiss (user uses CTA or “Maybe later”).
   * Use after the interactive tour so the paywall is the focus, not a separate pricing page.
   */
  hard?: boolean;
  /**
   * When set, overrides GET /subscriptions/trial-eligibility for “7-day trial” copy and checkout trial length.
   * Omit to fetch eligibility inside this component (default).
   */
  canStartFreeTrial?: boolean | null;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const FEATURES = [
  { text: 'Check up to 49 essays and papers per month', icon: '📝' },
  { text: 'Unlimited Focus Mode sites: block distractions until you study', icon: '🔒' },
  { text: 'Full study tools: quiz, flashcards, crossword & Crater Blast', icon: '🎯' },
  { text: 'Summarise unlimited research papers', icon: '📚' },
  { text: 'Export to PDF & Word', icon: '📄' },
  { text: 'Upload full dissertations and long papers', icon: '⚡' },
];

/** Hard paywall: shown when user selects Premium (matches Pricing page). */
const PREMIUM_FEATURES = [
  { text: 'Everything in Pro, with higher monthly limits', icon: '✨' },
  { text: '199 combined analyses, study packs & citations/mo', icon: '📝' },
  { text: 'Summarise unlimited research papers', icon: '📚' },
  { text: '1GB document library storage (100MB max per upload)', icon: '💾' },
  { text: 'Unlimited Focus Mode; full quiz, flashcards & study tools', icon: '🎯' },
  { text: 'Export PDF & Word; Apply WriteScholar revisions', icon: '📄' },
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
  /** null = loading or prop omitted (we fetch); true/false = one-time trial still available */
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

  /** Hard paywall: all feature rows visible; swap list when toggling Pro / Premium */
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
    /** onClick passes a MouseEvent as first arg; only accept real promo strings */
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

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center ${
        hard ? 'p-3 sm:p-5' : 'p-3 sm:p-5'
      } ${hard ? 'z-[250]' : 'z-[110]'} ${
        exiting ? 'animate-pwOut' : visible ? 'animate-pwIn' : 'opacity-0'
      }`}
    >
      {/* Backdrop — hard mode: do not dismiss on outside click */}
      <div
        className={`absolute inset-0 backdrop-blur-sm ${hard ? 'bg-black/60' : 'bg-black/50'}`}
        onClick={hard ? undefined : handleDismiss}
        aria-hidden="true"
      />

      {/* Modal — hard: flex column + sticky CTA so “Start free trial” stays on-screen; soft: scrollable sheet */}
      <div
        className={`relative w-full max-w-3xl sm:max-w-[52rem] rounded-2xl bg-white/95 dark:bg-stone-900/90 backdrop-blur-md shadow-[0_20px_50px_-12px_rgba(15,23,42,0.15)] dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.45)] border border-stone-200/90 dark:border-stone-700/80 ring-1 ring-white/50 dark:ring-white/5 ${
          hard ? 'max-h-[min(96dvh,96vh)] flex flex-col overflow-hidden' : 'max-h-[min(96dvh,96vh)] overflow-y-auto'
        }`}
      >
        {/* Dismiss X — hidden in hard mode (checkout only) */}
        {!hard && (
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-stone-100/90 dark:bg-stone-800 text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700 transition-all"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Top accent */}
        <div className="h-1 bg-gradient-to-r from-emerald-500 via-violet-600 to-amber-500 rounded-t-2xl opacity-90 shrink-0" />

        {!hard && showLastChance ? (
          <div className="px-7 sm:px-10 pt-7 pb-9">
            <div className="animate-pwIn">
              <div className="text-center mb-6">
                <span className="inline-block px-3 py-1.5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 text-xs font-bold uppercase tracking-wider mb-4">
                  Last chance
                </span>
                <div
                  className="rounded-xl border border-stone-200/90 dark:border-stone-600/80 p-1 flex gap-1.5 bg-stone-100/70 dark:bg-stone-800/60 mb-5"
                  role="group"
                  aria-label="Choose Pro or Premium"
                >
                  <button
                    type="button"
                    onClick={() => setCheckoutPlan('pro')}
                    className={`flex-1 min-w-0 rounded-lg px-2.5 py-2 text-left transition-all ${
                      checkoutPlan === 'pro'
                        ? 'bg-white dark:bg-stone-900 shadow-sm ring-1 ring-violet-400/70'
                        : 'hover:bg-white/60 dark:hover:bg-stone-700/40'
                    }`}
                  >
                    <div className="text-[11px] font-bold text-stone-900 dark:text-stone-100">Pro</div>
                    <div className="text-[9px] text-stone-500 dark:text-stone-400">{PRO_MONTHLY}/mo</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCheckoutPlan('premium')}
                    className={`flex-1 min-w-0 rounded-lg px-2.5 py-2 text-left transition-all ${
                      checkoutPlan === 'premium'
                        ? 'bg-white dark:bg-stone-900 shadow-sm ring-1 ring-amber-400/80'
                        : 'hover:bg-white/60 dark:hover:bg-stone-700/40'
                    }`}
                  >
                    <div className="text-[11px] font-bold text-stone-900 dark:text-stone-100">Premium</div>
                    <div className="text-[9px] text-stone-500 dark:text-stone-400">{PREMIUM_MONTHLY}/mo</div>
                  </button>
                </div>
                <>
                  <h3 className="text-xl font-semibold text-stone-800 dark:text-stone-100 mb-2" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
                    {showTrial ? `Your ${TRIAL_DAYS}-day free trial is still here` : `Upgrade to ${planName}`}
                  </h3>
                  <p className="text-stone-500 dark:text-stone-400 text-sm mb-6 leading-relaxed">
                    {showTrial ? (
                      <>
                        Start your {planName} trial, then {monthlyPrice}/mo if you continue. You can enter a promo code in Stripe checkout if you have one.
                      </>
                    ) : (
                      <>
                        Continue to checkout to subscribe. You can enter a promo code in Stripe if you have one.
                      </>
                    )}
                  </p>
                  <button
                    onClick={() => void handleStartTrial(undefined, checkoutPlan)}
                    disabled={isCheckoutLoading}
                    className="w-full py-4 bg-violet-700 hover:bg-violet-800 disabled:from-stone-400 disabled:to-stone-500 text-white rounded-xl font-semibold text-base shadow-md shadow-violet-900/20 ring-1 ring-violet-900/10 transition-all flex items-center justify-center gap-2 disabled:cursor-wait"
                  >
                    {isCheckoutLoading ? (
                      <>
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Opening checkout…
                      </>
                    ) : (
                      <>{showTrial ? 'Start free trial →' : `Upgrade to ${planName} →`}</>
                    )}
                  </button>
                </>
                <button
                  onClick={handleDismiss}
                  className="mt-3 text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
                >
                  No thanks
                </button>
              </div>
            </div>
          </div>
        ) : hard ? (
          <>
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 sm:px-8 pt-5 pb-3 space-y-4">
              <div className="flex items-center gap-3.5">
                <ScholarMascot size={64} animated pose="celebrating" />
                <div className="flex-1 min-w-0 rounded-lg border border-emerald-200/80 dark:border-emerald-800/50 bg-emerald-50/90 dark:bg-emerald-950/30 px-2.5 py-1.5">
                  <p className="text-[10px] font-medium text-emerald-900 dark:text-emerald-100/95 leading-snug">
                    {showTrial
                      ? '7-day free trial — pick Pro or Premium below.'
                      : 'Subscribe below — this account has already used its free trial.'}
                  </p>
                </div>
              </div>
              <div className="text-center">
                <h2
                  className="text-xl sm:text-2xl font-semibold text-stone-800 dark:text-stone-100 mb-1.5 leading-tight"
                  style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
                >
                  {variant === 'postTutorial' ? (
                    <>Your essay is next, {firstName}.</>
                  ) : (
                    <>Try WriteScholar free, {firstName}</>
                  )}
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400 leading-snug">
                  {variant === 'postTutorial' ? (
                    showTrial ? (
                      <>
                        7-day {planName} trial, then {monthlyPrice}/mo if you continue. Cancel anytime.
                      </>
                    ) : (
                      <>
                        {monthlyPrice}/mo. One free trial per account—yours was already used. Cancel anytime.
                      </>
                    )
                  ) : showTrial ? (
                    <>
                      Try {planName} free for {TRIAL_DAYS} days, then {monthlyPrice}/mo if you continue. Cancel anytime.
                    </>
                  ) : (
                    <>
                      Upgrade to {planName}: {monthlyPrice}/mo. Cancel anytime.
                    </>
                  )}
                </p>
              </div>
              <div
                className="rounded-xl border border-stone-200/90 dark:border-stone-600/80 p-1.5 flex gap-2 bg-stone-100/70 dark:bg-stone-800/60"
                role="group"
                aria-label="Choose Pro or Premium"
              >
                <button
                  type="button"
                  onClick={() => setCheckoutPlan('pro')}
                  className={`flex-1 min-w-0 rounded-lg px-3 py-2.5 text-left transition-all ${
                    checkoutPlan === 'pro'
                      ? 'bg-white dark:bg-stone-900 shadow-sm ring-1 ring-violet-400/70 dark:ring-violet-500/50'
                      : 'hover:bg-white/60 dark:hover:bg-stone-700/40'
                  }`}
                >
                  <div className="text-xs font-bold text-stone-900 dark:text-stone-100">Pro</div>
                  <div className="text-[10px] text-stone-500 dark:text-stone-400 leading-tight">{PRO_MONTHLY}/mo</div>
                </button>
                <button
                  type="button"
                  onClick={() => setCheckoutPlan('premium')}
                  className={`flex-1 min-w-0 rounded-lg px-3 py-2.5 text-left transition-all ${
                    checkoutPlan === 'premium'
                      ? 'bg-white dark:bg-stone-900 shadow-sm ring-1 ring-amber-400/80 dark:ring-amber-500/45'
                      : 'hover:bg-white/60 dark:hover:bg-stone-700/40'
                  }`}
                >
                  <div className="text-xs font-bold text-stone-900 dark:text-stone-100">Premium</div>
                  <div className="text-[10px] text-stone-500 dark:text-stone-400 leading-tight">{PREMIUM_MONTHLY}/mo</div>
                </button>
              </div>
              <div className="relative bg-gradient-to-br from-stone-50 via-violet-50/60 to-stone-100/80 dark:from-stone-900/80 dark:via-violet-950/40 dark:to-stone-900/60 rounded-xl p-4 sm:p-5 border border-stone-200/80 dark:border-stone-600/50 ring-1 ring-violet-500/10">
                <div className="absolute top-2.5 right-2.5">
                  <span
                    className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white rounded-full ${
                      checkoutPlan === 'premium' ? 'bg-amber-600 dark:bg-amber-600' : 'bg-violet-700 dark:bg-violet-600'
                    }`}
                  >
                    {planName}
                  </span>
                </div>
                <div className="pr-16 flex items-baseline gap-2 mb-0.5">
                  {showTrial ? (
                    <>
                      <span className="text-4xl sm:text-5xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        $0
                      </span>
                      <span className="text-base text-stone-600 dark:text-stone-300 font-semibold">today</span>
                    </>
                  ) : (
                    <>
                      <span className="text-4xl sm:text-5xl font-extrabold text-violet-600 dark:text-violet-400 tabular-nums">
                        {monthlyPrice}
                      </span>
                      <span className="text-base text-stone-600 dark:text-stone-300 font-semibold">first month</span>
                    </>
                  )}
                </div>
                <p className="text-sm text-stone-700 dark:text-stone-200 font-medium mb-1">
                  {showTrial ? (
                    <>
                      {TRIAL_DAYS}-day free trial · {planName}
                    </>
                  ) : (
                    <>Upgrade to {planName}</>
                  )}
                </p>
                <p className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 mb-2.5 leading-snug">
                  {showTrial ? (
                    <>
                      Then {monthlyPrice}/mo if you continue. Cancel before the trial ends to pay nothing. You can enter a promo code in
                      Stripe if you have one.
                    </>
                  ) : (
                    <>
                      {monthlyPrice}/mo. Cancel anytime. No free trial remaining on this account.
                    </>
                  )}
                </p>
                {checkoutPlan === 'premium' && (
                  <p className="text-[11px] sm:text-xs text-amber-800 dark:text-amber-200/90 font-medium mb-2.5 leading-snug">
                    Premium is Pro plus 4× usage caps and 1GB library — details below.
                  </p>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-2.5 gap-y-1.5">
                  {hardPaywallFeatures.map((feat, i) => (
                    <div key={`${checkoutPlan}-${i}`} className="flex items-start gap-1.5 min-w-0">
                      <span className="text-sm flex-shrink-0 leading-none mt-0.5">{feat.icon}</span>
                      <span className="text-[11px] sm:text-xs leading-tight text-stone-700 dark:text-stone-300 font-medium">{feat.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex-shrink-0 border-t border-stone-200/80 dark:border-stone-700/80 bg-white/98 dark:bg-stone-950/98 px-5 sm:px-8 pt-4 pb-5 space-y-2">
              {checkoutError && (
                <p className="text-sm text-red-500 dark:text-red-400">{checkoutError}</p>
              )}
              <button
                type="button"
                onClick={startPrimaryCheckout}
                disabled={isCheckoutLoading}
                className="w-full py-3.5 bg-violet-700 hover:bg-violet-800 dark:bg-violet-600 dark:hover:bg-violet-500 disabled:from-stone-400 disabled:to-stone-500 text-white rounded-xl font-semibold text-base shadow-md shadow-violet-900/20 ring-1 ring-violet-900/10 transition-all active:scale-[0.98] disabled:active:scale-100 flex items-center justify-center gap-2 disabled:cursor-wait"
              >
                {isCheckoutLoading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Opening checkout…
                  </>
                ) : (
                  <>
                    {showTrial ? 'Start free trial' : `Upgrade to ${planName}`}
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
              {onNavigate && (
                <p className="text-center text-[10px] text-stone-400 dark:text-stone-500 leading-snug">
                  By continuing, you agree to our{' '}
                  <button
                    type="button"
                    onClick={() => onNavigate('terms')}
                    className="text-violet-500 dark:text-violet-400 hover:underline font-medium"
                  >
                    Terms
                  </button>{' '}
                  and{' '}
                  <button
                    type="button"
                    onClick={() => onNavigate('privacy')}
                    className="text-violet-500 dark:text-violet-400 hover:underline font-medium"
                  >
                    Privacy Policy
                  </button>
                  .
                </p>
              )}
              <p className="text-[10px] text-center text-stone-500 dark:text-stone-400">
                {showTrial
                  ? 'This step can’t be skipped — start your free trial to continue.'
                  : 'This step can’t be skipped — subscribe to continue. No additional free trial on this account.'}
              </p>
            </div>
          </>
        ) : (
          <div className="px-7 sm:px-10 pt-8 pb-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-shrink-0">
              <ScholarMascot size={80} animated pose="celebrating" />
            </div>
            <div className="flex-1 min-w-0 px-3 sm:px-4 py-2 rounded-xl border border-emerald-200/80 dark:border-emerald-800/50 bg-emerald-50/90 dark:bg-emerald-950/30">
              <p className="text-[11px] sm:text-xs font-medium text-emerald-900 dark:text-emerald-100/95 leading-snug">
                {showTrial
                  ? '7-day free trial available — choose Pro or Premium below.'
                  : 'Subscribe to continue — this account has already used its free trial.'}
              </p>
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-6">
            <h2
              className="text-2xl sm:text-[1.75rem] font-semibold text-stone-800 dark:text-stone-100 mb-2 leading-tight"
              style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
            >
              {variant === 'postTutorial' ? (
                <>
                  Your essay is next, {firstName}.
                </>
              ) : (
                <>
                  {showTrial ? `Try WriteScholar free, ${firstName}` : `Upgrade to ${planName}, ${firstName}`}
                </>
              )}
            </h2>
            <p className="text-stone-500 dark:text-stone-400 text-sm sm:text-[0.9375rem] leading-relaxed tracking-tight">
              {variant === 'postTutorial' ? (
                showTrial ? (
                  <>
                    Start a <span className="font-semibold text-stone-700 dark:text-stone-200">{TRIAL_DAYS}-day free trial</span> on {planName}.
                    Full analyses, rubric, annotations, and study tools—then{' '}
                    <span className="font-semibold text-stone-700 dark:text-stone-200">{monthlyPrice}/mo</span> if you stay subscribed.
                    Cancel anytime.
                  </>
                ) : (
                  <>
                    Upgrade to {planName} for full analyses, rubric, annotations, and study tools—{' '}
                    <span className="font-semibold text-stone-700 dark:text-stone-200">{monthlyPrice}/mo</span>. One free trial per
                    account—yours was already used. Cancel anytime.
                  </>
                )
              ) : showTrial ? (
                <>
                  Try {planName} free for <span className="font-semibold text-stone-700 dark:text-stone-200">{TRIAL_DAYS} days</span>, then{' '}
                  <span className="font-semibold text-stone-700 dark:text-stone-200">{monthlyPrice}/mo</span> if you continue. Cancel
                  anytime.
                </>
              ) : (
                <>
                  Subscribe to {planName}: <span className="font-semibold text-stone-700 dark:text-stone-200">{monthlyPrice}/mo</span>.
                  Cancel anytime.
                </>
              )}
            </p>
          </div>

          <div
            className="rounded-xl border border-stone-200/90 dark:border-stone-600/80 p-1 flex gap-1.5 bg-stone-100/70 dark:bg-stone-800/60 mb-5"
            role="group"
            aria-label="Choose Pro or Premium"
          >
            <button
              type="button"
              onClick={() => setCheckoutPlan('pro')}
              className={`flex-1 min-w-0 rounded-lg px-3 py-2.5 text-left transition-all ${
                checkoutPlan === 'pro'
                  ? 'bg-white dark:bg-stone-900 shadow-sm ring-1 ring-violet-400/70 dark:ring-violet-500/50'
                  : 'hover:bg-white/60 dark:hover:bg-stone-700/40'
              }`}
            >
              <div className="text-sm font-bold text-stone-900 dark:text-stone-100">Pro</div>
              <div className="text-[10px] text-stone-500 dark:text-stone-400">{PRO_MONTHLY}/mo</div>
            </button>
            <button
              type="button"
              onClick={() => setCheckoutPlan('premium')}
              className={`flex-1 min-w-0 rounded-lg px-3 py-2.5 text-left transition-all ${
                checkoutPlan === 'premium'
                  ? 'bg-white dark:bg-stone-900 shadow-sm ring-1 ring-amber-400/80 dark:ring-amber-500/45'
                  : 'hover:bg-white/60 dark:hover:bg-stone-700/40'
              }`}
            >
              <div className="text-sm font-bold text-stone-900 dark:text-stone-100">Premium</div>
              <div className="text-[10px] text-stone-500 dark:text-stone-400">{PREMIUM_MONTHLY}/mo</div>
            </button>
          </div>

          {/* Price card */}
          <div className="relative bg-gradient-to-br from-stone-50 via-violet-50/60 to-stone-100/80 dark:from-stone-900/80 dark:via-violet-950/40 dark:to-stone-900/60 rounded-2xl p-5 sm:p-6 border border-stone-200/80 dark:border-stone-600/50 mb-5 ring-1 ring-violet-500/10">
            <div className="absolute top-3 right-3">
              <span
                className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white rounded-full shadow-sm ring-1 ${
                  checkoutPlan === 'premium'
                    ? 'bg-amber-600 ring-amber-900/10'
                    : 'bg-violet-700 dark:bg-violet-600 ring-violet-900/10'
                }`}
              >
                {planName}
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-1 flex-wrap">
              {showTrial ? (
                <>
                  <span className="text-4xl sm:text-5xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    $0
                  </span>
                  <span className="text-base text-stone-600 dark:text-stone-300 font-semibold">today</span>
                </>
              ) : (
                <>
                  <span className="text-4xl sm:text-5xl font-extrabold text-violet-600 dark:text-violet-400 tabular-nums">
                    {monthlyPrice}
                  </span>
                  <span className="text-base text-stone-600 dark:text-stone-300 font-semibold">first month</span>
                </>
              )}
            </div>
            <p className="text-sm text-stone-700 dark:text-stone-200 font-medium mb-1">
              {showTrial ? (
                <>
                  {TRIAL_DAYS}-day free trial · {planName}
                </>
              ) : (
                <>Upgrade to {planName}</>
              )}
            </p>
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-4 leading-snug">
              {showTrial ? (
                <>
                  After your free trial: <span className="font-semibold text-stone-700 dark:text-stone-300">{monthlyPrice}/mo</span>. Cancel
                  before the trial ends and you won&apos;t be charged. You can enter a promo code in Stripe if you have one.
                </>
              ) : (
                <>
                  {monthlyPrice}/mo. Cancel anytime. No free trial remaining on this account.
                </>
              )}
            </p>
            {checkoutPlan === 'premium' && (
              <p className="text-xs text-amber-800 dark:text-amber-200/90 font-medium mb-3 leading-snug">
                Premium adds higher usage limits and 1GB library storage.
              </p>
            )}

            {/* Features checklist */}
            <div className="space-y-2.5">
              {FEATURES.map((feat, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3"
                  style={{
                    opacity: checkedFeatures.includes(i) ? 1 : 0,
                    transform: checkedFeatures.includes(i) ? 'translateX(0)' : 'translateX(-8px)',
                    transition: 'all 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
                  }}
                >
                  <span className="text-base flex-shrink-0">{feat.icon}</span>
                  <span className="text-sm text-stone-700 dark:text-stone-300 font-medium">{feat.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Error message */}
          {checkoutError && (
            <p className="mb-3 text-sm text-red-500 dark:text-red-400">{checkoutError}</p>
          )}

          {/* CTA */}
          <button
            type="button"
            onClick={startPrimaryCheckout}
            disabled={isCheckoutLoading}
            className="w-full py-3.5 sm:py-4 bg-violet-700 hover:bg-violet-800 dark:bg-violet-600 dark:hover:bg-violet-500 disabled:from-stone-400 disabled:to-stone-500 text-white rounded-xl font-semibold text-base shadow-md shadow-violet-900/20 ring-1 ring-violet-900/10 hover:shadow-lg transition-all active:scale-[0.98] disabled:active:scale-100 flex items-center justify-center gap-2 disabled:cursor-wait"
          >
            {isCheckoutLoading ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Opening checkout…
              </>
            ) : (
              <>
                {showTrial ? 'Start free trial' : `Upgrade to ${planName}`}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>

          {/* Trust signals */}
          <div className="flex items-center justify-center gap-4 mt-3 text-[11px] text-stone-400 dark:text-stone-500">
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              Secure checkout
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              Cancel anytime
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
              Money-back guarantee
            </span>
          </div>

          {/* Terms & Privacy */}
          {onNavigate && (
            <p className="mt-2 text-center text-[11px] text-stone-400 dark:text-stone-500">
              By continuing, you agree to our{' '}
              <button type="button" onClick={() => onNavigate('terms')} className="text-violet-500 dark:text-violet-400 hover:underline font-medium">
                Terms
              </button>{' '}
              and{' '}
              <button type="button" onClick={() => onNavigate('privacy')} className="text-violet-500 dark:text-violet-400 hover:underline font-medium">
                Privacy Policy
              </button>
              .
            </p>
          )}

          {/* Social proof ticker */}
          <div className="mt-4 text-center h-5 overflow-hidden">
            <p
              key={socialIndex}
              className="text-xs text-violet-500 dark:text-violet-400 font-semibold animate-pwSocialIn"
            >
              {SOCIAL_PROOF[socialIndex]}
            </p>
          </div>

          <div className="flex items-center justify-center mt-4 pt-4 border-t border-stone-100 dark:border-stone-700/50">
            <button
              type="button"
              onClick={handleDismiss}
              className="text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors font-medium"
            >
              Maybe later
            </button>
          </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pwIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes pwOut {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
        .animate-pwIn  { animation: pwIn  0.35s ease-out forwards; }
        .animate-pwOut { animation: pwOut 0.3s ease-in forwards; }

        @keyframes pwSocialIn {
          0%   { opacity: 0; transform: translateY(8px); }
          15%  { opacity: 1; transform: translateY(0); }
          85%  { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-8px); }
        }
        .animate-pwSocialIn {
          animation: pwSocialIn 3.5s ease-in-out forwards;
        }
      `}</style>
    </div>
  );
};

export default SoftPaywall;
