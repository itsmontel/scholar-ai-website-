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
  const [showFakeAnimation, setShowFakeAnimation] = useState(false);
  const [activeToolHover, setActiveToolHover] = useState<string | null>(null);

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
      localStorage.setItem('pendingCitationSearch', JSON.stringify({ topic: inputText, style: citationStyle }));
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
  const CharacterIllustration = () => (
    <div className="absolute right-2 top-0 w-20 h-28 sm:right-4 sm:w-24 sm:h-32 xl:-right-32 xl:w-28 xl:h-36 pointer-events-none z-10">
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
            {/* Desktop Sidebar - aligned with H1 */}
            <div className="hidden lg:flex flex-col space-y-1 pr-6 xl:pr-10">
              {sidebarTools.map((tool) => (
                <button
                  key={tool.id}
                  onMouseEnter={() => setActiveToolHover(tool.id)}
                  onMouseLeave={() => setActiveToolHover(null)}
                  onClick={() => onNavigate('signup')}
                  className={`relative flex flex-col items-center p-3 rounded-xl transition-all ${
                    activeToolHover === tool.id ? 'bg-gray-50 scale-105' : ''
                  }`}
                >
                  <div className={`w-12 h-12 ${tool.bg} rounded-xl flex items-center justify-center mb-1.5`}>
                    <span className={`${tool.color} font-bold text-base`}>{tool.icon}</span>
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

              {/* Citation Style (citations mode only) */}
              {mode === 'citations' && (
                <div className="flex justify-center mb-4">
                  <div className="inline-flex items-center bg-gray-50 rounded-lg px-4 py-2 text-base">
                    <span className="text-gray-500 mr-2">Style:</span>
                    <select
                      value={citationStyle}
                      onChange={(e) => setCitationStyle(e.target.value)}
                      className="bg-transparent font-medium text-gray-900 outline-none cursor-pointer"
                    >
                      <option value="APA">APA 7th</option>
                      <option value="MLA">MLA 9th</option>
                      <option value="Chicago">Chicago</option>
                      <option value="Harvard">Harvard</option>
                      <option value="IEEE">IEEE</option>
                      <option value="Vancouver">Vancouver</option>
                    </select>
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

              {/* Suggested Topics - bigger */}
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

      {/* See WriteScholar in Action */}
      <section className="py-20 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 text-center mb-5">
            See WriteScholar in Action
          </h2>
          <p className="text-lg text-gray-600 text-center mb-16 max-w-2xl mx-auto">
            Real examples of how our AI analyzes and improves academic writing
          </p>

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
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 text-center mb-5">
            Everything You Need for Better Writing
          </h2>
          <p className="text-lg text-gray-600 text-center mb-14 max-w-2xl mx-auto">
            WriteScholar combines multiple tools to help you write better academic papers
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {[
              { title: 'Structure Analysis', desc: 'Get feedback on your essay organization, thesis clarity, and paragraph flow.', color: 'blue' },
              { title: 'Grammar Check', desc: 'Catch grammar, spelling, and punctuation errors with AI-powered suggestions.', color: 'green' },
              { title: 'Citation Checker', desc: 'Validate APA, MLA, Chicago, and Harvard citations. Fix formatting errors.', color: 'purple' },
              { title: 'Academic Tone', desc: 'Ensure your writing maintains appropriate formality and discipline conventions.', color: 'orange' },
              { title: 'Clarity Feedback', desc: 'Identify unclear sentences and get suggestions for clearer expression.', color: 'pink' },
              { title: 'Source Finder', desc: 'Search millions of academic papers to find relevant citations for your topic.', color: 'indigo' }
            ].map((feature, idx) => (
              <div key={idx} className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-gray-300 transition-all">
                <div className={`w-12 h-12 bg-${feature.color}-100 rounded-xl flex items-center justify-center mb-4`}>
                  <div className={`w-6 h-6 bg-${feature.color}-500 rounded`}></div>
                </div>
                <h3 className="font-semibold text-gray-900 text-lg mb-2">{feature.title}</h3>
                <p className="text-base text-gray-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section - bigger */}
      <section className="py-20 sm:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 text-center mb-5">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-gray-600 text-center mb-12">
            Everything you need to know about WriteScholar
          </p>

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
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 text-center mb-5">
            Simple Pricing
          </h2>
          <p className="text-lg text-gray-600 text-center mb-8">Start free. Upgrade when you need more.</p>
          
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
              <p className="text-base text-gray-500 mb-5">Get started</p>
              <div className="text-4xl font-bold text-gray-900 mb-8">$0<span className="text-lg font-normal text-gray-500">/mo</span></div>
              <ul className="space-y-4 mb-8 text-base text-gray-600">
                <li className="flex items-start"><svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>3 analyses per month</li>
                <li className="flex items-start"><svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>2 citation searches</li>
                <li className="flex items-start"><svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>Basic grammar check</li>
              </ul>
              <button onClick={() => onNavigate('signup')} className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium rounded-xl transition-colors text-base">Get Started</button>
            </div>

            {/* Starter */}
            <div className="bg-white border-2 border-blue-500 rounded-2xl p-8 relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-sm font-semibold px-4 py-1 rounded-full">Popular</div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Starter</h3>
              <p className="text-base text-gray-500 mb-5">For students</p>
              <div className="text-4xl font-bold text-gray-900 mb-8">
                {billingCycle === 'monthly' ? '$19.99' : '$16.67'}<span className="text-lg font-normal text-gray-500">/mo</span>
              </div>
              <ul className="space-y-4 mb-8 text-base text-gray-600">
                <li className="flex items-start"><svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>Unlimited analyses</li>
                <li className="flex items-start"><svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>Unlimited citations</li>
                <li className="flex items-start"><svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>All citation styles</li>
                <li className="flex items-start"><svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>Advanced grammar</li>
              </ul>
              <button onClick={() => onNavigate('signup')} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors text-base">Get Started</button>
            </div>

            {/* Premium */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-1">Premium</h3>
              <p className="text-base text-gray-500 mb-5">For researchers</p>
              <div className="text-4xl font-bold text-gray-900 mb-8">
                {billingCycle === 'monthly' ? '$39.99' : '$33.33'}<span className="text-lg font-normal text-gray-500">/mo</span>
              </div>
              <ul className="space-y-4 mb-8 text-base text-gray-600">
                <li className="flex items-start"><svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>Everything in Starter</li>
                <li className="flex items-start"><svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>Thesis/dissertation</li>
                <li className="flex items-start"><svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>Priority support</li>
              </ul>
              <button onClick={() => onNavigate('signup')} className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-xl transition-colors text-base">Get Started</button>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA - bigger */}
      <section className="py-20 sm:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-5">
            Ready to improve your writing?
          </h2>
          <p className="text-lg text-gray-600 mb-10">
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
