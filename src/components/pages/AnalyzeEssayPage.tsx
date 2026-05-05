import { useState, useEffect, useRef } from 'react';
import Header from '../common/Header';
import { WriteScholarEditorialBackgroundLayers } from '../common/WriteScholarEditorialBackground';
import Footer from '../common/Footer';
import AnalysisAnimation from '../common/AnalysisAnimation';
import { trackAction } from '../../data/achievements';

interface AnalyzeEssayPageProps {
  onNavigate: (page: string, slug?: string, options?: { studyPack?: { data: unknown; title?: string } }) => void;
  user?: any;
  onLogout: () => void;
}

const getWordCount = (text: string) =>
  text.trim().split(/\s+/).filter(Boolean).length;

const placeholders = [
  'Paste your essay or research paper here...',
  'Get instant AI feedback on your writing...',
  'Improve your academic writing in seconds...',
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
  const analyzeFileInputRef = useRef<HTMLInputElement>(null);
  const [isParsingAnalyzeDoc, setIsParsingAnalyzeDoc] = useState(false);
  const [analyzeUploadError, setAnalyzeUploadError] = useState('');
  const [analyzeDropActive, setAnalyzeDropActive] = useState(false);

  useEffect(() => {
    document.title = 'AI Essay Checker — Professor-Level Feedback in Seconds | WriteScholar';
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

  const processAnalyzeFile = async (file: File) => {
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
    } catch (err: unknown) {
      setAnalyzeUploadError(err instanceof Error ? err.message : 'Failed to parse document');
    } finally {
      setIsParsingAnalyzeDoc(false);
    }
  };

  const handleAnalyzeFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    await processAnalyzeFile(file);
  };

  const handleAnalyzeDropZoneDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setAnalyzeDropActive(true);
    } else if (e.type === 'dragleave') {
      setAnalyzeDropActive(false);
    }
  };

  const handleAnalyzeDropZoneDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAnalyzeDropActive(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await processAnalyzeFile(file);
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
    <div className="min-h-screen relative transition-colors font-sans overflow-x-hidden">
      <WriteScholarEditorialBackgroundLayers position="fixed" />

      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="analyze" />

      <main className="relative max-w-[1360px] mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-6 pb-24 sm:pb-16 w-full min-w-0 overflow-x-hidden">
        <div className="w-full min-w-0">
          <div className="pt-1 sm:pt-2 pb-3 sm:pb-5 overflow-visible">
            <section
              data-tutorial="analyze-ready"
              className="relative rounded-3xl overflow-hidden mb-6 sm:mb-8 max-w-6xl mx-auto scroll-mt-8 bg-white dark:bg-stone-900/80 ring-1 ring-stone-200/80 dark:ring-stone-700/60 shadow-xl shadow-stone-900/[0.05] dark:shadow-black/40"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-rose-400" aria-hidden />
              <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
                <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-violet-300/15 dark:bg-violet-500/10 blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-fuchsia-300/15 dark:bg-fuchsia-500/10 blur-3xl" />
              </div>

              <div className="relative p-6 sm:p-8 lg:p-10">
                <input
                  ref={analyzeFileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                  onChange={handleAnalyzeFileChange}
                  className="hidden"
                  aria-hidden
                />

                <div className="text-center mb-5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 ring-1 ring-violet-200/80 dark:ring-violet-800/50 text-xs font-medium">
                    <span aria-hidden>✨</span>
                    Professor-style feedback in seconds
                  </span>
                </div>

                <h1
                  className="relative text-center text-2xl sm:text-3xl lg:text-[2.4rem] font-semibold leading-[1.1] tracking-tight text-stone-900 dark:text-stone-50 mb-3"
                  style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
                >
                  Get{' '}
                  <span className="bg-gradient-to-r from-violet-700 via-fuchsia-600 to-rose-500 dark:from-violet-300 dark:via-fuchsia-300 dark:to-rose-300 bg-clip-text text-transparent">
                    professor-style feedback
                  </span>{' '}
                  on your essay
                </h1>
                <p className="text-center text-sm sm:text-base text-stone-500 dark:text-stone-400 max-w-2xl mx-auto leading-relaxed mb-6">
                  Drop in your paper and see what to improve — structure, arguments, clarity, citations, and more.
                </p>

                <div className="relative flex rounded-2xl bg-violet-50/70 dark:bg-violet-950/25 p-1 mb-6 max-w-lg mx-auto border border-violet-200/80 dark:border-violet-800/50 shadow-sm shadow-violet-900/5">
                  <button
                    type="button"
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[0.65rem] font-medium text-sm transition-all duration-200 bg-white dark:bg-stone-800 text-violet-900 dark:text-violet-200 shadow-sm ring-1 ring-violet-200/85 dark:ring-violet-800/55"
                  >
                    <span className="text-base" aria-hidden>
                      📝
                    </span>
                    Analyze Text
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('citations')}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[0.65rem] font-medium text-sm transition-all duration-200 text-stone-600 dark:text-stone-400 hover:text-violet-950 dark:hover:text-stone-200 hover:bg-white/80 dark:hover:bg-stone-800/50"
                  >
                    <span className="text-base" aria-hidden>
                      📚
                    </span>
                    Citations
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('study-pack')}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[0.65rem] font-medium text-sm transition-all duration-200 text-stone-600 dark:text-stone-400 hover:text-violet-950 dark:hover:text-stone-200 hover:bg-white/80 dark:hover:bg-stone-800/50"
                  >
                    <span className="text-base" aria-hidden>
                      📦
                    </span>
                    Study Pack
                  </button>
                </div>

                {!user && uploadedFileName && (
                  <div className="relative mb-6 rounded-xl border border-violet-200/90 dark:border-violet-800/50 bg-violet-50/50 dark:bg-violet-950/25 px-4 py-3 flex flex-col sm:flex-row items-center justify-center gap-3 text-sm">
                    <p className="text-stone-700 dark:text-stone-200 font-medium">
                      <span className="text-stone-500 dark:text-stone-400 font-normal">Selected:</span> {uploadedFileName}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => analyzeFileInputRef.current?.click()}
                        className="text-violet-700 dark:text-violet-400 font-semibold hover:underline"
                      >
                        Change file
                      </button>
                      <button
                        type="button"
                        onClick={() => setUploadedFileName(null)}
                        className="text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 text-xs font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}

                {!(!user && uploadedFileName) && (
                  <div className="relative space-y-6">
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => !isParsingAnalyzeDoc && analyzeFileInputRef.current?.click()}
                      onKeyDown={(e) => {
                        if ((e.key === 'Enter' || e.key === ' ') && !isParsingAnalyzeDoc) {
                          e.preventDefault();
                          analyzeFileInputRef.current?.click();
                        }
                      }}
                      onDrop={handleAnalyzeDropZoneDrop}
                      onDragEnter={handleAnalyzeDropZoneDrag}
                      onDragOver={handleAnalyzeDropZoneDrag}
                      onDragLeave={handleAnalyzeDropZoneDrag}
                      className={`group relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300 ${
                        isParsingAnalyzeDoc ? 'opacity-70 cursor-wait pointer-events-none' : ''
                      } ${
                        analyzeDropActive
                          ? 'scale-[1.005] border-violet-500 bg-violet-50/80 dark:bg-violet-900/30 shadow-inner'
                          : 'border-violet-300/70 dark:border-violet-700/50 bg-gradient-to-b from-violet-50/40 via-white to-white dark:from-violet-950/30 dark:via-stone-900/70 dark:to-stone-900/70 hover:border-violet-400 hover:from-violet-50/80 hover:to-white dark:hover:from-violet-950/40'
                      }`}
                    >
                      <div className="px-6 py-10 sm:py-12 text-center">
                        {isParsingAnalyzeDoc ? (
                          <div className="flex flex-col items-center gap-4 py-4">
                            <span className="w-10 h-10 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
                            <span className="font-semibold text-stone-700 dark:text-stone-200">Parsing your document...</span>
                          </div>
                        ) : (
                          <>
                            <div className="relative mx-auto mb-5 w-16 h-16 sm:w-20 sm:h-20">
                              <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-rose-500 text-white flex items-center justify-center shadow-xl shadow-violet-600/35 group-hover:scale-105 group-hover:rotate-[-3deg] transition-all duration-300">
                                <svg className="w-9 h-9 sm:w-10 sm:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                              </div>
                            </div>
                            <p className="text-xl sm:text-2xl font-semibold text-stone-900 dark:text-stone-100" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
                              Drop your essay here
                            </p>
                            <p className="mt-1 text-sm sm:text-base text-stone-500 dark:text-stone-400">
                              or <span className="text-violet-700 dark:text-violet-300 font-semibold underline-offset-4 group-hover:underline">click to browse</span>
                            </p>
                            <div className="mt-4 flex flex-wrap justify-center gap-2">
                              <span className="px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-[11px] font-semibold ring-1 ring-rose-200/70 dark:ring-rose-800/40">PDF</span>
                              <span className="px-2.5 py-1 rounded-full bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 text-[11px] font-semibold ring-1 ring-sky-200/70 dark:ring-sky-800/40">Word</span>
                              <span className="px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-[11px] font-semibold ring-1 ring-stone-200/70 dark:ring-stone-700/60">TXT</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <section
                      aria-labelledby="analyze-output-examples-heading"
                      className="rounded-2xl border border-stone-200/85 dark:border-stone-700/75 bg-white/75 dark:bg-stone-900/45 p-4 sm:p-6 ring-1 ring-stone-200/35 dark:ring-white/5 shadow-inner mt-6 sm:mt-7"
                    >
                      <h2
                        id="analyze-output-examples-heading"
                        className="text-center text-sm sm:text-base font-semibold text-stone-800 dark:text-stone-100"
                        style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
                      >
                        See what your analysis looks like
                      </h2>
                      <p className="mt-1 text-center text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 mx-auto px-2 sm:px-0 text-balance max-w-[min(100%,36rem)]">
                        Muted previews for your draft—not canned advice.
                      </p>

                      <div className="mt-4 flex flex-nowrap gap-3 lg:gap-4 justify-between overflow-x-auto pb-3 snap-x snap-mandatory [scrollbar-width:thin] max-w-5xl mx-auto">
                        <figure className="snap-center shrink-0 w-[min(72vw,260px)] sm:w-[min(34vw,260px)] lg:w-0 lg:min-w-0 lg:flex-1 rounded-xl overflow-hidden bg-stone-950 border-2 border-violet-500 dark:border-violet-400 shadow-sm flex flex-col">
                          <div className="relative aspect-[16/11] w-full bg-black/80">
                            <video
                              className="absolute inset-0 h-full w-full object-cover object-center"
                              aria-label="Short preview of essay analysis and professor-style feedback"
                              title="Essay analyzer preview"
                              muted
                              loop
                              playsInline
                              autoPlay
                              preload="metadata"
                            >
                              <source src="/writescholar-essay-checker-demo.mp4" type="video/mp4" />
                            </video>
                          </div>
                          <figcaption className="px-2 py-1.5 text-center text-[10px] sm:text-[11px] font-semibold text-stone-600 dark:text-stone-400 border-t border-stone-200/70 dark:border-stone-700/70 bg-white/95 dark:bg-stone-900/95">
                            Quick walkthrough
                          </figcaption>
                        </figure>
                        <figure className="snap-center shrink-0 w-[min(72vw,260px)] sm:w-[min(34vw,260px)] lg:w-0 lg:min-w-0 lg:flex-1 rounded-xl overflow-hidden bg-stone-950 border-2 border-violet-500 dark:border-violet-400 shadow-sm flex flex-col">
                          <div className="relative aspect-[16/11] w-full bg-stone-900">
                            <img
                              src="/analyseimage1.png"
                              alt="Sample rubric and feedback overview from an analyzed essay"
                              className="absolute inset-0 h-full w-full object-cover object-top"
                              loading="lazy"
                              decoding="async"
                            />
                          </div>
                          <figcaption className="px-2 py-1.5 text-center text-[10px] sm:text-[11px] font-semibold text-stone-600 dark:text-stone-400 border-t border-stone-200/70 dark:border-stone-700/70 bg-white/95 dark:bg-stone-900/95">
                            Rubric & notes
                          </figcaption>
                        </figure>
                        <figure className="snap-center shrink-0 w-[min(72vw,260px)] sm:w-[min(34vw,260px)] lg:w-0 lg:min-w-0 lg:flex-1 rounded-xl overflow-hidden bg-stone-950 border-2 border-violet-500 dark:border-violet-400 shadow-sm flex flex-col">
                          <div className="relative aspect-[16/11] w-full bg-stone-900">
                            <img
                              src="/analyseimage2.png"
                              alt="Sample full written breakdown from an analyzed essay"
                              className="absolute inset-0 h-full w-full object-cover object-top"
                              loading="lazy"
                              decoding="async"
                            />
                          </div>
                          <figcaption className="px-2 py-1.5 text-center text-[10px] sm:text-[11px] font-semibold text-stone-600 dark:text-stone-400 border-t border-stone-200/70 dark:border-stone-700/70 bg-white/95 dark:bg-stone-900/95">
                            Full report
                          </figcaption>
                        </figure>
                      </div>
                    </section>

                    {analyzeUploadError && (
                      <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
                        {analyzeUploadError}
                      </div>
                    )}

                    {user && (
                      <p className="text-center text-xs text-stone-500 dark:text-stone-400">
                        <button type="button" onClick={() => onNavigate('upload')} className="font-semibold text-violet-700 dark:text-violet-400 hover:underline">
                          Library upload →
                        </button>
                      </p>
                    )}

                    <div className="my-2 flex items-center gap-4">
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-stone-200 to-transparent dark:via-stone-700" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400 dark:text-stone-500">Or paste below</span>
                      <div className="h-px flex-1 bg-gradient-to-l from-transparent via-stone-200 to-transparent dark:via-stone-700" />
                    </div>

                    <div className="relative max-w-4xl mx-auto">
                      <textarea
                        value={inputText}
                        onChange={(e) => {
                          setInputText(e.target.value);
                          setShowWordWarning(false);
                          if (user) setAnalyzeUploadError('');
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey && isTextValid()) {
                            e.preventDefault();
                            handleSubmit();
                          }
                        }}
                        placeholder={
                          user
                            ? 'Paste your essay here (minimum 200 words)...'
                            : placeholders[placeholderIndex]
                        }
                        className="w-full min-h-[180px] pb-10 rounded-2xl border border-stone-200/90 dark:border-stone-700 bg-stone-50/80 dark:bg-stone-800/40 p-5 text-[15px] leading-relaxed text-stone-800 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 resize-none focus:outline-none focus:ring-4 focus:ring-violet-500/15 focus:border-violet-400 dark:focus:border-violet-600 transition-all"
                        data-tutorial-target="essay-input-wrapper"
                        onInput={(e) => {
                          const target = e.target as HTMLTextAreaElement;
                          target.style.height = 'auto';
                          target.style.height = `${Math.min(target.scrollHeight, 280)}px`;
                        }}
                      />
                      <div className="absolute bottom-4 left-5 text-xs">
                        <span className={isTextValid() ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-stone-400 dark:text-stone-500'}>
                          {getWordCount(inputText)} words
                        </span>
                        {getWordCount(inputText) > 0 && getWordCount(inputText) < 200 && (
                          <span className="text-amber-600 dark:text-amber-400"> · {200 - getWordCount(inputText)} more needed</span>
                        )}
                      </div>
                      {showWordWarning && (
                        <div className="absolute -bottom-6 left-0 right-0 text-center">
                          <span className="text-sm font-medium text-red-500">Minimum 200 words required for analysis</span>
                        </div>
                      )}
                    </div>

                    <div className="max-w-4xl mx-auto flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
                      <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start">
                        {(inputText.trim() || uploadedFileName) && (
                          <button
                            type="button"
                            onClick={() => {
                              setInputText('');
                              setUploadedFileName(null);
                              setAnalyzeUploadError('');
                            }}
                            className="text-xs font-medium text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
                          >
                            Clear
                          </button>
                        )}
                        {isTextValid() && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 ring-1 ring-emerald-200/70 dark:ring-emerald-800/50 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                            Ready to analyze
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        data-tutorial-target="essay-analyze-btn"
                        onClick={handleSubmit}
                        disabled={!isTextValid()}
                        className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm sm:text-base font-semibold transition-all ${
                          isTextValid()
                            ? 'bg-gradient-to-r from-violet-600 via-fuchsia-600 to-rose-500 text-white shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-fuchsia-500/35 hover:-translate-y-0.5 active:translate-y-0'
                            : 'cursor-not-allowed bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 ring-1 ring-stone-200/70 dark:ring-stone-700/60'
                        }`}
                      >
                        {isTextValid() ? (
                          <>
                            Analyze my essay <span aria-hidden>✨</span>
                          </>
                        ) : (
                          <>Analyze my essay</>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {!user && uploadedFileName && (
                  <div className="mt-6 flex justify-center">
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={!isTextValid()}
                      className={`inline-flex items-center justify-center gap-2 rounded-xl px-8 py-3.5 text-base font-semibold transition-all ${
                        isTextValid()
                          ? 'bg-gradient-to-r from-violet-600 via-fuchsia-600 to-rose-500 text-white shadow-lg shadow-violet-500/25'
                          : 'bg-stone-200 dark:bg-stone-700 text-stone-400 cursor-not-allowed'
                      }`}
                    >
                      Analyze my essay
                    </button>
                  </div>
                )}
              </div>
            </section>
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

            <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/40 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-200/60 dark:border-blue-800/50">
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
                className="w-full px-6 py-3.5 bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold rounded-2xl transition-all shadow-md shadow-blue-900/15 ring-1 ring-blue-900/10"
              >
                Create Account
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSignupPrompt(false);
                  onNavigate('login');
                }}
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
