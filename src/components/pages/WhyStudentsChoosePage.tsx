import React from 'react';
import Header from '../common/Header';
import Footer from '../common/Footer';

interface WhyStudentsChoosePageProps {
  onNavigate: (page: string) => void;
  user?: { id: string; name: string; email: string; plan?: string } | null;
  onLogout?: () => void;
}

const WhyStudentsChoosePage: React.FC<WhyStudentsChoosePageProps> = ({ onNavigate, user, onLogout }) => {
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #FAF8F5 0%, #F5F3F0 100%)' }}>
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="why-students-choose" />

      {/* Hero */}
      <section className="py-16 sm:py-20 border-b border-stone-200/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl text-stone-800 mb-4 leading-tight" style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 400 }}>
              Why Students Choose <span className="text-lime-600 italic">WriteScholar</span>
            </h1>
            <p className="text-lg text-stone-500">
              See how WriteScholar compares to other popular writing tools
            </p>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 sm:py-24" style={{ background: 'linear-gradient(180deg, #F5F3F0 0%, #FAF8F5 100%)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative text-center mb-12">
            {/* Character pointing at chart - positioned left */}
            <div className="hidden lg:block absolute -left-12 xl:-left-8 top-1/2 -translate-y-1/2 w-28 h-36">
              <svg viewBox="0 0 140 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <path d="M50 100 Q45 130 50 160 L90 160 Q95 130 90 100" fill="#3B82F6" />
                <rect x="62" y="75" width="16" height="28" fill="#E8B796" />
                <ellipse cx="70" cy="48" rx="32" ry="35" fill="#E8B796" />
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
                <path d="M95 105 Q120 95 135 80" stroke="#E8B796" strokeWidth="14" fill="none" strokeLinecap="round" />
                <ellipse cx="138" cy="78" rx="8" ry="10" fill="#E8B796" />
                <ellipse cx="145" cy="70" rx="4" ry="8" fill="#E8B796" />
                <path d="M45 105 Q30 115 25 135" stroke="#E8B796" strokeWidth="12" fill="none" strokeLinecap="round" />
                <ellipse cx="23" cy="138" rx="8" ry="9" fill="#E8B796" />
                <path d="M58 95 L70 108 L82 95" stroke="#2563EB" strokeWidth="2" fill="none" />
                <path d="M125 50 L128 58 L136 61 L128 64 L125 72 L122 64 L114 61 L122 58 Z" fill="#FCD34D" />
              </svg>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-stone-200 overflow-hidden">
            <div className="grid grid-cols-4 bg-stone-50 border-b border-stone-200">
              <div className="p-4 sm:p-6 font-semibold text-stone-700">Feature</div>
              <div className="p-4 sm:p-6 text-center">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center mb-1">
                    <span className="text-white font-bold text-sm">W</span>
                  </div>
                  <span className="font-semibold text-stone-900 text-sm sm:text-base">WriteScholar</span>
                </div>
              </div>
              <div className="p-4 sm:p-6 text-center">
                <span className="font-medium text-stone-600 text-sm sm:text-base">Grammarly</span>
              </div>
              <div className="p-4 sm:p-6 text-center">
                <span className="font-medium text-stone-600 text-sm sm:text-base">QuillBot</span>
              </div>
            </div>

            <div className="divide-y divide-stone-100">
              {[
                { feature: 'Built for Academic Writing', ws: true, grammarly: false, quillbot: false },
                { feature: 'Citation Generator & Checker', ws: true, grammarly: true, quillbot: true, alt: true },
                { feature: 'Essay Structure Analysis', ws: true, grammarly: 'partial', quillbot: false },
                { feature: 'Grammar & Spelling Check', ws: true, grammarly: true, quillbot: true, alt: true },
                { feature: 'Academic Source Finder', ws: true, grammarly: true, quillbot: false },
                { feature: 'AI Text Humanizer', ws: true, grammarly: false, quillbot: false },
                { feature: 'Free Tools Available', ws: '8 Tools', grammarly: 'Limited', quillbot: 'Several', alt: true },
                { feature: 'Starting Price', ws: 'Free / $19.99', grammarly: '$12/mo', quillbot: '$9.95/mo' },
              ].map((row, i) => (
                <div key={i} className={`grid grid-cols-4 items-center ${row.alt ? 'bg-lime-50/30' : ''}`}>
                  <div className="p-4 sm:p-6">
                    <span className="font-medium text-stone-800 text-sm sm:text-base">{row.feature}</span>
                  </div>
                  <div className="p-4 sm:p-6 text-center">
                    {typeof row.ws === 'boolean' ? (
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${row.ws ? 'bg-green-100' : 'bg-stone-100'}`}>
                        {row.ws ? (
                          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                        ) : (
                          <svg className="w-5 h-5 text-stone-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                        )}
                      </span>
                    ) : (
                      <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold ${row.ws === '8 Tools' ? 'bg-green-100 text-green-700' : 'font-bold text-green-600 text-sm sm:text-base'}`}>{row.ws}</span>
                    )}
                  </div>
                  <div className="p-4 sm:p-6 text-center">
                    {typeof row.grammarly === 'boolean' ? (
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${row.grammarly ? 'bg-green-100' : 'bg-stone-100'}`}>
                        {row.grammarly ? (
                          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                        ) : (
                          <svg className="w-5 h-5 text-stone-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                        )}
                      </span>
                    ) : row.grammarly === 'partial' ? (
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-yellow-100 rounded-full">
                        <span className="text-yellow-600 text-xs font-bold">~</span>
                      </span>
                    ) : (
                      <span className={`font-medium text-stone-600 text-sm sm:text-base ${row.grammarly === 'Limited' ? 'inline-flex items-center justify-center px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold' : ''}`}>{String(row.grammarly)}</span>
                    )}
                  </div>
                  <div className="p-4 sm:p-6 text-center">
                    {typeof row.quillbot === 'boolean' ? (
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${row.quillbot ? 'bg-green-100' : 'bg-stone-100'}`}>
                        {row.quillbot ? (
                          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                        ) : (
                          <svg className="w-5 h-5 text-stone-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                        )}
                      </span>
                    ) : (
                      <span className={`font-medium text-stone-600 text-sm sm:text-base ${row.quillbot === 'Several' ? 'inline-flex items-center justify-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold' : ''}`}>{String(row.quillbot)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-center text-stone-500 text-sm mt-6">
            * Comparison based on publicly available feature information as of 2026
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl text-stone-800 mb-4">Ready to try WriteScholar?</h2>
          <p className="text-stone-500 mb-6">Join thousands of students improving their academic writing.</p>
          <button
            onClick={() => onNavigate('signup')}
            className="px-8 py-4 bg-lime-400 hover:bg-lime-300 text-stone-900 font-semibold rounded-full transition-colors text-lg shadow-lg hover:shadow-xl"
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
