import React, { useState, useEffect, useRef, useCallback } from 'react';
import Header from '../common/Header';
import Footer from '../common/Footer';
import LoadingSpinner from '../common/LoadingSpinner';

interface LibraryPageProps {
  onNavigate: (page: string) => void;
  user?: { name: string; email: string } | null;
  onLogout?: () => void;
}

interface Document {
  id: string;
  title: string;
  originalFilename: string;
  fileType: string;
  fileSize: number;
  wordCount: number;
  pageCount: number;
  uploadStatus: string;
  createdAt: string;
  updatedAt: string;
  hasAnalysis?: boolean;
  analysisStatus?: {
    hasAnalysis: boolean;
    lastAnalyzed: string | null;
  };
}

interface Analysis {
    id: string;
  analysis_type: string;
  analysis_results?: {
    result: string;
    strong_points?: Array<{
      text: string;
      explanation: string;
    }>;
    areas_to_improve?: Array<{
      text: string;
      explanation: string;
    }>;
    serious_concerns?: Array<{
      text: string;
      explanation: string;
    }>;
  } | null;
  created_at: string;
  document_id: string;
}

const LibraryPage: React.FC<LibraryPageProps> = ({ onNavigate, user, onLogout }) => {
  // State for documents
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [documentContent, setDocumentContent] = useState<string>('');
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [loadingContent, setLoadingContent] = useState(false);
  
  // State for analysis
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  
  // State for search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState<'all' | 'last7days' | 'lastmonth'>('all');
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  
  // State for view mode
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // State for error handling
  const [, setError] = useState<string | null>(null);

  // State for document editing
  const [editingDocument, setEditingDocument] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  // State for resizable panels
  const [leftPanelWidth, setLeftPanelWidth] = useState(20); // Default 20% (narrower for wider center)
  const [rightPanelWidth, setRightPanelWidth] = useState(25); // Default 25%
  const [isResizing, setIsResizing] = useState(false);
  const [resizeType, setResizeType] = useState<'left' | 'right' | null>(null);
  
  // Refs for resize handling
  const containerRef = useRef<HTMLDivElement>(null);
  const leftResizeRef = useRef<HTMLDivElement>(null);
  const rightResizeRef = useRef<HTMLDivElement>(null);

  // Calculate center panel width
  const centerPanelWidth = 100 - leftPanelWidth - rightPanelWidth;

  // Resize handlers
  const handleMouseDown = useCallback((type: 'left' | 'right') => {
    setIsResizing(true);
    setResizeType(type);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const mouseX = e.clientX - containerRect.left;
    const percentage = (mouseX / containerWidth) * 100;

    if (resizeType === 'left') {
      // Resize left panel, ensure center panel has at least 20% width
      const maxLeftWidth = 100 - rightPanelWidth - 20; // 20% minimum for center
      const newLeftWidth = Math.max(15, Math.min(maxLeftWidth, percentage));
      setLeftPanelWidth(newLeftWidth);
    } else if (resizeType === 'right') {
      // Resize right panel, ensure center panel has at least 20% width
      const maxRightWidth = 100 - leftPanelWidth - 20; // 20% minimum for center
      const newRightWidth = Math.max(15, Math.min(maxRightWidth, 100 - percentage));
      setRightPanelWidth(newRightWidth);
    }
  }, [isResizing, resizeType, leftPanelWidth, rightPanelWidth]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    setResizeType(null);
  }, []);

  // Add event listeners for resize
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Fetch documents on component mount
  useEffect(() => {
    fetchDocuments();
  }, []);

  // Filter documents based on search and time filter
  useEffect(() => {
    let filtered = [...documents];

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(doc => 
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.originalFilename.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply time filter
    if (timeFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      if (timeFilter === 'last7days') {
        filterDate.setDate(now.getDate() - 7);
      } else if (timeFilter === 'lastmonth') {
        filterDate.setMonth(now.getMonth() - 1);
      }
      
      filtered = filtered.filter(doc => new Date(doc.createdAt) >= filterDate);
    }

    setFilteredDocuments(filtered);
  }, [documents, searchTerm, timeFilter]);

  const fetchDocuments = async () => {
    try {
      setLoadingDocuments(true);
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        setError('Please log in to view documents.');
        return;
      }
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/documents?limit=100`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }

      const result = await response.json();
      setDocuments(result.data.documents);
      
      // Auto-select the most recent document (first in the list since they're sorted by date)
      if (result.data.documents.length > 0) {
        const mostRecentDocument = result.data.documents[0];
        console.log('Auto-selecting most recent document:', mostRecentDocument.title);
        setSelectedDocument(mostRecentDocument);
        
        // Automatically load content and analysis for the most recent document
        fetchDocumentContent(mostRecentDocument.id);
        fetchDocumentAnalysis(mostRecentDocument.id);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      setError(error instanceof Error ? error.message : 'Failed to load documents');
    } finally {
      setLoadingDocuments(false);
    }
  };

  const fetchDocumentContent = async (documentId: string) => {
    try {
      setLoadingContent(true);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/documents/${documentId}/content`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch document content');
      }

      const result = await response.json();
      setDocumentContent(result.data.content || '');
    } catch (error) {
      console.error('Error fetching document content:', error);
      setDocumentContent('Error loading document content');
    } finally {
      setLoadingContent(false);
    }
  };

  const fetchDocumentAnalysis = async (documentId: string) => {
    try {
      setLoadingAnalysis(true);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/document/${documentId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
      });

      if (!response.ok) {
        if (response.status === 404) {
          // No analysis found
          setAnalysis(null);
          return;
        }
        throw new Error('Failed to fetch analysis');
      }

      const result = await response.json();
      // API returns an array of analyses, get the most recent one
      setAnalysis(result.data && result.data.length > 0 ? result.data[0] : null);
    } catch (error) {
      console.error('Error fetching analysis:', error);
      setAnalysis(null);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const handleDocumentSelect = (document: Document) => {
    setSelectedDocument(document);
    setDocumentContent('');
    setAnalysis(null);
    
    // Fetch content and analysis for selected document
    fetchDocumentContent(document.id);
    fetchDocumentAnalysis(document.id);
  };

  const handleRenameDocument = async (documentId: string, newTitle: string) => {
    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/documents/${documentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: newTitle }),
      });

      if (!response.ok) {
        throw new Error('Failed to rename document');
      }

      // Update the document in the local state
      setDocuments(prevDocs => 
        prevDocs.map(doc => 
          doc.id === documentId ? { ...doc, title: newTitle } : doc
        )
      );

      // Update selected document if it's the one being renamed
      if (selectedDocument?.id === documentId) {
        setSelectedDocument(prev => prev ? { ...prev, title: newTitle } : null);
      }

    setEditingDocument(null);
    setEditTitle('');
    } catch (error) {
      console.error('Error renaming document:', error);
      setError('Failed to rename document');
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      // Remove the document from local state
      setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== documentId));

      // Clear selection if the deleted document was selected
      if (selectedDocument?.id === documentId) {
      setSelectedDocument(null);
        setDocumentContent('');
        setAnalysis(null);
      }

      setEditingDocument(null);
      setEditTitle('');
    } catch (error) {
      console.error('Error deleting document:', error);
      setError('Failed to delete document');
    }
  };

  const startEditing = (document: Document) => {
    setEditingDocument(document.id);
    setEditTitle(document.title);
  };

  const cancelEditing = () => {
    setEditingDocument(null);
    setEditTitle('');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown date';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getFileTypeIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return (
          <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
            <span className="text-red-600 font-bold text-xs">PDF</span>
          </div>
        );
      case 'docx':
        return (
          <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
            <span className="text-blue-600 font-bold text-xs">DOCX</span>
          </div>
        );
      case 'doc':
        return (
          <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
            <span className="text-green-600 font-bold text-xs">DOC</span>
          </div>
        );
      case 'txt':
        return (
          <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
            <span className="text-gray-600 font-bold text-xs">TXT</span>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
            <span className="text-gray-600 font-bold text-xs">FILE</span>
          </div>
        );
    }
  };

  const renderDocumentContent = () => {
    if (!documentContent) {
  return (
        <div className="prose max-w-none">
          <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
            {documentContent}
              </div>
        </div>
      );
    }

    // Show plain text in Library (highlighting is done in Analysis page)
    return (
      <div className="prose max-w-none">
        <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
          {documentContent}
                </div>
                </div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="library" />

      <div ref={containerRef} className="flex h-[calc(100vh-80px)]">
        {/* Left Panel - Document Library */}
        <div 
          className="border-r border-gray-200 bg-gray-50 flex flex-col"
          style={{ width: `${leftPanelWidth}%` }}
        >
          <div className="p-4 border-b border-gray-200 bg-white">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">MY DOCUMENTS</h2>
            
            {/* Search Bar */}
            <div className="relative mb-4">
              <input
                type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search documents..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
            </div>
            </div>
            
            {/* Filters */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setTimeFilter('all')}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  timeFilter === 'all' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setTimeFilter('last7days')}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  timeFilter === 'last7days' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Last 7 days
              </button>
              <button
                onClick={() => setTimeFilter('lastmonth')}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  timeFilter === 'lastmonth' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Last month
              </button>
        </div>

            {/* View Toggle */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-600">View:</span>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Grid View"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="List View"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </button>
                </div>
              </div>
              </div>

          {/* Document List */}
          <div className="flex-1 overflow-y-auto">
            {loadingDocuments ? (
              <div className="p-4">
                <LoadingSpinner />
            </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <p>No documents found</p>
                {searchTerm && (
            <button 
                    onClick={() => setSearchTerm('')}
                    className="text-blue-600 hover:text-blue-800 mt-2"
            >
                    Clear search
            </button>
              )}
          </div>
        ) : (
              <div className={`p-2 ${viewMode === 'grid' ? 'grid grid-cols-1 gap-3' : ''}`}>
                {filteredDocuments.map((document) => (
                  <div
                    key={document.id}
                    className={`${viewMode === 'grid' 
                      ? `p-4 rounded-lg transition-colors border border-gray-200 hover:shadow-md ${
                          selectedDocument?.id === document.id
                            ? 'bg-blue-100 border-blue-500 ring-2 ring-blue-200'
                            : 'bg-white hover:bg-gray-50'
                        }`
                      : `p-2 mb-1 rounded-lg transition-colors ${
                          selectedDocument?.id === document.id
                            ? 'bg-blue-100 border-l-4 border-blue-500'
                            : 'bg-white hover:bg-gray-100 border border-gray-200'
                        }`
                    }`}
                  >
                    <div className={`${viewMode === 'grid' ? 'flex flex-col h-full' : 'flex items-start space-x-2'}`}>
                      {viewMode === 'grid' ? (
                        // Grid view layout
                        <>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              {getFileTypeIcon(document.fileType)}
                              <div className="flex-1 min-w-0">
                                {editingDocument === document.id ? (
                                  <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        handleRenameDocument(document.id, editTitle);
                                      } else if (e.key === 'Escape') {
                                        cancelEditing();
                                      }
                                    }}
                                    autoFocus
                                  />
                                ) : (
                                  <h3 className="text-sm font-medium text-gray-900 truncate">
                                    {document.title}
                                  </h3>
                                )}
              </div>
            </div>
                            <div className="flex space-x-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditing(document);
                                }}
                                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                title="Rename document"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteDocument(document.id);
                                }}
                                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                title="Delete document"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
            </div>
                          </div>
                          {editingDocument === document.id ? (
                            <div className="flex space-x-2">
            <button 
                                onClick={() => handleRenameDocument(document.id, editTitle)}
                                className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
            >
                                Save
            </button>
                              <button
                                onClick={cancelEditing}
                                className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <>
                              <div 
                                className="cursor-pointer flex-1"
                                onClick={() => handleDocumentSelect(document)}
                              >
                                <div className="space-y-2">
                                  <p className="text-xs text-gray-500">
                                    {formatFileSize(document.fileSize)} • {document.wordCount} words
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    {formatDate(document.createdAt)}
                                  </p>
                                  {(document.analysisStatus?.hasAnalysis || document.hasAnalysis) && (
                                    <div className="flex items-center">
                                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                      <span className="text-xs text-green-600">Analyzed</span>
                                    </div>
              )}
    </div>
                              </div>
                            </>
                          )}
                        </>
                      ) : (
                        // List view layout (original)
                        <>
                      {getFileTypeIcon(document.fileType)}
                          <div className="flex-1 min-w-0">
                        {editingDocument === document.id ? (
                              <div className="space-y-2">
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                      handleRenameDocument(document.id, editTitle);
                                } else if (e.key === 'Escape') {
                                      cancelEditing();
                                }
                              }}
                                  autoFocus
                            />
                                <div className="flex space-x-2">
                            <button
                                    onClick={() => handleRenameDocument(document.id, editTitle)}
                                    className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={cancelEditing}
                                    className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                                >
                                    Cancel
                                </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div 
                                  className="cursor-pointer"
                                  onClick={() => handleDocumentSelect(document)}
                                >
                                  <h3 className="text-sm font-medium text-gray-900 truncate">
                                    {document.title}
                                  </h3>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {formatFileSize(document.fileSize)} • {document.wordCount} words
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    {formatDate(document.createdAt)}
                                  </p>
                                  {(document.analysisStatus?.hasAnalysis || document.hasAnalysis) && (
                                    <div className="flex items-center mt-1">
                                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                      <span className="text-xs text-green-600">Analyzed</span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex space-x-1 mt-1 justify-end">
                          <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startEditing(document);
                                    }}
                                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                    title="Rename document"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteDocument(document.id);
                                    }}
                                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                    title="Delete document"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                              </>
                        )}
                            </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
                    </div>
                    
          {/* Recent Activity */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <h3 className="text-sm font-medium text-gray-900 mb-3">RECENT ACTIVITY</h3>
            <div className="space-y-2">
              {filteredDocuments.slice(0, 3).map((doc) => (
                <div key={doc.id} className="flex items-center text-xs text-gray-600">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  <span className="truncate">{doc.title}</span>
                  <span className="ml-auto text-gray-400">
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
    </div>
          </div>
        </div>

        {/* Left Resize Handle */}
        <div
          ref={leftResizeRef}
          className="w-1 bg-gray-200 hover:bg-blue-400 cursor-col-resize transition-colors relative group"
          onMouseDown={() => handleMouseDown('left')}
        >
          <div className="absolute inset-y-0 -left-1 -right-1 bg-transparent"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-1 h-8 bg-blue-400 rounded"></div>
          </div>
        </div>

        {/* Center Panel - Document Viewer */}
        <div 
          className="flex flex-col"
          style={{ width: `${centerPanelWidth}%` }}
        >
          {selectedDocument ? (
            <>
              <div className="p-6 border-b border-gray-200 bg-white">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      {selectedDocument.title}
                    </h1>
                  <div className="text-sm text-gray-600">
                    By {user?.email || 'User'} • {formatDate(selectedDocument.createdAt)}
                  </div>
                </div>
                
                {/* View Analysis Button */}
                {analysis && (
                  <div className="mt-4">
                      <button
                      onClick={() => {
                        // Simple navigation to analysis page with document ID
                        onNavigate('analysis');
                        // Store the document ID for the analysis page to pick up
                        localStorage.setItem('viewAnalysisDocumentId', selectedDocument.id);
                        // Store flag indicating user came from Library
                        localStorage.setItem('cameFromLibrary', 'true');
                      }}
                      className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center space-x-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      <span>View Analysis</span>
                      </button>
                  </div>
                )}
              </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                {loadingContent ? (
                  <div className="flex items-center justify-center h-full">
                    <LoadingSpinner />
                  </div>
                ) : (
                  renderDocumentContent()
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-lg">Select a document to view</p>
              </div>
    </div>
        )}
        </div>

        {/* Right Resize Handle */}
        <div
          ref={rightResizeRef}
          className="w-1 bg-gray-200 hover:bg-blue-400 cursor-col-resize transition-colors relative group"
          onMouseDown={() => handleMouseDown('right')}
        >
          <div className="absolute inset-y-0 -left-1 -right-1 bg-transparent"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-1 h-8 bg-blue-400 rounded"></div>
          </div>
        </div>

        {/* Right Panel - Annotations */}
        <div 
          className="border-l border-gray-200 bg-gray-50 flex flex-col"
          style={{ width: `${rightPanelWidth}%` }}
        >
          <div className="p-4 border-b border-gray-200 bg-white">
            <h2 className="text-lg font-semibold text-gray-900">Document Analysis</h2>
            <p className="text-sm text-gray-600">AI-generated feedback and suggestions</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {!selectedDocument ? (
              <div className="text-center text-gray-500 mt-8">
                <p>Select a document to view analysis</p>
              </div>
            ) : loadingAnalysis ? (
              <div className="flex items-center justify-center h-full">
                <LoadingSpinner />
              </div>
            ) : !analysis ? (
              <div className="text-center text-gray-500 mt-8">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <p className="mb-4">No analysis available</p>
                      <button
                        onClick={() => {
                    localStorage.setItem('selectedDocumentId', selectedDocument.id);
                    localStorage.setItem('selectedDocumentTitle', selectedDocument.title);
                          onNavigate('analysis');
                        }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Analyze Document
                      </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Comprehensive Academic Analysis */}
                {analysis.analysis_results?.result && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Comprehensive Academic Analysis</h3>
                    <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-400">
                      <div className="prose prose-sm max-w-none">
                        <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                          {analysis.analysis_results.result
                            .replace(/#{1,6}\s*/g, '') // Remove markdown headers
                            .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1') // Remove bold/italic markdown
                            .replace(/`([^`]+)`/g, '$1') // Remove code markdown
                            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove markdown links
                            .trim()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Strong Points */}
                {analysis.analysis_results?.strong_points && analysis.analysis_results.strong_points.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Strong Points</h3>
                    <div className="space-y-3">
                      {analysis.analysis_results.strong_points.map((point, index) => (
                        <div key={index} className="bg-green-50 rounded-lg p-4 border-l-4 border-green-400">
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                            </div>
                            <div className="ml-3">
                              <h4 className="text-sm font-medium text-green-800">Strong Point</h4>
                              <p className="text-sm text-green-700 mt-1">{point.explanation}</p>
                    </div>
                  </div>
                </div>
              ))}
                    </div>
    </div>
        )}

                {/* Areas to Improve */}
                {analysis.analysis_results?.areas_to_improve && analysis.analysis_results.areas_to_improve.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Areas to Improve</h3>
                    <div className="space-y-3">
                      {analysis.analysis_results.areas_to_improve.map((point, index) => (
                        <div key={index} className="bg-amber-50 rounded-lg p-4 border-l-4 border-amber-400">
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
        </div>
                            <div className="ml-3">
                              <h4 className="text-sm font-medium text-amber-800">Consider Clarification</h4>
                              <p className="text-sm text-amber-700 mt-1">{point.explanation}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Serious Concerns */}
                {analysis.analysis_results?.serious_concerns && analysis.analysis_results.serious_concerns.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Serious Concerns</h3>
                    <div className="space-y-3">
                      {analysis.analysis_results.serious_concerns.map((point, index) => (
                        <div key={index} className="bg-red-50 rounded-lg p-4 border-l-4 border-red-400">
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <h4 className="text-sm font-medium text-red-800">Serious Concern</h4>
                              <p className="text-sm text-red-700 mt-1">{point.explanation}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
          </div>
        )}

                {(!analysis.analysis_results?.result && 
                  !analysis.analysis_results?.strong_points?.length && 
                  !analysis.analysis_results?.areas_to_improve?.length && 
                  !analysis.analysis_results?.serious_concerns?.length) && (
                  <div className="text-center text-gray-500 mt-8">
                    <p className="mb-4">No analysis available</p>
                    <button
                      onClick={() => {
                        localStorage.setItem('selectedDocumentId', selectedDocument.id);
                        localStorage.setItem('selectedDocumentTitle', selectedDocument.title);
                        onNavigate('analysis');
                      }}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Analyze Document
                    </button>
      </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default LibraryPage;