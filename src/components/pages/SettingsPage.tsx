import { useState, useEffect } from 'react';

interface SettingsPageProps {
  onNavigate: (page: string) => void;
  user: any;
  onLogout: () => void;
}

const SettingsPage = ({ onNavigate, user, onLogout }: SettingsPageProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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
                className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-100/50 transition-all duration-200"
              >
                Dashboard
            </button>
              <button 
                onClick={() => onNavigate('library')}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-100/50 transition-all duration-200"
              >
                Library
              </button>
              <button 
                onClick={() => onNavigate('settings')}
                className="relative px-4 py-2 text-blue-600 font-semibold rounded-lg bg-blue-50/80 hover:bg-blue-100/80 transition-all duration-200"
              >
                Account
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"></div>
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
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Page Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-blue-50/80 text-blue-700 rounded-full text-sm font-medium mb-8 border border-blue-200/50">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Account Management
      </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight tracking-tight">
            Account <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">Settings</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Manage your profile, subscription, security settings, and preferences all in one place.
          </p>
        </div>

        {/* Settings List */}
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Profile Information */}
          <div className="bg-white/90 backdrop-blur-xl border border-gray-200/60 rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Profile Information</h2>
            <div className="space-y-4 text-center">
              <div className="py-3 border-b border-gray-200">
                <div className="font-semibold text-gray-900">Email</div>
                <div className="text-gray-600">{user?.email || 'user@example.com'}</div>
      </div>
              <div className="py-3 border-b border-gray-200">
                <div className="font-semibold text-gray-900">Name</div>
                <div className="text-gray-600">{user?.name || 'User Name'}</div>
              </div>
              <div className="py-3">
                <div className="font-semibold text-gray-900">Member Since</div>
                <div className="text-gray-600">January 2024</div>
              </div>
            </div>
          </div>

          {/* Usage Statistics */}
          <div className="bg-white/90 backdrop-blur-xl border border-gray-200/60 rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Usage Statistics</h2>
            <div className="space-y-4 text-center">
              <div className="py-3 border-b border-gray-200">
                <div className="font-semibold text-gray-900">Documents Analyzed</div>
                <div className="text-gray-600">This month: 3 / 3</div>
                <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm">3 used</span>
              </div>
              <div className="py-3 border-b border-gray-200">
                <div className="font-semibold text-gray-900">Total Documents</div>
                <div className="text-gray-600">All time: 47 documents</div>
                <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm">47 total</span>
              </div>
              <div className="py-3">
                <div className="font-semibold text-gray-900">Last Activity</div>
                <div className="text-gray-600">2 days ago</div>
                <span className="inline-block mt-2 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">Recent</span>
              </div>
            </div>
          </div>

          {/* Support */}
          <div className="bg-white/90 backdrop-blur-xl border border-gray-200/60 rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Support</h2>
            <p className="text-gray-600 mb-6 text-center">Need help? Check our FAQ for common questions or contact us directly.</p>
            
            <div className="space-y-4 text-center">
              <button
                onClick={() => onNavigate('help')}
                className="w-full p-4 hover:bg-gray-50 rounded-xl transition-colors duration-200"
              >
                <div className="flex flex-col items-center space-y-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                    <div className="font-semibold text-gray-900">FAQ</div>
                    <div className="text-sm text-gray-600">Find answers to common questions</div>
              </div>
            </div>
            </button>

              <button 
                onClick={() => onNavigate('contact')}
                className="w-full p-4 hover:bg-gray-50 rounded-xl transition-colors duration-200"
              >
                <div className="flex flex-col items-center space-y-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
          </div>
                  <div>
                    <div className="font-semibold text-gray-900">Contact Us</div>
                    <div className="text-sm text-gray-600">Get in touch with our support team</div>
        </div>
      </div>
              </button>

              <button 
                onClick={() => onNavigate('writing-guide')}
                className="w-full p-4 hover:bg-gray-50 rounded-xl transition-colors duration-200"
              >
                <div className="flex flex-col items-center space-y-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
      <div>
                    <div className="font-semibold text-gray-900">Writing Guide</div>
                    <div className="text-sm text-gray-600">Learn best practices for academic writing</div>
        </div>
      </div>
              </button>
    </div>
          </div>

          {/* Subscription */}
          <div className="bg-white/90 backdrop-blur-xl border border-gray-200/60 rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Subscription</h2>
            <div className="space-y-4 text-center">
              <div className="py-3 border-b border-gray-200">
                <div className="font-semibold text-gray-900">Current Plan</div>
                <div className="text-gray-600">No active plan</div>
                <span className="inline-block mt-2 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">Free</span>
        </div>

            <button 
                onClick={() => onNavigate('pricing')}
                className="w-full bg-gray-800 hover:bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <span>Manage Billing</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </button>
          </div>
          </div>
          </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/90 backdrop-blur-xl border-t border-gray-200/60 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">S</span>
                  </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Scholar</span>
            </div>
            <div className="text-gray-500 text-sm">
              © 2024 Scholar. All rights reserved.
          </div>
        </div>
      </div>
      </footer>
    </div>
  );

};

export default SettingsPage;