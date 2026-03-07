const KEY_PREFIX = 'writescholar_onboarding_completed_';

/**
 * Check if onboarding is done according to localStorage.
 * This key survives logout (only authToken and user are cleared on logout).
 */
export function isOnboardingDone(userId: string | undefined | null): boolean {
  if (!userId) return false;
  return localStorage.getItem(`${KEY_PREFIX}${userId}`) === 'true';
}

/**
 * Persist onboarding completion in localStorage.
 * This MUST be called before any API call so the flag is set even if the network fails.
 */
export function setOnboardingDone(userId: string): void {
  localStorage.setItem(`${KEY_PREFIX}${userId}`, 'true');
}

/**
 * Resolve onboarding status from any combination of server flag + localStorage.
 * Returns true if EITHER source says onboarding is done.
 * Use this every time you construct a user object.
 */
export function resolveOnboarding(userId: string | undefined | null, serverFlag: boolean | undefined): boolean {
  return serverFlag === true || isOnboardingDone(userId);
}

/**
 * Persist onboarding completion to the server with retries.
 * localStorage is already set before this is called, so the UX is correct even if this fails.
 */
export async function persistOnboardingToServer(maxRetries = 3): Promise<boolean> {
  const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api';
  const token = localStorage.getItem('authToken');
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(`${apiUrl}/users/complete-onboarding`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) return true;
    } catch (_e) {
      // retry
    }
    if (attempt < maxRetries) await new Promise(r => setTimeout(r, 500 * attempt));
  }
  console.error('Failed to persist onboarding to server after retries');
  return false;
}
