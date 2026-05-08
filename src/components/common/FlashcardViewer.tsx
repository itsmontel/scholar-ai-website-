import { useState, useEffect, useCallback } from 'react';

interface FlashCard {
  id: string;
  front: string;
  back: string;
}

interface FlashcardViewerProps {
  initialCards?: { front: string; back: string }[];
  title?: string;
  onExportPDF?: () => void;
  onExportDOCX?: () => void;
  onExportJSON?: () => void;
  onNewDeck?: () => void;
  canExport?: boolean;
  onCardsChange?: (cards: FlashCard[]) => void;
  onLoadPrevious?: () => void;
  isCreateFromScratch?: boolean;
  /** When provided, shows an enlarge button to open in full page */
  onEnlarge?: () => void;
  /** When provided, shows Save to Saved Materials button - called with (title, cards) */
  onSaveToStudyTools?: (title: string, cards: { front: string; back: string }[]) => void | Promise<void>;
}

type ThemeId = 'violet' | 'emerald' | 'blue' | 'amber' | 'rose';
type FontSize = 'small' | 'medium' | 'large';
type CardStyle = 'minimal' | 'bordered' | 'elevated';
type StudyDirection = 'front-to-back' | 'back-to-front' | 'both';

interface Theme {
  id: ThemeId;
  name: string;
  frontBg: string;
  frontBorder: string;
  frontText: string;
  frontAccent: string;
  backBg: string;
  backBorder: string;
  backText: string;
  backAccent: string;
}

const THEMES: Theme[] = [
  { id: 'violet', name: 'Violet', frontBg: 'from-white to-violet-50 dark:from-gray-800 dark:to-violet-950/30', frontBorder: 'border-violet-400 dark:border-violet-500', frontText: 'text-gray-800 dark:text-gray-50', frontAccent: 'text-violet-600 dark:text-violet-400', backBg: 'from-violet-50 to-fuchsia-50 dark:from-violet-950/30 dark:to-fuchsia-950/30', backBorder: 'border-fuchsia-400 dark:border-fuchsia-500', backText: 'text-gray-800 dark:text-gray-50', backAccent: 'text-fuchsia-600 dark:text-fuchsia-400' },
  { id: 'emerald', name: 'Emerald', frontBg: 'from-white to-emerald-50 dark:from-gray-800 dark:to-emerald-950/30', frontBorder: 'border-emerald-400 dark:border-emerald-500', frontText: 'text-gray-800 dark:text-gray-50', frontAccent: 'text-emerald-600 dark:text-emerald-400', backBg: 'from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30', backBorder: 'border-teal-400 dark:border-teal-500', backText: 'text-gray-800 dark:text-gray-50', backAccent: 'text-teal-600 dark:text-teal-400' },
  { id: 'blue', name: 'Blue', frontBg: 'from-white to-sky-50 dark:from-gray-800 dark:to-sky-950/30', frontBorder: 'border-sky-400 dark:border-sky-500', frontText: 'text-gray-800 dark:text-gray-50', frontAccent: 'text-sky-600 dark:text-sky-400', backBg: 'from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30', backBorder: 'border-blue-400 dark:border-blue-500', backText: 'text-gray-800 dark:text-gray-50', backAccent: 'text-blue-600 dark:text-blue-400' },
  { id: 'amber', name: 'Amber', frontBg: 'from-white to-amber-50 dark:from-gray-800 dark:to-amber-950/30', frontBorder: 'border-amber-400 dark:border-amber-500', frontText: 'text-gray-800 dark:text-gray-50', frontAccent: 'text-amber-600 dark:text-amber-400', backBg: 'from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30', backBorder: 'border-orange-400 dark:border-orange-500', backText: 'text-gray-800 dark:text-gray-50', backAccent: 'text-orange-600 dark:text-orange-400' },
  { id: 'rose', name: 'Fuchsia', frontBg: 'from-white to-fuchsia-50 dark:from-gray-800 dark:to-fuchsia-950/30', frontBorder: 'border-fuchsia-400 dark:border-fuchsia-500', frontText: 'text-gray-800 dark:text-gray-50', frontAccent: 'text-fuchsia-600 dark:text-fuchsia-400', backBg: 'from-fuchsia-50 to-pink-50 dark:from-fuchsia-950/30 dark:to-pink-950/30', backBorder: 'border-pink-400 dark:border-pink-500', backText: 'text-gray-800 dark:text-gray-50', backAccent: 'text-pink-600 dark:text-pink-400' },
];

const THEME_DOTS: Record<ThemeId, string> = {
  violet: 'bg-violet-500',
  emerald: 'bg-emerald-500',
  blue: 'bg-sky-500',
  amber: 'bg-amber-500',
  rose: 'bg-fuchsia-500',
};

const THEME_RINGS: Record<ThemeId, string> = {
  violet: 'ring-violet-400',
  emerald: 'ring-emerald-400',
  blue: 'ring-sky-400',
  amber: 'ring-amber-400',
  rose: 'ring-fuchsia-400',
};

const FONT_SIZES: { id: FontSize; name: string; front: string; back: string }[] = [
  { id: 'small', name: 'S', front: 'text-base sm:text-lg', back: 'text-sm sm:text-base' },
  { id: 'medium', name: 'M', front: 'text-lg sm:text-2xl', back: 'text-base sm:text-xl' },
  { id: 'large', name: 'L', front: 'text-xl sm:text-3xl', back: 'text-lg sm:text-2xl' },
];

const CARD_STYLES: { id: CardStyle; name: string }[] = [
  { id: 'minimal', name: 'Minimal' },
  { id: 'bordered', name: 'Bordered' },
  { id: 'elevated', name: 'Elevated' },
];

const FlashcardViewer = ({
  initialCards = [],
  title = 'Flashcards',
  onExportPDF,
  onExportDOCX,
  onExportJSON,
  onNewDeck,
  canExport = false,
  onCardsChange,
  onLoadPrevious,
  isCreateFromScratch = false,
  onEnlarge,
  onSaveToStudyTools,
}: FlashcardViewerProps) => {
  const [cards, setCards] = useState<FlashCard[]>(() =>
    initialCards.map((c, i) => ({ id: `card-${i}-${Date.now()}`, front: c.front, back: c.back }))
  );
  const [deckTitle, setDeckTitle] = useState(title);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCards, setKnownCards] = useState<Set<number>>(new Set());

  const [theme, setTheme] = useState<ThemeId>('violet');
  const [fontSize, setFontSize] = useState<FontSize>('medium');
  const [cardStyle, setCardStyle] = useState<CardStyle>('bordered');
  const [studyDirection, setStudyDirection] = useState<StudyDirection>('front-to-back');

  const [showSettings, setShowSettings] = useState(false);
  const [showCardList, setShowCardList] = useState(false);
  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [editFront, setEditFront] = useState('');
  const [editBack, setEditBack] = useState('');
  const [showAddCard, setShowAddCard] = useState(false);
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');

  useEffect(() => {
    if (initialCards.length > 0) {
      setCards(initialCards.map((c, i) => ({ id: `card-${i}-${Date.now()}`, front: c.front, back: c.back })));
      setCurrentCard(0);
      setIsFlipped(false);
      setKnownCards(new Set());
    }
  }, [initialCards]);

  useEffect(() => {
    setDeckTitle(title);
  }, [title]);

  const handleSaveToStudyTools = async () => {
    if (!onSaveToStudyTools || cards.length === 0) return;
    const trimmedTitle = deckTitle.trim() || 'My Flashcards';
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);
    try {
      await onSaveToStudyTools(trimmedTitle, cards.map(c => ({ front: c.front, back: c.back })));
      setDeckTitle(trimmedTitle);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to save');
      setTimeout(() => setSaveError(null), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    onCardsChange?.(cards);
  }, [cards, onCardsChange]);

  const currentTheme = THEMES.find(t => t.id === theme) || THEMES[0];
  const currentFontSize = FONT_SIZES.find(f => f.id === fontSize) || FONT_SIZES[1];

  const getCardClasses = (side: 'front' | 'back') => {
    const t = currentTheme;
    const bg = side === 'front' ? t.frontBg : t.backBg;
    const border = side === 'front' ? t.frontBorder : t.backBorder;

    if (cardStyle === 'minimal') {
      return `bg-white dark:bg-gray-800 border-4 ${border}`;
    }
    if (cardStyle === 'bordered') {
      return `bg-gradient-to-br ${bg} ${border} border-4 shadow-md`;
    }
    return `bg-gradient-to-br ${bg} ${border} border-4 shadow-xl shadow-gray-300/60 dark:shadow-gray-900/60`;
  };

  const shuffleCards = useCallback(() => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentCard(0);
    setIsFlipped(false);
    setKnownCards(new Set());
  }, [cards]);

  const handleAddCard = () => {
    if (!newFront.trim() || !newBack.trim()) return;
    const newCard: FlashCard = {
      id: `card-${Date.now()}`,
      front: newFront.trim(),
      back: newBack.trim(),
    };
    setCards([...cards, newCard]);
    setNewFront('');
    setNewBack('');
    setShowAddCard(false);
  };

  const handleEditCard = (card: FlashCard) => {
    setEditingCard(card.id);
    setEditFront(card.front);
    setEditBack(card.back);
  };

  const handleSaveEdit = () => {
    if (!editingCard || !editFront.trim() || !editBack.trim()) return;
    setCards(cards.map(c => c.id === editingCard ? { ...c, front: editFront.trim(), back: editBack.trim() } : c));
    setEditingCard(null);
    setEditFront('');
    setEditBack('');
  };

  const handleDeleteCard = (id: string) => {
    const idx = cards.findIndex(c => c.id === id);
    setCards(cards.filter(c => c.id !== id));
    if (currentCard >= cards.length - 1) setCurrentCard(Math.max(0, cards.length - 2));
    const newKnown = new Set<number>();
    knownCards.forEach(k => {
      if (k < idx) newKnown.add(k);
      else if (k > idx) newKnown.add(k - 1);
    });
    setKnownCards(newKnown);
  };

  const getDisplayContent = (card: FlashCard, side: 'front' | 'back') => {
    if (studyDirection === 'front-to-back') {
      return side === 'front' ? card.front : card.back;
    }
    if (studyDirection === 'back-to-front') {
      return side === 'front' ? card.back : card.front;
    }
    return side === 'front' ? card.front : card.back;
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (editingCard || showAddCard) return;
    if (e.code === 'Space') {
      e.preventDefault();
      setIsFlipped(f => !f);
    } else if (e.code === 'ArrowLeft' && currentCard > 0) {
      setCurrentCard(c => c - 1);
      setIsFlipped(false);
    } else if (e.code === 'ArrowRight' && currentCard < cards.length - 1) {
      setCurrentCard(c => c + 1);
      setIsFlipped(false);
    } else if (e.code === 'Digit1' || e.code === 'Numpad1') {
      const newKnown = new Set(knownCards);
      newKnown.add(currentCard);
      setKnownCards(newKnown);
    } else if (e.code === 'Digit2' || e.code === 'Numpad2') {
      const newKnown = new Set(knownCards);
      newKnown.delete(currentCard);
      setKnownCards(newKnown);
    }
  }, [currentCard, cards.length, knownCards, editingCard, showAddCard]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // ── CARD-SIDE ACCENT COLOR MAPS (for badges) ──
  const SIDE_BADGE_COLORS: Record<ThemeId, { front: string; back: string }> = {
    violet: { front: 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300', back: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/50 dark:text-fuchsia-300' },
    emerald: { front: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300', back: 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300' },
    blue: { front: 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300', back: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' },
    amber: { front: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300', back: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300' },
    rose: { front: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/50 dark:text-fuchsia-300', back: 'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300' },
  };

  // ── CARD-LIST left-border accent per theme ──
  const CARD_LIST_BORDER: Record<ThemeId, string> = {
    violet: 'border-l-violet-400',
    emerald: 'border-l-emerald-400',
    blue: 'border-l-sky-400',
    amber: 'border-l-amber-400',
    rose: 'border-l-fuchsia-400',
  };

  if (cards.length === 0) {
    return (
      <div className="relative overflow-hidden" style={{ fontFamily: "'Nunito', 'Nunito Sans', sans-serif" }}>
        {/* Background decorations */}
        <div className="absolute inset-0 bg-gradient-to-br from-sky-100 via-violet-100 to-fuchsia-100 dark:from-sky-950/40 dark:via-violet-950/40 dark:to-fuchsia-950/40 rounded-3xl" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-yellow-200/50 to-orange-200/50 dark:from-yellow-800/20 dark:to-orange-800/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-green-200/50 to-emerald-200/50 dark:from-green-800/20 dark:to-emerald-800/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

        {/* Floating card decorations */}
        <div className="absolute top-12 right-8 sm:right-16 w-16 h-20 bg-white/70 dark:bg-gray-700/60 rounded-2xl shadow-lg rotate-12 border-2 border-amber-300/60 dark:border-amber-600/50 hidden sm:block" />
        <div className="absolute top-20 right-4 sm:right-8 w-14 h-18 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 rounded-2xl shadow-lg -rotate-6 border-2 border-green-300/60 dark:border-green-600/50 hidden sm:block" />
        <div className="absolute bottom-16 left-8 sm:left-12 w-12 h-16 bg-gradient-to-br from-fuchsia-100 to-pink-100 dark:from-fuchsia-900/40 dark:to-pink-900/40 rounded-xl shadow-md rotate-6 border-2 border-fuchsia-300/60 dark:border-fuchsia-600/50 hidden sm:block" />

        <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl p-6 sm:p-10 border-2 border-violet-200/70 dark:border-violet-700/50 shadow-xl">
          {/* Header with Go Back */}
          {onNewDeck && (
            <button
              onClick={onNewDeck}
              className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-2 px-4 py-2.5 text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-bold rounded-2xl hover:bg-violet-100/80 dark:hover:bg-violet-900/30 transition-all border-b-3 border-violet-200 dark:border-violet-700 active:border-b-0 active:translate-y-0.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Go Back
            </button>
          )}

          <div className="text-center pt-8 sm:pt-4">
            {/* Icon */}
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 mx-auto mb-6">
              <div className="absolute inset-0 bg-amber-400 rounded-3xl rotate-6 opacity-30" />
              <div className="absolute inset-0 bg-orange-400 rounded-3xl -rotate-3 opacity-30" />
              <div className="relative w-full h-full rounded-3xl flex items-center justify-center shadow-lg border-b-4 border-orange-600" style={{ background: '#FF9600' }}>
                <span className="text-5xl sm:text-6xl">✏️</span>
              </div>
            </div>

            {/* Title & Description */}
            <h3 className="text-2xl sm:text-3xl font-extrabold mb-3" style={{ color: '#1CB0F6' }}>
              Create Your Deck
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base max-w-md mx-auto mb-4 font-medium">
              Build custom flashcards from scratch or load one of your previously saved decks to continue studying
            </p>
            {/* Deck name - show when creating from scratch */}
            {isCreateFromScratch && (
              <div className="mb-6 max-w-xs mx-auto">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Deck name</label>
                <input
                  type="text"
                  value={deckTitle}
                  onChange={e => setDeckTitle(e.target.value)}
                  placeholder="e.g. Biology Chapter 5"
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-sky-400/40 focus:border-sky-400 focus:outline-none text-sm font-semibold"
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-8">
              <button
                onClick={() => setShowAddCard(true)}
                className="w-full sm:w-auto px-7 py-4 text-white font-extrabold rounded-2xl transition-all shadow-lg hover:scale-[1.02] flex items-center justify-center gap-2 border-b-4 active:border-b-0 active:translate-y-1 uppercase tracking-wide text-sm"
                style={{ background: '#58CC02', borderBottomColor: '#46a302' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Create First Card
              </button>

              {onLoadPrevious && (
                <button
                  onClick={onLoadPrevious}
                  className="w-full sm:w-auto px-7 py-4 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 border-b-4 border-b-gray-300 dark:border-b-gray-500 text-gray-700 dark:text-gray-300 font-extrabold rounded-2xl transition-all hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center justify-center gap-2 active:border-b-2 active:translate-y-0.5 uppercase tracking-wide text-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  Load Previous Deck
                </button>
              )}
            </div>

            {/* Tips section */}
            <div className="bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 rounded-2xl p-4 sm:p-5 border-2 border-sky-200 dark:border-sky-800/50">
              <h4 className="text-sm font-extrabold text-sky-700 dark:text-sky-300 mb-3 flex items-center justify-center gap-2">
                <span>💡</span> Quick Tips
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
                <div className="flex items-start gap-2">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-white font-extrabold text-xs flex-shrink-0" style={{ background: '#FF9600' }}>1</span>
                  <span className="text-gray-600 dark:text-gray-400 text-left font-medium">Keep questions concise and focused on one concept</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-white font-extrabold text-xs flex-shrink-0" style={{ background: '#58CC02' }}>2</span>
                  <span className="text-gray-600 dark:text-gray-400 text-left font-medium">Include examples in answers when helpful</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-white font-extrabold text-xs flex-shrink-0" style={{ background: '#1CB0F6' }}>3</span>
                  <span className="text-gray-600 dark:text-gray-400 text-left font-medium">Review and shuffle for better retention</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Add Card Modal - Enhanced */}
        {showAddCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddCard(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border-2 border-gray-100 dark:border-gray-700" onClick={e => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="px-6 py-5" style={{ background: 'linear-gradient(135deg, #8B5CF6, #A855F7)' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/25 rounded-2xl flex items-center justify-center border-b-2 border-white/20">
                      <span className="text-2xl">🃏</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-extrabold text-white">New Flashcard</h3>
                      <p className="text-violet-200 text-xs font-bold">Card #{cards.length + 1}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowAddCard(false)} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5">
                <div>
                  <label className="flex items-center gap-2 text-sm font-extrabold text-gray-700 dark:text-gray-300 mb-2">
                    <span className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs font-extrabold" style={{ background: '#FF9600' }}>Q</span>
                    Front Side (Question/Term)
                  </label>
                  <textarea
                    value={newFront}
                    onChange={e => setNewFront(e.target.value)}
                    placeholder="What do you want to remember?"
                    className="w-full p-4 border-2 border-gray-200 dark:border-gray-600 rounded-2xl bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 resize-none focus:outline-none focus:border-sky-400 dark:focus:border-sky-400 focus:ring-2 focus:ring-sky-400/30 focus:bg-white dark:focus:bg-gray-800 transition-all font-medium"
                    rows={3}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-extrabold text-gray-700 dark:text-gray-300 mb-2">
                    <span className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs font-extrabold" style={{ background: '#8B5CF6' }}>A</span>
                    Back Side (Answer/Definition)
                  </label>
                  <textarea
                    value={newBack}
                    onChange={e => setNewBack(e.target.value)}
                    placeholder="The answer or explanation..."
                    className="w-full p-4 border-2 border-gray-200 dark:border-gray-600 rounded-2xl bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 resize-none focus:outline-none focus:border-violet-400 dark:focus:border-violet-400 focus:ring-2 focus:ring-violet-400/30 focus:bg-white dark:focus:bg-gray-800 transition-all font-medium"
                    rows={3}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 px-6 pb-6">
                <button onClick={() => setShowAddCard(false)} className="flex-1 px-4 py-3.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-extrabold rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors border-b-4 border-gray-200 dark:border-gray-600 active:border-b-0 active:translate-y-1 uppercase text-sm">
                  Cancel
                </button>
                <button
                  onClick={handleAddCard}
                  disabled={!newFront.trim() || !newBack.trim()}
                  className="flex-1 px-4 py-3.5 text-white font-extrabold rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md disabled:shadow-none flex items-center justify-center gap-2 border-b-4 active:border-b-0 active:translate-y-1 uppercase text-sm"
                  style={{ background: '#58CC02', borderBottomColor: '#46a302' }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Add Card
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const card = cards[currentCard];

  return (
    <div className="space-y-4 min-w-0 w-full overflow-x-hidden max-w-4xl mx-auto" style={{ fontFamily: "'Nunito', 'Nunito Sans', sans-serif" }}>
      {/* Header with title and controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {isEditingTitle ? (
            <input
              type="text"
              value={deckTitle}
              onChange={e => setDeckTitle(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={e => { if (e.key === 'Enter') setIsEditingTitle(false); }}
              autoFocus
              className="text-lg font-extrabold text-gray-800 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 rounded-xl px-3 py-1.5 border-2 border-sky-300 dark:border-sky-600 focus:ring-2 focus:ring-sky-400/40 focus:border-sky-400 focus:outline-none min-w-[120px] max-w-[240px]"
              placeholder="Set name"
            />
          ) : (
            <h3
              onClick={() => setIsEditingTitle(true)}
              className="text-lg font-extrabold text-gray-800 dark:text-gray-100 cursor-pointer hover:text-violet-600 dark:hover:text-violet-400 transition-colors truncate max-w-[200px] sm:max-w-[280px]"
              title="Click to rename"
            >
              {deckTitle || 'Flashcards'}
            </h3>
          )}
          <button
            onClick={() => setIsEditingTitle(true)}
            className="p-1 text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 rounded transition-colors shrink-0"
            title="Rename set"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
          </button>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {canExport && onExportPDF && (
            <button onClick={onExportPDF} className="px-3.5 py-2 font-bold rounded-2xl transition-all flex items-center gap-1.5 text-xs border-b-3 active:border-b-0 active:translate-y-0.5 text-white uppercase tracking-wide" style={{ background: '#FF4B4B', borderBottomColor: '#cc3c3c' }}>
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
              PDF
            </button>
          )}
          {canExport && onExportDOCX && (
            <button onClick={onExportDOCX} className="px-3.5 py-2 font-bold rounded-2xl transition-all flex items-center gap-1.5 text-xs border-b-3 active:border-b-0 active:translate-y-0.5 text-white uppercase tracking-wide" style={{ background: '#1CB0F6', borderBottomColor: '#168ec5' }}>
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
              DOCX
            </button>
          )}
          {onExportJSON && (
            <button onClick={onExportJSON} className="px-3.5 py-2 font-bold rounded-2xl transition-all flex items-center gap-1.5 text-xs border-b-3 active:border-b-0 active:translate-y-0.5 text-white uppercase tracking-wide" style={{ background: '#58CC02', borderBottomColor: '#46a302' }}>
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm3 10a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm-2-4a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1z" clipRule="evenodd"/></svg>
              JSON
            </button>
          )}
          <button onClick={() => setShowCardList(!showCardList)} className={`px-3.5 py-2 font-bold rounded-2xl transition-all flex items-center gap-1.5 text-xs border-b-3 active:border-b-0 active:translate-y-0.5 uppercase tracking-wide ${showCardList ? 'text-white border-b-sky-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-b-gray-200 dark:border-b-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'}`} style={showCardList ? { background: '#1CB0F6', borderBottomColor: '#168ec5' } : undefined}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
            Cards
          </button>
          <button onClick={() => setShowSettings(!showSettings)} className={`px-3.5 py-2 font-bold rounded-2xl transition-all flex items-center gap-1.5 text-xs border-b-3 active:border-b-0 active:translate-y-0.5 uppercase tracking-wide ${showSettings ? 'text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-b-gray-200 dark:border-b-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'}`} style={showSettings ? { background: '#FF9600', borderBottomColor: '#cc7800' } : undefined}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Style
          </button>
          {onNewDeck && (
            <button onClick={onNewDeck} className="px-3.5 py-2 text-white font-bold rounded-2xl transition-all text-xs border-b-3 active:border-b-0 active:translate-y-0.5 uppercase tracking-wide" style={{ background: '#FF9600', borderBottomColor: '#cc7800' }}>
              New Deck
            </button>
          )}
          {onEnlarge && (
            <button onClick={onEnlarge} className="px-3.5 py-2 text-white font-bold rounded-2xl transition-all text-xs flex items-center gap-1.5 border-b-3 active:border-b-0 active:translate-y-0.5 uppercase tracking-wide" title="Open in full page" style={{ background: '#8B5CF6', borderBottomColor: '#6d45c4' }}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
              Enlarge
            </button>
          )}
          {onSaveToStudyTools && cards.length > 0 && (
            <div className="flex items-center gap-2">
              {saveError && (
                <span className="text-xs text-red-600 dark:text-red-400 max-w-[120px] truncate font-bold" title={saveError}>{saveError}</span>
              )}
              <button
                onClick={handleSaveToStudyTools}
                disabled={isSaving}
                className={`px-3.5 py-2 font-bold rounded-2xl transition-all text-xs flex items-center gap-1.5 border-b-3 active:border-b-0 active:translate-y-0.5 uppercase tracking-wide ${saveSuccess ? 'text-white' : 'text-white'}`}
                title="Save to Saved Materials"
                style={{ background: saveSuccess ? '#58CC02' : '#58CC02', borderBottomColor: '#46a302' }}
              >
                {isSaving ? (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : saveSuccess ? (
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                )}
                {saveSuccess ? 'Saved!' : isSaving ? 'Saving...' : 'Save to Saved Materials'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-800/80 dark:to-gray-800/80 rounded-3xl p-5 border-2 border-amber-200 dark:border-amber-700/50 space-y-4 animate-in slide-in-from-top-2 duration-200 shadow-md">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-gray-800 dark:text-gray-100 text-sm flex items-center gap-2">
              <span className="text-lg">🎨</span> Customize Cards
            </h4>
            <button onClick={() => setShowSettings(false)} className="p-1.5 text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors rounded-xl hover:bg-orange-100 dark:hover:bg-orange-900/30">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Theme Selection */}
          <div>
            <label className="block text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Theme color</label>
            <div className="flex flex-wrap gap-3">
              {(Object.keys(THEME_DOTS) as ThemeId[]).map(key => (
                <button
                  key={key}
                  onClick={() => setTheme(key)}
                  title={key}
                  className={`relative w-11 h-11 rounded-2xl ${THEME_DOTS[key]} transition-all hover:scale-110 border-b-4 border-black/20 active:border-b-0 active:translate-y-0.5 ${theme === key ? `ring-3 ring-offset-2 dark:ring-offset-gray-800 ${THEME_RINGS[key]} scale-110` : ''}`}
                >
                  {theme === key && (
                    <svg className="absolute inset-0 m-auto w-5 h-5 text-white drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Font Size & Card Style */}
          <div className="flex flex-wrap gap-6">
            <div>
              <label className="block text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Font size</label>
              <div className="flex gap-2">
                {FONT_SIZES.map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFontSize(f.id)}
                    className={`w-10 h-10 rounded-2xl text-xs font-extrabold transition-all border-b-3 active:border-b-0 active:translate-y-0.5 ${fontSize === f.id ? 'text-white border-b-sky-700' : 'bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 border-b-gray-300 dark:border-b-gray-500 text-gray-600 dark:text-gray-400 hover:border-gray-300'}`}
                    style={fontSize === f.id ? { background: '#1CB0F6', borderBottomColor: '#168ec5' } : undefined}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Card style</label>
              <div className="flex gap-2">
                {CARD_STYLES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setCardStyle(s.id)}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all capitalize border-b-3 active:border-b-0 active:translate-y-0.5 ${cardStyle === s.id ? 'text-white' : 'bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 border-b-gray-300 dark:border-b-gray-500 text-gray-600 dark:text-gray-400 hover:border-gray-300'}`}
                    style={cardStyle === s.id ? { background: '#FF9600', borderBottomColor: '#cc7800' } : undefined}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Study Options */}
          <div className="flex flex-wrap gap-6">
            <div>
              <label className="block text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Study Direction</label>
              <select
                value={studyDirection}
                onChange={e => setStudyDirection(e.target.value as StudyDirection)}
                className="px-4 py-2.5 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-2xl text-xs font-bold text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-400"
              >
                <option value="front-to-back">Front → Back</option>
                <option value="back-to-front">Back → Front</option>
                <option value="both">Random</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={shuffleCards}
                className="px-5 py-2.5 text-white text-xs font-extrabold rounded-2xl transition-all shadow-md flex items-center gap-1.5 border-b-4 active:border-b-0 active:translate-y-1 uppercase tracking-wide"
                style={{ background: '#CE82FF', borderBottomColor: '#a568cc' }}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                Shuffle
              </button>
            </div>
          </div>

          {/* Keyboard shortcuts hint */}
          <div className="pt-2 border-t-2 border-amber-200/60 dark:border-gray-700">
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold">
              <span className="font-extrabold">Shortcuts:</span> Space = flip, ←/→ = prev/next, 1 = mark known, 2 = unmark
            </p>
          </div>
        </div>
      )}

      {/* Card List Panel */}
      {showCardList && (
        <div className="bg-gradient-to-br from-sky-50/70 to-blue-50/70 dark:from-sky-900/15 dark:to-blue-900/15 rounded-3xl p-5 border-2 border-sky-200/70 dark:border-sky-700/40 animate-in slide-in-from-top-2 duration-200 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-extrabold text-gray-800 dark:text-gray-100 text-sm flex items-center gap-2">
              <span className="text-lg">📚</span>
              All Cards ({cards.length})
            </h4>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddCard(true)}
                className="px-4 py-2 text-white text-xs font-extrabold rounded-2xl transition-all shadow-md flex items-center gap-1 border-b-3 active:border-b-0 active:translate-y-0.5 uppercase tracking-wide"
                style={{ background: '#58CC02', borderBottomColor: '#46a302' }}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Add Card
              </button>
              <button onClick={() => setShowCardList(false)} className="p-1.5 text-gray-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/30 rounded-xl transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {cards.map((c, idx) => (
              <div
                key={c.id}
                className={`p-3 rounded-2xl border-2 transition-all cursor-pointer border-l-4 ${CARD_LIST_BORDER[theme]} ${idx === currentCard ? 'bg-sky-50 dark:bg-sky-900/30 border-sky-200 dark:border-sky-700 shadow-sm' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm'}`}
                onClick={() => { setCurrentCard(idx); setIsFlipped(false); }}
              >
                {editingCard === c.id ? (
                  <div className="space-y-2" onClick={e => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editFront}
                      onChange={e => setEditFront(e.target.value)}
                      className="w-full p-2.5 text-sm border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-medium focus:border-sky-400 focus:outline-none"
                      placeholder="Front"
                    />
                    <input
                      type="text"
                      value={editBack}
                      onChange={e => setEditBack(e.target.value)}
                      className="w-full p-2.5 text-sm border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-medium focus:border-sky-400 focus:outline-none"
                      placeholder="Back"
                    />
                    <div className="flex gap-2">
                      <button onClick={handleSaveEdit} className="px-4 py-2 text-white text-xs font-bold rounded-xl transition-colors border-b-3 active:border-b-0 active:translate-y-0.5" style={{ background: '#58CC02', borderBottomColor: '#46a302' }}>Save</button>
                      <button onClick={() => setEditingCard(null)} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors border-b-3 border-b-gray-200 dark:border-b-gray-600 active:border-b-0 active:translate-y-0.5">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-extrabold text-gray-400 dark:text-gray-500">#{idx + 1}</span>
                        {knownCards.has(idx) && <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full" style={{ background: '#E5F9D5', color: '#58CC02' }}>✓ Known</span>}
                      </div>
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">{c.front}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate font-medium">{c.back}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={e => { e.stopPropagation(); handleEditCard(c); }}
                        className="p-1.5 text-gray-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/30 rounded-xl transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); handleDeleteCard(c.id); }}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex-1 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-300" style={{ width: `${((currentCard + 1) / cards.length) * 100}%`, background: '#58CC02' }}></div>
        </div>
        <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-extrabold flex-shrink-0">{currentCard + 1}/{cards.length}</span>
        {knownCards.size > 0 && <span className="text-xs sm:text-sm font-extrabold flex-shrink-0" style={{ color: '#58CC02' }}>{knownCards.size} ✓</span>}
      </div>

      {/* The flip card */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="relative cursor-pointer select-none mx-auto max-w-2xl"
        style={{ perspective: '1000px' }}
      >
        <div
          className="relative w-full transition-transform duration-500"
          style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
        >
          {/* Front */}
          <div
            className={`w-full min-h-[200px] sm:min-h-[320px] ${getCardClasses('front')} rounded-3xl p-5 sm:p-8 flex flex-col items-center justify-center text-center shadow-lg`}
            style={{ backfaceVisibility: 'hidden' }}
          >
            <span className={`inline-block text-[10px] sm:text-xs font-extrabold uppercase tracking-wider mb-3 sm:mb-4 px-3 py-1 rounded-full ${SIDE_BADGE_COLORS[theme].front}`}>
              {studyDirection === 'back-to-front' ? 'Back' : 'Front'}
            </span>
            <p className={`${currentFontSize.front} font-bold ${currentTheme.frontText} leading-relaxed break-words max-w-full`}>
              {getDisplayContent(card, 'front')}
            </p>
            <p className={`text-xs sm:text-sm ${currentTheme.frontAccent} mt-4 sm:mt-6 font-bold`}>🔄 Tap to flip</p>
          </div>
          {/* Back */}
          <div
            className={`absolute inset-0 w-full min-h-[200px] sm:min-h-[320px] ${getCardClasses('back')} rounded-3xl p-5 sm:p-8 flex flex-col items-center justify-center text-center shadow-lg`}
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <span className={`inline-block text-[10px] sm:text-xs font-extrabold uppercase tracking-wider mb-3 sm:mb-4 px-3 py-1 rounded-full ${SIDE_BADGE_COLORS[theme].back}`}>
              {studyDirection === 'back-to-front' ? 'Front' : 'Back'}
            </span>
            <p className={`${currentFontSize.back} ${currentTheme.backText} leading-relaxed break-words max-w-full font-medium`}>
              {getDisplayContent(card, 'back')}
            </p>
            <p className={`text-xs sm:text-sm ${currentTheme.backAccent} mt-4 sm:mt-6 font-bold`}>🔄 Tap to flip back</p>
          </div>
        </div>
      </div>

      {/* Navigation + Know/Don't Know */}
      <div className="flex items-center justify-center gap-2 sm:gap-3">
        <button
          onClick={() => { setCurrentCard(Math.max(0, currentCard - 1)); setIsFlipped(false); }}
          disabled={currentCard === 0}
          className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-extrabold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-b-4 border-b-gray-300 dark:border-b-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-30 transition-all active:border-b-0 active:translate-y-1 uppercase tracking-wide"
        >
          ← <span className="hidden sm:inline">Previous</span>
        </button>
        <button
          onClick={() => {
            const newKnown = new Set(knownCards);
            if (newKnown.has(currentCard)) newKnown.delete(currentCard);
            else newKnown.add(currentCard);
            setKnownCards(newKnown);
          }}
          className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-extrabold transition-all border-b-4 active:border-b-0 active:translate-y-1 uppercase tracking-wide ${
            knownCards.has(currentCard)
              ? 'text-white shadow-md'
              : 'bg-white dark:bg-gray-800 border-2 border-green-300 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/30'
          }`}
          style={knownCards.has(currentCard) ? { background: '#58CC02', borderBottomColor: '#46a302', color: 'white' } : { borderBottomColor: '#86efac', color: '#16a34a' }}
        >
          {knownCards.has(currentCard) ? '✓ Mastered' : 'Mark Known'}
        </button>
        <button
          onClick={() => { setCurrentCard(Math.min(cards.length - 1, currentCard + 1)); setIsFlipped(false); }}
          disabled={currentCard >= cards.length - 1}
          className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-extrabold text-white disabled:opacity-30 transition-all border-b-4 active:border-b-0 active:translate-y-1 uppercase tracking-wide"
          style={{ background: '#FF9600', borderBottomColor: '#cc7800' }}
        >
          <span className="hidden sm:inline">Next </span>→
        </button>
      </div>

      {/* Summary when all reviewed */}
      {knownCards.size === cards.length && (
        <div className="p-5 sm:p-8 border-2 border-green-300 dark:border-green-600 rounded-3xl text-center shadow-lg relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #E5F9D5, #D4F5C0)' }}>
          {/* Confetti decoration dots */}
          <div className="absolute top-3 left-6 w-3 h-3 rounded-full" style={{ background: '#FF9600' }} />
          <div className="absolute top-8 right-10 w-2 h-2 rounded-full" style={{ background: '#1CB0F6' }} />
          <div className="absolute bottom-6 left-12 w-2.5 h-2.5 rounded-full" style={{ background: '#CE82FF' }} />
          <div className="absolute top-4 right-1/4 w-2 h-2 rounded-full" style={{ background: '#FF4B4B' }} />
          <div className="absolute bottom-4 right-8 w-3 h-3 rounded-full" style={{ background: '#FFC800' }} />
          <div className="absolute top-1/3 left-4 w-1.5 h-1.5 rounded-full" style={{ background: '#58CC02' }} />

          <video
            src="/happymascot.mp4"
            autoPlay
            muted
            playsInline
            loop
            className="w-24 h-24 sm:w-28 sm:h-28 mx-auto mb-2 sm:mb-3 object-contain rounded-2xl border-4 shadow-lg overflow-hidden ring-4 ring-green-300/50"
            style={{ borderColor: '#58CC02' }}
          />
          <h3 className="text-xl sm:text-2xl font-extrabold" style={{ color: '#58CC02' }}>All cards mastered!</h3>
          <p className="text-green-700 dark:text-green-800 text-sm sm:text-base mt-1.5 font-bold">You've marked all {cards.length} cards as known. Great job! 🎉</p>
        </div>
      )}

      {/* Add Card Modal - Enhanced */}
      {showAddCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddCard(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border-2 border-gray-100 dark:border-gray-700" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="px-6 py-5" style={{ background: 'linear-gradient(135deg, #8B5CF6, #A855F7)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/25 rounded-2xl flex items-center justify-center border-b-2 border-white/20">
                    <span className="text-2xl">🃏</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-white">New Flashcard</h3>
                    <p className="text-violet-200 text-xs font-bold">Card #{cards.length + 1}</p>
                  </div>
                </div>
                <button onClick={() => setShowAddCard(false)} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              <div>
                <label className="flex items-center gap-2 text-sm font-extrabold text-gray-700 dark:text-gray-300 mb-2">
                  <span className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs font-extrabold" style={{ background: '#FF9600' }}>Q</span>
                  Front Side (Question/Term)
                </label>
                <textarea
                  value={newFront}
                  onChange={e => setNewFront(e.target.value)}
                  placeholder="What do you want to remember?"
                  className="w-full p-4 border-2 border-gray-200 dark:border-gray-600 rounded-2xl bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 resize-none focus:outline-none focus:border-sky-400 dark:focus:border-sky-400 focus:ring-2 focus:ring-sky-400/30 focus:bg-white dark:focus:bg-gray-800 transition-all font-medium"
                  rows={3}
                  autoFocus
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-extrabold text-gray-700 dark:text-gray-300 mb-2">
                  <span className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs font-extrabold" style={{ background: '#8B5CF6' }}>A</span>
                  Back Side (Answer/Definition)
                </label>
                <textarea
                  value={newBack}
                  onChange={e => setNewBack(e.target.value)}
                  placeholder="The answer or explanation..."
                  className="w-full p-4 border-2 border-gray-200 dark:border-gray-600 rounded-2xl bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 resize-none focus:outline-none focus:border-violet-400 dark:focus:border-violet-400 focus:ring-2 focus:ring-violet-400/30 focus:bg-white dark:focus:bg-gray-800 transition-all font-medium"
                  rows={3}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setShowAddCard(false)} className="flex-1 px-4 py-3.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-extrabold rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors border-b-4 border-gray-200 dark:border-gray-600 active:border-b-0 active:translate-y-1 uppercase text-sm">
                Cancel
              </button>
              <button
                onClick={handleAddCard}
                disabled={!newFront.trim() || !newBack.trim()}
                className="flex-1 px-4 py-3.5 text-white font-extrabold rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md disabled:shadow-none flex items-center justify-center gap-2 border-b-4 active:border-b-0 active:translate-y-1 uppercase text-sm"
                style={{ background: '#58CC02', borderBottomColor: '#46a302' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Add Card
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlashcardViewer;
