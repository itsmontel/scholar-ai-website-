import { useState, useEffect } from 'react';
import Header from '../common/Header';

interface SettingsPageProps {
  onNavigate: (page: string) => void;
  user: any;
  onLogout: () => void;
}

const SettingsPage = ({ onNavigate, user, onLogout }: SettingsPageProps) => {
  const [userStats, setUserStats] = useState({
    memberSince: '',
    totalDocuments: 0,
    documentsAnalyzed: 0,
    lastActivity: ''
  });
  const [loading, setLoading] = useState(true);

  // Fetch user stats
  const fetchUserStats = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setLoading(false);
        return;
      }

      // Fetch user details
      const userResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        const createdDate = new Date(userData.data.created_at);
        setUserStats(prev => ({
          ...prev,
          memberSince: createdDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        }));
      }

      // Fetch document stats
      const statsResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/documents/stats/overview`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setUserStats(prev => ({
          ...prev,
          totalDocuments: statsData.data.stats.total_documents || 0,
          documentsAnalyzed: statsData.data.stats.documents_analyzed || 0,
          lastActivity: statsData.data.stats.last_activity ? 
            new Date(statsData.data.stats.last_activity).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            }) : 'No recent activity'
        }));
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserStats();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="account" />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Page Header */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-50/80 text-blue-700 rounded-full text-xs sm:text-sm font-medium mb-6 sm:mb-8 border border-blue-200/50">
            <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Account Management
      </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight tracking-tight">
            Account <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">Settings</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-4">
            Manage your profile, subscription, security settings, and preferences all in one place.
          </p>
        </div>

        {/* Settings List */}
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Profile Information */}
          <div className="bg-white/90 backdrop-blur-xl border border-gray-200/60 rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Information</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <div>
                  <div className="font-semibold text-gray-900">Email</div>
                  <div className="text-gray-600">{user?.email || 'Loading...'}</div>
      </div>
    </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
      <div>
                  <div className="font-semibold text-gray-900">Name</div>
                  <div className="text-gray-600">{user?.name || 'Loading...'}</div>
                </div>
              </div>
              <div className="flex items-center justify-between py-3">
              <div>
                  <div className="font-semibold text-gray-900">Member Since</div>
                  <div className="text-gray-600">{loading ? 'Loading...' : userStats.memberSince}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Usage Statistics */}
          <div className="bg-white/90 backdrop-blur-xl border border-gray-200/60 rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Usage Statistics</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <div>
                  <div className="font-semibold text-gray-900">Total Documents</div>
                  <div className="text-gray-600">{loading ? 'Loading...' : userStats.totalDocuments}</div>
              </div>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <div>
                  <div className="font-semibold text-gray-900">Documents Analyzed</div>
                  <div className="text-gray-600">{loading ? 'Loading...' : userStats.documentsAnalyzed}</div>
            </div>
              </div>
              <div className="flex items-center justify-between py-3">
              <div>
                  <div className="font-semibold text-gray-900">Last Activity</div>
                  <div className="text-gray-600">{loading ? 'Loading...' : userStats.lastActivity}</div>
                </div>
              </div>
          </div>
      </div>

          {/* Subscription */}
          <div className="bg-white/90 backdrop-blur-xl border border-gray-200/60 rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Subscription</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
          <div>
                  <div className="font-semibold text-gray-900">Current Plan</div>
                  <div className="text-gray-600">Free Plan</div>
                </div>
                <button 
                  onClick={() => onNavigate('pricing')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                  Upgrade
                </button>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <div className="font-semibold text-gray-900">Credits Remaining</div>
                  <div className="text-gray-600">0 credits</div>
                </div>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="bg-white/90 backdrop-blur-xl border border-gray-200/60 rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Security</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <div>
                  <div className="font-semibold text-gray-900">Password</div>
                  <div className="text-gray-600">Last changed: Never</div>
                </div>
                <button className="text-blue-600 hover:text-blue-700 font-medium">
                  Change Password
                </button>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <div className="font-semibold text-gray-900">Two-Factor Authentication</div>
                  <div className="text-gray-600">Not enabled</div>
                </div>
                <button className="text-blue-600 hover:text-blue-700 font-medium">
                  Enable 2FA
                </button>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-white/90 backdrop-blur-xl border border-gray-200/60 rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Preferences</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <div>
                  <div className="font-semibold text-gray-900">Email Notifications</div>
                  <div className="text-gray-600">Receive updates about your documents</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <div className="font-semibold text-gray-900">Dark Mode</div>
                  <div className="text-gray-600">Switch to dark theme</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
                  </div>
                </div>
        </div>

          {/* Danger Zone */}
          <div className="bg-red-50/90 backdrop-blur-xl border border-red-200/60 rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-red-900 mb-6">Danger Zone</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3">
                <div>
                  <div className="font-semibold text-red-900">Delete Account</div>
                  <div className="text-red-600">Permanently delete your account and all data</div>
                </div>
                <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;