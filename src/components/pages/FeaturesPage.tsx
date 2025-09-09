import React, { useState } from 'react';

const FeaturesPage = ({ onNavigate }) => {
  const [activeFeature, setActiveFeature] = useState('analysis');

  const features = {
    analysis: {
      title: 'AI-Powered Analysis',
      description: 'Advanced natural language processing that understands academic writing conventions',
      details: [
        'Structure and organization assessment',
        'Argument flow and logical coherence',
        'Evidence quality evaluation',
        'Academic tone and style analysis',
        'Discipline-specific feedback',
        'Real-time improvement suggestions'
      ],
      demo: {
        input: 'This research paper examines the multifaceted impacts of climate change on global ecosystems...',
        output: [
          { type: 'strength', text: 'Strong opening that clearly establishes scope' },
          { type: 'suggestion', text: 'Consider adding a hypothesis statement here' },
          { type: 'improvement', text: 'Specify the timeframe for your analysis' }
        ]
      }
    },
    citations: {
      title: 'Citation Management',
      description: 'Comprehensive citation checking and formatting across all major academic styles',
      details: [
        'APA, MLA, Chicago, Harvard, IEEE support',
        'Automatic citation format detection',
        'Missing citation identification',
        'Bibliography completeness check',
        'Citation accuracy verification',
        'Custom institutional styles'
      ],
      demo: {
        input: 'According to recent studies (Smith 2023), climate patterns...',
        output: [
          { type: 'correction', text: 'Missing page number for direct reference' },
          { type: 'suggestion', text: 'Consider adding Smith, J. (2023) to bibliography' },
          { type: 'format', text: 'APA style detected - formatting applied' }
        ]
      }
    },
    collaboration: {
      title: 'Team Collaboration',
      description: 'Seamless collaboration tools for research teams and supervisors',
      details: [
        'Real-time collaborative editing',
        'Comment and suggestion system',
        'Version history tracking',
        'Role-based permissions',
        'Supervisor review workflows',
        'Team progress analytics'
      ],
      demo: {
        input: 'Shared document with multiple contributors...',
        output: [
          { type: 'activity', text: 'Dr. Johnson added 3 comments' },
          { type: 'activity', text: 'Sarah revised methodology section' },
          { type: 'activity', text: 'Auto-saved version 2.4' }
        ]
      }
    },
    analytics: {
      title: 'Writing Analytics',
      description: 'Detailed insights into your writing patterns and improvement over time',
      details: [
        'Writing quality trends',
        'Common error patterns',
        'Productivity metrics',
        'Goal tracking and achievements',
        'Comparative analysis',
        'Personalized recommendations'
      ],
      demo: {
        input: 'Monthly writing performance data...',
        output: [
          { type: 'metric', text: 'Writing quality improved 15% this month' },
          { type: 'insight', text: 'Most frequent issue: Citation formatting' },
          { type: 'goal', text: '8/10 weekly writing goals achieved' }
        ]
      }
    }
  };

  const capabilities = [
    {
      icon: '🧠',
      title: 'Advanced AI Models',
      description: 'State-of-the-art language models trained specifically on academic literature',
      stats: '99.7% accuracy'
    },
    {
      icon: '⚡',
      title: 'Lightning Fast',
      description: 'Get comprehensive feedback on your documents in under 30 seconds',
      stats: '<30s analysis'
    },
    {
      icon: '🔒',
      title: 'Secure & Private',
      description: 'Enterprise-grade security with end-to-end encryption for your research',
      stats: 'SOC 2 Certified'
    },
    {
      icon: '🌍',
      title: 'Multi-Language',
      description: 'Support for academic writing in 15+ languages with cultural context',
      stats: '15+ languages'
    },
    {
      icon: '📊',
      title: 'Deep Analytics',
      description: 'Comprehensive insights into writing patterns and improvement areas',
      stats: '50+ metrics'
    },
    {
      icon: '🎯',
      title: 'Discipline-Specific',
      description: 'Tailored feedback for STEM, humanities, social sciences, and more',
      stats: '25+ disciplines'
    }
  ];

  const integrations = [
    { name: 'Microsoft Word', logo: '📄', description: 'Native Word add-in for seamless integration' },
    { name: 'Google Docs', logo: '📝', description: 'Real-time collaboration in Google Workspace' },
    { name: 'LaTeX', logo: '📋', description: 'Direct support for LaTeX document processing' },
    { name: 'Zotero', logo: '📚', description: 'Automatic citation import and management' },
    { name: 'Mendeley', logo: '🔬', description: 'Reference library synchronization' },
    { name: 'EndNote', logo: '📖', description: 'Citation database integration' },
    { name: 'Overleaf', logo: '📊', description: 'LaTeX collaborative writing platform' },
    { name: 'Slack', logo: '💬', description: 'Team notifications and updates' }
  ];

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
          <button onClick={() => onNavigate('pricing')} className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</button>
          <button className="text-blue-600 font-medium">Features</button>
          <button className="text-gray-600 hover:text-gray-900 transition-colors">About</button>
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

      <div className="max-w-7xl mx-auto px-8 py-20">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Powerful features for<br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">academic excellence</span>
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            Discover how our AI-powered platform revolutionizes academic writing with intelligent analysis, 
            comprehensive feedback, and collaborative tools designed for researchers and students.
          </p>
        </div>

        {/* Core Features Interactive Demo */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Core Features</h2>
          
          {/* Feature Tabs */}
          <div className="flex flex-wrap justify-center mb-12 bg-white rounded-2xl p-2 shadow-lg max-w-2xl mx-auto">
            {Object.entries(features).map(([key, feature]) => (
              <button
                key={key}
                onClick={() => setActiveFeature(key)}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  activeFeature === key
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {feature.title}
              </button>
            ))}
          </div>

          {/* Feature Demo */}
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {features[activeFeature].title}
                </h3>
                <p className="text-gray-600 mb-6">
                  {features[activeFeature].description}
                </p>
                <ul className="space-y-3">
                  {features[activeFeature].details.map((detail, index) => (
                    <li key={index} className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Live Demo</h4>
                <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">Input:</p>
                  <p className="text-gray-900 italic">{features[activeFeature].demo.input}</p>
                </div>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">AI Feedback:</p>
                  {features[activeFeature].demo.output.map((item, index) => (
                    <div key={index} className={`p-3 rounded-lg text-sm ${
                      item.type === 'strength' ? 'bg-green-50 text-green-800' :
                      item.type === 'suggestion' ? 'bg-yellow-50 text-yellow-800' :
                      item.type === 'improvement' ? 'bg-blue-50 text-blue-800' :
                      item.type === 'correction' ? 'bg-red-50 text-red-800' :
                      item.type === 'format' ? 'bg-purple-50 text-purple-800' :
                      item.type === 'activity' ? 'bg-gray-50 text-gray-800' :
                      item.type === 'metric' ? 'bg-green-50 text-green-800' :
                      item.type === 'insight' ? 'bg-blue-50 text-blue-800' :
                      'bg-gray-50 text-gray-800'
                    }`}>
                      {item.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Capabilities Grid */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Platform Capabilities</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {capabilities.map((capability, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-all duration-300 group">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {capability.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{capability.title}</h3>
                <p className="text-gray-600 mb-4">{capability.description}</p>
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {capability.stats}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Integrations Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Seamless Integrations</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Connect with your favorite tools and platforms for a streamlined research workflow
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-6">
            {integrations.map((integration, index) => (
              <div key={index} className="bg-white rounded-xl shadow-md p-6 text-center hover:shadow-lg transition-all duration-300 group">
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">
                  {integration.logo}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{integration.name}</h3>
                <p className="text-sm text-gray-600">{integration.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Advanced Features */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Advanced Features</h2>
          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Plagiarism Detection</h3>
                  <p className="text-gray-600">Advanced similarity checking across billions of academic sources, web content, and institutional databases with detailed originality reports.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Smart Bibliography</h3>
                  <p className="text-gray-600">Automatic bibliography generation with source verification, duplicate detection, and formatting according to your chosen citation style.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Real-time Suggestions</h3>
                  <p className="text-gray-600">Get instant feedback as you write with smart suggestions for improving clarity, structure, and academic style without interrupting your flow.</p>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Team Collaboration</h3>
                  <p className="text-gray-600">Multi-user editing with role-based permissions, comment threads, suggestion tracking, and supervisor review workflows for seamless teamwork.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Enterprise Security</h3>
                  <p className="text-gray-600">Bank-level encryption, GDPR compliance, SOC 2 certification, and custom security policies to protect your sensitive research data.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">API Integration</h3>
                  <p className="text-gray-600">Robust REST API for custom integrations, automated workflows, and embedding our AI capabilities into your existing research infrastructure.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Experience the Future of Academic Writing</h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of researchers and students who have already transformed their writing process with our AI-powered platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => onNavigate('signup')}
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Start Free Trial
            </button>
            <button 
              onClick={() => onNavigate('pricing')}
              className="border border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
            >
              View Pricing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturesPage;