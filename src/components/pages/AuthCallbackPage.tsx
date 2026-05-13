import React, { useEffect, useRef, useState } from 'react';

interface AuthCallbackPageProps {
  onNavigate: (page: string) => void;
  onLogin: (userData: any) => void;
}

/**
 * OAuth (Google) sign-in callback. The redirect lands here with
 * `?token=...&user=...` query params, hydrates auth state + fetches
 * `/auth/me` to pull fresh onboardingCompleted, then routes to
 * `dashboard` or `onboarding` depending on first-run status.
 *
 * Simple Duolingo-style layout: pastel gradient background, single
 * 3D-bordered card, Nunito font, brand-coloured status badge + top
 * accent stripe. No decorative orbs, sparkles, or dot patterns — kept
 * minimal per user brief so the handoff feels quick rather than busy.
 */
const AuthCallbackPage: React.FC<AuthCallbackPageProps> = ({ onNavigate, onLogin }) => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;

    const handleAuthCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const userParam = urlParams.get('user');
        const errorParam = urlParams.get('error');

        if (token && userParam) {
          processedRef.current = true;
          const userData = JSON.parse(decodeURIComponent(userParam));

          localStorage.setItem('authToken', token);
          window.dispatchEvent(new CustomEvent('writescholar-auth-changed'));
          setStatus('success');
          window.history.replaceState(null, '', '/auth/callback');

          let onboardingCompleted = userData.onboardingCompleted === true;
          let welcomeTutorialCompleted = userData.welcomeTutorialCompleted === true;

          try {
            const meRes = await fetch(
              `${(import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api'}/auth/me`,
              { headers: { 'Authorization': `Bearer ${token}` } }
            );
            if (meRes.ok) {
              const meData = await meRes.json();
              const meUser = meData.data?.user;
              if (meUser) {
                onboardingCompleted = meUser.onboardingCompleted === true || onboardingCompleted;
                welcomeTutorialCompleted = meUser.welcomeTutorialCompleted === true || welcomeTutorialCompleted;
              }
              if (meData.data?.achievements) {
                const { mergeFromServer } = await import('../../data/achievements');
                mergeFromServer(
                  meData.data.achievements.stats || {},
                  meData.data.achievements.unlockedBadges || {}
                );
              }
            }
          } catch (_e) {
            // Network error — use OAuth payload values
          }

          const finalUser = { ...userData, onboardingCompleted, welcomeTutorialCompleted };
          localStorage.setItem('user', JSON.stringify(finalUser));
          onLogin(finalUser);

          setTimeout(() => onNavigate(onboardingCompleted ? 'dashboard' : 'onboarding'), 800);
          return;
        }

        // React Strict Mode re-run after replaceState cleared params
        if (!token && !userParam && localStorage.getItem('authToken')) {
          processedRef.current = true;
          setStatus('success');
          const storedUser = localStorage.getItem('user');
          let nextPage = 'dashboard';
          if (storedUser) {
            try {
              const p = JSON.parse(storedUser);
              nextPage = p.onboardingCompleted === true ? 'dashboard' : 'onboarding';
            } catch (_) {}
          }
          setTimeout(() => onNavigate(nextPage), 300);
          return;
        }

        if (errorParam) {
          setError('Authentication failed. Please try again.');
          setStatus('error');
          return;
        }

        setError('Invalid authentication response.');
        setStatus('error');
      } catch (err) {
        console.error('Auth callback error:', err);
        setError('Failed to process authentication.');
        setStatus('error');
      }
    };

    handleAuthCallback();
  }, [onLogin, onNavigate]);

  const handleRetry = () => {
    onNavigate('login');
  };

  // Per-status colour tokens. Driving the top accent stripe + icon tile
  // from a single object keeps the markup small.
  const accent =
    status === 'success'
      ? { stripe: '#58CC02', bg: '#58CC02', border: '#46A302' }
      : status === 'error'
        ? { stripe: '#FF4B4B', bg: '#FF4B4B', border: '#D93B3B' }
        : { stripe: '#A560E8', bg: '#A560E8', border: '#8A48C7' };

  return (
    <div
      className="relative min-h-screen flex items-center justify-center p-4"
      style={{
        fontFamily: '"Nunito", system-ui, sans-serif',
        background: 'linear-gradient(165deg, #F3EAFF 0%, #E8DAFF 35%, #DDF4FF 100%)',
      }}
    >
      <div className="relative z-10 max-w-sm w-full">
        <div className="relative rounded-2xl bg-white dark:bg-stone-900 border-2 border-b-4 border-stone-200 dark:border-stone-700 shadow-lg overflow-hidden">
          {/* Top accent stripe — switches colour with status */}
          <div aria-hidden className="h-1.5" style={{ backgroundColor: accent.stripe }} />

          <div className="px-7 pt-6 pb-8 text-center">
            {/* Logo lockup */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg overflow-hidden">
                <img
                  src="/main-logo.png"
                  alt=""
                  width={32}
                  height={32}
                  className="w-full h-full object-contain"
                  loading="eager"
                />
              </div>
              <span className="text-lg font-extrabold tracking-tight text-[#A560E8]">
                WriteScholar
              </span>
            </div>

            {/* Status icon — single 3D-bordered tile, swaps per state */}
            <div
              className="inline-flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-2xl border-2 border-b-4"
              style={{ backgroundColor: accent.bg, borderColor: accent.border }}
              aria-hidden
            >
              {status === 'loading' && (
                <svg
                  className="w-7 h-7 text-white animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-90"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              )}
              {status === 'success' && (
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
              {status === 'error' && (
                <svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3.5}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </div>

            {/* Heading + subhead */}
            {status === 'loading' && (
              <>
                <h2 className="text-xl font-extrabold text-stone-800 dark:text-stone-100 mb-1">
                  Signing you in
                </h2>
                <p className="text-sm font-bold text-stone-500 dark:text-stone-400">
                  Just a moment…
                </p>
              </>
            )}
            {status === 'success' && (
              <>
                <h2 className="text-xl font-extrabold text-stone-800 dark:text-stone-100 mb-1">
                  Welcome to WriteScholar!
                </h2>
                <p className="text-sm font-bold text-stone-500 dark:text-stone-400">
                  Taking you in.
                </p>
              </>
            )}
            {status === 'error' && (
              <>
                <h2 className="text-xl font-extrabold text-stone-800 dark:text-stone-100 mb-1">
                  Sign in failed
                </h2>
                <p className="text-sm font-bold text-stone-500 dark:text-stone-400 mb-5">
                  {error}
                </p>
                <button
                  type="button"
                  onClick={handleRetry}
                  className="w-full py-3 rounded-xl bg-[#58CC02] hover:bg-[#46A302] text-white font-extrabold text-sm uppercase tracking-wide border-2 border-b-4 border-[#46A302] active:border-b-2 active:translate-y-0.5 transition-all"
                >
                  Try again
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
