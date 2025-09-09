import React, { useState, useRef } from 'react';

const UploadPage = ({ onNavigate }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [analysisSettings, setAnalysisSettings] = useState({
    documentType: 'research_paper',
    focusAreas: ['structure', 'grammar', 'citations'],
    urgency: 'standard'
  });
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  const handleFiles = (files) => {
    const validFiles = files.filter(file => {
      const validTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];
      return validTypes.includes(file.type) && file.size <= 50 * 1024 * 1024; // 50MB limit
    });

    setUploadedFiles(prev => [...prev, ...validFiles.map(file => ({
      file,
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'pending'
    }))]);
  };

  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const startAnalysis = () => {
    if (uploadedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          // Navigate to analysis page after completion
          setTimeout(() => {
            onNavigate('analysis');
          }, 1000);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 500);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="flex items-center space-x-2 p-6 border-b border-gray-200">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="text-xl font-bold text-gray-900">AcademicAI</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            <button 
              onClick={() => onNavigate('dashboard')}
              className="w-full flex items-center space-x-3 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Documents</span>
            </button>
            <button 
              onClick={() => onNavigate('upload')}
              className="w-full flex items-center space-x-3 px-3 py-2 text-blue-600 bg-blue-50 rounded-lg font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span>Upload</span>
            </button>
            <button 
              onClick={() => onNavigate('settings')}
              className="w-full flex items-center space-x-3 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Settings</span>
            </button>
          </div>
        </nav>

        {/* Quick Tips */}
        <div className="p-4 border-t border-gray-200">
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">💡 Quick Tips</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Supported: PDF, DOC, DOCX, TXT</li>
              <li>• Max file size: 50MB</li>
              <li>• Better formatting = better analysis</li>
              <li>• Include your citations for complete feedback</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Document</h1>
            <p className="text-gray-600">Upload your academic paper to get AI-powered feedback and suggestions</p>
          </div>

          {/* Upload Area */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* File Upload */}
            <div className="md:col-span-2">
              <div
                className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
                  dragActive 
                    ? 'border-blue-400 bg-blue-50 scale-105' 
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
                  multiple
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileInput}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Drop your files here</h3>
                    <p className="text-gray-500">or click to browse from your computer</p>
                  </div>
                  <div className="flex justify-center space-x-4 text-sm text-gray-400">
                    <span>PDF</span>
                    <span>•</span>
                    <span>DOC</span>
                    <span>•</span>
                    <span>DOCX</span>
                    <span>•</span>
                    <span>TXT</span>
                  </div>
                </div>
              </div>

              {/* Cloud Storage Integration */}
              <div className="mt-6">
                <p className="text-sm text-gray-600 mb-4">Or import from cloud storage:</p>
                <div className="grid grid-cols-3 gap-4">
                  <button className="flex items-center justify-center space-x-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.219-5.175 1.219-5.175s-.31-.623-.31-1.544c0-1.447.84-2.518 1.888-2.518.89 0 1.322.668 1.322 1.466 0 .896-.571 2.233-.866 3.472-.246 1.041.522 1.89 1.549 1.89 1.859 0 3.285-1.96 3.285-4.794 0-2.503-1.799-4.257-4.37-4.257-2.977 0-4.727 2.233-4.727 4.546 0 .9.347 1.863.78 2.387.085.104.098.195.072.299-.08.33-.256 1.037-.29 1.183-.045.189-.147.229-.338.138-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.966-.526-2.287-1.175l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.937.29 1.931.446 2.962.446 6.624 0 11.99-5.367 11.99-11.987C24.007 5.367 18.641.001.017 0z"/>
                    </svg>
                    <span className="text-sm">Google Drive</span>
                  </button>
                  <button className="flex items-center justify-center space-x-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <svg className="w-5 h-5 text-blue-700" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.219-5.175 1.219-5.175s-.31-.623-.31-1.544c0-1.447.84-2.518 1.888-2.518.89 0 1.322.668 1.322 1.466 0 .896-.571 2.233-.866 3.472-.246 1.041.522 1.89 1.549 1.89 1.859 0 3.285-1.96 3.285-4.794 0-2.503-1.799-4.257-4.37-4.257-2.977 0-4.727 2.233-4.727 4.546 0 .9.347 1.863.78 2.387.085.104.098.195.072.299-.08.33-.256 1.037-.29 1.183-.045.189-.147.229-.338.138-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.966-.526-2.287-1.175l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.937.29 1.931.446 2.962.446 6.624 0 11.99-5.367 11.99-11.987C24.007 5.367 18.641.001.017 0z"/>
                    </svg>
                    <span className="text-sm">Dropbox</span>
                  </button>
                  <button className="flex items-center justify-center space-x-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <svg className="w-5 h-5 text-blue-500" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.219-5.175 1.219-5.175s-.31-.623-.31-1.544c0-1.447.84-2.518 1.888-2.518.89 0 1.322.668 1.322 1.466 0 .896-.571 2.233-.866 3.472-.246 1.041.522 1.89 1.549 1.89 1.859 0 3.285-1.96 3.285-4.794 0-2.503-1.799-4.257-4.37-4.257-2.977 0-4.727 2.233-4.727 4.546 0 .9.347 1.863.78 2.387.085.104.098.195.072.299-.08.33-.256 1.037-.29 1.183-.045.189-.147.229-.338.138-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.966-.526-2.287-1.175l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.937.29 1.931.446 2.962.446 6.624 0 11.99-5.367 11.99-11.987C24.007 5.367 18.641.001.017 0z"/>
                    </svg>
                    <span className="text-sm">OneDrive</span>
                  </button>
                </div>
              </div>

              {/* Uploaded Files */}
              {uploadedFiles.length > 0 && (
                <div className="mt-8">
                  <h3 className="font-semibold text-gray-900 mb-4">Uploaded Files</h3>
                  <div className="space-y-3">
                    {uploadedFiles.map((fileObj) => (
                      <div key={fileObj.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{fileObj.name}</p>
                            <p className="text-sm text-gray-500">{formatFileSize(fileObj.size)}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile(fileObj.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Analysis Settings */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Analysis Settings</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Document Type</label>
                    <select 
                      value={analysisSettings.documentType}
                      onChange={(e) => setAnalysisSettings({...analysisSettings, documentType: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="research_paper">Research Paper</option>
                      <option value="essay">Essay</option>
                      <option value="thesis">Thesis</option>
                      <option value="proposal">Research Proposal</option>
                      <option value="review">Literature Review</option>
                      <option value="report">Technical Report</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Focus Areas</label>
                    <div className="space-y-2">
                      {[
                        { id: 'structure', label: 'Structure & Organization' },
                        { id: 'grammar', label: 'Grammar & Style' },
                        { id: 'citations', label: 'Citations & References' },
                        { id: 'clarity', label: 'Clarity & Readability' },
                        { id: 'argumentation', label: 'Argumentation' },
                        { id: 'methodology', label: 'Methodology' }
                      ].map((area) => (
                        <label key={area.id} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={analysisSettings.focusAreas.includes(area.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setAnalysisSettings({
                                  ...analysisSettings,
                                  focusAreas: [...analysisSettings.focusAreas, area.id]
                                });
                              } else {
                                setAnalysisSettings({
                                  ...analysisSettings,
                                  focusAreas: analysisSettings.focusAreas.filter(id => id !== area.id)
                                });
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{area.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Analysis Urgency</label>
                    <select 
                      value={analysisSettings.urgency}
                      onChange={(e) => setAnalysisSettings({...analysisSettings, urgency: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="standard">Standard (2-5 minutes)</option>
                      <option value="fast">Fast (1-2 minutes)</option>
                      <option value="detailed">Detailed (5-10 minutes)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Analysis Progress</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Processing document...</span>
                        <span>{Math.round(uploadProgress)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      {uploadProgress < 30 && "📄 Extracting text and formatting..."}
                      {uploadProgress >= 30 && uploadProgress < 60 && "🧠 AI analyzing structure and content..."}
                      {uploadProgress >= 60 && uploadProgress < 90 && "✏️ Generating detailed feedback..."}
                      {uploadProgress >= 90 && "✅ Finalizing analysis report..."}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={startAnalysis}
                disabled={uploadedFiles.length === 0 || isUploading}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
                  uploadedFiles.length === 0 || isUploading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg transform hover:scale-105'
                }`}
              >
                {isUploading ? 'Analyzing...' : 'Start Analysis'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;