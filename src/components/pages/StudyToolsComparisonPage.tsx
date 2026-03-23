import React from 'react';
import Header from '../common/Header';
import { WriteScholarEditorialBackgroundLayers } from '../common/WriteScholarEditorialBackground';
import Footer from '../common/Footer';
import ScholarMascot from '../common/ScholarMascot';

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
        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${value ? 'bg-violet-100 dark:bg-violet-900/40' : 'bg-stone-100 dark:bg-stone-700/50'}`}>
          {value ? (
            <svg className="w-5 h-5 text-violet-600 dark:text-violet-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
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
        ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300'
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

      {/* Hero */}
      <section className="py-16 sm:py-20 border-b border-stone-200/60 dark:border-stone-700/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-stone-800 dark:text-stone-100 mb-4 leading-tight">
              <span className="bg-violet-600 hover:bg-violet-500 bg-clip-text text-transparent">WriteScholar</span> vs Quizlet vs Knowt
            </h1>
            <p className="text-lg text-stone-500 dark:text-stone-400">
              See how WriteScholar compares to Quizlet and Knowt for AI study tools. Flashcards, quizzes, and more—plus academic writing features you won&apos;t find elsewhere.
            </p>
            <p className="mt-3 text-sm text-stone-500 dark:text-stone-400">
              <button
                onClick={() => onNavigate('why-students-choose')}
                className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-semibold underline underline-offset-2"
              >
                Compare writing tools: vs Grammarly & QuillBot ←
              </button>
            </p>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 sm:py-24 bg-white dark:bg-stone-900/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative text-center mb-12">
            {/* Mascot - studying pose */}
            <div className="hidden lg:block absolute -right-[6rem] xl:-right-[7rem] top-0 -translate-y-[80%] w-28 h-36 flex items-center justify-center">
              <ScholarMascot size={112} animated={true} pose="studying" />
            </div>
          </div>

          <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-lg border border-stone-200 dark:border-stone-700 overflow-hidden">
            <div className="grid grid-cols-4 bg-stone-50 dark:bg-stone-800/50 border-b border-stone-200 dark:border-stone-700">
              <div className="p-4 sm:p-6 font-semibold text-stone-700 dark:text-stone-300">Feature</div>
              <div className="p-4 sm:p-6 text-center">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 flex items-center justify-center mb-1 shrink-0 overflow-hidden">
                    <img src="/mascot.png" alt="WriteScholar" className="w-full h-full object-contain drop-shadow-md" loading="lazy" width="112" height="112" />
                  </div>
                  <span className="font-semibold text-stone-900 dark:text-stone-100 text-sm sm:text-base">WriteScholar</span>
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
                <div key={i} className={`grid grid-cols-4 items-center ${row.highlight ? 'bg-violet-50/50 dark:bg-violet-900/20' : ''}`}>
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
            <div className="bg-gradient-to-br from-violet-50 to-violet-50 dark:from-violet-900/20 dark:to-violet-900/20 rounded-2xl border border-violet-200/70 dark:border-violet-700/40 p-6 shadow-sm">
              <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-2">WriteScholar</h3>
              <p className="text-stone-600 dark:text-stone-400 text-sm">
                The only AI study tool that combines quizzes, flashcards, and crosswords with academic writing: essay analysis, citation finder, and Focus Mode. Best for students who need both study and writing support.
              </p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200/70 dark:border-amber-700/40 p-6 shadow-sm">
              <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-2">Quizlet</h3>
              <p className="text-stone-600 dark:text-stone-400 text-sm">
                The classic study platform with Magic Notes (AI from notes), Brain Beats, and millions of community sets. Strong for memorization and shared content. Free tier is limited; Learn mode largely requires Plus.
              </p>
            </div>
            <div className="bg-gradient-to-br from-violet-50 to-cyan-50 dark:from-violet-900/20 dark:to-cyan-900/20 rounded-2xl border border-violet-200/70 dark:border-violet-700/40 p-6 shadow-sm">
              <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-2">Knowt</h3>
              <p className="text-stone-600 dark:text-stone-400 text-sm">
                The top Quizlet alternative with free Learn mode, AI lecture notetaker, PDF summarizer, and voice tutoring. Great for students who want to import Quizlet sets and study without paying. No writing tools.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-800 dark:text-stone-100 mb-4">Ready to try WriteScholar?</h2>
          <p className="text-stone-500 dark:text-stone-400 mb-6">Quizzes, flashcards, crosswords—plus essay analysis, citations, and Focus Mode. All in one place.</p>
          <button
            onClick={() => onNavigate('signup')}
            className="px-8 py-4 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-2xl transition-all text-lg shadow-lg shadow-violet-500/25 hover:shadow-xl"
          >
            Try Free
          </button>
        </div>
      </section>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default StudyToolsComparisonPage;
