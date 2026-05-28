import { Suspense, useState } from 'react';
import { lazyWithRetry } from '../../utils/lazyWithRetry';
import LandingScrollReveal from './LandingScrollReveal';
import LandingSectionBackdrop from './LandingSectionBackdrop';

const InteractiveDocumentAnalysis = lazyWithRetry(() => import('./InteractiveDocumentAnalysis'));

interface LandingInteractiveDemoSectionProps {
  onNavigate: (page: string) => void;
}

const UNIVERSITIES = [
  { name: 'Harvard', className: 'university-harvard' },
  { name: 'Oxford', className: 'university-oxford' },
  { name: 'Stanford', className: 'university-stanford' },
  { name: 'MIT', className: 'university-mit' },
  { name: 'Cambridge', className: 'university-cambridge' },
  { name: 'Yale', className: 'university-yale' },
  { name: 'Princeton', className: 'university-princeton' },
  { name: 'Florida State', className: 'university-florida-state' },
  { name: 'UCLA', className: 'university-ucla' },
  { name: 'Berkeley', className: 'university-berkeley' },
  { name: 'Columbia', className: 'university-columbia' },
] as const;

export default function LandingInteractiveDemoSection({ onNavigate }: LandingInteractiveDemoSectionProps) {
  const [activeGradeLetter, setActiveGradeLetter] = useState('B');

  return (
    <section
      id="interactive-demo"
      aria-labelledby="interactive-demo-heading"
      className="relative w-full pt-12 sm:pt-16 lg:pt-20 pb-16 sm:pb-20 lg:pb-24 overflow-hidden scroll-mt-20 sm:scroll-mt-24"
    >
      <LandingSectionBackdrop
        base="bg-[#FCFBF7] dark:bg-stone-950"
        topFrom="from-[#A560E8]/25 dark:from-[#4A1B70]/50"
        bottomTo="from-[#F3EAFF]/80 dark:from-[#1A0B2E]/80"
        radial="bg-[radial-gradient(ellipse_80%_45%_at_50%_55%,rgba(165,96,232,0.07),transparent_60%)]"
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ─── Universities trust strip ─── */}
        <LandingScrollReveal>
          <div className="mb-12 sm:mb-16">
            <p
              className="text-center text-[12px] sm:text-[13px] font-extrabold uppercase tracking-[0.22em] text-[#A560E8] dark:text-[#C9A0F0] mb-6"
              style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
            >
              Trusted by students at top universities worldwide
            </p>

            <div className="relative overflow-hidden rounded-2xl border-2 border-[#E9D5FF]/80 bg-[#FAF7FF]/80 dark:bg-stone-900/40 py-4 sm:py-5 [mask-image:linear-gradient(to_right,transparent,#000_4%,#000_96%,transparent)]">
              <div className="flex w-max items-center animate-scroll-slow hover:[animation-play-state:paused]" style={{ animationDuration: '40s' }}>
                {[...UNIVERSITIES, ...UNIVERSITIES, ...UNIVERSITIES].map((uni, idx) => (
                  <span key={`uni-${idx}`} className="shrink-0 px-7 sm:px-11 lg:px-14">
                    <span
                      className={`text-lg sm:text-xl lg:text-2xl whitespace-nowrap opacity-55 hover:opacity-100 transition-opacity duration-300 ${uni.className} dark:!text-stone-400`}
                    >
                      {uni.name}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </LandingScrollReveal>

        {/* ─── Demo header ─── */}
        <LandingScrollReveal delayMs={80}>
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
            <div className="inline-flex items-center gap-2 mb-4 rounded-full border-2 border-[#A560E8]/40 bg-[#F3EAFF] dark:bg-[#A560E8]/15 px-3.5 py-1.5 shadow-[0_0_12px_rgba(165,96,232,0.25)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#A560E8] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#A560E8]" />
              </span>
              <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.18em] text-[#7733B5] dark:text-[#C9A0F0]">
                Interactive demo
              </span>
            </div>
            <h2
              id="interactive-demo-heading"
              className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#3C3C3C] dark:text-white tracking-tight leading-[1.15] mb-3"
              style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
            >
              See how WriteScholar{' '}
              <span className="relative inline-block text-[#A560E8]">
                grades a real essay
                <svg
                  className="absolute -bottom-1 left-0 w-full h-2 text-[#A560E8]"
                  viewBox="0 0 200 8"
                  preserveAspectRatio="none"
                  aria-hidden
                >
                  <path
                    d="M2 6 Q50 1 100 5 T198 4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h2>
            <p className="text-sm sm:text-base text-[#777] dark:text-stone-300 leading-relaxed" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
              Switch samples, hover highlights, and check the rubric. Same view you get in the app.
            </p>
          </div>
        </LandingScrollReveal>

        {/* ─── Interactive demo — single bordered frame, no panel-on-panel ─── */}
        <LandingScrollReveal delayMs={160}>
          <div className="relative">
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-4 sm:-inset-6 rounded-[2.5rem] bg-gradient-to-br from-[#A560E8]/20 via-[#A560E8]/10 to-[#58CC02]/10 blur-3xl -z-10"
            />
            {/* Floating grade pill — syncs with the active demo sample */}
            <div
              aria-hidden
              className="hidden sm:flex absolute -top-4 -right-4 lg:-top-6 lg:-right-6 z-20 items-center justify-center w-16 h-16 lg:w-20 lg:h-20 rounded-2xl bg-[#58CC02] text-white text-3xl lg:text-4xl font-extrabold rotate-[6deg] border-2 border-b-4 border-[#46A302] shadow-[0_18px_32px_-8px_rgba(88,204,2,0.5)] transition-transform duration-300"
              style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
            >
              {activeGradeLetter}
            </div>
            <div className="relative rounded-2xl sm:rounded-3xl border-2 border-b-4 border-[#A560E8] bg-white dark:bg-stone-900 shadow-[0_0_30px_-8px_rgba(165,96,232,0.30),0_24px_50px_-18px_rgba(0,0,0,0.20)] overflow-hidden">
              {/* Browser-chrome strip */}
              <div className="flex h-7 shrink-0 items-center gap-1 px-2.5 border-b-2 border-[#D8B4FE] bg-[#F3EAFF] dark:bg-[#2A0E40]">
                <span className="h-2 w-2 rounded-full bg-[#A560E8]" />
                <span className="h-2 w-2 rounded-full bg-[#A560E8]/60" />
                <span className="h-2 w-2 rounded-full bg-[#A560E8]/30" />
                <span className="ml-2 text-[10px] font-bold text-[#7733B5] dark:text-[#C9A0F0] truncate">
                  writescholar.com · essay analyzer
                </span>
                <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-white dark:bg-[#A560E8]/20 px-1.5 py-0.5 text-[9px] font-extrabold text-[#A560E8] uppercase tracking-wider">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#A560E8] motion-safe:animate-pulse" aria-hidden />
                  Live
                </span>
              </div>
              <Suspense fallback={<div className="min-h-[480px] w-full bg-white dark:bg-stone-900" aria-hidden />}>
                <InteractiveDocumentAnalysis
                  onNavigate={onNavigate}
                  landingHeroEmbed
                  onSampleChange={setActiveGradeLetter}
                />
              </Suspense>
            </div>
          </div>
        </LandingScrollReveal>
      </div>
    </section>
  );
}
