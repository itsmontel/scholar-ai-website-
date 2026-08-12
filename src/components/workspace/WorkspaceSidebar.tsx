import { useState, useEffect, type ReactNode } from 'react';
import { getTotalXP, getLevelInfo, getUnlockedCount, BADGES } from '../../data/achievements';
import type { WorkspaceView } from './types';
import { SIDEBAR_TOOLS, sidebarIcons as I } from './sidebarTools';

/** Best-effort display name from the loosely-typed user record. */
function displayNameOf(user: Record<string, unknown> | null | undefined): string {
  if (!user) return 'Your account';
  const name = typeof user.name === 'string' ? user.name.trim() : '';
  if (name && !name.includes('@')) return name;
  const first = typeof user.firstName === 'string' ? user.firstName.trim() : '';
  const last = typeof user.lastName === 'string' ? user.lastName.trim() : '';
  if (first) return [first, last].filter(Boolean).join(' ');
  const username = typeof user.username === 'string' ? user.username.trim() : '';
  if (username) return username;
  const email = typeof user.email === 'string' ? user.email : '';
  return email.split('@')[0] || 'Your account';
}

/** Plan row under the name — "⭐ Premium Plan" / "Free Plan". */
function planLabelOf(
  user: Record<string, unknown> | null | undefined,
  usage: { plan: string } | null | undefined,
): { label: string; paid: boolean } {
  const raw = String(
    (usage?.plan ?? user?.plan ?? user?.subscriptionPlan ?? 'free') as string,
  ).toLowerCase();
  const paid = raw === 'pro' || raw === 'premium' || raw === 'focus';
  const pretty = raw.charAt(0).toUpperCase() + raw.slice(1);
  return { label: `${pretty} Plan`, paid };
}

export function WorkspaceSidebar({
  activeView,
  onSelect,
  headerless = false,
  collapsed = false,
  onToggle,
  usage,
  onUpgrade,
  onNavigateBadges,
  onNavigateHome,
  user,
  onNavigateAccount,
}: {
  activeView: WorkspaceView;
  onSelect: (v: WorkspaceView) => void;
  /** When the global header is hidden (editor view) the rail pins to
   *  the viewport top and fills the full height instead of sitting
   *  below the header. */
  headerless?: boolean;
  /** Collapsed = slim icon-only rail (more width for the paper). */
  collapsed?: boolean;
  /** Toggle collapsed ⇄ expanded. When omitted the rail is static. */
  onToggle?: () => void;
  /** Plan/usage — drives the plan line on the account card and the
      Free-plan upgrade CTA above it. */
  usage?: { used: number; limit: number | null; plan: string } | null;
  onUpgrade?: () => void;
  /** Achievements page — opened from the XP card in the rail footer. */
  onNavigateBadges?: () => void;
  /** Logo / wordmark — return to the main dashboard. */
  onNavigateHome?: () => void;
  /** Logged-in user for the account card pinned to the rail footer. */
  user?: Record<string, unknown> | null;
  /** Account card click — opens the account page. */
  onNavigateAccount?: () => void;
}) {
  // The editor is a doc context — keep "My Documents" lit while in it.
  const docsActive = activeView === 'docs' || activeView === 'editor';

  // XP / level — read once from localStorage (achievements module).
  const [xpInfo] = useState(() => {
    const xp = getTotalXP();
    return { xp, level: getLevelInfo(xp), unlocked: getUnlockedCount() };
  });

  /** One nav row. Active = soft purple pill, purple glyph + label;
   *  idle = neutral grey glyph with a quiet hover wash. The rail is
   *  intentionally monochrome so the colour in the workspace comes
   *  from the tools themselves, not from navigation. */
  const Item = ({
    active,
    icon,
    label,
    onClick,
  }: { active: boolean; icon: ReactNode; label: string; onClick: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      title={collapsed ? label : undefined}
      className={`group relative w-full flex items-center rounded-xl text-left transition-colors ${
        collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5'
      } ${
        active
          ? 'bg-[#F3EAFF] dark:bg-[#A560E8]/15 text-[#8A48C7] dark:text-[#C9A0F0]'
          : 'text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/70'
      }`}
    >
      <span
        className={`shrink-0 flex items-center justify-center transition-colors ${
          active ? 'text-[#A560E8] dark:text-[#C9A0F0]' : 'text-stone-400 dark:text-stone-500 group-hover:text-stone-500 dark:group-hover:text-stone-400'
        }`}
        aria-hidden
      >
        {icon}
      </span>
      {!collapsed && (
        <span className={`min-w-0 flex-1 truncate text-[14.5px] leading-tight ${active ? 'font-extrabold' : 'font-bold'}`}>
          {label}
        </span>
      )}
    </button>
  );

  const SectionLabel = ({ children }: { children: ReactNode }) =>
    collapsed ? (
      <div className="h-px w-8 bg-stone-200/80 dark:bg-stone-700/60 my-3" aria-hidden />
    ) : (
      <p className="px-3 pt-6 pb-2 text-[10.5px] font-extrabold uppercase tracking-[0.16em] text-stone-400 dark:text-stone-500">
        {children}
      </p>
    );

  const account = planLabelOf(user, usage);
  const accountName = displayNameOf(user);
  const accountInitial = (accountName.trim()[0] || 'A').toUpperCase();

  return (
    <aside
      className={`hidden lg:flex lg:flex-col shrink-0 self-stretch sticky overflow-y-auto border-r border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-900 pt-4 pb-4 transition-[width] duration-200 ${
        collapsed ? 'w-[76px] px-3 items-center' : 'w-[264px] px-4'
      } ${headerless ? 'top-0 h-dvh' : 'top-[3.5rem] sm:top-[4.25rem] h-[calc(100dvh-3.5rem)] sm:h-[calc(100dvh-4.25rem)]'}`}
    >
      {/* ─── Brand header — logo tile + wordmark, and the collapse
          toggle. Clicking either returns to the dashboard home. */}
      <div className={`shrink-0 ${collapsed ? 'flex flex-col items-center gap-2 pb-2' : 'flex items-center gap-2.5 px-1 pb-2'}`}>
        <button
          type="button"
          onClick={() => (onNavigateHome ? onNavigateHome() : onSelect('hub'))}
          title="Back to dashboard"
          aria-label="Back to dashboard"
          className={`group flex items-center min-w-0 rounded-xl transition-colors hover:bg-[#F3EAFF]/70 dark:hover:bg-[#A560E8]/10 ${
            collapsed ? 'justify-center p-1' : 'gap-2.5 flex-1 px-1 py-1 -ml-1'
          }`}
        >
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl overflow-hidden bg-[#F3EAFF] dark:bg-[#A560E8]/15">
            <img src="/main-logo.png" alt="" aria-hidden className="h-full w-full object-contain" />
          </span>
          {!collapsed && (
            <span
              className="text-[19px] font-extrabold tracking-tight text-[#7733B5] dark:text-[#C9A0F0] truncate"
              style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
            >
              WriteScholar
            </span>
          )}
        </button>
        {onToggle && !collapsed && (
          <button
            type="button"
            onClick={onToggle}
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
            className="ml-auto inline-flex items-center justify-center h-7 w-7 rounded-lg text-stone-300 dark:text-stone-600 hover:text-[#8A48C7] hover:bg-[#F3EAFF] dark:hover:bg-[#A560E8]/15 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.25} viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 5l-7 7 7 7" />
            </svg>
          </button>
        )}
        {onToggle && collapsed && (
          <button
            type="button"
            onClick={onToggle}
            title="Expand sidebar"
            aria-label="Expand sidebar"
            className="inline-flex items-center justify-center h-7 w-7 rounded-lg text-stone-300 dark:text-stone-600 hover:text-[#8A48C7] hover:bg-[#F3EAFF] dark:hover:bg-[#A560E8]/15 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.25} viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Dashboard — the home base, always first and on its own. */}
      <div className="mt-2 w-full">
        <Item active={activeView === 'hub'} icon={<I.Home />} label="Dashboard" onClick={() => onSelect('hub')} />
      </div>

      <SectionLabel>Study tools</SectionLabel>
      <div className="flex flex-col gap-0.5 w-full">
        {SIDEBAR_TOOLS.map((t) => (
          <Item key={t.view} active={activeView === t.view} icon={t.icon} label={t.label} onClick={() => onSelect(t.view)} />
        ))}
      </div>

      <SectionLabel>Library</SectionLabel>
      <div className="w-full">
        <Item active={docsActive} icon={<I.Doc />} label="My Documents" onClick={() => onSelect('docs')} />
      </div>

      {/* ─── Rail footer — XP · upgrade · account. One stack pinned
          to the bottom so the three cards never fight over margins. */}
      <div className={`mt-auto w-full pt-4 ${collapsed ? 'flex flex-col items-center gap-2' : 'space-y-3'}`}>

        {/* XP + badges — level, progress to the next level, and how
            many badges are unlocked. Opens the achievements page. */}
        {onNavigateBadges && (
          collapsed ? (
            <button
              type="button"
              onClick={onNavigateBadges}
              title={`Level ${xpInfo.level.level} · ${xpInfo.xp} XP · ${xpInfo.unlocked} badges`}
              aria-label={`Level ${xpInfo.level.level}, ${xpInfo.xp} XP, ${xpInfo.unlocked} badges`}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200/90 dark:border-stone-700 bg-white dark:bg-stone-900 text-[#8A48C7] dark:text-[#C9A0F0] text-[12px] font-extrabold hover:border-[#A560E8]/40 hover:bg-[#FBF8FF] dark:hover:bg-stone-800 transition-colors"
            >
              {xpInfo.level.level}
              {xpInfo.unlocked > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#A560E8] text-white text-[8px] font-extrabold leading-none">
                  {xpInfo.unlocked > 9 ? '9+' : xpInfo.unlocked}
                </span>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={onNavigateBadges}
              className="group w-full text-left rounded-xl border border-stone-200/90 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2.5 hover:border-[#A560E8]/40 hover:bg-[#FBF8FF] dark:hover:bg-stone-800 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="relative shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-[#F3EAFF] dark:bg-[#A560E8]/15 text-[#8A48C7] dark:text-[#C9A0F0] text-[12px] font-extrabold">
                  {xpInfo.level.level}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-[12.5px] font-extrabold leading-tight text-stone-800 dark:text-stone-100 truncate">
                      {xpInfo.level.name}
                    </span>
                    <span className="text-[10.5px] font-bold text-stone-400 dark:text-stone-500 tabular-nums shrink-0">
                      {xpInfo.unlocked}/{BADGES.length}
                    </span>
                  </span>
                  <div className="mt-1.5 h-1 w-full rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#A560E8]"
                      style={{ width: `${Math.max(Math.round(xpInfo.level.progress * 100), 4)}%` }}
                    />
                  </div>
                </span>
              </div>
            </button>
          )
        )}

        {/* ─── Free-plan upgrade CTA ────────────────────────────
            Only shown while there's something to upgrade to — paid
            plans go straight to the account card below. */}
        {usage && usage.plan === 'Free' && onUpgrade && (
          collapsed ? (
            <button
              type="button"
              onClick={onUpgrade}
              title="Upgrade to Pro"
              aria-label="Upgrade to Pro"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#A560E8] text-white hover:bg-[#9450D8] transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path d="M12 2l1.6 4.9L18 9l-4.4 2.1L12 16l-1.6-4.9L6 9l4.4-2.1z" />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              onClick={onUpgrade}
              className="w-full text-left rounded-xl bg-[#A560E8] hover:bg-[#9450D8] text-white px-3 py-2.5 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-extrabold leading-tight">Upgrade to Pro</span>
                  <span className="block text-[11px] font-bold text-white/85 leading-tight mt-0.5">
                    {usage.limit != null ? `${usage.used}/${usage.limit} used` : 'Unlimited everything'}
                  </span>
                </span>
                <svg className="w-4 h-4 shrink-0 opacity-90" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          )
        )}

        {/* ─── Account card — who's signed in and which plan they're
            on; opens the account page. */}
        <button
          type="button"
          onClick={onNavigateAccount}
          title={collapsed ? `${accountName} · ${account.label}` : undefined}
          aria-label={`${accountName} — ${account.label}`}
          className={`w-full flex items-center rounded-2xl border border-stone-200/90 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-[0_1px_2px_rgba(60,40,90,0.05)] transition-colors hover:border-[#A560E8]/40 hover:bg-[#FBF8FF] dark:hover:bg-stone-800 ${
            collapsed ? 'justify-center p-2' : 'gap-2.5 px-3 py-2.5 text-left'
          }`}
        >
          <span
            className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full bg-[#A560E8] text-white text-[13px] font-extrabold"
            aria-hidden
          >
            {accountInitial}
          </span>
          {!collapsed && (
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-extrabold text-stone-800 dark:text-stone-100 leading-tight truncate">
                {accountName}
              </span>
              <span className="block text-[11px] font-bold text-stone-400 dark:text-stone-500 leading-tight mt-0.5 truncate">
                {account.label}
              </span>
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}

/* ─── Mobile workspace nav ───────────────────────────────────
   The desktop rail is `hidden lg:flex`, which left phone users with
   NO way to reach Analyze / Study Packs / Citations / Daily Review
   / Arcade Mode. This is a floating menu button (lg:hidden) + a
   slide-in drawer mirroring the rail, so the whole workspace is
   reachable on mobile too. */
export function WorkspaceMobileNav({
  activeView,
  onSelect,
  onNavigateHome,
  user,
  usage,
  onNavigateAccount,
}: {
  activeView: WorkspaceView;
  onSelect: (v: WorkspaceView) => void;
  /** Logo / wordmark — return to the main dashboard. */
  onNavigateHome?: () => void;
  user?: Record<string, unknown> | null;
  usage?: { used: number; limit: number | null; plan: string } | null;
  onNavigateAccount?: () => void;
}) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);
  const docsActive = activeView === 'docs' || activeView === 'editor';
  const pick = (v: WorkspaceView) => { setOpen(false); onSelect(v); };
  const account = planLabelOf(user, usage);
  const accountName = displayNameOf(user);
  const accountInitial = (accountName.trim()[0] || 'A').toUpperCase();

  const Row = ({
    active,
    icon,
    label,
    onClick,
  }: {
    active: boolean;
    icon: ReactNode;
    label: string;
    onClick: () => void;
  }) => (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors ${
        active
          ? 'bg-[#F3EAFF] dark:bg-[#A560E8]/15 text-[#8A48C7] dark:text-[#C9A0F0]'
          : 'text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/70'
      }`}
    >
      <span className={active ? 'text-[#A560E8] dark:text-[#C9A0F0]' : 'text-stone-400 dark:text-stone-500'} aria-hidden>
        {icon}
      </span>
      <span className={`min-w-0 flex-1 truncate text-[15px] leading-tight ${active ? 'font-extrabold' : 'font-bold'}`}>{label}</span>
    </button>
  );

  return (
    <div className="lg:hidden">
      {/* Floating menu button — bottom-left, thumb-reachable, never
          collides with the editor toolbar (which sits up top). */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open workspace menu"
          className="fixed bottom-4 left-4 z-[55] inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-[#A560E8] text-white shadow-[0_14px_30px_-10px_rgba(165,96,232,0.6)] active:translate-y-0.5 transition-transform"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}
      {open && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute inset-y-0 left-0 w-[82vw] max-w-[310px] bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 shadow-2xl flex flex-col p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={() => { setOpen(false); (onNavigateHome ? onNavigateHome() : onSelect('hub')); }}
                title="Back to dashboard"
                aria-label="Back to dashboard"
                className="flex items-center gap-2.5 min-w-0 rounded-xl px-1 py-1 -ml-1 hover:bg-[#F3EAFF]/70 dark:hover:bg-[#A560E8]/10 transition-colors"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl overflow-hidden bg-[#F3EAFF] dark:bg-[#A560E8]/15">
                  <img src="/main-logo.png" alt="" aria-hidden className="w-full h-full object-contain" />
                </span>
                <span className="text-[17px] font-extrabold tracking-tight text-[#7733B5] dark:text-[#C9A0F0]" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>WriteScholar</span>
              </button>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.25} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <Row active={activeView === 'hub'} icon={<I.Home />} label="Dashboard" onClick={() => pick('hub')} />

            <p className="px-3 pt-5 pb-2 text-[10.5px] font-extrabold uppercase tracking-[0.16em] text-stone-400">Study tools</p>
            <div className="flex flex-col gap-0.5">
              {SIDEBAR_TOOLS.map((t) => (
                <Row key={t.view} active={activeView === t.view} icon={t.icon} label={t.label} onClick={() => pick(t.view)} />
              ))}
            </div>

            <p className="px-3 pt-5 pb-2 text-[10.5px] font-extrabold uppercase tracking-[0.16em] text-stone-400">Library</p>
            <Row active={docsActive} icon={<I.Doc />} label="My Documents" onClick={() => pick('docs')} />

            <button
              type="button"
              onClick={() => { setOpen(false); onNavigateAccount?.(); }}
              className="mt-auto w-full flex items-center gap-2.5 rounded-2xl border border-stone-200/90 dark:border-stone-700 px-3 py-2.5 text-left hover:border-[#A560E8]/40 hover:bg-[#FBF8FF] dark:hover:bg-stone-800 transition-colors"
            >
              <span className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full bg-[#A560E8] text-white text-[13px] font-extrabold" aria-hidden>
                {accountInitial}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-extrabold text-stone-800 dark:text-stone-100 leading-tight truncate">{accountName}</span>
                <span className="block text-[11px] font-bold text-stone-400 dark:text-stone-500 leading-tight mt-0.5 truncate">
                  {account.paid && <span aria-hidden className="mr-1">⭐</span>}{account.label}
                </span>
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
