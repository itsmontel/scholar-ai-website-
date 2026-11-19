import { useState } from 'react';
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

  const copyIcon = (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h9" /></svg>
  );
  const copyBtn = 'inline-flex min-h-[44px] shrink-0 items-center gap-[7px] whitespace-nowrap rounded-xl border-2 border-b-4 border-[#E4D4F8] bg-white px-3.5 text-[14.5px] font-black text-[#7733B5] transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-2 dark:border-stone-600 dark:bg-stone-900 dark:text-[#C9A0F0]';
  const select = 'min-h-[36px] border-0 bg-transparent text-[14.5px] font-black text-[#5B2491] focus:outline-none';
  const selectWrap = 'inline-flex min-h-[48px] items-center gap-2 rounded-[14px] border-2 border-[#E4D4F8] bg-[#F7F1FF] px-3.5 text-[14.5px] font-extrabold text-stone-900';
  const open = results ? (isPaid ? results : results.slice(0, FREE_CITATION_PREVIEW)) : [];

  return (
    <div className="flex flex-col gap-6" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
      <GenerationOverlay open={loading} variant="citations" />

      {/* ── FIND SOURCES: purple banner with the topic box ────────── */}
      <section
        aria-label="Find sources"
        className="relative overflow-hidden rounded-[30px] bg-gradient-to-b from-[#A863EA] via-[#8E48CF] to-[#6A2AA6] px-5 pb-6 pt-5 text-white shadow-[0_30px_60px_-34px_rgba(90,45,140,0.8)] sm:px-[30px] sm:pb-[30px] sm:pt-[26px]"
      >
        <span aria-hidden className="pointer-events-none absolute left-1/2 top-[130px] h-[900px] w-[900px] -translate-x-1/2 rounded-full bg-[#8A45C8]" />
        <div className="relative flex flex-col gap-[18px]">
          <div className="flex items-center gap-4">
            <img src="/mascot-pointing.webp" alt="Scholar, the WriteScholar mascot" width={104} height={104} className="h-[76px] w-[76px] shrink-0 object-contain sm:h-[104px] sm:w-[104px]" />
            <div className="min-w-0">
              <h1 className="m-0 text-[28px] font-black leading-[1.05] tracking-[-0.02em] sm:text-[38px]">
                What do you need <span className="text-[#FFD84D]">sources</span> for?
              </h1>
              <p className="m-0 mt-1.5 text-[15px] font-bold text-[#F3EAFF] sm:text-[16.5px]">Describe your topic. You get real sources, each with its reference and a sentence you can use.</p>
            </div>
          </div>
          <div className="flex flex-col gap-3 rounded-[26px] border-b-[6px] border-[#D9C2F2] bg-white p-4 text-stone-900 shadow-[0_30px_50px_-22px_rgba(42,21,64,0.55)]">
            <div className="flex flex-wrap gap-3">
              <label htmlFor="citations-topic-input" className="sr-only">Your topic</label>
              <input
                id="citations-topic-input"
                type="text"
                value={topic}
                onChange={(e) => {
                  setTopic(e.target.value);
                  try { sessionStorage.setItem(DRAFT_KEY, e.target.value); } catch { /* noop */ }
                }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void search(); } }}
                placeholder="For example, the effect of social media on teenage sleep"
                className="min-h-[60px] min-w-0 flex-[1_1_300px] rounded-[18px] border-2 border-[#DCC3F6] bg-[#FBF8FF] px-[18px] text-[18px] font-extrabold text-stone-900 placeholder:text-stone-400 focus:border-[#A560E8] focus:outline-none focus:ring-4 focus:ring-[#A560E8]/20"
              />
              <button
                type="button"
                onClick={search}
                disabled={loading || !topic.trim()}
                className="inline-flex min-h-[60px] items-center justify-center gap-2.5 whitespace-nowrap rounded-[18px] border-2 border-b-[5px] border-[#46A302] bg-[#58CC02] px-[26px] text-[18px] font-black text-white transition-all enabled:hover:-translate-y-0.5 enabled:active:translate-y-0.5 enabled:active:border-b-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Searching…' : 'Find sources'}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <label className={selectWrap}>
                Style
                <select value={style} onChange={(e) => setStyle(e.target.value)} className={select}>
                  {STYLES.map((st) => <option key={st} value={st}>{st}</option>)}
                </select>
              </label>
              <label className={selectWrap}>
                From
                <select value={yearRange} onChange={(e) => setYearRange(e.target.value)} className={select}>
                  {YEARS.map((y) => <option key={y.v} value={y.v}>{y.label}</option>)}
                </select>
              </label>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className={`rounded-2xl border-2 p-4 ${upgrade ? 'border-[#A560E8]/40 bg-[#F3EAFF] dark:bg-[#A560E8]/10' : 'border-[#FF4B4B]/40 bg-[#FFF0F0] dark:bg-[#FF4B4B]/10'}`}>
          <p className={`m-0 text-[15px] font-extrabold ${upgrade ? 'text-[#7733B5]' : 'text-[#D63A3A]'}`}>{error}</p>
          {upgrade && (
            <button
              type="button"
              onClick={() => onNavigate('pricing')}
              className="mt-2 inline-flex min-h-[44px] items-center rounded-xl border-2 border-b-4 border-[#8A48C7] bg-[#A560E8] px-4 text-[14.5px] font-black text-white transition-all active:translate-y-0.5 active:border-b-2"
            >
              See plans
            </button>
          )}
        </div>
      )}

      {loading && (
        <div className="flex flex-col gap-4">
          {[0, 1, 2].map((i) => <div key={i} className="h-[190px] animate-pulse rounded-[24px] bg-stone-100 dark:bg-stone-800" />)}
        </div>
      )}

      {!loading && results && results.length === 0 && (
        <div className="rounded-[24px] border-2 border-dashed border-[#C9A0F0] bg-[#F7F1FF] p-8 text-center dark:bg-[#A560E8]/10">
          <p className="m-0 text-[19px] font-black text-stone-900 dark:text-stone-50">No sources found</p>
          <p className="m-0 mt-1 text-[15px] font-bold text-stone-600 dark:text-stone-400">Try a broader topic or a wider range of years.</p>
        </div>
      )}

      {!loading && results && results.length > 0 && (
        <>
          <div className="flex flex-wrap items-center gap-3.5">
            <h2 className="m-0 text-[22px] font-black tracking-[-0.01em] text-stone-900 dark:text-stone-50">{results.length} {results.length === 1 ? 'source' : 'sources'} found</h2>
            <span aria-hidden className="h-px flex-1 bg-stone-200 dark:bg-stone-700" />
            <button type="button" onClick={() => copy(open.map((c) => strip(c.citation)).join('\n\n'), -1)} className={copyBtn}>
              {copyIcon}
              {copiedIdx === -1 ? 'Copied' : open.length === 1 ? 'Copy the reference' : `Copy all ${open.length} references`}
            </button>
          </div>
          {keywords.length > 0 && (
            <div className="-mt-2 flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-[13.5px] font-extrabold text-stone-600 dark:text-stone-400">Searched for</span>
              {keywords.map((k) => (
                <span key={k} className="rounded-full bg-[#F3EAFF] px-2.5 py-1 text-[13px] font-extrabold text-[#5B2491] dark:bg-[#A560E8]/20 dark:text-[#C9A0F0]">{k}</span>
              ))}
            </div>
          )}

          <ul className="m-0 flex list-none flex-col gap-4 p-0">
            {results.map((c, i) => {
              const locked = !isPaid && i >= FREE_CITATION_PREVIEW;
              return (
                <li key={i} className="relative overflow-hidden rounded-[24px] border border-[#E4D4F8] bg-white p-5 shadow-[0_16px_34px_-26px_rgba(90,45,140,0.55)] dark:border-stone-700 dark:bg-stone-900">
                  <div className={`flex flex-col gap-3 ${locked ? 'pointer-events-none select-none blur-[5px]' : ''}`} aria-hidden={locked || undefined}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#A560E8] text-[16px] font-black text-white">{i + 1}</span>
                      {c.type && <span className="rounded-full bg-[#F3EAFF] px-3 py-1 text-[13px] font-black capitalize text-[#5B2491] dark:bg-[#A560E8]/20 dark:text-[#C9A0F0]">{c.type}</span>}
                      {c.year && <span className="rounded-full bg-[#F3EAFF] px-3 py-1 text-[13px] font-black text-[#5B2491] dark:bg-[#A560E8]/20 dark:text-[#C9A0F0]">{c.year}</span>}
                      {c.accessibility && <span className="rounded-full bg-[#E6F9D2] px-3 py-1 text-[13px] font-black text-[#14532D]">{c.accessibility}</span>}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-[#F7F1FF] px-3.5 py-3 dark:bg-stone-800">
                      <div className="min-w-0 flex-[1_1_380px]">
                        <p className="m-0 text-[11.5px] font-black uppercase tracking-[0.14em] text-[#7733B5] dark:text-[#C9A0F0]">Reference, {style}</p>
                        <p className="m-0 mt-0.5 text-[15px] font-bold leading-[1.45] text-stone-900 dark:text-stone-100 [&_i]:italic" dangerouslySetInnerHTML={{ __html: c.citation }} />
                      </div>
                      <button type="button" onClick={() => copy(strip(c.citation), i)} className={copyBtn}>{copyIcon}{copiedIdx === i ? 'Copied' : 'Copy'}</button>
                    </div>
                    {c.ready_to_use_sentence && (
                      <div className="flex flex-wrap items-center gap-3 rounded-2xl border-2 border-dashed border-[#DCC3F6] px-3.5 py-3 dark:border-stone-600">
                        <div className="min-w-0 flex-[1_1_380px]">
                          <p className="m-0 text-[11.5px] font-black uppercase tracking-[0.14em] text-[#7733B5] dark:text-[#C9A0F0]">A sentence you can use</p>
                          <p className="m-0 mt-0.5 text-[15px] font-bold leading-[1.45] text-stone-900 dark:text-stone-100">
                            {c.ready_to_use_sentence}
                            {c.in_text_citation && !c.ready_to_use_sentence.includes(c.in_text_citation) && (
                              <> <span className="whitespace-nowrap rounded-full bg-[#FFF1C2] px-2 py-px font-black text-[#5A4500]">{c.in_text_citation}</span></>
                            )}
                          </p>
                        </div>
                        <button type="button" onClick={() => copy(c.ready_to_use_sentence as string, 1000 + i)} className={copyBtn}>{copyIcon}{copiedIdx === 1000 + i ? 'Copied' : 'Copy'}</button>
                      </div>
                    )}
                    {Array.isArray(c.key_points) && c.key_points.length > 0 && (
                      <ul className="m-0 flex list-none flex-col gap-1 p-0">
                        {c.key_points.slice(0, 3).map((pt, k) => (
                          <li key={k} className="flex gap-2 text-[14.5px] font-bold text-stone-700 dark:text-stone-300">
                            <span aria-hidden className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#A560E8]" />
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {locked && (
                    <button
                      type="button"
                      onClick={() => { trackEvent('upgrade_clicked', { source: 'citations_locked_card' }); openUpgradePaywall('citations_locked_card'); }}
                      className="absolute inset-0 flex items-center justify-center bg-white/40 dark:bg-stone-900/40"
                      aria-label="Unlock this source with Pro"
                    >
                      <span className="inline-flex min-h-[44px] items-center gap-2 rounded-full border-2 border-b-4 border-[#8A48C7] bg-[#A560E8] px-4 text-[14.5px] font-black text-white">
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2.8} viewBox="0 0 24 24" aria-hidden><rect x="5" y="11" width="14" height="9" rx="2" /><path strokeLinecap="round" d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
                        Unlock with Pro
                      </span>
                    </button>
                  )}
                </li>
              );
            })}
          </ul>

          {!isPaid && results.length > FREE_CITATION_PREVIEW && (
            <div className="flex flex-wrap items-center gap-4 rounded-[24px] border border-[#E4D4F8] bg-[#F7F1FF] p-5 dark:border-stone-700 dark:bg-[#A560E8]/10">
              <div className="min-w-0 flex-[1_1_300px]">
                <p className="m-0 text-[18px] font-black text-stone-900 dark:text-stone-50">{results.length - FREE_CITATION_PREVIEW} more sources are ready for your topic</p>
                <p className="m-0 mt-0.5 text-[14.5px] font-bold text-stone-600 dark:text-stone-400">Free shows the first {FREE_CITATION_PREVIEW}. Pro opens every source.</p>
              </div>
              <button
                type="button"
                onClick={() => { trackEvent('upgrade_clicked', { source: 'citations_unlock_banner' }); openUpgradePaywall('citations_unlock_banner'); }}
                className="inline-flex min-h-[54px] items-center whitespace-nowrap rounded-[16px] border-2 border-b-[5px] border-[#46A302] bg-[#58CC02] px-6 text-[16.5px] font-black text-white transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-2"
              >
                Unlock all {results.length} sources
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
