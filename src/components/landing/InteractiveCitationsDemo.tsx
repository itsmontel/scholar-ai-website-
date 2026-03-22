import { useState } from 'react';

const DEMO_SOURCES = [
  {
    id: '1',
    title: 'Mitigation pathways compatible with 1.5°C in the context of sustainable development',
    authors: 'Rogelj, J., D. Shindell, et al.',
    year: 2018,
    journal: 'Global Environmental Change',
    peerReviewed: true,
    apa: 'Rogelj, J., Shindell, D., et al. (2018). Mitigation pathways compatible with 1.5°C in the context of sustainable development. Global Environmental Change.',
  },
  {
    id: '2',
    title: 'Public opinion on climate policy: A cross-national study',
    authors: 'Stokes, L. C., W. W. Dolan',
    year: 2020,
    journal: 'Nature Climate Change',
    peerReviewed: true,
    apa: 'Stokes, L. C., & Dolan, W. W. (2020). Public opinion on climate policy: A cross-national study. Nature Climate Change.',
  },
  {
    id: '3',
    title: 'Renewable energy adoption and grid stability: A meta-analysis',
    authors: 'Kumar, P., S. Ahmed',
    year: 2022,
    journal: 'Energy Policy',
    peerReviewed: true,
    apa: 'Kumar, P., & Ahmed, S. (2022). Renewable energy adoption and grid stability: A meta-analysis. Energy Policy.',
  },
] as const;

export type InteractiveCitationsDemoVariant = 'full' | 'side-left' | 'side-right';

function formatCitation(
  style: 'APA' | 'MLA' | 'Chicago',
  src: (typeof DEMO_SOURCES)[number]
) {
  if (style === 'APA') return src.apa;
  if (style === 'MLA') return `${src.authors.split(',')[0]}. "${src.title}." ${src.journal}, ${src.year}.`;
  return `${src.authors.split(',')[0]}. "${src.title}." ${src.journal} (${src.year}).`;
}

export default function InteractiveCitationsDemo({
  variant = 'full',
}: {
  variant?: InteractiveCitationsDemoVariant;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(DEMO_SOURCES[0].id);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [style, setStyle] = useState<'APA' | 'MLA' | 'Chicago'>('APA');

  const copy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const sourcesForSideLeft = DEMO_SOURCES.slice(0, 2);
  const focusSource = DEMO_SOURCES[2];

  if (variant === 'side-left') {
    return (
      <div className="rounded-2xl border border-sky-200/80 dark:border-sky-800/50 bg-gradient-to-b from-sky-50/90 to-white dark:from-sky-950/30 dark:to-stone-900/80 p-3 shadow-sm ring-1 ring-sky-100/80 dark:ring-sky-900/40">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-sky-700 dark:text-sky-400 mb-2 text-center">Peer-reviewed</p>
        <div className="rounded-lg border border-stone-200/90 dark:border-stone-600 bg-white/95 dark:bg-stone-900/60 p-2 mb-2 shadow-inner">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-0.5">Topic</p>
          <p className="text-[11px] text-stone-800 dark:text-stone-100 font-medium leading-snug line-clamp-3">
            Climate policy and renewable energy transitions
          </p>
        </div>
        <ul className="space-y-2" role="list">
          {sourcesForSideLeft.map((src) => {
            const isOpen = expandedId === src.id;
            return (
              <li key={src.id}>
                <button
                  type="button"
                  onClick={() => setExpandedId(isOpen ? null : src.id)}
                  onMouseEnter={() => setExpandedId(src.id)}
                  className={`w-full text-left rounded-lg border transition-all duration-200 p-2 ${
                    isOpen
                      ? 'border-sky-400/80 bg-sky-50/90 dark:bg-sky-950/40 ring-1 ring-sky-300/50 dark:ring-sky-700/50'
                      : 'border-stone-200/90 dark:border-stone-600 bg-white/80 dark:bg-stone-800/50 hover:border-sky-300/70'
                  }`}
                >
                  <p className="text-[11px] font-semibold text-stone-900 dark:text-stone-50 leading-snug line-clamp-2">{src.title}</p>
                  <p className="text-[9px] text-stone-500 dark:text-stone-400 mt-0.5">{src.year} · {src.journal}</p>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  if (variant === 'side-right') {
    const t = formatCitation(style, focusSource);
    return (
      <div className="rounded-2xl border border-violet-200/80 dark:border-violet-800/50 bg-gradient-to-b from-violet-50/90 to-white dark:from-violet-950/25 dark:to-stone-900/80 p-3 shadow-sm ring-1 ring-violet-100/80 dark:ring-violet-900/40">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-violet-700 dark:text-violet-400 mb-2 text-center">Copy & export</p>
        <div className="flex rounded-lg border border-violet-200/90 dark:border-violet-700/60 bg-white/90 dark:bg-stone-800/80 p-0.5 mb-2">
          {(['APA', 'MLA', 'Chicago'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStyle(s)}
              className={`flex-1 px-1.5 py-1 rounded-md text-[10px] font-semibold transition-all ${
                style === s ? 'bg-violet-600 text-white shadow-sm' : 'text-stone-600 dark:text-stone-300 hover:bg-violet-50 dark:hover:bg-violet-900/40'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <p className="text-[9px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-1">Citation</p>
        <p className="text-[10px] text-stone-700 dark:text-stone-300 leading-relaxed font-mono bg-stone-50 dark:bg-stone-950/50 rounded-lg p-2 border border-stone-100 dark:border-stone-700 line-clamp-6">
          {t}
        </p>
        <button
          type="button"
          onClick={() => copy(focusSource.id, t)}
          className="mt-2 w-full text-center text-[11px] font-semibold text-violet-700 dark:text-violet-400 hover:underline"
        >
          {copiedId === focusSource.id ? 'Copied!' : 'Copy citation'}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-sky-200/80 dark:border-sky-800/50 bg-gradient-to-b from-sky-50/90 to-white dark:from-sky-950/30 dark:to-stone-900/80 p-4 sm:p-6 shadow-sm ring-1 ring-sky-100/80 dark:ring-sky-900/40">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-stone-900 dark:text-stone-50" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
            Try the citation finder
          </h3>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
            Hover a result, then copy a real-style reference — peer-reviewed sources only.
          </p>
        </div>
        <div className="flex rounded-lg border border-sky-200/90 dark:border-sky-700/60 bg-white/90 dark:bg-stone-800/80 p-0.5 shrink-0">
          {(['APA', 'MLA', 'Chicago'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStyle(s)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                style === s
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-300 hover:bg-sky-50 dark:hover:bg-sky-900/40'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-stone-200/90 dark:border-stone-600 bg-white/95 dark:bg-stone-900/60 p-3 mb-4 shadow-inner">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-1">Your topic</p>
        <p className="text-sm text-stone-800 dark:text-stone-100 font-medium">Climate policy and renewable energy transitions</p>
      </div>

      <ul className="space-y-3" role="list">
        {DEMO_SOURCES.map((src) => {
          const isOpen = expandedId === src.id;
          return (
            <li key={src.id}>
              <button
                type="button"
                onClick={() => setExpandedId(isOpen ? null : src.id)}
                onMouseEnter={() => setExpandedId(src.id)}
                className={`w-full text-left rounded-xl border transition-all duration-200 p-3 sm:p-4 ${
                  isOpen
                    ? 'border-sky-400/80 bg-sky-50/90 dark:bg-sky-950/40 shadow-md ring-1 ring-sky-300/50 dark:ring-sky-700/50'
                    : 'border-stone-200/90 dark:border-stone-600 bg-white/80 dark:bg-stone-800/50 hover:border-sky-300/70 dark:hover:border-sky-600/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-stone-900 dark:text-stone-50 leading-snug">{src.title}</p>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                      {src.authors} · {src.year} · {src.journal}
                    </p>
                  </div>
                  {src.peerReviewed && (
                    <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60">
                      Peer-reviewed
                    </span>
                  )}
                </div>
                {isOpen && (
                  <div className="mt-3 pt-3 border-t border-stone-200/80 dark:border-stone-600/80 animate-in fade-in slide-in-from-top-1 duration-200">
                    <p className="text-[10px] font-semibold text-stone-500 dark:text-stone-400 mb-1.5">{style} (sample)</p>
                    <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed font-mono bg-stone-50 dark:bg-stone-950/50 rounded-lg p-2.5 border border-stone-100 dark:border-stone-700">
                      {formatCitation(style, src)}
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        copy(src.id, formatCitation(style, src));
                      }}
                      className="mt-2 text-xs font-semibold text-sky-700 dark:text-sky-400 hover:underline"
                    >
                      {copiedId === src.id ? 'Copied!' : 'Copy citation'}
                    </button>
                  </div>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
