import Header from '../common/Header';
import { WriteScholarEditorialBackgroundLayers } from '../common/WriteScholarEditorialBackground';
import Footer from '../common/Footer';
// ScholarMascot replaced with mascot GIFs
import LandingSectionLayers from '../common/LandingSectionLayers';

interface AboutPageProps {
  onNavigate: (page: string) => void;
  user?: any;
  onLogout: () => void;
}

const AboutPage = ({ onNavigate, user, onLogout }: AboutPageProps) => {
  const mainFeatures = [
    { id: 'analyze', title: 'Essay Analyzer', desc: 'Professor-style feedback on structure, clarity, citations. Grade-level rubric.', accent: 'rose', gif: '/mascot-study.webp' },
    { id: 'citations', title: 'Online Citations', desc: 'Find and format academic sources in APA, MLA, Chicago, Harvard, IEEE, Vancouver.', accent: 'sky', gif: '/mascot-paper.webp' },
    { id: 'dashboard', title: 'Study Packs', desc: 'Quizzes, flashcards, crosswords & lessons from any notes. One paste, five formats.', accent: 'amber', gif: '/mascot-juggling.webp' },
    { id: 'focus-mode', title: 'Focus Mode', desc: 'Block YouTube, TikTok until you answer quiz questions from your notes. Earn your screen time.', accent: 'rose', gif: '/mascot-thinking.webp' },
  ];

  return (
    <div className="min-h-screen relative transition-colors font-sans overflow-x-clip">
      <WriteScholarEditorialBackgroundLayers position="fixed" />

      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="about" />

      <section
        className="relative py-16 sm:py-24 overflow-hidden border-b border-stone-200/90 dark:border-stone-800"
        aria-labelledby="about-page-heading"
      >
        <LandingSectionLayers />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-[#58CC02] dark:text-[#58CC02] mb-3">
              About us
            </p>
            <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-[#58CC02]" aria-hidden />
            <h1
              id="about-page-heading"
              className="text-2xl sm:text-3xl lg:text-[2.35rem] font-extrabold text-stone-900 dark:text-stone-100 mb-4 tracking-tight leading-tight"
              style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
            >
              Empowering academic excellence worldwide
            </h1>
            <p className="text-base sm:text-lg text-stone-600 dark:text-stone-400 leading-relaxed">
              We&apos;re building the complete AI toolkit for students: essay feedback, citations, study packs, focus mode, and more.
            </p>
          </div>
        </div>
      </section>

      <section className="relative py-16 sm:py-24 overflow-hidden border-t border-stone-200/90 dark:border-stone-800">
        <LandingSectionLayers />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
            <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-[#58CC02] dark:text-[#58CC02] mb-3">
              Mission
            </p>
            <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-[#58CC02]" aria-hidden />
            <h2
              className="text-2xl sm:text-3xl lg:text-[2.35rem] font-extrabold text-stone-900 dark:text-stone-100 tracking-tight leading-tight"
              style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
            >
              Our mission
            </h2>
          </div>
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div className="rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-6 sm:p-8">
              <p className="text-stone-600 dark:text-stone-400 leading-relaxed mb-4">
                At WriteScholar, we believe exceptional academic writing should be accessible to everyone. Our mission is to democratize high-quality feedback by providing intelligent, AI-powered writing assistance.
              </p>
              <p className="text-stone-600 dark:text-stone-400 leading-relaxed mb-6">
                We help students, researchers, and academics improve their work and achieve their scholarly goals—whether they&apos;re writing their first essay or publishing groundbreaking research.
              </p>
              <div className="space-y-3">
                {['Essay analysis with professor-style feedback', 'Online citations in 6 styles', 'Study packs: quizzes, flashcards, crosswords'].map((item, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-[#EAFFD6] dark:bg-[#58CC02]/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-[#58CC02]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-stone-700 dark:text-stone-300 font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="rounded-2xl overflow-hidden border-2 border-b-4 border-[#58CC02]/30 dark:border-[#58CC02]/30 bg-[#EAFFD6] dark:bg-[#58CC02]/10 p-6 sm:p-8">
              <div className="grid grid-cols-2 gap-4 sm:gap-6">
                {[
                  { value: '50K+', label: 'Students' },
                  { value: '5+', label: 'AI Tools' },
                  { value: '6', label: 'Citation Styles' },
                  { value: '50+', label: 'Countries' },
                ].map((stat, i) => (
                  <div key={i} className="text-center p-4 rounded-2xl bg-white/60 dark:bg-stone-800/50">
                    <div className="text-3xl sm:text-4xl font-bold text-[#58CC02]">{stat.value}</div>
                    <div className="text-stone-600 dark:text-stone-400 text-sm font-medium">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-16 sm:py-24 overflow-hidden border-t border-stone-200/90 dark:border-stone-800">
        <LandingSectionLayers variant="faq" />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
            <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-[#58CC02] dark:text-[#58CC02] mb-3">
              What we offer
            </p>
            <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-[#58CC02]" aria-hidden />
            <h2
              className="text-2xl sm:text-3xl lg:text-[2.35rem] font-extrabold text-stone-900 dark:text-stone-100 mb-4 tracking-tight leading-tight"
              style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
            >
              Our main features
            </h2>
            <p className="text-base sm:text-lg text-stone-600 dark:text-stone-400 max-w-xl mx-auto leading-relaxed">
              Essay feedback, citations, study packs &amp; focus mode
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {mainFeatures.map((f) => {
              const borderCls = f.accent === 'rose' ? 'border-stone-200 dark:border-stone-700 hover:border-[#1CB0F6] dark:hover:border-[#1CB0F6]' : f.accent === 'sky' ? 'border-stone-200 dark:border-stone-700 hover:border-[#1CB0F6] dark:hover:border-[#1CB0F6]' : f.accent === 'amber' ? 'border-[#FF9600]/30 dark:border-[#FF9600]/30 hover:border-[#FF9600]' : 'border-stone-200 dark:border-stone-700 hover:border-[#1CB0F6] dark:hover:border-[#1CB0F6]';
              const titleCls = f.accent === 'rose' ? 'text-[#1CB0F6]' : f.accent === 'sky' ? 'text-[#1CB0F6]' : f.accent === 'amber' ? 'text-[#FF9600]' : 'text-[#1CB0F6]';
              const iconBgCls = f.accent === 'rose' ? 'bg-[#DDF4FF] dark:bg-[#1CB0F6]/20' : f.accent === 'sky' ? 'bg-[#DDF4FF] dark:bg-[#1CB0F6]/20' : f.accent === 'amber' ? 'bg-[#FFF4E0] dark:bg-[#FF9600]/20' : 'bg-[#DDF4FF] dark:bg-[#1CB0F6]/20';
              return (
                <button key={f.id} onClick={() => onNavigate(f.id)} className={`group relative rounded-2xl sm:rounded-3xl overflow-hidden border-2 ${borderCls} bg-white dark:bg-stone-800 border-b-4 p-6 transition-all duration-300 text-left`}>
                  <div className="relative flex flex-col items-center text-center mb-4">
                    <div className={`w-14 h-14 rounded-2xl ${iconBgCls} flex items-center justify-center mb-3`}><img src={f.gif} alt={f.title} className="w-[48px] h-[48px] object-contain" /></div>
                    <h3 className={`font-bold ${titleCls} text-lg`}>{f.title}</h3>
                  </div>
                  <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed text-center">{f.desc}</p>
                </button>
              );
            })}
          </div>
          <div className="text-center mt-8">
            <button onClick={() => onNavigate('features')} className="text-[#1CB0F6] font-extrabold hover:text-[#1899D6] transition-colors">
              See all features →
            </button>
          </div>
        </div>
      </section>

      <section className="relative py-16 sm:py-24 overflow-hidden border-t border-stone-200/90 dark:border-stone-800">
        <LandingSectionLayers />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
            <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-[#58CC02] dark:text-[#58CC02] mb-3">
              Principles
            </p>
            <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-[#58CC02]" aria-hidden />
            <h2
              className="text-2xl sm:text-3xl lg:text-[2.35rem] font-extrabold text-stone-900 dark:text-stone-100 mb-4 tracking-tight leading-tight"
              style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
            >
              Our values
            </h2>
            <p className="text-base sm:text-lg text-stone-600 dark:text-stone-400 max-w-xl mx-auto leading-relaxed">
              These principles guide everything we build at WriteScholar
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            <div className="rounded-2xl sm:rounded-3xl border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-6 text-center hover:border-[#58CC02] dark:hover:border-[#58CC02] transition-all">
              <div className="flex justify-center mb-4">
                <img src="/mascot-study.webp" alt="Quality" className="w-16 h-16 object-contain" />
              </div>
              <h3 className="font-bold text-stone-800 dark:text-stone-100 mb-2">Quality</h3>
              <p className="text-stone-600 dark:text-stone-400 text-sm">Highest standards in AI analysis and feedback</p>
            </div>

            <div className="rounded-2xl sm:rounded-3xl border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-6 text-center hover:border-[#58CC02] dark:hover:border-[#58CC02] transition-all">
              <div className="flex justify-center mb-4">
                <img src="/mascot-thinking.webp" alt="Privacy" className="w-16 h-16 object-contain" />
              </div>
              <h3 className="font-bold text-stone-800 dark:text-stone-100 mb-2">Privacy</h3>
              <p className="text-stone-600 dark:text-stone-400 text-sm">Enterprise-grade security for your documents</p>
            </div>

            <div className="rounded-2xl sm:rounded-3xl border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-6 text-center hover:border-[#58CC02] dark:hover:border-[#58CC02] transition-all">
              <div className="flex justify-center mb-4">
                <img src="/mascot-laptop.webp" alt="Innovation" className="w-16 h-16 object-contain" />
              </div>
              <h3 className="font-bold text-stone-800 dark:text-stone-100 mb-2">Innovation</h3>
              <p className="text-stone-600 dark:text-stone-400 text-sm">Continuous improvement of our technology</p>
            </div>

            <div className="rounded-2xl sm:rounded-3xl border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-6 text-center hover:border-[#58CC02] dark:hover:border-[#58CC02] transition-all">
              <div className="flex justify-center mb-4">
                <img src="/mascot-dance.webp" alt="Accessibility" className="w-16 h-16 object-contain" />
              </div>
              <h3 className="font-bold text-stone-800 dark:text-stone-100 mb-2">Accessibility</h3>
              <p className="text-stone-600 dark:text-stone-400 text-sm">Tools for the global academic community</p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-16 sm:py-24 overflow-hidden border-t border-stone-200/90 dark:border-stone-800">
        <LandingSectionLayers variant="faq" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-[#58CC02] dark:text-[#58CC02] mb-3">
              Story
            </p>
            <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-[#58CC02]" aria-hidden />
            <h2
              className="text-2xl sm:text-3xl lg:text-[2.35rem] font-extrabold text-stone-900 dark:text-stone-100 mb-6 tracking-tight leading-tight"
              style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
            >
              Our story
            </h2>
          </div>
          <div className="rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-6 sm:p-10">
            <div className="text-stone-600 dark:text-stone-400 leading-relaxed space-y-4 text-left text-base">
              <p>
                WriteScholar started with a simple goal: give students access to the kind of feedback that used to require expensive tutors or professors with limited office hours. We saw how AI could bridge that gap.
              </p>
              <p>
                What began as an essay analyzer has grown into a complete academic toolkit. Our Paper Summarizer condenses long readings into digestible points. The Citation Finder locates real, verifiable sources for your claims. Study Packs turn notes into quizzes, flashcards, and more.
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

      <section className="relative py-16 sm:py-24 overflow-hidden border-t border-stone-200/90 dark:border-stone-800">
        <LandingSectionLayers variant="cta" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-6 py-10 sm:px-10 sm:py-12">
            <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-[#58CC02] dark:text-[#58CC02] mb-3">
              Get started
            </p>
            <div className="mx-auto mb-5 h-1 w-12 rounded-full bg-[#58CC02]" aria-hidden />
            <h2
              className="text-2xl sm:text-3xl lg:text-[2.35rem] font-extrabold text-stone-900 dark:text-stone-50 mb-4 tracking-tight leading-[1.15]"
              style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
            >
              {user ? 'Ready to write your next paper?' : 'Ready to improve your academic writing?'}
            </h2>
            <p className="text-base sm:text-lg text-stone-600 dark:text-stone-400 mb-8 max-w-xl mx-auto leading-relaxed">
              {user
                ? 'Head to your dashboard to analyze essays, find citations, or create study materials.'
                : 'Join students worldwide who use WriteScholar to write better and study smarter.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center">
              {user ? (
                <>
                  <button
                    type="button"
                    onClick={() => onNavigate('dashboard')}
                    className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#58CC02] hover:bg-[#4CAF00] text-white font-extrabold uppercase tracking-wide rounded-xl border-2 border-b-4 border-[#46A302] active:border-b-2 active:translate-y-0.5 transition-all duration-150 text-base"
                  >
                    Go to dashboard
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('features')}
                    className="inline-flex items-center justify-center px-7 py-3.5 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 font-extrabold uppercase tracking-wide rounded-xl border-2 border-b-4 border-stone-200 dark:border-stone-600 active:border-b-2 active:translate-y-0.5 hover:bg-stone-50 dark:hover:bg-stone-700 transition-all duration-150 text-base"
                  >
                    View features
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => onNavigate('signup')}
                    className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#58CC02] hover:bg-[#4CAF00] text-white font-extrabold uppercase tracking-wide rounded-xl border-2 border-b-4 border-[#46A302] active:border-b-2 active:translate-y-0.5 transition-all duration-150 text-base"
                  >
                    Try free
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('features')}
                    className="inline-flex items-center justify-center px-7 py-3.5 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 font-extrabold uppercase tracking-wide rounded-xl border-2 border-b-4 border-stone-200 dark:border-stone-600 active:border-b-2 active:translate-y-0.5 hover:bg-stone-50 dark:hover:bg-stone-700 transition-all duration-150 text-base"
                  >
                    Learn more
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

export default AboutPage;
