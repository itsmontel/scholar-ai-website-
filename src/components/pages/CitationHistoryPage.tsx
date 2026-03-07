import { useState, useEffect } from 'react';
import Header from '../common/Header';
import Footer from '../common/Footer';
import { isEndOfMonthUrgency, getEndOfMonthUrgencyText, getDaysUntilReset } from '../../utils/usageReset';

interface CitationSearch {
  id: string;
  research_topic: string;
  citation_style: string;
  year_range?: string;
  search_results: {
    citations: any[];
    keywords: string[];
    searchStrategies: string[];
    researchTopic: string;
    citationStyle: string;
    yearRange?: string;
  };
  created_at: string;
}

interface CitationHistoryProps {
  onNavigate: (page: string) => void;
  user: any;
  onLogout: () => void;
}

type TimePeriod = 'all' | '7days' | '30days' | '3months';

const CitationHistoryPage = ({ onNavigate, user, onLogout }: CitationHistoryProps) => {
  const [searches, setSearches] = useState<CitationSearch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const PAGE_SIZE = 10;

  const getTimePeriodDate = (period: TimePeriod): Date | null => {
    const now = new Date();
    switch (period) {
      case '7days':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30days':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '3months':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      default:
        return null;
    }
  };

  const filteredSearches = searches.filter((search) => {
    const cutoffDate = getTimePeriodDate(timePeriod);
    if (cutoffDate && new Date(search.created_at) < cutoffDate) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredSearches.length / PAGE_SIZE));
  const paginatedSearches = filteredSearches.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [timePeriod]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  const userPlan = user?.plan || user?.subscription_plan || 'free';
  const isPaidUser = userPlan === 'starter' || userPlan === 'premium';

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
      <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #FAF8F5 0%, #F5F3F0 100%)' }}>
        <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="citations" />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="flex items-center justify-center min-h-64">
            <div className="text-center">
              <div className="animate-spin w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-stone-600">Loading citation history...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #FAF8F5 0%, #F5F3F0 100%)' }}>
        <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="citations" />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-stone-800 mb-2">Error Loading History</h2>
            <p className="text-stone-600 mb-6">{error}</p>
            <button
              onClick={fetchCitationHistory}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-violet-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #FAF8F5 0%, #F5F3F0 100%)' }}>
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="citations" />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* Header Section */}
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-800 mb-4">
            Citation History
          </h1>
          <p className="text-lg text-stone-600 mb-6">
            View and revisit your previous citation searches
          </p>
          
          <button
            onClick={startNewSearch}
            className="inline-flex items-center px-5 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-violet-700 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            New Citation Search
          </button>
        </div>

        {/* End of month urgency warning for free users */}
        {!isPaidUser && isEndOfMonthUrgency() && searches.length > 0 && (
          <div className={`mb-6 p-4 rounded-xl border ${getDaysUntilReset() <= 3 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'}`}>
            <div className="flex items-start sm:items-center gap-3">
              <span className="text-xl flex-shrink-0">{getDaysUntilReset() <= 3 ? '⚠️' : '⏰'}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${getDaysUntilReset() <= 3 ? 'text-red-800 dark:text-red-200' : 'text-amber-800 dark:text-amber-200'}`}>
                  {getEndOfMonthUrgencyText()}
                </p>
              </div>
              <button
                onClick={() => onNavigate('pricing')}
                className={`flex-shrink-0 px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors ${getDaysUntilReset() <= 3 ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-amber-600 hover:bg-amber-700 text-white'}`}
              >
                Upgrade Now
              </button>
            </div>
          </div>
        )}

        {/* Time Period Filter + Results count */}
        {searches.length > 0 && (
          <div className="mb-8 bg-white/60 backdrop-blur-sm rounded-2xl border border-stone-200/60 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">Time Period</div>
                <div className="flex flex-wrap gap-1.5">
              {[
                { key: 'all' as TimePeriod, label: 'All Time' },
                { key: '7days' as TimePeriod, label: 'Last 7 Days' },
                { key: '30days' as TimePeriod, label: 'Last 30 Days' },
                { key: '3months' as TimePeriod, label: 'Last 3 Months' },
              ].map((option) => (
                <button
                  key={option.key}
                  onClick={() => setTimePeriod(option.key)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    timePeriod === option.key
                      ? 'bg-stone-900 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-800'
                  }`}
                >
                  {option.label}
                </button>
              ))}
                </div>
              </div>
              {timePeriod !== 'all' && (
                <div className="flex items-center gap-2 text-sm text-stone-600">
                  <span className="font-medium">{filteredSearches.length}</span>
                  <span>searches</span>
                  <span className="text-stone-400">
                    from {timePeriod === '7days' ? 'the last 7 days' : timePeriod === '30days' ? 'the last 30 days' : 'the last 3 months'}
                  </span>
                  <button
                    onClick={() => setTimePeriod('all')}
                    className="text-indigo-600 hover:text-indigo-700 font-medium underline underline-offset-2"
                  >
                    Show all
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Storage Notice */}
        {!isPaidUser && (
          <div className="mb-8 p-5 bg-violet-50 border border-violet-200 rounded-2xl">
            <div className="flex items-start">
              <div className="w-10 h-10 bg-violet-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-violet-800 mb-1">Free Plan Storage</h3>
                <p className="text-sm text-violet-700">
                  Citation searches are cleared on the 1st of each month. Upgrade to keep your citations forever!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Search History */}
        {searches.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-stone-800 mb-2">No Citation Searches Yet</h2>
            <p className="text-stone-600 mb-6">Start your first citation search to build your research library</p>
            <button
              onClick={startNewSearch}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-violet-700 transition-colors"
            >
              Find Citations Now
            </button>
          </div>
        ) : filteredSearches.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-stone-800 mb-2">No Citation Searches in This Period</h2>
            <p className="text-stone-600 mb-6">{`Try changing the time period or start a new search`}</p>
            <button
              onClick={() => setTimePeriod('all')}
              className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-700 font-medium hover:bg-stone-50 transition-colors mr-2"
            >
              Show All Time
            </button>
            <button
              onClick={startNewSearch}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-violet-700 transition-colors"
            >
              Find Citations Now
            </button>
          </div>
        ) : (
          <>
          <div className="space-y-4">
            {paginatedSearches.map((search) => (
              <div
                key={search.id}
                className="bg-white border border-stone-200 rounded-2xl p-6 hover:shadow-md hover:border-stone-300 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-stone-800 mb-3">
                      "{search.research_topic}"
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-stone-500">
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatDate(search.created_at)}
                      </span>
                      <span className="px-2.5 py-1 bg-violet-50 text-violet-700 rounded-lg text-xs font-medium">
                        {search.citation_style}
                      </span>
                      {(search.year_range || search.search_results?.yearRange) && 
                       (search.year_range !== 'all' && search.search_results?.yearRange !== 'all') && (
                        <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium">
                          Last {search.year_range || search.search_results?.yearRange} years
                        </span>
                      )}
                      <span className="px-2.5 py-1 bg-stone-100 text-stone-700 rounded-lg text-xs font-medium">
                        {search.search_results?.citations?.length || 0} Citations
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => viewSearchResults(search)}
                      className="px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl hover:from-indigo-600 hover:to-violet-700 transition-colors font-medium text-sm"
                    >
                      View Results
                    </button>
                    
                    <button
                      onClick={() => handleDeleteClick(search.id)}
                      className="p-2.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      title="Delete citation search"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Keywords Preview */}
                {search.search_results?.keywords && search.search_results.keywords.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-stone-100">
                    <span className="text-sm text-stone-500 font-medium">Keywords:</span>
                    {search.search_results.keywords.slice(0, 5).map((keyword, index) => (
                      <span
                        key={index}
                        className="px-2.5 py-1 bg-stone-100 text-stone-700 rounded-lg text-xs"
                      >
                        {keyword}
                      </span>
                    ))}
                    {search.search_results.keywords.length > 5 && (
                      <span className="text-xs text-stone-500">
                        +{search.search_results.keywords.length - 5} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                      currentPage === page
                        ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md'
                        : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
          </>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-stone-800">Delete Citation Search?</h3>
            </div>
            
            <p className="text-stone-600 mb-6">
              Are you sure you want to delete this citation search? This action cannot be undone.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={cancelDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 border border-stone-300 text-stone-700 rounded-xl hover:bg-stone-50 transition-colors disabled:opacity-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmDelete(deleteConfirmId)}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center font-medium"
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
