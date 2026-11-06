import type { ReactNode } from 'react';
import HeroEssayGrader from '../landing/HeroEssayGrader';

interface FirstGradeHomeProps {
  userName: string;
  /** Credits pill, avatar and friends: the same top bar as the full dashboard. */
  topBar?: ReactNode;
  /** Called with the essay once the paste box has read it. */
  onGrade: (text: string) => void;
  /** "Show my full dashboard": leave this view for good on this device. */
  onSkip: () => void;
}

const STEPS = [
  { n: '1', title: 'Paste or upload', body: 'Your whole essay, 200 to 10,000 words. A .docx works too.' },
  { n: '2', title: 'Get your grade', body: 'An estimated grade and a score for every rubric category in about a minute.' },
  { n: '3', title: 'See what to fix', body: 'Line-by-line notes on what is strong, what needs work and what costs you marks.' },
];

/**
 * Home for a free account that has not graded an essay yet. The full
 * dashboard has a lot on it; until the first grade, the only job of this
 * page is to get one essay in. Once an essay has a grade, the normal
 * dashboard takes over (see DocumentsPage, showFirstGradeHome).
 */
export default function FirstGradeHome({ userName, topBar, onGrade, onSkip }: FirstGradeHomeProps) {
  const font = { fontFamily: '"Nunito", system-ui, sans-serif' } as const;
  return (
    <div className="mx-auto w-full max-w-[860px] pb-12" style={font}>
      {topBar && <div className="mb-6 flex items-center justify-end gap-2">{topBar}</div>}

      <div className="flex flex-col items-center gap-4 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border-2 border-[#1C1917] bg-[#DCFCE7] px-3.5 py-1.5 text-[12.5px] font-black uppercase tracking-[0.08em] text-[#1C1917]">
          <span className="inline-block h-2 w-2 rounded-full bg-[#15803D]" aria-hidden />
          Your first grade is free
        </span>
        <h1 className="m-0 text-[2rem] font-black leading-[1.05] tracking-[-0.02em] text-[#1C1917] dark:text-stone-50 sm:text-[2.6rem]">
          {userName ? (
            <>Let&apos;s grade your first essay, <span className="text-[#7733B5] dark:text-[#C9A0F0]">{userName}</span></>
          ) : (
            <>Let&apos;s grade your first essay</>
          )}
        </h1>
        <p className="m-0 max-w-[40rem] text-[16px] font-bold leading-[1.45] text-[#57534E] dark:text-stone-400 sm:text-[17px]">
          Paste it below or upload a .docx. In about a minute you&apos;ll see your estimated grade, every rubric score and what to fix first.
        </p>
      </div>

      <div className="mt-7">
        <HeroEssayGrader onSubmit={(text) => onGrade(text)} />
      </div>

      <ol className="mt-8 grid grid-cols-1 gap-3 p-0 sm:grid-cols-3" style={{ listStyle: 'none' }}>
        {STEPS.map((s) => (
          <li key={s.n} className="flex gap-3 rounded-[16px] border-2 border-[#1C1917] bg-white p-4 dark:border-stone-600 dark:bg-stone-900">
            <span
              aria-hidden
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-[#1C1917] bg-[#A560E8] text-[15px] font-black text-white"
            >
              {s.n}
            </span>
            <span className="min-w-0">
              <span className="block text-[15px] font-black text-[#1C1917] dark:text-stone-50">{s.title}</span>
              <span className="mt-0.5 block text-[13px] font-semibold leading-snug text-[#57534E] dark:text-stone-400">{s.body}</span>
            </span>
          </li>
        ))}
      </ol>

      <p className="mt-6 text-center text-[13.5px] font-bold text-[#78716C] dark:text-stone-500">
        Want to look around first?{' '}
        <button
          type="button"
          onClick={onSkip}
          className="font-extrabold text-[#7733B5] underline decoration-2 underline-offset-[3px] hover:text-[#5F2594] dark:text-[#C9A0F0]"
        >
          Show my full dashboard
        </button>
      </p>
    </div>
  );
}
