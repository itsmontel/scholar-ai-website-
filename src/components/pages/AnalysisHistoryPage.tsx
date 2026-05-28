import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import LoggedInPageShell from '../workspace/LoggedInPageShell';
import Footer from '../common/Footer';
import { AnalysisCardSkeleton } from '../common/LoadingSpinner';

interface AnalysisHistoryPageProps {
  onNavigate?: (page: string) => void;
  user?: {
    id: string;
    name: string;
    email: string;
    firstName?: string;
    lastName?: string;
    plan?: string;
    subscription_plan?: string;
    subscription_status?: string;
    email_verified?: boolean;
  } | null;
  onLogout?: () => void;
  showHeader?: boolean;
}

interface AnalysisHistory {
  id: string;
  analysis_type: string;
  analysis_results?: {
    result: string;
  } | null;
  created_at: string;
  documents?: {
    title: string;
    original_filename: string;
  } | null;
}

const AnalysisHistoryPage: React.FC<AnalysisHistoryPageProps> = ({ onNavigate, user, onLogout, showHeader = true }) => {
  const [analyses, setAnalyses] = useState<AnalysisHistory[]>([]);
  const [filteredAnalyses, setFilteredAnalyses] = useState<AnalysisHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisHistory | null>(null);
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  const userPlan = (user?.plan || user?.subscription_plan || 'free').toLowerCase();
  const isPaidUser = userPlan === 'pro' || userPlan === 'premium';

  useEffect(() => {
    if (isPaidUser) {
      fetchAnalysisHistory();
    } else {
      setIsLoading(false);
    }
  }, [isPaidUser]);

  useEffect(() => {
    filterAnalyses();
  }, [analyses, timeFilter]);

  const fetchAnalysisHistory = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Please log in to view analysis history');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/history?limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analysis history');
      }

      const data = await response.json();
      setAnalyses(data.data || []);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch analysis history');
    } finally {
      setIsLoading(false);
    }
  };

  const filterAnalyses = () => {
    const now = new Date();
    let filtered = [...analyses];

    switch (timeFilter) {
      case 'last3':
        filtered = analyses.slice(0, 3);
        break;
      case 'lastWeek':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = analyses.filter(analysis => new Date(analysis.created_at) >= weekAgo);
        break;
      case 'lastMonth':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filtered = analyses.filter(analysis => new Date(analysis.created_at) >= monthAgo);
        break;
      case 'lastYear':
        const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        filtered = analyses.filter(analysis => new Date(analysis.created_at) >= yearAgo);
        break;
      case 'all':
      default:
        filtered = analyses;
        break;
    }

    setFilteredAnalyses(filtered);
  };

  const deleteAnalysis = async (analysisId: string) => {
    if (!confirm('Are you sure you want to delete this analysis? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(analysisId);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Please log in to delete analysis');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/${analysisId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete analysis');
      }

      setAnalyses(prev => prev.filter(analysis => analysis.id !== analysisId));
      if (selectedAnalysis?.id === analysisId) {
        setSelectedAnalysis(null);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete analysis');
    } finally {
      setIsDeleting(null);
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const cleanAnalysisText = (text: string): string => {
    if (!text) return '';

    return text
      .replace(/#{1,6}\s*/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/^\s+|\s+$/g, '')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n\n');
  };

  const generatePDF = (analysis: AnalysisHistory) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;
    const margin = 20;
    const maxWidth = pageWidth - (margin * 2);

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Analysis Report', margin, yPosition);
    yPosition += 15;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Document: ${analysis.documents?.title || 'Unknown'}`, margin, yPosition);
    yPosition += 8;
    doc.text(`Analysis Type: ${getAnalysisTypeName(analysis.analysis_type)}`, margin, yPosition);
    yPosition += 8;
    doc.text(`Date: ${formatDate(analysis.created_at)}`, margin, yPosition);
    yPosition += 15;

    const cleanText = cleanAnalysisText(analysis.analysis_results?.result || '');
    const lines = doc.splitTextToSize(cleanText, maxWidth);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');

    lines.forEach((line: string) => {
      if (yPosition > pageHeight - 20) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(line, margin, yPosition);
      yPosition += 6;
    });

    const fileName = `analysis-${analysis.analysis_type}-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  const getAnalysisTypeIcon = (type: string): string => {
    const icons: { [key: string]: string } = {
      general: '\u{1F4DD}',
      citation: '\u{1F4DA}',
      grammar: '\u{270F}\u{FE0F}',
      comprehensive: '\u{1F3AF}',
    };
    return icons[type] || '\u{1F4C4}';
  };

  const getAnalysisTypeName = (type: string): string => {
    const names: { [key: string]: string } = {
      general: 'General Analysis',
      citation: 'Citation Check',
      grammar: 'Grammar & Language',
      comprehensive: 'Comprehensive Review',
    };
    return names[type] || type;
  };

  const getAnalysisTypeColor = (type: string): { bg: string; text: string; border: string; tint: string } => {
    const colors: { [key: string]: { bg: string; text: string; border: string; tint: string } } = {
      general: { bg: 'bg-[#A560E8]', text: 'text-[#A560E8]', border: 'border-[#8A48C7]', tint: 'bg-[#F3EAFF]' },
      citation: { bg: 'bg-[#A560E8]', text: 'text-[#A560E8]', border: 'border-[#8A48C7]', tint: 'bg-[#F3EAFF]' },
      grammar: { bg: 'bg-[#A560E8]', text: 'text-[#A560E8]', border: 'border-[#8A48C7]', tint: 'bg-[#F3EAFF]' },
      comprehensive: { bg: 'bg-[#A560E8]', text: 'text-[#A560E8]', border: 'border-[#8A48C7]', tint: 'bg-[#F3EAFF]' },
    };
    return colors[type] || { bg: 'bg-stone-400', text: 'text-stone-600', border: 'border-stone-500', tint: 'bg-stone-100' };
  };

  const handleCopyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <LoggedInPageShell user={user} onNavigate={onNavigate} onLogout={onLogout} currentPage="analysis-history" className="relative min-h-screen flex items-center justify-center overflow-x-clip bg-[#FAF7FF] dark:bg-stone-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-stone-200 border-t-[#A560E8] mx-auto"></div>
          <p className="mt-4 text-stone-500 dark:text-stone-400 font-extrabold">Loading analysis history...</p>
        </div>
      </LoggedInPageShell>
    );
  }

  if (!isPaidUser) {
    const upgradeContent = (
      <div className={showHeader ? 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10' : 'p-6'}>
          <div className="max-w-md mx-auto text-center py-16">
            <div className="w-20 h-20 bg-[#F3EAFF] border-2 border-b-4 border-[#A560E8]/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-[#A560E8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-extrabold text-stone-900 dark:text-stone-100 mb-2">Analysis History is a Pro Feature</h1>
            <p className="text-stone-500 dark:text-stone-400 mb-8">
              Upgrade to Pro to save and access your analysis history. View past analyses, export to PDF, and never lose your feedback.
            </p>
            <button
              onClick={() => onNavigate?.('pricing')}
              className="px-8 py-3 bg-[#A560E8] text-white border-2 border-b-4 border-[#8A48C7] active:border-b-2 active:translate-y-0.5 transition-all font-extrabold uppercase tracking-wide rounded-xl hover:brightness-105"
            >
              Upgrade to Pro
            </button>
            <button
              onClick={() => onNavigate?.('analysis')}
              className="block mx-auto mt-4 text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 text-sm font-extrabold"
            >
              &larr; Back to Analysis
            </button>
          </div>
        </div>
    );

    if (showHeader) {
      return (
        <LoggedInPageShell user={user} onNavigate={onNavigate} onLogout={onLogout} currentPage="analysis-history">
          {upgradeContent}
        </LoggedInPageShell>
      );
    }

    return <div className="bg-[#FAF7FF] dark:bg-stone-950">{upgradeContent}</div>;
  }

  const historyContent = (
    <div className={showHeader ? 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10' : 'p-6'}>
        {/* Header */}
        <div className="mb-8 sm:mb-10">
          <div className="flex items-center gap-2.5">
            <span className="h-px w-7 bg-[#A560E8]/50" aria-hidden />
            <p className="text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.22em] text-[#A560E8]">Your history</p>
          </div>
          <h1 className="dash-serif mt-3 text-[2rem] sm:text-[2.6rem] lg:text-[3rem] font-extrabold leading-[1.03] tracking-tight text-stone-900 dark:text-stone-50">
            Analysis history
          </h1>
          <p className="mt-3 text-sm sm:text-base text-stone-600 dark:text-stone-400 font-medium leading-relaxed max-w-2xl">
            Every analysis you've run, kept in one place. Reopen, copy, or export any of them.
          </p>
        </div>

        {error && (
          <div className="mb-8 p-5 bg-[#FFE8E8] border-2 border-b-4 border-[#FF4B4B]/30 rounded-2xl">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-[#FF4B4B] border-2 border-[#E04343] rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-[#E04343] font-extrabold">{error}</p>
              </div>
            </div>
          </div>
        )}

        {analyses.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-[#F3EAFF] border-2 border-b-4 border-[#A560E8]/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-[#A560E8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-extrabold text-stone-900 dark:text-stone-100 mb-2">No Analysis History</h3>
            <p className="text-stone-500 dark:text-stone-400 mb-6">
              You haven't analyzed any documents yet. Start by uploading a document and running an analysis.
            </p>
            <button
              onClick={() => onNavigate?.('analysis')}
              className="px-6 py-3 bg-[#A560E8] text-white border-2 border-b-4 border-[#8A48C7] active:border-b-2 active:translate-y-0.5 transition-all font-extrabold uppercase tracking-wide rounded-xl hover:brightness-105"
            >
              Start Your First Analysis
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Analysis List */}
            <div className="lg:col-span-1">
              <div className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-3xl shadow-[0_12px_34px_-22px_rgba(0,0,0,0.18)] p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-[#A560E8] border-2 border-[#8A48C7] rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <h2 className="text-lg font-extrabold text-stone-900 dark:text-stone-100">Recent Analyses</h2>
                  </div>
                  <select
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value)}
                    className="bg-stone-50 dark:bg-stone-800 border-2 border-b-[3px] border-stone-200 dark:border-stone-600 rounded-xl px-3 py-2 text-sm font-extrabold text-stone-700 dark:text-stone-300 focus:border-[#A560E8] focus:ring-2 focus:ring-[#A560E8]/30 focus:outline-none"
                  >
                    <option value="last3">Last 3</option>
                    <option value="lastWeek">Last Week</option>
                    <option value="lastMonth">Last Month</option>
                    <option value="lastYear">Last Year</option>
                    <option value="all">All Time</option>
                  </select>
                </div>

                <div className="space-y-3">
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, index) => (
                      <AnalysisCardSkeleton key={index} />
                    ))
                  ) : filteredAnalyses.length === 0 ? (
                    <div className="text-center py-10">
                      <div className="w-16 h-16 bg-[#F3EAFF] border-2 border-b-4 border-[#A560E8]/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-[#A560E8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <h3 className="font-extrabold text-stone-900 dark:text-stone-100 mb-1">No analyses found</h3>
                      <p className="text-sm text-stone-500 dark:text-stone-400">Try a different time period</p>
                    </div>
                  ) : (
                    filteredAnalyses.map((analysis) => {
                      const typeColor = getAnalysisTypeColor(analysis.analysis_type);
                      return (
                        <div
                          key={analysis.id}
                          className={`group p-4 border-2 border-b-4 rounded-2xl cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 ${
                            selectedAnalysis?.id === analysis.id
                              ? 'border-[#A560E8] bg-[#F3EAFF] dark:bg-[#A560E8]/15 shadow-[0_12px_30px_-18px_rgba(165,96,232,0.5)]'
                              : 'border-stone-200 dark:border-stone-700 hover:border-[#A560E8]/40 bg-white dark:bg-stone-900 shadow-[0_8px_22px_-18px_rgba(0,0,0,0.18)]'
                          }`}
                          onClick={() => setSelectedAnalysis(analysis)}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-xl border-2 ${
                              selectedAnalysis?.id === analysis.id
                                ? `${typeColor.tint} ${typeColor.border}`
                                : 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 group-hover:bg-stone-200 dark:group-hover:bg-stone-700'
                            }`}>
                              {getAnalysisTypeIcon(analysis.analysis_type)}
                            </div>

                            <div className="flex-1 min-w-0">
                              <h3 className="font-extrabold text-stone-900 dark:text-stone-100 truncate mb-1">
                                {analysis.documents?.title || 'Unknown Document'}
                              </h3>
                              <p className="text-sm text-stone-500 dark:text-stone-400 truncate mb-2">
                                {analysis.documents?.original_filename || 'Unknown file'}
                              </p>

                              <div className="flex items-center justify-between">
                                <span className={`px-2.5 py-1 rounded-lg text-xs font-extrabold ${typeColor.tint} ${typeColor.text}`}>
                                  {getAnalysisTypeName(analysis.analysis_type)}
                                </span>
                                <span className="text-xs text-stone-500 dark:text-stone-400 font-extrabold">
                                  {formatDate(analysis.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-stone-100 dark:border-stone-800 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (analysis.documents) {
                                  localStorage.setItem('selectedDocumentId', analysis.id);
                                  localStorage.setItem('selectedDocumentTitle', analysis.documents.title);
                                  localStorage.setItem('hasExistingAnalysis', 'true');
                                  onNavigate?.('analysis');
                                }
                              }}
                              className="flex-1 px-3 py-2 bg-[#F3EAFF] text-[#8A48C7] border-2 border-b-4 border-[#A560E8]/30 active:border-b-2 active:translate-y-0.5 transition-all rounded-xl text-sm font-extrabold hover:brightness-95"
                            >
                              View Analysis
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteAnalysis(analysis.id);
                              }}
                              disabled={isDeleting === analysis.id}
                              className="p-2 text-stone-400 dark:text-stone-500 hover:text-[#FF4B4B] hover:bg-[#FFE8E8] border-2 border-transparent hover:border-[#FF4B4B]/30 rounded-xl transition-all"
                            >
                              {isDeleting === analysis.id ? (
                                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                              ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Analysis Details */}
            <div className="lg:col-span-2">
              {selectedAnalysis ? (
                <div className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-3xl shadow-[0_12px_34px_-22px_rgba(0,0,0,0.18)] overflow-hidden">
                  {/* Header */}
                  <div className={`${getAnalysisTypeColor(selectedAnalysis.analysis_type).bg} px-6 py-5`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-extrabold text-white">
                          {getAnalysisTypeName(selectedAnalysis.analysis_type)}
                        </h2>
                        <p className="text-white/70 text-sm mt-1 font-extrabold">
                          {selectedAnalysis.documents?.title || 'Unknown Document'}
                        </p>
                      </div>
                      <span className="text-4xl">
                        {getAnalysisTypeIcon(selectedAnalysis.analysis_type)}
                      </span>
                    </div>
                  </div>

                  {/* Meta Info */}
                  <div className={`${getAnalysisTypeColor(selectedAnalysis.analysis_type).tint} px-6 py-4 border-b-2 border-stone-200 dark:border-stone-700`}>
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-stone-500 dark:text-stone-400 font-extrabold">File:</span>
                        <span className="font-extrabold text-stone-900 dark:text-stone-100">{selectedAnalysis.documents?.original_filename || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-stone-500 dark:text-stone-400 font-extrabold">Date:</span>
                        <span className="font-extrabold text-stone-900 dark:text-stone-100">{formatDate(selectedAnalysis.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="bg-stone-50 dark:bg-stone-800 rounded-xl p-6 border-2 border-stone-200 dark:border-stone-700">
                      <h3 className="text-lg font-extrabold text-stone-900 dark:text-stone-100 mb-4">Analysis Results</h3>
                      <div className="text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-wrap">
                        {cleanAnalysisText(selectedAnalysis.analysis_results?.result || 'No analysis result available')}
                      </div>
                    </div>
                  </div>

                  {/* Export Options */}
                  <div className="px-6 py-5 bg-stone-50 dark:bg-stone-800/50 border-t-2 border-stone-200 dark:border-stone-700">
                    <h4 className="text-sm font-extrabold text-stone-900 dark:text-stone-100 uppercase tracking-wide mb-4">Export Options</h4>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => handleCopyText(cleanAnalysisText(selectedAnalysis.analysis_results?.result || ''))}
                        className={`px-4 py-2.5 rounded-xl text-sm font-extrabold uppercase tracking-wide border-2 border-b-4 active:border-b-2 active:translate-y-0.5 transition-all ${
                          copySuccess
                            ? 'bg-[#F3EAFF] text-[#8A48C7] border-[#A560E8]/30'
                            : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-600 hover:border-stone-300'
                        }`}
                      >
                        {copySuccess ? 'Copied!' : 'Copy Text'}
                      </button>
                      <button
                        onClick={() => {
                          const element = document.createElement('a');
                          const file = new Blob([cleanAnalysisText(selectedAnalysis.analysis_results?.result || '')], { type: 'text/plain' });
                          element.href = URL.createObjectURL(file);
                          element.download = `analysis-${selectedAnalysis.analysis_type}-${new Date().toISOString().split('T')[0]}.txt`;
                          document.body.appendChild(element);
                          element.click();
                          document.body.removeChild(element);
                        }}
                        className="px-4 py-2.5 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-2 border-b-4 border-stone-200 dark:border-stone-600 active:border-b-2 active:translate-y-0.5 transition-all rounded-xl text-sm font-extrabold uppercase tracking-wide hover:border-stone-300"
                      >
                        Download TXT
                      </button>
                      <button
                        onClick={() => generatePDF(selectedAnalysis)}
                        className="px-4 py-2.5 bg-[#A560E8] text-white border-2 border-b-4 border-[#8A48C7] active:border-b-2 active:translate-y-0.5 transition-all rounded-xl text-sm font-extrabold uppercase tracking-wide hover:brightness-105"
                      >
                        Download PDF
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-3xl shadow-[0_12px_34px_-22px_rgba(0,0,0,0.18)] p-10">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-[#F3EAFF] border-2 border-b-4 border-[#A560E8]/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <svg className="w-10 h-10 text-[#A560E8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-extrabold text-stone-900 dark:text-stone-100 mb-2">Select an Analysis</h3>
                    <p className="text-stone-500 dark:text-stone-400">
                      Choose an analysis from the list to view detailed results
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      {showHeader && <Footer onNavigate={onNavigate} />}
    </div>
  );

  if (showHeader) {
    return (
      <LoggedInPageShell user={user} onNavigate={onNavigate} onLogout={onLogout} currentPage="analysis-history">
        {historyContent}
      </LoggedInPageShell>
    );
  }

  return <div className="bg-[#FAF7FF] dark:bg-stone-950">{historyContent}</div>;
};

export default AnalysisHistoryPage;
