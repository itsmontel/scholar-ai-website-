import Header from '../common/Header';
import Footer from '../common/Footer';

interface MoreToolsPageProps {
  onNavigate: (page: string) => void;
  user?: any;
  onLogout?: () => void;
}

const moreTools = [
  { id: 'summarizer', icon: '📋', title: 'Summarizer', desc: 'Condense papers and articles into key points', gradient: 'from-rose-400 to-red-500', page: 'summarizer', free: true },
  { id: 'citation-generator-tool', icon: '📚', title: 'Citation Generator', desc: 'Format citations in APA, MLA, Chicago, Harvard', gradient: 'from-rose-400 to-red-500', page: 'citation-generator-tool', free: true },
  { id: 'word-counter', icon: '📊', title: 'Word Counter', desc: 'Count words, characters, sentences & reading time', gradient: 'from-rose-400 to-red-500', page: 'word-counter', free: true },
  { id: 'essay-outline', icon: '📋', title: 'Essay Outline', desc: 'Generate structured outlines for any essay type', gradient: 'from-rose-400 to-red-500', page: 'essay-outline', free: true },
  { id: 'thesis-generator', icon: '🎯', title: 'Thesis Generator', desc: 'Create strong thesis statements for your essays', gradient: 'from-rose-400 to-red-500', page: 'thesis-generator', free: true },
  { id: 'grammar-checker', icon: '✏️', title: 'Grammar Checker', desc: 'Fix spelling, grammar & punctuation errors', gradient: 'from-rose-400 to-red-500', page: 'grammar-checker', free: true },
  { id: 'readability-score', icon: '📖', title: 'Readability Score', desc: 'Check Flesch-Kincaid grade level & reading ease', gradient: 'from-rose-400 to-red-500', page: 'readability-score', free: true },
  { id: 'paraphrasing-tips', icon: '🔄', title: 'Paraphrasing Tips', desc: 'Find overused words & get synonym suggestions', gradient: 'from-rose-400 to-red-500', page: 'paraphrasing-tips', free: true },
  { id: 'text-case-converter', icon: 'Aa', title: 'Text Case Converter', desc: 'UPPERCASE, lowercase, Title Case & more', gradient: 'from-rose-400 to-red-500', page: 'text-case-converter', free: true },
  { id: 'gpa-calculator', icon: '📚', title: 'GPA Calculator', desc: 'Calculate semester or cumulative GPA', gradient: 'from-rose-400 to-red-500', page: 'gpa-calculator', free: true },
  { id: 'pomodoro-timer', icon: '⏱️', title: 'Pomodoro Timer', desc: 'Focus timer with work & break intervals', gradient: 'from-rose-400 to-red-500', page: 'pomodoro-timer', free: true },
  { id: 'calculator', icon: '🧮', title: 'Scientific Calculator', desc: 'Trig, log, powers & more for math & science', gradient: 'from-rose-400 to-red-500', page: 'calculator', free: true },
  { id: 'converter', icon: '📐', title: 'Unit Converter', desc: 'Length, weight, temp, volume, speed & energy', gradient: 'from-rose-400 to-red-500', page: 'converter', free: true },
];


const MoreToolsPage = ({ onNavigate, user, onLogout }: MoreToolsPageProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/60 via-stone-50 to-white dark:bg-stone-900">
      <div className="h-1 bg-gradient-to-r from-rose-500 via-pink-500 to-red-500" />
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="more-tools" />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Back button */}
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2 text-stone-600 dark:text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:underline mb-8 text-sm font-medium transition-colors"
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

        {/* Tools grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {moreTools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => onNavigate(tool.page)}
              className="relative p-5 rounded-3xl border bg-white dark:bg-stone-800 text-left transition-all duration-300 group hover:shadow-2xl hover:-translate-y-1 overflow-hidden border-stone-200/80 dark:border-stone-700/50 hover:border-rose-300 dark:hover:border-rose-600"
            >
              <div className={`absolute top-0 right-0 w-24 h-24 rounded-full -translate-y-1/2 translate-x-1/2 bg-gradient-to-br ${tool.gradient} opacity-60`} />
              <div className={`relative z-10 w-12 h-12 bg-gradient-to-br ${tool.gradient} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
                {tool.page === 'text-case-converter' ? (
                  <span className="text-lg font-bold text-white">Aa</span>
                ) : (
                  <span className="text-2xl">{tool.icon}</span>
                )}
              </div>
              <div className="flex items-center gap-2 relative z-10 mb-1">
                <h3 className="font-bold text-base leading-tight text-stone-800 dark:text-stone-100">
                  {tool.title}
                </h3>
                {tool.free && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400">
                    Free
                  </span>
                )}
              </div>
              <p className="text-stone-500 dark:text-stone-400 text-xs leading-relaxed relative z-10">
                {tool.desc}
              </p>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 dark:text-violet-400 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                Open tool
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </button>
          ))}
        </div>

        {/* CTA to dashboard */}
        <div className="mt-12 text-center">
          <p className="text-stone-500 dark:text-stone-400 text-sm mb-4">
            Need AI-powered tools? Essay analysis, citations, quizzes, flashcards & more are on your dashboard.
          </p>
          <button
            onClick={() => onNavigate('dashboard')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all"
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
