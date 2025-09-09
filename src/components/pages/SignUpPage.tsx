import React, { useState } from 'react';

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
  const [, setAnimationStep] = useState(0);
  const [textIndex, setTextIndex] = useState(0);

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

  const handleSubmit = () => {
    onSignUp(true);
    onNavigate('dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex relative">
      {/* Back Button */}
      <button
        onClick={() => onNavigate('landing')}
        className="absolute top-6 right-6 z-50 w-10 h-10 bg-white/80 hover:bg-white backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
      >
        <span className="text-lg">←</span>
      </button>
      {/* Left Side - Sign Up Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <div className="flex items-center space-x-2 mb-8">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="text-xl font-bold text-gray-900">AcademicAI</span>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create your account</h1>
            <p className="text-gray-600 mb-8">Join thousands of researchers and students</p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="you@university.edu"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <button
                onClick={handleSubmit}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-[1.02] transition-all duration-300"
              >
                Sign up
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
                onClick={handleSubmit}
                className="w-full mt-4 bg-gray-900 text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
              >
                Continue with Google
              </button>
            </div>

            <p className="text-center text-sm text-gray-600 mt-6">
              Already have an account?{' '}
              <button
                onClick={() => onNavigate('login')}
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                Sign in
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

export default SignUpPage;
