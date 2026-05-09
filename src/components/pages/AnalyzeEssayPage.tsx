import { useState, useEffect, useRef } from 'react';
import Header from '../common/Header';
import { WriteScholarEditorialBackgroundLayers } from '../common/WriteScholarEditorialBackground';
import Footer from '../common/Footer';
import AnalysisAnimation from '../common/AnalysisAnimation';
import { trackAction } from '../../data/achievements';
import { applyPageSeoTags, injectToolProductSchema, removeJsonLd } from '../../utils/seo';

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
    applyPageSeoTags({
      title: 'AI Essay Checker — Professor-Level Feedback in Seconds | WriteScholar',
      description: 'Paste your essay and get professor-style feedback with grade, rubric scores, line-by-line annotations, and a polished revision. Free first analysis, no credit card.',
    });
    injectToolProductSchema({
      name: 'AI Essay Checker',
      description: 'AI essay grader with professor-style feedback — overall grade, rubric breakdown (thesis, structure, evidence, style, mechanics), line-by-line annotations, and a polished revision.',
    });
    return () => removeJsonLd('tool-product');
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
    <div className="min-h-screen relative transition-colors font-sans overflow-x-hidden" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
      <WriteScholarEditorialBackgroundLayers position="fixed" />

      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="analyze" />

      <main className="relative max-w-[1360px] mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-6 pb-24 sm:pb-16 w-full min-w-0 overflow-x-hidden">
        <div className="w-full min-w-0">
          <div className="pt-1 sm:pt-2 pb-3 sm:pb-5 overflow-visible">
            <section
              data-tutorial="analyze-ready"
              className="relative rounded-3xl overflow-hidden mb-6 sm:mb-8 max-w-6xl mx-auto scroll-mt-8 bg-white dark:bg-stone-900 border-2 border-b-4 border-stone-200 dark:border-stone-700 rounded-2xl"
            >
              <div className="absolute inset-x-0 top-0 h-1.5 bg-[#58CC02]" aria-hidden />

              <div className="relative p-6 sm:p-8 lg:p-10">
                <input
                  ref={analyzeFileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                  onChange={handleAnalyzeFileChange}
                  className="hidden"
                  aria-hidden
                />

                {/* Mascot reading a paper — top-left, top-right of the analyze
                    hero. Thematic match: paper = essay, laptop = working on it. */}
                <img
                  src="/mascot-paper.webp"
                  alt=""
                  aria-hidden
                  loading="lazy"
                  decoding="async"
                  className="hidden sm:block pointer-events-none absolute top-3 left-3 sm:top-4 sm:left-4 w-24 sm:w-28 lg:w-32 h-auto z-10 drop-shadow-[0_12px_22px_rgba(88,204,2,0.25)]"
                />
                <img
                  src="/mascot-laptop.webp"
                  alt=""
                  aria-hidden
                  loading="lazy"
                  decoding="async"
                  className="hidden sm:block pointer-events-none absolute top-3 right-3 sm:top-4 sm:right-4 w-24 sm:w-28 lg:w-32 h-auto z-10 drop-shadow-[0_12px_22px_rgba(88,204,2,0.25)]"
                />

                <div className="text-center mb-5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F3EAFF] dark:bg-[#A560E8]/20 text-[#A560E8] dark:text-[#A560E8] border-2 border-[#A560E8]/20 text-xs font-extrabold">
                    <span aria-hidden>✨</span>
                    Professor-style feedback in seconds
                  </span>
                </div>

                <h1
                  className="relative text-center text-2xl sm:text-3xl lg:text-[2.4rem] font-extrabold leading-[1.1] tracking-tight text-stone-900 dark:text-stone-50 mb-3"
                >
                  Get{' '}
                  <span className="text-[#A560E8]">
                    professor-style feedback
                  </span>{' '}
                  on your essay
                </h1>
                <p className="text-center text-sm sm:text-base text-stone-500 dark:text-stone-400 max-w-2xl mx-auto leading-relaxed mb-6">
                  Drop in your paper and see what to improve — structure, arguments, clarity, citations, and more.
                </p>

                <div className="relative flex rounded-2xl bg-stone-100 dark:bg-stone-800 p-1 mb-6 max-w-lg mx-auto border-2 border-stone-200 dark:border-stone-700">
                  <button
                    type="button"
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[0.65rem] font-extrabold text-sm transition-all duration-200 bg-white dark:bg-stone-900 text-[#1CB0F6] dark:text-[#1CB0F6] border-2 border-b-4 border-[#1CB0F6]/30 dark:border-[#1899D6]/40"
                  >
                    <span className="text-base" aria-hidden>
                      📝
                    </span>
                    Analyze Text
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('citations')}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[0.65rem] font-extrabold text-sm transition-all duration-200 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-white/80 dark:hover:bg-stone-800/50"
                  >
                    <span className="text-base" aria-hidden>
                      📚
                    </span>
                    Citations
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('study-pack')}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[0.65rem] font-extrabold text-sm transition-all duration-200 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-white/80 dark:hover:bg-stone-800/50"
                  >
                    <span className="text-base" aria-hidden>
                      📦
                    </span>
                    Study Pack
                  </button>
                </div>

                {!user && uploadedFileName && (
                  <div className="relative mb-6 rounded-xl border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-4 py-3 flex flex-col sm:flex-row items-center justify-center gap-3 text-sm">
                    <p className="text-stone-700 dark:text-stone-200 font-medium">
                      <span className="text-stone-500 dark:text-stone-400 font-normal">Selected:</span> {uploadedFileName}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => analyzeFileInputRef.current?.click()}
                        className="text-[#1CB0F6] dark:text-[#1CB0F6] font-extrabold hover:underline"
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
                          ? 'scale-[1.005] border-[#1CB0F6] bg-[#DDF4FF] dark:bg-[#1CB0F6]/10'
                          : 'border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-800/40 hover:border-[#1CB0F6]'
                      }`}
                    >
                      <div className="px-6 py-10 sm:py-12 text-center">
                        {isParsingAnalyzeDoc ? (
                          <div className="flex flex-col items-center gap-4 py-4">
                            <span className="w-10 h-10 border-2 border-[#1CB0F6] border-t-transparent rounded-full animate-spin" />
                            <span className="font-semibold text-stone-700 dark:text-stone-200">Parsing your document...</span>
                          </div>
                        ) : (
                          <>
                            <div className="relative mx-auto mb-5 w-16 h-16 sm:w-20 sm:h-20">
                              <div className="relative w-full h-full rounded-2xl bg-[#1CB0F6] border-2 border-b-4 border-[#1899D6] text-white flex items-center justify-center group-hover:scale-105 group-hover:rotate-[-3deg] transition-all duration-300">
                                <svg className="w-9 h-9 sm:w-10 sm:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                              </div>
                            </div>
                            <p className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-stone-100">
                              Drop your essay here
                            </p>
                            <p className="mt-1 text-sm sm:text-base text-stone-500 dark:text-stone-400">
                              or <span className="text-[#1CB0F6] dark:text-[#1CB0F6] font-extrabold underline-offset-4 group-hover:underline">click to browse</span>
                            </p>
                            <div className="mt-4 flex flex-wrap justify-center gap-2">
                              <span className="px-2.5 py-1 rounded-lg bg-[#FFE8E8] dark:bg-[#FF4B4B]/15 text-[#FF4B4B] text-[11px] font-extrabold border-2 border-[#FF4B4B]/20">PDF</span>
                              <span className="px-2.5 py-1 rounded-lg bg-[#DDF4FF] dark:bg-[#1CB0F6]/15 text-[#1CB0F6] text-[11px] font-extrabold border-2 border-[#1CB0F6]/20">Word</span>
                              <span className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-[11px] font-extrabold border-2 border-stone-200 dark:border-stone-700">TXT</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <section
                      aria-labelledby="analyze-output-examples-heading"
                      className="rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-4 sm:p-6 mt-6 sm:mt-7"
                    >
                      <h2
                        id="analyze-output-examples-heading"
                        className="text-center text-sm sm:text-base font-extrabold text-stone-800 dark:text-stone-100"
                      >
                        See what your analysis looks like
                      </h2>
                      <p className="mt-1 text-center text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 mx-auto px-2 sm:px-0 text-balance max-w-[min(100%,36rem)]">
                        Muted previews for your draft—not canned advice.
                      </p>

                      <div className="mt-4 flex flex-nowrap gap-3 lg:gap-4 justify-between overflow-x-auto pb-3 snap-x snap-mandatory [scrollbar-width:thin] max-w-5xl mx-auto">
                        <figure className="snap-center shrink-0 w-[min(72vw,260px)] sm:w-[min(34vw,260px)] lg:w-0 lg:min-w-0 lg:flex-1 rounded-xl overflow-hidden bg-stone-950 border-2 border-[#1CB0F6] dark:border-[#1899D6] shadow-sm flex flex-col">
                          <div className="relative aspect-[16/11] w-full bg-black/80">
                            <video
                              className="absolute inset-0 h-full w-full object-cover object-center"
                              aria-label="Quick walkthrough of essay analysis"
                              title="Essay analyzer walkthrough"
                              muted
                              loop
                              playsInline
                              autoPlay
                              preload="metadata"
                            >
                              <source src="/quick-walkthrough.mp4" type="video/mp4" />
                            </video>
                          </div>
                          <figcaption className="px-2 py-1.5 text-center text-[10px] sm:text-[11px] font-semibold text-stone-600 dark:text-stone-400 border-t border-stone-200/70 dark:border-stone-700/70 bg-white/95 dark:bg-stone-900/95">
                            Quick walkthrough
                          </figcaption>
                        </figure>
                        <figure className="snap-center shrink-0 w-[min(72vw,260px)] sm:w-[min(34vw,260px)] lg:w-0 lg:min-w-0 lg:flex-1 rounded-xl overflow-hidden bg-stone-950 border-2 border-[#1CB0F6] dark:border-[#1899D6] shadow-sm flex flex-col">
                          <div className="relative aspect-[16/11] w-full bg-stone-900">
                            <img
                              src="/rubric-and-notes.png"
                              alt="Sample rubric and feedback notes from an analyzed essay"
                              className="absolute inset-0 h-full w-full object-cover object-top"
                              loading="lazy"
                              decoding="async"
                            />
                          </div>
                          <figcaption className="px-2 py-1.5 text-center text-[10px] sm:text-[11px] font-semibold text-stone-600 dark:text-stone-400 border-t border-stone-200/70 dark:border-stone-700/70 bg-white/95 dark:bg-stone-900/95">
                            Rubric & notes
                          </figcaption>
                        </figure>
                        <figure className="snap-center shrink-0 w-[min(72vw,260px)] sm:w-[min(34vw,260px)] lg:w-0 lg:min-w-0 lg:flex-1 rounded-xl overflow-hidden bg-stone-950 border-2 border-[#1CB0F6] dark:border-[#1899D6] shadow-sm flex flex-col">
                          <div className="relative aspect-[16/11] w-full bg-stone-900">
                            <img
                              src="/full-report.png"
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
                      <div className="p-3 rounded-xl bg-[#FFE8E8] dark:bg-[#FF4B4B]/10 border-2 border-[#FF4B4B]/30 dark:border-[#E04343]/40 text-[#FF4B4B] dark:text-[#FF4B4B] text-sm font-extrabold">
                        {analyzeUploadError}
                      </div>
                    )}

                    {user && (
                      <p className="text-center text-xs text-stone-500 dark:text-stone-400">
                        <button type="button" onClick={() => onNavigate('upload')} className="font-extrabold text-[#1CB0F6] dark:text-[#1CB0F6] hover:underline">
                          Library upload →
                        </button>
                      </p>
                    )}

                    <div className="my-2 flex items-center gap-4">
                      <div className="h-px flex-1 bg-stone-200 dark:bg-stone-700" />
                      <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-stone-400 dark:text-stone-500">Or paste below</span>
                      <div className="h-px flex-1 bg-stone-200 dark:bg-stone-700" />
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
                        className="w-full min-h-[180px] pb-10 rounded-2xl border-2 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800/40 p-5 text-[15px] leading-relaxed text-stone-800 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 resize-none focus:outline-none focus:ring-2 focus:ring-[#1CB0F6]/20 focus:border-[#1CB0F6] dark:focus:border-[#1CB0F6] transition-all"
                        data-tutorial-target="essay-input-wrapper"
                        onInput={(e) => {
                          const target = e.target as HTMLTextAreaElement;
                          target.style.height = 'auto';
                          target.style.height = `${Math.min(target.scrollHeight, 280)}px`;
                        }}
                      />
                      <div className="absolute bottom-4 left-5 text-xs">
                        <span className={isTextValid() ? 'text-[#58CC02] font-extrabold' : 'text-stone-400 dark:text-stone-500'}>
                          {getWordCount(inputText)} words
                        </span>
                        {getWordCount(inputText) > 0 && getWordCount(inputText) < 200 && (
                          <span className="text-[#FF9600] dark:text-[#FF9600] font-extrabold"> · {200 - getWordCount(inputText)} more needed</span>
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
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EAFFD6] dark:bg-[#58CC02]/15 border-2 border-[#58CC02]/30 text-[11px] font-extrabold text-[#58CC02]">
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
                        className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm sm:text-base font-extrabold uppercase tracking-wide transition-all ${
                          isTextValid()
                            ? 'bg-[#58CC02] text-white border-2 border-b-4 border-[#46A302] active:border-b-2 active:translate-y-0.5'
                            : 'cursor-not-allowed bg-stone-200 dark:bg-stone-800 text-stone-400 dark:text-stone-500 border-2 border-b-4 border-stone-300 dark:border-stone-700'
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
                      className={`inline-flex items-center justify-center gap-2 rounded-xl px-8 py-3.5 text-base font-extrabold uppercase tracking-wide transition-all ${
                        isTextValid()
                          ? 'bg-[#58CC02] text-white border-2 border-b-4 border-[#46A302] active:border-b-2 active:translate-y-0.5'
                          : 'bg-stone-200 dark:bg-stone-700 text-stone-400 cursor-not-allowed border-2 border-b-4 border-stone-300 dark:border-stone-700'
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
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-[#58CC02] border-4 border-[#46A302] mb-6 animate-in zoom-in duration-300" style={{ animationDelay: '100ms' }}>
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-white drop-shadow-lg animate-in slide-in-from-bottom-4 fade-in duration-500" style={{ animationDelay: '200ms' }}>
              We found several concerns and areas to improve in your paper.
            </p>
          </div>
        </div>
      )}

      {showSignupPrompt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-800 rounded-3xl border-2 border-b-4 border-stone-200 dark:border-stone-700 max-w-md w-full p-8 text-center relative animate-in zoom-in-95 fade-in duration-300">
            <button
              type="button"
              onClick={() => setShowSignupPrompt(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="w-20 h-20 bg-[#DDF4FF] dark:bg-[#1CB0F6]/15 rounded-2xl flex items-center justify-center mx-auto mb-6 border-2 border-b-4 border-[#1CB0F6]/30 dark:border-[#1899D6]/30">
              <span className="text-4xl">📋</span>
            </div>

            <h3 className="text-2xl font-extrabold text-stone-800 dark:text-stone-100 mb-3">See Your Full Report</h3>
            <p className="text-stone-600 dark:text-stone-400 mb-6">
              Sign in or create an account to see the full analysis with detailed feedback and suggestions.
            </p>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => onNavigate('signup')}
                className="w-full px-6 py-3.5 bg-[#FF9600] text-white font-extrabold uppercase tracking-wide rounded-xl border-2 border-b-4 border-[#D97F00] active:border-b-2 active:translate-y-0.5 transition-all"
              >
                Create Account
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSignupPrompt(false);
                  onNavigate('login');
                }}
                className="w-full px-6 py-3 text-[#1CB0F6] dark:text-[#1CB0F6] hover:text-[#1899D6] font-extrabold rounded-xl border-2 border-b-4 border-stone-200 dark:border-stone-700 active:border-b-2 active:translate-y-0.5 transition-all"
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
