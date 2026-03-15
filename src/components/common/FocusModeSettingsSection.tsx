import { useState, useEffect } from 'react';
import { FOCUS_MODE_COMING_SOON, FOCUS_MODE_CHROME_EXTENSION_URL } from '../../constants/focusMode';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const UNLOCK_DURATION_OPTIONS = [
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
  const [maxSites, setMaxSites] = useState(isPaidUser ? 20 : 1);

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
          setMaxSites(d1.data.maxSites ?? (isPaidUser ? 20 : 1));
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
      setAddError(maxSites === 1 ? 'Free plan: block 1 site only. Upgrade for more.' : `Maximum ${maxSites} sites. Remove one to add another. Upgrade to Premium for unlimited.`);
      return;
    }
    const unlimited = maxSites >= 99999;
    if (!unlimited && blockedDomains.length + toAdd.length > maxSites) {
      setAddError(maxSites === 1 ? 'Free plan: block 1 site only. Upgrade for more.' : `Maximum ${maxSites} sites allowed. Upgrade to Premium for unlimited.`);
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
        <div className="p-6 sm:p-8 max-w-2xl">
          {embedded && onBack && (
            <button
              onClick={onBack}
              className="mb-6 flex items-center gap-2 text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 text-sm font-medium"
            >
              ← Back to Dashboard
            </button>
          )}
          <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl p-8 sm:p-10 text-center">
            <span className="inline-flex items-center px-3 py-1 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 rounded-full text-sm font-semibold mb-6">
              Coming Soon
            </span>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-6 text-3xl">
              🔒
            </div>
            <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-3">Focus Mode is on its way</h2>
            <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed max-w-md mx-auto">
              Our Chrome extension is currently under review. Soon you&apos;ll be able to block distracting sites and earn your screen time by studying first. Thanks for your patience.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 sm:p-8">
        <div className="h-8 w-48 bg-stone-200 dark:bg-stone-700 rounded-lg animate-pulse mb-6" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 bg-stone-100 dark:bg-stone-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <div className="p-6 sm:p-8 max-w-2xl">
        {embedded && onBack && (
          <button
            onClick={onBack}
            className="mb-6 flex items-center gap-2 text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 text-sm font-medium"
          >
            ← Back to Dashboard
          </button>
        )}

        <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl p-6 sm:p-8">
          <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-2">Focus Mode Settings</h2>
          <p className="text-stone-600 dark:text-stone-400 text-sm mb-6">
            {isPaidUser
              ? 'Block distracting sites until you answer study questions. Pro: 10 sites. Premium: unlimited. Configure questions and unlock duration below.'
              : 'Block 1 site until you answer study questions. Pro: 10 sites. Premium: unlimited. Upgrade for more.'}
          </p>

          {/* Sites to block */}
          <div className="mb-8">
            <h3 className="font-semibold text-stone-800 dark:text-stone-200 mb-3">
              Sites to block
              {maxSites >= 99999 ? (
                <span className="ml-2 text-sm font-normal text-stone-500">({blockedDomains.length} — unlimited)</span>
              ) : (
                <span className="ml-2 text-sm font-normal text-stone-500">({blockedDomains.length} of {maxSites})</span>
              )}
            </h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {presets.map((p) => {
                const active = blockedDomains.includes(p.domain);
                return (
                  <button
                    key={p.domain}
                    onClick={() => toggleBlockedSite(p.domain)}
                    disabled={saving}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      active
                        ? 'bg-violet-600 text-white'
                        : 'bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-600'
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
                    className="px-4 py-2 rounded-xl text-sm font-medium transition-colors bg-violet-600 text-white hover:bg-violet-500"
                  >
                    {domain}
                  </button>
                ))}
            </div>
            <div className="flex gap-2 mt-3">
              <input
                type="text"
                value={customDomainInput}
                onChange={(e) => { setCustomDomainInput(e.target.value); setAddError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCustomDomain()}
                placeholder="youtube.com, reddit.com..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              />
              <button
                type="button"
                onClick={handleAddCustomDomain}
                disabled={saving || !customDomainInput.trim()}
                className="px-4 py-2.5 bg-violet-600 text-white rounded-xl font-medium text-sm hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    {' '}(Free: 1 site. Pro: 10. Premium: unlimited —{' '}
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
                    )
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Unlock duration */}
          <div className="mb-8">
            <h3 className="font-semibold text-stone-800 dark:text-stone-200 mb-3">Unlock duration</h3>
            <select
              value={unlockDurationMs}
              onChange={(e) => handleUnlockDurationChange(Number(e.target.value))}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-medium"
            >
              {UNLOCK_DURATION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-stone-500 mt-1">How long sites stay unlocked after you pass the quiz</p>
          </div>

          {/* Quiz customization */}
          <div className="mb-8">
            <h3 className="font-semibold text-stone-800 dark:text-stone-200 mb-3">Unlock quiz rules</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-stone-600 dark:text-stone-400 mb-2">Number of questions</label>
                <div className="flex gap-2">
                  {QUESTION_COUNT_OPTIONS.map((n) => (
                    <button
                      key={n}
                      onClick={() => handleQuestionCountChange(n)}
                      disabled={saving}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                        questionCount === n
                          ? 'bg-violet-600 text-white'
                          : 'bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-600'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-stone-600 dark:text-stone-400 mb-2">
                  Minimum correct to unlock (e.g. {passThreshold} of {questionCount})
                </label>
                <select
                  value={passThreshold}
                  onChange={(e) => handlePassThresholdChange(Number(e.target.value))}
                  disabled={saving}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-medium"
                >
                  {passThresholdOptions.map((n) => (
                    <option key={n} value={n}>
                      {n} of {questionCount} correct
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {saveSuccess && (
            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mb-4">Settings saved!</p>
          )}

          <a
            href={FOCUS_MODE_CHROME_EXTENSION_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-medium text-sm"
          >
            Get Chrome Extension →
          </a>
        </div>
      </div>
    </div>
  );
}
