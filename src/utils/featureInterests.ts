import type { WorkspaceView } from '../components/workspace/types';

/**
 * Onboarding "what excites you most?" survey picks, persisted locally so
 * the dashboard can personalize the first-run experience. Scoped per user
 * so shared browsers don't route account B using account A's picks.
 * The same answers also POST to /users/onboarding-survey for analytics.
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

export function featureInterestsKey(userId: string): string {
  return `${FEATURE_INTERESTS_KEY}_${userId}`;
}

export function saveFeatureInterests(userId: string, ids: string[]) {
  if (!userId) return;
  try {
    localStorage.setItem(featureInterestsKey(userId), JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

export function getFeatureInterests(userId?: string): string[] {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(featureInterestsKey(userId));
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

/** Highest-priority feature the user picked, or null if none stored. */
export function getPrimaryFeatureInterest(userId?: string): FeatureInterest | null {
  const picks = getFeatureInterests(userId);
  return INTEREST_PRIORITY.find((id) => picks.includes(id)) ?? null;
}

/** Last onboarding step after the tour: real essay, real pack, or hub. */
export type OnboardingAhaPhase = 'analyze-input' | 'studypack-input' | 'transition';

/**
 * Essays (alone or with anything else) keep the essay aha — strongest
 * conversion. Study packs without essays get a notes → pack aha.
 * Games / Daily Review only skip generation and land on the hub.
 * Empty picks fall back to the essay path so we never skip the product.
 */
export function ahaPhaseForInterests(interests: string[]): OnboardingAhaPhase {
  if (interests.includes('essays') || interests.length === 0) return 'analyze-input';
  if (interests.includes('study_packs')) return 'studypack-input';
  return 'transition';
}

export type HubNudgeTool = 'daily-review' | 'games';

/** Hub tile / banner to light up when the aha skipped generation. */
export function hubNudgeForInterests(interests: string[]): HubNudgeTool | null {
  if (interests.includes('essays') || interests.includes('study_packs')) return null;
  if (interests.includes('daily_review')) return 'daily-review';
  if (interests.includes('games')) return 'games';
  return null;
}

export const HUB_NUDGE_AFTER_ONBOARDING_KEY = 'writescholar_hub_nudge_after_onboarding';
export const HIGHLIGHT_PACK_AFTER_ONBOARDING_KEY = 'writescholar_highlight_pack_after_onboarding';
export const STUDY_PACK_VIEWER_KEY = 'writescholar_study_pack_viewer';
