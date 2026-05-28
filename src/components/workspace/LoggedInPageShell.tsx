/**
 * LoggedInPageShell — universal page shell used by every non-dashboard page.
 *
 * Behaviour depends on context:
 *  • Inside WorkspaceChromeContext (logged-in, app-level wrapper active)
 *    → renders children directly; sidebar + top bar come from the parent.
 *  • Outside WorkspaceChromeContext (logged-out visitor, or auth/embed routes)
 *    → renders the public Header above children so the page still has navigation.
 */
import type { ReactNode } from 'react';
import Header from '../common/Header';
import { useWorkspaceChrome } from './workspaceChrome';

interface LoggedInPageShellProps {
  children: ReactNode;
  user?: Record<string, unknown> | null;
  onNavigate?: (page: string, slug?: string) => void;
  onLogout?: () => void;
  currentPage?: string;
  className?: string;
  /** Optional extra props forwarded to Header in the logged-out (public) fallback. */
  headerProps?: {
    sticky?: boolean;
    opaqueHeader?: boolean;
    libraryActivationHighlight?: boolean;
    blockNavigationInteractions?: boolean;
  };
}

export default function LoggedInPageShell({
  children,
  user,
  onNavigate,
  onLogout,
  currentPage,
  className,
  headerProps,
}: LoggedInPageShellProps) {
  const inWorkspaceChrome = useWorkspaceChrome();

  if (inWorkspaceChrome) {
    // App-level LoggedInWorkspaceLayout already supplies sidebar + top bar.
    // Just render children, optionally inside a className wrapper.
    if (className) {
      return <div className={className}>{children}</div>;
    }
    return <>{children}</>;
  }

  // Fallback: no workspace chrome active (logged-out visitor or public route).
  // Render the public sticky Header so the page isn't completely unstyled.
  return (
    <div className={className ?? 'relative min-h-screen overflow-x-clip'}>
      <Header
        onNavigate={onNavigate}
        user={user as Parameters<typeof Header>[0]['user']}
        onLogout={onLogout}
        currentPage={currentPage}
        sticky={headerProps?.sticky ?? true}
        opaqueHeader={headerProps?.opaqueHeader}
        libraryActivationHighlight={headerProps?.libraryActivationHighlight}
        blockNavigationInteractions={headerProps?.blockNavigationInteractions}
      />
      {children}
    </div>
  );
}
