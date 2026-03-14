import { useState, useEffect } from 'react';
import Header from '../common/Header';
import FlashcardViewer from '../common/FlashcardViewer';
import LessonViewer from '../common/LessonViewer';
import QuizViewer from '../common/QuizViewer';
import CrosswordViewer from '../common/CrosswordViewer';
import ScholarMascot from '../common/ScholarMascot';
import ExportFormatModal, { type ExportFormat } from '../common/ExportFormatModal';
import { exportStudyPackSegment } from '../../utils/studyPackExport';

const TABS = [
  { key: 'notes', label: 'Original Notes', icon: '📄', proOnly: false },
  { key: 'lesson', label: 'Lesson', icon: '📖', proOnly: false },
  { key: 'flashcards', label: 'Flashcards', icon: '🃏', proOnly: false },
  { key: 'quiz', label: 'Quiz', icon: '📝', proOnly: false },
  { key: 'crossword', label: 'Crossword', icon: '🧩', proOnly: true },
  { key: 'craterBlast', label: 'Crater Blast', icon: '💥', proOnly: true },
] as const;

type TabKey = typeof TABS[number]['key'];

const STORAGE_KEY = 'writescholar_study_pack_viewer';
const RETURN_TAB_KEY = 'writescholar_study_pack_return_tab';
const RETURN_STATE_KEY = 'writescholar_study_pack_return_state';

interface StudyPackViewerPageProps {
  onNavigate: (page: string) => void;
  user?: { id: string; plan?: string } | null;
  onLogout?: () => void;
  /** Optional: pass data directly when navigating from Dashboard after generation */
  initialData?: { data: any; title?: string };
}

const StudyPackViewerPage = ({ onNavigate, user, onLogout, initialData }: StudyPackViewerPageProps) => {
  const [pack, setPack] = useState<{ data: any; title: string } | null>(initialData || null);
  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    try {
      const data = initialData?.data ?? (() => { const r = sessionStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r)?.data : null; })();
      return data?.originalNotes ? 'notes' : 'lesson';
    } catch { return 'lesson'; }
  });
  const [returnState, setReturnState] = useState<Record<string, number> | null>(null);
  const [exportFormatTarget, setExportFormatTarget] = useState<'pdf' | 'docx' | 'json' | null>(null);

  useEffect(() => {
    if (initialData) {
      setPack(initialData);
      return;
    }
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.data) setPack({ data: parsed.data, title: parsed.title || 'Study Pack' });
      }
    } catch (_) {}
  }, [initialData]);

  useEffect(() => {
    try {
      const tab = sessionStorage.getItem(RETURN_TAB_KEY) as TabKey | null;
      if (tab && TABS.some(t => t.key === tab)) {
        setActiveTab(tab);
        sessionStorage.removeItem(RETURN_TAB_KEY);
      }
      const stateRaw = sessionStorage.getItem(RETURN_STATE_KEY);
      if (stateRaw) {
        const state = JSON.parse(stateRaw) as Record<string, number>;
        setReturnState(state);
        sessionStorage.removeItem(RETURN_STATE_KEY);
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (returnState) {
      const t = setTimeout(() => setReturnState(null), 100);
      return () => clearTimeout(t);
    }
  }, [returnState]);

  const plan = (user?.plan || 'free').toLowerCase();
  const isPaidUser = plan === 'pro' || plan === 'premium';
  const isLocked = (key: TabKey) => !isPaidUser && ['crossword', 'craterBlast'].includes(key);

  const handleOpenFull = (tab: TabKey, state?: { questionIndex?: number; slideIndex?: number }) => {
    const d = pack?.data?.[tab];
    if (!d) return;
    if (isLocked(tab)) {
      onNavigate('pricing');
      return;
    }
    localStorage.setItem('writescholar_minimal_ui', 'true');
    sessionStorage.setItem('writescholar_return_to_study_pack_viewer', 'true');
    sessionStorage.setItem(RETURN_TAB_KEY, tab);
    if (state && Object.keys(state).length > 0) {
      sessionStorage.setItem(RETURN_STATE_KEY, JSON.stringify(state));
    }
    const title = pack?.title || 'Study Set';

    switch (tab) {
      case 'quiz':
        localStorage.setItem('savedQuiz', JSON.stringify({
          title: d.title || title,
          questions: d.questions,
          quiz_type: d.quizType || 'mixed',
          difficulty: d.difficulty || 'medium',
          question_count: d.questionCount ?? d.questions?.length ?? 10,
          source_word_count: d.sourceWordCount ?? 0,
          initial_question_index: state?.questionIndex,
        }));
        onNavigate('quiz-generator');
        break;
      case 'flashcards':
        localStorage.setItem('savedFlashcards', JSON.stringify({
          title: d.title || title,
          questions: d.cards,
          source_word_count: d.sourceWordCount ?? 0,
        }));
        onNavigate('create-flashcards');
        break;
      case 'crossword':
        localStorage.setItem('savedCrossword', JSON.stringify({
          title: d.title || title,
          questions: { grid: d.grid, clues: d.clues, gridSize: d.gridSize, placedWords: d.placedWords },
          source_word_count: d.sourceWordCount ?? 0,
        }));
        onNavigate('crossword-generator');
        break;
      case 'lesson':
        // InteractiveLessonPage expects questions = array of slides, not object
        const slides = d.slides || [];
        if (slides.length > 0) {
          localStorage.setItem('savedLesson', JSON.stringify({
            title: d.title || title,
            questions: slides,
            question_count: d.totalSlides ?? slides.length,
            estimated_read_time: d.estimatedReadTime ?? Math.ceil(slides.length * 1.5),
            difficulty: d.style || 'visual',
            quiz_bank: d.quizBank || [],
            quiz_display_count: d.quizDisplayCount ?? 6,
            initial_slide_index: state?.slideIndex,
          }));
          onNavigate('interactive-lesson');
        }
        break;
      case 'craterBlast':
        localStorage.setItem('savedCraterBlast', JSON.stringify({
          title: title,
          questions: { questions: d.questions, inputType: 'notes' },
          quiz_type: 'crater_blast',
        }));
        onNavigate('crater-blast');
        break;
    }
  };

  const hasExportableContent = () => {
    if (!pack?.data) return false;
    return !!(
      pack.data.originalNotes ||
      pack.data.quiz?.questions?.length ||
      pack.data.flashcards?.cards?.length ||
      pack.data.crossword?.placedWords?.length ||
      pack.data.lesson?.slides?.length
    );
  };

  if (!pack?.data) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-900">
        <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="study-pack-viewer" />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <ScholarMascot size={100} animated={true} pose="studying" />
          <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100 mt-6">No study pack loaded</h2>
          <p className="text-stone-500 dark:text-stone-400 mt-2">Open a study pack from your Recents or generate one from the dashboard.</p>
          <button
            onClick={() => onNavigate('dashboard')}
            className="mt-6 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-xl hover:from-amber-400 hover:to-orange-500 transition-all shadow-lg shadow-amber-500/25"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const hasData = (key: TabKey) => key === 'notes' ? !!pack.data?.originalNotes : !!pack.data[key];
  const packTitle = pack.title || pack.data.quiz?.title || pack.data.flashcards?.title || pack.data.lesson?.title || 'Study Pack';
  const handleExportFormatSelect = (format: ExportFormat) => {
    if (!pack?.data || !exportFormatTarget) return;
    exportStudyPackSegment(pack.data, packTitle, format, exportFormatTarget);
    setExportFormatTarget(null);
  };

  const flashcardCards = pack.data.flashcards?.cards?.map((c: any, i: number) => ({
    id: `card-${i}`,
    front: c.front ?? c.term ?? '',
    back: c.back ?? c.definition ?? '',
  })) ?? [];

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900 flex flex-col">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="study-pack-viewer" />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {/* Back + Title + Export - mobile-optimized layout */}
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 mb-6">
          <div className="flex items-start sm:items-center gap-2 min-w-0 flex-1">
            <button
              onClick={() => onNavigate('dashboard')}
              className="p-2 rounded-lg text-stone-500 hover:text-stone-700 hover:bg-stone-200 dark:hover:bg-stone-700 dark:hover:text-stone-300 transition-colors shrink-0"
              aria-label="Back"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-2xl font-bold text-stone-800 dark:text-stone-100 truncate" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }} title={packTitle}>
                {packTitle}
              </h1>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">Switch between study tools below</p>
            </div>
          </div>
          {hasExportableContent() && (
            <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
              <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end sm:justify-start">
                {isPaidUser && (
                  <>
                    <button
                      onClick={() => setExportFormatTarget('pdf')}
                      className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 font-medium text-xs sm:text-sm transition-colors border border-red-200 dark:border-red-800"
                    >
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      <span>PDF</span>
                    </button>
                    <button
                      onClick={() => setExportFormatTarget('docx')}
                      className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 font-medium text-xs sm:text-sm transition-colors border border-blue-200 dark:border-blue-800"
                    >
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      <span>Word</span>
                    </button>
                  </>
                )}
                {hasData('flashcards') && (
                  <button
                    onClick={() => exportStudyPackSegment(pack.data, packTitle, 'flashcards', 'json')}
                    className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 font-medium text-xs sm:text-sm transition-colors border border-emerald-200 dark:border-emerald-800"
                  >
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm3 10a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm-2-4a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1z" clipRule="evenodd"/></svg>
                    <span>JSON</span>
                  </button>
                )}
                {!isPaidUser && (
                  <button
                    onClick={() => onNavigate('pricing')}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30 font-medium text-xs sm:text-sm transition-colors border border-amber-200 dark:border-amber-800"
                  >
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    Upgrade to export
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Tab bar - horizontal pills, scroll on mobile */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {TABS.map((tab) => {
            const has = hasData(tab.key);
            const locked = isLocked(tab.key);
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => has && setActiveTab(tab.key)}
                disabled={!has}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
                  active
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25'
                    : has
                      ? 'bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-amber-300'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-400 cursor-not-allowed'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {locked && has && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-400">Pro</span>}
              </button>
            );
          })}
        </div>

        {/* Content area */}
        <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 shadow-lg overflow-hidden min-h-[400px]">
          {activeTab === 'notes' && hasData('notes') && (
            <div className="p-4 sm:p-6 flex flex-col min-h-0 h-full">
              <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <span className="text-sm font-medium text-stone-500 dark:text-stone-400">Your original study material</span>
              </div>
              <div className="flex-1 min-h-0 overflow-auto rounded-xl bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-600 p-4 sm:p-6">
                <p className="text-stone-700 dark:text-stone-300 text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                  {pack.data.originalNotes}
                </p>
              </div>
            </div>
          )}
          {activeTab === 'lesson' && hasData('lesson') && !isLocked('lesson') && (
            <LessonViewer
              slides={pack.data.lesson?.slides ?? []}
              title={pack.data.lesson?.title || packTitle}
              onEnlarge={(state) => handleOpenFull('lesson', state)}
              initialSlideIndex={returnState?.slideIndex}
              hasQuiz={hasData('quiz')}
              onTryQuiz={() => setActiveTab('quiz')}
            />
          )}
          {activeTab === 'flashcards' && hasData('flashcards') && !isLocked('flashcards') && (
            <div className="p-4">
              <FlashcardViewer
                initialCards={flashcardCards}
                title={packTitle}
                onEnlarge={() => handleOpenFull('flashcards')}
              />
            </div>
          )}
          {activeTab === 'quiz' && hasData('quiz') && !isLocked('quiz') && (
            <QuizViewer
              questions={pack.data.quiz?.questions ?? []}
              title={pack.data.quiz?.title || packTitle}
              onEnlarge={(state) => handleOpenFull('quiz', state)}
              initialQuestionIndex={returnState?.questionIndex}
            />
          )}
          {activeTab === 'crossword' && hasData('crossword') && !isLocked('crossword') && (
            <CrosswordViewer
              grid={pack.data.crossword?.grid ?? []}
              placedWords={pack.data.crossword?.placedWords ?? []}
              title={pack.data.crossword?.title || packTitle}
              onEnlarge={() => handleOpenFull('crossword')}
            />
          )}
          {activeTab === 'craterBlast' && hasData('craterBlast') && !isLocked('craterBlast') && (
            <div className="p-6 flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-full max-w-sm text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-6 shadow-xl" style={{ background: 'linear-gradient(145deg, #4f46e5 0%, #6366f1 50%, #8b5cf6 100%)' }}>
                  <span className="text-4xl">💥</span>
                </div>
                <h2 className="text-2xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight mb-2">Crater Blast</h2>
                <p className="text-stone-500 dark:text-stone-400 text-sm mb-8">{(Array.isArray(pack.data.craterBlast?.questions) ? pack.data.craterBlast.questions : pack.data.craterBlast?.questions?.questions ?? []).length} questions ready</p>
                <button
                  onClick={() => handleOpenFull('craterBlast')}
                  className="inline-block px-12 py-3.5 rounded-xl text-white font-bold text-base shadow-lg active:scale-[0.99] transition-all mb-6"
                  style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)', boxShadow: '0 10px 30px -5px rgba(99, 102, 241, 0.4)' }}
                >
                  💥 Start Game
                </button>
                <button
                  onClick={() => setActiveTab('notes')}
                  className="block w-full max-w-xs mx-auto px-6 py-3 rounded-xl bg-stone-200 dark:bg-stone-600 text-stone-700 dark:text-stone-200 font-semibold hover:bg-stone-300 dark:hover:bg-stone-500 transition-colors"
                >
                  ← Back to menu
                </button>
              </div>
            </div>
          )}
          {(activeTab !== 'notes' || !hasData('notes')) &&
           (activeTab !== 'lesson' || isLocked('lesson') || !hasData('lesson')) &&
           (activeTab !== 'flashcards' || isLocked('flashcards') || !hasData('flashcards')) &&
           (activeTab !== 'quiz' || isLocked('quiz') || !hasData('quiz')) &&
           (activeTab !== 'crossword' || isLocked('crossword') || !hasData('crossword')) &&
           (activeTab !== 'craterBlast' || isLocked('craterBlast') || !hasData('craterBlast')) && (
            <div className="p-8 sm:p-12 flex flex-col items-center justify-center min-h-[400px] text-center">
              {isLocked(activeTab) ? (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 flex items-center justify-center text-4xl mb-4">
                    {TABS.find(t => t.key === activeTab)?.icon}
                  </div>
                  <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100 mb-2">{TABS.find(t => t.key === activeTab)?.label} is a Pro feature</h3>
                  <p className="text-stone-500 dark:text-stone-400 text-sm mb-6">Upgrade to unlock crosswords and Crater Blast.</p>
                  <button
                    onClick={() => onNavigate('pricing')}
                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-xl hover:from-amber-400 hover:to-orange-500 transition-all shadow-lg shadow-amber-500/25"
                  >
                    Upgrade to Pro
                  </button>
                  {(activeTab === 'crossword' || activeTab === 'craterBlast') && (
                    <div className="mt-8 w-full max-w-md md:max-w-2xl lg:max-w-3xl mx-auto">
                      <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-2">See how it works</p>
                      <div className="rounded-xl overflow-hidden border border-stone-200 dark:border-stone-600 shadow-lg aspect-video bg-stone-100 dark:bg-stone-800">
                        <video
                          key={activeTab}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="w-full h-full object-contain"
                          title={activeTab === 'crossword' ? 'WriteScholar Crossword Generator — Create study puzzles from notes' : 'WriteScholar Crater Blast — Quiz game study mode'}
                          aria-label={activeTab === 'crossword' ? 'WriteScholar Crossword Generator — Create study puzzles from notes' : 'WriteScholar Crater Blast — Quiz game study mode'}
                        >
                          <source src={activeTab === 'crossword' ? '/writescholar-crossword-demo.mp4' : '/writescholar-crater-blast-demo.mp4'} type="video/mp4" />
                        </video>
                      </div>
                    </div>
                  )}
                </>
              ) : hasData(activeTab) ? (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 flex items-center justify-center text-4xl mb-4">
                    {TABS.find(t => t.key === activeTab)?.icon}
                  </div>
                  <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100 mb-2">Open {TABS.find(t => t.key === activeTab)?.label}</h3>
                  <p className="text-stone-500 dark:text-stone-400 text-sm mb-6">
                    {activeTab === 'lesson' && `${pack.data.lesson?.slides?.length || 0} slides`}
                    {activeTab === 'quiz' && `${pack.data.quiz?.questions?.length || 0} questions`}
                    {activeTab === 'crossword' && `${pack.data.crossword?.placedWords?.length || 0} words`}
                    {activeTab === 'craterBlast' && `${pack.data.craterBlast?.questions?.length || 0} questions`}
                    {!['lesson','quiz','crossword','craterBlast'].includes(activeTab) && 'Ready to study'}
                  </p>
                  <button
                    onClick={() => handleOpenFull(activeTab)}
                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-xl hover:from-amber-400 hover:to-orange-500 transition-all shadow-lg shadow-amber-500/25 flex items-center gap-2"
                  >
                    <span>Open {TABS.find(t => t.key === activeTab)?.label}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                  </button>
                </>
              ) : (
                <p className="text-stone-500 dark:text-stone-400">No data for this tool</p>
              )}
            </div>
          )}
        </div>
      </main>

      {exportFormatTarget && (
        <ExportFormatModal
          packData={pack.data}
          packTitle={packTitle}
          targetFormat={exportFormatTarget}
          onSelect={handleExportFormatSelect}
          onClose={() => setExportFormatTarget(null)}
        />
      )}
    </div>
  );
};

export default StudyPackViewerPage;
