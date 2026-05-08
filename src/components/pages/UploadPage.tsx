import { useState, useRef } from 'react';
import Header from '../common/Header';
import { WriteScholarEditorialBackgroundLayers } from '../common/WriteScholarEditorialBackground';
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

// Plan limits: Free 2MB, Pro (and legacy Premium) 100MB per file
const getMaxFileSize = (plan: string) => {
  const p = (plan || 'free').toLowerCase();
  if (p === 'pro' || p === 'premium' || p === 'focus') return 100 * 1024 * 1024;
  return 1024 * 1024;
};

const getMaxFileSizeLabel = (plan: string) => {
  const p = (plan || 'free').toLowerCase();
  if (p === 'pro' || p === 'premium' || p === 'focus') return '100MB';
  return '2MB';
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
    <div className="relative min-h-screen overflow-x-hidden bg-stone-50 dark:bg-stone-950" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
      <WriteScholarEditorialBackgroundLayers position="fixed" />
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="upload" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-[#DDF4FF] dark:bg-[#1CB0F6]/10 border-2 border-[#1CB0F6]/30 text-[#1CB0F6] text-sm font-extrabold mb-4">
            📄 Upload Center
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-stone-900 dark:text-stone-50 mb-4">
            Upload Your <span className="text-[#A560E8]">Document</span>
          </h1>
          <p className="text-lg text-stone-500 dark:text-stone-400 max-w-2xl mx-auto font-bold">
            Upload your academic papers, essays, or research documents for AI-powered analysis and feedback.
          </p>
        </div>

        {/* Success Message */}
        {uploadedDocument && (
          <div className="mb-8 p-5 bg-[#EAFFD6] dark:bg-[#58CC02]/10 border-2 border-b-4 border-[#58CC02]/40 rounded-2xl">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-[#58CC02] rounded-xl flex items-center justify-center flex-shrink-0 border-2 border-b-4 border-[#46A302]">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-extrabold text-[#58CC02]">
                  Document Uploaded Successfully!
                </h3>
                <p className="text-stone-700 dark:text-stone-300 font-bold">
                  {uploadedDocument.title} ({uploadedDocument.wordCount} words, {uploadedDocument.pageCount} pages)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-5 bg-[#FFE8E8] dark:bg-[#FF4B4B]/10 border-2 border-b-4 border-[#FF4B4B]/40 rounded-2xl">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-[#FF4B4B] rounded-xl flex items-center justify-center flex-shrink-0 border-2 border-b-4 border-[#E04343]">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-[#FF4B4B] font-extrabold">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Upload Card */}
        <div className="bg-white dark:bg-stone-900 border-2 border-b-4 border-stone-200 dark:border-stone-700 rounded-2xl p-8">
          {/* Drop Zone */}
          <div
            className={`relative border-2 border-dashed rounded-2xl p-10 sm:p-16 text-center transition-all ${
              dragActive
                ? 'border-[#1CB0F6] bg-[#DDF4FF] dark:bg-[#1CB0F6]/10'
                : selectedFile
                  ? 'border-[#58CC02] bg-[#EAFFD6] dark:bg-[#58CC02]/10'
                  : 'border-stone-300 dark:border-stone-600 hover:border-[#1CB0F6] hover:bg-[#DDF4FF]/50'
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
                <div className="w-16 h-16 bg-[#58CC02] rounded-2xl flex items-center justify-center mx-auto border-2 border-b-4 border-[#46A302]">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-stone-900 dark:text-stone-50">{selectedFile.name}</h3>
                  <p className="text-stone-500 dark:text-stone-400 font-bold">{formatFileSize(selectedFile.size)}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 bg-[#1CB0F6] rounded-2xl flex items-center justify-center mx-auto border-2 border-b-4 border-[#1899D6]">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-stone-900 dark:text-stone-50">
                    Drop your document here, or <span className="text-[#1CB0F6]">click to browse</span>
                  </h3>
                  <p className="text-stone-500 dark:text-stone-400 font-bold">
                    Supports PDF, DOCX, DOC, and TXT files up to {maxFileSizeLabel}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Document Title Input */}
          {selectedFile && (
            <div className="mt-8">
              <label htmlFor="documentTitle" className="block text-base font-extrabold text-stone-900 dark:text-stone-50 mb-2 uppercase tracking-wide text-sm">
                Document Title
              </label>
              <input
                type="text"
                id="documentTitle"
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                className="w-full px-4 py-3 text-lg border-2 border-stone-200 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-50 focus:border-[#1CB0F6] focus:ring-2 focus:ring-[#1CB0F6]/20 focus:outline-none transition-all font-bold"
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
              <div className="w-full bg-stone-200 dark:bg-stone-700 rounded-full h-3 mt-4">
                <div
                  className="bg-[#58CC02] h-3 rounded-full transition-all duration-300"
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
                  className="flex-1 bg-[#58CC02] text-white py-3.5 px-6 rounded-xl font-extrabold text-lg uppercase tracking-wide border-2 border-b-4 border-[#46A302] active:border-b-2 active:translate-y-0.5 transition-all"
                >
                  Upload Document →
                </button>
                <button
                  onClick={handleReset}
                  className="px-6 py-3.5 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 rounded-xl font-extrabold border-2 border-b-4 border-stone-300 dark:border-stone-600 active:border-b-2 active:translate-y-0.5 transition-all"
                >
                  Reset
                </button>
              </>
            )}

            {uploadedDocument && (
              <button
                onClick={() => onNavigate('library')}
                className="flex-1 bg-[#1CB0F6] text-white py-3.5 px-6 rounded-xl font-extrabold text-lg uppercase tracking-wide border-2 border-b-4 border-[#1899D6] active:border-b-2 active:translate-y-0.5 transition-all"
              >
                View in Library →
              </button>
            )}
          </div>
        </div>

        {/* Supported File Types */}
        <div className="mt-10 bg-white dark:bg-stone-900 border-2 border-b-4 border-stone-200 dark:border-stone-700 rounded-2xl p-6">
          <h3 className="text-lg font-extrabold text-stone-900 dark:text-stone-50 mb-5">Supported File Types</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3 bg-[#FFE8E8] dark:bg-[#FF4B4B]/10 rounded-xl p-4 border-2 border-[#FF4B4B]/20">
              <div className="w-10 h-10 bg-[#FF4B4B] rounded-lg flex items-center justify-center border-b-2 border-[#E04343]">
                <span className="text-white font-extrabold text-sm">PDF</span>
              </div>
              <div>
                <p className="font-extrabold text-stone-900 dark:text-stone-50 text-sm">PDF</p>
                <p className="text-xs text-stone-500 font-bold">Up to {maxFileSizeLabel}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 bg-[#F3EAFF] dark:bg-[#A560E8]/10 rounded-xl p-4 border-2 border-[#A560E8]/20">
              <div className="w-10 h-10 bg-[#A560E8] rounded-lg flex items-center justify-center border-b-2 border-[#8A48C7]">
                <span className="text-white font-extrabold text-xs">DOCX</span>
              </div>
              <div>
                <p className="font-extrabold text-stone-900 dark:text-stone-50 text-sm">Word</p>
                <p className="text-xs text-stone-500 font-bold">Up to {maxFileSizeLabel}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 bg-[#EAFFD6] dark:bg-[#58CC02]/10 rounded-xl p-4 border-2 border-[#58CC02]/20">
              <div className="w-10 h-10 bg-[#58CC02] rounded-lg flex items-center justify-center border-b-2 border-[#46A302]">
                <span className="text-white font-extrabold text-sm">DOC</span>
              </div>
              <div>
                <p className="font-extrabold text-stone-900 dark:text-stone-50 text-sm">Legacy</p>
                <p className="text-xs text-stone-500 font-bold">Up to {maxFileSizeLabel}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 bg-stone-100 dark:bg-stone-800 rounded-xl p-4 border-2 border-stone-200 dark:border-stone-700">
              <div className="w-10 h-10 bg-stone-500 rounded-lg flex items-center justify-center border-b-2 border-stone-600">
                <span className="text-white font-extrabold text-sm">TXT</span>
              </div>
              <div>
                <p className="font-extrabold text-stone-900 dark:text-stone-50 text-sm">Text</p>
                <p className="text-xs text-stone-500 font-bold">Up to {maxFileSizeLabel}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center justify-center p-5 bg-white dark:bg-stone-900 border-2 border-b-4 border-stone-200 dark:border-stone-700 rounded-2xl hover:border-stone-300 active:border-b-2 active:translate-y-0.5 transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-[#FF9600] flex items-center justify-center mr-3 border-b-2 border-[#D97F00]">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <span className="text-stone-700 dark:text-stone-200 font-extrabold">Paste text instead</span>
          </button>
          <button
            onClick={() => onNavigate('library')}
            className="flex items-center justify-center p-5 bg-white dark:bg-stone-900 border-2 border-b-4 border-stone-200 dark:border-stone-700 rounded-2xl hover:border-stone-300 active:border-b-2 active:translate-y-0.5 transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-[#1CB0F6] flex items-center justify-center mr-3 border-b-2 border-[#1899D6]">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
            <span className="text-stone-700 dark:text-stone-200 font-extrabold">View document library</span>
          </button>
        </div>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default UploadPage;
