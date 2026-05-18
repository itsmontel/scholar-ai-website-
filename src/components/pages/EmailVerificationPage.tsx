import { useEffect, useState } from 'react';
import { WriteScholarEditorialBackgroundLayers } from '../common/WriteScholarEditorialBackground';

interface EmailVerificationPageProps {
  onNavigate: (page: string) => void;
}

const EmailVerificationPage = ({ onNavigate }: EmailVerificationPageProps) => {
  const [countdown, setCountdown] = useState(3);
  const [verificationStatus, setVerificationStatus] = useState<'success' | 'error' | 'loading'>('loading');

  useEffect(() => {
    // Check URL parameters to determine verification status
    const urlParams = new URLSearchParams(window.location.search);
    const verified = urlParams.get('verified');
    const error = urlParams.get('error');

    if (verified === 'true') {
      setVerificationStatus('success');
    } else if (error) {
      setVerificationStatus('error');
    } else {
      setVerificationStatus('success'); // Default to success for now
    }
  }, []);

  useEffect(() => {
    if (verificationStatus === 'success') {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            onNavigate('login');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [onNavigate, verificationStatus]);

  if (verificationStatus === 'loading') {
    return (
      <div className="relative min-h-screen flex items-center justify-center p-4 overflow-x-clip">
        <WriteScholarEditorialBackgroundLayers position="fixed" />
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-stone-900 rounded-3xl border-2 border-b-4 border-stone-200 dark:border-stone-700 shadow-[0_18px_44px_-18px_rgba(96,48,140,0.35)] p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-[#F3EAFF] dark:bg-[#A560E8]/15 rounded-2xl flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-[#A560E8] animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <h1 className="text-2xl font-extrabold text-stone-900 dark:text-stone-50 mb-3" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>Verifying email…</h1>
            <p className="text-stone-600 dark:text-stone-400 font-medium">Please wait while we verify your email address.</p>
          </div>
        </div>
      </div>
    );
  }

  if (verificationStatus === 'error') {
    return (
      <div className="relative min-h-screen flex items-center justify-center p-4 overflow-x-clip">
        <WriteScholarEditorialBackgroundLayers position="fixed" />
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-stone-900 rounded-3xl border-2 border-b-4 border-stone-200 dark:border-stone-700 shadow-[0_18px_44px_-18px_rgba(96,48,140,0.35)] p-8 text-center">
            {/* Error Icon */}
            <div className="mx-auto w-16 h-16 bg-[#FFE8E8] dark:bg-[#FF4B4B]/15 rounded-2xl flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-[#E04343]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>

            {/* Error Message */}
            <h1 className="text-2xl font-extrabold text-stone-900 dark:text-stone-50 mb-3" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
              Verification failed
            </h1>

            <p className="text-stone-600 dark:text-stone-400 font-medium mb-7">
              Sorry, we couldn&apos;t verify your email address. The link may be invalid or expired.
            </p>

            {/* Action buttons */}
            <div className="space-y-3">
              <button
                onClick={() => onNavigate('signup')}
                className="w-full inline-flex items-center justify-center rounded-2xl bg-[#A560E8] hover:bg-[#8A48C7] text-white py-3.5 font-extrabold border-2 border-b-4 border-[#7733B5] active:border-b-2 active:translate-y-0.5 transition-all"
              >
                Try again
              </button>
              <button
                onClick={() => onNavigate('login')}
                className="w-full inline-flex items-center justify-center rounded-2xl bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-200 py-3.5 font-extrabold border-2 border-b-4 border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 active:border-b-2 active:translate-y-0.5 transition-all"
              >
                Back to login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-x-clip">
      <WriteScholarEditorialBackgroundLayers position="fixed" />
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-stone-900 rounded-3xl border-2 border-b-4 border-stone-200 dark:border-stone-700 shadow-[0_18px_44px_-18px_rgba(96,48,140,0.35)] p-8 text-center">
          {/* Success Icon */}
          <div className="mx-auto w-16 h-16 bg-[#F3EAFF] dark:bg-[#A560E8]/15 rounded-2xl flex items-center justify-center mb-6">
            <svg
              className="w-8 h-8 text-[#A560E8]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          {/* Success Message */}
          <h1 className="text-2xl font-extrabold text-stone-900 dark:text-stone-50 mb-3" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
            Email verified!
          </h1>

          <p className="text-stone-600 dark:text-stone-400 font-medium mb-2">
            Your email has been verified. Welcome to WriteScholar!
          </p>
          <p className="text-stone-500 dark:text-stone-500 text-sm mb-6">
            Please log in to continue. You&apos;ll then complete a quick onboarding to set up your account.
          </p>

          {/* Countdown */}
          <div className="bg-[#F3EAFF] dark:bg-[#A560E8]/10 border border-[#A560E8]/25 dark:border-[#A560E8]/30 rounded-2xl p-4 mb-6">
            <p className="text-[#7733B5] dark:text-[#C9A0F0] text-sm font-bold">
              Redirecting to login in {countdown} second{countdown === 1 ? '' : 's'}…
            </p>
          </div>

          {/* Manual redirect button */}
          <button
            onClick={() => onNavigate('login')}
            className="w-full inline-flex items-center justify-center rounded-2xl bg-[#A560E8] hover:bg-[#8A48C7] text-white py-3.5 font-extrabold border-2 border-b-4 border-[#7733B5] active:border-b-2 active:translate-y-0.5 transition-all"
          >
            Continue to login
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPage;
