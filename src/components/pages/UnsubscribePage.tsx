import React, { useCallback, useEffect, useRef, useState } from 'react';
import Footer from '../common/Footer';
import { WriteScholarEditorialBackgroundLayers } from '../common/WriteScholarEditorialBackground';

interface UnsubscribePageProps {
  onNavigate: (page: string) => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const UnsubscribePage = ({ onNavigate }: UnsubscribePageProps) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const autoStartedRef = useRef(false);

  const unsubscribe = useCallback(async (targetEmail: string) => {
    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch(`${API_URL}/email-subscriptions/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: targetEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to unsubscribe');
      }

      setSuccess(true);
      setEmail('');
      try {
        window.history.replaceState({}, '', '/unsubscribe?success=1');
      } catch {
        /* ignore */
      }
    } catch (err) {
      console.error('Unsubscribe error:', err);
      setError(err instanceof Error ? err.message : 'Failed to unsubscribe. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoStartedRef.current) return;

    const params = new URLSearchParams(window.location.search);
    const successParam = params.get('success');
    const errorParam = params.get('error');
    const emailParam = params.get('email')?.trim() ?? '';

    if (successParam === '1') {
      setSuccess(true);
      autoStartedRef.current = true;
      return;
    }

    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      autoStartedRef.current = true;
      return;
    }

    if (!emailParam) return;

    autoStartedRef.current = true;
    setEmail(emailParam);

    if (!EMAIL_REGEX.test(emailParam)) {
      setError('This unsubscribe link looks invalid. Enter your email below instead.');
      return;
    }

    void unsubscribe(emailParam);
  }, [unsubscribe]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (!EMAIL_REGEX.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    await unsubscribe(email);
  };

  return (
    <div className="relative min-h-screen flex flex-col overflow-x-clip">
      <WriteScholarEditorialBackgroundLayers position="fixed" />
      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-2 sm:px-8 md:px-16 py-4 sm:py-6 backdrop-blur-sm bg-white/80 dark:bg-stone-950/70 border-b border-stone-200/70 dark:border-stone-800">
        <button onClick={() => onNavigate('landing')} className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden border-2 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 flex items-center justify-center shrink-0">
            <img src="/main-logo.png" alt="" aria-hidden className="w-[85%] h-[85%] object-contain" />
          </div>
          <span className="text-lg sm:text-2xl font-extrabold tracking-tight text-[#A560E8]" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>WriteScholar</span>
        </button>
        <button
          onClick={() => onNavigate('landing')}
          className="text-stone-600 dark:text-stone-300 hover:text-[#8A48C7] dark:hover:text-[#C9A0F0] transition-colors font-bold px-2 sm:px-4 py-2 rounded-xl hover:bg-stone-100/60 dark:hover:bg-stone-800/60 text-sm sm:text-base"
        >
          Back to Home
        </button>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          <div className="bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl rounded-3xl border-2 border-b-4 border-stone-200 dark:border-stone-700 shadow-[0_18px_44px_-18px_rgba(96,48,140,0.35)] p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-[#A560E8] to-[#7733B5] rounded-2xl flex items-center justify-center shadow-[0_12px_26px_-10px_rgba(165,96,232,0.6)] mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-50 mb-2" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
                Unsubscribe from emails
              </h1>
              <p className="text-stone-600 dark:text-stone-400 text-sm sm:text-base font-medium">
                {isLoading
                  ? 'Unsubscribing you now…'
                  : 'We&apos;re sorry to see you go. Enter your email address to unsubscribe from our marketing emails.'}
              </p>
            </div>

            {success ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-[#E8F8DD] dark:bg-[#58CC02]/15 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-[#3E8E00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-extrabold text-stone-900 dark:text-stone-50 mb-2" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>Successfully unsubscribed</h2>
                <p className="text-stone-600 dark:text-stone-400 font-medium mb-6">
                  You have been unsubscribed from our marketing emails. You will no longer receive promotional emails from WriteScholar.
                </p>
                <button
                  onClick={() => {
                    setSuccess(false);
                    setEmail('');
                    try {
                      window.history.replaceState({}, '', '/unsubscribe');
                    } catch {
                      /* ignore */
                    }
                  }}
                  className="text-[#A560E8] hover:text-[#7733B5] font-extrabold"
                >
                  Unsubscribe another email
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-4 bg-[#FFE8E8] dark:bg-[#FF4B4B]/10 border border-[#FF4B4B]/30 rounded-2xl">
                    <p className="text-[#E04343] text-sm font-bold">{error}</p>
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-2">
                    Email address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full px-4 py-3 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 border-2 border-stone-200 dark:border-stone-700 rounded-2xl focus:ring-4 focus:ring-[#A560E8]/30 focus:border-[#A560E8] outline-none transition-all"
                    required
                    disabled={isLoading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full inline-flex items-center justify-center rounded-2xl bg-[#A560E8] hover:bg-[#8A48C7] text-white py-3.5 px-6 font-extrabold border-2 border-b-4 border-[#7733B5] active:border-b-2 active:translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Unsubscribing…
                    </span>
                  ) : (
                    'Unsubscribe'
                  )}
                </button>
              </form>
            )}

            <div className="mt-6 pt-6 border-t border-stone-200 dark:border-stone-800">
              <p className="text-xs text-stone-500 dark:text-stone-500 text-center leading-relaxed">
                By unsubscribing, you will no longer receive promotional emails from WriteScholar.
                You may still receive important account-related emails.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default UnsubscribePage;
