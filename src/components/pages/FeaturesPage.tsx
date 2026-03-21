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
    plan?: string;
    subscription_plan?: string;
    subscription_status?: string;
    email_verified?: boolean;
  } | null;
  onLogout: () => void;
}

const FeaturesPage = ({ onNavigate, user, onLogout }: FeaturesPageProps) => {
  const benefits = [
    { label: "Essay Analyzer", description: "Professor-style feedback on structure, clarity, citations. Grade-level rubric" },
    { label: "Online Citations", description: "Find and format academic sources in APA, MLA, Chicago, Harvard, IEEE, Vancouver" },
    { label: "Study Packs", description: "Quizzes, flashcards, crosswords & lessons from any notes. One paste, five formats" },
    { label: "Focus Mode", description: "Block websites until you study, earn your screen time" },
    { label: "Paper Summarizer", description: "Condense articles and papers into key points" },
    { label: "Badges & achievements", description: "Earn milestones as you study and use the app" }
  ];

  return (
    <div className="min-h-screen relative transition-colors font-sans overflow-x-hidden">
      {/* Mesh gradient background - matches Dashboard & Landing */}
      <div className="fixed inset-0 -z-10 bg-[#faf9f7] dark:bg-stone-950" aria-hidden />
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_120%_80%_at_20%_-10%,rgba(251,207,232,0.4),transparent_50%)] dark:bg-[radial-gradient(ellipse_120%_80%_at_20%_-10%,rgba(251,207,232,0.15),transparent_50%)] pointer-events-none" aria-hidden />
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_100%_60%_at_80%_0%,rgba(196,181,253,0.35),transparent_50%)] dark:bg-[radial-gradient(ellipse_100%_60%_at_80%_0%,rgba(196,181,253,0.12),transparent_50%)] pointer-events-none" aria-hidden />
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_100%,rgba(254,215,170,0.3),transparent_50%)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_100%,rgba(254,215,170,0.1),transparent_50%)] pointer-events-none" aria-hidden />

      {/* Floating blobs - playful like Dashboard */}
      <div className="fixed top-[10%] left-[5%] w-72 h-72 rounded-[40%_60%_70%_30%/40%_50%_60%_50%] bg-gradient-to-br from-fuchsia-300/25 to-fuchsia-400/20 dark:from-fuchsia-500/15 dark:to-fuchsia-600/10 blur-3xl animate-blob-float hidden xl:block pointer-events-none" />
      <div className="fixed top-[20%] right-[10%] w-64 h-64 rounded-[60%_40%_30%_70%/60%_30%_70%_40%] bg-gradient-to-br from-violet-300/25 to-red-400/20 dark:from-violet-500/15 dark:to-red-600/10 blur-3xl animate-blob-float hidden xl:block pointer-events-none" style={{ animationDelay: '-2s' }} />
      <div className="fixed bottom-[25%] left-[15%] w-48 h-48 rounded-[30%_70%_70%_30%/30%_30%_70%_70%] bg-gradient-to-br from-amber-300/20 to-orange-400/15 dark:from-amber-500/10 dark:to-orange-600/8 blur-3xl animate-blob-float hidden lg:block pointer-events-none" style={{ animationDelay: '-4s' }} />

      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="features" />

      {/* Hero Section - glass card style like Landing */}
      <section className="relative py-16 sm:py-20 overflow-hidden">
        <div className="absolute top-[35%] left-[5%] hidden xl:block text-4xl opacity-50 animate-float">📝</div>
        <div className="absolute top-[40%] right-[6%] hidden xl:block text-3xl opacity-45 animate-float-delayed">🃏</div>
        <div className="absolute bottom-[35%] left-[6%] hidden xl:block text-3xl opacity-45 animate-float">✨</div>
        <div className="absolute bottom-[30%] right-[5%] hidden xl:block text-4xl opacity-50 animate-float-delayed">📚</div>
        <div className="hidden lg:block absolute right-4 xl:right-12 top-1/2 -translate-y-1/2 z-10 opacity-90 animate-float">
          <ScholarMascot size={112} animated={true} pose="studying" />
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10 lg:gap-12">
            <div className="flex-1 text-center lg:text-left max-w-3xl mx-auto lg:mx-0">
              <span className="inline-flex items-center px-4 py-1.5 bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-400 rounded-full text-sm font-semibold mb-6">
                Features
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-stone-800 dark:text-stone-100 mb-6 leading-tight">
                <span className="text-violet-500">AI essay feedback</span>, <span className="text-violet-500">study packs</span> & <span className="text-violet-500">focus mode</span>
              </h1>
              <p className="text-lg text-stone-600 dark:text-stone-400 leading-relaxed">
                The all-in-one study app: professor-style essay feedback on every paper, quizzes and flashcards from your notes, and Focus Mode to block TikTok until you study.
              </p>
            </div>
            <div className="hidden lg:block flex-shrink-0 w-24 h-28 xl:w-28 xl:h-32" />
          </div>
        </div>
      </section>

      {/* Flagship Features - Essay Analyzer, Citations, Study Packs, Focus Mode */}
      <section className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <span className="inline-block px-4 py-1.5 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 rounded-full text-sm font-semibold mb-4">
              Flagship Features
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-800 dark:text-stone-100">Our four core tools</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 mb-16">
            {/* Essay Analyzer - Flagship */}
            <button onClick={() => onNavigate('analyze')} className="group relative rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-violet-200/80 dark:border-violet-700/50 shadow-xl shadow-violet-500/10 dark:shadow-black/20 backdrop-blur-2xl bg-white/80 dark:bg-stone-800/80 p-6 hover:shadow-2xl hover:border-violet-300 dark:hover:border-violet-500/60 transition-all duration-300 text-left">
              <div className="relative flex flex-col items-center text-center mb-4">
                <div className="w-14 h-14 rounded-2xl bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center mb-3">
                  <ScholarMascot size={48} animated={false} pose="analyzing" />
                </div>
                <h3 className="font-bold text-violet-700 dark:text-violet-400 text-lg">Essay Analyzer</h3>
              </div>
              <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed text-center">Professor-style feedback on structure, clarity, citations. Grade-level rubric.</p>
            </button>

            {/* Citations - Flagship */}
            <button onClick={() => onNavigate('citations')} className="group relative rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-sky-200/80 dark:border-sky-700/50 shadow-xl shadow-sky-500/10 dark:shadow-black/20 backdrop-blur-2xl bg-white/80 dark:bg-stone-800/80 p-6 hover:shadow-2xl hover:border-sky-300 dark:hover:border-sky-500/60 transition-all duration-300 text-left">
              <div className="relative flex flex-col items-center text-center mb-4">
                <div className="w-14 h-14 rounded-2xl bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center mb-3">
                  <ScholarMascot size={48} animated={false} pose="studying" />
                </div>
                <h3 className="font-bold text-sky-700 dark:text-sky-400 text-lg">Online Citations</h3>
              </div>
              <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed text-center">Find and format academic citations in APA, MLA, Chicago, Harvard, IEEE, Vancouver.</p>
            </button>

            {/* Study Packs - Flagship */}
            <button onClick={() => onNavigate('dashboard')} className="group relative rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-amber-200/80 dark:border-amber-700/50 shadow-xl shadow-amber-500/10 dark:shadow-black/20 backdrop-blur-2xl bg-white/80 dark:bg-stone-800/80 p-6 hover:shadow-2xl hover:border-amber-300 dark:hover:border-amber-500/60 transition-all duration-300 text-left">
              <div className="relative flex flex-col items-center text-center mb-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center mb-3 text-2xl">📦</div>
                <h3 className="font-bold text-amber-700 dark:text-amber-400 text-lg">Study Packs</h3>
              </div>
              <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed text-center">Create quizzes, flashcards, crosswords & lessons from any notes. One paste, five formats.</p>
            </button>

            {/* Focus Mode - Flagship */}
            <button onClick={() => onNavigate('focus-mode')} className="group relative rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-violet-200/80 dark:border-violet-700/50 shadow-xl shadow-violet-500/10 dark:shadow-black/20 backdrop-blur-2xl bg-white/80 dark:bg-stone-800/80 p-6 hover:shadow-2xl hover:border-violet-300 dark:hover:border-violet-500/60 transition-all duration-300 text-left">
              <div className="relative flex flex-col items-center text-center mb-4">
                <div className="w-14 h-14 rounded-2xl bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center mb-3 text-2xl">🔒</div>
                <h3 className="font-bold text-violet-700 dark:text-violet-400 text-lg">Focus Mode</h3>
              </div>
              <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed text-center">Block YouTube, TikTok until you answer quiz questions from your notes. Earn your screen time.</p>
            </button>
          </div>

          {/* More Tools */}
          <div className="pt-8 border-t border-stone-200/60 dark:border-stone-600/40">
            <h3 className="text-lg font-bold text-stone-700 dark:text-stone-300 mb-6">More tools</h3>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 min-w-0">
            {/* Document Library */}
            <div className="group relative rounded-2xl sm:rounded-3xl overflow-hidden border border-white/60 dark:border-stone-600/50 shadow-xl shadow-stone-900/5 dark:shadow-black/20 backdrop-blur-2xl bg-white/70 dark:bg-stone-800/70 p-4 sm:p-6 hover:shadow-2xl hover:border-stone-300/80 dark:hover:border-stone-500/50 transition-all duration-300 min-w-0">
              <div className="relative flex items-center gap-2 sm:gap-4 mb-2 sm:mb-4 min-w-0">
                <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-stone-100 dark:bg-stone-700/80 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <ScholarMascot size={36} animated={false} pose="default" />
                </div>
                <h3 className="font-bold text-stone-800 dark:text-stone-100 text-sm sm:text-lg truncate min-w-0">Document Library</h3>
              </div>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed line-clamp-3 sm:line-clamp-none">Organize and manage your academic documents with our intuitive library system and cloud storage.</p>
            </div>

            {/* Text Summarizer */}
            <button onClick={() => onNavigate('summarizer')} className="group relative rounded-2xl sm:rounded-3xl overflow-hidden border border-white/60 dark:border-stone-600/50 shadow-xl shadow-stone-900/5 dark:shadow-black/20 backdrop-blur-2xl bg-white/70 dark:bg-stone-800/70 p-4 sm:p-6 hover:shadow-2xl hover:border-teal-300/80 dark:hover:border-teal-600/50 transition-all duration-300 text-left min-w-0">
              <div className="absolute -inset-1 bg-gradient-to-br from-teal-400/0 to-emerald-500/0 group-hover:from-teal-400/10 group-hover:to-emerald-500/10 rounded-2xl sm:rounded-3xl blur-xl transition-all duration-300" />
              <div className="relative flex items-center gap-2 sm:gap-4 mb-2 sm:mb-4 min-w-0">
                <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center flex-shrink-0 text-lg sm:text-2xl">📝</div>
                <h3 className="font-bold text-teal-700 dark:text-teal-400 text-sm sm:text-lg truncate min-w-0">Paper Summarizer</h3>
              </div>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed line-clamp-3 sm:line-clamp-none">Condense research papers, articles, and textbooks into key points. Bullet points or paragraphs. 5,000 free words/month.</p>
            </button>

            {/* Citation Generator */}
            <button onClick={() => onNavigate('citation-generator-tool')} className="group relative rounded-2xl sm:rounded-3xl overflow-hidden border border-white/60 dark:border-stone-600/50 shadow-xl shadow-stone-900/5 dark:shadow-black/20 backdrop-blur-2xl bg-white/70 dark:bg-stone-800/70 p-4 sm:p-6 hover:shadow-2xl hover:border-violet-300/80 dark:hover:border-violet-600/50 transition-all duration-300 text-left min-w-0">
              <div className="absolute -inset-1 bg-gradient-to-br from-violet-400/0 to-red-500/0 group-hover:from-violet-400/10 group-hover:to-red-500/10 rounded-2xl sm:rounded-3xl blur-xl transition-all duration-300" />
              <div className="relative flex items-center gap-2 sm:gap-4 mb-2 sm:mb-4 min-w-0">
                <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center flex-shrink-0 text-lg sm:text-2xl">📋</div>
                <h3 className="font-bold text-violet-700 dark:text-violet-400 text-sm sm:text-lg truncate min-w-0">Citation Generator</h3>
              </div>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed line-clamp-3 sm:line-clamp-none">Generate perfectly formatted citations from a URL, book, or journal. APA, MLA, Chicago, Harvard, and more.</p>
            </button>

            {/* Pomodoro Timer */}
            <button onClick={() => onNavigate('pomodoro-timer')} className="group relative rounded-2xl sm:rounded-3xl overflow-hidden border border-white/60 dark:border-stone-600/50 shadow-xl shadow-stone-900/5 dark:shadow-black/20 backdrop-blur-2xl bg-white/70 dark:bg-stone-800/70 p-4 sm:p-6 hover:shadow-2xl hover:border-emerald-300/80 dark:hover:border-emerald-600/50 transition-all duration-300 text-left min-w-0">
              <div className="absolute -inset-1 bg-gradient-to-br from-emerald-400/0 to-teal-500/0 group-hover:from-emerald-400/10 group-hover:to-teal-500/10 rounded-2xl sm:rounded-3xl blur-xl transition-all duration-300" />
              <div className="relative flex items-center gap-2 sm:gap-4 mb-2 sm:mb-4 min-w-0">
                <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0 text-lg sm:text-2xl">⏱️</div>
                <h3 className="font-bold text-emerald-700 dark:text-emerald-400 text-sm sm:text-lg truncate min-w-0">Pomodoro Timer</h3>
              </div>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed line-clamp-3 sm:line-clamp-none">Stay focused with timed study sessions. Work in 25-minute sprints with built-in breaks for better productivity.</p>
            </button>
          </div>
          </div>
        </div>
      </section>

      {/* How It Works - glass cards like Landing */}
      <section className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-400 rounded-full text-sm font-semibold mb-4">
              Simple
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-800 dark:text-stone-100 mb-4">How it works</h2>
            <p className="text-stone-600 dark:text-stone-400 max-w-xl mx-auto">
              Get started in seconds with any of our AI tools
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            {[
              { num: 1, title: 'Paste your text', desc: 'Paste essays, AI-generated text, research papers, or study notes' },
              { num: 2, title: 'Choose your tool', desc: 'Humanize, summarize, quiz, find citations, or analyze your essay' },
              { num: 3, title: 'Get results', desc: 'Instant results you can copy, study from, or submit with confidence' },
            ].map((step) => (
              <div key={step.num} className="relative group">
                <div className="flex flex-col items-center text-center p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-white/60 dark:border-stone-600/50 shadow-xl shadow-stone-900/5 dark:shadow-black/20 backdrop-blur-2xl bg-white/70 dark:bg-stone-800/70 hover:shadow-2xl hover:border-violet-300/60 dark:hover:border-violet-600/40 transition-all duration-300">
                  <span className="w-14 h-14 sm:w-16 sm:h-16 bg-violet-600 hover:bg-violet-500 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl shadow-lg shadow-violet-500/30">
                    {step.num}
                  </span>
                  <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100 mb-2">{step.title}</h3>
                  <p className="text-sm text-stone-600 dark:text-stone-400">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section - glass cards */}
      <section className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div className="rounded-2xl sm:rounded-3xl border border-white/60 dark:border-stone-600/50 shadow-xl shadow-stone-900/5 dark:shadow-black/20 backdrop-blur-2xl bg-white/70 dark:bg-stone-800/70 p-6 sm:p-8">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-800 dark:text-stone-100 mb-6">Why choose WriteScholar?</h2>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-violet-100 dark:bg-violet-900/50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <span className="font-semibold text-stone-800 dark:text-stone-100">{benefit.label}</span>
                      <span className="text-stone-600 dark:text-stone-400"> — {benefit.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="rounded-2xl sm:rounded-3xl overflow-hidden border border-white/60 dark:border-stone-600/50 shadow-xl shadow-stone-900/5 dark:shadow-black/20 backdrop-blur-2xl bg-gradient-to-br from-violet-500/10 via-red-500/5 to-fuchsia-500/10 dark:from-violet-900/30 dark:via-red-900/20 dark:to-fuchsia-900/20 p-6 sm:p-8">
              <div className="grid grid-cols-2 gap-4 sm:gap-6">
                {[
                  { value: '5+', label: 'AI Tools' },
                  { value: '50K+', label: 'Students' },
                  { value: '6', label: 'Citation Styles' },
                  { value: 'Free', label: 'to Start' },
                ].map((stat, i) => (
                  <div key={i} className="text-center p-4 rounded-2xl bg-white/60 dark:bg-stone-800/50">
                    <div className="text-3xl sm:text-4xl font-bold text-violet-600 dark:text-violet-400">{stat.value}</div>
                    <div className="text-stone-600 dark:text-stone-400 text-sm font-medium">{stat.label}</div>
                  </div>
                ))}
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
              ? 'Head to your dashboard for essay feedback, citations, study packs, focus mode, and more.'
              : 'Join thousands of students using essay analysis, citations, study packs, and focus mode.'
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {user ? (
              <>
                <button 
                  onClick={() => onNavigate('dashboard')}
                  className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-2xl shadow-lg shadow-violet-500/25 transition-all"
                >
                  Go to Dashboard
                </button>
                {user && ['free'].includes((user.plan || user.subscription_plan || '').toLowerCase()) && (
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
                  className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-2xl shadow-lg shadow-violet-500/25 transition-all"
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
