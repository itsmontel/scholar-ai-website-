import Header from '../common/Header';
import Footer from '../common/Footer';
import ScholarMascot from '../common/ScholarMascot';

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
    { label: "Focus Mode", description: "Block websites until you study, earn your screen time" },
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
        {/* Right mascot - studying pose */}
        <div className="hidden lg:block absolute right-4 xl:right-12 top-1/2 -translate-y-1/2 z-10 opacity-90 animate-float">
          <ScholarMascot size={112} animated={true} pose="studying" />
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
                Focus Mode blocks distracting sites until you study. Plus AI Humanizer, Quiz Generator, Paper Summarizer, Citation Finder, and Essay Checker. Everything you need in one place.
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
            {/* AI-Powered Analysis */}
            <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl p-6 hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-600 transition-all">
              <div className="w-14 h-14 flex items-center justify-center mb-4">
                <ScholarMascot size={56} animated={false} pose="analyzing" />
              </div>
              <h3 className="font-semibold text-stone-800 dark:text-stone-100 text-lg mb-2">AI-Powered Analysis</h3>
              <p className="text-base text-stone-500 dark:text-stone-400 leading-relaxed">Advanced natural language processing provides detailed feedback on your academic writing, identifying strengths and areas for improvement.</p>
            </div>
            
            {/* Citation Generator */}
            <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl p-6 hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-600 transition-all">
              <div className="w-14 h-14 flex items-center justify-center mb-4">
                <ScholarMascot size={56} animated={false} pose="studying" />
              </div>
              <h3 className="font-semibold text-stone-800 dark:text-stone-100 text-lg mb-2">Citation Generator</h3>
              <p className="text-base text-stone-500 dark:text-stone-400 leading-relaxed">Instantly find and format academic citations in APA, MLA, Chicago, Harvard, IEEE, and Vancouver styles.</p>
            </div>
            
            {/* Grammar & Style Check */}
            <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl p-6 hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-600 transition-all">
              <div className="w-14 h-14 flex items-center justify-center mb-4">
                <ScholarMascot size={56} animated={false} pose="pointing" />
              </div>
              <h3 className="font-semibold text-stone-800 dark:text-stone-100 text-lg mb-2">Grammar & Style Check</h3>
              <p className="text-base text-stone-500 dark:text-stone-400 leading-relaxed">Comprehensive grammar checking, style suggestions, and readability improvements to enhance your writing quality.</p>
            </div>
            
            {/* Document Library */}
            <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl p-6 hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-600 transition-all">
              <div className="w-14 h-14 flex items-center justify-center mb-4">
                <ScholarMascot size={56} animated={false} pose="default" />
              </div>
              <h3 className="font-semibold text-stone-800 dark:text-stone-100 text-lg mb-2">Document Library</h3>
              <p className="text-base text-stone-500 dark:text-stone-400 leading-relaxed">Organize and manage your academic documents with our intuitive library system and cloud storage.</p>
            </div>
            
            {/* Structure Analysis */}
            <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl p-6 hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-600 transition-all">
              <div className="w-14 h-14 flex items-center justify-center mb-4">
                <ScholarMascot size={56} animated={false} pose="thinking" />
              </div>
              <h3 className="font-semibold text-stone-800 dark:text-stone-100 text-lg mb-2">Structure Analysis</h3>
              <p className="text-base text-stone-500 dark:text-stone-400 leading-relaxed">Get detailed feedback on your essay structure including introduction, body paragraphs, and conclusion.</p>
            </div>
            
            {/* Academic Vocabulary */}
            <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl p-6 hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-600 transition-all">
              <div className="w-14 h-14 flex items-center justify-center mb-4">
                <ScholarMascot size={56} animated={false} pose="celebrating" />
              </div>
              <h3 className="font-semibold text-stone-800 dark:text-stone-100 text-lg mb-2">Academic Vocabulary</h3>
              <p className="text-base text-stone-500 dark:text-stone-400 leading-relaxed">Enhance your writing with suggestions for more formal, academic-appropriate language and terminology.</p>
            </div>

            {/* Focus Mode */}
            <button onClick={() => onNavigate('focus-mode')} className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border-2 border-violet-200 dark:border-violet-700 rounded-2xl p-6 hover:shadow-xl hover:border-violet-400 dark:hover:border-violet-500 transition-all text-left relative group">
              <div className="absolute top-3 right-3 px-2 py-0.5 bg-violet-500 text-white text-[10px] font-bold rounded-full">PRO</div>
              <div className="w-14 h-14 rounded-full bg-violet-100 dark:bg-violet-800/50 flex items-center justify-center mb-4">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="font-semibold text-violet-700 dark:text-violet-300 text-lg mb-2">Focus Mode</h3>
              <p className="text-base text-stone-500 dark:text-stone-400 leading-relaxed">Block YouTube, TikTok and distracting sites until you answer study questions. Earn your screen time. Chrome extension required.</p>
            </button>

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
