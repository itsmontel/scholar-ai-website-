import React from 'react';
import Header from '../common/Header';
import Footer from '../common/Footer';

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
    { feature: 'AI Humanizer (Bypass Detection)', ws: true, quizlet: false, knowt: false, highlight: true },
    { feature: 'Voice/Lecture Recording → Notes', ws: false, quizlet: false, knowt: true },
    { feature: 'Import Quizlet Sets', ws: false, quizlet: true, knowt: true },
    { feature: 'Community/Shared Study Sets', ws: false, quizlet: true, knowt: true },
    { feature: 'Spaced Repetition', ws: false, quizlet: true, knowt: true },
    { feature: 'Free Tier', ws: '3/mo + 8 tools', quizlet: 'Limited, ads', knowt: 'Unlimited notes' },
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
    const badgeClass = isWs && (value.includes('Free') || value.includes('3/mo')) ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300' : 'bg-stone-100 dark:bg-stone-700/50 text-stone-700 dark:text-stone-300';
    const isLimited = value.includes('Limited') || value.includes('ads');
    return (
      <span className={`text-sm sm:text-base inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold ${isLimited ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' : badgeClass}`}>
        {value}
      </span>
    );
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #FAF8F5 0%, #F5F3F0 100%)' }}>
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="study-tools-comparison" />

      {/* Hero */}
      <section className="py-16 sm:py-20 border-b border-stone-200/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl text-stone-800 mb-4 leading-tight" style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 400 }}>
              WriteScholar vs Quizlet vs Knowt
            </h1>
            <p className="text-lg text-stone-500">
              See how WriteScholar compares to Quizlet and Knowt for AI study tools. Flashcards, quizzes, and more—plus academic writing features you won&apos;t find elsewhere.
            </p>
            <p className="mt-3 text-sm text-stone-500">
              <button
                onClick={() => onNavigate('why-students-choose')}
                className="text-indigo-600 dark:text-indigo-400 hover:text-violet-600 dark:hover:text-violet-400 font-medium underline underline-offset-2"
              >
                Compare writing tools: vs Grammarly & QuillBot ←
              </button>
            </p>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 sm:py-24" style={{ background: 'linear-gradient(180deg, #F5F3F0 0%, #FAF8F5 100%)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative text-center mb-12">
            {/* Different character - person with book/studying pose */}
            <div className="hidden lg:block absolute -right-[6rem] xl:-right-[7rem] top-0 -translate-y-[80%] w-28 h-36">
              <svg viewBox="0 0 140 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <path d="M50 100 Q45 130 50 160 L90 160 Q95 130 90 100" fill="#8B5CF6" />
                <rect x="62" y="75" width="16" height="28" fill="#FCD9B6" />
                <ellipse cx="70" cy="48" rx="32" ry="35" fill="#FCD9B6" />
                <path d="M38 38 Q35 16 52 10 Q70 2 90 10 Q107 16 104 38 Q100 26 85 18 Q70 10 55 18 Q42 26 38 38" fill="#4A3728" />
                <path d="M38 38 Q32 48 38 58" fill="#4A3728" />
                <path d="M102 38 Q108 48 102 58" fill="#4A3728" />
                <ellipse cx="56" cy="48" rx="5" ry="6" fill="#1F2937" />
                <ellipse cx="84" cy="48" rx="5" ry="6" fill="#1F2937" />
                <circle cx="57" cy="46" r="2" fill="white" />
                <circle cx="85" cy="46" r="2" fill="white" />
                <path d="M46 38 Q56 34 66 38" stroke="#4A3728" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <path d="M74 38 Q84 34 94 38" stroke="#4A3728" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <path d="M55 65 Q70 76 85 65" stroke="#1F2937" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <ellipse cx="42" cy="58" rx="6" ry="4" fill="#FECACA" opacity="0.4" />
                <ellipse cx="98" cy="58" rx="6" ry="4" fill="#FECACA" opacity="0.4" />
                <rect x="25" y="95" width="35" height="28" rx="2" fill="white" stroke="#8B5CF6" strokeWidth="2" />
                <line x1="30" y1="105" x2="55" y2="105" stroke="#C4B5FD" strokeWidth="2" />
                <line x1="30" y1="112" x2="52" y2="112" stroke="#C4B5FD" strokeWidth="2" />
                <line x1="30" y1="119" x2="58" y2="119" stroke="#C4B5FD" strokeWidth="2" />
                <path d="M45 105 Q30 115 25 135" stroke="#FCD9B6" strokeWidth="12" fill="none" strokeLinecap="round" />
                <ellipse cx="23" cy="138" rx="8" ry="9" fill="#FCD9B6" />
                <circle cx="95" cy="55" r="8" fill="#FCD34D" opacity="0.9" />
                <path d="M92 55 L95 58 L99 54" stroke="#F59E0B" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-lg border border-stone-200 dark:border-stone-700 overflow-hidden">
            <div className="grid grid-cols-4 bg-stone-50 dark:bg-stone-800/50 border-b border-stone-200 dark:border-stone-700">
              <div className="p-4 sm:p-6 font-semibold text-stone-700 dark:text-stone-300">Feature</div>
              <div className="p-4 sm:p-6 text-center">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center mb-1 shadow-lg shadow-indigo-500/30">
                    <span className="text-white font-bold text-sm">W</span>
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
          <div className="mt-12 grid sm:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 rounded-2xl border border-indigo-200/70 dark:border-indigo-700/40 p-6 shadow-sm">
              <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-2">WriteScholar</h3>
              <p className="text-stone-600 dark:text-stone-400 text-sm">
                The only AI study tool that combines quizzes, flashcards, and crosswords with academic writing: essay analysis, citation finder, and AI humanizer. Best for students who need both study and writing support.
              </p>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl border border-amber-200/70 dark:border-amber-700/40 p-6 shadow-sm">
              <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-2">Quizlet</h3>
              <p className="text-stone-600 dark:text-stone-400 text-sm">
                The classic study platform with Magic Notes (AI from notes), Brain Beats, and millions of community sets. Strong for memorization and shared content. Free tier is limited; Learn mode largely requires Plus.
              </p>
            </div>
            <div className="bg-gradient-to-br from-sky-50 to-cyan-50 dark:from-sky-900/20 dark:to-cyan-900/20 rounded-2xl border border-sky-200/70 dark:border-sky-700/40 p-6 shadow-sm">
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
          <h2 className="text-2xl sm:text-3xl text-stone-800 mb-4">Ready to try WriteScholar?</h2>
          <p className="text-stone-500 mb-6">Quizzes, flashcards, crosswords—plus essay analysis, citations, and AI humanizer. All in one place.</p>
          <button
            onClick={() => onNavigate('signup')}
            className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-bold rounded-2xl transition-all text-lg shadow-lg shadow-indigo-500/25 hover:shadow-xl"
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
