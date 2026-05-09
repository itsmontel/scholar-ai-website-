import { useState, useEffect, useMemo, lazy, Suspense, type ReactNode } from 'react';
import Header from '../common/Header';
import Footer from '../common/Footer';
import { useTheme } from '../../contexts/ThemeContext';
import AnalysisAnimation from '../common/AnalysisAnimation';
import { FOCUS_MODE_CHROME_EXTENSION_URL } from '../../constants/focusMode';
import { HIDE_FRIENDS } from '../../config/featureFlags';
import ScholarMascot from '../common/ScholarMascot';
import DualMascot from '../common/DualMascot';
import InteractiveDocumentAnalysis, { LANDING_DEMO_FOCUS_FEEDBACK_EVENT } from '../landing/InteractiveDocumentAnalysis';
import LandingCitationsShowcase from '../landing/LandingCitationsShowcase';
import LandingStudyToolsHero from '../landing/LandingStudyToolsHero';
import LandingTestimonialsSection from '../landing/LandingTestimonialsSection';
import HeroEssayPreviewCard from '../landing/HeroEssayPreviewCard';
import LandingBeforeAfterSection from '../landing/LandingBeforeAfterSection';
import LandingScrollReveal from '../landing/LandingScrollReveal';
import { DEMO_HERO_AFTER_PAPER, DEMO_PAPERS } from '../../data/landingPageDemoAnalysis';

const BadgeCreature = lazy(() => import('../common/BadgeCreature'));

/** Hide study packs, Focus Mode, and friends blocks on landing (papers + citations first). */
const LANDING_HIDE_SECONDARY_SECTIONS = true;
import ViewportAutoplayVideo from '../common/ViewportAutoplayVideo';
interface LandingPageProps {
  onNavigate: (page: string, slug?: string) => void;
  user?: { plan?: string; subscription_plan?: string } | null;
}

/** Source list for landing FAQ UI + FAQPage JSON-LD (order must match). */
const LANDING_FAQ_ITEMS: { question: string; answer: string }[] = [
  {
    question: "What kind of feedback will I get on my essay?",
    answer: "You get section-by-section annotations (green for strong, yellow for improve, red for concerns), an overall grade-level rubric, and actionable improvement suggestions. It covers structure, argument quality, clarity, citations, and academic style."
  },
  {
    question: "How does the essay analyzer work?",
    answer: "Paste your essay (200+ words) or upload a PDF/DOCX/TXT file. Our AI analyzes structure, clarity, argument, citations, and academic tone the way a professor would. You get detailed feedback with specific suggestions in under 60 seconds."
  },
  {
    question: "Is WriteScholar for college and university students?",
    answer: "Yes. WriteScholar is for undergrads and postgrads worldwide, whether you're writing essays in the UK, the US, or elsewhere. Set your education level in the analyzer for feedback that fits your course. We support major citation styles (APA, MLA, Chicago, Harvard, and more). High school options are available too."
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
    answer: "Yes! The Study Pack turns any text into lessons, flashcards, quizzes, crosswords, Crater Blast & Word Tower. Paste your notes or upload a document. Free users get lesson and flashcards; quiz, crossword, Crater Blast & Word Tower unlock with Pro."
  },
  {
    question: "What is Daily Review?",
    answer: "Daily Review is your personalised daily practice session, like Duolingo but for your coursework. Each day you get a short session based on your saved study materials — flashcard drills, quiz questions, and vocabulary checks. Complete it to earn XP and keep your streak alive. It's the default tab when you open your dashboard."
  },
  {
    question: "What are XP, levels, streaks, and badges?",
    answer: "WriteScholar has a full progression system to keep you motivated. Earn XP for completing daily reviews, analysing essays, creating study packs, and more. XP fills your level bar — there are 100 levels to climb, from Scholar Seedling to Supreme Grandmaster. Streaks track how many days in a row you've studied. And there are 80+ badges to unlock across categories like writing, studying, and consistency. It's designed to make studying feel rewarding."
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
    question: "What's the difference between Free and Pro?",
    answer: "Free: 3 documents, 2 analyses, 2 study packs, 5k words, 2 citations per month, 2MB library storage, Focus Mode (3 sites). Pro: 99 combined analyses, study packs and citations per month, 999,999 words for the Paper Summarizer, Apply WriteScholar revisions into your draft, all citation styles, PDF/Word export, Focus Mode with unlimited blocked sites, uploads up to 100MB per file, and full quiz & study tools. Premium: 5× usage versus Pro—499 combined actions per month, unlimited research-paper summarisation, and 1GB library storage."
  },
  {
    question: "How do I add friends and share my study materials?",
    answer: "Every account gets a unique friend code. Share your code with friends so they can add you. Once connected, you can share flashcards, quizzes, crosswords, or notes with one tap. They tap Accept and it's in their library. Core sharing is free."
  }
];

const LandingPage = ({ onNavigate, user }: LandingPageProps) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { theme: _theme, toggleTheme: _toggleTheme } = useTheme();
  // ─── Floating PiP demo video state ──────────────────────────────────────
  // Mirrors a "video stays with you while you scroll" experience similar to
  // YouTube's Miniplayer or how product demo overlays float on SaaS landings.
  // Visibility logic:
  //   - Starts HIDDEN. Becomes visible after user scrolls past the hero (so
  //     it doesn't compete with the hero's main content on first impression).
  //   - User can dismiss with the X. Dismissal is in-memory only — a page
  //     refresh brings the player back so returning visitors get another
  //     chance to engage with the demo.
  const [pipVisible, setPipVisible] = useState(false);
  const [pipDismissed, setPipDismissed] = useState(false);
  const [pipMuted, setPipMuted] = useState(true);
  const [pipExpanded, setPipExpanded] = useState(false);
  useEffect(() => {
    if (pipDismissed) return;
    const onScroll = () => {
      // Show the floating video once the user has scrolled at least 600px —
      // typically just past the hero on most viewports.
      if (window.scrollY > 600 && !pipVisible) setPipVisible(true);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [pipVisible, pipDismissed]);
  const handleDismissPip = () => {
    setPipVisible(false);
    setPipDismissed(true);
  };
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

  const faqs = useMemo(
    () => LANDING_FAQ_ITEMS.filter(faq => !HIDE_FRIENDS || !faq.question.toLowerCase().includes('friends')),
    [HIDE_FRIENDS]
  );

  /* FAQPage JSON-LD — matches visible FAQ list for rich results */
  useEffect(() => {
    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer }
      }))
    };
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(faqSchema);
    script.id = 'faq-schema-landing-writescholar';
    document.head.appendChild(script);
    return () => {
      const el = document.getElementById('faq-schema-landing-writescholar');
      if (el) el.remove();
    };
  }, [faqs]);

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
    accentClasses,
    icon,
    innerContent,
    gradient: _gradient,
    borderColor: _borderColor,
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
      className="group relative rounded-2xl p-5 text-left bg-white dark:bg-stone-900 border-2 border-b-4 border-[#E5E5E5] dark:border-stone-700 hover:-translate-y-1 hover:border-[#1CB0F6] dark:hover:border-stone-600 transition-all duration-300 ease-out h-[300px] flex flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1CB0F6]/40 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-950"
    >
      <div className="flex items-start gap-3 mb-3">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center text-base shrink-0 border border-stone-200/80 dark:border-stone-600 ${accentClasses.iconBg}`}
          aria-hidden
        >
          {icon}
        </div>
        <h3 className="text-base font-extrabold text-stone-900 dark:text-stone-100 leading-snug pt-1 text-left">{title}</h3>
      </div>
      <div className="relative z-10 bg-slate-50/90 dark:bg-stone-800/70 rounded-xl p-4 border border-stone-100 dark:border-stone-700/80 mb-3 flex-1 min-h-0 flex flex-col justify-center overflow-hidden">
        {innerContent}
      </div>
      <p className="text-stone-600 dark:text-stone-400 text-sm leading-snug text-left">{desc}</p>
    </button>
  );

  const MobileStudyCard = ({
    title,
    desc,
    onClick,
    accentClasses,
    icon,
    children,
    gradient: _gradient,
    borderColor: _borderColor,
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
      className="block w-full text-left bg-white dark:bg-stone-900 rounded-2xl p-4 border-2 border-b-4 border-[#E5E5E5] dark:border-stone-700 hover:-translate-y-0.5 active:border-b-2 active:translate-y-0.5 transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1CB0F6]/40"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0 border border-stone-200/80 dark:border-stone-600 ${accentClasses.iconBg}`}>
          {icon}
        </div>
        <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100">{title}</h3>
      </div>
      <div className="relative z-10 bg-slate-50/90 dark:bg-stone-800/70 rounded-xl p-3 border border-stone-100 dark:border-stone-700/80 mb-3 h-[100px] flex items-center justify-center overflow-hidden w-full">
        {children}
      </div>
      <p className="text-stone-600 dark:text-stone-400 text-xs leading-snug text-left">{desc}</p>
    </button>
  );

  const scrollToLandingTools = () => {
    document.getElementById('landing-tools')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToBeforeAfter = () => {
    document.getElementById('before-after')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  /** Hero preview cards: land on the embedded demo with Feedback open (annotations list). */
  const scrollToInteractiveDemoFeedback = () => {
    document.getElementById('landing-tools')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent(LANDING_DEMO_FOCUS_FEEDBACK_EVENT));
    }, 420);
  };

  const heroFeatureCards = [
    {
      title: 'Essay feedback',
      desc: 'Paste or upload a draft—line-level notes on thesis, evidence, and citations',
      onClick: () => {
        setMode('analyze');
        scrollToLandingTools();
      },
      gradient: 'from-lime-200 to-emerald-200 dark:from-lime-950/60 dark:to-emerald-950/55',
      accentClasses: { title: 'text-lime-950 dark:text-lime-200', orb: 'bg-lime-600/40', iconBg: 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/45 dark:text-emerald-100' },
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
      title: 'Aligned citations',
      desc: 'Find sources that match your paper and format them',
      onClick: () => {
        setMode('citations');
        scrollToLandingTools();
      },
      gradient: 'from-cyan-200 to-teal-200 dark:from-cyan-950/55 dark:to-teal-950/55',
      accentClasses: { title: 'text-teal-950 dark:text-teal-200', orb: 'bg-teal-600/40', iconBg: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100' },
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
      title: 'Professor-style feedback',
      desc: 'Green, amber & red annotations with concrete revise-to lines',
      onClick: () => {
        setMode('analyze');
        scrollToLandingTools();
      },
      gradient: 'from-[#F3EAFF] to-[#F3EAFF] dark:from-[#A560E8]/15 dark:to-[#A560E8]/10',
      accentClasses: { title: 'text-[#A560E8] dark:text-[#A560E8]', orb: 'bg-[#A560E8]/40', iconBg: 'bg-[#F3EAFF] text-[#A560E8] dark:bg-[#A560E8]/20 dark:text-[#A560E8]' },
      borderColor: 'border-[#A560E8]/60 dark:border-[#8A48C7]/50',
      icon: '🎓',
      inner: (
        <div className="flex flex-wrap gap-1 justify-center items-center">
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#E5F8D0] dark:bg-emerald-900/60 text-[#58CC02] dark:text-emerald-100">Strong</span>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#FFF4E0] dark:bg-amber-900/60 text-[#FF9600] dark:text-amber-100">Revise</span>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#FFE8E8] dark:bg-rose-900/60 text-[#FF4B4B] dark:text-rose-100">Concern</span>
        </div>
      ),
      mobileContent: (
        <div className="flex flex-wrap gap-1.5 justify-center w-full">
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#E5F8D0] dark:bg-emerald-900/50 text-[#58CC02] dark:text-emerald-100">Strong</span>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FFF4E0] dark:bg-amber-900/50 text-[#FF9600] dark:text-amber-100">Revise</span>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FFE8E8] dark:bg-rose-900/50 text-[#FF4B4B] dark:text-rose-100">Concern</span>
        </div>
      ),
    },
    {
      title: 'Rubric & grade',
      desc: 'Thesis, evidence, clarity & citations scored like a real course',
      onClick: scrollToBeforeAfter,
      gradient: 'from-orange-200 to-amber-200 dark:from-orange-950/50 dark:to-amber-950/50',
      accentClasses: { title: 'text-orange-950 dark:text-orange-200', orb: 'bg-orange-600/40', iconBg: 'bg-amber-50 text-amber-900 dark:bg-amber-950/45 dark:text-amber-100' },
      borderColor: 'border-orange-400/90 dark:border-orange-600/70',
      icon: '📊',
      inner: (
        <div className="space-y-1.5 w-full">
          <div className="flex justify-between text-[9px] font-mono text-orange-950 dark:text-orange-200">
            <span>Thesis</span>
            <span className="tabular-nums">15/20</span>
            </div>
          <div className="h-1.5 rounded-full bg-stone-200 dark:bg-stone-600 overflow-hidden">
            <div className="h-full w-[75%] rounded-full bg-gradient-to-r from-orange-500 to-amber-500" />
          </div>
          <p className="text-[9px] text-center text-stone-600 dark:text-stone-400 font-medium">B → A with revision</p>
        </div>
      ),
      mobileContent: (
        <div className="space-y-2 w-full">
          <div className="flex justify-between text-[10px] font-mono text-orange-900 dark:text-orange-200">
            <span>Thesis</span>
            <span>15/20</span>
            </div>
          <div className="h-2 rounded-full bg-stone-200 dark:bg-stone-600 overflow-hidden">
            <div className="h-full w-[75%] rounded-full bg-gradient-to-r from-orange-500 to-amber-500" />
          </div>
        </div>
      ),
    },
    {
      title: 'Structure & clarity',
      desc: 'Topic sentences, flow, and where the argument needs tightening',
      onClick: () => {
        setMode('analyze');
        scrollToLandingTools();
      },
      gradient: 'from-[#DDF4FF] to-[#DDF4FF] dark:from-stone-950/50 dark:to-stone-950/50',
      accentClasses: { title: 'text-[#1CB0F6] dark:text-[#1CB0F6]', orb: 'bg-[#1CB0F6]/40', iconBg: 'bg-[#DDF4FF] text-[#1CB0F6] dark:bg-[#1CB0F6]/20 dark:text-[#1CB0F6]' },
      borderColor: 'border-[#1CB0F6]/60 dark:border-[#1899D6]/50',
      icon: '🧭',
      inner: (
        <div className="space-y-1 w-full text-left">
          <div className="h-1.5 bg-stone-300/80 dark:bg-stone-600 rounded w-full" />
          <div className="h-1.5 bg-[#1CB0F6]/70 rounded w-[92%]" />
          <div className="h-1.5 bg-stone-300/80 dark:bg-stone-600 rounded w-full" />
          <div className="h-1.5 bg-[#1CB0F6]/60 rounded w-[88%]" />
        </div>
      ),
      mobileContent: (
        <div className="space-y-2 w-full">
          <div className="h-2 bg-stone-300/80 dark:bg-stone-600 rounded w-full" />
          <div className="h-2 bg-[#1CB0F6]/70 rounded w-[92%]" />
          <div className="h-2 bg-stone-300/80 dark:bg-stone-600 rounded w-full" />
        </div>
      ),
    },
  ];

  return (
    <>
      <Header onNavigate={onNavigate} user={user} sticky={true} currentPage="landing" opaqueHeader />
      <main className="min-h-screen relative transition-colors font-sans overflow-x-hidden xl:overflow-x-visible" role="main">
      {/* Promo Banner — TEMPORARILY HIDDEN via the leading `hidden` class.
          Markup preserved for easy re-enable: just remove `hidden` from the
          className (and `aria-hidden`) when the promo is live again. */}
      <div
        role="region"
        aria-label="Limited time promotion"
        className="relative overflow-hidden border-b-2 border-[#FF9600]/30 dark:border-[#D97F00]/40 bg-[#FFF4E0] dark:bg-stone-950"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_120%_at_50%_50%,rgba(255,150,0,0.08),transparent_70%)] dark:bg-[radial-gradient(ellipse_60%_120%_at_50%_50%,rgba(255,150,0,0.12),transparent_70%)]" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-1.5 sm:py-2">
          <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FF9600] px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-white">
              <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Limited Time
            </span>
            <p className="text-xs sm:text-[13px] font-medium text-stone-800 dark:text-stone-100">
              <span className="font-bold text-[#FF9600] dark:text-[#FF9600]">50% off</span> your first month on monthly plans · use code{' '}
              <span className="inline-flex items-center rounded-md border border-[#FF9600]/40 dark:border-[#D97F00]/50 bg-white dark:bg-stone-900 px-1.5 py-0.5 font-mono font-bold text-[#FF9600] dark:text-[#FF9600] tracking-wide text-[11px]">
                MAY2026
              </span>
            </p>
          </div>
        </div>
      </div>
      {/* HERO: formal, conversion-focused */}
      <section className="relative flex flex-col overflow-x-clip overflow-hidden border-b border-stone-200/90 dark:border-stone-800 xl:overflow-visible">
        <div className="absolute inset-0 bg-[#f9f9fb] dark:bg-[#0c0a09]" />
        <div className="absolute inset-0 bg-gradient-to-b from-white via-[#f7f7fa] to-[#f3f4f8] dark:from-stone-950 dark:via-stone-950 dark:to-stone-950 pointer-events-none" />
        {/* Ambient depth — single brand wash + soft lift (no competing emerald/amber) */}
        <div
          className="pointer-events-none absolute -top-32 -left-[15%] h-[min(95vw,34rem)] w-[min(95vw,34rem)] rounded-full bg-[#1CB0F6]/[0.11] blur-[110px] dark:bg-[#1CB0F6]/[0.14] animate-landing-hero-blob"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute top-[20%] -right-[20%] h-[min(85vw,24rem)] w-[min(85vw,24rem)] rounded-full bg-slate-400/[0.07] blur-[100px] dark:bg-stone-600/[0.12] animate-landing-hero-blob-delayed"
          aria-hidden
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_60%_at_50%_-25%,rgba(28,176,246,0.055),transparent_58%)] dark:bg-[radial-gradient(ellipse_95%_55%_at_50%_-15%,rgba(28,176,246,0.09),transparent_58%)] pointer-events-none" />
        <div
          className="absolute inset-0 landing-hero-grid-animate pointer-events-none bg-[length:32px_32px] bg-[linear-gradient(to_right,rgba(148,163,184,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.05)_1px,transparent_1px)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#1CB0F6]/30 to-transparent dark:via-[#1CB0F6]/25 animate-hero-top-shimmer"
          aria-hidden
        />

        {/* MOBILE-ONLY ambient flourishes — extra animated orbs + breathing
            gradient sheen so the phone hero feels lively without the desktop
            side cards. Hidden at md+ where the desktop layout takes over. */}
        <div
          className="md:hidden pointer-events-none absolute top-[18%] left-[8%] h-24 w-24 rounded-full bg-[#1CB0F6]/30 dark:bg-[#1CB0F6]/25 blur-2xl motion-safe:animate-mobile-orb-drift"
          aria-hidden
        />
        <div
          className="md:hidden pointer-events-none absolute top-[42%] right-[10%] h-28 w-28 rounded-full bg-[#58CC02]/30 dark:bg-[#58CC02]/25 blur-3xl motion-safe:animate-mobile-orb-drift"
          style={{ animationDelay: '1.6s' }}
          aria-hidden
        />
        <div
          className="md:hidden pointer-events-none absolute top-[68%] left-[18%] h-20 w-20 rounded-full bg-[#FF9600]/25 dark:bg-[#FF9600]/22 blur-2xl motion-safe:animate-mobile-orb-drift"
          style={{ animationDelay: '3.2s' }}
          aria-hidden
        />
        <div
          className="md:hidden pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_45%_at_50%_5%,rgba(28,176,246,0.10),transparent_55%)] dark:bg-[radial-gradient(ellipse_80%_45%_at_50%_5%,rgba(28,176,246,0.16),transparent_55%)] motion-safe:animate-mobile-gradient-breathe"
          aria-hidden
        />

        <div className="relative z-10 flex flex-col items-center justify-start px-4 sm:px-6 lg:px-8 pt-4 sm:pt-12 lg:pt-8 pb-0 min-w-0">
          <div className="w-full min-w-0 max-w-[1240px] xl:mx-auto">
            {/* 3-column hero on lg+: BEFORE essay (left) + center content
                + AFTER essay (right). Mobile stacks center content only —
                BEFORE/AFTER asides are hidden on small screens to keep the
                phone hero compact. */}
            <div className="flex flex-col items-stretch w-full">
              <div className="lg:grid lg:grid-cols-[1fr_minmax(0,1.7fr)_1fr] lg:gap-6 xl:gap-8 lg:items-center">
                {/* LEFT COLUMN — BEFORE essay preview card. Shows a rough
                    draft with red improvement highlights, scoring B (82/100).
                    Pairs with the AFTER card on the right to visually answer
                    "what does the analyzer actually do?" before the visitor
                    reads any copy. */}
                <aside
                  className="hidden lg:flex justify-center"
                  aria-label="Before essay preview"
                >
                  <div className="w-full max-w-[260px] rounded-2xl border-2 border-b-4 border-[#E5E5E5] dark:border-stone-700 bg-white dark:bg-stone-900/50 p-1 transition-all duration-300 hover:border-[#FF4B4B]/60 dark:hover:border-[#FF4B4B]/40">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#FF4B4B] dark:text-[#FF4B4B] text-center mb-1.5">Before</p>
                    <HeroEssayPreviewCard
                      paper={DEMO_PAPERS[1]}
                      rotate="none"
                      variant="before"
                      maxExcerptChars={560}
                      onOpenDemo={scrollToInteractiveDemoFeedback}
                    />
                  </div>
                </aside>

              <div className="min-w-0 flex flex-col items-center w-full max-w-2xl mx-auto">
              <div className="relative w-full max-w-3xl mx-auto px-1 sm:px-2 text-center pt-2 sm:pt-4 opacity-0 animate-hero-card-enter">
                {/* Hero mascots — pinned to the bottom corners of the hero
                    card, sitting below the trial/login buttons so they flank
                    the trust badge. The walking mascot occupies the bottom-left
                    slot (its in-frame walking animation keeps the corner alive
                    without translating across the card). */}
                <div className="relative flex flex-col items-center text-center">
                {/* MOBILE-ONLY: floating dancing mascot in the top-right of
                    the hero — replaces the dense pill row and adds movement. */}
                <img
                  src="/mascot-dance.webp"
                  alt=""
                  aria-hidden
                  loading="lazy"
                  decoding="async"
                  className="md:hidden pointer-events-none absolute -top-2 right-1 w-20 sm:w-24 h-auto z-20 drop-shadow-[0_14px_28px_rgba(124,58,237,0.35)] motion-safe:animate-mobile-mascot-bob"
                />
                {/* MOBILE-ONLY: smaller paper mascot peeking on the left so the
                    top of the hero feels alive on phones. */}
                <img
                  src="/mascot-paper.webp"
                  alt=""
                  aria-hidden
                  loading="lazy"
                  decoding="async"
                  className="md:hidden pointer-events-none absolute top-2 left-0 w-12 h-auto z-20 opacity-90 drop-shadow-[0_10px_20px_rgba(124,58,237,0.30)] motion-safe:animate-mobile-mascot-peek"
                />


                {/* HEADLINE — outcome + transformation, locked to 3 lines.
                    Line 1: "Turn your grades" (broad outcome — covers all products)
                    Line 2: "from [B → A]" (the transformation as a pill chip)
                    Line 3: "With WriteScholar." (the brand)
                    The B → A chip is the visual centerpiece — bordered box
                    with orange B, gray arrow, green A in our Duolingo style. */}
                {/* HEADLINE — staged typewriter animation. The H1 is split
                    into three "typewriter" segments that wipe in left-to-right
                    via a CSS mask. Sequence (timed via inline animationDelay):
                      0.15s  Phase 1 typewriter starts ("Turn your grades")
                      0.55s  Phase 2 typewriter starts ("from [B → A]")
                      1.30s  Phase 3 typewriter starts ("With WriteScholar.")
                      1.70s  WriteScholar's purple squiggle draws on
                    Reduced-motion users see the final state immediately
                    (overrides in src/index.css). */}
                <h1
                  className="text-[1.65rem] sm:text-[2.55rem] lg:text-[3.15rem] xl:text-[3.5rem] font-extrabold tracking-[-0.02em] leading-[1.06] mb-4 sm:mb-9 max-w-[min(22rem,calc(100vw-2rem))] sm:max-w-3xl mx-auto text-balance"
                  style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
                >
                  {/* Phase 1: "Turn your grades" — broad outcome (covers
                      essays, study tools, citations — all paths to grades). */}
                  <span className="inline-block animate-hero-typewriter" style={{ animationDelay: '0.15s' }}>
                    <span className="text-stone-900 dark:text-stone-50">Turn your grades</span>
                  </span>
                  <br />
                  {/* Phase 2: "from [B → A]" — bordered Duolingo-style pill chip
                      with orange B, gray arrow, green A. The chip is inline-flex
                      so B/arrow/A stay perfectly aligned regardless of font size. */}
                  <span className="inline-block animate-hero-typewriter" style={{ animationDelay: '0.55s' }}>
                    <span className="text-stone-900 dark:text-stone-50">from</span>{' '}
                    <span
                      className="inline-flex items-center align-middle gap-1.5 sm:gap-2 rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-2.5 py-0.5 sm:px-3 sm:py-1 shadow-md mx-1"
                      aria-label="Grade improvement from B to A"
                    >
                      <span className="text-[1.55rem] sm:text-[2rem] lg:text-[2.45rem] xl:text-[2.7rem] font-extrabold tabular-nums leading-none text-[#FF9600] dark:text-[#FFB347]">
                        B
                      </span>
                      <span className="text-[1.4rem] sm:text-[1.85rem] lg:text-[2.25rem] xl:text-[2.5rem] font-light leading-none select-none text-stone-400 dark:text-stone-500" aria-hidden>
                        →
                      </span>
                      <span className="text-[1.55rem] sm:text-[2rem] lg:text-[2.45rem] xl:text-[2.7rem] font-extrabold tabular-nums leading-none text-[#58CC02] dark:text-[#9BE85C]">
                        A
                      </span>
                    </span>
                  </span>
                  <br />
                  {/* Phase 3: "With WriteScholar." with its purple squiggle.
                      pathLength="100" normalizes the path length so the
                      stroke-dasharray draw animation works reliably even with
                      preserveAspectRatio="none" stretching the path. Inline
                      strokeDasharray/Offset override the class's defaults so
                      the full squiggle is drawn (not just the first 240 user
                      units of an unpredictably-stretched path). */}
                  <span className="inline-block animate-hero-typewriter" style={{ animationDelay: '1.30s' }}>
                    <span className="text-stone-900 dark:text-stone-50">With</span>{' '}
                    <span className="relative inline-block overflow-visible text-[#A560E8] dark:text-[#A560E8]">
                      WriteScholar
                      {/* Squiggle SVG: bigger viewBox + taller container so
                          the wave actually has vertical room to be visible.
                          pathLength=100 + matching dasharray/offset normalize
                          the draw-on animation regardless of horizontal stretch. */}
                      <svg
                        className="absolute -bottom-3 sm:-bottom-3.5 left-0 w-full h-5 sm:h-6 text-[#A560E8] dark:text-[#A560E8] overflow-visible"
                        viewBox="0 0 300 24"
                        preserveAspectRatio="none"
                        aria-hidden
                        style={{ overflow: 'visible' }}
                      >
                        <path
                          className="animate-hero-squiggle-draw"
                          pathLength={100}
                          style={{
                            animationDelay: '1.70s',
                            strokeDasharray: 100,
                            strokeDashoffset: 100,
                          }}
                          d="M4 14 Q40 4 80 14 T156 14 T232 14 T296 14"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <span className="text-[#A560E8] dark:text-[#A560E8]">.</span>
                  </span>
                </h1>

                {/* SUBHEADLINE — covers BOTH products in parallel:
                    1) the essay analyzer ("professor-style feedback")
                    2) the study tools ("7 study tools built from your notes").
                    Bolded nouns let it scan in under a second. */}
                <p className="mb-4 sm:mb-9 max-w-[min(22rem,calc(100vw-2rem))] sm:max-w-lg mx-auto text-[0.85rem] sm:text-[1rem] text-stone-700 dark:text-stone-300 leading-relaxed opacity-0 animate-hero-stagger-2">
                  <span className="font-bold text-stone-900 dark:text-stone-50">Professor-style essay feedback</span> + <span className="font-bold text-stone-900 dark:text-stone-50">7 AI study tools</span> built from your notes. Designed to get you A's on essays AND exams.
                </p>

                {/* PRIMARY + LOGIN CTAs — purple "Start free" is the dominant
                    button, with a lower-weight "Log in" beside it for returning
                    users. Stacked on mobile, side-by-side on sm+. */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 w-full max-w-md sm:max-w-lg mx-auto mb-3 sm:mb-4 opacity-0 animate-hero-stagger-4">
                  <button
                    type="button"
                    onClick={() => onNavigate('signup')}
                    className="group/btn relative inline-flex flex-1 items-center justify-center gap-2 overflow-hidden px-8 py-4 sm:px-8 sm:py-4 bg-[#A560E8] hover:bg-[#B274EC] dark:bg-[#A560E8] dark:hover:bg-[#B274EC] text-white font-extrabold rounded-2xl border-2 border-b-4 border-[#8A48C7] dark:border-[#8A48C7] transition-all duration-200 hover:-translate-y-0.5 active:border-b-2 active:translate-y-0.5 text-[1rem] sm:text-[1.05rem] tracking-wide shadow-lg shadow-[#A560E8]/25"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0 opacity-0 transition-opacity duration-300 group-hover/btn:opacity-100 pointer-events-none" aria-hidden />
                    <span className="relative">Start free — get the A</span>
                    <svg className="relative w-5 h-5 group-hover/btn:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('login')}
                    className="inline-flex items-center justify-center px-6 py-3.5 sm:px-7 sm:py-4 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-200 font-extrabold rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 hover:-translate-y-0.5 active:border-b-2 active:translate-y-0.5 transition-all text-[1rem] sm:text-[1.05rem] tracking-wide"
                  >
                    Log in
                  </button>
                </div>

                {/* RISK REVERSAL — single one-liner that captures the time
                    cost ("30 seconds") + the price barrier ("no payment").
                    Replaces the longer 3-pill row to reduce visual noise
                    without losing the trust signal. */}
                <p className="mb-5 sm:mb-6 text-center text-[13px] sm:text-sm text-stone-500 dark:text-stone-400 opacity-0 animate-hero-stagger-5">
                  About 30 seconds to get started. No payment today.
                </p>

                {/* TRUST PILL — circular user-icon avatar + "Trusted by
                    50,000+ students worldwide". Sits below the risk reversal
                    line so the conversion-critical CTA + risk signal come
                    first, then social proof reinforces. */}
                <div className="inline-flex items-center gap-2.5 rounded-full border border-stone-200/80 dark:border-stone-700/60 bg-white dark:bg-stone-800/80 pl-1.5 pr-4 py-1 shadow-sm opacity-0 animate-hero-trust-pop">
                  <span
                    className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-[#DDF4FF] dark:bg-[#1CB0F6]/20"
                    aria-hidden
                  >
                    <svg className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-[#1CB0F6]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                    </svg>
                  </span>
                  <span className="text-[12px] sm:text-[14px] font-bold text-stone-800 dark:text-stone-100">
                    Trusted by <span className="font-extrabold text-[#1CB0F6] dark:text-[#1CB0F6] tabular-nums">50,000+</span> students worldwide
                  </span>
                </div>
                </div>
              </div>
              </div>
                {/* RIGHT COLUMN — AFTER essay preview card. Shows the
                    polished revision with green strengths-highlighted, scoring
                    A (90/100). Visually completes the BEFORE → AFTER story
                    that flanks the center hero content. */}
                <aside
                  className="hidden lg:flex justify-center"
                  aria-label="After essay preview"
                >
                  <div className="w-full max-w-[260px] rounded-2xl border-2 border-b-4 border-[#58CC02]/60 dark:border-[#58CC02]/40 bg-white dark:bg-stone-900/50 p-1 transition-all duration-300 hover:border-[#58CC02] dark:hover:border-[#58CC02]/60">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#58CC02] dark:text-[#58CC02] text-center mb-1.5">After</p>
                    <HeroEssayPreviewCard
                      paper={DEMO_HERO_AFTER_PAPER}
                      rotate="none"
                      variant="after"
                      maxExcerptChars={720}
                      onOpenDemo={scrollToInteractiveDemoFeedback}
                    />
                  </div>
                </aside>
              </div>

              {/* Analysis preview — pushed higher up since the intro
                  header (eyebrow + h2 + subhead) was removed. The analyzer
                  demo now sits directly under the hero. */}
              <div
                id="landing-tools"
                className="w-full max-w-6xl mx-auto mt-6 sm:mt-8 lg:mt-10 scroll-mt-24 px-3 sm:px-2 lg:px-1"
              >
                <div className="relative rounded-2xl sm:rounded-3xl border border-stone-200/70 dark:border-stone-700/60 bg-white/95 dark:bg-stone-900/80 shadow-[0_28px_72px_-28px_rgba(15,23,42,0.16)] dark:shadow-[0_36px_90px_-32px_rgba(0,0,0,0.55)]">
                  <InteractiveDocumentAnalysis onNavigate={onNavigate} landingHeroEmbed />
                </div>
                <div className="text-center mt-8 sm:mt-10">
                  <button
                    type="button"
                    onClick={() => onNavigate('signup')}
                    className="inline-flex items-center px-8 py-3.5 bg-[#58CC02] hover:bg-[#61E002] dark:bg-[#58CC02] dark:hover:bg-[#61E002] text-white font-extrabold rounded-2xl border-2 border-b-4 border-[#46A302] hover:-translate-y-0.5 active:border-b-2 active:translate-y-0.5 transition-all duration-200 text-base"
                  >
                    Try your first analysis
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                  <p className="mt-4 text-sm text-stone-500 dark:text-stone-400">
                    Free plan includes 2 analyses per month
                  </p>
                </div>

                {/* ─── "And it doesn't stop at essays" bridge — directs the
                    visitor's eye to the second big product (study tools) so it
                    isn't buried below the fold. ─── */}
                <div className="hidden sm:block mt-12 sm:mt-16 mb-2 max-w-5xl mx-auto px-1">
                  <a
                    href="#study-tools"
                    className="group relative block rounded-3xl border-2 border-b-4 border-[#A560E8]/40 dark:border-[#8A48C7]/40 bg-[#F3EAFF] dark:bg-stone-900/60 p-6 sm:p-8 hover:-translate-y-0.5 transition-all overflow-hidden"
                  >
                    <div className="pointer-events-none absolute -top-12 -right-12 w-48 h-48 rounded-full bg-[#58CC02]/15 dark:bg-[#58CC02]/12 blur-3xl" aria-hidden />
                    <div className="pointer-events-none absolute -bottom-16 -left-12 w-44 h-44 rounded-full bg-[#1CB0F6]/15 dark:bg-[#1CB0F6]/12 blur-3xl" aria-hidden />

                    <div className="relative grid grid-cols-1 sm:grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-5 sm:gap-6">
                      {/* Juggling mascot — "Scholar juggles 7 study tools so you don't have to" */}
                      <img
                        src="/mascot-juggling.webp"
                        alt=""
                        aria-hidden
                        loading="lazy"
                        decoding="async"
                        className="hidden sm:block w-28 lg:w-36 h-auto justify-self-center drop-shadow-[0_14px_24px_rgba(217,70,239,0.35)]"
                      />

                      <div className="text-center sm:text-left">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F3EAFF] dark:bg-[#A560E8]/20 text-[#A560E8] dark:text-[#A560E8] text-[10px] font-bold uppercase tracking-wider mb-2">
                          <span aria-hidden>▸</span>
                          And it doesn&apos;t stop at essays
                        </span>
                        <h3
                          className="text-xl sm:text-2xl lg:text-[1.65rem] font-extrabold text-stone-900 dark:text-stone-50 tracking-tight leading-tight"
                          style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
                        >
                          Paste any notes,{' '}
                          <span className="text-[#A560E8] dark:text-[#A560E8]">
                            get 7 study tools
                          </span>{' '}
                          in 60 seconds
                        </h3>
                        <p className="mt-2 text-sm sm:text-[15px] text-stone-600 dark:text-stone-400 leading-relaxed">
                          Lessons, flashcards, quizzes, crosswords, plus arcade games like{' '}
                          <span className="font-semibold text-stone-800 dark:text-stone-200">Crater Blast</span> and{' '}
                          <span className="font-semibold text-stone-800 dark:text-stone-200">Word Tower</span>.
                        </p>
                      </div>

                      <span className="hidden sm:inline-flex items-center gap-1.5 self-center justify-self-end rounded-full bg-[#A560E8] px-4 py-2.5 text-sm font-extrabold text-white border-2 border-b-4 border-[#8A48C7] active:border-b-2 active:translate-y-0.5 transition-colors">
                        See study tools
                        <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </span>

                      {/* Mobile-only chevron under the text */}
                      <span className="sm:hidden inline-flex items-center justify-center gap-1.5 mt-2 rounded-full bg-[#A560E8] px-4 py-2.5 text-sm font-extrabold text-white border-2 border-b-4 border-[#8A48C7] active:border-b-2 active:translate-y-0.5">
                        See study tools
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </span>
                    </div>
                  </a>
                </div>

              </div>

              {/* ─── Before/After essay transformation — concrete visual
                  proof right after the live demo. Visitors who just watched
                  the analyzer grade an essay now see the actual transformation
                  (rough draft → polished A-grade essay). This is the single
                  strongest conversion signal because it answers the unspoken
                  "but does it actually work?" objection. ─── */}
              <div id="before-after" className="w-full mt-12 sm:mt-16">
                <LandingBeforeAfterSection />
              </div>

              {/* Strong horizontal section break — full-width line with
                  labeled badge in the middle so users clearly see they're
                  entering the "how it works" 3-step explainer below. */}
              <div className="relative w-full max-w-6xl mx-auto mt-12 sm:mt-16 mb-4 sm:mb-6 flex items-center gap-4 sm:gap-6 px-1" aria-hidden>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-stone-300/80 to-stone-300/80 dark:via-stone-700/60 dark:to-stone-700/60" />
                <span className="inline-flex items-center gap-2 rounded-full border-2 border-[#E5E5E5] dark:border-stone-700 bg-white dark:bg-stone-900 px-4 py-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-[0.18em] text-[#1CB0F6] dark:text-[#1CB0F6] whitespace-nowrap">
                  <svg className="w-3 h-3 motion-safe:animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v9.586l3.293-3.293a1 1 0 111.414 1.414l-5 5a1 1 0 01-1.414 0l-5-5a1 1 0 111.414-1.414L9 13.586V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Here&apos;s how it works
                </span>
                <div className="flex-1 h-px bg-gradient-to-l from-transparent via-stone-300/80 to-stone-300/80 dark:via-stone-700/60 dark:to-stone-700/60" />
              </div>

              {/* ─── How WriteScholar works — 3-step flow connects essay
                  analysis and study tools into one mental model. Sits AFTER
                  the live analyzer demo so visitors first see the product in
                  action, then understand the mental model. ─── */}
              <div className="relative w-full max-w-7xl mx-auto mt-6 sm:mt-8 lg:mt-10 px-1 sm:px-2 lg:px-4">
                <div className="pointer-events-none absolute -top-8 left-[6%] w-32 h-32 rounded-full bg-[#1CB0F6]/15 dark:bg-[#1CB0F6]/12 blur-3xl" aria-hidden />
                <div className="pointer-events-none absolute -bottom-4 right-[8%] w-36 h-36 rounded-full bg-[#58CC02]/15 dark:bg-[#58CC02]/12 blur-3xl" aria-hidden />

                <LandingScrollReveal>
                  <div className="relative text-center mb-8 sm:mb-10 max-w-2xl mx-auto">
                    <h2
                      className="text-2xl sm:text-3xl lg:text-[2.4rem] font-extrabold text-stone-900 dark:text-stone-50 tracking-tight leading-[1.05]"
                      style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
                    >
                      Drop in your work.{' '}
                      <span className="text-[#58CC02] dark:text-[#58CC02]">We do the rest.</span>
                    </h2>
                    <p className="mt-2 text-sm sm:text-base text-stone-600 dark:text-stone-400">
                      One paste. Three steps. Better grades.
                    </p>
                  </div>

                  {/* 3-step grid */}
                  <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
                    {[
                      {
                        step: '1',
                        title: 'Paste your work',
                        desc: 'Drop in an essay draft for feedback, or paste any notes / textbook chapter for study tools.',
                        mascot: '/mascot-paper.webp',
                        accentBorder: 'border-[#1CB0F6]/60 dark:border-[#1899D6]/50',
                        accentRing: 'ring-[#1CB0F6]/30',
                        accentGlow: 'from-[#1CB0F6]/30 via-[#1CB0F6]/15 to-[#58CC02]/15',
                        badge: 'bg-[#1CB0F6]',
                      },
                      {
                        step: '2',
                        title: 'AI does the heavy lifting',
                        desc: 'In under 60 seconds, get rubric-graded essay feedback or 7 study tools generated from your notes.',
                        mascot: '/mascot-laptop.webp',
                        accentBorder: 'border-[#A560E8]/60 dark:border-[#8A48C7]/50',
                        accentRing: 'ring-[#A560E8]/30',
                        accentGlow: 'from-[#A560E8]/30 via-[#1CB0F6]/15 to-[#FF9600]/15',
                        badge: 'bg-[#A560E8]',
                      },
                      {
                        step: '3',
                        title: 'Submit & ace it',
                        desc: 'Hand in stronger essays. Walk into exams ready. Crush your next semester.',
                        mascot: '/mascot-celebrating.webp',
                        accentBorder: 'border-[#FF9600]/60 dark:border-[#D97F00]/50',
                        accentRing: 'ring-[#FF9600]/30',
                        accentGlow: 'from-[#FF9600]/30 via-[#FF4B4B]/15 to-[#1CB0F6]/15',
                        badge: 'bg-[#FF9600]',
                      },
                    ].map((s, i) => (
                      <div
                        key={s.step}
                        className={`relative rounded-3xl border ${s.accentBorder} bg-white dark:bg-stone-900 p-5 sm:p-6 shadow-none hover:-translate-y-1 transition-all duration-500 overflow-hidden`}
                        style={{ animationDelay: `${i * 120}ms` }}
                      >
                        <div className={`pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full bg-gradient-to-br ${s.accentGlow} blur-3xl opacity-70`} aria-hidden />
                        <div className="relative flex items-start gap-3 mb-3">
                          <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white text-sm font-bold shadow-md ring-2 ring-white dark:ring-stone-900 ${s.badge}`}>
                            {s.step}
                          </span>
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#1CB0F6] dark:text-[#1CB0F6] mb-0.5">
                              Step {s.step}
                            </p>
                            <h3
                              className="text-lg sm:text-xl font-extrabold text-stone-900 dark:text-stone-50 leading-tight"
                              style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
                            >
                              {s.title}
                            </h3>
                          </div>
                        </div>
                        <div className={`relative rounded-2xl border ${s.accentBorder} bg-gradient-to-br from-stone-50 to-white dark:from-stone-800/60 dark:to-stone-900 ring-1 ${s.accentRing} aspect-[16/10] overflow-hidden flex items-center justify-center`}>
                          <img
                            src={s.mascot}
                            alt=""
                            aria-hidden
                            loading="lazy"
                            decoding="async"
                            className="w-32 sm:w-40 h-auto"
                          />
                        </div>
                        <p className="relative mt-4 text-[14px] text-stone-600 dark:text-stone-400 leading-relaxed">
                          {s.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </LandingScrollReveal>
              </div>

              {/* Daily Review preview — phones & tablets only. Replaces the
                  previous Before/After essay comparison so the study-tools
                  mechanic surfaces above the fold for mobile visitors (the
                  hero shows this same screenshot in its right column on lg+).
                  Same image is also rendered later in the Motivation section
                  in its original spot. */}
              <div
                className="lg:hidden w-full mt-8 sm:mt-10 pb-2 px-1"
                aria-label="Daily Review preview"
              >
                <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-500 mb-4 sm:mb-6">
                  Daily Review — built from your notes
                </p>
                <div className="max-w-md mx-auto">
                  <div className="relative group">
                    <div className="absolute -inset-2 bg-[#58CC02]/15 rounded-3xl blur-2xl opacity-50 group-hover:opacity-70 transition-opacity duration-500" aria-hidden />
                    <div className="relative rounded-2xl overflow-hidden border-2 border-b-4 border-[#46A302] dark:border-[#46A302] shadow-2xl bg-white dark:bg-stone-900">
                      <img
                        src="/daily-review-preview.png"
                        alt="WriteScholar Daily Review: personalised practice questions built from your notes, with instant feedback and XP rewards"
                        className="w-full h-auto block"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ─── How your draft is reviewed — modernized to match the
                  new landing theme. Combined the legend + 5 focus-area cards
                  into one cohesive section. Hidden on mobile (too dense for
                  phones — desktop keeps the full 5-card grid). ─── */}
              <section
                id="hero-feedback-details"
                className="hidden relative w-full max-w-7xl mx-auto mt-14 sm:mt-20 lg:mt-24 px-1 sm:px-2 lg:px-4 scroll-mt-24"
                aria-labelledby="hero-feedback-details-heading"
              >
                <div className="pointer-events-none absolute -top-8 left-[8%] w-32 h-32 rounded-full bg-[#1CB0F6]/15 dark:bg-[#1CB0F6]/12 blur-3xl" aria-hidden />
                <div className="pointer-events-none absolute -bottom-4 right-[8%] w-36 h-36 rounded-full bg-[#58CC02]/15 dark:bg-[#58CC02]/12 blur-3xl" aria-hidden />

                <LandingScrollReveal>
                  <div className="relative text-center mb-8 sm:mb-10 max-w-2xl mx-auto">
                    <span className="inline-flex items-center gap-2 mb-3 rounded-full border-2 border-[#E5E5E5] dark:border-stone-700 bg-white/80 dark:bg-stone-900/70 backdrop-blur px-3.5 py-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-[#1CB0F6] dark:text-[#1CB0F6]">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                        <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      How your draft is reviewed
                    </span>
                    <h2
                      id="hero-feedback-details-heading"
                      className="text-2xl sm:text-3xl lg:text-[2.4rem] font-extrabold text-stone-900 dark:text-stone-50 tracking-tight leading-[1.05]"
                      style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
                    >
                      Five things our analyzer{' '}
                      <span className="text-[#58CC02] dark:text-[#58CC02]">never misses.</span>
                    </h2>
                    <p className="mt-2 text-sm sm:text-base text-stone-600 dark:text-stone-400">
                      Every essay you upload gets the same five-point treatment. Hover any annotation for the explanation.
                    </p>

                    {/* Annotation legend — strong / revise / concern */}
                    <div
                      className="mt-5 flex flex-wrap items-center justify-center gap-2 text-[11px] sm:text-xs text-stone-700 dark:text-stone-300"
                      aria-label="Annotation legend: strong, revise, concern"
                    >
                      {[
                        { label: 'Strong', color: 'bg-[#58CC02]', glow: 'shadow-[0_0_10px_rgba(88,204,2,0.45)]' },
                        { label: 'Revise', color: 'bg-[#FF9600]', glow: 'shadow-[0_0_10px_rgba(255,150,0,0.45)]', delay: '0.25s' },
                        { label: 'Concern', color: 'bg-[#FF4B4B]', glow: 'shadow-[0_0_10px_rgba(255,75,75,0.40)]', delay: '0.5s' },
                      ].map((tag) => (
                        <span
                          key={tag.label}
                          className="inline-flex items-center gap-1.5 rounded-full border border-stone-200/80 dark:border-stone-700/70 bg-white dark:bg-stone-900 px-3 py-1 shadow-sm"
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${tag.color} ${tag.glow} motion-safe:animate-[pulse_2.8s_ease-in-out_infinite]`}
                            style={tag.delay ? { animationDelay: tag.delay } : undefined}
                            aria-hidden
                          />
                          <span className="font-semibold">{tag.label}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </LandingScrollReveal>

                {/* 5 focus-area cards — modern grid with tone-tinted gradients,
                    matched to the rest of the new landing theme. */}
                <LandingScrollReveal>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 max-w-6xl mx-auto">
                    {heroFeatureCards.map((card, idx) => (
                      <LandingScrollReveal
                        key={card.title}
                        className="h-full"
                        delayMs={idx * 90}
                      >
                        <button
                          type="button"
                          onClick={card.onClick}
                          className="group relative w-full h-full text-left rounded-2xl border-2 border-b-4 border-[#E5E5E5] dark:border-stone-700 bg-white dark:bg-stone-900 p-4 sm:p-5 hover:-translate-y-1 hover:border-[#1CB0F6] dark:hover:border-[#1CB0F6]/60 transition-all duration-300 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1CB0F6]/40"
                        >
                          {/* Step badge + icon */}
                          <div className="relative flex items-start gap-2.5 mb-3">
                            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base shadow-sm ring-1 ring-stone-200/80 dark:ring-stone-700/60 ${card.accentClasses.iconBg}`}>
                              {card.icon}
                            </span>
                            <div className="min-w-0">
                              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-500 dark:text-stone-400 mb-0.5">
                                {String(idx + 1).padStart(2, '0')}
                              </p>
                              <h3
                                className="text-[15px] font-extrabold text-stone-900 dark:text-stone-100 leading-tight"
                                style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
                              >
                                {card.title}
                              </h3>
                            </div>
                          </div>

                          {/* Inner mini-preview panel */}
                          <div className="relative rounded-xl bg-stone-50/80 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-700/70 p-3 mb-3 min-h-[72px] flex items-center justify-center overflow-hidden">
                            {card.inner}
                          </div>

                          <p className="text-[12px] text-stone-600 dark:text-stone-400 leading-snug">{card.desc}</p>

                          {/* Hover arrow */}
                          <span className="pointer-events-none absolute top-3 right-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
                            <svg className="w-4 h-4 text-[#1CB0F6] dark:text-[#1CB0F6]" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </span>
                        </button>
                      </LandingScrollReveal>
                    ))}
                  </div>
                </LandingScrollReveal>

                <LandingScrollReveal className="w-full" delayMs={420}>
                  <p className="mt-6 sm:mt-8 text-center text-xs text-stone-500 dark:text-stone-400 leading-relaxed max-w-2xl mx-auto">
                    Free plan includes 2 essay analyses per month · Encrypted in transit · Cancel anytime · Quizzes, flashcards &amp; Focus Mode live under{' '}
                    <button type="button" onClick={() => onNavigate('more-tools')} className="text-[#1CB0F6] dark:text-[#1CB0F6] font-extrabold hover:underline transition-colors">
                      More tools
                    </button>
                  </p>
                </LandingScrollReveal>

                {/* Extra breathing room before the next landing section so the
                    fine-print line doesn't jam into the study tools showcase. */}
                <div className="h-12 sm:h-20 lg:h-24" aria-hidden />
              </section>
            </div>

          </div>
        </div>
      </section>

      {/* Study tools sits above citations — flagship feature first. */}
      <LandingStudyToolsHero onNavigate={onNavigate} />

      {/* Social proof: testimonial + universities — placed beneath the
          study-tools showcase so visitors see the "7 study tools" promise
          first, then immediately land on the proof that students at top
          universities use it.
          TEMPORARILY HIDDEN via the leading `hidden` class — keep markup
          intact for easy re-enable (just remove `hidden` from className). */}
      <div
        className="hidden relative w-full overflow-x-clip overflow-hidden
          border-y border-stone-200/90 dark:border-stone-800
          bg-[#fafafa] dark:bg-stone-950
          shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-none"
        aria-label="Social proof: student testimonial and universities"
        aria-hidden="true"
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_-20%,rgba(28,176,246,0.04),transparent_50%)] dark:bg-[radial-gradient(ellipse_90%_70%_at_50%_-20%,rgba(28,176,246,0.08),transparent_50%)]"
          aria-hidden
        />
        <div className="relative z-10 pt-10 pb-8 sm:pt-12 sm:pb-10">
          <div className="max-w-6xl mx-auto px-3 sm:px-6">
            {/* Testimonial card — minimal, just the quote. Modern
                violet/fuchsia frame with a glow halo and a quote mark. */}
            <figure className="relative rounded-3xl border-2 border-b-4 border-[#E5E5E5] dark:border-stone-700 bg-white dark:bg-stone-900/70 px-5 py-6 sm:px-10 sm:py-9 w-full max-w-2xl min-w-0 mx-auto mb-9 sm:mb-12 overflow-hidden">
              <div className="pointer-events-none absolute -top-12 -right-12 w-40 h-40 rounded-full bg-[#1CB0F6]/20 dark:bg-[#1CB0F6]/15 blur-3xl" aria-hidden />
              <div className="pointer-events-none absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-[#58CC02]/15 dark:bg-[#58CC02]/12 blur-3xl" aria-hidden />

              <blockquote className="relative m-0 border-0 p-0 w-full text-center">
                <span
                  className="block text-[#1CB0F6]/40 dark:text-[#1CB0F6]/30 text-5xl sm:text-6xl leading-none mb-2 select-none"
                  aria-hidden
                >
                  &ldquo;
                </span>
                <p
                  className="text-stone-800 dark:text-stone-100 text-base sm:text-xl leading-snug sm:leading-relaxed font-medium italic break-words px-0.5"
                  style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
                >
                  Went from a B to an A in one submission. The feedback was exactly what my professor wanted.
                </p>
              </blockquote>
            </figure>

            {/* Universities header — modernized eyebrow + serif */}
            <div className="w-full max-w-2xl mx-auto text-center mb-7 sm:mb-9 px-1">
              <span className="inline-flex items-center gap-1.5 mb-3 rounded-full border-2 border-[#E5E5E5] dark:border-stone-700 bg-white/80 dark:bg-stone-900/70 backdrop-blur px-3 py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-[#1CB0F6] dark:text-[#1CB0F6]">
                <span aria-hidden>★</span>
                Used at top universities
              </span>
              <h3
                className="text-xl sm:text-2xl lg:text-[1.65rem] font-extrabold text-stone-900 dark:text-stone-50 tracking-tight leading-tight"
                style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
              >
                Students at <span className="text-[#1CB0F6] dark:text-[#1CB0F6]">leading universities</span> use WriteScholar
              </h3>
            </div>
          </div>

          {/* University name carousel — gradient pill chips */}
          <div className="relative overflow-hidden px-0">
            <div
              className="pointer-events-none absolute inset-y-0 left-0 z-10 w-14 sm:w-24 bg-gradient-to-r from-[#fafafa] dark:from-stone-950 via-[#fafafa] dark:via-stone-950 to-transparent"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-y-0 right-0 z-10 w-14 sm:w-24 bg-gradient-to-l from-[#fafafa] dark:from-stone-950 via-[#fafafa] dark:via-stone-950 to-transparent"
              aria-hidden
            />
            <div className="flex w-max animate-scroll-slow items-center py-1">
              {[...universities, ...universities, ...universities].map((uni, idx) => (
                <div key={`hero-uni-${idx}`} className="flex-shrink-0 mx-2 sm:mx-3">
                  <span
                    className={`inline-flex items-center gap-2 rounded-xl border-2 border-b-4 border-[#E5E5E5] dark:border-stone-700 bg-white dark:bg-stone-900 px-4 py-2.5 sm:px-5 sm:py-3 text-sm sm:text-[15px] font-extrabold hover:-translate-y-0.5 transition-all duration-300 ${uni.className} !text-stone-800 dark:!text-stone-100`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-[#1CB0F6] shrink-0" aria-hidden />
                    {uni.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── "Study daily. Level up." — gamification showcase.
          Daily Review, XP, Levels, Streaks, Badges — the habit loop
          that makes WriteScholar feel like Duolingo for academics. ─── */}
      <section id="motivation" className="relative py-10 sm:py-24 overflow-hidden border-t border-[#E5E5E5] dark:border-stone-800 bg-white dark:bg-stone-950 scroll-mt-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-15%,rgba(255,150,0,0.06),transparent_55%)] dark:bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(255,150,0,0.10),transparent_55%)]" aria-hidden />
        <div
          className="absolute inset-0 opacity-[0.4] dark:opacity-[0.15] pointer-events-none bg-[length:32px_32px] bg-[linear-gradient(to_right,rgba(148,163,184,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.07)_1px,transparent_1px)]"
          aria-hidden
        />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <LandingScrollReveal>
            {/* Header */}
            <div className="text-center mb-10 sm:mb-14 max-w-2xl mx-auto">
              <span className="inline-flex items-center gap-2 mb-4 rounded-full border border-orange-200/80 dark:border-orange-700/55 bg-[#FFF4E0]/80 dark:bg-[#FF9600]/10 backdrop-blur px-3.5 py-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-[#FF9600] dark:text-[#FF9600] shadow-sm">
                <span aria-hidden>🔥</span>
                The habit loop that keeps grades up
              </span>
              <h2
                className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold text-[#3C3C3C] dark:text-stone-50 tracking-tight leading-[1.05]"
                style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
              >
                Studying that{' '}
                <span className="text-[#FF9600]">
                  actually sticks.
                </span>
              </h2>
              <p className="mt-3 text-base sm:text-lg text-stone-600 dark:text-stone-400">
                Most students give up after week two. WriteScholar's streak + XP system makes studying the easy choice — so you actually show up the day before the test.
              </p>
            </div>

            {/* 4 feature cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {/* Daily Review */}
              <div className="relative rounded-2xl border-2 border-b-4 border-[#46A302] bg-white dark:bg-stone-900 p-5 sm:p-6 hover:-translate-y-1 transition-all overflow-hidden">
                <div className="pointer-events-none absolute -top-12 -right-12 w-36 h-36 rounded-full bg-[#58CC02]/15 dark:bg-[#58CC02]/10 blur-3xl" aria-hidden />
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-[#58CC02] flex items-center justify-center mb-4 border-2 border-b-4 border-[#46A302]">
                    <span className="text-xl" aria-hidden>📚</span>
                  </div>
                  <h3
                    className="text-lg font-extrabold text-[#3C3C3C] dark:text-stone-50 mb-2"
                    style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
                  >
                    Daily Review
                  </h3>
                  <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed mb-4">
                    10 minutes a day beats 4 hours of cramming. Your personalised drill from saved notes — built around what you keep getting wrong.
                  </p>
                  {/* Mini visual — lesson card mockup. Hidden on mobile to
                      cut card height; the description already tells the story. */}
                  <div className="hidden sm:block rounded-xl bg-[#E5F8D0]/60 dark:bg-[#58CC02]/10 border border-[#58CC02]/30 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-lg bg-[#58CC02] flex items-center justify-center">
                        <span className="text-white text-[10px] font-extrabold">1</span>
                      </div>
                      <span className="text-xs font-bold text-[#3C3C3C] dark:text-stone-200">Today&apos;s Session</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#58CC02]/20 overflow-hidden">
                      <div className="h-full w-[65%] rounded-full bg-[#58CC02]" />
                    </div>
                    <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-1.5 font-medium">3 of 5 questions done</p>
                  </div>
                </div>
              </div>

              {/* XP & Levels */}
              <div className="relative rounded-2xl border-2 border-b-4 border-[#1899D6] bg-white dark:bg-stone-900 p-5 sm:p-6 hover:-translate-y-1 transition-all overflow-hidden">
                <div className="pointer-events-none absolute -top-12 -right-12 w-36 h-36 rounded-full bg-[#1CB0F6]/15 dark:bg-[#1CB0F6]/10 blur-3xl" aria-hidden />
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-[#1CB0F6] flex items-center justify-center mb-4 border-2 border-b-4 border-[#1899D6]">
                    <span className="text-xl" aria-hidden>⭐</span>
                  </div>
                  <h3
                    className="text-lg font-extrabold text-[#3C3C3C] dark:text-stone-50 mb-2"
                    style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
                  >
                    XP & 100 Levels
                  </h3>
                  <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed mb-4">
                    Every essay reviewed, every quiz aced, every streak day — they all stack into XP. Levels you actually want to chase.
                  </p>
                  {/* Mini visual — level badge + XP bar. Hidden on mobile. */}
                  <div className="hidden sm:block rounded-xl bg-[#DDF4FF]/60 dark:bg-[#1CB0F6]/10 border border-[#1CB0F6]/30 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg bg-[#1CB0F6] flex items-center justify-center border-b-2 border-[#1899D6]">
                        <span className="text-white text-[11px] font-extrabold">12</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-extrabold text-[#3C3C3C] dark:text-stone-200 truncate">Knowledge Keeper III</p>
                        <div className="flex items-center gap-1">
                          <div className="flex-1 h-1.5 rounded-full bg-[#1CB0F6]/20 overflow-hidden">
                            <div className="h-full w-[42%] rounded-full bg-[#1CB0F6]" />
                          </div>
                          <span className="text-[8px] text-stone-500 dark:text-stone-400 font-bold tabular-nums">1,340 XP</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Streaks */}
              <div className="relative rounded-2xl border-2 border-b-4 border-[#D97F00] bg-white dark:bg-stone-900 p-5 sm:p-6 hover:-translate-y-1 transition-all overflow-hidden">
                <div className="pointer-events-none absolute -top-12 -right-12 w-36 h-36 rounded-full bg-[#FF9600]/15 dark:bg-[#FF9600]/10 blur-3xl" aria-hidden />
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-[#FF9600] flex items-center justify-center mb-4 border-2 border-b-4 border-[#D97F00]">
                    <span className="text-xl" aria-hidden>🔥</span>
                  </div>
                  <h3
                    className="text-lg font-extrabold text-[#3C3C3C] dark:text-stone-50 mb-2"
                    style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
                  >
                    Daily Streaks
                  </h3>
                  <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed mb-4">
                    Your streak is your accountability. Miss a day and you'll feel it — that's the point. It's how casual users become 4.0 students.
                  </p>
                  {/* Mini visual — streak counter. Hidden on mobile. */}
                  <div className="hidden sm:block rounded-xl bg-[#FFF4E0]/60 dark:bg-[#FF9600]/10 border border-[#FF9600]/30 p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl" aria-hidden>🔥</span>
                        <div>
                          <p className="text-lg font-extrabold text-[#FF9600]">14</p>
                          <p className="text-[10px] font-bold text-stone-500 dark:text-stone-400 -mt-0.5">day streak</p>
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                          <div
                            key={d + i}
                            className={`w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold ${
                              i < 6
                                ? 'bg-[#FF9600] text-white'
                                : 'bg-stone-200 dark:bg-stone-700 text-stone-400 dark:text-stone-500'
                            }`}
                          >
                            {d}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Badges */}
              <div className="relative rounded-2xl border-2 border-b-4 border-[#8A48C7] bg-white dark:bg-stone-900 p-5 sm:p-6 hover:-translate-y-1 transition-all overflow-hidden">
                <div className="pointer-events-none absolute -top-12 -right-12 w-36 h-36 rounded-full bg-[#A560E8]/15 dark:bg-[#A560E8]/10 blur-3xl" aria-hidden />
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-[#A560E8] flex items-center justify-center mb-4 border-2 border-b-4 border-[#8A48C7]">
                    <span className="text-xl" aria-hidden>🏅</span>
                  </div>
                  <h3
                    className="text-lg font-extrabold text-[#3C3C3C] dark:text-stone-50 mb-2"
                    style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
                  >
                    80+ Badges
                  </h3>
                  <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed mb-4">
                    Visible milestones turn "I should study" into "I want my next badge." It works because it's stupid and you can't help it.
                  </p>
                  {/* Mini visual — badge grid. Hidden on mobile to cut height. */}
                  <div className="hidden sm:block rounded-xl bg-[#F3EAFF]/60 dark:bg-[#A560E8]/10 border border-[#A560E8]/30 p-3">
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { badgeId: 'first_login', unlocked: true },
                        { badgeId: 'brain_spark', unlocked: true },
                        { badgeId: 'citation_hunter', unlocked: true },
                        { badgeId: 'streak_starter', unlocked: false },
                        { badgeId: 'premium_pioneer', unlocked: true },
                        { badgeId: 'streak_legend', unlocked: false },
                        { badgeId: 'monthly_master', unlocked: true },
                        { badgeId: 'night_owl', unlocked: false },
                      ].map((b) => (
                        <div
                          key={b.badgeId}
                          className={`w-full aspect-square rounded-lg flex items-center justify-center ${
                            b.unlocked
                              ? 'bg-[#A560E8]/20 dark:bg-[#A560E8]/25'
                              : 'bg-stone-200/60 dark:bg-stone-700/40 opacity-40'
                          }`}
                        >
                          <Suspense fallback={<span className="text-sm">🏅</span>}>
                            <BadgeCreature badgeId={b.badgeId} unlocked={b.unlocked} size={36} />
                          </Suspense>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-2 text-center font-medium">5 of 80+ unlocked</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Review screenshot — real product preview */}
            <div className="mt-10 sm:mt-14 max-w-4xl mx-auto">
              <div className="text-center mb-5 sm:mb-6">
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E5F8D0]/80 dark:bg-[#58CC02]/15 text-[#58CC02] dark:text-[#58CC02] text-[10px] sm:text-xs font-extrabold uppercase tracking-wider border border-[#58CC02]/30">
                  <span aria-hidden>📚</span>
                  Daily Review in action
                </span>
              </div>
              <div className="relative group">
                <div className="absolute -inset-2 bg-[#58CC02]/20 rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-500" aria-hidden />
                <div className="relative rounded-2xl overflow-hidden border-2 border-b-4 border-[#46A302] dark:border-[#46A302] shadow-2xl">
                  <img
                    src="/daily-review-preview.png"
                    alt="WriteScholar Daily Review: personalised daily practice with multiple choice questions, progress tracking, and instant feedback"
                    className="w-full h-auto"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
              <p className="mt-4 text-center text-sm text-stone-500 dark:text-stone-400">
                Your daily practice session — questions pulled from your own study materials, with instant feedback and XP rewards.
              </p>
            </div>

            {/* Level-up celebration preview */}
            <div className="mt-10 sm:mt-12 rounded-2xl border-2 border-b-4 border-[#E5E5E5] dark:border-stone-700/60 bg-white dark:bg-stone-900 p-5 sm:p-6 max-w-4xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#58CC02] flex items-center justify-center border-4 border-[#E5F8D0] dark:border-[#58CC02]/30" style={{ boxShadow: '0 0 20px rgba(88,204,2,0.3)' }}>
                    <span className="text-2xl sm:text-3xl font-extrabold text-white">7</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#58CC02] dark:text-[#58CC02] mb-0.5">
                      Level up!
                    </p>
                    <p className="text-lg sm:text-xl font-extrabold text-[#3C3C3C] dark:text-stone-50" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
                      Curious Cat II
                    </p>
                    <p className="text-sm text-stone-500 dark:text-stone-400">
                      Confetti, celebrations, and a new title every time you level up.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('signup')}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[#58CC02] text-white font-extrabold text-sm border-2 border-b-4 border-[#46A302] hover:bg-[#46A302] active:border-b-2 active:translate-y-0.5 transition-all whitespace-nowrap"
                >
                  Start earning XP
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            </div>
          </LandingScrollReveal>
        </div>
      </section>
      <LandingCitationsShowcase onNavigate={onNavigate} />

      {/* H2 #2: Create Study Material, hidden (see More tools) */}


      {/* Study Better Together (from Share Friends page; hidden when HIDE_FRIENDS) */}
      {!HIDE_FRIENDS && !LANDING_HIDE_SECONDARY_SECTIONS && (
      <section className="relative py-12 sm:py-20 overflow-hidden bg-white dark:bg-stone-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_50%,rgba(99,102,241,0.07),transparent)] dark:bg-[radial-gradient(ellipse_70%_60%_at_50%_50%,rgba(139,92,246,0.06),transparent)]" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Mobile layout: badge, title, video, share instructions */}
          <div className="lg:hidden flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#DDF4FF] dark:bg-[#1CB0F6]/20 text-[#1CB0F6] dark:text-[#1CB0F6] rounded-full text-sm font-extrabold mb-4 border-2 border-b-4 border-[#1899D6]">
              <span>👫</span>
              <span>Social Study, Levelled Up</span>
            </div>
            <h2 className="text-2xl font-extrabold text-stone-900 dark:text-stone-50 leading-tight mb-2">
              Study Better,{' '}
              <span className="text-[#1CB0F6]">
                Together
              </span>
            </h2>
            <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed mb-5 max-w-sm">
              Add friends with your unique code and share flashcards, quizzes, crosswords & notes in one tap.
            </p>
            <div className="relative flex items-center justify-center mb-4 w-full max-w-[280px]">
              <div className="absolute inset-0 bg-[#1CB0F6]/15 rounded-3xl blur-3xl" />
              <DualMascot size={200} />
            </div>
            <div className="relative w-full max-w-[360px] rounded-2xl overflow-hidden border-2 border-stone-200/80 dark:border-stone-700/60 shadow-xl mb-6 bg-stone-900">
              <ViewportAutoplayVideo
                src="/writescholar-friends-share-demo.mp4"
                className="w-full aspect-video object-cover"
                title="WriteScholar Friends: share quizzes, flashcards and crosswords"
                aria-label="WriteScholar Friends: share quizzes, flashcards and crosswords with friends"
              />
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-6 px-2 leading-relaxed">
              To share: go to <strong>Saved Materials</strong> in the dashboard or header → tap the <strong>Share</strong> button on any quiz, flashcard, or crossword → select your friend.
            </p>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <button
                onClick={() => onNavigate('signup')}
                className="w-full px-6 py-3.5 bg-[#58CC02] text-white font-extrabold rounded-2xl border-2 border-b-4 border-[#46A302] active:border-b-2 active:translate-y-0.5 text-sm flex items-center justify-center gap-2"
              >
                <span>Start sharing free</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
              <button
                onClick={() => onNavigate('features')}
                className="w-full px-6 py-3.5 bg-white dark:bg-stone-800 text-[#3C3C3C] dark:text-stone-200 font-extrabold rounded-2xl border-2 border-b-4 border-[#E5E5E5] dark:border-stone-700 active:border-b-2 active:translate-y-0.5 text-sm"
              >
                See all features
              </button>
            </div>
          </div>

          {/* Desktop layout: text left, video right */}
          <div className="hidden lg:grid lg:grid-cols-2 gap-8 items-center">
            <div className="text-center lg:text-left order-2 lg:order-1 pb-8 lg:pb-0">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#DDF4FF] dark:bg-[#1CB0F6]/20 text-[#1CB0F6] dark:text-[#1CB0F6] rounded-full text-sm font-extrabold mb-5 border-2 border-b-4 border-[#1899D6]">
                <span>👫</span>
                <span>Social Study, Levelled Up</span>
              </div>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-stone-900 dark:text-stone-50 leading-tight mb-5">
                Study Better,{' '}
                <span className="text-[#1CB0F6]">
                  Together
                </span>
              </h2>
              <p className="text-base sm:text-lg text-stone-600 dark:text-stone-300 leading-relaxed mb-4 max-w-lg mx-auto lg:mx-0">
                Add friends with your unique code and share flashcards, quizzes, crosswords & notes in one tap. It delivers straight to their device. All they have to do is accept.
              </p>
              <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed mb-6 max-w-lg mx-auto lg:mx-0">
                To share: go to <strong>Saved Materials</strong> in the dashboard or header → tap the <strong>Share</strong> button on any quiz, flashcard, or crossword → select your friend.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <button
                  onClick={() => onNavigate('signup')}
                  className="px-7 py-3.5 bg-[#58CC02] text-white font-extrabold rounded-2xl border-2 border-b-4 border-[#46A302] hover:bg-[#46A302] active:border-b-2 active:translate-y-0.5 transition-all duration-200 text-base flex items-center justify-center gap-2"
                >
                  <span>Start sharing free</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
                <button
                  onClick={() => onNavigate('features')}
                  className="px-7 py-3.5 bg-white dark:bg-stone-800 text-[#3C3C3C] dark:text-stone-200 font-extrabold rounded-2xl border-2 border-b-4 border-[#E5E5E5] dark:border-stone-700 hover:border-[#1899D6] dark:hover:border-[#1899D6] active:border-b-2 active:translate-y-0.5 transition-all duration-200 text-base"
                >
                  See all features
                </button>
              </div>
            </div>
            <div className="relative flex flex-col items-center justify-center order-1 lg:order-2 gap-6">
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 bg-[#1CB0F6]/15 rounded-3xl blur-3xl" />
                <DualMascot size={280} />
              </div>
              <div className="relative w-full max-w-lg rounded-2xl overflow-hidden border-2 border-stone-200/80 dark:border-stone-700/60 shadow-xl bg-stone-900">
                <ViewportAutoplayVideo
                  src="/writescholar-friends-share-demo.mp4"
                  className="w-full aspect-video object-cover"
                  title="WriteScholar Friends: share quizzes, flashcards and crosswords"
                  aria-label="WriteScholar Friends: share quizzes, flashcards and crosswords with friends"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* One Code. Endless Friends. (from Share Friends page; hidden when HIDE_FRIENDS) */}
      {!HIDE_FRIENDS && !LANDING_HIDE_SECONDARY_SECTIONS && (
      <section className="relative py-16 sm:py-24 bg-[#DDF4FF]/40 dark:bg-stone-900 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_50%,rgba(99,102,241,0.08),transparent)] dark:bg-[radial-gradient(ellipse_60%_40%_at_50%_50%,rgba(139,92,246,0.06),transparent)]" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block px-4 py-1.5 bg-[#DDF4FF] dark:bg-[#1CB0F6]/20 text-[#1CB0F6] dark:text-[#1CB0F6] rounded-full text-sm font-extrabold mb-4 border-2 border-b-4 border-[#1899D6]">
            Your Identity on WriteScholar
          </span>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-stone-800 dark:text-stone-100 mb-4">
            One Code.{' '}
            <span className="text-[#1CB0F6]">
              Endless Friends.
            </span>
          </h2>
          <p className="text-base sm:text-lg text-stone-600 dark:text-stone-400 max-w-2xl mx-auto mb-10">
            Every account gets a permanent, human-readable friend code. No emails, no usernames to remember. Just drop the code, accept the friend request and you're connected.
          </p>
          <div className="relative inline-block group mb-10">
            <div className="absolute -inset-1 bg-[#1CB0F6]/30 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
            <div className="relative bg-white dark:bg-stone-800 rounded-2xl px-8 sm:px-14 py-8 border-2 border-b-4 border-[#1899D6] dark:border-[#1899D6]">
              <p className="text-xs sm:text-sm font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-3">Your unique friend code</p>
              <div className="flex items-center justify-center gap-3 sm:gap-5 flex-wrap">
                <span className="text-3xl sm:text-5xl font-black tracking-widest text-[#1CB0F6] dark:text-[#1CB0F6] font-mono">
                  WS-BUDDY-4872
                </span>
                <button
                  type="button"
                  className="flex items-center gap-2 px-4 py-2 bg-[#DDF4FF] dark:bg-[#1CB0F6]/20 hover:bg-[#1CB0F6]/30 text-[#1CB0F6] dark:text-[#1CB0F6] font-extrabold rounded-xl text-sm border-2 border-b-4 border-[#1899D6] active:border-b-2 active:translate-y-0.5 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  Copy code
                </button>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
                {['Easy to remember', 'Shareable anywhere', 'Yours forever'].map((tag) => (
                  <span key={tag} className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-stone-500 dark:text-stone-400">
                    <svg className="w-4 h-4 text-[#58CC02] dark:text-[#58CC02] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <p className="text-sm text-stone-400 dark:text-stone-500">This is a demo code. Sign up to get your own unique code instantly.</p>
        </div>
      </section>
      )}


      <LandingTestimonialsSection />


      {/* ─── "Everything you need to ace school" — feature matrix that
          implicitly compares WriteScholar to single-purpose tools (Quizlet
          flashcards only, ChatGPT essay help only, etc.) by showing breadth.
          Hidden on mobile (hidden md:block) because the same product breadth
          is already conveyed by the study-tools showcase, the gamification
          section, and the pricing teaser — on a phone the dense 3-column
          comparison just adds scroll for low return. ─── */}
      <section className="relative hidden md:block py-16 sm:py-24 overflow-hidden border-t border-[#E5E5E5] dark:border-stone-800 bg-white dark:bg-stone-950">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-15%,rgba(91,33,182,0.06),transparent_55%)] dark:bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(139,92,246,0.10),transparent_55%)]" aria-hidden />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <LandingScrollReveal>
            <div className="text-center mb-10 sm:mb-14 max-w-2xl mx-auto">
              <span className="inline-flex items-center gap-2 mb-4 rounded-full border border-amber-200/80 dark:border-amber-700/55 bg-amber-50/80 dark:bg-amber-950/30 backdrop-blur px-3.5 py-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-amber-800 dark:text-amber-200 shadow-sm">
                <span aria-hidden>★</span>
                Why students switch
              </span>
              <h2
                className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold text-[#3C3C3C] dark:text-stone-50 tracking-tight leading-[1.05]"
                style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
              >
                Everything you need to ace school —{' '}
                <span className="text-[#58CC02]">
                  in one app.
                </span>
              </h2>
              <p className="mt-3 text-base sm:text-lg text-stone-600 dark:text-stone-400">
                No more juggling Quizlet, ChatGPT, Grammarly, and three citation generators. WriteScholar covers all of it.
              </p>
            </div>

            {/* Feature matrix */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
              {/* Writing pillar */}
              <div className="relative rounded-2xl border-2 border-b-4 border-[#8A48C7] bg-white dark:bg-stone-900 p-5 sm:p-6 hover:-translate-y-1 transition-all overflow-hidden">
                <div className="pointer-events-none absolute -top-12 -right-12 w-44 h-44 rounded-full bg-[#A560E8]/15 dark:bg-[#A560E8]/10 blur-3xl" aria-hidden />
                <div className="relative">
                  <div className="inline-flex items-center gap-2 mb-3 px-2.5 py-1 rounded-full bg-[#F3EAFF] dark:bg-[#A560E8]/20 text-[#A560E8] dark:text-[#A560E8] text-[10px] font-extrabold uppercase tracking-wider">
                    <span aria-hidden>📝</span> Writing
                  </div>
                  <h3
                    className="text-xl font-extrabold text-[#3C3C3C] dark:text-stone-50 mb-3"
                    style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
                  >
                    Hand in stronger essays
                  </h3>
                  <ul className="space-y-2">
                    {[
                      'Professor-style essay feedback',
                      'Structure & argument scoring',
                      'Citation finder (APA, MLA, Chicago)',
                      'Paper summarizer for long readings',
                      'Grammar & academic tone check',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2 text-[14px] text-stone-700 dark:text-stone-300">
                        <svg className="w-4 h-4 mt-0.5 shrink-0 text-[#58CC02] dark:text-[#58CC02]" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6 7.7 9.3a1 1 0 00-1.4 1.4l2 2a1 1 0 001.4 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Studying pillar — featured/highlighted */}
              <div className="relative rounded-2xl border-2 border-b-4 border-[#46A302] bg-[#E5F8D0]/50 dark:bg-[#58CC02]/10 p-5 sm:p-6 hover:-translate-y-1 transition-all overflow-hidden md:scale-[1.02]">
                <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FF9600] text-white text-[9px] font-extrabold uppercase tracking-wider border-2 border-[#D97F00]">
                  <span aria-hidden>★</span> Most loved
                </span>
                <div className="pointer-events-none absolute -top-16 -left-12 w-52 h-52 rounded-full bg-[#58CC02]/15 dark:bg-[#58CC02]/10 blur-3xl" aria-hidden />
                <div className="relative">
                  <div className="inline-flex items-center gap-2 mb-3 px-2.5 py-1 rounded-full bg-[#E5F8D0] dark:bg-[#58CC02]/20 text-[#58CC02] dark:text-[#58CC02] text-[10px] font-extrabold uppercase tracking-wider">
                    <span aria-hidden>📦</span> Studying
                  </div>
                  <h3
                    className="text-xl font-extrabold text-[#3C3C3C] dark:text-stone-50 mb-3"
                    style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
                  >
                    Walk into exams ready
                  </h3>
                  <ul className="space-y-2">
                    {[
                      'AI flashcards from your notes',
                      'Auto-graded quizzes (MCQ, T/F, fill-in)',
                      'Vocabulary crosswords',
                      'Crater Blast — boss-battle quiz arcade',
                      'Word Tower — daily vocab game',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2 text-[14px] text-stone-700 dark:text-stone-300">
                        <svg className="w-4 h-4 mt-0.5 shrink-0 text-[#58CC02] dark:text-[#58CC02]" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6 7.7 9.3a1 1 0 00-1.4 1.4l2 2a1 1 0 001.4 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Motivation pillar — gamification: daily review, XP, levels,
                  streaks, badges. The habit loop that keeps students coming back. */}
              <div className="relative rounded-2xl border-2 border-b-4 border-[#D97F00] bg-white dark:bg-stone-900 p-5 sm:p-6 hover:-translate-y-1 transition-all overflow-hidden">
                <div className="pointer-events-none absolute -bottom-12 -right-12 w-44 h-44 rounded-full bg-amber-300/20 dark:bg-amber-500/15 blur-3xl" aria-hidden />
                <div className="relative">
                  <div className="inline-flex items-center gap-2 mb-3 px-2.5 py-1 rounded-full bg-[#FFF4E0] dark:bg-[#FF9600]/20 text-[#FF9600] dark:text-[#FF9600] text-[10px] font-extrabold uppercase tracking-wider">
                    <span aria-hidden>🔥</span> Motivation
                  </div>
                  <h3
                    className="text-xl font-extrabold text-[#3C3C3C] dark:text-stone-50 mb-3"
                    style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
                  >
                    Study daily. Level up.
                  </h3>
                  <ul className="space-y-2">
                    {[
                      'Daily Review — personalised practice every day',
                      'XP & 100 levels — from Seedling to Grandmaster',
                      'Streaks — track your daily consistency',
                      '80+ badges — unlock achievements as you learn',
                      'Crater Blast & Word Tower — quiz arcade games',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2 text-[14px] text-stone-700 dark:text-stone-300">
                        <svg className="w-4 h-4 mt-0.5 shrink-0 text-[#58CC02] dark:text-[#58CC02]" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6 7.7 9.3a1 1 0 00-1.4 1.4l2 2a1 1 0 001.4 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* "vs alternatives" footer strip */}
            <div className="mt-10 sm:mt-12 rounded-2xl border-2 border-b-4 border-[#E5E5E5] dark:border-stone-700/60 bg-white dark:bg-stone-900 p-5 sm:p-6 max-w-4xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400 mb-1.5">
                    The math
                  </p>
                  <p className="text-[15px] sm:text-base text-stone-800 dark:text-stone-100 leading-snug">
                    <span className="font-semibold">Quizlet + ChatGPT + Grammarly + a citation generator</span>{' '}
                    <span className="text-stone-500 dark:text-stone-400">≈ $40–60/mo combined.</span>
                  </p>
                  <p className="mt-1 text-[15px] sm:text-base text-stone-800 dark:text-stone-100 leading-snug">
                    <span className="font-extrabold text-[#58CC02] dark:text-[#58CC02]">WriteScholar Pro</span>{' '}
                    <span className="text-stone-500 dark:text-stone-400">covers all of that — </span>
                    <span className="font-semibold">$19.99/mo.</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('signup')}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[#58CC02] text-white font-extrabold text-sm border-2 border-b-4 border-[#46A302] hover:bg-[#46A302] active:border-b-2 active:translate-y-0.5 transition-all whitespace-nowrap"
                >
                  Try free for 7 days
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            </div>
          </LandingScrollReveal>
        </div>
      </section>

      {/* Pricing — above FAQ, aligned with Pricing page */}
      <section className="relative py-16 sm:py-24 overflow-hidden border-t border-stone-200/90 dark:border-stone-800" aria-labelledby="landing-pricing-heading">
        <div className="absolute inset-0 bg-[#f8fafc] dark:bg-[#0c0a09]" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-b from-[#f1f5f9] via-white to-[#f8fafc] dark:from-stone-950 dark:via-stone-950 dark:to-stone-900 pointer-events-none" aria-hidden />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_85%_55%_at_50%_-12%,rgba(91,33,182,0.08),transparent_55%)] dark:bg-[radial-gradient(ellipse_85%_50%_at_50%_-8%,rgba(109,40,217,0.12),transparent_58%)] pointer-events-none" aria-hidden />
        <div
          className="absolute inset-0 opacity-[0.4] dark:opacity-[0.15] pointer-events-none bg-[length:32px_32px] bg-[linear-gradient(to_right,rgba(148,163,184,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.07)_1px,transparent_1px)]"
          aria-hidden
        />
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <LandingScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
            <p className="text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.22em] text-[#FF9600] dark:text-[#FF9600] mb-3">
              Pricing
            </p>
            <div className="mx-auto mb-4 h-1 w-16 rounded-full bg-[#58CC02]" aria-hidden />
            <h2
              id="landing-pricing-heading"
              className="text-2xl sm:text-3xl lg:text-[2.35rem] font-extrabold text-[#3C3C3C] dark:text-stone-100 mb-4 tracking-tight leading-tight"
              style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
            >
              Simple, transparent pricing
            </h2>
            <p className="text-base sm:text-lg text-stone-600 dark:text-stone-400 leading-relaxed">
              Start free, upgrade when you need more analyses, citations, and study tools.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
            <div className="rounded-2xl border-2 border-b-4 border-[#E5E5E5] dark:border-stone-700 bg-white dark:bg-stone-900 p-6 sm:p-8 flex flex-col">
              <h3 className="font-semibold text-xl text-stone-900 dark:text-stone-100 mb-1">Free</h3>
              <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">Perfect for getting started</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-stone-900 dark:text-stone-50">$0</span>
                <span className="text-stone-500 dark:text-stone-400 ml-1">/month</span>
              </div>
              <ul className="space-y-2.5 mb-8 flex-1 text-sm sm:text-[0.9375rem] text-stone-600 dark:text-stone-400">
                <li className="flex gap-2">
                  <svg className="w-5 h-5 flex-shrink-0 text-[#58CC02] dark:text-[#58CC02] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>3 documents, 2 analyses, 2 study packs per month</span>
                </li>
                <li className="flex gap-2">
                  <svg className="w-5 h-5 flex-shrink-0 text-[#58CC02] dark:text-[#58CC02] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>5,000 words Paper Summarizer, 2 citation searches</span>
                </li>
                <li className="flex gap-2">
                  <svg className="w-5 h-5 flex-shrink-0 text-[#58CC02] dark:text-[#58CC02] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Focus Mode (3 blocked sites)</span>
                </li>
                <li className="flex gap-2">
                  <svg className="w-5 h-5 flex-shrink-0 text-[#58CC02] dark:text-[#58CC02] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Basic grammar and citation styles</span>
                </li>
              </ul>
              <button
                type="button"
                onClick={() => onNavigate('signup')}
                className="w-full py-3 px-6 rounded-2xl font-extrabold bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 text-[#3C3C3C] dark:text-stone-100 transition-colors border-2 border-b-4 border-[#E5E5E5] dark:border-stone-600 active:border-b-2 active:translate-y-0.5"
              >
                Start free
              </button>
            </div>

            <div className="relative rounded-2xl border-2 border-b-4 border-[#46A302] bg-white dark:bg-stone-900 p-6 sm:p-8 flex flex-col">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-[#58CC02] text-white px-3 py-1 rounded-full text-xs font-extrabold border-2 border-[#46A302]">
                  Most popular
                </span>
              </div>
              <h3 className="font-semibold text-xl text-stone-900 dark:text-stone-100 mb-1 pt-1">Pro</h3>
              <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">Most popular for students</p>
              <div className="mb-1 flex flex-col items-start">
                <div className="flex items-baseline flex-wrap gap-x-2 gap-y-1">
                  <span className="text-4xl font-bold text-stone-900 dark:text-stone-50">$19.99</span>
                  <span className="text-stone-500 dark:text-stone-400 text-sm">/month</span>
                </div>
                <span className="text-xs text-stone-500 dark:text-stone-500 mt-1">or $199.99/year (save 17%)</span>
              </div>
              <ul className="space-y-2.5 mb-8 mt-5 flex-1 text-sm sm:text-[0.9375rem] text-stone-600 dark:text-stone-400">
                <li className="flex gap-2">
                  <svg className="w-5 h-5 flex-shrink-0 text-[#58CC02] dark:text-[#58CC02] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>99 combined analyses, study packs &amp; citations/mo</span>
                </li>
                <li className="flex gap-2">
                  <svg className="w-5 h-5 flex-shrink-0 text-[#58CC02] dark:text-[#58CC02] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>999,999 words Paper Summarizer; uploads up to 100MB</span>
                </li>
                <li className="flex gap-2">
                  <svg className="w-5 h-5 flex-shrink-0 text-[#58CC02] dark:text-[#58CC02] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Quiz, flashcards, crossword, Crater Blast &amp; Word Tower</span>
                </li>
                <li className="flex gap-2">
                  <svg className="w-5 h-5 flex-shrink-0 text-[#58CC02] dark:text-[#58CC02] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>All citation styles, PDF/Word export, unlimited Focus Mode sites</span>
                </li>
                <li className="flex gap-2">
                  <svg className="w-5 h-5 flex-shrink-0 text-[#58CC02] dark:text-[#58CC02] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Apply WriteScholar revisions into your draft</span>
                </li>
              </ul>
              <button
                type="button"
                onClick={() => onNavigate('pricing')}
                className="w-full py-3 px-6 rounded-2xl font-extrabold bg-[#58CC02] hover:bg-[#46A302] text-white border-2 border-b-4 border-[#46A302] active:border-b-2 active:translate-y-0.5 transition-colors"
              >
                View Pro pricing
              </button>
            </div>

            <div className="relative rounded-2xl border-2 border-b-4 border-[#D97F00] bg-[#FFF4E0]/50 dark:bg-[#FF9600]/10 p-6 sm:p-8 flex flex-col sm:col-span-2 lg:col-span-1">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-[#FF9600] text-white px-3 py-1 rounded-full text-xs font-extrabold border-2 border-[#D97F00]">
                  5× usage
                </span>
              </div>
              <h3 className="font-semibold text-xl text-stone-900 dark:text-stone-100 mb-1 pt-1">Premium</h3>
              <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">Heavy essays &amp; citations</p>
              <div className="mb-1 flex flex-col items-start">
                <div className="flex items-baseline flex-wrap gap-x-2 gap-y-1">
                  <span className="text-4xl font-bold text-stone-900 dark:text-stone-50">$39.99</span>
                  <span className="text-stone-500 dark:text-stone-400 text-sm">/month</span>
                </div>
                <span className="text-xs text-stone-500 dark:text-stone-500 mt-1">or $399.99/year (save 17%)</span>
              </div>
              <ul className="space-y-2.5 mb-8 mt-5 flex-1 text-sm sm:text-[0.9375rem] text-stone-600 dark:text-stone-400">
                <li className="flex gap-2">
                  <svg className="w-5 h-5 flex-shrink-0 text-[#FF9600] dark:text-[#FF9600] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Everything in Pro</span>
                </li>
                <li className="flex gap-2">
                  <svg className="w-5 h-5 flex-shrink-0 text-[#FF9600] dark:text-[#FF9600] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>499 combined analyses, study packs &amp; citations/mo—ideal for citation-heavy work</span>
                </li>
                <li className="flex gap-2">
                  <svg className="w-5 h-5 flex-shrink-0 text-[#FF9600] dark:text-[#FF9600] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Summarise unlimited research papers; 1GB library storage</span>
                </li>
              </ul>
              <button
                type="button"
                onClick={() => onNavigate('pricing')}
                className="w-full py-3 px-6 rounded-2xl font-extrabold bg-[#FF9600] hover:bg-[#D97F00] text-white border-2 border-b-4 border-[#D97F00] active:border-b-2 active:translate-y-0.5 transition-colors"
              >
                View Premium pricing
              </button>
            </div>
          </div>

          <p className="text-center text-sm text-stone-500 dark:text-stone-500 mt-8 max-w-xl mx-auto">
            Eligible accounts can start a 7-day Pro or Premium trial; monthly or yearly billing after that.{' '}
            <button
              type="button"
              onClick={() => onNavigate('pricing')}
              className="text-[#1CB0F6] dark:text-[#1CB0F6] font-extrabold underline underline-offset-2 hover:text-[#1899D6] dark:hover:text-[#1899D6]"
            >
              Full pricing &amp; billing options
            </button>
          </p>
          </LandingScrollReveal>
        </div>
      </section>

      {/* FAQ — matches hero editorial theme */}
      <section className="relative py-16 sm:py-24 overflow-hidden border-t border-stone-200/90 dark:border-stone-800">
        <div className="absolute inset-0 bg-[#f8fafc] dark:bg-[#0c0a09]" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-b from-white via-[#f8fafc] to-[#f1f5f9] dark:from-stone-950 dark:via-stone-950 dark:to-stone-950 pointer-events-none" aria-hidden />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-15%,rgba(91,33,182,0.07),transparent_55%)] dark:bg-[radial-gradient(ellipse_90%_55%_at_50%_-10%,rgba(109,40,217,0.12),transparent_58%)] pointer-events-none" aria-hidden />
        <div
          className="absolute inset-0 opacity-[0.4] dark:opacity-[0.15] pointer-events-none bg-[length:32px_32px] bg-[linear-gradient(to_right,rgba(148,163,184,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.07)_1px,transparent_1px)]"
          aria-hidden
        />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <LandingScrollReveal>
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8 lg:gap-10 mb-10 sm:mb-14">
            <div className="text-center lg:text-left flex-1 max-w-2xl mx-auto lg:mx-0">
              <p className="text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.22em] text-[#1CB0F6] dark:text-[#1CB0F6] mb-3">
                Help
              </p>
              <div className="mx-auto lg:mx-0 mb-4 h-1 w-16 rounded-full bg-[#1CB0F6]" aria-hidden />
              <h2
                className="text-2xl sm:text-3xl lg:text-[2.35rem] font-extrabold text-[#3C3C3C] dark:text-stone-100 mb-4 tracking-tight leading-tight"
                style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
              >
                Frequently Asked Questions
              </h2>
              <p className="text-base sm:text-lg text-stone-600 dark:text-stone-400 leading-relaxed">
                Essay feedback, citations, and study tools for college and university coursework.
              </p>
            </div>
            <div className="hidden lg:flex flex-shrink-0 items-center justify-center pt-1">
              {/* Animated thinking mascot — "Scholar pondering your question" */}
              <img
                src="/mascot-thinking.webp"
                alt=""
                aria-hidden
                loading="lazy"
                decoding="async"
                className="w-40 xl:w-48 h-auto drop-shadow-[0_18px_30px_rgba(124,58,237,0.40)]"
              />
            </div>
          </div>

          <div className="max-w-3xl mx-auto space-y-3 sm:space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl border-2 border-b-4 border-[#E5E5E5] dark:border-stone-700 bg-white dark:bg-stone-900 overflow-hidden transition-all duration-200 hover:border-[#1899D6] dark:hover:border-[#1899D6]"
              >
                <button
                  type="button"
                  onClick={() => setOpenFAQ(openFAQ === idx ? null : idx)}
                  className="w-full min-w-0 px-5 sm:px-6 py-4 sm:py-5 text-left flex items-center justify-between gap-3 sm:gap-4 hover:bg-stone-50/90 dark:hover:bg-stone-800/50 transition-colors duration-200"
                >
                  <span className="font-semibold text-stone-900 dark:text-stone-100 text-base sm:text-[1.05rem] leading-snug pr-2 min-w-0 flex-1 text-left">{faq.question}</span>
                  <svg
                    className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${openFAQ === idx ? 'rotate-180 text-[#1CB0F6] dark:text-[#1CB0F6]' : 'text-stone-400 dark:text-stone-500'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ease-out ${openFAQ === idx ? 'max-h-[min(28rem,70vh)]' : 'max-h-0'}`}>
                  <div className="px-5 sm:px-6 pb-5 pt-0 text-stone-600 dark:text-stone-400 text-sm sm:text-base leading-relaxed border-t border-stone-100/90 dark:border-stone-800/80">
                    <div className="pt-4">{faq.answer}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          </LandingScrollReveal>
        </div>
      </section>

      {/* Final CTA — gradient hero panel with dancing mascot to close the deal */}
      <section className="relative py-16 sm:py-24 overflow-hidden border-t border-stone-200/90 dark:border-stone-800">
        <div className="absolute inset-0 bg-[#f8fafc] dark:bg-[#0c0a09]" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-b from-[#f1f5f9] via-white to-[#f8fafc] dark:from-stone-950 dark:via-stone-950 dark:to-stone-900 pointer-events-none" aria-hidden />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_20%,rgba(91,33,182,0.06),transparent_50%)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_15%,rgba(109,40,217,0.1),transparent_55%)] pointer-events-none" aria-hidden />
        <div
          className="absolute inset-0 opacity-[0.35] dark:opacity-[0.12] pointer-events-none bg-[length:32px_32px] bg-[linear-gradient(to_right,rgba(148,163,184,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.07)_1px,transparent_1px)]"
          aria-hidden
        />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <LandingScrollReveal>
          <div className="relative text-center rounded-2xl bg-[#A560E8] dark:bg-[#A560E8] px-6 py-10 sm:px-10 sm:py-14 border-2 border-b-4 border-[#8A48C7] overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(255,255,255,0.12),transparent_70%)]" aria-hidden />
            <div className="pointer-events-none absolute -bottom-16 -right-12 w-56 h-56 rounded-full bg-[#8A48C7]/30 blur-3xl" aria-hidden />
            <div className="pointer-events-none absolute -top-12 -left-10 w-48 h-48 rounded-full bg-[#A560E8]/30 blur-3xl" aria-hidden />

            {/* Dancing mascot — top-right corner */}
            <img
              src="/mascot-dance.webp"
              alt=""
              aria-hidden
              loading="lazy"
              decoding="async"
              className="hidden md:block pointer-events-none absolute -top-2 -right-3 w-32 lg:w-36 h-auto z-10 drop-shadow-[0_18px_30px_rgba(0,0,0,0.35)]"
            />

            <p className="relative text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.22em] text-white/90 mb-3">
              ⚡ Ready when you are
            </p>
            <h2
              className="relative text-2xl sm:text-3xl lg:text-[2.5rem] font-extrabold text-white mb-4 tracking-tight leading-[1.1]"
              style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
            >
              Better essays. Smarter studying.{' '}
              <span className="block sm:inline">All in one app.</span>
            </h2>
            <p className="relative text-base sm:text-lg text-white/90 mb-8 max-w-xl mx-auto leading-relaxed">
              Join <span className="font-extrabold text-white">50,000+ students</span> earning XP, levelling up, and acing their coursework. 7-day free trial — no payment today.
            </p>
            <div className="relative flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center mb-6">
              <button
                type="button"
                onClick={() => onNavigate('signup')}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-[#3C3C3C] font-extrabold rounded-2xl border-2 border-b-4 border-[#E5E5E5] hover:bg-stone-50 active:border-b-2 active:translate-y-0.5 transition-all text-base sm:text-[17px]"
              >
                Start my 7-day free trial
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('pricing')}
                className="inline-flex items-center justify-center px-7 py-4 border-2 border-b-4 border-white/40 text-white font-extrabold rounded-2xl hover:bg-white/10 active:border-b-2 active:translate-y-0.5 transition-colors text-base"
              >
                View pricing
              </button>
            </div>

            {/* Trust badges row */}
            <div className="relative flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px] sm:text-xs text-white/85">
              <span className="inline-flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6 7.7 9.3a1 1 0 00-1.4 1.4l2 2a1 1 0 001.4 0l4-4z" clipRule="evenodd" />
                </svg>
                No payment today
              </span>
              <span className="text-white/30" aria-hidden>·</span>
              <span className="inline-flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6 7.7 9.3a1 1 0 00-1.4 1.4l2 2a1 1 0 001.4 0l4-4z" clipRule="evenodd" />
                </svg>
                Cancel anytime
              </span>
              <span className="text-white/30" aria-hidden>·</span>
              <span className="inline-flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m0 4h.01M5 11h14a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2zm10-4V7a3 3 0 00-6 0v4" />
                </svg>
                Secure checkout via Stripe
              </span>
            </div>
          </div>
          </LandingScrollReveal>
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
            <p className="text-stone-500 text-center text-sm mb-6">Your essay has been scanned. Here&apos;s a quick preview</p>
            
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
              className="w-full py-3.5 bg-[#58CC02] text-white font-extrabold rounded-2xl border-2 border-b-4 border-[#46A302] active:border-b-2 active:translate-y-0.5 transition-all duration-200 flex items-center justify-center"
                >
              View full analysis (it&apos;s free)
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
                <span className="font-semibold">We&apos;ve pulled together strong, relevant citations</span> for your paper from peer-reviewed journals and academic sources that will strengthen your argument and reference list.
              </p>
        </div>

            <p className="text-stone-500 text-sm text-center mb-6">
              Sign up free to view your full citation list, copy formatted references, and add them to your draft.
            </p>
            
            <button 
              onClick={handleContinueToSignupFromCitations}
              className="w-full py-3.5 bg-[#58CC02] text-white font-extrabold rounded-2xl border-2 border-b-4 border-[#46A302] active:border-b-2 active:translate-y-0.5 transition-all duration-200 flex items-center justify-center"
            >
              See my citations (it&apos;s free)
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
              className="w-full py-3.5 bg-[#58CC02] text-white font-extrabold rounded-2xl border-2 border-b-4 border-[#46A302] active:border-b-2 active:translate-y-0.5 transition-all duration-200 flex items-center justify-center"
            >
              Get my summary (it&apos;s free)
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
                  <p className="text-amber-800 font-semibold text-sm">2 free study packs per month (lesson and flashcards; quiz, crossword, Crater Blast & Word Tower with Pro)</p>
                  <p className="text-amber-600 text-xs mt-0.5">Sign up to unlock Study Tools. Upgrade for unlimited</p>
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
              className="w-full py-3.5 bg-[#FF9600] text-white font-extrabold rounded-2xl border-2 border-b-4 border-[#D97F00] active:border-b-2 active:translate-y-0.5 transition-all duration-200 flex items-center justify-center"
            >
              Sign up to unlock Study Tools (it&apos;s free)
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ─── FLOATING PIP DEMO PLAYER ──────────────────────────────────────
          A picture-in-picture style mini-video that pins to the bottom-right
          of the viewport once the user scrolls past the hero. Three quality
          touches make it feel premium:
            1. Glass-morphism surround (gradient border + backdrop blur)
            2. Animated entrance (slide up + fade) and graceful exit
            3. Sound toggle + close so users always have control
          Dismissal is sticky for the session (sessionStorage) so it never
          feels like a popup ad. Hidden on small phones (<480px) where it
          would dominate the viewport. */}
      {!pipDismissed && pipVisible && (
        <div
          role="region"
          aria-label="Product demo video"
          className={`fixed z-[60] transition-all duration-500 ease-out
            ${pipVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}
            ${pipExpanded
              ? 'bottom-4 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6 w-auto sm:w-[480px] lg:w-[560px]'
              : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[280px] sm:w-[320px]'}
          `}
          style={{
            animation: 'pipSlideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
        >
          {/* Soft glow ring behind the card for that "premium product demo" feel */}
          <div
            className="absolute -inset-1.5 rounded-3xl bg-gradient-to-br from-[#A560E8]/40 via-[#1CB0F6]/30 to-[#58CC02]/30 blur-xl opacity-70 pointer-events-none"
            aria-hidden
          />

          <div className="relative rounded-2xl overflow-hidden border-2 border-b-4 border-[#8A48C7] dark:border-[#8A48C7] shadow-2xl bg-white dark:bg-stone-900 backdrop-blur">
            {/* Top chrome bar — gradient with live-dot, title, and controls */}
            <div className="relative flex items-center justify-between px-3 py-2 bg-gradient-to-r from-[#A560E8] via-[#9B55E0] to-[#8A48C7]">
              <div className="flex items-center gap-2 min-w-0">
                <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
                  <span className="absolute inline-flex h-full w-full rounded-full bg-[#FF4B4B] opacity-75 motion-safe:animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FF4B4B]" />
                </span>
                <span className="text-white text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[0.15em] truncate">
                  WriteScholar in 30s
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {/* Mute / Unmute */}
                <button
                  type="button"
                  onClick={() => setPipMuted((m) => !m)}
                  aria-label={pipMuted ? 'Unmute video' : 'Mute video'}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors active:scale-95"
                >
                  {pipMuted ? (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                  )}
                </button>
                {/* Expand / Compact */}
                <button
                  type="button"
                  onClick={() => setPipExpanded((e) => !e)}
                  aria-label={pipExpanded ? 'Make smaller' : 'Make bigger'}
                  className="hidden sm:flex w-7 h-7 items-center justify-center rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors active:scale-95"
                >
                  {pipExpanded ? (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V5a1 1 0 00-1-1H4m11 5V5a1 1 0 011-1h4M9 15v4a1 1 0 01-1 1H4m11-5v4a1 1 0 001 1h4" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                  )}
                </button>
                {/* Close */}
                <button
                  type="button"
                  onClick={handleDismissPip}
                  aria-label="Close demo video"
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/15 hover:bg-[#FF4B4B] text-white transition-colors active:scale-95"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Video itself */}
            <div className="relative bg-black">
              <video
                src="/hero-vid.mp4"
                poster="/hero-vid-poster.jpg"
                autoPlay
                muted={pipMuted}
                loop
                playsInline
                preload="metadata"
                aria-label="WriteScholar walkthrough: a quick screen recording of the full product"
                className="w-full h-auto block"
              />
              {/* Subtle vignette for cinematic feel */}
              <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-black/10 rounded-b-[14px]" aria-hidden />
            </div>

            {/* Footer CTA bar — turns the player into a conversion surface */}
            <button
              type="button"
              onClick={() => onNavigate('signup')}
              className="group/pipcta relative w-full flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gradient-to-r from-[#FFF4E0] via-white to-[#DDF4FF] dark:from-stone-800 dark:via-stone-900 dark:to-stone-800 text-[#3C3C3C] dark:text-stone-100 text-[12px] sm:text-[13px] font-extrabold border-t-2 border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 active:translate-y-[1px] transition-all"
            >
              <span>Start free — get the A</span>
              <svg className="w-4 h-4 text-[#A560E8] group-hover/pipcta:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
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
