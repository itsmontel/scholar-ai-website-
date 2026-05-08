import { useState } from 'react';

interface StudySetViewerProps {
  data: {
    quiz?: any;
    flashcards?: any;
    crossword?: any;
    lesson?: any;
    craterBlast?: any;
  };
  title?: string;
  onClose: () => void;
  onNavigate: (page: string) => void;
  userPlan?: string;
}

const TOOL_COLORS: Record<string, { bg: string; border: string; hover: string }> = {
  lesson:      { bg: 'bg-[#1CB0F6]', border: 'border-b-[#1899D6]', hover: 'hover:bg-[#1AA3E5]' },
  flashcards:  { bg: 'bg-[#FF9600]', border: 'border-b-[#E08600]', hover: 'hover:bg-[#F08E00]' },
  quiz:        { bg: 'bg-[#58CC02]', border: 'border-b-[#46A302]', hover: 'hover:bg-[#4EBB02]' },
  crossword:   { bg: 'bg-[#A560E8]', border: 'border-b-[#8B4EC8]', hover: 'hover:bg-[#9A55DD]' },
  craterBlast: { bg: 'bg-[#FF4B4B]', border: 'border-b-[#E03C3C]', hover: 'hover:bg-[#F04040]' },
};

const TABS = [
  { key: 'lesson', label: 'Lesson', icon: '📖', desc: 'Visual cards lesson', proOnly: false },
  { key: 'flashcards', label: 'Flashcards', icon: '🃏', desc: 'Study flashcards', proOnly: false },
  { key: 'quiz', label: 'Quiz', icon: '📝', desc: 'Multiple choice quiz', proOnly: false },
  { key: 'crossword', label: 'Crossword', icon: '🧩', desc: 'Crossword puzzle', proOnly: true },
  { key: 'craterBlast', label: 'Crater Blast', icon: '💥', desc: 'Quiz shooter game', proOnly: true },
] as const;

const PRO_LOCKED_TABS = ['crossword', 'craterBlast'] as const;

type TabKey = typeof TABS[number]['key'];

const StudySetViewer = ({ data, title, onClose, onNavigate, userPlan }: StudySetViewerProps) => {
  const [selectedTab, setSelectedTab] = useState<TabKey | null>(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState<TabKey | null>(null);

  const plan = (userPlan || 'free').toLowerCase();
  const isPaidUser = plan === 'pro' || plan === 'premium';

  const isLocked = (tabKey: TabKey): boolean => {
    if (isPaidUser) return false;
    return (PRO_LOCKED_TABS as readonly string[]).includes(tabKey);
  };

  const handleOpen = (tab: TabKey) => {
    const d = data[tab];
    if (!d) return;

    if (isLocked(tab)) {
      setShowUpgradePrompt(tab);
      return;
    }

    localStorage.setItem('writescholar_minimal_ui', 'true');

    switch (tab) {
      case 'quiz':
        localStorage.setItem('savedQuiz', JSON.stringify({
          title: d.title || title || 'Quiz',
          questions: d.questions,
          quiz_type: d.quizType || 'mixed',
          difficulty: d.difficulty || 'medium',
          question_count: d.questionCount ?? d.displayCount ?? d.questions?.length ?? 10,
          source_word_count: d.sourceWordCount ?? 0,
        }));
        onNavigate('quiz-generator');
        break;
      case 'flashcards':
        localStorage.setItem('savedFlashcards', JSON.stringify({
          title: d.title || title || 'Flashcards',
          questions: d.cards,
          source_word_count: d.sourceWordCount ?? 0,
        }));
        onNavigate('create-flashcards');
        break;
      case 'crossword':
        localStorage.setItem('savedCrossword', JSON.stringify({
          title: d.title || title || 'Crossword',
          questions: {
            grid: d.grid,
            clues: d.clues,
            gridSize: d.gridSize,
            placedWords: d.placedWords,
          },
          source_word_count: d.sourceWordCount ?? 0,
        }));
        onNavigate('crossword-generator');
        break;
      case 'lesson':
        try {
          const packTitle = title || data.quiz?.title || data.flashcards?.title || data.lesson?.title || 'Study Pack';
          sessionStorage.setItem('writescholar_study_pack_viewer', JSON.stringify({ data, title: packTitle }));
          sessionStorage.setItem('writescholar_study_pack_return_tab', 'lesson');
          onNavigate('study-pack-viewer');
        } catch (_) {
          onNavigate('study-pack-viewer');
        }
        break;
      case 'craterBlast':
        localStorage.setItem('savedCraterBlast', JSON.stringify({
          title: title || 'Crater Blast',
          questions: {
            questions: d.questions,
            inputType: 'notes',
          },
          quiz_type: 'crater_blast',
        }));
        onNavigate('crater-blast');
        break;
    }
    onClose();
  };

  const packTitle = title || data.quiz?.title || data.flashcards?.title || data.lesson?.title || 'Study Set';

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-pwIn">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-stone-800 shadow-2xl border-2 border-stone-200/80 dark:border-stone-700/60">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/80 dark:bg-stone-700 text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 hover:bg-white dark:hover:bg-stone-600 transition-all shadow-sm border border-stone-200 dark:border-stone-600"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Gradient header banner */}
        <div className="bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-t-3xl px-6 pt-7 pb-6 text-center">
          <span className="text-5xl mb-2 block animate-duoBounce">📚</span>
          <h2 className="text-xl font-extrabold text-white leading-tight tracking-tight">
            {packTitle}
          </h2>
          <p className="text-violet-100 text-sm mt-1.5 font-medium">
            {isPaidUser ? 'Choose how you want to study!' : 'Pick a study tool to get started!'}
          </p>
        </div>

        <div className="p-5">
          {/* Free user notice */}
          {!isPaidUser && (
            <div className="mb-4 p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-2 border-amber-200/80 dark:border-amber-700/40 border-b-4 border-b-amber-300 dark:border-b-amber-700">
              <p className="text-sm text-amber-800 dark:text-amber-300 text-center font-bold">
                ✨ Unlock Crossword & Crater Blast with <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gradient-to-r from-amber-400 to-yellow-400 text-white text-xs font-extrabold shadow-sm border-b-2 border-amber-500">⭐ PRO</span>
              </p>
            </div>
          )}

          {/* Tool cards */}
          <div className="space-y-3">
            {TABS.map((tab) => {
              const hasData = !!data[tab.key];
              const locked = isLocked(tab.key);
              const info = getTabInfo(data, tab.key, locked);
              const colors = TOOL_COLORS[tab.key];
              return (
                <button
                  key={tab.key}
                  onClick={() => hasData && handleOpen(tab.key)}
                  onMouseEnter={() => setSelectedTab(tab.key)}
                  onMouseLeave={() => setSelectedTab(null)}
                  disabled={!hasData}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-b-4 transition-all text-left group ${
                    hasData
                      ? locked
                        ? 'border-stone-200 dark:border-stone-600 bg-stone-100/80 dark:bg-stone-700/30 hover:border-violet-300 dark:hover:border-violet-600 hover:bg-violet-50/40 dark:hover:bg-violet-900/10 cursor-pointer border-b-stone-300 dark:border-b-stone-600'
                        : `${colors.bg} ${colors.hover} ${colors.border} border-transparent cursor-pointer hover:translate-y-[-2px] active:translate-y-[1px] active:border-b-2 shadow-md hover:shadow-lg`
                      : 'border-stone-100 dark:border-stone-700/30 bg-stone-50/50 dark:bg-stone-800/30 opacity-40 cursor-not-allowed border-b-stone-200 dark:border-b-stone-700'
                  }`}
                >
                  <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 transition-transform ${hasData && !locked ? 'group-hover:scale-110' : ''} ${
                    hasData && !locked
                      ? 'bg-white/25'
                      : locked
                        ? 'bg-stone-200/60 dark:bg-stone-600/30'
                        : 'bg-stone-100 dark:bg-stone-700/50'
                  }`}>
                    {locked && (
                      <div className="absolute inset-0 flex items-center justify-center bg-stone-300/60 dark:bg-stone-500/40 rounded-2xl">
                        <svg className="w-6 h-6 text-stone-600 dark:text-stone-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                    )}
                    <span className={locked ? 'opacity-40' : ''}>{tab.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-extrabold text-[15px] flex items-center gap-2 ${
                      hasData && !locked ? 'text-white' : locked ? 'text-stone-600 dark:text-stone-400' : 'text-stone-800 dark:text-stone-100'
                    }`}>
                      {tab.label}
                      {locked && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-extrabold rounded-lg bg-gradient-to-r from-amber-400 to-yellow-400 text-white shadow-sm border-b-2 border-amber-500">
                          ⭐ PRO
                        </span>
                      )}
                    </div>
                    <div className={`text-xs font-semibold mt-0.5 ${
                      hasData && !locked ? 'text-white/80' : locked ? 'text-stone-400 dark:text-stone-500' : 'text-stone-500 dark:text-stone-400'
                    }`}>{info || tab.desc}</div>
                  </div>
                  {hasData && !locked && (
                    <svg className="w-7 h-7 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                  {hasData && locked && (
                    <span className="text-xs font-extrabold text-violet-600 dark:text-violet-400 flex-shrink-0 bg-violet-100 dark:bg-violet-900/40 px-2.5 py-1 rounded-xl">Upgrade</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Upgrade Prompt Modal */}
      {showUpgradePrompt && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" onClick={() => setShowUpgradePrompt(null)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-stone-800 shadow-2xl border-2 border-stone-200/80 dark:border-stone-700/60 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Gradient top bar */}
            <div className="bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 pt-6 pb-5 text-center">
              <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30">
                <span className="text-4xl">{showUpgradePrompt === 'craterBlast' ? '💥' : '🧩'}</span>
              </div>
              <h3 className="text-xl font-extrabold text-white">
                {showUpgradePrompt === 'craterBlast' ? 'Crater Blast' : 'Crossword'} is a Pro feature
              </h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-stone-500 dark:text-stone-400 text-sm mb-6 leading-relaxed">
                Upgrade to Pro to unlock {showUpgradePrompt === 'craterBlast' ? 'Crater Blast' : 'crossword puzzles'} and more ways to practice your study material.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => { setShowUpgradePrompt(null); onClose(); onNavigate('pricing'); }}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white font-extrabold text-base rounded-2xl shadow-lg shadow-violet-500/30 transition-all active:translate-y-[1px] border-b-4 border-violet-700 active:border-b-2 hover:translate-y-[-1px]"
                >
                  ⭐ Upgrade to Pro
                </button>
                <button
                  onClick={() => setShowUpgradePrompt(null)}
                  className="w-full py-3 px-4 text-stone-500 dark:text-stone-400 font-bold text-sm hover:text-stone-700 dark:hover:text-stone-300 transition-colors rounded-2xl hover:bg-stone-100 dark:hover:bg-stone-700/40"
                >
                  Maybe later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pwIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .animate-pwIn { animation: pwIn 0.25s ease-out forwards; }
        @keyframes duoBounce {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-6px); }
        }
        .animate-duoBounce { animation: duoBounce 2s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

function getTabInfo(data: any, key: TabKey, locked?: boolean): string {
  const d = data[key];
  if (!d) return 'Not available';
  const count = (() => {
    switch (key) {
      case 'quiz': return `${d.questions?.length || 0} questions`;
      case 'flashcards': return `${d.cards?.length || 0} flashcards`;
      case 'crossword': return `${d.placedWords?.length || d.words?.length || 0} words`;
      case 'lesson': return `${d.slides?.length || d.totalSlides || 0} slides`;
      case 'craterBlast': return `${d.questions?.length || 0} questions`;
      default: return '';
    }
  })();
  if (locked) return `${count} • Upgrade to unlock`;
  return count;
}

export default StudySetViewer;
