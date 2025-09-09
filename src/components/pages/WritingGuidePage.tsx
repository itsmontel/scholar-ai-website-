import React, { useState } from 'react';

const WritingGuidePage = ({ onNavigate }) => {
  const [activeSection, setActiveSection] = useState('overview');
  const [expandedGuide, setExpandedGuide] = useState(null);

  const sections = [
    { id: 'overview', name: 'Overview', icon: '📋' },
    { id: 'structure', name: 'Document Structure', icon: '🏗️' },
    { id: 'writing-style', name: 'Writing Style', icon: '✍️' },
    { id: 'citations', name: 'Citations & References', icon: '📚' },
    { id: 'common-mistakes', name: 'Common Mistakes', icon: '⚠️' },
    { id: 'templates', name: 'Templates', icon: '📄' },
    { id: 'tools', name: 'Writing Tools', icon: '🛠️' }
  ];

  const guides = [
    {
      id: 1,
      title: 'Research Paper Structure',
      description: 'Learn the essential components of a well-structured research paper',
      category: 'structure',
      readTime: '8 min read',
      difficulty: 'Beginner',
      tags: ['structure', 'research', 'academic'],
      content: {
        introduction: 'A well-structured research paper follows a logical flow that guides readers through your research journey...',
        sections: [
          { title: 'Title Page', content: 'Should include title, author(s), institutional affiliation, and contact information...' },
          { title: 'Abstract', content: 'A concise summary of your research, typically 150-300 words...' },
          { title: 'Introduction', content: 'Introduces the research problem and provides background context...' },
          { title: 'Literature Review', content: 'Reviews existing research and identifies gaps your study addresses...' },
          { title: 'Methodology', content: 'Describes your research methods and procedures in detail...' },
          { title: 'Results', content: 'Presents your findings objectively without interpretation...' },
          { title: 'Discussion', content: 'Interprets results and discusses their implications...' },
          { title: 'Conclusion', content: 'Summarizes key findings and suggests future research directions...' }
        ]
      }
    },
    {
      id: 2,
      title: 'Academic Writing Style',
      description: 'Master the formal, objective tone required for academic writing',
      category: 'writing-style',
      readTime: '12 min read',
      difficulty: 'Intermediate',
      tags: ['style', 'tone', 'academic'],
      content: {
        introduction: 'Academic writing requires a formal, objective, and precise style that differs significantly from casual writing...',
        sections: [
          { title: 'Formal Tone', content: 'Use formal language and avoid contractions, colloquialisms, and personal opinions...' },
          { title: 'Objective Voice', content: 'Write in third person and present information objectively...' },
          { title: 'Precise Language', content: 'Choose specific, accurate words and avoid vague generalizations...' },
          { title: 'Active vs Passive Voice', content: 'Prefer active voice for clarity, but use passive voice when appropriate...' }
        ]
      }
    },
    {
      id: 3,
      title: 'APA Citation Guide',
      description: 'Complete guide to APA 7th edition citation format',
      category: 'citations',
      readTime: '15 min read',
      difficulty: 'Intermediate',
      tags: ['apa', 'citations', 'references'],
      content: {
        introduction: 'The American Psychological Association (APA) style is widely used in psychology, education, and social sciences...',
        sections: [
          { title: 'In-Text Citations', content: 'Format: (Author, Year) or (Author, Year, p. #) for direct quotes...' },
          { title: 'Reference List', content: 'Alphabetical list of all sources cited in your paper...' },
          { title: 'Journal Articles', content: 'Author, A. A. (Year). Title of article. Title of Journal, Volume(Issue), pages...' },
          { title: 'Books', content: 'Author, A. A. (Year). Title of book. Publisher...' }
        ]
      }
    }
  ];

  const writingTips = [
    {
      category: 'Planning',
      tips: [
        'Start with a detailed outline before writing',
        'Define your research question clearly',
        'Gather all sources before you begin writing',
        'Set realistic deadlines for each section'
      ]
    },
    {
      category: 'Drafting',
      tips: [
        'Write your first draft without worrying about perfection',
        'Focus on getting your ideas down on paper',
        'Use topic sentences to guide each paragraph',
        'Connect paragraphs with transitional phrases'
      ]
    },
    {
      category: 'Revision',
      tips: [
        'Let your draft sit for at least 24 hours before revising',
        'Read your work aloud to catch awkward phrasing',
        'Check for logical flow between sections',
        'Ensure each paragraph supports your main argument'
      ]
    },
    {
      category: 'Editing',
      tips: [
        'Proofread for grammar, spelling, and punctuation',
        'Check citation format consistency',
        'Verify all facts and figures',
        'Ensure your writing meets style guide requirements'
      ]
    }
  ];

  const commonMistakes = [
    {
      mistake: 'Plagiarism',
      description: 'Using someone else\'s words or ideas without proper attribution',
      solution: 'Always cite your sources and use quotation marks for direct quotes',
      severity: 'Critical'
    },
    {
      mistake: 'Weak thesis statement',
      description: 'A thesis that is too broad, vague, or not arguable',
      solution: 'Make your thesis specific, clear, and debatable',
      severity: 'High'
    },
    {
      mistake: 'Poor paragraph structure',
      description: 'Paragraphs without clear topic sentences or logical flow',
      solution: 'Start each paragraph with a topic sentence and use supporting evidence',
      severity: 'Medium'
    },
    {
      mistake: 'Inconsistent citation format',
      description: 'Mixing different citation styles or formatting incorrectly',
      solution: 'Choose one citation style and apply it consistently throughout',
      severity: 'Medium'
    },
    {
      mistake: 'Wordiness and redundancy',
      description: 'Using too many words to express simple ideas',
      solution: 'Edit ruthlessly and choose precise, concise language',
      severity: 'Low'
    }
  ];

  const templates = [
    {
      type: 'Research Paper',
      description: 'Standard research paper template with all essential sections',
      disciplines: ['Psychology', 'Sociology', 'Education'],
      pages: 15,
      download: '#'
    },
    {
      type: 'Literature Review',
      description: 'Comprehensive literature review structure and organization',
      disciplines: ['All disciplines'],
      pages: 10,
      download: '#'
    },
    {
      type: 'Thesis Proposal',
      description: 'Graduate thesis proposal with methodology section',
      disciplines: ['Graduate studies'],
      pages: 20,
      download: '#'
    },
    {
      type: 'Lab Report',
      description: 'Scientific lab report template for STEM fields',
      disciplines: ['Biology', 'Chemistry', 'Physics'],
      pages: 8,
      download: '#'
    }
  ];

  const renderOverview = () => (
    <div className="space-y-12">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-200">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Academic Writing Resources</h2>
        <p className="text-lg text-gray-700 mb-6">
          Master the art of academic writing with our comprehensive guides, templates, and tools. 
          Whether you're a student, researcher, or academic professional, these resources will help you 
          communicate your ideas effectively and professionally.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-4 shadow-md">
            <div className="text-2xl mb-2">📚</div>
            <h3 className="font-semibold text-gray-900 mb-2">Comprehensive Guides</h3>
            <p className="text-sm text-gray-600">Step-by-step instructions for every type of academic document</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-md">
            <div className="text-2xl mb-2">📄</div>
            <h3 className="font-semibold text-gray-900 mb-2">Ready-to-Use Templates</h3>
            <p className="text-sm text-gray-600">Professional templates for research papers, proposals, and more</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-md">
            <div className="text-2xl mb-2">🎯</div>
            <h3 className="font-semibold text-gray-900 mb-2">Expert Tips</h3>
            <p className="text-sm text-gray-600">Proven strategies from experienced academic writers</p>
          </div>
        </div>
      </div>

      {/* Quick Tips */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Writing Process Tips</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {writingTips.map((category, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">{category.category}</h3>
              <ul className="space-y-3">
                {category.tips.map((tip, tipIndex) => (
                  <li key={tipIndex} className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Guides */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Guides</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {guides.slice(0, 3).map((guide) => (
            <div key={guide.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    guide.difficulty === 'Beginner' ? 'bg-green-100 text-green-800' :
                    guide.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {guide.difficulty}
                  </span>
                  <span className="text-sm text-gray-500">{guide.readTime}</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{guide.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{guide.description}</p>
                <div className="flex flex-wrap gap-1 mb-4">
                  {guide.tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
                <button 
                  onClick={() => setExpandedGuide(guide.id)}
                  className="text-blue-600 hover:text-blue-500 font-medium text-sm"
                >
                  Read Guide →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCommonMistakes = () => (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Common Academic Writing Mistakes</h2>
        <p className="text-gray-600">
          Learn from the most frequent errors in academic writing and how to avoid them.
        </p>
      </div>
      
      {commonMistakes.map((mistake, index) => (
        <div key={index} className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900">{mistake.mistake}</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              mistake.severity === 'Critical' ? 'bg-red-100 text-red-800' :
              mistake.severity === 'High' ? 'bg-orange-100 text-orange-800' :
              mistake.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {mistake.severity} Priority
            </span>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Problem:</h4>
              <p className="text-gray-700">{mistake.description}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Solution:</h4>
              <p className="text-gray-700">{mistake.solution}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderTemplates = () => (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Document Templates</h2>
        <p className="text-gray-600">
          Professional templates to jumpstart your academic writing projects.
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        {templates.map((template, index) => (
          <div key={index} className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{template.type}</h3>
                <p className="text-gray-600 mb-3">{template.description}</p>
              </div>
              <div className="text-3xl">📄</div>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Disciplines:</span>
                <span className="text-gray-700">{template.disciplines.join(', ')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Length:</span>
                <span className="text-gray-700">{template.pages} pages</span>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                Download Template
              </button>
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                Preview
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderGuideContent = (guide) => (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="mb-6">
        <button 
          onClick={() => setExpandedGuide(null)}
          className="text-blue-600 hover:text-blue-500 mb-4 flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back to guides</span>
        </button>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{guide.title}</h1>
        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-6">
          <span>{guide.readTime}</span>
          <span>•</span>
          <span>{guide.difficulty}</span>
          <span>•</span>
          <span>{guide.category}</span>
        </div>
        <p className="text-lg text-gray-700">{guide.content.introduction}</p>
      </div>
      
      <div className="space-y-6">
        {guide.content.sections.map((section, index) => (
          <div key={index} className="border-l-4 border-blue-500 pl-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">{section.title}</h2>
            <p className="text-gray-700 leading-relaxed">{section.content}</p>
          </div>
        ))}
      </div>
      
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Pro Tip</h3>
        <p className="text-blue-800">
          Use AcademicAI to get instant feedback on your writing and ensure you're following these guidelines correctly.
        </p>
      </div>
    </div>
  );

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
          <button onClick={() => onNavigate('help')} className="text-gray-600 hover:text-gray-900 transition-colors">Help</button>
          <button className="text-blue-600 font-medium">Writing Guide</button>
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
        {expandedGuide ? (
          renderGuideContent(guides.find(g => g.id === expandedGuide))
        ) : (
          <div className="flex">
            {/* Sidebar */}
            <div className="w-64 mr-8">
              <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
                <h3 className="font-semibold text-gray-900 mb-4">Writing Resources</h3>
                <nav className="space-y-2">
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-colors ${
                        activeSection === section.id
                          ? 'bg-blue-50 text-blue-600 border border-blue-200'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <span className="text-lg">{section.icon}</span>
                      <span className="font-medium">{section.name}</span>
                    </button>
                  ))}
                </nav>
                
                {/* CTA */}
                <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-gray-900 mb-2">Ready to write?</h4>
                  <p className="text-sm text-gray-600 mb-4">Put these tips into practice with AI-powered feedback.</p>
                  <button 
                    onClick={() => onNavigate('upload')}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded-lg text-sm font-medium hover:shadow-lg transition-all duration-300"
                  >
                    Analyze Your Writing
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              {activeSection === 'overview' && renderOverview()}
              {activeSection === 'common-mistakes' && renderCommonMistakes()}
              {activeSection === 'templates' && renderTemplates()}
              
              {/* Other sections would go here */}
              {!['overview', 'common-mistakes', 'templates'].includes(activeSection) && (
                <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">{sections.find(s => s.id === activeSection)?.icon}</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    {sections.find(s => s.id === activeSection)?.name}
                  </h2>
                  <p className="text-gray-600 mb-6">
                    This section is coming soon! We're working on comprehensive guides for this topic.
                  </p>
                  <button 
                    onClick={() => onNavigate('contact')}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Request This Content
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WritingGuidePage;