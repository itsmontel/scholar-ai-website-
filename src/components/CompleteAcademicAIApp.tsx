import { useState, useEffect } from 'react';
import { logger } from '../utils/logger';

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
import QuizHistoryPage from './pages/QuizHistoryPage';
import UploadPage from './pages/UploadPage';
import SettingsPage from './pages/SettingsPage';
import AccountPage from './pages/AccountPage';
import PricingPage from './pages/PricingPage';
import FeaturesPage from './pages/FeaturesPage';
import ProfilePage from './pages/ProfilePage';
import LibraryPage from './pages/LibraryPage';
import FAQPage from './pages/HelpCenterPage';
import AboutPage from './pages/AboutPage';
import WhyStudentsChoosePage from './pages/WhyStudentsChoosePage';
import StudyToolsComparisonPage from './pages/StudyToolsComparisonPage';
import ContactPage from './pages/ContactPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import BillingPage from './pages/BillingPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import UnsubscribePage from './pages/UnsubscribePage';
import BlogPage from './pages/BlogPage';
import BlogPostPage from './pages/BlogPostPage';

// Import free tool pages
import WordCounterPage from './pages/tools/WordCounterPage';
import CitationGeneratorToolPage from './pages/tools/CitationGeneratorToolPage';
import ReadabilityScorePage from './pages/tools/ReadabilityScorePage';
import ParaphrasingTipsPage from './pages/tools/ParaphrasingTipsPage';
import EssayOutlineGeneratorPage from './pages/tools/EssayOutlineGeneratorPage';
import TextCaseConverterPage from './pages/tools/TextCaseConverterPage';
import ThesisGeneratorPage from './pages/tools/ThesisGeneratorPage';
import GrammarCheckerPage from './pages/tools/GrammarCheckerPage';
import HumanizerPage from './pages/tools/HumanizerPage';
import SummarizerPage from './pages/tools/SummarizerPage';
import QuizGeneratorPage from './pages/tools/QuizGeneratorPage';
import GPACalculatorPage from './pages/tools/GPACalculatorPage';
import PomodoroTimerPage from './pages/tools/PomodoroTimerPage';
import LightningReflexQuizPage from './pages/tools/LightningReflexQuizPage';

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
          logger.log('Initializing user state from localStorage:', parsedUser);
          setIsLoggedIn(true);
          setUser(parsedUser);
        }
      } catch (error) {
        logger.error('Error parsing initial user data:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      }
    }
  }, []);

  // Route protection for authenticated pages
  const protectedRoutes = ['dashboard', 'analysis', 'analysis-history', 'citation-results', 'citation-history', 'quiz-history', 'upload', 'settings', 'profile', 'library', 'account', 'billing'];

  // SEO: dynamic document title and meta description per page (SPA)
  const pageMeta: Record<string, { title: string; description: string }> = {
    landing: { title: 'WriteScholar — AI Study Tools: Humanizer, Quiz Generator, Essay Checker', description: 'The complete AI toolkit for students. Humanize AI text, generate quizzes from notes, summarize papers, find citations, get essay feedback. Free to start.' },
    features: { title: 'AI Study Tools: Humanizer, Quiz Generator & More | WriteScholar', description: 'AI Humanizer to bypass detectors, Quiz Generator from text, Paper Summarizer, Citation Finder, Essay Checker. All the tools students need.' },
    pricing: { title: 'Pricing Plans: Free, Starter & Premium | WriteScholar', description: 'Free plan with AI Humanizer, Summarizer, and Essay Checker. Starter adds Quiz Generator. Premium unlocks all features and models. Annual plans save 2 months.' },
    about: { title: 'About WriteScholar: The AI Toolkit for Students', description: 'WriteScholar is the complete AI toolkit for students. Humanize AI text, generate quizzes, summarize papers, find citations. Serving students worldwide.' },
    'why-students-choose': { title: 'WriteScholar vs Grammarly vs QuillBot: Honest Comparison 2026', description: 'See how WriteScholar compares to Grammarly and QuillBot. Built for academic writing, citation finder, AI humanizer, essay analysis, and more.' },
    'study-tools-comparison': { title: 'WriteScholar vs Quizlet vs Knowt: Best AI Study Tools 2026', description: 'Compare WriteScholar, Quizlet, and Knowt. Quizzes, flashcards, crosswords—plus essay analysis, citations, and AI humanizer. See which fits your study style.' },
    help: { title: 'Help & FAQ: AI Humanizer, Quiz Generator & More | WriteScholar', description: 'Get help with AI Humanizer, Quiz Generator, Paper Summarizer, Citation Finder. Supported citation styles: APA, Harvard, MLA, Chicago.' },
    contact: { title: 'Contact WriteScholar Support | Get Help Fast', description: 'Contact WriteScholar support for help with AI tools for students.' },
    privacy: { title: 'Privacy Policy | WriteScholar', description: 'WriteScholar privacy policy and data handling.' },
    terms: { title: 'Terms of Service | WriteScholar', description: 'WriteScholar terms of service.' },
    login: { title: 'Log In | WriteScholar', description: 'Log in to access AI Humanizer, Quiz Generator, Summarizer, and more.' },
    signup: { title: 'Sign Up Free | WriteScholar', description: 'Create your free account. Get AI Humanizer, Paper Summarizer, Essay Checker, and Citation Finder.' },
    blog: { title: 'Study Tips & Academic Writing Guides | WriteScholar Blog', description: 'Guides on humanizing AI text, creating study quizzes, summarizing research papers, APA/MLA citations, and academic writing tips.' },
    'word-counter': { title: 'Free Word Counter Tool – Count Words & Characters Instantly | WriteScholar', description: 'Count words, characters, sentences, and paragraphs instantly. Free online word counter for essays, academic papers, and assignments with word limits.' },
    'citation-generator-tool': { title: 'Free Citation Generator – APA, MLA, Chicago, Harvard | WriteScholar', description: 'Generate properly formatted citations in APA, MLA, Chicago, and Harvard styles. Free citation generator for research papers, essays, and bibliographies.' },
    'readability-score': { title: 'Free Readability Score Calculator – Flesch-Kincaid & More | WriteScholar', description: 'Check your text readability with Flesch-Kincaid scores. Free readability checker shows grade level and reading ease for academic writing.' },
    'paraphrasing-tips': { title: 'Free Paraphrasing Tips Tool – Find Overused Words & Improve Writing | WriteScholar', description: 'Find overused words, passive voice, and wordy phrases in your writing. Free paraphrasing helper with synonym suggestions for better academic writing.' },
    'essay-outline': { title: 'Free Essay Outline Generator – Create Outlines in Seconds | WriteScholar', description: 'Generate structured essay outlines for argumentative, expository, narrative, compare-contrast, persuasive, and research papers. Free outline templates.' },
    'text-case-converter': { title: 'Free Text Case Converter – UPPERCASE, lowercase, Title Case | WriteScholar', description: 'Convert text to UPPERCASE, lowercase, Title Case, Sentence case, and more. Perfect for formatting titles, headings, and fixing caps lock mistakes.' },
    'thesis-generator': { title: 'Free Thesis Statement Generator – Create Strong Thesis Statements | WriteScholar', description: 'Create strong thesis statements for argumentative, expository, analytical, and compare-contrast essays. Template-based thesis builder.' },
    'grammar-checker': { title: 'Free Grammar Checker – Fix Spelling & Grammar Errors | WriteScholar', description: 'Check your writing for common spelling mistakes, grammar errors, punctuation issues, and style suggestions. Quick client-side grammar check.' },
    'humanizer': { title: 'AI Humanizer – Bypass AI Detection | WriteScholar', description: 'Transform AI-generated text from ChatGPT, Claude, Gemini into undetectable human writing. Bypass Turnitin, GPTZero, and other AI detectors. Free to try.' },
    'summarizer': { title: 'AI Summarizer – Condense Papers & Articles | WriteScholar', description: 'Summarize research papers, articles, and textbooks into key points. Bullet points or paragraphs. Perfect for literature reviews. Free to try.' },
    'quiz-generator': { title: 'AI Quiz Generator – Create Study Quizzes from Text | WriteScholar', description: 'Turn notes, articles, and textbooks into interactive quizzes. Multiple choice, true/false questions. Perfect for exam prep. Free plan: 3 quizzes/month.' },
    'flashcard-generator': { title: 'AI Flashcard Generator – Create Study Flashcards from Text | WriteScholar', description: 'Transform your notes, articles, and textbooks into interactive flashcards. Perfect for memorization and exam prep. Free plan: 3 generations/month.' },
    'crossword-generator': { title: 'AI Crossword Generator – Create Study Crosswords from Text | WriteScholar', description: 'Turn your notes and study materials into engaging crossword puzzles. Fun way to memorize key terms. Free plan: 3 generations/month.' },
    'quiz-history': { title: 'My Study Tools | WriteScholar', description: 'View and retake your saved quizzes, flashcards, and crosswords. Study materials are stored for 7 days.' },
    'gpa-calculator': { title: 'Free GPA Calculator – Calculate Your Grade Point Average | WriteScholar', description: 'Free GPA calculator for college and high school students. Calculate semester or cumulative GPA instantly. Add courses, credits, and grades. No signup required.' },
    'pomodoro-timer': { title: 'Free Pomodoro Timer – Study Timer & Focus Tool | WriteScholar', description: 'Free Pomodoro timer for focused studying. Boost productivity with timed work sessions and breaks. Customizable focus and break intervals. No signup required.' },
    'crater-blast': { title: 'Crater Blast – AI Quiz Shooter Game | WriteScholar', description: 'Blast the correct falling crater before it lands! AI generates quiz questions as craters. Aim your cannon, build streaks, and beat your high score.' }
  };
  useEffect(() => {
    const meta = pageMeta[currentPage];
    if (meta) {
      document.title = meta.title;
      let desc = document.querySelector('meta[name="description"]');
      if (desc) desc.setAttribute('content', meta.description);
      else {
        desc = document.createElement('meta');
        desc.setAttribute('name', 'description');
        desc.setAttribute('content', meta.description);
        document.head.appendChild(desc);
      }
    }
  }, [currentPage]);

  // Validate and refresh token if needed
  const validateAndRefreshToken = async () => {
    try {
      logger.log('Validating token...');
      const token = localStorage.getItem('authToken');
      if (!token) {
        logger.log('No token found, skipping validation');
        return;
      }

      // Use bulletproof API for token validation
      const { BulletproofAPI } = await import('../config/api');
      const response = await BulletproofAPI.get('/auth/me', token);

      logger.log('Token validation response status:', response.status);
      if (response.status === 401) {
        // Token expired, try to refresh
        logger.log('Token expired, attempting refresh...');
        const refreshResponse = await BulletproofAPI.post('/auth/refresh', {}, token);

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          localStorage.setItem('authToken', refreshData.data.token);
          logger.log('Token refreshed successfully');
          
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
              logger.log('User data updated after token refresh:', updatedUser);
            } else {
              logger.log('Invalid user data after token refresh, keeping existing user data');
            }
          }
        } else {
          // Refresh failed - but DON'T clear auth state immediately
          // Keep user logged in with cached data for better UX
          logger.log('Token refresh failed, but keeping user logged in with cached data');
          
          // Only clear if we're on a protected route and have no cached user data
          const cachedUser = localStorage.getItem('user');
          if (!cachedUser && protectedRoutes.includes(currentPage)) {
            logger.log('No cached user data and on protected route, clearing auth state');
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
          logger.log('User data updated from /auth/me:', updatedUser);
        } else {
          logger.log('Invalid user data from /auth/me, keeping existing user data');
        }
        logger.log('Token is valid, user data updated');
      } else {
        // Other error status - keep user logged in with cached data
        logger.log('Server error during validation, keeping user logged in with cached data');
      }
    } catch (error) {
      logger.error('Token validation error:', error);
      // On network error, always keep the user logged in locally
      // They can still browse with cached data
      logger.log('Network error during validation, keeping user logged in with cached data');
    }
  };

  // Handle URL-based routing and authentication persistence
  useEffect(() => {
    const path = window.location.pathname;
    
    // Validate token in background if user is logged in
    // User state is already initialized from localStorage, so no need to set it again
    if (isLoggedIn && user) {
      logger.log('User already logged in from initial state:', user);
      // Validate token in background, but don't let failures clear the user immediately
      setTimeout(() => {
        validateAndRefreshToken();
      }, 100); // Small delay to ensure UI renders first
    } else {
      logger.log('No user logged in on initial load');
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
      if (pathname === '/why-students-choose' || pathname === '/compare') return 'why-students-choose';
      if (pathname === '/vs-quizlet-knowt' || pathname === '/study-tools-comparison' || pathname === '/compare-study-tools') return 'study-tools-comparison';
      if (pathname === '/contact') return 'contact';
      if (pathname === '/analysis') return 'analysis';
      if (pathname === '/analysis-history') return 'analysis-history';
      if (pathname === '/citation-results') return 'citation-results';
      if (pathname === '/citation-history') return 'citation-history';
      if (pathname === '/quiz-history') return 'quiz-history';
      if (pathname === '/upload') return 'upload';
      if (pathname === '/settings') return 'settings';
      if (pathname === '/profile') return 'profile';
      if (pathname === '/library') return 'library';
      if (pathname === '/account') return 'account';
      if (pathname === '/billing') return 'billing';
      if (pathname === '/help' || pathname === '/help-center') return 'help';
      if (pathname === '/privacy' || pathname === '/privacy-policy') return 'privacy';
      if (pathname === '/terms' || pathname === '/terms-of-service') return 'terms';
      if (pathname === '/unsubscribe') return 'unsubscribe';
      if (pathname === '/blog' || pathname === '/blog/') return 'blog';
      if (pathname.startsWith('/blog/')) {
        const slug = pathname.replace(/^\/blog\/?/, '').split('/')[0]?.trim() ?? '';
        if (slug) return 'blog-post';
        return 'blog';
      }
      // Free Tools routes
      if (pathname === '/tools/word-counter' || pathname === '/word-counter') return 'word-counter';
      if (pathname === '/tools/citation-generator' || pathname === '/citation-generator-tool') return 'citation-generator-tool';
      if (pathname === '/tools/readability-score' || pathname === '/readability-score') return 'readability-score';
      if (pathname === '/tools/paraphrasing-tips' || pathname === '/paraphrasing-tips') return 'paraphrasing-tips';
      if (pathname === '/tools/essay-outline' || pathname === '/essay-outline') return 'essay-outline';
      if (pathname === '/tools/text-case-converter' || pathname === '/text-case-converter') return 'text-case-converter';
      if (pathname === '/tools/thesis-generator' || pathname === '/thesis-generator') return 'thesis-generator';
      if (pathname === '/tools/grammar-checker' || pathname === '/grammar-checker') return 'grammar-checker';
      if (pathname === '/tools/humanizer' || pathname === '/humanizer') return 'humanizer';
      if (pathname === '/tools/summarizer' || pathname === '/summarizer') return 'summarizer';
      if (pathname === '/tools/quiz-generator' || pathname === '/quiz-generator') return 'quiz-generator';
      if (pathname === '/tools/flashcard-generator' || pathname === '/flashcard-generator') return 'flashcard-generator';
      if (pathname === '/tools/crossword-generator' || pathname === '/crossword-generator') return 'crossword-generator';
      if (pathname === '/tools/gpa-calculator' || pathname === '/gpa-calculator') return 'gpa-calculator';
      if (pathname === '/tools/pomodoro-timer' || pathname === '/pomodoro-timer') return 'pomodoro-timer';
      if (pathname === '/tools/crater-blast' || pathname === '/crater-blast' || pathname === '/tools/lightning-reflex-quiz' || pathname === '/lightning-reflex-quiz') return 'crater-blast';
      // Dashboard modes
      if (pathname === '/tools/analyze' || pathname === '/analyze') return 'analyze';
      if (pathname === '/tools/citations' || pathname === '/citations') return 'citations';
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
      logger.log('Browser navigation detected, changing page to:', newPage);
      setCurrentPage(newPage);
      
      // Restore user data from localStorage when navigating back/forward
      const storedToken = localStorage.getItem('authToken');
      const storedUserData = localStorage.getItem('user');
      if (storedToken && storedUserData) {
        try {
          const userData = JSON.parse(storedUserData);
          setIsLoggedIn(true);
          setUser(userData);
          logger.log('User data restored on navigation:', userData);
        } catch (error) {
          logger.error('Error restoring user data:', error);
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
      logger.log('User logged in, redirecting from landing to dashboard');
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
          logger.log('Syncing user data from storage change:', parsedUser);
          setIsLoggedIn(true);
          setUser(parsedUser);
        } catch (error) {
          logger.error('Error syncing user data:', error);
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
            logger.log('Token refreshed automatically');
            
            // Retry the original request with new token
            const retryResponse = await originalFetch(...args);
            return retryResponse;
          } else {
            // Refresh failed - but DON'T clear auth state automatically
            // Let the user continue with cached data
            logger.log('Auto-refresh failed, but keeping user logged in with cached data');
            
            // Only clear auth if we're on a protected route and have no cached user
            const cachedUser = localStorage.getItem('user');
            if (!cachedUser && protectedRoutes.includes(currentPage)) {
              logger.log('No cached user data on protected route, clearing auth state');
              setIsLoggedIn(false);
              setUser(null);
              localStorage.removeItem('authToken');
              localStorage.removeItem('user');
              setCurrentPage('login');
            }
          }
        } catch (error) {
          logger.error('Auto-refresh failed:', error);
          // Don't logout on network errors - keep user logged in with cached data
          logger.log('Network error during auto-refresh, keeping user logged in');
        }
      }
      
      return response;
    };

    // Cleanup
    return () => {
      window.fetch = originalFetch;
    };
  }, [isLoggedIn, currentPage]);

  // Navigation function (slug optional for blog posts)
  // Canonical URL map – pages whose URL differs from /${page}
  const pageUrlMap: Record<string, string> = {
    landing: '/',
    humanizer: '/tools/humanizer',
    summarizer: '/tools/summarizer',
    'quiz-generator': '/tools/quiz-generator',
    'flashcard-generator': '/tools/flashcard-generator',
    'crossword-generator': '/tools/crossword-generator',
    'word-counter': '/tools/word-counter',
    'citation-generator-tool': '/tools/citation-generator',
    'readability-score': '/tools/readability-score',
    'paraphrasing-tips': '/tools/paraphrasing-tips',
    'essay-outline': '/tools/essay-outline',
    'text-case-converter': '/tools/text-case-converter',
    'thesis-generator': '/tools/thesis-generator',
    'grammar-checker': '/tools/grammar-checker',
    'gpa-calculator': '/tools/gpa-calculator',
    'pomodoro-timer': '/tools/pomodoro-timer',
    'crater-blast': '/tools/crater-blast',
    'analyze': '/tools/analyze',
    'citations': '/tools/citations',
    'why-students-choose': '/why-students-choose',
    'study-tools-comparison': '/vs-quizlet-knowt',
  };

  const navigateTo = (page: string, slug?: string) => {
    setCurrentPage(page);
    // Update URL to canonical form
    if (page === 'blog-post' && slug) {
      window.history.pushState({}, '', `/blog/${slug}`);
    } else if (pageUrlMap[page]) {
      window.history.pushState({}, '', pageUrlMap[page]);
    } else {
      window.history.pushState({}, '', `/${page}`);
    }
    
    // Scroll to top on navigation
    window.scrollTo(0, 0);
    
    // Ensure user data is restored on navigation
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');
    if (token && userData && !user) {
      try {
        const parsedUser = JSON.parse(userData);
        logger.log('Restoring user data on navigation:', parsedUser);
        setIsLoggedIn(true);
        setUser(parsedUser);
      } catch (error) {
        logger.error('Error restoring user on navigation:', error);
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
      case 'why-students-choose':
        return <WhyStudentsChoosePage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'study-tools-comparison':
        return <StudyToolsComparisonPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'contact':
        return <ContactPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'privacy':
        return <PrivacyPolicyPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'terms':
        return <TermsOfServicePage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'help':
        return <FAQPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'blog':
        return <BlogPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'blog-post':
        return <BlogPostPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'unsubscribe':
        return <UnsubscribePage onNavigate={navigateTo} />;
      case 'dashboard':
        return <DashboardPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'analyze':
        return isLoggedIn ? <DashboardPage onNavigate={navigateTo} user={user} onLogout={handleLogout} initialMode="analyze" /> : <LandingPage onNavigate={navigateTo} />;
      case 'citations':
        return isLoggedIn ? <DashboardPage onNavigate={navigateTo} user={user} onLogout={handleLogout} initialMode="citations" /> : <LandingPage onNavigate={navigateTo} />;
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
      case 'quiz-history':
        return <QuizHistoryPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
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
      // Free Tools
      case 'word-counter':
        return <WordCounterPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'citation-generator-tool':
        return <CitationGeneratorToolPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'readability-score':
        return <ReadabilityScorePage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'paraphrasing-tips':
        return <ParaphrasingTipsPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'essay-outline':
        return <EssayOutlineGeneratorPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'text-case-converter':
        return <TextCaseConverterPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'thesis-generator':
        return <ThesisGeneratorPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'grammar-checker':
        return <GrammarCheckerPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'humanizer':
        return <HumanizerPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'summarizer':
        return <SummarizerPage onNavigate={navigateTo} user={user} />;
      case 'quiz-generator':
        return <QuizGeneratorPage onNavigate={navigateTo} user={user} initialStudyToolMode="quiz" />;
      case 'flashcard-generator':
        return <QuizGeneratorPage onNavigate={navigateTo} user={user} initialStudyToolMode="flashcards" />;
      case 'crossword-generator':
        return <QuizGeneratorPage onNavigate={navigateTo} user={user} initialStudyToolMode="crossword" />;
      case 'gpa-calculator':
        return <GPACalculatorPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'pomodoro-timer':
        return <PomodoroTimerPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'crater-blast':
        return <LightningReflexQuizPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
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
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #FAF8F5 0%, #F5F3F0 100%)' }}>
      <PromoBanner />
      {renderCurrentPage()}
    </div>
    </ErrorBoundary>
  );
};


// Admin Dashboard Component
const AdminDashboard = ({ onNavigate, user: _user }: UserProps) => (
  <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #FAF8F5 0%, #F5F3F0 100%)' }}>
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
  <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #FAF8F5 0%, #F5F3F0 100%)' }}>
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