/**
 * Single source of truth for tool/feature page <title> + meta description.
 *
 * Both the route-level pageMeta map (CompleteAcademicAIApp.tsx) and the
 * individual tool components call applyPageSeoTags — previously with
 * DIFFERENT strings, so whichever effect ran last won. Import from here in
 * both places so Google and social crawlers always see one consistent title.
 *
 * Title rules (same as src/constants/landingSeo.ts):
 *   - ≤60 chars including " | WriteScholar" so SERPs never truncate the brand
 *   - " — " (em dash) as the one separator style across the site
 *   - Audience/use-case qualifier where it fits ("for Essays & Papers"),
 *     because bare generic titles ("Word Counter") compete with thousands
 *     of identical pages
 *   - Head-term ownership: homepage owns "AI essay grader";
 *     /ai-essay-editor owns "AI essay editor"; /tools/analyze owns
 *     "AI essay checker". Never lead two pages with the same head term.
 */
export interface PageSeoMeta {
  title: string;
  description: string;
}

export const TOOL_SEO_META = {
  analyze: {
    title: 'AI Essay Checker — Feedback in Seconds | WriteScholar',
    description:
      'Paste your essay and get professor-style feedback with a grade, rubric scores, and line-by-line fixes. See your first preview free, then $9.99 for your first month of Pro.',
  },
  'ai-essay-editor': {
    title: 'AI Essay Editor — Write, Grade & Fix Essays | WriteScholar',
    description:
      'Write your essay in a real editor and get a professor-style grade, a full rubric, and one-click line-by-line fixes. Word in, Word out. Preview free, first month $9.99.',
  },
  citations: {
    title: 'Citation Finder — APA, MLA, Chicago | WriteScholar',
    description:
      'Find peer-reviewed sources for research papers in seconds. Search by topic; export APA, MLA, Chicago, or Harvard citations. Built for bibliographies and lit reviews.',
  },
  'study-pack': {
    title: 'AI Study Pack — Flashcards, Quiz & Lesson | WriteScholar',
    description:
      'Paste your notes once and get a lesson, flashcards, a quiz, and study games. Preview your first study pack free.',
  },
  summarizer: {
    title: 'AI Summarizer for Papers & Readings | WriteScholar',
    description:
      'Turn long research papers, articles, and textbook chapters into key points for exams and discussion posts. Free to try.',
  },
  'quiz-generator': {
    title: 'AI Quiz Generator from Notes | WriteScholar',
    description:
      'Paste lecture notes or readings and get multiple-choice, true/false, and fill-in-the-blank quizzes in seconds. A strong supplement to flashcards for exams.',
  },
  'create-flashcards': {
    title: 'AI Flashcard Maker — Decks from Notes | WriteScholar',
    description:
      'Create decks by hand or auto-generate flashcards from your notes in seconds. Fast exam prep without 30 minutes of typing.',
  },
  'word-counter': {
    title: 'Free Word Counter for Essays & Papers | WriteScholar',
    description:
      'Count words, characters, sentences, and paragraphs instantly — built for essays with page or word limits. Free, no signup.',
  },
  'citation-generator-tool': {
    title: 'Free Citation Generator — APA, MLA, Chicago | WriteScholar',
    description:
      'Format APA, MLA, Chicago, and Harvard citations for books, journals, and websites — ready to paste into your bibliography. Free, no signup.',
  },
  'grammar-checker': {
    title: 'Free Grammar Checker for Student Papers | WriteScholar',
    description:
      'Catch spelling, punctuation, and grammar issues in drafts before you submit. Quick free check for assignments, no signup.',
  },
  'readability-score': {
    title: 'Free Readability Checker — Flesch-Kincaid | WriteScholar',
    description:
      'Get Flesch-Kincaid, Gunning Fog, and grade-level scores so you can tune essays for college audiences. Free, no signup.',
  },
  'thesis-generator': {
    title: 'Thesis Statement Generator for Essays | WriteScholar',
    description:
      'Draft strong thesis statements for argumentative and analytical essays — starter lines you can refine for your professor. Free, no signup.',
  },
  'essay-outline': {
    title: 'Free Essay Outline Generator | WriteScholar',
    description:
      'Structured outlines for argumentative, research, narrative, and compare-contrast papers — instant and free, no signup.',
  },
  'text-case-converter': {
    title: 'Free Text Case Converter | WriteScholar',
    description:
      'Convert text to UPPERCASE, lowercase, Title Case, and Sentence case instantly. Perfect for headings and caps-lock fixes. Free, no signup.',
  },
  'paraphrasing-tips': {
    title: 'Paraphrasing Tips for Academic Writing | WriteScholar',
    description:
      'Spot overused words, wordy phrases, and passive voice before you submit. Free writing helper, no signup.',
  },
  'gpa-calculator': {
    title: 'Free GPA Calculator — College Grades | WriteScholar',
    description:
      'Compute semester and cumulative GPA with credits and letter grades, including 4.0-style scales. Free, no signup.',
  },
  'pomodoro-timer': {
    title: 'Free Pomodoro Study Timer | WriteScholar',
    description:
      'Focus blocks and breaks for long library or dorm study sessions. Customizable intervals. Free, no signup.',
  },
  calculator: {
    title: 'Free Scientific Calculator for STEM | WriteScholar',
    description:
      'Trig, logs, powers, and square roots for calculus, physics, and chemistry homework. Works in degrees or radians. Free, no signup.',
  },
  converter: {
    title: 'Free Unit Converter for STEM & Labs | WriteScholar',
    description:
      'Convert SI and imperial units for problem sets and labs — length, weight, temperature, volume, speed, and more. Free, no signup.',
  },
  'crater-blast': {
    title: 'Crater Blast — AI Quiz Arcade Game | WriteScholar',
    description:
      'Blast the correct answer before it lands! AI-powered quiz game that turns your study material into an arcade session.',
  },
  'word-tower': {
    title: 'Word Tower — AI Stacking Study Game | WriteScholar',
    description:
      'Catch correct answers, dodge wrong ones, and build the tallest tower before it falls. AI study game built from your notes.',
  },
} as const satisfies Record<string, PageSeoMeta>;

export type ToolSeoKey = keyof typeof TOOL_SEO_META;
