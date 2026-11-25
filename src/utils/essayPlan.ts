/**
 * Essay writing: the plan a student makes before a draft exists (question,
 * chosen thesis, outline) and the calls that power writing help.
 *
 * The plan is kept in localStorage against the document it produced, so the
 * editor can show the outline beside the draft. The headings themselves live
 * in the document, so the essay is intact on another device; only the side
 * panel's goals are device-local.
 */
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const PLAN_KEY = (docId: string) => `ws_essay_plan_${docId}`;

export interface OutlineSection {
  heading: string;
  goal: string;
  words: number;
}
export interface ThesisOption {
  thesis: string;
  why: string;
  outline: OutlineSection[];
}
export interface WritingUsage {
  paid: boolean;
  plansUsed: number;
  plansLimit: number;
  plansLeft: number;
  helpsUsed: number;
  helpsLimit: number;
  helpsLeft: number;
  /** When both allowances start again (ISO), if known. */
  resetsAt?: string | null;
}
export interface EssayPlanResult {
  title: string;
  theses: ThesisOption[];
  wordTarget: number;
  usage?: WritingUsage;
}
/** What is stored against a document. */
export interface EssayPlan {
  question: string;
  /** Rubric or assignment brief the student pasted, if any. */
  brief?: string;
  thesis: string;
  sections: OutlineSection[];
  wordTarget: number;
}
export type HelpKind = 'start' | 'next' | 'check' | 'clearer' | 'shorter' | 'formal' | 'fix';
/** Feedback on one section of an unfinished draft. No grade: the essay is not finished. */
export interface CheckHelp {
  kind: 'check';
  verdict: 'on_track' | 'nearly' | 'needs_work';
  summary: string;
  working: string;
  /** `quote` is the student's own words the fix is about, as written, or '' when it is about the whole passage. */
  fixes: { issue: string; how: string; quote?: string }[];
  usage?: WritingUsage;
}
/** Fewest words a section needs before it can be checked (matches the API). */
export const CHECK_MIN_WORDS = 40;
/** Most words a check reads (matches the API). */
export const CHECK_MAX_WORDS = 900;
/** A draft is ready for a full grade at this share of its word target. */
export const GRADE_READY_SHARE = 0.8;
/** What to write next in a paragraph that is already started: what it has done so far, and two ways to carry on. */
export interface NextHelp { kind: 'next'; sofar: string; moves: { what: string; starter: string }[]; questions: string[]; usage?: WritingUsage }
export interface StartHelp { kind: 'start'; starters: string[]; questions: string[]; usage?: WritingUsage }
export interface RewriteHelp { kind: 'clearer' | 'shorter' | 'formal' | 'fix'; replacement: string; why: string; usage?: WritingUsage }

/** An API failure the UI can show as is. `upgrade` means a paid plan would lift the limit. */
export class WritingError extends Error {
  upgrade: boolean;
  constructor(message: string, upgrade = false) {
    super(message);
    this.upgrade = upgrade;
  }
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('authToken') || localStorage.getItem('token');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/writing${path}`, { ...init, headers: authHeaders() });
  } catch {
    throw new WritingError('Could not reach WriteScholar. Check your connection and try again.');
  }
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    throw new WritingError(json?.message || 'Something went wrong. Try again.', !!json?.upgrade);
  }
  return json.data as T;
}

export const fetchWritingUsage = () => call<WritingUsage>('/usage');

export const requestEssayPlan = (body: { question: string; essayType: string; wordTarget: number; brief?: string }) =>
  call<EssayPlanResult>('/plan', { method: 'POST', body: JSON.stringify(body) });

export function requestWritingHelp(body: {
  kind: HelpKind;
  question?: string;
  thesis?: string;
  heading?: string;
  goal?: string;
  context?: string;
  selection?: string;
  /** For `fix`: the problem a check found and what to do about it. */
  instruction?: string;
  /** For `next`: where this paragraph sits in the essay, how far it has got, and whether it cites anything yet. */
  place?: { index: number; total: number; outline: string[]; words: number; target: number; citations: number };
}) {
  return call<StartHelp | NextHelp | RewriteHelp | CheckHelp>('/help', { method: 'POST', body: JSON.stringify(body) });
}

export function saveEssayPlan(docId: string, plan: EssayPlan) {
  try { localStorage.setItem(PLAN_KEY(docId), JSON.stringify(plan)); } catch { /* storage off: the draft still has its headings */ }
}

export function readEssayPlan(docId: string): EssayPlan | null {
  try {
    const raw = localStorage.getItem(PLAN_KEY(docId));
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (!p || typeof p.thesis !== 'string' || !Array.isArray(p.sections) || p.sections.length === 0) return null;
    return p as EssayPlan;
  } catch {
    return null;
  }
}

export function clearEssayPlan(docId: string) {
  try { localStorage.removeItem(PLAN_KEY(docId)); } catch { /* noop */ }
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** The draft a plan opens with: one heading per section and an empty paragraph to write in. */
export function planToHtml(sections: OutlineSection[], plan?: EssayPlan): string {
  // The outline rides on the first heading, so the draft carries it to other devices.
  const attr = plan ? ` data-essay-plan="${esc(JSON.stringify(plan)).replace(/"/g, '&quot;')}"` : '';
  return sections.map((s, i) => `<h2${i === 0 ? attr : ''}>${esc(s.heading)}</h2><p></p>`).join('');
}

export const countWords = (text: string) => (text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0);

const normHeading = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

/**
 * Words written under each planned heading, read from a draft's saved HTML.
 * The same matching as the outline panel in the editor: headings are found
 * in order, and a section runs until the next planned heading.
 */
export function sectionWords(html: string, sections: OutlineSection[]): number[] {
  let blocks: { heading: boolean; text: string }[] = [];
  try {
    const doc = new DOMParser().parseFromString(html || '', 'text/html');
    blocks = Array.from(doc.body.children).map((el) => ({ heading: /^H[1-6]$/.test(el.tagName), text: el.textContent || '' }));
  } catch {
    return sections.map(() => 0);
  }
  const found: number[] = [];
  let cursor = 0;
  for (const s of sections) {
    let at = -1;
    for (let i = cursor; i < blocks.length; i++) {
      if (blocks[i].heading && normHeading(blocks[i].text) === normHeading(s.heading)) { at = i; break; }
    }
    found.push(at);
    if (at !== -1) cursor = at + 1;
  }
  return sections.map((_, n) => {
    const at = found[n];
    if (at === -1) return 0;
    const nextAt = found.slice(n + 1).find((x) => x !== -1) ?? -1;
    const stop = nextAt === -1 ? blocks.length : nextAt;
    let words = 0;
    for (let i = at + 1; i < stop; i++) words += countWords(blocks[i].text);
    return words;
  });
}

/** A section counts as written at 80% of its target, as in the editor's outline panel. */
export const sectionDone = (words: number, target: number) => words >= Math.max(1, target) * 0.8;

/* ─── Dashboard → "Start an essay" handoff ──────────────────────── */
export const ESSAY_QUESTION_DRAFT_KEY = 'writescholar_essay_question_draft';
const AUTOBUILD_KEY = 'writescholar_essay_autobuild';
export const ESSAY_MIN_WORDS = 300;
export const ESSAY_MAX_WORDS = 10000;

/** Carry a question typed on the dashboard to the Start an essay screen, which builds the outline straight away. */
export function handOffEssayQuestion(question: string, words: number) {
  try {
    sessionStorage.setItem(ESSAY_QUESTION_DRAFT_KEY, question);
    sessionStorage.setItem(AUTOBUILD_KEY, String(words));
  } catch { /* storage off: the screen opens empty */ }
}

/** The length handed over with a question, or null when nothing is waiting. Does not clear it. */
export function peekEssayAutobuild(): number | null {
  try {
    const n = Number(sessionStorage.getItem(AUTOBUILD_KEY));
    return Number.isFinite(n) && n >= ESSAY_MIN_WORDS && n <= ESSAY_MAX_WORDS ? Math.round(n) : null;
  } catch {
    return null;
  }
}

export function clearEssayAutobuild() {
  try { sessionStorage.removeItem(AUTOBUILD_KEY); } catch { /* noop */ }
}

/* ─── The outline, saved inside the draft ───────────────────────── */
/** Parse an outline from its saved JSON; null when it is not a usable plan. */
export function parsePlan(json: string | null | undefined): EssayPlan | null {
  if (!json) return null;
  try {
    const p = JSON.parse(json);
    if (!p || typeof p.thesis !== 'string' || !Array.isArray(p.sections) || p.sections.length === 0) return null;
    return p as EssayPlan;
  } catch {
    return null;
  }
}

/** The outline carried in a draft's saved HTML (see RefAttrs.planData), or null. */
export function planFromHtml(html: string): EssayPlan | null {
  try {
    const el = new DOMParser().parseFromString(html || '', 'text/html').querySelector('[data-essay-plan]');
    return parsePlan(el?.getAttribute('data-essay-plan'));
  } catch {
    return null;
  }
}

/* ─── Rubric from a file ─────────────────────────────────────────── */
/** Most a rubric or brief can be; the outline builder reads this much. */
export const BRIEF_MAX_CHARS = 8000;
const RUBRIC_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  doc: 'application/msword',
  txt: 'text/plain',
};
/** What the file picker offers. */
export const RUBRIC_ACCEPT = '.pdf,.docx,.doc,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,text/plain';

/** Tidy text pulled out of a PDF or Word file: tables leave runs of spaces and blank lines. */
const tidy = (text: string) =>
  text.replace(/\r\n?/g, '\n').replace(/[ \t\u00a0]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim();

/**
 * Read a rubric or assignment brief from a PDF, Word or text file. Text
 * files are read here; PDF and Word go to the server's document parser,
 * which uses no credits. Throws a WritingError with a message to show.
 */
export async function readRubricFile(file: File): Promise<{ text: string; cut: boolean }> {
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  const type = RUBRIC_TYPES[ext];
  if (!type) throw new WritingError('Upload a PDF, Word (.docx) or text file.');
  if (file.size > 10 * 1024 * 1024) throw new WritingError('That file is over 10MB. Upload a smaller file or paste the text.');

  let text = '';
  if (ext === 'txt') {
    text = await file.text();
  } else {
    const form = new FormData();
    // Name the type from the extension: some computers send none, and the parser checks it.
    form.append('file', new File([file], file.name, { type }));
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    let json: { success?: boolean; message?: string; data?: { content?: string } } | null = null;
    try {
      const res = await fetch(`${API_URL}/analysis/parse-document`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      json = await res.json().catch(() => null);
    } catch {
      throw new WritingError('Could not reach WriteScholar. Check your connection and try again.');
    }
    if (!json?.success) {
      throw new WritingError(ext === 'pdf'
        ? 'We could not read text from that PDF. If it is a scan, paste the text instead.'
        : 'We could not read that file. Paste the text instead.');
    }
    text = json.data?.content || '';
  }
  text = tidy(text);
  if (!text) throw new WritingError('That file looks empty. Paste the text instead.');
  return { text: text.slice(0, BRIEF_MAX_CHARS), cut: text.length > BRIEF_MAX_CHARS };
}

/** A working title for a blank draft: the question's first sentence (at most nine words), or "Untitled essay". */
export function blankDraftTitle(question: string): string {
  const flat = question.replace(/\s+/g, ' ').trim();
  if (!flat) return 'Untitled essay';
  // Up to the first full stop, question mark or exclamation mark that ends a sentence.
  const first = flat.match(/^.*?[?.!](?=\s|$)/)?.[0] ?? flat;
  const words = first.replace(/[?.!]+$/, '').split(' ').filter(Boolean);
  const title = words.slice(0, 9).join(' ');
  return title.length > 60 ? `${title.slice(0, 57).trimEnd()}...` : title;
}

/* ─── Answers given in the landing pop-up ───────────────────────── */
const ESSAY_PREFILL_KEY = 'writescholar_essay_prefill';
export interface EssayPrefill { kind: string; cite: string | null; length: number; brief: string }

/** The essay questions answered before sign-up: Start an essay uses them and builds at once. */
export function handOffEssayAnswers(a: EssayPrefill) {
  try { sessionStorage.setItem(ESSAY_PREFILL_KEY, JSON.stringify(a)); } catch { /* the questions are asked again */ }
}
/** Reads and clears it. */
export function takeEssayAnswers(): EssayPrefill | null {
  try {
    const raw = sessionStorage.getItem(ESSAY_PREFILL_KEY);
    sessionStorage.removeItem(ESSAY_PREFILL_KEY);
    const v = raw ? JSON.parse(raw) : null;
    if (!v || typeof v.kind !== 'string' || !Number.isFinite(Number(v.length))) return null;
    return { kind: v.kind, cite: typeof v.cite === 'string' ? v.cite : null, length: Number(v.length), brief: typeof v.brief === 'string' ? v.brief.slice(0, BRIEF_MAX_CHARS) : '' };
  } catch {
    return null;
  }
}

/** "Dec 20" for a reset date, or null. */
export function resetDay(iso?: string | null): string | null {
  const d = iso ? new Date(iso) : null;
  return d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }) : null;
}
