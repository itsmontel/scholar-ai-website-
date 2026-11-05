/** What the server says about the hidden part of a free grade (analysisRedaction.js). */
export interface FreePreviewInfo {
  share: number;
  cutoffIndex: number;
  hidden: { total: number; strong: number; improve: number; concern: number };
  rubricFeedbackLocked: number;
  topSuggestionsLocked: number;
}

export function readFreePreview(value: unknown): FreePreviewInfo | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Partial<FreePreviewInfo>;
  if (typeof v.cutoffIndex !== 'number' || !v.hidden || typeof v.hidden !== 'object') return null;
  return {
    share: typeof v.share === 'number' ? v.share : 0.25,
    cutoffIndex: v.cutoffIndex,
    hidden: {
      total: Number(v.hidden.total) || 0,
      strong: Number(v.hidden.strong) || 0,
      improve: Number(v.hidden.improve) || 0,
      concern: Number(v.hidden.concern) || 0,
    },
    rubricFeedbackLocked: Number(v.rubricFeedbackLocked) || 0,
    topSuggestionsLocked: Number(v.topSuggestionsLocked) || 0,
  };
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * Sits in the essay where a free grade's marked-up part ends. Below it the
 * essay is plain text; this says what is waiting there so the gap reads as
 * "locked", not "WriteScholar only read the first page".
 */
export default function FreePreviewDivider({ info, onUnlock }: { info: FreePreviewInfo; onUnlock: () => void }) {
  const { hidden } = info;
  const percent = Math.round((1 - info.share) * 100);
  return (
    <div
      className="my-6 rounded-[20px] border-2 border-[#1C1917] bg-white p-4 text-left sm:p-5"
      style={{ boxShadow: '5px 5px 0 #7733B5', fontFamily: '"Nunito", system-ui, sans-serif' }}
      role="note"
      aria-label="The rest of this report is part of Pro"
    >
      <div className="flex items-start gap-3">
        <span aria-hidden className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-[#1C1917] bg-[#F3EEFF]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7733B5" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
        </span>
        <div className="min-w-0">
          <p className="m-0 text-[16px] font-black leading-snug text-[#1C1917] sm:text-[17px]">
            Your grade covers the whole essay. The other {percent}% has {plural(hidden.total, 'comment', 'comments')} waiting.
          </p>
          <p className="m-0 mt-1 text-[13.5px] font-bold text-[#57534E]">Everything below this line is unmarked on the free plan.</p>
        </div>
      </div>

      <ul className="mt-3 flex flex-wrap gap-2 p-0 text-[13px] font-black text-[#1C1917]" style={{ listStyle: 'none' }}>
        {hidden.concern > 0 && (
          <li className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#1C1917] bg-[#FEE2E2] px-3 py-1">
            <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-[#DC2626]" />
            {plural(hidden.concern, 'serious concern', 'serious concerns')}
          </li>
        )}
        {hidden.improve > 0 && (
          <li className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#1C1917] bg-[#FEF3C7] px-3 py-1">
            <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-[#D97706]" />
            {plural(hidden.improve, 'needs work', 'need work')}
          </li>
        )}
        {hidden.strong > 0 && (
          <li className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#1C1917] bg-[#DCFCE7] px-3 py-1">
            <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-[#15803D]" />
            {plural(hidden.strong, 'strong point', 'strong points')}
          </li>
        )}
      </ul>

      <button
        type="button"
        onClick={onUnlock}
        className="mt-4 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[14px] border-2 border-[#1C1917] bg-[#58CC02] px-5 text-[16px] font-black text-[#1C1917] transition-all hover:bg-[#61E002] active:translate-x-px active:translate-y-px sm:w-auto"
        style={{ boxShadow: '4px 4px 0 #1C1917' }}
      >
        Unlock the full report
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12h14M13 6l6 6-6 6" /></svg>
      </button>
    </div>
  );
}
