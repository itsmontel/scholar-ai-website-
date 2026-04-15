import Header from '../common/Header';
import { WriteScholarEditorialBackgroundLayers } from '../common/WriteScholarEditorialBackground';
import Footer from '../common/Footer';

interface MoreToolsPageProps {
  onNavigate: (page: string) => void;
  user?: any;
  onLogout?: () => void;
}

/** Each tool gets its own accent so the grid doesn’t look like one flat gradient */
export const moreTools = [
  { id: 'summarizer', icon: '📋', title: 'Summarizer', desc: 'Condense papers and articles into key points', gradient: 'from-violet-600 to-fuchsia-500', topBar: 'from-violet-500 via-fuchsia-500 to-pink-400', surface: 'bg-gradient-to-br from-violet-50/95 via-white to-fuchsia-50/50 dark:from-violet-950/45 dark:via-stone-900/90 dark:to-fuchsia-950/20', borderIdle: 'border-violet-200/70 dark:border-violet-800/40', borderHover: 'hover:border-fuchsia-400/80 dark:hover:border-fuchsia-500/50', blob: 'opacity-[0.22]', page: 'summarizer', free: true },
  { id: 'citation-generator-tool', icon: '📚', title: 'Citation Generator', desc: 'Format citations in APA, MLA, Chicago, Harvard', gradient: 'from-sky-500 to-blue-700', topBar: 'from-sky-400 via-blue-500 to-indigo-500', surface: 'bg-gradient-to-br from-sky-50/95 via-white to-blue-50/50 dark:from-sky-950/35 dark:via-stone-900/90 dark:to-blue-950/25', borderIdle: 'border-sky-200/80 dark:border-sky-800/45', borderHover: 'hover:border-blue-400/80 dark:hover:border-blue-500/45', blob: 'opacity-[0.2]', page: 'citation-generator-tool', free: true },
  { id: 'word-counter', icon: '📊', title: 'Word Counter', desc: 'Count words, characters, sentences & reading time', gradient: 'from-cyan-500 to-teal-600', topBar: 'from-cyan-400 to-teal-500', surface: 'bg-gradient-to-br from-cyan-50/90 via-white to-teal-50/45 dark:from-cyan-950/30 dark:via-stone-900/90 dark:to-teal-950/20', borderIdle: 'border-cyan-200/70 dark:border-cyan-800/40', borderHover: 'hover:border-teal-400/75 dark:hover:border-teal-500/45', blob: 'opacity-[0.2]', page: 'word-counter', free: true },
  { id: 'essay-outline', icon: '📝', title: 'Essay Outline', desc: 'Generate structured outlines for any essay type', gradient: 'from-indigo-500 to-purple-600', topBar: 'from-indigo-400 via-violet-500 to-purple-600', surface: 'bg-gradient-to-br from-indigo-50/90 via-white to-purple-50/45 dark:from-indigo-950/35 dark:via-stone-900/90 dark:to-purple-950/20', borderIdle: 'border-indigo-200/75 dark:border-indigo-800/40', borderHover: 'hover:border-violet-400/80 dark:hover:border-violet-500/45', blob: 'opacity-[0.2]', page: 'essay-outline', free: true },
  { id: 'thesis-generator', icon: '🎯', title: 'Thesis Generator', desc: 'Create strong thesis statements for your essays', gradient: 'from-rose-500 to-orange-500', topBar: 'from-rose-400 to-orange-500', surface: 'bg-gradient-to-br from-rose-50/90 via-white to-orange-50/45 dark:from-rose-950/30 dark:via-stone-900/90 dark:to-orange-950/20', borderIdle: 'border-rose-200/75 dark:border-rose-800/40', borderHover: 'hover:border-orange-400/80 dark:hover:border-orange-500/45', blob: 'opacity-[0.22]', page: 'thesis-generator', free: true },
  { id: 'grammar-checker', icon: '✏️', title: 'Grammar Checker', desc: 'Fix spelling, grammar & punctuation errors', gradient: 'from-emerald-500 to-green-700', topBar: 'from-emerald-400 to-green-600', surface: 'bg-gradient-to-br from-emerald-50/90 via-white to-green-50/40 dark:from-emerald-950/30 dark:via-stone-900/90 dark:to-green-950/20', borderIdle: 'border-emerald-200/75 dark:border-emerald-800/40', borderHover: 'hover:border-green-400/75 dark:hover:border-green-500/45', blob: 'opacity-[0.18]', page: 'grammar-checker', free: true },
  { id: 'readability-score', icon: '📖', title: 'Readability Score', desc: 'Check Flesch-Kincaid grade level & reading ease', gradient: 'from-blue-500 to-indigo-700', topBar: 'from-blue-400 to-indigo-600', surface: 'bg-gradient-to-br from-blue-50/90 via-white to-indigo-50/45 dark:from-blue-950/30 dark:via-stone-900/90 dark:to-indigo-950/25', borderIdle: 'border-blue-200/75 dark:border-blue-800/40', borderHover: 'hover:border-indigo-400/80 dark:hover:border-indigo-500/45', blob: 'opacity-[0.2]', page: 'readability-score', free: true },
  { id: 'paraphrasing-tips', icon: '🔄', title: 'Paraphrasing Tips', desc: 'Find overused words & get synonym suggestions', gradient: 'from-amber-500 to-yellow-600', topBar: 'from-amber-400 to-yellow-500', surface: 'bg-gradient-to-br from-amber-50/90 via-white to-yellow-50/35 dark:from-amber-950/30 dark:via-stone-900/90 dark:to-yellow-950/15', borderIdle: 'border-amber-200/80 dark:border-amber-800/40', borderHover: 'hover:border-yellow-400/80 dark:hover:border-amber-500/45', blob: 'opacity-[0.22]', page: 'paraphrasing-tips', free: true },
  { id: 'text-case-converter', icon: 'Aa', title: 'Text Case Converter', desc: 'UPPERCASE, lowercase, Title Case & more', gradient: 'from-slate-600 to-zinc-800', topBar: 'from-slate-500 to-zinc-600', surface: 'bg-gradient-to-br from-slate-50/95 via-white to-zinc-50/50 dark:from-slate-900/50 dark:via-stone-900/95 dark:to-zinc-950/30', borderIdle: 'border-slate-200/80 dark:border-slate-600/50', borderHover: 'hover:border-zinc-400/70 dark:hover:border-zinc-500/45', blob: 'opacity-[0.15]', page: 'text-case-converter', free: true },
  { id: 'gpa-calculator', icon: '🎓', title: 'GPA Calculator', desc: 'Calculate semester or cumulative GPA', gradient: 'from-lime-500 to-emerald-700', topBar: 'from-lime-400 to-emerald-600', surface: 'bg-gradient-to-br from-lime-50/85 via-white to-emerald-50/45 dark:from-lime-950/25 dark:via-stone-900/90 dark:to-emerald-950/25', borderIdle: 'border-lime-200/70 dark:border-lime-900/35', borderHover: 'hover:border-emerald-400/75 dark:hover:border-emerald-500/45', blob: 'opacity-[0.2]', page: 'gpa-calculator', free: true },
  { id: 'pomodoro-timer', icon: '⏱️', title: 'Pomodoro Timer', desc: 'Focus timer with work & break intervals', gradient: 'from-red-500 to-rose-700', topBar: 'from-red-400 to-rose-600', surface: 'bg-gradient-to-br from-red-50/90 via-white to-rose-50/45 dark:from-red-950/30 dark:via-stone-900/90 dark:to-rose-950/25', borderIdle: 'border-red-200/75 dark:border-red-900/40', borderHover: 'hover:border-rose-400/80 dark:hover:border-rose-500/45', blob: 'opacity-[0.2]', page: 'pomodoro-timer', free: true },
  { id: 'calculator', icon: '🧮', title: 'Scientific Calculator', desc: 'Trig, log, powers & more for math & science', gradient: 'from-violet-600 to-indigo-800', topBar: 'from-violet-500 to-indigo-700', surface: 'bg-gradient-to-br from-violet-50/90 via-white to-indigo-50/45 dark:from-violet-950/35 dark:via-stone-900/90 dark:to-indigo-950/30', borderIdle: 'border-violet-200/75 dark:border-violet-800/45', borderHover: 'hover:border-indigo-400/80 dark:hover:border-indigo-500/45', blob: 'opacity-[0.2]', page: 'calculator', free: true },
  { id: 'converter', icon: '📐', title: 'Unit Converter', desc: 'Length, weight, temp, volume, speed & energy', gradient: 'from-orange-500 to-amber-600', topBar: 'from-orange-400 to-amber-500', surface: 'bg-gradient-to-br from-orange-50/90 via-white to-amber-50/40 dark:from-orange-950/30 dark:via-stone-900/90 dark:to-amber-950/20', borderIdle: 'border-orange-200/80 dark:border-orange-900/35', borderHover: 'hover:border-amber-400/85 dark:hover:border-amber-500/45', blob: 'opacity-[0.22]', page: 'converter', free: true },
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
  const pad = compact ? 'p-3 sm:p-3.5 pt-4 rounded-2xl' : 'p-4 sm:p-5 pt-5 rounded-3xl';
  const iconWrap = compact ? 'w-10 h-10 rounded-xl mb-2.5 ring-2 ring-white/30' : 'w-12 h-12 rounded-2xl mb-3 ring-2 ring-white/25';

  return (
    <div className={`${cols} ${gap} ${className}`}>
      {moreTools.map((tool, idx) => (
        <button
          key={tool.id}
          type="button"
          onClick={() => onNavigate(tool.page)}
          className={`relative ${pad} border text-left transition-all duration-300 group hover:shadow-2xl hover:-translate-y-1 overflow-hidden shadow-md ${tool.surface} ${tool.borderIdle} ${tool.borderHover}`}
        >
          <div
            className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${tool.topBar} rounded-t-[inherit]`}
            aria-hidden
          />
          <div
            className={`absolute ${idx % 2 === 0 ? '-right-6 top-0' : '-left-8 bottom-0'} w-24 h-24 rounded-full bg-gradient-to-br ${tool.gradient} blur-2xl ${tool.blob}`}
            aria-hidden
          />
          <div
            className={`relative z-10 ${iconWrap} bg-gradient-to-br ${tool.gradient} flex items-center justify-center shadow-lg group-hover:scale-105 group-hover:rotate-2 transition-all duration-300`}
          >
            {tool.page === 'text-case-converter' ? (
              <span className={`${compact ? 'text-sm' : 'text-lg'} font-bold text-white`}>Aa</span>
            ) : (
              <span className={compact ? 'text-xl' : 'text-2xl'}>{tool.icon}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 relative z-10 mb-0.5 flex-wrap">
            <h3
              className={`font-bold leading-tight text-stone-800 dark:text-stone-50 ${
                compact ? 'text-sm' : 'text-base'
              }`}
            >
              {tool.title}
            </h3>
            {tool.free && (
              <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-white/80 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-200/80 dark:ring-emerald-800/50">
                Free
              </span>
            )}
          </div>
          <p
            className={`text-stone-600 dark:text-stone-400 leading-snug relative z-10 ${
              compact ? 'text-[11px] line-clamp-2' : 'text-xs'
            }`}
          >
            {tool.desc}
          </p>
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold mt-2 relative z-10 text-stone-500 dark:text-stone-400 group-hover:text-stone-800 dark:group-hover:text-stone-200 transition-colors">
            Open tool
            <svg className="w-3 h-3 translate-x-0 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </button>
      ))}
    </div>
  );
}

const MoreToolsPage = ({ onNavigate, user, onLogout }: MoreToolsPageProps) => {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <WriteScholarEditorialBackgroundLayers position="fixed" />
      <div className="h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-red-500 relative z-10" />
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="more-tools" />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Back button */}
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2 text-stone-600 dark:text-stone-400 hover:text-violet-600 dark:hover:text-violet-400 hover:underline mb-8 text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-800 dark:text-stone-100 mb-3">
            More Tools
          </h1>
          <p className="text-stone-500 dark:text-stone-400 text-lg max-w-2xl">
            Lessons, summarize, and handy utilities for students.
          </p>
        </div>

        <MoreToolsGrid onNavigate={onNavigate} />

        {/* CTA to dashboard */}
        <div className="mt-12 text-center">
          <p className="text-stone-500 dark:text-stone-400 text-sm mb-4">
            Need AI-powered tools? Essay analysis, citations, quizzes, flashcards & more are on your dashboard.
          </p>
          <button
            onClick={() => onNavigate('dashboard')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold text-white bg-violet-600 hover:bg-violet-500 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all"
          >
            Go to Dashboard
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default MoreToolsPage;
