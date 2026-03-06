import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import PromoBanner from './PromoBanner';
import ScholarMascot from './ScholarMascot';
import { getResetsInText } from '../../utils/usageReset';

interface HeaderProps {
  onNavigate?: (page: string) => void;
  showPromoBanner?: boolean;
  sticky?: boolean;
  user?: { 
    id: string;
    name: string; 
    email: string;
    firstName?: string;
    lastName?: string;
    plan: string;
    subscription_status?: string;
    email_verified?: boolean;
  } | null;
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

const Header: React.FC<HeaderProps> = ({ onNavigate, user, onLogout, currentPage, showPromoBanner = true, sticky = true }) => {
  const { theme, toggleTheme } = useTheme();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Track scroll for shadow effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.dropdown-container')) {
        setIsDropdownOpen(false);
      }
      if (!target.closest('.mobile-menu-container') && !target.closest('.mobile-menu-button')) {
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
    if (limit === -1) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number): string => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  // ── Logged-out (public) header - matches landing page nav ───────────────────
  if (!user) {
    const publicNavItems = [
      { id: 'features', label: 'Features' },
      { id: 'why-students-choose', label: 'Why Students Choose' },
      { id: 'pricing', label: 'Pricing' },
      { id: 'blog', label: 'Blog' },
      { id: 'about', label: 'About' },
    ];
    return (
      <header className={`${sticky ? 'sticky top-0' : ''} left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/90 dark:bg-stone-900/90 backdrop-blur-xl border-b border-stone-200/50 dark:border-stone-700/50 shadow-sm' 
          : 'bg-gradient-to-b from-blue-50/90 via-stone-50/95 to-transparent dark:from-stone-950/95 dark:via-stone-900/90 dark:to-transparent backdrop-blur-sm border-b border-stone-200/30 dark:border-stone-700/30'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-[4.5rem]">
            {/* Logo */}
            <button
              onClick={() => onNavigate?.('landing')}
              className="flex items-center gap-2.5 group"
            >
              <div className="relative w-12 h-12 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                <ScholarMascot size={48} animated={false} className="drop-shadow-lg" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-stone-800 dark:text-stone-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300">
                WriteScholar
              </span>
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1 bg-stone-100/50 dark:bg-stone-800/50 backdrop-blur-sm p-1 rounded-full border border-stone-200/50 dark:border-stone-700/50">
              {publicNavItems.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => onNavigate?.(id)}
                  className={`px-4 py-2 text-sm rounded-full transition-all duration-300 font-medium ${
                    currentPage === id 
                      ? 'text-indigo-600 dark:text-indigo-400 bg-white dark:bg-stone-700 shadow-sm' 
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-stone-700/50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>

            {/* Right side */}
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => onNavigate?.('login')} 
                className="hidden sm:inline-flex px-5 py-2.5 text-sm font-semibold text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-all duration-300"
              >
                Log in
              </button>
              <button 
                onClick={() => onNavigate?.('signup')} 
                className="inline-flex items-center px-6 py-2.5 text-white text-sm font-bold rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg shadow-violet-500/25"
              >
                Sign up free
              </button>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-stone-600 dark:text-stone-400"
                aria-label="Toggle menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
        {showPromoBanner && <PromoBanner embedded />}
        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-stone-200/50 dark:border-stone-700/50 bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl">
            <div className="px-4 py-3 space-y-1">
              {publicNavItems.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => { onNavigate?.(id); setIsMobileMenuOpen(false); }}
                  className={`block w-full text-left px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                    currentPage === id 
                      ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30' 
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  {label}
                </button>
              ))}
              <div className="pt-2 pb-1 flex flex-col gap-2">
                <button 
                  onClick={() => { onNavigate?.('login'); setIsMobileMenuOpen(false); }} 
                  className="block text-center px-4 py-3 text-sm font-medium text-stone-600 dark:text-stone-400 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 transition-all"
                >
                  Log in
                </button>
                <button 
                  onClick={() => { onNavigate?.('signup'); setIsMobileMenuOpen(false); }} 
                  className="block text-center px-4 py-3 text-white text-sm font-bold rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 shadow-lg shadow-violet-500/25"
                >
                  Sign up free
                </button>
              </div>
            </div>
          </div>
        )}
      </header>
    );
  }

  // ── Logged-in header ───────────────────────────────────────────────────────
  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 border-b ${
      isScrolled 
        ? 'bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl shadow-sm border-stone-200/50 dark:border-stone-700/50' 
        : 'bg-transparent border-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <button 
            onClick={() => onNavigate?.('dashboard')}
            className="flex items-center gap-2.5 group"
          >
            <div className="relative w-12 h-12 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
              <ScholarMascot size={48} animated={false} className="drop-shadow-lg" />
            </div>
            <span className="text-base sm:text-xl font-extrabold tracking-tight text-stone-800 dark:text-stone-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300 truncate max-w-[140px] sm:max-w-none">
              WriteScholar
            </span>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center">
            <div className="flex items-center bg-stone-100/50 dark:bg-stone-800/50 backdrop-blur-sm p-1 rounded-full border border-stone-200/50 dark:border-stone-700/50">
              <button 
                onClick={() => onNavigate?.('dashboard')}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 ${
                  currentPage === 'dashboard' 
                    ? 'bg-white dark:bg-stone-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-stone-700/50'
                }`}
              >
                Dashboard
              </button>
              <button 
                onClick={() => onNavigate?.('library')}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 ${
                  currentPage === 'library' 
                    ? 'bg-white dark:bg-stone-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-stone-700/50'
                }`}
              >
                Library
              </button>
              <button 
                onClick={() => onNavigate?.('upload')}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 ${
                  currentPage === 'upload' 
                    ? 'bg-white dark:bg-stone-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-stone-700/50'
                }`}
              >
                Upload
              </button>
              <button 
                onClick={() => onNavigate?.('analysis')}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 ${
                  currentPage === 'analysis' 
                    ? 'bg-white dark:bg-stone-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-stone-700/50'
                }`}
              >
                AI Analysis
              </button>
              <button 
                onClick={() => onNavigate?.('citation-history')}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 ${
                  currentPage === 'citations' 
                    ? 'bg-white dark:bg-stone-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-stone-700/50'
                }`}
              >
                Citations
              </button>
            </div>
            
            {/* Pro button - separate from pill group */}
            <button 
              onClick={() => onNavigate?.('quiz-history')}
              className={`ml-3 px-4 py-2 text-sm font-bold rounded-full transition-all duration-300 flex items-center gap-1.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white shadow-lg shadow-violet-500/25 hover:scale-105 active:scale-95 ${
                currentPage === 'quiz-history' ? 'ring-2 ring-violet-400 ring-offset-2' : ''
              }`}
            >
              <span>Study Tools</span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-white/25 text-white rounded-full">PRO</span>
            </button>

            {/* Friends button */}
            <button 
              onClick={() => onNavigate?.('friends')}
              className={`ml-2 px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 flex items-center gap-1.5 ${
                currentPage === 'friends' 
                  ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 ring-2 ring-purple-400 ring-offset-2' 
                  : 'bg-stone-100/80 dark:bg-stone-800/80 text-stone-600 dark:text-stone-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-700 dark:hover:text-purple-300'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Friends</span>
            </button>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Theme toggle - hidden until implemented */}
            {/*<button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-stone-100/80 dark:bg-stone-800/80 hover:bg-stone-200/80 dark:hover:bg-stone-700/80 transition-colors text-stone-600 dark:text-stone-400"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>*/}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="mobile-menu-button lg:hidden p-2.5 rounded-xl bg-stone-100/80 dark:bg-stone-800/80 hover:bg-stone-200/80 dark:hover:bg-stone-700/80 transition-colors"
              aria-label="Toggle menu"
            >
              <svg className={`w-5 h-5 text-stone-600 dark:text-stone-400 transition-transform duration-200 ${isMobileMenuOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            {/* User Dropdown */}
            {user && onLogout && (
              <div className="relative dropdown-container">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full bg-stone-100/80 dark:bg-stone-800/80 hover:bg-stone-200/80 dark:hover:bg-stone-700/80 transition-all duration-200"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow-inner">
                    {(user.username || user.name || user.email) ? (user.username || user.name || user.email).charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-semibold text-stone-800 dark:text-stone-100 leading-tight">{user.username ? `@${user.username}` : user.name || user.email?.split('@')[0] || 'User'}</div>
                    <div className="text-xs text-stone-500 dark:text-stone-400 capitalize">{usageStats?.plan || 'Free'}</div>
                  </div>
                  <svg 
                    className={`w-4 h-4 text-stone-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-stone-800 rounded-2xl shadow-2xl shadow-stone-900/10 dark:shadow-black/30 border border-stone-200/60 dark:border-stone-700/60 z-[60] overflow-hidden">
                    {/* User Info Section */}
                    <div className="px-4 py-4 bg-gradient-to-br from-stone-50 to-stone-100/50 dark:from-stone-800 dark:to-stone-800/50">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/30">
                          {(user.username || user.name || user.email) ? (user.username || user.name || user.email).charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-stone-800 dark:text-stone-100">
                            {user?.username ? `@${user.username}` : user?.name || user?.email || 'User'}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              usageStats?.plan === 'premium' 
                                ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-stone-900' 
                                : usageStats?.plan === 'starter' 
                                  ? 'bg-lime-100 dark:bg-lime-900/50 text-lime-700 dark:text-lime-400' 
                                  : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-400'
                            }`}>
                              {usageStats?.plan === 'premium' && '⭐ '}
                              {(usageStats?.plan || 'Free').charAt(0).toUpperCase() + (usageStats?.plan || 'free').slice(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Usage Statistics */}
                      {loadingUsage ? (
                        <div className="mt-4 flex items-center justify-center py-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-lime-500 border-t-transparent"></div>
                          <span className="ml-2 text-xs text-stone-500 dark:text-stone-400">Loading usage...</span>
                        </div>
                      ) : usageStats ? (
                        <div className="mt-4 space-y-2.5">
                          {/* Storage Usage */}
                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-stone-600 dark:text-stone-400">Storage</span>
                              <span className={`text-xs font-medium ${getUsageColor(getUsagePercentage(usageStats.storageUsed, usageStats.storageLimit))}`}>
                                {formatBytes(usageStats.storageUsed)} / {usageStats.storageLimit === -1 ? '∞' : formatBytes(usageStats.storageLimit)}
                              </span>
                            </div>
                            {usageStats.storageLimit !== -1 && (
                              <div className="w-full bg-stone-200 dark:bg-stone-600 rounded-full h-1.5 overflow-hidden">
                                <div 
                                  className={`h-1.5 rounded-full transition-all duration-500 ${
                                    getUsagePercentage(usageStats.storageUsed, usageStats.storageLimit) >= 90 ? 'bg-red-500' :
                                    getUsagePercentage(usageStats.storageUsed, usageStats.storageLimit) >= 70 ? 'bg-yellow-500' : 'bg-lime-500'
                                  }`}
                                  style={{ width: `${getUsagePercentage(usageStats.storageUsed, usageStats.storageLimit)}%` }}
                                ></div>
                              </div>
                            )}
                          </div>

                          <div className="flex gap-4">
                            <div className="flex-1">
                              <span className="text-xs text-stone-600 dark:text-stone-400">Uploads</span>
                              <div className={`text-sm font-semibold ${getUsageColor(getUsagePercentage(usageStats.documentsUploaded, usageStats.planLimits.documentsPerMonth))}`}>
                                {usageStats.uploadsRemaining === -1 ? '∞' : usageStats.uploadsRemaining} left
                              </div>
                            </div>
                            <div className="flex-1">
                              <span className="text-xs text-stone-600 dark:text-stone-400">Analyses</span>
                              <div className={`text-sm font-semibold ${getUsageColor(getUsagePercentage(usageStats.documentsAnalyzed, usageStats.planLimits.analysesPerMonth))}`}>
                                {usageStats.analysesRemaining === -1 ? '∞' : usageStats.analysesRemaining} left
                              </div>
                            </div>
                          </div>
                          {(usageStats.uploadsRemaining !== -1 || usageStats.analysesRemaining !== -1) && (
                            <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-1.5">
                              {getResetsInText()}
                            </p>
                          )}
                        </div>
                      ) : null}
                    </div>

                    {/* Navigation Links */}
                    <div className="py-2">
                      {[
                        { id: 'dashboard', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2zM8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z', label: 'Dashboard' },
                        { id: 'library', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', label: 'Library' },
                        { id: 'upload', icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12', label: 'Upload' },
                        { id: 'analysis', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z', label: 'AI Analysis' },
                        { id: 'citation-history', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z', label: 'Citations' },
                        { id: 'account', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', label: 'Account' },
                        { id: 'billing', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z', label: 'Billing' },
                      ].map(({ id, icon, label }) => (
                        <button 
                          key={id}
                          onClick={() => { onNavigate?.(id); setIsDropdownOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700/50 transition-colors"
                        >
                          <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                          </svg>
                          <span>{label}</span>
                        </button>
                      ))}
                    </div>

                    <div className="border-t border-stone-200/60 dark:border-stone-700/60" />

                    {/* Upgrade & Help */}
                    <div className="py-2">
                      <button 
                        onClick={() => { onNavigate?.('pricing'); setIsDropdownOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-lime-600 dark:text-lime-400 hover:bg-lime-50 dark:hover:bg-lime-900/20 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>Upgrade Plan</span>
                      </button>
                      <button 
                        onClick={() => { onNavigate?.('help'); setIsDropdownOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700/50 transition-colors"
                      >
                        <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Help & FAQ</span>
                      </button>
                    </div>

                    <div className="border-t border-stone-200/60 dark:border-stone-700/60" />

                    {/* Logout */}
                    <div className="py-2">
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Log out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`lg:hidden mobile-menu-container overflow-hidden transition-all duration-300 ease-out ${
        isMobileMenuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="px-4 py-4 bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl border-t border-stone-200/60 dark:border-stone-700/60">
          <div className="space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard' },
              { id: 'library', label: 'Library' },
              { id: 'upload', label: 'Upload' },
              { id: 'analysis', label: 'AI Analysis' },
              { id: 'citation-history', label: 'Citations', page: 'citations' },
            ].map(({ id, label, page }) => (
              <button 
                key={id}
                onClick={() => { onNavigate?.(id); setIsMobileMenuOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  currentPage === (page || id)
                    ? 'bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-400' 
                    : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                {label}
              </button>
            ))}
            
            {/* Pro button */}
            <button
              onClick={() => { onNavigate?.('quiz-history'); setIsMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-between bg-gradient-to-r from-violet-600 to-purple-600 text-white ${
                currentPage === 'quiz-history' ? 'ring-2 ring-violet-400 ring-offset-2' : ''
              }`}
            >
              <span>Saved Tools</span>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-white/25 text-white rounded-full">PRO</span>
            </button>

            {/* Friends button */}
            <button
              onClick={() => { onNavigate?.('friends'); setIsMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                currentPage === 'friends' 
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' 
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Friends
            </button>

            <button
              onClick={() => { onNavigate?.('blog'); setIsMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                currentPage === 'blog' 
                  ? 'bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-400' 
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              Blog
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
