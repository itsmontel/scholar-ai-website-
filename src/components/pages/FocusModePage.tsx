import Header from '../common/Header';
import Footer from '../common/Footer';
import ScholarMascot from '../common/ScholarMascot';
import { FOCUS_MODE_COMING_SOON } from '../../constants/focusMode';

interface FocusModePageProps {
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

const FocusModePage = ({ onNavigate, user, onLogout }: FocusModePageProps) => {
  const steps = [
    {
      num: 1,
      title: 'Pick Sites to Block',
      desc: 'Choose the sites that steal your focus — YouTube, TikTok, Instagram, Reddit, or any custom domain. Pro: 10 sites. Premium: unlimited.',
      icon: '🚫',
      gradient: 'from-orange-500 to-amber-600',
      shadow: 'shadow-orange-500/25',
    },
    {
      num: 2,
      title: 'Answer to Unlock',
      desc: "Try to visit a blocked site and you'll face a quick quiz from your own study material. Get 4 out of 5 right to unlock it.",
      icon: '📝',
      gradient: 'from-violet-500 to-purple-600',
      shadow: 'shadow-violet-500/25',
    },
    {
      num: 3,
      title: 'Enjoy Your Break',
      desc: "Passed the quiz? The site unlocks for 15 minutes to 24 hours — you choose. When time's up, study again to earn more time.",
      icon: '🎉',
      gradient: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-emerald-500/25',
    },
  ];

  const features = [
    {
      title: 'Chrome Extension',
      desc: 'Works directly in your browser. Install once, block distractions everywhere.',
      icon: (
        <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
    },
    {
      title: 'Your Own Material',
      desc: 'Questions pulled from your uploaded notes and study tools. Study what matters.',
      icon: (
        <svg className="w-6 h-6 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      title: 'Customisable Timer',
      desc: "Set unlock duration from 15 minutes to 24 hours. You're in control.",
      icon: (
        <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: 'Block Any Site',
      desc: 'Popular presets plus add any custom domain. Pro: 10 sites. Premium: unlimited.',
      icon: (
        <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/80 via-stone-50 to-white dark:from-stone-950 dark:via-stone-900 dark:to-stone-900">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="focus-mode" />

      {FOCUS_MODE_COMING_SOON ? (
        <>
        {/* Coming Soon — Chrome extension pending approval */}
        <section className="relative py-24 sm:py-32 px-4 sm:px-6">
          <div className="max-w-2xl mx-auto text-center">
            <span className="inline-flex items-center px-3 py-1 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 rounded-full text-sm font-semibold mb-6">
              Coming Soon
            </span>
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-8 text-4xl shadow-xl shadow-violet-500/25">
              🔒
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-800 dark:text-stone-100 mb-6">
              Focus Mode is on its way
            </h1>
            <p className="text-lg text-stone-500 dark:text-stone-400 leading-relaxed mb-8">
              Our Chrome extension is currently under review. Soon you&apos;ll be able to block distracting sites like YouTube, TikTok, and Reddit — and earn your screen time by answering study questions first. We&apos;ll have it ready for you as soon as it&apos;s approved.
            </p>
            <p className="text-sm text-stone-400 dark:text-stone-500">
              Thanks for your patience — it&apos;ll be worth the wait.
            </p>
            {user && (
              <button
                onClick={() => onNavigate('dashboard')}
                className="mt-8 px-6 py-3 border-2 border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 font-semibold rounded-2xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                Back to Dashboard
              </button>
            )}
          </div>
        </section>
        <Footer onNavigate={onNavigate} />
        </>
      ) : (
        <>
      {/* Hero Section */}
      <section className="relative py-16 sm:py-20 border-b border-stone-200/60 dark:border-stone-700/60 overflow-hidden">
        <div className="absolute top-[35%] left-[5%] hidden xl:block text-4xl opacity-50 animate-float">🔒</div>
        <div className="absolute top-[40%] right-[6%] hidden xl:block text-3xl opacity-45 animate-float-delayed">📵</div>
        <div className="absolute bottom-[35%] left-[6%] hidden xl:block text-3xl opacity-45 animate-float">🧠</div>
        <div className="absolute bottom-[30%] right-[5%] hidden xl:block text-4xl opacity-50 animate-float-delayed">✏️</div>
        <div className="hidden lg:block absolute right-4 xl:right-12 top-1/2 -translate-y-1/2 z-10 opacity-90 animate-float">
          <ScholarMascot size={120} animated={true} pose="celebrating" />
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10 lg:gap-12">
            <div className="flex-1 text-center lg:text-left max-w-3xl mx-auto lg:mx-0">
              <span className="inline-flex items-center px-3 py-1 bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-400 rounded-full text-sm font-semibold mb-6">
                New Feature
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-stone-800 dark:text-stone-100 mb-6 leading-tight">
                Block distracting websites until you
                <span className="block mt-1 bg-gradient-to-r from-violet-500 to-purple-600 dark:from-violet-400 dark:to-purple-400 bg-clip-text text-transparent">earn your break</span>
              </h1>
              <p className="text-lg text-stone-500 dark:text-stone-400 leading-relaxed">
                Focus Mode blocks sites like YouTube, TikTok, and Instagram until you answer study questions. You can&apos;t scroll — until you've studied.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <button
                  onClick={() => onNavigate('signup')}
                  className="px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 text-white font-bold rounded-2xl shadow-lg shadow-violet-500/25 transition-all"
                >
                  Try Focus Mode Free
                </button>
                <button
                  onClick={() => onNavigate('account')}
                  className="px-6 py-3 border-2 border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 font-semibold rounded-2xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                >
                  Manage Blocked Sites
                </button>
              </div>
            </div>
            <div className="hidden lg:block flex-shrink-0 w-24 h-28 xl:w-28 xl:h-32" />
          </div>
        </div>
      </section>

      {/* Video: How Focus Mode works - hide for logged-in paid users */}
      {!(user && ['pro', 'premium'].includes((user.plan || user.subscription_plan || '').toLowerCase())) && (
        <section className="py-12 sm:py-16 bg-white dark:bg-stone-900/50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 className="text-xl sm:text-2xl font-extrabold text-stone-800 dark:text-stone-100 mb-6 text-center">
              See how it works
            </h2>
            <div className="relative rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-700 shadow-xl aspect-video bg-stone-100 dark:bg-stone-800">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
                title="WriteScholar Focus Mode — Block distractions, answer quiz to unlock"
                aria-label="WriteScholar Focus Mode — Block distractions, answer quiz to unlock"
              >
                <source src="/writescholar-focus-mode-demo.mp4" type="video/mp4" />
              </video>
            </div>
          </div>
        </section>
      )}

      {/* How It Works - 3 Steps */}
      <section className="py-16 sm:py-20 bg-white dark:bg-stone-900/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-800 dark:text-stone-100 mb-4">How it works</h2>
            <p className="text-stone-500 dark:text-stone-400 max-w-xl mx-auto">
              Three simple steps to turn procrastination into productivity
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div key={step.num} className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-br from-violet-400/10 to-purple-400/10 rounded-3xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-3xl p-8 hover:shadow-xl hover:border-violet-200 dark:hover:border-violet-800/50 transition-all">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center mb-6 text-2xl shadow-lg ${step.shadow}`}>
                    {step.icon}
                  </div>
                  <span className="inline-block px-2.5 py-1 bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-full text-xs font-bold mb-4">
                    Step {step.num}
                  </span>
                  <h3 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-3">{step.title}</h3>
                  <p className="text-stone-500 dark:text-stone-400 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row gap-12 items-center mb-14">
            <div className="flex-1">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-800 dark:text-stone-100 mb-6">
                Why Focus Mode works
              </h2>
              <p className="text-stone-500 dark:text-stone-400 leading-relaxed mb-6">
                Unlike simple website blockers, Focus Mode ties screen time to learning. Every minute you spend on a blocked site is earned by answering questions from your actual study material.
              </p>
              <div className="flex items-center gap-4">
                <ScholarMascot size={72} animated={true} pose="thinking" />
                <p className="text-sm text-stone-500 dark:text-stone-400 italic">
                  "Study first. Scroll later."
                </p>
              </div>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-4">
              {features.map((f, i) => (
                <div key={i} className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl p-6 hover:shadow-lg hover:border-violet-200 dark:hover:border-violet-800/50 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-3">
                    {f.icon}
                  </div>
                  <h4 className="font-bold text-stone-800 dark:text-stone-100 mb-1">{f.title}</h4>
                  <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Requirements & CTA */}
      <section className="py-16 sm:py-20 bg-stone-800 dark:bg-stone-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <ScholarMascot size={80} animated={false} pose="celebrating" />
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-6 mb-4">
            Ready to earn your screen time?
          </h2>
          <p className="text-stone-400 mb-8 max-w-xl mx-auto">
            Focus Mode is available with Pro and Premium plans. Pro: 10 blocked sites. Premium: unlimited. Install the Chrome extension, add your study material, and start blocking distractions.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {user ? (
              <>
                <button
                  onClick={() => onNavigate('account')}
                  className="px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold rounded-2xl hover:from-violet-400 hover:to-purple-500 shadow-lg shadow-violet-500/25 transition-all"
                >
                  Configure Focus Mode
                </button>
                {(user.plan === 'Free' || user.plan === 'free') && (
                  <button
                    onClick={() => onNavigate('pricing')}
                    className="px-6 py-3 border-2 border-stone-500 text-white font-semibold rounded-2xl hover:border-stone-400 transition-colors"
                  >
                    Upgrade to Pro
                  </button>
                )}
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
                  onClick={() => onNavigate('pricing')}
                  className="px-6 py-3 border-2 border-stone-500 text-white font-semibold rounded-2xl hover:border-stone-400 transition-colors"
                >
                  View Pricing
                </button>
              </>
            )}
          </div>
          <p className="mt-6 text-stone-500 text-sm">
            Pro: 10 sites • Premium: unlimited • Chrome extension required
          </p>
        </div>
      </section>

      <Footer onNavigate={onNavigate} />
        </>
      )}
    </div>
  );
};

export default FocusModePage;
