/**
 * Programmatic SEO pages, 30 long-tail landing pages targeting student
 * keywords with low competition that can rank in 4-6 weeks.
 *
 * Routing: each entry has `path` (full URL like "/study/biology"). The
 * router in CompleteAcademicAIApp matches paths with prefixes /study/,
 * /alternatives/, /guides/, /best/ and looks up the config here.
 *
 * Distribution:
 *   - 10 subject pages   (/study/[subject])
 *   - 5 alternatives     (/alternatives/[competitor])
 *   - 10 writing guides  (/guides/how-to-write-[type]-essay etc.)
 *   - 5 "best for" pages (/best/[query])
 *
 * Each page targets a specific keyword (commented inline) with at least
 * 500 words of unique content + FAQ schema + internal links.
 */

import type { ProgrammaticPageConfig, ProgrammaticSection } from '../components/pages/ProgrammaticLandingPage';
import { FREE_PLAN_FAQ_ANSWER } from '../constants/freePlanCopy';

/* ─── Helpers ──────────────────────────────────────────────────── */

/** Comparison-table cell — matches PricingPage NEWCUSTOMER offer. */
const PRO_PRICING_CELL = 'Preview free · $9.99 1st mo Pro';

/** Short free-plan explainer for alternative-page FAQs. */
const FREE_PLAN_PROG_SHORT =
  'Free gives you lifetime previews on your own work (2 essay analyses, 2 study packs, 2 citation searches with sample results) — no credit card. Pro unlocks full rubrics, quizzes, games, decks, and exports.';

/** Signup step copy — no "covers your first semester" over-promises. */
const FREE_SIGNUP_STEP =
  'Sign up in 30 seconds — no credit card. Run a real preview on your own essay or notes before you pay anything.';

const freeSubjectFaqAnswer = (niceName: string) =>
  `Yes. ${FREE_PLAN_PROG_SHORT} First month of Pro is $9.99 with code NEWCUSTOMER, then $19.99/mo — built for ${niceName} students who want to see results before subscribing.`;

const TOOL_LINKS_PROG = {
  flashcards: { href: '/tools/create-flashcards', page: 'create-flashcards', label: 'Flashcard Maker' },
  quizGen: { href: '/tools/quiz-generator', page: 'quiz-generator', label: 'AI Quiz Generator' },
  summarizer: { href: '/tools/summarizer', page: 'summarizer', label: 'AI Summarizer' },
  thesisGen: { href: '/tools/thesis-generator', page: 'thesis-generator', label: 'Thesis Generator' },
  outline: { href: '/tools/essay-outline', page: 'essay-outline', label: 'Essay Outline' },
  citations: { href: '/tools/citation-generator', page: 'citation-generator-tool', label: 'Citation Generator' },
  analyze: { href: '/tools/analyze', page: 'analyze', label: 'AI Essay Checker' },
  grammar: { href: '/tools/grammar-checker', page: 'grammar-checker', label: 'Grammar Checker' },
  paraphrase: { href: '/tools/paraphrasing-tips', page: 'paraphrasing-tips', label: 'Paraphrasing Tips' },
  pomodoro: { href: '/tools/pomodoro-timer', page: 'pomodoro-timer', label: 'Pomodoro Timer' },
  signup: { href: '/signup', page: 'signup', label: 'Start free' },
};

/* ─── SUBJECT PAGES, /study/[subject] ─────────────────────────── */
// Each targets "[subject] study tools" / "[subject] flashcards" / "study [subject]"

interface SubjectMeta {
  slug: string;
  name: string;          // "Biology"
  niceName: string;      // "biology", for inline use
  accent: string;
  intro: string;
  topics: string[];      // 5-6 sub-areas of the subject
  courses: string[];     // 3-4 typical course codes/names
  studyTips: string[];   // 4-5 subject-specific tips
  /**
   * Optional hand-written deep-dive sections (real sample flashcards, exam
   * questions, worked examples) spliced in after the topics list. Engagement
   * experiment: biology + psychology get real embedded content; if their
   * dwell time / bounce diverges from the templated subjects, roll out to
   * all 10. Template-only subject pages risk "thin programmatic content"
   * classification — these sections are the antidote.
   */
  deepDive?: ProgrammaticSection[];
}

const SUBJECTS: SubjectMeta[] = [
  {
    slug: 'biology', name: 'Biology', niceName: 'biology', accent: '#58CC02',
    intro: 'Biology is mostly memorisation, pathways, structures, cycles, terminology, and most students try to memorise it by re-reading the textbook. That\'s why most students fail their first big bio exam. Active recall (flashcards + quizzes) outperforms passive review by 50%+ on retention. WriteScholar turns your bio lecture notes into the active-recall tools that actually work.',
    topics: ['Cell biology and biochemistry', 'Genetics and heredity', 'Anatomy and physiology', 'Ecology and ecosystems', 'Evolution and natural selection', 'Microbiology'],
    courses: ['Bio 101, Introductory Biology', 'Bio 201, Cell & Molecular Biology', 'Bio 301, Genetics', 'Bio 350, Ecology'],
    studyTips: [
      'Draw the diagrams from memory before checking. Mitosis stages, the Krebs cycle, photosynthesis, drawing forces real recall.',
      'Use mnemonics for ordered processes. "Please Make Cookies" for prophase-metaphase-anaphase-telophase will save you on exam day.',
      'Start the day before lecture, not the day before exam. Bio is too cumulative to cram.',
      'Quiz yourself on terminology daily, biology has more vocabulary per chapter than most subjects.',
    ],
    deepDive: [
      {
        type: 'examples',
        heading: 'Weak vs strong biology flashcards',
        examples: [
          {
            label: 'Definition card',
            before: 'Q: What is cellular respiration?  A: The process cells use to make energy.',
            after: 'Q: Why does cellular respiration yield ~30-32 ATP while glycolysis alone yields only 2?  A: Glycolysis is anaerobic and stops at pyruvate; the Krebs cycle + electron transport chain (aerobic, in mitochondria) extract the remaining energy via NADH/FADH2 driving oxidative phosphorylation.',
            explanation: 'The weak card tests recognition of a phrase. The strong card forces you to connect glycolysis, the Krebs cycle, and the ETC — which is exactly how Bio 101 exams ask it.',
          },
          {
            label: 'Process card',
            before: 'Q: What are the stages of mitosis?  A: Prophase, metaphase, anaphase, telophase.',
            after: 'Q: A cell\'s chromosomes are aligned at the equatorial plate. What stage is it in, what happens next, and what error at this checkpoint causes aneuploidy?  A: Metaphase. Next, sister chromatids separate (anaphase). Failure of the spindle-assembly checkpoint lets improperly attached chromatids separate unevenly → aneuploidy.',
            explanation: 'Listing stage names gets you the first mark only. Exams test what happens in each stage and what goes wrong — build cards that ask that.',
          },
        ],
      },
      {
        type: 'list',
        heading: 'Sample deck: cell respiration (what WriteScholar generates from one lecture)',
        items: [
          { title: 'Where does glycolysis occur, and does it need oxygen?', body: 'Cytoplasm; anaerobic (no oxygen required). Net yield: 2 ATP + 2 NADH per glucose.' },
          { title: 'What is the role of NAD+ in respiration?', body: 'Electron carrier — picks up electrons (becoming NADH) during glycolysis and the Krebs cycle, then delivers them to the electron transport chain.' },
          { title: 'Why is oxygen called the "final electron acceptor"?', body: 'At the end of the ETC, electrons combine with O2 and H+ to form water. Without O2 the chain backs up and ATP production stalls — which is why cells switch to fermentation.' },
          { title: 'Krebs cycle: inputs and outputs per acetyl-CoA?', body: 'In: 1 acetyl-CoA. Out: 2 CO2, 3 NADH, 1 FADH2, 1 ATP (GTP). The cycle turns twice per glucose.' },
          { title: 'Lactic acid vs alcoholic fermentation — what do they have in common?', body: 'Both regenerate NAD+ so glycolysis can continue without oxygen. They differ in end product: lactate (muscle cells) vs ethanol + CO2 (yeast).' },
        ],
      },
      {
        type: 'paragraph',
        heading: 'How to study genetics problems (not just genetics terms)',
        body: 'Genetics is where bio students who only memorise fall apart, because exams test Punnett-square reasoning, not vocabulary. Build two decks: one for terms (allele, genotype, heterozygous, codominance) and one for problem patterns. A pattern card looks like "Cross two heterozygous tall plants (Tt x Tt) — what ratio of offspring are short?" with the answer walking through the 3:1 phenotypic ratio, so 1/4 are short. When you generate a quiz from a genetics lecture, set it to mixed format so you get both recall questions (define epistasis) and applied questions (given this dihybrid cross, predict the ratio). That mirrors the real exam split.',
      },
    ],
  },
  {
    slug: 'chemistry', name: 'Chemistry', niceName: 'chemistry', accent: '#1CB0F6',
    intro: 'Chemistry mixes memorisation (periodic table, naming conventions) with problem-solving (stoichiometry, reaction mechanisms). Students who only memorise fail problem sets. Students who only practice problems fail recall questions. The fix is parallel: flashcards for terms and equations, AI-generated practice quizzes for problems.',
    topics: ['General chemistry, atoms, bonds, reactions', 'Organic chemistry, functional groups and mechanisms', 'Stoichiometry and balancing', 'Thermodynamics and kinetics', 'Acids, bases, and equilibrium', 'Electrochemistry'],
    courses: ['Chem 101, General Chemistry', 'Chem 201, Organic Chemistry I', 'Chem 202, Organic Chemistry II', 'Chem 301, Physical Chemistry'],
    studyTips: [
      'Practice mechanism arrows by hand, on paper. Drawing them digitally is too slow to internalise.',
      'Memorise functional groups as flashcards before second semester orgo, there is no shortcut.',
      'For stoichiometry, do 5 problems a day every day for 2 weeks before the test.',
      'Make a "reactions cheat sheet" deck with 1 reaction per card. Drill until you can fire them off in 5 seconds.',
    ],
  },
  {
    slug: 'physics', name: 'Physics', niceName: 'physics', accent: '#A560E8',
    intro: 'Physics is the most "do the work" subject in college. Reading the textbook teaches you nothing; doing 30 problems teaches you everything. WriteScholar generates practice quizzes from your problem sets and conceptual questions from your lecture notes, so you can drill both halves at once.',
    topics: ['Classical mechanics, kinematics, dynamics, energy', 'Electricity and magnetism', 'Waves, oscillations, and optics', 'Thermodynamics', 'Modern physics, relativity and quantum', 'Statics and circuit analysis'],
    courses: ['Phys 101, Mechanics', 'Phys 201, Electricity & Magnetism', 'Phys 301, Quantum Mechanics', 'Phys 350, Thermodynamics'],
    studyTips: [
      'Do every problem in the chapter, not just the assigned ones. Physics rewards reps.',
      'Sketch the situation before solving. "Free body diagram first" applies to almost every problem.',
      'Memorise the equations + know when each applies. Knowing F=ma is useless if you can\'t spot when to use it.',
      'Form a study group. Physics problems are easier when 2-3 people argue over which approach to take.',
    ],
  },
  {
    slug: 'calculus', name: 'Calculus', niceName: 'calculus', accent: '#FF9600',
    intro: 'Calculus is the gateway course that ends a lot of STEM majors. The problem usually isn\'t the math, it\'s pattern recognition. There are ~50 distinct problem types in Calc 1-2, and once you\'ve drilled each one 5 times, the course gets easy. AI-generated practice quizzes from your textbook get you the reps you need.',
    topics: ['Limits and continuity', 'Derivatives and applications', 'Integrals and antiderivatives', 'Series and sequences', 'Multivariable calculus', 'Differential equations'],
    courses: ['Calc I, Differential Calculus', 'Calc II, Integral Calculus', 'Calc III, Multivariable', 'Calc IV, Differential Equations'],
    studyTips: [
      'Drill derivatives until you can fire them off without thinking. Chain rule applied wrong is the #1 source of point loss.',
      'Master integration by recognition, the integrand tells you which method to try.',
      'Don\'t skip the conceptual questions. "What does this derivative mean?" shows up on every exam.',
      'Use a spaced-repetition schedule: re-do problems from week 1 in week 4. Calc is cumulative.',
    ],
  },
  {
    slug: 'statistics', name: 'Statistics', niceName: 'statistics', accent: '#1CB0F6',
    intro: 'Statistics has two failure modes: students who memorise formulas without understanding what they mean (fail conceptual questions), and students who get the concepts but freeze on calculations (fail computational questions). Drill both with AI-generated practice problems and concept quizzes from your notes.',
    topics: ['Descriptive statistics, mean, median, mode', 'Probability theory and distributions', 'Hypothesis testing and p-values', 'Regression and correlation', 'ANOVA and chi-square tests', 'Bayesian statistics'],
    courses: ['Stats 101, Introductory Statistics', 'Stats 201, Probability', 'Stats 301, Regression Analysis', 'Stats 350, Bayesian Methods'],
    studyTips: [
      'Don\'t memorise formulas, derive them. Once you understand variance is "average squared deviation from mean", you remember the formula.',
      'For every test, ask: assumptions met? null hypothesis stated? significance level chosen?',
      'Draw the distribution every time. Drawing N(0,1) for z-tests prevents 80% of mistakes.',
      'Use the calculator quizzes, stats has lots of "given X and Y, find Z" questions that need calculation reps.',
    ],
  },
  {
    slug: 'psychology', name: 'Psychology', niceName: 'psychology', accent: '#A560E8',
    intro: 'Psychology is heavy on terminology, theorists, and study designs. Without active recall, you\'ll forget who Skinner was vs Bandura by week 4. Flashcards built from your lecture notes plus quiz-yourself sessions on study designs make psychology readable on exam day.',
    topics: ['Cognitive psychology', 'Social and developmental psychology', 'Abnormal psychology and disorders', 'Research methods and statistics', 'Biological bases of behaviour', 'Personality theories'],
    courses: ['Psych 101, Introduction to Psychology', 'Psych 201, Cognitive Psychology', 'Psych 301, Abnormal Psychology', 'Psych 350, Research Methods'],
    studyTips: [
      'Match theorists to their key concepts. Skinner = operant conditioning. Bandura = social learning. Piaget = stages of cognitive dev.',
      'Memorise the DSM-5 criteria as flashcards if you\'re in abnormal psych. Vague answers won\'t cut it.',
      'For research methods, drill the difference between correlation and causation until it\'s automatic.',
      'Practice case-study application. "Given this patient profile, what disorder fits?" is a common exam pattern.',
    ],
    deepDive: [
      {
        type: 'examples',
        heading: 'Weak vs strong psychology flashcards',
        examples: [
          {
            label: 'Theorist card',
            before: 'Q: Who is B.F. Skinner?  A: A behaviorist psychologist.',
            after: 'Q: A child cleans their room to stop their parent\'s nagging. Which of Skinner\'s mechanisms is this, and why is it not punishment?  A: Negative reinforcement — an aversive stimulus (nagging) is removed, which increases the behavior. Punishment would decrease a behavior; here the behavior is strengthened.',
            explanation: 'Psych exams almost never ask "who is X." They give you a scenario and ask which concept applies. Write cards in scenario format from day one.',
          },
          {
            label: 'Research methods card',
            before: 'Q: What is a confound?  A: A variable that affects the results.',
            after: 'Q: A study finds students who drink coffee score higher on exams. Name two plausible confounds and the design fix.  A: Sleep schedule and study hours could drive both coffee intake and scores. Fix: random assignment to coffee/no-coffee conditions, which distributes confounds across groups.',
            explanation: 'Methods questions are applied. A card that makes you generate confounds and fixes trains the exact skill the exam grades.',
          },
        ],
      },
      {
        type: 'list',
        heading: 'Sample deck: classical vs operant conditioning (from one Psych 101 lecture)',
        items: [
          { title: 'Classical vs operant — the one-line distinction?', body: 'Classical: involuntary responses paired with new stimuli (Pavlov\'s dogs). Operant: voluntary behavior shaped by consequences (Skinner\'s boxes).' },
          { title: 'In Pavlov\'s experiment, what is the conditioned stimulus?', body: 'The bell. It starts neutral and acquires the power to trigger salivation only after repeated pairing with food (the unconditioned stimulus).' },
          { title: 'Positive punishment vs negative reinforcement?', body: 'Positive punishment ADDS something aversive to decrease behavior (extra chores for missing curfew). Negative reinforcement REMOVES something aversive to increase behavior (seatbelt alarm stops when you buckle).' },
          { title: 'What is extinction in classical conditioning?', body: 'The conditioned response fades when the conditioned stimulus is repeatedly presented without the unconditioned stimulus — the bell rings, no food arrives, salivation stops.' },
          { title: 'Bandura\'s Bobo doll study — why does it matter?', body: 'Children imitated aggression they merely observed, without any reinforcement. It established social/observational learning as a third pathway beyond classical and operant conditioning.' },
        ],
      },
      {
        type: 'paragraph',
        heading: 'How to prepare for case-study questions',
        body: 'Upper-level psych exams lean on vignettes: a paragraph describing a patient, then "which disorder best fits, and which DSM-5 criterion is NOT met?" To prepare, turn each disorder\'s criteria into a two-sided card — symptoms on one side, the differential (what rules it out vs its nearest neighbour) on the other. Generalized anxiety vs panic disorder, MDD vs persistent depressive disorder, bipolar I vs II. Then quiz yourself with mixed vignettes rather than chapter-by-chapter, because the exam will not tell you which chapter the patient walked out of.',
      },
    ],
  },
  {
    slug: 'anatomy', name: 'Anatomy', niceName: 'anatomy', accent: '#FF4B4B',
    intro: 'Anatomy is the most flashcard-friendly subject in medicine. There are ~5,000 named structures to know, and there\'s no understanding shortcut, you have to learn them. AI flashcards from your anatomy notes + image-based recall is how med students survive first year.',
    topics: ['Musculoskeletal anatomy', 'Cardiovascular system', 'Nervous system', 'Respiratory and digestive', 'Endocrine and reproductive', 'Histology and cell types'],
    courses: ['Anat 101, Gross Anatomy', 'Anat 201, Neuroanatomy', 'Anat 301, Histology', 'Med 100, Anatomy & Physiology'],
    studyTips: [
      'Pair every term with its image. Verbal-only flashcards fail in anatomy, you need visual recognition.',
      'Walk the cadaver lab in your head. Mental rehearsal of dissection sequences locks structures into memory.',
      'Drill 30 minutes/day every day. Cramming anatomy doesn\'t work, there\'s too much material.',
      'Use systems-based AND regional decks. You\'ll be tested both ways.',
    ],
  },
  {
    slug: 'history', name: 'History', niceName: 'history', accent: '#FF9600',
    intro: 'History exams test two things: dates and arguments. Flashcards handle dates; AI-generated essay outlines handle arguments. Drill the timeline with active recall, then practice constructing thesis statements on the major debates of the period.',
    topics: ['American history, colonial to modern', 'European history, Renaissance to WWII', 'World wars and 20th century', 'Ancient civilisations', 'Modern world history', 'Historiography and methods'],
    courses: ['Hist 101, US History', 'Hist 201, Modern Europe', 'Hist 301, World Wars', 'Hist 350, Historiography'],
    studyTips: [
      'Build a timeline deck, one date per card. "1776, Declaration of Independence". Drill until automatic.',
      'For essays, write the thesis in 1 sentence before drafting. A weak thesis sinks the whole essay.',
      'Always cite primary sources. Secondary sources are a starting point, not an authority.',
      'Practice the "compare and contrast two periods" essay type, it shows up in every history exam.',
    ],
  },
  {
    slug: 'computer-science', name: 'Computer Science', niceName: 'computer science', accent: '#1CB0F6',
    intro: 'CS combines memorisation (algorithms, data structures, syntax) with problem-solving (LeetCode-style coding questions). Students who only code fail the theory; students who only memorise fail the problems. Drill both with AI quizzes on your lecture notes and practice problem generation.',
    topics: ['Data structures and algorithms', 'Programming languages and paradigms', 'Operating systems', 'Computer networks', 'Databases and SQL', 'Machine learning basics'],
    courses: ['CS 101, Intro to Programming', 'CS 201, Data Structures', 'CS 301, Algorithms', 'CS 350, Operating Systems'],
    studyTips: [
      'Drill Big-O on every algorithm. Knowing it\'s O(n log n) but not what that means costs interview points.',
      'Hand-trace algorithms before coding. "Show me the array state at step 3" reveals where you misunderstand.',
      'For interviews, drill 50 LeetCode mediums, pattern recognition matters more than memorising specific problems.',
      'Build flashcards for syntax in unfamiliar languages. Python idioms differ from Java idioms differ from JS.',
    ],
  },
  {
    slug: 'economics', name: 'Economics', niceName: 'economics', accent: '#58CC02',
    intro: 'Economics is part graphs (supply/demand, IS-LM, Phillips curve), part definitions (elasticity, GDP, inflation), part argument (which policy is better). Visual flashcards for graphs, terminology decks for definitions, AI essay outlines for policy debates.',
    topics: ['Microeconomics, supply, demand, elasticity', 'Macroeconomics, GDP, inflation, monetary policy', 'International trade and exchange rates', 'Game theory and behavioural economics', 'Public finance and taxation', 'Development economics'],
    courses: ['Econ 101, Microeconomics', 'Econ 201, Macroeconomics', 'Econ 301, International Trade', 'Econ 350, Game Theory'],
    studyTips: [
      'Memorise the curves AND know what shifts each one. "Supply curve shifts left when..." is the most-tested pattern.',
      'Compute elasticities by hand 20 times. Then never compute them again, you\'ll just see the answer.',
      'For macro, separate Keynesian from Classical from Monetarist views. Mixing them up is the #1 essay mistake.',
      'Practice writing 1-page policy arguments. Strong essays have a thesis, evidence, and a counterargument response.',
    ],
  },
];

/**
 * Map of related-subject suggestions for cross-linking. Each subject points
 * to 3 thematically-adjacent subjects so subject pages internally link to
 * each other (helps SEO depth + keeps users on site).
 */
const RELATED_SUBJECTS_MAP: Record<string, string[]> = {
  biology: ['chemistry', 'anatomy', 'psychology'],
  chemistry: ['biology', 'physics', 'calculus'],
  physics: ['chemistry', 'calculus', 'computer-science'],
  calculus: ['physics', 'statistics', 'computer-science'],
  statistics: ['calculus', 'psychology', 'economics'],
  psychology: ['statistics', 'biology', 'anatomy'],
  anatomy: ['biology', 'chemistry', 'psychology'],
  history: ['psychology', 'economics', 'computer-science'],
  'computer-science': ['calculus', 'statistics', 'physics'],
  economics: ['statistics', 'psychology', 'history'],
};

/** Subjects classified as STEM vs humanities/social — picks the right guide link. */
const STEM_SUBJECTS = new Set(['biology', 'chemistry', 'physics', 'calculus', 'statistics', 'anatomy', 'computer-science']);

/** Build a subject page config from a SubjectMeta. */
function subjectPage(s: SubjectMeta): ProgrammaticPageConfig {
  const relatedSlugs = RELATED_SUBJECTS_MAP[s.slug] || [];
  const relatedSubjectLinks = relatedSlugs
    .map((slug) => SUBJECTS.find((x) => x.slug === slug))
    .filter((x): x is SubjectMeta => Boolean(x))
    .map((x) => ({
      label: `${x.name} study tools`,
      href: `/study/${x.slug}`,
      teaser: `Flashcards, quizzes, and summaries for ${x.niceName}.`,
    }));
  // STEM students mostly write research papers; humanities students write analytical/argumentative essays
  const guideLink = STEM_SUBJECTS.has(s.slug)
    ? { label: 'How to write a research paper', href: '/guides/how-to-write-research-paper', teaser: `Step-by-step guide for ${s.niceName} research papers.` }
    : { label: 'How to write an analytical essay', href: '/guides/how-to-write-analytical-essay', teaser: 'Build interpretive arguments with evidence.' };

  return {
    slug: s.slug,
    type: 'subject',
    metaTitle: `${s.name} Study Tools, Free Flashcards, Quizzes, Notes | WriteScholar`,
    metaDescription: `Study ${s.niceName} smarter with AI tools. Turn ${s.niceName} lecture notes into flashcards, quizzes, and summaries — preview free on your own work.`,
    h1: `Study ${s.name} smarter, built for ${s.niceName} students`,
    subtitle: `AI tools that turn your ${s.niceName} notes into flashcards, quizzes, and summaries. Preview on your own work free — no credit card.`,
    eyebrow: `${s.name} study tools`,
    accent: s.accent,
    intro: s.intro,
    sections: [
      {
        type: 'list',
        heading: `What ${s.niceName} students use WriteScholar for`,
        items: s.topics.map((topic) => ({
          title: topic,
          body: `Paste your ${topic.toLowerCase()} notes into WriteScholar to instantly generate flashcards, quiz questions, and concept summaries. The AI extracts key terms and definitions automatically.`,
        })),
      },
      // Hand-written deep-dive content (real flashcards, exam questions) for
      // subjects in the engagement experiment — see SubjectMeta.deepDive.
      ...(s.deepDive ?? []),
      {
        type: 'paragraph',
        heading: `Course examples, ${s.name} classes WriteScholar handles`,
        body: `${s.courses.join('. ')}. Whether you're in an intro survey class or a senior seminar, paste your lecture notes or textbook chapters in and let WriteScholar build the study tools. ${s.name} courses tend to be cumulative, what you learn in week 1 shows up on the final, so spaced-repetition flashcards (built into our flashcard maker) become essential by mid-term.`,
      },
      {
        type: 'list',
        heading: `Study tips for ${s.niceName}`,
        items: s.studyTips.map((tip, i) => ({ title: `Tip ${i + 1}`, body: tip })),
      },
      {
        type: 'steps',
        heading: `How to get started with ${s.niceName} on WriteScholar`,
        steps: [
          { title: 'Upload your notes', body: `Drop in lecture notes, textbook chapters, or even a screenshot of a slide. WriteScholar handles PDF, DOCX, and plain text.` },
          { title: 'Generate study tools', body: `Pick what you want, flashcards for terminology, a quiz for self-testing, a summary for review, or all three at once with our Study Pack feature.` },
          { title: 'Study with active recall', body: `Active recall (flashcards + quizzes) outperforms passive review (rereading) by 50%+ on retention. The first ${s.niceName} exam after switching to active recall is usually a noticeable grade jump.` },
          { title: 'Track your weak spots', body: `WriteScholar tracks which questions you get wrong and prioritises them in future sessions. By exam time, you\'ve drilled exactly the topics you struggle with.` },
        ],
      },
    ],
    faqs: [
      { question: `Is WriteScholar free for ${s.niceName} students?`, answer: freeSubjectFaqAnswer(s.niceName) },
      { question: `Will it work with my professor's lecture slides?`, answer: `Yes. Paste the slide content as text or upload the PDF directly. WriteScholar parses the slides and pulls out concepts, terms, and questions automatically.` },
      { question: `Can I use WriteScholar on my phone?`, answer: `Yes. The web app is mobile-responsive, and we have native iOS and Android apps with the same study tools, flashcards work especially well on phones for spaced-repetition during commutes.` },
      { question: `How is this different from Quizlet?`, answer: `Quizlet requires you to manually build flashcard decks. WriteScholar auto-generates them from your notes in seconds. We also include the AI essay checker, summarizer, and quiz generator that Quizlet doesn't have.` },
      { question: `Is it safe to use for ${s.niceName} coursework?`, answer: `Yes. WriteScholar generates study tools from YOUR notes, it's not generating answers to homework or essays. Used as a study aid (flashcards, quizzes), it's the same as building flashcards by hand, just faster.` },
      { question: `What if I'm taking ${s.niceName} at a UK or AU university?`, answer: `WriteScholar works for any English-language ${s.niceName} curriculum, UK, AU, US, Canada, and most international schools. Course numbering and terminology may differ but the core material is the same.` },
    ],
    related: [
      // Subject cross-links first, prefer keeping the user inside the
      // /study/* cluster so Google sees a tightly-connected topical hub.
      ...relatedSubjectLinks,
      // One subject-relevant writing guide.
      guideLink,
      // Then 3 high-leverage tool links.
      { label: 'AI Flashcard Maker', href: '/tools/create-flashcards', teaser: `Build flashcard decks from your ${s.niceName} notes.` },
      { label: 'AI Quiz Generator', href: '/tools/quiz-generator', teaser: `Generate ${s.niceName} practice quizzes from notes.` },
      { label: 'AI Summarizer', href: '/tools/summarizer', teaser: `Condense long ${s.niceName} chapters fast.` },
    ],
    primaryCta: { label: `Preview ${s.niceName} tools free`, page: 'signup' },
    secondaryCta: { label: 'See all tools', page: 'dashboard' },
  };
}

/* ─── ALTERNATIVE PAGES, /alternatives/[competitor] ───────────── */

const quizletAlt: ProgrammaticPageConfig = {
  slug: 'quizlet',
  type: 'alternative',
  metaTitle: 'Quizlet Alternative, AI Flashcards Built From Your Notes | WriteScholar',
  metaDescription: 'WriteScholar is a Quizlet alternative for college students. Auto-generate flashcards from notes, preview study packs free, no ads. Pro unlocks full quizzes and decks from $9.99 first month.',
  h1: 'The Quizlet alternative students switch to for AI study tools',
  subtitle: 'Auto-generate flashcards from your notes in seconds. Preview lesson + sample cards free; Pro unlocks full quizzes, games, and decks — without Quizlet\'s ads or paywalled Test Mode.',
  eyebrow: 'Quizlet alternative · Preview free',
  accent: '#A560E8',
  intro: 'Quizlet used to be free. Then they paywalled Test Mode, Learn Mode, and most of the actually-useful study features behind Quizlet+ ($35.99/year). WriteScholar is different: paste your notes and AI builds flashcards, quizzes, and study packs in seconds — preview the results on your own work free (no credit card), then upgrade when you want the full deck, quiz modes, and essay tools. Same study workflow, honest pricing, no ad interruptions.',
  sections: [
    {
      type: 'media',
      kind: 'video',
      src: '/hero-flashcards.mp4',
      alt: 'WriteScholar auto-generating a flashcard deck from pasted lecture notes',
      heading: 'See it: notes → flashcards in seconds',
      caption: 'Paste your notes, get a deck — no manual card typing like Quizlet.',
    },
    {
      type: 'comparison',
      heading: 'WriteScholar vs Quizlet',
      intro: 'A side-by-side of what you get before paying.',
      columns: ['Feature', 'WriteScholar', 'Quizlet Free'],
      rows: [
        { feature: 'Auto-generate flashcards from notes', values: ['Yes', 'No (manual only)'] },
        { feature: 'Test / quiz mode', values: ['Preview, full on Pro', 'Paid (Quizlet+)'] },
        { feature: 'Spaced repetition', values: ['Pro', 'Paid (Quizlet+)'] },
        { feature: 'Ads on study screen', values: ['None', 'Heavy ads'] },
        { feature: 'Study pack from one paste', values: ['Preview (lesson + 4 cards)', 'No'] },
        { feature: 'AI explanations of wrong answers', values: ['Pro', 'Paid'] },
        { feature: 'Includes essay checker', values: ['Yes (preview free)', 'No'] },
        { feature: 'Includes AI quiz generator', values: ['Yes (preview free)', 'No'] },
        { feature: 'Includes AI summarizer', values: ['Yes', 'No'] },
        { feature: 'Cost', values: [PRO_PRICING_CELL, '$35.99/year for Quizlet+'] },
      ],
    },
    {
      type: 'list',
      heading: 'Why students switch from Quizlet',
      items: [
        { title: 'Test mode is paywalled now', body: 'Quizlet locked Test Mode behind their $35.99/year Quizlet+ subscription in 2022. WriteScholar lets you preview study packs and quizzes on your own notes free; full quiz, game, and deck access unlocks with Pro.' },
        { title: 'Auto-generation saves hours', body: 'Building a 50-card Quizlet deck takes 30+ minutes of typing. Pasting your notes into WriteScholar generates a lesson plus sample flashcards in under a minute — preview free before upgrading.' },
        { title: 'No ads', body: 'Quizlet free is plastered with ads, including in the middle of study sessions. WriteScholar has no ads on any plan.' },
        { title: 'Better for essay-heavy classes', body: 'Most college courses need essays AND flashcards. Quizlet only handles flashcards; WriteScholar handles both, plus citations, summarisation, and rubric-based grading.' },
        { title: 'Cleaner mobile experience', body: 'Quizlet\'s mobile app pushes upgrades constantly. WriteScholar\'s mobile flow is built for studying, not selling.' },
      ],
    },
    {
      type: 'steps',
      heading: 'How to migrate from Quizlet to WriteScholar',
      steps: [
        { title: 'Export your Quizlet decks', body: 'In Quizlet, open each deck → ... menu → Export → "Set Term and Definition" → copy the text.' },
        { title: 'Sign up for WriteScholar', body: FREE_SIGNUP_STEP },
        { title: 'Import your decks', body: 'On Pro, paste exported Quizlet CSV directly. On free, paste term-definition pairs and WriteScholar parses them into a deck you can preview.' },
        { title: 'Auto-generate new decks from notes', body: 'For new classes, skip the manual creation entirely, paste your lecture notes and let the AI build the deck.' },
      ],
    },
  ],
  faqs: [
    { question: 'Is WriteScholar really free?', answer: FREE_PLAN_FAQ_ANSWER },
    { question: 'Can I import my Quizlet decks?', answer: 'Yes, paste your exported flashcards in CSV format (term,definition) or as a list of pairs. Pro plan handles bulk imports and saves decks across devices.' },
    { question: 'Does WriteScholar have spaced repetition?', answer: 'Yes — on Pro. Free previews include the lesson and first four flashcards from a study pack; spaced repetition and full deck study unlock with Pro.' },
    { question: 'How does pricing compare?', answer: 'Quizlet+ is $35.99/year ($3/mo) for flashcards only. WriteScholar Pro is $9.99 for your first month (code NEWCUSTOMER), then $19.99/mo for flashcards + essay checker + quiz gen + study packs + summarizer + citations. Better value if you need writing tools, not just cards.' },
    { question: 'Can I share decks with friends?', answer: 'On Pro, yes — share via link. Recipient can study; on Pro+ they can clone the deck into their own library.' },
    { question: 'Does it work for medical school flashcards?', answer: 'Yes. Med students use WriteScholar for anatomy, pharm, and pathology study packs. Image-card support is on Pro (drag-and-drop images for visual cues like anatomy diagrams).' },
    { question: 'Is my data private?', answer: 'Yes. Your content is encrypted, never sold, and you can delete it anytime. Pro saves sync to your account; preview runs process your paste without long-term storage unless you save on Pro.' },
    { question: 'Does it work offline?', answer: 'After loading, the flashcard study screen works offline. Generation requires internet (the AI runs on our servers, not your device).' },
  ],
  related: [
    { label: 'AI Flashcard Maker', href: '/tools/create-flashcards', teaser: 'Build decks card-by-card or auto-generate from notes.' },
    { label: 'AI Quiz Generator', href: '/tools/quiz-generator', teaser: 'Multiple-choice and fill-in quizzes from any text.' },
    { label: 'Study Pack Generator', href: '/tools/study-pack', teaser: 'Notes → 7 study tools in 60 seconds.' },
    { label: 'Knowt alternative', href: '/alternatives/knowt', teaser: 'See how WriteScholar compares to Knowt.' },
    { label: 'Course Hero alternative', href: '/alternatives/course-hero', teaser: 'A free alternative to Course Hero\'s study packs.' },
  ],
  primaryCta: { label: 'Preview WriteScholar free', page: 'signup' },
  secondaryCta: { label: 'See pricing', page: 'pricing' },
};

const knowtAlt: ProgrammaticPageConfig = {
  slug: 'knowt',
  type: 'alternative',
  metaTitle: 'Knowt Alternative, AI Flashcards + Essay Tools | WriteScholar',
  metaDescription: 'Knowt does flashcards and notes; WriteScholar does both plus AI essay feedback, summarizer, and quiz generation. The all-in-one Knowt alternative.',
  h1: 'WriteScholar, the all-in-one Knowt alternative',
  subtitle: 'Knowt is great for flashcards. WriteScholar handles flashcards, essays, quizzes, summaries, and citations, one app, one subscription.',
  eyebrow: 'Knowt alternative · Preview free',
  accent: '#1CB0F6',
  intro: 'Knowt is one of the better Quizlet alternatives, a clean flashcard app with note-taking. But if you\'re writing essays AND making flashcards (which is most college courses), you end up paying for two tools. WriteScholar bundles both: AI flashcards from notes + the essay checker, quiz generator, summarizer, and citation tools that Knowt doesn\'t have. Same single-price model, more output.',
  sections: [
    {
      type: 'media',
      kind: 'video',
      src: '/hero-quiz.mp4',
      alt: 'WriteScholar generating a multiple-choice quiz from study notes',
      heading: 'See it: a real quiz built from your notes',
      caption: 'Mixed-format quizzes (MCQ, true/false, fill-in) — the part Knowt is light on.',
    },
    {
      type: 'comparison',
      heading: 'WriteScholar vs Knowt',
      columns: ['Feature', 'WriteScholar', 'Knowt'],
      rows: [
        { feature: 'AI flashcard generation', values: ['Yes', 'Yes'] },
        { feature: 'Essay checker / grader', values: ['Yes', 'No'] },
        { feature: 'AI quiz generator', values: ['Yes', 'Limited'] },
        { feature: 'AI summarizer', values: ['Yes', 'No'] },
        { feature: 'Citation generator (APA/MLA/Chicago)', values: ['Yes', 'No'] },
        { feature: 'Notes editor', values: ['Coming', 'Yes'] },
        { feature: 'Free previews', values: ['Yes (lifetime)', 'Yes'] },
        { feature: 'iOS + Android apps', values: ['Yes', 'Yes'] },
      ],
    },
    {
      type: 'list',
      heading: 'When to pick WriteScholar over Knowt',
      items: [
        { title: 'You write essays', body: 'Most college majors require essay writing. WriteScholar grades essays with rubric-based feedback; Knowt doesn\'t.' },
        { title: 'You want one app, not three', body: 'Knowt + Grammarly + Zotero = three subscriptions. WriteScholar bundles flashcards + essay checker + citation generator into one.' },
        { title: 'You need quiz generation that mixes formats', body: 'WriteScholar generates multiple-choice, true/false, AND fill-in-blank from one input. Knowt is more limited.' },
      ],
    },
    {
      type: 'list',
      heading: 'When to pick Knowt over WriteScholar',
      items: [
        { title: 'You only want note-taking + flashcards', body: 'If you don\'t need essay tools, Knowt\'s notes-first design might fit better.' },
        { title: 'You\'re a heavy notes-importer', body: 'Knowt has more polished note-importing from PDFs and Google Docs. WriteScholar is catching up.' },
      ],
    },
  ],
  faqs: [
    { question: 'How does pricing compare?', answer: 'Both let you try before paying. WriteScholar Pro is $9.99 for your first month (NEWCUSTOMER), then $19.99/mo — Knowt Pro is in a similar range. The decision usually comes down to whether you need essay tools and study packs (WriteScholar) or polished notes (Knowt).' },
    { question: 'Can I import from Knowt?', answer: 'Yes, export your Knowt flashcard decks to CSV and paste into WriteScholar. We also accept term/definition pairs as plain text.' },
    { question: 'Does WriteScholar have a notes editor?', answer: 'A lightweight one is in beta. For heavy note-taking, pair WriteScholar with Notion or Google Docs and paste content into the AI tools when you need to study from it.' },
    { question: 'Are the flashcard study modes the same?', answer: 'Both apps have flip + shuffle + spaced repetition. WriteScholar also has explanation cards (AI-generated explanations of why an answer is wrong) on Pro.' },
    { question: 'Which is better for STEM?', answer: 'WriteScholar, the quiz generator + flashcards + summarizer combo handles dense STEM material faster. Knowt is better for humanities-style note-taking.' },
    { question: 'Can I use both?', answer: 'Sure, many students use Knowt for note-taking and WriteScholar for the AI study tools. They\'re complementary, not strictly competing.' },
  ],
  related: [
    { label: 'Quizlet alternative', href: '/alternatives/quizlet', teaser: 'How WriteScholar compares to Quizlet.' },
    { label: 'AI Flashcard Maker', href: '/tools/create-flashcards', teaser: 'Build flashcards from notes automatically.' },
    { label: 'AI Quiz Generator', href: '/tools/quiz-generator', teaser: 'Mixed-format quizzes from any text.' },
  ],
  primaryCta: { label: 'Preview WriteScholar free', page: 'signup' },
  secondaryCta: { label: 'See pricing', page: 'pricing' },
};

const courseHeroAlt: ProgrammaticPageConfig = {
  slug: 'course-hero',
  type: 'alternative',
  metaTitle: 'Course Hero Alternative, Study Tools From Your Notes | WriteScholar',
  metaDescription: 'Course Hero charges $40/mo to unlock student-uploaded notes. WriteScholar turns your own notes into flashcards, quizzes, and study packs — preview free on your own work.',
  h1: 'WriteScholar, the Course Hero alternative that uses YOUR notes',
  subtitle: 'Course Hero locks other students\' notes behind a paywall. WriteScholar turns your own notes into flashcards, quizzes, and study packs — preview free, no upload of others\' work.',
  eyebrow: 'Course Hero alternative · Preview free',
  accent: '#FF9600',
  intro: 'Course Hero\'s model is "pay $40/month to access notes other students uploaded." That model has problems: it\'s expensive, the notes are often poorly transcribed, and many universities flag Course Hero use as academic dishonesty. WriteScholar is a fundamentally different tool — you paste YOUR notes, and AI generates study tools from them. Preview the results free on your own work; Pro unlocks full decks, quizzes, and exports. No document paywall, no integrity risk.',
  sections: [
    {
      type: 'media',
      kind: 'image',
      src: '/daily-review-preview.png',
      alt: 'WriteScholar daily review screen built from a student\'s own study materials',
      heading: 'See it: study tools built from YOUR notes',
      caption: 'Everything is generated from material you already have — no document marketplace.',
    },
    {
      type: 'comparison',
      heading: 'WriteScholar vs Course Hero',
      columns: ['Feature', 'WriteScholar', 'Course Hero'],
      rows: [
        { feature: 'Source material', values: ['Your own notes', 'Other students\' uploads'] },
        { feature: 'Cost', values: [PRO_PRICING_CELL, '$39.99/mo'] },
        { feature: 'Document paywall', values: ['Preview free, Pro unlocks full', 'Yes, most docs locked'] },
        { feature: 'Academic integrity risk', values: ['Low (your work)', 'High (using others\' notes)'] },
        { feature: 'Auto-generated flashcards', values: ['Yes', 'No'] },
        { feature: 'AI essay checker', values: ['Yes', 'No (different "essay help" model)'] },
        { feature: 'Quiz generator', values: ['Yes', 'No'] },
        { feature: 'Quality of source material', values: ['Your own (consistent)', 'Variable (depends on uploader)'] },
      ],
    },
    {
      type: 'list',
      heading: 'Why students switch from Course Hero',
      items: [
        { title: '$40/month for one tool is a lot', body: 'Course Hero charges nearly twice WriteScholar Pro for a single feature (document access). WriteScholar Pro includes essay checker, flashcards, quiz gen, summarizer, and citations.' },
        { title: 'Universities are cracking down', body: 'Many schools (especially med + law) consider Course Hero use a violation of academic integrity policies. The paper trail through your account is easy for them to find. WriteScholar use is unambiguous, it\'s your own notes.' },
        { title: 'Other students\' notes vary in quality', body: 'Some Course Hero documents are excellent; others are wrong or incomplete. Studying from bad notes is worse than studying from no notes.' },
        { title: 'You learn more from your own notes', body: 'Active engagement with material you wrote outperforms passive reading of others\' work. WriteScholar maximises learning by making your own notes the source.' },
      ],
    },
  ],
  faqs: [
    { question: 'Can WriteScholar give me access to past exams?', answer: 'No, and that\'s a feature, not a bug. Past exam access from Course Hero often violates academic integrity policies. WriteScholar focuses on legitimate study tools built from your own notes.' },
    { question: 'How much does WriteScholar cost compared to Course Hero?', answer: 'WriteScholar Pro is $9.99 for your first month (NEWCUSTOMER), then $19.99/mo. Course Hero is $39.99/mo (or $9.95/mo annual). Less than half the price for Pro, and you study from your own notes.' },
    { question: 'Will my professor consider WriteScholar academic dishonesty?', answer: 'Generating flashcards from your own lecture notes is unambiguously fine, same as making them by hand. AI essay grading is also fine when used as feedback (you don\'t submit AI-generated text). When in doubt, ask your professor what tools are allowed.' },
    { question: 'Can I upload PDFs of textbooks?', answer: 'Yes, paste textbook content (your own copies) and the AI generates study tools. Note: copying entire copyrighted textbooks for distribution is illegal; using them privately for study is generally fine.' },
    { question: 'Does it work for med school study packs?', answer: 'Yes. WriteScholar\'s study pack feature is popular with med students for converting lecture transcripts into flashcards + quizzes + summaries in 60 seconds.' },
    { question: 'Is my paste content private?', answer: 'Yes. Pasted notes are processed for tool generation. Preview content is not stored long-term unless you save on Pro. We never sell or train on your work.' },
  ],
  related: [
    { label: 'Quizlet alternative', href: '/alternatives/quizlet', teaser: 'How WriteScholar compares to Quizlet.' },
    { label: 'Chegg alternative', href: '/alternatives/chegg', teaser: 'A cheaper, integrity-safer alternative to Chegg.' },
    { label: 'Study Pack Generator', href: '/tools/study-pack', teaser: 'Notes → 7 tools in 60 seconds.' },
  ],
  primaryCta: { label: 'Preview study tools free', page: 'signup' },
  secondaryCta: { label: 'See pricing', page: 'pricing' },
};

const cheggAlt: ProgrammaticPageConfig = {
  slug: 'chegg',
  type: 'alternative',
  metaTitle: 'Chegg Alternative, AI Study Tools, No Subscription Trap | WriteScholar',
  metaDescription: 'Chegg charges $19.95/mo for textbook answers + tutoring. WriteScholar charges similar for AI essay feedback, flashcards, quizzes, and citations, and won\'t flag your account.',
  h1: 'A Chegg alternative students aren\'t scared to use',
  subtitle: 'Same price as Chegg Study, completely different value: AI essay feedback, flashcards from your notes, quiz generator, and citations, without the academic-integrity risk.',
  eyebrow: 'Chegg alternative · Preview free',
  accent: '#58CC02',
  intro: 'Chegg has a brand problem. Universities now actively monitor Chegg accounts for evidence of homework-answer cheating, and many schools have expelled students whose Chegg activity matched test answers. WriteScholar is the opposite tool: it\'s an AI study coach that generates flashcards from your notes, gives essay feedback (without writing essays for you), and helps you understand material, none of which trips academic integrity sensors.',
  sections: [
    {
      type: 'media',
      kind: 'image',
      src: '/full-report.png',
      alt: 'WriteScholar essay analysis report with grade estimate and rubric scores',
      heading: 'See it: feedback, not answer keys',
      caption: 'A professor-style grade and rubric on your own draft — the legitimate kind of help.',
    },
    {
      type: 'comparison',
      heading: 'WriteScholar vs Chegg',
      columns: ['Feature', 'WriteScholar', 'Chegg Study'],
      rows: [
        { feature: 'AI essay feedback (rubric + revision)', values: ['Yes', 'Limited'] },
        { feature: 'Auto-generated flashcards', values: ['Yes', 'No'] },
        { feature: 'AI quiz generator', values: ['Yes', 'No'] },
        { feature: 'Citation generator', values: ['Yes', 'Yes'] },
        { feature: 'Textbook step-by-step answers', values: ['No (intentionally)', 'Yes, primary feature'] },
        { feature: 'Live tutoring', values: ['No', 'Yes (paid extra)'] },
        { feature: 'Academic integrity flag risk', values: ['Low', 'High'] },
        { feature: 'Cost', values: [PRO_PRICING_CELL, '$19.95/mo'] },
      ],
    },
    {
      type: 'list',
      heading: 'Why students are leaving Chegg',
      items: [
        { title: 'Universities monitor Chegg accounts', body: 'When test answers match Chegg solutions, schools subpoena Chegg for the user account. Several universities have expelled students based on this evidence.' },
        { title: 'Auto-renewal traps', body: 'Chegg famously auto-renews monthly without strong cancellation reminders. Many students get charged for months they didn\'t use.' },
        { title: 'Solution quality varies', body: 'Chegg\'s "expert" solutions are often outsourced to gig workers and contain errors. Studying from wrong solutions is worse than not having them.' },
        { title: 'Doesn\'t teach, gives answers', body: 'Even when used legitimately, Chegg\'s "show me the answer" model doesn\'t build understanding. WriteScholar\'s study tools require you to engage with the material.' },
      ],
    },
  ],
  faqs: [
    { question: 'Can WriteScholar solve my homework problems?', answer: 'No, that\'s by design. WriteScholar generates flashcards, quizzes, summaries, and essay feedback FROM your notes. It doesn\'t solve textbook problems, which is exactly the feature that gets students in trouble with academic integrity offices.' },
    { question: 'Will my school flag WriteScholar use?', answer: 'No. Generating flashcards from lecture notes and using AI essay feedback (when you don\'t submit AI-generated text) is consistent with academic integrity policies at virtually every university.' },
    { question: 'How does pricing compare?', answer: 'WriteScholar Pro is $9.99 for your first month (NEWCUSTOMER), then $19.99/mo; Chegg Study is $19.95/mo. Similar headline price, very different feature sets — WriteScholar focuses on study tools from your notes, not textbook answer keys.' },
    { question: 'Does WriteScholar do tutoring?', answer: 'Not live human tutoring. The AI tools (essay checker with explanations, quiz generator with explanations) function as on-demand learning support, but if you need a real tutor we recommend Wyzant or your school\'s tutoring center.' },
    { question: 'Can I cancel anytime?', answer: 'Yes, cancel via the billing settings page in 30 seconds. No retention scripts, no "are you sure?" loops. We don\'t auto-renew without notice.' },
    { question: 'Does WriteScholar have textbook solutions?', answer: 'No. Use your textbook + WriteScholar to generate practice problems and study tools, but the worked solutions to specific textbook problems aren\'t our feature.' },
  ],
  related: [
    { label: 'Course Hero alternative', href: '/alternatives/course-hero', teaser: 'How WriteScholar compares to Course Hero.' },
    { label: 'AI Essay Checker', href: '/tools/analyze', teaser: 'Get professor-level essay feedback.' },
    { label: 'AI Quiz Generator', href: '/tools/quiz-generator', teaser: 'Generate practice quizzes from notes.' },
  ],
  primaryCta: { label: 'Preview WriteScholar free', page: 'signup' },
  secondaryCta: { label: 'See pricing', page: 'pricing' },
};

const grammarlyAlt: ProgrammaticPageConfig = {
  slug: 'grammarly',
  type: 'alternative',
  metaTitle: 'Grammarly Alternative, AI Essay Feedback + Grammar Check | WriteScholar',
  metaDescription: 'WriteScholar combines a free grammar checker with full AI essay feedback (grade, rubric, line-by-line revision). The Grammarly alternative built for students.',
  h1: 'WriteScholar, Grammarly for students who actually need essay feedback',
  subtitle: 'A free grammar checker + a full AI essay grader with rubric scores, line-by-line annotations, and a polished revision. One tool, no $30/month subscription.',
  eyebrow: 'Grammarly alternative · Preview free',
  accent: '#58CC02',
  intro: 'Grammarly is great at one thing: catching grammar and spelling errors as you type. But for college students, "your writing is grammatically correct" doesn\'t earn As — strong arguments, clear theses, and rubric-aligned structure do. WriteScholar combines a free grammar checker with AI essay feedback (grade, rubric, line-by-line notes) you can preview on your own draft free. Pro unlocks full fixes and one-click apply. Plus thesis generator, outline generator, and citation tools Grammarly doesn\'t have.',
  sections: [
    {
      type: 'media',
      kind: 'video',
      src: '/hero-vid.mp4',
      poster: '/hero-vid-poster.jpg',
      alt: 'WriteScholar grading an essay with a rubric and line-by-line fixes in the editor',
      heading: 'See it: grade + fixes, not just grammar',
      caption: 'Write in a real editor, get a professor-style grade — then apply fixes in one click.',
    },
    {
      type: 'comparison',
      heading: 'WriteScholar vs Grammarly',
      columns: ['Feature', 'WriteScholar', 'Grammarly Free', 'Grammarly Premium'],
      rows: [
        { feature: 'Grammar + spell check', values: ['Yes', 'Yes', 'Yes'] },
        { feature: 'Essay grade + rubric scores', values: ['Yes', 'No', 'Limited'] },
        { feature: 'Line-by-line annotations', values: ['Yes', 'No', 'No (style only)'] },
        { feature: 'AI revision of your essay', values: ['Yes', 'No', 'Yes (paraphrasing)'] },
        { feature: 'Thesis statement generator', values: ['Yes', 'No', 'No'] },
        { feature: 'Essay outline generator', values: ['Yes', 'No', 'No'] },
        { feature: 'Citation generator', values: ['Yes', 'No', 'Yes'] },
        { feature: 'Browser extension', values: ['Coming', 'Yes', 'Yes'] },
        { feature: 'Cost', values: [PRO_PRICING_CELL, 'Free', '$30/mo'] },
      ],
    },
    {
      type: 'list',
      heading: 'When WriteScholar beats Grammarly',
      items: [
        { title: 'You need essay feedback, not just grammar', body: 'Grammarly tells you "this sentence has a comma splice." WriteScholar tells you "your thesis is too broad, here are 3 ways to narrow it." Different problem solved.' },
        { title: 'You\'re writing for grades, not professional emails', body: 'Grammarly\'s sweet spot is workplace email. WriteScholar is built for academic writing with rubric-based feedback aligned to how professors actually grade.' },
        { title: 'You want all your writing tools in one place', body: 'Grammarly + EasyBib + Outline Builder = three subscriptions. WriteScholar bundles them.' },
        { title: 'Cost matters', body: 'Grammarly Premium is $30/mo. WriteScholar Pro is $9.99 for your first month (NEWCUSTOMER), then $19.99/mo — with essay rubrics and study tools Grammarly doesn\'t include.' },
      ],
    },
    {
      type: 'list',
      heading: 'When Grammarly might be better',
      items: [
        { title: 'You write a lot of email', body: 'Grammarly\'s real-time browser extension is unmatched for catching errors as you type in Gmail, Slack, etc.' },
        { title: 'You\'re a non-academic professional', body: 'For business writing, Grammarly\'s tone analysis and clarity suggestions are well-tuned. WriteScholar focuses on academic-style feedback.' },
      ],
    },
  ],
  faqs: [
    { question: 'Does WriteScholar have a browser extension?', answer: 'A Chrome extension is in beta. For now, paste text into the web app or use the iOS/Android apps.' },
    { question: 'How does the essay grader work?', answer: 'Paste your essay; AI analyzes against a rubric (thesis, structure, evidence, style, mechanics) and returns an overall grade plus per-criterion scores. Includes line-by-line annotations and a polished revision.' },
    { question: 'Is the grammar checker as accurate as Grammarly?', answer: 'For common errors (typos, missing commas, run-ons, agreement), yes. Grammarly\'s premium tier catches more subtle stylistic issues. WriteScholar\'s strength is the essay-level feedback Grammarly doesn\'t do.' },
    { question: 'Can I use both?', answer: 'Sure, many students use Grammarly free for in-line corrections while drafting, then run the finished essay through WriteScholar for grade-level feedback.' },
    { question: 'Does WriteScholar do plagiarism detection?', answer: 'Not included. Most universities provide Turnitin access (the gold standard); we don\'t try to compete with it. Use WriteScholar for draft feedback before you submit.' },
    { question: 'What about the AI writing detector?', answer: 'WriteScholar doesn\'t flag AI-written text. The strongest signal that something was AI-generated is its style, robotic, evenly-paced, overuse of "moreover" and "furthermore". A grammar checker won\'t catch it; a human reader will.' },
    { question: 'How does pricing compare?', answer: 'Grammarly Premium: $30/mo (or $144/year). WriteScholar Pro: $9.99 first month (NEWCUSTOMER), then $19.99/mo — roughly 33% cheaper on ongoing monthly, with academic rubrics and study tools Grammarly doesn\'t have.' },
  ],
  related: [
    { label: 'AI Essay Checker', href: '/tools/analyze', teaser: 'Free grade + rubric + revision.' },
    { label: 'Grammar Checker', href: '/tools/grammar-checker', teaser: 'Free grammar + spelling pass.' },
    { label: 'Thesis Generator', href: '/tools/thesis-generator', teaser: 'Build a strong thesis statement.' },
    { label: 'Quizlet alternative', href: '/alternatives/quizlet', teaser: 'How WriteScholar compares to Quizlet.' },
  ],
  primaryCta: { label: 'Preview the essay checker', page: 'analyze' },
  secondaryCta: { label: 'See pricing', page: 'pricing' },
};

/* ─── ESSAY GUIDES, /guides/[topic] ──────────────────────────── */

interface EssayGuideMeta {
  slug: string;
  type: string;          // "argumentative", "persuasive", etc.
  niceName: string;      // "argumentative essay"
  shortName: string;     // "argumentative"
  intro: string;
  structure: { title: string; body: string }[];
  examples: { label: string; before: string; after: string; explanation: string }[];
  mistakes: { title: string; body: string }[];
  faqs: { question: string; answer: string }[];
}

const ESSAY_GUIDES_META: EssayGuideMeta[] = [
  {
    slug: 'how-to-write-argumentative-essay',
    type: 'argumentative',
    niceName: 'argumentative essay',
    shortName: 'argumentative',
    intro: 'An argumentative essay defends a debatable position with evidence. The keyword is "debatable", if no reasonable person could disagree with your thesis, it\'s not argumentative, it\'s expository. Strong argumentative essays do four things: state a clear thesis, support it with evidence, address counterarguments, and close with implications.',
    structure: [
      { title: '1. Introduction (5-10% of essay)', body: 'Hook → context → thesis. The hook grabs attention (anecdote, statistic, provocative claim). Context briefly explains why the topic matters. The thesis (last sentence) states your specific argument.' },
      { title: '2. Body Paragraph 1, Strongest argument (20-25%)', body: 'Lead with your strongest reason. Topic sentence states the claim, then 2-3 pieces of evidence (data, expert opinion, examples), then commentary tying evidence to thesis.' },
      { title: '3. Body Paragraph 2, Second argument (20-25%)', body: 'Same structure, second strongest reason. Use a transition that builds on paragraph 1 ("Beyond economic effects, X also affects...").' },
      { title: '4. Counterargument paragraph (15-20%)', body: 'Acknowledge the strongest opposing view. Then refute it, show why your position still holds. This is what separates a B essay from an A essay.' },
      { title: '5. Conclusion (10-15%)', body: 'Restate the thesis (in different words) → summarise key points → end with a "so what", implications, applications, or unanswered questions.' },
    ],
    examples: [
      { label: 'Weak vs strong thesis', before: 'Social media is bad for teenagers.', after: 'Federal regulation of algorithmic content recommendations would reduce teen anxiety more effectively than age-verification laws because algorithms drive engagement-maximization, not well-being.', explanation: 'Specific (federal regulation), debatable (vs age verification), supported (because clause). All three thesis criteria met.' },
      { label: 'Topic sentence, vague vs sharp', before: 'There are many reasons climate change is bad.', after: 'Climate change\'s most underestimated cost is the gradual collapse of insurable risk in coastal real estate.', explanation: 'Sharp topic sentences make a specific claim that the paragraph then defends. Vague ones drift.' },
    ],
    mistakes: [
      { title: 'Writing a thesis that\'s a fact', body: '"Climate change is real", not arguable. A thesis must take a position someone could disagree with.' },
      { title: 'Skipping the counterargument', body: 'Without addressing the opposing view, your essay reads like a strawman attack on a position no one actually holds. Counterarguments demonstrate intellectual honesty and force you to refine your argument.' },
      { title: 'Citing without analysing', body: 'Dropping in a quote from an expert isn\'t evidence, it\'s decoration. Always follow with 2-3 sentences explaining what the quote means and how it supports your point.' },
      { title: 'Writing a conclusion that just summarises', body: 'A conclusion should leave the reader with something, implications, a call to action, or an unanswered question. Pure summary wastes the most important paragraph.' },
    ],
    faqs: [
      { question: 'How long should an argumentative essay be?', answer: 'Standard college essay: 1,500-2,000 words. AP Lang: 600-900. Op-ed: 800-1,200. The length determines how many body paragraphs (3 for short, 5+ for longer).' },
      { question: 'How many sources should I cite?', answer: 'Rule of thumb: 1 source per 200-300 words. A 1,500-word essay should cite 5-8 sources. More than 15 starts looking like padding; fewer than 3 reads as under-researched.' },
      { question: 'Can I use "I" in an argumentative essay?', answer: 'Sometimes. Most academic styles prefer third-person impersonal ("This essay argues..."). Op-eds and personal-stake essays accept first-person. Check your professor\'s preference.' },
      { question: 'Do I need a counterargument paragraph?', answer: 'For any essay over 1,000 words, yes. The counterargument is what separates a B essay from an A essay, it shows you considered alternatives.' },
      { question: 'How do I find evidence for my argument?', answer: 'Start with Google Scholar for academic sources. Use your school library\'s database access for journal articles. Avoid Wikipedia as a primary source; use it to find primary sources via the references list.' },
      { question: 'Should I use rhetorical questions?', answer: 'Sparingly. One per essay is fine for emphasis; more reads as filler. Always answer rhetorical questions you ask, leaving them dangling is amateur.' },
    ],
  },
  {
    slug: 'how-to-write-persuasive-essay',
    type: 'persuasive',
    niceName: 'persuasive essay',
    shortName: 'persuasive',
    intro: 'A persuasive essay aims to convince the reader to take a position or action. It\'s closely related to argumentative essays but differs in tone, persuasive essays use more emotional appeals (pathos), more direct calls to action, and less formal evidence than argumentative essays. Common contexts: op-eds, college admissions essays, advocacy writing.',
    structure: [
      { title: '1. Hook + position (intro)', body: 'Open with something that creates emotional stake, a story, a statistic that shocks, a question that implicates the reader. State your position by the end of the intro.' },
      { title: '2. Evidence + emotion (body 1-3)', body: 'Each body paragraph builds the case. Persuasive writing weaves logical evidence (facts, expert opinion) with emotional appeals (stories, personal stakes).' },
      { title: '3. Counterargument acknowledgment', body: 'Briefly acknowledge the opposing view, showing you understand it builds credibility, then return to your position.' },
      { title: '4. Call to action (conclusion)', body: 'Persuasive essays end with a specific action you want the reader to take. "We should reform student loans" → "Contact your representative to support HR 1234."' },
    ],
    examples: [
      { label: 'Logical vs emotional appeal', before: 'Studies show that 40% of student debt holders default within 12 years of graduation.', after: 'Studies show that 40% of student debt holders default within 12 years of graduation, including my brother, who lost his car when his loan servicer froze his account.', explanation: 'The personal anecdote turns a statistic into a story. Persuasive essays use both.' },
    ],
    mistakes: [
      { title: 'Pure emotion, no evidence', body: 'Without facts, persuasion reads as manipulation. Mix anecdotes with hard data.' },
      { title: 'Weak call to action', body: '"Something should be done" isn\'t a call to action. "Sign this petition by Friday" or "Vote yes on Prop 12" is.' },
      { title: 'Ignoring opposition', body: 'Pretending the other side has no points reads as dishonest. Acknowledge, then refute.' },
    ],
    faqs: [
      { question: 'What\'s the difference between argumentative and persuasive?', answer: 'Argumentative is more formal, evidence-heavy, and aims for intellectual conviction. Persuasive uses emotion + evidence and aims for action. Both have theses; persuasive has a clearer call to action.' },
      { question: 'Can I use rhetorical devices in a persuasive essay?', answer: 'Yes, repetition, parallelism, anaphora, and rhetorical questions are all persuasive tools. Use sparingly so they remain effective.' },
      { question: 'Should I use "you" to address the reader?', answer: 'Often, yes. "You" creates intimacy and direct stakes ("Your taxes pay for this..."). Don\'t overuse it; second-person can feel accusatory.' },
      { question: 'How long should it be?', answer: 'Op-eds: 600-900 words. School persuasive essays: 1,000-1,500. Advocacy memos: 500-1,000. Shorter is usually better, persuasion thrives on focus.' },
      { question: 'Can persuasive essays use "I"?', answer: 'Yes, first-person is common in persuasive writing because personal stakes increase credibility.' },
    ],
  },
  {
    slug: 'how-to-write-narrative-essay',
    type: 'narrative',
    niceName: 'narrative essay',
    shortName: 'narrative',
    intro: 'A narrative essay tells a true story, usually personal, that illustrates a larger point. Common formats: college admissions essays, memoirs, "what I learned" reflections. Strong narratives have a clear arc: setup, conflict, turning point, reflection. The biggest mistake new narrative writers make is summarising instead of scening.',
    structure: [
      { title: '1. Hook, drop the reader into the moment', body: 'Skip the "I was born in..." opener. Start in scene: a specific moment that signals the story\'s stakes. "I was halfway up the rock face when my carabiner snapped."' },
      { title: '2. Setup (briefly establish context)', body: 'In 2-3 sentences, establish enough background that the reader understands the situation. Don\'t over-explain, readers fill in gaps.' },
      { title: '3. Conflict / rising tension', body: 'What\'s the obstacle? Internal (your fear, doubt) or external (a person, a situation)? The conflict drives the narrative.' },
      { title: '4. Turning point', body: 'The moment something changes, a realisation, a decision, an external event. This is the heart of the essay; spend the most words here.' },
      { title: '5. Reflection (the "why this matters")', body: 'What did you learn? How are you different now? Don\'t just state it, show the change in how you think or act. The reflection is what elevates a narrative essay from anecdote to argument.' },
    ],
    examples: [
      { label: 'Telling vs showing', before: 'I was nervous before the speech.', after: 'I rehearsed the opening line for the eighth time, my mouth so dry I could feel my tongue stick to my teeth.', explanation: 'Showing uses sensory detail. Telling labels the emotion. Narrative essays should mostly show.' },
      { label: 'Generic vs specific reflection', before: 'I learned that hard work pays off.', after: 'I learned that the version of me who said yes to the climbing trip, terrified, unprepared, certain I\'d fail, was the version that became someone I respected.', explanation: 'Generic reflections sound like greeting cards. Specific reflections sound earned.' },
    ],
    mistakes: [
      { title: 'Summarising instead of scening', body: '"Then I went to the store and bought milk and went home" is summary. Pick the moments that matter and scene them.' },
      { title: 'Writing the reflection as a lecture', body: '"This taught me that..." preaches at the reader. Better: show how you act differently now, so the reader infers the lesson.' },
      { title: 'Skipping the conflict', body: 'A narrative without conflict is a journal entry, not an essay. Find the friction.' },
    ],
    faqs: [
      { question: 'How long should a narrative essay be?', answer: 'College admissions: 500-650 words (Common App). Class assignments: 1,000-2,000. Memoirs: longer.' },
      { question: 'Does it need to be 100% true?', answer: 'For non-fiction narrative essays, yes, but you can compress timelines, combine minor characters, and reconstruct dialogue. The emotional truth must be honest.' },
      { question: 'Can I write in present tense?', answer: 'Yes, present tense creates immediacy. Past tense is more traditional. Pick one and stay consistent throughout.' },
      { question: 'How much dialogue should I include?', answer: '1-3 lines of pivotal dialogue is powerful. More than that and you\'re writing a screenplay, not an essay.' },
      { question: 'Do I need a thesis?', answer: 'Not in the argumentative sense. The "thesis" of a narrative is the lesson learned, usually shown, not stated explicitly.' },
    ],
  },
  {
    slug: 'how-to-write-expository-essay',
    type: 'expository',
    niceName: 'expository essay',
    shortName: 'expository',
    intro: 'An expository essay explains a topic clearly and objectively. Unlike argumentative essays, expository essays don\'t take a side, they present information. Common types: definition essays, process essays, cause-effect essays, classification essays. Strength comes from clarity, organisation, and evidence, not from rhetorical force.',
    structure: [
      { title: '1. Introduction', body: 'Define your topic and preview your structure. State your "thesis", usually a clear statement of what the essay will explain.' },
      { title: '2. Body, organised around your subtype', body: 'Definition: term + components + examples. Process: chronological steps. Cause-effect: causes → effects. Classification: categories → examples.' },
      { title: '3. Evidence-based explanation', body: 'Each body paragraph cites sources or examples. No personal opinion, just clear, accurate information.' },
      { title: '4. Conclusion', body: 'Restate the topic\'s significance, summarise the main points, and (optionally) suggest implications or further questions.' },
    ],
    examples: [
      { label: 'Argumentative vs expository thesis', before: 'Argumentative: "Climate change should be addressed through carbon taxes."', after: 'Expository: "Climate change refers to long-term shifts in global temperature patterns, caused primarily by greenhouse gas emissions from human activity."', explanation: 'Expository explains; argumentative argues.' },
    ],
    mistakes: [
      { title: 'Sneaking in opinions', body: 'Expository essays are objective. "X is wrong" doesn\'t belong; "X is contested by Y" does.' },
      { title: 'Disorganised structure', body: 'Without clear chronological/logical/categorical organisation, expository essays read as scattered notes.' },
      { title: 'Citing one source repeatedly', body: 'Look for 3-5 different sources to triangulate your facts. One source is a single viewpoint.' },
    ],
    faqs: [
      { question: 'Can expository essays have a thesis?', answer: 'Yes, but it states what the essay will explain, not what the writer believes. "This essay explains the causes of the French Revolution" is an expository thesis.' },
      { question: 'What\'s the difference from a research paper?', answer: 'Research papers contribute new analysis or argue a position based on evidence. Expository essays explain established knowledge.' },
      { question: 'How many sources should I cite?', answer: 'For a 1,500-word expository essay, aim for 5-10 sources, all with proper citation in your professor\'s required style.' },
      { question: 'Can I use first person?', answer: 'Most styles say no. Stick with third-person impersonal ("This essay shows..."). Some professors accept first-person; check.' },
    ],
  },
  {
    slug: 'how-to-write-analytical-essay',
    type: 'analytical',
    niceName: 'analytical essay',
    shortName: 'analytical',
    intro: 'An analytical essay breaks down a text, idea, or work to interpret what it means and how it achieves its effects. Most common context: literature classes ("Analyse Toni Morrison\'s use of memory in Beloved") or rhetorical analysis ("How does this speech persuade?"). Analytical essays don\'t summarise, they argue an interpretation.',
    structure: [
      { title: '1. Intro with interpretive thesis', body: 'State your interpretation, what the work means, how it works, why it matters. "Morrison uses second-person narration in Beloved to force the reader into Sethe\'s memory loops."' },
      { title: '2. Body paragraphs by aspect', body: 'Each paragraph analyses one aspect of the work, a literary device, a section, a recurring image. Cite specific evidence (quotes, scene references) and explain its effect.' },
      { title: '3. Connect aspects to thesis', body: 'Don\'t just list features. Each paragraph should advance your interpretation by showing how a specific aspect supports your thesis.' },
      { title: '4. Conclusion, synthesise interpretation', body: 'Restate the interpretation in light of evidence presented. Suggest broader implications, what does this analysis tell us about literature, society, or rhetoric?' },
    ],
    examples: [
      { label: 'Summary vs analysis', before: 'In Beloved, Sethe killed her daughter to keep her from being a slave.', after: 'Morrison stages Sethe\'s killing of her daughter not as a moral crisis but as an act of love, a reading the novel\'s narration both invites and complicates.', explanation: 'Summary lists events. Analysis interprets meaning.' },
    ],
    mistakes: [
      { title: 'Plot summary instead of analysis', body: 'Don\'t recap the story. Assume the reader has read the text. Focus on what specific details mean.' },
      { title: 'Quote-dropping without commentary', body: 'A quote alone is not analysis. Always explain what the quote does, how it works, what it means, why it matters.' },
      { title: 'No clear interpretive claim', body: 'Without a thesis stating your interpretation, the essay is just observation. Take a stand.' },
    ],
    faqs: [
      { question: 'How is analytical different from argumentative?', answer: 'Argumentative defends a position the reader could agree or disagree with. Analytical defends an interpretation of a text or work, also debatable, but the stakes are interpretive rather than political.' },
      { question: 'How many quotes should I use?', answer: 'Quote selectively. One short quote per paragraph (8-15 words) is typical. Long block quotes only when the passage is essential and can\'t be paraphrased.' },
      { question: 'Can I write about themes?', answer: 'Yes, but theme alone isn\'t a thesis. "Beloved is about memory" is observation. "Morrison uses fragmented memory to mirror trauma\'s structure" is analytical.' },
      { question: 'Should I cite secondary sources (literary critics)?', answer: 'For undergraduate analytical essays, 1-3 secondary sources strengthen your argument. For grad-level work, 5+. Be careful not to let critics dominate your voice.' },
    ],
  },
  {
    slug: 'how-to-write-research-paper',
    type: 'research',
    niceName: 'research paper',
    shortName: 'research',
    intro: 'A research paper investigates a question using primary and secondary sources, presents findings, and contributes original analysis. Length: typically 8-25 pages for undergrad; longer for theses. Structure varies by field, humanities use intro/body/conclusion; sciences use intro/methods/results/discussion (IMRaD). Either way, the research paper is your most evidence-heavy assignment.',
    structure: [
      { title: '1. Introduction (~10%)', body: 'State the research question, why it matters, and your thesis (what your paper will argue or find). Include a brief literature review showing what\'s already known.' },
      { title: '2. Literature review (~20%)', body: 'Survey existing scholarship on your question. Group sources by argument or theme, don\'t just list them. Identify the gap your paper addresses.' },
      { title: '3. Methodology (sciences) or theoretical framework (humanities)', body: 'Sciences: how did you collect data? Humanities: what theoretical lens (Marxist, feminist, structuralist) shapes your analysis?' },
      { title: '4. Findings / analysis (~40%)', body: 'Present your evidence and what it shows. Use sub-headings. Tables, charts, and figures help in sciences; close reading of texts in humanities.' },
      { title: '5. Discussion (~15%)', body: 'Interpret your findings in light of the literature review. What does it mean? What are the limitations? What does it imply for the field?' },
      { title: '6. Conclusion + bibliography (~10%)', body: 'Restate the contribution. Suggest future research directions. Bibliography in your assigned style (APA, MLA, Chicago).' },
    ],
    examples: [
      { label: 'Topic vs research question', before: 'Topic: Climate change and migration', after: 'Research question: How have rising sea levels in Bangladesh affected migration patterns to urban centers between 2000-2020?', explanation: 'Topics are unfocused. Research questions specify what, where, when, making the paper feasible.' },
    ],
    mistakes: [
      { title: 'Too broad a research question', body: '"What causes climate change?" cannot be answered in 15 pages. Narrow ruthlessly: a specific population, a specific time period, a specific mechanism.' },
      { title: 'Insufficient sources', body: 'Most rubrics require 10-20 sources for an undergrad research paper. Submitting with 5 reads as under-researched.' },
      { title: 'Citing only secondary sources', body: 'Strong research papers ground claims in primary sources (raw data, original texts) supplemented by secondary scholarship. All-secondary papers read as derivative.' },
      { title: 'Burying the contribution', body: 'Make clear what YOUR paper adds. The literature review establishes context; the analysis must clearly extend it.' },
    ],
    faqs: [
      { question: 'How long should it be?', answer: 'Undergrad research paper: 8-15 pages (~2,500-4,000 words). Senior thesis: 30-60 pages. Master\'s thesis: 80-150 pages. Doctoral dissertation: 200+ pages.' },
      { question: 'How many sources?', answer: 'Undergrad: 10-20 sources for a 15-page paper. Aim for 1 source per page minimum. Senior thesis: 30-50.' },
      { question: 'What\'s the difference between primary and secondary sources?', answer: 'Primary: original data, texts, or evidence (a novel, raw survey results, historical documents). Secondary: analyses of primary sources (literary criticism, review articles).' },
      { question: 'Should I write the introduction first or last?', answer: 'Most experienced researchers write the intro LAST. The body of the paper reveals what you actually argued; the intro should preview that.' },
      { question: 'How do I find sources?', answer: 'Start with Google Scholar, then your school\'s library databases (JSTOR, Project MUSE, PubMed depending on field). Avoid Wikipedia as a primary source; use it to find primary sources via the references section.' },
      { question: 'What citation style should I use?', answer: 'Depends on the field. Humanities: MLA or Chicago. Social sciences: APA. Sciences: varies (often APA or specific journal style). Engineering: IEEE. Always check your professor\'s preference.' },
    ],
  },
  {
    slug: 'how-to-write-compare-contrast-essay',
    type: 'compare-contrast',
    niceName: 'compare-contrast essay',
    shortName: 'compare-contrast',
    intro: 'A compare-contrast essay analyses two or more subjects to show similarities (compare) and differences (contrast). The point isn\'t to list features, it\'s to argue what the comparison reveals. "Beloved and The Kite Runner are both novels about trauma" isn\'t enough; you need an interpretive claim about what the comparison shows.',
    structure: [
      { title: '1. Pick organisation: block or point-by-point', body: 'Block: discuss all of A, then all of B. Better for shorter essays or when subjects are distinct. Point-by-point: alternate by criterion (theme 1: A vs B; theme 2: A vs B). Better for longer essays or close comparisons.' },
      { title: '2. Intro with thesis', body: 'Name both subjects, the criteria you\'ll compare on, and your interpretive claim. "While both novels critique consumer culture, Fight Club uses spectacle and American Psycho uses horror, and the latter is more effective."' },
      { title: '3. Body, block or point-by-point', body: 'Maintain consistent criteria across both subjects. If you discuss "tone" in subject A, discuss tone in subject B too.' },
      { title: '4. Synthesis paragraph', body: 'Don\'t just list similarities and differences, synthesise. What does the comparison reveal that you couldn\'t see from either subject alone?' },
      { title: '5. Conclusion', body: 'Restate the interpretive claim, summarise the key contrasts, and suggest implications.' },
    ],
    examples: [
      { label: 'Listing vs interpreting', before: 'Both novels deal with violence. Fight Club has more action; American Psycho has more psychological violence.', after: 'Both novels stage violence as a symptom of consumerism, but Fight Club externalizes it (fistfights, explosions) while American Psycho internalizes it (Bateman\'s narration treats violence as just another category of consumption).', explanation: 'Listing observes; interpreting argues.' },
    ],
    mistakes: [
      { title: 'No clear thesis', body: 'A compare-contrast essay needs an interpretive claim, not just "X and Y are similar in some ways and different in others."' },
      { title: 'Inconsistent criteria', body: 'If you discuss tone in subject A but not subject B, the comparison isn\'t parallel.' },
      { title: 'Treating it as a checklist', body: '"Subject A is X. Subject B is X. Subject A is Y. Subject B is Y." reads mechanical. Use transitions and synthesise.' },
    ],
    faqs: [
      { question: 'Block or point-by-point, which is better?', answer: 'Point-by-point for short essays (better for tight comparison). Block for longer essays where holding both subjects in mind across pages is hard.' },
      { question: 'Do I need exactly equal weight on each subject?', answer: 'Roughly, yes, within ±20%. Major imbalance reads like an essay about subject A that briefly mentions subject B.' },
      { question: 'Can I compare more than two things?', answer: 'Yes, but it gets unwieldy past three. For three subjects, point-by-point organisation usually works better than block.' },
      { question: 'Should I use a Venn diagram?', answer: 'For brainstorming, yes. Don\'t reproduce the diagram in the essay itself, convert it to prose.' },
    ],
  },
  {
    slug: 'how-to-write-college-essay',
    type: 'college',
    niceName: 'college admissions essay',
    shortName: 'college admissions',
    intro: 'The college admissions essay (Common App personal statement) is the only part of your application where the admissions committee hears your voice. Test scores, GPA, and activities are numbers; the essay is a person. The single biggest mistake students make is treating it as a resume in prose form. Don\'t list achievements, tell a story that shows who you are.',
    structure: [
      { title: '1. Hook, drop into a moment', body: 'Skip the "Throughout my life..." opener. Start in scene: a specific moment, a sensory detail, a line of dialogue. Make the reader curious enough to keep going.' },
      { title: '2. Story, show the conflict', body: 'What was hard about this moment? What was at stake? The conflict can be small (your robotics team\'s first match) but the stakes have to be real to you.' },
      { title: '3. Turning point', body: 'What changed? A realisation, a decision, an unexpected event. This is where you reveal something true about how you think.' },
      { title: '4. Reflection, what it shows', body: 'Don\'t state "I learned X." Instead, show how you act differently now, or how you see the world differently. The reader should infer the lesson, not be told it.' },
      { title: '5. Land the close', body: 'End on an image, a question, or a return to the opening hook. Avoid platitudes ("And that\'s when I knew I wanted to study X"). The best college essays end with the reader thinking, not nodding.' },
    ],
    examples: [
      { label: 'Generic vs specific opening', before: 'Throughout my life, I have always been passionate about helping others.', after: 'The mosquito had been buzzing in my ear for ten minutes when I finally understood what my grandmother meant about anger.', explanation: 'Generic openings sound like every other college essay. Specific openings make the reader curious.' },
      { label: 'Listing vs storytelling reflection', before: 'I learned the importance of leadership and perseverance.', after: 'When I run the robotics team now, I leave the loud arguments for the meeting after, because the loudest people in the meeting are usually the wrong ones.', explanation: 'Listing claims values. Storytelling shows how you act.' },
    ],
    mistakes: [
      { title: 'Listing achievements', body: 'The admissions reader has your resume. The essay is for everything the resume doesn\'t show. If your essay\'s content could fit on the activities list, you\'re missing the point.' },
      { title: 'Trying to sound profound', body: '"I learned that life is a journey..." reads like a greeting card. Specific, small observations beat grand philosophical claims.' },
      { title: 'Writing what you think they want to hear', body: 'Admissions readers can spot it instantly. Write what\'s true to you, even if it\'s about something small (working at a deli, your weird relationship with a sibling), and the genuine voice does the work.' },
      { title: 'Cliché topics handled clichéd-ly', body: 'Sports injury, mission trip, dead grandparent, these aren\'t banned, but they\'re hard. If you write about them, the angle has to be unexpected.' },
    ],
    faqs: [
      { question: 'How long should the Common App essay be?', answer: '650 words max. Aim for 600-650. Way under reads as not-trying; over the limit gets cut off automatically.' },
      { question: 'Should I write about a hardship?', answer: 'Only if it genuinely shaped you and you\'ve processed it. A poorly-handled hardship essay reads as ask-for-pity. A well-handled one shows resilience and self-awareness.' },
      { question: 'Can I use first person?', answer: 'Yes, first person is standard for college essays. Second person ("you") and third person ("the writer") are unusual choices.' },
      { question: 'How many drafts should I write?', answer: '5-10 minimum. The first draft is for getting the story out. Drafts 2-5 are for shaping. Drafts 6+ are for sentence-level polishing.' },
      { question: 'Should I have someone read it?', answer: 'Yes, but limit to 2-3 readers (parent, English teacher, college counselor). Too many readers = too many opinions = essay loses voice.' },
      { question: 'What topics should I avoid?', answer: 'Sports victories, mission trips, "winning the championship" stories, overdone unless you have a fresh angle. Also: anything where you\'re the hero who saves the day. Show flaws.' },
    ],
  },
  {
    slug: 'how-to-write-thesis-statement',
    type: 'thesis',
    niceName: 'thesis statement',
    shortName: 'thesis',
    intro: 'A thesis statement is the central argument of your essay, a 1-2 sentence claim that the rest of the essay defends. It\'s the most important sentence in your paper because everything else gets organised around it. A weak thesis = a weak essay no matter how good the body paragraphs are. Strong thesis statements are debatable, specific, and answerable in the essay\'s word count.',
    structure: [
      { title: '1. Identify your topic', body: 'What\'s the essay about? Topics are usually broad ("social media", "the French Revolution"). They\'re a starting point, not a thesis.' },
      { title: '2. Narrow to a specific aspect', body: 'Within the topic, pick a specific angle. "Social media → algorithmic content recommendations on TikTok → effects on teen anxiety."' },
      { title: '3. State your position', body: 'Take a stand, what do you argue? "Federal regulation of TikTok\'s algorithm would reduce teen anxiety more effectively than age verification laws."' },
      { title: '4. Add the "because"', body: 'The strongest theses include the reasoning. "...because algorithms drive engagement-maximization, not user well-being."' },
      { title: '5. Test it: debatable, specific, answerable?', body: 'Could a reasonable person disagree? Is it specific enough? Can you defend it in your essay\'s word count?' },
    ],
    examples: [
      { label: 'Weak → strong (argumentative)', before: 'Social media is bad for teenagers.', after: 'Federal regulation of algorithmic content recommendations would reduce teen anxiety more effectively than age-verification laws because algorithms drive engagement-maximization, not well-being.', explanation: 'Specific (federal regulation of algorithms), debatable (vs age verification), supported (because clause).' },
      { label: 'Weak → strong (analytical)', before: 'Toni Morrison\'s Beloved is about slavery.', after: 'Morrison\'s use of second-person narration in Beloved forces the reader into Sethe\'s memory loops, making the trauma of slavery experiential rather than historical.', explanation: 'Names a specific technique (second-person narration), specific effect (memory loops, experiential trauma), debatable interpretation.' },
      { label: 'Question → claim', before: 'Is climate change reversible?', after: 'Climate change is partially reversible through aggressive carbon capture, but only on timescales measured in centuries, meaning current adaptation strategies must assume the worst.', explanation: 'Theses are answers, not questions.' },
    ],
    mistakes: [
      { title: 'Stating a fact (not arguable)', body: '"World War I started in 1914" is a fact. A thesis must take a position.' },
      { title: 'Too broad', body: '"Technology has changed society", what technology? what change? Narrow until it\'s answerable in your essay\'s word count.' },
      { title: 'Three theses in one', body: 'A thesis with 3 distinct claims becomes 3 essays. Pick the strongest claim.' },
      { title: 'Using "I think" or "I believe"', body: 'In academic writing, "I think" weakens your thesis. State the claim directly. "Smith\'s argument fails because..." is stronger than "I think Smith\'s argument fails because..."' },
      { title: 'Putting it in the wrong place', body: 'Thesis goes in the introduction (last sentence), not the conclusion. The reader needs to know what you\'re arguing before reading the body.' },
    ],
    faqs: [
      { question: 'How long should a thesis statement be?', answer: '15-30 words. Below 15 is usually too vague; above 30 starts compressing too many ideas.' },
      { question: 'Should the thesis be one sentence?', answer: 'Usually, yes. Two sentences max, only if you need a "because" clause. If your thesis sprawls into three sentences, the argument isn\'t focused.' },
      { question: 'Where does the thesis go?', answer: 'Last sentence of the introduction paragraph. The body paragraphs that follow each defend one piece of the thesis.' },
      { question: 'Can I change my thesis after I start writing?', answer: 'Yes, and you probably will. Drafting reveals what your real argument is. Update the thesis to match your final body paragraphs before you submit.' },
      { question: 'Should the thesis preview the body paragraphs?', answer: 'Optional. The "three-prong thesis" ("X is true because A, B, and C") works for short essays. Longer essays can use a leaner thesis with the structure implied.' },
      { question: 'Can a thesis be a question?', answer: 'No. A thesis is a claim, your answer to the question. The question can appear earlier in the introduction; the thesis is the answer.' },
    ],
  },
  {
    slug: 'how-to-cite-sources-apa',
    type: 'apa-citation',
    niceName: 'APA citation guide',
    shortName: 'APA',
    intro: 'APA (American Psychological Association) style is the standard citation format for psychology, education, social sciences, and many STEM fields. The current version is APA 7th edition (released 2019). The two main components are in-text citations (Smith, 2023) and the reference list at the end of the paper. This guide covers the most common source types, books, journal articles, websites, and edge cases.',
    structure: [
      { title: '1. In-text citation format', body: 'Author last name + year, in parentheses: (Smith, 2023). Direct quote adds page: (Smith, 2023, p. 42). Two authors: (Smith & Jones, 2023). Three or more: (Smith et al., 2023).' },
      { title: '2. Reference list, book', body: 'Author, A. A. (Year). Title of book. Publisher. → Smith, J. (2023). The art of writing. Penguin Books.' },
      { title: '3. Reference list, journal article', body: 'Author, A. A. (Year). Article title. Journal Name, Volume(Issue), Pages. DOI. → Jones, M. (2023). Climate adaptation. Environmental Studies, 12(4), 45-60. https://doi.org/10.xxx' },
      { title: '4. Reference list, website', body: 'Author, A. A. (Year, Month Day). Title. Site name. URL. → Doe, J. (2023, March 15). Article title. Example Site. https://example.com' },
      { title: '5. Format the reference list', body: 'Alphabetical by first author last name. Double-spaced. Hanging indent (first line flush left, subsequent lines indented 0.5"). Title: "References" at top.' },
    ],
    examples: [
      { label: 'APA 6 vs APA 7', before: 'Smith, J. (2018). Title. Retrieved from https://example.com', after: 'Smith, J. (2018). Title. https://example.com', explanation: 'APA 7 dropped "Retrieved from" before URLs. Also dropped publisher city, simplified DOI format.' },
      { label: 'Et al., APA 6 vs APA 7', before: 'APA 6: First citation listed all authors up to 6; subsequent: et al.', after: 'APA 7: For 3+ authors, use et al. from the FIRST citation.', explanation: 'APA 7 simplified the et al. rule. (Smith et al., 2023) on first AND subsequent citations for 3+ authors.' },
    ],
    mistakes: [
      { title: 'Mixing APA 6 and APA 7 rules', body: 'If your professor specifies APA 7, use 7 throughout. Mixing is the most common formatting error.' },
      { title: 'Italicising the wrong part', body: 'Book titles are italicised. Journal article titles are NOT, only the journal name is italicised.' },
      { title: 'Forgetting the hanging indent', body: 'APA reference list requires hanging indent (first line flush, subsequent indented 0.5"). Most word processors have this as a paragraph setting.' },
      { title: 'Using "Anonymous" wrong', body: 'Use "Anonymous" only if the source explicitly says "Anonymous". Otherwise, treat the source as having no author and start with the title.' },
      { title: 'Missing the period after "et al."', body: 'It\'s "et al." with a period (abbreviation of "et alii"). Missing the period is wrong; some students also italicise it (don\'t).' },
    ],
    faqs: [
      { question: 'What\'s the difference between APA 6 and APA 7?', answer: 'APA 7 (2019): no "Retrieved from" before URLs, no publisher city, et al. from first citation for 3+ authors, single space after periods (was double in APA 6), DOIs as full URLs.' },
      { question: 'How do I cite a website with no author?', answer: 'Move the title to author position. (Title of page, 2023). In the reference list: Title of page. (Year). Site Name. URL.' },
      { question: 'How do I cite a website with no date?', answer: 'Use "n.d." (no date) where the year would go: (Smith, n.d.). In references: Smith, J. (n.d.). Title.' },
      { question: 'Do I need to italicise et al.?', answer: 'No. APA does NOT italicise et al. (Some other styles do, APA does not.)' },
      { question: 'How do I cite a YouTube video?', answer: 'Author/Channel. (Year, Month Day). Video title [Video]. YouTube. URL. → Crash Course. (2014, August 5). Civil War part 1 [Video]. YouTube. https://youtube.com/watch?v=xxx' },
      { question: 'What if there\'s no page number for a quote (web source)?', answer: 'Use paragraph number: (Smith, 2023, para. 4). Or section heading: (Smith, 2023, Methodology section).' },
      { question: 'Do I need a DOI?', answer: 'Yes if the article has one. Use the DOI link format: https://doi.org/10.xxxx/xxxx. If no DOI, use the URL.' },
    ],
  },
];

function essayGuidePage(g: EssayGuideMeta): ProgrammaticPageConfig {
  const isThesisOrCitation = g.type === 'thesis' || g.type === 'apa-citation';
  return {
    slug: g.slug,
    type: 'guide',
    metaTitle: isThesisOrCitation
      ? `How to Write a ${g.shortName === 'thesis' ? 'Thesis Statement' : 'APA Citation'}, Complete Guide | WriteScholar`
      : `How to Write a ${g.shortName.charAt(0).toUpperCase() + g.shortName.slice(1)} Essay, Step-by-Step | WriteScholar`,
    metaDescription: `Learn how to write a ${g.niceName} step-by-step. Structure, examples, common mistakes, and FAQs. Plus AI tools to draft, outline, and preview-grade your essay.`,
    h1: isThesisOrCitation && g.type === 'apa-citation'
      ? 'How to Cite Sources in APA Format, Complete Guide'
      : `How to Write a ${g.shortName.charAt(0).toUpperCase() + g.shortName.slice(1)} ${g.type === 'apa-citation' ? '' : g.type === 'thesis' ? 'Statement' : g.type === 'research' ? 'Paper' : g.type === 'college' ? 'Essay' : 'Essay'}`,
    subtitle: `Structure, examples, mistakes to avoid, and AI tools to draft and preview-check your work.`,
    eyebrow: `${g.niceName} guide`,
    accent: '#A560E8',
    intro: g.intro,
    sections: [
      {
        type: 'steps',
        heading: `${g.niceName.charAt(0).toUpperCase() + g.niceName.slice(1)} structure`,
        steps: g.structure,
      },
      {
        type: 'examples',
        heading: 'Examples, weak vs strong',
        examples: g.examples,
      },
      {
        type: 'list',
        heading: 'Common mistakes to avoid',
        items: g.mistakes,
      },
    ],
    faqs: g.faqs,
    related: [
      { label: 'AI Essay Checker', href: '/tools/analyze', teaser: 'Get rubric-based feedback and a polished revision.' },
      { label: 'Thesis Generator', href: '/tools/thesis-generator', teaser: 'Build a strong thesis statement.' },
      { label: 'Essay Outline Generator', href: '/tools/essay-outline', teaser: 'Get a structured outline in 30 seconds.' },
      { label: 'Citation Generator', href: '/tools/citation-generator', teaser: 'APA, MLA, Chicago, Harvard, IEEE.' },
      { label: 'Grammar Checker', href: '/tools/grammar-checker', teaser: 'Free spelling and grammar pass.' },
      { label: 'Paraphrasing Tips', href: '/tools/paraphrasing-tips', teaser: 'Spot weak verbs and wordy phrases.' },
    ],
    primaryCta: { label: 'Try the AI essay checker', page: 'analyze' },
    secondaryCta: { label: 'Generate an outline', page: 'essay-outline' },
    datePublished: '2026-04-15',
  };
}

/* ─── BEST-FOR PAGES, /best/[query] ──────────────────────────── */

const bestPages: ProgrammaticPageConfig[] = [
  {
    slug: 'ai-essay-grader-for-college',
    type: 'best',
    metaTitle: 'Best AI Essay Grader for College Students 2026 | WriteScholar',
    metaDescription: 'The best AI essay graders for college students compared. WriteScholar, Grammarly, ProWritingAid, EssayGrader.ai, features, pricing, accuracy.',
    h1: 'Best AI essay grader for college students (2026)',
    subtitle: 'Five AI essay tools compared on accuracy, rubric depth, college-grade calibration, and price. Honest review from someone who built one.',
    eyebrow: 'Best AI essay grader · 2026',
    accent: '#A560E8',
    intro: 'AI essay graders have multiplied since 2022, at least 20 are now competing for college students\' attention. Most are mediocre. The problem isn\'t the AI; it\'s how grades are calibrated. An A on one platform is a B+ on another. This guide compares the five tools college students actually use, scored on what matters: rubric depth, grade calibration, line-by-line feedback, and price.',
    sections: [
      {
        type: 'comparison',
        heading: 'Top AI essay graders compared',
        intro: 'Tested on the same 1,500-word argumentative essay across all platforms.',
        columns: ['Tool', 'Rubric depth', 'Grade calibration', 'Line annotations', 'Price'],
        rows: [
          { feature: 'WriteScholar', values: ['5 categories + sub-criteria', 'Calibrated to college rubrics', 'Yes, interactive', PRO_PRICING_CELL] },
          { feature: 'Grammarly Premium', values: ['Style/clarity only', 'No essay grade', 'Yes, grammar focus', '$30/mo'] },
          { feature: 'ProWritingAid', values: ['Style/structure', 'No essay grade', 'Yes, comprehensive', '$120/year'] },
          { feature: 'EssayGrader.ai', values: ['Single grade only', 'Inconsistent', 'Limited', '$15/mo'] },
          { feature: 'ChatGPT (GPT-4)', values: ['Variable', 'Generous (inflated)', 'On request', '$20/mo'] },
        ],
      },
      {
        type: 'list',
        heading: 'What "best" actually means for college essay grading',
        items: [
          { title: 'Rubric depth', body: 'Best graders break feedback into 5+ categories (thesis, structure, evidence, style, mechanics), same as how professors actually grade. Single-grade tools miss the diagnostic value.' },
          { title: 'Calibration', body: 'A grader that gives every essay a B+ is useless. Best graders are calibrated to give roughly the distribution real professors give: 20% A, 40% B, 30% C, 10% below. WriteScholar tested with 200 graded essays from across freshman composition.' },
          { title: 'Line-by-line annotations', body: 'A holistic grade is fine; line annotations are where actual learning happens. "This sentence is unclear" is more useful than "your style is good".' },
          { title: 'Polished revision', body: 'The strongest graders also output a revised version of your essay so you can compare what could be different.' },
          { title: 'Price', body: 'College students aren\'t paying $50/month for grading. WriteScholar Pro is $9.99 for your first month, then $19.99/mo — with lifetime previews so you can test on your own essay before subscribing.' },
        ],
      },
      {
        type: 'list',
        heading: 'When NOT to use AI essay grading',
        items: [
          { title: 'High-stakes academic submissions', body: 'For graded papers and theses, AI feedback is for revision, never submit text generated by AI. Universities use AI detectors; some are accurate, some aren\'t.' },
          { title: 'Personal writing', body: 'AI graders are calibrated to academic conventions. They\'ll grade your memoir or short story by rubric, not creative merit.' },
          { title: 'When you haven\'t drafted yet', body: 'Grading a half-formed essay produces low-quality feedback. Get to a complete draft, then run it through a grader.' },
        ],
      },
    ],
    faqs: [
      { question: 'Are AI essay graders accurate?', answer: 'For surface-level feedback (grammar, structure, basic argument quality), they\'re 80-90% accurate. For nuanced argument quality and originality, less so. Use as a complement to human feedback, not a replacement.' },
      { question: 'Will my professor know I used an AI grader?', answer: 'No, running your own essay through an AI grader for feedback is no different from running it through Grammarly. The output is feedback to YOU, not text you submit.' },
      { question: 'What\'s the catch with the free tier?', answer: 'WriteScholar gives 2 lifetime essay analysis previews on your own work (grade estimate, issues, top suggestions — full rubric and one-click fixes unlock with Pro). No monthly reset tricks: when previews are used, you know exactly what Pro adds. First month of Pro is $9.99 with NEWCUSTOMER.' },
      { question: 'Can AI graders grade as well as professors?', answer: 'Not yet. Top AI graders (WriteScholar, top-tier ChatGPT prompts) match professors ~75% of the time on overall grade, less on nuanced feedback. They\'re a useful first pass; not a replacement.' },
      { question: 'Which is best for med school applications?', answer: 'For high-stakes essays, get human feedback (admissions counsellor, mentor, English teacher). AI graders are useful for early drafts and grammar passes.' },
      { question: 'Is WriteScholar genuinely better, or are you biased?', answer: 'I built it, so yes I\'m biased. The honest pitch: preview your essay free, then Pro is $9.99 for your first month and $19.99/mo after — cheaper than Grammarly Premium, with 5-category rubric scoring most tools skip. For workplace writing, Grammarly is better. For creative work, neither.' },
    ],
    related: [
      { label: 'AI Essay Checker', href: '/tools/analyze', teaser: 'Try the WriteScholar essay grader free.' },
      { label: 'Best flashcard app for med school', href: '/best/flashcard-app-for-medical-school', teaser: 'Top flashcard tools compared.' },
      { label: 'Grammarly alternative', href: '/alternatives/grammarly', teaser: 'WriteScholar vs Grammarly side by side.' },
    ],
    primaryCta: { label: 'Preview the essay grader', page: 'analyze' },
    secondaryCta: { label: 'See pricing', page: 'pricing' },
  },
  {
    slug: 'flashcard-app-for-medical-school',
    type: 'best',
    metaTitle: 'Best Flashcard App for Medical School 2026 | WriteScholar',
    metaDescription: 'Best flashcard apps for medical school compared: Anki, WriteScholar, Quizlet, RemNote, Brainscape. Spaced repetition, image cards, deck sharing.',
    h1: 'Best flashcard app for medical school (2026)',
    subtitle: 'Anki vs WriteScholar vs Brainscape, which actually fits the volume of med school flashcards.',
    eyebrow: 'Best for medical school',
    accent: '#FF4B4B',
    intro: 'Med school is flashcards. Most students do 200-500 cards/day on average, for years. The flashcard app you pick determines how much of your life you spend fighting the tool versus actually studying. This guide compares the five major options on the dimensions med students care about: spaced repetition algorithm, image card support, deck sharing, premade content (Anking, etc.), and total cost over a degree.',
    sections: [
      {
        type: 'comparison',
        heading: 'Top flashcard apps for medical school',
        columns: ['App', 'SRS algorithm', 'Image cards', 'Premade content', 'Cost (4 years)'],
        rows: [
          { feature: 'Anki', values: ['SM-2 (best)', 'Yes', 'Anking deck (free)', 'Free desktop / $25 iOS' ] },
          { feature: 'WriteScholar', values: ['SM-2 (Pro)', 'Yes (Pro)', 'AI-generate from notes', PRO_PRICING_CELL] },
          { feature: 'RemNote', values: ['SM-2', 'Yes', 'Limited', '$80/year'] },
          { feature: 'Brainscape', values: ['Confidence-based', 'Yes', 'Pro decks', '$120/year'] },
          { feature: 'Quizlet', values: ['Limited', 'Yes', 'User decks', '$36/year'] },
        ],
      },
      {
        type: 'list',
        heading: 'What med students actually need from a flashcard app',
        items: [
          { title: 'Reliable spaced repetition', body: 'SM-2 algorithm or better. The cards you struggle with come up more often; the ones you nail come up less. Without true SRS, you waste hours re-reviewing easy cards.' },
          { title: 'Image card support', body: 'Anatomy, histology, pathology, all visual. Text-only cards don\'t cut it. Image-occlusion (hide parts of an image) is a major plus.' },
          { title: 'Premade content', body: 'Anking is the gold standard premade deck for med school (~25,000 cards covering Step 1). For Anki, free. For other apps, you usually have to build your own.' },
          { title: 'Cross-device sync', body: 'Phone for commute reviews, laptop for evening studying. Syncing has to be fast and reliable.' },
          { title: 'Cost over 4 years', body: 'Anki is free desktop (paid iOS). WriteScholar Pro is $9.99 first month, then $19.99/mo. Over 4 years: Anki ~$25 total; WriteScholar ~$960 if you stay subscribed — preview study packs free before committing.' },
        ],
      },
      {
        type: 'list',
        heading: 'When to pick each',
        items: [
          { title: 'Pick Anki if', body: 'You want the best SRS algorithm, Anking deck, and lowest cost. Downside: ugly UI, steep learning curve, manual deck setup.' },
          { title: 'Pick WriteScholar if', body: 'You want AI to generate flashcards from your lecture notes (Anki can\'t do this), and you want essay tools + summarizer alongside. Preview the lesson + sample cards free; full deck and SRS unlock on Pro.' },
          { title: 'Pick RemNote if', body: 'You want note-taking integrated with flashcards (write the notes, automatically convert to cards). Smaller community than Anki.' },
          { title: 'Pick Brainscape if', body: 'You like confidence-based ratings (you choose how well you knew the answer on a 1-5 scale). Less flexible than SM-2 but easier to start.' },
        ],
      },
    ],
    faqs: [
      { question: 'Is Anki really free?', answer: 'Free on desktop and Android. iOS app is $25 (one-time, supports development). Premade decks (Anking, Pepper Pharm, etc.) are mostly free.' },
      { question: 'How many flashcards do med students do per day?', answer: '200-500 daily review cards is typical for the first 2 years. New cards: 50-100/day. Total time: 1-3 hours/day.' },
      { question: 'Can WriteScholar replace Anki?', answer: 'Not for the Anking deck specifically (Anki has the community + free premade content). For your own lecture notes, WriteScholar generates cards faster than typing them in Anki.' },
      { question: 'What\'s image occlusion?', answer: 'A flashcard format where parts of an image are hidden and revealed on click. Essential for anatomy. Anki has the best image occlusion add-on; WriteScholar Pro has basic image occlusion.' },
      { question: 'Should I use Anki and WriteScholar together?', answer: 'Many students do, Anki for the Anking deck (Step 1 prep) and WriteScholar for class-specific notes (where AI generation saves hours).' },
      { question: 'How long should I review per day?', answer: '1-2 hours of flashcards is sustainable for years. 3+ hours/day burns most students out within months.' },
    ],
    related: [
      { label: 'AI Flashcard Maker', href: '/tools/create-flashcards', teaser: 'Try WriteScholar\'s flashcard tool free.' },
      { label: 'Best AI essay grader for college', href: '/best/ai-essay-grader-for-college', teaser: 'Top essay graders compared.' },
      { label: 'Quizlet alternative', href: '/alternatives/quizlet', teaser: 'WriteScholar vs Quizlet.' },
    ],
    primaryCta: { label: 'Preview WriteScholar free', page: 'signup' },
    secondaryCta: { label: 'See flashcard tool', page: 'create-flashcards' },
  },
  {
    slug: 'study-app-for-college',
    type: 'best',
    metaTitle: 'Best Study App for College Students 2026 | WriteScholar',
    metaDescription: 'Best study apps for college students compared. AI flashcards, quiz generators, essay tools, focus timers. Free options included.',
    h1: 'Best study app for college students (2026)',
    subtitle: 'Six study apps that cover the actual workflow: notes → flashcards → quizzes → essays → submission.',
    eyebrow: 'Best study app · College',
    accent: '#1CB0F6',
    intro: 'Most "best study app" lists are SEO content written by affiliate marketers. This one is built around the actual college workflow: take notes, study them, write essays from them, cite sources, submit on time. The ideal study app handles all five. Most apps handle one or two.',
    sections: [
      {
        type: 'comparison',
        heading: 'Top study apps for college',
        columns: ['App', 'Notes', 'Flashcards', 'Quizzes', 'Essays', 'Cost'],
        rows: [
          { feature: 'WriteScholar', values: ['Light', 'AI-generated', 'AI-generated', 'AI grader', PRO_PRICING_CELL] },
          { feature: 'Notion', values: ['Best', 'Manual', 'Manual', 'No', 'Free / $8/mo'] },
          { feature: 'Quizlet', values: ['No', 'Yes', 'Limited', 'No', '$36/year'] },
          { feature: 'Anki', values: ['No', 'Best', 'No', 'No', 'Free / $25 iOS'] },
          { feature: 'Notability', values: ['Yes', 'No', 'No', 'No', '$15/year'] },
          { feature: 'Goodnotes', values: ['Yes', 'Manual', 'No', 'No', '$30 one-time'] },
        ],
      },
      {
        type: 'list',
        heading: 'How to pick',
        items: [
          { title: 'For STEM-heavy schedules', body: 'Anki + WriteScholar. Anki for premade content (Anking, etc.); WriteScholar for class-specific notes — preview the AI-generated pack free, then upgrade for full quizzes and decks.' },
          { title: 'For humanities-heavy schedules', body: 'Notion + WriteScholar. Notion for note-taking and research organisation; WriteScholar for essay tools, citations, and study guides.' },
          { title: 'For occasional studying', body: 'WriteScholar lets you preview essay feedback and study packs on your own work before paying — no credit card. Notion free for note-taking. Don\'t subscribe until you\'ve seen real results.' },
          { title: 'For visual note-takers', body: 'Notability or Goodnotes for handwritten notes on iPad. Then run scanned notes through WriteScholar to generate flashcards/quizzes.' },
        ],
      },
    ],
    faqs: [
      { question: 'What\'s the single best study app?', answer: 'There isn\'t one, best app depends on your major and study style. Most students end up using 2-3 apps that complement each other.' },
      { question: 'How much should I spend on study apps?', answer: '$0-30/month is reasonable for college. Anything more, you\'re probably paying for features you don\'t use.' },
      { question: 'Are paid apps worth it over free?', answer: 'Preview free first. If a tool saves you hours per week on essays or exam prep, $9.99 for the first month of Pro is easy ROI — but only after you\'ve seen it work on your own material.' },
      { question: 'Can I use multiple apps?', answer: 'Yes, most students do. Notion + Anki + WriteScholar is a common combo. Avoid 5+ apps; switching becomes friction.' },
      { question: 'Are these apps academic-integrity safe?', answer: 'Generating flashcards/quizzes from your own notes is fine. Submitting AI-generated essays is not. Each tool here can be used safely; the user determines whether use is ethical.' },
    ],
    related: [
      { label: 'Best AI essay grader', href: '/best/ai-essay-grader-for-college', teaser: 'Top essay graders compared.' },
      { label: 'Quizlet alternative', href: '/alternatives/quizlet', teaser: 'WriteScholar vs Quizlet.' },
      { label: 'AI Quiz Generator', href: '/tools/quiz-generator', teaser: 'Try the WriteScholar quiz tool free.' },
    ],
    primaryCta: { label: 'Preview WriteScholar free', page: 'signup' },
    secondaryCta: { label: 'See pricing', page: 'pricing' },
  },
  {
    slug: 'quiz-maker-for-teachers',
    type: 'best',
    metaTitle: 'Best Quiz Maker for Teachers 2026, Free + Pro Tools | WriteScholar',
    metaDescription: 'Best quiz makers for teachers: AI-generated quizzes from lesson plans, multiple-choice and fill-in-blank, free and paid options. Save hours per week.',
    h1: 'Best quiz maker for teachers (2026)',
    subtitle: 'Save hours per week. AI quiz makers compared on speed, format flexibility, LMS integration, and price.',
    eyebrow: 'Best quiz maker · Teachers',
    accent: '#FF9600',
    intro: 'Most teachers spend 5-10 hours per week writing quizzes. AI quiz generators can cut that to 30 minutes. The best ones generate from your lesson plans (not just topic prompts), produce multiple formats, and integrate with your LMS. Here\'s how the major options compare.',
    sections: [
      {
        type: 'comparison',
        heading: 'Top quiz makers for teachers',
        columns: ['Tool', 'AI from lesson plans', 'Multiple formats', 'LMS integration', 'Cost'],
        rows: [
          { feature: 'WriteScholar', values: ['Yes', 'MCQ + T/F + fill-in', 'CSV export', PRO_PRICING_CELL] },
          { feature: 'Kahoot', values: ['Limited', 'MCQ only (mostly)', 'Yes, many LMS', '$10-20/mo'] },
          { feature: 'Quizizz', values: ['Yes', 'MCQ + open-ended', 'Yes, Google/Canvas', '$10/mo'] },
          { feature: 'ChatGPT', values: ['With prompting', 'Anything you ask', 'Manual', '$20/mo'] },
          { feature: 'Quillionz', values: ['Yes', 'Limited', 'Limited', 'Free + paid'] },
        ],
      },
      {
        type: 'list',
        heading: 'Use cases',
        items: [
          { title: 'Daily formative quizzes', body: 'Quick 5-question check at end of class. WriteScholar or ChatGPT generate these in 1-2 minutes from the lesson notes.' },
          { title: 'Mid-unit assessments', body: '15-20 questions, mixed formats, drawing from multiple lessons. WriteScholar handles multi-input synthesis well.' },
          { title: 'Game-based review', body: 'Kahoot or Quizizz for the gameshow format. Generate the questions in WriteScholar, then import.' },
          { title: 'High-stakes exams', body: 'Always hand-review AI-generated questions. AI sometimes produces ambiguous answers or wrong distractors.' },
        ],
      },
    ],
    faqs: [
      { question: 'Are AI-generated quiz questions reliable?', answer: 'Mostly yes, accuracy is 90%+ for factual questions. Always hand-review for ambiguity, especially in subject areas with multiple valid interpretations.' },
      { question: 'Can I export to my LMS?', answer: 'Most tools (including WriteScholar Pro) export to CSV which Canvas, Blackboard, Schoology, and Google Classroom all accept.' },
      { question: 'Will students notice AI-generated questions?', answer: 'Probably not, AI questions are often indistinguishable from teacher-written ones, especially after light hand-editing.' },
      { question: 'Can I generate questions from my lesson plans?', answer: 'Yes on WriteScholar, paste the lesson plan and the AI extracts key concepts as questions. Most tools require you to specify the topic; few accept the full lesson plan.' },
      { question: 'How much time does it actually save?', answer: 'For a 20-question quiz, hand-writing takes 45-90 minutes. AI-generated + hand-review takes 10-15 minutes. ~5x speedup.' },
    ],
    related: [
      { label: 'AI Quiz Generator', href: '/tools/quiz-generator', teaser: 'Try the WriteScholar quiz tool.' },
      { label: 'Best study app for college', href: '/best/study-app-for-college', teaser: 'Top study apps compared.' },
      { label: 'AI Flashcard Maker', href: '/tools/create-flashcards', teaser: 'Generate flashcards from your lesson notes.' },
    ],
    primaryCta: { label: 'Try the quiz generator', page: 'quiz-generator' },
    secondaryCta: { label: 'See pricing', page: 'pricing' },
  },
  {
    slug: 'citation-generator',
    type: 'best',
    metaTitle: 'Best Citation Generator 2026, APA, MLA, Chicago | WriteScholar',
    metaDescription: 'Best citation generators compared: WriteScholar, Cite This For Me, EasyBib, Zotero. Free options, supported styles, accuracy.',
    h1: 'Best citation generator for research papers (2026)',
    subtitle: 'Five citation tools compared: WriteScholar, Cite This For Me, EasyBib, Zotero, BibTeX. Honest scoring on speed, accuracy, and price.',
    eyebrow: 'Best citation generator',
    accent: '#A560E8',
    intro: 'Citation generators are commodity tools, they all do roughly the same job. The differences are in supported styles, sign-up requirements, and how aggressively they push paid upgrades. This guide ranks the top five on the criteria that actually matter to research-paper-writing students.',
    sections: [
      {
        type: 'comparison',
        heading: 'Top citation generators',
        columns: ['Tool', 'Free unlimited', 'APA/MLA/Chicago', 'IEEE/Vancouver', 'Cost (paid)'],
        rows: [
          { feature: 'WriteScholar', values: ['Citation tool: unlimited free', 'Yes', 'Yes', PRO_PRICING_CELL] },
          { feature: 'Cite This For Me', values: ['No (5 free)', 'Yes', 'Paid only', '$9.99/mo'] },
          { feature: 'EasyBib', values: ['No (5 free)', 'Yes', 'Paid only', '$9.99/mo'] },
          { feature: 'Zotero', values: ['Yes', 'Yes', 'Yes', 'Free' ] },
          { feature: 'BibTeX', values: ['Yes', 'LaTeX only', 'Yes', 'Free'] },
        ],
      },
      {
        type: 'list',
        heading: 'When to use each',
        items: [
          { title: 'Quick one-off citation', body: 'WriteScholar or Cite This For Me. Paste source details, copy formatted citation. 30 seconds.' },
          { title: 'Building a 50-source bibliography', body: 'Zotero. Browser extension grabs citations as you research; export the whole bibliography at the end.' },
          { title: 'LaTeX paper for science journal', body: 'BibTeX. Standard for scientific publications.' },
          { title: 'Multiple style switching (paper in APA, then in Chicago)', body: 'WriteScholar. Switch styles instantly without re-entering source data.' },
        ],
      },
    ],
    faqs: [
      { question: 'Are citation generators 100% accurate?', answer: 'For standard sources (books, journal articles, websites), yes. For edge cases (legal documents, archival manuscripts, government reports), often need manual fixes. Cross-check with your style\'s manual.' },
      { question: 'Should I use Zotero?', answer: 'For research-heavy work (theses, dissertations, multi-paper projects), yes. The browser extension + library + auto-citation is unmatched. For occasional one-off citations, lighter tools are faster.' },
      { question: 'Can I import from Zotero into WriteScholar?', answer: 'Yes, export from Zotero in BibTeX or RIS format, then import into WriteScholar Pro.' },
      { question: 'Is the WriteScholar citation generator free?', answer: 'Yes — the standalone citation formatter (APA, MLA, Chicago, Harvard) is unlimited and free, no signup. Citation Finder (search peer-reviewed sources by topic) includes 2 lifetime preview searches on free; full source lists unlock with Pro.' },
      { question: 'Does it support APA 6 or APA 7?', answer: 'APA 7 (the current standard, 2019). Most universities require APA 7; APA 6 is being phased out.' },
    ],
    related: [
      { label: 'Citation Generator', href: '/tools/citation-generator', teaser: 'Try WriteScholar\'s free citation tool.' },
      { label: 'How to write APA citations', href: '/guides/how-to-cite-sources-apa', teaser: 'Complete APA 7 guide with examples.' },
      { label: 'Best AI essay grader', href: '/best/ai-essay-grader-for-college', teaser: 'Top essay graders compared.' },
    ],
    primaryCta: { label: 'Try citation generator free', page: 'citation-generator-tool' },
    secondaryCta: { label: 'Read the APA guide', page: 'how-to-cite-sources-apa' },
  },
];

/* ─── Build the master list ────────────────────────────────────── */

export const PROGRAMMATIC_PAGES: ProgrammaticPageConfig[] = [
  ...SUBJECTS.map(subjectPage),
  quizletAlt,
  knowtAlt,
  courseHeroAlt,
  cheggAlt,
  grammarlyAlt,
  ...ESSAY_GUIDES_META.map(essayGuidePage),
  ...bestPages,
];

/* ─── Lookup helpers ───────────────────────────────────────────── */

/**
 * Map a full URL pathname to the matching programmatic page config.
 * Returns null if no match (router falls back to landing).
 *
 * Path patterns:
 *   /study/[slug]
 *   /alternatives/[slug]
 *   /guides/[slug]
 *   /best/[slug]
 */
export function getProgrammaticPageByPath(pathname: string): ProgrammaticPageConfig | null {
  const match = pathname.match(/^\/(study|alternatives|guides|best)\/([^/?#]+)/);
  if (!match) return null;
  const [, prefix, slug] = match;
  const typeMap: Record<string, ProgrammaticPageConfig['type']> = {
    study: 'subject',
    alternatives: 'alternative',
    guides: 'guide',
    best: 'best',
  };
  const expectedType = typeMap[prefix];
  return PROGRAMMATIC_PAGES.find((p) => p.slug === slug && p.type === expectedType) || null;
}

/** All programmatic page paths, used by sitemap generator and prerender. */
export function getAllProgrammaticPaths(): string[] {
  return PROGRAMMATIC_PAGES.map((p) => {
    const prefix = { subject: 'study', alternative: 'alternatives', guide: 'guides', best: 'best' }[p.type];
    return `/${prefix}/${p.slug}`;
  });
}
