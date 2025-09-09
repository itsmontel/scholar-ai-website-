import { useState, useEffect } from 'react';

interface ProfilePageProps {
  onNavigate: (page: string) => void;
  user: any;
  onLogout: () => void;
}

const ProfilePage = ({ onNavigate, user, onLogout }: ProfilePageProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [editMode, setEditMode] = useState(false);

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

  const userData = {
    name: 'Dr. Sarah Chen',
    title: 'PhD Candidate in Environmental Science',
    institution: 'Stanford University',
    email: 'sarah.chen@stanford.edu',
    memberSince: 'March 2024',
    location: 'Palo Alto, CA',
    orcid: '0000-0002-1825-0097',
    researchInterests: ['Climate Change', 'Ecosystem Dynamics', 'Environmental Policy', 'Sustainability'],
    avatar: null
  };

  const stats = {
    documentsAnalyzed: 47,
    totalWords: 125840,
    averageScore: 87,
    improvementRate: 23,
    streakDays: 12,
    totalTime: '156 hours'
  };

  const achievements = [
    { id: 1, title: 'First Analysis', description: 'Completed your first document analysis', icon: '🎯', earned: true, date: '2024-03-15' },
    { id: 2, title: 'Writing Streak', description: '7 days of consecutive writing', icon: '🔥', earned: true, date: '2024-08-20' },
    { id: 3, title: 'Quality Improver', description: 'Improved writing score by 20%', icon: '📈', earned: true, date: '2024-07-10' },
    { id: 4, title: 'Collaboration Master', description: 'Collaborated on 5 documents', icon: '🤝', earned: true, date: '2024-06-05' },
    { id: 5, title: 'Citation Expert', description: 'Perfect citation formatting in 10 papers', icon: '📚', earned: false, progress: 7 },
    { id: 6, title: 'Research Machine', description: 'Analyze 100 documents', icon: '⚡', earned: false, progress: 47 },
    { id: 7, title: 'Mentor', description: 'Help 5 students improve their writing', icon: '🎓', earned: false, progress: 2 },
    { id: 8, title: 'Publication Ready', description: 'Achieve 95+ score on 5 documents', icon: '🏆', earned: false, progress: 3 }
  ];

  const recentActivity = [
    { type: 'analysis', title: 'Climate Change Research Paper', score: 89, date: '2024-09-07', time: '2:30 PM' },
    { type: 'collaboration', title: 'Shared "Methodology Review" with Dr. Johnson', date: '2024-09-06', time: '10:15 AM' },
    { type: 'achievement', title: 'Earned "Writing Streak" achievement', date: '2024-09-05', time: '4:45 PM' },
    { type: 'analysis', title: 'Literature Review Draft', score: 92, date: '2024-09-04', time: '1:20 PM' },
    { type: 'upload', title: 'Uploaded "Research Proposal v3"', date: '2024-09-03', time: '9:00 AM' }
  ];

  const writingProgress = [
    { month: 'Mar', score: 72, documents: 5 },
    { month: 'Apr', score: 76, documents: 8 },
    { month: 'May', score: 79, documents: 12 },
    { month: 'Jun', score: 82, documents: 9 },
    { month: 'Jul', score: 85, documents: 7 },
    { month: 'Aug', score: 87, documents: 6 }
  ];

  const collaborations = [
    { name: 'Dr. Michael Johnson', role: 'Supervisor', documents: 12, lastActive: '2 hours ago', avatar: 'MJ' },
    { name: 'Emma Rodriguez', role: 'Research Partner', documents: 8, lastActive: '1 day ago', avatar: 'ER' },
    { name: 'Climate Research Team', role: 'Team Member', documents: 15, lastActive: '3 days ago', avatar: 'CT' },
    { name: 'Prof. Lisa Wang', role: 'Collaborator', documents: 4, lastActive: '1 week ago', avatar: 'LW' }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'analysis': return '📊';
      case 'collaboration': return '🤝';
      case 'achievement': return '🏆';
      case 'upload': return '📄';
      default: return '📝';
    }
  };

  const renderOverview = () => (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Main Stats */}
      <div className="lg:col-span-2 space-y-6">
        {/* Key Metrics */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Your Writing Analytics</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{stats.documentsAnalyzed}</div>
              <div className="text-sm text-gray-600">Documents Analyzed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">{stats.averageScore}%</div>
              <div className="text-sm text-gray-600">Average Score</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">+{stats.improvementRate}%</div>
              <div className="text-sm text-gray-600">Improvement Rate</div>
            </div>
          </div>
        </div>

        {/* Writing Progress Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Writing Progress Over Time</h3>
          <div className="h-64 flex items-end space-x-4">
            {writingProgress.map((month, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-gray-200 rounded-t-lg relative overflow-hidden" style={{ height: '200px' }}>
                  <div 
                    className="absolute bottom-0 w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all duration-1000"
                    style={{ height: `${(month.score / 100) * 200}px` }}
                  ></div>
                  <div className="absolute inset-0 flex items-center justify-center text-white font-semibold">
                    {month.score}%
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-600 font-medium">{month.month}</div>
                <div className="text-xs text-gray-500">{month.documents} docs</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="text-2xl">{getActivityIcon(activity.type)}</div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{activity.title}</p>
                  <p className="text-sm text-gray-500">{activity.date} at {activity.time}</p>
                </div>
                {activity.score && (
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">{activity.score}%</div>
                    <div className="text-xs text-gray-500">Score</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Quick Stats */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Words</span>
              <span className="font-semibold text-gray-900">{stats.totalWords.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Writing Streak</span>
              <span className="font-semibold text-gray-900">{stats.streakDays} days</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Time Spent</span>
              <span className="font-semibold text-gray-900">{stats.totalTime}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Member Since</span>
              <span className="font-semibold text-gray-900">{userData.memberSince}</span>
            </div>
          </div>
        </div>

        {/* Recent Achievements */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Achievements</h3>
          <div className="space-y-3">
            {achievements.filter(a => a.earned).slice(0, 3).map((achievement) => (
              <div key={achievement.id} className="flex items-center space-x-3 p-2 bg-green-50 rounded-lg">
                <div className="text-xl">{achievement.icon}</div>
                <div>
                  <div className="font-medium text-green-900">{achievement.title}</div>
                  <div className="text-xs text-green-700">{achievement.date}</div>
                </div>
              </div>
            ))}
          </div>
          <button 
            onClick={() => setActiveTab('achievements')}
            className="w-full mt-4 text-center text-blue-600 hover:text-blue-500 text-sm font-medium"
          >
            View All Achievements
          </button>
        </div>

        {/* Current Collaborations */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Collaborations</h3>
          <div className="space-y-3">
            {collaborations.slice(0, 3).map((collab, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{collab.avatar}</span>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 text-sm">{collab.name}</div>
                  <div className="text-xs text-gray-500">{collab.documents} shared docs</div>
                </div>
                <div className="text-xs text-gray-400">{collab.lastActive}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderAchievements = () => (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Achievements & Milestones</h3>
      <div className="grid md:grid-cols-2 gap-6">
        {achievements.map((achievement) => (
          <div key={achievement.id} className={`p-4 rounded-lg border-2 transition-all ${
            achievement.earned 
              ? 'border-green-200 bg-green-50' 
              : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="flex items-start space-x-4">
              <div className={`text-3xl ${achievement.earned ? '' : 'opacity-50'}`}>
                {achievement.icon}
              </div>
              <div className="flex-1">
                <h4 className={`font-semibold ${achievement.earned ? 'text-green-900' : 'text-gray-700'}`}>
                  {achievement.title}
                </h4>
                <p className={`text-sm ${achievement.earned ? 'text-green-700' : 'text-gray-600'}`}>
                  {achievement.description}
                </p>
                {achievement.earned ? (
                  <div className="mt-2 text-xs text-green-600 font-medium">
                    Earned on {achievement.date}
                  </div>
                ) : (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Progress: {achievement.progress || 0}/{achievement.title === 'Citation Expert' ? 10 : achievement.title === 'Research Machine' ? 100 : achievement.title === 'Mentor' ? 5 : 5}</span>
                      <span>{Math.round(((achievement.progress || 0) / (achievement.title === 'Citation Expert' ? 10 : achievement.title === 'Research Machine' ? 100 : achievement.title === 'Mentor' ? 5 : 5)) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${((achievement.progress || 0) / (achievement.title === 'Citation Expert' ? 10 : achievement.title === 'Research Machine' ? 100 : achievement.title === 'Mentor' ? 5 : 5)) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCollaborations = () => (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Collaborations & Teams</h3>
      <div className="space-y-4">
        {collaborations.map((collab, index) => (
          <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">{collab.avatar}</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">{collab.name}</h4>
                <p className="text-sm text-gray-600">{collab.role}</p>
                <p className="text-xs text-gray-500">Last active: {collab.lastActive}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-blue-600">{collab.documents}</div>
              <div className="text-xs text-gray-500">Shared docs</div>
            </div>
          </div>
        ))}
      </div>
      <button className="w-full mt-6 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
        Invite New Collaborator
      </button>
    </div>
  );

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
                className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-100/50 transition-all duration-200"
              >
                Settings
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
                        onClick={() => { onNavigate('profile'); setIsDropdownOpen(false); }}
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

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-3xl">SC</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{userData.name}</h1>
                <p className="text-lg text-gray-600 mb-1">{userData.title}</p>
                <p className="text-gray-500 mb-2">{userData.institution}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>📧 {userData.email}</span>
                  <span>📍 {userData.location}</span>
                  <span>🆔 ORCID: {userData.orcid}</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setEditMode(!editMode)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Edit Profile
            </button>
          </div>

          {/* Research Interests */}
          <div className="mt-6">
            <h3 className="font-semibold text-gray-900 mb-3">Research Interests</h3>
            <div className="flex flex-wrap gap-2">
              {userData.researchInterests.map((interest, index) => (
                <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {interest}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: '📊' },
              { id: 'achievements', name: 'Achievements', icon: '🏆' },
              { id: 'collaborations', name: 'Collaborations', icon: '🤝' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 pb-4 border-b-2 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'achievements' && renderAchievements()}
        {activeTab === 'collaborations' && renderCollaborations()}
      </div>
    </div>
  );
};

export default ProfilePage;