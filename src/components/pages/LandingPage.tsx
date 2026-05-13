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
    question: "What kind of feedback will I get on my essay?",
    answer: "You get section-by-section annotations (green for strong, yellow for improve, red for concerns), an overall grade-level rubric, and actionable improvement suggestions. It covers structure, argument quality, clarity, citations, and academic style."
  },
  {
    question: "How does the essay analyzer work?",
    answer: "Paste your essay (200+ words) or upload a PDF/DOCX/TXT file. Our AI analyzes structure, clarity, argument, citations, and academic tone the way a professor would. You get detailed feedback with specific suggestions in under 60 seconds."
  },
  {
    question: "Is WriteScholar for college and university students?",
    answer: "Yes. WriteScholar is for undergrads and postgrads worldwide, whether you're writing essays in the UK, the US, or elsewhere. Set your education level in the analyzer for feedback that fits your course. We support major citation styles (APA, MLA, Chicago, Harvard, and more). High school options are available too."
  },
  {
    question: "How long does essay analysis take?",
    answer: "Usually under 60 seconds. Paste your essay, click Analyze Text, and you'll see professor-style feedback with a full rubric and improvement tips. Free plan includes 2 analyses per month."
  },
  {
    question: "Can I upload a Word or PDF file?",
    answer: "Yes. Upload PDF, DOCX, DOC, or TXT files directly. Or paste your text into the box. Both work for analysis. Files are processed securely and never shared."
  },
  {
    question: "Can I create study quizzes from my notes?",
    answer: "Yes! The Study Pack turns any text into lessons, flashcards, quizzes, crosswords, Crater Blast & Word Tower. Paste your notes or upload a document. Free users get lesson and flashcards; quiz, crossword, Crater Blast & Word Tower unlock with Pro."
  },
  {
    question: "What is Daily Review?",
    answer: "Daily Review is your personalised daily practice session, like Duolingo but for your coursework. Each day you get a short session based on your saved study materials — flashcard drills, quiz questions, and vocabulary checks. Complete it to earn XP and keep your streak alive. It's the default tab when you open your dashboard."
  },
  {
    question: "What are XP, levels, streaks, and badges?",
    answer: "WriteScholar has a full progression system to keep you motivated. Earn XP for completing daily reviews, analysing essays, creating study packs, and more. XP fills your level bar — there are 100 levels to climb, from Scholar Seedling to Supreme Grandmaster. Streaks track how many days in a row you've studied. And there are 80+ badges to unlock across categories like writing, studying, and consistency. It's designed to make studying feel rewarding."
  },
  {
    question: "What citation styles are supported?",
    answer: "We support APA 7th edition, MLA 9th edition, Chicago (notes-bibliography and author-date), Harvard, IEEE, and Vancouver. The citation finder searches academic databases for relevant sources."
  },
  {
    question: "Is my content private and secure?",
    answer: "Yes. We use enterprise-grade encryption. Your content is never shared with third parties or used to train AI models. You can delete your documents at any time."
  },
  {
    question: "What's the difference between Free and Pro?",
    answer: "Free: 3 documents, 2 analyses, 2 study packs, 5k words, 2 citations per month, 2MB library storage, Focus Mode (3 sites). Pro: 99 combined analyses, study packs and citations per month, 999,999 words for the Paper Summarizer, Apply WriteScholar revisions into your draft, all citation styles, PDF/Word export, Focus Mode with unlimited blocked sites, uploads up to 100MB per file, and full quiz & study tools. Premium: 5× usage versus Pro—499 combined actions per month, unlimited research-paper summarisation, and 1GB library storage."
  },
  {
    question: "How do I add friends and share my study materials?",
    answer: "Every account gets a unique friend code. Share your code with friends so they can add you. Once connected, you can share flashcards, quizzes, crosswords, or notes with one tap. They tap Accept and it's in their library. Core sharing is free."
  }
];

/* ─── LandingEssayCallouts — desktop-only annotated essay block ───
   A shrunken /rubric-and-notes.png screenshot with 4 numbered badges
   on its corners and matching callout cards in the left/right gutters,
   connected by dashed SVG arrows. Mirrors the onboarding tour's
   EssayPitchVisual desktop layout (see OnboardingPage.tsx), restyled
   with the landing page's purple accent so it slots in under the
   "Analyze papers with feedback that thinks like a professor" hero.

   Non-crossing convention: each numbered badge sits on the same side
   of the image as its callout column, so the arrows never tangle.
     #1 — RIGHT column top    (score badge, y≈6)
     #2 — LEFT  column top    (rubric grid, y≈22)
     #3 — LEFT  column bottom (color-coded text, y≈68)
     #4 — RIGHT column bottom (annotations, y≈84) */
function LandingEssayCallouts() {
  const color = '#A560E8';
  const borderColor = '#8A48C7';
  const hotspots: { x: number; y: number; title: string; desc: string }[] = [
    {
      // #1 — score header
      x: 82, y: 6,
      title: 'Real /100 grade + letter score',
      desc: 'Every essay graded out of 100 with a letter grade — using the same rubric weights real professors mark with. You always know how close you are to an A.',
    },
    {
      // #2 — five-category rubric grid
      x: 22, y: 22,
      title: 'Five-category rubric breakdown',
      desc: 'Thesis · Evidence · Structure · Clarity · Mechanics — each scored individually so you see exactly which category is costing you marks.',
    },
    {
      // #3 — color-coded essay text
      x: 22, y: 68,
      title: 'Colour-coded essay text',
      desc: 'Your sentences turn green (strong), amber (revise), or red (serious concern). Hover any highlight to read the AI\'s exact feedback for that line.',
    },
    {
      // #4 — line-by-line annotations
      x: 78, y: 84,
      title: 'Line-by-line annotations',
      desc: 'Every sentence gets a verdict plus a specific revise-to suggestion. Not "make it better" — actual rewritten lines you can copy straight in.',
    },
  ];

  return (
    <div className="hidden lg:grid lg:grid-cols-[1fr_minmax(0,1.6fr)_1fr] gap-10 xl:gap-14 items-stretch">
      {/* LEFT column — #2 rubric (top), #3 color-coded text (bottom). */}
      <div className="flex flex-col justify-between gap-6 py-2">
        <div className="mt-10 xl:mt-14">
          <LandingEssayCallout n={2} hotspot={hotspots[1]} color={color} arrow="right" />
        </div>
        <LandingEssayCallout n={3} hotspot={hotspots[2]} color={color} arrow="right" />
      </div>

      {/* CENTRE — screenshot with the 4 numbered badges. */}
      <div className="relative pt-2">
        <div className="absolute -inset-3 rounded-3xl blur-2xl opacity-25" style={{ backgroundColor: `${color}40` }} aria-hidden />
        <div className="relative rounded-2xl overflow-hidden border-2 border-b-4 shadow-xl bg-white dark:bg-stone-900" style={{ borderColor }}>
          <img
            src="/rubric-and-notes.png"
            alt="WriteScholar essay analyzer — rubric, score, and annotations"
            className="w-full h-auto block"
            loading="lazy"
            decoding="async"
          />
          {hotspots.map((h, i) => (
            <span
              key={i}
              aria-hidden
              className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full font-extrabold"
              style={{
                left: `${h.x}%`,
                top: `${h.y}%`,
                width: '32px',
                height: '32px',
                backgroundColor: color,
                color: 'white',
                fontSize: '14px',
                boxShadow: `0 0 0 4px white, 0 0 0 6px ${color}, 0 6px 14px rgba(0,0,0,0.25)`,
              }}
            >
              {i + 1}
            </span>
          ))}
        </div>
      </div>

      {/* RIGHT column — #1 score (top), #4 annotations (bottom). */}
      <div className="flex flex-col justify-between gap-6 py-2">
        <div className="-mt-3 xl:-mt-5">
          <LandingEssayCallout n={1} hotspot={hotspots[0]} color={color} arrow="left" />
        </div>
        <LandingEssayCallout n={4} hotspot={hotspots[3]} color={color} arrow="left" />
      </div>
    </div>
  );
}

/* ─── LandingComprehensiveCallouts — desktop annotated full-report ───
   Second arrow-callout block on the landing essay section. Mirrors
   the onboarding tour's Page 2 EssayDeepDiveVisual: a shrunken
   /full-report.png screenshot with 5 numbered badges marking the
   five sections of WriteScholar's comprehensive analysis report:

     #1 — RIGHT top    (y≈20) — Overall assessment
     #2 — LEFT  top    (y≈32) — Top suggestions
     #3 — RIGHT mid    (y≈50) — Strengths
     #4 — LEFT  bottom (y≈74) — Areas for improvement
     #5 — RIGHT bottom (y≈90) — Serious concerns

   5 badges → 3-right / 2-left split. RIGHT column uses
   justify-between to space all three callouts; LEFT column uses
   justify-around to centre its two between top and bottom. mt-*
   offsets fine-tune individual rows so each callout sits next to
   its badge on the image. */
function LandingComprehensiveCallouts() {
  const color = '#A560E8';
  const borderColor = '#8A48C7';
  const hotspots: { x: number; y: number; title: string; desc: string }[] = [
    {
      // #1 — RIGHT top — Overall assessment
      x: 80, y: 20,
      title: 'Overall assessment',
      desc: 'Letter grade, /100 score, and a plain-English verdict at the top. The high-level read on where this draft sits before you dive into the details.',
    },
    {
      // #2 — LEFT top — Top suggestions
      x: 22, y: 32,
      title: 'Top suggestions',
      desc: 'The handful of changes that move your grade the most, ranked by impact. Fix these first if you only have 20 minutes before the deadline.',
    },
    {
      // #3 — RIGHT middle — Strengths
      x: 80, y: 50,
      title: 'Strengths',
      desc: 'The specific moves already earning marks: thesis framing, evidence handling, transitions. Each one surfaced with the actual sentence. Keep what works.',
    },
    {
      // #4 — LEFT bottom — Areas for improvement
      x: 22, y: 74,
      title: 'Areas for improvement',
      desc: 'Vague claims, weak signposting, sentences doing too much. Each one comes with a concrete "revise to" suggestion. No guessing what to change.',
    },
    {
      // #5 — RIGHT bottom — Serious concerns
      x: 80, y: 90,
      title: 'Serious concerns',
      desc: 'Missing citations, logic gaps, factual slips. The things professors actually deduct points for. Surfaced before submit, not after the red pen.',
    },
  ];

  return (
    <div className="hidden lg:grid lg:grid-cols-[1fr_minmax(0,1.7fr)_1fr] gap-10 xl:gap-14 items-stretch">
      {/* LEFT — Top suggestions (#2) sits a touch below its badge
          (badge y=32, callout lifted up); Areas for improvement (#4)
          is pulled up off the column floor so it sits higher than
          its badge y=74 anchor. mt-* on #2 / mb-* on #4 tune the
          vertical alignment by hand. */}
      <div className="flex flex-col justify-around gap-6 py-2">
        <div className="mt-8 xl:mt-14">
          <LandingEssayCallout n={2} hotspot={hotspots[1]} color={color} arrow="right" />
        </div>
        <div className="mb-8 xl:mb-12">
          <LandingEssayCallout n={4} hotspot={hotspots[3]} color={color} arrow="right" />
        </div>
      </div>

      {/* CENTRE — full-report screenshot with the 5 numbered badges. */}
      <div className="relative pt-2">
        <div className="absolute -inset-3 rounded-3xl blur-2xl opacity-25" style={{ backgroundColor: `${color}40` }} aria-hidden />
        <div className="relative rounded-2xl overflow-hidden border-2 border-b-4 shadow-xl bg-white dark:bg-stone-900" style={{ borderColor }}>
          <img
            src="/full-report.png"
            alt="WriteScholar comprehensive analysis — five-section professor-style report"
            className="w-full h-auto block"
            loading="lazy"
            decoding="async"
          />
          {hotspots.map((h, i) => (
            <span
              key={i}
              aria-hidden
              className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full font-extrabold"
              style={{
                left: `${h.x}%`,
                top: `${h.y}%`,
                width: '32px',
                height: '32px',
                backgroundColor: color,
                color: 'white',
                fontSize: '14px',
                boxShadow: `0 0 0 4px white, 0 0 0 6px ${color}, 0 6px 14px rgba(0,0,0,0.25)`,
              }}
            >
              {i + 1}
            </span>
          ))}
        </div>
      </div>

      {/* RIGHT — Overall assessment (#1) at top, Strengths (#3) in
          the middle, Serious concerns (#5) at the bottom.
          justify-between spaces all three evenly. */}
      <div className="flex flex-col justify-between gap-6 py-2">
        <LandingEssayCallout n={1} hotspot={hotspots[0]} color={color} arrow="left" />
        <LandingEssayCallout n={3} hotspot={hotspots[2]} color={color} arrow="left" />
        <LandingEssayCallout n={5} hotspot={hotspots[4]} color={color} arrow="left" />
      </div>
    </div>
  );
}

/* Single landing-page callout card with a number badge, title,
   description, and a dashed arrow on its inner edge pointing toward
   the centre image. Same visual recipe as OnboardingPage's
   DesktopCallout, kept inline here to keep the module self-contained
   (no cross-component import gymnastics). */
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
        {/* ─── HERO BACKGROUND — SINGLE-COLOUR PURPLE (BOUNDED) ─────
            Per user brief: the purple background only spans the hero
            portion (H1 + CTA + tiles + feature-icons row). After that
            point, the section reverts to the site's cream off-white so
            the analyzer demo and downstream content read like any
            other body section.

            Implementation: all purple background artwork is wrapped in
            a fixed-height absolute container with overflow-hidden so
            it clips cleanly at the bottom edge of the feature-icons
            row. Heights are responsive — taller on mobile because the
            phone hero stacks H1, CTA/Login, mobile tile grid, and the
            wrapping feature-icons row vertically. */}
        <div
          className="absolute top-0 left-0 right-0 h-[1180px] md:h-[1050px] lg:h-[1100px] xl:h-[1180px] overflow-hidden pointer-events-none"
          aria-hidden
        >
          {/* Base — rich purple gradient. Brand purple #A560E8 at the top
              transitioning to a deeper #7733B5 at the bottom for depth so
              the hero doesn't feel flat. Knowunity does this with navy;
              we do it with our brand purple. */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#A560E8] via-[#8A48C7] to-[#6B27A3] dark:from-[#4A1B70] dark:via-[#3A1457] dark:to-[#2A0E40]" />

          {/* Lighter-purple atmospheric orb — top-left. */}
          <div className="pointer-events-none absolute -top-40 -left-[10%] h-[min(95vw,40rem)] w-[min(95vw,40rem)] rounded-full bg-[#D4A8F5]/[0.22] blur-[110px] dark:bg-[#C589FF]/[0.14] animate-landing-hero-blob" />

          {/* Lighter-purple atmospheric orb — top-right. */}
          <div className="pointer-events-none absolute -top-40 -right-[10%] h-[min(95vw,38rem)] w-[min(95vw,38rem)] rounded-full bg-[#E2C2FA]/[0.20] blur-[110px] dark:bg-[#B873F0]/[0.14] animate-landing-hero-blob-delayed" />

          {/* Deeper-purple shadow orb — bottom-left, adds depth/grounding. */}
          <div className="pointer-events-none absolute -bottom-20 -left-[8%] h-[min(90vw,36rem)] w-[min(90vw,36rem)] rounded-full bg-[#5A1B8E]/[0.30] blur-[110px] dark:bg-[#3A0F66]/[0.45] animate-landing-hero-blob" />

          {/* Deeper-purple shadow orb — bottom-right. */}
          <div className="pointer-events-none absolute -bottom-20 -right-[10%] h-[min(95vw,40rem)] w-[min(95vw,40rem)] rounded-full bg-[#6B27A3]/[0.32] blur-[110px] dark:bg-[#3A0F66]/[0.45] animate-landing-hero-blob-delayed" />

          {/* Centre spotlight — very soft white radial sits behind the H1
              so the white headline gets a subtle "halo" lift without
              breaking the purple mood. */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_50%_at_50%_45%,rgba(255,255,255,0.10),transparent_70%)]" />

          {/* Subtle starry sparkle dots scattered across the hero — small
              white pinpricks that give a "magical / academic constellation"
              feel without competing with the H1. */}
          <div className="hidden md:block pointer-events-none absolute top-[12%] left-[18%] h-1 w-1 rounded-full bg-white/60 shadow-[0_0_8px_2px_rgba(255,255,255,0.5)] motion-safe:animate-pulse" />
          <div className="hidden md:block pointer-events-none absolute top-[22%] right-[14%] h-1.5 w-1.5 rounded-full bg-white/70 shadow-[0_0_10px_3px_rgba(255,255,255,0.5)] motion-safe:animate-pulse" style={{ animationDelay: '0.8s' }} />
          <div className="hidden md:block pointer-events-none absolute top-[38%] left-[7%] h-1 w-1 rounded-full bg-white/55 shadow-[0_0_8px_2px_rgba(255,255,255,0.45)] motion-safe:animate-pulse" style={{ animationDelay: '1.6s' }} />
          <div className="hidden md:block pointer-events-none absolute top-[44%] right-[6%] h-1 w-1 rounded-full bg-white/55 shadow-[0_0_8px_2px_rgba(255,255,255,0.45)] motion-safe:animate-pulse" style={{ animationDelay: '2.4s' }} />
          <div className="hidden md:block pointer-events-none absolute bottom-[28%] left-[24%] h-1.5 w-1.5 rounded-full bg-white/65 shadow-[0_0_10px_3px_rgba(255,255,255,0.5)] motion-safe:animate-pulse" style={{ animationDelay: '0.4s' }} />
          <div className="hidden md:block pointer-events-none absolute bottom-[22%] right-[22%] h-1 w-1 rounded-full bg-white/60 shadow-[0_0_8px_2px_rgba(255,255,255,0.45)] motion-safe:animate-pulse" style={{ animationDelay: '1.2s' }} />

          {/* ─── INTERNAL FADE → CREAM ──────────────────────────────
              Vertical gradient pinned to the BOTTOM of the purple
              wrapper that fades the purple bg into cream WITHIN the
              wrapper itself. Replaces the previous external fade
              (which started AFTER the wrapper, so cream couldn't
              emerge until the wrapper ended — felt too abrupt /
              "too late" per user feedback).
              `from-transparent from-30%` keeps the upper 30% of the
              fade region fully transparent so the wrapper's deep
              purple still reads behind the feature-icons row that
              sits in this zone. Cream emerges over the lower 70%
              and is fully opaque at the wrapper's bottom edge — so
              by the time the wrapper "ends" the eye already sees
              cream, no hard seam. */}
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
                  pos: 'top-[2rem] xl:top-[3rem] left-0 xl:-left-[2rem]',
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
                  pos: 'top-[2rem] xl:top-[3rem] right-0 xl:-right-[2rem]',
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
                  className={`hidden lg:block absolute z-10 w-40 xl:w-48 ${t.anim} ${t.pos}`}
                  style={{ animationDelay: t.delay }}
                >
                  <div className="rounded-2xl overflow-hidden border-2 border-b-4 border-[#FFC800] shadow-[0_18px_42px_-12px_rgba(255,200,0,0.55)] bg-stone-950">
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
                    <p className="px-2 py-1 text-center text-[10px] xl:text-[11px] font-extrabold text-stone-800 bg-white border-t-2 border-[#FFC800]/40">
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
              <div className="inline-flex items-center gap-2.5 rounded-full border-2 border-b-[3px] border-[#E5E5E5] bg-white pl-1.5 pr-4 py-1 shadow-[0_8px_22px_-6px_rgba(0,0,0,0.30)]">
                <span
                  className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-[#E5F8D0]"
                  aria-hidden
                >
                  <svg className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-[#46A302]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                </span>
                <span className="text-[12px] sm:text-[13px] font-bold text-stone-800">
                  Trusted by <span className="font-extrabold text-[#58CC02] tabular-nums">50,000+</span> students worldwide
                </span>
              </div>

              {/* ─── 2. EDITORIAL HEADLINE ─────────────────────────────
                  Serif display face, two forced lines, white on violet.
                  Line 2 italicises "serious" in yellow for visual rhythm
                  and to land the promise on the right student segment. */}
              <h1
                className="font-display font-semibold text-white tracking-tight leading-[1.04] mt-6 sm:mt-7 text-[2rem] sm:text-[2.625rem] md:text-[3.375rem] lg:text-[4rem] xl:text-[4.75rem]"
              >
                <span className="block">The premium AI</span>
                <span className="block">
                  grader for <span className="italic text-[#FFC800]">serious</span> students
                </span>
              </h1>

              {/* ─── 3. SUBHEAD ───────────────────────────────────────
                  Single tight paragraph clarifying the product promise.
                  "Letter grade" and "polished revision" are bolded white
                  so the most concrete benefits jump out of a scan. */}
              <p className="mt-6 sm:mt-7 max-w-2xl mx-auto text-base sm:text-lg lg:text-xl text-white/85 font-medium leading-relaxed">
                Drop in your essay. Get a <span className="font-extrabold text-white">letter grade</span>, rubric scores and <span className="font-extrabold text-white">professor style feedback</span> in 60 seconds.
              </p>

              {/* ─── 4. FEATURE PILLS ROW ─────────────────────────────
                  Four tiny capsule chips reinforcing the four concrete
                  deliverables from the subhead. White background / black
                  text styling so they match the trust pill above instead
                  of fading into the dark violet bg. */}
              <div className="mt-6 flex flex-wrap justify-center gap-x-2.5 gap-y-2 max-w-3xl mx-auto">
                {[
                  'Letter grade + rubric',
                  'Line-by-line notes',
                  'Polished revision',
                  '60-second result',
                ].map((label) => (
                  <span
                    key={label}
                    className="inline-flex items-center px-3 py-1 rounded-full border-2 border-b-[3px] border-[#E5E5E5] bg-white text-stone-800 text-[11px] sm:text-xs font-bold shadow-[0_6px_16px_-6px_rgba(0,0,0,0.25)]"
                  >
                    {label}
                  </span>
                ))}
              </div>

              {/* ─── 5. CTA PAIR ──────────────────────────────────────
                  Primary green Duolingo button + secondary text link.
                  Stacks on mobile, sits side-by-side on sm+. */}
              <div className="mt-8 sm:mt-9 flex flex-col sm:flex-row gap-3 sm:gap-4 items-center justify-center">
                <button
                  type="button"
                  onClick={() => onNavigate('signup')}
                  className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-[#58CC02] hover:bg-[#46A302] text-white text-base sm:text-lg font-extrabold uppercase tracking-wide px-7 sm:px-9 py-4 border-2 border-b-4 border-[#46A302] active:border-b-2 active:translate-y-0.5 transition-all shadow-[0_18px_32px_-12px_rgba(88,204,2,0.6)]"
                >
                  Grade my essay
                  <svg className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    document.getElementById('hero-interactive-demo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="inline-flex items-center gap-1.5 text-sm sm:text-base font-bold text-white/80 hover:text-white underline underline-offset-4 decoration-2 decoration-[#FFC800]/50 hover:decoration-[#FFC800] transition-colors px-2 py-3"
                >
                  See a sample report
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </button>
              </div>

              {/* ─── 6. RISK-REVERSAL MICROCOPY ───────────────────────
                  Tiny line below CTAs killing the three classic objections
                  in sequence: price, payment friction, perceived limit. */}
              <p className="mt-3 text-[11px] sm:text-xs text-white/55 font-bold tracking-wide">
                About 30 seconds to get started · No payment today
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
                <div className="relative rounded-2xl sm:rounded-3xl border-2 border-[#FFC800] bg-white dark:bg-stone-900 shadow-[0_0_18px_rgba(255,200,0,0.28),0_18px_36px_-12px_rgba(0,0,0,0.35)] sm:shadow-[0_0_30px_rgba(255,200,0,0.5),0_0_70px_rgba(255,200,0,0.25),0_30px_60px_-15px_rgba(0,0,0,0.4)] overflow-hidden">
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
                    live demo (B by default, C when toggled). Tilt
                    flipped to +6° so the pill leans away from the page
                    edge it's anchored against. */}
                <div
                  aria-hidden
                  className="hidden sm:flex absolute -top-4 -right-4 lg:-top-6 lg:-right-6 items-center justify-center w-16 h-16 lg:w-20 lg:h-20 rounded-2xl bg-[#58CC02] text-white text-3xl lg:text-4xl font-extrabold rotate-[6deg] border-2 border-b-4 border-[#46A302] shadow-[0_18px_32px_-8px_rgba(88,204,2,0.5)] z-10"
                >
                  {heroDemoGrade}
                </div>

                {/* Floating "60 sec" badge — bottom-right */}
                <div
                  aria-hidden
                  className="hidden sm:flex absolute -bottom-3 -right-3 lg:-bottom-4 lg:-right-4 items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFC800] text-stone-900 text-xs lg:text-sm font-extrabold uppercase tracking-wider border-2 border-b-[3px] border-[#D9A800] shadow-[0_14px_24px_-6px_rgba(255,200,0,0.55)] z-10"
                >
                  <span aria-hidden>⚡</span> 60 sec
                </div>
              </div>

              {/* ─── 8. PRODUCT-BREADTH VIDEO STRIP — mobile/tablet fallback ──
                  On lg+ the four tiles float around the H1 above (see
                  block #2-tiles). This horizontal strip is the smaller
                  -screen fallback where there isn't room in the margins
                  to flank the headline. Same four tiles, same yellow
                  Duolingo border. 2x2 grid on mobile, 4-up on sm. */}
              <div className="mt-10 sm:mt-12 lg:hidden grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-5xl mx-auto">
                {[
                  { label: 'Essay Analyzer', kind: 'image' as const, src: '/rubric-and-notes.png' },
                  { label: 'Premium essay analysis', kind: 'image' as const, src: '/full-report.png' },
                  { label: 'Notes to Flashcards', kind: 'video' as const, src: '/hero-flashcards.mp4' },
                  { label: 'Notes to Quiz', kind: 'video' as const, src: '/hero-quiz.mp4' },
                ].map((t) => (
                  <div
                    key={t.label}
                    // Lighter yellow shadow than the lg+ floating tiles (which
                    // sit alone in side margins with room to breathe). On
                    // mobile the four tiles cluster in a 2x2 grid so a softer
                    // shadow keeps the page from looking yellow-soaked.
                    className="rounded-2xl overflow-hidden border-2 border-b-4 border-[#FFC800] shadow-[0_10px_24px_-10px_rgba(255,200,0,0.32)] bg-stone-950"
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
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <p className="px-2 py-1 text-center text-[10px] sm:text-[11px] font-extrabold text-stone-800 bg-white border-t-2 border-[#FFC800]/40">
                      {t.label}
                    </p>
                  </div>
                ))}
              </div>

            </div>

            {/* Downstream-content wrapper (preserved from pre-redesign
                tree as `flex flex-col items-stretch w-full`). Holds the
                analyzer-demo section + everything else below the hero;
                closed alongside the section's downstream closers. */}
            <div className="flex flex-col items-stretch w-full">

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
                      positioned ABSOLUTELY to the LEFT of the heading
                      block so it doesn't push the centered text off-
                      centre. Hidden on smaller screens. */}
                  <img
                    src="/mascot-paper.webp"
                    alt=""
                    aria-hidden
                    loading="lazy"
                    decoding="async"
                    className="hidden lg:block absolute right-full top-1/2 -translate-y-1/2 mr-6 w-24 xl:w-28 h-auto shrink-0 motion-safe:animate-[hero-tile-drift_4.5s_ease-in-out_infinite] [filter:drop-shadow(0_14px_24px_rgba(165,96,232,0.30))]"
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
                    Drop in your essay or paper. Our AI grades structure, clarity, and citations with actionable feedback.
                  </p>
                </div>

                {/* The mobile/tablet interactive demo that used to sit
                    here was removed once the hero gained its own live
                    `#hero-interactive-demo` showcase — no need to
                    surface the same heavy component twice on a single
                    landing page. The marketing copy + callouts below
                    still pitch the analyzer for visitors who scroll
                    past the hero. */}

                {/* DESKTOP — shrunken annotated essay screenshot with 4
                    arrow callouts in the corners, mirroring the onboarding
                    tour's Page 1 EssayPitchVisual. Trades the live demo for
                    a tighter "marketing" layout that fits more value-prop
                    copy on a single eye-line. Numbered badges live on the
                    same side as their callout column so the arrows never
                    criss-cross.
                      #1 = RIGHT top    (score badge, y=6)
                      #2 = LEFT  top    (rubric grid, y=22)
                      #3 = LEFT  bottom (color-coded text, y=68)
                      #4 = RIGHT bottom (annotations, y=84) */}
                <LandingEssayCallouts />

                {/* DESKTOP — second arrow-callout block: the
                    comprehensive analysis report. The block above is
                    the per-sentence rubric view; this one shows the
                    section-by-section professor-style report that
                    every essay also gets. Together they show the
                    full depth of feedback (line level + report level)
                    before the visitor scrolls past the fold. Same
                    desktop-only treatment, separated by a sub-
                    heading + thin divider so it reads as "and then
                    you also get this." */}
                <div className="hidden lg:block mt-16 xl:mt-20">
                  <div className="flex items-center justify-center gap-4 mb-10 xl:mb-12">
                    <span className="h-px flex-1 max-w-[140px] bg-gradient-to-r from-transparent to-stone-300 dark:to-stone-600" aria-hidden />
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#A560E8]/10 dark:bg-[#A560E8]/20 border-2 border-[#A560E8]/40 text-[11px] xl:text-xs font-extrabold uppercase tracking-[0.16em] text-[#8A48C7] dark:text-[#C390F2]" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6z" />
                      </svg>
                      And a full professor-style report
                    </span>
                    <span className="h-px flex-1 max-w-[140px] bg-gradient-to-l from-transparent to-stone-300 dark:to-stone-600" aria-hidden />
                  </div>
                  <div className="text-center max-w-3xl mx-auto mb-10 xl:mb-14">
                    <h3
                      className="text-xl xl:text-2xl font-extrabold text-stone-900 dark:text-stone-50 tracking-tight leading-tight"
                      style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
                    >
                      Publish your essay, get back five sections of staff-style feedback
                    </h3>
                    <p className="mt-2 xl:mt-3 text-sm xl:text-base text-stone-600 dark:text-stone-400 font-semibold leading-relaxed">
                      Every analysis comes with a full report — the same five buckets a TA writes up after marking your draft. Skim the verdict, jump to the fix list, then dig into the detail.
                    </p>
                  </div>
                  <LandingComprehensiveCallouts />
                </div>

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
                <div className="hidden sm:block mt-12 sm:mt-16 mb-2 max-w-5xl mx-auto px-1">
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

              {/* Strong horizontal section break — full-width line with
                  labeled badge in the middle so users clearly see they're
                  entering the "how it works" 3-step explainer below. */}
              <div className="relative w-full max-w-6xl mx-auto mt-12 sm:mt-16 mb-4 sm:mb-6 flex items-center gap-4 sm:gap-6 px-1" aria-hidden>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-stone-300/80 to-stone-300/80 dark:via-stone-700/60 dark:to-stone-700/60" />
                <span className="inline-flex items-center gap-2 rounded-full border-2 border-[#E5E5E5] dark:border-stone-700 bg-white dark:bg-stone-900 px-4 py-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-[0.18em] text-[#1CB0F6] dark:text-[#1CB0F6] whitespace-nowrap">
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
                <div className="pointer-events-none absolute -bottom-4 right-[8%] w-36 h-36 rounded-full bg-[#FFC800]/15 dark:bg-[#FFC800]/12 blur-3xl" aria-hidden />

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
                    {[
                      {
                        step: '1',
                        title: 'Paste your work',
                        desc: 'Drop in an essay draft for feedback, or paste any notes / textbook chapter for study tools.',
                        mascot: '/mascot-paper.webp',
                        accentBorder: 'border-[#1CB0F6]/60 dark:border-[#1899D6]/50',
                        accentRing: 'ring-[#1CB0F6]/30',
                        accentGlow: 'from-[#1CB0F6]/30 via-[#1CB0F6]/15 to-[#58CC02]/15',
                        badge: 'bg-[#1CB0F6]',
                      },
                      {
                        step: '2',
                        title: 'AI does the heavy lifting',
                        desc: 'In under 60 seconds, get rubric-graded essay feedback or 7 study tools generated from your notes.',
                        mascot: '/mascot-laptop.webp',
                        accentBorder: 'border-[#A560E8]/60 dark:border-[#8A48C7]/50',
                        accentRing: 'ring-[#A560E8]/30',
                        accentGlow: 'from-[#A560E8]/30 via-[#1CB0F6]/15 to-[#FF9600]/15',
                        badge: 'bg-[#A560E8]',
                      },
                      {
                        step: '3',
                        title: 'Submit & ace it',
                        desc: 'Hand in stronger essays. Walk into exams ready. Crush your next semester.',
                        mascot: '/mascot-celebrating.webp',
                        accentBorder: 'border-[#FF9600]/60 dark:border-[#D97F00]/50',
                        accentRing: 'ring-[#FF9600]/30',
                        accentGlow: 'from-[#FF9600]/30 via-[#FF4B4B]/15 to-[#1CB0F6]/15',
                        badge: 'bg-[#FF9600]',
                      },
                    ].map((s, i) => (
                      <div
                        key={s.step}
                        className={`relative rounded-3xl border ${s.accentBorder} bg-white dark:bg-stone-900 p-5 sm:p-6 shadow-none hover:-translate-y-1 transition-all duration-500 overflow-hidden`}
                        style={{ animationDelay: `${i * 120}ms` }}
                      >
                        <div className={`pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full bg-gradient-to-br ${s.accentGlow} blur-3xl opacity-70`} aria-hidden />
                        <div className="relative flex items-start gap-3 mb-3">
                          <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white text-sm font-bold shadow-md ring-2 ring-white dark:ring-stone-900 ${s.badge}`}>
                            {s.step}
                          </span>
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#1CB0F6] dark:text-[#1CB0F6] mb-0.5">
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
                        <div className={`relative rounded-2xl border ${s.accentBorder} bg-gradient-to-br from-stone-50 to-white dark:from-stone-800/60 dark:to-stone-900 ring-1 ${s.accentRing} aspect-[16/10] overflow-hidden flex items-center justify-center`}>
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
                    ))}
                  </div>
                </LandingScrollReveal>
              </div>


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
                    Free plan includes 2 essay analyses per month · Encrypted in transit · Cancel anytime · Quizzes, flashcards &amp; Focus Mode live under{' '}
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
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-15%,rgba(255,150,0,0.06),transparent_55%)] dark:bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(255,150,0,0.10),transparent_55%)]" aria-hidden />
        <div
          className="absolute inset-0 opacity-[0.4] dark:opacity-[0.15] pointer-events-none bg-[length:32px_32px] bg-[linear-gradient(to_right,rgba(148,163,184,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.07)_1px,transparent_1px)]"
          aria-hidden
        />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <LandingScrollReveal>
            {/* Header */}
            <div className="text-center mb-10 sm:mb-14 max-w-2xl mx-auto">
              <span className="inline-flex items-center gap-2 mb-4 rounded-full border border-orange-200/80 dark:border-orange-700/55 bg-[#FFF4E0]/80 dark:bg-[#FF9600]/10 backdrop-blur px-3.5 py-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-[#FF9600] dark:text-[#FF9600] shadow-sm">
                <span aria-hidden>🔥</span>
                The habit loop that keeps grades up
              </span>
              <h2
                className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold text-[#3C3C3C] dark:text-stone-50 tracking-tight leading-[1.05]"
                style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
              >
                Studying that{' '}
                <span className="text-[#FF9600]">
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
              <div className="relative rounded-2xl border-2 border-b-4 border-[#46A302] bg-white dark:bg-stone-900 p-5 sm:p-6 hover:-translate-y-1 transition-all overflow-hidden">
                <div className="pointer-events-none absolute -top-12 -right-12 w-36 h-36 rounded-full bg-[#58CC02]/15 dark:bg-[#58CC02]/10 blur-3xl" aria-hidden />
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-[#58CC02] flex items-center justify-center mb-4 border-2 border-b-4 border-[#46A302]">
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
                  <div className="hidden sm:block rounded-xl bg-[#E5F8D0]/60 dark:bg-[#58CC02]/10 border border-[#58CC02]/30 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-lg bg-[#58CC02] flex items-center justify-center">
                        <span className="text-white text-[10px] font-extrabold">1</span>
                      </div>
                      <span className="text-xs font-bold text-[#3C3C3C] dark:text-stone-200">Today&apos;s Session</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#58CC02]/20 overflow-hidden">
                      <div className="h-full w-[65%] rounded-full bg-[#58CC02]" />
                    </div>
                    <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-1.5 font-medium">3 of 5 questions done</p>
                  </div>
                </div>
              </div>

              {/* XP & Levels */}
              <div className="relative rounded-2xl border-2 border-b-4 border-[#1899D6] bg-white dark:bg-stone-900 p-5 sm:p-6 hover:-translate-y-1 transition-all overflow-hidden">
                <div className="pointer-events-none absolute -top-12 -right-12 w-36 h-36 rounded-full bg-[#1CB0F6]/15 dark:bg-[#1CB0F6]/10 blur-3xl" aria-hidden />
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-[#1CB0F6] flex items-center justify-center mb-4 border-2 border-b-4 border-[#1899D6]">
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
                  <div className="hidden sm:block rounded-xl bg-[#DDF4FF]/60 dark:bg-[#1CB0F6]/10 border border-[#1CB0F6]/30 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg bg-[#1CB0F6] flex items-center justify-center border-b-2 border-[#1899D6]">
                        <span className="text-white text-[11px] font-extrabold">12</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-extrabold text-[#3C3C3C] dark:text-stone-200 truncate">Knowledge Keeper III</p>
                        <div className="flex items-center gap-1">
                          <div className="flex-1 h-1.5 rounded-full bg-[#1CB0F6]/20 overflow-hidden">
                            <div className="h-full w-[42%] rounded-full bg-[#1CB0F6]" />
                          </div>
                          <span className="text-[8px] text-stone-500 dark:text-stone-400 font-bold tabular-nums">1,340 XP</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Streaks */}
              <div className="relative rounded-2xl border-2 border-b-4 border-[#D97F00] bg-white dark:bg-stone-900 p-5 sm:p-6 hover:-translate-y-1 transition-all overflow-hidden">
                <div className="pointer-events-none absolute -top-12 -right-12 w-36 h-36 rounded-full bg-[#FF9600]/15 dark:bg-[#FF9600]/10 blur-3xl" aria-hidden />
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-[#FF9600] flex items-center justify-center mb-4 border-2 border-b-4 border-[#D97F00]">
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
                  <div className="hidden sm:block rounded-xl bg-[#FFF4E0]/60 dark:bg-[#FF9600]/10 border border-[#FF9600]/30 p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl" aria-hidden>🔥</span>
                        <div>
                          <p className="text-lg font-extrabold text-[#FF9600]">14</p>
                          <p className="text-[10px] font-bold text-stone-500 dark:text-stone-400 -mt-0.5">day streak</p>
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                          <div
                            key={d + i}
                            className={`w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold ${
                              i < 6
                                ? 'bg-[#FF9600] text-white'
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
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E5F8D0]/80 dark:bg-[#58CC02]/15 text-[#58CC02] dark:text-[#58CC02] text-[10px] sm:text-xs font-extrabold uppercase tracking-wider border border-[#58CC02]/30">
                  <span aria-hidden>📚</span>
                  Daily Review in action
                </span>
              </div>
              <div className="relative group">
                <div className="absolute -inset-2 bg-[#58CC02]/20 rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-500" aria-hidden />
                <div className="relative rounded-2xl overflow-hidden border-2 border-b-4 border-[#46A302] dark:border-[#46A302] shadow-2xl">
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
                  <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#58CC02] flex items-center justify-center border-4 border-[#E5F8D0] dark:border-[#58CC02]/30" style={{ boxShadow: '0 0 20px rgba(88,204,2,0.3)' }}>
                    <span className="text-2xl sm:text-3xl font-extrabold text-white">7</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#58CC02] dark:text-[#58CC02] mb-0.5">
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
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[#58CC02] text-white font-extrabold text-sm border-2 border-b-4 border-[#46A302] hover:bg-[#46A302] active:border-b-2 active:translate-y-0.5 transition-all whitespace-nowrap"
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
        <div className="absolute inset-0 bg-[#f8fafc] dark:bg-[#0c0a09]" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-b from-[#f1f5f9] via-white to-[#f8fafc] dark:from-stone-950 dark:via-stone-950 dark:to-stone-900 pointer-events-none" aria-hidden />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_85%_55%_at_50%_-12%,rgba(91,33,182,0.08),transparent_55%)] dark:bg-[radial-gradient(ellipse_85%_50%_at_50%_-8%,rgba(109,40,217,0.12),transparent_58%)] pointer-events-none" aria-hidden />
        <div
          className="absolute inset-0 opacity-[0.4] dark:opacity-[0.15] pointer-events-none bg-[length:32px_32px] bg-[linear-gradient(to_right,rgba(148,163,184,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.07)_1px,transparent_1px)]"
          aria-hidden
        />
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <LandingScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
            <p className="text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.22em] text-[#FF9600] dark:text-[#FF9600] mb-3">
              Pricing
            </p>
            <div className="mx-auto mb-4 h-1 w-16 rounded-full bg-[#58CC02]" aria-hidden />
            <h2
              id="landing-pricing-heading"
              className="text-2xl sm:text-3xl lg:text-[2.35rem] font-extrabold text-[#3C3C3C] dark:text-stone-100 mb-4 tracking-tight leading-tight"
              style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
            >
              Simple, transparent pricing
            </h2>
            <p className="text-base sm:text-lg text-stone-600 dark:text-stone-400 leading-relaxed">
              Start free, upgrade when you need more analyses, citations, and study tools.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
            <div className="rounded-2xl border-2 border-b-4 border-[#E5E5E5] dark:border-stone-700 bg-white dark:bg-stone-900 p-6 sm:p-8 flex flex-col">
              <h3 className="font-semibold text-xl text-stone-900 dark:text-stone-100 mb-1">Free</h3>
              <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">Perfect for getting started</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-stone-900 dark:text-stone-50">$0</span>
                <span className="text-stone-500 dark:text-stone-400 ml-1">/month</span>
              </div>
              <ul className="space-y-2.5 mb-8 flex-1 text-sm sm:text-[0.9375rem] text-stone-600 dark:text-stone-400">
                <li className="flex gap-2">
                  <svg className="w-5 h-5 flex-shrink-0 text-[#58CC02] dark:text-[#58CC02] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>3 documents, 2 analyses, 2 study packs per month</span>
                </li>
                <li className="flex gap-2">
                  <svg className="w-5 h-5 flex-shrink-0 text-[#58CC02] dark:text-[#58CC02] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>5,000 words Paper Summarizer, 2 citation searches</span>
                </li>
                <li className="flex gap-2">
                  <svg className="w-5 h-5 flex-shrink-0 text-[#58CC02] dark:text-[#58CC02] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Focus Mode (3 blocked sites)</span>
                </li>
                <li className="flex gap-2">
                  <svg className="w-5 h-5 flex-shrink-0 text-[#58CC02] dark:text-[#58CC02] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Basic grammar and citation styles</span>
                </li>
              </ul>
              <button
                type="button"
                onClick={() => onNavigate('signup')}
                className="w-full py-3 px-6 rounded-2xl font-extrabold bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 text-[#3C3C3C] dark:text-stone-100 transition-colors border-2 border-b-4 border-[#E5E5E5] dark:border-stone-600 active:border-b-2 active:translate-y-0.5"
              >
                Start free
              </button>
            </div>

            <div className="relative rounded-2xl border-2 border-b-4 border-[#46A302] bg-white dark:bg-stone-900 p-6 sm:p-8 flex flex-col">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-[#58CC02] text-white px-3 py-1 rounded-full text-xs font-extrabold border-2 border-[#46A302]">
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
                  <svg className="w-5 h-5 flex-shrink-0 text-[#58CC02] dark:text-[#58CC02] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>99 combined analyses, study packs &amp; citations/mo</span>
                </li>
                <li className="flex gap-2">
                  <svg className="w-5 h-5 flex-shrink-0 text-[#58CC02] dark:text-[#58CC02] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>999,999 words Paper Summarizer; uploads up to 100MB</span>
                </li>
                <li className="flex gap-2">
                  <svg className="w-5 h-5 flex-shrink-0 text-[#58CC02] dark:text-[#58CC02] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Quiz, flashcards, crossword, Crater Blast &amp; Word Tower</span>
                </li>
                <li className="flex gap-2">
                  <svg className="w-5 h-5 flex-shrink-0 text-[#58CC02] dark:text-[#58CC02] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>All citation styles, PDF/Word export, unlimited Focus Mode sites</span>
                </li>
                <li className="flex gap-2">
                  <svg className="w-5 h-5 flex-shrink-0 text-[#58CC02] dark:text-[#58CC02] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Apply WriteScholar revisions into your draft</span>
                </li>
              </ul>
              <button
                type="button"
                onClick={() => onNavigate('pricing')}
                className="w-full py-3 px-6 rounded-2xl font-extrabold bg-[#58CC02] hover:bg-[#46A302] text-white border-2 border-b-4 border-[#46A302] active:border-b-2 active:translate-y-0.5 transition-colors"
              >
                View Pro pricing
              </button>
            </div>

            <div className="relative rounded-2xl border-2 border-b-4 border-[#D97F00] bg-[#FFF4E0]/50 dark:bg-[#FF9600]/10 p-6 sm:p-8 flex flex-col sm:col-span-2 lg:col-span-1">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-[#FF9600] text-white px-3 py-1 rounded-full text-xs font-extrabold border-2 border-[#D97F00]">
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
                  <svg className="w-5 h-5 flex-shrink-0 text-[#FF9600] dark:text-[#FF9600] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Everything in Pro</span>
                </li>
                <li className="flex gap-2">
                  <svg className="w-5 h-5 flex-shrink-0 text-[#FF9600] dark:text-[#FF9600] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>499 combined analyses, study packs &amp; citations/mo—ideal for citation-heavy work</span>
                </li>
                <li className="flex gap-2">
                  <svg className="w-5 h-5 flex-shrink-0 text-[#FF9600] dark:text-[#FF9600] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Summarise unlimited research papers; 1GB library storage</span>
                </li>
              </ul>
              <button
                type="button"
                onClick={() => onNavigate('pricing')}
                className="w-full py-3 px-6 rounded-2xl font-extrabold bg-[#FF9600] hover:bg-[#D97F00] text-white border-2 border-b-4 border-[#D97F00] active:border-b-2 active:translate-y-0.5 transition-colors"
              >
                View Premium pricing
              </button>
            </div>
          </div>

          <p className="text-center text-sm text-stone-500 dark:text-stone-500 mt-8 max-w-xl mx-auto">
            Free to start. Pro and Premium upgrades available with monthly or yearly billing.{' '}
            <button
              type="button"
              onClick={() => onNavigate('pricing')}
              className="text-[#1CB0F6] dark:text-[#1CB0F6] font-extrabold underline underline-offset-2 hover:text-[#1899D6] dark:hover:text-[#1899D6]"
            >
              Full pricing &amp; billing options
            </button>
          </p>
          </LandingScrollReveal>
        </div>
      </section>

      {/* FAQ — matches hero editorial theme */}
      <section className="relative py-16 sm:py-24 overflow-hidden border-t border-stone-200/90 dark:border-stone-800">
        <div className="absolute inset-0 bg-[#f8fafc] dark:bg-[#0c0a09]" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-b from-white via-[#f8fafc] to-[#f1f5f9] dark:from-stone-950 dark:via-stone-950 dark:to-stone-950 pointer-events-none" aria-hidden />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-15%,rgba(91,33,182,0.07),transparent_55%)] dark:bg-[radial-gradient(ellipse_90%_55%_at_50%_-10%,rgba(109,40,217,0.12),transparent_58%)] pointer-events-none" aria-hidden />
        <div
          className="absolute inset-0 opacity-[0.4] dark:opacity-[0.15] pointer-events-none bg-[length:32px_32px] bg-[linear-gradient(to_right,rgba(148,163,184,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.07)_1px,transparent_1px)]"
          aria-hidden
        />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <LandingScrollReveal>
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8 lg:gap-10 mb-10 sm:mb-14">
            <div className="text-center lg:text-left flex-1 max-w-2xl mx-auto lg:mx-0">
              <p className="text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.22em] text-[#1CB0F6] dark:text-[#1CB0F6] mb-3">
                Help
              </p>
              <div className="mx-auto lg:mx-0 mb-4 h-1 w-16 rounded-full bg-[#1CB0F6]" aria-hidden />
              <h2
                className="text-2xl sm:text-3xl lg:text-[2.35rem] font-extrabold text-[#3C3C3C] dark:text-stone-100 mb-4 tracking-tight leading-tight"
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
                className="rounded-2xl border-2 border-b-4 border-[#E5E5E5] dark:border-stone-700 bg-white dark:bg-stone-900 overflow-hidden transition-all duration-200 hover:border-[#1899D6] dark:hover:border-[#1899D6]"
              >
                <button
                  type="button"
                  onClick={() => setOpenFAQ(openFAQ === idx ? null : idx)}
                  className="w-full min-w-0 px-5 sm:px-6 py-4 sm:py-5 text-left flex items-center justify-between gap-3 sm:gap-4 hover:bg-stone-50/90 dark:hover:bg-stone-800/50 transition-colors duration-200"
                >
                  <span className="font-semibold text-stone-900 dark:text-stone-100 text-base sm:text-[1.05rem] leading-snug pr-2 min-w-0 flex-1 text-left">{faq.question}</span>
                  <svg
                    className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${openFAQ === idx ? 'rotate-180 text-[#1CB0F6] dark:text-[#1CB0F6]' : 'text-stone-400 dark:text-stone-500'}`}
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
              Join <span className="font-extrabold text-white">50,000+ students</span> earning XP, levelling up, and acing their coursework. Free to start — no payment today.
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

      <Footer onNavigate={onNavigate} />

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
    </>
  );
};

export default LandingPage;
