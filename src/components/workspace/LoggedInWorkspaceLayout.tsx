import { useCallback, useEffect, useState, type ReactNode } from 'react';
import DashboardTopBar from '../common/DashboardTopBar';
import { WorkspaceShell } from './WorkspaceShell';
import { navigateWorkspaceView } from './workspaceNavigate';
import { WorkspaceChromeContext } from './workspaceChrome';
import type { WorkspaceView } from './types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface LoggedInWorkspaceLayoutProps {
  user: Record<string, unknown> | null | undefined;
  onNavigate: (page: string, slug?: string, options?: unknown) => void;
  onLogout?: () => void;
  children: ReactNode;
  /** Extra classes on the inner content wrapper (e.g. drop editorial bg padding). */
  contentClassName?: string;
  /** Dashboard gets the full bar; other pages get Upgrade + username menu only. */
  topBarVariant?: 'dashboard' | 'compact';
  activeView?: WorkspaceView;
}

function readCachedUserRecord(): Record<string, unknown> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Shared chrome for logged-in pages outside the documents workspace:
 *  left workspace rail + floating DashboardTopBar (Saved Materials,
 *  streak, Upgrade, Pomodoro, avatar menu) — matches /dashboard. */
export default function LoggedInWorkspaceLayout({
  user,
  onNavigate,
  onLogout,
  children,
  contentClassName,
  topBarVariant = 'compact',
  activeView = 'hub',
}: LoggedInWorkspaceLayoutProps) {
  const effectiveUser = user ?? readCachedUserRecord();
  const [railCollapsed, setRailCollapsed] = useState(false);
  const [usage, setUsage] = useState<{ used: number; limit: number | null; plan: string } | null>(null);

  useEffect(() => {
    if (!effectiveUser) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/documents?limit=1&sortBy=updated_at&sortOrder=desc`, {
          headers: authHeaders(),
        });
        if (!res.ok) return;
        const json = await res.json();
        if (cancelled) return;
        const u = json?.data?.usage?.documents;
        if (u && typeof u.used === 'number') {
          setUsage({
            used: u.used,
            limit: typeof u.limit === 'number' ? u.limit : null,
            plan: String(u.plan ?? 'Free'),
          });
        }
      } catch {
        /* sidebar footer stays empty */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [effectiveUser]);

  const plan = String((effectiveUser?.plan ?? effectiveUser?.subscriptionPlan ?? 'free') as string).toLowerCase();

  const handleRailSelect = useCallback(
    (view: Parameters<typeof navigateWorkspaceView>[1]) => {
      navigateWorkspaceView(onNavigate, view);
    },
    [onNavigate],
  );

  const topBar = (
    <DashboardTopBar
      user={effectiveUser}
      plan={plan}
      onNavigate={onNavigate}
      onLogout={onLogout}
      variant={topBarVariant}
    />
  );

  return (
    <WorkspaceChromeContext.Provider value={true}>
      <div className="min-h-screen bg-[#FAF7FF] dark:bg-stone-950">
        <WorkspaceShell
          activeView={activeView}
          onSelect={handleRailSelect}
          headerless
          collapsed={railCollapsed}
          onToggle={() => setRailCollapsed((v) => !v)}
          usage={usage}
          onUpgrade={() => onNavigate('pricing')}
          onNavigateBadges={() => onNavigate('badges')}
          onNavigateHome={() => onNavigate('dashboard')}
          user={effectiveUser}
          onNavigateAccount={() => onNavigate('account')}
          onNavigateBlog={() => onNavigate('blog')}
          topBar={topBar}
        >
          <div className={contentClassName ?? 'relative z-10'}>{children}</div>
        </WorkspaceShell>
      </div>
    </WorkspaceChromeContext.Provider>
  );
}
