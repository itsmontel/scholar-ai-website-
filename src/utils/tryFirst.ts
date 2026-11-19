/**
 * First result before sign-up.
 *
 * A visitor builds one study pack or grades one essay on the landing page
 * with no account (POST /api/preview/*). The server keeps the result under
 * a token; these helpers keep that token, the visitor's door and their
 * answers to the wait-time questions in the browser until an account
 * exists, then hand everything over.
 */
import { trackEvent } from './analytics';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export type Door = 'exam' | 'essay';

const DOOR_KEY = 'ws_door';
const PACK_PREVIEW_KEY = 'ws_pack_preview';
const GRADE_PREVIEW_KEY = 'ws_grade_preview';
const ANSWERS_KEY = 'ws_onboarding_answers';
/** Mirrors STORAGE_KEY in StudyPackViewerPage: the pack the viewer opens with. */
export const PACK_VIEWER_KEY = 'writescholar_study_pack_viewer';
const DAY_MS = 24 * 60 * 60 * 1000;

const read = <T,>(store: Storage, key: string): T | null => {
  try {
    const raw = store.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};
const write = (store: Storage, key: string, value: unknown) => {
  try { store.setItem(key, JSON.stringify(value)); } catch { /* storage full or blocked */ }
};
const drop = (store: Storage, key: string) => {
  try { store.removeItem(key); } catch { /* ignore */ }
};

/* ─── Which door ───────────────────────────────────────────────── */

/** The door a visitor last used, or null. Also what a new account's dashboard opens on. */
export function readDoor(): Door | null {
  try {
    const v = localStorage.getItem(DOOR_KEY);
    return v === 'exam' || v === 'essay' ? v : null;
  } catch {
    return null;
  }
}

export function rememberDoor(door: Door) {
  try { localStorage.setItem(DOOR_KEY, door); } catch { /* ignore */ }
}

/* ─── Where they came from ─────────────────────────────────────── */

/** Referrer host and UTM tags for the landing_view event. No personal data. */
export function visitSource(): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    const ref = document.referrer ? new URL(document.referrer) : null;
    if (ref && ref.host && ref.host !== window.location.host) out.referrer = ref.host.replace(/^www\./, '').slice(0, 80);
    const params = new URLSearchParams(window.location.search);
    for (const key of ['utm_source', 'utm_medium', 'utm_campaign']) {
      const v = params.get(key);
      if (v) out[key] = v.slice(0, 80);
    }
  } catch { /* ignore */ }
  return out;
}

/* ─── Study pack made before sign-up ───────────────────────────── */

export interface PackRequest {
  inputType: 'topic' | 'notes';
  /** The topic, or the notes text. */
  input: string;
}

export interface PendingPack extends PackRequest {
  token: string;
  title: string;
  at: number;
}

export function packTitleOf(data: any, fallback: string): string {
  return (
    data?.quiz?.title || data?.flashcards?.title || data?.lesson?.title || data?.sourceTopic || fallback || 'Study pack'
  );
}

/** Keep the pack for the viewer page and remember that it still needs an owner. */
export function stashPreviewPack(data: any, token: string, req: PackRequest) {
  const title = packTitleOf(data, req.inputType === 'topic' ? req.input : 'Study pack');
  write(sessionStorage, PACK_VIEWER_KEY, { data, title });
  write(localStorage, PACK_PREVIEW_KEY, { token, title, inputType: req.inputType, input: req.input.slice(0, 40000), at: Date.now() });
  return title;
}

export function readPendingPack(): PendingPack | null {
  const p = read<PendingPack>(localStorage, PACK_PREVIEW_KEY);
  if (!p || typeof p.token !== 'string' || !p.input) return null;
  if (typeof p.at === 'number' && Date.now() - p.at > DAY_MS) return null;
  return p;
}

export function clearPendingPack() {
  drop(localStorage, PACK_PREVIEW_KEY);
}

export type PreviewFailure = { ok: false; limit: boolean; message: string };

/** Build a study pack with no account. */
export async function previewStudyPack(req: PackRequest): Promise<{ ok: true; token: string; data: any } | PreviewFailure> {
  try {
    const res = await fetch(`${API_URL}/preview/study-pack`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.inputType === 'topic' ? { inputType: 'topic', topic: req.input } : { inputType: 'notes', text: req.input }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      return { ok: false, limit: res.status === 429, message: json?.message || 'That did not work. Please try again.' };
    }
    return { ok: true, token: String(json.token || ''), data: json.data };
  } catch {
    return { ok: false, limit: false, message: 'We could not reach WriteScholar. Check your connection and try again.' };
  }
}

/** Build a study pack on a signed-in account (spends a credit). */
export async function createStudyPack(
  req: PackRequest,
  authToken: string,
  previewToken?: string,
): Promise<{ ok: true; data: any } | { ok: false; status: number; message: string; verifyEmail?: boolean; upgrade?: boolean }> {
  try {
    const res = await fetch(`${API_URL}/analysis/generate-study-pack`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({
        ...(req.inputType === 'topic' ? { inputType: 'topic', topic: req.input } : { text: req.input }),
        ...(previewToken ? { previewToken } : {}),
      }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || json?.success === false) {
      return {
        ok: false,
        status: res.status,
        message: json?.message || 'Could not build that study pack.',
        verifyEmail: json?.code === 'VERIFY_EMAIL',
        upgrade: res.status === 429 || json?.upgrade === true,
      };
    }
    return { ok: true, data: json.data };
  } catch {
    return { ok: false, status: 0, message: 'We could not reach WriteScholar. Check your connection and try again.' };
  }
}

/**
 * A pack made before sign-up now has an account: save it there. The server
 * reuses the pack it already built when the token is still alive, and
 * builds it again from the same topic or notes when it is not.
 * Returns true when the pack is saved.
 */
export async function claimPendingPack(authToken: string): Promise<boolean> {
  const pending = readPendingPack();
  if (!pending) return false;
  // Clear first: a slow request must not be sent twice by a re-render.
  clearPendingPack();
  const result = await createStudyPack({ inputType: pending.inputType, input: pending.input }, authToken, pending.token);
  if (!result.ok) return false;
  try { localStorage.setItem('writescholar_has_study_pack', 'true'); } catch { /* ignore */ }
  trackEvent('pack_completed', { source: 'claimed_preview', kind: pending.inputType });
  window.dispatchEvent(new CustomEvent('writescholar-study-pack-saved'));
  return true;
}

/* ─── Notes carried over from a free tool ──────────────────────── */

const PENDING_NOTES_KEY = 'ws_pending_notes';

/** Text from a free tool, on its way to the landing page's notes box. */
export function stashPendingNotes(text: string) {
  try { sessionStorage.setItem(PENDING_NOTES_KEY, text.slice(0, 60000)); } catch { /* ignore */ }
}

export function hasPendingNotes(): boolean {
  try { return !!sessionStorage.getItem(PENDING_NOTES_KEY); } catch { return false; }
}

export function takePendingNotes(): string {
  try {
    const text = sessionStorage.getItem(PENDING_NOTES_KEY) || '';
    sessionStorage.removeItem(PENDING_NOTES_KEY);
    return text;
  } catch {
    return '';
  }
}

/* ─── Essay graded before sign-up ──────────────────────────────── */

export interface GradePreview {
  overall_score: number | null;
  grade_estimate: string | null;
  grade_rubric: Record<string, any> | null;
  comments: { total: number; strong: number; improve: number; concern: number };
  fixes: number;
  wordCount: number;
}

export async function previewGrade(content: string): Promise<{ ok: true; token: string; data: GradePreview } | PreviewFailure> {
  try {
    const res = await fetch(`${API_URL}/preview/grade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      return { ok: false, limit: res.status === 429, message: json?.message || 'That did not work. Please try again.' };
    }
    return { ok: true, token: String(json.token || ''), data: json.data as GradePreview };
  } catch {
    return { ok: false, limit: false, message: 'We could not reach WriteScholar. Check your connection and try again.' };
  }
}

/** The token that lets the analysis page reuse the grade already made. */
export function stashGradeToken(token: string) {
  write(localStorage, GRADE_PREVIEW_KEY, { token, at: Date.now() });
}

export function takeGradeToken(): string | null {
  const p = read<{ token: string; at: number }>(localStorage, GRADE_PREVIEW_KEY);
  drop(localStorage, GRADE_PREVIEW_KEY);
  if (!p || typeof p.token !== 'string') return null;
  if (typeof p.at === 'number' && Date.now() - p.at > 2 * 60 * 60 * 1000) return null;
  return p.token;
}

/* ─── Questions asked while it generates ───────────────────────── */

export interface OnboardingAnswers {
  /** Which door they used: becomes use_goal. */
  door?: Door;
  /** Exam date (exam door). */
  deadline?: 'week' | 'twoweeks' | 'month' | 'later' | 'none';
  /** Due date (essay door). */
  due?: 'today' | 'tomorrow' | 'week' | 'later' | 'none';
  level?: 'highschool' | 'underclass' | 'upperclass' | 'masters';
  referralSource?: 'reddit' | 'google' | 'tiktok' | 'instagram' | 'youtube' | 'friend' | 'other';
  /** Asked on the welcome screens only. */
  both?: boolean;
  current?: 'A' | 'B' | 'C' | 'D';
  struggles?: string[];
}

export function readAnswers(): OnboardingAnswers {
  return read<OnboardingAnswers>(localStorage, ANSWERS_KEY) || {};
}

export function saveAnswer(patch: OnboardingAnswers) {
  write(localStorage, ANSWERS_KEY, { ...readAnswers(), ...patch });
}

/** True once the three questions have an answer (or were asked before on this device). */
export function answersComplete(door: Door): boolean {
  const a = readAnswers();
  return !!a.level && !!a.referralSource && !!(door === 'exam' ? a.deadline : a.due);
}

/**
 * Send the stored answers to the account's survey row, so they sit beside
 * the answers the old onboarding collected. Safe to call on every sign-in:
 * it does nothing when there is nothing new to send.
 */
export async function flushAnswers(authToken: string): Promise<void> {
  const a = readAnswers();
  if (!a.door && !a.level && !a.referralSource && !a.deadline && !a.due && !a.current && !a.struggles?.length) return;
  const sentKey = `${ANSWERS_KEY}_sent`;
  const fingerprint = JSON.stringify(a);
  try { if (localStorage.getItem(sentKey) === fingerprint) return; } catch { /* ignore */ }
  try {
    const res = await fetch(`${API_URL}/users/onboarding-survey`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({
        referralSource: a.referralSource ?? null,
        useGoal: a.door === 'exam' ? 'exams' : a.door === 'essay' ? 'essays' : null,
        featureInterests: a.both ? ['study_packs', 'essays'] : a.door === 'exam' ? ['study_packs'] : a.door === 'essay' ? ['essays'] : [],
        answers: {
          ...(a.level ? { level: a.level } : {}),
          ...(a.deadline ? { deadline: a.deadline } : {}),
          ...(a.due ? { due: a.due } : {}),
          ...(a.door ? { pressure: a.both ? 'both' : a.door === 'exam' ? 'exam' : 'essay' } : {}),
          ...(a.current ? { current: a.current } : {}),
          ...(a.struggles?.length ? { struggles: a.struggles } : {}),
        },
      }),
    });
    if (res.ok) {
      try { localStorage.setItem(sentKey, fingerprint); } catch { /* ignore */ }
    }
  } catch { /* try again on the next sign-in */ }
}
