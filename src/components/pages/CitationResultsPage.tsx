import { useState } from 'react';
import DOMPurify from 'dompurify';
import Header from '../common/Header';
import Footer from '../common/Footer';
import { trackCopy } from '../../data/achievements';

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
    yearRange?: string;
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
  
  const hasOldData = searchResults?.citations?.some(c => !c.ready_to_use_sentence) ?? false;
  const [showOldDataWarning, setShowOldDataWarning] = useState(hasOldData);

  const makeLinksClickable = (citationText: string | null | undefined) => {
    if (citationText == null || typeof citationText !== 'string') return '';
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
      'Open Access': 'bg-violet-50 text-violet-700 border-violet-200',
      'Subscription Required': 'bg-amber-50 text-amber-700 border-amber-200',
      'Library Access': 'bg-blue-50 text-blue-700 border-blue-200'
    };
    return colors[accessibility] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const copyWithItalics = async (text: string) => {
    const plainText = text.replace(/<\/?i>/gi, '').replace(/<\/?em>/gi, '');
    const hasItalics = /<i>|<\/i>|<em>|<\/em>/i.test(text);
    if (hasItalics) {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/plain': new Blob([plainText], { type: 'text/plain' }),
            'text/html': new Blob([`<p>${text}</p>`], { type: 'text/html' })
          })
        ]);
        return;
      } catch {
        /* fall through to plain text */
      }
    }
    navigator.clipboard.writeText(plainText);
  };

  const copyCitation = async (citation: string, index: number) => {
    await copyWithItalics(citation);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    trackCopy();
  };

  const copyReadyToUseSentence = async (sentence: string, index: number) => {
    await copyWithItalics(sentence);
    setCopiedIndex(`ready-${index}`);
    setTimeout(() => setCopiedIndex(null), 2000);
    trackCopy();
  };

  const copyAllCitations = () => {
    const allContent = (searchResults.citations ?? [])
      .map((c, i) => {
        const citationText = c.citation ?? '';
        let content = `[${i + 1}] ${String(citationText).replace(/<\/?i>/g, '')}`;
        if (c.ready_to_use_sentence) {
          content += `\n\nReady-to-use sentence: ${c.ready_to_use_sentence}`;
        }
        return content;
      })
      .join('\n\n---\n\n');
    navigator.clipboard.writeText(allContent);
    setCopiedIndex(-1);
    setTimeout(() => setCopiedIndex(null), 2000);
    trackCopy();
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #FAF8F5 0%, #F5F3F0 100%)' }}>
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="dashboard" />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* Old Data Warning */}
        {showOldDataWarning && (
          <div className="mb-8 bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <div className="flex items-start">
              <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-base font-semibold text-amber-800 mb-1">
                  Viewing Older Citation Results
                </h3>
                <p className="text-sm text-amber-700 mb-4">
                  These are cached results. Perform a new search for improved results with ready-to-use sentences.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={onNewSearch}
                    className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors"
                  >
                    New Citation Search
                  </button>
                  <button
                    onClick={() => setShowOldDataWarning(false)}
                    className="px-4 py-2 text-amber-700 text-sm font-medium hover:text-amber-800"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI-Generated Disclaimer */}
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-amber-800 mb-1">AI-generated citations</p>
            <p className="text-sm text-amber-700">
              These sources are generated by AI and may include plausible but unverified references. Always verify citations exist, check DOIs/URLs, and confirm formatting against your style guide before submitting.
            </p>
          </div>
        </div>
        
        {/* Header Section */}
        <div className="mb-10">
          <button
            onClick={onNewSearch}
            className="flex items-center text-violet-600 hover:text-violet-700 mb-5 font-medium transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            New Search
          </button>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Citation Results
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-gray-600">
            <span className="text-lg">
              Topic: <span className="font-semibold text-gray-900">{searchResults.researchTopic}</span>
            </span>
            <span className="text-gray-300">•</span>
            <span className="px-3 py-1 bg-violet-50 text-violet-700 rounded-full text-sm font-medium">
              {searchResults.citationStyle}
            </span>
            {searchResults.yearRange && searchResults.yearRange !== 'all' && (
              <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-sm font-medium">
                Last {searchResults.yearRange} years
              </span>
            )}
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
              {searchResults.citations.length} sources
            </span>
          </div>
        </div>

        {/* Keywords Section */}
        {searchResults.keywords && searchResults.keywords.length > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Recommended Keywords
            </h2>
            <div className="flex flex-wrap gap-2">
              {searchResults.keywords.map((keyword, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 bg-violet-50 text-violet-700 rounded-lg text-sm font-medium border border-violet-200"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Search Strategies Section */}
        {searchResults.searchStrategies && searchResults.searchStrategies.length > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search Strategies
            </h2>
            <ul className="space-y-3">
              {(searchResults.searchStrategies ?? []).map((strategy, index) => (
                <li key={index} className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-violet-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">
                    {index + 1}
                  </span>
                  <span className="text-gray-700">{strategy}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Copy All Button */}
        <div className="flex justify-end mb-6">
          <button
            onClick={copyAllCitations}
            className="flex items-center px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl hover:from-indigo-600 hover:to-violet-700 transition-colors font-medium"
          >
            {copiedIndex === -1 ? (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied All!
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
        <div className="space-y-6">
          {(searchResults.citations ?? []).map((citation, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md hover:border-gray-300 transition-all"
            >
              {/* Citation Header */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
                <div className="flex items-center">
                  <span className="text-3xl mr-3">{getTypeIcon(citation.type)}</span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-bold text-gray-900 text-lg">[{index + 1}]</span>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${getAccessibilityColor(citation.accessibility)}`}>
                        {citation.accessibility}
                      </span>
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
                        {citation.year}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 capitalize">
                      {(citation.type ?? '').replace(/_/g, ' ')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => copyCitation(citation.citation ?? '', index)}
                  className="flex items-center px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium text-sm"
                >
                  {copiedIndex === index ? (
                    <>
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copied
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy
                    </>
                  )}
                </button>
              </div>

              {/* Citation Text */}
              <div className="bg-gray-50 rounded-xl p-4 mb-5 border border-gray-200">
                <p 
                  className="text-gray-800 leading-relaxed font-serif"
                  dangerouslySetInnerHTML={{ 
                    __html: DOMPurify.sanitize(makeLinksClickable(citation.citation), { 
                      ADD_ATTR: ['target', 'rel', 'class'] 
                    }) || ''
                  }}
                />
              </div>

              {/* Ready-to-Use Sentence */}
              {citation.ready_to_use_sentence && (
                <div className="mb-5">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Ready-to-Use Sentence
                    <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                      Copy & Paste
                    </span>
                  </h3>
                  <div className="bg-purple-50 rounded-xl p-4 border border-purple-200 relative group">
                    <p className="text-gray-800 leading-relaxed pr-10">{citation.ready_to_use_sentence}</p>
                    {citation.in_text_citation && (
                      <div className="mt-3 pt-3 border-t border-purple-200">
                        <p className="text-sm text-purple-700">
                          <strong>In-text:</strong> <code className="bg-white px-2 py-1 rounded text-purple-800 font-mono">{citation.in_text_citation}</code>
                        </p>
                      </div>
                    )}
                    <button
                      onClick={() => copyReadyToUseSentence(citation.ready_to_use_sentence!, index)}
                      className="absolute top-3 right-3 p-2 rounded-lg bg-white shadow-sm hover:bg-gray-50 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Copy ready-to-use sentence"
                    >
                      {copiedIndex === `ready-${index}` ? (
                        <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <div className="mb-5">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Why This Source Is Relevant
                </h3>
                <p className="text-gray-700 leading-relaxed">{citation.relevance}</p>
              </div>

              {/* Key Points */}
              {citation.key_points && citation.key_points.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Key Points
                  </h3>
                  <ul className="space-y-2">
                    {citation.key_points.map((point, pointIndex) => (
                      <li key={pointIndex} className="flex items-start">
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                        <span className="text-gray-700">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Return to Dashboard */}
        <div className="mt-12 text-center">
          <button
            onClick={() => onNavigate('dashboard')}
            className="inline-flex items-center px-8 py-4 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors text-lg"
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
