import { useState, useEffect, useRef } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import type { StripeEmbeddedCheckout } from '@stripe/stripe-js';
import ScholarMascot from '../common/ScholarMascot';
import { WriteScholarEditorialBackgroundLayers } from '../common/WriteScholarEditorialBackground';
import { SKIP_ONBOARDING_STRIPE } from '../../config/featureFlags';
import { trackEvent } from '../../utils/analytics';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const TRIAL_DAYS = 7;


interface OnboardingPageProps {
  onNavigate: (page: string) => void;
  user?: { id: string; email: string; name?: string; username?: string; plan?: string } | null;
  onComplete?: () => void;
  onUserUpdate?: (updates: {
    name?: string;
    username?: string;
    plan?: string;
    subscription_status?: string;
  }) => void;
  onLogout?: () => void;
}

type Phase = 'profile' | 'aha' | 'verifying' | 'checkout' | 'transition' | 'done';

function getInitialPhase(): Phase {
  if (typeof window === 'undefined') return 'profile';
  const params = new URLSearchParams(window.location.search);
  // Dev-only deep link from the dashboard "Preview onboarding" button so the
  // tester can jump straight to the aha screen regardless of their plan.
  if (params.get('preview') === 'aha') return 'aha';
  const sid = params.get('session_id');
  return sid ? 'verifying' : 'profile';
}

const TRIAL_FEATURES = [
  {
    icon: '📝',
    text: 'Sharper essays: structure, rubric scores, and line-by-line feedback your professor expects',
  },
];

const EMBEDDED_CHECKOUT_FALLBACK =
  "We couldn't load secure checkout. Please refresh the page in a moment. If this keeps happening, contact support so we can help.";

/** Only these errors are shown verbatim; Stripe/browser errors use {@link EMBEDDED_CHECKOUT_FALLBACK}. */
class UserFacingCheckoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserFacingCheckoutError';
  }
}

const OnboardingPage = ({ user, onComplete, onUserUpdate, onNavigate }: OnboardingPageProps) => {
  const [phase, setPhase] = useState<Phase>(getInitialPhase);
  const [displayName, setDisplayName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [trialEligible, setTrialEligible] = useState<boolean | null>(null);
  const [embeddedError, setEmbeddedError] = useState<string | null>(null);
  const [profileNotice, setProfileNotice] = useState<string | null>(null);
  const [embeddedLoading, setEmbeddedLoading] = useState(true);
  const checkoutHostRef = useRef<HTMLDivElement>(null);
  const embeddedInstanceRef = useRef<StripeEmbeddedCheckout | null>(null);

  // Aha-screen "Start trial" → hosted Stripe checkout (redirect to
  // checkout.stripe.com). Hosted feels more trustworthy than embedded.
  const [startingTrial, setStartingTrial] = useState(false);
  const [trialError, setTrialError] = useState<string | null>(null);


  const welcomeTitle = 'Welcome to WriteScholar';
  const TRANSITION_MS = 2200;
  const firstName = displayName.trim().split(/\s+/)[0] || 'there';

  useEffect(() => {
    if (phase !== 'transition') return;
    trackEvent('onboarding_complete');
    const finishTimer = setTimeout(() => {
      setPhase('done');
      onComplete?.();
    }, TRANSITION_MS);
    return () => clearTimeout(finishTimer);
  }, [phase, onComplete]);

  useEffect(() => {
    if (phase === 'profile') trackEvent('onboarding_profile_view');
  }, [phase]);

  /** Return from Stripe Embedded Checkout */
  useEffect(() => {
    if (phase !== 'verifying') return;
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    if (!sessionId) {
      setPhase('profile');
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          setPhase('profile');
          return;
        }
        const res = await fetch(`${API_URL}/subscriptions/sync-checkout-session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ sessionId }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (data.success && data.data?.plan) {
          onUserUpdate?.({
            plan: data.data.plan,
            subscription_status: data.data.subscriptionStatus,
          });
          window.history.replaceState({}, '', '/onboarding');
          setPhase('transition');
        } else if (SKIP_ONBOARDING_STRIPE) {
          window.history.replaceState({}, '', '/onboarding');
          setProfileNotice(
            data.message ||
              'We could not confirm that checkout. You can upgrade anytime from Billing in your account.'
          );
          setPhase('profile');
        } else {
          setEmbeddedError(data.message || 'We could not confirm your subscription yet. Please try again.');
          setPhase('checkout');
        }
      } catch {
        if (!cancelled) {
          if (SKIP_ONBOARDING_STRIPE) {
            window.history.replaceState({}, '', '/onboarding');
            setProfileNotice('Something went wrong confirming payment. You can try again from Billing when you are ready.');
            setPhase('profile');
          } else {
            setEmbeddedError('Something went wrong confirming payment.');
            setPhase('checkout');
          }
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [phase, onUserUpdate]);

  useEffect(() => {
    if (phase !== 'checkout') return;
    let cancelled = false;

    (async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        const trialRes = await fetch(`${API_URL}/subscriptions/trial-eligibility`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        let eligible = false;
        if (trialRes.ok) {
          const t = await trialRes.json();
          eligible = t.trialEligible === true;
        }
        if (cancelled) return;
        setTrialEligible(eligible);
      } catch {
        if (!cancelled) setTrialEligible(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== 'checkout') return;
    if (trialEligible === null) return;

    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
    if (!publishableKey) {
      if (import.meta.env.DEV) {
        console.error(
          '[WriteScholar] Embedded checkout needs VITE_STRIPE_PUBLISHABLE_KEY in the project root .env (match backend STRIPE_PUBLISHABLE_KEY). Restart the dev server after adding it.'
        );
      }
      setEmbeddedError(
        "We couldn't load secure checkout. Please refresh the page in a moment. If this keeps happening, contact support so we can help."
      );
      setEmbeddedLoading(false);
      return;
    }

    const mountEl = checkoutHostRef.current;
    if (!mountEl) return;

    let instance: StripeEmbeddedCheckout | null = null;
    let destroyed = false;

    (async () => {
      try {
        setEmbeddedError(null);
        setEmbeddedLoading(true);
        embeddedInstanceRef.current?.destroy();
        embeddedInstanceRef.current = null;
        mountEl.innerHTML = '';

        const token = localStorage.getItem('authToken');
        if (!token) throw new Error('Not signed in');

        const returnUrl = `${window.location.origin}/onboarding?session_id={CHECKOUT_SESSION_ID}`;
        const res = await fetch(`${API_URL}/subscriptions/create-checkout-session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            planType: 'pro',
            billingCycle: 'monthly',
            embedded: true,
            returnUrl,
            trialPeriodDays: trialEligible ? TRIAL_DAYS : 0,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new UserFacingCheckoutError(
            (typeof data?.message === 'string' && data.message) ||
              'We could not start checkout. Please try again in a moment.'
          );
        }
        const clientSecret = data?.data?.clientSecret as string | undefined;
        if (!clientSecret) {
          throw new UserFacingCheckoutError('We could not start checkout. Please try again in a moment.');
        }

        const stripe = await loadStripe(publishableKey);
        if (!stripe || destroyed) return;

        instance = await stripe.initEmbeddedCheckout({ clientSecret });
        if (destroyed) {
          instance.destroy();
          return;
        }
        embeddedInstanceRef.current = instance;
        instance.mount(mountEl);
      } catch (e) {
        if (!destroyed) {
          if (import.meta.env.DEV) console.error('[Onboarding embedded checkout]', e);
          setEmbeddedError(e instanceof UserFacingCheckoutError ? e.message : EMBEDDED_CHECKOUT_FALLBACK);
        }
      } finally {
        if (!destroyed) setEmbeddedLoading(false);
      }
    })();

    return () => {
      destroyed = true;
      instance?.destroy();
      if (embeddedInstanceRef.current === instance) embeddedInstanceRef.current = null;
    };
  }, [phase, trialEligible]);

  const saveProfile = async (): Promise<boolean> => {
    if (!user?.id) return false;
    const token = localStorage.getItem('authToken');
    try {
      if (displayName.trim()) {
        const profileRes = await fetch(`${API_URL}/users/profile`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ name: displayName.trim() }),
        });
        if (profileRes.ok) onUserUpdate?.({ name: displayName.trim() });
      }
      if (username.trim()) {
        const normalized = username.trim().toLowerCase().replace(/\s/g, '_');
        if (!/^[a-z0-9_]{3,30}$/.test(normalized)) {
          setUsernameError('Username must be 3-30 characters, letters, numbers, and underscores only');
          return false;
        }
        setUsernameError(null);
        const usernameRes = await fetch(`${API_URL}/users/username`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ username: normalized }),
        });
        const usernameData = await usernameRes.json();
        if (usernameRes.ok) {
          onUserUpdate?.({ username: normalized });
        } else {
          setUsernameError(usernameData.message || 'Username is already taken');
          return false;
        }
      }
      return true;
    } catch (e) {
      console.error('Failed to save profile:', e);
      return false;
    }
  };

  const handleContinueFromProfile = async () => {
    setIsSaving(true);
    const ok = await saveProfile();
    setIsSaving(false);
    if (!ok) return;

    setProfileNotice(null);
    trackEvent('onboarding_profile_complete');

    // Already paid: skip the demo (they don't need convincing) and finish.
    const plan = (user?.plan || 'free').toLowerCase();
    if (plan === 'pro' || plan === 'premium' || plan === 'focus') {
      setPhase('transition');
      return;
    }

    // Show the aha-moment demo to free users — let them feel the product
    // before we ask for a credit card. This runs whether or not embedded
    // Stripe checkout is enabled (`SKIP_ONBOARDING_STRIPE`); the difference
    // is just where the trial CTA inside aha sends them.
    setPhase('aha');
    trackEvent('onboarding_aha_view');
  };

  const handleAhaStartTrial = async () => {
    if (startingTrial) return;
    trackEvent('onboarding_choose_trial');
    trackEvent('paywall_view', { source: 'onboarding_aha_hosted' });

    setTrialError(null);
    setStartingTrial(true);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        onNavigate('login');
        return;
      }

      // Honor the user's trial eligibility so people who already used a trial
      // aren't sent through the trial flow a second time.
      let eligibleForTrial = false;
      try {
        const eligRes = await fetch(`${API_URL}/subscriptions/trial-eligibility`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (eligRes.ok) {
          const e = await eligRes.json();
          eligibleForTrial = e.trialEligible === true;
        }
      } catch {
        /* assume not eligible if the check fails — safer than promising a trial */
      }

      // Hosted checkout: omit `embedded`, supply success/cancel URLs.
      const successUrl = `${window.location.origin}/dashboard?payment=success`;
      const cancelUrl = `${window.location.origin}/onboarding?preview=aha`;
      const res = await fetch(`${API_URL}/subscriptions/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          planType: 'pro',
          billingCycle: 'monthly',
          successUrl,
          cancelUrl,
          trialPeriodDays: eligibleForTrial ? TRIAL_DAYS : 0,
        }),
      });

      const data = await res.json().catch(() => null);
      const url = data?.data?.checkoutUrl;
      if (!res.ok || !url) {
        const msg = (data && typeof data.message === 'string' && data.message) ||
          'We could not start checkout. Please try again in a moment.';
        setTrialError(msg);
        setStartingTrial(false);
        return;
      }

      // Hard navigation off-site to checkout.stripe.com.
      window.location.href = url;
    } catch (err) {
      if (import.meta.env.DEV) console.error('[aha hosted checkout]', err);
      setTrialError('We could not start checkout. Please try again in a moment.');
      setStartingTrial(false);
    }
  };

  const handleAhaContinueFree = () => {
    trackEvent('onboarding_choose_free');
    setPhase('transition');
  };

  /* ──────────── VERIFYING (post-Stripe return) ──────────── */
  if (phase === 'verifying') {
    return (
      <>
        <WriteScholarEditorialBackgroundLayers position="fixed" />
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6 bg-gradient-to-b from-stone-100/95 via-violet-50/50 to-stone-200/90 dark:from-stone-950/95 dark:via-violet-950/35 dark:to-stone-900">
          <div className="rounded-2xl border border-stone-200/80 dark:border-stone-600/60 bg-white/70 dark:bg-stone-900/50 p-6 shadow-lg max-w-sm text-center">
            <div className="flex justify-center mb-4">
              <span className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-stone-800 dark:text-stone-100 font-medium" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
              Confirming your membership…
            </p>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-2">One moment while we finish setting things up.</p>
          </div>
        </div>
      </>
    );
  }

  /* ──────────── AHA-MOMENT VALUE SHOWCASE (pre-paywall) ──────────── */
  if (phase === 'aha') {
    return (
      <div className="relative min-h-screen flex flex-col font-sans overflow-x-hidden pb-12">
        <WriteScholarEditorialBackgroundLayers position="fixed" />

        {/* Top bar */}
        <div className="relative z-10 px-5 sm:px-6 pt-5 sm:pt-6 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden border border-stone-200/80 dark:border-stone-600 bg-white/80 dark:bg-stone-800/80 shadow-sm ring-1 ring-white/50 dark:ring-white/5">
              <img src="/main-logo.png" alt="WriteScholar" className="w-full h-full object-contain" loading="eager" width="120" height="120" />
            </div>
            <span className="text-lg sm:text-xl font-semibold tracking-tight text-stone-900 dark:text-stone-100" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>WriteScholar</span>
          </div>
          <button
            type="button"
            onClick={handleAhaContinueFree}
            className="text-[11px] sm:text-xs text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 underline underline-offset-4"
          >
            Skip
          </button>
        </div>

        {/* Decorative ambient orbs behind the page content */}
        <div className="pointer-events-none absolute top-20 left-[-6%] h-72 w-72 rounded-full bg-violet-400/15 dark:bg-violet-500/10 blur-3xl aha-orb" aria-hidden />
        <div className="pointer-events-none absolute top-1/3 right-[-5%] h-80 w-80 rounded-full bg-fuchsia-400/12 dark:bg-fuchsia-500/10 blur-3xl aha-orb-delay" aria-hidden />
        <div className="pointer-events-none absolute bottom-32 left-1/3 h-64 w-64 rounded-full bg-violet-300/10 dark:bg-violet-400/8 blur-3xl aha-orb" style={{ animationDelay: '2s' }} aria-hidden />

        <div className="relative z-10 flex-1 px-4 sm:px-6 py-2 sm:py-4 max-w-6xl mx-auto w-full">
          {/* ─── Hero ─── */}
          <header className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-2 mb-3 rounded-full border border-violet-200/70 dark:border-violet-700/50 bg-white/80 dark:bg-stone-900/70 backdrop-blur px-3.5 py-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-violet-700 dark:text-violet-300 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-600" />
              </span>
              Almost there, {firstName} — last step
            </div>
            <h1
              className="text-xl sm:text-2xl lg:text-[2rem] text-stone-900 dark:text-stone-50 font-semibold leading-[1.1] tracking-tight whitespace-nowrap"
              style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
            >
              Here&apos;s everything you can do with{' '}
              <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-violet-600 dark:from-violet-300 dark:via-fuchsia-300 dark:to-violet-300 bg-clip-text text-transparent">
                WriteScholar
              </span>
            </h1>
            <p className="mt-2.5 text-stone-600 dark:text-stone-400 text-xs sm:text-sm">
              See every tool in action — no payment needed today.
            </p>

            {/* Stats / social proof row */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] sm:text-xs text-stone-600 dark:text-stone-400">
              <span className="inline-flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
                <span><span className="font-semibold text-stone-800 dark:text-stone-200">50,000+</span> students</span>
              </span>
              <span className="text-stone-300 dark:text-stone-600" aria-hidden>·</span>
              <span className="inline-flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .2.08.39.22.53l3 3a.75.75 0 001.06-1.06L10.75 9.69V5z" clipRule="evenodd" />
                </svg>
                <span>Ready in under <span className="font-semibold text-stone-800 dark:text-stone-200">60 seconds</span></span>
              </span>
              <span className="text-stone-300 dark:text-stone-600" aria-hidden>·</span>
              <span className="inline-flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6 7.7 9.3a1 1 0 00-1.4 1.4l2 2a1 1 0 001.4 0l4-4z" clipRule="evenodd" />
                </svg>
                Cancel anytime
              </span>
            </div>
          </header>

          {/* ─── Primary CTA — wrapped in a glowing frame so it commands the
              eye on first paint. ─── */}
          <section className="max-w-2xl mx-auto mb-9 sm:mb-12 relative">
            {/* Soft glow halo behind the CTA */}
            <div className="pointer-events-none absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-violet-300/30 via-fuchsia-300/20 to-violet-300/30 dark:from-violet-500/20 dark:via-fuchsia-500/15 dark:to-violet-500/20 blur-2xl" aria-hidden />
            {/* Floating "popular" sticker */}
            <span className="hidden sm:inline-flex absolute -top-3 -left-2 z-10 items-center gap-1 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg ring-1 ring-amber-300/40 -rotate-3">
              <span aria-hidden>★</span>
              Most popular
            </span>
            {/* Dancing mascot — lg+ only, peeks out next to the CTA to add
                personality and draw the eye. */}
            <img
              src="/mascot-dance.webp"
              alt=""
              aria-hidden
              loading="lazy"
              decoding="async"
              className="hidden lg:block pointer-events-none absolute -right-28 -bottom-6 w-36 xl:w-40 h-auto z-10 drop-shadow-[0_18px_30px_rgba(124,58,237,0.35)]"
            />
            <div className="relative">
              <AhaCtaCard
                onStartTrial={handleAhaStartTrial}
                onContinueFree={handleAhaContinueFree}
                isStarting={startingTrial}
                errorMessage={trialError}
              />
            </div>
          </section>

          {/* ─── Full feature showcase grid ─── */}
          <section className="mb-10 sm:mb-12">
            <div className="text-center mb-6 sm:mb-8">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-fuchsia-50 dark:bg-fuchsia-950/40 ring-1 ring-fuchsia-200/80 dark:ring-fuchsia-800/50 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-fuchsia-800 dark:text-fuchsia-200 mb-3">
                <span className="text-fuchsia-600 dark:text-fuchsia-400">▸</span>
                The full toolkit
              </span>
              <h2
                className="text-xl sm:text-2xl lg:text-[1.75rem] font-semibold text-stone-900 dark:text-stone-50 tracking-tight"
                style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
              >
                Eight tools, one paste of notes
              </h2>
              <p className="mt-2 text-sm text-stone-500 dark:text-stone-400 max-w-xl mx-auto">
                Every preview below is a real WriteScholar feature — see exactly what you get.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {AHA_FEATURES.map((feature, i) => (
                <AhaFeatureCard key={feature.title} feature={feature} delayMs={i * 80} />
              ))}
            </div>
          </section>

          {/* ─── Bottom CTA — second exit ramp after the user has seen the
              full toolkit. Different framing than the top CTA so it doesn't
              feel like a copy/paste. ─── */}
          <section className="max-w-3xl mx-auto mb-6 sm:mb-8">
            <div className="relative rounded-3xl border border-violet-200/70 dark:border-violet-800/50 bg-gradient-to-br from-violet-600 via-violet-700 to-fuchsia-700 dark:from-violet-700 dark:via-violet-800 dark:to-fuchsia-800 p-6 sm:p-8 text-center shadow-[0_30px_70px_-20px_rgba(124,58,237,0.55)] overflow-hidden">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(255,255,255,0.18),transparent_70%)]" aria-hidden />
              <div className="pointer-events-none absolute -bottom-10 -right-10 w-44 h-44 rounded-full bg-fuchsia-400/30 blur-3xl" aria-hidden />
              {/* Dancing mascot in the corner of the violet panel */}
              <img
                src="/mascot-dance.webp"
                alt=""
                aria-hidden
                loading="lazy"
                decoding="async"
                className="hidden md:block pointer-events-none absolute -top-6 -right-3 w-24 lg:w-28 h-auto drop-shadow-[0_14px_24px_rgba(0,0,0,0.35)]"
              />

              <p className="relative inline-flex items-center gap-1.5 mb-3 px-2.5 py-0.5 rounded-full bg-white/15 ring-1 ring-white/20 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-white">
                <span aria-hidden>⚡</span>
                Ready when you are
              </p>
              <h3
                className="relative text-2xl sm:text-3xl text-white font-semibold leading-tight tracking-tight"
                style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
              >
                Ace your next exam — with all 8 tools.
              </h3>
              <p className="relative mt-2 text-sm sm:text-base text-violet-100/90 max-w-xl mx-auto">
                One paste, eight study tools. Free for {TRIAL_DAYS} days, then $19.99/mo. Cancel anytime — your trial end date is in your account menu.
              </p>

              <button
                type="button"
                onClick={handleAhaStartTrial}
                disabled={startingTrial}
                className="relative mt-5 inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl px-7 sm:px-9 py-3.5 bg-white text-violet-800 font-bold text-base shadow-[0_18px_40px_-12px_rgba(0,0,0,0.35)] ring-1 ring-white/40 hover:bg-violet-50 hover:scale-[1.02] active:scale-[0.99] disabled:opacity-80 disabled:cursor-not-allowed transition-all"
              >
                {startingTrial ? (
                  <>
                    <svg className="w-4 h-4 motion-safe:animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                      <path fill="currentColor" className="opacity-90" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Redirecting to Stripe...
                  </>
                ) : (
                  <>
                    Start my {TRIAL_DAYS}-day free trial
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>

              {trialError && (
                <p className="relative mt-3 text-[12px] text-amber-100">{trialError}</p>
              )}

              {/* Trust badges */}
              <div className="relative mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px] text-violet-100/85">
                <span className="inline-flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                    <path fillRule="evenodd" d="M10 1l3 6 6 1-4.5 4 1 6L10 15l-5.5 3 1-6L1 8l6-1 3-6z" clipRule="evenodd" />
                  </svg>
                  Loved by 50,000+ students
                </span>
                <span className="text-white/30" aria-hidden>·</span>
                <span className="inline-flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m0 4h.01M5 11h14a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2zm10-4V7a3 3 0 00-6 0v4" />
                  </svg>
                  Secure checkout via Stripe
                </span>
              </div>

              <button
                type="button"
                onClick={handleAhaContinueFree}
                className="relative mt-4 text-xs sm:text-sm text-violet-100/80 hover:text-white underline underline-offset-4"
              >
                I&apos;ll start with the free plan
              </button>
            </div>
          </section>
        </div>

        <style>{`
          @keyframes ahaFeatPop {
            0% { transform: translateY(12px); opacity: 0; }
            100% { transform: translateY(0); opacity: 1; }
          }
          .aha-feat-pop { animation: ahaFeatPop 0.5s cubic-bezier(.22,1,.36,1) backwards; }
          @keyframes ahaOrb { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(14px,-12px) scale(1.06); } }
          @keyframes ahaOrbDelay { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-14px,10px) scale(1.04); } }
          .aha-orb { animation: ahaOrb 16s ease-in-out infinite; }
          .aha-orb-delay { animation: ahaOrbDelay 18s ease-in-out infinite; }
          @media (prefers-reduced-motion: reduce) {
            .aha-feat-pop, .aha-orb, .aha-orb-delay { animation: none; }
          }
        `}</style>
      </div>
    );
  }

  /* ──────────── TRANSITION SCREEN ──────────── */
  if (phase === 'transition' || phase === 'done') {
    const line = { text: welcomeTitle };
    const mascotPose: 'waving' | 'studying' | 'celebrating' = 'celebrating';

    return (
      <>
        <WriteScholarEditorialBackgroundLayers position="fixed" />
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden animate-transBgIn bg-gradient-to-b from-stone-100/95 via-violet-50/50 to-stone-200/90 dark:from-stone-950/95 dark:via-violet-950/35 dark:to-stone-900 backdrop-blur-[2px]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,rgba(91,33,182,0.12),transparent_55%)] dark:bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,rgba(109,40,217,0.2),transparent_55%)] pointer-events-none" aria-hidden />
          <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-violet-400/10 dark:bg-violet-400/5"
                style={{
                  width: `${8 + (i % 4) * 6}px`,
                  height: `${8 + (i % 4) * 6}px`,
                  left: `${(i * 8.1) % 100}%`,
                  top: `${(i * 11.3) % 100}%`,
                  animation: `transFloat ${7 + (i % 3) * 2}s ease-in-out infinite`,
                  animationDelay: `${(i * 0.5) % 3}s`,
                }}
              />
            ))}
          </div>

          <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-lg">
            <div className="mb-8 sm:mb-10" style={{ transform: 'scale(1.04)', transition: 'transform 1.2s cubic-bezier(0.22, 1, 0.36, 1)' }}>
              <div className="rounded-2xl border border-stone-200/80 dark:border-stone-600/60 bg-white/60 dark:bg-stone-900/40 p-2 shadow-lg shadow-stone-900/5 ring-1 ring-white/60 dark:ring-white/5">
                <ScholarMascot size={140} animated={true} pose={mascotPose} />
              </div>
            </div>

            <div className="relative min-h-[4.5rem] sm:min-h-[5.5rem] flex items-center justify-center overflow-hidden">
              <h1
                key="welcome-line"
                className="animate-transLine text-2xl sm:text-[2rem] font-semibold text-stone-900 dark:text-stone-50 tracking-tight leading-snug"
                style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
              >
                {line.text}
              </h1>
            </div>

            <div className="mt-8 sm:mt-10 w-52 sm:w-64 h-1.5 bg-stone-200/90 dark:bg-stone-700/80 rounded-full overflow-hidden ring-1 ring-stone-300/30 dark:ring-stone-600/30">
              <div className="h-full bg-gradient-to-r from-violet-600 to-violet-500 dark:from-violet-500 dark:to-violet-400 rounded-full animate-progressFill" />
            </div>
          </div>

          <style>{`
          @keyframes transBgIn {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
          .animate-transBgIn { animation: transBgIn 0.6s ease-out forwards; }
          @keyframes progressFill {
            from { width: 0%; }
            to   { width: 100%; }
          }
          .animate-progressFill {
            animation: progressFill 2.2s linear forwards;
          }
          @keyframes transFloat {
            0%, 100% { transform: translateY(0) scale(1); opacity: 0.4; }
            50% { transform: translateY(-20px) scale(1.05); opacity: 0.7; }
          }
          @keyframes transLineIn {
            0%   { opacity: 0; transform: translateY(16px); filter: blur(6px); }
            100% { opacity: 1; transform: translateY(0); filter: blur(0); }
          }
          .animate-transLine {
            animation: transLineIn 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          }
        `}</style>
        </div>
      </>
    );
  }

  /* ──────────── EMBEDDED CHECKOUT (gentle trial paywall) ──────────── */
  if (phase === 'checkout') {
    return (
      <div className="relative min-h-screen flex flex-col font-sans overflow-x-hidden pb-10">
        <WriteScholarEditorialBackgroundLayers position="fixed" />

        <div className="relative z-10 px-5 sm:px-6 pt-5 sm:pt-6 pb-2 flex items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden border border-stone-200/80 dark:border-stone-600 bg-white/80 dark:bg-stone-800/80 shadow-sm ring-1 ring-white/50 dark:ring-white/5">
              <img src="/main-logo.png" alt="WriteScholar" className="w-full h-full object-contain" loading="eager" width="120" height="120" />
            </div>
            <span className="text-lg sm:text-xl font-semibold tracking-tight text-stone-900 dark:text-stone-100" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>WriteScholar</span>
          </div>
        </div>

        <div className="relative z-10 flex-1 px-4 sm:px-6 py-6 max-w-lg mx-auto w-full">
          <div className="text-center mb-6">
            <div className="inline-flex mb-4 rounded-2xl border border-stone-200/70 dark:border-stone-600/60 p-1.5 bg-stone-50/80 dark:bg-stone-800/50">
              <ScholarMascot size={72} animated={true} pose="waving" />
            </div>
            <h1 className="text-2xl sm:text-[1.65rem] text-stone-900 dark:text-stone-50 mb-2 font-semibold leading-tight" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
              You&apos;re in, {firstName}. Congrats! You&apos;re now a step closer to transforming your writing.
            </h1>
            <p className="text-stone-600 dark:text-stone-400 text-sm sm:text-base leading-relaxed max-w-md mx-auto">
              {trialEligible === true ? (
                <>
                  Improve your essays for <span className="font-semibold text-violet-700 dark:text-violet-400">{TRIAL_DAYS} days free</span>. Start your{' '}
                  <span className="font-semibold text-violet-700 dark:text-violet-400">Pro trial</span> below.
                </>
              ) : (
                <>
                  Unlock <span className="font-semibold text-violet-700 dark:text-violet-400">Pro</span> below: stronger drafts, higher limits, and tools that help you submit with confidence. Cancel anytime in billing.
                </>
              )}
            </p>
          </div>

          <ul className="rounded-2xl border border-violet-200/60 dark:border-violet-800/50 bg-violet-50/50 dark:bg-violet-950/20 px-4 py-3 mb-5 space-y-2.5">
            {TRIAL_FEATURES.map((f) => (
              <li key={f.text} className="flex items-start gap-2.5 text-sm text-stone-700 dark:text-stone-300">
                <span className="shrink-0 text-base" aria-hidden>{f.icon}</span>
                <span>{f.text}</span>
              </li>
            ))}
          </ul>

          <div className="rounded-2xl border border-stone-200/90 dark:border-stone-700/80 bg-white/95 dark:bg-stone-900/80 backdrop-blur-md shadow-[0_12px_40px_-12px_rgba(15,23,42,0.12)] dark:shadow-[0_12px_40px_-16px_rgba(0,0,0,0.45)] overflow-hidden ring-1 ring-white/50 dark:ring-white/5">
            <div className="h-0.5 w-full bg-gradient-to-r from-emerald-500 via-violet-500 to-amber-500 opacity-85" aria-hidden />
            <div className="p-3 sm:p-4 min-h-[420px] relative">
              {embeddedLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/80 dark:bg-stone-900/80 z-10 rounded-xl">
                  <span className="w-9 h-9 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-stone-600 dark:text-stone-400">Loading secure checkout…</p>
                </div>
              )}
              {embeddedError && !embeddedLoading && (
                <div className="mb-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-800/50 px-3 py-2.5 text-sm text-rose-800 dark:text-rose-200">
                  {embeddedError}
                </div>
              )}
              <div ref={checkoutHostRef} className="min-h-[400px]" id="onboarding-embedded-checkout" />
            </div>
          </div>

          {trialEligible === true && (
            <p className="text-center text-sm text-stone-600 dark:text-stone-400 mt-4 max-w-md mx-auto leading-relaxed">
              Add a card to activate:{' '}
              <span className="font-medium text-stone-700 dark:text-stone-200">no charge today</span>, full Pro until the trial ends, cancel anytime from your account
              before you are billed.
            </p>
          )}

          <p className="text-center text-xs text-stone-500 dark:text-stone-500 mt-4 leading-relaxed">
            Secured by Stripe. WriteScholar never stores your full card number.
          </p>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setPhase('profile')}
              className="text-xs text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300"
            >
              ← Back to edit profile
            </button>
          </div>

          <nav className="mt-8 text-center text-xs text-stone-500 dark:text-stone-400" aria-label="Legal">
            <button
              type="button"
              onClick={() => onNavigate('terms')}
              className="text-violet-600 dark:text-violet-400 hover:underline font-medium"
            >
              Terms of Service
            </button>
            <span className="mx-2 text-stone-400 dark:text-stone-600" aria-hidden>
              ·
            </span>
            <button
              type="button"
              onClick={() => onNavigate('privacy')}
              className="text-violet-600 dark:text-violet-400 hover:underline font-medium"
            >
              Privacy Policy
            </button>
          </nav>
        </div>
      </div>
    );
  }

  /* ──────────── PROFILE FORM ──────────── */
  return (
    <div className="relative min-h-screen flex flex-col font-sans overflow-x-hidden">
      <WriteScholarEditorialBackgroundLayers position="fixed" />

      <div className="absolute top-24 left-8 w-14 h-14 rounded-2xl bg-violet-500/5 dark:bg-violet-500/10 border border-stone-200/40 dark:border-stone-700/40 rotate-12 hidden lg:block animate-float pointer-events-none" />
      <div className="absolute top-40 right-12 w-11 h-11 rounded-full bg-stone-400/10 dark:bg-stone-500/10 hidden lg:block animate-float-delayed pointer-events-none" />

      <div className="relative z-10 px-5 sm:px-6 pt-5 sm:pt-6 pb-2 flex items-center">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden border border-stone-200/80 dark:border-stone-600 bg-white/80 dark:bg-stone-800/80 shadow-sm ring-1 ring-white/50 dark:ring-white/5">
            <img src="/main-logo.png" alt="WriteScholar" className="w-full h-full object-contain" loading="eager" width="120" height="120" />
          </div>
          <span className="text-lg sm:text-xl font-semibold tracking-tight text-stone-900 dark:text-stone-100" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>WriteScholar</span>
        </div>
      </div>

      <div className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-6 sm:py-10">
        <div className="w-full max-w-md animate-fadeIn">
          <div className="rounded-2xl border border-stone-200/90 dark:border-stone-700/80 bg-white/90 dark:bg-stone-900/70 backdrop-blur-md shadow-[0_12px_40px_-12px_rgba(15,23,42,0.1)] dark:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.4)] p-6 sm:p-8 ring-1 ring-white/50 dark:ring-white/5">
            <div className="h-0.5 w-full bg-gradient-to-r from-emerald-500 via-violet-500 to-amber-500 opacity-80 rounded-full mb-6 -mt-1" aria-hidden />
            <div className="flex justify-center mb-5">
              <div className="rounded-2xl border border-stone-200/70 dark:border-stone-600/60 p-1.5 bg-stone-50/80 dark:bg-stone-800/50">
                <ScholarMascot size={100} animated={true} pose="waving" />
              </div>
            </div>
            <div className="text-center mb-6">
              <h1 className="text-2xl sm:text-[1.75rem] text-stone-900 dark:text-stone-50 mb-2 font-semibold leading-tight" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
                Hey there! Let&apos;s get started
              </h1>
              <p className="text-stone-600 dark:text-stone-400 text-sm sm:text-base">Just two things and you&apos;re in</p>
            </div>

            {profileNotice && (
              <div
                className="mb-5 rounded-xl bg-amber-50 dark:bg-amber-950/25 border border-amber-200/80 dark:border-amber-800/50 px-3 py-2.5 text-sm text-amber-900 dark:text-amber-100"
                role="status"
              >
                {profileNotice}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-2">Your name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Alex or Jordan"
                  className="w-full px-4 py-3.5 rounded-xl border border-stone-200/90 dark:border-stone-600 bg-white dark:bg-stone-900/50 focus:border-violet-500 dark:focus:border-violet-400 focus:ring-2 focus:ring-violet-500/25 focus:outline-none transition-all text-base text-stone-800 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-2">Pick a username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setUsernameError(null);
                  }}
                  placeholder="e.g. alex_student"
                  className={`w-full px-4 py-3.5 rounded-xl border bg-white dark:bg-stone-900/50 focus:ring-2 transition-all text-base text-stone-800 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 ${
                    usernameError
                      ? 'border-rose-400 dark:border-rose-500 focus:border-rose-500 focus:ring-rose-500/25 focus:outline-none'
                      : 'border-stone-200/90 dark:border-stone-600 focus:border-violet-500 dark:focus:border-violet-400 focus:ring-violet-500/25 focus:outline-none'
                  }`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && displayName.trim() && username.trim() && !usernameError) void handleContinueFromProfile();
                  }}
                />
                {usernameError && <p className="mt-1.5 text-sm text-rose-600 dark:text-rose-400">{usernameError}</p>}
                <p className="mt-1 text-xs text-stone-500 dark:text-stone-500">You can change this later in settings</p>
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => void handleContinueFromProfile()}
                disabled={!displayName.trim() || !username.trim() || !!usernameError || isSaving}
                className="w-full px-8 py-3.5 bg-violet-700 hover:bg-violet-800 dark:bg-violet-600 dark:hover:bg-violet-500 text-white rounded-xl font-semibold text-base shadow-md shadow-violet-900/15 ring-1 ring-violet-900/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Continue'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <nav
        className="relative z-10 pb-8 text-center text-xs text-stone-500 dark:text-stone-400"
        aria-label="Legal"
      >
        <button
          type="button"
          onClick={() => onNavigate('terms')}
          className="text-violet-600 dark:text-violet-400 hover:underline font-medium"
        >
          Terms of Service
        </button>
        <span className="mx-2 text-stone-400 dark:text-stone-600" aria-hidden>
          ·
        </span>
        <button
          type="button"
          onClick={() => onNavigate('privacy')}
          className="text-violet-600 dark:text-violet-400 hover:underline font-medium"
        >
          Privacy Policy
        </button>
      </nav>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
      `}</style>
    </div>
  );
};

export default OnboardingPage;

/* ─────────────────── Aha-screen feature showcase ─────────────────── */

type AhaTone = 'violet' | 'fuchsia' | 'emerald' | 'sky' | 'amber' | 'rose' | 'indigo' | 'teal';
type AhaBadge = 'Free' | 'Pro' | 'Game';

type AhaFeature = {
  title: string;
  desc: string;
  /** One of `video` or `image` must be set. */
  video?: string;
  image?: string;
  badge: AhaBadge;
  tone: AhaTone;
};

const AHA_BADGE_CLASS: Record<AhaBadge, string> = {
  Free: 'bg-emerald-500/95 text-white ring-emerald-300/40',
  Pro: 'bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white ring-violet-400/40',
  Game: 'bg-gradient-to-br from-amber-500 to-orange-600 text-white ring-amber-300/40',
};

const AHA_TONE_RING: Record<AhaTone, string> = {
  violet: 'hover:ring-violet-300 dark:hover:ring-violet-600',
  fuchsia: 'hover:ring-fuchsia-300 dark:hover:ring-fuchsia-600',
  emerald: 'hover:ring-emerald-300 dark:hover:ring-emerald-600',
  sky: 'hover:ring-sky-300 dark:hover:ring-sky-600',
  amber: 'hover:ring-amber-300 dark:hover:ring-amber-600',
  rose: 'hover:ring-rose-300 dark:hover:ring-rose-600',
  indigo: 'hover:ring-indigo-300 dark:hover:ring-indigo-600',
  teal: 'hover:ring-teal-300 dark:hover:ring-teal-600',
};

const AHA_FEATURES: AhaFeature[] = [
  {
    title: 'Essay analyzer',
    desc: 'Line-by-line feedback, rubric scores, structure tips',
    video: '/writescholar-essay-checker-demo.mp4',
    badge: 'Pro',
    tone: 'violet',
  },
  {
    title: 'Flashcards',
    desc: 'AI-built decks from your notes — flip and export',
    video: '/writescholar-flashcards-demo.mp4',
    badge: 'Free',
    tone: 'fuchsia',
  },
  {
    title: 'Quizzes',
    desc: 'Auto-graded MCQ, true/false, and fill-in-the-blank',
    video: '/writescholar-quiz-generator-demo.mp4',
    badge: 'Free',
    tone: 'emerald',
  },
  {
    title: 'Citations finder',
    desc: 'Real peer-reviewed sources in APA, MLA, Chicago',
    video: '/writescholar-citation-finder-demo.mp4',
    badge: 'Pro',
    tone: 'sky',
  },
  {
    title: 'Crater Blast',
    desc: 'Boss-battle quiz arcade — your subject as the level',
    video: '/writescholar-crater-blast-demo.mp4',
    badge: 'Game',
    tone: 'amber',
  },
  {
    title: 'Crosswords',
    desc: 'Vocabulary puzzles built from your terms',
    video: '/writescholar-crossword-demo.mp4',
    badge: 'Free',
    tone: 'rose',
  },
  {
    title: 'Summarizer',
    desc: 'Compress chapters into the points that matter',
    video: '/writescholar-summarizer-demo.mp4',
    badge: 'Pro',
    tone: 'indigo',
  },
  {
    title: 'Word Tower',
    desc: 'Stack the right words, beat your streak',
    image: '/study-pack-previews/word-tower.png',
    badge: 'Game',
    tone: 'teal',
  },
];

function AhaCtaCard({
  onStartTrial,
  onContinueFree,
  isStarting = false,
  errorMessage = null,
}: {
  onStartTrial: () => void;
  onContinueFree: () => void;
  isStarting?: boolean;
  errorMessage?: string | null;
}) {
  return (
    <div
      className="rounded-2xl border border-violet-200/70 dark:border-violet-800/50 bg-gradient-to-br from-violet-50/60 via-fuchsia-50/40 to-white dark:from-violet-950/30 dark:via-fuchsia-950/20 dark:to-stone-900/60 p-4 sm:p-5 text-center shadow-[0_18px_50px_-25px_rgba(124,58,237,0.30)]"
    >
      <h3
        className="text-lg sm:text-xl font-semibold text-stone-900 dark:text-stone-50"
        style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
      >
        Unlock all 8 tools — free for 7 days
      </h3>
      <p className="mt-1.5 text-[13px] text-stone-600 dark:text-stone-400">
        Cancel anytime. Your trial end date is shown in your account menu.
      </p>

      <button
        type="button"
        onClick={onStartTrial}
        disabled={isStarting}
        className="mt-4 w-full rounded-xl px-5 py-3 bg-gradient-to-br from-violet-700 to-fuchsia-700 hover:from-violet-600 hover:to-fuchsia-600 disabled:opacity-80 disabled:cursor-not-allowed text-white font-semibold text-sm sm:text-[15px] shadow-[0_12px_28px_-10px_rgba(124,58,237,0.55)] ring-1 ring-violet-400/25 transition-all flex items-center justify-center gap-2"
      >
        {isStarting ? (
          <>
            <svg className="w-4 h-4 motion-safe:animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
              <path
                fill="currentColor"
                className="opacity-90"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Redirecting to Stripe...
          </>
        ) : (
          <>
            Start my 7-day free trial
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </>
        )}
      </button>

      {errorMessage && (
        <p className="mt-2 text-[12px] text-rose-700 dark:text-rose-300">{errorMessage}</p>
      )}

      <p className="mt-2.5 text-[11px] text-stone-500 dark:text-stone-400 flex items-center justify-center gap-1.5 flex-wrap">
        <span className="inline-flex items-center gap-1">
          <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6 7.7 9.3a1 1 0 00-1.4 1.4l2 2a1 1 0 001.4 0l4-4z" clipRule="evenodd" />
          </svg>
          No charge today
        </span>
        <span className="text-stone-300 dark:text-stone-600">·</span>
        <span className="inline-flex items-center gap-1">
          <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6 7.7 9.3a1 1 0 00-1.4 1.4l2 2a1 1 0 001.4 0l4-4z" clipRule="evenodd" />
          </svg>
          Cancel anytime
        </span>
        <span className="text-stone-300 dark:text-stone-600">·</span>
        <span className="inline-flex items-center gap-1">
          <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6 7.7 9.3a1 1 0 00-1.4 1.4l2 2a1 1 0 001.4 0l4-4z" clipRule="evenodd" />
          </svg>
          Instant access
        </span>
      </p>

      <button
        type="button"
        onClick={onContinueFree}
        className="mt-3 text-xs sm:text-sm text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 underline underline-offset-4"
      >
        I&apos;ll start with the free plan (2 study packs / month)
      </button>
    </div>
  );
}

function AhaFeatureCard({
  feature,
  delayMs = 0,
  className = '',
}: {
  feature: AhaFeature;
  delayMs?: number;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!feature.video) return;
    const v = videoRef.current;
    const w = wrapRef.current;
    if (!v || !w || typeof IntersectionObserver === 'undefined') return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            v.play().catch(() => {
              /* autoplay blocked — fine, just shows poster */
            });
          } else {
            v.pause();
          }
        });
      },
      { threshold: 0.25 }
    );
    obs.observe(w);
    return () => obs.disconnect();
  }, [feature.video]);

  return (
    <div
      ref={wrapRef}
      className={`aha-feat-pop group relative rounded-2xl border border-stone-200/90 dark:border-stone-700/70 bg-white dark:bg-stone-900 overflow-hidden shadow-[0_8px_24px_-12px_rgba(15,23,42,0.10)] hover:shadow-[0_22px_48px_-15px_rgba(91,33,182,0.40)] hover:-translate-y-1 hover:scale-[1.015] transition-all duration-300 ring-2 ring-transparent ${AHA_TONE_RING[feature.tone]} ${className}`}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className="relative aspect-[16/10] bg-stone-100 dark:bg-stone-800 overflow-hidden ring-2 ring-inset ring-violet-400/45 dark:ring-violet-500/35">
        {!loaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-stone-200 to-stone-100 dark:from-stone-800 dark:to-stone-900 animate-pulse" aria-hidden />
        )}
        {feature.video ? (
          <video
            ref={videoRef}
            src={feature.video}
            muted
            loop
            playsInline
            preload="metadata"
            aria-label={`${feature.title} demo`}
            onLoadedData={() => setLoaded(true)}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          />
        ) : feature.image ? (
          <img
            src={feature.image}
            alt={`${feature.title} preview`}
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          />
        ) : null}
        <span
          className={`absolute top-2 right-2 inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shadow-md ring-1 ${AHA_BADGE_CLASS[feature.badge]}`}
        >
          {feature.badge}
        </span>
      </div>
      <div className="px-3.5 py-3">
        <p className="text-sm font-bold text-stone-900 dark:text-stone-100 leading-tight">{feature.title}</p>
        <p className="mt-1 text-[12px] text-stone-500 dark:text-stone-400 leading-snug line-clamp-2">{feature.desc}</p>
      </div>
    </div>
  );
}
