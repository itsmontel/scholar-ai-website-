import { useState, useEffect } from 'react';

interface DashboardProps {
  onNavigate: (page: string) => void;
  user: any;
  onLogout: () => void;
}

const Dashboard = ({ onNavigate, user, onLogout }: DashboardProps) => {
  const [inputText, setInputText] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const placeholders = [
    "Paste your academic text here to see how AI can help improve it.",
    "Enhance your academic writing with a simple paste and click.",
    "Get instant feedback on your essay or thesis.",
    "Turn good writing into great writing with Scholar."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isDropdownOpen && !(event.target as Element).closest('.dropdown-container')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleAnalyze = () => {
    if (inputText.trim()) {
      onNavigate('analysis');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAnalyze();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-gray-200/60 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => onNavigate('dashboard')}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity duration-200"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Scholar</span>
            </button>

            <nav className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => onNavigate('dashboard')}
                className="relative px-4 py-2 text-blue-600 font-semibold rounded-lg bg-blue-50/80 hover:bg-blue-100/80 transition-all duration-200"
              >
                Dashboard
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"></div>
            </button>
            <button 
                onClick={() => onNavigate('library')}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-100/50 transition-all duration-200"
            >
                Library
            </button>
            <button 
              onClick={() => onNavigate('settings')}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-100/50 transition-all duration-200"
              >
                Account
              </button>
            </nav>

            <div className="flex items-center space-x-4">
              {/* User Profile Dropdown */}
              <div className="relative dropdown-container">
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-3 px-4 py-2 rounded-xl hover:bg-gray-100/60 transition-all duration-200 border border-gray-200/50 bg-white/50 backdrop-blur-sm"
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-md">
                    <span className="text-white font-bold text-sm">
                      {(user?.name || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-gray-900">{user?.name || 'User Name'}</div>
                    <div className="text-xs text-gray-500">{user?.email || 'user@example.com'}</div>
                  </div>
                  <svg 
                    className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200/50 backdrop-blur-sm z-50">
                    {/* User Info Section */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="text-sm font-medium text-gray-900">{user?.name || 'User Name'}</div>
                      <div className="text-xs text-gray-500">{user?.email || 'user@example.com'}</div>
                      <div className="flex items-center mt-2">
                        <svg className="w-4 h-4 text-yellow-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-xs text-gray-600">0 credits</span>
                      </div>
                    </div>

                    {/* Navigation Links */}
                    <div className="py-2">
                      <button 
                        onClick={() => { onNavigate('dashboard'); setIsDropdownOpen(false); }}
                        className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Dashboard</span>
                      </button>
                      
                      <button 
                        onClick={() => { onNavigate('settings'); setIsDropdownOpen(false); }}
                        className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
                        <span>Account</span>
                      </button>
                      
                      <button 
                        onClick={() => { onNavigate('library'); setIsDropdownOpen(false); }}
                        className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <span>Documents</span>
                      </button>
                      
                      <button 
                        onClick={() => { onNavigate('pricing'); setIsDropdownOpen(false); }}
                        className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>Upgrade Plan</span>
            </button>
          </div>

                    {/* Logout Section */}
                    <div className="border-t border-gray-100 py-2">
                      <button 
                        onClick={() => { onLogout(); setIsDropdownOpen(false); }}
                        className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
            </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center px-4 py-2 bg-blue-50/80 text-blue-700 rounded-full text-sm font-medium mb-8 border border-blue-200/50">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Your Academic Writing Assistant
            </div>
          <h1 className="text-7xl font-bold text-gray-900 mb-8 leading-tight tracking-tight">
            Enhance your academic<br />writing with <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">AI</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-16 leading-relaxed">
            Get instant, intelligent feedback on your research papers, essays, and academic documents with our advanced AI analysis that understands academic writing standards
          </p>

          {/* Search Box */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="relative">
              {/* Shadow gradient behind the input */}
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-indigo-500/20 rounded-3xl blur-sm"></div>
              <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-8 hover:shadow-3xl transition-all duration-500">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={placeholders[placeholderIndex]}
                  className="w-full min-h-24 max-h-48 pb-6 pl-6 pr-20 text-gray-700 border-none outline-none resize-none placeholder-gray-400 bg-transparent text-lg font-light transition-all duration-300 overflow-y-auto leading-relaxed"
                  style={{ 
                    height: 'auto', 
                    lineHeight: '1.6',
                    paddingTop: '0px',
                    marginTop: '0px'
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = Math.min(target.scrollHeight, 192) + 'px';
                  }}
                />
                
                {/* Send Button */}
                <button
                  onClick={handleAnalyze}
                  className="absolute bottom-4 right-4 w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 shadow-lg z-10"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Suggested Categories */}
            <div className="flex flex-wrap justify-center gap-4 mt-10">
              {['Research Paper', 'Thesis Draft', 'Essay Analysis', 'Literature Review'].map((category) => (
            <button 
                  key={category}
                  onClick={() => setInputText(prev => prev + (prev ? ' ' : '') + category)}
                  className="px-6 py-3 bg-white/70 hover:bg-white/90 text-gray-700 rounded-2xl text-sm font-semibold transition-all duration-300 hover:shadow-lg border border-gray-200/60 hover:border-blue-300/60 hover:scale-105 backdrop-blur-sm"
            >
                  {category}
            </button>
              ))}
          </div>
        </div>
      </div>

        {/* Upload Button */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="text-center">
            <button 
              onClick={() => onNavigate('upload')}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-2xl font-semibold text-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload Document
            </button>
            <p className="text-sm text-gray-500 mt-3">Supports PDF, DOCX, and TXT files</p>
          </div>
        </div>

        {/* Documents Section */}
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent mb-4">Your Documents</h2>
            <p className="text-lg text-gray-600">Manage and access your uploaded academic documents</p>
              </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Document Cards */}
            {[
              {
                id: 1,
                name: "Research Paper Draft",
                type: "PDF",
                pages: 12,
                date: "Sep 8, 2025",
                status: "analyzed",
                icon: "📄",
                color: "from-blue-500 to-blue-600"
              },
              {
                id: 2,
                name: "Thesis Chapter 3",
                type: "DOCX",
                pages: 8,
                date: "Sep 7, 2025",
                status: "analyzing",
                icon: "📝",
                color: "from-purple-500 to-purple-600"
              },
              {
                id: 3,
                name: "Literature Review",
                type: "PDF",
                pages: 15,
                date: "Sep 6, 2025",
                status: "analyzed",
                icon: "📚",
                color: "from-green-500 to-green-600"
              },
              {
                id: 4,
                name: "Essay Analysis",
                type: "DOCX",
                pages: 5,
                date: "Sep 5, 2025",
                status: "analyzed",
                icon: "✍️",
                color: "from-orange-500 to-orange-600"
              },
              {
                id: 5,
                name: "Research Proposal",
                type: "PDF",
                pages: 10,
                date: "Sep 4, 2025",
                status: "analyzed",
                icon: "📋",
                color: "from-indigo-500 to-indigo-600"
              },
              {
                id: 6,
                name: "Methodology Section",
                type: "DOCX",
                pages: 6,
                date: "Sep 3, 2025",
                status: "analyzed",
                icon: "🔬",
                color: "from-teal-500 to-teal-600"
              }
            ].map((doc) => (
                <div 
                  key={doc.id}
                onClick={() => doc.status === 'analyzed' && onNavigate('analysis')}
                className={`bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200 cursor-pointer hover:border-gray-300`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center`}>
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                    </div>
                
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 text-base mb-1">{doc.name}</h3>
                  <p className="text-sm text-gray-500">{doc.type} • {doc.pages} pages</p>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{doc.date}</span>
                  {doc.status === 'analyzed' && (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                      Complete
                    </span>
                  )}
                  {doc.status === 'analyzing' && (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
                      Analyzing
                    </span>
                  )}
                  </div>
                </div>
              ))}
            </div>
          
          {/* Empty State */}
          <div className="text-center mt-12">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <p className="text-gray-500">Upload your first document to get started</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;