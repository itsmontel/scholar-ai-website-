import { useState, useEffect, useRef } from 'react';
import Header from '../common/Header';
import Footer from '../common/Footer';
import ScholarMascot from '../common/ScholarMascot';
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

      <main className="relative max-w-3xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-24 sm:pb-28">
        {/* Main content - stacked: form on top, videos below */}
        <div className="flex flex-col gap-8 lg:gap-10">
          {/* Top: Form - unified card */}
          <div className="order-1">
            <div className="bg-white dark:bg-stone-800 rounded-3xl border border-stone-200 dark:border-stone-600 shadow-sm dark:shadow-stone-900/50 p-6 sm:p-8 space-y-6">
              {/* Hero */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 hidden sm:block">
                  <ScholarMascot size={72} animated={false} pose="default" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-800 dark:text-stone-100 leading-tight tracking-tight">
                    Analyze Essay
                  </h1>
                  <p className="text-sm text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
                    Get professor-style feedback on structure, clarity, and tone.
                  </p>
                </div>
              </div>

              {/* Upload Section - gradient card with decorative elements */}
              <div className="relative overflow-visible">
              <div
                onClick={() => {
                  if (user) onNavigate('upload');
                  else fileInputRef.current?.click();
                }}
                className="relative bg-gradient-to-br from-white via-rose-50/30 to-pink-50/50 dark:from-stone-800 dark:via-rose-900/10 dark:to-pink-900/10 rounded-2xl p-6 sm:p-8 text-center border border-rose-200/50 dark:border-rose-800/40 active:border-rose-300 dark:active:border-rose-600 sm:hover:border-rose-300 dark:sm:hover:border-rose-600 cursor-pointer transition-all duration-200 sm:hover:shadow-lg sm:hover:shadow-rose-200/30 sm:hover:-translate-y-0.5 group shadow-md overflow-hidden"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="absolute top-3 left-3 w-10 h-10 rounded-lg bg-rose-200/40 dark:bg-rose-500/20 rotate-12 group-hover:rotate-0 transition-transform hidden sm:block" />
                <div className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-sky-200/40 dark:bg-sky-500/20 -rotate-6 group-hover:scale-110 transition-transform hidden sm:block" />
                <div className="absolute bottom-3 right-3 w-14 h-14 rounded-full bg-violet-200/30 dark:bg-violet-500/10 group-hover:scale-110 transition-transform hidden sm:block" />

                <div className="relative z-10 w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform shadow-lg shadow-rose-500/25">
                  <span className="text-3xl sm:text-4xl">📝</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-stone-800 dark:text-stone-100 mb-1 relative z-10">Upload your essay</h2>
                <p className="text-sm text-stone-500 dark:text-stone-400 mb-4 relative z-10">Get professor-style feedback on structure, clarity, and tone</p>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); user ? onNavigate('upload') : fileInputRef.current?.click(); }}
                  className="w-full inline-flex items-center justify-center px-6 py-3.5 bg-gradient-to-r from-rose-500 to-pink-600 active:from-rose-600 active:to-pink-700 sm:hover:from-rose-400 sm:hover:to-pink-500 text-white font-semibold rounded-2xl transition-all text-sm shadow-lg shadow-rose-500/25 sm:hover:scale-[1.02] active:scale-95 relative z-10"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload File
                </button>
                <div className="flex justify-center gap-2 mt-4 relative z-10">
                  <span className="px-4 py-1.5 bg-white dark:bg-stone-700/50 text-stone-600 dark:text-stone-300 text-xs font-medium rounded-full border border-stone-200 dark:border-stone-600">PDF</span>
                  <span className="px-4 py-1.5 bg-white dark:bg-stone-700/50 text-stone-600 dark:text-stone-300 text-xs font-medium rounded-full border border-stone-200 dark:border-stone-600">DOCX</span>
                  <span className="px-4 py-1.5 bg-white dark:bg-stone-700/50 text-stone-600 dark:text-stone-300 text-xs font-medium rounded-full border border-stone-200 dark:border-stone-600">TXT</span>
                </div>
              </div>
              {!user && uploadedFileName && (
                <div className="mt-3 space-y-3">
                  <p className="text-center text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {uploadedFileName} uploaded
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setUploadedFileName(null); }}
                      className="ml-1 p-0.5 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                      aria-label="Remove file"
                    >
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </p>
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={!isTextValid()}
                      className={`w-full px-6 py-3 rounded-2xl flex items-center justify-center transition-all font-semibold text-sm ${
                        isTextValid()
                          ? 'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white shadow-lg shadow-rose-500/25 hover:scale-[1.02] cursor-pointer'
                          : 'bg-stone-200 dark:bg-stone-700 text-stone-400 dark:text-stone-500 cursor-not-allowed'
                      }`}
                    >
                      Analyze Text
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Divider + Text Input - hidden for signed-out users when file is uploaded */}
            {!(!user && uploadedFileName) && (
              <>
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-stone-200 dark:bg-stone-600" />
                  <span className="text-stone-400 dark:text-stone-500 text-sm font-medium">or paste text</span>
                  <div className="flex-1 h-px bg-stone-200 dark:bg-stone-600" />
                </div>

                <div className="space-y-3">
                  <div className="relative bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-600 shadow-sm focus-within:border-stone-300 dark:focus-within:border-stone-500 focus-within:ring-1 focus-within:ring-stone-200 dark:focus-within:ring-stone-600 transition-all">
                    <textarea
                      value={inputText}
                      onChange={(e) => { setInputText(e.target.value); setShowWordWarning(false); }}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && isTextValid()) { e.preventDefault(); handleSubmit(); }}}
                      placeholder={placeholders[placeholderIndex]}
                      className="w-full min-h-[120px] sm:min-h-[140px] p-4 text-stone-800 dark:text-stone-200 text-sm sm:text-base border-none outline-none resize-none bg-transparent placeholder-stone-400 leading-relaxed rounded-2xl"
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = Math.min(target.scrollHeight, 240) + 'px';
                      }}
                    />
                    <div className="absolute bottom-3 left-4 text-xs text-stone-400 dark:text-stone-500">
                      {getWordCount(inputText)} words
                      {user && getWordCount(inputText) < 200 ? ' (min 200)' : ''}
                      {!user && !uploadedFileName && getWordCount(inputText) < 200 ? ' (min 200 or upload file)' : ''}
                    </div>
                    {showWordWarning && (
                      <div className="absolute -bottom-6 left-0 right-0 text-center">
                        <span className="text-xs text-red-500">Minimum 200 words required</span>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!isTextValid()}
                    className={`w-full px-6 py-3 rounded-2xl flex items-center justify-center transition-all font-semibold text-sm ${
                      isTextValid()
                        ? 'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white shadow-lg shadow-rose-500/25 hover:scale-[1.02] cursor-pointer'
                        : 'bg-stone-200 dark:bg-stone-700 text-stone-400 dark:text-stone-500 cursor-not-allowed'
                    }`}
                  >
                    Analyze Text
                  </button>
                </div>
              </>
            )}
            </div>
          </div>

          {/* Bottom: Videos - See how it works */}
          <div className="relative order-2">
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
