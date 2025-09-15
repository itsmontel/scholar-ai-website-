import { useState, useEffect } from 'react';
import Header from '../common/Header';
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

  const placeholders = [
    "Paste your academic text here to see how AI can help improve it.",
    "Enhance your academic writing with a simple paste and click.",
    "Get instant feedback on your essay or thesis.",
    "Turn good writing into great writing with Scholar."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    console.log('Dashboard: fetchDocuments called');
    fetchDocuments();
  }, []);

  const processDocuments = async (documents: any[]) => {
    console.log('Processing documents:', documents);
    const docsWithAnalysis = await Promise.all(
      documents.map(async (doc: any) => {
        // Check if document has analysis
        console.log('Dashboard: Checking analysis for document:', doc.id);
        const analysisResponse = await fetch(`http://localhost:3001/api/analysis/document/${doc.id}`, {
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

      const response = await fetch('http://localhost:3001/api/documents', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      // If token expired, try to refresh
      if (response.status === 401) {
        const refreshResponse = await fetch('http://localhost:3001/api/auth/refresh', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          localStorage.setItem('authToken', refreshData.data.token);
          
          // Retry the original request with new token
          const retryResponse = await fetch('http://localhost:3001/api/documents', {
            headers: {
              'Authorization': `Bearer ${refreshData.data.token}`,
            },
          });
          
          if (retryResponse.ok) {
            const result = await retryResponse.json();
            await processDocuments(result.data.documents || []);
          }
        } else {
          // Refresh failed, redirect to login
          onLogout();
        }
        setIsLoading(false);
        return;
      }

      if (response.ok) {
        const result = await response.json();
        console.log('Dashboard documents response:', result);
        await processDocuments(result.data.documents || []);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setIsLoading(false);
    }
  };


  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const isTextValid = () => {
    return getWordCount(inputText) >= 200;
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAnalyze();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="dashboard" />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center px-4 py-2 bg-blue-50/80 text-blue-700 rounded-full text-sm font-medium mb-8 border border-blue-200/50">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Your Academic Writing Assistant
            </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 md:mb-8 leading-tight tracking-tight">
            Enhance your academic<br className="hidden sm:block" />writing with <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">AI</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-4xl mx-auto mb-12 md:mb-16 leading-relaxed px-4">
            Get instant, intelligent feedback on your research papers, essays, and academic documents with our advanced AI analysis that understands academic writing standards
          </p>

          {/* Search Box */}
          <div className="max-w-4xl mx-auto mb-12 px-4">
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
                
                {/* Word Count */}
                <div className="absolute bottom-4 left-4 text-xs text-gray-500">
                  {getWordCount(inputText)} words
                </div>
                
                {/* Send Button */}
                <button
                  onClick={handleAnalyze}
                  disabled={!isTextValid()}
                  className={`absolute bottom-3 sm:bottom-4 right-3 sm:right-4 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all duration-200 shadow-lg z-10 ${
                    isTextValid() 
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white hover:scale-105 cursor-pointer' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
                
                {/* Warning Message */}
                {showWordWarning && (
                  <div className="absolute bottom-16 right-4 bg-red-500 text-white text-xs px-3 py-2 rounded-lg shadow-lg z-20 animate-pulse">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <span>Minimum 200 words required</span>
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

        {/* Upload Button */}
        <div className="max-w-4xl mx-auto mb-12 sm:mb-16 px-4">
          <div className="text-center">
            <button 
              onClick={() => onNavigate('upload')}
              className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-2xl font-semibold text-base sm:text-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload Document
            </button>
            <p className="text-sm text-gray-500 mt-3">Supports PDF, DOCX, and TXT files</p>
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
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                        Show Analysis
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        Analyze
                    </span>
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
    </div>
  );
};

export default Dashboard;