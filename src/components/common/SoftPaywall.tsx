import { useState, useEffect, useRef } from 'react';
import ScholarMascot from './ScholarMascot';

interface SoftPaywallProps {
  userName: string;
  onStartTrial: () => void;
  onDismiss: () => void;
  onNavigate?: (page: string) => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const FEATURES = [
  { text: '99 combined analyses, study packs & citations per month', icon: '📝' },
  { text: 'Unlimited Focus Mode sites — block distractions until you study', icon: '🔒' },
  { text: 'Full study tools: quiz, flashcards, crossword & Crater Blast', icon: '🎯' },
  { text: '999,999 Paper Summarizer words per month', icon: '📚' },
  { text: 'Export to PDF & Word', icon: '📄' },
  { text: '100MB uploads, long summarizer docs & priority AI', icon: '⚡' },
];

const SOCIAL_PROOF = [
  'Join 50k+ students already using Pro',
  'Average GPA improvement: +0.4 in the first semester',
  '#1 rated AI study platform by students',
];

const TOTAL_SECONDS = 10 * 60; // 10 minutes

const SoftPaywall = ({ userName, onStartTrial, onDismiss, onNavigate }: SoftPaywallProps) => {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [socialIndex, setSocialIndex] = useState(0);
  const [checkedFeatures, setCheckedFeatures] = useState<number[]>([]);
  const [showLastChance, setShowLastChance] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const countdownRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  useEffect(() => {
    countdownRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSocialIndex(i => (i + 1) % SOCIAL_PROOF.length);
    }, 3500);
    return () => clearInterval(intervalRef.current);
  }, []);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    FEATURES.forEach((_, i) => {
      timers.push(setTimeout(() => setCheckedFeatures(prev => [...prev, i]), 400 + i * 120));
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  const handleDismiss = () => {
    if (!showLastChance) {
      setShowLastChance(true);
      return;
    }
    setExiting(true);
    setTimeout(onDismiss, 350);
  };

  const handleStartTrial = async (promoCode?: string) => {
    /** onClick passes a MouseEvent as first arg; only accept real promo strings */
    const code = typeof promoCode === 'string' ? promoCode : undefined;

    setCheckoutError(null);
    setIsCheckoutLoading(true);

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
          planType: 'pro',
          billingCycle: 'monthly',
          successUrl,
          cancelUrl,
          ...(code && { promoCode: code }),
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Failed to create checkout session');

      const url = data?.data?.checkoutUrl;
      if (url) {
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

  const firstName = userName?.split(' ')[0] || 'there';

  return (
    <div
      className={`fixed inset-0 z-[80] flex items-center justify-center p-4 ${
        exiting ? 'animate-pwOut' : visible ? 'animate-pwIn' : 'opacity-0'
      }`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleDismiss} aria-hidden="true" />

      {/* Modal — matches dashboard editorial cards */}
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl bg-white/95 dark:bg-stone-900/90 backdrop-blur-md shadow-[0_20px_50px_-12px_rgba(15,23,42,0.15)] dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.45)] border border-stone-200/90 dark:border-stone-700/80 ring-1 ring-white/50 dark:ring-white/5">
        {/* Dismiss X */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-stone-100/90 dark:bg-stone-800 text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700 transition-all"
          aria-label="Close"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Top accent */}
        <div className="h-1 bg-gradient-to-r from-emerald-500 via-violet-600 to-amber-500 rounded-t-2xl opacity-90" />

        <div className="px-6 sm:px-8 pt-6 pb-8">
          {showLastChance ? (
            /* Last chance - $10 off OFF10 offer */
            <div className="animate-pwIn">
              <div className="text-center mb-6">
                <span className="inline-block px-3 py-1.5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 text-xs font-bold uppercase tracking-wider mb-4">
                  Last chance
                </span>
                <h3 className="text-xl font-semibold text-stone-800 dark:text-stone-100 mb-2" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
                  Wait! Don&apos;t miss out
                </h3>
                <p className="text-stone-500 dark:text-stone-400 text-sm mb-6">
                  Get <span className="font-bold text-violet-600 dark:text-violet-500">$10 off</span> your first month with code{' '}
                  <span className="font-mono font-bold bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 px-2 py-0.5 rounded">OFF10</span>
                </p>
                <button
                  onClick={() => handleStartTrial('OFF10')}
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
                    <>
                      Claim $10 off with OFF10 →
                    </>
                  )}
                </button>
                <button
                  onClick={handleDismiss}
                  className="mt-3 text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
                >
                  No thanks, I&apos;ll pay full price later
                </button>
              </div>
            </div>
          ) : (
            <>
          {/* Mascot + Offer expires — same line, mascot left */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-shrink-0">
              <ScholarMascot size={72} animated pose="celebrating" />
            </div>
            <div className="flex-1 min-w-0 flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/60">
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400 whitespace-nowrap">Offer expires in</span>
              <span className="tabular-nums font-mono text-lg sm:text-xl font-bold text-red-600 dark:text-red-400">{timeStr}</span>
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-6">
            <h2
              className="text-xl sm:text-2xl font-semibold text-stone-800 dark:text-stone-100 mb-1.5 leading-tight"
              style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
            >
              Nice work, {firstName}! You're ready.
            </h2>
            <p className="text-stone-500 dark:text-stone-400 text-[11px] sm:text-xs leading-tight tracking-tight">
              Unlock the full power of WriteScholar.{' '}
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                Get $10 off your first month.
              </span>
            </p>
          </div>

          {/* Price card */}
          <div className="relative bg-gradient-to-br from-stone-50 via-violet-50/60 to-stone-100/80 dark:from-stone-900/80 dark:via-violet-950/40 dark:to-stone-900/60 rounded-2xl p-5 sm:p-6 border border-stone-200/80 dark:border-stone-600/50 mb-5 ring-1 ring-violet-500/10">
            <div className="absolute top-3 right-3">
              <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-violet-700 dark:bg-violet-600 text-white rounded-full shadow-sm ring-1 ring-violet-900/10">
                Pro
              </span>
            </div>

            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-3xl sm:text-4xl font-extrabold text-stone-800 dark:text-stone-100">$9.99</span>
              <span className="text-base text-stone-500 dark:text-stone-400 font-medium">first month</span>
            </div>
            <p className="text-xs text-stone-400 dark:text-stone-500 mb-4">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">$10 off Pro.</span>
              {' '}
              Then $19.99/mo. Cancel anytime.
            </p>

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
            onClick={() => void handleStartTrial()}
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
                Get $10 Off First Month
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
              <button onClick={() => onNavigate('terms')} className="text-violet-500 dark:text-violet-400 hover:underline font-medium">
                Terms
              </button>{' '}
              and{' '}
              <button onClick={() => onNavigate('privacy')} className="text-violet-500 dark:text-violet-400 hover:underline font-medium">
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

          {/* Secondary action */}
          <div className="flex items-center justify-center mt-4 pt-4 border-t border-stone-100 dark:border-stone-700/50">
            <button
              onClick={handleDismiss}
              className="text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors font-medium"
            >
              Maybe later
            </button>
          </div>
            </>
          )}
        </div>
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
