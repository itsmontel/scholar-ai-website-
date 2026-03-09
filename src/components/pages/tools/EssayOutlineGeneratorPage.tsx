import { useState, useEffect } from 'react';
import Header from '../../common/Header';
import Footer from '../../common/Footer';
import ScholarMascot from '../../common/ScholarMascot';

interface EssayOutlineGeneratorPageProps {
  onNavigate: (page: string) => void;
  user?: any;
  onLogout: () => void;
}

type EssayType = 'argumentative' | 'expository' | 'narrative' | 'compare-contrast' | 'persuasive' | 'research';

interface OutlineSection {
  title: string;
  points: string[];
  tips: string;
}

const EssayOutlineGeneratorPage = ({ onNavigate, user, onLogout }: EssayOutlineGeneratorPageProps) => {
  const [essayType, setEssayType] = useState<EssayType>('argumentative');
  const [topic, setTopic] = useState('');
  const [thesis, setThesis] = useState('');
  const [numBodyParagraphs, setNumBodyParagraphs] = useState(3);
  const [outline, setOutline] = useState<OutlineSection[] | null>(null);
  const [copied, setCopied] = useState(false);

  // SEO: Set page title and meta description
  useEffect(() => {
    document.title = 'Free Essay Outline Generator - Structure Your Essay | WriteScholar';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Free essay outline generator. Create organized outlines for argumentative, expository, narrative, and research essays. Get a structured template instantly. No signup required.');
    }
  }, []);

  const essayTypes = [
    { value: 'argumentative', label: 'Argumentative', icon: '⚔️', description: 'Defend a position with evidence' },
    { value: 'expository', label: 'Expository', icon: '📖', description: 'Explain or inform about a topic' },
    { value: 'narrative', label: 'Narrative', icon: '📝', description: 'Tell a story or share an experience' },
    { value: 'compare-contrast', label: 'Compare/Contrast', icon: '⚖️', description: 'Analyze similarities & differences' },
    { value: 'persuasive', label: 'Persuasive', icon: '🎯', description: 'Convince the reader to act' },
    { value: 'research', label: 'Research', icon: '🔬', description: 'Present findings from research' }
  ];

  const generateOutline = () => {
    const topicText = topic || '[Your Topic]';
    const thesisText = thesis || '[Your thesis statement here]';

    let sections: OutlineSection[] = [];

    if (essayType === 'argumentative') {
      sections = [
        {
          title: 'I. Introduction',
          points: [
            'Hook: Start with a compelling fact, question, or statement about ' + topicText,
            'Background: Provide context on the issue',
            'Thesis: ' + thesisText
          ],
          tips: 'Make your position clear from the start'
        },
        ...Array.from({ length: numBodyParagraphs }, (_, i) => ({
          title: `II${i > 0 ? String.fromCharCode(65 + i - 1) : ''}. Body Paragraph ${i + 1}`,
          points: i === numBodyParagraphs - 1 ? [
            'Counterargument: Acknowledge the opposing view',
            'Refutation: Explain why your position is stronger',
            'Evidence: Support with facts or examples',
            'Analysis: Connect back to your thesis'
          ] : [
            `Argument ${i + 1}: Present your ${i === 0 ? 'strongest' : 'supporting'} point`,
            'Evidence: Cite sources, statistics, or examples',
            'Explanation: Analyze how this supports your thesis',
            'Transition: Connect to the next point'
          ],
          tips: i === numBodyParagraphs - 1 ? 'Address counterarguments to strengthen your position' : 'Start with your strongest argument'
        })),
        {
          title: 'III. Conclusion',
          points: [
            'Restate thesis in new words',
            'Summarize key arguments',
            'End with a call to action or broader implication'
          ],
          tips: "Don't introduce new arguments here"
        }
      ];
    } else if (essayType === 'expository') {
      sections = [
        {
          title: 'I. Introduction',
          points: [
            'Hook: Interesting fact or question about ' + topicText,
            'Context: Brief background information',
            'Thesis: ' + thesisText + ' (what you will explain)'
          ],
          tips: 'Remain objective - expository essays inform, not persuade'
        },
        ...Array.from({ length: numBodyParagraphs }, (_, i) => ({
          title: `II. Body Paragraph ${i + 1}`,
          points: [
            `Main Point ${i + 1}: Aspect of ${topicText} to explain`,
            'Definition/Description: Clarify key terms or concepts',
            'Examples: Provide concrete illustrations',
            'Transition: Lead into the next topic'
          ],
          tips: 'Use clear, logical organization'
        })),
        {
          title: 'III. Conclusion',
          points: [
            'Restate the main idea',
            'Summarize key points covered',
            'End with significance or implications'
          ],
          tips: 'Leave readers with a clear understanding'
        }
      ];
    } else if (essayType === 'narrative') {
      sections = [
        {
          title: 'I. Introduction',
          points: [
            'Setting: When and where does this take place?',
            'Characters: Who is involved?',
            'Hook: Draw readers into the story',
            'Foreshadowing: Hint at what\'s to come'
          ],
          tips: 'Use vivid, sensory details'
        },
        {
          title: 'II. Rising Action',
          points: [
            'Event 1: Begin the sequence of events',
            'Conflict: Introduce the central challenge or tension',
            'Development: Build tension through actions and dialogue'
          ],
          tips: 'Show, don\'t tell - use specific details'
        },
        {
          title: 'III. Climax',
          points: [
            'Peak moment: The turning point of the story',
            'Key decision or revelation',
            'Maximum tension or emotion'
          ],
          tips: 'This should be the most intense moment'
        },
        {
          title: 'IV. Falling Action & Resolution',
          points: [
            'Immediate aftermath of the climax',
            'How characters/situations changed',
            'Resolution: How things settle'
          ],
          tips: 'Tie up loose ends'
        },
        {
          title: 'V. Conclusion',
          points: [
            'Reflection: What was learned?',
            'Significance: Why does this story matter?',
            'Final thought: Leave a lasting impression'
          ],
          tips: 'Connect the experience to a broader meaning'
        }
      ];
    } else if (essayType === 'compare-contrast') {
      sections = [
        {
          title: 'I. Introduction',
          points: [
            'Hook: Engage reader with the subjects being compared',
            'Introduce Subject A and Subject B',
            'Thesis: ' + thesisText + ' (what the comparison reveals)'
          ],
          tips: 'Clearly identify what you\'re comparing and why'
        },
        {
          title: 'II. Body - Similarities',
          points: [
            'Similarity 1: How A and B are alike',
            'Evidence/Examples for both subjects',
            'Similarity 2: Another shared characteristic',
            'Supporting details'
          ],
          tips: 'Use transition words like "similarly," "likewise"'
        },
        {
          title: 'III. Body - Differences',
          points: [
            'Difference 1: How A and B differ',
            'Evidence/Examples for contrast',
            'Difference 2: Another key distinction',
            'Supporting details'
          ],
          tips: 'Use transition words like "however," "in contrast"'
        },
        {
          title: 'IV. Analysis',
          points: [
            'Significance of similarities/differences',
            'Which subject is preferable (if applicable)?',
            'What do these comparisons reveal?'
          ],
          tips: 'Go beyond listing - analyze the implications'
        },
        {
          title: 'V. Conclusion',
          points: [
            'Restate thesis',
            'Summary of key comparisons',
            'Final insight or recommendation'
          ],
          tips: 'Leave readers with a clear understanding of your analysis'
        }
      ];
    } else if (essayType === 'persuasive') {
      sections = [
        {
          title: 'I. Introduction',
          points: [
            'Hook: Grab attention with a bold statement or question',
            'Background: Establish the issue',
            'Thesis: ' + thesisText + ' (your position and call to action)'
          ],
          tips: 'Appeal to emotion early to engage readers'
        },
        ...Array.from({ length: numBodyParagraphs }, (_, i) => ({
          title: `II. Body Paragraph ${i + 1}`,
          points: i === numBodyParagraphs - 1 ? [
            'Address potential objections',
            'Explain why they don\'t undermine your position',
            'Reinforce your main argument'
          ] : [
            `Reason ${i + 1}: Why readers should agree/act`,
            'Evidence: Facts, statistics, expert opinions',
            'Emotional appeal: How does this affect people?',
            'Transition to next reason'
          ],
          tips: i === numBodyParagraphs - 1 ? 'Acknowledging objections builds credibility' : 'Combine logic (logos) with emotion (pathos)'
        })),
        {
          title: 'III. Conclusion',
          points: [
            'Restate your position strongly',
            'Summarize key reasons',
            'Clear call to action: What should readers do?',
            'End with powerful final statement'
          ],
          tips: 'Leave readers motivated to act'
        }
      ];
    } else if (essayType === 'research') {
      sections = [
        {
          title: 'I. Introduction',
          points: [
            'Hook: Why this research matters',
            'Background: Context and existing knowledge',
            'Research question or problem',
            'Thesis: ' + thesisText
          ],
          tips: 'Establish the gap your research addresses'
        },
        {
          title: 'II. Literature Review',
          points: [
            'Summary of existing research',
            'Key theories and findings',
            'Gaps or controversies in the field',
            'How your research fits in'
          ],
          tips: 'Cite sources properly using your required style'
        },
        {
          title: 'III. Methodology (if applicable)',
          points: [
            'Research approach and design',
            'Data collection methods',
            'Analysis techniques',
            'Limitations'
          ],
          tips: 'Be specific enough that others could replicate'
        },
        {
          title: 'IV. Findings/Discussion',
          points: [
            'Present your main findings',
            'Analyze what the data shows',
            'Connect to your thesis and literature',
            'Address unexpected results'
          ],
          tips: 'Use evidence to support every claim'
        },
        {
          title: 'V. Conclusion',
          points: [
            'Summarize key findings',
            'Answer the research question',
            'Implications and significance',
            'Suggestions for future research'
          ],
          tips: "Don't overstate your conclusions"
        }
      ];
    }

    setOutline(sections);
  };

  const copyOutline = () => {
    if (!outline) return;
    
    let text = `Essay Outline: ${topic || 'My Essay'}\n`;
    text += `Type: ${essayTypes.find(t => t.value === essayType)?.label}\n`;
    text += `Thesis: ${thesis || '[Your thesis statement]'}\n\n`;
    
    outline.forEach(section => {
      text += `${section.title}\n`;
      section.points.forEach(point => {
        text += `  • ${point}\n`;
      });
      text += '\n';
    });
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #FAF8F5 0%, #F5F3F0 100%)' }}>
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="essay-outline" />

      {/* Hero Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-indigo-50/50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center mb-6">
              <ScholarMascot size={80} animated={false} pose="default" />
            </div>
            <span className="inline-flex items-center px-4 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold mb-5">
              Free Tool
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-5 leading-tight">
              Essay Outline Generator
            </h1>
            <p className="text-lg text-gray-500 leading-relaxed max-w-2xl mx-auto">
              Get a structured outline for your essay based on the type of writing. Perfect for planning argumentative, expository, narrative, and more.
            </p>
          </div>
        </div>
      </section>

      {/* Main Tool Section */}
      <section className="py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Input Form */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Essay Details</h2>
              
              {/* Essay Type Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Essay Type</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {essayTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setEssayType(type.value as EssayType)}
                      className={`p-3 rounded-xl text-left transition-all ${
                        essayType === type.value
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="text-lg mb-1">{type.icon}</div>
                      <div className="font-medium text-sm">{type.label}</div>
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {essayTypes.find(t => t.value === essayType)?.description}
                </p>
              </div>

              {/* Topic */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Essay Topic (optional)</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Climate Change and Its Effects"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Thesis */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Thesis Statement (optional)</label>
                <textarea
                  value={thesis}
                  onChange={(e) => setThesis(e.target.value)}
                  placeholder="e.g., Climate change poses significant threats to global ecosystems and requires immediate action..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none h-20"
                />
              </div>

              {/* Body Paragraphs */}
              {(essayType === 'argumentative' || essayType === 'expository' || essayType === 'persuasive') && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Number of Body Paragraphs</label>
                  <div className="flex items-center space-x-3">
                    {[2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        onClick={() => setNumBodyParagraphs(num)}
                        className={`w-12 h-12 rounded-xl font-medium transition-all ${
                          numBodyParagraphs === num
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={generateOutline}
                className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
              >
                Generate Outline
              </button>
            </div>

            {/* Output Panel */}
            <div>
              {outline ? (
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Your Essay Outline</h3>
                    <button
                      onClick={copyOutline}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        copied
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  
                  <div className="space-y-6">
                    {outline.map((section, index) => (
                      <div key={index} className="border-l-4 border-indigo-500 pl-4">
                        <h4 className="font-semibold text-gray-900 mb-2">{section.title}</h4>
                        <ul className="space-y-1.5 mb-2">
                          {section.points.map((point, pIndex) => (
                            <li key={pIndex} className="text-sm text-gray-600 flex items-start">
                              <span className="text-indigo-500 mr-2">•</span>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                        <p className="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded inline-block">
                          💡 {section.tips}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center h-full flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Outline Will Appear Here</h3>
                  <p className="text-gray-500 text-sm mb-4">Select an essay type and click "Generate Outline"</p>
                  <div className="text-sm text-gray-400">
                    <p>Tip: Adding your topic and thesis makes the outline more personalized</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Essay Types Explained */}
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Understanding Essay Types</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {essayTypes.map((type) => (
              <div key={type.value} className="bg-white border border-gray-200 rounded-2xl p-6">
                <div className="text-3xl mb-3">{type.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{type.label}</h3>
                <p className="text-gray-600 text-sm mb-3">{type.description}</p>
                <p className="text-xs text-gray-500">
                  {type.value === 'argumentative' && 'Best for: debates, position papers, academic arguments'}
                  {type.value === 'expository' && 'Best for: explaining concepts, how-to guides, informative pieces'}
                  {type.value === 'narrative' && 'Best for: personal essays, memoirs, creative writing'}
                  {type.value === 'compare-contrast' && 'Best for: analyzing options, literary analysis, evaluations'}
                  {type.value === 'persuasive' && 'Best for: opinion pieces, calls to action, advocacy'}
                  {type.value === 'research' && 'Best for: academic papers, thesis work, scientific writing'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Ready to write your essay?
          </h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            WriteScholar can analyze your completed essay and provide AI-powered feedback on structure, grammar, citations, and academic style.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {user ? (
              <button 
                onClick={() => onNavigate('dashboard')}
                className="px-6 py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-colors"
              >
                Go to Dashboard
              </button>
            ) : (
              <>
                <button 
                  onClick={() => onNavigate('signup')}
                  className="px-6 py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-colors"
                >
                  Try WriteScholar Free
                </button>
                <button 
                  onClick={() => onNavigate('features')}
                  className="px-6 py-3 border border-gray-600 text-white font-medium rounded-xl hover:border-gray-500 transition-colors"
                >
                  Learn More
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

export default EssayOutlineGeneratorPage;
