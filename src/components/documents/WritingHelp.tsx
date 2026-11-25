import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { Editor } from '@tiptap/react';
import { BTN_GREEN, BTN_PURPLE, BTN_WHITE, FONT } from '../landing/webStyle';
import { trackEvent } from '../../utils/analytics';
import {
  CHECK_MAX_WORDS,
  CHECK_MIN_WORDS,
  GRADE_READY_SHARE,
  WritingError,
  countWords,
  fetchWritingUsage,
  requestWritingHelp,
  type CheckHelp,
  type EssayPlan,
  type NextHelp,
  type RewriteHelp,
  type StartHelp,
  type WritingUsage,
  resetDay,
} from '../../utils/essayPlan';

/**
 * Help while writing, in two parts:
 *
 *  - WritingHelpRail sits beside a draft that was started from an outline. It
 *    shows each part, what it should do and how far along it is, offers an
 *    opening sentence or questions for the part being written, and checks a
 *    written part against its goal. The full grade is for a finished draft;
 *    the check is what an unfinished one gets.
 *  - SelectionHelp appears over any selected passage and offers a clearer,
 *    shorter or more formal version, with the reason for the change.
 *
 * Nothing is put into the essay unless the student chooses it.
 */

interface SectionState {
  /** Position of the heading node, or -1 when the heading is no longer in the draft. */
  headingPos: number;
  /** Where the section's content ends (start of the next heading, or the end of the draft). */
  end: number;
  /** Position of a trailing empty paragraph to write into, or -1. */
  emptyParaPos: number;
  words: number;
}

/** Words a paragraph needs before help changes from "how to open it" to "what to write next". */
const STARTED_WORDS = 8;

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

/** Match each planned heading to its heading in the draft, in order, and measure what is under it. */
function readSections(editor: Editor, plan: EssayPlan): SectionState[] {
  const blocks: { pos: number; size: number; heading: boolean; text: string }[] = [];
  editor.state.doc.forEach((node, pos) => {
    blocks.push({ pos, size: node.nodeSize, heading: node.type.name === 'heading', text: node.textContent });
  });
  const docEnd = editor.state.doc.content.size;
  const found: number[] = [];
  let cursor = 0;
  for (const s of plan.sections) {
    let at = -1;
    for (let i = cursor; i < blocks.length; i++) {
      if (blocks[i].heading && norm(blocks[i].text) === norm(s.heading)) { at = i; break; }
    }
    found.push(at);
    if (at !== -1) cursor = at + 1;
  }
  return plan.sections.map((_, n) => {
    const at = found[n];
    if (at === -1) return { headingPos: -1, end: docEnd, emptyParaPos: -1, words: 0 };
    const nextAt = found.slice(n + 1).find((x) => x !== -1) ?? -1;
    const stop = nextAt === -1 ? blocks.length : nextAt;
    let words = 0;
    for (let i = at + 1; i < stop; i++) words += countWords(blocks[i].text);
    const last = blocks[stop - 1];
    const emptyParaPos = stop - 1 > at && !last.heading && last.text.trim() === '' ? last.pos : -1;
    return { headingPos: blocks[at].pos, end: nextAt === -1 ? docEnd : blocks[nextAt].pos, emptyParaPos, words };
  });
}

const spinner = (
  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity={0.3} strokeWidth={3} />
    <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth={3} strokeLinecap="round" />
  </svg>
);
const tick = (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12l5 5L20 7" /></svg>
);

function LimitNote({ error, onUpgrade, source }: { error: { message: string; upgrade: boolean }; onUpgrade: (source?: string) => void; source: string }) {
  return (
    <div role="alert" className="flex flex-col gap-2 rounded-2xl border-2 border-[#F87171] bg-[#FEE2E2] p-3 text-[14px] font-extrabold leading-[1.4] text-[#991B1B]">
      {error.message}
      {error.upgrade && (
        <button type="button" onClick={() => onUpgrade(source)} className={`${BTN_GREEN} min-h-[44px] self-start rounded-xl px-4 text-[14.5px]`}>See Pro</button>
      )}
    </div>
  );
}

const VERDICT: Record<CheckHelp['verdict'], { label: string; tone: string }> = {
  on_track: { label: 'On track', tone: 'bg-[#E6F9D2] text-[#14532D]' },
  nearly: { label: 'Nearly there', tone: 'bg-[#FFF1C2] text-[#6B4E00]' },
  needs_work: { label: 'Needs work', tone: 'bg-[#FFE4D6] text-[#9A3412]' },
};

/* ── Finding a check's quote in the essay ───────────────────────── */
interface Spot {
  /** The quoted words. */
  from: number;
  to: number;
  /** The whole sentence around them, which "Fix it for me" rewrites. */
  sentFrom: number;
  sentTo: number;
  sentence: string;
}

const SENT_START = /[.!?]["'”’)\]]*\s+/g;
const SENT_END = /[.!?]["'”’)\]]*(?=\s|$)/g;

/**
 * Where a quoted phrase is in the essay, and the sentence around it. When it
 * appears more than once, the copy nearest `near` wins. Spaces are compared
 * loosely and case is ignored, so a quote still matches after small edits
 * elsewhere in the sentence.
 */
function locate(editor: Editor, quote: string, near: number): Spot | null {
  const want = quote.replace(/\s+/g, ' ').trim().toLowerCase();
  if (!want) return null;
  let best: Spot | null = null;
  let bestDist = Infinity;
  editor.state.doc.descendants((node, pos) => {
    if (!node.isTextblock) return true;
    let text = '';
    const at: number[] = [];
    node.forEach((child, offset) => {
      if (child.isText && child.text) {
        for (let i = 0; i < child.text.length; i++) { text += child.text[i]; at.push(pos + 1 + offset + i); }
      } else {
        text += '￼';
        at.push(pos + 1 + offset);
      }
    });
    // A copy of the text with runs of spaces collapsed, mapped back to the real characters.
    let flat = '';
    const back: number[] = [];
    for (let i = 0; i < text.length; i++) {
      const c = /\s/.test(text[i]) ? ' ' : text[i];
      if (c === ' ' && flat.endsWith(' ')) continue;
      flat += c;
      back.push(i);
    }
    const hay = flat.toLowerCase();
    for (let i = hay.indexOf(want); i !== -1; i = hay.indexOf(want, i + 1)) {
      const a = back[i];
      const b = back[i + want.length - 1] + 1;
      let s0 = 0;
      SENT_START.lastIndex = 0;
      for (let m = SENT_START.exec(text); m && m.index + m[0].length <= a; m = SENT_START.exec(text)) s0 = m.index + m[0].length;
      let e = text.length;
      SENT_END.lastIndex = Math.max(0, b - 1);
      const m = SENT_END.exec(text);
      if (m) e = m.index + m[0].length;
      // A "sentence" with no full stop for hundreds of words is a run-on: rewrite only the quote.
      if (countWords(text.slice(s0, e)) > 120) { s0 = a; e = b; }
      const spot: Spot = { from: at[a], to: at[b - 1] + 1, sentFrom: at[s0], sentTo: at[e - 1] + 1, sentence: text.slice(s0, e) };
      const dist = Math.abs(spot.from - near);
      if (dist < bestDist) { best = spot; bestDist = dist; }
    }
    return false;
  });
  return best;
}

type FixState = { status: 'idle' | 'busy' | 'preview' | 'done'; replacement?: string; why?: string; spot?: Spot; note?: string };

const eye = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>
);
const wand = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M15 4V2M15 10V8M11 6h2M17 6h2M3 21l9-9" /><path d="M12.2 6.2l1.4-1.4M17.8 6.2l-1.4-1.4" /></svg>
);

/**
 * Feedback on a paragraph: what works and what to fix next, no grade. Each fix
 * that names a sentence can show it in the essay and offer a rewrite of just
 * that sentence, which goes in only if the student chooses it.
 */
function CheckCard({
  editor,
  data,
  near,
  plan,
  busy,
  onAgain,
  onClose,
  onUpgrade,
  onUsage,
  bare = false,
}: {
  editor: Editor;
  data: CheckHelp;
  /** Inside a pop-up that already has its own frame: no border of its own. */
  bare?: boolean;
  /** Where the checked text starts, so a quote that appears twice is found in the right place. */
  near: number;
  plan: EssayPlan | null;
  busy: boolean;
  onAgain: () => void;
  onClose: () => void;
  onUpgrade: (source?: string) => void;
  onUsage?: (u: WritingUsage) => void;
}) {
  const v = VERDICT[data.verdict];
  const [fixes, setFixes] = useState<Record<number, FixState>>({});
  const [error, setError] = useState<{ message: string; upgrade: boolean } | null>(null);
  const uid = useId();
  useEffect(() => { setFixes({}); setError(null); }, [data]);

  const patch = (n: number, next: Partial<FixState>) => setFixes((all) => ({ ...all, [n]: { ...(all[n] ?? { status: 'idle' }), ...next } }));
  const done = Object.values(fixes).filter((f) => f.status === 'done').length;
  const working = Object.values(fixes).some((f) => f.status === 'busy');
  const gone = 'That sentence has changed since the check. Check again to get fresh notes.';

  const showMe = (n: number, quote: string) => {
    const spot = locate(editor, quote, near);
    if (!spot) { patch(n, { note: gone }); return; }
    patch(n, { note: undefined });
    editor.chain().focus().setTextSelection({ from: spot.from, to: spot.to }).scrollIntoView().run();
    trackEvent('tool_next_step', { tool: 'writing_help', from: 'check_show_me' });
  };

  const fixIt = async (n: number, f: CheckHelp['fixes'][number]) => {
    if (working || !f.quote) return;
    const spot = locate(editor, f.quote, near);
    if (!spot) { patch(n, { note: gone }); return; }
    patch(n, { status: 'busy', note: undefined });
    setError(null);
    try {
      const doc = editor.getText();
      const at = Math.max(0, doc.indexOf(spot.sentence.slice(0, 60)) - 1200);
      const res = await requestWritingHelp({
        kind: 'fix',
        question: plan?.question,
        thesis: plan?.thesis,
        selection: spot.sentence,
        instruction: `${f.issue} ${f.how}`,
        context: doc.slice(at, at + 3000),
      });
      if (res.kind !== 'fix') throw new WritingError('No suggestion came back. Try again.');
      patch(n, { status: 'preview', replacement: res.replacement, why: res.why, spot });
      // Bring the suggestion and its buttons into view inside a scrolling card.
      window.setTimeout(() => document.getElementById(`${uid}-preview-${n}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 60);
      if (res.usage) onUsage?.(res.usage);
      trackEvent('tool_next_step', { tool: 'writing_help', from: 'check_fix_for_me' });
    } catch (e) {
      const err = e instanceof WritingError ? e : new WritingError('Could not get a suggestion. Try again.');
      patch(n, { status: 'idle' });
      setError({ message: err.message, upgrade: err.upgrade });
    }
  };

  const useFix = (n: number) => {
    const st = fixes[n];
    if (!st?.spot || !st.replacement) return;
    let { sentFrom, sentTo } = st.spot;
    const size = editor.state.doc.content.size;
    // The essay may have moved on since the suggestion; find the sentence again if so.
    if (sentTo > size || editor.state.doc.textBetween(sentFrom, sentTo, ' ') !== st.spot.sentence) {
      const again = locate(editor, st.spot.sentence, near);
      if (!again || again.to - again.from < st.spot.sentence.replace(/\s+/g, ' ').trim().length - 2) { patch(n, { status: 'idle', note: gone }); return; }
      sentFrom = again.from;
      sentTo = again.to;
    }
    editor.chain().focus().insertContentAt({ from: sentFrom, to: sentTo }, st.replacement).run();
    patch(n, { status: 'done' });
    trackEvent('tool_next_step', { tool: 'writing_help', from: 'check_fix_applied' });
  };

  return (
    <div aria-live="polite" className={`ws-rise flex flex-col gap-3 ${bare ? '' : 'rounded-xl border border-[#E4D4F8] bg-white p-3 dark:border-stone-700 dark:bg-stone-900'}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-black uppercase tracking-[0.08em] ${v.tone}`}>{v.label}</span>
        {done > 0 && (
          <span className="ws-rise inline-flex items-center gap-1 rounded-full bg-[#E6F9D2] px-2.5 py-0.5 text-[12px] font-black text-[#2F6B00]">{tick} {done} of {data.fixes.length} fixed</span>
        )}
      </div>
      {data.summary && <p className="m-0 text-[14.5px] font-extrabold leading-[1.45] text-stone-900 dark:text-stone-50">{data.summary}</p>}
      {data.working && (
        <p className="m-0 text-[14px] font-bold leading-[1.45] text-stone-700 dark:text-stone-200"><span className="font-black text-[#2F6B00] dark:text-[#8FE04A]">What works:</span> {data.working}</p>
      )}
      {data.fixes.length > 0 && (
        <>
          <p className="m-0 text-[11.5px] font-black uppercase tracking-[0.12em] text-[#7733B5] dark:text-[#C9A0F0]">Fix next</p>
          <ol className="m-0 flex list-none flex-col gap-3 p-0">
            {data.fixes.map((f, n) => {
              const st = fixes[n] ?? { status: 'idle' as const };
              const isDone = st.status === 'done';
              return (
                <li key={`${n}-${f.issue}`} className="flex gap-2.5">
                  <span aria-hidden className={`mt-0.5 inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full text-[12.5px] font-black ${isDone ? 'bg-[#58CC02] text-white' : 'bg-[#F3EAFF] text-[#7733B5] dark:bg-stone-800 dark:text-[#C9A0F0]'}`}>{isDone ? <span className="ws-tick">{tick}</span> : n + 1}</span>
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <p className={`m-0 text-[14px] leading-[1.45] ${isDone ? 'text-stone-500 dark:text-stone-400' : 'text-stone-700 dark:text-stone-200'}`}>
                      <span className={`font-black ${isDone ? 'text-stone-500 line-through decoration-2 dark:text-stone-400' : 'text-stone-900 dark:text-stone-50'}`}>{f.issue}</span>{' '}
                      {!isDone && <span className="font-bold">{f.how}</span>}
                      {isDone && <span className="font-extrabold text-[#2F6B00] dark:text-[#8FE04A]">Fixed in your essay.</span>}
                    </p>

                    {f.quote && !isDone && st.status !== 'preview' && (
                      <>
                        <p className="m-0 rounded-lg bg-[#F7F1FF] px-2.5 py-1.5 text-[13.5px] font-bold italic leading-[1.45] text-[#5B2491] dark:bg-stone-800 dark:text-[#C9A0F0]">&ldquo;{f.quote}&rdquo;</p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                          <button type="button" onClick={() => showMe(n, f.quote!)} className="inline-flex min-h-[44px] items-center gap-1.5 text-[14px] font-black text-[#7733B5] underline-offset-2 hover:underline dark:text-[#C9A0F0]">{eye} Show me</button>
                          <button type="button" disabled={working} onClick={() => void fixIt(n, f)} className={`${BTN_WHITE} min-h-[44px] rounded-xl px-3.5 text-[14px]`}>
                            {st.status === 'busy' ? <>{spinner} Rewriting…</> : <>{wand} Fix it for me</>}
                          </button>
                        </div>
                      </>
                    )}

                    {st.status === 'preview' && st.replacement && (
                      <div id={`${uid}-preview-${n}`} className="ws-rise flex flex-col gap-2 rounded-xl border border-[#BFE89A] bg-[#F4FCEB] p-2.5 dark:border-[#3F6B1C] dark:bg-[#1F2E14]">
                        <p className="m-0 text-[11.5px] font-black uppercase tracking-[0.12em] text-[#2F6B00] dark:text-[#8FE04A]">Suggested sentence</p>
                        <p className="m-0 text-[14.5px] font-extrabold leading-[1.5] text-stone-900 dark:text-stone-50">{st.replacement}</p>
                        {st.why && <p className="m-0 text-[13px] font-bold leading-[1.45] text-stone-600 dark:text-stone-300"><span className="font-black text-stone-900 dark:text-stone-50">Why:</span> {st.why}</p>}
                        {/\[[^\]]+\]/.test(st.replacement) && (
                          <p className="m-0 text-[13px] font-extrabold leading-[1.4] text-[#9A3412] dark:text-[#FDBA74]">Fill in the part in [brackets] with your own evidence.</p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => useFix(n)} className={`${BTN_GREEN} min-h-[44px] flex-[1_1_110px] rounded-xl px-3.5 text-[14.5px]`}>Use this</button>
                          <button type="button" onClick={() => patch(n, { status: 'idle' })} className={`${BTN_WHITE} min-h-[44px] flex-[1_1_110px] rounded-xl px-3.5 text-[14.5px]`}>Keep mine</button>
                        </div>
                      </div>
                    )}

                    {st.note && <p role="status" className="m-0 text-[13px] font-extrabold leading-[1.4] text-[#9A3412] dark:text-[#FDBA74]">{st.note}</p>}
                  </div>
                </li>
              );
            })}
          </ol>
        </>
      )}
      {error && <LimitNote error={error} onUpgrade={onUpgrade} source="writing_help_limit" />}
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy || working} onClick={onAgain} className={`${BTN_WHITE} min-h-[44px] rounded-xl px-3.5 text-[14px]`}>{busy ? <>{spinner} Reading…</> : done > 0 ? 'Check it again' : 'Check again'}</button>
        <button type="button" onClick={onClose} className="min-h-[44px] px-2 text-[14px] font-black text-stone-600 underline dark:text-stone-300">Close</button>
      </div>
    </div>
  );
}

/* ── The outline rail ───────────────────────────────────────────── */
export function WritingHelpRail({
  editor,
  plan,
  onGrade,
  onUpgrade,
  onRemovePlan,
  checkSignal = 0,
}: {
  editor: Editor | null;
  plan: EssayPlan;
  /** Bump to check the paragraph being written (the "not finished yet" prompt does this). */
  checkSignal?: number;
  onGrade: () => void;
  onUpgrade: (source?: string) => void;
  /** Called after the outline headings are taken out of the draft. */
  onRemovePlan: () => void;
}) {
  const [sections, setSections] = useState<SectionState[]>([]);
  const [active, setActive] = useState(0);
  const [busy, setBusy] = useState(false);
  const [busyKind, setBusyKind] = useState<'start' | 'check'>('start');
  const [help, setHelp] = useState<{ index: number; data: StartHelp } | null>(null);
  const [next, setNext] = useState<{ index: number; data: NextHelp; added?: { move: number; from: number; to: number; text: string; source: boolean } } | null>(null);
  const [check, setCheck] = useState<{ index: number; data: CheckHelp } | null>(null);
  const [error, setError] = useState<{ message: string; upgrade: boolean } | null>(null);
  const [usage, setUsage] = useState<WritingUsage | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchWritingUsage().then((u) => { if (alive) setUsage(u); }).catch(() => { /* the allowance line stays hidden */ });
    return () => { alive = false; };
  }, []);

  // Keep section word counts and the "you are here" marker in step with the draft.
  useEffect(() => {
    if (!editor) return;
    const sync = () => {
      const next = readSections(editor, plan);
      setSections(next);
      const at = editor.state.selection.from;
      let here = -1;
      next.forEach((s, i) => { if (s.headingPos !== -1 && at >= s.headingPos && at <= s.end) here = i; });
      if (here !== -1) setActive(here);
    };
    sync();
    editor.on('update', sync);
    editor.on('selectionUpdate', sync);
    return () => { editor.off('update', sync); editor.off('selectionUpdate', sync); };
  }, [editor, plan]);

  const written = sections.reduce((a, s) => a + s.words, 0);
  const gradeReady = written >= plan.wordTarget * GRADE_READY_SHARE;
  const allStarted = sections.length > 0 && sections.every((s) => s.headingPos === -1 || s.words > 0);

  const goTo = (i: number) => {
    setActive(i);
    const s = sections[i];
    if (!editor || !s || s.headingPos === -1) return;
    const pos = s.emptyParaPos !== -1 ? s.emptyParaPos + 1 : Math.max(1, s.end - 1);
    editor.chain().focus().setTextSelection(pos).scrollIntoView().run();
  };

  const askStart = async (i: number) => {
    if (!editor || busy) return;
    setBusy(true);
    setBusyKind('start');
    setError(null);
    try {
      const s = plan.sections[i];
      const data = await requestWritingHelp({
        kind: 'start',
        question: plan.question,
        thesis: plan.thesis,
        heading: s.heading,
        goal: s.goal,
        context: editor.getText().slice(-6000),
      });
      if (data.kind !== 'start') throw new WritingError('No suggestion came back. Try again.');
      setNext(null);
      setHelp({ index: i, data });
      if (data.usage) setUsage(data.usage);
      trackEvent('tool_next_step', { tool: 'writing_help', from: 'start' });
    } catch (e) {
      const err = e instanceof WritingError ? e : new WritingError('Could not get a suggestion. Try again.');
      setError({ message: err.message, upgrade: err.upgrade });
    } finally {
      setBusy(false);
    }
  };

  /** What is written under one heading so far. */
  const sectionText = (i: number) => {
    if (!editor) return '';
    const st = readSections(editor, plan)[i];
    const heading = st && st.headingPos !== -1 ? editor.state.doc.nodeAt(st.headingPos) : null;
    return st && heading ? editor.state.doc.textBetween(st.headingPos + heading.nodeSize, st.end, '\n\n').trim() : '';
  };

  /** In-text citations added with Cite under one heading (typed ones are spotted on the server). */
  const citationsIn = (i: number) => {
    if (!editor) return 0;
    const st = readSections(editor, plan)[i];
    if (!st || st.headingPos === -1) return 0;
    let n = 0;
    editor.state.doc.nodesBetween(st.headingPos, Math.min(st.end, editor.state.doc.content.size), (node) => {
      if (node.isText && node.marks.some((m) => m.type.name === 'citeRef')) n++;
      return true;
    });
    return n;
  };

  /** A paragraph that is already started: what it has done, and what to write next. */
  const askNext = async (i: number) => {
    if (!editor || busy) return;
    const soFar = sectionText(i);
    if (countWords(soFar) < STARTED_WORDS) { void askStart(i); return; }
    setBusy(true);
    setBusyKind('start');
    setError(null);
    try {
      const s = plan.sections[i];
      const data = await requestWritingHelp({
        kind: 'next',
        question: plan.question,
        thesis: plan.thesis,
        heading: s.heading,
        goal: s.goal,
        selection: soFar,
        context: editor.getText().slice(-4000),
        place: {
          index: i,
          total: plan.sections.length,
          outline: plan.sections.map((x) => `${x.heading}: ${x.goal}`.slice(0, 220)),
          words: countWords(soFar),
          target: s.words,
          citations: citationsIn(i),
        },
      });
      if (data.kind !== 'next') throw new WritingError('No suggestion came back. Try again.');
      setHelp(null);
      setCheck(null);
      setNext({ index: i, data });
      if (data.usage) setUsage(data.usage);
      trackEvent('tool_next_step', { tool: 'writing_help', from: 'next' });
    } catch (e) {
      const err = e instanceof WritingError ? e : new WritingError('Could not get a suggestion. Try again.');
      setError({ message: err.message, upgrade: err.upgrade });
    } finally {
      setBusy(false);
    }
  };

  /** Carry on the paragraph that is already there: the words go on the end of its last line, and the cursor waits after them. */
  const continueWith = (i: number, move: number, starter: string) => {
    if (!editor || !next) return;
    const s = readSections(editor, plan)[i];
    if (!s || s.headingPos === -1) return;
    // A starter that trails off ("This matters because…") goes in without the dots, so the student just keeps typing.
    const text = starter.replace(/\s*(\.{3}|…)\s*$/, '').trim();
    let at = -1;
    editor.state.doc.forEach((node, pos) => {
      if (pos > s.headingPos && pos < s.end && node.type.name === 'paragraph' && node.textContent.trim()) at = pos + node.nodeSize - 1;
    });
    if (at === -1) { useStarter(i, text); setNext(null); return; }
    const lead = /\s$/.test(editor.state.doc.textBetween(Math.max(1, at - 1), at, ' ')) ? '' : ' ';
    const inserted = `${lead}${text} `;
    editor.chain().focus().insertContentAt(at, inserted).scrollIntoView().run();
    // A "[your source]" spot gets selected, so Cite a source drops the citation straight into it.
    const spot = inserted.match(/\[[^\]]*(?:source|reference|citation)[^\]]*\]/i);
    if (spot && spot.index !== undefined) {
      const from = at + spot.index;
      editor.chain().focus().setTextSelection({ from, to: from + spot[0].length }).run();
    }
    setNext({ ...next, added: { move, from: at, to: at + inserted.length, text: inserted, source: !!spot } });
    trackEvent('tool_next_step', { tool: 'writing_help', from: 'next_added' });
  };

  /** Take the added words back out, as long as they are still exactly where they went. */
  const undoContinue = () => {
    if (!editor || !next?.added) return;
    const { from, to, text } = next.added;
    if (to <= editor.state.doc.content.size && editor.state.doc.textBetween(from, to, '') === text) {
      editor.chain().focus().deleteRange({ from, to }).run();
    }
    setNext({ ...next, added: undefined });
  };

  /** Read one written section against its goal. It gives feedback, not a grade. */
  const askCheck = async (i: number) => {
    if (!editor || busy) return;
    const st = readSections(editor, plan)[i];
    const heading = st && st.headingPos !== -1 ? editor.state.doc.nodeAt(st.headingPos) : null;
    if (!st || !heading) return;
    const text = editor.state.doc.textBetween(st.headingPos + heading.nodeSize, st.end, '\n\n').trim();
    if (countWords(text) < CHECK_MIN_WORDS) {
      setError({ message: `Write at least ${CHECK_MIN_WORDS} words in this paragraph first, then check it.`, upgrade: false });
      return;
    }
    setBusy(true);
    setBusyKind('check');
    setError(null);
    try {
      const s = plan.sections[i];
      const data = await requestWritingHelp({ kind: 'check', question: plan.question, thesis: plan.thesis, heading: s.heading, goal: s.goal, selection: text });
      if (data.kind !== 'check') throw new WritingError('No feedback came back. Try again.');
      setHelp(null);
      setNext(null);
      setCheck({ index: i, data });
      if (data.usage) setUsage(data.usage);
      trackEvent('tool_next_step', { tool: 'writing_help', from: 'check' });
    } catch (e) {
      const err = e instanceof WritingError ? e : new WritingError('Could not check this paragraph. Try again.');
      setError({ message: err.message, upgrade: err.upgrade });
    } finally {
      setBusy(false);
    }
  };

  // "Check a paragraph instead": the one being written, or the last one with enough in it.
  useEffect(() => {
    if (checkSignal <= 0 || !editor) return;
    const live = readSections(editor, plan);
    const enough = (i: number) => (live[i]?.words ?? 0) >= CHECK_MIN_WORDS;
    let target = enough(active) ? active : -1;
    if (target === -1) for (let i = live.length - 1; i >= 0; i--) if (enough(i)) { target = i; break; }
    if (target === -1) {
      setError({ message: `Write at least ${CHECK_MIN_WORDS} words in a paragraph first, then check it.`, upgrade: false });
      return;
    }
    setActive(target);
    void askCheck(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkSignal]);

  const useStarter = (i: number, text: string) => {
    if (!editor) return;
    const s = readSections(editor, plan)[i];
    if (!s || s.headingPos === -1) return;
    if (s.emptyParaPos !== -1) {
      editor.chain().focus().insertContentAt(s.emptyParaPos + 1, text + ' ').run();
    } else {
      editor.chain().focus().insertContentAt(s.end, { type: 'paragraph', content: [{ type: 'text', text: text + ' ' }] }).run();
    }
    setHelp(null);
  };

  const removeHeadings = () => {
    if (!editor) return;
    const tr = editor.state.tr;
    const live = readSections(editor, plan).filter((s) => s.headingPos !== -1).sort((a, b) => b.headingPos - a.headingPos);
    for (const s of live) {
      const node = editor.state.doc.nodeAt(s.headingPos);
      if (node) tr.delete(s.headingPos, s.headingPos + node.nodeSize);
    }
    editor.view.dispatch(tr);
    onRemovePlan();
  };

  return (
    <div className="flex h-full min-h-0 flex-col" style={FONT}>
      <div className="flex-1 overflow-y-auto px-4 pb-4 pt-5">
        <div className="flex items-center gap-2.5">
          <img src="/icons/outline.webp" alt="" width={44} height={44} className="h-11 w-11 shrink-0 object-contain" />
          <div className="min-w-0">
            <h2 className="m-0 text-[19px] font-black leading-tight text-stone-900 dark:text-stone-50">Your outline</h2>
            <p className="m-0 text-[13px] font-extrabold text-stone-500 dark:text-stone-400">{written.toLocaleString('en-US')} of about {plan.wordTarget.toLocaleString('en-US')} words</p>
          </div>
        </div>

        <div className="mt-3 rounded-2xl bg-[#FBF8FF] p-3 dark:bg-stone-800">
          <p className="m-0 text-[11.5px] font-black uppercase tracking-[0.12em] text-[#7733B5] dark:text-[#C9A0F0]">Your thesis</p>
          <p className="m-0 mt-1 text-[14px] font-bold leading-[1.4] text-stone-700 dark:text-stone-200">{plan.thesis}</p>
        </div>

        <ol className="m-0 mt-3 flex list-none flex-col gap-2 p-0">
          {plan.sections.map((s, i) => {
            const st = sections[i];
            const missing = !!st && st.headingPos === -1;
            const words = st?.words ?? 0;
            const done = words >= s.words * 0.8;
            const on = active === i && !missing;
            const pct = Math.min(100, Math.round((words / Math.max(1, s.words)) * 100));
            return (
              <li key={`${s.heading}-${i}`} className={`rounded-2xl border-2 ${on ? 'border-[#A560E8] bg-[#F7F1FF] dark:bg-[#A560E8]/15' : 'border-transparent'}`}>
                <button
                  type="button"
                  disabled={missing}
                  aria-current={on ? 'true' : undefined}
                  onClick={() => goTo(i)}
                  className="flex min-h-[48px] w-full items-center gap-2.5 rounded-2xl px-2.5 py-2 text-left disabled:cursor-default"
                >
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${done ? 'bg-[#58CC02] text-white' : words > 0 ? 'border-[3px] border-[#A560E8]' : 'border-2 border-stone-300 dark:border-stone-600'}`}>{done && <span className="ws-tick">{tick}</span>}</span>
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-[15px] ${on ? 'font-black text-[#7733B5] dark:text-[#C9A0F0]' : missing ? 'font-bold text-stone-400 line-through' : 'font-extrabold text-stone-800 dark:text-stone-100'}`}>{s.heading}</span>
                    {!missing && (
                      <span className="mt-1 flex items-center gap-2">
                        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#EADCFB] dark:bg-stone-700"><span className={`block h-full rounded-full transition-[width,background-color] duration-500 ease-out ${done ? 'bg-[#58CC02]' : 'bg-[#A560E8]'}`} style={{ width: `${pct}%` }} /></span>
                        <span className="shrink-0 text-[12px] font-extrabold tabular-nums text-stone-500 dark:text-stone-400">{words} / {s.words}</span>
                      </span>
                    )}
                  </span>
                </button>

                {on && (
                  <div className="ws-rise flex flex-col gap-2.5 px-3 pb-3">
                    <p className="m-0 text-[14px] font-bold leading-[1.45] text-stone-600 dark:text-stone-300"><span className="font-black text-stone-800 dark:text-stone-100">What it should do:</span> {s.goal}</p>

                    {help?.index === i ? (
                      <div aria-live="polite" className="flex flex-col gap-2">
                        <p className="m-0 text-[11.5px] font-black uppercase tracking-[0.12em] text-[#2F6B00] dark:text-[#8FE04A]">Two ways to open it</p>
                        {help.data.starters.map((t, n) => (
                          <div key={t} style={{ animationDelay: `${n * 90}ms` }} className="ws-rise flex flex-col gap-2 rounded-xl border border-[#BFE89A] bg-[#F4FCEB] p-2.5 dark:border-[#3F6B1C] dark:bg-[#1F2E14]">
                            <p className="m-0 text-[14.5px] font-extrabold leading-[1.45] text-stone-900 dark:text-stone-50">{t}</p>
                            <button type="button" onClick={() => useStarter(i, t)} className={`${BTN_GREEN} min-h-[44px] self-start rounded-xl px-4 text-[14.5px]`}>Use this</button>
                          </div>
                        ))}
                        {help.data.questions.length > 0 && (
                          <>
                            <p className="m-0 mt-1 text-[11.5px] font-black uppercase tracking-[0.12em] text-[#7733B5] dark:text-[#C9A0F0]">Then answer these</p>
                            <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                              {help.data.questions.map((q) => (
                                <li key={q} className="flex gap-2 text-[14px] font-bold leading-[1.4] text-stone-700 dark:text-stone-200"><span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#A560E8]" />{q}</li>
                              ))}
                            </ul>
                          </>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <button type="button" disabled={busy} onClick={() => void askStart(i)} className={`${BTN_WHITE} min-h-[44px] rounded-xl px-3.5 text-[14px]`}>{busy ? <>{spinner} Thinking…</> : 'Show me others'}</button>
                          <button type="button" onClick={() => setHelp(null)} className="min-h-[44px] px-2 text-[14px] font-black text-stone-600 underline dark:text-stone-300">I will write it myself</button>
                        </div>
                      </div>
                    ) : next?.index === i ? (
                      <div aria-live="polite" className="flex flex-col gap-2">
                        <div className="ws-rise rounded-xl border border-[#E4D4F8] bg-[#FBF8FF] p-2.5 dark:border-stone-700 dark:bg-stone-800">
                          <p className="m-0 text-[11.5px] font-black uppercase tracking-[0.12em] text-[#7733B5] dark:text-[#C9A0F0]">So far</p>
                          <p className="m-0 mt-1 text-[14.5px] font-bold leading-[1.45] text-stone-800 dark:text-stone-100">{next.data.sofar}</p>
                        </div>
                        {next.added ? (
                          <div className="ws-rise flex flex-col gap-2 rounded-xl border border-[#BFE89A] bg-[#F4FCEB] p-2.5 dark:border-[#3F6B1C] dark:bg-[#1F2E14]">
                            <p className="m-0 flex items-center gap-2 text-[14.5px] font-black text-[#2F6B00] dark:text-[#8FE04A]">
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#58CC02] text-white"><span className="ws-tick">{tick}</span></span>
                              {next.added.source ? 'Added. Now back it up with a source.' : 'Added. Finish the sentence from there.'}
                            </p>
                            {next.added.source ? (
                              <>
                                <p className="m-0 text-[14px] font-bold leading-[1.45] text-stone-600 dark:text-stone-300">The [your source] spot is selected. Add the source and the citation goes right there, in your style.</p>
                                <button type="button" onClick={() => { trackEvent('tool_next_step', { tool: 'writing_help', from: 'next_cite' }); window.dispatchEvent(new CustomEvent('writescholar:openCite')); }} className={`${BTN_PURPLE} min-h-[44px] self-start rounded-xl px-4 text-[14.5px]`}>Cite a source</button>
                              </>
                            ) : (
                              <p className="m-0 text-[14px] font-bold leading-[1.45] text-stone-600 dark:text-stone-300">Your cursor is waiting after “{next.added.text.trim()}”</p>
                            )}
                            <button type="button" onClick={undoContinue} className="-mt-1.5 min-h-[36px] self-start px-0.5 text-[14px] font-black text-stone-600 underline dark:text-stone-300">Undo</button>
                          </div>
                        ) : (
                          <>
                            {next.data.moves.length > 0 && (
                              <p className="m-0 mt-1 text-[11.5px] font-black uppercase tracking-[0.12em] text-[#2F6B00] dark:text-[#8FE04A]">What to write next</p>
                            )}
                            {next.data.moves.map((m, n) => (
                              <div key={`${n}-${m.what}`} style={{ animationDelay: `${n * 90}ms` }} className="ws-rise flex flex-col gap-2 rounded-xl border border-[#BFE89A] bg-[#F4FCEB] p-2.5 dark:border-[#3F6B1C] dark:bg-[#1F2E14]">
                                <p className="m-0 text-[14.5px] font-black leading-[1.35] text-stone-900 dark:text-stone-50">{m.what}</p>
                                <p className="m-0 border-l-[3px] border-[#8FD14F] pl-2.5 text-[14px] font-bold italic leading-[1.45] text-stone-600 dark:border-[#58CC02] dark:text-stone-300">
                                  {m.starter.replace(/\s*(\.{3}|…)\s*$/, '')}<span aria-hidden className="text-stone-400"> …</span>
                                </p>
                                <button type="button" onClick={() => continueWith(i, n, m.starter)} className={`${BTN_GREEN} min-h-[44px] self-start rounded-xl px-4 text-[14.5px]`}>Add this</button>
                              </div>
                            ))}
                          </>
                        )}
                        {next.data.questions.length > 0 && (
                          <>
                            <p className="m-0 mt-1 text-[11.5px] font-black uppercase tracking-[0.12em] text-[#7733B5] dark:text-[#C9A0F0]">{next.added ? 'As you write, answer these' : 'Then answer these'}</p>
                            <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                              {next.data.questions.map((q) => (
                                <li key={q} className="flex gap-2 text-[14px] font-bold leading-[1.4] text-stone-700 dark:text-stone-200"><span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#A560E8]" />{q}</li>
                              ))}
                            </ul>
                          </>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <button type="button" disabled={busy} onClick={() => void askNext(i)} className={`${BTN_WHITE} min-h-[44px] rounded-xl px-3.5 text-[14px]`}>{busy ? <>{spinner} Reading your paragraph…</> : next.added ? 'What comes after this?' : 'Show me other ideas'}</button>
                          <button type="button" onClick={() => setNext(null)} className="min-h-[44px] px-2 text-[14px] font-black text-stone-600 underline dark:text-stone-300">{next.added ? 'Done' : 'I will write it myself'}</button>
                        </div>
                      </div>
                    ) : check?.index === i ? (
                      editor && (
                        <CheckCard
                          editor={editor}
                          data={check.data}
                          near={st?.headingPos ?? 0}
                          plan={plan}
                          busy={busy}
                          onAgain={() => void askCheck(i)}
                          onClose={() => setCheck(null)}
                          onUpgrade={onUpgrade}
                          onUsage={setUsage}
                        />
                      )
                    ) : (
                      <div className="flex flex-col gap-2">
                        <button type="button" disabled={busy} onClick={() => void (words >= STARTED_WORDS ? askNext(i) : askStart(i))} className={`${BTN_PURPLE} min-h-[48px] rounded-xl px-4 text-[15px]`}>
                          {busy && busyKind === 'start' ? <>{spinner} {words >= STARTED_WORDS ? 'Reading your paragraph…' : 'Thinking…'}</> : words >= STARTED_WORDS ? 'What should I write next?' : 'Help me start this paragraph'}
                        </button>
                        {words >= CHECK_MIN_WORDS && (
                          <button type="button" disabled={busy} onClick={() => void askCheck(i)} className={`${BTN_WHITE} min-h-[48px] rounded-xl px-4 text-[15px]`}>
                            {busy && busyKind === 'check' ? <>{spinner} Reading…</> : <><img src="/icons/check-paragraph.webp" alt="" width={26} height={26} className="h-[26px] w-[26px] object-contain" /> Check this paragraph</>}
                          </button>
                        )}
                      </div>
                    )}
                    {error && <LimitNote error={error} onUpgrade={onUpgrade} source="writing_help_limit" />}
                  </div>
                )}
              </li>
            );
          })}
        </ol>

        <div className="mt-3 rounded-2xl border border-[#F5DF94] bg-[#FFF9E5] p-3 dark:border-[#6B5A1C] dark:bg-[#2E2814]">
          <p className="m-0 text-[14.5px] font-black text-stone-900 dark:text-stone-50">You write, it helps</p>
          <p className="m-0 mt-0.5 text-[13.5px] font-bold leading-[1.4] text-stone-600 dark:text-stone-300">It suggests openings and questions, and checks a paragraph once you have written it. Select a paragraph to check it, or a sentence to make it clearer. It does not write the essay for you.</p>
        </div>

        {allStarted && (
          confirmRemove ? (
            <div className="mt-3 flex flex-col gap-2 rounded-2xl border border-[#E4D4F8] p-3 dark:border-stone-700">
              <p className="m-0 text-[14px] font-extrabold text-stone-800 dark:text-stone-100">Take the outline headings out of your essay? Your paragraphs stay.</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={removeHeadings} className={`${BTN_PURPLE} min-h-[44px] rounded-xl px-4 text-[14.5px]`}>Remove headings</button>
                <button type="button" onClick={() => setConfirmRemove(false)} className={`${BTN_WHITE} min-h-[44px] rounded-xl px-4 text-[14.5px]`}>Keep them</button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmRemove(true)} className="mt-3 min-h-[44px] text-left text-[14px] font-black text-[#7733B5] underline dark:text-[#C9A0F0]">Finished? Remove the outline headings</button>
          )
        )}
      </div>

      <div className="flex flex-col gap-2 border-t border-[#EFE5FA] px-4 py-3 dark:border-stone-700">
        {gradeReady ? (
          <button type="button" onClick={onGrade} className={`${BTN_GREEN} min-h-[52px] w-full rounded-2xl px-4 text-[16px]`}>Grade this draft</button>
        ) : (
          <>
            <p className="m-0 text-center text-[13px] font-extrabold leading-[1.4] text-stone-600 dark:text-stone-300">The full grade is for a finished draft. Until then, check one paragraph at a time.</p>
            <button type="button" onClick={onGrade} className={`${BTN_WHITE} min-h-[48px] w-full rounded-2xl px-4 text-[15px]`}>Grade the whole draft</button>
          </>
        )}
        {usage && (
          <p className="m-0 text-center text-[12.5px] font-extrabold text-stone-500 dark:text-stone-400">{usage.helpsLeft} of {usage.helpsLimit} writing helps left{resetDay(usage.resetsAt) ? `, more on ${resetDay(usage.resetsAt)}` : usage.paid ? ' this period' : ' this month'}</p>
        )}
      </div>
    </div>
  );
}

/* ── Help with a selected passage ───────────────────────────────── */
type Kind = 'clearer' | 'shorter' | 'formal';
const KIND_LABEL: Record<Kind, string> = { clearer: 'Make it clearer', shorter: 'Shorten', formal: 'More formal' };
/** Shorter labels for when "Check this" shares the bar. */
const KIND_SHORT: Record<Kind, string> = { clearer: 'Clearer', shorter: 'Shorter', formal: 'More formal' };
const RESULT_TITLE: Record<Kind | 'fix', string> = { clearer: 'A clearer version', shorter: 'A shorter version', formal: 'A more formal version', fix: 'A suggested sentence' };
const POPOVER_WIDTH = 400;
const CHECK_WIDTH = 440;

interface Sel {
  from: number;
  to: number;
  /** The selected paragraphs' text (headings left out), joined by blank lines. */
  text: string;
  top: number;
  bottom: number;
  centre: number;
  /** One paragraph of 3 to 250 words: the rewrites apply. */
  canRewrite: boolean;
  /** 40 to 900 words of paragraph text: it can be checked. */
  canCheck: boolean;
}

/** The outline part a position falls in, for the check's "what it should do". */
function sectionAt(editor: Editor, plan: EssayPlan, pos: number) {
  const live = readSections(editor, plan);
  for (let i = 0; i < live.length; i++) {
    if (live[i].headingPos !== -1 && pos > live[i].headingPos && pos <= live[i].end) return plan.sections[i];
  }
  return null;
}

export function SelectionHelp({ editor, plan, onUpgrade }: { editor: Editor | null; plan: EssayPlan | null; onUpgrade: (source?: string) => void }) {
  const [sel, setSel] = useState<Sel | null>(null);
  const [busy, setBusy] = useState<Kind | 'check' | null>(null);
  const [result, setResult] = useState<{ sel: Sel; data: RewriteHelp } | null>(null);
  const [check, setCheck] = useState<{ sel: Sel; data: CheckHelp } | null>(null);
  const [error, setError] = useState<{ message: string; upgrade: boolean } | null>(null);
  const holdRef = useRef(false);
  const cardRef = useRef<HTMLDivElement | null>(null);
  /** The checked range, kept in step with edits so "Check again" reads the same paragraphs. */
  const rangeRef = useRef<{ from: number; to: number } | null>(null);

  const measure = useCallback((): Sel | null => {
    if (!editor || editor.isDestroyed) return null;
    const selection = editor.state.selection;
    if (selection.empty) return null;
    // Each block the selection touches. A triple-click also reaches the start
    // of the next block, so empty overlaps are left out.
    const hits: { from: number; to: number; para: boolean }[] = [];
    editor.state.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
      if (!node.isTextblock) return true;
      const a = Math.max(selection.from, pos + 1);
      const b = Math.min(selection.to, pos + node.nodeSize - 1);
      if (b > a) hits.push({ from: a, to: b, para: node.type.name === 'paragraph' });
      return false;
    });
    if (hits.length === 0) return null;
    const paras = hits.filter((h) => h.para);
    const text = paras.map((h) => editor.state.doc.textBetween(h.from, h.to, ' ').trim()).filter(Boolean).join('\n\n');
    const words = countWords(text);
    // A rewrite that spans headings or several blocks would flatten them, so it is one paragraph only.
    const canRewrite = hits.length === 1 && hits[0].para && words >= 3 && words <= 250;
    const canCheck = words >= CHECK_MIN_WORDS && words <= CHECK_MAX_WORDS;
    if (!canRewrite && !canCheck) return null;
    const from = hits[0].from;
    const to = hits[hits.length - 1].to;
    try {
      const a = editor.view.coordsAtPos(from);
      const b = editor.view.coordsAtPos(to);
      const top = Math.min(a.top, b.top);
      const bottom = Math.max(a.bottom, b.bottom);
      // Across several lines the bar centres on the editor column, not on the line ends.
      const box = editor.view.dom.getBoundingClientRect();
      const centre = a.top === b.top ? (Math.min(a.left, b.left) + Math.max(a.right, b.right)) / 2 : box.left + box.width / 2;
      return { from, to, text, top, bottom, centre, canRewrite, canCheck };
    } catch {
      return null;
    }
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    const sync = () => { if (!holdRef.current) setSel(editor.isFocused ? measure() : null); };
    const onBlur = () => { window.setTimeout(() => { if (!holdRef.current && !editor.isFocused) setSel(null); }, 120); };
    const onTr = ({ transaction }: { transaction: { docChanged: boolean; mapping: { map: (pos: number, assoc?: number) => number } } }) => {
      if (!rangeRef.current || !transaction.docChanged) return;
      rangeRef.current = { from: transaction.mapping.map(rangeRef.current.from, -1), to: transaction.mapping.map(rangeRef.current.to, 1) };
    };
    editor.on('selectionUpdate', sync);
    editor.on('focus', sync);
    editor.on('blur', onBlur);
    editor.on('transaction', onTr);
    window.addEventListener('scroll', sync, true);
    window.addEventListener('resize', sync);
    return () => {
      editor.off('selectionUpdate', sync);
      editor.off('focus', sync);
      editor.off('blur', onBlur);
      editor.off('transaction', onTr);
      window.removeEventListener('scroll', sync, true);
      window.removeEventListener('resize', sync);
    };
  }, [editor, measure]);

  const close = useCallback(() => { holdRef.current = false; rangeRef.current = null; setResult(null); setCheck(null); setError(null); setBusy(null); }, []);

  // Escape or a click outside the card dismisses it.
  useEffect(() => {
    if (!result && !check && !error) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    const onDown = (e: MouseEvent) => { if (cardRef.current && !cardRef.current.contains(e.target as Node)) close(); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onDown); };
  }, [result, check, error, close]);

  const ask = async (kind: Kind) => {
    if (!editor || !sel || busy) return;
    const at = sel;
    holdRef.current = true;
    setBusy(kind);
    setError(null);
    try {
      const doc = editor.getText();
      const data = await requestWritingHelp({
        kind,
        question: plan?.question,
        thesis: plan?.thesis,
        selection: at.text,
        context: doc.length > 3000 ? doc.slice(Math.max(0, doc.indexOf(at.text.slice(0, 60)) - 1200)).slice(0, 3000) : doc,
      });
      if (data.kind === 'start' || data.kind === 'check' || data.kind === 'next') throw new WritingError('No suggestion came back. Try again.');
      setResult({ sel: at, data });
      trackEvent('tool_next_step', { tool: 'writing_help', from: kind });
    } catch (e) {
      const err = e instanceof WritingError ? e : new WritingError('Could not get a suggestion. Try again.');
      setError({ message: err.message, upgrade: err.upgrade });
      setResult(null);
    } finally {
      setBusy(null);
    }
  };

  /** Read the selected paragraphs the way the outline's "Check this paragraph" does. */
  const askCheck = async (at: Sel, again = false) => {
    if (!editor || busy) return;
    holdRef.current = true;
    setBusy('check');
    setError(null);
    try {
      const part = plan ? sectionAt(editor, plan, at.from) : null;
      const data = await requestWritingHelp({
        kind: 'check',
        question: plan?.question,
        thesis: plan?.thesis,
        heading: part?.heading,
        goal: part?.goal,
        selection: at.text,
      });
      if (data.kind !== 'check') throw new WritingError('No feedback came back. Try again.');
      rangeRef.current = { from: at.from, to: at.to };
      setCheck({ sel: at, data });
      trackEvent('tool_next_step', { tool: 'writing_help', from: again ? 'check_selection_again' : 'check_selection' });
    } catch (e) {
      const err = e instanceof WritingError ? e : new WritingError('Could not check this passage. Try again.');
      setError({ message: err.message, upgrade: err.upgrade });
      setCheck(null);
    } finally {
      setBusy(null);
    }
  };

  /** Check the same paragraphs again, as they read now. */
  const checkAgain = () => {
    if (!editor || !check) return;
    const r = rangeRef.current ?? { from: check.sel.from, to: check.sel.to };
    const size = editor.state.doc.content.size;
    const from = Math.max(1, Math.min(r.from, size));
    const to = Math.max(from, Math.min(r.to, size));
    const parts: string[] = [];
    editor.state.doc.nodesBetween(from, to, (node, pos) => {
      if (!node.isTextblock) return true;
      if (node.type.name === 'paragraph') {
        const t = editor.state.doc.textBetween(Math.max(from, pos + 1), Math.min(to, pos + node.nodeSize - 1), ' ').trim();
        if (t) parts.push(t);
      }
      return false;
    });
    const text = parts.join('\n\n');
    const words = countWords(text);
    if (words < CHECK_MIN_WORDS) { setError({ message: `There are fewer than ${CHECK_MIN_WORDS} words left in this passage to check.`, upgrade: false }); return; }
    if (words > CHECK_MAX_WORDS) { setError({ message: `This passage is now over ${CHECK_MAX_WORDS} words. Select one or two paragraphs and check them.`, upgrade: false }); return; }
    void askCheck({ ...check.sel, from, to, text }, true);
  };

  const apply = () => {
    if (!editor || !result) return;
    const { from, to, text } = result.sel;
    const still = editor.state.doc.textBetween(from, Math.min(to, editor.state.doc.content.size), ' ').trim();
    if (still !== text) {
      setError({ message: 'That passage changed while you were reading. Select it again.', upgrade: false });
      setResult(null);
      return;
    }
    editor.chain().focus().insertContentAt({ from, to }, result.data.replacement).run();
    close();
  };

  const anchor = check?.sel ?? result?.sel ?? sel;
  const both = !!anchor && anchor.canCheck && anchor.canRewrite;
  const place = useMemo(() => {
    if (!anchor) return null;
    const vw = typeof window === 'undefined' ? 1280 : window.innerWidth;
    const vh = typeof window === 'undefined' ? 800 : window.innerHeight;
    const coarse = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;
    const buttons = (anchor.canCheck ? 1 : 0) + (anchor.canRewrite ? 3 : 0);
    const barW = Math.min(buttons === 4 ? 470 : buttons === 1 ? 200 : 380, vw - 16);
    // Four buttons wrap into two rows on a narrow screen.
    const barH = buttons === 4 && vw < 480 ? 110 : 58;
    const cardW = Math.min(check ? CHECK_WIDTH : POPOVER_WIDTH, vw - 16);
    const cardH = check ? Math.min(560, vh * 0.75) : 320;
    const clampX = (w: number) => Math.max(8, Math.min(vw - w - 8, anchor.centre - w / 2));
    // The bar sits above the selection, or below it on touch screens (the
    // system menu is above) and when it would land on the formatting toolbar.
    const toolbarBottom = document.querySelector('[role="toolbar"][aria-label="Formatting"]')?.getBoundingClientRect().bottom ?? 70;
    const barTop = coarse || anchor.top - barH < toolbarBottom + 6 ? Math.min(anchor.bottom + 10, vh - barH - 8) : anchor.top - barH;
    const below = anchor.bottom + 12;
    const cardTop = below + cardH > vh ? Math.max(8, Math.min(anchor.top - 12 - cardH, vh - cardH - 8)) : below;
    return { bar: { top: barTop, left: clampX(barW), width: barW }, card: { top: cardTop, left: clampX(cardW), width: cardW, maxHeight: cardH } };
  }, [anchor, check]);

  if (!editor || !place) return null;

  if (check || result || error) {
    return (
      <div
        ref={cardRef}
        role="dialog"
        aria-label={check ? 'Notes on this passage' : result ? RESULT_TITLE[result.data.kind] : 'Writing help'}
        className="ws-rise fixed z-[70] flex flex-col gap-3 overflow-y-auto rounded-[22px] border border-[#E4D4F8] bg-white p-4 shadow-[0_30px_60px_-20px_rgba(42,21,64,0.55)] dark:border-stone-700 dark:bg-stone-900"
        style={{ ...FONT, top: place.card.top, left: place.card.left, width: place.card.width, maxHeight: place.card.maxHeight }}
      >
        {check ? (
          <>
            <div className="flex items-center gap-2.5">
              <img src="/icons/check-paragraph.webp" alt="" width={36} height={36} className="h-9 w-9 shrink-0 object-contain" />
              <h3 className="m-0 text-[18px] font-black text-stone-900 dark:text-stone-50">Notes on this passage</h3>
            </div>
            <CheckCard
              editor={editor}
              data={check.data}
              near={check.sel.from}
              plan={plan}
              busy={busy === 'check'}
              onAgain={checkAgain}
              onClose={close}
              onUpgrade={onUpgrade}
              bare
            />
            {error && <LimitNote error={error} onUpgrade={onUpgrade} source="writing_help_limit" />}
          </>
        ) : result ? (
          <>
            <h3 className="m-0 text-[18px] font-black text-stone-900 dark:text-stone-50">{RESULT_TITLE[result.data.kind]}</h3>
            <p className="m-0 rounded-2xl border border-[#BFE89A] bg-[#F4FCEB] p-3 text-[15.5px] font-extrabold leading-[1.5] text-stone-900 dark:border-[#3F6B1C] dark:bg-[#1F2E14] dark:text-stone-50">{result.data.replacement}</p>
            {result.data.why && (
              <p className="m-0 text-[14px] font-bold leading-[1.45] text-stone-600 dark:text-stone-300"><span className="font-black text-stone-900 dark:text-stone-50">Why:</span> {result.data.why}</p>
            )}
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={apply} className={`${BTN_GREEN} min-h-[48px] flex-[1_1_130px] rounded-[14px] px-4 text-[15.5px]`}>Use this</button>
              <button type="button" onClick={close} className={`${BTN_WHITE} min-h-[48px] flex-[1_1_130px] rounded-[14px] px-4 text-[15.5px]`}>Keep mine</button>
            </div>
          </>
        ) : error ? (
          <>
            <LimitNote error={error} onUpgrade={onUpgrade} source="writing_help_limit" />
            <button type="button" onClick={close} className={`${BTN_WHITE} min-h-[44px] self-start rounded-[14px] px-4 text-[15px]`}>Close</button>
          </>
        ) : null}
      </div>
    );
  }

  if (!sel) return null;
  const kinds = sel.canRewrite ? (Object.keys(KIND_LABEL) as Kind[]) : [];
  const btn = (primary: boolean) =>
    `inline-flex min-h-[44px] items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-2.5 text-[14px] text-white transition-colors disabled:opacity-70 ${primary ? 'bg-[#A560E8] font-black hover:bg-[#B070EE]' : 'font-extrabold hover:bg-white/10'}`;
  return (
    <div
      role="toolbar"
      aria-label="Help with the selected text"
      onMouseDown={(e) => e.preventDefault()}
      className={`ws-pop fixed z-[15] gap-1 rounded-2xl bg-[#2A1540] p-1.5 shadow-[0_18px_30px_-14px_rgba(42,21,64,0.7)] ${both ? 'grid grid-cols-2 min-[480px]:flex min-[480px]:items-center' : 'flex items-center justify-center'}`}
      style={{ ...FONT, top: place.bar.top, left: place.bar.left, width: place.bar.width }}
    >
      {sel.canCheck && (
        <button type="button" disabled={!!busy} onClick={() => void askCheck(sel)} className={`${btn(true)} flex-[1.25_1_0%]`}>
          {busy === 'check' ? <>{spinner} Reading…</> : <><img src="/icons/check-paragraph.webp" alt="" width={20} height={20} className="h-5 w-5 object-contain" /> Check this</>}
        </button>
      )}
      {kinds.map((k, n) => (
        <button key={k} type="button" disabled={!!busy} onClick={() => void ask(k)} className={`${btn(!sel.canCheck && n === 0)} flex-1`}>
          {busy === k ? <>{spinner} Thinking…</> : sel.canCheck ? KIND_SHORT[k] : KIND_LABEL[k]}
        </button>
      ))}
    </div>
  );
}
