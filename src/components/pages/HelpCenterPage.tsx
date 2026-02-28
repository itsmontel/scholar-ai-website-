import { useState, useEffect } from 'react';
import Header from '../common/Header';

interface FAQPageProps {
  onNavigate?: (page: string) => void;
  user?: { name: string; email: string } | null;
  onLogout?: () => void;
}

const FAQPage: React.FC<FAQPageProps> = ({ onNavigate, user, onLogout }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  // FAQPage schema for SEO / rich results
  useEffect(() => {
    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Which citation styles does WriteScholar support?',
          acceptedAnswer: { '@type': 'Answer', text: 'WriteScholar supports APA, Harvard, Chicago, MLA, IEEE, and Vancouver citation styles.' }
        },
        {
          '@type': 'Question',
          name: 'What is the minimum word count for analysis?',
          acceptedAnswer: { '@type': 'Answer', text: 'WriteScholar requires a minimum of 200 words for analysis.' }
        },
        {
          '@type': 'Question',
          name: 'How do I get started with WriteScholar?',
          acceptedAnswer: { '@type': 'Answer', text: 'Sign up for an account, then upload a document or paste text (at least 200 words) and click "Send to Analysis".' }
        },
        {
          '@type': 'Question',
          name: 'What file formats does WriteScholar support?',
          acceptedAnswer: { '@type': 'Answer', text: 'WriteScholar supports PDF, DOC, DOCX, and TXT files.' }
        }
      ]
    };
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(faqSchema);
    script.id = 'faq-schema-writescholar';
    document.head.appendChild(script);
    return () => {
      const el = document.getElementById('faq-schema-writescholar');
      if (el) el.remove();
    };
  }, []);

  const categories = [
    { id: 'all', name: 'All Topics', icon: '📚', count: 12 },
    { id: 'getting-started', name: 'Getting Started', icon: '🚀', count: 2 },
    { id: 'analysis', name: 'AI Analysis', icon: '🤖', count: 4 },
    { id: 'documents', name: 'Document Management', icon: '📄', count: 2 },
    { id: 'citations', name: 'Citation Styles', icon: '📖', count: 1 },
    { id: 'account', name: 'Account & Settings', icon: '⚙️', count: 1 },
    { id: 'troubleshooting', name: 'Troubleshooting', icon: '🔧', count: 2 }
  ];

  const faqs = [
    {
      id: 1,
      category: 'getting-started',
      question: 'How do I get started with WriteScholar?',
      answer: 'Getting started is easy! Simply sign up for an account, then you can either upload a document from your computer or paste text directly into the dashboard. Make sure your text is at least 200 words for analysis. Click "Send to Analysis" to begin.',
      tags: ['getting-started', 'signup', 'first-time']
    },
    {
      id: 2,
      category: 'analysis',
      question: 'What types of analysis does WriteScholar provide?',
      answer: 'WriteScholar provides comprehensive academic analysis including: academic writing quality assessment, citation and referencing review, argument structure analysis, grammar and style feedback, and content depth evaluation. All feedback is categorized as strengths (green), improvements (amber), or concerns (red).',
      tags: ['analysis', 'types', 'comprehensive']
    },
    {
      id: 3,
      category: 'analysis',
      question: 'How does the highlighting and annotation system work?',
      answer: 'WriteScholar highlights specific text passages in your document and provides contextual feedback. Hover over any highlighted text to see detailed comments and suggestions. The annotations are color-coded: green for strengths, amber for improvements, and red for concerns. Click on annotations in the sidebar to jump to specific sections.',
      tags: ['highlights', 'annotations', 'feedback']
    },
    {
      id: 4,
      category: 'citations',
      question: 'Which citation styles are supported?',
      answer: 'WriteScholar supports all major academic citation styles including APA, Harvard, Chicago, MLA, IEEE, and Vancouver. You can select your preferred citation style from the dropdown menu before running the analysis. The AI will provide feedback specific to your chosen citation format.',
      tags: ['citations', 'apa', 'harvard', 'chicago', 'mla']
    },
    {
      id: 5,
      category: 'documents',
      question: 'How do I upload and manage documents?',
      answer: 'You can upload documents by clicking the "Upload Document" button on your dashboard. Supported formats include PDF, DOC, DOCX, and TXT files. Once uploaded, documents appear in your dashboard with their analysis status. Documents with completed analysis show "Show Analysis" while new documents show "Analyze".',
      tags: ['upload', 'documents', 'management']
    },
    {
      id: 6,
      category: 'analysis',
      question: 'How do I save my analysis results?',
      answer: 'After running an analysis, click the green "Save Analysis" button in the results header. This saves your analysis to your analysis history where you can access it later. Saved analyses include all annotations, feedback, and the original document content.',
      tags: ['save', 'analysis', 'history']
    },
    {
      id: 7,
      category: 'analysis',
      question: 'What AI model does WriteScholar use?',
      answer: 'WriteScholar uses OpenAI\'s advanced language models to provide intelligent analysis of your academic writing. The system is specifically trained to understand academic writing conventions and provide relevant, actionable feedback for improving your work.',
      tags: ['ai', 'openai', 'model']
    },
    {
      id: 8,
      category: 'analysis',
      question: 'How long does analysis take?',
      answer: 'Analysis time depends on document length and complexity. Most documents are processed within 30-60 seconds. Longer documents or those with complex formatting may take 2-3 minutes. The system will show a loading indicator during processing.',
      tags: ['speed', 'processing', 'time']
    },
    {
      id: 9,
      category: 'getting-started',
      question: 'What is the minimum word count for analysis?',
      answer: 'WriteScholar requires a minimum of 200 words for analysis. This ensures the AI has enough content to provide meaningful feedback. If your text is shorter than 200 words, you\'ll see a warning message and the analysis button will be disabled.',
      tags: ['word-count', 'minimum', 'requirements']
    },
    {
      id: 10,
      category: 'troubleshooting',
      question: 'Why can\'t I see highlights in my analysis?',
      answer: 'If you\'re not seeing highlights, make sure you\'ve run a complete analysis first. Highlights appear after the AI processes your document and generates annotations. Try refreshing the page or running the analysis again if highlights don\'t appear.',
      tags: ['highlights', 'troubleshooting', 'display']
    },
    {
      id: 11,
      category: 'documents',
      question: 'How do I view my analysis history?',
      answer: 'You can view your analysis history by navigating to the "Analysis History" page from the main menu. This shows all your saved analyses with timestamps, document names, and analysis types. Click on any analysis to view the full results.',
      tags: ['history', 'saved', 'analyses']
    },
    {
      id: 12,
      category: 'account',
      question: 'How do I change my account settings?',
      answer: 'Account settings can be accessed from the user menu in the top-right corner of the dashboard. From there you can update your profile information, change your password, and manage your account preferences.',
      tags: ['settings', 'account', 'profile']
    }
  ];

  const quickActions = [
    {
      title: 'Start Your First Analysis',
      description: 'Upload a document or paste text to get AI-powered feedback',
      icon: '🚀',
      action: () => onNavigate?.('dashboard'),
      color: 'blue'
    },
    {
      title: 'View Analysis History',
      description: 'Access all your saved analyses and results',
      icon: '📊',
      action: () => onNavigate?.('analysis-history'),
      color: 'purple'
    },
    {
      title: 'Upload Documents',
      description: 'Upload PDF, DOC, DOCX, or TXT files for analysis',
      icon: '📄',
      action: () => onNavigate?.('dashboard'),
      color: 'green'
    },
    {
      title: 'Contact Support',
      description: 'Get help from our expert team',
      icon: '💬',
      action: () => onNavigate?.('contact'),
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

  const toggleFAQ = (id: number) => {
    setOpenFAQ(openFAQ === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-white">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="help" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Help Center
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Find answers to common questions and learn how to make the most of WriteScholar
          </p>
          
          {/* Search Bar */}
          <div className="max-w-xl mx-auto">
            <div className="relative">
              <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search help topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-6 py-3.5 text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all"
              />
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Categories Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-2xl p-5 sticky top-24">
              <h3 className="font-semibold text-gray-900 mb-4 text-sm">Browse by Category</h3>
              <div className="space-y-1">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all ${
                      selectedCategory === category.id
                        ? 'bg-blue-50 text-blue-600'
                        : 'hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-base">{category.icon}</span>
                      <span className="font-medium text-sm">{category.name}</span>
                    </div>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      {category.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Contact Support */}
              <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <h4 className="font-semibold text-gray-900 text-sm mb-1">Still need help?</h4>
                <p className="text-xs text-gray-500 mb-4">Our support team is here to help.</p>
                <button 
                  onClick={() => onNavigate?.('contact')}
                  className="w-full bg-gray-900 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
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
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                {selectedCategory === 'all' ? 'Frequently Asked Questions' : categories.find(c => c.id === selectedCategory)?.name}
              </h2>
              <p className="text-gray-500 text-sm">
                {filteredFAQs.length} article{filteredFAQs.length !== 1 ? 's' : ''} found
                {searchQuery && ` for "${searchQuery}"`}
              </p>
            </div>

            {/* FAQ List */}
            {filteredFAQs.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No articles found</h3>
                <p className="text-gray-500 text-sm mb-6">Try adjusting your search terms or browse a different category</p>
                <button 
                  onClick={() => onNavigate?.('contact')}
                  className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors"
                >
                  Contact Support
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFAQs.map((faq) => (
                  <div key={faq.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleFAQ(faq.id)}
                      className="w-full p-5 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 pr-4 text-sm">{faq.question}</h3>
                        <svg 
                          className={`w-5 h-5 text-gray-400 flex-shrink-0 transform transition-transform ${
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
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {faq.tags.map((tag, index) => (
                          <span key={index} className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-md text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </button>
                    
                    {openFAQ === faq.id && (
                      <div className="px-5 pb-5">
                        <div className="border-t border-gray-100 pt-4">
                          <p className="text-gray-600 text-sm leading-relaxed">{faq.answer}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Quick Actions */}
            <div className="mt-10">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.action}
                    className="p-5 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors text-left"
                  >
                    <div className="text-2xl mb-3">
                      {action.icon}
                    </div>
                    <h4 className="font-semibold text-gray-900 text-sm mb-1">{action.title}</h4>
                    <p className="text-gray-500 text-xs">{action.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;