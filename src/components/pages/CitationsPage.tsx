import { useState, useEffect } from 'react';
import Header from '../common/Header';
import Footer from '../common/Footer';
import ScholarMascot from '../common/ScholarMascot';
import AnalysisAnimation from '../common/AnalysisAnimation';
import { trackAction } from '../../data/achievements';

interface CitationsPageProps {
  onNavigate: (page: string) => void;
  user?: any;
  onLogout: () => void;
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

const CitationsPage = ({ onNavigate, user, onLogout }: CitationsPageProps) => {
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
    document.title = 'Citation Finder for College Papers — APA, MLA, Chicago | WriteScholar';
  }, []);

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

  return (
    <div className="min-h-screen relative transition-colors font-sans bg-stone-50/50 dark:bg-stone-900">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-15%,rgba(14,165,233,0.08),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-15%,rgba(59,130,246,0.06),transparent)] pointer-events-none" aria-hidden />

      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="citations" />

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-24 sm:pb-28">
        <div className="flex flex-col gap-8 lg:gap-10">
          {/* Top: Hero card - matches dashboard citations style */}
          <div className="relative rounded-3xl sm:rounded-[2rem] overflow-hidden p-[2px] shadow-[0_20px_50px_-15px_rgba(14,165,233,0.25)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.4)]" style={{ background: 'linear-gradient(135deg, rgba(14,165,233,0.2) 0%, rgba(59,130,246,0.15) 50%, rgba(99,102,241,0.1) 100%)' }}>
            <div className="relative rounded-[22px] sm:rounded-[30px] bg-white/90 dark:bg-stone-800/95 backdrop-blur-2xl border border-white/50 dark:border-stone-700/50 shadow-inner p-6 sm:p-10">
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-sky-400/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
              {/* Hero headline - matches dashboard (H1 for a11y / SEO) */}
              <h1 className="relative text-2xl sm:text-3xl md:text-4xl font-extrabold text-stone-900 dark:text-white text-center mb-2 tracking-tight">
                Find <span className="text-sky-600 dark:text-sky-400" style={{ WebkitBackgroundClip: 'text' }}>academic sources</span> in seconds
              </h1>
              <p className="relative text-stone-600 dark:text-stone-300 text-base sm:text-lg text-center mb-8 max-w-xl mx-auto leading-relaxed">
                APA, MLA & Chicago. Peer-reviewed sources. Filter by year.
              </p>
              {/* Tick boxes - matches dashboard */}
              <div className="relative grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-3 sm:gap-6 mb-8">
                {['APA, MLA & Chicago', 'Peer-reviewed sources', 'Filter by year', 'Export ready'].map((f, i) => (
                  <span key={i} className="flex items-center gap-2.5 text-stone-600 dark:text-stone-400 text-sm sm:text-base">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center">
                      <svg className="w-3 h-3 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    </span>
                    {f}
                  </span>
                ))}
              </div>

              {/* Citation options - style + year */}
              <div className="flex justify-center gap-3 flex-wrap mb-6">
                <select value={citationStyle} onChange={(e) => setCitationStyle(e.target.value)} className="px-4 py-2.5 rounded-2xl border border-stone-200/80 dark:border-stone-600/80 bg-white/90 dark:bg-stone-800/90 backdrop-blur-sm text-sm font-semibold shadow-sm focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-all">
                  <option value="APA">APA 7th</option>
                  <option value="MLA">MLA 9th</option>
                  <option value="Chicago">Chicago</option>
                  <option value="Harvard">Harvard</option>
                  <option value="IEEE">IEEE</option>
                  <option value="Vancouver">Vancouver</option>
                </select>
                <select value={citationYearRange} onChange={(e) => setCitationYearRange(e.target.value)} className="px-4 py-2.5 rounded-2xl border border-stone-200/80 dark:border-stone-600/80 bg-white/90 dark:bg-stone-800/90 backdrop-blur-sm text-sm font-semibold shadow-sm focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-all">
                  <option value="all">All years</option>
                  <option value="3">Last 3 years</option>
                  <option value="5">Last 5 years</option>
                  <option value="10">Last 10 years</option>
                </select>
              </div>

              {/* "Start your first citation" callout - shown when user has never done a citation */}
              {user && citationCheckLoaded && !hasDoneCitation && (
                <div className="flex flex-col items-center gap-1 mb-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-sky-500/15 via-blue-500/15 to-sky-500/15 dark:from-sky-500/25 dark:via-blue-500/25 dark:to-sky-500/25 border border-sky-200/60 dark:border-sky-700/50 text-sky-700 dark:text-sky-200 text-sm font-bold shadow-lg shadow-sky-500/10">
                    Start your first citation
                  </span>
                  <svg className="w-6 h-6 text-sky-500 dark:text-sky-400 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
              )}

              {/* Typing box - blue gradient like dashboard */}
              <div className="relative mb-2 max-w-3xl mx-auto">
                <div className="relative rounded-2xl sm:rounded-3xl p-[2px] bg-gradient-to-br from-sky-400/80 via-blue-400/80 to-indigo-400/80 dark:from-sky-500/60 dark:via-blue-500/60 dark:to-indigo-500/60 shadow-[0_20px_50px_-15px_rgba(14,165,233,0.25)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.4)]">
                  <div className="relative rounded-[14px] sm:rounded-[22px] bg-white dark:bg-stone-800/95 backdrop-blur-sm min-h-[140px] sm:min-h-[180px]">
                    <textarea
                      value={inputText}
                      onChange={(e) => { const v = e.target.value; setInputText(v); setShowWordWarning(false); try { sessionStorage.setItem('writescholar_citations_draft', v); } catch (_) {} }}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && isTextValid()) { e.preventDefault(); handleSubmit(); }}}
                      placeholder={placeholders[placeholderIndex]}
                      className="relative w-full min-h-[140px] sm:min-h-[180px] p-5 sm:p-6 text-stone-800 dark:text-stone-100 text-base sm:text-lg bg-transparent border-none outline-none resize-none placeholder-stone-400 dark:placeholder-stone-500 leading-relaxed"
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = Math.min(target.scrollHeight, 320) + 'px';
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
                    className={`px-8 sm:px-10 py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all duration-200 font-bold text-base ${
                      isTextValid() && !isSearchingCitations
                        ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-500/30 hover:shadow-xl hover:shadow-sky-500/40 hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer'
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

              {/* Suggested topics */}
              <div className="flex flex-wrap justify-center gap-2 pt-4">
                {suggestedTopics.map((topic, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setInputText(topic)}
                    className="px-4 py-2.5 rounded-2xl bg-sky-50/90 dark:bg-sky-900/25 border border-sky-200/80 dark:border-sky-700/50 text-sky-700 dark:text-sky-300 text-sm font-semibold hover:bg-sky-100 dark:hover:bg-sky-900/40 hover:scale-[1.02] hover:border-sky-300 transition-all duration-200"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom: Video - See how it works */}
          <div className="relative">
            <div className="absolute -inset-2 bg-gradient-to-r from-sky-400/12 via-blue-400/12 to-sky-500/12 rounded-3xl blur-2xl pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-lg font-bold text-stone-800 dark:text-stone-100">See how it works</h2>
                <span className="h-px flex-1 max-w-32 bg-gradient-to-r from-sky-300/60 to-transparent dark:from-sky-500/40 rounded-full" />
              </div>
              <div className="relative bg-white dark:bg-stone-800 rounded-2xl overflow-hidden shadow-xl shadow-stone-200/50 dark:shadow-stone-900/50 border border-stone-200/60 dark:border-stone-600/50 max-w-3xl mx-auto">
                <div className="bg-gradient-to-br from-sky-50/50 to-blue-50/50 dark:from-sky-900/20 dark:to-blue-900/20 flex items-center justify-center aspect-video min-h-[200px] sm:min-h-[320px]">
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
                <div className="px-4 py-3.5 border-t border-stone-100 dark:border-stone-700/80">
                  <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">How it works</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">Find & format academic sources in APA, MLA, Chicago & more</p>
                </div>
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

            <div className="w-20 h-20 bg-gradient-to-br from-sky-100 to-blue-100 dark:from-sky-900/40 dark:to-blue-900/40 rounded-2xl flex items-center justify-center mx-auto mb-6 overflow-hidden">
              <ScholarMascot size={72} animated={false} pose="celebrating" />
            </div>

            <h3 className="text-2xl font-bold text-stone-800 dark:text-stone-100 mb-3">Search Complete</h3>
            <p className="text-stone-600 dark:text-stone-400 mb-4">
              Found <span className="font-bold text-sky-600 dark:text-sky-400">10 appropriate citations</span> for your research on{' '}
              <span className="font-medium text-stone-700 dark:text-stone-300">&quot;{teaserTopic.length > 50 ? teaserTopic.slice(0, 50) + '...' : teaserTopic}&quot;</span>
            </p>
            <p className="text-stone-500 dark:text-stone-400 text-sm mb-6">
              Sign up free to see the full list with formatted citations ready to copy.
            </p>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => onNavigate('signup')}
                className="w-full px-6 py-3.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-sky-500/25"
              >
                Sign Up to See Full List
              </button>
              <button
                type="button"
                onClick={() => { setShowSignupPrompt(false); setTeaserTopic(''); onNavigate('login'); }}
                className="w-full px-6 py-3 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 font-medium rounded-xl transition-colors"
              >
                Already have an account? <span className="text-sky-600 dark:text-sky-400">Log in</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default CitationsPage;
