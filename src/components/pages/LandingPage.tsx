import { useState, useEffect } from 'react';
import Footer from '../common/Footer';
import AnalysisAnimation from '../common/AnalysisAnimation';

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

const LandingPage = ({ onNavigate }: LandingPageProps) => {
  const [inputText, setInputText] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [mode, setMode] = useState<'analyze' | 'citations'>('analyze');
  const [citationStyle, setCitationStyle] = useState('APA');
  const [citationYearRange, setCitationYearRange] = useState('all');
  const [showFakeAnimation, setShowFakeAnimation] = useState(false);
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

  const placeholders = mode === 'analyze' ? analyzePlaceholders : citationPlaceholders;

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

  const sidebarTools = [
    { id: 'grammar', name: 'Grammar Checker', icon: 'A', color: 'text-red-500', bg: 'bg-red-50' },
    { id: 'structure', name: 'Structure Analysis', icon: '◎', color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'citations', name: 'Citation Checker', icon: '99', color: 'text-purple-500', bg: 'bg-purple-50' },
    { id: 'tone', name: 'Academic Tone', icon: '≡', color: 'text-green-500', bg: 'bg-green-50' },
    { id: 'clarity', name: 'Clarity Feedback', icon: '◇', color: 'text-orange-500', bg: 'bg-orange-50' },
    { id: 'sources', name: 'Source Finder', icon: '⌕', color: 'text-indigo-500', bg: 'bg-indigo-50' }
  ];

  const faqs = [
    {
      question: "How does the AI writing analysis work?",
      answer: "WriteScholar uses advanced AI to analyze your writing for structure, clarity, grammar, citation formatting, and academic tone. You get specific, actionable feedback similar to what a professor would provide."
    },
    {
      question: "Is my document content private?",
      answer: "Yes. We use enterprise-grade encryption. Your content is never shared with third parties or used to train AI models. You can delete your documents at any time."
    },
    {
      question: "What citation styles are supported?",
      answer: "We support APA 7th edition, MLA 9th edition, Chicago (notes-bibliography and author-date), Harvard, IEEE, and Vancouver. Our citation checker validates formatting and catches common errors."
    },
    {
      question: "Can I use this for my thesis or dissertation?",
      answer: "Yes. WriteScholar handles documents of any length and provides chapter-by-chapter analysis for longer works. Premium users get feedback on methodology and literature review structure."
    },
    {
      question: "How is this different from Grammarly?",
      answer: "While Grammarly is general-purpose, WriteScholar is built for academic writing. We understand academic tone, citation requirements, discipline-specific conventions, and research paper structure."
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
    if (mode === 'citations') {
      localStorage.setItem('pendingCitationSearch', JSON.stringify({
        topic: inputText,
        style: citationStyle,
        yearRange: citationYearRange
      }));
    } else {
      localStorage.setItem('pendingAnalysis', JSON.stringify({ text: inputText }));
    }
    setTimeout(() => {
      setShowFakeAnimation(false);
      onNavigate('signup');
    }, 3500);
  };

  const handleTopicClick = (topic: string) => {
    setInputText(topic);
  };

  // Character illustration component - positioned outside the text area
  // Mobile: head only, top-right corner | Desktop: full body with pointing arm
  const CharacterIllustration = () => (
    <>
      {/* Mobile version - head only, positioned top-right */}
      <div className="absolute -right-2 -top-10 w-14 h-14 sm:hidden pointer-events-none z-10">
        <svg viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Head */}
          <circle cx="35" cy="38" r="22" fill="#FCD9B6" />
          {/* Hair */}
          <path d="M13 32 Q15 12 35 16 Q55 12 57 32 Q61 22 49 18 Q35 8 21 18 Q9 22 13 32" fill="#4B5563" />
          {/* Eyes */}
          <circle cx="27" cy="36" r="3.5" fill="#1F2937" />
          <circle cx="43" cy="36" r="3.5" fill="#1F2937" />
          <circle cx="28" cy="34.5" r="1.2" fill="white" />
          <circle cx="44" cy="34.5" r="1.2" fill="white" />
          {/* Eyebrows */}
          <path d="M22 28 Q27 25 32 28" stroke="#4B5563" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M38 28 Q43 25 48 28" stroke="#4B5563" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          {/* Smile */}
          <path d="M27 48 Q35 55 43 48" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round" />
          {/* Cheeks (blush) */}
          <circle cx="20" cy="44" r="3" fill="#FECACA" opacity="0.5" />
          <circle cx="50" cy="44" r="3" fill="#FECACA" opacity="0.5" />
        </svg>
      </div>
      
      {/* Tablet/Desktop version - full body with arm */}
      <div className="absolute hidden sm:block sm:right-4 sm:top-0 sm:w-24 sm:h-32 xl:-right-32 xl:w-28 xl:h-36 pointer-events-none z-10">
        <svg viewBox="0 0 100 130" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Body */}
          <ellipse cx="50" cy="115" rx="18" ry="8" fill="#E0E7FF" />
          <path d="M36 65 Q36 100 50 108 Q64 100 64 65" fill="#6366F1" />
          {/* Head */}
          <circle cx="50" cy="38" r="22" fill="#FCD9B6" />
          {/* Hair */}
          <path d="M28 32 Q30 12 50 16 Q70 12 72 32 Q76 22 64 18 Q50 8 36 18 Q24 22 28 32" fill="#4B5563" />
          {/* Eyes */}
          <circle cx="42" cy="36" r="3.5" fill="#1F2937" />
          <circle cx="58" cy="36" r="3.5" fill="#1F2937" />
          <circle cx="43" cy="34.5" r="1.2" fill="white" />
          <circle cx="59" cy="34.5" r="1.2" fill="white" />
          {/* Eyebrows */}
          <path d="M37 28 Q42 25 47 28" stroke="#4B5563" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M53 28 Q58 25 63 28" stroke="#4B5563" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          {/* Smile */}
          <path d="M42 48 Q50 55 58 48" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round" />
          {/* Arm pointing left toward input */}
          <path d="M36 75 Q15 82 5 95" stroke="#FCD9B6" strokeWidth="8" fill="none" strokeLinecap="round" />
          <circle cx="3" cy="98" r="5" fill="#FCD9B6" />
          {/* Shirt collar */}
          <path d="M42 62 L50 68 L58 62" stroke="white" strokeWidth="2" fill="none" />
          {/* Cheeks (blush) */}
          <circle cx="35" cy="44" r="3" fill="#FECACA" opacity="0.5" />
          <circle cx="65" cy="44" r="3" fill="#FECACA" opacity="0.5" />
        </svg>
      </div>
    </>
  );


  return (
    <main className="min-h-screen bg-white" role="main">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18 py-4">
            <a href="/" onClick={(e) => { e.preventDefault(); onNavigate('landing'); }} className="flex items-center space-x-2.5">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">W</span>
          </div>
              <span className="text-2xl font-bold text-gray-900">WriteScholar</span>
            </a>
            
            <div className="hidden md:flex items-center space-x-2">
              <a href="/features" onClick={(e) => { e.preventDefault(); onNavigate('features'); }} className="px-4 py-2.5 text-base text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors font-medium">Features</a>
              <a href="/pricing" onClick={(e) => { e.preventDefault(); onNavigate('pricing'); }} className="px-4 py-2.5 text-base text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors font-medium">Pricing</a>
              <a href="/blog" onClick={(e) => { e.preventDefault(); onNavigate('blog'); }} className="px-4 py-2.5 text-base text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors font-medium">Blog</a>
              <a href="/about" onClick={(e) => { e.preventDefault(); onNavigate('about'); }} className="px-4 py-2.5 text-base text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors font-medium">About</a>
        </div>
            
            <div className="flex items-center space-x-3">
              <a href="/login" onClick={(e) => { e.preventDefault(); onNavigate('login'); }} className="hidden sm:inline-flex px-4 py-2.5 text-base text-gray-700 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-50 transition-colors">Log in</a>
              <a href="/signup" onClick={(e) => { e.preventDefault(); onNavigate('signup'); }} className="inline-flex items-center px-5 py-2.5 bg-gray-900 text-white text-base font-semibold rounded-xl hover:bg-gray-800 transition-colors">
                Get Started
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
            <div className="hidden lg:flex flex-col space-y-1 mr-8 xl:mr-12 -ml-4 xl:-ml-8">
              <div className="bg-white border border-gray-200 rounded-2xl p-3 shadow-sm">
                {sidebarTools.map((tool) => (
                  <button 
                    key={tool.id}
                    onMouseEnter={() => setActiveToolHover(tool.id)}
                    onMouseLeave={() => setActiveToolHover(null)}
                    onClick={() => onNavigate('signup')}
                    className={`relative flex flex-col items-center p-3 rounded-xl transition-all w-full ${
                      activeToolHover === tool.id ? 'bg-gray-50 scale-105' : ''
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
                    <span className="text-[11px] text-gray-600 text-center leading-tight max-w-[70px]">{tool.name}</span>
                    
                    {activeToolHover === tool.id && (
                      <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap z-10">
                        {tool.name}
                        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 text-center max-w-4xl mx-auto">
              {/* H1 - bigger */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 tracking-tight leading-tight mb-5 sm:mb-7">
            {mode === 'analyze' ? (
                  <>Your essay — improved with <span className="text-blue-600">AI feedback</span></>
            ) : (
                  <>Find <span className="text-blue-600">academic citations</span> instantly</>
            )}
          </h1>
              
              {/* Feature badges - bigger */}
              <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 mb-7 sm:mb-9 text-base text-gray-600">
              {mode === 'analyze' ? (
                <>
                    <span className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>Structure analysis</span>
                    <span className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>Grammar &amp; clarity</span>
                    <span className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>Citation check</span>
                </>
              ) : (
                <>
                    <span className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>Millions of sources</span>
                    <span className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>APA, MLA, Chicago</span>
                    <span className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>Auto-formatted</span>
                </>
              )}
          </div>

              {/* Mode Toggle - bigger */}
              <div className="flex justify-center mb-5">
                <div className="inline-flex bg-gray-100 rounded-full p-1.5">
              <button
                    onClick={() => { setMode('analyze'); setInputText(''); }}
                    className={`px-5 sm:px-6 py-2.5 rounded-full text-base font-medium transition-all ${
                      mode === 'analyze' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Analyze Essay
              </button>
              <button
                    onClick={() => { setMode('citations'); setInputText(''); }}
                    className={`px-5 sm:px-6 py-2.5 rounded-full text-base font-medium transition-all ${
                      mode === 'citations' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Find Citations
              </button>
            </div>
          </div>
          
              {/* Helper text */}
              <p className="text-sm text-amber-600 mb-4 flex items-center justify-center">
                <span className="mr-1.5">💡</span>
                {mode === 'analyze' ? 'AI analyzes, you refine for submission' : 'Find sources, format citations automatically'}
              </p>

              {/* Citation Options (citations mode only) */}
            {mode === 'citations' && (
              <div className="flex justify-center mb-4">
                  <div className="inline-flex items-center gap-3 flex-wrap justify-center">
                    {/* Citation Style */}
                    <div className="inline-flex items-center bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-200">
                      <span className="text-gray-500 mr-2 text-sm">Style:</span>
                  <select
                    value={citationStyle}
                    onChange={(e) => setCitationStyle(e.target.value)}
                        className="bg-transparent font-medium text-gray-900 outline-none cursor-pointer text-sm"
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
                    <div className="inline-flex items-center bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-200">
                      <span className="text-gray-500 mr-2 text-sm">Year:</span>
                      <select
                        value={citationYearRange}
                        onChange={(e) => setCitationYearRange(e.target.value)}
                        className="bg-transparent font-medium text-gray-900 outline-none cursor-pointer text-sm"
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

              {/* Input Area with Character outside */}
              <div className="relative mb-5">
                {/* Character illustration - positioned outside to the right */}
                <CharacterIllustration />
                
                <div className="relative bg-white rounded-2xl border-2 border-gray-200 hover:border-gray-300 focus-within:border-blue-500 transition-colors shadow-sm">
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={placeholders[placeholderIndex]}
                    className="w-full min-h-[120px] sm:min-h-[140px] p-5 sm:p-6 text-gray-800 text-lg border-none outline-none resize-none bg-transparent placeholder-gray-400 leading-relaxed"
                    style={{ fontSize: '18px' }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = Math.min(target.scrollHeight, 220) + 'px';
                    }}
                  />
                </div>
                
                {/* Submit button - below textarea */}
                <div className="flex justify-center mt-4">
                  <button
                    onClick={handleSubmit}
                    disabled={!inputText.trim()}
                    className={`px-8 py-3.5 rounded-xl flex items-center justify-center transition-all font-semibold text-base ${
                      inputText.trim()
                        ? 'bg-gray-900 hover:bg-gray-800 text-white shadow-lg hover:shadow-xl cursor-pointer'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <span className="mr-2">✨</span>
                    {mode === 'analyze' ? 'Get Feedback' : 'Find Sources'}
                  </button>
                </div>
              </div>
                
              {/* Suggested Topics - only for citations mode */}
              {mode === 'citations' && (
                <div className="mb-10">
                  <p className="text-sm text-gray-500 mb-4">Suggested topics</p>
                  <div className="flex flex-wrap justify-center gap-2.5">
                    {suggestedTopics.map((topic, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleTopicClick(topic)}
                        className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm sm:text-base rounded-lg border border-gray-200 hover:border-gray-300 transition-colors text-left"
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
      <section className="py-10 bg-gray-50 border-y border-gray-100 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm font-medium mb-8">Trusted by students around the world</p>
          <div className="relative">
            <div className="flex animate-scroll-slow">
                {/* First set of universities */}
              {universities.map((uni, idx) => (
                <div key={`first-${idx}`} className="flex-shrink-0 mx-8 sm:mx-12">
                  <span className={`text-lg sm:text-xl ${uni.className}`}>{uni.name}</span>
                  </div>
              ))}
                {/* Duplicate set for seamless loop */}
              {universities.map((uni, idx) => (
                <div key={`second-${idx}`} className="flex-shrink-0 mx-8 sm:mx-12">
                  <span className={`text-lg sm:text-xl ${uni.className}`}>{uni.name}</span>
                  </div>
              ))}
                  </div>
                  </div>
                  </div>
      </section>

      {/* WriteScholar Can Help You With */}
      <section className="py-20 sm:py-24 bg-blue-50/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 text-center mb-10">
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
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
          
          {/* Content Area */}
          <div className="bg-white rounded-3xl p-8 sm:p-12 lg:p-16">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              {/* Text Content */}
              <div className="order-2 lg:order-1">
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                  {helpCategories.find(c => c.id === activeHelpCategory)?.title}
                </h3>
                <p className="text-gray-600 text-lg leading-relaxed mb-8">
                  {helpCategories.find(c => c.id === activeHelpCategory)?.description}
                </p>
                <button
                  onClick={() => onNavigate('signup')}
                  className="inline-flex items-center px-6 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
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
                      <text x="50" y="100" fontSize="60" fill="#6366F1" opacity="0.3" fontFamily="Georgia">"</text>
                      <text x="250" y="150" fontSize="60" fill="#6366F1" opacity="0.3" fontFamily="Georgia">"</text>
                      <text x="270" y="280" fontSize="40" fill="#A5B4FC" opacity="0.4" fontFamily="Georgia">"</text>
                      <text x="30" y="250" fontSize="40" fill="#A5B4FC" opacity="0.4" fontFamily="Georgia">"</text>
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
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 text-center mb-5">
              See WriteScholar in Action
            </h2>
            <p className="text-lg text-gray-600 text-center max-w-2xl mx-auto">
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
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Philosophy Essay Analysis</h3>
                <p className="text-gray-600 text-lg leading-relaxed mb-4">
                  See how WriteScholar analyzes a philosophy paper on justice and ethics, providing detailed feedback on argument structure, citation formatting, and academic tone.
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>Strong thesis identification</li>
                  <li className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>APA citation validation</li>
                  <li className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>Areas for improvement highlighted</li>
                </ul>
                  </div>
              <div className="order-1 lg:order-2">
                <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
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
                <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
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
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Film Studies Paper Analysis</h3>
                <p className="text-gray-600 text-lg leading-relaxed mb-4">
                  Watch WriteScholar analyze a multicultural film studies paper, identifying areas for clarity improvement and ensuring proper academic formatting.
                </p>
                <ul className="space-y-2 text-gray-600">
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
      <section className="py-20 sm:py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative mb-14">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 text-center mb-5">
              Everything You Need for Better Writing
            </h2>
            <p className="text-lg text-gray-600 text-center max-w-2xl mx-auto">
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
            <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-gray-300 transition-all">
              <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mb-4 overflow-hidden">
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
              <h3 className="font-semibold text-gray-900 text-lg mb-2">Structure Analysis</h3>
              <p className="text-base text-gray-600 leading-relaxed">Get feedback on your essay organization, thesis clarity, and paragraph flow.</p>
            </div>
            
            {/* Grammar Check - Black woman */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-gray-300 transition-all">
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
              <h3 className="font-semibold text-gray-900 text-lg mb-2">Grammar Check</h3>
              <p className="text-base text-gray-600 leading-relaxed">Catch grammar, spelling, and punctuation errors with AI-powered suggestions.</p>
            </div>
            
            {/* Citation Checker - White man with glasses */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-gray-300 transition-all">
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
              <h3 className="font-semibold text-gray-900 text-lg mb-2">Citation Checker</h3>
              <p className="text-base text-gray-600 leading-relaxed">Validate APA, MLA, Chicago, and Harvard citations. Fix formatting errors.</p>
            </div>
            
            {/* Academic Tone - Hispanic woman */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-gray-300 transition-all">
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
              <h3 className="font-semibold text-gray-900 text-lg mb-2">Academic Tone</h3>
              <p className="text-base text-gray-600 leading-relaxed">Ensure your writing maintains appropriate formality and discipline conventions.</p>
            </div>
            
            {/* Clarity Feedback - South Asian man */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-gray-300 transition-all">
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
              <h3 className="font-semibold text-gray-900 text-lg mb-2">Clarity Feedback</h3>
              <p className="text-base text-gray-600 leading-relaxed">Identify unclear sentences and get suggestions for clearer expression.</p>
            </div>
            
            {/* Source Finder - East Asian woman */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-gray-300 transition-all">
              <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center mb-4 overflow-hidden">
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
              <h3 className="font-semibold text-gray-900 text-lg mb-2">Source Finder</h3>
              <p className="text-base text-gray-600 leading-relaxed">Search millions of academic papers to find relevant citations for your topic.</p>
            </div>
          </div>
            </div>
      </section>

      {/* FAQ Section - bigger */}
      <section className="py-20 sm:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 text-center mb-5">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600 text-center">
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
              <div key={idx} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <button
                  onClick={() => setOpenFAQ(openFAQ === idx ? null : idx)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-gray-900 text-lg pr-4">{faq.question}</span>
                  <svg className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${openFAQ === idx ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                  </button>
                <div className={`overflow-hidden transition-all duration-300 ${openFAQ === idx ? 'max-h-56' : 'max-h-0'}`}>
                  <div className="px-6 pb-5 text-gray-600 text-base leading-relaxed">{faq.answer}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section - bigger */}
      <section id="pricing" className="py-20 sm:py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative mb-8">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 text-center mb-5">
              Simple Pricing
            </h2>
            <p className="text-lg text-gray-600 text-center">Start free. Upgrade when you need more.</p>
            {/* Cute person - presenting the pricing */}
            <div className="hidden lg:block absolute left-16 xl:left-24 top-1/2 -translate-y-1/2 w-24 h-28">
              <svg viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                {/* Body */}
                <path d="M35 70 Q30 95 35 115 L65 115 Q70 95 65 70" fill="#10B981" />
                {/* Neck */}
                <rect x="44" y="52" width="12" height="20" fill="#D4A574" />
                {/* Head */}
                <ellipse cx="50" cy="32" rx="24" ry="26" fill="#D4A574" />
                {/* Hair - long dark */}
                <path d="M26 28 Q24 12 36 8 Q50 2 64 8 Q76 12 74 28 Q72 20 60 14 Q50 10 40 14 Q30 20 26 28" fill="#1F2937" />
                <path d="M26 28 Q18 50 26 75" fill="#1F2937" />
                <path d="M74 28 Q82 50 74 75" fill="#1F2937" />
                {/* Eyes - happy */}
                <path d="M36 30 Q40 26 44 30" stroke="#1F2937" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <path d="M56 30 Q60 26 64 30" stroke="#1F2937" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                {/* Eyebrows */}
                <path d="M34 22 Q40 18 46 22" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round" />
                <path d="M54 22 Q60 18 66 22" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round" />
                {/* Big smile */}
                <path d="M38 42 Q50 54 62 42" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round" />
                {/* Teeth */}
                <path d="M42 44 L58 44" stroke="white" strokeWidth="3" strokeLinecap="round" />
                {/* Cheeks */}
                <ellipse cx="30" cy="36" rx="5" ry="3" fill="#FECACA" opacity="0.5" />
                <ellipse cx="70" cy="36" rx="5" ry="3" fill="#FECACA" opacity="0.5" />
                {/* Presenting arm */}
                <path d="M70 75 Q88 65 95 50" stroke="#D4A574" strokeWidth="10" fill="none" strokeLinecap="round" />
                <ellipse cx="97" cy="48" rx="7" ry="8" fill="#D4A574" />
                {/* Dollar sign sparkle */}
                <circle cx="92" cy="25" r="8" fill="#FEF3C7" />
                <text x="92" y="29" textAnchor="middle" fontSize="12" fill="#F59E0B" fontWeight="bold">$</text>
              </svg>
            </div>
          </div>
          
          <div className="flex items-center justify-center space-x-4 mb-12">
            <span className={`text-base ${billingCycle === 'monthly' ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>Monthly</span>
                <button
                  onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
              className="relative w-12 h-7 bg-gray-200 rounded-full transition-colors"
            >
              <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
            <span className={`text-base ${billingCycle === 'annual' ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>Annual</span>
            {billingCycle === 'annual' && <span className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">Save 17%</span>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-1">Free</h3>
              <p className="text-base text-gray-500 mb-5">Perfect for getting started</p>
              <div className="text-4xl font-bold text-gray-900 mb-8">$0<span className="text-lg font-normal text-gray-500">/mo</span></div>
              <ul className="space-y-4 mb-8 text-base text-gray-600">
                <li className="flex items-start"><svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>3 documents per month</li>
                <li className="flex items-start"><svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>Basic AI analysis</li>
                <li className="flex items-start"><svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>Standard citation styles</li>
                <li className="flex items-start"><svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>Email support</li>
                <li className="flex items-start"><svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>Basic grammar check</li>
              </ul>
              <button onClick={() => onNavigate('signup')} className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium rounded-xl transition-colors text-base">Get Started Free</button>
            </div>

            {/* Starter */}
            <div className="bg-white border-2 border-blue-500 rounded-2xl p-8 relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-sm font-semibold px-4 py-1 rounded-full">Popular</div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Starter</h3>
              <p className="text-base text-gray-500 mb-5">Most popular for students</p>
              <div className="text-4xl font-bold text-gray-900 mb-8">
                {billingCycle === 'monthly' ? '$19.99' : '$16.67'}<span className="text-lg font-normal text-gray-500">/mo</span>
              </div>
              {billingCycle === 'annual' && <p className="text-sm text-green-600 font-medium -mt-6 mb-6">$199.99 billed annually</p>}
              <ul className="space-y-4 mb-8 text-base text-gray-600">
                <li className="flex items-start"><svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>Unlimited document uploads</li>
                <li className="flex items-start"><svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>999 AI analyses per month</li>
                <li className="flex items-start"><svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>All citation styles</li>
                <li className="flex items-start"><svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>Grammar and style checks</li>
                <li className="flex items-start"><svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>Export in multiple file formats</li>
              </ul>
              <button onClick={() => onNavigate('signup')} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors text-base">Get Started</button>
            </div>

            {/* Premium */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-1">Premium</h3>
              <p className="text-base text-gray-500 mb-5">For researchers and institutions</p>
              <div className="text-4xl font-bold text-gray-900 mb-8">
                {billingCycle === 'monthly' ? '$39.99' : '$33.33'}<span className="text-lg font-normal text-gray-500">/mo</span>
              </div>
              {billingCycle === 'annual' && <p className="text-sm text-green-600 font-medium -mt-6 mb-6">$399.99 billed annually</p>}
              <ul className="space-y-4 mb-8 text-base text-gray-600">
                <li className="flex items-start"><svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>Everything in Starter</li>
                <li className="flex items-start"><svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>999 AI analyses per month</li>
                <li className="flex items-start"><svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>Advanced AI analysis</li>
                <li className="flex items-start"><svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>Advanced grammar and style checking</li>
                <li className="flex items-start"><svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>Additional premium features</li>
              </ul>
              <button onClick={() => onNavigate('signup')} className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-xl transition-colors text-base">Get Started</button>
            </div>
          </div>
            </div>
      </section>

      {/* Final CTA - bigger */}
      <section className="py-20 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 sm:p-12 lg:p-16 relative overflow-hidden">
            {/* Text content - always centered */}
            <div className="text-center relative z-10">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-5">
                Ready to improve your writing?
              </h2>
              <p className="text-lg text-gray-600 mb-10 max-w-xl mx-auto">
                Start analyzing your essays and finding citations for free. No credit card required.
              </p>
              <button 
                onClick={() => onNavigate('signup')}
                className="inline-flex items-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-lg hover:shadow-xl text-lg"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 max-w-sm mx-4 shadow-2xl text-center">
            <div className="w-12 h-12 mx-auto mb-4">
              <svg className="animate-spin w-12 h-12 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Finding Citations</h3>
            <p className="text-sm text-gray-500">Searching academic databases...</p>
          </div>
        </div>
      )}

      {showFakeAnimation && mode === 'analyze' && (
        <AnalysisAnimation isPopup={true} text="Analyzing your writing" isComplete={false} />
      )}
    </main>
  );
};

export default LandingPage;
