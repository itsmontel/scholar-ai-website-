import { useState } from 'react';
import PreviewStrip from './PreviewStrip';

/* ═══════════════════════════════════════════════════════════════
   CitationsPanel — in-page source finder.
   POST /api/analysis/citation-search → { citations[], keywords[],
   searchStrategies[] }. 429 = monthly limit (free plan).
   Lives inside the Documents workspace shell — never navigates.
   ═══════════════════════════════════════════════════════════════ */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

type Citation = {
  citation: string; // HTML (may contain <i>)
  type?: string;
  relevance?: string;
  key_points?: string[];
  ready_to_use_sentence?: string;
  in_text_citation?: string;
  year?: string;
  accessibility?: string;
};

const STYLES = ['APA', 'MLA', 'Chicago', 'Harvard', 'IEEE', 'Vancouver'];
const YEARS: { v: string; label: string }[] = [
  { v: 'all', label: 'Any year' },
  { v: '3', label: 'Last 3 years' },
  { v: '5', label: 'Last 5 years' },
  { v: '10', label: 'Last 10 years' },
];

const DRAFT_KEY = 'writescholar_citations_draft';

export default function CitationsPanel({ onNavigate }: { onNavigate: (page: string, slug?: string, options?: unknown) => void }) {
  const [topic, setTopic] = useState(() => {
    try { return sessionStorage.getItem(DRAFT_KEY) || ''; } catch { return ''; }
  });
  const [style, setStyle] = useState('APA');
  const [yearRange, setYearRange] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upgrade, setUpgrade] = useState(false);
  const [results, setResults] = useState<Citation[] | null>(null);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const search = async () => {
    const t = topic.trim();
    if (!t || loading) return;
    setLoading(true);
    setError(null);
    setUpgrade(false);
    try {
      const minYear =
        yearRange === 'all' ? null : new Date().getFullYear() - parseInt(yearRange, 10);
      const res = await fetch(`${API_URL}/analysis/citation-search`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          researchTopic: t,
          citationStyle: style,
          numberOfCitations: 10,
          minYear,
          yearRange,
        }),
      });
      const json = await res.json();
      if (res.status === 429) {
        setUpgrade(true);
        setError(json?.message || "You've hit this month's citation searches. Upgrade for more.");
        return;
      }
      if (!res.ok || json?.success === false) {
        throw new Error(json?.message || `Search failed (${res.status})`);
      }
      const data = json?.data ?? json;
      setResults(Array.isArray(data?.citations) ? data.citations : []);
      setKeywords(Array.isArray(data?.keywords) ? data.keywords : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not run that search.');
    } finally {
      setLoading(false);
    }
  };

  const copy = (text: string, idx: number) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx((c) => (c === idx ? null : c)), 1600);
    } catch { /* clipboard blocked — non-fatal */ }
  };
  const strip = (html: string) => html.replace(/<[^>]+>/g, '');

  return (
    <div>
      {/* Search card */}
      <div className="rounded-3xl border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-5 sm:p-6">
        <label className="block text-[13px] font-extrabold text-stone-700 dark:text-stone-200 mb-2">
          What are you researching?
        </label>
        <textarea
          value={topic}
          onChange={(e) => {
            setTopic(e.target.value);
            try { sessionStorage.setItem(DRAFT_KEY, e.target.value); } catch { /* noop */ }
          }}
          rows={3}
          placeholder="e.g. the effect of social media on adolescent sleep quality"
          className="w-full px-4 py-3 rounded-2xl border-2 border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#1CB0F6]/40 focus:border-[#1CB0F6]/40 resize-none"
        />
        <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wide text-stone-400">Style</span>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="px-3 py-2 rounded-xl border-2 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-[13px] font-bold text-stone-700 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-[#1CB0F6]/40"
            >
              {STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wide text-stone-400">Recency</span>
            <select
              value={yearRange}
              onChange={(e) => setYearRange(e.target.value)}
              className="px-3 py-2 rounded-xl border-2 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-[13px] font-bold text-stone-700 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-[#1CB0F6]/40"
            >
              {YEARS.map((y) => <option key={y.v} value={y.v}>{y.label}</option>)}
            </select>
          </div>
          <button
            type="button"
            onClick={search}
            disabled={loading || !topic.trim()}
            className="sm:ml-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#1CB0F6] hover:bg-[#1486B5] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-extrabold uppercase tracking-wide border-2 border-b-4 border-[#1486B5] active:border-b-2 active:translate-y-0.5 transition-all"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity={0.3} strokeWidth={3} />
                  <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth={3} strokeLinecap="round" />
                </svg>
                Searching…
              </>
            ) : 'Find sources'}
          </button>
        </div>
      </div>

      <div className="mt-8">
        <PreviewStrip
          title="What your sources look like"
          subtitle="Real, citable references with ready-to-use sentences and in-text citations in your style."
          tint="#1CB0F6"
          tintShadowRgb="28,176,246"
          items={[
            { kind: 'video', src: '/writescholar-citation-finder-demo.mp4', label: 'Finding sources' },
            { kind: 'image', src: '/citations-preview.png', label: 'Formatted citations' },
          ]}
        />
      </div>

      {error && (
        <div className={`mt-4 rounded-2xl border-2 p-4 ${upgrade ? 'border-[#1CB0F6]/40 bg-[#DDF4FF] dark:bg-[#1CB0F6]/10' : 'border-[#FF4B4B]/40 bg-[#FFF0F0] dark:bg-[#FF4B4B]/10'}`}>
          <p className={`text-sm font-extrabold ${upgrade ? 'text-[#1486B5]' : 'text-[#D63A3A]'}`}>{error}</p>
          {upgrade && (
            <button
              type="button"
              onClick={() => onNavigate('pricing')}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1CB0F6] hover:bg-[#1486B5] text-white text-xs font-extrabold uppercase tracking-wide border-2 border-b-[3px] border-[#1486B5] active:border-b-2 active:translate-y-0.5 transition-all"
            >
              See plans
            </button>
          )}
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="mt-5 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-stone-100 dark:bg-stone-800 animate-pulse" />
          ))}
        </div>
      )}

      {/* Results */}
      {!loading && results && (
        <div className="mt-5">
          {keywords.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wide text-stone-400 mr-1">Search terms</span>
              {keywords.map((k) => (
                <span key={k} className="px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-[11px] font-bold text-stone-600 dark:text-stone-300">{k}</span>
              ))}
            </div>
          )}
          {results.length === 0 ? (
            <div className="rounded-2xl border-2 border-stone-200 dark:border-stone-700 p-8 text-center">
              <p className="text-sm font-extrabold text-stone-700 dark:text-stone-200">No sources found</p>
              <p className="mt-1 text-xs text-stone-500">Try a broader topic or widen the year range.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((c, i) => (
                <div key={i} className="rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#DDF4FF] dark:bg-[#1CB0F6]/15 text-[#1CB0F6] text-[11px] font-extrabold">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-[13.5px] leading-relaxed text-stone-800 dark:text-stone-100 [&_i]:italic"
                        dangerouslySetInnerHTML={{ __html: c.citation }}
                      />
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {c.type && <span className="px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-[10px] font-extrabold uppercase tracking-wide text-stone-500">{c.type}</span>}
                        {c.year && <span className="px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-[10px] font-bold text-stone-500">{c.year}</span>}
                        {c.accessibility && <span className="px-2 py-0.5 rounded-full bg-[#E5F8D0] text-[10px] font-extrabold text-[#46A302]">{c.accessibility}</span>}
                      </div>
                      {c.ready_to_use_sentence && (
                        <p className="mt-2.5 text-[12.5px] italic text-stone-600 dark:text-stone-300 border-l-2 border-[#1CB0F6]/30 pl-3">
                          {c.ready_to_use_sentence}
                        </p>
                      )}
                      {Array.isArray(c.key_points) && c.key_points.length > 0 && (
                        <ul className="mt-2.5 space-y-1">
                          {c.key_points.slice(0, 3).map((p, k) => (
                            <li key={k} className="flex gap-2 text-[12px] text-stone-600 dark:text-stone-300">
                              <span className="text-[#1CB0F6] font-extrabold">•</span>
                              <span>{p}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => copy(strip(c.citation), i)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-stone-200 dark:border-stone-700 text-[11px] font-extrabold text-stone-600 dark:text-stone-300 hover:border-[#1CB0F6]/40 hover:text-[#1486B5] transition-colors"
                        >
                          {copiedIdx === i ? 'Copied ✓' : 'Copy citation'}
                        </button>
                        {c.in_text_citation && (
                          <button
                            type="button"
                            onClick={() => copy(c.in_text_citation as string, 1000 + i)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-stone-200 dark:border-stone-700 text-[11px] font-extrabold text-stone-600 dark:text-stone-300 hover:border-[#1CB0F6]/40 hover:text-[#1486B5] transition-colors"
                          >
                            {copiedIdx === 1000 + i ? 'Copied ✓' : `In-text: ${c.in_text_citation}`}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!loading && !results && !error && (
        <div className="mt-6 rounded-2xl border-2 border-dashed border-stone-200 dark:border-stone-700 p-8 text-center">
          <p className="text-sm font-extrabold text-stone-700 dark:text-stone-200">Find credible, citable sources in seconds</p>
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400 max-w-md mx-auto">
            Describe your topic and we'll surface real references with ready-to-use sentences and in-text citations in your chosen style.
          </p>
        </div>
      )}
    </div>
  );
}
