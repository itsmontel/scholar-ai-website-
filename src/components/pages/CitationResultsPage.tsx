import { useState } from 'react';
import Header from '../common/Header';
import Footer from '../common/Footer';

interface Citation {
  citation: string;
  type: string;
  relevance: string;
  key_points: string[];
  ready_to_use_sentence?: string;
  in_text_citation?: string;
  year: string;
  accessibility: string;
}

interface CitationResultsProps {
  onNavigate: (page: string) => void;
  user: any;
  onLogout: () => void;
  searchResults: {
    citations: Citation[];
    keywords: string[];
    searchStrategies: string[];
    researchTopic: string;
    citationStyle: string;
  };
  onNewSearch: () => void;
}

const CitationResultsPage = ({ 
  onNavigate, 
  user, 
  onLogout, 
  searchResults,
  onNewSearch 
}: CitationResultsProps) => {
  const [copiedIndex, setCopiedIndex] = useState<number | string | null>(null);
  
  // Check if this is old cached data (missing ready_to_use_sentence field)
  const hasOldData = searchResults.citations.some(c => !c.ready_to_use_sentence);
  const [showOldDataWarning, setShowOldDataWarning] = useState(hasOldData);

  // Convert URLs in citation text to clickable links
  const makeLinksClickable = (citationText: string) => {
    // Replace URLs with clickable links
    const urlRegex = /(https?:\/\/[^\s<]+)/g;
    return citationText.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">$1</a>');
  };

  const getTypeIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      journal_article: '📄',
      book: '📚',
      book_chapter: '📖',
      report: '📊',
      thesis: '🎓',
      conference_paper: '🎤'
    };
    return icons[type] || '📄';
  };

  const getAccessibilityColor = (accessibility: string) => {
    const colors: { [key: string]: string } = {
      'Open Access': 'bg-green-100 text-green-800 border-green-200',
      'Subscription Required': 'bg-orange-100 text-orange-800 border-orange-200',
      'Library Access': 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return colors[accessibility] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const copyCitation = (citation: string, index: number) => {
    navigator.clipboard.writeText(citation);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyReadyToUseSentence = (sentence: string, index: number) => {
    navigator.clipboard.writeText(sentence);
    setCopiedIndex(`ready-${index}`);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyAllCitations = () => {
    const allContent = searchResults.citations
      .map((c, i) => {
        let content = `[${i + 1}] ${c.citation.replace(/<\/?i>/g, '')}`;
        if (c.ready_to_use_sentence) {
          content += `\n\nReady-to-use sentence: ${c.ready_to_use_sentence}`;
        }
        return content;
      })
      .join('\n\n---\n\n');
    navigator.clipboard.writeText(allContent);
    setCopiedIndex(-1);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="dashboard" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Old Data Warning Banner */}
        {showOldDataWarning && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-yellow-800 mb-1">
                  Viewing Older Citation Results
                </h3>
                <p className="text-sm text-yellow-700 mb-3">
                  These are cached results from a previous search. For improved results with ready-to-use example sentences, perform a new citation search.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={onNewSearch}
                    className="text-sm bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
                  >
                    New Citation Search
                  </button>
                  <button
                    onClick={() => setShowOldDataWarning(false)}
                    className="text-sm text-yellow-700 hover:text-yellow-800"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Header Section */}
        <div className="mb-8">
          <button
            onClick={onNewSearch}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-4 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            New Search
          </button>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
            Citation Search Results
          </h1>
          <p className="text-base sm:text-lg text-gray-600 mb-2 break-words">
            Research Topic: <span className="font-semibold text-gray-900">{searchResults.researchTopic}</span>
          </p>
          <p className="text-xs sm:text-sm text-gray-500">
            Citation Style: {searchResults.citationStyle} • {searchResults.citations.length} sources found
          </p>
        </div>

        {/* Keywords Section */}
        {searchResults.keywords && searchResults.keywords.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 flex items-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-purple-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Recommended Keywords
            </h2>
            <div className="flex flex-wrap gap-2">
              {searchResults.keywords.map((keyword, index) => (
                <span
                  key={index}
                  className="px-2.5 sm:px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs sm:text-sm font-medium border border-purple-200 break-words"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Search Strategies Section */}
        {searchResults.searchStrategies && searchResults.searchStrategies.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 flex items-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search Strategies
            </h2>
            <ul className="space-y-2">
              {searchResults.searchStrategies.map((strategy, index) => (
                <li key={index} className="flex items-start">
                  <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mr-2 sm:mr-3 mt-0.5">
                    {index + 1}
                  </span>
                  <span className="text-sm sm:text-base text-gray-700 break-words">{strategy}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end mb-4 sm:mb-6">
          <button
            onClick={copyAllCitations}
            className="flex items-center px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm sm:text-base rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-md"
          >
            {copiedIndex === -1 ? (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy All Citations
              </>
            )}
          </button>
        </div>

        {/* Citations List */}
        <div className="space-y-4 sm:space-y-6">
          {searchResults.citations.map((citation, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow duration-200"
            >
              {/* Citation Header */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                <div className="flex items-center">
                  <span className="text-2xl sm:text-3xl mr-2 sm:mr-3 flex-shrink-0">{getTypeIcon(citation.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-bold text-gray-900 text-base sm:text-lg">[{index + 1}]</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getAccessibilityColor(citation.accessibility)} whitespace-nowrap`}>
                        {citation.accessibility}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium border border-gray-200 whitespace-nowrap">
                        {citation.year}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 capitalize">
                      {citation.type.replace(/_/g, ' ')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => copyCitation(citation.citation, index)}
                  className="flex items-center justify-center px-3 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0 self-start sm:self-auto"
                >
                  {copiedIndex === index ? (
                    <>
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copied
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy
                    </>
                  )}
                </button>
              </div>

              {/* Citation Text */}
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4 border border-gray-200">
                <p 
                  className="text-sm sm:text-base text-gray-800 leading-relaxed font-serif break-words"
                  dangerouslySetInnerHTML={{ __html: makeLinksClickable(citation.citation) }}
                />
              </div>

              {/* Ready-to-Use Sentence */}
              {citation.ready_to_use_sentence && (
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2 flex flex-wrap items-center gap-2 text-sm sm:text-base">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-purple-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Ready-to-Use Sentence
                    </span>
                    {citation.in_text_citation && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded whitespace-nowrap">
                        Copy & Paste Ready
                      </span>
                    )}
                  </h3>
                  <div className="bg-purple-50 rounded-lg p-3 sm:p-4 border border-purple-200 relative group">
                    <p className="text-sm sm:text-base text-gray-800 leading-relaxed pr-8 sm:pr-10 break-words">{citation.ready_to_use_sentence}</p>
                    {citation.in_text_citation && (
                      <div className="mt-3 pt-3 border-t border-purple-300">
                        <p className="text-sm text-purple-700">
                          <strong>In-text citation:</strong> <code className="bg-white px-2 py-1 rounded text-purple-800">{citation.in_text_citation}</code>
                        </p>
                      </div>
                    )}
                    
                    {/* Copy button for ready-to-use sentence */}
                    <button
                      onClick={() => copyReadyToUseSentence(citation.ready_to_use_sentence!, index)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded bg-white shadow-sm hover:bg-gray-50"
                      title="Copy ready-to-use sentence"
                    >
                      {copiedIndex === `ready-${index}` ? (
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Relevance */}
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center text-sm sm:text-base">
                  <svg className="w-4 h-4 mr-2 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Why This Source Is Relevant
                </h3>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed break-words">{citation.relevance}</p>
              </div>

              {/* Key Points */}
              {citation.key_points && citation.key_points.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center text-sm sm:text-base">
                    <svg className="w-4 h-4 mr-2 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Key Points
                  </h3>
                  <ul className="space-y-1">
                    {citation.key_points.map((point, pointIndex) => (
                      <li key={pointIndex} className="flex items-start">
                        <span className="text-blue-600 mr-2 flex-shrink-0">•</span>
                        <span className="text-sm sm:text-base text-gray-700 break-words">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Return to Dashboard */}
        <div className="mt-8 text-center">
          <button
            onClick={() => onNavigate('dashboard')}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Return to Dashboard
          </button>
        </div>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default CitationResultsPage;

