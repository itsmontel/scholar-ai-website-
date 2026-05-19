import { useState, useEffect, useMemo, lazy, Suspense, type ReactNode } from 'react';
import Header from '../common/Header';
import Footer from '../common/Footer';
import { useTheme } from '../../contexts/ThemeContext';
import AnalysisAnimation from '../common/AnalysisAnimation';
import { FOCUS_MODE_CHROME_EXTENSION_URL } from '../../constants/focusMode';
import { HIDE_FRIENDS } from '../../config/featureFlags';
import ScholarMascot from '../common/ScholarMascot';
import DualMascot from '../common/DualMascot';
// Below-the-fold landing sections are lazy-loaded so the hero paints
// fast. Each chunk is hundreds-of-lines + transitive deps; loading
// them on demand cuts initial JS for the landing page significantly.
// `lazyWithRetry` adds chunk-load failure recovery (idle tab / deploy).
import { lazyWithRetry } from '../../utils/lazyWithRetry';
import { LANDING_DEMO_FOCUS_FEEDBACK_EVENT } from '../../constants/landingDemoEvents';
const InteractiveDocumentAnalysis = lazyWithRetry(() => import('../landing/InteractiveDocumentAnalysis'));
// LandingCitationsShowcase removed from landing (Nov 2026 — replaced
// by the comprehensive-analysis arrow-callout block in the essay
// section). Re-add the lazy import here if it's ever brought back.
const LandingStudyToolsHero = lazyWithRetry(() => import('../landing/LandingStudyToolsHero'));
const LandingTestimonialsSection = lazyWithRetry(() => import('../landing/LandingTestimonialsSection'));
// (HeroEssayPreviewCard & LandingBeforeAfterSection were imported but
// never rendered — dead imports removed to shrink the eager landing
// chunk. The Mid-B before/after block is hidden behind a `{false &&}`
// guard further down; re-add the lazy import there if it's ever turned
// back on.)
import LandingScrollReveal from '../landing/LandingScrollReveal';
import { DEMO_HERO_AFTER_PAPER, DEMO_PAPERS } from '../../data/landingPageDemoAnalysis';

const BadgeCreature = lazy(() => import('../common/BadgeCreature'));

/** Hide study packs, Focus Mode, and friends blocks on landing (papers + citations first). */
const LANDING_HIDE_SECONDARY_SECTIONS = true;
import ViewportAutoplayVideo from '../common/ViewportAutoplayVideo';
interface LandingPageProps {
  onNavigate: (page: string, slug?: string) => void;
  user?: { plan?: string; subscription_plan?: string } | null;
}

/** Source list for landing FAQ UI + FAQPage JSON-LD (order must match). */
const LANDING_FAQ_ITEMS: { question: string; answer: string }[] = [
  {
    question: "Can I actually write my essay in WriteScholar?",
    answer: "Yes, that's the main thing it does. You write, paste, or import a Word doc into a real editor with headings, bold, italics, tables and images. As you write, professor-style feedback shows up next to your draft, and you can drop a suggested fix straight into the text with one click. It autosaves as you go, and you export a clean Word document when you're done."
  },
  {
    question: "What kind of feedback will I get on my essay?",
    answer: "Line-by-line notes colour-coded green for strong, amber for needs work, and red for serious concerns, plus an estimated grade with a full rubric covering thesis, evidence, structure, clarity and academic style, and specific rewrite suggestions you can apply. It reads your draft the way a marker would."
  },
  {
    question: "How does the analyzer work?",
    answer: "Write in the editor, paste your essay, or upload a PDF, DOCX or TXT. The AI grades structure, argument, clarity, citations and academic tone the way a professor would and gives you an estimated grade out of 100 with a letter band and detailed notes, usually in under a minute."
  },
  {
    question: "How accurate is the grade? Is it my real grade?",
    answer: "It's an AI estimate, not your official grade. It uses the same rubric weights professors mark with and in practice lands within a few points of real scores. Use it to find and fix the weak spots before you hand in, not as a guarantee of what you'll get."
  },
  {
    question: "Can I import a Word or PDF, and export it back?",
    answer: "Yes. Import a .docx and your bold, italics, headings and paragraphs carry over. PDF and TXT come in as clean text. When you're finished, export back to a properly formatted Word document with no reformatting on your end."
  },
  {
    question: "Is WriteScholar for college and university students?",
    answer: "Yes, it's built for undergrad and postgrad coursework worldwide, UK or US. Set your education level so the feedback fits your course. We support the major citation styles (APA, MLA, Chicago, Harvard, IEEE, Vancouver), and there are high school options too."
  },
  {
    question: "How long does an analysis take?",
    answer: "Usually under 60 seconds. Write or paste your essay, hit Analyze, and you get the rubric, the estimated grade and a ranked fix list. The free plan includes 2 analyses a month."
  },
  {
    question: "Can I also turn my notes into study tools?",
    answer: "Yes. Alongside the writing workspace, Study Pack turns any notes into flashcards, quizzes, crosswords and revision games. Free users get lessons and flashcards; the rest unlocks with Pro."
  },
  {
    question: "What citation styles are supported?",
    answer: "APA 7th, MLA 9th, Chicago (notes-bibliography and author-date), Harvard, IEEE and Vancouver. There's also a citation finder that pulls relevant academic sources for your topic."
  },
  {
    question: "Is my content private and secure?",
    answer: "Yes. Your work is encrypted, never sold or used to train AI models, and you can delete any document whenever you want."
  },
  {
    question: "What's the difference between Free, Pro and Premium?",
    answer: "Free: 3 documents, 2 analyses and 2 study packs a month. Pro: 99 combined analyses, study packs and citations a month, apply WriteScholar revisions into your draft, all citation styles, PDF and Word export, uploads up to 100MB, and the full study tools. Premium: 5x the Pro usage at 499 actions a month, unlimited research-paper summarising, and 1GB of library storage."
  },
  {
    question: "How do I add friends and share my study materials?",
    answer: "Every account gets a unique friend code. Share it so people can add you. Once connected, you can send flashcards, quizzes, crosswords or notes with one tap, they tap Accept, and it lands in their library. Core sharing is free."
  }
];

/* ─── DottedShot — big focal product screenshot ──────────────────
   The image is the hero; numbered dot badges sit on the regions
   they describe. The explanations live in <NumberedPoints> right
   below (no flanking arrow-callouts — the screenshot stays the
   focal point and reads at every viewport). */
function DottedShot({
  src,
  alt,
  badges,
}: {
  src: string;
  alt: string;
  badges: { n: number; x: number; y: number }[];
}) {
  return (
    <div className="relative">
      <div aria-hidden className="pointer-events-none absolute -inset-3 rounded-[2.5rem] bg-gradient-to-br from-[#A560E8]/18 via-[#A560E8]/8 to-[#58CC02]/10 blur-3xl -z-10" />
      <div className="relative rounded-2xl sm:rounded-3xl border-2 border-[#A560E8] bg-white dark:bg-stone-900 shadow-[0_0_18px_rgba(165,96,232,0.22),0_24px_48px_-16px_rgba(0,0,0,0.38)] overflow-hidden">
        <img src={src} alt={alt} loading="lazy" decoding="async" className="w-full h-auto block" />
        {badges.map((b) => (
          <span
            key={b.n}
            aria-hidden
            className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full font-extrabold text-white"
            style={{
              left: `${b.x}%`,
              top: `${b.y}%`,
              width: 'clamp(24px,2.4vw,36px)',
              height: 'clamp(24px,2.4vw,36px)',
              fontSize: 'clamp(12px,1.1vw,16px)',
              backgroundColor: '#A560E8',
              boxShadow: '0 0 0 4px #fff, 0 0 0 6px #A560E8, 0 6px 14px rgba(0,0,0,0.28)',
            }}
          >
            {b.n}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── NumberedPoints — explanation cards beneath the screenshot ──
   Each card carries the number of the dot it maps to, so the eye
   connects "card 3 → dot ③ on the image" without tangled arrows. */
function NumberedPoints({
  points,
  cols,
}: {
  points: { n: number; title: string; desc: string; icon?: ReactNode }[];
  cols: string;
}) {
  return (
    <div className={`grid ${cols} gap-4 sm:gap-5`}>
      {points.map((p) => (
        <div
          key={p.n}
          className="group relative overflow-hidden rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 transition-all duration-300 shadow-[0_1px_2px_rgba(40,30,60,0.04),0_18px_38px_-26px_rgba(96,48,140,0.45)] hover:-translate-y-1 hover:border-[#A560E8]/45 hover:shadow-[0_1px_2px_rgba(40,30,60,0.04),0_30px_55px_-24px_rgba(96,48,140,0.55)]"
        >
          {/* Soft brand wash that warms on hover */}
          <span
            aria-hidden
            className="pointer-events-none absolute -top-12 -right-12 h-28 w-28 rounded-full bg-[#A560E8]/[0.06] blur-2xl transition-opacity duration-300 opacity-0 group-hover:opacity-100"
          />
          {/* Corner feature icon, faint */}
          {p.icon && (
            <span
              aria-hidden
              className="pointer-events-none absolute top-5 right-5 text-[#A560E8]/20 dark:text-[#A560E8]/25 transition-colors duration-300 group-hover:text-[#A560E8]/40"
            >
              {p.icon}
            </span>
          )}
          {/* Number badge — kept prominent (it maps to the dot on the
              screenshot above) but elevated: gradient + ring + glow. */}
          <span
            className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#A560E8] to-[#8A48C7] text-white text-base font-extrabold ring-1 ring-[#A560E8]/30 shadow-[0_8px_18px_-6px_rgba(165,96,232,0.65)]"
            style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
          >
            {p.n}
          </span>
          <h3
            className="relative mt-4 text-base font-extrabold text-stone-900 dark:text-stone-50 leading-snug"
            style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
          >
            {p.title}
          </h3>
          <p className="relative mt-1.5 text-[13px] sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
            {p.desc}
          </p>
          {/* Accent underline that sweeps in on hover */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] w-full origin-left scale-x-0 bg-gradient-to-r from-[#A560E8] to-[#8A48C7] transition-transform duration-300 group-hover:scale-x-100"
          />
        </div>
      ))}
    </div>
  );
}

/* Single flanking callout card: number badge + title + desc, with a
   dashed arrow on its inner edge pointing toward the centre image.
   The original landing recipe — restored for the combined analyzer
   block per request. */
function LandingEssayCallout({
  n,
  hotspot,
  color,
  arrow,
}: {
  n: number;
  hotspot: { title: string; desc: string };
  color: string;
  arrow: 'left' | 'right';
}) {
  return (
    <div className="relative">
      <svg
        className="absolute top-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          width: '40px',
          height: '24px',
          ...(arrow === 'right' ? { right: '-44px' } : { left: '-44px' }),
        }}
        viewBox="0 0 40 24"
        aria-hidden
      >
        {arrow === 'right' ? (
          <>
            <path d="M 2 12 L 30 12" stroke={color} strokeWidth="2.5" strokeDasharray="5 4" strokeLinecap="round" fill="none" />
            <path d="M 26 5 L 36 12 L 26 19" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </>
        ) : (
          <>
            <path d="M 38 12 L 10 12" stroke={color} strokeWidth="2.5" strokeDasharray="5 4" strokeLinecap="round" fill="none" />
            <path d="M 14 5 L 4 12 L 14 19" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </>
        )}
      </svg>

      <div
        className="rounded-2xl border-2 border-b-4 bg-white dark:bg-stone-900 p-4"
        style={{ borderColor: color, boxShadow: `0 10px 26px -12px ${color}55` }}
      >
        <div className="flex items-start gap-2.5 mb-2">
          <span
            className="flex items-center justify-center rounded-full text-white font-extrabold shrink-0"
            style={{ backgroundColor: color, width: '28px', height: '28px', fontSize: '14px' }}
          >
            {n}
          </span>
          <p className="text-sm xl:text-[15px] font-extrabold text-stone-900 dark:text-stone-100 leading-snug" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
            {hotspot.title}
          </p>
        </div>
        <p className="text-[12px] xl:text-[13px] text-stone-600 dark:text-stone-400 leading-snug font-semibold">
          {hotspot.desc}
        </p>
      </div>
    </div>
  );
}

/* ─── LandingCombinedAnalyzerCallouts ────────────────────────────
   The two analyzer screenshots JOINED into one photo (rubric view
   on top, full report below — single bordered frame) with the
   original sideways arrow-callouts flanking it: 9 numbered badges,
   cards split left (#2,3,6,8) / right (#1,4,5,7,9) so the dashed
   arrows never cross. Desktop keeps the exact prior style; <lg
   falls back to the stacked photo + a numbered grid (so phones
   aren't left blank). */
function LandingCombinedAnalyzerCallouts() {
  const color = '#A560E8';
  const borderColor = '#8A48C7';
  const pts: { n: number; img: 0 | 1; side: 'left' | 'right'; x: number; y: number; title: string; desc: string }[] = [
    { n: 1, img: 0, side: 'right', x: 84, y: 5,  title: 'Real /100 grade + letter score', desc: 'Every essay graded out of 100 with a letter grade — the same rubric weights professors mark with. You always know how close you are to an A.' },
    { n: 2, img: 0, side: 'left',  x: 22, y: 22, title: 'Five-category rubric breakdown', desc: 'Thesis · Evidence · Structure · Clarity · Mechanics — each scored on its own so you see exactly which category is costing you marks.' },
    { n: 3, img: 0, side: 'left',  x: 22, y: 73, title: 'Colour-coded essay text', desc: 'Your sentences turn green (strong), amber (revise) or red (serious concern). Hover any highlight to read the exact feedback for that line.' },
    { n: 4, img: 0, side: 'right', x: 78, y: 86, title: 'Line-by-line annotations', desc: 'Every sentence gets a verdict plus a specific revise-to suggestion — actual rewritten lines, not "make it better".' },
    { n: 5, img: 1, side: 'right', x: 80, y: 27, title: 'Overall assessment', desc: 'Letter grade, /100 score and a plain-English verdict up top — the high-level read before you dive into the detail.' },
    { n: 6, img: 1, side: 'left',  x: 22, y: 40, title: 'Top suggestions', desc: 'The handful of changes that move your grade the most, ranked by impact. Fix these first if you only have 20 minutes.' },
    { n: 7, img: 1, side: 'right', x: 80, y: 58, title: 'Strengths', desc: 'The specific moves already earning marks — thesis framing, evidence handling, transitions — each with the actual sentence.' },
    { n: 8, img: 1, side: 'left',  x: 22, y: 74, title: 'Areas for improvement', desc: 'Vague claims, weak signposting, sentences doing too much — each with a concrete "revise to" suggestion.' },
    { n: 9, img: 1, side: 'right', x: 80, y: 95, title: 'Serious concerns', desc: 'Missing citations, logic gaps, factual slips — the things professors actually deduct for, surfaced before you submit.' },
  ];
  // Combined-photo Y for a badge: image-0 (rubric-and-notes,
  // 1216×1166) takes the top 51.3% of the stacked height, image-1
  // (full-report, 1216×1106) the bottom 48.7%. Pinning each callout
  // to this exact %, its arrow lines up with its dot — no guessing.
  const combinedY = (p: { img: 0 | 1; y: number }) =>
    p.img === 0 ? p.y * 0.5132 : 51.32 + p.y * 0.4868;
  const Badge = ({ n, x, y }: { n: number; x: number; y: number }) => (
    <span
      aria-hidden
      className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full font-extrabold text-white"
      style={{
        left: `${x}%`, top: `${y}%`, width: '32px', height: '32px', fontSize: '14px',
        backgroundColor: color, boxShadow: `0 0 0 4px white, 0 0 0 6px ${color}, 0 6px 14px rgba(0,0,0,0.25)`,
      }}
    >
      {n}
    </span>
  );
  const Shot = ({ src, alt, img }: { src: string; alt: string; img: 0 | 1 }) => (
    <div className="relative">
      <img src={src} alt={alt} className="w-full h-auto block" loading="lazy" decoding="async" />
      {pts.filter((p) => p.img === img).map((p) => <Badge key={p.n} n={p.n} x={p.x} y={p.y} />)}
    </div>
  );
  const a1 = 'WriteScholar essay analyzer — /100 score, five-category rubric, colour-coded text and line-by-line annotations';
  const a2 = 'WriteScholar comprehensive report — overall assessment, top suggestions, strengths, areas to improve and serious concerns';
  return (
    <>
      {/* Desktop: ONE combined photo centred, every callout pinned
          absolutely to its dot's exact vertical position so the
          arrows always point at the right spot. */}
      <div className="hidden lg:block relative mx-auto max-w-[1120px]">
        <div className="relative mx-auto w-[46%]">
          <div className="absolute -inset-3 rounded-3xl blur-2xl opacity-25" style={{ backgroundColor: `${color}40` }} aria-hidden />
          <div className="relative rounded-2xl overflow-hidden border-2 border-b-4 shadow-xl bg-white dark:bg-stone-900" style={{ borderColor }}>
            <Shot src="/rubric-and-notes.png" alt={a1} img={0} />
            <Shot src="/full-report.png" alt={a2} img={1} />
          </div>
        </div>
        {pts.map((p) => (
          <div
            key={p.n}
            className={`absolute w-[25%] -translate-y-1/2 ${p.side === 'left' ? 'left-0' : 'right-0'}`}
            style={{ top: `${combinedY(p)}%` }}
          >
            <LandingEssayCallout n={p.n} hotspot={p} color={color} arrow={p.side === 'left' ? 'right' : 'left'} />
          </div>
        ))}
      </div>

      <div className="lg:hidden">
        <div className="max-w-xl mx-auto rounded-2xl overflow-hidden border-2 border-b-4 shadow-xl bg-white dark:bg-stone-900" style={{ borderColor }}>
          <Shot src="/rubric-and-notes.png" alt={a1} img={0} />
          <Shot src="/full-report.png" alt={a2} img={1} />
        </div>
        <div className="mt-8">
          <NumberedPoints cols="grid-cols-1 sm:grid-cols-2" points={pts.map((p) => ({ n: p.n, title: p.title, desc: p.desc }))} />
        </div>
      </div>
    </>
  );
}

/**
 * Hero "Study Games" tile — single autoplaying <video> that cycles
 * through Word Blitz → Word Tower → Crater Blast and loops. We can't
 * use the native `loop` attribute because that prevents `onEnded`
 * from firing, so we drive the cycle manually. `key={src}` re-mounts
 * the element on each swap so Safari starts playback cleanly.
 */
const HERO_STUDY_GAMES_PLAYLIST = [
  '/hero-word-blitz.mp4',
  '/hero-word-tower.mp4',
  '/writescholar-crater-blast-demo.mp4',
] as const;

const HeroStudyGamesVideo = () => {
  const [idx, setIdx] = useState(0);
  const src = HERO_STUDY_GAMES_PLAYLIST[idx];
  return (
    <video
      key={src}
      src={src}
      autoPlay
      muted
      playsInline
      preload="metadata"
      onEnded={() => setIdx((i) => (i + 1) % HERO_STUDY_GAMES_PLAYLIST.length)}
      className="absolute inset-0 w-full h-full object-cover"
    />
  );
};

const LandingPage = ({ onNavigate, user }: LandingPageProps) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { theme: _theme, toggleTheme: _toggleTheme } = useTheme();
  // ─── Floating PiP demo video state ──────────────────────────────────────
  // Mirrors a "video stays with you while you scroll" experience similar to
  // YouTube's Miniplayer or how product demo overlays float on SaaS landings.
  // Visibility logic:
  //   - Starts HIDDEN. Becomes visible after user scrolls past the hero (so
  //     it doesn't compete with the hero's main content on first impression).
  //   - User can dismiss with the X. Dismissal is in-memory only — a page
  //     refresh brings the player back so returning visitors get another
  //     chance to engage with the demo.
  const [pipVisible, setPipVisible] = useState(false);
  const [pipDismissed, setPipDismissed] = useState(false);
  const [pipMuted, setPipMuted] = useState(true);
  const [pipExpanded, setPipExpanded] = useState(false);
  // Hero's floating grade pill — mirrors which demo sample the user
  // currently has selected inside the interactive analyser. The demo
  // starts on the B sample (see InteractiveDocumentAnalysis.tsx:248),
  // so the pill renders "B" on first paint and flips to "C" the
  // moment the user toggles the C-grade sample tab.
  const [heroDemoGrade, setHeroDemoGrade] = useState<string>('B');
  // PiP is now pinned static to the bottom-right corner (no drag-to-
  // move). The previous drag handler + pipPos/pipDragging state was
  // removed per user brief — the floating demo video stays where it
  // appears and never repositions.
  useEffect(() => {
    if (pipDismissed) return;
    const onScroll = () => {
      // Show the floating video once the user has scrolled at least 600px —
      // typically just past the hero on most viewports.
      if (window.scrollY > 600 && !pipVisible) setPipVisible(true);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [pipVisible, pipDismissed]);
  const handleDismissPip = () => {
    setPipVisible(false);
    setPipDismissed(true);
  };
  // (PiP drag handler removed — the floating demo is static now.)
  const [inputText, setInputText] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [mode, setMode] = useState<'analyze' | 'citations' | 'summarize' | 'quiz'>('analyze');
  const [studyToolMode, setStudyToolMode] = useState<'quiz' | 'flashcards' | 'crossword'>('quiz');
  const [citationStyle, setCitationStyle] = useState('APA');
  const [citationYearRange, setCitationYearRange] = useState('all');
  const [showFakeAnimation, setShowFakeAnimation] = useState(false);
  const [showFakeResults, setShowFakeResults] = useState(false);
  const [showFakeCitationResults, setShowFakeCitationResults] = useState(false);
  const [showFakeSummaryResults, setShowFakeSummaryResults] = useState(false);
  const [showFakeQuizResults, setShowFakeQuizResults] = useState(false);
  const [summaryStyle, setSummaryStyle] = useState<'bullet' | 'paragraph' | 'tldr' | 'detailed'>('bullet');
  const [summaryLength, setSummaryLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [quizType, setQuizType] = useState<'mixed' | 'multiple_choice' | 'true_false' | 'fill_blank'>('mixed');
  const [quizDifficulty, setQuizDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [quizQuestionCount, setQuizQuestionCount] = useState(10);
  const [flashcardCount, setFlashcardCount] = useState(15);
  const [crosswordWordCount, setCrosswordWordCount] = useState(10);
  const [activeHelpCategory, setActiveHelpCategory] = useState('essays');
  const [activeStudyTab, setActiveStudyTab] = useState('analyse');

  const helpCategories = [
    {
      id: 'essays',
      label: 'Essays',
      title: 'Essays',
      description: 'Build a clear structure, develop strong arguments, and craft compelling conclusions. WriteScholar helps you maintain academic tone while ensuring your ideas shine through with clarity and precision.'
    },
    {
      id: 'exams',
      label: 'Exams',
      title: 'Exams',
      description: 'Ace your exams with AI-generated quizzes, flashcards, and crossword puzzles. Turn any notes or textbook content into interactive study tools. Perfect for memorization and last-minute revision.'
    },
    {
      id: 'summarizing',
      label: 'Summarizing',
      title: 'Summarizing',
      description: 'Transform long articles, papers, and textbooks into concise summaries. Get bullet points, TL;DRs, or detailed overviews in seconds. Save time and grasp key concepts faster.'
    },
    {
      id: 'citations',
      label: 'Citations',
      title: 'Citations',
      description: 'Find relevant academic sources instantly, format citations in APA, MLA, Chicago, and more. Never worry about citation errors again with automatic formatting.'
    },
    {
      id: 'grammar',
      label: 'Grammar & Style',
      title: 'Grammar & Style',
      description: 'Catch grammar mistakes, improve sentence clarity, and elevate your academic tone. Our AI identifies issues and suggests improvements in real-time.'
    }
  ];

  const analyzePlaceholders = [
    "Paste your essay or research paper here...",
    "Get instant feedback on structure and clarity...",
    "Improve your academic writing in seconds..."
  ];

  const citationPlaceholders = [
    "Enter your research topic to find citations...",
    "What are you researching? Find sources instantly...",
    "Type your essay question and discover literature..."
  ];

  const summarizePlaceholders = [
    "Paste your article, paper, or document to summarize...",
    "Transform lengthy content into key points...",
    "Get concise summaries in seconds..."
  ];

  const quizPlaceholders = [
    "Paste content to generate quiz questions...",
    "Turn any text into an interactive quiz...",
    "Test your knowledge with AI-generated questions..."
  ];

  const flashcardPlaceholders = [
    "Paste your notes to create flashcards...",
    "Turn any content into study cards...",
    "Memorize key concepts with flip cards..."
  ];

  const crosswordPlaceholders = [
    "Paste content to generate a crossword puzzle...",
    "Turn key terms into an interactive puzzle...",
    "Learn vocabulary with crossword clues..."
  ];

  const getStudyToolPlaceholders = () => {
    if (studyToolMode === 'flashcards') return flashcardPlaceholders;
    if (studyToolMode === 'crossword') return crosswordPlaceholders;
    return quizPlaceholders;
  };

  const placeholders = mode === 'summarize' ? summarizePlaceholders
    : mode === 'quiz' ? getStudyToolPlaceholders()
    : mode === 'analyze' ? analyzePlaceholders
    : citationPlaceholders;

  const suggestedTopics = mode === 'analyze' ? [
    "The impact of social media on student mental health",
    "Climate change effects on global agriculture",
    "Artificial intelligence in healthcare",
    "Education's role in economic development",
    "Renewable energy in developing countries",
    "Cultural factors in consumer behavior"
  ] : [
    "Effects of sleep on cognitive function",
    "Social media and political polarization",
    "Machine learning in medical diagnosis",
    "Sustainable urban development",
    "Remote work and productivity",
    "Blockchain in supply chain"
  ];

  const faqs = useMemo(
    () => LANDING_FAQ_ITEMS.filter(faq => !HIDE_FRIENDS || !faq.question.toLowerCase().includes('friends')),
    [HIDE_FRIENDS]
  );

  /* FAQPage JSON-LD — matches visible FAQ list for rich results */
  useEffect(() => {
    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer }
      }))
    };
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(faqSchema);
    script.id = 'faq-schema-landing-writescholar';
    document.head.appendChild(script);
    return () => {
      const el = document.getElementById('faq-schema-landing-writescholar');
      if (el) el.remove();
    };
  }, [faqs]);

  const universities = [
    { name: 'Harvard', className: 'university-harvard' },
    { name: 'Oxford', className: 'university-oxford' },
    { name: 'Stanford', className: 'university-stanford' },
    { name: 'MIT', className: 'university-mit' },
    { name: 'Cambridge', className: 'university-cambridge' },
    { name: 'Yale', className: 'university-yale' },
    { name: 'Princeton', className: 'university-princeton' },
    { name: 'Florida State', className: 'university-florida-state' },
    { name: 'UCLA', className: 'university-ucla' },
    { name: 'Berkeley', className: 'university-berkeley' },
    { name: 'Columbia', className: 'university-columbia' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isFocused) {
        setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
      }
    }, 3500);
    return () => clearInterval(interval);
  }, [isFocused, placeholders.length]);

  const handleSubmit = () => {
    if (!inputText.trim()) return;
    setShowFakeAnimation(true);
    if (mode === 'citations') {
      localStorage.setItem('pendingCitationSearch', JSON.stringify({
        topic: inputText,
        style: citationStyle,
        yearRange: citationYearRange
      }));
      setTimeout(() => {
        setShowFakeAnimation(false);
        setShowFakeCitationResults(true);
      }, 15000);
    } else if (mode === 'summarize') {
      localStorage.setItem('pendingSummary', JSON.stringify({
        text: inputText,
        style: summaryStyle,
        length: summaryLength
      }));
      setTimeout(() => {
        setShowFakeAnimation(false);
        setShowFakeSummaryResults(true);
      }, 6000);
    } else if (mode === 'quiz') {
      localStorage.setItem('pendingStudyTool', JSON.stringify({
        text: inputText,
        studyToolMode,
        quizType,
        difficulty: quizDifficulty,
        questionCount: quizQuestionCount,
        flashcardCount,
        crosswordWordCount
      }));
      setTimeout(() => {
        setShowFakeAnimation(false);
        setShowFakeQuizResults(true);
      }, 14000);
    } else {
      localStorage.setItem('pendingAnalysis', JSON.stringify({ text: inputText }));
      setTimeout(() => {
        setShowFakeAnimation(false);
        setShowFakeResults(true);
      }, 15000);
    }
  };

  const handleContinueToSignup = () => {
    setShowFakeResults(false);
    setShowFakeCitationResults(false);
    setShowFakeSummaryResults(false);
    setShowFakeQuizResults(false);
    onNavigate('signup');
  };

  const handleContinueToSignupFromCitations = () => {
    setShowFakeCitationResults(false);
    onNavigate('signup');
  };

  const handleTopicClick = (topic: string) => {
    setInputText(topic);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Store file info for signup flow
    localStorage.setItem('pendingAnalysis', JSON.stringify({ 
      fileName: file.name,
      fileType: file.type,
      fromUpload: true 
    }));
    
    // Show the same animation and results as paste
    setShowFakeAnimation(true);
    setTimeout(() => {
      setShowFakeAnimation(false);
      setShowFakeResults(true);
    }, 15000);
    
    // Reset the input so the same file can be selected again
    e.target.value = '';
  };

  // Character illustration - man peeking over the right edge of the text box
  const CharacterIllustration = () => (
    <>
      {/* Mobile version - small head peeking over top-right corner */}
      <div className="absolute -right-2 -top-9 w-14 h-14 sm:hidden pointer-events-none z-20">
        <svg viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="35" cy="28" r="20" fill="#E8B796" />
          <path d="M15 24 Q14 8 28 4 Q35 1 42 4 Q56 8 55 24 Q52 16 42 12 Q35 8 28 12 Q18 16 15 24" fill="#4A3728" />
          <path d="M15 24 Q10 30 15 36" fill="#4A3728" />
          <path d="M55 24 Q60 30 55 36" fill="#4A3728" />
          <ellipse cx="28" cy="28" rx="3" ry="3.5" fill="#1F2937" />
          <ellipse cx="42" cy="28" rx="3" ry="3.5" fill="#1F2937" />
          <circle cx="29" cy="26.5" r="1.2" fill="white" />
          <circle cx="43" cy="26.5" r="1.2" fill="white" />
          <path d="M28 40 Q35 46 42 40" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round" />
          <circle cx="20" cy="34" r="3" fill="#FECACA" opacity="0.5" />
          <circle cx="50" cy="34" r="3" fill="#FECACA" opacity="0.5" />
          <ellipse cx="26" cy="55" rx="6" ry="5" fill="#E8B796" />
          <ellipse cx="44" cy="55" rx="6" ry="5" fill="#E8B796" />
                        </svg>
                      </div>

      {/* Desktop - man peeking from behind right edge, hands gripping the top */}
      <div className="absolute hidden sm:block -right-8 xl:-right-16 pointer-events-none z-20" style={{ top: '-110px', width: '120px', height: '160px' }}>
        <svg viewBox="0 0 120 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Body - light blue shirt, cut off at bottom (behind the box) */}
          <path d="M35 105 Q35 130 60 138 Q85 130 85 105" fill="#60A5FA" />
          <path d="M48 101 L60 112 L72 101" stroke="#3B82F6" strokeWidth="2" fill="none" />
          {/* Neck */}
          <rect x="52" y="88" width="16" height="18" rx="2" fill="#E8B796" />
          {/* Head */}
          <ellipse cx="60" cy="52" rx="30" ry="34" fill="#E8B796" />
          {/* Hair - short neat brown male hair */}
          <path d="M30 44 Q28 18 44 10 Q60 2 76 10 Q92 18 90 44 Q88 30 76 22 Q60 12 44 22 Q32 30 30 44" fill="#4A3728" />
          <path d="M30 44 Q24 52 30 62" fill="#4A3728" />
          <path d="M90 44 Q96 52 90 62" fill="#4A3728" />
          {/* Eyes - looking left toward the text box */}
          <ellipse cx="48" cy="50" rx="4.5" ry="5.5" fill="#1F2937" />
          <ellipse cx="72" cy="50" rx="4.5" ry="5.5" fill="#1F2937" />
          <circle cx="46" cy="48" r="2" fill="white" />
          <circle cx="70" cy="48" r="2" fill="white" />
          {/* Eyebrows - friendly */}
          <path d="M38 38 Q48 33 58 38" stroke="#4A3728" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M62 38 Q72 33 82 38" stroke="#4A3728" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          {/* Warm smile */}
          <path d="M47 70 Q60 82 73 70" stroke="#1F2937" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          {/* Cheeks */}
          <ellipse cx="34" cy="62" rx="5" ry="3.5" fill="#FECACA" opacity="0.5" />
          <ellipse cx="86" cy="62" rx="5" ry="3.5" fill="#FECACA" opacity="0.5" />
          {/* Left arm reaching down to grip the edge of the box */}
          <path d="M34 110 Q18 125 12 145" stroke="#E8B796" strokeWidth="11" fill="none" strokeLinecap="round" />
          {/* Left hand - fingers curled over edge */}
          <ellipse cx="10" cy="148" rx="8" ry="6" fill="#E8B796" />
          <path d="M4 144 Q3 148 5 152" stroke="#D4A574" strokeWidth="1.2" fill="none" />
          <path d="M9 143 Q8 148 10 153" stroke="#D4A574" strokeWidth="1.2" fill="none" />
          <path d="M14 144 Q13 148 15 152" stroke="#D4A574" strokeWidth="1.2" fill="none" />
          {/* Right arm reaching down */}
          <path d="M86 110 Q100 125 106 145" stroke="#E8B796" strokeWidth="11" fill="none" strokeLinecap="round" />
          {/* Right hand */}
          <ellipse cx="108" cy="148" rx="8" ry="6" fill="#E8B796" />
          <path d="M102 144 Q101 148 103 152" stroke="#D4A574" strokeWidth="1.2" fill="none" />
          <path d="M107 143 Q106 148 108 153" stroke="#D4A574" strokeWidth="1.2" fill="none" />
          <path d="M112 144 Q111 148 113 152" stroke="#D4A574" strokeWidth="1.2" fill="none" />
                        </svg>
                  </div>
                </>
  );

  const StudyCard = ({
    title,
    desc,
    onClick,
    accentClasses,
    icon,
    innerContent,
    gradient: _gradient,
    borderColor: _borderColor,
  }: {
    title: string;
    desc: string;
    onClick: () => void;
    gradient: string;
    accentClasses: { title: string; orb: string; iconBg: string };
    borderColor: string;
    icon: string;
    innerContent: ReactNode;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className="group relative rounded-2xl p-5 text-left bg-white dark:bg-stone-900 border-2 border-b-4 border-[#E5E5E5] dark:border-stone-700 hover:-translate-y-1 hover:border-[#1CB0F6] dark:hover:border-stone-600 transition-all duration-300 ease-out h-[300px] flex flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1CB0F6]/40 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-950"
    >
      <div className="flex items-start gap-3 mb-3">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center text-base shrink-0 border border-stone-200/80 dark:border-stone-600 ${accentClasses.iconBg}`}
          aria-hidden
        >
          {icon}
        </div>
        <h3 className="text-base font-extrabold text-stone-900 dark:text-stone-100 leading-snug pt-1 text-left">{title}</h3>
      </div>
      <div className="relative z-10 bg-slate-50/90 dark:bg-stone-800/70 rounded-xl p-4 border border-stone-100 dark:border-stone-700/80 mb-3 flex-1 min-h-0 flex flex-col justify-center overflow-hidden">
        {innerContent}
      </div>
      <p className="text-stone-600 dark:text-stone-400 text-sm leading-snug text-left">{desc}</p>
    </button>
  );

  const MobileStudyCard = ({
    title,
    desc,
    onClick,
    accentClasses,
    icon,
    children,
    gradient: _gradient,
    borderColor: _borderColor,
  }: {
    title: string;
    desc: string;
    onClick: () => void;
    gradient: string;
    accentClasses: { title: string; orb: string; iconBg: string };
    borderColor: string;
    icon: string;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className="block w-full text-left bg-white dark:bg-stone-900 rounded-2xl p-4 border-2 border-b-4 border-[#E5E5E5] dark:border-stone-700 hover:-translate-y-0.5 active:border-b-2 active:translate-y-0.5 transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1CB0F6]/40"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0 border border-stone-200/80 dark:border-stone-600 ${accentClasses.iconBg}`}>
          {icon}
        </div>
        <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100">{title}</h3>
      </div>
      <div className="relative z-10 bg-slate-50/90 dark:bg-stone-800/70 rounded-xl p-3 border border-stone-100 dark:border-stone-700/80 mb-3 h-[100px] flex items-center justify-center overflow-hidden w-full">
        {children}
      </div>
      <p className="text-stone-600 dark:text-stone-400 text-xs leading-snug text-left">{desc}</p>
    </button>
  );

  const scrollToLandingTools = () => {
    document.getElementById('landing-tools')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // The dedicated "Turn a Mid-B Essay Into an A" before/after block is
  // currently hidden. Fall back to the analyzer demo (#landing-tools)
  // so the "Rubric & grade" preview card still lands the user
  // somewhere meaningful — the rubric/grade UI lives inside the demo.
  const scrollToBeforeAfter = () => {
    const target =
      document.getElementById('before-after') ??
      document.getElementById('landing-tools');
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  /** Hero preview cards: land on the embedded demo with Feedback open (annotations list). */
  const scrollToInteractiveDemoFeedback = () => {
    document.getElementById('landing-tools')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent(LANDING_DEMO_FOCUS_FEEDBACK_EVENT));
    }, 420);
  };

  const heroFeatureCards = [
    {
      title: 'Essay feedback',
      desc: 'Paste or upload a draft—line-level notes on thesis, evidence, and citations',
      onClick: () => {
        setMode('analyze');
        scrollToLandingTools();
      },
      gradient: 'from-lime-200 to-emerald-200 dark:from-lime-950/60 dark:to-emerald-950/55',
      accentClasses: { title: 'text-lime-950 dark:text-lime-200', orb: 'bg-lime-600/40', iconBg: 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/45 dark:text-emerald-100' },
      borderColor: 'border-lime-400/90 dark:border-lime-600/70',
      icon: '📝',
      inner: (
        <div className="space-y-2">
          <div className="h-2 bg-stone-400/80 dark:bg-stone-600 rounded-full overflow-hidden"><div className="h-full w-full bg-lime-700 dark:bg-lime-500 rounded-full animate-line-grow origin-left" style={{ animationDelay: '0.2s' }} /></div>
          <div className="h-2 bg-stone-400/80 dark:bg-stone-600 rounded-full overflow-hidden"><div className="h-full w-full bg-lime-700 dark:bg-lime-500 rounded-full animate-line-grow origin-left" style={{ animationDelay: '0.6s' }} /></div>
          <div className="h-2 bg-stone-400/80 dark:bg-stone-600 rounded-full overflow-hidden"><div className="h-full w-full bg-lime-800 dark:bg-lime-400 rounded-full animate-line-grow origin-left" style={{ animationDelay: '1s' }} /></div>
        </div>
      ),
      mobileContent: (
        <div className="w-full space-y-2">
          <div className="h-2.5 bg-stone-200 dark:bg-stone-600 rounded-full overflow-hidden origin-left">
            <div className="h-full w-full bg-lime-600 dark:bg-lime-500 rounded-full animate-line-grow" style={{ animationDelay: '0.2s' }} />
          </div>
          <div className="h-2.5 bg-stone-200 dark:bg-stone-600 rounded-full overflow-hidden origin-left">
            <div className="h-full w-full bg-lime-600 dark:bg-lime-500 rounded-full animate-line-grow" style={{ animationDelay: '0.6s' }} />
          </div>
          <div className="h-2.5 bg-stone-200 dark:bg-stone-600 rounded-full overflow-hidden origin-left">
            <div className="h-full w-full bg-lime-700 dark:bg-lime-400 rounded-full animate-line-grow" style={{ animationDelay: '1s' }} />
          </div>
        </div>
      ),
    },
    {
      title: 'Aligned citations',
      desc: 'Find sources that match your paper and format them',
      onClick: () => {
        setMode('citations');
        scrollToLandingTools();
      },
      gradient: 'from-cyan-200 to-teal-200 dark:from-cyan-950/55 dark:to-teal-950/55',
      accentClasses: { title: 'text-teal-950 dark:text-teal-200', orb: 'bg-teal-600/40', iconBg: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100' },
      borderColor: 'border-teal-400/90 dark:border-teal-600/70',
      icon: '🔍',
      inner: (
        <div className="space-y-1.5">
          <div className="text-[9px] text-teal-950 dark:text-teal-200 font-mono opacity-0 animate-fade-slide-in" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>Smith, J. (2024). Title...</div>
          <div className="text-[9px] text-teal-950 dark:text-teal-200 font-mono opacity-0 animate-fade-slide-in" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>Jones, M. (2023). Study...</div>
          <div className="flex gap-1 mt-2">
            <span className="px-1.5 py-0.5 bg-teal-300 dark:bg-teal-900/70 text-teal-950 dark:text-teal-100 text-[9px] rounded font-bold">APA</span>
            <span className="px-1.5 py-0.5 bg-stone-300 dark:bg-stone-700 text-stone-700 dark:text-stone-300 text-[9px] rounded font-semibold">MLA</span>
          </div>
        </div>
      ),
      mobileContent: (
        <div className="w-full space-y-2 text-left">
          <div className="text-[10px] text-teal-800 dark:text-teal-200 font-mono truncate opacity-0 animate-fade-slide-in" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
            Smith, J. (2024). Title...
          </div>
          <div className="text-[10px] text-teal-800 dark:text-teal-200 font-mono truncate opacity-0 animate-fade-slide-in" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
            Jones, M. (2023). Study...
          </div>
          <div className="flex gap-1.5 mt-1">
            <span className="px-2 py-0.5 bg-teal-300 dark:bg-teal-900/50 text-teal-950 dark:text-teal-100 text-[10px] rounded font-bold">APA</span>
            <span className="px-2 py-0.5 bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300 text-[10px] rounded font-medium">MLA</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Professor-style feedback',
      desc: 'Green, amber & red annotations with concrete revise-to lines',
      onClick: () => {
        setMode('analyze');
        scrollToLandingTools();
      },
      gradient: 'from-[#F3EAFF] to-[#F3EAFF] dark:from-[#A560E8]/15 dark:to-[#A560E8]/10',
      accentClasses: { title: 'text-[#A560E8] dark:text-[#A560E8]', orb: 'bg-[#A560E8]/40', iconBg: 'bg-[#F3EAFF] text-[#A560E8] dark:bg-[#A560E8]/20 dark:text-[#A560E8]' },
      borderColor: 'border-[#A560E8]/60 dark:border-[#8A48C7]/50',
      icon: '🎓',
      inner: (
        <div className="flex flex-wrap gap-1 justify-center items-center">
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#E5F8D0] dark:bg-emerald-900/60 text-[#58CC02] dark:text-emerald-100">Strong</span>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#FFF4E0] dark:bg-amber-900/60 text-[#FF9600] dark:text-amber-100">Revise</span>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#FFE8E8] dark:bg-rose-900/60 text-[#FF4B4B] dark:text-rose-100">Concern</span>
        </div>
      ),
      mobileContent: (
        <div className="flex flex-wrap gap-1.5 justify-center w-full">
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#E5F8D0] dark:bg-emerald-900/50 text-[#58CC02] dark:text-emerald-100">Strong</span>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FFF4E0] dark:bg-amber-900/50 text-[#FF9600] dark:text-amber-100">Revise</span>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FFE8E8] dark:bg-rose-900/50 text-[#FF4B4B] dark:text-rose-100">Concern</span>
        </div>
      ),
    },
    {
      title: 'Rubric & grade',
      desc: 'Thesis, evidence, clarity & citations scored like a real course',
      onClick: scrollToBeforeAfter,
      gradient: 'from-orange-200 to-amber-200 dark:from-orange-950/50 dark:to-amber-950/50',
      accentClasses: { title: 'text-orange-950 dark:text-orange-200', orb: 'bg-orange-600/40', iconBg: 'bg-amber-50 text-amber-900 dark:bg-amber-950/45 dark:text-amber-100' },
      borderColor: 'border-orange-400/90 dark:border-orange-600/70',
      icon: '📊',
      inner: (
        <div className="space-y-1.5 w-full">
          <div className="flex justify-between text-[9px] font-mono text-orange-950 dark:text-orange-200">
            <span>Thesis</span>
            <span className="tabular-nums">15/20</span>
            </div>
          <div className="h-1.5 rounded-full bg-stone-200 dark:bg-stone-600 overflow-hidden">
            <div className="h-full w-[75%] rounded-full bg-gradient-to-r from-orange-500 to-amber-500" />
          </div>
          <p className="text-[9px] text-center text-stone-600 dark:text-stone-400 font-medium">B → A with revision</p>
        </div>
      ),
      mobileContent: (
        <div className="space-y-2 w-full">
          <div className="flex justify-between text-[10px] font-mono text-orange-900 dark:text-orange-200">
            <span>Thesis</span>
            <span>15/20</span>
            </div>
          <div className="h-2 rounded-full bg-stone-200 dark:bg-stone-600 overflow-hidden">
            <div className="h-full w-[75%] rounded-full bg-gradient-to-r from-orange-500 to-amber-500" />
          </div>
        </div>
      ),
    },
    {
      title: 'Structure & clarity',
      desc: 'Topic sentences, flow, and where the argument needs tightening',
      onClick: () => {
        setMode('analyze');
        scrollToLandingTools();
      },
      gradient: 'from-[#DDF4FF] to-[#DDF4FF] dark:from-stone-950/50 dark:to-stone-950/50',
      accentClasses: { title: 'text-[#1CB0F6] dark:text-[#1CB0F6]', orb: 'bg-[#1CB0F6]/40', iconBg: 'bg-[#DDF4FF] text-[#1CB0F6] dark:bg-[#1CB0F6]/20 dark:text-[#1CB0F6]' },
      borderColor: 'border-[#1CB0F6]/60 dark:border-[#1899D6]/50',
      icon: '🧭',
      inner: (
        <div className="space-y-1 w-full text-left">
          <div className="h-1.5 bg-stone-300/80 dark:bg-stone-600 rounded w-full" />
          <div className="h-1.5 bg-[#1CB0F6]/70 rounded w-[92%]" />
          <div className="h-1.5 bg-stone-300/80 dark:bg-stone-600 rounded w-full" />
          <div className="h-1.5 bg-[#1CB0F6]/60 rounded w-[88%]" />
        </div>
      ),
      mobileContent: (
        <div className="space-y-2 w-full">
          <div className="h-2 bg-stone-300/80 dark:bg-stone-600 rounded w-full" />
          <div className="h-2 bg-[#1CB0F6]/70 rounded w-[92%]" />
          <div className="h-2 bg-stone-300/80 dark:bg-stone-600 rounded w-full" />
        </div>
      ),
    },
  ];

  return (
    <>
      <Header onNavigate={onNavigate} user={user} sticky={true} currentPage="landing" opaqueHeader />
      <main className="landing-desktop-zoom min-h-screen relative transition-colors font-sans overflow-x-clip xl:overflow-x-visible" role="main">
      {/* Promo Banner — FULLY HIDDEN per redesign brief. The 50%-off
          May2026 promo no longer surfaces on landing; the new centred
          hero with floating feature tiles is the entire above-the-fold
          story. Markup preserved (just swap `hidden` → `md:block` to
          re-enable on desktop when a new promo runs). */}
      <div
        role="region"
        aria-label="Limited time promotion"
        aria-hidden="true"
        className="hidden relative overflow-hidden border-b-2 border-[#FF9600]/30 dark:border-[#D97F00]/40 bg-[#FFF4E0] dark:bg-stone-950"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_120%_at_50%_50%,rgba(255,150,0,0.08),transparent_70%)] dark:bg-[radial-gradient(ellipse_60%_120%_at_50%_50%,rgba(255,150,0,0.12),transparent_70%)]" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-1.5 sm:py-2">
          <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FF9600] px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-white">
              <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Limited Time
            </span>
            <p className="text-xs sm:text-[13px] font-medium text-stone-800 dark:text-stone-100">
              <span className="font-bold text-[#FF9600] dark:text-[#FF9600]">50% off</span> your first month on monthly plans · use code{' '}
              <span className="inline-flex items-center rounded-md border border-[#FF9600]/40 dark:border-[#D97F00]/50 bg-white dark:bg-stone-900 px-1.5 py-0.5 font-mono font-bold text-[#FF9600] dark:text-[#FF9600] tracking-wide text-[11px]">
                MAY2026
              </span>
            </p>
          </div>
        </div>
      </div>
      {/* HERO: formal, conversion-focused. Section base is cream so
          everything below the hero (analyzer demo, before/after, etc.)
          sits on the standard light-theme background. The purple hero
          area is now scoped to a fixed-height wrapper at the top. */}
      <section className="relative flex flex-col overflow-x-clip overflow-hidden border-b border-stone-200/90 dark:border-stone-800 xl:overflow-visible bg-[#FCFBF7] dark:bg-[#0c0a09]">
        {/* ─── HERO BACKGROUND — SOFT WHITE WITH PURPLE WASH ─────────
            Reworked per user brief: the previous solid purple hero is
            replaced with a near-white field tinted by the brand
            purple #A560E8. Header stays purple (a deliberate hard
            colour break above the trust pill); below the header, the
            hero reads bright and light like the reference design.
            The atmospheric orbs are kept at very low opacity so the
            page still feels on-brand without overwhelming the H1. */}
        <div
          className="absolute top-0 left-0 right-0 h-[1180px] md:h-[1050px] lg:h-[1100px] xl:h-[1180px] overflow-hidden pointer-events-none"
          aria-hidden
        >
          {/* Base — purple-tinted white. Just enough purple in the
              base to read warm against the existing site cream. */}
          <div className="absolute inset-0 bg-[#FAF7FF] dark:bg-stone-950" />

          {/* Soft purple atmospheric orbs — same #A560E8 brand purple,
              dropped to 6-10% opacity so they read as a warm glow
              instead of solid colour. */}
          <div className="pointer-events-none absolute -top-40 -left-[10%] h-[min(95vw,40rem)] w-[min(95vw,40rem)] rounded-full bg-[#A560E8]/[0.10] blur-[110px] animate-landing-hero-blob" />
          <div className="pointer-events-none absolute -top-40 -right-[10%] h-[min(95vw,38rem)] w-[min(95vw,38rem)] rounded-full bg-[#A560E8]/[0.08] blur-[110px] animate-landing-hero-blob-delayed" />
          <div className="pointer-events-none absolute -bottom-20 -left-[8%] h-[min(90vw,36rem)] w-[min(90vw,36rem)] rounded-full bg-[#A560E8]/[0.07] blur-[110px] animate-landing-hero-blob" />
          <div className="pointer-events-none absolute -bottom-20 -right-[10%] h-[min(95vw,40rem)] w-[min(95vw,40rem)] rounded-full bg-[#A560E8]/[0.09] blur-[110px] animate-landing-hero-blob-delayed" />

          {/* Sparkle dots — purple now (used to be white on purple bg
              which obviously won't read on a light field). */}
          <div className="hidden md:block pointer-events-none absolute top-[12%] left-[18%] h-1 w-1 rounded-full bg-[#A560E8]/35 motion-safe:animate-pulse" />
          <div className="hidden md:block pointer-events-none absolute top-[22%] right-[14%] h-1.5 w-1.5 rounded-full bg-[#A560E8]/40 motion-safe:animate-pulse" style={{ animationDelay: '0.8s' }} />
          <div className="hidden md:block pointer-events-none absolute top-[38%] left-[7%] h-1 w-1 rounded-full bg-[#A560E8]/30 motion-safe:animate-pulse" style={{ animationDelay: '1.6s' }} />
          <div className="hidden md:block pointer-events-none absolute top-[44%] right-[6%] h-1 w-1 rounded-full bg-[#A560E8]/30 motion-safe:animate-pulse" style={{ animationDelay: '2.4s' }} />
          <div className="hidden md:block pointer-events-none absolute bottom-[28%] left-[24%] h-1.5 w-1.5 rounded-full bg-[#A560E8]/35 motion-safe:animate-pulse" style={{ animationDelay: '0.4s' }} />
          <div className="hidden md:block pointer-events-none absolute bottom-[22%] right-[22%] h-1 w-1 rounded-full bg-[#A560E8]/30 motion-safe:animate-pulse" style={{ animationDelay: '1.2s' }} />

          {/* Bottom fade — keeps the existing fade-into-cream so the
              hero blends into the section below without a hard seam. */}
          <div
            className="absolute inset-x-0 bottom-0 h-44 sm:h-48 lg:h-52 xl:h-56 bg-gradient-to-b from-transparent from-65% to-[#FCFBF7] dark:to-[#0c0a09] pointer-events-none"
            aria-hidden
          />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-start px-4 sm:px-6 lg:px-8 pt-10 sm:pt-12 lg:pt-8 pb-8 sm:pb-0 min-w-0">
          <div className="w-full min-w-0 max-w-[1240px] xl:mx-auto">
            {/* ─── PREMIUM HERO — essay-analyzer-first conversion landing ─────
                Single focused funnel: trust pill → editorial headline →
                subhead → primary CTA pair → product UI screenshot. Study Pack
                / Citations / Focus Mode get one secondary mention beneath.
                Drops the previous floating-tile cluster + 6-icon feature row
                in favour of one strong product showcase, per user brief to make
                essay analysis the unmistakable hero. */}
            <div className="relative z-10 w-full max-w-6xl xl:max-w-[88rem] mx-auto px-5 sm:px-8 lg:px-10 pt-0 pb-8 sm:pt-4 sm:pb-14 lg:pt-6 lg:pb-20 text-center opacity-0 animate-hero-card-enter">
              {/* ─── HERO MARGIN TILES — flank the H1 on lg+ ─────────
                  Two tiles per side at staggered vertical positions,
                  absolutely positioned to the (relative) hero column
                  so they float in the margins beside the editorial
                  headline. Hidden on smaller screens — the
                  mobile/tablet 2x2 strip below the demo (block #8)
                  picks them up there. Yellow Duolingo border matches
                  the pre-rebuild hero aesthetic. */}
              {[
                {
                  // Top-left, mirrored with Premium essay analysis (same
                  // top, same offset). On xl+ the negative offset pushes
                  // the tile past the hero column edge into the side
                  // margin (section uses `xl:overflow-visible` so this is
                  // safe). The essay-analysis pair sits up top closer to
                  // the H1 ("premium AI grader…"), study-tool pair sits
                  // below.
                  label: 'Essay Analyzer',
                  kind: 'image' as const,
                  src: '/rubric-and-notes.png',
                  pos: 'top-[2rem] xl:top-[3rem] -left-[1rem] xl:-left-[4rem]',
                  // Subtle 8s drift; reuses the existing `hero-tile-drift`
                  // keyframe (src/index.css:1057). Each tile gets a slightly
                  // different duration + delay so they fall out of phase
                  // and the cluster never sits in lock-step.
                  anim: 'motion-safe:animate-[hero-tile-drift_8s_ease-in-out_infinite]',
                  delay: '0s',
                },
                {
                  // Top-right, mirror of Essay Analyzer.
                  label: 'Premium essay analysis',
                  kind: 'image' as const,
                  src: '/full-report.png',
                  pos: 'top-[2rem] xl:top-[3rem] -right-[1rem] xl:-right-[4rem]',
                  anim: 'motion-safe:animate-[hero-tile-drift_9s_ease-in-out_infinite]',
                  delay: '2.5s',
                },
                {
                  // Bottom-left, mirrored with Notes to Quiz (same top,
                  // same offset). Pulled in slightly from the column edge
                  // so the bottom pair sits a touch closer to the H1
                  // centreline than the top pair.
                  label: 'Notes to Flashcards',
                  kind: 'video' as const,
                  src: '/hero-flashcards.mp4',
                  pos: 'top-[18rem] xl:top-[20rem] left-[2rem] xl:left-0',
                  anim: 'motion-safe:animate-[hero-tile-drift_8.5s_ease-in-out_infinite]',
                  delay: '1.2s',
                },
                {
                  // Bottom-right, mirror of Notes to Flashcards.
                  label: 'Notes to Quiz',
                  kind: 'video' as const,
                  src: '/hero-quiz.mp4',
                  pos: 'top-[18rem] xl:top-[20rem] right-[2rem] xl:right-0',
                  anim: 'motion-safe:animate-[hero-tile-drift_9.4s_ease-in-out_infinite]',
                  delay: '3.8s',
                },
              ].map((t) => (
                <div
                  key={`margin-${t.label}`}
                  className={`hidden lg:block absolute z-10 w-48 xl:w-56 ${t.anim} ${t.pos}`}
                  style={{ animationDelay: t.delay }}
                >
                  <div className="rounded-2xl overflow-hidden border-2 border-b-4 border-[#A560E8] shadow-[0_18px_42px_-12px_rgba(165,96,232,0.55)] bg-stone-950">
                    <div className="relative aspect-[16/10] w-full bg-black">
                      {t.kind === 'cycle' ? (
                        <HeroStudyGamesVideo />
                      ) : t.kind === 'image' ? (
                        <img
                          src={t.src}
                          alt=""
                          aria-hidden
                          loading="lazy"
                          decoding="async"
                          className="absolute inset-0 w-full h-full object-cover object-top"
                        />
                      ) : (
                        <video
                          src={t.src}
                          autoPlay
                          muted
                          loop
                          playsInline
                          preload="metadata"
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <p className="px-2 py-1 text-center text-[10px] xl:text-[11px] font-extrabold text-stone-800 bg-white border-t-2 border-[#A560E8]/40">
                      {t.label}
                    </p>
                  </div>
                </div>
              ))}

              {/* ─── 1. TRUST PILL ────────────────────────────────────
                  Restored to the old white-pill / black-text style:
                  white background, soft Duolingo border, green users-
                  icon avatar, green tabular "50,000+". Same pattern
                  the pre-rebuild hero shipped on commit 40f28b3. The
                  white pill reads cleanly against the dark violet hero
                  bg without needing translucency. */}
              {/* Trust pill — white pill with brand-purple "50,000+
                  students" highlight per user brief. Avatar circle is a
                  soft purple tint so the user-icon still reads on
                  white. */}
              <div className="inline-flex items-center gap-2.5 rounded-full border-2 border-b-[3px] border-[#E5E5E5] dark:border-stone-700 bg-white dark:bg-stone-900 pl-1.5 pr-4 py-1 shadow-[0_8px_22px_-6px_rgba(0,0,0,0.15)]">
                <span
                  className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-[#F3EAFF]"
                  aria-hidden
                >
                  <svg className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-[#A560E8]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                </span>
                <span className="text-[12px] sm:text-[13px] font-bold text-stone-700 dark:text-stone-300">
                  Trusted by <span className="font-extrabold text-[#A560E8] tabular-nums">50,000+ students</span> worldwide
                </span>
              </div>

              {/* ─── 2. HEADLINE — two-line, dark-on-light ────────────
                  Line 1: "Turn your grades"
                  Line 2: "from B to A" where the A is a clean bold red
                          letter ringed by a hand-drawn red ink circle —
                          a teacher's grade mark. (Replaces the old
                          italic-serif A + underline + sparkle.) */}
              <h1
                className="text-[2rem] xs:text-[2.4rem] sm:text-[3rem] md:text-[3.6rem] lg:text-[4.2rem] xl:text-[4.85rem] font-extrabold tracking-[-0.02em] leading-[1.05] text-stone-900 dark:text-stone-50 mt-6 sm:mt-7 mb-5 sm:mb-6"
                style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
              >
                <span className="block">Turn your grades</span>
                <span className="block mt-1.5 sm:mt-2.5">
                  from B to{' '}
                  <span className="relative inline-block">
                    <span className="text-[#E5484D]">A</span>
                    <svg
                      aria-hidden
                      viewBox="0 0 120 108"
                      className="pointer-events-none absolute left-1/2 top-1/2 h-[1.85em] w-[1.85em] -translate-x-1/2 -translate-y-1/2 overflow-visible text-[#E5484D]"
                    >
                      <path
                        d="M92 22C74 8 40 5 23 21 6 38 9 73 33 89c26 17 68 12 83-9 11-15 8-39-9-52"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                </span>
              </h1>

              {/* ─── 3. SUBHEAD ───────────────────────────────────────
                  Single tight paragraph clarifying the product promise.
                  "Letter grade" and "polished revision" are bolded white
                  so the most concrete benefits jump out of a scan. */}
              <p className="mt-6 sm:mt-7 max-w-2xl mx-auto text-base sm:text-lg lg:text-xl text-stone-600 dark:text-stone-300 font-bold leading-relaxed">
                Write in a real editor, get a professor-style grade with
                line-by-line fixes, then apply them in one click.
              </p>

              {/* ─── 5. CTA PAIR ──────────────────────────────────────
                  Primary green Duolingo button + secondary text link.
                  Stacks on mobile, sits side-by-side on sm+. */}
              <div className="mt-8 sm:mt-9 flex flex-col sm:flex-row gap-3 sm:gap-4 items-center justify-center">
                <button
                  type="button"
                  onClick={() => onNavigate('signup')}
                  className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-[#A560E8] hover:bg-[#8A48C7] text-white text-base sm:text-lg font-extrabold uppercase tracking-wide px-7 sm:px-9 py-4 border-2 border-b-4 border-[#7733B5] active:border-b-2 active:translate-y-0.5 transition-all shadow-[0_18px_32px_-12px_rgba(165,96,232,0.55)]"
                >
                  Grade My Essay Now
                  <svg className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    document.getElementById('hero-interactive-demo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="group inline-flex items-center gap-1.5 text-sm sm:text-base font-extrabold text-[#A560E8] hover:text-[#7733B5] transition-colors px-2 py-3"
                >
                  See interactive demo
                  <svg className="w-4 h-4 transition-transform duration-200 group-hover:translate-y-0.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12l7 7 7-7" />
                  </svg>
                </button>
              </div>

              {/* ─── 6. RISK-REVERSAL MICROCOPY ───────────────────────
                  Tiny line below CTAs killing the three classic objections
                  in sequence: price, payment friction, perceived limit. */}
              <p className="mt-3 text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 font-bold tracking-wide">
                No credit card required · Get started in a few seconds
              </p>

              {/* ─── 7. PRODUCT UI SHOWCASE — LIVE INTERACTIVE DEMO ───
                  Swapped the static AiAnalysisHero.png screenshot for
                  the real <InteractiveDocumentAnalysis /> component so
                  visitors can paste an essay + see the AI grade it
                  without leaving the hero. Same lazy-load + Suspense
                  fallback pattern used further down at L1405. Halo
                  glow + Duolingo "A" pill and "60 sec" badge are kept
                  as the visual punch around the live frame. */}
              <div
                id="hero-interactive-demo"
                className="mt-12 sm:mt-14 lg:mt-16 relative max-w-6xl xl:max-w-[88rem] mx-auto scroll-mt-24"
              >
                {/* Halo glow — sits BEHIND the framed demo via -z-10 so
                    the colour bloom appears to radiate from the surface
                    itself. */}
                <div
                  aria-hidden
                  className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-[#FFC800]/25 via-[#A560E8]/10 to-[#58CC02]/15 blur-3xl scale-[1.05] -z-10"
                />

                {/* Framed live demo — brand-yellow border + layered glow.
                    2px #FFC800 border (same yellow as the floating tile
                    borders and the 60-sec badge).
                    Shadow stack varies by breakpoint:
                      • Mobile (<sm): single 18px close yellow halo at
                        0.28 alpha + a tighter depth shadow. The wider
                        70px bloom from the desktop treatment was too
                        loud on small viewports where the demo sits
                        edge-to-edge.
                      • sm+: full "premium product spotlight" — three
                        stacked shadows (30px close glow, 70px outer
                        bloom, 60px dark depth) so the demo reads as a
                        floating focal point on the dark violet hero bg. */}
                <div className="relative rounded-2xl sm:rounded-3xl border-2 border-[#A560E8] bg-white dark:bg-stone-900 shadow-[0_0_18px_rgba(165,96,232,0.28),0_18px_36px_-12px_rgba(0,0,0,0.35)] sm:shadow-[0_0_14px_rgba(165,96,232,0.22),0_0_40px_rgba(165,96,232,0.1),0_30px_60px_-15px_rgba(0,0,0,0.4)] overflow-hidden">
                  <Suspense fallback={<div className="min-h-[480px] sm:min-h-[560px] w-full" aria-hidden />}>
                    <InteractiveDocumentAnalysis
                      onNavigate={onNavigate}
                      landingHeroEmbed
                      onSampleChange={setHeroDemoGrade}
                    />
                  </Suspense>
                </div>

                {/* Floating grade pill — top-RIGHT. Letter mirrors the
                    sample the user currently has selected inside the
                    live demo (B by default, C when toggled). Reverted
                    to the original green Duolingo style per user brief
                    so the grade chip pops against the new purple trust
                    pill / purple borders elsewhere in the hero. */}
                <div
                  aria-hidden
                  className="hidden sm:flex absolute -top-4 -right-4 lg:-top-6 lg:-right-6 items-center justify-center w-16 h-16 lg:w-20 lg:h-20 rounded-2xl bg-[#58CC02] text-white text-3xl lg:text-4xl font-extrabold rotate-[6deg] border-2 border-b-4 border-[#46A302] shadow-[0_18px_32px_-8px_rgba(88,204,2,0.5)] z-10"
                >
                  {heroDemoGrade}
                </div>

                {/* "60 sec" floating badge removed per user brief. */}
              </div>

              {/* Demo-to-workspace bridge — the live demo above is the
                  paste-and-grade slice; this line tells visitors there's
                  a full editor so the hero promise matches what they get
                  after signup. Scrolls to the new workspace section. */}
              <p className="mt-5 sm:mt-6 text-center text-[13px] sm:text-sm font-bold text-stone-600 dark:text-stone-300">
                That&apos;s the instant grade. You also get a{' '}
                <button
                  type="button"
                  onClick={() => document.getElementById('writing-workspace')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="underline decoration-2 underline-offset-2 text-[#A560E8] hover:text-[#7733B5] transition-colors"
                >
                  full writing workspace
                </button>{' '}
                where the AI fixes your draft as you write.
              </p>

              {/* ─── 8. PRODUCT-BREADTH VIDEO STRIP — mobile/tablet fallback ──
                  On lg+ the four tiles float around the H1 above (see
                  block #2-tiles). This horizontal strip is the smaller
                  -screen fallback where there isn't room in the margins
                  to flank the headline. Same four tiles, same yellow
                  Duolingo border. 2x2 grid on mobile, 4-up on sm. */}
              {/* Mobile tile cluster — every tile is now a tappable
                  <button> that routes to /signup so the four product
                  thumbnails double as conversion entry points. The
                  outer .lg:hidden grid stays the same; only the inner
                  card is now interactive (active:translate effect on
                  press, focus-visible ring for keyboard users). */}
              <div className="mt-10 sm:mt-12 lg:hidden grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-5xl mx-auto">
                {[
                  { label: 'Essay Analyzer', kind: 'image' as const, src: '/rubric-and-notes.png' },
                  { label: 'Premium essay analysis', kind: 'image' as const, src: '/full-report.png' },
                  { label: 'Notes to Flashcards', kind: 'video' as const, src: '/hero-flashcards.mp4' },
                  { label: 'Notes to Quiz', kind: 'video' as const, src: '/hero-quiz.mp4' },
                ].map((t) => (
                  <button
                    key={t.label}
                    type="button"
                    onClick={() => onNavigate('signup')}
                    aria-label={`Sign up to try ${t.label}`}
                    className="group rounded-2xl overflow-hidden border-2 border-b-4 border-[#A560E8] shadow-[0_10px_24px_-10px_rgba(165,96,232,0.32)] bg-stone-950 active:border-b-2 active:translate-y-0.5 transition-transform duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A560E8]/40 text-left"
                  >
                    <div className="relative aspect-[16/10] w-full bg-black">
                      {t.kind === 'cycle' ? (
                        <HeroStudyGamesVideo />
                      ) : t.kind === 'image' ? (
                        <img
                          src={t.src}
                          alt=""
                          aria-hidden
                          loading="lazy"
                          decoding="async"
                          className="absolute inset-0 w-full h-full object-cover object-top"
                        />
                      ) : (
                        <video
                          src={t.src}
                          autoPlay
                          muted
                          loop
                          playsInline
                          preload="metadata"
                          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                        />
                      )}
                    </div>
                    <p className="px-2 py-1 text-center text-[10px] sm:text-[11px] font-extrabold text-stone-800 bg-white border-t-2 border-[#A560E8]/40">
                      {t.label}
                    </p>
                  </button>
                ))}
              </div>

            </div>

            {/* Downstream-content wrapper (preserved from pre-redesign
                tree as `flex flex-col items-stretch w-full`). Holds the
                analyzer-demo section + everything else below the hero;
                closed alongside the section's downstream closers. */}
            <div className="flex flex-col items-stretch w-full">

              {/* ─── UNIVERSITIES TRUST STRIP ─────────────────────────
                  Clean, airy logo-wall (no panel/border/shadow) — an
                  understated heading over a single auto-scrolling row.
                  Each name uses its institution's `.university-*`
                  typographic treatment (real wordmark fonts, muted
                  grey, uppercase) so it reads like an actual logo wall.
                  Tripled list + .animate-scroll-slow loops seamlessly
                  and pauses on hover; edges fade via a CSS mask. ─── */}
              <div className="relative w-full mt-14 sm:mt-20 mb-2 px-0">
                <LandingScrollReveal>
                  <p className="text-center text-[13px] sm:text-sm font-semibold tracking-wide text-stone-400 dark:text-stone-500 mb-9 sm:mb-12">
                    Trusted by students at top universities worldwide
                  </p>

                  <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_3%,#000_97%,transparent)]">
                    <div className="flex w-max items-center animate-scroll-slow" style={{ animationDuration: '30s' }}>
                      {[...universities, ...universities, ...universities].map((uni, idx) => (
                        <span key={`uni-${idx}`} className="shrink-0 px-7 sm:px-11 lg:px-16">
                          <span
                            className={`text-lg sm:text-xl lg:text-2xl whitespace-nowrap opacity-60 hover:opacity-100 transition-opacity duration-300 ${uni.className} dark:!text-stone-400`}
                          >
                            {uni.name}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                </LandingScrollReveal>
              </div>

              {/* Strong horizontal section break — full-width line with
                  labeled badge in the middle so users clearly see they're
                  entering the "how it works" 3-step explainer below. */}
              <div className="relative w-full max-w-6xl mx-auto mt-12 sm:mt-16 mb-4 sm:mb-6 flex items-center gap-4 sm:gap-6 px-1" aria-hidden>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-stone-300/80 to-stone-300/80 dark:via-stone-700/60 dark:to-stone-700/60" />
                <span className="inline-flex items-center gap-2 rounded-full border-2 border-[#E5E5E5] dark:border-stone-700 bg-white dark:bg-stone-900 px-4 py-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-[0.18em] text-[#A560E8] dark:text-[#A560E8] whitespace-nowrap">
                  <svg className="w-3 h-3 motion-safe:animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v9.586l3.293-3.293a1 1 0 111.414 1.414l-5 5a1 1 0 01-1.414 0l-5-5a1 1 0 111.414-1.414L9 13.586V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Here&apos;s how it works
                </span>
                <div className="flex-1 h-px bg-gradient-to-l from-transparent via-stone-300/80 to-stone-300/80 dark:via-stone-700/60 dark:to-stone-700/60" />
              </div>

              {/* ─── How WriteScholar works — 3-step flow connects essay
                  analysis and study tools into one mental model. Sits AFTER
                  the live analyzer demo so visitors first see the product in
                  action, then understand the mental model. ─── */}
              <div className="relative w-full max-w-7xl mx-auto mt-12 sm:mt-16 lg:mt-24 pb-16 sm:pb-20 lg:pb-28 px-1 sm:px-2 lg:px-4">
                <div className="pointer-events-none absolute -top-8 left-[6%] w-32 h-32 rounded-full bg-[#A560E8]/15 dark:bg-[#A560E8]/12 blur-3xl" aria-hidden />
                <div className="pointer-events-none absolute -bottom-4 right-[8%] w-36 h-36 rounded-full bg-[#A560E8]/15 dark:bg-[#A560E8]/12 blur-3xl" aria-hidden />

                <LandingScrollReveal>
                  <div className="relative text-center mb-10 sm:mb-12 lg:mb-14 max-w-2xl mx-auto">
                    <h2
                      className="text-2xl sm:text-3xl lg:text-[2.4rem] font-extrabold text-stone-900 dark:text-stone-50 tracking-tight leading-[1.05]"
                      style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
                    >
                      Drop in your work.{' '}
                      <span className="text-[#A560E8] dark:text-[#A560E8]">We do the rest.</span>
                    </h2>
                    <p className="mt-2 text-sm sm:text-base text-stone-600 dark:text-stone-400">
                      One paste. Three steps. Better grades.
                    </p>
                  </div>

                  {/* 3-step grid */}
                  <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
                    {/* All three step cards now share the brand-purple
                        accent (was: blue · purple · orange). Single-
                        colour treatment per user brief — keeps the
                        section visually consistent with the rest of
                        the new purple-themed hero. */}
                    {[
                      {
                        step: '1',
                        title: 'Paste your work',
                        desc: 'Drop in an essay draft for feedback, or paste any notes / textbook chapter for study tools.',
                        mascot: '/mascot-paper.webp',
                      },
                      {
                        step: '2',
                        title: 'AI does the heavy lifting',
                        desc: 'In under 60 seconds, get rubric-graded essay feedback or 7 study tools generated from your notes.',
                        mascot: '/mascot-laptop.webp',
                      },
                      {
                        step: '3',
                        title: 'Submit & ace it',
                        desc: 'Hand in stronger essays. Walk into exams ready. Crush your next semester.',
                        mascot: '/mascot-celebrating.webp',
                      },
                    ].map((s, i) => {
                      // Single shared purple accent for all 3 steps.
                      const accentBorder = 'border-[#A560E8]/60 dark:border-[#8A48C7]/50';
                      const accentRing = 'ring-[#A560E8]/30';
                      const accentGlow = 'from-[#A560E8]/30 via-[#A560E8]/15 to-[#A560E8]/15';
                      const badge = 'bg-[#A560E8]';
                      return (
                      <div
                        key={s.step}
                        className={`relative rounded-3xl border ${accentBorder} bg-white dark:bg-stone-900 p-5 sm:p-6 shadow-none hover:-translate-y-1 transition-all duration-500 overflow-hidden`}
                        style={{ animationDelay: `${i * 120}ms` }}
                      >
                        <div className={`pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full bg-gradient-to-br ${accentGlow} blur-3xl opacity-70`} aria-hidden />
                        <div className="relative flex items-start gap-3 mb-3">
                          <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white text-sm font-bold shadow-md ring-2 ring-white dark:ring-stone-900 ${badge}`}>
                            {s.step}
                          </span>
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#A560E8] dark:text-[#A560E8] mb-0.5">
                              Step {s.step}
                            </p>
                            <h3
                              className="text-lg sm:text-xl font-extrabold text-stone-900 dark:text-stone-50 leading-tight"
                              style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
                            >
                              {s.title}
                            </h3>
                          </div>
                        </div>
                        <div className={`relative rounded-2xl border ${accentBorder} bg-gradient-to-br from-stone-50 to-white dark:from-stone-800/60 dark:to-stone-900 ring-1 ${accentRing} aspect-[16/10] overflow-hidden flex items-center justify-center`}>
                          <img
                            src={s.mascot}
                            alt=""
                            aria-hidden
                            loading="lazy"
                            decoding="async"
                            className="w-32 sm:w-40 h-auto"
                          />
                        </div>
                        <p className="relative mt-4 text-[14px] text-stone-600 dark:text-stone-400 leading-relaxed">
                          {s.desc}
                        </p>
                      </div>
                      );
                    })}
                  </div>
                </LandingScrollReveal>
              </div>

              {/* ─── WRITING WORKSPACE SHOWCASE ───────────────────────
                  The product is no longer just an essay grader — it's a
                  full editor where the AI coaches + rewrites your draft
                  and exports a clean Word doc. This section makes that
                  differentiator visible: a real screenshot of the 3-col
                  workspace + four proof points (live rubric, one-click
                  apply, real-essay objects, Word round-trip). Matches
                  the page's purple/Nunito/Duolingo conventions. ─── */}
              <section
                id="writing-workspace"
                className="relative w-full max-w-7xl mx-auto mt-2 sm:mt-4 pb-16 sm:pb-20 lg:pb-28 px-1 sm:px-2 lg:px-4 scroll-mt-24"
                aria-labelledby="writing-workspace-heading"
              >
                <div className="pointer-events-none absolute -top-8 left-[6%] w-32 h-32 rounded-full bg-[#A560E8]/15 dark:bg-[#A560E8]/12 blur-3xl" aria-hidden />
                <div className="pointer-events-none absolute -bottom-4 right-[8%] w-36 h-36 rounded-full bg-[#A560E8]/15 dark:bg-[#A560E8]/12 blur-3xl" aria-hidden />

                <div className="relative w-full max-w-6xl mx-auto mb-8 sm:mb-10 flex items-center gap-4 sm:gap-6 px-1" aria-hidden>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-stone-300/80 to-stone-300/80 dark:via-stone-700/60 dark:to-stone-700/60" />
                  <span className="inline-flex items-center gap-2 rounded-full border-2 border-[#E5E5E5] dark:border-stone-700 bg-white dark:bg-stone-900 px-4 py-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-[0.18em] text-[#A560E8] dark:text-[#A560E8] whitespace-nowrap">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M17.414 2.586a2 2 0 010 2.828l-9.5 9.5a2 2 0 01-.878.505l-3.5 1a1 1 0 01-1.237-1.237l1-3.5a2 2 0 01.505-.878l9.5-9.5a2 2 0 012.828 0z" />
                    </svg>
                    Your writing workspace
                  </span>
                  <div className="flex-1 h-px bg-gradient-to-l from-transparent via-stone-300/80 to-stone-300/80 dark:via-stone-700/60 dark:to-stone-700/60" />
                </div>

                <LandingScrollReveal>
                  <div className="relative text-center mb-8 sm:mb-10 lg:mb-12 max-w-2xl mx-auto">
                    <h2
                      id="writing-workspace-heading"
                      className="text-2xl sm:text-3xl lg:text-[2.4rem] font-extrabold text-stone-900 dark:text-stone-50 tracking-tight leading-[1.05]"
                      style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
                    >
                      Not just a grader —{' '}
                      <span className="text-[#A560E8] dark:text-[#A560E8]">a full writing workspace.</span>
                    </h2>
                    <p className="mt-3 text-sm sm:text-base text-stone-600 dark:text-stone-400 leading-relaxed">
                      Write your essay in a real editor with live, professor-style feedback in the margin. Apply suggested fixes straight into your draft — then export a perfectly formatted Word doc.
                    </p>
                  </div>

                  {/* Big focal screenshot — the image is the star.
                      Numbered dots sit on the regions; the four proof
                      points sit in a row right below, each numbered to
                      its dot (no flanking arrow-callouts). */}
                  <div className="relative max-w-6xl mx-auto">
                    <DottedShot
                      src="/WriterPic.png"
                      alt="WriteScholar writing workspace — study tools rail, the draft in a real editor, a live rubric with an estimated grade, and one-click revision suggestions"
                      badges={[
                        { n: 1, x: 84, y: 29 },
                        { n: 2, x: 84, y: 82 },
                        { n: 3, x: 42, y: 55 },
                        { n: 4, x: 34, y: 3 },
                      ]}
                    />
                    <div
                      aria-hidden
                      className="hidden sm:flex absolute -top-4 -right-4 lg:-top-5 lg:-right-5 items-center justify-center px-3.5 h-11 lg:h-13 rounded-2xl bg-[#58CC02] text-white text-sm lg:text-base font-extrabold rotate-[6deg] border-2 border-b-4 border-[#46A302] shadow-[0_18px_32px_-8px_rgba(88,204,2,0.5)] z-10"
                    >
                      B · 80–89%
                    </div>
                  </div>

                  <div className="mt-10 sm:mt-12 max-w-6xl mx-auto">
                    <NumberedPoints
                      cols="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
                      points={[
                        { n: 1, title: 'Live grade & rubric', desc: 'An estimated grade band and a full professor-style rubric, updating as you write — no copy-paste loop.', icon: (<svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M9 5h6m-6 0a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V7a2 2 0 00-2-2m-6 0a2 2 0 012-2h2a2 2 0 012 2M9 14l2 2 4-4" /></svg>) },
                        { n: 2, title: 'One-click apply', desc: 'Accept a suggested rewrite and it drops straight into your draft, exactly where it belongs.', icon: (<svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M13 3L4 14h6l-1 7 9-11h-6z" /></svg>) },
                        { n: 3, title: 'Built for real essays', desc: 'Write the actual paper here — tables, images, citations and footnotes are built in, not bolted on.', icon: (<svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M7 3h7l5 5v11a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2zM14 3v5h5M9 13h6M9 17h6" /></svg>) },
                        { n: 4, title: 'Word in, Word out', desc: 'Import a .docx and your bold, italics and headings carry over. Export and it comes back perfectly formatted.', icon: (<svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M9 16V4m0 0L5.5 7.5M9 4l3.5 3.5M15 8v12m0 0l3.5-3.5M15 20l-3.5-3.5" /></svg>) },
                      ]}
                    />
                  </div>

                  <div className="mt-10 sm:mt-12 flex justify-center">
                    <button
                      type="button"
                      onClick={() => onNavigate('signup')}
                      className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-[#A560E8] hover:bg-[#8A48C7] text-white text-base sm:text-lg font-extrabold uppercase tracking-wide px-7 sm:px-9 py-4 border-2 border-b-4 border-[#7733B5] active:border-b-2 active:translate-y-0.5 transition-all shadow-[0_18px_32px_-12px_rgba(165,96,232,0.55)]"
                    >
                      Start writing free
                      <svg className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </button>
                  </div>
                </LandingScrollReveal>
              </section>

              {/* ─── WHY WRITESCHOLAR vs ChatGPT ──────────────────────
                  Students' default alternative is "just use ChatGPT".
                  This head-to-head makes the difference explicit:
                  WriteScholar grades to a rubric and edits in a real
                  workspace; ChatGPT is a generic chat box. On-theme
                  (brand-purple WriteScholar card vs neutral GPT card). */}
              <section className="relative w-full max-w-5xl mx-auto mt-4 sm:mt-8 pb-16 sm:pb-20 px-3 sm:px-4">
                <LandingScrollReveal>
                  <div className="relative text-center max-w-2xl mx-auto mb-8 sm:mb-12 px-1">
                    <span className="inline-flex items-center gap-1.5 mb-4 rounded-full border border-[#A560E8]/25 dark:border-[#A560E8]/30 bg-[#F3EAFF] dark:bg-[#A560E8]/12 px-3 py-1 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#8A48C7] dark:text-[#C9A0F0]">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24" aria-hidden><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6z" /></svg>
                      Why WriteScholar
                    </span>
                    <h2
                      className="text-3xl sm:text-4xl lg:text-[2.85rem] font-extrabold text-stone-900 dark:text-stone-50 tracking-tight leading-[1.05]"
                      style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
                    >
                      Not another AI chatbot
                    </h2>
                    <p className="mt-3 text-sm sm:text-base text-stone-600 dark:text-stone-400 leading-relaxed">
                      Most students just paste into ChatGPT. Here&apos;s why a tool built to mark essays beats a general chat box.
                    </p>
                  </div>

                  <div className="relative rounded-2xl sm:rounded-[2.25rem] border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-[0_30px_80px_-40px_rgba(96,48,140,0.45)] p-2 sm:p-5">
                    {/* Center "VS" pip — bridges the two cards. */}
                    <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden lg:flex">
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white dark:bg-stone-900 border-2 border-[#A560E8]/40 text-[#8A48C7] dark:text-[#C9A0F0] text-sm font-extrabold shadow-[0_8px_22px_-8px_rgba(96,48,140,0.5)]">VS</span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                      {/* WriteScholar — the winner: elevated, glowing. */}
                      <div className="relative rounded-[1.25rem] sm:rounded-[1.5rem] bg-gradient-to-br from-[#A560E8] to-[#7733B5] text-white p-5 sm:p-8 shadow-[0_24px_50px_-20px_rgba(165,96,232,0.65)] lg:scale-[1.015]">
                        <div aria-hidden className="pointer-events-none absolute -top-px left-6 right-6 h-px bg-white/30" />
                        <div className="flex items-center justify-between gap-3 mb-5 sm:mb-6">
                          <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/15 border border-white/25 flex items-center justify-center">
                              <img src="/main-logo.png" alt="" aria-hidden className="w-full h-full object-contain" />
                            </div>
                            <span className="text-xl font-extrabold tracking-tight" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>WriteScholar</span>
                          </div>
                          <span className="hidden sm:inline-flex shrink-0 rounded-full bg-white/20 border border-white/25 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider">Built for essays</span>
                        </div>
                        <ul className="space-y-0">
                          {[
                            'Graded to a real rubric — /100, letter band, every category scored',
                            'Line-by-line feedback mapped to your exact sentences',
                            'A real editor: apply fixes into your draft, export clean Word',
                            'Built for academic essays — citations, structure, a professor lens',
                          ].map((t, i) => (
                            <li key={i} className={`flex items-start gap-3 py-2.5 sm:py-3.5 ${i > 0 ? 'border-t border-white/15' : ''}`}>
                              <span className="shrink-0 mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24" aria-hidden>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              </span>
                              <span className="text-[13.5px] sm:text-[15px] font-bold leading-snug">{t}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* ChatGPT — muted, secondary. */}
                      <div className="rounded-[1.25rem] sm:rounded-[1.5rem] bg-stone-50 dark:bg-stone-950/40 border border-stone-200/70 dark:border-stone-800 p-5 sm:p-8">
                        <div className="flex items-center gap-2.5 mb-5 sm:mb-6 opacity-90">
                          <div className="w-10 h-10 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center">
                            <svg className="w-5 h-5 text-stone-500 dark:text-stone-300" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                              <path d="M22.28 9.82a5.99 5.99 0 0 0-.52-4.91 6.05 6.05 0 0 0-6.52-2.9A6 6 0 0 0 4.98 4.18a5.99 5.99 0 0 0-4 2.9 6.05 6.05 0 0 0 .74 7.1 5.99 5.99 0 0 0 .52 4.91 6.05 6.05 0 0 0 6.52 2.9A6 6 0 0 0 19.02 19.8a5.99 5.99 0 0 0 4-2.9 6.05 6.05 0 0 0-.74-7.08Zm-9.02 12.6a4.48 4.48 0 0 1-2.88-1.04l.14-.08 4.78-2.76a.78.78 0 0 0 .4-.68v-6.74l2.02 1.17a.07.07 0 0 1 .04.06v5.58a4.5 4.5 0 0 1-4.5 4.49ZM3.6 18.2a4.47 4.47 0 0 1-.54-3.01l.14.09 4.78 2.76a.78.78 0 0 0 .78 0l5.84-3.37v2.33a.08.08 0 0 1-.03.07l-4.83 2.79a4.5 4.5 0 0 1-6.14-1.65ZM2.34 7.9a4.49 4.49 0 0 1 2.34-1.97v5.68a.77.77 0 0 0 .39.68l5.81 3.35-2.02 1.17a.08.08 0 0 1-.07 0L3.96 14a4.5 4.5 0 0 1-1.62-6.1Zm16.6 3.86-5.84-3.39 2.02-1.16a.07.07 0 0 1 .07 0l4.83 2.79a4.49 4.49 0 0 1-.68 8.1v-5.67a.78.78 0 0 0-.4-.67Zm2.01-3.03-.14-.08-4.77-2.78a.78.78 0 0 0-.79 0L9.43 9.24V6.91a.07.07 0 0 1 .03-.07l4.83-2.78a4.5 4.5 0 0 1 6.68 4.66ZM8.33 12.86 6.3 11.7a.08.08 0 0 1-.04-.06V6.07a4.5 4.5 0 0 1 7.38-3.45l-.14.08L8.72 5.46a.78.78 0 0 0-.4.68ZM9.43 10.5 12.03 9l2.6 1.5v3l-2.6 1.5-2.6-1.5Z" />
                            </svg>
                          </div>
                          <span className="text-xl font-extrabold tracking-tight text-stone-700 dark:text-stone-200" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>ChatGPT</span>
                        </div>
                        <ul className="space-y-0">
                          {[
                            'Generic praise — no consistent rubric, score, or grade',
                            'One block of advice you re-find in your draft yourself',
                            'Copy-paste back and forth between a chat box and your doc',
                            'A general chat model — not built for marking essays',
                          ].map((t, i) => (
                            <li key={i} className={`flex items-start gap-3 py-2.5 sm:py-3.5 ${i > 0 ? 'border-t border-stone-200 dark:border-stone-800' : ''}`}>
                              <span className="shrink-0 mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-stone-200/70 dark:bg-stone-800">
                                <svg className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24" aria-hidden>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </span>
                              <span className="text-[13.5px] sm:text-[15px] font-semibold leading-snug text-stone-500 dark:text-stone-400">{t}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="mt-9 sm:mt-11 flex flex-col items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onNavigate('signup')}
                      className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-[#A560E8] hover:bg-[#8A48C7] text-white text-base sm:text-lg font-extrabold uppercase tracking-wide px-7 sm:px-9 py-4 border-2 border-b-4 border-[#7733B5] active:border-b-2 active:translate-y-0.5 transition-all shadow-[0_18px_32px_-12px_rgba(165,96,232,0.55)]"
                    >
                      Start writing free
                      <svg className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </button>
                    <p className="text-[12px] sm:text-xs font-bold text-stone-400 dark:text-stone-500">No credit card · Free plan included</p>
                  </div>
                </LandingScrollReveal>
              </section>

              {/* Analysis preview — restored eyebrow + h2 + subhead
                  block (was removed in the Knowunity hero rebuild). The
                  copy is the same one shipped on the pre-rebuild landing
                  (commit 4763c37), restyled to the current cream-section
                  language. Two-line H1, paper-mascot floating to the
                  left on lg+, and floating ✦/📝 sparkles in the corners
                  on xl+ — restores the "Analyze papers" decorative feel
                  from the older 4763c37 / aec4bd3 commits. */}
              <div
                id="landing-tools"
                className="relative w-full max-w-6xl mx-auto mt-4 sm:mt-8 lg:mt-10 scroll-mt-24 px-1.5 sm:px-2 lg:px-1"
              >
                {/* Floating decorations — visible at xl+ only so they
                    don't compete on smaller screens. Echoes commit
                    4763c37 which had 📝 + ✨ in the same corners. */}
                <div
                  className="hidden xl:block pointer-events-none absolute top-[2%] left-[3%] text-4xl opacity-40 motion-safe:animate-[hero-tile-drift_5s_ease-in-out_infinite]"
                  aria-hidden
                >📝</div>
                <div
                  className="hidden xl:block pointer-events-none absolute top-[8%] right-[4%] text-3xl opacity-35 motion-safe:animate-[hero-tile-drift_6s_ease-in-out_infinite]"
                  style={{ animationDelay: '1.4s' }}
                  aria-hidden
                >✨</div>

                <div className="relative text-center max-w-[34rem] lg:max-w-[40rem] xl:max-w-[46rem] mx-auto mb-8 sm:mb-10 lg:mb-12 px-2">
                  {/* Paper-themed mascot — gently floats on lg+. Now
                      positioned ABSOLUTELY to the RIGHT of the heading
                      block (was left). `left-full ml-6` mirrors the
                      previous `right-full mr-6` so the heading stays
                      centred and the mascot sits in the right margin. */}
                  <img
                    src="/mascot-paper.webp"
                    alt=""
                    aria-hidden
                    loading="lazy"
                    decoding="async"
                    className="hidden lg:block absolute left-full top-1/2 -translate-y-1/2 ml-6 w-24 xl:w-28 h-auto shrink-0 motion-safe:animate-[hero-tile-drift_4.5s_ease-in-out_infinite] [filter:drop-shadow(0_14px_24px_rgba(165,96,232,0.30))]"
                  />

                  <span className="inline-flex items-center gap-2 rounded-full border-2 border-[#E5E5E5] dark:border-stone-700 bg-white/80 dark:bg-stone-900/70 backdrop-blur px-3.5 py-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-[#A560E8] dark:text-[#A560E8] mb-4">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                      <path d="M9 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H5a1 1 0 110-2h2V6.477L5.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 014 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L8 4.323V3a1 1 0 011-1z" />
                    </svg>
                    Feedback that grades like a professor
                  </span>
                  {/* Explicit 2-line layout — each phrase on its own
                      block element so the wrap is predictable on any
                      viewport instead of relying on the browser to
                      choose the right break point. */}
                  <h2
                    className="text-[1.35rem] sm:text-[1.7rem] lg:text-[2.15rem] xl:text-[2.4rem] font-extrabold text-stone-900 dark:text-stone-50 tracking-tight leading-[1.05]"
                    style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
                  >
                    <span className="block">Upload your essay and</span>
                    <span className="block mt-1 sm:mt-1.5 text-[#A560E8] dark:text-[#A560E8]">get professor style feedback in 60 seconds</span>
                  </h2>
                  <p className="mt-3 sm:mt-4 text-sm sm:text-base lg:text-lg text-stone-600 dark:text-stone-400 leading-relaxed max-w-2xl mx-auto">
                    Drop in your essay. Get a /100 grade, colour-coded line-by-line feedback, and a full professor-style report — in under a minute.
                  </p>
                </div>

                {/* Original sideways arrow-callout style — the two
                    analyzer screenshots joined into ONE photo (rubric
                    view + full report in a single frame) with 9
                    numbered badges and flanking callout cards. */}
                <LandingCombinedAnalyzerCallouts />

                {/* The "Try the live interactive demo" link + the
                    `#interactive-essay-demo` anchor that used to sit
                    here both pointed at a copy of the analyzer that's
                    now redundant — the hero's `#hero-interactive-demo`
                    is the canonical place to try it. Removed for that
                    reason. */}
                <div className="text-center mt-8 sm:mt-10">
                  <button
                    type="button"
                    onClick={() => onNavigate('signup')}
                    className="inline-flex items-center px-8 py-3.5 bg-[#58CC02] hover:bg-[#61E002] dark:bg-[#58CC02] dark:hover:bg-[#61E002] text-white font-extrabold rounded-2xl border-2 border-b-4 border-[#46A302] hover:-translate-y-0.5 active:border-b-2 active:translate-y-0.5 transition-all duration-200 text-base"
                  >
                    Try your first analysis
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                  <p className="mt-4 text-sm text-stone-500 dark:text-stone-400">
                    Free plan includes 2 analyses per month
                  </p>
                </div>

                {/* ─── "And it doesn't stop at essays" bridge — directs the
                    visitor's eye to the second big product (study tools) so it
                    isn't buried below the fold. ─── */}
                <div className="hidden sm:block mt-12 sm:mt-16 mb-20 sm:mb-28 lg:mb-32 max-w-5xl mx-auto px-1">
                  <a
                    href="#study-tools"
                    className="group relative block rounded-3xl border-2 border-b-4 border-[#A560E8]/40 dark:border-[#8A48C7]/40 bg-[#F3EAFF] dark:bg-stone-900/60 p-6 sm:p-8 hover:-translate-y-0.5 transition-all overflow-hidden"
                  >
                    <div className="pointer-events-none absolute -top-12 -right-12 w-48 h-48 rounded-full bg-[#58CC02]/15 dark:bg-[#58CC02]/12 blur-3xl" aria-hidden />
                    <div className="pointer-events-none absolute -bottom-16 -left-12 w-44 h-44 rounded-full bg-[#1CB0F6]/15 dark:bg-[#1CB0F6]/12 blur-3xl" aria-hidden />

                    <div className="relative grid grid-cols-1 sm:grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-5 sm:gap-6">
                      {/* Juggling mascot — "Scholar juggles 7 study tools so you don't have to" */}
                      <img
                        src="/mascot-juggling.webp"
                        alt=""
                        aria-hidden
                        loading="lazy"
                        decoding="async"
                        className="hidden sm:block w-28 lg:w-36 h-auto justify-self-center drop-shadow-[0_14px_24px_rgba(217,70,239,0.35)]"
                      />

                      <div className="text-center sm:text-left">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F3EAFF] dark:bg-[#A560E8]/20 text-[#A560E8] dark:text-[#A560E8] text-[10px] font-bold uppercase tracking-wider mb-2">
                          <span aria-hidden>▸</span>
                          And it doesn&apos;t stop at essays
                        </span>
                        <h3
                          className="text-xl sm:text-2xl lg:text-[1.65rem] font-extrabold text-stone-900 dark:text-stone-50 tracking-tight leading-tight"
                          style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
                        >
                          Paste any notes,{' '}
                          <span className="text-[#A560E8] dark:text-[#A560E8]">
                            get 7 study tools
                          </span>{' '}
                          in 60 seconds
                        </h3>
                        <p className="mt-2 text-sm sm:text-[15px] text-stone-600 dark:text-stone-400 leading-relaxed">
                          Lessons, flashcards, quizzes, crosswords, plus arcade games like{' '}
                          <span className="font-semibold text-stone-800 dark:text-stone-200">Crater Blast</span> and{' '}
                          <span className="font-semibold text-stone-800 dark:text-stone-200">Word Tower</span>.
                        </p>
                      </div>

                      <span className="hidden sm:inline-flex items-center gap-1.5 self-center justify-self-end rounded-full bg-[#A560E8] px-4 py-2.5 text-sm font-extrabold text-white border-2 border-b-4 border-[#8A48C7] active:border-b-2 active:translate-y-0.5 transition-colors">
                        See study tools
                        <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </span>

                      {/* Mobile-only chevron under the text */}
                      <span className="sm:hidden inline-flex items-center justify-center gap-1.5 mt-2 rounded-full bg-[#A560E8] px-4 py-2.5 text-sm font-extrabold text-white border-2 border-b-4 border-[#8A48C7] active:border-b-2 active:translate-y-0.5">
                        See study tools
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </span>
                    </div>
                  </a>
                </div>

              </div>

              {/* ─── Before/After essay transformation — HIDDEN.
                  The "Turn a Mid-B Essay Into an A" block was removed
                  from the landing flow. Re-enable by:
                    1. `const LandingBeforeAfterSection =
                        lazyWithRetry(() => import('../landing/LandingBeforeAfterSection'));`
                    2. Render `<Suspense fallback={null}>
                        <LandingBeforeAfterSection /></Suspense>` here. */}



              {/* ─── How your draft is reviewed — modernized to match the
                  new landing theme. Combined the legend + 5 focus-area cards
                  into one cohesive section. Hidden on mobile (too dense for
                  phones — desktop keeps the full 5-card grid). ─── */}
              <section
                id="hero-feedback-details"
                className="hidden relative w-full max-w-7xl mx-auto mt-14 sm:mt-20 lg:mt-24 px-1 sm:px-2 lg:px-4 scroll-mt-24"
                aria-labelledby="hero-feedback-details-heading"
              >
                <div className="pointer-events-none absolute -top-8 left-[8%] w-32 h-32 rounded-full bg-[#1CB0F6]/15 dark:bg-[#1CB0F6]/12 blur-3xl" aria-hidden />
                <div className="pointer-events-none absolute -bottom-4 right-[8%] w-36 h-36 rounded-full bg-[#58CC02]/15 dark:bg-[#58CC02]/12 blur-3xl" aria-hidden />

                <LandingScrollReveal>
                  <div className="relative text-center mb-8 sm:mb-10 max-w-2xl mx-auto">
                    <span className="inline-flex items-center gap-2 mb-3 rounded-full border-2 border-[#E5E5E5] dark:border-stone-700 bg-white/80 dark:bg-stone-900/70 backdrop-blur px-3.5 py-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-[#1CB0F6] dark:text-[#1CB0F6]">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                        <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      How your draft is reviewed
                    </span>
                    <h2
                      id="hero-feedback-details-heading"
                      className="text-2xl sm:text-3xl lg:text-[2.4rem] font-extrabold text-stone-900 dark:text-stone-50 tracking-tight leading-[1.05]"
                      style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
                    >
                      Five things our analyzer{' '}
                      <span className="text-[#58CC02] dark:text-[#58CC02]">never misses.</span>
                    </h2>
                    <p className="mt-2 text-sm sm:text-base text-stone-600 dark:text-stone-400">
                      Every essay you upload gets the same five-point treatment. Hover any annotation for the explanation.
                    </p>

                    {/* Annotation legend — strong / revise / concern */}
                    <div
                      className="mt-5 flex flex-wrap items-center justify-center gap-2 text-[11px] sm:text-xs text-stone-700 dark:text-stone-300"
                      aria-label="Annotation legend: strong, revise, concern"
                    >
                      {[
                        { label: 'Strong', color: 'bg-[#58CC02]', glow: 'shadow-[0_0_10px_rgba(88,204,2,0.45)]' },
                        { label: 'Revise', color: 'bg-[#FF9600]', glow: 'shadow-[0_0_10px_rgba(255,150,0,0.45)]', delay: '0.25s' },
                        { label: 'Concern', color: 'bg-[#FF4B4B]', glow: 'shadow-[0_0_10px_rgba(255,75,75,0.40)]', delay: '0.5s' },
                      ].map((tag) => (
                        <span
                          key={tag.label}
                          className="inline-flex items-center gap-1.5 rounded-full border border-stone-200/80 dark:border-stone-700/70 bg-white dark:bg-stone-900 px-3 py-1 shadow-sm"
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${tag.color} ${tag.glow} motion-safe:animate-[pulse_2.8s_ease-in-out_infinite]`}
                            style={tag.delay ? { animationDelay: tag.delay } : undefined}
                            aria-hidden
                          />
                          <span className="font-semibold">{tag.label}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </LandingScrollReveal>

                {/* 5 focus-area cards — modern grid with tone-tinted gradients,
                    matched to the rest of the new landing theme. */}
                <LandingScrollReveal>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 max-w-6xl mx-auto">
                    {heroFeatureCards.map((card, idx) => (
                      <LandingScrollReveal
                        key={card.title}
                        className="h-full"
                        delayMs={idx * 90}
                      >
                        <button
                          type="button"
                          onClick={card.onClick}
                          className="group relative w-full h-full text-left rounded-2xl border-2 border-b-4 border-[#E5E5E5] dark:border-stone-700 bg-white dark:bg-stone-900 p-4 sm:p-5 hover:-translate-y-1 hover:border-[#1CB0F6] dark:hover:border-[#1CB0F6]/60 transition-all duration-300 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1CB0F6]/40"
                        >
                          {/* Step badge + icon */}
                          <div className="relative flex items-start gap-2.5 mb-3">
                            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base shadow-sm ring-1 ring-stone-200/80 dark:ring-stone-700/60 ${card.accentClasses.iconBg}`}>
                              {card.icon}
                            </span>
                            <div className="min-w-0">
                              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-500 dark:text-stone-400 mb-0.5">
                                {String(idx + 1).padStart(2, '0')}
                              </p>
                              <h3
                                className="text-[15px] font-extrabold text-stone-900 dark:text-stone-100 leading-tight"
                                style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
                              >
                                {card.title}
                              </h3>
                            </div>
                          </div>

                          {/* Inner mini-preview panel */}
                          <div className="relative rounded-xl bg-stone-50/80 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-700/70 p-3 mb-3 min-h-[72px] flex items-center justify-center overflow-hidden">
                            {card.inner}
                          </div>

                          <p className="text-[12px] text-stone-600 dark:text-stone-400 leading-snug">{card.desc}</p>

                          {/* Hover arrow */}
                          <span className="pointer-events-none absolute top-3 right-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
                            <svg className="w-4 h-4 text-[#1CB0F6] dark:text-[#1CB0F6]" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </span>
                        </button>
                      </LandingScrollReveal>
                    ))}
                  </div>
                </LandingScrollReveal>

                <LandingScrollReveal className="w-full" delayMs={420}>
                  <p className="mt-6 sm:mt-8 text-center text-xs text-stone-500 dark:text-stone-400 leading-relaxed max-w-2xl mx-auto">
                    Free plan includes 2 essay analyses per month · Encrypted in transit · Cancel anytime · Quizzes &amp; flashcards live under{' '}
                    <button type="button" onClick={() => onNavigate('more-tools')} className="text-[#1CB0F6] dark:text-[#1CB0F6] font-extrabold hover:underline transition-colors">
                      More tools
                    </button>
                  </p>
                </LandingScrollReveal>

                {/* Extra breathing room before the next landing section so the
                    fine-print line doesn't jam into the study tools showcase. */}
                <div className="h-12 sm:h-20 lg:h-24" aria-hidden />
              </section>
            </div>

          </div>
        </div>
      </section>

      {/* Study tools sits above citations — flagship feature first. */}
      <Suspense fallback={<div className="min-h-[640px] w-full" aria-hidden />}>
        <LandingStudyToolsHero onNavigate={onNavigate} />
      </Suspense>

      {/* Social proof: testimonial + universities — placed beneath the
          study-tools showcase so visitors see the "7 study tools" promise
          first, then immediately land on the proof that students at top
          universities use it.
          TEMPORARILY HIDDEN via the leading `hidden` class — keep markup
          intact for easy re-enable (just remove `hidden` from className). */}
      <div
        className="hidden relative w-full overflow-x-clip overflow-hidden
          border-y border-stone-200/90 dark:border-stone-800
          bg-[#fafafa] dark:bg-stone-950
          shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-none"
        aria-label="Social proof: student testimonial and universities"
        aria-hidden="true"
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_-20%,rgba(28,176,246,0.04),transparent_50%)] dark:bg-[radial-gradient(ellipse_90%_70%_at_50%_-20%,rgba(28,176,246,0.08),transparent_50%)]"
          aria-hidden
        />
        <div className="relative z-10 pt-10 pb-8 sm:pt-12 sm:pb-10">
          <div className="max-w-6xl mx-auto px-3 sm:px-6">
            {/* Testimonial card — minimal, just the quote. Modern
                violet/fuchsia frame with a glow halo and a quote mark. */}
            <figure className="relative rounded-3xl border-2 border-b-4 border-[#E5E5E5] dark:border-stone-700 bg-white dark:bg-stone-900/70 px-5 py-6 sm:px-10 sm:py-9 w-full max-w-2xl min-w-0 mx-auto mb-9 sm:mb-12 overflow-hidden">
              <div className="pointer-events-none absolute -top-12 -right-12 w-40 h-40 rounded-full bg-[#1CB0F6]/20 dark:bg-[#1CB0F6]/15 blur-3xl" aria-hidden />
              <div className="pointer-events-none absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-[#58CC02]/15 dark:bg-[#58CC02]/12 blur-3xl" aria-hidden />

              <blockquote className="relative m-0 border-0 p-0 w-full text-center">
                <span
                  className="block text-[#1CB0F6]/40 dark:text-[#1CB0F6]/30 text-5xl sm:text-6xl leading-none mb-2 select-none"
                  aria-hidden
                >
                  &ldquo;
                </span>
                <p
                  className="text-stone-800 dark:text-stone-100 text-base sm:text-xl leading-snug sm:leading-relaxed font-medium italic break-words px-0.5"
                  style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
                >
                  Went from a B to an A in one submission. The feedback was exactly what my professor wanted.
                </p>
              </blockquote>
            </figure>

            {/* Universities header — modernized eyebrow + serif */}
            <div className="w-full max-w-2xl mx-auto text-center mb-7 sm:mb-9 px-1">
              <span className="inline-flex items-center gap-1.5 mb-3 rounded-full border-2 border-[#E5E5E5] dark:border-stone-700 bg-white/80 dark:bg-stone-900/70 backdrop-blur px-3 py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-[#1CB0F6] dark:text-[#1CB0F6]">
                <span aria-hidden>★</span>
                Used at top universities
              </span>
              <h3
                className="text-xl sm:text-2xl lg:text-[1.65rem] font-extrabold text-stone-900 dark:text-stone-50 tracking-tight leading-tight"
                style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
              >
                Students at <span className="text-[#1CB0F6] dark:text-[#1CB0F6]">leading universities</span> use WriteScholar
              </h3>
            </div>
          </div>

          {/* University name carousel — gradient pill chips */}
          <div className="relative overflow-hidden px-0">
            <div
              className="pointer-events-none absolute inset-y-0 left-0 z-10 w-14 sm:w-24 bg-gradient-to-r from-[#fafafa] dark:from-stone-950 via-[#fafafa] dark:via-stone-950 to-transparent"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-y-0 right-0 z-10 w-14 sm:w-24 bg-gradient-to-l from-[#fafafa] dark:from-stone-950 via-[#fafafa] dark:via-stone-950 to-transparent"
              aria-hidden
            />
            <div className="flex w-max animate-scroll-slow items-center py-1">
              {[...universities, ...universities, ...universities].map((uni, idx) => (
                <div key={`hero-uni-${idx}`} className="flex-shrink-0 mx-2 sm:mx-3">
                  <span
                    className={`inline-flex items-center gap-2 rounded-xl border-2 border-b-4 border-[#E5E5E5] dark:border-stone-700 bg-white dark:bg-stone-900 px-4 py-2.5 sm:px-5 sm:py-3 text-sm sm:text-[15px] font-extrabold hover:-translate-y-0.5 transition-all duration-300 ${uni.className} !text-stone-800 dark:!text-stone-100`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-[#1CB0F6] shrink-0" aria-hidden />
                    {uni.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── "Study daily. Level up." — gamification showcase.
          Daily Review, XP, Levels, Streaks, Badges — the habit loop
          that makes WriteScholar feel like Duolingo for academics.
          TEMPORARILY HIDDEN — re-enable by changing `false` below to `true`. ─── */}
      {false && (
      <section id="motivation" className="relative py-10 sm:py-24 overflow-hidden border-t border-[#E5E5E5] dark:border-stone-800 bg-white dark:bg-stone-950 scroll-mt-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-15%,rgba(165,96,232,0.06),transparent_55%)] dark:bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(165,96,232,0.10),transparent_55%)]" aria-hidden />
        <div
          className="absolute inset-0 opacity-[0.4] dark:opacity-[0.15] pointer-events-none bg-[length:32px_32px] bg-[linear-gradient(to_right,rgba(148,163,184,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.07)_1px,transparent_1px)]"
          aria-hidden
        />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <LandingScrollReveal>
            {/* Header */}
            <div className="text-center mb-10 sm:mb-14 max-w-2xl mx-auto">
              <span className="inline-flex items-center gap-2 mb-4 rounded-full border border-[#A560E8]/30 dark:border-[#8A48C7]/40 bg-[#F3EAFF]/80 dark:bg-[#A560E8]/10 backdrop-blur px-3.5 py-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-[#A560E8] dark:text-[#A560E8] shadow-sm">
                <span aria-hidden>🔥</span>
                The habit loop that keeps grades up
              </span>
              <h2
                className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold text-[#3C3C3C] dark:text-stone-50 tracking-tight leading-[1.05]"
                style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
              >
                Studying that{' '}
                <span className="text-[#A560E8]">
                  actually sticks.
                </span>
              </h2>
              <p className="mt-3 text-base sm:text-lg text-stone-600 dark:text-stone-400">
                Most students give up after week two. WriteScholar's streak + XP system makes studying the easy choice — so you actually show up the day before the test.
              </p>
            </div>

            {/* 4 feature cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {/* Daily Review */}
              <div className="relative rounded-2xl border-2 border-b-4 border-[#8A48C7] bg-white dark:bg-stone-900 p-5 sm:p-6 hover:-translate-y-1 transition-all overflow-hidden">
                <div className="pointer-events-none absolute -top-12 -right-12 w-36 h-36 rounded-full bg-[#A560E8]/15 dark:bg-[#A560E8]/10 blur-3xl" aria-hidden />
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-[#A560E8] flex items-center justify-center mb-4 border-2 border-b-4 border-[#8A48C7]">
                    <span className="text-xl" aria-hidden>📚</span>
                  </div>
                  <h3
                    className="text-lg font-extrabold text-[#3C3C3C] dark:text-stone-50 mb-2"
                    style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
                  >
                    Daily Review
                  </h3>
                  <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed mb-4">
                    10 minutes a day beats 4 hours of cramming. Your personalised drill from saved notes — built around what you keep getting wrong.
                  </p>
                  {/* Mini visual — lesson card mockup. Hidden on mobile to
                      cut card height; the description already tells the story. */}
                  <div className="hidden sm:block rounded-xl bg-[#F3EAFF]/60 dark:bg-[#A560E8]/10 border border-[#A560E8]/30 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-lg bg-[#A560E8] flex items-center justify-center">
                        <span className="text-white text-[10px] font-extrabold">1</span>
                      </div>
                      <span className="text-xs font-bold text-[#3C3C3C] dark:text-stone-200">Today&apos;s Session</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#A560E8]/20 overflow-hidden">
                      <div className="h-full w-[65%] rounded-full bg-[#A560E8]" />
                    </div>
                    <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-1.5 font-medium">3 of 5 questions done</p>
                  </div>
                </div>
              </div>

              {/* XP & Levels */}
              <div className="relative rounded-2xl border-2 border-b-4 border-[#7733B5] bg-white dark:bg-stone-900 p-5 sm:p-6 hover:-translate-y-1 transition-all overflow-hidden">
                <div className="pointer-events-none absolute -top-12 -right-12 w-36 h-36 rounded-full bg-[#8A48C7]/15 dark:bg-[#8A48C7]/10 blur-3xl" aria-hidden />
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-[#8A48C7] flex items-center justify-center mb-4 border-2 border-b-4 border-[#7733B5]">
                    <span className="text-xl" aria-hidden>⭐</span>
                  </div>
                  <h3
                    className="text-lg font-extrabold text-[#3C3C3C] dark:text-stone-50 mb-2"
                    style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
                  >
                    XP & 100 Levels
                  </h3>
                  <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed mb-4">
                    Every essay reviewed, every quiz aced, every streak day — they all stack into XP. Levels you actually want to chase.
                  </p>
                  {/* Mini visual — level badge + XP bar. Hidden on mobile. */}
                  <div className="hidden sm:block rounded-xl bg-[#F3EAFF]/60 dark:bg-[#8A48C7]/10 border border-[#8A48C7]/30 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg bg-[#8A48C7] flex items-center justify-center border-b-2 border-[#7733B5]">
                        <span className="text-white text-[11px] font-extrabold">12</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-extrabold text-[#3C3C3C] dark:text-stone-200 truncate">Knowledge Keeper III</p>
                        <div className="flex items-center gap-1">
                          <div className="flex-1 h-1.5 rounded-full bg-[#8A48C7]/20 overflow-hidden">
                            <div className="h-full w-[42%] rounded-full bg-[#8A48C7]" />
                          </div>
                          <span className="text-[8px] text-stone-500 dark:text-stone-400 font-bold tabular-nums">1,340 XP</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Streaks */}
              <div className="relative rounded-2xl border-2 border-b-4 border-[#8A48C7] bg-white dark:bg-stone-900 p-5 sm:p-6 hover:-translate-y-1 transition-all overflow-hidden">
                <div className="pointer-events-none absolute -top-12 -right-12 w-36 h-36 rounded-full bg-[#A560E8]/15 dark:bg-[#A560E8]/10 blur-3xl" aria-hidden />
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-[#A560E8] flex items-center justify-center mb-4 border-2 border-b-4 border-[#8A48C7]">
                    <span className="text-xl" aria-hidden>🔥</span>
                  </div>
                  <h3
                    className="text-lg font-extrabold text-[#3C3C3C] dark:text-stone-50 mb-2"
                    style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
                  >
                    Daily Streaks
                  </h3>
                  <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed mb-4">
                    Your streak is your accountability. Miss a day and you'll feel it — that's the point. It's how casual users become 4.0 students.
                  </p>
                  {/* Mini visual — streak counter. Hidden on mobile. */}
                  <div className="hidden sm:block rounded-xl bg-[#F3EAFF]/60 dark:bg-[#A560E8]/10 border border-[#A560E8]/30 p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl" aria-hidden>🔥</span>
                        <div>
                          <p className="text-lg font-extrabold text-[#A560E8]">14</p>
                          <p className="text-[10px] font-bold text-stone-500 dark:text-stone-400 -mt-0.5">day streak</p>
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                          <div
                            key={d + i}
                            className={`w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold ${
                              i < 6
                                ? 'bg-[#A560E8] text-white'
                                : 'bg-stone-200 dark:bg-stone-700 text-stone-400 dark:text-stone-500'
                            }`}
                          >
                            {d}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Badges */}
              <div className="relative rounded-2xl border-2 border-b-4 border-[#8A48C7] bg-white dark:bg-stone-900 p-5 sm:p-6 hover:-translate-y-1 transition-all overflow-hidden">
                <div className="pointer-events-none absolute -top-12 -right-12 w-36 h-36 rounded-full bg-[#A560E8]/15 dark:bg-[#A560E8]/10 blur-3xl" aria-hidden />
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-[#A560E8] flex items-center justify-center mb-4 border-2 border-b-4 border-[#8A48C7]">
                    <span className="text-xl" aria-hidden>🏅</span>
                  </div>
                  <h3
                    className="text-lg font-extrabold text-[#3C3C3C] dark:text-stone-50 mb-2"
                    style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
                  >
                    80+ Badges
                  </h3>
                  <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed mb-4">
                    Visible milestones turn "I should study" into "I want my next badge." It works because it's stupid and you can't help it.
                  </p>
                  {/* Mini visual — badge grid. Hidden on mobile to cut height. */}
                  <div className="hidden sm:block rounded-xl bg-[#F3EAFF]/60 dark:bg-[#A560E8]/10 border border-[#A560E8]/30 p-3">
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { badgeId: 'first_login', unlocked: true },
                        { badgeId: 'brain_spark', unlocked: true },
                        { badgeId: 'citation_hunter', unlocked: true },
                        { badgeId: 'streak_starter', unlocked: false },
                        { badgeId: 'premium_pioneer', unlocked: true },
                        { badgeId: 'streak_legend', unlocked: false },
                        { badgeId: 'monthly_master', unlocked: true },
                        { badgeId: 'night_owl', unlocked: false },
                      ].map((b) => (
                        <div
                          key={b.badgeId}
                          className={`w-full aspect-square rounded-lg flex items-center justify-center ${
                            b.unlocked
                              ? 'bg-[#A560E8]/20 dark:bg-[#A560E8]/25'
                              : 'bg-stone-200/60 dark:bg-stone-700/40 opacity-40'
                          }`}
                        >
                          <Suspense fallback={<span className="text-sm">🏅</span>}>
                            <BadgeCreature badgeId={b.badgeId} unlocked={b.unlocked} size={36} />
                          </Suspense>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-2 text-center font-medium">5 of 80+ unlocked</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Review screenshot — real product preview */}
            <div className="mt-10 sm:mt-14 max-w-4xl mx-auto">
              <div className="text-center mb-5 sm:mb-6">
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F3EAFF]/80 dark:bg-[#A560E8]/15 text-[#A560E8] dark:text-[#A560E8] text-[10px] sm:text-xs font-extrabold uppercase tracking-wider border border-[#A560E8]/30">
                  <span aria-hidden>📚</span>
                  Daily Review in action
                </span>
              </div>
              <div className="relative group">
                <div className="absolute -inset-2 bg-[#A560E8]/20 rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-500" aria-hidden />
                <div className="relative rounded-2xl overflow-hidden border-2 border-b-4 border-[#8A48C7] dark:border-[#8A48C7] shadow-2xl">
                  <img
                    src="/daily-review-preview.png"
                    alt="WriteScholar Daily Review: personalised daily practice with multiple choice questions, progress tracking, and instant feedback"
                    className="w-full h-auto"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
              <p className="mt-4 text-center text-sm text-stone-500 dark:text-stone-400">
                Your daily practice session — questions pulled from your own study materials, with instant feedback and XP rewards.
              </p>
            </div>

            {/* Level-up celebration preview */}
            <div className="mt-10 sm:mt-12 rounded-2xl border-2 border-b-4 border-[#E5E5E5] dark:border-stone-700/60 bg-white dark:bg-stone-900 p-5 sm:p-6 max-w-4xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#A560E8] flex items-center justify-center border-4 border-[#F3EAFF] dark:border-[#A560E8]/30" style={{ boxShadow: '0 0 20px rgba(165,96,232,0.3)' }}>
                    <span className="text-2xl sm:text-3xl font-extrabold text-white">7</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#A560E8] dark:text-[#A560E8] mb-0.5">
                      Level up!
                    </p>
                    <p className="text-lg sm:text-xl font-extrabold text-[#3C3C3C] dark:text-stone-50" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
                      Curious Cat II
                    </p>
                    <p className="text-sm text-stone-500 dark:text-stone-400">
                      Confetti, celebrations, and a new title every time you level up.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('signup')}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[#A560E8] text-white font-extrabold text-sm border-2 border-b-4 border-[#8A48C7] hover:bg-[#8A48C7] active:border-b-2 active:translate-y-0.5 transition-all whitespace-nowrap"
                >
                  Start earning XP
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            </div>
          </LandingScrollReveal>
        </div>
      </section>
      )}
      {/* (Citations showcase — "Find academic sources in seconds" —
          removed from the landing flow. The essay-feedback section
          now carries that conversion job with two stacked arrow-
          callout blocks: the per-sentence rubric view and the
          full five-section professor-style report. Re-enable via
          `lazyWithRetry(() => import('../landing/LandingCitationsShowcase'))`
          if it's ever brought back.) */}

      {/* H2 #2: Create Study Material, hidden (see More tools) */}


      {/* Study Better Together (from Share Friends page; hidden when HIDE_FRIENDS) */}
      {!HIDE_FRIENDS && !LANDING_HIDE_SECONDARY_SECTIONS && (
      <section className="relative py-12 sm:py-20 overflow-hidden bg-white dark:bg-stone-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_50%,rgba(99,102,241,0.07),transparent)] dark:bg-[radial-gradient(ellipse_70%_60%_at_50%_50%,rgba(139,92,246,0.06),transparent)]" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Mobile layout: badge, title, video, share instructions */}
          <div className="lg:hidden flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#DDF4FF] dark:bg-[#1CB0F6]/20 text-[#1CB0F6] dark:text-[#1CB0F6] rounded-full text-sm font-extrabold mb-4 border-2 border-b-4 border-[#1899D6]">
              <span>👫</span>
              <span>Social Study, Levelled Up</span>
            </div>
            <h2 className="text-2xl font-extrabold text-stone-900 dark:text-stone-50 leading-tight mb-2">
              Study Better,{' '}
              <span className="text-[#1CB0F6]">
                Together
              </span>
            </h2>
            <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed mb-5 max-w-sm">
              Add friends with your unique code and share flashcards, quizzes, crosswords & notes in one tap.
            </p>
            <div className="relative flex items-center justify-center mb-4 w-full max-w-[280px]">
              <div className="absolute inset-0 bg-[#1CB0F6]/15 rounded-3xl blur-3xl" />
              <DualMascot size={200} />
            </div>
            <div className="relative w-full max-w-[360px] rounded-2xl overflow-hidden border-2 border-stone-200/80 dark:border-stone-700/60 shadow-xl mb-6 bg-stone-900">
              <ViewportAutoplayVideo
                src="/writescholar-friends-share-demo.mp4"
                className="w-full aspect-video object-cover"
                title="WriteScholar Friends: share quizzes, flashcards and crosswords"
                aria-label="WriteScholar Friends: share quizzes, flashcards and crosswords with friends"
              />
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-6 px-2 leading-relaxed">
              To share: go to <strong>Saved Materials</strong> in the dashboard or header → tap the <strong>Share</strong> button on any quiz, flashcard, or crossword → select your friend.
            </p>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <button
                onClick={() => onNavigate('signup')}
                className="w-full px-6 py-3.5 bg-[#58CC02] text-white font-extrabold rounded-2xl border-2 border-b-4 border-[#46A302] active:border-b-2 active:translate-y-0.5 text-sm flex items-center justify-center gap-2"
              >
                <span>Start sharing free</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
              <button
                onClick={() => onNavigate('features')}
                className="w-full px-6 py-3.5 bg-white dark:bg-stone-800 text-[#3C3C3C] dark:text-stone-200 font-extrabold rounded-2xl border-2 border-b-4 border-[#E5E5E5] dark:border-stone-700 active:border-b-2 active:translate-y-0.5 text-sm"
              >
                See all features
              </button>
            </div>
          </div>

          {/* Desktop layout: text left, video right */}
          <div className="hidden lg:grid lg:grid-cols-2 gap-8 items-center">
            <div className="text-center lg:text-left order-2 lg:order-1 pb-8 lg:pb-0">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#DDF4FF] dark:bg-[#1CB0F6]/20 text-[#1CB0F6] dark:text-[#1CB0F6] rounded-full text-sm font-extrabold mb-5 border-2 border-b-4 border-[#1899D6]">
                <span>👫</span>
                <span>Social Study, Levelled Up</span>
              </div>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-stone-900 dark:text-stone-50 leading-tight mb-5">
                Study Better,{' '}
                <span className="text-[#1CB0F6]">
                  Together
                </span>
              </h2>
              <p className="text-base sm:text-lg text-stone-600 dark:text-stone-300 leading-relaxed mb-4 max-w-lg mx-auto lg:mx-0">
                Add friends with your unique code and share flashcards, quizzes, crosswords & notes in one tap. It delivers straight to their device. All they have to do is accept.
              </p>
              <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed mb-6 max-w-lg mx-auto lg:mx-0">
                To share: go to <strong>Saved Materials</strong> in the dashboard or header → tap the <strong>Share</strong> button on any quiz, flashcard, or crossword → select your friend.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <button
                  onClick={() => onNavigate('signup')}
                  className="px-7 py-3.5 bg-[#58CC02] text-white font-extrabold rounded-2xl border-2 border-b-4 border-[#46A302] hover:bg-[#46A302] active:border-b-2 active:translate-y-0.5 transition-all duration-200 text-base flex items-center justify-center gap-2"
                >
                  <span>Start sharing free</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
                <button
                  onClick={() => onNavigate('features')}
                  className="px-7 py-3.5 bg-white dark:bg-stone-800 text-[#3C3C3C] dark:text-stone-200 font-extrabold rounded-2xl border-2 border-b-4 border-[#E5E5E5] dark:border-stone-700 hover:border-[#1899D6] dark:hover:border-[#1899D6] active:border-b-2 active:translate-y-0.5 transition-all duration-200 text-base"
                >
                  See all features
                </button>
              </div>
            </div>
            <div className="relative flex flex-col items-center justify-center order-1 lg:order-2 gap-6">
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 bg-[#1CB0F6]/15 rounded-3xl blur-3xl" />
                <DualMascot size={280} />
              </div>
              <div className="relative w-full max-w-lg rounded-2xl overflow-hidden border-2 border-stone-200/80 dark:border-stone-700/60 shadow-xl bg-stone-900">
                <ViewportAutoplayVideo
                  src="/writescholar-friends-share-demo.mp4"
                  className="w-full aspect-video object-cover"
                  title="WriteScholar Friends: share quizzes, flashcards and crosswords"
                  aria-label="WriteScholar Friends: share quizzes, flashcards and crosswords with friends"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* One Code. Endless Friends. (from Share Friends page; hidden when HIDE_FRIENDS) */}
      {!HIDE_FRIENDS && !LANDING_HIDE_SECONDARY_SECTIONS && (
      <section className="relative py-16 sm:py-24 bg-[#DDF4FF]/40 dark:bg-stone-900 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_50%,rgba(99,102,241,0.08),transparent)] dark:bg-[radial-gradient(ellipse_60%_40%_at_50%_50%,rgba(139,92,246,0.06),transparent)]" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block px-4 py-1.5 bg-[#DDF4FF] dark:bg-[#1CB0F6]/20 text-[#1CB0F6] dark:text-[#1CB0F6] rounded-full text-sm font-extrabold mb-4 border-2 border-b-4 border-[#1899D6]">
            Your Identity on WriteScholar
          </span>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-stone-800 dark:text-stone-100 mb-4">
            One Code.{' '}
            <span className="text-[#1CB0F6]">
              Endless Friends.
            </span>
          </h2>
          <p className="text-base sm:text-lg text-stone-600 dark:text-stone-400 max-w-2xl mx-auto mb-10">
            Every account gets a permanent, human-readable friend code. No emails, no usernames to remember. Just drop the code, accept the friend request and you're connected.
          </p>
          <div className="relative inline-block group mb-10">
            <div className="absolute -inset-1 bg-[#1CB0F6]/30 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
            <div className="relative bg-white dark:bg-stone-800 rounded-2xl px-8 sm:px-14 py-8 border-2 border-b-4 border-[#1899D6] dark:border-[#1899D6]">
              <p className="text-xs sm:text-sm font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-3">Your unique friend code</p>
              <div className="flex items-center justify-center gap-3 sm:gap-5 flex-wrap">
                <span className="text-3xl sm:text-5xl font-black tracking-widest text-[#1CB0F6] dark:text-[#1CB0F6] font-mono">
                  WS-BUDDY-4872
                </span>
                <button
                  type="button"
                  className="flex items-center gap-2 px-4 py-2 bg-[#DDF4FF] dark:bg-[#1CB0F6]/20 hover:bg-[#1CB0F6]/30 text-[#1CB0F6] dark:text-[#1CB0F6] font-extrabold rounded-xl text-sm border-2 border-b-4 border-[#1899D6] active:border-b-2 active:translate-y-0.5 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  Copy code
                </button>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
                {['Easy to remember', 'Shareable anywhere', 'Yours forever'].map((tag) => (
                  <span key={tag} className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-stone-500 dark:text-stone-400">
                    <svg className="w-4 h-4 text-[#58CC02] dark:text-[#58CC02] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <p className="text-sm text-stone-400 dark:text-stone-500">This is a demo code. Sign up to get your own unique code instantly.</p>
        </div>
      </section>
      )}


      <Suspense fallback={<div className="min-h-[280px] w-full" aria-hidden />}>
        <LandingTestimonialsSection />
      </Suspense>


      {/* ─── "Everything you need to ace school" — feature matrix that
          implicitly compares WriteScholar to single-purpose tools (Quizlet
          flashcards only, ChatGPT essay help only, etc.) by showing breadth.
          Hidden on mobile (hidden md:block) because the same product breadth
          is already conveyed by the study-tools showcase, the gamification
          section, and the pricing teaser — on a phone the dense 3-column
          comparison just adds scroll for low return.
          TEMPORARILY HIDDEN — re-enable by changing `false` below to `true`. ─── */}
      {false && (
      <section className="relative hidden md:block py-16 sm:py-24 overflow-hidden border-t border-[#E5E5E5] dark:border-stone-800 bg-white dark:bg-stone-950">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-15%,rgba(91,33,182,0.06),transparent_55%)] dark:bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(139,92,246,0.10),transparent_55%)]" aria-hidden />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <LandingScrollReveal>
            <div className="text-center mb-10 sm:mb-14 max-w-2xl mx-auto">
              <span className="inline-flex items-center gap-2 mb-4 rounded-full border border-amber-200/80 dark:border-amber-700/55 bg-amber-50/80 dark:bg-amber-950/30 backdrop-blur px-3.5 py-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-amber-800 dark:text-amber-200 shadow-sm">
                <span aria-hidden>★</span>
                Why students switch
              </span>
              <h2
                className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold text-[#3C3C3C] dark:text-stone-50 tracking-tight leading-[1.05]"
                style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
              >
                Everything you need to ace school —{' '}
                <span className="text-[#58CC02]">
                  in one app.
                </span>
              </h2>
              <p className="mt-3 text-base sm:text-lg text-stone-600 dark:text-stone-400">
                No more juggling Quizlet, ChatGPT, Grammarly, and three citation generators. WriteScholar covers all of it.
              </p>
            </div>

            {/* Feature matrix */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
              {/* Writing pillar */}
              <div className="relative rounded-2xl border-2 border-b-4 border-[#8A48C7] bg-white dark:bg-stone-900 p-5 sm:p-6 hover:-translate-y-1 transition-all overflow-hidden">
                <div className="pointer-events-none absolute -top-12 -right-12 w-44 h-44 rounded-full bg-[#A560E8]/15 dark:bg-[#A560E8]/10 blur-3xl" aria-hidden />
                <div className="relative">
                  <div className="inline-flex items-center gap-2 mb-3 px-2.5 py-1 rounded-full bg-[#F3EAFF] dark:bg-[#A560E8]/20 text-[#A560E8] dark:text-[#A560E8] text-[10px] font-extrabold uppercase tracking-wider">
                    <span aria-hidden>📝</span> Writing
                  </div>
                  <h3
                    className="text-xl font-extrabold text-[#3C3C3C] dark:text-stone-50 mb-3"
                    style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
                  >
                    Hand in stronger essays
                  </h3>
                  <ul className="space-y-2">
                    {[
                      'Professor-style essay feedback',
                      'Structure & argument scoring',
                      'Citation finder (APA, MLA, Chicago)',
                      'Paper summarizer for long readings',
                      'Grammar & academic tone check',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2 text-[14px] text-stone-700 dark:text-stone-300">
                        <svg className="w-4 h-4 mt-0.5 shrink-0 text-[#58CC02] dark:text-[#58CC02]" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6 7.7 9.3a1 1 0 00-1.4 1.4l2 2a1 1 0 001.4 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Studying pillar — featured/highlighted */}
              <div className="relative rounded-2xl border-2 border-b-4 border-[#46A302] bg-[#E5F8D0]/50 dark:bg-[#58CC02]/10 p-5 sm:p-6 hover:-translate-y-1 transition-all overflow-hidden md:scale-[1.02]">
                <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FF9600] text-white text-[9px] font-extrabold uppercase tracking-wider border-2 border-[#D97F00]">
                  <span aria-hidden>★</span> Most loved
                </span>
                <div className="pointer-events-none absolute -top-16 -left-12 w-52 h-52 rounded-full bg-[#58CC02]/15 dark:bg-[#58CC02]/10 blur-3xl" aria-hidden />
                <div className="relative">
                  <div className="inline-flex items-center gap-2 mb-3 px-2.5 py-1 rounded-full bg-[#E5F8D0] dark:bg-[#58CC02]/20 text-[#58CC02] dark:text-[#58CC02] text-[10px] font-extrabold uppercase tracking-wider">
                    <span aria-hidden>📦</span> Studying
                  </div>
                  <h3
                    className="text-xl font-extrabold text-[#3C3C3C] dark:text-stone-50 mb-3"
                    style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
                  >
                    Walk into exams ready
                  </h3>
                  <ul className="space-y-2">
                    {[
                      'AI flashcards from your notes',
                      'Auto-graded quizzes (MCQ, T/F, fill-in)',
                      'Vocabulary crosswords',
                      'Crater Blast — boss-battle quiz arcade',
                      'Word Tower — daily vocab game',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2 text-[14px] text-stone-700 dark:text-stone-300">
                        <svg className="w-4 h-4 mt-0.5 shrink-0 text-[#58CC02] dark:text-[#58CC02]" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6 7.7 9.3a1 1 0 00-1.4 1.4l2 2a1 1 0 001.4 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Motivation pillar — gamification: daily review, XP, levels,
                  streaks, badges. The habit loop that keeps students coming back. */}
              <div className="relative rounded-2xl border-2 border-b-4 border-[#D97F00] bg-white dark:bg-stone-900 p-5 sm:p-6 hover:-translate-y-1 transition-all overflow-hidden">
                <div className="pointer-events-none absolute -bottom-12 -right-12 w-44 h-44 rounded-full bg-amber-300/20 dark:bg-amber-500/15 blur-3xl" aria-hidden />
                <div className="relative">
                  <div className="inline-flex items-center gap-2 mb-3 px-2.5 py-1 rounded-full bg-[#FFF4E0] dark:bg-[#FF9600]/20 text-[#FF9600] dark:text-[#FF9600] text-[10px] font-extrabold uppercase tracking-wider">
                    <span aria-hidden>🔥</span> Motivation
                  </div>
                  <h3
                    className="text-xl font-extrabold text-[#3C3C3C] dark:text-stone-50 mb-3"
                    style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
                  >
                    Study daily. Level up.
                  </h3>
                  <ul className="space-y-2">
                    {[
                      'Daily Review — personalised practice every day',
                      'XP & 100 levels — from Seedling to Grandmaster',
                      'Streaks — track your daily consistency',
                      '80+ badges — unlock achievements as you learn',
                      'Crater Blast & Word Tower — quiz arcade games',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2 text-[14px] text-stone-700 dark:text-stone-300">
                        <svg className="w-4 h-4 mt-0.5 shrink-0 text-[#58CC02] dark:text-[#58CC02]" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6 7.7 9.3a1 1 0 00-1.4 1.4l2 2a1 1 0 001.4 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* "vs alternatives" footer strip */}
            <div className="mt-10 sm:mt-12 rounded-2xl border-2 border-b-4 border-[#E5E5E5] dark:border-stone-700/60 bg-white dark:bg-stone-900 p-5 sm:p-6 max-w-4xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400 mb-1.5">
                    The math
                  </p>
                  <p className="text-[15px] sm:text-base text-stone-800 dark:text-stone-100 leading-snug">
                    <span className="font-semibold">Quizlet + ChatGPT + Grammarly + a citation generator</span>{' '}
                    <span className="text-stone-500 dark:text-stone-400">≈ $40–60/mo combined.</span>
                  </p>
                  <p className="mt-1 text-[15px] sm:text-base text-stone-800 dark:text-stone-100 leading-snug">
                    <span className="font-extrabold text-[#58CC02] dark:text-[#58CC02]">WriteScholar Pro</span>{' '}
                    <span className="text-stone-500 dark:text-stone-400">covers all of that — </span>
                    <span className="font-semibold">$19.99/mo.</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('signup')}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[#58CC02] text-white font-extrabold text-sm border-2 border-b-4 border-[#46A302] hover:bg-[#46A302] active:border-b-2 active:translate-y-0.5 transition-all whitespace-nowrap"
                >
                  Get started free
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            </div>
          </LandingScrollReveal>
        </div>
      </section>
      )}

      {/* Pricing — above FAQ, aligned with Pricing page */}
      <section className="relative py-16 sm:py-24 overflow-hidden border-t border-stone-200/90 dark:border-stone-800" aria-labelledby="landing-pricing-heading">
        <div className="absolute inset-0 bg-[#FAF7FF] dark:bg-stone-950" aria-hidden />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_85%_55%_at_50%_-12%,rgba(165,96,232,0.10),transparent_55%)] dark:bg-[radial-gradient(ellipse_85%_50%_at_50%_-8%,rgba(165,96,232,0.14),transparent_58%)] pointer-events-none" aria-hidden />
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <LandingScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
            <p className="text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.22em] text-[#A560E8] dark:text-[#A560E8] mb-3">
              Pricing
            </p>
            <div className="mx-auto mb-4 h-1.5 w-16 rounded-full bg-gradient-to-r from-[#A560E8] to-[#8A48C7]" aria-hidden />
            <h2
              id="landing-pricing-heading"
              className="text-2xl sm:text-3xl lg:text-[2.35rem] font-extrabold text-stone-900 dark:text-stone-50 mb-4 tracking-tight leading-tight"
              style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
            >
              Simple, transparent pricing
            </h2>
            <p className="text-base sm:text-lg text-stone-600 dark:text-stone-400 leading-relaxed">
              Start free, upgrade when you need more analyses, citations, and study tools.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
            <div className="rounded-3xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-[0_24px_60px_-32px_rgba(96,48,140,0.30)] p-6 sm:p-8 flex flex-col">
              <h3 className="font-semibold text-xl text-stone-900 dark:text-stone-100 mb-1">Free</h3>
              <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">Perfect for getting started</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-stone-900 dark:text-stone-50">$0</span>
                <span className="text-stone-500 dark:text-stone-400 ml-1">/month</span>
              </div>
              <ul className="space-y-2.5 mb-8 flex-1 text-sm sm:text-[0.9375rem] text-stone-600 dark:text-stone-400">
                <li className="flex gap-2">
                  <svg className="w-5 h-5 flex-shrink-0 text-[#A560E8] dark:text-[#A560E8] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>3 documents, 2 analyses, 2 study packs per month</span>
                </li>
                <li className="flex gap-2">
                  <svg className="w-5 h-5 flex-shrink-0 text-[#A560E8] dark:text-[#A560E8] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>5,000 words Paper Summarizer, 2 citation searches</span>
                </li>
                <li className="flex gap-2">
                  <svg className="w-5 h-5 flex-shrink-0 text-[#A560E8] dark:text-[#A560E8] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Basic grammar and citation styles</span>
                </li>
              </ul>
              <button
                type="button"
                onClick={() => onNavigate('signup')}
                className="w-full py-3 px-6 rounded-2xl font-extrabold bg-white dark:bg-stone-800 hover:bg-[#F3EAFF] dark:hover:bg-stone-700 text-stone-700 dark:text-stone-100 transition-colors border-2 border-b-4 border-stone-200 dark:border-stone-700 hover:border-[#A560E8]/40 active:border-b-2 active:translate-y-0.5"
              >
                Start free
              </button>
            </div>

            <div className="relative rounded-3xl border-2 border-[#A560E8] bg-white dark:bg-stone-900 ring-1 ring-[#A560E8]/30 shadow-[0_28px_70px_-30px_rgba(165,96,232,0.5)] lg:scale-[1.02] p-6 sm:p-8 flex flex-col">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-[#A560E8] text-white px-3 py-1 rounded-full text-xs font-extrabold border-2 border-[#7733B5]">
                  Most popular
                </span>
              </div>
              <h3 className="font-semibold text-xl text-stone-900 dark:text-stone-100 mb-1 pt-1">Pro</h3>
              <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">Most popular for students</p>
              {/* Price block — struck-through "was" $39.99 sits above
                  the active $19.99 (matches the pricing + billing pages
                  so all three surfaces tell the same discount story). */}
              <div className="mb-1 flex flex-col items-start">
                <span className="text-lg font-semibold text-stone-400 dark:text-stone-500 line-through decoration-2">
                  $39.99
                </span>
                <div className="flex items-baseline flex-wrap gap-x-2 gap-y-1">
                  <span className="text-4xl font-bold text-stone-900 dark:text-stone-50">$19.99</span>
                  <span className="text-stone-500 dark:text-stone-400 text-sm">/month</span>
                </div>
                <span className="text-xs text-stone-500 dark:text-stone-500 mt-1">
                  or <span className="line-through decoration-1 text-stone-400 dark:text-stone-500">$299.99</span> <span className="font-bold text-stone-700 dark:text-stone-200">$199.99</span>/year
                </span>
              </div>
              <ul className="space-y-2.5 mb-8 mt-5 flex-1 text-sm sm:text-[0.9375rem] text-stone-600 dark:text-stone-400">
                <li className="flex gap-2">
                  <svg className="w-5 h-5 flex-shrink-0 text-[#A560E8] dark:text-[#A560E8] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>99 combined analyses, study packs &amp; citations/mo</span>
                </li>
                <li className="flex gap-2">
                  <svg className="w-5 h-5 flex-shrink-0 text-[#A560E8] dark:text-[#A560E8] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>999,999 words Paper Summarizer; uploads up to 100MB</span>
                </li>
                <li className="flex gap-2">
                  <svg className="w-5 h-5 flex-shrink-0 text-[#A560E8] dark:text-[#A560E8] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Quiz, flashcards, crossword, Crater Blast &amp; Word Tower</span>
                </li>
                <li className="flex gap-2">
                  <svg className="w-5 h-5 flex-shrink-0 text-[#A560E8] dark:text-[#A560E8] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>All citation styles, PDF/Word export</span>
                </li>
                <li className="flex gap-2">
                  <svg className="w-5 h-5 flex-shrink-0 text-[#A560E8] dark:text-[#A560E8] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Apply WriteScholar revisions into your draft</span>
                </li>
              </ul>
              <button
                type="button"
                onClick={() => onNavigate('pricing')}
                className="w-full py-3 px-6 rounded-2xl font-extrabold bg-[#A560E8] hover:bg-[#8A48C7] text-white border-2 border-b-4 border-[#7733B5] active:border-b-2 active:translate-y-0.5 transition-colors"
              >
                View Pro pricing
              </button>
            </div>

            <div className="relative rounded-3xl border-2 border-[#E0AC00]/70 dark:border-[#D4A300]/60 bg-[#FFF7DB]/70 dark:bg-[#FFC800]/10 shadow-[0_24px_60px_-30px_rgba(160,120,0,0.40)] p-6 sm:p-8 flex flex-col sm:col-span-2 lg:col-span-1">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-[#FFC800] text-[#5A4500] px-3 py-1 rounded-full text-xs font-extrabold border-2 border-[#D4A300]">
                  5× usage
                </span>
              </div>
              <h3 className="font-semibold text-xl text-stone-900 dark:text-stone-100 mb-1 pt-1">Premium</h3>
              <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">Heavy essays &amp; citations</p>
              {/* Price block — struck-through "was" $59.99 sits above
                  the active $39.99 (matches Pro card + pricing/billing
                  pages). */}
              <div className="mb-1 flex flex-col items-start">
                <span className="text-lg font-semibold text-stone-400 dark:text-stone-500 line-through decoration-2">
                  $59.99
                </span>
                <div className="flex items-baseline flex-wrap gap-x-2 gap-y-1">
                  <span className="text-4xl font-bold text-stone-900 dark:text-stone-50">$39.99</span>
                  <span className="text-stone-500 dark:text-stone-400 text-sm">/month</span>
                </div>
                <span className="text-xs text-stone-500 dark:text-stone-500 mt-1">
                  or <span className="line-through decoration-1 text-stone-400 dark:text-stone-500">$499.99</span> <span className="font-bold text-stone-700 dark:text-stone-200">$399.99</span>/year
                </span>
              </div>
              <ul className="space-y-2.5 mb-8 mt-5 flex-1 text-sm sm:text-[0.9375rem] text-stone-600 dark:text-stone-400">
                <li className="flex gap-2">
                  <svg className="w-5 h-5 flex-shrink-0 text-[#E0AC00] dark:text-[#F0C419] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Everything in Pro</span>
                </li>
                <li className="flex gap-2">
                  <svg className="w-5 h-5 flex-shrink-0 text-[#E0AC00] dark:text-[#F0C419] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>499 combined analyses, study packs &amp; citations/mo—ideal for citation-heavy work</span>
                </li>
                <li className="flex gap-2">
                  <svg className="w-5 h-5 flex-shrink-0 text-[#E0AC00] dark:text-[#F0C419] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Summarise unlimited research papers; 1GB library storage</span>
                </li>
              </ul>
              <button
                type="button"
                onClick={() => onNavigate('pricing')}
                className="w-full py-3 px-6 rounded-2xl font-extrabold bg-[#FFC800] hover:bg-[#F0BC00] text-[#5A4500] border-2 border-b-4 border-[#D4A300] active:border-b-2 active:translate-y-0.5 transition-colors"
              >
                Go Premium
              </button>
            </div>
          </div>

          <p className="text-center text-sm text-stone-500 dark:text-stone-500 mt-8 max-w-xl mx-auto">
            Free to start. Pro and Premium upgrades available with monthly or yearly billing.{' '}
            <button
              type="button"
              onClick={() => onNavigate('pricing')}
              className="text-[#A560E8] dark:text-[#A560E8] font-extrabold underline underline-offset-2 hover:text-[#8A48C7] dark:hover:text-[#8A48C7]"
            >
              Full pricing &amp; billing options
            </button>
          </p>
          </LandingScrollReveal>
        </div>
      </section>

      {/* FAQ — matches hero editorial theme */}
      <section className="relative py-16 sm:py-24 overflow-hidden border-t border-stone-200/90 dark:border-stone-800">
        <div className="absolute inset-0 bg-[#FAF7FF] dark:bg-stone-950" aria-hidden />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-15%,rgba(165,96,232,0.09),transparent_55%)] dark:bg-[radial-gradient(ellipse_90%_55%_at_50%_-10%,rgba(165,96,232,0.13),transparent_58%)] pointer-events-none" aria-hidden />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <LandingScrollReveal>
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8 lg:gap-10 mb-10 sm:mb-14">
            <div className="text-center lg:text-left flex-1 max-w-2xl mx-auto lg:mx-0">
              <p className="text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.22em] text-[#A560E8] dark:text-[#A560E8] mb-3">
                Help
              </p>
              <div className="mx-auto lg:mx-0 mb-4 h-1.5 w-16 rounded-full bg-gradient-to-r from-[#A560E8] to-[#8A48C7]" aria-hidden />
              <h2
                className="text-2xl sm:text-3xl lg:text-[2.35rem] font-extrabold text-stone-900 dark:text-stone-50 mb-4 tracking-tight leading-tight"
                style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
              >
                Frequently Asked Questions
              </h2>
              <p className="text-base sm:text-lg text-stone-600 dark:text-stone-400 leading-relaxed">
                Essay feedback, citations, and study tools for college and university coursework.
              </p>
            </div>
            <div className="hidden lg:flex flex-shrink-0 items-center justify-center pt-1">
              {/* Animated thinking mascot — "Scholar pondering your question" */}
              <img
                src="/mascot-thinking.webp"
                alt=""
                aria-hidden
                loading="lazy"
                decoding="async"
                className="w-40 xl:w-48 h-auto drop-shadow-[0_18px_30px_rgba(124,58,237,0.40)]"
              />
            </div>
          </div>

          <div className="max-w-3xl mx-auto space-y-3 sm:space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden transition-all duration-200 hover:border-[#A560E8]/50 dark:hover:border-[#A560E8]/50 shadow-[0_10px_30px_-20px_rgba(96,48,140,0.4)]"
              >
                <button
                  type="button"
                  onClick={() => setOpenFAQ(openFAQ === idx ? null : idx)}
                  className="w-full min-w-0 px-5 sm:px-6 py-4 sm:py-5 text-left flex items-center justify-between gap-3 sm:gap-4 hover:bg-stone-50/90 dark:hover:bg-stone-800/50 transition-colors duration-200"
                >
                  <span className="font-semibold text-stone-900 dark:text-stone-100 text-base sm:text-[1.05rem] leading-snug pr-2 min-w-0 flex-1 text-left">{faq.question}</span>
                  <svg
                    className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${openFAQ === idx ? 'rotate-180 text-[#A560E8] dark:text-[#A560E8]' : 'text-stone-400 dark:text-stone-500'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ease-out ${openFAQ === idx ? 'max-h-[min(28rem,70vh)]' : 'max-h-0'}`}>
                  <div className="px-5 sm:px-6 pb-5 pt-0 text-stone-600 dark:text-stone-400 text-sm sm:text-base leading-relaxed border-t border-stone-100/90 dark:border-stone-800/80">
                    <div className="pt-4">{faq.answer}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          </LandingScrollReveal>
        </div>
      </section>

      {/* Final CTA — gradient hero panel with dancing mascot to close the deal */}
      <section className="relative py-16 sm:py-24 overflow-hidden border-t border-stone-200/90 dark:border-stone-800">
        <div className="absolute inset-0 bg-[#f8fafc] dark:bg-[#0c0a09]" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-b from-[#f1f5f9] via-white to-[#f8fafc] dark:from-stone-950 dark:via-stone-950 dark:to-stone-900 pointer-events-none" aria-hidden />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_20%,rgba(91,33,182,0.06),transparent_50%)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_15%,rgba(109,40,217,0.1),transparent_55%)] pointer-events-none" aria-hidden />
        <div
          className="absolute inset-0 opacity-[0.35] dark:opacity-[0.12] pointer-events-none bg-[length:32px_32px] bg-[linear-gradient(to_right,rgba(148,163,184,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.07)_1px,transparent_1px)]"
          aria-hidden
        />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <LandingScrollReveal>
          <div className="relative text-center rounded-2xl bg-[#A560E8] dark:bg-[#A560E8] px-6 py-10 sm:px-10 sm:py-14 border-2 border-b-4 border-[#8A48C7] overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(255,255,255,0.12),transparent_70%)]" aria-hidden />
            <div className="pointer-events-none absolute -bottom-16 -right-12 w-56 h-56 rounded-full bg-[#8A48C7]/30 blur-3xl" aria-hidden />
            <div className="pointer-events-none absolute -top-12 -left-10 w-48 h-48 rounded-full bg-[#A560E8]/30 blur-3xl" aria-hidden />

            <p className="relative text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.22em] text-white/90 mb-3">
              ⚡ Ready when you are
            </p>
            <h2
              className="relative text-2xl sm:text-3xl lg:text-[2.5rem] font-extrabold text-white mb-4 tracking-tight leading-[1.1]"
              style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
            >
              Better essays. Smarter studying.{' '}
              <span className="block sm:inline">All in one app.</span>
            </h2>
            <p className="relative text-base sm:text-lg text-white/90 mb-8 max-w-xl mx-auto leading-relaxed">
              Join <span className="font-extrabold text-white">50,000+ students</span> writing sharper essays and acing their coursework. Free to start — no payment today.
            </p>
            <div className="relative flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center mb-6">
              <button
                type="button"
                onClick={() => onNavigate('signup')}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-[#3C3C3C] font-extrabold rounded-2xl border-2 border-b-4 border-[#E5E5E5] hover:bg-stone-50 active:border-b-2 active:translate-y-0.5 transition-all text-base sm:text-[17px]"
              >
                Get started free
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('pricing')}
                className="inline-flex items-center justify-center px-7 py-4 border-2 border-b-4 border-white/40 text-white font-extrabold rounded-2xl hover:bg-white/10 active:border-b-2 active:translate-y-0.5 transition-colors text-base"
              >
                View pricing
              </button>
            </div>

            {/* Trust badges row */}
            <div className="relative flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px] sm:text-xs text-white/85">
              <span className="inline-flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6 7.7 9.3a1 1 0 00-1.4 1.4l2 2a1 1 0 001.4 0l4-4z" clipRule="evenodd" />
                </svg>
                No payment today
              </span>
              <span className="text-white/30" aria-hidden>·</span>
              <span className="inline-flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6 7.7 9.3a1 1 0 00-1.4 1.4l2 2a1 1 0 001.4 0l4-4z" clipRule="evenodd" />
                </svg>
                Cancel anytime
              </span>
              <span className="text-white/30" aria-hidden>·</span>
              <span className="inline-flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m0 4h.01M5 11h14a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2zm10-4V7a3 3 0 00-6 0v4" />
                </svg>
                Secure checkout via Stripe
              </span>
            </div>
          </div>
          </LandingScrollReveal>
        </div>
      </section>

      {/* Loading Animations */}
      {showFakeAnimation && mode === 'citations' && (
        <AnalysisAnimation isPopup={true} text="Finding citations for your topic" isComplete={false} variant="citations" />
      )}

      {showFakeAnimation && mode === 'analyze' && (
        <AnalysisAnimation isPopup={true} text="Analyzing your writing" isComplete={false} />
      )}

      {showFakeAnimation && mode === 'summarize' && (
        <AnalysisAnimation isPopup={true} text="Creating your summary" isComplete={false} />
      )}

      {showFakeAnimation && mode === 'quiz' && (
        <AnalysisAnimation isPopup={true} text={studyToolMode === 'flashcards' ? 'Generating flashcards' : studyToolMode === 'crossword' ? 'Generating crossword puzzle' : 'Generating quiz questions'} isComplete={false} />
      )}

      {/* Fake Results Modal */}
      {showFakeResults && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="relative bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full mx-4 shadow-2xl animate-fade-in">
            <button type="button" onClick={() => setShowFakeResults(false)} className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors" aria-label="Close">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            {/* Character - concerned look */}
            <div className="flex justify-center mb-4">
              <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-24 h-24">
                <ellipse cx="60" cy="60" rx="50" ry="52" fill="#FCD9B6" />
                <path d="M20 48 Q16 20 38 12 Q60 2 82 12 Q104 20 100 48 Q96 32 80 22 Q60 12 40 22 Q24 32 20 48" fill="#D4A853" />
                <path d="M20 48 Q12 70 20 90" fill="#D4A853" />
                <path d="M100 48 Q108 70 100 90" fill="#D4A853" />
                <ellipse cx="42" cy="55" rx="8" ry="9" fill="white" />
                <ellipse cx="78" cy="55" rx="8" ry="9" fill="white" />
                <ellipse cx="43" cy="57" rx="5" ry="6" fill="#1F2937" />
                <ellipse cx="79" cy="57" rx="5" ry="6" fill="#1F2937" />
                <circle cx="44" cy="55" r="2" fill="white" />
                <circle cx="80" cy="55" r="2" fill="white" />
                <path d="M32 42 Q42 36 52 42" stroke="#8B7355" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <path d="M68 42 Q78 36 88 42" stroke="#8B7355" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <path d="M45 82 Q60 74 75 82" stroke="#1F2937" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <ellipse cx="30" cy="70" rx="8" ry="5" fill="#FECACA" opacity="0.5" />
                <ellipse cx="90" cy="70" rx="8" ry="5" fill="#FECACA" opacity="0.5" />
                      </svg>
                </div>

            <h3 className="text-xl font-bold text-stone-800 text-center mb-2">Analysis Complete</h3>
            <p className="text-stone-500 text-center text-sm mb-6">Your essay has been scanned. Here&apos;s a quick preview</p>
            
            {/* Results Summary */}
            <div className="space-y-3 mb-5">
              <div className="flex items-start p-3.5 bg-red-50 rounded-xl border border-red-100">
                <span className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                    </span>
                <div>
                  <p className="text-red-800 font-semibold text-sm">Critical issues detected</p>
                  <p className="text-red-600 text-xs mt-0.5">Structural weaknesses and argument gaps that could significantly affect your grade</p>
                      </div>
            </div>

              <div className="flex items-start p-3.5 bg-amber-50 rounded-xl border border-amber-100">
                <span className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                        </span>
                <div>
                  <p className="text-amber-800 font-semibold text-sm">Several areas need improvement</p>
                  <p className="text-amber-600 text-xs mt-0.5">Grammar, clarity, and tone issues that should be addressed before submission</p>
                      </div>
                  </div>
                </div>

            {/* Urgency text */}
            <div className="bg-stone-50 rounded-xl p-3.5 mb-6">
              <p className="text-stone-600 text-sm text-center leading-relaxed">
                <span className="font-semibold text-stone-800">Don't submit yet.</span> View the full breakdown with specific line-by-line feedback to fix these issues.
              </p>
                </div>

                {/* CTA Button */}
                <button
              onClick={handleContinueToSignup}
              className="w-full py-3.5 bg-[#58CC02] text-white font-extrabold rounded-2xl border-2 border-b-4 border-[#46A302] active:border-b-2 active:translate-y-0.5 transition-all duration-200 flex items-center justify-center"
                >
              View full analysis (it&apos;s free)
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
                </button>
              </div>
            </div>
      )}

      {/* Fake Citation Results Modal */}
      {showFakeCitationResults && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="relative bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full mx-4 shadow-2xl animate-fade-in">
            <button type="button" onClick={() => setShowFakeCitationResults(false)} className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors" aria-label="Close">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            {/* Character - happy / excited with papers */}
            <div className="flex justify-center mb-4">
              <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-24 h-24">
                <ellipse cx="60" cy="60" rx="50" ry="52" fill="#FCD9B6" />
                <path d="M20 48 Q16 20 38 12 Q60 2 82 12 Q104 20 100 48 Q96 32 80 22 Q60 12 40 22 Q24 32 20 48" fill="#D4A853" />
                <path d="M20 48 Q12 70 20 90" fill="#D4A853" />
                <path d="M100 48 Q108 70 100 90" fill="#D4A853" />
                <ellipse cx="42" cy="55" rx="8" ry="9" fill="white" />
                <ellipse cx="78" cy="55" rx="8" ry="9" fill="white" />
                <ellipse cx="43" cy="56" rx="5" ry="5" fill="#1F2937" />
                <ellipse cx="79" cy="56" rx="5" ry="5" fill="#1F2937" />
                <circle cx="44" cy="54" r="2" fill="white" />
                <circle cx="80" cy="54" r="2" fill="white" />
                <path d="M32 42 Q42 36 52 42" stroke="#8B7355" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <path d="M68 42 Q78 36 88 42" stroke="#8B7355" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <path d="M38 78 Q60 88 82 78" stroke="#1F2937" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <ellipse cx="30" cy="70" rx="8" ry="5" fill="#FECACA" opacity="0.5" />
                <ellipse cx="90" cy="70" rx="8" ry="5" fill="#FECACA" opacity="0.5" />
              </svg>
          </div>

            <h3 className="text-xl font-bold text-stone-800 text-center mb-2">Citations Ready</h3>
            <p className="text-stone-500 text-center text-sm mb-5">We found high-quality sources that match your topic</p>
            
            <div className="bg-green-50 rounded-xl border border-green-100 p-4 mb-5">
              <p className="text-green-800 text-center text-sm leading-relaxed">
                <span className="font-semibold">We&apos;ve pulled together strong, relevant citations</span> for your paper from peer-reviewed journals and academic sources that will strengthen your argument and reference list.
              </p>
        </div>

            <p className="text-stone-500 text-sm text-center mb-6">
              Sign up free to view your full citation list, copy formatted references, and add them to your draft.
            </p>
            
            <button 
              onClick={handleContinueToSignupFromCitations}
              className="w-full py-3.5 bg-[#58CC02] text-white font-extrabold rounded-2xl border-2 border-b-4 border-[#46A302] active:border-b-2 active:translate-y-0.5 transition-all duration-200 flex items-center justify-center"
            >
              See my citations (it&apos;s free)
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
          </div>
      )}

      {/* Fake Summary Results Modal */}
      {showFakeSummaryResults && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="relative bg-white rounded-2xl p-6 sm:p-8 max-w-4xl w-full mx-4 shadow-2xl animate-fade-in">
            <button type="button" onClick={() => setShowFakeSummaryResults(false)} className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors z-10" aria-label="Close">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-100 text-teal-700 rounded-full text-sm font-medium mb-3">
                <span>📝</span> Summary Generated Successfully
              </div>
              <h3 className="text-xl font-bold text-stone-800">Your document has been condensed</h3>
            </div>

            {/* Side by Side Panels */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {/* Original Panel */}
              <div className="bg-stone-50 rounded-xl border border-stone-200 overflow-hidden">
                <div className="px-4 py-2.5 bg-stone-100 border-b border-stone-200">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-stone-400"></div>
                    <span className="text-xs font-semibold text-stone-600 uppercase tracking-wider">Original</span>
                  </div>
                </div>
                <div className="p-4 max-h-48 overflow-y-auto">
                  <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-wrap">{inputText.slice(0, 500)}{inputText.length > 500 ? '...' : ''}</p>
                </div>
              </div>

              {/* Summary Panel */}
              <div className="bg-teal-50 rounded-xl border border-teal-200 overflow-hidden">
                <div className="px-4 py-2.5 bg-teal-100/50 border-b border-teal-200">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-teal-400"></div>
                    <span className="text-xs font-semibold text-teal-600 uppercase tracking-wider">Summary</span>
                    <span className="px-2 py-0.5 bg-teal-200 text-teal-700 text-[10px] font-bold rounded-full">~75% shorter</span>
                  </div>
                </div>
                <div className="p-4 max-h-48 overflow-y-auto relative">
                  <div className="absolute inset-0 bg-teal-50/90 pointer-events-none"></div>
                  <div className="text-sm text-teal-900 leading-relaxed blur-[2px]">
                    <p className="mb-2">• Key finding regarding the primary subject matter and its implications</p>
                    <p className="mb-2">• Important methodology considerations and framework details</p>
                    <p className="mb-2">• Critical analysis of results and supporting evidence</p>
                    <p>• Conclusions drawn from the comprehensive review...</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="flex flex-wrap gap-3 justify-center mb-6">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-teal-50 rounded-full border border-teal-200">
                <svg className="w-4 h-4 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-teal-700 text-sm font-medium">Bullet or paragraph format</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full border border-green-200">
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-green-700 text-sm font-medium">5,000 words free/month</span>
              </div>
            </div>

            <div className="bg-stone-50 rounded-xl p-3.5 mb-6">
              <p className="text-stone-600 text-sm text-center leading-relaxed">
                <span className="font-semibold text-stone-800">Sign up to reveal your full summary.</span> Copy it, share it, or use it in your notes.
              </p>
            </div>

            <button
              onClick={handleContinueToSignup}
              className="w-full py-3.5 bg-[#58CC02] text-white font-extrabold rounded-2xl border-2 border-b-4 border-[#46A302] active:border-b-2 active:translate-y-0.5 transition-all duration-200 flex items-center justify-center"
            >
              Get my summary (it&apos;s free)
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Fake Study Tools Results Modal */}
      {showFakeQuizResults && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="relative bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full mx-4 shadow-2xl animate-fade-in">
            <button type="button" onClick={() => setShowFakeQuizResults(false)} className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors" aria-label="Close">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">{studyToolMode === 'flashcards' ? '🃏' : studyToolMode === 'crossword' ? '🧩' : '📝'}</span>
              </div>
            </div>
            <h3 className="text-xl font-bold text-stone-800 text-center mb-2">
              {studyToolMode === 'flashcards' ? 'Flashcards Generated' : studyToolMode === 'crossword' ? 'Crossword Generated' : 'Quiz Generated'}
            </h3>
            <p className="text-stone-500 text-center text-sm mb-5">
              {studyToolMode === 'flashcards' ? 'We\'ve created flip cards from your content' : studyToolMode === 'crossword' ? 'We\'ve created a puzzle from your content' : 'We\'ve created questions from your content'}
            </p>
            <div className="space-y-3 mb-5">
              <div className="flex items-start p-3.5 bg-amber-50 rounded-xl border border-amber-100">
                <span className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
                <div>
                  <p className="text-amber-800 font-semibold text-sm">
                    {studyToolMode === 'flashcards' ? 'Interactive flip cards' : studyToolMode === 'crossword' ? 'Interactive crossword puzzle' : 'Multiple choice & true/false'}
                  </p>
                  <p className="text-amber-600 text-xs mt-0.5">
                    {studyToolMode === 'flashcards' ? 'Perfect for memorization and quick review' : studyToolMode === 'crossword' ? 'Fun way to learn key vocabulary' : 'Mix question types for better retention'}
                  </p>
                </div>
              </div>
              <div className="flex items-start p-3.5 bg-amber-50 rounded-xl border border-amber-100">
                <span className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
                <div>
                  <p className="text-amber-800 font-semibold text-sm">2 free study packs per month (lesson and flashcards; quiz, crossword, Crater Blast & Word Tower with Pro)</p>
                  <p className="text-amber-600 text-xs mt-0.5">Sign up to unlock Study Tools. Upgrade for unlimited</p>
                </div>
              </div>
            </div>
            <div className="bg-stone-50 rounded-xl p-3.5 mb-6">
              <p className="text-stone-600 text-sm text-center leading-relaxed">
                <span className="font-semibold text-stone-800">
                  {studyToolMode === 'flashcards' ? 'Turn any notes into flashcards.' : studyToolMode === 'crossword' ? 'Turn key terms into puzzles.' : 'Turn any notes into a quiz.'}
                </span> Great for exam prep and study sessions.
              </p>
            </div>
            <button
              onClick={handleContinueToSignup}
              className="w-full py-3.5 bg-[#FF9600] text-white font-extrabold rounded-2xl border-2 border-b-4 border-[#D97F00] active:border-b-2 active:translate-y-0.5 transition-all duration-200 flex items-center justify-center"
            >
              Sign up to unlock Study Tools (it&apos;s free)
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ─── FLOATING PIP DEMO PLAYER ──────────────────────────────────────
          A picture-in-picture style mini-video that pins to the bottom-right
          of the viewport once the user scrolls past the hero. Three quality
          touches make it feel premium:
            1. Glass-morphism surround (gradient border + backdrop blur)
            2. Animated entrance (slide up + fade) and graceful exit
            3. Sound toggle + close so users always have control
          Dismissal is sticky for the session (sessionStorage) so it never
          feels like a popup ad. Hidden on small phones (<480px) where it
          would dominate the viewport. */}
      {!pipDismissed && pipVisible && (
        <div
          role="region"
          aria-label="Product demo video"
          className={`fixed bottom-6 right-6 z-[60] hidden md:block transition-all duration-500 ease-out
            ${pipVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}
            ${pipExpanded ? 'w-[380px] lg:w-[440px]' : 'w-[240px]'}
          `}
          style={{
            animation: 'pipSlideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
        >
          {/* Soft glow ring behind the card for that "premium product demo" feel */}
          <div
            className="absolute -inset-1.5 rounded-3xl bg-gradient-to-br from-[#A560E8]/40 via-[#1CB0F6]/30 to-[#58CC02]/30 blur-xl opacity-70 pointer-events-none"
            aria-hidden
          />

          <div className="relative rounded-2xl overflow-hidden border-2 border-b-4 border-[#8A48C7] dark:border-[#8A48C7] shadow-2xl bg-white dark:bg-stone-900 backdrop-blur">
            {/* Top chrome bar — gradient with live-dot, title, and controls.
                Static (no drag) per user brief — the PiP stays pinned to
                the bottom-right corner. */}
            <div
              className="relative flex items-center justify-between px-3 py-2 bg-gradient-to-r from-[#A560E8] via-[#9B55E0] to-[#8A48C7] select-none"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
                  <span className="absolute inline-flex h-full w-full rounded-full bg-[#FF4B4B] opacity-75 motion-safe:animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FF4B4B]" />
                </span>
                <span className="text-white text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[0.15em] truncate">
                  WriteScholar in 30s
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {/* Mute / Unmute */}
                <button
                  type="button"
                  onClick={() => setPipMuted((m) => !m)}
                  aria-label={pipMuted ? 'Unmute video' : 'Mute video'}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors active:scale-95"
                >
                  {pipMuted ? (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                  )}
                </button>
                {/* Expand / Compact */}
                <button
                  type="button"
                  onClick={() => setPipExpanded((e) => !e)}
                  aria-label={pipExpanded ? 'Make smaller' : 'Make bigger'}
                  className="hidden sm:flex w-7 h-7 items-center justify-center rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors active:scale-95"
                >
                  {pipExpanded ? (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V5a1 1 0 00-1-1H4m11 5V5a1 1 0 011-1h4M9 15v4a1 1 0 01-1 1H4m11-5v4a1 1 0 001 1h4" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                  )}
                </button>
                {/* Close */}
                <button
                  type="button"
                  onClick={handleDismissPip}
                  aria-label="Close demo video"
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/15 hover:bg-[#FF4B4B] text-white transition-colors active:scale-95"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Video itself */}
            <div className="relative bg-black">
              <video
                src="/hero-vid.mp4"
                poster="/hero-vid-poster.jpg"
                autoPlay
                muted={pipMuted}
                loop
                playsInline
                preload="metadata"
                aria-label="WriteScholar walkthrough: a quick screen recording of the full product"
                className="w-full h-auto block"
              />
              {/* Subtle vignette for cinematic feel */}
              <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-black/10 rounded-b-[14px]" aria-hidden />
            </div>

            {/* Footer CTA bar — turns the player into a conversion surface */}
            <button
              type="button"
              onClick={() => onNavigate('signup')}
              className="group/pipcta relative w-full flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gradient-to-r from-[#FFF4E0] via-white to-[#DDF4FF] dark:from-stone-800 dark:via-stone-900 dark:to-stone-800 text-[#3C3C3C] dark:text-stone-100 text-[12px] sm:text-[13px] font-extrabold border-t-2 border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 active:translate-y-[1px] transition-all"
            >
              <span>Get started today</span>
              <svg className="w-4 h-4 text-[#A560E8] group-hover/pipcta:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </main>

      {/* Footer sits OUTSIDE <main> so the desktop landing-zoom
          (0.81) leaves it at 100% — same treatment as the header. */}
      <Footer onNavigate={onNavigate} />
    </>
  );
};

export default LandingPage;
