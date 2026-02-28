import { useState, useEffect } from 'react';
import Header from '../common/Header';
import Footer from '../common/Footer';
import { DocumentCardSkeleton } from '../common/LoadingSpinner';
import AnalysisAnimation from '../common/AnalysisAnimation';

interface DashboardProps {
  onNavigate: (page: string) => void;
  user: any;
  onLogout: () => void;
}

const Dashboard = ({ onNavigate, user, onLogout }: DashboardProps) => {
  const [inputText, setInputText] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [showWordWarning, setShowWordWarning] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAnalysisPopup, setShowAnalysisPopup] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [mode, setMode] = useState<'analyze' | 'citations'>('analyze');
  const [citationStyle, setCitationStyle] = useState('APA');
  const [citationYearRange, setCitationYearRange] = useState('all');
  const [isSearchingCitations, setIsSearchingCitations] = useState(false);
  const [showSearchAnimation, setShowSearchAnimation] = useState(false);
  const [usageStats, setUsageStats] = useState({
    documentsUploaded: 0,
    documentsAnalyzed: 0,
    storageUsed: 0,
    storageLimit: 0,
    uploadsRemaining: 0,
    analysesRemaining: 0,
    plan: 'free',
    planLimits: {
      documentsPerMonth: 3,
      analysesPerMonth: 3,
      maxDocumentSize: 1024 * 1024,
      name: 'Free'
    }
  });
  const [loadingStats, setLoadingStats] = useState(true);

  const analyzePlaceholders = [
    "Paste your essay or research paper here...",
    "Get instant AI feedback on your writing...",
    "Improve your academic writing in seconds..."
  ];

  const citationPlaceholders = [
    "Enter your research topic to find citations...",
    "What are you researching? Find sources instantly...",
    "Type your essay question and discover literature..."
  ];

  const placeholders = mode === 'analyze' ? analyzePlaceholders : citationPlaceholders;

  const suggestedTopics = mode === 'analyze' ? [
    "Analyze my essay structure",
    "Check my thesis statement",
    "Review my argument flow",
    "Improve my conclusion"
  ] : [
    "Effects of social media on teenagers",
    "Climate change mitigation strategies",
    "AI in healthcare applications",
    "Remote work productivity research"
  ];

  // Character illustration component - positioned outside the text area
  // Mobile: head only, top-right corner | Desktop: full body with pointing arm
  const CharacterIllustration = () => (
    <>
      {/* Mobile version - head only, positioned top-right */}
      <div className="absolute -right-2 -top-10 w-14 h-14 sm:hidden pointer-events-none z-10">
        <svg viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Head */}
          <circle cx="35" cy="38" r="22" fill="#FCD9B6" />
          {/* Hair */}
          <path d="M13 32 Q15 12 35 16 Q55 12 57 32 Q61 22 49 18 Q35 8 21 18 Q9 22 13 32" fill="#4B5563" />
          {/* Eyes */}
          <circle cx="27" cy="36" r="3.5" fill="#1F2937" />
          <circle cx="43" cy="36" r="3.5" fill="#1F2937" />
          <circle cx="28" cy="34.5" r="1.2" fill="white" />
          <circle cx="44" cy="34.5" r="1.2" fill="white" />
          {/* Eyebrows */}
          <path d="M22 28 Q27 25 32 28" stroke="#4B5563" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M38 28 Q43 25 48 28" stroke="#4B5563" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          {/* Smile */}
          <path d="M27 48 Q35 55 43 48" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round" />
          {/* Cheeks (blush) */}
          <circle cx="20" cy="44" r="3" fill="#FECACA" opacity="0.5" />
          <circle cx="50" cy="44" r="3" fill="#FECACA" opacity="0.5" />
        </svg>
      </div>
      
      {/* Tablet/Desktop version - full body with arm */}
      <div className="absolute hidden sm:block sm:right-4 sm:top-0 sm:w-24 sm:h-32 xl:-right-28 xl:w-24 xl:h-32 pointer-events-none z-10">
        <svg viewBox="0 0 100 130" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Body */}
          <ellipse cx="50" cy="115" rx="18" ry="8" fill="#E0E7FF" />
          <path d="M36 65 Q36 100 50 108 Q64 100 64 65" fill="#6366F1" />
          {/* Head */}
          <circle cx="50" cy="38" r="22" fill="#FCD9B6" />
          {/* Hair */}
          <path d="M28 32 Q30 12 50 16 Q70 12 72 32 Q76 22 64 18 Q50 8 36 18 Q24 22 28 32" fill="#4B5563" />
          {/* Eyes */}
          <circle cx="42" cy="36" r="3.5" fill="#1F2937" />
          <circle cx="58" cy="36" r="3.5" fill="#1F2937" />
          <circle cx="43" cy="34.5" r="1.2" fill="white" />
          <circle cx="59" cy="34.5" r="1.2" fill="white" />
          {/* Eyebrows */}
          <path d="M37 28 Q42 25 47 28" stroke="#4B5563" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M53 28 Q58 25 63 28" stroke="#4B5563" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          {/* Smile */}
          <path d="M42 48 Q50 55 58 48" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round" />
          {/* Arm pointing left toward input */}
          <path d="M36 75 Q15 82 5 95" stroke="#FCD9B6" strokeWidth="8" fill="none" strokeLinecap="round" />
          <circle cx="3" cy="98" r="5" fill="#FCD9B6" />
          {/* Shirt collar */}
          <path d="M42 62 L50 68 L58 62" stroke="white" strokeWidth="2" fill="none" />
          {/* Cheeks (blush) */}
          <circle cx="35" cy="44" r="3" fill="#FECACA" opacity="0.5" />
          <circle cx="65" cy="44" r="3" fill="#FECACA" opacity="0.5" />
        </svg>
      </div>
    </>
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [placeholders.length]);

  useEffect(() => {
    fetchDocuments();
    fetchUsageStats();
  }, []);

  const fetchUsageStats = async () => {
    try {
      setLoadingStats(true);
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/subscriptions/usage`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsageStats(data);
      }
    } catch (error) {
      console.error('Error fetching usage stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const processDocuments = async (documents: any[]) => {
    const docsWithAnalysis = await Promise.all(
      documents.map(async (doc: any) => {
        const analysisResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/document/${doc.id}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
        });
        
        let hasAnalysis = false;
        if (analysisResponse.ok) {
          const analysisResult = await analysisResponse.json();
          hasAnalysis = analysisResult.data && analysisResult.data.length > 0;
        }
        
        return { ...doc, hasAnalysis };
      })
    );
    setDocuments(docsWithAnalysis);
  };

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) {
        setIsLoading(false);
        return;
      }

      const { BulletproofAPI } = await import('../../config/api');
      const result = await BulletproofAPI.safeRequest(
        () => BulletproofAPI.get('/documents', token),
        { documents: [] }
      );

      if (result.success) {
        await processDocuments(result.data.documents || []);
      } else if (result.error?.includes('401')) {
          try {
            const refreshResult = await BulletproofAPI.safeRequest(
              () => BulletproofAPI.post('/auth/refresh', {}, token),
              { token: null }
            );
            
            if (refreshResult.success && refreshResult.data?.token) {
            localStorage.setItem('authToken', refreshResult.data.token);
              const retryResult = await BulletproofAPI.safeRequest(
              () => BulletproofAPI.get('/documents', refreshResult.data.token),
                { documents: [] }
              );
              if (retryResult.success) {
                await processDocuments(retryResult.data.documents || []);
              }
            } else {
            onLogout();
          }
        } catch {
          onLogout();
        }
      } else {
        await processDocuments([]);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      await processDocuments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const isTextValid = () => {
    if (mode === 'citations') return inputText.trim().length > 0;
    return getWordCount(inputText) >= 200;
  };

  const handleCitationSearch = async () => {
    if (inputText.trim().length === 0) {
      setShowWordWarning(true);
      setTimeout(() => setShowWordWarning(false), 3000);
      return;
    }

    try {
      setIsSearchingCitations(true);
      setShowSearchAnimation(true);
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        alert('Please log in to search for citations');
        onNavigate('login');
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      // Calculate year filter
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

  const handleAnalyze = () => {
    const wordCount = getWordCount(inputText);
    
    if (wordCount < 200) {
      setShowWordWarning(true);
      setTimeout(() => setShowWordWarning(false), 3000);
      return;
    }
    
    setShowAnalysisPopup(true);
    setAnalysisComplete(false);
    localStorage.setItem('textAnalysisContent', inputText);
    
    setTimeout(() => setAnalysisComplete(true), 2000);
    setTimeout(() => {
      setShowAnalysisPopup(false);
      setAnalysisComplete(false);
      onNavigate('analysis');
    }, 4000);
  };

  const handleSubmit = () => {
    if (mode === 'citations') {
      handleCitationSearch();
    } else {
      handleAnalyze();
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="dashboard" />

      {/* Usage Stats Bar */}
      <div className="border-b border-gray-100 bg-gray-50/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-center flex-wrap gap-4 sm:gap-8 text-sm">
              <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600">Documents:</span>
              <span className="font-medium text-gray-900">
                    {loadingStats ? '...' : `${usageStats.documentsUploaded}/${usageStats.planLimits.documentsPerMonth === -1 ? '∞' : usageStats.planLimits.documentsPerMonth}`}
              </span>
              </div>
              <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">Analyses:</span>
              <span className="font-medium text-gray-900">
                    {loadingStats ? '...' : `${usageStats.documentsAnalyzed}/${usageStats.planLimits.analysesPerMonth === -1 ? '∞' : usageStats.planLimits.analysesPerMonth}`}
              </span>
              </div>
              <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-gray-600">Storage:</span>
              <span className="font-medium text-gray-900">
                {loadingStats ? '...' : formatBytes(usageStats.storageUsed)}
              </span>
              </div>
              {usageStats.plan === 'free' && !loadingStats && (
                  <button
                    onClick={() => onNavigate('pricing')}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-full transition-colors"
                  >
                Upgrade
                  </button>
              )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* Welcome */}
        <div className="text-center mb-10 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3">
            {mode === 'analyze' ? (
              <>Analyze your <span className="text-blue-600">academic writing</span></>
            ) : (
              <>Find <span className="text-blue-600">citations</span> for your research</>
            )}
          </h1>
          <p className="text-lg text-gray-600">
            {mode === 'analyze' 
              ? 'Paste your text to get AI-powered feedback on structure, grammar, and citations'
              : 'Enter your topic to discover relevant academic sources'
            }
          </p>
          </div>

          {/* Mode Toggle */}
        <div className="flex justify-center mb-7">
          <div className="inline-flex bg-gray-100 rounded-full p-1.5">
              <button
              onClick={() => { setMode('analyze'); setInputText(''); setShowWordWarning(false); }}
              className={`px-5 py-2.5 rounded-full text-base font-medium transition-all ${
                mode === 'analyze' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Analyze Essay
              </button>
              <button
              onClick={() => { setMode('citations'); setInputText(''); setShowWordWarning(false); }}
              className={`px-5 py-2.5 rounded-full text-base font-medium transition-all ${
                mode === 'citations' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Find Citations
              </button>
            </div>
          </div>

        {/* ANALYZE MODE - Upload First Design */}
        {mode === 'analyze' && (
          <>
            {/* Primary: Upload Section */}
            <div className="relative mb-8">
              {/* Character illustration */}
              <CharacterIllustration />
              
              <div 
                onClick={() => onNavigate('upload')}
                className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-10 sm:p-14 text-center border-2 border-dashed border-blue-200 hover:border-blue-400 cursor-pointer transition-all hover:shadow-lg group"
              >
                <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Upload Your Document</h2>
                <p className="text-gray-600 text-lg mb-6 max-w-md mx-auto">
                  Drop your essay, thesis, or research paper here for comprehensive AI analysis
                </p>
                <button 
                  className="inline-flex items-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors text-lg shadow-lg group-hover:shadow-xl"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Choose File
                </button>
                <div className="flex justify-center gap-3 mt-6">
                  <span className="px-4 py-1.5 bg-white text-gray-600 text-sm font-medium rounded-lg border border-gray-200">PDF</span>
                  <span className="px-4 py-1.5 bg-white text-gray-600 text-sm font-medium rounded-lg border border-gray-200">DOCX</span>
                  <span className="px-4 py-1.5 bg-white text-gray-600 text-sm font-medium rounded-lg border border-gray-200">TXT</span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex-1 h-px bg-gray-200"></div>
              <span className="px-4 text-gray-400 text-sm font-medium">or paste your text directly</span>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            {/* Secondary: Text Input (smaller) */}
            <div className="mb-12">
              <div className="relative bg-white rounded-2xl border border-gray-200 hover:border-gray-300 focus-within:border-blue-500 transition-colors">
                <textarea
                  value={inputText}
                  onChange={(e) => { setInputText(e.target.value); setShowWordWarning(false); }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && isTextValid()) { e.preventDefault(); handleSubmit(); }}}
                  placeholder={placeholders[placeholderIndex]}
                  className="w-full min-h-[120px] p-5 text-gray-800 text-base border-none outline-none resize-none bg-transparent placeholder-gray-400 leading-relaxed"
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = Math.min(target.scrollHeight, 280) + 'px';
                  }}
                />
                
                {/* Word count */}
                <div className="absolute bottom-3 left-5 text-sm text-gray-400">
                  {getWordCount(inputText)} words{getWordCount(inputText) < 200 ? ' (min 200)' : ''}
                </div>

                {/* Warning */}
                {showWordWarning && (
                  <div className="absolute -bottom-7 left-0 right-0 text-center">
                    <span className="text-sm text-red-500">Minimum 200 words required for analysis</span>
                  </div>
                )}
              </div>
              
              {/* Submit button */}
              <div className="flex justify-center mt-4">
                <button
                  onClick={handleSubmit}
                  disabled={!isTextValid()}
                  className={`px-6 py-3 rounded-xl flex items-center justify-center transition-all font-semibold text-base ${
                    isTextValid()
                      ? 'bg-gray-900 hover:bg-gray-800 text-white shadow-md cursor-pointer'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <span className="mr-2">✨</span>
                  Analyze Text
                </button>
              </div>
            </div>
          </>
        )}

        {/* CITATIONS MODE - Text Input Primary */}
        {mode === 'citations' && (
          <>
            {/* Citation Options */}
            <div className="flex justify-center mb-5">
              <div className="inline-flex items-center gap-3 flex-wrap justify-center">
                <div className="inline-flex items-center bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-200">
                  <span className="text-gray-500 mr-2 text-sm">Style:</span>
                  <select
                    value={citationStyle}
                    onChange={(e) => setCitationStyle(e.target.value)}
                    className="bg-transparent font-medium text-gray-900 outline-none cursor-pointer text-sm"
                  >
                    <option value="APA">APA 7th</option>
                    <option value="MLA">MLA 9th</option>
                    <option value="Chicago">Chicago</option>
                    <option value="Harvard">Harvard</option>
                    <option value="IEEE">IEEE</option>
                    <option value="Vancouver">Vancouver</option>
                  </select>
                </div>
                
                <div className="inline-flex items-center bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-200">
                  <span className="text-gray-500 mr-2 text-sm">Year:</span>
                  <select
                    value={citationYearRange}
                    onChange={(e) => setCitationYearRange(e.target.value)}
                    className="bg-transparent font-medium text-gray-900 outline-none cursor-pointer text-sm"
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
            </div>

            {/* Input Area */}
            <div className="mb-8 relative">
              <CharacterIllustration />
              
              <div className="relative bg-white rounded-2xl border-2 border-gray-200 hover:border-gray-300 focus-within:border-blue-500 transition-colors">
                <textarea
                  value={inputText}
                  onChange={(e) => { setInputText(e.target.value); setShowWordWarning(false); }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && isTextValid()) { e.preventDefault(); handleSubmit(); }}}
                  placeholder={placeholders[placeholderIndex]}
                  className="w-full min-h-[160px] sm:min-h-[180px] p-5 sm:p-6 text-gray-800 text-lg border-none outline-none resize-none bg-transparent placeholder-gray-400 leading-relaxed"
                  style={{ fontSize: '18px' }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = Math.min(target.scrollHeight, 320) + 'px';
                  }}
                />
                
                <div className="absolute bottom-4 left-5 text-sm text-gray-400">
                  {inputText.length} characters
                </div>

                {showWordWarning && (
                  <div className="absolute -bottom-8 left-0 right-0 text-center">
                    <span className="text-sm text-red-500">Please enter a research topic</span>
                  </div>
                )}
              </div>
              
              <div className="flex justify-center mt-4">
                <button
                  onClick={handleSubmit}
                  disabled={!isTextValid() || isSearchingCitations}
                  className={`px-8 py-3.5 rounded-xl flex items-center justify-center transition-all font-semibold text-base ${
                    isTextValid() && !isSearchingCitations
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg cursor-pointer'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isSearchingCitations ? (
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <>
                      <span className="mr-2">✨</span>
                      Find Sources
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Suggested Topics */}
            <div className="mb-12">
              <p className="text-sm text-gray-500 text-center mb-4">Suggestions</p>
              <div className="flex flex-wrap justify-center gap-2.5">
                {suggestedTopics.map((topic, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setInputText(topic)}
                    className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm sm:text-base rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Recent Documents */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-900">Recent Documents</h2>
            {documents.length > 0 && (
              <button onClick={() => onNavigate('library')} className="text-base text-blue-600 hover:text-blue-700 font-medium">
                View all →
              </button>
            )}
              </div>
          
            {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 3 }).map((_, i) => <DocumentCardSkeleton key={i} />)}
            </div>
            ) : documents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {documents.slice(0, 6).map((doc) => (
                <div 
                  key={doc.id}
                  className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => onNavigate('library')}
              >
                <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    {doc.hasAnalysis && (
                      <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded">Analyzed</span>
                    )}
                  </div>
                  <h3 className="font-medium text-gray-900 text-base mb-2 truncate">{doc.title}</h3>
                  <p className="text-sm text-gray-500">
                    {doc.fileType?.toUpperCase() || 'DOC'} • {doc.wordCount || 0} words • {new Date(doc.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
            ) : (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-100">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              </div>
              <p className="text-gray-500 text-base">No documents yet</p>
              <button onClick={() => onNavigate('upload')} className="mt-4 text-base text-blue-600 hover:text-blue-700 font-medium">
                Upload your first document →
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Analysis Popup */}
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

      {/* Citation Search Animation */}
      {showSearchAnimation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 max-w-sm mx-4 shadow-2xl text-center">
            <div className="w-12 h-12 mx-auto mb-4">
              <svg className="animate-spin w-12 h-12 text-blue-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Finding Citations</h3>
            <p className="text-sm text-gray-500">Searching academic databases...</p>
          </div>
        </div>
      )}

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default Dashboard;
