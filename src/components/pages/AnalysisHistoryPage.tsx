import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import Header from '../common/Header';
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
    plan: string;
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

  useEffect(() => {
    fetchAnalysisHistory();
  }, []);

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
      general: '📝',
      citation: '📚',
      grammar: '✏️',
      comprehensive: '🎯',
    };
    return icons[type] || '📄';
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

  const getAnalysisTypeColor = (type: string): string => {
    const colors: { [key: string]: string } = {
      general: 'bg-blue-50 text-blue-700',
      citation: 'bg-green-50 text-green-700',
      grammar: 'bg-amber-50 text-amber-700',
      comprehensive: 'bg-purple-50 text-purple-700',
    };
    return colors[type] || 'bg-gray-50 text-gray-700';
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #FAF8F5 0%, #F5F3F0 100%)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analysis history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={showHeader ? "min-h-screen" : ""} style={showHeader ? { background: 'linear-gradient(180deg, #FAF8F5 0%, #F5F3F0 100%)' } : undefined}>
      {showHeader && <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="analysis-history" />}

      <div className={showHeader ? "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" : "p-6"}>
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">Analysis History</h1>
          <p className="text-lg text-gray-600">
            View all your previous document analyses and results
          </p>
        </div>

        {error && (
          <div className="mb-8 p-5 bg-red-50 border border-red-200 rounded-2xl">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        {analyses.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Analysis History</h3>
            <p className="text-gray-600 mb-6">
              You haven't analyzed any documents yet. Start by uploading a document and running an analysis.
            </p>
            <button
              onClick={() => onNavigate?.('analysis')}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              Start Your First Analysis
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Analysis List */}
            <div className="lg:col-span-1">
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">Recent Analyses</h2>
                  </div>
                  <select
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value)}
                    className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <h3 className="font-medium text-gray-900 mb-1">No analyses found</h3>
                      <p className="text-sm text-gray-500">Try a different time period</p>
                    </div>
                  ) : (
                    filteredAnalyses.map((analysis) => (
                      <div
                        key={analysis.id}
                        className={`group p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          selectedAnalysis?.id === analysis.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedAnalysis(analysis)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-xl ${
                            selectedAnalysis?.id === analysis.id
                              ? 'bg-blue-100'
                              : 'bg-gray-100 group-hover:bg-gray-200'
                          }`}>
                            {getAnalysisTypeIcon(analysis.analysis_type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate mb-1">
                              {analysis.documents?.title || 'Unknown Document'}
                            </h3>
                            <p className="text-sm text-gray-500 truncate mb-2">
                              {analysis.documents?.original_filename || 'Unknown file'}
                            </p>
                            
                            <div className="flex items-center justify-between">
                              <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${getAnalysisTypeColor(analysis.analysis_type)}`}>
                                {getAnalysisTypeName(analysis.analysis_type)}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatDate(analysis.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
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
                            className="flex-1 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors"
                          >
                            View Analysis
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteAnalysis(analysis.id);
                            }}
                            disabled={isDeleting === analysis.id}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Analysis Details */}
            <div className="lg:col-span-2">
              {selectedAnalysis ? (
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                  {/* Header */}
                  <div className="bg-gray-900 text-white px-6 py-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold">
                          {getAnalysisTypeName(selectedAnalysis.analysis_type)}
                        </h2>
                        <p className="text-gray-400 text-sm mt-1">
                          {selectedAnalysis.documents?.title || 'Unknown Document'}
                        </p>
                      </div>
                      <span className="text-4xl">
                        {getAnalysisTypeIcon(selectedAnalysis.analysis_type)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Meta Info */}
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">File:</span>
                        <span className="font-medium text-gray-900">{selectedAnalysis.documents?.original_filename || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">Date:</span>
                        <span className="font-medium text-gray-900">{formatDate(selectedAnalysis.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Analysis Results</h3>
                      <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {cleanAnalysisText(selectedAnalysis.analysis_results?.result || 'No analysis result available')}
                      </div>
                    </div>
                  </div>

                  {/* Export Options */}
                  <div className="px-6 py-5 bg-gray-50 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-900 mb-4">Export Options</h4>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => handleCopyText(cleanAnalysisText(selectedAnalysis.analysis_results?.result || ''))}
                        className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                          copySuccess 
                            ? 'bg-green-50 text-green-700 border border-green-200' 
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
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
                        className="px-4 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                      >
                        Download TXT
                      </button>
                      <button
                        onClick={() => generatePDF(selectedAnalysis)}
                        className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        Download PDF
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-2xl p-10">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Select an Analysis</h3>
                    <p className="text-gray-600">
                      Choose an analysis from the list to view detailed results
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showHeader && <Footer onNavigate={onNavigate} />}
    </div>
  );
};

export default AnalysisHistoryPage;
