import React, { useState, useEffect } from 'react';
import { HIDE_FRIENDS } from '../../config/featureFlags';
import { getResetsInText } from '../../utils/usageReset';
import { useWorkspaceChrome, shouldHideLegacyHeader, isSessionAuthenticated } from '../workspace/workspaceChrome';

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
  /** Post-signup analysis tour: highlight Library nav for the Library step. */
  libraryActivationHighlight?: boolean;
  /** Analysis activation tutorial: disable all nav, logo, and menu clicks (coach controls the flow). */
  blockNavigationInteractions?: boolean;
}

/** `pointer-events: none` on a parent does not block children; this class disables hits on the bar and every descendant. */
const blockNavPointerCls = 'pointer-events-none [&_*]:pointer-events-none';

/** Matches dashboard workspace / mobile tool rail: Duolingo 3D capsule. */
const dashboardNavRailOuterCls =
  'relative inline-flex items-center gap-1 p-1.5 sm:p-2 rounded-2xl bg-white dark:bg-stone-900 border-2 border-b-4 border-stone-200 dark:border-stone-700';

const dashboardNavRailWashCls =
  'pointer-events-none absolute inset-0 rounded-2xl';

const dashboardLogoTileCls =
  'relative rounded-xl bg-white dark:bg-stone-900 border-2 border-b-4 border-stone-200 dark:border-stone-700';

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

const Header: React.FC<HeaderProps> = ({
  onNavigate,
  user,
  onLogout,
  currentPage,
  sticky = true,
  opaqueHeader = false,
  libraryActivationHighlight = false,
  blockNavigationInteractions = false,
}) => {
  const inWorkspaceChrome = useWorkspaceChrome();

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

  /** Analysis activation tour: on small screens Library lives in the collapsible menu — open it so the coach arrow can target it. */
  useEffect(() => {
    if (!libraryActivationHighlight) return;
    if (typeof window.matchMedia === 'undefined') return;
    const mq = window.matchMedia('(max-width: 1023px)');
    if (mq.matches) setIsMobileMenuOpen(true);
  }, [libraryActivationHighlight]);

  useEffect(() => {
    if (blockNavigationInteractions) {
      setIsMobileMenuOpen(false);
      setIsDropdownOpen(false);
    }
  }, [blockNavigationInteractions]);

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
    return 'text-[#8A48C7]';
  };

  if (shouldHideLegacyHeader(currentPage, isSessionAuthenticated(!!user), inWorkspaceChrome)) return null;

  // ── Logged-out (public) header - matches landing page nav ───────────────────
  if (!user) {
    const publicNavItems = [
      { id: 'features', label: 'Features' },
      { id: 'pricing', label: 'Pricing' },
      { id: 'blog', label: 'Blog' },
      { id: 'about', label: 'About' },
    ];
    // Every logged-out page uses the new purple-themed public header
    // (purple bg, white text, white Log-in pill, yellow Start-free pill).
    // We're already inside `if (!user)` here so any page rendered while
    // signed-out picks this variant up automatically.
    const isLandingPurple = true;

    const publicNavActiveCls = isLandingPurple
      ? 'bg-white/25 text-white font-bold border-2 border-white/40'
      : 'bg-[#F3EAFF] dark:bg-[#A560E8]/15 text-[#A560E8] font-bold border-2 border-[#A560E8]/30 dark:border-[#A560E8]/30';
    const publicNavInactiveCls = isLandingPurple
      ? 'text-white hover:text-[#FFC800] hover:bg-white/10'
      : 'text-stone-600 dark:text-stone-400 hover:text-[#A560E8] dark:hover:text-[#A560E8] hover:bg-[#F3EAFF]/50 dark:hover:bg-[#A560E8]/10';
    const publicHeaderBg = isLandingPurple
      ? isScrolled
        ? 'bg-[#A560E8] shadow-[0_4px_24px_-4px_rgba(107,39,163,0.45)] border-[#7733B5]/40'
        : 'bg-[#A560E8] border-[#7733B5]/30'
      : opaqueHeader
        ? isScrolled
          ? 'bg-white dark:bg-stone-950 shadow-sm border-stone-200 dark:border-stone-800'
          : 'bg-white dark:bg-stone-950 border-stone-200 dark:border-stone-800'
        : isScrolled
          ? 'bg-white dark:bg-stone-950 shadow-sm border-stone-200 dark:border-stone-800'
          : 'bg-white dark:bg-stone-950 border-stone-200 dark:border-stone-800';

    return (
      <>
      <header
        className={`sticky top-0 left-0 right-0 z-[100] transition-all duration-300 border-b-2 ${publicHeaderBg} ${
          blockNavigationInteractions ? blockNavPointerCls : ''
        }`}
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
              <div className={`relative w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-xl border-2 border-b-4 ${isLandingPurple ? 'border-white/40 bg-white shadow-[0_4px_12px_-2px_rgba(0,0,0,0.20)] group-hover:border-white' : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 group-hover:border-[#A560E8]/40'} transition-all duration-200 shrink-0 overflow-hidden`}>
                <img src="/main-logo.png" alt="" className="w-[85%] h-[85%] object-contain" fetchPriority="high" width="40" height="40" />
              </div>
              <span
                className={`text-[1.05rem] sm:text-lg font-extrabold tracking-tight transition-colors duration-200 truncate max-w-[130px] sm:max-w-none ${isLandingPurple ? 'text-white group-hover:text-[#FFC800]' : 'text-stone-900 dark:text-stone-50 group-hover:text-[#A560E8]'}`}
                style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
              >
                WriteScholar
              </span>
            </button>

            {/* Desktop Navigation — centered (no search on logged-out bar) */}
            <nav className="hidden lg:flex flex-1 items-center justify-center min-w-0">
              <div className={`flex items-center ${isLandingPurple ? 'gap-1' : 'rounded-2xl border-2 border-b-4 p-1 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900'}`}>
                {publicNavItems.map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => onNavigate?.(id)}
                    className={`px-3.5 py-2 text-sm rounded-lg transition-all duration-200 ${isLandingPurple ? 'font-bold' : 'font-medium'} ${
                      currentPage === id ? publicNavActiveCls : publicNavInactiveCls
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 shrink-0">
              <button
                onClick={() => onNavigate?.('login')}
                className={`hidden sm:inline-flex px-4 py-2 text-sm font-bold uppercase tracking-wide rounded-xl border-2 border-b-4 active:border-b-2 active:translate-y-0.5 transition-all shrink-0 ${isLandingPurple ? 'text-[#6B27A3] bg-white border-white/70 hover:bg-stone-50' : 'text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800'}`}
              >
                Log in
              </button>
              <button
                onClick={() => onNavigate?.('signup')}
                className={`inline-flex items-center justify-center px-4 py-2 sm:px-5 text-sm font-extrabold uppercase tracking-wide rounded-xl border-2 border-b-4 active:border-b-2 active:translate-y-0.5 transition-all whitespace-nowrap shrink-0 ${isLandingPurple ? 'text-[#6B27A3] bg-[#FFC800] hover:bg-[#FFD52E] border-[#D4A300]' : 'text-white bg-[#A560E8] hover:bg-[#9450D8] border-[#8A48C7]'}`}
              >
                Sign up
              </button>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`mobile-menu-button lg:hidden p-2 rounded-xl border-2 border-b-4 active:border-b-2 active:translate-y-0.5 transition-all shrink-0 ${isLandingPurple ? 'border-white/40 bg-white/15 text-white hover:bg-white/25' : 'border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800'}`}
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
        {/* Mobile menu - mobile-menu-container required so click-outside doesn't close before onClick fires */}
        {isMobileMenuOpen && (
          <div
            className={`lg:hidden mobile-menu-container border-t-2 ${isLandingPurple ? 'border-white/20 bg-[#A560E8]' : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950'}`}
          >
            <div className="px-4 py-3 max-w-7xl mx-auto">
              <div className="space-y-1">
              {publicNavItems.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => { onNavigate?.(id); setIsMobileMenuOpen(false); }}
                  className={`block w-full text-left px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
                    isLandingPurple
                      ? currentPage === id
                        ? 'text-white bg-white/25 border-2 border-white/40 font-bold'
                        : 'text-white/85 hover:text-white hover:bg-white/15'
                      : currentPage === id
                        ? 'text-[#A560E8] bg-[#F3EAFF] dark:bg-[#A560E8]/15 border-2 border-[#A560E8]/30 dark:border-[#A560E8]/30 font-bold'
                        : 'text-stone-600 dark:text-stone-400 hover:text-[#A560E8] hover:bg-[#F3EAFF]/50 dark:hover:bg-[#A560E8]/10'
                  }`}
                >
                  {label}
                </button>
              ))}
              <div className="pt-2 pb-1 flex flex-col gap-2">
                <button
                  onClick={() => { onNavigate?.('login'); setIsMobileMenuOpen(false); }}
                  className={`block text-center px-4 py-2.5 text-sm font-bold uppercase tracking-wide rounded-xl border-2 border-b-4 active:border-b-2 active:translate-y-0.5 transition-all ${isLandingPurple ? 'text-[#6B27A3] bg-white border-white/70 hover:bg-stone-50' : 'text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800'}`}
                >
                  Log in
                </button>
                <button
                  onClick={() => { onNavigate?.('signup'); setIsMobileMenuOpen(false); }}
                  className={`block text-center px-4 py-2.5 text-sm font-extrabold uppercase tracking-wide rounded-xl border-2 border-b-4 active:border-b-2 active:translate-y-0.5 transition-all ${isLandingPurple ? 'text-[#6B27A3] bg-[#FFC800] hover:bg-[#FFD52E] border-[#D4A300]' : 'text-white bg-[#A560E8] hover:bg-[#9450D8] border-[#8A48C7]'}`}
                >
                  Sign up
                </button>
              </div>
              </div>
            </div>
          </div>
        )}
        <div
          className={`h-[2px] ${isLandingPurple ? 'bg-white/15' : 'bg-stone-200 dark:bg-stone-800'}`}
          aria-hidden
        />
      </header>
      </>
    );
  }

  // ── Logged-in header ───────────────────────────────────────────────────────
  // Per user brief the authenticated header now uses the same brand-purple
  // styling as the landing page hero header (`#A560E8` background, white
  // logo/nav text with yellow `#FFC800` hover accents, white-translucent
  // wash for active nav, yellow CTA for the Saved Materials pill). Mirrors
  // the `isLandingPurple` branch of the logged-out header above so both
  // states read as one visual identity.
  const navActiveCls =
    'bg-white/25 text-white font-bold border-2 border-white/40';
  const navInactiveCls =
    'text-white hover:text-[#FFC800] hover:bg-white/10 active:scale-[0.98]';

  const loggedInHeaderBg = isScrolled
    ? 'bg-[#A560E8] shadow-[0_4px_24px_-4px_rgba(107,39,163,0.45)] border-[#7733B5]/40'
    : 'bg-[#A560E8] border-[#7733B5]/30';

  const headerRingOffsetCls = 'ring-offset-[#A560E8]';

  return (
    <header
      className={`${sticky ? 'sticky top-0' : 'relative'} left-0 right-0 z-[100] transition-all duration-300 border-b-2 ${loggedInHeaderBg} ${
        blockNavigationInteractions ? blockNavPointerCls : ''
      }`}
    >
      {/* The previous 3px green accent stripe across the top of the
          header was a visual cue specific to the logged-in state. Per
          user brief, the logged-in header now matches the logged-out
          header's style — plain white bar with a stone-coloured
          bottom border. Re-add the green stripe here if you want to
          differentiate the authenticated state again. */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex items-center justify-between h-[3.5rem] sm:h-[4.25rem]">
          {/* Logo */}
          <button
            type="button"
            onClick={() => onNavigate?.('dashboard')}
            className="flex items-center gap-2.5 sm:gap-3 group min-w-0 shrink"
            aria-label="WriteScholar dashboard"
          >
            <div
              className="relative w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-xl border-2 border-b-4 border-white/40 bg-white shadow-[0_4px_12px_-2px_rgba(0,0,0,0.20)] group-hover:border-white transition-all duration-200 shrink-0 overflow-hidden"
            >
              <img src="/main-logo.png" alt="" className="w-[85%] h-[85%] object-contain" fetchPriority="high" width="40" height="40" />
            </div>
            <span
              className="text-[1.05rem] sm:text-lg font-extrabold tracking-tight text-white group-hover:text-[#FFC800] transition-all duration-200 truncate max-w-[120px] sm:max-w-none"
              style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
            >
              WriteScholar
            </span>
          </button>

          {/* Desktop Navigation — purple variant. The white capsule
              wrapper used previously (dashboardNavRailOuterCls) was
              removed because it clashed with the purple bar. Buttons
              now sit inline with `gap-1`, mirroring the landing-purple
              nav layout. */}
          <nav className="hidden lg:flex items-center gap-2 min-w-0">
            <div className="flex items-center gap-1">
              {/* Dashboard tab hidden — Documents is the home/workspace
                  now (the logo still navigates there). */}
              {/* Unified Documents tab — replaces the previous
                  three-link group (Library + Upload + Write) per
                  the Documents refactor. The activation tour's
                  Library highlight still targets this button via
                  the same data-attribute so onboarding flows keep
                  working. */}
              <button
                type="button"
                onClick={() => onNavigate?.('documents')}
                data-activation-library-tab
                className={`px-3.5 py-2 text-sm rounded-lg transition-all duration-200 font-bold inline-flex items-center gap-1 ${
                  currentPage === 'documents' ? navActiveCls : navInactiveCls
                } ${
                  libraryActivationHighlight
                    ? `ring-2 ring-[#A560E8]/90 ring-offset-2 ${headerRingOffsetCls} z-[210] relative`
                    : ''
                }`}
              >
                Documents
                <span className="ml-1 px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wider bg-[#A560E8] text-white rounded-md leading-none">
                  New
                </span>
              </button>
              <button
                onClick={() => onNavigate?.('analysis')}
                className={`px-3.5 py-2 text-sm rounded-lg transition-all duration-200 font-bold ${
                  currentPage === 'analysis' ? navActiveCls : navInactiveCls
                }`}
              >
                AI Analysis
              </button>
              <button
                onClick={() => onNavigate?.('citation-history')}
                className={`px-3.5 py-2 text-sm rounded-lg transition-all duration-200 font-bold ${
                  currentPage === 'citations' ? navActiveCls : navInactiveCls
                }`}
              >
                Citations
              </button>
            </div>

            <button
              onClick={() => onNavigate?.('quiz-history')}
              className={`ml-1 px-3.5 py-2.5 text-sm font-extrabold uppercase tracking-wide rounded-xl transition-all duration-200 flex items-center gap-1.5 bg-[#FFC800] hover:bg-[#FFD52E] text-[#6B27A3] border-2 border-b-4 border-[#D4A300] active:border-b-2 active:translate-y-0.5 ${
                currentPage === 'quiz-history' ? `ring-2 ring-[#FFC800]/70 ring-offset-2 ${headerRingOffsetCls}` : ''
              }`}
            >
              <span>Saved Materials</span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-[#6B27A3]/15 text-[#6B27A3] rounded-md">Pro</span>
            </button>

            {/* Friends button - emerald to match dashboard (hidden when HIDE_FRIENDS) */}
            {!HIDE_FRIENDS && (
            <button
              onClick={() => onNavigate?.('friends')}
              className={`ml-1 px-3.5 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 flex items-center gap-1.5 border-2 border-b-4 active:border-b-2 active:translate-y-0.5 ${
                currentPage === 'friends'
                  ? 'bg-white/25 text-white border-white/40'
                  : 'bg-white/15 border-white/30 text-white hover:bg-white/25 hover:border-white/50'
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

            {/* Mobile menu button — white-translucent on the purple
                bar, matching the landing-purple variant. */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="mobile-menu-button lg:hidden relative p-2 rounded-xl border-2 border-b-4 border-white/40 bg-white/15 text-white hover:bg-white/25 active:border-b-2 active:translate-y-0.5 transition-all"
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
                  className="flex items-center gap-2.5 p-1 pr-2.5 rounded-xl bg-white/15 border-2 border-b-4 border-white/40 hover:bg-white/25 active:border-b-2 active:translate-y-0.5 transition-all duration-200"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#FFC800] border-2 border-[#D4A300] flex items-center justify-center text-[#6B27A3] font-bold text-sm">
                    {String(user.username || user.name || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-semibold text-white leading-tight">
                      {user.username ? `@${user.username}` : user.name || user.email?.split('@')?.[0] || 'User'}
                    </div>
                    <div className="text-xs text-white/75 capitalize">{usageStats?.plan || 'Free'}</div>
                  </div>
                  <svg
                    className={`w-4 h-4 text-white/75 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-stone-900 rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-700 z-[200] overflow-hidden">
                    {/* User Info Section - glass style like dashboard greeting */}
                    <div className="px-4 py-4 bg-stone-50/90 dark:bg-stone-800/50 border-b border-stone-200/80 dark:border-stone-700/80">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-[#A560E8] border-2 border-[#8A48C7] flex items-center justify-center text-white font-bold text-base">
                          {String(user.username || user.name || user.email || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-stone-800 dark:text-stone-100">
                            {user?.username ? `@${user.username}` : user?.name || user?.email || 'User'}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold border ${
                              usageStats?.plan === 'pro' || usageStats?.plan === 'premium' || usageStats?.plan === 'focus'
                                ? 'bg-[#F3EAFF] border-[#A560E8]/30 text-[#A560E8]'
                                : 'bg-stone-100 dark:bg-stone-700 border-stone-200 dark:border-stone-600 text-stone-600 dark:text-stone-400'
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
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#A560E8] border-t-transparent"></div>
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
                                    getUsagePercentage(usageStats.storageUsed, usageStats.storageLimit) >= 70 ? 'bg-yellow-500' : 'bg-[#A560E8]'
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
                                <div className={`text-sm font-semibold ${usageStats.combinedActionsRemaining === -1 ? 'text-[#8A48C7]' : usageStats.combinedActionsRemaining <= 0 ? 'text-red-600' : usageStats.combinedActionsRemaining <= 10 ? 'text-yellow-600' : 'text-[#8A48C7]'}`}>
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
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-[#A560E8] hover:bg-[#F3EAFF] dark:hover:bg-[#A560E8]/10 transition-colors"
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
        className="h-[2px] bg-stone-200 dark:bg-stone-800"
        aria-hidden
      />

      {/* Mobile Menu */}
      <div className={`lg:hidden mobile-menu-container overflow-hidden transition-all duration-300 ease-out ${
        isMobileMenuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div
          className="px-4 py-4 border-t-2 border-white/20 max-w-7xl mx-auto bg-[#A560E8]"
        >
          <div className="space-y-1">
            {[
              // Dashboard entry hidden — Documents is the home now.
              // Library + Upload + Write collapsed into the
              // unified Documents hub.
              { id: 'documents', label: 'Documents' },
              { id: 'analysis', label: 'AI Analysis' },
              { id: 'citation-history', label: 'Citations', page: 'citations' },
            ].map(({ id, label, page }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  onNavigate?.(id);
                  setIsMobileMenuOpen(false);
                }}
                {...(id === 'library' ? { 'data-activation-library-tab': true } : {})}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  currentPage === (page || id)
                    ? 'bg-white/25 text-white border-2 border-white/40 font-bold'
                    : 'text-white/85 hover:text-white hover:bg-white/15'
                } ${
                  id === 'library' && libraryActivationHighlight
                    ? `ring-2 ring-white/85 ring-offset-2 ${headerRingOffsetCls}`
                    : ''
                }`}
              >
                {label}
              </button>
            ))}

            <button
              onClick={() => { onNavigate?.('quiz-history'); setIsMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-extrabold uppercase tracking-wide transition-all duration-200 flex items-center justify-between bg-[#FFC800] hover:bg-[#FFD52E] text-[#6B27A3] border-2 border-b-4 border-[#D4A300] active:border-b-2 active:translate-y-0.5 ${
                currentPage === 'quiz-history' ? `ring-2 ring-[#FFC800]/70 ring-offset-2 ${headerRingOffsetCls}` : ''
              }`}
            >
              <span>Saved Materials</span>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-[#6B27A3]/15 text-[#6B27A3] rounded-md">Pro</span>
            </button>

            {!HIDE_FRIENDS && (
            <button
              onClick={() => { onNavigate?.('friends'); setIsMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 flex items-center gap-2 border-2 border-b-4 active:border-b-2 active:translate-y-0.5 ${
                currentPage === 'friends'
                  ? 'bg-white/25 text-white border-white/40'
                  : 'bg-white/15 border-white/30 text-white hover:bg-white/25 hover:border-white/50'
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
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                currentPage === 'blog'
                  ? 'bg-white/25 text-white border-2 border-white/40'
                  : 'text-white/85 hover:text-white hover:bg-white/15'
              }`}
            >
              Blog
            </button>
          </div>
        </div>
      </div>
      {/* Bottom 2px hairline — `white/15` matches the landing-purple
          variant of the logged-out header. */}
      <div
        className="h-[2px] bg-white/15"
        aria-hidden
      />
    </header>
  );
};

export default Header;
