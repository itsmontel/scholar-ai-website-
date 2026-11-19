import { stashPendingEssay } from './FreeGradeGate';
import { BTN_GREEN, BTN_WHITE, CARD, FONT } from '../landing/webStyle';
import { FREE_GRADE_FLOW_KEY, FREE_GRADE_MAX_WORDS, FREE_GRADE_MIN_WORDS } from '../../config/pricing';
import { rememberDoor, stashPendingNotes } from '../../utils/tryFirst';
import { trackEvent } from '../../utils/analytics';

interface ToolNextStepProps {
  /** The text already in the tool. */
  text: string;
  /** Which tool this sits under, for the event. */
  tool: string;
  onNavigate: (page: string) => void;
  signedIn?: boolean;
}

const NOTES_MIN_WORDS = 50;
const NOTES_MAX_WORDS = 5000;

const countWords = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

/**
 * Sits under a free tool once it has real text in it. The free tools get
 * most of the site's search impressions and used to lead nowhere: this
 * offers the two things WriteScholar does with the same text, and carries
 * the text across so nothing has to be pasted twice.
 *
 * Renders nothing until there is enough text to do either.
 */
export default function ToolNextStep({ text, tool, onNavigate, signedIn = false }: ToolNextStepProps) {
  const words = countWords(text);
  if (words < NOTES_MIN_WORDS) return null;

  const canGrade = words >= FREE_GRADE_MIN_WORDS && words <= FREE_GRADE_MAX_WORDS;
  const canPack = words <= NOTES_MAX_WORDS;

  const grade = () => {
    trackEvent('tool_next_step', { source: tool, kind: 'grade', words });
    rememberDoor('essay');
    if (signedIn) {
      // An account goes straight to its report.
      try {
        localStorage.setItem('textAnalysisContent', text.trim());
        localStorage.removeItem('viewAnalysisDocumentId');
        localStorage.removeItem('viewAnalysisType');
        localStorage.removeItem('freshUploadDocumentId');
        localStorage.removeItem('selectedDocumentId');
        sessionStorage.setItem(FREE_GRADE_FLOW_KEY, '1');
      } catch { /* ignore */ }
      onNavigate('analysis');
      return;
    }
    // The landing page's essay box picks this up, already filled in.
    stashPendingEssay(text.trim(), { words, fileName: null });
    onNavigate('landing');
  };

  const study = () => {
    trackEvent('tool_next_step', { source: tool, kind: 'pack', words });
    rememberDoor('exam');
    stashPendingNotes(text.trim());
    onNavigate('landing');
  };

  return (
    <section aria-label="What to do next with this text" className="py-10 sm:py-12" style={FONT}>
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <h2 className="m-0 text-[22px] font-black leading-tight tracking-[-0.01em] text-stone-900 dark:text-stone-50 sm:text-[26px]">
          {canGrade
            ? `You have ${words.toLocaleString()} words. Want to know what they would score?`
            : `You have ${words.toLocaleString()} words. Here is what else you can do with them.`}
        </h2>
        <p className="m-0 mt-1.5 text-[15.5px] font-bold text-stone-600 dark:text-stone-400">
          Your text comes with you, so there is nothing to paste again. Free to start, no card needed.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className={`flex gap-3.5 p-5 ${CARD} !border-2 !border-[#A560E8] dark:bg-stone-900`}>
            <img src="/mascot-paper-still.webp" alt="" width={76} height={76} loading="lazy" className="h-[76px] w-[76px] shrink-0 object-contain" />
            <div className="flex min-w-0 flex-col items-start gap-2">
              <h3 className="m-0 text-[19px] font-black leading-tight text-stone-900 dark:text-stone-50">It is an essay: grade it</h3>
              <p className="m-0 text-[14.5px] font-bold leading-snug text-stone-600 dark:text-stone-400">
                {canGrade
                  ? 'An estimated grade, every rubric score and line-by-line comments in about a minute.'
                  : words < FREE_GRADE_MIN_WORDS
                    ? `Grading needs at least ${FREE_GRADE_MIN_WORDS} words. Add ${FREE_GRADE_MIN_WORDS - words} more and this unlocks.`
                    : `Free grades cover up to ${FREE_GRADE_MAX_WORDS.toLocaleString()} words. Grade one section at a time.`}
              </p>
              <button type="button" onClick={grade} disabled={!canGrade} className={`min-h-[50px] px-5 text-[16px] ${BTN_GREEN}`}>
                Grade these {words.toLocaleString()} words
              </button>
            </div>
          </div>

          <div className={`flex gap-3.5 p-5 ${CARD} dark:border-stone-700 dark:bg-stone-900`}>
            <img src="/mascot-study-still.webp" alt="" width={76} height={76} loading="lazy" className="h-[76px] w-[76px] shrink-0 object-contain" />
            <div className="flex min-w-0 flex-col items-start gap-2">
              <h3 className="m-0 text-[19px] font-black leading-tight text-stone-900 dark:text-stone-50">They are notes: study them</h3>
              <p className="m-0 text-[14.5px] font-bold leading-snug text-stone-600 dark:text-stone-400">
                {canPack
                  ? 'Flashcards, a practice quiz, a crossword and three games made from the same text.'
                  : `Study packs take up to ${NOTES_MAX_WORDS.toLocaleString()} words. Use one lecture or chapter.`}
              </p>
              <button type="button" onClick={study} disabled={!canPack} className={`min-h-[50px] px-5 text-[16px] ${BTN_WHITE}`}>
                Make a study pack
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
