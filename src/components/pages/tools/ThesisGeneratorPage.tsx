import { useState, useEffect } from 'react';
import Header from '../../common/Header';
import Footer from '../../common/Footer';

interface ThesisGeneratorPageProps {
  onNavigate: (page: string) => void;
  user?: any;
  onLogout: () => void;
}

type EssayType = 'argumentative' | 'expository' | 'analytical' | 'compare-contrast';

const ThesisGeneratorPage = ({ onNavigate, user, onLogout }: ThesisGeneratorPageProps) => {
  const [essayType, setEssayType] = useState<EssayType>('argumentative');
  const [topic, setTopic] = useState('');
  const [position, setPosition] = useState('');
  const [reason1, setReason1] = useState('');
  const [reason2, setReason2] = useState('');
  const [reason3, setReason3] = useState('');
  const [subject1, setSubject1] = useState('');
  const [subject2, setSubject2] = useState('');
  const [thesis, setThesis] = useState('');
  const [copied, setCopied] = useState(false);

  // SEO: Set page title and meta description
  useEffect(() => {
    document.title = 'Free Thesis Statement Generator - Create Strong Arguments | WriteScholar';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Free thesis statement generator. Create strong thesis statements for argumentative, expository, and analytical essays. Get instant results with no signup required.');
    }
  }, []);

  const generateThesis = () => {
    if (!topic) return;

    let result = '';

    if (essayType === 'argumentative') {
      if (position && (reason1 || reason2 || reason3)) {
        const reasons = [reason1, reason2, reason3].filter(Boolean);
        if (reasons.length === 1) {
          result = `${topic} ${position} because ${reasons[0]}.`;
        } else if (reasons.length === 2) {
          result = `${topic} ${position} because ${reasons[0]} and ${reasons[1]}.`;
        } else {
          result = `${topic} ${position} because ${reasons[0]}, ${reasons[1]}, and ${reasons[2]}.`;
        }
      } else if (position) {
        result = `${topic} ${position}.`;
      } else {
        result = `This essay will argue that ${topic}.`;
      }
    } else if (essayType === 'expository') {
      if (reason1 || reason2 || reason3) {
        const points = [reason1, reason2, reason3].filter(Boolean);
        if (points.length === 1) {
          result = `${topic} can be understood through examining ${points[0]}.`;
        } else if (points.length === 2) {
          result = `${topic} can be understood through examining ${points[0]} and ${points[1]}.`;
        } else {
          result = `${topic} can be understood through examining ${points[0]}, ${points[1]}, and ${points[2]}.`;
        }
      } else {
        result = `This essay will explain ${topic} by examining its key components and significance.`;
      }
    } else if (essayType === 'analytical') {
      if (position && (reason1 || reason2)) {
        const aspects = [reason1, reason2, reason3].filter(Boolean);
        if (aspects.length === 1) {
          result = `Through analysis of ${aspects[0]}, it becomes clear that ${topic} ${position}.`;
        } else if (aspects.length >= 2) {
          result = `Through analysis of ${aspects.slice(0, -1).join(', ')} and ${aspects[aspects.length - 1]}, it becomes clear that ${topic} ${position}.`;
        }
      } else if (position) {
        result = `Upon closer examination, ${topic} reveals that ${position}.`;
      } else {
        result = `A careful analysis of ${topic} reveals important insights about its nature and significance.`;
      }
    } else if (essayType === 'compare-contrast') {
      if (subject1 && subject2) {
        if (position) {
          result = `While ${subject1} and ${subject2} share some similarities, ${position}, making ${topic} a complex issue to evaluate.`;
        } else if (reason1 && reason2) {
          result = `Although ${subject1} and ${subject2} both relate to ${topic}, they differ significantly in terms of ${reason1} and ${reason2}.`;
        } else {
          result = `${subject1} and ${subject2} present both similarities and differences when examined in the context of ${topic}.`;
        }
      } else {
        result = `This essay will compare and contrast different aspects of ${topic} to reveal key insights.`;
      }
    }

    setThesis(result.charAt(0).toUpperCase() + result.slice(1));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(thesis);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const essayTypes = [
    { value: 'argumentative', label: 'Argumentative', description: 'Take a position and defend it' },
    { value: 'expository', label: 'Expository', description: 'Explain or inform' },
    { value: 'analytical', label: 'Analytical', description: 'Analyze and interpret' },
    { value: 'compare-contrast', label: 'Compare/Contrast', description: 'Examine similarities & differences' },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #FAF8F5 0%, #F5F3F0 100%)' }}>
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="thesis-generator" />

      {/* Hero Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-teal-50/50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto">
            {/* Cute Character - Young person with modern hair */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-teal-100 mb-6 shadow-lg shadow-teal-100">
              <svg viewBox="0 0 56 56" fill="none" className="w-16 h-16">
                <circle cx="28" cy="28" r="28" fill="#CCFBF1"/>
                {/* Hair - smooth dome on top, soft sides */}
                <path d="M14 18 Q14 4 28 4 Q42 4 42 18 Q42 26 28 27 Q14 26 14 18" fill="#14B8A6"/>
                <path d="M14 20 Q8 35 14 45" stroke="#14B8A6" strokeWidth="4" fill="none" strokeLinecap="round"/>
                <path d="M42 20 Q48 35 42 45" stroke="#14B8A6" strokeWidth="4" fill="none" strokeLinecap="round"/>
                <ellipse cx="28" cy="30" rx="14" ry="15" fill="#FCD9B6"/>
                <ellipse cx="22" cy="32" rx="3" ry="3.5" fill="#1F2937"/>
                <ellipse cx="34" cy="32" rx="3" ry="3.5" fill="#1F2937"/>
                <circle cx="23" cy="31" r="1" fill="white"/>
                <circle cx="35" cy="31" r="1" fill="white"/>
                <path d="M24 42 Q28 48 32 42" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round"/>
                <ellipse cx="17" cy="37" rx="3" ry="2" fill="#FECACA" opacity="0.5"/>
                <ellipse cx="39" cy="37" rx="3" ry="2" fill="#FECACA" opacity="0.5"/>
              </svg>
            </div>
            <span className="inline-flex items-center px-4 py-1.5 bg-teal-100 text-teal-700 rounded-full text-sm font-semibold mb-5">
              Free Tool
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-5 leading-tight">
              Thesis Statement Generator
            </h1>
            <p className="text-lg text-gray-500 leading-relaxed max-w-2xl mx-auto">
              Create a strong thesis statement for your essay. Fill in the blanks and get a properly structured thesis for argumentative, expository, or analytical essays.
            </p>
          </div>
        </div>
      </section>

      {/* Main Tool Section */}
      <section className="py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow">
            {/* Essay Type Selection */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-900 mb-3">Essay Type</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {essayTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setEssayType(type.value as EssayType)}
                    className={`p-3 rounded-xl text-left transition-all border-2 ${
                      essayType === type.value
                        ? 'bg-teal-50 border-teal-500 text-teal-700'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-semibold text-sm">{type.label}</div>
                    <div className="text-xs opacity-70 mt-0.5">{type.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Topic / Subject</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., social media usage among teenagers"
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition-all"
                />
              </div>

              {essayType === 'compare-contrast' && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Subject 1</label>
                    <input
                      type="text"
                      value={subject1}
                      onChange={(e) => setSubject1(e.target.value)}
                      placeholder="e.g., traditional education"
                      className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Subject 2</label>
                    <input
                      type="text"
                      value={subject2}
                      onChange={(e) => setSubject2(e.target.value)}
                      placeholder="e.g., online learning"
                      className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              {(essayType === 'argumentative' || essayType === 'analytical') && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    {essayType === 'argumentative' ? 'Your Position / Claim' : 'Your Analysis / Interpretation'}
                  </label>
                  <input
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder={essayType === 'argumentative' 
                      ? "e.g., has negative effects on mental health" 
                      : "e.g., reveals underlying themes of isolation"
                    }
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition-all"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  {essayType === 'expository' ? 'Key Points to Explain' : 
                   essayType === 'analytical' ? 'Elements to Analyze' :
                   essayType === 'compare-contrast' ? 'Points of Comparison' :
                   'Supporting Reasons'}
                </label>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={reason1}
                    onChange={(e) => setReason1(e.target.value)}
                    placeholder={essayType === 'expository' ? "Point 1" : "Reason / Element 1"}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition-all"
                  />
                  <input
                    type="text"
                    value={reason2}
                    onChange={(e) => setReason2(e.target.value)}
                    placeholder={essayType === 'expository' ? "Point 2" : "Reason / Element 2"}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition-all"
                  />
                  <input
                    type="text"
                    value={reason3}
                    onChange={(e) => setReason3(e.target.value)}
                    placeholder={essayType === 'expository' ? "Point 3 (optional)" : "Reason / Element 3 (optional)"}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition-all"
                  />
                </div>
              </div>

              <button
                onClick={generateThesis}
                className="w-full py-3.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
              >
                Generate Thesis Statement
              </button>
            </div>

            {/* Generated Thesis */}
            {thesis && (
              <div className="mt-8 p-6 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl border border-teal-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">Your Thesis Statement</h3>
                  <button
                    onClick={handleCopy}
                    className={`px-4 py-2 text-sm rounded-lg transition-all font-medium ${
                      copied
                        ? 'bg-green-100 text-green-700'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="text-gray-800 text-lg leading-relaxed">{thesis}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Tips Section */}
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">What Makes a Strong Thesis?</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Specific</h3>
              <p className="text-gray-600 text-sm">Avoid vague language. Be precise about your topic and argument.</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Arguable</h3>
              <p className="text-gray-600 text-sm">Present a claim someone could disagree with, not a statement of fact.</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Concise</h3>
              <p className="text-gray-600 text-sm">Keep it to one or two sentences. Every word should count.</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Roadmap</h3>
              <p className="text-gray-600 text-sm">Preview your main points to guide readers through your essay.</p>
            </div>
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
            WriteScholar can analyze your completed essay and provide AI-powered feedback on structure, grammar, and academic style.
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

export default ThesisGeneratorPage;
