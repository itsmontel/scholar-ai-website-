import { useState, useEffect } from 'react';

// Import all page components
import LandingPage from './pages/LandingPage';
import SignUpPage from './pages/SignUpPage';
import LoginPage from './pages/LoginPage';
import EmailVerificationPage from './pages/EmailVerificationPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import DashboardPage from './pages/DashboardPage';
import AnalysisPage from './pages/AnalysisPage';
import AnalysisHistoryPage from './pages/AnalysisHistoryPage';
import CitationResultsPage from './pages/CitationResultsPage';
import CitationHistoryPage from './pages/CitationHistoryPage';
import UploadPage from './pages/UploadPage';
import SettingsPage from './pages/SettingsPage';
import AccountPage from './pages/AccountPage';
import PricingPage from './pages/PricingPage';
import FeaturesPage from './pages/FeaturesPage';
import ProfilePage from './pages/ProfilePage';
import LibraryPage from './pages/LibraryPage';
import FAQPage from './pages/HelpCenterPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import BillingPage from './pages/BillingPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import UnsubscribePage from './pages/UnsubscribePage';

// Import common components
import ErrorBoundary from './common/ErrorBoundary';
import PromoBanner from './common/PromoBanner';

// Type definitions
interface User {
  id: string;
  name: string;
  email: string;
  firstName?: string;
  lastName?: string;
  plan: string;
  subscription_status?: string;
  email_verified?: boolean;
}

interface NavigationProps {
  onNavigate: (page: string) => void;
}


interface UserProps extends NavigationProps {
  user: User | null;
  onLogout?: () => void;
}

// Main Application Component
const AcademicAIApp = () => {
  const [currentPage, setCurrentPage] = useState('landing');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Initialize user state from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('user');
        if (token && userData) {
          const parsedUser = JSON.parse(userData);
          console.log('Initializing user state from localStorage:', parsedUser);
          setIsLoggedIn(true);
          setUser(parsedUser);
        }
      } catch (error) {
        console.error('Error parsing initial user data:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      }
    }
  }, []);

  // Route protection for authenticated pages
  const protectedRoutes = ['dashboard', 'analysis', 'analysis-history', 'citation-results', 'citation-history', 'upload', 'settings', 'profile', 'library', 'account', 'billing'];

  // Validate and refresh token if needed
  const validateAndRefreshToken = async () => {
    try {
      console.log('Validating token...');
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.log('No token found, skipping validation');
        return;
      }

      // Use bulletproof API for token validation
      const { BulletproofAPI } = await import('../config/api');
      const response = await BulletproofAPI.get('/auth/me', token);

      console.log('Token validation response status:', response.status);
      if (response.status === 401) {
        // Token expired, try to refresh
        console.log('Token expired, attempting refresh...');
        const refreshResponse = await BulletproofAPI.post('/auth/refresh', {}, token);

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          localStorage.setItem('authToken', refreshData.data.token);
          console.log('Token refreshed successfully');
          
          // After successful refresh, get updated user data
          const userResponse = await BulletproofAPI.get('/auth/me', refreshData.data.token);
          
          if (userResponse.ok) {
            const userData = await userResponse.json();
            if (userData.data && userData.data.user && userData.data.user.email) {
              const updatedUser = {
                id: userData.data.user.id,
                email: userData.data.user.email,
                name: userData.data.user.firstName && userData.data.user.lastName 
                  ? `${userData.data.user.firstName} ${userData.data.user.lastName}` 
                  : userData.data.user.name || userData.data.user.email,
                firstName: userData.data.user.firstName,
                lastName: userData.data.user.lastName,
                plan: userData.data.user.subscriptionPlan || 'free',
                subscription_status: userData.data.user.subscriptionStatus,
                email_verified: userData.data.user.emailVerified
              };
              setUser(updatedUser);
              localStorage.setItem('user', JSON.stringify(updatedUser));
              console.log('User data updated after token refresh:', updatedUser);
            } else {
              console.log('Invalid user data after token refresh, keeping existing user data');
            }
          }
        } else {
          // Refresh failed - but DON'T clear auth state immediately
          // Keep user logged in with cached data for better UX
          console.log('Token refresh failed, but keeping user logged in with cached data');
          
          // Only clear if we're on a protected route and have no cached user data
          const cachedUser = localStorage.getItem('user');
          if (!cachedUser && protectedRoutes.includes(currentPage)) {
            console.log('No cached user data and on protected route, clearing auth state');
            setIsLoggedIn(false);
            setUser(null);
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            setCurrentPage('login');
          }
        }
      } else if (response.ok) {
        const userData = await response.json();
        // Update user data from server
        if (userData.data && userData.data.user && userData.data.user.email) {
          const updatedUser = {
            id: userData.data.user.id,
            email: userData.data.user.email,
            name: userData.data.user.firstName && userData.data.user.lastName 
              ? `${userData.data.user.firstName} ${userData.data.user.lastName}` 
              : userData.data.user.name || userData.data.user.email,
            firstName: userData.data.user.firstName,
            lastName: userData.data.user.lastName,
            plan: userData.data.user.subscriptionPlan || 'free',
            subscription_status: userData.data.user.subscriptionStatus,
            email_verified: userData.data.user.emailVerified
          };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
          console.log('User data updated from /auth/me:', updatedUser);
        } else {
          console.log('Invalid user data from /auth/me, keeping existing user data');
        }
        console.log('Token is valid, user data updated');
      } else {
        // Other error status - keep user logged in with cached data
        console.log('Server error during validation, keeping user logged in with cached data');
      }
    } catch (error) {
      console.error('Token validation error:', error);
      // On network error, always keep the user logged in locally
      // They can still browse with cached data
      console.log('Network error during validation, keeping user logged in with cached data');
    }
  };

  // Handle URL-based routing and authentication persistence
  useEffect(() => {
    const path = window.location.pathname;
    
    // Validate token in background if user is logged in
    // User state is already initialized from localStorage, so no need to set it again
    if (isLoggedIn && user) {
      console.log('User already logged in from initial state:', user);
      // Validate token in background, but don't let failures clear the user immediately
      setTimeout(() => {
        validateAndRefreshToken();
      }, 100); // Small delay to ensure UI renders first
    } else {
      console.log('No user logged in on initial load');
    }
    
    // Set initial page based on URL
    const getPageFromPath = (pathname: string) => {
      if (pathname === '/email-verification') return 'email-verification';
      if (pathname === '/auth/callback') return 'auth-callback';
      if (pathname === '/signup') return 'signup';
      if (pathname === '/login') return 'login';
      if (pathname === '/reset-password') return 'reset-password';
      if (pathname === '/dashboard') return 'dashboard';
      if (pathname === '/pricing') return 'pricing';
      if (pathname === '/features') return 'features';
      if (pathname === '/about') return 'about';
      if (pathname === '/contact') return 'contact';
      if (pathname === '/analysis') return 'analysis';
      if (pathname === '/analysis-history') return 'analysis-history';
      if (pathname === '/citation-results') return 'citation-results';
      if (pathname === '/citation-history') return 'citation-history';
      if (pathname === '/upload') return 'upload';
      if (pathname === '/settings') return 'settings';
      if (pathname === '/profile') return 'profile';
      if (pathname === '/library') return 'library';
      if (pathname === '/account') return 'account';
      if (pathname === '/billing') return 'billing';
      if (pathname === '/help-center') return 'help-center';
      if (pathname === '/privacy-policy') return 'privacy-policy';
      if (pathname === '/terms-of-service') return 'terms-of-service';
      if (pathname === '/unsubscribe') return 'unsubscribe';
      return 'landing';
    };
    
    const initialPage = getPageFromPath(path);
    
    // If user is logged in and trying to access landing page, redirect to dashboard
    if (isLoggedIn && initialPage === 'landing') {
      setCurrentPage('dashboard');
      window.history.replaceState(null, '', '/dashboard');
    } else {
      setCurrentPage(initialPage);
    }
    
    // Listen for browser back/forward button
    const handlePopState = () => {
      const newPath = window.location.pathname;
      const newPage = getPageFromPath(newPath);
      console.log('Browser navigation detected, changing page to:', newPage);
      setCurrentPage(newPage);
      
      // Restore user data from localStorage when navigating back/forward
      const storedToken = localStorage.getItem('authToken');
      const storedUserData = localStorage.getItem('user');
      if (storedToken && storedUserData) {
        try {
          const userData = JSON.parse(storedUserData);
          setIsLoggedIn(true);
          setUser(userData);
          console.log('User data restored on navigation:', userData);
        } catch (error) {
          console.error('Error restoring user data:', error);
        }
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isLoggedIn]);

  // Handle authentication state changes - redirect to dashboard if logged in and on landing page
  useEffect(() => {
    if (isLoggedIn && currentPage === 'landing') {
      console.log('User logged in, redirecting from landing to dashboard');
      setCurrentPage('dashboard');
      window.history.replaceState(null, '', '/dashboard');
    }
  }, [isLoggedIn, currentPage]);

  // Sync user data from localStorage when it changes (e.g., from another tab or after login)
  useEffect(() => {
    const handleStorageChange = () => {
      const token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('user');
      
      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData);
          console.log('Syncing user data from storage change:', parsedUser);
          setIsLoggedIn(true);
          setUser(parsedUser);
        } catch (error) {
          console.error('Error syncing user data:', error);
        }
      } else if (!token) {
        // If token is removed, log out
        setIsLoggedIn(false);
        setUser(null);
      }
    };
    
    // Listen for storage changes from other tabs
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []); // Run once on mount

  // Set up periodic token refresh for logged-in users
  useEffect(() => {
    if (isLoggedIn) {
      // Refresh token every 6 hours (6 * 60 * 60 * 1000 ms) when user is logged in on any page
      const refreshInterval = setInterval(() => {
        validateAndRefreshToken();
      }, 6 * 60 * 60 * 1000);
      
      return () => clearInterval(refreshInterval);
    }
  }, [isLoggedIn]);

  // Global error handler for 401 responses
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      
      // If we get a 401 and we're logged in, try to refresh token (on any page)
      if (response.status === 401 && isLoggedIn) {
        try {
          const refreshResponse = await originalFetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/auth/refresh`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            },
          });

          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            localStorage.setItem('authToken', refreshData.data.token);
            console.log('Token refreshed automatically');
            
            // Retry the original request with new token
            const retryResponse = await originalFetch(...args);
            return retryResponse;
          } else {
            // Refresh failed - but DON'T clear auth state automatically
            // Let the user continue with cached data
            console.log('Auto-refresh failed, but keeping user logged in with cached data');
            
            // Only clear auth if we're on a protected route and have no cached user
            const cachedUser = localStorage.getItem('user');
            if (!cachedUser && protectedRoutes.includes(currentPage)) {
              console.log('No cached user data on protected route, clearing auth state');
              setIsLoggedIn(false);
              setUser(null);
              localStorage.removeItem('authToken');
              localStorage.removeItem('user');
              setCurrentPage('login');
            }
          }
        } catch (error) {
          console.error('Auto-refresh failed:', error);
          // Don't logout on network errors - keep user logged in with cached data
          console.log('Network error during auto-refresh, keeping user logged in');
        }
      }
      
      return response;
    };

    // Cleanup
    return () => {
      window.fetch = originalFetch;
    };
  }, [isLoggedIn, currentPage]);

  // Navigation function
  const navigateTo = (page: string) => {
    setCurrentPage(page);
    // Update URL to match the page
    if (page === 'landing') {
      window.history.pushState({}, '', '/');
    } else {
      window.history.pushState({}, '', `/${page}`);
    }
    
    // Ensure user data is restored on navigation
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');
    if (token && userData && !user) {
      try {
        const parsedUser = JSON.parse(userData);
        console.log('Restoring user data on navigation:', parsedUser);
        setIsLoggedIn(true);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error restoring user on navigation:', error);
      }
    }
  };

  // Authentication handlers
  const handleSignUp = (userData: User) => {
    setIsLoggedIn(true);
    setUser(userData);
  };

  const handleLogin = (userData: User) => {
    setIsLoggedIn(true);
    setUser(userData);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setCurrentPage('landing');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  };

  const renderCurrentPage = () => {
    // Redirect to login if trying to access protected route while not logged in
    if (protectedRoutes.includes(currentPage) && !isLoggedIn) {
      return <LoginPage onNavigate={navigateTo} onLogin={handleLogin} />;
    }

    switch (currentPage) {
      case 'landing':
        return <LandingPage onNavigate={navigateTo} />;
      case 'signup':
        return <SignUpPage onNavigate={navigateTo} onSignUp={handleSignUp} />;
      case 'login':
        return <LoginPage onNavigate={navigateTo} onLogin={handleLogin} />;
      case 'reset-password':
        return <ResetPasswordPage onNavigate={navigateTo} />;
      case 'email-verification':
        return <EmailVerificationPage onNavigate={navigateTo} />;
      case 'auth-callback':
        return <AuthCallbackPage onNavigate={navigateTo} onLogin={handleLogin} />;
      case 'pricing':
        return <PricingPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'features':
        return <FeaturesPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'about':
        return <AboutPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'contact':
        return <ContactPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'privacy':
        return <PrivacyPolicyPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'terms':
        return <TermsOfServicePage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'help':
        return <FAQPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'unsubscribe':
        return <UnsubscribePage onNavigate={navigateTo} />;
      case 'dashboard':
        return <DashboardPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'analysis':
        return <AnalysisPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'analysis-history':
        return <AnalysisHistoryPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'citation-results':
        const citationResults = localStorage.getItem('citationSearchResults');
        if (citationResults) {
          return (
            <CitationResultsPage 
              onNavigate={navigateTo} 
              user={user} 
              onLogout={handleLogout}
              searchResults={JSON.parse(citationResults)}
              onNewSearch={() => navigateTo('dashboard')}
            />
          );
        } else {
          navigateTo('dashboard');
          return <DashboardPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
        }
      case 'citation-history':
        return <CitationHistoryPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'upload':
        return <UploadPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'settings':
        return <SettingsPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'profile':
        return <ProfilePage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'library':
        return <LibraryPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'account':
        return <AccountPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'billing':
        return <BillingPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'admin':
        return <AdminDashboard onNavigate={navigateTo} user={user} />;
      case 'collaboration':
        return <CollaborationPage onNavigate={navigateTo} user={user} />;
      default:
        return <LandingPage onNavigate={navigateTo} />;
    }
  };

  return (
    <ErrorBoundary>
    <div className="min-h-screen bg-gray-50">
      <PromoBanner />
      {renderCurrentPage()}
    </div>
    </ErrorBoundary>
  );
};


// Admin Dashboard Component
const AdminDashboard = ({ onNavigate, user: _user }: UserProps) => (
  <div className="min-h-screen bg-gray-50">
    {/* Navigation */}
    <nav className="bg-white border-b border-gray-200 px-8 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="text-xl font-bold text-gray-900">AcademicAI Admin</span>
        </div>
        <div className="flex items-center space-x-4">
          <button onClick={() => onNavigate('dashboard')} className="text-gray-600 hover:text-gray-900 transition-colors">
            Back to Dashboard
          </button>
        </div>
      </div>
    </nav>

    <div className="max-w-7xl mx-auto px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Institution Dashboard</h1>
      
      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Active Users</h3>
          <div className="text-3xl font-bold text-blue-600">1,247</div>
          <p className="text-sm text-gray-500">+12% from last month</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Documents Analyzed</h3>
          <div className="text-3xl font-bold text-green-600">8,942</div>
          <p className="text-sm text-gray-500">This month</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Average Score</h3>
          <div className="text-3xl font-bold text-purple-600">84.2%</div>
          <p className="text-sm text-gray-500">Institution-wide</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Support Tickets</h3>
          <div className="text-3xl font-bold text-orange-600">23</div>
          <p className="text-sm text-gray-500">Open tickets</p>
        </div>
      </div>

      {/* Management Sections */}
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">User Management</h2>
          <div className="space-y-4">
            <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <h3 className="font-medium text-gray-900">Add New Users</h3>
              <p className="text-sm text-gray-600">Bulk invite students and faculty</p>
            </button>
            <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <h3 className="font-medium text-gray-900">Manage Permissions</h3>
              <p className="text-sm text-gray-600">Set role-based access controls</p>
            </button>
            <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <h3 className="font-medium text-gray-900">Usage Reports</h3>
              <p className="text-sm text-gray-600">View detailed usage analytics</p>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Institution Settings</h2>
          <div className="space-y-4">
            <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <h3 className="font-medium text-gray-900">Citation Styles</h3>
              <p className="text-sm text-gray-600">Configure default citation formats</p>
            </button>
            <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <h3 className="font-medium text-gray-900">Branding</h3>
              <p className="text-sm text-gray-600">Customize interface with your logo</p>
            </button>
            <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <h3 className="font-medium text-gray-900">Integrations</h3>
              <p className="text-sm text-gray-600">Connect with LMS and other systems</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Collaboration Page Component
const CollaborationPage = ({ onNavigate, user: _user }: UserProps) => (
  <div className="min-h-screen bg-gray-50">
    {/* Navigation */}
    <nav className="bg-white border-b border-gray-200 px-8 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="text-xl font-bold text-gray-900">AcademicAI</span>
        </div>
        <div className="flex items-center space-x-4">
          <button onClick={() => onNavigate('dashboard')} className="text-gray-600 hover:text-gray-900 transition-colors">
            Dashboard
          </button>
          <button onClick={() => onNavigate('library')} className="text-gray-600 hover:text-gray-900 transition-colors">
            Library
          </button>
        </div>
      </div>
    </nav>

    <div className="max-w-7xl mx-auto px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Team Collaboration</h1>
      
      {/* Active Collaborations */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Projects</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">📄</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Climate Research Collaboration</h3>
                <p className="text-sm text-gray-600">With Dr. Johnson, Emma Rodriguez • 3 documents</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded-full">Active</span>
              <button className="text-blue-600 hover:text-blue-500">Open</button>
            </div>
          </div>
        </div>
      </div>

      {/* Team Members */}
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Team Members</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">DJ</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Dr. Michael Johnson</p>
                  <p className="text-sm text-gray-500">Supervisor</p>
                </div>
              </div>
              <span className="text-xs text-green-600">Online</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Dr. Johnson</span> commented on your methodology section
              <span className="text-gray-400 block">2 hours ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default AcademicAIApp;