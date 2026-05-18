import { useMemo, useState } from 'react';
import { trackEvent } from '../../utils/analytics';

/* ═══════════════════════════════════════════════════════════════
   OnboardingPage — short + on-brand.

   Four questions, two steps, done:
     1. Name + username
     2. How did you hear about us? + What are you most excited for?

   Persists via the same endpoints the old flow used so nothing
   downstream changes:
     • PUT  /users/profile          { name }
     • PUT  /users/username         { username }
     • POST /users/onboarding-survey { referralSource, useGoal,
                                       featureInterests }
   Completion (the onboarding_completed flag, navigation, the
   "completed at" timestamp + later soft-paywall logic) is handled
   by the parent's onComplete().
   ═══════════════════════════════════════════════════════════════ */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface OnboardingPageProps {
  onNavigate: (page: string) => void;
  user?: { id: string; email: string; name?: string; username?: string; plan?: string } | null;
  onComplete?: () => void;
  onUserUpdate?: (updates: { name?: string; username?: string; plan?: string; subscription_status?: string }) => void;
  onLogout?: () => void;
}

type Choice = { id: string; label: string };

const HEAR_OPTIONS: Choice[] = [
  { id: 'tiktok', label: 'TikTok' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'google', label: 'Google search' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'friend', label: 'A friend' },
  { id: 'reddit', label: 'Reddit' },
  { id: 'other', label: 'Somewhere else' },
];

const EXCITED_OPTIONS: Choice[] = [
  { id: 'analysis', label: 'Professor-style essay feedback' },
  { id: 'editor', label: 'Writing my papers in the editor' },
  { id: 'study_packs', label: 'Study packs & games' },
  { id: 'citations', label: 'Finding & formatting citations' },
];

export default function OnboardingPage({ user, onComplete, onUserUpdate, onLogout }: OnboardingPageProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [referralSource, setReferralSource] = useState<string | null>(null);
  const [excitedFor, setExcitedFor] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Brief celebratory beat after saving, before handing off to the
  // workspace — finishing should feel like a win.
  const [celebrating, setCelebrating] = useState(false);

  const firstName = useMemo(() => name.trim().split(/\s+/)[0] || '', [name]);

  const normalizedUsername = username.trim().toLowerCase().replace(/\s+/g, '_');
  const usernameValid = /^[a-z0-9_]{3,30}$/.test(normalizedUsername);
  const step1Valid = name.trim().length > 0 && usernameValid;
  const step2Valid = !!referralSource && !!excitedFor;

  const goStep2 = () => {
    if (!step1Valid) {
      if (!usernameValid) setUsernameError('3–30 characters: letters, numbers and underscores only.');
      return;
    }
    setUsernameError(null);
    trackEvent('onboarding_profile_complete');
    setStep(2);
  };

  const saveProfile = async (): Promise<boolean> => {
    if (!user?.id) return true; // nothing to persist against — let them through
    const token = localStorage.getItem('authToken');
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
    try {
      if (name.trim()) {
        const res = await fetch(`${API_URL}/users/profile`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ name: name.trim() }),
        });
        if (res.ok) onUserUpdate?.({ name: name.trim() });
      }
      const res = await fetch(`${API_URL}/users/username`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ username: normalizedUsername }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        onUserUpdate?.({ username: normalizedUsername });
        return true;
      }
      setUsernameError(data?.message || 'That username is already taken.');
      setStep(1);
      return false;
    } catch (e) {
      console.error('[Onboarding] profile save failed', e);
      // Don't trap the user behind a flaky network — let them in.
      return true;
    }
  };

  const saveSurvey = () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    // Fire-and-forget — a survey failure must never block onboarding.
    fetch(`${API_URL}/users/onboarding-survey`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        referralSource,
        useGoal: excitedFor,
        featureInterests: excitedFor ? [excitedFor] : [],
      }),
    }).catch((e) => console.error('[Onboarding] survey save failed', e));
  };

  const finish = async () => {
    if (!step2Valid || submitting) return;
    setSubmitting(true);
    trackEvent('onboarding_survey_complete', { source: referralSource, excited: excitedFor });
    const ok = await saveProfile();
    if (!ok) { setSubmitting(false); return; }
    saveSurvey();
    // Celebrate, then hand off to the workspace.
    setCelebrating(true);
    window.setTimeout(() => { onComplete?.(); }, 2300);
  };

  if (celebrating) {
    const confetti = Array.from({ length: 18 });
    const confettiColors = ['#FFFFFF', '#FFC800', '#C9A0F0', '#F3EAFF', '#8A48C7'];
    return (
      <div className="fixed inset-0 z-[300] flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#A560E8] to-[#7733B5] px-6 text-center">
        {/* Confetti */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          {confetti.map((_, i) => (
            <span
              key={i}
              className="absolute block rounded-[2px]"
              style={{
                left: `${(i * 5.5 + 3) % 100}%`,
                top: '-8%',
                width: i % 3 === 0 ? '10px' : '7px',
                height: i % 3 === 0 ? '14px' : '7px',
                background: confettiColors[i % confettiColors.length],
                opacity: 0.9,
                animation: `wsConfetti ${1.6 + (i % 5) * 0.25}s cubic-bezier(0.4,0,0.6,1) ${(i % 7) * 0.12}s forwards`,
              }}
            />
          ))}
        </div>

        {/* Check burst */}
        <div className="relative" style={{ animation: 'wsPop 560ms cubic-bezier(0.34,1.56,0.64,1) both' }}>
          <span className="absolute inset-0 rounded-full bg-white/25 blur-2xl" aria-hidden />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-[0_18px_48px_-12px_rgba(0,0,0,0.4)]">
            <svg viewBox="0 0 52 52" className="w-12 h-12" fill="none" aria-hidden>
              <path
                d="M14 27 L23 36 L39 18"
                stroke="#A560E8"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ strokeDasharray: 60, strokeDashoffset: 60, animation: 'wsDraw 520ms ease-out 360ms forwards' }}
              />
            </svg>
          </div>
        </div>

        <h1
          className="dash-serif mt-7 text-3xl sm:text-4xl font-extrabold tracking-tight text-white"
          style={{ animation: 'wsRise 520ms ease-out 280ms both' }}
        >
          You're all set{firstName ? `, ${firstName}` : ''}.
        </h1>
        <p
          className="mt-2.5 text-sm sm:text-base font-bold text-white/85"
          style={{ animation: 'wsRise 520ms ease-out 440ms both' }}
        >
          Taking you to your workspace…
        </p>

        <style>{`
          @keyframes wsPop { 0% { opacity: 0; transform: scale(0.4); } 100% { opacity: 1; transform: scale(1); } }
          @keyframes wsDraw { to { stroke-dashoffset: 0; } }
          @keyframes wsRise { 0% { opacity: 0; transform: translateY(14px); } 100% { opacity: 1; transform: translateY(0); } }
          @keyframes wsConfetti {
            0%   { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
            100% { transform: translateY(110vh) rotate(540deg); opacity: 0; }
          }
          @media (prefers-reduced-motion: reduce) {
            [style*="wsConfetti"] { display: none !important; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="relative h-screen h-[100dvh] bg-[#FAF7FF] dark:bg-stone-950 flex flex-col overflow-hidden">
      {/* Soft brand glow for depth (matches the new theme) */}
      <div
        className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-72 w-[42rem] max-w-full rounded-full bg-[#A560E8]/12 dark:bg-[#A560E8]/15 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-40 -right-24 h-80 w-80 rounded-full bg-[#8A48C7]/10 blur-3xl"
        aria-hidden
      />

      {/* Top bar — WriteScholar logo lockup, top-left */}
      <div className="relative flex items-center justify-between px-5 sm:px-8 py-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden border border-stone-200/80 dark:border-stone-700 bg-white shadow-sm">
            <img
              src="/main-logo.png"
              alt="WriteScholar"
              className="w-full h-full object-contain"
              loading="eager"
              width="120"
              height="120"
            />
          </div>
          <span
            className="text-xl font-extrabold tracking-tight text-[#A560E8]"
            style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
          >
            WriteScholar
          </span>
        </div>
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="text-[12px] font-bold text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
          >
            Log out
          </button>
        )}
      </div>

      <div className="relative flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto w-full max-w-md">
          {/* Progress */}
          <div className="mb-5 flex items-center justify-between">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-stone-400">Step {step} of 2</p>
          </div>
          <div className="flex items-center gap-2 mb-6">
            {[1, 2].map((s) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${step >= s ? 'bg-gradient-to-r from-[#A560E8] to-[#8A48C7]' : 'bg-stone-200 dark:bg-stone-800'}`}
              />
            ))}
          </div>

          <div className="rounded-3xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 sm:p-8 shadow-[0_24px_60px_-28px_rgba(96,48,140,0.40)]">
            {step === 1 ? (
              <>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#A560E8]">Welcome</p>
                <h1 className="dash-serif mt-1.5 text-[1.7rem] sm:text-3xl font-extrabold leading-tight tracking-tight text-stone-900 dark:text-stone-50">
                  Let's set up your account
                </h1>
                <p className="mt-2 text-sm text-stone-500 dark:text-stone-400 font-medium">
                  Just the basics. This takes about 20 seconds.
                </p>

                <div className="mt-6 space-y-4">
                  <div>
                    <label className="block text-[13px] font-extrabold text-stone-700 dark:text-stone-200 mb-1.5">Your name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alex Carter"
                      autoFocus
                      className="w-full px-4 py-3 rounded-2xl border-2 border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm font-medium text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#A560E8]/40 focus:border-[#A560E8]/40"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-extrabold text-stone-700 dark:text-stone-200 mb-1.5">Pick a username</label>
                    <div className="flex items-center rounded-2xl border-2 border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 focus-within:ring-2 focus-within:ring-[#A560E8]/40 focus-within:border-[#A560E8]/40">
                      <span className="pl-4 text-sm font-extrabold text-stone-400">@</span>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => { setUsername(e.target.value); setUsernameError(null); }}
                        onKeyDown={(e) => { if (e.key === 'Enter') goStep2(); }}
                        placeholder="alexcarter"
                        className="w-full px-2 py-3 bg-transparent text-sm font-medium text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none"
                      />
                    </div>
                    {usernameError ? (
                      <p className="mt-1.5 text-[12px] font-bold text-[#FF4B4B]">{usernameError}</p>
                    ) : (
                      <p className="mt-1.5 text-[11px] font-medium text-stone-400">3–30 characters. Letters, numbers and underscores.</p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#A560E8]">
                  {firstName ? `Nice to meet you, ${firstName}` : 'Almost there'}
                </p>
                <h1 className="dash-serif mt-1.5 text-[1.7rem] sm:text-3xl font-extrabold leading-tight tracking-tight text-stone-900 dark:text-stone-50">
                  Two quick questions
                </h1>

                <div className="mt-6">
                  <p className="text-[13px] font-extrabold text-stone-700 dark:text-stone-200 mb-2.5">How did you hear about us?</p>
                  <div className="flex flex-wrap gap-2">
                    {HEAR_OPTIONS.map((o) => {
                      const active = referralSource === o.id;
                      return (
                        <button
                          key={o.id}
                          type="button"
                          onClick={() => setReferralSource(o.id)}
                          className={`inline-flex items-center px-3.5 py-2 rounded-full text-[13px] font-extrabold border-2 transition-all ${
                            active
                              ? 'bg-[#A560E8] text-white border-[#7733B5]'
                              : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-[#A560E8]/50'
                          }`}
                        >
                          {o.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-6">
                  <p className="text-[13px] font-extrabold text-stone-700 dark:text-stone-200 mb-2.5">What are you most excited for?</p>
                  <div className="space-y-2">
                    {EXCITED_OPTIONS.map((o) => {
                      const active = excitedFor === o.id;
                      return (
                        <button
                          key={o.id}
                          type="button"
                          onClick={() => setExcitedFor(o.id)}
                          className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left text-sm font-extrabold border-2 transition-all ${
                            active
                              ? 'bg-[#F3EAFF] dark:bg-[#A560E8]/15 text-[#8A48C7] dark:text-[#C9A0F0] border-[#A560E8]'
                              : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-[#A560E8]/50'
                          }`}
                        >
                          <span className="flex-1">{o.label}</span>
                          <span className={`h-4 w-4 rounded-full border-2 shrink-0 ${active ? 'bg-[#A560E8] border-[#7733B5]' : 'border-stone-300 dark:border-stone-600'}`} aria-hidden />
                        </button>
                      );
                    })}
                  </div>
                </div>

              </>
            )}
          </div>
        </div>
      </div>

      {/* Sticky action footer — Back / primary CTA stay visible no
          matter how far the questions scroll above. Renders the
          step-1 Continue or the step-2 Back + Let's go. */}
      <div className="relative shrink-0 border-t border-stone-200/80 dark:border-stone-800 bg-white/90 dark:bg-stone-900/90 backdrop-blur px-4 py-4">
        <div className="mx-auto w-full max-w-md">
          {step === 1 ? (
            <button
              type="button"
              onClick={goStep2}
              disabled={!step1Valid}
              className="w-full py-3.5 rounded-2xl bg-[#A560E8] hover:bg-[#8A48C7] disabled:opacity-50 disabled:cursor-not-allowed text-white text-base font-extrabold uppercase tracking-wide border-2 border-b-4 border-[#7733B5] active:border-b-2 active:translate-y-0.5 transition-all"
            >
              Continue
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-3.5 rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm font-extrabold text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 active:border-b-2 active:translate-y-0.5 transition-all"
              >
                Back
              </button>
              <button
                type="button"
                onClick={finish}
                disabled={!step2Valid || submitting}
                className="flex-1 inline-flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#A560E8] hover:bg-[#8A48C7] disabled:opacity-50 disabled:cursor-not-allowed text-white text-base font-extrabold uppercase tracking-wide border-2 border-b-4 border-[#7733B5] active:border-b-2 active:translate-y-0.5 transition-all"
              >
                {submitting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity={0.3} strokeWidth={3} />
                      <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth={3} strokeLinecap="round" />
                    </svg>
                    Setting up
                  </>
                ) : "Let's go"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
