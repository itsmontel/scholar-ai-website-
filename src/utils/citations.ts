/**
 * Reference formatting for sources a student found themselves.
 *
 * No AI and no lookups: the student types the details of a source they have
 * actually read, and this turns them into an in-text citation and a
 * reference-list entry in the chosen style. Nothing here can invent a source.
 *
 * Covers the common cases (book, journal article, web page) in six styles:
 * APA 7, MLA 9, Chicago author-date, Harvard (Cite Them Right), IEEE and
 * Vancouver. APA, MLA, Chicago and Harvard cite by author; IEEE and Vancouver
 * cite by number, in the order sources first appear in the essay. Styles have
 * many edge cases, so the UI tells the student to check the result against
 * their course guide.
 */
export type CiteStyle = 'APA' | 'MLA' | 'Chicago' | 'Harvard' | 'IEEE' | 'Vancouver';
export const CITE_STYLES: CiteStyle[] = ['APA', 'MLA', 'Chicago', 'Harvard', 'IEEE', 'Vancouver'];
export type SourceKind = 'book' | 'journal' | 'website';

export interface Source {
  id: string;
  kind: SourceKind;
  /** One author per line, as "First Last" or "Last, First". */
  authors: string;
  /** True when the author is an organisation, so its name is never split or abbreviated. */
  org: boolean;
  year: string;
  title: string;
  /** Journal name, or the website's name. */
  container: string;
  publisher: string;
  /** City of publication (books). Optional, and printed only by the styles that use it. */
  place?: string;
  volume: string;
  issue: string;
  pages: string;
  url: string;
  /** Date the page was read, as the student wants it shown (e.g. "12 March 2026"). */
  accessed: string;
}

/** A run of text in a formatted reference. */
export interface Seg { text: string; italic?: boolean }

/**
 * What a style needs to know about the other sources in the essay:
 * the number of each source (IEEE and Vancouver), the letter that tells apart
 * two works by the same author in the same year, and the sources whose
 * in-text citation needs a short title to be unambiguous (MLA).
 */
export interface CiteContext {
  numbers?: Map<string, number>;
  suffixes?: Map<string, string>;
  needTitle?: Set<string>;
}

interface Name { first: string; last: string; org: boolean; suffix: string }

export function isCiteStyle(v: unknown): v is CiteStyle {
  return typeof v === 'string' && (CITE_STYLES as string[]).includes(v);
}

/** IEEE and Vancouver cite by number rather than by author. */
export function isNumbered(style: CiteStyle): boolean {
  return style === 'IEEE' || style === 'Vancouver';
}

export function emptySource(kind: SourceKind = 'book'): Source {
  return { id: '', kind, authors: '', org: false, year: '', title: '', container: '', publisher: '', place: '', volume: '', issue: '', pages: '', url: '', accessed: '' };
}

export function newSourceId(): string {
  return `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** One line under the style buttons: what an in-text citation looks like and how the list is ordered. */
export function styleNote(style: CiteStyle): string {
  switch (style) {
    case 'APA': return 'Author and year in brackets, like (Smith, 2020). The list is in alphabetical order.';
    case 'MLA': return 'Author and page in brackets, like (Smith 25). The list is in alphabetical order.';
    case 'Chicago': return 'Chicago 18th edition, author-date: author and year in brackets, like (Smith 2020, 25). The list is in alphabetical order.';
    case 'Harvard': return 'Author and year in brackets, like (Smith, 2020, p. 25). The list is in alphabetical order.';
    case 'IEEE': return 'A number in square brackets, like [1]. Numbers follow the order sources first appear in your essay, and update on their own.';
    case 'Vancouver': return 'A number in round brackets, like (1). Numbers follow the order sources first appear in your essay, and update on their own.';
  }
}

/** A line of help under the title box: how this style capitalises titles. */
export function titleNote(style: CiteStyle): string {
  switch (style) {
    case 'APA': return 'APA uses sentence case: a capital letter on the first word and on names only.';
    case 'Harvard': return 'Harvard uses sentence case: a capital letter on the first word and on names only.';
    case 'Vancouver': return 'Vancouver uses sentence case: a capital letter on the first word and on names only.';
    case 'MLA': return 'MLA capitalises the main words of a title.';
    case 'Chicago': return 'Chicago capitalises the main words of a title.';
    case 'IEEE': return 'IEEE capitalises the first word of an article title, and the main words of a book title.';
  }
}

/* ── Small text helpers ─────────────────────────────────────────── */
const clean = (t: string | undefined | null) => (t ?? '').replace(/\s+/g, ' ').trim();
const stripDot = (t: string) => clean(t).replace(/[.\s]+$/, '');
/** Add a full stop unless the text already ends a sentence ("Title?." never happens). */
const sentence = (t: string) => { const x = clean(t); return !x ? '' : /[.?!]$/.test(x) ? x : `${x}.`; };
/** The full stop that follows a title, or nothing when the title ends in ? or !. */
const endMark = (t: string) => (/[?!]$/.test(t) ? '' : '.');

const SURNAME_PARTICLES = new Set(['du', 'de', 'da', 'das', 'dos', 'do', 'di', 'del', 'della', 'des', 'la', 'le', 'van', 'von', 'der', 'den', 'ter', 'ten', 'bin', 'ibn', 'al', 'el', 'st', 'st.']);
const SUFFIX = /^(jr|sr|ii|iii|iv|2nd|3rd)\.?$/i;
const HONORIFIC = /^(dr|prof|professor|mr|mrs|ms|miss|mx|sir|dame|rev|hon)\.?\s+/i;
const DEGREE = /(?:,\s*|\s+)(?:ph\.?d\.?|d\.?phil\.?|mph|msc|mba|esq\.?)$/i;
/** "Jane Smith, PhD" → "Jane Smith". "MD" is only a degree after a comma, and never when it would leave a single word ("Smith, M.D." can be initials). */
function stripDegrees(raw: string): string {
  let t = raw;
  for (let i = 0; i < 3; i++) {
    const next = t.replace(DEGREE, '').replace(/,\s*(?:MD|M\.D\.)$/, '');
    if (next === t || next.split(/[\s,]+/).filter(Boolean).length < 2) break;
    t = next;
  }
  return t;
}
const suffixText = (x: string) => { const t = x.replace(/\.$/, ''); return /^(jr|sr)$/i.test(t) ? `${t[0].toUpperCase()}${t.slice(1).toLowerCase()}.` : /^[ivx]+$/i.test(t) ? t.toUpperCase() : t; };

/** The authors, one per entry. Splits "A and B" and "A & B" unless the author is an organisation. */
function authorEntries(s: Source): string[] {
  const lines = (s.authors || '').split(/\n|;/);
  const out: string[] = [];
  for (const line of lines) {
    const parts = s.org ? [line] : line.split(/\s+(?:and|&)\s+/i);
    for (const p of parts) {
      const t = clean(p).replace(/^[,\s]+|[,\s]+$/g, '');
      if (t) out.push(t);
    }
  }
  return out;
}

function parseNames(s: Source): Name[] {
  return authorEntries(s).map((entry) => {
    if (s.org) return { first: '', last: entry, org: true, suffix: '' };
    // "Dr Jane Smith, PhD" → "Jane Smith"
    const raw = stripDegrees(entry).replace(HONORIFIC, '').trim() || entry;

    if (raw.includes(',')) {
      const parts = raw.split(',').map(clean).filter(Boolean);
      let suffix = '';
      if (parts.length >= 3 && SUFFIX.test(parts[parts.length - 1])) suffix = parts.pop() as string;
      const [last, ...rest] = parts;
      return { first: rest.join(' '), last, org: false, suffix };
    }
    const tokens = raw.split(' ').filter(Boolean);
    let suffix = '';
    if (tokens.length > 2 && SUFFIX.test(tokens[tokens.length - 1])) suffix = tokens.pop() as string;
    if (tokens.length === 1) return { first: '', last: tokens[0], org: false, suffix };
    // "W. E. B. Du Bois", "Vincent van Gogh", "Mary de la Cruz": the particles
    // before the final word belong to the surname.
    let cut = tokens.length - 1;
    while (cut > 1 && SURNAME_PARTICLES.has(tokens[cut - 1].toLowerCase())) cut--;
    return { first: tokens.slice(0, cut).join(' '), last: tokens.slice(cut).join(' '), org: false, suffix };
  });
}

/** Whether the authors box looks wrong, so the form can say so before a bad reference is made. */
export function authorProblem(s: Source): string | null {
  if (s.org) return null;
  if (/\bet\.? al\b/i.test(s.authors || '')) return 'Type each author out. WriteScholar adds "et al." where the style needs it.';
  for (const entry of authorEntries(s)) {
    const t = stripDegrees(entry);
    const commas = (t.match(/,/g) || []).length;
    const parts = t.split(',').map(clean).filter(Boolean);
    const hasSuffix = parts.length >= 3 && SUFFIX.test(parts[parts.length - 1]);
    if (commas > 1 && !hasSuffix) return 'Put each author on their own line.';
  }
  return null;
}

/* Initials. A name is a list of units; a unit is one initial, or two for "Jean-Paul". */
function initialUnits(first: string): string[][] {
  const letter = (t: string) => {
    const m = t.match(/\p{L}/u);
    return m ? m[0].toUpperCase() : '';
  };
  const units: string[][] = [];
  for (const tok of clean(first).split(' ').filter(Boolean)) {
    const segs = tok.split(/[-‐‑–]/).filter(Boolean);
    if (segs.length > 1) {
      const u = segs.map(letter).filter(Boolean);
      if (u.length) units.push(u);
    } else if (/^(\p{L}\.){2,}$/u.test(tok) || /^\p{Lu}{2,3}$/u.test(tok)) {
      // "W.E.B." and "JK" are several initials, not one.
      for (const ch of tok.replace(/\./g, '')) units.push([ch.toUpperCase()]);
    } else {
      const l = letter(tok);
      if (l) units.push([l]);
    }
  }
  return units;
}
/** "W. E. B." / "J.-P." (APA, IEEE) */
const initialsSpaced = (first: string) => initialUnits(first).map((u) => u.map((l) => `${l}.`).join('-')).join(' ');
/** "W.E.B." / "J.-P." (Harvard) */
const initialsTight = (first: string) => initialUnits(first).map((u) => u.map((l) => `${l}.`).join('-')).join('');
/** "WEB" / "JP" (Vancouver) */
const initialsBare = (first: string) => initialUnits(first).map((u) => u.join('')).join('');

/** "A", "A and B", "A, B, and C": `oxford` puts a comma before the final joiner. */
function joinList(items: string[], joiner: string, oxford: boolean): string {
  if (items.length <= 1) return items[0] ?? '';
  if (items.length === 2) return `${items[0]} ${joiner} ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}${oxford ? ',' : ''} ${joiner} ${items[items.length - 1]}`;
}

/* ── Year, dates, links, pages ──────────────────────────────────── */
/** The year as it is printed, before any a/b letter: "1995", "n.d." or "in press". */
export function yearBase(s: Source): string {
  const y = clean(s.year);
  if (!y) return 'n.d.';
  if (/^n\.?\s?d\.?$/i.test(y)) return 'n.d.';
  const m = y.match(/^(\d{4})[a-z]?$/i);
  if (m) return m[1];
  if (/^in press$/i.test(y)) return 'in press';
  return y;
}
const hasYear = (s: Source) => yearBase(s) !== 'n.d.';

function yearLabel(s: Source, ctx?: CiteContext, style?: CiteStyle): string {
  // Cite Them Right (Harvard) writes "no date" where the others write "n.d.".
  const base = style === 'Harvard' && yearBase(s) === 'n.d.' ? 'no date' : yearBase(s);
  const suf = ctx?.suffixes?.get(s.id) || '';
  if (!suf) return base;
  if (/^\d{4}$/.test(base)) return `${base}${suf}`;
  return base === 'no date' ? `${base} ${suf}` : `${base}-${suf}`;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MLA_MONTHS = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'June', 'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'];
const IEEE_MONTHS = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.'];
const VAN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface ParsedDate { y: number; m?: number; d?: number }

function monthIndex(tok: string): number {
  const t = tok.toLowerCase().replace(/\.$/, '');
  if (t.length < 3) return -1;
  // The full name, or its first three or four letters ("Mar", "Sept").
  return MONTHS.findIndex((m) => { const l = m.toLowerCase(); return l === t || (t.length <= 4 && l.startsWith(t)); });
}

function validDay(y: number, m: number, d: number) {
  const dim = [31, (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return d >= 1 && d <= dim[m];
}

/** Read a date a student typed ("12 March 2026", "March 12, 2026", "2026-03-12"). Null when it is not a date we are sure of. */
function parseDate(raw: string): ParsedDate | null {
  const t = clean(raw).replace(/,/g, ' ').replace(/\s+/g, ' ');
  let m: RegExpMatchArray | null;
  if ((m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/))) {
    const y = +m[1], mo = +m[2] - 1, d = +m[3];
    return mo >= 0 && mo < 12 && validDay(y, mo, d) ? { y, m: mo, d } : null;
  }
  if ((m = t.match(/^(\d{1,2})(?:st|nd|rd|th)? ([A-Za-z]+\.?) (\d{4})$/))) {
    const mo = monthIndex(m[2]), y = +m[3], d = +m[1];
    return mo >= 0 && validDay(y, mo, d) ? { y, m: mo, d } : null;
  }
  if ((m = t.match(/^([A-Za-z]+\.?) (\d{1,2})(?:st|nd|rd|th)? (\d{4})$/))) {
    const mo = monthIndex(m[1]), y = +m[3], d = +m[2];
    return mo >= 0 && validDay(y, mo, d) ? { y, m: mo, d } : null;
  }
  if ((m = t.match(/^([A-Za-z]+\.?) (\d{4})$/))) {
    const mo = monthIndex(m[1]);
    return mo >= 0 ? { y: +m[2], m: mo } : null;
  }
  if ((m = t.match(/^(\d{4})$/))) return { y: +m[1] };
  return null;
}

/** The date the page was read, written the way the style writes dates. Left as typed when it cannot be read. */
export function formatAccessed(raw: string, style: CiteStyle): string {
  const typed = clean(raw);
  if (!typed) return '';
  const p = parseDate(typed);
  if (!p) return typed;
  const { y, m, d } = p;
  if (style === 'MLA') return m === undefined ? `${y}` : d === undefined ? `${MLA_MONTHS[m]} ${y}` : `${d} ${MLA_MONTHS[m]} ${y}`;
  if (style === 'IEEE') return m === undefined ? `${y}` : d === undefined ? `${IEEE_MONTHS[m]} ${y}` : `${IEEE_MONTHS[m]} ${d}, ${y}`;
  if (style === 'Vancouver') return m === undefined ? `${y}` : d === undefined ? `${y} ${VAN_MONTHS[m]}` : `${y} ${VAN_MONTHS[m]} ${d}`;
  if (style === 'Chicago') return m === undefined ? `${y}` : d === undefined ? `${MONTHS[m]} ${y}` : `${MONTHS[m]} ${d}, ${y}`;
  return m === undefined ? `${y}` : d === undefined ? `${MONTHS[m]} ${y}` : `${d} ${MONTHS[m]} ${y}`;
}

/** A DOI or web address in the form every style prints: https://doi.org/10.… or https://… */
export function normaliseLink(raw: string): string {
  let u = clean(raw).replace(/[.,;]+$/, '');
  if (!u) return '';
  const doi = u.match(/^(?:doi:\s*|https?:\/\/(?:dx\.)?doi\.org\/)?(10\.\d{4,9}\/\S+)$/i);
  if (doi) return `https://doi.org/${doi[1]}`;
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(u) && /^[^\s/]+\.[^\s/]+/.test(u) && !/\s/.test(u)) u = `https://${u}`;
  return u;
}
const doiOf = (url: string) => { const m = url.match(/^https:\/\/doi\.org\/(10\..+)$/); return m ? m[1] : ''; };

/**
 * Chicago shortens the second number of a page range (Chicago Manual of Style
 * 9.61): 3–10, 71–72, 96–117, 100–104, 107–8, 321–28, 505–17, 1002–6, 1087–89.
 * It only shortens when nothing above the last two digits changes; otherwise
 * the full number is printed (498–532, 1496–1500), which is never wrong.
 */
function chicagoShorten(a: number, b: number): string {
  if (!(b > a)) return `${a}–${b}`;
  const first = String(a), second = String(b);
  if (a < 100 || a % 100 === 0 || first.length !== second.length) return `${a}–${b}`;
  let i = 0;
  while (i < first.length && first[i] === second[i]) i++;
  if (i < first.length - 2) return `${a}–${b}`;
  const keep = Math.max(second.length - i, a % 100 < 10 ? 1 : 2);
  return `${a}–${second.slice(second.length - keep)}`;
}
const shortenChicago = (t: string) => t.replace(/\b(\d+)–(\d+)\b/g, (_m, x, y) => chicagoShorten(+x, +y));

/** Page ranges: "69-102" → "69–102", "xii-xiv" → "xii–xiv". `hyphen` keeps a plain hyphen (Vancouver). */
function pageRange(p: string, hyphen = false): string {
  const dash = hyphen ? '-' : '–';
  const t = clean(p);
  if (/^[ivxlcdm]+\s*[-‐‑‒–—]\s*[ivxlcdm]+$/i.test(t)) return t.replace(/\s*[-‐‑‒–—]\s*/, dash);
  return t.replace(/(\d)\s*[-‐‑‒–—]\s*(?=\d)/g, `$1${dash}`);
}
const chicagoPages = (p: string) => shortenChicago(pageRange(p));

interface Locator { text: string; plural: boolean; raw: boolean }
/** A page or other locator typed for one citation: "25", "25-27", "para. 4". */
function locator(p: string, hyphen = false, chicago = false): Locator | null {
  const t = chicago ? chicagoPages(p) : pageRange(p, hyphen);
  if (!t) return null;
  const roman = /^[ivxlcdm]+(?:[-–][ivxlcdm]+)?$/i.test(t);
  const raw = /^[A-Za-z]/.test(t) && !roman;
  return { text: t, plural: /[–,&]|\band\b|-/.test(t), raw };
}

/* ── Titles and ordering ────────────────────────────────────────── */
const sortTitle = (t: string) => clean(t).toLowerCase().replace(/^(the|a|an)\s+/, '');
/** Letter by letter, ignoring spaces and punctuation, as APA, MLA and Chicago alphabetise. */
const letters = new Intl.Collator('en', { sensitivity: 'base', ignorePunctuation: true });
const byWords = new Intl.Collator('en', { sensitivity: 'base', numeric: true });

interface SortKey { last: string; first: string }
function authorKeys(s: Source): SortKey[] {
  const names = parseNames(s);
  return names.length ? names.map((n) => ({ last: n.last, first: n.first })) : [{ last: sortTitle(s.title), first: '' }];
}
const yearNumber = (s: Source) => { const m = yearBase(s).match(/^\d{4}/); return m ? +m[0] : -1; };

/**
 * Alphabetical order for the reference list: author, then year, then title.
 * "Smith, J." comes before "Smithers" (nothing before something), and one
 * author sorts before several who share the same first author.
 */
export function compareSources(a: Source, b: Source): number {
  const ka = authorKeys(a), kb = authorKeys(b);
  const n = Math.min(ka.length, kb.length);
  for (let i = 0; i < n; i++) {
    const c = letters.compare(ka[i].last, kb[i].last) || byWords.compare(ka[i].first, kb[i].first);
    if (c) return c;
  }
  if (ka.length !== kb.length) return ka.length - kb.length;
  const y = yearNumber(a) - yearNumber(b);
  if (y) return y;
  return byWords.compare(sortTitle(a.title), sortTitle(b.title));
}

/** The title cut down for an in-text citation when there is no author (or MLA needs it to tell two works apart). */
function shortTitle(s: Source): string {
  const full = stripDot(s.title);
  const main = full.split(/\s*[:—]\s*/)[0] || full;
  const words = main.split(' ');
  if (words.length <= 4) return main;
  const cut = words.slice(0, 4);
  // Never stop on "of", "the" and the like.
  while (cut.length > 1 && TITLE_STOP.has(cut[cut.length - 1].toLowerCase())) cut.pop();
  return cut.join(' ');
}
const TITLE_STOP = new Set(['a', 'an', 'the', 'of', 'in', 'on', 'at', 'to', 'for', 'and', 'or', 'but', 'with', 'by', 'from', 'as', 'is', 'are', 'that', 'how', 'why', 'what']);
/** Books and reports are italic in print; plain text cannot be, so only articles and pages are quoted. */
const quoted = (s: Source, q: [string, string], text: string) => (s.kind === 'book' ? text : `${q[0]}${text}${q[1]}`);

/* ── Context: numbers and a/b letters ───────────────────────────── */
/**
 * Work out what a source needs to know about the others. `citedOrder` is the
 * ids of the sources in the order they first appear in the essay.
 */
export function buildContext(sources: Source[], style: CiteStyle, citedOrder: string[] = []): CiteContext {
  if (isNumbered(style)) {
    const numbers = new Map<string, number>();
    let n = 0;
    const known = new Set(sources.map((s) => s.id));
    for (const id of citedOrder) if (known.has(id) && !numbers.has(id)) numbers.set(id, ++n);
    for (const s of sources) if (!numbers.has(s.id)) numbers.set(s.id, ++n);
    return { numbers };
  }
  const groups = new Map<string, Source[]>();
  for (const s of sources) {
    const key = style === 'MLA' ? whoText(s, style) : `${whoText(s, style)}|${yearBase(s)}`;
    const g = groups.get(key);
    if (g) g.push(s); else groups.set(key, [s]);
  }
  const suffixes = new Map<string, string>();
  const needTitle = new Set<string>();
  groups.forEach((g) => {
    if (g.length < 2) return;
    if (style === 'MLA') { g.forEach((s) => needTitle.add(s.id)); return; }
    [...g].sort(compareSources).forEach((s, i) => suffixes.set(s.id, String.fromCharCode(97 + (i % 26)).repeat(Math.floor(i / 26) + 1)));
  });
  return { suffixes, needTitle };
}

/* ── In-text citations ──────────────────────────────────────────── */
/** The author part of an in-text citation, in the style's own wording. */
/** MLA: a web page whose author is the website itself starts with its title, so it is cited by title. */
function authorIsSite(s: Source, names: Name[]): boolean {
  if (s.kind !== 'website' || names.length !== 1 || names[0].first) return false;
  return stripDot(names[0].last).toLowerCase() === stripDot(s.container).toLowerCase() && stripDot(s.container) !== '';
}

const SMALL_WORDS = new Set(['a', 'an', 'the', 'and', 'but', 'or', 'nor', 'for', 'so', 'yet', 'as', 'at', 'by', 'in', 'of', 'off', 'on', 'per', 'to', 'up', 'via']);
/** APA cites a title in the text in title case, even though the reference list uses sentence case. */
function titleCase(t: string): string {
  const words = t.split(' ');
  return words.map((w, i) => {
    const small = i > 0 && i < words.length - 1 && SMALL_WORDS.has(w.toLowerCase());
    return small ? w : w.replace(/^(\p{Ll})/u, (c) => c.toUpperCase());
  }).join(' ');
}

function whoText(s: Source, style: CiteStyle, ctx?: CiteContext): string {
  const parsed = parseNames(s);
  const lasts = (style === 'MLA' && authorIsSite(s, parsed) ? [] : parsed).map((n) => n.last);
  if (lasts.length === 0) {
    const t = style === 'APA' ? titleCase(shortTitle(s)) : shortTitle(s);
    if (style === 'APA') return quoted(s, ['"', '"'], t);
    if (style === 'Harvard') return quoted(s, ["'", "'"], t);
    return quoted(s, ['"', '"'], t);
  }
  let who: string;
  if (style === 'APA') who = lasts.length === 1 ? lasts[0] : lasts.length === 2 ? `${lasts[0]} & ${lasts[1]}` : `${lasts[0]} et al.`;
  else if (style === 'MLA') who = lasts.length <= 2 ? joinList(lasts, 'and', false) : `${lasts[0]} et al.`;
  else if (style === 'Harvard') who = lasts.length <= 3 ? joinList(lasts, 'and', false) : `${lasts[0]} et al.`;
  // Chicago 18: three or more authors are cited by the first and et al.
  else who = lasts.length <= 2 ? joinList(lasts, 'and', false) : `${lasts[0]} et al.`;
  // MLA: two works by the same author are told apart by a short title.
  if (style === 'MLA' && ctx?.needTitle?.has(s.id)) who = `${who}, ${quoted(s, ['"', '"'], shortTitle(s))}`;
  return who;
}

export function inTextCitation(s: Source, style: CiteStyle, page = '', ctx?: CiteContext): string {
  const loc = locator(page, style === 'Vancouver', style === 'Chicago');

  if (isNumbered(style)) {
    const n = ctx?.numbers?.get(s.id);
    const num = n === undefined ? '?' : String(n);
    // IEEE uses square brackets; Vancouver uses round ones (ICMJE: "Arabic numerals in parentheses").
    const [open, close] = style === 'IEEE' ? ['[', ']'] : ['(', ')'];
    if (!loc) return `${open}${num}${close}`;
    return `${open}${num}, ${loc.raw ? loc.text : `${loc.plural ? 'pp.' : 'p.'} ${loc.text}`}${close}`;
  }

  const who = whoText(s, style, ctx);
  const y = yearLabel(s, ctx, style);
  const noAuthor = parseNames(s).length === 0;
  const pg = loc ? (loc.raw ? loc.text : `${loc.plural ? 'pp.' : 'p.'} ${loc.text}`) : '';

  if (style === 'MLA') return `(${who}${loc ? ` ${loc.text}` : ''})`;
  if (style === 'Chicago') return `(${who} ${y}${loc ? `, ${loc.text}` : ''})`;
  if (style === 'Harvard') return `(${who}, ${y}${pg ? `, ${pg}` : ''})`;
  // APA: with no author, the comma after a quoted title goes inside the quotes.
  if (noAuthor && s.kind !== 'book') return `(${who.slice(0, -1)},${who.slice(-1)} ${y}${pg ? `, ${pg}` : ''})`;
  return `(${who}, ${y}${pg ? `, ${pg}` : ''})`;
}

/* ── Author lists for the reference list ────────────────────────── */
function authorsApa(names: Name[]): string {
  const f = names.map((n) => {
    if (n.org || !n.first) return n.last;
    return `${n.last}, ${initialsSpaced(n.first)}${n.suffix ? `, ${suffixText(n.suffix)}` : ''}`;
  });
  if (f.length <= 1) return f[0] ?? '';
  if (f.length > 20) return `${f.slice(0, 19).join(', ')}, … ${f[f.length - 1]}`;
  return `${f.slice(0, -1).join(', ')}, & ${f[f.length - 1]}`;
}
function authorsHarvard(names: Name[]): string {
  const f = names.map((n) => (n.org || !n.first ? n.last : `${n.last}, ${initialsTight(n.first)}${n.suffix ? `, ${suffixText(n.suffix)}` : ''}`));
  return joinList(f, 'and', false);
}
/** First author inverted, the rest in normal order (MLA and Chicago). */
function authorsInverted(names: Name[], style: 'MLA' | 'Chicago'): string {
  if (names.length === 0) return '';
  const full = (n: Name, invert: boolean) => {
    if (n.org || !n.first) return n.last;
    const suffix = n.suffix ? `, ${suffixText(n.suffix)}` : '';
    return invert ? `${n.last}, ${n.first}${suffix}` : `${n.first} ${n.last}${suffix.replace(/^,/, '')}`;
  };
  if (style === 'MLA' && names.length >= 3) return `${full(names[0], true)}, et al`;
  // Chicago 18 lists up to six authors; with more, the first three then et al.
  if (style === 'Chicago' && names.length > 6) return `${names.slice(0, 3).map((n, i) => full(n, i === 0)).join(', ')}, et al`;
  const list = names.map((n, i) => full(n, i === 0));
  // Two authors still take a comma after the inverted first name: "Poll, Ryan, and Anna Smith".
  if (list.length === 2) return `${list[0]}, and ${list[1]}`;
  return joinList(list, 'and', true);
}
function authorsIeee(names: Name[]): string {
  // More than six authors: the first, then et al.
  const use = names.length > 6 ? names.slice(0, 1) : names;
  const f = use.map((n) => (n.org || !n.first ? n.last : `${initialsSpaced(n.first)} ${n.last}${n.suffix ? ` ${suffixText(n.suffix)}` : ''}`));
  if (names.length > 6) return `${f[0]} et al.`;
  return joinList(f, 'and', true);
}
function authorsVancouver(names: Name[]): string {
  const f = names.map((n) => (n.org || !n.first ? n.last : `${n.last} ${initialsBare(n.first)}${n.suffix ? ` ${suffixText(n.suffix).replace(/\.$/, '')}` : ''}`));
  if (f.length > 6) return `${f.slice(0, 6).join(', ')}, et al.`;
  return f.join(', ');
}

/** MLA writes "University Press" as "UP". */
const mlaPublisher = (p: string) => p.replace(/\bUniversity Press\b/g, 'UP');

/* ── Reference-list entries ─────────────────────────────────────── */
/** The number in front of a reference in IEEE and Vancouver. Other styles have none. */
export function referenceLabel(style: CiteStyle, n: number): string {
  return style === 'IEEE' ? `[${n}] ` : style === 'Vancouver' ? `${n}. ` : '';
}

/** The heading of the reference list in each style. */
export function listHeading(style: CiteStyle): string {
  return style === 'MLA' ? 'Works Cited' : style === 'Harvard' ? 'Reference list' : 'References';
}

class Builder {
  segs: Seg[] = [];
  t(text: string) { if (text) this.segs.push({ text }); return this; }
  i(text: string) { if (text) this.segs.push({ text, italic: true }); return this; }
}

export function formatReference(s: Source, style: CiteStyle, ctx?: CiteContext): Seg[] {
  const names = parseNames(s);
  const o = new Builder();
  const title = stripDot(s.title);
  const container = stripDot(s.container);
  const publisher = stripDot(s.publisher);
  const place = stripDot(s.place || '');
  const link = normaliseLink(s.url);
  const vol = clean(s.volume);
  const issue = clean(s.issue);
  const y = yearLabel(s, ctx, style);
  const dated = hasYear(s);
  const pages = style === 'Chicago' ? chicagoPages(s.pages) : pageRange(s.pages, style === 'Vancouver');
  const pp = /[–,-]/.test(pages) ? 'pp.' : 'p.';
  const accessed = formatAccessed(s.accessed, style);

  if (style === 'APA') {
    const a = authorsApa(names);
    const sameAsAuthor = !!a && !!container && stripDot(a).toLowerCase() === container.toLowerCase();
    if (a) o.t(`${sentence(a)} (${y}). `);
    if (s.kind === 'journal') {
      o.t(`${sentence(title)} `);
      if (!a) o.t(`(${y}). `);
      // APA italicises the journal, the comma and the volume together.
      if (vol) { o.i(`${container}, ${vol}`); if (issue) o.t(`(${issue})`); }
      else { o.i(container); if (issue) o.t(`, (${issue})`); }
      if (pages) o.t(`, ${pages}`);
      o.t('.');
    } else {
      o.i(title);
      o.t(`${endMark(title)} `);
      if (!a) o.t(`(${y}). `);
      if (s.kind === 'book' && publisher) o.t(sentence(publisher));
      if (s.kind === 'website' && container && !sameAsAuthor) o.t(sentence(container));
    }
    if (link) o.t(` ${link}`);
    return tidy(o.segs);
  }

  if (style === 'Harvard') {
    const a = authorsHarvard(names);
    if (a) o.t(`${a} (${y}) `);
    if (s.kind === 'journal') {
      o.t(`'${title}'`);
      if (a) o.t(', '); else o.t(` (${y}) `);
      o.i(container);
      if (vol) o.t(`, ${vol}${issue ? `(${issue})` : ''}`);
      if (pages) o.t(`, ${pp} ${pages}`);
      o.t('.');
    } else {
      o.i(title);
      // With no author the year follows the title and no full stop comes between them.
      if (a) o.t(`${endMark(title)} `); else o.t(` (${y}) `);
      if (s.kind === 'book' && (publisher || place)) o.t(`${place ? `${place}: ` : ''}${publisher}.`.replace(/: \.$/, '.'));
    }
    if (link) o.t(` Available at: ${link}${accessed && s.kind === 'website' ? ` (Accessed: ${accessed})` : ''}.`);
    return tidy(o.segs);
  }

  if (style === 'MLA') {
    const a = authorsInverted(names, 'MLA');
    if (a && !authorIsSite(s, names)) o.t(`${sentence(a)} `);
    if (s.kind === 'book') {
      o.i(title);
      o.t(endMark(title));
      const tail = [mlaPublisher(publisher), dated ? y : ''].filter(Boolean).join(', ');
      if (tail) o.t(` ${tail}.`);
    } else {
      o.t(`"${sentence(title)}" `);
      const tail = [
        vol && `vol. ${vol}`,
        issue && `no. ${issue}`,
        dated && y,
        pages && `${pp} ${pages}`,
        link,
      ].filter(Boolean) as string[];
      if (container) { o.i(container); if (tail.length) o.t(', '); }
      o.t(tail.join(', '));
      if (container || tail.length) o.t('.');
      if (s.kind === 'website' && accessed) o.t(` Accessed ${accessed}.`);
    }
    return tidy(o.segs);
  }

  if (style === 'Chicago') {
    const a = authorsInverted(names, 'Chicago');
    if (a) o.t(`${sentence(a)} ${sentence(y)} `);
    if (s.kind === 'book') {
      o.i(title);
      o.t(`${endMark(title)} `);
      if (!a) o.t(`${sentence(y)} `);
      if (publisher || place) o.t(`${place ? `${place}: ` : ''}${publisher}.`.replace(/: \.$/, '.'));
    } else {
      o.t(`"${sentence(title)}" `);
      if (!a) o.t(`${sentence(y)} `);
      if (s.kind === 'journal') {
        o.i(container);
        if (vol) o.t(` ${vol}`);
        if (issue) o.t(` (${issue})`);
        if (pages) o.t(`: ${pages}`);
        o.t('.');
      } else if (container && !authorIsSite(s, names)) {
        o.t(sentence(container));
      }
    }
    // Chicago asks for the date the page was read only when the page has no date of its own.
    if (s.kind === 'website' && !dated && accessed) o.t(` Accessed ${accessed}.`);
    if (link) o.t(` ${link}.`);
    return tidy(o.segs);
  }

  if (style === 'IEEE') {
    const a = authorsIeee(names);
    if (s.kind === 'book') {
      if (a) o.t(`${a}, `);
      o.i(title);
      o.t(endMark(title));
      const where = place ? (publisher ? `${place}: ${publisher}` : place) : publisher;
      const tail = [where, dated ? y : ''].filter(Boolean).join(', ');
      if (tail) o.t(` ${tail}.`);
    } else if (s.kind === 'journal') {
      if (a) o.t(`${a}, `);
      o.t(/[?!.]$/.test(title) ? `"${title}" ` : `"${title}," `);
      const doi = doiOf(link);
      const tail = [
        vol && `vol. ${vol}`,
        issue && `no. ${issue}`,
        pages && `${pp} ${pages}`,
        dated && y,
        doi && `doi: ${doi}`,
      ].filter(Boolean) as string[];
      o.i(container);
      if (tail.length) o.t(`, ${tail.join(', ')}`);
      o.t('.');
      if (link && !doi) o.t(` [Online]. Available: ${link}`);
    } else {
      if (a) o.t(`${sentence(a)} `);
      o.t(`"${sentence(title)}" `);
      if (container) o.t(sentence(container));
      if (accessed) o.t(`${container ? ' ' : ''}Accessed: ${accessed}.`);
      if (link) o.t(`${container || accessed ? ' ' : ''}[Online]. Available: ${link}`);
    }
    return tidy(o.segs);
  }

  // Vancouver
  const a = authorsVancouver(names);
  const head = a ? `${sentence(a)} ` : '';
  if (s.kind === 'book') {
    o.t(`${head}${sentence(title)}`);
    const where = place && publisher ? `${place}: ${publisher}` : publisher || place;
    const tail = [where, dated ? y : '[date unknown]'].filter(Boolean).join('; ');
    if (tail) o.t(` ${tail}.`);
  } else if (s.kind === 'journal') {
    o.t(`${head}${sentence(title)} ${sentence(container)}`);
    const cite = `${dated ? y : '[date unknown]'}${vol ? `;${vol}` : ''}${issue ? `(${issue})` : ''}${pages ? `:${pages}` : ''}`;
    if (cite) o.t(` ${cite}.`);
    const doi = doiOf(link);
    if (doi) o.t(` doi: ${doi}.`);
    else if (link) o.t(` Available from: ${link}`);
  } else {
    o.t(`${head}${stripDot(title)} [Internet]. `);
    const pub = [container, dated ? y : ''].filter(Boolean).join('; ');
    const cited = accessed ? `[cited ${accessed}]` : '';
    const both = [pub, cited].filter(Boolean).join(' ');
    if (both) o.t(`${both}. `);
    if (link) o.t(`Available from: ${link}`);
  }
  return tidy(o.segs);
}

/** Tidy the ends and collapse runs of spaces left by missing fields. */
function tidy(segs: Seg[]): Seg[] {
  const joined = segs.filter((s) => s.text);
  joined.forEach((s, i) => {
    s.text = s.text.replace(/\s{2,}/g, ' ');
    if (i > 0 && /\s$/.test(joined[i - 1].text)) s.text = s.text.replace(/^\s+/, '');
  });
  if (joined.length) {
    joined[0].text = joined[0].text.replace(/^\s+/, '');
    joined[joined.length - 1].text = joined[joined.length - 1].text.replace(/\s+$/, '');
  }
  return joined.filter((s) => s.text);
}

export const referenceText = (s: Source, style: CiteStyle, ctx?: CiteContext) => formatReference(s, style, ctx).map((x) => x.text).join('');

/** Two entries describing the same work: same title, year and first author. */
export function sameSource(a: Source, b: Source): boolean {
  const norm = (t: string) => clean(t).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  const first = (x: Source) => { const k = authorKeys(x)[0]; return norm(`${k.last} ${k.first}`); };
  return norm(a.title) === norm(b.title) && yearBase(a) === yearBase(b) && first(a) === first(b);
}

/** What a source needs before it can be cited. */
export function sourceProblem(s: Source): string | null {
  if (!clean(s.title)) return 'Add the title.';
  if (s.kind === 'journal' && !clean(s.container)) return 'Add the name of the journal.';
  if (s.kind === 'website' && !clean(s.url)) return 'Add the web address.';
  const y = clean(s.year);
  if (y && !/^(\d{4}[a-z]?|n\.?\s?d\.?|in press)$/i.test(y)) return 'Write the year as four digits, like 2020. Leave it empty if the source has none.';
  return authorProblem(s);
}
