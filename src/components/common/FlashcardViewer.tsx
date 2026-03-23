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
  { id: 'violet', name: 'Violet', frontBg: 'from-violet-50/80 to-violet-50/80 dark:from-violet-900/20 dark:to-violet-900/20', frontBorder: 'border-violet-200 dark:border-violet-700/50', frontText: 'text-stone-800 dark:text-stone-100', frontAccent: 'text-violet-600 dark:text-violet-400', backBg: 'from-violet-50/80 to-violet-50/80 dark:from-violet-900/20 dark:to-violet-900/20', backBorder: 'border-violet-200 dark:border-violet-700/50', backText: 'text-stone-800 dark:text-stone-100', backAccent: 'text-violet-600 dark:text-violet-400' },
  { id: 'emerald', name: 'Emerald', frontBg: 'from-emerald-50/80 to-teal-50/80 dark:from-emerald-900/20 dark:to-teal-900/20', frontBorder: 'border-emerald-200 dark:border-emerald-700/50', frontText: 'text-stone-800 dark:text-stone-100', frontAccent: 'text-emerald-600 dark:text-emerald-400', backBg: 'from-emerald-50/80 to-teal-50/80 dark:from-emerald-900/20 dark:to-teal-900/20', backBorder: 'border-emerald-200 dark:border-emerald-700/50', backText: 'text-stone-800 dark:text-stone-100', backAccent: 'text-emerald-600 dark:text-emerald-400' },
  { id: 'blue', name: 'Blue', frontBg: 'from-violet-50/80 to-violet-50/80 dark:from-violet-900/20 dark:to-violet-900/20', frontBorder: 'border-violet-200 dark:border-violet-700/50', frontText: 'text-stone-800 dark:text-stone-100', frontAccent: 'text-violet-600 dark:text-violet-400', backBg: 'from-violet-50/80 to-violet-50/80 dark:from-violet-900/20 dark:to-violet-900/20', backBorder: 'border-violet-200 dark:border-violet-700/50', backText: 'text-stone-800 dark:text-stone-100', backAccent: 'text-violet-600 dark:text-violet-400' },
  { id: 'amber', name: 'Amber', frontBg: 'from-amber-50/80 to-orange-50/80 dark:from-amber-900/20 dark:to-orange-900/20', frontBorder: 'border-amber-200 dark:border-amber-700/50', frontText: 'text-stone-800 dark:text-stone-100', frontAccent: 'text-amber-600 dark:text-amber-400', backBg: 'from-amber-50/80 to-orange-50/80 dark:from-amber-900/20 dark:to-orange-900/20', backBorder: 'border-amber-200 dark:border-amber-700/50', backText: 'text-stone-800 dark:text-stone-100', backAccent: 'text-amber-600 dark:text-amber-400' },
  { id: 'rose', name: 'Fuchsia', frontBg: 'from-fuchsia-50/80 to-violet-50/80 dark:from-fuchsia-900/25 dark:to-violet-900/20', frontBorder: 'border-fuchsia-200 dark:border-fuchsia-700/50', frontText: 'text-stone-800 dark:text-stone-100', frontAccent: 'text-fuchsia-600 dark:text-fuchsia-400', backBg: 'from-fuchsia-50/80 to-violet-50/80 dark:from-fuchsia-900/25 dark:to-violet-900/20', backBorder: 'border-fuchsia-200 dark:border-fuchsia-700/50', backText: 'text-stone-800 dark:text-stone-100', backAccent: 'text-fuchsia-600 dark:text-fuchsia-400' },
];

const THEME_DOTS: Record<ThemeId, string> = {
  violet: 'bg-violet-600',
  emerald: 'bg-emerald-600',
  blue: 'bg-violet-600',
  amber: 'bg-amber-600',
  rose: 'bg-fuchsia-600',
};

const THEME_RINGS: Record<ThemeId, string> = {
  violet: 'ring-violet-500',
  emerald: 'ring-emerald-500',
  blue: 'ring-violet-500',
  amber: 'ring-amber-400',
  rose: 'ring-fuchsia-500',
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
      return `bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-600`;
    }
    if (cardStyle === 'bordered') {
      return `bg-gradient-to-br ${bg} ${border} border-2 shadow-sm`;
    }
    return `bg-gradient-to-br ${bg} ${border} border shadow-xl shadow-stone-200/60 dark:shadow-stone-900/60`;
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

  if (cards.length === 0) {
    return (
      <div className="relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-violet-50 to-fuchsia-50 dark:from-violet-950/30 dark:via-violet-950/30 dark:to-fuchsia-950/30 rounded-2xl sm:rounded-3xl" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-violet-200/40 to-violet-300/40 dark:from-violet-800/20 dark:to-violet-700/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-fuchsia-200/40 to-fuchsia-300/40 dark:from-fuchsia-800/20 dark:to-fuchsia-700/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
        
        {/* Floating card decorations */}
        <div className="absolute top-12 right-8 sm:right-16 w-16 h-20 bg-white/60 dark:bg-stone-700/60 rounded-xl shadow-lg rotate-12 border border-violet-200/50 dark:border-violet-700/50 hidden sm:block" />
        <div className="absolute top-20 right-4 sm:right-8 w-14 h-18 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 rounded-xl shadow-lg -rotate-6 border border-amber-200/50 dark:border-amber-700/50 hidden sm:block" />
        <div className="absolute bottom-16 left-8 sm:left-12 w-12 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 rounded-lg shadow-md rotate-6 border border-emerald-200/50 dark:border-emerald-700/50 hidden sm:block" />
        
        <div className="relative bg-white/80 dark:bg-stone-800/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-6 sm:p-10 border border-violet-200/60 dark:border-violet-700/40 shadow-xl">
          {/* Header with Go Back */}
          {onNewDeck && (
            <button
              onClick={onNewDeck}
              className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-2 px-3 py-2 text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-medium rounded-xl hover:bg-violet-100/80 dark:hover:bg-violet-900/30 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Go Back
            </button>
          )}
          
          <div className="text-center pt-8 sm:pt-4">
            {/* Icon */}
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6">
              <div className="absolute inset-0 bg-violet-600 hover:bg-violet-500 rounded-2xl rotate-6 opacity-20" />
              <div className="absolute inset-0 bg-violet-600 hover:bg-violet-500 rounded-2xl -rotate-3 opacity-30" />
              <div className="relative w-full h-full bg-violet-600 hover:bg-violet-500 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30">
                <span className="text-4xl sm:text-5xl">✏️</span>
              </div>
            </div>
            
            {/* Title & Description */}
            <h3 className="text-2xl sm:text-3xl font-bold text-violet-600 dark:text-violet-400 mb-3">
              Create Your Deck
            </h3>
            <p className="text-stone-500 dark:text-stone-400 text-sm sm:text-base max-w-md mx-auto mb-4">
              Build custom flashcards from scratch or load one of your previously saved decks to continue studying
            </p>
            {/* Deck name - show when creating from scratch */}
            {isCreateFromScratch && (
              <div className="mb-6 max-w-xs mx-auto">
                <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1.5">Deck name</label>
                <input
                  type="text"
                  value={deckTitle}
                  onChange={e => setDeckTitle(e.target.value)}
                  placeholder="e.g. Biology Chapter 5"
                  className="w-full px-4 py-2.5 rounded-xl border border-violet-200 dark:border-violet-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 placeholder-stone-400 focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 focus:outline-none text-sm"
                />
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-8">
              <button
                onClick={() => setShowAddCard(true)}
                className="w-full sm:w-auto px-6 py-3.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-violet-500/30 hover:shadow-violet-500/40 hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Create First Card
              </button>
              
              {onLoadPrevious && (
                <button
                  onClick={onLoadPrevious}
                  className="w-full sm:w-auto px-6 py-3.5 bg-white dark:bg-stone-700 border-2 border-violet-200 dark:border-violet-700 text-violet-700 dark:text-violet-300 font-semibold rounded-xl transition-all hover:border-violet-300 dark:hover:border-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  Load Previous Deck
                </button>
              )}
            </div>
            
            {/* Tips section */}
            <div className="bg-gradient-to-r from-violet-50 to-violet-50 dark:from-violet-900/20 dark:to-violet-900/20 rounded-xl p-4 sm:p-5 border border-violet-100 dark:border-violet-800/50">
              <h4 className="text-sm font-semibold text-violet-800 dark:text-violet-300 mb-3 flex items-center justify-center gap-2">
                <span>💡</span> Quick Tips
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-violet-500 font-bold mt-0.5">1</span>
                  <span className="text-stone-600 dark:text-stone-400 text-left">Keep questions concise and focused on one concept</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-violet-500 font-bold mt-0.5">2</span>
                  <span className="text-stone-600 dark:text-stone-400 text-left">Include examples in answers when helpful</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-violet-500 font-bold mt-0.5">3</span>
                  <span className="text-stone-600 dark:text-stone-400 text-left">Review and shuffle for better retention</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Add Card Modal - Enhanced */}
        {showAddCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddCard(false)}>
            <div className="bg-white dark:bg-stone-800 rounded-2xl sm:rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="bg-violet-600 hover:bg-violet-500 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      <span className="text-xl">🃏</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">New Flashcard</h3>
                      <p className="text-violet-200 text-xs">Card #{cards.length + 1}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowAddCard(false)} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
              
              {/* Modal Body */}
              <div className="p-6 space-y-5">
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">
                    <span className="w-6 h-6 bg-amber-100 dark:bg-amber-900/40 rounded-lg flex items-center justify-center text-amber-600 dark:text-amber-400 text-xs font-bold">Q</span>
                    Front Side (Question/Term)
                  </label>
                  <textarea
                    value={newFront}
                    onChange={e => setNewFront(e.target.value)}
                    placeholder="What do you want to remember?"
                    className="w-full p-4 border-2 border-stone-200 dark:border-stone-600 rounded-xl bg-stone-50 dark:bg-stone-900 text-stone-800 dark:text-stone-100 resize-none focus:outline-none focus:border-violet-500 dark:focus:border-violet-500 focus:ring-2 focus:ring-violet-500/40 focus:bg-white dark:focus:bg-stone-800 transition-all"
                    rows={3}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">
                    <span className="w-6 h-6 bg-violet-100 dark:bg-violet-900/40 rounded-lg flex items-center justify-center text-violet-600 dark:text-violet-400 text-xs font-bold">A</span>
                    Back Side (Answer/Definition)
                  </label>
                  <textarea
                    value={newBack}
                    onChange={e => setNewBack(e.target.value)}
                    placeholder="The answer or explanation..."
                    className="w-full p-4 border-2 border-stone-200 dark:border-stone-600 rounded-xl bg-stone-50 dark:bg-stone-900 text-stone-800 dark:text-stone-100 resize-none focus:outline-none focus:border-violet-500 dark:focus:border-violet-500 focus:ring-2 focus:ring-violet-500/40 focus:bg-white dark:focus:bg-stone-800 transition-all"
                    rows={3}
                  />
                </div>
              </div>
              
              {/* Modal Footer */}
              <div className="flex gap-3 px-6 pb-6">
                <button onClick={() => setShowAddCard(false)} className="flex-1 px-4 py-3 bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 font-semibold rounded-xl hover:bg-stone-200 dark:hover:bg-stone-600 transition-colors">
                  Cancel
                </button>
                <button 
                  onClick={handleAddCard} 
                  disabled={!newFront.trim() || !newBack.trim()} 
                  className="flex-1 px-4 py-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md disabled:shadow-none flex items-center justify-center gap-2"
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
    <div className="space-y-4 min-w-0 w-full overflow-x-hidden max-w-4xl mx-auto">
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
              className="text-lg font-bold text-stone-800 dark:text-stone-100 bg-stone-100 dark:bg-stone-700 rounded-lg px-2 py-1 border border-violet-200 dark:border-violet-700 focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 focus:outline-none min-w-[120px] max-w-[240px]"
              placeholder="Set name"
            />
          ) : (
            <h3
              onClick={() => setIsEditingTitle(true)}
              className="text-lg font-bold text-stone-800 dark:text-stone-100 cursor-pointer hover:text-violet-600 dark:hover:text-violet-400 transition-colors truncate max-w-[200px] sm:max-w-[280px]"
              title="Click to rename"
            >
              {deckTitle || 'Flashcards'}
            </h3>
          )}
          <button
            onClick={() => setIsEditingTitle(true)}
            className="p-1 text-stone-400 hover:text-violet-600 dark:hover:text-violet-400 rounded transition-colors shrink-0"
            title="Rename set"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
          </button>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {canExport && onExportPDF && (
            <button onClick={onExportPDF} className="px-3 py-1.5 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-medium rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors flex items-center gap-1.5 text-xs">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
              PDF
            </button>
          )}
          {canExport && onExportDOCX && (
            <button onClick={onExportDOCX} className="px-3 py-1.5 bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 font-medium rounded-lg hover:bg-violet-100 dark:hover:bg-violet-900/50 transition-colors flex items-center gap-1.5 text-xs">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
              DOCX
            </button>
          )}
          {onExportJSON && (
            <button onClick={onExportJSON} className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors flex items-center gap-1.5 text-xs">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm3 10a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm-2-4a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1z" clipRule="evenodd"/></svg>
              JSON
            </button>
          )}
          <button onClick={() => setShowCardList(!showCardList)} className={`px-3 py-1.5 font-medium rounded-lg transition-colors flex items-center gap-1.5 text-xs ${showCardList ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-400' : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-600'}`}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
            Cards
          </button>
          <button onClick={() => setShowSettings(!showSettings)} className={`px-3 py-1.5 font-medium rounded-lg transition-colors flex items-center gap-1.5 text-xs ${showSettings ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-400' : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-600'}`}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Style
          </button>
          {onNewDeck && (
            <button onClick={onNewDeck} className="px-3 py-1.5 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/50 font-medium transition-colors text-xs">
              New Deck
            </button>
          )}
          {onEnlarge && (
            <button onClick={onEnlarge} className="px-3 py-1.5 text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30 rounded-lg hover:bg-violet-100 dark:hover:bg-violet-900/50 font-medium transition-colors text-xs flex items-center gap-1.5" title="Open in full page">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
              Enlarge
            </button>
          )}
          {onSaveToStudyTools && cards.length > 0 && (
            <div className="flex items-center gap-2">
              {saveError && (
                <span className="text-xs text-red-600 dark:text-red-400 max-w-[120px] truncate" title={saveError}>{saveError}</span>
              )}
              <button
                onClick={handleSaveToStudyTools}
                disabled={isSaving}
                className={`px-3 py-1.5 font-medium rounded-lg transition-colors text-xs flex items-center gap-1.5 ${saveSuccess ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'}`}
                title="Save to Saved Materials"
              >
                {isSaving ? (
                  <span className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
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
        <div className="bg-stone-50 dark:bg-stone-800/50 rounded-2xl p-4 border border-stone-200 dark:border-stone-700 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-stone-800 dark:text-stone-100 text-sm">Customize Cards</h4>
            <button onClick={() => setShowSettings(false)} className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Theme Selection - matches Create Flashcards page */}
          <div>
            <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-3">Theme color</label>
            <div className="flex flex-wrap gap-2.5">
              {(Object.keys(THEME_DOTS) as ThemeId[]).map(key => (
                <button
                  key={key}
                  onClick={() => setTheme(key)}
                  title={key}
                  className={`relative w-9 h-9 rounded-xl ${THEME_DOTS[key]} transition-all hover:scale-110 ${theme === key ? `ring-2 ring-offset-2 dark:ring-offset-stone-800 ${THEME_RINGS[key]}` : ''}`}
                >
                  {theme === key && (
                    <svg className="absolute inset-0 m-auto w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Font Size & Card Style - matches Create Flashcards page */}
          <div className="flex flex-wrap gap-6">
            <div>
              <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-3">Font size</label>
              <div className="flex gap-2">
                {FONT_SIZES.map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFontSize(f.id)}
                    className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${fontSize === f.id ? 'bg-violet-50 dark:bg-violet-900/30 border-violet-400 text-violet-700 dark:text-violet-300 border-2 font-semibold' : 'bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-600 text-stone-600 dark:text-stone-400 hover:border-stone-300'}`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-3">Card style</label>
              <div className="flex gap-2">
                {CARD_STYLES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setCardStyle(s.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium transition-all capitalize ${cardStyle === s.id ? 'bg-violet-50 dark:bg-violet-900/30 border-violet-400 text-violet-700 dark:text-violet-300 border-2 font-semibold' : 'bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-600 text-stone-600 dark:text-stone-400 hover:border-stone-300'}`}
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
              <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-2">Study Direction</label>
              <select
                value={studyDirection}
                onChange={e => setStudyDirection(e.target.value as StudyDirection)}
                className="px-3 py-2 bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-lg text-xs font-medium text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500"
              >
                <option value="front-to-back">Front → Back</option>
                <option value="back-to-front">Back → Front</option>
                <option value="both">Random</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={shuffleCards}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-lg transition-all shadow-md flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                Shuffle
              </button>
            </div>
          </div>

          {/* Keyboard shortcuts hint */}
          <div className="pt-2 border-t border-stone-200 dark:border-stone-700">
            <p className="text-[10px] text-stone-400 dark:text-stone-500">
              <span className="font-medium">Shortcuts:</span> Space = flip, ←/→ = prev/next, 1 = mark known, 2 = unmark
            </p>
          </div>
        </div>
      )}

      {/* Card List Panel */}
      {showCardList && (
        <div className="bg-gradient-to-br from-violet-50/50 to-violet-50/50 dark:from-violet-900/10 dark:to-violet-900/10 rounded-2xl p-4 border border-violet-200/60 dark:border-violet-700/40 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-stone-800 dark:text-stone-100 text-sm flex items-center gap-2">
              <span className="w-6 h-6 bg-violet-100 dark:bg-violet-900/40 rounded-lg flex items-center justify-center text-violet-600 dark:text-violet-400 text-xs">📚</span>
              All Cards ({cards.length})
            </h4>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddCard(true)}
                className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-lg transition-all shadow-md shadow-violet-500/20 flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Add Card
              </button>
              <button onClick={() => setShowCardList(false)} className="p-1.5 text-stone-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/30 rounded-lg transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {cards.map((c, idx) => (
              <div
                key={c.id}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${idx === currentCard ? 'bg-violet-50 dark:bg-violet-900/30 border-violet-200 dark:border-violet-700' : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600'}`}
                onClick={() => { setCurrentCard(idx); setIsFlipped(false); }}
              >
                {editingCard === c.id ? (
                  <div className="space-y-2" onClick={e => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editFront}
                      onChange={e => setEditFront(e.target.value)}
                      className="w-full p-2 text-sm border border-stone-200 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100"
                      placeholder="Front"
                    />
                    <input
                      type="text"
                      value={editBack}
                      onChange={e => setEditBack(e.target.value)}
                      className="w-full p-2 text-sm border border-stone-200 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100"
                      placeholder="Back"
                    />
                    <div className="flex gap-2">
                      <button onClick={handleSaveEdit} className="px-3 py-1.5 bg-green-500 text-white text-xs font-medium rounded-lg hover:bg-green-400 transition-colors">Save</button>
                      <button onClick={() => setEditingCard(null)} className="px-3 py-1.5 bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-400 text-xs font-medium rounded-lg hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500">#{idx + 1}</span>
                        {knownCards.has(idx) && <span className="text-[10px] font-bold text-green-500">✓ Known</span>}
                      </div>
                      <p className="text-sm font-medium text-stone-800 dark:text-stone-100 truncate">{c.front}</p>
                      <p className="text-xs text-stone-500 dark:text-stone-400 truncate">{c.back}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={e => { e.stopPropagation(); handleEditCard(c); }}
                        className="p-1.5 text-stone-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/30 rounded-lg transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); handleDeleteCard(c.id); }}
                        className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
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
        <div className="flex-1 h-1.5 sm:h-2 bg-stone-100 dark:bg-stone-700 rounded-full overflow-hidden">
          <div className="h-full bg-amber-600 transition-all duration-300" style={{ width: `${((currentCard + 1) / cards.length) * 100}%` }}></div>
        </div>
        <span className="text-[10px] sm:text-xs text-stone-500 dark:text-stone-400 font-medium flex-shrink-0">{currentCard + 1}/{cards.length}</span>
        {knownCards.size > 0 && <span className="text-[10px] sm:text-xs text-green-600 dark:text-green-400 font-medium flex-shrink-0">{knownCards.size} ✓</span>}
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
            className={`w-full min-h-[200px] sm:min-h-[320px] ${getCardClasses('front')} rounded-2xl sm:rounded-3xl p-5 sm:p-8 flex flex-col items-center justify-center text-center shadow-lg`}
            style={{ backfaceVisibility: 'hidden' }}
          >
            <span className={`text-[10px] sm:text-xs font-bold ${currentTheme.frontAccent} uppercase tracking-wide mb-3 sm:mb-4 truncate block min-w-0`}>
              {studyDirection === 'back-to-front' ? 'Back' : 'Front'}
            </span>
            <p className={`${currentFontSize.front} font-semibold ${currentTheme.frontText} leading-relaxed break-words max-w-full`}>
              {getDisplayContent(card, 'front')}
            </p>
            <p className={`text-[10px] sm:text-xs ${currentTheme.frontAccent} mt-4 sm:mt-6`}>Tap to flip</p>
          </div>
          {/* Back */}
          <div
            className={`absolute inset-0 w-full min-h-[200px] sm:min-h-[320px] ${getCardClasses('back')} rounded-2xl sm:rounded-3xl p-5 sm:p-8 flex flex-col items-center justify-center text-center shadow-lg`}
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <span className={`text-[10px] sm:text-xs font-bold ${currentTheme.backAccent} uppercase tracking-wide mb-3 sm:mb-4 truncate block min-w-0`}>
              {studyDirection === 'back-to-front' ? 'Front' : 'Back'}
            </span>
            <p className={`${currentFontSize.back} ${currentTheme.backText} leading-relaxed break-words max-w-full`}>
              {getDisplayContent(card, 'back')}
            </p>
            <p className={`text-[10px] sm:text-xs ${currentTheme.backAccent} mt-4 sm:mt-6`}>Tap to flip back</p>
          </div>
        </div>
      </div>

      {/* Navigation + Know/Don't Know */}
      <div className="flex items-center justify-center gap-2 sm:gap-3">
        <button
          onClick={() => { setCurrentCard(Math.max(0, currentCard - 1)); setIsFlipped(false); }}
          disabled={currentCard === 0}
          className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-600 disabled:opacity-30 transition-all"
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
          className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            knownCards.has(currentCard)
              ? 'bg-green-500 text-white shadow-md'
              : 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-900/50'
          }`}
        >
          {knownCards.has(currentCard) ? '✓ Mastered' : 'Mark Known'}
        </button>
        <button
          onClick={() => { setCurrentCard(Math.min(cards.length - 1, currentCard + 1)); setIsFlipped(false); }}
          disabled={currentCard >= cards.length - 1}
          className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium bg-amber-600 text-white hover:bg-amber-500 disabled:opacity-30 transition-all"
        >
          <span className="hidden sm:inline">Next </span>→
        </button>
      </div>

      {/* Summary when all reviewed */}
      {knownCards.size === cards.length && (
        <div className="p-4 sm:p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 rounded-xl sm:rounded-2xl text-center">
          <video
            src="/happymascot.mp4"
            autoPlay
            muted
            playsInline
            loop
            className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-1 sm:mb-2 object-contain rounded-xl border-2 border-violet-300 dark:border-violet-500 shadow-lg overflow-hidden ring-2 ring-violet-400/30"
          />
          <h3 className="text-lg sm:text-xl font-bold text-green-800 dark:text-green-300">All cards mastered!</h3>
          <p className="text-green-600 dark:text-green-400 text-xs sm:text-sm mt-1">You've marked all {cards.length} cards as known. Great job!</p>
        </div>
      )}

      {/* Add Card Modal - Enhanced */}
      {showAddCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddCard(false)}>
          <div className="bg-white dark:bg-stone-800 rounded-2xl sm:rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="bg-violet-600 hover:bg-violet-500 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <span className="text-xl">🃏</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">New Flashcard</h3>
                    <p className="text-violet-200 text-xs">Card #{cards.length + 1}</p>
                  </div>
                </div>
                <button onClick={() => setShowAddCard(false)} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 space-y-5">
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">
                  <span className="w-6 h-6 bg-amber-100 dark:bg-amber-900/40 rounded-lg flex items-center justify-center text-amber-600 dark:text-amber-400 text-xs font-bold">Q</span>
                  Front Side (Question/Term)
                </label>
                <textarea
                  value={newFront}
                  onChange={e => setNewFront(e.target.value)}
                  placeholder="What do you want to remember?"
                  className="w-full p-4 border-2 border-stone-200 dark:border-stone-600 rounded-xl bg-stone-50 dark:bg-stone-900 text-stone-800 dark:text-stone-100 resize-none focus:outline-none focus:border-violet-500 dark:focus:border-violet-500 focus:ring-2 focus:ring-violet-500/40 focus:bg-white dark:focus:bg-stone-800 transition-all"
                  rows={3}
                  autoFocus
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">
                  <span className="w-6 h-6 bg-violet-100 dark:bg-violet-900/40 rounded-lg flex items-center justify-center text-violet-600 dark:text-violet-400 text-xs font-bold">A</span>
                  Back Side (Answer/Definition)
                </label>
                <textarea
                  value={newBack}
                  onChange={e => setNewBack(e.target.value)}
                  placeholder="The answer or explanation..."
                  className="w-full p-4 border-2 border-stone-200 dark:border-stone-600 rounded-xl bg-stone-50 dark:bg-stone-900 text-stone-800 dark:text-stone-100 resize-none focus:outline-none focus:border-violet-500 dark:focus:border-violet-500 focus:ring-2 focus:ring-violet-500/40 focus:bg-white dark:focus:bg-stone-800 transition-all"
                  rows={3}
                />
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setShowAddCard(false)} className="flex-1 px-4 py-3 bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 font-semibold rounded-xl hover:bg-stone-200 dark:hover:bg-stone-600 transition-colors">
                Cancel
              </button>
              <button 
                onClick={handleAddCard} 
                disabled={!newFront.trim() || !newBack.trim()} 
                className="flex-1 px-4 py-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md disabled:shadow-none flex items-center justify-center gap-2"
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
