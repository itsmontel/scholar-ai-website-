import { useState, useEffect } from 'react';
import Header from '../../common/Header';
import { WriteScholarEditorialBackgroundLayers } from '../../common/WriteScholarEditorialBackground';
import Footer from '../../common/Footer';
import ScholarMascot from '../../common/ScholarMascot';

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

  // SEO: Set page title and meta description
  useEffect(() => {
    document.title = 'Free Word Counter Tool - Count Words & Characters | WriteScholar';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Free online word counter tool. Count words, characters, sentences, and paragraphs instantly. Check reading time and speaking time. No signup required.');
    }
  }, []);

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
    <div className="relative min-h-screen overflow-x-hidden">
      <WriteScholarEditorialBackgroundLayers position="fixed" />
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="word-counter" />

      {/* Hero Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-violet-50/50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center mb-6">
              <ScholarMascot size={80} animated={false} pose="default" />
            </div>
            <span className="inline-flex items-center px-4 py-1.5 bg-violet-100 text-violet-700 rounded-full text-sm font-semibold mb-5">
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
                  className="w-full h-80 p-4 text-gray-700 bg-gray-50 border-0 rounded-xl outline-none resize-none placeholder-gray-400 focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Stats Panel */}
            <div className="space-y-6">
              {/* Main Stats */}
              <div className="bg-violet-600 rounded-2xl p-6 text-white">
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
              <div className="w-12 h-12 bg-violet-50 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <div className="w-12 h-12 bg-violet-50 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
