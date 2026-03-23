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

      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-stone-800 shadow-2xl border border-stone-200/80 dark:border-stone-700/60">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 dark:bg-stone-700 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-600 transition-all"
          aria-label="Close"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="h-1.5 bg-gradient-to-r from-violet-500 via-violet-500 to-violet-500 rounded-t-3xl" />

        <div className="p-6">
          <div className="text-center mb-5">
            <span className="text-3xl mb-2 block">📚</span>
            <h2 className="text-lg font-bold text-stone-800 dark:text-stone-100 leading-tight" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              {packTitle}
            </h2>
            <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">
              {isPaidUser ? 'Choose how you want to study' : 'Lesson and flashcards are ready to use'}
            </p>
          </div>

          {/* Free user notice */}
          {!isPaidUser && (
            <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-violet-50 to-violet-50 dark:from-violet-900/20 dark:to-violet-900/20 border border-violet-200/60 dark:border-violet-800/40">
              <p className="text-xs text-violet-700 dark:text-violet-300 text-center">
                <span className="font-semibold">Unlock crossword & Crater Blast with Pro</span> for more ways to practice
              </p>
            </div>
          )}

          <div className="space-y-2.5">
            {TABS.map((tab) => {
              const hasData = !!data[tab.key];
              const locked = isLocked(tab.key);
              const info = getTabInfo(data, tab.key, locked);
              return (
                <button
                  key={tab.key}
                  onClick={() => hasData && handleOpen(tab.key)}
                  onMouseEnter={() => setSelectedTab(tab.key)}
                  onMouseLeave={() => setSelectedTab(null)}
                  disabled={!hasData}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left group ${
                    hasData
                      ? locked
                        ? 'border-stone-200/60 dark:border-stone-700/40 bg-stone-50/80 dark:bg-stone-700/20 hover:border-violet-300 dark:hover:border-violet-600 hover:bg-violet-50/30 dark:hover:bg-violet-900/10 cursor-pointer'
                        : 'border-stone-200/80 dark:border-stone-700/60 bg-stone-50 dark:bg-stone-700/30 hover:border-violet-300 dark:hover:border-violet-600 hover:bg-violet-50/50 dark:hover:bg-violet-900/20 hover:shadow-md active:scale-[0.98] cursor-pointer'
                      : 'border-stone-100 dark:border-stone-700/30 bg-stone-50/50 dark:bg-stone-800/30 opacity-40 cursor-not-allowed'
                  }`}
                >
                  <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 transition-transform ${hasData && !locked ? 'group-hover:scale-110' : ''} ${
                    selectedTab === tab.key && !locked ? 'bg-violet-100 dark:bg-violet-900/40' : locked ? 'bg-stone-100/80 dark:bg-stone-700/30' : 'bg-stone-100 dark:bg-stone-700/50'
                  }`}>
                    {locked && (
                      <div className="absolute inset-0 flex items-center justify-center bg-stone-200/60 dark:bg-stone-600/40 rounded-xl">
                        <svg className="w-5 h-5 text-stone-500 dark:text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                    )}
                    <span className={locked ? 'opacity-40' : ''}>{tab.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-bold text-sm flex items-center gap-2 ${locked ? 'text-stone-500 dark:text-stone-400' : 'text-stone-800 dark:text-stone-100'}`}>
                      {tab.label}
                      {locked && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-violet-600 text-white">
                          PRO
                        </span>
                      )}
                    </div>
                    <div className={`text-xs ${locked ? 'text-stone-400 dark:text-stone-500' : 'text-stone-500 dark:text-stone-400'}`}>{info || tab.desc}</div>
                  </div>
                  {hasData && !locked && (
                    <svg className="w-5 h-5 text-stone-400 group-hover:text-violet-500 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                  {hasData && locked && (
                    <span className="text-xs font-medium text-violet-600 dark:text-violet-400 flex-shrink-0">Upgrade</span>
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
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-stone-800 shadow-2xl border border-stone-200/80 dark:border-stone-700/60 p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gradient-to-br from-violet-100 to-violet-100 dark:from-violet-900/40 dark:to-violet-900/40 flex items-center justify-center">
              <svg className="w-7 h-7 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100 mb-2">
              {showUpgradePrompt === 'craterBlast' ? 'Crater Blast' : 'Crossword'} is a Pro feature
            </h3>
            <p className="text-stone-500 dark:text-stone-400 text-sm mb-5">
              Upgrade to Pro to unlock {showUpgradePrompt === 'craterBlast' ? 'Crater Blast' : 'crossword puzzles'} and more ways to practice your study material.
            </p>
            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => { setShowUpgradePrompt(null); onClose(); onNavigate('pricing'); }}
                className="w-full py-3 px-4 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-lg shadow-violet-500/25 transition-all active:scale-[0.98]"
              >
                Upgrade to Pro
              </button>
              <button
                onClick={() => setShowUpgradePrompt(null)}
                className="w-full py-2.5 px-4 text-stone-500 dark:text-stone-400 font-medium text-sm hover:text-stone-700 dark:hover:text-stone-300 transition-colors"
              >
                Maybe later
              </button>
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
