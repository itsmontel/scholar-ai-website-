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
  const [, setAnimationStep] = useState(0);
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
    const interval = setInterval(() => {
      setAnimationStep((prev: number) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

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
        throw new Error(data.message || 'Login failed');
      }

      // Transform user data to match expected interface
      const transformedUser = {
        id: data.data.user.id,
        email: data.data.user.email,
        name: data.data.user.firstName && data.data.user.lastName 
          ? `${data.data.user.firstName} ${data.data.user.lastName}` 
          : data.data.user.name || data.data.user.email,
        firstName: data.data.user.firstName,
        lastName: data.data.user.lastName,
        plan: data.data.user.subscriptionPlan || 'free',
        subscription_status: data.data.user.subscriptionStatus,
        email_verified: data.data.user.emailVerified
      };

      // Store token and transformed user data
      localStorage.setItem('authToken', data.data.token);
      localStorage.setItem('user', JSON.stringify(transformedUser));
      
      console.log('Login successful - transformed user data:', transformedUser);

      // Call the parent component's onLogin with the transformed user data
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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotPasswordEmail)) {
      setForgotPasswordError('Please enter a valid email address');
      return;
    }

    setForgotPasswordLoading(true);
    setForgotPasswordError('');
    setForgotPasswordMessage('');

    try {
      console.log('Sending forgot password request for:', forgotPasswordEmail);
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
      console.log('Forgot password response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send reset email');
      }

      // Show success message even if email sending failed (for security)
      setForgotPasswordMessage('Password reset link sent! Check your email inbox.');
      setForgotPasswordEmail('');
      
      // Auto-close modal after 3 seconds
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex">
      {/* Back Button - Fixed Position */}
      <button
        onClick={() => onNavigate('landing')}
        className="absolute top-4 left-4 z-50 text-gray-600 hover:text-gray-900 transition-colors group"
      >
        <div className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center group-hover:shadow-lg transition-all">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </div>
      </button>

      {/* Left Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="max-w-md w-full">
          <div className="flex items-center space-x-2 mb-6 sm:mb-8">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">W</span>
            </div>
            <span className="text-xl font-bold text-gray-900">WriteScholar</span>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Welcome back</h1>
            <p className="text-gray-600 mb-6 sm:mb-8">Sign in to continue your research journey</p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-5 sm:space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="you@university.edu"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(true);
                      setForgotPasswordEmail(formData.email);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base"
                />
              </div>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  'Log in'
                )}
              </button>
            </div>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or</span>
                </div>
              </div>
              <button
                onClick={() => {
                  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
                  window.location.href = `${apiUrl}/auth/google`;
                }}
                className="w-full mt-4 bg-gray-900 text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="white" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="white" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="white" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="white" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
            </div>

            <p className="text-center text-sm text-gray-600 mt-6">
              Don't have an account?{' '}
              <button
                onClick={() => onNavigate('signup')}
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Input Field Design */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-100 via-blue-100 to-indigo-100 items-center justify-center p-8 relative overflow-hidden rounded-l-3xl">
        {/* Background blur effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-200/40 via-blue-200/30 to-indigo-200/40 backdrop-blur-sm rounded-l-3xl"></div>
        
        {/* Central input container */}
        <div className="relative z-10 max-w-lg w-full">
          <div className="bg-gradient-to-r from-white/50 to-white/30 backdrop-blur-xl rounded-3xl p-10 border border-white/60 shadow-2xl">
            <div className="flex items-center space-x-5">
              {/* Animated text */}
              <span className="text-2xl font-light text-slate-600 flex-1 transition-all duration-700 ease-in-out">
                {animatedTexts[textIndex]}
              </span>
              
              {/* Cursor pipe */}
              <div className="w-0.5 h-8 bg-slate-500 animate-pulse"></div>
              
              {/* Arrow button */}
              <button className="w-10 h-10 bg-gradient-to-br from-slate-200/90 to-slate-300/70 hover:from-slate-300/90 hover:to-slate-400/70 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-xl hover:shadow-2xl">
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 17L17 7M17 7H7M17 7V17" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        {/* Enhanced floating elements */}
        <div className="absolute top-16 left-16 w-32 h-32 bg-gradient-to-br from-blue-300/20 to-indigo-300/15 rounded-full animate-bounce" style={{animationDuration: '6s'}}></div>
        <div className="absolute bottom-20 right-20 w-24 h-24 bg-gradient-to-br from-slate-300/20 to-blue-300/15 rounded-full animate-bounce" style={{animationDuration: '8s', animationDelay: '2s'}}></div>
        <div className="absolute top-1/3 right-12 w-20 h-20 bg-gradient-to-br from-indigo-300/20 to-slate-300/15 rounded-full animate-bounce" style={{animationDuration: '7s', animationDelay: '1s'}}></div>
        
        {/* Additional subtle elements */}
        <div className="absolute top-1/4 left-1/4 w-16 h-16 bg-gradient-to-br from-blue-200/10 to-indigo-200/5 rounded-full animate-bounce" style={{animationDuration: '5s', animationDelay: '0.5s'}}></div>
        <div className="absolute bottom-1/3 left-1/3 w-12 h-12 bg-gradient-to-br from-slate-200/10 to-blue-200/5 rounded-full animate-bounce" style={{animationDuration: '4s', animationDelay: '1.5s'}}></div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Reset Password</h3>
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setForgotPasswordError('');
                  setForgotPasswordMessage('');
                  setForgotPasswordEmail('');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-gray-600 mb-6">
              Enter your email address and we'll send you a link to reset your password.
            </p>

            {forgotPasswordError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{forgotPasswordError}</p>
              </div>
            )}

            {forgotPasswordMessage && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-600 text-sm">{forgotPasswordMessage}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  placeholder="you@university.edu"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleForgotPassword}
                  disabled={forgotPasswordLoading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {forgotPasswordLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Sending...
                    </div>
                  ) : (
                    'Send Reset Link'
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
