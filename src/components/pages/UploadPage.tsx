import { useState, useRef } from 'react';
import Header from '../common/Header';
import Footer from '../common/Footer';
import LoadingSpinner from '../common/LoadingSpinner';

interface UploadPageProps {
  onNavigate: (page: string) => void;
  user?: { name: string; email: string; plan?: string } | null;
  onLogout?: () => void;
}

interface UploadedDocument {
  id: string;
  title: string;
  originalFilename: string;
  fileType: string;
  fileSize: number;
  wordCount: number;
  pageCount: number;
  uploadStatus: string;
  createdAt: string;
}

// Plan limits: Free 1MB, Pro 25MB, Premium 1GB
const getMaxFileSize = (plan: string) => {
  const p = (plan || 'free').toLowerCase();
  if (p === 'premium') return 1024 * 1024 * 1024; // 1GB
  if (p === 'pro') return 25 * 1024 * 1024;       // 25MB
  return 1024 * 1024;                              // 1MB (Free)
};

const getMaxFileSizeLabel = (plan: string) => {
  const p = (plan || 'free').toLowerCase();
  if (p === 'premium') return '1GB';
  if (p === 'pro') return '25MB';
  return '1MB';
};

const UploadPage = ({ onNavigate, user, onLogout }: UploadPageProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedDocument, setUploadedDocument] = useState<UploadedDocument | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentTitle, setDocumentTitle] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const userPlan = (user?.plan || (user as { plan?: string })?.plan || 'free').toLowerCase();
  const maxFileSize = getMaxFileSize(userPlan);
  const maxFileSizeLabel = getMaxFileSizeLabel(userPlan);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a PDF, DOCX, DOC, or TXT file.');
      return;
    }

    if (file.size > maxFileSize) {
      setError(`File size must be less than ${maxFileSizeLabel}.`);
      return;
    }

    setSelectedFile(file);
    setDocumentTitle(file.name.replace(/\.[^/.]+$/, ''));
    setError(null);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload.');
      return;
    }

    if (!documentTitle.trim()) {
      setError('Please enter a document title.');
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Please log in to upload documents.');
        return;
      }

      const formData = new FormData();
      formData.append('document', selectedFile);
      formData.append('title', documentTitle.trim());

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/documents/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Upload failed');
      }

      const uploadedDocument = result.data.document;
      
      setUploadedDocument(uploadedDocument);
      setSelectedFile(null);
      setDocumentTitle('');

      setTimeout(() => {
        localStorage.setItem('selectedDocumentId', uploadedDocument.id);
        localStorage.setItem('selectedDocumentTitle', uploadedDocument.title);
        localStorage.setItem('selectedDocumentContent', uploadedDocument.content_text || 'Mock document content for testing');
        onNavigate('analysis');
      }, 1500);

    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setDocumentTitle('');
    setError(null);
    setUploadedDocument(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #FAF8F5 0%, #F5F3F0 100%)' }}>
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="upload" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Upload Your Document
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload your academic papers, essays, or research documents for AI-powered analysis and feedback.
          </p>
        </div>

        {/* Success Message */}
        {uploadedDocument && (
          <div className="mb-8 p-5 bg-green-50 border border-green-200 rounded-2xl">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-green-800">
                  Document Uploaded Successfully!
                </h3>
                <p className="text-green-700">
                  {uploadedDocument.title} ({uploadedDocument.wordCount} words, {uploadedDocument.pageCount} pages)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
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

        {/* Upload Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          {/* Drop Zone */}
          <div
            className={`relative border-2 border-dashed rounded-2xl p-10 sm:p-16 text-center transition-all ${
              dragActive 
                ? 'border-blue-500 bg-blue-50'
                : selectedFile
                  ? 'border-green-400 bg-green-50'
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileInputChange}
              accept=".pdf,.doc,.docx,.txt"
            />
            
            {selectedFile ? (
              <div className="space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedFile.name}</h3>
                  <p className="text-gray-500">{formatFileSize(selectedFile.size)}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Drop your document here, or click to browse
                  </h3>
                  <p className="text-gray-500">
                    Supports PDF, DOCX, DOC, and TXT files up to 50MB
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Document Title Input */}
          {selectedFile && (
            <div className="mt-8">
              <label htmlFor="documentTitle" className="block text-base font-medium text-gray-900 mb-2">
                Document Title
              </label>
              <input
                type="text"
                id="documentTitle"
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                className="w-full px-4 py-3 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter a title for your document"
              />
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="mt-8">
              <LoadingSpinner 
                size="lg" 
                text={`Uploading... ${uploadProgress}%`}
                color="blue"
              />
              <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            {selectedFile && !isUploading && !uploadedDocument && (
              <>
                <button
                  onClick={handleUpload}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3.5 px-6 rounded-xl font-semibold text-lg transition-colors"
                >
                  Upload Document
                </button>
                <button
                  onClick={handleReset}
                  className="px-6 py-3.5 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Reset
                </button>
              </>
            )}
            
            {uploadedDocument && (
              <button
                onClick={() => onNavigate('library')}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3.5 px-6 rounded-xl font-semibold text-lg transition-colors"
              >
                View in Library
              </button>
            )}
          </div>
        </div>

        {/* Supported File Types */}
        <div className="mt-10 bg-gray-50 border border-gray-200 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-5">Supported File Types</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3 bg-white rounded-xl p-4 border border-gray-200">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-red-600 font-bold text-sm">PDF</span>
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">PDF</p>
                <p className="text-xs text-gray-500">Up to {maxUploadLabel}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 bg-white rounded-xl p-4 border border-gray-200">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 font-bold text-sm">DOCX</span>
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">Word</p>
                <p className="text-xs text-gray-500">Up to 25MB</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 bg-white rounded-xl p-4 border border-gray-200">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 font-bold text-sm">DOC</span>
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">Legacy</p>
                <p className="text-xs text-gray-500">Up to {maxUploadLabel}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 bg-white rounded-xl p-4 border border-gray-200">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-gray-600 font-bold text-sm">TXT</span>
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">Text</p>
                <p className="text-xs text-gray-500">Up to 10MB</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center justify-center p-5 bg-white border border-gray-200 rounded-2xl hover:border-gray-300 hover:shadow-sm transition-all"
          >
            <svg className="w-6 h-6 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span className="text-gray-700 font-medium">Paste text instead</span>
          </button>
          <button
            onClick={() => onNavigate('library')}
            className="flex items-center justify-center p-5 bg-white border border-gray-200 rounded-2xl hover:border-gray-300 hover:shadow-sm transition-all"
          >
            <svg className="w-6 h-6 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            <span className="text-gray-700 font-medium">View document library</span>
          </button>
        </div>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default UploadPage;
