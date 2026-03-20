import { useState, useEffect } from 'react';
import Header from '../../common/Header';
import Footer from '../../common/Footer';
import ScholarMascot from '../../common/ScholarMascot';

interface TextCaseConverterPageProps {
  onNavigate: (page: string) => void;
  user?: any;
  onLogout: () => void;
}

type CaseType = 'uppercase' | 'lowercase' | 'titlecase' | 'sentencecase' | 'capitalizewords' | 'alternating' | 'inverse';

const TextCaseConverterPage = ({ onNavigate, user, onLogout }: TextCaseConverterPageProps) => {
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);

  // SEO: Set page title and meta description
  useEffect(() => {
    document.title = 'Free Text Case Converter - Uppercase, Lowercase, Title Case | WriteScholar';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Free text case converter. Convert text to uppercase, lowercase, title case, sentence case, and more. Transform your text instantly. No signup required.');
    }
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

  const caseOptions = [
    { type: 'uppercase' as CaseType, label: 'UPPERCASE', description: 'ALL CAPS', icon: 'AA', color: 'rose' },
    { type: 'lowercase' as CaseType, label: 'lowercase', description: 'all lower', icon: 'aa', color: 'green' },
    { type: 'titlecase' as CaseType, label: 'Title Case', description: 'First Letter Cap', icon: 'Aa', color: 'rose' },
    { type: 'sentencecase' as CaseType, label: 'Sentence case', description: 'Start of sentences', icon: 'Aa.', color: 'orange' },
    { type: 'capitalizewords' as CaseType, label: 'Capitalize Words', description: 'Every Word', icon: 'Aw', color: 'pink' },
    { type: 'inverse' as CaseType, label: 'InVeRsE', description: 'Swap cases', icon: 'aA', color: 'red' },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      rose: 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200',
      green: 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200',
      orange: 'bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200',
      pink: 'bg-pink-50 hover:bg-rose-100 text-rose-700 border-pink-200',
      indigo: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200',
    };
    return colors[color] || colors.rose;
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #FAF8F5 0%, #F5F3F0 100%)' }}>
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="text-case-converter" />

      {/* Hero Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-rose-50/50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center mb-6">
              <ScholarMascot size={80} animated={false} pose="default" />
            </div>
            <span className="inline-flex items-center px-4 py-1.5 bg-rose-100 text-rose-700 rounded-full text-sm font-semibold mb-5">
              Free Tool
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-5 leading-tight">
              Text Case Converter
            </h1>
            <p className="text-lg text-gray-500 leading-relaxed max-w-2xl mx-auto">
              Convert your text to UPPERCASE, lowercase, Title Case, and more. Perfect for formatting titles, headings, and fixing accidental caps lock.
            </p>
          </div>
        </div>
      </section>

      {/* Main Tool Section */}
      <section className="py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Text Input */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Your Text</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCopy}
                  className={`px-4 py-2 text-sm rounded-xl transition-all font-medium ${
                    copied
                      ? 'bg-green-100 text-green-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={() => setText('')}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all font-medium"
                >
                  Clear
                </button>
              </div>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type or paste your text here, then click a conversion button below..."
              className="w-full h-48 p-4 text-gray-700 bg-gray-50 border-0 rounded-xl outline-none resize-none placeholder-gray-400 focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all text-lg"
            />
          </div>

          {/* Conversion Options */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {caseOptions.map((option) => (
              <button
                key={option.type}
                onClick={() => handleConvert(option.type)}
                className={`p-4 rounded-2xl border-2 transition-all ${getColorClasses(option.color)}`}
              >
                <div className="text-2xl font-bold mb-1">{option.icon}</div>
                <div className="font-semibold text-sm">{option.label}</div>
                <div className="text-xs opacity-70">{option.description}</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Common Uses</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center mb-4">
                <span className="text-rose-600 font-bold text-lg">H1</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Headings & Titles</h3>
              <p className="text-gray-600 text-sm">Convert to Title Case for professional-looking headings and document titles.</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-4">
                <span className="text-green-600 font-bold text-lg">{"</>"}</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Code Variables</h3>
              <p className="text-gray-600 text-sm">Quickly convert text for variable names in different coding conventions.</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center mb-4">
                <span className="text-rose-600 font-bold text-lg">Aa</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Fix Caps Lock</h3>
              <p className="text-gray-600 text-sm">Typed with caps lock on? Quickly convert to proper sentence case.</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mb-4">
                <span className="text-orange-600 font-bold text-lg">@</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Social Media</h3>
              <p className="text-gray-600 text-sm">Format usernames, hashtags, and posts with consistent capitalization.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Need more writing tools?
          </h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            WriteScholar provides AI-powered feedback on grammar, structure, and academic style to help you write better papers.
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

export default TextCaseConverterPage;
