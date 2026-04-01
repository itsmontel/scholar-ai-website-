import Header from '../common/Header';
import { WriteScholarEditorialBackgroundLayers } from '../common/WriteScholarEditorialBackground';
import Footer from '../common/Footer';
import ScholarMascot from '../common/ScholarMascot';
import LandingSectionLayers from '../common/LandingSectionLayers';
import { HIDE_STREAK_AND_BADGES } from '../../config/featureFlags';

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
    ...(HIDE_STREAK_AND_BADGES
      ? []
      : [{ label: "Badges & achievements", description: "Earn milestones as you study and use the app" }]),
  ];

  return (
    <div className="min-h-screen relative transition-colors font-sans overflow-x-hidden">
      <WriteScholarEditorialBackgroundLayers position="fixed" />

      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="features" />

      <section
        className="relative py-16 sm:py-24 overflow-hidden border-b border-stone-200/90 dark:border-stone-800"
        aria-labelledby="features-page-heading"
      >
        <LandingSectionLayers />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-violet-800/90 dark:text-violet-300/95 mb-3">
              Features
            </p>
            <div className="mx-auto mb-4 h-0.5 w-16 rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500 opacity-90 dark:opacity-85" aria-hidden />
            <h1
              id="features-page-heading"
              className="text-2xl sm:text-3xl lg:text-[2.35rem] font-semibold text-stone-900 dark:text-stone-100 mb-4 tracking-tight leading-tight"
              style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
            >
              AI essay feedback, study packs &amp; focus mode
            </h1>
            <p className="text-base sm:text-lg text-stone-600 dark:text-stone-400 leading-relaxed">
              The all-in-one study app: professor-style essay feedback on every paper, quizzes and flashcards from your notes, and Focus Mode to block distractions until you study.
            </p>
          </div>
        </div>
      </section>

      <section className="relative py-16 sm:py-24 overflow-hidden border-t border-stone-200/90 dark:border-stone-800">
        <LandingSectionLayers />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
            <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-violet-800/90 dark:text-violet-300/95 mb-3">
              Flagship
            </p>
            <div className="mx-auto mb-4 h-0.5 w-16 rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500 opacity-90 dark:opacity-85" aria-hidden />
            <h2
              className="text-2xl sm:text-3xl lg:text-[2.35rem] font-semibold text-stone-900 dark:text-stone-100 tracking-tight leading-tight"
              style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
            >
              Our four core tools
            </h2>
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
            <button onClick={() => onNavigate('citations')} className="group relative rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-violet-200/80 dark:border-violet-700/50 shadow-xl shadow-violet-500/10 dark:shadow-black/20 backdrop-blur-2xl bg-white/80 dark:bg-stone-800/80 p-6 hover:shadow-2xl hover:border-violet-300 dark:hover:border-violet-500/60 transition-all duration-300 text-left">
              <div className="relative flex flex-col items-center text-center mb-4">
                <div className="w-14 h-14 rounded-2xl bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center mb-3">
                  <ScholarMascot size={48} animated={false} pose="studying" />
                </div>
                <h3 className="font-bold text-violet-700 dark:text-violet-400 text-lg">Online Citations</h3>
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

      <section className="relative py-16 sm:py-24 overflow-hidden border-t border-stone-200/90 dark:border-stone-800">
        <LandingSectionLayers variant="faq" />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-violet-800/90 dark:text-violet-300/95 mb-3">
              Simple
            </p>
            <div className="mx-auto mb-4 h-0.5 w-16 rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500 opacity-90 dark:opacity-85" aria-hidden />
            <h2
              className="text-2xl sm:text-3xl lg:text-[2.35rem] font-semibold text-stone-900 dark:text-stone-100 mb-4 tracking-tight leading-tight"
              style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
            >
              How it works
            </h2>
            <p className="text-base sm:text-lg text-stone-600 dark:text-stone-400 max-w-xl mx-auto leading-relaxed">
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

      <section className="relative py-16 sm:py-24 overflow-hidden border-t border-stone-200/90 dark:border-stone-800">
        <LandingSectionLayers />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
            <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-violet-800/90 dark:text-violet-300/95 mb-3">
              Why WriteScholar
            </p>
            <div className="mx-auto mb-4 h-0.5 w-16 rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500 opacity-90 dark:opacity-85" aria-hidden />
            <h2
              className="text-2xl sm:text-3xl lg:text-[2.35rem] font-semibold text-stone-900 dark:text-stone-100 tracking-tight leading-tight"
              style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
            >
              Why choose WriteScholar?
            </h2>
          </div>
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div className="rounded-2xl border border-stone-200/90 dark:border-stone-700/90 bg-white/80 dark:bg-stone-900/50 shadow-[0_12px_40px_-12px_rgba(15,23,42,0.1)] dark:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.4)] ring-1 ring-white/50 dark:ring-white/5 backdrop-blur-sm p-6 sm:p-8">
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
            
            <div className="rounded-2xl overflow-hidden border border-violet-200/80 dark:border-violet-800/50 shadow-[0_12px_40px_-12px_rgba(91,33,182,0.12)] dark:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.45)] backdrop-blur-sm bg-gradient-to-br from-violet-500/10 via-red-500/5 to-fuchsia-500/10 dark:from-violet-900/30 dark:via-red-900/20 dark:to-fuchsia-900/20 p-6 sm:p-8 ring-1 ring-white/50 dark:ring-white/5">
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

      <section className="relative py-16 sm:py-24 overflow-hidden border-t border-stone-200/90 dark:border-stone-800">
        <LandingSectionLayers variant="cta" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center rounded-2xl border border-stone-200/90 dark:border-stone-800/90 bg-white/75 dark:bg-stone-900/45 px-6 py-10 sm:px-10 sm:py-12 shadow-[0_12px_40px_-12px_rgba(15,23,42,0.12)] dark:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.45)] backdrop-blur-[8px] ring-1 ring-white/50 dark:ring-white/5">
            <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-violet-800/90 dark:text-violet-300/95 mb-3">
              Get started
            </p>
            <div className="mx-auto mb-5 h-0.5 w-16 rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500 opacity-90 dark:opacity-85" aria-hidden />
            <h2
              className="text-2xl sm:text-3xl lg:text-[2.35rem] font-semibold text-stone-900 dark:text-stone-50 mb-4 tracking-tight leading-[1.15]"
              style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
            >
              {user ? 'Start using your AI toolkit' : 'Ready to level up your studies?'}
            </h2>
            <p className="text-base sm:text-lg text-stone-600 dark:text-stone-400 mb-8 max-w-xl mx-auto leading-relaxed">
              {user
                ? 'Head to your dashboard for essay feedback, citations, study packs, focus mode, and more.'
                : 'Join thousands of students using essay analysis, citations, study packs, and focus mode.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center">
              {user ? (
                <>
                  <button
                    type="button"
                    onClick={() => onNavigate('dashboard')}
                    className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-violet-700 hover:bg-violet-800 dark:bg-violet-600 dark:hover:bg-violet-500 text-white font-semibold rounded-xl shadow-md shadow-violet-900/15 dark:shadow-violet-950/40 ring-1 ring-violet-900/10 dark:ring-white/10 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 text-base"
                  >
                    Go to dashboard
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                  {user && ['free'].includes((user.plan || user.subscription_plan || '').toLowerCase()) && (
                    <button
                      type="button"
                      onClick={() => onNavigate('billing')}
                      className="inline-flex items-center justify-center px-7 py-3.5 border border-stone-300/95 dark:border-stone-600 bg-white/90 dark:bg-stone-900/50 text-stone-800 dark:text-stone-200 font-medium rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors text-base shadow-sm"
                    >
                      Upgrade plan
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => onNavigate('signup')}
                    className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-violet-700 hover:bg-violet-800 dark:bg-violet-600 dark:hover:bg-violet-500 text-white font-semibold rounded-xl shadow-md shadow-violet-900/15 dark:shadow-violet-950/40 ring-1 ring-violet-900/10 dark:ring-white/10 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 text-base"
                  >
                    Try free
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('pricing')}
                    className="inline-flex items-center justify-center px-7 py-3.5 border border-stone-300/95 dark:border-stone-600 bg-white/90 dark:bg-stone-900/50 text-stone-800 dark:text-stone-200 font-medium rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors text-base shadow-sm"
                  >
                    View pricing
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default FeaturesPage;
