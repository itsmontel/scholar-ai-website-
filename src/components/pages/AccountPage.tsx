 import { useState, useEffect } from 'react';
import Header from '../common/Header';
import { FOCUS_MODE_COMING_SOON, FOCUS_MODE_CHROME_EXTENSION_URL } from '../../constants/focusMode';

interface User {
  id: string;
  name?: string;
  username?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  plan: string;
  subscription_status?: string;
  email_verified?: boolean;
}

interface AccountPageProps {
  onNavigate: (page: string) => void;
  user: User | null;
  onLogout: () => void;
  onUserUpdate?: (updates: { username?: string; name?: string; firstName?: string; lastName?: string }) => void;
}

interface UserStats {
  memberSince: string;
  totalDocuments: number;
  documentsAnalyzed: number;
  lastActivity: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  emailVerified: boolean;
}

interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const AccountPage = ({ onNavigate, user, onLogout, onUserUpdate }: AccountPageProps) => {
  const [userStats, setUserStats] = useState<UserStats>({
    memberSince: '',
    totalDocuments: 0,
    documentsAnalyzed: 0,
    lastActivity: '',
    subscriptionPlan: 'free',
    subscriptionStatus: 'active',
    emailVerified: false
  });
  const [loading, setLoading] = useState(true);
  const [displayUser, setDisplayUser] = useState<User | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState<PasswordChangeData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeletionAnimation, setShowDeletionAnimation] = useState(false);
  const [username, setUsername] = useState('');
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [usernameSuccess, setUsernameSuccess] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [nameLoading, setNameLoading] = useState(false);
  const [nameError, setNameError] = useState('');
  const [nameSuccess, setNameSuccess] = useState('');
  const [blockedDomains, setBlockedDomains] = useState<string[]>([]);
  const [presets, setPresets] = useState<{ domain: string; label: string }[]>([]);
  const [focusModeLoading, setFocusModeLoading] = useState(false);
  const [focusModeSaving, setFocusModeSaving] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  // Fetch user stats and profile data
  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setLoading(false);
        return;
      }

      // Fetch user profile with cache-busting timestamp
      const profileResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/users/profile?t=${Date.now()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        const userData = profileData.data.user;
        const createdDate = new Date(userData.createdAt);
        setUsername(userData.username || userData.name || '');
        const nameVal = userData.name || (userData.firstName && userData.lastName ? `${userData.firstName} ${userData.lastName}`.trim() : '') || '';
        setDisplayName(nameVal);
        setUserStats(prev => ({
          ...prev,
          memberSince: createdDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          subscriptionPlan: userData.subscriptionPlan || 'free',
          subscriptionStatus: userData.subscriptionStatus || 'active',
          emailVerified: userData.emailVerified || false
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
          totalDocuments: statsData.data.stats.totalDocuments || 0,
          documentsAnalyzed: statsData.data.stats.documentsAnalyzed || 0,
          lastActivity: statsData.data.stats.lastActivity ? 
            new Date(statsData.data.stats.lastActivity).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            }) : 'No recent activity'
        }));
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Sync display user with prop user
  useEffect(() => {
    if (user) {
      setDisplayUser(user);
      // Pre-fill name from user prop for immediate display (before profile loads)
      const n = user.name || (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}`.trim() : '') || '';
      setDisplayName(prev => (prev === '' ? n : prev));
    } else if (typeof window !== 'undefined') {
      // Fallback to localStorage if no user prop
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          console.log('AccountPage - using localStorage user:', parsedUser);
          setDisplayUser(parsedUser);
          const n = parsedUser.name || (parsedUser.firstName && parsedUser.lastName ? `${parsedUser.firstName} ${parsedUser.lastName}`.trim() : '') || '';
          setDisplayName(prev => (prev === '' ? n : prev));
        }
      } catch (error) {
        console.error('Error getting user from localStorage:', error);
      }
    }
  }, [user]);

  useEffect(() => {
    if (displayUser) {
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, [displayUser]);

  const isPaidUser = userStats.subscriptionPlan === 'pro' || userStats.subscriptionPlan === 'premium';

  useEffect(() => {
    if (!isPaidUser) return;
    const token = localStorage.getItem('authToken');
    if (!token) return;
    setFocusModeLoading(true);
    Promise.all([
      fetch(`${API_URL}/focus-mode/blocked-sites`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_URL}/focus-mode/presets`)
    ])
      .then(([r1, r2]) => Promise.all([r1.json(), r2.json()]))
      .then(([d1, d2]) => {
        if (d1.success) setBlockedDomains(d1.data.blockedDomains || []);
        if (d2.success) setPresets(d2.data || []);
      })
      .catch(() => {})
      .finally(() => setFocusModeLoading(false));
  }, [isPaidUser, API_URL]);

  const toggleBlockedSite = async (domain: string) => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    setFocusModeSaving(true);
    const next = blockedDomains.includes(domain)
      ? blockedDomains.filter((d) => d !== domain)
      : [...blockedDomains, domain];
    try {
      const r = await fetch(`${API_URL}/focus-mode/blocked-sites`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockedDomains: next })
      });
      const data = await r.json();
      if (data.success) setBlockedDomains(data.data.blockedDomains || []);
    } finally {
      setFocusModeSaving(false);
    }
  };

  const handleSaveUsername = async () => {
    const trimmed = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!trimmed) {
      setUsernameError('Username cannot be empty');
      return;
    }
    if (trimmed.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      return;
    }
    if (!/^[a-z0-9_]+$/.test(trimmed)) {
      setUsernameError('Username can only contain letters, numbers, and underscores');
      return;
    }
    setUsernameLoading(true);
    setUsernameError('');
    setUsernameSuccess('');
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/users/username`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ username: trimmed }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const newUsernameValue = data.data?.username || trimmed;
        setUsername(newUsernameValue);
        setUsernameSuccess('Username updated!');
        onUserUpdate?.({ username: newUsernameValue });
        if (typeof window !== 'undefined') {
          try {
            const stored = localStorage.getItem('user');
            if (stored) {
              const parsed = JSON.parse(stored);
              localStorage.setItem('user', JSON.stringify({ ...parsed, username: newUsernameValue }));
            }
          } catch (_) {}
        }
        setTimeout(() => setUsernameSuccess(''), 3000);
      } else {
        setUsernameError(data.message || 'Failed to update username');
      }
    } catch (e) {
      setUsernameError('Failed to update username');
    } finally {
      setUsernameLoading(false);
    }
  };

  const handleSaveName = async () => {
    const trimmed = displayName.trim();
    if (!trimmed) {
      setNameError('Name cannot be empty');
      return;
    }
    if (trimmed.length > 100) {
      setNameError('Name must be 100 characters or less');
      return;
    }
    setNameLoading(true);
    setNameError('');
    setNameSuccess('');
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNameSuccess('Name updated!');
        onUserUpdate?.({ name: trimmed });
        if (typeof window !== 'undefined') {
          try {
            const stored = localStorage.getItem('user');
            if (stored) {
              const parsed = JSON.parse(stored);
              localStorage.setItem('user', JSON.stringify({ ...parsed, name: trimmed }));
            }
          } catch (_) {}
        }
        setTimeout(() => setNameSuccess(''), 3000);
      } else {
        setNameError(data.message || 'Failed to update name');
      }
    } catch (e) {
      setNameError('Failed to update name');
    } finally {
      setNameLoading(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long');
      return;
    }

    setPasswordLoading(true);
    setPasswordError('');
    setPasswordSuccess('');

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/users/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setPasswordSuccess('Password changed successfully!');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => {
          setShowPasswordModal(false);
          setPasswordSuccess('');
        }, 2000);
      } else {
        setPasswordError(data.message || 'Failed to change password');
      }
    } catch (error) {
      setPasswordError('An error occurred while changing password');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      return;
    }

    setDeleteLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/users/account`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (response.ok) {
        // Show deletion animation
        setShowDeletionAnimation(true);
        setShowDeleteModal(false);
        
        // Wait for animation to complete, then clear data and redirect
        setTimeout(() => {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          onLogout();
          onNavigate('login');
        }, 3000); // 3 second animation
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to delete account');
        setDeleteLoading(false);
      }
    } catch (error) {
      alert('An error occurred while deleting account');
      setDeleteLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #FAF8F5 0%, #F5F3F0 100%)' }}>
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="account" />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* Page Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl text-stone-800 mb-4" style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 400 }}>
            Account Settings
          </h1>
          <p className="text-lg text-stone-600">
            Manage your profile, subscription, and security settings.
          </p>
        </div>

        {/* Settings List */}
        <div className="space-y-6">
          {/* Profile Information */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl font-bold text-stone-800 mb-6">Profile Information</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-stone-200">
                <div>
                  <div className="font-semibold text-stone-800">Email</div>
                  <div className="text-stone-600 flex items-center">
                    {displayUser?.email ? displayUser.email : (displayUser ? 'Email not available' : 'Loading...')}
                    {userStats.emailVerified && (
                      <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-violet-100 text-violet-800">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3 border-b border-stone-200">
                <div className="flex-1">
                  <div className="font-semibold text-stone-800 mb-1">Name</div>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your display name"
                    className="w-full sm:max-w-xs px-4 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all text-stone-800"
                  />
                  {nameError && <p className="text-red-600 text-sm mt-1">{nameError}</p>}
                  {nameSuccess && <p className="text-violet-600 text-sm mt-1">{nameSuccess}</p>}
                </div>
                <button
                  onClick={handleSaveName}
                  disabled={nameLoading || !displayName.trim()}
                  className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 disabled:bg-stone-300 text-white px-5 py-2.5 rounded-full font-medium transition-colors shrink-0"
                >
                  {nameLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3 border-b border-stone-200">
                <div className="flex-1">
                  <div className="font-semibold text-stone-800 mb-1">Username</div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    className="w-full sm:max-w-xs px-4 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all text-stone-800"
                  />
                  {usernameError && <p className="text-red-600 text-sm mt-1">{usernameError}</p>}
                  {usernameSuccess && <p className="text-violet-600 text-sm mt-1">{usernameSuccess}</p>}
                </div>
                <button
                  onClick={handleSaveUsername}
                  disabled={usernameLoading || !username.trim()}
                  className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 disabled:bg-stone-300 text-white px-5 py-2.5 rounded-full font-medium transition-colors shrink-0"
                >
                  {usernameLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <div className="font-semibold text-stone-800">Member Since</div>
                  <div className="text-stone-600">{loading ? 'Loading...' : userStats.memberSince}</div>
                </div>
              </div>
            </div>
          </div>


          {/* Subscription */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl font-bold text-stone-800 mb-6">Subscription</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-stone-200">
                <div>
                  <div className="font-semibold text-stone-800">Current Plan</div>
                  <div className="text-stone-600 flex items-center">
                    <span className="capitalize">{userStats.subscriptionPlan}</span>
                    <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      userStats.subscriptionStatus === 'active'
                        ? 'bg-violet-100 text-violet-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {userStats.subscriptionStatus}
                    </span>
                  </div>
                </div>
                {userStats.subscriptionPlan === 'free' && (
                  <button 
                    onClick={() => onNavigate('pricing')}
                    className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white px-5 py-2.5 rounded-full font-medium transition-colors"
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
                      ? '3 documents, 3 analyses per month, 2 citation searches'
                      : userStats.subscriptionPlan === 'pro'
                      ? 'Unlimited documents, 99 combined/mo (analyses, study packs & citations)'
                      : userStats.subscriptionPlan === 'premium'
                      ? 'Unlimited documents, 999 combined/mo (10× Pro) (Premium)'
                      : 'Basic features included'
                    }
                  </div>
                </div>
              </div>
              
              {/* Plan Details */}
              <div className="mt-4 p-4 bg-stone-50 rounded-xl border border-stone-200">
                <div className="text-sm font-semibold text-stone-800 mb-3">What's included:</div>
                <div className="space-y-2 text-sm text-stone-600">
                  {userStats.subscriptionPlan === 'free' && (
                    <>
                      <div>• 3 documents per month</div>
                      <div>• 3 AI essay analyses per month</div>
                      <div>• 2 citation searches per month</div>
                      <div>• 5,000 Humanizer/Summarizer words</div>
                      <div>• 2 study packs (lesson & flashcards — quiz, crossword & Crater Blast with Pro)</div>
                      <div className="text-stone-400 text-xs">Crossword & Crater Blast unlock with Pro</div>
                    </>
                  )}
                  {userStats.subscriptionPlan === 'pro' && (
                    <>
                      <div>• Unlimited document uploads</div>
                      <div>• 99 combined (analyses, study packs & citations) per month</div>
                      <div>• 99,999 Humanizer/Summarizer words</div>
                      <div>• All Humanizer & Summarizer styles & lengths</div>
                      <div>• PDF & Word export</div>
                    </>
                  )}
                  {userStats.subscriptionPlan === 'premium' && (
                    <>
                      <div>• Everything in Pro — 10× usage</div>
                      <div>• 999 combined (analyses, study packs & citations) per month</div>
                      <div>• 999,999 Humanizer/Summarizer words</div>
                      <div>• Top-tier premium AI model</div>
                      <div>• All quiz types & difficulty levels</div>
                      <div>• Advanced essay analysis</div>
                      <div>• Priority support</div>
                      <div>• Larger document uploads (up to 1GB)</div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Focus Mode - Block websites (paid only) */}
          {isPaidUser && (
            <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8">
              <h2 className="text-xl font-bold text-stone-800 mb-2">Focus Mode</h2>
              {FOCUS_MODE_COMING_SOON ? (
                <>
                  <span className="inline-flex items-center px-3 py-1 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 rounded-full text-sm font-semibold mb-4">Coming Soon</span>
                  <p className="text-stone-600 text-sm mb-4">
                    Our Chrome extension is currently under review. Soon you&apos;ll be able to block distracting sites and earn your screen time by studying first. Thanks for your patience.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-stone-600 text-sm mb-6">
                    Block distracting sites until you answer study questions. Customize question count and pass threshold on the Dashboard.
                  </p>
                  {focusModeLoading ? (
                    <p className="text-stone-500">Loading...</p>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {presets.map((p) => {
                          const active = blockedDomains.includes(p.domain);
                          return (
                            <button
                              key={p.domain}
                              onClick={() => toggleBlockedSite(p.domain)}
                              disabled={focusModeSaving}
                              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                                active
                                  ? 'bg-violet-600 text-white'
                                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                              }`}
                            >
                              {p.label}
                            </button>
                          );
                        })}
                      </div>
                      {blockedDomains.length > 0 && (
                        <p className="text-sm text-stone-500">
                          Blocked: {blockedDomains.join(', ')}
                        </p>
                      )}
                      <a
                        href={FOCUS_MODE_CHROME_EXTENSION_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 mt-4 text-violet-600 hover:text-violet-700 font-medium text-sm"
                      >
                        Get Chrome Extension →
                      </a>
                      <button
                        onClick={() => onNavigate('focus-mode')}
                        className="block mt-2 text-violet-600 hover:text-violet-700 font-medium text-sm"
                      >
                        Configure quiz rules on Dashboard →
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* Security */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl font-bold text-stone-800 mb-6">Security</h2>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-3">
              <div>
                <div className="font-semibold text-stone-800">Password</div>
                <div className="text-stone-500 text-sm">Last changed: Recently</div>
              </div>
              <button 
                onClick={() => setShowPasswordModal(true)}
                className="bg-stone-800 hover:bg-stone-700 text-white px-5 py-2.5 rounded-full font-medium transition-colors"
              >
                Change Password
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl font-bold text-red-900 mb-6">Danger Zone</h2>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-3">
              <div>
                <div className="font-semibold text-red-900">Delete Account</div>
                <div className="text-red-600 text-sm">Permanently delete your account and all data</div>
              </div>
              <button 
                onClick={() => setShowDeleteModal(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-stone-800 mb-6">Change Password</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all"
                  placeholder="Enter current password"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all"
                  placeholder="Enter new password"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all"
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            {passwordError && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="mt-4 p-4 bg-violet-50 border border-violet-200 text-violet-700 rounded-xl text-sm">
                {passwordSuccess}
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  setPasswordError('');
                  setPasswordSuccess('');
                }}
                className="px-5 py-2.5 text-stone-600 hover:text-stone-800 font-medium rounded-full hover:bg-stone-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordChange}
                disabled={passwordLoading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 disabled:bg-stone-300 text-white px-5 py-2.5 rounded-full font-medium transition-colors"
              >
                {passwordLoading ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl">
            <div className="text-center mb-6">
              <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-2xl bg-red-100 mb-4">
                <svg className="h-7 w-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-stone-800 mb-2">Delete Account</h3>
              <p className="text-stone-600 text-sm">
                This action is <strong>permanent and irreversible</strong>. You will lose:
              </p>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <ul className="text-sm text-red-800 space-y-2">
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  All your documents and analysis history
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  Your subscription and billing information
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  All account data and preferences
                </li>
              </ul>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-stone-700 mb-2">
                To confirm, type <strong>DELETE</strong> in the box below:
              </label>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                placeholder="Type DELETE to confirm"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation('');
                }}
                className="px-5 py-2.5 text-stone-600 hover:text-stone-800 font-medium rounded-full hover:bg-stone-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading || deleteConfirmation !== 'DELETE'}
                className="bg-red-600 hover:bg-red-700 disabled:bg-stone-300 text-white px-5 py-2.5 rounded-full font-medium transition-colors"
              >
                {deleteLoading ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Deletion Animation */}
      {showDeletionAnimation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center animate-pulse">
            <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-red-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-stone-800 mb-4">Account Deletion in Progress</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-center space-x-2 text-stone-600">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce"></div>
                <span>Removing your data...</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-stone-600">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <span>Clearing documents...</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-stone-600">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                <span>Finalizing deletion...</span>
              </div>
            </div>
            <div className="mt-6">
              <div className="w-full bg-stone-200 rounded-full h-2">
                <div className="bg-red-600 h-2 rounded-full animate-pulse" style={{width: '100%'}}></div>
              </div>
              <p className="text-sm text-stone-500 mt-2">Your account will be permanently deleted</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountPage;
