import { useState, useEffect, useMemo, useRef } from 'react';
import Header from '../../common/Header';
import Footer from '../../common/Footer';
import ScholarMascot from '../../common/ScholarMascot';
import AnalysisAnimation from '../../common/AnalysisAnimation';
import { trackAction, trackCopy } from '../../../data/achievements';
import { getResetsInText } from '../../../utils/usageReset';

interface HumanizerPageProps {
  onNavigate: (page: string) => void;
  user?: any;
  onLogout: () => void;
}

const HumanizerPage = ({ onNavigate, user, onLogout }: HumanizerPageProps) => {
  const [inputText, setInputText] = useState('');
  const [humanizeMode, setHumanizeMode] = useState<'standard' | 'academic' | 'casual' | 'creative'>('standard');
  const [humanizeIntensity, setHumanizeIntensity] = useState<'light' | 'medium' | 'aggressive'>('medium');
  const [isHumanizing, setIsHumanizing] = useState(false);
  const [humanizedResult, setHumanizedResult] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [copied, setCopied] = useState(false);
  const [wordsUsed, setWordsUsed] = useState(0);
  const [wordLimit, setWordLimit] = useState(1000);
  const [error, setError] = useState('');
  const [showFakeAnimation, setShowFakeAnimation] = useState(false);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [showHighlights, setShowHighlights] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const placeholders = [
    "Paste your AI-generated text here to humanize it...",
    "Transform ChatGPT, Claude, or Gemini text...",
    "Make your text undetectable by AI checkers..."
  ];

  useEffect(() => {
    document.title = 'AI Humanizer – Free Tool to Humanize Your AI Text | WriteScholar';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Free AI Humanizer tool. Transform AI-generated content from ChatGPT, GPT-5, Gemini, Claude, LLaMA, and other AI models into clear, natural, human-like text. Bypass AI detectors instantly.');
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [placeholders.length]);

  useEffect(() => {
    if (user) {
      fetchUsage();
    }
  }, [user]);

  const fetchUsage = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/humanize-usage`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        // Backend returns { success, data: { wordsUsed, wordLimit, ... } }
        const usageData = result.data || result;
        setWordsUsed(usageData.wordsUsed || 0);
        setWordLimit(usageData.wordLimit || 1000);
      }
    } catch (error) {
      console.error('Error fetching usage:', error);
    }
  };

  const getWordDiff = (original: string, humanized: string) => {
    // Extract just the words (no whitespace) for comparison
    const originalWords = original.split(/\s+/).filter(Boolean);
    const humanizedTokens = humanized.split(/(\s+)/); // Keep whitespace for rendering
    
    // Normalize a word for comparison (lowercase, remove punctuation)
    const normalize = (word: string) => word.toLowerCase().replace(/[^\w]/g, '');
    
    // Build a Set of normalized original words for O(1) lookup
    const originalWordSet = new Set(originalWords.map(normalize));
    
    // Mark each humanized word as changed if it doesn't exist in original
    const result: { text: string; changed: boolean }[] = [];
    
    for (const token of humanizedTokens) {
      if (/^\s+$/.test(token)) {
        // Whitespace - not changed
        result.push({ text: token, changed: false });
      } else {
        // Word - check if it exists in original
        const normalizedToken = normalize(token);
        const existsInOriginal = originalWordSet.has(normalizedToken);
        result.push({ text: token, changed: !existsInOriginal });
      }
    }
    
    return result;
  };

  const highlightedResult = useMemo(() => {
    if (!showResult || !humanizedResult || !inputText) return [];
    return getWordDiff(inputText, humanizedResult);
  }, [showResult, humanizedResult, inputText]);

  const handleSubmit = async () => {
    if (!inputText.trim()) return;
    setError('');

    if (!user) {
      setShowFakeAnimation(true);
      setTimeout(() => {
        setShowFakeAnimation(false);
        setShowSignupPrompt(true);
      }, 2500);
      return;
    }

    try {
      setIsHumanizing(true);
      setShowResult(false);
      setHumanizedResult('');

      const token = localStorage.getItem('authToken');
      if (!token) {
        onNavigate('login');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/humanize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: inputText,
          mode: humanizeMode,
          intensity: humanizeIntensity
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setError(data.message || 'Word limit exceeded. Upgrade for more words.');
        } else {
          setError(data.message || 'Failed to humanize text');
        }
        return;
      }

      const result = data.data || data;
      setHumanizedResult(result.humanizedText || '');
      setShowResult(true);
      if (result.wordsUsed !== undefined) setWordsUsed(result.wordsUsed);
      if (result.wordLimit !== undefined) setWordLimit(result.wordLimit);
      trackAction('humanize_count');
    } catch (error) {
      console.error('Humanize error:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setIsHumanizing(false);
    }
  };

  const wordCount = inputText.trim().split(/\s+/).filter(Boolean).length;
  const outputWordCount = humanizedResult.split(/\s+/).filter(Boolean).length;
  const isFreeUser = !user || (user?.subscription_plan !== 'starter' && user?.subscription_plan !== 'premium' && user?.plan !== 'starter' && user?.plan !== 'premium');
  const maxWords = isFreeUser ? 1000 : 5000;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    if (!user) {
      setShowFakeAnimation(true);
      setTimeout(() => { setShowFakeAnimation(false); setShowSignupPrompt(true); }, 2500);
      return;
    }
    const token = localStorage.getItem('authToken');
    if (!token) { onNavigate('signup'); return; }
    setIsParsing(true);
    setError('');
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      console.log('[Humanizer] Uploading file:', file.name, 'size:', file.size, 'type:', file.type);
      console.log('[Humanizer] API URL:', apiUrl);
      console.log('[Humanizer] Token exists:', !!token);
      
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch(`${apiUrl}/analysis/parse-document`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      
      console.log('[Humanizer] Response status:', res.status);
      const data = await res.json();
      console.log('[Humanizer] Response data:', data);
      
      if (!res.ok) throw new Error(data.message || 'Failed to parse document');
      setInputText(data.data.content || '');
    } catch (err: any) {
      console.error('[Humanizer] Upload error:', err);
      setError(err.message || 'Failed to parse document');
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <div className="min-h-screen w-full min-w-0 flex flex-col bg-gradient-to-b from-stone-50 to-white dark:bg-stone-900 dark:from-stone-900 dark:to-stone-800">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="humanizer" sticky={true} />

      {/* Hero Section */}
      <section className="pt-6 sm:pt-16 pb-4 sm:pb-6">
        <div className="max-w-4xl mx-auto px-3 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            <div className="flex-shrink-0">
              <ScholarMascot size={100} animated={false} pose="default" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="inline-flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-4 sm:mb-5">
                <span className="inline-flex items-center px-2.5 sm:px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-[10px] sm:text-xs font-semibold uppercase tracking-wide">
                  Free Tool
                </span>
                {user && wordLimit >= 999999 ? (
                  <span className="inline-flex items-center px-2.5 sm:px-3 py-1 bg-violet-200/80 text-violet-800 rounded-full text-[10px] sm:text-xs font-semibold">
                    Unlimited words
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 sm:px-3 py-1 bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 rounded-full text-[10px] sm:text-xs font-semibold">
                    5,000 words/month free
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-4xl lg:text-5xl font-extrabold text-stone-800 dark:text-stone-100 mb-3 sm:mb-4 leading-tight px-1">
                AI Humanizer – Free Tool to Humanize Your AI Text
              </h1>
              <p className="text-sm sm:text-lg text-stone-600 dark:text-stone-400 leading-relaxed max-w-2xl">
                Transform AI-generated content from ChatGPT, GPT-5, Gemini, Claude, LLaMA, and other AI models into clear, natural, human-like text
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Editor Section */}
      <section className="flex-1 pb-8 sm:pb-16 px-0 sm:px-0 overflow-x-hidden">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 w-full min-w-0">
          {/* Editor Card */}
          <div className="bg-white dark:bg-stone-800 rounded-2xl sm:rounded-3xl shadow-xl shadow-stone-100/50 dark:shadow-none border border-stone-200 dark:border-stone-600 overflow-hidden min-w-0">
            {/* Toolbar */}
            <div className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border-b border-stone-200 dark:border-stone-600 px-3 sm:px-5 py-3 sm:py-4">
              <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0 overflow-x-auto sm:overflow-visible">
                  {/* Mode Selector */}
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                    <span className="text-xs font-medium text-stone-500 dark:text-stone-400 flex-shrink-0">Mode:</span>
                    <div className="flex items-center bg-white rounded-xl px-0.5 sm:px-1 py-1 shadow-sm border border-stone-200 dark:border-stone-600">
                    {([
                      { id: 'standard', label: 'Standard', tooltip: 'Natural college-student writing, clear and slightly informal' },
                      { id: 'academic', label: 'Academic', tooltip: 'Formal academic tone with technical terms, keeps citations' },
                      { id: 'casual', label: 'Casual', tooltip: 'Conversational tone, like explaining to a friend' },
                      { id: 'creative', label: 'Creative', tooltip: 'Personal essay style with varied rhythm' }
                    ] as const).map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setHumanizeMode(m.id)}
                        title={m.tooltip}
                        className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                          humanizeMode === m.id
                            ? 'bg-violet-600 text-white shadow-sm'
                            : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-600'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                    </div>
                  </div>
                  
                  {/* Intensity Selector */}
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                    <span className="text-xs font-medium text-stone-500 dark:text-stone-400 flex-shrink-0">Intensity:</span>
                    <div className="flex items-center bg-white rounded-xl px-0.5 sm:px-1 py-1 shadow-sm border border-stone-200 dark:border-stone-600">
                    {([
                      { id: 'light', label: 'Light', tooltip: 'Minimal changes (~15-20%), fixes obvious AI phrases' },
                      { id: 'medium', label: 'Medium', tooltip: 'Balanced rewrite (~40-50%), adds natural variation' },
                      { id: 'aggressive', label: 'Heavy', tooltip: 'Full rewrite, completely different wording, same meaning' }
                    ] as const).map((intensity) => (
                      <button
                        key={intensity.id}
                        onClick={() => setHumanizeIntensity(intensity.id)}
                        title={intensity.tooltip}
                        className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                          humanizeIntensity === intensity.id
                            ? 'bg-violet-600 text-white shadow-sm'
                            : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-600'
                        }`}
                      >
                        {intensity.label}
                      </button>
                    ))}
                    </div>
                  </div>
                </div>
                
                {/* Humanize Button */}
                <button
                  onClick={handleSubmit}
                  disabled={!inputText.trim() || isHumanizing || wordCount > maxWords}
                  className={`w-full sm:w-auto px-6 py-2.5 rounded-xl flex items-center justify-center transition-all font-semibold text-sm flex-shrink-0 ${
                    inputText.trim() && !isHumanizing
                      ? 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-200 hover:shadow-xl hover:shadow-violet-300 cursor-pointer transform hover:-translate-y-0.5'
                      : 'bg-stone-200 dark:bg-stone-600 text-stone-400 dark:text-stone-500 cursor-not-allowed'
                  }`}
                >
                  {isHumanizing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Humanizing...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Humanize
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Editor Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-stone-200 dark:divide-stone-600 min-w-0">
              {/* Left Panel - Input */}
              <div className="flex flex-col min-w-0">
                <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 bg-stone-50 dark:bg-stone-800/50 border-b border-stone-200 dark:border-stone-600 gap-2 min-w-0 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-2 h-2 rounded-full bg-stone-400 dark:bg-stone-500 flex-shrink-0"></div>
                    <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider truncate">Original</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
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
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-800/50 font-semibold text-sm transition-colors disabled:opacity-50 border border-violet-200 dark:border-violet-700"
                    >
                      {isParsing ? (
                        <span className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      )}
                      {isParsing ? 'Parsing...' : 'Upload Document'}
                    </button>
                    <button
                      onClick={() => navigator.clipboard.readText().then(text => setInputText(text))}
                      className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-stone-600 dark:text-stone-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/30 rounded-lg transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Paste
                    </button>
                    <button
                      onClick={() => setInputText('')}
                      className={`flex items-center gap-1.5 px-2 py-1.5 text-xs text-stone-600 dark:text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors ${!inputText ? 'invisible' : ''}`}
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <div className="relative flex-1 min-w-0">
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={placeholders[placeholderIndex]}
                    disabled={isHumanizing}
                    className="w-full min-w-0 h-full min-h-[240px] sm:min-h-[320px] md:min-h-[400px] p-3 sm:p-5 text-stone-800 dark:text-stone-100 text-[15px] border-none outline-none resize-none bg-transparent placeholder-stone-400 dark:placeholder-stone-500 leading-relaxed"
                  />
                  {isFocused && (
                    <div className="absolute inset-0 pointer-events-none border-2 border-violet-200 rounded-none" style={{ margin: '-1px' }}></div>
                  )}
                </div>
                <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 bg-stone-50/50 dark:bg-stone-800/30 border-t border-stone-200 dark:border-stone-600">
                  <span className={`text-xs font-medium ${wordCount > maxWords ? 'text-red-600' : 'text-stone-500 dark:text-stone-400'}`}>
                    {wordCount.toLocaleString()} words{wordCount > 0 && ` / ${maxWords.toLocaleString()} max`}
                    {wordCount > maxWords && isFreeUser && ' — Upgrade for 5,000 words'}
                  </span>
                  {!user && wordCount > 0 && (
                    <span className="text-xs text-stone-500 dark:text-stone-400">
                      <button onClick={() => onNavigate('pricing')} className="text-violet-600 dark:text-violet-400 hover:underline font-medium">Upgrade</button> for unlimited
                    </span>
                  )}
                </div>
              </div>

              {/* Right Panel - Output */}
              <div className="flex flex-col bg-gradient-to-br from-violet-50/30 to-purple-50/30 dark:from-violet-900/10 dark:to-purple-900/10 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-5 py-2.5 sm:py-3 bg-violet-50/50 dark:bg-violet-900/20 border-b border-violet-100/50 dark:border-violet-800/30 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-2 h-2 rounded-full bg-violet-400 flex-shrink-0"></div>
                    <span className="text-xs font-semibold text-violet-600 uppercase tracking-wider">Humanized</span>
                    {showResult && (
                      <span className="ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 bg-violet-100 text-violet-600 text-[10px] font-semibold rounded-full flex-shrink-0">
                        {highlightedResult.filter(w => w.changed && !/^\s+$/.test(w.text)).length} changes
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    {showResult && humanizedResult && (
                      <>
                        <button
                          onClick={() => setShowHighlights(!showHighlights)}
                          className={`flex items-center gap-1 sm:gap-1.5 text-xs font-medium transition-all px-1.5 sm:px-2 py-1 rounded-lg ${
                            showHighlights ? 'bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300' : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700'
                          }`}
                        >
                          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                          </svg>
                          <span className="hidden sm:inline">Highlights</span>
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(humanizedResult);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                            trackCopy();
                          }}
                          className={`flex items-center gap-1 text-xs font-medium transition-all ${
                            copied ? 'text-violet-600 dark:text-violet-400' : 'text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300'
                          }`}
                        >
                          {copied ? (
                            <>
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                              Copied!
                            </>
                          ) : (
                            <>
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                              Copy All
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex-1 min-h-[240px] sm:min-h-[320px] md:min-h-[400px] max-h-[280px] sm:max-h-[320px] md:max-h-[400px] overflow-y-auto overflow-x-hidden min-w-0">
                  {showResult && humanizedResult ? (
                    <div className="p-3 sm:p-5 text-stone-800 dark:text-stone-100 text-[15px] leading-relaxed break-words">
                      {showHighlights ? (
                        highlightedResult.map((item, index) => (
                          item.changed ? (
                            <span 
                              key={index} 
                              className="bg-violet-100/80 text-violet-900 underline decoration-violet-400/60 decoration-2 underline-offset-2 rounded-sm px-0.5"
                            >
                              {item.text}
                            </span>
                          ) : (
                            <span key={index}>{item.text}</span>
                          )
                        ))
                      ) : (
                        humanizedResult
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-stone-400 dark:text-stone-500 p-5">
                      {isHumanizing ? (
                        <div className="flex flex-col items-center gap-4">
                          <div className="relative">
                            <div className="w-12 h-12 border-4 border-violet-200 rounded-full"></div>
                            <div className="absolute top-0 left-0 w-12 h-12 border-4 border-violet-600 rounded-full border-t-transparent animate-spin"></div>
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium text-stone-600 dark:text-stone-400">Humanizing your text...</p>
                            <p className="text-xs text-stone-500 dark:text-stone-500 mt-1">This usually takes 5-10 seconds</p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-violet-100/50 dark:bg-violet-900/30 flex items-center justify-center">
                            <svg className="w-8 h-8 text-violet-300 dark:text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </div>
                          <p className="text-sm text-stone-500 dark:text-stone-400">Your humanized text will appear here</p>
                          <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">Paste text on the left and click Humanize</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 bg-violet-50/30 border-t border-violet-100/50">
                  <span className="text-xs text-gray-400 font-medium">
                    {showResult ? `${outputWordCount.toLocaleString()} words` : ''}
                  </span>
                  {showResult && humanizedResult && (
                    <button
                      onClick={() => { setShowResult(false); setHumanizedResult(''); }}
                      className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      Clear result
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Usage Bar (for logged in users) */}
            {user && (
              <div className="px-3 sm:px-5 py-3 sm:py-4 bg-stone-50 dark:bg-stone-800/50 border-t border-stone-200 dark:border-stone-600">
                <div className="flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-6 gap-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-stone-500 dark:text-stone-400">Monthly usage:</span>
                    {wordLimit >= 999999 ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-700">{wordsUsed.toLocaleString()} words used</span>
                        <span className="px-2 py-0.5 bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700 text-[10px] font-bold rounded-full">UNLIMITED</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-1.5 bg-stone-200 dark:bg-stone-600 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${wordsUsed / wordLimit > 0.9 ? 'bg-red-500' : 'bg-gradient-to-r from-violet-500 to-purple-500'}`}
                            style={{ width: `${Math.min(100, (wordsUsed / wordLimit) * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">{wordsUsed.toLocaleString()} / {wordLimit.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                  {wordLimit < 999999 && (
                    <>
                      <span className="text-[10px] text-stone-500 dark:text-stone-400">{getResetsInText()}</span>
                      <button
                        onClick={() => onNavigate('pricing')}
                        className="text-xs text-violet-600 hover:text-violet-700 font-semibold flex items-center gap-1 transition-colors"
                      >
                        Upgrade for unlimited
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-center max-w-xl mx-auto">
              <p className="text-red-700 dark:text-red-300 text-sm font-medium">{error}</p>
              {wordLimit < 999999 && (
                <>
                  <p className="text-red-600 dark:text-red-400 text-xs mt-1">{getResetsInText()}</p>
                  <button onClick={() => onNavigate('pricing')} className="mt-2 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors">
                    Upgrade for unlimited words/month
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Feature Cards */}
      <section className="py-10 sm:py-16 bg-white dark:bg-stone-800 border-t border-stone-200 dark:border-stone-600 overflow-x-hidden">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 w-full min-w-0">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl text-stone-800 mb-3" style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 400 }}>
              Why Use WriteScholar's AI Humanizer?
            </h2>
            <p className="text-stone-500 max-w-xl mx-auto">
              The most advanced AI text humanizer, trusted by thousands of students and professionals
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="group bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 rounded-2xl p-6 border border-indigo-200/70 dark:border-indigo-700/40 hover:shadow-lg hover:shadow-indigo-100/50 dark:hover:shadow-indigo-900/20 transition-all">
              <div className="w-12 h-12 bg-white dark:bg-stone-700 rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="font-bold text-stone-800 dark:text-stone-100 text-base mb-2">Smart Rewriting</h3>
              <p className="text-stone-600 dark:text-stone-400 text-sm leading-relaxed">Advanced sentence restructuring and natural tone adjustments.</p>
            </div>
            <div className="group bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-violet-200/70 dark:border-violet-700/40 hover:shadow-lg hover:shadow-violet-100/50 dark:hover:shadow-violet-900/20 transition-all">
              <div className="w-12 h-12 bg-white dark:bg-stone-700 rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="font-bold text-stone-800 dark:text-stone-100 text-base mb-2">4 Writing Modes</h3>
              <p className="text-stone-600 dark:text-stone-400 text-sm leading-relaxed">Standard, Academic, Casual, or Creative writing styles.</p>
            </div>
            <div className="group bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 rounded-2xl p-6 border border-indigo-200/70 dark:border-indigo-700/40 hover:shadow-lg hover:shadow-indigo-100/50 dark:hover:shadow-indigo-900/20 transition-all">
              <div className="w-12 h-12 bg-white dark:bg-stone-700 rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-bold text-stone-800 dark:text-stone-100 text-base mb-2">Bypasses Detectors</h3>
              <p className="text-stone-600 dark:text-stone-400 text-sm leading-relaxed">Passes GPTZero, Turnitin AI, ZeroGPT, Originality.ai.</p>
            </div>
            <div className="group bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-violet-200/70 dark:border-violet-700/40 hover:shadow-lg hover:shadow-violet-100/50 dark:hover:shadow-violet-900/20 transition-all">
              <div className="w-12 h-12 bg-white dark:bg-stone-700 rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-bold text-stone-800 dark:text-stone-100 text-base mb-2">Instant Results</h3>
              <p className="text-stone-600 dark:text-stone-400 text-sm leading-relaxed">Get humanized text in seconds, not minutes.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SEO Content Section */}
      <section className="py-10 sm:py-16 bg-stone-50 border-t border-stone-100 overflow-x-hidden">
        <div className="max-w-4xl mx-auto px-3 sm:px-6 w-full min-w-0">
          <h2 className="text-xl font-extrabold text-stone-800 dark:text-stone-100 mb-4 text-center">
            Humanize Text from Any AI Model
          </h2>
          <p className="text-stone-600 mb-8 leading-relaxed text-center max-w-2xl mx-auto">
            Our AI humanizer works with content from all major AI writing tools including <strong>ChatGPT</strong>, <strong>GPT-4</strong>, <strong>GPT-5</strong>, <strong>Google Gemini</strong>, <strong>Anthropic Claude</strong>, <strong>Meta LLaMA</strong>, <strong>Mistral</strong>, <strong>Perplexity</strong>, and more.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {['ChatGPT', 'GPT-4 / GPT-5', 'Gemini', 'Claude', 'LLaMA', 'Mistral', 'Perplexity', 'Jasper AI'].map((model) => (
              <div key={model} className="py-3 px-4 bg-white dark:bg-stone-800 rounded-xl text-sm text-stone-600 dark:text-stone-300 font-medium text-center border border-stone-200 dark:border-stone-600 shadow-sm">
                {model}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fake Animation for Non-Logged Users */}
      {showFakeAnimation && (
        <AnalysisAnimation 
          text="Humanizing your text"
          onComplete={() => {}}
        />
      )}

      {/* Signup Prompt Modal */}
      {showSignupPrompt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-800 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-600 max-w-md w-full p-8 text-center relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowSignupPrompt(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="w-20 h-20 bg-gradient-to-br from-violet-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h3 className="text-2xl font-bold text-stone-800 mb-2">Almost There!</h3>
            <p className="text-stone-500 dark:text-stone-400 mb-6">
              Sign up for free to humanize your text. Get <span className="font-semibold text-violet-600 dark:text-violet-400">5,000 words/month</span> completely free!
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => onNavigate('signup')}
                className="w-full px-6 py-3.5 bg-violet-500 hover:bg-violet-600 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-violet-500/25"
              >
                Sign Up Free
              </button>
              <button
                onClick={() => { setShowSignupPrompt(false); onNavigate('login'); }}
                className="w-full px-6 py-3 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 font-medium rounded-xl transition-colors"
              >
                Already have an account? <span className="text-violet-600 dark:text-violet-400">Log in</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default HumanizerPage;
