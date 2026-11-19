import { useMemo, useState } from 'react';
import { trackEvent } from '../../utils/analytics';
import { readAnswers, saveAnswer, type Door, type OnboardingAnswers } from '../../utils/tryFirst';
import { EYEBROW } from './webStyle';

type QuestionKey = 'deadline' | 'due' | 'level' | 'referralSource';

interface Question {
  key: QuestionKey;
  ask: string;
  options: { value: string; label: string }[];
}

const DEADLINE: Question = {
  key: 'deadline',
  ask: 'When is your exam?',
  options: [
    { value: 'week', label: 'This week' },
    { value: 'twoweeks', label: 'Next week' },
    { value: 'month', label: 'In 2 to 4 weeks' },
    { value: 'later', label: 'Later than that' },
    { value: 'none', label: 'No date yet' },
  ],
};

const DUE: Question = {
  key: 'due',
  ask: 'When is it due?',
  options: [
    { value: 'today', label: 'Today' },
    { value: 'tomorrow', label: 'Tomorrow' },
    { value: 'week', label: 'This week' },
    { value: 'later', label: 'Later than that' },
    { value: 'none', label: 'Already handed in' },
  ],
};

const LEVEL: Question = {
  key: 'level',
  ask: 'What level are you at?',
  options: [
    { value: 'highschool', label: 'High school' },
    { value: 'underclass', label: 'First or second year' },
    { value: 'upperclass', label: 'Third year or above' },
    { value: 'masters', label: 'Postgraduate' },
  ],
};

const SOURCE: Question = {
  key: 'referralSource',
  ask: 'How did you hear about us?',
  options: [
    { value: 'reddit', label: 'Reddit' },
    { value: 'google', label: 'Google' },
    { value: 'tiktok', label: 'TikTok' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'youtube', label: 'YouTube' },
    { value: 'friend', label: 'A friend' },
    { value: 'other', label: 'Somewhere else' },
  ],
};

/**
 * Up to three one-tap questions, shown while a study pack or a grade is
 * being made so they cost the visitor no extra time. Each answer either
 * shapes what they get (the exam date sets the countdown, the level sets
 * the difficulty) or tells us where students come from. Everything is
 * skippable and nothing here blocks the result.
 *
 * Answers go to localStorage and reach the account after sign-up
 * (flushAnswers in utils/tryFirst.ts).
 */
export default function WaitQuestions({ door }: { door: Door }) {
  // Only what this device has not answered yet, fixed for this visit.
  const questions = useMemo(() => {
    const have = readAnswers();
    return [door === 'exam' ? DEADLINE : DUE, LEVEL, SOURCE].filter((q) => !have[q.key as keyof OnboardingAnswers]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [index, setIndex] = useState(0);

  if (questions.length === 0 || index >= questions.length) {
    return (
      <p className="m-0 rounded-2xl bg-[#F7F1FF] px-4 py-3 text-center text-[14.5px] font-extrabold text-[#57534E]">
        {questions.length === 0 ? 'Nearly there. Scholar is still working on it.' : 'Thanks. That helps Scholar set this up for you.'}
      </p>
    );
  }

  const q = questions[index];
  const answer = (value: string) => {
    saveAnswer({ door, [q.key]: value } as OnboardingAnswers);
    trackEvent('onboarding_answer', { question: q.key, answer: value, door });
    setIndex((i) => i + 1);
  };

  return (
    <div className="rounded-[20px] border border-[#E4D4F8] bg-[#FBF8FF] p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className={`m-0 ${EYEBROW}`}>While you wait · {index + 1} of {questions.length}</p>
        <button
          type="button"
          onClick={() => setIndex((i) => i + 1)}
          className="inline-flex min-h-[44px] items-center px-2 text-[13.5px] font-extrabold text-[#78716C] underline decoration-2 underline-offset-[3px] hover:text-[#1C1917]"
        >
          Skip
        </button>
      </div>
      <p id={`wait-q-${q.key}`} className="m-0 mt-1 text-[19px] font-black leading-snug text-[#1C1917] sm:text-[21px]">{q.ask}</p>
      <div role="group" aria-labelledby={`wait-q-${q.key}`} className="mt-3 flex flex-wrap gap-2">
        {q.options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => answer(o.value)}
            className="inline-flex min-h-[48px] items-center rounded-2xl border-2 border-b-4 border-[#E4D4F8] bg-white px-4 text-[15px] font-extrabold text-[#1C1917] transition-all hover:-translate-y-0.5 hover:border-[#C9A0F0] hover:bg-[#F3EAFF] active:translate-y-0.5 active:border-b-2"
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
