import { useState, useEffect } from 'react';
import LoggedInPageShell from '../../workspace/LoggedInPageShell';
import Footer from '../../common/Footer';
import ScholarMascot from '../../common/ScholarMascot';
import { applyPageSeoTags, injectToolProductSchema, removeJsonLd } from '../../../utils/seo';
import ToolPageSeoContent from '../../common/ToolPageSeoContent';
import { wordCounterSeo } from '../../../data/toolSeoContent';
import { TOOL_SEO_META } from '../../../constants/toolSeoMeta';
import EmbedCodeBlock from '../../common/EmbedCodeBlock';

interface WordCounterPageProps {
  onNavigate: (page: string) => void;
  user?: any;
  onLogout: () => void;
}

/* ─── Word-count ⇄ page-count conversion ─────────────────────────
 * The academic standard everyone (Word, Google Docs, every marking
 * rubric) assumes: 12pt Times New Roman, 1-inch margins.
 *   • double-spaced ≈ 250 words per page
 *   • single-spaced ≈ 500 words per page
 * "How many pages is 500 words" is the question students actually
 * search for, so the counter answers it live instead of making them
 * do the division. */
const WORDS_PER_PAGE_DOUBLE = 250;
const WORDS_PER_PAGE_SINGLE = 500;

/** Rounded page estimate — one decimal until it stops being useful. */
const formatPages = (words: number, perPage: number): string => {
  if (!words) return '0';
  const pages = words / perPage;
  if (pages < 0.1) return '<0.1';
  // Whole numbers read as "2 pages", not "2.0 pages".
  return pages < 10 ? pages.toFixed(1).replace(/\.0$/, '') : String(Math.round(pages));
};

/** The essay lengths students are actually set, shortest first. */
const ESSAY_TARGETS = [250, 500, 650, 1000, 1500, 2000, 2500, 3000] as const;

/** Reference table rows — word count → pages → reading time. */
const LENGTH_TABLE = [250, 500, 750, 1000, 1500, 2000, 2500, 3000, 5000];

const TARGET_STORAGE_KEY = 'writescholar_word_counter_target';

const WordCounterPage = ({ onNavigate, user, onLogout }: WordCounterPageProps) => {
  const [text, setText] = useState('');
  // Word-count goal (e.g. a 1,500-word assignment). Remembered between
  // visits — students come back to the same essay.
  const [target, setTarget] = useState<number | null>(() => {
    try {
      const raw = localStorage.getItem(TARGET_STORAGE_KEY);
      const n = raw ? parseInt(raw, 10) : NaN;
      return Number.isFinite(n) && n > 0 ? n : null;
    } catch {
      return null;
    }
  });
  const [stats, setStats] = useState({
    words: 0,
    characters: 0,
    charactersNoSpaces: 0,
    sentences: 0,
    paragraphs: 0,
    readingTime: '0 min',
    speakingTime: '0 min'
  });

  const pickTarget = (value: number | null) => {
    setTarget(value);
    try {
      if (value) localStorage.setItem(TARGET_STORAGE_KEY, String(value));
      else localStorage.removeItem(TARGET_STORAGE_KEY);
    } catch { /* private mode — the picker still works for this session */ }
  };

  // SEO: per-route title, description, canonical, OG, Twitter, plus tool schema.
  useEffect(() => {
    applyPageSeoTags({
      ...TOOL_SEO_META['word-counter'],
    });
    injectToolProductSchema({
      name: 'Essay Word Counter',
      description: 'Free essay word counter — live word, character, sentence, paragraph and page counts, plus reading and speaking time and a word-limit tracker.',
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
              Essay Word Counter
            </h1>
            <p className="text-lg text-stone-500 dark:text-stone-400 leading-relaxed max-w-2xl mx-auto font-semibold">
              Count words, characters, sentences and paragraphs as you type — and see instantly how many pages your essay fills. Set your assignment&apos;s word limit and track how close you are. Free, no sign-up.
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
                    <span className="text-stone-500 dark:text-stone-400 font-bold">Pages (double-spaced)</span>
                    <span className="font-extrabold text-stone-900 dark:text-stone-100">{formatPages(stats.words, WORDS_PER_PAGE_DOUBLE)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b-2 border-stone-100 dark:border-stone-800">
                    <span className="text-stone-500 dark:text-stone-400 font-bold">Pages (single-spaced)</span>
                    <span className="font-extrabold text-stone-900 dark:text-stone-100">{formatPages(stats.words, WORDS_PER_PAGE_SINGLE)}</span>
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
                <p className="mt-3 text-[11px] text-stone-400 dark:text-stone-500 font-bold leading-snug">
                  Page estimates assume 12pt Times New Roman with 1-inch margins — 250 words per double-spaced page.
                </p>
              </div>

              {/* ─── Assignment target — pick the word limit you were
                  set and the counter tracks how close you are. */}
              <div className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-extrabold text-stone-900 dark:text-stone-100 uppercase tracking-wide">Essay Target</h3>
                  {target && (
                    <button
                      onClick={() => pickTarget(null)}
                      className="text-[11px] font-extrabold uppercase tracking-wide text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {ESSAY_TARGETS.map((t) => (
                    <button
                      key={t}
                      onClick={() => pickTarget(target === t ? null : t)}
                      aria-pressed={target === t}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border-2 transition-all ${
                        target === t
                          ? 'bg-[#1CB0F6] text-white border-[#1899D6]'
                          : 'bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-600 hover:border-[#1CB0F6]/50'
                      }`}
                    >
                      {t.toLocaleString()}
                    </button>
                  ))}
                </div>
                {target ? (
                  (() => {
                    const pct = Math.min(100, Math.round((stats.words / target) * 100));
                    const diff = stats.words - target;
                    const over = diff > 0;
                    const hit = stats.words > 0 && Math.abs(diff) <= Math.max(5, target * 0.02);
                    const barColor = over ? '#FF9600' : hit ? '#58CC02' : '#1CB0F6';
                    return (
                      <>
                        <div className="h-3 w-full rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden border-2 border-stone-200 dark:border-stone-700">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{ width: `${Math.max(pct, stats.words > 0 ? 3 : 0)}%`, backgroundColor: barColor }}
                          />
                        </div>
                        <p className="mt-3 text-sm font-extrabold text-stone-900 dark:text-stone-100">
                          {stats.words.toLocaleString()} / {target.toLocaleString()} words
                          <span className="ml-1.5 text-stone-400 dark:text-stone-500">({pct}%)</span>
                        </p>
                        <p className="mt-1 text-xs font-bold" style={{ color: barColor }}>
                          {over
                            ? `${diff.toLocaleString()} words over the limit`
                            : diff === 0
                              ? 'Exactly on target'
                              : `${Math.abs(diff).toLocaleString()} words to go`}
                        </p>
                        <p className="mt-2 text-[11px] text-stone-400 dark:text-stone-500 font-bold">
                          A {target.toLocaleString()}-word essay is about {formatPages(target, WORDS_PER_PAGE_DOUBLE)} pages double-spaced.
                        </p>
                      </>
                    );
                  })()
                ) : (
                  <p className="text-xs text-stone-400 dark:text-stone-500 font-bold leading-snug">
                    Pick the word limit you were set (or type your own below) and the counter will track how far off you are.
                  </p>
                )}
                <label className="mt-4 flex items-center gap-2 text-xs font-extrabold text-stone-500 dark:text-stone-400">
                  Custom
                  <input
                    type="number"
                    min={1}
                    max={100000}
                    value={target ?? ''}
                    onChange={(e) => {
                      const n = parseInt(e.target.value, 10);
                      pickTarget(Number.isFinite(n) && n > 0 ? n : null);
                    }}
                    placeholder="e.g. 1200"
                    className="w-24 px-2 py-1.5 rounded-lg border-2 border-stone-200 dark:border-stone-600 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-200 font-extrabold tabular-nums outline-none focus:border-[#1CB0F6] transition-colors"
                    aria-label="Custom word target"
                  />
                </label>
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

      {/* ─── Word count → page count reference ────────────────────
          "How many pages is 500 words" is the single most-searched
          follow-up to a word count, so answer it on the page rather
          than making people work it out. */}
      <section className="py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-extrabold text-stone-900 dark:text-stone-100 mb-3 text-center uppercase tracking-wide">
            How Many Pages Is Your Essay?
          </h2>
          <p className="text-stone-500 dark:text-stone-400 font-semibold text-center max-w-2xl mx-auto mb-8">
            Word limits are set in words, but page counts are what you actually see on screen. These are the standard conversions for 12pt Times New Roman with 1-inch margins — the format nearly every assignment brief assumes.
          </p>
          <div className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 dark:bg-stone-800">
                    <th scope="col" className="px-5 py-3 text-xs font-extrabold uppercase tracking-wide text-stone-500 dark:text-stone-400">Words</th>
                    <th scope="col" className="px-5 py-3 text-xs font-extrabold uppercase tracking-wide text-stone-500 dark:text-stone-400">Double-spaced</th>
                    <th scope="col" className="px-5 py-3 text-xs font-extrabold uppercase tracking-wide text-stone-500 dark:text-stone-400">Single-spaced</th>
                    <th scope="col" className="px-5 py-3 text-xs font-extrabold uppercase tracking-wide text-stone-500 dark:text-stone-400">Reading time</th>
                  </tr>
                </thead>
                <tbody>
                  {LENGTH_TABLE.map((words) => {
                    const mins = Math.max(1, Math.ceil(words / 200));
                    return (
                      <tr key={words} className="border-t-2 border-stone-100 dark:border-stone-800">
                        <th scope="row" className="px-5 py-3 font-extrabold text-stone-900 dark:text-stone-100 tabular-nums text-left">
                          {words.toLocaleString()}
                        </th>
                        <td className="px-5 py-3 font-bold text-stone-600 dark:text-stone-300 tabular-nums">
                          {formatPages(words, WORDS_PER_PAGE_DOUBLE)} {formatPages(words, WORDS_PER_PAGE_DOUBLE) === '1' ? 'page' : 'pages'}
                        </td>
                        <td className="px-5 py-3 font-bold text-stone-600 dark:text-stone-300 tabular-nums">
                          {formatPages(words, WORDS_PER_PAGE_SINGLE)} {formatPages(words, WORDS_PER_PAGE_SINGLE) === '1' ? 'page' : 'pages'}
                        </td>
                        <td className="px-5 py-3 font-bold text-stone-600 dark:text-stone-300 tabular-nums">
                          {mins} min
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <p className="mt-4 text-sm text-stone-500 dark:text-stone-400 font-semibold leading-relaxed">
            Change any of those variables and the page count moves: 11pt fits roughly 10% more words per page, 1.5 spacing sits between the two columns above, and handwritten work averages about 125 words per page. When a brief gives you a page count rather than a word count, multiply pages by 250 for a double-spaced target — a 5-page paper is roughly 1,250 words.
          </p>

          {/* Per-length guides — real anchors so they're crawlable, and
              genuinely the next question after "how many pages is this". */}
          <div className="mt-8">
            <h3 className="text-sm font-extrabold uppercase tracking-wide text-stone-500 dark:text-stone-400 mb-3">
              How to structure each length
            </h3>
            <div className="flex flex-wrap gap-2">
              {LENGTH_TABLE.map((words) => (
                <a
                  key={words}
                  href={`/guides/how-long-is-a-${words}-word-essay`}
                  className="inline-flex items-center px-3.5 py-2 rounded-xl border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm font-extrabold text-stone-600 dark:text-stone-300 hover:border-[#1CB0F6]/50 hover:text-[#1899D6] dark:hover:text-[#1CB0F6] active:border-b-2 active:translate-y-0.5 transition-all"
                >
                  {words.toLocaleString()}-word essay
                </a>
              ))}
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
