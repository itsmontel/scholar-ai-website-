import React, { useState } from 'react';

const AnalysisPage = ({ onNavigate }) => {
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);

  const annotations = [
    {
      id: 1,
      type: 'strength',
      title: 'Strong Opening',
      text: 'Excellent introduction that clearly establishes the scope and focus of your research. The specification of particular biomes helps set clear boundaries for your study.',
      position: { start: 0, end: 150 }
    },
    {
      id: 2,
      type: 'suggestion',
      title: 'Consider Clarification',
      text: 'While your methodology is sound, consider adding more detail about your sample selection criteria and potential limitations of the datasets used.',
      position: { start: 250, end: 400 }
    },
    {
      id: 3,
      type: 'improvement',
      title: 'Citation Enhancement',
      text: 'Your argument would be strengthened by including more recent studies from 2022-2023 that address climate adaptation strategies.',
      position: { start: 500, end: 650 }
    }
  ];

  const documentText = `This research paper examines the multifaceted impacts of climate change on global ecosystems, with a particular focus on marine, forest, and tundra biomes. Through analysis of recent scientific literature and case studies from diverse geographical regions, we assess both the direct effects of rising temperatures and the cascading consequences for biodiversity, ecosystem services, and human communities dependent on these natural systems.

The findings suggest that while certain ecosystems demonstrate resilience through adaptation, the unprecedented rate of anthropogenic climate change poses significant challenges for many species and habitats. Marine ecosystems, particularly coral reefs, show acute vulnerability to ocean acidification and thermal stress.

Forest ecosystems across different latitudes exhibit varied responses, with boreal forests experiencing increased fire frequency while tropical rainforests face altered precipitation patterns. The Arctic tundra represents perhaps the most dramatic example of ecosystem transformation, with permafrost thaw releasing stored carbon and fundamentally altering the landscape.

Our analysis reveals complex feedback loops between ecosystem degradation and climate acceleration, highlighting the urgent need for comprehensive conservation strategies that account for both mitigation and adaptation measures.`;

  const getAnnotationStyle = (type) => {
    switch (type) {
      case 'strength':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'suggestion':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'improvement':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const handleAnnotationClick = (annotation) => {
    setSelectedAnnotation(annotation);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar with Document List */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="flex items-center space-x-2 p-6 border-b border-gray-200">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="text-xl font-bold text-gray-900">AcademicAI</span>
        </div>

        {/* Back Button */}
        <div className="p-4 border-b border-gray-200">
          <button 
            onClick={() => onNavigate('dashboard')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Documents</span>
          </button>
        </div>

        {/* Document List */}
        <div className="flex-1 p-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">My Documents</h3>
          <div className="space-y-2">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm font-medium text-blue-900">Climate Change Research.docx</span>
              </div>
            </div>
            <div className="p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm text-gray-700">Literature Review.pdf</span>
              </div>
            </div>
            <div className="p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm text-gray-700">Economics Thesis.docx</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Document Viewer */}
        <div className="flex-1 bg-white">
          {/* Header */}
          <header className="border-b border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">The Impact of Climate Change on Global Ecosystems</h1>
                <p className="text-gray-600">By Alex Morgan | Stanford University | May 15, 2023</p>
              </div>
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => setShowSidebar(!showSidebar)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </header>

          {/* Document Content */}
          <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Abstract</h2>
              <div className="prose prose-lg text-gray-700 leading-relaxed">
                {documentText.split('').map((char, index) => {
                  const annotation = annotations.find(ann => 
                    index >= ann.position.start && index <= ann.position.end
                  );
                  
                  if (annotation) {
                    return (
                      <span
                        key={index}
                        className={`relative cursor-pointer rounded px-1 border-b-2 ${getAnnotationStyle(annotation.type)}`}
                        onClick={() => handleAnnotationClick(annotation)}
                        title={annotation.title}
                      >
                        {char}
                      </span>
                    );
                  }
                  return <span key={index}>{char}</span>;
                })}
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Introduction</h2>
              <div className="prose prose-lg text-gray-700 leading-relaxed">
                <p>Climate change represents one of the most pressing challenges of the 21st century, with far-reaching implications for global ecosystems and biodiversity. The accelerating pace of environmental change, driven primarily by anthropogenic factors, has created unprecedented pressures on natural systems worldwide.</p>
                
                <p>This paper seeks to provide a comprehensive analysis of how climate change affects different ecosystem types, examining both the direct impacts of rising temperatures and the indirect consequences that cascade through ecological networks.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Analysis Sidebar */}
        {showSidebar && (
          <div className="w-80 bg-gray-50 border-l border-gray-200 p-6">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-2">Document Analysis</h2>
              <p className="text-sm text-gray-600">AI-generated feedback and suggestions</p>
            </div>

            {/* Overall Assessment */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Overall Assessment</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">Structure & Organization</span>
                    <span className="text-sm font-medium text-green-600">92%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">Content Quality</span>
                    <span className="text-sm font-medium text-blue-600">85%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">Grammar & Style</span>
                    <span className="text-sm font-medium text-green-600">90%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '90%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">Citations & References</span>
                    <span className="text-sm font-medium text-yellow-600">78%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Annotations */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Annotations</h3>
              <div className="space-y-3">
                {annotations.map((annotation) => (
                  <div
                    key={annotation.id}
                    onClick={() => handleAnnotationClick(annotation)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedAnnotation?.id === annotation.id
                        ? getAnnotationStyle(annotation.type) + ' ring-2 ring-offset-2'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        annotation.type === 'strength' ? 'bg-green-500' :
                        annotation.type === 'suggestion' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`}></div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm">{annotation.title}</h4>
                        <p className="text-xs text-gray-600 mt-1">{annotation.text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button 
                onClick={() => onNavigate('upload')}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-300"
              >
                Upload New Version
              </button>
              <button className="w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                Export Analysis
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisPage;