/**
 * Copy and branching for the question-by-question onboarding.
 *
 * The iOS app mirrors this file in
 * ios/WriteScholar/WriteScholar/Onboarding/OnboardingContent.swift —
 * change both together so the website and the app ask the same things.
 *
 * Answer ids are also the allowlist in POST /api/users/onboarding-survey.
 */

export type Path = 'essay' | 'exam' | 'both';

export interface OnboardingOption {
  id: string;
  label: string;
  sub?: string;
  /** Short badge in the option's square (grades, confidence 1–5). */
  badge?: string;
  /** What Scholar says when this is picked. */
  reply?: string;
}

export interface OnboardingQuestion {
  key: keyof OnboardingAnswers;
  multi?: boolean;
  eyebrow: string;
  title: string;
  /** Scholar's line before anything is picked. */
  prompt: string;
  options: OnboardingOption[];
}

export interface OnboardingAnswers {
  level?: string;
  pressure?: Path;
  current?: string;
  target?: string;
  confidence?: string;
  struggles?: string[];
  deadline?: string;
  life?: string[];
  source?: string;
}

export const TRIAL_CREDITS = 3;
export const PRO_MONTHLY_CREDITS = 99;
export const PREMIUM_MONTHLY_CREDITS = 199;
export const CREDIT_CAP = 499;

export const QUESTIONS: OnboardingQuestion[] = [
  {
    key: 'level',
    eyebrow: 'About you',
    title: 'Where are you in school right now?',
    prompt: "Let's get to know you. No wrong answers here!",
    options: [
      { id: 'underclass', label: 'College: freshman or sophomore', reply: "New classes, new professors, new expectations. We've got you." },
      { id: 'upperclass', label: 'College: junior or senior', reply: 'The classes that count toward your GPA the most. Let us help.' },
      { id: 'masters', label: "Master's program", reply: 'Grad school raises the bar, so our feedback does too.' },
      { id: 'other', label: 'PhD, community college or other', reply: 'Whatever the program, every paper still counts.' },
    ],
  },
  {
    key: 'pressure',
    eyebrow: 'What brought you here',
    title: "What's weighing on you most right now?",
    prompt: 'Be honest. This decides where we start.',
    options: [
      { id: 'essay', label: 'Essays & papers', sub: 'Drafts, deadlines, not knowing what your professor wants', reply: "Got it. You'll see your grade before you submit, not after." },
      { id: 'exam', label: 'Exams & studying', sub: 'Too much to remember, not enough time', reply: "Got it. We'll turn your notes into something that sticks." },
      { id: 'both', label: 'Honestly, both', sub: "It's all piling up at once", reply: "That's a lot to carry. Let's take some of it off you." },
    ],
  },
  {
    key: 'current',
    eyebrow: 'Where you are now',
    title: 'What grades do you usually get on papers?',
    prompt: 'Closest match is fine.',
    options: [
      { id: 'A', badge: 'A', label: "Mostly A's", sub: 'Around a 3.7+ GPA', reply: "Strong already! We'll help you stay there with less stress." },
      { id: 'B', badge: 'B', label: "Mostly B's", sub: 'Around a 3.0–3.6 GPA', reply: "B's mean you're close. It's usually a few fixable things." },
      { id: 'C', badge: 'C', label: "Mostly C's", sub: 'Around a 2.0–2.9 GPA', reply: 'A C is a starting point, not a ceiling.' },
      { id: 'D', badge: 'D', label: 'Lower than I want', reply: "Thanks for being honest. That's exactly why we're here." },
    ],
  },
  {
    key: 'target',
    eyebrow: 'Where you want to be',
    title: 'What grade are you going for?',
    prompt: 'Pick the one you actually want, not the safe one.',
    options: [
      { id: 'A', badge: 'A', label: 'Straight A’s', sub: 'Protect or reach a 4.0' },
      { id: 'Aminus', badge: 'A−', label: 'A’s and A-minuses', sub: "Dean's list territory" },
      { id: 'B', badge: 'B+', label: 'Solid B-pluses' },
      { id: 'pass', badge: 'P', label: 'Just pass, please' },
    ],
  },
  {
    key: 'confidence',
    eyebrow: 'Writing',
    title: 'How confident do you feel writing essays?',
    prompt: 'This tells us how much help you want.',
    options: [
      { id: '1', badge: '1', label: 'I freeze at a blank page', reply: "Starting is the hardest bit. We'll make it the easiest." },
      { id: '2', badge: '2', label: "I get there, but it's painful", reply: "We'll take the guesswork out of every paragraph." },
      { id: '3', badge: '3', label: "Okay, but never sure it's good", reply: "That's the gap we close. You'll know before you hand it in." },
      { id: '4', badge: '4', label: 'Pretty good, I want the extra marks', reply: 'The last few marks live in the details. Perfect.' },
      { id: '5', badge: '5', label: 'Confident, I want a second pair of eyes', reply: 'Think of us as the TA who checks it before your professor does.' },
    ],
  },
  {
    key: 'struggles',
    multi: true,
    eyebrow: 'What trips you up',
    title: 'What do you struggle with most?',
    prompt: "Everyone has something. Tell us yours and we'll aim right at it.",
    options: [
      { id: 'marker', label: 'Knowing what my professor wants' },
      { id: 'structure', label: 'Structuring my argument' },
      { id: 'start', label: 'Getting started' },
      { id: 'refs', label: 'Referencing and citations' },
      { id: 'remember', label: 'Remembering content for exams' },
      { id: 'time', label: 'Running out of time' },
    ],
  },
  {
    key: 'deadline',
    eyebrow: 'Timing',
    title: "When's your next deadline or exam?",
    prompt: 'So we know how fast to move.',
    options: [
      { id: 'week', label: 'This week', reply: "Then let's start today. You've still got time to fix it." },
      { id: 'twoweeks', label: 'In the next 2 weeks', reply: 'Good window. Enough time to draft, check and improve.' },
      { id: 'month', label: 'This month', reply: 'Starting early is the cheat code. Nice!' },
      { id: 'none', label: 'Nothing urgent yet', reply: 'Perfect time to build the habit, before the panic.' },
    ],
  },
  {
    key: 'life',
    multi: true,
    eyebrow: 'The bit that matters',
    title: 'If studying took less of your week, what would you do?',
    prompt: 'Grades matter. So does having a life.',
    options: [
      { id: 'sleep', label: 'Actually sleep' },
      { id: 'friends', label: 'See my friends' },
      { id: 'gym', label: 'Gym or sport' },
      { id: 'work', label: 'Work and earn money' },
      { id: 'off', label: 'Switch off and have fun' },
    ],
  },
];

export const SOURCE_QUESTION: OnboardingQuestion = {
  key: 'source',
  eyebrow: 'Last one',
  title: 'How did you find us?',
  prompt: 'Helps us know where to say hi.',
  options: [
    { id: 'tiktok', label: 'TikTok' },
    { id: 'instagram', label: 'Instagram' },
    { id: 'youtube', label: 'YouTube' },
    { id: 'google', label: 'Google' },
    { id: 'friend', label: 'A friend' },
    { id: 'reddit', label: 'Reddit' },
    { id: 'other', label: 'Somewhere else' },
  ],
};

export interface Outcome {
  tag: string;
  title: string;
  video: string;
  videoLabel: string;
  points: string[];
  /** Essay outcome shows an example before/after score. */
  showsScore?: boolean;
  mascot?: string;
}

const ESSAY_OUTCOME: Outcome = {
  tag: 'Essay Feedback',
  title: 'See your grade before your professor does',
  video: '/hero-essay.mp4',
  videoLabel: 'Essay Feedback marking a draft line by line',
  points: [
    'Every sentence color-coded: strong, needs work, needs revising',
    'A grade estimate out of 100, checked against your rubric',
    'The exact fix for each weak line. Apply it, re-check, submit.',
  ],
  showsScore: true,
};

const STUDY_OUTCOME: Outcome = {
  tag: 'Study Packs',
  title: 'Turn your notes into a lesson, flashcards and a quiz',
  video: '/hero-flashcards.mp4',
  videoLabel: 'A study pack turning notes into flashcards',
  points: [
    'Upload lecture notes, slides or a study guide',
    'Get a lesson, flashcards, a quiz and games from it',
    'Study in 10 minutes between classes, not a whole night',
  ],
  mascot: 'Exams feel different when you have already tested yourself on everything.',
};

const QUIZ_OUTCOME: Outcome = {
  tag: 'Quizzes',
  title: 'Find your gaps before the exam does',
  video: '/hero-quiz.mp4',
  videoLabel: 'A quiz generated from study notes',
  points: [
    'Quizzes built from your own notes, not generic ones',
    'See exactly which topics you are shaky on',
    'Daily Review keeps it fresh until exam day',
  ],
  mascot: 'Walk in knowing what is coming. That is what calm feels like.',
};

const STUDY_AFTER_ESSAY: Outcome = {
  ...STUDY_OUTCOME,
  title: 'And when exams come, actually remember it',
  mascot: 'Papers sorted, exams covered. That is the whole semester handled.',
};

export function outcomesFor(path: Path): [Outcome, Outcome] {
  return path === 'exam' ? [STUDY_OUTCOME, QUIZ_OUTCOME] : [ESSAY_OUTCOME, STUDY_AFTER_ESSAY];
}

export interface Recommendation {
  title: string;
  body: string;
  start: string;
  /** Where the dashboard sends them first. */
  tool: 'analyze' | 'study-pack';
}

export const RECOMMENDATIONS: Record<Path, Recommendation> = {
  essay: {
    title: 'Essay Feedback',
    body: 'Upload your draft and see the grade it is heading for, every line costing you points, and the fix, before your professor grades it.',
    start: 'Analyze my first paper',
    tool: 'analyze',
  },
  exam: {
    title: 'Study Packs',
    body: 'Drop in your lecture notes and get a lesson, flashcards and a quiz. Test yourself on every topic before the midterm.',
    start: 'Build my first study pack',
    tool: 'study-pack',
  },
  both: {
    title: 'Essay Feedback, then Study Packs',
    body: 'Fix the paper that is due first, then turn your notes into flashcards and a quiz for the exam after it.',
    start: 'Analyze my first paper',
    tool: 'analyze',
  },
};

/** How the 3 trial credits are suggested, per path. */
export const TRIAL_CREDIT_PLAN: Record<Path, { label: string; when: string }[]> = {
  essay: [
    { label: 'Analyze your current draft', when: 'Today' },
    { label: 'Re-check it after your fixes', when: 'Tomorrow' },
    { label: 'Study pack from your lecture notes', when: 'Day 3' },
  ],
  exam: [
    { label: 'Study pack from your hardest topic', when: 'Today' },
    { label: 'Study pack from your next topic', when: 'Tomorrow' },
    { label: 'Study pack from your study guide', when: 'Day 3' },
  ],
  both: [
    { label: 'Analyze your current draft', when: 'Today' },
    { label: 'Re-check it after your fixes', when: 'Tomorrow' },
    { label: 'Study pack for your next exam', when: 'Day 3' },
  ],
};

const STRUGGLE_FIX: Record<string, string> = {
  marker: 'You will see your paper the way your professor will, before they grade it',
  structure: 'You will get told exactly where your argument loses the thread',
  start: 'You will never face a blank page with no idea where to begin',
  refs: 'Citations found and formatted for you, in APA, MLA or Chicago',
  remember: 'Your notes become quizzes, so it sticks on exam day',
  time: 'You will fix what matters most first, so nothing is left to the last night',
};

const LIFE_PHRASE: Record<string, string> = {
  sleep: 'actually sleep',
  friends: 'see your friends',
  gym: 'get to the gym',
  work: 'pick up more shifts',
  off: 'switch off and have fun',
};

export const LIFE_SHORT: Record<string, string> = {
  sleep: 'Sleep',
  friends: 'Friends',
  gym: 'Gym',
  work: 'Shift',
  off: 'Fun',
};

function optionFor(key: keyof OnboardingAnswers, id: string | undefined): OnboardingOption | undefined {
  const q = QUESTIONS.find((x) => x.key === key);
  return q?.options.find((o) => o.id === id);
}

function joinNice(list: string[]): string {
  if (list.length <= 1) return list[0] ?? '';
  return `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`;
}

function article(grade: string): string {
  return grade.startsWith('A') ? `an ${grade}` : `a ${grade}`;
}

/** Grades for the "B to A" line. */
export function gradeJump(a: OnboardingAnswers): { from: string; to: string } {
  const from = optionFor('current', a.current)?.badge ?? 'B';
  const target = optionFor('target', a.target)?.badge;
  const to = !target ? 'A' : target === 'P' ? 'Pass' : target;
  return { from, to };
}

const GRADE_RANK: Record<string, number> = { A: 0, 'A−': 1, 'B+': 2, B: 3, C: 4, D: 5 };

/**
 * What they're after: climbing to a higher grade, keeping the one they
 * have (already at or above the target), or just passing. Headlines key
 * off this so we never promise "B to A" to someone who didn't say B.
 */
export type GradeGoal = 'climb' | 'keep' | 'pass';

export function gradeGoal(a: OnboardingAnswers): GradeGoal {
  if (a.target === 'pass') return 'pass';
  const { from, to } = gradeJump(a);
  if (!a.current) return 'climb';
  return (GRADE_RANK[from] ?? 3) <= (GRADE_RANK[to] ?? 0) ? 'keep' : 'climb';
}

/** Welcome headline: an outcome every student wants, whatever their grades. */
export const WELCOME_HEADLINE: { w: string; tone?: 'muted' | 'accent'; br?: boolean }[] = [
  { w: 'Better', tone: 'accent' }, { w: 'grades.', tone: 'accent', br: true }, { w: 'Less' }, { w: 'stress.' },
];

export function welcomeGreeting(firstName?: string): string {
  return `Hi${firstName ? ` ${firstName}` : ''}! I'm Scholar. Let's make this your best semester yet.`;
}

/** Headline on the plan (paywall) screen, from what they told us. */
export function planHeadline(a: OnboardingAnswers): string {
  const { from, to } = gradeJump(a);
  switch (gradeGoal(a)) {
    case 'pass': return 'A calm pass, without losing your evenings';
    case 'keep': return `Stay at ${article(to)}, without losing your evenings`;
    default: return a.current ? `${from} to ${to}, without losing your evenings` : `Your best grades yet, without losing your evenings`;
  }
}

export function planBubble(a: OnboardingAnswers, firstName?: string): string {
  const ready = `Your plan is ready${firstName ? `, ${firstName}` : ''}!`;
  const { to } = gradeJump(a);
  switch (gradeGoal(a)) {
    case 'pass': return `${ready} Let's get you over the line.`;
    case 'keep': return `${ready} Let's keep you at the top.`;
    default: return `${ready} Let's get you that ${to}.`;
  }
}

/** Line in the "Building your plan" checklist. */
export function goalLine(a: OnboardingAnswers): string {
  const { from, to } = gradeJump(a);
  switch (gradeGoal(a)) {
    case 'pass': return 'Matching your goal: a calm pass';
    case 'keep': return `Matching your goal: staying at ${article(to)}`;
    default: return a.current ? `Matching your goal: ${from} to ${to}` : `Matching your goal: ${article(to)}`;
  }
}

/** What Scholar says on a question screen, given the answers so far. */
export function bubbleFor(q: OnboardingQuestion, a: OnboardingAnswers): string {
  const value = a[q.key];
  if (q.key === 'target' && typeof value === 'string') {
    if (value === 'pass') return "No shame in that. We'll get you over the line, calmly.";
    if (gradeGoal(a) === 'keep') return "Then let's keep you there, with less stress.";
    const { from, to } = gradeJump(a);
    return `From ${from} to ${to}? That jump is exactly what we are built for.`;
  }
  if (q.key === 'struggles' && Array.isArray(value) && value.length) {
    return value.length > 2 ? "That's a lot at once. We'll tackle the biggest first." : 'Noted. That goes straight into your plan.';
  }
  if (q.key === 'life' && Array.isArray(value) && value.length) {
    return "That's the real goal. Better grades in fewer hours.";
  }
  if (q.key === 'source' && value) return 'Thanks! That really helps us.';
  if (typeof value === 'string') {
    const reply = q.options.find((o) => o.id === value)?.reply;
    if (reply) return reply;
  }
  return q.prompt;
}

export function empathyFor(a: OnboardingAnswers): { title: string; body: string; points: string[] } {
  const { from } = gradeJump(a);
  const title = from === 'A'
    ? "Staying at the top shouldn't cost you every evening."
    : `You're not ${article(from)} student. You just never see your mistakes in time.`;
  const struggles = a.struggles?.length ? a.struggles.slice(0, 2) : ['marker', 'time'];
  const points = struggles.map((id) => STRUGGLE_FIX[id]).filter(Boolean);
  points.push(
    a.deadline === 'week'
      ? 'And with a deadline this week, you can start fixing today'
      : 'And you will get there in fewer hours, not more',
  );
  return {
    title,
    body: 'Most students only find out what was wrong when the grade comes back on Canvas, and by then it is too late to fix. That is the part we change.',
    points,
  };
}

export function lifeLineFor(a: OnboardingAnswers): string {
  const picks = a.life?.length ? a.life : ['friends', 'sleep'];
  return `More time to ${joinNice(picks.slice(0, 2).map((id) => LIFE_PHRASE[id]).filter(Boolean))}. That is the point.`;
}

export function pathFor(a: OnboardingAnswers): Path {
  return a.pressure ?? 'both';
}

/** Legacy survey columns, so existing dashboards keep working. */
export function surveyPayload(a: OnboardingAnswers) {
  const path = pathFor(a);
  return {
    referralSource: a.source ?? null,
    useGoal: path === 'essay' ? 'essays' : path === 'exam' ? 'exams' : 'grades',
    featureInterests: path === 'essay' ? ['essays'] : path === 'exam' ? ['study_packs'] : ['essays', 'study_packs'],
    answers: a,
  };
}

/* ─── Scholar animations ───
   Animated WEBPs in /public, one per moment so the mascot reacts to
   where the user is. The iOS app uses the same files (Resources/). */
export const SCHOLAR = {
  celebrating: '/mascot-celebrating.webp',
  thinking: '/mascot-thinking.webp',
  study: '/mascot-study.webp',
  laptop: '/mascot-laptop.webp',
  paper: '/mascot-paper.webp',
  dance: '/mascot-dance.webp',
  juggling: '/mascot-juggling.webp',
  jumpingJoy: '/mascot-jumping-joy.webp',
  walking: '/mascot-walking.webp',
} as const;

/** Which animation plays on each question. */
export const QUESTION_SCHOLAR: Record<keyof OnboardingAnswers, string> = {
  level: SCHOLAR.walking,
  pressure: SCHOLAR.thinking,
  current: SCHOLAR.study,
  target: SCHOLAR.jumpingJoy,
  confidence: SCHOLAR.paper,
  struggles: SCHOLAR.juggling,
  deadline: SCHOLAR.laptop,
  life: SCHOLAR.dance,
  source: SCHOLAR.celebrating,
};

/** Animation + line for the outcome screens. */
export function outcomeScholar(o: Outcome): { src: string; line: string } {
  if (o.showsScore) return { src: SCHOLAR.paper, line: 'Watch this. Every line gets marked before your professor sees it.' };
  if (o.video.includes('quiz')) return { src: SCHOLAR.laptop, line: o.mascot ?? 'Find the gaps now, not in the exam room.' };
  return { src: SCHOLAR.study, line: o.mascot ?? 'Your notes, turned into something you will remember.' };
}
