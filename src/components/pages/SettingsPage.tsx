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
    lastActivity: '',
    subscriptionPlan: 'free',
    subscriptionStatus: 'active'
  });
  const [loading, setLoading] = useState(true);
  const [currentUsername, setCurrentUsername] = useState('');
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [usernameSuccess, setUsernameSuccess] = useState('');
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [savingUsername, setSavingUsername] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  // Fetch user stats
  const fetchUserStats = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setLoading(false);
        return;
      }

      // Fetch user profile with subscription data (cache-busting)
      const profileResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/users/profile?t=${Date.now()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        const userData = profileData.data.user;
        const createdDate = new Date(userData.createdAt);
        
        setCurrentUsername(userData.username || '');
        setNewUsername(userData.username || '');
        
        setUserStats(prev => ({
          ...prev,
          memberSince: createdDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          subscriptionPlan: userData.subscriptionPlan || 'free',
          subscriptionStatus: userData.subscriptionStatus || 'active'
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

  const checkUsernameAvailability = async (username: string) => {
    if (username.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameError('Username can only contain letters, numbers, and underscores');
      return false;
    }
    if (username.toLowerCase() === currentUsername.toLowerCase()) {
      setUsernameError('');
      return true;
    }

    setCheckingUsername(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/users/username/check/${username}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (!data.available) {
        setUsernameError('Username is already taken');
        return false;
      }
      setUsernameError('');
      return true;
    } catch {
      setUsernameError('Error checking username');
      return false;
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleSaveUsername = async () => {
    const isValid = await checkUsernameAvailability(newUsername);
    if (!isValid) return;

    setSavingUsername(true);
    setUsernameError('');
    setUsernameSuccess('');

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/users/username`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: newUsername })
      });
      const data = await response.json();

      if (data.success) {
        setCurrentUsername(data.data.username);
        setUsernameSuccess('Username updated successfully!');
        setEditingUsername(false);
        setTimeout(() => setUsernameSuccess(''), 3000);
      } else {
        setUsernameError(data.message || 'Failed to update username');
      }
    } catch {
      setUsernameError('Failed to update username');
    } finally {
      setSavingUsername(false);
    }
  };

  const handleCancelEdit = () => {
    setNewUsername(currentUsername);
    setUsernameError('');
    setEditingUsername(false);
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #FAF8F5 0%, #F5F3F0 100%)' }}>
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="account" />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Page Header */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-lime-50/80 text-lime-700 rounded-full text-xs sm:text-sm font-medium mb-6 sm:mb-8 border border-lime-200/50">
            <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Account Management
      </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl text-stone-800 mb-4 sm:mb-6 leading-tight tracking-tight" style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 400 }}>
            Account <span className="text-lime-600 italic">Settings</span>
          </h1>
          <p className="text-lg sm:text-xl text-stone-600 max-w-3xl mx-auto leading-relaxed px-4">
            Manage your profile, subscription, security settings, and preferences all in one place.
          </p>
        </div>

        {/* Settings List */}
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Profile Information */}
          <div className="bg-white/90 backdrop-blur-xl border border-stone-200/60 rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-stone-800 mb-6">Profile Information</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-stone-200">
                <div>
                  <div className="font-semibold text-stone-800">Email</div>
                  <div className="text-stone-600">{user?.email || 'Loading...'}</div>
                </div>
              </div>
              <div className="py-3 border-b border-stone-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-semibold text-stone-800">Username</div>
                    {editingUsername ? (
                      <div className="mt-2">
                        <div className="flex items-center gap-2">
                          <span className="text-stone-400">@</span>
                          <input
                            type="text"
                            value={newUsername}
                            onChange={(e) => {
                              setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''));
                              setUsernameError('');
                            }}
                            onBlur={() => newUsername && checkUsernameAvailability(newUsername)}
                            className="flex-1 px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                            placeholder="username"
                            maxLength={30}
                          />
                        </div>
                        {usernameError && (
                          <p className="text-red-500 text-sm mt-1">{usernameError}</p>
                        )}
                        {checkingUsername && (
                          <p className="text-stone-500 text-sm mt-1">Checking availability...</p>
                        )}
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={handleSaveUsername}
                            disabled={savingUsername || checkingUsername || !!usernameError}
                            className="bg-lime-500 hover:bg-lime-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {savingUsername ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="bg-stone-200 hover:bg-stone-300 text-stone-700 px-4 py-2 rounded-lg font-medium transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-stone-600">
                        {loading ? 'Loading...' : currentUsername ? `@${currentUsername}` : 'Not set'}
                      </div>
                    )}
                    {usernameSuccess && (
                      <p className="text-lime-600 text-sm mt-1">{usernameSuccess}</p>
                    )}
                  </div>
                  {!editingUsername && (
                    <button
                      onClick={() => setEditingUsername(true)}
                      className="text-lime-600 hover:text-lime-700 font-medium"
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <div className="font-semibold text-stone-800">Member Since</div>
                  <div className="text-stone-600">{loading ? 'Loading...' : userStats.memberSince}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Usage Statistics */}
          <div className="bg-white/90 backdrop-blur-xl border border-stone-200/60 rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-stone-800 mb-6">Usage Statistics</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-stone-200">
                <div>
                  <div className="font-semibold text-stone-800">Total Documents</div>
                  <div className="text-stone-600">{loading ? 'Loading...' : userStats.totalDocuments}</div>
              </div>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-stone-200">
                <div>
                  <div className="font-semibold text-stone-800">Documents Analyzed</div>
                  <div className="text-stone-600">{loading ? 'Loading...' : userStats.documentsAnalyzed}</div>
            </div>
              </div>
              <div className="flex items-center justify-between py-3">
              <div>
                  <div className="font-semibold text-stone-800">Last Activity</div>
                  <div className="text-stone-600">{loading ? 'Loading...' : userStats.lastActivity}</div>
                </div>
              </div>
          </div>
      </div>

          {/* Subscription */}
          <div className="bg-white/90 backdrop-blur-xl border border-stone-200/60 rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-stone-800 mb-6">Subscription</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-stone-200">
                <div>
                  <div className="font-semibold text-stone-800">Current Plan</div>
                  <div className="text-stone-600 flex items-center">
                    <span className="capitalize">{userStats.subscriptionPlan}</span>
                    <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      userStats.subscriptionStatus === 'active'
                        ? 'bg-lime-100 text-lime-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {userStats.subscriptionStatus}
                    </span>
                  </div>
                </div>
                {userStats.subscriptionPlan === 'free' && (
                  <button 
                    onClick={() => onNavigate('pricing')}
                    className="bg-lime-400 hover:bg-lime-300 text-stone-900 px-4 py-2 rounded-full font-medium transition-all duration-200"
                  >
                    Upgrade
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <div className="font-semibold text-stone-800">Plan Features</div>
                  <div className="text-stone-600">
                    {userStats.subscriptionPlan === 'free' 
                      ? '3 analyses per month' 
                      : userStats.subscriptionPlan === 'starter' || userStats.subscriptionPlan === 'premium'
                      ? '999 analyses per month'
                      : 'View billing for details'
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="bg-white/90 backdrop-blur-xl border border-stone-200/60 rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-stone-800 mb-6">Security</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-stone-200">
                <div>
                  <div className="font-semibold text-stone-800">Password</div>
                  <div className="text-stone-600">Last changed: Never</div>
                </div>
                <button className="text-lime-600 hover:text-lime-700 font-medium">
                  Change Password
                </button>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <div className="font-semibold text-stone-800">Two-Factor Authentication</div>
                  <div className="text-stone-600">Not enabled</div>
                </div>
                <button className="text-lime-600 hover:text-lime-700 font-medium">
                  Enable 2FA
                </button>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-white/90 backdrop-blur-xl border border-stone-200/60 rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-stone-800 mb-6">Preferences</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-stone-200">
                <div>
                  <div className="font-semibold text-stone-800">Email Notifications</div>
                  <div className="text-stone-600">Receive updates about your documents</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-lime-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-lime-500"></div>
                </label>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <div className="font-semibold text-stone-800">Dark Mode</div>
                  <div className="text-stone-600">Switch to dark theme</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-lime-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-lime-500"></div>
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