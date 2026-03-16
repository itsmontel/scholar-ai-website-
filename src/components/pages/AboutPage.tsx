import Header from '../common/Header';
import Footer from '../common/Footer';
import ScholarMascot from '../common/ScholarMascot';

interface AboutPageProps {
  onNavigate: (page: string) => void;
  user?: any;
  onLogout: () => void;
}

const AboutPage = ({ onNavigate, user, onLogout }: AboutPageProps) => {
  const mainFeatures = [
    { id: 'analyze', title: 'Essay Analyzer', desc: 'Professor-style feedback on structure, clarity, citations. Grade-level rubric.', accent: 'rose', emoji: '📝' },
    { id: 'citations', title: 'Online Citations', desc: 'Find and format academic sources in APA, MLA, Chicago, Harvard, IEEE, Vancouver.', accent: 'sky', emoji: '📚' },
    { id: 'dashboard', title: 'Study Packs', desc: 'Quizzes, flashcards, crosswords & lessons from any notes. One paste, five formats.', accent: 'amber', emoji: '📦' },
    { id: 'focus-mode', title: 'Focus Mode', desc: 'Block YouTube, TikTok until you answer quiz questions from your notes. Earn your screen time.', accent: 'violet', emoji: '🔒' },
  ];

  return (
    <div className="min-h-screen relative transition-colors font-sans overflow-x-hidden">
      {/* Mesh gradient background - matches Dashboard & Landing */}
      <div className="fixed inset-0 -z-10 bg-[#faf9f7] dark:bg-stone-950" aria-hidden />
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_120%_80%_at_20%_-10%,rgba(251,207,232,0.4),transparent_50%)] dark:bg-[radial-gradient(ellipse_120%_80%_at_20%_-10%,rgba(251,207,232,0.15),transparent_50%)] pointer-events-none" aria-hidden />
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_100%_60%_at_80%_0%,rgba(196,181,253,0.35),transparent_50%)] dark:bg-[radial-gradient(ellipse_100%_60%_at_80%_0%,rgba(196,181,253,0.12),transparent_50%)] pointer-events-none" aria-hidden />
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_100%,rgba(254,215,170,0.3),transparent_50%)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_100%,rgba(254,215,170,0.1),transparent_50%)] pointer-events-none" aria-hidden />

      {/* Floating blobs */}
      <div className="fixed top-[10%] left-[5%] w-72 h-72 rounded-[40%_60%_70%_30%/40%_50%_60%_50%] bg-gradient-to-br from-fuchsia-300/25 to-pink-400/20 dark:from-fuchsia-500/15 dark:to-pink-600/10 blur-3xl animate-blob-float hidden xl:block pointer-events-none" />
      <div className="fixed top-[20%] right-[10%] w-64 h-64 rounded-[60%_40%_30%_70%/60%_30%_70%_40%] bg-gradient-to-br from-violet-300/25 to-purple-400/20 dark:from-violet-500/15 dark:to-purple-600/10 blur-3xl animate-blob-float hidden xl:block pointer-events-none" style={{ animationDelay: '-2s' }} />
      <div className="fixed bottom-[25%] left-[15%] w-48 h-48 rounded-[30%_70%_70%_30%/30%_30%_70%_70%] bg-gradient-to-br from-amber-300/20 to-orange-400/15 dark:from-amber-500/10 dark:to-orange-600/8 blur-3xl animate-blob-float hidden lg:block pointer-events-none" style={{ animationDelay: '-4s' }} />

      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="about" />

      {/* Hero Section */}
      <section className="relative py-16 sm:py-20 overflow-hidden">
        <div className="absolute top-[35%] left-[5%] hidden xl:block text-4xl opacity-50 animate-float">🌍</div>
        <div className="absolute top-[40%] right-[6%] hidden xl:block text-3xl opacity-45 animate-float-delayed">✨</div>
        <div className="absolute bottom-[35%] left-[6%] hidden xl:block text-3xl opacity-45 animate-float">📚</div>
        <div className="absolute bottom-[30%] right-[5%] hidden xl:block text-4xl opacity-50 animate-float-delayed">🎓</div>
        <div className="hidden lg:block absolute right-4 xl:right-12 top-1/2 -translate-y-1/2 z-10 opacity-90 animate-float">
          <ScholarMascot size={112} animated={true} pose="default" />
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10 lg:gap-12">
            <div className="flex-1 text-center lg:text-left max-w-3xl mx-auto lg:mx-0">
              <span className="inline-flex items-center px-4 py-1.5 bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-400 rounded-full text-sm font-semibold mb-6">
                About Us
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-stone-800 dark:text-stone-100 mb-6 leading-tight">
                Empowering academic<br className="hidden sm:block" /> <span className="text-violet-500">excellence</span> worldwide
              </h1>
              <p className="text-lg text-stone-600 dark:text-stone-400 leading-relaxed">
                We&apos;re building the complete AI toolkit for students: essay feedback, citations, study packs, focus mode, and more.
              </p>
            </div>
            <div className="hidden lg:block flex-shrink-0 w-24 h-28 xl:w-28 xl:h-32" />
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div className="rounded-2xl sm:rounded-3xl border border-white/60 dark:border-stone-600/50 shadow-xl shadow-stone-900/5 dark:shadow-black/20 backdrop-blur-2xl bg-white/70 dark:bg-stone-800/70 p-6 sm:p-8">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-800 dark:text-stone-100 mb-6">Our mission</h2>
              <p className="text-stone-600 dark:text-stone-400 leading-relaxed mb-4">
                At WriteScholar, we believe exceptional academic writing should be accessible to everyone. Our mission is to democratize high-quality feedback by providing intelligent, AI-powered writing assistance.
              </p>
              <p className="text-stone-600 dark:text-stone-400 leading-relaxed mb-6">
                We help students, researchers, and academics improve their work and achieve their scholarly goals—whether they&apos;re writing their first essay or publishing groundbreaking research.
              </p>
              <div className="space-y-3">
                {['Essay analysis with professor-style feedback', 'Online citations in 6 styles', 'Study packs: quizzes, flashcards, crosswords'].map((item, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-violet-100 dark:bg-violet-900/50 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-stone-700 dark:text-stone-300 font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="rounded-2xl sm:rounded-3xl overflow-hidden border border-white/60 dark:border-stone-600/50 shadow-xl shadow-stone-900/5 dark:shadow-black/20 backdrop-blur-2xl bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-fuchsia-500/10 dark:from-violet-900/30 dark:via-purple-900/20 dark:to-fuchsia-900/20 p-6 sm:p-8">
              <div className="grid grid-cols-2 gap-4 sm:gap-6">
                {[
                  { value: '38K+', label: 'Students' },
                  { value: '5+', label: 'AI Tools' },
                  { value: '6', label: 'Citation Styles' },
                  { value: '50+', label: 'Countries' },
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

      {/* Main Features Section */}
      <section className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <span className="inline-block px-4 py-1.5 bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-400 rounded-full text-sm font-semibold mb-4">
              What we offer
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-800 dark:text-stone-100 mb-4">Our main features</h2>
            <p className="text-stone-600 dark:text-stone-400 max-w-xl mx-auto">
              Essay feedback, citations, study packs & focus mode
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {mainFeatures.map((f) => {
              const borderCls = f.accent === 'rose' ? 'border-rose-200/80 dark:border-rose-700/50 hover:border-rose-300 dark:hover:border-rose-500/60' : f.accent === 'sky' ? 'border-sky-200/80 dark:border-sky-700/50 hover:border-sky-300 dark:hover:border-sky-500/60' : f.accent === 'amber' ? 'border-amber-200/80 dark:border-amber-700/50 hover:border-amber-300 dark:hover:border-amber-500/60' : 'border-violet-200/80 dark:border-violet-700/50 hover:border-violet-300 dark:hover:border-violet-500/60';
              const titleCls = f.accent === 'rose' ? 'text-rose-700 dark:text-rose-400' : f.accent === 'sky' ? 'text-sky-700 dark:text-sky-400' : f.accent === 'amber' ? 'text-amber-700 dark:text-amber-400' : 'text-violet-700 dark:text-violet-400';
              const iconBgCls = f.accent === 'rose' ? 'bg-rose-100 dark:bg-rose-900/50' : f.accent === 'sky' ? 'bg-sky-100 dark:bg-sky-900/50' : f.accent === 'amber' ? 'bg-amber-100 dark:bg-amber-900/50' : 'bg-violet-100 dark:bg-violet-900/50';
              return (
                <button key={f.id} onClick={() => onNavigate(f.id)} className={`group relative rounded-2xl sm:rounded-3xl overflow-hidden border-2 ${borderCls} shadow-xl shadow-stone-900/5 dark:shadow-black/20 backdrop-blur-2xl bg-white/80 dark:bg-stone-800/80 p-6 hover:shadow-2xl transition-all duration-300 text-left`}>
                  <div className="relative flex flex-col items-center text-center mb-4">
                    <div className={`w-14 h-14 rounded-2xl ${iconBgCls} flex items-center justify-center mb-3 text-2xl`}>{f.emoji}</div>
                    <h3 className={`font-bold ${titleCls} text-lg`}>{f.title}</h3>
                  </div>
                  <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed text-center">{f.desc}</p>
                </button>
              );
            })}
          </div>
          <div className="text-center mt-8">
            <button onClick={() => onNavigate('features')} className="text-violet-600 dark:text-violet-400 font-semibold hover:text-violet-700 dark:hover:text-violet-300 transition-colors">
              See all features →
            </button>
          </div>
        </div>
      </section>

      {/* Values Section with Mascot */}
      <section className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <span className="inline-block px-4 py-1.5 bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-400 rounded-full text-sm font-semibold mb-4">
              Principles
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-800 dark:text-stone-100 mb-4">Our values</h2>
            <p className="text-stone-600 dark:text-stone-400 max-w-xl mx-auto">
              These principles guide everything we build at WriteScholar
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            <div className="rounded-2xl sm:rounded-3xl border border-white/60 dark:border-stone-600/50 shadow-xl shadow-stone-900/5 dark:shadow-black/20 backdrop-blur-2xl bg-white/70 dark:bg-stone-800/70 p-6 text-center hover:shadow-2xl hover:border-violet-300 dark:hover:border-violet-500/60 transition-all">
              <div className="flex justify-center mb-4">
                <ScholarMascot size={64} animated={false} pose="analyzing" />
              </div>
              <h3 className="font-bold text-stone-800 dark:text-stone-100 mb-2">Quality</h3>
              <p className="text-stone-600 dark:text-stone-400 text-sm">Highest standards in AI analysis and feedback</p>
            </div>

            <div className="rounded-2xl sm:rounded-3xl border border-white/60 dark:border-stone-600/50 shadow-xl shadow-stone-900/5 dark:shadow-black/20 backdrop-blur-2xl bg-white/70 dark:bg-stone-800/70 p-6 text-center hover:shadow-2xl hover:border-violet-300 dark:hover:border-violet-500/60 transition-all">
              <div className="flex justify-center mb-4">
                <ScholarMascot size={64} animated={false} pose="thinking" />
              </div>
              <h3 className="font-bold text-stone-800 dark:text-stone-100 mb-2">Privacy</h3>
              <p className="text-stone-600 dark:text-stone-400 text-sm">Enterprise-grade security for your documents</p>
            </div>

            <div className="rounded-2xl sm:rounded-3xl border border-white/60 dark:border-stone-600/50 shadow-xl shadow-stone-900/5 dark:shadow-black/20 backdrop-blur-2xl bg-white/70 dark:bg-stone-800/70 p-6 text-center hover:shadow-2xl hover:border-violet-300 dark:hover:border-violet-500/60 transition-all">
              <div className="flex justify-center mb-4">
                <ScholarMascot size={64} animated={false} pose="pointing" />
              </div>
              <h3 className="font-bold text-stone-800 dark:text-stone-100 mb-2">Innovation</h3>
              <p className="text-stone-600 dark:text-stone-400 text-sm">Continuous improvement of our technology</p>
            </div>

            <div className="rounded-2xl sm:rounded-3xl border border-white/60 dark:border-stone-600/50 shadow-xl shadow-stone-900/5 dark:shadow-black/20 backdrop-blur-2xl bg-white/70 dark:bg-stone-800/70 p-6 text-center hover:shadow-2xl hover:border-violet-300 dark:hover:border-violet-500/60 transition-all">
              <div className="flex justify-center mb-4">
                <ScholarMascot size={64} animated={false} pose="waving" />
              </div>
              <h3 className="font-bold text-stone-800 dark:text-stone-100 mb-2">Accessibility</h3>
              <p className="text-stone-600 dark:text-stone-400 text-sm">Tools for the global academic community</p>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-800 dark:text-stone-100 mb-6">Our story</h2>
            <div className="text-stone-500 dark:text-stone-400 leading-relaxed space-y-4 text-left">
              <p>
                WriteScholar started with a simple goal: give students access to the kind of feedback that used to require expensive tutors or professors with limited office hours. We saw how AI could bridge that gap.
              </p>
              <p>
                What began as an essay analyzer has grown into a complete academic toolkit. Our AI Humanizer helps you refine AI-assisted drafts into natural, authentic writing. The Summarizer condenses long readings into digestible points. Our Citation Finder locates real, verifiable sources for your claims.
              </p>
              <p>
                We didn't stop at writing. Studying effectively is just as important, so we built tools that turn any notes into interactive quizzes, flashcards, and crossword puzzles. Active recall beats passive reading every time.
              </p>
              <p>
                Today, students around the world use WriteScholar to write better papers, study smarter, and save hours of work. We're just getting started.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-stone-800 dark:bg-stone-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">
            {user ? 'Ready to write your next paper?' : 'Ready to improve your academic writing?'}
          </h2>
          <p className="text-stone-400 mb-8 max-w-xl mx-auto">
            {user 
              ? 'Head to your dashboard to analyze essays, humanize text, find citations, or create study materials.'
              : 'Join students worldwide who use WriteScholar to write better and study smarter.'
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {user ? (
              <>
                <button 
                  onClick={() => onNavigate('dashboard')}
                  className="px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold rounded-2xl hover:from-violet-400 hover:to-purple-500 shadow-lg shadow-violet-500/25 transition-all"
                >
                  Go to Dashboard
                </button>
                <button 
                  onClick={() => onNavigate('features')}
                  className="px-6 py-3 border-2 border-stone-500 text-white font-semibold rounded-2xl hover:border-stone-400 transition-colors"
                >
                  View Features
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => onNavigate('signup')}
                  className="px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold rounded-2xl hover:from-violet-400 hover:to-purple-500 shadow-lg shadow-violet-500/25 transition-all"
                >
                  Try Free
                </button>
                <button 
                  onClick={() => onNavigate('features')}
                  className="px-6 py-3 border-2 border-stone-500 text-white font-semibold rounded-2xl hover:border-stone-400 transition-colors"
                >
                  Learn More
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

export default AboutPage;
