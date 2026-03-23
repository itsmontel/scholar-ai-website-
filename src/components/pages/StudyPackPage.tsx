import { useState, useEffect, useRef } from 'react';
import Header from '../common/Header';
import { WriteScholarEditorialBackgroundLayers } from '../common/WriteScholarEditorialBackground';
import Footer from '../common/Footer';
import { FeatureTickRow } from '../common/FeatureTickRow';
import InteractiveStudyPackDemo from '../landing/InteractiveStudyPackDemo';
import { trackStudyPackGenerated, getStats } from '../../data/achievements';
import { trackEvent } from '../../utils/analytics';
import { applyPageSeoTags, absoluteCanonicalUrl, injectJsonLd, removeJsonLd } from '../../utils/seo';
import { ogImageUrlForPage } from '../../utils/ogImageUrls';
import { getResetsInText } from '../../utils/usageReset';

const STUDY_PACK_PAGE_SEO = {
  title: 'AI Study Pack — Lesson, Flashcards, Quiz, Crossword & More | WriteScholar',
  description:
    'Turn notes into a lesson, flashcards, quiz, crossword, and Crater Blast from one paste. Same study pack flow as the dashboard.',
};

type NavigateFn = (
  page: string,
  slug?: string,
  options?: { studyPack?: { data: unknown; title?: string } }
) => void;

interface StudyPackPageProps {
  onNavigate: NavigateFn;
  user?: { plan?: string; subscription_plan?: string } | null;
  onLogout: () => void;
}

const getWordCount = (text: string) =>
  text.trim().split(/\s+/).filter((word) => word.length > 0).length;

const StudyPackPage = ({ onNavigate, user, onLogout }: StudyPackPageProps) => {
  const [inputText, setInputText] = useState(() => {
    try {
      return sessionStorage.getItem('writescholar_dashboard_draft') || '';
    } catch {
      return '';
    }
  });
  const [isGeneratingStudyPack, setIsGeneratingStudyPack] = useState(false);
  const [studyPackError, setStudyPackError] = useState('');
  const [isParsingStudyDoc, setIsParsingStudyDoc] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);
  const [hasDoneStudyPack, setHasDoneStudyPack] = useState(true);
  const [historyChecked, setHistoryChecked] = useState(false);
  const studyToolsFileInputRef = useRef<HTMLInputElement>(null);

  const [quizUsage, setQuizUsage] = useState({
    generationsUsed: 0,
    generationLimit: 2,
    generationsRemaining: 2,
    maxWordsPerGeneration: 5000,
    wordsUsed: 0,
    wordLimit: 15000,
    plan: 'free',
    daysUntilReset: undefined as number | undefined,
  });

  const [usageStats, setUsageStats] = useState({
    plan: 'free' as string,
    daysUntilReset: 30 as number,
  });

  useEffect(() => {
    const canonicalUrl = absoluteCanonicalUrl('/tools/study-pack');
    applyPageSeoTags({
      title: STUDY_PACK_PAGE_SEO.title,
      description: STUDY_PACK_PAGE_SEO.description,
      canonicalUrl,
      ogImage: ogImageUrlForPage('study-pack'),
      ogImageAlt: 'AI Study Pack — lesson, flashcards, quiz, crossword from your notes | WriteScholar',
    });
    injectJsonLd('study-pack-page', {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: STUDY_PACK_PAGE_SEO.title.replace(/\s*\|\s*WriteScholar\s*$/, ''),
      description: STUDY_PACK_PAGE_SEO.description,
      url: canonicalUrl,
      isPartOf: { '@type': 'WebSite', name: 'WriteScholar', url: 'https://writescholar.com/' },
    });
    return () => removeJsonLd('study-pack-page');
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setLoadingStats(false);
      setHistoryChecked(true);
      return;
    }

    let cancelled = false;
    setLoadingStats(true);

    const load = async () => {
      try {
        const [usageRes, packRes, histRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/subscriptions/usage`, {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          }),
          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/study-pack-usage`, {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          }),
          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/quiz-history`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!cancelled && usageRes.ok) {
          const u = await usageRes.json();
          setUsageStats({
            plan: u.plan || 'free',
            daysUntilReset: u.daysUntilReset ?? 30,
          });
        }

        if (!cancelled && packRes.ok) {
          const data = await packRes.json();
          if (data.success && data.data) {
            setQuizUsage({
              generationsUsed: data.data.generationsUsed || 0,
              generationLimit: data.data.generationLimit ?? 2,
              generationsRemaining: data.data.generationsRemaining ?? 2,
              maxWordsPerGeneration: data.data.maxWordsPerGeneration || 5000,
              wordsUsed: 0,
              wordLimit: 999999,
              plan: data.data.plan || 'free',
              daysUntilReset: data.data.daysUntilReset,
            });
          }
        }

        if (!cancelled && histRes.ok) {
          const qh = await histRes.json();
          const tools = qh.data || [];
          const anyPack = tools.some((t: { quiz_type?: string }) => t.quiz_type === 'study_pack');
          setHasDoneStudyPack(anyPack);
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) {
          setLoadingStats(false);
          setHistoryChecked(true);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const isFreeUser = usageStats.plan === 'free';
  const quizExhausted = isFreeUser && quizUsage.generationLimit !== -1 && quizUsage.generationsRemaining <= 0;
  const showFirstStudyPackPrompt = Boolean(user) && historyChecked && !hasDoneStudyPack;

  const handleStudyToolsFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const token = localStorage.getItem('authToken');
    if (!token) {
      onNavigate('signup');
      return;
    }
    setIsParsingStudyDoc(true);
    setStudyPackError('');
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
      try {
        sessionStorage.setItem('writescholar_dashboard_draft', data.data.content || '');
      } catch {
        /* ignore */
      }
    } catch (err: unknown) {
      setStudyPackError(err instanceof Error ? err.message : 'Failed to parse document');
    } finally {
      setIsParsingStudyDoc(false);
    }
  };

  const handleGenerateStudyPack = async () => {
    if (!user) {
      onNavigate('signup');
      return;
    }
    const token = localStorage.getItem('authToken');
    if (!token) {
      onNavigate('login');
      return;
    }
    if (quizExhausted) {
      setStudyPackError("You've used all study pack generations this period. Upgrade for more.");
      return;
    }
    const wordCount = getWordCount(inputText);
    if (wordCount < 50) {
      setStudyPackError('Please enter at least 50 words to generate a study pack.');
      return;
    }
    setIsGeneratingStudyPack(true);
    setStudyPackError('');
    try {
      sessionStorage.setItem('writescholar_dashboard_draft', inputText);
    } catch {
      /* ignore */
    }
    import('./StudyPackViewerPage').catch(() => {});
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/generate-study-pack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: inputText }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Study pack generation failed');

      const wasFirst = (getStats().study_packs_count || 0) === 0;
      if (wasFirst) trackEvent('first_study_pack');
      const packTitle =
        data.data?.quiz?.title || data.data?.flashcards?.title || data.data?.lesson?.title || 'Study Pack';
      try {
        sessionStorage.setItem('writescholar_study_pack_viewer', JSON.stringify({ data: data.data, title: packTitle }));
      } catch {
        /* ignore */
      }
      try {
        sessionStorage.removeItem('writescholar_dashboard_draft');
      } catch {
        /* ignore */
      }
      onNavigate('study-pack-viewer', undefined, { studyPack: { data: data.data, title: packTitle } });
      trackStudyPackGenerated(wordCount);
    } catch (error: unknown) {
      setStudyPackError(error instanceof Error ? error.message : 'Study pack generation failed. Please try again.');
      try {
        sessionStorage.setItem('writescholar_dashboard_draft', inputText);
      } catch {
        /* ignore */
      }
    } finally {
      setIsGeneratingStudyPack(false);
    }
  };

  return (
    <div className="min-h-screen relative transition-colors font-sans overflow-x-hidden">
      <WriteScholarEditorialBackgroundLayers position="fixed" />

      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="study-pack" />

      <main className="relative max-w-[1240px] mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-6 pb-24 sm:pb-16 w-full min-w-0 overflow-x-hidden">
        <input
          ref={studyToolsFileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          onChange={handleStudyToolsFileUpload}
          className="hidden"
        />

        {quizExhausted && (
          <div className="mb-4 sm:mb-6 bg-amber-600 dark:bg-gradient-to-r dark:from-amber-600 dark:to-orange-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white text-center shadow-lg shadow-amber-500/25">
            <span className="text-3xl sm:text-4xl mb-2 sm:mb-3 block">🔒</span>
            <h3 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2">Monthly Limit Reached</h3>
            <p className="text-amber-100 dark:text-amber-100/90 mb-1 text-sm sm:text-base">
              You&apos;ve used all {quizUsage.generationLimit} study pack generations this period. Upgrade for more!
            </p>
            <p className="text-amber-200/90 text-xs sm:text-sm mb-3 sm:mb-4">
              {getResetsInText(usageStats.daysUntilReset ?? quizUsage.daysUntilReset)}
            </p>
            <button
              type="button"
              onClick={() => onNavigate('pricing')}
              className="w-full sm:w-auto px-5 sm:px-6 py-2 sm:py-2.5 bg-white dark:bg-stone-800 text-amber-700 dark:text-amber-400 font-semibold rounded-xl active:bg-stone-50 sm:hover:bg-stone-50 dark:sm:hover:bg-stone-700 transition-all inline-flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              👑 Upgrade Now
            </button>
          </div>
        )}

        {!quizExhausted && user && (
          <div className="mb-4 sm:mb-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
            <div className="flex items-start sm:items-center gap-2 sm:gap-3">
              <span className="text-xl sm:text-2xl">🧠</span>
              <div className="min-w-0">
                {isFreeUser ? (
                  <>
                    <p className="text-amber-800 dark:text-amber-200 font-medium text-xs sm:text-sm">
                      Free: {quizUsage.generationsRemaining}/{quizUsage.generationLimit} study packs •{' '}
                      {(quizUsage.maxWordsPerGeneration || 5000).toLocaleString()} words max •{' '}
                      {getResetsInText(usageStats.daysUntilReset ?? quizUsage.daysUntilReset)}
                    </p>
                    <p className="text-amber-600 dark:text-amber-400 text-[10px] sm:text-xs mt-0.5 line-clamp-2">
                      Lesson, flashcards & quiz included • Crossword & Crater Blast unlock with Pro
                    </p>
                  </>
                ) : (
                  <p className="text-amber-800 dark:text-amber-200 font-medium text-xs sm:text-sm">
                    Pro: {quizUsage.generationsRemaining}/{quizUsage.generationLimit} study packs remaining
                  </p>
                )}
              </div>
            </div>
            {isFreeUser && (
              <button
                type="button"
                onClick={() => onNavigate('pricing')}
                className="w-full sm:w-auto px-3 sm:px-4 py-1.5 bg-amber-600 text-white text-xs font-semibold rounded-lg sm:rounded-xl active:bg-amber-700 sm:hover:bg-amber-500 transition-all flex-shrink-0"
              >
                Upgrade
              </button>
            )}
          </div>
        )}

        {studyPackError && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-center">
            <p className="text-red-700 dark:text-red-400 text-sm font-medium">{studyPackError}</p>
          </div>
        )}

        {loadingStats ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8 pt-2 sm:pt-4 pb-2 sm:pb-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="p-3 sm:p-4 rounded-2xl border border-stone-200/50 dark:border-stone-700/30 bg-stone-50 dark:bg-stone-800/50 animate-pulse"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-stone-200 dark:bg-stone-700 rounded-xl mb-2.5 sm:mb-3" />
                <div className="h-3.5 sm:h-4 bg-stone-200 dark:bg-stone-700 rounded-lg w-3/4 mb-1.5 sm:mb-2" />
                <div className="h-2.5 sm:h-3 bg-stone-100 dark:bg-stone-700/60 rounded-lg w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="pt-2 sm:pt-4 pb-4 sm:pb-6 overflow-visible" data-tutorial="study-pack-input">
            <div className="relative rounded-2xl overflow-hidden mb-4 sm:mb-8 border border-stone-200/90 dark:border-stone-700/80 bg-white/95 dark:bg-stone-900/60 shadow-md">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 opacity-90" aria-hidden />
              <div className="relative rounded-[inherit] p-4 sm:p-10">
                <div className="relative lg:grid lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)_minmax(0,220px)] xl:grid-cols-[minmax(0,248px)_minmax(0,1fr)_minmax(0,248px)] lg:gap-8 xl:gap-10 lg:items-stretch">
                  <div className="hidden lg:block relative self-end justify-self-start w-[236px] xl:w-[248px] pointer-events-auto -rotate-[11deg] origin-bottom-left drop-shadow-lg z-[5]" aria-label="Sample flashcard preview">
                    <p className="text-center mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-violet-800/95 dark:text-violet-300/95">
                        Flashcards
                      </span>
                      <span className="block text-[10px] text-stone-500 dark:text-stone-400 mt-0.5">Tap to flip</span>
                    </p>
                    <InteractiveStudyPackDemo variant="side-left" />
                  </div>
                  <div className="min-w-0 self-start">
                    <h1
                      className="relative text-2xl sm:text-3xl md:text-[2rem] lg:text-[2.125rem] font-semibold text-stone-900 dark:text-stone-50 text-center mb-1.5 sm:mb-2 tracking-tight leading-snug px-1"
                      style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
                    >
                      Turn your notes into <span className="text-orange-700 dark:text-orange-300">5 study tools</span>
                    </h1>
                    <p className="relative text-stone-600 dark:text-stone-300 text-sm sm:text-base text-center mb-6 sm:mb-8 max-w-xl mx-auto leading-relaxed">
                      Lesson, flashcards, quiz, crossword & Crater Blast — all from one paste
                    </p>
                    <FeatureTickRow variant="prominent" className="relative" items={['Lesson', 'Flashcards', 'Quiz', 'Crossword', 'Crater Blast']} />
                    <div className="relative flex rounded-xl bg-stone-100/90 dark:bg-stone-800/80 p-1 mb-2 sm:mb-3 max-w-lg mx-auto border border-stone-200/80 dark:border-stone-700/60">
                      <button
                        type="button"
                        onClick={() => onNavigate('analyze')}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"
                      >
                        <span className="text-lg">📝</span> Analyze Text
                      </button>
                      <button
                        type="button"
                        onClick={() => onNavigate('citations')}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"
                      >
                        <span className="text-lg">📚</span> Citations
                      </button>
                      <button
                        type="button"
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 bg-white dark:bg-stone-700 text-orange-800 dark:text-orange-200 shadow-sm ring-1 ring-stone-200/80 dark:ring-stone-600/80"
                      >
                        <span className="text-lg">📦</span> Study Pack
                      </button>
                    </div>
                    {!loadingStats && (
                      <div className="flex justify-center mb-4 sm:mb-5">
                        <button
                          type="button"
                          onClick={() => onNavigate('create-flashcards')}
                          data-tutorial="create-cards-card"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-stone-100 dark:bg-stone-700/50 hover:bg-stone-200 dark:hover:bg-stone-600/50 rounded-xl text-stone-700 dark:text-stone-200 text-xs sm:text-sm font-semibold transition-all"
                        >
                          <span className="text-base">🃏</span>
                          Create Cards from scratch
                        </button>
                      </div>
                    )}
                    {showFirstStudyPackPrompt && (
                      <div className="flex flex-col items-center gap-1 mb-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200/90 dark:border-stone-600 text-stone-700 dark:text-stone-200 text-sm font-medium shadow-sm">
                          Start your first study pack or upload file below
                        </span>
                        <svg className="w-6 h-6 text-orange-600 dark:text-orange-400 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="hidden lg:block relative self-end justify-self-end w-[236px] xl:w-[248px] pointer-events-auto rotate-[11deg] origin-bottom-right drop-shadow-lg z-[5]" aria-label="Sample quiz preview">
                    <p className="text-center mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-800/95 dark:text-emerald-300/95">Quiz</span>
                      <span className="block text-[10px] text-stone-500 dark:text-stone-400 mt-0.5">Check understanding</span>
                    </p>
                    <InteractiveStudyPackDemo variant="side-right" />
                  </div>
                </div>
                <div className="lg:hidden mt-8 sm:mt-10 mb-3 flex flex-row justify-between items-end gap-3 sm:gap-4 px-1">
                  <div className="w-[min(46%,220px)] shrink-0 -rotate-[8deg] origin-bottom-left drop-shadow-lg transition-transform hover:scale-[1.02]">
                    <InteractiveStudyPackDemo variant="side-left" />
                  </div>
                  <div className="w-[min(46%,220px)] shrink-0 rotate-[8deg] origin-bottom-right drop-shadow-lg transition-transform hover:scale-[1.02]">
                    <InteractiveStudyPackDemo variant="side-right" />
                  </div>
                </div>

                <div className="relative mb-2 max-w-3xl mx-auto">
                  <div className="relative rounded-2xl border border-stone-200/90 dark:border-stone-600 bg-white dark:bg-stone-900/40 shadow-sm focus-within:ring-2 focus-within:ring-orange-500/30 focus-within:border-orange-300/50 dark:focus-within:border-orange-600/50 transition-shadow">
                    <div className="relative rounded-[inherit] min-h-[140px] sm:min-h-[180px]">
                      <textarea
                        value={inputText}
                        onChange={(e) => {
                          const v = e.target.value;
                          setInputText(v);
                          try {
                            sessionStorage.setItem('writescholar_dashboard_draft', v);
                          } catch {
                            /* ignore */
                          }
                        }}
                        placeholder="Paste your study notes, textbook chapter, article, or any learning material here... (minimum 50 words)"
                        className="relative w-full min-h-[140px] sm:min-h-[180px] p-5 sm:p-6 text-stone-800 dark:text-stone-100 text-[15px] sm:text-lg bg-transparent border-none outline-none resize-none placeholder-stone-400 dark:placeholder-stone-500 leading-[1.65]"
                        disabled={isGeneratingStudyPack}
                      />
                      <div className="absolute bottom-4 left-5 text-sm text-stone-400 dark:text-stone-500 font-medium">
                        {getWordCount(inputText).toLocaleString()} words
                        {getWordCount(inputText) > 0 && getWordCount(inputText) < 50 && (
                          <span className="text-amber-500"> (min 50)</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mt-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => studyToolsFileInputRef.current?.click()}
                        disabled={isParsingStudyDoc || isGeneratingStudyPack}
                        className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 border ${
                          showFirstStudyPackPrompt
                            ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-900 dark:text-orange-200 border-orange-300/80 dark:border-orange-700/60 shadow-md ring-2 ring-orange-400/25'
                            : 'bg-stone-50 dark:bg-stone-800/60 text-stone-800 dark:text-stone-200 border-stone-200/90 dark:border-stone-600 hover:bg-stone-100 dark:hover:bg-stone-700/60 shadow-sm'
                        }`}
                      >
                        {isParsingStudyDoc ? (
                          <span className="w-5 h-5 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        )}
                        {isParsingStudyDoc ? 'Uploading...' : 'Upload file'}
                      </button>
                      {inputText.trim() && (
                        <button
                          type="button"
                          onClick={() => {
                            setInputText('');
                            try {
                              sessionStorage.removeItem('writescholar_dashboard_draft');
                            } catch {
                              /* ignore */
                            }
                          }}
                          className="px-3 py-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-700/50 text-xs font-medium transition-colors"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleGenerateStudyPack}
                      disabled={isGeneratingStudyPack || quizExhausted || getWordCount(inputText) < 50}
                      className="px-8 sm:px-10 py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 font-semibold text-base bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 disabled:bg-stone-400 dark:disabled:bg-stone-600 text-white shadow-md shadow-orange-900/15 ring-1 ring-orange-900/10 hover:-translate-y-0.5 active:scale-[0.98] disabled:hover:translate-y-0 disabled:cursor-not-allowed"
                    >
                      {isGeneratingStudyPack ? (
                        <>
                          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Generating...
                        </>
                      ) : (
                        <>Generate Study Pack</>
                      )}
                    </button>
                  </div>
                </div>

                {isParsingStudyDoc && (
                  <div className="absolute inset-0 rounded-2xl bg-white/95 dark:bg-stone-900/90 backdrop-blur-sm flex items-center justify-center gap-3 z-20 pointer-events-auto" aria-live="polite" aria-busy="true">
                    <span className="w-8 h-8 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
                    <span className="font-semibold text-stone-700 dark:text-stone-200">Uploading...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default StudyPackPage;
