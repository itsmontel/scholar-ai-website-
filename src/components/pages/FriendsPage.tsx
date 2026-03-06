import { useState, useEffect } from 'react';
import Header from '../common/Header';
import Footer from '../common/Footer';

interface FriendsPageProps {
  onNavigate: (page: string) => void;
  user: any;
  onLogout: () => void;
}

interface Friend {
  id: string;
  username?: string;
  first_name: string;
  last_name: string;
  email: string;
  friend_code: string;
  friendshipId: string;
  since: string;
}

interface FriendRequest {
  id: string;
  sender?: {
    id: string;
    username?: string;
    first_name: string;
    last_name: string;
    email: string;
    friend_code: string;
  };
  recipient?: {
    id: string;
    username?: string;
    first_name: string;
    last_name: string;
    email: string;
    friend_code: string;
  };
  createdAt: string;
}

interface ShareRequest {
  id: string;
  message: string | null;
  status: string;
  created_at: string;
  sender?: {
    id: string;
    username?: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  receiver?: {
    id: string;
    username?: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  quiz: {
    id: string;
    title: string;
    quiz_type: string;
    difficulty: string;
    question_count: number;
  };
}

interface BlockedUser {
  id: string;
  blockedAt: string;
  user: {
    id: string;
    username?: string;
    first_name: string;
    last_name: string;
    email: string;
    friend_code: string;
  };
}

type TabType = 'friends' | 'requests' | 'shares' | 'blocked';

const FriendsPage = ({ onNavigate, user, onLogout }: FriendsPageProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const [friendCode, setFriendCode] = useState<string>('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [incomingShares, setIncomingShares] = useState<ShareRequest[]>([]);
  const [sentShares, setSentShares] = useState<ShareRequest[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  
  const [addFriendCode, setAddFriendCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  useEffect(() => {
    fetchAllData();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchFriendCode(),
        fetchFriends(),
        fetchPendingRequests(),
        fetchSentRequests(),
        fetchIncomingShares(),
        fetchSentShares(),
        fetchBlockedUsers()
      ]);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFriendCode = async () => {
    try {
      const response = await fetch(`${API_URL}/friends/my-code`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (data.success) {
        setFriendCode(data.data.friendCode);
      }
    } catch (err) {
      console.error('Error fetching friend code:', err);
    }
  };

  const fetchFriends = async () => {
    try {
      const response = await fetch(`${API_URL}/friends`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (data.success) {
        setFriends(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching friends:', err);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const response = await fetch(`${API_URL}/friends/requests/pending`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (data.success) {
        setPendingRequests(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching pending requests:', err);
    }
  };

  const fetchSentRequests = async () => {
    try {
      const response = await fetch(`${API_URL}/friends/requests/sent`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (data.success) {
        setSentRequests(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching sent requests:', err);
    }
  };

  const fetchIncomingShares = async () => {
    try {
      const response = await fetch(`${API_URL}/friends/share-requests/incoming`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (data.success) {
        setIncomingShares(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching incoming shares:', err);
    }
  };

  const fetchSentShares = async () => {
    try {
      const response = await fetch(`${API_URL}/friends/share-requests/sent`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (data.success) {
        setSentShares(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching sent shares:', err);
    }
  };

  const fetchBlockedUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/friends/blocked`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (data.success) {
        setBlockedUsers(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching blocked users:', err);
    }
  };

  const copyFriendCode = async () => {
    try {
      await navigator.clipboard.writeText(friendCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFriendCode.trim()) return;

    setIsAdding(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${API_URL}/friends/add`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ friendCode: addFriendCode.trim().toUpperCase() })
      });
      const data = await response.json();

      if (data.success) {
        setSuccess(data.message);
        setAddFriendCode('');
        fetchFriends();
        fetchSentRequests();
        fetchPendingRequests();
      } else {
        setError(data.message || 'Failed to add friend');
      }
    } catch (err) {
      setError('Failed to send friend request');
    } finally {
      setIsAdding(false);
    }
  };

  const handleAcceptFriendRequest = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      const response = await fetch(`${API_URL}/friends/requests/${requestId}/accept`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await response.json();

      if (data.success) {
        setSuccess('Friend request accepted!');
        fetchFriends();
        fetchPendingRequests();
      } else {
        setError(data.message || 'Failed to accept request');
      }
    } catch (err) {
      setError('Failed to accept request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeclineFriendRequest = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      const response = await fetch(`${API_URL}/friends/requests/${requestId}/decline`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await response.json();

      if (data.success) {
        fetchPendingRequests();
      } else {
        setError(data.message || 'Failed to decline request');
      }
    } catch (err) {
      setError('Failed to decline request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!confirm('Are you sure you want to remove this friend?')) return;
    
    setActionLoading(friendId);
    try {
      const response = await fetch(`${API_URL}/friends/${friendId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const data = await response.json();

      if (data.success) {
        setSuccess('Friend removed');
        fetchFriends();
      } else {
        setError(data.message || 'Failed to remove friend');
      }
    } catch (err) {
      setError('Failed to remove friend');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBlockUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to block ${userName}? This will remove them as a friend and they won't be able to add you back until you unblock them.`)) return;
    
    setActionLoading(userId);
    try {
      const response = await fetch(`${API_URL}/friends/block/${userId}`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await response.json();

      if (data.success) {
        setSuccess('User blocked');
        fetchFriends();
        fetchPendingRequests();
        fetchBlockedUsers();
      } else {
        setError(data.message || 'Failed to block user');
      }
    } catch (err) {
      setError('Failed to block user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnblockUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      const response = await fetch(`${API_URL}/friends/unblock/${userId}`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await response.json();

      if (data.success) {
        setSuccess('User unblocked');
        fetchBlockedUsers();
      } else {
        setError(data.message || 'Failed to unblock user');
      }
    } catch (err) {
      setError('Failed to unblock user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAcceptShare = async (shareId: string) => {
    setActionLoading(shareId);
    try {
      const response = await fetch(`${API_URL}/friends/share-requests/${shareId}/accept`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await response.json();

      if (data.success) {
        setSuccess('Content added to your library!');
        fetchIncomingShares();
      } else {
        setError(data.message || 'Failed to accept share');
      }
    } catch (err) {
      setError('Failed to accept share');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeclineShare = async (shareId: string) => {
    setActionLoading(shareId);
    try {
      const response = await fetch(`${API_URL}/friends/share-requests/${shareId}/decline`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await response.json();

      if (data.success) {
        fetchIncomingShares();
      } else {
        setError(data.message || 'Failed to decline share');
      }
    } catch (err) {
      setError('Failed to decline share');
    } finally {
      setActionLoading(null);
    }
  };

  const getItemTypeIcon = (type: string) => {
    switch (type) {
      case 'flashcards': return '🃏';
      case 'crossword': return '🧩';
      case 'crater_blast': return '💥';
      default: return '📝';
    }
  };

  const getItemTypeName = (type: string) => {
    switch (type) {
      case 'flashcards': return 'Flashcards';
      case 'crossword': return 'Crossword';
      case 'crater_blast': return 'Crater Blast';
      default: return 'Quiz';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getName = (person: { username?: string; first_name?: string; last_name?: string; email?: string } | undefined) => {
    if (!person) return 'Unknown';
    if (person.username) return `@${person.username}`;
    const name = `${person.first_name || ''} ${person.last_name || ''}`.trim();
    return name || 'Unknown';
  };

  const pendingCount = pendingRequests.length + incomingShares.length;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #FAF8F5 0%, #F5F3F0 100%)' }}>
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="friends" />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center px-4 py-2 bg-purple-50/80 text-purple-700 rounded-full text-sm font-medium mb-6 border border-purple-200/50">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Friends
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Share & Collaborate
          </h1>
          <p className="text-gray-600 max-w-xl mx-auto">
            Connect with friends to share quizzes, flashcards, and crosswords
          </p>
        </div>

        {/* Friend Code Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Your Friend Code</h3>
              <p className="text-sm text-gray-500">Share this code with friends so they can add you</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-gray-50 rounded-xl px-6 py-3 border-2 border-dashed border-gray-200">
                <span className="font-mono text-2xl font-bold text-purple-600 tracking-wider">
                  {friendCode || '--------'}
                </span>
              </div>
              <button
                onClick={copyFriendCode}
                className="p-3 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-xl transition-colors"
                title="Copy to clipboard"
              >
                {copied ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Add Friend Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add a Friend</h3>
          <form onSubmit={handleAddFriend} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={addFriendCode}
              onChange={(e) => setAddFriendCode(e.target.value.toUpperCase())}
              placeholder="Enter friend code (e.g. ABC12345)"
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-lg tracking-wider uppercase"
              maxLength={12}
            />
            <button
              type="submit"
              disabled={isAdding || !addFriendCode.trim()}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {isAdding ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Adding...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Add Friend
                </>
              )}
            </button>
          </form>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{success}</span>
            <button onClick={() => setSuccess(null)} className="ml-auto text-green-500 hover:text-green-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-100 overflow-x-auto scrollbar-hide [-webkit-overflow-scrolling:touch]">
            <button
              onClick={() => setActiveTab('friends')}
              className={`flex-shrink-0 flex-1 min-w-[72px] px-3 sm:px-4 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'friends'
                  ? 'text-purple-700 bg-purple-50 border-b-2 border-purple-600'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                Friends ({friends.length})
              </span>
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex-shrink-0 flex-1 min-w-[72px] px-3 sm:px-4 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'requests'
                  ? 'text-purple-700 bg-purple-50 border-b-2 border-purple-600'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Requests
                {pendingRequests.length > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {pendingRequests.length}
                  </span>
                )}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('shares')}
              className={`flex-shrink-0 flex-1 min-w-[72px] px-3 sm:px-4 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'shares'
                  ? 'text-purple-700 bg-purple-50 border-b-2 border-purple-600'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
                Shared
                {incomingShares.length > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {incomingShares.length}
                  </span>
                )}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('blocked')}
              className={`flex-shrink-0 flex-1 min-w-[72px] px-3 sm:px-4 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'blocked'
                  ? 'text-purple-700 bg-purple-50 border-b-2 border-purple-600'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                Blocked
                {blockedUsers.length > 0 && (
                  <span className="bg-gray-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {blockedUsers.length}
                  </span>
                )}
              </span>
            </button>
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <svg className="animate-spin h-8 w-8 text-purple-600" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            ) : (
              <>
                {/* Friends Tab */}
                {activeTab === 'friends' && (
                  <div className="space-y-4">
                    {friends.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No friends yet</h3>
                        <p className="text-gray-500">Add friends using their friend code to start sharing!</p>
                      </div>
                    ) : (
                      friends.map((friend) => (
                        <div key={friend.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                              <span className="text-purple-600 font-semibold text-lg">
                                {(friend.first_name?.[0] || friend.email?.[0] || '?').toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{getName(friend)}</h4>
                              <p className="text-sm text-gray-500">
                                Friends since {formatDate(friend.since)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleRemoveFriend(friend.id)}
                              disabled={actionLoading === friend.id}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remove friend"
                            >
                              {actionLoading === friend.id ? (
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                              ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              )}
                            </button>
                            <button
                              onClick={() => handleBlockUser(friend.id, getName(friend))}
                              disabled={actionLoading === friend.id}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Block user"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Requests Tab */}
                {activeTab === 'requests' && (
                  <div className="space-y-6">
                    {/* Incoming Requests */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
                        Incoming Requests ({pendingRequests.length})
                      </h4>
                      {pendingRequests.length === 0 ? (
                        <p className="text-gray-500 text-sm py-4">No pending friend requests</p>
                      ) : (
                        <div className="space-y-3">
                          {pendingRequests.map((request) => (
                            <div key={request.id} className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-200 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-purple-700 font-semibold text-base sm:text-lg">
                                    {(request.sender?.username?.[0] || request.sender?.first_name?.[0] || '?').toUpperCase()}
                                  </span>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h4 className="font-medium text-gray-900 truncate">{getName(request.sender)}</h4>
                                  <p className="text-sm text-gray-500">Wants to be your friend</p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleAcceptFriendRequest(request.id)}
                                  disabled={actionLoading === request.id}
                                  className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() => handleDeclineFriendRequest(request.id)}
                                  disabled={actionLoading === request.id}
                                  className="flex-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                                >
                                  Decline
                                </button>
                                <button
                                  onClick={() => request.sender && handleBlockUser(request.sender.id, getName(request.sender))}
                                  disabled={actionLoading === request.id}
                                  className="px-3 py-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                  title="Block user"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Sent Requests */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
                        Sent Requests ({sentRequests.length})
                      </h4>
                      {sentRequests.length === 0 ? (
                        <p className="text-gray-500 text-sm py-4">No sent friend requests</p>
                      ) : (
                        <div className="space-y-3">
                          {sentRequests.map((request) => (
                            <div key={request.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                                  <span className="text-gray-600 font-semibold text-lg">
                                    {(request.recipient?.first_name?.[0] || request.recipient?.email?.[0] || '?').toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-900">{getName(request.recipient)}</h4>
                                  <p className="text-sm text-gray-500">Pending • Sent {formatDate(request.createdAt)}</p>
                                </div>
                              </div>
                              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                                Pending
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Shares Tab */}
                {activeTab === 'shares' && (
                  <div className="space-y-6">
                    {/* Incoming Shares */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
                        Incoming Shares ({incomingShares.length})
                      </h4>
                      {incomingShares.length === 0 ? (
                        <p className="text-gray-500 text-sm py-4">No pending shared content</p>
                      ) : (
                        <div className="space-y-3">
                          {incomingShares.map((share) => (
                            <div key={share.id} className="p-4 bg-green-50 rounded-xl border border-green-100">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <span className="text-2xl">{getItemTypeIcon(share.quiz?.quiz_type)}</span>
                                  <div>
                                    <h4 className="font-medium text-gray-900">{share.quiz?.title || 'Unknown'}</h4>
                                    <p className="text-sm text-gray-500">
                                      {getItemTypeName(share.quiz?.quiz_type)} • {share.quiz?.question_count} items
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <p className="text-sm text-gray-600">
                                  From <span className="font-medium">{getName(share.sender)}</span>
                                  {share.message && (
                                    <span className="ml-2 text-gray-500">"{share.message}"</span>
                                  )}
                                </p>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleAcceptShare(share.id)}
                                    disabled={actionLoading === share.id}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => handleDeclineShare(share.id)}
                                    disabled={actionLoading === share.id}
                                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                                  >
                                    Decline
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Sent Shares */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
                        Sent Shares ({sentShares.length})
                      </h4>
                      {sentShares.length === 0 ? (
                        <p className="text-gray-500 text-sm py-4">You haven't shared anything yet</p>
                      ) : (
                        <div className="space-y-3">
                          {sentShares.map((share) => (
                            <div key={share.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">{getItemTypeIcon(share.quiz?.quiz_type)}</span>
                                <div>
                                  <h4 className="font-medium text-gray-900">{share.quiz?.title || 'Unknown'}</h4>
                                  <p className="text-sm text-gray-500">
                                    Sent to {getName(share.receiver)} • {formatDate(share.created_at)}
                                  </p>
                                </div>
                              </div>
                              <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                                share.status === 'accepted' 
                                  ? 'bg-green-100 text-green-700'
                                  : share.status === 'declined'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {share.status.charAt(0).toUpperCase() + share.status.slice(1)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Blocked Tab */}
                {activeTab === 'blocked' && (
                  <div className="space-y-4">
                    {blockedUsers.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No blocked users</h3>
                        <p className="text-gray-500">Users you block won't be able to send you friend requests</p>
                      </div>
                    ) : (
                      blockedUsers.map((blocked) => (
                        <div key={blocked.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                              <span className="text-gray-500 font-semibold text-lg">
                                {(blocked.user?.first_name?.[0] || blocked.user?.email?.[0] || '?').toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{getName(blocked.user)}</h4>
                              <p className="text-sm text-gray-500">
                                Blocked on {formatDate(blocked.blockedAt)}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleUnblockUser(blocked.user.id)}
                            disabled={actionLoading === blocked.user.id}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                          >
                            {actionLoading === blocked.user.id ? (
                              <span className="flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Unblocking...
                              </span>
                            ) : (
                              'Unblock'
                            )}
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default FriendsPage;
