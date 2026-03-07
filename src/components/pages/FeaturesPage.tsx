import Header from '../common/Header';
import Footer from '../common/Footer';

interface FeaturesPageProps {
  onNavigate: (page: string) => void;
  user?: { 
    id: string;
    name: string; 
    email: string;
    firstName?: string;
    lastName?: string;
    plan: string;
    subscription_status?: string;
    email_verified?: boolean;
  } | null;
  onLogout: () => void;
}

const FeaturesPage = ({ onNavigate, user, onLogout }: FeaturesPageProps) => {
  const benefits = [
    { label: "AI Humanizer", description: "Bypass AI detectors with natural text" },
    { label: "Quiz Generator", description: "Create study quizzes from any text" },
    { label: "Paper Summarizer", description: "Condense articles into key points" },
    { label: "Citation Finder", description: "APA, MLA, Chicago, Harvard styles" },
    { label: "Essay Checker", description: "Professor-style feedback instantly" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/80 via-stone-50 to-white dark:from-stone-950 dark:via-stone-900 dark:to-stone-900">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="features" />

      {/* Hero Section - with illustration like landing page */}
      <section className="relative py-16 sm:py-20 border-b border-stone-200/60 dark:border-stone-700/60 overflow-hidden">
        {/* Floating elements */}
        <div className="absolute top-[35%] left-[5%] hidden xl:block text-4xl opacity-50 animate-float">📝</div>
        <div className="absolute top-[40%] right-[6%] hidden xl:block text-3xl opacity-45 animate-float-delayed">🃏</div>
        <div className="absolute bottom-[35%] left-[6%] hidden xl:block text-3xl opacity-45 animate-float">✨</div>
        <div className="absolute bottom-[30%] right-[5%] hidden xl:block text-4xl opacity-50 animate-float-delayed">📚</div>
        {/* Right character - studying with book (same as landing hero) */}
        <div className="hidden lg:block absolute right-4 xl:right-12 top-1/2 -translate-y-1/2 w-24 h-28 xl:w-28 xl:h-32 z-10 opacity-90 animate-float">
          <svg viewBox="0 0 140 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <path d="M50 95 Q45 125 50 155 L90 155 Q95 125 90 95" fill="#6366F1" />
            <rect x="62" y="72" width="16" height="26" fill="#E8B796" />
            <ellipse cx="70" cy="45" rx="30" ry="33" fill="#E8B796" />
            <path d="M40 38 Q38 18 55 12 Q70 6 88 12 Q105 18 100 38 Q98 28 85 20 Q70 12 55 20 Q42 28 40 38" fill="#4A3728" />
            <path d="M40 38 Q34 50 40 62" fill="#4A3728" />
            <path d="M100 38 Q106 50 100 62" fill="#4A3728" />
            <ellipse cx="58" cy="45" rx="4" ry="5" fill="#1F2937" />
            <ellipse cx="82" cy="45" rx="4" ry="5" fill="#1F2937" />
            <circle cx="59" cy="43" r="1.5" fill="white" />
            <circle cx="83" cy="43" r="1.5" fill="white" />
            <path d="M55 58 Q70 68 85 58" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round" />
            <ellipse cx="42" cy="52" rx="5" ry="3" fill="#FECACA" opacity="0.5" />
            <ellipse cx="98" cy="52" rx="5" ry="3" fill="#FECACA" opacity="0.5" />
            <path d="M45 98 Q20 100 5 115" stroke="#E8B796" strokeWidth="12" fill="none" strokeLinecap="round" />
            <path d="M95 98 Q120 100 135 115" stroke="#E8B796" strokeWidth="12" fill="none" strokeLinecap="round" />
            <ellipse cx="3" cy="118" rx="8" ry="9" fill="#E8B796" />
            <ellipse cx="137" cy="118" rx="8" ry="9" fill="#E8B796" />
            <rect x="25" y="95" width="90" height="55" rx="4" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2" />
            <line x1="70" y1="95" x2="70" y2="150" stroke="#F59E0B" strokeWidth="1.5" />
            <path d="M35 110 Q65 108 95 110" stroke="#92400E" strokeWidth="2" fill="none" />
            <path d="M35 125 Q65 123 95 125" stroke="#92400E" strokeWidth="1.5" fill="none" />
            <path d="M58 95 L70 108 L82 95" stroke="#4F46E5" strokeWidth="2" fill="none" />
          </svg>
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10 lg:gap-12">
            <div className="flex-1 text-center lg:text-left max-w-3xl mx-auto lg:mx-0">
              <span className="inline-flex items-center px-3 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 rounded-full text-sm font-semibold mb-6">
                Features
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-stone-800 dark:text-stone-100 mb-6 leading-tight">
                The complete AI toolkit<br className="hidden sm:block" /> for <span className="bg-gradient-to-r from-indigo-500 to-violet-600 bg-clip-text text-transparent">students</span>
              </h1>
              <p className="text-lg text-stone-500 dark:text-stone-400 leading-relaxed">
                AI Humanizer to bypass detectors, Quiz Generator for exam prep, Paper Summarizer for research, Citation Finder, and Essay Checker. Everything you need in one place.
              </p>
            </div>
            <div className="hidden lg:block flex-shrink-0 w-24 h-28 xl:w-28 xl:h-32" />
          </div>
        </div>
      </section>

      {/* Features Grid with Cute Characters */}
      <section className="py-16 sm:py-20 bg-white dark:bg-stone-900/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* AI-Powered Analysis - Asian man */}
            <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl p-6 hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-600 transition-all">
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
              <h3 className="font-semibold text-stone-800 dark:text-stone-100 text-lg mb-2">AI-Powered Analysis</h3>
              <p className="text-base text-stone-500 dark:text-stone-400 leading-relaxed">Advanced natural language processing provides detailed feedback on your academic writing, identifying strengths and areas for improvement.</p>
            </div>
            
            {/* Citation Generator - Black woman */}
            <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl p-6 hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-600 transition-all">
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mb-4 overflow-hidden">
                <svg viewBox="0 0 56 56" fill="none" className="w-14 h-14">
                  <circle cx="28" cy="28" r="28" fill="#D1FAE5"/>
                  <ellipse cx="28" cy="30" rx="14" ry="15" fill="#8B5A2B"/>
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
              <h3 className="font-semibold text-stone-800 dark:text-stone-100 text-lg mb-2">Citation Generator</h3>
              <p className="text-base text-stone-500 dark:text-stone-400 leading-relaxed">Instantly find and format academic citations in APA, MLA, Chicago, Harvard, IEEE, and Vancouver styles.</p>
            </div>
            
            {/* Grammar & Style Check - White man with glasses */}
            <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl p-6 hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-600 transition-all">
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
              <h3 className="font-semibold text-stone-800 dark:text-stone-100 text-lg mb-2">Grammar & Style Check</h3>
              <p className="text-base text-stone-500 dark:text-stone-400 leading-relaxed">Comprehensive grammar checking, style suggestions, and readability improvements to enhance your writing quality.</p>
            </div>
            
            {/* Document Library - Hispanic woman */}
            <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl p-6 hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-600 transition-all">
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
              <h3 className="font-semibold text-stone-800 dark:text-stone-100 text-lg mb-2">Document Library</h3>
              <p className="text-base text-stone-500 dark:text-stone-400 leading-relaxed">Organize and manage your academic documents with our intuitive library system and cloud storage.</p>
            </div>
            
            {/* Structure Analysis - South Asian man */}
            <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl p-6 hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-600 transition-all">
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
              <h3 className="font-semibold text-stone-800 dark:text-stone-100 text-lg mb-2">Structure Analysis</h3>
              <p className="text-base text-stone-500 dark:text-stone-400 leading-relaxed">Get detailed feedback on your essay structure including introduction, body paragraphs, and conclusion.</p>
            </div>
            
            {/* Academic Vocabulary - East Asian woman */}
            <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl p-6 hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-600 transition-all">
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
              <h3 className="font-semibold text-stone-800 dark:text-stone-100 text-lg mb-2">Academic Vocabulary</h3>
              <p className="text-base text-stone-500 dark:text-stone-400 leading-relaxed">Enhance your writing with suggestions for more formal, academic-appropriate language and terminology.</p>
            </div>

            {/* AI Humanizer */}
            <button onClick={() => onNavigate('humanizer')} className="bg-gradient-to-br from-violet-50 to-purple-50 border-2 border-violet-200 rounded-2xl p-6 hover:shadow-xl hover:border-violet-400 transition-all text-left relative group">
              <div className="absolute top-3 right-3 px-2 py-0.5 bg-violet-500 text-white text-[10px] font-bold rounded-full">FREE</div>
              <div className="w-14 h-14 rounded-full bg-violet-100 flex items-center justify-center mb-4">
                <span className="text-2xl">✨</span>
              </div>
              <h3 className="font-semibold text-violet-700 text-lg mb-2">AI Humanizer</h3>
              <p className="text-base text-stone-500 dark:text-stone-400 leading-relaxed">Transform ChatGPT, Claude, Gemini text into natural human writing. Bypass AI detectors. 5,000 free words/month.</p>
            </button>

            {/* Text Summarizer */}
            <button onClick={() => onNavigate('summarizer')} className="bg-gradient-to-br from-teal-50 to-emerald-50 border-2 border-teal-200 rounded-2xl p-6 hover:shadow-xl hover:border-teal-400 transition-all text-left relative group">
              <div className="absolute top-3 right-3 px-2 py-0.5 bg-teal-500 text-white text-[10px] font-bold rounded-full">FREE</div>
              <div className="w-14 h-14 rounded-full bg-teal-100 flex items-center justify-center mb-4">
                <span className="text-2xl">📝</span>
              </div>
              <h3 className="font-semibold text-teal-700 text-lg mb-2">Paper Summarizer</h3>
              <p className="text-base text-stone-500 dark:text-stone-400 leading-relaxed">Condense research papers, articles, and textbooks into key points. Bullet points or paragraphs. 5,000 free words/month.</p>
            </button>

            {/* Quiz Generator */}
            <button onClick={() => onNavigate('quiz-generator')} className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-6 hover:shadow-xl hover:border-amber-400 transition-all text-left relative group">
              <div className="absolute top-3 right-3 px-2 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-full">PAID</div>
              <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                <span className="text-2xl">🧠</span>
              </div>
              <h3 className="font-semibold text-amber-700 text-lg mb-2">Quiz Generator</h3>
              <p className="text-base text-stone-500 dark:text-stone-400 leading-relaxed">Turn any text into interactive study quizzes. Multiple choice and true/false questions. Perfect for exam prep.</p>
            </button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-800 dark:text-stone-100 mb-4">How it works</h2>
            <p className="text-stone-500 dark:text-stone-400 max-w-xl mx-auto">
              Get started in seconds with any of our AI tools
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl shadow-lg shadow-indigo-500/30">
                1
              </div>
              <h3 className="text-lg font-semibold text-stone-800 dark:text-stone-100 mb-2">Paste your text</h3>
              <p className="text-stone-500 dark:text-stone-400">Paste essays, AI-generated text, research papers, or study notes</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl shadow-lg shadow-indigo-500/30">
                2
              </div>
              <h3 className="text-lg font-semibold text-stone-800 dark:text-stone-100 mb-2">Choose your tool</h3>
              <p className="text-stone-500 dark:text-stone-400">Humanize, summarize, quiz, find citations, or analyze your essay</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl shadow-lg shadow-indigo-500/30">
                3
              </div>
              <h3 className="text-lg font-semibold text-stone-800 dark:text-stone-100 mb-2">Get results</h3>
              <p className="text-stone-500 dark:text-stone-400">Instant results you can copy, study from, or submit with confidence</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 sm:py-20 bg-white dark:bg-stone-900/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-800 dark:text-stone-100 mb-6">Why choose WriteScholar?</h2>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <span className="font-medium text-stone-800 dark:text-stone-100">{benefit.label}</span>
                      <span className="text-stone-500 dark:text-stone-400"> — {benefit.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-stone-800 dark:bg-stone-900 rounded-2xl p-8 text-white border border-stone-700">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center p-4">
                  <div className="text-4xl font-bold mb-1 text-indigo-400">5+</div>
                  <div className="text-stone-300">AI Tools</div>
                </div>
                <div className="text-center p-4">
                  <div className="text-4xl font-bold mb-1 text-indigo-400">1K</div>
                  <div className="text-stone-300">Free Words/Mo</div>
                </div>
                <div className="text-center p-4">
                  <div className="text-4xl font-bold mb-1 text-indigo-400">50K+</div>
                  <div className="text-stone-300">Students</div>
                </div>
                <div className="text-center p-4">
                  <div className="text-4xl font-bold mb-1 text-indigo-400">6</div>
                  <div className="text-stone-300">Citation Styles</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-stone-800 dark:bg-stone-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">
            {user ? 'Start using your AI toolkit' : 'Ready to level up your studies?'}
          </h2>
          <p className="text-stone-400 mb-8 max-w-xl mx-auto">
            {user 
              ? 'Head to your dashboard to humanize text, generate quizzes, summarize papers, find citations, and more.'
              : 'Join thousands of students using AI Humanizer, Quiz Generator, Summarizer, and more.'
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {user ? (
              <>
                <button 
                  onClick={() => onNavigate('dashboard')}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-bold rounded-2xl hover:from-indigo-400 hover:to-violet-500 shadow-lg shadow-indigo-500/25 transition-all"
                >
                  Go to Dashboard
                </button>
                {user.plan === 'Free' && (
                  <button 
                    onClick={() => onNavigate('billing')}
                    className="px-6 py-3 border-2 border-stone-500 text-white font-semibold rounded-2xl hover:border-stone-400 transition-colors"
                  >
                    Upgrade Plan
                  </button>
                )}
              </>
            ) : (
              <>
                <button 
                  onClick={() => onNavigate('signup')}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-bold rounded-2xl hover:from-indigo-400 hover:to-violet-500 shadow-lg shadow-indigo-500/25 transition-all"
                >
                  Try Free
                </button>
                <button 
                  onClick={() => onNavigate('pricing')}
                  className="px-6 py-3 border-2 border-stone-500 text-white font-semibold rounded-2xl hover:border-stone-400 transition-colors"
                >
                  View Pricing
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default FeaturesPage;
