import { useState, useEffect } from 'react';
import Header from '../common/Header';
import Footer from '../common/Footer';

interface CitationSearch {
  id: string;
  research_topic: string;
  citation_style: string;
  search_results: {
    citations: any[];
    keywords: string[];
    searchStrategies: string[];
    researchTopic: string;
    citationStyle: string;
  };
  created_at: string;
}

interface CitationHistoryProps {
  onNavigate: (page: string) => void;
  user: any;
  onLogout: () => void;
}

const CitationHistoryPage = ({ onNavigate, user, onLogout }: CitationHistoryProps) => {
  const [searches, setSearches] = useState<CitationSearch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCitationHistory();
  }, []);

  const fetchCitationHistory = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) {
        onNavigate('login');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/citation-history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch citation history');
      }

      if (data.success) {
        setSearches(data.data || []);
      } else {
        throw new Error('Failed to fetch citation history');
      }

    } catch (error) {
      console.error('Citation history error:', error);
      setError(error instanceof Error ? error.message : 'Failed to load citation history');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const viewSearchResults = (search: CitationSearch) => {
    // Store the search results in localStorage and navigate to results page
    localStorage.setItem('citationSearchResults', JSON.stringify(search.search_results));
    onNavigate('citation-results');
  };

  const startNewSearch = () => {
    onNavigate('dashboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="citations" />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="flex items-center justify-center min-h-64">
            <div className="text-center">
              <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Loading citation history...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="citations" />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading History</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={fetchCitationHistory}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="citations" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Citation Search History
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            View and revisit your previous citation searches
          </p>
          
          <button
            onClick={startNewSearch}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            New Citation Search
          </button>
        </div>

        {/* Search History */}
        {searches.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Citation Searches Yet</h2>
            <p className="text-gray-600 mb-6">Start your first citation search to build your research library</p>
            <button
              onClick={startNewSearch}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
            >
              Find Citations Now
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {searches.map((search) => (
              <div
                key={search.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      "{search.research_topic}"
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatDate(search.created_at)}
                      </span>
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {search.citation_style} Style
                      </span>
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        {search.search_results?.citations?.length || 0} Citations
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => viewSearchResults(search)}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View Results
                  </button>
                </div>

                {/* Keywords Preview */}
                {search.search_results?.keywords && search.search_results.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    <span className="text-sm text-gray-500 mr-2">Keywords:</span>
                    {search.search_results.keywords.slice(0, 5).map((keyword, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                      >
                        {keyword}
                      </span>
                    ))}
                    {search.search_results.keywords.length > 5 && (
                      <span className="text-xs text-gray-500">
                        +{search.search_results.keywords.length - 5} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default CitationHistoryPage;

