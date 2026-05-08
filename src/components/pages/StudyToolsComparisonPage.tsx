import React from 'react';
import Header from '../common/Header';
import { WriteScholarEditorialBackgroundLayers } from '../common/WriteScholarEditorialBackground';
import Footer from '../common/Footer';
// ScholarMascot replaced with mascot GIFs
import LandingSectionLayers from '../common/LandingSectionLayers';

interface StudyToolsComparisonPageProps {
  onNavigate: (page: string) => void;
  user?: { id: string; name: string; email: string; plan?: string } | null;
  onLogout?: () => void;
}

type CellValue = boolean | string | 'partial';

interface ComparisonRow {
  feature: string;
  ws: CellValue;
  quizlet: CellValue;
  knowt: CellValue;
  highlight?: boolean;
}

const StudyToolsComparisonPage: React.FC<StudyToolsComparisonPageProps> = ({ onNavigate, user, onLogout }) => {
  const comparisonRows: ComparisonRow[] = [
    { feature: 'AI Quiz from Text/Notes', ws: true, quizlet: true, knowt: true },
    { feature: 'AI Flashcards from Text', ws: true, quizlet: true, knowt: true },
    { feature: 'Crossword Puzzles from Text', ws: true, quizlet: false, knowt: false, highlight: true },
    { feature: 'Paper/PDF Summarizer', ws: true, quizlet: 'partial', knowt: true },
    { feature: 'Built for Academic Writing', ws: true, quizlet: false, knowt: false, highlight: true },
    { feature: 'Essay Analysis & Feedback', ws: true, quizlet: false, knowt: false, highlight: true },
    { feature: 'Citation Finder (APA, MLA, etc.)', ws: true, quizlet: false, knowt: false, highlight: true },
    { feature: 'Focus Mode (Puzzle/Quiz to Unlock)', ws: true, quizlet: false, knowt: false, highlight: true },
    { feature: 'Voice/Lecture Recording → Notes', ws: false, quizlet: false, knowt: true },
    { feature: 'Import Quizlet Sets', ws: false, quizlet: true, knowt: true },
    { feature: 'Community/Shared Study Sets', ws: false, quizlet: true, knowt: true },
    { feature: 'Spaced Repetition', ws: false, quizlet: true, knowt: true },
    { feature: 'Free Tier', ws: '2 packs/mo + tools', quizlet: 'Limited, ads', knowt: 'Unlimited notes' },
    { feature: 'Starting Price', ws: 'Free / $19.99', quizlet: '$7.99/mo', knowt: 'Free / $4.99/mo' },
  ];

  const renderCell = (value: CellValue, isWs = false) => {
    if (typeof value === 'boolean') {
      return (
        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${value ? 'bg-[#EAFFD6] dark:bg-[#58CC02]/20' : 'bg-stone-100 dark:bg-stone-700/50'}`}>
          {value ? (
            <svg className="w-5 h-5 text-[#58CC02]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
          ) : (
            <svg className="w-5 h-5 text-stone-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
          )}
        </span>
      );
    }
    if (value === 'partial') {
      return (
        <span className="inline-flex items-center justify-center w-8 h-8 bg-amber-100 dark:bg-amber-900/40 rounded-full">
          <span className="text-amber-600 dark:text-amber-400 text-xs font-bold">~</span>
        </span>
      );
    }
    const badgeClass =
      isWs && (value.includes('Free') || value.includes('2/mo') || value.includes('packs/mo'))
        ? 'bg-[#EAFFD6] dark:bg-[#58CC02]/20 text-[#58CC02]'
        : 'bg-stone-100 dark:bg-stone-700/50 text-stone-700 dark:text-stone-300';
    const isLimited = value.includes('Limited') || value.includes('ads');
    return (
      <span className={`text-sm sm:text-base inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold ${isLimited ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' : badgeClass}`}>
        {value}
      </span>
    );
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <WriteScholarEditorialBackgroundLayers position="fixed" />
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="study-tools-comparison" />

      <section
        className="relative py-16 sm:py-24 overflow-hidden border-b border-stone-200/90 dark:border-stone-800"
        aria-labelledby="study-tools-comparison-heading"
      >
        <LandingSectionLayers />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-[#58CC02] dark:text-[#58CC02] mb-3">
              Study tools
            </p>
            <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-[#58CC02]" aria-hidden />
            <h1
              id="study-tools-comparison-heading"
              className="text-2xl sm:text-3xl lg:text-[2.35rem] font-extrabold text-stone-900 dark:text-stone-100 mb-4 tracking-tight leading-tight"
              style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
            >
              WriteScholar vs Quizlet vs Knowt
            </h1>
            <p className="text-base sm:text-lg text-stone-600 dark:text-stone-400 leading-relaxed">
              See how WriteScholar compares to Quizlet and Knowt for AI study tools. Flashcards, quizzes, and more—plus academic writing features you won&apos;t find elsewhere.
            </p>
            <p className="mt-4 text-sm text-stone-500 dark:text-stone-400">
              <button
                type="button"
                onClick={() => onNavigate('why-students-choose')}
                className="text-[#1CB0F6] hover:text-[#1899D6] font-extrabold underline underline-offset-2"
              >
                Compare writing tools: vs Grammarly &amp; QuillBot ←
              </button>
            </p>
          </div>
        </div>
      </section>

      <section className="relative py-16 sm:py-24 overflow-hidden border-t border-stone-200/90 dark:border-stone-800">
        <LandingSectionLayers variant="faq" />
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative text-center mb-12">
            {/* Mascot - studying pose */}
            <div className="hidden lg:block absolute -right-[6rem] xl:-right-[7rem] top-0 -translate-y-[80%] w-28 h-36 flex items-center justify-center">
              <img src="/mascot-study.gif" alt="WriteScholar mascot" className="w-28 h-28 object-contain" />
            </div>
          </div>

          <div className="bg-white dark:bg-stone-900 rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-700 overflow-hidden">
            <div className="grid grid-cols-4 bg-stone-50 dark:bg-stone-800/50 border-b border-stone-200 dark:border-stone-700">
              <div className="p-4 sm:p-6 font-semibold text-stone-700 dark:text-stone-300">Feature</div>
              <div className="p-4 sm:p-6 text-center">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 flex items-center justify-center mb-1 shrink-0 overflow-hidden">
                    <img src="/main-logo.png" alt="WriteScholar" className="w-full h-full object-contain drop-shadow-md" loading="lazy" width="112" height="112" />
                  </div>
                  <span className="font-extrabold text-stone-900 dark:text-stone-100 text-sm sm:text-base">WriteScholar</span>
                </div>
              </div>
              <div className="p-4 sm:p-6 text-center">
                <span className="font-medium text-stone-600 dark:text-stone-400 text-sm sm:text-base">Quizlet</span>
              </div>
              <div className="p-4 sm:p-6 text-center">
                <span className="font-medium text-stone-600 dark:text-stone-400 text-sm sm:text-base">Knowt</span>
              </div>
            </div>

            <div className="divide-y divide-stone-100 dark:divide-stone-700">
              {comparisonRows.map((row, i) => (
                <div key={i} className={`grid grid-cols-4 items-center ${row.highlight ? 'bg-[#EAFFD6]/50 dark:bg-[#58CC02]/10' : ''}`}>
                  <div className="p-4 sm:p-6">
                    <span className="font-medium text-stone-800 dark:text-stone-200 text-sm sm:text-base">{row.feature}</span>
                  </div>
                  <div className="p-4 sm:p-6 flex justify-center">
                    {renderCell(row.ws, true)}
                  </div>
                  <div className="p-4 sm:p-6 flex justify-center">
                    {renderCell(row.quizlet)}
                  </div>
                  <div className="p-4 sm:p-6 flex justify-center">
                    {renderCell(row.knowt)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-center text-stone-500 dark:text-stone-400 text-sm mt-6">
            * Comparison based on publicly available feature information as of 2026. Quizlet Plus: $7.99/mo. Knowt Plus: $4.99/mo. Knowt Premium: $8.99/mo.
          </p>

          {/* Summary */}
          <div className="mt-12 grid sm:grid-cols-3 gap-6 text-left">
            <div className="bg-[#EAFFD6] dark:bg-[#58CC02]/10 rounded-2xl border-2 border-b-4 border-[#58CC02]/30 dark:border-[#58CC02]/30 p-6">
              <h3 className="font-extrabold text-stone-900 dark:text-stone-100 mb-2">WriteScholar</h3>
              <p className="text-stone-600 dark:text-stone-400 text-sm">
                The only AI study tool that combines quizzes, flashcards, and crosswords with academic writing: essay analysis, citation finder, and Focus Mode. Best for students who need both study and writing support.
              </p>
            </div>
            <div className="bg-[#FFF4E0] dark:bg-[#FF9600]/10 rounded-2xl border-2 border-b-4 border-[#FF9600]/30 dark:border-[#FF9600]/30 p-6">
              <h3 className="font-extrabold text-stone-900 dark:text-stone-100 mb-2">Quizlet</h3>
              <p className="text-stone-600 dark:text-stone-400 text-sm">
                The classic study platform with Magic Notes (AI from notes), Brain Beats, and millions of community sets. Strong for memorization and shared content. Free tier is limited; Learn mode largely requires Plus.
              </p>
            </div>
            <div className="bg-[#DDF4FF] dark:bg-[#1CB0F6]/10 rounded-2xl border-2 border-b-4 border-[#1CB0F6]/30 dark:border-[#1CB0F6]/30 p-6">
              <h3 className="font-extrabold text-stone-900 dark:text-stone-100 mb-2">Knowt</h3>
              <p className="text-stone-600 dark:text-stone-400 text-sm">
                The top Quizlet alternative with free Learn mode, AI lecture notetaker, PDF summarizer, and voice tutoring. Great for students who want to import Quizlet sets and study without paying. No writing tools.
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
              Ready to try WriteScholar?
            </h2>
            <p className="text-base sm:text-lg text-stone-600 dark:text-stone-400 mb-8 leading-relaxed">
              Quizzes, flashcards, crosswords—plus essay analysis, citations, and Focus Mode. All in one place.
            </p>
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
          </div>
        </div>
      </section>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default StudyToolsComparisonPage;
