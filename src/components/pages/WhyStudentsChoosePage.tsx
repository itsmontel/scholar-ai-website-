import React from 'react';
import Header from '../common/Header';
import { WriteScholarEditorialBackgroundLayers } from '../common/WriteScholarEditorialBackground';
import Footer from '../common/Footer';
// ScholarMascot replaced with mascot GIFs
import LandingSectionLayers from '../common/LandingSectionLayers';

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

      <section
        className="relative py-16 sm:py-24 overflow-hidden border-b border-stone-200/90 dark:border-stone-800"
        aria-labelledby="why-students-heading"
      >
        <LandingSectionLayers />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-[#58CC02] dark:text-[#58CC02] mb-3">
              Compare
            </p>
            <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-[#58CC02]" aria-hidden />
            <h1
              id="why-students-heading"
              className="text-2xl sm:text-3xl lg:text-[2.35rem] font-extrabold text-stone-900 dark:text-stone-100 mb-4 tracking-tight leading-tight"
              style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
            >
              Why students choose WriteScholar
            </h1>
            <p className="text-base sm:text-lg text-stone-600 dark:text-stone-400 leading-relaxed">
              See how WriteScholar compares to other popular writing tools
            </p>
            <p className="mt-4 text-sm text-stone-500 dark:text-stone-400">
              <button
                type="button"
                onClick={() => onNavigate('study-tools-comparison')}
                className="text-[#1CB0F6] hover:text-[#1899D6] font-extrabold underline underline-offset-2"
              >
                Compare study tools: WriteScholar vs Quizlet vs Knowt →
              </button>
            </p>
          </div>
        </div>
      </section>

      <section className="relative py-16 sm:py-24 overflow-hidden border-t border-stone-200/90 dark:border-stone-800">
        <LandingSectionLayers variant="faq" />
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative text-center mb-12">
            {/* Mascot pointing at chart */}
            <div className="hidden lg:block absolute -left-[6rem] xl:-left-[7rem] top-0 -translate-y-[80%] w-28 h-36 flex items-center justify-center">
              <img src="/mascot-laptop.gif" alt="WriteScholar mascot" className="w-28 h-28 object-contain" />
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
                <div key={i} className={`grid grid-cols-4 items-center ${row.alt ? 'bg-[#EAFFD6]/50 dark:bg-[#58CC02]/10' : ''}`}>
                  <div className="p-4 sm:p-6">
                    <span className="font-medium text-stone-800 dark:text-stone-100 text-sm sm:text-base">{row.feature}</span>
                  </div>
                  <div className="p-4 sm:p-6 text-center">
                    {typeof row.ws === 'boolean' ? (
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${row.ws ? 'bg-[#EAFFD6] dark:bg-[#58CC02]/20' : 'bg-stone-100 dark:bg-stone-700/50'}`}>
                        {row.ws ? (
                          <svg className="w-5 h-5 text-[#58CC02]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                        ) : (
                          <svg className="w-5 h-5 text-stone-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                        )}
                      </span>
                    ) : (
                      <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold ${row.ws === '8 Tools' ? 'bg-[#EAFFD6] dark:bg-[#58CC02]/20 text-[#58CC02]' : 'font-bold text-[#58CC02] text-sm sm:text-base'}`}>{row.ws}</span>
                    )}
                  </div>
                  <div className="p-4 sm:p-6 text-center">
                    {typeof row.grammarly === 'boolean' ? (
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${row.grammarly ? 'bg-[#EAFFD6] dark:bg-[#58CC02]/20' : 'bg-stone-100 dark:bg-stone-700/50'}`}>
                        {row.grammarly ? (
                          <svg className="w-5 h-5 text-[#58CC02]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
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
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${row.quillbot ? 'bg-[#EAFFD6] dark:bg-[#58CC02]/20' : 'bg-stone-100 dark:bg-stone-700/50'}`}>
                        {row.quillbot ? (
                          <svg className="w-5 h-5 text-[#58CC02]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                        ) : (
                          <svg className="w-5 h-5 text-stone-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                        )}
                      </span>
                    ) : (
                      <span className={`font-medium text-stone-600 dark:text-stone-400 text-sm sm:text-base ${row.quillbot === 'Several' ? 'inline-flex items-center justify-center px-3 py-1 bg-[#DDF4FF] dark:bg-[#1CB0F6]/20 text-[#1CB0F6] rounded-full text-xs font-semibold' : ''}`}>{String(row.quillbot)}</span>
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
              Join thousands of students improving their academic writing.
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

export default WhyStudentsChoosePage;
