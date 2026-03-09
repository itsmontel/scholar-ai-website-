import Header from '../common/Header';
import Footer from '../common/Footer';

interface MoreToolsPageProps {
  onNavigate: (page: string) => void;
  user?: any;
  onLogout?: () => void;
}

const freeTools = [
  { id: 'citation-generator-tool', icon: '📚', title: 'Citation Generator', desc: 'Format citations in APA, MLA, Chicago, Harvard', gradient: 'from-sky-400 to-blue-500', page: 'citation-generator-tool' },
  { id: 'word-counter', icon: '📊', title: 'Word Counter', desc: 'Count words, characters, sentences & reading time', gradient: 'from-blue-400 to-indigo-500', page: 'word-counter' },
  { id: 'essay-outline', icon: '📋', title: 'Essay Outline', desc: 'Generate structured outlines for any essay type', gradient: 'from-teal-400 to-cyan-500', page: 'essay-outline' },
  { id: 'thesis-generator', icon: '🎯', title: 'Thesis Generator', desc: 'Create strong thesis statements for your essays', gradient: 'from-violet-400 to-purple-500', page: 'thesis-generator' },
  { id: 'grammar-checker', icon: '✏️', title: 'Grammar Checker', desc: 'Fix spelling, grammar & punctuation errors', gradient: 'from-emerald-400 to-teal-500', page: 'grammar-checker' },
  { id: 'readability-score', icon: '📖', title: 'Readability Score', desc: 'Check Flesch-Kincaid grade level & reading ease', gradient: 'from-amber-400 to-orange-500', page: 'readability-score' },
  { id: 'paraphrasing-tips', icon: '🔄', title: 'Paraphrasing Tips', desc: 'Find overused words & get synonym suggestions', gradient: 'from-rose-400 to-pink-500', page: 'paraphrasing-tips' },
  { id: 'text-case-converter', icon: 'Aa', title: 'Text Case Converter', desc: 'UPPERCASE, lowercase, Title Case & more', gradient: 'from-indigo-400 to-violet-500', page: 'text-case-converter' },
  { id: 'gpa-calculator', icon: '📚', title: 'GPA Calculator', desc: 'Calculate semester or cumulative GPA', gradient: 'from-cyan-400 to-sky-500', page: 'gpa-calculator' },
  { id: 'pomodoro-timer', icon: '⏱️', title: 'Pomodoro Timer', desc: 'Focus timer with work & break intervals', gradient: 'from-orange-400 to-amber-500', page: 'pomodoro-timer' },
  { id: 'calculator', icon: '🧮', title: 'Scientific Calculator', desc: 'Trig, log, powers & more for math & science', gradient: 'from-violet-400 to-fuchsia-500', page: 'calculator' },
  { id: 'converter', icon: '📐', title: 'Unit Converter', desc: 'Length, weight, temp, volume, speed & energy', gradient: 'from-amber-400 to-orange-500', page: 'converter' },
];

const MoreToolsPage = ({ onNavigate, user, onLogout }: MoreToolsPageProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/60 via-stone-50 to-white dark:bg-stone-900">
      <div className="h-1 bg-gradient-to-r from-blue-500 via-violet-500 to-purple-500" />
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
            More Free Tools
          </h1>
          <p className="text-stone-500 dark:text-stone-400 text-lg max-w-2xl">
            Handy utilities for students, All free.
          </p>
        </div>

        {/* Tools grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {freeTools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => onNavigate(tool.page)}
              className="relative p-5 rounded-3xl border bg-white dark:bg-stone-800 text-left transition-all duration-300 group hover:shadow-2xl hover:-translate-y-1 overflow-hidden border-stone-200/80 dark:border-stone-700/50 hover:border-violet-300 dark:hover:border-violet-600"
            >
              <div className={`absolute top-0 right-0 w-24 h-24 rounded-full -translate-y-1/2 translate-x-1/2 bg-gradient-to-br ${tool.gradient} opacity-60`} />
              <div className={`relative z-10 w-12 h-12 bg-gradient-to-br ${tool.gradient} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
                {tool.page === 'text-case-converter' ? (
                  <span className="text-lg font-bold text-white">Aa</span>
                ) : (
                  <span className="text-2xl">{tool.icon}</span>
                )}
              </div>
              <h3 className="font-bold text-base leading-tight text-stone-800 dark:text-stone-100 relative z-10 mb-1">
                {tool.title}
              </h3>
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
