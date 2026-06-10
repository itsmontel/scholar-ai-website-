import type { WorkspaceView } from '../components/workspace/types';

/**
 * Onboarding "what excites you most?" survey picks, persisted locally so
 * the dashboard can personalize the first-run experience. The same
 * answers also POST to /users/onboarding-survey for analytics — this
 * copy exists because the dashboard needs them synchronously on mount.
 */
export const FEATURE_INTERESTS_KEY = 'writescholar_feature_interests';

/** Survey option ids (see FEATURE_INTERESTS in OnboardingPage). */
export type FeatureInterest = 'essays' | 'daily_review' | 'study_packs' | 'games';

/**
 * Priority when the user picked multiple features: essays first (it has
 * the strongest preview → lock → upgrade loop), then study packs, then
 * daily review, then games. Mirrors the onboarding tour's ordering.
 */
const INTEREST_PRIORITY: FeatureInterest[] = ['essays', 'study_packs', 'daily_review', 'games'];

/** Workspace view each interest routes to on the dashboard. */
export const INTEREST_TO_VIEW: Record<FeatureInterest, WorkspaceView> = {
  essays: 'analyze',
  study_packs: 'study-packs',
  daily_review: 'daily-review',
  games: 'games',
};

export function saveFeatureInterests(ids: string[]) {
  try {
    localStorage.setItem(FEATURE_INTERESTS_KEY, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

export function getFeatureInterests(): string[] {
  try {
    const raw = localStorage.getItem(FEATURE_INTERESTS_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

/** Highest-priority feature the user picked, or null if none stored. */
export function getPrimaryFeatureInterest(): FeatureInterest | null {
  const picks = getFeatureInterests();
  return INTEREST_PRIORITY.find((id) => picks.includes(id)) ?? null;
}
