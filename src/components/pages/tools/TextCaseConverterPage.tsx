import { useState } from 'react';
import Header from '../../common/Header';
import Footer from '../../common/Footer';

interface TextCaseConverterPageProps {
  onNavigate: (page: string) => void;
  user?: any;
  onLogout: () => void;
}

type CaseType = 'uppercase' | 'lowercase' | 'titlecase' | 'sentencecase' | 'capitalizewords' | 'alternating' | 'inverse';

const TextCaseConverterPage = ({ onNavigate, user, onLogout }: TextCaseConverterPageProps) => {
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);

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
    { type: 'uppercase' as CaseType, label: 'UPPERCASE', description: 'ALL CAPS', icon: 'AA', color: 'blue' },
    { type: 'lowercase' as CaseType, label: 'lowercase', description: 'all lower', icon: 'aa', color: 'green' },
    { type: 'titlecase' as CaseType, label: 'Title Case', description: 'First Letter Cap', icon: 'Aa', color: 'purple' },
    { type: 'sentencecase' as CaseType, label: 'Sentence case', description: 'Start of sentences', icon: 'Aa.', color: 'orange' },
    { type: 'capitalizewords' as CaseType, label: 'Capitalize Words', description: 'Every Word', icon: 'Aw', color: 'pink' },
    { type: 'inverse' as CaseType, label: 'InVeRsE', description: 'Swap cases', icon: 'aA', color: 'indigo' },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200',
      green: 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200',
      purple: 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200',
      orange: 'bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200',
      pink: 'bg-pink-50 hover:bg-pink-100 text-pink-700 border-pink-200',
      indigo: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200',
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-white">
      {user ? (
        <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="text-case-converter" />
      ) : (
        <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-18 py-4">
              <a href="/" onClick={(e) => { e.preventDefault(); onNavigate('landing'); }} className="flex items-center space-x-2.5">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-xl">W</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">WriteScholar</span>
              </a>
              
              <div className="hidden md:flex items-center space-x-2">
                <a href="/features" onClick={(e) => { e.preventDefault(); onNavigate('features'); }} className="px-4 py-2.5 text-base text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors font-medium">Features</a>
                <a href="/pricing" onClick={(e) => { e.preventDefault(); onNavigate('pricing'); }} className="px-4 py-2.5 text-base text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors font-medium">Pricing</a>
                <a href="/blog" onClick={(e) => { e.preventDefault(); onNavigate('blog'); }} className="px-4 py-2.5 text-base text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors font-medium">Blog</a>
                <a href="/about" onClick={(e) => { e.preventDefault(); onNavigate('about'); }} className="px-4 py-2.5 text-base text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors font-medium">About</a>
              </div>
              
              <div className="flex items-center space-x-3">
                <a href="/login" onClick={(e) => { e.preventDefault(); onNavigate('login'); }} className="hidden sm:inline-flex px-4 py-2.5 text-base text-gray-600 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-50 transition-colors">Log in</a>
                <a href="/signup" onClick={(e) => { e.preventDefault(); onNavigate('signup'); }} className="px-5 py-2.5 bg-gray-900 text-white text-base font-medium rounded-xl hover:bg-gray-800 transition-colors">
                  Get Started
                </a>
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Hero Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-pink-50/50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto">
            {/* Cute Character - East Asian woman */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-pink-100 mb-6 shadow-lg shadow-pink-100">
              <svg viewBox="0 0 56 56" fill="none" className="w-16 h-16">
                <circle cx="28" cy="28" r="28" fill="#FCE7F3"/>
                <ellipse cx="28" cy="30" rx="14" ry="15" fill="#F5DEB3"/>
                <path d="M12 26 Q10 14 20 10 Q28 6 36 10 Q46 14 44 26 Q42 18 34 14 Q28 10 22 14 Q16 18 12 26" fill="#1A1A1A"/>
                <path d="M12 26 Q6 40 16 50" fill="#1A1A1A"/>
                <path d="M44 26 Q50 40 40 50" fill="#1A1A1A"/>
                <ellipse cx="22" cy="30" rx="3" ry="3.5" fill="#1F2937"/>
                <ellipse cx="34" cy="30" rx="3" ry="3.5" fill="#1F2937"/>
                <circle cx="23" cy="29" r="1" fill="white"/>
                <circle cx="35" cy="29" r="1" fill="white"/>
                <path d="M24 41 Q28 46 32 41" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round"/>
                <ellipse cx="17" cy="35" rx="3" ry="2" fill="#FECACA" opacity="0.4"/>
                <ellipse cx="39" cy="35" rx="3" ry="2" fill="#FECACA" opacity="0.4"/>
              </svg>
            </div>
            <span className="inline-flex items-center px-4 py-1.5 bg-pink-100 text-pink-700 rounded-full text-sm font-semibold mb-5">
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
              className="w-full h-48 p-4 text-gray-700 bg-gray-50 border-0 rounded-xl outline-none resize-none placeholder-gray-400 focus:ring-2 focus:ring-pink-500 focus:bg-white transition-all text-lg"
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
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                <span className="text-blue-600 font-bold text-lg">H1</span>
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
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-4">
                <span className="text-purple-600 font-bold text-lg">Aa</span>
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
