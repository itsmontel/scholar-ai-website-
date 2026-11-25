import { useState } from 'react';
import { trackEvent } from '../../utils/analytics';
import { handOffEssayQuestion } from '../../utils/essayPlan';
import { rememberDoor, saveAnswer } from '../../utils/tryFirst';
import { stashWorkspaceView } from '../workspace/workspaceNavigate';
import { BTN_GREEN, FONT } from '../landing/webStyle';

/**
 * End-of-article box: paste the essay question you are working on and the
 * Essay Writer opens with it, ready for the outline questions. The same road
 * as the home page's "Write an essay" box, so nothing new on the other side.
 */
export default function BlogEssayQuestionBox({ onNavigate, source }: { onNavigate?: (page: string) => void; source: string }) {
  const [question, setQuestion] = useState('');
  const [hint, setHint] = useState('');
  const signedIn = (() => {
    try { return !!(localStorage.getItem('authToken') || localStorage.getItem('token')); } catch { return false; }
  })();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = question.trim();
    if (value.length < 12) { setHint('Paste your essay question first.'); return; }
    handOffEssayQuestion(value, 1500);
    saveAnswer({ stage: 'start' });
    rememberDoor('essay');
    stashWorkspaceView('write');
    trackEvent('door_selected', { door: 'essay', source: 'blog', where: source, typed: true });
    const next = signedIn ? 'dashboard' : 'signup';
    if (onNavigate) onNavigate(next);
    else window.location.href = `/${next}`;
  };

  return (
    <section aria-labelledby="blog-essay-box-title" className="not-prose my-10 overflow-hidden rounded-[26px] bg-[#7733B5] p-5 text-white sm:p-7" style={FONT}>
      <div className="flex items-start gap-4">
        <img src="/icons/write.webp" alt="" width={56} height={56} loading="lazy" className="hidden h-14 w-14 shrink-0 object-contain sm:block" />
        <div className="min-w-0">
          <h2 id="blog-essay-box-title" className="m-0 text-[22px] font-black leading-tight sm:text-[26px]">Writing an essay right now?</h2>
          <p className="m-0 mt-1.5 text-[15.5px] font-bold leading-[1.5] text-[#EBDDFB]">Paste the question. You get an outline with a word budget for every paragraph, and help when you are stuck. You still write it.</p>
        </div>
      </div>
      <form onSubmit={submit} className="mt-5 flex flex-col gap-3">
        <label htmlFor="blog-essay-question" className="sr-only">Your essay question</label>
        <textarea
          id="blog-essay-question"
          rows={2}
          maxLength={2000}
          value={question}
          onChange={(e) => { setQuestion(e.target.value); if (hint) setHint(''); }}
          placeholder="For example: To what extent was the Treaty of Versailles too harsh?"
          className="w-full resize-y rounded-[18px] border-2 border-transparent bg-white px-4 py-3 text-[16.5px] font-bold leading-[1.45] text-stone-900 placeholder:font-semibold placeholder:text-stone-400 focus:border-[#FFC800] focus:outline-none"
        />
        {hint && <p role="alert" className="m-0 text-[14.5px] font-extrabold text-[#FFE38A]">{hint}</p>}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <button type="submit" className={`${BTN_GREEN} min-h-[54px] px-6 text-[17px]`}>Start my essay free</button>
          <span className="text-[13.5px] font-bold text-[#EBDDFB]">Free account, no card.</span>
        </div>
      </form>
    </section>
  );
}
