import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../contexts/ThemeContext';
import PromoBanner from './PromoBanner';
import { getResetsInText } from '../../utils/usageReset';
import { searchSiteMultiple, SearchItem } from '../../data/searchIndex';

interface HeaderProps {
  onNavigate?: (page: string, slug?: string) => void;
  showPromoBanner?: boolean;
  sticky?: boolean;
  user?: { 
    id: string;
    name: string; 
    email: string;
    firstName?: string;
    lastName?: string;
    plan: string;
    subscription_plan?: string;
    subscription_status?: string;
    email_verified?: boolean;
  } | null;
  onLogout?: () => void;
  currentPage?: string;
}

interface UsageStats {
  documentsUploaded: number;
  documentsAnalyzed: number;
  citationSearchesUsed: number;
  studyPacksGenerated: number;
  storageUsed: number;
  storageLimit: number;
  uploadsRemaining: number;
  analysesRemaining: number;
  citationsRemaining: number;
  studyPacksRemaining: number;
  plan: string;
  combinedActionsUsed?: number;
  combinedActionsRemaining?: number;
  combinedWordsUsed?: number;
  combinedWordsRemaining?: number;
  planLimits: {
    documentsPerMonth: number;
    analysesPerMonth: number;
    citationSearchesPerMonth: number;
    studyPackGenerationsPerMonth: number;
    maxDocumentSize: number;
    name: string;
  };
  daysUntilReset?: number;
}

const Header: React.FC<HeaderProps> = ({ onNavigate, user, onLogout, currentPage, showPromoBanner = true, sticky = true }) => {
  const { theme, toggleTheme } = useTheme();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const [headerSearchResults, setHeaderSearchResults] = useState<SearchItem[]>([]);
  const [headerSearchOpen, setHeaderSearchOpen] = useState(false);
  const [searchDropdownRect, setSearchDropdownRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const desktopSearchRef = useRef<HTMLInputElement>(null);
  const mobileSearchRef = useRef<HTMLInputElement>(null);

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
      if (!target.closest('.header-search-container') && !target.closest('.header-search-dropdown')) {
        setHeaderSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update search results when query changes
  useEffect(() => {
    const q = headerSearchQuery.trim();
    if (!q) {
      setHeaderSearchResults([]);
      setHeaderSearchOpen(false);
      setSearchDropdownRect(null);
      return;
    }
    setHeaderSearchResults(searchSiteMultiple(headerSearchQuery));
    setHeaderSearchOpen(true);
  }, [headerSearchQuery]);

  // Position dropdown via portal - update rect when open
  useEffect(() => {
    if (!headerSearchOpen || !headerSearchQuery.trim()) {
      setSearchDropdownRect(null);
      return;
    }
    const updateRect = () => {
      const input = isMobileMenuOpen ? mobileSearchRef.current : desktopSearchRef.current;
      if (input) {
        const r = input.getBoundingClientRect();
        setSearchDropdownRect({ top: r.bottom + 4, left: r.left, width: r.width });
      }
    };
    updateRect();
    window.addEventListener('scroll', updateRect, true);
    window.addEventListener('resize', updateRect);
    return () => {
      window.removeEventListener('scroll', updateRect, true);
      window.removeEventListener('resize', updateRect);
    };
  }, [headerSearchOpen, headerSearchQuery, isMobileMenuOpen]);

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
      { id: 'focus-mode', label: 'Focus Mode' },
      { id: 'why-students-choose', label: 'Why Students Choose' },
      { id: 'blog', label: 'Blog' },
      { id: 'about', label: 'About' },
    ];
    const handleHeaderSearchSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const query = headerSearchQuery.trim();
      if (!query) return;
      const match = headerSearchResults[0];
      if (match) {
        if (match.slug) {
          onNavigate?.(match.page, match.slug);
        } else {
          onNavigate?.(match.page);
        }
      } else {
        onNavigate?.('focus-mode');
      }
      setHeaderSearchQuery('');
      setHeaderSearchOpen(false);
    };

    const handleHeaderSearchSelect = (item: SearchItem) => {
      if (item.slug) {
        onNavigate?.(item.page, item.slug);
      } else {
        onNavigate?.(item.page);
      }
      setHeaderSearchQuery('');
      setHeaderSearchOpen(false);
      setIsMobileMenuOpen(false);
    };
    return (
      <header className={`${sticky ? 'sticky top-0' : ''} left-0 right-0 z-[100] transition-all duration-300 ${
        isScrolled 
          ? 'bg-white dark:bg-stone-900 border-b border-stone-200/50 dark:border-stone-700/50 shadow-sm' 
          : 'bg-white dark:bg-stone-900 border-b border-stone-200/30 dark:border-stone-700/30'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:pl-4 lg:pr-8">
          <div className="flex items-center justify-between h-16 sm:h-[4.5rem]">
            {/* Logo */}
            <button
              onClick={() => onNavigate?.('landing')}
              className="flex items-center gap-2 sm:gap-2.5 group min-w-0 shrink lg:-ml-4"
            >
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center group-hover:scale-105 transition-transform duration-300 shrink-0 overflow-hidden">
                <img src="/mascot.png" alt="WriteScholar mascot" className="w-full h-full object-contain drop-shadow-lg" fetchPriority="high" width="40" height="40" />
              </div>
              <span className="text-base sm:text-xl font-extrabold tracking-tight text-stone-800 dark:text-stone-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300 truncate max-w-[110px] sm:max-w-none">
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

            {/* Desktop Search - same line */}
            <form onSubmit={handleHeaderSearchSubmit} className="hidden md:block flex-1 min-w-0 max-w-xs mx-4">
              <div className="header-search-container relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={desktopSearchRef}
                  type="search"
                  value={headerSearchQuery}
                  onChange={(e) => setHeaderSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Escape' && setHeaderSearchOpen(false)}
                  placeholder="Find tools, features..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 dark:focus:border-indigo-500 text-sm"
                  aria-label="Search WriteScholar"
                  autoComplete="off"
                />
              </div>
            </form>

            {/* Right side */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink-0">
              <button 
                onClick={() => onNavigate?.('login')} 
                className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-stone-600 dark:text-stone-400 rounded-full border border-stone-200/50 dark:border-stone-700/50 bg-stone-100/50 dark:bg-stone-800/50 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-stone-700/50 transition-all duration-300 shrink-0"
              >
                Log in
              </button>
              <button 
                onClick={() => onNavigate?.('signup')} 
                className="inline-flex items-center justify-center px-4 py-2 sm:px-6 sm:py-2.5 text-white text-xs sm:text-sm font-bold rounded-full bg-violet-500 hover:bg-violet-600 hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg shadow-violet-500/25 whitespace-nowrap shrink-0"
              >
                Sign up free
              </button>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="mobile-menu-button md:hidden p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-stone-600 dark:text-stone-400 shrink-0"
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
        {showPromoBanner && (!user || !['pro', 'premium'].includes((user?.plan || user?.subscription_plan || '').toLowerCase())) && <PromoBanner embedded />}
        {/* Search dropdown portal - renders above all content */}
        {headerSearchOpen && headerSearchQuery.trim() && searchDropdownRect && createPortal(
          <div
            className="header-search-dropdown fixed py-1 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-600 shadow-xl max-h-64 overflow-y-auto z-[99999]"
            style={{ top: searchDropdownRect.top, left: searchDropdownRect.left, width: searchDropdownRect.width }}
          >
            {headerSearchResults.length > 0 ? (
              headerSearchResults.map((item) => (
                <button
                  key={item.page + (item.slug || '')}
                  type="button"
                  onClick={() => handleHeaderSearchSelect(item)}
                  className="w-full text-left px-3 py-2.5 text-sm text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700/50 transition-colors flex items-center gap-2"
                >
                  <span className="font-medium">{item.label}</span>
                </button>
              ))
            ) : (
              <div className="px-3 py-3 text-sm text-stone-500 dark:text-stone-400">No matches</div>
            )}
          </div>,
          document.body
        )}
        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-stone-200/50 dark:border-stone-700/50 bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl">
            <div className="px-4 py-3">
              <form onSubmit={handleHeaderSearchSubmit} className="mb-3">
                <div className="header-search-container relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    ref={mobileSearchRef}
                    type="search"
                    value={headerSearchQuery}
                    onChange={(e) => setHeaderSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Escape' && setHeaderSearchOpen(false)}
                    placeholder="Find tools, features..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 placeholder-stone-400 text-sm"
                    aria-label="Search WriteScholar"
                    autoComplete="off"
                  />
                </div>
              </form>
              <div className="space-y-1">
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
                  className="block text-center px-4 py-3 text-sm font-medium text-stone-600 dark:text-stone-400 rounded-full border border-stone-200/50 dark:border-stone-700/50 bg-stone-100/50 dark:bg-stone-800/50 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-stone-700/50 transition-all"
                >
                  Log in
                </button>
                <button 
                  onClick={() => { onNavigate?.('signup'); setIsMobileMenuOpen(false); }} 
                  className="block text-center px-4 py-3 text-white text-sm font-bold rounded-xl bg-violet-500 hover:bg-violet-600 shadow-lg shadow-violet-500/25 transition-colors"
                >
                  Sign up free
                </button>
              </div>
              </div>
            </div>
          </div>
        )}
        {/* Soft purple accent line under header */}
        <div className="h-0.5 bg-gradient-to-r from-violet-400/35 via-violet-500/45 to-purple-400/35" />
      </header>
    );
  }

  // ── Logged-in header ───────────────────────────────────────────────────────
  return (
    <header className={`sticky top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
      isScrolled 
        ? 'bg-white/90 dark:bg-stone-900/90 backdrop-blur-xl shadow-sm border-stone-200/50 dark:border-stone-700/50' 
        : 'bg-white/70 dark:bg-stone-900/70 backdrop-blur-md border-stone-200/30 dark:border-stone-700/30'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <button 
            onClick={() => onNavigate?.('dashboard')}
            className="flex items-center gap-2.5 group"
          >
            <div className="relative w-12 h-12 flex items-center justify-center group-hover:scale-105 transition-transform duration-300 overflow-hidden">
              <img src="/mascot.png" alt="WriteScholar mascot" className="w-full h-full object-contain drop-shadow-lg" fetchPriority="high" width="40" height="40" />
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
              <span>Saved Materials</span>
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
                                : usageStats?.plan === 'pro' 
                                  ? 'bg-lime-100 dark:bg-lime-900/50 text-lime-700 dark:text-lime-400' 
                                  : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-400'
                            }`}>
                              {usageStats?.plan === 'premium' && '⭐ '}
                              {usageStats?.plan === 'pro' ? 'Pro' : usageStats?.plan === 'premium' ? 'Premium' : 'Free'}
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

                          {/* Combined Usage Grid - Pro/Premium show combined pool; Free shows separate */}
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-stone-50 dark:bg-stone-700/50 rounded-lg p-2">
                              <span className="text-[10px] text-stone-500 dark:text-stone-400 uppercase tracking-wide">Uploads</span>
                              <div className={`text-sm font-semibold ${getUsageColor(getUsagePercentage(usageStats.documentsUploaded, usageStats.planLimits.documentsPerMonth))}`}>
                                {usageStats.uploadsRemaining === -1 ? '∞' : usageStats.uploadsRemaining} left
                              </div>
                            </div>
                            {(usageStats.plan === 'pro' || usageStats.plan === 'premium') && usageStats.combinedActionsRemaining != null ? (
                              <div className="bg-stone-50 dark:bg-stone-700/50 rounded-lg p-2 col-span-2">
                                <span className="text-[10px] text-stone-500 dark:text-stone-400 uppercase tracking-wide">Combined (analyses, study packs, citations)</span>
                                <div className={`text-sm font-semibold ${usageStats.combinedActionsRemaining === -1 ? 'text-lime-600' : usageStats.combinedActionsRemaining <= 0 ? 'text-red-600' : usageStats.combinedActionsRemaining <= 10 ? 'text-yellow-600' : 'text-green-600'}`}>
                                  {usageStats.combinedActionsRemaining === -1 ? '∞' : usageStats.combinedActionsRemaining} left
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="bg-stone-50 dark:bg-stone-700/50 rounded-lg p-2">
                                  <span className="text-[10px] text-stone-500 dark:text-stone-400 uppercase tracking-wide">Analyses</span>
                                  <div className={`text-sm font-semibold ${getUsageColor(getUsagePercentage(usageStats.documentsAnalyzed, usageStats.planLimits.analysesPerMonth))}`}>
                                    {usageStats.analysesRemaining === -1 ? '∞' : usageStats.analysesRemaining} left
                                  </div>
                                </div>
                                <div className="bg-stone-50 dark:bg-stone-700/50 rounded-lg p-2">
                                  <span className="text-[10px] text-stone-500 dark:text-stone-400 uppercase tracking-wide">Citations</span>
                                  <div className={`text-sm font-semibold ${getUsageColor(getUsagePercentage(usageStats.citationSearchesUsed, usageStats.planLimits.citationSearchesPerMonth))}`}>
                                    {usageStats.citationsRemaining === -1 ? '∞' : usageStats.citationsRemaining} left
                                  </div>
                                </div>
                                <div className="bg-stone-50 dark:bg-stone-700/50 rounded-lg p-2">
                                  <span className="text-[10px] text-stone-500 dark:text-stone-400 uppercase tracking-wide">Study Packs</span>
                                  <div className={`text-sm font-semibold ${getUsageColor(getUsagePercentage(usageStats.studyPacksGenerated, usageStats.planLimits.studyPackGenerationsPerMonth))}`}>
                                    {usageStats.studyPacksRemaining === -1 ? '∞' : usageStats.studyPacksRemaining} left
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                          {(usageStats.uploadsRemaining !== -1 || (usageStats.plan === 'pro' || usageStats.plan === 'premium' ? usageStats.combinedActionsRemaining != null && usageStats.combinedActionsRemaining !== -1 : usageStats.analysesRemaining !== -1 || usageStats.citationsRemaining !== -1 || usageStats.studyPacksRemaining !== -1)) && (
                            <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-2 text-center">
                              {getResetsInText(usageStats.daysUntilReset)}
                            </p>
                          )}
                        </div>
                      ) : null}
                    </div>

                    {/* Navigation Links */}
                    <div className="py-2">
                      {[
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

      {/* Light purple accent line under header */}
      <div className="h-0.5 bg-gradient-to-r from-violet-400/50 via-violet-500/60 to-purple-400/50" />

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
              <span>Saved Materials</span>
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
