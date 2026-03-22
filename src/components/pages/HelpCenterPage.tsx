import { useState, useEffect } from 'react';
import Header from '../common/Header';
import { WriteScholarEditorialBackgroundLayers } from '../common/WriteScholarEditorialBackground';
import Footer from '../common/Footer';
import ScholarMascot from '../common/ScholarMascot';

interface FAQPageProps {
  onNavigate?: (page: string) => void;
  user?: { 
    id: string;
    name: string; 
    email: string;
    firstName?: string;
    lastName?: string;
    plan: string;
    subscription_status?: string;
    email_verified?: boolean;
  } | null;
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
          name: 'What kind of feedback will I get on my essay?',
          acceptedAnswer: { '@type': 'Answer', text: 'Section-by-section annotations (strengths, improvements, concerns), a grade-level rubric, and actionable suggestions covering structure, argument, clarity, citations, and academic style.' }
        },
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
    { id: 'all', name: 'All Topics', count: 12 },
    { id: 'getting-started', name: 'Getting Started', count: 2 },
    { id: 'analysis', name: 'AI Analysis', count: 4 },
    { id: 'documents', name: 'Document Management', count: 2 },
    { id: 'citations', name: 'Citation Styles', count: 1 },
    { id: 'account', name: 'Account & Settings', count: 1 },
    { id: 'troubleshooting', name: 'Troubleshooting', count: 2 }
  ];

  const faqs = [
    {
      id: 13,
      category: 'analysis',
      question: 'What kind of feedback will I get on my essay?',
      answer: 'You get section-by-section annotations (green for strengths, yellow for improvements, red for concerns), an overall grade-level rubric, and concrete suggestions. Feedback covers structure, argument quality, clarity, citations, and academic style—so you know what to revise before you submit.',
      tags: ['feedback', 'analysis', 'essay', 'rubric', 'annotations']
    },
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
      question: 'What AI technology does WriteScholar use?',
      answer: 'WriteScholar uses advanced natural language processing algorithms to provide intelligent analysis of your academic writing. Our system is specifically designed to understand academic writing conventions and provide relevant, actionable feedback for improving your work.',
      tags: ['ai', 'technology', 'model']
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
      action: () => onNavigate?.('dashboard'),
      color: 'lime',
      icon: <ScholarMascot size={56} animated={false} pose="pointing" />
    },
    {
      title: 'View Analysis History',
      description: 'Access all your saved analyses and results',
      action: () => onNavigate?.('analysis-history'),
      color: 'lime',
      icon: <ScholarMascot size={56} animated={false} pose="studying" />
    },
    {
      title: 'Upload Documents',
      description: 'Upload PDF, DOC, DOCX, or TXT files for analysis',
      action: () => onNavigate?.('dashboard'),
      color: 'lime',
      icon: <ScholarMascot size={56} animated={false} pose="celebrating" />
    },
    {
      title: 'Contact Support',
      description: 'Get help from our expert team',
      action: () => onNavigate?.('contact'),
      color: 'lime',
      icon: <ScholarMascot size={56} animated={false} pose="waving" />
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

  // Category icon component with cute characters
  const getCategoryIcon = (categoryId: string) => {
    switch (categoryId) {
      case 'all':
        return (
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-current">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'getting-started':
        return (
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-current">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'analysis':
        return (
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-current">
            <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'documents':
        return (
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-current">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'citations':
        return (
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-current">
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'account':
        return (
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-current">
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'troubleshooting':
        return (
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-current">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <WriteScholarEditorialBackgroundLayers position="fixed" />
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="help" />

      {/* Hero Section */}
      <section className="py-16 sm:py-20 border-b border-stone-100 dark:border-stone-800 bg-gradient-to-br from-violet-50/50 via-white dark:via-stone-900 to-stone-50 dark:to-stone-900 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center px-3 py-1 bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 rounded-full text-sm font-medium mb-6">
              Help Center
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl text-stone-800 dark:text-stone-100 mb-6 leading-tight" style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 400 }}>
              How can we help you?
            </h1>
            <p className="text-lg text-stone-500 dark:text-stone-400 leading-relaxed mb-8">
              Find answers to common questions and learn how to make the most of WriteScholar
            </p>
            
            {/* Search Bar */}
            <div className="max-w-xl mx-auto">
              <div className="relative">
                <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search help topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 text-base border border-stone-200 dark:border-stone-600 rounded-2xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-white dark:bg-stone-800 shadow-sm transition-all text-stone-800 dark:text-stone-100"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-12 sm:py-16 bg-stone-50 dark:bg-stone-900/50 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-6 text-center">Quick Actions</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className="p-6 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-600 rounded-2xl hover:shadow-lg hover:border-violet-300 dark:hover:border-violet-700 transition-all text-left group"
              >
                <div className="w-14 h-14 rounded-2xl mb-4 flex items-center justify-center overflow-hidden bg-violet-50/50 dark:bg-violet-900/20">
                  {action.icon}
                </div>
                <h4 className="font-semibold text-stone-800 dark:text-stone-100 mb-1 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">{action.title}</h4>
                <p className="text-stone-500 dark:text-stone-400 text-sm">{action.description}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 sm:py-16 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Categories Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-600 rounded-2xl p-5 sticky top-24">
                <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-4">Browse by Category</h3>
                <div className="space-y-1">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all ${
                        selectedCategory === category.id
                          ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400'
                          : 'hover:bg-stone-50 dark:hover:bg-stone-700/50 text-stone-600 dark:text-stone-400'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {getCategoryIcon(category.id)}
                        <span className="font-medium text-sm">{category.name}</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        selectedCategory === category.id
                          ? 'bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400'
                          : 'bg-stone-100 dark:bg-stone-700 text-stone-400 dark:text-stone-500'
                      }`}>
                        {category.count}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Contact Support Card */}
                <div className="mt-6 p-5 bg-violet-600 hover:bg-violet-500 rounded-xl">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h4 className="font-semibold mb-1 text-white">Still need help?</h4>
                  <p className="text-white/90 text-sm mb-4">Our support team is here to assist you.</p>
                  <button 
                    onClick={() => onNavigate?.('contact')}
                    className="w-full bg-white text-violet-600 dark:text-violet-400 py-2.5 rounded-xl text-sm font-medium hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
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
                <h2 className="text-2xl font-bold text-stone-900 mb-2">
                  {selectedCategory === 'all' ? 'Frequently Asked Questions' : categories.find(c => c.id === selectedCategory)?.name}
                </h2>
                <p className="text-stone-500">
                  {filteredFAQs.length} article{filteredFAQs.length !== 1 ? 's' : ''} found
                  {searchQuery && ` for "${searchQuery}"`}
                </p>
              </div>

              {/* FAQ List */}
              {filteredFAQs.length === 0 ? (
                <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-600 rounded-2xl p-12 text-center">
                  <div className="w-16 h-16 bg-violet-100 dark:bg-violet-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-stone-900 dark:text-stone-100 mb-2">No articles found</h3>
                  <p className="text-stone-500 dark:text-stone-400 mb-6">Try adjusting your search terms or browse a different category</p>
                  <button 
                    onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                    className="bg-violet-600 hover:bg-violet-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-violet-500 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredFAQs.map((faq) => (
                    <div key={faq.id} className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-600 rounded-2xl overflow-hidden hover:border-violet-300 dark:hover:border-violet-700 transition-all">
                      <button
                        onClick={() => toggleFAQ(faq.id)}
                        className="w-full p-6 text-left hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 pr-4">
                            <h3 className="font-semibold text-stone-900 text-base mb-2">{faq.question}</h3>
                            {/* Tags */}
                            <div className="flex flex-wrap gap-2">
                              {faq.tags.map((tag, index) => (
                                <span key={index} className="px-2.5 py-1 bg-stone-100 text-stone-500 rounded-lg text-xs">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                            openFAQ === faq.id ? 'bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400' : 'bg-stone-100 dark:bg-stone-700 text-stone-400 dark:text-stone-500'
                          }`}>
                            <svg 
                              className={`w-4 h-4 transform transition-transform ${
                                openFAQ === faq.id ? 'rotate-180' : ''
                              }`} 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </button>
                      
                      {openFAQ === faq.id && (
                        <div className="px-6 pb-6">
                          <div className="border-t border-stone-100 pt-4">
                            <p className="text-stone-600 leading-relaxed">{faq.answer}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-stone-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl text-white mb-4" style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 400 }}>
            Ready to improve your writing?
          </h2>
          <p className="text-stone-400 mb-8 max-w-xl mx-auto">
            Join thousands of students and researchers who trust WriteScholar for academic excellence.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {user ? (
              <button 
                onClick={() => onNavigate?.('dashboard')}
                className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-full hover:bg-violet-500 transition-colors"
              >
                Go to Dashboard
              </button>
            ) : (
              <>
                <button 
                  onClick={() => onNavigate?.('signup')}
                  className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-full hover:bg-violet-500 transition-colors"
                >
                  Try Free
                </button>
                <button 
                  onClick={() => onNavigate?.('pricing')}
                  className="px-6 py-3 border border-stone-600 text-white font-medium rounded-full hover:border-stone-500 transition-colors"
                >
                  View Pricing
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default FAQPage;
