import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import all page components
import LandingPage from './components/LandingPage';
import SignUpPage from './pages/SignUpPage';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import AnalysisPage from './components/AnalysisPage';
import UploadPage from './components/UploadPage';
import SettingsPage from './components/SettingsPage';

const App = () => {
  const [currentPage, setCurrentPage] = useState('landing');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage onNavigate={setCurrentPage} />;
      case 'signup':
        return <SignUpPage onNavigate={setCurrentPage} onSignUp={setIsLoggedIn} />;
      case 'login':
        return <LoginPage onNavigate={setCurrentPage} onLogin={setIsLoggedIn} />;
      case 'dashboard':
        return isLoggedIn ? <Dashboard onNavigate={setCurrentPage} /> : <LandingPage onNavigate={setCurrentPage} />;
      case 'analysis':
        return isLoggedIn ? <AnalysisPage onNavigate={setCurrentPage} /> : <LandingPage onNavigate={setCurrentPage} />;
      case 'upload':
        return isLoggedIn ? <UploadPage onNavigate={setCurrentPage} /> : <LandingPage onNavigate={setCurrentPage} />;
      case 'settings':
        return isLoggedIn ? <SettingsPage onNavigate={setCurrentPage} /> : <LandingPage onNavigate={setCurrentPage} />;
      default:
        return <LandingPage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {renderCurrentPage()}
    </div>
  );
};

// Individual Page Components
const LandingPage = ({ onNavigate }) => {
  const [inputText, setInputText] = useState('');

  const handleSubmit = () => {
    onNavigate('signup');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-violet-600 hover:bg-violet-700 rounded-lg flex items-center justify-center">
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
            Enhance your academic<br />writing with <span className="bg-violet-600 hover:bg-violet-700 bg-clip-text text-transparent">AI</span>
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Get detailed feedback on your research papers, essays, and academic work with AI-powered analysis that helps you write like a scholar.
          </p>
          
          {/* Interactive Text Input */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste your academic text here to see how our AI can help improve it..."
                className="w-full h-32 p-4 text-gray-700 border-none outline-none resize-none placeholder-gray-400"
              />
              <div className="flex justify-between items-center mt-4">
                <span className="text-sm text-gray-400">AI-powered academic feedback</span>
                <button
                  onClick={handleSubmit}
                  className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all duration-300 flex items-center space-x-2"
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
            <div className="bg-white rounded-2xl shadow-xl p-12 border border-gray-200">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-violet-600 hover:bg-violet-700 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">S</span>
                </div>
              </div>
              <blockquote className="text-xl text-gray-900 mb-6 leading-relaxed">
                "This platform has <em className="font-semibold text-blue-600">revolutionized</em> my research writing process. The AI feedback is incredibly detailed and helped me <em className="font-semibold text-purple-600">improve my argumentation</em> and academic style significantly."
              </blockquote>
              <cite className="text-gray-600">
                <span className="font-semibold">Sarah Chen</span> / PhD Candidate, Stanford University
              </cite>
              <div className="flex justify-center mt-6 space-x-2">
                <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="text-center mb-20">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">How it works</h2>
          <p className="text-xl text-gray-600 mb-16">Transform your academic writing into polished, professional work in just a few simple steps.</p>
          
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Upload Your Paper</h3>
              <p className="text-gray-600">Upload your academic document in PDF, Word, or paste your text directly.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-purple-600 font-bold">2</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">AI Analysis</h3>
              <p className="text-gray-600">Our AI analyzes your writing for structure, clarity, grammar, and academic style.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 font-bold">3</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Review Feedback</h3>
              <p className="text-gray-600">Get detailed, professor style annotations and suggestions for improvement.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-indigo-600 font-bold">4</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Improve & Iterate</h3>
              <p className="text-gray-600">Apply suggestions and re-analyze to continuously enhance your academic writing.</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gray-900 hover:bg-gray-800 rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to enhance your academic writing?</h2>
          <p className="text-gray-300 mb-8">Join thousands of students and researchers who trust AcademicAI for their writing success.</p>
          <button 
            onClick={() => onNavigate('signup')}
            className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:shadow-lg transition-all duration-300"
          >
            Start Writing Better →
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12">
        <div className="max-w-6xl mx-auto px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-violet-600 hover:bg-violet-700 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">A</span>
                </div>
                <span className="text-xl font-bold text-gray-900">AcademicAI</span>
              </div>
              <p className="text-gray-600 text-sm">© 2026 AcademicAI. All rights reserved.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="/about" className="text-gray-600 hover:text-gray-900 text-sm">About</a></li>
                <li><a href="/pricing" className="text-gray-600 hover:text-gray-900 text-sm">Pricing</a></li>
                <li><a href="/contact" className="text-gray-600 hover:text-gray-900 text-sm">Contact Us</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><a href="/help" className="text-gray-600 hover:text-gray-900 text-sm">Help Center</a></li>
                <li><a href="/contact" className="text-gray-600 hover:text-gray-900 text-sm">API Docs</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="/terms" className="text-gray-600 hover:text-gray-900 text-sm">Terms of Service</a></li>
                <li><a href="/privacy" className="text-gray-600 hover:text-gray-900 text-sm">Privacy Policy</a></li>
                <li><a href="/privacy" className="text-gray-600 hover:text-gray-900 text-sm">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;