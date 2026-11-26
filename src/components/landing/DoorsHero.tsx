import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { trackEvent } from '../../utils/analytics';
import { TRY_BEFORE_SIGNUP } from '../../config/pricing';
import { hasPendingNotes, readAnswers, readDoor, rememberDoor, saveAnswer, stashLandingEssay, stashLandingTopic, takePendingNotes, type Door, type PackRequest } from '../../utils/tryFirst';
import { handOffEssayQuestion } from '../../utils/essayPlan';
import { ESSAY_FILE_ACCEPT, EssayFileError, readEssayFile } from '../../utils/readEssayFile';
import { stashWorkspaceView } from '../workspace/workspaceNavigate';
import HeroFeatureRow from './HeroFeatureRow';
import HeroEssayGrader, { countWords, type EssayFacts } from './HeroEssayGrader';
import DoorFlow, { type FlowAsk } from './DoorFlow';
import { BTN_GREEN, BTN_PURPLE, BTN_WHITE, FONT } from './webStyle';

interface DoorsHeroProps {
  /** True at 1280px and up: room for the corner tiles and the mascot. */
  wide: boolean;
  onNavigate: (page: string) => void;
  /** Exam door: a topic or notes are ready to become a study pack. */
  onPackSubmit: (req: PackRequest) => void;
  /** Essay door: the pasted essay is ready to grade. */
  onEssaySubmit: (text: string, facts: EssayFacts) => void;
  /** Essay text restored from an earlier visit. */
  restoredEssay?: string;
  /** Bump to return the essay box to its editable state. */
  resetSignal?: number;
  signedIn?: boolean;
}

const NOTES_MIN_WORDS = 50;
const NOTES_MAX_WORDS = 5000;
const TOPIC_MAX_CHARS = 200;
const TOPIC_EXAMPLES = ["Aristotle's ethics", 'Statistics 101', 'Cell respiration', 'The French Revolution'];

/** The strip under the box ("50,000+ students", "91% report better grades", "60 sec to your first grade"). Hidden until the numbers can be backed up. */
const SHOW_HERO_STATS = false;

/** Off: the two cards go straight to sign-up. On: the DoorFlow pop-up asks the free questions first. */
const QUESTIONS_FIRST = false;

/** The three things the landing box can start. */
type Ask = 'write' | 'exam' | 'grade';
const ASKS: Ask[] = ['write', 'exam', 'grade'];
const ASK: Record<Ask, { label: string; short: string; icon: string; field: string; placeholder: string; cta: string; examples: string[]; note: string }> = {
  write: {
    label: 'Write an essay',
    short: 'Essay',
    icon: '/icons/write.webp',
    field: 'Your essay question',
    placeholder: 'Paste your essay question here',
    cta: 'Start my essay',
    examples: ['Was the Treaty of Versailles too harsh?', 'Should social media be regulated?'],
    note: '',
  },
  exam: {
    label: 'Study for an exam',
    short: 'Exam',
    icon: '/icons/study-pack.webp',
    field: 'What the exam is on',
    placeholder: 'What is the exam on? A course, a chapter or one idea',
    cta: 'Make my pack',
    examples: ['Statistics 101', 'Cell respiration', 'The French Revolution'],
    note: '',
  },
  grade: {
    label: 'Grade my essay',
    short: 'Grade',
    icon: '/icons/grade-essay.webp',
    field: 'Your essay',
    placeholder: 'Paste your essay here, or upload the file',
    cta: 'Grade my essay',
    examples: [],
    note: 'An estimated grade, every rubric score and what to fix first. PDF or Word, or paste it.',
  },
};

/** A corner tile: real product media in a white card with a gold lip. */
function Tile({ label, position, tilt, delay, onClick, isNew = false, children }: { label: string; position: string; tilt: string; delay: string; onClick: () => void; isNew?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${label}: get started`}
      className={`group pointer-events-auto absolute block w-[12rem] cursor-pointer border-0 bg-transparent p-0 text-left hover:z-30 motion-safe:animate-[hero-tile-drift_8.5s_ease-in-out_infinite] xl:w-[13.5rem] min-[1400px]:w-[14.5rem] ${position}`}
      style={{ animationDelay: delay }}
    >
      {/* Hovering a tile enlarges it a little so the product is easier to see. */}
      <div className="transition-transform duration-200 ease-out group-hover:scale-[1.3] motion-reduce:transition-none">
      <figure className={`m-0 overflow-hidden rounded-[20px] border-[3px] border-b-[6px] border-[#FFC800] bg-white shadow-[0_20px_46px_-12px_rgba(255,200,0,0.55)] ${tilt}`}>
        <div className="relative aspect-[16/10] w-full bg-[#1C1030]">{children}</div>
        <figcaption className="border-t-2 border-[#FFF1B8] px-3 py-1.5 text-center text-[13px] font-black text-[#3C3C3C]">
          {label}
          {isNew && <span className="ml-1.5 rounded-full bg-[#FFC800] px-2 py-px align-[1px] text-[10px] font-black text-[#3A2A00]">New</span>}
        </figcaption>
      </figure>
      </div>
    </button>
  );
}

const media = 'absolute inset-0 h-full w-full object-cover';

/**
 * The landing hero: one headline, one line, and one box that starts any of
 * the three jobs (write an essay, study for an exam, grade an essay), then
 * the stats and the six feature icons, with four tilted product tiles at
 * the sides. What is typed in the box is kept through sign-up.
 *
 * The two buttons are the two doors. "Study for an exam" opens the topic
 * box and "Grade my essay" opens the essay box, each in a pop-up, so the
 * hero itself stays clean. Either result is made before any account is
 * asked for (TryFlow, in LandingPage).
 */
export default function DoorsHero({ wide, onNavigate, onPackSubmit, onEssaySubmit, restoredEssay = '', resetSignal = 0, signedIn = false }: DoorsHeroProps) {
  /** Which door's box is open in the pop-up (null = closed). */
  const [open, setOpen] = useState<Door | null>(() => {
    try {
      const fromUrl = new URLSearchParams(window.location.search).get('door');
      if (TRY_BEFORE_SIGNUP && (fromUrl === 'essay' || fromUrl === 'exam')) return fromUrl;
    } catch { /* ignore */ }
    // Text carried over from a free tool, or an essay restored after a
    // failed sign-in, goes straight back into its box.
    if (hasPendingNotes()) return 'exam';
    if (restoredEssay) return 'essay';
    return null;
  });

  /** The essay door, knowing where the essay is: not started opens Start an essay, a draft opens the grader. */
  const openEssay = (stage: 'start' | 'draft') => {
    saveAnswer({ stage });
    if (stage === 'start' && !TRY_BEFORE_SIGNUP) stashWorkspaceView('write');
    openDoor('essay');
  };

  /** The landing box: which job it is set to, and what is typed for each. */
  const [ask, setAsk] = useState<Ask>(() => {
    const d = readDoor();
    if (d === 'exam') return 'exam';
    if (d === 'essay' && readAnswers().stage === 'draft') return 'grade';
    return 'write';
  });
  const [asks, setAsks] = useState<Record<Ask, string>>({ write: '', exam: '', grade: '' });
  const [askHint, setAskHint] = useState('');
  const [askShake, setAskShake] = useState(false);
  /** An essay typed in the box, for the grader pop-up when results come before sign-up. */
  const [gradeSeed, setGradeSeed] = useState('');
  const askRef = useRef<HTMLTextAreaElement | null>(null);
  const askText = asks[ask];
  /** Grade mode: an essay read from a file. */
  const [essayFile, setEssayFile] = useState<string | null>(null);
  const [essayReading, setEssayReading] = useState(false);
  const [essayDrag, setEssayDrag] = useState(false);
  const essayFileRef = useRef<HTMLInputElement | null>(null);
  const essayWords = ask === 'grade' ? (askText.trim() ? askText.trim().split(/\s+/).length : 0) : 0;

  const loadEssayFile = async (file: File) => {
    if (essayReading) return;
    setEssayReading(true);
    setAskHint('');
    try {
      const text = await readEssayFile(file);
      setAsks((all) => ({ ...all, grade: text }));
      setEssayFile(file.name);
      trackEvent('essay_pasted', { words: text.split(/\s+/).length, source: 'file', where: 'hero_box' });
    } catch (e) {
      setAskHint(e instanceof EssayFileError ? e.message : 'We could not read that file. Paste the text instead.');
    } finally {
      setEssayReading(false);
    }
  };

  const pickAsk = (next: Ask) => {
    setAsk(next);
    setAskHint('');
    window.setTimeout(() => askRef.current?.focus(), 30);
  };
  const nudgeAsk = (message: string) => {
    setAskHint(message);
    setAskShake(true);
    window.setTimeout(() => setAskShake(false), 460);
    askRef.current?.focus();
  };
  const next = signedIn ? 'dashboard' : 'signup';
  /** The pop-up that asks the free questions before sign-up (DoorFlow). */
  const [flow, setFlow] = useState<{ ask: FlowAsk; value: string } | null>(null);

  /** Keep what was typed, then on to sign-up (or the account), opening on the right screen. */
  const submitAsk = () => {
    const value = askText.trim();
    if (ask === 'write' && value.length < 12) { nudgeAsk('Paste your essay question first.'); return; }
    if (ask === 'exam' && value.length < 2) { nudgeAsk('Type what the exam is on first, for example "Statistics 101".'); return; }
    setAskHint('');
    trackEvent('door_selected', { door: ask === 'exam' ? 'exam' : 'essay', source: 'hero_box', ask, typed: value.length > 0 });
    if (!TRY_BEFORE_SIGNUP) { setFlow({ ask, value }); return; }

    if (ask === 'write') {
      // Start an essay opens with the question in and goes straight to its questions.
      handOffEssayQuestion(value, 1500);
      saveAnswer({ stage: 'start' });
      rememberDoor('essay');
      stashWorkspaceView('write');
      onNavigate(next);
      return;
    }
    if (ask === 'exam') {
      if (TRY_BEFORE_SIGNUP) { onPackSubmit({ inputType: 'topic', input: value.slice(0, TOPIC_MAX_CHARS) }); return; }
      stashLandingTopic(value.slice(0, TOPIC_MAX_CHARS));
      rememberDoor('exam');
      onNavigate(next);
      return;
    }
    if (TRY_BEFORE_SIGNUP) { setGradeSeed(value); rememberDoor('essay'); setOpen('essay'); return; }
    if (value) stashLandingEssay(value);
    saveAnswer({ stage: 'draft' });
    rememberDoor('essay');
    if (signedIn) stashWorkspaceView('analyze');
    onNavigate(next);
  };

  /** The two landing cards (and the tiles): remember the door, go to sign-up, and the dashboard opens on that side. */
  const startDoor = (door: Door, where: string) => {
    rememberDoor(door);
    if (door === 'essay') {
      if (readAnswers().stage !== 'draft') saveAnswer({ stage: 'start' });
      stashWorkspaceView('write');
    }
    trackEvent('door_selected', { door, source: where });
    onNavigate(signedIn ? 'dashboard' : 'signup');
  };

  const openDoor = (door: Door) => {
    rememberDoor(door);
    trackEvent('door_selected', { door });
    if (!TRY_BEFORE_SIGNUP) {
      if (QUESTIONS_FIRST) setFlow({ ask: door === 'exam' ? 'exam' : readAnswers().stage === 'draft' ? 'grade' : 'write', value: '' });
      else startDoor(door, 'tile');
      return;
    }
    setOpen(door);
  };

  // Other parts of the page ("start free" buttons, essay sections) can ask for a door.
  useEffect(() => {
    const onDoor = (e: Event) => {
      const want = (e as CustomEvent<{ door?: Door }>).detail?.door;
      const door = want === 'essay' || want === 'exam' ? want : readDoor() ?? 'exam';
      if (!TRY_BEFORE_SIGNUP) {
        if (want) rememberDoor(door);
        if (QUESTIONS_FIRST) setFlow({ ask: door === 'exam' ? 'exam' : readAnswers().stage === 'draft' ? 'grade' : 'write', value: '' });
        else startDoor(door, 'page_button');
        return;
      }
      setOpen(door);
    };
    window.addEventListener('writescholar-hero-door', onDoor);
    return () => window.removeEventListener('writescholar-hero-door', onDoor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIn]);

  // Sections further down ("Start an essay", "Make a study pack") take people to sign-up on the right side.
  useEffect(() => {
    const onAsk = (e: Event) => {
      const want = (e as CustomEvent<{ ask?: Ask }>).detail?.ask;
      if (want === 'grade') saveAnswer({ stage: 'draft' });
      startDoor(want === 'exam' ? 'exam' : 'essay', 'page_section');
    };
    window.addEventListener('writescholar-hero-ask', onAsk);
    return () => window.removeEventListener('writescholar-hero-ask', onAsk);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIn]);

  // Pop-up: Escape closes it, and the page behind does not scroll.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(null); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focus = window.setTimeout(() => {
      document.getElementById(open === 'exam' ? 'hero-topic' : 'hero-essay')?.focus();
    }, 60);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      window.clearTimeout(focus);
    };
  }, [open]);

  return (
    <section className="landing-hero-zoom relative flex flex-col overflow-hidden bg-[#E7D6F3] text-white" style={FONT}>
      {/* Purple ground, two flat discs, then a fade into the lilac of the next section. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#A863EA] via-[#8E48CF] via-[38%] to-[#5E1F96]" />
        <div className="absolute left-1/2 top-[400px] h-[1100px] w-[1100px] -translate-x-1/2 rounded-full bg-[#8A45C8] md:top-[310px] lg:top-[340px]" />
        <div className="absolute left-1/2 top-[520px] h-[760px] w-[760px] -translate-x-1/2 rounded-full bg-[#9652D3] md:top-[430px] lg:top-[460px]" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(to_bottom,rgba(231,214,243,0)_0%,rgba(231,214,243,0)_40%,rgba(231,214,243,0.18)_62%,rgba(231,214,243,0.55)_82%,#E7D6F3_100%)] sm:h-28 lg:h-32" />
      </div>

      <div className="relative z-10 px-4 pb-4 pt-20 sm:px-6 sm:pb-0 sm:pt-24 lg:px-8 lg:pt-24">
        {/* Trust pill, as on the previous purple hero. */}
        <p className="absolute left-1/2 top-8 z-20 sm:top-10 lg:top-12 m-0 inline-flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full border-2 border-b-[3px] border-stone-300 bg-white py-0.5 pl-1 pr-2.5 shadow-[0_8px_20px_-8px_rgba(0,0,0,0.32)] sm:gap-2 sm:py-1 sm:pr-3">
          <span aria-hidden className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-b-[3px] border-[#46A302] bg-[#58CC02] shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] sm:h-6 sm:w-6">
            <svg className="h-2.5 w-2.5 text-white sm:h-3 sm:w-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
            </svg>
          </span>
          <span className="text-[10.5px] font-extrabold tracking-tight text-stone-800 sm:text-[12px]">
            Trusted by <span className="tabular-nums text-[#58CC02]">50,000+</span> students worldwide
          </span>
        </p>

        <div className="relative mx-auto w-full max-w-[1400px] px-0 pb-2 sm:px-2 sm:pb-3">
          {/* Product tiles. The top pair sit beside the headline from 1024px; the lower pair need the width beside the box. */}
          <div className="pointer-events-none hidden lg:block">
            <Tile label="Essay Writer" isNew onClick={() => openEssay('start')} position="left-0 -top-4 xl:left-2 xl:-top-6" tilt="-rotate-[4deg]" delay="0s">
              <img src="/hero-tiles/essay-writer.webp" alt="" loading="eager" decoding="async" className={`${media} object-right-top`} />
            </Tile>
            <Tile label="Notes to Quiz" onClick={() => openDoor('exam')} position="right-0 -top-4 xl:right-2 xl:-top-6" tilt="rotate-[4deg]" delay="1.6s">
              <video src="/hero-quiz-new.mp4" poster="/hero-tiles/quiz-new.webp" autoPlay muted loop playsInline preload="metadata" className={`${media} object-top`} />
            </Tile>
          </div>
          <div className="pointer-events-none hidden xl:block">
            <Tile label="Essay Analyzer" onClick={() => openEssay('draft')} position="left-0 top-[324px] min-[1400px]:left-2" tilt="rotate-[4deg]" delay="2.4s">
              <img src="/hero-tiles/sentence-notes.webp" alt="" loading="lazy" decoding="async" className={`${media} object-right-top`} />
            </Tile>
            <Tile label="Notes to Flashcards" onClick={() => openDoor('exam')} position="right-0 top-[324px] min-[1400px]:right-2" tilt="-rotate-[4deg]" delay="0.8s">
              <video src="/hero-flashcards-new.mp4" poster="/hero-tiles/flashcards-new.webp" autoPlay muted loop playsInline preload="metadata" className={media} />
            </Tile>
          </div>

        <div className="relative mx-auto flex w-full max-w-[48rem] flex-col items-center text-center opacity-0 animate-hero-card-enter">
          <h1 className="m-0 w-full font-black leading-[0.98] tracking-[-0.035em]">
            <span className="block whitespace-nowrap text-[1.85rem] min-[390px]:text-[2rem] sm:text-[2.75rem] md:text-[3rem] lg:text-[3.55rem] xl:text-[4.15rem]">
              Turn your grades from
            </span>
            <span className="relative mt-1 inline-block whitespace-nowrap text-[2.55rem] text-[#FFD84D] min-[390px]:text-[2.8rem] sm:mt-2 sm:text-[3.7rem] md:text-[4rem] lg:text-[4.7rem] xl:text-[5.4rem]">
              B to{' '}
              <span
                className="relative inline-flex h-[0.95em] w-[0.95em] items-center justify-center rounded-2xl border-2 border-b-[5px] border-[#46A302] bg-[#58CC02] align-baseline font-extrabold leading-none text-white shadow-[0_10px_30px_-4px_rgba(88,204,2,0.75)] ring-4 ring-white/20 motion-safe:animate-[hero-a-wiggle_4.5s_ease-in-out_infinite]"
                style={{ verticalAlign: '-0.06em' }}
                aria-hidden
              >
                A
                <span className="absolute -right-1.5 -top-1.5 text-[0.28em] text-[#FFC800] motion-safe:animate-pulse" aria-hidden>✦</span>
              </span>
              <span className="sr-only">A with WriteScholar</span>
              <svg className="absolute -bottom-2 left-0 h-3 w-full text-[#FFC800] sm:-bottom-3 sm:h-5" viewBox="0 0 300 18" preserveAspectRatio="none" aria-hidden>
                <path d="M4 12 C 80 2, 200 2, 296 10" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
              </svg>
            </span>
          </h1>

          <h2 className="m-0 mt-8 max-w-[40rem] text-base font-semibold leading-snug text-white sm:mt-10 sm:text-lg lg:text-[1.15rem]">
            <span className="font-extrabold">WriteScholar</span> the all-in-one AI study system to{' '}
            <span className="font-extrabold text-[#FFC800]">study for any exam</span>,{' '}
            <span className="font-extrabold text-[#FFC800]">write better essays</span>, and{' '}
            <span className="font-extrabold text-[#FFC800]">get higher grades</span>.
          </h2>

          {/* Two doors: no box, no questions. One tap to sign-up; the dashboard opens on the right side. */}
          <div className="mt-6 grid w-full grid-cols-1 gap-3 text-left text-[#1C1917] sm:mt-7 sm:grid-cols-2 sm:gap-3.5">
            {([
              { door: 'essay' as const, title: 'I have an essay', body: 'Write it with help on every paragraph, or paste a draft to get graded.', cta: 'Write or grade my essay', icon: '/icons/write.webp', btn: BTN_GREEN },
              { door: 'exam' as const, title: 'I have an exam', body: 'Get flashcards, a practice quiz and study games for any topic.', cta: 'Study for my exam', icon: '/icons/study-pack.webp', btn: BTN_PURPLE },
            ]).map((d) => (
              <div key={d.door} className="flex flex-col gap-2 rounded-[22px] border-b-[5px] border-[#D9C2F2] bg-white p-3.5 shadow-[0_26px_44px_-22px_rgba(42,21,64,0.55)] transition-transform duration-200 hover:-translate-y-1 sm:p-4">
                <div className="flex items-center gap-2.5">
                  <img src={d.icon} alt="" width={44} height={44} className="h-11 w-11 shrink-0 object-contain" />
                  <h3 className="m-0 text-[20px] font-black leading-tight sm:text-[21px]">{d.title}</h3>
                </div>
                <p className="m-0 text-[14px] font-bold leading-snug text-[#57534E] sm:text-[14.5px]">{d.body}</p>
                <button type="button" onClick={() => startDoor(d.door, 'hero_card')} className={`group/btn min-h-[50px] w-full px-4 text-[16px] sm:text-[16.5px] ${d.btn}`}>
                  {d.cta}
                  <svg className="h-[18px] w-[18px] transition-transform group-hover/btn:translate-x-1" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" /></svg>
                </button>
              </div>
            ))}
          </div>
          <p className="m-0 mt-2.5 text-[12.5px] font-bold text-[#EBDDFB] sm:text-[13px]">
            Free account, about 30 seconds. No card needed.
          </p>

          {/* Stats strip. */}
          {SHOW_HERO_STATS && (
          <div className="mt-7 flex w-full flex-col items-center gap-y-1 sm:mt-10 sm:w-max sm:flex-row sm:justify-center sm:gap-x-5 sm:gap-y-0">
            <div className="flex items-center justify-center gap-x-2.5 min-[380px]:gap-x-3 sm:gap-x-5">
              {[
                { value: '50,000+', label: 'students worldwide' },
                { value: '91%', label: 'report better grades' },
              ].map((s, i) => (
                <div key={s.value} className={`flex shrink-0 items-baseline gap-1 whitespace-nowrap sm:gap-1.5 ${i > 0 ? 'border-l-2 border-white/25 pl-2.5 min-[380px]:pl-3 sm:pl-5' : ''}`}>
                  <span className="text-[15px] font-black tabular-nums tracking-tight text-white sm:text-[1.15rem]">{s.value}</span>
                  <span className="text-[10.5px] font-bold text-[#EBDDFB] sm:text-[12px]">{s.label}</span>
                </div>
              ))}
            </div>
            <div className="flex shrink-0 items-baseline justify-center gap-1 whitespace-nowrap sm:gap-1.5 sm:border-l-2 sm:border-white/25 sm:pl-5">
              <span className="text-[15px] font-black tabular-nums tracking-tight text-white sm:text-[1.15rem]">60 sec</span>
              <span className="text-[10.5px] font-bold text-[#EBDDFB] sm:text-[12px]">to your first grade</span>
            </div>
          </div>
          )}
        </div>

        {/* The six things it does. */}
        <div className="relative z-10 mx-auto mt-6 w-full max-w-5xl px-4 pb-16 sm:mt-9 sm:pb-20 lg:pb-24">
          <HeroFeatureRow onPick={openDoor} />
        </div>
        </div>
      </div>

      {flow && <DoorFlow ask={flow.ask} initial={flow.value} signedIn={signedIn} onClose={() => setFlow(null)} onNavigate={onNavigate} />}
      {open && (
        <div className="fixed inset-0 z-[220] overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="hero-door-title">
          <div className="absolute inset-0 min-h-full bg-[#2A1540]/80" onClick={() => setOpen(null)} aria-hidden />
          <div className="relative flex min-h-full items-center justify-center p-3 sm:p-6">
            <div className="relative w-full max-w-[820px]">
              <div className="mb-3 flex items-center gap-3 sm:mb-4">
                <img src={open === 'exam' ? '/mascot-study-still.webp' : '/mascot-paper-still.webp'} alt="" width={72} height={72} className="h-14 w-14 shrink-0 object-contain sm:h-[72px] sm:w-[72px]" />
                <div className="min-w-0 flex-1">
                  <h2 id="hero-door-title" className="m-0 text-[22px] font-black leading-tight text-white sm:text-[28px]">
                    {open === 'exam' ? 'Study for any exam in minutes' : 'See what grade your essay would get'}
                  </h2>
                  <p className="m-0 mt-0.5 text-[13.5px] font-bold text-[#EBDDFB] sm:text-[15px]">
                    {open === 'exam'
                      ? (TRY_BEFORE_SIGNUP ? 'Flashcards, a practice quiz and study games, built for your topic. No sign-up to see it.' : 'Flashcards, a practice quiz and study games, built for your topic.')
                      : 'An estimated grade, every rubric score and line-by-line comments in about a minute.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(null)}
                  aria-label="Close"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-b-4 border-stone-300 bg-white text-[#57534E] hover:bg-[#FBF8FF]"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden><path d="M6 6l12 12M18 6L6 18" /></svg>
                </button>
              </div>

              <div role="tablist" aria-label="What do you need help with" className="mb-3 grid grid-cols-2 gap-1.5 rounded-[18px] bg-[#4A1778] p-1.5 sm:inline-grid">
                <DoorTab active={open === 'exam'} onClick={() => openDoor('exam')} label="Study for an exam">
                  <rect x="3" y="6" width="14" height="12" rx="2" /><path d="M7 3h12a2 2 0 0 1 2 2v10" />
                </DoorTab>
                <DoorTab active={open === 'essay'} onClick={() => openDoor('essay')} label="Grade my essay">
                  <path d="M6 3h9l4 4v14H6z" /><path d="M9 12h7M9 16h5" />
                </DoorTab>
              </div>

              {open === 'exam' ? (
                <TopicBox onSubmit={(req) => { setOpen(null); onPackSubmit(req); }} />
              ) : (
                <HeroEssayGrader onSubmit={(text, facts) => { setOpen(null); onEssaySubmit(text, facts); }} initialText={gradeSeed || restoredEssay} resetSignal={resetSignal} instant />
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function DoorTab({ active, onClick, label, children }: { active: boolean; onClick: () => void; label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[13px] px-2 text-[14.5px] font-black leading-tight transition-colors min-[390px]:text-[15.5px] sm:gap-2.5 sm:px-5 sm:text-[16px] ${
        active ? 'bg-white text-[#1C1917] shadow-[0_6px_14px_-6px_rgba(0,0,0,0.5)]' : 'text-white hover:bg-[#5F2594]'
      }`}
    >
      <svg className="hidden h-5 w-5 shrink-0 min-[390px]:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {children}
      </svg>
      {label}
    </button>
  );
}

/**
 * The exam door's box. One line is enough: a course, a chapter or one
 * idea. Notes are optional and make every question come from the
 * student's own course. Reads a dropped .docx or .txt in the browser.
 */
export function TopicBox({ onSubmit, idPrefix = 'hero', flat = false, initialTopic = '' }: {
  onSubmit: (req: PackRequest) => void;
  /** A topic to start with (one typed on the landing page before sign-up). */
  initialTopic?: string;
  /** Keeps field ids unique when the box appears twice on one page. */
  idPrefix?: string;
  /** A quieter card for use on a light page, without the deep hero shadow. */
  flat?: boolean;
}) {
  const [topic, setTopic] = useState(initialTopic);
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [hint, setHint] = useState('');
  const [shake, setShake] = useState(false);
  const topicRef = useRef<HTMLInputElement | null>(null);
  const notesRef = useRef<HTMLTextAreaElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  // Notes carried over from a free tool (ToolNextStep) arrive filled in.
  useEffect(() => {
    if (idPrefix !== 'hero') return;
    const carried = takePendingNotes();
    if (carried) {
      setNotes(carried);
      setNotesOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const noteWords = useMemo(() => countWords(notes), [notes]);
  const usingNotes = notesOpen && noteWords > 0;

  const nudge = (message: string, focus: 'topic' | 'notes') => {
    setHint(message);
    setShake(true);
    window.setTimeout(() => setShake(false), 460);
    (focus === 'topic' ? topicRef.current : notesRef.current)?.focus();
  };

  const submit = () => {
    if (reading) return;
    if (usingNotes) {
      if (noteWords < NOTES_MIN_WORDS) {
        nudge(`Add at least ${NOTES_MIN_WORDS} words of notes. You have ${noteWords} so far.`, 'notes');
        return;
      }
      if (noteWords > NOTES_MAX_WORDS) {
        nudge(`Notes can be up to ${NOTES_MAX_WORDS.toLocaleString()} words here and yours have ${noteWords.toLocaleString()}. Use one lecture or chapter.`, 'notes');
        return;
      }
      setHint('');
      onSubmit({ inputType: 'notes', input: notes.trim() });
      return;
    }
    const value = topic.trim();
    if (value.length < 2) {
      nudge('Type what the exam is on first, for example "Statistics 101".', 'topic');
      return;
    }
    setHint('');
    onSubmit({ inputType: 'topic', input: value.slice(0, TOPIC_MAX_CHARS) });
  };

  const readFile = async (file: File) => {
    const lower = (file.name || '').toLowerCase();
    setHint('');
    if (file.size > 8 * 1024 * 1024) {
      setHint('That file is over 8MB. Paste the text instead.');
      return;
    }
    setReading(true);
    try {
      let content = '';
      if (lower.endsWith('.docx')) {
        const mammoth = (await import('mammoth')).default;
        content = (await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })).value || '';
      } else if (lower.endsWith('.txt') || lower.endsWith('.md') || file.type.startsWith('text/')) {
        content = await file.text();
      } else if (lower.endsWith('.pdf')) {
        setHint('PDFs can be uploaded once you are signed in. For now, copy the text and paste it here.');
        return;
      } else {
        setHint('Add a .docx or .txt file, or paste the text.');
        return;
      }
      content = content.replace(/\r\n/g, '\n').trim();
      if (!content) {
        setHint('That file looks empty. Paste the text instead.');
        return;
      }
      setNotes(content);
      setFileName(file.name.replace(/\.(docx|txt|md)$/i, ''));
      setNotesOpen(true);
    } catch {
      setHint('We could not read that file. Paste the text instead.');
    } finally {
      setReading(false);
    }
  };

  return (
    <div className={`w-full rounded-[28px] bg-white p-3.5 text-left text-[#1C1917] sm:p-5 ${
      flat
        ? 'border border-[#E4D4F8] shadow-[0_2px_4px_rgba(60,40,90,0.04),0_22px_50px_-34px_rgba(90,45,140,0.55)]'
        : 'border-b-[6px] border-[#D9C2F2] shadow-[0_30px_50px_-22px_rgba(42,21,64,0.55)]'
    }`}>
      <label htmlFor={`${idPrefix}-topic`} className="block px-1 text-[17px] font-black sm:text-[18px]">What is the exam on?</label>

      <div className="mt-2.5 flex flex-col gap-3 sm:flex-row">
        <div className={`min-w-0 flex-1 ${topic === '' && !usingNotes ? 'ws-box-glow' : ''}`}>
          <input
            ref={topicRef}
            id={`${idPrefix}-topic`}
            type="text"
            value={topic}
            maxLength={TOPIC_MAX_CHARS}
            onChange={(e) => { setTopic(e.target.value); if (hint) setHint(''); }}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
            placeholder="A course, a chapter or one idea"
            autoComplete="off"
            className="block min-h-[62px] w-full rounded-[18px] border-2 border-[#DCC3F6] bg-[#FBF8FF] px-4 text-[18px] font-extrabold text-[#1C1917] placeholder:font-bold placeholder:text-[#8A8580] focus:border-[#A560E8] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#A560E8]/25 sm:px-5 sm:text-[19px]"
          />
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={reading}
          aria-describedby={hint ? `${idPrefix}-topic-hint` : undefined}
          className={`group/btn min-h-[62px] shrink-0 px-7 text-[18px] sm:text-[19px] ${BTN_GREEN} ${shake ? 'ws-shake' : ''}`}
        >
          Make my study pack
          <svg className="h-5 w-5 transition-transform group-hover/btn:translate-x-1" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 px-1">
        <span className="text-[13.5px] font-black text-[#57534E]">Try</span>
        {TOPIC_EXAMPLES.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => { setTopic(example); setHint(''); topicRef.current?.focus(); }}
            className="inline-flex min-h-[44px] items-center rounded-full border-2 border-b-4 border-[#E4D4F8] bg-[#F7F1FF] px-3.5 text-[14px] font-extrabold text-[#1C1917] transition-all hover:-translate-y-0.5 hover:border-[#C9A0F0] active:translate-y-0.5 active:border-b-2"
          >
            {example}
          </button>
        ))}
      </div>

      {hint && (
        <p id={`${idPrefix}-topic-hint`} role="alert" className="mt-3 flex items-start gap-2 rounded-2xl border border-[#F3D9A8] bg-[#FFF4E5] px-3.5 py-2.5 text-[13.5px] font-extrabold leading-snug text-[#9A3412]">
          <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="12" cy="12" r="9" /><path d="M12 7v6M12 16.5v.5" /></svg>
          {hint}
        </p>
      )}

      <input
        ref={fileRef}
        type="file"
        accept=".docx,.txt,.md,text/plain"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) void readFile(f); e.currentTarget.value = ''; }}
      />

      {notesOpen ? (
        <div className="mt-3 rounded-[20px] border-2 border-dashed border-[#C9A0F0] bg-[#FBF8FF] p-3 sm:p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2 px-1">
            <label htmlFor={`${idPrefix}-notes`} className="text-[15px] font-black">Your notes or slides</label>
            <span className={`text-[13px] font-extrabold tabular-nums ${noteWords >= NOTES_MIN_WORDS && noteWords <= NOTES_MAX_WORDS ? 'text-[#3A8A00]' : 'text-[#57534E]'}`}>
              {noteWords === 0 ? `${NOTES_MIN_WORDS} to ${NOTES_MAX_WORDS.toLocaleString()} words` : `${noteWords.toLocaleString()} words${fileName ? ` · ${fileName}` : ''}`}
            </span>
          </div>
          <textarea
            ref={notesRef}
            id={`${idPrefix}-notes`}
            value={notes}
            onChange={(e) => { setNotes(e.target.value); if (fileName) setFileName(null); if (hint) setHint(''); }}
            placeholder="Paste one lecture or one chapter. Every question will come from this."
            rows={5}
            spellCheck={false}
            className="mt-2 block min-h-[8.5rem] w-full resize-y rounded-2xl border-2 border-[#DCC3F6] bg-white px-4 py-3 text-[15px] font-semibold leading-relaxed text-[#1C1917] placeholder:text-[#8A8580] focus:border-[#A560E8] focus:outline-none focus:ring-4 focus:ring-[#A560E8]/25"
          />
          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2">
            <button type="button" onClick={() => fileRef.current?.click()} disabled={reading} className={`min-h-[48px] px-4 text-[15px] ${BTN_WHITE}`}>
              <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={2.6} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4M7 9l5-5 5 5M4 20h16" /></svg>
              {reading ? 'Reading…' : 'Upload .docx or .txt'}
            </button>
            <button
              type="button"
              onClick={() => { setNotesOpen(false); setNotes(''); setFileName(null); setHint(''); }}
              className="inline-flex min-h-[44px] items-center text-[14px] font-extrabold text-[#57534E] underline decoration-2 underline-offset-[3px] hover:text-[#1C1917]"
            >
              Use a topic instead
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-[20px] border-2 border-dashed border-[#C9A0F0] bg-[#FBF8FF] px-3.5 py-3 sm:px-4">
          <svg className="h-[22px] w-[22px] shrink-0 text-[#7733B5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M6 3h9l4 4v14H6z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></svg>
          <p className="m-0 min-w-0 flex-1 basis-[240px] text-[14.5px] font-extrabold leading-snug">
            Have notes or slides? Add them and every question comes from your course.{' '}
            <span className="font-bold text-[#57534E]">Optional.</span>
          </p>
          <button
            type="button"
            onClick={() => { setNotesOpen(true); window.setTimeout(() => notesRef.current?.focus(), 40); }}
            className={`min-h-[48px] px-4 text-[15px] ${BTN_WHITE}`}
          >
            <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={2.6} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4M7 9l5-5 5 5M4 20h16" /></svg>
            Add my notes
          </button>
        </div>
      )}
    </div>
  );
}
