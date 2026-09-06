import { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import LoggedInPageShell from '../workspace/LoggedInPageShell';
import FlashcardViewer from '../common/FlashcardViewer';
import LessonViewer from '../common/LessonViewer';
import QuizViewer from '../common/QuizViewer';
import CrosswordViewer from '../common/CrosswordViewer';
import ScholarMascot from '../common/ScholarMascot';
import ExportFormatModal, { type ExportFormat } from '../common/ExportFormatModal';
import RandomMascotLoader from '../common/RandomMascotLoader';
import { exportStudyPackSegment } from '../../utils/studyPackExport';
import { trackEvent } from '../../utils/analytics';
import { openUpgradePaywall } from '../../utils/paywall';

// Game pages, lazy-loaded so they only ship when the user actually
// taps "Start Game" inside the viewer. Both pages already support a
// `showMinimalUI` flag (driven by `localStorage.writescholar_minimal_ui`)
// that hides their Header/Footer — exactly what we need for inline play.
const LightningReflexQuizPage = lazy(() => import('./tools/LightningReflexQuizPage'));
const WordTowerPage = lazy(() => import('./tools/WordTowerPage'));
const WordBlitzPage = lazy(() => import('../games/word-blitz/WordBlitzPage'));

const TABS = [
  { key: 'notes', label: 'Original Notes', icon: '📄', proOnly: false },
  { key: 'lesson', label: 'Lesson', icon: '📖', proOnly: false },
  { key: 'flashcards', label: 'Flashcards', icon: '🃏', proOnly: false },
  { key: 'quiz', label: 'Quiz', icon: '📝', proOnly: false },
  { key: 'crossword', label: 'Crossword', icon: '🧩', proOnly: true },
  { key: 'craterBlast', label: 'Crater Blast', icon: '💥', proOnly: true },
  { key: 'wordTower', label: 'Word Tower', icon: '🗼', proOnly: true },
  { key: 'wordBlitz', label: 'Word Blitz', icon: '⚡', proOnly: true },
] as const;

type TabKey = typeof TABS[number]['key'];

const STORAGE_KEY = 'writescholar_study_pack_viewer';
const RETURN_TAB_KEY = 'writescholar_study_pack_return_tab';
const RETURN_STATE_KEY = 'writescholar_study_pack_return_state';

const FULL_ACCESS_MS = 24 * 60 * 60 * 1000;

/** Free users get the first half of the deck / quiz after the 24h window. */
function freePreviewCount(total: number): number {
  if (total <= 0) return 0;
  return Math.max(1, Math.ceil(total / 2));
}

function parseCreatedAt(value: unknown): number | null {
  if (!value) return null;
  const t = Date.parse(String(value));
  return Number.isNaN(t) ? null : t;
}

function resolveCreatedAt(data: Record<string, unknown> | null | undefined): number | null {
  if (!data) return null;
  const nested = data.questions && typeof data.questions === 'object' && !Array.isArray(data.questions)
    ? (data.questions as Record<string, unknown>)
    : null;
  return (
    parseCreatedAt(data.created_at) ||
    parseCreatedAt(data.createdAt) ||
    parseCreatedAt(nested?.created_at) ||
    parseCreatedAt(nested?.createdAt)
  );
}

function normalizeViewerPack(raw: { data: any; title?: string } | null): { data: any; title: string } | null {
  if (!raw?.data) return raw ? { data: raw.data, title: raw.title || 'Study Pack' } : null;
  const d = raw.data;
  const nested = d.questions;
  const looksNested =
    nested &&
    typeof nested === 'object' &&
    !Array.isArray(nested) &&
    (nested.quiz || nested.flashcards || nested.lesson || nested.originalNotes);
  const data = looksNested
    ? { ...nested, created_at: d.created_at || d.createdAt || nested.created_at || nested.createdAt, id: d.id }
    : { ...d };
  if (!data.created_at && (d.created_at || d.createdAt)) {
    data.created_at = d.created_at || d.createdAt;
  }
  return { data, title: raw.title || 'Study Pack' };
}

function formatCountdown(ms: number): string {
  const clamped = Math.max(0, ms);
  const totalSec = Math.floor(clamped / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`;
  return `${s}s`;
}

interface StudyPackViewerPageProps {
  onNavigate: (page: string) => void;
  user?: { id: string; plan?: string } | null;
  onLogout?: () => void;
  initialData?: { data: any; title?: string };
}

function safeParseStorage(key: string): { data: any; title?: string } | null {
  try {
    const r = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(key) : null;
    if (!r) return null;
    const parsed = JSON.parse(r);
    return parsed?.data ? { data: parsed.data, title: parsed.title || 'Study Pack' } : null;
  } catch {
    return null;
  }
}

const StudyPackViewerPage = ({ onNavigate, user, onLogout, initialData }: StudyPackViewerPageProps) => {
  const [pack, setPack] = useState<{ data: any; title: string } | null>(() => {
    if (initialData?.data) return normalizeViewerPack({ data: initialData.data, title: initialData.title || 'Study Pack' });
    return normalizeViewerPack(safeParseStorage(STORAGE_KEY));
  });
  const [now, setNow] = useState(() => Date.now());
  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    try {
      const data = initialData?.data ?? safeParseStorage(STORAGE_KEY)?.data;
      return data?.originalNotes ? 'notes' : 'lesson';
    } catch { return 'lesson'; }
  });
  const [returnState, setReturnState] = useState<Record<string, number> | null>(null);
  const [exportFormatTarget, setExportFormatTarget] = useState<'pdf' | 'docx' | 'json' | null>(null);
  // When non-null, render the matching game page inline (full viewport,
  // minimal-UI). Setting it to null returns the user to the viewer tab.
  const [inlineGame, setInlineGame] = useState<'craterBlast' | 'wordTower' | 'wordBlitz' | null>(null);

  useEffect(() => {
    if (initialData?.data) {
      setPack(normalizeViewerPack({ data: initialData.data, title: initialData.title || 'Study Pack' }));
      return;
    }
    const fromStorage = normalizeViewerPack(safeParseStorage(STORAGE_KEY));
    if (fromStorage) setPack(fromStorage);
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
  const createdAtMs = useMemo(() => resolveCreatedAt(pack?.data), [pack]);
  const trialEndsAt = createdAtMs == null ? null : createdAtMs + FULL_ACCESS_MS;
  const remainingMs = trialEndsAt == null ? 0 : trialEndsAt - now;
  const hasTrialAccess = !isPaidUser && createdAtMs != null && remainingMs > 0;
  const trialExpired = !isPaidUser && createdAtMs != null && remainingMs <= 0;
  const hasFullAccess = isPaidUser || hasTrialAccess;
  // Free: full pack for 24h after create, then notes + lesson + half the
  // cards/quiz. Games stay Pro-locked after the window.
  const isLocked = (key: TabKey) => !hasFullAccess && (TABS.find((t) => t.key === key)?.proOnly ?? false);

  useEffect(() => {
    if (isPaidUser || createdAtMs == null) return;
    if (Date.now() >= createdAtMs + FULL_ACCESS_MS) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [isPaidUser, createdAtMs]);

  // Funnel: free user opened a Pro-locked tab (quiz / games) — the moment
  // they see the lock screen instead of content.
  useEffect(() => {
    if (isLocked(activeTab)) {
      trackEvent('lock_viewed', { feature: 'study_pack', tab: activeTab });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isPaidUser, hasFullAccess]);

  const handleOpenFull = (tab: TabKey, state?: { questionIndex?: number; slideIndex?: number }) => {
    const d = pack?.data?.[tab];
    if (!d) return;
    if (isLocked(tab) || (!hasFullAccess && (tab === 'quiz' || tab === 'flashcards'))) {
      openUpgradePaywall('study_pack_preview_enlarge');
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
        break;
      case 'craterBlast':
        // Stash the questions where the game page expects them, flip the
        // minimal-UI flag, then render the page inline (no route change).
        localStorage.setItem('savedCraterBlast', JSON.stringify({
          title: title,
          questions: { questions: d.questions, inputType: 'notes' },
          quiz_type: 'crater_blast',
        }));
        localStorage.setItem('writescholar_minimal_ui', 'true');
        setInlineGame('craterBlast');
        break;
      case 'wordTower':
        localStorage.setItem('savedWordTower', JSON.stringify({
          title: title,
          questions: { questions: d.questions, inputType: 'notes' },
          quiz_type: 'word_tower',
        }));
        localStorage.setItem('writescholar_minimal_ui', 'true');
        setInlineGame('wordTower');
        break;
      case 'wordBlitz':
        // Word Blitz expects the same `{ questions: { questions: [...] } }`
        // shape so its saved-game-load effect can decode it. quiz_type stays
        // 'word_blitz' so the My-Packs filter inside Word Blitz can pick
        // this up too.
        localStorage.setItem('savedWordBlitz', JSON.stringify({
          title: title,
          questions: { questions: d.questions, inputType: 'notes' },
          quiz_type: 'word_blitz',
        }));
        localStorage.setItem('writescholar_minimal_ui', 'true');
        setInlineGame('wordBlitz');
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

  // ── Inline game render ─────────────────────────────────────────────
  // When the user taps "Start Game" on the Crater Blast or Word Tower
  // tab, we render the game page in full-viewport minimal-UI mode here
  // (no route change, no separate page load). The game page's "Back to
  // study pack" button already calls onNavigate('study-pack-viewer') —
  // we intercept that and flip our state back to null instead, which
  // drops the user back into the viewer on the same tab they came from.
  if (inlineGame) {
    const wrappedNavigate = (page: string) => {
      // Pressing "Back to study pack" inside the game returns to the
      // viewer tab (no real route change). Anything else (e.g. logo
      // tap → dashboard) bubbles up to the real router.
      if (page === 'study-pack-viewer') {
        setInlineGame(null);
        return;
      }
      // Leaving for somewhere else also exits inline mode so we don't
      // leave a phantom game mounted in the background.
      setInlineGame(null);
      onNavigate(page);
    };
    return (
      <Suspense fallback={
        <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-stone-950 z-50">
          <RandomMascotLoader size={140} />
        </div>
      }>
        {inlineGame === 'craterBlast' ? (
          <LightningReflexQuizPage onNavigate={wrappedNavigate} user={user} onLogout={onLogout} />
        ) : inlineGame === 'wordTower' ? (
          <WordTowerPage onNavigate={wrappedNavigate} user={user} onLogout={onLogout} />
        ) : (
          <WordBlitzPage onNavigate={wrappedNavigate} user={user} onLogout={onLogout} />
        )}
      </Suspense>
    );
  }

  if (!pack?.data) {
    return (
      <LoggedInPageShell user={user} onNavigate={onNavigate} onLogout={onLogout} currentPage="study-pack-viewer">
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <ScholarMascot size={100} animated={true} pose="studying" />
          <h2 className="text-xl font-extrabold text-stone-800 dark:text-stone-100 mt-6 uppercase tracking-wide">No study pack loaded</h2>
          <p className="text-stone-500 dark:text-stone-400 mt-2">Open a study pack from your Recents or generate one from the dashboard.</p>
          <button
            onClick={() => onNavigate('dashboard')}
            className="mt-6 px-8 py-3 bg-[#58CC02] text-white font-bold uppercase tracking-wide rounded-xl border-2 border-b-4 border-[#46A302] active:border-b-2 active:translate-y-0.5 transition-all"
          >
            Go to Dashboard
          </button>
        </div>
      </LoggedInPageShell>
    );
  }

  const hasData = (key: TabKey) => key === 'notes' ? !!pack.data?.originalNotes : !!pack.data[key];
  const packTitle = pack.title || pack.data.quiz?.title || pack.data.flashcards?.title || pack.data.lesson?.title || 'Study Pack';
  const handleExportFormatSelect = (format: ExportFormat) => {
    if (!pack?.data || !exportFormatTarget) return;
    exportStudyPackSegment(pack.data, packTitle, format, exportFormatTarget);
    setExportFormatTarget(null);
  };

  const flashcardCards = (Array.isArray(pack.data?.flashcards?.cards) ? pack.data.flashcards.cards : []).map((c: any, i: number) => ({
    id: `card-${i}`,
    front: c?.front ?? c?.term ?? '',
    back: c?.back ?? c?.definition ?? '',
  }));

  const renderExportButtons = (vertical?: boolean) => {
    if (!hasExportableContent()) return null;
    const btnBase = vertical
      ? 'w-full flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-xs border-2 border-b-4 active:border-b-2 active:translate-y-0.5 transition-all'
      : 'flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm border-2 border-b-4 active:border-b-2 active:translate-y-0.5 transition-all';
    return (
      <>
        {hasFullAccess ? (
          <>
            <button onClick={() => setExportFormatTarget('pdf')} className={`${btnBase} bg-[#FF4B4B] text-white border-[#E04343]`}>
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              PDF
            </button>
            <button onClick={() => setExportFormatTarget('docx')} className={`${btnBase} bg-[#A560E8] text-white border-[#8A48C7]`}>
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Word
            </button>
          </>
        ) : (
          <button onClick={() => onNavigate('pricing')} className={`${btnBase} bg-[#FF9600] text-white border-[#D97F00]`} title="Upgrade to export to PDF and Word">
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            Upgrade
          </button>
        )}
        {hasData('flashcards') && (
          <button onClick={() => exportStudyPackSegment(pack.data, packTitle, 'flashcards', 'json')} className={`${btnBase} bg-[#58CC02] text-white border-[#46A302]`}>
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm3 10a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm-2-4a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1z" clipRule="evenodd"/></svg>
            JSON
          </button>
        )}
      </>
    );
  };

  const renderTabButton = (tab: typeof TABS[number], isVertical: boolean) => {
    const has = hasData(tab.key);
    const locked = isLocked(tab.key);
    const active = activeTab === tab.key;

    if (isVertical) {
      return (
        <button
          key={tab.key}
          onClick={() => has && setActiveTab(tab.key)}
          disabled={!has}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all text-left ${
            active
              ? 'bg-[#DDF4FF] dark:bg-[#1CB0F6]/15 text-[#1CB0F6]'
              : has
                ? 'text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700/50'
                : 'text-stone-400 dark:text-stone-600 cursor-not-allowed'
          }`}
        >
          <span className="text-lg">{tab.icon}</span>
          <span className="truncate flex-1">{tab.label}</span>
          {locked && has && <span className="text-[9px] px-1.5 py-0.5 rounded-lg bg-[#FF9600] text-white font-extrabold uppercase border-b border-[#D97F00]">Pro</span>}
        </button>
      );
    }

    return (
      <button
        key={tab.key}
        onClick={() => has && setActiveTab(tab.key)}
        disabled={!has}
        className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
          active
            ? 'bg-[#1CB0F6] text-white border-2 border-b-4 border-[#1899D6] active:border-b-2 active:translate-y-0.5'
            : has
              ? 'bg-white dark:bg-stone-800 border-2 border-b-4 border-stone-200 dark:border-stone-600 text-stone-700 dark:text-stone-300 hover:border-[#1CB0F6]/50 active:border-b-2 active:translate-y-0.5'
              : 'bg-stone-100 dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-700 text-stone-400 cursor-not-allowed'
        }`}
      >
        <span>{tab.icon}</span>
        <span>{tab.label}</span>
        {locked && has && <span className="text-[9px] px-1.5 py-0.5 rounded-lg bg-[#FF9600] text-white font-extrabold uppercase border-b border-[#D97F00]">Pro</span>}
      </button>
    );
  };

  const renderContent = () => (
    <>
      {activeTab === 'notes' && hasData('notes') && (
        <div className="p-4 sm:p-6 flex flex-col min-h-0 h-full">
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <span className="text-sm font-extrabold text-stone-500 dark:text-stone-400 uppercase tracking-wide">Your original study material</span>
          </div>
          <div className="flex-1 min-h-0 overflow-auto rounded-xl bg-stone-50 dark:bg-stone-900/50 border-2 border-b-4 border-stone-200 dark:border-stone-600 p-4 sm:p-6">
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
          initialSlideIndex={returnState?.slideIndex}
          hasQuiz={hasData('quiz')}
          onTryQuiz={() => setActiveTab('quiz')}
        />
      )}
      {activeTab === 'flashcards' && hasData('flashcards') && !isLocked('flashcards') && (() => {
        const previewCount = hasFullAccess ? flashcardCards.length : freePreviewCount(flashcardCards.length);
        const lockedCount = Math.max(0, flashcardCards.length - previewCount);
        const visibleCards = flashcardCards.slice(0, previewCount);
        return (
        <div className="p-4">
          <FlashcardViewer
            initialCards={visibleCards}
            title={packTitle}
            onEnlarge={hasFullAccess ? () => handleOpenFull('flashcards') : () => { trackEvent('upgrade_clicked', { source: 'study_pack_flashcard_enlarge' }); openUpgradePaywall('study_pack_flashcard_enlarge'); }}
          />
          {lockedCount > 0 && (
            <div className="mt-4 max-w-xl mx-auto rounded-2xl border-2 border-[#FF9600]/40 bg-gradient-to-br from-[#FFF4E0] to-white dark:from-[#FF9600]/12 dark:to-stone-900 p-4 sm:p-5 text-center">
              <p className="text-[14px] font-extrabold text-[#D97F00] dark:text-[#FFB84D]">
                +{lockedCount} more flashcard{lockedCount === 1 ? '' : 's'} in this deck
              </p>
              <p className="mt-1 text-[12px] font-bold text-stone-600 dark:text-stone-300 leading-snug">
                Free includes the first half. Unlock the full deck and study games with Pro.
              </p>
                  <button
                    type="button"
                    onClick={() => { trackEvent('upgrade_clicked', { source: 'study_pack_flashcard_banner' }); openUpgradePaywall('study_pack_flashcard_banner'); }}
                    className="mt-3 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#FF9600] hover:bg-[#D97F00] text-white text-[12px] font-extrabold uppercase tracking-wide border-2 border-b-[3px] border-[#D97F00] active:border-b-2 active:translate-y-0.5 transition-all"
                  >
                    Unlock all {flashcardCards.length} cards
                  </button>
            </div>
          )}
        </div>
        );
      })()}
      {activeTab === 'quiz' && hasData('quiz') && !isLocked('quiz') && (() => {
        const allQuestions = Array.isArray(pack.data.quiz?.questions) ? pack.data.quiz.questions : [];
        const previewCount = hasFullAccess ? allQuestions.length : freePreviewCount(allQuestions.length);
        const lockedCount = Math.max(0, allQuestions.length - previewCount);
        const visibleQuestions = allQuestions.slice(0, previewCount);
        return (
        <div className="p-4">
          <QuizViewer
            questions={visibleQuestions}
            title={pack.data.quiz?.title || packTitle}
            onEnlarge={hasFullAccess ? (state) => handleOpenFull('quiz', state) : () => { trackEvent('upgrade_clicked', { source: 'study_pack_quiz_enlarge' }); openUpgradePaywall('study_pack_quiz_enlarge'); }}
            initialQuestionIndex={returnState?.questionIndex}
          />
          {lockedCount > 0 && (
            <div className="mt-4 max-w-xl mx-auto rounded-2xl border-2 border-[#FF9600]/40 bg-gradient-to-br from-[#FFF4E0] to-white dark:from-[#FF9600]/12 dark:to-stone-900 p-4 sm:p-5 text-center">
              <p className="text-[14px] font-extrabold text-[#D97F00] dark:text-[#FFB84D]">
                +{lockedCount} more question{lockedCount === 1 ? '' : 's'} in this quiz
              </p>
              <p className="mt-1 text-[12px] font-bold text-stone-600 dark:text-stone-300 leading-snug">
                Free includes the first half. Unlock the rest of the quiz and study games with Pro.
              </p>
              <button
                type="button"
                onClick={() => { trackEvent('upgrade_clicked', { source: 'study_pack_quiz_banner' }); openUpgradePaywall('study_pack_quiz_banner'); }}
                className="mt-3 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#FF9600] hover:bg-[#D97F00] text-white text-[12px] font-extrabold uppercase tracking-wide border-2 border-b-[3px] border-[#D97F00] active:border-b-2 active:translate-y-0.5 transition-all"
              >
                Unlock all {allQuestions.length} questions
              </button>
            </div>
          )}
        </div>
        );
      })()}
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
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6 bg-[#A560E8] border-2 border-b-4 border-[#8A48C7]">
              <span className="text-4xl">💥</span>
            </div>
            <h2 className="text-2xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight mb-2">Crater Blast</h2>
            <p className="text-stone-500 dark:text-stone-400 text-sm mb-8 font-medium">{(Array.isArray(pack.data.craterBlast?.questions) ? pack.data.craterBlast.questions : pack.data.craterBlast?.questions?.questions ?? []).length} questions ready</p>
            <button
              onClick={() => handleOpenFull('craterBlast')}
              className="inline-flex items-center gap-2 px-12 py-3.5 rounded-xl text-white font-bold text-base uppercase tracking-wide bg-[#A560E8] border-2 border-b-4 border-[#8A48C7] active:border-b-2 active:translate-y-0.5 transition-all mb-6"
            >
              💥 Start Game
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className="block w-full max-w-xs mx-auto px-6 py-3 rounded-xl bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-200 font-bold border-2 border-b-4 border-stone-300 dark:border-stone-500 active:border-b-2 active:translate-y-0.5 transition-all"
            >
              ← Back to menu
            </button>
          </div>
        </div>
      )}
      {activeTab === 'wordTower' && hasData('wordTower') && !isLocked('wordTower') && (
        <div className="p-6 flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-full max-w-sm text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6 bg-[#58CC02] border-2 border-b-4 border-[#46A302]">
              <span className="text-4xl">🗼</span>
            </div>
            <h2 className="text-2xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight mb-2">Word Tower</h2>
            <p className="text-stone-500 dark:text-stone-400 text-sm mb-8 font-medium">{(Array.isArray(pack.data.wordTower?.questions) ? pack.data.wordTower.questions : pack.data.wordTower?.questions?.questions ?? []).length} questions ready</p>
            <button
              onClick={() => handleOpenFull('wordTower')}
              className="inline-flex items-center gap-2 px-12 py-3.5 rounded-xl text-white font-bold text-base uppercase tracking-wide bg-[#58CC02] border-2 border-b-4 border-[#46A302] active:border-b-2 active:translate-y-0.5 transition-all mb-6"
            >
              🗼 Start Game
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className="block w-full max-w-xs mx-auto px-6 py-3 rounded-xl bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-200 font-bold border-2 border-b-4 border-stone-300 dark:border-stone-500 active:border-b-2 active:translate-y-0.5 transition-all"
            >
              ← Back to menu
            </button>
          </div>
        </div>
      )}
      {activeTab === 'wordBlitz' && hasData('wordBlitz') && !isLocked('wordBlitz') && (
        <div className="p-6 flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-full max-w-sm text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6 bg-[#FF9600] border-2 border-b-4 border-[#D97F00]">
              <span className="text-4xl">⚡</span>
            </div>
            <h2 className="text-2xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight mb-2">Word Blitz</h2>
            <p className="text-stone-500 dark:text-stone-400 text-sm mb-8 font-medium">{(Array.isArray(pack.data.wordBlitz?.questions) ? pack.data.wordBlitz.questions : pack.data.wordBlitz?.questions?.questions ?? []).length} questions ready · 60-second clock</p>
            <button
              onClick={() => handleOpenFull('wordBlitz')}
              className="inline-flex items-center gap-2 px-12 py-3.5 rounded-xl text-white font-bold text-base uppercase tracking-wide bg-[#FF9600] border-2 border-b-4 border-[#D97F00] active:border-b-2 active:translate-y-0.5 transition-all mb-6"
            >
              ⚡ Start Game
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className="block w-full max-w-xs mx-auto px-6 py-3 rounded-xl bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-200 font-bold border-2 border-b-4 border-stone-300 dark:border-stone-500 active:border-b-2 active:translate-y-0.5 transition-all"
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
       (activeTab !== 'craterBlast' || isLocked('craterBlast') || !hasData('craterBlast')) &&
       (activeTab !== 'wordTower' || isLocked('wordTower') || !hasData('wordTower')) &&
       (activeTab !== 'wordBlitz' || isLocked('wordBlitz') || !hasData('wordBlitz')) && (
        <div className="p-8 sm:p-12 flex flex-col items-center justify-center min-h-[400px] text-center">
          {isLocked(activeTab) ? (
            <>
              <div className="w-16 h-16 rounded-2xl bg-[#FF9600] border-2 border-b-4 border-[#D97F00] flex items-center justify-center text-4xl mb-4">
                {TABS.find(t => t.key === activeTab)?.icon}
              </div>
              <h3 className="text-lg font-extrabold text-stone-800 dark:text-stone-100 mb-2">{TABS.find(t => t.key === activeTab)?.label} is a Pro feature</h3>
              <p className="text-stone-500 dark:text-stone-400 text-sm mb-6 font-medium">
                Upgrade to unlock Crossword, Crater Blast, Word Tower, and Word Blitz.
              </p>
              <button
                onClick={() => { trackEvent('upgrade_clicked', { source: 'study_pack_locked_tab', tab: activeTab }); openUpgradePaywall('study_pack_locked_tab'); }}
                className="px-8 py-3 bg-[#FF9600] text-white font-bold uppercase tracking-wide rounded-xl border-2 border-b-4 border-[#D97F00] active:border-b-2 active:translate-y-0.5 transition-all"
              >
                Upgrade to Pro
              </button>
              {/* "See how it works" preview video — shown under the
                  Upgrade CTA so a free user can see exactly what each
                  locked game looks like before paying. */}
              {(() => {
                const TAB_DEMO_VIDEO: Partial<Record<TabKey, { src: string; label: string }>> = {
                  crossword: {
                    src: '/writescholar-crossword-demo.mp4',
                    label: 'WriteScholar Crossword Generator — Create study puzzles from notes',
                  },
                  craterBlast: {
                    src: '/writescholar-crater-blast-demo.mp4',
                    label: 'WriteScholar Crater Blast — Quiz game study mode',
                  },
                  wordTower: {
                    src: '/hero-word-tower.mp4',
                    label: 'WriteScholar Word Tower — Stack the right words to climb the streak',
                  },
                  wordBlitz: {
                    src: '/hero-word-blitz.mp4',
                    label: 'WriteScholar Word Blitz — Fast-paced vocabulary arcade game',
                  },
                };
                const demo = TAB_DEMO_VIDEO[activeTab];
                if (!demo) return null;
                return (
                  <div className="mt-8 w-full max-w-md md:max-w-2xl lg:max-w-3xl mx-auto">
                    <p className="text-xs font-extrabold text-stone-500 dark:text-stone-400 mb-2 uppercase tracking-wide">See how it works</p>
                    <div className="rounded-xl overflow-hidden border-2 border-b-4 border-stone-200 dark:border-stone-600 aspect-video bg-stone-100 dark:bg-stone-800">
                      <video
                        key={activeTab}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-contain"
                        title={demo.label}
                        aria-label={demo.label}
                      >
                        <source src={demo.src} type="video/mp4" />
                      </video>
                    </div>
                  </div>
                );
              })()}
            </>
          ) : hasData(activeTab) ? (
            <>
              <div className="w-16 h-16 rounded-2xl bg-[#1CB0F6] border-2 border-b-4 border-[#1899D6] flex items-center justify-center text-4xl mb-4">
                {TABS.find(t => t.key === activeTab)?.icon}
              </div>
              <h3 className="text-lg font-extrabold text-stone-800 dark:text-stone-100 mb-2">Open {TABS.find(t => t.key === activeTab)?.label}</h3>
              <p className="text-stone-500 dark:text-stone-400 text-sm mb-6 font-medium">
                {activeTab === 'lesson' && `${pack.data.lesson?.slides?.length || 0} slides`}
                {activeTab === 'quiz' && `${pack.data.quiz?.questions?.length || 0} questions`}
                {activeTab === 'crossword' && `${pack.data.crossword?.placedWords?.length || 0} words`}
                {activeTab === 'craterBlast' && `${pack.data.craterBlast?.questions?.length || 0} questions`}
                {activeTab === 'wordTower' && `${pack.data.wordTower?.questions?.length || 0} questions`}
                {activeTab === 'wordBlitz' && `${pack.data.wordBlitz?.questions?.length || 0} questions`}
                {!['lesson','quiz','crossword','craterBlast','wordTower','wordBlitz'].includes(activeTab) && 'Ready to study'}
              </p>
              <button
                onClick={() => handleOpenFull(activeTab)}
                className="px-8 py-3 bg-[#58CC02] text-white font-bold uppercase tracking-wide rounded-xl border-2 border-b-4 border-[#46A302] active:border-b-2 active:translate-y-0.5 transition-all flex items-center gap-2"
              >
                <span>Open {TABS.find(t => t.key === activeTab)?.label}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </button>
            </>
          ) : (
            <p className="text-stone-500 dark:text-stone-400 font-medium">No data for this tool</p>
          )}
        </div>
      )}
    </>
  );

  return (
    <LoggedInPageShell className="relative min-h-screen flex flex-col overflow-x-clip" user={user} onNavigate={onNavigate} onLogout={onLogout} currentPage="study-pack-viewer">

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {/* Back + Title */}
        <div className="relative flex items-start sm:items-center gap-2 min-w-0 mb-4">
          <button
            onClick={() => onNavigate('dashboard')}
            className="p-2.5 rounded-xl bg-white dark:bg-stone-800 border-2 border-b-4 border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 active:border-b-2 active:translate-y-0.5 transition-all shrink-0"
            aria-label="Back"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-2xl font-extrabold text-stone-800 dark:text-stone-100 truncate" title={packTitle}>
              {packTitle}
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 font-medium">Switch between study tools</p>
          </div>
          <img
            src="/mascot-celebrating.webp"
            alt=""
            aria-hidden
            loading="lazy"
            decoding="async"
            className="hidden sm:block pointer-events-none w-16 md:w-20 lg:w-24 h-auto shrink-0 -mt-2"
          />
        </div>

        {hasTrialAccess && (
          <div className="mb-5 rounded-2xl border-2 border-b-4 border-[#D97F00] bg-gradient-to-br from-[#FFF4E0] to-white dark:from-[#FF9600]/15 dark:to-stone-900 px-4 py-3.5 sm:px-5 sm:py-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#D97F00] dark:text-[#FFB84D]">
                  24-hour full access
                </p>
                <p className="mt-0.5 text-[13px] sm:text-[14px] font-extrabold text-stone-800 dark:text-stone-100 leading-snug">
                  Everything is unlocked for {formatCountdown(remainingMs)}
                </p>
                <p className="mt-1 text-[12px] font-bold text-stone-600 dark:text-stone-400 leading-snug">
                  Games, full flashcards, full quiz, crossword, and export. After that this pack goes back to the free preview.
                </p>
              </div>
              <div className="flex flex-col items-stretch sm:items-end gap-2 shrink-0">
                <span className={`tabular-nums text-center sm:text-right text-lg sm:text-xl font-extrabold ${remainingMs < 60 * 60 * 1000 ? 'text-[#FF4B4B]' : 'text-[#D97F00] dark:text-[#FFB84D]'}`}>
                  {formatCountdown(remainingMs)}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    trackEvent('upgrade_clicked', { source: 'study_pack_24h_banner' });
                    openUpgradePaywall('study_pack_24h_banner');
                  }}
                  className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-[#FF9600] hover:bg-[#D97F00] text-white text-[12px] font-extrabold uppercase tracking-wide border-2 border-b-[3px] border-[#D97F00] active:border-b-2 active:translate-y-0.5 transition-all"
                >
                  Keep it unlocked
                </button>
              </div>
            </div>
          </div>
        )}

        {trialExpired && (
          <div className="mb-5 rounded-2xl border-2 border-b-4 border-[#A560E8]/40 bg-gradient-to-br from-[#F3EAFF] to-white dark:from-[#A560E8]/12 dark:to-stone-900 px-4 py-3.5 sm:px-5 sm:py-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#8A48C7] dark:text-[#C9A0F0]">
                  24-hour access ended
                </p>
                <p className="mt-0.5 text-[13px] sm:text-[14px] font-extrabold text-stone-800 dark:text-stone-100 leading-snug">
                  This pack is back to the free preview
                </p>
                <p className="mt-1 text-[12px] font-bold text-stone-600 dark:text-stone-400 leading-snug">
                  Half the flashcards and quiz stay open. Games, the rest of the deck, and export unlock on Pro.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  trackEvent('upgrade_clicked', { source: 'study_pack_24h_expired' });
                  openUpgradePaywall('study_pack_24h_expired');
                }}
                className="shrink-0 inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-[#A560E8] hover:bg-[#8A48C7] text-white text-[12px] font-extrabold uppercase tracking-wide border-2 border-b-[3px] border-[#7733B5] active:border-b-2 active:translate-y-0.5 transition-all"
              >
                Unlock forever
              </button>
            </div>
          </div>
        )}

        {/* Mobile: export + horizontal tabs (below lg) */}
        <div className="lg:hidden">
          {hasExportableContent() && (
            <div className="flex items-center gap-2 mb-3 overflow-x-auto scrollbar-hide">
              {renderExportButtons()}
            </div>
          )}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
            {TABS.map(tab => renderTabButton(tab, false))}
          </div>
        </div>

        {/* Grid: sidebar (desktop) + content */}
        <div className="grid grid-cols-1 lg:grid-cols-[220px,1fr] lg:gap-6">
          {/* Left sidebar — desktop only */}
          <div className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              <nav className="bg-white dark:bg-stone-800 rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-700 p-2 space-y-0.5">
                {TABS.map(tab => renderTabButton(tab, true))}
              </nav>
              {hasExportableContent() && (
                <div className="bg-white dark:bg-stone-800 rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-700 p-3">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-2 px-1">Export</p>
                  <div className="flex flex-col gap-2">
                    {renderExportButtons(true)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Content area */}
          <div className="bg-white dark:bg-stone-800 rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-700 overflow-hidden min-h-[400px]">
            {renderContent()}
          </div>
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
    </LoggedInPageShell>
  );
};

export default StudyPackViewerPage;
