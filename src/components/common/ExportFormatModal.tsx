import { Fragment } from 'react';

export type ExportFormat = 'quiz' | 'flashcards' | 'crossword' | 'lesson' | 'notes';

const FORMAT_OPTIONS: { key: ExportFormat; label: string; icon: string }[] = [
  { key: 'quiz', label: 'Quiz', icon: '📝' },
  { key: 'flashcards', label: 'Flashcards', icon: '🃏' },
  { key: 'crossword', label: 'Crossword', icon: '🧩' },
  { key: 'lesson', label: 'Lesson', icon: '📖' },
  { key: 'notes', label: 'Original Notes', icon: '📄' },
];

interface ExportFormatModalProps {
  packData: any;
  packTitle: string;
  targetFormat: 'pdf' | 'docx' | 'json';
  onSelect: (format: ExportFormat) => void;
  onClose: () => void;
}

export default function ExportFormatModal({
  packData,
  packTitle,
  targetFormat,
  onSelect,
  onClose,
}: ExportFormatModalProps) {
  const hasData = (key: ExportFormat): boolean => {
    if (!packData) return false;
    switch (key) {
      case 'notes': return !!packData.originalNotes;
      case 'quiz': return !!packData.quiz?.questions?.length;
      case 'flashcards': return !!packData.flashcards?.cards?.length;
      case 'crossword': return !!packData.crossword?.placedWords?.length;
      case 'lesson': return !!packData.lesson?.slides?.length;
      default: return false;
    }
  };

  const availableFormats = targetFormat === 'json'
    ? FORMAT_OPTIONS.filter(f => f.key === 'flashcards' && hasData(f.key))
    : FORMAT_OPTIONS.filter(f => hasData(f.key));

  return (
    <Fragment>
      <div
        className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="fixed left-1/2 top-1/2 z-[91] w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white dark:bg-stone-800 shadow-2xl border border-stone-200 dark:border-stone-700 p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-format-title"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="export-format-title" className="text-lg font-bold text-stone-900 dark:text-stone-100">
            Export as {targetFormat === 'json' ? 'JSON' : targetFormat.toUpperCase()}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-sm text-stone-500 dark:text-stone-400 mb-5">
          Choose what to export from <span className="font-medium text-stone-700 dark:text-stone-300">{packTitle}</span>
        </p>
        <div className="space-y-2">
          {availableFormats.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => onSelect(key)}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-stone-200 dark:border-stone-600 hover:border-amber-400 dark:hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition-all text-left group"
            >
              <div className="w-11 h-11 rounded-xl bg-stone-100 dark:bg-stone-700 flex items-center justify-center text-xl group-hover:scale-105 transition-transform">
                {icon}
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-stone-800 dark:text-stone-100">{label}</span>
              </div>
              <svg className="w-5 h-5 text-stone-400 group-hover:text-amber-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
        {availableFormats.length === 0 && (
          <p className="text-sm text-stone-500 dark:text-stone-400 text-center py-4">
            No exportable content in this study pack.
          </p>
        )}
      </div>
    </Fragment>
  );
}
