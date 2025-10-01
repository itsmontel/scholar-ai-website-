import { useState, useEffect } from 'react';

// Import all page components
import LandingPage from './pages/LandingPage';
import SignUpPage from './pages/SignUpPage';
import LoginPage from './pages/LoginPage';
import EmailVerificationPage from './pages/EmailVerificationPage';
import DashboardPage from './pages/DashboardPage';
import AnalysisPage from './pages/AnalysisPage';
import AnalysisHistoryPage from './pages/AnalysisHistoryPage';
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

// Import common components
import ErrorBoundary from './common/ErrorBoundary';

// Type definitions
interface User {
  name: string;
  email: string;
  plan: string;
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

  // Route protection for authenticated pages
  const protectedRoutes = ['dashboard', 'analysis', 'analysis-history', 'upload', 'settings', 'profile', 'library', 'account', 'billing'];

  // Validate and refresh token if needed
  const validateAndRefreshToken = async () => {
    try {
      console.log('Validating token...');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      console.log('Token validation response status:', response.status);
      if (response.status === 401) {
        // Token expired, try to refresh
        const refreshResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          localStorage.setItem('authToken', refreshData.data.token);
          console.log('Token refreshed successfully');
        } else {
          // Refresh failed - clear auth state silently
          // Don't force logout, let user continue browsing public pages
          console.log('Token refresh failed, clearing auth state');
          setIsLoggedIn(false);
          setUser(null);
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
        }
      } else if (response.ok) {
        const userData = await response.json();
        // Update user data from server
        if (userData.data) {
          setUser(userData.data);
          localStorage.setItem('user', JSON.stringify(userData.data));
        }
        console.log('Token is valid');
      }
    } catch (error) {
      console.error('Token validation error:', error);
      // On network error, keep the user logged in locally
      // They can still browse, but API calls might fail
      // Don't force logout - better UX for temporary network issues
      console.log('Network error during validation, keeping user logged in locally');
    }
  };

  // Handle URL-based routing and authentication persistence
  useEffect(() => {
    const path = window.location.pathname;
    
    // Check for existing authentication
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        setIsLoggedIn(true);
        setUser(user);
        
        // Always validate token when user is logged in (on any page)
        validateAndRefreshToken();
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      }
    }
    
    // Set initial page based on URL
    const getPageFromPath = (pathname: string) => {
      if (pathname === '/email-verification') return 'email-verification';
      if (pathname === '/signup') return 'signup';
      if (pathname === '/login') return 'login';
      if (pathname === '/dashboard') return 'dashboard';
      if (pathname === '/pricing') return 'pricing';
      if (pathname === '/features') return 'features';
      if (pathname === '/about') return 'about';
      if (pathname === '/contact') return 'contact';
      if (pathname === '/analysis') return 'analysis';
      if (pathname === '/analysis-history') return 'analysis-history';
      if (pathname === '/upload') return 'upload';
      if (pathname === '/settings') return 'settings';
      if (pathname === '/profile') return 'profile';
      if (pathname === '/library') return 'library';
      if (pathname === '/account') return 'account';
      if (pathname === '/billing') return 'billing';
      if (pathname === '/help-center') return 'help-center';
      if (pathname === '/privacy-policy') return 'privacy-policy';
      if (pathname === '/terms-of-service') return 'terms-of-service';
      return 'landing';
    };
    
    setCurrentPage(getPageFromPath(path));
    
    // Listen for browser back/forward button
    const handlePopState = () => {
      const newPath = window.location.pathname;
      const newPage = getPageFromPath(newPath);
      console.log('Browser navigation detected, changing page to:', newPage);
      setCurrentPage(newPage);
    };
    
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

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
            // Refresh failed - clear auth state but don't redirect
            console.log('Auto-refresh failed, clearing auth state');
            setIsLoggedIn(false);
            setUser(null);
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
          }
        } catch (error) {
          console.error('Auto-refresh failed:', error);
          // Don't logout on network errors - better UX
        }
      }
      
      return response;
    };

    // Cleanup
    return () => {
      window.fetch = originalFetch;
    };
  }, [isLoggedIn]);

  // Navigation function
  const navigateTo = (page: string) => {
    setCurrentPage(page);
    // Update URL to match the page
    if (page === 'landing') {
      window.history.pushState({}, '', '/');
    } else {
      window.history.pushState({}, '', `/${page}`);
    }
  };

  // Authentication handlers
  const handleSignUp = (userData: User) => {
    setIsLoggedIn(true);
    setUser(userData || { 
      name: 'Dr. Sarah Chen', 
      email: 'sarah.chen@stanford.edu',
      plan: 'premium'
    });
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
      case 'email-verification':
        return <EmailVerificationPage onNavigate={navigateTo} />;
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
      case 'dashboard':
        return <DashboardPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'analysis':
        return <AnalysisPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'analysis-history':
        return <AnalysisHistoryPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
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