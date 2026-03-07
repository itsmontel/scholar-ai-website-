import { useState, useEffect, useRef } from 'react';
import Header from '../common/Header';
import Footer from '../common/Footer';
import AnalysisAnimation from '../common/AnalysisAnimation';
import StreakWidget from '../common/StreakWidget';
import BadgeWidget from '../common/BadgeWidget';
import FlashcardViewer from '../common/FlashcardViewer';
import WelcomeTutorial from '../common/WelcomeTutorial';
import QuickReviewModal from '../common/QuickReviewModal';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import { trackAction, syncFromAPIData, trackExport, trackCopy } from '../../data/achievements';
import { getResetsInText, isEndOfMonthUrgency, getEndOfMonthUrgencyText, getDaysUntilReset } from '../../utils/usageReset';

interface DashboardProps {
  onNavigate: (page: string) => void;
  user: any;
  onLogout: () => void;
  onUserUpdate?: (updates: { welcomeTutorialCompleted?: boolean }) => void;
  initialMode?: 'analyze' | 'citations' | 'humanize' | 'summarize' | 'quiz';
}

const getTimeGreeting = (): { greeting: string; emoji: string } => {
  const hour = new Date().getHours();
  const rand = Math.random();
  if (rand < 0.15) return { greeting: 'Welcome back', emoji: '👋' };
  if (hour < 12) return { greeting: 'Good morning', emoji: '☀️' };
  if (hour < 17) return { greeting: 'Good afternoon', emoji: '👋' };
  return { greeting: 'Good evening', emoji: '🌙' };
};

const relativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

interface ActivityItem {
  id: string;
  type: 'document' | 'analysis' | 'quiz' | 'flashcard' | 'crossword' | 'humanize' | 'summary' | 'citation';
  title: string;
  subtitle: string;
  date: Date;
  navigateTo: string;
  /** For quiz/flashcard/crossword: tool data to open directly */
  toolData?: any;
}

const activityMeta: Record<ActivityItem['type'], { emoji: string; bg: string; label: string; cardBg: string; border: string; accent: string; shape: 'circle' | 'square' | 'diamond' }> = {
  document: { emoji: '📄', bg: 'bg-blue-100 dark:bg-blue-900/30', label: 'Uploaded', cardBg: 'from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20', border: 'border-blue-200/70 dark:border-blue-700/40', accent: 'text-blue-700 dark:text-blue-300', shape: 'circle' },
  analysis: { emoji: '🔍', bg: 'bg-rose-100 dark:bg-rose-900/30', label: 'Analyzed', cardBg: 'from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20', border: 'border-rose-200/70 dark:border-rose-700/40', accent: 'text-rose-700 dark:text-rose-300', shape: 'square' },
  quiz: { emoji: '🎯', bg: 'bg-amber-100 dark:bg-amber-900/30', label: 'Quiz', cardBg: 'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20', border: 'border-amber-200/70 dark:border-amber-700/40', accent: 'text-amber-700 dark:text-amber-300', shape: 'circle' },
  flashcard: { emoji: '🃏', bg: 'bg-violet-100 dark:bg-violet-900/30', label: 'Flashcards', cardBg: 'from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20', border: 'border-violet-200/70 dark:border-violet-700/40', accent: 'text-violet-700 dark:text-violet-300', shape: 'diamond' },
  crossword: { emoji: '🧩', bg: 'bg-orange-100 dark:bg-orange-900/30', label: 'Crossword', cardBg: 'from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20', border: 'border-orange-200/70 dark:border-orange-700/40', accent: 'text-orange-700 dark:text-orange-300', shape: 'square' },
  humanize: { emoji: '✨', bg: 'bg-purple-100 dark:bg-purple-900/30', label: 'Humanized', cardBg: 'from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20', border: 'border-violet-200/70 dark:border-violet-700/40', accent: 'text-violet-700 dark:text-violet-300', shape: 'circle' },
  summary: { emoji: '📋', bg: 'bg-teal-100 dark:bg-teal-900/30', label: 'Summary', cardBg: 'from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20', border: 'border-teal-200/70 dark:border-teal-700/40', accent: 'text-teal-700 dark:text-teal-300', shape: 'square' },
  citation: { emoji: '📚', bg: 'bg-sky-100 dark:bg-sky-900/30', label: 'Citations', cardBg: 'from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20', border: 'border-sky-200/70 dark:border-sky-700/40', accent: 'text-sky-700 dark:text-sky-300', shape: 'diamond' },
};

const Dashboard = ({ onNavigate, user, onLogout, onUserUpdate, initialMode = 'analyze' }: DashboardProps) => {
  const [inputText, setInputText] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [showWordWarning, setShowWordWarning] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [greeting] = useState(getTimeGreeting);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [isActivityLoading, setIsActivityLoading] = useState(true);
  const [showAnalysisPopup, setShowAnalysisPopup] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [mode, setMode] = useState<'analyze' | 'citations' | 'humanize' | 'summarize' | 'quiz'>(initialMode);

  // Sync tab when navigating to dashboard via footer (e.g. "Analyze Essay" or "Citations")
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const [citationStyle, setCitationStyle] = useState('APA');
  const [citationYearRange, setCitationYearRange] = useState('all');
  const [isSearchingCitations, setIsSearchingCitations] = useState(false);
  const [showSearchAnimation, setShowSearchAnimation] = useState(false);
  const [humanizeMode, setHumanizeMode] = useState<'standard' | 'academic' | 'casual' | 'creative'>('standard');
  const [humanizeIntensity, setHumanizeIntensity] = useState<'light' | 'medium' | 'aggressive'>('medium');
  const [isHumanizing, setIsHumanizing] = useState(false);
  const [humanizedResult, setHumanizedResult] = useState('');
  const [showHumanizeResult, setShowHumanizeResult] = useState(false);
  const [humanizeCopied, setHumanizeCopied] = useState(false);
  const [showHighlights, setShowHighlights] = useState(false);
  
  // Summarizer state
  const [summaryStyle, setSummaryStyle] = useState<'bullet' | 'paragraph' | 'tldr' | 'detailed'>('bullet');
  const [summaryLength, setSummaryLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryResult, setSummaryResult] = useState<{ summary: string; originalWordCount: number; summaryWordCount: number } | null>(null);
  const [summaryError, setSummaryError] = useState('');
  const [summaryCopied, setSummaryCopied] = useState(false);
  
  // Quiz generator state
  const [studyToolMode, setStudyToolMode] = useState<'quiz' | 'flashcards' | 'crossword' | 'crater_blast'>('quiz');
  const [quizType, setQuizType] = useState<'mixed' | 'multiple_choice' | 'true_false' | 'fill_blank'>('mixed');
  const [quizDifficulty, setQuizDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [quizQuestionCount, setQuizQuestionCount] = useState(10);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState<any>(null);
  const [quizError, setQuizError] = useState('');
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{questionId: number; answer: string; isCorrect: boolean}[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [showQuizResult, setShowQuizResult] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  
  // Flashcard state
  const [flashcardResult, setFlashcardResult] = useState<any>(null);
  const [flashcardCount, setFlashcardCount] = useState(15);
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
  
  // Crossword state
  const [crosswordResult, setCrosswordResult] = useState<any>(null);
  const [crosswordWordCount, setCrosswordWordCount] = useState(10);
  const [isGeneratingCrossword, setIsGeneratingCrossword] = useState(false);
  const [crosswordAnswers, setCrosswordAnswers] = useState<Record<string, string>>({});
  const [crosswordChecked, setCrosswordChecked] = useState(false);
  const [selectedClue, setSelectedClue] = useState<number | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [selectedDirection, setSelectedDirection] = useState<'across' | 'down'>('across');
  const [hintsUsed, setHintsUsed] = useState(0);
  
  // Upgrade modal state (for locked features like export)
  const [showExportUpgradeModal, setShowExportUpgradeModal] = useState(false);

  // Friends notification count (pending requests + incoming shares)
  const [friendNotificationCount, setFriendNotificationCount] = useState(0);

  // Fetch friend notifications count
  useEffect(() => {
    const fetchFriendNotifications = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      
      try {
        const [requestsRes, sharesRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/friends/requests/pending`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
          }),
          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/friends/share-requests/incoming`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
          })
        ]);
        
        let count = 0;
        if (requestsRes.ok) {
          const requestsData = await requestsRes.json();
          count += (requestsData.data || []).length;
        }
        if (sharesRes.ok) {
          const sharesData = await sharesRes.json();
          count += (sharesData.data || []).length;
        }
        setFriendNotificationCount(count);
      } catch (err) {
        console.error('Error fetching friend notifications:', err);
      }
    };
    
    fetchFriendNotifications();
    // Refresh every 60 seconds
    const interval = setInterval(fetchFriendNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  // Badge notifications now shown globally via BadgeNotificationToast (event from achievements.ts)

  // Ebook banner: show for 24 hours after first dashboard visit, or until user dismisses
  const EBOOK_BANNER_KEY = 'writescholar_ebook_banner_first_seen';
  const EBOOK_BANNER_DISMISSED_KEY = 'writescholar_ebook_banner_dismissed';
  const EBOOK_BANNER_MS = 24 * 60 * 60 * 1000;
  const [showEbookBanner, setShowEbookBanner] = useState(true);
  const [ebookBannerDismissed, setEbookBannerDismissed] = useState(() => localStorage.getItem(EBOOK_BANNER_DISMISSED_KEY) === '1');
  useEffect(() => {
    const raw = localStorage.getItem(EBOOK_BANNER_KEY);
    const firstSeen = raw ? parseInt(raw, 10) : null;
    const now = Date.now();
    if (firstSeen == null) {
      localStorage.setItem(EBOOK_BANNER_KEY, String(now));
      setShowEbookBanner(true);
    } else {
      setShowEbookBanner(now - firstSeen < EBOOK_BANNER_MS);
    }
  }, []);
  const dismissEbookBanner = () => {
    localStorage.setItem(EBOOK_BANNER_DISMISSED_KEY, '1');
    setEbookBannerDismissed(true);
  };
  
  const [quizUsage, setQuizUsage] = useState({
    generationsUsed: 0,
    generationLimit: 3,
    generationsRemaining: 3,
    maxWordsPerGeneration: 5000,
    wordsUsed: 0,
    wordLimit: 15000,
    plan: 'free'
  });

  // Welcome tutorial state - show after onboarding completion
  // Check both server (user.welcomeTutorialCompleted) and localStorage for cross-device/incognito
  const [showWelcomeTutorial, setShowWelcomeTutorial] = useState(() => {
    if (!user?.id) return false;
    const tutorialCompletedLocal = localStorage.getItem(`writescholar_welcome_tutorial_completed_${user.id}`);
    const tutorialCompleted = (user as any).welcomeTutorialCompleted || tutorialCompletedLocal === 'true';
    if (tutorialCompleted) return false;
    const onboardingCompletedLocal = localStorage.getItem(`writescholar_onboarding_completed_${user.id}`);
    const onboardingCompleted = (user as any).onboardingCompleted || onboardingCompletedLocal === 'true';
    return onboardingCompleted;
  });

  // Hide tutorial when user loads with welcomeTutorialCompleted from server (e.g. incognito)
  useEffect(() => {
    if (user?.id && (user as any).welcomeTutorialCompleted) {
      setShowWelcomeTutorial(false);
    }
  }, [user?.id, (user as any)?.welcomeTutorialCompleted]);

  // Quick Review state - show to returning users who haven't reviewed today
  const [showQuickReview, setShowQuickReview] = useState(() => {
    if (!user?.id) return false;
    // Don't show if welcome tutorial is showing
    const tutorialCompletedLocal = localStorage.getItem(`writescholar_welcome_tutorial_completed_${user.id}`);
    const tutorialCompleted = (user as any).welcomeTutorialCompleted || tutorialCompletedLocal === 'true';
    const onboardingCompletedLocal = localStorage.getItem(`writescholar_onboarding_completed_${user.id}`);
    const onboardingCompleted = (user as any).onboardingCompleted || onboardingCompletedLocal === 'true';
    if (onboardingCompleted && !tutorialCompleted) return false;
    
    // Check if already shown today
    const lastShown = localStorage.getItem(`writescholar_quick_review_last_shown_${user.id}`);
    const today = new Date().toDateString();
    if (lastShown === today) return false;
    
    // Only show for returning users (not first day)
    const firstLoginDate = localStorage.getItem(`writescholar_first_login_${user.id}`);
    if (!firstLoginDate) {
      localStorage.setItem(`writescholar_first_login_${user.id}`, today);
      return false;
    }
    
    return firstLoginDate !== today;
  });

  // Calendar / Study Events state
  interface StudyEvent {
    id: string;
    title: string;
    event_date: string;
    event_time?: string;
    event_type: 'exam' | 'test' | 'midterm' | 'assignment' | 'quiz' | 'other';
    course?: string;
    notes?: string;
  }
  const [studyEvents, setStudyEvents] = useState<StudyEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', event_date: '', event_time: '', event_type: 'other', course: '', notes: '' });
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  // Fetch study events
  useEffect(() => {
    const fetchStudyEvents = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/study-events`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) setStudyEvents(data.data || []);
      } catch (err) {
        console.error('Failed to fetch study events:', err);
      } finally {
        setLoadingEvents(false);
      }
    };
    fetchStudyEvents();
  }, []);

  const [addEventError, setAddEventError] = useState('');
  const [addingEvent, setAddingEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState<StudyEvent | null>(null);

  const openAddModal = () => {
    setEditingEvent(null);
    setNewEvent({ title: '', event_date: '', event_time: '', event_type: 'other', course: '', notes: '' });
    setAddEventError('');
    setShowAddEventModal(true);
  };

  const openEditModal = (event: StudyEvent) => {
    setEditingEvent(event);
    setNewEvent({
      title: event.title,
      event_date: toDateStr(event.event_date) || event.event_date,
      event_time: event.event_time || '',
      event_type: event.event_type || 'other',
      course: event.course || '',
      notes: event.notes || ''
    });
    setAddEventError('');
    setShowAddEventModal(true);
  };

  const addStudyEvent = async () => {
    if (!newEvent.title || !newEvent.event_date) return;
    setAddingEvent(true);
    setAddEventError('');
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/study-events`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent)
      });
      const data = await res.json();
      if (data.success) {
        setStudyEvents(prev => [...prev, data.data].sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()));
        setNewEvent({ title: '', event_date: '', event_time: '', event_type: 'other', course: '', notes: '' });
        setEditingEvent(null);
        setShowAddEventModal(false);
      } else {
        setAddEventError(data.message || 'Failed to add event');
      }
    } catch (err) {
      console.error('Failed to add study event:', err);
      setAddEventError('Network error. Please try again.');
    } finally {
      setAddingEvent(false);
    }
  };

  const updateStudyEvent = async () => {
    if (!editingEvent || !newEvent.title || !newEvent.event_date) return;
    setAddingEvent(true);
    setAddEventError('');
    try {
      const token = localStorage.getItem('authToken');
      const payload = {
        title: newEvent.title,
        event_date: newEvent.event_date,
        event_time: newEvent.event_time || null,
        event_type: newEvent.event_type || 'other',
        course: newEvent.course || null,
        notes: newEvent.notes || null
      };
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/study-events/${editingEvent.id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setStudyEvents(prev => prev.map(e => e.id === editingEvent.id ? data.data : e).sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()));
        setNewEvent({ title: '', event_date: '', event_time: '', event_type: 'other', course: '', notes: '' });
        setEditingEvent(null);
        setShowAddEventModal(false);
      } else {
        setAddEventError(data.message || 'Failed to update event');
      }
    } catch (err) {
      console.error('Failed to update study event:', err);
      setAddEventError('Network error. Please try again.');
    } finally {
      setAddingEvent(false);
    }
  };

  const deleteStudyEvent = async (id: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/study-events/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setStudyEvents(prev => prev.filter(e => e.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete study event:', err);
    }
  };

  // Calendar helper functions
  const getCalendarDays = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    const days: { day: number; isCurrentMonth: boolean; date: string }[] = [];
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      days.push({ day: d, isCurrentMonth: false, date: `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}` });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, isCurrentMonth: true, date: `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}` });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, isCurrentMonth: false, date: `${year}-${String(month + 2).padStart(2, '0')}-${String(i).padStart(2, '0')}` });
    }
    return days;
  };

  const toDateStr = (d: string) => (d || '').split('T')[0];
  const getEventsForDate = (dateStr: string) => studyEvents.filter(e => toDateStr(e.event_date) === dateStr);
  const getUpcomingEvents = () => {
    const today = new Date().toISOString().split('T')[0];
    return studyEvents.filter(e => toDateStr(e.event_date) >= today).slice(0, 5);
  };
  const isToday = (dateStr: string) => new Date().toISOString().split('T')[0] === dateStr;
  const eventTypeColors: Record<string, { bg: string; border: string; text: string; dot: string }> = {
    exam: { bg: 'bg-red-50', border: 'border-red-100', text: 'text-red-600', dot: 'bg-red-400' },
    midterm: { bg: 'bg-red-50', border: 'border-red-100', text: 'text-red-600', dot: 'bg-red-400' },
    test: { bg: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-600', dot: 'bg-orange-400' },
    quiz: { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-600', dot: 'bg-amber-500' },
    assignment: { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-600', dot: 'bg-blue-400' },
    other: { bg: 'bg-stone-50', border: 'border-stone-200', text: 'text-stone-600', dot: 'bg-stone-400' }
  };

  const [usageStats, setUsageStats] = useState({
    documentsUploaded: 0,
    documentsAnalyzed: 0,
    storageUsed: 0,
    storageLimit: 0,
    uploadsRemaining: 0,
    analysesRemaining: 0,
    plan: 'free',
    planLimits: {
      documentsPerMonth: 3,
      analysesPerMonth: 3,
      maxDocumentSize: 1024 * 1024,
      name: 'Free'
    }
  });
  const [loadingStats, setLoadingStats] = useState(true);

  const analyzePlaceholders = [
    "Paste your essay or research paper here...",
    "Get instant AI feedback on your writing...",
    "Improve your academic writing in seconds..."
  ];

  const citationPlaceholders = [
    "Enter your research topic to find citations...",
    "What are you researching? Find sources instantly...",
    "Type your essay question and discover literature..."
  ];

  const humanizePlaceholders = [
    "Paste your AI-generated text here to humanize it...",
    "Transform AI text into natural human writing...",
    "Make your text undetectable by AI checkers..."
  ];

  const summarizePlaceholders = [
    "Paste your article, paper, or document to summarize...",
    "Transform lengthy content into key points...",
    "Get concise summaries in seconds..."
  ];

  const quizPlaceholders = [
    "Paste content to generate quiz questions...",
    "Turn any text into an interactive quiz...",
    "Test your knowledge with AI-generated questions..."
  ];

  const placeholders = mode === 'humanize' ? humanizePlaceholders 
    : mode === 'summarize' ? summarizePlaceholders 
    : mode === 'quiz' ? quizPlaceholders 
    : mode === 'analyze' ? analyzePlaceholders 
    : citationPlaceholders;

  const suggestedTopics = mode === 'analyze' ? [
    "Analyze my essay structure",
    "Check my thesis statement",
    "Review my argument flow",
    "Improve my conclusion"
  ] : [
    "Effects of social media on teenagers",
    "Climate change mitigation strategies",
    "AI in healthcare applications",
    "Remote work productivity research"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [placeholders.length]);

  useEffect(() => {
    fetchDocuments();
    fetchUsageStats();
    // Sync streak data for achievements
    (async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/streaks`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.data) {
            syncFromAPIData({
              currentStreak: data.data.currentStreak,
              longestStreak: data.data.longestStreak,
            });
          }
        }
      } catch { /* ignore */ }
    })();
    // Check time-based achievements on dashboard load
    const hour = new Date().getHours();
    if (hour >= 22 || hour < 4) trackAction('used_after_10pm', true);
    if (hour >= 4 && hour < 7) trackAction('used_before_7am', true);
  }, []);

  // Fetch quiz usage when switching to quiz mode
  useEffect(() => {
    if (mode === 'quiz') {
      fetchQuizUsage();
    }
  }, [mode]);

  const fetchQuizUsage = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/quiz-usage`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setQuizUsage({
            generationsUsed: data.data.generationsUsed || 0,
            generationLimit: data.data.generationLimit ?? 3,
            generationsRemaining: data.data.generationsRemaining ?? 3,
            maxWordsPerGeneration: data.data.maxWordsPerGeneration || 5000,
            wordsUsed: data.data.wordsUsed || 0,
            wordLimit: data.data.wordLimit || 15000,
            plan: data.data.plan || 'free'
          });
        }
      }
    } catch (error) {
      console.error('Error fetching quiz usage:', error);
    }
  };

  const fetchUsageStats = async () => {
    try {
      setLoadingStats(true);
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/subscriptions/usage`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsageStats(data);
        syncFromAPIData({
          documentsUploaded: data.documentsUploaded,
          documentsAnalyzed: data.documentsAnalyzed,
          plan: data.plan,
        });
      }
    } catch (error) {
      console.error('Error fetching usage stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const processDocuments = async (documents: any[]) => {
    const docsWithAnalysis = await Promise.all(
      documents.map(async (doc: any) => {
        const analysisResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/document/${doc.id}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
        });
        
        let hasAnalysis = false;
        if (analysisResponse.ok) {
          const analysisResult = await analysisResponse.json();
          hasAnalysis = analysisResult.data && analysisResult.data.length > 0;
        }
        
        return { ...doc, hasAnalysis };
      })
    );
    setDocuments(docsWithAnalysis);
  };

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) {
        setIsLoading(false);
        return;
      }

      const { BulletproofAPI } = await import('../../config/api');
      const result = await BulletproofAPI.safeRequest(
        () => BulletproofAPI.get('/documents', token),
        { documents: [] }
      );

      if (result.success) {
        await processDocuments(result.data.documents || []);
      } else if (result.error?.includes('401')) {
          try {
            const refreshResult = await BulletproofAPI.safeRequest(
              () => BulletproofAPI.post('/auth/refresh', {}, token),
              { token: null }
            );
            
            if (refreshResult.success && refreshResult.data?.token) {
            localStorage.setItem('authToken', refreshResult.data.token);
              const retryToken = refreshResult.data.token ?? undefined;
              const retryResult = await BulletproofAPI.safeRequest(
                () => BulletproofAPI.get('/documents', retryToken),
                { documents: [] }
              );
              if (retryResult.success) {
                await processDocuments(retryResult.data.documents || []);
              }
            } else {
            onLogout();
          }
        } catch {
          onLogout();
        }
      } else {
        await processDocuments([]);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      await processDocuments([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Build recent activity feed from documents + study tools + citations
  useEffect(() => {
    const buildActivity = async () => {
      try {
        setIsActivityLoading(true);
        const activities: ActivityItem[] = [];
        const token = localStorage.getItem('authToken');

        // Documents & analyses
        documents.forEach((doc: any) => {
          activities.push({
            id: `doc-${doc.id}`,
            type: 'document',
            title: doc.title,
            subtitle: `${(doc.fileType || 'doc').toUpperCase()} · ${doc.wordCount || 0} words`,
            date: new Date(doc.createdAt),
            navigateTo: 'library',
          });
          if (doc.hasAnalysis) {
            activities.push({
              id: `analysis-${doc.id}`,
              type: 'analysis',
              title: doc.title,
              subtitle: 'Essay feedback completed',
              date: new Date(new Date(doc.createdAt).getTime() + 60000),
              navigateTo: 'library',
            });
          }
        });

        if (token) {
          try {
            const quizRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/quiz-history`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (quizRes.ok) {
              const quizData = await quizRes.json();
              (quizData.data || []).forEach((tool: any) => {
                const typeMap: Record<string, ActivityItem['type']> = {
                  flashcards: 'flashcard',
                  crossword: 'crossword',
                };
                const activityType: ActivityItem['type'] = typeMap[tool.quiz_type] || 'quiz';
                const countLabel = tool.question_count ? `${tool.question_count} questions` : '';
                const diffLabel = tool.difficulty ? ` · ${tool.difficulty}` : '';
                const navMap: Record<string, string> = {
                  flashcards: 'flashcard-generator',
                  crossword: 'crossword-generator',
                  crater_blast: 'crater-blast',
                };
                const navigateTo = navMap[tool.quiz_type] || 'quiz-generator';
                activities.push({
                  id: `tool-${tool.id}`,
                  type: activityType,
                  title: tool.title || 'Study Tool',
                  subtitle: `${countLabel}${diffLabel}`.trim() || activityMeta[activityType].label,
                  date: new Date(tool.created_at),
                  navigateTo,
                  toolData: tool,
                });
              });
            }
          } catch { /* silently skip */ }

          try {
            const citeRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/citation-history`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (citeRes.ok) {
              const citeData = await citeRes.json();
              (citeData.data || []).forEach((search: any) => {
                const citationCount = search.search_results?.citations?.length;
                activities.push({
                  id: `cite-${search.id}`,
                  type: 'citation',
                  title: search.research_topic,
                  subtitle: `${search.citation_style}${citationCount ? ` · ${citationCount} sources` : ''}`,
                  date: new Date(search.created_at),
                  navigateTo: 'citation-history',
                });
              });
            }
          } catch { /* silently skip */ }
        }

        activities.sort((a, b) => b.date.getTime() - a.date.getTime());
        setRecentActivity(activities);
      } finally {
        setIsActivityLoading(false);
      }
    };

    buildActivity();
  }, [documents]);

  const filteredActivity = searchQuery.trim()
    ? recentActivity.filter(a =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activityMeta[a.type].label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : recentActivity;

  const handleActivityClick = (activity: ActivityItem) => {
    if (activity.toolData) {
      const t = activity.toolData;
      localStorage.setItem('writescholar_minimal_ui', 'true');
      if (t.quiz_type === 'flashcards') {
        localStorage.setItem('savedFlashcards', JSON.stringify(t));
        onNavigate('flashcard-generator');
      } else if (t.quiz_type === 'crossword') {
        localStorage.setItem('savedCrossword', JSON.stringify(t));
        onNavigate('crossword-generator');
      } else if (t.quiz_type === 'crater_blast') {
        localStorage.setItem('savedCraterBlast', JSON.stringify(t));
        onNavigate('crater-blast');
      } else {
        localStorage.setItem('savedQuiz', JSON.stringify(t));
        onNavigate('quiz-generator');
      }
    } else {
      onNavigate(activity.navigateTo);
    }
    setSearchQuery('');
  };

  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const isPremiumUser = usageStats.plan === 'premium';
  const isPaidUser = usageStats.plan === 'starter' || usageStats.plan === 'premium';
  const isFreeUser = usageStats.plan === 'free';
  // Free users can use quiz with limits (3 generations/month); paid users have unlimited
  const canUseQuiz = isPaidUser || (isFreeUser && (quizUsage.generationLimit === -1 || quizUsage.generationsRemaining > 0));
  const quizExhausted = isFreeUser && quizUsage.generationLimit !== -1 && quizUsage.generationsRemaining <= 0;
  
  const humanizeSummarizeMaxWords = isFreeUser ? 1000 : 5000;

  const isTextValid = () => {
    if (mode === 'citations') return inputText.trim().length > 0;
    if (mode === 'humanize') return inputText.trim().length > 0 && getWordCount(inputText) <= humanizeSummarizeMaxWords;
    if (mode === 'summarize') return getWordCount(inputText) >= 50 && getWordCount(inputText) <= humanizeSummarizeMaxWords;
    if (mode === 'quiz') {
      const wordCount = getWordCount(inputText);
      const maxWords = quizUsage.maxWordsPerGeneration || 15000;
      const minWords = studyToolMode === 'quiz' ? 100 : 50;
      return wordCount >= minWords && wordCount <= maxWords;
    }
    return getWordCount(inputText) >= 200;
  };

  const handleCitationSearch = async () => {
    if (inputText.trim().length === 0) {
      setShowWordWarning(true);
      setTimeout(() => setShowWordWarning(false), 3000);
      return;
    }

    try {
      setIsSearchingCitations(true);
      setShowSearchAnimation(true);
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        alert('Please log in to search for citations');
        onNavigate('login');
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      // Calculate year filter
      const currentYear = new Date().getFullYear();
      let minYear = null;
      if (citationYearRange !== 'all') {
        minYear = currentYear - parseInt(citationYearRange);
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/citation-search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          researchTopic: inputText,
          citationStyle: citationStyle,
          numberOfCitations: 10,
          minYear: minYear,
          yearRange: citationYearRange
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Citation search failed');
      }

      if (data.success && data.data) {
        localStorage.setItem('citationSearchResults', JSON.stringify(data.data));
        trackAction('citations_count');
        onNavigate('citation-results');
      } else {
        throw new Error('No citation results received');
      }

    } catch (error) {
      console.error('Citation search error:', error);
      alert(error instanceof Error ? error.message : 'Failed to search for citations. Please try again.');
    } finally {
      setIsSearchingCitations(false);
      setShowSearchAnimation(false);
    }
  };

  const handleAnalyze = () => {
    const wordCount = getWordCount(inputText);
    
    if (wordCount < 200) {
      setShowWordWarning(true);
      setTimeout(() => setShowWordWarning(false), 3000);
      return;
    }
    
    setShowAnalysisPopup(true);
    setAnalysisComplete(false);
    localStorage.setItem('textAnalysisContent', inputText);
    trackAction('analyses_count');
    
    setTimeout(() => setAnalysisComplete(true), 2000);
    setTimeout(() => {
      setShowAnalysisPopup(false);
      setAnalysisComplete(false);
      onNavigate('analysis');
    }, 4000);
  };

  const [humanizeWordsUsed, setHumanizeWordsUsed] = useState(0);
  const [humanizeWordLimit, setHumanizeWordLimit] = useState(1000);
  const [humanizeError, setHumanizeError] = useState('');
  const [isParsingDoc, setIsParsingDoc] = useState(false);
  const parseFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode === 'humanize') {
      const token = localStorage.getItem('authToken');
      if (token) {
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/humanize-usage`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
          .then(r => r.json())
          .then(data => {
            if (data.success) {
              setHumanizeWordsUsed(data.data.wordsUsed);
              setHumanizeWordLimit(data.data.wordLimit);
            }
          })
          .catch(() => {});
      }
    }
  }, [mode, showHumanizeResult]);

  const handleHumanize = async () => {
    if (inputText.trim().length === 0) return;

    setIsHumanizing(true);
    setHumanizedResult('');
    setShowHumanizeResult(false);
    setHumanizeError('');

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/humanize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: inputText,
          mode: humanizeMode,
          intensity: humanizeIntensity
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429 && data.upgrade) {
          setHumanizeError(data.message);
        } else if (response.status === 429) {
          setHumanizeError(data.message);
        } else {
          throw new Error(data.message || 'Humanization failed');
        }
        return;
      }

      setHumanizedResult(data.data.humanizedText);
      setShowHumanizeResult(true);
      trackAction('humanize_count');
      if (data.data.wordsUsed !== undefined) {
        setHumanizeWordsUsed(data.data.wordsUsed);
        setHumanizeWordLimit(data.data.wordLimit);
      }
    } catch (error: any) {
      console.error('Humanize error:', error);
      setHumanizeError(error.message || 'Humanization failed. Please try again.');
    } finally {
      setIsHumanizing(false);
    }
  };

  const handleSummarize = async () => {
    setIsSummarizing(true);
    setSummaryError('');
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: inputText, style: summaryStyle, length: summaryLength })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Summarization failed');
      setSummaryResult(data.data);
      trackAction('summaries_count');
    } catch (error: any) {
      setSummaryError(error.message || 'Summarization failed. Please try again.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (quizExhausted) {
      setQuizError('You\'ve used all 3 quiz generations this month. Upgrade for unlimited quizzes.');
      return;
    }
    setIsGeneratingQuiz(true);
    setQuizError('');
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/generate-quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: inputText, quizType, difficulty: quizDifficulty, questionCount: quizQuestionCount })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Quiz generation failed');
      setQuizResult(data.data);
      trackAction('quizzes_count');
      setIsQuizMode(true);
      setCurrentQuestion(0);
      setUserAnswers([]);
      setQuizCompleted(false);
      setSelectedAnswer('');
      setShowQuizResult(false);
      // Refresh quiz usage after successful generation
      fetchQuizUsage();
    } catch (error: any) {
      setQuizError(error.message || 'Quiz generation failed. Please try again.');
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleGenerateFlashcards = async () => {
    if (quizExhausted) {
      setQuizError('You\'ve used all 3 study tool generations this month. Upgrade for unlimited access.');
      return;
    }
    setIsGeneratingFlashcards(true);
    setQuizError('');
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/generate-flashcards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: inputText, cardCount: isFreeUser ? 15 : flashcardCount })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Flashcard generation failed');
      setFlashcardResult(data.data);
      trackAction('flashcards_count');
      fetchQuizUsage();
    } catch (error: any) {
      setQuizError(error.message || 'Flashcard generation failed. Please try again.');
    } finally {
      setIsGeneratingFlashcards(false);
    }
  };

  const handleGenerateCrossword = async () => {
    if (quizExhausted) {
      setQuizError('You\'ve used all 3 study tool generations this month. Upgrade for unlimited access.');
      return;
    }
    setIsGeneratingCrossword(true);
    setQuizError('');
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/generate-crossword`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: inputText, wordCount: isFreeUser ? 10 : crosswordWordCount })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Crossword generation failed');
      setCrosswordResult(data.data);
      trackAction('crosswords_count');
      setCrosswordAnswers({});
      setCrosswordChecked(false);
      setSelectedClue(null);
      setSelectedCell(null);
      setHintsUsed(0);
      fetchQuizUsage();
    } catch (error: any) {
      setQuizError(error.message || 'Crossword generation failed. Please try again.');
    } finally {
      setIsGeneratingCrossword(false);
    }
  };

  // Get the letter at a specific cell position based on user's answers
  const getCellLetter = (rowIdx: number, colIdx: number): string => {
    if (!crosswordResult?.placedWords) return '';
    
    for (const pw of crosswordResult.placedWords) {
      const answer = crosswordAnswers[`word-${pw.number}`] || '';
      let letterIndex = -1;
      
      if (pw.direction === 'across' && rowIdx === pw.row && colIdx >= pw.col && colIdx < pw.col + pw.length) {
        letterIndex = colIdx - pw.col;
      } else if (pw.direction === 'down' && colIdx === pw.col && rowIdx >= pw.row && rowIdx < pw.row + pw.length) {
        letterIndex = rowIdx - pw.row;
      }
      
      if (letterIndex >= 0 && letterIndex < answer.length) {
        return answer[letterIndex];
      }
    }
    return '';
  };

  // Get word(s) that pass through a specific cell
  const getWordsAtCell = (rowIdx: number, colIdx: number): any[] => {
    if (!crosswordResult?.placedWords) return [];
    return crosswordResult.placedWords.filter((pw: any) => {
      if (pw.direction === 'across') {
        return rowIdx === pw.row && colIdx >= pw.col && colIdx < pw.col + pw.length;
      }
      return colIdx === pw.col && rowIdx >= pw.row && rowIdx < pw.row + pw.length;
    });
  };

  // Handle cell click in crossword
  const handleCellClick = (rowIdx: number, colIdx: number) => {
    if (crosswordChecked) return;
    
    const wordsAtCell = getWordsAtCell(rowIdx, colIdx);
    if (wordsAtCell.length === 0) return;
    
    // If clicking the same cell, toggle direction
    if (selectedCell?.row === rowIdx && selectedCell?.col === colIdx) {
      const hasAcross = wordsAtCell.some((pw: any) => pw.direction === 'across');
      const hasDown = wordsAtCell.some((pw: any) => pw.direction === 'down');
      if (hasAcross && hasDown) {
        setSelectedDirection(selectedDirection === 'across' ? 'down' : 'across');
        const newWord = wordsAtCell.find((pw: any) => pw.direction === (selectedDirection === 'across' ? 'down' : 'across'));
        if (newWord) setSelectedClue(newWord.number);
      }
    } else {
      setSelectedCell({ row: rowIdx, col: colIdx });
      // Prefer the current direction if available, otherwise use whatever is available
      const preferredWord = wordsAtCell.find((pw: any) => pw.direction === selectedDirection);
      const word = preferredWord || wordsAtCell[0];
      if (word) {
        setSelectedDirection(word.direction);
        setSelectedClue(word.number);
      }
    }
  };

  // Handle keyboard input for crossword
  const handleCrosswordKeyDown = (e: React.KeyboardEvent) => {
    if (crosswordChecked || !selectedCell || !crosswordResult) return;
    
    const { row, col } = selectedCell;
    const wordsAtCell = getWordsAtCell(row, col);
    const currentWord = wordsAtCell.find((pw: any) => pw.direction === selectedDirection) || wordsAtCell[0];
    
    if (!currentWord) return;
    
    const answerKey = `word-${currentWord.number}`;
    const currentAnswer = crosswordAnswers[answerKey] || '';
    
    // Calculate position in the word
    const letterIndex = selectedDirection === 'across' 
      ? col - currentWord.col 
      : row - currentWord.row;
    
    if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
      e.preventDefault();
      // Build new answer with the letter at the correct position
      let newAnswer = currentAnswer.split('');
      while (newAnswer.length <= letterIndex) newAnswer.push('');
      newAnswer[letterIndex] = e.key.toUpperCase();
      setCrosswordAnswers({ ...crosswordAnswers, [answerKey]: newAnswer.join('') });
      
      // Move to next cell
      if (letterIndex < currentWord.length - 1) {
        if (selectedDirection === 'across') {
          setSelectedCell({ row, col: col + 1 });
        } else {
          setSelectedCell({ row: row + 1, col });
        }
      }
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      let newAnswer = currentAnswer.split('');
      if (letterIndex < newAnswer.length && newAnswer[letterIndex]) {
        // Delete current cell
        newAnswer[letterIndex] = '';
        setCrosswordAnswers({ ...crosswordAnswers, [answerKey]: newAnswer.join('').replace(/\s+$/, '') });
      } else if (letterIndex > 0) {
        // Move back and delete
        newAnswer[letterIndex - 1] = '';
        setCrosswordAnswers({ ...crosswordAnswers, [answerKey]: newAnswer.join('').replace(/\s+$/, '') });
        if (selectedDirection === 'across') {
          setSelectedCell({ row, col: col - 1 });
        } else {
          setSelectedCell({ row: row - 1, col });
        }
      }
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextCol = col + 1;
      if (crosswordResult.grid[row] && crosswordResult.grid[row][nextCol] !== '' && crosswordResult.grid[row][nextCol] !== undefined) {
        setSelectedCell({ row, col: nextCol });
        setSelectedDirection('across');
        const newWords = getWordsAtCell(row, nextCol);
        const newWord = newWords.find((pw: any) => pw.direction === 'across') || newWords[0];
        if (newWord) setSelectedClue(newWord.number);
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevCol = col - 1;
      if (prevCol >= 0 && crosswordResult.grid[row] && crosswordResult.grid[row][prevCol] !== '' && crosswordResult.grid[row][prevCol] !== undefined) {
        setSelectedCell({ row, col: prevCol });
        setSelectedDirection('across');
        const newWords = getWordsAtCell(row, prevCol);
        const newWord = newWords.find((pw: any) => pw.direction === 'across') || newWords[0];
        if (newWord) setSelectedClue(newWord.number);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextRow = row + 1;
      if (crosswordResult.grid[nextRow] && crosswordResult.grid[nextRow][col] !== '' && crosswordResult.grid[nextRow][col] !== undefined) {
        setSelectedCell({ row: nextRow, col });
        setSelectedDirection('down');
        const newWords = getWordsAtCell(nextRow, col);
        const newWord = newWords.find((pw: any) => pw.direction === 'down') || newWords[0];
        if (newWord) setSelectedClue(newWord.number);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevRow = row - 1;
      if (prevRow >= 0 && crosswordResult.grid[prevRow] && crosswordResult.grid[prevRow][col] !== '' && crosswordResult.grid[prevRow][col] !== undefined) {
        setSelectedCell({ row: prevRow, col });
        setSelectedDirection('down');
        const newWords = getWordsAtCell(prevRow, col);
        const newWord = newWords.find((pw: any) => pw.direction === 'down') || newWords[0];
        if (newWord) setSelectedClue(newWord.number);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Move to next word
      const currentWordIndex = crosswordResult.placedWords.findIndex((pw: any) => pw.number === selectedClue);
      const nextWordIndex = (currentWordIndex + 1) % crosswordResult.placedWords.length;
      const nextWord = crosswordResult.placedWords[nextWordIndex];
      if (nextWord) {
        setSelectedClue(nextWord.number);
        setSelectedDirection(nextWord.direction);
        setSelectedCell({ row: nextWord.row, col: nextWord.col });
      }
    }
  };

  // Reveal one unfilled letter from the selected word (or any word if none selected)
  const handleCrosswordHint = () => {
    if (!crosswordResult?.placedWords || crosswordChecked) return;

    // Prefer the currently selected word, otherwise pick first word with missing letters
    const candidateWords = selectedClue !== null
      ? crosswordResult.placedWords.filter((pw: any) => pw.number === selectedClue)
      : crosswordResult.placedWords;

    for (const pw of candidateWords) {
      const answerKey = `word-${pw.number}`;
      const currentAnswer = (crosswordAnswers[answerKey] || '').split('');

      // Find the first missing or wrong letter in this word
      let hintIndex = -1;
      for (let i = 0; i < pw.word.length; i++) {
        if (!currentAnswer[i] || currentAnswer[i] !== pw.word[i]) {
          hintIndex = i;
          break;
        }
      }

      if (hintIndex >= 0) {
        // Fill in that letter
        const newAnswer = currentAnswer.slice();
        while (newAnswer.length <= hintIndex) newAnswer.push('');
        newAnswer[hintIndex] = pw.word[hintIndex];
        setCrosswordAnswers({ ...crosswordAnswers, [answerKey]: newAnswer.join('') });

        // Move cell selection to the hinted position
        if (pw.direction === 'across') {
          setSelectedCell({ row: pw.row, col: pw.col + hintIndex });
        } else {
          setSelectedCell({ row: pw.row + hintIndex, col: pw.col });
        }
        setSelectedClue(pw.number);
        setSelectedDirection(pw.direction);
        setHintsUsed(h => h + 1);
        return;
      }
    }

    // If selected word is fully correct, fall back to any word with missing letters
    if (selectedClue !== null) {
      for (const pw of crosswordResult.placedWords) {
        const answerKey = `word-${pw.number}`;
        const currentAnswer = (crosswordAnswers[answerKey] || '').split('');
        for (let i = 0; i < pw.word.length; i++) {
          if (!currentAnswer[i] || currentAnswer[i] !== pw.word[i]) {
            const newAnswer = currentAnswer.slice();
            while (newAnswer.length <= i) newAnswer.push('');
            newAnswer[i] = pw.word[i];
            setCrosswordAnswers({ ...crosswordAnswers, [answerKey]: newAnswer.join('') });
            if (pw.direction === 'across') {
              setSelectedCell({ row: pw.row, col: pw.col + i });
            } else {
              setSelectedCell({ row: pw.row + i, col: pw.col });
            }
            setSelectedClue(pw.number);
            setSelectedDirection(pw.direction);
            setHintsUsed(h => h + 1);
            return;
          }
        }
      }
    }
  };

  const exportQuizToPDF = () => {
    if (!quizResult) return;
    const doc = new jsPDF();
    let yPos = 20;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    const lineHeight = 7;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    const titleText = doc.splitTextToSize(quizResult.title || 'Quiz', 170);
    doc.text(titleText, margin, yPos);
    yPos += titleText.length * 8 + 5;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Type: ${quizResult.quizType} | Difficulty: ${quizResult.difficulty} | Questions: ${quizResult.questions.length}`, margin, yPos);
    yPos += 15;

    quizResult.questions.forEach((q: any, idx: number) => {
      if (yPos > pageHeight - 60) { doc.addPage(); yPos = 20; }
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      const questionText = `${idx + 1}. ${q.question}`;
      const splitQuestion = doc.splitTextToSize(questionText, 170);
      doc.text(splitQuestion, margin, yPos);
      yPos += splitQuestion.length * lineHeight + 3;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      if (q.type === 'true_false') {
        doc.text('   [ ] True    [ ] False', margin, yPos);
        yPos += lineHeight;
      } else if (q.options) {
        q.options.forEach((opt: string) => {
          if (yPos > pageHeight - 30) { doc.addPage(); yPos = 20; }
          const optText = `   [ ] ${opt}`;
          const splitOpt = doc.splitTextToSize(optText, 165);
          doc.text(splitOpt, margin, yPos);
          yPos += splitOpt.length * lineHeight;
        });
      }
      yPos += 8;
    });

    doc.addPage();
    yPos = 20;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Answer Key', margin, yPos);
    yPos += 12;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    quizResult.questions.forEach((q: any, idx: number) => {
      if (yPos > pageHeight - 30) { doc.addPage(); yPos = 20; }
      doc.text(`${idx + 1}. ${q.correctAnswer}`, margin, yPos);
      yPos += lineHeight;
      if (q.explanation) {
        const expText = doc.splitTextToSize(`   Explanation: ${q.explanation}`, 165);
        doc.text(expText, margin, yPos);
        yPos += expText.length * lineHeight + 3;
      }
    });

    doc.save(`quiz-${Date.now()}.pdf`);
  };

  const exportQuizToDOCX = async () => {
    if (!quizResult) return;
    const children: any[] = [];

    children.push(new Paragraph({ text: quizResult.title || 'Quiz', heading: HeadingLevel.HEADING_1 }));
    children.push(new Paragraph({ children: [new TextRun({ text: `Type: ${quizResult.quizType} | Difficulty: ${quizResult.difficulty} | Questions: ${quizResult.questions.length}`, size: 20, color: '666666' })] }));
    children.push(new Paragraph({ text: '' }));

    quizResult.questions.forEach((q: any, idx: number) => {
      children.push(new Paragraph({ children: [new TextRun({ text: `${idx + 1}. ${q.question}`, bold: true })] }));
      if (q.type === 'true_false') {
        children.push(new Paragraph({ text: '   ☐ True    ☐ False' }));
      } else if (q.options) {
        q.options.forEach((opt: string) => {
          children.push(new Paragraph({ text: `   ☐ ${opt}` }));
        });
      }
      children.push(new Paragraph({ text: '' }));
    });

    children.push(new Paragraph({ text: 'Answer Key', heading: HeadingLevel.HEADING_2 }));
    quizResult.questions.forEach((q: any, idx: number) => {
      children.push(new Paragraph({ children: [new TextRun({ text: `${idx + 1}. `, bold: true }), new TextRun({ text: q.correctAnswer })] }));
      if (q.explanation) {
        children.push(new Paragraph({ children: [new TextRun({ text: `   Explanation: ${q.explanation}`, italics: true, size: 20, color: '666666' })] }));
      }
    });

    const docFile = new Document({ sections: [{ children }] });
    const blob = await Packer.toBlob(docFile);
    saveAs(blob, `quiz-${Date.now()}.docx`);
    trackExport();
  };

  const exportFlashcardsToPDF = () => {
    if (!flashcardResult?.cards?.length) return;
    const doc = new jsPDF();
    const margin = 20;
    const pageHeight = doc.internal.pageSize.height;
    let yPos = 20;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    const titleLines = doc.splitTextToSize(flashcardResult.title || 'Flashcards', 170);
    doc.text(titleLines, margin, yPos);
    yPos += titleLines.length * 8 + 4;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`${flashcardResult.cards.length} cards`, margin, yPos);
    doc.setTextColor(0);
    yPos += 12;

    flashcardResult.cards.forEach((card: any, idx: number) => {
      if (yPos > pageHeight - 50) { doc.addPage(); yPos = 20; }

      // Card number
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(180, 120, 0);
      doc.text(`Card ${idx + 1}`, margin, yPos);
      doc.setTextColor(0);
      yPos += 6;

      // Front
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Front:', margin, yPos);
      yPos += 6;
      doc.setFont('helvetica', 'normal');
      const frontLines = doc.splitTextToSize(card.front || '', 165);
      doc.text(frontLines, margin + 4, yPos);
      yPos += frontLines.length * 6 + 4;

      // Back
      if (yPos > pageHeight - 30) { doc.addPage(); yPos = 20; }
      doc.setFont('helvetica', 'bold');
      doc.text('Back:', margin, yPos);
      yPos += 6;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 100, 60);
      const backLines = doc.splitTextToSize(card.back || '', 165);
      doc.text(backLines, margin + 4, yPos);
      doc.setTextColor(0);
      yPos += backLines.length * 6 + 10;

      // Divider
      if (idx < flashcardResult.cards.length - 1) {
        doc.setDrawColor(220);
        doc.line(margin, yPos - 4, 190, yPos - 4);
      }
    });

    doc.save(`flashcards-${Date.now()}.pdf`);
  };

  const exportFlashcardsToDOCX = async () => {
    if (!flashcardResult?.cards?.length) return;
    const children: any[] = [];

    children.push(new Paragraph({ text: flashcardResult.title || 'Flashcards', heading: HeadingLevel.HEADING_1 }));
    children.push(new Paragraph({ children: [new TextRun({ text: `${flashcardResult.cards.length} cards`, size: 20, color: '666666' })] }));
    children.push(new Paragraph({ text: '' }));

    flashcardResult.cards.forEach((card: any, idx: number) => {
      children.push(new Paragraph({ children: [new TextRun({ text: `Card ${idx + 1}`, bold: true, color: 'B47800', size: 20 })] }));
      children.push(new Paragraph({ children: [new TextRun({ text: 'Front: ', bold: true }), new TextRun({ text: card.front || '' })] }));
      children.push(new Paragraph({ children: [new TextRun({ text: 'Back: ', bold: true }), new TextRun({ text: card.back || '', color: '3C643C' })] }));
      children.push(new Paragraph({ text: '' }));
    });

    const docFile = new Document({ sections: [{ children }] });
    const blob = await Packer.toBlob(docFile);
    saveAs(blob, `flashcards-${Date.now()}.docx`);
    trackExport();
  };

  const exportCrosswordToPDF = () => {
    if (!crosswordResult?.placedWords?.length) return;
    const doc = new jsPDF();
    const margin = 20;
    const pageHeight = doc.internal.pageSize.height;
    let yPos = 20;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    const titleLines = doc.splitTextToSize(crosswordResult.title || 'Crossword', 170);
    doc.text(titleLines, margin, yPos);
    yPos += titleLines.length * 8 + 4;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`${crosswordResult.placedWords.length} words`, margin, yPos);
    doc.setTextColor(0);
    yPos += 12;

    // Draw crossword grid
    const grid = crosswordResult.grid;
    if (grid?.length) {
      const cellSize = Math.min(8, Math.floor(160 / grid[0].length));
      const gridStartX = margin;
      const gridStartY = yPos;

      grid.forEach((row: string[], ri: number) => {
        row.forEach((cell: string, ci: number) => {
          const x = gridStartX + ci * cellSize;
          const y = gridStartY + ri * cellSize;
          if (cell !== '') {
            doc.setDrawColor(100, 100, 100);
            doc.setFillColor(255, 255, 255);
            doc.rect(x, y, cellSize, cellSize, 'FD');
            // Cell number
            const wordAtCell = crosswordResult.placedWords.find((pw: any) => pw.row === ri && pw.col === ci);
            if (wordAtCell) {
              doc.setFontSize(4);
              doc.setTextColor(80, 80, 80);
              doc.text(String(wordAtCell.number), x + 0.5, y + 3.5);
              doc.setTextColor(0, 0, 0);
            }
          } else {
            doc.setFillColor(40, 40, 40);
            doc.rect(x, y, cellSize, cellSize, 'F');
          }
        });
      });

      yPos = gridStartY + grid.length * cellSize + 14;
    }

    // Clues
    ['across', 'down'].forEach(dir => {
      const words = crosswordResult.placedWords
        .filter((pw: any) => pw.direction === dir)
        .sort((a: any, b: any) => a.number - b.number);
      if (!words.length) return;

      if (yPos > pageHeight - 30) { doc.addPage(); yPos = 20; }
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(dir === 'across' ? 'Across' : 'Down', margin, yPos);
      yPos += 8;

      words.forEach((pw: any) => {
        if (yPos > pageHeight - 15) { doc.addPage(); yPos = 20; }
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const clueText = doc.splitTextToSize(`${pw.number}. ${pw.clue} (${pw.word.length} letters)`, 165);
        doc.text(clueText, margin + 2, yPos);
        yPos += clueText.length * 6 + 2;
      });
      yPos += 4;
    });

    // Answer key
    if (yPos > pageHeight - 40) { doc.addPage(); yPos = 20; }
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Answer Key', margin, yPos);
    yPos += 8;
    const allWords = [...crosswordResult.placedWords].sort((a: any, b: any) => a.number - b.number);
    allWords.forEach((pw: any) => {
      if (yPos > pageHeight - 12) { doc.addPage(); yPos = 20; }
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`${pw.number}. ${pw.word} (${pw.direction})`, margin + 2, yPos);
      yPos += 6;
    });

    doc.save(`crossword-${Date.now()}.pdf`);
  };

  const exportCrosswordToDOCX = async () => {
    if (!crosswordResult?.placedWords?.length) return;
    const children: any[] = [];

    children.push(new Paragraph({ text: crosswordResult.title || 'Crossword', heading: HeadingLevel.HEADING_1 }));
    children.push(new Paragraph({ children: [new TextRun({ text: `${crosswordResult.placedWords.length} words`, size: 20, color: '666666' })] }));
    children.push(new Paragraph({ text: '' }));

    ['across', 'down'].forEach(dir => {
      const words = crosswordResult.placedWords
        .filter((pw: any) => pw.direction === dir)
        .sort((a: any, b: any) => a.number - b.number);
      if (!words.length) return;

      children.push(new Paragraph({ text: dir === 'across' ? 'Across' : 'Down', heading: HeadingLevel.HEADING_2 }));
      words.forEach((pw: any) => {
        children.push(new Paragraph({ children: [new TextRun({ text: `${pw.number}. `, bold: true }), new TextRun({ text: `${pw.clue} (${pw.word.length} letters)` })] }));
      });
      children.push(new Paragraph({ text: '' }));
    });

    children.push(new Paragraph({ text: 'Answer Key', heading: HeadingLevel.HEADING_2 }));
    const allWords = [...crosswordResult.placedWords].sort((a: any, b: any) => a.number - b.number);
    allWords.forEach((pw: any) => {
      children.push(new Paragraph({ children: [new TextRun({ text: `${pw.number}. `, bold: true }), new TextRun({ text: `${pw.word}`, color: '1A5C1A' }), new TextRun({ text: ` (${pw.direction})`, italics: true, color: '666666' })] }));
    });

    const docFile = new Document({ sections: [{ children }] });
    const blob = await Packer.toBlob(docFile);
    saveAs(blob, `crossword-${Date.now()}.docx`);
    trackExport();
  };

  const handleParseDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const token = localStorage.getItem('authToken');
    if (!token) return;
    setIsParsingDoc(true);
    setHumanizeError('');
    setSummaryError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/parse-document`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to parse document');
      setInputText(data.data.content || '');
    } catch (err: any) {
      if (mode === 'humanize') setHumanizeError(err.message || 'Failed to parse document');
      else setSummaryError(err.message || 'Failed to parse document');
    } finally {
      setIsParsingDoc(false);
    }
  };

  const handleSubmit = () => {
    if (mode === 'humanize') {
      handleHumanize();
    } else if (mode === 'citations') {
      handleCitationSearch();
    } else if (mode === 'summarize') {
      handleSummarize();
    } else if (mode === 'quiz') {
      if (studyToolMode === 'flashcards') handleGenerateFlashcards();
      else if (studyToolMode === 'crossword') handleGenerateCrossword();
      else handleGenerateQuiz();
    } else {
      handleAnalyze();
    }
  };

  return (
    <div className="min-h-screen relative transition-colors font-sans bg-gradient-to-b from-blue-50/60 via-stone-50 to-white dark:bg-stone-900">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.12),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(139,92,246,0.08),transparent)] pointer-events-none" aria-hidden />
      
      {/* Floating decorative elements - Gen Z style */}
      <div className="absolute top-24 left-8 w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-400/20 to-pink-500/20 rotate-12 hidden lg:block animate-float pointer-events-none" />
      <div className="absolute top-40 right-12 w-12 h-12 rounded-full bg-gradient-to-br from-violet-400/20 to-purple-500/20 hidden lg:block animate-float-delayed pointer-events-none" />
      <div className="absolute top-64 left-16 w-10 h-10 rounded-lg bg-gradient-to-br from-sky-400/20 to-blue-500/20 -rotate-12 hidden xl:block animate-float pointer-events-none" style={{ animationDelay: '1s' }} />
      <div className="absolute top-80 right-20 w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-teal-500/20 rotate-6 hidden xl:block animate-float-delayed pointer-events-none" />
      
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="dashboard" />

      {/* Welcome Tutorial - shows after onboarding completion */}
      {showWelcomeTutorial && (
        <WelcomeTutorial
          userName={user?.name?.split(' ')[0] || user?.name || ''}
          userId={user?.id}
          tutorialCompletedFromServer={(user as any)?.welcomeTutorialCompleted}
          onComplete={() => {
            setShowWelcomeTutorial(false);
            onUserUpdate?.({ welcomeTutorialCompleted: true });
          }}
        />
      )}

      {/* Quick Review - shows to returning users once per day */}
      {showQuickReview && !showWelcomeTutorial && (
        <QuickReviewModal
          userName={user?.name?.split(' ')[0] || user?.name || ''}
          userId={user?.id}
          onComplete={() => setShowQuickReview(false)}
          onSkip={() => setShowQuickReview(false)}
        />
      )}

      {/* Minimal top accent line */}
      <div className="h-1 bg-gradient-to-r from-blue-500 via-violet-500 to-purple-500" />

      {/* Main Content */}
      <main className="relative max-w-6xl mx-auto px-3 sm:px-6 pt-3 sm:pt-6 pb-20 sm:pb-14 w-full min-w-0 overflow-x-hidden lg:ml-24 lg:mr-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-4 lg:gap-6 items-start">
          {/* LEFT SIDEBAR: Streak + Calendar / Schedule - Hidden on mobile for cleaner experience */}
          <aside className="hidden lg:block order-2 lg:order-1 space-y-4 sticky top-16 min-w-0">
            {/* Streak Widget - desktop only (mobile shows it at top of main content) */}
            <div className="min-w-0">
              <StreakWidget />
            </div>

            {/* Quick Review Button */}
            <button
              onClick={() => setShowQuickReview(true)}
              className="w-full group bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 rounded-2xl p-4 shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 transition-all hover:scale-[1.02]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <span className="text-xl">🧠</span>
                </div>
                <div className="text-left">
                  <div className="text-white font-bold text-sm">Quick Review</div>
                  <div className="text-violet-200 text-xs">Test your memory</div>
                </div>
                <svg className="w-5 h-5 text-white/70 ml-auto group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            {/* Schedule Section */}
            <div className="bg-white dark:bg-stone-800 rounded-3xl shadow-lg shadow-stone-200/50 dark:shadow-stone-900/50 border border-stone-200/60 dark:border-stone-600/40 p-5 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-stone-800 dark:text-stone-100 flex items-center gap-2 text-sm">
                <span className="text-lg">📅</span> Schedule
              </h3>
              <button 
                onClick={openAddModal}
                className="text-stone-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors p-1 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-900/30"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
            
            {/* Mini Calendar View */}
            <div className="mb-4 bg-white/60 dark:bg-stone-800/60 backdrop-blur-sm rounded-2xl p-4 border border-violet-200/50 dark:border-violet-800/30 shadow-sm">
              <div className="flex items-center justify-between mb-3 text-xs font-medium text-stone-600 dark:text-stone-400">
                <button 
                  onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))}
                  className="p-1.5 hover:bg-violet-100 dark:hover:bg-violet-900/30 rounded-lg transition-colors text-violet-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <span className="font-bold text-stone-800 dark:text-stone-100 text-sm">{calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                <button 
                  onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))}
                  className="p-1.5 hover:bg-violet-100 dark:hover:bg-violet-900/30 rounded-lg transition-colors text-violet-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] mb-2 text-violet-500 dark:text-violet-400 font-bold">
                <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {getCalendarDays().map((d, i) => {
                  const events = getEventsForDate(d.date);
                  const today = isToday(d.date);
                  return (
                    <div 
                      key={i} 
                      className={`p-1.5 relative cursor-pointer rounded-lg transition-all ${
                        !d.isCurrentMonth ? 'text-stone-300 dark:text-stone-600' : 
                        today ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white font-bold shadow-lg shadow-violet-500/30 scale-110' : 
                        'text-stone-700 dark:text-stone-300 hover:bg-violet-100 dark:hover:bg-violet-900/30 hover:text-violet-700'
                      }`}
                    >
                      {d.day}
                      {events.length > 0 && !today && (
                        <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${eventTypeColors[events[0].event_type]?.dot || 'bg-violet-400'}`}></span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Upcoming Events List */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Upcoming</h4>
              
              {loadingEvents ? (
                <div className="text-center py-4 text-stone-400 text-xs">Loading...</div>
              ) : getUpcomingEvents().length === 0 ? (
                <div className="text-center py-4 text-stone-400 text-xs">No upcoming events</div>
              ) : (
                getUpcomingEvents().map(event => {
                  const colors = eventTypeColors[event.event_type] || eventTypeColors.other;
                  const eventDate = new Date(toDateStr(event.event_date) + 'T00:00:00');
                  return (
                    <div key={event.id} className={`flex gap-2 p-2.5 rounded-xl ${colors.bg} dark:bg-opacity-50 border ${colors.border} group relative hover:shadow-md transition-shadow`}>
                      <div className={`flex flex-col items-center justify-center w-9 h-9 bg-white rounded-lg shadow-sm ${colors.text} flex-shrink-0`}>
                        <span className="text-[8px] font-bold uppercase leading-none">{eventDate.toLocaleDateString('en-US', { month: 'short' })}</span>
                        <span className="text-sm font-bold leading-none">{eventDate.getDate()}</span>
                      </div>
                      <div 
                        className="min-w-0 flex-1 cursor-pointer"
                        onClick={() => openEditModal(event)}
                      >
                        <p className="text-xs font-semibold text-stone-800 dark:text-stone-100 truncate">{event.title}</p>
                        <p className="text-[10px] text-stone-500 truncate">
                          {event.course && `${event.course} • `}{event.event_time || 'All day'}
                        </p>
                      </div>
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        <button 
                          onClick={(e) => { e.stopPropagation(); openEditModal(event); }}
                          className="p-1 text-stone-400 hover:text-violet-600 transition-colors"
                          title="Edit"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); deleteStudyEvent(event.id); }}
                          className="p-1 text-stone-400 hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            <button 
              onClick={openAddModal}
              className="w-full mt-3 py-3 text-sm font-semibold text-white bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 rounded-xl transition-all shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add Event
            </button>
            </div>
          </aside>

          {/* RIGHT MAIN CONTENT */}
          <div className="order-1 lg:order-2 min-w-0 pt-4 sm:pt-10 overflow-visible">
            {/* Mobile Header: Compact streak + Badge widget */}
            <div className="flex items-stretch gap-2 mb-4 lg:hidden">
              <StreakWidget compact />
              <div className="flex-1 min-w-0">
                <BadgeWidget onNavigate={onNavigate} mobileExpanded />
              </div>
            </div>

            {/* Search Bar - Optimized for mobile touch */}
            <div className="mb-5 sm:mb-6">
              <div className="relative">
                <svg className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 dark:text-stone-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search documents, quizzes..."
                  className="w-full pl-11 sm:pl-12 pr-10 py-3 sm:py-3.5 bg-white dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700/50 rounded-xl sm:rounded-2xl text-sm text-stone-800 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 outline-none focus:border-violet-400 dark:focus:border-violet-500 focus:ring-2 focus:ring-violet-300/30 dark:focus:ring-violet-600/30 transition-all shadow-sm active:shadow-md"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-1.5 sm:p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
              </div>

              {/* Inline search results — shown immediately below the bar while typing */}
              {searchQuery.trim() && (
                <div className="mt-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl shadow-xl overflow-hidden">
                  {filteredActivity.length > 0 ? (
                    <>
                      <div className="px-4 pt-3 pb-1">
                        <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">{filteredActivity.length} result{filteredActivity.length !== 1 ? 's' : ''}</p>
                      </div>
                      {filteredActivity.slice(0, 6).map((activity) => {
                        const meta = activityMeta[activity.type];
                        return (
                          <button
                            key={activity.id}
                            onClick={() => handleActivityClick(activity)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors text-left group"
                          >
                            <div className={`w-9 h-9 ${meta.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                              <span className="text-base">{meta.emoji}</span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-stone-800 dark:text-stone-100 text-sm truncate group-hover:text-violet-700 dark:group-hover:text-violet-400">{activity.title}</p>
                              <p className="text-xs text-stone-400 dark:text-stone-500 truncate">{activity.subtitle}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-[10px] text-stone-400 dark:text-stone-500">{relativeTime(activity.date)}</span>
                              <span className={`px-2 py-0.5 ${meta.bg} text-[10px] font-bold rounded-md uppercase tracking-wide text-stone-600 dark:text-stone-300`}>{meta.label}</span>
                            </div>
                          </button>
                        );
                      })}
                    </>
                  ) : (
                    <div className="px-4 py-6 text-center">
                      <p className="text-sm font-medium text-stone-500 dark:text-stone-400">No results for <span className="font-semibold text-stone-700 dark:text-stone-200">"{searchQuery}"</span></p>
                      <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">Try searching by document name or activity type</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Warm Welcome Section - Mobile Optimized */}
            <div className="mb-6 sm:mb-8">
              <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-stone-800 dark:text-stone-100 leading-tight truncate">
                    {greeting.greeting}{user?.name ? `, ${user.name.split(' ')[0]}` : ''}! <span className="inline-block animate-[wave_1.8s_ease-in-out_infinite]">{greeting.emoji}</span>
                  </h1>
                  <p className="text-stone-500 dark:text-stone-400 mt-1 sm:mt-2 text-sm sm:text-base">
                    Everything you need to <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-600 font-semibold">survive school</span>
                  </p>
                  {/* Mobile Quick Review + Friends Buttons */}
                  <div className="mt-4 lg:hidden flex gap-2">
                    <button
                      onClick={() => setShowQuickReview(true)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-3 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl shadow-md shadow-violet-500/20 text-white font-semibold text-sm active:scale-[0.98] transition-all"
                    >
                      <span className="text-lg">🧠</span>
                      <span>Quick Review</span>
                    </button>
                    <button
                      onClick={() => onNavigate('friends')}
                      className="relative flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl shadow-md shadow-emerald-500/20 text-white font-semibold text-sm active:scale-[0.98] transition-all"
                    >
                      <span className="text-lg">👥</span>
                      <span>Friends</span>
                      {friendNotificationCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg">
                          {friendNotificationCount > 9 ? '9+' : friendNotificationCount}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                  {/* Desktop Friends Button */}
                  <button
                    onClick={() => onNavigate('friends')}
                    className="hidden lg:flex relative items-center gap-2 px-3 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-sm font-bold rounded-full transition-all shadow-md shadow-emerald-500/30 hover:shadow-lg hover:scale-105"
                  >
                    <span>👥</span>
                    <span>Friends</span>
                    {friendNotificationCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg">
                        {friendNotificationCount > 9 ? '9+' : friendNotificationCount}
                      </span>
                    )}
                  </button>
                  <div className="hidden lg:block"><BadgeWidget onNavigate={onNavigate} /></div>
                  {usageStats.plan === 'free' && !loadingStats && (
                    <button
                      onClick={() => onNavigate('pricing')}
                      className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 text-white text-xs sm:text-sm font-bold rounded-full transition-all shadow-md shadow-violet-500/30 active:scale-95 sm:hover:shadow-lg sm:hover:scale-105 flex-1 sm:flex-none"
                    >
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                      <span className="hidden xs:inline">Upgrade Plan</span>
                      <span className="xs:hidden">Upgrade</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Ebook banner - subtle inline */}
              {showEbookBanner && !ebookBannerDismissed && (
                <div className="mt-4 relative">
                  <a
                    href="/downloads/writescholar-ultimate-study-tips-guide.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl bg-amber-50/80 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-700/40 px-4 py-3 pr-10 transition-all hover:bg-amber-50 dark:hover:bg-amber-900/30 hover:shadow-sm group"
                  >
                    <span className="text-xl">📖</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-stone-700 dark:text-stone-200 text-sm">Free Study Tips Guide</p>
                      <p className="text-xs text-stone-500 dark:text-stone-400">Download our ultimate study tips ebook (PDF)</p>
                    </div>
                    <span className="text-xs font-medium text-amber-600 dark:text-amber-400 group-hover:underline">Get it free →</span>
                  </a>
                  <button
                    onClick={(e) => { e.preventDefault(); dismissEbookBanner(); }}
                    className="absolute top-2 right-2 p-1 rounded-md text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                    aria-label="Dismiss"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Quick Action Cards - Mobile-optimized 2-col grid */}
            {loadingStats ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8 pt-2 sm:pt-4 pb-2 sm:pb-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="p-3 sm:p-4 rounded-2xl border border-stone-200/50 dark:border-stone-700/30 bg-stone-50 dark:bg-stone-800/50 animate-pulse">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-stone-200 dark:bg-stone-700 rounded-xl mb-2.5 sm:mb-3" />
                    <div className="h-3.5 sm:h-4 bg-stone-200 dark:bg-stone-700 rounded-lg w-3/4 mb-1.5 sm:mb-2" />
                    <div className="h-2.5 sm:h-3 bg-stone-100 dark:bg-stone-700/60 rounded-lg w-full" />
                  </div>
                ))}
              </div>
            ) : (
            <div className="mb-6 sm:mb-8 pt-4 sm:pt-6 pb-4 sm:pb-6 overflow-visible">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
              {([
                { id: 'analyze' as const, icon: '📝', title: 'Analyze', desc: 'Get professor-style feedback on your essays', mobileDesc: 'Essay feedback', gradient: 'from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/15', border: 'border-rose-200/70 dark:border-rose-700/40', activeBorder: 'border-rose-400 dark:border-rose-500 ring-2 ring-rose-300/50 dark:ring-rose-600/40', iconBg: 'bg-gradient-to-br from-rose-400 to-pink-500', accentColor: 'text-rose-600 dark:text-rose-400', pro: false, setStudyMode: null },
                { id: 'citations' as const, icon: '📚', title: 'Citations', desc: 'Find and format academic sources instantly', mobileDesc: 'Find sources', gradient: 'from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/15', border: 'border-sky-200/70 dark:border-sky-700/40', activeBorder: 'border-sky-400 dark:border-sky-500 ring-2 ring-sky-300/50 dark:ring-sky-600/40', iconBg: 'bg-gradient-to-br from-sky-400 to-blue-500', accentColor: 'text-sky-600 dark:text-sky-400', pro: false, setStudyMode: null },
                { id: 'quiz' as const, icon: '🎯', title: 'Quiz', desc: 'Create quizzes from your study material', mobileDesc: 'Generate quizzes', gradient: 'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/15', border: 'border-amber-200/70 dark:border-amber-700/40', activeBorder: 'border-amber-400 dark:border-amber-500 ring-2 ring-amber-300/50 dark:ring-amber-600/40', iconBg: 'bg-gradient-to-br from-amber-400 to-orange-500', accentColor: 'text-amber-600 dark:text-amber-400', pro: false, setStudyMode: 'quiz' as const },
                { id: 'flashcards' as const, icon: '🃏', title: 'Flashcards', desc: 'Generate flashcards from any content', mobileDesc: 'Study cards', gradient: 'from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/15', border: 'border-emerald-200/70 dark:border-emerald-700/40', activeBorder: 'border-emerald-400 dark:border-emerald-500 ring-2 ring-emerald-300/50 dark:ring-emerald-600/40', iconBg: 'bg-gradient-to-br from-emerald-400 to-teal-500', accentColor: 'text-emerald-600 dark:text-emerald-400', pro: false, setStudyMode: 'flashcards' as const },
                { id: 'humanize' as const, icon: '✨', title: 'Humanize', desc: 'Transform AI text into natural human writing', mobileDesc: 'Humanize AI text', gradient: 'from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/15', border: 'border-violet-200/70 dark:border-violet-700/40', activeBorder: 'border-violet-400 dark:border-violet-500 ring-2 ring-violet-300/50 dark:ring-violet-600/40', iconBg: 'bg-gradient-to-br from-violet-400 to-purple-500', accentColor: 'text-violet-600 dark:text-violet-400', pro: true, setStudyMode: null },
                { id: 'summarize_tool' as const, icon: '📋', title: 'Summarize', desc: 'Condense papers and articles instantly', mobileDesc: 'Summarize text', gradient: 'from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/15', border: 'border-teal-200/70 dark:border-teal-700/40', activeBorder: 'border-teal-400 dark:border-teal-500 ring-2 ring-teal-300/50 dark:ring-teal-600/40', iconBg: 'bg-gradient-to-br from-teal-400 to-cyan-500', accentColor: 'text-teal-600 dark:text-teal-400', pro: false, setStudyMode: null },
                { id: 'crater_blast' as const, icon: '🚀', title: 'Crater Blast', desc: 'Play the learning game with your content', mobileDesc: 'Quiz game', gradient: 'from-violet-900/30 to-purple-900/40 dark:from-violet-900/30 dark:to-purple-900/40', border: 'border-violet-200/70 dark:border-violet-700/40', activeBorder: 'border-violet-500 dark:border-violet-500 ring-2 ring-violet-400/50 dark:ring-violet-600/40', iconBg: 'bg-gradient-to-br from-violet-600 to-purple-700', accentColor: 'text-violet-600 dark:text-violet-300', pro: false, setStudyMode: 'crater_blast' as const },
              ] as const).map(tool => (
                <button
                  key={tool.id}
                  onClick={() => {
                    if (tool.id === 'flashcards' || tool.id === 'crater_blast' || (tool.id === 'quiz' && tool.setStudyMode)) {
                      setMode('quiz');
                      if (tool.setStudyMode) setStudyToolMode(tool.setStudyMode);
                    } else if (tool.id === 'summarize_tool') {
                      setMode('summarize');
                    } else {
                      setMode(tool.id as 'analyze' | 'citations' | 'humanize');
                    }
                    setInputText('');
                    setShowWordWarning(false);
                    if (tool.id !== 'humanize') setShowHumanizeResult(false);
                    if (tool.id !== 'summarize_tool') setSummaryResult(null);
                    if (tool.id !== 'quiz' && tool.id !== 'flashcards' && tool.id !== 'crater_blast') { setQuizResult(null); setFlashcardResult(null); setCrosswordResult(null); }
                  }}
                  className={`relative p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border bg-white dark:bg-stone-800 text-left transition-all duration-200 group active:scale-[0.98] sm:hover:shadow-2xl sm:hover:-translate-y-1 overflow-hidden ${
                    (mode === tool.id && !['quiz', 'flashcards', 'crater_blast'].includes(tool.id)) ||
                    (tool.id === 'flashcards' && mode === 'quiz' && studyToolMode === 'flashcards') ||
                    (tool.id === 'crater_blast' && mode === 'quiz' && studyToolMode === 'crater_blast') ||
                    (tool.id === 'quiz' && mode === 'quiz' && studyToolMode === 'quiz') ||
                    (tool.id === 'summarize_tool' && mode === 'summarize')
                      ? `shadow-lg sm:shadow-xl ${tool.activeBorder}` 
                      : `${tool.border} sm:hover:shadow-lg border-stone-200/60 dark:border-stone-700/40`
                  }`}
                >
                  {/* Colored accent orb - smaller on mobile */}
                  <div className={`absolute top-0 right-0 w-16 sm:w-24 h-16 sm:h-24 rounded-full -translate-y-1/2 translate-x-1/2 bg-gradient-to-br ${tool.gradient} opacity-60`} />
                  
                  <div className={`relative z-10 w-10 h-10 sm:w-12 sm:h-12 ${tool.iconBg} rounded-xl sm:rounded-2xl flex items-center justify-center mb-2.5 sm:mb-4 group-active:scale-95 sm:group-hover:scale-110 sm:group-hover:rotate-3 transition-all duration-300 shadow-md sm:shadow-lg`}>
                    <span className="text-xl sm:text-2xl">{tool.icon}</span>
                  </div>
                  <h3 className={`font-bold text-sm sm:text-base leading-tight relative z-10 ${tool.accentColor}`}>{tool.title}</h3>
                  <p className="text-stone-500 dark:text-stone-400 text-[11px] sm:text-xs mt-1 sm:mt-2 leading-relaxed relative z-10 line-clamp-2">
                    <span className="hidden sm:inline">{tool.desc}</span>
                    <span className="sm:hidden">{tool.mobileDesc}</span>
                  </p>
                  {tool.pro && usageStats.plan === 'free' && (
                    <span className="absolute top-2 right-2 sm:top-3 sm:right-3 px-1.5 sm:px-2 py-0.5 sm:py-1 text-[8px] sm:text-[10px] font-bold rounded-md sm:rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 text-white leading-none shadow-md z-20">Upgrade</span>
                  )}
                </button>
              ))}
              {/* View more pill */}
              <button
                onClick={() => onNavigate('more-tools')}
                className="relative p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-violet-200/60 dark:border-violet-700/40 bg-gradient-to-br from-violet-50/80 via-white to-purple-50/80 dark:from-violet-900/20 dark:via-stone-800 dark:to-purple-900/20 text-left transition-all duration-200 group active:scale-[0.98] sm:hover:shadow-2xl sm:hover:-translate-y-1 sm:hover:border-violet-400 dark:sm:hover:border-violet-500 sm:hover:shadow-violet-500/20 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-16 sm:w-24 h-16 sm:h-24 rounded-full -translate-y-1/2 translate-x-1/2 bg-gradient-to-br from-violet-400 to-purple-500 opacity-40 sm:group-hover:opacity-60 transition-opacity" />
                <div className="absolute bottom-2 left-2 w-6 sm:w-8 h-6 sm:h-8 rounded-lg bg-violet-300/20 dark:bg-violet-600/20 rotate-12 sm:group-hover:scale-110 transition-transform" />
                <div className="relative z-10 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-violet-400 to-purple-500 rounded-xl sm:rounded-2xl flex items-center justify-center mb-2.5 sm:mb-4 group-active:scale-95 sm:group-hover:scale-110 sm:group-hover:rotate-3 transition-all duration-300 shadow-md sm:shadow-lg shadow-violet-500/30">
                  <span className="text-xl sm:text-2xl">➕</span>
                </div>
                <h3 className="font-bold text-sm sm:text-base leading-tight text-violet-700 dark:text-violet-300 sm:group-hover:text-violet-800 dark:sm:group-hover:text-violet-200 transition-colors">More Tools</h3>
                <p className="text-stone-500 dark:text-stone-400 text-[11px] sm:text-xs mt-1 sm:mt-2 leading-relaxed line-clamp-2">
                  <span className="hidden sm:inline">Word counter, essay outline, GPA calculator & more</span>
                  <span className="sm:hidden">10+ free tools</span>
                </p>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-violet-500 dark:text-violet-400 mt-2 opacity-80 group-hover:opacity-100 transition-opacity">
                  Explore 10+ free tools
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </span>
              </button>
              </div>
            </div>
            )}

        {/* ANALYZE MODE - Upload First Design - Mobile optimized */}
        {mode === 'analyze' && (
          <>
            {/* Primary: Upload Section - Mobile optimized */}
            <div className="relative mb-6 sm:mb-8 overflow-visible">
              <div 
                onClick={() => onNavigate('upload')}
                className="relative bg-gradient-to-br from-rose-50 via-white to-pink-50 dark:from-rose-900/20 dark:via-stone-800 dark:to-pink-900/20 rounded-2xl sm:rounded-3xl p-6 sm:p-12 text-center border border-rose-200/60 dark:border-rose-700/40 active:border-rose-300 dark:active:border-rose-600 sm:hover:border-rose-300 dark:sm:hover:border-rose-600 cursor-pointer transition-all duration-200 sm:hover:shadow-2xl sm:hover:-translate-y-1 group shadow-md sm:shadow-lg overflow-hidden"
              >
                {/* Decorative elements - Hidden on mobile */}
                <div className="absolute top-4 left-4 w-12 h-12 rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 opacity-20 rotate-12 group-hover:rotate-0 transition-transform hidden sm:block" />
                <div className="absolute bottom-4 right-4 w-16 h-16 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 opacity-10 group-hover:scale-110 transition-transform hidden sm:block" />
                <div className="absolute top-1/2 right-8 w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-cyan-500 opacity-15 -rotate-12 hidden sm:block" />
                
                <div className="relative z-10 w-14 h-14 sm:w-20 sm:h-20 bg-gradient-to-br from-rose-400 to-pink-500 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg sm:shadow-xl shadow-rose-500/30">
                  <span className="text-2xl sm:text-4xl">📝</span>
                </div>
                <h2 className="text-xl sm:text-3xl font-extrabold text-stone-800 dark:text-stone-100 mb-2 sm:mb-3 relative z-10">Upload your essay</h2>
                <p className="text-stone-500 dark:text-stone-400 text-sm sm:text-base mb-5 sm:mb-8 max-w-md mx-auto relative z-10">
                  Get professor-style feedback on structure, clarity, and tone
                </p>
                <button 
                  className="w-full sm:w-auto inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-rose-500 to-pink-600 active:from-rose-600 active:to-pink-700 sm:hover:from-rose-400 sm:hover:to-pink-500 text-white font-bold rounded-xl sm:rounded-2xl transition-all text-sm sm:text-base shadow-lg sm:shadow-xl shadow-rose-500/30 sm:hover:scale-105 sm:hover:-translate-y-0.5 active:scale-95 relative z-10"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload File
                </button>
                <div className="flex justify-center gap-2 sm:gap-3 mt-4 sm:mt-6 relative z-10">
                  <span className="px-3 sm:px-4 py-1 sm:py-1.5 bg-white/80 dark:bg-stone-700/50 text-stone-600 dark:text-stone-300 text-[10px] sm:text-xs font-semibold rounded-full shadow-sm">PDF</span>
                  <span className="px-3 sm:px-4 py-1 sm:py-1.5 bg-white/80 dark:bg-stone-700/50 text-stone-600 dark:text-stone-300 text-[10px] sm:text-xs font-semibold rounded-full shadow-sm">DOCX</span>
                  <span className="px-3 sm:px-4 py-1 sm:py-1.5 bg-white/80 dark:bg-stone-700/50 text-stone-600 dark:text-stone-300 text-[10px] sm:text-xs font-semibold rounded-full shadow-sm">TXT</span>
                </div>
              </div>
            </div>

            {/* Divider - Mobile optimized */}
            <div className="flex items-center justify-center mb-6 sm:mb-8">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-stone-300 to-transparent dark:via-stone-600"></div>
              <span className="px-4 sm:px-6 text-stone-400 dark:text-stone-500 text-xs sm:text-sm font-medium bg-gradient-to-r from-blue-50/0 via-blue-50/50 to-blue-50/0 dark:from-stone-900/0 dark:via-stone-800/50 dark:to-stone-900/0 py-1.5 sm:py-2 rounded-full whitespace-nowrap">or paste text</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-stone-300 to-transparent dark:via-stone-600"></div>
            </div>

            {/* Secondary: Text Input (smaller) */}
            <div className="mb-12">
              <div className="relative bg-white dark:bg-stone-800 rounded-3xl border border-stone-200/80 dark:border-stone-600/50 shadow-lg hover:border-rose-300 dark:hover:border-rose-600 hover:shadow-xl focus-within:border-rose-400 dark:focus-within:border-rose-500 focus-within:shadow-2xl focus-within:shadow-rose-500/10 focus-within:ring-2 focus-within:ring-rose-400/20 transition-all duration-300">
                <textarea
                  value={inputText}
                  onChange={(e) => { setInputText(e.target.value); setShowWordWarning(false); }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && isTextValid()) { e.preventDefault(); handleSubmit(); }}}
                  placeholder={placeholders[placeholderIndex]}
                  className="w-full min-h-[120px] p-5 text-stone-800 text-base border-none outline-none resize-none bg-transparent placeholder-stone-400 leading-relaxed"
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = Math.min(target.scrollHeight, 280) + 'px';
                  }}
                />
                
                {/* Word count */}
                <div className="absolute bottom-3 left-5 text-sm text-stone-400">
                  {getWordCount(inputText)} words{getWordCount(inputText) < 200 ? ' (min 200)' : ''}
                </div>

                {/* Warning */}
                {showWordWarning && (
                  <div className="absolute -bottom-7 left-0 right-0 text-center">
                    <span className="text-sm text-red-500">Minimum 200 words required for analysis</span>
                  </div>
                )}
              </div>
              
              {/* Submit button */}
              <div className="flex justify-center mt-4">
                <button
                  onClick={handleSubmit}
                  disabled={!isTextValid()}
                  className={`px-6 py-3 rounded-2xl flex items-center justify-center transition-all font-bold text-base ${
                    isTextValid()
                      ? 'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white shadow-lg shadow-rose-500/30 hover:scale-105 cursor-pointer'
                      : 'bg-stone-100 dark:bg-stone-700 text-stone-400 cursor-not-allowed'
                  }`}
                >
                  Analyze Text
                </button>
              </div>
            </div>
          </>
        )}

        {/* CITATIONS MODE - Text Input Primary */}
        {mode === 'citations' && (
          <>
            {/* Citation Options */}
            <div className="flex justify-center mb-5">
              <div className="inline-flex items-center gap-3 flex-wrap justify-center">
                <div className="inline-flex items-center bg-white rounded-xl px-4 py-2.5 border border-stone-200">
                  <span className="text-stone-500 mr-2 text-sm">Style:</span>
                  <select
                    value={citationStyle}
                    onChange={(e) => setCitationStyle(e.target.value)}
                    className="bg-transparent font-medium text-stone-800 outline-none cursor-pointer text-sm"
                  >
                    <option value="APA">APA 7th</option>
                    <option value="MLA">MLA 9th</option>
                    <option value="Chicago">Chicago</option>
                    <option value="Harvard">Harvard</option>
                    <option value="IEEE">IEEE</option>
                    <option value="Vancouver">Vancouver</option>
                  </select>
                </div>
                
                <div className="inline-flex items-center bg-white rounded-xl px-4 py-2.5 border border-stone-200">
                  <span className="text-stone-500 mr-2 text-sm">Year:</span>
                  <select
                    value={citationYearRange}
                    onChange={(e) => setCitationYearRange(e.target.value)}
                    className="bg-transparent font-medium text-stone-800 outline-none cursor-pointer text-sm"
                  >
                    <option value="all">All Time</option>
                    <option value="3">Last 3 Years</option>
                    <option value="5">Last 5 Years</option>
                    <option value="10">Last 10 Years</option>
                    <option value="15">Last 15 Years</option>
                    <option value="20">Last 20 Years</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Input Area */}
            <div className="mb-8 relative overflow-visible">
              <div className="relative bg-white rounded-3xl border border-stone-200/80 shadow-sm hover:border-stone-300 hover:shadow-md focus-within:border-[#22A7AB]/40 focus-within:shadow-xl focus-within:shadow-[#22A7AB]/5 focus-within:ring-2 focus-within:ring-[#22A7AB]/20 transition-all duration-300">
                <textarea
                  value={inputText}
                  onChange={(e) => { setInputText(e.target.value); setShowWordWarning(false); }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && isTextValid()) { e.preventDefault(); handleSubmit(); }}}
                  placeholder={placeholders[placeholderIndex]}
                  className="w-full min-h-[160px] sm:min-h-[180px] p-5 sm:p-6 text-stone-800 text-lg border-none outline-none resize-none bg-transparent placeholder-stone-400 leading-relaxed"
                  style={{ fontSize: '18px' }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = Math.min(target.scrollHeight, 320) + 'px';
                  }}
                />
                
                <div className="absolute bottom-4 left-5 text-sm text-stone-400">
                  {inputText.length} characters
                </div>

                {showWordWarning && (
                  <div className="absolute -bottom-8 left-0 right-0 text-center">
                    <span className="text-sm text-red-500">Please enter a research topic</span>
                  </div>
                )}
              </div>
              
              <div className="flex justify-center mt-4">
                <button
                  onClick={handleSubmit}
                  disabled={!isTextValid() || isSearchingCitations}
                  className={`px-8 py-3.5 rounded-2xl flex items-center justify-center transition-all font-bold text-base ${
                    isTextValid() && !isSearchingCitations
                      ? 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white shadow-lg shadow-sky-500/30 hover:scale-105 cursor-pointer'
                      : 'bg-stone-200 dark:bg-stone-700 text-stone-400 cursor-not-allowed'
                  }`}
                >
                  {isSearchingCitations ? (
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <>Find Sources</>
                  )}
                </button>
              </div>
            </div>

            {/* Suggested Topics */}
            <div className="mb-12">
              <p className="text-sm text-stone-500 dark:text-stone-400 text-center mb-4 font-medium">Suggestions</p>
              <div className="flex flex-wrap justify-center gap-2.5">
                {suggestedTopics.map((topic, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setInputText(topic)}
                    className="px-4 py-2.5 bg-white dark:bg-stone-800 hover:bg-sky-50 dark:hover:bg-sky-900/20 text-stone-700 dark:text-stone-200 text-sm sm:text-base rounded-xl border border-stone-200 dark:border-stone-600 hover:border-sky-300 dark:hover:border-sky-600 transition-all font-medium hover:shadow-md"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* HUMANIZE MODE - new website style */}
        {mode === 'humanize' && (
          <>
            <div className="relative rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden mb-6 min-w-0">
              <div className="absolute top-4 right-4 w-12 h-12 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 opacity-20 rotate-12 pointer-events-none" />
              <div className="absolute bottom-4 left-4 w-16 h-16 rounded-full bg-violet-400/10 pointer-events-none" />
              <div className="absolute top-1/2 right-8 w-8 h-8 rounded-lg bg-purple-400/15 -rotate-12 hidden sm:block pointer-events-none" />
              <div className="bg-white dark:bg-stone-800 rounded-2xl sm:rounded-3xl border border-violet-200/60 dark:border-violet-700/40 shadow-inner">
              {/* Toolbar */}
              <div className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border-b border-violet-200/60 dark:border-violet-700/40 px-3 sm:px-5 py-3 sm:py-4">
                <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0 overflow-x-auto sm:overflow-visible">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                      <span className="text-xs font-medium text-stone-500 dark:text-stone-400 flex-shrink-0">Mode:</span>
                      <div className="flex items-center bg-white dark:bg-stone-700 rounded-xl px-0.5 sm:px-1 py-1 shadow-sm border border-stone-200 dark:border-stone-600">
                      {([
                        { id: 'standard', label: 'Standard', tooltip: 'Natural college-student writing, clear and slightly informal' },
                        { id: 'academic', label: 'Academic', tooltip: 'Formal academic tone with technical terms, keeps citations' },
                        { id: 'casual', label: 'Casual', tooltip: 'Conversational tone, like explaining to a friend' },
                        { id: 'creative', label: 'Creative', tooltip: 'Personal essay style with varied rhythm' }
                      ] as const).map((m) => (
                        <button
                          key={m.id}
                          onClick={() => setHumanizeMode(m.id)}
                          title={m.tooltip}
                          className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                            humanizeMode === m.id ? 'bg-violet-600 text-white shadow-sm' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-600'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                      <span className="text-xs font-medium text-stone-500 dark:text-stone-400 flex-shrink-0">Intensity:</span>
                      <div className="flex items-center bg-white dark:bg-stone-700 rounded-xl px-0.5 sm:px-1 py-1 shadow-sm border border-stone-200 dark:border-stone-600">
                      {([
                        { id: 'light', label: 'Light', tooltip: 'Minimal changes (~15-20%), fixes obvious AI phrases' },
                        { id: 'medium', label: 'Medium', tooltip: 'Balanced rewrite (~40-50%), adds natural variation' },
                        { id: 'aggressive', label: 'Heavy', tooltip: 'Full rewrite, completely different wording, same meaning' }
                      ] as const).map((intensity) => (
                        <button
                          key={intensity.id}
                          onClick={() => setHumanizeIntensity(intensity.id)}
                          title={intensity.tooltip}
                          className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                            humanizeIntensity === intensity.id ? 'bg-violet-600 text-white shadow-sm' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-600'
                          }`}
                        >
                          {intensity.label}
                        </button>
                      ))}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleSubmit}
                    disabled={!isTextValid() || isHumanizing}
                    className={`w-full sm:w-auto px-6 py-2.5 rounded-xl flex items-center justify-center transition-all font-semibold text-sm flex-shrink-0 ${
                      isTextValid() && !isHumanizing
                        ? 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-violet-200/50 dark:shadow-violet-900/30 cursor-pointer transform hover:-translate-y-0.5'
                        : 'bg-stone-200 dark:bg-stone-600 text-stone-400 dark:text-stone-500 cursor-not-allowed'
                    }`}
                  >
                    {isHumanizing ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Humanizing...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Humanize
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Editor Panels */}
              <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-stone-200 dark:divide-stone-600 min-w-0">
                {/* Left Panel */}
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 bg-stone-50 dark:bg-stone-800/50 border-b border-stone-200 dark:border-stone-600 gap-2 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2 h-2 rounded-full bg-stone-400 dark:bg-stone-500 flex-shrink-0"></div>
                      <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider truncate">Original</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <input ref={parseFileInputRef} type="file" accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" onChange={handleParseDocument} className="hidden" />
                      <button onClick={() => parseFileInputRef.current?.click()} disabled={isParsingDoc} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-800/50 font-semibold text-sm transition-colors disabled:opacity-50 border border-violet-200 dark:border-violet-700">
                        {isParsingDoc ? <span className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" /> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>}
                        {isParsingDoc ? 'Parsing...' : 'Upload Document'}
                      </button>
                      <button onClick={() => navigator.clipboard.readText().then(text => setInputText(text))} className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-stone-600 dark:text-stone-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/30 rounded-lg transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                        Paste
                      </button>
                      <button onClick={() => setInputText('')} className={`flex items-center gap-1.5 px-2 py-1.5 text-xs text-stone-600 dark:text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors ${!inputText ? 'invisible' : ''}`}>Clear</button>
                    </div>
                  </div>
                  <textarea
                    value={inputText}
                    onChange={(e) => { setInputText(e.target.value); setShowWordWarning(false); }}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && isTextValid()) { e.preventDefault(); handleSubmit(); }}}
                    placeholder={placeholders[placeholderIndex]}
                    disabled={isHumanizing}
                    className="w-full min-w-0 min-h-[240px] sm:min-h-[280px] md:min-h-[350px] p-3 sm:p-5 text-stone-800 dark:text-stone-100 text-[15px] border-none outline-none resize-none bg-transparent placeholder-stone-400 dark:placeholder-stone-500 leading-relaxed"
                  />
                  <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 bg-stone-50/50 dark:bg-stone-800/30 border-t border-stone-200 dark:border-stone-600">
                    <span className={`text-xs font-medium ${getWordCount(inputText) > humanizeSummarizeMaxWords ? 'text-red-600' : 'text-stone-500 dark:text-stone-400'}`}>
                      {getWordCount(inputText)} words / {humanizeSummarizeMaxWords.toLocaleString()} max
                      {getWordCount(inputText) > humanizeSummarizeMaxWords && isFreeUser && ' — Upgrade for 5,000'}
                    </span>
                  </div>
                </div>

                {/* Right Panel */}
                <div className="flex flex-col bg-gradient-to-br from-violet-50/30 to-purple-50/30 dark:from-violet-900/10 dark:to-purple-900/10 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-5 py-2.5 sm:py-3 bg-violet-50/50 dark:bg-violet-900/20 border-b border-violet-100/50 dark:border-violet-800/30 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2 h-2 rounded-full bg-violet-500 flex-shrink-0"></div>
                      <span className="text-xs font-semibold text-violet-700 dark:text-violet-400 uppercase tracking-wider">Humanized</span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                      {showHumanizeResult && humanizedResult && (
                        <>
                          <button
                            onClick={() => setShowHighlights(!showHighlights)}
                            className={`flex items-center gap-1 sm:gap-1.5 text-xs font-medium transition-all px-1.5 sm:px-2 py-1 rounded-lg ${
                              showHighlights ? 'bg-violet-100 dark:bg-violet-800/50 text-violet-700 dark:text-violet-300' : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700'
                            }`}
                          >
                            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                            </svg>
                            <span className="hidden sm:inline">Highlights</span>
                          </button>
                          <button
                            onClick={() => { navigator.clipboard.writeText(humanizedResult); setHumanizeCopied(true); setTimeout(() => setHumanizeCopied(false), 2000); trackCopy(); }}
                            className={`flex items-center gap-1 text-xs font-medium transition-all ${humanizeCopied ? 'text-green-600' : 'text-violet-600 hover:text-violet-700'}`}
                          >
                            {humanizeCopied ? (<> <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg> Copied! </>) : (<> <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> Copy All </>)}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-h-[240px] sm:min-h-[280px] md:min-h-[350px] max-h-[260px] sm:max-h-[280px] md:max-h-[350px] overflow-y-auto overflow-x-hidden min-w-0">
                    {showHumanizeResult && humanizedResult ? (
                      <div className="p-3 sm:p-5 text-stone-800 dark:text-stone-100 text-[15px] leading-relaxed break-words">
                        {showHighlights ? (
                          (() => {
                            // Build a Set of normalized original words for O(1) lookup
                            const normalize = (word: string) => word.toLowerCase().replace(/[^\w]/g, '');
                            const originalWordSet = new Set(inputText.split(/\s+/).filter(Boolean).map(normalize));
                            const humanizedTokens = humanizedResult.split(/(\s+)/);
                            
                            return humanizedTokens.map((token, idx) => {
                              if (/^\s+$/.test(token)) {
                                return <span key={idx}>{token}</span>;
                              }
                              const existsInOriginal = originalWordSet.has(normalize(token));
                              if (!existsInOriginal) {
                                return <span key={idx} className="bg-violet-100/80 dark:bg-violet-800/50 text-violet-900 dark:text-violet-200 underline decoration-violet-400/60 decoration-2 underline-offset-2 rounded-sm px-0.5">{token}</span>;
                              }
                              return <span key={idx}>{token}</span>;
                            });
                          })()
                        ) : (
                          humanizedResult
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-stone-400 dark:text-stone-500 p-5">
                        {isHumanizing ? (
                          <div className="flex flex-col items-center gap-4">
                            <div className="relative">
                              <div className="w-12 h-12 border-4 border-violet-200 dark:border-violet-800 rounded-full"></div>
                              <div className="absolute top-0 left-0 w-12 h-12 border-4 border-violet-600 rounded-full border-t-transparent animate-spin"></div>
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-medium text-stone-600 dark:text-stone-400">Humanizing your text...</p>
                              <p className="text-xs text-stone-500 dark:text-stone-500 mt-1">This usually takes 5-10 seconds</p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-violet-100/50 dark:bg-violet-900/30 flex items-center justify-center">
                              <svg className="w-8 h-8 text-violet-300 dark:text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </div>
                            <p className="text-sm text-stone-500 dark:text-stone-400">Your humanized text will appear here</p>
                            <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">Paste text on the left and click Humanize</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 bg-violet-50/30 dark:bg-violet-900/10 border-t border-violet-100/50 dark:border-violet-800/30">
                    <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">{showHumanizeResult ? `${humanizedResult.split(/\s+/).filter(Boolean).length} words` : ''}</span>
                    {showHumanizeResult && humanizedResult && (
                      <button onClick={() => { setShowHumanizeResult(false); setHumanizedResult(''); }} className="text-xs text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors">Clear result</button>
                    )}
                  </div>
                </div>
              </div>

              {/* Usage Bar */}
              <div className="px-3 sm:px-5 py-3 sm:py-4 bg-stone-50 dark:bg-stone-800/50 border-t border-stone-200 dark:border-stone-600">
                <div className="flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-6 gap-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-stone-500 dark:text-stone-400">Monthly usage:</span>
                    {humanizeWordLimit >= 999999 ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">{humanizeWordsUsed.toLocaleString()} words used</span>
                        <span className="px-2 py-0.5 bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-900/50 dark:to-purple-900/50 text-violet-700 dark:text-violet-300 text-[10px] font-bold rounded-full">UNLIMITED</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-1.5 bg-stone-200 dark:bg-stone-600 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${humanizeWordsUsed / humanizeWordLimit > 0.9 ? 'bg-red-500' : 'bg-gradient-to-r from-violet-500 to-purple-500'}`}
                            style={{ width: `${Math.min(100, (humanizeWordsUsed / humanizeWordLimit) * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">{humanizeWordsUsed.toLocaleString()} / {humanizeWordLimit.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                  {humanizeWordLimit < 999999 && (
                    <button onClick={() => onNavigate('pricing')} className="text-xs text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-semibold flex items-center gap-1 transition-colors">
                      Upgrade for unlimited
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                  )}
                </div>
              </div>
              </div>
            </div>

            {humanizeError && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-center">
                <p className="text-red-700 dark:text-red-400 text-sm font-medium">{humanizeError}</p>
                {humanizeWordLimit < 999999 && (
                  <>
                    <p className="text-red-600 dark:text-red-500 text-xs mt-1">{getResetsInText()}</p>
                    <button onClick={() => onNavigate('pricing')} className="mt-2 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors">
                      Upgrade for unlimited words/month
                    </button>
                  </>
                )}
              </div>
            )}
          </>
        )}

        {/* SUMMARIZE MODE */}
        {mode === 'summarize' && (
          <>
            {/* Plan info banner - Mobile optimized */}
            {!isPremiumUser && (
              <div className="mb-4 sm:mb-6 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 border border-teal-200 dark:border-teal-700/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
                <div className="flex items-start sm:items-center gap-2 sm:gap-3">
                  <span className="text-xl sm:text-2xl">📝</span>
                  <div className="min-w-0">
                    <p className="text-teal-800 dark:text-teal-200 font-medium text-xs sm:text-sm">
                      {usageStats.plan === 'free' ? `Free: 1,000 words/mo • ${getResetsInText()}` : 'Starter: 999,999 words/mo'}
                      {!isPremiumUser && ' • Bullet + Medium'}
                    </p>
                    <p className="text-teal-600 dark:text-teal-400 text-[10px] sm:text-xs mt-0.5 line-clamp-2">Upgrade for all styles, lengths & premium AI</p>
                  </div>
                </div>
                <button onClick={() => onNavigate('pricing')} className="w-full sm:w-auto px-3 sm:px-4 py-1.5 bg-teal-600 active:bg-teal-700 sm:hover:bg-teal-500 text-white text-xs font-semibold rounded-lg sm:rounded-xl transition-all flex-shrink-0">
                  Upgrade
                </button>
              </div>
            )}
            
            <div className="bg-white dark:bg-stone-800 rounded-2xl sm:rounded-3xl shadow-xl shadow-stone-100/50 dark:shadow-none border border-stone-200 dark:border-stone-600 overflow-hidden mb-6 min-w-0">
              {/* Toolbar */}
              <div className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 border-b border-stone-200 dark:border-stone-600 px-3 sm:px-5 py-3 sm:py-4">
                <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0 overflow-x-auto sm:overflow-visible">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                      <span className="text-xs font-medium text-stone-500 dark:text-stone-400 flex-shrink-0">Style:</span>
                      <div className="flex items-center bg-white dark:bg-stone-700 rounded-xl px-0.5 sm:px-1 py-1 shadow-sm border border-stone-200 dark:border-stone-600">
                        {(['bullet', 'paragraph', 'tldr', 'detailed'] as const).map((s) => {
                          const locked = !isPremiumUser && s !== 'bullet';
                          return (
                            <button
                              key={s}
                              onClick={() => !locked && setSummaryStyle(s)}
                              disabled={locked}
                              title={locked ? 'Premium only' : ''}
                              className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap relative ${
                                locked ? 'text-stone-400 dark:text-stone-500 cursor-not-allowed' :
                                summaryStyle === s ? 'bg-teal-600 text-white shadow-sm' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-600'
                              }`}
                            >
                              {s === 'bullet' ? 'Bullet' : s === 'paragraph' ? 'Paragraph' : s === 'tldr' ? 'TL;DR' : 'Detailed'}
                              {locked && <span className="ml-1 text-[9px]">🔒</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                      <span className="text-xs font-medium text-stone-500 dark:text-stone-400 flex-shrink-0">Length:</span>
                      <div className="flex items-center bg-white dark:bg-stone-700 rounded-xl px-0.5 sm:px-1 py-1 shadow-sm border border-stone-200 dark:border-stone-600">
                        {(['short', 'medium', 'long'] as const).map((l) => {
                          const locked = !isPremiumUser && l !== 'medium';
                          return (
                            <button
                              key={l}
                              onClick={() => !locked && setSummaryLength(l)}
                              disabled={locked}
                              title={locked ? 'Premium only' : ''}
                              className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                                locked ? 'text-stone-400 dark:text-stone-500 cursor-not-allowed' :
                                summaryLength === l ? 'bg-teal-600 text-white shadow-sm' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-600'
                              }`}
                            >
                              {l.charAt(0).toUpperCase() + l.slice(1)}
                              {locked && <span className="ml-1 text-[9px]">🔒</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleSubmit}
                    disabled={!isTextValid() || isSummarizing}
                    className={`w-full sm:w-auto px-6 py-2.5 rounded-xl flex items-center justify-center transition-all font-semibold text-sm flex-shrink-0 ${
                      isTextValid() && !isSummarizing
                        ? 'bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white shadow-lg shadow-teal-200/50 dark:shadow-teal-900/30 cursor-pointer'
                        : 'bg-stone-200 dark:bg-stone-600 text-stone-400 dark:text-stone-500 cursor-not-allowed'
                    }`}
                  >
                    {isSummarizing ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Summarizing...
                      </>
                    ) : (
                      <>✨ Summarize</>
                    )}
                  </button>
                </div>
              </div>

              {/* Editor Panels */}
              <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-stone-200 dark:divide-stone-600 min-w-0">
                {/* Left Panel */}
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 bg-stone-50 dark:bg-stone-800/50 border-b border-stone-200 dark:border-stone-600">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-stone-400 dark:bg-stone-500"></div>
                      <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Original</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input ref={parseFileInputRef} type="file" accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" onChange={handleParseDocument} className="hidden" />
                      <button onClick={() => parseFileInputRef.current?.click()} disabled={isParsingDoc} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 hover:bg-teal-200 dark:hover:bg-teal-800/50 font-semibold text-sm transition-colors disabled:opacity-50 border border-teal-200 dark:border-teal-700">
                        {isParsingDoc ? <span className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>}
                        {isParsingDoc ? 'Parsing...' : 'Upload Document'}
                      </button>
                      <button onClick={() => navigator.clipboard.readText().then(text => setInputText(text))} className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-stone-600 dark:text-stone-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/30 rounded-lg transition-colors">Paste</button>
                      <button onClick={() => setInputText('')} className={`flex items-center gap-1.5 px-2 py-1.5 text-xs text-stone-600 dark:text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors ${!inputText ? 'invisible' : ''}`}>Clear</button>
                    </div>
                  </div>
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={placeholders[placeholderIndex]}
                    disabled={isSummarizing}
                    className="w-full min-h-[280px] sm:min-h-[350px] p-3 sm:p-5 text-stone-800 dark:text-stone-100 text-[15px] border-none outline-none resize-none bg-transparent placeholder-stone-400 dark:placeholder-stone-500 leading-relaxed"
                  />
                  <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 bg-stone-50/50 dark:bg-stone-800/30 border-t border-stone-200 dark:border-stone-600">
                    <span className={`text-xs font-medium ${getWordCount(inputText) < 50 ? 'text-amber-600' : getWordCount(inputText) > humanizeSummarizeMaxWords ? 'text-red-600' : 'text-stone-500 dark:text-stone-400'}`}>
                      {getWordCount(inputText)} words / {humanizeSummarizeMaxWords.toLocaleString()} max
                      {getWordCount(inputText) < 50 && ' (min 50)'}
                      {getWordCount(inputText) > humanizeSummarizeMaxWords && isFreeUser && ' — Upgrade for 5,000'}
                    </span>
                  </div>
                </div>

                {/* Right Panel */}
                <div className="flex flex-col bg-gradient-to-br from-teal-50/30 to-cyan-50/30 dark:from-teal-900/10 dark:to-cyan-900/10 min-w-0">
                  <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 bg-teal-50/50 dark:bg-teal-900/20 border-b border-teal-100/50 dark:border-teal-800/30">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                      <span className="text-xs font-semibold text-teal-700 dark:text-teal-400 uppercase tracking-wider">Summary</span>
                      {summaryResult && (
                        <span className="px-2 py-0.5 bg-teal-100 dark:bg-teal-800/50 text-teal-700 dark:text-teal-300 text-[10px] font-bold rounded-full">
                          {Math.round((1 - summaryResult.summaryWordCount / summaryResult.originalWordCount) * 100)}% shorter
                        </span>
                      )}
                    </div>
                    {summaryResult && (
                      <button
                        onClick={() => { navigator.clipboard.writeText(summaryResult.summary); setSummaryCopied(true); setTimeout(() => setSummaryCopied(false), 2000); trackCopy(); }}
                        className={`text-xs font-medium ${summaryCopied ? 'text-teal-600' : 'text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300'}`}
                      >
                        {summaryCopied ? '✓ Copied!' : 'Copy'}
                      </button>
                    )}
                  </div>
                  <div className="flex-1 min-h-[280px] sm:min-h-[350px] max-h-[350px] overflow-y-auto">
                    {summaryResult ? (
                      <div className="p-3 sm:p-5 text-stone-800 dark:text-stone-100 text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                        {summaryResult.summary}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-stone-400 dark:text-stone-500 p-5">
                        {isSummarizing ? (
                          <div className="flex flex-col items-center gap-4">
                            <div className="relative">
                              <div className="w-12 h-12 border-4 border-teal-200 dark:border-teal-800 rounded-full"></div>
                              <div className="absolute top-0 left-0 w-12 h-12 border-4 border-teal-600 rounded-full border-t-transparent animate-spin"></div>
                            </div>
                            <p className="text-sm font-medium text-stone-600 dark:text-stone-400">Creating your summary...</p>
                          </div>
                        ) : (
                          <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-teal-100/50 dark:bg-teal-900/30 flex items-center justify-center text-3xl">📝</div>
                            <p className="text-sm text-stone-500 dark:text-stone-400">Your summary will appear here</p>
                            <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">Paste text on the left and click Summarize</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 bg-teal-50/30 dark:bg-teal-900/10 border-t border-teal-100/50 dark:border-teal-800/30">
                    <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">{summaryResult ? `${summaryResult.summaryWordCount} words` : ''}</span>
                    {summaryResult && (
                      <button onClick={() => setSummaryResult(null)} className="text-xs text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200">Clear</button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {summaryError && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-center">
                <p className="text-red-700 dark:text-red-400 text-sm font-medium">{summaryError}</p>
                {usageStats.plan === 'free' && (
                  <>
                    <p className="text-red-600 dark:text-red-500 text-xs mt-1">{getResetsInText()}</p>
                    <button onClick={() => onNavigate('pricing')} className="mt-2 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg">
                      Upgrade Plan
                    </button>
                  </>
                )}
              </div>
            )}
          </>
        )}

        {/* STUDY TOOLS MODE (Quiz / Flashcards / Crossword) */}
        {mode === 'quiz' && (
          <>
            {/* Study Tool Sub-Mode Tabs - Horizontally scrollable on mobile */}
            <div className="mb-6 sm:mb-8 -mx-3 sm:mx-0 px-3 sm:px-0">
              <div className="flex sm:flex-wrap sm:justify-center gap-2 sm:gap-3 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide snap-x snap-mandatory">
              {([
                { key: 'quiz' as const, label: 'Quiz', icon: '🎯', gradient: 'from-amber-50 to-orange-50', border: 'border-amber-200/70', active: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25' },
                { key: 'flashcards' as const, label: 'Flashcards', icon: '🃏', gradient: 'from-emerald-50 to-teal-50', border: 'border-emerald-200/70', active: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25' },
                { key: 'crossword' as const, label: 'Crossword', icon: '🧩', gradient: 'from-orange-50 to-amber-50', border: 'border-orange-200/70', active: 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25' },
                { key: 'crater_blast' as const, label: 'Crater Blast', icon: '🚀', gradient: 'from-violet-50 to-purple-50', border: 'border-violet-200/70', active: 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/25' },
              ]).map((tool) => (
                <button
                  key={tool.key}
                  onClick={() => { setStudyToolMode(tool.key); setQuizResult(null); setFlashcardResult(null); setCrosswordResult(null); setQuizError(''); setIsQuizMode(false); }}
                  className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 sm:gap-2 border flex-shrink-0 snap-start active:scale-95 ${
                    studyToolMode === tool.key
                      ? `${tool.active} border-transparent`
                      : `bg-white dark:bg-stone-800 ${tool.border} dark:border-stone-600 text-stone-600 dark:text-stone-400 sm:hover:shadow-md sm:hover:-translate-y-0.5`
                  }`}
                >
                  <span className="text-base sm:text-lg">{tool.icon}</span>
                  <span className="whitespace-nowrap">{tool.label}</span>
                </button>
              ))}
              </div>
            </div>

            {/* Exhausted generations banner for free users - Mobile optimized */}
            {quizExhausted && (
              <div className="mb-4 sm:mb-6 bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-700 dark:to-purple-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white text-center">
                <span className="text-3xl sm:text-4xl mb-2 sm:mb-3 block">🔒</span>
                <h3 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2">Monthly Limit Reached</h3>
                <p className="text-violet-100 dark:text-stone-200 mb-1 text-sm sm:text-base">You've used all 3 study tool generations this month. Upgrade for unlimited access!</p>
                <p className="text-violet-200/90 text-xs sm:text-sm mb-3 sm:mb-4">{getResetsInText()}</p>
                <button
                  onClick={() => onNavigate('pricing')}
                  className="w-full sm:w-auto px-5 sm:px-6 py-2 sm:py-2.5 bg-white dark:bg-stone-800 text-amber-700 dark:text-amber-400 font-semibold rounded-xl active:bg-stone-50 sm:hover:bg-stone-50 dark:sm:hover:bg-stone-700 transition-all inline-flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  👑 Upgrade Now
                </button>
              </div>
            )}

            {/* Plan info banner for free and starter users - Mobile optimized */}
            {!isPremiumUser && !quizExhausted && (
              <div className="mb-4 sm:mb-6 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border border-violet-200 dark:border-violet-800/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
                <div className="flex items-start sm:items-center gap-2 sm:gap-3">
                  <span className="text-xl sm:text-2xl">🧠</span>
                  <div className="min-w-0">
                    {isFreeUser ? (
                      <>
                        <p className="text-violet-800 dark:text-violet-200 font-medium text-xs sm:text-sm">
                          Free: {quizUsage.generationsRemaining}/{quizUsage.generationLimit} generations • {(quizUsage.maxWordsPerGeneration || 5000).toLocaleString()} words max • {getResetsInText()}
                        </p>
                        <p className="text-violet-600 dark:text-violet-400 text-[10px] sm:text-xs mt-0.5 line-clamp-2">Upgrade for unlimited quizzes, flashcards, crosswords</p>
                      </>
                    ) : (
                      <>
                        <p className="text-violet-800 dark:text-violet-200 font-medium text-xs sm:text-sm">Starter: Mixed type + Medium difficulty only</p>
                        <p className="text-violet-600 dark:text-violet-400 text-[10px] sm:text-xs mt-0.5">Upgrade for all quiz types & difficulties</p>
                      </>
                    )}
                  </div>
                </div>
                <button onClick={() => onNavigate('pricing')} className="w-full sm:w-auto px-3 sm:px-4 py-1.5 bg-violet-600 text-white text-xs font-semibold rounded-lg sm:rounded-xl active:bg-violet-700 sm:hover:bg-violet-500 transition-all flex-shrink-0">
                  Upgrade
                </button>
              </div>
            )}

            {/* ============ QUIZ SUB-MODE ============ */}
            {studyToolMode === 'quiz' && (
              <>
                {/* Quiz Taking View - Mobile optimized */}
                {quizResult && isQuizMode && (
                  <div className={`bg-white dark:bg-stone-800 rounded-2xl sm:rounded-3xl shadow-xl border border-gray-100 dark:border-stone-700 overflow-hidden mb-6 ${!canUseQuiz ? 'opacity-50 pointer-events-none' : ''}`}>
                    {quizCompleted ? (
                      <div className="p-5 sm:p-8 text-center">
                        <div className={`w-16 h-16 sm:w-24 sm:h-24 mx-auto rounded-full flex items-center justify-center mb-3 sm:mb-4 text-2xl sm:text-4xl ${userAnswers.filter(a => a.isCorrect).length / userAnswers.length >= 0.7 ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-amber-500 to-orange-600'}`}>🏆</div>
                        <h2 className="text-xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 mb-2">Quiz Complete!</h2>
                        <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent my-3 sm:my-4">
                          {Math.round((userAnswers.filter(a => a.isCorrect).length / userAnswers.length) * 100)}%
                        </div>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">{userAnswers.filter(a => a.isCorrect).length} out of {userAnswers.length} correct</p>
                        <div className="flex justify-center gap-2 mt-4 sm:mt-6 mb-3 sm:mb-4">
                          {isPaidUser ? (
                            <>
                              <button onClick={exportQuizToPDF} className="px-3 sm:px-4 py-1.5 sm:py-2 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-medium rounded-lg active:bg-red-100 sm:hover:bg-red-100 dark:sm:hover:bg-red-900/50 transition-colors flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                                <span className="hidden sm:inline">Download </span>PDF
                              </button>
                              <button onClick={exportQuizToDOCX} className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium rounded-lg active:bg-blue-100 sm:hover:bg-blue-100 dark:sm:hover:bg-blue-900/50 transition-colors flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                                <span className="hidden sm:inline">Download </span>DOCX
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => setShowExportUpgradeModal(true)} className="px-3 py-1.5 sm:py-2 bg-gray-100 dark:bg-stone-700 text-gray-400 dark:text-stone-500 font-medium rounded-lg transition-colors flex items-center gap-1.5 text-xs sm:text-sm cursor-pointer">
                                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                                PDF
                                <svg className="w-3 h-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                              </button>
                              <button onClick={() => setShowExportUpgradeModal(true)} className="px-3 py-1.5 sm:py-2 bg-gray-100 dark:bg-stone-700 text-gray-400 dark:text-stone-500 font-medium rounded-lg transition-colors flex items-center gap-1.5 text-xs sm:text-sm cursor-pointer">
                                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                                DOCX
                                <svg className="w-3 h-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                              </button>
                            </>
                          )}
                        </div>
                        <div className="flex flex-col-reverse sm:flex-row justify-center gap-2 sm:gap-3">
                          <button onClick={() => { setCurrentQuestion(0); setUserAnswers([]); setQuizCompleted(false); setSelectedAnswer(''); setShowQuizResult(false); }} className="px-5 sm:px-6 py-2.5 sm:py-3 bg-gray-100 dark:bg-stone-700 text-gray-700 dark:text-stone-300 font-semibold rounded-xl text-sm sm:text-base">Try Again</button>
                          <button onClick={() => { setQuizResult(null); setIsQuizMode(false); }} className="px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold rounded-xl text-sm sm:text-base">New Quiz</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="h-1.5 sm:h-2 bg-stone-200 dark:bg-stone-600"><div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300" style={{ width: `${((currentQuestion + 1) / quizResult.questions.length) * 100}%` }}></div></div>
                        <div className="p-4 sm:p-6">
                          <div className="flex justify-between items-center mb-3 sm:mb-4">
                            <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Q{currentQuestion + 1}/{quizResult.questions.length}</span>
                            <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold ${quizResult.questions[currentQuestion]?.type === 'multiple_choice' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' : quizResult.questions[currentQuestion]?.type === 'true_false' ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300' : 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'}`}>
                              {quizResult.questions[currentQuestion]?.type === 'multiple_choice' ? 'MCQ' : quizResult.questions[currentQuestion]?.type === 'true_false' ? 'T/F' : 'Fill'}
                            </span>
                          </div>
                          <h3 className="text-base sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 sm:mb-6 leading-relaxed">{quizResult.questions[currentQuestion]?.question}</h3>
                          <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                            {quizResult.questions[currentQuestion]?.type === 'multiple_choice' && quizResult.questions[currentQuestion]?.options?.map((opt: string, idx: number) => {
                              const letter = opt.charAt(0);
                              const isSelected = selectedAnswer === letter;
                              const isCorrect = showQuizResult && letter === quizResult.questions[currentQuestion].correctAnswer;
                              const isWrong = showQuizResult && isSelected && letter !== quizResult.questions[currentQuestion].correctAnswer;
                              return (
                                <button key={idx} onClick={() => !showQuizResult && setSelectedAnswer(letter)} disabled={showQuizResult}
                                  className={`w-full p-3 sm:p-4 rounded-xl border-2 text-left flex items-center gap-2.5 sm:gap-3 transition-all ${isCorrect ? 'border-green-500 bg-green-50 dark:bg-green-900/30' : isWrong ? 'border-red-500 bg-red-50 dark:bg-red-900/30' : isSelected ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30' : 'border-gray-200 dark:border-stone-600 active:border-amber-300 sm:hover:border-amber-300 dark:sm:hover:border-amber-600'}`}
                                >
                                  <span className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold flex-shrink-0 ${isCorrect ? 'bg-green-500 text-white' : isWrong ? 'bg-red-500 text-white' : isSelected ? 'bg-amber-500 text-stone-900' : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300'}`}>{letter}</span>
                                  <span className="text-sm sm:text-base text-stone-800 dark:text-stone-200">{opt.substring(3)}</span>
                                </button>
                              );
                            })}
                            {quizResult.questions[currentQuestion]?.type === 'true_false' && ['true', 'false'].map((opt) => {
                              const isSelected = selectedAnswer === opt;
                              const isCorrect = showQuizResult && opt === quizResult.questions[currentQuestion].correctAnswer;
                              const isWrong = showQuizResult && isSelected && opt !== quizResult.questions[currentQuestion].correctAnswer;
                              return (
                                <button key={opt} onClick={() => !showQuizResult && setSelectedAnswer(opt)} disabled={showQuizResult}
                                  className={`w-full p-3 sm:p-4 rounded-xl border-2 text-left flex items-center gap-2.5 sm:gap-3 transition-all ${isCorrect ? 'border-green-500 bg-green-50 dark:bg-green-900/30' : isWrong ? 'border-red-500 bg-red-50 dark:bg-red-900/30' : isSelected ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30' : 'border-gray-200 dark:border-stone-600 active:border-amber-300 sm:hover:border-amber-300 dark:sm:hover:border-amber-600'}`}
                                >
                                  <span className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isCorrect ? 'bg-green-500 text-white' : isWrong ? 'bg-red-500 text-white' : isSelected ? 'bg-amber-500 text-stone-900' : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300'}`}>{opt === 'true' ? '✓' : '✗'}</span>
                                  <span className="capitalize font-medium text-sm sm:text-base text-stone-800 dark:text-stone-200">{opt}</span>
                                </button>
                              );
                            })}
                            {quizResult.questions[currentQuestion]?.type === 'fill_blank' && quizResult.questions[currentQuestion]?.options?.map((opt: string, idx: number) => {
                              const letter = opt.charAt(0);
                              const isSelected = selectedAnswer === letter;
                              const isCorrect = showQuizResult && letter === quizResult.questions[currentQuestion].correctAnswer;
                              const isWrong = showQuizResult && isSelected && letter !== quizResult.questions[currentQuestion].correctAnswer;
                              return (
                                <button key={idx} onClick={() => !showQuizResult && setSelectedAnswer(letter)} disabled={showQuizResult}
                                  className={`w-full p-3 sm:p-4 rounded-xl border-2 text-left flex items-center gap-2.5 sm:gap-3 transition-all ${isCorrect ? 'border-green-500 bg-green-50 dark:bg-green-900/30' : isWrong ? 'border-red-500 bg-red-50 dark:bg-red-900/30' : isSelected ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30' : 'border-gray-200 dark:border-stone-600 active:border-amber-300 sm:hover:border-amber-300 dark:sm:hover:border-amber-600'}`}
                                >
                                  <span className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold flex-shrink-0 ${isCorrect ? 'bg-green-500 text-white' : isWrong ? 'bg-red-500 text-white' : isSelected ? 'bg-amber-500 text-stone-900' : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300'}`}>{letter}</span>
                                  <span className="text-sm sm:text-base text-stone-800 dark:text-stone-200">{opt.substring(3)}</span>
                                </button>
                              );
                            })}
                          </div>
                          {showQuizResult && quizResult.questions[currentQuestion]?.explanation && (
                            <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl mb-4 sm:mb-6 border border-blue-100 dark:border-blue-800/50">
                              <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">💡 {quizResult.questions[currentQuestion].explanation}</p>
                            </div>
                          )}
                          <div className="flex justify-between items-center gap-2">
                            <button onClick={() => { if (currentQuestion > 0) { setCurrentQuestion(currentQuestion - 1); setShowQuizResult(false); setSelectedAnswer(''); } }} disabled={currentQuestion === 0} className="px-3 sm:px-4 py-2 text-gray-600 dark:text-gray-400 disabled:opacity-30 text-sm sm:text-base">← <span className="hidden sm:inline">Previous</span></button>
                            {!showQuizResult ? (
                              <button onClick={() => {
                                const q = quizResult.questions[currentQuestion];
                                const ans = selectedAnswer;
                                const correct = ans === q.correctAnswer;
                                setUserAnswers([...userAnswers, { questionId: q.id, answer: ans, isCorrect: correct }]);
                                setShowQuizResult(true);
                              }} disabled={!selectedAnswer} className="px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold rounded-xl disabled:opacity-50 text-sm sm:text-base active:scale-95 transition-transform">Submit</button>
                            ) : (
                              <button onClick={() => {
                                if (currentQuestion + 1 >= quizResult.questions.length) { setQuizCompleted(true); }
                                else { setCurrentQuestion(currentQuestion + 1); setSelectedAnswer(''); setShowQuizResult(false); }
                              }} className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold rounded-xl text-sm sm:text-base active:scale-95 transition-transform">
                                {currentQuestion + 1 >= quizResult.questions.length ? '🏆 Results' : 'Next →'}
                              </button>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Quiz Input Form */}
                {!quizResult && (
                  <div className={`relative rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden mb-6 min-w-0 ${!canUseQuiz ? 'opacity-50 pointer-events-none' : ''}`}>
                    {/* Decorative shapes */}
                    <div className="absolute top-4 left-4 w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 opacity-20 rotate-12 pointer-events-none" />
                    <div className="absolute bottom-4 right-4 w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 opacity-10 pointer-events-none" />
                    <div className="absolute top-1/2 right-8 w-8 h-8 rounded-lg bg-amber-400/15 -rotate-12 hidden sm:block pointer-events-none" />
                    <div className="bg-white dark:bg-stone-800 rounded-2xl sm:rounded-3xl border border-amber-200/60 dark:border-amber-700/40 shadow-inner">
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-b border-amber-200/60 dark:border-amber-700/40 px-3 sm:px-5 py-3 sm:py-4">
                      <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0 overflow-x-auto sm:overflow-visible">
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                            <span className="text-xs font-medium text-stone-500 dark:text-stone-400 flex-shrink-0">Type:</span>
                            <div className="flex items-center bg-white dark:bg-stone-700 rounded-xl px-0.5 sm:px-1 py-1 shadow-sm border border-amber-200/60 dark:border-amber-700/40">
                              {(['mixed', 'multiple_choice', 'true_false', 'fill_blank'] as const).map((t) => {
                                const locked = !isPremiumUser && t !== 'mixed';
                                return (
                                  <button key={t} onClick={() => !locked && setQuizType(t)} disabled={locked} title={locked ? 'Premium only' : ''}
                                    className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                                      locked ? 'text-stone-400 cursor-not-allowed' :
                                      quizType === t ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-amber-50 dark:hover:bg-stone-600'
                                    }`}
                                  >
                                    {t === 'mixed' ? 'Mixed' : t === 'multiple_choice' ? 'MCQ' : t === 'true_false' ? 'T/F' : 'Fill'}
                                    {locked && <span className="ml-1 text-[9px]">🔒</span>}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                            <span className="text-xs font-medium text-stone-500 dark:text-stone-400">Difficulty:</span>
                            <div className="flex items-center bg-white dark:bg-stone-700 rounded-xl px-0.5 sm:px-1 py-1 shadow-sm border border-amber-200/60 dark:border-amber-700/40">
                              {(['easy', 'medium', 'hard'] as const).map((d) => {
                                const locked = !isPremiumUser && d !== 'medium';
                                return (
                                  <button key={d} onClick={() => !locked && setQuizDifficulty(d)} disabled={locked} title={locked ? 'Premium only' : ''}
                                    className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                                      locked ? 'text-stone-400 cursor-not-allowed' :
                                      quizDifficulty === d ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-amber-50 dark:hover:bg-stone-600'
                                    }`}
                                  >
                                    {d.charAt(0).toUpperCase() + d.slice(1)}
                                    {locked && <span className="ml-1 text-[9px]">🔒</span>}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className="text-xs font-medium text-gray-500">Questions:</span>
                            <select
                              value={isFreeUser ? 10 : quizQuestionCount}
                              onChange={(e) => !isFreeUser && setQuizQuestionCount(Number(e.target.value))}
                              disabled={isFreeUser}
                              className={`px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium ${isFreeUser ? 'opacity-50 cursor-not-allowed' : ''}`}
                              title={isFreeUser ? 'Free plan: 10 questions only' : ''}
                            >
                              {isFreeUser ? (
                                <option value={10}>10</option>
                              ) : (
                                [5, 10, 15, 20, 25].map(n => <option key={n} value={n}>{n}</option>)
                              )}
                            </select>
                            {isFreeUser && <span className="text-[9px]">🔒</span>}
                          </div>
                        </div>
                        <button
                          onClick={handleSubmit}
                          disabled={!isTextValid() || isGeneratingQuiz || !canUseQuiz}
                          className={`w-full sm:w-auto px-6 py-2.5 rounded-xl flex items-center justify-center transition-all font-semibold text-sm flex-shrink-0 ${
                            isTextValid() && !isGeneratingQuiz && canUseQuiz
                              ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg shadow-amber-200 cursor-pointer'
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {isGeneratingQuiz ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Generating...
                            </>
                          ) : (
                            <>✨ Generate Quiz</>
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 bg-gray-50/50 border-b border-stone-200 dark:border-stone-600">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Source Material</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setInputText('')} className={`text-xs text-gray-400 hover:text-gray-600 ${!inputText ? 'invisible' : ''}`}>Clear</button>
                          <button onClick={() => navigator.clipboard.readText().then(text => setInputText(text))} className="text-xs text-amber-600 hover:text-amber-700 font-medium">Paste</button>
                        </div>
                      </div>
                      <div className="relative">
                        {isGeneratingQuiz ? (
                          <div className="min-h-[350px] flex items-center justify-center">
                            <div className="flex flex-col items-center gap-4">
                              <div className="relative">
                                <div className="w-12 h-12 border-4 border-amber-200 dark:border-amber-700 rounded-full"></div>
                                <div className="absolute top-0 left-0 w-12 h-12 border-4 border-amber-500 rounded-full border-t-transparent animate-spin"></div>
                              </div>
                              <p className="text-sm font-medium text-stone-600 dark:text-stone-400">Creating quiz questions...</p>
                            </div>
                          </div>
                        ) : (
                          <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder={placeholders[placeholderIndex]}
                            className="w-full min-h-[300px] sm:min-h-[350px] p-3 sm:p-5 text-gray-800 text-[15px] border-none outline-none resize-none bg-transparent placeholder-gray-400 leading-relaxed"
                          />
                        )}
                      </div>
                      <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 bg-gray-50/30 border-t border-gray-100">
                        <span className={`text-xs font-medium ${
                          getWordCount(inputText) < 100 ? 'text-amber-600' :
                          (isFreeUser && getWordCount(inputText) > quizUsage.maxWordsPerGeneration) ? 'text-red-600' :
                          'text-gray-400'
                        }`}>
                          {getWordCount(inputText)} words
                          {getWordCount(inputText) < 100 && ' (min 100)'}
                          {isFreeUser && getWordCount(inputText) > quizUsage.maxWordsPerGeneration && ` (max ${quizUsage.maxWordsPerGeneration.toLocaleString()})`}
                          {isFreeUser && getWordCount(inputText) <= quizUsage.maxWordsPerGeneration && getWordCount(inputText) >= 100 && ` / ${quizUsage.maxWordsPerGeneration.toLocaleString()} max`}
                        </span>
                      </div>
                    </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ============ FLASHCARD SUB-MODE ============ */}
            {studyToolMode === 'flashcards' && (
              <>
                {/* Flashcard Interactive View with Customization */}
                {flashcardResult ? (
                  <div className="mb-4 sm:mb-6">
                    <FlashcardViewer
                      initialCards={flashcardResult.cards ?? []}
                      title={flashcardResult.title || 'Flashcards'}
                      onExportPDF={isPaidUser ? exportFlashcardsToPDF : undefined}
                      onExportDOCX={isPaidUser ? exportFlashcardsToDOCX : undefined}
                      onNewDeck={() => setFlashcardResult(null)}
                      canExport={isPaidUser}
                      onLoadPrevious={() => onNavigate('quiz-history')}
                      isCreateFromScratch={!flashcardResult.cards || flashcardResult.cards.length === 0}
                    />
                  </div>
                ) : (
                  /* Flashcard Input Form */
                  <div className={`relative rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden mb-6 min-w-0 ${!canUseQuiz ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="absolute top-4 right-4 w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 opacity-20 rotate-12 pointer-events-none" />
                    <div className="absolute bottom-4 left-4 w-16 h-16 rounded-full bg-emerald-400/10 pointer-events-none" />
                    <div className="bg-white dark:bg-stone-800 rounded-2xl sm:rounded-3xl border border-emerald-200/60 dark:border-emerald-700/40 shadow-inner">
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-b border-emerald-200/60 dark:border-emerald-700/40 px-3 sm:px-5 py-3 sm:py-4">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-gray-500">Cards:</span>
                            <select value={isFreeUser ? 15 : flashcardCount}
                              onChange={(e) => !isFreeUser && setFlashcardCount(Number(e.target.value))}
                              disabled={isFreeUser}
                              className={`px-2 py-1.5 bg-white dark:bg-stone-700 border border-emerald-200/60 dark:border-emerald-700/40 rounded-lg text-xs font-medium text-stone-700 dark:text-stone-300 ${isFreeUser ? 'opacity-50 cursor-not-allowed' : ''}`}>
                              {isFreeUser ? <option value={15}>15</option> : [5, 10, 15, 20, 25, 30].map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setFlashcardResult({ title: 'My Flashcards', cards: [] })}
                            className="px-4 py-2.5 rounded-xl flex items-center justify-center transition-all font-semibold text-sm bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 hover:bg-violet-200 dark:hover:bg-violet-900/50"
                          >
                            ✏️ Create from Scratch
                          </button>
                          <button
                            onClick={handleSubmit}
                            disabled={!isTextValid() || isGeneratingFlashcards || !canUseQuiz}
                            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl flex items-center justify-center transition-all font-semibold text-sm flex-shrink-0 ${
                              isTextValid() && !isGeneratingFlashcards && canUseQuiz
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/25 cursor-pointer'
                                : 'bg-stone-200 dark:bg-stone-600 text-stone-400 dark:text-stone-500 cursor-not-allowed'
                            }`}
                          >
                            {isGeneratingFlashcards ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Generating...
                              </>
                            ) : (
                              <>🃏 Generate with AI</>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 bg-emerald-50/50 dark:bg-emerald-900/10 border-b border-emerald-200/50 dark:border-emerald-700/30">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Source Material</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setInputText('')} className={`text-xs text-stone-400 hover:text-emerald-600 dark:hover:text-emerald-400 ${!inputText ? 'invisible' : ''}`}>Clear</button>
                          <button onClick={() => navigator.clipboard.readText().then(text => setInputText(text))} className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium">Paste</button>
                        </div>
                      </div>
                      <div className="relative">
                        {isGeneratingFlashcards ? (
                          <div className="min-h-[350px] flex items-center justify-center">
                            <div className="flex flex-col items-center gap-4">
                              <div className="relative">
                                <div className="w-12 h-12 border-4 border-emerald-200 dark:border-emerald-700 rounded-full"></div>
                                <div className="absolute top-0 left-0 w-12 h-12 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin"></div>
                              </div>
                              <p className="text-sm font-medium text-stone-600 dark:text-stone-400">Creating your flashcard deck...</p>
                            </div>
                          </div>
                        ) : (
                          <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Paste your study notes, textbook content, or any material to turn into flashcards..."
                            className="w-full min-h-[300px] sm:min-h-[350px] p-3 sm:p-5 text-stone-800 dark:text-stone-100 text-[15px] border-none outline-none resize-none bg-transparent placeholder-stone-400 dark:placeholder-stone-500 leading-relaxed"
                          />
                        )}
                      </div>
                      <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 bg-emerald-50/30 dark:bg-emerald-900/5 border-t border-emerald-200/50 dark:border-emerald-700/30">
                        <span className={`text-xs font-medium ${
                          getWordCount(inputText) < 50 ? 'text-emerald-600' :
                          (isFreeUser && getWordCount(inputText) > quizUsage.maxWordsPerGeneration) ? 'text-red-600' :
                          'text-stone-400 dark:text-stone-500'
                        }`}>
                          {getWordCount(inputText)} words
                          {getWordCount(inputText) < 50 && ' (min 50)'}
                          {isFreeUser && getWordCount(inputText) > quizUsage.maxWordsPerGeneration && ` (max ${quizUsage.maxWordsPerGeneration.toLocaleString()})`}
                        </span>
                      </div>
                    </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ============ CROSSWORD SUB-MODE ============ */}
            {studyToolMode === 'crossword' && (
              <>
                {/* Crossword Interactive View */}
                {crosswordResult && crosswordResult.placedWords?.length > 0 ? (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                      <h3 className="text-lg font-bold text-gray-900">{crosswordResult.title}</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        {isPaidUser ? (
                          <>
                            <button onClick={exportCrosswordToPDF} className="px-3 py-1.5 bg-red-50 text-red-700 font-medium rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1.5 text-xs">
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                              PDF
                            </button>
                            <button onClick={exportCrosswordToDOCX} className="px-3 py-1.5 bg-blue-50 text-blue-700 font-medium rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1.5 text-xs">
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                              DOCX
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => setShowExportUpgradeModal(true)} className="px-3 py-1.5 bg-gray-100 text-gray-400 font-medium rounded-lg flex items-center gap-1.5 text-xs cursor-pointer">
                              <svg className="w-3 h-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/></svg>
                              PDF
                            </button>
                            <button onClick={() => setShowExportUpgradeModal(true)} className="px-3 py-1.5 bg-gray-100 text-gray-400 font-medium rounded-lg flex items-center gap-1.5 text-xs cursor-pointer">
                              <svg className="w-3 h-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/></svg>
                              DOCX
                            </button>
                          </>
                        )}
                        {!crosswordChecked && (
                          <>
                            <button
                              onClick={handleCrosswordHint}
                              className="px-4 py-2 text-sm font-medium bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors flex items-center gap-1.5"
                              title="Reveal one letter from the selected word"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                              Hint {hintsUsed > 0 && <span className="text-xs bg-purple-200 text-purple-800 rounded-full px-1.5 py-0.5 font-bold">{hintsUsed}</span>}
                            </button>
                            <button onClick={() => setCrosswordChecked(true)}
                              className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700">
                              Check Answers
                            </button>
                          </>
                        )}
                        <button onClick={() => { setCrosswordResult(null); setCrosswordAnswers({}); setCrosswordChecked(false); setSelectedClue(null); setSelectedCell(null); setSelectedDirection('across'); setHintsUsed(0); }}
                          className="px-4 py-2 text-sm text-amber-700 bg-amber-50 rounded-lg hover:bg-lime-100 dark:hover:bg-lime-800/50 font-medium">
                          New Puzzle
                        </button>
                      </div>
                    </div>

                    {crosswordChecked && (() => {
                      // Only count words that were attempted (have some answer)
                      const attemptedWords = crosswordResult.placedWords.filter((pw: any) => 
                        (crosswordAnswers[`word-${pw.number}`] || '').length > 0
                      );
                      const total = attemptedWords.length;
                      const correct = attemptedWords.filter((pw: any) => {
                        const ans = (crosswordAnswers[`word-${pw.number}`] || '').toUpperCase();
                        return ans === pw.word;
                      }).length;
                      const notAttempted = crosswordResult.placedWords.length - total;
                      
                      return (
                        <div className={`mb-4 p-4 rounded-2xl text-center ${total === 0 ? 'bg-gray-50 border border-gray-200' : correct === total ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-lime-200 dark:border-lime-700'}`}>
                          <span className="text-3xl mb-1 block">{total === 0 ? '✏️' : correct === total ? '🎉' : '📊'}</span>
                          {total === 0 ? (
                            <>
                              <p className="font-bold text-lg">No answers submitted</p>
                              <p className="text-sm text-gray-600">Type in some answers and try again!</p>
                            </>
                          ) : (
                            <>
                              <p className="font-bold text-lg">{correct} / {total} correct</p>
                              <p className="text-sm text-gray-600">
                                {correct === total ? 'Perfect score on attempted words!' : 'Check the highlighted answers below.'}
                                {notAttempted > 0 && ` (${notAttempted} word${notAttempted > 1 ? 's' : ''} not attempted)`}
                              </p>
                            </>
                          )}
                        </div>
                      );
                    })()}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Crossword Grid - Now Interactive */}
                      <div 
                        className="bg-white rounded-2xl border border-gray-200 p-4 overflow-x-auto focus:outline-none focus:ring-2 focus:ring-violet-400"
                        tabIndex={0}
                        onKeyDown={handleCrosswordKeyDown}
                      >
                        <p className="text-xs text-gray-500 mb-3">Click a cell to type, or use the clue inputs below. Arrow keys to navigate.</p>
                        <div className="inline-block">
                          {crosswordResult.grid?.map((row: string[], rowIdx: number) => (
                            <div key={rowIdx} className="flex">
                              {row.map((cell: string, colIdx: number) => {
                                if (cell === '') {
                                  return <div key={colIdx} className="w-8 h-8 sm:w-9 sm:h-9"></div>;
                                }
                                const wordAtCell = crosswordResult.placedWords.find((pw: any) => pw.row === rowIdx && pw.col === colIdx);
                                const cellNumber = wordAtCell?.number;
                                const typedLetter = getCellLetter(rowIdx, colIdx);
                                const isSelectedCell = selectedCell?.row === rowIdx && selectedCell?.col === colIdx;
                                
                                let isHighlighted = false;
                                if (selectedClue !== null) {
                                  const sel = crosswordResult.placedWords.find((pw: any) => pw.number === selectedClue);
                                  if (sel) {
                                    if (sel.direction === 'across' && rowIdx === sel.row && colIdx >= sel.col && colIdx < sel.col + sel.length) isHighlighted = true;
                                    if (sel.direction === 'down' && colIdx === sel.col && rowIdx >= sel.row && rowIdx < sel.row + sel.length) isHighlighted = true;
                                  }
                                }
                                
                                let cellColor = 'bg-white border-gray-300 hover:border-amber-300';
                                if (isSelectedCell) cellColor = 'bg-amber-200 border-amber-500 ring-2 ring-amber-400';
                                else if (isHighlighted) cellColor = 'bg-amber-50 border-amber-400';
                                
                                if (crosswordChecked) {
                                  const wordsThrough = crosswordResult.placedWords.filter((pw: any) => {
                                    if (pw.direction === 'across') return rowIdx === pw.row && colIdx >= pw.col && colIdx < pw.col + pw.length;
                                    return colIdx === pw.col && rowIdx >= pw.row && rowIdx < pw.row + pw.length;
                                  });
                                  // Only check words that have been attempted (have some answer)
                                  const attemptedWords = wordsThrough.filter((pw: any) => (crosswordAnswers[`word-${pw.number}`] || '').length > 0);
                                  const anyCorrect = attemptedWords.some((pw: any) => (crosswordAnswers[`word-${pw.number}`] || '').toUpperCase() === pw.word);
                                  const anyWrong = attemptedWords.some((pw: any) => {
                                    const ans = (crosswordAnswers[`word-${pw.number}`] || '').toUpperCase();
                                    return ans !== pw.word;
                                  });
                                  if (attemptedWords.length > 0) {
                                    if (anyCorrect && !anyWrong) cellColor = 'bg-green-50 border-green-400';
                                    else if (anyWrong) cellColor = 'bg-red-50 border-red-400';
                                  }
                                }
                                return (
                                  <div 
                                    key={colIdx} 
                                    onClick={() => handleCellClick(rowIdx, colIdx)}
                                    className={`w-8 h-8 sm:w-9 sm:h-9 border ${cellColor} flex items-center justify-center relative cursor-pointer transition-colors`}
                                  >
                                    {cellNumber && <span className="absolute top-0 left-0.5 text-[8px] font-bold text-gray-500 leading-none">{cellNumber}</span>}
                                    {/* Show typed letter or revealed answer */}
                                    <span className="text-xs sm:text-sm font-bold text-gray-700">
                                      {crosswordChecked ? cell : typedLetter}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Clues List */}
                      <div className="space-y-4">
                        {['across', 'down'].map(dir => {
                          const words = crosswordResult.placedWords.filter((pw: any) => pw.direction === dir).sort((a: any, b: any) => a.number - b.number);
                          if (words.length === 0) return null;
                          return (
                            <div key={dir}>
                              <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">{dir === 'across' ? 'Across →' : 'Down ↓'}</h4>
                              <div className="space-y-2">
                                {words.map((pw: any) => {
                                  const answerKey = `word-${pw.number}`;
                                  const hasAnswer = (crosswordAnswers[answerKey] || '').length > 0;
                                  const isCorrect = crosswordChecked && hasAnswer && (crosswordAnswers[answerKey] || '').toUpperCase() === pw.word;
                                  const isWrong = crosswordChecked && hasAnswer && (crosswordAnswers[answerKey] || '').toUpperCase() !== pw.word;
                                  const isNotAttempted = crosswordChecked && !hasAnswer;
                                  return (
                                    <div key={pw.number}
                                      onClick={() => {
                                        const newSelected = selectedClue === pw.number ? null : pw.number;
                                        setSelectedClue(newSelected);
                                        if (newSelected !== null) {
                                          setSelectedCell({ row: pw.row, col: pw.col });
                                          setSelectedDirection(pw.direction);
                                        } else {
                                          setSelectedCell(null);
                                        }
                                      }}
                                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                                        selectedClue === pw.number ? 'border-violet-400 dark:border-violet-600 bg-violet-50 dark:bg-violet-900/30 shadow-sm' :
                                        isCorrect ? 'border-green-300 bg-green-50' :
                                        isWrong ? 'border-red-300 bg-red-50' :
                                        isNotAttempted ? 'border-gray-200 bg-gray-50 opacity-60' :
                                        'border-gray-200 hover:border-gray-300 bg-white'
                                      }`}>
                                      <div className="flex items-start gap-2 mb-2">
                                        <span className="text-xs font-bold text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/50 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">{pw.number}</span>
                                        <p className="text-sm text-gray-700">{pw.clue} <span className="text-gray-400">({pw.word.length} letters)</span></p>
                                      </div>
                                      <input
                                        type="text"
                                        maxLength={pw.word.length}
                                        value={crosswordAnswers[answerKey] || ''}
                                        onChange={(e) => {
                                          const newValue = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
                                          setCrosswordAnswers({ ...crosswordAnswers, [answerKey]: newValue });
                                          // Sync cell selection to this word
                                          setSelectedClue(pw.number);
                                          setSelectedDirection(pw.direction);
                                          // Move cursor to end of typed word
                                          const cellOffset = Math.min(newValue.length, pw.word.length - 1);
                                          if (pw.direction === 'across') {
                                            setSelectedCell({ row: pw.row, col: pw.col + cellOffset });
                                          } else {
                                            setSelectedCell({ row: pw.row + cellOffset, col: pw.col });
                                          }
                                        }}
                                        onFocus={() => {
                                          setSelectedClue(pw.number);
                                          setSelectedDirection(pw.direction);
                                          setSelectedCell({ row: pw.row, col: pw.col });
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        disabled={crosswordChecked}
                                        placeholder={'_'.repeat(pw.word.length)}
                                        className={`w-full px-3 py-2 border rounded-lg text-sm font-mono tracking-[0.3em] uppercase ${
                                          isCorrect ? 'border-green-400 bg-green-50 text-green-700' :
                                          isWrong ? 'border-red-400 bg-red-50 text-red-700' :
                                          'border-gray-200 bg-gray-50 text-gray-800'
                                        } ${crosswordChecked ? 'cursor-not-allowed' : ''}`}
                                      />
                                      {isWrong && crosswordChecked && (
                                        <p className="text-xs text-red-500 mt-1">Answer: <span className="font-mono font-bold">{pw.word}</span></p>
                                      )}
                                      {isNotAttempted && (
                                        <p className="text-xs text-gray-400 mt-1 italic">Not attempted</p>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Crossword Input Form */
                  <div className={`relative rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden mb-6 min-w-0 ${!canUseQuiz ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="absolute top-4 left-4 w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 opacity-20 rotate-12 pointer-events-none" />
                    <div className="absolute bottom-4 right-4 w-16 h-16 rounded-full bg-orange-400/10 pointer-events-none" />
                    <div className="bg-white dark:bg-stone-800 rounded-2xl sm:rounded-3xl border border-orange-200/60 dark:border-orange-700/40 shadow-inner">
                    <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-b border-orange-200/60 dark:border-orange-700/40 px-3 sm:px-5 py-3 sm:py-4">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-stone-500 dark:text-stone-400">Words:</span>
                            <select value={isFreeUser ? 10 : crosswordWordCount}
                              onChange={(e) => !isFreeUser && setCrosswordWordCount(Number(e.target.value))}
                              disabled={isFreeUser}
                              className={`px-2 py-1.5 bg-white dark:bg-stone-700 border border-orange-200/60 dark:border-orange-700/40 rounded-lg text-xs font-medium text-stone-700 dark:text-stone-300 ${isFreeUser ? 'opacity-50 cursor-not-allowed' : ''}`}>
                              {isFreeUser ? <option value={10}>10</option> : [6, 8, 10, 12, 15].map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                          </div>
                        </div>
                        <button
                          onClick={handleSubmit}
                          disabled={!isTextValid() || isGeneratingCrossword || !canUseQuiz}
                          className={`w-full sm:w-auto px-6 py-2.5 rounded-xl flex items-center justify-center transition-all font-semibold text-sm flex-shrink-0 ${
                            isTextValid() && !isGeneratingCrossword && canUseQuiz
                              ? 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white shadow-lg shadow-orange-500/25 cursor-pointer'
                              : 'bg-stone-200 dark:bg-stone-600 text-stone-400 dark:text-stone-500 cursor-not-allowed'
                          }`}
                        >
                          {isGeneratingCrossword ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Generating...
                            </>
                          ) : (
                            <>🧩 Generate Crossword</>
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 bg-orange-50/50 dark:bg-orange-900/10 border-b border-orange-200/50 dark:border-orange-700/30">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                          <span className="text-xs font-semibold text-orange-700 dark:text-orange-400 uppercase tracking-wider">Source Material</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setInputText('')} className={`text-xs text-stone-400 hover:text-orange-600 dark:hover:text-orange-400 ${!inputText ? 'invisible' : ''}`}>Clear</button>
                          <button onClick={() => navigator.clipboard.readText().then(text => setInputText(text))} className="text-xs text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium">Paste</button>
                        </div>
                      </div>
                      <div className="relative">
                        {isGeneratingCrossword ? (
                          <div className="min-h-[350px] flex items-center justify-center">
                            <div className="flex flex-col items-center gap-4">
                              <div className="relative">
                                <div className="w-12 h-12 border-4 border-orange-200 dark:border-orange-700 rounded-full"></div>
                                <div className="absolute top-0 left-0 w-12 h-12 border-4 border-orange-500 rounded-full border-t-transparent animate-spin"></div>
                              </div>
                              <p className="text-sm font-medium text-stone-600 dark:text-stone-400">Building your crossword puzzle...</p>
                            </div>
                          </div>
                        ) : (
                          <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Paste your study notes or textbook content — key terms will be extracted for the crossword puzzle..."
                            className="w-full min-h-[300px] sm:min-h-[350px] p-3 sm:p-5 text-stone-800 dark:text-stone-100 text-[15px] border-none outline-none resize-none bg-transparent placeholder-stone-400 dark:placeholder-stone-500 leading-relaxed"
                          />
                        )}
                      </div>
                      <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 bg-orange-50/30 dark:bg-orange-900/5 border-t border-orange-200/50 dark:border-orange-700/30">
                        <span className={`text-xs font-medium ${
                          getWordCount(inputText) < 50 ? 'text-orange-600' :
                          (isFreeUser && getWordCount(inputText) > quizUsage.maxWordsPerGeneration) ? 'text-red-600' :
                          'text-stone-400 dark:text-stone-500'
                        }`}>
                          {getWordCount(inputText)} words
                          {getWordCount(inputText) < 50 && ' (min 50)'}
                          {isFreeUser && getWordCount(inputText) > quizUsage.maxWordsPerGeneration && ` (max ${quizUsage.maxWordsPerGeneration.toLocaleString()})`}
                        </span>
                      </div>
                    </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ============ CRATER BLAST SUB-MODE ============ */}
            {studyToolMode === 'crater_blast' && (
              <div className="bg-white dark:bg-stone-800 rounded-2xl sm:rounded-3xl shadow-xl border border-violet-200/50 dark:border-violet-800/30 overflow-hidden mb-6">
                <div className="p-8 sm:p-10 text-center relative overflow-hidden">
                  <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-violet-500/20 blur-2xl" />
                  <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-lg bg-purple-500/10 rotate-12" />
                  <div className="relative z-10 inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 bg-gradient-to-br from-violet-600 to-purple-700 shadow-lg shadow-violet-500/30">
                    <span className="text-3xl">💥</span>
                  </div>
                  <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-2">Crater Blast</h3>
                  <p className="text-stone-600 dark:text-stone-400 text-sm max-w-md mx-auto mb-6">
                    AI-generated quiz craters fall from the sky. Aim your cannon and blast the correct answer before it lands. Build streaks and test your reflexes!
                  </p>
                  <button
                    onClick={() => onNavigate('crater-blast')}
                    className="px-6 py-3 rounded-xl font-semibold text-white transition-all hover:shadow-lg bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 shadow-violet-500/25"
                  >
                    Play Crater Blast →
                  </button>
                </div>
              </div>
            )}

            {quizError && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-center">
                <p className="text-red-700 dark:text-red-400 text-sm font-medium">{quizError}</p>
                {(quizExhausted || quizError.includes('Upgrade')) && (
                  <>
                    <p className="text-red-600 dark:text-red-500 text-xs mt-1">{getResetsInText()}</p>
                    <button onClick={() => onNavigate('pricing')} className="mt-2 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg">
                      View Plans
                    </button>
                  </>
                )}
              </div>
            )}
          </>
        )}

        {/* End of month urgency warning for free users */}
        {isFreeUser && isEndOfMonthUrgency() && recentActivity.length > 0 && (
          <div className={`mt-8 sm:mt-10 p-4 rounded-xl border ${getDaysUntilReset() <= 3 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'}`}>
            <div className="flex items-start sm:items-center gap-3">
              <span className="text-xl flex-shrink-0">{getDaysUntilReset() <= 3 ? '⚠️' : '⏰'}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${getDaysUntilReset() <= 3 ? 'text-red-800 dark:text-red-200' : 'text-amber-800 dark:text-amber-200'}`}>
                  {getEndOfMonthUrgencyText()}
                </p>
              </div>
              <button
                onClick={() => onNavigate('pricing')}
                className={`flex-shrink-0 px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors ${getDaysUntilReset() <= 3 ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-amber-600 hover:bg-amber-700 text-white'}`}
              >
                Upgrade Now
              </button>
            </div>
          </div>
        )}

        {/* Recent Activity - Mobile optimized with horizontal scroll */}
        <div className={isFreeUser && isEndOfMonthUrgency() && recentActivity.length > 0 ? 'mt-4' : 'mt-8 sm:mt-10'}>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-bold text-stone-800 dark:text-stone-100 flex items-center gap-2">
              <span className="text-lg sm:text-xl">📂</span> Recents
            </h2>
            {recentActivity.length > 0 && (
              <div className="flex items-center gap-2 sm:gap-3">
                {recentActivity.some(a => a.type === 'document' || a.type === 'analysis') && (
                  <button onClick={() => onNavigate('library')} className="text-xs sm:text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-semibold transition-colors px-2 py-1 rounded-lg active:bg-violet-50 dark:active:bg-violet-900/30">
                    Library
                  </button>
                )}
                {recentActivity.some(a => a.type === 'quiz' || a.type === 'flashcard' || a.type === 'crossword') && (
                  <button onClick={() => onNavigate('quiz-history')} className="text-xs sm:text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-semibold transition-colors px-2 py-1 rounded-lg active:bg-violet-50 dark:active:bg-violet-900/30">
                    History
                  </button>
                )}
              </div>
            )}
          </div>
          
          {(isLoading || isActivityLoading) ? (
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-5 sm:gap-4 scrollbar-hide">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-stone-800 border border-stone-200/50 dark:border-stone-700/30 rounded-xl sm:rounded-2xl p-3 sm:p-4 animate-pulse flex-shrink-0 w-[160px] sm:w-auto">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-stone-200 dark:bg-stone-700 rounded-lg sm:rounded-xl flex-shrink-0" />
                    <div className="h-4 sm:h-5 bg-stone-200 dark:bg-stone-700 rounded-lg w-12 sm:w-16" />
                  </div>
                  <div className="h-3.5 sm:h-4 bg-stone-200 dark:bg-stone-700 rounded-lg w-full mb-1.5 sm:mb-2" />
                  <div className="h-2.5 sm:h-3 bg-stone-100 dark:bg-stone-700/60 rounded-lg w-2/3" />
                </div>
              ))}
            </div>
          ) : filteredActivity.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-5 sm:gap-4 scrollbar-hide snap-x snap-mandatory">
              {filteredActivity.slice(0, 7).map((activity) => {
                const meta = activityMeta[activity.type];
                return (
                  <div 
                    key={activity.id}
                    className={`relative overflow-hidden rounded-xl sm:rounded-2xl p-3 sm:p-4 border ${meta.border} bg-gradient-to-br ${meta.cardBg} sm:hover:shadow-xl sm:hover:-translate-y-1 active:scale-[0.98] transition-all duration-200 cursor-pointer group flex-shrink-0 w-[160px] sm:w-auto snap-start`}
                    onClick={() => handleActivityClick(activity)}
                  >
                    {/* Decorative shapes - hidden on mobile for cleaner look */}
                    <div className="hidden sm:block">
                      {meta.shape === 'circle' && (
                        <>
                          <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-white/40 dark:bg-black/10 blur-sm group-hover:scale-110 transition-transform" />
                          <div className="absolute bottom-2 left-2 w-6 h-6 rounded-full bg-white/30 dark:bg-black/10" />
                        </>
                      )}
                      {meta.shape === 'square' && (
                        <>
                          <div className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-white/30 dark:bg-black/10 rotate-12 group-hover:rotate-0 transition-transform" />
                          <div className="absolute -bottom-2 -left-2 w-10 h-10 rounded-lg bg-white/20 dark:bg-black/5 -rotate-6" />
                        </>
                      )}
                      {meta.shape === 'diamond' && (
                        <>
                          <div className="absolute top-1 right-1 w-4 h-4 bg-white/40 dark:bg-black/10 rotate-45" />
                          <div className="absolute bottom-3 right-3 w-6 h-6 bg-white/30 dark:bg-black/10 rotate-45" />
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 relative z-10">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 ${meta.bg} rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 sm:group-hover:scale-110 transition-transform shadow-sm`}>
                        <span className="text-base sm:text-lg">{meta.emoji}</span>
                      </div>
                      <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 ${meta.bg} text-[9px] sm:text-[10px] font-bold rounded-md sm:rounded-lg uppercase tracking-wide ${meta.accent}`}>{meta.label}</span>
                    </div>
                    <h3 className="font-semibold text-stone-800 dark:text-stone-100 text-xs sm:text-sm truncate sm:group-hover:opacity-90 transition-opacity mb-0.5 sm:mb-1 relative z-10">{activity.title}</h3>
                    <p className="text-[10px] sm:text-xs text-stone-500 dark:text-stone-400 truncate relative z-10">{activity.subtitle}</p>
                    <span className="text-[9px] sm:text-[10px] font-medium text-stone-400 dark:text-stone-500 mt-1.5 sm:mt-2 block relative z-10">{relativeTime(activity.date)}</span>
                  </div>
                );
              })}
            </div>
          ) : searchQuery.trim() ? (
            <div className="text-center py-8 sm:py-10 bg-white dark:bg-stone-800 rounded-xl sm:rounded-2xl border border-stone-200/60 dark:border-stone-700/40">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-stone-100 dark:bg-stone-700 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-stone-400 dark:text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <p className="text-stone-600 dark:text-stone-300 font-semibold mb-1 text-sm sm:text-base">No results for "{searchQuery}"</p>
              <p className="text-stone-400 dark:text-stone-500 text-xs sm:text-sm">Try a different search term</p>
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12 bg-white dark:bg-stone-800 rounded-xl sm:rounded-2xl border border-stone-200/60 dark:border-stone-700/40">
              {/* Simple mobile-friendly empty state */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl sm:text-4xl">📚</span>
              </div>
              <p className="text-stone-800 dark:text-stone-200 font-semibold text-base sm:text-lg mb-1">No recent activity</p>
              <p className="text-stone-400 dark:text-stone-500 text-xs sm:text-sm mb-5 sm:mb-6 max-w-[240px] sm:max-w-xs mx-auto px-4">Upload a document or use a tool to get started</p>
              <button 
                onClick={() => onNavigate('upload')} 
                className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 active:from-violet-600 active:to-purple-700 sm:hover:from-violet-400 sm:hover:to-purple-500 text-white font-semibold rounded-xl transition-all shadow-md shadow-violet-500/20 active:scale-95 sm:hover:shadow-lg sm:hover:scale-105 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                Upload Document
              </button>
            </div>
          )}
        </div>
        </div>
        </div>

        {/* Mobile Schedule / Calendar - above footer */}
        <div className="lg:hidden px-3 sm:px-6 pb-6">
          <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-lg shadow-stone-200/50 dark:shadow-stone-900/50 border border-stone-200/60 dark:border-stone-600/40 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-stone-800 dark:text-stone-100 flex items-center gap-2 text-sm">
                <span className="text-lg">📅</span> Schedule
              </h3>
              <button onClick={openAddModal} className="text-stone-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors p-1 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-900/30">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              </button>
            </div>
            <div className="mb-4 bg-white/60 dark:bg-stone-800/60 backdrop-blur-sm rounded-xl p-3 border border-violet-200/50 dark:border-violet-800/30">
              <div className="flex items-center justify-between mb-2 text-xs font-medium text-stone-600 dark:text-stone-400">
                <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))} className="p-1.5 hover:bg-violet-100 dark:hover:bg-violet-900/30 rounded-lg transition-colors text-violet-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <span className="font-bold text-stone-800 dark:text-stone-100 text-sm">{calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))} className="p-1.5 hover:bg-violet-100 dark:hover:bg-violet-900/30 rounded-lg transition-colors text-violet-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
              <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] mb-1.5 text-violet-500 dark:text-violet-400 font-bold">
                <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
              </div>
              <div className="grid grid-cols-7 gap-0.5 text-center text-xs">
                {getCalendarDays().map((d, i) => {
                  const events = getEventsForDate(d.date);
                  const today = isToday(d.date);
                  return (
                    <div key={i} className={`p-1 relative cursor-pointer rounded-lg transition-all ${!d.isCurrentMonth ? 'text-stone-300 dark:text-stone-600' : today ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white font-bold shadow-lg shadow-violet-500/30 scale-110' : 'text-stone-700 dark:text-stone-300 hover:bg-violet-100 dark:hover:bg-violet-900/30 hover:text-violet-700'}`}>
                      {d.day}
                      {events.length > 0 && !today && <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${eventTypeColors[events[0].event_type]?.dot || 'bg-violet-400'}`}></span>}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Upcoming</h4>
              {loadingEvents ? <div className="text-center py-3 text-stone-400 text-xs">Loading...</div> : getUpcomingEvents().length === 0 ? <div className="text-center py-3 text-stone-400 text-xs">No upcoming events</div> : getUpcomingEvents().slice(0, 3).map(event => {
                const colors = eventTypeColors[event.event_type] || eventTypeColors.other;
                const eventDate = new Date(toDateStr(event.event_date) + 'T00:00:00');
                return (
                  <div key={event.id} className={`flex gap-2 p-2 rounded-xl ${colors.bg} dark:bg-opacity-50 border ${colors.border}`}>
                    <div className={`flex flex-col items-center justify-center w-8 h-8 bg-white rounded-lg shadow-sm ${colors.text} flex-shrink-0`}>
                      <span className="text-[8px] font-bold uppercase leading-none">{eventDate.toLocaleDateString('en-US', { month: 'short' })}</span>
                      <span className="text-xs font-bold leading-none">{eventDate.getDate()}</span>
                    </div>
                    <div className="min-w-0 flex-1 cursor-pointer" onClick={() => openEditModal(event)}>
                      <p className="text-xs font-semibold text-stone-800 dark:text-stone-100 truncate">{event.title}</p>
                      <p className="text-[10px] text-stone-500 truncate">{event.course && `${event.course} • `}{event.event_time || 'All day'}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <button onClick={openAddModal} className="w-full mt-3 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 rounded-xl transition-all shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add Event
            </button>
          </div>
        </div>
      </main>

      {/* Analysis Popup */}
      {showAnalysisPopup && (
        <AnalysisAnimation
          isPopup={true}
          text="Analyzing your writing"
          isComplete={analysisComplete}
          onComplete={() => {
            setShowAnalysisPopup(false);
            setAnalysisComplete(false);
          }}
        />
      )}

      {/* Citation Search Animation - same as landing page */}
      {showSearchAnimation && (
        <AnalysisAnimation
          isPopup={true}
          text="Finding citations for your topic"
          isComplete={false}
          variant="citations"
        />
      )}

      {/* Export Upgrade Modal (for locked export features) - Mobile optimized */}
      {showExportUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 px-0 sm:px-4">
          <div className="bg-white dark:bg-stone-800 rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-md w-full p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-5 sm:mb-6">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-amber-600 dark:text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Unlock Export</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                Export quizzes, flashcards & crosswords to PDF or Word.
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-xl p-3.5 sm:p-4 mb-5 sm:mb-6">
              <h4 className="font-semibold text-violet-900 dark:text-violet-100 mb-2.5 sm:mb-3 text-sm sm:text-base">Paid Plan Benefits:</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-violet-800 dark:text-violet-200">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Export to PDF & Word
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Permanent storage
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Unlimited generations
                </li>
              </ul>
            </div>
            
            <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3">
              <button
                onClick={() => setShowExportUpgradeModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl active:bg-gray-100 dark:active:bg-gray-700 sm:hover:bg-gray-50 dark:sm:hover:bg-gray-700 transition-colors font-medium text-sm sm:text-base"
              >
                Maybe Later
              </button>
              <button
                onClick={() => { setShowExportUpgradeModal(false); onNavigate('pricing'); }}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl active:from-amber-700 active:to-orange-700 sm:hover:from-amber-700 sm:hover:to-orange-700 transition-all font-medium text-sm sm:text-base"
              >
                View Plans
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Study Event Modal - Mobile optimized */}
      {showAddEventModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 px-0 sm:px-4" onClick={() => { setShowAddEventModal(false); setEditingEvent(null); setAddEventError(''); }}>
          <div className="bg-white dark:bg-stone-800 rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-md w-full p-5 sm:p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Drag handle for mobile */}
            <div className="w-12 h-1 bg-stone-300 dark:bg-stone-600 rounded-full mx-auto mb-4 sm:hidden" />
            
            <div className="flex items-center justify-between mb-4 sm:mb-5">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <span className="text-lg sm:text-xl">📅</span> {editingEvent ? 'Edit' : 'Add'} Event
              </h3>
              <button onClick={() => { setShowAddEventModal(false); setEditingEvent(null); setAddEventError(''); }} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="space-y-3.5 sm:space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">Event Title *</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={e => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Biology Midterm"
                  className="w-full px-3.5 py-2.5 sm:py-2 border border-stone-300 dark:border-stone-600 rounded-xl sm:rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-base sm:text-sm bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-100"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">Date *</label>
                  <input
                    type="date"
                    value={newEvent.event_date}
                    onChange={e => setNewEvent(prev => ({ ...prev, event_date: e.target.value }))}
                    className="w-full px-3 py-2.5 sm:py-2 border border-stone-300 dark:border-stone-600 rounded-xl sm:rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-base sm:text-sm bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">Time</label>
                  <input
                    type="time"
                    value={newEvent.event_time}
                    onChange={e => setNewEvent(prev => ({ ...prev, event_time: e.target.value }))}
                    className="w-full px-3 py-2.5 sm:py-2 border border-stone-300 dark:border-stone-600 rounded-xl sm:rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-base sm:text-sm bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-100"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">Type</label>
                  <select
                    value={newEvent.event_type}
                    onChange={e => setNewEvent(prev => ({ ...prev, event_type: e.target.value }))}
                    className="w-full px-3 py-2.5 sm:py-2 border border-stone-300 dark:border-stone-600 rounded-xl sm:rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-base sm:text-sm bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-100"
                  >
                    <option value="exam">Exam</option>
                    <option value="midterm">Midterm</option>
                    <option value="test">Test</option>
                    <option value="quiz">Quiz</option>
                    <option value="assignment">Assignment</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">Course</label>
                  <input
                    type="text"
                    value={newEvent.course}
                    onChange={e => setNewEvent(prev => ({ ...prev, course: e.target.value }))}
                    placeholder="e.g. BIO 101"
                    className="w-full px-3 py-2.5 sm:py-2 border border-stone-300 dark:border-stone-600 rounded-xl sm:rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-base sm:text-sm bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-100"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">Notes (optional)</label>
                <textarea
                  value={newEvent.notes}
                  onChange={e => setNewEvent(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any additional details..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 sm:py-2 border border-stone-300 dark:border-stone-600 rounded-xl sm:rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-base sm:text-sm resize-none bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-100"
                />
              </div>
            </div>
            
            {addEventError && (
              <div className="mt-3.5 sm:mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm">
                {addEventError}
              </div>
            )}
            
            <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3 mt-5 sm:mt-6">
              <button
                onClick={() => { setShowAddEventModal(false); setEditingEvent(null); setAddEventError(''); }}
                className="flex-1 px-4 py-3 sm:py-2.5 border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 rounded-xl active:bg-stone-100 dark:active:bg-stone-700 sm:hover:bg-stone-50 dark:sm:hover:bg-stone-700 transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={editingEvent ? updateStudyEvent : addStudyEvent}
                disabled={!newEvent.title || !newEvent.event_date || addingEvent}
                className="flex-1 px-4 py-3 sm:py-2.5 bg-violet-600 text-white rounded-xl active:bg-violet-700 sm:hover:bg-violet-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addingEvent ? (editingEvent ? 'Saving...' : 'Adding...') : (editingEvent ? 'Save' : 'Add Event')}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer onNavigate={onNavigate} />

    </div>
  );
};

export default Dashboard;
