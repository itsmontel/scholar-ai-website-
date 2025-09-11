import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';

interface AnalysisHistoryPageProps {
  onNavigate?: (page: string) => void;
}

interface AnalysisHistory {
  id: string;
  analysis_type: string;
  analysis_results: {
    result: string;
  };
  created_at: string;
  documents: {
    title: string;
    original_filename: string;
  };
}

const AnalysisHistoryPage: React.FC<AnalysisHistoryPageProps> = ({ onNavigate }) => {
  const [analyses, setAnalyses] = useState<AnalysisHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisHistory | null>(null);

  useEffect(() => {
    fetchAnalysisHistory();
  }, []);

  const fetchAnalysisHistory = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Please log in to view analysis history');
        return;
      }

      const response = await fetch('http://localhost:3001/api/analysis/history?limit=50', {
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
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => onNavigate?.('dashboard')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back to Dashboard</span>
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => onNavigate?.('analysis')}
                className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium rounded-lg hover:bg-blue-50 transition-colors"
              >
                New Analysis
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Recent Analyses ({analyses.length})
                </h2>
                <div className="space-y-3">
                  {analyses.map((analysis) => (
                    <div
                      key={analysis.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedAnalysis?.id === analysis.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedAnalysis(analysis)}
                    >
                      <div className="flex items-start">
                        <span className="text-2xl mr-3">
                          {getAnalysisTypeIcon(analysis.analysis_type)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {analysis.documents.title}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            {analysis.documents?.original_filename || 'Unknown file'}
                          </p>
                          <div className="mt-2 flex items-center justify-between">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getAnalysisTypeColor(analysis.analysis_type)}`}>
                              {getAnalysisTypeName(analysis.analysis_type)}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDate(analysis.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
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
                          <p className="text-gray-900 font-medium">{selectedAnalysis.documents.title}</p>
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
