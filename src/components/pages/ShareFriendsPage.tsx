import { useState } from 'react';
import Header from '../common/Header';
import Footer from '../common/Footer';
import DualMascot from '../common/DualMascot';
import { useTheme } from '../../contexts/ThemeContext';

interface ShareFriendsPageProps {
  onNavigate: (page: string) => void;
  user?: { id: string; name: string; email: string; plan: string } | null;
  onLogout?: () => void;
}

// Animated floating background shapes
const FloatingShape = ({ className }: { className: string }) => (
  <div className={`absolute rounded-full pointer-events-none ${className}`} />
);

const ShareFriendsPage = ({ onNavigate, user, onLogout }: ShareFriendsPageProps) => {
  const { theme } = useTheme();
  const [copiedCode] = useState(false);
  const demoCode = 'WS-BUDDY-4872';

  const steps = [
    {
      num: '01',
      icon: '🪪',
      title: 'Get Your Unique Code',
      desc: 'Every WriteScholar account comes with a personal friend code. Share it anywhere — text, DM, or email.',
      color: 'from-indigo-500 to-violet-600',
      bg: 'bg-indigo-50 dark:bg-indigo-950/40',
      border: 'border-indigo-100 dark:border-indigo-900/50',
      accent: 'text-indigo-600 dark:text-indigo-400',
      pill: 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300',
    },
    {
      num: '02',
      icon: '✨',
      title: 'Create & Generate',
      desc: 'Make any study tool you want — flashcard decks, AI quizzes, crosswords or notes. It takes seconds.',
      color: 'from-violet-500 to-purple-600',
      bg: 'bg-violet-50 dark:bg-violet-950/40',
      border: 'border-violet-100 dark:border-violet-900/50',
      accent: 'text-violet-600 dark:text-violet-400',
      pill: 'bg-violet-100 dark:bg-violet-900/60 text-violet-700 dark:text-violet-300',
    },
    {
      num: '03',
      icon: '🚀',
      title: 'Share — They Accept',
      desc: 'Hit share, pick your friend, and it delivers straight to their WriteScholar. One tap to accept.',
      color: 'from-purple-500 to-fuchsia-600',
      bg: 'bg-purple-50 dark:bg-purple-950/40',
      border: 'border-purple-100 dark:border-purple-900/50',
      accent: 'text-purple-600 dark:text-purple-400',
      pill: 'bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300',
    },
  ];

  const shareables = [
    {
      icon: '🃏',
      title: 'Flashcard Decks',
      desc: 'Share entire decks of study cards. Your friend gets them instantly in their library.',
      gradient: 'from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30',
      border: 'border-indigo-100 dark:border-indigo-900/40',
      accent: 'text-indigo-600 dark:text-indigo-400',
    },
    {
      icon: '📝',
      title: 'Quizzes',
      desc: 'Built a killer quiz for a subject? Pass it on. Your friends can take it and track their score.',
      gradient: 'from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30',
      border: 'border-violet-100 dark:border-violet-900/40',
      accent: 'text-violet-600 dark:text-violet-400',
    },
    {
      icon: '🧩',
      title: 'Crossword Puzzles',
      desc: 'Crosswords are way more fun with friends. Share yours and see who finishes first.',
      gradient: 'from-purple-50 to-fuchsia-50 dark:from-purple-950/30 dark:to-fuchsia-950/30',
      border: 'border-purple-100 dark:border-purple-900/40',
      accent: 'text-purple-600 dark:text-purple-400',
    },
    {
      icon: '📒',
      title: 'Notes & Summaries',
      desc: 'Share your condensed notes and AI summaries so your whole group is on the same page.',
      gradient: 'from-fuchsia-50 to-pink-50 dark:from-fuchsia-950/30 dark:to-pink-950/30',
      border: 'border-fuchsia-100 dark:border-fuchsia-900/40',
      accent: 'text-fuchsia-600 dark:text-fuchsia-400',
    },
  ];

  const stats = [
    { value: '1 tap', label: 'to share anything' },
    { value: 'Instant', label: 'delivery to friends' },
    { value: 'Free', label: 'forever for core sharing' },
  ];

  return (
    <>
      <main className="min-h-screen font-sans overflow-x-hidden transition-colors" role="main">
        <Header onNavigate={onNavigate} user={user} onLogout={onLogout} sticky />

        {/* ══════════════════════════════════════════ */}
        {/* HERO SECTION                              */}
        {/* ══════════════════════════════════════════ */}
        <section className="relative overflow-hidden pt-16 pb-10 sm:pt-20 sm:pb-0">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/70 via-violet-50/40 to-white dark:from-stone-950 dark:via-stone-900 dark:to-stone-900" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_-15%,rgba(99,102,241,0.18),transparent)] dark:bg-[radial-gradient(ellipse_80%_55%_at_50%_-15%,rgba(139,92,246,0.14),transparent)]" />

          {/* Floating blobs */}
          <FloatingShape className="top-[8%] left-[5%] w-14 h-14 bg-gradient-to-br from-rose-400/20 to-pink-500/20 rotate-12 lg:hidden animate-float" />
          <FloatingShape className="top-[18%] right-[7%] w-12 h-12 bg-gradient-to-br from-violet-400/20 to-purple-500/20 lg:hidden animate-float-delayed" />
          <FloatingShape className="bottom-[30%] left-[8%] w-10 h-10 bg-gradient-to-br from-indigo-400/20 to-blue-500/20 lg:hidden animate-float" />
          <FloatingShape className="top-[25%] left-[4%] w-16 h-16 hidden lg:block bg-gradient-to-br from-violet-400/15 to-purple-500/10 animate-float rounded-2xl" />
          <FloatingShape className="top-[40%] right-[3%] w-20 h-20 hidden lg:block bg-gradient-to-br from-indigo-400/12 to-violet-500/8 animate-float-delayed rounded-full" />

          {/* Emoji accents */}
          <div className="absolute top-[14%] left-[9%] hidden lg:block text-4xl opacity-35 animate-float" style={{ animationDelay: '0.3s' }}>👫</div>
          <div className="absolute top-[35%] right-[7%] hidden lg:block text-3xl opacity-30 animate-float-delayed" style={{ animationDelay: '0.6s' }}>✨</div>
          <div className="absolute bottom-[20%] left-[6%] hidden lg:block text-3xl opacity-30 animate-float" style={{ animationDelay: '0.9s' }}>🎯</div>
          <div className="absolute bottom-[30%] right-[8%] hidden lg:block text-4xl opacity-35 animate-float-delayed">🚀</div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              {/* Left text */}
              <div className="text-center lg:text-left order-2 lg:order-1 pb-8 lg:pb-16">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-semibold mb-5">
                  <span>👫</span>
                  <span>Social Study, Levelled Up</span>
                </div>

                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-stone-900 dark:text-stone-50 leading-tight mb-5">
                  Study Better,{' '}
                  <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600 dark:from-indigo-400 dark:via-violet-400 dark:to-purple-400 bg-clip-text text-transparent">
                    Together
                  </span>
                </h1>

                <p className="text-lg sm:text-xl text-stone-600 dark:text-stone-300 leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0">
                  Add friends with your unique code and share flashcards, quizzes, crosswords & notes in one tap. It delivers straight to their device — all they have to do is accept.
                </p>

                {/* Stats row */}
                <div className="flex flex-wrap justify-center lg:justify-start gap-4 sm:gap-6 mb-8">
                  {stats.map((s) => (
                    <div key={s.label} className="text-center">
                      <div className="text-xl sm:text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">{s.value}</div>
                      <div className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 font-medium">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* CTA buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                  <button
                    onClick={() => onNavigate('signup')}
                    className="px-7 py-3.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-200 hover:-translate-y-0.5 text-base flex items-center justify-center gap-2"
                  >
                    <span>Start sharing free</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onNavigate('features')}
                    className="px-7 py-3.5 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 font-semibold rounded-2xl border border-stone-200 dark:border-stone-700 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 text-base"
                  >
                    See all features
                  </button>
                </div>
              </div>

              {/* Right mascot illustration */}
              <div className="relative flex items-center justify-center order-1 lg:order-2">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-400/10 to-violet-400/10 rounded-3xl blur-3xl" />
                <DualMascot size={440} />
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════ */}
        {/* YOUR UNIQUE CODE SECTION                  */}
        {/* ══════════════════════════════════════════ */}
        <section className="relative py-16 sm:py-24 bg-gradient-to-b from-white via-indigo-50/40 to-violet-50/30 dark:from-stone-900 dark:via-stone-900 dark:to-stone-900 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_50%,rgba(99,102,241,0.08),transparent)] dark:bg-[radial-gradient(ellipse_60%_40%_at_50%_50%,rgba(139,92,246,0.06),transparent)]" />

          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="inline-block px-4 py-1.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-semibold mb-4">
              Your Identity on WriteScholar
            </span>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-stone-800 dark:text-stone-100 mb-4">
              One Code.{' '}
              <span className="bg-gradient-to-r from-indigo-500 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
                Endless Friends.
              </span>
            </h2>
            <p className="text-base sm:text-lg text-stone-600 dark:text-stone-400 max-w-2xl mx-auto mb-10">
              Every account gets a permanent, human-readable friend code. No emails, no usernames to remember. Just drop the code, accept the friend request and you're connected.
            </p>

            {/* Code card */}
            <div className="relative inline-block group mb-10">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-400 to-violet-500 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
              <div className="relative bg-white dark:bg-stone-800 rounded-3xl px-8 sm:px-14 py-8 shadow-2xl border border-indigo-200/60 dark:border-indigo-800/40">
                <p className="text-xs sm:text-sm font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-3">Your unique friend code</p>
                <div className="flex items-center justify-center gap-3 sm:gap-5 flex-wrap">
                  <span className="text-3xl sm:text-5xl font-black tracking-widest bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent font-mono">
                    {demoCode}
                  </span>
                  <button
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-100 dark:bg-indigo-900/50 hover:bg-indigo-200 dark:hover:bg-indigo-800/60 text-indigo-700 dark:text-indigo-300 font-semibold rounded-xl text-sm transition-colors"
                  >
                    {copiedCode ? (
                      <>
                        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        Copy code
                      </>
                    )}
                  </button>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
                  {['Easy to remember', 'Shareable anywhere', 'Yours forever'].map((tag) => (
                    <span key={tag} className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-stone-500 dark:text-stone-400">
                      <svg className="w-4 h-4 text-indigo-500 dark:text-indigo-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <p className="text-sm text-stone-400 dark:text-stone-500">This is a demo code — sign up to get your own unique code instantly.</p>
          </div>
        </section>

        {/* ══════════════════════════════════════════ */}
        {/* HOW IT WORKS — 3 STEPS                    */}
        {/* ══════════════════════════════════════════ */}
        <section className="relative py-16 sm:py-28 bg-white dark:bg-stone-900 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(139,92,246,0.07),transparent)]" />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-20">
              <span className="inline-block px-4 py-1.5 bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 rounded-full text-sm font-semibold mb-4">
                Ridiculously Simple
              </span>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-stone-800 dark:text-stone-100 mb-4">
                How It Works —{' '}
                <span className="bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400 bg-clip-text text-transparent">
                  3 Steps Flat
                </span>
              </h2>
              <p className="text-base sm:text-lg text-stone-600 dark:text-stone-400 max-w-2xl mx-auto">
                No invitations, no waiting, no friction. Create, share, done.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
              {steps.map((step, i) => (
                <div key={step.num} className="relative group">
                  {/* Connector line between steps */}
                  {i < steps.length - 1 && (
                    <div className="hidden md:block absolute top-12 left-[calc(50%+4rem)] w-[calc(100%-2rem)] h-0.5 bg-gradient-to-r from-violet-200 to-transparent dark:from-violet-800/50 dark:to-transparent z-0" />
                  )}
                  <div className={`relative z-10 ${step.bg} border ${step.border} rounded-3xl p-7 sm:p-8 hover:shadow-xl hover:-translate-y-2 transition-all duration-300`}>
                    {/* Step number */}
                    <div className="flex items-center justify-between mb-5">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg text-2xl`}>
                        {step.icon}
                      </div>
                      <span className={`text-4xl font-black ${step.accent} opacity-20 select-none`}>{step.num}</span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-stone-800 dark:text-stone-100 mb-3">{step.title}</h3>
                    <p className="text-stone-600 dark:text-stone-400 text-sm sm:text-base leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════ */}
        {/* WHAT YOU CAN SHARE                        */}
        {/* ══════════════════════════════════════════ */}
        <section className="relative py-16 sm:py-28 bg-gradient-to-b from-stone-50 to-white dark:from-stone-950/60 dark:to-stone-900 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 opacity-20" />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16">
              <span className="inline-block px-4 py-1.5 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-full text-sm font-semibold mb-4">
                Everything in Your Library
              </span>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-stone-800 dark:text-stone-100 mb-4">
                Share{' '}
                <span className="bg-gradient-to-r from-purple-600 to-fuchsia-600 dark:from-purple-400 dark:to-fuchsia-400 bg-clip-text text-transparent">
                  Any Study Tool
                </span>
              </h2>
              <p className="text-base sm:text-lg text-stone-600 dark:text-stone-400 max-w-2xl mx-auto">
                Anything you create in WriteScholar can be shared. Your work helps the whole squad.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
              {shareables.map((item) => (
                <div
                  key={item.title}
                  className={`group bg-gradient-to-br ${item.gradient} border ${item.border} rounded-3xl p-6 sm:p-7 hover:shadow-xl hover:-translate-y-2 transition-all duration-300`}
                >
                  <div className="text-4xl mb-4">{item.icon}</div>
                  <h3 className={`text-lg font-bold mb-2 ${item.accent}`}>{item.title}</h3>
                  <p className="text-stone-600 dark:text-stone-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════ */}
        {/* INSTANT DELIVERY SHOWCASE                 */}
        {/* ══════════════════════════════════════════ */}
        <section className="relative py-16 sm:py-28 bg-white dark:bg-stone-900 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_50%,rgba(99,102,241,0.06),transparent)] dark:bg-[radial-gradient(ellipse_70%_50%_at_50%_50%,rgba(139,92,246,0.05),transparent)]" />

          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative group rounded-3xl overflow-hidden">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-400 to-violet-500 rounded-3xl blur-xl opacity-15 group-hover:opacity-25 transition-opacity duration-500" />
              <div className="relative bg-white dark:bg-stone-800 rounded-3xl border border-stone-200/50 dark:border-stone-700 shadow-2xl overflow-hidden">
                <div className="grid lg:grid-cols-2 gap-0">
                  {/* Left: text */}
                  <div className="p-8 sm:p-12 lg:p-16 flex flex-col justify-center">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform duration-300 text-2xl">
                      ⚡
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-stone-800 dark:text-stone-100 mb-4">
                      Instant Delivery — No Email, No Links
                    </h3>
                    <p className="text-stone-600 dark:text-stone-400 text-base sm:text-lg leading-relaxed mb-6">
                      When you share something with a friend, it appears as a notification in their WriteScholar. They tap <strong className="text-stone-800 dark:text-stone-200">Accept</strong>, and it's in their library — ready to study with.
                    </p>
                    <ul className="space-y-3">
                      {[
                        'No copy-pasting links',
                        'No forwarding files',
                        'Organised in their library automatically',
                        'Works on any device',
                      ].map((point) => (
                        <li key={point} className="flex items-center gap-3 text-stone-600 dark:text-stone-400 text-sm sm:text-base">
                          <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0">
                            <svg className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </span>
                          {point}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => onNavigate('signup')}
                      className="mt-8 self-start px-6 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/25 hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 flex items-center gap-2"
                    >
                      Get started free
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </button>
                  </div>

                  {/* Right: mock notification UI */}
                  <div className="relative bg-gradient-to-br from-indigo-50 to-violet-50/60 dark:from-indigo-950/30 dark:to-violet-950/20 p-8 sm:p-12 flex items-center justify-center min-h-[320px]">
                    <div className="absolute top-6 right-6 text-4xl opacity-20 animate-float">🎁</div>
                    <div className="absolute bottom-8 left-8 text-3xl opacity-20 animate-float-delayed">💌</div>

                    {/* Notification card mockup */}
                    <div className="w-full max-w-xs sm:max-w-sm space-y-3">
                      <p className="text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-4 text-center">Live in their WriteScholar</p>

                      {/* Incoming notification */}
                      <div className="bg-white dark:bg-stone-700 rounded-2xl p-4 shadow-lg border border-indigo-100 dark:border-indigo-900/40 animate-[card-breathe_4s_ease-in-out_infinite]">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-lg flex-shrink-0">🃏</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-stone-800 dark:text-stone-100 truncate">Alex shared "Bio Exam Deck"</p>
                            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">48 flashcards · Just now</p>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button className="flex-1 py-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-xs font-bold rounded-xl hover:opacity-90 transition-opacity">
                            Accept
                          </button>
                          <button className="px-4 py-2 bg-stone-100 dark:bg-stone-600 text-stone-500 dark:text-stone-300 text-xs font-semibold rounded-xl hover:bg-stone-200 dark:hover:bg-stone-500 transition-colors">
                            Decline
                          </button>
                        </div>
                      </div>

                      {/* Second notification */}
                      <div className="bg-white dark:bg-stone-700 rounded-2xl p-4 shadow-md border border-violet-100 dark:border-violet-900/40 opacity-75">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-600 flex items-center justify-center text-lg flex-shrink-0">🧩</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-stone-800 dark:text-stone-100 truncate">Jordan shared "Chem Crossword"</p>
                            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">22 words · 2 min ago</p>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button className="flex-1 py-2 bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white text-xs font-bold rounded-xl hover:opacity-90 transition-opacity">
                            Accept
                          </button>
                          <button className="px-4 py-2 bg-stone-100 dark:bg-stone-600 text-stone-500 dark:text-stone-300 text-xs font-semibold rounded-xl">
                            Decline
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════ */}
        {/* FINAL CTA                                 */}
        {/* ══════════════════════════════════════════ */}
        <section className="relative py-20 sm:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,rgba(255,255,255,0.08),transparent)]" />

          {/* Floating emoji */}
          <div className="absolute top-10 left-[8%] text-5xl opacity-20 animate-float">👫</div>
          <div className="absolute top-16 right-[10%] text-4xl opacity-15 animate-float-delayed">✨</div>
          <div className="absolute bottom-12 left-[12%] text-4xl opacity-20 animate-float-delayed" style={{ animationDelay: '0.5s' }}>🎯</div>
          <div className="absolute bottom-10 right-[8%] text-5xl opacity-15 animate-float" style={{ animationDelay: '0.8s' }}>🚀</div>

          <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 text-white rounded-full text-sm font-semibold mb-6">
              <span>🎉</span>
              <span>Free to start · No credit card</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white mb-5 leading-tight">
              Get your code.<br />
              Add your crew.<br />
              Study together.
            </h2>
            <p className="text-indigo-100 text-base sm:text-xl leading-relaxed mb-10 max-w-xl mx-auto">
              Join thousands of students using WriteScholar to study smarter with their friends.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => onNavigate('signup')}
                className="px-8 py-4 bg-white text-indigo-700 font-bold rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-200 text-base flex items-center justify-center gap-2"
              >
                Create your free account
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
              <button
                onClick={() => onNavigate('features')}
                className="px-8 py-4 bg-white/15 hover:bg-white/25 text-white font-semibold rounded-2xl border border-white/30 hover:border-white/50 transition-all duration-200 hover:-translate-y-0.5 text-base"
              >
                Explore all features
              </button>
            </div>
          </div>
        </section>

        <Footer onNavigate={onNavigate} />
      </main>
    </>
  );
};

export default ShareFriendsPage;
