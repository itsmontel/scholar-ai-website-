import { useState } from 'react';

interface LessonSlide {
  id?: number;
  type?: 'intro' | 'concept' | 'example' | 'keypoint' | 'funfact' | 'summary';
  title: string;
  content: string;
  emoji?: string;
  bulletPoints?: string[];
  highlightedTerm?: string;
}

interface LessonViewerProps {
  slides: LessonSlide[];
  title?: string;
  /** When provided, shows an enlarge button to open in full InteractiveLessonPage */
  onEnlarge?: (state?: { slideIndex?: number }) => void;
  /** Restore position when returning from full screen */
  initialSlideIndex?: number;
  /** When true and on last slide, shows Try Quiz button to switch to quiz section */
  hasQuiz?: boolean;
  /** Called when user clicks Try Quiz (e.g. to switch to quiz tab in study pack) */
  onTryQuiz?: () => void;
}

const getSlideIcon = (type?: LessonSlide['type']) => {
  switch (type) {
    case 'intro': return '📖';
    case 'concept': return '💡';
    case 'example': return '🔍';
    case 'keypoint': return '⭐';
    case 'funfact': return '🎯';
    case 'summary': return '✅';
    default: return '📝';
  }
};

const getSlideColor = (type?: LessonSlide['type']) => {
  switch (type) {
    case 'intro': return 'from-violet-500 to-purple-600';
    case 'concept': return 'from-blue-500 to-cyan-600';
    case 'example': return 'from-amber-500 to-orange-600';
    case 'keypoint': return 'from-emerald-500 to-teal-600';
    case 'funfact': return 'from-pink-500 to-rose-600';
    case 'summary': return 'from-indigo-500 to-violet-600';
    default: return 'from-stone-500 to-stone-600';
  }
};

const getSlideBackground = (type?: LessonSlide['type']) => {
  switch (type) {
    case 'intro': return 'from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border-violet-200 dark:border-violet-700/50';
    case 'concept': return 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-700/50';
    case 'example': return 'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-700/50';
    case 'keypoint': return 'from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200 dark:border-emerald-700/50';
    case 'funfact': return 'from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 border-pink-200 dark:border-pink-700/50';
    case 'summary': return 'from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 border-indigo-200 dark:border-indigo-700/50';
    default: return 'from-stone-50 to-stone-100 dark:from-stone-800/50 dark:to-stone-700/50 border-stone-200 dark:border-stone-600';
  }
};

const LessonViewer = ({ slides, title, onEnlarge, initialSlideIndex, hasQuiz, onTryQuiz }: LessonViewerProps) => {
  const [currentSlide, setCurrentSlide] = useState(() => {
    if (initialSlideIndex == null || !slides?.length) return 0;
    return Math.min(Math.max(0, initialSlideIndex), slides.length - 1);
  });
  const [revealedItems, setRevealedItems] = useState<Set<string>>(new Set());

  if (!slides || slides.length === 0) {
    return (
      <div className="p-8 text-center text-stone-500 dark:text-stone-400">No slides to display</div>
    );
  }

  const toggleReveal = (id: string) => {
    setRevealedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const slide = slides[currentSlide];

  return (
    <div className="p-4 flex flex-col min-h-0">
      {/* Header with title and enlarge */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <span className="text-sm font-medium text-stone-500 dark:text-stone-400">
          {currentSlide + 1} / {slides.length}
        </span>
        {onEnlarge && (
          <button
            onClick={() => onEnlarge?.({ slideIndex: currentSlide })}
            className="text-xs px-3 py-1.5 rounded-lg bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 hover:bg-violet-200 dark:hover:bg-violet-800/60 transition-colors flex items-center gap-1.5"
          >
            <span>Open full screen</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full transition-all duration-300"
            style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Slide dots */}
      <div className="flex flex-wrap justify-center gap-1.5 mb-4">
        {slides.map((s, index) => (
          <button
            key={s.id ?? index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentSlide
                ? `bg-gradient-to-r ${getSlideColor(s.type)} scale-125 shadow-lg`
                : index < currentSlide
                  ? 'bg-violet-300 dark:bg-violet-600'
                  : 'bg-stone-300 dark:bg-stone-600 hover:bg-stone-400 dark:hover:bg-stone-500'
            }`}
            title={`Slide ${index + 1}: ${s.title}`}
          />
        ))}
      </div>

      {/* Current slide content */}
      <div className={`flex-1 rounded-2xl p-4 sm:p-6 shadow-lg border min-w-0 overflow-auto bg-gradient-to-br ${getSlideBackground(slide.type)} border`}>
        <div className="flex items-start gap-4 mb-4">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getSlideColor(slide.type)} flex items-center justify-center shadow-lg text-xl flex-shrink-0`}>
            {slide.emoji || getSlideIcon(slide.type)}
          </div>
          <div className="flex-1 min-w-0">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r ${getSlideColor(slide.type)} text-white`}>
              {slide.type || 'slide'}
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-stone-800 dark:text-stone-100 mt-2">
              {slide.title}
            </h3>
          </div>
        </div>

        <p className="text-stone-700 dark:text-stone-300 text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words mb-4">
          {slide.content}
        </p>

        {slide.highlightedTerm && (
          <div className="mb-4 p-3 rounded-xl border bg-white/50 dark:bg-stone-800/50 border-stone-200 dark:border-stone-600">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm">🔑</span>
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">Key Term</span>
            </div>
            <p className="text-stone-800 dark:text-stone-200 font-semibold">{slide.highlightedTerm}</p>
          </div>
        )}

        {slide.bulletPoints && slide.bulletPoints.length > 0 && (
          <div className="space-y-2">
            {slide.bulletPoints.map((point, idx) => {
              const itemId = `${currentSlide}-${idx}`;
              const isRevealed = revealedItems.has(itemId);
              return (
                <button
                  key={idx}
                  onClick={() => toggleReveal(itemId)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    isRevealed
                      ? 'bg-white dark:bg-stone-800 border-violet-300 dark:border-violet-600 shadow'
                      : 'bg-stone-100/50 dark:bg-stone-700/50 border-stone-200 dark:border-stone-600 hover:bg-stone-100 dark:hover:bg-stone-700'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${
                      isRevealed ? 'bg-violet-500 text-white' : 'bg-stone-300 dark:bg-stone-600 text-stone-600 dark:text-stone-300'
                    }`}>
                      {isRevealed ? '✓' : idx + 1}
                    </div>
                    <div className="flex-1">
                      {isRevealed ? (
                        <p className="text-stone-700 dark:text-stone-300 text-sm">{point}</p>
                      ) : (
                        <p className="text-stone-400 dark:text-stone-500 italic text-sm">Click to reveal...</p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3 mt-4 flex-shrink-0">
        <button
          onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
          disabled={currentSlide === 0}
          className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${
            currentSlide === 0
              ? 'bg-stone-100 dark:bg-stone-800 text-stone-400 cursor-not-allowed'
              : 'bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-600 border border-stone-200 dark:border-stone-600'
          }`}
        >
          <span>←</span> Previous
        </button>
        {currentSlide === slides.length - 1 && hasQuiz && onTryQuiz ? (
          <button
            onClick={onTryQuiz}
            className="px-4 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-lg shadow-amber-500/25 transition-all flex items-center gap-2"
          >
            <span>Try Quiz</span>
            <span>🎯</span>
          </button>
        ) : (
          <button
            onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))}
            disabled={currentSlide === slides.length - 1}
            className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${
              currentSlide === slides.length - 1
                ? 'bg-stone-100 dark:bg-stone-800 text-stone-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-lg shadow-amber-500/25'
            }`}
          >
            Next <span>→</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default LessonViewer;
