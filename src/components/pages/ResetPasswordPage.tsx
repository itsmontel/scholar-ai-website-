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
    <div className="relative isolate min-h-screen min-h-[100dvh] overflow-x-hidden">
      <WriteScholarEditorialBackgroundLayers position="fixed" />
      <div className="relative z-10 flex min-h-screen min-h-[100dvh] w-full flex-col lg:flex-row">
      <button
        type="button"
        onClick={() => onNavigate('landing')}
        className="fixed top-4 left-4 sm:top-6 sm:left-6 z-50 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors group"
      >
        <div className="w-10 h-10 bg-white dark:bg-stone-800 rounded-full shadow-md flex items-center justify-center group-hover:shadow-lg transition-all border border-stone-200 dark:border-stone-700">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </div>
      </button>

      <div className="w-full min-w-0 lg:w-1/2 flex flex-col">
        <div className="p-6 pt-20 sm:pt-6">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden shadow-lg shadow-violet-500/30">
              <img src="/mascot.png" alt="WriteScholar" className="w-full h-full object-contain" loading="eager" width={120} height={120} />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-violet-600 dark:text-violet-400">WriteScholar</span>
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
        <div className="rounded-2xl border border-stone-200/80 dark:border-stone-700/80 bg-white/80 dark:bg-stone-900/40 backdrop-blur-sm shadow-xl shadow-stone-200/40 dark:shadow-black/20 px-6 py-8 sm:px-8 sm:py-9 text-center">
          <div className="h-0.5 w-16 bg-gradient-to-r from-violet-600 to-red-400/80 rounded-full mx-auto mb-6" aria-hidden />
          <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-900/30 border border-red-200/80 dark:border-red-800/50 flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-stone-800 dark:text-stone-100 mb-2">Invalid reset link</h1>
          <p className="text-stone-500 dark:text-stone-400 text-sm mb-8 leading-relaxed">
            This password reset link is invalid or has expired. Request a new one from the login page.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('login')}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 bg-violet-700 hover:bg-violet-800 dark:bg-violet-600 dark:hover:bg-violet-500 text-white font-semibold rounded-xl shadow-md shadow-violet-900/15 dark:shadow-violet-950/40 ring-1 ring-violet-900/10 dark:ring-white/10 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
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
        <div className="rounded-2xl border border-stone-200/80 dark:border-stone-700/80 bg-white/80 dark:bg-stone-900/40 backdrop-blur-sm shadow-xl shadow-stone-200/40 dark:shadow-black/20 px-6 py-8 sm:px-8 sm:py-9 text-center">
          <div className="h-0.5 w-16 bg-gradient-to-r from-violet-600 to-red-400/80 rounded-full mx-auto mb-6" aria-hidden />
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/25 border border-emerald-200/80 dark:border-emerald-800/50 flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-stone-800 dark:text-stone-100 mb-2">Password updated</h1>
          <p className="text-stone-500 dark:text-stone-400 text-sm mb-6 leading-relaxed">
            Your password has been reset. You will be redirected to sign in shortly.
          </p>
          <div className="rounded-xl border border-violet-200/80 dark:border-violet-800/40 bg-violet-50/80 dark:bg-violet-950/30 px-4 py-3">
            <p className="text-violet-800 dark:text-violet-200 text-sm font-medium">Redirecting to login in 3 seconds…</p>
          </div>
        </div>
      </ResetPasswordShell>
    );
  }

  return (
    <ResetPasswordShell onNavigate={onNavigate}>
      <div className="rounded-2xl border border-stone-200/80 dark:border-stone-700/80 bg-white/80 dark:bg-stone-900/40 backdrop-blur-sm shadow-xl shadow-stone-200/40 dark:shadow-black/20 px-6 py-8 sm:px-8 sm:py-9">
        <div className="h-0.5 w-16 bg-gradient-to-r from-violet-600 to-red-400/80 rounded-full mb-6" aria-hidden />
        <div className="mb-8">
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-stone-800 dark:text-stone-100 mb-2">Reset your password</h1>
          <p className="text-stone-500 dark:text-stone-400 text-sm">Choose a new password for your account</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">New password</label>
            <input
              type="password"
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              onKeyDown={handleKeyDown}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-600 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent focus:bg-white dark:focus:bg-stone-800 transition-all text-sm text-stone-800 dark:text-stone-100"
            />
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1.5">
              At least 8 characters with uppercase, lowercase, number, and special character
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">Confirm password</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              onKeyDown={handleKeyDown}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-600 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent focus:bg-white dark:focus:bg-stone-800 transition-all text-sm text-stone-800 dark:text-stone-100"
            />
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 bg-violet-700 hover:bg-violet-800 dark:bg-violet-600 dark:hover:bg-violet-500 text-white font-semibold rounded-xl shadow-md shadow-violet-900/15 dark:shadow-violet-950/40 ring-1 ring-violet-900/10 dark:ring-white/10 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-md"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <span className="w-5 h-5 border-2 border-stone-800 border-t-transparent rounded-full animate-spin mr-2" />
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
            className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-semibold"
          >
            Sign in
          </button>
        </p>
      </div>
    </ResetPasswordShell>
  );
};

export default ResetPasswordPage;
