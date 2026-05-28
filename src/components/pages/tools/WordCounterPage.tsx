import { useState, useEffect } from 'react';
import LoggedInPageShell from '../../workspace/LoggedInPageShell';
import Footer from '../../common/Footer';
import ScholarMascot from '../../common/ScholarMascot';
import { applyPageSeoTags, injectToolProductSchema, removeJsonLd } from '../../../utils/seo';
import ToolPageSeoContent from '../../common/ToolPageSeoContent';
import { wordCounterSeo } from '../../../data/toolSeoContent';
import EmbedCodeBlock from '../../common/EmbedCodeBlock';

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

  // SEO: per-route title, description, canonical, OG, Twitter, plus tool schema.
  useEffect(() => {
    applyPageSeoTags({
      title: 'Free Word Counter Tool - Count Words & Characters | WriteScholar',
      description: 'Free online word counter tool. Count words, characters, sentences, and paragraphs instantly. Check reading time and speaking time. No signup required.',
    });
    injectToolProductSchema({
      name: 'Word Counter',
      description: 'Free online word counter — count words, characters, sentences, paragraphs, plus reading and speaking time.',
    });
    return () => removeJsonLd('tool-product');
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
    <LoggedInPageShell className="relative min-h-screen overflow-x-clip bg-stone-50 dark:bg-stone-950" user={user} onNavigate={onNavigate} onLogout={onLogout} currentPage="word-counter">
      {/* Hero Section */}
      <section className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center mb-6">
              <ScholarMascot size={80} animated={false} pose="default" />
            </div>
            <span className="inline-flex items-center px-4 py-1.5 bg-[#DDF4FF] dark:bg-[#1CB0F6]/20 text-[#1899D6] dark:text-[#1CB0F6] border-2 border-[#1CB0F6]/30 rounded-full text-sm font-extrabold uppercase tracking-wide mb-5">
              Free Tool
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-stone-900 dark:text-stone-100 mb-5 leading-tight">
              Word Counter
            </h1>
            <p className="text-lg text-stone-500 dark:text-stone-400 leading-relaxed max-w-2xl mx-auto font-semibold">
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
              <div className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-extrabold text-stone-900 dark:text-stone-100 uppercase tracking-wide">Your Text</h2>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleCopy}
                      className="px-4 py-2 text-sm text-[#1CB0F6] hover:bg-[#DDF4FF] dark:hover:bg-[#1CB0F6]/10 border-2 border-b-4 border-[#1CB0F6]/30 active:border-b-2 active:translate-y-0.5 transition-all font-extrabold uppercase tracking-wide rounded-xl"
                    >
                      Copy
                    </button>
                    <button
                      onClick={handleClear}
                      className="px-4 py-2 text-sm text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 border-2 border-b-4 border-stone-200 dark:border-stone-600 active:border-b-2 active:translate-y-0.5 transition-all font-extrabold uppercase tracking-wide rounded-xl"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste or type your text here to count words, characters, and more..."
                  className="w-full h-80 p-4 text-stone-700 dark:text-stone-200 bg-stone-50 dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-600 rounded-xl outline-none resize-none placeholder-stone-400 dark:placeholder-stone-500 focus:border-[#1CB0F6] focus:ring-2 focus:ring-[#1CB0F6]/20 transition-all font-semibold"
                />
              </div>
            </div>

            {/* Stats Panel */}
            <div className="space-y-6">
              {/* Main Stats */}
              <div className="border-2 border-b-4 border-[#46A302] bg-[#58CC02] rounded-2xl p-6 text-white">
                <h3 className="text-lg font-extrabold mb-4 uppercase tracking-wide opacity-90">Statistics</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-bold opacity-90">Words</span>
                    <span className="text-2xl font-extrabold">{stats.words.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold opacity-90">Characters</span>
                    <span className="text-2xl font-extrabold">{stats.characters.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold opacity-90">Characters (no spaces)</span>
                    <span className="text-xl font-extrabold">{stats.charactersNoSpaces.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Secondary Stats */}
              <div className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl p-6">
                <h3 className="text-lg font-extrabold text-stone-900 dark:text-stone-100 mb-4 uppercase tracking-wide">More Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b-2 border-stone-100 dark:border-stone-800">
                    <span className="text-stone-500 dark:text-stone-400 font-bold">Sentences</span>
                    <span className="font-extrabold text-stone-900 dark:text-stone-100">{stats.sentences}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b-2 border-stone-100 dark:border-stone-800">
                    <span className="text-stone-500 dark:text-stone-400 font-bold">Paragraphs</span>
                    <span className="font-extrabold text-stone-900 dark:text-stone-100">{stats.paragraphs}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b-2 border-stone-100 dark:border-stone-800">
                    <span className="text-stone-500 dark:text-stone-400 font-bold">Reading Time</span>
                    <span className="font-extrabold text-stone-900 dark:text-stone-100">{stats.readingTime}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-stone-500 dark:text-stone-400 font-bold">Speaking Time</span>
                    <span className="font-extrabold text-stone-900 dark:text-stone-100">{stats.speakingTime}</span>
                  </div>
                </div>
              </div>

              {/* Common Limits */}
              <div className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl p-6">
                <h3 className="text-lg font-extrabold text-stone-900 dark:text-stone-100 mb-4 uppercase tracking-wide">Common Limits</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-stone-500 dark:text-stone-400 font-bold">Twitter post</span>
                    <span className={`font-extrabold ${stats.characters <= 280 ? 'text-[#58CC02]' : 'text-[#FF4B4B]'}`}>280 chars</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-stone-500 dark:text-stone-400 font-bold">Short essay</span>
                    <span className={`font-extrabold ${stats.words <= 500 ? 'text-[#58CC02]' : 'text-[#FF4B4B]'}`}>500 words</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-stone-500 dark:text-stone-400 font-bold">College essay</span>
                    <span className={`font-extrabold ${stats.words <= 650 ? 'text-[#58CC02]' : 'text-[#FF4B4B]'}`}>650 words</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-stone-500 dark:text-stone-400 font-bold">Research paper</span>
                    <span className={`font-extrabold ${stats.words <= 3000 ? 'text-[#58CC02]' : 'text-[#FF4B4B]'}`}>3000 words</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tips Section */}
      <section className="py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-extrabold text-stone-900 dark:text-stone-100 mb-8 text-center uppercase tracking-wide">Tips for Meeting Word Counts</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl p-6">
              <div className="w-12 h-12 bg-[#EAFFD6] dark:bg-[#58CC02]/20 rounded-xl flex items-center justify-center mb-4 border-2 border-[#58CC02]/30">
                <svg className="w-6 h-6 text-[#58CC02]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-extrabold text-stone-900 dark:text-stone-100 mb-2">Stay Focused</h3>
              <p className="text-stone-500 dark:text-stone-400 text-sm font-semibold">Stick to your thesis. Remove tangents that don't support your main argument.</p>
            </div>
            <div className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl p-6">
              <div className="w-12 h-12 bg-[#FFF4E0] dark:bg-[#FF9600]/20 rounded-xl flex items-center justify-center mb-4 border-2 border-[#FF9600]/30">
                <svg className="w-6 h-6 text-[#FF9600]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-extrabold text-stone-900 dark:text-stone-100 mb-2">Be Concise</h3>
              <p className="text-stone-500 dark:text-stone-400 text-sm font-semibold">Replace wordy phrases with concise alternatives. "Due to the fact that" becomes "Because"</p>
            </div>
            <div className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl p-6">
              <div className="w-12 h-12 bg-[#DDF4FF] dark:bg-[#1CB0F6]/20 rounded-xl flex items-center justify-center mb-4 border-2 border-[#1CB0F6]/30">
                <svg className="w-6 h-6 text-[#1CB0F6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              </div>
              <h3 className="font-extrabold text-stone-900 dark:text-stone-100 mb-2">Add Examples</h3>
              <p className="text-stone-500 dark:text-stone-400 text-sm font-semibold">If under the limit, strengthen arguments with relevant examples and evidence.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="border-2 border-b-4 border-[#8A48C7] bg-[#A560E8] rounded-2xl p-10 text-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4 uppercase tracking-wide">
              Need help improving your writing?
            </h2>
            <p className="text-white/80 mb-8 max-w-xl mx-auto font-bold">
              WriteScholar provides AI-powered feedback on grammar, structure, and academic style to help you write better papers.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {user ? (
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="px-8 py-3 bg-white text-[#A560E8] border-2 border-b-4 border-stone-200 active:border-b-2 active:translate-y-0.5 transition-all font-extrabold uppercase tracking-wide rounded-xl hover:bg-stone-50"
                >
                  Go to Dashboard
                </button>
              ) : (
                <>
                  <button
                    onClick={() => onNavigate('signup')}
                    className="px-8 py-3 bg-white text-[#A560E8] border-2 border-b-4 border-stone-200 active:border-b-2 active:translate-y-0.5 transition-all font-extrabold uppercase tracking-wide rounded-xl hover:bg-stone-50"
                  >
                    Try WriteScholar Free
                  </button>
                  <button
                    onClick={() => onNavigate('features')}
                    className="px-8 py-3 bg-transparent text-white border-2 border-b-4 border-white/40 active:border-b-2 active:translate-y-0.5 transition-all font-extrabold uppercase tracking-wide rounded-xl hover:bg-white/10"
                  >
                    Learn More
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <ToolPageSeoContent {...wordCounterSeo} onNavigate={onNavigate} />

      <EmbedCodeBlock slug="word-counter" toolName="Word Counter" height={500} accent="#1CB0F6" />

      <Footer onNavigate={onNavigate} />
    </LoggedInPageShell>
  );
};

export default WordCounterPage;
