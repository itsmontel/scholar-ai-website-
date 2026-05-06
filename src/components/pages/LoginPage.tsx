import React, { useState } from 'react';
import { WriteScholarEditorialBackgroundLayers } from '../common/WriteScholarEditorialBackground';
import { AuthMarketingSide } from '../common/AuthMarketingSide';

interface LoginPageProps {
  onNavigate: (page: string) => void;
  onLogin: (userData?: any) => void;
}

const LoginPage = ({ onNavigate, onLogin }: LoginPageProps) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');
  const [forgotPasswordError, setForgotPasswordError] = useState('');

  const handleSubmit = async () => {
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/auth/login`, {
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
        throw new Error(data.message || 'Login failed');
      }

      const u = data.data.user;
      const transformedUser = {
        id: u.id,
        email: u.email,
        username: u.username,
        name: u.name || (u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : null) || u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        plan: u.subscriptionPlan || 'free',
        subscription_status: u.subscriptionStatus,
        email_verified: u.emailVerified,
        onboardingCompleted: u.onboardingCompleted === true,
        welcomeTutorialCompleted: u.welcomeTutorialCompleted === true
      };

      localStorage.setItem('authToken', data.data.token);
      localStorage.setItem('user', JSON.stringify(transformedUser));
      window.dispatchEvent(new CustomEvent('writescholar-auth-changed'));

      onLogin(transformedUser);
      onNavigate('dashboard');
    } catch (error) {
      console.error('Login error:', error);
      setError(error instanceof Error ? error.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail) {
      setForgotPasswordError('Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotPasswordEmail)) {
      setForgotPasswordError('Please enter a valid email address');
      return;
    }

    setForgotPasswordLoading(true);
    setForgotPasswordError('');
    setForgotPasswordMessage('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: forgotPasswordEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send reset email');
      }

      setForgotPasswordMessage('Password reset link sent! Check your email inbox.');
      setForgotPasswordEmail('');
      
      setTimeout(() => {
        setShowForgotPassword(false);
        setForgotPasswordMessage('');
      }, 3000);

    } catch (error) {
      console.error('Forgot password error:', error);
      setForgotPasswordError(error instanceof Error ? error.message : 'Failed to send reset email. Please try again.');
    } finally {
      setForgotPasswordLoading(false);
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
        onClick={() => onNavigate('landing')}
        className="fixed top-4 left-4 sm:top-6 sm:left-6 z-50 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors group"
      >
        <div className="w-10 h-10 bg-white dark:bg-stone-800 rounded-full shadow-md flex items-center justify-center group-hover:shadow-lg transition-all border border-stone-200 dark:border-stone-700">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </div>
      </button>

      {/* Left Side - Login Form */}
      <div className="w-full min-w-0 lg:w-1/2 flex flex-col">
        {/* Header */}
        <div className="p-6 pt-20 sm:pt-6">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden shadow-lg shadow-violet-500/30">
              <img src="/main-logo.png" alt="WriteScholar" className="w-full h-full object-contain" loading="eager" width="120" height="120" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-violet-600 dark:text-violet-400">WriteScholar</span>
          </div>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center px-6 pb-12">
          <div className="relative w-full max-w-sm rounded-2xl border border-stone-200/80 dark:border-stone-700/80 bg-white/80 dark:bg-stone-900/40 backdrop-blur-sm shadow-xl shadow-stone-200/40 dark:shadow-black/20 px-6 py-8 sm:px-8 sm:py-9">
            {/* Dancing mascot — top-right of the form card, welcoming you back */}
            <img
              src="/mascot-dance.webp"
              alt=""
              aria-hidden
              loading="lazy"
              decoding="async"
              className="pointer-events-none absolute -top-10 -right-3 sm:-top-12 sm:-right-4 w-20 sm:w-24 h-auto z-10 drop-shadow-[0_14px_24px_rgba(124,58,237,0.32)]"
            />
            <div className="h-0.5 w-16 bg-gradient-to-r from-violet-600 to-red-400/80 rounded-full mb-6" aria-hidden />
            <div className="mb-8">
              <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-stone-800 dark:text-stone-100 mb-2">Welcome back</h1>
              <p className="text-stone-500 dark:text-stone-400">Sign in to continue to WriteScholar</p>
            </div>

            {error && (
              <p className="mb-4 text-red-600 dark:text-red-400 text-sm font-medium">{error}</p>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">Email</label>
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
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(true);
                      setForgotPasswordEmail(formData.email);
                    }}
                    className="text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-medium"
                  >
                    Forgot?
                  </button>
                </div>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  onKeyDown={handleKeyDown}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-600 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent focus:bg-white dark:focus:bg-stone-800 transition-all text-sm text-stone-800 dark:text-stone-100"
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 bg-violet-700 hover:bg-violet-800 dark:bg-violet-600 dark:hover:bg-violet-500 text-white font-semibold rounded-xl shadow-md shadow-violet-900/15 dark:shadow-violet-950/40 ring-1 ring-violet-900/10 dark:ring-white/10 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-md"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-stone-800 border-t-transparent rounded-full animate-spin mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>

            <div className="my-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-stone-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-gradient-to-b from-violet-50/80 via-stone-50 to-white dark:from-stone-950 dark:via-stone-900 dark:to-stone-900 text-stone-400">or</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
                window.location.href = `${apiUrl}/auth/google`;
              }}
              className="w-full flex items-center justify-center px-4 py-3 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-600 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Continue with Google</span>
            </button>

            <p className="text-center text-sm text-stone-500 dark:text-stone-400 mt-6">
              Don't have an account?{' '}
              <button
                onClick={() => onNavigate('signup')}
                className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-semibold"
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>

      <AuthMarketingSide />

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-stone-800 rounded-2xl p-6 max-w-md w-full border border-stone-200 dark:border-stone-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-stone-800 dark:text-stone-100">Reset password</h3>
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setForgotPasswordError('');
                  setForgotPasswordMessage('');
                  setForgotPasswordEmail('');
                }}
                className="text-stone-400 hover:text-stone-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-stone-500 dark:text-stone-400 text-sm mb-6">
              Enter your email and we'll send you a link to reset your password.
            </p>

            {forgotPasswordError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <p className="text-red-600 dark:text-red-400 text-sm">{forgotPasswordError}</p>
              </div>
            )}

            {forgotPasswordMessage && (
              <div className="mb-4 p-3 bg-violet-50 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-700 rounded-xl">
                <p className="text-violet-700 dark:text-violet-300 text-sm">{forgotPasswordMessage}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm text-stone-800 dark:text-stone-100"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotPasswordError('');
                    setForgotPasswordMessage('');
                    setForgotPasswordEmail('');
                  }}
                  className="flex-1 px-4 py-3 border border-stone-200 dark:border-stone-600 text-stone-700 dark:text-stone-300 rounded-2xl font-medium hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleForgotPassword}
                  disabled={forgotPasswordLoading}
                  className="flex-1 bg-violet-600 hover:bg-violet-500 text-white py-3 rounded-2xl font-bold shadow-lg shadow-violet-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {forgotPasswordLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-stone-800 border-t-transparent rounded-full animate-spin mr-2"></div>
                      Sending...
                    </div>
                  ) : (
                    'Send link'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default LoginPage;
