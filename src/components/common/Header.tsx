import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { HIDE_FRIENDS } from '../../config/featureFlags';
import PromoBanner from './PromoBanner';
import { getResetsInText } from '../../utils/usageReset';
import { searchSiteMultiple, SearchItem } from '../../data/searchIndex';

interface HeaderProps {
  onNavigate?: (page: string, slug?: string) => void;
  sticky?: boolean;
  user?: {
    id?: string;
    name?: string;
    email?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    plan?: string;
    subscription_plan?: string;
    subscription_status?: string;
    email_verified?: boolean;
  } | null;
  onLogout?: () => void;
  currentPage?: string;
  /** Solid background (no translucency). Use on the landing page so the bar reads crisp over the hero. */
  opaqueHeader?: boolean;
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

const Header: React.FC<HeaderProps> = ({ onNavigate, user, onLogout, currentPage, sticky = true, opaqueHeader = false }) => {
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

  // Update search results when query changes (debounced to avoid work every keystroke)
  useEffect(() => {
    const q = headerSearchQuery.trim();
    if (!q) {
      setHeaderSearchResults([]);
      setHeaderSearchOpen(false);
      setSearchDropdownRect(null);
      return;
    }
    const t = window.setTimeout(() => {
      setHeaderSearchResults(searchSiteMultiple(headerSearchQuery));
      setHeaderSearchOpen(true);
    }, 120);
    return () => window.clearTimeout(t);
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
      { id: 'features', label: 'Features' },
      { id: 'pricing', label: 'Pricing' },
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
        onNavigate?.('features');
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
    const publicNavActiveCls =
      'bg-white dark:bg-stone-800 text-violet-800 dark:text-violet-300 shadow-sm border border-stone-200/90 dark:border-stone-600/80';
    const publicNavInactiveCls =
      'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100/80 dark:hover:bg-stone-800/70';
    const promoBannerHiddenPages = new Set(['login', 'signup']);
    const showPromoBanner = !promoBannerHiddenPages.has(currentPage || '');

    const publicHeaderBg = opaqueHeader
      ? isScrolled
        ? 'bg-white dark:bg-stone-950 shadow-[0_10px_40px_-12px_rgba(15,23,42,0.1)] dark:shadow-[0_10px_40px_-12px_rgba(0,0,0,0.4)] border-stone-200/90 dark:border-stone-800'
        : 'bg-[#f9f9fb] dark:bg-stone-950 border-stone-200/80 dark:border-stone-800/90'
      : isScrolled
        ? 'bg-white/93 dark:bg-stone-950/93 shadow-[0_10px_40px_-12px_rgba(15,23,42,0.1)] dark:shadow-[0_10px_40px_-12px_rgba(0,0,0,0.4)] border-stone-200/90 dark:border-stone-800'
        : 'bg-[#f9f9fb]/92 dark:bg-stone-950/90 border-stone-200/80 dark:border-stone-800/90';

    return (
      <>
      <header
        className={`${sticky ? 'sticky top-0' : ''} left-0 right-0 z-[100] transition-all duration-300 border-b ${opaqueHeader ? '' : 'backdrop-blur-md'} ${publicHeaderBg}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[3.5rem] sm:h-[4.25rem]">
            {/* Logo */}
            <button
              type="button"
              onClick={() => onNavigate?.('landing')}
              className="flex items-center gap-2.5 sm:gap-3 group min-w-0 shrink"
              aria-label="WriteScholar home"
            >
              <div className="relative w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-xl border border-stone-200/80 dark:border-stone-700 bg-white/90 dark:bg-stone-900/50 shadow-sm group-hover:shadow transition-all duration-200 shrink-0 overflow-hidden">
                <img src="/mascot.png" alt="" className="w-[85%] h-[85%] object-contain" fetchPriority="high" width="40" height="40" />
              </div>
              <span
                className="text-[1.05rem] sm:text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-50 group-hover:text-violet-800 dark:group-hover:text-violet-300 transition-colors duration-200 truncate max-w-[130px] sm:max-w-none"
                style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
              >
                WriteScholar
              </span>
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center">
              <div className="flex items-center rounded-xl border border-stone-200/85 dark:border-stone-700/90 bg-white/70 dark:bg-stone-900/45 p-1 shadow-sm">
                {publicNavItems.map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => onNavigate?.(id)}
                    className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      currentPage === id ? publicNavActiveCls : publicNavInactiveCls
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </nav>

            {/* Desktop Search - same line */}
            <form onSubmit={handleHeaderSearchSubmit} className="hidden md:block flex-1 min-w-0 max-w-xs mx-4">
              <div className="header-search-container relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-stone-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={desktopSearchRef}
                  type="search"
                  value={headerSearchQuery}
                  onChange={(e) => setHeaderSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Escape' && setHeaderSearchOpen(false)}
                  placeholder="Search tools & pages…"
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-stone-200/90 dark:border-stone-600/80 bg-white dark:bg-stone-900/60 text-stone-800 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-violet-600/25 focus:border-violet-600/50 dark:focus:border-violet-500/60 text-sm transition-all"
                  aria-label="Search WriteScholar"
                  autoComplete="off"
                />
              </div>
            </form>

            {/* Right side */}
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 shrink-0">
              <button
                onClick={() => onNavigate?.('login')}
                className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-stone-700 dark:text-stone-300 rounded-lg border border-stone-300/90 dark:border-stone-600 bg-white/90 dark:bg-stone-900/40 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors shrink-0 shadow-sm"
              >
                Log in
              </button>
              <button
                onClick={() => onNavigate?.('signup')}
                className="inline-flex items-center justify-center px-4 py-2 sm:px-5 text-sm font-semibold text-white rounded-lg bg-violet-700 hover:bg-violet-800 dark:bg-violet-600 dark:hover:bg-violet-500 transition-colors shadow-md shadow-violet-900/12 dark:shadow-violet-950/30 whitespace-nowrap shrink-0 ring-1 ring-violet-900/10 dark:ring-white/10"
              >
                Sign up free
              </button>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="mobile-menu-button lg:hidden p-2 rounded-lg border border-stone-300/90 dark:border-stone-600 bg-white dark:bg-stone-900/50 text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors shrink-0 shadow-sm"
                aria-label="Toggle menu"
                aria-expanded={isMobileMenuOpen}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        {/* Search dropdown portal - renders above all content */}
        {headerSearchOpen && headerSearchQuery.trim() && searchDropdownRect && createPortal(
          <div
            className="header-search-dropdown fixed py-1 rounded-lg bg-white dark:bg-stone-900 border border-stone-200/95 dark:border-stone-700 shadow-[0_16px_50px_-12px_rgba(15,23,42,0.2)] dark:shadow-black/40 max-h-64 overflow-y-auto z-[99999]"
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
        {/* Mobile menu - mobile-menu-container required so click-outside doesn't close before onClick fires */}
        {isMobileMenuOpen && (
          <div
            className={`lg:hidden mobile-menu-container border-t border-stone-200/80 dark:border-stone-800 ${
              opaqueHeader ? 'bg-[#f9f9fb] dark:bg-stone-950' : 'bg-[#f9f9fb] dark:bg-stone-950/98 backdrop-blur-md'
            }`}
          >
            <div className="px-4 py-3 max-w-7xl mx-auto">
              <form onSubmit={handleHeaderSearchSubmit} className="mb-3">
                <div className="header-search-container relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    ref={mobileSearchRef}
                    type="search"
                    value={headerSearchQuery}
                    onChange={(e) => setHeaderSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Escape' && setHeaderSearchOpen(false)}
                    placeholder="Search tools & pages…"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-stone-200/90 dark:border-stone-600 bg-white dark:bg-stone-900/60 text-stone-800 dark:text-stone-100 placeholder-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600/25 focus:border-violet-600/50"
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
                  className={`block w-full text-left px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
                    currentPage === id
                      ? 'text-violet-800 dark:text-violet-300 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-sm'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100/80 dark:hover:bg-stone-800/80'
                  }`}
                >
                  {label}
                </button>
              ))}
              <div className="pt-2 pb-1 flex flex-col gap-2">
                <button
                  onClick={() => { onNavigate?.('login'); setIsMobileMenuOpen(false); }}
                  className="block text-center px-4 py-2.5 text-sm font-medium text-stone-700 dark:text-stone-300 rounded-lg border border-stone-300/90 dark:border-stone-600 bg-white dark:bg-stone-900/40 hover:bg-stone-50 dark:hover:bg-stone-800 transition-all shadow-sm"
                >
                  Log in
                </button>
                <button
                  onClick={() => { onNavigate?.('signup'); setIsMobileMenuOpen(false); }}
                  className="block text-center px-4 py-2.5 text-white text-sm font-semibold rounded-lg bg-violet-700 hover:bg-violet-800 dark:bg-violet-600 dark:hover:bg-violet-500 transition-colors shadow-md shadow-violet-900/15"
                >
                  Sign up free
                </button>
              </div>
              </div>
            </div>
          </div>
        )}
        <div
          className="h-px bg-gradient-to-r from-transparent via-violet-400/25 to-transparent dark:via-violet-500/18"
          aria-hidden
        />
      </header>
      {showPromoBanner && <PromoBanner />}
      </>
    );
  }

  // ── Logged-in header ───────────────────────────────────────────────────────
  const navActiveCls =
    'bg-white dark:bg-stone-800 text-violet-800 dark:text-violet-300 shadow-sm border border-stone-200/90 dark:border-stone-600/80';
  const navInactiveCls =
    'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100/80 dark:hover:bg-stone-800/70';

  const loggedInHeaderBg = opaqueHeader
    ? isScrolled
      ? 'bg-white dark:bg-stone-950 shadow-[0_10px_40px_-12px_rgba(15,23,42,0.1)] dark:shadow-[0_10px_40px_-12px_rgba(0,0,0,0.4)] border-stone-200/90 dark:border-stone-800'
      : 'bg-[#f9f9fb] dark:bg-stone-950 border-stone-200/80 dark:border-stone-800/90'
    : isScrolled
      ? 'bg-white/93 dark:bg-stone-950/93 shadow-[0_10px_40px_-12px_rgba(15,23,42,0.1)] dark:shadow-[0_10px_40px_-12px_rgba(0,0,0,0.4)] border-stone-200/90 dark:border-stone-800'
      : 'bg-[#f9f9fb]/92 dark:bg-stone-950/90 border-stone-200/80 dark:border-stone-800/90';

  return (
    <header
      className={`sticky top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${opaqueHeader ? '' : 'backdrop-blur-md'} ${loggedInHeaderBg}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[3.5rem] sm:h-[4.25rem]">
          {/* Logo */}
          <button
            type="button"
            onClick={() => onNavigate?.('dashboard')}
            className="flex items-center gap-2.5 sm:gap-3 group min-w-0 shrink"
            aria-label="WriteScholar dashboard"
          >
            <div className="relative w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-xl border border-stone-200/80 dark:border-stone-700 bg-white/90 dark:bg-stone-900/50 shadow-sm group-hover:shadow transition-all duration-200 overflow-hidden shrink-0">
              <img src="/mascot.png" alt="" className="w-[85%] h-[85%] object-contain" fetchPriority="high" width="40" height="40" />
            </div>
            <span
              className="text-[1.05rem] sm:text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-50 group-hover:text-violet-800 dark:group-hover:text-violet-300 transition-colors truncate max-w-[120px] sm:max-w-none"
              style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
            >
              WriteScholar
            </span>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-2 min-w-0">
            <div className="flex items-center rounded-xl border border-stone-200/85 dark:border-stone-700/90 bg-white/70 dark:bg-stone-900/45 p-1 shadow-sm">
              <button
                onClick={() => onNavigate?.('dashboard')}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  currentPage === 'dashboard' ? navActiveCls : navInactiveCls
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => onNavigate?.('library')}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  currentPage === 'library' ? navActiveCls : navInactiveCls
                }`}
              >
                Library
              </button>
              <button
                onClick={() => onNavigate?.('upload')}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  currentPage === 'upload' ? navActiveCls : navInactiveCls
                }`}
              >
                Upload
              </button>
              <button
                onClick={() => onNavigate?.('analysis')}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  currentPage === 'analysis' ? navActiveCls : navInactiveCls
                }`}
              >
                AI Analysis
              </button>
              <button
                onClick={() => onNavigate?.('citation-history')}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  currentPage === 'citations' ? navActiveCls : navInactiveCls
                }`}
              >
                Citations
              </button>
            </div>

            <button
              onClick={() => onNavigate?.('quiz-history')}
              className={`ml-1 px-3.5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center gap-1.5 bg-violet-700 hover:bg-violet-800 dark:bg-violet-600 dark:hover:bg-violet-500 text-white shadow-md shadow-violet-900/15 dark:shadow-violet-950/25 ring-1 ring-violet-900/10 dark:ring-white/10 ${
                currentPage === 'quiz-history' ? 'ring-2 ring-amber-400/90 ring-offset-2 ring-offset-[#f9f9fb] dark:ring-offset-stone-950' : ''
              }`}
            >
              <span>Saved Materials</span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-white/20 text-white rounded-md">Pro</span>
            </button>

            {/* Friends button - emerald to match dashboard (hidden when HIDE_FRIENDS) */}
            {!HIDE_FRIENDS && (
            <button
              onClick={() => onNavigate?.('friends')}
              className={`ml-1 px-3.5 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-1.5 border shadow-sm ${
                currentPage === 'friends'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200/90 dark:border-emerald-800/60'
                  : 'bg-white/80 dark:bg-stone-900/40 border-stone-200/85 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:border-emerald-200/90 dark:hover:border-emerald-800/50 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/25'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Friends</span>
            </button>
            )}
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

            {/* Mobile menu button - solid violet to match Sign up / Saved Materials */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="mobile-menu-button lg:hidden p-2 rounded-lg border border-stone-300/90 dark:border-stone-600 bg-white dark:bg-stone-900/50 text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors shadow-sm"
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
            >
              <svg className={`w-5 h-5 transition-transform duration-200 ${isMobileMenuOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  className="flex items-center gap-2.5 p-1 pr-2.5 rounded-lg bg-white dark:bg-stone-900/50 border border-stone-200/90 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800/80 transition-all duration-200 shadow-sm"
                >
                  <div className="w-8 h-8 rounded-lg bg-violet-700 dark:bg-violet-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
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
                  <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-stone-900 backdrop-blur-xl rounded-xl shadow-[0_20px_50px_-12px_rgba(15,23,42,0.2)] dark:shadow-black/40 border border-stone-200/95 dark:border-stone-700 z-[60] overflow-hidden">
                    {/* User Info Section - glass style like dashboard greeting */}
                    <div className="px-4 py-4 bg-stone-50/90 dark:bg-stone-800/50 border-b border-stone-200/80 dark:border-stone-700/80">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-lg bg-violet-700 dark:bg-violet-600 flex items-center justify-center text-white font-semibold text-base shadow-sm">
                          {(user.username || user.name || user.email) ? (user.username || user.name || user.email).charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-stone-800 dark:text-stone-100">
                            {user?.username ? `@${user.username}` : user?.name || user?.email || 'User'}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              usageStats?.plan === 'pro' || usageStats?.plan === 'premium' || usageStats?.plan === 'focus'
                                ? 'bg-lime-100 dark:bg-lime-900/50 text-lime-700 dark:text-lime-400'
                                : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-400'
                            }`}>
                              {usageStats?.plan === 'pro' || usageStats?.plan === 'premium' || usageStats?.plan === 'focus'
                                ? 'Pro'
                                : 'Free'}
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
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
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

      <div
        className="h-px bg-gradient-to-r from-transparent via-violet-400/25 to-transparent dark:via-violet-500/18"
        aria-hidden
      />

      {/* Mobile Menu */}
      <div className={`lg:hidden mobile-menu-container overflow-hidden transition-all duration-300 ease-out ${
        isMobileMenuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div
          className={`px-4 py-4 border-t border-stone-200/80 dark:border-stone-800 max-w-7xl mx-auto ${
            opaqueHeader ? 'bg-[#f9f9fb] dark:bg-stone-950' : 'bg-[#f9f9fb] dark:bg-stone-950/98 backdrop-blur-md'
          }`}
        >
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
                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  currentPage === (page || id)
                    ? 'bg-white dark:bg-stone-900 text-violet-800 dark:text-violet-300 border border-stone-200 dark:border-stone-700 shadow-sm'
                    : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100/90 dark:hover:bg-stone-800/80'
                }`}
              >
                {label}
              </button>
            ))}

            <button
              onClick={() => { onNavigate?.('quiz-history'); setIsMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-between bg-violet-700 hover:bg-violet-800 dark:bg-violet-600 dark:hover:bg-violet-500 text-white shadow-md ${
                currentPage === 'quiz-history' ? 'ring-2 ring-amber-400/90 ring-offset-2 ring-offset-[#f9f9fb] dark:ring-offset-stone-950' : ''
              }`}
            >
              <span>Saved Materials</span>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-white/20 rounded-md">Pro</span>
            </button>

            {!HIDE_FRIENDS && (
            <button
              onClick={() => { onNavigate?.('friends'); setIsMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 border ${
                currentPage === 'friends'
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-200/90 dark:border-emerald-800/60'
                  : 'text-stone-600 dark:text-stone-400 border-transparent hover:bg-emerald-50/60 dark:hover:bg-emerald-950/20'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Friends
            </button>
            )}

            <button
              onClick={() => { onNavigate?.('blog'); setIsMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                currentPage === 'blog'
                  ? 'bg-white dark:bg-stone-900 text-violet-800 dark:text-violet-300 border border-stone-200 dark:border-stone-700 shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100/90 dark:hover:bg-stone-800/80'
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
