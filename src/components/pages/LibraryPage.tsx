import { useState, useEffect } from 'react';

interface LibraryPageProps {
  onNavigate: (page: string) => void;
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
}

interface DocumentStats {
  totalDocuments: number;
  totalWords: number;
  totalSize: number;
  fileTypes: Record<string, number>;
  recentUploads: Array<{
    id: string;
    title: string;
    fileType: string;
    wordCount: number;
    createdAt: string;
  }>;
}

const LibraryPage = ({ onNavigate }: LibraryPageProps) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stats, setStats] = useState<DocumentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'created_at' | 'title' | 'word_count'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [editingDocument, setEditingDocument] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  useEffect(() => {
    fetchDocuments();
    fetchStats();
  }, [sortBy, sortOrder]);

  const checkDocumentAnalysis = async (documentId: string, token: string): Promise<boolean> => {
    try {
      console.log('Checking analysis for document:', documentId);
      const response = await fetch(`http://localhost:3001/api/analysis/document/${documentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Analysis check result for document', documentId, ':', result);
        return result.data && result.data.length > 0;
      } else {
        console.warn('Failed to check analysis for document', documentId, ':', response.status, response.statusText);
        return false;
      }
    } catch (error) {
      console.warn('Error checking document analysis:', error);
      return false;
    }
  };

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        setError('Please log in to view documents.');
        return;
      }
      
      const response = await fetch(
        `http://localhost:3001/api/documents?sortBy=${sortBy}&sortOrder=${sortOrder}&limit=50`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }

      const result = await response.json();
      const documentsWithAnalysis = await Promise.all(
        result.data.documents.map(async (doc: Document) => {
          const hasAnalysis = await checkDocumentAnalysis(doc.id, token);
          return { ...doc, hasAnalysis };
        })
      );
      
      setDocuments(documentsWithAnalysis);
    } catch (error) {
      console.error('Error fetching documents:', error);
      setError(error instanceof Error ? error.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch('http://localhost:3001/api/documents/stats/overview', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const result = await response.json();
      setStats(result.data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchDocuments();
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(
        `http://localhost:3001/api/documents/search?q=${encodeURIComponent(searchTerm)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const result = await response.json();
      setDocuments(result.data.documents);
    } catch (error) {
      console.error('Search error:', error);
      setError(error instanceof Error ? error.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`http://localhost:3001/api/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      // Remove from local state
      setDocuments(docs => docs.filter(doc => doc.id !== documentId));
      setSelectedDocument(null);
      
      // Refresh stats
      fetchStats();
    } catch (error) {
      console.error('Delete error:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete document');
    }
  };

  const handleStartRename = (document: Document) => {
    setEditingDocument(document.id);
    setEditTitle(document.title);
  };

  const handleCancelRename = () => {
    setEditingDocument(null);
    setEditTitle('');
  };

  const handleSaveRename = async (documentId: string) => {
    if (!editTitle.trim()) {
      alert('Document title cannot be empty');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Please log in to rename documents');
      }

      const response = await fetch(`http://localhost:3001/api/documents/${documentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: editTitle.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to rename document');
      }

      // Update document in local state
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId ? { ...doc, title: editTitle.trim() } : doc
      ));

      setEditingDocument(null);
      setEditTitle('');
    } catch (error) {
      console.error('Error renaming document:', error);
      setError(error instanceof Error ? error.message : 'Failed to rename document');
    }
  };

  const handleDownloadDocument = async (document: Document) => {
    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`http://localhost:3001/api/documents/${document.id}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get download URL');
      }

      const result = await response.json();
      
      // Open download URL in new tab
      window.open(result.data.downloadUrl, '_blank');
    } catch (error) {
      console.error('Download error:', error);
      setError(error instanceof Error ? error.message : 'Failed to download document');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Scholar AI
          </span>
              </div>
        <div className="flex items-center space-x-4">
              <button 
                onClick={() => onNavigate('dashboard')}
            className="text-gray-600 hover:text-gray-900 transition-colors"
              >
              Dashboard
            </button>
              <button 
            onClick={() => onNavigate('upload')}
            className="text-gray-600 hover:text-gray-900 transition-colors"
              >
            Upload
              </button>
              <button 
                onClick={() => onNavigate('settings')}
            className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Account
              </button>
        </div>
            </nav>

      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Document Library</h1>
            <p className="text-xl text-gray-600">Manage and organize your academic documents</p>
          </div>
                <button 
            onClick={() => onNavigate('upload')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-[1.02] transition-all duration-300"
          >
            Upload New Document
          </button>
                  </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Documents</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalDocuments}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Words</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalWords.toLocaleString()}</p>
                </div>
                      </div>
                    </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                        </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Storage Used</p>
                  <p className="text-2xl font-bold text-gray-900">{formatFileSize(stats.totalSize)}</p>
                </div>
              </div>
                    </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                    </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">File Types</p>
                  <p className="text-2xl font-bold text-gray-900">{Object.keys(stats.fileTypes).length}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search documents by title or content..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
            </div>
            </div>
            
            <div className="flex gap-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="created_at">Date</option>
                <option value="title">Title</option>
                <option value="word_count">Word Count</option>
              </select>
              
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
              
              <button
                onClick={handleSearch}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Search
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Documents List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading documents...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
            <p className="text-gray-600 mb-6">
                {searchTerm ? 'Try adjusting your search terms.' : 'Upload your first document to get started.'}
            </p>
              {!searchTerm && (
            <button 
              onClick={() => onNavigate('upload')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-[1.02] transition-all duration-300"
            >
              Upload Document
            </button>
              )}
    </div>
        ) : (
            <div className="divide-y divide-gray-200">
              {documents.map((document) => (
                <div key={document.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {getFileTypeIcon(document.fileType)}
                    <div>
                        {editingDocument === document.id ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="text-lg font-medium text-gray-900 border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleSaveRename(document.id);
                                } else if (e.key === 'Escape') {
                                  handleCancelRename();
                                }
                              }}
                            />
                            <button
                              onClick={() => handleSaveRename(document.id)}
                              className="text-green-600 hover:text-green-800 p-1"
                              title="Save"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                            <button
                              onClick={handleCancelRename}
                              className="text-red-600 hover:text-red-800 p-1"
                              title="Cancel"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <h3 className="text-lg font-medium text-gray-900">{document.title}</h3>
                        )}
                        <p className="text-sm text-gray-500">
                          {document.originalFilename} • {formatFileSize(document.fileSize)} • {document.wordCount.toLocaleString()} words • {document.pageCount} pages
                        </p>
                        <p className="text-xs text-gray-400">Uploaded {formatDate(document.createdAt)}</p>
                            </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleDownloadDocument(document)}
                        className="px-4 py-2 text-blue-600 hover:text-blue-800 transition-colors"
                        title="Download"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </button>
                      
                      <button
                        onClick={() => handleStartRename(document)}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                        title="Rename"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      
                      <button
                        onClick={() => {
                          // Store document info for analysis page
                          localStorage.setItem('selectedDocumentId', document.id);
                          localStorage.setItem('selectedDocumentTitle', document.title);
                          localStorage.setItem('hasExistingAnalysis', document.hasAnalysis ? 'true' : 'false');
                          onNavigate('analysis');
                        }}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          document.hasAnalysis 
                            ? 'bg-green-600 text-white hover:bg-green-700' 
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {document.hasAnalysis ? 'View Analysis' : 'Analyze'}
                      </button>
                      
                      <button
                        onClick={() => handleDeleteDocument(document.id)}
                        className="px-4 py-2 text-red-600 hover:text-red-800 transition-colors"
                        title="Delete"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
    </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default LibraryPage;