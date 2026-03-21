import { useEffect, useState } from 'react';

interface EmailVerificationPageProps {
  onNavigate: (page: string) => void;
}

const EmailVerificationPage = ({ onNavigate }: EmailVerificationPageProps) => {
  const [countdown, setCountdown] = useState(3);
  const [verificationStatus, setVerificationStatus] = useState<'success' | 'error' | 'loading'>('loading');

  useEffect(() => {
    // Check URL parameters to determine verification status
    const urlParams = new URLSearchParams(window.location.search);
    const verified = urlParams.get('verified');
    const error = urlParams.get('error');

    if (verified === 'true') {
      setVerificationStatus('success');
    } else if (error) {
      setVerificationStatus('error');
    } else {
      setVerificationStatus('success'); // Default to success for now
    }
  }, []);

  useEffect(() => {
    if (verificationStatus === 'success') {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            onNavigate('login');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [onNavigate, verificationStatus]);

  if (verificationStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(180deg, #FAF8F5 0%, #F5F3F0 100%)' }}>
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
            <div className="animate-spin mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Verifying Email...</h1>
            <p className="text-gray-600">Please wait while we verify your email address.</p>
          </div>
        </div>
      </div>
    );
  }

  if (verificationStatus === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(180deg, #FAF8F5 0%, #F5F3F0 100%)' }}>
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
            {/* Error Icon */}
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>

            {/* Error Message */}
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Verification Failed
            </h1>
            
            <p className="text-gray-600 mb-6">
              Sorry, we couldn't verify your email address. The link may be invalid or expired.
            </p>

            {/* Action buttons */}
            <div className="space-y-3">
              <button
                onClick={() => onNavigate('signup')}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-[1.02] transition-all duration-300"
              >
                Try Again
              </button>
              <button
                onClick={() => onNavigate('login')}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-all duration-300"
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(180deg, #FAF8F5 0%, #F5F3F0 100%)' }}>
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
          {/* Success Icon */}
          <div className="mx-auto w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mb-6">
            <svg
              className="w-8 h-8 text-violet-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          {/* Success Message */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Email Verified Successfully!
          </h1>
          
          <p className="text-gray-600 mb-2">
            Your email has been successfully verified. Welcome to WriteScholar!
          </p>
          <p className="text-gray-500 text-sm mb-6">
            Please log in to continue. You&apos;ll then complete a quick onboarding to set up your account.
          </p>

          {/* Countdown */}
          <div className="bg-violet-50 border border-violet-200 rounded-lg p-4 mb-6">
            <p className="text-violet-800 text-sm">
              Redirecting to login in {countdown} seconds...
            </p>
          </div>

          {/* Manual redirect button */}
          <button
            onClick={() => onNavigate('login')}
            className="w-full bg-stone-900 text-white py-3 rounded-full font-semibold hover:bg-stone-800 transition-all"
          >
            Continue to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPage;
