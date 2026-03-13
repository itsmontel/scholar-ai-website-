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

const suggestedTopics = [
  "Effects of social media on teenagers",
  "Climate change mitigation strategies",
  "AI in healthcare applications",
  "Remote work productivity research"
];

const CitationsPage = ({ onNavigate, user, onLogout }: CitationsPageProps) => {
  const [inputText, setInputText] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [showWordWarning, setShowWordWarning] = useState(false);
  const [isSearchingCitations, setIsSearchingCitations] = useState(false);
  const [showSearchAnimation, setShowSearchAnimation] = useState(false);
  const [citationStyle, setCitationStyle] = useState('APA');
  const [citationYearRange, setCitationYearRange] = useState('all');
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [teaserTopic, setTeaserTopic] = useState('');

  useEffect(() => {
    document.title = 'Find Citations – Academic Sources | WriteScholar';
  }, []);

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
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-15%,rgba(148,163,184,0.08),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-15%,rgba(100,116,139,0.06),transparent)] pointer-events-none" aria-hidden />

      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="citations" />

      <main className="relative max-w-3xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-24 sm:pb-28">
        {/* Main content - stacked: form on top, video below */}
        <div className="flex flex-col gap-8 lg:gap-10">
          {/* Top: Form - clean minimalist card */}
          <div className="order-1">
            <div className="bg-white dark:bg-stone-800 rounded-3xl border border-stone-200 dark:border-stone-600 shadow-sm dark:shadow-stone-900/50 p-6 sm:p-8 space-y-6">
              {/* Hero */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 hidden sm:block">
                  <ScholarMascot size={72} animated={false} pose="default" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-800 dark:text-stone-100 leading-tight tracking-tight">
                    Find Citations
                  </h1>
                  <p className="text-sm text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
                    Enter your research topic to discover relevant academic sources.
                  </p>
                </div>
              </div>

              {/* Citation Options - pill/tag style */}
              <div className="flex flex-wrap gap-3 justify-center">
                <div className="inline-flex items-center bg-white dark:bg-stone-700/50 rounded-2xl px-4 py-2.5 border border-stone-200 dark:border-stone-600 shadow-sm">
                  <span className="text-stone-500 dark:text-stone-400 mr-2 text-xs font-medium">Style:</span>
                  <select
                    value={citationStyle}
                    onChange={(e) => setCitationStyle(e.target.value)}
                    className="bg-transparent font-semibold text-stone-800 dark:text-stone-200 outline-none cursor-pointer text-sm"
                  >
                    <option value="APA">APA 7th</option>
                    <option value="MLA">MLA 9th</option>
                    <option value="Chicago">Chicago</option>
                    <option value="Harvard">Harvard</option>
                    <option value="IEEE">IEEE</option>
                    <option value="Vancouver">Vancouver</option>
                  </select>
                </div>
                <div className="inline-flex items-center bg-white dark:bg-stone-700/50 rounded-2xl px-4 py-2.5 border border-stone-200 dark:border-stone-600 shadow-sm">
                  <span className="text-stone-500 dark:text-stone-400 mr-2 text-xs font-medium">Year:</span>
                  <select
                    value={citationYearRange}
                    onChange={(e) => setCitationYearRange(e.target.value)}
                    className="bg-transparent font-semibold text-stone-800 dark:text-stone-200 outline-none cursor-pointer text-sm"
                  >
                    <option value="all">All Time</option>
                    <option value="3">Last 3 Years</option>
                    <option value="5">Last 5 Years</option>
                    <option value="10">Last 10 Years</option>
                    <option value="15">Last 15 Years</option>
                    <option value="20">Last 20 Years</option>
                  </select>
                </div>
              </div>

              {/* Input Area - large white field */}
              <div className="space-y-3">
                <div className="relative bg-white dark:bg-stone-700/30 rounded-2xl border border-stone-200 dark:border-stone-600 shadow-sm dark:shadow-inner focus-within:border-sky-400 dark:focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-400/20 transition-all">
                  <textarea
                    value={inputText}
                    onChange={(e) => { setInputText(e.target.value); setShowWordWarning(false); }}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && isTextValid()) { e.preventDefault(); handleSubmit(); }}}
                    placeholder={placeholders[placeholderIndex]}
                    className="w-full min-h-[120px] sm:min-h-[140px] p-5 text-stone-800 dark:text-stone-100 text-base border-none outline-none resize-none bg-transparent placeholder-stone-400 dark:placeholder-stone-500 leading-relaxed rounded-2xl"
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = Math.min(target.scrollHeight, 300) + 'px';
                    }}
                  />
                  <div className="absolute bottom-3 left-5 text-xs text-stone-400 dark:text-stone-500">
                    {inputText.length} characters
                  </div>
                  {showWordWarning && (
                    <div className="absolute -bottom-6 left-0 right-0 text-center">
                      <span className="text-xs text-red-500">Please enter a research topic</span>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!isTextValid() || isSearchingCitations}
                  className={`w-full px-6 py-3.5 rounded-2xl flex items-center justify-center transition-all font-semibold text-sm shadow-sm ${
                    isTextValid() && !isSearchingCitations
                      ? 'bg-sky-500 hover:bg-sky-600 text-white cursor-pointer'
                      : 'bg-stone-100 dark:bg-stone-700 text-stone-400 dark:text-stone-500 cursor-not-allowed border border-stone-200 dark:border-stone-600'
                  }`}
                >
                  {isSearchingCitations ? (
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <>Find Sources</>
                  )}
                </button>
              </div>

              {/* Suggestions */}
              <div className="pt-2">
                <p className="text-sm font-medium text-stone-500 dark:text-stone-400 mb-2.5 text-center">Suggestions</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {suggestedTopics.map((topic, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setInputText(topic)}
                      className="px-4 py-2 bg-white dark:bg-stone-700/50 rounded-2xl border border-stone-200 dark:border-stone-600 text-stone-700 dark:text-stone-200 text-xs sm:text-sm font-medium hover:border-sky-300 dark:hover:border-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-all shadow-sm"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom: Video - See how it works */}
          <div className="relative order-2">
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
                className="w-full px-6 py-3.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-sky-500/25"
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
