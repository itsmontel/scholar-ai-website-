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
    <div className="relative isolate min-h-screen min-h-[100dvh] overflow-x-hidden bg-stone-50 dark:bg-stone-950" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
      <WriteScholarEditorialBackgroundLayers position="fixed" />
      <div className="relative z-10 flex min-h-screen min-h-[100dvh] w-full flex-col lg:flex-row">
      {/* Back Button */}
      <button
        onClick={() => onNavigate('landing')}
        className="fixed top-4 left-4 sm:top-6 sm:left-6 z-50 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors group"
      >
        <div className="w-10 h-10 bg-white dark:bg-stone-800 rounded-xl border-2 border-b-4 border-stone-200 dark:border-stone-700 flex items-center justify-center group-hover:border-[#58CC02]/40 transition-all">
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
            <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden border-2 border-b-4 border-stone-200 dark:border-stone-700">
              <img src="/main-logo.png" alt="WriteScholar" className="w-full h-full object-contain" loading="eager" width="120" height="120" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-[#A560E8]">WriteScholar</span>
          </div>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center px-6 pb-12">
          <div className="relative w-full max-w-sm rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-6 py-8 sm:px-8 sm:py-9">
            {/* Dancing mascot — top-right of the form card, welcoming you back */}
            <img
              src="/mascot-dance.webp"
              alt=""
              aria-hidden
              loading="lazy"
              decoding="async"
              className="pointer-events-none absolute -top-10 -right-3 sm:-top-12 sm:-right-4 w-20 sm:w-24 h-auto z-10 drop-shadow-[0_14px_24px_rgba(88,204,2,0.35)]"
            />
            <div className="h-1 w-16 bg-[#58CC02] rounded-full mb-6" aria-hidden />
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-800 dark:text-stone-100 mb-2">Welcome back</h1>
              <p className="text-stone-500 dark:text-stone-400">Sign in to continue to WriteScholar</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-[#FFE8E8] dark:bg-[#FF4B4B]/10 border-2 border-b-4 border-[#FF4B4B]/40 rounded-xl"><p className="text-[#FF4B4B] text-sm font-bold">{error}</p></div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-1.5">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  onKeyDown={handleKeyDown}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-600 rounded-xl focus:border-[#1CB0F6] focus:ring-2 focus:ring-[#1CB0F6]/20 focus:bg-white dark:focus:bg-stone-800 transition-all text-sm text-stone-800 dark:text-stone-100"
                />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-sm font-bold text-stone-700 dark:text-stone-300">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(true);
                      setForgotPasswordEmail(formData.email);
                    }}
                    className="text-sm text-[#1CB0F6] hover:text-[#1899D6] font-bold"
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
                  className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-600 rounded-xl focus:border-[#1CB0F6] focus:ring-2 focus:ring-[#1CB0F6]/20 focus:bg-white dark:focus:bg-stone-800 transition-all text-sm text-stone-800 dark:text-stone-100"
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 bg-[#A560E8] hover:bg-[#9450D8] text-white font-extrabold uppercase tracking-wide rounded-xl border-2 border-b-4 border-[#8A48C7] active:border-b-2 active:translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin mr-2"></div>
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
                  <div className="w-full border-t-2 border-stone-200 dark:border-stone-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white dark:bg-stone-900 text-stone-400 font-bold">or</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
                window.location.href = `${apiUrl}/auth/google`;
              }}
              className="w-full flex items-center justify-center px-4 py-3 bg-white dark:bg-stone-800 border-2 border-b-4 border-stone-200 dark:border-stone-600 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-700 active:border-b-2 active:translate-y-0.5 transition-all"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-sm font-bold text-stone-700 dark:text-stone-300">Continue with Google</span>
            </button>

            <p className="text-center text-sm text-stone-500 dark:text-stone-400 mt-6">
              Don't have an account?{' '}
              <button
                onClick={() => onNavigate('signup')}
                className="text-[#1CB0F6] hover:text-[#1899D6] font-bold"
              >
                Sign up
              </button>
            </p>

            {/* TODO: Remove — dev-only test buttons */}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => onNavigate('welcome-onboarding')}
                className="flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wide text-stone-400 border-2 border-dashed border-stone-300 hover:border-[#A560E8] hover:text-[#A560E8] transition-all"
              >
                🧪 Pre-Signup
              </button>
              <button
                type="button"
                onClick={() => onNavigate('onboarding')}
                className="flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wide text-stone-400 border-2 border-dashed border-stone-300 hover:border-[#58CC02] hover:text-[#58CC02] transition-all"
              >
                🧪 Post-Signup
              </button>
            </div>
          </div>
        </div>
      </div>

      <AuthMarketingSide />

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-stone-800 rounded-2xl p-6 max-w-md w-full border-2 border-b-4 border-stone-200 dark:border-stone-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-extrabold text-stone-800 dark:text-stone-100">Reset password</h3>
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
              <div className="mb-4 p-3 bg-[#FFE8E8] dark:bg-[#FF4B4B]/10 border-2 border-[#FF4B4B]/40 rounded-xl">
                <p className="text-[#FF4B4B] text-sm font-bold">{forgotPasswordError}</p>
              </div>
            )}

            {forgotPasswordMessage && (
              <div className="mb-4 p-3 bg-[#EAFFD6] dark:bg-[#58CC02]/10 border-2 border-[#58CC02]/40 rounded-xl">
                <p className="text-[#58CC02] dark:text-[#6EE020] text-sm font-bold">{forgotPasswordMessage}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-700 border-2 border-stone-200 dark:border-stone-600 rounded-xl focus:border-[#1CB0F6] focus:ring-2 focus:ring-[#1CB0F6]/20 text-sm text-stone-800 dark:text-stone-100"
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
                  className="flex-1 px-4 py-3 border-2 border-b-4 border-stone-200 dark:border-stone-600 text-stone-700 dark:text-stone-300 rounded-xl font-bold uppercase tracking-wide hover:bg-stone-50 dark:hover:bg-stone-700 active:border-b-2 active:translate-y-0.5 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleForgotPassword}
                  disabled={forgotPasswordLoading}
                  className="flex-1 bg-[#A560E8] hover:bg-[#9450D8] text-white py-3 rounded-xl font-extrabold uppercase tracking-wide border-2 border-b-4 border-[#8A48C7] active:border-b-2 active:translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {forgotPasswordLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin mr-2"></div>
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
