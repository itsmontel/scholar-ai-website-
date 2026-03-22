import { useState, useEffect } from 'react';
import Header from '../common/Header';
import { WriteScholarEditorialBackgroundLayers } from '../common/WriteScholarEditorialBackground';

interface ProfilePageProps {
  onNavigate: (page: string) => void;
  user: any;
  onLogout: () => void;
}

const ProfilePage = ({ onNavigate, user, onLogout }: ProfilePageProps) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    institution: '',
    researchField: '',
    bio: '',
    avatar: '',
    joinedDate: '',
    totalDocuments: 0,
    documentsAnalyzed: 0,
    lastActivity: ''
  });

  useEffect(() => {
    // Simulate fetching profile data
    setProfileData({
      name: user?.name || 'Loading...',
      email: user?.email || 'Loading...',
      institution: 'University of Example',
      researchField: 'Computer Science',
      bio: 'Passionate researcher focused on AI and machine learning applications in academic writing.',
      avatar: '',
      joinedDate: 'January 2024',
      totalDocuments: 15,
      documentsAnalyzed: 12,
      lastActivity: '2 days ago'
    });
  }, [user]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'documents', label: 'Documents', icon: '📄' },
    { id: 'collaborations', label: 'Collaborations', icon: '👥' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Profile Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/90 backdrop-blur-xl border border-stone-200/60 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-lime-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-lime-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-stone-800">{profileData.totalDocuments}</div>
              <div className="text-sm text-stone-600">Total Documents</div>
            </div>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-xl border border-stone-200/60 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
                  </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-stone-800">{profileData.documentsAnalyzed}</div>
              <div className="text-sm text-stone-600">Documents Analyzed</div>
              </div>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-xl border border-stone-200/60 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-stone-200 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
                </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-stone-800">{profileData.joinedDate}</div>
              <div className="text-sm text-stone-600">Member Since</div>
              </div>
          </div>
        </div>
      </div>

      {/* Profile Information */}
      <div className="bg-white/90 backdrop-blur-xl border border-stone-200/60 rounded-2xl p-8 shadow-lg">
        <h3 className="text-xl font-bold text-stone-800 mb-6">Profile Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Username</label>
            <div className="text-stone-800">{profileData.name}</div>
            </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Email</label>
            <div className="text-stone-800">{profileData.email}</div>
            </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Institution</label>
            <div className="text-stone-800">{profileData.institution}</div>
            </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Research Field</label>
            <div className="text-stone-800">{profileData.researchField}</div>
          </div>
        </div>
        <div className="mt-6">
          <label className="block text-sm font-medium text-stone-700 mb-2">Bio</label>
          <div className="text-stone-800">{profileData.bio}</div>
                </div>
              </div>

      {/* Recent Activity */}
      <div className="bg-white/90 backdrop-blur-xl border border-stone-200/60 rounded-2xl p-8 shadow-lg">
        <h3 className="text-xl font-bold text-stone-800 mb-6">Recent Activity</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-4 p-4 bg-stone-50 rounded-lg">
            <div className="w-10 h-10 bg-lime-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-lime-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="font-medium text-stone-800">Analyzed "Machine Learning Research Paper"</div>
              <div className="text-sm text-stone-600">2 days ago</div>
            </div>
          </div>
          <div className="flex items-center space-x-4 p-4 bg-stone-50 rounded-lg">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
                </div>
                <div className="flex-1">
              <div className="font-medium text-stone-800">Uploaded new document</div>
              <div className="text-sm text-stone-600">1 week ago</div>
              </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDocuments = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-stone-800">Your Documents</h3>
        <button 
          onClick={() => onNavigate('upload')}
          className="bg-lime-400 text-stone-900 px-4 py-2 rounded-full hover:bg-lime-300 transition-colors font-medium"
        >
          Upload New Document
        </button>
              </div>
      <div className="bg-white/90 backdrop-blur-xl border border-stone-200/60 rounded-2xl p-6 shadow-lg">
        <p className="text-stone-600">Document management features coming soon...</p>
      </div>
    </div>
  );

  const renderCollaborations = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-stone-800">Collaborations</h3>
        <button className="bg-lime-400 text-stone-900 px-4 py-2 rounded-full hover:bg-lime-300 transition-colors font-medium">
          Invite Collaborator
        </button>
              </div>
      <div className="bg-white/90 backdrop-blur-xl border border-stone-200/60 rounded-2xl p-6 shadow-lg">
        <p className="text-stone-600">Collaboration features coming soon...</p>
              </div>
            </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-stone-800">Profile Settings</h3>
      <div className="bg-white/90 backdrop-blur-xl border border-stone-200/60 rounded-2xl p-6 shadow-lg">
        <p className="text-stone-600">Profile settings coming soon...</p>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'documents':
        return renderDocuments();
      case 'collaborations':
        return renderCollaborations();
      case 'settings':
        return renderSettings();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <WriteScholarEditorialBackgroundLayers position="fixed" />
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="profile" />

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Profile Header */}
        <div className="bg-white/90 backdrop-blur-xl border border-stone-200/60 rounded-2xl p-8 shadow-lg mb-8">
            <div className="flex items-center space-x-6">
            <div className="w-20 h-20 bg-gradient-to-br from-lime-400 to-lime-600 rounded-full flex items-center justify-center">
              <span className="text-stone-900 text-2xl font-bold">
                {profileData.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-stone-800">{profileData.name}</h1>
              <p className="text-stone-600">{profileData.email}</p>
              <p className="text-sm text-stone-500">Member since {profileData.joinedDate}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/90 backdrop-blur-xl border border-stone-200/60 rounded-2xl shadow-lg mb-8">
          <div className="flex border-b border-stone-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-lime-600 border-b-2 border-lime-600 bg-lime-50'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white/90 backdrop-blur-xl border border-stone-200/60 rounded-2xl p-8 shadow-lg">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;