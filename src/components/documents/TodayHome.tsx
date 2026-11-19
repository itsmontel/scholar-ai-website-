import { useEffect, useMemo, useState, type ReactNode } from 'react';
import HeroEssayGrader from '../landing/HeroEssayGrader';
import { TopicBox } from '../landing/DoorsHero';
import { BTN_GREEN, BTN_PURPLE, BTN_WHITE, CARD, EYEBROW, FONT } from '../landing/webStyle';
import { readDoor, rememberDoor, type Door, type PackRequest } from '../../utils/tryFirst';
import { trackEvent } from '../../utils/analytics';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export type HomeMode = 'exam' | 'essay' | 'both';

interface HomePack {
  id: string;
  title: string;
  createdAt: string;
  questions: unknown;
}

interface HomeDoc {
  id: string;
  title: string;
  hasAnalysis?: boolean;
}

interface TodayHomeProps {
  userName: string;
  /** Credits pill, avatar and friends: the same top bar as the rest of the workspace. */
  topBar?: ReactNode;
  packs: HomePack[];
  packsLoading?: boolean;
  docs: HomeDoc[];
  docsLoaded: boolean;
  onOpenPack: (pack: HomePack) => void;
  onOpenDoc: (id: string) => void;
  /** Hand an essay to the analysis page. */
  onGradeEssay: (text: string) => void;
  /** Build a study pack from a topic or notes (spends a credit). */
  onMakePack: (req: PackRequest) => void;
  /** Open the Daily Review session: step 1 of today's plan. */
  onStartReview: () => void;
  /** Whose review streak to read. */
  userId?: string;
}

const MODE_KEY = 'ws_home_mode';
const EXAM_DATES_KEY = 'ws_exam_dates';
const PLAN_KEY = 'ws_today_plan';
/** The pack viewer opens on this tab when it finds the key (StudyPackViewerPage). */
const VIEWER_TAB_KEY = 'writescholar_study_pack_return_tab';
const DAY_MS = 24 * 60 * 60 * 1000;

type StepKey = 'review' | 'quiz' | 'game';

/** Daily Review keeps its streak here (DailyReviewTab). */
const REVIEW_STREAK_PREFIX = 'writescholar_daily_review_streak_';

/** Today's review state and the running streak, read from Daily Review's own record. */
function readReviewStreak(userId: string | undefined): { doneToday: boolean; days: number } {
  const s = readJson<{ currentStreak?: number; lastCompletedDate?: string | null }>(`${REVIEW_STREAK_PREFIX}${userId || 'anon'}`, {});
  const last = s.lastCompletedDate || '';
  const doneToday = last === today();
  const yesterday = new Date(Date.now() - DAY_MS).toISOString().slice(0, 10);
  const alive = doneToday || last === yesterday;
  return { doneToday, days: alive ? Math.max(0, Number(s.currentStreak) || 0) : 0 };
}

const today = () => new Date().toISOString().slice(0, 10);

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

/** Whole days from today to a YYYY-MM-DD date; negative once it has passed. */
function daysUntil(date: string): number | null {
  const target = Date.parse(`${date}T00:00:00`);
  if (!Number.isFinite(target)) return null;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return Math.round((target - start.getTime()) / DAY_MS);
}

interface PackParts {
  cards: { front: string; back: string }[];
  questions: { question: string; options: string[] }[];
  hasCrossword: boolean;
  games: { key: string; label: string }[];
}

/** Pull what the plan cards show out of a saved pack, tolerating old shapes. */
function partsOf(pack: HomePack | null): PackParts {
  const q = pack && pack.questions && typeof pack.questions === 'object' && !Array.isArray(pack.questions)
    ? (pack.questions as Record<string, any>)
    : {};
  const cards = Array.isArray(q.flashcards?.cards)
    ? q.flashcards.cards
      .filter((c: any) => c && typeof c.front === 'string')
      .map((c: any) => ({ front: String(c.front), back: String(c.back ?? '') }))
    : [];
  const questions = Array.isArray(q.quiz?.questions)
    ? q.quiz.questions
      .filter((x: any) => x && typeof x.question === 'string')
      .map((x: any) => ({ question: String(x.question), options: Array.isArray(x.options) ? x.options.map(String) : [] }))
    : [];
  const games = [
    q.wordBlitz ? { key: 'wordBlitz', label: 'Word Blitz' } : null,
    q.wordTower ? { key: 'wordTower', label: 'Word Tower' } : null,
    q.craterBlast ? { key: 'craterBlast', label: 'Crater Blast' } : null,
  ].filter(Boolean) as { key: string; label: string }[];
  return { cards, questions, hasCrossword: !!q.crossword, games };
}

interface LatestGrade {
  documentId: string | null;
  title: string;
  score: number | null;
  grade: string | null;
  fixes: string[];
  rubric: { key: string; label: string; score: number; max: number }[];
}

const labelOf = (key: string): string => {
  const s = key.replace(/_/g, ' ').trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
};

function gradeFromRow(row: any): LatestGrade | null {
  const r = row?.analysis_results;
  if (!r || typeof r !== 'object') return null;
  if (row.analysis_type === 'citation_review' || row.analysis_type === 'citation') return null;
  const fixes = Array.isArray(r.top_suggestions)
    ? r.top_suggestions
      .map((s: any) => (typeof s === 'string' ? s : s?.suggestion || s?.text || s?.title || ''))
      .filter((s: string) => s && s.trim())
    : [];
  const rubric = r.grade_rubric && typeof r.grade_rubric === 'object'
    ? Object.entries(r.grade_rubric as Record<string, any>)
      .filter(([, v]) => v && typeof v === 'object' && typeof v.score === 'number')
      .map(([key, v]) => ({ key, label: labelOf(key), score: v.score as number, max: typeof v.max_score === 'number' && v.max_score > 0 ? v.max_score : 20 }))
    : [];
  return {
    documentId: row.document_id ?? null,
    title: row.documents?.title || row.title || 'Your essay',
    score: typeof r.overall_score === 'number' ? Math.round(r.overall_score) : null,
    grade: typeof r.grade_estimate === 'string' ? (r.grade_estimate.replace(/\s*\(.*$/, '').trim() || null) : null,
    fixes,
    rubric,
  };
}

/**
 * The dashboard's home. It follows what the student is working on:
 *   - exams: their study pack, a countdown once they give the exam date,
 *     and three steps for today (flashcards, the quiz, a game);
 *   - essays: their latest grade, the fixes to make first and where the
 *     marks went.
 * A new account with nothing yet gets the same box as the landing page
 * for the door it came through. The switch at the top is theirs to flip
 * and is remembered on this device.
 *
 * Exam dates and today's ticks are kept in this browser only.
 */
export default function TodayHome({ userName, topBar, packs, packsLoading, docs, docsLoaded, onOpenPack, onOpenDoc, onGradeEssay, onMakePack, onStartReview, userId }: TodayHomeProps) {
  // Daily Review is step 1 of the plan: its own record says whether today's
  // review is done and how long the streak is.
  const review = readReviewStreak(userId);
  const hasPack = packs.length > 0;
  const hasGrade = docs.some((d) => d.hasAnalysis);

  const [mode, setMode] = useState<HomeMode>(() => {
    try {
      const saved = localStorage.getItem(MODE_KEY);
      if (saved === 'exam' || saved === 'essay' || saved === 'both') return saved;
    } catch { /* ignore */ }
    return (readDoor() as Door | null) ?? 'exam';
  });
  /** Until the student picks a mode themselves, follow what is in the account. */
  const [modeChosen] = useState<boolean>(() => {
    try { return !!localStorage.getItem(MODE_KEY) || !!readDoor(); } catch { return false; }
  });
  useEffect(() => {
    if (modeChosen || !docsLoaded || packsLoading) return;
    if (hasPack && hasGrade) setMode('both');
    else if (hasGrade && !hasPack) setMode('essay');
    else if (hasPack) setMode('exam');
  }, [modeChosen, docsLoaded, packsLoading, hasPack, hasGrade]);

  const pickMode = (next: HomeMode) => {
    setMode(next);
    try { localStorage.setItem(MODE_KEY, next); } catch { /* ignore */ }
    if (next !== 'both') rememberDoor(next);
    trackEvent('door_selected', { door: next, source: 'dashboard' });
  };

  /* ─── Exam side ─── */
  const pack = packs[0] ?? null;
  const parts = useMemo(() => partsOf(pack), [pack]);
  const [examDates, setExamDates] = useState<Record<string, string>>(() => readJson(EXAM_DATES_KEY, {}));
  // A date, or 'done' (the exam has happened) or 'none' (not studying for an exam).
  const examAnswer = pack ? examDates[pack.id] : undefined;
  const examDate = examAnswer && /^\d{4}-\d{2}-\d{2}$/.test(examAnswer) ? examAnswer : undefined;
  const daysLeft = examDate ? daysUntil(examDate) : null;
  const examPassed = examAnswer === 'done' || (daysLeft != null && daysLeft < 0);
  const setExamDate = (value: string) => {
    if (!pack) return;
    const next = { ...examDates };
    if (value) next[pack.id] = value;
    else delete next[pack.id];
    setExamDates(next);
    writeJson(EXAM_DATES_KEY, next);
  };
  const [editingDate, setEditingDate] = useState(false);

  const [ticked, setDone] = useState<StepKey[]>(() => {
    const saved = readJson<{ day?: string; pack?: string; done?: StepKey[] }>(PLAN_KEY, {});
    return saved.day === today() && Array.isArray(saved.done) ? saved.done : [];
  });
  // Ticks belong to one pack and one day.
  useEffect(() => {
    const saved = readJson<{ day?: string; pack?: string; done?: StepKey[] }>(PLAN_KEY, {});
    setDone(saved.day === today() && saved.pack === pack?.id && Array.isArray(saved.done) ? saved.done : []);
  }, [pack?.id]);

  const openStep = (step: StepKey, tab: string) => {
    if (!pack) return;
    const next = ticked.includes(step) ? ticked : [...ticked, step];
    setDone(next);
    writeJson(PLAN_KEY, { day: today(), pack: pack.id, done: next });
    try { sessionStorage.setItem(VIEWER_TAB_KEY, tab); } catch { /* ignore */ }
    trackEvent('pack_started', { source: 'today_plan', kind: step });
    onOpenPack(pack);
  };
  // The review counts as done only when the review itself was finished today.
  const done: StepKey[] = [...(review.doneToday ? (['review'] as StepKey[]) : []), ...ticked.filter((s) => s !== 'review')];
  const nextStep: StepKey | null = (['review', 'quiz', 'game'] as StepKey[]).find((s) => !done.includes(s)) ?? null;
  const startReview = () => {
    trackEvent('pack_started', { source: 'today_plan', kind: 'review' });
    onStartReview();
  };
  const firstGame = parts.games[0]?.key ?? 'wordBlitz';
  const startSession = () => {
    const step = nextStep ?? 'review';
    if (step === 'review') {
      startReview();
      return;
    }
    openStep(step, step === 'game' ? firstGame : step);
  };

  /* ─── Essay side ─── */
  const [latest, setLatest] = useState<LatestGrade | null>(null);
  const [gradeLoaded, setGradeLoaded] = useState(false);
  useEffect(() => {
    if (!hasGrade) {
      setLatest(null);
      setGradeLoaded(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const token = localStorage.getItem('authToken') || '';
        const res = await fetch(`${API_URL}/analysis/history?limit=5`, { headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json().catch(() => null);
        const rows: any[] = Array.isArray(json?.data) ? json.data : [];
        const found = rows.map(gradeFromRow).find(Boolean) ?? null;
        if (!cancelled) setLatest(found);
      } catch {
        if (!cancelled) setLatest(null);
      } finally {
        if (!cancelled) setGradeLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [hasGrade, docs.length]);

  const showExam = mode === 'exam' || mode === 'both';
  const showEssay = mode === 'essay' || (mode === 'both' && !hasPack);
  const loading = !docsLoaded || !!packsLoading;

  const openReport = () => {
    const id = latest?.documentId || docs.find((d) => d.hasAnalysis)?.id;
    if (id) onOpenDoc(id);
  };

  return (
    <div className="mx-auto w-full max-w-[1180px] pb-2" style={FONT}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[14.5px] font-extrabold text-[#57534E] dark:text-stone-400">I&apos;m working on</span>
          <div role="tablist" aria-label="What you are working on" className="inline-flex gap-1 rounded-full bg-[#F3EAFF] p-1 dark:bg-stone-800">
            {([['exam', 'Exams'], ['essay', 'Essays'], ['both', 'Both']] as [HomeMode, string][]).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={mode === value}
                onClick={() => pickMode(value)}
                className={`min-h-[44px] rounded-full px-5 text-[15px] transition-colors ${
                  mode === value
                    ? 'bg-white font-black text-[#7733B5] shadow-[0_4px_10px_-4px_rgba(90,45,140,0.45)] dark:bg-stone-950 dark:text-[#C9A0F0]'
                    : 'font-extrabold text-[#57534E] hover:text-[#1C1917] dark:text-stone-400 dark:hover:text-stone-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {topBar && <div className="flex items-center gap-2">{topBar}</div>}
      </div>

      {loading ? (
        <div className={`flex min-h-[320px] items-center justify-center ${CARD}`}>
          <img src="/mascot-thinking-still.webp" alt="" width={96} height={96} className="h-24 w-24 object-contain motion-safe:animate-pulse" />
        </div>
      ) : (
        <div className="flex flex-col gap-7">
          {showExam && (hasPack && pack ? (
            <>
              <Banner
                eyebrow={daysLeft != null && daysLeft >= 0 ? 'Your next exam' : examPassed ? 'Exam done' : 'Your study pack'}
                title={
                  daysLeft != null && daysLeft >= 0
                    ? <>{pack.title} {daysLeft === 0 ? <span className="text-[#FFD84D]">is today</span> : <>in <span className="text-[#FFD84D]">{daysLeft} {daysLeft === 1 ? 'day' : 'days'}</span></>}</>
                    : pack.title
                }
                mascot="/mascot-pointing.webp"
                bubbleTitle={done.length >= 3 ? 'All three done today.' : nextStep === 'quiz' ? 'Next up: the quiz.' : nextStep === 'game' ? 'Last one: a quick game.' : "Start with today's review."}
                bubbleBody={done.length >= 3 ? 'Come back tomorrow and do it again. That is what makes it stick.' : 'Three steps, about 20 minutes. Do them in order.'}
              >
                <div className="flex flex-wrap items-center gap-3">
                  {examAnswer && !editingDate ? (
                    <button
                      type="button"
                      onClick={() => setEditingDate(true)}
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#5A1F8F] px-4 text-[14.5px] font-extrabold text-white hover:bg-[#4A1778]"
                    >
                      {examAnswer === 'none'
                        ? 'No exam for this pack'
                        : examAnswer === 'done' || !examDate
                          ? 'Exam done'
                          : `${examPassed ? 'Exam was on' : 'Exam on'} ${new Date(`${examDate}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}`}
                      <span className="underline decoration-2 underline-offset-[3px]">Change</span>
                    </button>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2.5 rounded-2xl bg-[#5A1F8F] py-1.5 pl-4 pr-2 text-[15px] font-extrabold text-white">
                      <label className="inline-flex min-h-[44px] flex-wrap items-center gap-2.5">
                        When is the exam?
                        <input
                          type="date"
                          min={today()}
                          value={examDate && !examPassed ? examDate : ''}
                          onChange={(e) => { setExamDate(e.target.value); if (e.target.value) setEditingDate(false); }}
                          className="min-h-[40px] rounded-xl border-0 bg-white px-3 text-[15px] font-extrabold text-[#1C1917] focus:outline-none focus:ring-4 focus:ring-[#FFD84D]/60"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => { setExamDate('done'); setEditingDate(false); }}
                        className="min-h-[40px] rounded-xl bg-white px-3 text-[14.5px] font-black text-[#5B2491] hover:bg-[#F3EAFF]"
                      >
                        Already taken it
                      </button>
                      <button
                        type="button"
                        onClick={() => { setExamDate('none'); setEditingDate(false); }}
                        className="min-h-[40px] rounded-xl bg-white px-3 text-[14.5px] font-black text-[#5B2491] hover:bg-[#F3EAFF]"
                      >
                        No exam
                      </button>
                    </div>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-4">
                  <button type="button" onClick={startSession} className={`min-h-[62px] px-8 text-[19px] ${BTN_GREEN}`}>
                    {done.length >= 3 ? 'Go again' : done.length > 0 ? 'Carry on' : "Start today's session"}
                    <Arrow />
                  </button>
                  <span className="text-[15px] font-extrabold text-[#F3EAFF]">{done.length} of 3 done today</span>
                  {review.days > 0 && (
                    <span className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border-2 border-b-[3px] border-[#D4A300] bg-[#FFC800] px-3 text-[14px] font-black text-[#5A4500]">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="#E05A00" aria-hidden><path d="M12 2c1 4 5.500 5.500 5.500 10.500a5.500 5.500 0 0 1-11 0c0-2 1-3.200 1.700-4.600C9.800 9.400 11.400 6 12 2z" /></svg>
                      {review.days} day streak
                    </span>
                  )}
                </div>
              </Banner>

              <section aria-label="Today's plan" className="flex flex-col gap-3.5">
                <SectionTitle title="Today's plan" aside={`${done.length} of 3 done`} />
                <div className="grid grid-cols-1 gap-[18px] md:grid-cols-3">
                  <PlanCard
                    n={1}
                    title="Do today's review"
                    note="A short recall session from your packs"
                    active={nextStep === 'review'}
                    done={done.includes('review')}
                    onOpen={startReview}
                    cta={done.includes('review') ? 'Review again' : 'Start review'}
                  >
                    <div className="relative flex h-full items-center justify-center overflow-hidden">
                      <span aria-hidden className="absolute h-[108px] w-[74%] -rotate-6 rounded-[18px] bg-[#E2CCFA]" />
                      <span className="relative flex min-h-[108px] w-[74%] flex-col items-center justify-center gap-1.5 rounded-[18px] border-2 border-[#C9A0F0] bg-white px-4 py-3 text-center shadow-[0_14px_24px_-16px_rgba(90,45,140,0.7)]">
                        <span className="text-[10.5px] font-black tracking-[0.14em] text-[#7733B5]">FRONT</span>
                        <span className="line-clamp-3 text-[15.5px] font-black leading-snug text-[#1C1917]">{parts.cards[0]?.front || 'Your first card'}</span>
                      </span>
                    </div>
                  </PlanCard>

                  <PlanCard
                    n={2}
                    title={`Take the ${parts.questions.length || 10}-question quiz`}
                    note="Every miss comes with the reason why"
                    active={nextStep === 'quiz'}
                    done={done.includes('quiz')}
                    onOpen={() => openStep('quiz', 'quiz')}
                    cta="Open the quiz"
                  >
                    <div className="flex h-full flex-col justify-center gap-2 p-3.5">
                      <span className="line-clamp-2 text-[14.5px] font-black leading-snug text-[#1C1917]">{parts.questions[0]?.question || 'Your first question'}</span>
                      {(parts.questions[0]?.options ?? []).slice(0, 2).map((o) => (
                        <span key={o} className="truncate rounded-xl border-2 border-[#E4D4F8] bg-white px-3 py-1.5 text-[13.5px] font-extrabold text-[#57534E]">{o}</span>
                      ))}
                    </div>
                  </PlanCard>

                  <PlanCard
                    n={3}
                    title="Win a round of a game"
                    note="A fast game on the same topic to lock it in"
                    active={nextStep === 'game'}
                    done={done.includes('game')}
                    onOpen={() => openStep('game', firstGame)}
                    cta={`Play ${parts.games[0]?.label ?? 'a game'}`}
                    tone="game"
                  >
                    <div className="flex h-full flex-col justify-center gap-2 p-3.5">
                      {(parts.games.length ? parts.games : [{ key: 'wordBlitz', label: 'Word Blitz' }]).map((g) => (
                        <button
                          key={g.key}
                          type="button"
                          onClick={() => openStep('game', g.key)}
                          className="flex min-h-[44px] items-center justify-between rounded-xl border-2 border-[#EAD9A0] bg-white px-3.5 text-[14.5px] font-black text-[#1C1917] hover:border-[#D4A300]"
                        >
                          {g.label}
                          <span className="text-[13px] font-extrabold text-[#7A4B00]">Play</span>
                        </button>
                      ))}
                    </div>
                  </PlanCard>
                </div>
              </section>

              <div className="flex flex-wrap items-stretch gap-[18px]">
                <section aria-label="In this pack" className={`flex min-w-0 flex-[3_1_420px] flex-col gap-3 p-5 sm:p-6 ${CARD} dark:border-stone-700 dark:bg-stone-900`}>
                  <div className="flex items-baseline justify-between gap-3">
                    <h2 className="m-0 text-[20px] font-black text-[#1C1917] dark:text-stone-50">In this pack</h2>
                    {packs.length > 1 && <span className="text-[14px] font-extrabold text-[#57534E]">{packs.length} packs saved</span>}
                  </div>
                  <ul className="m-0 grid list-none grid-cols-1 gap-2.5 p-0 sm:grid-cols-2">
                    {[
                      { tab: 'lesson', label: 'A short lesson', detail: 'Read this first if the topic is new' },
                      { tab: 'flashcards', label: `${parts.cards.length || ''} flashcards`.trim(), detail: 'Flip, then mark what you know' },
                      { tab: 'quiz', label: `${parts.questions.length || ''} quiz questions`.trim(), detail: 'With the reason behind each answer' },
                      ...(parts.hasCrossword ? [{ tab: 'crossword', label: 'A crossword', detail: 'The key terms, as clues' }] : []),
                    ].map((item) => (
                      <li key={item.tab}>
                        <button
                          type="button"
                          onClick={() => { try { sessionStorage.setItem(VIEWER_TAB_KEY, item.tab); } catch { /* ignore */ } onOpenPack(pack); }}
                          className="flex min-h-[60px] w-full items-center justify-between gap-3 rounded-2xl border border-[#E4D4F8] bg-[#FBF8FF] px-4 py-2.5 text-left hover:border-[#C9A0F0] dark:border-stone-700 dark:bg-stone-800"
                        >
                          <span className="min-w-0">
                            <span className="block text-[15.5px] font-black text-[#1C1917] dark:text-stone-50">{item.label}</span>
                            <span className="block truncate text-[13px] font-bold text-[#57534E] dark:text-stone-400">{item.detail}</span>
                          </span>
                          <span className="shrink-0 text-[14px] font-black text-[#7733B5] dark:text-[#C9A0F0]">Open</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>

                <SideCard
                  mascot="/mascot-paper-still.webp"
                  title={hasGrade ? 'Your essay report' : 'Essay due as well?'}
                  body={hasGrade && latest
                    ? `${latest.title}: ${latest.grade || 'graded'}${latest.score != null ? `, ${latest.score} out of 100` : ''}.`
                    : 'Paste it in for an estimated grade and the fixes worth the most marks.'}
                  cta={hasGrade ? 'Open my report' : 'Grade an essay'}
                  onClick={hasGrade ? openReport : () => pickMode('essay')}
                />
              </div>

              <section aria-label="Start a new study pack" className="flex flex-col gap-3.5">
                <SectionTitle title="Something else coming up?" />
                <TopicBox onSubmit={onMakePack} idPrefix="today" flat />
              </section>
            </>
          ) : (
            <StartBanner
              title={userName ? <>What are we studying, <span className="text-[#FFD84D]">{userName}</span>?</> : 'What are we studying today?'}
              body="Type a course, a chapter or one idea. Scholar builds flashcards, a practice quiz and study games for it."
              mascot="/mascot-study-still.webp"
            >
              <TopicBox onSubmit={onMakePack} idPrefix="today" />
            </StartBanner>
          ))}

          {showEssay && (hasGrade ? (
            <>
              <Banner
                eyebrow="Your essay"
                title={
                  latest?.fixes.length
                    ? <>{latest.title} is <span className="text-[#FFD84D]">{latest.fixes.length} {latest.fixes.length === 1 ? 'fix' : 'fixes'}</span> from a better grade</>
                    : latest?.title || 'Your essay report'
                }
                mascot="/mascot-paper-still.webp"
                bubbleTitle={latest?.fixes.length ? 'Start with the first fix.' : 'Your report is ready.'}
                bubbleBody={latest?.fixes.length ? 'They are in order: the first one is worth the most.' : 'Open it to see every comment on your essay.'}
              >
                {latest?.score != null && (
                  <div className="flex w-full max-w-[480px] flex-wrap items-center gap-3">
                    <div role="img" aria-label={`${latest.score} out of 100`} className="h-4 min-w-[200px] flex-1 overflow-hidden rounded-full bg-[#5A1F8F]">
                      <div className="h-full rounded-full bg-[#FFD84D]" style={{ width: `${Math.max(4, Math.min(100, latest.score))}%` }} />
                    </div>
                    <span className="text-[16px] font-black">{latest.score} out of 100{latest.grade ? `, estimated ${latest.grade.split(/[\s(]/)[0]}` : ''}</span>
                  </div>
                )}
                <div className="mt-1 flex flex-wrap items-center gap-4">
                  <button type="button" onClick={openReport} className={`min-h-[62px] px-8 text-[19px] ${BTN_GREEN}`}>
                    {latest?.fixes.length ? 'Fix the first one' : 'Open my report'}
                    <Arrow />
                  </button>
                </div>
              </Banner>

              {gradeLoaded && latest && latest.fixes.length > 0 && (
                <section aria-label="What to fix first" className="flex flex-col gap-3.5">
                  <SectionTitle title="What to fix first" aside={`${latest.fixes.length} ${latest.fixes.length === 1 ? 'fix' : 'fixes'}`} />
                  <div className="grid grid-cols-1 gap-[18px] md:grid-cols-3">
                    {latest.fixes.slice(0, 3).map((fix, i) => (
                      <button
                        key={fix}
                        type="button"
                        onClick={openReport}
                        className={`flex flex-col gap-3 p-[18px] text-left transition-transform hover:-translate-y-0.5 ${CARD} ${i === 0 ? '!border-2 !border-[#A560E8]' : ''} dark:border-stone-700 dark:bg-stone-900`}
                      >
                        <span className="flex items-center gap-3">
                          <span aria-hidden className={`inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full text-[19px] font-black ${i === 0 ? 'bg-[#A560E8] text-white' : 'bg-[#F3EAFF] text-[#7733B5]'}`}>{i + 1}</span>
                          {i === 0 && <span className="rounded-full bg-[#F3EAFF] px-2.5 py-0.5 text-[11.5px] font-black uppercase tracking-[0.08em] text-[#7733B5]">Worth the most</span>}
                        </span>
                        <span className="text-[15.5px] font-extrabold leading-snug text-[#1C1917] dark:text-stone-100">{fix}</span>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              <div className="flex flex-wrap items-stretch gap-[18px]">
                {latest && latest.rubric.length > 0 && (
                  <section aria-label="Where the marks are" className={`flex min-w-0 flex-[3_1_420px] flex-col gap-3 p-5 sm:p-6 ${CARD} dark:border-stone-700 dark:bg-stone-900`}>
                    <div className="flex items-baseline justify-between gap-3">
                      <h2 className="m-0 text-[20px] font-black text-[#1C1917] dark:text-stone-50">Where the marks are</h2>
                      <button type="button" onClick={openReport} className="inline-flex min-h-[44px] items-center text-[14px] font-black text-[#7733B5] underline decoration-2 underline-offset-[3px] dark:text-[#C9A0F0]">Open full report</button>
                    </div>
                    <ul className="m-0 flex list-none flex-col gap-3 p-0">
                      {latest.rubric.map((r) => (
                        <li key={r.key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5">
                          <span className="text-[15px] font-extrabold text-[#1C1917] dark:text-stone-100">{r.label}</span>
                          <span className="text-[14.5px] font-black tabular-nums text-[#1C1917] dark:text-stone-100">{r.score} of {r.max}</span>
                          <span aria-hidden className="col-span-2 h-3 overflow-hidden rounded-full bg-[#F3EAFF] dark:bg-stone-800">
                            <span className="block h-full rounded-full bg-[#A560E8]" style={{ width: `${Math.max(4, Math.min(100, (r.score / r.max) * 100))}%` }} />
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
                <SideCard
                  mascot="/mascot-study-still.webp"
                  title={hasPack ? 'Your study pack' : 'Exam coming up too?'}
                  body={hasPack && pack ? `${pack.title}: flashcards, a quiz and games are waiting.` : 'Type the topic and get flashcards, a quiz and games for it.'}
                  cta={hasPack ? 'Open my pack' : 'Make a study pack'}
                  onClick={hasPack && pack ? () => onOpenPack(pack) : () => pickMode('exam')}
                />
              </div>

              <section aria-label="Grade another essay" className="flex flex-col gap-3.5">
                <SectionTitle title="Another essay to check?" />
                <HeroEssayGrader onSubmit={(text) => onGradeEssay(text)} instant />
              </section>
            </>
          ) : (
            <StartBanner
              title={userName ? <>Paste your essay, <span className="text-[#FFD84D]">{userName}</span></> : 'Paste your essay'}
              body="In about a minute you will see your estimated grade, every rubric score and what to fix first."
              mascot="/mascot-paper-still.webp"
            >
              <HeroEssayGrader onSubmit={(text) => onGradeEssay(text)} instant />
            </StartBanner>
          ))}
        </div>
      )}
    </div>
  );
}

function Arrow() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12h14M13 6l6 6-6 6" /></svg>
  );
}

function SectionTitle({ title, aside }: { title: string; aside?: string }) {
  return (
    <div className="flex items-center gap-3.5">
      <h2 className="m-0 text-[22px] font-black tracking-[-0.01em] text-[#1C1917] dark:text-stone-50">{title}</h2>
      <span aria-hidden className="h-px flex-1 bg-[#E7E5E4] dark:bg-stone-800" />
      {aside && <span className="text-[14.5px] font-extrabold text-[#57534E] dark:text-stone-400">{aside}</span>}
    </div>
  );
}

const BANNER = 'relative overflow-hidden rounded-[32px] bg-gradient-to-b from-[#A863EA] via-[#8E48CF] to-[#6A2AA6] text-white shadow-[0_30px_60px_-34px_rgba(90,45,140,0.8)]';

/** The purple banner: what you are working on, one action, and Scholar. */
function Banner({ eyebrow, title, mascot, bubbleTitle, bubbleBody, children }: { eyebrow: string; title: ReactNode; mascot: string; bubbleTitle: string; bubbleBody: string; children: ReactNode }) {
  return (
    <section className={`flex flex-wrap items-center gap-6 px-6 py-7 sm:px-9 sm:py-8 ${BANNER}`}>
      <span aria-hidden className="pointer-events-none absolute -right-[150px] -top-[90px] h-[620px] w-[620px] rounded-full bg-[#9652D3]" />
      <span aria-hidden className="pointer-events-none absolute -right-[40px] top-5 h-[400px] w-[400px] rounded-full bg-[#A863EA]" />
      <div className="relative flex min-w-0 flex-[3_1_400px] flex-col items-start gap-3.5">
        <span className="inline-flex min-h-[30px] items-center rounded-full bg-[#5A1F8F] px-3 text-[12.5px] font-extrabold uppercase tracking-[0.14em]">{eyebrow}</span>
        <h1 className="m-0 text-[2.1rem] font-black leading-[1.02] tracking-[-0.03em] [text-wrap:balance] sm:text-[2.9rem]">{title}</h1>
        {children}
      </div>
      <div className="relative flex min-w-0 flex-[2_1_300px] items-center justify-center gap-1">
        <div className="relative mt-2 min-w-[168px] max-w-[240px] flex-1 self-start rounded-[20px] bg-white px-4 py-3.5 text-[#1C1917] shadow-[0_18px_36px_-18px_rgba(0,0,0,0.5)]">
          <p className="m-0 text-[16.5px] font-black leading-snug">{bubbleTitle}</p>
          <p className="m-0 mt-1 text-[14.5px] font-bold leading-snug text-[#57534E]">{bubbleBody}</p>
          <span aria-hidden className="absolute -right-2 bottom-[22px] h-[18px] w-[18px] rotate-45 bg-white" />
        </div>
        <img src={mascot} alt="Scholar, the WriteScholar mascot" width={220} height={220} className="h-[140px] w-[140px] shrink-0 object-contain xl:h-[210px] xl:w-[210px]" />
      </div>
    </section>
  );
}

/** A new account's first screen for a door: the question, Scholar and the box. */
function StartBanner({ title, body, mascot, children }: { title: ReactNode; body: string; mascot: string; children: ReactNode }) {
  return (
    <section className={`px-4 pb-6 pt-7 sm:px-9 sm:pb-9 sm:pt-8 ${BANNER}`}>
      <span aria-hidden className="pointer-events-none absolute left-1/2 top-[150px] h-[900px] w-[900px] -translate-x-1/2 rounded-full bg-[#8A45C8]" />
      <div className="relative mx-auto flex w-full max-w-[860px] flex-col gap-5">
        <div className="flex items-center gap-4">
          <img src={mascot} alt="Scholar, the WriteScholar mascot" width={120} height={120} className="h-[92px] w-[92px] shrink-0 object-contain sm:h-[120px] sm:w-[120px]" />
          <div className="min-w-0">
            <h1 className="m-0 text-[1.9rem] font-black leading-[1.05] tracking-[-0.03em] [text-wrap:balance] sm:text-[2.7rem]">{title}</h1>
            <p className="m-0 mt-1.5 max-w-[40rem] text-[15.5px] font-bold leading-snug text-[#F3EAFF] sm:text-[17px]">{body}</p>
          </div>
        </div>
        {children}
      </div>
    </section>
  );
}

function PlanCard({ n, title, note, active, done, onOpen, cta, tone, children }: { n: number; title: string; note: string; active: boolean; done: boolean; onOpen: () => void; cta: string; tone?: 'game'; children: ReactNode }) {
  return (
    <article className={`relative flex flex-col gap-3 p-[18px] ${CARD} ${active ? '!border-2 !border-[#A560E8] shadow-[0_20px_40px_-24px_rgba(90,45,140,0.75)]' : ''} dark:border-stone-700 dark:bg-stone-900`}>
      {(done || active) && (
        <span className={`absolute right-3.5 top-3.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11.5px] font-black uppercase tracking-[0.08em] ${done ? 'bg-[#E6F9D2] text-[#14532D]' : 'bg-[#F3EAFF] text-[#7733B5]'}`}>
          {done ? 'Done' : 'Up now'}
        </span>
      )}
      <div className={`flex items-start gap-3 ${done || active ? 'pt-6' : ''}`}>
        <span aria-hidden className={`inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full text-[19px] font-black ${done ? 'bg-[#58CC02] text-white' : active ? 'bg-[#A560E8] text-white' : 'bg-[#F3EAFF] text-[#7733B5]'}`}>
          {done ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>
          ) : n}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="m-0 text-[18.5px] font-black leading-tight text-[#1C1917] dark:text-stone-50">{title}</h3>
          <p className="m-0 mt-0.5 text-[13.5px] font-bold text-[#57534E] dark:text-stone-400">{note}</p>
        </div>
      </div>
      <div className={`mt-auto h-[168px] rounded-[18px] ${tone === 'game' ? 'bg-[#FFF3CF]' : 'bg-[#F7F1FF] dark:bg-stone-800'}`}>{children}</div>
      <button type="button" onClick={onOpen} className={`min-h-[50px] w-full text-[16px] ${active ? BTN_GREEN : BTN_WHITE}`}>
        {cta}
      </button>
    </article>
  );
}

function SideCard({ mascot, title, body, cta, onClick }: { mascot: string; title: string; body: string; cta: string; onClick: () => void }) {
  return (
    <section className="flex min-w-0 flex-[2_1_300px] items-center gap-3 rounded-[24px] border border-[#E4D4F8] bg-[#F7F1FF] p-5 dark:border-stone-700 dark:bg-stone-900 sm:p-6">
      <img src={mascot} alt="" width={118} height={118} className="h-[96px] w-[96px] shrink-0 object-contain sm:h-[118px] sm:w-[118px]" />
      <div className="flex min-w-0 flex-col items-start gap-2">
        <h2 className="m-0 text-[20px] font-black leading-tight text-[#1C1917] dark:text-stone-50">{title}</h2>
        <p className="m-0 text-[14.5px] font-bold leading-snug text-[#57534E] dark:text-stone-400">{body}</p>
        <button type="button" onClick={onClick} className={`min-h-[48px] px-5 text-[15px] ${BTN_PURPLE}`}>{cta}</button>
      </div>
    </section>
  );
}
