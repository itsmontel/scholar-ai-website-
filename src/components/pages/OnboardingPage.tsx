import { useState, useEffect } from 'react';
import ScholarMascot from '../common/ScholarMascot';

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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-rose-600 via-pink-600 to-rose-700 overflow-hidden animate-transBgIn">
        {/* Slow-moving ambient particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
          {Array.from({ length: 14 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${10 + (i % 5) * 8}px`,
                height: `${10 + (i % 5) * 8}px`,
                left: `${(i * 7.3) % 100}%`,
                top: `${(i * 13.7) % 100}%`,
                background: 'rgba(255,255,255,0.06)',
                animation: `transFloat ${6 + (i % 4) * 2}s ease-in-out infinite`,
                animationDelay: `${(i * 0.7) % 4}s`,
              }}
            />
          ))}
        </div>

        {/* Soft radial glow */}
        <div className="absolute w-[500px] h-[500px] bg-white/8 rounded-full blur-[120px]" />

        <div className="relative z-10 flex flex-col items-center text-center px-6">
          {/* Mascot with smooth scale transition */}
          <div
            className="mb-10"
            style={{
              transform: `scale(${1 + transText * 0.025})`,
              transition: 'transform 1.2s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            <ScholarMascot size={150} animated={true} pose={mascotPose} />
          </div>

          {/* Text — crossfade, no emojis */}
          <div className="relative h-16 sm:h-20 flex items-center justify-center overflow-hidden">
            <h1
              key={transText}
              className="animate-transLine text-2xl sm:text-4xl font-extrabold text-white tracking-tight"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              {line.text}
            </h1>
          </div>

          {/* Thin progress bar — smoothly fills over 8.4s */}
          <div className="mt-10 w-48 sm:w-64 h-1 bg-white/15 rounded-full overflow-hidden">
            <div className="h-full bg-white/80 rounded-full animate-progressFill" />
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
    );
  }

  /* ──────────── PROFILE FORM ──────────── */
  return (
    <div className="min-h-screen flex flex-col relative font-sans bg-gradient-to-b from-rose-50/60 via-stone-50 to-white dark:from-stone-950 dark:via-stone-900 dark:to-stone-900">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(251,113,133,0.12),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(236,72,153,0.08),transparent)] pointer-events-none" aria-hidden />

      {/* Floating shapes */}
      <div className="absolute top-24 left-8 w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-400/20 to-pink-500/20 rotate-12 hidden lg:block animate-float pointer-events-none" />
      <div className="absolute top-40 right-12 w-12 h-12 rounded-full bg-gradient-to-br from-rose-400/20 to-pink-500/20 hidden lg:block animate-float-delayed pointer-events-none" />
      <div className="absolute top-64 left-16 w-10 h-10 rounded-lg bg-gradient-to-br from-pink-400/20 to-rose-500/20 -rotate-12 hidden xl:block animate-float pointer-events-none" style={{ animationDelay: '1s' }} />
      <div className="absolute top-[12%] left-[8%] w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-400/20 to-pink-500/20 rotate-12 lg:hidden animate-float pointer-events-none" />
      <div className="absolute top-[22%] right-[10%] w-10 h-10 rounded-full bg-gradient-to-br from-rose-400/20 to-pink-500/20 lg:hidden animate-float-delayed pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 px-6 pt-6 pb-2 flex items-center">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden shadow-lg shadow-rose-500/30">
            <img src="/mascot.png" alt="WriteScholar" className="w-full h-full object-contain" loading="eager" width="120" height="120" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-rose-600 dark:text-rose-400">WriteScholar</span>
        </div>
      </div>

      <div className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-6 sm:py-8">
        <div className="w-full max-w-md animate-fadeIn">
          <div className="bg-white dark:bg-stone-800 rounded-3xl border border-stone-200 dark:border-stone-600 shadow-xl dark:shadow-stone-900/50 p-6 sm:p-8">
              <div className="flex justify-center mb-6">
              <ScholarMascot size={110} animated={true} pose="waving" />
              </div>
            <div className="text-center mb-6">
              <h1 className="text-2xl sm:text-3xl text-stone-800 dark:text-stone-100 mb-2" style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 400 }}>
                Hey there! Let's get started
                </h1>
              <p className="text-stone-500 dark:text-stone-400 text-base">Just two things and you're in</p>
              </div>

              <div className="space-y-4">
                <div>
                <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-2">Your name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Alex or Jordan"
                  className="w-full px-5 py-4 rounded-2xl border-2 border-stone-200 dark:border-stone-600 bg-stone-50 dark:bg-stone-700/50 focus:border-rose-500 dark:focus:border-rose-500 focus:ring-2 focus:ring-rose-500/40 focus:outline-none transition-all text-base text-stone-800 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500"
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
                  className={`w-full px-5 py-4 rounded-2xl border-2 bg-stone-50 dark:bg-stone-700/50 focus:ring-2 transition-all text-base text-stone-800 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 ${
                    usernameError
                      ? 'border-red-400 dark:border-red-500 focus:border-red-500 focus:ring-red-500/40 focus:outline-none'
                      : 'border-stone-200 dark:border-stone-600 focus:border-rose-500 dark:focus:border-rose-500 focus:ring-rose-500/40 focus:outline-none'
                  }`}
                  onKeyDown={(e) => { if (e.key === 'Enter' && displayName.trim() && username.trim() && !usernameError) handleContinue(); }}
                />
                {usernameError && <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{usernameError}</p>}
                <p className="mt-1 text-xs text-stone-400 dark:text-stone-500">You can change this later in settings</p>
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <button
                onClick={handleContinue}
                disabled={!displayName.trim() || !username.trim() || !!usernameError || isSaving}
                className="w-full sm:w-auto px-10 py-3.5 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-500/90 hover:to-pink-600/90 text-white rounded-2xl font-bold text-base shadow-lg shadow-rose-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
