/**
 * SEO content for every free tool landing page.
 *
 * Each entry feeds <ToolPageSeoContent> below the actual tool UI to:
 *   1. Give Google the 1,500+ words of substantive content needed to rank
 *      tool pages on commercial-intent keywords (e.g. "free word counter").
 *   2. Capture long-tail "how to use" / "when to use" queries.
 *   3. Generate FAQPage JSON-LD for featured-snippet eligibility.
 *   4. Internal-link adjacent tools so crawl depth stays shallow.
 *
 * Voice guidelines:
 *   - Plain English, second-person ("you").
 *   - Mention the canonical search keyword once per section.
 *   - Tie back to WriteScholar product where relevant (essay checker, study
 *     pack, citations) — but don't shill in every paragraph.
 */

import type {
  ToolSeoSteps,
  ToolSeoUseCase,
  ToolSeoFaq,
  ToolSeoRelatedTool,
} from '../components/common/ToolPageSeoContent';

export interface ToolSeoConfig {
  heading: string;
  intro: string;
  steps: ToolSeoSteps[];
  useCases: ToolSeoUseCase[];
  faqs: ToolSeoFaq[];
  related: ToolSeoRelatedTool[];
  closing?: string;
  /** Optional accent — defaults to #A560E8 */
  accent?: string;
}

/* ─── Cross-reference helpers ───────────────────────────────────── */
const TOOL_LINKS = {
  wordCounter: { label: 'Word Counter', page: 'word-counter', teaser: 'Count words, characters, sentences, and reading time.' },
  citationGenerator: { label: 'Citation Generator', page: 'citation-generator-tool', teaser: 'APA, MLA, Chicago, Harvard, IEEE, Vancouver — formatted instantly.' },
  grammarChecker: { label: 'Grammar Checker', page: 'grammar-checker', teaser: 'Catch spelling, punctuation, and grammar errors in seconds.' },
  readability: { label: 'Readability Score', page: 'readability-score', teaser: 'Flesch-Kincaid, SMOG, Gunning Fog — see your text\'s grade level.' },
  thesisGen: { label: 'Thesis Generator', page: 'thesis-generator', teaser: 'Build a strong thesis statement for any essay type.' },
  outline: { label: 'Essay Outline Generator', page: 'essay-outline', teaser: 'Get a structured outline for argumentative, narrative, or research essays.' },
  caseConverter: { label: 'Text Case Converter', page: 'text-case-converter', teaser: 'Convert between UPPER, lower, Title Case, Sentence case.' },
  paraphrase: { label: 'Paraphrasing Tips', page: 'paraphrasing-tips', teaser: 'Spot overused words, weak verbs, and passive voice.' },
  gpa: { label: 'GPA Calculator', page: 'gpa-calculator', teaser: 'Compute semester or cumulative GPA from courses and grades.' },
  pomodoro: { label: 'Pomodoro Timer', page: 'pomodoro-timer', teaser: 'Focus + break intervals to power through study sessions.' },
  calc: { label: 'Scientific Calculator', page: 'calculator', teaser: 'Trigonometry, logarithms, exponents — no app install.' },
  conv: { label: 'Unit Converter', page: 'converter', teaser: 'Length, weight, temperature, volume, time, energy, speed.' },
  summarizer: { label: 'AI Summarizer', page: 'summarizer', teaser: 'Condense papers and articles into bullet, paragraph, or TL;DR summaries.' },
  quizGen: { label: 'AI Quiz Generator', page: 'quiz-generator', teaser: 'Turn notes into multiple-choice, T/F, fill-in-blank quizzes.' },
  flashcards: { label: 'Flashcard Maker', page: 'create-flashcards', teaser: 'Build custom decks or auto-generate them from your notes.' },
  analyze: { label: 'AI Essay Checker', page: 'analyze', teaser: 'Get professor-style feedback with grade, rubric, and revision.' },
};

/* ─── WORD COUNTER ──────────────────────────────────────────────── */
export const wordCounterSeo: ToolSeoConfig = {
  heading: 'Free Word Counter — Count Words, Characters, and Reading Time',
  intro:
    'Pasting your essay below will instantly show you the word count, character count (with and without spaces), sentence count, paragraph count, and an estimated reading and speaking time. No sign-up. No limits. Most professors care about word count to the unit — get it right before you submit.',
  steps: [
    { title: 'Paste your text', body: 'Copy your essay, blog post, social caption, or document and paste it into the box. The counter updates as you type — there is no "count" button to press.' },
    { title: 'Read the live stats', body: 'Words, characters, sentences, paragraphs, reading time, and speaking time all appear on the right. Reading time uses 200 words per minute (typical adult reading speed); speaking time uses 130 wpm (typical speech).' },
    { title: 'Edit to hit your target', body: 'Most professors give a hard word range (e.g. "1,500–2,000 words"). Trim or expand sections until you land inside the window — going over by more than 10% can cost you marks at some schools.' },
    { title: 'Copy or download', body: 'Once you\'re happy with the count, copy your text out or save it as a .txt file. Nothing leaves your browser — the count happens entirely on your device.' },
  ],
  useCases: [
    { title: 'College essays with strict word limits', body: 'Professors often set a 1,500-word minimum on argumentative essays. Submitting at 1,200 = automatic mark deduction. Pasting in here as you write keeps you honest.' },
    { title: 'University application personal statements', body: 'Common App caps the personal statement at 650 words. A character cap also exists on Coalition and many UK UCAS applications. Hit the cap exactly.' },
    { title: 'Twitter, LinkedIn, and Instagram captions', body: 'Twitter is 280 characters. Instagram captions cap at 2,200. LinkedIn posts cut off at ~1,300 before the "see more" fold. Drop your draft in to see exactly where you sit.' },
    { title: 'Estimating reading time for a blog post', body: 'A 1,200-word blog post is about 6 minutes to read. Use the tool to size content before publishing — most readers bounce on anything over 7 minutes unless it\'s a long-form guide.' },
    { title: 'Speech and presentation prep', body: 'A 5-minute speech is about 650 words at a normal pace. The speaking-time estimate (130 wpm) tells you whether your draft fits the time slot before you rehearse.' },
    { title: 'SEO content optimization', body: 'Google rewards in-depth content. Shooting for 1,500–2,500 words on tutorial pages and 800–1,200 on listicles is a common rule of thumb. The counter keeps you on target.' },
  ],
  faqs: [
    { question: 'Is this word counter free to use?', answer: 'Yes — completely free, no sign-up, no usage limits. The whole tool runs in your browser, so you can count as much text as you want without hitting any quota.' },
    { question: 'How accurate is the word count?', answer: 'The counter uses the same definition Microsoft Word and Google Docs use: any sequence of non-whitespace characters separated by spaces is one word. Hyphenated words count as one. Numbers count as words. URLs count as one.' },
    { question: 'Does it count characters with or without spaces?', answer: 'Both. The "Characters" stat includes spaces (used by Twitter, SMS, and most word limits), and "Characters (no spaces)" excludes them (used by some academic word limits).' },
    { question: 'How is reading time calculated?', answer: 'We use 200 words per minute, which is the average adult reading speed for general content. Academic or technical text usually reads slower (~150 wpm) — adjust mentally if your audience is reading dense material.' },
    { question: 'How is speaking time calculated?', answer: 'We use 130 words per minute, which is the standard pace for clear, presentation-style speech (TED talks, lectures, news anchors). Casual conversation is faster (~150 wpm); formal speeches often slower.' },
    { question: 'Can it count words in PDFs or Word documents?', answer: 'Not directly — paste the text in. To extract from a PDF, open the file, select all (Cmd/Ctrl+A), copy, and paste here. For .docx, the same approach works.' },
    { question: 'Is my text saved or sent anywhere?', answer: 'No. Counting happens 100% in your browser via JavaScript. Your text never leaves your device — there is no server upload, no analytics on the content, and nothing stored.' },
    { question: 'Can I count words in a specific selection?', answer: 'In this tool, no — only the full pasted block is counted. For partial counts, copy just the chunk you want and paste it in.' },
    { question: 'What counts as a sentence?', answer: 'Any text ending in a period (.), question mark (?), or exclamation mark (!). Abbreviations like "Dr." or "etc." can occasionally inflate the count — manually subtract if you need exact precision.' },
    { question: 'Does the tool work offline?', answer: 'After the first page load, yes — all counting logic is in JavaScript that runs locally. Refreshing offline still works in most browsers.' },
  ],
  related: [TOOL_LINKS.readability, TOOL_LINKS.grammarChecker, TOOL_LINKS.outline, TOOL_LINKS.thesisGen, TOOL_LINKS.analyze, TOOL_LINKS.paraphrase],
  closing:
    'Word count is the most basic — and most overlooked — formatting requirement in academic writing. Going under is treated as an incomplete submission; going over is treated as ignoring instructions. Use this counter as a final check before every submission, and pair it with our AI essay checker to make sure the words you do have are pulling their weight.',
  accent: '#1CB0F6',
};

/* ─── CITATION GENERATOR ────────────────────────────────────────── */
export const citationGeneratorSeo: ToolSeoConfig = {
  heading: 'Free Citation Generator — APA, MLA, Chicago, Harvard, IEEE',
  intro:
    'Generate properly formatted citations for any source — book, journal article, website, podcast, video, thesis — in APA 7th, MLA 9th, Chicago, Harvard, IEEE, or Vancouver style. Fill in the fields you have, copy the formatted citation. No sign-up, no limit on how many you can generate.',
  steps: [
    { title: 'Pick your citation style', body: 'APA is the default for psychology, education, and most social sciences. MLA is the standard for English and humanities. Chicago is common in history. Harvard and IEEE are used in UK universities and engineering respectively.' },
    { title: 'Pick your source type', body: 'Book, journal article, website, podcast, video, conference paper, thesis, magazine, newspaper — pick the closest match. Each source type asks for slightly different fields (a book needs a publisher; a website needs an access date).' },
    { title: 'Fill in the fields you have', body: 'You don\'t need every field — leave optional ones blank. Author and title are the only universal requirements. For DOIs, paste the full URL or just the number; the tool handles both.' },
    { title: 'Copy the formatted citation', body: 'The full citation appears formatted in the chosen style with proper italics, capitalization, and punctuation. Copy it directly into your bibliography or works cited page.' },
  ],
  useCases: [
    { title: 'Building an APA reference list for a psychology paper', body: 'APA 7th changed how DOIs and URLs are formatted (now without "Retrieved from"). The generator uses APA 7 — the current standard at most US universities.' },
    { title: 'Writing an MLA Works Cited page for an English essay', body: 'MLA 9th edition requires container titles, version numbers, and access dates for online sources. Most students miss the access date — the generator forces you to include it.' },
    { title: 'Citing a podcast episode in an MLA paper', body: 'Podcast citations are notoriously inconsistent. The generator handles host, episode title, podcast name, publisher, episode number, and air date in the right format.' },
    { title: 'Citing a Cochrane systematic review in Vancouver', body: 'Medical and nursing students need Vancouver — numbered references, author initials, abbreviated journal names. The generator outputs the abbreviation rules correctly.' },
    { title: 'Bibliography for a UK university Harvard-style essay', body: 'Harvard isn\'t a single style — Cardiff, Bath, Manchester all have variants. The generator outputs the most common variant (Anglia Ruskin); cross-check your school\'s style guide for edge cases.' },
    { title: 'IEEE citations for a computer science thesis', body: 'IEEE uses numbered in-text references and a reference list ordered by citation appearance. The generator outputs both the formatted entry and the in-text reference number style.' },
  ],
  faqs: [
    { question: 'Does this generator support APA 7 or APA 6?', answer: 'APA 7th edition — the current standard since 2019. The biggest changes from APA 6: no "Retrieved from" before URLs, single space after periods, and DOIs as full URLs (https://doi.org/...).' },
    { question: 'Is this citation generator free?', answer: 'Yes — fully free, no sign-up, no daily limit. Use it as much as you want.' },
    { question: 'Will I get the same output as Zotero or Mendeley?', answer: 'Almost identical — we follow the official APA, MLA, and Chicago manuals. Tiny differences happen on edge cases (e.g. how to handle a missing author for a corporate website). Cross-check with your style guide if you\'re submitting to a journal.' },
    { question: 'Can I import a DOI and auto-fill the form?', answer: 'Not yet on this free tool — it requires a paid academic API. For DOI auto-fill, our paid Citation Finder (in the WriteScholar app) does it automatically.' },
    { question: 'How do I cite a website with no author?', answer: 'Move the title to the author position and use a shortened title in your in-text citation. Most styles allow corporate authors (e.g. "World Health Organization" for WHO publications).' },
    { question: 'How do I cite a YouTube video?', answer: 'Use "Video" or "Online video" as the source type. Cite the channel name as the author, video title in italics, "YouTube" as the platform, upload date, and the full video URL.' },
    { question: 'What\'s the difference between MLA and APA?', answer: 'APA prioritises author-date for in-text citations ("Smith, 2023") and is used in social sciences. MLA prioritises author-page ("Smith 42") and is used in humanities. They format reference entries very differently — never mix the two in one paper.' },
    { question: 'Do I need to italicize book titles?', answer: 'Yes — the generator handles italics automatically when you copy the formatted citation. Make sure you\'re pasting with formatting (Cmd/Ctrl+V), not as plain text (Cmd+Shift+V), or italics may be lost.' },
    { question: 'Can I generate hundreds of citations at once?', answer: 'Not in batch on this free tool. For batched citations from a research paper or topic, our paid Citation Finder pulls and formats sources from a single search query.' },
    { question: 'Will my citation be 100% correct?', answer: 'For standard sources (books, journal articles, websites), yes. Edge cases — translations, multi-volume works, archival manuscripts, government documents — sometimes need manual tweaks. Use the generator as a 95% solution and final-check unusual sources by hand.' },
  ],
  related: [TOOL_LINKS.outline, TOOL_LINKS.thesisGen, TOOL_LINKS.grammarChecker, TOOL_LINKS.analyze, TOOL_LINKS.paraphrase, TOOL_LINKS.summarizer],
  closing:
    'Citations are usually graded for two things: are they in the right style, and are they formatted correctly. This tool guarantees the second. The first is on you — match the style your professor specified (APA, MLA, etc.) and use the same one consistently throughout the paper. Mixing styles is a much bigger red flag than tiny formatting errors within a single style.',
};

/* ─── GRAMMAR CHECKER ───────────────────────────────────────────── */
export const grammarCheckerSeo: ToolSeoConfig = {
  heading: 'Free Grammar Checker — Spelling, Punctuation, and Style Errors',
  intro:
    'Paste any text and the grammar checker scans it instantly for spelling mistakes, punctuation issues, capitalization slips, and common style problems. Each issue is flagged with a category and a suggested fix. No sign-up, no word limit, no quota.',
  steps: [
    { title: 'Paste your text', body: 'Copy your essay, email, or social post and paste it into the editor. The checker runs as soon as you stop typing.' },
    { title: 'Read the issue list', body: 'Errors are coloured by severity: red for spelling and grammar errors, amber for warnings (e.g. passive voice, run-on sentences), and blue for style suggestions (e.g. "consider replacing with...").' },
    { title: 'Apply or skip each fix', body: 'Click a suggestion to apply it; click "ignore" to skip. The text updates live so you can see the cleaned version build up as you go.' },
    { title: 'Copy the corrected version', body: 'Once you\'ve cleaned every flagged issue, copy the corrected text. Paste it back into your essay, email, or whatever you started with.' },
  ],
  useCases: [
    { title: 'Final pass on a college essay before submission', body: 'Catches typos and missing commas a tired writer misses. Pair with the AI essay checker for content feedback — this tool is for surface-level errors.' },
    { title: 'Polishing a job-application email or cover letter', body: 'A single typo in a cover letter can sink a candidacy. Run it through here before hitting send — even a strong applicant looks careless with "thier" instead of "their".' },
    { title: 'Cleaning up a LinkedIn or X post', body: 'Posts with typos get fewer engagements. Quick check before you publish to keep your professional brand tight.' },
    { title: 'Editing a student newspaper article', body: 'Newspaper editors have to clean dozens of submissions. Drop each one in, fix the obvious issues, then focus your editorial time on structure and clarity.' },
    { title: 'Proofreading a research paper draft', body: 'Spelling and punctuation errors in a research paper signal carelessness even when the science is solid. Catch them here before peer review.' },
  ],
  faqs: [
    { question: 'Is this grammar checker really free?', answer: 'Yes — completely free with no sign-up. Unlike Grammarly, there\'s no premium version or paywall on advanced suggestions; what you see is what you get.' },
    { question: 'How does it compare to Grammarly?', answer: 'Grammarly has a more sophisticated AI engine and catches subtle stylistic issues this tool doesn\'t. For deep analysis we recommend our AI essay checker (full feedback + grade). For quick spelling/punctuation passes, this free checker is faster and more lightweight.' },
    { question: 'Will it catch all my errors?', answer: 'It catches the common ones — typos, missing capitals, double spaces, comma splices, basic subject-verb disagreements, repeated words. Subtle issues like dangling modifiers or unclear pronoun references need a deeper read or our paid essay checker.' },
    { question: 'Does it support British or American English?', answer: 'Both — it accepts US, UK, and Australian/Canadian spelling without flagging differences as errors ("colour" vs "color", "realise" vs "realize"). It does not auto-convert between them.' },
    { question: 'Can I check a long document at once?', answer: 'Yes — paste up to ~50,000 characters at a time. Past that, split your document into sections.' },
    { question: 'Does it work with markdown or rich text?', answer: 'Plain text is best. Markdown will be checked literally (asterisks, brackets show up). For rich text, paste with formatting and we\'ll ignore non-text characters.' },
    { question: 'Is my text private?', answer: 'Yes — the grammar check runs in your browser using rule-based pattern matching. Nothing is uploaded.' },
    { question: 'Why does it flag a correctly-spelled word?', answer: 'The dictionary covers ~250,000 common English words. Specialist vocabulary (medical, legal, technical jargon) and proper nouns may be flagged. Click "Add to dictionary" or just ignore.' },
    { question: 'Can I use it for non-English text?', answer: 'No — currently English only.' },
    { question: 'Will it detect AI-generated text or plagiarism?', answer: 'No, this tool only checks for grammar issues. For AI detection or plagiarism scanning, use a dedicated tool like Turnitin (most universities provide it).' },
  ],
  related: [TOOL_LINKS.wordCounter, TOOL_LINKS.readability, TOOL_LINKS.paraphrase, TOOL_LINKS.analyze, TOOL_LINKS.thesisGen, TOOL_LINKS.outline],
  closing:
    'Grammar errors are the cheapest marks to lose. They have nothing to do with the quality of your argument or research — and yet a paper riddled with them reads as careless and gets graded down accordingly. A two-minute pass through a grammar checker before submitting solves 90% of the issue.',
  accent: '#58CC02',
};

/* ─── READABILITY SCORE ─────────────────────────────────────────── */
export const readabilitySeo: ToolSeoConfig = {
  heading: 'Free Readability Score Calculator — Flesch-Kincaid, Gunning Fog, SMOG',
  intro:
    'Paste your text to instantly see its readability across six leading formulas: Flesch-Kincaid Grade Level, Flesch Reading Ease, Gunning Fog Index, SMOG, Coleman-Liau, and Automated Readability Index. Get a single average grade level plus diagnostics on long sentences and complex words.',
  steps: [
    { title: 'Paste your text', body: 'Drop in any English passage of 100+ words. Shorter samples produce unreliable scores because formulas need enough sentence and word data to be meaningful.' },
    { title: 'Read the headline grade level', body: 'The "Average Grade Level" combines Flesch-Kincaid, Gunning Fog, SMOG, Coleman-Liau, and ARI. A score of 9 means roughly 9th-grade reading level — appropriate for general audiences.' },
    { title: 'Check the diagnostics', body: 'Below the scores, see your average words per sentence, syllables per word, percentage of complex (3+ syllable) words, and sentence count. These tell you what to actually fix.' },
    { title: 'Edit and re-score', body: 'Shortening sentences and replacing complex words is the fastest way to drop your grade level. Re-paste after editing to see the new score.' },
  ],
  useCases: [
    { title: 'Writing for a general audience (blog, news, marketing)', body: 'Aim for grade 6-8. Most popular blogs and news outlets target this range — readers skim, and complex prose loses them. Apple\'s marketing copy averages grade 4.' },
    { title: 'Writing for college students or professionals', body: 'Grade 10-12. Higher-ed audiences can handle longer sentences and three-syllable words, but cramming every sentence with jargon costs you readers.' },
    { title: 'Writing an academic paper', body: 'Grade 12-15 is normal for research papers. Some journals (Nature) explicitly target lower grade levels to broaden readership; others (specialist medical) accept higher.' },
    { title: 'Health, finance, or government communications', body: 'Plain-language laws in the US, UK, and Australia require grade 8 or below for public-facing health and government content. Score check is now standard practice.' },
    { title: 'Cleaning up an essay for clarity', body: 'If your readability score jumped 5 grade levels in one paragraph, you probably packed too much into one sentence. Split it.' },
  ],
  faqs: [
    { question: 'What is a "good" readability score?', answer: 'Depends on audience. For general blogs, grade 6-8. For business/professional, grade 10-12. For academic, grade 12-15. Below 6 reads as condescending; above 15 reads as inaccessible.' },
    { question: 'Which formula should I trust?', answer: 'For most general writing, Flesch-Kincaid Grade Level is the most-cited. For health communications, SMOG is the standard. The "Average" combines all five for a balanced view.' },
    { question: 'Does the tool work for languages other than English?', answer: 'No — these formulas are calibrated for English syllable patterns. Other languages need their own (e.g. Lix for Scandinavian languages).' },
    { question: 'How long does my text need to be?', answer: 'At least 100 words for stable scores; 300+ for reliable ones. Below 100 words, sentence and word averages swing wildly with each addition.' },
    { question: 'What is Flesch Reading Ease?', answer: 'A 0-100 score where higher = easier. 90-100 is 5th grade; 60-70 is plain English (8-9th grade); below 30 is graduate-level. The opposite direction from grade-level scores.' },
    { question: 'How is "complex word" defined?', answer: 'A word with 3 or more syllables, excluding compounds, proper nouns, and common suffixes (-ed, -es). Used by Gunning Fog and SMOG.' },
    { question: 'How do I lower my readability score?', answer: 'Three moves: (1) split long sentences, (2) replace 3+ syllable words with shorter synonyms ("utilize" → "use"), (3) cut filler ("in order to" → "to"). Each helps both grade level and Flesch reading ease.' },
    { question: 'Is grade level the same as years of education?', answer: 'Yes, roughly. Grade 9 ≈ 9th grade in US (age 14-15) ≈ Year 10 UK ≈ Year 9 Australia. A grade-12 score means a typical high-school graduate can read it without difficulty.' },
    { question: 'Why do different formulas give different scores?', answer: 'Each weights sentence length, word length, and syllable count differently. Flesch-Kincaid favours sentence length; SMOG favours complex words. The average smooths out individual quirks.' },
    { question: 'Can I trust this for academic submissions?', answer: 'Yes for first-pass diagnostics. Don\'t use it as the only check — readability scores can\'t tell whether your argument is logical, your evidence is strong, or your structure works. Use our AI essay checker for content-level feedback.' },
  ],
  related: [TOOL_LINKS.wordCounter, TOOL_LINKS.grammarChecker, TOOL_LINKS.paraphrase, TOOL_LINKS.thesisGen, TOOL_LINKS.outline, TOOL_LINKS.analyze],
  accent: '#FF9600',
};

/* ─── THESIS GENERATOR ──────────────────────────────────────────── */
export const thesisGenSeo: ToolSeoConfig = {
  heading: 'Free Thesis Statement Generator — Argumentative, Analytical, Compare-Contrast',
  intro:
    'A weak thesis sinks an essay before the first body paragraph. This generator builds a strong, focused thesis statement for argumentative, expository, analytical, and compare-contrast essays. Fill in your topic, position, and reasoning — get a clean, debatable thesis you can drop into your introduction.',
  steps: [
    { title: 'Pick your essay type', body: 'Argumentative (you take a side), expository (you explain), analytical (you break down a text), or compare-contrast (you weigh two things). The thesis structure changes for each — picking the right one is half the battle.' },
    { title: 'Enter your topic', body: 'Be specific. "Climate change" is too broad; "the impact of carbon taxes on small businesses" is workable. The narrower your topic, the stronger your thesis.' },
    { title: 'State your position and reasons', body: 'For argumentative essays, give your stance plus 2-3 reasons. For analytical, give your interpretation plus 2-3 supporting points. The reasons become your body paragraph topics.' },
    { title: 'Review and refine', body: 'The generator outputs a working thesis. Read it once and check: is it debatable, specific, and answerable in one essay? If not, narrow it further or strengthen your position.' },
  ],
  useCases: [
    { title: 'Drafting an argumentative essay introduction', body: 'A thesis like "Social media should be regulated" is weak — too broad, too obvious. "Federal regulation of algorithmic content recommendations would reduce teen anxiety more effectively than age verification laws" is strong.' },
    { title: 'Building a compare-contrast paper', body: 'A compare-contrast thesis names both subjects and the criteria for comparison. "While both novels critique consumer culture, Fight Club uses spectacle and American Psycho uses horror to make their points." Subject + criteria + claim.' },
    { title: 'Writing an analytical literary essay', body: 'Don\'t just summarize. Make a claim about what the author is doing. "Toni Morrison uses second-person narration in Beloved to force the reader into Sethe\'s memory loops." This is a thesis a critic could disagree with — that\'s what makes it strong.' },
    { title: 'Research paper introductions', body: 'Research thesis statements often state the central question and the predicted answer. "This paper investigates whether minimum wage increases reduce employment in fast food, finding that the effect is statistically insignificant in markets with high turnover."' },
    { title: 'Thesis prep for a debate or speech', body: 'A debate thesis must be defensible and specific. The same generator works for prep — pick "argumentative", state your stance, and use the output as your opening claim.' },
  ],
  faqs: [
    { question: 'What makes a thesis statement strong?', answer: 'Three things: (1) it\'s debatable — a reasonable person could disagree; (2) it\'s specific — you can answer it in the essay\'s word count; (3) it\'s focused — one main argument, not three.' },
    { question: 'Should a thesis be one sentence?', answer: 'Usually, yes. Two sentences max, only if you need to add a "because" clause. If your thesis sprawls into three sentences, your argument isn\'t focused enough.' },
    { question: 'Where does the thesis go in an essay?', answer: 'Last sentence of the introduction paragraph. This signals "here\'s what I\'m going to argue" and sets up the body paragraphs that follow.' },
    { question: 'Can I change my thesis after I start writing?', answer: 'Yes — and you probably will. Drafting reveals what your real argument is. Update the thesis to match your final body paragraphs before you submit.' },
    { question: 'Is a question allowed as a thesis?', answer: 'No. A thesis is a claim, not a question. Use a question in the introduction to set up the topic, then state the answer as your thesis.' },
    { question: 'How long should a thesis statement be?', answer: '15-30 words is the sweet spot. Below 15 is usually too vague; above 30 starts compressing too many ideas.' },
    { question: 'What\'s the difference between a thesis and a topic sentence?', answer: 'A thesis controls the entire essay; a topic sentence controls one paragraph. Each body paragraph needs its own topic sentence that ties back to the thesis.' },
    { question: 'Can I use this generator for a graduate-level paper?', answer: 'Yes — the structure works at any level. Grad-level theses are usually narrower and more theoretically grounded; use the generator output as a starting frame and refine.' },
    { question: 'Does it work for a research proposal?', answer: 'Yes — pick "argumentative" or "analytical" and frame your research question as the position. The generator output becomes your hypothesis statement.' },
    { question: 'Will the generated thesis be unique to me?', answer: 'Yes — the output is built from your specific inputs. Two students with different topics and positions get different theses. The generator doesn\'t pull from a template database.' },
  ],
  related: [TOOL_LINKS.outline, TOOL_LINKS.analyze, TOOL_LINKS.grammarChecker, TOOL_LINKS.paraphrase, TOOL_LINKS.citationGenerator, TOOL_LINKS.summarizer],
  closing:
    'The thesis is the single most important sentence in your essay — it\'s the thing your reader uses to decide whether the rest is worth reading. Spending 15 minutes here before drafting saves hours of rewriting later.',
};

/* ─── ESSAY OUTLINE GENERATOR ───────────────────────────────────── */
export const essayOutlineSeo: ToolSeoConfig = {
  heading: 'Free Essay Outline Generator — Argumentative, Persuasive, Research, Narrative',
  intro:
    'Build a structured outline for any essay type in 30 seconds. Pick the format, enter your topic and thesis, and the generator returns a ready-to-fill outline with introduction, body paragraphs, transitions, and conclusion sections. Copy it into your draft and start writing the body, not staring at a blank page.',
  steps: [
    { title: 'Choose your essay type', body: 'Argumentative, expository, narrative, persuasive, compare-contrast, or research. The outline structure changes meaningfully — narrative essays use chronological flow; argumentative essays use claim-evidence-rebuttal.' },
    { title: 'Enter your topic and thesis', body: 'A specific topic and thesis produce a more useful outline. If you don\'t have a thesis yet, our thesis generator (linked below) drafts one in seconds.' },
    { title: 'Choose the number of body paragraphs', body: 'Three is standard for a 1,000-1,500 word essay. Five for a 2,000-3,000 word paper. Each body paragraph in the outline gets its own topic sentence stub and supporting-evidence prompts.' },
    { title: 'Copy and start filling', body: 'The outline appears with intro hook, thesis placement, body paragraph stubs, transitions, and conclusion sections. Copy it into your draft and start filling — the structure is already done.' },
  ],
  useCases: [
    { title: 'Beating writer\'s block on a persuasive essay', body: 'Most blank-page paralysis comes from not having a structure. Get the outline first; the words come faster once you know where each paragraph is going.' },
    { title: 'Planning a research paper', body: 'Research papers need a literature review, methodology, results, and discussion. The "research" template lays out all four sections so you don\'t skip the methodology mistake everyone makes their first time.' },
    { title: 'Structuring a compare-contrast essay', body: 'Two organizational choices: block (all of A, then all of B) or point-by-point (A1 vs B1, A2 vs B2). The outline shows you both so you can pick what works for your topic.' },
    { title: 'Preparing for a timed exam essay', body: 'In a 60-minute essay exam, spend the first 5 minutes on a quick outline. Generate one before the exam to memorize the structure — it carries you when the clock is ticking.' },
    { title: 'Building a narrative essay (memoir, college essay)', body: 'Narrative essays need a hook, a "why this matters" turn, and a reflective close. The narrative outline includes all three so your personal statement doesn\'t devolve into "and then I did X, and then I did Y".' },
  ],
  faqs: [
    { question: 'What essay types does the generator support?', answer: 'Argumentative, expository, narrative, persuasive, compare-contrast, and research. Each has a distinct outline structure — pick the closest match for your assignment.' },
    { question: 'How many body paragraphs should my essay have?', answer: 'Three for a 5-paragraph essay (~1,500 words). Five for a 10-page paper (~2,500 words). For research papers, body paragraphs are organized into sections (literature review, methodology, results) rather than counted.' },
    { question: 'Should I follow the outline exactly?', answer: 'Treat it as scaffolding. Most writers tweak as they draft — the outline\'s job is to keep you moving forward, not to constrain you.' },
    { question: 'What goes in the introduction?', answer: 'Hook → context → thesis. The hook grabs attention; the context briefly explains why the topic matters; the thesis (last sentence) states your specific argument.' },
    { question: 'Where does the thesis go?', answer: 'Last sentence of the introduction. The body paragraphs that follow each defend one piece of the thesis.' },
    { question: 'How do I write transitions between paragraphs?', answer: 'Each paragraph\'s last sentence should hint at the next. Avoid rote phrases like "Furthermore" or "In addition" — use specific transitions tied to your argument ("This raises the question of whether..." or "But that account misses...").' },
    { question: 'What goes in the conclusion?', answer: 'Restate the thesis (in different words) → summarize key points → end with a "so what" — implications, applications, or unanswered questions. Never introduce new evidence in the conclusion.' },
    { question: 'Is this outline AI-generated?', answer: 'The structure templates are pre-built; your topic and thesis are inserted into the template. There\'s no large language model generating original sentences here — that\'s why it\'s instant and free.' },
    { question: 'Will my professor know I used an outline generator?', answer: 'No — the outline is just a structure. Your actual writing fills in the words. Outlines are a normal part of the writing process; using one isn\'t academic dishonesty.' },
    { question: 'Does it work for a college admissions essay?', answer: 'Yes — pick "narrative" for personal statements. The narrative outline gives you the hook, growth arc, and reflective close that admissions readers expect.' },
  ],
  related: [TOOL_LINKS.thesisGen, TOOL_LINKS.analyze, TOOL_LINKS.grammarChecker, TOOL_LINKS.citationGenerator, TOOL_LINKS.wordCounter, TOOL_LINKS.summarizer],
  accent: '#1CB0F6',
};

/* ─── TEXT CASE CONVERTER ───────────────────────────────────────── */
export const textCaseSeo: ToolSeoConfig = {
  heading: 'Free Text Case Converter — UPPERCASE, lowercase, Title Case, Sentence case',
  intro:
    'Switch any text between UPPERCASE, lowercase, Title Case, Sentence case, capitalize Each Word, aLtErNaTiNg, or iNVERSE in one click. Useful for headlines, code constants, social posts, and cleaning up text accidentally typed in caps lock.',
  steps: [
    { title: 'Paste your text', body: 'Drop any block of text into the input. Length doesn\'t matter — the conversion is instant even on 50,000-character documents.' },
    { title: 'Click the case you want', body: 'Pick from UPPERCASE, lowercase, Title Case, Sentence case, Capitalize Each Word, aLtErNaTiNg, or iNVERSE. Each is a one-click button.' },
    { title: 'Copy the result', body: 'Click "Copy" to put the converted text on your clipboard. Original text stays in the input so you can switch between cases without re-pasting.' },
  ],
  useCases: [
    { title: 'Fixing text typed with caps lock on', body: 'PASTE THE WHOLE PARAGRAPH IN, click "Sentence case", get the cleaned version. Faster than retyping.' },
    { title: 'Formatting a headline', body: 'Title Case (Every Important Word Capitalized) is standard for English headlines, blog titles, and book chapters. Articles, conjunctions, and prepositions stay lowercase.' },
    { title: 'Generating CONSTANT_CASE for code', body: 'Programming languages use UPPERCASE for constants. Convert your variable name list once instead of holding shift through 30 names.' },
    { title: 'Cleaning OCR\'d text', body: 'Scanned documents often come out in random case mixes. Convert to lowercase first, then sentence case, to normalize.' },
    { title: 'Social media post emphasis', body: 'aLtErNaTiNg case is internet shorthand for sarcasm. iNVERSE case (lowercase first letter, uppercase rest) is the SpongeBob mocking meme. Both are one-click.' },
    { title: 'Academic paper title formatting', body: 'APA uses sentence case for paper titles in references. MLA uses title case. Convert once based on your style guide instead of capitalizing word-by-word.' },
  ],
  faqs: [
    { question: 'Is this text case converter free?', answer: 'Yes — completely free, no sign-up, no character limit.' },
    { question: 'What\'s the difference between Title Case and "Capitalize Each Word"?', answer: 'Title Case follows publishing rules — articles ("the", "a"), conjunctions ("and", "but"), and short prepositions ("of", "in") stay lowercase unless they\'re the first or last word. "Capitalize Each Word" puts a capital on every single word, including those.' },
    { question: 'How is sentence case different from Title Case?', answer: 'Sentence case capitalizes only the first word of each sentence and proper nouns ("This is a sentence."). Title Case capitalizes most words ("This Is a Title").' },
    { question: 'Will it preserve special characters and emoji?', answer: 'Yes — case conversion only affects letters. Emoji, numbers, punctuation, and special characters pass through unchanged.' },
    { question: 'Does it handle non-English characters?', answer: 'Yes for most Latin-alphabet languages (French, Spanish, German). Works for Cyrillic and Greek. Does not handle case for languages without case (Chinese, Japanese, Arabic) — they pass through unchanged.' },
    { question: 'Is my text uploaded anywhere?', answer: 'No. The conversion runs entirely in your browser using JavaScript string functions.' },
    { question: 'Can I batch-convert multiple paragraphs?', answer: 'Yes — paste them all in at once. The converter treats the input as one string and applies the case rule across the entire block.' },
    { question: 'How does sentence case detect sentence boundaries?', answer: 'It capitalizes the first letter after a period (.), question mark (?), or exclamation mark (!) followed by whitespace. Some abbreviations ("Dr.", "etc.") may be treated as sentence ends — manually fix in those edge cases.' },
    { question: 'Why is my "Title Case" output different from Microsoft Word\'s?', answer: 'Word follows the AP Stylebook by default. We follow the Chicago Manual of Style. Both are valid English title-case standards, but they differ on a handful of edge words ("Up" vs "up", "If" vs "if").' },
  ],
  related: [TOOL_LINKS.wordCounter, TOOL_LINKS.grammarChecker, TOOL_LINKS.readability, TOOL_LINKS.outline, TOOL_LINKS.thesisGen, TOOL_LINKS.paraphrase],
};

/* ─── PARAPHRASING TIPS ─────────────────────────────────────────── */
export const paraphraseSeo: ToolSeoConfig = {
  heading: 'Free Paraphrasing Tips — Spot Weak Verbs, Wordy Phrases, Passive Voice',
  intro:
    'Paste your essay or paragraph and the analyzer flags overused words, weak verbs, wordy phrases, passive voice, and clichés — the most common style problems in academic writing. You get a list of issues with rewrite suggestions, not a one-click rewrite. The goal is to teach you to paraphrase, not to do it for you.',
  steps: [
    { title: 'Paste your text', body: 'Any paragraph, page, or full essay. The analyzer works best on 100+ words because patterns become statistically meaningful.' },
    { title: 'Read the issue categories', body: 'Each category has a count + examples: overused words, weak verbs, wordy phrases, passive voice, clichés, hedging language, vocabulary diversity score.' },
    { title: 'Apply the fixes', body: 'Each flagged item gets specific rewrite suggestions. "She made a decision" → "She decided". "Due to the fact that" → "Because". Apply selectively — not every flag needs fixing.' },
    { title: 'Recheck and refine', body: 'Re-paste your edited version to see your improvement. A good target: bring your "weak verb" count down 50% on the first pass.' },
  ],
  useCases: [
    { title: 'Paraphrasing a quote without plagiarism', body: 'Plagiarism risk happens when paraphrases stay too close to the original. The analyzer shows you which phrases are wordy boilerplate that any thesaurus would flag — replace those first.' },
    { title: 'Strengthening a college essay', body: 'College essays read flat when they overuse "is", "was", and "are". The weak-verb finder shows you exactly where to swap in active verbs ("argues", "demonstrates", "challenges").' },
    { title: 'Cutting a paper to a word limit', body: 'Wordy phrases ("in order to", "due to the fact that", "for the purpose of") add length without adding meaning. The analyzer finds them — cutting saves hundreds of words on a 2,500-word paper.' },
    { title: 'Active vs passive voice for journalism', body: 'Journalism style guides demand active voice. "Mistakes were made" → "The CEO made mistakes". The passive-voice flag shows you every passive construction in your draft.' },
    { title: 'Improving research paper readability', body: 'Academic writing is famously dense. Paraphrasing toward shorter, more direct sentences raises your readability score and broadens your audience.' },
  ],
  faqs: [
    { question: 'Is this an AI paraphrasing tool?', answer: 'No — it\'s an analysis tool, not a rewrite tool. It tells you what to fix; you rewrite the sentences. This is intentional: AI rewrites often introduce factual errors and trip plagiarism detectors. Learning to paraphrase yourself avoids both.' },
    { question: 'How do I paraphrase without plagiarising?', answer: 'Three-step rule: (1) read the source, (2) close it and write what you understood in your own words, (3) cite the source. Never write with the source open in front of you — that\'s where plagiarism happens.' },
    { question: 'What\'s a "weak verb"?', answer: 'Forms of "to be" (is, was, were, are), generic verbs (do, get, make, have), and stative verbs that don\'t describe action. "She was the writer of the essay" → "She wrote the essay".' },
    { question: 'Should I eliminate all passive voice?', answer: 'No — passive is correct when the actor is unknown ("The bridge was built in 1923") or when the action matters more than the actor ("Mistakes were made" — sometimes the political non-attribution is the point). Eliminate it only when active is clearer.' },
    { question: 'What\'s "vocabulary diversity"?', answer: 'The ratio of unique words to total words. A diverse essay uses many distinct words; a repetitive essay uses few. Aim for 50%+ diversity on academic writing.' },
    { question: 'How is this different from Grammarly\'s rephrase feature?', answer: 'Grammarly rewrites sentences for you. We show you what\'s wrong so you learn to rewrite. Different goals — pick the one that matches your aim.' },
    { question: 'Does the tool handle British English?', answer: 'Yes — it ignores spelling differences and treats both UK and US as standard.' },
    { question: 'Will it detect plagiarism?', answer: 'No — for plagiarism detection, use Turnitin (most universities provide it) or our paid AI essay checker, which includes a similarity check against the open web.' },
    { question: 'How long can my text be?', answer: 'Up to ~50,000 characters. Longer texts can be split into sections.' },
    { question: 'Is my text private?', answer: 'Yes — analysis runs in your browser. Nothing is stored.' },
  ],
  related: [TOOL_LINKS.grammarChecker, TOOL_LINKS.readability, TOOL_LINKS.thesisGen, TOOL_LINKS.outline, TOOL_LINKS.analyze, TOOL_LINKS.summarizer],
  accent: '#FF9600',
};

/* ─── GPA CALCULATOR ────────────────────────────────────────────── */
export const gpaSeo: ToolSeoConfig = {
  heading: 'Free GPA Calculator — Semester and Cumulative GPA',
  intro:
    'Add your courses, credit hours, and letter grades to instantly compute your semester GPA. Add multiple semesters to compute your cumulative GPA. Supports standard 4.0 scale, weighted scales (AP/honors +0.5), and unweighted scales. No sign-up.',
  steps: [
    { title: 'Add a course', body: 'Click "Add Course" and enter the course name, credit hours, and your letter grade. Most US colleges use 3-credit courses for standard classes; lab courses are often 1 credit; senior thesis or capstone classes can be 6.' },
    { title: 'Repeat for every course this semester', body: 'Add each course separately. The GPA recalculates live as you add courses, so you can see how a single grade pulls your average up or down.' },
    { title: 'View your semester GPA', body: 'The headline number is your unweighted GPA on a 4.0 scale. A 3.5 is "B+/A-" territory; a 3.7 is solid A-; a 4.0 is straight As.' },
    { title: 'Add more semesters for cumulative GPA', body: 'Click "Add Semester" to layer in past terms. Cumulative GPA averages across all credit hours, not all semesters — a heavy 18-credit semester pulls more than a light 12-credit semester.' },
  ],
  useCases: [
    { title: 'Predicting your end-of-semester GPA', body: 'Halfway through finals, plug in your current expected grades. Tells you if you\'re on track for honors (3.5+ at most schools) or scholarship retention (often 3.0).' },
    { title: 'Planning for grad school applications', body: 'Most grad programs care about cumulative GPA + last-60-credits GPA. Add only your last 60 credits separately to see what an admissions committee will actually look at.' },
    { title: 'Calculating the impact of dropping a course', body: 'Will dropping a 3-credit class with a current C+ help or hurt? Plug in both scenarios and compare.' },
    { title: 'Checking eligibility for scholarship retention', body: 'Most merit scholarships require a 3.0 or 3.5 minimum. Run your projected GPA before declaring a course load to make sure you\'re safe.' },
    { title: 'Comparing weighted vs unweighted GPAs', body: 'High schools use weighted GPAs (AP/honors +0.5 or +1.0). Colleges use unweighted. Use both modes to see how an admissions reader will compare you.' },
  ],
  faqs: [
    { question: 'How is GPA calculated?', answer: 'Multiply each course\'s credit hours by its grade points (A=4, B=3, C=2, D=1, F=0), sum them, and divide by total credit hours. The calculator does this for you.' },
    { question: 'What\'s the difference between weighted and unweighted GPA?', answer: 'Unweighted: A=4.0 regardless of course difficulty. Weighted: A in an AP/honors class = 4.5 or 5.0. High schools use weighted to reward harder courses; most colleges use unweighted because course difficulty varies too much across schools.' },
    { question: 'How do +/- letter grades work?', answer: 'A=4.0, A-=3.7, B+=3.3, B=3.0, B-=2.7, etc. Some schools (Ivy League, many state schools) use +/-; others use only whole letters. Check your registrar\'s scale.' },
    { question: 'How do I calculate cumulative GPA?', answer: 'Sum (credits × grade points) across all semesters, then divide by total credits across all semesters. The calculator handles this automatically when you add multiple semesters.' },
    { question: 'What\'s a "good" GPA?', answer: 'Depends on context. Honors: 3.5+ at most US schools. Med school: 3.7+ to be competitive. Law school: 3.5+ for top schools. Engineering jobs: 3.0+ at most large employers.' },
    { question: 'How do pass/fail courses affect GPA?', answer: 'Most schools exclude pass/fail courses from GPA calculation entirely — a "Pass" doesn\'t add or subtract grade points. Set those courses to 0 credits or omit them.' },
    { question: 'How do withdrawals (W) affect GPA?', answer: 'A "W" doesn\'t count toward GPA — it\'s a transcript notation, not a grade. The course doesn\'t contribute to or detract from your average. Too many Ws can still hurt grad school applications.' },
    { question: 'How do I convert percentages to letter grades?', answer: 'Most US scales: 90-100 = A, 80-89 = B, 70-79 = C, 60-69 = D, below 60 = F. Some schools use 93+ for A. Your school\'s registrar publishes the official conversion.' },
    { question: 'Can I calculate UK or international GPA equivalents?', answer: 'This tool uses the US 4.0 scale. UK first-class honours ≈ 3.7+ US GPA; 2:1 ≈ 3.3-3.7; 2:2 ≈ 2.7-3.3. Conversions are approximate — always check the receiving institution\'s policy.' },
    { question: 'Is my GPA data saved?', answer: 'No — calculations happen in your browser and clear when you close the tab. We don\'t store any of your courses or grades.' },
  ],
  related: [TOOL_LINKS.calc, TOOL_LINKS.conv, TOOL_LINKS.pomodoro, TOOL_LINKS.outline, TOOL_LINKS.analyze, TOOL_LINKS.thesisGen],
  accent: '#58CC02',
};

/* ─── POMODORO TIMER ────────────────────────────────────────────── */
export const pomodoroSeo: ToolSeoConfig = {
  heading: 'Free Pomodoro Timer — Focus Sessions and Breaks',
  intro:
    'A Pomodoro timer breaks study time into 25-minute focused sessions ("pomodoros") with 5-minute breaks between them, and a longer 15-30 minute break after every fourth session. The structure is the entire technique — your job is to work for the full focus interval and rest for the full break interval.',
  steps: [
    { title: 'Pick your interval lengths', body: 'Default is 25/5/15 (25-minute focus, 5-minute short break, 15-minute long break after 4 cycles). New to Pomodoro? Stick with the default. Already a power user? Try 50/10 or 90/15 for deeper work.' },
    { title: 'Start the focus timer', body: 'Click Start. For 25 minutes, do nothing but the task you set. No phone, no email, no notifications, no "just one tab". Single-tasking is the entire point of the technique.' },
    { title: 'Take the break', body: 'When the timer rings, stop work mid-sentence if you have to. Stand up, walk, get water, look out a window. Don\'t scroll social media or check email — that\'s context-switching, not rest.' },
    { title: 'Repeat for 4 cycles, then long break', body: 'After four 25-minute sessions, take a 15-30 minute break. Do something genuinely restorative — short walk, lunch, full step away. Then resume.' },
  ],
  useCases: [
    { title: 'Studying for a final exam', body: 'Three Pomodoro cycles (12 sessions × 25 min = 5 hours of focus + 1 hour of breaks) is a heavy but sustainable study day. Most students burn out trying to grind 8 hours straight.' },
    { title: 'Writing a long essay', body: 'Drafting essays goes faster in 25-minute chunks because there\'s no pressure to finish a section in one sitting. Hit your word count for the session, take the break, come back fresh.' },
    { title: 'Beating procrastination', body: 'Procrastination usually means "the task feels too big to start". 25 minutes is short. "I\'ll just do one Pomodoro" is much easier than "I\'ll work on my paper all afternoon".' },
    { title: 'Coding or programming work', body: 'Software developers popularized Pomodoro because debugging benefits from forced breaks. Stuck on a bug? The break often surfaces the answer subconsciously.' },
    { title: 'Reading dense academic papers', body: 'Reading a 30-page paper in one sitting fries comprehension. Three Pomodoros (75 minutes of focused reading + 15 minutes of breaks) lets you actually retain it.' },
    { title: 'ADHD-friendly focus structure', body: 'Many students with ADHD report Pomodoros work better than open-ended study time because the timer creates urgency. Adjust intervals shorter (15/3) if 25 minutes feels too long.' },
  ],
  faqs: [
    { question: 'What is the Pomodoro Technique?', answer: 'A time-management method by Francesco Cirillo (1980s). Work in 25-minute blocks, break for 5, take a longer break every 4th cycle. The Italian word "pomodoro" means tomato — Cirillo used a tomato-shaped kitchen timer.' },
    { question: 'Why 25 minutes?', answer: 'Short enough to feel manageable, long enough to get into flow. Cirillo experimented with longer and shorter intervals; 25 was the empirical sweet spot for most knowledge work.' },
    { question: 'Can I customize the intervals?', answer: 'Yes — the timer lets you set focus, short-break, and long-break durations independently. Some people prefer 50/10 (longer focus); some prefer 15/3 (shorter focus, less mental fatigue).' },
    { question: 'Should I keep working if I\'m in flow?', answer: 'Cirillo says no — break anyway. The forced break is what makes the next session productive. In practice, finish your current sentence/paragraph/function then break.' },
    { question: 'What should I do during the break?', answer: 'Anything that\'s NOT the same kind of mental work: walk, stretch, get water, look outside. Avoid screens — checking email or social media is context-switching, not rest.' },
    { question: 'Does the timer make a sound when it ends?', answer: 'Yes — there\'s a built-in beep. Toggle it off in the settings if you\'re in a quiet space.' },
    { question: 'Can I track how many Pomodoros I do?', answer: 'Yes — the counter at the top of the timer increments every completed focus cycle. Resets when you close the tab.' },
    { question: 'Is the Pomodoro Technique evidence-based?', answer: 'Mixed evidence. The general principle of breaking work into intervals with rest is well-supported (the "spacing effect" in learning science). The exact 25/5 split is more rule-of-thumb than experimentally validated.' },
    { question: 'What if I get interrupted during a Pomodoro?', answer: 'Cirillo\'s rule: if a real interruption comes, abandon the Pomodoro entirely and start a fresh one when ready. Don\'t pause and resume — it breaks the focus discipline.' },
    { question: 'Can I use it for non-study work?', answer: 'Yes — Pomodoros work for any focused single-tasking work: writing, coding, reading, design, music practice. Less useful for collaborative or meeting-heavy work.' },
  ],
  related: [TOOL_LINKS.gpa, TOOL_LINKS.calc, TOOL_LINKS.outline, TOOL_LINKS.thesisGen, TOOL_LINKS.summarizer, TOOL_LINKS.flashcards],
};

/* ─── SCIENTIFIC CALCULATOR ─────────────────────────────────────── */
export const calcSeo: ToolSeoConfig = {
  heading: 'Free Online Scientific Calculator — Trig, Log, Exponents',
  intro:
    'A full scientific calculator with trigonometric functions (sin, cos, tan and inverses), logarithms (log, ln), exponents (x², xⁿ, eˣ), square root, factorial (n!), constants (π, e), and degree/radian modes. Works in any browser, no installs, no sign-up.',
  steps: [
    { title: 'Enter the expression', body: 'Type or click buttons to build your expression. Standard order of operations applies (parentheses first, then exponents, then multiplication/division, then addition/subtraction).' },
    { title: 'Switch degree/radian for trig', body: 'For sin/cos/tan, the calculator defaults to degrees. Click "Rad" to switch to radians (used in calculus and physics). Make sure you\'re in the right mode — sin(30°) ≠ sin(30 rad).' },
    { title: 'Press equals', body: 'Hit the = button or press Enter to evaluate. The result displays with up to 12 significant figures. Press it again to reuse the result in a new expression.' },
  ],
  useCases: [
    { title: 'Physics homework — trig and exponentials', body: 'Calculating velocity components, projectile motion, oscillations? You need sin, cos, tan plus the right unit (radians for calculus-based physics; degrees for engineering).' },
    { title: 'Chemistry — pH and pKa calculations', body: 'pH = -log[H⁺]. The log function and inverse log (10ˣ) handle pH, pKa, and equilibrium calculations on the fly.' },
    { title: 'Algebra II / Pre-calc', body: 'Logarithm rules, exponential growth/decay, factorial in combinations and permutations — all the buttons are here.' },
    { title: 'Statistics — combinations and permutations', body: 'C(n,r) = n!/(r!(n-r)!). Use the factorial (!) button to crunch combinations and permutations without installing a stats package.' },
    { title: 'Engineering — quick unit conversions', body: 'Pair this with our unit converter (linked below) for engineering: calculate the value here, convert units there.' },
    { title: 'Math course quick checks', body: 'Doing a problem set by hand? Use the calculator to verify each answer. Faster than firing up Wolfram Alpha for routine arithmetic.' },
  ],
  faqs: [
    { question: 'Is this calculator free?', answer: 'Yes — completely free, no sign-up, runs in your browser.' },
    { question: 'How do I switch between degrees and radians?', answer: 'Click the Deg/Rad toggle near the top. Degrees for most geometry and engineering work; radians for calculus and physics.' },
    { question: 'How do I calculate inverse trig (arcsin, arccos, arctan)?', answer: 'Use sin⁻¹, cos⁻¹, tan⁻¹ buttons. Output respects your current degree/radian mode.' },
    { question: 'What\'s the difference between log and ln?', answer: 'log = base 10. ln = natural log (base e ≈ 2.718). For chemistry pH, use log. For calculus and continuous growth, use ln.' },
    { question: 'How do I compute eˣ?', answer: 'Use the eˣ button (or shift+ln, depending on layout). For e itself, type "e" — most calculators have an e constant button.' },
    { question: 'What\'s the maximum number it can handle?', answer: 'JavaScript IEEE 754 doubles — max ~1.8 × 10³⁰⁸. Beyond that you get Infinity. Sufficient for any high school or undergraduate work.' },
    { question: 'Does it support keyboard shortcuts?', answer: 'Yes — number keys for digits, +/-/*//for operators, Enter for equals, Backspace to delete the last character, Escape to clear.' },
    { question: 'Can I see my calculation history?', answer: 'No persistent history — each calculation displays the current expression and result. For homework, copy each result down as you go.' },
    { question: 'How do I compute square root or cube root?', answer: 'Square root has its own button (√). For cube root, use x^(1/3): type 27, then x^, then 1/3, then equals.' },
    { question: 'Can I use it for matrix or graphing?', answer: 'No — this is a scientific calculator, not a graphing or matrix calculator. For matrices try Wolfram Alpha; for graphing try Desmos.' },
  ],
  related: [TOOL_LINKS.conv, TOOL_LINKS.gpa, TOOL_LINKS.pomodoro, TOOL_LINKS.outline, TOOL_LINKS.thesisGen, TOOL_LINKS.flashcards],
};

/* ─── UNIT CONVERTER ────────────────────────────────────────────── */
export const converterSeo: ToolSeoConfig = {
  heading: 'Free Unit Converter — Length, Weight, Temperature, Volume, Time',
  intro:
    'Convert between metric and imperial units across length, weight, temperature, volume, area, time, speed, and energy. Pick a category, enter a value, get every common unit at once. No sign-up, instant conversion as you type.',
  steps: [
    { title: 'Pick a category', body: 'Length, weight, temperature, volume, area, time, speed, or energy. Each category has its own preset list of units (length: km, m, cm, mm, in, ft, yd, mi, etc.).' },
    { title: 'Enter your value', body: 'Type a number in any unit field. The other fields update instantly to show the equivalent in every other unit in the category.' },
    { title: 'Copy the conversion', body: 'Click any field to select; copy the value out for use elsewhere. The converter holds your value as long as the tab is open.' },
  ],
  useCases: [
    { title: 'Cooking — converting metric recipes to imperial', body: 'European cookbooks use grams and millilitres; US recipes use cups and tablespoons. Convert 250g flour to cups (≈2) before you start.' },
    { title: 'Travel — kilometres to miles', body: 'European road trips, UK driving, distance estimates for marathons or hikes. 100 km ≈ 62 miles; 5 km ≈ 3.1 miles (a 5K run).' },
    { title: 'Science homework — m/s to mph', body: 'Physics problems often state speeds in m/s; intuition is in mph. 30 m/s ≈ 67 mph (roughly highway speed).' },
    { title: 'Cooking temperature — Celsius to Fahrenheit', body: '180°C = 356°F (medium oven). 200°C = 392°F (hot oven for pizza). Common gotcha: oven temperatures don\'t scale linearly to "feels like" — bake at the right unit, not the rough mental conversion.' },
    { title: 'Engineering — feet/yards to meters', body: 'Construction specs in the US are still imperial; international engineering is metric. Quick converter saves you from miscalculating beam lengths.' },
    { title: 'Fitness — pounds to kilograms', body: 'Most US gyms use plates marked in pounds; most workout apps default to kilograms. 45 lb ≈ 20.4 kg (the standard Olympic plate).' },
  ],
  faqs: [
    { question: 'What units does the converter support?', answer: '8 categories: length (mm to mi), weight (g to ton), temperature (°C, °F, K), volume (mL to gal), area (m² to acre), time (sec to year), speed (m/s, km/h, mph, knots), energy (J to kcal).' },
    { question: 'Does it support imperial and metric?', answer: 'Yes — both side by side in every category. No need to switch a unit-system setting.' },
    { question: 'How accurate is it?', answer: 'To 6 significant figures, which is overkill for almost all practical purposes. Conversions use exact NIST-published constants.' },
    { question: 'Why is there both gallon and US gallon?', answer: 'US gallon = 3.785 L. UK (imperial) gallon = 4.546 L. Different units despite the same name. The converter shows both.' },
    { question: 'How do I convert between Fahrenheit and Celsius?', answer: '°C = (°F − 32) × 5/9. °F = (°C × 9/5) + 32. The converter handles this automatically — just type in either field.' },
    { question: 'Does it handle scientific notation?', answer: 'Yes — type "1.5e3" or "1500" — both work. Output uses scientific notation for very large or very small numbers (≥10⁶ or ≤10⁻⁴).' },
    { question: 'Can I add custom units?', answer: 'No — only the preset units in each category. For obscure conversions (parsecs, cubits, slugs), search a specialist converter.' },
    { question: 'Is my data uploaded anywhere?', answer: 'No — all conversion math runs in your browser.' },
    { question: 'How do I convert km/h to mph?', answer: 'Speed category, type into km/h field, read mph field. 100 km/h = 62.14 mph.' },
    { question: 'Why doesn\'t pressure or torque show up?', answer: 'Niche units omitted to keep the UI scannable. We\'ll add pressure and torque if there\'s demand — let us know via the contact form.' },
  ],
  related: [TOOL_LINKS.calc, TOOL_LINKS.gpa, TOOL_LINKS.pomodoro, TOOL_LINKS.outline, TOOL_LINKS.summarizer, TOOL_LINKS.flashcards],
  accent: '#1CB0F6',
};

/* ─── AI SUMMARIZER ─────────────────────────────────────────────── */
export const summarizerSeo: ToolSeoConfig = {
  heading: 'AI Summarizer — Condense Papers, Articles, and Lecture Notes',
  intro:
    'Paste a long article, research paper, or set of lecture notes and the AI summarizer condenses it into bullet points, a paragraph, a TL;DR, or a detailed structured summary. Free first summary; Pro unlocks unlimited use and longer input lengths.',
  steps: [
    { title: 'Paste your text', body: 'Drop in up to 5,000 words on the free plan, or 15,000 on Pro. Articles, research papers, lecture notes, book chapters — anything in plain text.' },
    { title: 'Pick a summary style', body: 'Bullet (key points only), Paragraph (flowing prose), TL;DR (1-2 sentence essence), or Detailed (multi-paragraph structured summary with section headings).' },
    { title: 'Pick a length', body: 'Short (2-3 sentences/3 bullets), Medium (5-8 bullets/1 paragraph), Long (10+ bullets/multi-paragraph). Longer input = longer summary by default.' },
    { title: 'Read and refine', body: 'Read the summary, copy it, paste into your study notes. If it missed a key point, regenerate — AI summaries are non-deterministic; the same input produces slightly different outputs each time.' },
  ],
  useCases: [
    { title: 'Lit review — summarizing 30 papers fast', body: 'Drop each paper\'s abstract+intro+conclusion in. Get bullet-point summaries you can scan in 10 minutes instead of reading each in full.' },
    { title: 'Lecture catch-up after missing class', body: 'Get the lecture transcript or notes from a classmate, summarize, scan in 5 minutes. You won\'t learn it as deeply as attending — but you\'ll have enough to follow next class.' },
    { title: 'Book chapter summaries for class prep', body: 'Reading 80 pages by Tuesday? Skim, then run a few sections through the summarizer to verify what you missed. Don\'t use it as a replacement for the reading itself.' },
    { title: 'Long blog post or article TL;DRs', body: 'Decision: is this 10,000-word article worth reading in full? Run the TL;DR mode first; if the summary interests you, go back and read.' },
    { title: 'Generating talking points from a research paper', body: 'For a 5-minute presentation, you need 3-4 key points. Detailed summary mode breaks the paper into sections; pick one bullet from each.' },
  ],
  faqs: [
    { question: 'Is the summarizer free?', answer: 'You get one free summary per session on the free plan. Unlimited summaries + 15,000-word inputs are on Pro.' },
    { question: 'How accurate is the summary?', answer: 'AI summaries are usually accurate on the main thesis and key points. They occasionally miss subtleties or miscategorize relative importance. Always cross-reference with the original for anything you\'re going to cite.' },
    { question: 'Will it work for technical or scientific papers?', answer: 'Yes — the model handles most undergrad and graduate-level texts well. Heavy math notation may not summarize cleanly; the model focuses on the prose around equations.' },
    { question: 'Can I summarize a PDF or Word document?', answer: 'Paste the text in. To extract from a PDF, open the file, select all (Cmd/Ctrl+A), copy, paste here. .docx works the same.' },
    { question: 'How long can my input be?', answer: '5,000 words on free, 15,000 words on Pro. Longer than 15,000? Split into sections.' },
    { question: 'What\'s the difference between TL;DR and Bullet summary?', answer: 'TL;DR is 1-2 sentences capturing the essence. Bullet is 5-8 key points. TL;DR for "should I read this?"; bullet for "what does this say?".' },
    { question: 'Is my text private?', answer: 'Text is sent to our servers for processing but isn\'t stored or used for training. Treated like an API call — request, response, gone.' },
    { question: 'Can I summarize non-English text?', answer: 'Yes for major languages (Spanish, French, German, Mandarin, Japanese). Quality drops for less-common languages.' },
    { question: 'Will it cite the source?', answer: 'No — the summarizer doesn\'t output citations. For source-aware research, use our paid Citation Finder, which surfaces sources with formatted citations.' },
    { question: 'Can I use the summary in my essay?', answer: 'Use it for understanding, not as direct text. Pasting an AI-generated summary into your essay risks plagiarism flags and academic-integrity issues. Read, understand, then write your own version.' },
  ],
  related: [TOOL_LINKS.analyze, TOOL_LINKS.thesisGen, TOOL_LINKS.outline, TOOL_LINKS.citationGenerator, TOOL_LINKS.quizGen, TOOL_LINKS.flashcards],
};

/* ─── AI QUIZ GENERATOR ─────────────────────────────────────────── */
export const quizGenSeo: ToolSeoConfig = {
  heading: 'AI Quiz Generator — Turn Notes Into MCQ, T/F, and Fill-in Quizzes',
  intro:
    'Paste your lecture notes, study guide, or any text and the quiz generator builds multiple-choice, true/false, and fill-in-the-blank questions in seconds. Pick how many questions you want; pick the difficulty. Free to start — no sign-up needed for the first quiz.',
  steps: [
    { title: 'Paste your study material', body: 'Lecture notes, textbook chapter, study guide, anything in text form. Longer is fine — the generator pulls questions from across the full input.' },
    { title: 'Pick question types and count', body: 'Multiple choice (with 3-4 distractors), true/false, fill-in-the-blank. Or mix all three. 10-20 questions is the sweet spot for a study session; 30+ for full exam prep.' },
    { title: 'Set difficulty', body: 'Easy = surface recall ("What year was X?"); Medium = comprehension ("Why did X happen?"); Hard = application ("Given X, predict Y"). Mix levels for thorough prep.' },
    { title: 'Take the quiz', body: 'Answer each question; the generator scores you and shows you which ones you got wrong with the correct answer + explanation. Re-quiz on missed questions to drill.' },
  ],
  useCases: [
    { title: 'Self-quizzing for a final exam', body: 'Paste 4 weeks of lecture notes, generate 30 questions, take the quiz. Identifies exactly what you don\'t know — focus revision there, not on stuff you already know.' },
    { title: 'Active recall study sessions', body: 'Active recall (testing yourself) outperforms passive review (rereading notes) by 50%+ on retention. The quiz generator turns any text into an active-recall session in seconds.' },
    { title: 'Studying with a partner — quiz-each-other format', body: 'Generate one quiz, both partners take it independently, compare answers, debate the ones you disagree on. Spaced-repetition + social accountability.' },
    { title: 'Reviewing a textbook chapter', body: 'After reading a chapter, generate a 15-question quiz on it. Tests whether you actually understood it — scoring under 70% means re-read.' },
    { title: 'Teacher / tutor — assessing student understanding', body: 'Paste the lesson plan, generate diagnostic quiz, give to students at end of class. Faster than writing questions by hand.' },
    { title: 'Quizlet alternative — without flashcard fatigue', body: 'Quizlet flashcards don\'t test you actively unless you use Test mode. AI Quiz generator is closer to actual exam questions and less rote.' },
  ],
  faqs: [
    { question: 'Is the quiz generator free?', answer: 'First quiz is free without sign-up. After that, sign up for a free account to keep generating. Pro unlocks unlimited quizzes + saves them to your library.' },
    { question: 'What question types are supported?', answer: 'Multiple choice (with 3-4 distractors), true/false, and fill-in-the-blank. Short-answer questions are coming.' },
    { question: 'How accurate are the quiz questions?', answer: 'Question accuracy is high — the AI pulls factual content from your input. Answer accuracy can occasionally be wrong if the input is ambiguous. Always cross-check important answers against your original source.' },
    { question: 'Can I edit a generated quiz?', answer: 'On Pro, yes — edit questions, swap distractors, change correct answers. Free plan generates and lets you take, but no editing.' },
    { question: 'How many questions can I generate at once?', answer: 'Up to 30 questions per quiz on free, 50 on Pro.' },
    { question: 'Does it work for math or science?', answer: 'Yes — the AI handles formulas, definitions, and conceptual questions in math, biology, chemistry, physics. Heavy notation (integrals, matrix algebra) may not render perfectly in MCQ format; better to paste the conceptual material rather than the math itself.' },
    { question: 'Can I save my quiz to retake later?', answer: 'On Pro, yes — quizzes save to your library. Free plan: one quiz per session.' },
    { question: 'Is this a Quizlet alternative?', answer: 'Closer to a Quizlet test-mode replacement than a flashcard replacement. For flashcards specifically, use our flashcard maker (linked below).' },
    { question: 'Does it cite sources?', answer: 'No — the quiz pulls questions from your pasted text only. It doesn\'t add external sources. Cite from your original source if you use a question in a study group.' },
    { question: 'Can I export to Anki, Quizlet, or another app?', answer: 'On Pro, export to CSV which Anki and Quizlet both accept.' },
  ],
  related: [TOOL_LINKS.flashcards, TOOL_LINKS.summarizer, TOOL_LINKS.outline, TOOL_LINKS.thesisGen, TOOL_LINKS.analyze, TOOL_LINKS.citationGenerator],
  accent: '#FF9600',
};

/* ─── FLASHCARDS ────────────────────────────────────────────────── */
export const flashcardsSeo: ToolSeoConfig = {
  heading: 'Free Flashcard Maker — Build Custom Decks or Generate from Notes',
  intro:
    'Build flashcard decks card-by-card or auto-generate them from your lecture notes. Study with shuffle, flip, and progress tracking. Free plan saves up to 5 decks; Pro saves unlimited decks with cross-device sync. The most important study tool you\'ll use this term.',
  steps: [
    { title: 'Choose: build or generate', body: 'Build = type your own front/back cards manually. Generate = paste your notes and the AI turns them into Q/A flashcards. Beginners should generate; experienced users often build for control.' },
    { title: 'Add cards (or paste notes)', body: 'For build mode, click "Add card" and type front (question) and back (answer). For generate mode, paste lecture notes and the AI extracts ~20 cards per page of text.' },
    { title: 'Save your deck', body: 'Name the deck (e.g. "Bio 101 Chapter 4") and save. Free plan stores up to 5 decks; Pro is unlimited.' },
    { title: 'Study with shuffle and flip', body: 'Open the deck, click "Study". Cards flip on click; shuffle resets order; "I knew it" / "I didn\'t" buttons track your progress so the next session prioritizes weak cards.' },
  ],
  useCases: [
    { title: 'Memorizing vocabulary for a foreign language', body: 'Front = English word; back = translation + example sentence. 20 minutes of flashcards/day beats 1 hour of reading the textbook for vocab retention.' },
    { title: 'Med school — drugs, anatomy, pathologies', body: 'Med school IS flashcards. Anki is the standard tool, but our generator turns your lecture notes into flashcards 10x faster than typing them yourself.' },
    { title: 'Memorizing dates, formulas, definitions', body: 'Anything with a clear front (question) and back (answer) is a flashcard candidate. Dates, formulas, definitions, theorem statements, vocabulary, capitals.' },
    { title: 'Studying with a partner — share decks', body: 'On Pro, share decks via link. Two people studying the same deck spaced 24 hours apart cement retention better than either solo.' },
    { title: 'Spaced repetition for long-term retention', body: 'Spaced repetition (reviewing on increasing intervals: 1 day, 3 days, 7 days, 14 days) is proven to lock material into long-term memory. Our scheduler handles the intervals.' },
    { title: 'Quizlet alternative without ads', body: 'Quizlet free has ads everywhere. WriteScholar free has none — the upgrade is unlimited deck count, not ad removal.' },
  ],
  faqs: [
    { question: 'Is the flashcard maker free?', answer: 'Yes, with limits. Free plan: 5 saved decks, manual creation only. Pro: unlimited decks, AI auto-generation from notes, cross-device sync, deck sharing.' },
    { question: 'How does AI deck generation work?', answer: 'Paste your lecture notes or textbook chapter. The AI identifies key concepts, definitions, dates, formulas, and turns them into Q/A flashcards. Output: ~20 cards per 1,000 words of input.' },
    { question: 'Are AI-generated flashcards accurate?', answer: 'Mostly, yes — accuracy is usually 90%+. Always review before studying — the AI occasionally creates a card with a wrong answer or a duplicate concept. Edit or delete those.' },
    { question: 'Does spaced repetition work here?', answer: 'Pro plan includes spaced repetition scheduling — cards you struggle with come up more often; cards you nail come up less. Free plan has shuffle but no scheduling.' },
    { question: 'Can I add images to flashcards?', answer: 'On Pro, yes — drag in images for visual cues (anatomy diagrams, charts, structural formulas). Free plan is text-only.' },
    { question: 'Can I import from Quizlet or Anki?', answer: 'Yes on Pro — paste a CSV of front,back pairs. Quizlet and Anki both export to this format.' },
    { question: 'How is this different from Anki?', answer: 'Anki is desktop-first and intimidating to set up. Our flashcard maker is browser-first, instant, and the AI generation is built in. Anki has more advanced spaced-repetition algorithms; we have a simpler UX.' },
    { question: 'Will my decks sync across devices?', answer: 'On Pro, yes — log in on phone, tablet, laptop and your decks follow you. Free plan stores locally in your browser.' },
    { question: 'Can I share my decks?', answer: 'On Pro, share via link. Recipient can view and study; on Pro+, they can clone your deck into their library.' },
    { question: 'How many cards can a deck have?', answer: 'No hard limit. Most students keep decks under 200 cards for manageability — split larger topics into multiple decks.' },
  ],
  related: [TOOL_LINKS.quizGen, TOOL_LINKS.summarizer, TOOL_LINKS.outline, TOOL_LINKS.thesisGen, TOOL_LINKS.analyze, TOOL_LINKS.pomodoro],
  accent: '#A560E8',
};
