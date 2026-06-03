import { useState, useEffect, type ReactNode } from 'react';
import { getTotalXP, getLevelInfo, getUnlockedCount, BADGES } from '../../data/achievements';
import type { WorkspaceView } from './types';
import { SIDEBAR_TOOLS, sidebarIcons as I } from './sidebarTools';

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
  /** Plan/usage for the footer CTA (pinned to the bottom of the rail).
      Replaces the old standalone right rail. */
  usage?: { used: number; limit: number | null; plan: string } | null;
  onUpgrade?: () => void;
  /** Navigate to the /badges page. */
  onNavigateBadges?: () => void;
  /** Logo / wordmark — return to the main dashboard. */
  onNavigateHome?: () => void;
}) {
  // The editor is a doc context — keep "Documents" lit while in it.
  const docsActive = activeView === 'hub' || activeView === 'editor';
  const colourful = true;

  // XP / level — read once from localStorage (achievements module).
  const [xpInfo] = useState(() => {
    const xp = getTotalXP();
    return { xp, level: getLevelInfo(xp), unlocked: getUnlockedCount() };
  });

  /** Render a tool row with optional per-tool tinting. When `tint`
   *  is omitted (Documents row), falls back to the brand purple.
   *
   *  Active state lifts the row with a chunky bottom-border (matches
   *  the Duolingo-flavoured dashboard tiles), tints the entire pill
   *  in the tool colour, and shows a vertical accent bar on the
   *  left edge — gives the rail real visual rhythm. */
  const Item = ({
    active,
    icon,
    label,
    hint,
    onClick,
    tint,
  }: { active: boolean; icon: ReactNode; label: string; hint?: string; onClick: () => void; tint?: typeof SIDEBAR_TOOLS[number] }) => {
    const accent = (tint && colourful) ? tint.tint : '#A560E8';
    const chipColoured = colourful;
    return (
      <button
        type="button"
        onClick={onClick}
        aria-current={active ? 'page' : undefined}
        title={collapsed ? label : undefined}
        className={`group relative w-full flex items-center rounded-2xl text-left transition-all ${
          active ? 'border-2 border-b-[4px]' : 'border-2 border-b-2'
        } ${
          collapsed ? 'justify-center px-0 py-2.5' : 'gap-2.5 px-2.5 py-2.5'
        } active:translate-y-px`}
        style={
          active
            ? { backgroundColor: `${accent}18`, borderColor: `${accent}55`, borderBottomColor: `${accent}88`, color: accent }
            : { borderColor: 'transparent' }
        }
        onMouseEnter={(e) => {
          if (!active) {
            e.currentTarget.style.backgroundColor = `${accent}10`;
            e.currentTarget.style.borderColor = `${accent}22`;
          }
        }}
        onMouseLeave={(e) => {
          if (!active) {
            e.currentTarget.style.backgroundColor = '';
            e.currentTarget.style.borderColor = 'transparent';
          }
        }}
      >
        {/* Left accent bar — only on active expanded rows. Acts like a
            tab indicator so the eye snaps to the current tool. */}
        {active && !collapsed && (
          <span
            className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full"
            style={{ backgroundColor: accent }}
            aria-hidden
          />
        )}

        {/* Coloured icon chip — fills with the brand colour when
            active for a stronger "selected" read; sits in a softer
            tinted background otherwise. */}
        <span
          className="shrink-0 flex h-9 w-9 items-center justify-center rounded-xl border-2 transition-all group-hover:scale-[1.06]"
          style={
            active && chipColoured
              ? { backgroundColor: accent, borderColor: accent, color: '#fff', boxShadow: `0 4px 12px -4px ${accent}80` }
              : chipColoured
                ? { backgroundColor: `${accent}1F`, borderColor: `${accent}45`, color: accent }
                : { backgroundColor: 'rgba(120,113,108,0.08)', borderColor: 'rgba(120,113,108,0.2)', color: active ? accent : '#78716c' }
          }
        >
          {icon}
        </span>
        {!collapsed && (
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-extrabold leading-tight" style={{ color: active ? accent : undefined }}>{label}</span>
            {hint && <span className="block text-[10px] font-bold text-stone-400 dark:text-stone-500 leading-tight mt-0.5 truncate">{hint}</span>}
          </span>
        )}
        {!collapsed && active && (
          <svg
            className="ml-auto w-3 h-3 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
            viewBox="0 0 24 24"
            aria-hidden
            style={{ color: accent }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        )}
      </button>
    );
  };
  return (
    <aside className={`hidden lg:flex lg:flex-col shrink-0 self-stretch sticky overflow-y-auto border-r-2 border-stone-200 dark:border-stone-800 bg-gradient-to-b from-white via-white to-stone-50/60 dark:from-stone-900 dark:via-stone-900 dark:to-stone-950/40 pt-3 pb-4 transition-[width] duration-200 ${collapsed ? 'w-[64px] px-2 items-center' : 'w-[224px] px-3'} ${headerless ? 'top-0 h-dvh' : 'top-[3.5rem] sm:top-[4.25rem] h-[calc(100dvh-3.5rem)] sm:h-[calc(100dvh-4.25rem)]'}`}>
      {/* ─── Brand header — anchors the rail with a recognisable
          mark, and houses the collapse toggle. Expanded layout pairs
          the logo with the wordmark + chevron button; collapsed
          stacks logo above a slim chevron so both stay reachable. */}
      <div className={`shrink-0 ${collapsed ? 'flex flex-col items-center gap-2 pb-3' : 'flex items-center gap-2 px-2 pb-3'}`}>
        <button
          type="button"
          onClick={() => (onNavigateHome ? onNavigateHome() : onSelect('hub'))}
          title="Back to dashboard"
          aria-label="Back to dashboard"
          className={`group flex items-center min-w-0 rounded-xl transition-all hover:bg-[#F3EAFF]/80 dark:hover:bg-[#A560E8]/10 ${
            collapsed ? 'justify-center p-1' : 'gap-2 flex-1 px-1 py-1 -ml-1'
          }`}
        >
          <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl overflow-hidden border-2 border-[#A560E8]/30 bg-white shadow-[0_4px_12px_-6px_rgba(165,96,232,0.55)] transition-transform group-hover:scale-[1.03]">
            <img src="/main-logo.png" alt="" aria-hidden className="h-full w-full object-contain" />
          </span>
          {!collapsed && (
            <span
              className="text-[15px] font-extrabold tracking-tight text-[#7733B5] dark:text-[#C9A0F0] truncate group-hover:text-[#8A48C7] dark:group-hover:text-[#D4B8F5]"
              style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
            >
              WriteScholar
            </span>
          )}
        </button>
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={`${collapsed ? '' : 'ml-auto'} inline-flex items-center justify-center h-7 w-7 rounded-lg border-2 border-stone-200 dark:border-stone-700 text-stone-400 dark:text-stone-500 hover:text-[#8A48C7] hover:border-[#A560E8]/40 hover:bg-[#F3EAFF] dark:hover:bg-[#A560E8]/15 transition-all`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d={collapsed ? 'M9 5l7 7-7 7' : 'M15 5l-7 7 7 7'} />
            </svg>
          </button>
        )}
      </div>

      {/* Soft divider between brand and nav — gradient line reads as
          decorative rather than a hard edge. */}
      <div className={`shrink-0 ${collapsed ? 'w-8' : 'mx-2'} h-px bg-gradient-to-r from-transparent via-stone-200 dark:via-stone-700 to-transparent mb-3`} aria-hidden />

      {!collapsed && (
        <p className="px-3 pb-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-stone-400 dark:text-stone-500 flex items-center gap-1.5">
          <span className="h-1 w-1 rounded-full bg-stone-300 dark:bg-stone-600" aria-hidden />
          Workspace
        </p>
      )}
      <Item active={docsActive} icon={<I.Doc />} label="Dashboard" hint="Home & your documents" onClick={() => onSelect('hub')} />
      {!collapsed && (
        <p className="px-3 pt-5 pb-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-stone-400 dark:text-stone-500 flex items-center gap-1.5">
          <span className="h-1 w-1 rounded-full bg-stone-300 dark:bg-stone-600" aria-hidden />
          Study tools
        </p>
      )}
      {collapsed && <div className="h-px w-8 bg-stone-200/70 dark:bg-stone-700/60 my-2" aria-hidden />}
      <div className={`flex flex-col gap-1 w-full`}>
        {SIDEBAR_TOOLS.map((t) => (
          <Item key={t.view} active={activeView === t.view} icon={t.icon} label={t.label} hint={t.hint} tint={t} onClick={() => onSelect(t.view)} />
        ))}
      </div>
      {/* ─── XP + Badges card ───────────────────────────────────
          Sits just above the plan/usage footer. In expanded mode it
          shows a mini level badge, XP bar, badge count, and a "View
          all badges" link. In collapsed mode it shows just the
          trophy emoji with the unlocked-count bubble so the info
          is never completely hidden. */}
      {onNavigateBadges && (
        collapsed ? (
          <button
            type="button"
            onClick={onNavigateBadges}
            title={`Level ${xpInfo.level.level} · ${xpInfo.xp} XP · ${xpInfo.unlocked} badges`}
            className="mt-auto mb-2 relative flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/20 border-2 border-b-[3px] border-amber-200/70 dark:border-amber-700/40 hover:border-amber-400 dark:hover:border-amber-500 hover:-translate-y-0.5 active:translate-y-px transition-all"
          >
            <span className="text-lg leading-none">🏆</span>
            {xpInfo.unlocked > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-violet-500 text-white text-[8px] font-extrabold leading-none border border-white dark:border-stone-900">
                {xpInfo.unlocked > 9 ? '9+' : xpInfo.unlocked}
              </span>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={onNavigateBadges}
            className="mt-auto mx-0 mb-0 w-full text-left relative overflow-hidden rounded-2xl border-2 border-b-[3px] border-amber-200/70 dark:border-amber-700/40 bg-gradient-to-br from-amber-50 via-yellow-50 to-white dark:from-amber-900/20 dark:via-stone-900 dark:to-stone-900 px-3 py-3 hover:border-amber-400 dark:hover:border-amber-500 hover:-translate-y-0.5 active:translate-y-px transition-all group"
          >
            {/* Soft amber halo behind the level badge */}
            <span
              className="pointer-events-none absolute -top-6 -left-6 w-20 h-20 rounded-full bg-amber-300/30 dark:bg-amber-500/20 blur-2xl"
              aria-hidden
            />
            <div className="relative flex items-center gap-2.5 mb-2">
              {/* Level badge */}
              <span className="relative shrink-0 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 dark:from-amber-400 dark:to-amber-600 text-white font-extrabold text-sm border-2 border-b-[3px] border-amber-500 dark:border-amber-700 shadow-[0_4px_12px_-4px_rgba(245,158,11,0.55)]">
                {xpInfo.level.level}
                {xpInfo.unlocked > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-violet-500 text-white text-[8px] font-extrabold leading-none border border-white dark:border-stone-900">
                    {xpInfo.unlocked > 9 ? '9+' : xpInfo.unlocked}
                  </span>
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-extrabold leading-tight text-stone-800 dark:text-stone-100 truncate">
                  {xpInfo.level.name}
                </p>
                <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 tabular-nums leading-tight mt-0.5">
                  {xpInfo.xp.toLocaleString()} XP
                </p>
              </div>
              <span className="text-lg shrink-0 group-hover:scale-110 group-hover:-rotate-6 transition-transform">🏆</span>
            </div>
            {/* XP progress bar */}
            <div className="relative h-2 w-full rounded-full bg-amber-100/80 dark:bg-amber-900/30 overflow-hidden mb-1.5 border border-amber-200/60 dark:border-amber-700/40">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 shadow-[inset_0_-2px_0_rgba(0,0,0,0.08)]"
                style={{ width: `${Math.max(Math.round(xpInfo.level.progress * 100), 4)}%` }}
              />
            </div>
            <div className="relative flex items-center justify-between">
              <p className="text-[9.5px] font-bold text-stone-400 dark:text-stone-500">
                {xpInfo.unlocked}/{BADGES.length} badges
              </p>
              <p className="text-[9.5px] font-bold text-amber-600 dark:text-amber-400 group-hover:underline">
                View all →
              </p>
            </div>
          </button>
        )
      )}

      {/* ─── Plan / upgrade footer ──────────────────────────────
          On Free, this collapses into a vivid purple gradient card
          (matches the Upgrade pill in the top bar) so the call to
          action reads at a glance. On a paid plan it shrinks to a
          quiet usage chip. */}
      {!collapsed && usage && (
        <div className={onNavigateBadges ? 'mt-3' : 'mt-auto'}>
          {usage.plan === 'Free' && onUpgrade ? (
            <button
              type="button"
              onClick={onUpgrade}
              className="group relative w-full text-left overflow-hidden rounded-2xl border-2 border-b-[4px] border-[#7733B5] bg-gradient-to-br from-[#B57AF0] via-[#A560E8] to-[#8A48C7] text-white px-3 py-3 hover:-translate-y-0.5 active:translate-y-px active:border-b-2 transition-all shadow-[0_8px_22px_-12px_rgba(165,96,232,0.6)]"
            >
              {/* Decorative sparkle halo */}
              <span
                className="pointer-events-none absolute -top-8 -right-6 w-20 h-20 rounded-full bg-white/20 blur-2xl"
                aria-hidden
              />
              <div className="relative flex items-center gap-2.5 mb-2">
                <span className="shrink-0 flex h-8 w-8 items-center justify-center rounded-xl bg-white/22 border border-white/35 backdrop-blur-sm text-white">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path d="M12 2l1.6 4.9L18 9l-4.4 2.1L12 16l-1.6-4.9L6 9l4.4-2.1z" />
                  </svg>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-extrabold leading-tight">Upgrade to Pro</p>
                  <p className="text-[10px] font-bold text-white/85 leading-tight mt-0.5">Unlimited everything</p>
                </div>
              </div>
              {usage.limit != null && (
                <div className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9.5px] font-extrabold uppercase tracking-[0.16em] text-white/85">Free plan</span>
                    <span className="text-[10px] font-extrabold tabular-nums text-white">{usage.used}/{usage.limit}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/20 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-white"
                      style={{ width: `${Math.min(100, Math.round((usage.used / Math.max(1, usage.limit)) * 100))}%` }}
                    />
                  </div>
                </div>
              )}
            </button>
          ) : (
            <div className="rounded-2xl border-2 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2.5">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">{usage.plan}</span>
                {usage.limit != null && (
                  <span className="text-[11px] font-extrabold tabular-nums text-stone-500 dark:text-stone-400">{usage.used}/{usage.limit}</span>
                )}
              </div>
              {usage.limit != null ? (
                <div className="h-1.5 w-full rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500"
                    style={{ width: `${Math.min(100, Math.round((usage.used / Math.max(1, usage.limit)) * 100))}%` }}
                  />
                </div>
              ) : (
                <p className="text-[11px] font-bold text-stone-400 leading-snug">Thanks for being on a paid plan.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Collapsed-mode upgrade pip — keep the CTA reachable when
          the rail is narrow. Matches the collapsed XP button styling. */}
      {collapsed && usage && usage.plan === 'Free' && onUpgrade && (
        <button
          type="button"
          onClick={onUpgrade}
          title="Upgrade to Pro"
          aria-label="Upgrade to Pro"
          className={`${onNavigateBadges ? 'mt-1' : 'mt-auto'} mb-1 relative flex h-10 w-10 items-center justify-center rounded-xl border-2 border-b-[3px] border-[#7733B5] bg-gradient-to-br from-[#B57AF0] via-[#A560E8] to-[#8A48C7] text-white hover:-translate-y-0.5 active:translate-y-px transition-all shadow-[0_4px_12px_-4px_rgba(165,96,232,0.6)]`}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path d="M12 2l1.6 4.9L18 9l-4.4 2.1L12 16l-1.6-4.9L6 9l4.4-2.1z" />
          </svg>
        </button>
      )}
    </aside>
  );
}

/* ─── Mobile workspace nav ───────────────────────────────────
   The desktop rail is `hidden lg:flex`, which left phone users with
   NO way to reach Analyze / Daily review / Study packs / Citations
   / Games. This is a floating menu button (lg:hidden) + slide-in
   drawer so the whole workspace is reachable on mobile too. Fixed
   positioning keeps it independent of the editor/hub layout. */
export function WorkspaceMobileNav({
  activeView,
  onSelect,
  onNavigateHome,
}: {
  activeView: WorkspaceView;
  onSelect: (v: WorkspaceView) => void;
  /** Logo / wordmark — return to the main dashboard. */
  onNavigateHome?: () => void;
}) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);
  const docsActive = activeView === 'hub' || activeView === 'editor';
  const pick = (v: WorkspaceView) => { setOpen(false); onSelect(v); };
  const colourful = true;
  const Row = ({
    active,
    icon,
    label,
    hint,
    onClick,
    tint,
  }: {
    active: boolean;
    icon: ReactNode;
    label: string;
    hint: string;
    onClick: () => void;
    tint?: typeof SIDEBAR_TOOLS[number];
  }) => {
    const accent = (tint && colourful) ? tint.tint : '#A560E8';
    const chipColoured = colourful;
    return (
      <button
        type="button"
        onClick={onClick}
        aria-current={active ? 'page' : undefined}
        className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-2xl text-left transition-all border-2 border-b-[3px]"
        style={
          active
            ? { backgroundColor: `${accent}1A`, borderColor: `${accent}66`, color: accent }
            : { borderColor: 'transparent' }
        }
      >
        <span
          className="shrink-0 flex h-10 w-10 items-center justify-center rounded-xl border-2"
          style={
            chipColoured
              ? { backgroundColor: `${accent}1F`, borderColor: `${accent}45`, color: accent }
              : { backgroundColor: 'rgba(120,113,108,0.08)', borderColor: 'rgba(120,113,108,0.2)', color: active ? accent : '#78716c' }
          }
        >
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-extrabold leading-tight" style={{ color: active ? accent : undefined }}>{label}</span>
          <span className="block text-[11px] font-bold text-stone-400 dark:text-stone-500 leading-tight mt-0.5 truncate">{hint}</span>
        </span>
        {active && <span className="ml-auto h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: accent }} aria-hidden />}
      </button>
    );
  };
  return (
    <div className="lg:hidden">
      {/* Floating menu button — bottom-left, thumb-reachable, never
          collides with the editor toolbar (which sits up top). */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open workspace menu"
          className="fixed bottom-4 left-4 z-[55] inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-[#A560E8] text-white border-2 border-b-4 border-[#7733B5] shadow-[0_14px_30px_-10px_rgba(165,96,232,0.6)] active:border-b-2 active:translate-y-0.5 transition-all"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}
      {open && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute inset-y-0 left-0 w-[80vw] max-w-[300px] bg-white dark:bg-stone-900 border-r-2 border-stone-200 dark:border-stone-800 shadow-2xl flex flex-col p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => { setOpen(false); (onNavigateHome ? onNavigateHome() : onSelect('hub')); }}
                title="Back to dashboard"
                aria-label="Back to dashboard"
                className="flex items-center gap-2 min-w-0 rounded-xl px-1 py-1 -ml-1 hover:bg-[#F3EAFF]/80 dark:hover:bg-[#A560E8]/10 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg overflow-hidden border border-stone-200/80 dark:border-stone-700 bg-white shrink-0">
                  <img src="/main-logo.png" alt="" aria-hidden className="w-full h-full object-contain" />
                </div>
                <span className="text-base font-extrabold tracking-tight text-[#A560E8]" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>WriteScholar</span>
              </button>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <p className="px-1 pb-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-stone-400">Workspace</p>
            <Row active={docsActive} icon={<I.Doc />} label="Dashboard" hint="Home & your documents" onClick={() => pick('hub')} />
            <p className="px-1 pt-4 pb-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-stone-400">Study tools</p>
            <div className="flex flex-col gap-1">
              {SIDEBAR_TOOLS.map((t) => (
                <Row key={t.view} active={activeView === t.view} icon={t.icon} label={t.label} hint={t.hint} tint={t} onClick={() => pick(t.view)} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
