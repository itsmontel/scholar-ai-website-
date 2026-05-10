import { useState, useEffect } from 'react';
import EmbedFrame from './EmbedFrame';

/**
 * Embeddable Word Counter. Lightweight version for iframe embeds on
 * writing/blogging sites. Counts words, characters, sentences, paragraphs,
 * reading time, and speaking time. All client-side, instant.
 */

const EmbedWordCounter = () => {
  const [text, setText] = useState('');
  const [stats, setStats] = useState({
    words: 0,
    chars: 0,
    charsNoSpaces: 0,
    sentences: 0,
    paragraphs: 0,
    readingMin: '0',
    speakingMin: '0',
  });

  useEffect(() => {
    const trimmed = text.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const chars = text.length;
    const charsNoSpaces = text.replace(/\s/g, '').length;
    const sentences = trimmed ? (trimmed.match(/[.!?]+/g) || []).length : 0;
    const paragraphs = trimmed ? trimmed.split(/\n\s*\n/).length : 0;
    setStats({
      words,
      chars,
      charsNoSpaces,
      sentences,
      paragraphs,
      readingMin: words === 0 ? '0' : Math.max(1, Math.ceil(words / 200)).toString(),
      speakingMin: words === 0 ? '0' : Math.max(1, Math.ceil(words / 130)).toString(),
    });
  }, [text]);

  return (
    <EmbedFrame title="Word Counter" toolPath="/tools/word-counter" accent="#1CB0F6">
      <div className="max-w-3xl mx-auto">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste or type your text here..."
          className="w-full h-48 sm:h-56 rounded-xl border-2 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-4 py-3 text-[14px] focus:outline-none focus:border-[#1CB0F6] resize-y text-stone-900 dark:text-stone-50 mb-4"
        />

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          <StatCard label="Words" value={stats.words.toLocaleString()} accent="#1CB0F6" big />
          <StatCard label="Characters" value={stats.chars.toLocaleString()} />
          <StatCard label="Sentences" value={stats.sentences.toLocaleString()} />
          <StatCard label="Paragraphs" value={stats.paragraphs.toLocaleString()} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <StatCard label="No spaces" value={stats.charsNoSpaces.toLocaleString()} small />
          <StatCard label="Reading time" value={`${stats.readingMin} min`} small />
          <StatCard label="Speaking time" value={`${stats.speakingMin} min`} small />
        </div>
      </div>
    </EmbedFrame>
  );
};

const StatCard = ({ label, value, accent, big, small }: { label: string; value: string; accent?: string; big?: boolean; small?: boolean }) => (
  <div
    className={`rounded-xl border-2 ${big ? 'border-b-4' : 'border-b-2'} bg-white dark:bg-stone-900 px-3 ${big ? 'py-3' : small ? 'py-2' : 'py-2.5'} text-center`}
    style={accent ? { borderColor: accent, backgroundColor: `${accent}10` } : { borderColor: '#e7e5e4' }}
  >
    <div className={`${small ? 'text-[10px]' : 'text-[11px]'} font-extrabold uppercase tracking-wider ${accent ? '' : 'text-stone-500'}`}
      style={accent ? { color: accent } : undefined}>
      {label}
    </div>
    <div className={`${big ? 'text-2xl sm:text-3xl' : 'text-base sm:text-lg'} font-extrabold tabular-nums text-stone-900 dark:text-stone-50`}>
      {value}
    </div>
  </div>
);

export default EmbedWordCounter;
