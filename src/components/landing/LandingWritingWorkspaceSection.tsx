import LandingScrollReveal from './LandingScrollReveal';
import LandingSectionBackdrop from './LandingSectionBackdrop';

interface LandingWritingWorkspaceSectionProps {
  onNavigate: (page: string) => void;
}

const FEATURES = [
  {
    n: 1,
    title: 'Live grade & rubric',
    desc: 'An estimated grade band and a full professor-style rubric, updating as you write. No copy-paste loop.',
    border: 'border-[#A560E8]',
    borderInner: 'border-[#D8B4FE]',
    accent: 'bg-gradient-to-r from-[#A560E8] to-[#8A48C7]',
    numBg: 'bg-[#A560E8]',
    badge: 'bg-[#F3EAFF] text-[#7733B5]',
    shadow: 'shadow-[0_8px_28px_-10px_rgba(165,96,232,0.45)] hover:shadow-[0_16px_40px_-12px_rgba(165,96,232,0.60)]',
    dotX: 84,
    dotY: 29,
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5h6m-6 0a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V7a2 2 0 00-2-2m-6 0a2 2 0 012-2h2a2 2 0 012 2M9 14l2 2 4-4" />
      </svg>
    ),
  },
  {
    n: 2,
    title: 'One-click apply',
    desc: 'Accept a suggested rewrite and it drops straight into your draft, exactly where it belongs.',
    border: 'border-[#46A302]',
    borderInner: 'border-[#A8E06B]',
    accent: 'bg-gradient-to-r from-[#58CC02] to-[#46A302]',
    numBg: 'bg-[#58CC02]',
    badge: 'bg-[#E5F8D0] text-[#2E7200]',
    shadow: 'shadow-[0_8px_28px_-10px_rgba(88,204,2,0.40)] hover:shadow-[0_16px_40px_-12px_rgba(88,204,2,0.55)]',
    dotX: 84,
    dotY: 82,
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 3L4 14h6l-1 7 9-11h-6z" />
      </svg>
    ),
  },
  {
    n: 3,
    title: 'Built for real essays',
    desc: 'Write the actual paper here. Tables, images, citations and footnotes are built in, not bolted on.',
    border: 'border-[#D97F00]',
    borderInner: 'border-[#FFCF70]',
    accent: 'bg-gradient-to-r from-[#FF9600] to-[#D97F00]',
    numBg: 'bg-[#FF9600]',
    badge: 'bg-[#FFF4E0] text-[#9A5500]',
    shadow: 'shadow-[0_8px_28px_-10px_rgba(255,150,0,0.40)] hover:shadow-[0_16px_40px_-12px_rgba(255,150,0,0.55)]',
    dotX: 42,
    dotY: 55,
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 3h7l5 5v11a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2zM14 3v5h5M9 13h6M9 17h6" />
      </svg>
    ),
  },
  {
    n: 4,
    title: 'Word in, Word out',
    desc: 'Import a .docx and your bold, italics and headings carry over. Export and it comes back perfectly formatted.',
    border: 'border-[#0891B2]',
    borderInner: 'border-[#67E8F9]',
    accent: 'bg-gradient-to-r from-[#06B6D4] to-[#0891B2]',
    numBg: 'bg-[#06B6D4]',
    badge: 'bg-[#CFFAFE] text-[#0E7490]',
    shadow: 'shadow-[0_8px_28px_-10px_rgba(6,182,212,0.40)] hover:shadow-[0_16px_40px_-12px_rgba(6,182,212,0.55)]',
    dotX: 34,
    dotY: 3,
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 16V4m0 0L5.5 7.5M9 4l3.5 3.5M15 8v12m0 0l3.5-3.5M15 20l-3.5-3.5" />
      </svg>
    ),
  },
] as const;

function FeatureCard({ feature }: { feature: (typeof FEATURES)[number] }) {
  return (
    <div
      className={`group relative h-full rounded-2xl border-2 border-b-4 ${feature.border} bg-white dark:bg-stone-900 overflow-hidden transition-all duration-200 hover:-translate-y-1 active:border-b-2 active:translate-y-0.5 ${feature.shadow}`}
    >
      <span className={`absolute top-0 inset-x-0 h-1.5 ${feature.accent}`} aria-hidden />
      <div className="relative p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3 mb-3">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white text-sm font-extrabold ${feature.numBg}`}>
            {feature.n}
          </span>
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${feature.badge}`}>
            Feature
          </span>
        </div>
        <span className="pointer-events-none absolute top-5 right-5 text-[#A560E8]/15 dark:text-[#A560E8]/20 transition-colors duration-300 group-hover:text-[#A560E8]/30">
          {feature.icon}
        </span>
        <h3
          className="text-base sm:text-lg font-extrabold text-[#3C3C3C] dark:text-white leading-snug pr-8"
          style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
        >
          {feature.title}
        </h3>
        <p className="mt-2 text-[13px] sm:text-sm text-[#777] dark:text-stone-400 leading-relaxed" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
          {feature.desc}
        </p>
      </div>
    </div>
  );
}

function WorkspaceScreenshot({ badges }: { badges: { n: number; x: number; y: number; color: string }[] }) {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-4 rounded-[2.5rem] bg-gradient-to-br from-[#A560E8]/20 via-[#8A48C7]/10 to-[#58CC02]/10 blur-3xl -z-10"
      />
      <div className="relative rounded-2xl sm:rounded-3xl border-2 border-b-4 border-[#A560E8] bg-white dark:bg-stone-900 shadow-[0_0_40px_-12px_rgba(165,96,232,0.45),0_24px_48px_-16px_rgba(0,0,0,0.25)] overflow-hidden">
        <div className="flex h-7 shrink-0 items-center gap-1 px-2.5 border-b-2 border-[#D8B4FE] bg-[#F3EAFF] dark:bg-[#2A0E40]">
          <span className="h-2 w-2 rounded-full bg-[#A560E8]" />
          <span className="h-2 w-2 rounded-full bg-[#A560E8]/60" />
          <span className="h-2 w-2 rounded-full bg-[#A560E8]/30" />
          <span className="ml-2 text-[10px] font-bold text-[#7733B5] dark:text-[#C9A0F0] truncate">
            writescholar.com · writing workspace
          </span>
        </div>
        <div className="relative">
          <img
            src="/WriterPic.png"
            alt="WriteScholar writing workspace with study tools rail, live rubric, and one-click revision suggestions"
            loading="lazy"
            decoding="async"
            className="w-full h-auto block"
          />
          {badges.map((b) => (
            <span
              key={b.n}
              aria-hidden
              className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full font-extrabold text-white"
              style={{
                left: `${b.x}%`,
                top: `${b.y}%`,
                width: 'clamp(24px,2.4vw,36px)',
                height: 'clamp(24px,2.4vw,36px)',
                fontSize: 'clamp(12px,1.1vw,16px)',
                backgroundColor: b.color,
                boxShadow: `0 0 0 4px #fff, 0 0 0 6px ${b.color}, 0 6px 14px rgba(0,0,0,0.28)`,
              }}
            >
              {b.n}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LandingWritingWorkspaceSection({ onNavigate }: LandingWritingWorkspaceSectionProps) {
  const dots = FEATURES.map((f) => ({
    n: f.n,
    x: f.dotX,
    y: f.dotY,
    color: f.n === 1 ? '#A560E8' : f.n === 2 ? '#58CC02' : f.n === 3 ? '#FF9600' : '#06B6D4',
  }));

  return (
    <section
      id="writing-workspace"
      aria-labelledby="writing-workspace-heading"
      className="relative py-16 sm:py-24 lg:py-28 overflow-hidden scroll-mt-24"
    >
      <LandingSectionBackdrop
        base="bg-[#F3EAFF] dark:bg-[#1A0B2E]"
        bottomTo="from-[#FFF4E0]/70 dark:from-[#2A1800]/70"
        radial="bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(165,96,232,0.12),transparent_60%)]"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <LandingScrollReveal>
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
            <div className="inline-flex items-center gap-2 mb-5 rounded-full border-2 border-[#A560E8]/40 bg-[#F3EAFF] dark:bg-[#A560E8]/15 px-3.5 py-1.5 shadow-[0_0_12px_rgba(165,96,232,0.25)]">
              <svg className="w-3.5 h-3.5 text-[#A560E8]" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                <path d="M17.414 2.586a2 2 0 010 2.828l-9.5 9.5a2 2 0 01-.878.505l-3.5 1a1 1 0 01-1.237-1.237l1-3.5a2 2 0 01.505-.878l9.5-9.5a2 2 0 012.828 0z" />
              </svg>
              <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.18em] text-[#7733B5] dark:text-[#C9A0F0]">
                Your writing workspace
              </span>
            </div>
            <h2
              id="writing-workspace-heading"
              className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#3C3C3C] dark:text-white tracking-tight leading-[1.1] mb-4"
              style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
            >
              <span className="block">Not just a grader.</span>
              <span className="relative inline-block mt-1 sm:mt-1.5 text-[#A560E8]">
                A full writing workspace.
                <svg
                  className="absolute -bottom-1.5 left-0 w-full h-2 text-[#A560E8]"
                  viewBox="0 0 200 8"
                  preserveAspectRatio="none"
                  aria-hidden
                >
                  <path
                    d="M2 6 Q50 1 100 5 T198 4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h2>
            <p className="text-base sm:text-xl text-[#777] dark:text-stone-300 leading-relaxed max-w-2xl mx-auto" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
              Write your essay in a real editor with live, professor-style feedback in the margin. Apply suggested fixes straight into your draft, then export a perfectly formatted Word doc.
            </p>
          </div>
        </LandingScrollReveal>

        <div className="relative rounded-3xl border-2 border-[#D8B4FE]/70 bg-white/70 dark:bg-[#2A0E40]/40 shadow-[0_0_60px_-20px_rgba(165,96,232,0.35)] p-4 sm:p-5 lg:p-6 backdrop-blur-sm">
          <div className="pointer-events-none absolute -top-10 -left-10 w-48 h-48 rounded-full bg-[#A560E8]/15 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-[#8A48C7]/12 blur-3xl" aria-hidden />

          <LandingScrollReveal delayMs={60}>
            <div className="relative max-w-6xl mx-auto mb-8 sm:mb-10">
              <WorkspaceScreenshot badges={dots} />
              <div
                aria-hidden
                className="hidden sm:flex absolute -top-4 -right-4 lg:-top-5 lg:-right-5 items-center justify-center px-3.5 h-11 lg:h-13 rounded-2xl bg-[#58CC02] text-white text-sm lg:text-base font-extrabold rotate-[6deg] border-2 border-b-4 border-[#46A302] shadow-[0_18px_32px_-8px_rgba(88,204,2,0.5)] z-10"
              >
                B · 80–89%
              </div>
            </div>
          </LandingScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {FEATURES.map((feature, i) => (
              <LandingScrollReveal key={feature.n} delayMs={120 + i * 70}>
                <FeatureCard feature={feature} />
              </LandingScrollReveal>
            ))}
          </div>
        </div>

        <LandingScrollReveal delayMs={420}>
          <div className="mt-10 sm:mt-12 flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('signup')}
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-[#A560E8] hover:bg-[#8A48C7] text-white font-extrabold text-base border-2 border-b-4 border-[#7733B5] active:border-b-2 active:translate-y-0.5 transition-all shadow-[0_8px_24px_-8px_rgba(165,96,232,0.50)]"
              style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
            >
              Start writing free
              <svg className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
            <p className="text-xs sm:text-sm text-[#777] dark:text-stone-400 font-bold">No credit card · Free plan included</p>
          </div>
        </LandingScrollReveal>
      </div>
    </section>
  );
}
