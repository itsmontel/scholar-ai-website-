import type { ReactNode } from 'react';
import LandingScrollReveal from './LandingScrollReveal';
import { BTN_GREEN, BTN_WHITE, EYEBROW, FONT } from './webStyle';

/**
 * The Essay Writer: plan, write, check, cite. Real screens, real wording.
 * Every line here describes something the editor does today, and the screens
 * are captures of it (marketing/landing-shots/capture.cjs).
 */
interface LandingEssayWriterSectionProps {
  onNavigate: (page: string) => void;
}

/** Send the visitor back up to the box at the top of the page, in Write mode. */
const askToWrite = () => window.dispatchEvent(new CustomEvent('writescholar-hero-ask', { detail: { ask: 'write' } }));

const tick = (
  <svg className="mt-[3px] h-[18px] w-[18px] shrink-0 text-[#58CC02]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12l5 5L20 7" /></svg>
);

const STYLES = ['APA', 'MLA', 'Chicago', 'Harvard', 'IEEE', 'Vancouver'];

interface Step {
  n: number;
  title: string;
  lead: string;
  points: string[];
  /** A tall, narrow screen: shown centred on a lilac panel instead of filling the frame. */
  image: { src: string; w: number; h: number; alt: string; portrait?: boolean };
  extra?: ReactNode;
}

const STEPS: Step[] = [
  {
    n: 1,
    title: 'Plan it',
    lead: 'Paste your essay question. Four quick taps, then you have an outline with a word budget for every paragraph.',
    points: [
      'Pick the kind of essay, your citation style, the word count and your rubric.',
      'Upload the rubric as a PDF or Word file, or paste it, and the outline follows what your marker asks for.',
      'Choose one of three thesis ideas, or write your own.',
    ],
    image: { src: '/landing/writer-plan.webp', w: 1400, h: 1222, alt: 'The essay writer showing a chosen thesis and a five-part outline, each part with its own word budget.' },
  },
  {
    n: 2,
    title: 'Write it, with a nudge when you are stuck',
    lead: 'You write the essay. Scholar helps with the hard moments, and never writes it for you.',
    points: [
      'Stuck on a paragraph? Get two ways to open it, plus questions to think about.',
      'Select a sentence and make it clearer, shorter or more formal.',
      'Your outline sits beside the draft and shows how far you are on each paragraph.',
    ],
    image: { src: '/landing/writer-starters.webp', w: 1400, h: 947, alt: 'The writing page with the outline on the right and two suggested ways to start a paragraph.' },
  },
  {
    n: 3,
    title: 'Check each paragraph as you finish it',
    lead: 'Do not wait for the whole draft. Finish a paragraph and see what is working and what to fix.',
    points: [
      'A verdict on the paragraph, in seconds.',
      'What you did well, and one or two specific fixes.',
      'Checking and writing help use no credits.',
    ],
    image: { src: '/landing/writer-check.webp', w: 624, h: 856, alt: 'A paragraph check card saying the paragraph is nearly there, with what is working and two fixes.', portrait: true },
  },
  {
    n: 4,
    title: 'Cite as you go',
    lead: 'Type in a source you have read and it is formatted for you, in the text and in the reference list. It never suggests or invents a source.',
    points: [
      'The reference list builds itself and keeps its order.',
      'Change style at any point and everything already in your essay changes with it.',
      'IEEE and Vancouver renumber on their own as you add and move citations.',
    ],
    extra: (
      <ul className="m-0 flex list-none flex-wrap gap-2 p-0" aria-label="Citation styles">
        {STYLES.map((s) => (
          <li key={s} className="inline-flex min-h-[36px] items-center rounded-full border-2 border-[#E4D4F8] bg-white px-3.5 text-[14px] font-extrabold text-[#5B2491]">{s}</li>
        ))}
      </ul>
    ),
    image: { src: '/landing/writer-cite.webp', w: 820, h: 1620, alt: 'The Cite a source window with MLA chosen, two sources already added, and a preview of how a new citation will look in the sentence and in the list.', portrait: true },
  },
];

function StepRow({ step, flip }: { step: Step; flip: boolean }) {
  return (
    <div className="grid items-center gap-7 lg:grid-cols-12 lg:gap-12">
      <div className={`lg:col-span-5 ${flip ? 'lg:order-2' : ''}`}>
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-b-4 border-[#8A48C7] bg-[#A560E8] text-[19px] font-black text-white" aria-hidden>{step.n}</span>
          <span className={EYEBROW}>Step {step.n}</span>
        </div>
        <h3 className="m-0 mt-3 text-[26px] font-black leading-[1.15] tracking-[-0.01em] text-[#2A1540] dark:text-white sm:text-[32px]">{step.title}</h3>
        <p className="m-0 mt-3 text-[17px] font-bold leading-[1.5] text-stone-600 dark:text-stone-300">{step.lead}</p>
        <ul className="m-0 mt-5 flex list-none flex-col gap-3 p-0">
          {step.points.map((p) => (
            <li key={p} className="flex gap-2.5 text-[16px] font-bold leading-[1.45] text-stone-800 dark:text-stone-100">{tick}<span>{p}</span></li>
          ))}
        </ul>
        {step.extra && <div className="mt-5">{step.extra}</div>}
      </div>
      <div className={`lg:col-span-7 ${flip ? 'lg:order-1' : ''}`}>
        <div className="rounded-[26px] border border-[#E4D4F8] bg-white p-2.5 shadow-[0_2px_4px_rgba(60,40,90,0.04),0_22px_50px_-34px_rgba(90,45,140,0.55)] dark:border-stone-700 dark:bg-stone-900 sm:p-3.5">
          <div className={`overflow-hidden rounded-[18px] border border-[#EFE5FA] dark:border-stone-700 ${step.image.portrait ? 'bg-[#F3EAFF] py-5 sm:py-6' : ''}`}>
            <img
              src={step.image.src}
              width={step.image.w}
              height={step.image.h}
              alt={step.image.alt}
              loading="lazy"
              decoding="async"
              className={`block h-auto ${step.image.portrait ? 'mx-auto w-full max-w-[340px] sm:max-w-[360px]' : 'w-full'}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingEssayWriterSection({ onNavigate }: LandingEssayWriterSectionProps) {
  return (
    <section id="essay-writer-section" aria-labelledby="essay-writer-heading" className="relative scroll-mt-24 bg-[#F7F1FF] py-16 dark:bg-[#1A0B2E] sm:py-24" style={FONT}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <LandingScrollReveal>
          <div className="mx-auto mb-12 max-w-3xl text-center sm:mb-16">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#58CC02] px-3 py-1 text-[12px] font-black uppercase tracking-[0.14em] text-white">New</span>
            <p className={`${EYEBROW} m-0 mt-3`}>Essay Writer</p>
            <h2 id="essay-writer-heading" className="m-0 mt-2 text-[34px] font-black leading-[1.08] tracking-[-0.02em] text-[#2A1540] dark:text-white sm:text-[48px] lg:text-[56px]">
              From a blank page to <span className="text-[#8A48C7]">a finished essay</span>
            </h2>
            <p className="m-0 mx-auto mt-4 max-w-2xl text-[18px] font-bold leading-[1.5] text-stone-600 dark:text-stone-300 sm:text-[20px]">
              Plan it, write it, check it and cite it in one place. Scholar helps at every step. You do the writing.
            </p>
          </div>
        </LandingScrollReveal>

        <div className="flex flex-col gap-16 sm:gap-24">
          {STEPS.map((step, i) => (
            <LandingScrollReveal key={step.n}>
              <StepRow step={step} flip={i % 2 === 1} />
            </LandingScrollReveal>
          ))}
        </div>

        <LandingScrollReveal>
          <div className="mx-auto mt-16 flex max-w-3xl flex-col items-center gap-4 text-center sm:mt-24">
            <ul className="m-0 flex list-none flex-wrap justify-center gap-2 p-0" aria-label="Also in the editor">
              {['Word in, Word out', 'PDF export', 'Saves as you type'].map((t) => (
                <li key={t} className="inline-flex min-h-[38px] items-center rounded-full bg-white px-4 text-[14.5px] font-extrabold text-[#5B2491] ring-1 ring-[#E4D4F8] dark:bg-stone-900 dark:text-[#C9A0F0] dark:ring-stone-700">{t}</li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button type="button" onClick={askToWrite} className={`${BTN_GREEN} min-h-[58px] px-8 text-[18px]`}>Start an essay free</button>
              <button type="button" onClick={() => onNavigate('essay-writer')} className={`${BTN_WHITE} min-h-[58px] px-6 text-[16.5px]`}>How it works</button>
            </div>
            <p className="m-0 text-[14.5px] font-bold text-stone-500 dark:text-stone-400">Free accounts get 2 outlines and 10 writing helps a month. Pro and Premium get far more.</p>
          </div>
        </LandingScrollReveal>
      </div>
    </section>
  );
}
