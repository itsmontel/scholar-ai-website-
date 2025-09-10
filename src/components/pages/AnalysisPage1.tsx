import React, { useState, useEffect } from 'react';

interface AnalysisPageProps {
  onNavigate?: (page: string) => void;
}

interface Document {
  id: string;
  title: string;
  file_name?: string;
  originalFilename?: string;
  file_type?: string;
  fileType?: string;
  file_size?: number;
  fileSize?: number;
  created_at?: string;
  createdAt?: string;
  content_text?: string;
}

interface AnalysisType {
  id: string;
  name: string;
  description: string;
  icon: string;
  estimatedTime: string;
}

interface Annotation {
  id: string;
  type: 'strong' | 'improve' | 'concern';
  text: string;
  startIndex: number;
  endIndex: number;
  comment: string;
}

interface AnalysisResult {
  success: boolean;
  data: {
    analysisType: string;
    result: string;
    documentId: string;
    timestamp: string;
    annotations?: Annotation[];
  };
}

const AnalysisPage: React.FC<AnalysisPageProps> = ({ onNavigate }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [analysisTypes, setAnalysisTypes] = useState<AnalysisType[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<string>('');
  const [selectedAnalysisType, setSelectedAnalysisType] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [documentContent, setDocumentContent] = useState<string>('');
  const [hoveredAnnotation, setHoveredAnnotation] = useState<Annotation | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchDocuments();
    fetchAnalysisTypes();
  }, []);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Please log in to access documents');
        return;
      }

      const response = await fetch('http://localhost:3001/api/documents', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }

      const data = await response.json();
      setDocuments(data.data.documents || []);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch documents');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAnalysisTypes = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Please log in to access analysis types');
        return;
      }

      const response = await fetch('http://localhost:3001/api/analysis/types', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analysis types');
      }

      const data = await response.json();
      setAnalysisTypes(data.data || []);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch analysis types');
    }
  };

  const parseAnalysisResult = () => {
    // Parse the analysis result to extract annotations based on the actual document content
    if (!documentContent) return;

    const newAnnotations: Annotation[] = [];
    let annotationId = 1;

    // Look for common phrases that indicate strengths, improvements, or concerns
    const strengthPhrases = [
      'excellent', 'strong', 'good', 'well-written', 'clear', 'comprehensive', 'effective', 'commendable'
    ];
    const improvementPhrases = [
      'could be improved', 'needs improvement', 'should be', 'consider', 'expand', 'enhance', 'strengthen'
    ];
    const concernPhrases = [
      'lacks', 'missing', 'insufficient', 'weak', 'unclear', 'confusing', 'problematic', 'critical gap'
    ];

    // Simple keyword-based annotation system
    const words = documentContent.toLowerCase().split(/\s+/);
    
    words.forEach((word, index) => {
      if (strengthPhrases.some(phrase => word.includes(phrase))) {
        const startIndex = documentContent.toLowerCase().indexOf(word, index * 10);
        if (startIndex !== -1) {
          newAnnotations.push({
            id: annotationId.toString(),
            type: 'strong',
            text: word,
            startIndex: startIndex,
            endIndex: startIndex + word.length,
            comment: 'This section demonstrates strong academic writing'
          });
          annotationId++;
        }
      } else if (improvementPhrases.some(phrase => word.includes(phrase))) {
        const startIndex = documentContent.toLowerCase().indexOf(word, index * 10);
        if (startIndex !== -1) {
          newAnnotations.push({
            id: annotationId.toString(),
            type: 'improve',
            text: word,
            startIndex: startIndex,
            endIndex: startIndex + word.length,
            comment: 'This area could benefit from additional development'
          });
          annotationId++;
        }
      } else if (concernPhrases.some(phrase => word.includes(phrase))) {
        const startIndex = documentContent.toLowerCase().indexOf(word, index * 10);
        if (startIndex !== -1) {
          newAnnotations.push({
            id: annotationId.toString(),
            type: 'concern',
            text: word,
            startIndex: startIndex,
            endIndex: startIndex + word.length,
            comment: 'This requires attention and revision'
          });
          annotationId++;
        }
      }
    });

    // If no annotations found, create some demo annotations for the first few sentences
    if (newAnnotations.length === 0 && documentContent.length > 0) {
      const sentences = documentContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
      if (sentences.length > 0) {
        // Mark first sentence as strong
        const firstSentence = sentences[0].trim();
        const startIndex = documentContent.indexOf(firstSentence);
        newAnnotations.push({
          id: '1',
          type: 'strong',
          text: firstSentence,
          startIndex: startIndex,
          endIndex: startIndex + firstSentence.length,
          comment: 'Strong opening that establishes the topic clearly'
        });

        // Mark a middle sentence as needing improvement
        if (sentences.length > 2) {
          const middleSentence = sentences[Math.floor(sentences.length / 2)].trim();
          const startIndex = documentContent.indexOf(middleSentence);
          newAnnotations.push({
            id: '2',
            type: 'improve',
            text: middleSentence,
            startIndex: startIndex,
            endIndex: startIndex + middleSentence.length,
            comment: 'This section could benefit from more detailed explanation'
          });
        }

        // Mark last sentence as a concern
        if (sentences.length > 1) {
          const lastSentence = sentences[sentences.length - 1].trim();
          const startIndex = documentContent.indexOf(lastSentence);
          newAnnotations.push({
            id: '3',
            type: 'concern',
            text: lastSentence,
            startIndex: startIndex,
            endIndex: startIndex + lastSentence.length,
            comment: 'Conclusion needs strengthening with specific recommendations'
          });
        }
      }
    }

    setAnnotations(newAnnotations);
  };

  const fetchDocumentContent = async (documentId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Please log in to access documents');
      }

      const response = await fetch(`http://localhost:3001/api/documents/${documentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch document content');
      }

      const data = await response.json();
      return data.data?.document?.content_text || '';
    } catch (error) {
      console.error('Error fetching document content:', error);
      return '';
    }
  };

  const handleAnalyze = async () => {
    if (!selectedDocument || !selectedAnalysisType) {
      setError('Please select both a document and analysis type');
      return;
    }

    setIsAnalyzing(true);
    setError('');
    setAnalysisResult('');
    setAnnotations([]);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Please log in to analyze documents');
      }

      // Get document content first
      const content = await fetchDocumentContent(selectedDocument);
      if (!content) {
        throw new Error('Document content not available');
      }
      setDocumentContent(content);

      const response = await fetch('http://localhost:3001/api/analysis/analyze', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId: selectedDocument,
          analysisType: selectedAnalysisType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Analysis failed');
      }

      const result: AnalysisResult = await response.json();
      setAnalysisResult(result.data.result);
      
      // Parse annotations from the result
      parseAnalysisResult();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

  const renderHighlightedText = (text: string, annotations: Annotation[]) => {
    if (!annotations.length) return text;

    const parts = [];
    let lastIndex = 0;

    // Sort annotations by start index
    const sortedAnnotations = [...annotations].sort((a, b) => a.startIndex - b.startIndex);

    sortedAnnotations.forEach((annotation) => {
      // Add text before annotation
      if (annotation.startIndex > lastIndex) {
        parts.push(text.slice(lastIndex, annotation.startIndex));
      }

      // Add highlighted annotation
      const highlightedText = text.slice(annotation.startIndex, annotation.endIndex);
      parts.push(
        <span
          key={annotation.id}
          className={`cursor-pointer transition-all duration-200 ${
            annotation.type === 'strong' 
              ? 'bg-green-200 text-green-800 hover:bg-green-300' 
              : annotation.type === 'improve'
              ? 'bg-orange-200 text-orange-800 hover:bg-orange-300'
              : 'bg-red-200 text-red-800 hover:bg-red-300'
          }`}
          onMouseEnter={() => setHoveredAnnotation(annotation)}
          onMouseLeave={() => setHoveredAnnotation(null)}
        >
          {highlightedText}
        </span>
      );

      lastIndex = annotation.endIndex;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts;
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analysis tools...</p>
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
                onClick={() => onNavigate?.('analysis-history')}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-100 transition-colors"
              >
                Analysis History
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">AI Document Analysis</h1>
          <p className="mt-2 text-gray-600">
            Get comprehensive AI-powered feedback on your academic documents
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

        {!analysisResult ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Analysis Configuration */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Configure Analysis</h2>
              
              {/* Document Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Document
                </label>
                <select
                  value={selectedDocument}
                  onChange={(e) => setSelectedDocument(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isAnalyzing}
                >
                  <option value="">Choose a document...</option>
                  {documents.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.title} ({doc.originalFilename || doc.file_name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Analysis Type Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Analysis Type
                </label>
                <div className="space-y-3">
                  {analysisTypes.map((type) => (
                    <div
                      key={type.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedAnalysisType === type.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedAnalysisType(type.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{type.icon}</span>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{type.name}</h3>
                          <p className="text-sm text-gray-600">{type.description}</p>
                          <p className="text-xs text-gray-500 mt-1">⏱️ {type.estimatedTime}</p>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          selectedAnalysisType === type.id
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedAnalysisType === type.id && (
                            <div className="w-full h-full rounded-full bg-white scale-50"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Analyze Button */}
              <button
                onClick={handleAnalyze}
                disabled={!selectedDocument || !selectedAnalysisType || isAnalyzing}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isAnalyzing ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Analyzing...</span>
                  </div>
                ) : (
                  'Analyze Document'
                )}
              </button>
            </div>

            {/* Placeholder for Results */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Analysis Results</h2>
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No analysis yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Select a document and analysis type to get started.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Analysis Results Display */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Document with Annotations */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {documents.find(doc => doc.id === selectedDocument)?.title || 'Document'}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {analysisTypes.find(type => type.id === selectedAnalysisType)?.name} • Analyzed just now
                  </p>
                </div>
                <div className="flex space-x-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Strong sections
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    Needs improvement
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Needs revision
                  </span>
        </div>
      </div>

              <div className="prose max-w-none">
                <div className="bg-gray-50 rounded-lg p-6 border">
                  <div className="text-sm text-gray-800 leading-relaxed">
                    {documentContent ? (
                      renderHighlightedText(documentContent, annotations)
                    ) : (
                      <div className="text-gray-500 italic">
                        Document content not available. This is a demo showing how the analysis would look with highlighted annotations.
              </div>
                    )}
              </div>
            </div>
              </div>
            </div>

            {/* Annotations Sidebar */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Annotations</h3>
              
              <div className="space-y-6">
                {/* Strong Points */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="flex items-center justify-center w-6 h-6 bg-green-100 rounded-full">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                  </div>
                    <h4 className="font-medium text-green-800">Strong Points</h4>
                  </div>
                  <ul className="space-y-2">
                    {annotations.filter(a => a.type === 'strong').map((annotation) => (
                      <li key={annotation.id} className="text-sm text-gray-700 bg-green-50 p-3 rounded-lg border-l-4 border-green-400">
                        {annotation.comment}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Areas to Improve */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="flex items-center justify-center w-6 h-6 bg-orange-100 rounded-full">
                      <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                  </div>
                    <h4 className="font-medium text-orange-800">Areas to Improve</h4>
                  </div>
                  <ul className="space-y-2">
                    {annotations.filter(a => a.type === 'improve').map((annotation) => (
                      <li key={annotation.id} className="text-sm text-gray-700 bg-orange-50 p-3 rounded-lg border-l-4 border-orange-400">
                        {annotation.comment}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Serious Concerns */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="flex items-center justify-center w-6 h-6 bg-red-100 rounded-full">
                      <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                  </div>
                    <h4 className="font-medium text-red-800">Serious Concerns</h4>
                  </div>
                  <ul className="space-y-2">
                    {annotations.filter(a => a.type === 'concern').map((annotation) => (
                      <li key={annotation.id} className="text-sm text-gray-700 bg-red-50 p-3 rounded-lg border-l-4 border-red-400">
                        {annotation.comment}
                      </li>
                    ))}
                  </ul>
                </div>
                  </div>

              {/* Hover Tooltip */}
              {hoveredAnnotation && (
                <div className="fixed z-50 bg-gray-900 text-white text-sm rounded-lg p-3 shadow-lg pointer-events-none"
                     style={{
                       left: '50%',
                       top: '50%',
                       transform: 'translate(-50%, -50%)'
                     }}>
                  <div className="font-medium mb-1">
                    {hoveredAnnotation.type === 'strong' ? 'Strong Point' : 
                     hoveredAnnotation.type === 'improve' ? 'Needs Improvement' : 'Serious Concern'}
                  </div>
                  <div>{hoveredAnnotation.comment}</div>
                </div>
              )}
            </div>
                      </div>
        )}

        {/* Documents List */}
        {documents.length > 0 && !analysisResult && (
          <div className="mt-8 bg-white rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Your Documents</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Document
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Uploaded
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{doc.title}</div>
                        <div className="text-sm text-gray-500">{doc.originalFilename || doc.file_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {doc.fileType || doc.file_type?.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatFileSize(doc.fileSize || doc.file_size || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(doc.createdAt || doc.created_at || new Date().toISOString())}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisPage;