import type { Question } from './types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export async function getQuestionsForTopic(topic: string): Promise<Question[]> {
  const res = await fetch(`${API_BASE}/lightning-reflex/generate-questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic: topic.trim() || 'general trivia' }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to generate questions');
  }
  const data = await res.json();
  const questions = data.questions || data.data?.questions || [];
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error('No questions generated');
  }
  return questions.map((q: any, i: number) => ({
    id: q.id || `q${i + 1}`,
    prompt: q.prompt || '',
    answers: Array.isArray(q.answers) ? q.answers : [],
    correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
  }));
}

export async function getQuestionsFromNotes(notes: string): Promise<Question[]> {
  const res = await fetch(`${API_BASE}/lightning-reflex/generate-questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes: notes.trim() }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to generate questions from notes');
  }
  const data = await res.json();
  const questions = data.questions || data.data?.questions || [];
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error('No questions generated');
  }
  return questions.map((q: any, i: number) => ({
    id: q.id || `q${i + 1}`,
    prompt: q.prompt || '',
    answers: Array.isArray(q.answers) ? q.answers : [],
    correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
  }));
}

export function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
