/**
 * Mental math question bank for Word Tower.
 * "Which of these are X?" style — multiple correct + multiple incorrect.
 */
import type { WordTowerQuestion } from './wordTowerWordBank';

function pickN<T>(arr: T[], n: number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

function buildEvenOdd(): WordTowerQuestion[] {
  const out: WordTowerQuestion[] = [];
  for (let r = 0; r < 8; r++) {
    const evens: number[] = [];
    const odds: number[] = [];
    while (evens.length < 3) {
      const n = 2 + Math.floor(Math.random() * 60) * 2;
      if (!evens.includes(n)) evens.push(n);
    }
    while (odds.length < 3) {
      const n = 1 + Math.floor(Math.random() * 60) * 2;
      if (!odds.includes(n)) odds.push(n);
    }
    out.push({
      prompt: "Which are even numbers?",
      items: [
        ...evens.map(n => ({ text: String(n), isCorrect: true })),
        ...odds.map(n => ({ text: String(n), isCorrect: false })),
      ],
    });
  }
  return out;
}

function buildPrimes(): WordTowerQuestion[] {
  const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];
  const composites = [4, 6, 8, 9, 10, 14, 15, 16, 21, 25, 27, 33, 35, 39, 49];
  const out: WordTowerQuestion[] = [];
  for (let r = 0; r < 6; r++) {
    out.push({
      prompt: "Which are prime numbers?",
      items: [
        ...pickN(primes, 3).map(n => ({ text: String(n), isCorrect: true })),
        ...pickN(composites, 3).map(n => ({ text: String(n), isCorrect: false })),
      ],
    });
  }
  return out;
}

function buildMultiples(): WordTowerQuestion[] {
  const out: WordTowerQuestion[] = [];
  const bases = [3, 4, 5, 6, 7, 8, 9];
  for (const b of bases) {
    const multiples: number[] = [];
    const non: number[] = [];
    for (let i = 1; i <= 12; i++) multiples.push(b * i);
    for (let n = 2; n <= 100; n++) if (n % b !== 0) non.push(n);
    out.push({
      prompt: `Which are multiples of ${b}?`,
      items: [
        ...pickN(multiples, 3).map(n => ({ text: String(n), isCorrect: true })),
        ...pickN(non, 3).map(n => ({ text: String(n), isCorrect: false })),
      ],
    });
  }
  return out;
}

function buildSquares(): WordTowerQuestion[] {
  const squares = [1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144];
  const non = [2, 3, 5, 8, 10, 12, 15, 17, 22, 30, 50, 60, 70, 90, 110, 130];
  const out: WordTowerQuestion[] = [];
  for (let r = 0; r < 5; r++) {
    out.push({
      prompt: "Which are perfect squares?",
      items: [
        ...pickN(squares, 3).map(n => ({ text: String(n), isCorrect: true })),
        ...pickN(non, 3).map(n => ({ text: String(n), isCorrect: false })),
      ],
    });
  }
  return out;
}

export const WORD_TOWER_MENTAL_MATH_BANK: WordTowerQuestion[] = [
  ...buildEvenOdd(),
  ...buildPrimes(),
  ...buildMultiples(),
  ...buildSquares(),
];
