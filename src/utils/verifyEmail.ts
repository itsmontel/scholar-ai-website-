/**
 * The server answers 403 { code: 'VERIFY_EMAIL' } when an unverified
 * email account tries a second free grade, hits the per-connection cap
 * on unverified grades, or starts a checkout. Any caller passes the
 * response here; if it is that answer, the one VerifyEmailPrompt mounted
 * at the app root opens and the caller should stop.
 */

export const VERIFY_EMAIL_EVENT = 'writescholar-verify-email';

export type VerifyEmailReason = 'verify' | 'ip_limit' | 'checkout';

export interface VerifyEmailDetail {
  email: string | null;
  reason: VerifyEmailReason;
}

export function isVerifyEmailResponse(status: number, data: unknown): data is { code: 'VERIFY_EMAIL'; email?: string | null; reason?: VerifyEmailReason } {
  return status === 403 && !!data && typeof data === 'object' && (data as { code?: unknown }).code === 'VERIFY_EMAIL';
}

/** Opens the verify prompt when the response asks for it. Returns true if it did. */
export function openVerifyEmailIfNeeded(status: number, data: unknown): boolean {
  if (!isVerifyEmailResponse(status, data)) return false;
  let email = data.email ?? null;
  if (!email) {
    try {
      email = JSON.parse(localStorage.getItem('user') || 'null')?.email ?? null;
    } catch { /* ignore */ }
  }
  const detail: VerifyEmailDetail = { email, reason: data.reason ?? 'verify' };
  window.dispatchEvent(new CustomEvent<VerifyEmailDetail>(VERIFY_EMAIL_EVENT, { detail }));
  return true;
}
