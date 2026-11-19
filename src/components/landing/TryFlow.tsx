import { useEffect, useRef, useState } from 'react';
import FreeGradeGate, { type GateUser } from '../common/FreeGradeGate';
import { trackEvent } from '../../utils/analytics';
import { openUpgradePaywall } from '../../utils/paywall';
import { VERIFY_EMAIL_EVENT, type VerifyEmailDetail } from '../../utils/verifyEmail';
import {
  createStudyPack,
  packTitleOf,
  previewGrade,
  previewStudyPack,
  stashGradeToken,
  stashPreviewPack,
  PACK_VIEWER_KEY,
  type GradePreview,
  type PackRequest,
} from '../../utils/tryFirst';
import type { EssayFacts } from './HeroEssayGrader';
import WaitQuestions from './WaitQuestions';
import { BTN_GREEN, BTN_WHITE, EYEBROW, FONT } from './webStyle';

export type TryRequest =
  | { kind: 'pack'; req: PackRequest }
  | { kind: 'grade'; text: string; facts: EssayFacts };

interface TryFlowProps {
  /** What to make. Null keeps the overlay closed. */
  request: TryRequest | null;
  user?: { id?: string } | null;
  onClose: () => void;
  onNavigate: (page: string, slug?: string, options?: unknown) => void;
  /** Tell the app a new account exists (token and user are already stored). */
  onAuth?: (user: GateUser) => void;
  /** Open the essay on the analysis page (the account already exists). */
  onStartGrade: (text: string) => void;
}

type Stage = 'working' | 'grade' | 'limit' | 'error';

const PACK_STEPS = ['Reading what the exam is on', 'Writing your flashcards', 'Writing the practice quiz', 'Building the crossword and games'];
const GRADE_STEPS = ['Reading your essay start to finish', 'Scoring every rubric category', 'Writing comments on your sentences', 'Working out your grade'];

const readToken = (): string => {
  try { return localStorage.getItem('authToken') || ''; } catch { return ''; }
};

const labelOf = (key: string): string => {
  const s = key.replace(/_/g, ' ').trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
};

/**
 * Makes the visitor's first study pack or essay grade and shows it, with
 * no account. It covers the landing page while the work runs, asks the
 * wait-time questions, then:
 *   - a study pack opens in the real pack viewer, with a bar to save it;
 *   - an essay shows its grade and rubric scores here, and the full
 *     report (every comment) opens once they have a free account.
 * Someone already signed in skips the preview and gets the real thing.
 */
export default function TryFlow({ request, user, onClose, onNavigate, onAuth, onStartGrade }: TryFlowProps) {
  const [stage, setStage] = useState<Stage>('working');
  const [message, setMessage] = useState('');
  const [grade, setGrade] = useState<GradePreview | null>(null);
  const [gateOpen, setGateOpen] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  /** Guards against a result landing after the overlay was closed or restarted. */
  const runRef = useRef(0);

  const kind = request?.kind ?? 'pack';
  const door = kind === 'pack' ? 'exam' : 'essay';

  const openPack = (data: any, title: string) => {
    try { sessionStorage.setItem(PACK_VIEWER_KEY, JSON.stringify({ data, title })); } catch { /* ignore */ }
    onNavigate('study-pack-viewer', undefined, { studyPack: { data, title } });
  };

  const run = async (req: TryRequest, authed: boolean) => {
    const id = ++runRef.current;
    setStage('working');
    setMessage('');
    setElapsed(0);
    trackEvent('preview_started', { kind: req.kind, door: req.kind === 'pack' ? 'exam' : 'essay', source: authed ? 'account' : 'guest' });

    if (req.kind === 'pack') {
      if (authed) {
        const result = await createStudyPack(req.req, readToken());
        if (id !== runRef.current) return;
        if (result.ok) {
          trackEvent('pack_completed', { source: 'account', kind: req.req.inputType });
          try { localStorage.setItem('writescholar_has_study_pack', 'true'); } catch { /* ignore */ }
          openPack(result.data, packTitleOf(result.data, req.req.inputType === 'topic' ? req.req.input : 'Study pack'));
          return;
        }
        if (result.verifyEmail) {
          let email: string | null = null;
          try { email = JSON.parse(localStorage.getItem('user') || 'null')?.email ?? null; } catch { /* ignore */ }
          window.dispatchEvent(new CustomEvent<VerifyEmailDetail>(VERIFY_EMAIL_EVENT, { detail: { email, reason: 'verify' } }));
          onClose();
          return;
        }
        if (result.upgrade) {
          onClose();
          openUpgradePaywall('study_pack_limit');
          return;
        }
        trackEvent('preview_failed', { kind: 'pack', reason: String(result.status) });
        setMessage(result.message);
        setStage('error');
        return;
      }
      const result = await previewStudyPack(req.req);
      if (id !== runRef.current) return;
      if (result.ok) {
        trackEvent('preview_completed', { kind: 'pack', door: 'exam' });
        const title = stashPreviewPack(result.data, result.token, req.req);
        openPack(result.data, title);
        return;
      }
      trackEvent('preview_failed', { kind: 'pack', reason: result.limit ? 'limit' : 'error' });
      setMessage(result.message);
      setStage(result.limit ? 'limit' : 'error');
      return;
    }

    // Essay. A signed-in account goes straight to its real report.
    if (authed) {
      onStartGrade(req.text);
      return;
    }
    const result = await previewGrade(req.text);
    if (id !== runRef.current) return;
    if (result.ok) {
      trackEvent('preview_completed', { kind: 'grade', door: 'essay', grade: result.data.grade_estimate ?? '', score: result.data.overall_score ?? 0 });
      stashGradeToken(result.token);
      setGrade(result.data);
      setStage('grade');
      return;
    }
    trackEvent('preview_failed', { kind: 'grade', reason: result.limit ? 'limit' : 'error' });
    setMessage(result.message);
    setStage(result.limit ? 'limit' : 'error');
  };

  // Start whenever a new request arrives.
  useEffect(() => {
    if (!request) {
      runRef.current += 1;
      return;
    }
    setGrade(null);
    setGateOpen(false);
    void run(request, !!user?.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request]);

  // Clock for the progress bar and the step list.
  useEffect(() => {
    if (!request || stage !== 'working') return;
    const started = Date.now();
    const t = window.setInterval(() => setElapsed(Date.now() - started), 500);
    return () => window.clearInterval(t);
  }, [request, stage]);

  // Hold the page still behind the overlay.
  useEffect(() => {
    if (!request) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [request]);

  if (!request) return null;

  const close = () => {
    runRef.current += 1;
    onClose();
  };

  const handleAuthed = (gateUser: GateUser) => {
    setGateOpen(false);
    onAuth?.(gateUser);
    if (request.kind === 'grade') {
      // The grade token is already stored; the analysis page reuses it.
      onStartGrade(request.text);
      return;
    }
    // They hit the guest limit and signed up: build the pack on the account.
    void run(request, true);
  };

  // Eases towards 94% and never reaches it: the real finish closes the overlay.
  const expected = kind === 'pack' ? 45000 : 55000;
  const progress = Math.min(94, Math.round(94 * (1 - Math.exp(-elapsed / expected))) + 4);
  const steps = kind === 'pack' ? PACK_STEPS : GRADE_STEPS;
  const stepIdx = Math.min(steps.length - 1, Math.floor(elapsed / (expected / 2.6)));
  const subject = request.kind === 'pack'
    ? (request.req.inputType === 'topic' ? request.req.input : 'Your notes')
    : (request.facts.fileName || `${request.facts.words.toLocaleString()} words`);

  const rubric = grade?.grade_rubric ? Object.entries(grade.grade_rubric).filter(([, v]) => v && typeof v === 'object' && typeof (v as any).score === 'number') : [];
  const c = grade?.comments;

  const gradeHeader = grade ? (
    <div className="flex items-center gap-3.5 pr-10">
      <span className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-b-4 border-[#D4A300] bg-[#FFC800] text-[26px] font-black text-[#5A4500]">
        {grade.grade_estimate?.split(/[\s(]/)[0] || '·'}
      </span>
      <div className="min-w-0">
        <p className={`m-0 ${EYEBROW}`}>Your report is ready</p>
        <p className="m-0 text-[17px] font-black leading-snug text-[#1C1917]">
          {typeof grade.overall_score === 'number' ? `${Math.round(grade.overall_score)} out of 100` : 'Graded'}
          {c ? ` · ${c.total} comments` : ''}
        </p>
      </div>
    </div>
  ) : undefined;

  return (
    <div className="fixed inset-0 z-[230] overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="try-flow-title" style={FONT}>
      <div className="absolute inset-0 min-h-full bg-[#2A1540]/80" aria-hidden />
      <div className="relative flex min-h-full items-center justify-center p-4 sm:p-6">
        <section className="relative w-full max-w-[600px] rounded-[28px] border border-[#E4D4F8] bg-white p-5 text-[#1C1917] shadow-[0_30px_70px_-30px_rgba(42,21,64,0.8)] sm:p-7">
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-[#E4D4F8] bg-white text-[#57534E] hover:bg-[#FBF8FF]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>

          {stage === 'working' && (
            <div className="flex flex-col gap-5" aria-live="polite">
              <div className="flex items-center gap-4 pr-10">
                <img src={kind === 'pack' ? '/mascot-study-still.webp' : '/mascot-paper-still.webp'} alt="" width={88} height={88} className="h-[88px] w-[88px] shrink-0 object-contain" />
                <div className="min-w-0">
                  <p className={`m-0 ${EYEBROW}`}>{kind === 'pack' ? 'Building your study pack' : 'Grading your essay'}</p>
                  <h2 id="try-flow-title" className="m-0 mt-0.5 truncate text-[22px] font-black leading-tight sm:text-[25px]">{subject}</h2>
                  <p className="m-0 mt-0.5 text-[14px] font-bold text-[#57534E]">{kind === 'pack' ? 'About a minute. Keep this tab open.' : 'About a minute. Keep this tab open.'}</p>
                </div>
              </div>

              <div>
                <div role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Progress" className="h-3.5 overflow-hidden rounded-full bg-[#F3EAFF]">
                  <div className="h-full rounded-full bg-[#A560E8] transition-[width] duration-700 ease-linear" style={{ width: `${progress}%` }} />
                </div>
                <ol className="m-0 mt-3 flex list-none flex-col gap-1.5 p-0 text-[14.5px] font-extrabold">
                  {steps.map((label, i) => (
                    <li key={label} className={`flex items-center gap-2.5 ${i > stepIdx ? 'text-[#A8A29E]' : 'text-[#1C1917]'}`}>
                      {i < stepIdx ? (
                        <span aria-hidden className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#58CC02] text-white">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>
                        </span>
                      ) : i === stepIdx ? (
                        <span aria-hidden className="inline-block h-5 w-5 shrink-0 animate-spin rounded-full border-[3px] border-[#A560E8] border-r-[#F3EAFF]" />
                      ) : (
                        <span aria-hidden className="inline-block h-5 w-5 shrink-0 rounded-full border-2 border-[#E7E5E4]" />
                      )}
                      {label}
                    </li>
                  ))}
                </ol>
              </div>

              <WaitQuestions door={door} />
            </div>
          )}

          {stage === 'grade' && grade && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-4 pr-10">
                <span className="inline-flex h-[88px] w-[88px] shrink-0 items-center justify-center rounded-[22px] border-2 border-b-[6px] border-[#D4A300] bg-[#FFC800] text-[40px] font-black leading-none text-[#5A4500]">
                  {grade.grade_estimate?.split(/[\s(]/)[0] || '·'}
                </span>
                <div className="min-w-0">
                  <p className={`m-0 ${EYEBROW}`}>Your estimated grade</p>
                  <h2 id="try-flow-title" className="m-0 mt-0.5 text-[26px] font-black leading-tight sm:text-[30px]">
                    {typeof grade.overall_score === 'number' ? `${Math.round(grade.overall_score)} out of 100` : grade.grade_estimate || 'Graded'}
                  </h2>
                  {grade.grade_estimate && <p className="m-0 mt-0.5 text-[14.5px] font-bold text-[#57534E]">{grade.grade_estimate}</p>}
                </div>
              </div>

              {rubric.length > 0 && (
                <ul className="m-0 flex list-none flex-col gap-2.5 rounded-[20px] border border-[#E4D4F8] bg-[#FBF8FF] p-4">
                  {rubric.map(([key, v]) => {
                    const entry = v as { score: number; max_score?: number };
                    const max = typeof entry.max_score === 'number' && entry.max_score > 0 ? entry.max_score : 20;
                    return (
                      <li key={key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1">
                        <span className="text-[14.5px] font-extrabold leading-snug">{labelOf(key)}</span>
                        <span className="text-[14px] font-black tabular-nums">{entry.score} of {max}</span>
                        <span aria-hidden className="col-span-2 h-2.5 overflow-hidden rounded-full bg-[#F3EAFF]">
                          <span className="block h-full rounded-full bg-[#A560E8]" style={{ width: `${Math.max(4, Math.min(100, (entry.score / max) * 100))}%` }} />
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}

              {c && c.total > 0 && (
                <div>
                  <p className="m-0 text-[16px] font-black">
                    {c.total} comments on your sentences are ready{grade.fixes > 0 ? `, with ${grade.fixes} ${grade.fixes === 1 ? 'fix' : 'fixes'} to do first` : ''}.
                  </p>
                  <ul className="m-0 mt-2 flex list-none flex-wrap gap-2 p-0 text-[13.5px] font-extrabold">
                    {c.concern > 0 && <li className="inline-flex items-center gap-1.5 rounded-full bg-[#FEE2E2] px-3 py-1 text-[#7F1D1D]"><span aria-hidden className="h-2.5 w-2.5 rounded-full bg-[#DC2626]" />{c.concern} serious {c.concern === 1 ? 'concern' : 'concerns'}</li>}
                    {c.improve > 0 && <li className="inline-flex items-center gap-1.5 rounded-full bg-[#FEF3C7] px-3 py-1 text-[#713F12]"><span aria-hidden className="h-2.5 w-2.5 rounded-full bg-[#D97706]" />{c.improve} to improve</li>}
                    {c.strong > 0 && <li className="inline-flex items-center gap-1.5 rounded-full bg-[#DCFCE7] px-3 py-1 text-[#14532D]"><span aria-hidden className="h-2.5 w-2.5 rounded-full bg-[#15803D]" />{c.strong} strong {c.strong === 1 ? 'point' : 'points'}</li>}
                  </ul>
                </div>
              )}

              <button
                type="button"
                onClick={() => { trackEvent('preview_save_click', { kind: 'grade' }); setGateOpen(true); }}
                className={`min-h-[60px] w-full text-[19px] ${BTN_GREEN}`}
              >
                See every comment, free
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </button>
              <p className="m-0 -mt-2 text-center text-[13px] font-bold text-[#78716C]">
                Your first report is complete and free. No card. The grade is an estimate to guide your revision.
              </p>
            </div>
          )}

          {(stage === 'limit' || stage === 'error') && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4 pr-10">
                <img src="/mascot-thinking-still.webp" alt="" width={80} height={80} className="h-20 w-20 shrink-0 object-contain" />
                <div className="min-w-0">
                  <h2 id="try-flow-title" className="m-0 text-[23px] font-black leading-tight sm:text-[26px]">
                    {stage === 'limit' ? 'Sign up free to keep going' : 'That did not work'}
                  </h2>
                  <p className="m-0 mt-1 text-[15px] font-bold leading-snug text-[#57534E]">{message}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2.5 sm:flex-row">
                {stage === 'limit' ? (
                  <button type="button" onClick={() => setGateOpen(true)} className={`min-h-[56px] flex-1 text-[17px] ${BTN_GREEN}`}>
                    Sign up free
                  </button>
                ) : (
                  <button type="button" onClick={() => void run(request, !!user?.id || !!readToken())} className={`min-h-[56px] flex-1 text-[17px] ${BTN_GREEN}`}>
                    Try again
                  </button>
                )}
                <button type="button" onClick={close} className={`min-h-[56px] flex-1 text-[16px] ${BTN_WHITE}`}>
                  Back
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      <FreeGradeGate
        open={gateOpen}
        words={request.kind === 'grade' ? request.facts.words : 0}
        onClose={() => setGateOpen(false)}
        onAuthed={handleAuthed}
        header={request.kind === 'grade' ? gradeHeader : (
          <div className="flex items-center gap-3.5 pr-10">
            <img src="/mascot-study-still.webp" alt="" width={64} height={64} className="h-16 w-16 shrink-0 object-contain" />
            <div className="min-w-0">
              <p className={`m-0 ${EYEBROW}`}>Free account</p>
              <p className="m-0 truncate text-[17px] font-black leading-snug text-[#1C1917]">{subject}</p>
            </div>
          </div>
        )}
        copy={request.kind === 'grade' ? {
          title: 'Save your report to see every comment',
          body: `Your full report is ready${c ? `, all ${c.total} comments` : ''}. Make a free account so you can come back to it. No card.`,
          cta: 'Show my full report',
          loginTitle: 'Welcome back. Log in to see this report.',
          loginCta: 'Log in and show my report',
        } : {
          title: 'Make a free account to build this pack',
          body: 'You get 3 free study packs or essay grades a month. No card.',
          cta: 'Build my study pack',
          loginTitle: 'Welcome back. Log in to build this pack.',
          loginCta: 'Log in and build my pack',
          footnote: 'Free. We email you a link to verify your account. Your notes are never used to train AI.',
        }}
      />
    </div>
  );
}
