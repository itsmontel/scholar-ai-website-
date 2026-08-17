/**
 * Decorative mascot for blog page headers (top right).
 *
 * Which mascot appears is derived from the post slug, so the blog feels
 * varied across posts while any single post always shows the same one.
 * A stable hash rather than Math.random() matters for three reasons: the
 * mascot does not change when a reader refreshes, it does not flip between
 * the server-prerendered HTML and the hydrated page (which would flash),
 * and screenshots of a given post stay reproducible.
 *
 * Purely ornamental, so it is `aria-hidden` with an empty alt and lazily
 * loaded: these animated WebPs are ~1MB each, and blocking article text on
 * a decoration would hurt LCP. Explicit width/height reserve the box so
 * nothing shifts when it arrives (CLS).
 *
 * Hidden below `lg` on purpose. On a phone the header is already the whole
 * first screen, and squeezing a mascot in pushes the H1 and the first
 * paragraph below the fold.
 */

/**
 * Animated mascots used across blog headers.
 *
 * Deliberately limited to the four lightest animations (all under 1.5MB).
 * The on-theme alternatives are 2 to 3.6MB each (mascot-study 2.1MB,
 * mascot-paper 2.1MB, mascot-laptop 3.6MB); adding them would roughly
 * double what a reader downloads while browsing several posts, for no
 * gain a reader would notice. `mascot-pointing.webp` is excluded on
 * purpose: at 12KB it is a single static frame, not an animation.
 *
 * `durationS` is staggered so the bob does not look mechanically identical
 * from one post to the next.
 */
const BLOG_MASCOTS: ReadonlyArray<{ src: string; durationS: number }> = [
  { src: '/mascot-thinking.webp', durationS: 6 },
  { src: '/mascot-jumping-joy.webp', durationS: 5.2 },
  { src: '/mascot-juggling.webp', durationS: 6.6 },
  { src: '/mascot-celebrating.webp', durationS: 5.8 },
];

/** Mascot for surfaces with no single post (the blog index). */
const DEFAULT_MASCOT = BLOG_MASCOTS[0];

/**
 * Stable, deterministic string hash (djb2). Same slug always maps to the
 * same mascot, on every machine and every build.
 */
function hashSlug(slug: string): number {
  let h = 5381;
  for (let i = 0; i < slug.length; i += 1) {
    h = ((h << 5) + h + slug.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function mascotForSlug(slug?: string): { src: string; durationS: number } {
  if (!slug) return DEFAULT_MASCOT;
  return BLOG_MASCOTS[hashSlug(slug) % BLOG_MASCOTS.length];
}

interface BlogMascotProps {
  /** Post slug. Picks which mascot shows; omit on the blog index. */
  slug?: string;
  /** Rendered pixel size (square). */
  size?: number;
  className?: string;
}

export default function BlogMascot({ slug, size = 132, className = '' }: BlogMascotProps) {
  const mascot = mascotForSlug(slug);
  return (
    <div
      className={`hidden lg:block shrink-0 select-none pointer-events-none ${className}`}
      aria-hidden
    >
      {/* Duration comes from an inline style rather than a Tailwind arbitrary
          value: `animate-[...var(--x)...]` is brittle because Tailwind
          rewrites underscores to spaces inside arbitrary values. The class
          supplies the keyframe (and is gated by motion-safe), the inline
          style only overrides how long one cycle takes. */}
      <img
        key={mascot.src}
        src={mascot.src}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        className="object-contain motion-safe:animate-[hero-tile-drift_6s_ease-in-out_infinite] [filter:drop-shadow(0_14px_24px_rgba(165,96,232,0.28))]"
        style={{ width: size, height: size, animationDuration: `${mascot.durationS}s` }}
      />
    </div>
  );
}
