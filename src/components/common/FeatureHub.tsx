/* ═══════════════════════════════════════════════════════════════
   FeatureHub — Duolingo-style hub for tool features.

   Used as the landing page when the user clicks Study Pack /
   Analyze / Citations from the dashboard. Surfaces:
   - Friendly mascot welcome
   - One big "Create new" CTA card
   - Recent items grid (top 4)
   - "View all →" link to the existing history page

   Empty state: just the welcome + create CTA, no recent grid.
   ═══════════════════════════════════════════════════════════════ */

export interface HubItem {
  id: string;
  /** Title shown on the card (truncated to 2 lines). */
  title: string;
  /** Smaller subline — e.g. "2 days ago · 12 cards". */
  meta?: string;
  /** Emoji or short label rendered in the card's icon tile. */
  icon?: string;
  /** Open this item — usually navigates to the viewer. */
  onOpen: () => void;
}

interface FeatureHubProps {
  /* Visual identity */
  title: string;
  subtitle: string;
  /** Mascot WEBP path, e.g. /mascot-laptop.webp */
  mascotSrc: string;
  /** Primary brand colour for this hub (e.g. '#58CC02'). */
  themeColor: string;
  /** Darker border variant for `border-b-4`. */
  themeBorderColor: string;
  /** Soft background tint for the CTA card. */
  themeBgColor: string;

  /* Create new CTA */
  createLabel: string;
  createSubLabel?: string;
  onCreate: () => void;

  /* Recent items */
  recentItems: HubItem[];
  loading?: boolean;
  emptyStateMessage?: string;

  /* View all */
  viewAllLabel?: string;
  onViewAll?: () => void;
}

const FeatureHub = ({
  title,
  subtitle,
  mascotSrc,
  themeColor,
  themeBorderColor,
  themeBgColor,
  createLabel,
  createSubLabel,
  onCreate,
  recentItems,
  loading,
  emptyStateMessage,
  viewAllLabel = 'View all',
  onViewAll,
}: FeatureHubProps) => {
  const hasItems = !loading && recentItems.length > 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 fh-fade-in">
      {/* Mascot + welcome */}
      <div className="flex items-start gap-3 sm:gap-4 mb-6">
        <img
          src={mascotSrc}
          alt=""
          width={88}
          height={88}
          className="object-contain w-20 h-20 sm:w-24 sm:h-24 shrink-0 fh-mascot-bob"
          loading="eager"
        />
        <div className="flex-1 min-w-0 mt-2">
          <h1
            className="text-2xl sm:text-3xl font-extrabold text-[#3C3C3C] dark:text-stone-50 leading-tight"
            style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
          >
            {title}
          </h1>
          <p className="mt-1 text-sm sm:text-base text-stone-500 dark:text-stone-400 font-bold leading-snug">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Big "Create new" CTA card */}
      <button
        type="button"
        onClick={onCreate}
        className="fh-create-card w-full text-left rounded-2xl border-2 border-b-4 p-5 sm:p-6 mb-7 flex items-center gap-4 transition-all hover:-translate-y-0.5 active:border-b-2 active:translate-y-0.5"
        style={{ borderColor: themeBorderColor, backgroundColor: themeBgColor }}
      >
        <div
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-white text-2xl sm:text-3xl font-extrabold border-2 border-b-4 shrink-0 shadow-sm"
          style={{ backgroundColor: themeColor, borderColor: themeBorderColor }}
          aria-hidden
        >
          +
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base sm:text-lg font-extrabold text-[#3C3C3C] dark:text-stone-50" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
            {createLabel}
          </p>
          {createSubLabel && (
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 font-bold mt-0.5">
              {createSubLabel}
            </p>
          )}
        </div>
        <svg className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" style={{ color: themeColor }} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Recent — only when there are items (or while loading) */}
      {(loading || hasItems) && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-extrabold text-[#3C3C3C] dark:text-stone-50" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
              Recent
            </h2>
            {onViewAll && hasItems && (
              <button
                type="button"
                onClick={onViewAll}
                className="text-sm font-extrabold flex items-center gap-1 hover:underline"
                style={{ color: themeColor }}
              >
                {viewAllLabel}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl border-2 border-b-4 border-[#E5E5E5] dark:border-stone-700 bg-white dark:bg-stone-900 p-4 h-24 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {recentItems.slice(0, 4).map((item, i) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.onOpen}
                  className="fh-item-pop text-left rounded-2xl border-2 border-b-4 border-[#E5E5E5] dark:border-stone-700 bg-white dark:bg-stone-900 p-4 flex items-center gap-3 transition-all hover:-translate-y-0.5 active:border-b-2 active:translate-y-0.5 hover:shadow-md"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-lg border-2 border-b-4 shrink-0"
                    style={{ borderColor: themeColor, backgroundColor: `${themeColor}15`, color: themeColor }}
                    aria-hidden
                  >
                    {item.icon || '•'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-extrabold text-[#3C3C3C] dark:text-stone-100 leading-tight line-clamp-2">
                      {item.title}
                    </p>
                    {item.meta && (
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 font-bold mt-1">
                        {item.meta}
                      </p>
                    )}
                  </div>
                  <svg className="w-4 h-4 text-stone-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty state — gentle prompt to create the first one */}
      {!loading && !hasItems && (
        <div className="rounded-2xl border-2 border-dashed border-[#E5E5E5] dark:border-stone-700 bg-stone-50/60 dark:bg-stone-900/40 p-6 sm:p-8 text-center">
          <p className="text-2xl mb-2" aria-hidden>✨</p>
          <p className="text-sm font-extrabold text-[#3C3C3C] dark:text-stone-100 mb-1">
            Your collection starts here
          </p>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 font-bold">
            {emptyStateMessage || "Make your first one above — it'll show up here next time."}
          </p>
        </div>
      )}

      <style>{`
        @keyframes fhFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .fh-fade-in { animation: fhFadeIn 0.4s ease-out; }
        @keyframes fhMascotBob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
        .fh-mascot-bob { animation: fhMascotBob 2.4s ease-in-out infinite; }
        @keyframes fhItemPop { 0% { transform: translateY(8px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
        .fh-item-pop { animation: fhItemPop 0.4s cubic-bezier(0.22, 1, 0.36, 1) backwards; }
        .fh-create-card { box-shadow: 0 2px 0 rgba(0,0,0,0.04); }
        @media (prefers-reduced-motion: reduce) {
          .fh-fade-in, .fh-mascot-bob, .fh-item-pop { animation: none; }
        }
      `}</style>
    </div>
  );
};

export default FeatureHub;
