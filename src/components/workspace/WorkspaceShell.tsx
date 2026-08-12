import type { ReactNode } from 'react';
import type { WorkspaceView } from './types';
import { WorkspaceSidebar, WorkspaceMobileNav } from './WorkspaceSidebar';

export function WorkspaceShell({
  activeView,
  onSelect,
  children,
  bare = false,
  headerless = false,
  collapsed = false,
  onToggle,
  usage,
  onUpgrade,
  onNavigateBadges,
  onNavigateHome,
  user,
  onNavigateAccount,
  topBar,
}: {
  activeView: WorkspaceView;
  onSelect: (v: WorkspaceView) => void;
  children: ReactNode;
  /** Editor view manages its own width/padding — skip the content
      wrapper so it can run edge-to-edge next to the rail. */
  bare?: boolean;
  /** Editor view hides the global header — pin the rail to the
      viewport top and give it the full height. */
  headerless?: boolean;
  /** Slim icon-only rail (defaults expanded). */
  collapsed?: boolean;
  /** Toggle the rail collapsed ⇄ expanded. */
  onToggle?: () => void;
  /** Plan/usage for the sidebar footer (plan line + upgrade CTA). */
  usage?: { used: number; limit: number | null; plan: string } | null;
  onUpgrade?: () => void;
  /** Achievements page — opened from the rail's XP card. */
  onNavigateBadges?: () => void;
  /** Logo / wordmark — return to the main dashboard. */
  onNavigateHome?: () => void;
  /** Logged-in user for the rail's account card. */
  user?: Record<string, unknown> | null;
  /** Account card click — opens the account page. */
  onNavigateAccount?: () => void;
  /** Optional slim top-right toolbar (Saved Materials / Pomodoro /
      Avatar). Floats over the content area; replaces the global
      site Header when present. */
  topBar?: ReactNode;
}) {
  return (
    <div className="flex w-full min-h-screen items-stretch">
      <WorkspaceSidebar
        activeView={activeView}
        onSelect={onSelect}
        headerless={headerless}
        collapsed={collapsed}
        onToggle={onToggle}
        usage={usage}
        onUpgrade={onUpgrade}
        onNavigateBadges={onNavigateBadges}
        onNavigateHome={onNavigateHome}
        user={user}
        onNavigateAccount={onNavigateAccount}
      />
      <WorkspaceMobileNav
        activeView={activeView}
        onSelect={onSelect}
        onNavigateHome={onNavigateHome}
        user={user}
        usage={usage}
        onNavigateAccount={onNavigateAccount}
      />
      <div className="relative flex-1 min-w-0">
        {topBar && (
          <div className="pointer-events-none absolute top-3 right-3 sm:top-4 sm:right-4 lg:top-5 lg:right-5 z-50">
            <div className="pointer-events-auto">{topBar}</div>
          </div>
        )}
        {bare ? (
          children
        ) : (
          <div className={`px-4 sm:px-7 lg:px-10 ${topBar ? 'pt-16 sm:pt-20 lg:pt-4 pb-6 sm:pb-9' : 'py-6 sm:py-9'}`}>
            <div className="max-w-[1500px]">{children}</div>
          </div>
        )}
      </div>
    </div>
  );
}
