/**
 * Open Graph image specs (1200×630). Used by `scripts/generate-og-images.ts` and `ogImageUrls.ts`.
 * `file` is the basename under /public/og/{file}.png — keep stable for CDN caching.
 */
export interface OgRouteSpec {
  pageKey: string;
  file: string;
  /** Primary line (wrapped to ~3 lines in the generator) */
  headline: string;
  /** Optional subtitle */
  sub?: string;
  /** Gradient hue anchor (0–360) */
  hue: number;
}

/** One card per `pageMeta` route in CompleteAcademicAIApp (excluding blog-post; blog uses per-slug files). */
export const ogRoutes: OgRouteSpec[] = [
  { pageKey: 'landing', file: 'landing', headline: 'AI Essay Checker', sub: 'Professor-level feedback in seconds', hue: 232 },
  { pageKey: 'analyze', file: 'analyze', headline: 'AI Essay Checker', sub: 'Professor-level feedback on your draft', hue: 238 },
  { pageKey: 'citations', file: 'citations', headline: 'Citation Finder', sub: 'APA, MLA, Chicago & more', hue: 200 },
  { pageKey: 'study-pack', file: 'study-pack', headline: 'AI Study Pack', sub: 'Lesson, flashcards, quiz & crossword', hue: 168 },
  { pageKey: 'features', file: 'features', headline: 'Study Tools & Essay Feedback', sub: 'Built for college coursework', hue: 260 },
  { pageKey: 'focus-mode', file: 'focus-mode', headline: 'Focus Mode', sub: 'Block sites until you study', hue: 310 },
  { pageKey: 'pricing', file: 'pricing', headline: 'Pricing', sub: 'Plans for students', hue: 45 },
  { pageKey: 'about', file: 'about', headline: 'About WriteScholar', sub: 'Writing & study help for students', hue: 220 },
  { pageKey: 'why-students-choose', file: 'why-students-choose', headline: 'WriteScholar vs Grammarly & QuillBot', sub: 'Honest comparison for 2026', hue: 275 },
  { pageKey: 'study-tools-comparison', file: 'study-tools-comparison', headline: 'WriteScholar vs Quizlet & Knowt', sub: 'College study tools compared', hue: 185 },
  { pageKey: 'share-friends', file: 'share-friends', headline: 'Study Together', sub: 'Share flashcards & quizzes', hue: 330 },
  { pageKey: 'help', file: 'help', headline: 'Help & FAQ', sub: 'Essay analyzer, citations & study packs', hue: 210 },
  { pageKey: 'contact', file: 'contact', headline: 'Contact WriteScholar', sub: 'We’re here to help', hue: 195 },
  { pageKey: 'privacy', file: 'privacy', headline: 'Privacy Policy', sub: 'How we handle your data', hue: 155 },
  { pageKey: 'terms', file: 'terms', headline: 'Terms of Service', sub: 'WriteScholar legal terms', hue: 145 },
  { pageKey: 'login', file: 'login', headline: 'Log In', sub: 'Essay feedback & study tools', hue: 225 },
  { pageKey: 'signup', file: 'signup', headline: 'Sign Up Free', sub: 'Start in seconds', hue: 235 },
  { pageKey: 'blog', file: 'blog', headline: 'WriteScholar Blog', sub: 'Study tips & writing guides', hue: 175 },
  { pageKey: 'word-counter', file: 'word-counter', headline: 'Word Counter', sub: 'Essays & college papers', hue: 120 },
  { pageKey: 'citation-generator-tool', file: 'citation-generator-tool', headline: 'Citation Generator', sub: 'APA, MLA, Chicago, Harvard', hue: 188 },
  { pageKey: 'readability-score', file: 'readability-score', headline: 'Readability Checker', sub: 'Tune writing for your audience', hue: 130 },
  { pageKey: 'paraphrasing-tips', file: 'paraphrasing-tips', headline: 'Paraphrasing Tips', sub: 'Academic writing helper', hue: 140 },
  { pageKey: 'essay-outline', file: 'essay-outline', headline: 'Essay Outline Generator', sub: 'Structure your paper', hue: 250 },
  { pageKey: 'text-case-converter', file: 'text-case-converter', headline: 'Text Case Converter', sub: 'Title Case, UPPERCASE & more', hue: 110 },
  { pageKey: 'thesis-generator', file: 'thesis-generator', headline: 'Thesis Statement Generator', sub: 'Strong openings for essays', hue: 255 },
  { pageKey: 'grammar-checker', file: 'grammar-checker', headline: 'Grammar Checker', sub: 'Papers & assignments', hue: 125 },
  { pageKey: 'summarizer', file: 'summarizer', headline: 'AI Summarizer', sub: 'Research papers & readings', hue: 205 },
  { pageKey: 'quiz-generator', file: 'quiz-generator', headline: 'AI Quiz Generator', sub: 'Practice from your notes', hue: 165 },
  { pageKey: 'create-flashcards', file: 'create-flashcards', headline: 'Flashcards & Deck Builder', sub: 'Fast exam prep', hue: 172 },
  { pageKey: 'crossword-generator', file: 'crossword-generator', headline: 'Crossword Generator', sub: 'Memorize with puzzles', hue: 178 },
  { pageKey: 'quiz-history', file: 'quiz-history', headline: 'Saved Materials', sub: 'Quizzes, flashcards & more', hue: 160 },
  { pageKey: 'gpa-calculator', file: 'gpa-calculator', headline: 'GPA Calculator', sub: 'Semester & cumulative', hue: 90 },
  { pageKey: 'pomodoro-timer', file: 'pomodoro-timer', headline: 'Pomodoro Timer', sub: 'Focus blocks for study sessions', hue: 35 },
  { pageKey: 'calculator', file: 'calculator', headline: 'Scientific Calculator', sub: 'STEM homework', hue: 100 },
  { pageKey: 'converter', file: 'converter', headline: 'Unit Converter', sub: 'SI & imperial', hue: 85 },
  { pageKey: 'crater-blast', file: 'crater-blast', headline: 'Crater Blast', sub: 'AI quiz game', hue: 15 },
  { pageKey: 'more-tools', file: 'more-tools', headline: 'More Free Tools', sub: 'All-in-one for students', hue: 215 },
  { pageKey: 'badges', file: 'badges', headline: 'Achievements & Badges', sub: 'Level up your scholar journey', hue: 295 },
  { pageKey: 'friends', file: 'friends', headline: 'Friends', sub: 'Share study materials', hue: 320 },
  { pageKey: 'dashboard', file: 'dashboard', headline: 'Dashboard', sub: 'Essay feedback & study tools', hue: 228 },
];
