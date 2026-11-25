import type { Door } from '../../utils/tryFirst';
import Icon3D from '../common/Icon3D';

/**
 * The six things WriteScholar does, as the site's 3D icons, each in its own colour, with a label under
 * each: the row that sat at the bottom of the previous purple hero.
 * Pressing one opens the door it belongs to and puts the cursor in the box.
 */
const FEATURES: { label: string; door: Door; icon: string }[] = [
  { label: 'Essay Analyzer', door: 'essay', icon: 'landing-essay' },
  { label: 'Study Pack', door: 'exam', icon: 'landing-study-pack' },
  { label: 'Citations', door: 'essay', icon: 'landing-citations' },
  { label: 'Quizzes', door: 'exam', icon: 'landing-quiz' },
  { label: 'Flashcards', door: 'exam', icon: 'landing-flashcards' },
  { label: 'Games', door: 'exam', icon: 'landing-games' },
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
            className="block h-11 w-11 transition-[filter,transform] duration-300 [filter:drop-shadow(0_6px_12px_rgba(0,0,0,0.30))] group-hover:scale-110 group-hover:[filter:drop-shadow(0_10px_18px_rgba(255,200,0,0.55))] sm:h-12 sm:w-12 lg:h-14 lg:w-14"
          >
            <Icon3D name={f.icon} size={56} className="!h-full !w-full" />
          </span>
          <span className="whitespace-nowrap text-[12px] font-extrabold tracking-wide text-white sm:text-[13px] lg:text-sm">
            {f.label}
          </span>
        </button>
      ))}
    </div>
  );
}
