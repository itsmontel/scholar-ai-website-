import React from 'react';
import Header from '../common/Header';
import { WriteScholarEditorialBackgroundLayers } from '../common/WriteScholarEditorialBackground';
import Footer from '../common/Footer';
import ScholarMascot from '../common/ScholarMascot';

interface WhyStudentsChoosePageProps {
  onNavigate: (page: string) => void;
  user?: { id: string; name: string; email: string; plan?: string } | null;
  onLogout?: () => void;
}

const WhyStudentsChoosePage: React.FC<WhyStudentsChoosePageProps> = ({ onNavigate, user, onLogout }) => {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <WriteScholarEditorialBackgroundLayers position="fixed" />
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="why-students-choose" />

      {/* Hero */}
      <section className="py-16 sm:py-20 border-b border-stone-200/60 dark:border-stone-700/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-stone-800 dark:text-stone-100 mb-4 leading-tight">
              Why Students Choose <span className="bg-violet-600 hover:bg-violet-500 bg-clip-text text-transparent">WriteScholar</span>
            </h1>
            <p className="text-lg text-stone-500 dark:text-stone-400">
              See how WriteScholar compares to other popular writing tools
            </p>
            <p className="mt-3 text-sm text-stone-500 dark:text-stone-400">
              <button
                onClick={() => onNavigate('study-tools-comparison')}
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold underline underline-offset-2"
              >
                Compare study tools: WriteScholar vs Quizlet vs Knowt →
              </button>
            </p>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 sm:py-24 bg-white dark:bg-stone-900/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative text-center mb-12">
            {/* Mascot pointing at chart */}
            <div className="hidden lg:block absolute -left-[6rem] xl:-left-[7rem] top-0 -translate-y-[80%] w-28 h-36 flex items-center justify-center">
              <ScholarMascot size={112} animated={true} pose="pointing" />
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
                <span className="font-medium text-stone-600 dark:text-stone-400 text-sm sm:text-base">Grammarly</span>
              </div>
              <div className="p-4 sm:p-6 text-center">
                <span className="font-medium text-stone-600 dark:text-stone-400 text-sm sm:text-base">QuillBot</span>
              </div>
            </div>

            <div className="divide-y divide-stone-100 dark:divide-stone-700">
              {[
                { feature: 'Built for Academic Writing', ws: true, grammarly: false, quillbot: false },
                { feature: 'Citation Generator & Checker', ws: true, grammarly: true, quillbot: true, alt: true },
                { feature: 'Essay Structure Analysis', ws: true, grammarly: 'partial', quillbot: false },
                { feature: 'Grammar & Spelling Check', ws: true, grammarly: true, quillbot: true, alt: true },
                { feature: 'Academic Source Finder', ws: true, grammarly: true, quillbot: false },
                { feature: 'Focus Mode (Puzzle/Quiz to Unlock)', ws: true, grammarly: false, quillbot: false },
                { feature: 'Free Tools Available', ws: '8 Tools', grammarly: 'Limited', quillbot: 'Several', alt: true },
                { feature: 'Starting Price', ws: 'Free / $19.99', grammarly: '$12/mo', quillbot: '$9.95/mo' },
              ].map((row, i) => (
                <div key={i} className={`grid grid-cols-4 items-center ${row.alt ? 'bg-indigo-50/30 dark:bg-indigo-900/20' : ''}`}>
                  <div className="p-4 sm:p-6">
                    <span className="font-medium text-stone-800 dark:text-stone-100 text-sm sm:text-base">{row.feature}</span>
                  </div>
                  <div className="p-4 sm:p-6 text-center">
                    {typeof row.ws === 'boolean' ? (
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${row.ws ? 'bg-violet-100 dark:bg-violet-900/40' : 'bg-stone-100 dark:bg-stone-700/50'}`}>
                        {row.ws ? (
                          <svg className="w-5 h-5 text-violet-600 dark:text-violet-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                        ) : (
                          <svg className="w-5 h-5 text-stone-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                        )}
                      </span>
                    ) : (
                      <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold ${row.ws === '8 Tools' ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300' : 'font-bold text-violet-600 dark:text-violet-400 text-sm sm:text-base'}`}>{row.ws}</span>
                    )}
                  </div>
                  <div className="p-4 sm:p-6 text-center">
                    {typeof row.grammarly === 'boolean' ? (
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${row.grammarly ? 'bg-violet-100 dark:bg-violet-900/40' : 'bg-stone-100 dark:bg-stone-700/50'}`}>
                        {row.grammarly ? (
                          <svg className="w-5 h-5 text-violet-600 dark:text-violet-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                        ) : (
                          <svg className="w-5 h-5 text-stone-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                        )}
                      </span>
                    ) : row.grammarly === 'partial' ? (
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-amber-100 dark:bg-amber-900/40 rounded-full">
                        <span className="text-amber-600 dark:text-amber-400 text-xs font-bold">~</span>
                      </span>
                    ) : (
                      <span className={`font-medium text-stone-600 dark:text-stone-400 text-sm sm:text-base ${row.grammarly === 'Limited' ? 'inline-flex items-center justify-center px-3 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded-full text-xs font-semibold' : ''}`}>{String(row.grammarly)}</span>
                    )}
                  </div>
                  <div className="p-4 sm:p-6 text-center">
                    {typeof row.quillbot === 'boolean' ? (
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${row.quillbot ? 'bg-violet-100 dark:bg-violet-900/40' : 'bg-stone-100 dark:bg-stone-700/50'}`}>
                        {row.quillbot ? (
                          <svg className="w-5 h-5 text-violet-600 dark:text-violet-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                        ) : (
                          <svg className="w-5 h-5 text-stone-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                        )}
                      </span>
                    ) : (
                      <span className={`font-medium text-stone-600 dark:text-stone-400 text-sm sm:text-base ${row.quillbot === 'Several' ? 'inline-flex items-center justify-center px-3 py-1 bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 rounded-full text-xs font-semibold' : ''}`}>{String(row.quillbot)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-center text-stone-500 dark:text-stone-400 text-sm mt-6">
            * Comparison based on publicly available feature information as of 2026
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-800 dark:text-stone-100 mb-4">Ready to try WriteScholar?</h2>
          <p className="text-stone-500 dark:text-stone-400 mb-6">Join thousands of students improving their academic writing.</p>
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

export default WhyStudentsChoosePage;
