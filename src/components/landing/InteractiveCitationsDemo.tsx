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
  topicLabel = 'Climate policy and renewable energy transitions',
}: {
  variant?: InteractiveCitationsDemoVariant;
  /** Shown in the topic chip (side-left / full layout). */
  topicLabel?: string;
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
      <div className="rounded-2xl border-2 border-b-4 border-[#E5E5E5] bg-white p-3" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#1CB0F6] mb-2 text-center">Peer-reviewed</p>
        <div className="rounded-xl border-2 border-[#E5E5E5] bg-white p-2 mb-2">
          <p className="text-[9px] font-extrabold uppercase tracking-wider text-[#AFAFAF] mb-0.5">Topic</p>
          <p className="text-[11px] text-[#3C3C3C] font-extrabold leading-snug line-clamp-3">
            {topicLabel}
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
                  className={`w-full text-left rounded-xl border-2 transition-all duration-200 p-2 ${
                    isOpen
                      ? 'border-[#1CB0F6] bg-[#DDF4FF] border-b-4'
                      : 'border-[#E5E5E5] bg-white hover:border-[#1899D6]'
                  }`}
                >
                  <p className="text-[11px] font-extrabold text-[#3C3C3C] leading-snug line-clamp-2">{src.title}</p>
                  <p className="text-[9px] text-[#AFAFAF] mt-0.5">{src.year} · {src.journal}</p>
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
      <div className="rounded-2xl border-2 border-b-4 border-[#E5E5E5] bg-white p-3" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#1CB0F6] mb-2 text-center">Copy & export</p>
        <div className="flex rounded-xl border-2 border-[#E5E5E5] bg-white p-0.5 mb-2">
          {(['APA', 'MLA', 'Chicago'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStyle(s)}
              className={`flex-1 px-1.5 py-1 rounded-lg text-[10px] font-extrabold transition-all ${
                style === s ? 'bg-[#1CB0F6] text-white border-2 border-b-4 border-[#1899D6]' : 'text-[#AFAFAF] hover:bg-[#DDF4FF]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <p className="text-[9px] font-extrabold uppercase tracking-wider text-[#AFAFAF] mb-1">Citation</p>
        <p className="text-[10px] text-[#3C3C3C] leading-relaxed font-mono bg-[#F7F7F7] rounded-xl p-2 border-2 border-[#E5E5E5] line-clamp-6">
          {t}
        </p>
        <button
          type="button"
          onClick={() => copy(focusSource.id, t)}
          className="mt-2 w-full text-center text-[11px] font-extrabold text-[#1CB0F6] hover:underline"
        >
          {copiedId === focusSource.id ? 'Copied!' : 'Copy citation'}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-b-4 border-[#E5E5E5] bg-white p-4 sm:p-6" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base sm:text-lg font-extrabold text-[#3C3C3C]" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
            Try the citation finder
          </h3>
          <p className="text-xs sm:text-sm text-[#AFAFAF] mt-1">
            Hover a result, then copy a real-style reference — peer-reviewed sources only.
          </p>
        </div>
        <div className="flex rounded-xl border-2 border-[#E5E5E5] bg-white p-0.5 shrink-0">
          {(['APA', 'MLA', 'Chicago'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStyle(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                style === s
                  ? 'bg-[#1CB0F6] text-white border-2 border-b-4 border-[#1899D6]'
                  : 'text-[#AFAFAF] hover:bg-[#DDF4FF]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border-2 border-[#E5E5E5] bg-white p-3 mb-4">
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#AFAFAF] mb-1">Your topic</p>
        <p className="text-sm text-[#3C3C3C] font-extrabold">{topicLabel}</p>
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
                className={`w-full text-left rounded-2xl border-2 transition-all duration-200 p-3 sm:p-4 ${
                  isOpen
                    ? 'border-[#1CB0F6] bg-[#DDF4FF] border-b-4'
                    : 'border-[#E5E5E5] bg-white hover:border-[#1899D6]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-[#3C3C3C] leading-snug">{src.title}</p>
                    <p className="text-xs text-[#AFAFAF] mt-1">
                      {src.authors} · {src.year} · {src.journal}
                    </p>
                  </div>
                  {src.peerReviewed && (
                    <span className="shrink-0 text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full bg-[#E5F8D0] text-[#58CC02] border-2 border-[#58CC02]">
                      Peer-reviewed
                    </span>
                  )}
                </div>
                {isOpen && (
                  <div className="mt-3 pt-3 border-t-2 border-[#E5E5E5] animate-in fade-in slide-in-from-top-1 duration-200">
                    <p className="text-[10px] font-extrabold text-[#AFAFAF] mb-1.5">{style} (sample)</p>
                    <p className="text-xs text-[#3C3C3C] leading-relaxed font-mono bg-[#F7F7F7] rounded-xl p-2.5 border-2 border-[#E5E5E5]">
                      {formatCitation(style, src)}
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        copy(src.id, formatCitation(style, src));
                      }}
                      className="mt-2 text-xs font-extrabold text-[#1CB0F6] hover:underline"
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
