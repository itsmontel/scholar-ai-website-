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
      maxDocumentSize: 1024 * 1024, // 1MB
      name: 'Free'
    }
  });
  const [loadingStats, setLoadingStats] = useState(true);

  const analyzePlaceholders = [
    "Paste your academic text here to see how AI can help improve it.",
    "Enhance your academic writing with a simple paste and click.",
    "Get instant feedback on your essay or thesis.",
    "Turn good writing into great writing with Scholar."
  ];

  const citationPlaceholders = [
    "Enter your essay question or research topic to find relevant citations...",
    "What's your research topic? Get academic sources instantly.",
    "Type your assignment question and discover relevant literature.",
    "Find citations for your research paper in seconds."
  ];

  const placeholders = mode === 'analyze' ? analyzePlaceholders : citationPlaceholders;

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    console.log('Dashboard: fetchDocuments called');
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
    console.log('Processing documents:', documents);
    const docsWithAnalysis = await Promise.all(
      documents.map(async (doc: any) => {
        // Check if document has analysis
        console.log('Dashboard: Checking analysis for document:', doc.id);
        const analysisResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/document/${doc.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
        });
        
        let hasAnalysis = false;
        if (analysisResponse.ok) {
          const analysisResult = await analysisResponse.json();
          console.log('Dashboard: Analysis check result for document', doc.id, ':', analysisResult);
          hasAnalysis = analysisResult.data && analysisResult.data.length > 0;
        } else {
          console.warn('Dashboard: Failed to check analysis for document', doc.id, ':', analysisResponse.status, analysisResponse.statusText);
        }
        
        return {
          ...doc,
          hasAnalysis
        };
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

      // Use bulletproof API with maximum retries
      const { BulletproofAPI } = await import('../../config/api');
      const result = await BulletproofAPI.safeRequest(
        () => BulletproofAPI.get('/documents', token),
        { documents: [] }
      );

      if (result.success) {
        console.log('✅ Dashboard documents loaded successfully:', result.data);
        await processDocuments(result.data.documents || []);
      } else {
        // Handle auth errors by trying to refresh token
        if (result.error?.includes('401')) {
          try {
            const refreshResult = await BulletproofAPI.safeRequest(
              () => BulletproofAPI.post('/auth/refresh', {}, token),
              { token: null }
            );
            
            if (refreshResult.success && refreshResult.data?.token) {
              const newToken = refreshResult.data.token;
              localStorage.setItem('authToken', newToken);
              
              // Retry with new token
              const retryResult = await BulletproofAPI.safeRequest(
                () => BulletproofAPI.get('/documents', newToken),
                { documents: [] }
              );
              
              if (retryResult.success) {
                await processDocuments(retryResult.data.documents || []);
              }
            } else {
              console.warn('Token refresh failed, logging out');
              onLogout();
            }
          } catch (refreshError) {
            console.error('Token refresh error:', refreshError);
            onLogout();
          }
        } else {
          console.error('📄 Documents fetch failed:', result.error);
          // Still show empty state rather than crash
          await processDocuments([]);
        }
      }
    } catch (error) {
      console.error('💥 Critical error in fetchDocuments:', error);
      // Even in worst case, show empty state
      await processDocuments([]);
    } finally {
      setIsLoading(false);
    }
  };


  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  // Helper functions for formatting stats
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };


  const isTextValid = () => {
    if (mode === 'citations') {
      return inputText.trim().length > 0;
    }
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

      // Add a small delay to show the animation
      await new Promise(resolve => setTimeout(resolve, 500));

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/citation-search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          researchTopic: inputText,
          citationStyle: citationStyle,
          numberOfCitations: 10
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Citation search failed');
      }

      if (data.success && data.data) {
        // Store results and navigate to results page
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
      // Hide warning after 3 seconds
      setTimeout(() => setShowWordWarning(false), 3000);
      return;
    }
    
    // Show popup animation
    setShowAnalysisPopup(true);
    setAnalysisComplete(false);
    
    // Store the text in localStorage to pass to analysis page
    localStorage.setItem('textAnalysisContent', inputText);
    
    // Simulate analysis preparation time
    setTimeout(() => {
      setAnalysisComplete(true);
    }, 2000);
    
    // Navigate after popup completes
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="dashboard" />

      {/* Compact Usage Overview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
        <div className="bg-white/60 backdrop-blur-sm rounded-xl shadow-sm border border-white/20 p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-3 sm:space-x-4 md:space-x-6 flex-wrap justify-center gap-y-2">
              {/* Documents */}
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Documents</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {loadingStats ? '...' : `${usageStats.documentsUploaded}/${usageStats.planLimits.documentsPerMonth === -1 ? '∞' : usageStats.planLimits.documentsPerMonth}`}
                  </p>
                </div>
              </div>

              {/* Analyses */}
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Analyses</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {loadingStats ? '...' : `${usageStats.documentsAnalyzed}/${usageStats.planLimits.analysesPerMonth === -1 ? '∞' : usageStats.planLimits.analysesPerMonth}`}
                  </p>
                </div>
              </div>

              {/* Storage */}
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Storage</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {loadingStats ? '...' : `${formatBytes(usageStats.storageUsed)}/${usageStats.storageLimit === -1 ? '∞' : formatBytes(usageStats.storageLimit)}`}
                  </p>
                </div>
              </div>

              {/* Plan */}
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Plan</p>
                  <p className="text-sm font-semibold text-gray-900 capitalize">
                    {loadingStats ? '...' : usageStats.plan}
                  </p>
                </div>
              </div>

              {/* Upgrade Button */}
              {usageStats.plan === 'free' && !loadingStats && (
                <div className="flex items-center space-x-2 ml-4 pl-4 border-l border-gray-200">
                  <button
                    onClick={() => onNavigate('pricing')}
                    className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 text-xs font-medium flex items-center space-x-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <span>Upgrade</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16">
        {/* Hero Section */}
        <div className="text-center mb-12 sm:mb-16 md:mb-20">
          {/* Mobile: Clean, bold headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-4 sm:mb-8 leading-tight tracking-tight -mt-4 sm:-mt-6">
            {mode === 'analyze' ? (
              <>
                <span className="block">Your expert<br />AI writing <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">assistant</span></span>
              </>
            ) : (
              <>
                <span className="block">Find <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">citations</span><br />instantly</span>
              </>
            )}
          </h1>
          {/* Feature list with checkmarks */}
          <div className="mb-8">
            {/* Mobile: 2x2 grid layout */}
            <div className="sm:hidden grid grid-cols-2 gap-3 max-w-sm mx-auto text-left">
              {mode === 'analyze' ? (
                <>
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-700 text-xs font-medium">Quick structure analysis</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-700 text-xs font-medium">Detailed annotations</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-700 text-xs font-medium">Academic writing feedback</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-700 text-xs font-medium">Improvement suggestions</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-700 text-xs font-medium">10M+ academic sources</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-700 text-xs font-medium">Multiple citation styles</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-700 text-xs font-medium">Instant results</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-700 text-xs font-medium">Ready-to-use citations</span>
                  </div>
                </>
              )}
            </div>

            {/* Desktop: Single line layout */}
            <div className="hidden sm:flex sm:flex-row sm:items-center sm:justify-center sm:gap-6 max-w-6xl mx-auto flex-wrap">
              {mode === 'analyze' ? (
                <>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-800 text-base font-semibold">Quick structure analysis</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-800 text-base font-semibold">Detailed annotations</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-800 text-base font-semibold">Academic writing feedback</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-800 text-base font-semibold">Improvement suggestions</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-800 text-base font-semibold">10M+ academic sources</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-800 text-base font-semibold">Multiple citation styles</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-800 text-base font-semibold">Instant results</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-800 text-base font-semibold">Ready-to-use citations</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="flex justify-center mb-6 sm:mb-8">
            {/* Mobile: Simple pill buttons */}
            <div className="sm:hidden flex gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => {
                  setMode('analyze');
                  setInputText('');
                }}
                className={`px-5 py-2.5 rounded-md font-semibold text-sm transition-all duration-200 ${
                  mode === 'analyze'
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 bg-transparent'
                }`}
              >
                Analyze Text
              </button>
              <button
                onClick={() => {
                  setMode('citations');
                  setInputText('');
                }}
                className={`px-5 py-2.5 rounded-md font-semibold text-sm transition-all duration-200 ${
                  mode === 'citations'
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 bg-transparent'
                }`}
              >
                Citations
              </button>
            </div>
            {/* Desktop: Original design */}
            <div className="hidden sm:block bg-white/90 backdrop-blur-xl rounded-lg p-1 shadow-lg border border-gray-200/50 inline-flex">
              <button
                onClick={() => {
                  setMode('analyze');
                  setInputText('');
                }}
                className={`px-6 py-3 rounded-md font-semibold text-sm transition-all duration-200 ${
                  mode === 'analyze'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Analyze Text
                </span>
              </button>
              <button
                onClick={() => {
                  setMode('citations');
                  setInputText('');
                }}
                className={`px-6 py-3 rounded-md font-semibold text-sm transition-all duration-200 ${
                  mode === 'citations'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Citations
                </span>
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="max-w-4xl mx-auto mb-12 px-4">
            {/* Citation Style Selector (only show in citations mode) */}
            {mode === 'citations' && (
              <div className="flex justify-center mb-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 inline-flex items-center">
                  <span className="text-sm text-gray-600 mr-2 px-2">Citation Style:</span>
                  <select
                    value={citationStyle}
                    onChange={(e) => setCitationStyle(e.target.value)}
                    className="px-3 py-1 rounded border-none outline-none text-sm font-medium text-gray-700 bg-transparent cursor-pointer"
                  >
                    <option value="APA">APA</option>
                    <option value="MLA">MLA</option>
                    <option value="Chicago">Chicago</option>
                    <option value="Harvard">Harvard</option>
                    <option value="IEEE">IEEE</option>
                    <option value="Vancouver">Vancouver</option>
                  </select>
                </div>
              </div>
            )}

            <div className="relative">
              {/* Shadow gradient behind the input */}
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-indigo-500/20 rounded-3xl blur-sm"></div>
              <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-4 sm:p-6 md:p-8 hover:shadow-3xl transition-all duration-500">
                <textarea
                  value={inputText}
                  onChange={(e) => {
                    setInputText(e.target.value);
                    setShowWordWarning(false); // Hide warning when user types
                  }}
                  onKeyPress={handleKeyPress}
                  placeholder={placeholders[placeholderIndex]}
                  className="w-full min-h-24 max-h-48 pb-6 pl-4 sm:pl-6 pr-16 sm:pr-20 text-gray-700 border-none outline-none resize-none placeholder-gray-400 bg-transparent text-base sm:text-lg font-light transition-all duration-300 overflow-y-auto leading-relaxed"
                  style={{ 
                    height: 'auto', 
                    lineHeight: '1.6',
                    paddingTop: '0px',
                    marginTop: '0px'
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = Math.min(target.scrollHeight, 192) + 'px';
                  }}
                />
                
                {/* Word/Character Count */}
                <div className="absolute bottom-4 left-4 text-xs text-gray-500">
                  {mode === 'citations' ? `${inputText.length} characters` : `${getWordCount(inputText)} words`}
                </div>
                
                {/* Send Button */}
                <button
                  onClick={handleSubmit}
                  disabled={!isTextValid() || isSearchingCitations}
                  className={`absolute bottom-3 sm:bottom-4 right-3 sm:right-4 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all duration-200 shadow-lg z-10 ${
                    isTextValid() && !isSearchingCitations
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white hover:scale-105 cursor-pointer' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isSearchingCitations ? (
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : mode === 'citations' ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
                
                {/* Warning Message */}
                {showWordWarning && (
                  <div className="absolute bottom-16 right-4 bg-red-500 text-white text-xs px-3 py-2 rounded-lg shadow-lg z-20 animate-pulse">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <span>{mode === 'citations' ? 'Please enter a research topic or question' : 'Minimum 200 words required'}</span>
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-red-500"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Suggested Categories */}
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mt-8 sm:mt-10 px-4">
              {['Research Paper', 'Thesis Draft', 'Essay Analysis', 'Literature Review'].map((category) => (
            <button 
                  key={category}
                  onClick={() => setInputText(prev => prev + (prev ? ' ' : '') + category)}
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-white/70 hover:bg-white/90 text-gray-700 rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-300 hover:shadow-lg border border-gray-200/60 hover:border-blue-300/60 hover:scale-105 backdrop-blur-sm"
            >
                  {category}
            </button>
              ))}
          </div>
        </div>
      </div>

        {/* Upload Document Section */}
        <div className="max-w-4xl mx-auto mb-12 sm:mb-16 px-4">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-8 sm:p-12 text-center border border-gray-200 shadow-lg">
            {/* Upload Icon */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg className="w-10 h-10 sm:w-12 sm:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                {/* Cloud shape */}
                <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
                {/* Arrow shaft */}
                <path d="M12 16V8" />
                {/* Arrow head - left chevron */}
                <path d="M12 8l-3 3" />
                {/* Arrow head - right chevron */}
                <path d="M12 8l3 3" />
              </svg>
            </div>
            
            {/* Title */}
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              Upload Your Document
            </h2>
            
            {/* Description */}
            <p className="text-base sm:text-lg text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Get instant AI-powered analysis and feedback on your academic papers, essays, and research documents.
            </p>
            
            {/* Upload Button */}
            <button 
              onClick={() => onNavigate('upload')}
              className="inline-flex items-center px-8 sm:px-12 py-4 sm:py-5 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-800 text-white rounded-2xl font-bold text-lg sm:text-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 shadow-xl"
            >
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Upload Document Now
            </button>
            
            {/* File Types */}
            <div className="flex flex-wrap justify-center items-center gap-4 mt-6">
              <span className="text-sm font-medium text-gray-500">Supported formats:</span>
              <div className="flex gap-3">
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">PDF</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">DOCX</span>
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">TXT</span>
              </div>
              <span className="text-sm text-gray-500">Up to 50MB</span>
            </div>
          </div>
        </div>

        {/* Documents Section */}
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent mb-4">Your Documents</h2>
            <p className="text-base sm:text-lg text-gray-600">Manage and access your uploaded academic documents</p>
              </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Document Cards */}
            {isLoading ? (
              // Loading state
              Array.from({ length: 3 }).map((_, index) => (
                <DocumentCardSkeleton key={index} />
              ))
            ) : documents.length > 0 ? (
              documents.slice(0, 3).map((doc) => (
                <div 
                  key={doc.id}
                  onClick={() => onNavigate('library')}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200 cursor-pointer hover:border-gray-300"
              >
                <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                    </div>
                
                <div className="mb-4">
                    <h3 className="font-semibold text-gray-900 text-base mb-1">{doc.title}</h3>
                    <p className="text-sm text-gray-500">{doc.fileType?.toUpperCase() || 'DOC'} • {doc.wordCount || 0} words</p>
                </div>
                
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </span>
                    {doc.hasAnalysis ? (
                      <button
                        onClick={() => {
                          localStorage.setItem('selectedDocumentId', doc.id);
                          localStorage.setItem('selectedDocumentTitle', doc.title);
                          localStorage.setItem('hasExistingAnalysis', 'true');
                          onNavigate('analysis');
                        }}
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 hover:border-green-300 transition-colors cursor-pointer"
                      >
                        Show Analysis
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          localStorage.setItem('selectedDocumentId', doc.id);
                          localStorage.setItem('selectedDocumentTitle', doc.title);
                          onNavigate('analysis');
                        }}
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-colors cursor-pointer"
                      >
                        Analyze
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              // Empty state
              <div className="col-span-full text-center py-12">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
                <p className="text-gray-500">No documents uploaded yet</p>
              </div>
            )}
          </div>
          
          {/* See More Link */}
          {documents.length > 3 && (
            <div className="text-center mt-8">
              <button 
                onClick={() => onNavigate('library')}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <span>See More</span>
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Analysis Popup Animation */}
      {showAnalysisPopup && (
        <AnalysisAnimation
          isPopup={true}
          text="Preparing your text for analysis"
          isComplete={analysisComplete}
          onComplete={() => {
            setShowAnalysisPopup(false);
            setAnalysisComplete(false);
          }}
        />
      )}

      {/* Citation Search Animation */}
      {showSearchAnimation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl">
            <div className="text-center">
              <div className="relative mb-6">
                <div className="w-16 h-16 mx-auto">
                  <svg className="animate-spin w-16 h-16 text-blue-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Finding Citations</h3>
              <p className="text-gray-600 mb-4">Searching academic databases for relevant sources...</p>
              
              {/* Animated citation icons */}
              <div className="flex justify-center space-x-2 mb-4">
                {['📄', '📚', '📖'].map((icon, index) => (
                  <div
                    key={index}
                    className="text-2xl animate-bounce"
                    style={{ animationDelay: `${index * 0.2}s` }}
                  >
                    {icon}
                  </div>
                ))}
              </div>
              
              <div className="flex justify-center">
                <div className="flex space-x-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"
                      style={{ animationDelay: `${i * 0.3}s` }}
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default Dashboard;