import React, { useEffect } from 'react';
import Header from '../common/Header';
import Footer from '../common/Footer';
import ScholarMascot from '../common/ScholarMascot';
import { FOCUS_MODE_COMING_SOON, FOCUS_MODE_CHROME_EXTENSION_URL } from '../../constants/focusMode';

const FOCUS_MODE_FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: 'Does Focus Mode work on mobile?', acceptedAnswer: { '@type': 'Answer', text: 'Focus Mode uses a Chrome extension, so it works in Chrome on desktop. Mobile browsers don\'t support extensions yet. Many students find blocking on desktop alone significantly reduces distraction.' } },
    { '@type': 'Question', name: 'What if I need YouTube for a lecture?', acceptedAnswer: { '@type': 'Answer', text: 'You can temporarily pause Focus Mode or add exceptions. The goal is to reduce mindless scrolling, not block legitimate study resources.' } },
    { '@type': 'Question', name: 'How many questions do I need to answer to unlock?', acceptedAnswer: { '@type': 'Answer', text: 'You can customize the threshold and number of questions in your settings. By default it\'s 4 out of 5 correct. The quiz pulls questions from your own study material.' } },
    { '@type': 'Question', name: 'Which sites can I block?', acceptedAnswer: { '@type': 'Answer', text: 'Popular presets plus any custom domain. Free: 3 sites. Paid: unlimited.' } },
  ],
};

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
  useEffect(() => {
    if (FOCUS_MODE_COMING_SOON) return;
    const id = 'focus-mode-faq-schema';
    let el = document.getElementById(id);
    if (el) el.remove();
    el = document.createElement('script');
    el.id = id;
    el.type = 'application/ld+json';
    el.textContent = JSON.stringify(FOCUS_MODE_FAQ_SCHEMA);
    document.head.appendChild(el);
    return () => { document.getElementById(id)?.remove(); };
  }, []);

  const steps = [
    {
      num: 1,
      title: 'Pick Sites to Block',
      desc: 'Choose the sites that steal your focus. Free: 3 sites. Paid: unlimited.',
      icon: '🚫',
      gradient: 'from-orange-500 to-amber-600',
      shadow: 'shadow-orange-500/25',
    },
    {
      num: 2,
      title: 'Answer to Unlock',
      desc: "Try to visit a blocked site and you'll solve a puzzle (Sudoku, Memory, Pattern) or answer a quick quiz from your own study material. Pass your customized threshold to unlock.",
      icon: '📝',
      gradient: 'from-violet-500 to-purple-600',
      shadow: 'shadow-violet-500/25',
    },
    {
      num: 3,
      title: 'Enjoy Your Break',
      desc: "Passed the quiz or solved the puzzle? The site unlocks for 15 minutes to 24 hours — you choose. When time's up, study again to earn more time.",
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
        <svg className="w-6 h-6 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      desc: 'Popular presets plus add any custom domain. Free: 3 sites. Paid: unlimited.',
      icon: (
        <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50/80 via-stone-50 to-white dark:from-stone-950 dark:via-stone-900 dark:to-stone-900">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="focus-mode" />

      {FOCUS_MODE_COMING_SOON ? (
        <>
        {/* Coming Soon — Chrome extension pending approval */}
        <section className="relative py-24 sm:py-32 px-4 sm:px-6">
          <div className="max-w-2xl mx-auto text-center">
            <span className="inline-flex items-center px-3 py-1 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 rounded-full text-sm font-semibold mb-6">
              Coming Soon
            </span>
            <div className="w-20 h-20 rounded-2xl bg-violet-600 hover:bg-violet-500 flex items-center justify-center mx-auto mb-8 text-4xl shadow-xl shadow-violet-500/25">
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
      {/* Premium Hero — full gradient, flagship treatment */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-950 via-violet-900 to-purple-950 dark:from-violet-950 dark:via-violet-950 dark:to-stone-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(139,92,246,0.35),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_90%_90%,rgba(236,72,153,0.2),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_30%_at_10%_80%,rgba(99,102,241,0.15),transparent_50%)]" />
        <div className="absolute top-20 left-[8%] hidden lg:block text-4xl opacity-40 animate-float">🔒</div>
        <div className="absolute top-32 right-[10%] hidden lg:block text-3xl opacity-35 animate-float-delayed">📵</div>
        <div className="absolute bottom-40 left-[12%] hidden lg:block text-3xl opacity-35 animate-float">🎯</div>
        <div className="absolute bottom-32 right-[8%] hidden lg:block text-4xl opacity-40 animate-float-delayed">✨</div>
        <div className="absolute top-1/2 left-[5%] hidden xl:block text-2xl opacity-30 animate-float">🧠</div>
        <div className="absolute top-1/3 right-[5%] hidden xl:block text-2xl opacity-30 animate-float-delayed">⏰</div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-3 mb-8">
              <div className="relative">
                <div className="absolute -inset-2 bg-violet-400/20 rounded-full blur-xl animate-pulse" />
                <ScholarMascot size={72} animated={true} pose="pointing" />
              </div>
              <span className="px-5 py-2 bg-white/10 backdrop-blur-md text-violet-200 rounded-full text-sm font-bold border border-white/20 shadow-lg shadow-violet-500/10">
                ⚡ Flagship Feature
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-white mb-6 tracking-tight leading-[1.1]">
              Earn Your
              <span className="block mt-1 bg-gradient-to-r from-violet-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
                Free Time
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-violet-200/90 max-w-2xl mx-auto leading-relaxed mb-4">
              Block sites until you solve a puzzle or answer study questions. No scroll until you&apos;ve earned it.
            </p>
            <p className="text-sm text-violet-300/70 mb-10">
              Trusted by 50k+ students
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <button
                onClick={() => onNavigate('signup')}
                className="inline-flex items-center gap-2 px-8 py-4 bg-violet-600 text-white font-bold rounded-2xl hover:bg-violet-500 hover:scale-105 active:scale-95 shadow-2xl shadow-violet-500/30 transition-all"
              >
                Try Focus Mode Free
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
              {user && ['pro', 'premium'].includes((user.plan || user.subscription_plan || '').toLowerCase()) && (
                <button
                  onClick={() => onNavigate('account')}
                  className="px-6 py-3 border-2 border-white/40 text-white font-semibold rounded-2xl hover:bg-white/10 transition-colors"
                >
                  Manage Blocked Sites
                </button>
              )}
              <a
                href={FOCUS_MODE_CHROME_EXTENSION_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-2xl border border-white/20 hover:bg-white/20 transition-colors"
              >
                <span className="text-lg">🧩</span>
                Install Chrome Extension
              </a>
            </div>
          </div>

          {/* Hero Video — always visible on flagship */}
          <div className="relative max-w-4xl mx-auto">
            <div className="absolute -inset-4 bg-gradient-to-r from-violet-500/20 via-violet-500/20 to-fuchsia-500/20 rounded-3xl blur-2xl" />
            <div className="relative rounded-2xl overflow-hidden ring-2 ring-white/20 shadow-2xl shadow-violet-500/20">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="w-full aspect-video object-cover"
                title="WriteScholar Focus Mode — Block distractions, solve puzzle or answer quiz to unlock"
                aria-label="WriteScholar Focus Mode — Block distractions, solve puzzle or answer quiz to unlock"
              >
                <source src="/writescholar-focus-mode-demo.mp4" type="video/mp4" />
              </video>
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <span className="px-3 py-1.5 bg-black/50 backdrop-blur-sm text-white/90 rounded-lg text-sm font-medium">
                  See it in action
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works — 3 Steps with videos */}
      <section className="relative py-20 sm:py-28 bg-white dark:bg-stone-900/50 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(139,92,246,0.06),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(139,92,246,0.04),transparent)]" />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-400 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
              Simple as 1-2-3
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-stone-800 dark:text-stone-100 mb-4">
              Pick sites to block, answer to unlock, enjoy your break
            </h2>
            <p className="text-stone-500 dark:text-stone-400 max-w-xl mx-auto">
              Three simple steps to turn procrastination into productivity
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-6 relative">
            {steps.map((step) => (
              <div key={step.num} className="group relative">
                <div className="absolute -inset-2 bg-gradient-to-br from-violet-400/10 to-purple-400/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative bg-white dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-700 rounded-3xl overflow-hidden hover:shadow-2xl hover:border-violet-300 dark:hover:border-violet-700/50 transition-all duration-300">
                  <div className="aspect-[5/4] min-h-[200px] flex items-center justify-center bg-gradient-to-b from-violet-500/10 to-transparent overflow-hidden">
                    <video
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      title={`Focus Mode Step ${step.num} — ${step.title}`}
                      aria-label={`Focus Mode Step ${step.num} — ${step.title}`}
                    >
                      <source src={`/writescholar-focus-mode-step${step.num}-demo.mp4`} type="video/mp4" />
                    </video>
                  </div>
                  <div className="p-6 sm:p-8">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="w-10 h-10 rounded-xl bg-violet-600 hover:bg-violet-500 flex items-center justify-center text-white font-black text-lg shadow-lg flex-shrink-0">
                        {step.num}
                      </span>
                      <h3 className="text-xl font-bold text-stone-800 dark:text-stone-100">{step.title}</h3>
                    </div>
                    <p className="text-stone-500 dark:text-stone-400 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why It Works + Features Grid */}
      <section className="py-20 sm:py-28 bg-stone-50 dark:bg-stone-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row gap-16 items-start mb-16">
            <div className="flex-1">
              <h2 className="text-2xl sm:text-4xl font-extrabold text-stone-800 dark:text-stone-100 mb-6">
                Why Focus Mode actually works
              </h2>
              <p className="text-stone-600 dark:text-stone-400 leading-relaxed mb-6">
                Most blockers just frustrate you. Focus Mode ties screen time to learning. Every minute on TikTok is earned by solving a puzzle or answering questions from your own notes. Your brain starts associating breaks with achievement, not guilt.
              </p>
              <div className="flex flex-wrap gap-3 mb-8">
                <div className="flex items-center gap-2 px-4 py-2 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-xl text-sm font-medium">
                  <span className="text-green-500">✓</span> Guilt-free scrolling
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-xl text-sm font-medium">
                  <span className="text-green-500">✓</span> Reinforces learning
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-xl text-sm font-medium">
                  <span className="text-green-500">✓</span> Builds habits
                </div>
              </div>
              <div className="flex items-center gap-4">
                <ScholarMascot size={80} animated={true} pose="thinking" />
                <p className="text-stone-600 dark:text-stone-400 italic font-medium">
                  &quot;Study first. Scroll later.&quot;
                </p>
              </div>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-4">
              {features.map((f, i) => (
                <div key={i} className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl p-6 hover:shadow-xl hover:border-violet-200 dark:hover:border-violet-800/50 transition-all">
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

      {/* Testimonial */}
      <section className="py-16 sm:py-20 bg-white dark:bg-stone-900/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="relative inline-block mb-6">
            <svg className="w-14 h-14 text-violet-300 dark:text-violet-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
            </svg>
          </div>
          <blockquote className="text-xl sm:text-2xl text-stone-700 dark:text-stone-200 font-medium leading-relaxed mb-8">
            I used to waste 3+ hours on TikTok every day. Now I actually look forward to studying because it means I&apos;ve earned my break. My grades went up a full letter.
          </blockquote>
          <div className="flex items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold text-lg">
              M
            </div>
            <div className="text-left">
              <div className="font-semibold text-stone-800 dark:text-stone-100">Maya S.</div>
              <div className="text-stone-500 dark:text-stone-400 text-sm">Pre-Med Student</div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 sm:py-28 bg-stone-50 dark:bg-stone-900" id="faq">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-stone-800 dark:text-stone-100 mb-12 text-center">
            Frequently asked questions
          </h2>
          <div className="space-y-8">
            {[
              { q: 'Does Focus Mode work on mobile?', a: 'Focus Mode uses a Chrome extension, so it works in Chrome on desktop. Mobile browsers don\'t support extensions yet. Many students find blocking on desktop alone significantly reduces distraction.' },
              { q: 'What if I need YouTube for a lecture?', a: 'You can temporarily pause Focus Mode or add exceptions. The goal is to reduce mindless scrolling, not block legitimate study resources.' },
              { q: 'How many questions do I need to answer to unlock?', a: 'You can customize the threshold and number of questions in your settings. By default it\'s 4 out of 5 correct. The quiz pulls questions from your own study material.' },
              { q: 'Which sites can I block?', a: 'Popular presets plus any custom domain. Free: 3 sites. Paid: unlimited.' },
            ].map((faq, i) => (
              <div key={i} className="bg-white dark:bg-stone-800 rounded-2xl p-6 border border-stone-200 dark:border-stone-700">
                <h3 className="font-bold text-stone-800 dark:text-stone-100 text-lg mb-3">{faq.q}</h3>
                <p className="text-stone-500 dark:text-stone-400 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-950 via-violet-900 to-purple-950 dark:from-violet-950 dark:via-violet-950 dark:to-stone-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(139,92,246,0.25),transparent_60%)]" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <ScholarMascot size={96} animated={true} pose="celebrating" />
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-6 mb-4">
            Ready to earn your screen time?
          </h2>
          <p className="text-violet-200/90 mb-10 max-w-xl mx-auto">
            Pro: 20 blocked sites. Premium: unlimited. Install the Chrome extension, add your study material, and start blocking distractions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {user ? (
              <>
                {['pro', 'premium'].includes((user.plan || user.subscription_plan || '').toLowerCase()) ? (
                  <button
                    onClick={() => onNavigate('account')}
                    className="inline-flex items-center gap-2 px-8 py-4 bg-white text-violet-900 font-bold rounded-2xl hover:bg-violet-50 hover:scale-105 active:scale-95 shadow-2xl shadow-black/25 transition-all"
                  >
                    Configure Focus Mode
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => onNavigate('account')}
                      className="px-6 py-3 border-2 border-white/40 text-white font-semibold rounded-2xl hover:bg-white/10 transition-colors"
                    >
                      Try with free plan (3 sites)
                    </button>
                    <button
                      onClick={() => onNavigate('pricing')}
                      className="inline-flex items-center gap-2 px-8 py-4 bg-white text-violet-900 font-bold rounded-2xl hover:bg-violet-50 hover:scale-105 active:scale-95 shadow-2xl shadow-black/25 transition-all"
                    >
                      Upgrade to Pro (20 sites)
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </button>
                  </>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={() => onNavigate('signup')}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-violet-600 text-white font-bold rounded-2xl hover:bg-violet-500 hover:scale-105 active:scale-95 shadow-2xl shadow-violet-500/30 transition-all"
                >
                  Try Focus Mode Free
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
                <button
                  onClick={() => onNavigate('pricing')}
                  className="px-6 py-3 border-2 border-white/40 text-white font-semibold rounded-2xl hover:bg-white/10 transition-colors"
                >
                  View Pricing
                </button>
              </>
            )}
            <a
              href={FOCUS_MODE_CHROME_EXTENSION_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-2xl border border-white/20 hover:bg-white/20 transition-colors"
            >
              Install Chrome Extension →
            </a>
          </div>
          <p className="mt-8 text-violet-300/80 text-sm">
            Free: 3 sites • Paid: unlimited • Chrome extension required
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
