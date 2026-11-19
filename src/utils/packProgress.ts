/**
 * Which steps of a study pack a student has finished.
 *
 * A pack is studied as a path: lesson, flashcards, quiz, crossword, games.
 * A step is ticked when the student says so ("Done, next: ..." in the pack
 * viewer), not merely when they open it. Kept in this browser only: there
 * is no server record of pack progress yet.
 */

export type PackStep = 'lesson' | 'flashcards' | 'quiz' | 'crossword' | 'games';

export const PACK_STEPS: { key: PackStep; label: string }[] = [
  { key: 'lesson', label: 'Lesson' },
  { key: 'flashcards', label: 'Flashcards' },
  { key: 'quiz', label: 'Quiz' },
  { key: 'crossword', label: 'Crossword' },
  { key: 'games', label: 'Games' },
];

const KEY = 'ws_pack_progress';
const MAX_PACKS = 60;

type Store = Record<string, { done: PackStep[]; at: number }>;

/** A stable name for a pack that both the list and the viewer can work out. */
export function packKey(title: string, createdAt?: string | null): string {
  return `${(title || 'Study pack').trim().slice(0, 120)}|${(createdAt || '').slice(0, 19)}`;
}

function read(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? (parsed as Store) : {};
  } catch {
    return {};
  }
}

export function stepsDone(key: string): PackStep[] {
  const entry = read()[key];
  return Array.isArray(entry?.done) ? entry.done : [];
}

export function markStepDone(key: string, step: PackStep): PackStep[] {
  const store = read();
  const done = Array.isArray(store[key]?.done) ? store[key].done : [];
  const next = done.includes(step) ? done : [...done, step];
  store[key] = { done: next, at: Date.now() };
  // Keep the newest packs only, so the record cannot grow without bound.
  const kept = Object.entries(store).sort((a, b) => b[1].at - a[1].at).slice(0, MAX_PACKS);
  try { localStorage.setItem(KEY, JSON.stringify(Object.fromEntries(kept))); } catch { /* ignore */ }
  return next;
}

/** The first step not yet done from the ones this pack has, or null when all are. */
export function nextStep(done: PackStep[], available: PackStep[]): PackStep | null {
  return available.find((s) => !done.includes(s)) ?? null;
}
