import { useEffect, useRef, useState } from 'react';
import Header from '../common/Header';
import Footer from '../common/Footer';
import {
  AnalysisPreviewSection,
  StudyPackPreviewSection,
  CitationsPreviewSection,
} from '../common/PreviewSections';

/**
 * Mobile dashboard — a complete, from-scratch redesign that's separate
 * from the desktop dashboard. Desktop has level widgets, usage grids,
 * sidebar, hub cards. Mobile has:
 *
 *   1. Compact greeting + streak chip
 *   2. 2×2 tool grid with "SMARTEST AI" / "MOST POPULAR" badges
 *   3. Inline tool form for the active tool (NO navigation away — submits
 *      to the full page only after the user clicks the action button)
 *   4. Compact recent activity (3 items max)
 *   5. Games row (3 small chunky cards)
 *   6. Quick tools row (citations, pomodoro, GPA, free tools)
 *   7. Upgrade nudge (free users only)
 *
 * Wired in by DashboardPageNew.tsx via md:hidden / hidden md:block toggle.
 */

type DashboardTool = 'daily_review' | 'analyze' | 'citations' | 'study_pack' | 'more_tools';

interface RecentItem {
  id: string;
  title: string;
  createdAt: string;
  kind: 'analyze' | 'study_pack' | 'citations' | 'daily_review';
}

interface MobileDashboardProps {
  user: { name?: string; firstName?: string; plan?: string; subscription_plan?: string } | null;
  onNavigate: (page: string, slug?: string) => void;
  onLogout: () => void;
  dashboardTool: DashboardTool;
  setDashboardTool: (tool: DashboardTool) => void;
  recentItems: RecentItem[];
  streakDays: number;
  isNewUser: boolean;
}

/* ─── Tool metadata ───────────────────────────────────────────── */

interface ToolDef {
  id: DashboardTool;
  label: string;
  emoji: string;
  /** Tag shown on the tool tile (e.g. SMARTEST AI, MOST POPULAR) */
  badge?: { text: string; bg: string; color: string };
  accent: string;
  accentBg: string;
  accentBorder: string;
  /** Headline shown when the inline form is rendered */
  formTitle: string;
  /** Subtitle shown above the form */
  formSub: string;
  /** Placeholder text in the textarea/input */
  placeholder: string;
  /** Button label that submits + navigates to the full tool */
  submitLabel: string;
  /** Page name to navigate to on submit (full tool page handles the input) */
  submitPage: string;
  /** localStorage key the full page reads to pre-fill the input */
  draftKey: string;
  /** Use 'input' (single line) or 'textarea' (multiline) */
  inputType: 'input' | 'textarea';
}

/* Duolingo-style green tuned to match the green in the desktop daily review
   card — the user flagged it was too pale on mobile. */
const TOOLS: ToolDef[] = [
  {
    id: 'analyze',
    label: 'Essay Checker',
    emoji: '📝',
    badge: { text: 'SMARTEST AI', bg: '#FFE8E8', color: '#FF4B4B' },
    accent: '#FF4B4B',
    accentBg: '#FFE8E8',
    accentBorder: '#E04343',
    formTitle: 'Get your essay graded',
    formSub: 'Paste it. Get rubric scores, line-by-line annotations, and a polished revision in 30 seconds.',
    placeholder: 'Paste your essay here...',
    submitLabel: 'Check my essay',
    submitPage: 'analyze',
    draftKey: 'writescholar_analyze_draft',
    inputType: 'textarea',
  },
  {
    id: 'study_pack',
    label: 'Study Pack',
    emoji: '📦',
    badge: { text: 'MOST POPULAR', bg: '#FFF4E0', color: '#FF9600' },
    accent: '#FF9600',
    accentBg: '#FFF4E0',
    accentBorder: '#D97F00',
    formTitle: 'Turn notes into a pack',
    formSub: 'Flashcards, quizzes, and summaries from any notes in 60 seconds.',
    placeholder: 'Paste your lecture notes or textbook chapter...',
    submitLabel: 'Build my pack',
    submitPage: 'study-pack',
    draftKey: 'writescholar_studypack_draft',
    inputType: 'textarea',
  },
  {
    id: 'citations',
    label: 'Citations',
    emoji: '📚',
    accent: '#1CB0F6',
    accentBg: '#DDF4FF',
    accentBorder: '#1899D6',
    formTitle: 'Find sources for your paper',
    formSub: 'Type your topic. Get real, citable sources in APA, MLA, Chicago, and more.',
    placeholder: 'What are you researching?',
    submitLabel: 'Find citations',
    submitPage: 'citations',
    draftKey: 'writescholar_citations_draft',
    inputType: 'input',
  },
  {
    id: 'daily_review',
    label: 'Daily Review',
    emoji: '🎯',
    accent: '#58CC02',
    accentBg: '#E5F8D0',
    accentBorder: '#46A302',
    formTitle: "Today's review is ready",
    formSub: 'Quick practice from your saved notes — 10 questions, 5 minutes.',
    placeholder: '',
    submitLabel: 'Start today',
    submitPage: 'dashboard',
    draftKey: '',
    inputType: 'input',
  },
];

const GAMES = [
  {
    id: 'crater-blast',
    label: 'Crater Blast',
    emoji: '💥',
    accent: '#FF4B4B',
    accentBg: '#FFE8E8',
    page: 'crater-blast',
  },
  {
    id: 'word-tower',
    label: 'Word Tower',
    emoji: '🗼',
    accent: '#58CC02',
    accentBg: '#E5F8D0',
    page: 'word-tower',
  },
  {
    id: 'word-blitz',
    label: 'Word Blitz',
    emoji: '⚡',
    accent: '#FF9600',
    accentBg: '#FFF4E0',
    page: 'word-blitz',
  },
];

const QUICK_TOOLS = [
  { label: 'Citation gen', emoji: '🔖', page: 'citation-generator-tool' },
  { label: 'Pomodoro', emoji: '🍅', page: 'pomodoro-timer' },
  { label: 'GPA calc', emoji: '🎓', page: 'gpa-calculator' },
  { label: 'All tools', emoji: '🧰', page: 'more-tools' },
];

/* ─── Helpers ─────────────────────────────────────────────────── */

function getFirstName(user: MobileDashboardProps['user']): string {
  if (!user) return 'there';
  if (user.firstName) return user.firstName;
  if (user.name) return user.name.split(' ')[0];
  return 'there';
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.max(0, Math.floor(ms / 60000));
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.floor(d / 7);
  return `${w}w ago`;
}

function kindMeta(kind: RecentItem['kind']) {
  const t = TOOLS.find((x) => x.id === kind);
  if (!t) return { emoji: '📄', accent: '#A560E8', accentBg: '#F3EAFF' };
  return { emoji: t.emoji, accent: t.accent, accentBg: t.accentBg };
}

/* ─── Component ───────────────────────────────────────────────── */

const MobileDashboard = ({
  user,
  onNavigate,
  onLogout,
  dashboardTool,
  setDashboardTool,
  recentItems,
  streakDays,
  isNewUser,
}: MobileDashboardProps) => {
  const activeTool = TOOLS.find((t) => t.id === dashboardTool) ?? TOOLS[0];

  // Inline form input state — separate per tool via the draftKey so switching
  // tabs doesn't wipe what the user already typed.
  const [draftText, setDraftText] = useState('');
  useEffect(() => {
    if (!activeTool.draftKey) { setDraftText(''); return; }
    try {
      setDraftText(localStorage.getItem(activeTool.draftKey) ?? '');
    } catch { setDraftText(''); }
  }, [activeTool.draftKey]);

  const persistDraft = (val: string) => {
    setDraftText(val);
    if (!activeTool.draftKey) return;
    try { localStorage.setItem(activeTool.draftKey, val); } catch { /* ignore */ }
  };

  const handleSubmit = () => {
    // Daily review just switches tools — no submit page
    if (activeTool.id === 'daily_review') {
      setDashboardTool('daily_review');
      return;
    }
    // Other tools navigate to their full page (which reads the saved draft).
    onNavigate(activeTool.submitPage);
  };

  const subtitle = isNewUser
    ? "Let's start with your first essay."
    : streakDays > 0
      ? `Day ${streakDays} of your streak. Keep going.`
      : "Let's turn that B into an A.";

  const formCardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = formCardRef.current;
    if (!el) return;
    el.classList.remove('opacity-0', 'translate-y-2');
    el.classList.add('opacity-100', 'translate-y-0');
  }, [dashboardTool]);

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col">
      <Header onNavigate={onNavigate} user={user as any} onLogout={onLogout} currentPage="dashboard" />

      <main className="flex-1 px-5 pt-4 pb-24 max-w-md mx-auto w-full">
        {/* ── Greeting block ──────────────────────────────────── */}
        <header className="mb-6">
          <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-stone-400 dark:text-stone-500 mb-1">
            {getGreeting()}
          </p>
          <h1 className="text-[26px] font-extrabold tracking-tight text-stone-900 dark:text-stone-50 leading-[1.15]">
            {getFirstName(user)} 👋
          </h1>
          <p className="mt-1 text-[14px] text-stone-600 dark:text-stone-400 font-medium leading-snug">
            {subtitle}
          </p>

          {streakDays > 0 && (
            <button
              type="button"
              onClick={() => setDashboardTool('daily_review')}
              className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFF4E0] dark:bg-[#FF9600]/15 border-2 border-[#FF9600]/40 hover:border-[#FF9600] transition-colors"
              aria-label={`${streakDays} day streak — open daily review`}
            >
              <span className="text-sm" aria-hidden>🔥</span>
              <span className="text-[12px] font-extrabold text-[#FF9600] tabular-nums">
                {streakDays}
              </span>
              <span className="text-[11px] font-bold text-[#FF9600]">
                day streak
              </span>
            </button>
          )}
        </header>

        {/* ── TOOL GRID 2×2 with badges ───────────────────────── */}
        <section className="mb-5">
          <h3 className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-stone-400 dark:text-stone-500 mb-3 pl-1">
            Your tools
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {TOOLS.map((tool) => {
              const isActive = tool.id === dashboardTool;
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => setDashboardTool(tool.id)}
                  className={`relative rounded-2xl border-2 border-b-4 px-3.5 py-4 text-left transition-all active:translate-y-0.5 active:border-b-2 ${
                    isActive ? 'bg-white dark:bg-stone-900 shadow-md' : 'bg-white dark:bg-stone-900'
                  }`}
                  style={{ borderColor: isActive ? tool.accent : '#E5E5E5' }}
                >
                  {/* Tag badge — only on tools with a badge */}
                  {tool.badge && (
                    <span
                      className="absolute -top-2 left-3 px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider whitespace-nowrap"
                      style={{
                        backgroundColor: tool.badge.bg,
                        color: tool.badge.color,
                        border: `2px solid ${tool.badge.color}`,
                      }}
                    >
                      {tool.badge.text}
                    </span>
                  )}
                  {/* Active dot */}
                  {isActive && (
                    <span
                      className="absolute top-3 right-3 w-2 h-2 rounded-full"
                      style={{ backgroundColor: tool.accent }}
                      aria-hidden
                    />
                  )}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-[20px] mb-2"
                    style={{ backgroundColor: tool.accentBg }}
                    aria-hidden
                  >
                    {tool.emoji}
                  </div>
                  <div className="font-extrabold text-stone-900 dark:text-stone-50 text-[13px] leading-tight">
                    {tool.label}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── INLINE TOOL FORM (the embedded "tool surface") ─── */}
        <div
          ref={formCardRef}
          className="relative mb-7 rounded-[24px] overflow-hidden border-2 border-b-4 transition-all duration-300 ease-out opacity-0 translate-y-2"
          style={{ backgroundColor: 'white', borderColor: activeTool.accent }}
        >
          {/* Top accent bar */}
          <div className="h-1.5 w-full" style={{ backgroundColor: activeTool.accent }} aria-hidden />

          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-[18px]"
                style={{ backgroundColor: activeTool.accentBg }}
                aria-hidden
              >
                {activeTool.emoji}
              </div>
              <h2 className="text-[18px] font-extrabold tracking-tight text-stone-900 dark:text-stone-50 leading-tight flex-1">
                {activeTool.formTitle}
              </h2>
            </div>
            <p className="text-[13px] text-stone-600 dark:text-stone-400 leading-relaxed mb-4 font-medium">
              {activeTool.formSub}
            </p>

            {/* Tool-specific input */}
            {activeTool.id === 'daily_review' ? (
              <div
                className="rounded-2xl p-4 mb-4 text-center border-2 border-dashed"
                style={{ backgroundColor: activeTool.accentBg, borderColor: activeTool.accent }}
              >
                <div className="text-2xl mb-1" aria-hidden>📚</div>
                <div className="text-[14px] font-extrabold text-stone-900 dark:text-stone-50 mb-0.5">
                  10 questions ready
                </div>
                <div className="text-[11px] text-stone-600 dark:text-stone-400 font-bold">
                  Built from your saved notes
                </div>
              </div>
            ) : activeTool.inputType === 'input' ? (
              <input
                type="text"
                value={draftText}
                onChange={(e) => persistDraft(e.target.value)}
                placeholder={activeTool.placeholder}
                className="w-full px-4 py-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-700 text-[14px] font-medium text-stone-900 dark:text-stone-50 focus:outline-none focus:border-stone-400 mb-4"
                style={{ borderColor: draftText ? activeTool.accent : undefined }}
              />
            ) : (
              <textarea
                value={draftText}
                onChange={(e) => persistDraft(e.target.value)}
                placeholder={activeTool.placeholder}
                rows={5}
                className="w-full px-4 py-3 rounded-2xl bg-stone-50 dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-700 text-[14px] font-medium text-stone-900 dark:text-stone-50 focus:outline-none focus:border-stone-400 mb-3 resize-none leading-relaxed"
                style={{ borderColor: draftText ? activeTool.accent : undefined }}
              />
            )}

            {activeTool.inputType === 'textarea' && draftText.trim().length > 0 && (
              <div className="text-[11px] text-stone-400 mb-3 font-bold tabular-nums text-right">
                {draftText.trim().split(/\s+/).filter(Boolean).length} words
              </div>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-extrabold text-white text-[15px] border-2 border-b-4 transition-transform active:translate-y-0.5 active:border-b-2"
              style={{
                backgroundColor: activeTool.accent,
                borderColor: activeTool.accentBorder,
              }}
            >
              {activeTool.submitLabel}
              <span className="text-base" aria-hidden>→</span>
            </button>

            {/* "Or upload a file" alternate path for the two tools where
                upload is the dominant input (essay grading and notes →
                study pack). The full tool page has the real upload
                UX (PDF / DOCX / TXT parsing); clicking here just routes
                there with a sessionStorage marker so it can auto-open
                the file picker on mount. Skipped for daily review (no
                upload makes sense) and citations (search by topic, not
                upload). */}
            {(activeTool.id === 'analyze' || activeTool.id === 'study_pack') && (
              <button
                type="button"
                onClick={() => {
                  try { sessionStorage.setItem('writescholar_open_upload', activeTool.id); } catch { /* ignore */ }
                  onNavigate(activeTool.submitPage);
                }}
                className="w-full mt-2.5 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-extrabold text-stone-700 dark:text-stone-200 bg-white dark:bg-stone-900 text-[14px] border-2 border-b-4 border-stone-200 dark:border-stone-700 active:translate-y-0.5 active:border-b-2 transition-transform"
              >
                <span aria-hidden>📎</span>
                {activeTool.id === 'analyze' ? 'Or upload your essay' : 'Or upload your notes'}
              </button>
            )}
          </div>
        </div>

        {/* ── PREVIEW SECTION — real screenshots of what the active
            tool generates. Same components the desktop dashboard uses
            in each tool hub, so users see "this is what I'll get"
            before they commit. Skipped for daily review (already shows
            a status card up top). */}
        {activeTool.id === 'analyze' && (
          <div className="mb-7">
            <AnalysisPreviewSection embedded />
          </div>
        )}
        {activeTool.id === 'study_pack' && (
          <div className="mb-7">
            <StudyPackPreviewSection embedded />
          </div>
        )}
        {activeTool.id === 'citations' && (
          <div className="mb-7">
            <CitationsPreviewSection embedded />
          </div>
        )}

        {/* ── RECENT ACTIVITY — 3 items max ───────────────────── */}
        {recentItems.length > 0 && (
          <section className="mb-7">
            <div className="flex items-center justify-between mb-3 pl-1">
              <h3 className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-stone-400 dark:text-stone-500">
                Recent
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('library')}
                className="text-[11px] font-extrabold text-[#A560E8]"
              >
                View all →
              </button>
            </div>
            <div className="space-y-2">
              {recentItems.slice(0, 3).map((item) => {
                const meta = kindMeta(item.kind);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (item.kind === 'analyze') onNavigate('analysis', item.id);
                      else onNavigate('library');
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-stone-900 border-2 border-b-4 border-stone-200 dark:border-stone-800 hover:border-stone-300 transition-all active:translate-y-0.5 active:border-b-2 text-left"
                  >
                    <div
                      className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-[16px]"
                      style={{ backgroundColor: meta.accentBg }}
                      aria-hidden
                    >
                      {meta.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-extrabold text-stone-900 dark:text-stone-50 text-[13px] truncate">
                        {item.title}
                      </div>
                      <div className="text-[11px] font-medium text-stone-500 dark:text-stone-400 mt-0.5">
                        {timeAgo(item.createdAt)}
                      </div>
                    </div>
                    <span className="flex-shrink-0 text-stone-400 text-base" aria-hidden>→</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* ── GAMES ROW — 3 compact tiles ─────────────────────── */}
        <section className="mb-7">
          <h3 className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-stone-400 dark:text-stone-500 mb-3 pl-1">
            Quick games
          </h3>
          <div className="grid grid-cols-3 gap-2.5">
            {GAMES.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => onNavigate(g.page)}
                className="rounded-2xl border-2 border-b-4 px-2 py-3.5 text-center transition-all active:translate-y-0.5 active:border-b-2 bg-white dark:bg-stone-900"
                style={{ borderColor: g.accent }}
              >
                <div
                  className="w-9 h-9 mx-auto mb-1.5 rounded-xl flex items-center justify-center text-[18px]"
                  style={{ backgroundColor: g.accentBg }}
                  aria-hidden
                >
                  {g.emoji}
                </div>
                <div className="font-extrabold text-stone-900 dark:text-stone-50 text-[11.5px] leading-tight">
                  {g.label}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ── QUICK TOOLS — small icon row ────────────────────── */}
        <section className="mb-7">
          <h3 className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-stone-400 dark:text-stone-500 mb-3 pl-1">
            Quick tools
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {QUICK_TOOLS.map((q) => (
              <button
                key={q.page}
                type="button"
                onClick={() => onNavigate(q.page)}
                className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-white dark:bg-stone-900 border-2 border-b-2 border-stone-200 dark:border-stone-800 active:translate-y-0.5 transition-transform"
              >
                <span className="text-[20px]" aria-hidden>{q.emoji}</span>
                <span className="text-[10.5px] font-extrabold text-stone-700 dark:text-stone-300 leading-tight text-center">
                  {q.label}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* ── UPGRADE NUDGE (free users only) ─────────────────── */}
        {user && (user.plan || user.subscription_plan || 'free').toLowerCase() === 'free' && (
          <section className="rounded-2xl bg-gradient-to-br from-[#A560E8] to-[#8A48C7] border-2 border-b-4 border-[#8A48C7] p-5 text-white">
            <div className="flex items-start gap-3 mb-4">
              <span className="text-2xl" aria-hidden>⭐</span>
              <div>
                <h3 className="font-extrabold text-[15px] mb-1">Try 7 days free</h3>
                <p className="text-[12.5px] opacity-90 leading-relaxed">
                  Unlock unlimited essay checks, study packs, and citations. Cancel anytime.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('pricing')}
              className="w-full bg-white text-[#A560E8] font-extrabold py-3 rounded-xl border-2 border-b-4 border-white/80 active:border-b-2 active:translate-y-0.5 transition-transform text-[14px]"
            >
              Start free trial
            </button>
          </section>
        )}
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default MobileDashboard;
