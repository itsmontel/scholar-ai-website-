import { useState, useEffect, useRef } from 'react';
import Header from '../common/Header';
import Footer from '../common/Footer';
import AnalysisAnimation from '../common/AnalysisAnimation';
import { trackAction } from '../../data/achievements';

interface AnalyzeEssayPageProps {
  onNavigate: (page: string) => void;
  user?: any;
  onLogout: () => void;
}

const getWordCount = (text: string) =>
  text.trim().split(/\s+/).filter(Boolean).length;

const placeholders = [
  "Paste your essay or research paper here...",
  "Get instant AI feedback on your writing...",
  "Improve your academic writing in seconds..."
];

const AnalyzeEssayPage = ({ onNavigate, user, onLogout }: AnalyzeEssayPageProps) => {
  const [inputText, setInputText] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [showWordWarning, setShowWordWarning] = useState(false);
  const [showAnalysisPopup, setShowAnalysisPopup] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [showRevealAnimation, setShowRevealAnimation] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = 'Analyze Essay – Professor-Style Feedback | WriteScholar';
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const isTextValid = () => {
    if (user) return getWordCount(inputText) >= 200;
    return getWordCount(inputText) >= 200 || !!uploadedFileName;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setUploadedFileName(file.name);
    e.target.value = '';
  };

  const handleSubmit = () => {
    if (user) {
      const wordCount = getWordCount(inputText);
      if (wordCount < 200) {
        setShowWordWarning(true);
        setTimeout(() => setShowWordWarning(false), 3000);
        return;
      }
      setShowAnalysisPopup(true);
      setAnalysisComplete(false);
      localStorage.setItem('textAnalysisContent', inputText);
      trackAction('analyses_count');
      setTimeout(() => setAnalysisComplete(true), 2000);
      setTimeout(() => {
        setShowAnalysisPopup(false);
        setAnalysisComplete(false);
        onNavigate('analysis');
      }, 4000);
      return;
    }

    // Signed out: fake animation for 14 seconds, then cool reveal, then signup modal
    setShowAnalysisPopup(true);
    setAnalysisComplete(false);
    setShowRevealAnimation(false);
    setTimeout(() => setAnalysisComplete(true), 12500);
    setTimeout(() => {
      setShowAnalysisPopup(false);
      setAnalysisComplete(false);
      setShowRevealAnimation(true);
    }, 14000);
    setTimeout(() => {
      setShowRevealAnimation(false);
      setShowSignupPrompt(true);
    }, 15500);
  };

  return (
    <div className="min-h-screen relative transition-colors font-sans bg-stone-50/50 dark:bg-stone-900">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-15%,rgba(251,207,232,0.15),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-15%,rgba(236,72,153,0.06),transparent)] pointer-events-none" aria-hidden />

      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="analyze" />

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-24 sm:pb-28">
        <div className="flex flex-col gap-8 lg:gap-10">
          {/* Top: Hero card - matches dashboard style */}
          <div className="relative rounded-3xl sm:rounded-[2rem] overflow-hidden p-[2px] bg-gradient-to-br from-rose-400/80 via-pink-400/80 to-rose-500/80 dark:from-rose-500/60 dark:via-pink-500/60 dark:to-rose-600/60 shadow-[0_20px_50px_-15px_rgba(244,63,94,0.25)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.4)]">
            <div className="relative rounded-[22px] sm:rounded-[30px] bg-white/90 dark:bg-stone-800/95 backdrop-blur-2xl border border-white/50 dark:border-stone-700/50 shadow-inner p-6 sm:p-10">
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-rose-400/25 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-pink-400/20 rounded-full blur-3xl pointer-events-none" />
              {/* Hero headline - matches dashboard */}
              <h2 className="relative text-2xl sm:text-3xl md:text-4xl font-extrabold text-stone-900 dark:text-white text-center mb-2 tracking-tight">
                Enhance your <span className="bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 bg-clip-text text-transparent" style={{ WebkitBackgroundClip: 'text' }}>academic writing</span> with AI
              </h2>
              <p className="relative text-stone-600 dark:text-stone-300 text-base sm:text-lg text-center mb-8 max-w-xl mx-auto leading-relaxed">
                Professor-style feedback on structure, clarity, citations and tone in under 60 seconds
              </p>
              {/* Tick boxes - matches dashboard */}
              <div className="relative grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-3 sm:gap-6 mb-8">
                {['Quick structure analysis', 'Detailed annotations', 'Grade-level rubric', 'Improvement suggestions'].map((f, i) => (
                  <span key={i} className="flex items-center gap-2.5 text-stone-600 dark:text-stone-400 text-sm sm:text-base">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center">
                      <svg className="w-3 h-3 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    </span>
                    {f}
                  </span>
                ))}
              </div>

              {/* Paste essay + Analyze - gradient border like dashboard */}
              {!(!user && uploadedFileName) && (
                <div className="relative mb-2 max-w-3xl mx-auto">
                  <div className="relative rounded-2xl sm:rounded-3xl p-[2px] bg-gradient-to-br from-rose-400/80 via-pink-400/80 to-rose-500/80 dark:from-rose-500/60 dark:via-pink-500/60 dark:to-rose-600/60 shadow-[0_20px_50px_-15px_rgba(244,63,94,0.25)]">
                    <div className="relative rounded-[14px] sm:rounded-[22px] bg-white dark:bg-stone-800/95 backdrop-blur-sm min-h-[140px] sm:min-h-[180px]">
                      <textarea
                        value={inputText}
                        onChange={(e) => { setInputText(e.target.value); setShowWordWarning(false); }}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && isTextValid()) { e.preventDefault(); handleSubmit(); }}}
                        placeholder={placeholders[placeholderIndex]}
                        className="relative w-full min-h-[140px] sm:min-h-[180px] p-5 sm:p-6 text-stone-800 dark:text-stone-100 text-base sm:text-lg bg-transparent border-none outline-none resize-none placeholder-stone-400 leading-relaxed"
                        onInput={(e) => {
                          const target = e.target as HTMLTextAreaElement;
                          target.style.height = 'auto';
                          target.style.height = Math.min(target.scrollHeight, 320) + 'px';
                        }}
                      />
                      <div className="absolute bottom-4 left-5 text-sm text-stone-400 dark:text-stone-500 font-medium">
                        {getWordCount(inputText)} words
                        {getWordCount(inputText) < 200 && <span className="text-amber-500"> (min 200)</span>}
                      </div>
                      {showWordWarning && (
                        <div className="absolute -bottom-6 left-0 right-0 text-center">
                          <span className="text-sm font-medium text-red-500">Minimum 200 words required for analysis</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-center mt-6">
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={!isTextValid()}
                      className={`px-8 sm:px-10 py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all duration-200 font-bold text-base ${
                        isTextValid()
                          ? 'bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:from-rose-400 hover:to-pink-500 text-white shadow-lg shadow-rose-500/30 hover:shadow-xl hover:shadow-rose-500/40 hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer'
                          : 'bg-stone-200 dark:bg-stone-700 text-stone-400 cursor-not-allowed'
                      }`}
                    >
                      Analyze Text
                    </button>
                  </div>
                </div>
              )}

              {/* Upload your essay card - below paste area */}
              <div
                onClick={() => {
                  if (user) onNavigate('upload');
                  else fileInputRef.current?.click();
                }}
                className="relative mt-8 rounded-2xl sm:rounded-[1.75rem] overflow-hidden bg-white/90 dark:bg-stone-800/95 backdrop-blur-xl border border-white/50 dark:border-stone-600/50 shadow-2xl shadow-stone-900/10 dark:shadow-black/20 cursor-pointer transition-all hover:shadow-[0_25px_50px_-12px_rgba(236,72,153,0.2)] hover:scale-[1.01] active:scale-[0.99] group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="absolute top-0 left-0 w-16 h-16 rounded-2xl bg-rose-200/40 dark:bg-rose-500/20 blur-2xl pointer-events-none" />
                <div className="absolute top-0 right-0 w-16 h-16 rounded-2xl bg-sky-200/40 dark:bg-sky-500/20 blur-2xl pointer-events-none" />
                <div className="relative p-6 sm:p-8 text-center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-rose-500/25 text-white">
                    <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-stone-800 dark:text-stone-100 mb-2">Upload your essay</h3>
                  <p className="text-stone-500 dark:text-stone-400 text-sm sm:text-base mb-6 max-w-sm mx-auto">Get professor-style feedback on structure, clarity, and tone</p>
                  <div className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white font-semibold shadow-lg shadow-rose-500/25 transition-all group-hover:shadow-xl group-hover:scale-[1.02]">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    Upload File
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    {['PDF', 'DOCX', 'TXT'].map((fmt) => (
                      <span key={fmt} className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-500 dark:text-stone-400 text-xs font-medium">
                        {fmt}
                      </span>
                    ))}
                  </div>
                  {!user && uploadedFileName && (
                    <p className="mt-4 text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                      {uploadedFileName} uploaded
                      <button type="button" onClick={(e) => { e.stopPropagation(); setUploadedFileName(null); }} className="ml-1 p-0.5 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/30" aria-label="Remove">×</button>
                    </p>
                  )}
                </div>
              </div>
              {!user && uploadedFileName && (
                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!isTextValid()}
                    className={`px-8 py-3.5 rounded-2xl font-bold text-base ${
                      isTextValid() ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg' : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                    }`}
                  >
                    Analyze Text
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Bottom: Videos - See how it works */}
          <div className="relative">
            <div className="absolute -inset-2 bg-gradient-to-r from-rose-400/12 via-pink-400/12 to-rose-500/12 rounded-3xl blur-2xl pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-lg font-bold text-stone-800 dark:text-stone-100">See how it works</h2>
                <span className="h-px flex-1 max-w-32 bg-gradient-to-r from-rose-300/60 to-transparent dark:from-rose-500/40 rounded-full" />
              </div>
              <div className="space-y-5 max-w-3xl mx-auto">
                {/* Analyze video */}
                <div className="relative bg-white dark:bg-stone-800 rounded-2xl overflow-hidden shadow-xl shadow-stone-200/50 dark:shadow-stone-900/50 border border-stone-200/60 dark:border-stone-600/50">
                  <div className="absolute top-3 left-3 z-10 w-7 h-7 rounded-md bg-rose-500/90 text-white flex items-center justify-center text-xs font-bold shadow">1</div>
                  <div className="bg-gradient-to-br from-rose-50/50 to-pink-50/50 dark:from-rose-900/20 dark:to-pink-900/20 flex items-center justify-center aspect-video min-h-[180px] sm:min-h-[220px]">
                    <video
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-contain"
                      title="WriteScholar Essay Checker — Professor-style feedback on your writing"
                      aria-label="WriteScholar Essay Checker — Professor-style feedback on your writing"
                    >
                      <source src="/writescholar-essay-checker-demo.mp4" type="video/mp4" />
                    </video>
                  </div>
                  <div className="px-4 py-3.5 border-t border-stone-100 dark:border-stone-700/80">
                    <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">Essay analysis</p>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">Professor-style feedback on structure, clarity & tone</p>
                  </div>
                </div>
                {/* Rubric video */}
                <div className="relative bg-white dark:bg-stone-800 rounded-2xl overflow-hidden shadow-xl shadow-stone-200/50 dark:shadow-stone-900/50 border border-stone-200/60 dark:border-stone-600/50">
                  <div className="absolute top-3 left-3 z-10 w-7 h-7 rounded-md bg-amber-500/90 text-white flex items-center justify-center text-xs font-bold shadow">2</div>
                  <div className="bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-900/20 dark:to-orange-900/20 flex items-center justify-center aspect-video min-h-[180px] sm:min-h-[220px]">
                    <video
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-contain"
                      title="WriteScholar Essay Rubric — Grading criteria feedback"
                      aria-label="WriteScholar Essay Rubric — Grading criteria feedback"
                    >
                      <source src="/writescholar-essay-rubric-demo.mp4" type="video/mp4" />
                    </video>
                  </div>
                  <div className="px-4 py-3.5 border-t border-stone-100 dark:border-stone-700/80">
                    <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">Rubric matching</p>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">See how your assignment scores against the rubric</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {showAnalysisPopup && (
        <AnalysisAnimation
          isPopup={true}
          text="Analyzing your writing"
          isComplete={analysisComplete}
          onComplete={() => {
            setShowAnalysisPopup(false);
            setAnalysisComplete(false);
          }}
        />
      )}

      {/* Cool reveal animation - after 14s fake analysis for signed-out users */}
      {showRevealAnimation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="animate-in zoom-in-95 fade-in duration-500 text-center max-w-lg">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 shadow-2xl shadow-rose-500/40 mb-6 animate-in zoom-in duration-300" style={{ animationDelay: '100ms' }}>
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg animate-in slide-in-from-bottom-4 fade-in duration-500" style={{ animationDelay: '200ms' }}>
              We found several concerns and areas to improve in your paper.
            </p>
          </div>
        </div>
      )}

      {/* Signup Prompt Modal - for logged-out users after fake analysis */}
      {showSignupPrompt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-800 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-600 max-w-md w-full p-8 text-center relative animate-in zoom-in-95 fade-in duration-300">
            <button
              type="button"
              onClick={() => setShowSignupPrompt(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="w-20 h-20 bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-900/40 dark:to-pink-900/40 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">📋</span>
            </div>

            <h3 className="text-2xl font-bold text-stone-800 dark:text-stone-100 mb-3">See Your Full Report</h3>
            <p className="text-stone-600 dark:text-stone-400 mb-6">
              Sign in or create an account to see the full analysis with detailed feedback and suggestions.
            </p>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => onNavigate('signup')}
                className="w-full px-6 py-3.5 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-rose-500/25"
              >
                Create Account
              </button>
              <button
                type="button"
                onClick={() => { setShowSignupPrompt(false); onNavigate('login'); }}
                className="w-full px-6 py-3 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 font-medium rounded-xl transition-colors"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default AnalyzeEssayPage;
