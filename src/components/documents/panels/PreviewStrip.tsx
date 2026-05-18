/* ═══════════════════════════════════════════════════════════════
   PreviewStrip — a row of "here's what this creates / how it
   works" media (videos auto-loop, images), each in a purple
   bordered frame. Used at the top of the tool panels so users
   immediately see the payoff. Media lives in /public.
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
}: {
  title: string;
  subtitle?: string;
  items: PreviewItem[];
  aspect?: string;
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
            className="snap-center shrink-0 w-[min(70vw,240px)] sm:w-[min(32vw,240px)] lg:w-auto lg:min-w-0 rounded-2xl overflow-hidden bg-stone-950 border-2 border-b-4 border-[#A560E8] flex flex-col shadow-[0_12px_30px_-18px_rgba(165,96,232,0.5)]"
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
            <figcaption className="px-2 py-1.5 text-center text-[11px] font-extrabold text-stone-600 dark:text-stone-300 border-t-2 border-[#A560E8]/40 bg-white dark:bg-stone-900">
              {it.label}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
