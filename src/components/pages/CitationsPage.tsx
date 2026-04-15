import { useState, useEffect } from 'react';
import Header from '../common/Header';
import { WriteScholarEditorialBackgroundLayers } from '../common/WriteScholarEditorialBackground';
import Footer from '../common/Footer';
import ScholarMascot from '../common/ScholarMascot';
import AnalysisAnimation from '../common/AnalysisAnimation';
import { FeatureTickRow } from '../common/FeatureTickRow';
import InteractiveCitationsDemo from '../landing/InteractiveCitationsDemo';
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
            : 'relative max-w-[1240px] mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-6 pb-24 sm:pb-16 w-full min-w-0 overflow-x-hidden'
        }
      >
        <div className="w-full min-w-0 space-y-4 sm:space-y-6">
          <div className="pt-1 sm:pt-2 pb-3 sm:pb-5 overflow-visible">
            <div className="relative rounded-2xl sm:rounded-2xl overflow-hidden mb-3 sm:mb-4 border border-stone-200/90 dark:border-stone-700/90 bg-white/85 dark:bg-stone-900/55 shadow-[0_16px_50px_-16px_rgba(15,23,42,0.12)] dark:shadow-[0_16px_50px_-16px_rgba(0,0,0,0.45)] backdrop-blur-sm ring-1 ring-white/40 dark:ring-white/5 scroll-mt-8">
              <div className="h-0.5 w-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500 opacity-75 dark:opacity-80" aria-hidden />
              <div className="relative rounded-b-2xl bg-white/95 dark:bg-stone-900/70 p-4 sm:p-8">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(91,33,182,0.04),transparent_55%)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-15%,rgba(109,40,217,0.08),transparent_55%)] pointer-events-none rounded-b-2xl" aria-hidden />

                <div className="relative lg:grid lg:grid-cols-[minmax(0,220px)_minmax(0,48rem)_minmax(0,220px)] lg:gap-8 xl:gap-10 lg:items-stretch">
                  <div className="hidden lg:block relative self-end justify-self-start w-[236px] xl:w-[248px] pointer-events-auto -rotate-[11deg] origin-bottom-left drop-shadow-lg z-[5]" aria-label="Sample sources preview">
                    <p className="text-center mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-800/95 dark:text-blue-300/95">Sources</span>
                      <span className="block text-[10px] text-stone-500 dark:text-stone-400 mt-0.5">Peer-reviewed picks</span>
                    </p>
                    <InteractiveCitationsDemo variant="side-left" />
                  </div>
                  <div className="min-w-0 self-start">
                    <h1 className="relative text-xl sm:text-2xl md:text-3xl font-semibold text-stone-900 dark:text-stone-50 text-center mb-1.5 tracking-tight" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
                      Find <span className="text-blue-700 dark:text-blue-400">academic sources</span> in seconds
                    </h1>
                    <p className="relative text-stone-600 dark:text-stone-300 text-sm sm:text-base text-center mb-2 sm:mb-2.5 max-w-xl mx-auto leading-relaxed">
                      APA, MLA & Chicago. Peer-reviewed sources. Filter by year.
                    </p>
                    <FeatureTickRow className="relative mb-1 sm:mb-1.5" items={['APA', 'MLA', 'Chicago', 'Peer-reviewed', 'Export-ready']} />
                    {!embedded && (
                      <>
                        <div className="relative flex rounded-xl border border-stone-200/90 dark:border-stone-700 bg-stone-100/60 dark:bg-stone-800/50 p-1 mb-1 sm:mb-1.5 max-w-lg mx-auto shadow-sm">
                          <button
                            type="button"
                            onClick={goAnalyze}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"
                          >
                            <span className="text-base" aria-hidden>📝</span> Analyze
                          </button>
                          <button
                            type="button"
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 bg-white dark:bg-stone-900 text-blue-800 dark:text-blue-300 shadow-sm border border-stone-200/80 dark:border-stone-600"
                          >
                            <span className="text-base" aria-hidden>📚</span> Citations
                          </button>
                          <button
                            type="button"
                            onClick={goStudyPack}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"
                          >
                            <span className="text-base" aria-hidden>📦</span> Study Pack
                          </button>
                        </div>
                        {user && citationCheckLoaded && !hasDoneCitation && (
                          <div className="flex flex-col items-center gap-1 mb-1.5 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200/90 dark:border-stone-600 text-stone-800 dark:text-stone-200 text-sm font-medium shadow-sm">
                              Start your first citation
                            </span>
                            <svg className="w-5 h-5 text-violet-600 dark:text-violet-400 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <div className="hidden lg:block relative self-end justify-self-end w-[236px] xl:w-[248px] pointer-events-auto rotate-[11deg] origin-bottom-right drop-shadow-lg z-[5]" aria-label="Sample citation export preview">
                    <p className="text-center mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-800/95 dark:text-blue-300/95">Export</span>
                      <span className="block text-[10px] text-stone-500 dark:text-stone-400 mt-0.5">APA · MLA · Chicago</span>
                    </p>
                    <InteractiveCitationsDemo variant="side-right" />
                  </div>
                </div>

                <div className="lg:hidden -mb-2 sm:-mb-3 mt-6 sm:mt-8 flex flex-row justify-between items-end gap-3 sm:gap-4 px-1">
                  <div className="w-[min(46%,220px)] shrink-0 -rotate-[8deg] origin-bottom-left drop-shadow-lg transition-transform hover:scale-[1.02]">
                    <InteractiveCitationsDemo variant="side-left" />
                  </div>
                  <div className="w-[min(46%,220px)] shrink-0 rotate-[8deg] origin-bottom-right drop-shadow-lg transition-transform hover:scale-[1.02]">
                    <InteractiveCitationsDemo variant="side-right" />
                  </div>
                </div>

                <div className="relative mb-2 max-w-3xl mx-auto -mt-8 sm:-mt-10 lg:-mt-14 xl:-mt-16 z-20">
                  <div className="relative rounded-xl sm:rounded-2xl border transition-all duration-300 shadow-sm focus-within:shadow-md focus-within:ring-2 focus-within:ring-blue-500/25 border-blue-200/90 dark:border-blue-800/60 bg-white dark:bg-stone-900/40 focus-within:border-blue-400/60">
                    <div className="relative rounded-[12px] sm:rounded-[18px] bg-white/98 dark:bg-stone-800/95 backdrop-blur-sm min-h-[120px] sm:min-h-[160px]">
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
                        className="relative w-full min-h-[120px] sm:min-h-[160px] max-h-[220px] overflow-y-auto p-4 sm:p-6 text-stone-800 dark:text-stone-100 text-[15px] sm:text-lg bg-transparent border-none outline-none resize-none placeholder-stone-400 dark:placeholder-stone-500 leading-relaxed"
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
                  <div className="flex justify-center mt-6">
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={!isTextValid() || isSearchingCitations}
                      className={`px-8 sm:px-10 py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 font-semibold text-base ${
                        isTextValid() && !isSearchingCitations
                          ? 'bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white shadow-md shadow-blue-900/15 ring-1 ring-blue-900/10 hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer'
                          : 'bg-stone-200 dark:bg-stone-700 text-stone-400 cursor-not-allowed'
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

                <div className="relative space-y-4 pt-2">
                  <div className="flex justify-center gap-3 flex-wrap">
                    <select
                      value={citationStyle}
                      onChange={(e) => setCitationStyle(e.target.value)}
                      className="px-4 py-2.5 rounded-2xl border border-stone-200/80 dark:border-stone-600/80 bg-white/90 dark:bg-stone-800/90 backdrop-blur-sm text-sm font-semibold shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
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
                      className="px-4 py-2.5 rounded-2xl border border-stone-200/80 dark:border-stone-600/80 bg-white/90 dark:bg-stone-800/90 backdrop-blur-sm text-sm font-semibold shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
                    >
                      <option value="all">All years</option>
                      <option value="3">Last 3 years</option>
                      <option value="5">Last 5 years</option>
                      <option value="10">Last 10 years</option>
                    </select>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    {suggestedTopics.map((topic, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setInputText(topic)}
                        className="px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200/90 dark:border-stone-600 text-stone-700 dark:text-stone-200 text-sm font-medium hover:border-violet-300/70 dark:hover:border-violet-600/50 hover:bg-violet-50/80 dark:hover:bg-violet-950/30 transition-all duration-200"
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {!embedded && (
          <div className="relative rounded-2xl border border-stone-200/90 dark:border-stone-700/90 bg-white/80 dark:bg-stone-900/50 backdrop-blur-sm p-4 sm:p-6 shadow-[0_12px_40px_-12px_rgba(15,23,42,0.08)] dark:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.35)] ring-1 ring-white/40 dark:ring-white/5">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>See how it works</h2>
              <span className="h-px flex-1 max-w-32 bg-stone-300/80 dark:bg-stone-600/60 rounded-full" />
            </div>
            <div className="relative rounded-xl overflow-hidden border border-stone-200/90 dark:border-stone-600/50 max-w-3xl mx-auto shadow-md">
              <div className="bg-stone-100/80 dark:bg-stone-800/50 flex items-center justify-center aspect-video min-h-[200px] sm:min-h-[320px]">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-contain"
                  title="WriteScholar Citation Finder — APA, MLA, Chicago sources"
                  aria-label="WriteScholar Citation Finder — Find and format APA, MLA, Chicago sources"
                >
                  <source src="/writescholar-citation-finder-demo.mp4" type="video/mp4" />
                </video>
              </div>
              <div className="px-4 py-3.5 border-t border-stone-200/60 dark:border-stone-700/80 bg-white/90 dark:bg-stone-900/40">
                <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">How it works</p>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">Find & format academic sources in APA, MLA, Chicago & more</p>
              </div>
            </div>
          </div>
          )}
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
