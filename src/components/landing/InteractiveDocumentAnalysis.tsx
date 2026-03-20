import { useState, useMemo } from 'react';
import {
  DEMO_PAPERS,
  type DemoAnnotation,
} from '../../data/landingPageDemoAnalysis';

interface InteractiveDocumentAnalysisProps {
  onNavigate: (page: string) => void;
}

export default function InteractiveDocumentAnalysis({ onNavigate }: InteractiveDocumentAnalysisProps) {
  const [selectedDemoId, setSelectedDemoId] = useState<string>(DEMO_PAPERS[0].id);
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
  const [hoveredAnnotation, setHoveredAnnotation] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [mobileTab, setMobileTab] = useState<'document' | 'feedback' | 'analysis'>('document');

  const demo = DEMO_PAPERS.find((d) => d.id === selectedDemoId) ?? DEMO_PAPERS[0];

  // Build annotation spans and paragraph boundaries
  const { annotationSpans, paragraphRanges } = useMemo(() => {
    const spans: { start: number; end: number; annotation: DemoAnnotation }[] = [];
    for (const ann of demo.annotations) {
      const idx = demo.content.indexOf(ann.text);
      if (idx >= 0) {
        spans.push({ start: idx, end: idx + ann.text.length, annotation: ann });
      }
    }
    const sorted = spans.sort((a, b) => a.start - b.start);
    const paras = demo.content.split(/\n\n+/);
    const ranges: { start: number; end: number; text: string }[] = [];
    let searchFrom = 0;
    for (const p of paras) {
      const start = demo.content.indexOf(p, searchFrom);
      if (start >= 0) {
        const end = start + p.length;
        ranges.push({ start, end, text: p });
        searchFrom = end;
      }
    }
    return { annotationSpans: sorted, paragraphRanges: ranges };
  }, [demo]);

  const renderHighlightedDocument = () => {
    return paragraphRanges.map((range, paraIdx) => {
      const isTitle = paraIdx === 0 && range.text === demo.title;
      const overlaps = annotationSpans.filter(s => s.end > range.start && s.start < range.end);
      if (overlaps.length === 0) {
        return (
          <p key={paraIdx} className={`mb-3 text-gray-700 dark:text-stone-300 leading-[1.2] ${isTitle ? 'text-lg font-semibold' : 'text-sm text-justify'}`}>
            {range.text}
          </p>
        );
      }
      const parts: React.ReactNode[] = [];
      let last = 0;
      for (const span of overlaps) {
        const relStart = Math.max(0, span.start - range.start);
        const relEnd = Math.min(range.text.length, span.end - range.start);
        const actualStart = Math.max(relStart, last);
        if (actualStart > last) {
          parts.push(<span key={`t-${last}`}>{range.text.slice(last, actualStart)}</span>);
        }
        if (actualStart < relEnd) {
          const ann = span.annotation;
          const highlightClasses = {
            strong: 'bg-[#dcfce7] dark:bg-green-900/40 text-green-900 dark:text-green-100 rounded-sm px-0.5 border-b-2 border-green-600 dark:border-green-500 hover:bg-[#bbf7d0] dark:hover:bg-green-800/50',
            improve: 'bg-[#fef3c7] dark:bg-amber-900/40 text-amber-900 dark:text-amber-100 rounded-sm px-0.5 border-b-2 border-amber-600 dark:border-amber-500 hover:bg-[#fde68a] dark:hover:bg-amber-800/50',
            concern: 'bg-[#fee2e2] dark:bg-red-900/40 text-red-900 dark:text-red-100 rounded-sm px-0.5 border-b-2 border-red-600 dark:border-red-500 hover:bg-[#fecaca] dark:hover:bg-red-800/50',
          };
          const isSelected = selectedAnnotation === ann.id || hoveredAnnotation === ann.id;
          parts.push(
            <span
              key={ann.id}
              className={`relative inline ${highlightClasses[ann.type]} px-0.5 cursor-pointer transition-all duration-200 ${isSelected ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
              onClick={() => setSelectedAnnotation(ann.id)}
              onMouseEnter={(e) => {
                setHoveredAnnotation(ann.id);
                setTooltipPos({ x: e.clientX, y: e.clientY });
              }}
              onMouseMove={(e) => setTooltipPos({ x: e.clientX, y: e.clientY })}
              onMouseLeave={() => {
                setHoveredAnnotation(null);
                setTooltipPos(null);
              }}
            >
              {range.text.slice(actualStart, relEnd)}
            </span>
          );
        }
        last = Math.max(last, relEnd);
      }
      if (last < range.text.length) {
        parts.push(<span key="t-end">{range.text.slice(last)}</span>);
      }
      return (
        <p key={paraIdx} className={`mb-3 text-gray-700 dark:text-stone-300 leading-[1.2] break-words ${isTitle ? 'text-lg font-semibold' : 'text-sm text-justify'}`}>
          {parts}
        </p>
      );
    });
  };

  const getAnnotationIcon = (type: string) => {
    switch (type) {
      case 'strong':
        return (
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'improve':
        return (
          <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
      case 'concern':
        return (
          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  const strongAnnotations = demo.annotations.filter(a => a.type === 'strong');
  const improveAnnotations = demo.annotations.filter(a => a.type === 'improve');
  const concernAnnotations = demo.annotations.filter(a => a.type === 'concern');

  const renderGradeBreakdown = () => (
    <div className="mx-4 sm:mx-6 mt-6 mb-4 rounded-2xl border border-gray-200 dark:border-stone-600 overflow-hidden">
      <div className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white px-6 py-5">
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <h2 className="text-xl font-bold">General Academic Assessment</h2>
            <p className="text-emerald-100 text-sm mt-0.5">Standard college rubric — thesis, evidence, structure, and clarity</p>
          </div>
          <div className="flex items-center gap-6 ml-auto">
            <div className="text-right">
              <div className="text-3xl font-extrabold">{demo.overallScore}/100</div>
              <div className="text-emerald-100 text-xs">Score</div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-extrabold">{demo.grade}</div>
              <div className="text-emerald-100 text-xs">Grade</div>
            </div>
          </div>
        </div>
      </div>
      <div className="p-6 bg-[#F8FAFC] dark:bg-stone-800">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {demo.rubric.map((cat) => (
            <div key={cat.name} className="p-4 rounded-xl bg-white dark:bg-stone-700/50 border border-gray-200 dark:border-stone-600 shadow-sm min-w-0">
              <div className="flex justify-between items-start gap-2 mb-2">
                <span className="font-medium text-gray-800 dark:text-stone-200 text-sm break-words flex-1 min-w-0">{cat.name}</span>
                <span className="font-bold text-gray-900 dark:text-stone-100 text-sm flex-shrink-0">{cat.score}/{cat.maxScore}</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-stone-400 break-words leading-snug">{cat.feedback}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderComprehensiveAnalysis = () => (
    <div className="border-t border-gray-200 dark:border-stone-700 rounded-t-2xl overflow-hidden">
      <div className="bg-gray-900 dark:bg-stone-950 px-4 sm:px-6 py-4 rounded-t-2xl">
        <h3 className="text-lg font-bold text-white">Comprehensive Academic Analysis</h3>
        <p className="text-gray-400 text-sm mt-0.5">Full analysis report</p>
      </div>
      <div className="p-4 sm:p-6 space-y-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-stone-100">Comprehensive Academic Analysis</h2>

        <div>
          <p className="text-gray-700 dark:text-stone-300 text-sm leading-relaxed mb-4">
            {demo.comprehensiveAnalysis.overallSummary}
          </p>
          <div className="flex flex-wrap gap-6 mb-4">
            <div>
              <span className="text-xs font-semibold text-gray-500 dark:text-stone-400 uppercase">Overall Score</span>
              <p className="text-lg font-bold text-gray-900 dark:text-stone-100">{demo.overallScore}/100</p>
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-500 dark:text-stone-400 uppercase">Grade Estimate</span>
              <p className="text-lg font-bold text-gray-900 dark:text-stone-100">{demo.grade}</p>
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-500 dark:text-stone-400 uppercase">Clarity Rating</span>
              <p className="text-lg font-bold text-gray-900 dark:text-stone-100">{demo.comprehensiveAnalysis.clarityRating}</p>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-stone-100 mb-2">Top Suggestions</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 dark:text-stone-300">
              {demo.comprehensiveAnalysis.topSuggestions.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          </div>
        </div>

        {demo.comprehensiveAnalysis.categories.map((cat) => (
          <div key={cat.name}>
            <h4 className="font-bold text-gray-900 dark:text-stone-100 mb-2">{cat.name}</h4>
            <p className="text-sm text-gray-600 dark:text-stone-400 mb-4">{cat.summary}</p>
            {cat.strengths && cat.strengths.length > 0 && (
              <div className="mb-4">
                <h5 className="text-sm font-semibold text-green-700 dark:text-green-400 mb-2">Strengths</h5>
                <ul className="space-y-2">
                  {cat.strengths.map((s, i) => (
                    <li key={i} className="text-sm">
                      <span className="text-gray-700 dark:text-stone-300">"{s.quote}"</span>
                      <p className="text-gray-600 dark:text-stone-400 mt-0.5">{s.feedback}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {cat.areasForImprovement && cat.areasForImprovement.length > 0 && (
              <div className="mb-4">
                <h5 className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-2">Areas for Improvement</h5>
                <ul className="space-y-2">
                  {cat.areasForImprovement.map((a, i) => (
                    <li key={i} className="text-sm">
                      <span className="text-gray-700 dark:text-stone-300">"{a.quote}"</span>
                      <p className="text-amber-700 dark:text-amber-400 italic mt-0.5">Suggestion: {a.suggestion}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {cat.seriousConcerns && cat.seriousConcerns.length > 0 && (
              <div className="mb-4">
                <h5 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2">Serious Concerns</h5>
                <ul className="space-y-2">
                  {cat.seriousConcerns.map((c, i) => (
                    <li key={i} className="text-sm">
                      <span className="text-gray-700 dark:text-stone-300">"{c.quote}"</span>
                      <p className="text-red-700 dark:text-red-400 italic mt-0.5">Suggestion: {c.suggestion}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}

        <div>
          <h4 className="font-bold text-gray-900 dark:text-stone-100 mb-3">Priority Recommendations</h4>
          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 dark:text-stone-300">
            {demo.comprehensiveAnalysis.priorityRecommendations.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );

  return (
    <div className="rounded-2xl overflow-hidden shadow-xl border border-gray-200 dark:border-stone-600 bg-white dark:bg-stone-900">
      {/* Demo selector + Header */}
      <div className="bg-gray-900 dark:bg-stone-950 px-4 sm:px-6 py-5">
        <div className="flex gap-2 mb-4">
          {DEMO_PAPERS.map((d) => (
            <button
              key={d.id}
              onClick={() => {
                setSelectedDemoId(d.id);
                setSelectedAnnotation(null);
                setHoveredAnnotation(null);
                setMobileTab('document');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedDemoId === d.id
                  ? 'bg-white/20 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-300'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-white leading-snug break-words">{demo.title}</h2>
            <p className="text-gray-400 text-sm mt-1">Comprehensive Review • Sample analysis</p>
          </div>
          <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium text-white">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            PDF
          </button>
          <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium text-white">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Word
          </button>
          <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium text-white">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            Close
          </button>
          </div>
        </div>
      </div>

      {/* Grade breakdown — desktop/tablet; on small screens it lives under the Analysis tab */}
      <div className="hidden lg:block">{renderGradeBreakdown()}</div>

      {/* Hover tooltip for annotations */}
      {hoveredAnnotation && tooltipPos && (() => {
        const ann = demo.annotations.find(a => a.id === hoveredAnnotation);
        if (!ann) return null;
        const tooltipCategory = {
          strong: {
            label: 'Strong point',
            className: 'text-green-400 bg-green-500/20 border-green-500/50',
            icon: <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>,
          },
          improve: {
            label: 'Area to improve',
            className: 'text-amber-400 bg-amber-500/20 border-amber-500/50',
            icon: <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>,
          },
          concern: {
            label: 'Serious concern',
            className: 'text-red-400 bg-red-500/20 border-red-500/50',
            icon: <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>,
          },
        }[ann.type];
        return (
          <div
            className="fixed z-[100] min-w-[220px] max-w-[320px] p-3 bg-stone-900 dark:bg-stone-800 text-white text-xs rounded-lg shadow-xl border border-stone-700 pointer-events-none"
            style={{
              left: Math.min(tooltipPos.x, window.innerWidth - 340),
              top: tooltipPos.y - 8,
              transform: 'translateY(-100%)',
            }}
          >
            <div className={`flex items-center gap-1.5 mb-2 pb-2 border-b border-stone-600 ${tooltipCategory.className} rounded px-2 py-1 w-fit text-[11px] font-semibold`}>
              {tooltipCategory.icon}
              <span>{tooltipCategory.label}</span>
            </div>
            <p className="text-stone-400 text-[11px] mb-2 pb-2 border-b border-stone-600 italic leading-snug">"{ann.text}"</p>
            <p className="font-medium mb-1 text-white">{ann.comment}</p>
            <p className="text-stone-300 italic">{ann.suggestion}</p>
          </div>
        );
      })()}

      {/* Legend + hint — on mobile, only when Document tab is active; always on lg+ */}
      <div
        className={`bg-gray-50 dark:bg-stone-800/50 px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-stone-700 ${
          mobileTab !== 'document' ? 'hidden lg:block' : ''
        }`}
      >
        <p className="text-sm text-gray-600 dark:text-stone-400 mb-3">Click highlights to explore feedback</p>
        <div className="flex flex-wrap items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-400 rounded-full" />
            <span className="text-gray-600 dark:text-stone-400">Strong sections</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-400 rounded-full" />
            <span className="text-gray-600 dark:text-stone-400">Needs improvement</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-400 rounded-full" />
            <span className="text-gray-600 dark:text-stone-400">Needs revision</span>
          </div>
        </div>
      </div>

      {/* Mobile tabs: Document | Feedback | Analysis (lg+ keeps split view + full scroll) */}
      <div className="lg:hidden flex border-b border-gray-200 dark:border-stone-700 bg-gray-50 dark:bg-stone-800/50">
        <button
          type="button"
          onClick={() => setMobileTab('document')}
          className={`flex-1 py-3 px-2 sm:px-3 text-xs sm:text-sm font-semibold transition-colors ${
            mobileTab === 'document'
              ? 'text-rose-600 dark:text-rose-400 border-b-2 border-rose-500 bg-white dark:bg-stone-900'
              : 'text-gray-600 dark:text-stone-400 hover:text-gray-900 dark:hover:text-stone-200'
          }`}
        >
          Document
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('feedback')}
          className={`flex-1 py-3 px-2 sm:px-3 text-xs sm:text-sm font-semibold transition-colors ${
            mobileTab === 'feedback'
              ? 'text-rose-600 dark:text-rose-400 border-b-2 border-rose-500 bg-white dark:bg-stone-900'
              : 'text-gray-600 dark:text-stone-400 hover:text-gray-900 dark:hover:text-stone-200'
          }`}
        >
          Feedback
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('analysis')}
          className={`flex-1 py-3 px-2 sm:px-3 text-xs sm:text-sm font-semibold transition-colors ${
            mobileTab === 'analysis'
              ? 'text-rose-600 dark:text-rose-400 border-b-2 border-rose-500 bg-white dark:bg-stone-900'
              : 'text-gray-600 dark:text-stone-400 hover:text-gray-900 dark:hover:text-stone-200'
          }`}
        >
          Analysis
        </button>
      </div>

      {/* Two-column: Document + Annotations - matches AnalysisPage layout */}
      <div className="flex flex-col lg:flex-row lg:min-h-[560px]">
        {/* Document panel */}
        <div className={`flex-1 min-w-0 p-4 sm:p-6 overflow-y-auto bg-white dark:bg-stone-900 max-h-[420px] lg:max-h-[580px] ${mobileTab !== 'document' ? 'hidden lg:block' : ''}`}>
          <div className="max-w-3xl">
            <div className="text-sm leading-[1.2] text-gray-700 dark:text-stone-300">
              {renderHighlightedDocument()}
            </div>
          </div>
        </div>

        {/* Annotations sidebar */}
        <div className={`w-full lg:w-[380px] lg:min-w-[340px] bg-gray-50 dark:bg-stone-800/50 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-stone-700 overflow-y-auto max-h-[420px] lg:max-h-[580px] flex-shrink-0 ${mobileTab !== 'feedback' ? 'hidden lg:block' : ''}`}>
          <div className="p-5 md:p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-stone-100 mb-5 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              Annotations
            </h3>
            <div className="space-y-6">
              {/* Strong Points */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-green-100 dark:bg-green-900/50 rounded-xl">
                    {getAnnotationIcon('strong')}
                  </div>
                  <h4 className="font-semibold text-green-800 dark:text-green-300">Strong Points ({strongAnnotations.length})</h4>
                </div>
                <div className="space-y-2">
                  {strongAnnotations.map((ann) => (
                    <div
                      key={ann.id}
                      className={`bg-white dark:bg-stone-800 rounded-xl p-3.5 border-l-[6px] border-green-500 shadow-[0_4px_6px_rgba(0,0,0,0.07)] hover:shadow-md transition-all cursor-pointer min-w-0 ${
                        selectedAnnotation === ann.id ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => setSelectedAnnotation(ann.id)}
                      onMouseEnter={() => setHoveredAnnotation(ann.id)}
                      onMouseLeave={() => setHoveredAnnotation(null)}
                    >
                      <p className="text-[13px] text-gray-700 dark:text-stone-300 font-medium mb-1 break-words leading-snug">{ann.comment}</p>
                      <p className="text-[12px] text-gray-500 dark:text-stone-400 italic break-words leading-snug">{ann.suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Areas to Improve */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-amber-100 dark:bg-amber-900/50 rounded-xl">
                    {getAnnotationIcon('improve')}
                  </div>
                  <h4 className="font-semibold text-amber-800 dark:text-amber-300">Areas to Improve ({improveAnnotations.length})</h4>
                </div>
                <div className="space-y-2">
                  {improveAnnotations.map((ann) => (
                    <div
                      key={ann.id}
                      className={`bg-white dark:bg-stone-800 rounded-xl p-3.5 border-l-[6px] border-amber-500 shadow-[0_4px_6px_rgba(0,0,0,0.07)] hover:shadow-md transition-all cursor-pointer min-w-0 ${
                        selectedAnnotation === ann.id ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => setSelectedAnnotation(ann.id)}
                      onMouseEnter={() => setHoveredAnnotation(ann.id)}
                      onMouseLeave={() => setHoveredAnnotation(null)}
                    >
                      <p className="text-[13px] text-gray-700 dark:text-stone-300 font-medium mb-1 break-words leading-snug">{ann.comment}</p>
                      <p className="text-[12px] text-gray-500 dark:text-stone-400 italic break-words leading-snug">{ann.suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Serious Concerns */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-red-100 dark:bg-red-900/50 rounded-xl">
                    {getAnnotationIcon('concern')}
                  </div>
                  <h4 className="font-semibold text-red-800 dark:text-red-300">Serious Concerns ({concernAnnotations.length})</h4>
                </div>
                <div className="space-y-2">
                  {concernAnnotations.map((ann) => (
                    <div
                      key={ann.id}
                      className={`bg-white dark:bg-stone-800 rounded-xl p-3.5 border-l-[6px] border-red-500 shadow-[0_4px_6px_rgba(0,0,0,0.07)] hover:shadow-md transition-all cursor-pointer min-w-0 ${
                        selectedAnnotation === ann.id ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => setSelectedAnnotation(ann.id)}
                      onMouseEnter={() => setHoveredAnnotation(ann.id)}
                      onMouseLeave={() => setHoveredAnnotation(null)}
                    >
                      <p className="text-[13px] text-gray-700 dark:text-stone-300 font-medium mb-1 break-words leading-snug">{ann.comment}</p>
                      <p className="text-[12px] text-gray-500 dark:text-stone-400 italic break-words leading-snug">{ann.suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile-only: rubric + full report in Analysis tab */}
        <div
          className={`lg:hidden w-full overflow-y-auto max-h-[min(80vh,640px)] bg-white dark:bg-stone-900 border-t border-gray-200 dark:border-stone-700 ${
            mobileTab !== 'analysis' ? 'hidden' : ''
          }`}
        >
          <div className="[&>div]:mx-0 [&>div]:mt-0 [&>div]:mb-0 [&>div]:rounded-none [&>div]:border-0">
            {renderGradeBreakdown()}
          </div>
          <div className="border-t border-gray-200 dark:border-stone-700 [&>div]:border-t-0 [&>div]:rounded-none">
            {renderComprehensiveAnalysis()}
          </div>
        </div>
      </div>

      {/* Comprehensive Academic Analysis — desktop/tablet full-width below split */}
      <div className="hidden lg:block">{renderComprehensiveAnalysis()}</div>

      {/* Footer */}
      <div className="px-4 sm:px-6 py-4 bg-gray-50 dark:bg-stone-800/50 border-t border-gray-200 dark:border-stone-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <span className="px-3 py-1.5 bg-white dark:bg-stone-800 rounded-lg text-xs font-medium text-gray-600 dark:text-stone-400 border border-gray-200 dark:border-stone-600">
            Word Count: {demo.wordCount}
          </span>
          <span className="px-3 py-1.5 bg-white dark:bg-stone-800 rounded-lg text-xs font-medium text-gray-600 dark:text-stone-400 border border-gray-200 dark:border-stone-600">
            Citation Style: None
          </span>
        </div>
        <button
          onClick={() => onNavigate('signup')}
          className="px-6 py-2.5 bg-gray-900 dark:bg-stone-700 hover:bg-gray-800 dark:hover:bg-stone-600 text-white font-semibold rounded-xl transition-colors text-sm"
        >
          Export Report
        </button>
      </div>
    </div>
  );
}
