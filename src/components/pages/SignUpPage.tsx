import React, { useState } from 'react';
import { WriteScholarEditorialBackgroundLayers } from '../common/WriteScholarEditorialBackground';
import { AuthMarketingSide } from '../common/AuthMarketingSide';

interface SignUpPageProps {
  onNavigate: (page: string) => void;
  onSignUp: (userData?: any) => void;
}

const SignUpPage = ({ onNavigate, onSignUp }: SignUpPageProps) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
          const errorMessages = data.errors.map((err: any) => err.message).join('. ');
          throw new Error(errorMessages);
        }
        throw new Error(data.message || 'Registration failed');
      }

      setError('');
      setSuccess(true);
    } catch (error) {
      console.error('Registration error:', error);
      setError(error instanceof Error ? error.message : 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="relative isolate min-h-screen min-h-[100dvh] overflow-x-hidden">
      <WriteScholarEditorialBackgroundLayers position="fixed" />
      <div className="relative z-10 flex min-h-screen min-h-[100dvh] w-full flex-col lg:flex-row">
      {/* Back Button */}
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

      {/* Left Side - Signup Form */}
      <div className="w-full min-w-0 lg:w-1/2 flex flex-col">
        {/* Header */}
        <div className="px-4 pt-16 pb-2 sm:p-6 sm:pt-6 sm:pb-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden shadow-lg shadow-violet-500/30">
              <img src="/mascot.png" alt="WriteScholar" className="w-full h-full object-contain" loading="eager" width="120" height="120" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-violet-600 dark:text-violet-400">WriteScholar</span>
          </div>
        </div>

        {/* Form Container — align start on mobile so primary CTA (Google) stays in view */}
        <div className="flex-1 flex items-start sm:items-center justify-center px-4 pb-8 sm:px-6 sm:pb-12 min-h-0">
          <div className="w-full max-w-sm rounded-2xl border border-stone-200/80 dark:border-stone-700/80 bg-white/80 dark:bg-stone-900/40 backdrop-blur-sm shadow-xl shadow-stone-200/40 dark:shadow-black/20 px-4 py-5 sm:px-8 sm:py-9">
            <div className="h-0.5 w-16 bg-gradient-to-r from-violet-600 to-red-400/80 rounded-full mb-4 sm:mb-6" aria-hidden />
            <div className="mb-4 sm:mb-5">
              <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-stone-800 dark:text-stone-100 mb-1.5">Create your account</h1>
              <p className="text-sm text-stone-500 dark:text-stone-400">Unlock your full academic toolkit</p>
              <p className="text-xs text-violet-600/90 dark:text-violet-400/90 mt-2 leading-snug">
                Includes a free 10-page study tips PDF when you sign up.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-xl">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <p className="text-green-800 dark:text-green-100 font-medium text-sm">Account created successfully!</p>
                    <p className="text-green-700 dark:text-green-300 text-sm mt-1">
                      Please check your email (including spam folder) to verify your account.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!success && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
                    window.location.href = `${apiUrl}/auth/google`;
                  }}
                  className="w-full flex items-center justify-center px-4 py-3.5 bg-white dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-500 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors shadow-sm font-semibold text-stone-800 dark:text-stone-100"
                >
                  <svg className="w-5 h-5 mr-3 shrink-0" viewBox="0 0 24 24" aria-hidden>
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="text-sm">Continue with Google</span>
                </button>

                <div className="my-4 sm:my-5">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-stone-200 dark:border-stone-600" />
                    </div>
                    <div className="relative flex justify-center text-xs sm:text-sm">
                      <span className="px-3 bg-white/90 dark:bg-stone-900/90 text-stone-500 dark:text-stone-400">or use email</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  onKeyDown={handleKeyDown}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-600 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent focus:bg-white dark:focus:bg-stone-800 transition-all text-sm text-stone-800 dark:text-stone-100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  onKeyDown={handleKeyDown}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-600 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent focus:bg-white dark:focus:bg-stone-800 transition-all text-sm text-stone-800 dark:text-stone-100"
                />
                <p className="mt-1.5 text-xs text-stone-400 dark:text-stone-500">
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
                onClick={handleSubmit}
                disabled={isLoading || success}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 bg-violet-700 hover:bg-violet-800 dark:bg-violet-600 dark:hover:bg-violet-500 text-white font-semibold rounded-xl shadow-md shadow-violet-900/15 dark:shadow-violet-950/40 ring-1 ring-violet-900/10 dark:ring-white/10 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-md"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-stone-800 border-t-transparent rounded-full animate-spin mr-2"></div>
                    Creating account...
                  </div>
                ) : success ? (
                  'Check your email'
                ) : (
                  'Create account'
                )}
              </button>
            </div>

            <p className="text-center text-sm text-stone-500 dark:text-stone-400 mt-6">
              Already have an account?{' '}
              <button
                onClick={() => onNavigate('login')}
                className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-semibold"
              >
                Sign in
              </button>
            </p>

            <p className="text-center text-xs text-stone-400 dark:text-stone-500 mt-4">
              By creating an account, you agree to our{' '}
              <button onClick={() => onNavigate('terms')} className="text-violet-600 dark:text-violet-400 hover:underline">
                Terms
              </button>{' '}
              and{' '}
              <button onClick={() => onNavigate('privacy')} className="text-violet-600 dark:text-violet-400 hover:underline">
                Privacy Policy
              </button>
            </p>
          </div>
        </div>
      </div>

      <AuthMarketingSide />
      </div>
    </div>
  );
};

export default SignUpPage;
