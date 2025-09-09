import React, { useState } from 'react';

const HelpCenterPage = ({ onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [openFAQ, setOpenFAQ] = useState(null);

  const categories = [
    { id: 'all', name: 'All Topics', icon: '📚', count: 47 },
    { id: 'getting-started', name: 'Getting Started', icon: '🚀', count: 8 },
    { id: 'analysis', name: 'Document Analysis', icon: '📊', count: 12 },
    { id: 'collaboration', name: 'Collaboration', icon: '🤝', count: 6 },
    { id: 'citations', name: 'Citations & References', icon: '📖', count: 9 },
    { id: 'account', name: 'Account & Billing', icon: '⚙️', count: 7 },
    { id: 'integrations', name: 'Integrations', icon: '🔗', count: 5 }
  ];

  const faqs = [
    {
      id: 1,
      category: 'getting-started',
      question: 'How do I upload my first document?',
      answer: 'To upload your first document, click the "Upload Document" button on your dashboard or navigate to the Upload page. You can drag and drop files directly, or click to browse from your computer. We support PDF, DOC, DOCX, and TXT formats up to 50MB.',
      helpful: 156,
      tags: ['upload', 'first-time', 'documents']
    },
    {
      id: 2,
      category: 'analysis',
      question: 'How accurate is the AI analysis?',
      answer: 'Our AI analysis has a 99.7% accuracy rate for grammar and style detection, and 95% accuracy for academic content analysis. The system is trained on millions of academic papers and continuously improved based on user feedback and new research.',
      helpful: 243,
      tags: ['accuracy', 'ai', 'analysis']
    },
    {
      id: 3,
      category: 'analysis',
      question: 'What does the writing score mean?',
      answer: 'The writing score is a comprehensive metric (0-100) that evaluates your document across multiple dimensions: structure (25%), clarity (25%), grammar (20%), academic style (15%), and citations (15%). A score above 85 indicates publication-ready quality.',
      helpful: 189,
      tags: ['score', 'metrics', 'evaluation']
    },
    {
      id: 4,
      category: 'citations',
      question: 'Which citation styles are supported?',
      answer: 'We support all major academic citation styles including APA, MLA, Chicago, Harvard, IEEE, Vancouver, and many more. You can also create custom citation styles for your institution. The system automatically detects and formats citations according to your chosen style.',
      helpful: 167,
      tags: ['citations', 'apa', 'mla', 'chicago']
    },
    {
      id: 5,
      category: 'collaboration',
      question: 'How do I share documents with my supervisor?',
      answer: 'To share a document, open it in the analysis view and click the "Share" button. Enter your supervisor\'s email address and set their permission level (view, comment, or edit). They\'ll receive an email invitation to access the document.',
      helpful: 134,
      tags: ['sharing', 'collaboration', 'supervisor']
    },
    {
      id: 6,
      category: 'account',
      question: 'How do I upgrade my plan?',
      answer: 'You can upgrade your plan anytime from the Settings page under "Billing" or from the Pricing page. Changes take effect immediately, and you\'ll only pay the prorated difference for the current billing period.',
      helpful: 98,
      tags: ['upgrade', 'billing', 'plans']
    },
    {
      id: 7,
      category: 'integrations',
      question: 'Can I use AcademicAI with Microsoft Word?',
      answer: 'Yes! We offer a native Microsoft Word add-in that provides real-time feedback as you write. Download it from the Microsoft Office Store or through the Integrations page in your account settings.',
      helpful: 201,
      tags: ['word', 'microsoft', 'integration']
    },
    {
      id: 8,
      category: 'analysis',
      question: 'Why is my document taking so long to analyze?',
      answer: 'Analysis time depends on document length and complexity. Most documents are processed in 30-60 seconds. Longer documents (>10,000 words) or those with many citations may take 2-3 minutes. Premium users get priority processing.',
      helpful: 87,
      tags: ['speed', 'processing', 'time']
    },
    {
      id: 9,
      category: 'getting-started',
      question: 'Is there a limit to document uploads?',
      answer: 'Free accounts can upload up to 3 documents per month. Premium accounts have unlimited uploads. All accounts have a 50MB file size limit per document. Institutional accounts can request higher limits.',
      helpful: 156,
      tags: ['limits', 'uploads', 'free', 'premium']
    },
    {
      id: 10,
      category: 'account',
      question: 'How do I cancel my subscription?',
      answer: 'You can cancel your subscription anytime from Settings > Billing. Your account will remain active until the end of your current billing period, and you can reactivate anytime before it expires.',
      helpful: 76,
      tags: ['cancel', 'subscription', 'billing']
    }
  ];

  const quickActions = [
    {
      title: 'Start Your First Analysis',
      description: 'Upload a document and get AI-powered feedback',
      icon: '🚀',
      action: () => onNavigate('upload'),
      color: 'blue'
    },
    {
      title: 'Watch Tutorial Videos',
      description: 'Learn how to use all features effectively',
      icon: '🎥',
      action: () => {},
      color: 'purple'
    },
    {
      title: 'Contact Support',
      description: 'Get help from our expert team',
      icon: '💬',
      action: () => onNavigate('contact'),
      color: 'green'
    },
    {
      title: 'Join Community Forum',
      description: 'Connect with other researchers',
      icon: '👥',
      action: () => {},
      color: 'orange'
    }
  ];

  const filteredFAQs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const toggleFAQ = (id) => {
    setOpenFAQ(openFAQ === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="text-xl font-bold text-gray-900">AcademicAI</span>
        </div>
        <div className="hidden md:flex items-center space-x-8">
          <button onClick={() => onNavigate('landing')} className="text-gray-600 hover:text-gray-900 transition-colors">Home</button>
          <button onClick={() => onNavigate('features')} className="text-gray-600 hover:text-gray-900 transition-colors">Features</button>
          <button onClick={() => onNavigate('pricing')} className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</button>
          <button className="text-blue-600 font-medium">Help</button>
        </div>
        <div className="flex items-center space-x-4">
          <button onClick={() => onNavigate('login')} className="text-gray-600 hover:text-gray-900 transition-colors">
            Login
          </button>
          <button onClick={() => onNavigate('signup')} className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
            Sign up
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            How can we <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">help you?</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Find answers, get support, and learn how to make the most of AcademicAI
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search for help topics, features, or troubleshooting..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-6 py-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-lg"
              />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-4 gap-6 mb-16">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className={`p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-left group border-2 border-transparent hover:border-${action.color}-200`}
            >
              <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-300">
                {action.icon}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{action.title}</h3>
              <p className="text-gray-600 text-sm">{action.description}</p>
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Categories Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
              <h3 className="font-semibold text-gray-900 mb-4">Browse by Category</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-blue-50 text-blue-600 border border-blue-200'
                        : 'hover:bg-gray-50 text-gray-700 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{category.icon}</span>
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {category.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Contact Support */}
              <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-gray-900 mb-2">Still need help?</h4>
                <p className="text-sm text-gray-600 mb-4">Our support team is here to help you succeed.</p>
                <button 
                  onClick={() => onNavigate('contact')}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded-lg text-sm font-medium hover:shadow-lg transition-all duration-300"
                >
                  Contact Support
                </button>
              </div>
            </div>
          </div>

          {/* FAQ Content */}
          <div className="lg:col-span-3">
            {/* Results Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {selectedCategory === 'all' ? 'Frequently Asked Questions' : categories.find(c => c.id === selectedCategory)?.name}
              </h2>
              <p className="text-gray-600">
                {filteredFAQs.length} article{filteredFAQs.length !== 1 ? 's' : ''} found
                {searchQuery && ` for "${searchQuery}"`}
              </p>
            </div>

            {/* FAQ List */}
            {filteredFAQs.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No articles found</h3>
                <p className="text-gray-500 mb-6">Try adjusting your search terms or browse a different category</p>
                <button 
                  onClick={() => onNavigate('contact')}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Contact Support
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFAQs.map((faq) => (
                  <div key={faq.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <button
                      onClick={() => toggleFAQ(faq.id)}
                      className="w-full p-6 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 pr-4">{faq.question}</h3>
                        <svg 
                          className={`w-5 h-5 text-gray-500 transform transition-transform duration-200 ${
                            openFAQ === faq.id ? 'rotate-180' : ''
                          }`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                      
                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {faq.tags.map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </button>
                    
                    {openFAQ === faq.id && (
                      <div className="px-6 pb-6">
                        <div className="border-t border-gray-200 pt-4">
                          <p className="text-gray-700 leading-relaxed mb-4">{faq.answer}</p>
                          
                          {/* Helpful Actions */}
                          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <div className="flex items-center space-x-4">
                              <span className="text-sm text-gray-500">Was this helpful?</span>
                              <div className="flex space-x-2">
                                <button className="flex items-center space-x-1 text-green-600 hover:text-green-700 transition-colors">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                                  </svg>
                                  <span className="text-sm">Yes</span>
                                </button>
                                <button className="flex items-center space-x-1 text-red-600 hover:text-red-700 transition-colors">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v2a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                                  </svg>
                                  <span className="text-sm">No</span>
                                </button>
                              </div>
                            </div>
                            <div className="text-sm text-gray-500">
                              {faq.helpful} people found this helpful
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Additional Resources */}
            <div className="mt-12 grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">📚 Learning Resources</h3>
                <ul className="space-y-3">
                  <li>
                    <a href="#" className="text-blue-600 hover:text-blue-500 font-medium">Academic Writing Guide</a>
                    <p className="text-sm text-gray-600">Comprehensive guide to academic writing best practices</p>
                  </li>
                  <li>
                    <a href="#" className="text-blue-600 hover:text-blue-500 font-medium">Video Tutorials</a>
                    <p className="text-sm text-gray-600">Step-by-step video guides for all features</p>
                  </li>
                  <li>
                    <a href="#" className="text-blue-600 hover:text-blue-500 font-medium">Citation Style Guide</a>
                    <p className="text-sm text-gray-600">Examples and rules for all citation formats</p>
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">🔧 Technical Support</h3>
                <ul className="space-y-3">
                  <li>
                    <a href="#" className="text-blue-600 hover:text-blue-500 font-medium">API Documentation</a>
                    <p className="text-sm text-gray-600">Technical docs for developers and integrations</p>
                  </li>
                  <li>
                    <a href="#" className="text-blue-600 hover:text-blue-500 font-medium">System Status</a>
                    <p className="text-sm text-gray-600">Real-time status of all AcademicAI services</p>
                  </li>
                  <li>
                    <a href="#" className="text-blue-600 hover:text-blue-500 font-medium">Security & Privacy</a>
                    <p className="text-sm text-gray-600">Information about data protection and security</p>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenterPage;