/**
 * Onboarding and tutorial persistence — Supabase is the single source of truth.
 * onboarding_completed / welcome_tutorial_completed in users table:
 * - false = show onboarding/tutorial
 * - true = never show again (persists across devices/sessions)
 */

import { API_BASE_URL } from '../config/api';

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
  const url = `${API_BASE_URL}/users/complete-onboarding`;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) return true;
      const body = await res.text().catch(() => '');
      console.error(`persistOnboardingToServer failed (attempt ${attempt}/${maxRetries}):`, res.status, body);
    } catch (e) {
      console.error(`persistOnboardingToServer error (attempt ${attempt}/${maxRetries}):`, e);
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
  const url = `${API_BASE_URL}/users/complete-tutorial`;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        console.log('[persistTutorialToServer] Success');
        return true;
      }
      const body = await res.text().catch(() => '');
      console.error(`[persistTutorialToServer] Failed (attempt ${attempt}/${maxRetries}): status=${res.status} body=${body}`);
    } catch (e) {
      console.error(`[persistTutorialToServer] Network error (attempt ${attempt}/${maxRetries}):`, e);
    }
    if (attempt < maxRetries) await new Promise(r => setTimeout(r, 500 * attempt));
  }
  return false;
}
