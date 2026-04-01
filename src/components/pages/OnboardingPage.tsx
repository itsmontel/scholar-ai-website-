import { useState, useEffect, useRef } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import type { StripeEmbeddedCheckout } from '@stripe/stripe-js';
import ScholarMascot from '../common/ScholarMascot';
import { WriteScholarEditorialBackgroundLayers } from '../common/WriteScholarEditorialBackground';

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

type Phase = 'profile' | 'verifying' | 'checkout' | 'transition' | 'done';

function getInitialPhase(): Phase {
  if (typeof window === 'undefined') return 'profile';
  const sid = new URLSearchParams(window.location.search).get('session_id');
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
  const [embeddedLoading, setEmbeddedLoading] = useState(true);
  const checkoutHostRef = useRef<HTMLDivElement>(null);
  const embeddedInstanceRef = useRef<StripeEmbeddedCheckout | null>(null);

  const welcomeTitle = 'Welcome to WriteScholar';
  const TRANSITION_MS = 2200;
  const firstName = displayName.trim().split(/\s+/)[0] || 'there';

  useEffect(() => {
    if (phase !== 'transition') return;
    const finishTimer = setTimeout(() => {
      setPhase('done');
      onComplete?.();
    }, TRANSITION_MS);
    return () => clearTimeout(finishTimer);
  }, [phase, onComplete]);

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
        } else {
          setEmbeddedError(data.message || 'We could not confirm your subscription yet. Please try again.');
          setPhase('checkout');
        }
      } catch {
        if (!cancelled) {
          setEmbeddedError('Something went wrong confirming payment.');
          setPhase('checkout');
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

    const plan = (user?.plan || 'free').toLowerCase();
    if (plan === 'pro' || plan === 'premium' || plan === 'focus') {
      setPhase('transition');
      return;
    }

    setPhase('checkout');
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
              <img src="/mascot.png" alt="WriteScholar" className="w-full h-full object-contain" loading="eager" width="120" height="120" />
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
            <img src="/mascot.png" alt="WriteScholar" className="w-full h-full object-contain" loading="eager" width="120" height="120" />
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
