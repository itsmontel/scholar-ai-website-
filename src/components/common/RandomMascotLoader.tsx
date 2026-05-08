// RandomMascotLoader.tsx
//
// Tiny loading-state component: picks a random "positive" Scholar mascot
// once on mount and renders it above the standard "Loading…" pulse.
// Used by:
//   • CompleteAcademicAIApp's <Suspense fallback> during route lazy-loads
//   • LoadingSpinner's fullScreen variant
//
// Why a real component (not just a JSX expression): the random pick has
// to happen *per mount*, which means we need state that survives the
// initial render. `useState` with a lazy initializer + `useMemo` would
// also work; useState is the most forgiving across React strict mode.

import { useState } from 'react';

// Positive-vibes only — sad mascot is intentionally excluded so the
// loading screen never feels punitive when a slow network loads.
const POSITIVE_MASCOTS = [
  '/mascot-celebrating.webp',
  '/mascot-jumping-joy.webp',
  '/mascot-juggling.webp',
  '/mascot-dance.webp',
  '/mascot-laptop.webp',
  '/mascot-paper.webp',
  '/mascot-study.webp',
  '/mascot-thinking.webp',
];

interface RandomMascotLoaderProps {
  /** Pixel size of the mascot. Defaults to 140 — small enough to feel
   *  ambient, big enough to read as a friendly mascot. */
  size?: number;
  /** Loading caption shown beneath the mascot. Defaults to "Loading…". */
  text?: string;
}

const RandomMascotLoader = ({ size = 140, text = 'Loading…' }: RandomMascotLoaderProps) => {
  // useState's lazy initializer runs once per mount → fresh random pick
  // every time the fallback shows.
  const [mascotSrc] = useState(
    () => POSITIVE_MASCOTS[Math.floor(Math.random() * POSITIVE_MASCOTS.length)]
  );

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <img
        src={mascotSrc}
        alt=""
        aria-hidden
        loading="eager"
        decoding="async"
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className="object-contain drop-shadow-[0_18px_30px_rgba(124,58,237,0.30)]"
      />
      {text && (
        <p className="animate-pulse text-stone-500 dark:text-stone-400 text-sm font-medium">
          {text}
        </p>
      )}
    </div>
  );
};

export default RandomMascotLoader;
