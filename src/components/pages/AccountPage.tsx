import { useState, useEffect } from 'react';
import Header from '../common/Header';
import { WriteScholarEditorialBackgroundLayers } from '../common/WriteScholarEditorialBackground';
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

  // Cancellation retention flow — multi-step modal that offers pause
  // then a discount before letting the user finally confirm cancel.
  //   'pause'    → step 1: "Need a break? Pause for 30 days?"
  //   'discount' → step 2: "Stay for 50% off next month?"
  //   'confirm'  → step 3: final "Are you sure?" before cancel
  //   'success'  → terminal: shows what we did (paused / discounted / cancelled)
  //   null       → modal closed
  type RetentionStep = 'pause' | 'discount' | 'confirm' | 'success' | null;
  const [retentionStep, setRetentionStep] = useState<RetentionStep>(null);
  const [retentionBusy, setRetentionBusy] = useState(false);
  const [retentionError, setRetentionError] = useState<string | null>(null);
  const [retentionSuccessMsg, setRetentionSuccessMsg] = useState<string | null>(null);

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
  /* ─── Cancellation retention flow ─── */
  const openRetentionFlow = () => {
    setRetentionError(null);
    setRetentionSuccessMsg(null);
    setRetentionStep('pause');
  };
  const closeRetentionFlow = () => {
    if (retentionBusy) return;
    setRetentionStep(null);
    setRetentionError(null);
    setRetentionSuccessMsg(null);
  };
  const acceptPause = async () => {
    setRetentionBusy(true);
    setRetentionError(null);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/subscriptions/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ days: 30 }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error((data && typeof data.message === 'string' && data.message) || 'Could not pause subscription');
      }
      setRetentionSuccessMsg("You're paused for 30 days. We'll see you when you're back.");
      setRetentionStep('success');
      // Refresh the page-level subscription status so the UI reflects the change.
      fetchUserData();
    } catch (e) {
      setRetentionError(e instanceof Error ? e.message : 'Could not pause subscription');
    } finally {
      setRetentionBusy(false);
    }
  };
  const acceptDiscount = async () => {
    setRetentionBusy(true);
    setRetentionError(null);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/subscriptions/apply-retention-discount`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error((data && typeof data.message === 'string' && data.message) || 'Could not apply discount');
      }
      setRetentionSuccessMsg("50% off applied to your next invoice. Enjoy the half-price month on us.");
      setRetentionStep('success');
      fetchUserData();
    } catch (e) {
      setRetentionError(e instanceof Error ? e.message : 'Could not apply discount');
    } finally {
      setRetentionBusy(false);
    }
  };
  const confirmFinalCancel = async () => {
    setRetentionBusy(true);
    setRetentionError(null);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/subscriptions/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error((data && typeof data.message === 'string' && data.message) || 'Could not cancel subscription');
      }
      setRetentionSuccessMsg("Subscription cancelled. You'll keep Pro access until the end of your current billing period.");
      setRetentionStep('success');
      fetchUserData();
    } catch (e) {
      setRetentionError(e instanceof Error ? e.message : 'Could not cancel subscription');
    } finally {
      setRetentionBusy(false);
    }
  };

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
          window.dispatchEvent(new CustomEvent('writescholar-auth-changed'));
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
    <div className="relative min-h-screen overflow-x-clip">
      <WriteScholarEditorialBackgroundLayers position="fixed" />
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="account" />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14 relative z-10" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
        {/* Page Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-800 dark:text-stone-100 mb-4">
            Account Settings
          </h1>
          <p className="text-lg font-bold text-stone-600 dark:text-stone-400">
            Manage your profile, subscription, and security settings.
          </p>
        </div>

        {/* Settings List */}
        <div className="space-y-6">
          {/* Profile Information */}
          <div className="bg-white dark:bg-stone-900 border-2 border-b-4 border-stone-200 dark:border-stone-700 rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl font-extrabold text-stone-800 dark:text-stone-100 mb-6">Profile Information</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b-2 border-stone-200 dark:border-stone-600">
                <div>
                  <div className="font-extrabold text-stone-800 dark:text-stone-100">Email</div>
                  <div className="text-stone-600 dark:text-stone-400 flex items-center">
                    {displayUser?.email ? displayUser.email : (displayUser ? 'Email not available' : 'Loading...')}
                    {userStats.emailVerified && (
                      <span className="ml-2 inline-flex items-center px-2 py-1 rounded-xl text-xs font-extrabold bg-[#EAFFD6] text-[#58CC02] border border-[#58CC02]/30">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3 border-b-2 border-stone-200 dark:border-stone-600">
                <div className="flex-1">
                  <div className="font-extrabold text-stone-800 dark:text-stone-100 mb-1">Name</div>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your display name"
                    className="w-full sm:max-w-xs px-4 py-2.5 border-2 border-stone-200 dark:border-stone-600 rounded-xl focus:border-[#1CB0F6] transition-all text-stone-800 dark:text-stone-100 bg-white dark:bg-stone-700/50 outline-none"
                  />
                  {nameError && <p className="text-red-600 text-sm mt-1">{nameError}</p>}
                  {nameSuccess && <p className="text-[#58CC02] text-sm mt-1">{nameSuccess}</p>}
                </div>
                <button
                  onClick={handleSaveName}
                  disabled={nameLoading || !displayName.trim()}
                  className="bg-[#1CB0F6] text-white font-extrabold uppercase tracking-wide rounded-xl border-2 border-b-4 border-[#1899D6] active:border-b-2 active:translate-y-0.5 transition-all disabled:bg-stone-300 dark:disabled:bg-stone-600 px-5 py-2.5 shrink-0"
                >
                  {nameLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3 border-b-2 border-stone-200 dark:border-stone-600">
                <div className="flex-1">
                  <div className="font-extrabold text-stone-800 dark:text-stone-100 mb-1">Username</div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    className="w-full sm:max-w-xs px-4 py-2.5 border-2 border-stone-200 dark:border-stone-600 rounded-xl focus:border-[#1CB0F6] transition-all text-stone-800 dark:text-stone-100 bg-white dark:bg-stone-700/50 outline-none"
                  />
                  {usernameError && <p className="text-red-600 text-sm mt-1">{usernameError}</p>}
                  {usernameSuccess && <p className="text-[#58CC02] text-sm mt-1">{usernameSuccess}</p>}
                </div>
                <button
                  onClick={handleSaveUsername}
                  disabled={usernameLoading || !username.trim()}
                  className="bg-[#1CB0F6] text-white font-extrabold uppercase tracking-wide rounded-xl border-2 border-b-4 border-[#1899D6] active:border-b-2 active:translate-y-0.5 transition-all disabled:bg-stone-300 dark:disabled:bg-stone-600 px-5 py-2.5 shrink-0"
                >
                  {usernameLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <div className="font-extrabold text-stone-800 dark:text-stone-100">Member Since</div>
                  <div className="text-stone-600 dark:text-stone-400">{loading ? 'Loading...' : userStats.memberSince}</div>
                </div>
              </div>
            </div>
          </div>


          {/* Subscription */}
          <div className="bg-white dark:bg-stone-900 border-2 border-b-4 border-stone-200 dark:border-stone-700 rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl font-extrabold text-stone-800 dark:text-stone-100 mb-6">Subscription</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b-2 border-stone-200 dark:border-stone-600">
                <div>
                  <div className="font-extrabold text-stone-800 dark:text-stone-100">Current Plan</div>
                  <div className="text-stone-600 dark:text-stone-400 flex items-center">
                    <span className="capitalize">{userStats.subscriptionPlan}</span>
                    <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-xl text-xs font-extrabold ${
                      userStats.subscriptionStatus === 'active'
                        ? 'bg-[#EAFFD6] text-[#58CC02] border border-[#58CC02]/30'
                        : 'bg-[#FFF4E0] text-[#FF9600] border border-[#FF9600]/30'
                    }`}>
                      {userStats.subscriptionStatus}
                    </span>
                  </div>
                </div>
                {userStats.subscriptionPlan === 'free' && (
                  <button
                    onClick={() => onNavigate('pricing')}
                    className="bg-[#58CC02] text-white font-extrabold uppercase tracking-wide rounded-xl border-2 border-b-4 border-[#46A302] active:border-b-2 active:translate-y-0.5 transition-all px-5 py-2.5"
                  >
                    Upgrade
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <div className="font-extrabold text-stone-800 dark:text-stone-100">Plan Features</div>
                  <div className="text-stone-600 dark:text-stone-400">
                    {userStats.subscriptionPlan === 'free'
                      ? '3 documents, 2 analyses per month, 2 citation searches'
                      : userStats.subscriptionPlan === 'pro'
                      ? '99 combined/mo (analyses, study packs & citations)'
                      : userStats.subscriptionPlan === 'premium'
                      ? '499 combined/mo; 1GB library storage'
                      : 'Basic features included'
                    }
                  </div>
                </div>
              </div>
              
              {/* Plan Details */}
              <div className="mt-4 p-4 bg-[#DDF4FF] dark:bg-[#1CB0F6]/10 border-2 border-[#1CB0F6]/30 rounded-xl">
                <div className="text-sm font-extrabold text-stone-800 dark:text-stone-100 mb-3">What's included:</div>
                <div className="space-y-2 text-sm text-stone-600 dark:text-stone-400">
                  {userStats.subscriptionPlan === 'free' && (
                    <>
                      <div>• 3 documents per month</div>
                      <div>• 2 AI essay analyses per month</div>
                      <div>• 2 citation searches per month</div>
                      <div>• 5,000 Paper Summarizer words</div>
                      <div>• 2 study packs (lesson & flashcards — quiz, crossword & Crater Blast with Pro)</div>
                      <div>• 2MB document library storage</div>
                      <div className="text-stone-400 text-xs">Crossword & Crater Blast unlock with Pro</div>
                    </>
                  )}
                  {userStats.subscriptionPlan === 'pro' && (
                    <>
                      <div>• 99 combined (analyses, study packs & citations) per month</div>
                      <div>• 100MB total library storage</div>
                      <div>• 999,999 Paper Summarizer words per month</div>
                      <div>• Uploads up to 100MB per file</div>
                      <div>• Long-document summarization</div>
                      <div>• PDF & Word export</div>
                      <div>• All quiz types & difficulty levels</div>
                      <div>• Apply WriteScholar revisions into your draft</div>
                    </>
                  )}
                  {userStats.subscriptionPlan === 'premium' && (
                    <>
                      <div>• Everything in Pro, 5× usage</div>
                      <div>• 499 combined (analyses, study packs & citations) per month</div>
                      <div>• Summarise unlimited research papers</div>
                      <div>• 1GB total library storage</div>
                      <div>• Uploads up to 100MB per file</div>
                      <div>• PDF & Word export</div>
                      <div>• All quiz types & difficulty levels</div>
                    </>
                  )}
                </div>
              </div>

              {/* Discrete cancel link for paid users — opens the
                  retention modal (pause → discount → confirm cancel). */}
              {isPaidUser && (
                <div className="mt-4 text-right">
                  <button
                    type="button"
                    onClick={openRetentionFlow}
                    className="text-xs font-extrabold text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 underline underline-offset-4 decoration-stone-300 dark:decoration-stone-600 hover:decoration-[#FF4B4B] transition-colors"
                  >
                    Cancel subscription
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Focus Mode - Block websites (paid only) */}
          {isPaidUser && (
            <div className="bg-white dark:bg-stone-900 border-2 border-b-4 border-stone-200 dark:border-stone-700 rounded-2xl p-6 sm:p-8">
              <h2 className="text-xl font-extrabold text-stone-800 dark:text-stone-100 mb-2">Focus Mode</h2>
              {FOCUS_MODE_COMING_SOON ? (
                <>
                  <span className="inline-flex items-center px-3 py-1 bg-[#FFF4E0] text-[#FF9600] border-2 border-[#FF9600]/30 rounded-xl text-sm font-extrabold mb-4">Coming Soon</span>
                  <p className="text-stone-600 text-sm mb-4">
                    Our Chrome extension is currently under review. Soon you&apos;ll be able to block distracting sites and earn your screen time by studying first. Thanks for your patience.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-stone-600 text-sm mb-6">
                    Block sites until you solve a puzzle or answer study questions. Customize question count and pass threshold on the Dashboard.
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
                              className={`px-4 py-2 rounded-xl text-sm transition-all ${
                                active
                                  ? 'bg-[#A560E8] text-white font-extrabold border-2 border-b-4 border-[#8A48C7] active:border-b-2 active:translate-y-0.5'
                                  : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold border-2 border-b-4 border-stone-200 dark:border-stone-600'
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
                        className="inline-flex items-center gap-2 mt-4 text-[#1CB0F6] hover:text-[#1899D6] font-extrabold text-sm"
                      >
                        Get Chrome Extension →
                      </a>
                      <button
                        onClick={() => onNavigate('focus-mode')}
                        className="block mt-2 text-[#1CB0F6] hover:text-[#1899D6] font-extrabold text-sm"
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
          <div className="bg-white dark:bg-stone-900 border-2 border-b-4 border-stone-200 dark:border-stone-700 rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl font-extrabold text-stone-800 dark:text-stone-100 mb-6">Security</h2>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-3">
              <div>
                <div className="font-extrabold text-stone-800 dark:text-stone-100">Password</div>
                <div className="text-stone-500 dark:text-stone-400 text-sm font-bold">Last changed: Recently</div>
              </div>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="bg-[#1CB0F6] text-white font-extrabold uppercase tracking-wide rounded-xl border-2 border-b-4 border-[#1899D6] active:border-b-2 active:translate-y-0.5 transition-all px-5 py-2.5"
              >
                Change Password
              </button>
            </div>
          </div>

          {/* Preview / developer */}
          <div className="bg-[#F3EAFF] dark:bg-[#A560E8]/10 border-2 border-b-4 border-[#A560E8]/30 rounded-2xl p-6 sm:p-8 mb-6">
            <h2 className="text-xl text-[#7733B5] dark:text-[#C9A0F0] font-extrabold mb-2">Preview onboarding flow</h2>
            <p className="text-sm font-bold text-stone-600 dark:text-stone-300 mb-4 leading-snug">
              Walk through the 7-step onboarding and the post-tutorial paywall without touching your real account. Nothing is saved.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('onboarding-test')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#A560E8] hover:bg-[#8A48C7] text-white text-sm font-extrabold uppercase tracking-wide border-2 border-b-4 border-[#7733B5] active:border-b-2 active:translate-y-0.5 transition-all"
            >
              Open onboarding (test)
            </button>
          </div>

          {/* Danger Zone */}
          <div className="bg-[#FFE8E8] dark:bg-[#FF4B4B]/10 border-2 border-b-4 border-[#FF4B4B]/30 rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl text-[#FF4B4B] font-extrabold mb-6">Danger Zone</h2>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-3">
              <div>
                <div className="font-extrabold text-[#FF4B4B]">Delete Account</div>
                <div className="text-[#FF4B4B]/70 text-sm font-bold">Permanently delete your account and all data</div>
              </div>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="bg-[#FF4B4B] text-white font-extrabold uppercase tracking-wide rounded-xl border-2 border-b-4 border-[#E04343] active:border-b-2 active:translate-y-0.5 transition-all px-5 py-2.5"
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
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full border-2 border-b-4 border-stone-200 dark:border-stone-700" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
            <h3 className="text-xl font-extrabold text-stone-800 mb-6">Change Password</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-extrabold text-stone-700 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-stone-200 dark:border-stone-600 rounded-xl focus:border-[#1CB0F6] transition-all bg-white dark:bg-stone-700/50 text-stone-800 dark:text-stone-100 outline-none"
                  placeholder="Enter current password"
                />
              </div>
              
              <div>
                <label className="block text-sm font-extrabold text-stone-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-stone-200 dark:border-stone-600 rounded-xl focus:border-[#1CB0F6] transition-all bg-white dark:bg-stone-700/50 text-stone-800 dark:text-stone-100 outline-none"
                  placeholder="Enter new password"
                />
              </div>
              
              <div>
                <label className="block text-sm font-extrabold text-stone-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-stone-200 dark:border-stone-600 rounded-xl focus:border-[#1CB0F6] transition-all bg-white dark:bg-stone-700/50 text-stone-800 dark:text-stone-100 outline-none"
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            {passwordError && (
              <div className="mt-4 p-4 bg-[#FFE8E8] border-2 border-[#FF4B4B]/30 text-[#FF4B4B] rounded-xl text-sm font-bold">
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="mt-4 p-4 bg-[#EAFFD6] border-2 border-[#58CC02]/30 text-[#58CC02] rounded-xl text-sm font-bold">
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
                className="bg-white text-stone-600 border-2 border-b-4 border-stone-200 active:border-b-2 active:translate-y-0.5 rounded-xl font-extrabold transition-all px-5 py-2.5"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordChange}
                disabled={passwordLoading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                className="bg-[#1CB0F6] text-white font-extrabold uppercase tracking-wide rounded-xl border-2 border-b-4 border-[#1899D6] active:border-b-2 active:translate-y-0.5 transition-all disabled:bg-stone-300 dark:disabled:bg-stone-600 px-5 py-2.5"
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
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-lg w-full border-2 border-b-4 border-stone-200 dark:border-stone-700" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
            <div className="text-center mb-6">
              <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-2xl bg-[#FFE8E8] border-2 border-[#FF4B4B]/30 mb-4">
                <svg className="h-7 w-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-extrabold text-stone-800 mb-2">Delete Account</h3>
              <p className="text-stone-600 text-sm">
                This action is <strong>permanent and irreversible</strong>. You will lose:
              </p>
            </div>
            
            <div className="bg-[#FFE8E8] border-2 border-[#FF4B4B]/30 rounded-xl p-4 mb-6">
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
              <label className="block text-sm font-extrabold text-stone-700 mb-2">
                To confirm, type <strong>DELETE</strong> in the box below:
              </label>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                className="w-full px-4 py-3 border-2 border-stone-200 rounded-xl focus:border-[#FF4B4B] transition-all outline-none"
                placeholder="Type DELETE to confirm"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation('');
                }}
                className="bg-white text-stone-600 border-2 border-b-4 border-stone-200 active:border-b-2 active:translate-y-0.5 rounded-xl font-extrabold transition-all px-5 py-2.5"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading || deleteConfirmation !== 'DELETE'}
                className="bg-[#FF4B4B] text-white font-extrabold uppercase tracking-wide rounded-xl border-2 border-b-4 border-[#E04343] active:border-b-2 active:translate-y-0.5 transition-all disabled:bg-stone-300 px-5 py-2.5"
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

      {/* ─── Cancellation retention modal ───
          Three-step recovery flow before the actual cancel: pause →
          discount → confirm. Each step has Accept / Decline buttons;
          declining advances to the next step, accepting performs the
          action and ends in a success state. */}
      {retentionStep && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="retention-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-6 py-6 bg-black/55 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) closeRetentionFlow(); }}
        >
          <div className="relative w-full max-w-md rounded-3xl border-2 border-b-4 border-[#A560E8]/45 bg-white dark:bg-stone-900 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.4)] overflow-hidden">
            {/* Soft brand glows */}
            <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-[#A560E8]/18 blur-3xl" aria-hidden />
            <div className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-[#FFC800]/18 blur-3xl" aria-hidden />

            <div className="relative px-6 sm:px-7 pt-7 pb-6">
              {/* Step indicator dots — only on the 3 retention steps */}
              {retentionStep !== 'success' && (
                <div className="flex items-center justify-center gap-1.5 mb-4" aria-hidden>
                  {(['pause', 'discount', 'confirm'] as const).map((s) => (
                    <span
                      key={s}
                      className={`h-1.5 rounded-full transition-all ${
                        s === retentionStep ? 'w-6 bg-[#A560E8]' : 'w-1.5 bg-stone-300 dark:bg-stone-700'
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* ─── Step 1: Pause for 30 days ─── */}
              {retentionStep === 'pause' && (
                <div className="text-center">
                  <div className="text-5xl mb-3" aria-hidden>⏸️</div>
                  <h2 id="retention-modal-title" className="text-[1.45rem] sm:text-[1.6rem] font-extrabold leading-tight tracking-tight text-[#3C3C3C] dark:text-stone-50" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
                    Need a break?
                  </h2>
                  <p className="mt-2 text-[13.5px] sm:text-sm font-bold text-stone-600 dark:text-stone-300 leading-relaxed">
                    Pause WriteScholar Pro for <span className="text-[#A560E8]">30 days</span>. No charges during the pause — you keep all your work and pick up right where you left off.
                  </p>
                  {retentionError && (
                    <div className="mt-4 rounded-xl bg-[#FFE8E8] dark:bg-[#FF4B4B]/10 border-2 border-[#FF4B4B]/30 px-3 py-2 text-[12px] text-[#FF4B4B] font-bold">
                      {retentionError}
                    </div>
                  )}
                  <div className="mt-5 space-y-2.5">
                    <button
                      type="button"
                      onClick={acceptPause}
                      disabled={retentionBusy}
                      className="w-full py-3 px-4 rounded-2xl bg-[#58CC02] hover:bg-[#46A302] disabled:opacity-60 disabled:cursor-not-allowed text-white text-[13px] sm:text-sm font-extrabold uppercase tracking-wide border-2 border-b-4 border-[#46A302] active:border-b-2 active:translate-y-0.5 transition-all"
                    >
                      {retentionBusy ? 'Pausing…' : 'Yes, pause for 30 days'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setRetentionError(null); setRetentionStep('discount'); }}
                      disabled={retentionBusy}
                      className="w-full py-3 px-4 rounded-2xl bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 text-[12.5px] font-extrabold uppercase tracking-wide border-2 border-b-4 border-stone-200 dark:border-stone-700 active:border-b-2 active:translate-y-0.5 transition-all"
                    >
                      No thanks
                    </button>
                  </div>
                </div>
              )}

              {/* ─── Step 2: 50% off next month ─── */}
              {retentionStep === 'discount' && (
                <div className="text-center">
                  <div className="text-5xl mb-3" aria-hidden>🎁</div>
                  <h2 id="retention-modal-title" className="text-[1.45rem] sm:text-[1.6rem] font-extrabold leading-tight tracking-tight text-[#3C3C3C] dark:text-stone-50" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
                    Stay for <span className="text-[#A560E8]">50% off</span> next month?
                  </h2>
                  <p className="mt-2 text-[13.5px] sm:text-sm font-bold text-stone-600 dark:text-stone-300 leading-relaxed">
                    We&apos;ll knock 50% off your next invoice. Same Pro, half the price — on us.
                  </p>
                  {retentionError && (
                    <div className="mt-4 rounded-xl bg-[#FFE8E8] dark:bg-[#FF4B4B]/10 border-2 border-[#FF4B4B]/30 px-3 py-2 text-[12px] text-[#FF4B4B] font-bold">
                      {retentionError}
                    </div>
                  )}
                  <div className="mt-5 space-y-2.5">
                    <button
                      type="button"
                      onClick={acceptDiscount}
                      disabled={retentionBusy}
                      className="w-full py-3 px-4 rounded-2xl bg-[#58CC02] hover:bg-[#46A302] disabled:opacity-60 disabled:cursor-not-allowed text-white text-[13px] sm:text-sm font-extrabold uppercase tracking-wide border-2 border-b-4 border-[#46A302] active:border-b-2 active:translate-y-0.5 transition-all"
                    >
                      {retentionBusy ? 'Applying…' : 'Yes, apply 50% off'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setRetentionError(null); setRetentionStep('confirm'); }}
                      disabled={retentionBusy}
                      className="w-full py-3 px-4 rounded-2xl bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 text-[12.5px] font-extrabold uppercase tracking-wide border-2 border-b-4 border-stone-200 dark:border-stone-700 active:border-b-2 active:translate-y-0.5 transition-all"
                    >
                      No thanks
                    </button>
                  </div>
                </div>
              )}

              {/* ─── Step 3: Final confirm ─── */}
              {retentionStep === 'confirm' && (
                <div className="text-center">
                  <div className="text-5xl mb-3" aria-hidden>👋</div>
                  <h2 id="retention-modal-title" className="text-[1.45rem] sm:text-[1.6rem] font-extrabold leading-tight tracking-tight text-[#3C3C3C] dark:text-stone-50" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
                    Cancel subscription?
                  </h2>
                  <p className="mt-2 text-[13.5px] sm:text-sm font-bold text-stone-600 dark:text-stone-300 leading-relaxed">
                    You&apos;ll keep Pro access until the end of your current billing period, then drop back to the free plan. You can resubscribe anytime.
                  </p>
                  {retentionError && (
                    <div className="mt-4 rounded-xl bg-[#FFE8E8] dark:bg-[#FF4B4B]/10 border-2 border-[#FF4B4B]/30 px-3 py-2 text-[12px] text-[#FF4B4B] font-bold">
                      {retentionError}
                    </div>
                  )}
                  <div className="mt-5 space-y-2.5">
                    <button
                      type="button"
                      onClick={closeRetentionFlow}
                      disabled={retentionBusy}
                      className="w-full py-3 px-4 rounded-2xl bg-[#58CC02] hover:bg-[#46A302] disabled:opacity-60 disabled:cursor-not-allowed text-white text-[13px] sm:text-sm font-extrabold uppercase tracking-wide border-2 border-b-4 border-[#46A302] active:border-b-2 active:translate-y-0.5 transition-all"
                    >
                      Keep my plan
                    </button>
                    <button
                      type="button"
                      onClick={confirmFinalCancel}
                      disabled={retentionBusy}
                      className="w-full py-3 px-4 rounded-2xl bg-white dark:bg-stone-900 hover:bg-[#FFE8E8] dark:hover:bg-[#FF4B4B]/10 text-[#FF4B4B] text-[12.5px] font-extrabold uppercase tracking-wide border-2 border-b-4 border-[#FF4B4B]/50 hover:border-[#FF4B4B] disabled:opacity-60 disabled:cursor-not-allowed active:border-b-2 active:translate-y-0.5 transition-all"
                    >
                      {retentionBusy ? 'Cancelling…' : 'Yes, cancel anyway'}
                    </button>
                  </div>
                </div>
              )}

              {/* ─── Success — terminal state ─── */}
              {retentionStep === 'success' && (
                <div className="text-center">
                  <div className="text-5xl mb-3" aria-hidden>✅</div>
                  <h2 id="retention-modal-title" className="text-[1.4rem] sm:text-[1.55rem] font-extrabold leading-tight tracking-tight text-[#3C3C3C] dark:text-stone-50" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
                    All set
                  </h2>
                  <p className="mt-2 text-[13.5px] sm:text-sm font-bold text-stone-600 dark:text-stone-300 leading-relaxed">
                    {retentionSuccessMsg}
                  </p>
                  <button
                    type="button"
                    onClick={closeRetentionFlow}
                    className="mt-5 w-full py-3 px-4 rounded-2xl bg-[#A560E8] hover:bg-[#8A48C7] text-white text-[13px] sm:text-sm font-extrabold uppercase tracking-wide border-2 border-b-4 border-[#7733B5] active:border-b-2 active:translate-y-0.5 transition-all"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountPage;
