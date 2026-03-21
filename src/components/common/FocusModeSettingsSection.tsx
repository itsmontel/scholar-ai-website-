import { useState, useEffect } from 'react';
import { FOCUS_MODE_COMING_SOON, FOCUS_MODE_CHROME_EXTENSION_URL } from '../../constants/focusMode';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const UNLOCK_DURATION_OPTIONS = [
  { value: 5 * 60 * 1000, label: '5 minutes' },
  { value: 15 * 60 * 1000, label: '15 minutes' },
  { value: 30 * 60 * 1000, label: '30 minutes' },
  { value: 60 * 60 * 1000, label: '1 hour' },
  { value: 2 * 60 * 60 * 1000, label: '2 hours' },
  { value: 3 * 60 * 60 * 1000, label: '3 hours' },
  { value: 4 * 60 * 60 * 1000, label: '4 hours' },
  { value: 6 * 60 * 60 * 1000, label: '6 hours' },
  { value: 8 * 60 * 60 * 1000, label: '8 hours' },
  { value: 12 * 60 * 60 * 1000, label: '12 hours' },
  { value: 24 * 60 * 60 * 1000, label: '24 hours' },
];

const QUESTION_COUNT_OPTIONS = [5, 10, 15] as const;

function parseDomain(input: string): string | null {
  if (!input || typeof input !== 'string') return null;
  const s = input.trim().toLowerCase();
  if (s.length < 4) return null;
  let host = s.replace(/^https?:\/\//, '').split('/')[0];
  const parts = host.split('.');
  if (parts.length >= 2) {
    host = parts.slice(-2).join('.');
  }
  return host;
}

interface FocusModeSettingsSectionProps {
  onBack?: () => void;
  embedded?: boolean;
  isPaidUser?: boolean;
  onNavigate?: (page: string) => void;
}

export default function FocusModeSettingsSection({ onBack, embedded = false, isPaidUser = true, onNavigate }: FocusModeSettingsSectionProps) {
  const [blockedDomains, setBlockedDomains] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState(5);
  const [passThreshold, setPassThreshold] = useState(4);
  const [unlockDurationMs, setUnlockDurationMs] = useState(30 * 60 * 1000);
  const [presets, setPresets] = useState<{ domain: string; label: string }[]>([]);
  const [customDomainInput, setCustomDomainInput] = useState('');
  const [addError, setAddError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [maxSites, setMaxSites] = useState(isPaidUser ? 99999 : 3);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    setLoading(true);
    Promise.all([
      fetch(`${API_URL}/focus-mode/settings`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_URL}/focus-mode/presets`)
    ])
      .then(([r1, r2]) => Promise.all([r1.json(), r2.json()]))
      .then(([d1, d2]) => {
        if (d1.success) {
          setMaxSites(d1.data.maxSites ?? (isPaidUser ? 99999 : 3));
          setBlockedDomains(d1.data.blockedDomains || []);
          setQuestionCount(d1.data.question_count ?? 5);
          setPassThreshold(d1.data.pass_threshold ?? 4);
          setUnlockDurationMs(d1.data.unlock_duration_ms ?? 30 * 60 * 1000);
        }
        if (d2.success) setPresets(d2.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [API_URL, isPaidUser]);

  const saveSettings = async (updates?: Partial<{ blockedDomains: string[]; question_count: number; pass_threshold: number; unlock_duration_ms: number }>) => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    setSaving(true);
    setSaveSuccess(false);
    try {
      const domains = (updates?.blockedDomains ?? blockedDomains).slice(0, maxSites);
      const body = {
        blockedDomains: domains,
        question_count: updates?.question_count ?? questionCount,
        pass_threshold: updates?.pass_threshold ?? passThreshold,
        unlock_duration_ms: updates?.unlock_duration_ms ?? unlockDurationMs
      };
      const r = await fetch(`${API_URL}/focus-mode/settings`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await r.json();
      if (data.success) {
        setBlockedDomains(data.data.blockedDomains || []);
        setQuestionCount(data.data.question_count ?? 5);
        setPassThreshold(data.data.pass_threshold ?? 4);
        setUnlockDurationMs(data.data.unlock_duration_ms ?? 30 * 60 * 1000);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleBlockedSite = async (domain: string) => {
    const isRemoving = blockedDomains.includes(domain);
    let next: string[];
    if (isRemoving) {
      next = blockedDomains.filter((d) => d !== domain);
    } else if (maxSites < 99999 && blockedDomains.length >= maxSites) {
      next = [domain];
    } else {
      next = [...blockedDomains, domain];
    }
    setBlockedDomains(next);
    await saveSettings({ blockedDomains: next });
  };

  const handleAddCustomDomain = async () => {
    const raw = customDomainInput.trim();
    if (!raw) return;
    setAddError('');
    const candidates = raw.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
    const toAdd: string[] = [];
    for (const c of candidates) {
      const domain = parseDomain(c);
      if (domain && !blockedDomains.includes(domain) && toAdd.indexOf(domain) === -1) {
        toAdd.push(domain);
      }
    }
    if (toAdd.length === 0) {
      setAddError('Enter a valid domain (e.g. youtube.com, reddit.com)');
      return;
    }
    if (maxSites < 99999 && blockedDomains.length >= maxSites && toAdd.length > 0) {
      setAddError(`Free plan: block up to ${maxSites} sites. Upgrade for unlimited.`);
      return;
    }
    const unlimited = maxSites >= 99999;
    if (!unlimited && blockedDomains.length + toAdd.length > maxSites) {
      setAddError(`Free plan: block up to ${maxSites} sites. Upgrade for unlimited.`);
      return;
    }
    const next = [...blockedDomains, ...toAdd].slice(0, maxSites);
    setBlockedDomains(next);
    setCustomDomainInput('');
    await saveSettings({ blockedDomains: next });
  };

  const handleQuestionCountChange = (val: number) => {
    setQuestionCount(val);
    const newThreshold = Math.min(passThreshold, val);
    if (passThreshold > val) setPassThreshold(newThreshold);
    saveSettings({ question_count: val, pass_threshold: newThreshold });
  };

  const handlePassThresholdChange = (val: number) => {
    const v = Math.min(questionCount, Math.max(1, val));
    setPassThreshold(v);
    saveSettings({ pass_threshold: v });
  };

  const handleUnlockDurationChange = (ms: number) => {
    setUnlockDurationMs(ms);
    saveSettings({ unlock_duration_ms: ms });
  };

  const passThresholdOptions = Array.from({ length: questionCount }, (_, i) => i + 1);

  if (FOCUS_MODE_COMING_SOON) {
    return (
      <div className="min-h-0 flex-1 overflow-auto">
        <div className="p-6 sm:p-8 max-w-4xl">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            {embedded && onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 text-sm font-medium transition-colors"
              >
                ← Back to Dashboard
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            <div className="rounded-2xl overflow-hidden bg-violet-50 dark:from-violet-950/30 dark:to-purple-950/20 border border-violet-200/60 dark:border-violet-800/40 shadow-lg">
              <p className="px-4 pt-4 pb-2 text-sm font-bold text-stone-700 dark:text-stone-300">See how it works</p>
              <div className="aspect-video bg-stone-900">
                <video autoPlay loop muted playsInline className="w-full h-full object-contain" title="WriteScholar Focus Mode">
                  <source src="/writescholar-focus-mode-demo.mp4" type="video/mp4" />
                </video>
              </div>
            </div>
            <div className="relative rounded-3xl overflow-hidden p-[1px] bg-gradient-to-br from-violet-400/30 via-purple-400/20 to-violet-400/20 dark:from-violet-600/30 dark:via-purple-600/20 dark:to-violet-600/20">
              <div className="rounded-[23px] bg-white/90 dark:bg-stone-800/95 backdrop-blur-xl border border-white/60 dark:border-stone-700/50 p-8 sm:p-10 flex flex-col justify-center">
                <span className="inline-flex items-center px-4 py-1.5 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-full text-sm font-bold mb-4 w-fit">Coming Soon</span>
                <div className="w-16 h-16 rounded-2xl bg-violet-600 hover:bg-violet-500 flex items-center justify-center mb-4 text-3xl shadow-lg">🔒</div>
                <h2 className="text-xl font-extrabold text-stone-800 dark:text-stone-100 mb-2">Focus Mode is on its way</h2>
                <p className="text-stone-600 dark:text-stone-400 text-sm leading-relaxed">
                  Our Chrome extension is currently under review. Soon you&apos;ll be able to block distracting sites and earn your screen time by studying first. Thanks for your patience.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 sm:p-8">
        <div className="h-8 w-48 bg-stone-200 dark:bg-stone-700 rounded-xl animate-pulse mb-6" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-stone-100 dark:bg-stone-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <div className="p-6 sm:p-8 max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          {embedded && onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 text-sm font-medium transition-colors"
            >
              ← Back to Dashboard
            </button>
          )}
        </div>

        {/* Side-by-side: Video left, Settings right (desktop) */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-6 lg:gap-8">
          {/* Video - How Focus Mode works */}
          <div className="order-2 lg:order-1">
            <div className="rounded-2xl overflow-hidden bg-violet-50 dark:from-violet-950/30 dark:to-purple-950/20 border border-violet-200/60 dark:border-violet-800/40 shadow-lg">
              <p className="px-4 pt-4 pb-2 text-sm font-bold text-stone-700 dark:text-stone-300">See how it works</p>
              <div className="aspect-video bg-stone-900 flex items-center justify-center">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-contain"
                  title="WriteScholar Focus Mode — Block distractions, answer quiz to unlock"
                  aria-label="WriteScholar Focus Mode — Block distractions, answer quiz to unlock"
                >
                  <source src="/writescholar-focus-mode-demo.mp4" type="video/mp4" />
                </video>
              </div>
            </div>
          </div>

          {/* Settings column */}
          <div className="order-1 lg:order-2 min-w-0">
            {/* Hero header - matches dashboard aesthetic */}
            <div className="relative rounded-3xl overflow-hidden p-[1px] mb-6" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(168,85,247,0.15) 50%, rgba(236,72,153,0.1) 100%)' }}>
              <div className="rounded-[23px] bg-white/80 dark:bg-stone-800/90 backdrop-blur-xl border border-white/60 dark:border-stone-700/50 p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-violet-600 hover:bg-violet-500 flex items-center justify-center text-2xl shadow-lg shadow-violet-500/30 flex-shrink-0">
                    🔒
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl sm:text-2xl font-extrabold text-stone-800 dark:text-stone-100 mb-1">Focus Mode</h2>
                    <p className="text-stone-600 dark:text-stone-400 text-sm leading-relaxed mb-3">
                      {isPaidUser
                        ? 'Block distracting sites until you solve a puzzle (Sudoku, Memory, Pattern) or answer study questions. Paid: unlimited sites.'
                        : `Block up to ${maxSites} sites until you solve a puzzle or answer study questions. Upgrade for more.`}
                    </p>
                    <a
                      href={FOCUS_MODE_CHROME_EXTENSION_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold shadow-md shadow-violet-500/30 transition-all hover:scale-[1.02]"
                    >
                      Get Chrome Extension →
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Settings card */}
            <div className="rounded-2xl bg-white dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700/50 shadow-sm overflow-hidden">
              {/* Sites to block */}
              <div className="p-6 sm:p-8 border-b border-stone-100 dark:border-stone-700/50">
            <h3 className="font-bold text-stone-800 dark:text-stone-100 mb-1">
              Sites to block
              {maxSites >= 99999 ? (
                <span className="ml-2 text-sm font-normal text-stone-500">({blockedDomains.length} — unlimited)</span>
              ) : (
                <span className="ml-2 text-sm font-normal text-stone-500">({blockedDomains.length} of {maxSites})</span>
              )}
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-4">Toggle sites to block until you solve a puzzle or pass the study quiz</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {presets.map((p) => {
                const active = blockedDomains.includes(p.domain);
                return (
                  <button
                    key={p.domain}
                    onClick={() => toggleBlockedSite(p.domain)}
                    disabled={saving}
                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      active
                        ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-500/25'
                        : 'bg-stone-100 dark:bg-stone-700/80 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-600 border border-stone-200/50 dark:border-stone-600/50'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
              {/* Custom domains (blocked but not in presets) */}
              {blockedDomains
                .filter((d) => !presets.some((p) => p.domain === d))
                .map((domain) => (
                  <button
                    key={domain}
                    onClick={() => toggleBlockedSite(domain)}
                    disabled={saving}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors bg-violet-600 hover:bg-violet-500 text-white shadow-md hover:opacity-90"
                  >
                    {domain}
                  </button>
                ))}
            </div>
            <div className="flex gap-2 mt-4">
              <input
                type="text"
                value={customDomainInput}
                onChange={(e) => { setCustomDomainInput(e.target.value); setAddError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCustomDomain()}
                placeholder="youtube.com, reddit.com..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 transition-all"
              />
              <button
                type="button"
                onClick={handleAddCustomDomain}
                disabled={saving || !customDomainInput.trim()}
                className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Add
              </button>
            </div>
            {addError && (
              <p className="text-sm text-red-500 dark:text-red-400 mt-2">{addError}</p>
            )}
            {blockedDomains.length > 0 && (
              <p className="text-sm text-stone-500 mt-3">
                Blocked: {blockedDomains.join(', ')}
                {!isPaidUser && (
                  <span>
                    {' '}(Free: 3 sites. Paid: unlimited —{' '}
                    {onNavigate ? (
                      <button
                        type="button"
                        onClick={() => onNavigate('pricing')}
                        className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-medium underline underline-offset-1"
                      >
                        Upgrade for more sites
                      </button>
                    ) : (
                      <a
                        href="/pricing"
                        className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-medium"
                      >
                        Upgrade for more sites
                      </a>
                    )}
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Unlock duration */}
          <div className="p-6 sm:p-8 border-b border-stone-100 dark:border-stone-700/50">
            <h3 className="font-bold text-stone-800 dark:text-stone-100 mb-1">Unlock duration</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-3">How long sites stay unlocked after you pass the quiz</p>
            <select
              value={unlockDurationMs}
              onChange={(e) => handleUnlockDurationChange(Number(e.target.value))}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-semibold focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 focus:outline-none transition-all"
            >
              {UNLOCK_DURATION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Quiz customization */}
          <div className="p-6 sm:p-8">
            <h3 className="font-bold text-stone-800 dark:text-stone-100 mb-3">Unlock quiz rules</h3>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-2">Number of questions</label>
                <div className="flex gap-2">
                  {QUESTION_COUNT_OPTIONS.map((n) => (
                    <button
                      key={n}
                      onClick={() => handleQuestionCountChange(n)}
                      disabled={saving}
                      className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        questionCount === n
                          ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-500/25'
                          : 'bg-stone-100 dark:bg-stone-700/80 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-600 border border-stone-200/50 dark:border-stone-600/50'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-2">
                  Minimum correct to unlock ({passThreshold} of {questionCount})
                </label>
                <select
                  value={passThreshold}
                  onChange={(e) => handlePassThresholdChange(Number(e.target.value))}
                  disabled={saving}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-semibold focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 focus:outline-none transition-all"
                >
                  {passThresholdOptions.map((n) => (
                    <option key={n} value={n}>
                      {n} of {questionCount} correct
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {saveSuccess && (
              <p className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold mt-4">✓ Settings saved!</p>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
    </div>
  );
}
