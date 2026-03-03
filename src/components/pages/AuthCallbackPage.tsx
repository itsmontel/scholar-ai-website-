import React, { useEffect, useState } from 'react';

interface AuthCallbackPageProps {
  onNavigate: (page: string) => void;
  onLogin: (userData: any) => void;
}

const AuthCallbackPage: React.FC<AuthCallbackPageProps> = ({ onNavigate, onLogin }) => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check for error in query string
        const urlParams = new URLSearchParams(window.location.search);
        const errorParam = urlParams.get('error');

        if (errorParam) {
          setError('Authentication failed. Please try again.');
          setStatus('error');
          return;
        }

        // Read user data from URL fragment (more secure - not sent to server/Referer)
        // Token is now in httpOnly cookie, not in URL
        const hash = window.location.hash.substring(1); // Remove the '#'
        const hashParams = new URLSearchParams(hash);
        const userParam = hashParams.get('user');

        // Also check query string for backward compatibility (in case backend sends ?user= instead of #user=)
        const userParamQuery = urlParams.get('user');
        // Also check for token in query string (old format) - if present, try to fetch user from /auth/me
        const tokenParam = urlParams.get('token');
        
        let finalUserParam = userParam || userParamQuery;

        // Debug logging
        console.log('AuthCallback - URL:', window.location.href);
        console.log('AuthCallback - Hash:', window.location.hash);
        console.log('AuthCallback - userParam from hash:', userParam);
        console.log('AuthCallback - userParam from query:', userParamQuery);
        console.log('AuthCallback - tokenParam:', tokenParam ? 'present' : 'not present');

        // If we have a token but no user data, try to fetch user from /auth/me
        // This handles the case where the cookie was set but user data wasn't in the URL
        if (!finalUserParam && !tokenParam) {
          // Try to fetch current user from the server (cookie should be set)
          try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
            const response = await fetch(`${apiUrl}/auth/me`, {
              credentials: 'include'
            });
            
            if (response.ok) {
              const data = await response.json();
              if (data.success && data.data?.user) {
                console.log('AuthCallback - Fetched user from /auth/me:', data.data.user);
                const userData = {
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
                
                localStorage.setItem('user', JSON.stringify(userData));
                window.history.replaceState(null, '', window.location.pathname);
                onLogin(userData);
                setStatus('success');
                setTimeout(() => {
                  onNavigate('dashboard');
                }, 1500);
                return;
              }
            }
          } catch (fetchError) {
            console.log('AuthCallback - Could not fetch user from /auth/me:', fetchError);
          }
        }

        if (!finalUserParam) {
          // If user is already logged in (has user data in localStorage), redirect to dashboard
          const existingUser = localStorage.getItem('user');
          if (existingUser) {
            console.log('AuthCallback - User already logged in, redirecting to dashboard');
            onNavigate('dashboard');
            return;
          }
          
          setError('Invalid authentication response. Please try logging in again.');
          setStatus('error');
          return;
        }

        // Parse user data
        const userData = JSON.parse(decodeURIComponent(finalUserParam));

        // Store user data only (token is in httpOnly cookie, not accessible to JS)
        localStorage.setItem('user', JSON.stringify(userData));

        // Clear the URL fragment immediately for security
        window.history.replaceState(null, '', window.location.pathname);

        // Call the parent component's onLogin
        onLogin(userData);
        setStatus('success');

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          onNavigate('dashboard');
        }, 1500);

      } catch (error) {
        console.error('Auth callback error:', error);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="flex items-center space-x-2 justify-center mb-8">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">W</span>
          </div>
          <span className="text-xl font-bold text-gray-900">WriteScholar</span>
        </div>

        {status === 'loading' && (
          <div>
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
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
            <p className="text-gray-600">Redirecting you to your dashboard...</p>
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
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-[1.02] transition-all duration-300"
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

