import React from 'react';
import { FONT } from '../landing/webStyle';

/**
 * The site footer: the same dark footer as before, cleaned up. Five plain
 * columns grouped by what a student does, one link colour, no emoji. The guides
 * block at the bottom stays because it is the internal-link graph for the
 * programmatic SEO pages.
 */
interface FooterProps {
  onNavigate?: (page: string) => void;
}

interface FooterItem {
  label: string;
  href: string;
  /** SPA page key. Without one the link is an ordinary page load, which is what the crawler follows. */
  page?: string;
  title?: string;
  isNew?: boolean;
}

const PRODUCT: FooterItem[] = [
  { label: 'Features', href: '/features', page: 'features' },
  { label: 'Pricing', href: '/pricing', page: 'pricing' },
  { label: 'Blog', href: '/blog', page: 'blog' },
  { label: 'Why students choose', href: '/why-students-choose', page: 'why-students-choose' },
  { label: 'vs Quizlet & Knowt', href: '/vs-quizlet-knowt', page: 'study-tools-comparison' },
  { label: 'Focus Mode', href: '/focus-mode', page: 'focus-mode' },
];

const WRITE_GRADE: FooterItem[] = [
  { label: 'Essay Writer', href: '/essay-writer', page: 'essay-writer', title: 'Plan, write, check and cite an essay in one place', isNew: true },
  { label: 'Analyze Essay', href: '/tools/analyze', page: 'analyze' },
  { label: 'Essay Outline', href: '/tools/essay-outline', page: 'essay-outline', title: 'Essay outline generator — argumentative, research, and compare-contrast papers' },
  { label: 'Thesis Generator', href: '/tools/thesis-generator', page: 'thesis-generator', title: 'Thesis statement generator for argumentative and analytical essays' },
  { label: 'Citation Generator', href: '/tools/citation-generator', page: 'citation-generator-tool', title: 'Free citation generator for APA, MLA, Chicago, Harvard, IEEE and Vancouver' },
  { label: 'Grammar Checker', href: '/tools/grammar-checker', page: 'grammar-checker', title: 'Free grammar and spelling checker for college papers and assignments' },
  { label: 'Readability Checker', href: '/tools/readability-score', page: 'readability-score', title: 'Readability checker — Flesch-Kincaid and grade level for academic writing' },
  { label: 'Word Counter', href: '/tools/word-counter', page: 'word-counter', title: 'Free word counter for essays — characters, reading time, word limits' },
  { label: 'AI Summarizer', href: '/tools/summarizer', page: 'summarizer' },
];

const STUDY: FooterItem[] = [
  { label: 'Study Pack', href: '/tools/study-pack', page: 'study-pack' },
  { label: 'Quiz Generator', href: '/tools/quiz-generator', page: 'quiz-generator' },
  { label: 'Flashcards', href: '/tools/create-flashcards', page: 'create-flashcards' },
  { label: 'Crater Blast', href: '/tools/crater-blast', page: 'crater-blast' },
  { label: 'Word Tower', href: '/tools/word-tower', page: 'word-tower' },
  { label: 'Word Blitz', href: '/word-blitz', page: 'word-blitz' },
];

const TOOLS: FooterItem[] = [
  { label: 'GPA Calculator', href: '/tools/gpa-calculator', page: 'gpa-calculator', title: 'College GPA calculator — semester and cumulative on a 4.0 scale' },
  { label: 'Pomodoro Timer', href: '/tools/pomodoro-timer', page: 'pomodoro-timer', title: 'Pomodoro timer for focused study sessions and exam prep' },
  { label: 'Scientific Calculator', href: '/tools/calculator', page: 'calculator', title: 'Free online scientific calculator — trig, logs, powers for STEM homework' },
  { label: 'Unit Converter', href: '/tools/converter', page: 'converter', title: 'Unit converter — length, weight, temperature, volume for labs and problem sets' },
  { label: 'Case Converter', href: '/tools/text-case-converter', page: 'text-case-converter', title: 'Text case converter — Title Case, sentence case, uppercase for headings' },
  { label: 'Paraphrasing Tips', href: '/tools/paraphrasing-tips', page: 'paraphrasing-tips', title: 'Paraphrasing tips and wordiness checker for academic writing' },
];

const SUPPORT: FooterItem[] = [
  { label: 'Help Center', href: '/help', page: 'help' },
  { label: 'Contact Us', href: '/contact', page: 'contact' },
  { label: 'About', href: '/about', page: 'about' },
  { label: 'Press & media kit', href: '/press' },
  { label: 'Terms of Service', href: '/terms', page: 'terms' },
  { label: 'Privacy Policy', href: '/privacy', page: 'privacy' },
];

/* Plain <a href> tags, not the SPA handler: Google follows real links without
   JS, each programmatic page is prerendered, and the router needs no list of
   every URL. */
const GUIDES: { heading: string; links: [string, string][] }[] = [
  {
    heading: 'Study by subject',
    links: [
      ['How to study for finals', '/blog/how-to-study-for-finals'],
      ['How to memorize things fast', '/blog/how-to-memorize-things-fast'],
      ['Biology study tools', '/study/biology'],
      ['Chemistry study tools', '/study/chemistry'],
      ['Anatomy flashcards', '/study/anatomy'],
      ['Calculus help', '/study/calculus'],
      ['Psychology study tools', '/study/psychology'],
      ['Statistics study tools', '/study/statistics'],
    ],
  },
  {
    heading: 'Compare',
    links: [
      ['Quizlet alternative', '/alternatives/quizlet'],
      ['Course Hero alternative', '/alternatives/course-hero'],
      ['Grammarly alternative', '/alternatives/grammarly'],
      ['Chegg alternative', '/alternatives/chegg'],
      ['Knowt alternative', '/alternatives/knowt'],
    ],
  },
  {
    heading: 'Writing guides',
    links: [
      ['How to turn a B essay into an A', '/blog/how-to-turn-a-b-essay-into-an-a'],
      ['How to write an essay or assignment', '/blog/how-to-write-an-essay-or-assignment'],
      ['How to write a good introduction', '/blog/how-to-write-a-good-introduction'],
      ['How to write a conclusion', '/blog/how-to-write-a-conclusion'],
      ['How to start an essay', '/blog/how-to-start-an-essay'],
      ['What critically evaluate means', '/blog/what-does-critically-evaluate-mean'],
      ['Can professors tell if you used ChatGPT?', '/blog/can-professors-tell-if-you-used-chatgpt'],
      ['How to write an argumentative essay', '/guides/how-to-write-argumentative-essay'],
      ['How to write a thesis statement', '/guides/how-to-write-thesis-statement'],
      ['How to write a research paper', '/guides/how-to-write-research-paper'],
      ['How to write a college essay', '/guides/how-to-write-college-essay'],
      ['APA citation guide', '/guides/how-to-cite-sources-apa'],
      ['How to write an analytical essay', '/guides/how-to-write-analytical-essay'],
    ],
  },
  {
    heading: 'Best for',
    links: [
      ['Essay grader', '/essay-grader'],
      ['College essay grader', '/college-essay-grader'],
      ['Best AI essay grader for college', '/best/ai-essay-grader-for-college'],
      ['Best flashcard app for med school', '/best/flashcard-app-for-medical-school'],
      ['Best study app for college', '/best/study-app-for-college'],
      ['Best quiz maker for teachers', '/best/quiz-maker-for-teachers'],
      ['Best citation generator', '/best/citation-generator'],
    ],
  },
];

const newPill = (
  <span className="ml-2 inline-flex min-h-[20px] items-center rounded-full bg-[#E6F9D2] px-2 text-[11px] font-black uppercase tracking-[0.06em] text-[#2F6B00]">New</span>
);
const social = 'inline-flex h-11 w-11 items-center justify-center rounded-[14px] border-2 border-stone-600 text-stone-300 transition-colors hover:bg-stone-700 hover:text-white active:translate-y-0.5';

const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const go = (page?: string) => (e: React.MouseEvent) => {
    if (!page || !onNavigate) return;
    e.preventDefault();
    onNavigate(page);
  };

  const group = (title: string, items: FooterItem[]) => (
    <section aria-label={title} key={title}>
      <h3 className="m-0 mb-2.5 text-[14px] font-black uppercase tracking-[0.08em] text-white">{title}</h3>
      <ul className="m-0 list-none p-0">
        {items.map((it) => (
          <li key={it.label}>
            <a href={it.href} title={it.title} onClick={go(it.page)} className="flex min-h-[36px] items-center text-[15px] font-semibold text-stone-300 transition-colors hover:text-white hover:underline">
              {it.label}
              {it.isNew && newPill}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );

  return (
    <footer className="border-t-2 border-stone-700 bg-stone-800 text-white dark:bg-stone-950" style={FONT}>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="flex flex-wrap items-start gap-x-12 gap-y-10">
          {/* Brand */}
          <div className="max-w-[280px] flex-[1_1_240px]">
            <div className="flex items-center gap-2.5">
              <img src="/main-logo.png" alt="" width={36} height={36} className="h-9 w-9 object-contain" />
              <span className="text-xl font-black tracking-[-0.01em] text-white">WriteScholar</span>
            </div>
            <p className="m-0 mt-3.5 text-[14.5px] font-semibold leading-[1.6] text-stone-400">Write the essay, grade it, study for the exam. One account for all three.</p>
          </div>

          <div className="grid min-w-0 flex-[999_1_640px] grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-x-8 gap-y-7">
            {group('Product', PRODUCT)}
            {group('Write & grade', WRITE_GRADE)}
            {group('Study', STUDY)}
            {group('Free tools', TOOLS)}
            {group('Support & legal', SUPPORT)}
          </div>
        </div>

        <div className="my-[52px] h-px bg-white/15" />

        {/* Guides & resources: internal links for the programmatic SEO pages */}
        <div>
          <h3 className="m-0 text-[14px] font-black uppercase tracking-[0.08em] text-white">Guides &amp; resources</h3>
          <p className="m-0 mb-6 mt-2 text-[13.5px] font-semibold text-stone-400">Free study guides, tool comparisons and writing tutorials for college students.</p>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-x-8 gap-y-7">
            {GUIDES.map((g) => (
              <section key={g.heading} aria-label={g.heading}>
                <h4 className="m-0 mb-1.5 text-[12.5px] font-black uppercase tracking-[0.12em] text-stone-300">{g.heading}</h4>
                <ul className="m-0 list-none p-0">
                  {g.links.map(([label, href]) => (
                    <li key={href}>
                      <a href={href} className="flex min-h-[32px] items-center text-[14px] font-bold text-stone-400 transition-colors hover:text-white hover:underline">{label}</a>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>

        <div className="my-11 h-px bg-white/15" />

        {/* Bottom bar */}
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
          <span className="text-[14px] font-semibold text-stone-400">© 2026 WriteScholar. All rights reserved.</span>
          <div className="flex gap-2.5">
            <a href="https://www.instagram.com/writescholar/" target="_blank" rel="noopener noreferrer" aria-label="WriteScholar on Instagram" className={social}>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
            <a href="https://www.tiktok.com/@writescholar" target="_blank" rel="noopener noreferrer" aria-label="WriteScholar on TikTok" className={social}>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
