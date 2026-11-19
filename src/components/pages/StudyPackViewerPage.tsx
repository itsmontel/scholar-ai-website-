import { useState, useEffect, Suspense, lazy } from 'react';
import LoggedInPageShell from '../workspace/LoggedInPageShell';
import LessonViewer from '../common/LessonViewer';
import QuizViewer from '../common/QuizViewer';
import CrosswordViewer from '../common/CrosswordViewer';
import ScholarMascot from '../common/ScholarMascot';
import ExportFormatModal, { type ExportFormat } from '../common/ExportFormatModal';
import RandomMascotLoader from '../common/RandomMascotLoader';
import { exportStudyPackSegment } from '../../utils/studyPackExport';
import { trackEvent } from '../../utils/analytics';
import { openUpgradePaywall } from '../../utils/paywall';
import { FREE_PACK_FLASHCARDS, UPGRADE_CTA_FOOTNOTE, FREE_PACKS_FULL } from '../../config/pricing';
import FreeGradeGate, { type GateUser } from '../common/FreeGradeGate';
import { BTN_GREEN } from '../landing/webStyle';
import { markStepDone, packKey, stepsDone, type PackStep } from '../../utils/packProgress';

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

interface StudyPackViewerPageProps {
  onNavigate: (page: string) => void;
  user?: { id: string; plan?: string } | null;
  onLogout?: () => void;
  initialData?: { data: any; title?: string };
  /** A guest signed up from the "keep this pack" bar; token and user are already stored. */
  onAuth?: (user: GateUser) => void;
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

/** The numbered dot on a path step: a tick when done, purple when current. */
function StepDot({ n, active, done, small = false }: { n: number; active: boolean; done: boolean; small?: boolean }) {
  const size = small ? 'h-7 w-7 text-[13px]' : 'h-9 w-9 text-[16px]';
  return (
    <span aria-hidden className={`inline-flex shrink-0 items-center justify-center rounded-full font-black ${size} ${done ? 'bg-[#58CC02] text-white' : active ? 'bg-[#A560E8] text-white' : 'bg-[#F3EAFF] text-[#5B2491]'}`}>
      {done ? (
        <svg className={small ? 'h-3.5 w-3.5' : 'h-4 w-4'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>
      ) : n}
    </span>
  );
}

type DeckCard = { id: string; front: string; back: string };

/**
 * The flashcard step: one big card at a time. "I knew it" retires the card,
 * "Show me again later" brings it back for another round once the deck is
 * through, until every card is known.
 */
function PackFlashcards({ cards, onOpenTools }: { cards: DeckCard[]; onOpenTools?: () => void }) {
  const [order, setOrder] = useState<number[]>(() => cards.map((_, i) => i));
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const [again, setAgain] = useState<number[]>([]);
  const [round, setRound] = useState(1);

  const restart = () => {
    setOrder(cards.map((_, i) => i));
    setPos(0); setFlipped(false); setKnown(0); setAgain([]); setRound(1);
  };
  const answer = (knewIt: boolean) => {
    const idx = order[pos];
    const nextAgain = knewIt ? again : [...again, idx];
    if (knewIt) setKnown((k) => k + 1);
    setFlipped(false);
    if (pos + 1 < order.length) {
      setAgain(nextAgain);
      setPos(pos + 1);
    } else if (nextAgain.length > 0) {
      setOrder(nextAgain);
      setAgain([]);
      setPos(0);
      setRound((r) => r + 1);
    } else {
      setAgain([]);
      setPos(order.length);
    }
  };

  if (cards.length === 0) return <p className="p-8 text-center font-bold text-stone-500">No flashcards in this pack.</p>;
  const finished = pos >= order.length;
  const card = finished ? null : cards[order[pos]];
  const text = card ? (flipped ? card.back : card.front) : '';
  const size = text.length > 220 ? 'text-[19px] sm:text-[21px]' : text.length > 110 ? 'text-[22px] sm:text-[26px]' : 'text-[26px] sm:text-[36px]';

  return (
    <div className="flex flex-col items-center gap-[22px] px-4 py-6 sm:px-6 sm:py-7" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
      <div className="flex w-full max-w-[760px] flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 text-[22px] font-black tracking-[-0.01em] text-stone-900 dark:text-stone-50 sm:text-[26px]">
          {finished ? 'Deck done' : `Card ${pos + 1} of ${order.length}`}
          {!finished && round > 1 && <span className="ml-2 text-[15px] font-extrabold text-[#7733B5] dark:text-[#C9A0F0]">second look</span>}
        </h2>
        <div className="flex flex-wrap gap-2" role="status">
          <span className="inline-flex min-h-[36px] items-center rounded-full bg-[#E6F9D2] px-3.5 text-[14px] font-black text-[#14532D]">{known} known</span>
          {again.length > 0 && <span className="inline-flex min-h-[36px] items-center rounded-full bg-[#FFF1C2] px-3.5 text-[14px] font-black text-[#5A4500]">{again.length} to see again</span>}
        </div>
      </div>

      {finished ? (
        <div className="flex w-full max-w-[760px] flex-col items-center gap-3 rounded-[30px] border-2 border-[#B7E4A0] bg-[#E6F9D2] px-6 py-10 text-center">
          <img src="/mascot-celebrating-still.webp" alt="" width={120} height={120} className="h-[120px] w-[120px] object-contain" />
          <p className="m-0 text-[26px] font-black text-[#14532D]">{cards.length === 1 ? 'You know the card' : `You know all ${cards.length} cards`}</p>
          <p className="m-0 text-[15.5px] font-bold text-[#14532D]">Move on to the next step below, or run the deck once more.</p>
          <button type="button" onClick={restart} className="mt-1 inline-flex min-h-[50px] items-center rounded-[14px] border-2 border-b-4 border-[#B7E4A0] bg-white px-5 text-[15.5px] font-black text-[#14532D] transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-2">
            Go through the deck again
          </button>
        </div>
      ) : (
        <>
          <div className="relative w-full max-w-[760px]">
            <span aria-hidden className="absolute inset-x-[26px] -bottom-3.5 h-[60px] rounded-[30px] bg-[#E4D4F8] dark:bg-stone-700" />
            <span aria-hidden className="absolute inset-x-3 -bottom-[7px] h-[60px] rounded-[30px] bg-[#D2B5F3] dark:bg-stone-600" />
            <button
              type="button"
              onClick={() => setFlipped((f) => !f)}
              aria-label={flipped ? 'Answer. Tap to see the question again.' : 'Question. Tap to see the answer.'}
              className={`relative flex min-h-[300px] w-full flex-col items-center justify-center gap-4 rounded-[30px] border-2 px-6 py-8 text-center shadow-[0_30px_60px_-36px_rgba(90,45,140,0.7)] transition-colors sm:min-h-[350px] sm:px-10 ${flipped ? 'border-[#58CC02] bg-[#F6FDEF] dark:bg-stone-900' : 'border-[#C9A0F0] bg-white dark:bg-stone-900'}`}
            >
              <span className={`inline-flex min-h-[30px] items-center rounded-full px-3 text-[12.5px] font-black uppercase tracking-[0.14em] ${flipped ? 'bg-[#E6F9D2] text-[#14532D]' : 'bg-[#F3EAFF] text-[#5B2491]'}`}>
                {flipped ? 'Answer' : 'Question'}
              </span>
              <span aria-live="polite" className={`whitespace-pre-wrap break-words font-black leading-[1.25] tracking-[-0.01em] text-stone-900 dark:text-stone-50 ${size}`}>{text}</span>
              <span className="inline-flex items-center gap-2 text-[15.5px] font-extrabold text-[#7733B5] dark:text-[#C9A0F0]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M4 12a8 8 0 0 1 14-5l2 2M20 12a8 8 0 0 1-14 5l-2-2M20 4v5h-5M4 20v-5h5" /></svg>
                {flipped ? 'Tap to see the question' : 'Tap the card to see the answer'}
              </span>
            </button>
          </div>
          <div className="mt-3 flex w-full max-w-[760px] flex-wrap gap-3.5">
            <button
              type="button"
              onClick={() => answer(false)}
              className="inline-flex min-h-[64px] flex-[1_1_240px] items-center justify-center rounded-[20px] border-2 border-b-[6px] border-[#E0B400] bg-[#FFC800] text-[19px] font-black text-[#3D2F00] transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-2"
            >
              Show me again later
            </button>
            <button
              type="button"
              onClick={() => answer(true)}
              className="inline-flex min-h-[64px] flex-[1_1_240px] items-center justify-center gap-2.5 rounded-[20px] border-2 border-b-[6px] border-[#46A302] bg-[#58CC02] text-[19px] font-black text-white transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-2"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12l5 5L20 7" /></svg>
              I knew it
            </button>
          </div>
        </>
      )}
      {onOpenTools && (
        <button type="button" onClick={onOpenTools} className="min-h-[44px] text-[14.5px] font-black text-[#7733B5] underline hover:text-[#5F2594] dark:text-[#C9A0F0]">
          Edit, shuffle or print this deck
        </button>
      )}
    </div>
  );
}

const StudyPackViewerPage = ({ onNavigate, user, onLogout, initialData, onAuth }: StudyPackViewerPageProps) => {
  // A visitor with no account, looking at the pack they just made on the
  // landing page. It lives in this tab until they sign up to keep it; the
  // app saves it to the account the moment they do.
  const isGuest = !user?.id;
  const [saveGateOpen, setSaveGateOpen] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  useEffect(() => {
    const onSaved = () => setJustSaved(true);
    window.addEventListener('writescholar-study-pack-saved', onSaved);
    return () => window.removeEventListener('writescholar-study-pack-saved', onSaved);
  }, []);
  const [pack, setPack] = useState<{ data: any; title: string } | null>(() => {
    if (initialData?.data) return normalizeViewerPack({ data: initialData.data, title: initialData.title || 'Study Pack' });
    return normalizeViewerPack(safeParseStorage(STORAGE_KEY));
  });
  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    try {
      const data = initialData?.data ?? safeParseStorage(STORAGE_KEY)?.data;
      // A pack built from a typed topic has no notes of the student's own
      // to reread, so it opens on the flashcards.
      if (data?.inputType === 'topic' && data?.flashcards) return 'flashcards';
      return data?.originalNotes ? 'notes' : 'lesson';
    } catch { return 'lesson'; }
  });
  const [returnState, setReturnState] = useState<Record<string, number> | null>(null);
  const [exportFormatTarget, setExportFormatTarget] = useState<'pdf' | 'docx' | 'json' | null>(null);
  // When non-null, render the matching game page inline (full viewport,
  // minimal-UI). Setting it to null returns the user to the viewer tab.
  const [inlineGame, setInlineGame] = useState<'craterBlast' | 'wordTower' | 'wordBlitz' | null>(null);
  // The pack is studied as a numbered path. Which steps are ticked is kept
  // in this browser (utils/packProgress.ts).
  const [doneSteps, setDoneSteps] = useState<PackStep[]>([]);
  const [exportOpen, setExportOpen] = useState(false);
  // A pack opens on its own home page; tapping a step opens that step on its own.
  const [atHome, setAtHome] = useState(() => {
    try { return !sessionStorage.getItem(RETURN_TAB_KEY); } catch { return true; }
  });
  const progressKey = packKey(pack?.title || '', pack?.data?.created_at);
  useEffect(() => {
    setDoneSteps(stepsDone(progressKey));
  }, [progressKey]);

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
  const hasFullAccess = isPaidUser || FREE_PACKS_FULL;
  // Free preview: notes, the full lesson and the full quiz, plus the first
  // FREE_PACK_FLASHCARDS cards. The rest of the deck, the crossword, the
  // games and export are Pro.
  const isLocked = (key: TabKey) => !hasFullAccess && (TABS.find((t) => t.key === key)?.proOnly ?? false);

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
    if (isLocked(tab) || (!hasFullAccess && tab === 'flashcards')) {
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
            onClick={() => onNavigate(isGuest ? 'landing' : 'dashboard')}
            className="mt-6 px-8 py-3 bg-[#58CC02] text-white font-bold uppercase tracking-wide rounded-xl border-2 border-b-4 border-[#46A302] active:border-b-2 active:translate-y-0.5 transition-all"
          >
            {isGuest ? 'Make a study pack' : 'Go to Dashboard'}
          </button>
        </div>
      </LoggedInPageShell>
    );
  }

  const hasData = (key: TabKey) => key === 'notes' ? !!pack.data?.originalNotes : !!pack.data[key];

  // The numbered path through the pack. Games are one step with up to three games in it.
  const pathSteps = ([
    { key: 'lesson', label: 'Lesson', detail: 'Read this first', tabs: ['lesson'], tip: 'Read it through once. It sets up everything that follows.' },
    { key: 'flashcards', label: 'Flashcards', detail: 'Flip and recall', tabs: ['flashcards'], tip: 'Say the answer out loud before you flip each card.' },
    { key: 'quiz', label: 'Quiz', detail: 'Test yourself', tabs: ['quiz'], tip: 'Every wrong answer comes with the reason why. Read those.' },
    { key: 'crossword', label: 'Crossword', detail: 'The key terms', tabs: ['crossword'], tip: 'The key terms as clues. Good for the vocabulary.' },
    { key: 'games', label: 'Games', detail: 'Play to lock it in', tabs: ['wordBlitz', 'wordTower', 'craterBlast'], tip: 'Pick a game. A fast round locks in what you just studied.' },
  ] as { key: PackStep; label: string; detail: string; tabs: TabKey[]; tip: string }[])
    .map((s) => ({ ...s, tabs: s.tabs.filter((tab) => hasData(tab)) }))
    .filter((s) => s.tabs.length > 0);
  const currentStep = pathSteps.find((s) => s.tabs.includes(activeTab)) ?? null;
  const followingStep = currentStep ? pathSteps[pathSteps.indexOf(currentStep) + 1] ?? null : null;
  const pathDone = pathSteps.filter((s) => doneSteps.includes(s.key)).length;
  const finishStep = () => {
    if (!currentStep) return;
    setDoneSteps(markStepDone(progressKey, currentStep.key));
    trackEvent('pack_completed', { source: 'viewer_step', kind: currentStep.key });
    if (followingStep) setActiveTab(followingStep.tabs[0]);
    else setAtHome(true);
    try { window.scrollTo({ top: 0 }); } catch { /* noop */ }
  };
  const openStep = (tab: TabKey) => {
    setActiveTab(tab);
    setAtHome(false);
    try { window.scrollTo({ top: 0 }); } catch { /* noop */ }
  };
  const continueStep = pathSteps.find((st) => !doneSteps.includes(st.key)) ?? null;
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
          <button
            onClick={() => { trackEvent('upgrade_clicked', { source: 'study_pack_export' }); openUpgradePaywall('study_pack_export'); }}
            className={`${btnBase} bg-[#FF9600] text-white border-[#D97F00]`}
            title="Export to PDF, Word and JSON on Pro"
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            Export · Pro
          </button>
        )}
        {hasFullAccess && hasData('flashcards') && (
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
        const previewCount = hasFullAccess ? flashcardCards.length : Math.min(flashcardCards.length, FREE_PACK_FLASHCARDS);
        const lockedCount = Math.max(0, flashcardCards.length - previewCount);
        const visibleCards = flashcardCards.slice(0, previewCount);
        return (
        <div>
          <PackFlashcards
            key={`${progressKey}-${visibleCards.length}`}
            cards={visibleCards}
            onOpenTools={hasFullAccess ? () => handleOpenFull('flashcards') : undefined}
          />
          {lockedCount > 0 && (
            <div className="mt-4 max-w-xl mx-auto rounded-2xl border-2 border-[#FF9600]/40 bg-gradient-to-br from-[#FFF4E0] to-white dark:from-[#FF9600]/12 dark:to-stone-900 p-4 sm:p-5 text-center">
              <p className="text-[14px] font-extrabold text-[#D97F00] dark:text-[#FFB84D]">
                +{lockedCount} more flashcard{lockedCount === 1 ? '' : 's'} in this deck
              </p>
              <p className="mt-1 text-[12px] font-bold text-stone-600 dark:text-stone-300 leading-snug">
                Free includes the first {FREE_PACK_FLASHCARDS}. Unlock the full deck, the crossword and the study games with Pro.
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
        // The quiz is free in full: testing yourself is what proves the pack works.
        const allQuestions = Array.isArray(pack.data.quiz?.questions) ? pack.data.quiz.questions : [];
        return (
        <div className="p-4">
          <QuizViewer
            questions={allQuestions}
            title={pack.data.quiz?.title || packTitle}
            onEnlarge={(state) => handleOpenFull('quiz', state)}
            initialQuestionIndex={returnState?.questionIndex}
          />
          {!hasFullAccess && (
            <div className="mt-4 max-w-xl mx-auto rounded-2xl border-2 border-[#A560E8]/30 bg-[#F3EAFF] dark:bg-[#A560E8]/12 p-4 sm:p-5 text-center">
              <p className="text-[14px] font-extrabold text-[#7733B5] dark:text-[#C9A0F0]">
                Lock it in with games
              </p>
              <p className="mt-1 text-[12px] font-bold text-stone-600 dark:text-stone-300 leading-snug">
                Crater Blast, Word Tower and Word Blitz drill these same questions until they stick. Pro.
              </p>
              <button
                type="button"
                onClick={() => { trackEvent('upgrade_clicked', { source: 'study_pack_quiz_banner' }); openUpgradePaywall('study_pack_quiz_banner'); }}
                className="mt-3 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#A560E8] hover:bg-[#8A48C7] text-white text-[12px] font-extrabold uppercase tracking-wide border-2 border-b-[3px] border-[#7733B5] active:border-b-2 active:translate-y-0.5 transition-all"
              >
                Unlock the games
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
              onClick={() => setAtHome(true)}
              className="block w-full max-w-xs mx-auto px-6 py-3 rounded-xl bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-200 font-bold border-2 border-b-4 border-stone-300 dark:border-stone-500 active:border-b-2 active:translate-y-0.5 transition-all"
            >
              Back to the pack
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
              onClick={() => setAtHome(true)}
              className="block w-full max-w-xs mx-auto px-6 py-3 rounded-xl bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-200 font-bold border-2 border-b-4 border-stone-300 dark:border-stone-500 active:border-b-2 active:translate-y-0.5 transition-all"
            >
              Back to the pack
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
              onClick={() => setAtHome(true)}
              className="block w-full max-w-xs mx-auto px-6 py-3 rounded-xl bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-200 font-bold border-2 border-b-4 border-stone-300 dark:border-stone-500 active:border-b-2 active:translate-y-0.5 transition-all"
            >
              Back to the pack
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

      <main className={`flex-1 max-w-6xl mx-auto w-full px-4 py-6 ${isGuest ? 'pb-32' : ''}`}>
        {justSaved && !isGuest && (
          <p role="status" className="mb-4 flex items-center gap-2 rounded-2xl border border-[#B7E4A0] bg-[#E6F9D2] px-4 py-3 text-[14.5px] font-extrabold text-[#14532D]" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12l5 5L20 7" /></svg>
            Saved to your account. It is on your dashboard whenever you come back.
          </p>
        )}
        {!hasFullAccess && (
          <div className="mb-5 rounded-2xl border-2 border-b-4 border-[#A560E8]/40 bg-[#F3EAFF] dark:bg-[#A560E8]/12 px-4 py-3.5 sm:px-5 sm:py-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#8A48C7] dark:text-[#C9A0F0]">
                  Free preview
                </p>
                <p className="mt-0.5 text-[13px] sm:text-[14px] font-extrabold text-stone-800 dark:text-stone-100 leading-snug">
                  The lesson and the full quiz are yours. Start there.
                </p>
                <p className="mt-1 text-[12px] font-bold text-stone-600 dark:text-stone-400 leading-snug">
                  {flashcardCards.length > FREE_PACK_FLASHCARDS
                    ? `Pro opens all ${flashcardCards.length} flashcards, the crossword, 3 study games and export.`
                    : 'Pro opens the crossword, 3 study games and export.'}
                </p>
              </div>
              <div className="flex flex-col items-stretch sm:items-end gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    trackEvent('upgrade_clicked', { source: 'study_pack_preview_banner' });
                    openUpgradePaywall('study_pack_preview_banner');
                  }}
                  className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-[#A560E8] hover:bg-[#8A48C7] text-white text-[12px] font-extrabold uppercase tracking-wide border-2 border-b-[3px] border-[#7733B5] active:border-b-2 active:translate-y-0.5 transition-all"
                >
                  Unlock the full pack
                </button>
                <span className="text-center sm:text-right text-[10px] font-bold text-stone-400 dark:text-stone-500">{UPGRADE_CTA_FOOTNOTE}</span>
              </div>
            </div>
          </div>
        )}

        {atHome ? (
          /* ── PACK HOME: where you are, and what is inside ─────────── */
          <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-[22px]" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
            <button
              type="button"
              onClick={() => onNavigate(isGuest ? 'landing' : 'dashboard')}
              className="inline-flex min-h-[44px] items-center gap-2 self-start text-[15px] font-black text-[#7733B5] hover:text-[#5F2594] dark:text-[#C9A0F0]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
              {isGuest ? 'Back' : 'Dashboard'}
            </button>

            <section aria-label="This pack" className="relative flex flex-wrap items-center gap-6 overflow-hidden rounded-[30px] bg-gradient-to-b from-[#A863EA] via-[#8E48CF] to-[#6A2AA6] px-5 py-6 text-white shadow-[0_30px_60px_-34px_rgba(90,45,140,0.8)] sm:px-[30px] sm:py-7">
              <span aria-hidden className="pointer-events-none absolute -right-40 -top-[120px] h-[520px] w-[520px] rounded-full bg-[#9652D3]" />
              <div className="relative flex min-w-0 flex-[3_1_420px] flex-col items-start gap-3.5">
                <h1 className="m-0 text-[26px] font-black leading-[1.08] tracking-[-0.02em] sm:text-[36px]">{packTitle}</h1>
                <div className="flex w-full max-w-[460px] flex-col gap-1.5">
                  <div role="img" aria-label={`${pathDone} of ${pathSteps.length} steps done`} className="flex gap-1.5">
                    {pathSteps.map((st) => (
                      <span key={st.key} className={`h-3 flex-1 rounded-full ${doneSteps.includes(st.key) ? 'bg-[#58CC02]' : st.key === continueStep?.key ? 'bg-white' : 'bg-[#5A1F8F]'}`} />
                    ))}
                  </div>
                  <span className="text-[15px] font-extrabold text-[#F3EAFF]">
                    {continueStep ? `${pathDone} of ${pathSteps.length} steps done.` : 'Every step done. Go again any time.'}
                  </span>
                </div>
                {pathSteps.length > 0 && (
                  <button
                    type="button"
                    onClick={() => openStep((continueStep ?? pathSteps[0]).tabs[0])}
                    className="inline-flex min-h-[62px] items-center gap-2.5 whitespace-nowrap rounded-[20px] border-2 border-b-[6px] border-[#46A302] bg-[#58CC02] px-[30px] text-[19px] font-black text-white transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-2"
                  >
                    {!continueStep ? 'Review again' : `${pathDone === 0 ? 'Start' : 'Continue'}: ${continueStep.label.toLowerCase()}`}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                  </button>
                )}
              </div>
              <img src={continueStep ? '/mascot-pointing.webp' : '/mascot-celebrating-still.webp'} alt="Scholar, the WriteScholar mascot" width={170} height={170} className="relative mx-auto hidden h-[170px] w-[170px] shrink-0 object-contain sm:block" />
            </section>

            <h2 className="m-0 mt-1 text-[22px] font-black tracking-[-0.01em] text-stone-900 dark:text-stone-50">What is in this pack</h2>

            <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
              {pathSteps.map((st, i) => {
                const done = doneSteps.includes(st.key);
                const upNext = st.key === continueStep?.key;
                const firstQ = Array.isArray(pack.data.quiz?.questions) ? pack.data.quiz.questions[0] : null;
                const firstQText = firstQ ? String(firstQ.question ?? firstQ.prompt ?? firstQ.text ?? '') : '';
                const firstQOptions = Array.isArray(firstQ?.options) ? firstQ.options.filter((o: unknown) => typeof o === 'string').slice(0, 2) as string[] : [];
                const slides = Array.isArray(pack.data.lesson?.slides) ? pack.data.lesson.slides : [];
                const quizCount = Array.isArray(pack.data.quiz?.questions) ? pack.data.quiz.questions.length : 0;
                const wordCount = Array.isArray(pack.data.crossword?.placedWords) ? pack.data.crossword.placedWords.length : 0;
                const tile = 'flex min-h-[104px] rounded-2xl bg-[#F7F1FF] p-3.5 dark:bg-stone-800';
                return (
                  <button
                    key={st.key}
                    type="button"
                    onClick={() => openStep(st.tabs[0])}
                    className={`flex flex-col gap-3 rounded-[24px] bg-white p-[18px] text-left transition-transform hover:-translate-y-0.5 dark:bg-stone-900 ${upNext ? 'border-2 border-[#A560E8] shadow-[0_20px_40px_-28px_rgba(90,45,140,0.7)]' : 'border border-[#E4D4F8] dark:border-stone-700'}`}
                  >
                    <span className="flex items-center gap-2.5">
                      <StepDot n={i + 1} active={upNext} done={done} />
                      <span className="text-[20px] font-black text-stone-900 dark:text-stone-50">{st.label}</span>
                      {done ? (
                        <span className="ml-auto rounded-full bg-[#E6F9D2] px-2.5 py-[3px] text-[12.5px] font-black text-[#14532D]">Done</span>
                      ) : upNext ? (
                        <span className="ml-auto rounded-full bg-[#A560E8] px-2.5 py-[3px] text-[12.5px] font-black text-white">Up next</span>
                      ) : null}
                    </span>

                    {st.key === 'lesson' && (
                      <span className={`${tile} text-[14.5px] font-bold leading-[1.45] text-stone-700 dark:text-stone-300`}>
                        <span className="line-clamp-3">{String(slides[0]?.content || slides[0]?.title || 'A short lesson on the topic.')}</span>
                      </span>
                    )}
                    {st.key === 'flashcards' && (
                      <span className="flex min-h-[104px] items-center justify-center rounded-2xl border-2 border-b-[5px] border-[#E4D4F8] bg-white p-3.5 text-center text-[16.5px] font-black leading-[1.3] text-stone-900 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-50">
                        <span className="line-clamp-3">{flashcardCards[0]?.front || 'Your first card'}</span>
                      </span>
                    )}
                    {st.key === 'quiz' && (
                      <span className={`${tile} flex-col justify-center gap-2`}>
                        <span className="line-clamp-2 text-[14.5px] font-black leading-[1.3] text-stone-900 dark:text-stone-50">{firstQText || 'Test what you remember.'}</span>
                        {firstQOptions.length > 0 && (
                          <span className="flex gap-1.5">
                            {firstQOptions.map((o, n) => (
                              <span key={n} className="min-w-0 flex-1 truncate rounded-[10px] border-2 border-[#E4D4F8] bg-white px-2 py-[5px] text-[12.5px] font-extrabold text-stone-900 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100">{o}</span>
                            ))}
                          </span>
                        )}
                      </span>
                    )}
                    {st.key === 'crossword' && (
                      <span aria-hidden className={`${tile} items-center justify-center`}>
                        <span className="grid grid-cols-[repeat(7,26px)] gap-[3px] [grid-auto-rows:26px]">
                          {[1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 1, 1, 1, 1, 1].map((on, n) => (
                            <span key={n} className={on ? 'rounded-md border-2 border-[#D2B5F3] bg-white dark:border-stone-600 dark:bg-stone-900' : ''} />
                          ))}
                        </span>
                      </span>
                    )}
                    {st.key === 'games' && (
                      <span className="flex min-h-[104px] items-stretch gap-2">
                        {st.tabs.map((tab) => (
                          <span key={tab} className="relative flex min-w-0 flex-1 overflow-hidden rounded-[14px] border border-[#E4D4F8] bg-[#2A1540] dark:border-stone-600">
                            <video
                              src={`${tab === 'wordBlitz' ? '/hero-word-blitz.mp4' : tab === 'wordTower' ? '/hero-word-tower.mp4' : '/writescholar-crater-blast-demo.mp4'}#t=2`}
                              muted
                              loop
                              playsInline
                              autoPlay
                              preload="metadata"
                              aria-hidden
                              tabIndex={-1}
                              className="h-[104px] w-full object-cover"
                            />
                            <span className="absolute inset-x-0 bottom-0 truncate bg-[#2A1540] px-1.5 py-1 text-center text-[12px] font-black text-white">
                              {TABS.find((x) => x.key === tab)?.label}
                            </span>
                          </span>
                        ))}
                      </span>
                    )}

                    <span className="text-[14px] font-extrabold text-stone-600 dark:text-stone-400">
                      {st.key === 'lesson' && `${slides.length} short ${slides.length === 1 ? 'slide' : 'slides'} to read first`}
                      {st.key === 'flashcards' && `${flashcardCards.length} ${flashcardCards.length === 1 ? 'card' : 'cards'} to flip and recall`}
                      {st.key === 'quiz' && `${quizCount} ${quizCount === 1 ? 'question' : 'questions'}, with the reason for each answer`}
                      {st.key === 'crossword' && `${wordCount} key ${wordCount === 1 ? 'term' : 'terms'} to fill in`}
                      {st.key === 'games' && (st.tabs.length === 1 ? 'A quick game on the same terms' : `${st.tabs.length} quick games on the same terms`)}
                    </span>
                  </button>
                );
              })}

              {(hasData('notes') || hasExportableContent()) && (
                <div className="flex flex-col justify-center gap-2.5 rounded-[24px] border-2 border-dashed border-[#C9A0F0] bg-[#F7F1FF] p-[18px] dark:bg-[#A560E8]/10">
                  <span className="text-[20px] font-black text-stone-900 dark:text-stone-50">Take it with you</span>
                  <span className="text-[14.5px] font-bold leading-[1.4] text-stone-600 dark:text-stone-400">
                    {hasData('notes') ? 'Reread your notes, or save the pack as a file.' : 'Save the pack as a file to print or share.'}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {hasData('notes') && (
                      <button type="button" onClick={() => openStep('notes')} className="inline-flex min-h-[48px] items-center rounded-[14px] border-2 border-b-4 border-[#E4D4F8] bg-white px-[18px] text-[15px] font-black text-[#7733B5] transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-2 dark:border-stone-600 dark:bg-stone-900 dark:text-[#C9A0F0]">
                        Your notes
                      </button>
                    )}
                    {hasExportableContent() && (
                      <button type="button" onClick={() => setExportOpen((v) => !v)} aria-expanded={exportOpen} className="inline-flex min-h-[48px] items-center rounded-[14px] border-2 border-b-4 border-[#E4D4F8] bg-white px-[18px] text-[15px] font-black text-[#7733B5] transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-2 dark:border-stone-600 dark:bg-stone-900 dark:text-[#C9A0F0]">
                        Save as a file
                      </button>
                    )}
                  </div>
                  {exportOpen && hasExportableContent() && <div className="flex flex-wrap gap-2">{renderExportButtons()}</div>}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ── ONE STEP AT A TIME ───────────────────────────────────── */
          <div className="mx-auto flex w-full max-w-[1040px] flex-col gap-4" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
            <header className="flex flex-wrap items-center gap-4 rounded-[24px] border border-[#E4D4F8] bg-white px-4 py-3.5 dark:border-stone-700 dark:bg-stone-900">
              <button
                type="button"
                onClick={() => setAtHome(true)}
                aria-label="Back to the pack"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] border-2 border-b-4 border-[#E4D4F8] bg-white text-[#7733B5] transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-2 dark:border-stone-600 dark:bg-stone-800 dark:text-[#C9A0F0]"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
              </button>
              <div className="min-w-0 flex-[1_1_220px]">
                <p className="m-0 text-[12px] font-extrabold uppercase tracking-[0.14em] text-[#7733B5] dark:text-[#C9A0F0]">Study pack</p>
                <h1 className="m-0 truncate text-[18px] font-black leading-tight text-stone-900 dark:text-stone-50" title={packTitle}>{packTitle}</h1>
              </div>
              <nav aria-label="Steps in this pack" className="flex min-w-0 flex-[2_1_420px] items-start gap-2">
                {pathSteps.map((st) => {
                  const active = st.key === currentStep?.key;
                  const done = doneSteps.includes(st.key);
                  return (
                    <button
                      key={st.key}
                      type="button"
                      onClick={() => openStep(st.tabs[0])}
                      aria-current={active ? 'step' : undefined}
                      className="flex min-h-[44px] min-w-0 flex-1 flex-col justify-center gap-1.5"
                    >
                      <span aria-hidden className={`h-2.5 w-full rounded-full ${done ? 'bg-[#58CC02]' : active ? 'bg-[#A560E8]' : 'bg-[#E9DAFB] dark:bg-stone-700'}`} />
                      <span className={`w-full truncate text-center text-[13px] ${active ? 'font-black text-[#5B2491] dark:text-[#C9A0F0]' : done ? 'font-black text-[#14532D] dark:text-[#8FD867]' : 'font-extrabold text-stone-600 dark:text-stone-400'}`}>
                        {st.label}<span className="sr-only">{done ? ', done' : active ? ', current step' : ''}</span>
                      </span>
                    </button>
                  );
                })}
              </nav>
            </header>

            {currentStep?.key === 'games' && currentStep.tabs.length > 1 && (
              <div className="flex flex-wrap gap-2" role="group" aria-label="Pick a game">
                {currentStep.tabs.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    aria-pressed={activeTab === tab}
                    className={`inline-flex min-h-[46px] items-center rounded-full border-2 px-4 text-[15px] font-black ${activeTab === tab ? 'border-[#A560E8] bg-[#A560E8] text-white' : 'border-[#E4D4F8] bg-white text-stone-700 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-300'}`}
                  >
                    {TABS.find((x) => x.key === tab)?.label}
                  </button>
                ))}
              </div>
            )}

            <div className="min-h-[400px] overflow-hidden rounded-[24px] border border-[#E4D4F8] bg-white shadow-[0_22px_50px_-34px_rgba(90,45,140,0.55)] dark:border-stone-700 dark:bg-stone-800">
              {renderContent()}
            </div>

            {currentStep && (
              <div className="flex flex-wrap items-center gap-3.5 rounded-[22px] border border-[#E4D4F8] bg-[#F7F1FF] px-[18px] py-3.5 dark:border-stone-700 dark:bg-[#A560E8]/10">
                <img src="/mascot-pointing.webp" alt="Scholar, the WriteScholar mascot" width={64} height={64} className="hidden h-16 w-16 shrink-0 object-contain sm:block" />
                <p className="m-0 min-w-0 flex-[1_1_260px] text-[15.5px] font-extrabold leading-[1.4] text-stone-900 dark:text-stone-100">{currentStep.tip}</p>
                <button
                  type="button"
                  onClick={finishStep}
                  className="inline-flex min-h-[54px] shrink-0 items-center gap-2 whitespace-nowrap rounded-[16px] border-2 border-b-[5px] border-[#46A302] bg-[#58CC02] px-6 text-[16.5px] font-black text-white transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-2"
                >
                  {followingStep ? `Done, next: ${followingStep.label.toLowerCase()}` : 'Done, finish the pack'}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </button>
              </div>
            )}
          </div>
        )}
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

      {isGuest && (
        <>
          <div
            className="pointer-events-none fixed inset-x-0 bottom-0 z-[105] flex justify-center px-3 pb-3 sm:pb-4"
            style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
            role="region"
            aria-label="Keep this study pack"
          >
            <div className="pointer-events-auto flex w-full max-w-[860px] flex-wrap items-center gap-3 rounded-[24px] border border-[#E4D4F8] border-b-[6px] border-b-[#D9C2F2] bg-white py-3 pl-4 pr-3 shadow-[0_24px_50px_-20px_rgba(42,21,64,0.6)] sm:gap-4 sm:pl-5">
              <img src="/mascot-study-still.webp" alt="" width={56} height={56} className="hidden h-14 w-14 shrink-0 object-contain sm:block" />
              <div className="min-w-0 flex-1 basis-[220px]">
                <p className="m-0 text-[16px] font-black leading-snug text-[#1C1917] sm:text-[17px]">Keep this pack. It only lives in this tab for now.</p>
                <p className="m-0 mt-0.5 text-[13.5px] font-bold text-[#57534E]">Sign up free to save it, open it on your phone and make your next one. No card.</p>
              </div>
              <button
                type="button"
                onClick={() => { trackEvent('preview_save_click', { kind: 'pack' }); setSaveGateOpen(true); }}
                className={`min-h-[54px] w-full px-6 text-[17px] sm:w-auto ${BTN_GREEN}`}
              >
                Sign up free
              </button>
            </div>
          </div>
          <FreeGradeGate
            open={saveGateOpen}
            words={0}
            onClose={() => setSaveGateOpen(false)}
            onAuthed={(gateUser) => { setSaveGateOpen(false); onAuth?.(gateUser); }}
            header={(
              <div className="flex items-center gap-3.5 pr-10">
                <img src="/mascot-study-still.webp" alt="" width={64} height={64} className="h-16 w-16 shrink-0 object-contain" />
                <div className="min-w-0">
                  <p className="m-0 text-[11.5px] font-extrabold uppercase tracking-[0.16em] text-[#7733B5]">Your study pack</p>
                  <p className="m-0 truncate text-[17px] font-black leading-snug text-[#1C1917]">{packTitle}</p>
                </div>
              </div>
            )}
            copy={{
              title: 'Save this pack to your account',
              body: 'It is free. You also get 3 study packs or essay grades every month. No card.',
              cta: 'Save my study pack',
              loginTitle: 'Welcome back. Log in to save this pack.',
              loginCta: 'Log in and save my pack',
              footnote: 'Free. We email you a link to verify your account. Your notes are never used to train AI.',
            }}
          />
        </>
      )}
    </LoggedInPageShell>
  );
};

export default StudyPackViewerPage;
