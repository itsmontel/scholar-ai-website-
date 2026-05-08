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
  onEnlarge?: (state?: { slideIndex?: number }) => void;
  initialSlideIndex?: number;
  hasQuiz?: boolean;
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
    case 'intro': case 'summary': return 'bg-[#A560E8]';
    case 'concept': return 'bg-[#1CB0F6]';
    case 'example': return 'bg-[#FF9600]';
    case 'keypoint': return 'bg-[#58CC02]';
    case 'funfact': return 'bg-[#FF4B4B]';
    default: return 'bg-stone-500';
  }
};

const getSlideBorderColor = (type?: LessonSlide['type']) => {
  switch (type) {
    case 'intro': case 'summary': return 'border-[#8A48C7]';
    case 'concept': return 'border-[#1899D6]';
    case 'example': return 'border-[#D97F00]';
    case 'keypoint': return 'border-[#46A302]';
    case 'funfact': return 'border-[#E04343]';
    default: return 'border-stone-400';
  }
};

const getSlideBackground = (type?: LessonSlide['type']) => {
  switch (type) {
    case 'intro': case 'summary': return 'bg-[#F3EAFF] dark:bg-purple-900/10 border-[#A560E8]/25 dark:border-[#A560E8]/30';
    case 'concept': return 'bg-[#E8F6FF] dark:bg-blue-900/10 border-[#1CB0F6]/25 dark:border-[#1CB0F6]/30';
    case 'example': return 'bg-[#FFF4E0] dark:bg-orange-900/10 border-[#FF9600]/25 dark:border-[#FF9600]/30';
    case 'keypoint': return 'bg-[#EAFFD6] dark:bg-green-900/10 border-[#58CC02]/25 dark:border-[#58CC02]/30';
    case 'funfact': return 'bg-[#FFE8E8] dark:bg-red-900/10 border-[#FF4B4B]/25 dark:border-[#FF4B4B]/30';
    default: return 'bg-stone-50 dark:bg-stone-800/50 border-stone-200 dark:border-stone-600';
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
    <div className="p-4 flex flex-col min-h-0" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <span className="text-sm font-extrabold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
          {currentSlide + 1} / {slides.length}
        </span>
        {onEnlarge && (
          <button
            onClick={() => onEnlarge?.({ slideIndex: currentSlide })}
            className="text-xs px-3.5 py-2 rounded-xl bg-[#1CB0F6] text-white font-bold uppercase tracking-wide border-2 border-b-4 border-[#1899D6] active:border-b-2 active:translate-y-0.5 transition-all flex items-center gap-1.5"
          >
            <span>Full Screen</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="h-3 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#58CC02] rounded-r-full transition-all duration-300"
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
                ? `${getSlideColor(s.type)} scale-125 shadow-md`
                : index < currentSlide
                  ? 'bg-[#58CC02]'
                  : 'bg-stone-300 dark:bg-stone-600 hover:bg-stone-400 dark:hover:bg-stone-500'
            }`}
            title={`Slide ${index + 1}: ${s.title}`}
          />
        ))}
      </div>

      {/* Slide content */}
      <div className={`flex-1 rounded-2xl p-4 sm:p-6 min-w-0 overflow-auto border-2 border-b-4 ${getSlideBackground(slide.type)}`}>
        <div className="flex items-start gap-4 mb-4">
          <div className={`w-12 h-12 rounded-xl ${getSlideColor(slide.type)} border-2 border-b-4 ${getSlideBorderColor(slide.type)} flex items-center justify-center text-xl flex-shrink-0`}>
            {slide.emoji || getSlideIcon(slide.type)}
          </div>
          <div className="flex-1 min-w-0">
            <span className={`inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider text-white ${getSlideColor(slide.type)} border-b-2 ${getSlideBorderColor(slide.type)}`}>
              {slide.type || 'slide'}
            </span>
            <h3 className="text-lg sm:text-xl font-extrabold text-stone-800 dark:text-stone-100 mt-2">
              {slide.title}
            </h3>
          </div>
        </div>

        <p className="text-stone-700 dark:text-stone-300 text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words mb-4">
          {slide.content}
        </p>

        {slide.highlightedTerm && (
          <div className="mb-4 p-3 rounded-xl border-2 border-b-4 border-[#FF9600]/30 bg-[#FFF4E0] dark:bg-orange-900/10">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm">🔑</span>
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#FF9600]">Key Term</span>
            </div>
            <p className="text-stone-800 dark:text-stone-200 font-bold">{slide.highlightedTerm}</p>
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
                  className={`w-full text-left p-3 rounded-xl border-2 border-b-4 transition-all active:border-b-2 active:translate-y-0.5 ${
                    isRevealed
                      ? 'bg-[#EAFFD6] dark:bg-green-900/10 border-[#58CC02]/40'
                      : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-600 hover:border-stone-300 dark:hover:border-stone-500'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                      isRevealed ? 'bg-[#58CC02] text-white' : 'bg-stone-200 dark:bg-stone-600 text-stone-600 dark:text-stone-300'
                    }`}>
                      {isRevealed ? '✓' : idx + 1}
                    </div>
                    <div className="flex-1">
                      {isRevealed ? (
                        <p className="text-stone-700 dark:text-stone-300 text-sm font-medium">{point}</p>
                      ) : (
                        <p className="text-stone-400 dark:text-stone-500 italic text-sm">Tap to reveal...</p>
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
          className={`px-5 py-2.5 rounded-xl font-bold text-sm uppercase tracking-wide transition-all flex items-center gap-2 ${
            currentSlide === 0
              ? 'bg-stone-100 dark:bg-stone-800 text-stone-400 border-2 border-stone-200 dark:border-stone-700 cursor-not-allowed'
              : 'bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-200 border-2 border-b-4 border-stone-300 dark:border-stone-500 hover:bg-stone-50 dark:hover:bg-stone-600 active:border-b-2 active:translate-y-0.5'
          }`}
        >
          <span>←</span> Previous
        </button>
        {currentSlide === slides.length - 1 && hasQuiz && onTryQuiz ? (
          <button
            onClick={onTryQuiz}
            className="px-5 py-2.5 rounded-xl font-bold text-sm uppercase tracking-wide bg-[#1CB0F6] text-white border-2 border-b-4 border-[#1899D6] active:border-b-2 active:translate-y-0.5 transition-all flex items-center gap-2"
          >
            <span>Try Quiz</span>
            <span>🎯</span>
          </button>
        ) : (
          <button
            onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))}
            disabled={currentSlide === slides.length - 1}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm uppercase tracking-wide transition-all flex items-center gap-2 ${
              currentSlide === slides.length - 1
                ? 'bg-stone-100 dark:bg-stone-800 text-stone-400 border-2 border-stone-200 dark:border-stone-700 cursor-not-allowed'
                : 'bg-[#58CC02] text-white border-2 border-b-4 border-[#46A302] active:border-b-2 active:translate-y-0.5'
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
