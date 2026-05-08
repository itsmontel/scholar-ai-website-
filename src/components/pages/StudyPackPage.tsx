import { useState, useEffect, useRef } from 'react';
import Header from '../common/Header';
import { WriteScholarEditorialBackgroundLayers } from '../common/WriteScholarEditorialBackground';
import Footer from '../common/Footer';
import { trackStudyPackGenerated, getStats } from '../../data/achievements';
import { trackEvent } from '../../utils/analytics';
import { applyPageSeoTags, absoluteCanonicalUrl, injectJsonLd, removeJsonLd } from '../../utils/seo';
import { ogImageUrlForPage } from '../../utils/ogImageUrls';
import { getResetsInText } from '../../utils/usageReset';
import type { EmbeddedDashboardTool } from './CitationsPage';

const STUDY_PACK_PAGE_SEO = {
  title: 'AI Study Pack — Lesson, Flashcards, Quiz, Crossword & More | WriteScholar',
  description:
    'Turn notes into a lesson, flashcards, quiz, crossword, Crater Blast, and Word Tower from one paste. Same study pack flow as the dashboard.',
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
  embedded?: boolean;
  onEmbeddedToolSwitch?: (tool: EmbeddedDashboardTool) => void;
}

const getWordCount = (text: string) =>
  text.trim().split(/\s+/).filter((word) => word.length > 0).length;

/** Dashboard embedded row — one preview per study tool type (videos where we ship demos). */
const EMBEDDED_STUDY_PACK_PREVIEWS: {
  label: string;
  video?: { src: string; alt: string };
  /** Used only when no product video exists yet (e.g. Word Tower). */
  fallbackImage?: { src: string; alt: string };
}[] = [
  {
    label: 'Lesson',
    fallbackImage: {
      src: '/study-pack-previews/lesson-plan.png',
      alt: 'Preview of AI lesson plan layout from pasted study notes',
    },
  },
  {
    label: 'Flashcards',
    video: {
      src: '/writescholar-flashcards-demo.mp4',
      alt: 'Preview of flip flashcards generated from notes',
    },
  },
  {
    label: 'Quiz',
    video: {
      src: '/writescholar-quiz-generator-demo.mp4',
      alt: 'Preview of multiple-choice quiz from study notes',
    },
  },
  {
    label: 'Crossword',
    video: {
      src: '/writescholar-crossword-demo.mp4',
      alt: 'Preview of crossword puzzle from vocabulary',
    },
  },
  {
    label: 'Crater Blast',
    video: {
      src: '/writescholar-crater-blast-demo.mp4',
      alt: 'Preview of Crater Blast quiz game built from quiz content',
    },
  },
  {
    label: 'Word Tower',
    fallbackImage: {
      src: '/study-pack-previews/word-tower.png',
      alt: 'Word Tower stacking quiz game catching correct falling answers',
    },
  },
];

const StudyPackPage = ({ onNavigate, user, onLogout, embedded = false, onEmbeddedToolSwitch }: StudyPackPageProps) => {
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
    if (embedded) return;
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
  }, [embedded]);

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

  const goAnalyze = () =>
    embedded && onEmbeddedToolSwitch ? onEmbeddedToolSwitch('analyze') : onNavigate('analyze');
  const goCitations = () =>
    embedded && onEmbeddedToolSwitch ? onEmbeddedToolSwitch('citations') : onNavigate('citations');

  return (
    <div
      className={
        embedded
          ? 'relative w-full min-w-0'
          : 'min-h-screen relative transition-colors font-sans overflow-x-hidden'
      }
    >
      {!embedded && <WriteScholarEditorialBackgroundLayers position="fixed" />}

      {!embedded && <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="study-pack" />}

      <main
        className={
          embedded
            ? 'relative max-w-none mx-auto px-0 pt-0 pb-2 w-full min-w-0 overflow-x-hidden'
            : 'relative max-w-[1360px] mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-6 pb-24 sm:pb-16 w-full min-w-0 overflow-x-hidden'
        }
      >
        <input
          ref={studyToolsFileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          onChange={handleStudyToolsFileUpload}
          className="hidden"
        />

        {quizExhausted && (
          <div className="mb-4 sm:mb-6 bg-[#FF9600] border-2 border-b-4 border-[#D97F00] rounded-xl p-4 sm:p-6 text-white text-center">
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
              className="w-full sm:w-auto px-5 sm:px-6 py-2 sm:py-2.5 bg-white text-[#FF9600] font-extrabold rounded-xl border-2 border-b-4 border-stone-200 active:border-b-2 active:translate-y-0.5 transition-all inline-flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              👑 Upgrade Now
            </button>
          </div>
        )}

        {!quizExhausted && user && !embedded && (
          <div className="mb-4 sm:mb-6 bg-[#FFF4E0] dark:bg-[#FF9600]/10 border-2 border-b-4 border-[#FF9600]/30 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
            <div className="flex items-start sm:items-center gap-2 sm:gap-3">
              <span className="text-xl sm:text-2xl">🧠</span>
              <div className="min-w-0">
                {isFreeUser ? (
                  <>
                    <p className="text-[#FF9600] font-extrabold text-xs sm:text-sm">
                      Free: {quizUsage.generationsRemaining}/{quizUsage.generationLimit} study packs •{' '}
                      {(quizUsage.maxWordsPerGeneration || 5000).toLocaleString()} words max •{' '}
                      {getResetsInText(usageStats.daysUntilReset ?? quizUsage.daysUntilReset)}
                    </p>
                    <p className="text-amber-600 dark:text-amber-400 text-[10px] sm:text-xs mt-0.5 line-clamp-2">
                      Lesson, flashcards & quiz included • Crossword, Crater Blast & Word Tower unlock with Pro
                    </p>
                  </>
                ) : (
                  <p className="text-[#FF9600] font-extrabold text-xs sm:text-sm">
                    Pro: {quizUsage.generationsRemaining}/{quizUsage.generationLimit} study packs remaining
                  </p>
                )}
              </div>
            </div>
            {isFreeUser && (
              <button
                type="button"
                onClick={() => onNavigate('pricing')}
                className="w-full sm:w-auto px-3 sm:px-4 py-1.5 bg-[#FF9600] text-white text-xs font-extrabold rounded-xl border-2 border-b-4 border-[#D97F00] active:border-b-2 active:translate-y-0.5 transition-all flex-shrink-0"
              >
                Upgrade
              </button>
            )}
          </div>
        )}

        {studyPackError && (
          <div className="mb-4 p-4 bg-[#FFE8E8] dark:bg-[#FF4B4B]/10 border-2 border-[#FF4B4B]/30 rounded-2xl text-center">
            <p className="text-[#FF4B4B] text-sm font-bold">{studyPackError}</p>
          </div>
        )}

        {loadingStats ? (
          embedded ? (
            <div className="grid grid-cols-2 gap-3 mb-4">
              {Array.from({ length: 2 }).map((_, i) => (
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
            <div className="max-w-6xl mx-auto mb-8 sm:mb-10 animate-pulse">
              <div className="rounded-[1.75rem] border border-orange-200/40 dark:border-orange-900/30 bg-orange-50/30 dark:bg-stone-900/50 p-6 sm:p-10">
                <div className="h-10 bg-stone-200/70 dark:bg-stone-700/50 rounded-xl w-56 mx-auto mb-6" />
                <div className="h-[200px] sm:h-[248px] rounded-2xl bg-stone-200/60 dark:bg-stone-700/40 mb-4" />
                <div className="flex justify-between gap-3">
                  <div className="h-12 w-36 rounded-xl bg-stone-200/60 dark:bg-stone-700/40" />
                  <div className="h-12 flex-1 max-w-xs rounded-xl bg-stone-200/60 dark:bg-stone-700/40" />
                </div>
              </div>
            </div>
          )
        ) : (
          <div className={embedded ? 'pb-2 overflow-visible' : 'pt-2 sm:pt-4 pb-4 sm:pb-6 overflow-visible'} data-tutorial="study-pack-input">
            <div
              className={`relative overflow-hidden scroll-mt-8 ${
                embedded
                  ? 'rounded-2xl mb-3 sm:mb-4 bg-white dark:bg-stone-900 border-2 border-b-4 border-[#FF9600]/30 dark:border-[#FF9600]/40'
                  : 'rounded-2xl mb-6 sm:mb-10 max-w-6xl mx-auto bg-white dark:bg-stone-900 border-2 border-b-4 border-[#FF9600]/30 dark:border-[#FF9600]/40'
              }`}
              style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
            >
              {/* accent strip removed — 3D border provides accent */}
              {/* blur blobs removed — clean solid background */}
              <div className={`relative ${embedded ? 'p-4 sm:p-6 lg:p-8' : 'p-4 sm:p-8 lg:p-10'}`}>
                {/* Studying mascot — top left, always playing */}
                <img
                  src="/mascot-study.webp"
                  alt=""
                  aria-hidden
                  loading="lazy"
                  decoding="async"
                  className="hidden sm:block pointer-events-none absolute top-3 left-3 sm:top-4 sm:left-4 w-20 sm:w-24 lg:w-28 h-auto z-10 drop-shadow-[0_12px_22px_rgba(217,119,6,0.30)]"
                />
                {/* Dancing mascot — top right, always playing */}
                <img
                  src="/mascot-dance.webp"
                  alt=""
                  aria-hidden
                  loading="lazy"
                  decoding="async"
                  className="hidden sm:block pointer-events-none absolute top-3 right-3 sm:top-4 sm:right-4 w-20 sm:w-24 lg:w-28 h-auto z-10 drop-shadow-[0_12px_22px_rgba(217,119,6,0.30)]"
                />
                <div className="relative min-w-0">
                  <div className="text-center mb-3 sm:mb-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFF4E0] dark:bg-[#FF9600]/10 border-2 border-[#FF9600]/30 text-[#FF9600] text-[10px] sm:text-[11px] font-extrabold tracking-[0.12em] uppercase">
                      <svg className="w-3.5 h-3.5 opacity-90 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      Six tools, one paste
                    </span>
                  </div>
                  <div className="min-w-0 self-start">
                    <h1
                      className={`relative font-extrabold text-stone-900 dark:text-stone-50 text-center tracking-tight text-2xl sm:text-3xl lg:text-[2.4rem] leading-[1.1] px-1 ${embedded ? 'mb-2' : 'mb-1.5 sm:mb-2'}`}
                    >
                      Turn your notes into{' '}
                      <span className="text-[#FF9600]">
                        6 study tools
                      </span>
                    </h1>
                    <p className={`relative text-stone-500 dark:text-stone-400 text-sm sm:text-base text-center max-w-xl mx-auto leading-relaxed ${embedded ? 'mb-5' : 'mb-5 sm:mb-6'}`}>
                      Lesson, flashcards, quiz, crossword, Crater Blast & Word Tower — all from one paste
                    </p>
                    {!embedded && (
                      <>
                        <div className="relative flex gap-2 mb-2 sm:mb-4 max-w-lg mx-auto">
                          <button
                            type="button"
                            onClick={goAnalyze}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-extrabold text-sm transition-all duration-200 border-2 border-b-4 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 bg-white dark:bg-stone-800 active:border-b-2 active:translate-y-0.5"
                          >
                            <span className="text-lg">📝</span> Analyze Text
                          </button>
                          <button
                            type="button"
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-extrabold text-sm transition-all duration-200 bg-white dark:bg-stone-800 text-[#FF9600] border-2 border-b-4 border-[#FF9600]"
                          >
                            <span className="text-lg">📦</span> Study Pack
                          </button>
                          <button
                            type="button"
                            onClick={goCitations}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-extrabold text-sm transition-all duration-200 border-2 border-b-4 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 bg-white dark:bg-stone-800 active:border-b-2 active:translate-y-0.5"
                          >
                            <span className="text-lg">📚</span> Citations
                          </button>
                        </div>
                        {!loadingStats && (
                          <div className="flex justify-center mb-4 sm:mb-5">
                            <button
                              type="button"
                              onClick={() => onNavigate('create-flashcards')}
                              data-tutorial="create-cards-card"
                              className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-stone-800 border-2 border-b-4 border-stone-200 dark:border-stone-700 rounded-xl text-stone-700 dark:text-stone-200 text-xs sm:text-sm font-extrabold transition-all active:border-b-2 active:translate-y-0.5"
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
                      </>
                    )}
                  </div>
                </div>

                <div className={`relative mb-2 max-w-5xl mx-auto ${embedded ? 'mt-0' : 'mt-1'}`}>
                  <div
                    className="relative rounded-xl border-2 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 transition-all duration-300 focus-within:border-[#FF9600]"
                  >
                    <div className={`relative rounded-[inherit] ${embedded ? 'min-h-[156px] sm:min-h-[176px]' : 'min-h-[172px] sm:min-h-[220px]'}`}>
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
                        className={`relative w-full p-5 sm:p-6 text-stone-800 dark:text-stone-100 text-[15px] sm:text-lg bg-transparent border-none outline-none resize-none placeholder-stone-400 dark:placeholder-stone-500 leading-[1.65] ${embedded ? 'min-h-[156px] sm:min-h-[176px]' : 'min-h-[172px] sm:min-h-[220px]'}`}
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
                        className="flex items-center gap-2.5 px-5 py-3 rounded-xl font-extrabold text-sm transition-all disabled:opacity-50 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 border-2 border-b-4 border-stone-200 dark:border-stone-700 active:border-b-2 active:translate-y-0.5"
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
                      className="px-8 sm:px-10 py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 font-extrabold uppercase tracking-wide text-base bg-[#58CC02] text-white border-2 border-b-4 border-[#46A302] active:border-b-2 active:translate-y-0.5 disabled:bg-stone-200 dark:disabled:bg-stone-700 disabled:border-2 disabled:border-b-4 disabled:border-stone-300 dark:disabled:border-stone-600 disabled:cursor-not-allowed"
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

                <section
                  className={`rounded-2xl bg-[#FFF4E0] dark:bg-[#FF9600]/10 border-2 border-b-4 border-[#FF9600]/30 p-4 sm:p-6 ${
                    embedded ? 'mt-7 sm:mt-8' : 'mt-8 sm:mt-10 pt-6 sm:pt-8'
                  }`}
                  aria-labelledby="study-pack-previews-heading"
                >
                  <h2
                    id="study-pack-previews-heading"
                    className="text-center text-base sm:text-lg font-extrabold text-stone-900 dark:text-stone-100"
                  >
                    What&apos;s included in your pack
                  </h2>
                  <p className="mt-1 text-center text-xs sm:text-sm text-stone-500 dark:text-stone-400">
                    Quick previews for each study activity.
                  </p>
                  <div className="mt-4 flex flex-nowrap gap-2 sm:gap-3 justify-between overflow-x-auto pb-3 snap-x snap-mandatory [scrollbar-width:thin] max-w-5xl mx-auto">
                    {EMBEDDED_STUDY_PACK_PREVIEWS.map((slot) => (
                      <figure
                        key={slot.label}
                        className="snap-center shrink-0 w-[min(46vw,220px)] sm:w-[min(20vw,220px)] lg:w-0 lg:min-w-0 lg:flex-1 rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-950 border-2 border-b-4 border-[#FF9600] flex flex-col"
                      >
                        <div className="relative aspect-[4/5] w-full bg-stone-950/5 dark:bg-black/40">
                          {slot.video ? (
                            <video
                              className="absolute inset-0 h-full w-full object-cover object-center"
                              src={slot.video.src}
                              title={slot.video.alt}
                              aria-label={slot.video.alt}
                              muted
                              loop
                              playsInline
                              autoPlay
                              preload="metadata"
                            />
                          ) : slot.fallbackImage ? (
                            <img
                              src={slot.fallbackImage.src}
                              alt={slot.fallbackImage.alt}
                              className="absolute inset-0 h-full w-full object-cover object-top"
                              loading="lazy"
                              decoding="async"
                            />
                          ) : null}
                        </div>
                        <figcaption className="px-2 py-1.5 text-center text-[10px] sm:text-[11px] font-extrabold text-stone-600 dark:text-stone-400 border-t-2 border-[#FF9600] bg-white dark:bg-stone-900">
                          {slot.label}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                </section>

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

      {!embedded && <Footer onNavigate={onNavigate} />}
    </div>
  );
};

export default StudyPackPage;
