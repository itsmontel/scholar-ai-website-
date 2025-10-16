import React, { useState } from 'react';
import SignUpPage from './components/pages/SignUpPage';
import LoginPage from './components/pages/LoginPage';
import EmailVerificationPage from './components/pages/EmailVerificationPage';

// Type definitions
interface NavigationProps {
  onNavigate: (page: string) => void;
}

// Landing Page Component
const LandingPage: React.FC<NavigationProps> = ({ onNavigate }) => {
  const [inputText, setInputText] = useState('');

  const handleSubmit = () => {
    onNavigate('signup');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="text-xl font-bold text-gray-900">AcademicAI</span>
        </div>
        <div className="hidden md:flex items-center space-x-8">
          <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
          <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
          <a href="#about" className="text-gray-600 hover:text-gray-900 transition-colors">About</a>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => onNavigate('login')}
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            Login
          </button>
          <button 
            onClick={() => onNavigate('signup')}
            className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Sign up
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Enhance your academic<br />writing with <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">AI</span>
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Get detailed feedback on your research papers, essays, and academic work with AI-powered analysis that helps you write like a scholar.
          </p>
          
          {/* Interactive Text Input */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-500">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste your academic text here to see how our AI can help improve it..."
                className="w-full h-32 p-4 text-gray-700 border-none outline-none resize-none placeholder-gray-400 bg-transparent"
              />
              <div className="flex justify-between items-center mt-4">
                <span className="text-sm text-gray-400">AI-powered academic feedback</span>
                <button
                  onClick={handleSubmit}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center space-x-2"
                >
                  <span>Analyze</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>


        {/* Reviews Section */}
        <div className="text-center mb-20">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-12 border border-white/20">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">S</span>
                </div>
              </div>
              <blockquote className="text-xl text-gray-900 mb-6 leading-relaxed">
                "This platform has <em className="font-semibold text-blue-600">revolutionized</em> my research writing process. The AI feedback is incredibly detailed and helped me <em className="font-semibold text-purple-600">improve my argumentation</em> significantly."
              </blockquote>
              <cite className="text-gray-600">
                <span className="font-semibold">Sarah Chen</span> / PhD Candidate, Stanford University
              </cite>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="text-center mb-20">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">How it works</h2>
          <p className="text-xl text-gray-600 mb-16">Transform your academic writing into polished, professional work in just a few simple steps.</p>
          
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="text-blue-600 font-bold text-xl">1</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-3">Upload Your Paper</h3>
              <p className="text-gray-600">Upload your academic document in PDF, Word, or paste your text directly.</p>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="text-purple-600 font-bold text-xl">2</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-3">AI Analysis</h3>
              <p className="text-gray-600">Our advanced AI analyzes your writing for structure, clarity, and academic rigor.</p>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-r from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="text-green-600 font-bold text-xl">3</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-3">Review Feedback</h3>
              <p className="text-gray-600">Get detailed, professor-style annotations and suggestions.</p>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-100 to-indigo-200 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="text-indigo-600 font-bold text-xl">4</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-3">Improve & Iterate</h3>
              <p className="text-gray-600">Apply suggestions and re-analyze to continuously enhance your writing.</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-12 text-center relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to enhance your academic writing?</h2>
            <p className="text-gray-300 mb-8">Join thousands of students and researchers who trust AcademicAI.</p>
            <button 
              onClick={() => onNavigate('signup')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
            >
              Start Writing Better →
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white/50 backdrop-blur-sm border-t border-gray-200 py-12">
        <div className="max-w-6xl mx-auto px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">A</span>
                </div>
                <span className="text-xl font-bold text-gray-900">AcademicAI</span>
              </div>
              <p className="text-gray-600 text-sm">© 2025 AcademicAI. All rights reserved.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 hover:text-gray-900 text-sm">About</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900 text-sm">Pricing</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900 text-sm">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 hover:text-gray-900 text-sm">Help Center</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900 text-sm">API Docs</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 hover:text-gray-900 text-sm">Terms</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900 text-sm">Privacy</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900 text-sm">Cookies</a></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};


// Main App Component
const App = () => {
  const [currentPage, setCurrentPage] = useState('landing');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Handle URL-based routing
  React.useEffect(() => {
    const path = window.location.pathname;
    // const search = window.location.search; // Unused variable
    
    if (path === '/email-verification') {
      setCurrentPage('email-verification');
    } else if (path === '/signup') {
      setCurrentPage('signup');
    } else if (path === '/login') {
      setCurrentPage('login');
    } else if (path === '/dashboard') {
      setCurrentPage('dashboard');
    } else {
      setCurrentPage('landing');
    }
  }, []);

  const navigateTo = (page: string) => {
    setCurrentPage(page);
    // Update URL to match the page
    if (page === 'landing') {
      window.history.pushState({}, '', '/');
    } else {
      window.history.pushState({}, '', `/${page}`);
    }
  };

  const handleSignUp = (status: boolean) => {
    setIsLoggedIn(status);
  };

  const handleLogin = (status: boolean) => {
    setIsLoggedIn(status);
  };

  // Simple routing logic
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'signup':
        return <SignUpPage onNavigate={navigateTo} onSignUp={handleSignUp} />;
      case 'login':
        return <LoginPage onNavigate={navigateTo} onLogin={handleLogin} />;
      case 'email-verification':
        return <EmailVerificationPage onNavigate={navigateTo} />;
      case 'dashboard':
        return isLoggedIn ? <Dashboard onNavigate={navigateTo} /> : <LandingPage onNavigate={navigateTo} />;
      case 'upload':
        return isLoggedIn ? <UploadPage onNavigate={navigateTo} /> : <LandingPage onNavigate={navigateTo} />;
      case 'analysis':
        return isLoggedIn ? <AnalysisPage onNavigate={navigateTo} /> : <LandingPage onNavigate={navigateTo} />;
      case 'settings':
        return isLoggedIn ? <SettingsPage onNavigate={navigateTo} /> : <LandingPage onNavigate={navigateTo} />;
      default:
        return <LandingPage onNavigate={navigateTo} />;
    }
  };

  return (
    <div className="min-h-screen">
      {renderCurrentPage()}
    </div>
  );
};

// Placeholder components (these would be imported from separate files in a real app)

const Dashboard: React.FC<NavigationProps> = ({ onNavigate }) => (
  <div className="min-h-screen bg-gray-50 p-8">
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <button 
          onClick={() => onNavigate('upload')}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg"
        >
          Upload Document
        </button>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Recent Documents</h3>
          <p className="text-gray-600">3 documents analyzed this week</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Writing Score</h3>
          <p className="text-2xl font-bold text-blue-600">87%</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Improvements</h3>
          <p className="text-gray-600">+12% from last month</p>
        </div>
      </div>
      <nav className="mt-8 flex space-x-4">
        <button onClick={() => onNavigate('analysis')} className="text-blue-600">View Analysis</button>
        <button onClick={() => onNavigate('settings')} className="text-gray-600">Settings</button>
      </nav>
    </div>
  </div>
);

const UploadPage: React.FC<NavigationProps> = ({ onNavigate }) => (
  <div className="min-h-screen bg-gray-50 p-8">
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Upload Document</h1>
      <div className="bg-white rounded-xl shadow-lg p-12 text-center border-2 border-dashed border-gray-300">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Drop your files here</h3>
        <p className="text-gray-500 mb-4">or click to browse</p>
        <button 
          onClick={() => onNavigate('analysis')}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg"
        >
          Start Analysis
        </button>
      </div>
      <button onClick={() => onNavigate('dashboard')} className="mt-4 text-blue-600">← Back to Dashboard</button>
    </div>
  </div>
);

const AnalysisPage: React.FC<NavigationProps> = ({ onNavigate }) => (
  <div className="min-h-screen bg-gray-50 p-8">
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Document Analysis</h1>
        <button onClick={() => onNavigate('dashboard')} className="text-blue-600">← Back to Dashboard</button>
      </div>
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Climate Change Research Paper</h2>
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed">
              This research paper examines the multifaceted impacts of climate change on global ecosystems...
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">AI Feedback</h3>
          <div className="space-y-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-sm font-medium text-green-700">Strong Opening</p>
              <p className="text-xs text-gray-600">Excellent introduction</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <p className="text-sm font-medium text-yellow-700">Consider Clarification</p>
              <p className="text-xs text-gray-600">Add more methodology details</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const SettingsPage: React.FC<NavigationProps> = ({ onNavigate }) => (
  <div className="min-h-screen bg-gray-50 p-8">
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <button onClick={() => onNavigate('dashboard')} className="text-blue-600">← Back to Dashboard</button>
      </div>
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Profile Settings</h3>
            <div className="space-y-4">
              <input type="text" placeholder="Full Name" className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
              <input type="email" placeholder="Email" className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
              <input type="text" placeholder="Institution" className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Preferences</h3>
            <div className="space-y-4">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-gray-700">Email notifications</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-gray-700">Auto-save documents</span>
              </label>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-gray-200">
          <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default App;