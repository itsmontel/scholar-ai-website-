import React, { useState, useEffect, useRef, useCallback } from 'react';
import LoggedInPageShell from '../workspace/LoggedInPageShell';
import Footer from '../common/Footer';
import LoadingSpinner from '../common/LoadingSpinner';

interface LibraryPageProps {
  onNavigate: (page: string) => void;
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

interface AnalysisData {
  all: Analysis[];
  comprehensive: Analysis | null;
  citation: Analysis | null;
  hasComprehensive: boolean;
  hasCitation: boolean;
}

const LibraryPage: React.FC<LibraryPageProps> = ({ onNavigate, user, onLogout }) => {
  // State for documents
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [documentContent, setDocumentContent] = useState<string>('');
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [loadingContent, setLoadingContent] = useState(false);

  /**
   * Pre-selected document id captured from sessionStorage on the very
   * first render of this component instance. Set by:
   *   • the Stripe-checkout-restore flow (AnalysisPage.tsx:1104)
   *   • dashboard analyze recents clicks (DashboardPageNew.tsx)
   *
   * Captured here in a `useState` *initializer* (not inside the fetch
   * effect) for one specific reason: React.StrictMode in dev double-
   * invokes effects (mount → cleanup → mount), so `fetchDocuments` runs
   * twice. The previous logic read+cleared sessionStorage inside the
   * fetch, which meant the second run found the key empty and fell
   * back to `docs[0]` — producing a brief flash of the correct doc
   * before it flipped to the most-recent one. useState initialisers
   * run exactly once per instance regardless of effect double-firing,
   * so the captured id survives both StrictMode invocations and any
   * future re-fetches.
   */
  const [restoreDocIdOnMount] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const id = sessionStorage.getItem('librarySelectDocumentAfterCheckout');
      if (id) {
        sessionStorage.removeItem('librarySelectDocumentAfterCheckout');
        sessionStorage.removeItem('librarySelectAnalysisTypeAfterCheckout');
      }
      return id;
    } catch {
      return null;
    }
  });
  
  // State for analysis
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  
  // State for search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState<'all' | 'last7days' | 'lastmonth'>('all');
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  
  // State for view mode
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  
  // State for mobile view (which panel to show)
  const [mobileView, setMobileView] = useState<'list' | 'document' | 'analysis'>('list');
  
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
      
      // Use bulletproof API for ultra-reliable document fetching
      const { BulletproofAPI } = await import('../../config/api');
      const result = await BulletproofAPI.safeRequest(
        () => BulletproofAPI.get('/documents?limit=100', token),
        { documents: [] as any[] }
      );

      if (result.success) {
        console.log('✅ Library documents loaded successfully');
        const docs = result.data.documents || [];
        setDocuments(docs);
        setError(''); // Clear any previous errors

        if (docs.length > 0) {
          // Use the doc id captured at first render (see
          // `restoreDocIdOnMount` useState above). Reading it from state
          // — not from sessionStorage here — means StrictMode's double
          // effect run can't drop the value on the second invocation,
          // which was causing the "correct doc → flash → most-recent
          // doc" bug. Don't auto-override an existing selection either:
          // if the user already manually picked a doc before this fetch
          // resolved (unlikely but possible), respect their click.
          const fromRestore = restoreDocIdOnMount
            ? docs.find((d) => d.id === restoreDocIdOnMount)
            : null;
          const docToShow = fromRestore || selectedDocument || docs[0];
          console.log(
            fromRestore
              ? 'Restoring requested document on Library load:'
              : selectedDocument
                ? 'Preserving already-selected document:'
                : 'Auto-selecting most recent document:',
            docToShow.title
          );
          if (!selectedDocument || (fromRestore && selectedDocument.id !== docToShow.id)) {
            setSelectedDocument(docToShow);
            fetchDocumentContent(docToShow.id);
            fetchDocumentAnalysis(docToShow.id);
          }
          // Show the analysis panel on mobile when we restored a doc
          // (deep-link case — usually means the user came from a tile
          // that expects to see the analysis side, not the document
          // body).
          if (fromRestore && window.innerWidth < 768) {
            setMobileView('analysis');
          }
        }
      } else {
        console.error('📚 Library documents fetch failed:', result.error);
        setError('Failed to load documents. Retrying automatically...');
        setDocuments([]);
      }
    } catch (error) {
      console.error('💥 Critical error in Library fetchDocuments:', error);
      setError('Unable to load documents. Please check your connection.');
      setDocuments([]);
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
          setAnalysisData(null);
          return;
        }
        throw new Error('Failed to fetch analysis');
      }

      const result = await response.json();
      // API now returns structured data with separate comprehensive and citation analyses
      setAnalysisData(result.data || null);
    } catch (error) {
      console.error('Error fetching analysis:', error);
      setAnalysisData(null);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const handleDocumentSelect = (document: Document) => {
    setSelectedDocument(document);
    setDocumentContent('');
    setAnalysisData(null);
    
    // Fetch content and analysis for selected document
    fetchDocumentContent(document.id);
    fetchDocumentAnalysis(document.id);
    
    // On mobile, automatically switch to document view when a document is selected
    if (window.innerWidth < 768) {
      setMobileView('document');
    }
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
        setAnalysisData(null);
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
          <div className="w-10 h-10 bg-[#FF4B4B] rounded-xl flex items-center justify-center border-2 border-b-4 border-[#E04343]">
            <span className="text-white font-extrabold text-xs">PDF</span>
          </div>
        );
      case 'docx':
        return (
          <div className="w-10 h-10 bg-[#A560E8] rounded-xl flex items-center justify-center border-2 border-b-4 border-[#8A48C7]">
            <span className="text-white font-extrabold text-xs">DOCX</span>
          </div>
        );
      case 'doc':
        return (
          <div className="w-10 h-10 bg-[#58CC02] rounded-xl flex items-center justify-center border-2 border-b-4 border-[#46A302]">
            <span className="text-white font-extrabold text-xs">DOC</span>
          </div>
        );
      case 'txt':
        return (
          <div className="w-10 h-10 bg-stone-400 rounded-xl flex items-center justify-center border-2 border-b-4 border-stone-500">
            <span className="text-white font-extrabold text-xs">TXT</span>
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 bg-stone-400 rounded-xl flex items-center justify-center border-2 border-b-4 border-stone-500">
            <span className="text-white font-extrabold text-xs">FILE</span>
          </div>
        );
    }
  };

  const renderDocumentContent = () => {
    if (!documentContent) {
  return (
        <div className="prose max-w-none">
          <div className="whitespace-pre-wrap text-stone-800 leading-relaxed">
            {documentContent}
              </div>
        </div>
      );
    }

    // Show plain text in Library (highlighting is done in Analysis page)
    return (
      <div className="prose max-w-none">
        <div className="whitespace-pre-wrap text-stone-800 leading-relaxed">
          {documentContent}
                </div>
                </div>
    );
  };

  return (
    <LoggedInPageShell user={user} onNavigate={onNavigate} onLogout={onLogout} currentPage="library">
      {/* Mobile Navigation Tabs */}
      <div className="md:hidden bg-white border-b-2 border-stone-200 sticky top-0 z-10 p-2">
        <div className="flex gap-2">
          <button
            onClick={() => setMobileView('list')}
            className={`flex-1 py-2.5 text-sm font-extrabold rounded-xl transition-all ${
              mobileView === 'list'
                ? 'bg-[#1CB0F6] text-white border-2 border-b-4 border-[#1899D6]'
                : 'text-stone-500 bg-white border-2 border-b-4 border-stone-200 active:border-b-2 active:translate-y-0.5'
            }`}
          >
            📁 Documents
          </button>
          <button
            onClick={() => setMobileView('document')}
            className={`flex-1 py-2.5 text-sm font-extrabold rounded-xl transition-all ${
              mobileView === 'document'
                ? 'bg-[#1CB0F6] text-white border-2 border-b-4 border-[#1899D6]'
                : 'text-stone-500 bg-white border-2 border-b-4 border-stone-200 active:border-b-2 active:translate-y-0.5'
            }`}
            disabled={!selectedDocument}
          >
            📄 Viewer
          </button>
          <button
            onClick={() => setMobileView('analysis')}
            className={`flex-1 py-2.5 text-sm font-extrabold rounded-xl transition-all ${
              mobileView === 'analysis'
                ? 'bg-[#1CB0F6] text-white border-2 border-b-4 border-[#1899D6]'
                : 'text-stone-500 bg-white border-2 border-b-4 border-stone-200 active:border-b-2 active:translate-y-0.5'
            }`}
            disabled={!selectedDocument}
          >
            📝 Analysis
          </button>
        </div>
      </div>

      <div ref={containerRef} className="flex min-h-[calc(100vh-80px)] md:h-[calc(100vh-80px)]">
        {/* Left Panel - Document Library */}
        <div 
          className={`w-full md:border-r-2 border-stone-200 bg-stone-50 flex flex-col md:w-auto ${
            mobileView !== 'list' ? 'hidden md:flex' : ''
          }`}
          style={{ width: window.innerWidth < 768 ? '100%' : `${leftPanelWidth}%` }}
        >
          <div className="p-4 md:p-5 border-b-2 border-stone-200 bg-white">
            <h2 className="text-lg md:text-xl font-extrabold text-stone-900 mb-4 md:mb-5">📁 My Documents</h2>

            {/* Search Bar */}
            <div className="relative mb-4">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search documents..."
                className="w-full pl-10 pr-4 py-2.5 text-sm font-bold bg-white border-2 border-stone-200 rounded-xl focus:border-[#1CB0F6] focus:ring-2 focus:ring-[#1CB0F6]/20 transition-all"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-4 flex-wrap">
              <button
                onClick={() => setTimeFilter('all')}
                className={`px-3 py-1.5 text-xs md:text-sm rounded-xl font-extrabold transition-all ${
                  timeFilter === 'all'
                    ? 'bg-[#1CB0F6] text-white border-2 border-b-4 border-[#1899D6]'
                    : 'bg-white text-stone-500 border-2 border-b-4 border-stone-200 active:border-b-2 active:translate-y-0.5'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setTimeFilter('last7days')}
                className={`px-3 py-1.5 text-xs md:text-sm rounded-xl font-extrabold transition-all ${
                  timeFilter === 'last7days'
                    ? 'bg-[#1CB0F6] text-white border-2 border-b-4 border-[#1899D6]'
                    : 'bg-white text-stone-500 border-2 border-b-4 border-stone-200 active:border-b-2 active:translate-y-0.5'
                }`}
              >
                Last 7 days
              </button>
              <button
                onClick={() => setTimeFilter('lastmonth')}
                className={`px-3 py-1.5 text-xs md:text-sm rounded-xl font-extrabold transition-all ${
                  timeFilter === 'lastmonth'
                    ? 'bg-[#1CB0F6] text-white border-2 border-b-4 border-[#1899D6]'
                    : 'bg-white text-stone-500 border-2 border-b-4 border-stone-200 active:border-b-2 active:translate-y-0.5'
                }`}
              >
                Last month
              </button>
            </div>

            {/* View Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-stone-500 font-extrabold">View:</span>
              <div className="flex bg-stone-100 rounded-xl p-1 border-2 border-stone-200">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'grid'
                      ? 'bg-[#1CB0F6] text-white'
                      : 'text-stone-500 hover:text-stone-700'
                  }`}
                  title="Grid View"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'list'
                      ? 'bg-[#1CB0F6] text-white'
                      : 'text-stone-500 hover:text-stone-700'
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
              <div className="p-6 flex items-center justify-center">
                <LoadingSpinner />
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-stone-500 mb-3">No documents found</p>
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="text-violet-600 hover:text-violet-700 font-medium text-sm"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <div className={`p-3 ${viewMode === 'grid' ? 'grid grid-cols-1 gap-4' : 'space-y-1.5'}`}>
                {filteredDocuments.map((document) => (
                  <div
                    key={document.id}
                    className={`${viewMode === 'grid'
                      ? `p-4 rounded-xl transition-all border-2 border-b-4 ${
                          selectedDocument?.id === document.id
                            ? 'bg-[#DDF4FF] border-[#1CB0F6]'
                            : 'bg-white border-stone-200 hover:border-stone-300'
                        }`
                      : `py-2 px-3 rounded-xl transition-all cursor-pointer border-2 border-b-4 ${
                          selectedDocument?.id === document.id
                            ? 'bg-[#DDF4FF] border-[#1CB0F6]'
                            : 'bg-white border-stone-200 hover:border-stone-300'
                        }`
                    }`}
                  >
                    <div className={`${viewMode === 'grid' ? 'w-full' : 'flex items-start space-x-2'}`}>
                      {viewMode === 'grid' ? (
                        // GRID VIEW - Fixed to match image exactly
                        <div className="relative">
                          {/* Action buttons positioned outside card, top right */}
                          <div className="absolute top-0 right-0 z-10 flex space-x-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditing(document);
                              }}
                              className="p-1 text-stone-400 hover:text-violet-600"
                              title="Rename"
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
                              className="p-1 text-stone-400 hover:text-red-600"
                              title="Delete"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                          
                  {/* Card content */}
                  <div 
                    className="cursor-pointer"
                    onClick={() => handleDocumentSelect(document)}
                  >
                    {/* FILE badge */}
                    <div className="mb-2">
                      {getFileTypeIcon(document.fileType)}
                    </div>
                    
                    {/* Document title */}
                    <div className="mb-2">
                      <h3 className="text-sm font-medium text-stone-900 truncate">
                        {document.title}
                      </h3>
                    </div>
                    
                    {/* File info stacked vertically */}
                    <div className="space-y-1 text-xs text-stone-500 font-bold">
                      <div>{formatFileSize(document.fileSize)}</div>
                      <div>{document.wordCount} words</div>
                      <div>{formatDate(document.createdAt)}</div>
                      {(document.analysisStatus?.hasAnalysis || document.hasAnalysis) && (
                        <div className="flex items-center text-[#58CC02] font-extrabold">
                          <div className="w-1.5 h-1.5 bg-[#58CC02] rounded-full mr-1"></div>
                          Analyzed
                        </div>
                      )}
                    </div>
                  </div>
                        </div>
                      ) : (
                        // List view layout - Compact and thin
                        <>
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            {/* Smaller file icon for list view */}
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border-2 border-b-4 ${
                              document.fileType.toLowerCase() === 'pdf' ? 'bg-[#FF4B4B] border-[#E04343]' :
                              document.fileType.toLowerCase() === 'docx' ? 'bg-[#A560E8] border-[#8A48C7]' :
                              document.fileType.toLowerCase() === 'doc' ? 'bg-[#58CC02] border-[#46A302]' : 'bg-stone-400 border-stone-500'
                            }`}>
                              <span className="font-extrabold text-[10px] text-white">
                                {document.fileType.toUpperCase().slice(0, 3)}
                              </span>
                            </div>

                            {editingDocument === document.id ? (
                              <div className="flex-1 flex items-center space-x-2">
                                <input
                                  type="text"
                                  value={editTitle}
                                  onChange={(e) => setEditTitle(e.target.value)}
                                  className="flex-1 px-2 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-violet-500 focus:border-transparent"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleRenameDocument(document.id, editTitle);
                                    } else if (e.key === 'Escape') {
                                      cancelEditing();
                                    }
                                  }}
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleRenameDocument(document.id, editTitle)}
                                  className="px-1.5 py-0.5 text-[10px] bg-[#58CC02] text-white rounded-lg font-extrabold border-b-2 border-[#46A302]"
                                >
                                  ✓
                                </button>
                                <button
                                  onClick={cancelEditing}
                                  className="px-1.5 py-0.5 text-[10px] bg-stone-500 text-white rounded-lg font-extrabold border-b-2 border-stone-600"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <>
                                <div 
                                  className="flex-1 min-w-0 flex items-center justify-between"
                                  onClick={() => handleDocumentSelect(document)}
                                >
                                  <div className="flex-1 min-w-0">
                                    <h3 className="text-xs font-medium text-gray-900 truncate leading-tight">
                                      {document.title}
                                    </h3>
                                  </div>
                                  <div className="flex items-center space-x-2 ml-2 flex-shrink-0">
                                    <span className="text-[10px] text-gray-500">
                                      {formatFileSize(document.fileSize)}
                                    </span>
                                    {(document.analysisStatus?.hasAnalysis || document.hasAnalysis) && (
                                      <div className="w-1.5 h-1.5 bg-[#58CC02] rounded-full"></div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex space-x-0.5 flex-shrink-0">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startEditing(document);
                                    }}
                                    className="p-0.5 text-gray-400 hover:text-violet-600 transition-colors"
                                    title="Rename"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteDocument(document.id);
                                    }}
                                    className="p-0.5 text-gray-400 hover:text-red-600 transition-colors"
                                    title="Delete"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div className="hidden md:block p-4 border-t-2 border-stone-200 bg-white">
            <h3 className="text-sm font-extrabold text-stone-900 mb-3">⚡ Recent Activity</h3>
            <div className="space-y-2">
              {filteredDocuments.slice(0, 3).map((doc) => (
                <div key={doc.id} className="flex items-center text-xs text-stone-600 p-2 bg-stone-50 rounded-xl border-2 border-stone-100">
                  <div className="w-2 h-2 bg-[#1CB0F6] rounded-full mr-2 flex-shrink-0"></div>
                  <span className="truncate flex-1 min-w-0 font-bold text-stone-700">{doc.title}</span>
                  <span className="ml-2 text-stone-400 text-xs flex-shrink-0 font-bold">
                    {new Date(doc.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Left Resize Handle */}
        <div
          ref={leftResizeRef}
          className="hidden md:block w-1 bg-stone-200 hover:bg-[#1CB0F6] cursor-col-resize transition-colors relative group"
          onMouseDown={() => handleMouseDown('left')}
        >
          <div className="absolute inset-y-0 -left-1 -right-1 bg-transparent"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-1 h-10 bg-[#1CB0F6] rounded-full"></div>
          </div>
        </div>

        {/* Center Panel - Document Viewer */}
        <div 
          className={`flex flex-col w-full bg-white ${
            mobileView !== 'document' ? 'hidden md:flex' : ''
          }`}
          style={{ width: window.innerWidth < 768 ? '100%' : `${centerPanelWidth}%` }}
        >
          {selectedDocument ? (
            <>
              <div className="p-5 md:p-6 border-b-2 border-stone-200 bg-white">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h1 className="text-xl md:text-2xl font-extrabold text-stone-900 mb-2">
                      {selectedDocument.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-stone-500 font-bold">
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {user?.email || 'User'}
                      </span>
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatDate(selectedDocument.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Analysis Buttons */}
                {analysisData && (analysisData.hasComprehensive || analysisData.hasCitation) && (
                  <div className="mt-5 flex flex-wrap gap-3">
                    {/* Comprehensive Analysis Button */}
                    {analysisData.hasComprehensive && (
                      <button
                        onClick={() => {
                          onNavigate('analysis');
                          localStorage.setItem('viewAnalysisDocumentId', selectedDocument.id);
                          localStorage.setItem('viewAnalysisType', 'comprehensive');
                          localStorage.setItem('cameFromLibrary', 'true');
                        }}
                        className="flex-1 min-w-[200px] bg-[#58CC02] text-white px-4 py-3 rounded-xl font-extrabold uppercase tracking-wide flex items-center justify-center space-x-2 text-sm border-2 border-b-4 border-[#46A302] active:border-b-2 active:translate-y-0.5 transition-all"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>View Comprehensive Analysis</span>
                      </button>
                    )}

                    {/* Citation Analysis Button */}
                    {analysisData.hasCitation && (
                      <button
                        onClick={() => {
                          onNavigate('analysis');
                          localStorage.setItem('viewAnalysisDocumentId', selectedDocument.id);
                          localStorage.setItem('viewAnalysisType', 'citation');
                          localStorage.setItem('cameFromLibrary', 'true');
                        }}
                        className="flex-1 min-w-[200px] bg-[#1CB0F6] text-white px-4 py-3 rounded-xl font-extrabold uppercase tracking-wide flex items-center justify-center space-x-2 text-sm border-2 border-b-4 border-[#1899D6] active:border-b-2 active:translate-y-0.5 transition-all"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span>View Citation Analysis</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex-1 overflow-y-auto p-5 md:p-6 bg-stone-50">
                {loadingContent ? (
                  <div className="flex items-center justify-center h-full">
                    <LoadingSpinner />
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border-2 border-b-4 border-stone-200 p-6">
                    {renderDocumentContent()}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-stone-50">
              <div className="text-center">
                <div className="w-20 h-20 bg-[#DDF4FF] rounded-2xl flex items-center justify-center mx-auto mb-4 border-2 border-b-4 border-[#1CB0F6]/30">
                  <span className="text-4xl">📄</span>
                </div>
                <p className="text-lg text-stone-700 font-extrabold">Select a document to view</p>
                <p className="text-sm text-stone-400 mt-1 font-bold">Choose from your library on the left</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Resize Handle */}
        <div
          ref={rightResizeRef}
          className="hidden md:block w-1 bg-stone-200 hover:bg-[#1CB0F6] cursor-col-resize transition-colors relative group"
          onMouseDown={() => handleMouseDown('right')}
        >
          <div className="absolute inset-y-0 -left-1 -right-1 bg-transparent"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-1 h-10 bg-[#1CB0F6] rounded-full"></div>
          </div>
        </div>

        {/* Right Panel - Annotations */}
        <div 
          className={`flex border-l-2 border-stone-200 bg-stone-50 flex-col w-full ${
            mobileView !== 'analysis' ? 'hidden md:flex' : ''
          }`}
          style={{ width: window.innerWidth < 768 ? '100%' : `${rightPanelWidth}%` }}
        >
          <div className="p-4 md:p-5 border-b-2 border-stone-200 bg-white">
            <h2 className="text-lg md:text-xl font-extrabold text-stone-900">📝 Document Analysis</h2>
            <p className="text-sm text-stone-500 mt-1 font-bold">AI-generated feedback and suggestions</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {!selectedDocument ? (
              <div className="text-center mt-12">
                <div className="w-16 h-16 bg-[#F3EAFF] rounded-2xl flex items-center justify-center mx-auto mb-4 border-2 border-b-4 border-[#A560E8]/30">
                  <span className="text-3xl">📋</span>
                </div>
                <p className="text-stone-500 font-bold">Select a document to view analysis</p>
              </div>
            ) : loadingAnalysis ? (
              <div className="flex items-center justify-center h-full">
                <LoadingSpinner />
              </div>
            ) : !analysisData || (!analysisData.hasComprehensive && !analysisData.hasCitation) ? (
              <div className="text-center mt-12">
                <div className="w-16 h-16 bg-[#FFF4E0] rounded-2xl flex items-center justify-center mx-auto mb-4 border-2 border-b-4 border-[#FF9600]/30">
                  <span className="text-3xl">💡</span>
                </div>
                <p className="text-stone-500 mb-4 font-bold">No analysis available</p>
                <button
                  onClick={() => {
                    localStorage.setItem('selectedDocumentId', selectedDocument.id);
                    localStorage.setItem('selectedDocumentTitle', selectedDocument.title);
                    onNavigate('analysis');
                  }}
                  className="bg-[#58CC02] text-white px-5 py-2.5 rounded-xl font-extrabold uppercase tracking-wide text-sm border-2 border-b-4 border-[#46A302] active:border-b-2 active:translate-y-0.5 transition-all"
                >
                  Analyze Document
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Document Analysis - Full Analysis Display */}
                <div className="bg-white rounded-2xl border-2 border-b-4 border-stone-200 overflow-hidden">
                  <div className="p-4 bg-[#1CB0F6] text-white border-b-2 border-[#1899D6]">
                    <h3 className="text-base font-extrabold">Analysis Summary</h3>
                    <p className="text-sm text-white/80 mt-0.5 font-bold">AI-generated insights</p>
                  </div>
                  
                  <div className="p-4 space-y-4">
                    {(() => {
                      const mostRecentAnalysis = analysisData.comprehensive && analysisData.citation 
                        ? (new Date(analysisData.comprehensive.created_at) > new Date(analysisData.citation.created_at) 
                           ? analysisData.comprehensive 
                           : analysisData.citation)
                        : (analysisData.comprehensive || analysisData.citation);
                      
                      if (!mostRecentAnalysis?.analysis_results) {
                        return (
                          <div className="text-center text-gray-500 py-4">
                            <p>No analysis content available</p>
                          </div>
                        );
                      }

                      const results = mostRecentAnalysis.analysis_results;
                      const analysisType = mostRecentAnalysis.analysis_type === 'citation_review' ? 'Citation' : 'Comprehensive';
                      
                      return (
                        <>
                          {/* Header Section - Analysis Type and Date */}
                          <div className="flex items-center justify-between mb-4">
                            <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-extrabold border-2 ${
                              mostRecentAnalysis.analysis_type === 'citation_review'
                                ? 'bg-[#DDF4FF] text-[#1CB0F6] border-[#1CB0F6]/30'
                                : 'bg-[#F3EAFF] text-[#A560E8] border-[#A560E8]/30'
                            }`}>
                              {analysisType} Analysis
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(mostRecentAnalysis.created_at).toLocaleDateString()}
                            </span>
                          </div>

                          {/* Summary Section - Quick Stats */}
                          <div className="grid grid-cols-3 gap-2 mb-4">
                            {results.strong_points && results.strong_points.length > 0 && (
                              <div className="text-center p-3 bg-[#EAFFD6] rounded-xl border-2 border-b-4 border-[#58CC02]/30">
                                <div className="text-2xl font-extrabold text-[#58CC02]">{results.strong_points.length}</div>
                                <div className="text-xs text-[#46A302] font-extrabold">Strengths</div>
                              </div>
                            )}
                            {results.areas_to_improve && results.areas_to_improve.length > 0 && (
                              <div className="text-center p-3 bg-[#FFF4E0] rounded-xl border-2 border-b-4 border-[#FF9600]/30">
                                <div className="text-2xl font-extrabold text-[#FF9600]">{results.areas_to_improve.length}</div>
                                <div className="text-xs text-[#D97F00] font-extrabold">Improve</div>
                              </div>
                            )}
                            {results.serious_concerns && results.serious_concerns.length > 0 && (
                              <div className="text-center p-3 bg-[#FFE8E8] rounded-xl border-2 border-b-4 border-[#FF4B4B]/30">
                                <div className="text-2xl font-extrabold text-[#FF4B4B]">{results.serious_concerns.length}</div>
                                <div className="text-xs text-[#E04343] font-extrabold">Concerns</div>
                              </div>
                            )}
                          </div>

                          {/* Full Analysis Section - Complete Assessment */}
                          {results.result && (
                            <div>
                              <h4 className="text-sm font-extrabold text-stone-900 mb-2">
                                Overall Assessment
                              </h4>
                              <div className="bg-stone-50 rounded-xl p-4 border-2 border-stone-200">
                                <div className="prose pviolet-sm max-w-none">
                                  <div className="whitespace-pre-wrap text-stone-700 leading-relaxed text-sm font-medium">
                                    {results.result
                                      .replace(/#{1,6}\s*/g, '')
                                      .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1')
                                      .replace(/`([^`]+)`/g, '$1')
                                      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
                                      .trim()
                                      .substring(0, 500)}
                                    {results.result.length > 500 && '...'}
                                  </div>
                                </div>
                                {results.result.length > 500 && (
                                  <button
                                    onClick={() => onNavigate('analysis-history')}
                                    className="mt-3 w-full py-2.5 px-4 text-sm font-extrabold text-[#1CB0F6] bg-[#DDF4FF] rounded-xl border-2 border-b-4 border-[#1CB0F6]/30 active:border-b-2 active:translate-y-0.5 transition-all flex items-center justify-center gap-2"
                                  >
                                    <span>View full analysis</span>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer onNavigate={onNavigate} />
    </LoggedInPageShell>
  );
};

export default LibraryPage;