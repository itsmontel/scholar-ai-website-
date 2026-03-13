import { useState, useEffect, useRef } from 'react';
import Header from '../../common/Header';
import Footer from '../../common/Footer';
import FlashcardViewer from '../../common/FlashcardViewer';

interface CreateFlashcardsPageProps {
  onNavigate: (page: string, slug?: string, options?: { quizHistoryFilter?: string }) => void;
  user?: any;
  onLogout?: () => void;
}

type CardTheme = 'violet' | 'emerald' | 'blue' | 'amber' | 'rose';
type FontSize = 'small' | 'medium' | 'large';
type CardStyle = 'minimal' | 'bordered' | 'elevated';

const THEMES: Record<CardTheme, {
  dot: string;
  ring: string;
  cardBg: string;
  cardBorder: string;
  labelText: string;
  addBtn: string;
  addBtnHover: string;
  saveBtnFrom: string;
  saveBtnTo: string;
  saveBtnHoverFrom: string;
  saveBtnHoverTo: string;
  saveShadow: string;
  accentText: string;
  deckBadge: string;
}> = {
  violet: {
    dot: 'bg-violet-500',
    ring: 'ring-violet-500',
    cardBg: 'from-violet-50/80 to-purple-50/80 dark:from-violet-900/20 dark:to-purple-900/20',
    cardBorder: 'border-violet-200 dark:border-violet-700/50',
    labelText: 'text-violet-600 dark:text-violet-400',
    addBtn: 'bg-violet-600',
    addBtnHover: 'hover:bg-violet-700',
    saveBtnFrom: 'from-violet-600',
    saveBtnTo: 'to-purple-600',
    saveBtnHoverFrom: 'hover:from-violet-500',
    saveBtnHoverTo: 'hover:to-purple-500',
    saveShadow: 'shadow-violet-500/25',
    accentText: 'text-violet-600 dark:text-violet-400',
    deckBadge: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300',
  },
  emerald: {
    dot: 'bg-emerald-500',
    ring: 'ring-emerald-500',
    cardBg: 'from-emerald-50/80 to-teal-50/80 dark:from-emerald-900/20 dark:to-teal-900/20',
    cardBorder: 'border-emerald-200 dark:border-emerald-700/50',
    labelText: 'text-emerald-600 dark:text-emerald-400',
    addBtn: 'bg-emerald-600',
    addBtnHover: 'hover:bg-emerald-700',
    saveBtnFrom: 'from-emerald-500',
    saveBtnTo: 'to-teal-600',
    saveBtnHoverFrom: 'hover:from-emerald-400',
    saveBtnHoverTo: 'hover:to-teal-500',
    saveShadow: 'shadow-emerald-500/25',
    accentText: 'text-emerald-600 dark:text-emerald-400',
    deckBadge: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
  },
  blue: {
    dot: 'bg-blue-500',
    ring: 'ring-blue-500',
    cardBg: 'from-blue-50/80 to-sky-50/80 dark:from-blue-900/20 dark:to-sky-900/20',
    cardBorder: 'border-blue-200 dark:border-blue-700/50',
    labelText: 'text-blue-600 dark:text-blue-400',
    addBtn: 'bg-blue-600',
    addBtnHover: 'hover:bg-blue-700',
    saveBtnFrom: 'from-blue-600',
    saveBtnTo: 'to-sky-600',
    saveBtnHoverFrom: 'hover:from-blue-500',
    saveBtnHoverTo: 'hover:to-sky-500',
    saveShadow: 'shadow-blue-500/25',
    accentText: 'text-blue-600 dark:text-blue-400',
    deckBadge: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
  },
  amber: {
    dot: 'bg-amber-500',
    ring: 'ring-amber-400',
    cardBg: 'from-amber-50/80 to-orange-50/80 dark:from-amber-900/20 dark:to-orange-900/20',
    cardBorder: 'border-amber-200 dark:border-amber-700/50',
    labelText: 'text-amber-600 dark:text-amber-400',
    addBtn: 'bg-amber-500',
    addBtnHover: 'hover:bg-amber-600',
    saveBtnFrom: 'from-amber-500',
    saveBtnTo: 'to-orange-500',
    saveBtnHoverFrom: 'hover:from-amber-400',
    saveBtnHoverTo: 'hover:to-orange-400',
    saveShadow: 'shadow-amber-500/25',
    accentText: 'text-amber-600 dark:text-amber-400',
    deckBadge: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
  },
  rose: {
    dot: 'bg-rose-500',
    ring: 'ring-rose-500',
    cardBg: 'from-rose-50/80 to-pink-50/80 dark:from-rose-900/20 dark:to-pink-900/20',
    cardBorder: 'border-rose-200 dark:border-rose-700/50',
    labelText: 'text-rose-600 dark:text-rose-400',
    addBtn: 'bg-rose-600',
    addBtnHover: 'hover:bg-rose-700',
    saveBtnFrom: 'from-rose-500',
    saveBtnTo: 'to-pink-600',
    saveBtnHoverFrom: 'hover:from-rose-400',
    saveBtnHoverTo: 'hover:to-pink-500',
    saveShadow: 'shadow-rose-500/25',
    accentText: 'text-rose-600 dark:text-rose-400',
    deckBadge: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300',
  },
};

const THEME_DOTS: Record<CardTheme, string> = {
  violet: 'bg-gradient-to-br from-violet-400 to-purple-600',
  emerald: 'bg-gradient-to-br from-emerald-400 to-teal-600',
  blue: 'bg-gradient-to-br from-blue-400 to-sky-600',
  amber: 'bg-gradient-to-br from-amber-400 to-orange-500',
  rose: 'bg-gradient-to-br from-rose-400 to-pink-600',
};

const CreateFlashcardsPage = ({ onNavigate, user, onLogout }: CreateFlashcardsPageProps) => {
  const [deckTitle, setDeckTitle] = useState('');
  const [frontLabel, setFrontLabel] = useState('Front');
  const [backLabel, setBackLabel] = useState('Back');
  const [cards, setCards] = useState<{ front: string; back: string }[]>([]);
  const [frontInput, setFrontInput] = useState('');
  const [backInput, setBackInput] = useState('');
  const [theme, setTheme] = useState<CardTheme>('amber');
  const [fontSize, setFontSize] = useState<FontSize>('medium');
  const [cardStyle, setCardStyle] = useState<CardStyle>('bordered');
  const [showSettings, setShowSettings] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editFront, setEditFront] = useState('');
  const [editBack, setEditBack] = useState('');
  const [previewFlipped, setPreviewFlipped] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState('');
  const frontRef = useRef<HTMLTextAreaElement>(null);
  const backRef = useRef<HTMLTextAreaElement>(null);

  const t = THEMES[theme];
  const fontClass = fontSize === 'small' ? 'text-sm' : fontSize === 'large' ? 'text-xl' : 'text-base';

  // Study mode: when opening saved flashcards from Quiz History
  const [studyMode, setStudyMode] = useState<{ title: string; cards: { front: string; back: string }[] } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('savedFlashcards');
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      const cards = parsed.questions || [];
      if (cards.length > 0) {
        setStudyMode({
          title: parsed.title || 'Flashcards',
          cards: cards.map((c: any) => ({ front: c.front || '', back: c.back || '' }))
        });
      }
    } catch (_) {}
    finally {
      localStorage.removeItem('savedFlashcards');
    }
  }, []);

  useEffect(() => {
    document.title = studyMode ? 'Study Flashcards | WriteScholar' : 'Create Flashcards – Custom Deck Builder | WriteScholar';
  }, [studyMode]);

  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/tools/flashcard-generator' || path === '/flashcard-generator') {
      window.history.replaceState({}, '', '/tools/create-flashcards');
    }
  }, []);

  useEffect(() => {
    if (!studyMode) setTimeout(() => frontRef.current?.focus(), 100);
  }, [studyMode]);

  const addCard = () => {
    const f = frontInput.trim();
    const b = backInput.trim();
    if (!f || !b) return;
    setCards(prev => [...prev, { front: f, back: b }]);
    setFrontInput('');
    setBackInput('');
    setError('');
    setPreviewFlipped(false);
    setTimeout(() => frontRef.current?.focus(), 0);
  };

  const removeCard = (i: number) => {
    setCards(prev => prev.filter((_, idx) => idx !== i));
    if (editingIndex === i) setEditingIndex(null);
    else if (editingIndex !== null && editingIndex > i) setEditingIndex(editingIndex - 1);
  };

  const startEdit = (i: number) => {
    setEditingIndex(i);
    setEditFront(cards[i].front);
    setEditBack(cards[i].back);
  };

  const saveEdit = () => {
    if (editingIndex === null) return;
    const f = editFront.trim();
    const b = editBack.trim();
    if (!f || !b) return;
    setCards(prev => prev.map((c, i) => i === editingIndex ? { front: f, back: b } : c));
    setEditingIndex(null);
  };

  const moveCard = (index: number, direction: 'up' | 'down') => {
    const next = index + (direction === 'up' ? -1 : 1);
    if (next < 0 || next >= cards.length) return;
    const arr = [...cards];
    [arr[index], arr[next]] = [arr[next], arr[index]];
    setCards(arr);
    if (editingIndex === index) setEditingIndex(next);
    else if (editingIndex === next) setEditingIndex(index);
  };

  const duplicateCard = (i: number) => {
    setCards(prev => [...prev.slice(0, i + 1), prev[i], ...prev.slice(i + 1)]);
  };

  const saveDeck = async () => {
    if (cards.length === 0) return;
    setIsSaving(true);
    setError('');
    try {
      const token = localStorage.getItem('authToken');
      if (!token) { onNavigate('login'); return; }
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/save-flashcards`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: deckTitle.trim() || 'My Flashcards',
          cards: cards.map((c, i) => ({ id: i + 1, front: c.front, back: c.back })),
          sourceText: ''
        })
      });
      const data = await res.json();
      if (data.success) {
        setSavedSuccess(true);
        setTimeout(() => {
          setCards([]);
          setDeckTitle('');
          setSavedSuccess(false);
          onNavigate('quiz-history', undefined, { quizHistoryFilter: 'flashcards' });
        }, 800);
      } else {
        setError(data.message || 'Failed to save');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const cardElevation = cardStyle === 'elevated' ? 'shadow-xl shadow-stone-200/60 dark:shadow-stone-900/60' : cardStyle === 'bordered' ? 'shadow-sm' : '';
  const cardBorderClass = cardStyle === 'bordered' ? `border-2 ${t.cardBorder}` : cardStyle === 'elevated' ? 'border border-stone-200/60 dark:border-stone-700/40' : 'border border-transparent';

  // Study mode: show FlashcardViewer (same layout as Create page)
  if (studyMode) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white dark:from-stone-900 dark:to-stone-900">
        <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="create-flashcards" sticky />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-800 dark:text-stone-100">Study Flashcards</h1>
            <button
              onClick={() => setStudyMode(null)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-700 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Create New Deck
            </button>
          </div>
          <FlashcardViewer
            initialCards={studyMode.cards}
            title={studyMode.title}
            onNewDeck={() => setStudyMode(null)}
            onLoadPrevious={() => onNavigate('quiz-history', undefined, { quizHistoryFilter: 'flashcards' })}
          />
        </main>
        <Footer onNavigate={onNavigate} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white dark:from-stone-900 dark:to-stone-900">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="create-flashcards" sticky />

      {/* Hero */}
      <section className="pt-8 sm:pt-14 pb-6 sm:pb-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 sm:gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-xs font-semibold uppercase tracking-wide">
                  Card Builder
                </span>
                {cards.length > 0 && (
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${t.deckBadge}`}>
                    {cards.length} card{cards.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-stone-800 dark:text-stone-100 leading-tight mb-2">
                Create Flashcards
              </h1>
              <p className="text-stone-500 dark:text-stone-400 text-sm sm:text-base max-w-md mb-3">
                Build and fully customize your deck — themes, labels, style and more.
              </p>
              <button
                onClick={() => onNavigate('dashboard')}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 text-amber-700 dark:text-amber-300 text-xs font-medium hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
              >
                <span>✨</span>
                Have notes? Use Study Pack to generate flashcards with AI
              </button>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                  showSettings
                    ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-300'
                    : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-600 text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-700'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Customize
              </button>
              {user && (
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-600 hover:bg-stone-50 dark:hover:bg-stone-700 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Dashboard
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Customization panel */}
      {showSettings && (
        <section className="pb-4">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="bg-white dark:bg-stone-800 rounded-2xl sm:rounded-3xl border border-stone-200 dark:border-stone-600 shadow-lg shadow-stone-100/50 dark:shadow-stone-900/50 p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                </div>
                <h3 className="font-bold text-stone-800 dark:text-stone-100">Deck Appearance</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
                {/* Theme color */}
                <div>
                  <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-3">Theme color</label>
                  <div className="flex flex-wrap gap-2.5">
                    {(Object.keys(THEMES) as CardTheme[]).map(key => (
                      <button
                        key={key}
                        onClick={() => setTheme(key)}
                        title={key}
                        className={`relative w-9 h-9 rounded-xl ${THEME_DOTS[key]} transition-all hover:scale-110 ${theme === key ? `ring-2 ring-offset-2 dark:ring-offset-stone-800 ${THEMES[key].ring} scale-110` : ''}`}
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
                {/* Font size */}
                <div>
                  <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-3">Font size</label>
                  <div className="flex gap-2">
                    {(['small', 'medium', 'large'] as FontSize[]).map(s => (
                      <button
                        key={s}
                        onClick={() => setFontSize(s)}
                        className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all capitalize ${
                          fontSize === s
                            ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-400 text-amber-700 dark:text-amber-300 font-semibold'
                            : 'bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-600 text-stone-600 dark:text-stone-400 hover:border-stone-300'
                        }`}
                      >
                        {s === 'small' ? 'Aa' : s === 'medium' ? 'AA' : 'AA'}
                        <span className="block text-[9px] mt-0.5 opacity-70">{s}</span>
                      </button>
                    ))}
                  </div>
                </div>
                {/* Card style */}
                <div>
                  <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-3">Card style</label>
                  <div className="flex gap-2">
                    {(['minimal', 'bordered', 'elevated'] as CardStyle[]).map(s => (
                      <button
                        key={s}
                        onClick={() => setCardStyle(s)}
                        className={`flex-1 py-2 rounded-xl text-[11px] font-medium border transition-all capitalize ${
                          cardStyle === s
                            ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-400 text-amber-700 dark:text-amber-300 font-semibold'
                            : 'bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-600 text-stone-600 dark:text-stone-400 hover:border-stone-300'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Labels */}
                <div className="lg:col-span-2">
                  <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-3">Card labels</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      value={frontLabel}
                      onChange={e => setFrontLabel(e.target.value)}
                      placeholder="Front"
                      maxLength={24}
                      className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-600 bg-stone-50 dark:bg-stone-900 text-stone-800 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400"
                    />
                    <input
                      value={backLabel}
                      onChange={e => setBackLabel(e.target.value)}
                      placeholder="Back"
                      maxLength={24}
                      className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-600 bg-stone-50 dark:bg-stone-900 text-stone-800 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main workspace */}
      <section className="pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 lg:gap-8">

            {/* LEFT: Editor */}
            <div className="space-y-5 order-1">

              {/* Deck title */}
              <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-600 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4">
                  <div className={`w-8 h-8 rounded-lg ${THEME_DOTS[theme]} flex items-center justify-center flex-shrink-0`}>
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <input
                    value={deckTitle}
                    onChange={e => setDeckTitle(e.target.value)}
                    placeholder="Deck name, e.g. Biology Ch.5 or Spanish Vocab..."
                    className="flex-1 text-base font-medium bg-transparent border-none outline-none text-stone-800 dark:text-stone-100 placeholder-stone-400"
                  />
                  {deckTitle && (
                    <button onClick={() => setDeckTitle('')} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 p-1 rounded-lg">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Add card */}
              <div className={`bg-white dark:bg-stone-800 rounded-2xl sm:rounded-3xl ${cardBorderClass} ${cardElevation} overflow-hidden`}>
                {/* Two-column input */}
                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-stone-200 dark:divide-stone-600/50">
                  <div className="p-5 sm:p-6 min-w-0">
                    <div className={`text-[11px] font-bold uppercase tracking-wide mb-3 truncate ${t.labelText}`} title={frontLabel}>{frontLabel || 'Front'}</div>
                    <textarea
                      ref={frontRef}
                      value={frontInput}
                      onChange={e => setFrontInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); backRef.current?.focus(); }
                        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') addCard();
                      }}
                      placeholder="Term, question, or concept…"
                      rows={5}
                      className={`w-full p-0 bg-transparent border-none outline-none resize-none focus:ring-0 ${fontClass} text-stone-800 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 leading-relaxed`}
                    />
                  </div>
                  <div className="p-5 sm:p-6 min-w-0">
                    <div className={`text-[11px] font-bold uppercase tracking-wide mb-3 truncate ${t.labelText}`} title={backLabel}>{backLabel || 'Back'}</div>
                    <textarea
                      ref={backRef}
                      value={backInput}
                      onChange={e => setBackInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Tab' && e.shiftKey) { e.preventDefault(); frontRef.current?.focus(); }
                        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') addCard();
                      }}
                      placeholder="Definition, answer, or explanation…"
                      rows={5}
                      className={`w-full p-0 bg-transparent border-none outline-none resize-none focus:ring-0 ${fontClass} text-stone-800 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 leading-relaxed`}
                    />
                  </div>
                </div>
                {/* Toolbar */}
                <div className="px-5 py-3.5 bg-stone-50 dark:bg-stone-800/60 border-t border-stone-200 dark:border-stone-600/50 flex items-center justify-between gap-3">
                  <p className="text-xs text-stone-400 dark:text-stone-500 hidden sm:flex items-center gap-1.5 flex-wrap">
                    <kbd className="px-1.5 py-0.5 bg-stone-200 dark:bg-stone-700 rounded text-[10px] font-mono">⌘</kbd>
                    <kbd className="px-1.5 py-0.5 bg-stone-200 dark:bg-stone-700 rounded text-[10px] font-mono">Enter</kbd>
                    <span>add</span>
                    <span className="text-stone-300 dark:text-stone-600 mx-1">·</span>
                    <kbd className="px-1.5 py-0.5 bg-stone-200 dark:bg-stone-700 rounded text-[10px] font-mono">Tab</kbd>
                    <span>switch field</span>
                  </p>
                  <button
                    onClick={addCard}
                    disabled={!frontInput.trim() || !backInput.trim()}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 ${t.addBtn} ${t.addBtnHover} text-white text-sm font-semibold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg active:scale-95`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Card
                  </button>
                </div>
              </div>

              {/* Card list */}
              {cards.length > 0 && (
                <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-600 shadow-sm overflow-hidden">
                  <div className="px-5 py-3.5 bg-stone-50 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-600/50 flex items-center justify-between">
                    <span className="font-semibold text-stone-700 dark:text-stone-200 text-sm flex items-center gap-2">
                      <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      {cards.length} card{cards.length !== 1 ? 's' : ''}
                    </span>
                    <button
                      onClick={() => setCards([])}
                      className="text-xs text-stone-400 hover:text-red-500 dark:hover:text-red-400 transition-colors flex items-center gap-1"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Clear all
                    </button>
                  </div>
                  <div className="max-h-[360px] overflow-y-auto">
                    {cards.map((card, i) => (
                      <div key={i} className="group border-b border-stone-100 dark:border-stone-700/40 last:border-0">
                        {editingIndex === i ? (
                          <div className="p-4 space-y-3 bg-stone-50/50 dark:bg-stone-800/50">
                            <textarea
                              value={editFront}
                              onChange={e => setEditFront(e.target.value)}
                              rows={2}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-900 text-sm text-stone-800 dark:text-stone-100 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                              placeholder={frontLabel}
                            />
                            <textarea
                              value={editBack}
                              onChange={e => setEditBack(e.target.value)}
                              rows={2}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-900 text-sm text-stone-800 dark:text-stone-100 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                              placeholder={backLabel}
                            />
                            <div className="flex items-center gap-2">
                              <button
                                onClick={saveEdit}
                                disabled={!editFront.trim() || !editBack.trim()}
                                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-colors"
                              >
                                Save changes
                              </button>
                              <button
                                onClick={() => setEditingIndex(null)}
                                className="px-4 py-2 text-stone-500 dark:text-stone-400 text-xs font-medium hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-stone-50/80 dark:hover:bg-stone-700/20 transition-colors">
                            {/* Reorder */}
                            <div className="flex flex-col gap-0.5 flex-shrink-0">
                              <button
                                onClick={() => moveCard(i, 'up')}
                                disabled={i === 0}
                                className="p-1 text-stone-300 dark:text-stone-600 hover:text-stone-600 dark:hover:text-stone-300 disabled:opacity-30 transition-colors rounded"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" /></svg>
                              </button>
                              <button
                                onClick={() => moveCard(i, 'down')}
                                disabled={i === cards.length - 1}
                                className="p-1 text-stone-300 dark:text-stone-600 hover:text-stone-600 dark:hover:text-stone-300 disabled:opacity-30 transition-colors rounded"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                              </button>
                            </div>
                            {/* Index */}
                            <span className="text-xs text-stone-400 dark:text-stone-500 w-5 text-center flex-shrink-0">{i + 1}</span>
                            {/* Content */}
                            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => startEdit(i)}>
                              <p className="text-sm font-medium text-stone-700 dark:text-stone-200 truncate">{card.front}</p>
                              <p className="text-xs text-stone-500 dark:text-stone-400 truncate mt-0.5">{card.back}</p>
                            </div>
                            {/* Actions */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                              <button
                                onClick={() => startEdit(i)}
                                className="p-1.5 text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                                title="Edit"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => duplicateCard(i)}
                                className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                                title="Duplicate"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => removeCard(i)}
                                className="p-1.5 text-stone-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                title="Delete"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {cards.length === 0 && (
                <div className="text-center py-14 px-6 bg-white dark:bg-stone-800 rounded-2xl border border-dashed border-stone-300 dark:border-stone-600">
                  <div className={`w-16 h-16 ${THEME_DOTS[theme]} rounded-2xl flex items-center justify-center mx-auto mb-4 opacity-40`}>
                    <span className="text-3xl">🃏</span>
                  </div>
                  <p className="font-semibold text-stone-500 dark:text-stone-400 mb-1">No cards yet</p>
                  <p className="text-sm text-stone-400 dark:text-stone-500">Fill in both sides above and click "Add Card"</p>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm flex items-center gap-3">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Save */}
              <button
                onClick={saveDeck}
                disabled={cards.length === 0 || isSaving || savedSuccess}
                className={`w-full py-4 inline-flex items-center justify-center gap-2.5 font-bold text-base rounded-2xl transition-all shadow-lg ${t.saveShadow} hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg text-white bg-gradient-to-r ${t.saveBtnFrom} ${t.saveBtnTo} ${t.saveBtnHoverFrom} ${t.saveBtnHoverTo}`}
              >
                {savedSuccess ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    Saved!
                  </>
                ) : isSaving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving your deck…
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    Save & Study{cards.length > 0 ? ` · ${cards.length} card${cards.length !== 1 ? 's' : ''}` : ''}
                  </>
                )}
              </button>
            </div>

            {/* RIGHT: Live preview */}
            <div className="order-2">
              <div className="sticky top-24">
                <p className="text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wide mb-3">Live Preview</p>
                {/* Card */}
                <div
                  onClick={() => setPreviewFlipped(!previewFlipped)}
                  className={`relative bg-gradient-to-br ${t.cardBg} rounded-2xl sm:rounded-3xl ${cardBorderClass} ${cardElevation} cursor-pointer overflow-hidden`}
                  style={{ minHeight: 220 }}
                >
                  {/* Decorative accent */}
                  <div className={`absolute top-0 right-0 w-24 h-24 rounded-full -translate-y-1/2 translate-x-1/2 opacity-20 ${THEME_DOTS[theme]} blur-2xl`} />

                  {/* Front */}
                  <div className={`relative p-6 sm:p-8 flex flex-col min-h-[220px] min-w-0 transition-opacity duration-200 ${previewFlipped ? 'opacity-0 pointer-events-none absolute inset-0' : 'opacity-100'}`}>
                    <div className={`text-[10px] font-bold uppercase tracking-wide mb-3 truncate min-w-0 ${t.labelText}`} title={frontLabel}>{frontLabel || 'Front'}</div>
                    <p className={`flex-1 ${fontClass} font-medium text-stone-800 dark:text-stone-100 leading-relaxed`}>
                      {frontInput || <span className="text-stone-400 dark:text-stone-500">Your term or question…</span>}
                    </p>
                    <div className="flex items-center gap-1.5 mt-4 text-stone-400 dark:text-stone-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span className="text-xs">Tap to flip</span>
                    </div>
                  </div>

                  {/* Back */}
                  <div className={`relative p-6 sm:p-8 flex flex-col min-h-[220px] min-w-0 transition-opacity duration-200 ${previewFlipped ? 'opacity-100' : 'opacity-0 pointer-events-none absolute inset-0'}`}>
                    <div className={`text-[10px] font-bold uppercase tracking-wide mb-3 truncate min-w-0 ${t.labelText}`} title={backLabel}>{backLabel || 'Back'}</div>
                    <p className={`flex-1 ${fontClass} text-stone-700 dark:text-stone-200 leading-relaxed`}>
                      {backInput || <span className="text-stone-400 dark:text-stone-500">Your definition or answer…</span>}
                    </p>
                    <div className="flex items-center gap-1.5 mt-4 text-stone-400 dark:text-stone-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span className="text-xs">Tap to flip back</span>
                    </div>
                  </div>
                </div>

                {/* Deck stack */}
                {cards.length > 0 ? (
                  <div className="mt-5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {cards.slice(-5).reverse().map((_, i) => (
                          <div
                            key={i}
                            className={`w-8 h-10 rounded-lg bg-gradient-to-br ${t.cardBg} ${cardBorderClass} border`}
                          />
                        ))}
                      </div>
                      <span className={`text-sm font-semibold ${t.accentText}`}>{cards.length} card{cards.length !== 1 ? 's' : ''}</span>
                    </div>
                    <button
                      onClick={() => setPreviewFlipped(p => !p)}
                      className="text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 flex items-center gap-1 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      flip
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-stone-400 dark:text-stone-500 mt-4 text-center">Add cards to see the deck stack</p>
                )}

                {/* Tips */}
                <div className="mt-6 p-4 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-200/60 dark:border-stone-700/40 space-y-2">
                  <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">Tips</p>
                  <ul className="space-y-1.5 text-xs text-stone-400 dark:text-stone-500">
                    <li className="flex items-start gap-2"><span className="text-amber-500 mt-0.5">✓</span>Click any card in the list to edit it</li>
                    <li className="flex items-start gap-2"><span className="text-amber-500 mt-0.5">✓</span>Use arrows to reorder cards</li>
                    <li className="flex items-start gap-2"><span className="text-amber-500 mt-0.5">✓</span>Duplicate a card with the copy icon</li>
                    <li className="flex items-start gap-2"><span className="text-amber-500 mt-0.5">✓</span>After saving, study in Saved Materials</li>
                  </ul>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default CreateFlashcardsPage;
