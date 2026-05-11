import { useEffect, useRef } from 'react';
import Header from '../common/Header';

/**
 * Mobile dashboard — a complete, from-scratch redesign that shares NOTHING
 * with the desktop dashboard's layout. Desktop has level widgets, usage
 * grids, hub cards, and recent grids fighting for attention. Mobile gets:
 *
 *   1. A warm one-sentence greeting + streak pill
 *   2. One hero "next action" card (the only CTA the user sees first)
 *   3. A 2×2 grid of tools (one tap to switch)
 *   4. A short list of the 3 most recent items (or empty-state)
 *
 * Three design rules:
 *   - One primary action per screen (the hero card)
 *   - 44pt+ tap targets everywhere (Apple HIG)
 *   - Vertical scroll only — no horizontal complexity
 *
 * Wired in by DashboardPageNew.tsx via md:hidden / hidden md:block toggle.
 */

type DashboardTool = 'daily_review' | 'analyze' | 'citations' | 'study_pack' | 'more_tools';

interface RecentItem {
  id: string;
  title: string;
  createdAt: string; // ISO date
  /** Which tool generated this — drives the icon + accent. */
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
  accent: string;
  accentBg: string;
  accentBorder: string;
  /** Headline shown on the hero card when this tool is selected */
  heroTitle: string;
  /** Subtitle shown on the hero card */
  heroSub: string;
  /** Button label on the hero card */
  heroCta: string;
  /** Page name to navigate to when the user taps the hero CTA */
  ctaPage: string;
}

const TOOLS: ToolDef[] = [
  {
    id: 'analyze',
    label: 'Essay Checker',
    emoji: '📝',
    accent: '#FF4B4B',
    accentBg: '#FFE8E8',
    accentBorder: '#E04343',
    heroTitle: 'Get your next essay graded',
    heroSub: 'Paste it. Get rubric scores, line-by-line notes, and a polished revision in 30 seconds.',
    heroCta: 'Check an essay',
    ctaPage: 'analyze',
  },
  {
    id: 'study_pack',
    label: 'Study Pack',
    emoji: '📦',
    accent: '#FF9600',
    accentBg: '#FFF4E0',
    accentBorder: '#D97F00',
    heroTitle: 'Turn notes into a study pack',
    heroSub: 'Flashcards, quizzes, and summaries from any notes in 60 seconds.',
    heroCta: 'Build a pack',
    ctaPage: 'study-pack',
  },
  {
    id: 'citations',
    label: 'Citations',
    emoji: '📚',
    accent: '#1CB0F6',
    accentBg: '#DDF4FF',
    accentBorder: '#1899D6',
    heroTitle: 'Find sources for your paper',
    heroSub: 'Type your topic. Get real, citable sources in APA, MLA, Chicago, and more.',
    heroCta: 'Find citations',
    ctaPage: 'citations',
  },
  {
    id: 'daily_review',
    label: 'Daily Review',
    emoji: '🎯',
    accent: '#58CC02',
    accentBg: '#E5F8D0',
    accentBorder: '#46A302',
    heroTitle: "Today's review is ready",
    heroSub: 'Quick practice from your saved notes — 10 questions, 5 minutes.',
    heroCta: 'Start today',
    ctaPage: 'dashboard', // stays on dashboard; tool switcher handles it
  },
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
  const t = TOOLS.find((x) => x.id === (kind === 'daily_review' ? 'daily_review' : kind));
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
  const subtitle = isNewUser
    ? "Let's start with your first essay."
    : streakDays > 0
      ? `Day ${streakDays} of your streak. Keep going.`
      : "Let's turn that B into an A.";

  /* Subtle entrance animation — staggered fade-up. Kept lightweight so the
     dashboard feels responsive on low-end Android. */
  const heroRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    el.classList.remove('opacity-0', 'translate-y-2');
    el.classList.add('opacity-100', 'translate-y-0');
  }, [dashboardTool]);

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col">
      <Header onNavigate={onNavigate} user={user as any} onLogout={onLogout} currentPage="dashboard" />

      <main className="flex-1 px-5 pt-4 pb-32 max-w-md mx-auto w-full">
        {/* ── Greeting block ──────────────────────────────────── */}
        <header className="mb-6">
          <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-stone-400 dark:text-stone-500 mb-1">
            {getGreeting()}
          </p>
          <h1 className="text-[28px] font-extrabold tracking-tight text-stone-900 dark:text-stone-50 leading-[1.15]">
            {getFirstName(user)} 👋
          </h1>
          <p className="mt-1.5 text-[15px] text-stone-600 dark:text-stone-400 font-medium leading-snug">
            {subtitle}
          </p>

          {streakDays > 0 && (
            <button
              type="button"
              onClick={() => setDashboardTool('daily_review')}
              className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFF4E0] dark:bg-[#FF9600]/15 border-2 border-[#FF9600]/40 hover:border-[#FF9600] transition-colors"
              aria-label={`${streakDays} day streak — open daily review`}
            >
              <span className="text-base" aria-hidden>🔥</span>
              <span className="text-[13px] font-extrabold text-[#FF9600] tabular-nums">
                {streakDays}
              </span>
              <span className="text-[12px] font-bold text-[#FF9600]">
                day streak
              </span>
            </button>
          )}
        </header>

        {/* ── HERO CARD — primary action ──────────────────────── */}
        <div
          ref={heroRef}
          className="relative mb-7 rounded-[28px] overflow-hidden border-2 border-b-4 transition-all duration-300 ease-out opacity-0 translate-y-2"
          style={{
            backgroundColor: activeTool.accentBg,
            borderColor: activeTool.accent,
          }}
        >
          {/* Top accent bar */}
          <div
            className="h-1.5 w-full"
            style={{ backgroundColor: activeTool.accent }}
            aria-hidden
          />

          {/* Decorative emoji watermark — large, in the corner */}
          <div
            className="absolute -bottom-4 -right-2 text-[140px] opacity-[0.08] pointer-events-none select-none"
            aria-hidden
          >
            {activeTool.emoji}
          </div>

          <div className="relative p-6 pb-7">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider mb-4"
              style={{
                backgroundColor: 'white',
                color: activeTool.accent,
                border: `2px solid ${activeTool.accent}`,
              }}
            >
              <span className="text-base" aria-hidden>{activeTool.emoji}</span>
              {activeTool.label}
            </div>

            <h2 className="text-[24px] font-extrabold tracking-tight text-stone-900 dark:text-stone-50 leading-[1.15] mb-2">
              {activeTool.heroTitle}
            </h2>
            <p className="text-[14px] text-stone-700 dark:text-stone-300 leading-relaxed mb-5 font-medium">
              {activeTool.heroSub}
            </p>

            <button
              type="button"
              onClick={() => {
                if (activeTool.id === 'daily_review') {
                  setDashboardTool('daily_review');
                } else {
                  onNavigate(activeTool.ctaPage);
                }
              }}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-extrabold text-white text-[16px] border-2 border-b-4 transition-transform active:translate-y-0.5 active:border-b-2"
              style={{
                backgroundColor: activeTool.accent,
                borderColor: activeTool.accentBorder,
              }}
            >
              {activeTool.heroCta}
              <span className="text-base" aria-hidden>→</span>
            </button>
          </div>
        </div>

        {/* ── TOOL GRID — 2×2 ─────────────────────────────────── */}
        <section className="mb-7">
          <h3 className="text-[12px] font-extrabold uppercase tracking-[0.18em] text-stone-400 dark:text-stone-500 mb-3 pl-1">
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
                  className={`relative rounded-2xl border-2 border-b-4 px-4 py-5 text-left transition-all active:translate-y-0.5 active:border-b-2 ${
                    isActive ? 'bg-white dark:bg-stone-900 shadow-md' : 'bg-white dark:bg-stone-900'
                  }`}
                  style={{
                    borderColor: isActive ? tool.accent : '#E5E5E5',
                  }}
                >
                  {/* Active indicator dot */}
                  {isActive && (
                    <span
                      className="absolute top-3 right-3 w-2 h-2 rounded-full"
                      style={{ backgroundColor: tool.accent }}
                      aria-hidden
                    />
                  )}
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-[22px] mb-2.5"
                    style={{ backgroundColor: tool.accentBg }}
                    aria-hidden
                  >
                    {tool.emoji}
                  </div>
                  <div className="font-extrabold text-stone-900 dark:text-stone-50 text-[14px] leading-tight">
                    {tool.label}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── RECENT ACTIVITY — max 3 items ───────────────────── */}
        {recentItems.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center justify-between mb-3 pl-1">
              <h3 className="text-[12px] font-extrabold uppercase tracking-[0.18em] text-stone-400 dark:text-stone-500">
                Recent
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('library')}
                className="text-[12px] font-extrabold text-[#A560E8]"
              >
                View all →
              </button>
            </div>
            <div className="space-y-2.5">
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
                      className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-[18px]"
                      style={{ backgroundColor: meta.accentBg }}
                      aria-hidden
                    >
                      {meta.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-extrabold text-stone-900 dark:text-stone-50 text-[14px] truncate">
                        {item.title}
                      </div>
                      <div className="text-[12px] font-medium text-stone-500 dark:text-stone-400 mt-0.5">
                        {timeAgo(item.createdAt)}
                      </div>
                    </div>
                    <span className="flex-shrink-0 text-stone-400 text-lg" aria-hidden>→</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* ── EMPTY STATE — for new users ─────────────────────── */}
        {recentItems.length === 0 && !isNewUser && (
          <section className="mb-6 rounded-2xl border-2 border-dashed border-stone-300 dark:border-stone-700 p-5 text-center">
            <p className="text-[14px] font-bold text-stone-600 dark:text-stone-400">
              Nothing here yet. Try a tool above to get started.
            </p>
          </section>
        )}

        {/* ── EXTRA: Upgrade nudge for free users (subtle, single card) ── */}
        {user && (user.plan || user.subscription_plan || 'free').toLowerCase() === 'free' && (
          <section className="rounded-2xl bg-gradient-to-br from-[#A560E8] to-[#8A48C7] border-2 border-b-4 border-[#8A48C7] p-5 text-white">
            <div className="flex items-start gap-3 mb-4">
              <span className="text-2xl" aria-hidden>⭐</span>
              <div>
                <h3 className="font-extrabold text-[16px] mb-1">Try 7 days free</h3>
                <p className="text-[13px] opacity-90 leading-relaxed">
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
    </div>
  );
};

export default MobileDashboard;
