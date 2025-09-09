import React, { useState } from 'react';

// Import all page components (these would normally be in separate files)
import LandingPage from './components/LandingPage';
import SignUpPage from './components/SignUpPage';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import AnalysisPage from './components/AnalysisPage';
import UploadPage from './components/UploadPage';
import SettingsPage from './components/SettingsPage';
import PricingPage from './components/PricingPage';
import FeaturesPage from './components/FeaturesPage';
import ProfilePage from './components/ProfilePage';
import LibraryPage from './components/LibraryPage';
import HelpCenterPage from './components/HelpCenterPage';
import WritingGuidePage from './components/WritingGuidePage';
import AboutPage from './components/AboutPage';
import ContactPage from './components/ContactPage';

// Main Application Component
const AcademicAIApp = () => {
  const [currentPage, setCurrentPage] = useState('landing');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  // Navigation function
  const navigateTo = (page) => {
    setCurrentPage(page);
  };

  // Authentication handlers
  const handleSignUp = (userData) => {
    setIsLoggedIn(true);
    setUser(userData || { 
      name: 'Dr. Sarah Chen', 
      email: 'sarah.chen@stanford.edu',
      plan: 'premium'
    });
  };

  const handleLogin = (userData) => {
    setIsLoggedIn(true);
    setUser(userData || { 
      name: 'Dr. Sarah Chen', 
      email: 'sarah.chen@stanford.edu',
      plan: 'premium'
    });
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setCurrentPage('landing');
  };

  // Route protection for authenticated pages
  const protectedRoutes = ['dashboard', 'analysis', 'upload', 'settings', 'profile', 'library'];
  
  const renderCurrentPage = () => {
    // Redirect to login if trying to access protected route while not logged in
    if (protectedRoutes.includes(currentPage) && !isLoggedIn) {
      return <LoginPage onNavigate={navigateTo} onLogin={handleLogin} />;
    }

    switch (currentPage) {
      case 'landing':
        return <LandingPage onNavigate={navigateTo} />;
      case 'signup':
        return <SignUpPage onNavigate={navigateTo} onSignUp={handleSignUp} />;
      case 'login':
        return <LoginPage onNavigate={navigateTo} onLogin={handleLogin} />;
      case 'pricing':
        return <PricingPage onNavigate={navigateTo} />;
      case 'features':
        return <FeaturesPage onNavigate={navigateTo} />;
      case 'about':
        return <AboutPage onNavigate={navigateTo} />;
      case 'contact':
        return <ContactPage onNavigate={navigateTo} />;
      case 'help':
        return <HelpCenterPage onNavigate={navigateTo} />;
      case 'writing-guide':
        return <WritingGuidePage onNavigate={navigateTo} />;
      case 'dashboard':
        return <Dashboard onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'analysis':
        return <AnalysisPage onNavigate={navigateTo} user={user} />;
      case 'upload':
        return <UploadPage onNavigate={navigateTo} user={user} />;
      case 'settings':
        return <SettingsPage onNavigate={navigateTo} user={user} />;
      case 'profile':
        return <ProfilePage onNavigate={navigateTo} user={user} />;
      case 'library':
        return <LibraryPage onNavigate={navigateTo} user={user} />;
      case 'privacy':
        return <PrivacyPolicyPage onNavigate={navigateTo} />;
      case 'terms':
        return <TermsOfServicePage onNavigate={navigateTo} />;
      case 'admin':
        return <AdminDashboard onNavigate={navigateTo} user={user} />;
      case 'collaboration':
        return <CollaborationPage onNavigate={navigateTo} user={user} />;
      default:
        return <LandingPage onNavigate={navigateTo} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {renderCurrentPage()}
    </div>
  );
};

// Privacy Policy Page Component
const PrivacyPolicyPage = ({ onNavigate }) => (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
    {/* Navigation */}
    <nav className="flex items-center justify-between px-8 py-6 bg-white/80 backdrop-blur-sm border-b border-gray-200">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">A</span>
        </div>
        <span className="text-xl font-bold text-gray-900">AcademicAI</span>
      </div>
      <div className="flex items-center space-x-4">
        <button onClick={() => onNavigate('landing')} className="text-gray-600 hover:text-gray-900 transition-colors">
          Home
        </button>
        <button onClick={() => onNavigate('contact')} className="text-gray-600 hover:text-gray-900 transition-colors">
          Contact
        </button>
      </div>
    </nav>

    <div className="max-w-4xl mx-auto px-8 py-12">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
        <p className="text-gray-600 mb-8">Last updated: September 8, 2025</p>
        
        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Information We Collect</h2>
            <div className="space-y-4 text-gray-700">
              <p>We collect information you provide directly to us, such as when you create an account, upload documents, or contact us for support.</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Account information (name, email, institutional affiliation)</li>
                <li>Document content for analysis purposes</li>
                <li>Usage data and analytics</li>
                <li>Communication records with our support team</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">How We Use Your Information</h2>
            <div className="space-y-4 text-gray-700">
              <p>We use the information we collect to:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Provide and improve our AI writing analysis services</li>
                <li>Communicate with you about your account and our services</li>
                <li>Ensure the security and integrity of our platform</li>
                <li>Comply with legal obligations</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Security</h2>
            <div className="space-y-4 text-gray-700">
              <p>We implement industry-standard security measures to protect your data:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>End-to-end encryption for all document transfers</li>
                <li>SOC 2 Type II compliance</li>
                <li>Regular security audits and penetration testing</li>
                <li>Restricted access controls and employee training</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Rights</h2>
            <div className="space-y-4 text-gray-700">
              <p>You have the right to:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Access, update, or delete your personal information</li>
                <li>Export your data in a machine-readable format</li>
                <li>Opt out of non-essential communications</li>
                <li>Request deletion of your account and associated data</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
            <div className="text-gray-700">
              <p>If you have questions about this Privacy Policy, please contact us at:</p>
              <p className="mt-2">
                Email: privacy@academicai.com<br />
                Address: 123 Innovation Drive, Suite 400, San Francisco, CA 94107
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>
);

// Terms of Service Page Component
const TermsOfServicePage = ({ onNavigate }) => (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
    {/* Navigation */}
    <nav className="flex items-center justify-between px-8 py-6 bg-white/80 backdrop-blur-sm border-b border-gray-200">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">A</span>
        </div>
        <span className="text-xl font-bold text-gray-900">AcademicAI</span>
      </div>
      <div className="flex items-center space-x-4">
        <button onClick={() => onNavigate('landing')} className="text-gray-600 hover:text-gray-900 transition-colors">
          Home
        </button>
        <button onClick={() => onNavigate('contact')} className="text-gray-600 hover:text-gray-900 transition-colors">
          Contact
        </button>
      </div>
    </nav>

    <div className="max-w-4xl mx-auto px-8 py-12">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
        <p className="text-gray-600 mb-8">Last updated: September 8, 2025</p>
        
        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Acceptance of Terms</h2>
            <p className="text-gray-700">
              By accessing and using AcademicAI, you accept and agree to be bound by the terms and provision of this agreement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Description of Service</h2>
            <div className="space-y-4 text-gray-700">
              <p>AcademicAI provides AI-powered writing analysis and feedback services for academic documents, including:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Grammar and style analysis</li>
                <li>Citation format checking</li>
                <li>Structure and organization feedback</li>
                <li>Plagiarism detection</li>
                <li>Collaboration tools</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">User Responsibilities</h2>
            <div className="space-y-4 text-gray-700">
              <p>You agree to:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Provide accurate account information</li>
                <li>Use the service for legitimate academic purposes only</li>
                <li>Respect intellectual property rights</li>
                <li>Not attempt to reverse engineer or compromise our systems</li>
                <li>Comply with your institution's academic integrity policies</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Payment Terms</h2>
            <div className="space-y-4 text-gray-700">
              <p>For paid subscriptions:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Billing occurs monthly or annually as selected</li>
                <li>You may cancel at any time with no penalty</li>
                <li>Refunds are provided on a case-by-case basis</li>
                <li>Price changes will be communicated 30 days in advance</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Limitation of Liability</h2>
            <p className="text-gray-700">
              AcademicAI provides writing assistance tools and should not be considered a substitute for proper academic training, 
              citation knowledge, or institutional writing support. Users are responsible for ensuring their work meets all 
              academic and institutional requirements.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Information</h2>
            <div className="text-gray-700">
              <p>For questions about these Terms of Service:</p>
              <p className="mt-2">
                Email: legal@academicai.com<br />
                Address: 123 Innovation Drive, Suite 400, San Francisco, CA 94107
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>
);

// Admin Dashboard Component
const AdminDashboard = ({ onNavigate, user }) => (
  <div className="min-h-screen bg-gray-50">
    {/* Navigation */}
    <nav className="bg-white border-b border-gray-200 px-8 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="text-xl font-bold text-gray-900">AcademicAI Admin</span>
        </div>
        <div className="flex items-center space-x-4">
          <button onClick={() => onNavigate('dashboard')} className="text-gray-600 hover:text-gray-900 transition-colors">
            Back to Dashboard
          </button>
        </div>
      </div>
    </nav>

    <div className="max-w-7xl mx-auto px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Institution Dashboard</h1>
      
      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Active Users</h3>
          <div className="text-3xl font-bold text-blue-600">1,247</div>
          <p className="text-sm text-gray-500">+12% from last month</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Documents Analyzed</h3>
          <div className="text-3xl font-bold text-green-600">8,942</div>
          <p className="text-sm text-gray-500">This month</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Average Score</h3>
          <div className="text-3xl font-bold text-purple-600">84.2%</div>
          <p className="text-sm text-gray-500">Institution-wide</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Support Tickets</h3>
          <div className="text-3xl font-bold text-orange-600">23</div>
          <p className="text-sm text-gray-500">Open tickets</p>
        </div>
      </div>

      {/* Management Sections */}
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">User Management</h2>
          <div className="space-y-4">
            <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <h3 className="font-medium text-gray-900">Add New Users</h3>
              <p className="text-sm text-gray-600">Bulk invite students and faculty</p>
            </button>
            <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <h3 className="font-medium text-gray-900">Manage Permissions</h3>
              <p className="text-sm text-gray-600">Set role-based access controls</p>
            </button>
            <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <h3 className="font-medium text-gray-900">Usage Reports</h3>
              <p className="text-sm text-gray-600">View detailed usage analytics</p>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Institution Settings</h2>
          <div className="space-y-4">
            <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <h3 className="font-medium text-gray-900">Citation Styles</h3>
              <p className="text-sm text-gray-600">Configure default citation formats</p>
            </button>
            <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <h3 className="font-medium text-gray-900">Branding</h3>
              <p className="text-sm text-gray-600">Customize interface with your logo</p>
            </button>
            <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <h3 className="font-medium text-gray-900">Integrations</h3>
              <p className="text-sm text-gray-600">Connect with LMS and other systems</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Collaboration Page Component
const CollaborationPage = ({ onNavigate, user }) => (
  <div className="min-h-screen bg-gray-50">
    {/* Navigation */}
    <nav className="bg-white border-b border-gray-200 px-8 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="text-xl font-bold text-gray-900">AcademicAI</span>
        </div>
        <div className="flex items-center space-x-4">
          <button onClick={() => onNavigate('dashboard')} className="text-gray-600 hover:text-gray-900 transition-colors">
            Dashboard
          </button>
          <button onClick={() => onNavigate('library')} className="text-gray-600 hover:text-gray-900 transition-colors">
            Library
          </button>
        </div>
      </div>
    </nav>

    <div className="max-w-7xl mx-auto px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Team Collaboration</h1>
      
      {/* Active Collaborations */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Projects</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">📄</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Climate Research Collaboration</h3>
                <p className="text-sm text-gray-600">With Dr. Johnson, Emma Rodriguez • 3 documents</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded-full">Active</span>
              <button className="text-blue-600 hover:text-blue-500">Open</button>
            </div>
          </div>
        </div>
      </div>

      {/* Team Members */}
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Team Members</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">DJ</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Dr. Michael Johnson</p>
                  <p className="text-sm text-gray-500">Supervisor</p>
                </div>
              </div>
              <span className="text-xs text-green-600">Online</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Dr. Johnson</span> commented on your methodology section
              <span className="text-gray-400 block">2 hours ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default AcademicAIApp;