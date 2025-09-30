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
      const response = await fetch('http://localhost:3001/api/auth/login', {
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

      // Store token and user data
      localStorage.setItem('authToken', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));

      // Call the parent component's onLogin with the actual user data
      onLogin(data.data.user);
      onNavigate('dashboard');
    } catch (error) {
      console.error('Login error:', error);
      setError(error instanceof Error ? error.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex">
      {/* Left Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="max-w-md w-full">
          <div className="flex items-center space-x-2 mb-6 sm:mb-8">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">W</span>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
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
                onClick={() => setError('Google authentication not implemented yet')}
                className="w-full mt-4 bg-gray-900 text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
              >
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
    </div>
  );
};

export default LoginPage;
