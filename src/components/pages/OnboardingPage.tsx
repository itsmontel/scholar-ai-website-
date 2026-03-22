import { useState, useEffect } from 'react';
import ScholarMascot from '../common/ScholarMascot';
import { WriteScholarEditorialBackgroundLayers } from '../common/WriteScholarEditorialBackground';

interface OnboardingPageProps {
  onNavigate: (page: string) => void;
  user?: { id: string; email: string; name?: string; username?: string } | null;
  onComplete?: () => void;
  onUserUpdate?: (updates: { name?: string; username?: string }) => void;
  onLogout?: () => void;
}

type Phase = 'profile' | 'transition' | 'done';

const OnboardingPage = ({ user, onComplete, onUserUpdate }: OnboardingPageProps) => {
  const [phase, setPhase] = useState<Phase>('profile');
  const [displayName, setDisplayName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [transText, setTransText] = useState(0);

  const firstName = displayName.trim().split(' ')[0] || 'there';

  const transitionLines = [
    { text: `Welcome, ${firstName}`, delay: 0 },
    { text: 'Setting up your workspace', delay: 1400 },
    { text: 'Unlocking your study tools', delay: 3000 },
    { text: 'Preparing your dashboard', delay: 4800 },
    { text: "You're all set — let's go", delay: 6600 },
  ];

  useEffect(() => {
    if (phase !== 'transition') return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    transitionLines.forEach((line, i) => {
      timers.push(setTimeout(() => setTransText(i), line.delay));
    });
    const finishTimer = setTimeout(() => {
      setPhase('done');
      onComplete?.();
    }, 8400);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(finishTimer);
    };
  }, [phase]);

  const saveProfile = async (): Promise<boolean> => {
    if (!user?.id) return false;
    const token = localStorage.getItem('authToken');
    try {
      if (displayName.trim()) {
        const profileRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/users/profile`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ name: displayName.trim() })
        });
        if (profileRes.ok) onUserUpdate?.({ name: displayName.trim() });
      }
      if (username.trim()) {
        const normalized = username.trim().toLowerCase().replace(/\s/g, '_');
        if (!/^[a-z0-9_]{3,30}$/.test(normalized)) {
          setUsernameError('Username must be 3-30 characters, letters, numbers, and underscores only');
          return false;
        }
        setUsernameError(null);
        const usernameRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/users/username`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ username: normalized })
        });
        const usernameData = await usernameRes.json();
        if (usernameRes.ok) {
          onUserUpdate?.({ username: normalized });
        } else {
          setUsernameError(usernameData.message || 'Username is already taken');
          return false;
        }
      }
      return true;
    } catch (e) {
      console.error('Failed to save profile:', e);
      return false;
    }
  };

  const handleContinue = async () => {
    setIsSaving(true);
      const ok = await saveProfile();
    setIsSaving(false);
      if (!ok) return;
    setPhase('transition');
  };

  /* ──────────── TRANSITION SCREEN ──────────── */
  if (phase === 'transition' || phase === 'done') {
    const line = transitionLines[transText];
    const mascotPose: 'waving' | 'studying' | 'celebrating' = transText >= 4 ? 'celebrating' : transText >= 2 ? 'studying' : 'waving';

    return (
      <>
      <WriteScholarEditorialBackgroundLayers position="fixed" />
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden animate-transBgIn bg-gradient-to-b from-stone-100/95 via-violet-50/50 to-stone-200/90 dark:from-stone-950/95 dark:via-violet-950/35 dark:to-stone-900 backdrop-blur-[2px]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,rgba(91,33,182,0.12),transparent_55%)] dark:bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,rgba(109,40,217,0.2),transparent_55%)] pointer-events-none" aria-hidden />
        {/* Soft particles — stone/violet, editorial */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-violet-400/10 dark:bg-violet-400/5"
              style={{
                width: `${8 + (i % 4) * 6}px`,
                height: `${8 + (i % 4) * 6}px`,
                left: `${(i * 8.1) % 100}%`,
                top: `${(i * 11.3) % 100}%`,
                animation: `transFloat ${7 + (i % 3) * 2}s ease-in-out infinite`,
                animationDelay: `${(i * 0.5) % 3}s`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-lg">
          <div
            className="mb-8 sm:mb-10"
            style={{
              transform: `scale(${1 + transText * 0.02})`,
              transition: 'transform 1.2s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            <div className="rounded-2xl border border-stone-200/80 dark:border-stone-600/60 bg-white/60 dark:bg-stone-900/40 p-2 shadow-lg shadow-stone-900/5 ring-1 ring-white/60 dark:ring-white/5">
              <ScholarMascot size={140} animated={true} pose={mascotPose} />
            </div>
          </div>

          <div className="relative min-h-[4.5rem] sm:min-h-[5.5rem] flex items-center justify-center overflow-hidden">
            <h1
              key={transText}
              className="animate-transLine text-2xl sm:text-[2rem] font-semibold text-stone-900 dark:text-stone-50 tracking-tight leading-snug"
              style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
            >
              {line.text}
            </h1>
          </div>

          <div className="mt-8 sm:mt-10 w-52 sm:w-64 h-1.5 bg-stone-200/90 dark:bg-stone-700/80 rounded-full overflow-hidden ring-1 ring-stone-300/30 dark:ring-stone-600/30">
            <div className="h-full bg-gradient-to-r from-violet-600 to-violet-500 dark:from-violet-500 dark:to-violet-400 rounded-full animate-progressFill" />
          </div>
        </div>

        <style>{`
          @keyframes transBgIn {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
          .animate-transBgIn { animation: transBgIn 0.6s ease-out forwards; }
          @keyframes progressFill {
            from { width: 0%; }
            to   { width: 100%; }
          }
          .animate-progressFill {
            animation: progressFill 8.4s linear forwards;
          }
          @keyframes transFloat {
            0%, 100% { transform: translateY(0) scale(1); opacity: 0.4; }
            50% { transform: translateY(-20px) scale(1.05); opacity: 0.7; }
          }
          @keyframes transLineIn {
            0%   { opacity: 0; transform: translateY(16px); filter: blur(6px); }
            100% { opacity: 1; transform: translateY(0); filter: blur(0); }
          }
          .animate-transLine {
            animation: transLineIn 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          }
        `}</style>
      </div>
      </>
    );
  }

  /* ──────────── PROFILE FORM ──────────── */
  return (
    <div className="relative min-h-screen flex flex-col font-sans overflow-x-hidden">
      <WriteScholarEditorialBackgroundLayers position="fixed" />

      {/* Subtle accents — match dashboard editorial */}
      <div className="absolute top-24 left-8 w-14 h-14 rounded-2xl bg-violet-500/5 dark:bg-violet-500/10 border border-stone-200/40 dark:border-stone-700/40 rotate-12 hidden lg:block animate-float pointer-events-none" />
      <div className="absolute top-40 right-12 w-11 h-11 rounded-full bg-stone-400/10 dark:bg-stone-500/10 hidden lg:block animate-float-delayed pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 px-5 sm:px-6 pt-5 sm:pt-6 pb-2 flex items-center">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden border border-stone-200/80 dark:border-stone-600 bg-white/80 dark:bg-stone-800/80 shadow-sm ring-1 ring-white/50 dark:ring-white/5">
            <img src="/mascot.png" alt="WriteScholar" className="w-full h-full object-contain" loading="eager" width="120" height="120" />
          </div>
          <span className="text-lg sm:text-xl font-semibold tracking-tight text-stone-900 dark:text-stone-100" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>WriteScholar</span>
        </div>
      </div>

      <div className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-6 sm:py-10">
        <div className="w-full max-w-md animate-fadeIn">
          <div className="rounded-2xl border border-stone-200/90 dark:border-stone-700/80 bg-white/90 dark:bg-stone-900/70 backdrop-blur-md shadow-[0_12px_40px_-12px_rgba(15,23,42,0.1)] dark:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.4)] p-6 sm:p-8 ring-1 ring-white/50 dark:ring-white/5">
            <div className="h-0.5 w-full bg-gradient-to-r from-emerald-500 via-violet-500 to-amber-500 opacity-80 rounded-full mb-6 -mt-1" aria-hidden />
              <div className="flex justify-center mb-5">
              <div className="rounded-2xl border border-stone-200/70 dark:border-stone-600/60 p-1.5 bg-stone-50/80 dark:bg-stone-800/50">
                <ScholarMascot size={100} animated={true} pose="waving" />
              </div>
              </div>
            <div className="text-center mb-6">
              <h1 className="text-2xl sm:text-[1.75rem] text-stone-900 dark:text-stone-50 mb-2 font-semibold leading-tight" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
                Hey there! Let&apos;s get started
                </h1>
              <p className="text-stone-600 dark:text-stone-400 text-sm sm:text-base">Just two things and you&apos;re in</p>
              </div>

              <div className="space-y-4">
                <div>
                <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-2">Your name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Alex or Jordan"
                  className="w-full px-4 py-3.5 rounded-xl border border-stone-200/90 dark:border-stone-600 bg-white dark:bg-stone-900/50 focus:border-violet-500 dark:focus:border-violet-400 focus:ring-2 focus:ring-violet-500/25 focus:outline-none transition-all text-base text-stone-800 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500"
                  autoFocus
                  />
                </div>
                <div>
                <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-2">Pick a username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); setUsernameError(null); }}
                  placeholder="e.g. alex_student"
                  className={`w-full px-4 py-3.5 rounded-xl border bg-white dark:bg-stone-900/50 focus:ring-2 transition-all text-base text-stone-800 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 ${
                    usernameError
                      ? 'border-rose-400 dark:border-rose-500 focus:border-rose-500 focus:ring-rose-500/25 focus:outline-none'
                      : 'border-stone-200/90 dark:border-stone-600 focus:border-violet-500 dark:focus:border-violet-400 focus:ring-violet-500/25 focus:outline-none'
                  }`}
                  onKeyDown={(e) => { if (e.key === 'Enter' && displayName.trim() && username.trim() && !usernameError) handleContinue(); }}
                />
                {usernameError && <p className="mt-1.5 text-sm text-rose-600 dark:text-rose-400">{usernameError}</p>}
                <p className="mt-1 text-xs text-stone-500 dark:text-stone-500">You can change this later in settings</p>
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <button
                onClick={handleContinue}
                disabled={!displayName.trim() || !username.trim() || !!usernameError || isSaving}
                className="w-full px-8 py-3.5 bg-violet-700 hover:bg-violet-800 dark:bg-violet-600 dark:hover:bg-violet-500 text-white rounded-xl font-semibold text-base shadow-md shadow-violet-900/15 ring-1 ring-violet-900/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving...
                  </>
                ) : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
      `}</style>
    </div>
  );
};

export default OnboardingPage;
