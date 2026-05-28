import type { WorkspaceView } from './types';

const PENDING_VIEW_KEY = 'writescholar_ws_pending_view';

/** Custom event name fired when we want an already-mounted DocumentsPage
 *  to switch to a specific view without remounting. */
export const WS_SWITCH_VIEW_EVENT = 'writescholar:switchWorkspaceView';

/** When leaving the documents workspace for a settings page, the sidebar
 *  still needs to deep-link back into a tool view. Stash the target view
 *  in sessionStorage and read it on the next dashboard mount. */
export function stashWorkspaceView(view: WorkspaceView) {
  try {
    sessionStorage.setItem(PENDING_VIEW_KEY, view);
  } catch {
    /* ignore */
  }
}

export function consumePendingWorkspaceView(): WorkspaceView | null {
  try {
    const raw = sessionStorage.getItem(PENDING_VIEW_KEY);
    sessionStorage.removeItem(PENDING_VIEW_KEY);
    if (!raw) return null;
    const allowed: WorkspaceView[] = ['hub', 'editor', 'analyze', 'daily-review', 'study-packs', 'citations', 'games'];
    return allowed.includes(raw as WorkspaceView) ? (raw as WorkspaceView) : null;
  } catch {
    return null;
  }
}

export function navigateWorkspaceView(
  onNavigate: (page: string, slug?: string, options?: unknown) => void,
  view: WorkspaceView,
) {
  if (view === 'hub' || view === 'editor') {
    onNavigate('dashboard');
    return;
  }

  // Fire a direct event so an already-mounted DocumentsPage switches
  // immediately without needing to unmount/remount. The sessionStorage
  // stash is kept as a fallback for cold navigation (e.g. clicking the
  // sidebar while on a non-dashboard page).
  try {
    window.dispatchEvent(new CustomEvent(WS_SWITCH_VIEW_EVENT, { detail: view }));
  } catch {
    /* ignore */
  }

  stashWorkspaceView(view);
  onNavigate('dashboard');
}
