import React, { useState } from 'react';

interface LoginPageProps {
  onNavigate: (page: string) => void;
  onLogin: (userData?: any) => void;
}

const LoginPage = ({ onNavigate, onLogin }: LoginPageProps) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [textIndex, setTextIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');
  const [forgotPasswordError, setForgotPasswordError] = useState('');

  const animatedTexts = [
    "Turn good writing into great",
    "Enhance your academic papers",
    "Get instant AI feedback",
    "Improve your research quality"
  ];

  React.useEffect(() => {
    const textInterval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % animatedTexts.length);
    }, 2000);
    return () => clearInterval(textInterval);
  }, []);

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

      const transformedUser = {
        id: data.data.user.id,
        email: data.data.user.email,
        name: data.data.user.name || (data.data.user.firstName && data.data.user.lastName
          ? `${data.data.user.firstName} ${data.data.user.lastName}`
          : null) || data.data.user.email,
        firstName: data.data.user.firstName,
        lastName: data.data.user.lastName,
        plan: data.data.user.subscriptionPlan || 'free',
        subscription_status: data.data.user.subscriptionStatus,
        email_verified: data.data.user.emailVerified
      };

      localStorage.setItem('authToken', data.data.token);
      localStorage.setItem('user', JSON.stringify(transformedUser));

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
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(180deg, #FAF8F5 0%, #F5F3F0 100%)' }}>
      {/* Back Button */}
      <button
        onClick={() => onNavigate('landing')}
        className="fixed top-4 left-4 sm:top-6 sm:left-6 z-50 text-stone-600 hover:text-stone-900 transition-colors group"
      >
        <div className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center group-hover:shadow-lg transition-all border border-stone-200">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </div>
      </button>

      {/* Left Side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col">
        {/* Header */}
        <div className="p-6 pt-20 sm:pt-6">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 bg-lime-400 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-stone-900 font-bold text-lg">W</span>
            </div>
            <span className="text-xl font-bold text-stone-800">WriteScholar</span>
          </div>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center px-6 pb-12">
          <div className="w-full max-w-sm">
            <div className="mb-8">
              <h1 className="text-2xl text-stone-800 mb-2" style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 400 }}>Welcome back</h1>
              <p className="text-stone-500">Sign in to continue to WriteScholar</p>
            </div>

            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-600 text-sm">{error}</p>
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
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-lime-500 focus:border-transparent focus:bg-white transition-all text-sm"
                />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-sm font-medium text-stone-700">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(true);
                      setForgotPasswordEmail(formData.email);
                    }}
                    className="text-sm text-lime-600 hover:text-lime-700 font-medium"
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
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-lime-500 focus:border-transparent focus:bg-white transition-all text-sm"
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full bg-lime-400 hover:bg-lime-300 text-stone-900 py-3 rounded-full font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <span className="px-3 text-stone-400" style={{ background: 'linear-gradient(180deg, #FAF8F5 0%, #F5F3F0 100%)' }}>or</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
                window.location.href = `${apiUrl}/auth/google`;
              }}
              className="w-full flex items-center justify-center px-4 py-3 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-sm font-medium text-stone-700">Continue with Google</span>
            </button>

            <p className="text-center text-sm text-stone-500 mt-6">
              Don't have an account?{' '}
              <button
                onClick={() => onNavigate('signup')}
                className="text-lime-600 hover:text-lime-700 font-medium"
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Animated Design */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-stone-100 via-lime-50 to-stone-100 flex-col items-center justify-center p-8 relative overflow-hidden rounded-l-3xl">
        {/* Background blur effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-stone-200/40 via-lime-100/30 to-stone-200/40 backdrop-blur-sm rounded-l-3xl"></div>
        
        {/* Central input container */}
        <div className="relative z-10 max-w-lg w-full">
          <div className="bg-gradient-to-r from-white/50 to-white/30 backdrop-blur-xl rounded-3xl p-10 border border-white/60 shadow-2xl">
            <div className="flex items-center space-x-5">
              {/* Animated text */}
              <span className="text-2xl font-light text-stone-600 flex-1 transition-all duration-700 ease-in-out" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                {animatedTexts[textIndex]}
              </span>
              
              {/* Cursor pipe */}
              <div className="w-0.5 h-8 bg-lime-500 animate-pulse"></div>
              
              {/* Arrow button */}
              <button className="w-10 h-10 bg-lime-400 hover:bg-lime-300 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-xl hover:shadow-2xl">
                <svg className="w-5 h-5 text-stone-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="absolute top-16 left-16 w-32 h-32 bg-gradient-to-br from-lime-300/20 to-stone-300/15 rounded-full animate-bounce" style={{animationDuration: '6s'}}></div>
        <div className="absolute bottom-20 right-20 w-24 h-24 bg-gradient-to-br from-stone-300/20 to-lime-300/15 rounded-full animate-bounce" style={{animationDuration: '8s', animationDelay: '2s'}}></div>
        <div className="absolute top-1/3 right-12 w-20 h-20 bg-gradient-to-br from-lime-200/20 to-stone-300/15 rounded-full animate-bounce" style={{animationDuration: '7s', animationDelay: '1s'}}></div>
        
        {/* Additional subtle elements */}
        <div className="absolute top-1/4 left-1/4 w-16 h-16 bg-gradient-to-br from-stone-200/10 to-lime-200/5 rounded-full animate-bounce" style={{animationDuration: '5s', animationDelay: '0.5s'}}></div>
        <div className="absolute bottom-1/3 left-1/3 w-12 h-12 bg-gradient-to-br from-lime-200/10 to-stone-200/5 rounded-full animate-bounce" style={{animationDuration: '4s', animationDelay: '1.5s'}}></div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl text-stone-800" style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 400 }}>Reset password</h3>
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

            <p className="text-stone-500 text-sm mb-6">
              Enter your email and we'll send you a link to reset your password.
            </p>

            {forgotPasswordError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-600 text-sm">{forgotPasswordError}</p>
              </div>
            )}

            {forgotPasswordMessage && (
              <div className="mb-4 p-3 bg-lime-50 border border-lime-200 rounded-xl">
                <p className="text-lime-700 text-sm">{forgotPasswordMessage}</p>
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
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-lime-500 focus:border-transparent focus:bg-white transition-all text-sm"
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
                  className="flex-1 px-4 py-3 border border-stone-200 text-stone-700 rounded-full font-medium hover:bg-stone-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleForgotPassword}
                  disabled={forgotPasswordLoading}
                  className="flex-1 bg-lime-400 hover:bg-lime-300 text-stone-900 py-3 rounded-full font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
  );
};

export default LoginPage;
