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
 *   - Head-term ownership: /essay-grader owns "essay grader" and
 *     "grade my essay"; /college-essay-grader owns "college essay grader"
 *     and "personal statement grader"; /tools/analyze owns "AI essay
 *     checker". Never lead two pages with the same head term.
 */
export interface PageSeoMeta {
  title: string;
  description: string;
}

export const TOOL_SEO_META = {
  analyze: {
    title: 'AI Essay Checker — Feedback in Seconds | WriteScholar',
    description:
      'Paste your essay and get an estimated grade, a score for each part of the rubric and feedback on your sentences. Free to start, no card.',
  },
  'ai-essay-editor': {
    title: 'Essay Grader: Grade My Essay Online | WriteScholar',
    description:
      'Get an estimated grade, a 5-part rubric and line-by-line fixes on your essay in about 60 seconds, before you submit. Your first grade each month is free.',
  },
  citations: {
    title: 'Citation Finder — APA, MLA, Chicago | WriteScholar',
    description:
      'Find peer-reviewed sources for research papers in seconds and export APA, MLA, Chicago, or Harvard citations. Part of Pro: $9.99 for your first month, then $19.99/mo.',
  },
  'study-pack': {
    title: 'AI Study Pack — Flashcards, Quiz & Lesson | WriteScholar',
    description:
      'Type an exam topic or paste your notes and get a lesson, flashcards, a quiz and study games. Free to try: 3 a month, no card.',
  },
  summarizer: {
    title: 'AI Summarizer for Papers & Readings | WriteScholar',
    description:
      'Paste a paper, an article or a chapter and get the key points as a short summary. A free account covers 5,000 words a month, no card.',
  },
  'quiz-generator': {
    title: 'AI Quiz Generator from a Topic or Notes | WriteScholar',
    description:
      'Type a topic or paste your notes and get a practice quiz with the reason for each answer: multiple choice, true or false, fill in the blank. Free, no card.',
  },
  'create-flashcards': {
    title: 'AI Flashcard Maker from a Topic or Notes | WriteScholar',
    description:
      'Type an exam topic or paste your notes and get a flashcard deck, plus a quiz, a crossword and games on the same material. Free to start, no card.',
  },
  'word-counter': {
    title: 'Essay Word Counter — Words, Characters & Pages | WriteScholar',
    description:
      'Free essay word counter with live character, sentence and page counts. See how many pages 500, 1,000 or 2,000 words is, and track your word limit. No signup.',
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
