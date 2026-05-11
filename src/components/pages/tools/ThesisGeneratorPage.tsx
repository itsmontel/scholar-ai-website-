import { useState, useEffect } from 'react';
import Header from '../../common/Header';
import Footer from '../../common/Footer';
import ScholarMascot from '../../common/ScholarMascot';
import { applyPageSeoTags, injectToolProductSchema, removeJsonLd } from '../../../utils/seo';
import ToolPageSeoContent from '../../common/ToolPageSeoContent';
import { thesisGenSeo } from '../../../data/toolSeoContent';

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

  // SEO: per-route title, description, canonical, OG, Twitter, plus tool schema.
  useEffect(() => {
    applyPageSeoTags({
      title: 'Free Thesis Statement Generator - Create Strong Arguments | WriteScholar',
      description: 'Free thesis statement generator. Create strong thesis statements for argumentative, expository, and analytical essays. Get instant results with no signup required.',
    });
    injectToolProductSchema({
      name: 'Thesis Statement Generator',
      description: 'Free thesis statement generator — builds strong, focused thesis statements for argumentative, expository, analytical, and compare-contrast essays.',
    });
    return () => removeJsonLd('tool-product');
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
    { value: 'argumentative', label: 'Argumentative', description: 'Take a position and defend it', color: '#A560E8', tint: '#F3EAFF', border: '#8A48C7' },
    { value: 'expository', label: 'Expository', description: 'Explain or inform', color: '#1CB0F6', tint: '#DDF4FF', border: '#1899D6' },
    { value: 'analytical', label: 'Analytical', description: 'Analyze and interpret', color: '#FF9600', tint: '#FFF4E0', border: '#D97F00' },
    { value: 'compare-contrast', label: 'Compare/Contrast', description: 'Examine similarities & differences', color: '#58CC02', tint: '#EAFFD6', border: '#46A302' },
  ];

  return (
    <div className="relative min-h-screen overflow-x-clip bg-stone-50 dark:bg-stone-950" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="thesis-generator" />

      {/* Hero Section */}
      <section className="pt-16 pb-10 sm:pt-20 sm:pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center mb-5">
              <ScholarMascot size={80} animated={false} pose="default" />
            </div>
            <span className="inline-flex items-center px-4 py-1.5 bg-[#F3EAFF] text-[#A560E8] rounded-xl border-2 border-b-4 border-[#A560E8]/30 text-sm font-extrabold mb-5">
              Free Tool
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-stone-800 dark:text-stone-100 mb-4 leading-tight tracking-tight">
              Thesis Statement Generator
            </h1>
            <p className="text-base text-stone-500 dark:text-stone-400 leading-relaxed max-w-2xl mx-auto font-bold">
              Create a strong thesis statement for your essay. Fill in the blanks and get a properly structured thesis for argumentative, expository, or analytical essays.
            </p>
          </div>
        </div>
      </section>

      {/* Main Tool Section */}
      <section className="pb-12 sm:pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-white dark:bg-stone-900 border-2 border-b-4 border-stone-200 dark:border-stone-700 rounded-2xl p-5 sm:p-8">
            {/* Essay Type Selection */}
            <div className="mb-8">
              <label className="block text-sm font-extrabold text-stone-700 dark:text-stone-300 mb-3 uppercase tracking-wide">Essay Type</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {essayTypes.map((type) => {
                  const isActive = essayType === type.value;
                  return (
                    <button
                      key={type.value}
                      onClick={() => setEssayType(type.value as EssayType)}
                      className="p-3 rounded-xl text-left transition-all border-2 border-b-4 active:border-b-2 active:translate-y-0.5"
                      style={{
                        backgroundColor: isActive ? type.tint : undefined,
                        borderColor: isActive ? `${type.color}60` : undefined,
                      }}
                    >
                      <div className="font-extrabold text-sm text-stone-800 dark:text-stone-100">{type.label}</div>
                      <div className="text-xs text-stone-400 dark:text-stone-500 mt-0.5 font-bold">{type.description}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-extrabold text-stone-700 dark:text-stone-300 mb-2 uppercase tracking-wide">Topic / Subject</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., social media usage among teenagers"
                  className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-600 rounded-xl focus:border-[#1CB0F6] focus:ring-2 focus:ring-[#1CB0F6]/20 focus:bg-white dark:focus:bg-stone-800 outline-none transition-all text-sm text-stone-800 dark:text-stone-100"
                />
              </div>

              {essayType === 'compare-contrast' && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-extrabold text-stone-700 dark:text-stone-300 mb-2 uppercase tracking-wide">Subject 1</label>
                    <input
                      type="text"
                      value={subject1}
                      onChange={(e) => setSubject1(e.target.value)}
                      placeholder="e.g., traditional education"
                      className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-600 rounded-xl focus:border-[#1CB0F6] focus:ring-2 focus:ring-[#1CB0F6]/20 focus:bg-white dark:focus:bg-stone-800 outline-none transition-all text-sm text-stone-800 dark:text-stone-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-extrabold text-stone-700 dark:text-stone-300 mb-2 uppercase tracking-wide">Subject 2</label>
                    <input
                      type="text"
                      value={subject2}
                      onChange={(e) => setSubject2(e.target.value)}
                      placeholder="e.g., online learning"
                      className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-600 rounded-xl focus:border-[#1CB0F6] focus:ring-2 focus:ring-[#1CB0F6]/20 focus:bg-white dark:focus:bg-stone-800 outline-none transition-all text-sm text-stone-800 dark:text-stone-100"
                    />
                  </div>
                </div>
              )}

              {(essayType === 'argumentative' || essayType === 'analytical') && (
                <div>
                  <label className="block text-sm font-extrabold text-stone-700 dark:text-stone-300 mb-2 uppercase tracking-wide">
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
                    className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-600 rounded-xl focus:border-[#1CB0F6] focus:ring-2 focus:ring-[#1CB0F6]/20 focus:bg-white dark:focus:bg-stone-800 outline-none transition-all text-sm text-stone-800 dark:text-stone-100"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-extrabold text-stone-700 dark:text-stone-300 mb-2 uppercase tracking-wide">
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
                    className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-600 rounded-xl focus:border-[#1CB0F6] focus:ring-2 focus:ring-[#1CB0F6]/20 focus:bg-white dark:focus:bg-stone-800 outline-none transition-all text-sm text-stone-800 dark:text-stone-100"
                  />
                  <input
                    type="text"
                    value={reason2}
                    onChange={(e) => setReason2(e.target.value)}
                    placeholder={essayType === 'expository' ? "Point 2" : "Reason / Element 2"}
                    className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-600 rounded-xl focus:border-[#1CB0F6] focus:ring-2 focus:ring-[#1CB0F6]/20 focus:bg-white dark:focus:bg-stone-800 outline-none transition-all text-sm text-stone-800 dark:text-stone-100"
                  />
                  <input
                    type="text"
                    value={reason3}
                    onChange={(e) => setReason3(e.target.value)}
                    placeholder={essayType === 'expository' ? "Point 3 (optional)" : "Reason / Element 3 (optional)"}
                    className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-600 rounded-xl focus:border-[#1CB0F6] focus:ring-2 focus:ring-[#1CB0F6]/20 focus:bg-white dark:focus:bg-stone-800 outline-none transition-all text-sm text-stone-800 dark:text-stone-100"
                  />
                </div>
              </div>

              <button
                onClick={generateThesis}
                className="w-full py-3.5 bg-[#A560E8] hover:bg-[#9450D8] text-white font-extrabold uppercase tracking-wide rounded-xl border-2 border-b-4 border-[#8A48C7] active:border-b-2 active:translate-y-0.5 transition-all"
              >
                Generate Thesis Statement
              </button>
            </div>

            {/* Generated Thesis */}
            {thesis && (
              <div className="mt-8 p-5 sm:p-6 bg-[#F3EAFF] dark:bg-[#A560E8]/10 rounded-xl border-2 border-b-4 border-[#A560E8]/30">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-extrabold text-stone-800 dark:text-stone-100">Your Thesis Statement</h3>
                  <button
                    onClick={handleCopy}
                    className={`px-4 py-2 text-sm rounded-xl transition-all font-extrabold border-2 border-b-4 active:border-b-2 active:translate-y-0.5 ${
                      copied
                        ? 'bg-[#EAFFD6] text-[#46A302] border-[#58CC02]/40'
                        : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="text-stone-800 dark:text-stone-200 text-lg leading-relaxed font-bold">{thesis}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Tips Section */}
      <section className="py-12 sm:py-16 bg-stone-100 dark:bg-stone-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-extrabold text-stone-800 dark:text-stone-100 mb-8 text-center tracking-tight">What Makes a Strong Thesis?</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: '🎯', title: 'Specific', desc: 'Avoid vague language. Be precise about your topic and argument.', color: '#A560E8', tint: '#F3EAFF' },
              { icon: '💬', title: 'Arguable', desc: 'Present a claim someone could disagree with, not a statement of fact.', color: '#1CB0F6', tint: '#DDF4FF' },
              { icon: '✂️', title: 'Concise', desc: 'Keep it to one or two sentences. Every word should count.', color: '#FF4B4B', tint: '#FFE8E8' },
              { icon: '🗺️', title: 'Roadmap', desc: 'Preview your main points to guide readers through your essay.', color: '#FF9600', tint: '#FFF4E0' },
            ].map((tip, i) => (
              <div key={i} className="bg-white dark:bg-stone-800 border-2 border-b-4 border-stone-200 dark:border-stone-700 rounded-2xl p-5">
                <div
                  className="w-12 h-12 rounded-xl border-2 border-b-[3px] flex items-center justify-center mb-4 text-xl"
                  style={{ backgroundColor: `${tip.color}20`, borderColor: `${tip.color}50` }}
                >
                  {tip.icon}
                </div>
                <h3 className="font-extrabold text-stone-800 dark:text-stone-100 mb-2">{tip.title}</h3>
                <p className="text-stone-500 dark:text-stone-400 text-sm font-bold">{tip.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 bg-[#A560E8]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4 tracking-tight">
            Ready to write your essay?
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto font-bold">
            WriteScholar can analyze your completed essay and provide AI-powered feedback on structure, grammar, and academic style.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {user ? (
              <button
                onClick={() => onNavigate('dashboard')}
                className="px-6 py-3.5 bg-white text-[#A560E8] font-extrabold uppercase tracking-wide rounded-xl border-2 border-b-4 border-[#8A48C7] hover:bg-stone-50 active:border-b-2 active:translate-y-0.5 transition-all"
              >
                Go to Dashboard
              </button>
            ) : (
              <>
                <button
                  onClick={() => onNavigate('signup')}
                  className="px-6 py-3.5 bg-white text-[#A560E8] font-extrabold uppercase tracking-wide rounded-xl border-2 border-b-4 border-[#8A48C7] hover:bg-stone-50 active:border-b-2 active:translate-y-0.5 transition-all"
                >
                  Try WriteScholar Free
                </button>
                <button
                  onClick={() => onNavigate('features')}
                  className="px-6 py-3.5 border-2 border-b-4 border-white/40 text-white font-extrabold uppercase tracking-wide rounded-xl hover:bg-white/10 active:border-b-2 active:translate-y-0.5 transition-all"
                >
                  Learn More
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      <ToolPageSeoContent {...thesisGenSeo} onNavigate={onNavigate} />

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default ThesisGeneratorPage;
