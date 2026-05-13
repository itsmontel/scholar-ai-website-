import { useState, useEffect, useRef } from 'react';
import {
  CHECKOUT_FROM_TUTORIAL_PAYWALL_KEY,
  FIRST_PAYWALL_DISCOUNT_SHOWN_KEY,
  LAST_CHANCE_PAYWALL_SHOWN_KEY,
  LAST_TUTORIAL_CHECKOUT_PLAN_KEY,
  SOFT_PAYWALL_DISMISSED_KEY,
  SOFT_PAYWALL_OPEN_KEY,
  markSoftPaywallDismissedNow,
} from '../../constants/paywallSession';

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
// Struck-through "was" prices shown next to the active price to make
// the discount story explicit. Matches the strikethrough treatment on
// the pricing / billing / landing pages so all four surfaces tell the
// same story: Pro was $39.99 → now $19.99, Premium was $59.99 → now
// $39.99.
const PRO_MONTHLY_WAS = '$39.99';
const PREMIUM_MONTHLY_WAS = '$59.99';

// ─── MAY2026 discount applied to both soft-paywall branches ──────────
// Pricing is unified across both soft-paywall branches so a single
// Stripe coupon honours every displayed price:
//   Pro     — $9.99 first month  (vs $39.99 anchor → save $30)
//   Premium — $19.99 first month (vs $59.99 anchor → save $40)
//
// CRITICAL: configure MAY2026 in Stripe as a 50% off coupon, duration
// "once" (first invoice only). The math:
//   Pro:     $19.99 standard intro × 0.5 = $9.99  ✓
//   Premium: $39.99 standard intro × 0.5 = $19.99 ✓
// After the first month, billing rolls over to the standard recurring
// rate (PRO_MONTHLY / PREMIUM_MONTHLY). The "Save $N today only"
// urgency badge on the first paywall derives N from the difference
// between PRO_MONTHLY_WAS / PREMIUM_MONTHLY_WAS and the first-month
// price, so Pro shows "Save $30" and Premium shows "Save $40"
// automatically.
const FIRST_PAYWALL_PRO_FIRST_MONTH = '$9.99';
const FIRST_PAYWALL_PREMIUM_FIRST_MONTH = '$19.99';
const LAST_CHANCE_PRO_FIRST_MONTH = '$9.99';
const LAST_CHANCE_PREMIUM_FIRST_MONTH = '$19.99';
const LAST_CHANCE_PRO_WAS = '$39.99';
const LAST_CHANCE_PREMIUM_WAS = '$59.99';
/** Stripe coupon ID applied at checkout from any non-hard soft-paywall
 *  branch (first paywall + last-chance). `null` ⇒ no coupon sent;
 *  checkout falls back to the standard intro price. The matching
 *  coupon must exist in Stripe Dashboard → Products → Coupons. */
const MAY2026_PROMO_CODE: string | null = 'MAY2026';

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
  /**
   * Captured at mount: whether the MAY2026 welcome discount has
   * already been "consumed" (shown + dismissed or converted) on a
   * previous paywall fire. Lives on `localStorage` via
   * FIRST_PAYWALL_DISCOUNT_SHOWN_KEY. Reading it once at mount means
   * the discount UI stays consistent for this paywall instance even
   * if other code writes to the key mid-render — the user can't lose
   * the discount mid-flow.
   */
  const [discountAlreadyConsumed] = useState(() => {
    try {
      return localStorage.getItem(FIRST_PAYWALL_DISCOUNT_SHOWN_KEY) === '1';
    } catch {
      return false;
    }
  });
  /** Convenience: true ⇒ render strike-through + urgency badge +
   *  apply MAY2026 promo at checkout. Hard variant always skips it. */
  const showDiscount = !discountAlreadyConsumed && !hard;
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

  // Free trial offering disabled site-wide — force the non-trial path so
  // all downstream copy (CTAs, paywall body, last-chance modal) renders
  // the subscribe-now variant. The fetched/prop eligibility values are
  // still wired in case the offering is brought back later.
  const showTrial = false;
  // Silence unused-var: `fetchedTrialEligible` and `canStartFreeTrialProp`
  // remain set by the effect/prop above so re-enabling is a one-line flip.
  void fetchedTrialEligible;
  void canStartFreeTrialProp;

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
  const monthlyWas = checkoutPlan === 'premium' ? PREMIUM_MONTHLY_WAS : PRO_MONTHLY_WAS;
  // First soft paywall (BRANCH 3) — MAY2026 discount applied. Pro
  // $9.99 first month (vs $39.99 anchor), Premium $29.99 first month
  // (vs $59.99 anchor). Both save $30 vs the original "was" price.
  const firstPaywallFirstMonth =
    checkoutPlan === 'premium' ? FIRST_PAYWALL_PREMIUM_FIRST_MONTH : FIRST_PAYWALL_PRO_FIRST_MONTH;
  const firstPaywallSavedUsd = (
    parseFloat(monthlyWas.slice(1)) - parseFloat(firstPaywallFirstMonth.slice(1))
  ).toFixed(0);
  // Last-chance branch (BRANCH 1) — deeper one-shot discount. Anchored
  // against the original "was" price for max savings impact. Pro saves
  // $30, Premium saves $40 (vs the first-paywall $30 on Premium).
  const lastChanceFirstMonth =
    checkoutPlan === 'premium' ? LAST_CHANCE_PREMIUM_FIRST_MONTH : LAST_CHANCE_PRO_FIRST_MONTH;
  const lastChanceWas =
    checkoutPlan === 'premium' ? LAST_CHANCE_PREMIUM_WAS : LAST_CHANCE_PRO_WAS;
  const lastChanceSavedUsd = (
    parseFloat(lastChanceWas.slice(1)) - parseFloat(lastChanceFirstMonth.slice(1))
  ).toFixed(0);
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
      // Burn the MAY2026 welcome-discount flag on every BRANCH-3
      // dismissal. After this, future paywalls (after the 7-day
      // cooldown) render the plain-price variant — no strike-through,
      // no urgency badge, no coupon at checkout.
      if (showDiscount) {
        try {
          localStorage.setItem(FIRST_PAYWALL_DISCOUNT_SHOWN_KEY, '1');
        } catch {
          /* ignore */
        }
      }

      // Last-chance is a one-shot goodwill pop-up reserved for the
      // first dismissal ever (i.e. right after the user finishes
      // onboarding). It only ever shows on the welcome-discount
      // paywall — never on the subsequent plain pitches — so we
      // explicitly gate it by `showDiscount` as well as the existing
      // LAST_CHANCE_PAYWALL_SHOWN_KEY belt-and-suspenders flag.
      if (!showDiscount) {
        setExiting(true);
        setTimeout(onDismiss, 350);
        return;
      }
      let alreadyShown = false;
      try {
        alreadyShown = localStorage.getItem(LAST_CHANCE_PAYWALL_SHOWN_KEY) === '1';
      } catch {
        /* ignore */
      }
      if (alreadyShown) {
        setExiting(true);
        setTimeout(onDismiss, 350);
        return;
      }
      try {
        localStorage.setItem(LAST_CHANCE_PAYWALL_SHOWN_KEY, '1');
      } catch {
        /* ignore */
      }
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
        // Treat clicking the green CTA as a soft-paywall dismissal so it
        // doesn't pop back open if the user bails on Stripe checkout and
        // lands back on the dashboard via cancelUrl. The "restore on
        // mount" effect in CompleteAcademicAIApp checks both
        // SOFT_PAYWALL_DISMISSED_KEY and the 7-day cooldown — we set
        // both here. If they pay successfully instead, the plan-change
        // effect closes the paywall anyway, so these flags are a no-op
        // in the success path. Cooldown for the StripeCancelTrialChoice
        // modal (controlled by a different key) is untouched, so the
        // "Leave checkout without subscribing?" modal still appears on
        // return from cancel.
        try {
          sessionStorage.removeItem(SOFT_PAYWALL_OPEN_KEY);
          sessionStorage.setItem(SOFT_PAYWALL_DISMISSED_KEY, '1');
        } catch {
          /* ignore */
        }
        markSoftPaywallDismissedNow();
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
    // Auto-apply MAY2026 only when the paywall is currently showing
    // the discount UI — i.e. the first-ever post-onboarding pitch
    // (BRANCH 3 with `showDiscount`) or the Last-chance pop-up
    // (BRANCH 1), both of which display the discounted first-month
    // price. The plain-pricing variant (BRANCH 3 after the 7-day
    // cooldown re-fires) intentionally skips the coupon so Stripe
    // charges the standard intro price ($19.99 Pro / $39.99 Premium)
    // that the UI is showing. Hard paywall (BRANCH 2) also skips.
    const discountActive = (showDiscount || showLastChance) && !hard;
    const promo = discountActive && MAY2026_PROMO_CODE ? MAY2026_PROMO_CODE : undefined;
    if (discountActive && !MAY2026_PROMO_CODE) {
      // eslint-disable-next-line no-console
      console.warn(
        '[SoftPaywall] Discount paywall shown but MAY2026_PROMO_CODE is unset — ' +
          'Stripe will charge the regular intro price. Create the coupon in Stripe ' +
          'Dashboard and set the constant in SoftPaywall.tsx before this ships.'
      );
    }
    // Burn the welcome-discount flag if we're converting from a
    // discounted branch. After this, future paywalls render plain.
    if (discountActive) {
      try {
        localStorage.setItem(FIRST_PAYWALL_DISCOUNT_SHOWN_KEY, '1');
      } catch {
        /* ignore */
      }
    }
    void handleStartTrial(promo, checkoutPlan);
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
        {/* Pro / Premium pills now show only the plan name — per
            user brief the strikethrough + active monthly price was
            removed so the paywall sells on the plan's value, not the
            price. The PRO_MONTHLY / PREMIUM_MONTHLY constants stay
            available higher up so the big price display + subcopy
            can still reference them. */}
        <div className="text-sm font-extrabold text-[#3C3C3C] dark:text-stone-100">Pro</div>
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
          {showTrial
            ? 'Start for free'
            : showLastChance
              ? `Get ${planName} for a discounted ${lastChanceFirstMonth}`
              : 'Get better grades'}
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
      {/* Backdrop — non-dismissive in both modes. Per user brief the
          paywall must only close via the explicit dismiss controls
          (corner X, "Maybe later", "No thanks"). Clicking the
          backdrop is a no-op so accidental misclicks can't bounce the
          user out of the upsell. */}
      <div
        className={`absolute inset-0 backdrop-blur-sm ${hard ? 'bg-black/60' : 'bg-black/50'}`}
        aria-hidden="true"
      />

      {/* Modal shell — Duolingo card with thick green top accent.
          Always flex-col + overflow-hidden so each branch can pin its
          primary CTA in a sticky footer (no scroll-to-button needed). */}
      <div className="relative w-full max-w-3xl sm:max-w-[52rem] rounded-2xl bg-white dark:bg-stone-900 shadow-2xl border-2 border-b-4 border-[#E5E5E5] dark:border-stone-700 max-h-[min(96dvh,96vh)] flex flex-col overflow-hidden">
        {/* Top accent — thick solid green bar */}
        <div className="h-1.5 bg-[#58CC02] rounded-t-2xl shrink-0" />

        {/* Dismiss X — hidden in hard mode (checkout only). Compact:
            w-7 h-7 (28px hit area) with a 14px icon — same Duolingo
            chip style, just half the visual weight of the old w-9 h-9
            so the X doesn't pull focus from the CTA. */}
        {!hard && (
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 z-10 w-7 h-7 flex items-center justify-center rounded-lg bg-[#F7F7F7] dark:bg-stone-800 text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700 transition-all border-2 border-b-[3px] border-[#E5E5E5] dark:border-stone-700 active:border-b-2 active:translate-y-0.5"
            aria-label="Close"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* ═══════════════════════════════════════════════════════════
            BRANCH 1: "Last chance" — fuller pitch after first dismiss.
            User already saw BRANCH 3 (the full pitch), so this round
            stacks four persuasion levers they haven't seen yet:
              • personalized urgency ("Wait, {firstName} …")
              • loss framing (free limits return, intro price disappears)
              • price anchor with explicit savings call-out
              • stay-vs-leave visual contrast (2×2 Duolingo grid)
            Plus the rotating social-proof line and trust pills already
            used in BRANCH 3, so dismissing here feels like a real cost.
           ═══════════════════════════════════════════════════════════ */}
        {!hard && showLastChance ? (
          <>
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 sm:px-8 pt-6 sm:pt-7 pb-3 animate-pwIn">
              {/* Sad mascot pleading */}
              <div className="flex justify-center mb-3.5">
                <div className="inline-flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-[#FF9600] bg-[#FFF4E0]" style={{ boxShadow: '0 0 30px rgba(255,150,0,0.25)' }}>
                  <img src="/mascot-sad.webp" alt="" width={96} height={96} className="object-contain w-20 h-20 sm:w-24 sm:h-24" loading="eager" />
                </div>
              </div>

              {/* Last chance badge — final offer urgency */}
              <div className="flex justify-center mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFE8E8] border-2 border-[#FF4B4B]/40 text-[#FF4B4B] text-[10px] font-extrabold uppercase tracking-[0.18em]">
                  <span aria-hidden>⏳</span>
                  Final offer · won&apos;t come back after this
                </span>
              </div>

              {/* Plan toggle */}
              <div className="mb-4">
                <PlanToggle />
              </div>

              {/* Personalized urgent headline — leads with the price */}
              <h3
                className="text-2xl sm:text-3xl font-extrabold text-center text-[#3C3C3C] dark:text-stone-50 leading-tight mb-2"
                style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
              >
                Wait, grab {planName} for a discounted <span style={{ color: planAccent.color }}>{lastChanceFirstMonth}</span> this month.
              </h3>

              {/* Loss-framed subcopy — one-shot offer, regular prices after */}
              <p className="text-center text-stone-500 dark:text-stone-400 text-sm sm:text-[15px] font-bold leading-relaxed mb-4 max-w-md mx-auto">
                This is the last time you&apos;ll see this price. Close the window and {planName} goes back to the regular {monthlyPrice}/mo. Try it for {lastChanceFirstMonth} this month and get the grade you deserve.
              </p>

              {/* Discount banner — anchored against the original "was" price */}
              <div
                className="relative rounded-2xl border-2 border-b-4 px-5 py-4 mb-4 mx-auto max-w-md"
                style={{ backgroundColor: planAccent.bg, borderColor: planAccent.border }}
              >
                <div className="flex items-baseline justify-center gap-2 flex-wrap mb-1">
                  <span className="text-xl sm:text-2xl font-semibold text-stone-400 dark:text-stone-500 line-through decoration-2 tabular-nums">{lastChanceWas}</span>
                  <span className="text-3xl sm:text-4xl font-extrabold tabular-nums" style={{ color: planAccent.color }}>{lastChanceFirstMonth}</span>
                  <span className="text-sm font-extrabold text-[#3C3C3C] dark:text-stone-200">/ first month</span>
                </div>
                <p className="text-center text-[11px] sm:text-xs font-extrabold text-[#46A302]">
                  You save ${lastChanceSavedUsd} this month · After that, {monthlyPrice}/mo. Cancel anytime.
                </p>
              </div>

              {/* Stay vs leave — visual contrast grid */}
              <div className="grid grid-cols-2 gap-2.5 max-w-md mx-auto mb-3">
                <div className="rounded-xl bg-[#E5F8D0] dark:bg-[#58CC02]/15 border-2 border-b-[3px] border-[#46A302] px-3 py-2.5">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#46A302] mb-0.5">If you stay</p>
                  <p className="text-[12px] font-extrabold text-[#3C3C3C] dark:text-stone-100 leading-tight">
                    {checkoutPlan === 'premium' ? '499' : '99'} analyses, study packs &amp; citations every month
                  </p>
                </div>
                <div className="rounded-xl bg-[#FFE8E8] dark:bg-[#FF4B4B]/10 border-2 border-b-[3px] border-[#FF4B4B]/60 px-3 py-2.5">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#FF4B4B] mb-0.5">If you leave</p>
                  <p className="text-[12px] font-extrabold text-[#3C3C3C] dark:text-stone-100 leading-tight">
                    Back to free limits. No full study packs, no unlimited focus mode.
                  </p>
                </div>
                <div className="rounded-xl bg-[#DDF4FF] dark:bg-[#1CB0F6]/15 border-2 border-b-[3px] border-[#1CB0F6]/70 px-3 py-2.5">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#1CB0F6] mb-0.5">Full toolkit</p>
                  <p className="text-[12px] font-extrabold text-[#3C3C3C] dark:text-stone-100 leading-tight">
                    Quizzes, flashcards, crosswords, Crater Blast &amp; Word Tower, all unlocked.
                  </p>
                </div>
                <div className="rounded-xl bg-[#F3EAFF] dark:bg-[#A560E8]/15 border-2 border-b-[3px] border-[#8A48C7] px-3 py-2.5">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#A560E8] mb-0.5">Zero risk</p>
                  <p className="text-[12px] font-extrabold text-[#3C3C3C] dark:text-stone-100 leading-tight">
                    One-click cancel anytime. No phone call, no email back-and-forth.
                  </p>
                </div>
              </div>

              {/* Rotating social proof — same ticker as the full pitch */}
              <div className="text-center h-5 overflow-hidden">
                <p
                  key={socialIndex}
                  className="text-xs font-extrabold text-[#A560E8] animate-pwSocialIn"
                >
                  {SOCIAL_PROOF[socialIndex]}
                </p>
              </div>
            </div>

            {/* Sticky footer — CTA + trust pills + demoted dismiss */}
            <div className="flex-shrink-0 border-t-2 border-[#E5E5E5] dark:border-stone-700 bg-white dark:bg-stone-900 px-6 sm:px-8 pt-4 pb-5 sm:pb-6 space-y-2.5">
              {checkoutError && (
                <div className="rounded-xl bg-[#FFE8E8] border-2 border-[#FF4B4B]/30 px-3 py-2 text-sm text-[#FF4B4B] font-bold">
                  {checkoutError}
                </div>
              )}
              <PrimaryCta />

              {/* Trust badges row */}
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] font-extrabold text-stone-400 dark:text-stone-500">
                <span className="inline-flex items-center gap-1"><span className="text-[#58CC02]">✓</span> Secure checkout</span>
                <span aria-hidden>·</span>
                <span className="inline-flex items-center gap-1"><span className="text-[#58CC02]">✓</span> Cancel anytime</span>
                <span aria-hidden>·</span>
                <span className="inline-flex items-center gap-1"><span className="text-[#58CC02]">✓</span> Money-back guarantee</span>
              </div>

              <div className="text-center">
                <button
                  onClick={handleDismiss}
                  className="text-[10px] sm:text-[11px] text-stone-400 dark:text-stone-500 font-bold underline underline-offset-2 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
                >
                  No thanks, I&apos;ll stick to the free limits
                </button>
              </div>
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
                    Subscribe below to keep going.
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
                  {variant === 'postTutorial' ? <>Get the grade you actually deserve, {firstName}.</> : <>Upgrade WriteScholar, {firstName}</>}
                </h2>
                <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 font-bold leading-snug">
                  {variant === 'postTutorial' ? (
                    <>{monthlyPrice}/mo. Cancel anytime.</>
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
                <div className="pr-16 flex items-baseline gap-2 mb-0.5 flex-wrap">
                  {showTrial ? (
                    <>
                      <span className="text-4xl sm:text-5xl font-extrabold text-[#58CC02] tabular-nums">$0</span>
                      <span className="text-base text-[#3C3C3C] dark:text-stone-200 font-extrabold">today</span>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl sm:text-3xl font-semibold text-stone-400 dark:text-stone-500 line-through decoration-2 tabular-nums">{monthlyWas}</span>
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
                    : <>{monthlyPrice}/mo. Cancel anytime.</>}
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
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 sm:px-10 pt-4 sm:pt-5 pb-3">
            {/* Celebrating mascot — speech bubble removed per user
                brief; mascot kept as a Duolingo brand anchor so the
                paywall doesn't feel naked above the headline. */}
            <div className="flex justify-center mb-2 sm:mb-3">
              <img
                src="/mascot-celebrating.webp"
                alt=""
                width={88}
                height={88}
                className="object-contain w-20 h-20 sm:w-24 sm:h-24"
                loading="eager"
              />
            </div>

            {/* Header */}
            <div className="text-center mb-4">
              <h2
                className="text-2xl sm:text-[1.85rem] font-extrabold text-[#3C3C3C] dark:text-stone-50 mb-2 leading-tight"
                style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
              >
                {variant === 'postTutorial'
                  ? <>Get the grade you actually deserve, {firstName}.</>
                  : showTrial ? <>Try WriteScholar <span className="text-[#58CC02]">free</span>, {firstName}</> : <>Upgrade to {planName}, {firstName}</>}
              </h2>
              <p className="text-stone-500 dark:text-stone-400 text-sm sm:text-[0.9375rem] font-bold leading-relaxed">
                {variant === 'postTutorial' ? (
                  showTrial
                    ? <>Start a <span className="font-extrabold text-[#3C3C3C] dark:text-stone-200">{TRIAL_DAYS}-day free trial</span> on {planName}. Essay analysis, study packs, citations, and games. Cancel anytime.</>
                    : <>Upgrade to {planName} for essay analysis, study packs, citations, and games. Cancel anytime.</>
                ) : showTrial ? (
                  <>Try {planName} free for <span className="font-extrabold text-[#3C3C3C] dark:text-stone-200">{TRIAL_DAYS} days</span>. Cancel anytime.</>
                ) : (
                  <>Subscribe to {planName}. Cancel anytime.</>
                )}
              </p>
            </div>

            <div className="mb-3"><PlanToggle /></div>

            {/* Price card */}
            <div className="relative rounded-2xl border-2 border-b-4 p-5 sm:p-6 mb-3" style={{ backgroundColor: planAccent.bg, borderColor: planAccent.border }}>
              <div className="absolute top-3 right-3">
                <span
                  className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white rounded-full border-2 border-b-2"
                  style={{ backgroundColor: planAccent.color, borderColor: planAccent.border }}
                >
                  {planName}
                </span>
              </div>

              {/* Urgency badge — "Save $X today only" red pill sitting
                  above the big price. Shown only on the first-ever
                  post-onboarding paywall (the MAY2026 welcome offer).
                  Subsequent paywalls (after the 7-day cooldown
                  re-fires) and the trial branch (disabled) skip it. */}
              {!showTrial && showDiscount && (
                <div className="mb-2.5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FF4B4B] text-white text-[10px] font-extrabold uppercase tracking-[0.14em] border-2 border-b-[3px] border-[#D93B3B] shadow-sm">
                    <span aria-hidden>⏰</span>
                    Save ${firstPaywallSavedUsd} today only
                  </span>
                </div>
              )}

              <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                {showTrial ? (
                  <>
                    <span className="text-4xl sm:text-5xl font-extrabold text-[#58CC02] tabular-nums">$0</span>
                    <span className="text-base text-[#3C3C3C] dark:text-stone-200 font-extrabold">today</span>
                  </>
                ) : showDiscount ? (
                  <>
                    <span className="text-2xl sm:text-3xl font-semibold text-stone-400 dark:text-stone-500 line-through decoration-2 tabular-nums">{monthlyWas}</span>
                    <span className="text-4xl sm:text-5xl font-extrabold tabular-nums" style={{ color: planAccent.color }}>{firstPaywallFirstMonth}</span>
                    <span className="text-base text-[#3C3C3C] dark:text-stone-200 font-extrabold">first month</span>
                  </>
                ) : (
                  <>
                    <span className="text-4xl sm:text-5xl font-extrabold tabular-nums" style={{ color: planAccent.color }}>{monthlyPrice}</span>
                    <span className="text-base text-[#3C3C3C] dark:text-stone-200 font-extrabold">/ month</span>
                  </>
                )}
              </div>
              <p className="text-sm text-[#3C3C3C] dark:text-stone-100 font-extrabold mb-1">
                {showTrial ? <>{TRIAL_DAYS}-day free trial · {planName}</> : <>Upgrade to {planName}</>}
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-bold mb-4 leading-snug">
                {showTrial
                  ? <>After your free trial: <span className="font-extrabold text-[#3C3C3C] dark:text-stone-200">{monthlyPrice}/mo</span>. Cancel before the trial ends and you won&apos;t be charged.</>
                  : showDiscount
                    ? <>After first month: <span className="font-extrabold text-[#3C3C3C] dark:text-stone-200">{monthlyPrice}/mo</span>. Cancel anytime.</>
                    : <>Cancel anytime.</>}
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
            <div className="mt-2 text-center h-5 overflow-hidden">
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

            {/* "Maybe later" — demoted from a prominent orange button
                to a small underlined text link sitting just under the
                Terms / Privacy line. Same dismiss handler, just much
                lower visual weight so the primary CTA stays the
                obvious choice. */}
            <div className="text-center -mt-1">
              <button
                type="button"
                onClick={handleDismiss}
                className="text-[10px] sm:text-[11px] text-stone-400 dark:text-stone-500 font-bold underline underline-offset-2 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
              >
                Maybe later
              </button>
            </div>
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
