/**
 * Onboarding and tutorial persistence — Supabase is the single source of truth.
 * onboarding_completed / welcome_tutorial_completed in users table:
 * - false = show onboarding/tutorial
 * - true = never show again (persists across devices/sessions)
 */

const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Persist onboarding completion to Supabase via API.
 * Call this when user completes onboarding; the DB flag is the only source of truth.
 */
export async function persistOnboardingToServer(maxRetries = 3): Promise<boolean> {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('authToken') : null;
  if (!token) {
    console.warn('persistOnboardingToServer: No auth token');
    return false;
  }
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(`${apiUrl}/users/complete-onboarding`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) return true;
      if (attempt === maxRetries) {
        console.error('persistOnboardingToServer failed:', res.status, await res.text().catch(() => ''));
      }
    } catch (e) {
      if (attempt === maxRetries) console.error('persistOnboardingToServer error:', e);
    }
    if (attempt < maxRetries) await new Promise(r => setTimeout(r, 500 * attempt));
  }
  return false;
}

/**
 * Persist tutorial completion to Supabase via API.
 * Call this when user completes the welcome tutorial.
 */
export async function persistTutorialToServer(maxRetries = 3): Promise<boolean> {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('authToken') : null;
  if (!token) {
    console.warn('persistTutorialToServer: No auth token');
    return false;
  }
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(`${apiUrl}/users/complete-tutorial`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) return true;
      if (attempt === maxRetries) {
        console.error('persistTutorialToServer failed:', res.status, await res.text().catch(() => ''));
      }
    } catch (e) {
      if (attempt === maxRetries) console.error('persistTutorialToServer error:', e);
    }
    if (attempt < maxRetries) await new Promise(r => setTimeout(r, 500 * attempt));
  }
  return false;
}
