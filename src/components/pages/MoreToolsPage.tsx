import Header from '../common/Header';
import { WriteScholarEditorialBackgroundLayers } from '../common/WriteScholarEditorialBackground';
import Footer from '../common/Footer';

interface MoreToolsPageProps {
  onNavigate: (page: string) => void;
  user?: any;
  onLogout?: () => void;
}

const DUO_COLORS = [
  { bg: '#A560E8', border: '#8A48C7' },
  { bg: '#1CB0F6', border: '#1899D6' },
  { bg: '#58CC02', border: '#46A302' },
  { bg: '#FF9600', border: '#D97F00' },
  { bg: '#FF4B4B', border: '#E04343' },
];

export const moreTools = [
  { id: 'summarizer', icon: '📋', title: 'Summarizer', desc: 'Condense papers and articles into key points', page: 'summarizer', free: true, ci: 0 },
  { id: 'citation-generator-tool', icon: '📚', title: 'Citation Generator', desc: 'Format citations in APA, MLA, Chicago, Harvard', page: 'citation-generator-tool', free: true, ci: 1 },
  { id: 'word-counter', icon: '📊', title: 'Word Counter', desc: 'Count words, characters, sentences & reading time', page: 'word-counter', free: true, ci: 2 },
  { id: 'essay-outline', icon: '📝', title: 'Essay Outline', desc: 'Generate structured outlines for any essay type', page: 'essay-outline', free: true, ci: 0 },
  { id: 'thesis-generator', icon: '🎯', title: 'Thesis Generator', desc: 'Create strong thesis statements for your essays', page: 'thesis-generator', free: true, ci: 4 },
  { id: 'grammar-checker', icon: '✏️', title: 'Grammar Checker', desc: 'Fix spelling, grammar & punctuation errors', page: 'grammar-checker', free: true, ci: 2 },
  { id: 'readability-score', icon: '📖', title: 'Readability Score', desc: 'Check Flesch-Kincaid grade level & reading ease', page: 'readability-score', free: true, ci: 1 },
  { id: 'paraphrasing-tips', icon: '🔄', title: 'Paraphrasing Tips', desc: 'Find overused words & get synonym suggestions', page: 'paraphrasing-tips', free: true, ci: 3 },
  { id: 'text-case-converter', icon: 'Aa', title: 'Text Case Converter', desc: 'UPPERCASE, lowercase, Title Case & more', page: 'text-case-converter', free: true, ci: 1 },
  { id: 'gpa-calculator', icon: '🎓', title: 'GPA Calculator', desc: 'Calculate semester or cumulative GPA', page: 'gpa-calculator', free: true, ci: 2 },
  { id: 'pomodoro-timer', icon: '⏱️', title: 'Pomodoro Timer', desc: 'Focus timer with work & break intervals', page: 'pomodoro-timer', free: true, ci: 4 },
  { id: 'calculator', icon: '🧮', title: 'Scientific Calculator', desc: 'Trig, log, powers & more for math & science', page: 'calculator', free: true, ci: 0 },
  { id: 'converter', icon: '📐', title: 'Unit Converter', desc: 'Length, weight, temp, volume, speed & energy', page: 'converter', free: true, ci: 3 },
];

/** Reusable grid of free tools — also used embedded on the dashboard */
export function MoreToolsGrid({
  onNavigate,
  compact,
  className = '',
}: {
  onNavigate: (page: string) => void;
  /** Tighter cards and spacing for in-dashboard use */
  compact?: boolean;
  className?: string;
}) {
  const gap = compact ? 'gap-2.5 sm:gap-3' : 'gap-4';
  const cols = compact
    ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
    : 'grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
  const pad = compact ? 'p-3 sm:p-3.5 rounded-2xl' : 'p-4 sm:p-5 rounded-2xl';
  const iconSize = compact ? 'w-10 h-10 rounded-xl mb-2.5' : 'w-12 h-12 rounded-xl mb-3';

  return (
    <div className={`${cols} ${gap} ${className}`} style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
      {moreTools.map((tool) => {
        const c = DUO_COLORS[tool.ci];
        return (
          <button
            key={tool.id}
            type="button"
            onClick={() => onNavigate(tool.page)}
            className={`${pad} text-left transition-all group bg-white dark:bg-stone-900 border-2 border-b-4 border-stone-200 dark:border-stone-700 hover:border-stone-300 active:border-b-2 active:translate-y-0.5 overflow-hidden`}
          >
            <div
              className={`${iconSize} flex items-center justify-center text-white border-2 border-b-4 group-hover:scale-105 transition-transform`}
              style={{ backgroundColor: c.bg, borderColor: c.border }}
            >
              {tool.page === 'text-case-converter' ? (
                <span className={`${compact ? 'text-sm' : 'text-lg'} font-extrabold text-white`}>Aa</span>
              ) : (
                <span className={compact ? 'text-xl' : 'text-2xl'}>{tool.icon}</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
              <h3
                className={`font-extrabold leading-tight text-stone-800 dark:text-stone-50 ${
                  compact ? 'text-sm' : 'text-base'
                }`}
              >
                {tool.title}
              </h3>
              {tool.free && (
                <span className="px-1.5 py-0.5 text-[9px] font-extrabold rounded-md bg-[#EAFFD6] text-[#58CC02] border border-[#58CC02]/30">
                  Free
                </span>
              )}
            </div>
            <p
              className={`text-stone-500 dark:text-stone-400 leading-snug font-bold ${
                compact ? 'text-[11px] line-clamp-2' : 'text-xs'
              }`}
            >
              {tool.desc}
            </p>
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold mt-2 transition-colors" style={{ color: c.bg }}>
              Open tool
              <svg className="w-3 h-3 translate-x-0 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </button>
        );
      })}
    </div>
  );
}

const MoreToolsPage = ({ onNavigate, user, onLogout }: MoreToolsPageProps) => {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <WriteScholarEditorialBackgroundLayers position="fixed" />
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="more-tools" />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2 text-stone-500 dark:text-stone-400 font-extrabold mb-8 text-sm bg-white dark:bg-stone-800 px-4 py-2 rounded-xl border-2 border-b-4 border-stone-200 dark:border-stone-700 active:border-b-2 active:translate-y-0.5 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>

        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-800 dark:text-stone-100 mb-3">
            More Tools
          </h1>
          <p className="text-stone-500 dark:text-stone-400 text-lg max-w-2xl font-bold">
            Lessons, summarize, and handy utilities for students.
          </p>
        </div>

        <MoreToolsGrid onNavigate={onNavigate} />

        <div className="mt-12 text-center">
          <p className="text-stone-500 dark:text-stone-400 text-sm mb-4 font-bold">
            Need AI-powered tools? Essay analysis, citations, quizzes, flashcards & more are on your dashboard.
          </p>
          <button
            onClick={() => onNavigate('dashboard')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-extrabold uppercase tracking-wide text-white bg-[#1CB0F6] border-2 border-b-4 border-[#1899D6] active:border-b-2 active:translate-y-0.5 transition-all"
          >
            Go to Dashboard
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default MoreToolsPage;
