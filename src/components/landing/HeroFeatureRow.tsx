import type { Door } from '../../utils/tryFirst';

/**
 * The six things WriteScholar does, as small flat icons with a label under
 * each: the row that sat at the bottom of the previous purple hero.
 * Pressing one opens the door it belongs to and puts the cursor in the box.
 */
const FEATURES = [
  {
    label: 'Essay Analyzer',
    door: 'essay' as Door,
    svg: (
      // FLAT-SOLID: RED document silhouette with folded
      // corner + crisp white ruled lines + bold white check
      // mark (Knowunity-standard: one solid colour shape,
      // simple white interior details, no outlines).
      <svg viewBox="0 0 64 64" fill="none" aria-hidden>
        <path d="M14 6 Q12 6 12 8 L12 56 Q12 58 14 58 L50 58 Q52 58 52 56 L52 22 L36 6 Z" fill="#FF4B4B" />
        <path d="M36 6 L52 22 L38 22 Q36 22 36 20 Z" fill="#C13030" />
        <rect x="20" y="30" width="22" height="3" rx="1.5" fill="white" />
        <rect x="20" y="37" width="18" height="3" rx="1.5" fill="white" opacity="0.7" />
        <path d="M22 48 L28 54 L40 41" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: 'Study Pack',
    door: 'exam' as Door,
    svg: (
      // FLAT-SOLID: three orange books stacked, white spine
      // lines as the only inner detail.
      <svg viewBox="0 0 64 64" fill="none" aria-hidden>
        <rect x="6" y="44" width="52" height="14" rx="3" fill="#FF9600" />
        <rect x="14" y="44" width="3" height="14" fill="white" opacity="0.65" />
        <rect x="10" y="28" width="44" height="14" rx="3" fill="#FF9600" />
        <rect x="18" y="28" width="3" height="14" fill="white" opacity="0.65" />
        <rect x="14" y="12" width="36" height="14" rx="3" fill="#FF9600" />
        <rect x="22" y="12" width="3" height="14" fill="white" opacity="0.65" />
        <path d="M44 8 L45 11 L48 12 L45 13 L44 16 L43 13 L40 12 L43 11 Z" fill="#FFC800" />
      </svg>
    ),
  },
  {
    label: 'Citations',
    door: 'essay' as Door,
    svg: (
      // FLAT-SOLID: two BLUE quotation-mark blobs — the
      // universal "this is a cited source" pictogram.
      <svg viewBox="0 0 64 64" fill="none" aria-hidden>
        <path d="M10 18 Q10 12 16 12 L24 12 Q28 12 28 16 L28 32 Q28 44 16 50 Q12 50 12 46 Q12 44 14 42 Q20 38 20 32 L16 32 Q10 32 10 26 Z" fill="#1CB0F6" />
        <path d="M36 18 Q36 12 42 12 L50 12 Q54 12 54 16 L54 32 Q54 44 42 50 Q38 50 38 46 Q38 44 40 42 Q46 38 46 32 L42 32 Q36 32 36 26 Z" fill="#1CB0F6" />
      </svg>
    ),
  },
  {
    label: 'Quizzes',
    door: 'exam' as Door,
    svg: (
      // FLAT-SOLID: chunky pink question mark — silhouette
      // only, no outline, no badge. The single sparkle
      // accent stays as a tiny gold flourish.
      <svg viewBox="0 0 64 64" fill="none" aria-hidden>
        <path d="M20 22 Q20 8 32 8 Q44 8 44 22 Q44 30 32 34 L32 44" stroke="#FF4B82" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx="32" cy="55" r="5.5" fill="#FF4B82" />
        <path d="M52 10 L53.5 13 L56.5 14.5 L53.5 16 L52 19 L50.5 16 L47.5 14.5 L50.5 13 Z" fill="#FFC800" />
      </svg>
    ),
  },
  {
    label: 'Flashcards',
    door: 'exam' as Door,
    svg: (
      // FLAT-SOLID: two YELLOW cards (back tilted, front
      // bold) with white text bars. No outlines.
      <svg viewBox="0 0 64 64" fill="none" aria-hidden>
        <rect x="20" y="14" width="34" height="42" rx="5" fill="#FFC800" opacity="0.55" transform="rotate(10 37 35)" />
        <rect x="10" y="10" width="34" height="42" rx="5" fill="#FFC800" />
        <rect x="16" y="20" width="22" height="3.5" rx="1.5" fill="white" />
        <rect x="16" y="28" width="18" height="3" rx="1.5" fill="white" opacity="0.75" />
        <rect x="16" y="35" width="20" height="3" rx="1.5" fill="white" opacity="0.75" />
        <rect x="16" y="42" width="14" height="3" rx="1.5" fill="white" opacity="0.75" />
      </svg>
    ),
  },
  {
    label: 'Games',
    door: 'exam' as Door,
    svg: (
      // FLAT-SOLID: green gamepad silhouette. Top now has
      // two raised shoulder humps (where L/R bumpers sit
      // on a real controller) with a gentle center dip
      // between them — replaces the previous flat top.
      // D-pad + 4 white buttons stay the same.
      <svg viewBox="0 0 64 64" fill="none" aria-hidden>
        <path d="M14 22 Q6 22 6 30 L6 44 Q6 56 18 56 Q23 56 26 50 L28 46 L36 46 L38 50 Q41 56 46 56 Q58 56 58 44 L58 30 Q58 22 50 22 Q46 17 40 21 Q36 24 32 24 Q28 24 24 21 Q18 17 14 22 Z" fill="#58CC02" />
        <rect x="14" y="32" width="12" height="3.5" rx="1.5" fill="white" />
        <rect x="18.25" y="27.75" width="3.5" height="12" rx="1.5" fill="white" />
        <circle cx="46" cy="30" r="3.2" fill="white" />
        <circle cx="52" cy="36" r="3.2" fill="white" />
        <circle cx="40" cy="36" r="3.2" fill="white" />
        <circle cx="46" cy="42" r="3.2" fill="white" />
      </svg>
    ),
  },
];

export default function HeroFeatureRow({ onPick }: { onPick: (door: Door) => void }) {
  return (
    <div className="flex flex-wrap items-start justify-center gap-x-5 gap-y-4 sm:gap-x-8 sm:gap-y-5">
      {FEATURES.map((f) => (
        <button
          key={f.label}
          type="button"
          onClick={() => onPick(f.door)}
          className="group flex min-h-[44px] min-w-[44px] flex-col items-center gap-1.5 rounded-lg px-1 py-1 transition-transform duration-200 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:gap-2"
        >
          <span
            aria-hidden
            className="block h-8 w-8 transition-[filter] duration-300 [filter:drop-shadow(0_6px_14px_rgba(0,0,0,0.30))] group-hover:[filter:drop-shadow(0_10px_18px_rgba(255,200,0,0.55))] sm:h-9 sm:w-9 lg:h-11 lg:w-11"
          >
            {f.svg}
          </span>
          <span className="whitespace-nowrap text-[12px] font-extrabold tracking-wide text-white sm:text-[13px] lg:text-sm">
            {f.label}
          </span>
        </button>
      ))}
    </div>
  );
}
