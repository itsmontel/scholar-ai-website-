import { createContext, useContext } from 'react';
import { getPageFromPath } from '../../utils/appRouting';

/** Pages that render their own workspace shell (Documents dashboard). */
export const WORKSPACE_DOCUMENTS_PAGES = new Set([
  'dashboard',
  'documents',
  'library',
  'upload',
  'write',
  'study-tools',
]);

/** Auth / embed / onboarding — never wrap. */
const WORKSPACE_AUTH_EXCLUDED_PAGES = new Set([
  'embed',
  'signup',
  'login',
  'reset-password',
  'email-verification',
  'auth-callback',
  'onboarding',
  'onboarding-test',
  'unlock-quiz',
]);

/** Logged-out marketing home — no shared chrome (logged-in users redirect to dashboard). */
const WORKSPACE_PUBLIC_HOME_PAGES = new Set(['landing']);

/** Fullscreen immersive games — no sidebar even when logged in. */
export const WORKSPACE_FULLSCREEN_PAGES = new Set([
  'word-blitz',
  'word-tower',
  'crater-blast',
  'game-launcher-crater-blast',
  'game-launcher-word-tower',
]);

/** Combined denylist for quick lookup. */
export const WORKSPACE_CHROME_EXCLUDED_PAGES = new Set([
  ...Array.from(WORKSPACE_PUBLIC_HOME_PAGES),
  ...Array.from(WORKSPACE_AUTH_EXCLUDED_PAGES),
  ...Array.from(WORKSPACE_DOCUMENTS_PAGES),
]);

/** True when a session token exists (covers brief state desync after refresh). */
export function isSessionAuthenticated(isLoggedIn: boolean): boolean {
  if (isLoggedIn) return true;
  if (typeof window === 'undefined') return false;
  try {
    return !!localStorage.getItem('authToken');
  } catch {
    return false;
  }
}

function isWorkspaceChromeDenied(page: string): boolean {
  if (WORKSPACE_CHROME_EXCLUDED_PAGES.has(page)) return true;
  if (WORKSPACE_FULLSCREEN_PAGES.has(page)) return true;
  return false;
}

/** Whether a single route id should get the shared sidebar + compact top bar. */
export function shouldWrapWithWorkspaceChrome(currentPage: string, isLoggedIn: boolean): boolean {
  if (!isSessionAuthenticated(isLoggedIn)) return false;
  return !isWorkspaceChromeDenied(currentPage);
}

/** Collect route ids that might apply (SPA state + URL pathname). */
export function resolveWorkspaceRouteIds(currentPage: string): string[] {
  const ids = new Set<string>([currentPage]);
  if (typeof window !== 'undefined') {
    ids.add(getPageFromPath(window.location.pathname));
  }
  return [...ids];
}

/**
 * Default ON for every authenticated route except the small denylist above.
 * Covers all app pages: account/billing/badges, hubs, study tools, citations,
 * analysis, blog, marketing, SEO landers, admin, etc.
 */
export function shouldUseWorkspaceChromeApp(currentPage: string, isLoggedIn: boolean): boolean {
  if (!isSessionAuthenticated(isLoggedIn)) return false;
  return resolveWorkspaceRouteIds(currentPage).some((id) => !isWorkspaceChromeDenied(id));
}

/** Hide the legacy sticky Header (workspace chrome replaces it). */
export function shouldHideLegacyHeader(
  currentPage: string | undefined,
  isLoggedIn: boolean,
  inWorkspaceChrome: boolean,
): boolean {
  if (inWorkspaceChrome) return true;
  const page = currentPage ?? 'landing';
  if (!isSessionAuthenticated(isLoggedIn)) return false;
  if (WORKSPACE_DOCUMENTS_PAGES.has(page)) return true;
  return shouldUseWorkspaceChromeApp(page, true);
}

/** When true, the global sticky Header is suppressed (chrome comes from the workspace layout). */
export const WorkspaceChromeContext = createContext(false);

export function useWorkspaceChrome(): boolean {
  return useContext(WorkspaceChromeContext);
}
