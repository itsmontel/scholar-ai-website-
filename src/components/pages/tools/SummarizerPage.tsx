import { useState, useEffect, useRef } from 'react';
import Header from '../../common/Header';
import Footer from '../../common/Footer';
import ScholarMascot from '../../common/ScholarMascot';
import AnalysisAnimation from '../../common/AnalysisAnimation';
import { trackAction, trackCopy } from '../../../data/achievements';
import { getResetsInText } from '../../../utils/usageReset';

interface SummarizerPageProps {
  onNavigate: (page: string) => void;
  user?: any;
  onLogout?: () => void;
}

interface SummaryResult {
  summary: string;
  style: string;
  length: string;
  originalWordCount: number;
  summaryWordCount: number;
}

const SummarizerPage = ({ onNavigate, user, onLogout }: SummarizerPageProps) => {
  const [inputText, setInputText] = useState('');
  const [summaryResult, setSummaryResult] = useState<SummaryResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [style, setStyle] = useState<'bullet' | 'paragraph' | 'tldr' | 'detailed'>('bullet');
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [showFakeAnimation, setShowFakeAnimation] = useState(false);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [daysUntilReset, setDaysUntilReset] = useState<number | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPremiumUser = user && (user.subscription_plan === 'premium' || user.plan === 'premium');
  const isFreeUser = !user || (user?.subscription_plan !== 'pro' && user?.subscription_plan !== 'premium' && user?.plan !== 'pro' && user?.plan !== 'premium');
  const maxWords = isFreeUser ? 5000 : 5000;
  const userPlan = user?.subscription_plan || user?.plan || 'free';
  const wordCount = inputText.trim().split(/\s+/).filter(Boolean).length;

  useEffect(() => {
    document.title = 'AI Summarizer – Condense Papers & Articles | WriteScholar';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Transform lengthy papers, articles, and research documents into concise key points. Perfect for literature reviews and quick comprehension. Premium AI tool.');
    }
  }, []);

  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('authToken');
      if (token) {
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/summarize-usage`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
          .then(r => r.json())
          .then(data => { if (data.success && data.data?.daysUntilReset != null) setDaysUntilReset(data.data.daysUntilReset); })
          .catch(() => {});
      }
    }
  }, [user]);

  useEffect(() => {
    const saved = localStorage.getItem('summarizerOpenData');
    if (!saved) return;
    try {
      const data = JSON.parse(saved);
      localStorage.removeItem('summarizerOpenData');
      if (data.inputText) setInputText(data.inputText);
      if (data.summaryResult) setSummaryResult(data.summaryResult);
      if (data.summaryStyle) setStyle(data.summaryStyle);
      if (data.summaryLength) setLength(data.summaryLength);
    } catch (_) {
      localStorage.removeItem('summarizerOpenData');
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
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/summarize`, {
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
      trackAction('summaries_count');
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
      trackCopy();
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    if (!user) {
      setShowFakeAnimation(true);
      setTimeout(() => { setShowFakeAnimation(false); setShowSignupPrompt(true); }, 2500);
      return;
    }
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    if (!token) { onNavigate('signup'); return; }
    setIsParsing(true);
    setError(null);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      console.log('[Summarizer] Uploading file:', file.name, 'size:', file.size, 'type:', file.type);
      console.log('[Summarizer] API URL:', apiUrl);
      console.log('[Summarizer] Token exists:', !!token);
      
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch(`${apiUrl}/analysis/parse-document`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      
      console.log('[Summarizer] Response status:', res.status);
      const data = await res.json();
      console.log('[Summarizer] Response data:', data);
      
      if (!res.ok) throw new Error(data.message || 'Failed to parse document');
      setInputText(data.data.content || '');
    } catch (err: any) {
      console.error('[Summarizer] Upload error:', err);
      setError(err.message || 'Failed to parse document');
    } finally {
      setIsParsing(false);
    }
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
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-stone-50 to-white dark:bg-stone-900 dark:from-stone-900 dark:to-stone-800">
        <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="summarizer" />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AnalysisAnimation message="Preparing your summary..." />
            <p className="text-stone-500 dark:text-stone-400 mt-4">Please wait...</p>
          </div>
        </main>
        <Footer onNavigate={onNavigate} />
      </div>
    );
  }

  if (showSignupPrompt) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-stone-50 to-white dark:bg-stone-900 dark:from-stone-900 dark:to-stone-800">
        <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="summarizer" />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white dark:bg-stone-800 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-600 p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <span className="text-3xl">📝</span>
            </div>
            <h2 className="text-2xl font-extrabold text-stone-800 dark:text-stone-100 mb-2">Sign Up to Continue</h2>
            <p className="text-stone-600 dark:text-stone-400 mb-6">Create a free account to access the AI Summarizer and other premium tools.</p>
            <div className="space-y-3">
              <button
                onClick={() => onNavigate('signup')}
                className="w-full py-3 px-4 bg-violet-500 hover:bg-violet-600 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-violet-500/25"
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
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-stone-50 to-white dark:bg-stone-900 dark:from-stone-900 dark:to-stone-800">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="summarizer" />
      
      <main className="flex-1 w-full min-w-0 overflow-x-hidden">
        {/* Hero Section */}
        <div className="pt-6 sm:pt-10 pb-4 sm:pb-8 px-3 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
              <div className="flex-shrink-0">
                <ScholarMascot size={100} animated={false} pose="default" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3 mb-3 sm:mb-4 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-semibold shadow-lg shadow-emerald-500/30">
                    👑 Premium Tool
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                    ✨ AI-Powered
                  </span>
                </div>
                <h1 className="text-2xl sm:text-4xl lg:text-5xl text-stone-800 dark:text-stone-100 mb-3 sm:mb-4 leading-tight" style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 400 }}>
                  AI <span className="text-emerald-600 dark:text-emerald-400 italic">Summarizer</span>
                </h1>
                <p className="text-sm sm:text-lg text-stone-600 max-w-2xl leading-relaxed">
                  Transform lengthy papers, articles, and documents into concise key points. 
                  Perfect for literature reviews, research synthesis, and quick comprehension.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Editor */}
        <div className="pb-8 sm:pb-16 px-0 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white dark:bg-stone-800 rounded-2xl sm:rounded-3xl shadow-xl shadow-stone-100/50 dark:shadow-none border border-stone-200 dark:border-stone-600 overflow-hidden min-w-0">
              {/* Toolbar */}
              <div className="border-b border-stone-200 dark:border-stone-600 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 px-3 sm:px-5 py-3 sm:py-4">
                <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0 overflow-x-auto sm:overflow-visible">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                      <span className="text-xs font-medium text-stone-500 dark:text-stone-400 flex-shrink-0">Style:</span>
                      <div className="flex items-center bg-white dark:bg-stone-700 rounded-xl px-0.5 sm:px-1 py-1 shadow-sm border border-stone-200 dark:border-stone-600">
                        {styleOptions.map((opt) => {
                          const locked = user != null && !isPremiumUser && opt.value !== 'bullet';
                          return (
                            <button
                              key={opt.value}
                              onClick={() => !locked && setStyle(opt.value as any)}
                              disabled={locked}
                              title={locked ? 'Premium only' : opt.description}
                              className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                                locked ? 'text-stone-400 dark:text-stone-500 cursor-not-allowed' :
                                style === opt.value ? 'bg-emerald-600 text-white shadow-sm' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-600'
                              }`}
                            >
                              {opt.label}
                              {locked && <span className="ml-1 text-[9px]">🔒</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                      <span className="text-xs font-medium text-stone-500 dark:text-stone-400 flex-shrink-0">Length:</span>
                      <div className="flex items-center bg-white dark:bg-stone-700 rounded-xl px-0.5 sm:px-1 py-1 shadow-sm border border-stone-200 dark:border-stone-600">
                        {lengthOptions.map((opt) => {
                          const locked = user != null && !isPremiumUser && opt.value !== 'medium';
                          return (
                            <button
                              key={opt.value}
                              onClick={() => !locked && setLength(opt.value as any)}
                              disabled={locked}
                              title={locked ? 'Premium only' : opt.description}
                              className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                                locked ? 'text-stone-400 dark:text-stone-500 cursor-not-allowed' :
                                length === opt.value ? 'bg-emerald-600 text-white shadow-sm' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-600'
                              }`}
                            >
                              {opt.label}
                              {locked && <span className="ml-1 text-[9px]">🔒</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleSummarize}
                    disabled={isLoading || !inputText.trim() || wordCount < 50 || wordCount > maxWords}
                    className={`w-full sm:w-auto px-6 py-2.5 rounded-xl flex items-center justify-center transition-all font-semibold text-sm flex-shrink-0 ${
                      !isLoading && inputText.trim() && wordCount >= 50 && wordCount <= maxWords
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-200/50 dark:shadow-emerald-900/30 cursor-pointer'
                        : 'bg-stone-200 dark:bg-stone-600 text-stone-400 dark:text-stone-500 cursor-not-allowed'
                    }`}
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
              <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-stone-200 dark:divide-stone-600">
                {/* Left Panel: Input */}
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 bg-stone-50 dark:bg-stone-800/50 border-b border-stone-200 dark:border-stone-600">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-stone-400 dark:bg-stone-500"></div>
                      <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Original</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isParsing}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-800/50 font-semibold text-sm transition-colors disabled:opacity-50 border border-emerald-200 dark:border-emerald-700"
                        title="Upload PDF, Word, or TXT"
                      >
                        {isParsing ? (
                          <span className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        )}
                        {isParsing ? 'Parsing...' : 'Upload Document'}
                      </button>
                      <button
                        onClick={handlePaste}
                        className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-stone-600 dark:text-stone-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                        title="Paste from clipboard"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Paste
                      </button>
                      <button
                        onClick={handleClear}
                        className={`flex items-center gap-1.5 px-2 py-1.5 text-xs text-stone-600 dark:text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors ${!inputText ? 'invisible' : ''}`}
                        title="Clear text"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="relative flex-1">
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Paste your article, paper, or document here... (minimum 50 words)"
                      className="w-full h-full min-h-[240px] sm:min-h-[350px] p-3 sm:p-5 text-stone-800 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 resize-none focus:outline-none text-sm sm:text-base leading-relaxed break-words"
                    />
                  </div>
                  <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 bg-stone-50/50 dark:bg-stone-800/30 border-t border-stone-200 dark:border-stone-600">
                    <span className={`text-xs font-medium ${wordCount < 50 ? 'text-amber-600' : wordCount > maxWords ? 'text-red-600' : 'text-stone-500 dark:text-stone-400'}`}>
                      {wordCount.toLocaleString()} words / {maxWords.toLocaleString()} max
                      {wordCount < 50 && ' (min 50)'}
                      {wordCount > maxWords && isFreeUser && ' — Upgrade for 5,000'}
                    </span>
                  </div>
                </div>

                {/* Right Panel: Summary */}
                <div className="flex flex-col bg-gradient-to-br from-emerald-50/30 to-teal-50/30 dark:from-emerald-900/10 dark:to-teal-900/10">
                  <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 bg-emerald-50/50 dark:bg-emerald-900/20 border-b border-emerald-100/50 dark:border-emerald-800/30">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Summary</span>
                      {summaryResult && (
                        <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-800/50 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold rounded-full">
                          {Math.round((1 - summaryResult.summaryWordCount / summaryResult.originalWordCount) * 100)}% shorter
                        </span>
                      )}
                    </div>
                    {summaryResult && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={handleCopy}
                          className="p-1.5 text-stone-400 dark:text-stone-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                          title="Copy to clipboard"
                        >
                          {copied ? (
                            <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                          className="p-1.5 text-stone-400 dark:text-stone-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
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
                      <div className="h-full flex flex-col items-center justify-center text-stone-400 dark:text-stone-500">
                        <span className="text-4xl mb-3 opacity-30">📄</span>
                        <p className="text-sm">Your summary will appear here</p>
                      </div>
                    )}
                  </div>
                  {summaryResult && (
                    <div className="px-3 sm:px-5 py-2.5 sm:py-3 border-t border-stone-200 dark:border-stone-600 bg-white/50 dark:bg-stone-800/50">
                      <div className="flex items-center justify-between text-xs sm:text-sm text-stone-500 dark:text-stone-400">
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
              <div className="mt-4 mx-3 sm:mx-0 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center flex-shrink-0">
                  <span className="text-red-600 dark:text-red-400 text-xs">!</span>
                </div>
                <div className="flex-1">
                  <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
                  {!isPremiumUser && user && (
                    <>
                      <p className="text-red-600 dark:text-red-400 text-xs mt-1">{getResetsInText()}</p>
                      <button
                        onClick={() => onNavigate('pricing')}
                        className="mt-2 px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-medium rounded-lg hover:from-emerald-500 hover:to-teal-500 transition-all inline-flex items-center gap-2"
                      >
                        👑 Upgrade Now
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Plan Info for non-premium users */}
            {user && !isPremiumUser && (
              <div className="mt-6 mx-3 sm:mx-0">
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-700/50 rounded-2xl p-5 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📝</span>
                    <div>
                      <p className="text-emerald-800 dark:text-emerald-200 font-medium text-sm">
                        {userPlan === 'free' ? `Free plan: 5,000 words/month • Bullet + Medium only • ${getResetsInText(daysUntilReset)}` : 'Pro plan: 999,999 words/month • Bullet + Medium only'}
                      </p>
                      <p className="text-emerald-600 dark:text-emerald-400 text-xs mt-0.5">Upgrade to Premium for all styles, lengths, and our premium AI model</p>
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigate('pricing')}
                    className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-semibold rounded-lg hover:from-emerald-500 hover:to-teal-500 transition-all"
                  >
                    👑 View Plans
                  </button>
                </div>
              </div>
            )}

            {/* See how it works - Video */}
            <div className="mt-8 sm:mt-10">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-lg font-bold text-stone-800 dark:text-stone-100">See how it works</h2>
                <span className="h-px flex-1 max-w-32 bg-gradient-to-r from-emerald-300/60 to-transparent dark:from-emerald-500/40 rounded-full" />
              </div>
              <div className="relative bg-white dark:bg-stone-800 rounded-2xl overflow-hidden shadow-xl shadow-stone-200/50 dark:shadow-stone-900/50 border border-stone-200/60 dark:border-stone-600/50 max-w-3xl mx-auto">
                <div className="bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-900/20 dark:to-teal-900/20 flex items-center justify-center aspect-video min-h-[200px] sm:min-h-[320px]">
                  <video autoPlay loop muted playsInline className="w-full h-full object-contain" aria-label="See how the AI Summarizer works">
                    <source src="/summarisevid.mp4" type="video/mp4" />
                  </video>
                </div>
                <div className="px-4 py-3.5 border-t border-stone-100 dark:border-stone-700/80">
                  <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">AI Summarizer</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">Paste text or upload a document, choose your style and length, and get a concise summary in seconds.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-white border-t border-stone-100">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-stone-800 dark:text-stone-100 mb-8 sm:mb-12">
              Why Use Our <span className="text-emerald-600 dark:text-emerald-400 italic">AI Summarizer</span>?
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
                <div key={idx} className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-6 rounded-2xl border border-emerald-200/70 dark:border-emerald-700/40 hover:shadow-lg hover:shadow-emerald-100/50 dark:hover:shadow-emerald-900/20 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/30 text-2xl">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-stone-800 dark:text-stone-100 mb-2">{feature.title}</h3>
                  <p className="text-stone-600 dark:text-stone-400 text-sm leading-relaxed">{feature.description}</p>
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
