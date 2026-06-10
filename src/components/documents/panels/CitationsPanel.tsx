import { useState } from 'react';
import PreviewStrip from './PreviewStrip';
import GenerationOverlay from '../../common/GenerationOverlay';
import { trackEvent } from '../../../utils/analytics';
import { openUpgradePaywall } from '../../../utils/paywall';

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

/** Free users see this many full citations; the rest are locked behind Pro
 *  (blurred + count badge) so they feel the quality on their own topic without
 *  walking away with a finished bibliography. */
const FREE_CITATION_PREVIEW = 3;

export default function CitationsPanel({ onNavigate, isPaid = false }: { onNavigate: (page: string, slug?: string, options?: unknown) => void; isPaid?: boolean }) {
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
        setError(json?.message || "You've hit your citation search limit. Upgrade for more.");
        return;
      }
      if (!res.ok || json?.success === false) {
        throw new Error(json?.message || `Search failed (${res.status})`);
      }
      const data = json?.data ?? json;
      const citations = Array.isArray(data?.citations) ? data.citations : [];
      setResults(citations);
      setKeywords(Array.isArray(data?.keywords) ? data.keywords : []);
      trackEvent('preview_ran', { feature: 'citations', results: citations.length });
      if (!isPaid && citations.length > FREE_CITATION_PREVIEW) {
        trackEvent('lock_viewed', { feature: 'citations', locked: citations.length - FREE_CITATION_PREVIEW });
      }
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
      <GenerationOverlay open={loading} variant="citations" />

      {/* ── SEARCH CARD — premium gradient frame ──────────────────── */}
      <div className="relative rounded-[28px] p-[2px] bg-gradient-to-br from-[#7FD4FF] via-[#1CB0F6] to-[#1486B5] shadow-[0_28px_60px_-30px_rgba(28,176,246,0.7)]">
        <div className="relative overflow-hidden rounded-[26px] bg-white dark:bg-stone-900 p-5 sm:p-7">
          {/* Ambient glow + faint grid texture */}
          <div className="pointer-events-none absolute -top-24 -right-20 w-64 h-64 rounded-full bg-[#1CB0F6]/15 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute -bottom-24 -left-16 w-56 h-56 rounded-full bg-[#7FD4FF]/15 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute inset-0 opacity-[0.035] dark:opacity-[0.06]" style={{ backgroundImage: 'linear-gradient(rgba(120,113,108,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(120,113,108,0.8) 1px, transparent 1px)', backgroundSize: '26px 26px' }} aria-hidden />

          {/* Header */}
          <div className="relative flex items-center gap-3.5 mb-5">
            <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5BC5FF] to-[#1CB0F6] text-white text-xl border-2 border-b-[3px] border-[#1486B5] shadow-[0_10px_24px_-10px_rgba(28,176,246,0.9)]" aria-hidden>
              🔖
              <span className="absolute -top-1.5 -right-1.5 text-[#FFC800] text-sm motion-safe:animate-pulse">✦</span>
            </span>
            <div className="min-w-0">
              <h2 className="text-[19px] font-extrabold text-stone-900 dark:text-stone-50 leading-tight" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>Find citable sources</h2>
              <p className="text-[12.5px] font-semibold text-stone-500 dark:text-stone-400 leading-snug">Describe your topic — get real references with ready-to-use sentences in your style.</p>
            </div>
          </div>

          <label htmlFor="citations-topic-input" className="relative block text-[13px] font-extrabold text-stone-700 dark:text-stone-200 mb-2">
            What are you researching?
          </label>
          <textarea
            id="citations-topic-input"
            value={topic}
            onChange={(e) => {
              setTopic(e.target.value);
              try { sessionStorage.setItem(DRAFT_KEY, e.target.value); } catch { /* noop */ }
            }}
            rows={3}
            placeholder="e.g. the effect of social media on adolescent sleep quality"
            className="relative w-full px-4 py-3.5 rounded-2xl border-2 border-stone-200 dark:border-stone-700 bg-stone-50/80 dark:bg-stone-800/80 text-sm text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-4 focus:ring-[#1CB0F6]/20 focus:border-[#1CB0F6] resize-none transition-all"
          />
          <div className="relative mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <label className="flex items-center gap-2">
              <span className="text-[10.5px] font-extrabold uppercase tracking-wide text-stone-400">Style</span>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="px-3 py-2.5 rounded-xl border-2 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-[13px] font-bold text-stone-700 dark:text-stone-200 focus:outline-none focus:ring-4 focus:ring-[#1CB0F6]/20 focus:border-[#1CB0F6] transition-all"
              >
                {STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label className="flex items-center gap-2">
              <span className="text-[10.5px] font-extrabold uppercase tracking-wide text-stone-400">Recency</span>
              <select
                value={yearRange}
                onChange={(e) => setYearRange(e.target.value)}
                className="px-3 py-2.5 rounded-xl border-2 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-[13px] font-bold text-stone-700 dark:text-stone-200 focus:outline-none focus:ring-4 focus:ring-[#1CB0F6]/20 focus:border-[#1CB0F6] transition-all"
              >
                {YEARS.map((y) => <option key={y.v} value={y.v}>{y.label}</option>)}
              </select>
            </label>
            <button
              type="button"
              onClick={search}
              disabled={loading || !topic.trim()}
              className="group sm:ml-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#1CB0F6] to-[#0E9BE0] hover:from-[#0E9BE0] hover:to-[#1486B5] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 text-white text-sm font-extrabold uppercase tracking-wide border-2 border-b-4 border-[#1486B5] enabled:hover:-translate-y-0.5 active:border-b-2 active:translate-y-0.5 transition-all shadow-[0_12px_28px_-12px_rgba(28,176,246,0.9)]"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity={0.3} strokeWidth={3} />
                    <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth={3} strokeLinecap="round" />
                  </svg>
                  Searching…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.6} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 110-16 8 8 0 010 16z" /></svg>
                  Find sources
                </>
              )}
            </button>
          </div>

          {/* What you'll get — value reinforcement chips */}
          <div className="relative mt-5 pt-4 border-t border-stone-100 dark:border-stone-800 flex flex-wrap items-center gap-1.5">
            <span className="text-[10.5px] font-extrabold uppercase tracking-wide text-stone-400 mr-0.5">You'll get</span>
            {['📄 Real sources', '✍️ Ready-to-use sentences', '🏷️ In-text citations'].map((c) => (
              <span key={c} className="px-2.5 py-1 rounded-full bg-[#F5FBFF] dark:bg-[#1CB0F6]/10 border border-[#1CB0F6]/25 text-[11px] font-extrabold text-[#1486B5] dark:text-[#1CB0F6]">{c}</span>
            ))}
          </div>
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
              {results.map((c, i) => {
                const locked = !isPaid && i >= FREE_CITATION_PREVIEW;
                return (
                <div key={i} className="relative rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-4 sm:p-5 overflow-hidden">
                  <div className={`flex items-start gap-3 ${locked ? 'blur-[5px] select-none pointer-events-none' : ''}`} aria-hidden={locked || undefined}>
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
                  {locked && (
                    <button
                      type="button"
                      onClick={() => { trackEvent('upgrade_clicked', { source: 'citations_locked_card' }); openUpgradePaywall('citations_locked_card'); }}
                      className="absolute inset-0 flex items-center justify-center bg-white/40 dark:bg-stone-900/40"
                      aria-label="Unlock this source with Pro"
                    >
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1CB0F6] text-white text-[11px] font-extrabold uppercase tracking-wide border-2 border-b-[3px] border-[#1486B5] shadow-lg">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
                          <rect x="5" y="11" width="14" height="9" rx="2" />
                          <path strokeLinecap="round" d="M8 11V8a4 4 0 0 1 8 0v3" />
                        </svg>
                        Unlock with Pro
                      </span>
                    </button>
                  )}
                </div>
                );
              })}
            </div>
          )}
          {!isPaid && results.length > FREE_CITATION_PREVIEW && (
            <div className="mt-4 rounded-2xl border-2 border-[#1CB0F6]/40 bg-gradient-to-br from-[#DDF4FF] to-white dark:from-[#1CB0F6]/12 dark:to-stone-900 p-4 sm:p-5 text-center">
              <p className="text-[14px] font-extrabold text-[#1486B5] dark:text-[#7FD4FF]">
                {results.length - FREE_CITATION_PREVIEW} more sources ready for your topic
              </p>
              <p className="mt-1 text-[12px] font-bold text-stone-600 dark:text-stone-300 leading-snug">
                Free shows the first {FREE_CITATION_PREVIEW}. Unlock every source — plus the full bibliography — with Pro.
              </p>
              <button
                type="button"
                onClick={() => { trackEvent('upgrade_clicked', { source: 'citations_unlock_banner' }); openUpgradePaywall('citations_unlock_banner'); }}
                className="mt-3 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#1CB0F6] hover:bg-[#1486B5] text-white text-[12px] font-extrabold uppercase tracking-wide border-2 border-b-[3px] border-[#1486B5] active:border-b-2 active:translate-y-0.5 transition-all"
              >
                Unlock all {results.length} sources
              </button>
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
