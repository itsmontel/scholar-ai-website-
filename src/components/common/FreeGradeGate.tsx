import { useEffect, useRef, useState, type FormEvent } from 'react';
import { PENDING_ESSAY_KEY } from '../../config/pricing';
import { trackEvent } from '../../utils/analytics';
import type { EssayFacts } from '../landing/HeroEssayGrader';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface GateUser {
  id: string;
  email: string;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  subscriptionPlan?: string;
  subscriptionStatus?: string;
  emailVerified?: boolean;
  onboardingCompleted?: boolean;
  welcomeTutorialCompleted?: boolean;
}

interface FreeGradeGateProps {
  open: boolean;
  words: number;
  fileName?: string | null;
  /** What the paste box already worked out, shown back so the report feels underway. */
  facts?: EssayFacts | null;
  onClose: () => void;
  /** The account is created or signed in; token and user are already in localStorage. */
  onAuthed: (user: GateUser) => void;
}

type Mode = 'email' | 'login';

/** Where the progress bar sits while the gate is open: the pre-read got this far. */
const GATE_PROGRESS = 78;

/**
 * The one field between the pasted essay and its grade. New inboxes get
 * an account on the spot (POST /auth/quick-register, no password, no
 * email round-trip). A known inbox is asked for its password instead,
 * which is also what stops one person holding several free accounts.
 * The essay is kept in localStorage across a Google redirect.
 *
 * It opens after the paste box has visibly read the essay, so the
 * report is "most of the way there" and the email is the last step,
 * not the first.
 */
export default function FreeGradeGate({ open, words, fileName, facts, onClose, onAuthed }: FreeGradeGateProps) {
  const [mode, setMode] = useState<Mode>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [knownHasGoogle, setKnownHasGoogle] = useState(false);
  const emailRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setMode('email');
    setPassword('');
    setError('');
    trackEvent('gate_view', { words });
    const t = window.setTimeout(() => emailRef.current?.focus(), 60);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => { window.clearTimeout(t); document.removeEventListener('keydown', onKey); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const finish = (token: string, user: GateUser, method: string) => {
    try {
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      window.dispatchEvent(new CustomEvent('writescholar-auth-changed'));
    } catch { /* storage unavailable: the parent still receives the user */ }
    trackEvent('signed_up', { method });
    onAuthed(user);
  };

  const continueWithGoogle = () => {
    trackEvent('gate_view', { method: 'google', words });
    // The essay is already in PENDING_ESSAY_KEY; AuthCallbackPage picks it up.
    window.location.href = `${API_URL}/auth/google`;
  };

  const submitEmail = async (e: FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
      setError('Enter a real email address.');
      return;
    }
    if (password.length < 8) {
      setError('Use at least 8 characters for your password.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/auth/quick-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: value, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 409 && data?.code === 'ACCOUNT_EXISTS') {
        // Returning student: try the password they just typed before
        // asking again.
        setKnownHasGoogle(data.hasGoogle === true);
        const loginRes = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: value, password }),
        });
        const loginData = await loginRes.json().catch(() => ({}));
        if (loginRes.ok && loginData?.data?.token) {
          finish(loginData.data.token, loginData.data.user, 'login');
          return;
        }
        setPassword('');
        setMode('login');
        setError(data.hasGoogle === true && !data.hasPassword
          ? 'This email signs in with Google. Use the Google button.'
          : 'That email already has an account and the password did not match. Try again.');
        return;
      }
      if (!res.ok) {
        setError(data?.message || 'We could not create your account. Try again.');
        return;
      }
      finish(data.data.token, data.data.user, 'email');
    } catch {
      setError('Network problem. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const submitLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Enter your password.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          data?.requiresEmailVerification
            ? 'This account still needs its email verified. Check your inbox for the link, or continue with Google.'
            : data?.message || 'That password did not match.',
        );
        return;
      }
      finish(data.data.token, data.data.user, 'login');
    } catch {
      setError('Network problem. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const forgot = async () => {
    try {
      await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      setError('');
      setPassword('');
      setMode('email');
      setError('We emailed you a link to set a new password. Open it, then come back and paste your essay again.');
    } catch {
      setError('We could not send the reset email. Try again in a minute.');
    }
  };

  const font = { fontFamily: '"Nunito", system-ui, sans-serif' } as const;
  const kindLabel = facts?.kind ? `${/^[aeiou]/i.test(facts.kind) ? 'An' : 'A'} ${facts.kind}` : null;
  const inputCls = 'min-h-[52px] rounded-[14px] border-2 border-[#1C1917] bg-[#FAF7FF] px-4 text-[16px] font-bold text-[#1C1917] placeholder:text-[#8A8580] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#A560E8]/35';
  const primaryCls = 'mt-1 flex min-h-[56px] items-center justify-center gap-2.5 rounded-[14px] border-2 border-[#1C1917] bg-[#58CC02] text-[18px] font-black text-[#1C1917] transition-all hover:bg-[#61E002] active:translate-x-px active:translate-y-px disabled:opacity-70';
  const googleCls = 'flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-[14px] border-2 border-[#1C1917] bg-white text-[15px] font-extrabold text-[#1C1917] transition-all hover:bg-[#FAF7FF] active:translate-x-px active:translate-y-px';

  return (
    <div
      className="fixed inset-0 z-[240] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="free-grade-gate-title"
    >
      <div className="absolute inset-0 bg-[#2A1540]/60" onClick={onClose} aria-hidden />
      <section
        className="relative w-full max-w-[540px] rounded-[24px] border-2 border-[#1C1917] bg-white p-5 text-[#1C1917] sm:p-7"
        style={{ boxShadow: '8px 8px 0 #7733B5', ...font }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#1C1917] bg-white text-[#1C1917] hover:bg-[#FAF7FF]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>

        {/* The report so far: progress plus what the box read. */}
        <div className="flex items-center gap-3.5 pr-10">
          <img src="/mascot-paper-still.webp" alt="" width={64} height={64} className="h-16 w-16 shrink-0 object-contain" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[12px] font-black uppercase tracking-[0.16em] text-[#7733B5]">Report {GATE_PROGRESS}% ready</p>
              <p className="truncate text-[12.5px] font-extrabold text-[#57534E]">
                {words.toLocaleString()} words{fileName ? ` · ${fileName}` : ''}
              </p>
            </div>
            <div role="progressbar" aria-valuenow={GATE_PROGRESS} aria-valuemin={0} aria-valuemax={100} aria-label="Report progress" className="mt-1.5 h-3 overflow-hidden rounded-full border-2 border-[#1C1917] bg-[#FAF7FF]">
              <div className="h-full rounded-full bg-[#A560E8]" style={{ width: `${GATE_PROGRESS}%` }} />
            </div>
          </div>
        </div>
        {(kindLabel || facts?.thesis) && (
          <ul className="mt-3 flex flex-col gap-1.5 rounded-[12px] border-2 border-[#1C1917] bg-[#F3EEFF] px-3.5 py-2.5 text-[13px] font-extrabold leading-snug text-[#1C1917]">
            {kindLabel && <li className="flex gap-2"><span className="text-[#15803D]">✓</span>{kindLabel}, {facts?.paragraphs} paragraphs</li>}
            {facts?.thesis && <li className="flex gap-2"><span className="text-[#15803D]">✓</span><span className="min-w-0">Thesis: <span className="font-bold text-[#44403C]">“{facts.thesis}”</span></span></li>}
            <li className="flex gap-2 text-[#57534E]"><span aria-hidden className="inline-block h-[16px] w-[16px] animate-spin rounded-full border-[2.5px] border-[#A560E8] border-r-transparent" />Scoring the rubric and writing your comments</li>
          </ul>
        )}

        {mode === 'email' ? (
          <>
            <h2 id="free-grade-gate-title" className="mt-4 text-[25px] font-black leading-[1.1] sm:text-[28px]">
              Where should we send your report?
            </h2>
            <p className="mt-2 text-[15px] font-semibold leading-relaxed text-[#57534E]">
              It finishes in about a minute. Make a free account so you can come back to it. No card.
            </p>

            <button type="button" onClick={continueWithGoogle} className={`mt-5 ${googleCls}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden><path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.4z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z"/><path fill="#FBBC05" d="M6.4 14a6 6 0 0 1 0-3.9V7.5H3.1a10 10 0 0 0 0 9z"/><path fill="#EA4335" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.5l3.3 2.6C7.2 7.8 9.4 6 12 6z"/></svg>
              Continue with Google
            </button>

            <div className="my-4 flex items-center gap-3 text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#78716C]">
              <span className="h-0.5 flex-1 bg-[#E7E5E4]" />or<span className="h-0.5 flex-1 bg-[#E7E5E4]" />
            </div>

            <form onSubmit={submitEmail} className="flex flex-col gap-2.5">
              <label htmlFor="gate-email" className="text-[12px] font-black uppercase tracking-[0.08em] text-[#57534E]">Email</label>
              <input
                ref={emailRef}
                id="gate-email"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu"
                className={inputCls}
              />
              <label htmlFor="gate-new-password" className="mt-1 text-[12px] font-black uppercase tracking-[0.08em] text-[#57534E]">Password</label>
              <div className="relative">
                <input
                  id="gate-new-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  minLength={8}
                  className={`${inputCls} w-full pr-[4.75rem]`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2.5 py-1.5 text-[13px] font-extrabold text-[#7733B5] hover:bg-[#F3EEFF]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <button type="submit" disabled={submitting} className={primaryCls} style={{ boxShadow: '4px 4px 0 #1C1917' }}>
                {submitting ? 'Setting up…' : 'Finish my report'}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </button>
            </form>
          </>
        ) : (
          <>
            <h2 id="free-grade-gate-title" className="mt-4 text-[25px] font-black leading-[1.1] sm:text-[28px]">
              Welcome back. Log in to finish this one.
            </h2>
            <p className="mt-2 text-[15px] font-semibold leading-relaxed text-[#57534E]">
              <span className="font-extrabold text-[#1C1917]">{email.trim()}</span> already has an account, so your reports stay in one place.
            </p>

            {knownHasGoogle && (
              <button type="button" onClick={continueWithGoogle} className={`mt-5 ${googleCls}`}>
                Continue with Google
              </button>
            )}

            <form onSubmit={submitLogin} className="mt-4 flex flex-col gap-2.5">
              <label htmlFor="gate-password" className="text-[12px] font-black uppercase tracking-[0.08em] text-[#57534E]">Password</label>
              <input
                id="gate-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                className={inputCls}
              />
              <button type="submit" disabled={submitting} className={primaryCls} style={{ boxShadow: '4px 4px 0 #1C1917' }}>
                {submitting ? 'Logging in…' : 'Log in and finish my report'}
              </button>
              <div className="flex items-center justify-between text-[13px] font-bold text-[#57534E]">
                <button type="button" onClick={() => { setMode('email'); setError(''); }} className="underline underline-offset-2">Use a different email</button>
                <button type="button" onClick={forgot} className="underline underline-offset-2">Forgot password?</button>
              </div>
            </form>
          </>
        )}

        {error && (
          <p className="mt-3 rounded-[12px] border-2 border-[#1C1917] bg-[#FFF1F2] px-3 py-2 text-[13px] font-bold text-[#9F1239]" role="alert">
            {error}
          </p>
        )}

        <p className="mt-4 text-center text-[12px] font-bold leading-relaxed text-[#78716C]">
          Free. We email you a link to verify your account. Your essay is never used to train AI. By continuing you agree to the{' '}
          <a href="/terms" className="text-[#7733B5] underline underline-offset-2">terms</a>.
        </p>
      </section>
    </div>
  );
}

/** Keep the essay across a redirect (Google) or a refresh. */
export function stashPendingEssay(text: string, meta: { words: number; fileName: string | null }) {
  try {
    localStorage.setItem(PENDING_ESSAY_KEY, JSON.stringify({ text, ...meta, at: Date.now() }));
  } catch { /* ignore */ }
}

export function readPendingEssay(): { text: string; words: number; fileName: string | null } | null {
  try {
    const raw = localStorage.getItem(PENDING_ESSAY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.text !== 'string' || !parsed.text.trim()) return null;
    // A day is plenty; after that it is stale.
    if (typeof parsed.at === 'number' && Date.now() - parsed.at > 24 * 60 * 60 * 1000) return null;
    return { text: parsed.text, words: Number(parsed.words) || 0, fileName: parsed.fileName ?? null };
  } catch {
    return null;
  }
}

export function clearPendingEssay() {
  try { localStorage.removeItem(PENDING_ESSAY_KEY); } catch { /* ignore */ }
}
