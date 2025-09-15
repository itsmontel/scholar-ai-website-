import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import Header from '../common/Header';
import { AnalysisCardSkeleton } from '../common/LoadingSpinner';

interface AnalysisHistoryPageProps {
  onNavigate?: (page: string) => void;
  user?: { name: string; email: string } | null;
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

      const response = await fetch('http://localhost:3001/api/analysis/history?limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analysis history');
      }

      const data = await response.json();
      console.log('Analysis history response:', data);
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

      const response = await fetch(`http://localhost:3001/api/analysis/${analysisId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete analysis');
      }

      // Remove from local state
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
      // Remove hashtags and clean up formatting
      .replace(/#{1,6}\s*/g, '') // Remove markdown headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
      .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
      .replace(/`(.*?)`/g, '$1') // Remove code markdown
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links, keep text
      .replace(/\n{3,}/g, '\n\n') // Limit multiple newlines to double
      .replace(/^\s+|\s+$/g, '') // Trim whitespace
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

    // Add title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Analysis Report', margin, yPosition);
    yPosition += 15;

    // Add document info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Document: ${analysis.documents?.title || 'Unknown'}`, margin, yPosition);
    yPosition += 8;
    doc.text(`Analysis Type: ${getAnalysisTypeName(analysis.analysis_type)}`, margin, yPosition);
    yPosition += 8;
    doc.text(`Date: ${formatDate(analysis.created_at)}`, margin, yPosition);
    yPosition += 15;

    // Add analysis content
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

    // Save the PDF
    const fileName = `analysis-${analysis.analysis_type}-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  const getAnalysisTypeIcon = (type: string): string => {
    const icons: { [key: string]: string } = {
      general: '📝',
      citation: '📚',
      grammar: '✏️',
      plagiarism: '🔍',
      comprehensive: '🎯',
    };
    return icons[type] || '📄';
  };

  const getAnalysisTypeName = (type: string): string => {
    const names: { [key: string]: string } = {
      general: 'General Analysis',
      citation: 'Citation Check',
      grammar: 'Grammar & Language',
      plagiarism: 'Plagiarism Check',
      comprehensive: 'Comprehensive Review',
    };
    return names[type] || type;
  };

  const getAnalysisTypeColor = (type: string): string => {
    const colors: { [key: string]: string } = {
      general: 'bg-blue-100 text-blue-800',
      citation: 'bg-green-100 text-green-800',
      grammar: 'bg-yellow-100 text-yellow-800',
      plagiarism: 'bg-red-100 text-red-800',
      comprehensive: 'bg-purple-100 text-purple-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analysis history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={showHeader ? "min-h-screen bg-gray-50" : ""}>
      {showHeader && <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="analysis-history" />}

      <div className={showHeader ? "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" : "p-6"}>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Analysis History</h1>
          <p className="mt-2 text-gray-600">
            View all your previous document analyses and results
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {analyses.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Analysis History</h3>
            <p className="text-gray-600">
              You haven't analyzed any documents yet. Start by uploading a document and running an analysis.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Analysis List */}
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-white via-gray-50 to-white rounded-2xl shadow-xl border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Analysis History</h2>
                      <p className="text-sm text-gray-500">Your analysis history</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <select
                      value={timeFilter}
                      onChange={(e) => setTimeFilter(e.target.value)}
                      className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    >
                      <option value="last3">Last 3</option>
                      <option value="lastWeek">Last Week</option>
                      <option value="lastMonth">Last Month</option>
                      <option value="lastYear">Last Year</option>
                      <option value="all">All Time</option>
                    </select>
                    <div className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 text-sm font-bold px-3 py-1.5 rounded-full shadow-sm">
                      {filteredAnalyses.length}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, index) => (
                      <AnalysisCardSkeleton key={index} />
                    ))
                  ) : filteredAnalyses.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <h3 className="text-sm font-medium text-gray-900 mb-1">
                        {timeFilter === 'all' ? 'No analyses yet' : `No analyses in ${timeFilter === 'last3' ? 'recent' : timeFilter.replace('last', 'the last ')}`}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {timeFilter === 'all' ? 'Start by analyzing a document' : 'Try selecting a different time period'}
                      </p>
                    </div>
                  ) : (
                    filteredAnalyses.map((analysis) => (
                      <div
                        key={analysis.id}
                        className={`group relative p-5 border-2 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg ${
                          selectedAnalysis?.id === analysis.id
                            ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg scale-[1.02]'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-white shadow-sm'
                        }`}
                        onClick={() => setSelectedAnalysis(analysis)}
                      >
                        {/* Selection indicator */}
                        {selectedAnalysis?.id === analysis.id && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                        
                        <div className="flex items-start space-x-4">
                          <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all duration-300 shadow-md ${
                            selectedAnalysis?.id === analysis.id
                              ? 'bg-gradient-to-br from-blue-100 to-indigo-100 scale-110'
                              : 'bg-gradient-to-br from-gray-100 to-gray-200 group-hover:from-blue-100 group-hover:to-indigo-100'
                          }`}>
                            {getAnalysisTypeIcon(analysis.analysis_type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-bold text-gray-900 truncate mb-1 group-hover:text-blue-900 transition-colors">
                              {analysis.documents?.title || 'Unknown Document'}
                            </h3>
                            <p className="text-sm text-gray-600 mb-3 line-clamp-1">
                              {analysis.documents?.original_filename || 'Unknown file'}
                            </p>
                            
                            <div className="flex items-center justify-between">
                              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300 shadow-sm ${getAnalysisTypeColor(analysis.analysis_type)}`}>
                                {getAnalysisTypeName(analysis.analysis_type)}
                              </span>
                              <div className="text-right">
                                <div className="text-xs text-gray-500 font-medium">
                                  {formatDate(analysis.created_at)}
                                </div>
                                {selectedAnalysis?.id === analysis.id && (
                                  <div className="text-xs text-blue-600 font-bold mt-1 flex items-center">
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    Selected
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Delete Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteAnalysis(analysis.id);
                          }}
                          disabled={isDeleting === analysis.id}
                          className="absolute top-3 right-3 w-8 h-8 bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-700 rounded-full flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete analysis"
                        >
                          {isDeleting === analysis.id ? (
                            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Analysis Details */}
            <div className="lg:col-span-2">
              {selectedAnalysis ? (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-gray-900">
                        {getAnalysisTypeName(selectedAnalysis.analysis_type)}
                      </h2>
                      <span className="text-3xl">
                        {getAnalysisTypeIcon(selectedAnalysis.analysis_type)}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div>
                          <span className="font-medium text-gray-700">Document:</span>
                          <p className="text-gray-900 font-medium">{selectedAnalysis.documents?.title || 'Unknown Document'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div>
                          <span className="font-medium text-gray-700">File:</span>
                          <p className="text-gray-900 font-medium">{selectedAnalysis.documents?.original_filename || 'Unknown file'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <div>
                          <span className="font-medium text-gray-700">Date:</span>
                          <p className="text-gray-900 font-medium">{formatDate(selectedAnalysis.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="prose max-w-none">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6 border border-blue-200">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                        Analysis Results
                      </h3>
                      <p className="text-sm text-gray-600">Comprehensive academic analysis and feedback</p>
                    </div>
                    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                      <div className="prose prose-lg max-w-none">
                        <div className="text-gray-800 leading-relaxed whitespace-pre-wrap font-serif">
                          {cleanAnalysisText(selectedAnalysis.analysis_results?.result || 'No analysis result available')}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-4">Export Options</h4>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(cleanAnalysisText(selectedAnalysis.analysis_results?.result || ''));
                          // You could add a toast notification here
                        }}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      >
                        <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy Text
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
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      >
                        <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download TXT
                      </button>
                      <button
                        onClick={() => generatePDF(selectedAnalysis)}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      >
                        <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        Download PDF
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Analysis</h3>
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
    </div>
  );
};

export default AnalysisHistoryPage;
