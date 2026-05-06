import { useState, useEffect } from 'react';
import Header from '../common/Header';
import { WriteScholarEditorialBackgroundLayers } from '../common/WriteScholarEditorialBackground';
import Footer from '../common/Footer';
import ScholarMascot from '../common/ScholarMascot';
import AnalysisAnimation from '../common/AnalysisAnimation';
import { trackAction } from '../../data/achievements';

export type EmbeddedDashboardTool = 'analyze' | 'citations' | 'study_pack';

interface CitationsPageProps {
  onNavigate: (page: string, slug?: string, options?: { studyPack?: { data: unknown; title?: string } }) => void;
  user?: any;
  onLogout: () => void;
  /** Render without page chrome — for embedding in the new dashboard */
  embedded?: boolean;
  /** When embedded, switch dashboard tool instead of navigating full-page routes */
  onEmbeddedToolSwitch?: (tool: EmbeddedDashboardTool) => void;
}

const placeholders = [
  "Enter your research topic to find citations...",
  "What are you researching? Find sources instantly...",
  "Type your essay question and discover literature..."
];

const suggestedTopics: string[] = [
  "Effects of social media on teenagers",
  "Climate change mitigation strategies",
  "AI in healthcare applications",
  "Remote work productivity research"
];

/** Dashboard only — screenshot + muted walkthrough clip. */
const EMBEDDED_CITATION_PREVIEWS: (
  | { id: string; kind: 'image'; src: string; label: string; alt: string }
  | { id: string; kind: 'video'; src: string; label: string; description: string }
)[] = [
  {
    id: 'demo',
    kind: 'video',
    src: '/writescholar-citation-finder-demo.mp4',
    label: 'Walkthrough',
    description: 'Find sources, choose a style, and copy ready-to-use citations',
  },
  {
    id: 'screenshot',
    kind: 'image',
    src: '/citations-preview.png',
    label: 'Citation layout',
    alt: 'Preview of citation finder results and formatting',
  },
];

const CitationsPage = ({ onNavigate, user, onLogout, embedded = false, onEmbeddedToolSwitch }: CitationsPageProps) => {
  const [inputText, setInputText] = useState(() => {
    try { return sessionStorage.getItem('writescholar_citations_draft') || ''; } catch { return ''; }
  });
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [showWordWarning, setShowWordWarning] = useState(false);
  const [isSearchingCitations, setIsSearchingCitations] = useState(false);
  const [showSearchAnimation, setShowSearchAnimation] = useState(false);
  const [citationStyle, setCitationStyle] = useState('APA');
  const [citationYearRange, setCitationYearRange] = useState('all');
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [teaserTopic, setTeaserTopic] = useState('');
  const [hasDoneCitation, setHasDoneCitation] = useState(false);
  const [citationCheckLoaded, setCitationCheckLoaded] = useState(false);

  useEffect(() => {
    if (embedded) return;
    document.title = 'Citation Finder for College Papers — APA, MLA, Chicago | WriteScholar';
  }, [embedded]);

  useEffect(() => {
    if (!user) {
      setCitationCheckLoaded(true);
      return;
    }
    const token = localStorage.getItem('authToken');
    if (!token) {
      setCitationCheckLoaded(true);
      return;
    }
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/citation-history`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then((res) => res.ok ? res.json() : { data: [] })
      .then((json) => {
        const data = json.data || [];
        setHasDoneCitation(Array.isArray(data) && data.length > 0);
      })
      .catch(() => {})
      .finally(() => setCitationCheckLoaded(true));
  }, [user]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const isTextValid = () => inputText.trim().length > 0;

  const handleSubmit = async () => {
    if (inputText.trim().length === 0) {
      setShowWordWarning(true);
      setTimeout(() => setShowWordWarning(false), 3000);
      return;
    }

    if (!user) {
      // Fake animation for logged-out users - no backend call
      setIsSearchingCitations(true);
      setShowSearchAnimation(true);
      setTeaserTopic(inputText.trim());
      setTimeout(() => {
        setIsSearchingCitations(false);
        setShowSearchAnimation(false);
        setShowSignupPrompt(true);
      }, 10000);
      return;
    }

    try {
      setIsSearchingCitations(true);
      setShowSearchAnimation(true);

      const token = localStorage.getItem('authToken');
      if (!token) {
        onNavigate('login');
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      const currentYear = new Date().getFullYear();
      let minYear = null;
      if (citationYearRange !== 'all') {
        minYear = currentYear - parseInt(citationYearRange);
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/citation-search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          researchTopic: inputText,
          citationStyle: citationStyle,
          numberOfCitations: 10,
          minYear: minYear,
          yearRange: citationYearRange
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Citation search failed');
      }

      if (data.success && data.data) {
        localStorage.setItem('citationSearchResults', JSON.stringify(data.data));
        trackAction('citations_count');
        onNavigate('citation-results');
      } else {
        throw new Error('No citation results received');
      }
    } catch (error) {
      console.error('Citation search error:', error);
      alert(error instanceof Error ? error.message : 'Failed to search for citations. Please try again.');
    } finally {
      setIsSearchingCitations(false);
      setShowSearchAnimation(false);
    }
  };

  const goAnalyze = () =>
    embedded && onEmbeddedToolSwitch ? onEmbeddedToolSwitch('analyze') : onNavigate('analyze');
  const goStudyPack = () =>
    embedded && onEmbeddedToolSwitch ? onEmbeddedToolSwitch('study_pack') : onNavigate('study-pack');

  return (
    <div
      className={
        embedded
          ? 'relative w-full min-w-0'
          : 'min-h-screen relative transition-colors font-sans overflow-x-hidden'
      }
    >
      {!embedded && <WriteScholarEditorialBackgroundLayers position="fixed" />}

      {!embedded && <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="citations" />}

      <main
        className={
          embedded
            ? 'relative max-w-none mx-auto px-0 pt-0 pb-2 w-full min-w-0 overflow-x-hidden'
            : 'relative max-w-[1360px] mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-6 pb-24 sm:pb-16 w-full min-w-0 overflow-x-hidden'
        }
      >
        <div className="w-full min-w-0 space-y-4 sm:space-y-6">
          <div className={embedded ? 'pb-2 overflow-visible' : 'pt-1 sm:pt-2 pb-3 sm:pb-5 overflow-visible'}>
            <div
              className={
                embedded
                  ? 'relative rounded-3xl overflow-hidden mb-3 sm:mb-4 scroll-mt-8 bg-white dark:bg-stone-900/85 ring-1 ring-sky-200/80 dark:ring-sky-800/40 shadow-[0_20px_50px_-18px_rgba(14,116,184,0.14),0_8px_30px_-12px_rgba(15,23,42,0.08)] dark:shadow-[0_24px_60px_-20px_rgba(0,0,0,0.55)]'
                  : 'relative rounded-[1.75rem] overflow-hidden mb-6 sm:mb-10 scroll-mt-8 max-w-6xl mx-auto border border-sky-200/90 dark:border-sky-900/40 bg-[#fafcff] dark:bg-stone-900/85 ring-1 ring-sky-100/85 dark:ring-sky-950/35 shadow-[0_20px_60px_-28px_rgba(14,116,184,0.16),0_8px_32px_-14px_rgba(15,23,42,0.07)] dark:shadow-[0_24px_60px_-20px_rgba(0,0,0,0.55)]'
              }
            >
              <div
                className="h-[3px] w-full bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-600 opacity-95 dark:opacity-95"
                aria-hidden
              />
              <>
                <div className="pointer-events-none absolute -top-24 -right-20 w-[19rem] h-[19rem] rounded-full bg-sky-400/14 dark:bg-sky-500/12 blur-3xl" aria-hidden />
                <div className="pointer-events-none absolute -bottom-20 -left-16 w-64 h-64 rounded-full bg-indigo-400/11 dark:bg-indigo-500/14 blur-[2.75rem]" aria-hidden />
              </>
              <div
                className={`relative bg-white/95 dark:bg-stone-900/70 ${embedded ? 'rounded-b-[1.375rem]' : 'rounded-b-[1.75rem]'} ${embedded ? 'p-4 sm:p-6 lg:p-8' : 'p-4 sm:p-8 lg:p-10'}`}
              >
                <div
                  className={`pointer-events-none absolute inset-0 ${embedded ? 'rounded-b-[1.375rem]' : 'rounded-b-[1.75rem]'} ${
                    embedded
                      ? 'bg-[radial-gradient(ellipse_85%_55%_at_50%_-18%,rgba(14,165,233,0.09),transparent_58%)] dark:bg-[radial-gradient(ellipse_85%_55%_at_50%_-15%,rgba(56,189,248,0.11),transparent_58%)]'
                      : 'bg-[radial-gradient(ellipse_90%_52%_at_50%_-16%,rgba(14,165,233,0.08),transparent_55%)] dark:bg-[radial-gradient(ellipse_85%_52%_at_50%_-14%,rgba(56,189,248,0.1),transparent_55%)]'
                  }`}
                  aria-hidden
                />

                {/* Studying mascot — top left, always playing */}
                <img
                  src="/mascot-study.webp"
                  alt=""
                  aria-hidden
                  loading="lazy"
                  decoding="async"
                  className="hidden sm:block pointer-events-none absolute top-3 left-3 sm:top-4 sm:left-4 w-20 sm:w-24 lg:w-28 h-auto z-10 drop-shadow-[0_12px_22px_rgba(14,165,233,0.30)]"
                />
                {/* Dancing mascot — top right, always playing */}
                <img
                  src="/mascot-dance.webp"
                  alt=""
                  aria-hidden
                  loading="lazy"
                  decoding="async"
                  className="hidden sm:block pointer-events-none absolute top-3 right-3 sm:top-4 sm:right-4 w-20 sm:w-24 lg:w-28 h-auto z-10 drop-shadow-[0_12px_22px_rgba(14,165,233,0.30)]"
                />

                <div className="relative min-w-0">
                  <div className="text-center mb-3 sm:mb-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-50 dark:bg-sky-950/50 text-sky-950 dark:text-sky-200 ring-1 ring-sky-200/90 dark:ring-sky-800/55 text-[10px] sm:text-[11px] font-semibold tracking-[0.1em] uppercase">
                      <svg className="w-3.5 h-3.5 opacity-90 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      APA, MLA, Chicago & more
                    </span>
                  </div>
                  <div className="min-w-0 self-start">
                    <h1
                      className={`relative dash-serif font-semibold text-stone-900 dark:text-stone-50 text-center tracking-tight text-2xl sm:text-3xl lg:text-[2.45rem] leading-[1.08] ${embedded ? 'mb-2' : 'mb-1.5 sm:mb-2'}`}
                      style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
                    >
                      Find{' '}
                      <span className="bg-gradient-to-r from-sky-600 via-blue-600 to-violet-600 dark:from-sky-300 dark:via-blue-300 dark:to-violet-300 bg-clip-text text-transparent">
                        academic sources
                      </span>{' '}
                      in seconds
                    </h1>
                    <p className={`relative text-stone-500 dark:text-stone-400 text-sm sm:text-base text-center max-w-xl mx-auto leading-relaxed ${embedded ? 'mb-4' : 'mb-5 sm:mb-6'}`}>
                      APA, MLA & Chicago. Peer-reviewed sources. Filter by year.
                    </p>
                    {!embedded && (
                      <>
                        <div className="relative flex rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 p-1 mb-3 sm:mb-4 max-w-lg mx-auto border border-sky-200/80 dark:border-sky-800/50 shadow-sm shadow-sky-900/5">
                          <button
                            type="button"
                            onClick={goAnalyze}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[0.65rem] font-medium text-sm transition-all duration-200 text-stone-600 dark:text-stone-400 hover:text-sky-950 dark:hover:text-stone-200 hover:bg-white/80 dark:hover:bg-stone-800/50"
                          >
                            <span className="text-base" aria-hidden>📝</span> Analyze Text
                          </button>
                          <button
                            type="button"
                            onClick={goStudyPack}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[0.65rem] font-medium text-sm transition-all duration-200 text-stone-600 dark:text-stone-400 hover:text-sky-950 dark:hover:text-stone-200 hover:bg-white/80 dark:hover:bg-stone-800/50"
                          >
                            <span className="text-base" aria-hidden>📦</span> Study Tools
                          </button>
                          <button
                            type="button"
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[0.65rem] font-medium text-sm transition-all duration-200 bg-white dark:bg-stone-800 text-blue-900 dark:text-sky-200 shadow-sm ring-1 ring-sky-200/90 dark:ring-sky-800/55"
                          >
                            <span className="text-base" aria-hidden>📚</span> Citations
                          </button>
                        </div>
                        {user && citationCheckLoaded && !hasDoneCitation && (
                          <div className="flex flex-col items-center gap-1 mb-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200/90 dark:border-stone-600 text-stone-800 dark:text-stone-200 text-sm font-medium shadow-sm">
                              Start your first citation
                            </span>
                            <svg className="w-5 h-5 text-sky-600 dark:text-sky-400 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className={`relative mb-2 max-w-4xl mx-auto z-20 ${embedded ? 'mt-0' : 'mt-1'}`}>
                  <div
                    className={`relative rounded-[1.25rem] border transition-all duration-300 shadow-sm focus-within:shadow-md focus-within:ring-2 focus-within:ring-sky-500/35 border-sky-200/85 dark:border-sky-800/50 bg-white/95 dark:bg-stone-950/50 focus-within:border-sky-400/70 dark:focus-within:border-sky-500/55`}
                  >
                    <div className={`relative rounded-[inherit] bg-white/98 dark:bg-stone-800/95 backdrop-blur-sm ${embedded ? 'min-h-[132px] sm:min-h-[150px]' : 'min-h-[140px] sm:min-h-[180px]'}`}>
                      <textarea
                        value={inputText}
                        onChange={(e) => {
                          const v = e.target.value;
                          setInputText(v);
                          setShowWordWarning(false);
                          try {
                            sessionStorage.setItem('writescholar_citations_draft', v);
                          } catch (_) {
                            /* ignore */
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey && isTextValid()) {
                            e.preventDefault();
                            handleSubmit();
                          }
                        }}
                        placeholder={placeholders[placeholderIndex]}
                        className={`relative w-full max-h-[220px] overflow-y-auto p-5 sm:p-6 text-stone-800 dark:text-stone-100 text-[15px] sm:text-lg bg-transparent border-none outline-none resize-none placeholder-stone-400 dark:placeholder-stone-500 leading-relaxed ${embedded ? 'min-h-[132px] sm:min-h-[150px]' : 'min-h-[140px] sm:min-h-[180px]'}`}
                        onInput={(e) => {
                          const target = e.target as HTMLTextAreaElement;
                          target.style.height = 'auto';
                          target.style.height = Math.min(target.scrollHeight, 220) + 'px';
                        }}
                      />
                      <div className="absolute bottom-4 left-5 text-sm text-stone-400 dark:text-stone-500 font-medium">
                        {inputText.length} characters
                      </div>
                      {showWordWarning && (
                        <div className="absolute -bottom-6 left-0 right-0 text-center">
                          <span className="text-sm font-medium text-red-500">Please enter a research topic</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-center mt-4 sm:mt-5">
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={!isTextValid() || isSearchingCitations}
                      className={`min-w-[200px] px-8 sm:px-12 py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 font-semibold text-base ${
                        isTextValid() && !isSearchingCitations
                          ? 'bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:from-sky-500 hover:via-blue-500 hover:to-indigo-500 dark:from-sky-500 dark:via-blue-600 dark:to-indigo-600 dark:hover:from-sky-400 dark:hover:via-blue-500 dark:hover:to-indigo-500 text-white shadow-lg shadow-sky-900/18 dark:shadow-black/35 ring-1 ring-sky-950/15 hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer'
                          : 'bg-stone-300 dark:bg-stone-600 text-white dark:text-stone-200 cursor-not-allowed shadow-inner'
                      }`}
                    >
                      {isSearchingCitations ? (
                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <>Find Sources</>
                      )}
                    </button>
                  </div>
                </div>

                <div className={`relative space-y-3 ${embedded ? 'pt-4' : 'pt-5 sm:pt-6'}`}>
                  <div className={`flex justify-center gap-2 sm:gap-3 flex-wrap ${embedded ? '' : 'max-w-4xl mx-auto'}`}>
                    <select
                      value={citationStyle}
                      onChange={(e) => setCitationStyle(e.target.value)}
                      className="px-4 py-2.5 rounded-xl border border-stone-300/90 dark:border-stone-600/80 bg-white dark:bg-stone-800/90 backdrop-blur-sm text-sm font-semibold shadow-sm transition-all ring-1 ring-sky-100/70 dark:ring-sky-950/40 focus:ring-2 focus:ring-sky-500/40 focus:border-sky-400/70"
                    >
                      <option value="APA">APA 7th</option>
                      <option value="MLA">MLA 9th</option>
                      <option value="Chicago">Chicago</option>
                      <option value="Harvard">Harvard</option>
                      <option value="IEEE">IEEE</option>
                      <option value="Vancouver">Vancouver</option>
                    </select>
                    <select
                      value={citationYearRange}
                      onChange={(e) => setCitationYearRange(e.target.value)}
                      className="px-4 py-2.5 rounded-xl border border-stone-300/90 dark:border-stone-600/80 bg-white dark:bg-stone-800/90 backdrop-blur-sm text-sm font-semibold shadow-sm transition-all ring-1 ring-sky-100/70 dark:ring-sky-950/40 focus:ring-2 focus:ring-sky-500/40 focus:border-sky-400/70"
                    >
                      <option value="all">All years</option>
                      <option value="3">Last 3 years</option>
                      <option value="5">Last 5 years</option>
                      <option value="10">Last 10 years</option>
                    </select>
                  </div>
                  <div className={`flex flex-wrap justify-center gap-2 ${embedded ? '' : 'max-w-4xl mx-auto'}`}>
                    {suggestedTopics.map((topic, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setInputText(topic)}
                        className="px-3.5 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm rounded-xl bg-white dark:bg-stone-800/90 border border-stone-300/90 dark:border-stone-600 text-stone-700 dark:text-stone-200 font-medium transition-all duration-200 hover:border-sky-300/90 dark:hover:border-sky-600/50 hover:bg-sky-50/90 dark:hover:bg-sky-950/35"
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                </div>

                <section
                  className={`rounded-2xl border border-sky-200/75 dark:border-sky-800/45 bg-gradient-to-b from-white/95 to-sky-50/40 dark:from-stone-900/55 dark:to-sky-950/20 p-4 sm:p-6 ring-1 ring-sky-100/80 dark:ring-sky-950/35 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.65)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] ${
                    embedded ? 'mt-7 sm:mt-8' : 'mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-sky-200/50 dark:border-sky-900/40'
                  }`}
                  aria-labelledby="citation-previews-heading"
                >
                  <h2
                    id="citation-previews-heading"
                    className="text-center dash-serif text-base sm:text-lg font-semibold text-stone-900 dark:text-stone-100"
                    style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
                  >
                    What your sources can look like
                  </h2>
                  <p className="mt-1 text-center text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-xl mx-auto">
                    Muted demo and a static preview — your results follow your topic and style.
                  </p>
                  <div className="mt-4 flex flex-nowrap gap-3 sm:gap-4 justify-between overflow-x-auto pb-3 snap-x snap-mandatory [scrollbar-width:thin] max-w-5xl mx-auto">
                    {EMBEDDED_CITATION_PREVIEWS.map((item) => (
                      <figure
                        key={item.id}
                        className="snap-center shrink-0 w-[min(72vw,280px)] sm:w-[min(40vw,340px)] lg:w-0 lg:min-w-0 lg:flex-1 rounded-xl overflow-hidden bg-stone-950 border-2 border-sky-500 dark:border-sky-400 shadow-md shadow-sky-900/15 flex flex-col"
                      >
                        <div className="relative aspect-[16/11] w-full bg-black/80">
                          {item.kind === 'image' ? (
                            <img
                              src={item.src}
                              alt={item.alt}
                              className="absolute inset-0 h-full w-full object-cover object-top"
                              loading="lazy"
                              decoding="async"
                            />
                          ) : (
                            <video
                              className="absolute inset-0 h-full w-full object-cover object-center"
                              aria-label={item.description}
                              title={item.description}
                              muted
                              loop
                              playsInline
                              autoPlay
                              preload="metadata"
                            >
                              <source src={item.src} type="video/mp4" />
                            </video>
                          )}
                        </div>
                        <figcaption className="px-2 py-1.5 text-center text-[10px] sm:text-[11px] font-semibold text-stone-600 dark:text-stone-400 border-t border-stone-200/70 dark:border-stone-700/70 bg-white/95 dark:bg-stone-900/95">
                          {item.label}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </div>

        </div>
      </main>

      {showSearchAnimation && (
        <AnalysisAnimation
          isPopup={true}
          text="Finding citations for your topic"
          isComplete={false}
          variant="citations"
        />
      )}

      {/* Signup Prompt Modal - for logged-out users after fake search */}
      {showSignupPrompt && teaserTopic && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-800 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-600 max-w-md w-full p-8 text-center relative animate-in zoom-in-95 fade-in duration-300">
            <button
              type="button"
              onClick={() => { setShowSignupPrompt(false); setTeaserTopic(''); }}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/40 rounded-2xl flex items-center justify-center mx-auto mb-6 overflow-hidden">
              <ScholarMascot size={72} animated={false} pose="celebrating" />
            </div>

            <h3 className="text-2xl font-bold text-stone-800 dark:text-stone-100 mb-3">Search Complete</h3>
            <p className="text-stone-600 dark:text-stone-400 mb-4">
              Found <span className="font-bold text-blue-600 dark:text-blue-400">10 appropriate citations</span> for your research on{' '}
              <span className="font-medium text-stone-700 dark:text-stone-300">&quot;{teaserTopic.length > 50 ? teaserTopic.slice(0, 50) + '...' : teaserTopic}&quot;</span>
            </p>
            <p className="text-stone-500 dark:text-stone-400 text-sm mb-6">
              Sign up free to see the full list with formatted citations ready to copy.
            </p>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => onNavigate('signup')}
                className="w-full px-6 py-3.5 bg-violet-700 hover:bg-violet-800 dark:bg-violet-600 dark:hover:bg-violet-500 text-white font-semibold rounded-2xl transition-all shadow-md shadow-violet-900/15 ring-1 ring-violet-900/10"
              >
                Sign Up to See Full List
              </button>
              <button
                type="button"
                onClick={() => { setShowSignupPrompt(false); setTeaserTopic(''); onNavigate('login'); }}
                className="w-full px-6 py-3 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 font-medium rounded-xl transition-colors"
              >
                Already have an account? <span className="text-blue-600 dark:text-blue-400">Log in</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {!embedded && <Footer onNavigate={onNavigate} />}
    </div>
  );
};

export default CitationsPage;
