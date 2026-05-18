import { useState } from 'react';
import DOMPurify from 'dompurify';
import Header from '../common/Header';
import { WriteScholarEditorialBackgroundLayers } from '../common/WriteScholarEditorialBackground';
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
    return citationText.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-[#A560E8] hover:text-[#7733B5] underline">$1</a>');
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
      'Open Access': 'bg-[#F3EAFF] text-[#7733B5] border-[#A560E8]/30 dark:bg-[#A560E8]/15 dark:text-[#C9A0F0] dark:border-[#A560E8]/30',
      'Subscription Required': 'bg-[#FFF7E6] text-[#8A6A00] border-[#E0AC00]/35 dark:bg-[#FFC800]/10 dark:text-[#FFD659] dark:border-[#FFC800]/25',
      'Library Access': 'bg-[#F3EAFF] text-[#7733B5] border-[#A560E8]/30 dark:bg-[#A560E8]/15 dark:text-[#C9A0F0] dark:border-[#A560E8]/30'
    };
    return colors[accessibility] || 'bg-stone-100 text-stone-700 border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700';
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
    <div className="relative min-h-screen overflow-x-clip">
      <WriteScholarEditorialBackgroundLayers position="fixed" />
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="dashboard" />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* Old Data Warning */}
        {showOldDataWarning && (
          <div className="mb-8 bg-[#FFF7E6] dark:bg-[#FFC800]/10 border-2 border-[#E0AC00]/35 dark:border-[#FFC800]/25 rounded-2xl p-5">
            <div className="flex items-start">
              <div className="w-10 h-10 bg-[#FFC800] rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-[#3C3C3C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-base font-extrabold text-[#8A6A00] dark:text-[#FFD659] mb-1" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
                  Viewing older citation results
                </h3>
                <p className="text-sm text-[#9A7A1A] dark:text-[#E8C766] font-medium mb-4">
                  These are cached results. Perform a new search for improved results with ready-to-use sentences.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={onNewSearch}
                    className="inline-flex items-center justify-center px-4 py-2 bg-[#FFC800] hover:bg-[#FFD52E] text-[#3C3C3C] text-sm font-extrabold rounded-xl border-2 border-b-4 border-[#D4A300] active:border-b-2 active:translate-y-0.5 transition-all"
                  >
                    New citation search
                  </button>
                  <button
                    onClick={() => setShowOldDataWarning(false)}
                    className="px-4 py-2 text-[#9A7A1A] dark:text-[#E8C766] text-sm font-extrabold hover:text-[#8A6A00] dark:hover:text-[#FFD659]"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI-Generated Disclaimer */}
        <div className="mb-6 bg-[#FFF7E6] dark:bg-[#FFC800]/10 border-2 border-[#E0AC00]/35 dark:border-[#FFC800]/25 rounded-2xl p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-[#B8860B] dark:text-[#FFD659] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-extrabold text-[#8A6A00] dark:text-[#FFD659] mb-1">AI-generated citations</p>
            <p className="text-sm text-[#9A7A1A] dark:text-[#E8C766] font-medium leading-relaxed">
              These sources are generated by AI and may include plausible but unverified references. Always verify citations exist, check DOIs/URLs, and confirm formatting against your style guide before submitting.
            </p>
          </div>
        </div>
        
        {/* Header Section */}
        <div className="mb-10">
          <button
            onClick={onNewSearch}
            className="flex items-center text-[#A560E8] hover:text-[#7733B5] mb-5 font-extrabold transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            New search
          </button>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-stone-900 dark:text-stone-50 mb-4 tracking-tight" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
            Citation results
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-stone-600 dark:text-stone-400">
            <span className="text-lg">
              Topic: <span className="font-extrabold text-stone-900 dark:text-stone-100">{searchResults.researchTopic}</span>
            </span>
            <span className="text-stone-300 dark:text-stone-600">•</span>
            <span className="px-3 py-1 bg-[#F3EAFF] dark:bg-[#A560E8]/15 text-[#7733B5] dark:text-[#C9A0F0] rounded-full text-sm font-bold">
              {searchResults.citationStyle}
            </span>
            {searchResults.yearRange && searchResults.yearRange !== 'all' && (
              <span className="px-3 py-1 bg-[#FFF7E6] dark:bg-[#FFC800]/10 text-[#8A6A00] dark:text-[#FFD659] rounded-full text-sm font-bold">
                Last {searchResults.yearRange} years
              </span>
            )}
            <span className="px-3 py-1 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-full text-sm font-bold">
              {searchResults.citations.length} sources
            </span>
          </div>
        </div>

        {/* Keywords Section */}
        {searchResults.keywords && searchResults.keywords.length > 0 && (
          <div className="bg-white dark:bg-stone-900 border-2 border-stone-200 dark:border-stone-800 rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-extrabold text-stone-900 dark:text-stone-50 mb-4 flex items-center" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
              <svg className="w-5 h-5 mr-2 text-[#A560E8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Recommended keywords
            </h2>
            <div className="flex flex-wrap gap-2">
              {searchResults.keywords.map((keyword, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 bg-[#F3EAFF] dark:bg-[#A560E8]/15 text-[#7733B5] dark:text-[#C9A0F0] rounded-lg text-sm font-bold border border-[#A560E8]/25 dark:border-[#A560E8]/30"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Search Strategies Section */}
        {searchResults.searchStrategies && searchResults.searchStrategies.length > 0 && (
          <div className="bg-white dark:bg-stone-900 border-2 border-stone-200 dark:border-stone-800 rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-extrabold text-stone-900 dark:text-stone-50 mb-4 flex items-center" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
              <svg className="w-5 h-5 mr-2 text-[#A560E8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search strategies
            </h2>
            <ul className="space-y-3">
              {(searchResults.searchStrategies ?? []).map((strategy, index) => (
                <li key={index} className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-[#A560E8] text-white rounded-full flex items-center justify-center text-xs font-extrabold mr-3">
                    {index + 1}
                  </span>
                  <span className="text-stone-700 dark:text-stone-300">{strategy}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Copy All Button */}
        <div className="flex justify-end mb-6">
          <button
            onClick={copyAllCitations}
            className="inline-flex items-center px-5 py-2.5 bg-[#A560E8] hover:bg-[#8A48C7] text-white rounded-2xl font-extrabold border-2 border-b-4 border-[#7733B5] active:border-b-2 active:translate-y-0.5 transition-all"
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
              className="bg-white dark:bg-stone-900 border-2 border-stone-200 dark:border-stone-800 rounded-2xl p-6 hover:border-[#A560E8]/40 hover:shadow-[0_18px_40px_-22px_rgba(96,48,140,0.4)] transition-all"
            >
              {/* Citation Header */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
                <div className="flex items-center">
                  <span className="text-3xl mr-3">{getTypeIcon(citation.type)}</span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-extrabold text-stone-900 dark:text-stone-100 text-lg">[{index + 1}]</span>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getAccessibilityColor(citation.accessibility)}`}>
                        {citation.accessibility}
                      </span>
                      <span className="px-2.5 py-1 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-lg text-xs font-bold">
                        {citation.year}
                      </span>
                    </div>
                    <p className="text-sm text-stone-500 dark:text-stone-500 capitalize">
                      {(citation.type ?? '').replace(/_/g, ' ')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => copyCitation(citation.citation ?? '', index)}
                  className="flex items-center px-4 py-2 text-[#A560E8] hover:bg-[#F3EAFF] dark:hover:bg-[#A560E8]/15 rounded-xl transition-colors font-extrabold text-sm"
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
              <div className="bg-stone-50 dark:bg-stone-800/60 rounded-xl p-4 mb-5 border border-stone-200 dark:border-stone-700">
                <p
                  className="text-stone-800 dark:text-stone-200 leading-relaxed font-serif"
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
                  <h3 className="font-extrabold text-stone-900 dark:text-stone-50 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-[#A560E8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Ready-to-use sentence
                    <span className="ml-2 text-xs bg-[#F3EAFF] dark:bg-[#A560E8]/15 text-[#7733B5] dark:text-[#C9A0F0] px-2 py-1 rounded-full font-bold">
                      Copy &amp; paste
                    </span>
                  </h3>
                  <div className="bg-[#F3EAFF] dark:bg-[#A560E8]/10 rounded-xl p-4 border border-[#A560E8]/25 dark:border-[#A560E8]/30 relative group">
                    <p className="text-stone-800 dark:text-stone-200 leading-relaxed pr-10">{citation.ready_to_use_sentence}</p>
                    {citation.in_text_citation && (
                      <div className="mt-3 pt-3 border-t border-[#A560E8]/25 dark:border-[#A560E8]/30">
                        <p className="text-sm text-[#7733B5] dark:text-[#C9A0F0]">
                          <strong>In-text:</strong> <code className="bg-white dark:bg-stone-900 px-2 py-1 rounded text-[#7733B5] dark:text-[#C9A0F0] font-mono">{citation.in_text_citation}</code>
                        </p>
                      </div>
                    )}
                    <button
                      onClick={() => copyReadyToUseSentence(citation.ready_to_use_sentence!, index)}
                      className="absolute top-3 right-3 p-2 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-sm hover:bg-stone-50 dark:hover:bg-stone-800 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Copy ready-to-use sentence"
                    >
                      {copiedIndex === `ready-${index}` ? (
                        <svg className="w-4 h-4 text-[#A560E8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-[#A560E8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Relevance */}
              <div className="mb-5">
                <h3 className="font-extrabold text-stone-900 dark:text-stone-50 mb-2 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-[#A560E8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Why this source is relevant
                </h3>
                <p className="text-stone-700 dark:text-stone-300 leading-relaxed">{citation.relevance}</p>
              </div>

              {/* Key Points */}
              {citation.key_points && citation.key_points.length > 0 && (
                <div>
                  <h3 className="font-extrabold text-stone-900 dark:text-stone-50 mb-2 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-[#A560E8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Key points
                  </h3>
                  <ul className="space-y-2">
                    {citation.key_points.map((point, pointIndex) => (
                      <li key={pointIndex} className="flex items-start">
                        <span className="w-1.5 h-1.5 bg-[#A560E8] rounded-full mr-3 mt-2 flex-shrink-0"></span>
                        <span className="text-stone-700 dark:text-stone-300">{point}</span>
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
            className="inline-flex items-center px-8 py-4 bg-[#A560E8] hover:bg-[#8A48C7] text-white font-extrabold rounded-2xl border-2 border-b-4 border-[#7733B5] active:border-b-2 active:translate-y-0.5 transition-all text-lg"
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
