import { useState, useEffect, type ReactNode } from 'react';
import { WriteScholarEditorialBackgroundLayers } from '../common/WriteScholarEditorialBackground';
import { AuthMarketingSide } from '../common/AuthMarketingSide';

interface ResetPasswordPageProps {
  onNavigate: (page: string) => void;
}

function ResetPasswordShell({
  children,
  onNavigate,
}: {
  children: ReactNode;
  onNavigate: (page: string) => void;
}) {
  return (
    <div className="relative isolate min-h-screen min-h-[100dvh] overflow-x-clip bg-[#FAF7FF] dark:bg-stone-950" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
      <WriteScholarEditorialBackgroundLayers position="fixed" purpleWash />
      <div className="relative z-10 flex min-h-screen min-h-[100dvh] w-full flex-col lg:flex-row">
      <button
        type="button"
        onClick={() => onNavigate('landing')}
        className="fixed top-4 left-4 sm:top-6 sm:left-6 z-50 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors group"
      >
        <div className="w-10 h-10 bg-white dark:bg-stone-800 rounded-xl border-2 border-b-4 border-stone-200 dark:border-stone-700 flex items-center justify-center group-hover:border-[#A560E8]/40 transition-all">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </div>
      </button>

      <div className="w-full min-w-0 lg:w-1/2 flex flex-col">
        <div className="p-6 pt-20 sm:pt-6">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden border-2 border-b-4 border-stone-200 dark:border-stone-700">
              <img src="/main-logo.png" alt="WriteScholar" className="w-full h-full object-contain" loading="eager" width={120} height={120} />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-[#A560E8]">WriteScholar</span>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 pb-12">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>

      <AuthMarketingSide />
      </div>
    </div>
  );
}

const ResetPasswordPage = ({ onNavigate }: ResetPasswordPageProps) => {
  const [token, setToken] = useState('');
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get('token');

    if (resetToken) {
      setToken(resetToken);
      setTokenValid(true);
    } else {
      setError('Invalid reset link. Please request a new password reset.');
      setTokenValid(false);
    }
  }, []);

  const validatePassword = (password: string) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    return password.length >= 8 && passwordRegex.test(password);
  };

  const handleSubmit = async () => {
    if (!formData.newPassword || !formData.confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!validatePassword(formData.newPassword)) {
      setError(
        'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      );
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          newPassword: formData.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Password reset failed');
      }

      setSuccess(true);

      setTimeout(() => {
        onNavigate('login');
      }, 3000);
    } catch (err) {
      console.error('Reset password error:', err);
      setError(err instanceof Error ? err.message : 'Password reset failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  if (tokenValid === false) {
    return (
      <ResetPasswordShell onNavigate={onNavigate}>
        <div className="rounded-3xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-[0_24px_70px_-34px_rgba(96,48,140,0.30)] px-6 py-8 sm:px-8 sm:py-9 text-center">
          <div className="h-1.5 w-16 rounded-full bg-gradient-to-r from-[#A560E8] to-[#8A48C7] mx-auto mb-6" aria-hidden />
          <div className="w-14 h-14 rounded-2xl bg-[#FFE8E8] dark:bg-[#FF4B4B]/10 border-2 border-b-4 border-[#FF4B4B]/40 flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-[#FF4B4B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-800 dark:text-stone-100 mb-2">Invalid reset link</h1>
          <p className="text-stone-500 dark:text-stone-400 text-sm mb-8 leading-relaxed">
            This password reset link is invalid or has expired. Request a new one from the login page.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('login')}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 bg-[#A560E8] hover:bg-[#8A48C7] text-white font-extrabold uppercase tracking-wide rounded-xl border-2 border-b-4 border-[#7733B5] active:border-b-2 active:translate-y-0.5 transition-all duration-200"
          >
            Back to login
          </button>
        </div>
      </ResetPasswordShell>
    );
  }

  if (success) {
    return (
      <ResetPasswordShell onNavigate={onNavigate}>
        <div className="rounded-3xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-[0_24px_70px_-34px_rgba(96,48,140,0.30)] px-6 py-8 sm:px-8 sm:py-9 text-center">
          <div className="h-1.5 w-16 rounded-full bg-gradient-to-r from-[#A560E8] to-[#8A48C7] mx-auto mb-6" aria-hidden />
          <div className="w-14 h-14 rounded-2xl bg-[#EAFFD6] dark:bg-[#58CC02]/10 border-2 border-b-4 border-[#58CC02]/40 flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-[#58CC02]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-800 dark:text-stone-100 mb-2">Password updated</h1>
          <p className="text-stone-500 dark:text-stone-400 text-sm mb-6 leading-relaxed">
            Your password has been reset. You will be redirected to sign in shortly.
          </p>
          <div className="rounded-xl border-2 border-[#A560E8]/30 bg-[#F3EAFF] dark:bg-[#A560E8]/10 px-4 py-3">
            <p className="text-[#8A48C7] dark:text-[#C9A0F0] text-sm font-bold">Redirecting to login in 3 seconds…</p>
          </div>
        </div>
      </ResetPasswordShell>
    );
  }

  return (
    <ResetPasswordShell onNavigate={onNavigate}>
      <div className="rounded-3xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-[0_24px_70px_-34px_rgba(96,48,140,0.30)] px-6 py-8 sm:px-8 sm:py-9">
        <div className="h-1.5 w-16 rounded-full bg-gradient-to-r from-[#A560E8] to-[#8A48C7] mb-6" aria-hidden />
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-800 dark:text-stone-100 mb-2">Reset your password</h1>
          <p className="text-stone-500 dark:text-stone-400 text-sm">Choose a new password for your account</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-[#FFE8E8] dark:bg-[#FF4B4B]/10 border-2 border-b-4 border-[#FF4B4B]/40 rounded-xl">
            <p className="text-[#FF4B4B] text-sm font-bold">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-1.5">New password</label>
            <input
              type="password"
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              onKeyDown={handleKeyDown}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-600 rounded-xl focus:border-[#A560E8] focus:ring-2 focus:ring-[#A560E8]/25 focus:bg-white dark:focus:bg-stone-800 transition-all text-sm text-stone-800 dark:text-stone-100"
            />
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1.5">
              At least 8 characters with uppercase, lowercase, number, and special character
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-1.5">Confirm password</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              onKeyDown={handleKeyDown}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-600 rounded-xl focus:border-[#A560E8] focus:ring-2 focus:ring-[#A560E8]/25 focus:bg-white dark:focus:bg-stone-800 transition-all text-sm text-stone-800 dark:text-stone-100"
            />
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 bg-[#A560E8] hover:bg-[#8A48C7] text-white font-extrabold uppercase tracking-wide rounded-xl border-2 border-b-4 border-[#7733B5] active:border-b-2 active:translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-md"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin mr-2" />
                Updating password…
              </span>
            ) : (
              'Update password'
            )}
          </button>
        </div>

        <p className="text-center text-sm text-stone-500 dark:text-stone-400 mt-6">
          Remember your password?{' '}
          <button
            type="button"
            onClick={() => onNavigate('login')}
            className="text-[#A560E8] hover:text-[#8A48C7] font-bold"
          >
            Sign in
          </button>
        </p>
      </div>
    </ResetPasswordShell>
  );
};

export default ResetPasswordPage;
