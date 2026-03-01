import { useState, useEffect } from 'react';
import Header from '../../common/Header';
import Footer from '../../common/Footer';

interface WordCounterPageProps {
  onNavigate: (page: string) => void;
  user?: any;
  onLogout: () => void;
}

const WordCounterPage = ({ onNavigate, user, onLogout }: WordCounterPageProps) => {
  const [text, setText] = useState('');
  const [stats, setStats] = useState({
    words: 0,
    characters: 0,
    charactersNoSpaces: 0,
    sentences: 0,
    paragraphs: 0,
    readingTime: '0 min',
    speakingTime: '0 min'
  });

  useEffect(() => {
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, '').length;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim()).length;
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim()).length || (text.trim() ? 1 : 0);
    
    const readingMinutes = Math.ceil(words / 200);
    const speakingMinutes = Math.ceil(words / 150);

    setStats({
      words,
      characters,
      charactersNoSpaces,
      sentences,
      paragraphs,
      readingTime: words === 0 ? '0 min' : readingMinutes === 1 ? '1 min' : `${readingMinutes} mins`,
      speakingTime: words === 0 ? '0 min' : speakingMinutes === 1 ? '1 min' : `${speakingMinutes} mins`
    });
  }, [text]);

  const handleClear = () => {
    setText('');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-white">
      {user ? (
        <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="word-counter" />
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
      <section className="py-16 sm:py-20 bg-gradient-to-b from-blue-50/50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto">
            {/* Cute Character - Asian man */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 mb-6 shadow-lg shadow-blue-100">
              <svg viewBox="0 0 56 56" fill="none" className="w-16 h-16">
                <circle cx="28" cy="28" r="28" fill="#DBEAFE"/>
                <ellipse cx="28" cy="30" rx="14" ry="15" fill="#E8C4A0"/>
                <path d="M14 26 Q12 16 20 12 Q28 8 36 12 Q44 16 42 26 Q40 20 34 16 Q28 12 22 16 Q16 20 14 26" fill="#1F2937"/>
                <path d="M14 26 Q10 30 14 36" fill="#1F2937"/>
                <path d="M42 26 Q46 30 42 36" fill="#1F2937"/>
                <ellipse cx="22" cy="30" rx="3" ry="3.5" fill="#1F2937"/>
                <ellipse cx="34" cy="30" rx="3" ry="3.5" fill="#1F2937"/>
                <circle cx="23" cy="29" r="1" fill="white"/>
                <circle cx="35" cy="29" r="1" fill="white"/>
                <path d="M24 40 Q28 45 32 40" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round"/>
                <ellipse cx="18" cy="35" rx="3" ry="2" fill="#FECACA" opacity="0.4"/>
                <ellipse cx="38" cy="35" rx="3" ry="2" fill="#FECACA" opacity="0.4"/>
              </svg>
            </div>
            <span className="inline-flex items-center px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-5">
              Free Tool
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-5 leading-tight">
              Word Counter
            </h1>
            <p className="text-lg text-gray-500 leading-relaxed max-w-2xl mx-auto">
              Count words, characters, sentences, and paragraphs instantly. Perfect for essays, assignments, and academic papers with word limits.
            </p>
          </div>
        </div>
      </section>

      {/* Main Tool Section */}
      <section className="py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Text Input Area */}
            <div className="lg:col-span-2">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Your Text</h2>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleCopy}
                      className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all font-medium"
                    >
                      Copy
                    </button>
                    <button
                      onClick={handleClear}
                      className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all font-medium"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste or type your text here to count words, characters, and more..."
                  className="w-full h-80 p-4 text-gray-700 bg-gray-50 border-0 rounded-xl outline-none resize-none placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Stats Panel */}
            <div className="space-y-6">
              {/* Main Stats */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
                <h3 className="text-lg font-semibold mb-4 opacity-90">Statistics</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="opacity-80">Words</span>
                    <span className="text-2xl font-bold">{stats.words.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="opacity-80">Characters</span>
                    <span className="text-2xl font-bold">{stats.characters.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="opacity-80">Characters (no spaces)</span>
                    <span className="text-xl font-bold">{stats.charactersNoSpaces.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Secondary Stats */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">More Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Sentences</span>
                    <span className="font-semibold text-gray-900">{stats.sentences}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Paragraphs</span>
                    <span className="font-semibold text-gray-900">{stats.paragraphs}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Reading Time</span>
                    <span className="font-semibold text-gray-900">{stats.readingTime}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Speaking Time</span>
                    <span className="font-semibold text-gray-900">{stats.speakingTime}</span>
                  </div>
                </div>
              </div>

              {/* Common Limits */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Common Word Limits</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Twitter post</span>
                    <span className={`font-medium ${stats.characters <= 280 ? 'text-green-600' : 'text-red-500'}`}>280 chars</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Short essay</span>
                    <span className={`font-medium ${stats.words <= 500 ? 'text-green-600' : 'text-red-500'}`}>500 words</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">College essay</span>
                    <span className={`font-medium ${stats.words <= 650 ? 'text-green-600' : 'text-red-500'}`}>650 words</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Research paper</span>
                    <span className={`font-medium ${stats.words <= 3000 ? 'text-green-600' : 'text-red-500'}`}>3000 words</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tips Section */}
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Tips for Meeting Word Counts</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Stay Focused</h3>
              <p className="text-gray-600 text-sm">Stick to your thesis. Remove tangents that don't support your main argument.</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Be Concise</h3>
              <p className="text-gray-600 text-sm">Replace wordy phrases with concise alternatives. "Due to the fact that" → "Because"</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Add Examples</h3>
              <p className="text-gray-600 text-sm">If under the limit, strengthen arguments with relevant examples and evidence.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Need help improving your writing?
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

export default WordCounterPage;
