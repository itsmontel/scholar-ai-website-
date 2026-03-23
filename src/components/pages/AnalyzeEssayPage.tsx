import { useState, useEffect, useRef } from 'react';
import Header from '../common/Header';
import { WriteScholarEditorialBackgroundLayers } from '../common/WriteScholarEditorialBackground';
import Footer from '../common/Footer';
import AnalysisAnimation from '../common/AnalysisAnimation';
import { FeatureTickRow } from '../common/FeatureTickRow';
import InteractiveDocumentAnalysis from '../landing/InteractiveDocumentAnalysis';
import HeroEssayPreviewCard from '../landing/HeroEssayPreviewCard';
import { DEMO_DASHBOARD_BEFORE_PAPER, DEMO_DASHBOARD_AFTER_PAPER } from '../../data/landingPageDemoAnalysis';
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

      <main className="relative max-w-[1240px] mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-6 pb-24 sm:pb-16 w-full min-w-0 overflow-x-hidden">
        <div className="w-full min-w-0 space-y-4 sm:space-y-6">
          <div className="pt-1 sm:pt-2 pb-3 sm:pb-5 overflow-visible">
            <div
              data-tutorial="analyze-ready"
              className="relative rounded-2xl sm:rounded-2xl overflow-hidden mb-3 sm:mb-4 border border-stone-200/90 dark:border-stone-700/90 bg-white/85 dark:bg-stone-900/55 shadow-[0_16px_50px_-16px_rgba(15,23,42,0.12)] dark:shadow-[0_16px_50px_-16px_rgba(0,0,0,0.45)] backdrop-blur-sm ring-1 ring-white/40 dark:ring-white/5 scroll-mt-8"
            >
              <div className="h-0.5 w-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500 opacity-75 dark:opacity-80" aria-hidden />
              <div className="relative rounded-b-2xl bg-white/95 dark:bg-stone-900/70 p-4 sm:p-8">
                <div
                  className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(91,33,182,0.04),transparent_55%)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-15%,rgba(109,40,217,0.08),transparent_55%)] pointer-events-none rounded-b-2xl"
                  aria-hidden
                />

                <div className="relative lg:grid lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)_minmax(0,220px)] xl:grid-cols-[minmax(0,248px)_minmax(0,1fr)_minmax(0,248px)] lg:gap-8 xl:gap-10 lg:items-start">
                  <div className="hidden lg:block relative self-start justify-self-start w-[236px] xl:w-[248px] pointer-events-auto -rotate-[15deg] origin-bottom-left drop-shadow-lg z-[5] lg:mt-5 xl:mt-6" aria-label="Sample before feedback">
                    <p className="text-center mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-800/95 dark:text-amber-300/95">Before</span>
                      <span className="block text-[10px] text-stone-500 dark:text-stone-400 mt-0.5">Draft · improve &amp; concern</span>
                    </p>
                    <div className="rounded-2xl border border-amber-200/70 dark:border-amber-900/35 bg-white/95 dark:bg-stone-900/60 p-2 ring-1 ring-amber-200/45 dark:ring-amber-900/30">
                      <HeroEssayPreviewCard
                        paper={DEMO_DASHBOARD_BEFORE_PAPER}
                        rotate="none"
                        variant="before"
                        legendPlacement="top"
                        maxExcerptChars={380}
                        paperMaxHeightClass="max-h-[272px]"
                      />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <h1
                      className="relative text-2xl sm:text-3xl md:text-[2rem] lg:text-[2.125rem] font-semibold text-stone-900 dark:text-stone-50 text-center mb-1.5 sm:mb-2 tracking-tight leading-snug px-1"
                      style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
                    >
                      <span className="text-emerald-700 dark:text-emerald-400">Paste</span> or <span className="text-blue-700 dark:text-blue-400">upload</span> your essay, get{' '}
                      <span className="text-violet-800 dark:text-violet-300">feedback</span> in seconds
                    </h1>
                    <p className="relative text-stone-600 dark:text-stone-300 text-sm sm:text-base text-center mb-2 sm:mb-2.5 max-w-xl mx-auto leading-relaxed">
                      Upload your essay, get <span className="text-red-600 dark:text-red-500">professor</span>
                      <span className="text-amber-600 dark:text-amber-500">-style</span> <span className="text-green-600 dark:text-green-500">feedback</span>
                    </p>
                    <FeatureTickRow className="relative mb-1 sm:mb-1.5" items={['Structure', 'Annotations', 'Rubric', 'Suggestions']} />
                    <div className="relative flex rounded-xl border border-stone-200/90 dark:border-stone-700 bg-stone-100/60 dark:bg-stone-800/50 p-1 mb-1 sm:mb-1.5 max-w-lg mx-auto shadow-sm">
                      <button
                        type="button"
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 bg-white dark:bg-stone-900 text-blue-800 dark:text-blue-300 shadow-sm border border-stone-200/80 dark:border-stone-600"
                      >
                        <span className="text-base" aria-hidden>
                          📝
                        </span>{' '}
                        Analyze
                      </button>
                      <button
                        type="button"
                        onClick={() => onNavigate('citations')}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"
                      >
                        <span className="text-base" aria-hidden>
                          📚
                        </span>{' '}
                        Citations
                      </button>
                      <button
                        type="button"
                        onClick={() => onNavigate('study-pack')}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"
                      >
                        <span className="text-base" aria-hidden>
                          📦
                        </span>{' '}
                        Study Pack
                      </button>
                    </div>
                  </div>
                  <div className="hidden lg:block relative self-start justify-self-end w-[236px] xl:w-[248px] pointer-events-auto rotate-[15deg] origin-bottom-right drop-shadow-lg z-[5] lg:mt-5 xl:mt-6" aria-label="Sample after feedback">
                    <p className="text-center mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-800/95 dark:text-emerald-300/95">After</span>
                      <span className="block text-[10px] text-stone-500 dark:text-stone-400 mt-0.5">Revised · mostly strong</span>
                    </p>
                    <div className="rounded-2xl border border-emerald-200/70 dark:border-emerald-900/35 bg-white/95 dark:bg-stone-900/60 p-2 ring-1 ring-emerald-200/45 dark:ring-emerald-900/30">
                      <HeroEssayPreviewCard
                        paper={DEMO_DASHBOARD_AFTER_PAPER}
                        rotate="none"
                        variant="after"
                        legendPlacement="top"
                        maxExcerptChars={380}
                        paperMaxHeightClass="max-h-[272px]"
                      />
                    </div>
                  </div>
                </div>

                <div className="relative w-full mb-2">
                  <div className="lg:hidden mb-4 sm:mb-5 mt-3 sm:mt-4" aria-label="Sample before and after essay feedback">
                    <div className="flex flex-row justify-between items-start gap-3 sm:gap-4">
                      <div className="w-[min(46%,220px)] shrink-0 -rotate-[11deg] origin-bottom-left drop-shadow-lg transition-transform hover:scale-[1.02]">
                        <p className="text-center mb-1.5">
                          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.12em] text-amber-800/95 dark:text-amber-300/95">Before</span>
                        </p>
                        <div className="rounded-xl border border-amber-200/70 dark:border-amber-900/35 bg-white/95 dark:bg-stone-900/60 p-1.5 sm:p-2 ring-1 ring-amber-200/45 dark:ring-amber-900/30">
                          <HeroEssayPreviewCard
                            paper={DEMO_DASHBOARD_BEFORE_PAPER}
                            rotate="none"
                            variant="before"
                            legendPlacement="top"
                            maxExcerptChars={240}
                            paperMaxHeightClass="max-h-[220px]"
                          />
                        </div>
                      </div>
                      <div className="w-[min(46%,220px)] shrink-0 rotate-[11deg] origin-bottom-right drop-shadow-lg transition-transform hover:scale-[1.02]">
                        <p className="text-center mb-1.5">
                          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-800/95 dark:text-emerald-300/95">After</span>
                        </p>
                        <div className="rounded-xl border border-emerald-200/70 dark:border-emerald-900/35 bg-white/95 dark:bg-stone-900/60 p-1.5 sm:p-2 ring-1 ring-emerald-200/45 dark:ring-emerald-900/30">
                          <HeroEssayPreviewCard
                            paper={DEMO_DASHBOARD_AFTER_PAPER}
                            rotate="none"
                            variant="after"
                            legendPlacement="top"
                            maxExcerptChars={240}
                            paperMaxHeightClass="max-h-[220px]"
                          />
                        </div>
                      </div>
                    </div>
                    <p className="text-center text-xs text-stone-500 dark:text-stone-400 mt-4 max-w-md mx-auto leading-relaxed">
                      Sample draft vs revised — hover highlights for detail.
                    </p>
                  </div>

                  <div className="min-w-0 relative z-20 w-full max-w-3xl mx-auto space-y-3 sm:space-y-4 -mt-16 sm:-mt-20 lg:-mt-32 xl:-mt-36">
                    <input
                      ref={analyzeFileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                      onChange={handleAnalyzeFileChange}
                      className="hidden"
                      aria-hidden
                    />

                    {!user && uploadedFileName && (
                      <div className="relative max-w-3xl mx-auto mb-4 rounded-xl border border-stone-200/90 dark:border-stone-600 bg-stone-50/90 dark:bg-stone-800/50 px-4 py-3 flex flex-col sm:flex-row items-center justify-center gap-3 text-sm">
                        <p className="text-stone-700 dark:text-stone-200 font-medium">
                          <span className="text-stone-500 dark:text-stone-400 font-normal">Selected:</span> {uploadedFileName}
                        </p>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => analyzeFileInputRef.current?.click()} className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                            Change file
                          </button>
                          <button type="button" onClick={() => setUploadedFileName(null)} className="text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 text-xs font-medium">
                            Remove
                          </button>
                        </div>
                      </div>
                    )}

                    {!(!user && uploadedFileName) && (
                      <>
                        <div className="relative rounded-2xl border transition-all duration-300 bg-white dark:bg-stone-900/40 border-blue-400/75 dark:border-blue-500/55 ring-2 ring-blue-500/18 shadow-sm shadow-blue-500/10 focus-within:border-blue-500 dark:focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/30 focus-within:shadow-md focus-within:shadow-blue-500/25">
                          <div className="relative rounded-[14px] sm:rounded-[20px] bg-white/98 dark:bg-stone-800/95 backdrop-blur-sm min-h-[140px] sm:min-h-[200px]">
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
                              placeholder={placeholders[placeholderIndex]}
                              className="relative w-full min-h-[140px] sm:min-h-[200px] max-h-[240px] overflow-y-auto p-5 sm:p-7 text-stone-800 dark:text-stone-100 text-[15px] sm:text-lg bg-transparent border-none outline-none resize-none placeholder-stone-400 dark:placeholder-stone-500 leading-[1.65]"
                              onInput={(e) => {
                                const target = e.target as HTMLTextAreaElement;
                                target.style.height = 'auto';
                                target.style.height = `${Math.min(target.scrollHeight, 240)}px`;
                              }}
                              data-tutorial-target="essay-input-wrapper"
                            />
                            <div className="absolute bottom-4 left-6 text-sm text-stone-400 dark:text-stone-500 font-medium">
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
                          <div className="px-1 text-center sm:text-left">
                            <p className="text-sm font-medium text-red-600 dark:text-red-400">{analyzeUploadError}</p>
                          </div>
                        )}
                        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 sm:gap-5">
                          <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start">
                            <button
                              type="button"
                              onClick={() => analyzeFileInputRef.current?.click()}
                              disabled={isParsingAnalyzeDoc}
                              className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all border shadow-md disabled:opacity-60 disabled:pointer-events-none disabled:hover:translate-y-0 bg-blue-600 dark:bg-blue-500 text-white border-blue-400/40 shadow-lg shadow-blue-600/25 ring-1 ring-blue-400/30 hover:bg-blue-500 dark:hover:bg-blue-400 hover:shadow-xl hover:shadow-blue-600/20 hover:-translate-y-0.5 active:translate-y-0"
                            >
                              {isParsingAnalyzeDoc ? (
                                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <svg className="w-5 h-5 shrink-0 opacity-95" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                              )}
                              {isParsingAnalyzeDoc ? 'Uploading...' : 'Upload file'}
                            </button>
                            {user && (
                              <button type="button" onClick={() => onNavigate('upload')} className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline px-1">
                                Library upload →
                              </button>
                            )}
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
                            data-tutorial-target="essay-analyze-btn"
                            onClick={handleSubmit}
                            disabled={!isTextValid()}
                            className={`px-8 sm:px-10 py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 font-semibold text-base shrink-0 ${
                              isTextValid()
                                ? 'bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white shadow-md shadow-blue-900/15 ring-1 ring-blue-900/10 hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer'
                                : 'bg-stone-200 dark:bg-stone-700 text-stone-400 cursor-not-allowed'
                            }`}
                          >
                            Analyze Text
                          </button>
                        </div>

                        <div
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              if (!isParsingAnalyzeDoc) analyzeFileInputRef.current?.click();
                            }
                          }}
                          onClick={() => {
                            if (!isParsingAnalyzeDoc) analyzeFileInputRef.current?.click();
                          }}
                          onDragEnter={handleAnalyzeDropZoneDrag}
                          onDragLeave={handleAnalyzeDropZoneDrag}
                          onDragOver={handleAnalyzeDropZoneDrag}
                          onDrop={handleAnalyzeDropZoneDrop}
                          className={`group/dz rounded-2xl border-2 border-dashed p-6 sm:p-8 text-center transition-all duration-300 select-none ${
                            isParsingAnalyzeDoc
                              ? 'border-stone-200 dark:border-stone-600 bg-stone-50/50 dark:bg-stone-800/30 opacity-70 cursor-wait'
                              : analyzeDropActive
                                ? 'border-blue-500 bg-blue-100/90 dark:bg-blue-950/45 shadow-lg shadow-blue-500/15 ring-2 ring-blue-400/40 cursor-pointer'
                                : 'border-blue-300/80 dark:border-blue-600/55 bg-blue-50/90 dark:bg-blue-950/25 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/35 hover:shadow-md hover:shadow-blue-500/10 cursor-pointer'
                          }`}
                          aria-label="Drop a document to load into the essay box, or click to browse"
                        >
                          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-7">
                            <div
                              className={`flex h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem] shrink-0 items-center justify-center rounded-2xl shadow-inner transition-transform duration-300 group-hover/dz:scale-105 bg-blue-600 text-white shadow-lg shadow-blue-600/35 ${
                                analyzeDropActive ? 'ring-2 ring-blue-300/80 dark:ring-blue-500/50' : ''
                              }`}
                              aria-hidden
                            >
                              <svg className="w-8 h-8 sm:w-9 sm:h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                            </div>
                            <div className="text-left sm:text-left min-w-0 max-w-md">
                              <p className="text-lg sm:text-xl font-bold tracking-tight text-blue-800 dark:text-blue-200">Drop your document here</p>
                              <p className="text-sm sm:text-[0.9375rem] text-stone-600 dark:text-stone-300 mt-2 leading-relaxed">
                                Or click to browse — <span className="font-semibold text-blue-700 dark:text-blue-400">PDF</span>,{' '}
                                <span className="font-semibold text-emerald-700 dark:text-emerald-400">Word</span>, or{' '}
                                <span className="font-semibold text-blue-700 dark:text-blue-400">TXT</span>. We&apos;ll load the text into the box above (same as Upload file).
                              </p>
                            </div>
                          </div>
                        </div>

                        {isParsingAnalyzeDoc && (
                          <div className="absolute inset-0 rounded-2xl bg-white/90 dark:bg-stone-900/90 backdrop-blur-sm flex items-center justify-center gap-3 z-30 pointer-events-auto" aria-live="polite" aria-busy="true">
                            <span className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            <span className="font-semibold text-stone-700 dark:text-stone-200">Uploading...</span>
                          </div>
                        )}
                      </>
                    )}

                    {!user && uploadedFileName && (
                      <div className="mt-4 flex justify-center">
                        <button
                          type="button"
                          onClick={handleSubmit}
                          disabled={!isTextValid()}
                          className={`px-8 py-3.5 rounded-xl font-semibold text-base ${
                            isTextValid() ? 'bg-blue-700 hover:bg-blue-800 text-white shadow-md shadow-blue-900/15 ring-1 ring-blue-900/10' : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                          }`}
                        >
                          Analyze Text
                        </button>
                      </div>
                    )}

                    <div className="mt-10 sm:mt-12 pt-8 sm:pt-10 border-t border-stone-200/80 dark:border-stone-700/60">
                      <div className="w-full max-w-6xl mx-auto px-0 sm:px-1">
                        <div className="flex items-center gap-2 mb-4">
                          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
                            See a real analysis in action
                          </h2>
                          <span className="h-px flex-1 max-w-32 bg-stone-300/80 dark:bg-stone-600/60 rounded-full" />
                        </div>
                        <div className="relative rounded-2xl sm:rounded-3xl border border-stone-200/70 dark:border-stone-700/60 bg-white/95 dark:bg-stone-900/80 shadow-[0_28px_72px_-28px_rgba(15,23,42,0.16)] dark:shadow-[0_36px_90px_-32px_rgba(0,0,0,0.55)]">
                          <InteractiveDocumentAnalysis onNavigate={onNavigate} landingHeroEmbed />
                        </div>
                      </div>
                    </div>
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
