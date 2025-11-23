import React, { useState } from 'react';
import Footer from '../common/Footer';
import AnalysisAnimation from '../common/AnalysisAnimation';

// Import images from assets folder
import philosophyImage from '../../assets/images/Philosophy.png';
import multiculturalImage from '../../assets/images/Multiculturalfilmpaper.png';
import customersImage from '../../assets/images/CustomersWriteScholar.png';

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

const LandingPage = ({ onNavigate }: LandingPageProps) => {
  const [inputText, setInputText] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [hoveredAnnotation, setHoveredAnnotation] = useState<any>(null);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [mode, setMode] = useState<'analyze' | 'citations'>('analyze');
  const [citationStyle, setCitationStyle] = useState('APA');
  const [showFakeAnimation, setShowFakeAnimation] = useState(false);

  const analyzePlaceholders = [
    "Enhance your academic writing with a simple paste and click.",
    "Get instant feedback on your essay or thesis.",
    "Turn good writing into great writing with WriteScholar."
  ];

  const citationPlaceholders = [
    "Enter your essay question or research topic to find relevant citations...",
    "What's your research topic? Get academic sources instantly.",
    "Type your assignment question and discover relevant literature."
  ];

  const placeholders = mode === 'analyze' ? analyzePlaceholders : citationPlaceholders;

  const reviews = [
    {
      text: "WriteScholar has revolutionized my research writing process. The AI feedback is incredibly detailed and helped me improve my argumentation and academic style significantly."
    },
    {
      text: "WriteScholar's annotation system is exactly what I needed for my thesis. The color-coded feedback makes it easy to prioritize improvements and track my progress over time."
    },
    {
      text: "As a professor, I recommend WriteScholar to all my students. It provides the kind of detailed feedback that would normally take hours of manual review. A game-changer for academic writing."
    }
  ];

  const examplePapers = [
    {
      title: "Philosophy Essay Analysis",
      subtitle: "Justice & Ethics Paper • Analyzed Oct 29, 2025",
      isImage: true,
      imagePath: philosophyImage,
      feature: "Real-time Analysis",
      description: "Instant feedback with detailed annotations highlighting strengths and improvement areas.",
      summary: {
        general: "This philosophy essay demonstrates strong engagement with Plato's Republic and creative use of modern examples, though transitions and academic support need strengthening.",
        goods: [
          "Excellent integration of classical philosophy with contemporary examples (The Dark Knight)",
          "Clear thesis comparing Glaucon's and Socrates' views on justice",
          "Strong opening that establishes the philosophical debate",
          "Creative approach to illustrating abstract concepts with concrete examples"
        ],
        improvements: [
          "Strengthen transitions between Glaucon's and Socrates' arguments for better flow",
          "Add more academic citations and research evidence to support claims",
          "Improve connection between The Dark Knight examples and Socrates' argument"
        ],
        concerns: [
          "Some sections need more academic evidence and scholarly support",
          "Transitions between ideas could be smoother and more explicit",
          "Consider developing the connection between modern examples and classical philosophy"
        ]
      }
    },
    {
      title: "Multicultural Film Analysis",
      subtitle: "Film Studies Essay • Analyzed Oct 29, 2025",
      isImage: true,
      imagePath: multiculturalImage,
      feature: "Citation Enhancement",
      description: "AI-powered suggestions for better source integration and citation formatting.",
      summary: {
        general: "This film studies paper demonstrates strong analytical engagement with multicultural cinema, though citation formatting and theoretical framework integration need improvement.",
        goods: [
          "Excellent critical analysis of cultural representation in contemporary cinema",
          "Strong use of film theory and scholarly sources to support arguments",
          "Clear thesis statement addressing multiculturalism and identity in film",
          "Good integration of specific film examples to illustrate theoretical concepts"
        ],
        improvements: [
          "Strengthen citation formatting to ensure consistency with MLA/Chicago style",
          "Expand theoretical framework discussion for deeper academic grounding",
          "Add more comparative analysis between different cultural perspectives in films"
        ],
        concerns: [
          "Some citations need proper formatting and complete bibliographic information",
          "Theoretical framework could be more explicitly connected to film examples",
          "Consider adding more recent scholarly sources to strengthen contemporary relevance"
        ]
      }
    }
  ];

  const faqs = [
    {
      question: "How does WriteScholar's AI analysis work?",
      answer: "WriteScholar uses advanced natural language processing to analyze your academic writing for structure, clarity, grammar, citations, and academic rigor. Our AI provides detailed feedback similar to what you'd receive from a professor or writing tutor."
    },
    {
      question: "Is my document content secure and private?",
      answer: "Yes, absolutely. We use enterprise-grade encryption to protect your documents. Your content is never shared with third parties, and you can delete your documents at any time. We're SOC 2 Type II compliant."
    },
    {
      question: "What file formats does WriteScholar support?",
      answer: "WriteScholar supports PDF, Word documents (.docx), and plain text. You can also paste text directly into our editor. We're working on adding support for LaTeX and other academic formats."
    },
    {
      question: "Can I use WriteScholar for different citation styles?",
      answer: "Yes! WriteScholar supports APA, MLA, Chicago, Harvard, and many other citation styles. You can specify your preferred style, and our AI will check your citations accordingly."
    },
    {
      question: "How accurate is the AI feedback?",
      answer: "Our AI has been trained on thousands of academic papers and provides feedback comparable to human reviewers. While it's highly accurate, we recommend using it as a supplement to, not a replacement for, human review."
    }
  ];

  React.useEffect(() => {
    const interval = setInterval(() => {
      if (!isFocused) {
        setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [isFocused, placeholders.length]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setReviewIndex((prev) => (prev + 1) % reviews.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [reviews.length]);


  const handleSubmit = () => {
    // Show fake animation for unauthenticated users
    setShowFakeAnimation(true);
    
    // Store the search parameters for after signup
    if (mode === 'citations') {
      localStorage.setItem('pendingCitationSearch', JSON.stringify({
        topic: inputText,
        style: citationStyle
      }));
    } else {
      localStorage.setItem('pendingAnalysis', JSON.stringify({
        text: inputText
      }));
    }
    
    // After 3-5 seconds, navigate to signup
    setTimeout(() => {
      setShowFakeAnimation(false);
      onNavigate('signup');
    }, 4000); // 4 seconds
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden px-2 sm:px-8">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/20 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-purple-100/20 via-transparent to-transparent"></div>
      
      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-2 sm:px-8 md:px-16 py-4 sm:py-6 backdrop-blur-sm bg-white/80 border-b border-white/20">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-xl sm:text-2xl">W</span>
          </div>
          <span className="text-lg sm:text-2xl font-bold text-gray-900">WriteScholar</span>
        </div>
        <div className="hidden md:flex items-center space-x-8">
          <button 
            onClick={() => onNavigate('features')}
            className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
          >
            Features
          </button>
          <button 
            onClick={() => {
              const pricingSection = document.getElementById('pricing');
              if (pricingSection) {
                pricingSection.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
          >
            Pricing
          </button>
          <button 
            onClick={() => onNavigate('about')}
            className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
          >
            About
          </button>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button 
            onClick={() => onNavigate('login')}
            className="text-gray-600 hover:text-gray-900 transition-colors font-medium px-2 sm:px-4 py-2 rounded-lg hover:bg-gray-100/50 text-sm sm:text-base"
          >
            Login
          </button>
          <button 
            onClick={() => onNavigate('signup')}
            className="bg-gradient-to-r from-gray-900 to-gray-800 text-white px-3 sm:px-6 py-2 sm:py-2.5 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium text-sm sm:text-base"
          >
            Sign up
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 max-w-8xl mx-auto px-2 sm:px-8 md:px-16 py-8 sm:py-16 md:py-24">
        <div className="text-center mb-8 sm:mb-16 md:mb-20">
          {/* Mobile: Clean, bold headline */}
          <h1 className="text-5xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-4 sm:mb-8 leading-tight tracking-tight">
            {mode === 'analyze' ? (
              <>
                <span className="sm:hidden block">Your AI<br />writing<br />assistant</span>
                <span className="hidden sm:inline">Enhance your academic<br className="hidden sm:block" />writing with <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">WriteScholar</span></span>
              </>
            ) : (
              <>
                <span className="sm:hidden block">Find citations<br />instantly</span>
                <span className="hidden sm:inline">Find relevant citations<br className="hidden sm:block" />for your <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">research</span></span>
              </>
            )}
          </h1>
          <p className="text-lg sm:text-lg md:text-xl lg:text-2xl text-gray-600 mb-6 sm:mb-12 max-w-3xl mx-auto leading-relaxed font-light px-2 sm:px-6">
            {mode === 'analyze' 
              ? (
                <>
                  <span className="sm:hidden block text-base">Get instant AI feedback on your academic writing</span>
                  <span className="hidden sm:inline">Get detailed feedback on your research papers, essays, and academic work with AI-powered analysis that helps you write like a scholar.</span>
                </>
              )
              : (
                <>
                  <span className="sm:hidden block text-base">Get relevant academic citations instantly</span>
                  <span className="hidden sm:inline">Enter your essay question or research topic and get relevant academic citations instantly from journals, books, and scholarly sources.</span>
                </>
              )
            }
          </p>
 
          {/* Mobile: Feature list with checkmarks */}
          <div className="sm:hidden mb-8">
            <div className="flex flex-col items-start max-w-sm mx-auto space-y-3 text-left">
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700 text-sm font-medium">Quick structure analysis</span>
              </div>
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700 text-sm font-medium">Originality checker</span>
              </div>
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700 text-sm font-medium">Automatic citations</span>
              </div>
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700 text-sm font-medium">Grammar & spelling checker</span>
              </div>
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="flex justify-center mb-6 sm:mb-8">
            {/* Mobile: Simple pill buttons */}
            <div className="sm:hidden flex gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => {
                  setMode('analyze');
                  setInputText('');
                }}
                className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 ${
                  mode === 'analyze'
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 bg-transparent'
                }`}
              >
                Essay
              </button>
              <button
                onClick={() => {
                  setMode('citations');
                  setInputText('');
                }}
                className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 ${
                  mode === 'citations'
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 bg-transparent'
                }`}
              >
                Literature review
              </button>
            </div>
            {/* Desktop: Original design */}
            <div className="hidden sm:block bg-white/90 backdrop-blur-xl rounded-full p-1 shadow-lg border border-gray-200/50 inline-flex">
              <button
                onClick={() => {
                  setMode('analyze');
                  setInputText('');
                }}
                className={`px-6 py-3 rounded-full font-semibold text-sm transition-all duration-200 ${
                  mode === 'analyze'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Analyze Text
                </span>
              </button>
              <button
                onClick={() => {
                  setMode('citations');
                  setInputText('');
                }}
                className={`px-6 py-3 rounded-full font-semibold text-sm transition-all duration-200 ${
                  mode === 'citations'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Find Citations
                </span>
              </button>
            </div>
          </div>
          
          {/* Interactive Text Input */}
          <div className="max-w-4xl mx-auto mb-8 sm:mb-12 px-2 sm:px-6">
            {/* Citation Style Selector (only show in citations mode) */}
            {mode === 'citations' && (
              <div className="flex justify-center mb-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 inline-flex items-center sm:bg-white/90 sm:backdrop-blur-xl">
                  <span className="text-sm text-gray-600 mr-2 px-2">Citation Style:</span>
                  <select
                    value={citationStyle}
                    onChange={(e) => setCitationStyle(e.target.value)}
                    className="px-3 py-1 rounded border-none outline-none text-sm font-medium text-gray-700 bg-transparent cursor-pointer"
                  >
                    <option value="APA">APA</option>
                    <option value="MLA">MLA</option>
                    <option value="Chicago">Chicago</option>
                    <option value="Harvard">Harvard</option>
                    <option value="IEEE">IEEE</option>
                    <option value="Vancouver">Vancouver</option>
                  </select>
                </div>
              </div>
            )}

            {/* Mobile: Cleaner input design */}
            <div className="relative">
              <div className="sm:hidden">
                {/* Mobile: Simple, clean input */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={isFocused ? "" : placeholders[placeholderIndex]}
                    className="w-full min-h-24 max-h-48 pb-12 pl-3 pr-3 text-gray-700 border-none outline-none resize-none placeholder-gray-400 bg-transparent text-base font-normal transition-all duration-300 overflow-y-auto leading-relaxed"
                    style={{ 
                      height: 'auto', 
                      lineHeight: '1.6',
                      paddingTop: '0px',
                      marginTop: '0px',
                      fontSize: '16px'
                    }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = Math.min(target.scrollHeight, 192) + 'px';
                    }}
                  />
                  <button
                    onClick={handleSubmit}
                    className="absolute bottom-4 right-4 bg-gray-900 text-white w-10 h-10 rounded-lg hover:bg-gray-800 transition-all duration-300 flex items-center justify-center shadow-md"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
               
              {/* Desktop: Original fancy design */}
              <div className="hidden sm:block relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-indigo-500/20 rounded-2xl sm:rounded-3xl blur-sm"></div>
                <div className="relative bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-white/30 p-4 sm:p-6 md:p-8 hover:shadow-3xl transition-all duration-500">
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={isFocused ? "" : placeholders[placeholderIndex]}
                    className="w-full min-h-24 max-h-48 pb-6 pl-4 md:pl-6 pr-14 sm:pr-20 text-gray-700 border-none outline-none resize-none placeholder-gray-400 bg-transparent text-base md:text-lg font-light transition-all duration-300 overflow-y-auto leading-relaxed"
                    style={{ 
                      height: 'auto', 
                      lineHeight: '1.6',
                      paddingTop: '0px',
                      marginTop: '0px'
                    }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = Math.min(target.scrollHeight, 192) + 'px';
                    }}
                  />
                  <button
                    onClick={handleSubmit}
                    className="absolute bottom-4 right-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white w-12 h-12 rounded-2xl hover:shadow-lg transform hover:scale-110 transition-all duration-300 flex items-center justify-center group z-10"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Suggested Categories - Hidden on mobile for cleaner design */}
            <div className="hidden sm:block mt-8 text-center">
              <div className="flex flex-wrap justify-center gap-3">
                {mode === 'analyze' ? (
                  <>
                    <button className="px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-white hover:shadow-md transition-all duration-200">
                      Research Paper
                    </button>
                    <button className="px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-white hover:shadow-md transition-all duration-200">
                      Thesis Draft
                    </button>
                    <button className="px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-white hover:shadow-md transition-all duration-200">
                      Essay Analysis
                    </button>
                    <button className="px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-white hover:shadow-md transition-all duration-200">
                      Literature Review
                    </button>
                  </>
                ) : (
                  <>
                    <button className="px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-white hover:shadow-md transition-all duration-200">
                      Psychology
                    </button>
                    <button className="px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-white hover:shadow-md transition-all duration-200">
                      Sociology
                    </button>
                    <button className="px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-white hover:shadow-md transition-all duration-200">
                      History
                    </button>
                    <button className="px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-white hover:shadow-md transition-all duration-200">
                      Literature
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Trusted By Universities Section */}
        <div className="text-center mb-12 sm:mb-16 px-2 sm:px-8 md:px-16">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
              <p className="text-gray-700 font-semibold text-xl sm:text-2xl mb-0">Trusted by students around the world</p>
              <img 
                src={customersImage} 
                alt="WriteScholar Customers" 
                className="h-20 sm:h-20 md:h-24 lg:h-32 w-auto object-contain"
              />
            </div>
            <p className="text-gray-500 text-sm sm:text-base mb-8">Join thousands of students improving their academic writing</p>
            <div className="relative overflow-hidden py-8 bg-white border border-gray-100 rounded-xl shadow-sm">
              {/* Gradient overlays for fade effect */}
              <div className="absolute left-0 top-0 bottom-0 w-24 sm:w-40 bg-gradient-to-r from-white via-white to-transparent z-10 pointer-events-none"></div>
              <div className="absolute right-0 top-0 bottom-0 w-24 sm:w-40 bg-gradient-to-l from-white via-white to-transparent z-10 pointer-events-none"></div>
              
              {/* Animated carousel */}
              <div className="flex animate-scroll-slow items-center" style={{ width: 'max-content' }}>
                {/* First set of universities */}
                <div className="flex space-x-12 sm:space-x-16 px-8 flex-shrink-0">
                  {/* Harvard */}
                  <div className="flex items-center justify-center min-w-[120px] sm:min-w-[140px]">
                    <span className="university-harvard text-2xl sm:text-3xl">HARVARD</span>
                  </div>
                  
                  {/* Yale */}
                  <div className="flex items-center justify-center min-w-[120px] sm:min-w-[140px]">
                    <span className="university-yale text-2xl sm:text-3xl">YALE</span>
                  </div>
                  
                  {/* Oxford */}
                  <div className="flex items-center justify-center min-w-[120px] sm:min-w-[140px]">
                    <span className="university-oxford text-2xl sm:text-3xl">OXFORD</span>
                  </div>
                  
                  {/* MIT */}
                  <div className="flex items-center justify-center min-w-[120px] sm:min-w-[140px]">
                    <span className="university-mit text-2xl sm:text-3xl">MIT</span>
                  </div>
                  
                  {/* Cambridge */}
                  <div className="flex items-center justify-center min-w-[120px] sm:min-w-[140px]">
                    <span className="university-cambridge text-2xl sm:text-3xl">CAMBRIDGE</span>
                  </div>
                  
                  {/* Stanford */}
                  <div className="flex items-center justify-center min-w-[120px] sm:min-w-[140px]">
                    <span className="university-stanford text-2xl sm:text-3xl">STANFORD</span>
                  </div>
                  
                  {/* Princeton */}
                  <div className="flex items-center justify-center min-w-[120px] sm:min-w-[140px]">
                    <span className="university-princeton text-2xl sm:text-3xl">PRINCETON</span>
                  </div>
                </div>
                
                {/* Duplicate set for seamless loop */}
                <div className="flex space-x-12 sm:space-x-16 px-8 flex-shrink-0">
                  {/* Harvard */}
                  <div className="flex items-center justify-center min-w-[120px] sm:min-w-[140px]">
                    <span className="university-harvard text-2xl sm:text-3xl">HARVARD</span>
                  </div>
                  
                  {/* Yale */}
                  <div className="flex items-center justify-center min-w-[120px] sm:min-w-[140px]">
                    <span className="university-yale text-2xl sm:text-3xl">YALE</span>
                  </div>
                  
                  {/* Oxford */}
                  <div className="flex items-center justify-center min-w-[120px] sm:min-w-[140px]">
                    <span className="university-oxford text-2xl sm:text-3xl">OXFORD</span>
                  </div>
                  
                  {/* MIT */}
                  <div className="flex items-center justify-center min-w-[120px] sm:min-w-[140px]">
                    <span className="university-mit text-2xl sm:text-3xl">MIT</span>
                  </div>
                  
                  {/* Cambridge */}
                  <div className="flex items-center justify-center min-w-[120px] sm:min-w-[140px]">
                    <span className="university-cambridge text-2xl sm:text-3xl">CAMBRIDGE</span>
                  </div>
                  
                  {/* Stanford */}
                  <div className="flex items-center justify-center min-w-[120px] sm:min-w-[140px]">
                    <span className="university-stanford text-2xl sm:text-3xl">STANFORD</span>
                  </div>
                  
                  {/* Princeton */}
                  <div className="flex items-center justify-center min-w-[120px] sm:min-w-[140px]">
                    <span className="university-princeton text-2xl sm:text-3xl">PRINCETON</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

         {/* Interactive Annotation Examples */}
         <div className="max-w-full mx-auto mb-16 sm:mb-24 md:mb-32 px-2 sm:px-8 md:px-12 lg:px-20">
           <div className="text-center mb-12 sm:mb-16 md:mb-20">
             <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 sm:mb-8 tracking-tight">See WriteScholar in Action</h2>
             <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 font-light max-w-4xl mx-auto leading-relaxed px-2 sm:px-6">Real examples of how our AI analyzes and improves academic writing</p>
             </div>
           
           {/* Three Separate Papers */}
          <div className="space-y-12 sm:space-y-16 md:space-y-20">
            {examplePapers.map((paper, paperIndex) => (
              <div key={paperIndex} className="max-w-5xl mx-auto">
                {/* Document Display */}
                <div className="relative group">
                   <div className="absolute -inset-1 bg-gradient-to-r from-green-400/30 to-amber-400/30 rounded-3xl blur-sm opacity-0 group-hover:opacity-100 transition duration-700"></div>
                   <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 hover:shadow-3xl transition-all duration-700 overflow-hidden">
                     <div className="p-6 border-b border-gray-100">
                       <h3 className="text-xl font-semibold text-gray-900 mb-1">{paper.title}</h3>
                       <p className="text-sm text-gray-500 font-medium">{paper.subtitle}</p>
                     </div>
                     
                    <div className="p-6">
                      {paper.isImage ? (
                        // Display image for image-based examples
                        <div className="w-full">
                          <img 
                            src={paper.imagePath} 
                            alt={paper.title}
                            className="w-full h-auto rounded-lg shadow-lg"
                            onError={(e) => {
                              console.error('Failed to load image:', paper.imagePath);
                              console.log('Image error event:', e);
                              // Show a placeholder or hide the image
                              const img = e.currentTarget;
                              img.style.display = 'none';
                              // Show a placeholder div instead
                              const placeholder = document.createElement('div');
                              placeholder.className = 'w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500';
                              placeholder.innerHTML = `<span>Image not available</span>`;
                              img.parentNode?.appendChild(placeholder);
                            }}
                            onLoad={() => {
                              console.log('Image loaded successfully:', paper.imagePath);
                            }}
                            loading="eager"
                          />
                        </div>
                      ) : (
                        // Display text content for text-based examples (not currently used)
                        <>
                          <div className="prose max-w-none">
                            {('content' in paper && paper.content) ? (
                              (paper.content as any[]).map((paragraph: any, pIndex: number) => (
                                <p key={pIndex} className="text-gray-700 leading-relaxed mb-4">
                                  {paragraph.annotations && paragraph.annotations.length > 0 ? (
                                    paragraph.text.split(paragraph.annotations[0].text).map((part: string, partIndex: number) => (
                                      <React.Fragment key={partIndex}>
                                        {part}
                                        {partIndex < paragraph.text.split(paragraph.annotations[0].text).length - 1 && (
                                          <span 
                                            className={`px-2 py-1 rounded border-l-4 cursor-pointer transition-all duration-200 ${
                                              paragraph.annotations[0].type === 'green' 
                                                ? 'bg-green-100 border-green-500 hover:bg-green-200' 
                                                : paragraph.annotations[0].type === 'amber'
                                                ? 'bg-amber-100 border-amber-500 hover:bg-amber-200'
                                                : 'bg-red-100 border-red-500 hover:bg-red-200'
                                            }`}
                                            onMouseEnter={() => setHoveredAnnotation(paragraph.annotations[0])}
                                            onMouseLeave={() => setHoveredAnnotation(null)}
                                          >
                                            {paragraph.annotations[0].text}
                                          </span>
                                        )}
                                      </React.Fragment>
                                    ))
                                  ) : (
                                    paragraph.text
                                  )}
                                </p>
                              ))
                            ) : null}
                          </div>
                          
                          {/* Annotation Legend */}
                          <div className="mt-6 pt-4 border-t border-gray-100">
                            <div className="flex flex-wrap gap-4">
                              <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-green-500 rounded border-l-2 border-green-600 shadow-sm"></div>
                                <span className="text-xs font-medium text-gray-700">Strong sections</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-amber-500 rounded border-l-2 border-amber-600 shadow-sm"></div>
                                <span className="text-xs font-medium text-gray-700">Needs improvement</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-red-500 rounded border-l-2 border-red-600 shadow-sm"></div>
                                <span className="text-xs font-medium text-gray-700">Needs revision</span>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
             ))}
           </div>

          {/* Tooltip */}
          {hoveredAnnotation && (
            <div className="fixed z-50 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg text-sm max-w-xs pointer-events-none"
                 style={{
                   left: '50%',
                   top: '50%',
                   transform: 'translate(-50%, -50%)'
                 }}>
              {hoveredAnnotation.tooltip}
            </div>
          )}
                </div>

        {/* Reviews Section */}
        <div className="text-center mb-16 sm:mb-20 md:mb-24 px-2 sm:px-8 md:px-16">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl p-6 sm:p-8 md:p-12">
                <div className="flex justify-center mb-4 sm:mb-6">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
                    </svg>
                  </div>
                </div>
                <blockquote className="text-base sm:text-lg md:text-xl text-gray-900 mb-6 sm:mb-8 leading-relaxed font-light transition-all duration-500 px-4">
                  "{reviews[reviewIndex].text}"
                </blockquote>
                <div className="flex justify-center mt-6 space-x-3">
                  {reviews.map((_, index) => (
                    <div 
                      key={index}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        index === reviewIndex 
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600' 
                          : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                    ></div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-5xl mx-auto mb-16 sm:mb-24 md:mb-32 px-2 sm:px-6 md:px-8">
        <div className="text-center mb-12 sm:mb-16 md:mb-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 sm:mb-8 tracking-tight">FAQs</h2>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 font-light">Common questions about WriteScholar</p>
          </div>
          
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-gray-400/20 to-gray-500/20 rounded-3xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl border border-white/40 overflow-hidden hover:shadow-2xl transition-all duration-500">
                  <button
                    onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                    className="w-full px-10 py-8 text-left flex items-center justify-between hover:bg-gray-50/50 transition-colors"
                  >
                    <h3 className="text-xl font-semibold text-gray-900 pr-6">{faq.question}</h3>
                    <div className={`w-8 h-8 flex items-center justify-center transition-transform duration-300 ${
                      openFAQ === index ? 'rotate-45' : ''
                    }`}>
                      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                  </button>
                  {openFAQ === index && (
                    <div className="px-10 pb-8">
                      <div className="border-t border-gray-100 pt-6">
                        <p className="text-gray-600 leading-relaxed text-lg">{faq.answer}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="text-center mb-16 sm:mb-24 md:mb-32 px-2 sm:px-6 md:px-8">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 sm:mb-8 tracking-tight">How it works</h2>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 mb-12 sm:mb-16 md:mb-24 font-light max-w-4xl mx-auto leading-relaxed px-2 sm:px-6">Transform your academic writing into polished, professional work in just a few simple steps.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 md:gap-12">
            <div className="text-center group">
                <div className="relative mb-6 sm:mb-8">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/30 to-blue-600/30 rounded-3xl blur-sm opacity-0 group-hover:opacity-100 transition duration-700"></div>
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-xl group-hover:scale-110 transition-all duration-500">
                    <span className="text-white font-bold text-2xl sm:text-3xl">1</span>
                  </div>
              </div>
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6">Upload Your Paper</h3>
                <p className="text-gray-600 leading-relaxed text-sm sm:text-base md:text-lg">Upload your academic document in PDF, Word, or paste your text directly into our secure platform.</p>
            </div>
            <div className="text-center group">
                <div className="relative mb-6 sm:mb-8">
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/30 to-purple-600/30 rounded-3xl blur-sm opacity-0 group-hover:opacity-100 transition duration-700"></div>
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto shadow-xl group-hover:scale-110 transition-all duration-500">
                    <span className="text-white font-bold text-2xl sm:text-3xl">2</span>
                  </div>
                </div>
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6">AI Analysis</h3>
                <p className="text-gray-600 leading-relaxed text-sm sm:text-base md:text-lg">Our advanced AI analyzes your writing for structure, clarity, grammar, citation style, and academic rigor.</p>
              </div>
              <div className="text-center group">
                <div className="relative mb-6 sm:mb-8">
                  <div className="absolute -inset-1 bg-gradient-to-r from-green-500/30 to-green-600/30 rounded-3xl blur-sm opacity-0 group-hover:opacity-100 transition duration-700"></div>
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-3xl flex items-center justify-center mx-auto shadow-xl group-hover:scale-110 transition-all duration-500">
                    <span className="text-white font-bold text-2xl sm:text-3xl">3</span>
                  </div>
                </div>
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6">Review Feedback</h3>
                <p className="text-gray-600 leading-relaxed text-sm sm:text-base md:text-lg">Get detailed, professor-style annotations and suggestions with explanations for every recommendation.</p>
            </div>
            <div className="text-center group">
                <div className="relative mb-6 sm:mb-8">
                  <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/30 to-indigo-600/30 rounded-3xl blur-sm opacity-0 group-hover:opacity-100 transition duration-700"></div>
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-xl group-hover:scale-110 transition-all duration-500">
                    <span className="text-white font-bold text-2xl sm:text-3xl">4</span>
                  </div>
                </div>
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6">Improve & Iterate</h3>
                <p className="text-gray-600 leading-relaxed text-sm sm:text-base md:text-lg">Apply suggestions and re-analyze to continuously enhance your academic writing skills and quality.</p>
              </div>
            </div>
          </div>
          </div>
        </div>

        {/* Pricing Section */}
        <div id="pricing" className="max-w-6xl mx-auto mb-16 sm:mb-24 md:mb-32 px-2 sm:px-6 md:px-8">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
              Simple and transparent pricing
            </h2>
            
            {/* Key Benefits */}
            <div className="flex justify-center items-center space-x-12 mb-10">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <span className="text-gray-700 text-sm font-medium">A fraction of traditional editing costs</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <span className="text-gray-700 text-sm font-medium">Used by thousands of researchers</span>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Plan</h3>
              <p className="text-gray-600 mb-6">Select the plan that fits your needs.</p>
              
              {/* Billing Toggle */}
              <div className="flex items-center justify-center space-x-4">
                <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>
                  Monthly
                </span>
                <button
                  onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
                  className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className={`text-sm font-medium ${billingCycle === 'annual' ? 'text-gray-900' : 'text-gray-500'}`}>
                  Annual
                </span>
                {billingCycle === 'annual' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                    Save 17%
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16 max-w-6xl mx-auto">
            {/* Free Plan */}
            <div className="relative bg-white/90 backdrop-blur-xl rounded-2xl border border-gray-200/60 shadow-md hover:shadow-xl hover:border-gray-300/60 transition-all duration-300">
              <div className="p-8">
                {/* Plan Header */}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
                  <p className="text-gray-600 mb-6">Perfect for getting started</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">
                      $0
                    </span>
                    <span className="text-gray-600 ml-2">
                      /month
                    </span>
                  </div>
                </div>

                {/* Features */}
                <div className="mb-8">
                  <ul className="space-y-3">
                    <li className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700 text-sm">1MB total upload limit</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700 text-sm">3 document uploads per month</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700 text-sm">3 AI analyses per month</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700 text-sm">2 citation searches per month</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700 text-sm">50% document annotation only</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700 text-sm">Basic support</span>
                    </li>
                  </ul>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => onNavigate('signup')}
                  className="w-full py-3 px-6 rounded-xl font-semibold text-base transition-all duration-300 bg-gray-900 text-white hover:bg-gray-800"
                >
                  Get Started Free
                </button>
              </div>
            </div>

            {/* Starter Plan */}
            <div className="relative bg-white/90 backdrop-blur-xl rounded-2xl border border-blue-500/60 shadow-lg transition-all duration-300">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-xl text-center font-bold text-sm shadow-lg">
                  Most Popular
                </div>
              </div>

              <div className="p-8">
                {/* Plan Header */}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Starter</h3>
                  <p className="text-gray-600 mb-6">Most popular for students</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">
                      {billingCycle === 'monthly' ? '$19.99' : '$199.99'}
                    </span>
                    <span className="text-gray-600 ml-2">
                      {billingCycle === 'monthly' ? '/month' : '/year'}
                    </span>
                    {billingCycle === 'annual' && (
                      <div className="text-sm text-gray-500 mt-1">
                        $16.67/month billed annually
                      </div>
                    )}
                  </div>
                </div>

                {/* Features */}
                <div className="mb-8">
                  <ul className="space-y-3">
                    <li className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700 text-sm">Unlimited document uploads</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700 text-sm">999 AI analyses per month</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700 text-sm">Unlimited citation searches</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700 text-sm">All citation styles</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700 text-sm">Grammar and style checks</span>
                    </li>
                  </ul>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => onNavigate('signup')}
                  className="w-full py-3 px-6 rounded-xl font-semibold text-base transition-all duration-300 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg"
                >
                  Get Started
                </button>
              </div>
            </div>

            {/* Premium Plan */}
            <div className="relative bg-white/90 backdrop-blur-xl rounded-2xl border border-gray-200/60 shadow-md hover:shadow-xl hover:border-gray-300/60 transition-all duration-300">
              <div className="p-8">
                {/* Plan Header */}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Premium</h3>
                  <p className="text-gray-600 mb-6">For researchers and institutions</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">
                      {billingCycle === 'monthly' ? '$39.99' : '$399.99'}
                    </span>
                    <span className="text-gray-600 ml-2">
                      {billingCycle === 'monthly' ? '/month' : '/year'}
                    </span>
                    {billingCycle === 'annual' && (
                      <div className="text-sm text-gray-500 mt-1">
                        $33.33/month billed annually
                      </div>
                    )}
                    {billingCycle === 'annual' && (
                      <div className="mt-3">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800 border border-green-200">
                          Save 17%
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Features */}
                <div className="mb-8">
                  <ul className="space-y-3">
                    <li className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700 text-sm">Everything in Starter</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700 text-sm">999 AI analyses per month</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700 text-sm">Unlimited citation searches</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700 text-sm">Advanced AI analysis</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700 text-sm">Advanced grammar and style checking</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700 text-sm">Priority support</span>
                    </li>
                  </ul>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => onNavigate('signup')}
                  className="w-full py-3 px-6 rounded-xl font-semibold text-base transition-all duration-300 bg-gray-900 text-white hover:bg-gray-800"
                >
                  Get Started
                </button>
              </div>
            </div>
          </div>

          {/* Annual Pricing Note */}
          <div className="text-center mb-8">
            <p className="text-gray-600 text-sm">
              Annual plans available with 2 months free. 
              <button 
                onClick={() => onNavigate('pricing')}
                className="text-blue-600 hover:text-blue-700 font-medium ml-1"
              >
                View all pricing options →
              </button>
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="relative mb-16 sm:mb-24 md:mb-32 px-2 sm:px-8 md:px-16">
          <div className="max-w-8xl mx-auto">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/30 via-purple-600/30 to-indigo-600/30 rounded-2xl sm:rounded-3xl blur-sm"></div>
            <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl sm:rounded-3xl p-8 sm:p-12 md:p-16 lg:p-20 text-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-indigo-600/10"></div>
          <div className="relative z-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 sm:mb-8 tracking-tight">Ready to enhance your academic writing?</h2>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 mb-10 sm:mb-12 md:mb-16 max-w-3xl mx-auto font-light leading-relaxed px-2 sm:px-6">Join thousands of students and researchers who trust WriteScholar for their writing success.</p>
            <button 
              onClick={() => onNavigate('signup')}
              className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 sm:px-12 md:px-16 py-3 sm:py-4 md:py-5 rounded-xl sm:rounded-2xl text-base sm:text-lg md:text-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300 inline-flex items-center space-x-2 sm:space-x-3"
            >
              <span>Get Started Free</span>
              <span className="text-xl sm:text-2xl">→</span>
            </button>
          </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer onNavigate={onNavigate} />

      {/* Fake Citation Search Animation for unauthenticated users */}
      {showFakeAnimation && mode === 'citations' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl">
            <div className="text-center">
              <div className="relative mb-6">
                <div className="w-16 h-16 mx-auto">
                  <svg className="animate-spin w-16 h-16 text-blue-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Finding Citations</h3>
              <p className="text-gray-600 mb-4">Searching academic databases for relevant sources...</p>
              
              {/* Animated citation icons */}
              <div className="flex justify-center space-x-2 mb-4">
                {['📄', '📚', '📖'].map((icon, index) => (
                  <div
                    key={index}
                    className="text-2xl animate-bounce"
                    style={{ animationDelay: `${index * 0.2}s` }}
                  >
                    {icon}
                  </div>
                ))}
              </div>
              
              <div className="flex justify-center">
                <div className="flex space-x-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"
                      style={{ animationDelay: `${i * 0.3}s` }}
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fake Analysis Animation for unauthenticated users */}
      {showFakeAnimation && mode === 'analyze' && (
        <AnalysisAnimation
          isPopup={true}
          text="Preparing your text for analysis"
          isComplete={false}
        />
      )}
    </div>
  );
};

export default LandingPage;