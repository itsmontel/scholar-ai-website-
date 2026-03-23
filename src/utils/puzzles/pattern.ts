/**
 * Pattern sequence memory - watch symbols, then tap in correct order.
 * Easy: 6 elements, Hard: 7 elements
 */

export type PatternElement =
  | 'circle'
  | 'square'
  | 'triangle'
  | 'diamond'
  | 'star'
  | 'heart'
  | 'hexagon'
  | 'pentagon';

export const PATTERN_ELEMENTS: PatternElement[] = [
  'circle',
  'square',
  'triangle',
  'diamond',
  'star',
  'heart',
  'hexagon',
  'pentagon',
];

export const PATTERN_COLORS: Record<PatternElement, string> = {
  circle: '#8b5cf6',
  square: '#ef4444',
  triangle: '#22c55e',
  diamond: '#f97316',
  star: '#eab308',
  heart: '#ec4899',
  hexagon: '#a855f7',
  pentagon: '#06b6d4',
};

export const PATTERN_ICONS: Record<PatternElement, string> = {
  circle: '●',
  square: '■',
  triangle: '▲',
  diamond: '◆',
  star: '★',
  heart: '♥',
  hexagon: '⬡',
  pentagon: '⬠',
};

export interface PatternSequence {
  elements: PatternElement[];
  length: number;
}

export function generatePattern(hardMode = false): PatternSequence {
  const length = hardMode ? 7 : 6;
  const elements: PatternElement[] = [];
  for (let i = 0; i < length; i++) {
    elements.push(PATTERN_ELEMENTS[Math.floor(Math.random() * PATTERN_ELEMENTS.length)]);
  }
  return { elements, length };
}
