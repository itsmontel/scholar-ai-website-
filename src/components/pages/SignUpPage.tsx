import React, { useState } from 'react';
import { WriteScholarEditorialBackgroundLayers } from '../common/WriteScholarEditorialBackground';

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
  const [textIndex, setTextIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const animatedTexts = [
    "Summarise, cite & analyse",
    "Powerful study tools for students",
    "Paper analysis & so much more",
    "Your all-in-one academic AI"
  ];

  React.useEffect(() => {
    const textInterval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % animatedTexts.length);
    }, 2000);
    return () => clearInterval(textInterval);
  }, []);

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
    <div className="relative min-h-screen flex overflow-x-hidden">
      <WriteScholarEditorialBackgroundLayers position="fixed" />
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

      {/* Left Side - Signup Form */}
      <div className="w-full lg:w-1/2 flex flex-col">
        {/* Header */}
        <div className="p-6 pt-20 sm:pt-6">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden shadow-lg shadow-violet-500/30">
              <img src="/mascot.png" alt="WriteScholar" className="w-full h-full object-contain" loading="eager" width="120" height="120" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-violet-600 dark:text-violet-400">WriteScholar</span>
          </div>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center px-6 pb-12">
          <div className="w-full max-w-sm rounded-2xl border border-stone-200/80 dark:border-stone-700/80 bg-white/80 dark:bg-stone-900/40 backdrop-blur-sm shadow-xl shadow-stone-200/40 dark:shadow-black/20 px-6 py-8 sm:px-8 sm:py-9">
            <div className="h-0.5 w-16 bg-gradient-to-r from-violet-600 to-red-400/80 rounded-full mb-6" aria-hidden />
            <div className="mb-6">
              <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-stone-800 dark:text-stone-100 mb-2">Create your account</h1>
              <p className="text-stone-500 dark:text-stone-400">Unlock your full academic toolkit</p>
            </div>

            <div className="mb-6 p-3 bg-gradient-to-r from-violet-50 to-red-50 dark:from-violet-900/20 dark:to-red-900/20 border border-violet-100 dark:border-violet-800/50 rounded-xl flex items-center gap-3">
              <div className="w-9 h-9 bg-violet-100 dark:bg-violet-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">Free study tips guide</p>
                <p className="text-xs text-violet-600 dark:text-violet-400">Get our 10-page PDF guide on signup</p>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-xl">
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

      {/* Right Side - Animated Design */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-violet-50/80 via-red-50/50 to-stone-100 dark:from-stone-900 dark:via-violet-950/30 dark:to-stone-900 flex-col items-center justify-center p-8 relative overflow-hidden rounded-l-3xl">
        {/* Background blur effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-200/20 via-red-100/20 to-stone-200/30 dark:from-violet-900/20 dark:via-red-900/10 dark:to-transparent backdrop-blur-sm rounded-l-3xl"></div>
        
        {/* Central input container */}
        <div className="relative z-10 max-w-lg w-full">
          <div className="bg-gradient-to-r from-white/70 to-white/40 dark:from-stone-800/70 dark:to-stone-800/40 backdrop-blur-xl rounded-3xl p-10 border border-violet-100/50 dark:border-stone-700 shadow-2xl shadow-violet-500/10">
            <div className="flex items-center space-x-5">
              {/* Animated text */}
              <span className="text-2xl font-semibold text-stone-700 dark:text-stone-200 flex-1 transition-all duration-700 ease-in-out">
                {animatedTexts[textIndex]}
              </span>
              
              {/* Cursor pipe */}
              <div className="w-0.5 h-8 bg-violet-500 animate-pulse rounded-full"></div>
              
              {/* Arrow button */}
              <button className="w-10 h-10 bg-violet-600 hover:bg-violet-500 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-xl shadow-violet-500/30">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 17L17 7M17 7H7M17 7V17" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        {/* Group of characters */}
        <div className="relative z-10 mt-8">
          <svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-72 h-36">
            {/* Person 1 - Woman with red hair (left) */}
            <g transform="translate(0, 0)">
              <path d="M35 80 Q30 102 35 130 L65 130 Q70 102 65 80" fill="#8B5CF6" />
              <rect x="43" y="62" width="14" height="20" fill="#FCD9B6" />
              <ellipse cx="50" cy="40" rx="22" ry="25" fill="#FCD9B6" />
              <path d="M28 34 Q24 16 38 10 Q50 3 66 10 Q78 16 74 34 Q71 25 60 20 Q50 15 40 20 Q30 25 28 34" fill="#B45309" />
              <path d="M28 34 Q20 58 28 85" fill="#B45309" />
              <path d="M72 34 Q80 58 72 85" fill="#B45309" />
              <ellipse cx="40" cy="40" rx="4" ry="5" fill="#1F2937" />
              <ellipse cx="60" cy="40" rx="4" ry="5" fill="#1F2937" />
              <circle cx="41" cy="38" r="1.5" fill="white" />
              <circle cx="61" cy="38" r="1.5" fill="white" />
              <path d="M40 52 Q50 62 60 52" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round" />
              <ellipse cx="30" cy="47" rx="5" ry="3" fill="#FECACA" opacity="0.5" />
              <ellipse cx="70" cy="47" rx="5" ry="3" fill="#FECACA" opacity="0.5" />
              <path d="M70 85 Q82 72 86 55" stroke="#FCD9B6" strokeWidth="9" fill="none" strokeLinecap="round" />
              <ellipse cx="88" cy="53" rx="6" ry="7" fill="#FCD9B6" />
            </g>
            
            {/* Person 2 - Man with glasses (center) */}
            <g transform="translate(110, -8)">
              <path d="M35 95 Q30 120 35 150 L75 150 Q80 120 75 95" fill="#3B82F6" />
              <rect x="47" y="74" width="16" height="24" fill="#E8B796" />
              <ellipse cx="55" cy="48" rx="26" ry="30" fill="#E8B796" />
              <path d="M29 40 Q26 20 40 14 Q55 6 70 14 Q84 20 81 40 Q78 28 66 21 Q55 15 44 21 Q32 28 29 40" fill="#5D4037" />
              <path d="M29 40 Q22 50 29 60" fill="#5D4037" />
              <path d="M81 40 Q88 50 81 60" fill="#5D4037" />
              <ellipse cx="42" cy="46" rx="12" ry="10" fill="none" stroke="#374151" strokeWidth="2.5" />
              <ellipse cx="68" cy="46" rx="12" ry="10" fill="none" stroke="#374151" strokeWidth="2.5" />
              <path d="M54 46 L56 46" stroke="#374151" strokeWidth="2.5" />
              <path d="M30 43 L24 40" stroke="#374151" strokeWidth="2.5" />
              <path d="M80 43 L86 40" stroke="#374151" strokeWidth="2.5" />
              <ellipse cx="42" cy="48" rx="4" ry="5" fill="#1F2937" />
              <ellipse cx="68" cy="48" rx="4" ry="5" fill="#1F2937" />
              <circle cx="43" cy="46" r="1.5" fill="white" />
              <circle cx="69" cy="46" r="1.5" fill="white" />
              <path d="M30 34 Q42 28 54 34" stroke="#5D4037" strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d="M56 34 Q68 28 80 34" stroke="#5D4037" strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d="M42 64 Q55 76 68 64" stroke="#1F2937" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <ellipse cx="28" cy="56" rx="5" ry="3" fill="#FECACA" opacity="0.4" />
              <ellipse cx="82" cy="56" rx="5" ry="3" fill="#FECACA" opacity="0.4" />
              <path d="M80 100 Q92 88 96 68" stroke="#E8B796" strokeWidth="11" fill="none" strokeLinecap="round" />
              <ellipse cx="98" cy="66" rx="7" ry="8" fill="#E8B796" />
              <path d="M45 90 L55 102 L65 90" stroke="#2563EB" strokeWidth="2" fill="none" />
            </g>
            
            {/* Person 3 - Woman with bun (right) */}
            <g transform="translate(220, 2)">
              <path d="M30 78 Q25 100 30 128 L60 128 Q65 100 60 78" fill="#10B981" />
              <rect x="38" y="60" width="14" height="20" fill="#D4A574" />
              <ellipse cx="45" cy="38" rx="22" ry="24" fill="#D4A574" />
              <path d="M23 32 Q20 15 33 10 Q45 4 60 10 Q72 15 69 32 Q65 23 54 18 Q45 14 36 18 Q26 23 23 32" fill="#1F2937" />
              <ellipse cx="45" cy="6" rx="10" ry="8" fill="#1F2937" />
              <path d="M23 32 Q16 42 23 52" fill="#1F2937" />
              <path d="M67 32 Q74 42 67 52" fill="#1F2937" />
              <ellipse cx="36" cy="38" rx="4" ry="5" fill="#1F2937" />
              <ellipse cx="54" cy="38" rx="4" ry="5" fill="#1F2937" />
              <circle cx="37" cy="36" r="1.5" fill="white" />
              <circle cx="55" cy="36" r="1.5" fill="white" />
              <path d="M28 30 Q36 26 44 30" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d="M46 30 Q54 26 62 30" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d="M35 50 Q45 60 55 50" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round" />
              <ellipse cx="25" cy="44" rx="5" ry="3" fill="#FECACA" opacity="0.5" />
              <ellipse cx="65" cy="44" rx="5" ry="3" fill="#FECACA" opacity="0.5" />
              <path d="M25 82 Q12 70 8 52" stroke="#D4A574" strokeWidth="9" fill="none" strokeLinecap="round" />
              <ellipse cx="7" cy="50" rx="6" ry="7" fill="#D4A574" />
            </g>
          </svg>
        </div>
        
        {/* Enhanced floating elements */}
        <div className="absolute top-16 left-16 w-32 h-32 bg-gradient-to-br from-violet-300/25 to-red-300/20 rounded-full animate-bounce" style={{animationDuration: '6s'}}></div>
        <div className="absolute bottom-20 right-20 w-24 h-24 bg-gradient-to-br from-red-300/25 to-violet-300/20 rounded-full animate-bounce" style={{animationDuration: '8s', animationDelay: '2s'}}></div>
        <div className="absolute top-1/3 right-12 w-20 h-20 bg-gradient-to-br from-violet-200/20 to-red-200/15 rounded-full animate-bounce" style={{animationDuration: '7s', animationDelay: '1s'}}></div>
        
        {/* Additional subtle elements */}
        <div className="absolute top-1/4 left-1/4 w-16 h-16 bg-gradient-to-br from-violet-200/15 to-red-200/10 rounded-full animate-bounce" style={{animationDuration: '5s', animationDelay: '0.5s'}}></div>
        <div className="absolute bottom-1/3 left-1/3 w-12 h-12 bg-gradient-to-br from-red-200/15 to-violet-200/10 rounded-full animate-bounce" style={{animationDuration: '4s', animationDelay: '1.5s'}}></div>
      </div>
    </div>
  );
};

export default SignUpPage;
