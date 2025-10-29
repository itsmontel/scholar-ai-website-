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
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDeleteClick = (searchId: string) => {
    setDeleteConfirmId(searchId);
  };

  const cancelDelete = () => {
    setDeleteConfirmId(null);
  };

  const confirmDelete = async (searchId: string) => {
    try {
      setIsDeleting(true);
      const token = localStorage.getItem('authToken');
      if (!token) {
        onNavigate('login');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/citation/${searchId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete citation search');
      }

      // Remove the deleted search from the list
      setSearches(searches.filter(search => search.id !== searchId));
      setDeleteConfirmId(null);

    } catch (error) {
      console.error('Delete citation error:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete citation search');
    } finally {
      setIsDeleting(false);
    }
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
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">
            Citation Search History
          </h1>
          <p className="text-base sm:text-lg text-gray-600 mb-4 sm:mb-6">
            View and revisit your previous citation searches
          </p>
          
          <button
            onClick={startNewSearch}
            className="inline-flex items-center px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            New Citation Search
          </button>
        </div>

        {/* Auto-Delete Info Banner */}
        <div className="mb-4 sm:mb-6 bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-start">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mr-2 sm:mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-xs sm:text-sm text-blue-800 break-words">
                <strong className="font-semibold">Storage Notice:</strong> Citation searches are automatically removed 30 days after being saved to optimize storage and keep your library current. Be sure to copy any citations you need for your work before they expire.
              </p>
            </div>
          </div>
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
          <div className="space-y-4 sm:space-y-6">
            {searches.map((search) => (
              <div
                key={search.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex flex-col gap-3 sm:gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3 break-words">
                      "{search.research_topic}"
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs sm:text-sm text-gray-500">
                      <span className="flex items-center whitespace-nowrap">
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatDate(search.created_at)}
                      </span>
                      <span className="flex items-center whitespace-nowrap">
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {search.citation_style} Style
                      </span>
                      <span className="flex items-center whitespace-nowrap">
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        {search.search_results?.citations?.length || 0} Citations
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => viewSearchResults(search)}
                      className="inline-flex items-center px-3 sm:px-4 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex-1 sm:flex-initial justify-center"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View Results
                    </button>
                    
                    <button
                      onClick={() => handleDeleteClick(search.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 flex-shrink-0"
                      title="Delete citation search"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Keywords Preview */}
                {search.search_results?.keywords && search.search_results.keywords.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100">
                    <span className="text-xs sm:text-sm text-gray-500 font-medium">Keywords:</span>
                    {search.search_results.keywords.slice(0, 5).map((keyword, index) => (
                      <span
                        key={index}
                        className="px-2 py-0.5 sm:py-1 bg-gray-100 text-gray-700 rounded text-xs break-words"
                      >
                        {keyword}
                      </span>
                    ))}
                    {search.search_results.keywords.length > 5 && (
                      <span className="text-xs text-gray-500 whitespace-nowrap">
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

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Delete Citation Search?</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this citation search? This action cannot be undone and all results will be permanently removed.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={cancelDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmDelete(deleteConfirmId)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default CitationHistoryPage;

