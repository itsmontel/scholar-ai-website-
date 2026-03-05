import { useState, useEffect } from 'react';
import Footer from '../common/Footer';
import AnalysisAnimation from '../common/AnalysisAnimation';
import customersImg from '../../assets/images/CustomersWriteScholar.png';

interface LandingPageProps {
  onNavigate: (page: string, slug?: string) => void;
}

const LandingPage = ({ onNavigate }: LandingPageProps) => {
  const [inputText, setInputText] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [mode, setMode] = useState<'analyze' | 'citations' | 'humanize' | 'summarize' | 'quiz'>('analyze');
  const [studyToolMode, setStudyToolMode] = useState<'quiz' | 'flashcards' | 'crossword'>('quiz');
  const [citationStyle, setCitationStyle] = useState('APA');
  const [citationYearRange, setCitationYearRange] = useState('all');
  const [showFakeAnimation, setShowFakeAnimation] = useState(false);
  const [showFakeResults, setShowFakeResults] = useState(false);
  const [showFakeCitationResults, setShowFakeCitationResults] = useState(false);
  const [showFakeHumanizeResults, setShowFakeHumanizeResults] = useState(false);
  const [showFakeSummaryResults, setShowFakeSummaryResults] = useState(false);
  const [showFakeQuizResults, setShowFakeQuizResults] = useState(false);
  const [humanizeMode, setHumanizeMode] = useState<'standard' | 'academic' | 'casual' | 'creative'>('standard');
  const [humanizeIntensity, setHumanizeIntensity] = useState<'light' | 'medium' | 'aggressive'>('medium');
  const [summaryStyle, setSummaryStyle] = useState<'bullet' | 'paragraph' | 'tldr' | 'detailed'>('bullet');
  const [summaryLength, setSummaryLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [quizType, setQuizType] = useState<'mixed' | 'multiple_choice' | 'true_false' | 'fill_blank'>('mixed');
  const [quizDifficulty, setQuizDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [quizQuestionCount, setQuizQuestionCount] = useState(10);
  const [flashcardCount, setFlashcardCount] = useState(15);
  const [crosswordWordCount, setCrosswordWordCount] = useState(10);
  const [activeToolHover, setActiveToolHover] = useState<string | null>(null);
  const [activeHelpCategory, setActiveHelpCategory] = useState('essays');

  const helpCategories = [
    {
      id: 'essays',
      label: 'Essays',
      title: 'Essays',
      description: 'Build a clear structure, develop strong arguments, and craft compelling conclusions. WriteScholar helps you maintain academic tone while ensuring your ideas shine through with clarity and precision.'
    },
    {
      id: 'research',
      label: 'Research Papers',
      title: 'Research Papers',
      description: 'Organize your methodology, strengthen your literature review, and present findings with impact. Get AI-powered feedback on academic conventions and citation accuracy.'
    },
    {
      id: 'thesis',
      label: 'Thesis Writing',
      title: 'Thesis Writing',
      description: 'Structure your thesis chapters effectively, maintain consistency throughout, and ensure your argument flows logically from introduction to conclusion.'
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

  const humanizePlaceholders = [
    "Paste your AI-generated text here to humanize it...",
    "Transform your text into natural human writing...",
    "Make AI text undetectable — paste it here..."
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

  const placeholders = mode === 'humanize' ? humanizePlaceholders
    : mode === 'summarize' ? summarizePlaceholders
    : mode === 'quiz' ? getStudyToolPlaceholders()
    : mode === 'analyze' ? analyzePlaceholders
    : citationPlaceholders;

  const suggestedTopics = mode === 'humanize' ? [] : mode === 'analyze' ? [
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

  const sidebarTools = [
    { id: 'grammar', name: 'Grammar Checker', icon: 'A', color: 'text-red-500', bg: 'bg-red-50' },
    { id: 'structure', name: 'Structure Analysis', icon: '◎', color: 'text-lime-600', bg: 'bg-lime-50' },
    { id: 'citations', name: 'Citation Checker', icon: '99', color: 'text-purple-500', bg: 'bg-purple-50' },
    { id: 'tone', name: 'Academic Tone', icon: '≡', color: 'text-green-500', bg: 'bg-green-50' },
    { id: 'clarity', name: 'Clarity Feedback', icon: '◇', color: 'text-orange-500', bg: 'bg-orange-50' },
    { id: 'sources', name: 'Source Finder', icon: '⌕', color: 'text-lime-600', bg: 'bg-lime-50' }
  ];

  const faqs = [
    {
      question: "What is the AI Humanizer and how does it work?",
      answer: "The AI Humanizer transforms text from ChatGPT, Claude, Gemini, and other AI models into natural human-sounding writing. It bypasses AI detection tools like Turnitin and GPTZero while preserving your original meaning. Free users get 1,000 words/month."
    },
    {
      question: "Can I create study quizzes from my notes?",
      answer: "Yes! The Quiz Generator turns any text into interactive quizzes with multiple choice and true/false questions. Paste your study notes, textbook chapters, or articles and get instant quizzes. Free users get 3 quizzes/month; paid plans have unlimited."
    },
    {
      question: "How does the Paper Summarizer work?",
      answer: "Paste any research paper, article, or document and get concise summaries as bullet points or paragraphs. Choose short, medium, or detailed formats. Perfect for literature reviews and exam prep."
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
      question: "What's the difference between Free, Starter, and Premium?",
      answer: "Free includes 3 documents, 3 essay analyses, 3 study tool generations (quiz/flashcards/crossword), and 1,000 Humanizer/Summarizer words per month. Starter unlocks unlimited study tools, 999 essay analyses, 999,999 Humanizer/Summarizer words, all citation styles, and PDF/Word export. Premium adds our top-tier premium AI model, all quiz types and difficulty levels, all summarizer styles and lengths, advanced essay analysis, and priority support."
    }
  ];

  const universities = [
    { name: 'Harvard', className: 'university-harvard' },
    { name: 'Yale', className: 'university-yale' },
    { name: 'Stanford', className: 'university-stanford' },
    { name: 'MIT', className: 'university-mit' },
    { name: 'Oxford', className: 'university-oxford' },
    { name: 'Cambridge', className: 'university-cambridge' },
    { name: 'Princeton', className: 'university-princeton' }
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
    if (mode === 'humanize') {
      localStorage.setItem('pendingHumanize', JSON.stringify({
        text: inputText,
        mode: humanizeMode,
        intensity: humanizeIntensity
      }));
      setTimeout(() => {
        setShowFakeAnimation(false);
        setShowFakeHumanizeResults(true);
      }, 8000);
    } else if (mode === 'citations') {
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
    setShowFakeHumanizeResults(false);
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


  // Mode-specific hero headlines with topic colors
  const getHeroHeadline = () => {
    if (mode === 'analyze') return <>Your essay — improved with <span style={{ color: '#7ab308' }}>AI assistance</span></>;
    if (mode === 'citations') return <>Find <span style={{ color: '#22A7AB' }}>academic citations</span> instantly</>;
    if (mode === 'humanize') return <>Make AI text <span style={{ color: '#9B59B6' }}>undetectable</span></>;
    if (mode === 'summarize') return <>Summarize <span style={{ color: '#28B463' }}>any document</span></>;
    if (mode === 'quiz') {
      if (studyToolMode === 'flashcards') return <>Generate <span style={{ color: '#D35400' }}>flashcards</span></>;
      if (studyToolMode === 'crossword') return <>Generate a <span style={{ color: '#D35400' }}>crossword puzzle</span></>;
      return <>Generate <span style={{ color: '#D35400' }}>quiz questions</span></>;
    }
    return <>Your essay — improved with <span style={{ color: '#7ab308' }}>AI assistance</span></>;
  };

  return (
    <main className="min-h-screen" style={{ background: '#FAF8F5' }} role="main">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-md border-b border-stone-200/60" style={{ background: 'rgba(250, 248, 245, 0.95)' }} aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18 py-4">
            <a href="/" onClick={(e) => { e.preventDefault(); onNavigate('landing'); }} className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#262626' }}>
                <span className="font-bold text-xl" style={{ color: '#a3e635' }}>W</span>
              </div>
              <span className="text-2xl font-bold text-stone-800">WriteScholar</span>
            </a>
            
            <div className="hidden md:flex items-center space-x-2">
              <a href="/features" onClick={(e) => { e.preventDefault(); onNavigate('features'); }} className="px-4 py-2.5 text-base text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-100/50 transition-colors font-medium">Features</a>
              <a href="/pricing" onClick={(e) => { e.preventDefault(); onNavigate('pricing'); }} className="px-4 py-2.5 text-base text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-100/50 transition-colors font-medium">Pricing</a>
              <a href="/why-students-choose" onClick={(e) => { e.preventDefault(); onNavigate('why-students-choose'); }} className="px-4 py-2.5 text-base text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-100/50 transition-colors font-medium">Why Students Choose</a>
              <a href="/blog" onClick={(e) => { e.preventDefault(); onNavigate('blog'); }} className="px-4 py-2.5 text-base text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-100/50 transition-colors font-medium">Blog</a>
              <a href="/about" onClick={(e) => { e.preventDefault(); onNavigate('about'); }} className="px-4 py-2.5 text-base text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-100/50 transition-colors font-medium">About</a>
                    </div>
            
            <div className="flex items-center space-x-3">
              <a href="/login" onClick={(e) => { e.preventDefault(); onNavigate('login'); }} className="hidden sm:inline-flex px-4 py-2.5 text-base text-stone-600 hover:text-stone-900 font-medium rounded-lg hover:bg-stone-100/50 transition-colors">Log in</a>
              <a href="/signup" onClick={(e) => { e.preventDefault(); onNavigate('signup'); }} className="inline-flex items-center px-5 py-2.5 text-stone-900 text-base font-semibold rounded-full hover:opacity-90 hover:shadow-md transition-all duration-200" style={{ background: '#a3e635' }}>
                Try Free
              </a>
                      </div>
                    </div>
                  </div>
      </nav>

      {/* Hero Section with Sidebar */}
      <section className="pt-6 sm:pt-10 lg:pt-12 pb-8 sm:pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-start">
            {/* Desktop Sidebar - aligned with H1, positioned far left with border */}
            <div className="hidden lg:flex flex-col space-y-1 mr-8 xl:mr-12 -ml-8 xl:-ml-16">
              <div className="bg-white border border-stone-200 rounded-2xl p-3 shadow-sm">
                {sidebarTools.map((tool) => (
                  <button 
                    key={tool.id}
                    onMouseEnter={() => setActiveToolHover(tool.id)}
                    onMouseLeave={() => setActiveToolHover(null)}
                    onClick={() => onNavigate('signup')}
                    className={`relative flex flex-col items-center p-3 rounded-xl transition-all w-full ${
                      activeToolHover === tool.id ? 'bg-stone-50 scale-105' : ''
                    }`}
                  >
                    <div className={`w-12 h-12 ${tool.bg} rounded-xl flex items-center justify-center mb-1.5`}>
                      {tool.id === 'sources' ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`w-6 h-6 ${tool.color}`}>
                          <circle cx="11" cy="11" r="8" />
                          <path d="M21 21l-4.35-4.35" />
                      </svg>
                      ) : (
                        <span className={`${tool.color} font-bold ${tool.id === 'tone' || tool.id === 'clarity' ? 'text-lg' : 'text-base'}`}>{tool.icon}</span>
                      )}
                    </div>
                    <span className="text-[11px] text-stone-600 text-center leading-tight max-w-[70px]">{tool.name}</span>
                    
                    {activeToolHover === tool.id && (
                      <div className="absolute left-full ml-3 px-3 py-2 text-white text-sm rounded-lg whitespace-nowrap z-10" style={{ background: '#262626' }}>
                        {tool.name}
                        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent" style={{ borderRightColor: '#262626' }} />
                  </div>
                    )}
                  </button>
                ))}
                    </div>
                  </div>

            {/* Main Content */}
            <div className="flex-1 text-center max-w-4xl mx-auto">
              {/* H1 - mode-specific hero */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-stone-800 tracking-tight leading-tight mb-4 sm:mb-6 font-sans font-normal" style={{ letterSpacing: '-0.01em' }}>
                {getHeroHeadline()}
              </h1>
              
              {/* Subtitle */}
              <p className="text-lg sm:text-xl text-stone-500 mb-6 max-w-2xl mx-auto font-sans">
                Learn, create, and edit with ease — save time for what matters
              </p>

              {/* Mode Toggle - topic colors: Analyze #2E6FEA, Citations #22A7AB, Humanize #9B59B6, Summarize #28B463, Study Tools #D35400 */}
              <div className="flex justify-center mb-5">
                <div className="inline-flex flex-wrap justify-center bg-stone-100 rounded-full p-1.5 shadow-sm gap-1">
                  <button
                    onClick={() => { setMode('analyze'); setInputText(''); }}
                    className={`px-5 sm:px-6 py-2.5 rounded-full text-base font-medium transition-all ${
                      mode === 'analyze' ? 'bg-white shadow-sm border' : ''
                    }`}
                    style={mode === 'analyze' ? { color: '#7ab308', borderColor: '#a3e635' } : { color: '#7ab308' }}
                  >
                    Analyze Essay
                  </button>
                  <button
                    onClick={() => { setMode('citations'); setInputText(''); }}
                    className={`px-5 sm:px-6 py-2.5 rounded-full text-base font-medium transition-all ${
                      mode === 'citations' ? 'bg-white shadow-sm border' : ''
                    }`}
                    style={mode === 'citations' ? { color: '#22A7AB', borderColor: '#A7F3F5' } : { color: '#22A7AB' }}
                  >
                    Find Citations
                  </button>
                  <button
                    onClick={() => { setMode('humanize'); setInputText(''); }}
                    className={`px-5 sm:px-6 py-2.5 rounded-full text-base font-medium transition-all relative ${
                      mode === 'humanize' ? 'bg-white shadow-sm border' : ''
                    }`}
                    style={mode === 'humanize' ? { color: '#9B59B6', borderColor: '#E8DAEF' } : { color: '#9B59B6' }}
                  >
                    Humanize
                    <span className="absolute -top-2 -right-1 px-1.5 py-0.5 text-white text-[10px] font-bold rounded-full leading-none" style={{ backgroundColor: '#9B59B6' }}>PRO</span>
                  </button>
                  <button
                    onClick={() => { setMode('summarize'); setInputText(''); }}
                    className={`px-5 sm:px-6 py-2.5 rounded-full text-base font-medium transition-all ${
                      mode === 'summarize' ? 'bg-white shadow-sm border' : ''
                    }`}
                    style={mode === 'summarize' ? { color: '#28B463', borderColor: '#ABEBC6' } : { color: '#28B463' }}
                  >
                    Summarize
                  </button>
                  <button
                    onClick={() => { setMode('quiz'); setInputText(''); }}
                    className={`px-5 sm:px-6 py-2.5 rounded-full text-base font-semibold transition-all relative ${
                      mode === 'quiz' ? 'bg-white shadow-md border-2 ring-2 ring-orange-200/50' : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg hover:shadow-xl hover:from-orange-600 hover:to-amber-600'
                    }`}
                    style={mode === 'quiz' ? { color: '#D35400', borderColor: '#FADBD8' } : {}}
                  >
                    Study Tools
                    <span className="absolute -top-2 -right-1 px-1.5 py-0.5 text-white text-[10px] font-bold rounded-full leading-none" style={{ backgroundColor: '#D35400' }}>PRO</span>
                  </button>
                </div>
              </div>

              {/* Citation Options (citations mode only) */}
            {mode === 'citations' && (
              <div className="flex justify-center mb-4">
                  <div className="inline-flex items-center gap-3 flex-wrap justify-center">
                    {/* Citation Style */}
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
                    
                    {/* Year Range */}
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
            )}

              {/* HUMANIZE MODE - Split Panel Design */}
            {mode === 'humanize' && (
              <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-violet-100/50 border border-violet-100 overflow-hidden mb-6">
                {/* Toolbar */}
                <div className="bg-gradient-to-r from-violet-50 to-purple-50 border-b border-violet-100 px-3 sm:px-5 py-3 sm:py-4">
                  <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 overflow-x-auto sm:overflow-visible">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                        <span className="text-xs font-medium text-stone-500 flex-shrink-0">Mode:</span>
                        <div className="flex items-center bg-white rounded-xl px-0.5 sm:px-1 py-1 shadow-sm border border-stone-200">
                          {(['standard', 'academic', 'casual', 'creative'] as const).map((m) => (
                            <button
                              key={m}
                              onClick={() => setHumanizeMode(m)}
                              className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                                humanizeMode === m ? 'bg-violet-600 text-white shadow-sm' : 'text-stone-600 hover:text-stone-800 hover:bg-stone-50'
                              }`}
                            >
                              {m.charAt(0).toUpperCase() + m.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                        <span className="text-xs font-medium text-stone-500 flex-shrink-0">Intensity:</span>
                        <div className="flex items-center bg-white rounded-xl px-0.5 sm:px-1 py-1 shadow-sm border border-stone-200">
                          {([
                            { id: 'light', label: 'Light' },
                            { id: 'medium', label: 'Medium' },
                            { id: 'aggressive', label: 'Heavy' }
                          ] as const).map((intensity) => (
                            <button
                              key={intensity.id}
                              onClick={() => setHumanizeIntensity(intensity.id)}
                              className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                                humanizeIntensity === intensity.id ? 'bg-violet-600 text-white shadow-sm' : 'text-stone-600 hover:text-stone-800 hover:bg-stone-50'
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
                      disabled={!inputText.trim()}
                      className={`w-full sm:w-auto px-6 py-2.5 rounded-xl flex items-center justify-center transition-all font-semibold text-sm flex-shrink-0 ${
                        inputText.trim()
                          ? 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-200 cursor-pointer'
                          : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                      }`}
                    >
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Free humanise
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
                      <button onClick={() => navigator.clipboard.readText().then(text => setInputText(text))} className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700 font-medium transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                        Paste
                      </button>
                    </div>
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      placeholder="Transform AI text into natural human writing..."
                      className="w-full min-h-[200px] sm:min-h-[280px] p-3 sm:p-5 text-stone-800 text-[15px] border-none outline-none resize-none bg-transparent placeholder-stone-400 leading-relaxed"
                    />
                    <div className="flex items-center px-3 sm:px-5 py-2.5 sm:py-3 bg-stone-50/30 border-t border-stone-100">
                      <span className="text-xs text-stone-400 font-medium">{inputText.split(/\s+/).filter(Boolean).length} words</span>
                    </div>
                  </div>

                  {/* Right Panel - Humanized */}
                  <div className="flex flex-col bg-gradient-to-br from-violet-50/30 to-purple-50/30">
                    <div className="flex items-center px-3 sm:px-5 py-2.5 sm:py-3 bg-violet-50/50 border-b border-violet-100/50">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-violet-400"></div>
                        <span className="text-xs font-semibold text-violet-600 uppercase tracking-wider">Humanized</span>
                      </div>
                    </div>
                    <div className="flex-1 min-h-[200px] sm:min-h-[280px] flex items-center justify-center p-5">
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-violet-100/50 flex items-center justify-center">
                          <svg className="w-8 h-8 text-violet-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </div>
                        <p className="text-sm text-stone-500">Your humanized text will appear here</p>
                        <p className="text-xs text-stone-400 mt-1">Paste text on the left and click Humanize</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUMMARIZE MODE - Split Panel Design */}
            {mode === 'summarize' && (
              <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-teal-100/50 border border-teal-100 overflow-hidden mb-6">
                {/* Toolbar */}
                <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border-b border-teal-100 px-3 sm:px-5 py-3 sm:py-4">
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
                          ? 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-lg shadow-teal-200 cursor-pointer'
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
                  <div className="flex flex-col bg-gradient-to-br from-teal-50/30 to-emerald-50/30">
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
                      { key: 'crossword' as const, label: 'Crossword', icon: '🧩' },
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
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 px-3 sm:px-5 py-3 sm:py-4">
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
                          ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg shadow-amber-200 cursor-pointer'
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
                
                <div className={`relative bg-white rounded-3xl border shadow-sm transition-all duration-300 ${
                  isFocused
                    ? mode === 'citations' 
                      ? 'border-[#22A7AB]/40 shadow-xl shadow-[#22A7AB]/5 ring-2 ring-[#22A7AB]/20'
                      : 'border-[#2E6FEA]/40 shadow-xl shadow-[#2E6FEA]/5 ring-2 ring-[#2E6FEA]/20'
                    : 'border-stone-200/80 hover:border-stone-300 hover:shadow-md'
                }`}>
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={placeholders[placeholderIndex]}
                    className="w-full min-h-[120px] sm:min-h-[140px] p-5 sm:p-6 text-stone-800 text-lg border-none outline-none resize-none bg-transparent placeholder-stone-400 leading-relaxed"
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
                    className={`px-8 py-3.5 rounded-full flex items-center justify-center transition-all duration-200 font-semibold text-base ${
                      inputText.trim()
                        ? 'bg-lime-400 hover:bg-lime-300 text-stone-900 shadow-lg hover:shadow-xl cursor-pointer'
                        : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                    }`}
                  >
                    {mode === 'analyze' ? 'Get free feedback' : 'Find sources for free'}
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
            
              {/* Suggested Topics - only for citations mode */}
              {mode === 'citations' && (
                <div className="mb-10">
                  <p className="text-sm text-stone-500 mb-4">Suggested topics</p>
                  <div className="flex flex-wrap justify-center gap-2.5">
                    {suggestedTopics.map((topic, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleTopicClick(topic)}
                        className="px-4 py-2 bg-white hover:bg-stone-50 text-stone-700 text-sm sm:text-base rounded-lg border border-stone-200 hover:border-stone-300 transition-all duration-200 hover:shadow-sm text-left"
                      >
                        {topic}
                    </button>
                    ))}
              </div>
            </div>
              )}
          </div>
        </div>
            </div>
      </section>

      {/* Trusted by Universities - Animated Carousel */}
      <section className="py-16 sm:py-20 border-y border-stone-200/60 overflow-hidden" style={{ background: '#F7F5F2' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-6 mb-12">
            <img src={customersImg} alt="WriteScholar customers" className="h-14 sm:h-20 object-contain" />
            <p className="text-stone-500 text-base sm:text-lg font-medium">Trusted by students around the world</p>
          </div>
          <div className="relative">
            <div className="flex w-max animate-scroll-slow">
                {/* Three sets of universities for seamless loop and faster-feeling scroll */}
              {universities.map((uni, idx) => (
                <div key={`first-${idx}`} className="flex-shrink-0 mx-10 sm:mx-16">
                  <span className={`text-xl sm:text-2xl md:text-3xl ${uni.className}`}>{uni.name}</span>
                  </div>
              ))}
              {universities.map((uni, idx) => (
                <div key={`second-${idx}`} className="flex-shrink-0 mx-10 sm:mx-16">
                  <span className={`text-xl sm:text-2xl md:text-3xl ${uni.className}`}>{uni.name}</span>
                  </div>
              ))}
              {universities.map((uni, idx) => (
                <div key={`third-${idx}`} className="flex-shrink-0 mx-10 sm:mx-16">
                  <span className={`text-xl sm:text-2xl md:text-3xl ${uni.className}`}>{uni.name}</span>
                  </div>
              ))}
                  </div>
                  </div>
                  </div>
      </section>

      {/* Your uniqueness in each step - Aithor style feature section */}
      <section className="py-20" style={{ background: '#FAF8F5' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl text-stone-800 text-center mb-14 font-sans font-normal">
            Your toolkit in each step
          </h2>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Essay Analyzer */}
            <button 
              onClick={() => onNavigate('signup')}
              className="group bg-white rounded-2xl p-6 text-left border border-stone-200 hover:border-stone-300 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-stone-800 text-lg">Essay Analyzer</h3>
                <svg className="w-5 h-5 text-stone-400 group-hover:text-stone-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <p className="text-stone-500 text-sm leading-relaxed">Get professor-style feedback on structure, clarity, and citations.</p>
            </button>
            
            {/* Citation Finder */}
            <button 
              onClick={() => onNavigate('signup')}
              className="group bg-white rounded-2xl p-6 text-left border border-stone-200 hover:border-stone-300 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-stone-800 text-lg">Citation Finder</h3>
                <svg className="w-5 h-5 text-stone-400 group-hover:text-stone-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <p className="text-stone-500 text-sm leading-relaxed">Search millions of sources with auto-formatted citations.</p>
            </button>
            
            {/* AI Humanizer */}
            <button 
              onClick={() => onNavigate('signup')}
              className="group bg-white rounded-2xl p-6 text-left border border-violet-200 hover:border-violet-300 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-violet-700 text-lg flex items-center gap-2">✨ AI Humanizer</h3>
                <svg className="w-5 h-5 text-violet-400 group-hover:text-violet-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <p className="text-stone-500 text-sm leading-relaxed">Transform AI text into natural, human-sounding writing.</p>
            </button>
            
            {/* Summarizer */}
            <button 
              onClick={() => onNavigate('signup')}
              className="group bg-white rounded-2xl p-6 text-left border border-teal-200 hover:border-teal-300 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-teal-700 text-lg flex items-center gap-2">📝 AI Summarizer</h3>
                <svg className="w-5 h-5 text-teal-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <p className="text-stone-500 text-sm leading-relaxed">Turn long papers into concise bullet points or paragraphs.</p>
            </button>
            
            {/* Quiz Generator */}
            <button 
              onClick={() => onNavigate('signup')}
              className="group bg-white rounded-2xl p-6 text-left border border-amber-200 hover:border-amber-300 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-amber-700 text-lg flex items-center gap-2">📝 Quiz Generator</h3>
                <svg className="w-5 h-5 text-amber-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <p className="text-stone-500 text-sm leading-relaxed">Create quizzes, flashcards, and crosswords from your notes.</p>
            </button>
            
            {/* Pomodoro Timer */}
            <button 
              onClick={() => onNavigate('signup')}
              className="group bg-white rounded-2xl p-6 text-left border border-stone-200 hover:border-stone-300 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-stone-800 text-lg">Pomodoro Timer</h3>
                <svg className="w-5 h-5 text-stone-400 group-hover:text-stone-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <p className="text-stone-500 text-sm leading-relaxed">Stay focused with timed study sessions and breaks.</p>
            </button>
          </div>
        </div>
      </section>

      {/* WriteScholar Can Help You With */}
      <section className="py-20 sm:py-24" style={{ background: '#F0EDE8' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl text-stone-800 text-center mb-10 font-sans font-normal">
            WriteScholar can help you with
          </h2>
          
          {/* Category Tabs */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-12">
            {helpCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveHelpCategory(category.id)}
                className={`px-4 sm:px-6 py-2.5 rounded-full text-sm sm:text-base font-medium transition-all ${
                  activeHelpCategory === category.id
                    ? 'text-white'
                    : 'bg-white text-stone-600 hover:bg-stone-50 border border-stone-200'
                }`}
                style={activeHelpCategory === category.id ? { background: '#262626' } : undefined}
              >
                {category.label}
              </button>
            ))}
                  </div>
                  
          {/* Content Area */}
          <div className="bg-white rounded-3xl p-8 sm:p-12 lg:p-16 border border-stone-200">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              {/* Text Content */}
              <div className="order-2 lg:order-1">
                <h3 className="text-2xl sm:text-3xl font-semibold text-stone-800 mb-4">
                  {helpCategories.find(c => c.id === activeHelpCategory)?.title}
                </h3>
                <p className="text-stone-600 text-lg leading-relaxed mb-8">
                  {helpCategories.find(c => c.id === activeHelpCategory)?.description}
                </p>
                <button
                  onClick={() => onNavigate('signup')}
                  className="inline-flex items-center px-6 py-3 text-stone-900 font-semibold rounded-full hover:opacity-90 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200"
                  style={{ background: '#a3e635' }}
                >
                  Start for free
                </button>
                  </div>
                  
              {/* Woman Character Illustration - Different poses for each category */}
              <div className="order-1 lg:order-2 flex justify-center">
                <div className="relative w-64 h-72 sm:w-80 sm:h-96">
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
                  
                  {/* Research Papers - Reading with books around */}
                  {activeHelpCategory === 'research' && (
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
                  
                  {/* Thesis Writing - At whiteboard planning */}
                  {activeHelpCategory === 'thesis' && (
                    <svg viewBox="0 0 320 380" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                      {/* Whiteboard */}
                      <rect x="60" y="50" width="200" height="150" rx="4" fill="white" stroke="#D1D5DB" strokeWidth="3" />
                      <rect x="140" y="200" width="20" height="80" fill="#9CA3AF" />
                      <rect x="120" y="275" width="60" height="10" rx="2" fill="#6B7280" />
                      {/* Mind map on board */}
                      <ellipse cx="160" cy="100" rx="35" ry="20" fill="#EEF2FF" stroke="#6366F1" strokeWidth="2" />
                      <text x="160" y="105" textAnchor="middle" fontSize="12" fill="#6366F1" fontWeight="bold">THESIS</text>
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

      {/* See WriteScholar in Action */}
      <section className="py-20 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl text-stone-800 text-center mb-5" style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 400 }}>
              See WriteScholar in Action
            </h2>
            <p className="text-lg text-stone-500 text-center max-w-2xl mx-auto">
              Real examples of how our AI analyzes and improves academic writing
            </p>
            {/* Man character - presenting the screenshots */}
            <div className="hidden lg:block absolute -right-4 xl:right-8 top-1/2 -translate-y-1/2 w-36 h-40">
              <svg viewBox="-10 0 160 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                {/* Body - blue shirt */}
                <path d="M50 95 Q45 130 50 160 L90 160 Q95 130 90 95" fill="#3B82F6" />
                {/* Neck */}
                <rect x="62" y="70" width="16" height="28" fill="#E8B796" />
                {/* Head */}
                <ellipse cx="70" cy="45" rx="32" ry="35" fill="#E8B796" />
                {/* Hair - short dark hair */}
                <path d="M38 35 Q35 15 50 10 Q70 2 90 10 Q105 15 102 35 Q100 25 85 18 Q70 12 55 18 Q40 25 38 35" fill="#4A3728" />
                <path d="M38 35 Q32 45 38 55" fill="#4A3728" />
                <path d="M102 35 Q108 45 102 55" fill="#4A3728" />
                {/* Eyes */}
                <ellipse cx="56" cy="45" rx="5" ry="6" fill="#1F2937" />
                <ellipse cx="84" cy="45" rx="5" ry="6" fill="#1F2937" />
                <circle cx="57" cy="43" r="2" fill="white" />
                <circle cx="85" cy="43" r="2" fill="white" />
                {/* Eyebrows */}
                <path d="M46 35 Q56 30 66 35" stroke="#4A3728" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <path d="M74 35 Q84 30 94 35" stroke="#4A3728" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                {/* Friendly smile */}
                <path d="M55 62 Q70 75 85 62" stroke="#1F2937" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                {/* Cheeks */}
                <ellipse cx="42" cy="55" rx="6" ry="4" fill="#FECACA" opacity="0.5" />
                <ellipse cx="98" cy="55" rx="6" ry="4" fill="#FECACA" opacity="0.5" />
                {/* Arms - presenting gesture */}
                <path d="M45 100 Q25 90 10 75" stroke="#E8B796" strokeWidth="14" fill="none" strokeLinecap="round" />
                <path d="M95 100 Q115 95 125 85" stroke="#E8B796" strokeWidth="14" fill="none" strokeLinecap="round" />
                {/* Hands */}
                <ellipse cx="8" cy="73" rx="9" ry="10" fill="#E8B796" />
                <ellipse cx="128" cy="83" rx="9" ry="10" fill="#E8B796" />
                {/* Collar */}
                <path d="M58 90 L70 105 L82 90" stroke="#2563EB" strokeWidth="2" fill="none" />
              </svg>
                  </div>
                  </div>
                  
          {/* Screenshot Showcase */}
          <div className="space-y-16">
            {/* Philosophy Essay Example */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className="order-2 lg:order-1">
                <div className="inline-flex items-center px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-4">
                  Philosophy Essay
                        </div>
                <h3 className="text-2xl font-bold text-stone-800 mb-3">Philosophy Essay Analysis</h3>
                <p className="text-stone-600 text-lg leading-relaxed mb-4">
                  See how WriteScholar analyzes a philosophy paper on justice and ethics, providing detailed feedback on argument structure, citation formatting, and academic tone.
                </p>
                <ul className="space-y-2 text-stone-600">
                  <li className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>Strong thesis identification</li>
                  <li className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>APA citation validation</li>
                  <li className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>Areas for improvement highlighted</li>
                </ul>
                           </div>
              <div className="order-1 lg:order-2">
                <div className="rounded-2xl overflow-hidden shadow-2xl border border-stone-200">
                  <img 
                    src="/Philosophy.png" 
                    alt="Philosophy essay analysis showing document feedback with structure analysis, citation checking, and improvement suggestions"
                    className="w-full h-auto"
                  />
                              </div>
                              </div>
                  </div>
                  
            {/* Multicultural Film Paper Example */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className="order-1 lg:order-1">
                <div className="rounded-2xl overflow-hidden shadow-2xl border border-stone-200">
                  <img 
                    src="/Multiculturalfilmpaper.png" 
                    alt="Multicultural film paper analysis showing comprehensive AI feedback on academic writing"
                    className="w-full h-auto"
                          />
                  </div>
                </div>
              <div className="order-2 lg:order-2">
                <div className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4">
                  Film Studies
              </div>
                <h3 className="text-2xl font-bold text-stone-800 mb-3">Film Studies Paper Analysis</h3>
                <p className="text-stone-600 text-lg leading-relaxed mb-4">
                  Watch WriteScholar analyze a multicultural film studies paper, identifying areas for clarity improvement and ensuring proper academic formatting.
                </p>
                <ul className="space-y-2 text-stone-600">
                  <li className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>Paragraph flow analysis</li>
                  <li className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>Grammar improvements</li>
                  <li className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>Detailed suggestions</li>
                </ul>
            </div>
          </div>
        </div>
           </div>
      </section>

      {/* Features Grid - bigger */}
      <section className="py-20 sm:py-24" style={{ background: '#F7F5F2' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative mb-14">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl text-stone-800 text-center mb-5" style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 400 }}>
              Everything You Need for Better Writing
            </h2>
            <p className="text-lg text-stone-500 text-center max-w-2xl mx-auto">
              WriteScholar combines multiple tools to help you write better academic papers
            </p>
            {/* Man character - waving hello */}
            <div className="hidden lg:block absolute -left-16 xl:-left-8 top-1/2 -translate-y-1/2 w-28 h-36">
              <svg viewBox="0 0 140 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                {/* Body - green shirt */}
                <path d="M50 100 Q45 130 50 160 L90 160 Q95 130 90 100" fill="#10B981" />
                {/* Neck */}
                <rect x="62" y="75" width="16" height="28" fill="#D4A574" />
                {/* Head */}
                <ellipse cx="70" cy="48" rx="32" ry="35" fill="#D4A574" />
                {/* Hair - curly dark hair */}
                <path d="M38 40 Q35 18 52 12 Q70 4 90 12 Q107 18 104 40 Q100 28 85 20 Q70 12 55 20 Q42 28 38 40" fill="#2C1810" />
                <ellipse cx="40" cy="45" rx="5" ry="8" fill="#2C1810" />
                <ellipse cx="100" cy="45" rx="5" ry="8" fill="#2C1810" />
                <ellipse cx="48" cy="28" rx="5" ry="6" fill="#2C1810" />
                <ellipse cx="92" cy="28" rx="5" ry="6" fill="#2C1810" />
                <ellipse cx="70" cy="15" rx="10" ry="6" fill="#2C1810" />
                {/* Eyes - happy/squinting */}
                <path d="M55 48 Q60 44 65 48" stroke="#1F2937" strokeWidth="3" fill="none" strokeLinecap="round" />
                <path d="M75 48 Q80 44 85 48" stroke="#1F2937" strokeWidth="3" fill="none" strokeLinecap="round" />
                {/* Eyebrows - raised happy */}
                <path d="M52 38 Q60 33 68 38" stroke="#2C1810" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <path d="M72 38 Q80 33 88 38" stroke="#2C1810" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                {/* Big smile */}
                <path d="M55 62 Q70 76 85 62" stroke="#1F2937" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                {/* Teeth */}
                <path d="M60 64 L80 64" stroke="white" strokeWidth="4" strokeLinecap="round" />
                {/* Cheeks */}
                <ellipse cx="42" cy="58" rx="7" ry="4" fill="#FECACA" opacity="0.5" />
                <ellipse cx="98" cy="58" rx="7" ry="4" fill="#FECACA" opacity="0.5" />
                {/* Waving arm */}
                <path d="M95 105 Q115 85 120 60" stroke="#D4A574" strokeWidth="14" fill="none" strokeLinecap="round" />
                {/* Open waving hand */}
                <ellipse cx="122" cy="55" rx="10" ry="12" fill="#D4A574" />
                <ellipse cx="115" cy="42" rx="4" ry="8" fill="#D4A574" />
                <ellipse cx="122" cy="38" rx="4" ry="9" fill="#D4A574" />
                <ellipse cx="129" cy="40" rx="4" ry="8" fill="#D4A574" />
                <ellipse cx="135" cy="46" rx="3" ry="6" fill="#D4A574" />
                {/* Other arm at side */}
                <path d="M45 105 Q30 115 25 135" stroke="#D4A574" strokeWidth="12" fill="none" strokeLinecap="round" />
                <ellipse cx="23" cy="138" rx="8" ry="9" fill="#D4A574" />
                {/* Collar */}
                <path d="M58 95 L70 108 L82 95" stroke="#059669" strokeWidth="2" fill="none" />
              </svg>
            </div>
             </div>
           
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Structure Analysis - Asian man */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6 hover:shadow-lg hover:border-stone-300 hover:-translate-y-1 transition-all duration-200">
              <div className="w-14 h-14 rounded-full bg-lime-50 flex items-center justify-center mb-4 overflow-hidden">
                <svg viewBox="0 0 56 56" fill="none" className="w-14 h-14">
                  <circle cx="28" cy="28" r="28" fill="#DBEAFE"/>
                  <ellipse cx="28" cy="30" rx="14" ry="15" fill="#E8C4A0"/>
                  <path d="M14 26 Q12 16 20 12 Q28 8 36 12 Q44 16 42 26 Q40 20 34 16 Q28 12 22 16 Q16 20 14 26" fill="#1F2937"/>
                  <path d="M14 26 Q10 30 14 36" fill="#1F2937"/>
                  <path d="M42 26 Q46 30 42 36" fill="#1F2937"/>
                  <ellipse cx="22" cy="30" rx="3" ry="3.5" fill="#1F2937"/>
                  <ellipse cx="34" cy="30" rx="3" ry="3.5" fill="#1F2937"/>
                  <circle cx="23" cy="29" r="1" fill="white"/>
                  <circle cx="35" cy="29" r="1" fill="white"/>
                  <path d="M24 40 Q28 45 32 40" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round"/>
                  <ellipse cx="18" cy="35" rx="3" ry="2" fill="#FECACA" opacity="0.4"/>
                  <ellipse cx="38" cy="35" rx="3" ry="2" fill="#FECACA" opacity="0.4"/>
                    </svg>
                  </div>
              <h3 className="font-semibold text-stone-800 text-lg mb-2">Structure Analysis</h3>
              <p className="text-base text-stone-600 leading-relaxed">Get feedback on your essay organization, thesis clarity, and paragraph flow.</p>
                     </div>
                     
            {/* Grammar Check - Black woman */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6 hover:shadow-lg hover:border-stone-300 hover:-translate-y-1 transition-all duration-200">
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mb-4 overflow-hidden">
                <svg viewBox="0 0 56 56" fill="none" className="w-14 h-14">
                  <circle cx="28" cy="28" r="28" fill="#D1FAE5"/>
                  <ellipse cx="28" cy="30" rx="14" ry="15" fill="#8B5A2B"/>
                  {/* Hair - curly afro style, closer to head */}
                  <path d="M14 28 Q12 18 20 14 Q28 10 36 14 Q44 18 42 28 Q40 22 34 18 Q28 14 22 18 Q16 22 14 28" fill="#1F2937"/>
                  <ellipse cx="16" cy="30" rx="5" ry="7" fill="#1F2937"/>
                  <ellipse cx="40" cy="30" rx="5" ry="7" fill="#1F2937"/>
                  <ellipse cx="20" cy="18" rx="4" ry="5" fill="#1F2937"/>
                  <ellipse cx="28" cy="14" rx="5" ry="4" fill="#1F2937"/>
                  <ellipse cx="36" cy="18" rx="4" ry="5" fill="#1F2937"/>
                  <ellipse cx="22" cy="30" rx="3" ry="3.5" fill="#1F2937"/>
                  <ellipse cx="34" cy="30" rx="3" ry="3.5" fill="#1F2937"/>
                  <circle cx="23" cy="29" r="1" fill="white"/>
                  <circle cx="35" cy="29" r="1" fill="white"/>
                  <path d="M24 40 Q28 46 32 40" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round"/>
                  <ellipse cx="18" cy="35" rx="3" ry="2" fill="#C9958A" opacity="0.4"/>
                  <ellipse cx="38" cy="35" rx="3" ry="2" fill="#C9958A" opacity="0.4"/>
                </svg>
                        </div>
              <h3 className="font-semibold text-stone-800 text-lg mb-2">Grammar Check</h3>
              <p className="text-base text-stone-600 leading-relaxed">Catch grammar, spelling, and punctuation errors with AI-powered suggestions.</p>
                           </div>
                          
            {/* Citation Checker - White man with glasses */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6 hover:shadow-lg hover:border-stone-300 hover:-translate-y-1 transition-all duration-200">
              <div className="w-14 h-14 rounded-full bg-purple-50 flex items-center justify-center mb-4 overflow-hidden">
                <svg viewBox="0 0 56 56" fill="none" className="w-14 h-14">
                  <circle cx="28" cy="28" r="28" fill="#F3E8FF"/>
                  <ellipse cx="28" cy="30" rx="14" ry="15" fill="#FCD9B6"/>
                  <path d="M14 24 Q12 12 22 10 Q28 8 34 10 Q44 12 42 24 Q40 18 34 14 Q28 10 22 14 Q16 18 14 24" fill="#8B6914"/>
                  <path d="M14 24 Q10 28 14 34" fill="#8B6914"/>
                  <path d="M42 24 Q46 28 42 34" fill="#8B6914"/>
                  <ellipse cx="21" cy="30" rx="6" ry="5" fill="none" stroke="#374151" strokeWidth="2"/>
                  <ellipse cx="35" cy="30" rx="6" ry="5" fill="none" stroke="#374151" strokeWidth="2"/>
                  <path d="M27 30 L29 30" stroke="#374151" strokeWidth="2"/>
                  <path d="M15 28 L12 26" stroke="#374151" strokeWidth="2"/>
                  <path d="M41 28 L44 26" stroke="#374151" strokeWidth="2"/>
                  <ellipse cx="21" cy="31" rx="2.5" ry="3" fill="#1F2937"/>
                  <ellipse cx="35" cy="31" rx="2.5" ry="3" fill="#1F2937"/>
                  <circle cx="22" cy="30" r="0.8" fill="white"/>
                  <circle cx="36" cy="30" r="0.8" fill="white"/>
                  <path d="M24 42 Q28 47 32 42" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round"/>
                  <ellipse cx="17" cy="36" rx="3" ry="2" fill="#FECACA" opacity="0.4"/>
                  <ellipse cx="39" cy="36" rx="3" ry="2" fill="#FECACA" opacity="0.4"/>
                </svg>
                              </div>
              <h3 className="font-semibold text-stone-800 text-lg mb-2">Citation Checker</h3>
              <p className="text-base text-stone-600 leading-relaxed">Validate APA, MLA, Chicago, and Harvard citations. Fix formatting errors.</p>
                              </div>

            {/* Academic Tone - Hispanic woman */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6 hover:shadow-lg hover:border-stone-300 hover:-translate-y-1 transition-all duration-200">
              <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center mb-4 overflow-hidden">
                <svg viewBox="0 0 56 56" fill="none" className="w-14 h-14">
                  <circle cx="28" cy="28" r="28" fill="#FFEDD5"/>
                  <ellipse cx="28" cy="30" rx="14" ry="15" fill="#D4A574"/>
                  <path d="M12 26 Q10 14 20 10 Q28 6 36 10 Q46 14 44 26 Q42 18 34 14 Q28 10 22 14 Q16 18 12 26" fill="#3D2314"/>
                  <path d="M12 26 Q6 40 16 48" fill="#3D2314"/>
                  <path d="M44 26 Q50 40 40 48" fill="#3D2314"/>
                  <ellipse cx="22" cy="30" rx="3" ry="3.5" fill="#1F2937"/>
                  <ellipse cx="34" cy="30" rx="3" ry="3.5" fill="#1F2937"/>
                  <circle cx="23" cy="29" r="1" fill="white"/>
                  <circle cx="35" cy="29" r="1" fill="white"/>
                  <path d="M17 24 Q22 20 27 24" stroke="#3D2314" strokeWidth="2" fill="none" strokeLinecap="round"/>
                  <path d="M29 24 Q34 20 39 24" stroke="#3D2314" strokeWidth="2" fill="none" strokeLinecap="round"/>
                  <path d="M24 41 Q28 46 32 41" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round"/>
                  <ellipse cx="17" cy="35" rx="3" ry="2" fill="#E8A090" opacity="0.5"/>
                  <ellipse cx="39" cy="35" rx="3" ry="2" fill="#E8A090" opacity="0.5"/>
                </svg>
                              </div>
              <h3 className="font-semibold text-stone-800 text-lg mb-2">Academic Tone</h3>
              <p className="text-base text-stone-600 leading-relaxed">Ensure your writing maintains appropriate formality and discipline conventions.</p>
                            </div>
          
            {/* Clarity Feedback - South Asian man */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6 hover:shadow-lg hover:border-stone-300 hover:-translate-y-1 transition-all duration-200">
              <div className="w-14 h-14 rounded-full bg-pink-50 flex items-center justify-center mb-4 overflow-hidden">
                <svg viewBox="0 0 56 56" fill="none" className="w-14 h-14">
                  <circle cx="28" cy="28" r="28" fill="#FCE7F3"/>
                  <ellipse cx="28" cy="30" rx="14" ry="15" fill="#C68642"/>
                  <path d="M14 24 Q12 12 22 10 Q28 8 34 10 Q44 12 42 24 Q40 18 34 14 Q28 10 22 14 Q16 18 14 24" fill="#1A1A1A"/>
                  <path d="M14 24 Q10 28 14 34" fill="#1A1A1A"/>
                  <path d="M42 24 Q46 28 42 34" fill="#1A1A1A"/>
                  <ellipse cx="22" cy="30" rx="3" ry="3.5" fill="#1F2937"/>
                  <ellipse cx="34" cy="30" rx="3" ry="3.5" fill="#1F2937"/>
                  <circle cx="23" cy="29" r="1" fill="white"/>
                  <circle cx="35" cy="29" r="1" fill="white"/>
                  <path d="M16 24 Q22 20 28 24" stroke="#1A1A1A" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                  <path d="M28 24 Q34 20 40 24" stroke="#1A1A1A" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                  <path d="M24 41 Q28 46 32 41" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round"/>
                  <ellipse cx="17" cy="35" rx="3" ry="2" fill="#D4A07A" opacity="0.5"/>
                  <ellipse cx="39" cy="35" rx="3" ry="2" fill="#D4A07A" opacity="0.5"/>
                      </svg>
                          </div>
              <h3 className="font-semibold text-stone-800 text-lg mb-2">Clarity Feedback</h3>
              <p className="text-base text-stone-600 leading-relaxed">Identify unclear sentences and get suggestions for clearer expression.</p>
                    </div>
            
            {/* Source Finder - East Asian woman */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6 hover:shadow-lg hover:border-stone-300 hover:-translate-y-1 transition-all duration-200">
              <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center mb-4 overflow-hidden">
                <svg viewBox="0 0 56 56" fill="none" className="w-14 h-14">
                  <circle cx="28" cy="28" r="28" fill="#E0E7FF"/>
                  <ellipse cx="28" cy="30" rx="14" ry="15" fill="#F5DEB3"/>
                  <path d="M12 26 Q10 14 20 10 Q28 6 36 10 Q46 14 44 26 Q42 18 34 14 Q28 10 22 14 Q16 18 12 26" fill="#1A1A1A"/>
                  <path d="M12 26 Q6 40 16 50" fill="#1A1A1A"/>
                  <path d="M44 26 Q50 40 40 50" fill="#1A1A1A"/>
                  <ellipse cx="22" cy="30" rx="3" ry="3.5" fill="#1F2937"/>
                  <ellipse cx="34" cy="30" rx="3" ry="3.5" fill="#1F2937"/>
                  <circle cx="23" cy="29" r="1" fill="white"/>
                  <circle cx="35" cy="29" r="1" fill="white"/>
                  <path d="M24 41 Q28 46 32 41" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round"/>
                  <ellipse cx="17" cy="35" rx="3" ry="2" fill="#FECACA" opacity="0.4"/>
                  <ellipse cx="39" cy="35" rx="3" ry="2" fill="#FECACA" opacity="0.4"/>
                </svg>
                  </div>
              <h3 className="font-semibold text-stone-800 text-lg mb-2">Source Finder</h3>
              <p className="text-base text-stone-600 leading-relaxed">Search millions of academic papers to find relevant citations for your topic.</p>
                </div>
              </div>
           </div>
      </section>

      {/* Free Tools Showcase */}
      <section className="py-20 sm:py-24" style={{ background: '#FAF8F5' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative text-center mb-12">
            <span className="inline-block px-4 py-1.5 bg-lime-100 text-lime-700 rounded-full text-sm font-semibold mb-4">100% Free</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl text-stone-800 mb-5 font-sans font-normal">
              Try Our Free Writing Tools
            </h2>
            <p className="text-lg text-stone-500 max-w-2xl mx-auto">
              No signup required. Use these tools instantly to improve your writing.
            </p>
            {/* Character holding toolbox - positioned right */}
            <div className="hidden lg:block absolute -right-4 xl:right-8 top-1/2 -translate-y-1/2 w-28 h-36">
              <svg viewBox="0 0 140 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                {/* Body - purple shirt */}
                <path d="M50 100 Q45 130 50 160 L90 160 Q95 130 90 100" fill="#8B5CF6" />
                {/* Neck */}
                <rect x="62" y="75" width="16" height="28" fill="#D4A574" />
                {/* Head */}
                <ellipse cx="70" cy="48" rx="32" ry="35" fill="#D4A574" />
                {/* Hair - ponytail style */}
                <path d="M38 40 Q35 18 52 12 Q70 4 90 12 Q107 18 104 40 Q100 28 85 20 Q70 12 55 20 Q42 28 38 40" fill="#5D3A1A" />
                <ellipse cx="105" cy="30" rx="10" ry="14" fill="#5D3A1A" />
                <path d="M38 40 Q32 55 38 70" fill="#5D3A1A" />
                <path d="M102 40 Q108 55 102 70" fill="#5D3A1A" />
                {/* Eyes - happy */}
                <path d="M55 48 Q60 44 65 48" stroke="#1F2937" strokeWidth="3" fill="none" strokeLinecap="round" />
                <path d="M75 48 Q80 44 85 48" stroke="#1F2937" strokeWidth="3" fill="none" strokeLinecap="round" />
                {/* Eyebrows */}
                <path d="M52 40 Q60 36 68 40" stroke="#5D3A1A" strokeWidth="2" fill="none" strokeLinecap="round" />
                <path d="M72 40 Q80 36 88 40" stroke="#5D3A1A" strokeWidth="2" fill="none" strokeLinecap="round" />
                {/* Big smile */}
                <path d="M55 62 Q70 76 85 62" stroke="#1F2937" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                {/* Teeth */}
                <path d="M60 64 L80 64" stroke="white" strokeWidth="4" strokeLinecap="round" />
                {/* Cheeks */}
                <ellipse cx="42" cy="55" rx="6" ry="4" fill="#FECACA" opacity="0.5" />
                <ellipse cx="98" cy="55" rx="6" ry="4" fill="#FECACA" opacity="0.5" />
                {/* Arms holding toolbox */}
                <path d="M45 105 Q25 120 20 140" stroke="#D4A574" strokeWidth="12" fill="none" strokeLinecap="round" />
                <path d="M95 105 Q115 120 120 140" stroke="#D4A574" strokeWidth="12" fill="none" strokeLinecap="round" />
                {/* Hands */}
                <ellipse cx="18" cy="143" rx="8" ry="9" fill="#D4A574" />
                <ellipse cx="122" cy="143" rx="8" ry="9" fill="#D4A574" />
                {/* Toolbox */}
                <rect x="15" y="140" width="110" height="30" rx="4" fill="#10B981" />
                <rect x="15" y="135" width="110" height="8" rx="2" fill="#059669" />
                <rect x="55" y="130" width="30" height="8" rx="2" fill="#047857" />
                {/* Tools poking out */}
                <rect x="30" y="118" width="5" height="20" rx="1" fill="#FCD34D" />
                <rect x="50" y="115" width="6" height="23" rx="1" fill="#60A5FA" />
                <rect x="85" y="120" width="5" height="18" rx="1" fill="#F472B6" />
                <rect x="105" y="117" width="5" height="21" rx="1" fill="#34D399" />
                {/* Collar */}
                <path d="M58 95 L70 108 L82 95" stroke="#7C3AED" strokeWidth="2" fill="none" />
              </svg>
            </div>
                </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Word Counter */}
            <button
              onClick={() => onNavigate('word-counter')}
              className="group bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 hover:shadow-md hover:border-stone-300 transition-all duration-200 text-left"
            >
              <div className="w-12 h-12 bg-lime-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-lime-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                    </svg>
                  </div>
              <h3 className="font-semibold text-stone-800 mb-1">Word Counter</h3>
              <p className="text-sm text-stone-500">Count words, characters & reading time</p>
            </button>

            {/* Citation Generator */}
            <button
              onClick={() => onNavigate('citation-generator-tool')}
              className="group bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 hover:shadow-md hover:border-stone-300 transition-all duration-200 text-left"
            >
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                </div>
              <h3 className="font-semibold text-stone-800 mb-1">Citation Generator</h3>
              <p className="text-sm text-stone-500">APA, MLA, Chicago & more</p>
            </button>

            {/* Grammar Checker */}
            <button
              onClick={() => onNavigate('grammar-checker')}
              className="group bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 hover:shadow-md hover:border-stone-300 transition-all duration-200 text-left"
            >
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-stone-800 mb-1">Grammar Checker</h3>
              <p className="text-sm text-stone-500">Fix spelling & punctuation</p>
            </button>

            {/* Readability Score */}
            <button
              onClick={() => onNavigate('readability-score')}
              className="group bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 hover:shadow-md hover:border-stone-300 transition-all duration-200 text-left"
            >
              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            </div>
              <h3 className="font-semibold text-stone-800 mb-1">Readability Score</h3>
              <p className="text-sm text-stone-500">Flesch-Kincaid & grade level</p>
            </button>

            {/* Thesis Generator */}
            <button
              onClick={() => onNavigate('thesis-generator')}
              className="group bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 hover:shadow-md hover:border-stone-300 transition-all duration-200 text-left"
            >
              <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
          </div>
              <h3 className="font-semibold text-stone-800 mb-1">Thesis Generator</h3>
              <p className="text-sm text-stone-500">Create strong thesis statements</p>
            </button>

            {/* Essay Outline */}
            <button
              onClick={() => onNavigate('essay-outline')}
              className="group bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 hover:shadow-md hover:border-stone-300 transition-all duration-200 text-left"
            >
              <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-lime-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
        </div>
              <h3 className="font-semibold text-stone-800 mb-1">Essay Outline</h3>
              <p className="text-sm text-stone-500">Structure your essay properly</p>
            </button>

            {/* Text Case Converter */}
            <button
              onClick={() => onNavigate('text-case-converter')}
              className="group bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 hover:shadow-md hover:border-stone-300 transition-all duration-200 text-left"
            >
              <div className="w-12 h-12 bg-pink-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
          </div>
              <h3 className="font-semibold text-stone-800 mb-1">Case Converter</h3>
              <p className="text-sm text-stone-500">Uppercase, lowercase & more</p>
            </button>

            {/* Paraphrasing Tips */}
                  <button
              onClick={() => onNavigate('paraphrasing-tips')}
              className="group bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 hover:shadow-md hover:border-stone-300 transition-all duration-200 text-left"
            >
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </div>
              <h3 className="font-semibold text-stone-800 mb-1">Paraphrasing Tips</h3>
              <p className="text-sm text-stone-500">Improve vocabulary & style</p>
                  </button>
                      </div>

          {/* Premium Humanizer Card */}
          <div className="mt-6">
            <button
              onClick={() => onNavigate('humanizer')}
              className="group w-full bg-gradient-to-r from-lime-50 to-green-50 border-2 border-lime-200 rounded-2xl p-6 sm:p-8 hover:shadow-lg hover:border-lime-400 transition-all duration-200 text-left relative overflow-hidden"
            >
              <div className="absolute top-3 right-3 px-3 py-1 bg-lime-500 text-stone-900 text-xs font-bold rounded-full">PREMIUM</div>
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-lime-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <span className="text-2xl">✨</span>
                    </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-stone-800 mb-1">AI Text Humanizer</h3>
                  <p className="text-sm text-stone-600">Humanize ChatGPT, GPT-4, Gemini, Claude &amp; LLaMA text. Bypass AI detectors with natural, human-sounding writing.</p>
                </div>
                <svg className="w-6 h-6 text-lime-600 flex-shrink-0 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* Blog Preview Section */}
      <section className="py-20 sm:py-24" style={{ background: '#F0EDE8' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-12">
            <div>
              <h2 className="text-3xl sm:text-4xl text-stone-800 mb-3" style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 400 }}>
                From Our Blog
              </h2>
              <p className="text-lg text-stone-600">
                Tips and guides to improve your academic writing
              </p>
            </div>
            <button
              onClick={() => onNavigate('blog')}
              className="mt-4 sm:mt-0 inline-flex items-center text-lime-600 hover:text-lime-700 font-semibold transition-colors"
            >
              View all posts
              <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {/* Blog Post 1 */}
            <button
              onClick={() => onNavigate('blog-post', 'free-writing-tools-every-student-needs')}
              className="group bg-white border border-stone-200 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-200 text-left"
            >
              <div className="h-40 bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center">
                <svg viewBox="0 0 120 80" fill="none" className="w-24 h-16">
                  <rect x="30" y="30" width="60" height="40" rx="4" fill="#FECDD3" stroke="#F43F5E" strokeWidth="2" />
                  <rect x="30" y="22" width="60" height="10" rx="2" fill="#FDA4AF" stroke="#F43F5E" strokeWidth="2" />
                  <rect x="52" y="18" width="16" height="6" rx="2" fill="#F43F5E" />
                  <rect x="38" y="12" width="5" height="22" rx="1" fill="#FCD34D" />
                  <rect x="50" y="8" width="6" height="26" rx="1" fill="#34D399" />
                  <rect x="64" y="14" width="5" height="20" rx="1" fill="#60A5FA" />
                      </svg>
              </div>
              <div className="p-5">
                <span className="text-xs text-stone-500 font-medium">Mar 1, 2026</span>
                <h3 className="font-semibold text-stone-800 mt-2 mb-2 group-hover:text-lime-600 transition-colors line-clamp-2">
                  8 Free Writing Tools Every Student Needs in 2026
                </h3>
                <p className="text-sm text-stone-600 line-clamp-2">
                  Discover the best free writing tools including word counters, grammar checkers, and citation generators.
                </p>
              </div>
            </button>

            {/* Blog Post 2 */}
            <button
              onClick={() => onNavigate('blog-post', 'how-to-write-a-thesis-statement')}
              className="group bg-white border border-stone-200 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-200 text-left"
            >
              <div className="h-40 bg-gradient-to-br from-lime-100 to-stone-100 flex items-center justify-center">
                <svg viewBox="0 0 120 80" fill="none" className="w-24 h-16">
                  <rect x="25" y="15" width="70" height="50" rx="4" fill="white" stroke="#6366F1" strokeWidth="2" />
                  <line x1="35" y1="28" x2="85" y2="28" stroke="#A5B4FC" strokeWidth="3" />
                  <line x1="35" y1="38" x2="75" y2="38" stroke="#C7D2FE" strokeWidth="2" />
                  <line x1="35" y1="46" x2="80" y2="46" stroke="#C7D2FE" strokeWidth="2" />
                  <line x1="35" y1="54" x2="70" y2="54" stroke="#C7D2FE" strokeWidth="2" />
                  <path d="M90 10 L93 18 L101 21 L93 24 L90 32 L87 24 L79 21 L87 18 Z" fill="#6366F1" />
                      </svg>
              </div>
              <div className="p-5">
                <span className="text-xs text-stone-500 font-medium">Feb 28, 2026</span>
                <h3 className="font-semibold text-stone-800 mt-2 mb-2 group-hover:text-lime-600 transition-colors line-clamp-2">
                  How to Write a Thesis Statement: Examples for Any Essay
                </h3>
                <p className="text-sm text-stone-600 line-clamp-2">
                  Learn how to write clear, arguable thesis statements with examples for argumentative and analytical essays.
                </p>
              </div>
            </button>

            {/* Blog Post 3 */}
            <button
              onClick={() => onNavigate('blog-post', 'how-to-write-apa-research-paper')}
              className="group bg-white border border-stone-200 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-200 text-left"
            >
              <div className="h-40 bg-gradient-to-br from-purple-100 to-violet-100 flex items-center justify-center">
                <svg viewBox="0 0 120 80" fill="none" className="w-24 h-16">
                  <rect x="20" y="10" width="50" height="60" rx="3" fill="white" stroke="#8B5CF6" strokeWidth="2" />
                  <rect x="50" y="15" width="50" height="60" rx="3" fill="white" stroke="#8B5CF6" strokeWidth="2" />
                  <line x1="28" y1="22" x2="62" y2="22" stroke="#C4B5FD" strokeWidth="2" />
                  <line x1="28" y1="30" x2="55" y2="30" stroke="#DDD6FE" strokeWidth="2" />
                  <line x1="28" y1="38" x2="60" y2="38" stroke="#DDD6FE" strokeWidth="2" />
                  <line x1="58" y1="27" x2="92" y2="27" stroke="#C4B5FD" strokeWidth="2" />
                  <line x1="58" y1="35" x2="85" y2="35" stroke="#DDD6FE" strokeWidth="2" />
                  <line x1="58" y1="43" x2="90" y2="43" stroke="#DDD6FE" strokeWidth="2" />
                  <text x="85" y="65" fontSize="18" fill="#8B5CF6" fontWeight="bold">APA</text>
                      </svg>
              </div>
              <div className="p-5">
                <span className="text-xs text-stone-500 font-medium">Feb 1, 2026</span>
                <h3 className="font-semibold text-stone-800 mt-2 mb-2 group-hover:text-lime-600 transition-colors line-clamp-2">
                  How to Write an APA Research Paper: Complete Guide
                </h3>
                <p className="text-sm text-stone-600 line-clamp-2">
                  Step-by-step guide to formatting an APA research paper, from title page to references.
                </p>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* FAQ Section - bigger */}
      <section className="py-20 sm:py-24" style={{ background: '#F7F5F2' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl text-stone-800 text-center mb-5" style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 400 }}>
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-stone-600 text-center">
              Everything you need to know about WriteScholar
            </p>
            {/* Cute person - thinking pose */}
            <div className="hidden lg:block absolute -right-20 xl:-right-32 top-1/2 -translate-y-1/2 w-24 h-28">
              <svg viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                {/* Body */}
                <path d="M35 70 Q30 95 35 115 L65 115 Q70 95 65 70" fill="#6366F1" />
                {/* Neck */}
                <rect x="44" y="52" width="12" height="20" fill="#E8B796" />
                {/* Head */}
                <ellipse cx="50" cy="32" rx="24" ry="26" fill="#E8B796" />
                {/* Hair - short brown */}
                <path d="M26 26 Q24 10 36 6 Q50 0 64 6 Q76 10 74 26 Q72 18 60 12 Q50 8 40 12 Q30 18 26 26" fill="#5D4037" />
                <path d="M26 26 Q20 34 26 42" fill="#5D4037" />
                <path d="M74 26 Q80 34 74 42" fill="#5D4037" />
                {/* Eyes - looking up thinking */}
                <ellipse cx="40" cy="30" rx="3" ry="4" fill="#1F2937" />
                <ellipse cx="60" cy="30" rx="3" ry="4" fill="#1F2937" />
                <circle cx="41" cy="28" r="1" fill="white" />
                <circle cx="61" cy="28" r="1" fill="white" />
                {/* Eyebrows - raised */}
                <path d="M34 22 Q40 18 46 22" stroke="#5D4037" strokeWidth="2" fill="none" strokeLinecap="round" />
                <path d="M54 22 Q60 18 66 22" stroke="#5D4037" strokeWidth="2" fill="none" strokeLinecap="round" />
                {/* Slight smile */}
                <path d="M42 44 Q50 50 58 44" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round" />
                {/* Cheeks */}
                <ellipse cx="32" cy="38" rx="4" ry="3" fill="#FECACA" opacity="0.5" />
                <ellipse cx="68" cy="38" rx="4" ry="3" fill="#FECACA" opacity="0.5" />
                {/* Thinking arm - hand on chin */}
                <path d="M70 75 Q85 60 78 45" stroke="#E8B796" strokeWidth="10" fill="none" strokeLinecap="round" />
                <ellipse cx="77" cy="43" rx="7" ry="8" fill="#E8B796" />
                {/* Question mark bubble */}
                <circle cx="88" cy="15" r="10" fill="#F3F4F6" stroke="#E5E7EB" strokeWidth="1" />
                <text x="88" y="20" textAnchor="middle" fontSize="14" fill="#6366F1" fontWeight="bold">?</text>
                      </svg>
                  </div>
                </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-stone-200 overflow-hidden hover:border-stone-300 hover:shadow-sm transition-all duration-200">
                <button
                  onClick={() => setOpenFAQ(openFAQ === idx ? null : idx)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-stone-50 transition-all duration-200"
                >
                  <span className="font-medium text-stone-800 text-lg pr-4">{faq.question}</span>
                  <svg className={`w-5 h-5 text-stone-400 flex-shrink-0 transition-transform ${openFAQ === idx ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openFAQ === idx ? 'max-h-56' : 'max-h-0'}`}>
                  <div className="px-6 pb-5 text-stone-600 text-base leading-relaxed">{faq.answer}</div>
              </div>
            </div>
            ))}
                </div>
              </div>
      </section>

      {/* Final CTA - bigger */}
      <section className="py-20 sm:py-24" style={{ background: '#FAF8F5' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-lime-50 to-stone-50 rounded-3xl p-8 sm:p-12 lg:p-16 relative overflow-hidden">
            {/* Text content - always centered */}
            <div className="text-center relative z-10">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-800 mb-5">
                Ready to improve your writing?
              </h2>
              <p className="text-lg text-stone-600 mb-10 max-w-xl mx-auto">
                Start analyzing your essays and finding citations for free. No credit card required.
              </p>
                <button
                  onClick={() => onNavigate('signup')}
                className="inline-flex items-center px-8 py-4 bg-lime-500 hover:bg-lime-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-lg"
                >
                Start Writing Better
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                </button>
              </div>

            {/* Group of characters - positioned at bottom, hidden on mobile */}
            <div className="hidden lg:flex justify-center mt-10">
              <svg viewBox="0 0 320 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-80 h-44">
                {/* Person 1 - Woman with red hair (left) */}
                <g transform="translate(0, 0)">
                  {/* Body */}
                  <path d="M35 90 Q30 115 35 145 L65 145 Q70 115 65 90" fill="#8B5CF6" />
                  {/* Neck */}
                  <rect x="43" y="70" width="14" height="22" fill="#FCD9B6" />
                  {/* Head */}
                  <ellipse cx="50" cy="45" rx="24" ry="28" fill="#FCD9B6" />
                  {/* Hair - long red */}
                  <path d="M26 38 Q22 18 36 12 Q50 4 68 12 Q82 18 78 38 Q75 28 62 22 Q50 16 38 22 Q28 28 26 38" fill="#B45309" />
                  <path d="M26 38 Q18 65 26 95" fill="#B45309" />
                  <path d="M74 38 Q82 65 74 95" fill="#B45309" />
                  {/* Eyes */}
                  <ellipse cx="40" cy="45" rx="4" ry="5" fill="#1F2937" />
                  <ellipse cx="60" cy="45" rx="4" ry="5" fill="#1F2937" />
                  <circle cx="41" cy="43" r="1.5" fill="white" />
                  <circle cx="61" cy="43" r="1.5" fill="white" />
                  {/* Smile */}
                  <path d="M40 58 Q50 68 60 58" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round" />
                  {/* Cheeks */}
                  <ellipse cx="30" cy="52" rx="5" ry="3" fill="#FECACA" opacity="0.5" />
                  <ellipse cx="70" cy="52" rx="5" ry="3" fill="#FECACA" opacity="0.5" />
                  {/* Wave arm */}
                  <path d="M70 95 Q85 80 90 60" stroke="#FCD9B6" strokeWidth="10" fill="none" strokeLinecap="round" />
                  <ellipse cx="92" cy="58" rx="7" ry="8" fill="#FCD9B6" />
                </g>
                
                {/* Person 2 - Man with glasses (center, slightly forward) */}
                <g transform="translate(110, -10)">
                  {/* Body */}
                  <path d="M35 105 Q30 135 35 165 L75 165 Q80 135 75 105" fill="#3B82F6" />
                  {/* Neck */}
                  <rect x="47" y="82" width="16" height="26" fill="#E8B796" />
                  {/* Head */}
                  <ellipse cx="55" cy="52" rx="28" ry="32" fill="#E8B796" />
                  {/* Hair - short brown */}
                  <path d="M27 42 Q24 20 40 14 Q55 6 72 14 Q88 20 85 42 Q82 30 68 22 Q55 16 42 22 Q30 30 27 42" fill="#5D4037" />
                  <path d="M27 42 Q20 52 27 62" fill="#5D4037" />
                  <path d="M83 42 Q90 52 83 62" fill="#5D4037" />
                  {/* Glasses */}
                  <ellipse cx="42" cy="50" rx="13" ry="11" fill="none" stroke="#374151" strokeWidth="2.5" />
                  <ellipse cx="68" cy="50" rx="13" ry="11" fill="none" stroke="#374151" strokeWidth="2.5" />
                  <path d="M55 50 L57 50" stroke="#374151" strokeWidth="2.5" />
                  <path d="M29 46 L22 43" stroke="#374151" strokeWidth="2.5" />
                  <path d="M81 46 L88 43" stroke="#374151" strokeWidth="2.5" />
                  {/* Eyes behind glasses */}
                  <ellipse cx="42" cy="52" rx="4" ry="5" fill="#1F2937" />
                  <ellipse cx="68" cy="52" rx="4" ry="5" fill="#1F2937" />
                  <circle cx="43" cy="50" r="1.5" fill="white" />
                  <circle cx="69" cy="50" r="1.5" fill="white" />
                  {/* Eyebrows */}
                  <path d="M30 38 Q42 32 54 38" stroke="#5D4037" strokeWidth="2" fill="none" strokeLinecap="round" />
                  <path d="M56 38 Q68 32 80 38" stroke="#5D4037" strokeWidth="2" fill="none" strokeLinecap="round" />
                  {/* Smile */}
                  <path d="M42 70 Q55 82 68 70" stroke="#1F2937" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                  {/* Cheeks */}
                  <ellipse cx="28" cy="62" rx="5" ry="3" fill="#FECACA" opacity="0.4" />
                  <ellipse cx="82" cy="62" rx="5" ry="3" fill="#FECACA" opacity="0.4" />
                  {/* Waving arm */}
                  <path d="M80 110 Q95 95 100 70" stroke="#E8B796" strokeWidth="12" fill="none" strokeLinecap="round" />
                  <ellipse cx="102" cy="68" rx="8" ry="9" fill="#E8B796" />
                  {/* Collar */}
                  <path d="M45 100 L55 112 L65 100" stroke="#2563EB" strokeWidth="2" fill="none" />
                </g>
                
                {/* Person 3 - Woman with bun (right) */}
                <g transform="translate(220, 5)">
                  {/* Body */}
                  <path d="M30 88 Q25 112 30 140 L60 140 Q65 112 60 88" fill="#10B981" />
                  {/* Neck */}
                  <rect x="38" y="68" width="14" height="22" fill="#D4A574" />
                  {/* Head */}
                  <ellipse cx="45" cy="44" rx="24" ry="26" fill="#D4A574" />
                  {/* Hair - bun style */}
                  <path d="M21 36 Q18 18 32 12 Q45 5 62 12 Q75 18 72 36 Q68 26 55 20 Q45 15 35 20 Q24 26 21 36" fill="#1F2937" />
                  <ellipse cx="45" cy="6" rx="11" ry="9" fill="#1F2937" />
                  <path d="M21 36 Q14 46 21 58" fill="#1F2937" />
                  <path d="M69 36 Q76 46 69 58" fill="#1F2937" />
                  {/* Eyes */}
                  <ellipse cx="36" cy="44" rx="4" ry="5" fill="#1F2937" />
                  <ellipse cx="54" cy="44" rx="4" ry="5" fill="#1F2937" />
                  <circle cx="37" cy="42" r="1.5" fill="white" />
                  <circle cx="55" cy="42" r="1.5" fill="white" />
                  {/* Eyebrows */}
                  <path d="M28 34 Q36 30 44 34" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round" />
                  <path d="M46 34 Q54 30 62 34" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round" />
                  {/* Smile */}
                  <path d="M35 56 Q45 66 55 56" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round" />
                  {/* Cheeks */}
                  <ellipse cx="25" cy="50" rx="5" ry="3" fill="#FECACA" opacity="0.5" />
                  <ellipse cx="65" cy="50" rx="5" ry="3" fill="#FECACA" opacity="0.5" />
                  {/* Waving arm */}
                  <path d="M25 92 Q10 78 5 55" stroke="#D4A574" strokeWidth="10" fill="none" strokeLinecap="round" />
                  <ellipse cx="4" cy="52" rx="7" ry="8" fill="#D4A574" />
                </g>
              </svg>
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

      {showFakeAnimation && mode === 'humanize' && (
        <AnalysisAnimation isPopup={true} text="Humanizing your text" isComplete={false} />
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

      {/* Fake Humanize Results Modal */}
      {showFakeHumanizeResults && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="relative bg-white rounded-2xl p-6 sm:p-8 max-w-4xl w-full mx-4 shadow-2xl animate-fade-in">
            <button type="button" onClick={() => setShowFakeHumanizeResults(false)} className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors z-10" aria-label="Close">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-100 text-violet-700 rounded-full text-sm font-medium mb-3">
                <span>✨</span> Text Humanized Successfully
              </div>
              <h3 className="text-xl font-bold text-stone-800">Your AI text has been transformed</h3>
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

              {/* Humanized Panel */}
              <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl border border-violet-200 overflow-hidden">
                <div className="px-4 py-2.5 bg-violet-100/50 border-b border-violet-200">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-violet-400"></div>
                    <span className="text-xs font-semibold text-violet-600 uppercase tracking-wider">Humanized</span>
                  </div>
                </div>
                <div className="p-4 max-h-48 overflow-y-auto relative">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/90 pointer-events-none"></div>
                  <p className="text-sm text-violet-900 leading-relaxed blur-[2px]">
                    The concepts presented demonstrate a nuanced understanding of the subject matter. Through careful analysis, we can observe that the underlying principles support a comprehensive framework for interpretation...
                  </p>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="flex flex-wrap gap-3 justify-center mb-6">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full border border-green-200">
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-green-700 text-sm font-medium">AI detection bypassed</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-violet-50 rounded-full border border-violet-200">
                <svg className="w-4 h-4 text-violet-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-violet-700 text-sm font-medium">Meaning preserved</span>
              </div>
            </div>

            <div className="bg-stone-50 rounded-xl p-3.5 mb-6">
              <p className="text-stone-600 text-sm text-center leading-relaxed">
                <span className="font-semibold text-stone-800">Sign up to reveal your full humanized text.</span> Copy it, use it with all modes and intensity levels.
              </p>
            </div>

            <button 
              onClick={handleContinueToSignup}
              className="w-full py-3.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-lg flex items-center justify-center"
            >
              Get my humanized text — sign up free
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
              <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl border border-teal-200 overflow-hidden">
                <div className="px-4 py-2.5 bg-teal-100/50 border-b border-teal-200">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-teal-400"></div>
                    <span className="text-xs font-semibold text-teal-600 uppercase tracking-wider">Summary</span>
                    <span className="px-2 py-0.5 bg-teal-200 text-teal-700 text-[10px] font-bold rounded-full">~75% shorter</span>
                  </div>
                </div>
                <div className="p-4 max-h-48 overflow-y-auto relative">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/90 pointer-events-none"></div>
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
                <span className="text-green-700 text-sm font-medium">1,000 words free/month</span>
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
                  <p className="text-amber-800 font-semibold text-sm">3 free generations per month</p>
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
  );
};

export default LandingPage;
