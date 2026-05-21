/* ═══════════════════════════════════════════════════════════════
   PreviewStrip — a row of "here's what this creates / how it
   works" media (videos auto-loop, images), each in a brand-tinted
   bordered frame. Used at the top of the tool panels so users
   immediately see the payoff. Border colour is themable per call
   site (Study Packs = orange, Citations = blue, default = purple).
   Media lives in /public.
   ═══════════════════════════════════════════════════════════════ */

export type PreviewItem = {
  kind: 'video' | 'image';
  src: string;
  label: string;
};

export default function PreviewStrip({
  title,
  subtitle,
  items,
  aspect = 'aspect-[16/11]',
  tint = '#A560E8',
  tintShadowRgb = '165,96,232',
}: {
  title: string;
  subtitle?: string;
  items: PreviewItem[];
  aspect?: string;
  /** Border + accent colour for every frame. Defaults to brand purple. */
  tint?: string;
  /** Same colour as `tint` but expressed as comma-separated R,G,B for use
   *  inside rgba() — Tailwind's arbitrary-value class strings can't
   *  parse hex inside box-shadow rgba(), so we keep both forms. */
  tintShadowRgb?: string;
}) {
  return (
    <section className="mb-7">
      <h2 className="text-base sm:text-lg font-extrabold text-stone-900 dark:text-stone-50" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
        {title}
      </h2>
      {subtitle && (
        <p className="mt-1 text-[13px] font-bold text-stone-500 dark:text-stone-400 leading-snug">{subtitle}</p>
      )}
      <div className="mt-3 flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x lg:grid lg:grid-flow-col lg:auto-cols-fr lg:overflow-visible">
        {items.map((it, i) => (
          <figure
            key={i}
            className="snap-center shrink-0 w-[min(70vw,240px)] sm:w-[min(32vw,240px)] lg:w-auto lg:min-w-0 rounded-2xl overflow-hidden bg-stone-950 border-2 border-b-4 flex flex-col"
            style={{ borderColor: tint, boxShadow: `0 12px 30px -18px rgba(${tintShadowRgb},0.5)` }}
          >
            <div className={`relative ${aspect} w-full bg-black/80`}>
              {it.kind === 'video' ? (
                <video
                  className="absolute inset-0 h-full w-full object-cover object-center"
                  aria-label={it.label}
                  muted
                  loop
                  playsInline
                  autoPlay
                  preload="metadata"
                >
                  <source src={it.src} type="video/mp4" />
                </video>
              ) : (
                <img
                  src={it.src}
                  alt={it.label}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover object-top"
                />
              )}
            </div>
            <figcaption
              className="px-2 py-1.5 text-center text-[11px] font-extrabold text-stone-600 dark:text-stone-300 border-t-2 bg-white dark:bg-stone-900"
              style={{ borderTopColor: `${tint}66` }}
            >
              {it.label}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
