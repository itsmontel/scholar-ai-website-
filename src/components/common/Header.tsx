import React, { useState, useEffect } from 'react';

interface HeaderProps {
  onNavigate?: (page: string) => void;
  user?: { name: string; email: string } | null;
  onLogout?: () => void;
  currentPage?: string;
}

interface UsageStats {
  documentsUploaded: number;
  documentsAnalyzed: number;
  storageUsed: number;
  storageLimit: number;
  uploadsRemaining: number;
  analysesRemaining: number;
  plan: string;
  planLimits: {
    documentsPerMonth: number;
    analysesPerMonth: number;
    maxDocumentSize: number;
    name: string;
  };
}

const Header: React.FC<HeaderProps> = ({ onNavigate, user, onLogout, currentPage }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.dropdown-container')) {
        setIsDropdownOpen(false);
      }
      if (!target.closest('.mobile-menu-container')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch usage stats when user is available
  useEffect(() => {
    const fetchUsageStats = async () => {
      if (!user) return;
      
      setLoadingUsage(true);
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/subscriptions/usage`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setUsageStats(data);
        }
      } catch (error) {
        console.error('Error fetching usage stats:', error);
      } finally {
        setLoadingUsage(false);
      }
    };

    fetchUsageStats();
  }, [user]);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    setIsDropdownOpen(false);
  };

  // Helper functions for formatting usage data
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getUsagePercentage = (used: number, limit: number): number => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number): string => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <header className="bg-white/90 backdrop-blur-xl border-b border-gray-200/60 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <button 
            onClick={() => onNavigate?.('dashboard')}
            className="flex items-center space-x-2 sm:space-x-3 hover:opacity-80 transition-opacity duration-200"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-base sm:text-lg">W</span>
            </div>
            <span className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">WriteScholar</span>
          </button>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => onNavigate?.('dashboard')}
              className={`px-4 py-2 font-medium rounded-lg transition-all duration-200 ${
                currentPage === 'dashboard' 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
              }`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => onNavigate?.('library')}
              className={`px-4 py-2 font-medium rounded-lg transition-all duration-200 ${
                currentPage === 'library' 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
              }`}
            >
              Library
            </button>
            <button 
              onClick={() => onNavigate?.('upload')}
              className={`px-4 py-2 font-medium rounded-lg transition-all duration-200 ${
                currentPage === 'upload' 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
              }`}
            >
              Upload
            </button>
            <button 
              onClick={() => onNavigate?.('analysis')}
              className={`px-4 py-2 font-medium rounded-lg transition-all duration-200 ${
                currentPage === 'analysis' 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
              }`}
            >
              AI Analysis
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100/50 transition-colors duration-200"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* User Dropdown */}
          {user && onLogout && (
            <div className="relative dropdown-container">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100/50 transition-colors duration-200"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                  </span>
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-semibold text-gray-900">{user.email || 'user@example.com'}</div>
                  <div className="text-xs text-gray-500">WriteScholar User</div>
                </div>
                <svg 
                  className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 sm:w-64 bg-white rounded-xl shadow-2xl border border-gray-200/50 backdrop-blur-sm z-50">
                  {/* User Info Section */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="text-sm font-medium text-gray-900">{user.email || 'user@example.com'}</div>
                    <div className="text-xs text-gray-500 capitalize">{usageStats?.plan || 'Free'} Plan</div>
                    
                    {/* Usage Statistics */}
                    {loadingUsage ? (
                      <div className="mt-3 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-xs text-gray-500">Loading usage...</span>
                      </div>
                    ) : usageStats ? (
                      <div className="mt-3 space-y-2">
                        {/* Storage Usage */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-600">Storage</span>
                            <span className={`text-xs font-medium ${getUsageColor(getUsagePercentage(usageStats.storageUsed, usageStats.storageLimit))}`}>
                              {formatBytes(usageStats.storageUsed)} / {usageStats.storageLimit === -1 ? '∞' : formatBytes(usageStats.storageLimit)}
                            </span>
                          </div>
                          {usageStats.storageLimit !== -1 && (
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div 
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                  getUsagePercentage(usageStats.storageUsed, usageStats.storageLimit) >= 90 ? 'bg-red-500' :
                                  getUsagePercentage(usageStats.storageUsed, usageStats.storageLimit) >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${getUsagePercentage(usageStats.storageUsed, usageStats.storageLimit)}%` }}
                              ></div>
                            </div>
                          )}
                        </div>

                        {/* Uploads Remaining */}
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">Uploads</span>
                          <span className={`text-xs font-medium ${getUsageColor(getUsagePercentage(usageStats.documentsUploaded, usageStats.planLimits.documentsPerMonth))}`}>
                            {usageStats.uploadsRemaining === -1 ? '∞' : usageStats.uploadsRemaining} left
                          </span>
                        </div>

                        {/* Analyses Remaining */}
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">Analyses</span>
                          <span className={`text-xs font-medium ${getUsageColor(getUsagePercentage(usageStats.documentsAnalyzed, usageStats.planLimits.analysesPerMonth))}`}>
                            {usageStats.analysesRemaining === -1 ? '∞' : usageStats.analysesRemaining} left
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 text-xs text-gray-500">Unable to load usage data</div>
                    )}
                  </div>

                  {/* Navigation Links */}
                  <div className="py-2">
                    <button 
                      onClick={() => { onNavigate?.('dashboard'); setIsDropdownOpen(false); }}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                      </svg>
                      <span>Dashboard</span>
                    </button>
                    <button 
                      onClick={() => { onNavigate?.('library'); setIsDropdownOpen(false); }}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <span>Library</span>
                    </button>
                    <button 
                      onClick={() => { onNavigate?.('upload'); setIsDropdownOpen(false); }}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span>Upload</span>
                    </button>
                    <button 
                      onClick={() => { onNavigate?.('analysis'); setIsDropdownOpen(false); }}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <span>AI Analysis</span>
                    </button>
                    <button 
                      onClick={() => { onNavigate?.('analysis-history'); setIsDropdownOpen(false); }}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span>AI History</span>
                    </button>
                    <button 
                      onClick={() => { onNavigate?.('account'); setIsDropdownOpen(false); }}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>Account</span>
                    </button>
                    <button 
                      onClick={() => { onNavigate?.('billing'); setIsDropdownOpen(false); }}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      <span>Billing</span>
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-100"></div>

                  {/* Additional Links */}
                  <div className="py-2">
                    <button 
                      onClick={() => { onNavigate?.('pricing'); setIsDropdownOpen(false); }}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors duration-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>Upgrade Plan</span>
                    </button>
                    <button 
                      onClick={() => { onNavigate?.('help'); setIsDropdownOpen(false); }}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>FAQ</span>
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-100"></div>

                  {/* Logout */}
                  <div className="py-2">
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 mobile-menu-container">
          <div className="px-4 sm:px-6 py-4 space-y-2">
            <button 
              onClick={() => { onNavigate?.('dashboard'); setIsMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                currentPage === 'dashboard' 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
              }`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => { onNavigate?.('library'); setIsMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                currentPage === 'library' 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
              }`}
            >
              Library
            </button>
            <button 
              onClick={() => { onNavigate?.('upload'); setIsMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                currentPage === 'upload' 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
              }`}
            >
              Upload
            </button>
            <button 
              onClick={() => { onNavigate?.('analysis'); setIsMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                currentPage === 'analysis' 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
              }`}
            >
              AI Analysis
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;

