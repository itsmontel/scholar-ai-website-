import { useState, useEffect, type ReactNode } from 'react';
import Header from '../common/Header';
import Footer from '../common/Footer';
import { useTheme } from '../../contexts/ThemeContext';
import AnalysisAnimation from '../common/AnalysisAnimation';
import { FOCUS_MODE_CHROME_EXTENSION_URL } from '../../constants/focusMode';
import { HIDE_FRIENDS } from '../../config/featureFlags';
import ScholarMascot from '../common/ScholarMascot';
import DualMascot from '../common/DualMascot';
import InteractiveDocumentAnalysis from '../landing/InteractiveDocumentAnalysis';
import HeroEssayPreviewCard from '../landing/HeroEssayPreviewCard';
import { DEMO_PAPERS } from '../../data/landingPageDemoAnalysis';
import ViewportAutoplayVideo from '../common/ViewportAutoplayVideo';
interface LandingPageProps {
  onNavigate: (page: string, slug?: string) => void;
  user?: { plan?: string; subscription_plan?: string } | null;
}

const LandingPage = ({ onNavigate, user }: LandingPageProps) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { theme: _theme, toggleTheme: _toggleTheme } = useTheme();
  const [inputText, setInputText] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [mode, setMode] = useState<'analyze' | 'citations' | 'summarize' | 'quiz'>('analyze');
  const [studyToolMode, setStudyToolMode] = useState<'quiz' | 'flashcards' | 'crossword'>('quiz');
  const [citationStyle, setCitationStyle] = useState('APA');
  const [citationYearRange, setCitationYearRange] = useState('all');
  const [showFakeAnimation, setShowFakeAnimation] = useState(false);
  const [showFakeResults, setShowFakeResults] = useState(false);
  const [showFakeCitationResults, setShowFakeCitationResults] = useState(false);
  const [showFakeSummaryResults, setShowFakeSummaryResults] = useState(false);
  const [showFakeQuizResults, setShowFakeQuizResults] = useState(false);
  const [summaryStyle, setSummaryStyle] = useState<'bullet' | 'paragraph' | 'tldr' | 'detailed'>('bullet');
  const [summaryLength, setSummaryLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [quizType, setQuizType] = useState<'mixed' | 'multiple_choice' | 'true_false' | 'fill_blank'>('mixed');
  const [quizDifficulty, setQuizDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [quizQuestionCount, setQuizQuestionCount] = useState(10);
  const [flashcardCount, setFlashcardCount] = useState(15);
  const [crosswordWordCount, setCrosswordWordCount] = useState(10);
  const [activeHelpCategory, setActiveHelpCategory] = useState('essays');
  const [activeStudyTab, setActiveStudyTab] = useState('analyse');
  const [studyCardsCarouselIndex, setStudyCardsCarouselIndex] = useState(0);

  const helpCategories = [
    {
      id: 'essays',
      label: 'Essays',
      title: 'Essays',
      description: 'Build a clear structure, develop strong arguments, and craft compelling conclusions. WriteScholar helps you maintain academic tone while ensuring your ideas shine through with clarity and precision.'
    },
    {
      id: 'exams',
      label: 'Exams',
      title: 'Exams',
      description: 'Ace your exams with AI-generated quizzes, flashcards, and crossword puzzles. Turn any notes or textbook content into interactive study tools. Perfect for memorization and last-minute revision.'
    },
    {
      id: 'summarizing',
      label: 'Summarizing',
      title: 'Summarizing',
      description: 'Transform long articles, papers, and textbooks into concise summaries. Get bullet points, TL;DRs, or detailed overviews in seconds. Save time and grasp key concepts faster.'
    },
    {
      id: 'citations',
      label: 'Citations',
      title: 'Citations',
      description: 'Find relevant academic sources instantly, format citations in APA, MLA, Chicago, and more. Never worry about citation errors again with automatic formatting.'
    },
    {
      id: 'grammar',
      label: 'Grammar & Style',
      title: 'Grammar & Style',
      description: 'Catch grammar mistakes, improve sentence clarity, and elevate your academic tone. Our AI identifies issues and suggests improvements in real-time.'
    }
  ];

  const analyzePlaceholders = [
    "Paste your essay or research paper here...",
    "Get instant feedback on structure and clarity...",
    "Improve your academic writing in seconds..."
  ];

  const citationPlaceholders = [
    "Enter your research topic to find citations...",
    "What are you researching? Find sources instantly...",
    "Type your essay question and discover literature..."
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

  const flashcardPlaceholders = [
    "Paste your notes to create flashcards...",
    "Turn any content into study cards...",
    "Memorize key concepts with flip cards..."
  ];

  const crosswordPlaceholders = [
    "Paste content to generate a crossword puzzle...",
    "Turn key terms into an interactive puzzle...",
    "Learn vocabulary with crossword clues..."
  ];

  const getStudyToolPlaceholders = () => {
    if (studyToolMode === 'flashcards') return flashcardPlaceholders;
    if (studyToolMode === 'crossword') return crosswordPlaceholders;
    return quizPlaceholders;
  };

  const placeholders = mode === 'summarize' ? summarizePlaceholders
    : mode === 'quiz' ? getStudyToolPlaceholders()
    : mode === 'analyze' ? analyzePlaceholders
    : citationPlaceholders;

  const suggestedTopics = mode === 'analyze' ? [
    "The impact of social media on student mental health",
    "Climate change effects on global agriculture",
    "Artificial intelligence in healthcare",
    "Education's role in economic development",
    "Renewable energy in developing countries",
    "Cultural factors in consumer behavior"
  ] : [
    "Effects of sleep on cognitive function",
    "Social media and political polarization",
    "Machine learning in medical diagnosis",
    "Sustainable urban development",
    "Remote work and productivity",
    "Blockchain in supply chain"
  ];

  const faqs = [
    {
      question: "Is WriteScholar for college and university students?",
      answer: "Yes. WriteScholar is for undergrads and postgrads worldwide—whether you're writing essays in the UK, the US, or elsewhere. Set your education level in the analyzer for feedback that fits your course. We support major citation styles (APA, MLA, Chicago, Harvard, and more). High school options are available too."
    },
    {
      question: "How does the essay analyzer work?",
      answer: "Paste your essay (200+ words) or upload a PDF/DOCX/TXT file. Our AI analyzes structure, clarity, argument, citations, and academic tone — like a professor would. You get detailed feedback with specific suggestions in under 60 seconds."
    },
    {
      question: "What kind of feedback will I get on my essay?",
      answer: "You get section-by-section annotations (green for strong, yellow for improve, red for concerns), an overall grade-level rubric, and actionable improvement suggestions. It covers structure, argument quality, clarity, citations, and academic style."
    },
    {
      question: "How long does essay analysis take?",
      answer: "Usually under 60 seconds. Paste your essay, click Analyze Text, and you'll see professor-style feedback with a full rubric and improvement tips. Free plan includes 2 analyses per month."
    },
    {
      question: "Can I upload a Word or PDF file?",
      answer: "Yes. Upload PDF, DOCX, DOC, or TXT files directly. Or paste your text into the box. Both work for analysis. Files are processed securely and never shared."
    },
    {
      question: "How does Focus Mode work?",
      answer: "Focus Mode blocks distracting sites like YouTube, TikTok, and Instagram until you solve a puzzle (Sudoku, Memory, Pattern) or answer quiz questions from your own study notes. Pick the sites to block, add your material, and when you try to visit a blocked site you face a puzzle or short quiz. Pass it and the site unlocks. It's a Chrome extension."
    },
    {
      question: "Can I block YouTube and TikTok until I study?",
      answer: "Yes! Focus Mode lets you block any sites you choose. When you try to visit one, you solve a puzzle (Sudoku, Memory, Pattern) or answer a quiz from your own notes. Pass the puzzle or quiz and you earn access. Create a Study Pack or flashcards first, then connect the Chrome extension."
    },
    {
      question: "Can I create study quizzes from my notes?",
      answer: "Yes! The Study Pack turns any text into lessons, flashcards, quizzes, crosswords, and Crater Blast. Paste your notes or upload a document. Free users get lesson and flashcards; quiz, crossword and Crater Blast unlock with Pro."
    },
    {
      question: "What citation styles are supported?",
      answer: "We support APA 7th edition, MLA 9th edition, Chicago (notes-bibliography and author-date), Harvard, IEEE, and Vancouver. The citation finder searches academic databases for relevant sources."
    },
    {
      question: "Is my content private and secure?",
      answer: "Yes. We use enterprise-grade encryption. Your content is never shared with third parties or used to train AI models. You can delete your documents at any time."
    },
    {
      question: "What's the difference between Free, Pro, and Premium?",
      answer: "Free: 3 documents, 2 analyses, 2 study packs, 5k words, 2 citations per month, Focus Mode (3 sites). Pro: 99 combined analyses, study packs and citations per month, 99,999 words, all citation styles, PDF/Word export, Focus Mode (20 sites). Premium: 10× usage with 999 combined per month, 999,999 words, larger document uploads (1GB), premium AI, Focus Mode unlimited, priority support."
    },
    {
      question: "How do I add friends and share my study materials?",
      answer: "Every account gets a unique friend code. Share your code with friends so they can add you. Once connected, you can share flashcards, quizzes, crosswords, or notes with one tap. They tap Accept and it's in their library. Core sharing is free."
    }
  ].filter(faq => !HIDE_FRIENDS || !faq.question.toLowerCase().includes('friends'));

  const universities = [
    { name: 'Harvard', className: 'university-harvard' },
    { name: 'Oxford', className: 'university-oxford' },
    { name: 'Stanford', className: 'university-stanford' },
    { name: 'MIT', className: 'university-mit' },
    { name: 'Cambridge', className: 'university-cambridge' },
    { name: 'Yale', className: 'university-yale' },
    { name: 'Princeton', className: 'university-princeton' },
    { name: 'Florida State', className: 'university-florida-state' },
    { name: 'UCLA', className: 'university-ucla' },
    { name: 'Berkeley', className: 'university-berkeley' },
    { name: 'Columbia', className: 'university-columbia' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isFocused) {
        setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
      }
    }, 3500);
    return () => clearInterval(interval);
  }, [isFocused, placeholders.length]);

  const handleSubmit = () => {
    if (!inputText.trim()) return;
    setShowFakeAnimation(true);
    if (mode === 'citations') {
      localStorage.setItem('pendingCitationSearch', JSON.stringify({
        topic: inputText,
        style: citationStyle,
        yearRange: citationYearRange
      }));
      setTimeout(() => {
        setShowFakeAnimation(false);
        setShowFakeCitationResults(true);
      }, 15000);
    } else if (mode === 'summarize') {
      localStorage.setItem('pendingSummary', JSON.stringify({
        text: inputText,
        style: summaryStyle,
        length: summaryLength
      }));
      setTimeout(() => {
        setShowFakeAnimation(false);
        setShowFakeSummaryResults(true);
      }, 6000);
    } else if (mode === 'quiz') {
      localStorage.setItem('pendingStudyTool', JSON.stringify({
        text: inputText,
        studyToolMode,
        quizType,
        difficulty: quizDifficulty,
        questionCount: quizQuestionCount,
        flashcardCount,
        crosswordWordCount
      }));
      setTimeout(() => {
        setShowFakeAnimation(false);
        setShowFakeQuizResults(true);
      }, 14000);
    } else {
      localStorage.setItem('pendingAnalysis', JSON.stringify({ text: inputText }));
      setTimeout(() => {
        setShowFakeAnimation(false);
        setShowFakeResults(true);
      }, 15000);
    }
  };

  const handleContinueToSignup = () => {
    setShowFakeResults(false);
    setShowFakeCitationResults(false);
    setShowFakeSummaryResults(false);
    setShowFakeQuizResults(false);
    onNavigate('signup');
  };

  const handleContinueToSignupFromCitations = () => {
    setShowFakeCitationResults(false);
    onNavigate('signup');
  };

  const handleTopicClick = (topic: string) => {
    setInputText(topic);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Store file info for signup flow
    localStorage.setItem('pendingAnalysis', JSON.stringify({ 
      fileName: file.name,
      fileType: file.type,
      fromUpload: true 
    }));
    
    // Show the same animation and results as paste
    setShowFakeAnimation(true);
    setTimeout(() => {
      setShowFakeAnimation(false);
      setShowFakeResults(true);
    }, 15000);
    
    // Reset the input so the same file can be selected again
    e.target.value = '';
  };

  // Character illustration - man peeking over the right edge of the text box
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
      <div className="absolute hidden sm:block -right-8 xl:-right-16 pointer-events-none z-20" style={{ top: '-110px', width: '120px', height: '160px' }}>
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

  const StudyCard = ({
    title,
    desc,
    onClick,
    gradient,
    accentClasses,
    borderColor,
    icon,
    innerContent,
  }: {
    title: string;
    desc: string;
    onClick: () => void;
    gradient: string;
    accentClasses: { title: string; orb: string; iconBg: string };
    borderColor: string;
    icon: string;
    innerContent: ReactNode;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`group relative bg-gradient-to-br ${gradient} rounded-3xl p-6 text-left hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 ease-out overflow-hidden border ${borderColor} h-[310px] flex flex-col`}
    >
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full -translate-y-1/2 translate-x-1/2 ${accentClasses.orb}`} />
      <h3 className={`text-xl font-bold mb-3 relative z-10 flex-shrink-0 ${accentClasses.title}`}>{title}</h3>
      <div className="relative z-10 bg-white dark:bg-stone-800 rounded-2xl p-5 shadow-lg mb-4 h-[140px] flex flex-col justify-center overflow-hidden">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 text-lg flex-shrink-0 ${accentClasses.iconBg}`}>
          {icon}
        </div>
        {innerContent}
      </div>
      <p className="text-stone-800 dark:text-stone-200 text-sm relative z-10 font-semibold">{desc}</p>
    </button>
  );

  const MobileStudyCard = ({
    title,
    desc,
    onClick,
    gradient,
    accentClasses,
    borderColor,
    icon,
    children,
  }: {
    title: string;
    desc: string;
    onClick: () => void;
    gradient: string;
    accentClasses: { title: string; orb: string; iconBg: string };
    borderColor: string;
    icon: string;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full text-left bg-gradient-to-br ${gradient} rounded-2xl p-4 border ${borderColor} hover:shadow-lg active:scale-[0.98] transition-all`}
    >
      <div className="flex flex-col items-center gap-2 mb-3 relative">
        <div className={`absolute top-0 right-0 w-24 h-24 rounded-full -translate-y-1/2 translate-x-1/2 ${accentClasses.orb} opacity-90`} />
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 relative z-10 ${accentClasses.iconBg}`}>
          {icon}
        </div>
        <h3 className={`font-bold text-base text-center relative z-10 ${accentClasses.title}`}>{title}</h3>
      </div>
      <div className="relative z-10 bg-white dark:bg-stone-800 rounded-xl p-3 shadow-sm mb-3 h-[100px] flex items-center justify-center overflow-hidden w-full">
        {children}
      </div>
      <p className="text-stone-800 dark:text-stone-200 text-xs leading-snug text-center font-semibold">{desc}</p>
    </button>
  );

  const scrollToLandingTools = () => {
    document.getElementById('landing-tools')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const heroFeatureCards = [
    {
      title: 'Analyze',
      desc: 'Get professor-style feedback on your essays',
      onClick: () => {
        setMode('analyze');
        scrollToLandingTools();
      },
      gradient: 'from-lime-200 to-emerald-200 dark:from-lime-950/60 dark:to-emerald-950/55',
      accentClasses: { title: 'text-lime-950 dark:text-lime-200', orb: 'bg-lime-600/40', iconBg: 'bg-lime-300 dark:bg-lime-950/70' },
      borderColor: 'border-lime-400/90 dark:border-lime-600/70',
      icon: '📝',
      inner: (
        <div className="space-y-2">
          <div className="h-2 bg-stone-400/80 dark:bg-stone-600 rounded-full overflow-hidden"><div className="h-full w-full bg-lime-700 dark:bg-lime-500 rounded-full animate-line-grow origin-left" style={{ animationDelay: '0.2s' }} /></div>
          <div className="h-2 bg-stone-400/80 dark:bg-stone-600 rounded-full overflow-hidden"><div className="h-full w-full bg-lime-700 dark:bg-lime-500 rounded-full animate-line-grow origin-left" style={{ animationDelay: '0.6s' }} /></div>
          <div className="h-2 bg-stone-400/80 dark:bg-stone-600 rounded-full overflow-hidden"><div className="h-full w-full bg-lime-800 dark:bg-lime-400 rounded-full animate-line-grow origin-left" style={{ animationDelay: '1s' }} /></div>
        </div>
      ),
      mobileContent: (
        <div className="w-full space-y-2">
          <div className="h-2.5 bg-stone-200 dark:bg-stone-600 rounded-full overflow-hidden origin-left">
            <div className="h-full w-full bg-lime-600 dark:bg-lime-500 rounded-full animate-line-grow" style={{ animationDelay: '0.2s' }} />
          </div>
          <div className="h-2.5 bg-stone-200 dark:bg-stone-600 rounded-full overflow-hidden origin-left">
            <div className="h-full w-full bg-lime-600 dark:bg-lime-500 rounded-full animate-line-grow" style={{ animationDelay: '0.6s' }} />
          </div>
          <div className="h-2.5 bg-stone-200 dark:bg-stone-600 rounded-full overflow-hidden origin-left">
            <div className="h-full w-full bg-lime-700 dark:bg-lime-400 rounded-full animate-line-grow" style={{ animationDelay: '1s' }} />
          </div>
        </div>
      ),
    },
    {
      title: 'Citations',
      desc: 'Find and format academic sources instantly',
      onClick: () => {
        setMode('citations');
        scrollToLandingTools();
      },
      gradient: 'from-cyan-200 to-teal-200 dark:from-cyan-950/55 dark:to-teal-950/55',
      accentClasses: { title: 'text-teal-950 dark:text-teal-200', orb: 'bg-teal-600/40', iconBg: 'bg-teal-300 dark:bg-teal-950/70' },
      borderColor: 'border-teal-400/90 dark:border-teal-600/70',
      icon: '🔍',
      inner: (
        <div className="space-y-1.5">
          <div className="text-[9px] text-teal-950 dark:text-teal-200 font-mono opacity-0 animate-fade-slide-in" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>Smith, J. (2024). Title...</div>
          <div className="text-[9px] text-teal-950 dark:text-teal-200 font-mono opacity-0 animate-fade-slide-in" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>Jones, M. (2023). Study...</div>
          <div className="flex gap-1 mt-2">
            <span className="px-1.5 py-0.5 bg-teal-300 dark:bg-teal-900/70 text-teal-950 dark:text-teal-100 text-[9px] rounded font-bold">APA</span>
            <span className="px-1.5 py-0.5 bg-stone-300 dark:bg-stone-700 text-stone-700 dark:text-stone-300 text-[9px] rounded font-semibold">MLA</span>
          </div>
        </div>
      ),
      mobileContent: (
        <div className="w-full space-y-2 text-left">
          <div className="text-[10px] text-teal-800 dark:text-teal-200 font-mono truncate opacity-0 animate-fade-slide-in" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
            Smith, J. (2024). Title...
          </div>
          <div className="text-[10px] text-teal-800 dark:text-teal-200 font-mono truncate opacity-0 animate-fade-slide-in" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
            Jones, M. (2023). Study...
          </div>
          <div className="flex gap-1.5 mt-1">
            <span className="px-2 py-0.5 bg-teal-300 dark:bg-teal-900/50 text-teal-950 dark:text-teal-100 text-[10px] rounded font-bold">APA</span>
            <span className="px-2 py-0.5 bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300 text-[10px] rounded font-medium">MLA</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Flashcards',
      desc: 'Generate flashcards from any content',
      onClick: () => {
        setMode('quiz');
        setStudyToolMode('flashcards');
        scrollToLandingTools();
      },
      gradient: 'from-pink-200 to-rose-200 dark:from-rose-950/55 dark:to-pink-950/50',
      accentClasses: { title: 'text-rose-950 dark:text-rose-200', orb: 'bg-rose-600/40', iconBg: 'bg-rose-300 dark:bg-rose-950/70' },
      borderColor: 'border-rose-400/90 dark:border-rose-600/70',
      icon: '🃏',
      inner: (
        <div className="h-16" style={{ perspective: '120px' }}>
          <div className="relative h-full animate-flashcard-flip" style={{ transformStyle: 'preserve-3d' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-rose-800 to-pink-900 rounded-xl p-2.5 flex flex-col justify-center shadow-inner" style={{ backfaceVisibility: 'hidden' }}>
              <div className="text-white/95 text-[9px]">Term</div>
              <div className="text-white font-semibold text-xs">Photosynthesis</div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-pink-900 to-rose-950 rounded-xl p-2.5 flex flex-col justify-center items-center shadow-inner" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
              <div className="text-white text-[9px]">Definition</div>
              <div className="text-white font-medium text-xs text-center">Process plants use...</div>
            </div>
          </div>
        </div>
      ),
      mobileContent: (
        <div className="relative w-full h-full min-h-[72px]" style={{ perspective: '120px' }}>
          <div className="absolute inset-0 animate-flashcard-flip" style={{ transformStyle: 'preserve-3d' }}>
            <div
              className="absolute inset-0 flex flex-col justify-center items-center bg-gradient-to-br from-rose-800 to-pink-900 rounded-lg p-2 shadow-inner"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className="text-white/90 text-[10px]">Term</div>
              <div className="font-semibold text-white text-sm">Photosynthesis</div>
            </div>
            <div
              className="absolute inset-0 flex flex-col justify-center items-center bg-gradient-to-br from-pink-900 to-rose-950 rounded-lg p-2 text-center shadow-inner"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <div className="text-white text-[10px]">Definition</div>
              <div className="text-white text-xs">Process plants use...</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Practice Tests',
      desc: 'Create quizzes from your study material',
      onClick: () => {
        setMode('quiz');
        setStudyToolMode('quiz');
        scrollToLandingTools();
      },
      gradient: 'from-amber-200 to-orange-200 dark:from-amber-950/55 dark:to-orange-950/50',
      accentClasses: { title: 'text-orange-950 dark:text-orange-200', orb: 'bg-orange-600/40', iconBg: 'bg-amber-300 dark:bg-amber-950/70' },
      borderColor: 'border-orange-400/90 dark:border-orange-600/65',
      icon: '📋',
      inner: (
        <div className="relative h-14">
          <div className="absolute inset-0 animate-quiz-show">
            <div className="text-[10px] text-stone-700 dark:text-stone-300 mb-1 font-semibold">Q: What is 2 + 2?</div>
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-amber-300 dark:bg-amber-900/70 text-amber-950 dark:text-amber-100 text-[9px] rounded font-bold">A</span>
              <span className="px-2 py-1 bg-stone-300 dark:bg-stone-700 text-stone-700 dark:text-stone-300 text-[9px] rounded font-medium">B</span>
              <span className="px-2 py-1 bg-stone-300 dark:bg-stone-700 text-stone-700 dark:text-stone-300 text-[9px] rounded font-medium">C</span>
            </div>
          </div>
          <div className="absolute inset-0 animate-quiz-hide flex flex-col justify-center">
            <div className="text-[10px] text-stone-700 dark:text-stone-300 mb-1 font-semibold">Correct!</div>
            <div className="text-orange-800 dark:text-orange-400 font-bold text-sm">✓ 4</div>
          </div>
        </div>
      ),
      mobileContent: (
        <div className="relative w-full min-h-[72px]">
          <div className="absolute inset-0 animate-quiz-show">
            <div className="text-[10px] text-stone-600 dark:text-stone-400 mb-1 font-semibold">Q: What is 2 + 2?</div>
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-amber-300 dark:bg-amber-900/50 text-amber-950 dark:text-amber-100 text-[10px] rounded font-bold">A</span>
              <span className="px-2 py-1 bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300 text-[10px] rounded font-medium">B</span>
              <span className="px-2 py-1 bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300 text-[10px] rounded font-medium">C</span>
            </div>
          </div>
          <div className="absolute inset-0 flex flex-col justify-center animate-quiz-hide">
            <div className="text-[10px] text-stone-600 dark:text-stone-400 mb-1 font-semibold">Correct!</div>
            <div className="text-orange-700 dark:text-orange-400 font-bold text-sm">✓ 4</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Summarize',
      desc: 'Turn long papers into concise bullet points',
      onClick: () => {
        setMode('summarize');
        scrollToLandingTools();
      },
      gradient: 'from-emerald-200 to-teal-200 dark:from-emerald-950/55 dark:to-teal-950/55',
      accentClasses: { title: 'text-emerald-950 dark:text-emerald-200', orb: 'bg-emerald-600/40', iconBg: 'bg-emerald-300 dark:bg-emerald-950/70' },
      borderColor: 'border-emerald-400/90 dark:border-emerald-600/70',
      icon: '📝',
      inner: (
        <div className="space-y-2">
          <div className="flex gap-1.5 items-center">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-700 flex-shrink-0" />
            <div className="h-2 bg-stone-400/90 dark:bg-stone-600 rounded-full flex-1 overflow-hidden origin-left"><div className="h-full bg-emerald-700 dark:bg-emerald-500 rounded-full animate-summarize-shrink" /></div>
          </div>
          <div className="flex gap-1.5 items-center">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-700 flex-shrink-0" />
            <div className="h-2 bg-stone-400/90 dark:bg-stone-600 rounded-full flex-1 overflow-hidden origin-left"><div className="h-full w-full bg-emerald-700 dark:bg-emerald-500 rounded-full animate-summarize-shrink" style={{ animationDelay: '0.3s' }} /></div>
          </div>
          <div className="flex gap-1.5 items-center">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-700 flex-shrink-0" />
            <div className="h-2 bg-stone-400/90 dark:bg-stone-600 rounded-full flex-1 overflow-hidden origin-left"><div className="h-full w-full bg-emerald-800 dark:bg-emerald-400 rounded-full animate-summarize-shrink" style={{ animationDelay: '0.6s' }} /></div>
          </div>
        </div>
      ),
      mobileContent: (
        <div className="w-full space-y-2">
          <div className="flex gap-2 items-center">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
            <div className="h-2 flex-1 bg-stone-200 dark:bg-stone-600 rounded-full overflow-hidden origin-left">
              <div className="h-full w-full bg-emerald-600 dark:bg-emerald-500 rounded-full animate-summarize-shrink" />
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
            <div className="h-2 flex-1 bg-stone-200 dark:bg-stone-600 rounded-full overflow-hidden origin-left">
              <div className="h-full w-full bg-emerald-600 dark:bg-emerald-500 rounded-full animate-summarize-shrink" style={{ animationDelay: '0.3s' }} />
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
            <div className="h-2 flex-1 bg-stone-200 dark:bg-stone-600 rounded-full overflow-hidden origin-left">
              <div className="h-full w-full bg-emerald-700 dark:bg-emerald-400 rounded-full animate-summarize-shrink" style={{ animationDelay: '0.6s' }} />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Study Tools',
      desc: 'Quizzes, flashcards & crosswords',
      onClick: () => {
        setMode('quiz');
        setStudyToolMode('quiz');
        scrollToLandingTools();
      },
      gradient: 'from-lime-200 to-green-200 dark:from-lime-950/55 dark:to-green-950/55',
      accentClasses: { title: 'text-lime-950 dark:text-lime-200', orb: 'bg-lime-600/40', iconBg: 'bg-lime-300 dark:bg-lime-950/70' },
      borderColor: 'border-lime-400/90 dark:border-lime-600/70',
      icon: '🎯',
      inner: (
        <div className="flex gap-2">
          <div className="flex-1 text-center py-2 px-2 bg-lime-300 dark:bg-lime-950/70 rounded-lg text-lime-950 dark:text-lime-100 text-xs font-bold animate-tool-show-1 border border-lime-500/70 dark:border-lime-600/60">📝 Quiz</div>
          <div className="flex-1 text-center py-2 px-2 bg-lime-300 dark:bg-lime-950/70 rounded-lg text-lime-950 dark:text-lime-100 text-xs font-bold animate-tool-show-2 border border-lime-500/70 dark:border-lime-600/60">🃏 Cards</div>
          <div className="flex-1 text-center py-2 px-2 bg-lime-300 dark:bg-lime-950/70 rounded-lg text-lime-950 dark:text-lime-100 text-xs font-bold animate-tool-show-3 border border-lime-500/70 dark:border-lime-600/60">🧩 Puzzle</div>
        </div>
      ),
      mobileContent: (
        <div className="w-full flex gap-2">
          <div className="flex-1 py-2 px-1 bg-lime-300 dark:bg-lime-950/70 rounded-lg text-lime-950 dark:text-lime-100 text-[11px] font-bold text-center animate-tool-show-1 border border-lime-500/70 dark:border-lime-600/60 truncate">
            📝 Quiz
          </div>
          <div className="flex-1 py-2 px-1 bg-lime-300 dark:bg-lime-950/70 rounded-lg text-lime-950 dark:text-lime-100 text-[11px] font-bold text-center animate-tool-show-2 border border-lime-500/70 dark:border-lime-600/60 truncate">
            🃏 Cards
          </div>
          <div className="flex-1 py-2 px-1 bg-lime-300 dark:bg-lime-950/70 rounded-lg text-lime-950 dark:text-lime-100 text-[11px] font-bold text-center animate-tool-show-3 border border-lime-500/70 dark:border-lime-600/60 truncate">
            🧩 Puzzle
          </div>
        </div>
      ),
    },
    {
      title: 'Crossword',
      desc: 'Generate crosswords from your notes',
      onClick: () => {
        setMode('quiz');
        setStudyToolMode('crossword');
        scrollToLandingTools();
      },
      gradient: 'from-amber-200 to-yellow-200 dark:from-amber-950/55 dark:to-yellow-950/50',
      accentClasses: { title: 'text-amber-950 dark:text-amber-200', orb: 'bg-amber-600/40', iconBg: 'bg-amber-300 dark:bg-amber-950/70' },
      borderColor: 'border-amber-400/90 dark:border-amber-600/70',
      icon: '🧩',
      inner: (
        <div className="grid grid-cols-5 gap-0.5">
          {[
            ['C', 'A', 'T', '#', '#'],
            ['O', '#', '#', '#', '#'],
            ['D', 'O', 'G', '#', '#'],
            ['#', '#', '#', '#', '#'],
            ['#', '#', '#', '#', '#'],
          ].map((row, ri) =>
            row.map((cell, ci) => (
              <div
                key={`${ri}-${ci}`}
                className={`aspect-square flex items-center justify-center rounded-sm text-[10px] font-bold transition-all duration-300 ${
                  cell === '#'
                    ? 'bg-stone-900 dark:bg-black'
                    : 'bg-amber-300 dark:bg-amber-950/65 text-amber-950 dark:text-amber-100 border border-amber-500/80 dark:border-amber-500/60 animate-cell-pop'
                }`}
                style={cell !== '#' ? { animationDelay: `${(ri * 5 + ci) * 50}ms` } : undefined}
              >
                {cell !== '#' ? cell : ''}
              </div>
            ))
          )}
        </div>
      ),
      mobileContent: (
        <div className="w-full mx-auto grid grid-cols-5 gap-0.5 max-h-[88px]">
          {[
            ['C', 'A', 'T', '#', '#'],
            ['O', '#', '#', '#', '#'],
            ['D', 'O', 'G', '#', '#'],
            ['#', '#', '#', '#', '#'],
            ['#', '#', '#', '#', '#'],
          ].map((row, ri) =>
            row.map((cell, ci) => (
              <div
                key={`m-${ri}-${ci}`}
                className={`aspect-square flex items-center justify-center rounded-sm text-[9px] font-bold transition-all duration-300 flex-shrink-0 ${
                  cell === '#'
                    ? 'bg-stone-900 dark:bg-black'
                    : 'bg-amber-300 dark:bg-amber-950/65 text-amber-950 dark:text-amber-100 border border-amber-500/80 dark:border-amber-500/60 animate-cell-pop'
                }`}
                style={cell !== '#' ? { animationDelay: `${(ri * 5 + ci) * 50}ms` } : undefined}
              >
                {cell !== '#' ? cell : ''}
              </div>
            ))
          )}
        </div>
      ),
    },
  ];

  /** 7 cards × (100/7)% width; 4 slides (indices 0–3) */
  const heroCarouselMaxIndex = 3;
  const heroCarouselCardBasis = `${100 / 7}%`;
  const heroCarouselTranslateStep = 100 / 7;

  return (
    <>
      <Header onNavigate={onNavigate} user={user} sticky={true} currentPage="landing" />
      <main className="min-h-screen relative transition-colors font-sans overflow-x-hidden xl:overflow-x-visible" role="main">
      {/* HERO SECTION - Fun, Gen Z, full of energy */}
      <section className="relative min-h-[70vh] sm:min-h-[85vh] flex flex-col overflow-hidden xl:overflow-visible">
        {/* Background: soft cream with a clearer violet wash */}
        <div className="absolute inset-0 bg-violet-100/75 dark:bg-stone-950" />
        <div className="absolute inset-0 bg-gradient-to-b from-violet-200/35 via-violet-50/50 to-violet-100/40 dark:from-violet-950/50 dark:via-stone-950/90 dark:to-stone-950 pointer-events-none" />
        <div className="absolute inset-0 bg-white/40 dark:bg-stone-900/75" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_125%_85%_at_50%_-5%,rgba(167,139,250,0.14),transparent_56%)] dark:bg-[radial-gradient(ellipse_125%_85%_at_50%_-5%,rgba(139,92,246,0.09),transparent_56%)]" />
        
        {/* Floating shapes for mobile */}
        <div className="absolute top-[12%] left-[8%] w-12 h-12 rounded-2xl bg-violet-300/20 rotate-12 lg:hidden animate-float pointer-events-none" />
        <div className="absolute top-[22%] right-[10%] w-10 h-10 rounded-full bg-violet-300/18 lg:hidden animate-float-delayed pointer-events-none" />
        <div className="absolute top-[45%] left-[6%] w-8 h-8 rounded-lg bg-sky-300/18 -rotate-12 lg:hidden animate-float pointer-events-none" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[55%] right-[8%] w-11 h-11 rounded-2xl bg-emerald-300/18 rotate-6 lg:hidden animate-float-delayed pointer-events-none" />
        <div className="absolute bottom-[35%] left-[10%] w-9 h-9 rounded-full bg-amber-300/18 lg:hidden animate-float pointer-events-none" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-[25%] right-[12%] w-10 h-10 rounded-lg bg-violet-300/20 -rotate-6 lg:hidden animate-float-delayed pointer-events-none" style={{ animationDelay: '0.8s' }} />
        
        {/* Floating tool mockups — hidden xl+ where hero essay previews sit on the sides */}
        <div className="absolute top-[18%] left-[10%] xl:left-[12%] z-[1] pointer-events-none hidden lg:block xl:hidden animate-float">
          <div className="bg-white dark:bg-stone-800 rounded-2xl p-3 shadow-xl border border-violet-200/60 dark:border-violet-800/40 rotate-[-6deg] hover:rotate-0 transition-transform">
            <span className="text-2xl block mb-1">📝</span>
            <span className="text-xs font-bold text-violet-600 dark:text-violet-400">Quiz</span>
            <div className="mt-1.5 h-1.5 bg-violet-100 dark:bg-violet-900/50 rounded-full w-12" />
          </div>
        </div>
        <div className="absolute top-[25%] right-[12%] z-[1] pointer-events-none hidden lg:block xl:hidden animate-float-delayed">
          <div className="bg-white dark:bg-stone-800 rounded-2xl p-3 shadow-xl border border-violet-200/60 dark:border-violet-800/40 rotate-[4deg] hover:rotate-0 transition-transform">
            <span className="text-2xl block mb-1">🃏</span>
            <span className="text-xs font-bold text-violet-600 dark:text-violet-400">Cards</span>
            <div className="mt-1.5 h-1.5 bg-violet-100 dark:bg-violet-900/50 rounded-full w-10" />
          </div>
        </div>
        <div className="absolute top-[42%] left-[10%] xl:left-[12%] z-[1] pointer-events-none hidden lg:block xl:hidden animate-float" style={{ animationDelay: '1s' }}>
          <div className="bg-white dark:bg-stone-800 rounded-2xl p-3 shadow-xl border border-blue-200/60 dark:border-blue-800/40 rotate-[3deg] hover:rotate-0 transition-transform">
            <span className="text-2xl block mb-1">🧩</span>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">Puzzle</span>
            <div className="mt-1.5 grid grid-cols-3 gap-0.5">
              {['C','A','T'].map((l,i)=>(<div key={i} className="w-4 h-4 rounded bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-[8px] font-bold text-blue-700">{l}</div>))}
            </div>
          </div>
        </div>
        <div className="absolute bottom-[28%] right-[10%] z-[1] pointer-events-none hidden lg:block xl:hidden animate-float-delayed">
          <div className="bg-white dark:bg-stone-800 rounded-2xl p-3 shadow-xl border border-emerald-200/60 dark:border-emerald-800/40 rotate-[-5deg] hover:rotate-0 transition-transform">
            <span className="text-2xl block mb-1">✨</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Summarize</span>
            <div className="mt-1.5 flex gap-1"><div className="w-2 h-2 rounded-full bg-emerald-400"/><div className="w-3 h-2 rounded-full bg-emerald-300/60"/></div>
          </div>
        </div>
        <div className="absolute top-[35%] left-[5%] hidden xl:block text-4xl opacity-45 animate-float">🔥</div>
        <div className="absolute top-[40%] right-[6%] hidden xl:block text-3xl opacity-40 animate-float-delayed">⚡</div>
        <div className="absolute bottom-[35%] left-[6%] hidden xl:block text-3xl opacity-40 animate-float">💡</div>
        <div className="absolute top-[36%] right-[4%] z-[1] pointer-events-none hidden xl:block text-4xl opacity-45 animate-float-delayed">🎯</div>

        {/* Hero Content — z-10 so text/sections stack above decorative floating mockups (z-1) */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 pt-12 sm:pt-14 lg:pt-12 pb-0">
          {/* Side mascots — hidden xl+ where essay preview panels sit; ~10% zoom-out matches hero headline */}
          <div className="hidden lg:block xl:hidden absolute left-0 xl:left-4 top-[25%] -translate-y-1/2 z-10 lg:scale-[0.9] lg:origin-center">
            <ScholarMascot size={140} animated={true} pose="waving" />
          </div>
          <div className="hidden lg:block xl:hidden absolute right-2 xl:right-6 top-[22%] -translate-y-1/2 z-10 opacity-90 lg:scale-[0.9] lg:origin-center">
            <ScholarMascot size={112} animated={true} pose="studying" />
          </div>

          <div className="w-full max-w-[1320px] xl:mx-auto xl:grid xl:grid-cols-[minmax(0,252px)_minmax(0,1fr)_minmax(0,252px)] xl:gap-5 xl:items-start xl:justify-center">
            <aside
              className="hidden xl:block pointer-events-none xl:pointer-events-auto xl:justify-self-end xl:pt-1 xl:min-w-0 xl:scale-[0.9] xl:origin-top-right"
              aria-label="Sample essay with professor-style annotations"
            >
              <HeroEssayPreviewCard paper={DEMO_PAPERS[0]} rotate="left" onOpenDemo={scrollToLandingTools} />
            </aside>

            <div className="min-w-0 flex flex-col items-center w-full">
          <div className="max-w-4xl mx-auto text-center w-full lg:scale-[0.9] lg:origin-top">
            {/* Hero headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-[#8447e8] dark:text-violet-400 leading-[1.15] mb-6 sm:mb-6 tracking-tight" style={{ letterSpacing: '-0.03em' }}>
              <span className="block sm:inline">Check my essay with AI, </span>
              <span className="block sm:inline sm:ml-1">
                get{' '}
                <span className="text-red-600 dark:text-red-500">professor</span>
                <span className="text-amber-600 dark:text-amber-500">-style</span>{' '}
                <span className="text-green-600 dark:text-green-500">feedback</span>
                {' '}in seconds
              </span>
            </h1>

            <p className="text-base sm:text-xl text-stone-600 dark:text-stone-400 mb-10 sm:mb-12 max-w-2xl mx-auto leading-relaxed px-2">
              Get feedback on your argument, structure, citations and grammar before you submit
            </p>
          </div>

          <div className="max-w-4xl mx-auto text-center w-full">
            {/* Primary CTA - mascot peeking behind button with grip hands */}
            <div className="flex justify-center mb-2 sm:mb-3">
              <div className="relative inline-flex flex-col items-center">
                <div className="group relative inline-flex items-center">
                  {/* Mascot peeking from behind - only eyes and above visible */}
                  <div className="mascot-sparkle absolute left-1/2 -translate-x-1/2 -top-[42px] z-0 pointer-events-none overflow-hidden w-[80px] transition-transform duration-300 ease-out group-hover:scale-105" style={{ height: '42px' }}>
                    <ScholarMascot size={80} animated={false} pose="celebrating" peekMode />
                    {/* Sparkles that appear on hover */}
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 80 42" fill="none">
                      <path className="sparkle sparkle-1" d="M12 8 L14 12 L18 12 L15 15 L16 19 L12 16 L8 19 L9 15 L6 12 L10 12 Z" fill="#FDE68A" />
                      <path className="sparkle sparkle-2" d="M68 10 L69.5 13 L73 13 L70.5 15 L71.5 18 L68 16 L64.5 18 L65.5 15 L63 13 L66.5 13 Z" fill="#FDE68A" />
                      <circle className="sparkle sparkle-3" cx="40" cy="5" r="3" fill="#C4B5FD" />
                    </svg>
                  </div>
                  {/* Left hand gripping the button edge */}
                  <svg className="hand-glisten absolute -left-3 top-1/2 -translate-y-1/2 z-20 pointer-events-none w-[28px] h-[44px] transition-transform duration-300 ease-out group-hover:scale-110" viewBox="0 0 28 44">
                    <defs>
                      <linearGradient id="handShineL" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="white" stopOpacity="0" />
                        <stop offset="50%" stopColor="white" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="white" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {/* Palm on the side */}
                    <ellipse cx="8" cy="24" rx="8" ry="12" fill="#7C3AED" />
                    <ellipse cx="9" cy="23" rx="6" ry="9" fill="#8B5CF6" />
                    {/* Thumb pointing down/back */}
                    <ellipse cx="4" cy="34" rx="4" ry="6" fill="#8B5CF6" transform="rotate(15 4 34)" />
                    <ellipse cx="4" cy="33" rx="3" ry="4" fill="#A78BFA" transform="rotate(15 4 33)" />
                    {/* Fingers curling over the top - knuckles visible */}
                    <ellipse cx="18" cy="14" rx="6" ry="5" fill="#7C3AED" />
                    <ellipse cx="18" cy="13" rx="5" ry="4" fill="#8B5CF6" />
                    {/* Finger tips wrapping over */}
                    <ellipse cx="22" cy="20" rx="4" ry="5" fill="#8B5CF6" transform="rotate(-20 22 20)" />
                    <ellipse cx="22" cy="19" rx="3" ry="4" fill="#A78BFA" transform="rotate(-20 22 19)" />
                    <ellipse cx="20" cy="26" rx="3.5" ry="4.5" fill="#8B5CF6" transform="rotate(-10 20 26)" />
                    <ellipse cx="20" cy="25" rx="2.5" ry="3.5" fill="#A78BFA" transform="rotate(-10 20 25)" />
                    <ellipse cx="17" cy="31" rx="3" ry="4" fill="#8B5CF6" transform="rotate(5 17 31)" />
                    <ellipse cx="17" cy="30" rx="2" ry="3" fill="#A78BFA" transform="rotate(5 17 30)" />
                    {/* Highlight on palm */}
                    <ellipse cx="10" cy="21" rx="3" ry="4" fill="#C4B5FD" opacity="0.3" />
                    {/* Glisten shine overlay */}
                    <ellipse className="hand-shine" cx="12" cy="20" rx="10" ry="16" fill="url(#handShineL)" />
                  </svg>
                  {/* Right hand gripping the button edge (mirrored) */}
                  <svg className="hand-glisten absolute -right-3 top-1/2 z-20 pointer-events-none w-[28px] h-[44px] transition-transform duration-300 ease-out group-hover:scale-110" viewBox="0 0 28 44" style={{ transform: 'translateY(-50%) scaleX(-1)' }}>
                    <defs>
                      <linearGradient id="handShineR" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="white" stopOpacity="0" />
                        <stop offset="50%" stopColor="white" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="white" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {/* Palm on the side */}
                    <ellipse cx="8" cy="24" rx="8" ry="12" fill="#7C3AED" />
                    <ellipse cx="9" cy="23" rx="6" ry="9" fill="#8B5CF6" />
                    {/* Thumb pointing down/back */}
                    <ellipse cx="4" cy="34" rx="4" ry="6" fill="#8B5CF6" transform="rotate(15 4 34)" />
                    <ellipse cx="4" cy="33" rx="3" ry="4" fill="#A78BFA" transform="rotate(15 4 33)" />
                    {/* Fingers curling over the top - knuckles visible */}
                    <ellipse cx="18" cy="14" rx="6" ry="5" fill="#7C3AED" />
                    <ellipse cx="18" cy="13" rx="5" ry="4" fill="#8B5CF6" />
                    {/* Finger tips wrapping over */}
                    <ellipse cx="22" cy="20" rx="4" ry="5" fill="#8B5CF6" transform="rotate(-20 22 20)" />
                    <ellipse cx="22" cy="19" rx="3" ry="4" fill="#A78BFA" transform="rotate(-20 22 19)" />
                    <ellipse cx="20" cy="26" rx="3.5" ry="4.5" fill="#8B5CF6" transform="rotate(-10 20 26)" />
                    <ellipse cx="20" cy="25" rx="2.5" ry="3.5" fill="#A78BFA" transform="rotate(-10 20 25)" />
                    <ellipse cx="17" cy="31" rx="3" ry="4" fill="#8B5CF6" transform="rotate(5 17 31)" />
                    <ellipse cx="17" cy="30" rx="2" ry="3" fill="#A78BFA" transform="rotate(5 17 30)" />
                    {/* Highlight on palm */}
                    <ellipse cx="10" cy="21" rx="3" ry="4" fill="#C4B5FD" opacity="0.3" />
                    {/* Glisten shine overlay */}
                    <ellipse className="hand-shine" cx="12" cy="20" rx="10" ry="16" fill="url(#handShineR)" />
                  </svg>
                  <button
                    onClick={() => onNavigate('signup')}
                    className="btn-glisten relative z-10 px-10 py-4 bg-violet-500 text-white font-bold rounded-full hover:bg-violet-600 hover:scale-105 active:scale-95 transition-all duration-300 ease-out shadow-xl shadow-violet-500/25 hover:shadow-2xl hover:shadow-violet-500/40 text-lg"
                  >
                    Let&apos;s get started
                  </button>
                </div>
                <p className="sm:hidden mt-3 w-full text-center text-sm text-stone-500 dark:text-stone-400">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => onNavigate('login')}
                    className="text-violet-600 dark:text-violet-400 hover:underline font-medium"
                  >
                    Log in
                  </button>
                </p>
              </div>
            </div>

            <p className="text-sm text-stone-500 dark:text-stone-400 mb-6 sm:mb-8">
              Trusted by 50k+ students
            </p>
          </div>
            </div>

            <aside
              className="hidden xl:block pointer-events-none xl:pointer-events-auto xl:justify-self-start xl:pt-1 xl:min-w-0 xl:scale-[0.9] xl:origin-top-left"
              aria-label="Sample essay with professor-style annotations"
            >
              <HeroEssayPreviewCard paper={DEMO_PAPERS[1]} rotate="right" onOpenDemo={scrollToLandingTools} />
            </aside>
          </div>

            {/* Hero feature cards — scroll on mobile, arrow carousel on desktop */}
            <div className="w-[calc(100vw-2rem)] sm:w-screen sm:max-w-[100vw] relative left-1/2 -translate-x-1/2 mt-2 sm:mt-4 px-0 sm:pl-20 sm:pr-20 lg:pl-24 lg:pr-24">
              <button
                type="button"
                onClick={() => setStudyCardsCarouselIndex((i) => Math.max(0, i - 1))}
                disabled={studyCardsCarouselIndex === 0}
                className="hidden sm:flex absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white dark:bg-stone-800 shadow-lg border border-stone-200 dark:border-stone-600 items-center justify-center text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-700 hover:text-stone-900 dark:hover:text-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300"
                aria-label="Previous feature cards"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button
                type="button"
                onClick={() => setStudyCardsCarouselIndex((i) => Math.min(heroCarouselMaxIndex, i + 1))}
                disabled={studyCardsCarouselIndex >= heroCarouselMaxIndex}
                className="hidden sm:flex absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white dark:bg-stone-800 shadow-lg border border-stone-200 dark:border-stone-600 items-center justify-center text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-700 hover:text-stone-900 dark:hover:text-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300"
                aria-label="Next feature cards"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
              <div className="overflow-x-auto sm:overflow-hidden scrollbar-hide pb-4 sm:pb-0 sm:mx-0 sm:px-0 snap-x snap-mandatory sm:snap-none px-2">
                <div className="flex gap-4 sm:hidden w-max">
                  {heroFeatureCards.map((card) => (
                    <div key={card.title} className="flex-shrink-0 w-[min(240px,calc(100vw-2rem))] snap-start">
                      <MobileStudyCard
                        title={card.title}
                        desc={card.desc}
                        onClick={card.onClick}
                        gradient={card.gradient}
                        accentClasses={card.accentClasses}
                        borderColor={card.borderColor}
                        icon={card.icon}
                      >
                        {'mobileContent' in card && card.mobileContent ? card.mobileContent : card.inner}
                      </MobileStudyCard>
                    </div>
                  ))}
                </div>
                <div
                  className="hidden sm:flex gap-4 sm:transition-transform sm:duration-500 sm:ease-out w-[140%] pr-8 sm:pr-12"
                  style={{ transform: `translateX(-${studyCardsCarouselIndex * heroCarouselTranslateStep}%)` }}
                >
                  {heroFeatureCards.map((card) => (
                    <div key={card.title} className="flex-shrink-0 max-w-none" style={{ flex: `0 0 ${heroCarouselCardBasis}` }}>
                      <StudyCard
                        title={card.title}
                        desc={card.desc}
                        onClick={card.onClick}
                        gradient={card.gradient}
                        accentClasses={card.accentClasses}
                        borderColor={card.borderColor}
                        icon={card.icon}
                        innerContent={card.inner}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="hidden sm:flex justify-center gap-2 mt-6">
                {[0, 1, 2, 3].map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setStudyCardsCarouselIndex(i)}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${studyCardsCarouselIndex === i ? 'bg-violet-500 w-8' : 'bg-stone-300 dark:bg-stone-600 hover:bg-stone-400'}`}
                    aria-label={`Feature cards slide ${i + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* University marquee — headline + scrolling name chips */}
            <div
              className="w-screen max-w-[100vw] relative left-1/2 -translate-x-1/2 mt-14 sm:mt-20 mb-0 overflow-hidden
                border-y border-violet-200/60 dark:border-violet-800/40
                bg-gradient-to-b from-violet-50 via-white to-violet-50/90
                dark:from-stone-900 dark:via-stone-900 dark:to-violet-950/20
                shadow-[inset_0_1px_0_0_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
              aria-label="Universities students use WriteScholar from"
            >
              <div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_-20%,rgba(139,92,246,0.06),transparent_50%)] dark:bg-[radial-gradient(ellipse_90%_70%_at_50%_-20%,rgba(139,92,246,0.1),transparent_50%)]"
                aria-hidden
              />
              <div className="relative z-10 px-4 pt-7 pb-6 sm:pt-8 sm:pb-7">
                <div className="mx-auto max-w-xl text-center mb-6 sm:mb-7">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-extrabold text-stone-900 dark:text-stone-50 tracking-tight leading-tight">
                    Trusted by students at{' '}
                    <span className="text-violet-600 dark:text-violet-400">leading universities</span>
                    <span className="text-stone-800 dark:text-stone-200"> worldwide</span>
                  </h3>
                  <div
                    className="mt-4 h-[3px] w-16 sm:w-20 mx-auto rounded-full bg-gradient-to-r from-violet-400 via-fuchsia-500 to-violet-500 opacity-90 dark:opacity-100 dark:from-violet-500 dark:via-fuchsia-400 dark:to-violet-400"
                    aria-hidden
                  />
                </div>
                <div className="relative overflow-hidden">
                  <div
                    className="pointer-events-none absolute inset-y-0 left-0 z-10 w-14 sm:w-24 bg-gradient-to-r from-violet-50 dark:from-stone-900 via-violet-50 dark:via-stone-900 to-transparent"
                    aria-hidden
                  />
                  <div
                    className="pointer-events-none absolute inset-y-0 right-0 z-10 w-14 sm:w-24 bg-gradient-to-l from-violet-50 dark:from-stone-900 via-violet-50 dark:via-stone-900 to-transparent"
                    aria-hidden
                  />
                  <div className="flex w-max animate-scroll-slow items-center py-0.5">
                    {universities.map((uni, idx) => (
                      <div key={`hero-first-${idx}`} className="flex-shrink-0 mx-1.5 sm:mx-2.5">
                        <span
                          className={`inline-flex items-center rounded-xl border border-stone-200/90 dark:border-stone-600 bg-white dark:bg-stone-800 px-3.5 py-2 sm:px-4 sm:py-2.5 text-sm sm:text-base md:text-lg font-bold shadow-md shadow-stone-900/5 dark:shadow-black/30 ring-1 ring-violet-100/80 dark:ring-violet-900/30 ${uni.className} !text-stone-700 dark:!text-stone-200`}
                        >
                          {uni.name}
                        </span>
                      </div>
                    ))}
                    {universities.map((uni, idx) => (
                      <div key={`hero-second-${idx}`} className="flex-shrink-0 mx-1.5 sm:mx-2.5">
                        <span
                          className={`inline-flex items-center rounded-xl border border-stone-200/90 dark:border-stone-600 bg-white dark:bg-stone-800 px-3.5 py-2 sm:px-4 sm:py-2.5 text-sm sm:text-base md:text-lg font-bold shadow-md shadow-stone-900/5 dark:shadow-black/30 ring-1 ring-violet-100/80 dark:ring-violet-900/30 ${uni.className} !text-stone-700 dark:!text-stone-200`}
                        >
                          {uni.name}
                        </span>
                      </div>
                    ))}
                    {universities.map((uni, idx) => (
                      <div key={`hero-third-${idx}`} className="flex-shrink-0 mx-1.5 sm:mx-2.5">
                        <span
                          className={`inline-flex items-center rounded-xl border border-stone-200/90 dark:border-stone-600 bg-white dark:bg-stone-800 px-3.5 py-2 sm:px-4 sm:py-2.5 text-sm sm:text-base md:text-lg font-bold shadow-md shadow-stone-900/5 dark:shadow-black/30 ring-1 ring-violet-100/80 dark:ring-violet-900/30 ${uni.className} !text-stone-700 dark:!text-stone-200`}
                        >
                          {uni.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          {/* Analyze Papers — full-bleed vs hero padding so side “margins” match section (not violet hero wash) */}
          <section
            id="landing-tools"
            className="relative w-full -mx-4 sm:-mx-6 lg:-mx-8 mt-0 pt-8 sm:pt-10 pb-14 sm:pb-20 overflow-hidden bg-white dark:bg-stone-900 scroll-mt-24 border-t border-stone-200/80 dark:border-stone-700/80"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-5%,rgba(120,113,108,0.06),transparent_50%)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-5%,rgba(82,82,82,0.12),transparent_50%)]" />
            <div className="absolute top-20 left-[5%] hidden xl:block text-4xl opacity-30 animate-float">📝</div>
            <div className="absolute top-32 right-[8%] hidden xl:block text-3xl opacity-25 animate-float-delayed">✨</div>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="text-center mb-10 sm:mb-14">
                <span className="inline-block px-4 py-1.5 bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-400 rounded-full text-sm font-semibold mb-4">
                  Feedback that grades like a professor
                </span>
                <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-stone-800 dark:text-stone-100 mb-4 sm:mb-5">
                  Analyze Papers with Feedback <span className="text-violet-600 dark:text-violet-400">That Thinks Like a Professor</span>
                </h2>
                <p className="text-base sm:text-lg text-stone-600 dark:text-stone-400 max-w-2xl mx-auto">
                  Upload your essay or research paper. Our AI evaluates structure, clarity, citations, and academic quality, then gives you actionable feedback to improve before you submit.
                </p>
              </div>

              <InteractiveDocumentAnalysis onNavigate={onNavigate} />

              <div className="text-center mt-10 sm:mt-14">
                <button
                  onClick={() => onNavigate('signup')}
                  className="inline-flex items-center px-8 py-4 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-2xl hover:scale-105 active:scale-95 shadow-xl shadow-violet-500/30 transition-all duration-300 text-lg"
                >
                  Try your first analysis
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </button>
                <p className="mt-3 text-sm text-stone-500 dark:text-stone-400">No credit card required • Free plan includes 2 analyses per month</p>
              </div>
            </div>
          </section>

        </div>
      </section>

      {/* H2 #2: Create Study Material - Turn Notes Into Quizzes, Flashcards, Crosswords */}
      <section className="relative py-12 sm:py-28 overflow-hidden bg-stone-50 dark:bg-stone-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(245,158,11,0.08),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(251,191,36,0.05),transparent)] lg:bg-[radial-gradient(ellipse_70%_40%_at_50%_10%,rgba(120,113,108,0.05),transparent)]" />
        <div className="absolute top-24 left-[5%] hidden xl:block text-5xl opacity-40 animate-float">📚</div>
        <div className="absolute top-40 right-[8%] hidden xl:block text-4xl opacity-35 animate-float-delayed">✏️</div>
        <div className="absolute bottom-40 left-[7%] hidden xl:block text-4xl opacity-35 animate-float" style={{ animationDelay: '0.7s' }}>🎯</div>
        <div className="absolute bottom-32 right-[5%] hidden xl:block text-5xl opacity-40 animate-float-delayed" style={{ animationDelay: '0.4s' }}>🚀</div>
        <div className="xl:hidden absolute top-20 left-4 text-3xl opacity-50 animate-float">📚</div>
        <div className="xl:hidden absolute top-32 right-4 text-2xl opacity-45 animate-float-delayed">✏️</div>
        <div className="xl:hidden absolute bottom-64 left-6 text-2xl opacity-45 animate-float" style={{ animationDelay: '0.5s' }}>🎯</div>
        <div className="xl:hidden absolute bottom-48 right-6 text-3xl opacity-50 animate-float-delayed" style={{ animationDelay: '0.3s' }}>🚀</div>
        <div className="lg:hidden absolute top-1/3 right-8 w-12 h-12 rounded-xl bg-amber-400/20 animate-float" />
        <div className="lg:hidden absolute bottom-1/3 left-6 w-10 h-10 rounded-full bg-amber-400/18 animate-float-delayed" style={{ animationDelay: '0.6s' }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="relative text-center mb-10 sm:mb-20">
            <span className="inline-block px-4 py-1.5 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 rounded-full text-sm font-semibold mb-4 animate-notes-fade-in-up opacity-0 max-lg:bg-amber-200/80 max-lg:dark:bg-amber-800/60" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
              Quizzes, Flashcards & Crosswords
            </span>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-stone-800 dark:text-stone-100 mb-4 sm:mb-5 animate-notes-fade-in-up opacity-0" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
              Create Study Material from Any Notes,
              <span className="block sm:inline text-amber-600 dark:text-amber-400"> in seconds</span>
            </h2>
            <p className="text-base sm:text-xl text-stone-600 dark:text-stone-400 text-center max-w-2xl mx-auto px-2 animate-notes-fade-in-up opacity-0 max-lg:text-stone-700 max-lg:dark:text-stone-300 max-lg:font-medium" style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
              Paste your notes. Get quizzes, flashcards & crosswords in seconds. Plus crosswords, a study mode Quizlet and Knowt don&apos;t offer.
            </p>
          </div>
          <div className="mb-12 sm:mb-16 animate-notes-fade-in-up opacity-0" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
            <div className="relative group">
              <div className="absolute -inset-1 bg-amber-400/30 rounded-3xl blur-xl opacity-15 group-hover:opacity-25 transition-opacity duration-500 max-lg:opacity-25 max-lg:-inset-2"></div>
              <div className="relative bg-white dark:bg-stone-800 rounded-3xl overflow-hidden shadow-xl border border-stone-200/50 dark:border-stone-700 group-hover:shadow-amber-500/10 dark:group-hover:shadow-amber-900/20 transition-shadow duration-500 max-lg:border-amber-200/60 max-lg:dark:border-amber-900/40 max-lg:shadow-amber-500/15">
                <div className="grid lg:grid-cols-[1fr_1.15fr] gap-0">
                  <div className="order-1 lg:order-1 p-5 sm:p-12 lg:p-16 flex flex-col justify-center">
                    <div className="w-14 h-14 rounded-2xl bg-amber-600 flex items-center justify-center mb-6 shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform duration-300">
                      <span className="text-2xl">📝</span>
                    </div>
                    <h3 className="text-xl sm:text-3xl font-bold text-stone-800 dark:text-stone-100 mb-3 sm:mb-4">Paste Your Notes</h3>
                    <p className="text-stone-600 dark:text-stone-400 text-sm sm:text-lg leading-relaxed mb-4 sm:mb-6">
                      Drop in any lecture notes, textbook chapters, articles, or study material. Our AI reads and understands your content in seconds.
                    </p>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-3 text-stone-600 dark:text-stone-400">
                        <span className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
                          <svg className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                        </span>
                        Works with any subject or topic
                      </li>
                      <li className="flex items-center gap-3 text-stone-600 dark:text-stone-400">
                        <span className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
                          <svg className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                        </span>
                        Supports long-form content
                      </li>
                      <li className="flex items-center gap-3 text-stone-600 dark:text-stone-400">
                        <span className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
                          <svg className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                        </span>
                        Instant AI processing
                      </li>
                    </ul>
                  </div>
                  <div className="order-2 lg:order-2 relative overflow-hidden bg-amber-50 dark:bg-amber-900/20 min-h-[200px] sm:min-h-[360px] lg:min-h-[400px] flex items-center justify-center p-3 sm:p-4">
                    <ViewportAutoplayVideo
                      src="/writescholar-notes-study-materials-demo.mp4"
                      className="w-full h-full object-contain group-hover:scale-[1.02] transition-transform duration-700"
                      title="WriteScholar — Paste notes to generate quizzes, flashcards and crosswords"
                      aria-label="WriteScholar — Paste notes to generate quizzes, flashcards and crosswords instantly"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="relative animate-notes-fade-in-up opacity-0" style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}>
            <div className="relative text-center mb-10 sm:mb-12">
              <div className="inline-flex flex-col items-center">
                <div className="relative">
                  <div className="absolute -inset-3 bg-amber-400/25 dark:bg-amber-500/20 rounded-3xl blur-2xl animate-alive-glow" />
                  <div className="relative px-10 sm:px-14 py-6 sm:py-7 rounded-2xl bg-white dark:bg-stone-800 shadow-xl border-2 border-amber-200/60 dark:border-amber-700/40 hover:border-amber-300/80 dark:hover:border-amber-600/60 transition-all duration-300">
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <span className="text-2xl sm:text-3xl animate-float">✨</span>
                      <h3 className="text-xl sm:text-2xl font-extrabold text-amber-700 dark:text-amber-400">Make it come alive</h3>
                      <span className="text-2xl sm:text-3xl animate-float-delayed" style={{ animationDelay: '0.5s' }}>⚡</span>
                    </div>
                    <p className="text-stone-500 dark:text-stone-400 text-sm sm:text-base">Your notes → quizzes, flashcards, crosswords. In seconds.</p>
                  </div>
                </div>
              </div>
              <div className="hidden md:flex absolute left-0 right-0 top-full pt-4 pointer-events-none justify-between max-w-4xl mx-auto px-12">
                <div className="w-px h-8 bg-amber-400/50 dark:bg-amber-500/40" />
                <div className="w-px h-8 bg-emerald-400/50 dark:bg-emerald-500/40" />
                <div className="w-px h-8 bg-orange-400/50 dark:bg-orange-500/40" />
              </div>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-md:gap-5">
            <div className="group relative animate-notes-fade-in-up opacity-0" style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}>
              <div className="absolute -inset-1 bg-amber-400/25 rounded-3xl blur-xl opacity-0 group-hover:opacity-40 transition-all duration-500 max-lg:opacity-25 max-lg:-inset-1.5"></div>
              <div className="relative bg-white dark:bg-stone-800 rounded-3xl overflow-hidden shadow-xl border-2 border-stone-200/50 dark:border-stone-700 h-full hover:-translate-y-3 hover:scale-[1.02] hover:shadow-2xl hover:border-amber-200/80 dark:hover:border-amber-700/50 transition-all duration-500 max-lg:border-amber-200/50 max-lg:dark:border-amber-900/30 max-lg:shadow-amber-500/10">
                <div className="relative h-40 sm:h-56 overflow-hidden bg-amber-50 dark:bg-amber-900/20">
                  <ViewportAutoplayVideo src="/writescholar-quiz-generator-demo.mp4" className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500" title="WriteScholar AI Quiz Generator — Turn notes into practice tests" aria-label="WriteScholar AI Quiz Generator — Turn notes into practice tests instantly" />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-lg">📝</span>
                    <h3 className="text-xl font-bold text-stone-800 dark:text-stone-100">Generate Quizzes</h3>
                  </div>
                </div>
              </div>
            </div>
            <div className="group relative animate-notes-fade-in-up opacity-0" style={{ animationDelay: '0.7s', animationFillMode: 'forwards' }}>
              <div className="absolute -inset-1 bg-amber-400/25 rounded-3xl blur-xl opacity-0 group-hover:opacity-40 transition-all duration-500 max-lg:opacity-25 max-lg:-inset-1.5"></div>
              <div className="relative bg-white dark:bg-stone-800 rounded-3xl overflow-hidden shadow-xl border-2 border-stone-200/50 dark:border-stone-700 h-full hover:-translate-y-3 hover:scale-[1.02] hover:shadow-2xl hover:border-amber-200/80 dark:hover:border-amber-700/50 transition-all duration-500 max-lg:border-amber-200/50 max-lg:dark:border-amber-900/30 max-lg:shadow-amber-500/10">
                <div className="relative h-40 sm:h-56 overflow-hidden bg-amber-50 dark:bg-amber-900/20">
                  <ViewportAutoplayVideo src="/writescholar-flashcards-demo.mp4" className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500" title="WriteScholar Study Pack — AI flashcard generator from notes" aria-label="WriteScholar Study Pack — AI flashcard generator from notes" />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-lg">🃏</span>
                    <h3 className="text-xl font-bold text-stone-800 dark:text-stone-100">Create Flashcards</h3>
                  </div>
                </div>
              </div>
            </div>
            <div className="group relative animate-notes-fade-in-up opacity-0" style={{ animationDelay: '0.8s', animationFillMode: 'forwards' }}>
              <div className="absolute -inset-1 bg-orange-400/25 rounded-3xl blur-xl opacity-0 group-hover:opacity-40 transition-all duration-500 max-lg:opacity-25 max-lg:-inset-1.5"></div>
              <div className="relative bg-white dark:bg-stone-800 rounded-3xl overflow-hidden shadow-xl border-2 border-stone-200/50 dark:border-stone-700 h-full hover:-translate-y-3 hover:scale-[1.02] hover:shadow-2xl hover:border-amber-200/80 dark:hover:border-amber-700/50 transition-all duration-500 max-lg:border-amber-200/50 max-lg:dark:border-amber-900/30 max-lg:shadow-amber-500/10">
                <div className="relative h-40 sm:h-56 overflow-hidden bg-orange-50 dark:bg-orange-900/20">
                  <ViewportAutoplayVideo src="/writescholar-crossword-demo.mp4" className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500" title="WriteScholar Crossword Generator — Create study puzzles from notes" aria-label="WriteScholar Crossword Generator — Create study puzzles from notes" />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center text-lg">🧩</span>
                    <h3 className="text-xl font-bold text-stone-800 dark:text-stone-100">Build Crosswords</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="text-center mt-14 sm:mt-16 animate-notes-fade-in-up opacity-0" style={{ animationDelay: '0.9s', animationFillMode: 'forwards' }}>
            <button onClick={() => onNavigate('signup')} className="group inline-flex items-center px-8 py-4 text-white font-bold rounded-2xl bg-violet-600 hover:bg-violet-500 hover:scale-105 active:scale-95 shadow-xl shadow-violet-500/30 hover:shadow-violet-500/40 transition-all duration-300 text-lg max-lg:px-10 max-lg:py-4 max-lg:shadow-violet-500/40">
              Try Study Tools Free
              <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </button>
            <p className="mt-4 text-stone-500 dark:text-stone-400 text-sm">Free plan includes 2 study packs per month (lesson & flashcards — quiz, crossword & Crater Blast with Pro)</p>
          </div>
        </div>
      </section>

      {/* H2 #3: Focus Mode - Earn Your Screen Time - Block Websites */}
      <section className="relative py-24 sm:py-36 overflow-hidden bg-stone-200 dark:bg-stone-950">
        {/* Light background with subtle violet accents */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_60%_at_50%_-5%,rgba(251,207,232,0.25),transparent_55%)] dark:bg-[radial-gradient(ellipse_100%_60%_at_50%_-5%,rgba(251,207,232,0.08),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_85%_85%,rgba(251,113,133,0.12),transparent_45%)] dark:bg-[radial-gradient(ellipse_70%_50%_at_85%_85%,rgba(251,113,133,0.06),transparent_45%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_15%_75%,rgba(244,114,182,0.1),transparent_45%)] dark:bg-[radial-gradient(ellipse_60%_40%_at_15%_75%,rgba(244,114,182,0.05),transparent_45%)]" />
        
        {/* Floating decorative elements */}
        <div className="absolute top-20 left-[8%] hidden lg:block text-4xl opacity-40 animate-float">🔒</div>
        <div className="absolute top-32 right-[10%] hidden lg:block text-3xl opacity-35 animate-float-delayed">📵</div>
        <div className="absolute bottom-40 left-[12%] hidden lg:block text-3xl opacity-35 animate-float">🎯</div>
        <div className="absolute bottom-32 right-[8%] hidden lg:block text-4xl opacity-40 animate-float-delayed">✨</div>
        <div className="absolute top-1/2 left-[5%] hidden xl:block text-2xl opacity-30 animate-float">🧠</div>
        <div className="absolute top-1/3 right-[5%] hidden xl:block text-2xl opacity-30 animate-float-delayed">⏰</div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero - centered, bold with mascot */}
          <div className="text-center mb-16 sm:mb-20">
            <div className="inline-flex items-center gap-3 mb-8">
              <div className="relative">
                <div className="absolute -inset-2 bg-violet-400/20 rounded-full blur-xl animate-pulse" />
                <ScholarMascot size={72} animated={true} pose="pointing" />
              </div>
              <span className="px-5 py-2 bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 rounded-full text-sm font-bold border border-violet-200/60 dark:border-violet-700/40 shadow-lg shadow-violet-500/10">
                ⚡ Focus Mode
              </span>
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-stone-900 dark:text-white mb-6 tracking-tight leading-[1.1]">
              Earn Your Screen Time.
              <span className="block text-violet-600 dark:text-violet-400">
                Block Sites Until You Study
              </span>
            </h2>
            <p className="text-lg sm:text-xl text-stone-600 dark:text-stone-300 max-w-2xl mx-auto leading-relaxed mb-8">
              Block YouTube, TikTok, Instagram and Reddit until you answer quiz questions from your own notes or solve a quick puzzle (Sudoku, Memory, Pattern).
              <span className="block mt-1 text-stone-700 dark:text-stone-200 font-medium">No scroll until you&apos;ve studied.</span>
            </p>
          </div>

          {/* Video - hero showcase (non-paid only) */}
          {!(user && ['pro', 'premium'].includes((user.plan || user.subscription_plan || '').toLowerCase())) && (
            <div className="mb-24">
              <div className="relative max-w-4xl mx-auto">
                <div className="absolute -inset-4 bg-violet-500/25 rounded-3xl blur-2xl" />
                <div className="relative rounded-2xl overflow-hidden ring-2 ring-violet-200/60 dark:ring-violet-700/40 shadow-2xl shadow-violet-500/20">
                  <ViewportAutoplayVideo
                    src="/writescholar-focus-mode-demo.mp4"
                    className="w-full aspect-video object-cover"
                    title="WriteScholar Focus Mode — Block distractions, solve puzzle or answer quiz to unlock"
                    aria-label="WriteScholar Focus Mode — Block distractions, solve puzzle or answer quiz to unlock"
                  />
                  <div className="absolute inset-0 bg-black/35 pointer-events-none" />
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                    <span className="px-3 py-1.5 bg-black/50 backdrop-blur-sm text-white/90 rounded-lg text-sm font-medium">
                      See it in action
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* How it works - premium timeline */}
          <div className="mb-24">
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-1.5 bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                Simple as 1-2-3
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white">How Focus Mode works</h3>
            </div>
            
            {/* Desktop timeline connector */}
            <div className="hidden lg:block absolute left-1/2 -translate-x-1/2 w-[60%] h-0.5 bg-violet-500/40 top-[calc(50%+2rem)]" style={{ zIndex: 0 }} />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-6 relative">
              {/* Step 1 */}
              <div className="group relative flex flex-col">
                <div className="absolute -inset-2 bg-violet-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative flex-1 rounded-3xl overflow-hidden bg-white dark:bg-stone-800/80 backdrop-blur-sm border border-stone-200 dark:border-stone-600/50 shadow-xl group-hover:border-violet-400/60 group-hover:shadow-violet-500/10 transition-all duration-500">
                  <div className="aspect-[5/4] min-h-[220px] flex items-center justify-center bg-violet-500/10 overflow-hidden">
                    <ViewportAutoplayVideo
                      src="/writescholar-focus-mode-step1-demo.mp4"
                      className="w-full h-full object-cover"
                      title="WriteScholar Focus Mode Step 1 — Pick sites to block"
                      aria-label="WriteScholar Focus Mode Step 1 — Pick sites to block"
                    />
                  </div>
                  <div className="p-6 sm:p-8">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-10 h-10 rounded-xl bg-violet-500 flex items-center justify-center text-white font-black text-lg shadow-lg flex-shrink-0">1</span>
                      <h4 className="text-xl font-bold text-stone-900 dark:text-white">Pick Sites to Block</h4>
                    </div>
                    <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                      YouTube, TikTok, Instagram, Reddit — or add any custom domain. You&apos;re in control.
                    </p>
                  </div>
                </div>
                <div className="hidden lg:flex absolute top-1/2 -right-4 z-20 w-8 h-8 rounded-full bg-violet-500 items-center justify-center shadow-lg shadow-violet-500/30" aria-hidden>
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              {/* Step 2 */}
              <div className="group relative flex flex-col">
                <div className="absolute -inset-2 bg-violet-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative flex-1 rounded-3xl overflow-hidden bg-white dark:bg-stone-800/80 backdrop-blur-sm border border-stone-200 dark:border-stone-600/50 shadow-xl group-hover:border-violet-400/60 group-hover:shadow-violet-500/10 transition-all duration-500">
                  <div className="aspect-[5/4] min-h-[220px] flex items-center justify-center bg-violet-500/10 overflow-hidden">
                    <ViewportAutoplayVideo
                      src="/writescholar-focus-mode-step2-demo.mp4"
                      className="w-full h-full object-cover"
                      title="WriteScholar Focus Mode Step 2 — Solve puzzle or answer quiz to unlock"
                      aria-label="WriteScholar Focus Mode Step 2 — Solve puzzle or answer quiz to unlock"
                    />
                  </div>
                  <div className="p-6 sm:p-8">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center text-white font-black text-lg shadow-lg flex-shrink-0">2</span>
                      <h4 className="text-xl font-bold text-stone-900 dark:text-white">Answer to Unlock</h4>
                    </div>
                    <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                      Try visiting a blocked site → solve a puzzle (Sudoku, Memory, Pattern) or answer a quick quiz from your own notes. Knowledge is the key.
                    </p>
                  </div>
                </div>
                <div className="hidden lg:flex absolute top-1/2 -right-4 z-20 w-8 h-8 rounded-full bg-fuchsia-500 items-center justify-center shadow-lg shadow-fuchsia-500/30" aria-hidden>
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              {/* Step 3 */}
              <div className="group relative flex flex-col">
                <div className="absolute -inset-2 bg-violet-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative flex-1 rounded-3xl overflow-hidden bg-white dark:bg-stone-800/80 backdrop-blur-sm border border-stone-200 dark:border-stone-600/50 shadow-xl group-hover:border-violet-400/60 group-hover:shadow-violet-500/10 transition-all duration-500">
                  <div className="aspect-[5/4] min-h-[220px] flex items-center justify-center bg-violet-500/10 overflow-hidden">
                    <ViewportAutoplayVideo
                      src="/writescholar-focus-mode-step3-demo.mp4"
                      className="w-full h-full object-cover"
                      title="WriteScholar Focus Mode Step 3 — Enjoy your earned break"
                      aria-label="WriteScholar Focus Mode Step 3 — Enjoy your earned break"
                    />
                  </div>
                  <div className="p-6 sm:p-8">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-10 h-10 rounded-xl bg-fuchsia-500 flex items-center justify-center text-white font-black text-lg shadow-lg flex-shrink-0">3</span>
                      <h4 className="text-xl font-bold text-stone-900 dark:text-white">Enjoy Your Break</h4>
                    </div>
                    <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                      Site unlocks for 15 min to 24 hours — you choose. Time&apos;s up? Study again to earn more.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Why it works - psychology section */}
          <div className="mb-24">
            <div className="relative max-w-4xl mx-auto">
              <div className="absolute -inset-4 bg-violet-500/20 rounded-3xl blur-2xl" />
              <div className="relative bg-white dark:bg-stone-800/80 backdrop-blur-sm rounded-3xl border border-stone-200 dark:border-stone-600/50 shadow-xl p-8 sm:p-12">
                <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <div className="absolute -inset-4 bg-violet-400/20 rounded-full blur-xl" />
                      <ScholarMascot size={100} animated={true} pose="thinking" />
                    </div>
                  </div>
                  <div className="text-center lg:text-left">
                    <h3 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white mb-4">
                      Why it actually works
                    </h3>
                    <p className="text-stone-600 dark:text-stone-400 leading-relaxed mb-6">
                      Most blockers just frustrate you. Focus Mode is different — it ties your screen time to learning. 
                      Every minute on TikTok is <span className="text-stone-900 dark:text-white font-semibold">earned</span> by solving a puzzle or answering questions from your own notes. 
                      Your brain starts associating breaks with achievement, not guilt.
                    </p>
                    <div className="flex flex-wrap justify-center lg:justify-start gap-3">
                      <div className="flex items-center gap-2 px-4 py-2 bg-violet-50 dark:bg-violet-900/20 rounded-xl text-sm text-stone-700 dark:text-stone-300">
                        <span className="text-emerald-500">✓</span> Guilt-free scrolling
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 bg-violet-50 dark:bg-violet-900/20 rounded-xl text-sm text-stone-700 dark:text-stone-300">
                        <span className="text-emerald-500">✓</span> Reinforces learning
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 bg-violet-50 dark:bg-violet-900/20 rounded-xl text-sm text-stone-700 dark:text-stone-300">
                        <span className="text-emerald-500">✓</span> Builds habits
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Testimonial */}
          <div className="mb-16">
            <div className="max-w-2xl mx-auto text-center">
              <div className="relative inline-block mb-6">
                <svg className="w-12 h-12 text-violet-400/40" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
              </div>
              <blockquote className="text-xl sm:text-2xl text-stone-700 dark:text-stone-200 font-medium leading-relaxed mb-6">
                I used to waste 3+ hours on TikTok every day. Now I actually look forward to studying because it means I&apos;ve earned my break. My grades went up a full letter.
              </blockquote>
              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold">
                  M
                </div>
                <div className="text-left">
                  <div className="text-stone-900 dark:text-white font-semibold">Maya S.</div>
                  <div className="text-stone-500 dark:text-stone-400 text-sm">Pre-Med Student</div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA - premium */}
          <div className="text-center">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="inline-block relative">
                <div className="absolute -inset-4 bg-violet-500/35 rounded-3xl blur-2xl animate-pulse" />
                <a
                  href={FOCUS_MODE_CHROME_EXTENSION_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative inline-flex items-center gap-3 px-10 py-5 text-lg font-bold text-white bg-violet-600 rounded-2xl hover:bg-violet-500 hover:scale-105 active:scale-95 shadow-2xl shadow-violet-500/30 transition-all duration-300"
                >
                <span>Try Focus Mode Free</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                </a>
              </div>
              <button
                onClick={() => onNavigate('focus-mode')}
                className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-stone-900 dark:text-white border-2 border-stone-300 dark:border-stone-500 rounded-2xl hover:bg-stone-100 dark:hover:bg-stone-700/50 hover:border-stone-400 dark:hover:border-stone-400 transition-all duration-300"
              >
                <span>Learn More</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
            <p className="mt-6 text-stone-500 dark:text-stone-400 text-sm">
              Chrome extension • free to try
            </p>
          </div>
        </div>
      </section>

      {/* Study Better Together — from Share Friends page (hidden when HIDE_FRIENDS) */}
      {!HIDE_FRIENDS && (
      <section className="relative py-12 sm:py-20 overflow-hidden bg-white dark:bg-stone-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_50%,rgba(99,102,241,0.07),transparent)] dark:bg-[radial-gradient(ellipse_70%_60%_at_50%_50%,rgba(139,92,246,0.06),transparent)]" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Mobile layout — badge, title, video, share instructions */}
          <div className="lg:hidden flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 rounded-full text-sm font-semibold mb-4">
              <span>👫</span>
              <span>Social Study, Levelled Up</span>
            </div>
            <h2 className="text-2xl font-extrabold text-stone-900 dark:text-stone-50 leading-tight mb-2">
              Study Better,{' '}
              <span className="text-violet-500">
                Together
              </span>
            </h2>
            <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed mb-5 max-w-sm">
              Add friends with your unique code and share flashcards, quizzes, crosswords & notes in one tap.
            </p>
            <div className="relative flex items-center justify-center mb-4 w-full max-w-[280px]">
              <div className="absolute inset-0 bg-violet-500/15 rounded-3xl blur-3xl" />
              <DualMascot size={200} />
            </div>
            <div className="relative w-full max-w-[360px] rounded-2xl overflow-hidden border-2 border-stone-200/80 dark:border-stone-700/60 shadow-xl mb-6 bg-stone-900">
              <ViewportAutoplayVideo
                src="/writescholar-friends-share-demo.mp4"
                className="w-full aspect-video object-cover"
                title="WriteScholar Friends — Share quizzes, flashcards and crosswords"
                aria-label="WriteScholar Friends — Share quizzes, flashcards and crosswords with friends"
              />
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-6 px-2 leading-relaxed">
              To share: go to <strong>Saved Materials</strong> in the dashboard or header → tap the <strong>Share</strong> button on any quiz, flashcard, or crossword → select your friend.
            </p>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <button
                onClick={() => onNavigate('signup')}
                className="w-full px-6 py-3.5 bg-violet-500 hover:bg-violet-600 text-white font-bold rounded-2xl shadow-lg shadow-violet-500/25 active:scale-[0.98] text-sm flex items-center justify-center gap-2"
              >
                <span>Start sharing free</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
              <button
                onClick={() => onNavigate('features')}
                className="w-full px-6 py-3.5 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 font-semibold rounded-2xl border border-stone-200 dark:border-stone-700 text-sm"
              >
                See all features
              </button>
            </div>
          </div>

          {/* Desktop layout — text left, video right */}
          <div className="hidden lg:grid lg:grid-cols-2 gap-8 items-center">
            <div className="text-center lg:text-left order-2 lg:order-1 pb-8 lg:pb-0">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 rounded-full text-sm font-semibold mb-5">
                <span>👫</span>
                <span>Social Study, Levelled Up</span>
              </div>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-stone-900 dark:text-stone-50 leading-tight mb-5">
                Study Better,{' '}
                <span className="text-violet-500">
                  Together
                </span>
              </h2>
              <p className="text-base sm:text-lg text-stone-600 dark:text-stone-300 leading-relaxed mb-4 max-w-lg mx-auto lg:mx-0">
                Add friends with your unique code and share flashcards, quizzes, crosswords & notes in one tap. It delivers straight to their device — all they have to do is accept.
              </p>
              <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed mb-6 max-w-lg mx-auto lg:mx-0">
                To share: go to <strong>Saved Materials</strong> in the dashboard or header → tap the <strong>Share</strong> button on any quiz, flashcard, or crossword → select your friend.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <button
                  onClick={() => onNavigate('signup')}
                  className="px-7 py-3.5 bg-violet-500 hover:bg-violet-600 text-white font-bold rounded-2xl shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/40 transition-all duration-200 hover:-translate-y-0.5 text-base flex items-center justify-center gap-2"
                >
                  <span>Start sharing free</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
                <button
                  onClick={() => onNavigate('features')}
                  className="px-7 py-3.5 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 font-semibold rounded-2xl border border-stone-200 dark:border-stone-700 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 text-base"
                >
                  See all features
                </button>
              </div>
            </div>
            <div className="relative flex flex-col items-center justify-center order-1 lg:order-2 gap-6">
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 bg-violet-500/15 rounded-3xl blur-3xl" />
                <DualMascot size={280} />
              </div>
              <div className="relative w-full max-w-lg rounded-2xl overflow-hidden border-2 border-stone-200/80 dark:border-stone-700/60 shadow-xl bg-stone-900">
                <ViewportAutoplayVideo
                  src="/writescholar-friends-share-demo.mp4"
                  className="w-full aspect-video object-cover"
                  title="WriteScholar Friends — Share quizzes, flashcards and crosswords"
                  aria-label="WriteScholar Friends — Share quizzes, flashcards and crosswords with friends"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* One Code. Endless Friends. — from Share Friends page (hidden when HIDE_FRIENDS) */}
      {!HIDE_FRIENDS && (
      <section className="relative py-16 sm:py-24 bg-violet-50/40 dark:bg-stone-900 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_50%,rgba(99,102,241,0.08),transparent)] dark:bg-[radial-gradient(ellipse_60%_40%_at_50%_50%,rgba(139,92,246,0.06),transparent)]" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block px-4 py-1.5 bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 rounded-full text-sm font-semibold mb-4">
            Your Identity on WriteScholar
          </span>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-stone-800 dark:text-stone-100 mb-4">
            One Code.{' '}
            <span className="text-violet-500">
              Endless Friends.
            </span>
          </h2>
          <p className="text-base sm:text-lg text-stone-600 dark:text-stone-400 max-w-2xl mx-auto mb-10">
            Every account gets a permanent, human-readable friend code. No emails, no usernames to remember. Just drop the code, accept the friend request and you're connected.
          </p>
          <div className="relative inline-block group mb-10">
            <div className="absolute -inset-1 bg-violet-500/40 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
            <div className="relative bg-white dark:bg-stone-800 rounded-3xl px-8 sm:px-14 py-8 shadow-2xl border border-violet-200/60 dark:border-violet-800/40">
              <p className="text-xs sm:text-sm font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-3">Your unique friend code</p>
              <div className="flex items-center justify-center gap-3 sm:gap-5 flex-wrap">
                <span className="text-3xl sm:text-5xl font-black tracking-widest text-violet-600 dark:text-violet-400 font-mono">
                  WS-BUDDY-4872
                </span>
                <button
                  type="button"
                  className="flex items-center gap-2 px-4 py-2 bg-violet-100 dark:bg-violet-900/50 hover:bg-violet-200 dark:hover:bg-violet-800/60 text-violet-700 dark:text-violet-300 font-semibold rounded-xl text-sm transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  Copy code
                </button>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
                {['Easy to remember', 'Shareable anywhere', 'Yours forever'].map((tag) => (
                  <span key={tag} className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-stone-500 dark:text-stone-400">
                    <svg className="w-4 h-4 text-violet-500 dark:text-violet-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <p className="text-sm text-stone-400 dark:text-stone-500">This is a demo code — sign up to get your own unique code instantly.</p>
        </div>
      </section>
      )}

      {/* STUDY YOUR WAY - Tabbed video showcase (hidden) */}
      <section className="hidden relative py-16 sm:py-24 overflow-hidden bg-white dark:bg-stone-900">
        {/* Subtle radial gradient - matches Study Better Together / One Code vibe */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(99,102,241,0.06),transparent_60%)] dark:bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(139,92,246,0.05),transparent_60%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-violet-50/30 dark:bg-violet-950/10 pointer-events-none" />
        {/* Minimal accent - single soft blob */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-violet-200/30 dark:bg-violet-500/5 rounded-full blur-3xl -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-violet-200/20 dark:bg-violet-500/5 rounded-full blur-3xl translate-y-1/2 pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header - centered, clean hierarchy */}
          <div className="text-center mb-12 sm:mb-16">
            <span className="inline-block px-4 py-1.5 bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-400 rounded-full text-sm font-semibold mb-5">
              Every tool in one place
            </span>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 mb-6">
              <div className="hidden sm:block flex-shrink-0">
                <ScholarMascot size={120} animated={true} pose="studying" />
              </div>
              <div className="text-center sm:text-left">
                <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-stone-800 dark:text-stone-100 mb-3 tracking-tight">
                  Study your way
                </h2>
                <p className="text-base sm:text-lg text-stone-600 dark:text-stone-400 max-w-xl mx-auto sm:mx-0">
                  Pick a tool. Watch it work. It&apos;s really that easy.
                </p>
              </div>
              <div className="sm:hidden flex-shrink-0">
                <ScholarMascot size={80} animated={true} pose="studying" />
              </div>
            </div>
          </div>

          {/* Tabs - unified violet theme */}
          {(() => {
            const tabs = [
              { id: 'analyse', label: 'Analyse', icon: '📝', desc: 'Upload your paper and get professor-style feedback on structure, clarity, and how to improve.' },
              { id: 'flashcards', label: 'Flashcards', icon: '🃏', desc: 'Copy and paste your notes or content to generate flip cards for memorization and quick review.' },
              { id: 'quiz', label: 'Practice Tests', icon: '📋', desc: 'Paste your study material and get instant quizzes — multiple choice, true/false, and more.' },
              { id: 'summarise', label: 'Summarise', icon: '📋', desc: 'Upload documents or copy and paste text to get concise bullet points or summaries in seconds.' },
              { id: 'crossword', label: 'Crosswords', icon: '🧩', desc: 'Paste key terms or notes to create an interactive crossword puzzle and test your vocabulary.' },
              { id: 'games', label: 'Games', icon: '🎮', desc: 'Play Crater Blast — blast the correct falling answer before it lands. Turn your study material into an addictive quiz shooter game.' },
              { id: 'focus', label: 'Focus', icon: '🔒', desc: 'Block distracting sites until you finish a study goal. Earn your screen time with our Chrome extension.' },
            ];
            const activeTab = tabs.find(t => t.id === activeStudyTab);
            return (
              <>
                <div className="flex overflow-x-auto scrollbar-hide gap-2 sm:gap-2.5 mb-6 pb-2 sm:pb-0 sm:flex-wrap sm:justify-center snap-x snap-mandatory sm:snap-none px-1 -mx-1">
                  {tabs.map((tab) => {
                    const isActive = activeStudyTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveStudyTab(tab.id)}
                        className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 flex-shrink-0 snap-start whitespace-nowrap
                          ${isActive
                            ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/25 scale-[1.02]'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:border-violet-300 dark:hover:border-violet-700 hover:text-violet-600 dark:hover:text-violet-400'
                          }`}
                      >
                        <span className="text-base sm:text-lg">{tab.icon}</span>
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
                {activeTab && (
                  <p className="text-center text-stone-600 dark:text-stone-400 text-base sm:text-lg max-w-2xl mx-auto mb-8 px-4 leading-relaxed">
                    {activeTab.desc}
                  </p>
                )}
              </>
            );
          })()}

          {/* Video container - clean card matching Study Smarter section */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-violet-500/30 rounded-3xl blur-xl opacity-15 group-hover:opacity-25 transition-opacity duration-500" />
            <div className="relative bg-white dark:bg-stone-800 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border border-stone-200/60 dark:border-stone-700 group-hover:shadow-2xl group-hover:border-violet-200/60 dark:group-hover:border-violet-800/40 transition-all duration-300">
              <div className="bg-violet-50/40 dark:bg-violet-950/30 flex items-center justify-center min-h-[200px] sm:min-h-[380px]">
                {[
                  { id: 'analyse', src: '/writescholar-essay-checker-demo.mp4', title: 'WriteScholar Essay Checker — Professor-style feedback on your writing' },
                  { id: 'flashcards', src: '/writescholar-flashcards-demo.mp4', title: 'WriteScholar Study Pack — AI flashcard generator from notes' },
                  { id: 'quiz', src: '/writescholar-quiz-generator-demo.mp4', title: 'WriteScholar AI Quiz Generator — Turn notes into practice tests' },
                  { id: 'summarise', src: '/writescholar-summarizer-demo.mp4', title: 'WriteScholar AI Summarizer — Condense papers into key points' },
                  { id: 'crossword', src: '/writescholar-crossword-demo.mp4', title: 'WriteScholar Crossword Generator — Create study puzzles from notes' },
                  { id: 'games', src: '/writescholar-crater-blast-demo.mp4', title: 'WriteScholar Crater Blast — Quiz game study mode' },
                  { id: 'focus', src: '/writescholar-focus-mode-demo.mp4', title: 'WriteScholar Focus Mode — Block sites until you study' },
                ].map((vid) => (
                  activeStudyTab === vid.id && (
                    <ViewportAutoplayVideo
                      key={vid.id}
                      src={vid.src}
                      className="w-full max-h-[40vh] sm:max-h-[65vh] object-contain"
                      title={vid.title}
                      aria-label={vid.title}
                    />
                  )
                ))}
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-10 sm:mt-12">
            <button
              onClick={() => onNavigate('signup')}
              className="group inline-flex items-center gap-2 px-8 py-4 bg-violet-500 hover:bg-violet-600 text-white font-bold rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-violet-500/25 hover:shadow-violet-500/35 text-base sm:text-lg"
            >
              Try it free
              <svg className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
            <p className="mt-4 text-stone-500 dark:text-stone-400 text-sm">No credit card required</p>
          </div>
        </div>
      </section>

      {/* MAIN TOOL SECTION - Below the fold (hidden for now, may use later) */}
      <section id="try-it-now" className="hidden py-16 bg-white dark:bg-stone-900 scroll-mt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-800 dark:text-stone-100 mb-2">Try it now</h2>
            <p className="text-stone-600 dark:text-stone-400">Paste your content and watch the magic happen. Free, no signup. 👇</p>
          </div>
          
          {/* Mode Toggle - vibrant pills */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex flex-wrap justify-center gap-2 p-2 rounded-3xl bg-slate-100 shadow-inner">
              <button
                onClick={() => { setMode('analyze'); setInputText(''); }}
                className={`px-4 sm:px-5 py-2.5 rounded-2xl text-sm font-bold transition-all duration-200 hover:scale-105 active:scale-95 ${
                  mode === 'analyze' 
                    ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/30' 
                    : 'text-stone-600 hover:bg-white hover:shadow-md'
                }`}
              >
                Analyze Essay
              </button>
              <button
                onClick={() => { setMode('citations'); setInputText(''); }}
                className={`px-4 sm:px-5 py-2.5 rounded-2xl text-sm font-bold transition-all duration-200 hover:scale-105 active:scale-95 ${
                  mode === 'citations' 
                    ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/30' 
                    : 'text-stone-600 hover:bg-white hover:shadow-md'
                }`}
              >
                Find Citations
              </button>
              <button
                onClick={() => { setMode('summarize'); setInputText(''); }}
                className={`px-4 sm:px-5 py-2.5 rounded-2xl text-sm font-bold transition-all duration-200 hover:scale-105 active:scale-95 ${
                  mode === 'summarize' 
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30' 
                    : 'text-stone-600 hover:bg-white hover:shadow-md'
                }`}
              >
                Summarize
              </button>
              <button
                onClick={() => { setMode('quiz'); setInputText(''); }}
                className={`px-4 sm:px-5 py-2.5 rounded-2xl text-sm font-bold transition-all duration-200 hover:scale-105 active:scale-95 ${
                  mode === 'quiz' 
                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/30' 
                    : 'text-stone-600 hover:bg-white hover:shadow-md'
                }`}
              >
                Study Tools
              </button>
            </div>
          </div>

              {/* Citation Options (citations mode only) */}
            {mode === 'citations' && (
              <div className="flex justify-center mb-4">
                  <div className="inline-flex items-center gap-3 flex-wrap justify-center">
                    {/* Citation Style */}
                    <div className="inline-flex items-center bg-white dark:bg-stone-800 rounded-2xl px-4 py-2.5 border-2 border-stone-200 dark:border-stone-600 shadow-sm">
                      <span className="text-stone-500 mr-2 text-sm font-medium">Style:</span>
                  <select
                    value={citationStyle}
                    onChange={(e) => setCitationStyle(e.target.value)}
                        className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer text-sm"
                  >
                        <option value="APA">APA 7th</option>
                        <option value="MLA">MLA 9th</option>
                    <option value="Chicago">Chicago</option>
                    <option value="Harvard">Harvard</option>
                    <option value="IEEE">IEEE</option>
                    <option value="Vancouver">Vancouver</option>
                  </select>
                    </div>
                    
                    {/* Year Range */}
                    <div className="inline-flex items-center bg-white dark:bg-stone-800 rounded-2xl px-4 py-2.5 border-2 border-stone-200 dark:border-stone-600 shadow-sm">
                      <span className="text-stone-500 mr-2 text-sm font-medium">Year:</span>
                      <select
                        value={citationYearRange}
                        onChange={(e) => setCitationYearRange(e.target.value)}
                        className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer text-sm"
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
            )}

            {/* SUMMARIZE MODE - Split Panel Design */}
            {mode === 'summarize' && (
              <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-teal-100/50 border border-teal-100 overflow-hidden mb-6">
                {/* Toolbar */}
                <div className="bg-teal-50 border-b border-teal-100 px-3 sm:px-5 py-3 sm:py-4">
                  <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 overflow-x-auto sm:overflow-visible">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                        <span className="text-xs font-medium text-stone-500 flex-shrink-0">Style:</span>
                        <div className="flex items-center bg-white rounded-xl px-0.5 sm:px-1 py-1 shadow-sm border border-stone-200">
                          {(['bullet', 'paragraph', 'tldr', 'detailed'] as const).map((s) => (
                            <button
                              key={s}
                              onClick={() => setSummaryStyle(s)}
                              className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                                summaryStyle === s ? 'bg-teal-600 text-white shadow-sm' : 'text-stone-600 hover:text-stone-800 hover:bg-stone-50'
                              }`}
                            >
                              {s === 'bullet' ? 'Bullet' : s === 'paragraph' ? 'Paragraph' : s === 'tldr' ? 'TL;DR' : 'Detailed'}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                        <span className="text-xs font-medium text-stone-500 flex-shrink-0">Length:</span>
                        <div className="flex items-center bg-white rounded-xl px-0.5 sm:px-1 py-1 shadow-sm border border-stone-200">
                          {(['short', 'medium', 'long'] as const).map((l) => (
                            <button
                              key={l}
                              onClick={() => setSummaryLength(l)}
                              className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                                summaryLength === l ? 'bg-teal-600 text-white shadow-sm' : 'text-stone-600 hover:text-stone-800 hover:bg-stone-50'
                              }`}
                            >
                              {l.charAt(0).toUpperCase() + l.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={handleSubmit}
                      disabled={!inputText.trim()}
                      className={`w-full sm:w-auto px-6 py-2.5 rounded-xl flex items-center justify-center transition-all font-semibold text-sm flex-shrink-0 ${
                        inputText.trim()
                          ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-200 cursor-pointer'
                          : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                      }`}
                    >
                      ✨ Free summarise
                    </button>
                  </div>
                </div>

                {/* Editor Panels */}
                <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-stone-100">
                  {/* Left Panel - Original */}
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 bg-stone-50/50 border-b border-stone-100">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-stone-300"></div>
                        <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Original</span>
                      </div>
                      <button onClick={() => navigator.clipboard.readText().then(text => setInputText(text))} className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                        Paste
                      </button>
                    </div>
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      placeholder="Transform lengthy content into key points..."
                      className="w-full min-h-[200px] sm:min-h-[280px] p-3 sm:p-5 text-stone-800 text-[15px] border-none outline-none resize-none bg-transparent placeholder-stone-400 leading-relaxed"
                    />
                    <div className="flex items-center px-3 sm:px-5 py-2.5 sm:py-3 bg-stone-50/30 border-t border-stone-100">
                      <span className="text-xs text-stone-400 font-medium">{inputText.split(/\s+/).filter(Boolean).length} words (min 50)</span>
                    </div>
                  </div>

                  {/* Right Panel - Summary */}
                  <div className="flex flex-col bg-teal-50/50">
                    <div className="flex items-center px-3 sm:px-5 py-2.5 sm:py-3 bg-teal-50/50 border-b border-teal-100/50">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-teal-400"></div>
                        <span className="text-xs font-semibold text-teal-600 uppercase tracking-wider">Summary</span>
                      </div>
                    </div>
                    <div className="flex-1 min-h-[200px] sm:min-h-[280px] flex items-center justify-center p-5">
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-teal-100/50 flex items-center justify-center text-3xl">📝</div>
                        <p className="text-sm text-stone-500">Your summary will appear here</p>
                        <p className="text-xs text-stone-400 mt-1">Paste text on the left and click Summarize</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

              {/* Study Tools - Dashboard-style layout (quiz mode only) */}
            {mode === 'quiz' && (
              <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-amber-100/50 border border-amber-100 overflow-hidden mb-6">
                {/* Tabs - amber theme */}
                <div className="flex items-center justify-center gap-2 p-4 border-b border-amber-100">
                  <div className="inline-flex items-center bg-amber-50 border border-amber-200 rounded-2xl p-1.5">
                    {([
                      { key: 'quiz' as const, label: 'Quiz', icon: '📝' },
                      { key: 'flashcards' as const, label: 'Flashcards', icon: '🃏' },
                      { key: 'crossword' as const, label: 'Crosswords', icon: '🧩' },
                    ]).map((tool) => (
                      <button
                        key={tool.key}
                        onClick={() => { setStudyToolMode(tool.key); setInputText(''); }}
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

                {/* Toolbar - gradient bar with options + Generate button */}
                <div className="bg-amber-50 border-b border-amber-100 px-3 sm:px-5 py-3 sm:py-4">
                  <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 overflow-x-auto sm:overflow-visible">
                      {studyToolMode === 'quiz' && (
                        <>
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                            <span className="text-xs font-medium text-stone-500 flex-shrink-0">Type:</span>
                            <div className="flex items-center bg-white rounded-xl px-0.5 sm:px-1 py-1 shadow-sm border border-stone-200">
                              {(['mixed', 'multiple_choice', 'true_false', 'fill_blank'] as const).map((t) => (
                                <button key={t} onClick={() => setQuizType(t)}
                                  className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                                    quizType === t ? 'bg-amber-600 text-white shadow-sm' : 'text-stone-600 hover:text-stone-800 hover:bg-stone-50'
                                  }`}
                                >
                                  {t === 'mixed' ? 'Mixed' : t === 'multiple_choice' ? 'MCQ' : t === 'true_false' ? 'T/F' : 'Fill'}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                            <span className="text-xs font-medium text-stone-500 flex-shrink-0">Difficulty:</span>
                            <div className="flex items-center bg-white rounded-xl px-0.5 sm:px-1 py-1 shadow-sm border border-stone-200">
                              {(['easy', 'medium', 'hard'] as const).map((d) => (
                                <button key={d} onClick={() => setQuizDifficulty(d)}
                                  className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                                    quizDifficulty === d ? 'bg-amber-600 text-white shadow-sm' : 'text-stone-600 hover:text-stone-800 hover:bg-stone-50'
                                  }`}
                                >
                                  {d.charAt(0).toUpperCase() + d.slice(1)}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className="text-xs font-medium text-stone-500">Questions:</span>
                            <select value={quizQuestionCount} onChange={(e) => setQuizQuestionCount(Number(e.target.value))}
                              className="px-2 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-medium">
                              {[5, 10, 15, 20, 25].map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                          </div>
                        </>
                      )}
                      {studyToolMode === 'flashcards' && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-stone-500">Cards:</span>
                          <select value={flashcardCount} onChange={(e) => setFlashcardCount(Number(e.target.value))}
                            className="px-2 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-medium">
                            {[5, 10, 15, 20, 25, 30].map(n => <option key={n} value={n}>{n}</option>)}
                          </select>
                        </div>
                      )}
                      {studyToolMode === 'crossword' && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-stone-500">Words:</span>
                          <select value={crosswordWordCount} onChange={(e) => setCrosswordWordCount(Number(e.target.value))}
                            className="px-2 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-medium">
                            {[5, 8, 10, 12, 15].map(n => <option key={n} value={n}>{n}</option>)}
                          </select>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={handleSubmit}
                      disabled={!inputText.trim()}
                      className={`w-full sm:w-auto px-6 py-2.5 rounded-xl flex items-center justify-center transition-all font-semibold text-sm flex-shrink-0 ${
                        inputText.trim()
                          ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-200 cursor-pointer'
                          : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                      }`}
                    >
                      ✨ Create for free
                    </button>
                  </div>
                </div>

                {/* Source Material input area */}
                <div className="flex flex-col">
                  <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 bg-stone-50/50 border-b border-stone-100">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                      <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Source Material</span>
                    </div>
                    <button onClick={() => navigator.clipboard.readText().then(text => setInputText(text))} className="text-xs text-amber-600 hover:text-amber-700 font-medium">Paste</button>
                  </div>
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={placeholders[placeholderIndex]}
                    className="w-full min-h-[200px] sm:min-h-[280px] p-3 sm:p-5 text-stone-800 text-[15px] border-none outline-none resize-none bg-transparent placeholder-stone-400 leading-relaxed"
                  />
                  <div className="flex items-center px-3 sm:px-5 py-2.5 sm:py-3 bg-stone-50/30 border-t border-stone-100">
                    <span className={`text-xs font-medium ${inputText.split(/\s+/).filter(Boolean).length < 100 ? 'text-amber-600' : 'text-stone-400'}`}>
                      {inputText.split(/\s+/).filter(Boolean).length} words {inputText.split(/\s+/).filter(Boolean).length < 100 && '(min 100)'}
                    </span>
                  </div>
                </div>
              </div>
            )}

              {/* Input Area with Character outside - only for analyze, citations modes */}
            {(mode === 'analyze' || mode === 'citations') && (
              <div className="relative mb-5">
                {/* Character illustration - positioned outside to the right */}
                <CharacterIllustration />
                
                <div className={`relative bg-white dark:bg-stone-800 rounded-3xl border-2 shadow-lg transition-all duration-300 ${
                  isFocused
                    ? mode === 'citations' 
                      ? 'border-cyan-400 shadow-xl shadow-cyan-500/20 ring-4 ring-cyan-400/20'
                      : mode === 'analyze'
                      ? 'border-violet-400 shadow-xl shadow-violet-500/20 ring-4 ring-violet-400/20'
                      : mode === 'summarize'
                      ? 'border-emerald-400 shadow-xl shadow-emerald-500/20 ring-4 ring-emerald-400/20'
                      : 'border-orange-400 shadow-xl shadow-orange-500/20 ring-4 ring-orange-400/20'
                    : 'border-stone-200 dark:border-stone-600 hover:border-stone-300 dark:hover:border-stone-500 hover:shadow-xl'
                }`}>
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={placeholders[placeholderIndex]}
                    className="w-full min-h-[120px] sm:min-h-[140px] p-5 sm:p-6 text-stone-800 dark:text-stone-100 text-lg border-none outline-none resize-none bg-transparent placeholder-stone-400 dark:placeholder-stone-500 leading-relaxed"
                    style={{ fontSize: '18px' }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = Math.min(target.scrollHeight, 220) + 'px';
                    }}
                  />
                </div>
                
                {/* Submit button - below textarea */}
                <div className="flex flex-col items-center mt-4">
                  <button
                    onClick={handleSubmit}
                    disabled={!inputText.trim()}
                    className={`px-8 py-3.5 rounded-2xl flex items-center justify-center transition-all duration-200 font-bold text-base ${
                      inputText.trim()
                        ? mode === 'analyze'
                          ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/30 hover:scale-105 active:scale-95 cursor-pointer'
                          : mode === 'citations'
                          ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-500/30 hover:scale-105 active:scale-95 cursor-pointer'
                          : mode === 'summarize'
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95 cursor-pointer'
                          : 'bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-500/30 hover:scale-105 active:scale-95 cursor-pointer'
                        : 'bg-stone-200 dark:bg-stone-700 text-stone-400 dark:text-stone-500 cursor-not-allowed'
                    }`}
                  >
                    {mode === 'analyze' ? 'Get free feedback ✨' : mode === 'citations' ? 'Find sources for free 🔍' : mode === 'summarize' ? 'Summarize 📝' : 'Generate study tools 🎯'}
                  </button>
                  
                  {/* Upload file option - only for analyze mode */}
                  {mode === 'analyze' && (
                    <div className="mt-3">
                      <input
                        type="file"
                        id="landing-file-upload"
                        accept=".pdf,.doc,.docx,.txt"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                      <label
                        htmlFor="landing-file-upload"
                        className="text-sm text-stone-500 hover:text-stone-700 cursor-pointer flex items-center transition-colors"
                      >
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        or upload a file
                      </label>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Suggested Topics - Gen Z colorful pills */}
            {mode === 'citations' && (
              <div className="mb-10">
                <p className="text-sm font-bold text-slate-600 mb-4">Suggested topics</p>
                <div className="flex flex-wrap justify-center gap-2.5">
                  {suggestedTopics.map((topic, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleTopicClick(topic)}
                      className="px-4 py-2.5 bg-white text-slate-700 text-sm sm:text-base font-medium rounded-2xl border-2 border-slate-200 hover:border-cyan-400 hover:bg-cyan-50 hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 text-left"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
      </section>

      {/* Feature Grid - Your complete study toolkit (hidden for now, may use later) */}
      <section className="hidden py-20 bg-white dark:bg-stone-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative text-center mb-14">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-stone-800 dark:text-stone-100 mb-4">
              Your complete study toolkit
            </h2>
            <p className="text-lg text-stone-600 dark:text-stone-400 max-w-2xl mx-auto">
              Everything you need to ace your classes, all in one place.
            </p>
            {/* Cute character - excited with tools */}
            <div className="hidden lg:block absolute -left-16 xl:-left-8 top-1/2 -translate-y-1/2 w-28 h-36">
              <svg viewBox="0 0 140 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <path d="M50 100 Q45 130 50 160 L90 160 Q95 130 90 100" fill="#10B981" />
                <rect x="62" y="75" width="16" height="28" fill="#D4A574" />
                <ellipse cx="70" cy="48" rx="32" ry="35" fill="#D4A574" />
                <path d="M38 40 Q35 18 52 12 Q70 4 90 12 Q107 18 104 40 Q100 28 85 20 Q70 12 55 20 Q42 28 38 40" fill="#2C1810" />
                <path d="M38 40 Q32 55 38 70" fill="#2C1810" />
                <path d="M102 40 Q108 55 102 70" fill="#2C1810" />
                <ellipse cx="56" cy="46" rx="5" ry="6" fill="#1F2937" />
                <ellipse cx="84" cy="46" rx="5" ry="6" fill="#1F2937" />
                <circle cx="57" cy="44" r="2" fill="white" />
                <circle cx="85" cy="44" r="2" fill="white" />
                <path d="M52 38 Q60 32 68 38" stroke="#2C1810" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <path d="M72 38 Q80 32 88 38" stroke="#2C1810" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <path d="M55 62 Q70 76 85 62" stroke="#1F2937" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <ellipse cx="42" cy="56" rx="6" ry="4" fill="#FECACA" opacity="0.5" />
                <ellipse cx="98" cy="56" rx="6" ry="4" fill="#FECACA" opacity="0.5" />
                {/* Arms raised excited */}
                <path d="M45 100 Q25 75 15 50" stroke="#D4A574" strokeWidth="12" fill="none" strokeLinecap="round" />
                <path d="M95 100 Q115 75 125 50" stroke="#D4A574" strokeWidth="12" fill="none" strokeLinecap="round" />
                <ellipse cx="12" cy="45" rx="9" ry="10" fill="#D4A574" />
                <ellipse cx="128" cy="45" rx="9" ry="10" fill="#D4A574" />
                {/* Pencil in left hand */}
                <rect x="5" y="35" width="6" height="25" rx="1" fill="#FCD34D" transform="rotate(-20 8 47)" />
                <path d="M4 32 L10 32 L10 38 L4 38 Z" fill="#F59E0B" transform="rotate(-20 7 35)" />
                {/* Star in right hand */}
                <path d="M122 35 L124 42 L131 42 L125 47 L127 54 L122 49 L117 54 L119 47 L113 42 L120 42 Z" fill="#FBBF24" />
                <path d="M58 95 L70 108 L82 95" stroke="#059669" strokeWidth="2" fill="none" />
              </svg>
            </div>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Essay Analyzer - Rose/Pink */}
            <button 
              onClick={() => onNavigate('signup')}
              className="group relative bg-violet-50 dark:bg-violet-900/20 rounded-3xl p-6 text-left hover:shadow-2xl hover:shadow-violet-500/20 hover:-translate-y-2 transition-all duration-300 overflow-hidden border border-violet-100 dark:border-violet-800/50"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-violet-400/20 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="w-12 h-12 rounded-2xl bg-violet-600 hover:bg-violet-500 flex items-center justify-center mb-4 shadow-lg shadow-violet-500/30">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="font-bold text-stone-800 dark:text-stone-100 text-lg mb-2 relative z-10">Essay Analyzer</h3>
              <p className="text-stone-600 dark:text-stone-400 text-sm leading-relaxed relative z-10">Professor-style feedback on college papers—structure, clarity, and citations.</p>
            </button>
            
            {/* Citation Finder - Teal */}
            <button 
              onClick={() => onNavigate('signup')}
              className="group relative bg-cyan-50 rounded-3xl p-6 text-left hover:shadow-2xl hover:shadow-cyan-500/20 hover:-translate-y-2 transition-all duration-300 overflow-hidden border border-cyan-100"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-400/20 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="w-12 h-12 rounded-2xl bg-cyan-600 flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/30">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-stone-800 dark:text-stone-100 text-lg mb-2 relative z-10">Citation Finder</h3>
              <p className="text-stone-600 dark:text-stone-400 text-sm leading-relaxed relative z-10">Search millions of sources with auto-formatted citations.</p>
            </button>
            
            {/* Focus Mode */}
            <button 
              onClick={() => onNavigate('signup')}
              className="group relative bg-violet-50 dark:bg-violet-900/20 rounded-3xl p-6 text-left hover:shadow-2xl hover:shadow-violet-500/20 hover:-translate-y-2 transition-all duration-300 overflow-hidden border border-violet-100 dark:border-violet-800/50"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-violet-400/20 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="w-12 h-12 rounded-2xl bg-violet-600 flex items-center justify-center mb-4 shadow-lg shadow-violet-500/30">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="font-bold text-stone-800 dark:text-stone-100 text-lg mb-2 relative z-10">Focus Mode</h3>
              <p className="text-stone-600 dark:text-stone-400 text-sm leading-relaxed relative z-10">Block distracting sites until you complete a study goal.</p>
            </button>
            
            {/* Summarizer - Emerald */}
            <button 
              onClick={() => onNavigate('signup')}
              className="group relative bg-emerald-50 rounded-3xl p-6 text-left hover:shadow-2xl hover:shadow-emerald-500/20 hover:-translate-y-2 transition-all duration-300 overflow-hidden border border-emerald-100"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-400/20 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/30">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              </div>
              <h3 className="font-bold text-stone-800 dark:text-stone-100 text-lg mb-2 relative z-10">AI Summarizer</h3>
              <p className="text-stone-600 dark:text-stone-400 text-sm leading-relaxed relative z-10">Turn long papers into concise bullet points or paragraphs.</p>
            </button>
            
            {/* Quiz Generator - Orange */}
            <button 
              onClick={() => onNavigate('signup')}
              className="group relative bg-amber-50 rounded-3xl p-6 text-left hover:shadow-2xl hover:shadow-amber-500/20 hover:-translate-y-2 transition-all duration-300 overflow-hidden border border-amber-100"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400/20 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="w-12 h-12 rounded-2xl bg-amber-600 flex items-center justify-center mb-4 shadow-lg shadow-amber-500/30">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="font-bold text-stone-800 dark:text-stone-100 text-lg mb-2 relative z-10">Quiz Generator</h3>
              <p className="text-stone-600 dark:text-stone-400 text-sm leading-relaxed relative z-10">Create quizzes, flashcards, and crosswords from your notes.</p>
            </button>
            
            {/* Flashcards - Rose */}
            <button 
              onClick={() => onNavigate('signup')}
              className="group relative bg-violet-50 rounded-3xl p-6 text-left hover:shadow-2xl hover:shadow-violet-500/20 hover:-translate-y-2 transition-all duration-300 overflow-hidden border border-violet-100"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-violet-400/20 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="w-12 h-12 rounded-2xl bg-violet-600 flex items-center justify-center mb-4 shadow-lg shadow-violet-500/30">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="font-bold text-stone-800 dark:text-stone-100 text-lg mb-2 relative z-10">Flashcards</h3>
              <p className="text-stone-600 dark:text-stone-400 text-sm leading-relaxed relative z-10">Generate study flashcards from any content instantly.</p>
            </button>
          </div>
        </div>
      </section>

      {/* What WriteScholar Can Help You With - hidden */}
      <section className="hidden relative py-12 sm:py-24 bg-white dark:bg-stone-900 max-lg:bg-violet-50/30 dark:max-lg:bg-stone-900 overflow-hidden">
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="absolute top-0 left-[3%] hidden xl:block text-4xl opacity-20 animate-float">📖</div>
          <div className="absolute top-8 right-[3%] hidden xl:block text-4xl opacity-20 animate-float-delayed">✍️</div>
          {/* Mobile floating elements */}
          <div className="xl:hidden absolute top-20 left-4 text-3xl opacity-50 animate-float">📖</div>
          <div className="xl:hidden absolute top-32 right-4 text-2xl opacity-45 animate-float-delayed">✍️</div>
          <div className="xl:hidden absolute bottom-64 left-6 text-2xl opacity-45 animate-float" style={{ animationDelay: '0.5s' }}>✨</div>
          <div className="lg:hidden absolute top-1/3 right-8 w-12 h-12 rounded-xl bg-violet-400/20 animate-float" />
          <div className="lg:hidden absolute bottom-1/3 left-6 w-10 h-10 rounded-full bg-violet-400/18 animate-float-delayed" style={{ animationDelay: '0.6s' }} />
          <div className="relative text-center mb-12">
            <span className="inline-block px-4 py-1.5 bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-400 rounded-full text-sm font-semibold mb-4">Your Academic Toolkit</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-stone-800 dark:text-stone-100">
              What WriteScholar Can Help You With
            </h2>
            <p className="mt-4 text-lg text-stone-600 dark:text-stone-400 max-w-2xl mx-auto">
              Essays, exams, citations, and more — all in one place.
            </p>
          </div>

          {/* Category Tabs — solid accent colors (no gradients) */}
          <div className="flex overflow-x-auto scrollbar-hide gap-2.5 sm:gap-3 mb-8 sm:mb-12 sm:mx-0 sm:px-0 sm:flex-wrap sm:justify-center pb-2 sm:pb-0 snap-x snap-mandatory sm:snap-none px-1">
            {helpCategories.map((category) => {
              const solidBg: Record<string, string> = {
                essays: 'bg-violet-600',
                exams: 'bg-amber-600',
                summarizing: 'bg-cyan-600',
                citations: 'bg-violet-600',
                grammar: 'bg-emerald-600',
              };
              const shadowColors: Record<string, string> = {
                essays: 'shadow-violet-500/30',
                exams: 'shadow-amber-500/30',
                summarizing: 'shadow-cyan-500/30',
                citations: 'shadow-violet-500/30',
                grammar: 'shadow-emerald-500/30',
              };
              const isActive = activeHelpCategory === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveHelpCategory(category.id)}
                  className={`px-5 sm:px-6 py-2.5 rounded-2xl text-sm sm:text-base font-bold transition-all duration-200 hover:scale-105 active:scale-95 flex-shrink-0 snap-start whitespace-nowrap ${
                    isActive
                      ? `${solidBg[category.id] || 'bg-violet-600'} text-white shadow-lg ${shadowColors[category.id] || 'shadow-violet-500/30'}`
                      : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700 border-2 border-stone-200 dark:border-stone-600 max-lg:border-stone-300 max-lg:dark:border-stone-500'
                  }`}
                >
                  {category.label}
                </button>
              );
            })}
          </div>
                  
          {/* Content Area */}
          <div className="relative bg-stone-50 dark:bg-stone-900 rounded-2xl sm:rounded-3xl p-5 sm:p-12 lg:p-16 border border-stone-200 dark:border-stone-700 shadow-xl overflow-hidden max-lg:border-violet-200/40 max-lg:dark:border-violet-800/30 max-lg:shadow-violet-500/10">
            <div className="absolute top-0 right-0 w-48 h-48 bg-violet-400/15 rounded-full -translate-y-1/2 translate-x-1/2" aria-hidden />
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center relative z-10">
              {/* Text Content */}
              <div className="order-2 lg:order-1">
                <h3 className="text-2xl sm:text-3xl font-bold text-stone-800 dark:text-stone-100 mb-4">
                  {helpCategories.find(c => c.id === activeHelpCategory)?.title}
                </h3>
                <p className="text-stone-600 dark:text-stone-400 text-lg leading-relaxed mb-8">
                  {helpCategories.find(c => c.id === activeHelpCategory)?.description}
                </p>
                <button
                  onClick={() => onNavigate('signup')}
                  className="inline-flex items-center px-6 py-3 text-white font-bold rounded-2xl bg-violet-600 hover:bg-violet-500 hover:scale-105 active:scale-95 hover:shadow-xl shadow-violet-500/30 transition-all duration-200"
                >
                  Start for free
                </button>
              </div>
                  
              {/* Woman Character Illustration - Different poses for each category */}
              <div className="order-1 lg:order-2 flex justify-center">
                <div className="relative w-48 h-56 sm:w-80 sm:h-96">
                  {/* Essays - Writing at desk */}
                  {activeHelpCategory === 'essays' && (
                    <svg viewBox="0 0 320 380" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                      <rect x="40" y="280" width="240" height="12" rx="4" fill="#E5E7EB" />
                      <rect x="60" y="292" width="8" height="60" fill="#D1D5DB" />
                      <rect x="252" y="292" width="8" height="60" fill="#D1D5DB" />
                      <rect x="100" y="240" width="80" height="100" rx="4" fill="white" stroke="#E5E7EB" strokeWidth="2" />
                      <line x1="112" y1="260" x2="168" y2="260" stroke="#E5E7EB" strokeWidth="3" />
                      <line x1="112" y1="275" x2="160" y2="275" stroke="#E5E7EB" strokeWidth="3" />
                      <line x1="112" y1="290" x2="165" y2="290" stroke="#E5E7EB" strokeWidth="3" />
                      <line x1="112" y1="305" x2="155" y2="305" stroke="#E5E7EB" strokeWidth="3" />
                      <rect x="180" y="230" width="100" height="65" rx="6" fill="#374151" />
                      <rect x="186" y="236" width="88" height="52" rx="3" fill="#60A5FA" />
                      <rect x="175" y="295" width="110" height="8" rx="2" fill="#4B5563" />
                      <ellipse cx="70" cy="270" rx="18" ry="6" fill="#D1D5DB" />
                      <path d="M52 270 L56 240 L84 240 L88 270" fill="#F3F4F6" stroke="#D1D5DB" strokeWidth="2" />
                      <ellipse cx="70" cy="240" rx="14" ry="5" fill="#92400E" />
                      <path d="M260 180 L263 188 L271 191 L263 194 L260 202 L257 194 L249 191 L257 188 Z" fill="#6366F1" />
                      <path d="M50 150 L52 155 L57 157 L52 159 L50 164 L48 159 L43 157 L48 155 Z" fill="#6366F1" />
                      <path d="M140 200 Q130 250 140 280 L180 280 Q190 250 180 200" fill="#8B5CF6" />
                      <rect x="150" y="170" width="20" height="35" fill="#FCD9B6" />
                      <ellipse cx="160" cy="120" rx="45" ry="50" fill="#FCD9B6" />
                      <path d="M115 100 Q100 60 130 50 Q160 35 190 50 Q220 60 205 100 Q210 80 195 70 Q160 45 125 70 Q110 80 115 100" fill="#D4A853" />
                      <path d="M115 100 Q105 140 115 180" fill="#D4A853" />
                      <path d="M205 100 Q215 140 205 180" fill="#D4A853" />
                      <ellipse cx="140" cy="115" rx="18" ry="16" fill="none" stroke="#374151" strokeWidth="3" />
                      <ellipse cx="180" cy="115" rx="18" ry="16" fill="none" stroke="#374151" strokeWidth="3" />
                      <path d="M158 115 L162 115" stroke="#374151" strokeWidth="3" />
                      <path d="M122 110 L110 105" stroke="#374151" strokeWidth="3" />
                      <path d="M198 110 L210 105" stroke="#374151" strokeWidth="3" />
                      <ellipse cx="140" cy="118" rx="5" ry="6" fill="#1F2937" />
                      <ellipse cx="180" cy="118" rx="5" ry="6" fill="#1F2937" />
                      <circle cx="142" cy="116" r="2" fill="white" />
                      <circle cx="182" cy="116" r="2" fill="white" />
                      <path d="M125 98 Q140 92 155 98" stroke="#8B7355" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                      <path d="M165 98 Q180 92 195 98" stroke="#8B7355" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                      <path d="M145 150 Q160 162 175 150" stroke="#1F2937" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                      <ellipse cx="125" cy="140" rx="8" ry="5" fill="#FECACA" opacity="0.4" />
                      <ellipse cx="195" cy="140" rx="8" ry="5" fill="#FECACA" opacity="0.4" />
                      <path d="M130 210 Q100 230 90 260" stroke="#FCD9B6" strokeWidth="16" fill="none" strokeLinecap="round" />
                      <path d="M190 210 Q210 220 230 235" stroke="#FCD9B6" strokeWidth="16" fill="none" strokeLinecap="round" />
                      <ellipse cx="88" cy="265" rx="12" ry="10" fill="#FCD9B6" />
                      <ellipse cx="235" cy="240" rx="12" ry="10" fill="#FCD9B6" />
                      <rect x="225" y="220" width="4" height="35" rx="2" fill="#6366F1" transform="rotate(30 227 237)" />
                      <path d="M145 195 L160 210 L175 195" stroke="white" strokeWidth="3" fill="none" />
                    </svg>
                  )}
                  
                  {/* Exams - Reading with books around (studying) */}
                  {activeHelpCategory === 'exams' && (
                    <svg viewBox="0 0 320 380" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                      {/* Stack of books left */}
                      <rect x="30" y="290" width="60" height="15" rx="2" fill="#6366F1" />
                      <rect x="35" y="275" width="55" height="15" rx="2" fill="#10B981" />
                      <rect x="32" y="260" width="58" height="15" rx="2" fill="#F59E0B" />
                      <rect x="38" y="245" width="50" height="15" rx="2" fill="#EF4444" />
                      {/* Stack of books right */}
                      <rect x="240" y="295" width="55" height="12" rx="2" fill="#8B5CF6" />
                      <rect x="245" y="283" width="50" height="12" rx="2" fill="#3B82F6" />
                      <rect x="242" y="271" width="53" height="12" rx="2" fill="#EC4899" />
                      {/* Open book in hands */}
                      <path d="M110 250 Q160 230 160 250 L160 340 Q160 320 110 340 Z" fill="#FAFAFA" stroke="#E5E7EB" strokeWidth="2" />
                      <path d="M210 250 Q160 230 160 250 L160 340 Q160 320 210 340 Z" fill="#FAFAFA" stroke="#E5E7EB" strokeWidth="2" />
                      <line x1="120" y1="270" x2="150" y2="265" stroke="#D1D5DB" strokeWidth="2" />
                      <line x1="120" y1="285" x2="150" y2="280" stroke="#D1D5DB" strokeWidth="2" />
                      <line x1="120" y1="300" x2="150" y2="295" stroke="#D1D5DB" strokeWidth="2" />
                      <line x1="170" y1="265" x2="200" y2="270" stroke="#D1D5DB" strokeWidth="2" />
                      <line x1="170" y1="280" x2="200" y2="285" stroke="#D1D5DB" strokeWidth="2" />
                      <line x1="170" y1="295" x2="200" y2="300" stroke="#D1D5DB" strokeWidth="2" />
                      {/* Sparkles */}
                      <path d="M280 150 L283 158 L291 161 L283 164 L280 172 L277 164 L269 161 L277 158 Z" fill="#6366F1" />
                      <path d="M40 180 L42 185 L47 187 L42 189 L40 194 L38 189 L33 187 L38 185 Z" fill="#6366F1" />
                      {/* Woman Body - seated, leaning forward reading */}
                      <path d="M130 180 Q120 220 130 250 L190 250 Q200 220 190 180" fill="#8B5CF6" />
                      <rect x="150" y="150" width="20" height="35" fill="#FCD9B6" />
                      <ellipse cx="160" cy="100" rx="45" ry="50" fill="#FCD9B6" />
                      {/* Hair */}
                      <path d="M115 80 Q100 40 130 30 Q160 15 190 30 Q220 40 205 80 Q210 60 195 50 Q160 25 125 50 Q110 60 115 80" fill="#D4A853" />
                      <path d="M115 80 Q105 120 115 160" fill="#D4A853" />
                      <path d="M205 80 Q215 120 205 160" fill="#D4A853" />
                      {/* Glasses */}
                      <ellipse cx="140" cy="95" rx="18" ry="16" fill="none" stroke="#374151" strokeWidth="3" />
                      <ellipse cx="180" cy="95" rx="18" ry="16" fill="none" stroke="#374151" strokeWidth="3" />
                      <path d="M158 95 L162 95" stroke="#374151" strokeWidth="3" />
                      <path d="M122 90 L110 85" stroke="#374151" strokeWidth="3" />
                      <path d="M198 90 L210 85" stroke="#374151" strokeWidth="3" />
                      {/* Eyes - looking down at book */}
                      <ellipse cx="140" cy="100" rx="5" ry="4" fill="#1F2937" />
                      <ellipse cx="180" cy="100" rx="5" ry="4" fill="#1F2937" />
                      <circle cx="141" cy="99" r="1.5" fill="white" />
                      <circle cx="181" cy="99" r="1.5" fill="white" />
                      <path d="M125 78 Q140 72 155 78" stroke="#8B7355" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                      <path d="M165 78 Q180 72 195 78" stroke="#8B7355" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                      <path d="M145 125 Q160 135 175 125" stroke="#1F2937" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                      <ellipse cx="125" cy="115" rx="8" ry="5" fill="#FECACA" opacity="0.4" />
                      <ellipse cx="195" cy="115" rx="8" ry="5" fill="#FECACA" opacity="0.4" />
                      {/* Arms holding book */}
                      <path d="M125 190 Q100 220 105 260" stroke="#FCD9B6" strokeWidth="16" fill="none" strokeLinecap="round" />
                      <path d="M195 190 Q220 220 215 260" stroke="#FCD9B6" strokeWidth="16" fill="none" strokeLinecap="round" />
                      <ellipse cx="105" cy="265" rx="12" ry="10" fill="#FCD9B6" />
                      <ellipse cx="215" cy="265" rx="12" ry="10" fill="#FCD9B6" />
                      <path d="M145 175 L160 190 L175 175" stroke="white" strokeWidth="3" fill="none" />
                    </svg>
                  )}
                  
                  {/* Summarizing - At whiteboard planning/organizing */}
                  {activeHelpCategory === 'summarizing' && (
                    <svg viewBox="0 0 320 380" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                      {/* Whiteboard */}
                      <rect x="60" y="50" width="200" height="150" rx="4" fill="white" stroke="#D1D5DB" strokeWidth="3" />
                      <rect x="140" y="200" width="20" height="80" fill="#9CA3AF" />
                      <rect x="120" y="275" width="60" height="10" rx="2" fill="#6B7280" />
                      {/* Mind map on board */}
                      <ellipse cx="160" cy="100" rx="35" ry="20" fill="#EEF2FF" stroke="#6366F1" strokeWidth="2" />
                      <text x="160" y="105" textAnchor="middle" fontSize="12" fill="#6366F1" fontWeight="bold">KEY POINTS</text>
                      <line x1="125" y1="100" x2="90" y2="80" stroke="#6366F1" strokeWidth="2" />
                      <line x1="195" y1="100" x2="230" y2="80" stroke="#6366F1" strokeWidth="2" />
                      <line x1="160" y1="120" x2="160" y2="150" stroke="#6366F1" strokeWidth="2" />
                      <line x1="125" y1="115" x2="95" y2="140" stroke="#6366F1" strokeWidth="2" />
                      <line x1="195" y1="115" x2="225" y2="140" stroke="#6366F1" strokeWidth="2" />
                      <circle cx="90" cy="75" r="15" fill="#DBEAFE" stroke="#3B82F6" strokeWidth="2" />
                      <circle cx="230" cy="75" r="15" fill="#D1FAE5" stroke="#10B981" strokeWidth="2" />
                      <circle cx="160" cy="160" r="15" fill="#FEE2E2" stroke="#EF4444" strokeWidth="2" />
                      <circle cx="95" cy="150" r="12" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2" />
                      <circle cx="225" cy="150" r="12" fill="#F3E8FF" stroke="#8B5CF6" strokeWidth="2" />
                      {/* Sparkles */}
                      <path d="M280 120 L283 128 L291 131 L283 134 L280 142 L277 134 L269 131 L277 128 Z" fill="#6366F1" />
                      <path d="M40 100 L42 105 L47 107 L42 109 L40 114 L38 109 L33 107 L38 105 Z" fill="#A5B4FC" />
                      {/* Woman standing, pointing at board */}
                      <path d="M200 260 Q195 310 200 350 L240 350 Q245 310 240 260" fill="#8B5CF6" />
                      <rect x="210" y="230" width="20" height="35" fill="#FCD9B6" />
                      <ellipse cx="220" cy="180" rx="45" ry="50" fill="#FCD9B6" />
                      {/* Hair */}
                      <path d="M175 160 Q160 120 190 110 Q220 95 250 110 Q280 120 265 160 Q270 140 255 130 Q220 105 185 130 Q170 140 175 160" fill="#D4A853" />
                      <path d="M175 160 Q165 200 175 240" fill="#D4A853" />
                      <path d="M265 160 Q275 200 265 240" fill="#D4A853" />
                      {/* Glasses */}
                      <ellipse cx="200" cy="175" rx="18" ry="16" fill="none" stroke="#374151" strokeWidth="3" />
                      <ellipse cx="240" cy="175" rx="18" ry="16" fill="none" stroke="#374151" strokeWidth="3" />
                      <path d="M218 175 L222 175" stroke="#374151" strokeWidth="3" />
                      <path d="M182 170 L170 165" stroke="#374151" strokeWidth="3" />
                      <path d="M258 170 L270 165" stroke="#374151" strokeWidth="3" />
                      {/* Eyes */}
                      <ellipse cx="200" cy="178" rx="5" ry="6" fill="#1F2937" />
                      <ellipse cx="240" cy="178" rx="5" ry="6" fill="#1F2937" />
                      <circle cx="202" cy="176" r="2" fill="white" />
                      <circle cx="242" cy="176" r="2" fill="white" />
                      <path d="M185 158 Q200 152 215 158" stroke="#8B7355" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                      <path d="M225 158 Q240 152 255 158" stroke="#8B7355" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                      <path d="M205 205 Q220 217 235 205" stroke="#1F2937" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                      <ellipse cx="185" cy="195" rx="8" ry="5" fill="#FECACA" opacity="0.4" />
                      <ellipse cx="255" cy="195" rx="8" ry="5" fill="#FECACA" opacity="0.4" />
                      {/* Arm pointing at board */}
                      <path d="M190 270 Q150 250 130 200" stroke="#FCD9B6" strokeWidth="16" fill="none" strokeLinecap="round" />
                      <path d="M250 270 Q270 290 280 310" stroke="#FCD9B6" strokeWidth="16" fill="none" strokeLinecap="round" />
                      <ellipse cx="125" cy="195" rx="10" ry="12" fill="#FCD9B6" />
                      <ellipse cx="283" cy="315" rx="12" ry="10" fill="#FCD9B6" />
                      <path d="M205 255 L220 270 L235 255" stroke="white" strokeWidth="3" fill="none" />
                    </svg>
                  )}
                  
                  {/* Citations - Holding book with quotes floating */}
                  {activeHelpCategory === 'citations' && (
                    <svg viewBox="0 0 320 380" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                      {/* Floating quote marks */}
                      <text x="50" y="100" fontSize="60" fill="#6366F1" opacity="0.3" fontFamily="system-ui, sans-serif">"</text>
                      <text x="250" y="150" fontSize="60" fill="#6366F1" opacity="0.3" fontFamily="system-ui, sans-serif">"</text>
                      <text x="270" y="280" fontSize="40" fill="#A5B4FC" opacity="0.4" fontFamily="system-ui, sans-serif">"</text>
                      <text x="30" y="250" fontSize="40" fill="#A5B4FC" opacity="0.4" fontFamily="system-ui, sans-serif">"</text>
                      {/* Citation cards floating */}
                      <rect x="40" y="160" width="70" height="45" rx="4" fill="white" stroke="#E5E7EB" strokeWidth="2" transform="rotate(-10 75 182)" />
                      <line x1="50" y1="175" x2="100" y2="170" stroke="#D1D5DB" strokeWidth="2" />
                      <line x1="52" y1="188" x2="95" y2="183" stroke="#D1D5DB" strokeWidth="2" />
                      <rect x="220" y="180" width="70" height="45" rx="4" fill="white" stroke="#E5E7EB" strokeWidth="2" transform="rotate(8 255 202)" />
                      <line x1="228" y1="195" x2="280" y2="198" stroke="#D1D5DB" strokeWidth="2" />
                      <line x1="226" y1="208" x2="275" y2="211" stroke="#D1D5DB" strokeWidth="2" />
                      {/* Big open book */}
                      <path d="M90 280 Q160 255 160 280 L160 370 Q160 345 90 370 Z" fill="#FAFAFA" stroke="#6366F1" strokeWidth="2" />
                      <path d="M230 280 Q160 255 160 280 L160 370 Q160 345 230 370 Z" fill="#FAFAFA" stroke="#6366F1" strokeWidth="2" />
                      <line x1="100" y1="300" x2="150" y2="292" stroke="#A5B4FC" strokeWidth="2" />
                      <line x1="100" y1="315" x2="150" y2="307" stroke="#A5B4FC" strokeWidth="2" />
                      <line x1="100" y1="330" x2="145" y2="322" stroke="#A5B4FC" strokeWidth="2" />
                      <line x1="100" y1="345" x2="150" y2="337" stroke="#A5B4FC" strokeWidth="2" />
                      <line x1="170" y1="292" x2="220" y2="300" stroke="#A5B4FC" strokeWidth="2" />
                      <line x1="170" y1="307" x2="220" y2="315" stroke="#A5B4FC" strokeWidth="2" />
                      <line x1="170" y1="322" x2="215" y2="330" stroke="#A5B4FC" strokeWidth="2" />
                      {/* Sparkles */}
                      <path d="M280 100 L283 108 L291 111 L283 114 L280 122 L277 114 L269 111 L277 108 Z" fill="#6366F1" />
                      <path d="M40 80 L42 85 L47 87 L42 89 L40 94 L38 89 L33 87 L38 85 Z" fill="#6366F1" />
                      {/* Woman - holding book up */}
                      <path d="M130 170 Q120 220 130 260 L190 260 Q200 220 190 170" fill="#8B5CF6" />
                      <rect x="150" y="140" width="20" height="35" fill="#FCD9B6" />
                      <ellipse cx="160" cy="90" rx="45" ry="50" fill="#FCD9B6" />
                      {/* Hair */}
                      <path d="M115 70 Q100 30 130 20 Q160 5 190 20 Q220 30 205 70 Q210 50 195 40 Q160 15 125 40 Q110 50 115 70" fill="#D4A853" />
                      <path d="M115 70 Q105 110 115 150" fill="#D4A853" />
                      <path d="M205 70 Q215 110 205 150" fill="#D4A853" />
                      {/* Glasses */}
                      <ellipse cx="140" cy="85" rx="18" ry="16" fill="none" stroke="#374151" strokeWidth="3" />
                      <ellipse cx="180" cy="85" rx="18" ry="16" fill="none" stroke="#374151" strokeWidth="3" />
                      <path d="M158 85 L162 85" stroke="#374151" strokeWidth="3" />
                      <path d="M122 80 L110 75" stroke="#374151" strokeWidth="3" />
                      <path d="M198 80 L210 75" stroke="#374151" strokeWidth="3" />
                      {/* Eyes - happy/proud */}
                      <ellipse cx="140" cy="88" rx="5" ry="6" fill="#1F2937" />
                      <ellipse cx="180" cy="88" rx="5" ry="6" fill="#1F2937" />
                      <circle cx="142" cy="86" r="2" fill="white" />
                      <circle cx="182" cy="86" r="2" fill="white" />
                      <path d="M125 68 Q140 62 155 68" stroke="#8B7355" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                      <path d="M165 68 Q180 62 195 68" stroke="#8B7355" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                      <path d="M145 115 Q160 127 175 115" stroke="#1F2937" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                      <ellipse cx="125" cy="105" rx="8" ry="5" fill="#FECACA" opacity="0.4" />
                      <ellipse cx="195" cy="105" rx="8" ry="5" fill="#FECACA" opacity="0.4" />
                      {/* Arms holding book */}
                      <path d="M125 180 Q90 220 85 275" stroke="#FCD9B6" strokeWidth="16" fill="none" strokeLinecap="round" />
                      <path d="M195 180 Q230 220 235 275" stroke="#FCD9B6" strokeWidth="16" fill="none" strokeLinecap="round" />
                      <ellipse cx="85" cy="280" rx="12" ry="10" fill="#FCD9B6" />
                      <ellipse cx="235" cy="280" rx="12" ry="10" fill="#FCD9B6" />
                      <path d="M145 165 L160 180 L175 165" stroke="white" strokeWidth="3" fill="none" />
                    </svg>
                  )}
                  
                  {/* Grammar & Style - With magnifying glass checking text */}
                  {activeHelpCategory === 'grammar' && (
                    <svg viewBox="0 0 320 380" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                      {/* Large document */}
                      <rect x="130" y="200" width="120" height="150" rx="6" fill="white" stroke="#E5E7EB" strokeWidth="3" />
                      <line x1="145" y1="225" x2="235" y2="225" stroke="#D1D5DB" strokeWidth="3" />
                      <line x1="145" y1="245" x2="220" y2="245" stroke="#D1D5DB" strokeWidth="3" />
                      <line x1="145" y1="265" x2="235" y2="265" stroke="#10B981" strokeWidth="3" />
                      <line x1="145" y1="285" x2="200" y2="285" stroke="#D1D5DB" strokeWidth="3" />
                      <line x1="145" y1="305" x2="230" y2="305" stroke="#EF4444" strokeWidth="3" strokeDasharray="4 2" />
                      <line x1="145" y1="325" x2="215" y2="325" stroke="#D1D5DB" strokeWidth="3" />
                      {/* Checkmarks and X marks */}
                      <path d="M240 260 L245 265 L255 255" stroke="#10B981" strokeWidth="3" fill="none" strokeLinecap="round" />
                      <path d="M240 300 L250 310 M250 300 L240 310" stroke="#EF4444" strokeWidth="3" fill="none" strokeLinecap="round" />
                      {/* Magnifying glass */}
                      <circle cx="75" cy="270" r="35" fill="none" stroke="#6366F1" strokeWidth="5" />
                      <circle cx="75" cy="270" r="30" fill="white" fillOpacity="0.3" />
                      <line x1="100" y1="295" x2="125" y2="320" stroke="#6366F1" strokeWidth="7" strokeLinecap="round" />
                      {/* Text being magnified */}
                      <text x="58" y="268" fontSize="12" fill="#374151" fontWeight="bold">Aa</text>
                      <text x="58" y="282" fontSize="9" fill="#6B7280">check</text>
                      {/* Sparkles */}
                      <path d="M280 100 L283 108 L291 111 L283 114 L280 122 L277 114 L269 111 L277 108 Z" fill="#6366F1" />
                      <path d="M40 150 L42 155 L47 157 L42 159 L40 164 L38 159 L33 157 L38 155 Z" fill="#10B981" />
                      <path d="M290 250 L292 255 L297 257 L292 259 L290 264 L288 259 L283 257 L288 255 Z" fill="#A5B4FC" />
                      {/* Woman - looking through magnifying glass */}
                      <path d="M170 150 Q160 190 170 220 L210 220 Q220 190 210 150" fill="#8B5CF6" />
                      <rect x="180" y="120" width="20" height="35" fill="#FCD9B6" />
                      <ellipse cx="190" cy="75" rx="40" ry="45" fill="#FCD9B6" />
                      {/* Hair */}
                      <path d="M150 55 Q140 20 170 15 Q190 5 220 15 Q250 20 240 55 Q245 40 230 30 Q190 10 160 30 Q145 40 150 55" fill="#D4A853" />
                      <path d="M150 55 Q140 95 150 130" fill="#D4A853" />
                      <path d="M230 55 Q240 95 230 130" fill="#D4A853" />
                      {/* Glasses */}
                      <ellipse cx="172" cy="73" rx="16" ry="14" fill="none" stroke="#374151" strokeWidth="3" />
                      <ellipse cx="208" cy="73" rx="16" ry="14" fill="none" stroke="#374151" strokeWidth="3" />
                      <path d="M188 73 L192 73" stroke="#374151" strokeWidth="3" />
                      <path d="M156 68 L145 63" stroke="#374151" strokeWidth="3" />
                      <path d="M224 68 L235 63" stroke="#374151" strokeWidth="3" />
                      {/* Eyes - focused/concentrating */}
                      <ellipse cx="172" cy="75" rx="4" ry="5" fill="#1F2937" />
                      <ellipse cx="208" cy="75" rx="4" ry="5" fill="#1F2937" />
                      <circle cx="173" cy="73" r="1.5" fill="white" />
                      <circle cx="209" cy="73" r="1.5" fill="white" />
                      <path d="M158 57 Q172 51 186 57" stroke="#8B7355" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                      <path d="M194 57 Q208 51 222 57" stroke="#8B7355" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                      <path d="M178 97 Q190 105 202 97" stroke="#1F2937" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                      <ellipse cx="160" cy="90" rx="7" ry="4" fill="#FECACA" opacity="0.4" />
                      <ellipse cx="220" cy="90" rx="7" ry="4" fill="#FECACA" opacity="0.4" />
                      {/* Arm holding magnifying glass */}
                      <path d="M160 155 Q120 190 95 240" stroke="#FCD9B6" strokeWidth="14" fill="none" strokeLinecap="round" />
                      <path d="M220 155 Q250 175 265 200" stroke="#FCD9B6" strokeWidth="14" fill="none" strokeLinecap="round" />
                      <ellipse cx="93" cy="245" rx="10" ry="9" fill="#FCD9B6" />
                      <ellipse cx="268" cy="203" rx="10" ry="9" fill="#FCD9B6" />
                      <path d="M178 145 L190 158 L202 145" stroke="white" strokeWidth="3" fill="none" />
                    </svg>
                  )}
                  </div>
                </div>
                  </div>
                  </div>
                  </div>
      </section>

      {/* FAQ Section - Purple tint */}
      <section className="relative py-12 sm:py-24 bg-violet-50/70 dark:bg-stone-900 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-200/25 dark:bg-violet-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-violet-200/20 dark:bg-violet-600/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-center gap-4 sm:gap-6 mb-8 sm:mb-12">
            <div className="text-center lg:text-left flex-1">
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-stone-900 dark:text-stone-100 mb-3 sm:mb-5">
                Frequently Asked Questions
              </h2>
              <p className="text-lg text-stone-600 dark:text-stone-400">
                Everything you need to know—essay feedback, citations, and study tools for college and university coursework
              </p>
            </div>
            {/* Mascot - thinking pose */}
            <div className="hidden lg:flex flex-shrink-0 items-center justify-center">
              <ScholarMascot size={160} animated={true} pose="thinking" />
            </div>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-white/70 dark:bg-stone-800/80 rounded-2xl border border-violet-200/60 dark:border-violet-800/40 overflow-hidden hover:border-violet-300 dark:hover:border-violet-600 hover:shadow-lg hover:shadow-violet-500/15 transition-all duration-200 backdrop-blur-sm">
                <button
                  onClick={() => setOpenFAQ(openFAQ === idx ? null : idx)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-violet-50/50 dark:hover:bg-violet-900/20 transition-all duration-200"
                >
                  <span className="font-bold text-stone-800 dark:text-stone-100 text-base sm:text-lg pr-4">{faq.question}</span>
                  <svg className={`w-5 h-5 text-stone-400 flex-shrink-0 transition-transform ${openFAQ === idx ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openFAQ === idx ? 'max-h-56' : 'max-h-0'}`}>
                  <div className="px-6 pb-5 text-stone-600 dark:text-stone-400 text-base leading-relaxed">{faq.answer}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-12 sm:py-24 overflow-hidden bg-stone-200 dark:bg-stone-950">
        {/* Light background with subtle violet accents */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_60%_at_50%_-5%,rgba(251,207,232,0.25),transparent_55%)] dark:bg-[radial-gradient(ellipse_100%_60%_at_50%_-5%,rgba(251,207,232,0.08),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_85%_85%,rgba(251,113,133,0.12),transparent_45%)] dark:bg-[radial-gradient(ellipse_70%_50%_at_85%_85%,rgba(251,113,133,0.06),transparent_45%)]" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-stone-900 dark:text-white mb-4 sm:mb-5">
              Ready to ace your classes?
            </h2>
            <p className="text-base sm:text-lg text-stone-600 dark:text-stone-300 mb-8 sm:mb-10 max-w-xl mx-auto px-2">
              Join 50k+ students using WriteScholar for papers and exams. Start free today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button
                onClick={() => onNavigate('signup')}
                className="inline-flex items-center justify-center px-8 py-4 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-violet-500/30 text-lg"
              >
                Let's get started
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
              <button
                onClick={() => onNavigate('pricing')}
                className="inline-flex items-center justify-center px-8 py-4 bg-white dark:bg-stone-800 border-2 border-stone-300 dark:border-stone-600 text-stone-900 dark:text-white font-bold rounded-2xl hover:bg-stone-100 dark:hover:bg-stone-700 hover:scale-105 active:scale-95 transition-all text-lg"
              >
                View Pricing
              </button>
            </div>
            {/* ScholarMascot (celebrating pose) */}
            <div className="flex justify-center items-center">
              <ScholarMascot size={180} animated={true} pose="celebrating" />
            </div>
          </div>
        </div>
      </section>

      <Footer onNavigate={onNavigate} />

      {/* Loading Animations */}
      {showFakeAnimation && mode === 'citations' && (
        <AnalysisAnimation isPopup={true} text="Finding citations for your topic" isComplete={false} variant="citations" />
      )}

      {showFakeAnimation && mode === 'analyze' && (
        <AnalysisAnimation isPopup={true} text="Analyzing your writing" isComplete={false} />
      )}

      {showFakeAnimation && mode === 'summarize' && (
        <AnalysisAnimation isPopup={true} text="Creating your summary" isComplete={false} />
      )}

      {showFakeAnimation && mode === 'quiz' && (
        <AnalysisAnimation isPopup={true} text={studyToolMode === 'flashcards' ? 'Generating flashcards' : studyToolMode === 'crossword' ? 'Generating crossword puzzle' : 'Generating quiz questions'} isComplete={false} />
      )}

      {/* Fake Results Modal */}
      {showFakeResults && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="relative bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full mx-4 shadow-2xl animate-fade-in">
            <button type="button" onClick={() => setShowFakeResults(false)} className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors" aria-label="Close">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            {/* Character - concerned look */}
            <div className="flex justify-center mb-4">
              <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-24 h-24">
                <ellipse cx="60" cy="60" rx="50" ry="52" fill="#FCD9B6" />
                <path d="M20 48 Q16 20 38 12 Q60 2 82 12 Q104 20 100 48 Q96 32 80 22 Q60 12 40 22 Q24 32 20 48" fill="#D4A853" />
                <path d="M20 48 Q12 70 20 90" fill="#D4A853" />
                <path d="M100 48 Q108 70 100 90" fill="#D4A853" />
                <ellipse cx="42" cy="55" rx="8" ry="9" fill="white" />
                <ellipse cx="78" cy="55" rx="8" ry="9" fill="white" />
                <ellipse cx="43" cy="57" rx="5" ry="6" fill="#1F2937" />
                <ellipse cx="79" cy="57" rx="5" ry="6" fill="#1F2937" />
                <circle cx="44" cy="55" r="2" fill="white" />
                <circle cx="80" cy="55" r="2" fill="white" />
                <path d="M32 42 Q42 36 52 42" stroke="#8B7355" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <path d="M68 42 Q78 36 88 42" stroke="#8B7355" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <path d="M45 82 Q60 74 75 82" stroke="#1F2937" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <ellipse cx="30" cy="70" rx="8" ry="5" fill="#FECACA" opacity="0.5" />
                <ellipse cx="90" cy="70" rx="8" ry="5" fill="#FECACA" opacity="0.5" />
                      </svg>
                </div>

            <h3 className="text-xl font-bold text-stone-800 text-center mb-2">Analysis Complete</h3>
            <p className="text-stone-500 text-center text-sm mb-6">Your essay has been scanned — here's a quick preview</p>
            
            {/* Results Summary */}
            <div className="space-y-3 mb-5">
              <div className="flex items-start p-3.5 bg-red-50 rounded-xl border border-red-100">
                <span className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                    </span>
                <div>
                  <p className="text-red-800 font-semibold text-sm">Critical issues detected</p>
                  <p className="text-red-600 text-xs mt-0.5">Structural weaknesses and argument gaps that could significantly affect your grade</p>
                      </div>
            </div>

              <div className="flex items-start p-3.5 bg-amber-50 rounded-xl border border-amber-100">
                <span className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                        </span>
                <div>
                  <p className="text-amber-800 font-semibold text-sm">Several areas need improvement</p>
                  <p className="text-amber-600 text-xs mt-0.5">Grammar, clarity, and tone issues that should be addressed before submission</p>
                      </div>
                  </div>
                </div>

            {/* Urgency text */}
            <div className="bg-stone-50 rounded-xl p-3.5 mb-6">
              <p className="text-stone-600 text-sm text-center leading-relaxed">
                <span className="font-semibold text-stone-800">Don't submit yet.</span> View the full breakdown with specific line-by-line feedback to fix these issues.
              </p>
                </div>

                {/* CTA Button */}
                <button
              onClick={handleContinueToSignup}
              className="w-full py-3.5 bg-lime-500 hover:bg-lime-600 text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-lg flex items-center justify-center"
                >
              View full analysis — it's free
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
                </button>
              </div>
            </div>
      )}

      {/* Fake Citation Results Modal */}
      {showFakeCitationResults && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="relative bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full mx-4 shadow-2xl animate-fade-in">
            <button type="button" onClick={() => setShowFakeCitationResults(false)} className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors" aria-label="Close">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            {/* Character - happy / excited with papers */}
            <div className="flex justify-center mb-4">
              <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-24 h-24">
                <ellipse cx="60" cy="60" rx="50" ry="52" fill="#FCD9B6" />
                <path d="M20 48 Q16 20 38 12 Q60 2 82 12 Q104 20 100 48 Q96 32 80 22 Q60 12 40 22 Q24 32 20 48" fill="#D4A853" />
                <path d="M20 48 Q12 70 20 90" fill="#D4A853" />
                <path d="M100 48 Q108 70 100 90" fill="#D4A853" />
                <ellipse cx="42" cy="55" rx="8" ry="9" fill="white" />
                <ellipse cx="78" cy="55" rx="8" ry="9" fill="white" />
                <ellipse cx="43" cy="56" rx="5" ry="5" fill="#1F2937" />
                <ellipse cx="79" cy="56" rx="5" ry="5" fill="#1F2937" />
                <circle cx="44" cy="54" r="2" fill="white" />
                <circle cx="80" cy="54" r="2" fill="white" />
                <path d="M32 42 Q42 36 52 42" stroke="#8B7355" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <path d="M68 42 Q78 36 88 42" stroke="#8B7355" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <path d="M38 78 Q60 88 82 78" stroke="#1F2937" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <ellipse cx="30" cy="70" rx="8" ry="5" fill="#FECACA" opacity="0.5" />
                <ellipse cx="90" cy="70" rx="8" ry="5" fill="#FECACA" opacity="0.5" />
              </svg>
          </div>

            <h3 className="text-xl font-bold text-stone-800 text-center mb-2">Citations Ready</h3>
            <p className="text-stone-500 text-center text-sm mb-5">We found high-quality sources that match your topic</p>
            
            <div className="bg-green-50 rounded-xl border border-green-100 p-4 mb-5">
              <p className="text-green-800 text-center text-sm leading-relaxed">
                <span className="font-semibold">We've pulled together strong, relevant citations</span> for your paper — from peer-reviewed journals and academic sources that will strengthen your argument and reference list.
              </p>
        </div>

            <p className="text-stone-500 text-sm text-center mb-6">
              Sign up free to view your full citation list, copy formatted references, and add them to your draft.
            </p>
            
            <button 
              onClick={handleContinueToSignupFromCitations}
              className="w-full py-3.5 bg-lime-500 hover:bg-lime-600 text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-lg flex items-center justify-center"
            >
              See my citations — it's free
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
          </div>
      )}

      {/* Fake Summary Results Modal */}
      {showFakeSummaryResults && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="relative bg-white rounded-2xl p-6 sm:p-8 max-w-4xl w-full mx-4 shadow-2xl animate-fade-in">
            <button type="button" onClick={() => setShowFakeSummaryResults(false)} className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors z-10" aria-label="Close">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-100 text-teal-700 rounded-full text-sm font-medium mb-3">
                <span>📝</span> Summary Generated Successfully
              </div>
              <h3 className="text-xl font-bold text-stone-800">Your document has been condensed</h3>
            </div>

            {/* Side by Side Panels */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {/* Original Panel */}
              <div className="bg-stone-50 rounded-xl border border-stone-200 overflow-hidden">
                <div className="px-4 py-2.5 bg-stone-100 border-b border-stone-200">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-stone-400"></div>
                    <span className="text-xs font-semibold text-stone-600 uppercase tracking-wider">Original</span>
                  </div>
                </div>
                <div className="p-4 max-h-48 overflow-y-auto">
                  <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-wrap">{inputText.slice(0, 500)}{inputText.length > 500 ? '...' : ''}</p>
                </div>
              </div>

              {/* Summary Panel */}
              <div className="bg-teal-50 rounded-xl border border-teal-200 overflow-hidden">
                <div className="px-4 py-2.5 bg-teal-100/50 border-b border-teal-200">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-teal-400"></div>
                    <span className="text-xs font-semibold text-teal-600 uppercase tracking-wider">Summary</span>
                    <span className="px-2 py-0.5 bg-teal-200 text-teal-700 text-[10px] font-bold rounded-full">~75% shorter</span>
                  </div>
                </div>
                <div className="p-4 max-h-48 overflow-y-auto relative">
                  <div className="absolute inset-0 bg-teal-50/90 pointer-events-none"></div>
                  <div className="text-sm text-teal-900 leading-relaxed blur-[2px]">
                    <p className="mb-2">• Key finding regarding the primary subject matter and its implications</p>
                    <p className="mb-2">• Important methodology considerations and framework details</p>
                    <p className="mb-2">• Critical analysis of results and supporting evidence</p>
                    <p>• Conclusions drawn from the comprehensive review...</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="flex flex-wrap gap-3 justify-center mb-6">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-teal-50 rounded-full border border-teal-200">
                <svg className="w-4 h-4 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-teal-700 text-sm font-medium">Bullet or paragraph format</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full border border-green-200">
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-green-700 text-sm font-medium">5,000 words free/month</span>
              </div>
            </div>

            <div className="bg-stone-50 rounded-xl p-3.5 mb-6">
              <p className="text-stone-600 text-sm text-center leading-relaxed">
                <span className="font-semibold text-stone-800">Sign up to reveal your full summary.</span> Copy it, share it, or use it in your notes.
              </p>
            </div>

            <button
              onClick={handleContinueToSignup}
              className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-lg flex items-center justify-center"
            >
              Get my summary — it&apos;s free
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Fake Study Tools Results Modal */}
      {showFakeQuizResults && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="relative bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full mx-4 shadow-2xl animate-fade-in">
            <button type="button" onClick={() => setShowFakeQuizResults(false)} className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors" aria-label="Close">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">{studyToolMode === 'flashcards' ? '🃏' : studyToolMode === 'crossword' ? '🧩' : '📝'}</span>
              </div>
            </div>
            <h3 className="text-xl font-bold text-stone-800 text-center mb-2">
              {studyToolMode === 'flashcards' ? 'Flashcards Generated' : studyToolMode === 'crossword' ? 'Crossword Generated' : 'Quiz Generated'}
            </h3>
            <p className="text-stone-500 text-center text-sm mb-5">
              {studyToolMode === 'flashcards' ? 'We\'ve created flip cards from your content' : studyToolMode === 'crossword' ? 'We\'ve created a puzzle from your content' : 'We\'ve created questions from your content'}
            </p>
            <div className="space-y-3 mb-5">
              <div className="flex items-start p-3.5 bg-amber-50 rounded-xl border border-amber-100">
                <span className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
                <div>
                  <p className="text-amber-800 font-semibold text-sm">
                    {studyToolMode === 'flashcards' ? 'Interactive flip cards' : studyToolMode === 'crossword' ? 'Interactive crossword puzzle' : 'Multiple choice & true/false'}
                  </p>
                  <p className="text-amber-600 text-xs mt-0.5">
                    {studyToolMode === 'flashcards' ? 'Perfect for memorization and quick review' : studyToolMode === 'crossword' ? 'Fun way to learn key vocabulary' : 'Mix question types for better retention'}
                  </p>
                </div>
              </div>
              <div className="flex items-start p-3.5 bg-amber-50 rounded-xl border border-amber-100">
                <span className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
                <div>
                  <p className="text-amber-800 font-semibold text-sm">2 free study packs per month (lesson & flashcards — quiz, crossword & Crater Blast with Pro)</p>
                  <p className="text-amber-600 text-xs mt-0.5">Sign up to unlock Study Tools — upgrade for unlimited</p>
                </div>
              </div>
            </div>
            <div className="bg-stone-50 rounded-xl p-3.5 mb-6">
              <p className="text-stone-600 text-sm text-center leading-relaxed">
                <span className="font-semibold text-stone-800">
                  {studyToolMode === 'flashcards' ? 'Turn any notes into flashcards.' : studyToolMode === 'crossword' ? 'Turn key terms into puzzles.' : 'Turn any notes into a quiz.'}
                </span> Great for exam prep and study sessions.
              </p>
            </div>
            <button
              onClick={handleContinueToSignup}
              className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-lg flex items-center justify-center"
            >
              Sign up to unlock Study Tools — it&apos;s free
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </main>
    </>
  );
};

export default LandingPage;
