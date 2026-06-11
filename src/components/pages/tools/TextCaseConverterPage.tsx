import { useState, useEffect } from 'react';
import LoggedInPageShell from '../../workspace/LoggedInPageShell';
import Footer from '../../common/Footer';
import { applyPageSeoTags, injectToolProductSchema, removeJsonLd } from '../../../utils/seo';
import ToolPageSeoContent from '../../common/ToolPageSeoContent';
import { textCaseSeo } from '../../../data/toolSeoContent';
import { TOOL_SEO_META } from '../../../constants/toolSeoMeta';

interface TextCaseConverterPageProps {
  onNavigate: (page: string) => void;
  user?: any;
  onLogout: () => void;
}

type CaseType = 'uppercase' | 'lowercase' | 'titlecase' | 'sentencecase' | 'capitalizewords' | 'alternating' | 'inverse';

const TextCaseConverterPage = ({ onNavigate, user, onLogout }: TextCaseConverterPageProps) => {
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);

  // SEO: per-route title, description, canonical, OG, Twitter, plus tool schema.
  useEffect(() => {
    applyPageSeoTags({
      ...TOOL_SEO_META['text-case-converter'],
    });
    injectToolProductSchema({
      name: 'Text Case Converter',
      description: 'Free text case converter — switch between UPPERCASE, lowercase, Title Case, Sentence case, aLtErNaTiNg, and inverse instantly.',
    });
    return () => removeJsonLd('tool-product');
  }, []);

  const convertCase = (type: CaseType): string => {
    if (!text) return '';

    switch (type) {
      case 'uppercase':
        return text.toUpperCase();
      case 'lowercase':
        return text.toLowerCase();
      case 'titlecase':
        return text.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
      case 'sentencecase':
        return text.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, char => char.toUpperCase());
      case 'capitalizewords':
        return text.replace(/\b\w/g, char => char.toUpperCase());
      case 'alternating':
        return text.split('').map((char, i) => i % 2 === 0 ? char.toLowerCase() : char.toUpperCase()).join('');
      case 'inverse':
        return text.split('').map(char => char === char.toUpperCase() ? char.toLowerCase() : char.toUpperCase()).join('');
      default:
        return text;
    }
  };

  const handleConvert = (type: CaseType) => {
    setText(convertCase(type));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const caseOptions: { type: CaseType; label: string; description: string; icon: string; bg: string; border: string; borderDark: string; text: string }[] = [
    { type: 'uppercase', label: 'UPPERCASE', description: 'ALL CAPS', icon: 'AA', bg: 'bg-[#FFE8E8]', border: 'border-[#FF4B4B]', borderDark: 'border-b-[#E04343]', text: 'text-[#FF4B4B]' },
    { type: 'lowercase', label: 'lowercase', description: 'all lower', icon: 'aa', bg: 'bg-[#EAFFD6]', border: 'border-[#58CC02]', borderDark: 'border-b-[#46A302]', text: 'text-[#58CC02]' },
    { type: 'titlecase', label: 'Title Case', description: 'First Letter Cap', icon: 'Aa', bg: 'bg-[#DDF4FF]', border: 'border-[#1CB0F6]', borderDark: 'border-b-[#1899D6]', text: 'text-[#1CB0F6]' },
    { type: 'sentencecase', label: 'Sentence case', description: 'Start of sentences', icon: 'Aa.', bg: 'bg-[#FFF4E0]', border: 'border-[#FF9600]', borderDark: 'border-b-[#D97F00]', text: 'text-[#FF9600]' },
    { type: 'capitalizewords', label: 'Capitalize Words', description: 'Every Word', icon: 'Aw', bg: 'bg-[#F3EAFF]', border: 'border-[#A560E8]', borderDark: 'border-b-[#8A48C7]', text: 'text-[#A560E8]' },
    { type: 'inverse', label: 'InVeRsE', description: 'Swap cases', icon: 'aA', bg: 'bg-[#FFE8E8]', border: 'border-[#FF4B4B]', borderDark: 'border-b-[#E04343]', text: 'text-[#FF4B4B]' },
  ];

  const useCases = [
    { icon: 'H1', label: 'Headings & Titles', description: 'Convert to Title Case for professional-looking headings and document titles.', bg: 'bg-[#DDF4FF]', text: 'text-[#1CB0F6]' },
    { icon: '</>', label: 'Code Variables', description: 'Quickly convert text for variable names in different coding conventions.', bg: 'bg-[#EAFFD6]', text: 'text-[#58CC02]' },
    { icon: 'Aa', label: 'Fix Caps Lock', description: 'Typed with caps lock on? Quickly convert to proper sentence case.', bg: 'bg-[#F3EAFF]', text: 'text-[#A560E8]' },
    { icon: '@', label: 'Social Media', description: 'Format usernames, hashtags, and posts with consistent capitalization.', bg: 'bg-[#FFF4E0]', text: 'text-[#FF9600]' },
  ];

  return (
    <LoggedInPageShell className="relative min-h-screen overflow-x-clip bg-stone-50 dark:bg-stone-950" user={user} onNavigate={onNavigate} onLogout={onLogout} currentPage="text-case-converter">
      {/* Hero Section */}
      <section className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center px-4 py-1.5 bg-[#EAFFD6] text-[#58CC02] border-2 border-[#58CC02] rounded-full text-sm font-extrabold uppercase tracking-wide mb-5">
              Free Tool
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-stone-900 dark:text-stone-100 mb-5 leading-tight tracking-tight">
              Text Case Converter
            </h1>
            <p className="text-lg text-stone-500 dark:text-stone-400 leading-relaxed max-w-2xl mx-auto font-semibold">
              Convert your text to UPPERCASE, lowercase, Title Case, and more. Perfect for formatting titles, headings, and fixing accidental caps lock.
            </p>
          </div>
        </div>
      </section>

      {/* Main Tool Section */}
      <section className="pb-12 sm:pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Text Input Card */}
          <div className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-extrabold text-stone-900 dark:text-stone-100 uppercase tracking-wide">Your Text</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCopy}
                  className={`px-4 py-2 text-sm rounded-xl border-2 border-b-4 active:border-b-2 active:translate-y-0.5 transition-all font-extrabold uppercase tracking-wide ${
                    copied
                      ? 'bg-[#EAFFD6] text-[#58CC02] border-[#58CC02]'
                      : 'text-stone-500 dark:text-stone-400 border-stone-200 dark:border-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={() => setText('')}
                  className="px-4 py-2 text-sm rounded-xl border-2 border-b-4 active:border-b-2 active:translate-y-0.5 transition-all font-extrabold uppercase tracking-wide text-stone-500 dark:text-stone-400 border-stone-200 dark:border-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                  Clear
                </button>
              </div>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type or paste your text here, then click a conversion button below..."
              className="w-full h-48 p-4 text-stone-700 dark:text-stone-200 bg-stone-50 dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-600 rounded-xl outline-none resize-none placeholder-stone-400 dark:placeholder-stone-500 focus:border-[#1CB0F6] focus:ring-2 focus:ring-[#1CB0F6]/20 transition-all text-lg"
            />
          </div>

          {/* Conversion Options - Duolingo 3D pill buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {caseOptions.map((option) => (
              <button
                key={option.type}
                onClick={() => handleConvert(option.type)}
                className={`p-4 rounded-2xl border-2 border-b-4 active:border-b-2 active:translate-y-0.5 transition-all ${option.bg} ${option.border} ${option.borderDark} hover:brightness-95`}
              >
                <div className={`text-2xl font-extrabold mb-1 ${option.text}`}>{option.icon}</div>
                <div className={`font-extrabold text-sm uppercase tracking-wide ${option.text}`}>{option.label}</div>
                <div className={`text-xs font-bold opacity-70 ${option.text}`}>{option.description}</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-12 sm:py-16 bg-white dark:bg-stone-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-extrabold text-stone-900 dark:text-stone-100 mb-8 text-center uppercase tracking-wide">Common Uses</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {useCases.map((item) => (
              <div key={item.label} className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl p-6">
                <div className={`w-12 h-12 ${item.bg} rounded-xl flex items-center justify-center mb-4`}>
                  <span className={`${item.text} font-extrabold text-lg`}>{item.icon}</span>
                </div>
                <h3 className="font-extrabold text-stone-900 dark:text-stone-100 mb-2">{item.label}</h3>
                <p className="text-stone-500 dark:text-stone-400 text-sm font-semibold">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 bg-[#58CC02]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4 uppercase tracking-wide">
            Need more writing tools?
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto font-semibold">
            WriteScholar provides AI-powered feedback on grammar, structure, and academic style to help you write better papers.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {user ? (
              <button
                onClick={() => onNavigate('dashboard')}
                className="px-6 py-3 bg-white text-[#58CC02] font-extrabold uppercase tracking-wide rounded-xl border-2 border-b-4 border-[#46A302] active:border-b-2 active:translate-y-0.5 transition-all hover:brightness-95"
              >
                Go to Dashboard
              </button>
            ) : (
              <>
                <button
                  onClick={() => onNavigate('signup')}
                  className="px-6 py-3 bg-white text-[#58CC02] font-extrabold uppercase tracking-wide rounded-xl border-2 border-b-4 border-[#46A302] active:border-b-2 active:translate-y-0.5 transition-all hover:brightness-95"
                >
                  Try WriteScholar Free
                </button>
                <button
                  onClick={() => onNavigate('features')}
                  className="px-6 py-3 bg-[#46A302] text-white font-extrabold uppercase tracking-wide rounded-xl border-2 border-b-4 border-[#3A8602] active:border-b-2 active:translate-y-0.5 transition-all hover:brightness-95"
                >
                  Learn More
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      <ToolPageSeoContent {...textCaseSeo} onNavigate={onNavigate} />

      <Footer onNavigate={onNavigate} />
    </LoggedInPageShell>
  );
};

export default TextCaseConverterPage;
