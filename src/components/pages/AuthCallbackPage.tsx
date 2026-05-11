import React, { useEffect, useRef, useState } from 'react';
import ScholarMascot from '../common/ScholarMascot';
import { WriteScholarEditorialBackgroundLayers } from '../common/WriteScholarEditorialBackground';

interface AuthCallbackPageProps {
  onNavigate: (page: string) => void;
  onLogin: (userData: any) => void;
}

const AuthCallbackPage: React.FC<AuthCallbackPageProps> = ({ onNavigate, onLogin }) => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;

    const handleAuthCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const userParam = urlParams.get('user');
        const errorParam = urlParams.get('error');

        if (token && userParam) {
          processedRef.current = true;
          const userData = JSON.parse(decodeURIComponent(userParam));

          localStorage.setItem('authToken', token);
          window.dispatchEvent(new CustomEvent('writescholar-auth-changed'));
          setStatus('success');
          window.history.replaceState(null, '', '/auth/callback');

          let onboardingCompleted = userData.onboardingCompleted === true;
          let welcomeTutorialCompleted = userData.welcomeTutorialCompleted === true;

          try {
            const meRes = await fetch(
              `${(import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api'}/auth/me`,
              { headers: { 'Authorization': `Bearer ${token}` } }
            );
            if (meRes.ok) {
              const meData = await meRes.json();
              const meUser = meData.data?.user;
              if (meUser) {
                onboardingCompleted = meUser.onboardingCompleted === true || onboardingCompleted;
                welcomeTutorialCompleted = meUser.welcomeTutorialCompleted === true || welcomeTutorialCompleted;
              }
              if (meData.data?.achievements) {
                const { mergeFromServer } = await import('../../data/achievements');
                mergeFromServer(
                  meData.data.achievements.stats || {},
                  meData.data.achievements.unlockedBadges || {}
                );
              }
            }
          } catch (_e) {
            // Network error — use OAuth payload values
          }

          const finalUser = { ...userData, onboardingCompleted, welcomeTutorialCompleted };
          localStorage.setItem('user', JSON.stringify(finalUser));
          onLogin(finalUser);

          setTimeout(() => onNavigate(onboardingCompleted ? 'dashboard' : 'onboarding'), 800);
          return;
        }

        // React Strict Mode re-run after replaceState cleared params
        if (!token && !userParam && localStorage.getItem('authToken')) {
          processedRef.current = true;
          setStatus('success');
          const storedUser = localStorage.getItem('user');
          let nextPage = 'dashboard';
          if (storedUser) {
            try {
              const p = JSON.parse(storedUser);
              nextPage = p.onboardingCompleted === true ? 'dashboard' : 'onboarding';
            } catch (_) {}
          }
          setTimeout(() => onNavigate(nextPage), 300);
          return;
        }

        if (errorParam) {
          setError('Authentication failed. Please try again.');
          setStatus('error');
          return;
        }

        setError('Invalid authentication response.');
        setStatus('error');
      } catch (err) {
        console.error('Auth callback error:', err);
        setError('Failed to process authentication.');
        setStatus('error');
      }
    };

    handleAuthCallback();
  }, [onLogin, onNavigate]);

  const handleRetry = () => {
    onNavigate('login');
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-x-clip">
      <WriteScholarEditorialBackgroundLayers position="fixed" />
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <ScholarMascot size={40} animated={false} pose="waving" />
          <span className="text-xl font-bold text-gray-900">WriteScholar</span>
        </div>

        {status === 'loading' && (
          <div>
            <div className="w-16 h-16 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Completing Sign In</h2>
            <p className="text-gray-600">Please wait while we set up your account...</p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome to WriteScholar!</h2>
            <p className="text-gray-600">Redirecting you to get started...</p>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Failed</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={handleRetry}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-[1.02] transition-all duration-300"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCallbackPage;

