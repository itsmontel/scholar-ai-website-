import { useState, useEffect } from 'react';
import Header from '../../common/Header';
import Footer from '../../common/Footer';
import AnalysisAnimation from '../../common/AnalysisAnimation';

interface SummarizerPageProps {
  onNavigate: (page: string) => void;
  user?: any;
}

interface SummaryResult {
  summary: string;
  style: string;
  length: string;
  originalWordCount: number;
  summaryWordCount: number;
}

const SummarizerPage = ({ onNavigate, user }: SummarizerPageProps) => {
  const [inputText, setInputText] = useState('');
  const [summaryResult, setSummaryResult] = useState<SummaryResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [style, setStyle] = useState<'bullet' | 'paragraph' | 'tldr' | 'detailed'>('bullet');
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [showFakeAnimation, setShowFakeAnimation] = useState(false);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);

  const isPremiumUser = user && (user.subscription_plan === 'premium' || user.plan === 'premium');
  const userPlan = user?.subscription_plan || user?.plan || 'free';
  const wordCount = inputText.trim().split(/\s+/).filter(Boolean).length;

  useEffect(() => {
    document.title = 'AI Summarizer – Condense Papers & Articles | WriteScholar';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Transform lengthy papers, articles, and research documents into concise key points. Perfect for literature reviews and quick comprehension. Premium AI tool.');
    }
  }, []);

  const handleSummarize = async () => {
    if (!inputText.trim()) return;

    if (!user) {
      setShowFakeAnimation(true);
      setTimeout(() => {
        setShowFakeAnimation(false);
        setShowSignupPrompt(true);
      }, 2500);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch('/api/analysis/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          text: inputText,
          style,
          length
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to summarize text');
      }

      setSummaryResult(data.data);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (summaryResult?.summary) {
      await navigator.clipboard.writeText(summaryResult.summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputText(text);
    } catch (err) {
      console.error('Failed to paste:', err);
    }
  };

  const handleClear = () => {
    setInputText('');
    setSummaryResult(null);
    setError(null);
  };

  const handleDownload = () => {
    if (!summaryResult?.summary) return;
    const blob = new Blob([summaryResult.summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `summary-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const styleOptions = [
    { value: 'bullet', label: 'Bullet', description: 'Key points as clear bullets' },
    { value: 'paragraph', label: 'Paragraph', description: 'Flowing paragraph summary' },
    { value: 'tldr', label: 'TL;DR', description: 'Ultra-concise + key takeaways' },
    { value: 'detailed', label: 'Detailed', description: 'Comprehensive structured summary' }
  ];

  const lengthOptions = [
    { value: 'short', label: 'Short', description: '3-5 key points' },
    { value: 'medium', label: 'Medium', description: '5-8 key points' },
    { value: 'long', label: 'Long', description: '8-12 key points' }
  ];

  if (showFakeAnimation) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #FAF8F5 0%, #F5F3F0 100%)' }}>
        <Header onNavigate={onNavigate} user={user} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AnalysisAnimation message="Preparing your summary..." />
            <p className="text-gray-500 mt-4">Please wait...</p>
          </div>
        </main>
        <Footer onNavigate={onNavigate} />
      </div>
    );
  }

  if (showSignupPrompt) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #FAF8F5 0%, #F5F3F0 100%)' }}>
        <Header onNavigate={onNavigate} user={user} />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl flex items-center justify-center">
              <span className="text-3xl">📝</span>
            </div>
            <h2 className="text-2xl font-bold text-stone-800 mb-2">Sign Up to Continue</h2>
            <p className="text-stone-600 mb-6">Create a free account to access the AI Summarizer and other premium tools.</p>
            <div className="space-y-3">
              <button
                onClick={() => onNavigate('signup')}
                className="w-full py-3 px-4 bg-lime-400 text-stone-900 font-semibold rounded-full hover:bg-lime-300 transition-all"
              >
                Sign Up Free
              </button>
              <button
                onClick={() => onNavigate('login')}
                className="w-full py-3 px-4 bg-stone-100 text-stone-700 font-semibold rounded-full hover:bg-stone-200 transition-all"
              >
                Log In
              </button>
              <button
                onClick={() => setShowSignupPrompt(false)}
                className="text-stone-500 hover:text-stone-700 text-sm"
              >
                ← Back to Summarizer
              </button>
            </div>
          </div>
        </main>
        <Footer onNavigate={onNavigate} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #FAF8F5 0%, #F5F3F0 100%)' }}>
      <Header onNavigate={onNavigate} user={user} />
      
      <main className="flex-1 w-full min-w-0 overflow-x-hidden">
        {/* Hero Section */}
        <div className="pt-6 sm:pt-10 pb-4 sm:pb-8 px-3 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-xs font-semibold shadow-lg shadow-teal-200/50">
                👑 Premium Tool
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                ✨ AI-Powered
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-4xl lg:text-5xl text-stone-800 mb-3 sm:mb-4 leading-tight" style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 400 }}>
              AI <span className="text-lime-600 italic">Summarizer</span>
            </h1>
            
            <p className="text-sm sm:text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed px-2">
              Transform lengthy papers, articles, and documents into concise key points. 
              Perfect for literature reviews, research synthesis, and quick comprehension.
            </p>
          </div>
        </div>

        {/* Main Editor */}
        <div className="pb-8 sm:pb-16 px-0 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-gray-100 overflow-hidden min-w-0">
              {/* Toolbar */}
              <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-3 sm:px-5 py-3 sm:py-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                  {/* Style Selector */}
                  <div className="flex items-center gap-2 min-w-0 overflow-x-auto w-full sm:w-auto">
                    <span className="text-xs font-medium text-gray-500 whitespace-nowrap">Style:</span>
                    <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
                      {styleOptions.map((opt) => {
                        const locked = user != null && !isPremiumUser && opt.value !== 'bullet';
                        return (
                          <button
                            key={opt.value}
                            onClick={() => !locked && setStyle(opt.value as any)}
                            disabled={locked}
                            title={locked ? 'Premium only' : opt.description}
                            className={`px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                              locked ? 'text-gray-300 cursor-not-allowed' :
                              style === opt.value
                                ? 'bg-white text-teal-700 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                          >
                            {opt.label}
                            {locked && <span className="ml-1 text-[9px]">🔒</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Length Selector */}
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-medium text-gray-500 whitespace-nowrap">Length:</span>
                    <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
                      {lengthOptions.map((opt) => {
                        const locked = user != null && !isPremiumUser && opt.value !== 'medium';
                        return (
                          <button
                            key={opt.value}
                            onClick={() => !locked && setLength(opt.value as any)}
                            disabled={locked}
                            title={locked ? 'Premium only' : opt.description}
                            className={`px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                              locked ? 'text-gray-300 cursor-not-allowed' :
                              length === opt.value
                                ? 'bg-white text-teal-700 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                          >
                            {opt.label}
                            {locked && <span className="ml-1 text-[9px]">🔒</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Summarize Button */}
                  <button
                    onClick={handleSummarize}
                    disabled={isLoading || !inputText.trim() || wordCount < 50}
                    className="w-full sm:w-auto sm:ml-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-teal-200/50 text-sm"
                  >
                    {isLoading ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Summarizing...</span>
                      </>
                    ) : (
                      <>
                        <span>✨</span>
                        <span>Summarize</span>
                        <span>→</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Two-panel layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
                {/* Left Panel: Input */}
                <div className="flex flex-col">
                  <div className="px-3 sm:px-5 py-2.5 sm:py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50/50 to-transparent flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                      <span className="text-sm font-semibold text-gray-700">Original Text</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={handlePaste}
                        className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                        title="Paste from clipboard"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </button>
                      <button
                        onClick={handleClear}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Clear text"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="relative flex-1">
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Paste your article, paper, or document here... (minimum 50 words)"
                      className="w-full h-full min-h-[240px] sm:min-h-[350px] p-3 sm:p-5 text-gray-800 placeholder-gray-400 resize-none focus:outline-none text-sm sm:text-base leading-relaxed break-words"
                    />
                  </div>
                  <div className="px-3 sm:px-5 py-2.5 sm:py-3 border-t border-gray-100 bg-gray-50/50">
                    <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500">
                      <span className={wordCount < 50 ? 'text-amber-600' : ''}>{wordCount.toLocaleString()} words</span>
                      {wordCount < 50 && <span className="text-amber-600">Minimum 50 words</span>}
                    </div>
                  </div>
                </div>

                {/* Right Panel: Summary */}
                <div className="flex flex-col bg-gradient-to-br from-teal-50/30 to-emerald-50/30">
                  <div className="px-3 sm:px-5 py-2.5 sm:py-3 border-b border-gray-100 bg-gradient-to-r from-teal-50/50 to-transparent flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      <span className="text-sm font-semibold text-gray-700">Summary</span>
                      {summaryResult && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                          {Math.round((1 - summaryResult.summaryWordCount / summaryResult.originalWordCount) * 100)}% shorter
                        </span>
                      )}
                    </div>
                    {summaryResult && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={handleCopy}
                          className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                          title="Copy to clipboard"
                        >
                          {copied ? (
                            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                        <button
                          onClick={handleDownload}
                          className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                          title="Download summary"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 p-3 sm:p-5 min-h-[240px] sm:min-h-[350px] max-h-[350px] sm:max-h-[400px] overflow-y-auto">
                    {isLoading ? (
                      <div className="h-full flex items-center justify-center">
                        <AnalysisAnimation message="Analyzing and summarizing..." />
                      </div>
                    ) : summaryResult ? (
                      <div className="prose prose-sm sm:prose max-w-none text-gray-700 whitespace-pre-wrap break-words">
                        {summaryResult.summary}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <span className="text-4xl mb-3 opacity-30">📄</span>
                        <p className="text-sm">Your summary will appear here</p>
                      </div>
                    )}
                  </div>
                  {summaryResult && (
                    <div className="px-3 sm:px-5 py-2.5 sm:py-3 border-t border-gray-100 bg-white/50">
                      <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500">
                        <span>{summaryResult.summaryWordCount.toLocaleString()} words</span>
                        <span className="capitalize">{summaryResult.style} • {summaryResult.length}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 mx-3 sm:mx-0 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-red-600 text-xs">!</span>
                </div>
                <div className="flex-1">
                  <p className="text-red-800 text-sm">{error}</p>
                  {!isPremiumUser && user && (
                    <button
                      onClick={() => onNavigate('pricing')}
                      className="mt-2 px-4 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-sm font-medium rounded-lg hover:from-teal-700 hover:to-emerald-700 transition-all inline-flex items-center gap-2"
                    >
                      👑 Upgrade Now
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Plan Info for non-premium users */}
            {user && !isPremiumUser && (
              <div className="mt-6 mx-3 sm:mx-0">
                <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-2xl p-5 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📝</span>
                    <div>
                      <p className="text-teal-800 font-medium text-sm">
                        {userPlan === 'free' ? 'Free plan: 1,000 words/month • Bullet + Medium only' : 'Starter plan: 999,999 words/month • Bullet + Medium only'}
                      </p>
                      <p className="text-teal-600 text-xs mt-0.5">Upgrade to Premium for all styles, lengths, and our premium AI model</p>
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigate('pricing')}
                    className="px-4 py-1.5 bg-teal-600 text-white text-xs font-semibold rounded-lg hover:bg-teal-700 transition-all"
                  >
                    👑 View Plans
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Features Section */}
        <div className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-white border-t border-stone-100">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl sm:text-3xl text-center text-stone-800 mb-8 sm:mb-12" style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 400 }}>
              Why Use Our <span className="text-lime-600 italic">AI Summarizer</span>?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {[
                {
                  icon: '📚',
                  title: 'Literature Reviews',
                  description: 'Quickly digest dozens of papers for your research. Extract key findings and methodology in seconds.'
                },
                {
                  icon: '⭐',
                  title: 'Multiple Formats',
                  description: 'Choose bullet points, paragraphs, TL;DR, or detailed structured summaries based on your needs.'
                },
                {
                  icon: '⚡',
                  title: 'Save Hours',
                  description: 'Reduce a 20-page paper to key insights in under a minute. Focus on what matters most.'
                }
              ].map((feature, idx) => (
                <div key={idx} className="bg-gradient-to-br from-stone-50 to-white p-6 rounded-2xl border border-stone-200 hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 rounded-xl bg-lime-400 flex items-center justify-center mb-4 shadow-lg shadow-lime-200/50 text-2xl">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-stone-800 mb-2">{feature.title}</h3>
                  <p className="text-stone-600 text-sm leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default SummarizerPage;
