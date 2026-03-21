import { useState, useEffect, useRef } from 'react';
import Header from '../common/Header';
import Footer from '../common/Footer';
import AnalysisAnimation from '../common/AnalysisAnimation';
import InteractiveDocumentAnalysis from '../landing/InteractiveDocumentAnalysis';
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
  /** Always mounted so library card can trigger pick even when textarea is hidden (guest + file) */
  const analyzeFileInputRef = useRef<HTMLInputElement>(null);
  const [isParsingAnalyzeDoc, setIsParsingAnalyzeDoc] = useState(false);
  const [analyzeUploadError, setAnalyzeUploadError] = useState('');

  useEffect(() => {
    document.title = 'AI College Essay Checker — Professor-Style Feedback | WriteScholar';
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

  const handleAnalyzeFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    if (!user) {
      setUploadedFileName(file.name);
      setAnalyzeUploadError('');
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      onNavigate('signup');
      return;
    }

    setIsParsingAnalyzeDoc(true);
    setAnalyzeUploadError('');
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${apiUrl}/analysis/parse-document`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to parse document');
      setInputText(data.data.content || '');
      setUploadedFileName(null);
      setShowWordWarning(false);
    } catch (err: any) {
      setAnalyzeUploadError(err.message || 'Failed to parse document');
    } finally {
      setIsParsingAnalyzeDoc(false);
    }
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

    // Signed out: fake animation for ~6 seconds, then cool reveal, then signup modal
    setShowAnalysisPopup(true);
    setAnalysisComplete(false);
    setShowRevealAnimation(false);
    setTimeout(() => setAnalysisComplete(true), 4500);
    setTimeout(() => {
      setShowAnalysisPopup(false);
      setAnalysisComplete(false);
      setShowRevealAnimation(true);
    }, 6000);
    setTimeout(() => {
      setShowRevealAnimation(false);
      setShowSignupPrompt(true);
    }, 7500);
  };

  return (
    <div className="min-h-screen relative transition-colors font-sans bg-stone-50/50 dark:bg-stone-900">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-15%,rgba(251,207,232,0.15),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-15%,rgba(236,72,153,0.06),transparent)] pointer-events-none" aria-hidden />

      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="analyze" />

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-24 sm:pb-28">
        <div className="flex flex-col gap-8 lg:gap-10">
          {/* Top: Hero card - matches dashboard style */}
          <div className="relative rounded-3xl sm:rounded-[2rem] overflow-hidden p-[2px] bg-rose-500 dark:bg-rose-600 shadow-[0_20px_50px_-15px_rgba(244,63,94,0.25)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.4)]">
            <div className="relative rounded-[22px] sm:rounded-[30px] bg-white/90 dark:bg-stone-800/95 backdrop-blur-2xl border border-white/50 dark:border-stone-700/50 shadow-inner p-6 sm:p-10">
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-rose-400/25 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-pink-400/20 rounded-full blur-3xl pointer-events-none" />
              {/* Hero headline — rose/pink accent (red theme) */}
              <h1 className="relative text-2xl sm:text-3xl md:text-4xl font-extrabold text-stone-900 dark:text-white text-center mb-2 tracking-tight">
                <span className="text-rose-600 dark:text-rose-400">Paste</span> or <span className="text-rose-600 dark:text-rose-400">upload</span> your essay, get feedback in seconds
              </h1>
              <p className="relative text-stone-600 dark:text-stone-300 text-base sm:text-lg text-center mb-8 max-w-xl mx-auto leading-relaxed">
                Upload your essay, get <span className="text-red-600 dark:text-red-500">professor</span><span className="text-amber-600 dark:text-amber-500">-style</span> <span className="text-green-600 dark:text-green-500">feedback</span>
              </p>
              {/* Tick boxes - matches dashboard */}
              <div className="relative grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-3 sm:gap-6 mb-8">
                {['In-depth structure analysis', 'Detailed annotations', 'Grade-level rubric', 'Improvement suggestions'].map((f, i) => (
                  <span key={i} className="flex items-center gap-2.5 text-stone-600 dark:text-stone-400 text-sm sm:text-base">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center">
                      <svg className="w-3 h-3 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    </span>
                    {f}
                  </span>
                ))}
              </div>

              <input
                ref={analyzeFileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                onChange={handleAnalyzeFileChange}
                className="hidden"
                aria-hidden
              />

              {/* Paste essay + Analyze — rose ring (red theme) */}
              {!(!user && uploadedFileName) && (
                <div className="relative mb-2 max-w-3xl mx-auto">
                  <div className="relative rounded-2xl sm:rounded-3xl p-[2px] bg-rose-500 dark:bg-rose-600 shadow-[0_20px_50px_-15px_rgba(244,63,94,0.25)]">
                    <div className="relative rounded-[14px] sm:rounded-[22px] bg-white dark:bg-stone-800/95 backdrop-blur-sm min-h-[140px] sm:min-h-[180px]">
                      <textarea
                        value={inputText}
                        onChange={(e) => {
                          setInputText(e.target.value);
                          setShowWordWarning(false);
                          if (user) setAnalyzeUploadError('');
                        }}
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
                  {analyzeUploadError && (
                    <div className="mt-3 px-2 text-center">
                      <p className="text-sm font-medium text-red-600 dark:text-red-400">{analyzeUploadError}</p>
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mt-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => analyzeFileInputRef.current?.click()}
                        disabled={!!user && isParsingAnalyzeDoc}
                        className="flex items-center gap-2.5 px-5 py-3.5 rounded-2xl font-bold text-sm transition-all disabled:opacity-50 bg-rose-500/15 dark:bg-rose-500/25 text-rose-700 dark:text-rose-300 hover:bg-rose-500/25 dark:hover:bg-rose-500/35 border-2 border-rose-300/80 dark:border-rose-600/60 shadow-md shadow-rose-500/15 hover:shadow-lg hover:shadow-rose-500/25"
                      >
                        {user && isParsingAnalyzeDoc ? (
                          <span className="w-5 h-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                        )}
                        {user && isParsingAnalyzeDoc ? 'Uploading...' : 'Upload file'}
                      </button>
                      {(inputText.trim() || uploadedFileName) && (
                        <button
                          type="button"
                          onClick={() => {
                            setInputText('');
                            setUploadedFileName(null);
                            setAnalyzeUploadError('');
                          }}
                          className="px-3 py-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-700/50 text-xs font-medium transition-colors"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={!isTextValid()}
                      className={`px-8 sm:px-10 py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all duration-200 font-bold text-base ${
                        isTextValid()
                          ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-500/30 hover:shadow-xl hover:shadow-rose-500/40 hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer'
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
                  else analyzeFileInputRef.current?.click();
                }}
                className="relative mt-8 rounded-2xl sm:rounded-[1.75rem] overflow-hidden bg-white/90 dark:bg-stone-800/95 backdrop-blur-xl border border-white/50 dark:border-stone-600/50 shadow-2xl shadow-stone-900/10 dark:shadow-black/20 cursor-pointer transition-all hover:shadow-[0_25px_50px_-12px_rgba(236,72,153,0.2)] hover:scale-[1.01] active:scale-[0.99] group"
              >
                <div className="absolute top-0 left-0 w-16 h-16 rounded-2xl bg-rose-200/40 dark:bg-rose-500/20 blur-2xl pointer-events-none" />
                <div className="absolute top-0 right-0 w-16 h-16 rounded-2xl bg-pink-200/40 dark:bg-pink-500/20 blur-2xl pointer-events-none" />
                <div className="relative p-6 sm:p-8 text-center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-rose-600 hover:bg-rose-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-rose-500/25 text-white">
                    <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-stone-800 dark:text-stone-100 mb-2">{user ? 'Save to your library' : 'Try the demo upload'}</h3>
                  <p className="text-stone-500 dark:text-stone-400 text-sm sm:text-base mb-6 max-w-sm mx-auto">
                    {user
                      ? 'Save work in your library. Use Upload file above to load a PDF or Word file into the box.'
                      : 'Pick a file to run the preview flow, or paste 200+ words above'}
                  </p>
                  <div className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow-lg shadow-rose-500/25 transition-all group-hover:shadow-xl group-hover:scale-[1.02]">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    {user ? 'Library upload' : 'Choose file'}
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
                      isTextValid() ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                    }`}
                  >
                    Analyze Text
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Bottom: Real demo result */}
          <div className="relative">
            <div className="absolute -inset-2 bg-rose-500/15 rounded-3xl blur-2xl pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-lg font-bold text-stone-800 dark:text-stone-100">See a real analysis in action</h2>
                <span className="h-px flex-1 max-w-32 bg-rose-300/70 dark:bg-rose-500/40 rounded-full" />
              </div>
              <InteractiveDocumentAnalysis onNavigate={onNavigate} />
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
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-rose-600 shadow-2xl shadow-rose-500/40 mb-6 animate-in zoom-in duration-300" style={{ animationDelay: '100ms' }}>
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

            <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/40 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-rose-200/60 dark:border-rose-800/50">
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
                className="w-full px-6 py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-rose-500/25"
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
