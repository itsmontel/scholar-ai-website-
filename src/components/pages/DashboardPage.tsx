import { useState, useEffect, useRef } from 'react';
import Header from '../common/Header';
import Footer from '../common/Footer';
import { DocumentCardSkeleton } from '../common/LoadingSpinner';
import AnalysisAnimation from '../common/AnalysisAnimation';
import StreakWidget from '../common/StreakWidget';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

interface DashboardProps {
  onNavigate: (page: string) => void;
  user: any;
  onLogout: () => void;
  initialMode?: 'analyze' | 'citations' | 'humanize' | 'summarize' | 'quiz';
}

const Dashboard = ({ onNavigate, user, onLogout, initialMode = 'analyze' }: DashboardProps) => {
  const [inputText, setInputText] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [showWordWarning, setShowWordWarning] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCards, setKnownCards] = useState<Set<number>>(new Set());
  
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
    quiz: { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-600', dot: 'bg-amber-400' },
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

  // Character illustration component - same as landing page (man with hands gripping the box)
  const CharacterIllustration = () => (
    <>
      {/* Mobile version - small head peeking over top-right corner */}
      <div className="absolute -right-2 -top-9 w-14 h-14 sm:hidden pointer-events-none z-20">
        <svg viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="35" cy="28" r="20" fill="#E8B796" />
          <path d="M15 24 Q14 8 28 4 Q35 1 42 4 Q56 8 55 24 Q52 16 42 12 Q35 8 28 12 Q18 16 15 24" fill="#4A3728" />
          <path d="M15 24 Q10 30 15 36" fill="#4A3728" />
          <path d="M55 24 Q60 30 55 36" fill="#4A3728" />
          <ellipse cx="28" cy="28" rx="3" ry="3.5" fill="#1F2937" />
          <ellipse cx="42" cy="28" rx="3" ry="3.5" fill="#1F2937" />
          <circle cx="29" cy="26.5" r="1.2" fill="white" />
          <circle cx="43" cy="26.5" r="1.2" fill="white" />
          <path d="M28 40 Q35 46 42 40" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round" />
          <circle cx="20" cy="34" r="3" fill="#FECACA" opacity="0.5" />
          <circle cx="50" cy="34" r="3" fill="#FECACA" opacity="0.5" />
          <ellipse cx="26" cy="55" rx="6" ry="5" fill="#E8B796" />
          <ellipse cx="44" cy="55" rx="6" ry="5" fill="#E8B796" />
        </svg>
      </div>

      {/* Desktop - man peeking from behind right edge, hands gripping the top */}
      <div className="absolute hidden sm:block -right-4 xl:-right-10 pointer-events-none z-20" style={{ top: '-110px', width: '120px', height: '160px' }}>
        <svg viewBox="0 0 120 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Body - light blue shirt, cut off at bottom (behind the box) */}
          <path d="M35 105 Q35 130 60 138 Q85 130 85 105" fill="#60A5FA" />
          <path d="M48 101 L60 112 L72 101" stroke="#3B82F6" strokeWidth="2" fill="none" />
          {/* Neck */}
          <rect x="52" y="88" width="16" height="18" rx="2" fill="#E8B796" />
          {/* Head */}
          <ellipse cx="60" cy="52" rx="30" ry="34" fill="#E8B796" />
          {/* Hair - short neat brown male hair */}
          <path d="M30 44 Q28 18 44 10 Q60 2 76 10 Q92 18 90 44 Q88 30 76 22 Q60 12 44 22 Q32 30 30 44" fill="#4A3728" />
          <path d="M30 44 Q24 52 30 62" fill="#4A3728" />
          <path d="M90 44 Q96 52 90 62" fill="#4A3728" />
          {/* Eyes - looking left toward the text box */}
          <ellipse cx="48" cy="50" rx="4.5" ry="5.5" fill="#1F2937" />
          <ellipse cx="72" cy="50" rx="4.5" ry="5.5" fill="#1F2937" />
          <circle cx="46" cy="48" r="2" fill="white" />
          <circle cx="70" cy="48" r="2" fill="white" />
          {/* Eyebrows - friendly */}
          <path d="M38 38 Q48 33 58 38" stroke="#4A3728" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M62 38 Q72 33 82 38" stroke="#4A3728" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          {/* Warm smile */}
          <path d="M47 70 Q60 82 73 70" stroke="#1F2937" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          {/* Cheeks */}
          <ellipse cx="34" cy="62" rx="5" ry="3.5" fill="#FECACA" opacity="0.5" />
          <ellipse cx="86" cy="62" rx="5" ry="3.5" fill="#FECACA" opacity="0.5" />
          {/* Left arm reaching down to grip the edge of the box */}
          <path d="M34 110 Q18 125 12 145" stroke="#E8B796" strokeWidth="11" fill="none" strokeLinecap="round" />
          {/* Left hand - fingers curled over edge */}
          <ellipse cx="10" cy="148" rx="8" ry="6" fill="#E8B796" />
          <path d="M4 144 Q3 148 5 152" stroke="#D4A574" strokeWidth="1.2" fill="none" />
          <path d="M9 143 Q8 148 10 153" stroke="#D4A574" strokeWidth="1.2" fill="none" />
          <path d="M14 144 Q13 148 15 152" stroke="#D4A574" strokeWidth="1.2" fill="none" />
          {/* Right arm reaching down */}
          <path d="M86 110 Q100 125 106 145" stroke="#E8B796" strokeWidth="11" fill="none" strokeLinecap="round" />
          {/* Right hand */}
          <ellipse cx="108" cy="148" rx="8" ry="6" fill="#E8B796" />
          <path d="M102 144 Q101 148 103 152" stroke="#D4A574" strokeWidth="1.2" fill="none" />
          <path d="M107 143 Q106 148 108 153" stroke="#D4A574" strokeWidth="1.2" fill="none" />
          <path d="M112 144 Q111 148 113 152" stroke="#D4A574" strokeWidth="1.2" fill="none" />
        </svg>
      </div>
    </>
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [placeholders.length]);

  useEffect(() => {
    fetchDocuments();
    fetchUsageStats();
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

  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
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
      setCurrentCard(0);
      setIsFlipped(false);
      setKnownCards(new Set());
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
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #FAF8F5 0%, #F5F3F0 100%)' }}>
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="dashboard" />

      {/* Usage Stats Bar */}
      <div className="border-b border-stone-200/60" style={{ background: 'rgba(250, 248, 245, 0.8)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-center flex-wrap gap-4 sm:gap-8 text-sm">
              <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-lime-500 rounded-full"></div>
              <span className="text-stone-500">Documents:</span>
              <span className="font-medium text-stone-800">
                    {loadingStats ? '...' : `${usageStats.documentsUploaded}/${usageStats.planLimits.documentsPerMonth === -1 ? '∞' : usageStats.planLimits.documentsPerMonth}`}
              </span>
              </div>
              <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-lime-500 rounded-full"></div>
              <span className="text-stone-500">Analyses:</span>
              <span className="font-medium text-stone-800">
                    {loadingStats ? '...' : `${usageStats.documentsAnalyzed}/${usageStats.planLimits.analysesPerMonth === -1 ? '∞' : usageStats.planLimits.analysesPerMonth}`}
              </span>
              </div>
              <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-lime-500 rounded-full"></div>
              <span className="text-stone-500">Storage:</span>
              <span className="font-medium text-stone-800">
                {loadingStats ? '...' : formatBytes(usageStats.storageUsed)}
              </span>
              </div>
              {usageStats.plan === 'free' && !loadingStats && (
                  <button
                    onClick={() => onNavigate('pricing')}
                className="px-3 py-1 bg-lime-400 hover:bg-lime-300 text-stone-900 text-xs font-medium rounded-full transition-colors"
                  >
                Upgrade
                  </button>
              )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-1 sm:pt-2 pb-8 sm:pb-14 w-full min-w-0 overflow-x-hidden lg:ml-24 lg:mr-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 items-start">
          {/* LEFT SIDEBAR: Streak + Calendar / Schedule */}
          <aside className="order-2 lg:order-1 space-y-4 sticky top-16 min-w-0">
            {/* Streak Widget - desktop only (mobile shows it at top of main content) */}
            <div className="hidden lg:block min-w-0">
              <StreakWidget />
            </div>

            {/* Schedule Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-stone-800 flex items-center gap-2 text-sm">
                <span className="text-lg">📅</span> Schedule
              </h3>
              <button 
                onClick={openAddModal}
                className="text-stone-400 hover:text-lime-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
            
            {/* Mini Calendar View */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2 text-xs font-medium text-stone-600">
                <button 
                  onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))}
                  className="p-1 hover:bg-stone-100 rounded"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <span className="font-semibold">{calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                <button 
                  onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))}
                  className="p-1 hover:bg-stone-100 rounded"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
              <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] mb-1 text-stone-400 font-medium">
                <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
              </div>
              <div className="grid grid-cols-7 gap-0.5 text-center text-xs">
                {getCalendarDays().map((d, i) => {
                  const events = getEventsForDate(d.date);
                  const today = isToday(d.date);
                  return (
                    <div 
                      key={i} 
                      className={`p-1 relative cursor-pointer rounded transition-colors ${
                        !d.isCurrentMonth ? 'text-stone-300' : 
                        today ? 'bg-lime-500 text-white font-bold' : 
                        'text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      {d.day}
                      {events.length > 0 && !today && (
                        <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${eventTypeColors[events[0].event_type]?.dot || 'bg-stone-400'}`}></span>
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
                    <div key={event.id} className={`flex gap-2 p-2 rounded-lg ${colors.bg} border ${colors.border} group relative`}>
                      <div className={`flex flex-col items-center justify-center w-9 h-9 bg-white rounded-lg shadow-sm ${colors.text} flex-shrink-0`}>
                        <span className="text-[8px] font-bold uppercase leading-none">{eventDate.toLocaleDateString('en-US', { month: 'short' })}</span>
                        <span className="text-sm font-bold leading-none">{eventDate.getDate()}</span>
                      </div>
                      <div 
                        className="min-w-0 flex-1 cursor-pointer"
                        onClick={() => openEditModal(event)}
                      >
                        <p className="text-xs font-semibold text-stone-800 truncate">{event.title}</p>
                        <p className="text-[10px] text-stone-500 truncate">
                          {event.course && `${event.course} • `}{event.event_time || 'All day'}
                        </p>
                      </div>
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        <button 
                          onClick={(e) => { e.stopPropagation(); openEditModal(event); }}
                          className="p-1 text-stone-400 hover:text-lime-600 transition-colors"
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
              className="w-full mt-3 py-2 text-xs font-medium text-stone-500 bg-stone-50 hover:bg-lime-50 hover:text-lime-700 rounded-lg transition-colors border border-stone-200 border-dashed"
            >
              + Add Event
            </button>
            </div>
          </aside>

          {/* RIGHT MAIN CONTENT */}
          <div className="order-1 lg:order-2 min-w-0 pt-6 sm:pt-10">
            {/* Streak widget - visible on mobile only (sidebar has it on desktop) */}
            <div className="mb-6 lg:hidden">
              <StreakWidget />
            </div>

            {/* Welcome */}
            {/* Free ebook for new users (hidden after 24 hours or when dismissed) */}
            {showEbookBanner && !ebookBannerDismissed && (
              <div className="mb-8 relative">
                <a
                  href="/downloads/writescholar-ultimate-study-tips-guide.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 rounded-2xl border border-lime-200 bg-gradient-to-r from-lime-50 to-green-50 p-4 pr-12 transition-shadow hover:shadow-md"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-lime-100">
                    <svg className="h-6 w-6 text-lime-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-stone-800">Your free ebook</p>
                    <p className="text-sm text-stone-500">WriteScholar Ultimate Study Tips Guide (PDF)</p>
                  </div>
                  <span className="shrink-0 text-sm font-medium text-lime-600">Download →</span>
                </a>
                <button
                  onClick={(e) => { e.preventDefault(); dismissEbookBanner(); }}
                  className="absolute top-3 right-3 p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
                  aria-label="Dismiss"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* Mode Toggle - topic colors: Analyze #2E6FEA, Citations #22A7AB, Humanize #9B59B6, Summarize #28B463, Study Tools #D35400 */}
          <div className="flex justify-center mb-7">
          <div className="inline-flex flex-wrap justify-center bg-stone-100 rounded-full p-1.5 gap-1">
              <button
              onClick={() => { setMode('analyze'); setInputText(''); setShowWordWarning(false); setShowHumanizeResult(false); setSummaryResult(null); setQuizResult(null); }}
              className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-sm sm:text-base font-medium transition-all ${
                mode === 'analyze' ? 'bg-white shadow-sm border' : ''
              }`}
              style={mode === 'analyze' ? { color: '#7ab308', borderColor: '#a3e635' } : { color: '#7ab308' }}
            >
              Analyze Essay
              </button>
              <button
              onClick={() => { setMode('citations'); setInputText(''); setShowWordWarning(false); setShowHumanizeResult(false); setSummaryResult(null); setQuizResult(null); }}
              className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-sm sm:text-base font-medium transition-all ${
                mode === 'citations' ? 'bg-white shadow-sm border' : ''
              }`}
              style={mode === 'citations' ? { color: '#22A7AB', borderColor: '#A7F3F5' } : { color: '#22A7AB' }}
            >
              Find Citations
              </button>
              <button
              onClick={() => { setMode('humanize'); setInputText(''); setShowWordWarning(false); setSummaryResult(null); setQuizResult(null); }}
              className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-sm sm:text-base font-medium transition-all relative ${
                mode === 'humanize' ? 'bg-white shadow-sm border' : ''
              }`}
              style={mode === 'humanize' ? { color: '#9B59B6', borderColor: '#E8DAEF' } : { color: '#9B59B6' }}
            >
              Humanize
              {usageStats.plan === 'free' && <span className="absolute -top-2 -right-1 px-1.5 py-0.5 text-white text-[10px] font-bold rounded-full leading-none" style={{ backgroundColor: '#9B59B6' }}>PRO</span>}
              </button>
              <button
              onClick={() => { setMode('summarize'); setInputText(''); setShowWordWarning(false); setShowHumanizeResult(false); setQuizResult(null); }}
              className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-sm sm:text-base font-medium transition-all relative ${
                mode === 'summarize' ? 'bg-white shadow-sm border' : ''
              }`}
              style={mode === 'summarize' ? { color: '#28B463', borderColor: '#ABEBC6' } : { color: '#28B463' }}
            >
              Summarize
              </button>
              <button
              onClick={() => { setMode('quiz'); setInputText(''); setShowWordWarning(false); setShowHumanizeResult(false); setSummaryResult(null); setFlashcardResult(null); setCrosswordResult(null); }}
              className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-sm sm:text-base font-semibold transition-all relative ${
                mode === 'quiz' ? 'bg-white shadow-md border-2 ring-2 ring-orange-200/50' : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg hover:shadow-xl hover:from-orange-600 hover:to-amber-600'
              }`}
              style={mode === 'quiz' ? { color: '#D35400', borderColor: '#FADBD8' } : {}}
            >
              Study Tools
              {usageStats.plan === 'free' && <span className="absolute -top-2 -right-1 px-1.5 py-0.5 text-white text-[10px] font-bold rounded-full leading-none bg-stone-900">PRO</span>}
              </button>
            </div>
          </div>

        {/* ANALYZE MODE - Upload First Design */}
        {mode === 'analyze' && (
          <>
            {/* Primary: Upload Section */}
            <div className="relative mb-8 overflow-visible">
              {/* Character illustration */}
              <CharacterIllustration />
              
              <div 
                onClick={() => onNavigate('upload')}
                className="bg-gradient-to-br from-lime-50 to-green-50 rounded-3xl p-10 sm:p-14 text-center border-2 border-dashed border-lime-200 hover:border-lime-400 cursor-pointer transition-all hover:shadow-lg group"
              >
                <div className="w-20 h-20 bg-lime-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg">
                  <svg className="w-10 h-10 text-stone-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h2 className="text-2xl sm:text-3xl font-semibold text-stone-800 mb-3">Upload Your Document</h2>
                <p className="text-stone-500 text-lg mb-6 max-w-md mx-auto">
                  Drop your essay, thesis, or research paper here for comprehensive AI analysis
                </p>
                <button 
                  className="inline-flex items-center px-8 py-4 bg-lime-400 hover:bg-lime-300 text-stone-900 font-semibold rounded-full transition-colors text-lg shadow-lg group-hover:shadow-xl"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Choose File
                </button>
                <div className="flex justify-center gap-3 mt-6">
                  <span className="px-4 py-1.5 bg-white text-stone-600 text-sm font-medium rounded-lg border border-stone-200">PDF</span>
                  <span className="px-4 py-1.5 bg-white text-stone-600 text-sm font-medium rounded-lg border border-stone-200">DOCX</span>
                  <span className="px-4 py-1.5 bg-white text-stone-600 text-sm font-medium rounded-lg border border-stone-200">TXT</span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex-1 h-px bg-stone-200"></div>
              <span className="px-4 text-stone-400 text-sm font-medium">or paste your text directly</span>
              <div className="flex-1 h-px bg-stone-200"></div>
            </div>

            {/* Secondary: Text Input (smaller) */}
            <div className="mb-12">
              <div className="relative bg-white rounded-3xl border border-stone-200/80 shadow-sm hover:border-stone-300 hover:shadow-md focus-within:border-[#2E6FEA]/40 focus-within:shadow-xl focus-within:shadow-[#2E6FEA]/5 focus-within:ring-2 focus-within:ring-[#2E6FEA]/20 transition-all duration-300">
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
                  className={`px-6 py-3 rounded-full flex items-center justify-center transition-all font-semibold text-base ${
                    isTextValid()
                      ? 'bg-lime-400 hover:bg-lime-300 text-stone-900 shadow-md cursor-pointer'
                      : 'bg-stone-100 text-stone-400 cursor-not-allowed'
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
              <CharacterIllustration />
              
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
                  className={`px-8 py-3.5 rounded-full flex items-center justify-center transition-all font-semibold text-base ${
                    isTextValid() && !isSearchingCitations
                      ? 'bg-lime-400 hover:bg-lime-300 text-stone-900 shadow-lg cursor-pointer'
                      : 'bg-stone-200 text-stone-400 cursor-not-allowed'
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
              <p className="text-sm text-stone-500 text-center mb-4">Suggestions</p>
              <div className="flex flex-wrap justify-center gap-2.5">
                {suggestedTopics.map((topic, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setInputText(topic)}
                    className="px-4 py-2 bg-white hover:bg-stone-50 text-stone-700 text-sm sm:text-base rounded-lg border border-stone-200 hover:border-stone-300 transition-colors"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* HUMANIZE MODE - matches HumanizerPage design */}
        {mode === 'humanize' && (
          <>
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-stone-100/50 border border-stone-200 overflow-hidden mb-6 min-w-0">
              {/* Toolbar */}
              <div className="bg-gradient-to-r from-lime-50 to-green-50 border-b border-stone-100 px-3 sm:px-5 py-3 sm:py-4">
                <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0 overflow-x-auto sm:overflow-visible">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                      <span className="text-xs font-medium text-gray-500 flex-shrink-0">Mode:</span>
                      <div className="flex items-center bg-white rounded-xl px-0.5 sm:px-1 py-1 shadow-sm border border-gray-200">
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
                            humanizeMode === m.id ? 'bg-violet-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                      <span className="text-xs font-medium text-gray-500 flex-shrink-0">Intensity:</span>
                      <div className="flex items-center bg-white rounded-xl px-0.5 sm:px-1 py-1 shadow-sm border border-gray-200">
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
                            humanizeIntensity === intensity.id ? 'bg-violet-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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
                        ? 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-200 hover:shadow-xl hover:shadow-violet-300 cursor-pointer transform hover:-translate-y-0.5'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
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
              <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-100 min-w-0">
                {/* Left Panel */}
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 bg-gray-50/50 border-b border-gray-100 gap-2 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0"></div>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider truncate">Original</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <input ref={parseFileInputRef} type="file" accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" onChange={handleParseDocument} className="hidden" />
                      <button onClick={() => parseFileInputRef.current?.click()} disabled={isParsingDoc} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-100 text-violet-700 hover:bg-violet-200 font-semibold text-sm transition-colors disabled:opacity-50 border border-violet-200">
                        {isParsingDoc ? <span className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" /> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>}
                        {isParsingDoc ? 'Parsing...' : 'Upload Document'}
                      </button>
                      <button onClick={() => navigator.clipboard.readText().then(text => setInputText(text))} className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-gray-600 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                        Paste
                      </button>
                      <button onClick={() => setInputText('')} className={`flex items-center gap-1.5 px-2 py-1.5 text-xs text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ${!inputText ? 'invisible' : ''}`}>Clear</button>
                    </div>
                  </div>
                  <textarea
                    value={inputText}
                    onChange={(e) => { setInputText(e.target.value); setShowWordWarning(false); }}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && isTextValid()) { e.preventDefault(); handleSubmit(); }}}
                    placeholder={placeholders[placeholderIndex]}
                    disabled={isHumanizing}
                    className="w-full min-w-0 min-h-[240px] sm:min-h-[280px] md:min-h-[350px] p-3 sm:p-5 text-gray-800 text-[15px] border-none outline-none resize-none bg-transparent placeholder-gray-400 leading-relaxed"
                  />
                  <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 bg-gray-50/30 border-t border-gray-100">
                    <span className={`text-xs font-medium ${getWordCount(inputText) > humanizeSummarizeMaxWords ? 'text-red-600' : 'text-gray-400'}`}>
                      {getWordCount(inputText)} words / {humanizeSummarizeMaxWords.toLocaleString()} max
                      {getWordCount(inputText) > humanizeSummarizeMaxWords && isFreeUser && ' — Upgrade for 5,000'}
                    </span>
                  </div>
                </div>

                {/* Right Panel */}
                <div className="flex flex-col bg-gradient-to-br from-violet-50/30 to-purple-50/30 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-5 py-2.5 sm:py-3 bg-violet-50/50 border-b border-violet-100/50 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2 h-2 rounded-full bg-violet-400 flex-shrink-0"></div>
                      <span className="text-xs font-semibold text-violet-600 uppercase tracking-wider">Humanized</span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                      {showHumanizeResult && humanizedResult && (
                        <>
                          <button
                            onClick={() => setShowHighlights(!showHighlights)}
                            className={`flex items-center gap-1 sm:gap-1.5 text-xs font-medium transition-all px-1.5 sm:px-2 py-1 rounded-lg ${
                              showHighlights ? 'bg-violet-100 text-violet-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                            </svg>
                            <span className="hidden sm:inline">Highlights</span>
                          </button>
                          <button
                            onClick={() => { navigator.clipboard.writeText(humanizedResult); setHumanizeCopied(true); setTimeout(() => setHumanizeCopied(false), 2000); }}
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
                      <div className="p-3 sm:p-5 text-gray-800 text-[15px] leading-relaxed break-words">
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
                                return <span key={idx} className="bg-violet-100/80 text-violet-900 underline decoration-violet-400/60 decoration-2 underline-offset-2 rounded-sm px-0.5">{token}</span>;
                              }
                              return <span key={idx}>{token}</span>;
                            });
                          })()
                        ) : (
                          humanizedResult
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400 p-5">
                        {isHumanizing ? (
                          <div className="flex flex-col items-center gap-4">
                            <div className="relative">
                              <div className="w-12 h-12 border-4 border-violet-200 rounded-full"></div>
                              <div className="absolute top-0 left-0 w-12 h-12 border-4 border-violet-600 rounded-full border-t-transparent animate-spin"></div>
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-medium text-gray-600">Humanizing your text...</p>
                              <p className="text-xs text-gray-400 mt-1">This usually takes 5-10 seconds</p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-violet-100/50 flex items-center justify-center">
                              <svg className="w-8 h-8 text-violet-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </div>
                            <p className="text-sm text-gray-500">Your humanized text will appear here</p>
                            <p className="text-xs text-gray-400 mt-1">Paste text on the left and click Humanize</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 bg-violet-50/30 border-t border-violet-100/50">
                    <span className="text-xs text-gray-400 font-medium">{showHumanizeResult ? `${humanizedResult.split(/\s+/).filter(Boolean).length} words` : ''}</span>
                    {showHumanizeResult && humanizedResult && (
                      <button onClick={() => { setShowHumanizeResult(false); setHumanizedResult(''); }} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Clear result</button>
                    )}
                  </div>
                </div>
              </div>

              {/* Usage Bar */}
              <div className="px-3 sm:px-5 py-3 sm:py-4 bg-gray-50 border-t border-gray-100">
                <div className="flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-6 gap-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">Monthly usage:</span>
                    {humanizeWordLimit >= 999999 ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-700">{humanizeWordsUsed.toLocaleString()} words used</span>
                        <span className="px-2 py-0.5 bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700 text-[10px] font-bold rounded-full">UNLIMITED</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${humanizeWordsUsed / humanizeWordLimit > 0.9 ? 'bg-red-500' : 'bg-gradient-to-r from-violet-500 to-purple-500'}`}
                            style={{ width: `${Math.min(100, (humanizeWordsUsed / humanizeWordLimit) * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-gray-700">{humanizeWordsUsed.toLocaleString()} / {humanizeWordLimit.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                  {humanizeWordLimit < 999999 && (
                    <button onClick={() => onNavigate('pricing')} className="text-xs text-violet-600 hover:text-violet-700 font-semibold flex items-center gap-1 transition-colors">
                      Upgrade for unlimited
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {humanizeError && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-2xl text-center">
                <p className="text-red-700 text-sm font-medium">{humanizeError}</p>
                {humanizeWordLimit < 999999 && (
                  <button onClick={() => onNavigate('pricing')} className="mt-2 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors">
                    Upgrade for unlimited words/month
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {/* SUMMARIZE MODE */}
        {mode === 'summarize' && (
          <>
            {/* Plan info banner */}
            {!isPremiumUser && (
              <div className="mb-6 bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📝</span>
                  <div>
                    <p className="text-teal-800 font-medium text-sm">
                      {usageStats.plan === 'free' ? 'Free plan: 1,000 words/month' : 'Starter plan: 999,999 words/month'}
                      {!isPremiumUser && ' • Bullet + Medium only'}
                    </p>
                    <p className="text-teal-600 text-xs mt-0.5">Upgrade to Premium for all styles, lengths, and our premium AI model</p>
                  </div>
                </div>
                <button onClick={() => onNavigate('pricing')} className="px-4 py-1.5 bg-teal-600 text-white text-xs font-semibold rounded-lg hover:bg-teal-700 transition-all">
                  Upgrade
                </button>
              </div>
            )}
            
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-teal-100/50 border border-gray-100 overflow-hidden mb-6 min-w-0">
              {/* Toolbar */}
              <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border-b border-gray-100 px-3 sm:px-5 py-3 sm:py-4">
                <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0 overflow-x-auto sm:overflow-visible">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                      <span className="text-xs font-medium text-gray-500 flex-shrink-0">Style:</span>
                      <div className="flex items-center bg-white rounded-xl px-0.5 sm:px-1 py-1 shadow-sm border border-gray-200">
                        {(['bullet', 'paragraph', 'tldr', 'detailed'] as const).map((s) => {
                          const locked = !isPremiumUser && s !== 'bullet';
                          return (
                            <button
                              key={s}
                              onClick={() => !locked && setSummaryStyle(s)}
                              disabled={locked}
                              title={locked ? 'Premium only' : ''}
                              className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap relative ${
                                locked ? 'text-gray-300 cursor-not-allowed' :
                                summaryStyle === s ? 'bg-teal-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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
                      <span className="text-xs font-medium text-gray-500 flex-shrink-0">Length:</span>
                      <div className="flex items-center bg-white rounded-xl px-0.5 sm:px-1 py-1 shadow-sm border border-gray-200">
                        {(['short', 'medium', 'long'] as const).map((l) => {
                          const locked = !isPremiumUser && l !== 'medium';
                          return (
                            <button
                              key={l}
                              onClick={() => !locked && setSummaryLength(l)}
                              disabled={locked}
                              title={locked ? 'Premium only' : ''}
                              className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                                locked ? 'text-gray-300 cursor-not-allowed' :
                                summaryLength === l ? 'bg-teal-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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
                        ? 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-lg shadow-teal-200 cursor-pointer'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
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
              <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-100 min-w-0">
                {/* Left Panel */}
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 bg-gray-50/50 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Original</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input ref={parseFileInputRef} type="file" accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" onChange={handleParseDocument} className="hidden" />
                      <button onClick={() => parseFileInputRef.current?.click()} disabled={isParsingDoc} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-teal-100 text-teal-700 hover:bg-teal-200 font-semibold text-sm transition-colors disabled:opacity-50 border border-teal-200">
                        {isParsingDoc ? <span className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>}
                        {isParsingDoc ? 'Parsing...' : 'Upload Document'}
                      </button>
                      <button onClick={() => navigator.clipboard.readText().then(text => setInputText(text))} className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-gray-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors">Paste</button>
                      <button onClick={() => setInputText('')} className={`flex items-center gap-1.5 px-2 py-1.5 text-xs text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ${!inputText ? 'invisible' : ''}`}>Clear</button>
                    </div>
                  </div>
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={placeholders[placeholderIndex]}
                    disabled={isSummarizing}
                    className="w-full min-h-[280px] sm:min-h-[350px] p-3 sm:p-5 text-gray-800 text-[15px] border-none outline-none resize-none bg-transparent placeholder-gray-400 leading-relaxed"
                  />
                  <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 bg-gray-50/30 border-t border-gray-100">
                    <span className={`text-xs font-medium ${getWordCount(inputText) < 50 ? 'text-amber-600' : getWordCount(inputText) > humanizeSummarizeMaxWords ? 'text-red-600' : 'text-gray-400'}`}>
                      {getWordCount(inputText)} words / {humanizeSummarizeMaxWords.toLocaleString()} max
                      {getWordCount(inputText) < 50 && ' (min 50)'}
                      {getWordCount(inputText) > humanizeSummarizeMaxWords && isFreeUser && ' — Upgrade for 5,000'}
                    </span>
                  </div>
                </div>

                {/* Right Panel */}
                <div className="flex flex-col bg-gradient-to-br from-teal-50/30 to-emerald-50/30 min-w-0">
                  <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 bg-teal-50/50 border-b border-teal-100/50">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-teal-400"></div>
                      <span className="text-xs font-semibold text-teal-600 uppercase tracking-wider">Summary</span>
                      {summaryResult && (
                        <span className="px-2 py-0.5 bg-teal-100 text-teal-700 text-[10px] font-bold rounded-full">
                          {Math.round((1 - summaryResult.summaryWordCount / summaryResult.originalWordCount) * 100)}% shorter
                        </span>
                      )}
                    </div>
                    {summaryResult && (
                      <button
                        onClick={() => { navigator.clipboard.writeText(summaryResult.summary); setSummaryCopied(true); setTimeout(() => setSummaryCopied(false), 2000); }}
                        className={`text-xs font-medium ${summaryCopied ? 'text-green-600' : 'text-teal-600 hover:text-teal-700'}`}
                      >
                        {summaryCopied ? '✓ Copied!' : 'Copy'}
                      </button>
                    )}
                  </div>
                  <div className="flex-1 min-h-[280px] sm:min-h-[350px] max-h-[350px] overflow-y-auto">
                    {summaryResult ? (
                      <div className="p-3 sm:p-5 text-gray-800 text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                        {summaryResult.summary}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400 p-5">
                        {isSummarizing ? (
                          <div className="flex flex-col items-center gap-4">
                            <div className="relative">
                              <div className="w-12 h-12 border-4 border-teal-200 rounded-full"></div>
                              <div className="absolute top-0 left-0 w-12 h-12 border-4 border-teal-600 rounded-full border-t-transparent animate-spin"></div>
                            </div>
                            <p className="text-sm font-medium text-gray-600">Creating your summary...</p>
                          </div>
                        ) : (
                          <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-teal-100/50 flex items-center justify-center text-3xl">📝</div>
                            <p className="text-sm text-gray-500">Your summary will appear here</p>
                            <p className="text-xs text-gray-400 mt-1">Paste text on the left and click Summarize</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 bg-teal-50/30 border-t border-teal-100/50">
                    <span className="text-xs text-gray-400 font-medium">{summaryResult ? `${summaryResult.summaryWordCount} words` : ''}</span>
                    {summaryResult && (
                      <button onClick={() => setSummaryResult(null)} className="text-xs text-gray-400 hover:text-gray-600">Clear</button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {summaryError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl text-center">
                <p className="text-red-700 text-sm font-medium">{summaryError}</p>
                {usageStats.plan === 'free' && (
                  <button onClick={() => onNavigate('pricing')} className="mt-2 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg">
                    Upgrade Plan
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {/* STUDY TOOLS MODE (Quiz / Flashcards / Crossword) */}
        {mode === 'quiz' && (
          <>
            {/* Study Tool Sub-Mode Tabs */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="inline-flex items-center bg-amber-50 border border-amber-200 rounded-2xl p-1.5">
                {([
                  { key: 'quiz' as const, label: 'Quiz', icon: '📝' },
                  { key: 'flashcards' as const, label: 'Flashcards', icon: '🃏' },
                  { key: 'crossword' as const, label: 'Crossword', icon: '🧩' },
                  { key: 'crater_blast' as const, label: 'Crater Blast', icon: '💥' },
                ]).map((tool) => (
                  <button
                    key={tool.key}
                    onClick={() => { setStudyToolMode(tool.key); setQuizResult(null); setFlashcardResult(null); setCrosswordResult(null); setQuizError(''); setIsQuizMode(false); }}
                    className={`px-4 sm:px-5 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
                      studyToolMode === tool.key
                        ? 'bg-white text-amber-700 shadow-sm border border-amber-200'
                        : 'text-amber-600 hover:text-amber-800 hover:bg-amber-100/50'
                    }`}
                  >
                    <span className="text-base">{tool.icon}</span>
                    <span className="hidden sm:inline">{tool.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Exhausted generations banner for free users */}
            {quizExhausted && (
              <div className="mb-6 bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl p-6 text-white text-center">
                <span className="text-4xl mb-3 block">🔒</span>
                <h3 className="text-xl font-bold mb-2">Monthly Limit Reached</h3>
                <p className="text-amber-100 mb-4">You've used all 3 study tool generations this month. Upgrade for unlimited access!</p>
                <button
                  onClick={() => onNavigate('pricing')}
                  className="px-6 py-2.5 bg-white text-amber-700 font-semibold rounded-xl hover:bg-amber-50 transition-all inline-flex items-center gap-2"
                >
                  👑 Upgrade Now
                </button>
              </div>
            )}

            {/* Plan info banner for free and starter users */}
            {!isPremiumUser && !quizExhausted && (
              <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🧠</span>
                  <div>
                    {isFreeUser ? (
                      <>
                        <p className="text-amber-800 font-medium text-sm">
                          Free plan: {quizUsage.generationsRemaining} of {quizUsage.generationLimit} generations remaining • Max {(quizUsage.maxWordsPerGeneration || 5000).toLocaleString()} words
                        </p>
                        <p className="text-amber-600 text-xs mt-0.5">Upgrade for unlimited quizzes, flashcards, crosswords, and up to 15,000 words</p>
                      </>
                    ) : (
                      <>
                        <p className="text-amber-800 font-medium text-sm">Starter plan: Quiz limited to Mixed type + Medium difficulty</p>
                        <p className="text-amber-600 text-xs mt-0.5">Upgrade to Premium for all quiz types, difficulties, and our premium AI model</p>
                      </>
                    )}
                  </div>
                </div>
                <button onClick={() => onNavigate('pricing')} className="px-4 py-1.5 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700 transition-all">
                  Upgrade
                </button>
              </div>
            )}

            {/* ============ QUIZ SUB-MODE ============ */}
            {studyToolMode === 'quiz' && (
              <>
                {/* Quiz Taking View */}
                {quizResult && isQuizMode && (
                  <div className={`bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-gray-100 overflow-hidden mb-6 ${!canUseQuiz ? 'opacity-50 pointer-events-none' : ''}`}>
                    {quizCompleted ? (
                      <div className="p-8 text-center">
                        <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-4 text-4xl ${userAnswers.filter(a => a.isCorrect).length / userAnswers.length >= 0.7 ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-amber-500 to-orange-600'}`}>🏆</div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Quiz Complete!</h2>
                        <div className="text-5xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent my-4">
                          {Math.round((userAnswers.filter(a => a.isCorrect).length / userAnswers.length) * 100)}%
                        </div>
                        <p className="text-gray-600">{userAnswers.filter(a => a.isCorrect).length} out of {userAnswers.length} correct</p>
                        <div className="flex justify-center gap-2 mt-6 mb-4">
                          {isPaidUser ? (
                            <>
                              <button onClick={exportQuizToPDF} className="px-4 py-2 bg-red-50 text-red-700 font-medium rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2 text-sm">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                                Download PDF
                              </button>
                              <button onClick={exportQuizToDOCX} className="px-4 py-2 bg-blue-50 text-blue-700 font-medium rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2 text-sm">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                                Download DOCX
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => setShowExportUpgradeModal(true)} className="px-4 py-2 bg-gray-100 text-gray-400 font-medium rounded-lg transition-colors flex items-center gap-2 text-sm cursor-pointer">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                                PDF
                                <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                              </button>
                              <button onClick={() => setShowExportUpgradeModal(true)} className="px-4 py-2 bg-gray-100 text-gray-400 font-medium rounded-lg transition-colors flex items-center gap-2 text-sm cursor-pointer">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                                DOCX
                                <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                              </button>
                            </>
                          )}
                        </div>
                        <div className="flex justify-center gap-3">
                          <button onClick={() => { setCurrentQuestion(0); setUserAnswers([]); setQuizCompleted(false); setSelectedAnswer(''); setShowQuizResult(false); }} className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl">Try Again</button>
                          <button onClick={() => { setQuizResult(null); setIsQuizMode(false); }} className="px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold rounded-xl">New Quiz</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="h-2 bg-gray-100"><div className="h-full bg-gradient-to-r from-amber-500 to-orange-500" style={{ width: `${((currentQuestion + 1) / quizResult.questions.length) * 100}%` }}></div></div>
                        <div className="p-6">
                          <div className="flex justify-between mb-4">
                            <span className="text-sm text-gray-500">Question {currentQuestion + 1} of {quizResult.questions.length}</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${quizResult.questions[currentQuestion]?.type === 'multiple_choice' ? 'bg-blue-100 text-blue-700' : quizResult.questions[currentQuestion]?.type === 'true_false' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                              {quizResult.questions[currentQuestion]?.type?.replace('_', ' ')}
                            </span>
                          </div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-6">{quizResult.questions[currentQuestion]?.question}</h3>
                          <div className="space-y-3 mb-6">
                            {quizResult.questions[currentQuestion]?.type === 'multiple_choice' && quizResult.questions[currentQuestion]?.options?.map((opt: string, idx: number) => {
                              const letter = opt.charAt(0);
                              const isSelected = selectedAnswer === letter;
                              const isCorrect = showQuizResult && letter === quizResult.questions[currentQuestion].correctAnswer;
                              const isWrong = showQuizResult && isSelected && letter !== quizResult.questions[currentQuestion].correctAnswer;
                              return (
                                <button key={idx} onClick={() => !showQuizResult && setSelectedAnswer(letter)} disabled={showQuizResult}
                                  className={`w-full p-4 rounded-xl border-2 text-left flex items-center gap-3 ${isCorrect ? 'border-green-500 bg-green-50' : isWrong ? 'border-red-500 bg-red-50' : isSelected ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:border-amber-300'}`}
                                >
                                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${isCorrect ? 'bg-green-500 text-white' : isWrong ? 'bg-red-500 text-white' : isSelected ? 'bg-amber-500 text-white' : 'bg-gray-100'}`}>{letter}</span>
                                  <span>{opt.substring(3)}</span>
                                </button>
                              );
                            })}
                            {quizResult.questions[currentQuestion]?.type === 'true_false' && ['true', 'false'].map((opt) => {
                              const isSelected = selectedAnswer === opt;
                              const isCorrect = showQuizResult && opt === quizResult.questions[currentQuestion].correctAnswer;
                              const isWrong = showQuizResult && isSelected && opt !== quizResult.questions[currentQuestion].correctAnswer;
                              return (
                                <button key={opt} onClick={() => !showQuizResult && setSelectedAnswer(opt)} disabled={showQuizResult}
                                  className={`w-full p-4 rounded-xl border-2 text-left flex items-center gap-3 ${isCorrect ? 'border-green-500 bg-green-50' : isWrong ? 'border-red-500 bg-red-50' : isSelected ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:border-amber-300'}`}
                                >
                                  <span className={`w-8 h-8 rounded-full flex items-center justify-center ${isCorrect ? 'bg-green-500 text-white' : isWrong ? 'bg-red-500 text-white' : isSelected ? 'bg-amber-500 text-white' : 'bg-gray-100'}`}>{opt === 'true' ? '✓' : '✗'}</span>
                                  <span className="capitalize font-medium">{opt}</span>
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
                                  className={`w-full p-4 rounded-xl border-2 text-left flex items-center gap-3 ${isCorrect ? 'border-green-500 bg-green-50' : isWrong ? 'border-red-500 bg-red-50' : isSelected ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:border-amber-300'}`}
                                >
                                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${isCorrect ? 'bg-green-500 text-white' : isWrong ? 'bg-red-500 text-white' : isSelected ? 'bg-amber-500 text-white' : 'bg-gray-100'}`}>{letter}</span>
                                  <span>{opt.substring(3)}</span>
                                </button>
                              );
                            })}
                          </div>
                          {showQuizResult && quizResult.questions[currentQuestion]?.explanation && (
                            <div className="p-4 bg-blue-50 rounded-xl mb-6 border border-blue-100">
                              <p className="text-sm text-blue-700">💡 {quizResult.questions[currentQuestion].explanation}</p>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <button onClick={() => { if (currentQuestion > 0) { setCurrentQuestion(currentQuestion - 1); setShowQuizResult(false); setSelectedAnswer(''); } }} disabled={currentQuestion === 0} className="px-4 py-2 text-gray-600 disabled:opacity-30">← Previous</button>
                            {!showQuizResult ? (
                              <button onClick={() => {
                                const q = quizResult.questions[currentQuestion];
                                const ans = selectedAnswer;
                                const correct = ans === q.correctAnswer;
                                setUserAnswers([...userAnswers, { questionId: q.id, answer: ans, isCorrect: correct }]);
                                setShowQuizResult(true);
                              }} disabled={!selectedAnswer} className="px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold rounded-xl disabled:opacity-50">Submit</button>
                            ) : (
                              <button onClick={() => {
                                if (currentQuestion + 1 >= quizResult.questions.length) { setQuizCompleted(true); }
                                else { setCurrentQuestion(currentQuestion + 1); setSelectedAnswer(''); setShowQuizResult(false); }
                              }} className="px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold rounded-xl">
                                {currentQuestion + 1 >= quizResult.questions.length ? '🏆 See Results' : 'Next →'}
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
                  <div className={`bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-amber-100/50 border border-gray-100 overflow-hidden mb-6 min-w-0 ${!canUseQuiz ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-gray-100 px-3 sm:px-5 py-3 sm:py-4">
                      <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0 overflow-x-auto sm:overflow-visible">
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                            <span className="text-xs font-medium text-gray-500 flex-shrink-0">Type:</span>
                            <div className="flex items-center bg-white rounded-xl px-0.5 sm:px-1 py-1 shadow-sm border border-gray-200">
                              {(['mixed', 'multiple_choice', 'true_false', 'fill_blank'] as const).map((t) => {
                                const locked = !isPremiumUser && t !== 'mixed';
                                return (
                                  <button key={t} onClick={() => !locked && setQuizType(t)} disabled={locked} title={locked ? 'Premium only' : ''}
                                    className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                                      locked ? 'text-gray-300 cursor-not-allowed' :
                                      quizType === t ? 'bg-amber-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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
                            <span className="text-xs font-medium text-gray-500">Difficulty:</span>
                            <div className="flex items-center bg-white rounded-xl px-0.5 sm:px-1 py-1 shadow-sm border border-gray-200">
                              {(['easy', 'medium', 'hard'] as const).map((d) => {
                                const locked = !isPremiumUser && d !== 'medium';
                                return (
                                  <button key={d} onClick={() => !locked && setQuizDifficulty(d)} disabled={locked} title={locked ? 'Premium only' : ''}
                                    className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                                      locked ? 'text-gray-300 cursor-not-allowed' :
                                      quizDifficulty === d ? 'bg-amber-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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
                      <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 bg-gray-50/50 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-amber-400"></div>
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
                                <div className="w-12 h-12 border-4 border-amber-200 rounded-full"></div>
                                <div className="absolute top-0 left-0 w-12 h-12 border-4 border-amber-600 rounded-full border-t-transparent animate-spin"></div>
                              </div>
                              <p className="text-sm font-medium text-gray-600">Creating quiz questions...</p>
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
                )}
              </>
            )}

            {/* ============ FLASHCARD SUB-MODE ============ */}
            {studyToolMode === 'flashcards' && (
              <>
                {/* Flashcard Interactive View */}
                {flashcardResult && flashcardResult.cards?.length > 0 ? (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                      <h3 className="text-lg font-bold text-gray-900">{flashcardResult.title}</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        {isPaidUser ? (
                          <>
                            <button onClick={exportFlashcardsToPDF} className="px-3 py-1.5 bg-red-50 text-red-700 font-medium rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1.5 text-xs">
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                              PDF
                            </button>
                            <button onClick={exportFlashcardsToDOCX} className="px-3 py-1.5 bg-blue-50 text-blue-700 font-medium rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1.5 text-xs">
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
                        <button onClick={() => { setFlashcardResult(null); setCurrentCard(0); setIsFlipped(false); setKnownCards(new Set()); }}
                          className="px-4 py-2 text-sm text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 font-medium">
                          New Deck
                        </button>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="flex items-center gap-3 mb-5">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300" style={{ width: `${((currentCard + 1) / flashcardResult.cards.length) * 100}%` }}></div>
                      </div>
                      <span className="text-xs text-gray-500 font-medium">{currentCard + 1} / {flashcardResult.cards.length}</span>
                      {knownCards.size > 0 && <span className="text-xs text-green-600 font-medium">{knownCards.size} mastered</span>}
                    </div>
                    {/* The flip card */}
                    <div
                      onClick={() => setIsFlipped(!isFlipped)}
                      className="relative cursor-pointer select-none mx-auto max-w-2xl mb-6"
                      style={{ perspective: '1000px' }}
                    >
                      <div
                        className="relative w-full transition-transform duration-500"
                        style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
                      >
                        {/* Front */}
                        <div className="w-full min-h-[280px] sm:min-h-[320px] bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-lg"
                          style={{ backfaceVisibility: 'hidden' }}>
                          <span className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-4">Front</span>
                          <p className="text-xl sm:text-2xl font-semibold text-gray-900 leading-relaxed">{flashcardResult.cards[currentCard]?.front}</p>
                          <p className="text-xs text-amber-400 mt-6">Click to flip</p>
                        </div>
                        {/* Back */}
                        <div className="absolute inset-0 w-full min-h-[280px] sm:min-h-[320px] bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-lg"
                          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                          <span className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-4">Back</span>
                          <p className="text-lg sm:text-xl text-gray-800 leading-relaxed">{flashcardResult.cards[currentCard]?.back}</p>
                          <p className="text-xs text-blue-400 mt-6">Click to flip back</p>
                        </div>
                      </div>
                    </div>
                    {/* Navigation + Know/Don't Know */}
                    <div className="flex items-center justify-center gap-3 flex-wrap">
                      <button onClick={() => { setCurrentCard(Math.max(0, currentCard - 1)); setIsFlipped(false); }}
                        disabled={currentCard === 0}
                        className="px-4 py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-30 transition-all">
                        ← Previous
                      </button>
                      <button onClick={() => {
                          const newKnown = new Set(knownCards);
                          if (newKnown.has(currentCard)) newKnown.delete(currentCard); else newKnown.add(currentCard);
                          setKnownCards(newKnown);
                        }}
                        className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                          knownCards.has(currentCard) ? 'bg-green-500 text-white shadow-md' : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                        }`}>
                        {knownCards.has(currentCard) ? '✓ Mastered' : 'Mark as Known'}
                      </button>
                      <button onClick={() => { setCurrentCard(Math.min(flashcardResult.cards.length - 1, currentCard + 1)); setIsFlipped(false); }}
                        disabled={currentCard >= flashcardResult.cards.length - 1}
                        className="px-4 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-700 hover:to-orange-700 disabled:opacity-30 transition-all">
                        Next →
                      </button>
                    </div>
                    {/* Summary when all reviewed */}
                    {knownCards.size === flashcardResult.cards.length && (
                      <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl text-center">
                        <span className="text-4xl mb-2 block">🎉</span>
                        <h3 className="text-xl font-bold text-green-800">All cards mastered!</h3>
                        <p className="text-green-600 text-sm mt-1">You've marked all {flashcardResult.cards.length} cards as known. Great job!</p>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Flashcard Input Form */
                  <div className={`bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-amber-100/50 border border-gray-100 overflow-hidden mb-6 min-w-0 ${!canUseQuiz ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-gray-100 px-3 sm:px-5 py-3 sm:py-4">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-gray-500">Cards:</span>
                            <select value={isFreeUser ? 15 : flashcardCount}
                              onChange={(e) => !isFreeUser && setFlashcardCount(Number(e.target.value))}
                              disabled={isFreeUser}
                              className={`px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium ${isFreeUser ? 'opacity-50 cursor-not-allowed' : ''}`}>
                              {isFreeUser ? <option value={15}>15</option> : [5, 10, 15, 20, 25, 30].map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                          </div>
                        </div>
                        <button
                          onClick={handleSubmit}
                          disabled={!isTextValid() || isGeneratingFlashcards || !canUseQuiz}
                          className={`w-full sm:w-auto px-6 py-2.5 rounded-xl flex items-center justify-center transition-all font-semibold text-sm flex-shrink-0 ${
                            isTextValid() && !isGeneratingFlashcards && canUseQuiz
                              ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg shadow-amber-200 cursor-pointer'
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
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
                            <>🃏 Generate Flashcards</>
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 bg-gray-50/50 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Source Material</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setInputText('')} className={`text-xs text-gray-400 hover:text-gray-600 ${!inputText ? 'invisible' : ''}`}>Clear</button>
                          <button onClick={() => navigator.clipboard.readText().then(text => setInputText(text))} className="text-xs text-amber-600 hover:text-amber-700 font-medium">Paste</button>
                        </div>
                      </div>
                      <div className="relative">
                        {isGeneratingFlashcards ? (
                          <div className="min-h-[350px] flex items-center justify-center">
                            <div className="flex flex-col items-center gap-4">
                              <div className="relative">
                                <div className="w-12 h-12 border-4 border-amber-200 rounded-full"></div>
                                <div className="absolute top-0 left-0 w-12 h-12 border-4 border-amber-600 rounded-full border-t-transparent animate-spin"></div>
                              </div>
                              <p className="text-sm font-medium text-gray-600">Creating your flashcard deck...</p>
                            </div>
                          </div>
                        ) : (
                          <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Paste your study notes, textbook content, or any material to turn into flashcards..."
                            className="w-full min-h-[300px] sm:min-h-[350px] p-3 sm:p-5 text-gray-800 text-[15px] border-none outline-none resize-none bg-transparent placeholder-gray-400 leading-relaxed"
                          />
                        )}
                      </div>
                      <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 bg-gray-50/30 border-t border-gray-100">
                        <span className={`text-xs font-medium ${
                          getWordCount(inputText) < 50 ? 'text-amber-600' :
                          (isFreeUser && getWordCount(inputText) > quizUsage.maxWordsPerGeneration) ? 'text-red-600' :
                          'text-gray-400'
                        }`}>
                          {getWordCount(inputText)} words
                          {getWordCount(inputText) < 50 && ' (min 50)'}
                          {isFreeUser && getWordCount(inputText) > quizUsage.maxWordsPerGeneration && ` (max ${quizUsage.maxWordsPerGeneration.toLocaleString()})`}
                        </span>
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
                          className="px-4 py-2 text-sm text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 font-medium">
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
                        <div className={`mb-4 p-4 rounded-2xl text-center ${total === 0 ? 'bg-gray-50 border border-gray-200' : correct === total ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
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
                        className="bg-white rounded-2xl border border-gray-200 p-4 overflow-x-auto focus:outline-none focus:ring-2 focus:ring-amber-400"
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
                                        selectedClue === pw.number ? 'border-amber-400 bg-amber-50 shadow-sm' :
                                        isCorrect ? 'border-green-300 bg-green-50' :
                                        isWrong ? 'border-red-300 bg-red-50' :
                                        isNotAttempted ? 'border-gray-200 bg-gray-50 opacity-60' :
                                        'border-gray-200 hover:border-gray-300 bg-white'
                                      }`}>
                                      <div className="flex items-start gap-2 mb-2">
                                        <span className="text-xs font-bold text-amber-600 bg-amber-100 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">{pw.number}</span>
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
                  <div className={`bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-amber-100/50 border border-gray-100 overflow-hidden mb-6 min-w-0 ${!canUseQuiz ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-gray-100 px-3 sm:px-5 py-3 sm:py-4">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-gray-500">Words:</span>
                            <select value={isFreeUser ? 10 : crosswordWordCount}
                              onChange={(e) => !isFreeUser && setCrosswordWordCount(Number(e.target.value))}
                              disabled={isFreeUser}
                              className={`px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium ${isFreeUser ? 'opacity-50 cursor-not-allowed' : ''}`}>
                              {isFreeUser ? <option value={10}>10</option> : [6, 8, 10, 12, 15].map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                          </div>
                        </div>
                        <button
                          onClick={handleSubmit}
                          disabled={!isTextValid() || isGeneratingCrossword || !canUseQuiz}
                          className={`w-full sm:w-auto px-6 py-2.5 rounded-xl flex items-center justify-center transition-all font-semibold text-sm flex-shrink-0 ${
                            isTextValid() && !isGeneratingCrossword && canUseQuiz
                              ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg shadow-amber-200 cursor-pointer'
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
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
                      <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 bg-gray-50/50 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Source Material</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setInputText('')} className={`text-xs text-gray-400 hover:text-gray-600 ${!inputText ? 'invisible' : ''}`}>Clear</button>
                          <button onClick={() => navigator.clipboard.readText().then(text => setInputText(text))} className="text-xs text-amber-600 hover:text-amber-700 font-medium">Paste</button>
                        </div>
                      </div>
                      <div className="relative">
                        {isGeneratingCrossword ? (
                          <div className="min-h-[350px] flex items-center justify-center">
                            <div className="flex flex-col items-center gap-4">
                              <div className="relative">
                                <div className="w-12 h-12 border-4 border-amber-200 rounded-full"></div>
                                <div className="absolute top-0 left-0 w-12 h-12 border-4 border-amber-600 rounded-full border-t-transparent animate-spin"></div>
                              </div>
                              <p className="text-sm font-medium text-gray-600">Building your crossword puzzle...</p>
                            </div>
                          </div>
                        ) : (
                          <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Paste your study notes or textbook content — key terms will be extracted for the crossword puzzle..."
                            className="w-full min-h-[300px] sm:min-h-[350px] p-3 sm:p-5 text-gray-800 text-[15px] border-none outline-none resize-none bg-transparent placeholder-gray-400 leading-relaxed"
                          />
                        )}
                      </div>
                      <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 bg-gray-50/30 border-t border-gray-100">
                        <span className={`text-xs font-medium ${
                          getWordCount(inputText) < 50 ? 'text-amber-600' :
                          (isFreeUser && getWordCount(inputText) > quizUsage.maxWordsPerGeneration) ? 'text-red-600' :
                          'text-gray-400'
                        }`}>
                          {getWordCount(inputText)} words
                          {getWordCount(inputText) < 50 && ' (min 50)'}
                          {isFreeUser && getWordCount(inputText) > quizUsage.maxWordsPerGeneration && ` (max ${quizUsage.maxWordsPerGeneration.toLocaleString()})`}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ============ CRATER BLAST SUB-MODE ============ */}
            {studyToolMode === 'crater_blast' && (
              <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-gray-100 overflow-hidden mb-6">
                <div className="p-8 sm:p-10 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)' }}>
                    <span className="text-3xl">💥</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Crater Blast</h3>
                  <p className="text-gray-600 text-sm max-w-md mx-auto mb-6">
                    AI-generated quiz craters fall from the sky. Aim your cannon and blast the correct answer before it lands. Build streaks and test your reflexes!
                  </p>
                  <button
                    onClick={() => onNavigate('crater-blast')}
                    className="px-6 py-3 rounded-xl font-semibold text-white transition-all hover:shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)' }}
                  >
                    Play Crater Blast →
                  </button>
                </div>
              </div>
            )}

            {quizError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl text-center">
                <p className="text-red-700 text-sm font-medium">{quizError}</p>
                {(quizExhausted || quizError.includes('Upgrade')) && (
                  <button onClick={() => onNavigate('pricing')} className="mt-2 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg">
                    View Plans
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {/* Recent Documents */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-900">Recent Documents</h2>
            {documents.length > 0 && (
              <button onClick={() => onNavigate('library')} className="text-base text-blue-600 hover:text-blue-700 font-medium">
                View all →
              </button>
            )}
              </div>
          
            {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 3 }).map((_, i) => <DocumentCardSkeleton key={i} />)}
            </div>
            ) : documents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {documents.slice(0, 6).map((doc) => (
                <div 
                  key={doc.id}
                  className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => onNavigate('library')}
              >
                <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    {doc.hasAnalysis && (
                      <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded">Analyzed</span>
                    )}
                  </div>
                  <h3 className="font-medium text-gray-900 text-base mb-2 truncate">{doc.title}</h3>
                  <p className="text-sm text-gray-500">
                    {doc.fileType?.toUpperCase() || 'DOC'} • {doc.wordCount || 0} words • {new Date(doc.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
            ) : (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-100">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              </div>
              <p className="text-gray-500 text-base">No documents yet</p>
              <button onClick={() => onNavigate('upload')} className="mt-4 text-base text-blue-600 hover:text-blue-700 font-medium">
                Upload your first document →
              </button>
            </div>
          )}
        </div>
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

      {/* Export Upgrade Modal (for locked export features) */}
      {showExportUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Unlock Export Feature</h3>
              <p className="text-gray-600">
                Export your quizzes, flashcards, and crosswords to PDF or Word documents with a paid plan.
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 mb-6">
              <h4 className="font-semibold text-amber-900 mb-3">Paid Plan Benefits:</h4>
              <ul className="space-y-2 text-sm text-amber-800">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Export to PDF & Word documents
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Permanent storage (no 7-day limit)
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Unlimited study tool generations
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  All difficulty & question types
                </li>
              </ul>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowExportUpgradeModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                Maybe Later
              </button>
              <button
                onClick={() => { setShowExportUpgradeModal(false); onNavigate('pricing'); }}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl hover:from-amber-700 hover:to-orange-700 transition-all font-medium"
              >
                View Plans
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Study Event Modal */}
      {showAddEventModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" onClick={() => { setShowAddEventModal(false); setEditingEvent(null); setAddEventError(''); }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="text-xl">📅</span> {editingEvent ? 'Edit' : 'Add'} Study Event
              </h3>
              <button onClick={() => { setShowAddEventModal(false); setEditingEvent(null); setAddEventError(''); }} className="text-stone-400 hover:text-stone-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Event Title *</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={e => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Biology Midterm"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500 text-sm"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Date *</label>
                  <input
                    type="date"
                    value={newEvent.event_date}
                    onChange={e => setNewEvent(prev => ({ ...prev, event_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Time</label>
                  <input
                    type="time"
                    value={newEvent.event_time}
                    onChange={e => setNewEvent(prev => ({ ...prev, event_time: e.target.value }))}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500 text-sm"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Event Type</label>
                  <select
                    value={newEvent.event_type}
                    onChange={e => setNewEvent(prev => ({ ...prev, event_type: e.target.value }))}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500 text-sm"
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
                  <label className="block text-sm font-medium text-stone-700 mb-1">Course</label>
                  <input
                    type="text"
                    value={newEvent.course}
                    onChange={e => setNewEvent(prev => ({ ...prev, course: e.target.value }))}
                    placeholder="e.g. BIO 101"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500 text-sm"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Notes (optional)</label>
                <textarea
                  value={newEvent.notes}
                  onChange={e => setNewEvent(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any additional details..."
                  rows={2}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500 text-sm resize-none"
                />
              </div>
            </div>
            
            {addEventError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {addEventError}
              </div>
            )}
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowAddEventModal(false); setEditingEvent(null); setAddEventError(''); }}
                className="flex-1 px-4 py-2.5 border border-stone-300 text-stone-700 rounded-xl hover:bg-stone-50 transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={editingEvent ? updateStudyEvent : addStudyEvent}
                disabled={!newEvent.title || !newEvent.event_date || addingEvent}
                className="flex-1 px-4 py-2.5 bg-lime-600 text-white rounded-xl hover:bg-lime-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addingEvent ? (editingEvent ? 'Saving...' : 'Adding...') : (editingEvent ? 'Save Changes' : 'Add Event')}
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
