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
  onNewDeck?: () => void;
  canExport?: boolean;
  onCardsChange?: (cards: FlashCard[]) => void;
}

type ThemeId = 'classic' | 'ocean' | 'forest' | 'sunset' | 'violet' | 'monochrome';
type FontSize = 'small' | 'medium' | 'large';
type CardStyle = 'minimal' | 'bordered' | 'gradient';
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
  {
    id: 'classic',
    name: 'Classic',
    frontBg: 'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20',
    frontBorder: 'border-amber-200 dark:border-amber-700',
    frontText: 'text-stone-800 dark:text-stone-100',
    frontAccent: 'text-amber-500 dark:text-amber-400',
    backBg: 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
    backBorder: 'border-blue-200 dark:border-blue-700',
    backText: 'text-stone-800 dark:text-stone-100',
    backAccent: 'text-blue-500 dark:text-blue-400',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    frontBg: 'from-cyan-50 to-sky-50 dark:from-cyan-900/20 dark:to-sky-900/20',
    frontBorder: 'border-cyan-200 dark:border-cyan-700',
    frontText: 'text-stone-800 dark:text-stone-100',
    frontAccent: 'text-cyan-600 dark:text-cyan-400',
    backBg: 'from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20',
    backBorder: 'border-teal-200 dark:border-teal-700',
    backText: 'text-stone-800 dark:text-stone-100',
    backAccent: 'text-teal-600 dark:text-teal-400',
  },
  {
    id: 'forest',
    name: 'Forest',
    frontBg: 'from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20',
    frontBorder: 'border-emerald-200 dark:border-emerald-700',
    frontText: 'text-stone-800 dark:text-stone-100',
    frontAccent: 'text-emerald-600 dark:text-emerald-400',
    backBg: 'from-lime-50 to-green-50 dark:from-lime-900/20 dark:to-green-900/20',
    backBorder: 'border-lime-200 dark:border-lime-700',
    backText: 'text-stone-800 dark:text-stone-100',
    backAccent: 'text-lime-600 dark:text-lime-400',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    frontBg: 'from-orange-50 to-rose-50 dark:from-orange-900/20 dark:to-rose-900/20',
    frontBorder: 'border-orange-200 dark:border-orange-700',
    frontText: 'text-stone-800 dark:text-stone-100',
    frontAccent: 'text-orange-600 dark:text-orange-400',
    backBg: 'from-pink-50 to-red-50 dark:from-pink-900/20 dark:to-red-900/20',
    backBorder: 'border-pink-200 dark:border-pink-700',
    backText: 'text-stone-800 dark:text-stone-100',
    backAccent: 'text-pink-600 dark:text-pink-400',
  },
  {
    id: 'violet',
    name: 'Violet',
    frontBg: 'from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20',
    frontBorder: 'border-violet-200 dark:border-violet-700',
    frontText: 'text-stone-800 dark:text-stone-100',
    frontAccent: 'text-violet-600 dark:text-violet-400',
    backBg: 'from-fuchsia-50 to-pink-50 dark:from-fuchsia-900/20 dark:to-pink-900/20',
    backBorder: 'border-fuchsia-200 dark:border-fuchsia-700',
    backText: 'text-stone-800 dark:text-stone-100',
    backAccent: 'text-fuchsia-600 dark:text-fuchsia-400',
  },
  {
    id: 'monochrome',
    name: 'Mono',
    frontBg: 'from-stone-100 to-stone-50 dark:from-stone-800 dark:to-stone-900',
    frontBorder: 'border-stone-300 dark:border-stone-600',
    frontText: 'text-stone-800 dark:text-stone-100',
    frontAccent: 'text-stone-500 dark:text-stone-400',
    backBg: 'from-stone-50 to-white dark:from-stone-900 dark:to-stone-950',
    backBorder: 'border-stone-200 dark:border-stone-700',
    backText: 'text-stone-800 dark:text-stone-100',
    backAccent: 'text-stone-500 dark:text-stone-400',
  },
];

const FONT_SIZES: { id: FontSize; name: string; front: string; back: string }[] = [
  { id: 'small', name: 'S', front: 'text-base sm:text-lg', back: 'text-sm sm:text-base' },
  { id: 'medium', name: 'M', front: 'text-lg sm:text-2xl', back: 'text-base sm:text-xl' },
  { id: 'large', name: 'L', front: 'text-xl sm:text-3xl', back: 'text-lg sm:text-2xl' },
];

const CARD_STYLES: { id: CardStyle; name: string }[] = [
  { id: 'minimal', name: 'Minimal' },
  { id: 'bordered', name: 'Bordered' },
  { id: 'gradient', name: 'Gradient' },
];

const FlashcardViewer = ({
  initialCards = [],
  title = 'Flashcards',
  onExportPDF,
  onExportDOCX,
  onNewDeck,
  canExport = false,
  onCardsChange,
}: FlashcardViewerProps) => {
  const [cards, setCards] = useState<FlashCard[]>(() =>
    initialCards.map((c, i) => ({ id: `card-${i}-${Date.now()}`, front: c.front, back: c.back }))
  );
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCards, setKnownCards] = useState<Set<number>>(new Set());

  const [theme, setTheme] = useState<ThemeId>('classic');
  const [fontSize, setFontSize] = useState<FontSize>('medium');
  const [cardStyle, setCardStyle] = useState<CardStyle>('gradient');
  const [studyDirection, setStudyDirection] = useState<StudyDirection>('front-to-back');
  const [useCustomColors, setUseCustomColors] = useState(false);
  const [customFrontColor, setCustomFrontColor] = useState('#fef3c7');
  const [customBackColor, setCustomBackColor] = useState('#dbeafe');

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
    onCardsChange?.(cards);
  }, [cards, onCardsChange]);

  const currentTheme = THEMES.find(t => t.id === theme) || THEMES[0];
  const currentFontSize = FONT_SIZES.find(f => f.id === fontSize) || FONT_SIZES[1];

  const getCardClasses = (side: 'front' | 'back') => {
    const t = currentTheme;
    const bg = side === 'front' ? t.frontBg : t.backBg;
    const border = side === 'front' ? t.frontBorder : t.backBorder;

    if (cardStyle === 'minimal') {
      return `bg-white dark:bg-stone-800 ${border} border`;
    }
    if (cardStyle === 'bordered') {
      return `bg-white dark:bg-stone-800 ${border} border-2`;
    }
    return `bg-gradient-to-br ${bg} ${border} border-2`;
  };

  const getCustomBgStyle = (side: 'front' | 'back') => {
    if (!useCustomColors) return {};
    const color = side === 'front' ? customFrontColor : customBackColor;
    return { background: color };
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
      <div className="relative bg-white dark:bg-stone-800 rounded-2xl sm:rounded-3xl p-6 sm:p-10 text-center border border-stone-200 dark:border-stone-700 shadow-lg">
        {onNewDeck && (
          <button
            onClick={onNewDeck}
            className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-2 px-3 py-2 text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 font-medium rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700/50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Go Back
          </button>
        )}
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-2xl flex items-center justify-center">
          <span className="text-3xl">🃏</span>
        </div>
        <h3 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-2">No Cards Yet</h3>
        <p className="text-stone-500 dark:text-stone-400 mb-6">Create your first flashcard to get started</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => setShowAddCard(true)}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold rounded-xl transition-all shadow-lg shadow-amber-500/25"
          >
            + Create First Card
          </button>
        </div>

        {showAddCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddCard(false)}>
            <div className="bg-white dark:bg-stone-800 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100 mb-4">Add New Card</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-1">Front (Question/Term)</label>
                  <textarea
                    value={newFront}
                    onChange={e => setNewFront(e.target.value)}
                    placeholder="Enter the question or term..."
                    className="w-full p-3 border border-stone-200 dark:border-stone-600 rounded-xl bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-1">Back (Answer/Definition)</label>
                  <textarea
                    value={newBack}
                    onChange={e => setNewBack(e.target.value)}
                    placeholder="Enter the answer or definition..."
                    className="w-full p-3 border border-stone-200 dark:border-stone-600 rounded-xl bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowAddCard(false)} className="flex-1 px-4 py-2.5 bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 font-medium rounded-xl hover:bg-stone-200 dark:hover:bg-stone-600 transition-colors">
                  Cancel
                </button>
                <button onClick={handleAddCard} disabled={!newFront.trim() || !newBack.trim()} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl disabled:opacity-50 transition-all">
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
    <div className="space-y-4">
      {/* Header with title and controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100">{title}</h3>
        <div className="flex items-center gap-2 flex-wrap">
          {canExport && onExportPDF && (
            <button onClick={onExportPDF} className="px-3 py-1.5 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-medium rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors flex items-center gap-1.5 text-xs">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
              PDF
            </button>
          )}
          {canExport && onExportDOCX && (
            <button onClick={onExportDOCX} className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-1.5 text-xs">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
              DOCX
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

          {/* Theme Selection */}
          <div>
            <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-2">Color Theme</label>
            <div className="flex flex-wrap gap-2">
              {THEMES.map(t => (
                <button
                  key={t.id}
                  onClick={() => { setTheme(t.id); setUseCustomColors(false); }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${theme === t.id && !useCustomColors ? 'ring-2 ring-violet-500 ring-offset-1 dark:ring-offset-stone-800' : ''}`}
                  style={{
                    background: t.id === 'classic' ? 'linear-gradient(135deg, #fef3c7, #dbeafe)' :
                      t.id === 'ocean' ? 'linear-gradient(135deg, #cffafe, #ccfbf1)' :
                      t.id === 'forest' ? 'linear-gradient(135deg, #d1fae5, #ecfccb)' :
                      t.id === 'sunset' ? 'linear-gradient(135deg, #fed7aa, #fecdd3)' :
                      t.id === 'violet' ? 'linear-gradient(135deg, #ede9fe, #fce7f3)' :
                      'linear-gradient(135deg, #e7e5e4, #fafaf9)'
                  }}
                >
                  <span className="text-stone-700">{t.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Colors */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                id="custom-colors"
                checked={useCustomColors}
                onChange={e => setUseCustomColors(e.target.checked)}
                className="w-4 h-4 rounded border-stone-300 text-violet-600 focus:ring-violet-500"
              />
              <label htmlFor="custom-colors" className="text-xs font-medium text-stone-500 dark:text-stone-400">Use custom colors</label>
            </div>
            {useCustomColors && (
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-stone-500 dark:text-stone-400">Front:</label>
                  <input type="color" value={customFrontColor} onChange={e => setCustomFrontColor(e.target.value)} className="w-8 h-8 rounded-lg cursor-pointer border border-stone-200 dark:border-stone-600" />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-stone-500 dark:text-stone-400">Back:</label>
                  <input type="color" value={customBackColor} onChange={e => setCustomBackColor(e.target.value)} className="w-8 h-8 rounded-lg cursor-pointer border border-stone-200 dark:border-stone-600" />
                </div>
              </div>
            )}
          </div>

          {/* Font Size & Card Style */}
          <div className="flex flex-wrap gap-6">
            <div>
              <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-2">Font Size</label>
              <div className="flex gap-1">
                {FONT_SIZES.map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFontSize(f.id)}
                    className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${fontSize === f.id ? 'bg-violet-500 text-white shadow-md' : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-600'}`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-2">Card Style</label>
              <div className="flex gap-1">
                {CARD_STYLES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setCardStyle(s.id)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${cardStyle === s.id ? 'bg-violet-500 text-white shadow-md' : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-600'}`}
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
                className="px-3 py-2 bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-lg text-xs font-medium text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              >
                <option value="front-to-back">Front → Back</option>
                <option value="back-to-front">Back → Front</option>
                <option value="both">Random</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={shuffleCards}
                className="px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-400 hover:to-purple-400 text-white text-xs font-semibold rounded-lg transition-all shadow-md flex items-center gap-1.5"
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
        <div className="bg-stone-50 dark:bg-stone-800/50 rounded-2xl p-4 border border-stone-200 dark:border-stone-700 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-stone-800 dark:text-stone-100 text-sm">All Cards ({cards.length})</h4>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddCard(true)}
                className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-xs font-semibold rounded-lg transition-all shadow-md flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Add Card
              </button>
              <button onClick={() => setShowCardList(false)} className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors">
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
          <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300" style={{ width: `${((currentCard + 1) / cards.length) * 100}%` }}></div>
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
            style={{ backfaceVisibility: 'hidden', ...getCustomBgStyle('front') }}
          >
            <span className={`text-[10px] sm:text-xs font-bold ${currentTheme.frontAccent} uppercase tracking-widest mb-3 sm:mb-4`}>
              {studyDirection === 'back-to-front' ? 'Back' : 'Front'}
            </span>
            <p className={`${currentFontSize.front} font-semibold ${currentTheme.frontText} leading-relaxed`}>
              {getDisplayContent(card, 'front')}
            </p>
            <p className={`text-[10px] sm:text-xs ${currentTheme.frontAccent} mt-4 sm:mt-6`}>Tap to flip</p>
          </div>
          {/* Back */}
          <div
            className={`absolute inset-0 w-full min-h-[200px] sm:min-h-[320px] ${getCardClasses('back')} rounded-2xl sm:rounded-3xl p-5 sm:p-8 flex flex-col items-center justify-center text-center shadow-lg`}
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', ...getCustomBgStyle('back') }}
          >
            <span className={`text-[10px] sm:text-xs font-bold ${currentTheme.backAccent} uppercase tracking-widest mb-3 sm:mb-4`}>
              {studyDirection === 'back-to-front' ? 'Front' : 'Back'}
            </span>
            <p className={`${currentFontSize.back} ${currentTheme.backText} leading-relaxed`}>
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
          className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400 disabled:opacity-30 transition-all"
        >
          <span className="hidden sm:inline">Next </span>→
        </button>
      </div>

      {/* Summary when all reviewed */}
      {knownCards.size === cards.length && (
        <div className="p-4 sm:p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 rounded-xl sm:rounded-2xl text-center">
          <span className="text-3xl sm:text-4xl mb-1 sm:mb-2 block">🎉</span>
          <h3 className="text-lg sm:text-xl font-bold text-green-800 dark:text-green-300">All cards mastered!</h3>
          <p className="text-green-600 dark:text-green-400 text-xs sm:text-sm mt-1">You've marked all {cards.length} cards as known. Great job!</p>
        </div>
      )}

      {/* Add Card Modal */}
      {showAddCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddCard(false)}>
          <div className="bg-white dark:bg-stone-800 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100 mb-4">Add New Card</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-1">Front (Question/Term)</label>
                <textarea
                  value={newFront}
                  onChange={e => setNewFront(e.target.value)}
                  placeholder="Enter the question or term..."
                  className="w-full p-3 border border-stone-200 dark:border-stone-600 rounded-xl bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  rows={3}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-1">Back (Answer/Definition)</label>
                <textarea
                  value={newBack}
                  onChange={e => setNewBack(e.target.value)}
                  placeholder="Enter the answer or definition..."
                  className="w-full p-3 border border-stone-200 dark:border-stone-600 rounded-xl bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddCard(false)} className="flex-1 px-4 py-2.5 bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 font-medium rounded-xl hover:bg-stone-200 dark:hover:bg-stone-600 transition-colors">
                Cancel
              </button>
              <button onClick={handleAddCard} disabled={!newFront.trim() || !newBack.trim()} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl disabled:opacity-50 transition-all">
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
