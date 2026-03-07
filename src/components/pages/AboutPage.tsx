import Header from '../common/Header';
import Footer from '../common/Footer';

interface AboutPageProps {
  onNavigate: (page: string) => void;
  user?: any;
  onLogout: () => void;
}

const AboutPage = ({ onNavigate, user, onLogout }: AboutPageProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/80 via-stone-50 to-white dark:from-stone-950 dark:via-stone-900 dark:to-stone-900">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="about" />

      {/* Hero Section - with illustration like landing page */}
      <section className="relative py-16 sm:py-20 border-b border-stone-200/60 dark:border-stone-700/60 overflow-hidden">
        <div className="absolute top-[35%] left-[5%] hidden xl:block text-4xl opacity-50 animate-float">🌍</div>
        <div className="absolute top-[40%] right-[6%] hidden xl:block text-3xl opacity-45 animate-float-delayed">✨</div>
        <div className="absolute bottom-[35%] left-[6%] hidden xl:block text-3xl opacity-45 animate-float">📚</div>
        <div className="absolute bottom-[30%] right-[5%] hidden xl:block text-4xl opacity-50 animate-float-delayed">🎓</div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-center lg:gap-12 xl:gap-16">
            {/* Mascot - top on mobile, left on desktop */}
            <div className="flex lg:hidden flex-shrink-0 justify-center mb-2 order-1">
              <div className="w-20 h-20 animate-float">
                <img src="/mascot.png" alt="WriteScholar mascot" className="w-full h-full object-contain drop-shadow-xl" />
              </div>
            </div>
            <div className="hidden lg:flex flex-shrink-0 items-center justify-center order-1">
              <div className="w-32 h-32 xl:w-40 xl:h-40 animate-float">
                <img src="/mascot.png" alt="WriteScholar mascot" className="w-full h-full object-contain drop-shadow-xl" />
              </div>
            </div>
            <div className="flex-1 text-center lg:text-left max-w-3xl mx-auto lg:mx-0 order-2">
              <span className="inline-flex items-center px-3 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 rounded-full text-sm font-semibold mb-6">
                About Us
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-stone-800 dark:text-stone-100 mb-6 leading-tight">
                Empowering academic<br className="hidden sm:block" /> <span className="bg-gradient-to-r from-indigo-500 to-violet-600 bg-clip-text text-transparent">excellence</span> worldwide
              </h1>
              <p className="text-lg text-stone-500 dark:text-stone-400 leading-relaxed">
                We're building the complete AI toolkit for students: essay analysis, humanizing, summarizing, citation finding, quizzes, flashcards, crosswords, and more.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-800 dark:text-stone-100 mb-6">Our mission</h2>
              <p className="text-stone-500 dark:text-stone-400 leading-relaxed mb-4">
                At WriteScholar, we believe exceptional academic writing should be accessible to everyone. Our mission is to democratize high-quality feedback by providing intelligent, AI-powered writing assistance.
              </p>
              <p className="text-stone-500 dark:text-stone-400 leading-relaxed mb-6">
                We help students, researchers, and academics improve their work and achieve their scholarly goals—whether they're writing their first essay or publishing groundbreaking research.
              </p>
              <div className="space-y-3">
                {['AI essay analysis and feedback', 'Humanizer, summarizer, and citation finder', 'Study tools: quizzes, flashcards, crosswords'].map((item, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-stone-700 dark:text-stone-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-stone-800 dark:bg-stone-900 rounded-2xl p-8 text-white border border-stone-700">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center p-4">
                  <div className="text-4xl font-bold mb-1 text-indigo-400">50K+</div>
                  <div className="text-stone-300">Documents Analyzed</div>
                </div>
                <div className="text-center p-4">
                  <div className="text-4xl font-bold mb-1 text-indigo-400">95%</div>
                  <div className="text-stone-300">Satisfaction Rate</div>
                </div>
                <div className="text-center p-4">
                  <div className="text-4xl font-bold mb-1 text-indigo-400">50+</div>
                  <div className="text-stone-300">Countries</div>
                </div>
                <div className="text-center p-4">
                  <div className="text-4xl font-bold mb-1 text-indigo-400">24/7</div>
                  <div className="text-stone-300">Availability</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What We Offer Section */}
      <section className="py-16 sm:py-20 border-b border-stone-200/60 dark:border-stone-700/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-800 dark:text-stone-100 mb-4">What we offer</h2>
            <p className="text-stone-500 dark:text-stone-400 max-w-xl mx-auto">
              A complete suite of AI-powered tools for academic success
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="group relative bg-gradient-to-br from-lime-50 to-emerald-50 dark:from-lime-900/20 dark:to-emerald-900/20 rounded-3xl p-6 text-left hover:shadow-2xl hover:shadow-lime-500/20 hover:-translate-y-2 transition-all duration-300 overflow-hidden border border-lime-100 dark:border-lime-800/50">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-lime-400/20 to-emerald-400/20 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-lime-500 to-emerald-600 flex items-center justify-center mb-4 shadow-lg shadow-lime-500/30 relative z-10">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <h3 className="font-bold text-stone-800 dark:text-stone-100 text-base mb-2 relative z-10">AI Essay Analyzer</h3>
              <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed relative z-10">Get detailed feedback on structure, argumentation, grammar, and style. Like having a professor review your work instantly.</p>
            </div>
            
            <div className="group relative bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-3xl p-6 text-left hover:shadow-2xl hover:shadow-violet-500/20 hover:-translate-y-2 transition-all duration-300 overflow-hidden border border-violet-100 dark:border-violet-800/50">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-violet-400/20 to-purple-400/20 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-violet-500/30 relative z-10">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              </div>
              <h3 className="font-bold text-stone-800 dark:text-stone-100 text-base mb-2 relative z-10">AI Humanizer</h3>
              <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed relative z-10">Transform AI-generated or stiff text into natural, human-sounding writing that maintains your voice and passes detection tools.</p>
            </div>
            
            <div className="group relative bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-3xl p-6 text-left hover:shadow-2xl hover:shadow-emerald-500/20 hover:-translate-y-2 transition-all duration-300 overflow-hidden border border-emerald-100 dark:border-emerald-800/50">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/30 relative z-10">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
              </div>
              <h3 className="font-bold text-stone-800 dark:text-stone-100 text-base mb-2 relative z-10">AI Summarizer</h3>
              <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed relative z-10">Condense lengthy articles, textbooks, or research papers into clear bullet points, paragraphs, or key takeaways.</p>
            </div>
            
            <div className="group relative bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-3xl p-6 text-left hover:shadow-2xl hover:shadow-amber-500/20 hover:-translate-y-2 transition-all duration-300 overflow-hidden border border-amber-100 dark:border-amber-800/50">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-400/20 to-orange-400/20 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mb-4 shadow-lg shadow-amber-500/30 relative z-10">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <h3 className="font-bold text-stone-800 dark:text-stone-100 text-base mb-2 relative z-10">Citation Finder</h3>
              <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed relative z-10">Find real, verifiable academic sources for any claim. Get properly formatted citations in APA, MLA, Chicago, and Harvard styles.</p>
            </div>
            
            <div className="group relative bg-gradient-to-br from-cyan-50 to-teal-50 dark:from-cyan-900/20 dark:to-teal-900/20 rounded-3xl p-6 text-left hover:shadow-2xl hover:shadow-cyan-500/20 hover:-translate-y-2 transition-all duration-300 overflow-hidden border border-cyan-100 dark:border-cyan-800/50">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-cyan-400/20 to-teal-400/20 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/30 relative z-10">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
              </div>
              <h3 className="font-bold text-stone-800 dark:text-stone-100 text-base mb-2 relative z-10">Quiz Generator</h3>
              <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed relative z-10">Turn any notes or text into interactive quizzes. Multiple choice, true/false, and fill-in-the-blank with adjustable difficulty.</p>
            </div>
            
            <div className="group relative bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 rounded-3xl p-6 text-left hover:shadow-2xl hover:shadow-indigo-500/20 hover:-translate-y-2 transition-all duration-300 overflow-hidden border border-indigo-100 dark:border-indigo-800/50">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-400/20 to-violet-400/20 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/30 relative z-10">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              </div>
              <h3 className="font-bold text-stone-800 dark:text-stone-100 text-base mb-2 relative z-10">Flashcard Creator</h3>
              <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed relative z-10">Generate study flashcards from any content. Flip through them in-app or export to PDF for on-the-go studying.</p>
            </div>
            
            <div className="group relative bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-3xl p-6 text-left hover:shadow-2xl hover:shadow-pink-500/20 hover:-translate-y-2 transition-all duration-300 overflow-hidden border border-pink-100 dark:border-pink-800/50 sm:col-span-2 lg:col-span-1">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-pink-400/20 to-rose-400/20 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center mb-4 shadow-lg shadow-pink-500/30 relative z-10">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" /></svg>
              </div>
              <h3 className="font-bold text-stone-800 dark:text-stone-100 text-base mb-2 relative z-10">Crossword Builder</h3>
              <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed relative z-10">Create fun, interactive crossword puzzles from your study material. An engaging way to learn vocabulary and key concepts.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section with Cute Characters */}
      <section className="py-16 sm:py-20 bg-white dark:bg-stone-900/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-800 dark:text-stone-100 mb-4">Our values</h2>
            <p className="text-stone-500 dark:text-stone-400 max-w-xl mx-auto">
              These principles guide everything we build at WriteScholar
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Quality - Professional woman with bun */}
            <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl p-6 text-center hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-600 transition-all">
              <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4 mx-auto overflow-hidden">
                <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16">
                  <circle cx="32" cy="32" r="32" fill="#DBEAFE"/>
                  <ellipse cx="32" cy="36" rx="14" ry="15" fill="#E8B796"/>
                  {/* Hair with bun */}
                  <path d="M18 30 Q16 18 26 14 Q32 10 38 14 Q48 18 46 30 Q44 22 38 18 Q32 14 26 18 Q20 22 18 30" fill="#5D3A1A"/>
                  <ellipse cx="32" cy="10" rx="8" ry="7" fill="#5D3A1A"/>
                  <path d="M18 30 Q14 36 18 42" fill="#5D3A1A"/>
                  <path d="M46 30 Q50 36 46 42" fill="#5D3A1A"/>
                  {/* Eyes */}
                  <ellipse cx="26" cy="35" rx="2.5" ry="3" fill="#1F2937"/>
                  <ellipse cx="38" cy="35" rx="2.5" ry="3" fill="#1F2937"/>
                  <circle cx="27" cy="34" r="0.8" fill="white"/>
                  <circle cx="39" cy="34" r="0.8" fill="white"/>
                  {/* Confident smile */}
                  <path d="M27 46 Q32 51 37 46" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round"/>
                  <ellipse cx="21" cy="40" rx="3" ry="2" fill="#FECACA" opacity="0.4"/>
                  <ellipse cx="43" cy="40" rx="3" ry="2" fill="#FECACA" opacity="0.4"/>
                </svg>
              </div>
              <h3 className="font-semibold text-stone-800 dark:text-stone-100 mb-2">Quality</h3>
              <p className="text-stone-500 dark:text-stone-400 text-sm">Highest standards in AI analysis and feedback</p>
            </div>

            {/* Privacy - Man with beard */}
            <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl p-6 text-center hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-600 transition-all">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-4 mx-auto overflow-hidden">
                <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16">
                  <circle cx="32" cy="32" r="32" fill="#D1FAE5"/>
                  <ellipse cx="32" cy="36" rx="14" ry="15" fill="#D4A574"/>
                  {/* Hair */}
                  <path d="M18 28 Q16 14 28 10 Q32 8 36 10 Q48 14 46 28 Q44 20 38 16 Q32 12 26 16 Q20 20 18 28" fill="#3D2314"/>
                  <path d="M18 28 Q14 34 18 40" fill="#3D2314"/>
                  <path d="M46 28 Q50 34 46 40" fill="#3D2314"/>
                  {/* Beard */}
                  <path d="M20 42 Q22 54 32 56 Q42 54 44 42" fill="#3D2314"/>
                  {/* Eyes */}
                  <ellipse cx="26" cy="34" rx="2.5" ry="3" fill="#1F2937"/>
                  <ellipse cx="38" cy="34" rx="2.5" ry="3" fill="#1F2937"/>
                  <circle cx="27" cy="33" r="0.8" fill="white"/>
                  <circle cx="39" cy="33" r="0.8" fill="white"/>
                  {/* Slight smile in beard */}
                  <path d="M28 46 Q32 49 36 46" stroke="#2D1810" strokeWidth="2" fill="none" strokeLinecap="round"/>
                  <ellipse cx="21" cy="38" rx="3" ry="2" fill="#E8A090" opacity="0.4"/>
                  <ellipse cx="43" cy="38" rx="3" ry="2" fill="#E8A090" opacity="0.4"/>
                </svg>
              </div>
              <h3 className="font-semibold text-stone-800 dark:text-stone-100 mb-2">Privacy</h3>
              <p className="text-stone-500 dark:text-stone-400 text-sm">Enterprise-grade security for your documents</p>
            </div>

            {/* Innovation - Young person with modern hair */}
            <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl p-6 text-center hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-600 transition-all">
              <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center mb-4 mx-auto overflow-hidden">
                <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16">
                  <circle cx="32" cy="32" r="32" fill="#F3E8FF"/>
                  <ellipse cx="32" cy="36" rx="14" ry="15" fill="#FCD9B6"/>
                  {/* Modern swooped hair */}
                  <path d="M16 32 Q14 16 28 12 Q40 8 48 16 Q52 22 48 32 Q46 24 40 18 Q32 12 24 18 Q18 24 16 32" fill="#6366F1"/>
                  <path d="M16 32 Q12 38 16 44" fill="#6366F1"/>
                  <path d="M48 26 Q54 20 50 14" fill="#6366F1"/>
                  {/* Eyes - excited */}
                  <ellipse cx="26" cy="35" rx="3" ry="3.5" fill="#1F2937"/>
                  <ellipse cx="38" cy="35" rx="3" ry="3.5" fill="#1F2937"/>
                  <circle cx="27" cy="34" r="1" fill="white"/>
                  <circle cx="39" cy="34" r="1" fill="white"/>
                  {/* Big smile */}
                  <path d="M26 46 Q32 52 38 46" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round"/>
                  <ellipse cx="20" cy="40" rx="3" ry="2" fill="#FECACA" opacity="0.5"/>
                  <ellipse cx="44" cy="40" rx="3" ry="2" fill="#FECACA" opacity="0.5"/>
                </svg>
              </div>
              <h3 className="font-semibold text-stone-800 dark:text-stone-100 mb-2">Innovation</h3>
              <p className="text-stone-500 dark:text-stone-400 text-sm">Continuous improvement of our technology</p>
            </div>

            {/* Accessibility - Friendly person with headphones */}
            <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl p-6 text-center hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-600 transition-all">
              <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center mb-4 mx-auto overflow-hidden">
                <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16">
                  <circle cx="32" cy="32" r="32" fill="#FFEDD5"/>
                  <ellipse cx="32" cy="36" rx="14" ry="15" fill="#8B5A2B"/>
                  {/* Hair - short curly */}
                  <path d="M18 30 Q16 18 26 14 Q32 10 38 14 Q48 18 46 30 Q44 22 38 18 Q32 14 26 18 Q20 22 18 30" fill="#1F2937"/>
                  <ellipse cx="20" cy="28" rx="4" ry="5" fill="#1F2937"/>
                  <ellipse cx="44" cy="28" rx="4" ry="5" fill="#1F2937"/>
                  <ellipse cx="26" cy="16" rx="3" ry="4" fill="#1F2937"/>
                  <ellipse cx="32" cy="12" rx="4" ry="3" fill="#1F2937"/>
                  <ellipse cx="38" cy="16" rx="3" ry="4" fill="#1F2937"/>
                  {/* Eyes */}
                  <ellipse cx="26" cy="35" rx="2.5" ry="3" fill="#1F2937"/>
                  <ellipse cx="38" cy="35" rx="2.5" ry="3" fill="#1F2937"/>
                  <circle cx="27" cy="34" r="0.8" fill="white"/>
                  <circle cx="39" cy="34" r="0.8" fill="white"/>
                  {/* Warm smile */}
                  <path d="M26 46 Q32 52 38 46" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round"/>
                  <ellipse cx="20" cy="40" rx="3" ry="2" fill="#C9958A" opacity="0.4"/>
                  <ellipse cx="44" cy="40" rx="3" ry="2" fill="#C9958A" opacity="0.4"/>
                </svg>
              </div>
              <h3 className="font-semibold text-stone-800 dark:text-stone-100 mb-2">Accessibility</h3>
              <p className="text-stone-500 dark:text-stone-400 text-sm">Tools for the global academic community</p>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-800 dark:text-stone-100 mb-6">Our story</h2>
            <div className="text-stone-500 dark:text-stone-400 leading-relaxed space-y-4 text-left">
              <p>
                WriteScholar started with a simple goal: give students access to the kind of feedback that used to require expensive tutors or professors with limited office hours. We saw how AI could bridge that gap.
              </p>
              <p>
                What began as an essay analyzer has grown into a complete academic toolkit. Our AI Humanizer helps you refine AI-assisted drafts into natural, authentic writing. The Summarizer condenses long readings into digestible points. Our Citation Finder locates real, verifiable sources for your claims.
              </p>
              <p>
                We didn't stop at writing. Studying effectively is just as important, so we built tools that turn any notes into interactive quizzes, flashcards, and crossword puzzles. Active recall beats passive reading every time.
              </p>
              <p>
                Today, students around the world use WriteScholar to write better papers, study smarter, and save hours of work. We're just getting started.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-stone-800 dark:bg-stone-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">
            {user ? 'Ready to write your next paper?' : 'Ready to improve your academic writing?'}
          </h2>
          <p className="text-stone-400 mb-8 max-w-xl mx-auto">
            {user 
              ? 'Head to your dashboard to analyze essays, humanize text, find citations, or create study materials.'
              : 'Join students worldwide who use WriteScholar to write better and study smarter.'
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {user ? (
              <>
                <button 
                  onClick={() => onNavigate('dashboard')}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-bold rounded-2xl hover:from-indigo-400 hover:to-violet-500 shadow-lg shadow-indigo-500/25 transition-all"
                >
                  Go to Dashboard
                </button>
                <button 
                  onClick={() => onNavigate('features')}
                  className="px-6 py-3 border-2 border-stone-500 text-white font-semibold rounded-2xl hover:border-stone-400 transition-colors"
                >
                  View Features
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => onNavigate('signup')}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-bold rounded-2xl hover:from-indigo-400 hover:to-violet-500 shadow-lg shadow-indigo-500/25 transition-all"
                >
                  Try Free
                </button>
                <button 
                  onClick={() => onNavigate('features')}
                  className="px-6 py-3 border-2 border-stone-500 text-white font-semibold rounded-2xl hover:border-stone-400 transition-colors"
                >
                  Learn More
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default AboutPage;
