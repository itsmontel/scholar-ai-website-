/**
 * Memory match game - find matching pairs.
 * Easy: 8 pairs (16 cards, 4x4 grid)
 * Hard: 10 pairs (20 cards, 4x5 grid)
 */

export interface MemoryCard {
  id: string;
  value: string;
  isMatched: boolean;
}

export interface MemoryGame {
  cards: MemoryCard[];
  totalPairs: number;
  gridColumns: number;
  isHardMode: boolean;
}

const SYMBOLS = ['🎮', '🎯', '🎪', '🎨', '🎭', '🎸', '🎲', '🎺', '🎹', '🎤'];

function uuid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function generateMemoryGame(hardMode = false): MemoryGame {
  const totalPairs = hardMode ? 10 : 8;
  const gridColumns = 4;
  const symbols = hardMode ? SYMBOLS : SYMBOLS.slice(0, 8);
  const cards: MemoryCard[] = [];
  for (const sym of symbols.slice(0, totalPairs)) {
    cards.push({ id: uuid(), value: sym, isMatched: false });
    cards.push({ id: uuid(), value: sym, isMatched: false });
  }
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return { cards, totalPairs, gridColumns, isHardMode: hardMode };
}
