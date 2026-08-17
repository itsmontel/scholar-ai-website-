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
 *     pack, citations), but don't shill in every paragraph.
 */

import type {
  ToolSeoSteps,
  ToolSeoUseCase,
  ToolSeoFaq,
  ToolSeoRelatedTool,
  ToolSeoMistake,
  ToolSeoExample,
  ToolSeoGlossaryTerm,
  ToolSeoComparison,
  ToolSeoTip,
} from '../components/common/ToolPageSeoContent';

export interface ToolSeoConfig {
  heading: string;
  intro: string;
  steps: ToolSeoSteps[];
  useCases: ToolSeoUseCase[];
  faqs: ToolSeoFaq[];
  related: ToolSeoRelatedTool[];
  closing?: string;
  /** Optional accent, defaults to #A560E8 */
  accent?: string;
  /** Phase 2.5 deep-content additions (optional, used on top tools) */
  mistakes?: ToolSeoMistake[];
  examples?: ToolSeoExample[];
  glossary?: ToolSeoGlossaryTerm[];
  comparison?: ToolSeoComparison;
  tips?: ToolSeoTip[];
}

/* ─── Cross-reference helpers ───────────────────────────────────── */
const TOOL_LINKS = {
  wordCounter: { label: 'Word Counter', page: 'word-counter', teaser: 'Count words, characters, sentences, and reading time.' },
  citationGenerator: { label: 'Citation Generator', page: 'citation-generator-tool', teaser: 'APA, MLA, Chicago, Harvard, IEEE, Vancouver, formatted instantly.' },
  grammarChecker: { label: 'Grammar Checker', page: 'grammar-checker', teaser: 'Catch spelling, punctuation, and grammar errors in seconds.' },
  readability: { label: 'Readability Score', page: 'readability-score', teaser: 'Flesch-Kincaid, SMOG, Gunning Fog, see your text\'s grade level.' },
  thesisGen: { label: 'Thesis Generator', page: 'thesis-generator', teaser: 'Build a strong thesis statement for any essay type.' },
  outline: { label: 'Essay Outline Generator', page: 'essay-outline', teaser: 'Get a structured outline for argumentative, narrative, or research essays.' },
  caseConverter: { label: 'Text Case Converter', page: 'text-case-converter', teaser: 'Convert between UPPER, lower, Title Case, Sentence case.' },
  paraphrase: { label: 'Paraphrasing Tips', page: 'paraphrasing-tips', teaser: 'Spot overused words, weak verbs, and passive voice.' },
  gpa: { label: 'GPA Calculator', page: 'gpa-calculator', teaser: 'Compute semester or cumulative GPA from courses and grades.' },
  pomodoro: { label: 'Pomodoro Timer', page: 'pomodoro-timer', teaser: 'Focus + break intervals to power through study sessions.' },
  calc: { label: 'Scientific Calculator', page: 'calculator', teaser: 'Trigonometry, logarithms, exponents, no app install.' },
  conv: { label: 'Unit Converter', page: 'converter', teaser: 'Length, weight, temperature, volume, time, energy, speed.' },
  summarizer: { label: 'AI Summarizer', page: 'summarizer', teaser: 'Condense papers and articles into bullet, paragraph, or TL;DR summaries.' },
  quizGen: { label: 'AI Quiz Generator', page: 'quiz-generator', teaser: 'Turn notes into multiple-choice, T/F, fill-in-blank quizzes.' },
  flashcards: { label: 'Flashcard Maker', page: 'create-flashcards', teaser: 'Build custom decks or auto-generate them from your notes.' },
  analyze: { label: 'AI Essay Checker', page: 'analyze', teaser: 'Get professor-style feedback with grade, rubric, and revision.' },
};

/* ─── WORD COUNTER ──────────────────────────────────────────────── */
export const wordCounterSeo: ToolSeoConfig = {
  heading: 'Free Word Counter, Count Words, Characters, and Reading Time',
  intro:
    'Pasting your essay below will instantly show you the word count, character count (with and without spaces), sentence count, paragraph count, page count (double- and single-spaced), and an estimated reading and speaking time. No sign-up. No limits. Most professors care about word count to the unit, get it right before you submit.',
  steps: [
    { title: 'Paste your text', body: 'Copy your essay, blog post, social caption, or document and paste it into the box. The counter updates as you type, there is no "count" button to press.' },
    { title: 'Read the live stats', body: 'Words, characters, sentences, paragraphs, reading time, and speaking time all appear on the right. Reading time uses 200 words per minute (typical adult reading speed); speaking time uses 130 wpm (typical speech).' },
    { title: 'Edit to hit your target', body: 'Most professors give a hard word range (e.g. "1,500–2,000 words"). Trim or expand sections until you land inside the window, going over by more than 10% can cost you marks at some schools.' },
    { title: 'Copy or download', body: 'Once you\'re happy with the count, copy your text out or save it as a .txt file. Nothing leaves your browser, the count happens entirely on your device.' },
  ],
  useCases: [
    { title: 'College essays with strict word limits', body: 'Professors often set a 1,500-word minimum on argumentative essays. Submitting at 1,200 = automatic mark deduction. Pasting in here as you write keeps you honest.' },
    { title: 'University application personal statements', body: 'Common App caps the personal statement at 650 words. A character cap also exists on Coalition and many UK UCAS applications. Hit the cap exactly.' },
    { title: 'Twitter, LinkedIn, and Instagram captions', body: 'Twitter is 280 characters. Instagram captions cap at 2,200. LinkedIn posts cut off at ~1,300 before the "see more" fold. Drop your draft in to see exactly where you sit.' },
    { title: 'Estimating reading time for a blog post', body: 'A 1,200-word blog post is about 6 minutes to read. Use the tool to size content before publishing, most readers bounce on anything over 7 minutes unless it\'s a long-form guide.' },
    { title: 'Speech and presentation prep', body: 'A 5-minute speech is about 650 words at a normal pace. The speaking-time estimate (130 wpm) tells you whether your draft fits the time slot before you rehearse.' },
    { title: 'SEO content optimization', body: 'Google rewards in-depth content. Shooting for 1,500–2,500 words on tutorial pages and 800–1,200 on listicles is a common rule of thumb. The counter keeps you on target.' },
  ],
  faqs: [
    { question: 'How many pages is a 500-word essay?', answer: 'About 2 pages double-spaced, or 1 page single-spaced, in 12pt Times New Roman with 1-inch margins. That is the format nearly every assignment brief assumes, so it is the safest estimate unless your brief says otherwise.' },
    { question: 'How many pages is 1,000 words?', answer: 'Roughly 4 pages double-spaced or 2 pages single-spaced at 12pt with 1-inch margins. 1,500 words is about 6 double-spaced pages, and 2,000 words is about 8.' },
    { question: 'How many words is a 5-page paper?', answer: 'About 1,250 words if it is double-spaced, or about 2,500 words single-spaced. Multiply the page count by 250 for a double-spaced target — that is the standard 12pt Times New Roman page.' },
    { question: 'Does the word count include the title page, references, and footnotes?', answer: 'Usually not. Most academic word limits cover the body of the essay only and exclude the title page, abstract, reference list, footnotes, tables, and appendices. Paste in just the body text to get the number your marker cares about.' },
    { question: 'Is this word counter free to use?', answer: 'Yes, completely free, no sign-up, no usage limits. The whole tool runs in your browser, so you can count as much text as you want without hitting any quota.' },
    { question: 'How accurate is the word count?', answer: 'The counter uses the same definition Microsoft Word and Google Docs use: any sequence of non-whitespace characters separated by spaces is one word. Hyphenated words count as one. Numbers count as words. URLs count as one.' },
    { question: 'Does it count characters with or without spaces?', answer: 'Both. The "Characters" stat includes spaces (used by Twitter, SMS, and most word limits), and "Characters (no spaces)" excludes them (used by some academic word limits).' },
    { question: 'How is reading time calculated?', answer: 'We use 200 words per minute, which is the average adult reading speed for general content. Academic or technical text usually reads slower (~150 wpm), adjust mentally if your audience is reading dense material.' },
    { question: 'How is speaking time calculated?', answer: 'We use 130 words per minute, which is the standard pace for clear, presentation-style speech (TED talks, lectures, news anchors). Casual conversation is faster (~150 wpm); formal speeches often slower.' },
    { question: 'Can it count words in PDFs or Word documents?', answer: 'Not directly, paste the text in. To extract from a PDF, open the file, select all (Cmd/Ctrl+A), copy, and paste here. For .docx, the same approach works.' },
    { question: 'Is my text saved or sent anywhere?', answer: 'No. Counting happens 100% in your browser via JavaScript. Your text never leaves your device, there is no server upload, no analytics on the content, and nothing stored.' },
    { question: 'Can I count words in a specific selection?', answer: 'In this tool, no, only the full pasted block is counted. For partial counts, copy just the chunk you want and paste it in.' },
    { question: 'What counts as a sentence?', answer: 'Any text ending in a period (.), question mark (?), or exclamation mark (!). Abbreviations like "Dr." or "etc." can occasionally inflate the count, manually subtract if you need exact precision.' },
    { question: 'Does the tool work offline?', answer: 'After the first page load, yes, all counting logic is in JavaScript that runs locally. Refreshing offline still works in most browsers.' },
  ],
  related: [TOOL_LINKS.readability, TOOL_LINKS.grammarChecker, TOOL_LINKS.outline, TOOL_LINKS.thesisGen, TOOL_LINKS.analyze, TOOL_LINKS.paraphrase],
  closing:
    'Word count is the most basic, and most overlooked, formatting requirement in academic writing. Going under is treated as an incomplete submission; going over is treated as ignoring instructions. Use this counter as a final check before every submission, and pair it with our AI essay checker to make sure the words you do have are pulling their weight.',
  accent: '#1CB0F6',
  mistakes: [
    { title: 'Counting every "word" the same way', body: 'Different word counters disagree on hyphenated words, contractions, numbers, and URLs. Microsoft Word counts "well-being" as one word; some online tools count it as two. Always use the same counter throughout a project so your numbers stay consistent.' },
    { title: 'Forgetting that titles, references, and footnotes don\'t count', body: 'Most academic word limits exclude the title page, abstract, references, footnotes, tables, and appendices. Your professor cares about the body of the essay, count just that, not the entire document.' },
    { title: 'Ignoring the character limit on platforms', body: 'Common App is 650 words AND has a character cap depending on the year. UCAS personal statement is 4,000 characters AND 47 lines, whichever you hit first. Always check both.' },
    { title: 'Padding to hit a minimum', body: 'Adding "in order to" instead of "to" or "due to the fact that" instead of "because" pads but reads as filler. Professors notice. Better to write tighter and hit the minimum with substance than pad to 1,500 words with junk.' },
    { title: 'Submitting at exactly the limit', body: 'A 1,500-word limit is a max, not a target. Submitting at 1,499 reads as just-getting-by. Aim for 90-95% of the max for a polished feel; cut deeper if your argument doesn\'t need every word.' },
    { title: 'Trusting word count in non-English text', body: 'Many counters are calibrated for English word boundaries (whitespace-separated). Mandarin, Japanese, and Thai don\'t use spaces, most counters under-count by 80%+ for those languages.' },
  ],
  examples: [
    { label: 'Trimming an over-limit essay', before: 'Due to the fact that the experiment was conducted under controlled conditions, the results are reliable in the sense that they can be replicated by other researchers.', after: 'Because the experiment was controlled, other researchers can replicate the results.', explanation: 'Cut from 30 words to 13, same meaning. "Due to the fact that" → "Because"; "in the sense that" deleted. Apply this pattern across an essay and you can typically cut 15-20% without losing content.' },
    { label: 'Reading time vs speaking time', before: '500 words at typical adult reading speed (200 wpm)', after: '500 words at presentation speaking pace (130 wpm)', explanation: 'A 500-word piece is 2.5 minutes to read silently but ~3:50 to read aloud. If you\'re writing a speech, target word count by speaking time, not reading time.' },
    { label: 'Hitting an exact character limit', before: 'I am writing to express my interest in the position of Junior Software Engineer because I have a strong passion for technology.', after: 'I\'m applying for the Junior Software Engineer role, tech is what I love.', explanation: 'Cut from 119 to 76 characters. Twitter, SMS, and bio fields care about character count, not word count. The counter shows both so you can target whichever matters.' },
  ],
  tips: [
    { title: 'Aim for 95% of the max, not the max', body: 'Submitting at 1,500/1,500 reads as filler. 1,425/1,500 reads as deliberately-edited. Professors who grade hundreds of papers can tell the difference.' },
    { title: 'Cut 5-10% on the second pass', body: 'First-draft writing is always too wordy. Set a goal: cut 10% of your word count on the editing pass without losing meaning. Forces tighter prose.' },
    { title: 'Use the character count for titles', body: 'Web titles cap at ~60 characters before Google truncates. Email subject lines cap at ~50. Pasting your title into the counter shows you exactly how much room you have.' },
    { title: 'Mind the difference between words and tokens', body: 'AI tools (ChatGPT, etc.) charge by "tokens", not words. 1 token ≈ 0.75 English words on average. A 1,000-word essay ≈ 1,300 tokens.' },
    { title: 'Don\'t pad references to hit a minimum', body: 'A reference list with 25 sources isn\'t automatically better than 12 well-chosen ones. Quality of citations > quantity. Word count for the bibliography usually isn\'t graded.' },
    { title: 'Track your daily writing word count', body: 'Building a writing habit? Aim for 250-500 words/day. Use the counter to verify you hit your target, not "feels like enough", momentum dies on subjective measures.' },
  ],
  glossary: [
    { term: 'Word count', definition: 'Total number of words in a text. Used by most academic word limits, platforms with text limits, and reading-time estimators.' },
    { term: 'Character count', definition: 'Total characters including or excluding spaces. Used by Twitter (280), SMS (160), most database fields, and some submission platforms.' },
    { term: 'Reading time', definition: 'Estimated minutes to read silently. Standard formula: words ÷ 200 (adult reading speed). Academic text reads slower (~150 wpm).' },
    { term: 'Speaking time', definition: 'Estimated minutes to deliver as a speech. Standard formula: words ÷ 130. Used for speech writing, presentation prep, and audiobook estimates.' },
    { term: 'Sentence count', definition: 'Number of sentences ending in . ? or !. Average words/sentence is a key readability metric, over 25 wpm reads as dense.' },
    { term: 'Paragraph count', definition: 'Blocks of text separated by blank lines. Most essays have one main idea per paragraph.' },
    { term: 'Lexical density', definition: 'Ratio of content words (nouns, verbs, adjectives) to total words. Higher density = more information per word; usually a sign of strong academic writing.' },
    { term: 'Type-token ratio', definition: 'Ratio of unique words to total words. A measure of vocabulary diversity. Diverse writing scores 0.5+; repetitive writing under 0.3.' },
  ],
};

/* ─── CITATION GENERATOR ────────────────────────────────────────── */
export const citationGeneratorSeo: ToolSeoConfig = {
  heading: 'Free Citation Generator, APA, MLA, Chicago, Harvard, IEEE',
  intro:
    'Generate properly formatted citations for any source, book, journal article, website, podcast, video, thesis, in APA 7th, MLA 9th, Chicago, Harvard, IEEE, or Vancouver style. Fill in the fields you have, copy the formatted citation. No sign-up, no limit on how many you can generate.',
  steps: [
    { title: 'Pick your citation style', body: 'APA is the default for psychology, education, and most social sciences. MLA is the standard for English and humanities. Chicago is common in history. Harvard and IEEE are used in UK universities and engineering respectively.' },
    { title: 'Pick your source type', body: 'Book, journal article, website, podcast, video, conference paper, thesis, magazine, newspaper, pick the closest match. Each source type asks for slightly different fields (a book needs a publisher; a website needs an access date).' },
    { title: 'Fill in the fields you have', body: 'You don\'t need every field, leave optional ones blank. Author and title are the only universal requirements. For DOIs, paste the full URL or just the number; the tool handles both.' },
    { title: 'Copy the formatted citation', body: 'The full citation appears formatted in the chosen style with proper italics, capitalization, and punctuation. Copy it directly into your bibliography or works cited page.' },
  ],
  useCases: [
    { title: 'Building an APA reference list for a psychology paper', body: 'APA 7th changed how DOIs and URLs are formatted (now without "Retrieved from"). The generator uses APA 7, the current standard at most US universities.' },
    { title: 'Writing an MLA Works Cited page for an English essay', body: 'MLA 9th edition requires container titles, version numbers, and access dates for online sources. Most students miss the access date, the generator forces you to include it.' },
    { title: 'Citing a podcast episode in an MLA paper', body: 'Podcast citations are notoriously inconsistent. The generator handles host, episode title, podcast name, publisher, episode number, and air date in the right format.' },
    { title: 'Citing a Cochrane systematic review in Vancouver', body: 'Medical and nursing students need Vancouver, numbered references, author initials, abbreviated journal names. The generator outputs the abbreviation rules correctly.' },
    { title: 'Bibliography for a UK university Harvard-style essay', body: 'Harvard isn\'t a single style, Cardiff, Bath, Manchester all have variants. The generator outputs the most common variant (Anglia Ruskin); cross-check your school\'s style guide for edge cases.' },
    { title: 'IEEE citations for a computer science thesis', body: 'IEEE uses numbered in-text references and a reference list ordered by citation appearance. The generator outputs both the formatted entry and the in-text reference number style.' },
  ],
  faqs: [
    { question: 'Does this generator support APA 7 or APA 6?', answer: 'APA 7th edition, the current standard since 2019. The biggest changes from APA 6: no "Retrieved from" before URLs, single space after periods, and DOIs as full URLs (https://doi.org/...).' },
    { question: 'Is this citation generator free?', answer: 'Yes, fully free, no sign-up, no daily limit. Use it as much as you want.' },
    { question: 'Will I get the same output as Zotero or Mendeley?', answer: 'Almost identical, we follow the official APA, MLA, and Chicago manuals. Tiny differences happen on edge cases (e.g. how to handle a missing author for a corporate website). Cross-check with your style guide if you\'re submitting to a journal.' },
    { question: 'Can I import a DOI and auto-fill the form?', answer: 'Not yet on this free tool, it requires a paid academic API. For DOI auto-fill, our paid Citation Finder (in the WriteScholar app) does it automatically.' },
    { question: 'How do I cite a website with no author?', answer: 'Move the title to the author position and use a shortened title in your in-text citation. Most styles allow corporate authors (e.g. "World Health Organization" for WHO publications).' },
    { question: 'How do I cite a YouTube video?', answer: 'Use "Video" or "Online video" as the source type. Cite the channel name as the author, video title in italics, "YouTube" as the platform, upload date, and the full video URL.' },
    { question: 'What\'s the difference between MLA and APA?', answer: 'APA prioritises author-date for in-text citations ("Smith, 2023") and is used in social sciences. MLA prioritises author-page ("Smith 42") and is used in humanities. They format reference entries very differently, never mix the two in one paper.' },
    { question: 'Do I need to italicize book titles?', answer: 'Yes, the generator handles italics automatically when you copy the formatted citation. Make sure you\'re pasting with formatting (Cmd/Ctrl+V), not as plain text (Cmd+Shift+V), or italics may be lost.' },
    { question: 'Can I generate hundreds of citations at once?', answer: 'Not in batch on this free tool. For batched citations from a research paper or topic, our paid Citation Finder pulls and formats sources from a single search query.' },
    { question: 'Will my citation be 100% correct?', answer: 'For standard sources (books, journal articles, websites), yes. Edge cases, translations, multi-volume works, archival manuscripts, government documents, sometimes need manual tweaks. Use the generator as a 95% solution and final-check unusual sources by hand.' },
  ],
  related: [TOOL_LINKS.outline, TOOL_LINKS.thesisGen, TOOL_LINKS.grammarChecker, TOOL_LINKS.analyze, TOOL_LINKS.paraphrase, TOOL_LINKS.summarizer],
  closing:
    'Citations are usually graded for two things: are they in the right style, and are they formatted correctly. This tool guarantees the second. The first is on you, match the style your professor specified (APA, MLA, etc.) and use the same one consistently throughout the paper. Mixing styles is a much bigger red flag than tiny formatting errors within a single style.',
  comparison: {
    heading: 'WriteScholar vs the citation generators you might already know',
    intro: 'There are dozens of citation generators online. Here\'s how WriteScholar stacks up against the most common ones students reach for.',
    columns: ['Feature', 'WriteScholar', 'Cite This For Me (free)', 'EasyBib (free)', 'Zotero'],
    rows: [
      { feature: 'Sign-up required', values: ['No', 'No (limited)', 'Yes, after 5 cites', 'Yes (download)'] },
      { feature: 'Sources per session', values: ['Unlimited', '5 free', '5 free', 'Unlimited'] },
      { feature: 'APA, MLA, Chicago, Harvard', values: ['All', 'All (paid for some)', 'All (paid for some)', 'All'] },
      { feature: 'IEEE / Vancouver', values: ['Yes', 'Paid only', 'Paid only', 'Yes'] },
      { feature: 'DOI auto-fill', values: ['Pro', 'Paid', 'Paid', 'Yes'] },
      { feature: 'Ads', values: ['None', 'Yes', 'Heavy', 'None'] },
      { feature: 'Browser extension', values: ['Coming', 'No', 'No', 'Yes' ] },
      { feature: 'Cost', values: ['Free + Pro $19.99/mo', 'Premium ~$10/mo', 'Premium ~$10/mo', 'Free' ] },
    ],
  },
  mistakes: [
    { title: 'Mixing citation styles in one paper', body: 'Half APA, half MLA. The single biggest red flag a professor sees. Pick one style at the start of the paper and use only that style, including for in-text citations.' },
    { title: 'Forgetting the access date for online sources', body: 'MLA 9, Chicago, and Harvard all require an access date for websites. APA 7 only requires it for content that may change (e.g. Wikipedia). When in doubt, include it.' },
    { title: 'Using a publisher logo or URL as the author', body: 'When a website has no listed author, the corporate or organization name becomes the author ("World Health Organization", not "WHO logo" or "https://who.int"). Move the title to author position only if there\'s no organization either.' },
    { title: 'Italicizing the wrong part', body: 'In APA and MLA, journal article titles are NOT italicized, only the journal name is. Book titles ARE italicized. Confusing the two is the most common formatting error.' },
    { title: 'Using "Anonymous" as the author', body: 'Most styles say to use "Anonymous" only if the source explicitly identifies the author that way. Otherwise, treat the source as having no author and start with the title.' },
    { title: 'Misplacing the period in in-text citations', body: 'APA: (Smith, 2023). Period AFTER the closing parenthesis. The period goes inside the parenthesis only when the citation introduces a block quote.' },
    { title: 'Forgetting "et al." rules differ by style', body: 'APA 7: use "et al." for 3+ authors from the first citation. MLA 9: use "et al." for 3+ authors. Chicago: spell out up to 10 authors in the bibliography. Always check the latest edition rules.' },
  ],
  examples: [
    { label: 'APA 7, book citation', before: 'Smith, John. The Art of Writing. New York: Penguin Books, 2020.', after: 'Smith, J. (2020). The art of writing. Penguin Books.', explanation: 'APA 7: initial only for first name; year in parentheses; only first word of title (and proper nouns) capitalized; no city for US publishers; title italicized; no publisher city.' },
    { label: 'MLA 9, journal article', before: 'Jones, M. (2021). Climate adaptation in coastal cities. Environmental Studies, 12(4), 45-60.', after: 'Jones, Maria. "Climate Adaptation in Coastal Cities." Environmental Studies, vol. 12, no. 4, 2021, pp. 45-60.', explanation: 'MLA: full first name; title in quotation marks (not italicized); journal name italicized; "vol." and "no." spelled out; "pp." prefix on page range.' },
    { label: 'Citing a website with no author', before: 'No author. (2023). The benefits of meditation. https://example.com/meditation', after: 'World Health Organization. (2023). The benefits of meditation. https://example.com/meditation', explanation: 'When no individual author is named, use the organization or corporate author. If no organization either, move the title to the author position.' },
  ],
  tips: [
    { title: 'Build your bibliography as you research', body: 'Add each source to your generator the moment you cite it in the draft. Don\'t leave it for the night before, that\'s when 3am formatting errors happen.' },
    { title: 'Cross-check the official style manual for edge cases', body: 'For unusual sources (legal documents, archival manuscripts, social media posts), the generator may format conservatively. Cross-check with your style\'s official manual.' },
    { title: 'Use DOI links over URLs when available', body: 'DOI links are permanent; URLs can break. APA 7 prefers DOI as the URL format ("https://doi.org/10.xxx") over the publisher\'s site URL.' },
    { title: 'Double-check your reference list alphabetization', body: 'APA, MLA, and Chicago all require alphabetical order by first author\'s last name. The generator outputs each citation correctly but doesn\'t auto-sort the list, paste into Word and sort A-Z.' },
    { title: 'Match in-text citations to your reference list', body: 'Every reference in your list MUST appear in the body text and vice versa. Missing citations or unused references are deductions in most rubrics.' },
    { title: 'Consistency > perfection', body: 'A paper with 95% correct APA throughout reads better than one with 100% correct APA in some places and accidental MLA in others.' },
  ],
  glossary: [
    { term: 'In-text citation', definition: 'Brief citation in the body text pointing to the full source in your reference list. APA: (Smith, 2023). MLA: (Smith 42).' },
    { term: 'Reference list', definition: 'Full source list at the end of the paper. APA calls it "References", MLA calls it "Works Cited", Chicago calls it "Bibliography".' },
    { term: 'DOI (Digital Object Identifier)', definition: 'Permanent identifier for academic publications. Format: 10.xxxx/yyyy. Always preferred over a URL when available.' },
    { term: 'Hanging indent', definition: 'Reference list formatting where the first line is flush left and subsequent lines are indented 0.5". Required by APA, MLA, and Chicago.' },
    { term: '"et al."', definition: 'Latin for "and others". Used in citations with 3+ authors. APA 7: from first citation. MLA: from first citation. Always italicized in some styles.' },
    { term: 'Title case vs sentence case', definition: 'APA reference titles use sentence case (only first word + proper nouns capitalized). MLA uses title case (most words capitalized). Common mistake for new researchers.' },
    { term: 'Citation style guide', definition: 'Official manual defining the formatting rules. APA: Publication Manual (7th ed.). MLA: MLA Handbook (9th ed.). Chicago: Chicago Manual of Style.' },
    { term: 'Plagiarism', definition: 'Using someone else\'s ideas without attribution. Proper citations prevent it. Patchwriting (paraphrasing too closely) still counts as plagiarism.' },
  ],
};

/* ─── GRAMMAR CHECKER ───────────────────────────────────────────── */
export const grammarCheckerSeo: ToolSeoConfig = {
  heading: 'Free Grammar Checker, Spelling, Punctuation, and Style Errors',
  intro:
    'Paste any text and the grammar checker scans it instantly for spelling mistakes, punctuation issues, capitalization slips, and common style problems. Each issue is flagged with a category and a suggested fix. No sign-up, no word limit, no quota.',
  steps: [
    { title: 'Paste your text', body: 'Copy your essay, email, or social post and paste it into the editor. The checker runs as soon as you stop typing.' },
    { title: 'Read the issue list', body: 'Errors are coloured by severity: red for spelling and grammar errors, amber for warnings (e.g. passive voice, run-on sentences), and blue for style suggestions (e.g. "consider replacing with...").' },
    { title: 'Apply or skip each fix', body: 'Click a suggestion to apply it; click "ignore" to skip. The text updates live so you can see the cleaned version build up as you go.' },
    { title: 'Copy the corrected version', body: 'Once you\'ve cleaned every flagged issue, copy the corrected text. Paste it back into your essay, email, or whatever you started with.' },
  ],
  useCases: [
    { title: 'Final pass on a college essay before submission', body: 'Catches typos and missing commas a tired writer misses. Pair with the AI essay checker for content feedback, this tool is for surface-level errors.' },
    { title: 'Polishing a job-application email or cover letter', body: 'A single typo in a cover letter can sink a candidacy. Run it through here before hitting send, even a strong applicant looks careless with "thier" instead of "their".' },
    { title: 'Cleaning up a LinkedIn or X post', body: 'Posts with typos get fewer engagements. Quick check before you publish to keep your professional brand tight.' },
    { title: 'Editing a student newspaper article', body: 'Newspaper editors have to clean dozens of submissions. Drop each one in, fix the obvious issues, then focus your editorial time on structure and clarity.' },
    { title: 'Proofreading a research paper draft', body: 'Spelling and punctuation errors in a research paper signal carelessness even when the science is solid. Catch them here before peer review.' },
  ],
  faqs: [
    { question: 'Is this grammar checker really free?', answer: 'Yes, completely free with no sign-up. Unlike Grammarly, there\'s no premium version or paywall on advanced suggestions; what you see is what you get.' },
    { question: 'How does it compare to Grammarly?', answer: 'Grammarly has a more sophisticated AI engine and catches subtle stylistic issues this tool doesn\'t. For deep analysis we recommend our AI essay checker (full feedback + grade). For quick spelling/punctuation passes, this free checker is faster and more lightweight.' },
    { question: 'Will it catch all my errors?', answer: 'It catches the common ones, typos, missing capitals, double spaces, comma splices, basic subject-verb disagreements, repeated words. Subtle issues like dangling modifiers or unclear pronoun references need a deeper read or our paid essay checker.' },
    { question: 'Does it support British or American English?', answer: 'Both, it accepts US, UK, and Australian/Canadian spelling without flagging differences as errors ("colour" vs "color", "realise" vs "realize"). It does not auto-convert between them.' },
    { question: 'Can I check a long document at once?', answer: 'Yes, paste up to ~50,000 characters at a time. Past that, split your document into sections.' },
    { question: 'Does it work with markdown or rich text?', answer: 'Plain text is best. Markdown will be checked literally (asterisks, brackets show up). For rich text, paste with formatting and we\'ll ignore non-text characters.' },
    { question: 'Is my text private?', answer: 'Yes, the grammar check runs in your browser using rule-based pattern matching. Nothing is uploaded.' },
    { question: 'Why does it flag a correctly-spelled word?', answer: 'The dictionary covers ~250,000 common English words. Specialist vocabulary (medical, legal, technical jargon) and proper nouns may be flagged. Click "Add to dictionary" or just ignore.' },
    { question: 'Can I use it for non-English text?', answer: 'No, currently English only.' },
    { question: 'Will it detect AI-generated text or plagiarism?', answer: 'No, this tool only checks for grammar issues. For AI detection or plagiarism scanning, use a dedicated tool like Turnitin (most universities provide it).' },
  ],
  related: [TOOL_LINKS.wordCounter, TOOL_LINKS.readability, TOOL_LINKS.paraphrase, TOOL_LINKS.analyze, TOOL_LINKS.thesisGen, TOOL_LINKS.outline],
  closing:
    'Grammar errors are the cheapest marks to lose. They have nothing to do with the quality of your argument or research, and yet a paper riddled with them reads as careless and gets graded down accordingly. A two-minute pass through a grammar checker before submitting solves 90% of the issue.',
  accent: '#58CC02',
  comparison: {
    heading: 'WriteScholar Grammar Checker vs the alternatives',
    intro: 'Grammar tools all do similar surface-level checks. Differences appear at depth and pricing.',
    columns: ['Feature', 'WriteScholar', 'Grammarly Free', 'Grammarly Premium', 'Hemingway'],
    rows: [
      { feature: 'Spelling + punctuation', values: ['Yes', 'Yes', 'Yes', 'Limited'] },
      { feature: 'Style suggestions', values: ['Yes', 'Limited', 'Yes', 'Yes (different focus)'] },
      { feature: 'Vocabulary diversity check', values: ['Yes (paraphrasing tool)', 'Premium only', 'Yes', 'No'] },
      { feature: 'Plagiarism detection', values: ['No (use Turnitin)', 'No', 'Yes', 'No'] },
      { feature: 'Tone analysis', values: ['Coming', 'No', 'Yes', 'No'] },
      { feature: 'Browser extension', values: ['Coming', 'Yes', 'Yes', 'No'] },
      { feature: 'Sign-up required', values: ['No', 'Yes', 'Yes', 'No'] },
      { feature: 'Cost', values: ['Free', 'Free', '~$30/mo', 'Free / $20 desktop'] },
    ],
  },
  mistakes: [
    { title: 'Subject-verb disagreement', body: 'The number of cars are increasing → The number of cars IS increasing. "Number" is singular even when the noun after it is plural. Same with "amount", "team", "group", "majority".' },
    { title: 'Comma splice', body: 'I went to the library, I forgot my book. Two independent clauses joined only by a comma. Fix: use a period, semicolon, or coordinating conjunction (and, but, so).' },
    { title: 'Their / there / they\'re confusion', body: '"Their" = possessive. "There" = location. "They\'re" = they are. The grammar checker catches obvious cases but won\'t flag every misuse if the grammar is otherwise valid.' },
    { title: 'Apostrophe misuse', body: '"It\'s" = it is. "Its" = possessive (no apostrophe). Plural nouns NEVER take apostrophes ("the 1990s", not "the 1990\'s"). Apostrophe-s indicates ownership or contraction, not a plural.' },
    { title: 'Run-on sentences', body: 'A sentence that joins multiple complete thoughts without punctuation. "I love writing it\'s my passion." Fix with a period, semicolon, or conjunction. Run-ons are the most common readability killer in student essays.' },
    { title: 'Misplaced modifier', body: '"Walking down the street, the building looked tall." Did the building walk? No. Fix: "Walking down the street, I saw the tall building." The modifier should sit next to the noun it describes.' },
    { title: 'Capitalization slip-ups', body: 'i.e. → not capitalized after a period. e.g. → same. Months and days ARE capitalized. Seasons (spring, summer) are NOT. Compass directions are NOT (north) unless used as a region (the North).' },
  ],
  examples: [
    { label: 'Comma splice fix', before: 'The experiment failed, the results were inconclusive.', after: 'The experiment failed; the results were inconclusive.', explanation: 'Two independent clauses need a semicolon, period, or coordinating conjunction (and/but/so), not just a comma.' },
    { label: 'Subject-verb agreement', before: 'The list of recommendations have been finalised.', after: 'The list of recommendations has been finalised.', explanation: '"List" is the subject (singular), not "recommendations". The verb agrees with the head noun, not the noun closest to the verb.' },
    { label: 'Active vs passive voice', before: 'The data was analysed by the research team.', after: 'The research team analysed the data.', explanation: 'Active voice puts the actor first ("The research team"). Cleaner, more direct, easier to read. Use passive only when the actor is unknown or unimportant.' },
    { label: 'Vague pronoun reference', before: 'The CEO told the manager that he should resign.', after: 'The CEO told the manager that the manager should resign.', explanation: '"He" is ambiguous, does it refer to the CEO or the manager? Replace pronouns with proper nouns when there\'s any chance of confusion.' },
  ],
  tips: [
    { title: 'Read your work aloud', body: 'Reading aloud catches what your eye skips. Run-ons, awkward phrasing, missing words, all easier to hear than to see.' },
    { title: 'Fix issues in passes, not all at once', body: 'First pass: spelling. Second pass: punctuation. Third pass: style. Trying to fix everything at once is how you miss things.' },
    { title: 'Don\'t accept every suggestion', body: 'Grammar tools are rule-based. They flag violations even when your intentional choice is better. Trust your ear over the tool when you have a reason.' },
    { title: 'Save the grammar pass for last', body: 'Polishing grammar before you\'ve finished editing for content is wasted work. Get the argument right first; check spelling and punctuation last.' },
    { title: 'Use the readability score for sentence length', body: 'If your readability score is 14+, you\'re writing in too-long sentences. Pair the grammar checker with our readability tool for the full clarity check.' },
    { title: 'Keep British vs American consistent', body: 'Don\'t mix "colour" with "favorize". Pick US or UK English at the start and stick with it. The grammar checker accepts both but doesn\'t flag mixing.' },
  ],
  glossary: [
    { term: 'Independent clause', definition: 'A clause that can stand alone as a sentence. Has a subject and a verb. "She studies." is an independent clause.' },
    { term: 'Dependent clause', definition: 'A clause that can\'t stand alone, needs an independent clause to complete the meaning. "Because she studies..." is a dependent clause.' },
    { term: 'Comma splice', definition: 'Two independent clauses joined only by a comma. Always an error in formal writing. Fix with a period, semicolon, or conjunction.' },
    { term: 'Run-on sentence', definition: 'Two or more independent clauses with no punctuation or conjunction between them. "She studies he doesn\'t." is a run-on.' },
    { term: 'Modifier', definition: 'A word or phrase that describes another word. "Quickly" is a modifier of "ran" in "She quickly ran".' },
    { term: 'Dangling modifier', definition: 'A modifier with no clear word to modify. "Walking home, the rain started." (Who was walking? The rain didn\'t.)' },
    { term: 'Active voice', definition: 'Subject performs the verb action. "She wrote the essay."' },
    { term: 'Passive voice', definition: 'Subject receives the verb action. "The essay was written by her." Generally weaker; use sparingly.' },
    { term: 'Conjunction', definition: 'Word that joins clauses. Coordinating: and, but, or, so, yet, for, nor (FANBOYS). Subordinating: because, although, while, since.' },
    { term: 'Apostrophe', definition: 'Punctuation mark. Indicates possession ("Sarah\'s book") or contraction ("don\'t" = "do not"). NOT used for plurals.' },
  ],
};

/* ─── READABILITY SCORE ─────────────────────────────────────────── */
export const readabilitySeo: ToolSeoConfig = {
  heading: 'Free Readability Score Calculator, Flesch-Kincaid, Gunning Fog, SMOG',
  intro:
    'Paste your text to instantly see its readability across six leading formulas: Flesch-Kincaid Grade Level, Flesch Reading Ease, Gunning Fog Index, SMOG, Coleman-Liau, and Automated Readability Index. Get a single average grade level plus diagnostics on long sentences and complex words.',
  steps: [
    { title: 'Paste your text', body: 'Drop in any English passage of 100+ words. Shorter samples produce unreliable scores because formulas need enough sentence and word data to be meaningful.' },
    { title: 'Read the headline grade level', body: 'The "Average Grade Level" combines Flesch-Kincaid, Gunning Fog, SMOG, Coleman-Liau, and ARI. A score of 9 means roughly 9th-grade reading level, appropriate for general audiences.' },
    { title: 'Check the diagnostics', body: 'Below the scores, see your average words per sentence, syllables per word, percentage of complex (3+ syllable) words, and sentence count. These tell you what to actually fix.' },
    { title: 'Edit and re-score', body: 'Shortening sentences and replacing complex words is the fastest way to drop your grade level. Re-paste after editing to see the new score.' },
  ],
  useCases: [
    { title: 'Writing for a general audience (blog, news, marketing)', body: 'Aim for grade 6-8. Most popular blogs and news outlets target this range, readers skim, and complex prose loses them. Apple\'s marketing copy averages grade 4.' },
    { title: 'Writing for college students or professionals', body: 'Grade 10-12. Higher-ed audiences can handle longer sentences and three-syllable words, but cramming every sentence with jargon costs you readers.' },
    { title: 'Writing an academic paper', body: 'Grade 12-15 is normal for research papers. Some journals (Nature) explicitly target lower grade levels to broaden readership; others (specialist medical) accept higher.' },
    { title: 'Health, finance, or government communications', body: 'Plain-language laws in the US, UK, and Australia require grade 8 or below for public-facing health and government content. Score check is now standard practice.' },
    { title: 'Cleaning up an essay for clarity', body: 'If your readability score jumped 5 grade levels in one paragraph, you probably packed too much into one sentence. Split it.' },
  ],
  faqs: [
    { question: 'What is a "good" readability score?', answer: 'Depends on audience. For general blogs, grade 6-8. For business/professional, grade 10-12. For academic, grade 12-15. Below 6 reads as condescending; above 15 reads as inaccessible.' },
    { question: 'Which formula should I trust?', answer: 'For most general writing, Flesch-Kincaid Grade Level is the most-cited. For health communications, SMOG is the standard. The "Average" combines all five for a balanced view.' },
    { question: 'Does the tool work for languages other than English?', answer: 'No, these formulas are calibrated for English syllable patterns. Other languages need their own (e.g. Lix for Scandinavian languages).' },
    { question: 'How long does my text need to be?', answer: 'At least 100 words for stable scores; 300+ for reliable ones. Below 100 words, sentence and word averages swing wildly with each addition.' },
    { question: 'What is Flesch Reading Ease?', answer: 'A 0-100 score where higher = easier. 90-100 is 5th grade; 60-70 is plain English (8-9th grade); below 30 is graduate-level. The opposite direction from grade-level scores.' },
    { question: 'How is "complex word" defined?', answer: 'A word with 3 or more syllables, excluding compounds, proper nouns, and common suffixes (-ed, -es). Used by Gunning Fog and SMOG.' },
    { question: 'How do I lower my readability score?', answer: 'Three moves: (1) split long sentences, (2) replace 3+ syllable words with shorter synonyms ("utilize" → "use"), (3) cut filler ("in order to" → "to"). Each helps both grade level and Flesch reading ease.' },
    { question: 'Is grade level the same as years of education?', answer: 'Yes, roughly. Grade 9 ≈ 9th grade in US (age 14-15) ≈ Year 10 UK ≈ Year 9 Australia. A grade-12 score means a typical high-school graduate can read it without difficulty.' },
    { question: 'Why do different formulas give different scores?', answer: 'Each weights sentence length, word length, and syllable count differently. Flesch-Kincaid favours sentence length; SMOG favours complex words. The average smooths out individual quirks.' },
    { question: 'Can I trust this for academic submissions?', answer: 'Yes for first-pass diagnostics. Don\'t use it as the only check, readability scores can\'t tell whether your argument is logical, your evidence is strong, or your structure works. Use our AI essay checker for content-level feedback.' },
  ],
  related: [TOOL_LINKS.wordCounter, TOOL_LINKS.grammarChecker, TOOL_LINKS.paraphrase, TOOL_LINKS.thesisGen, TOOL_LINKS.outline, TOOL_LINKS.analyze],
  accent: '#FF9600',
  mistakes: [
    { title: 'Targeting one specific score', body: 'Different formulas weight things differently. A passage can hit Flesch-Kincaid grade 8 but Gunning Fog grade 11 because they prioritize different features. Look at the average, not one number.' },
    { title: 'Lowering grade level by chopping random words', body: 'Cutting filler is good. Cutting precision to lower a number is bad. "Cardiopulmonary resuscitation" might raise your grade level, but "CPR" is fine if your audience knows the term.' },
    { title: 'Ignoring sentence length', body: 'Average words per sentence is the single biggest readability factor. Bringing it from 25 to 15 typically drops your grade level by 2-3.' },
    { title: 'Using readability for fiction', body: 'Readability scores are for non-fiction. Fiction breaks rules deliberately, Cormac McCarthy reads at college level by formula but is gripping. Don\'t score literary writing.' },
    { title: 'Forgetting your audience', body: 'Grade 6 for a peer-reviewed journal is too dumbed-down. Grade 14 for a kids\' science magazine is too complex. Match the score to who\'s actually reading.' },
  ],
  examples: [
    { label: 'Lowering grade level via sentence splitting', before: 'The committee recommended that all participating institutions submit comprehensive documentation regarding their compliance with federal accessibility standards by the end of the second quarter.', after: 'The committee made a recommendation. All institutions must submit accessibility documentation by Q2.', explanation: '34 words → 16 words across 2 sentences. Grade level drops from ~17 to ~10. Same information, dramatically more readable.' },
    { label: 'Replacing complex words', before: 'The methodology utilized in the experiment necessitated extensive preliminary calibration.', after: 'The method needed careful prep work first.', explanation: '"Utilized" → "used"; "necessitated" → "needed"; "extensive preliminary calibration" → "careful prep work first". Drops average syllables per word and grade level.' },
  ],
  glossary: [
    { term: 'Flesch-Kincaid Grade Level', definition: 'Most-cited readability formula. Outputs a US grade level (e.g. 9.5 = end of 9th grade). Heavily weights average sentence length.' },
    { term: 'Flesch Reading Ease', definition: '0-100 score where higher = easier. 90-100: very easy. 60-70: plain English. Below 30: graduate-level. Inverse direction from grade level.' },
    { term: 'Gunning Fog Index', definition: 'Years of formal education needed to understand text on first read. Weights complex (3+ syllable) words heavily.' },
    { term: 'SMOG Index', definition: '"Simple Measure Of Gobbledygook". Standard for health communications. Counts polysyllabic words in 30-sentence sample.' },
    { term: 'Coleman-Liau Index', definition: 'Uses character count (not syllables) to estimate grade level. Useful for computer text analysis.' },
    { term: 'Plain Language', definition: 'Writing that\'s clear and direct. Plain Writing Act of 2010 (US) requires federal agencies to write public materials at grade 8 or below.' },
  ],
};

/* ─── THESIS GENERATOR ──────────────────────────────────────────── */
export const thesisGenSeo: ToolSeoConfig = {
  heading: 'Free Thesis Statement Generator, Argumentative, Analytical, Compare-Contrast',
  intro:
    'A weak thesis sinks an essay before the first body paragraph. This generator builds a strong, focused thesis statement for argumentative, expository, analytical, and compare-contrast essays. Fill in your topic, position, and reasoning, get a clean, debatable thesis you can drop into your introduction.',
  steps: [
    { title: 'Pick your essay type', body: 'Argumentative (you take a side), expository (you explain), analytical (you break down a text), or compare-contrast (you weigh two things). The thesis structure changes for each, picking the right one is half the battle.' },
    { title: 'Enter your topic', body: 'Be specific. "Climate change" is too broad; "the impact of carbon taxes on small businesses" is workable. The narrower your topic, the stronger your thesis.' },
    { title: 'State your position and reasons', body: 'For argumentative essays, give your stance plus 2-3 reasons. For analytical, give your interpretation plus 2-3 supporting points. The reasons become your body paragraph topics.' },
    { title: 'Review and refine', body: 'The generator outputs a working thesis. Read it once and check: is it debatable, specific, and answerable in one essay? If not, narrow it further or strengthen your position.' },
  ],
  useCases: [
    { title: 'Drafting an argumentative essay introduction', body: 'A thesis like "Social media should be regulated" is weak, too broad, too obvious. "Federal regulation of algorithmic content recommendations would reduce teen anxiety more effectively than age verification laws" is strong.' },
    { title: 'Building a compare-contrast paper', body: 'A compare-contrast thesis names both subjects and the criteria for comparison. "While both novels critique consumer culture, Fight Club uses spectacle and American Psycho uses horror to make their points." Subject + criteria + claim.' },
    { title: 'Writing an analytical literary essay', body: 'Don\'t just summarize. Make a claim about what the author is doing. "Toni Morrison uses second-person narration in Beloved to force the reader into Sethe\'s memory loops." This is a thesis a critic could disagree with, that\'s what makes it strong.' },
    { title: 'Research paper introductions', body: 'Research thesis statements often state the central question and the predicted answer. "This paper investigates whether minimum wage increases reduce employment in fast food, finding that the effect is statistically insignificant in markets with high turnover."' },
    { title: 'Thesis prep for a debate or speech', body: 'A debate thesis must be defensible and specific. The same generator works for prep, pick "argumentative", state your stance, and use the output as your opening claim.' },
  ],
  faqs: [
    { question: 'What makes a thesis statement strong?', answer: 'Three things: (1) it\'s debatable, a reasonable person could disagree; (2) it\'s specific, you can answer it in the essay\'s word count; (3) it\'s focused, one main argument, not three.' },
    { question: 'Should a thesis be one sentence?', answer: 'Usually, yes. Two sentences max, only if you need to add a "because" clause. If your thesis sprawls into three sentences, your argument isn\'t focused enough.' },
    { question: 'Where does the thesis go in an essay?', answer: 'Last sentence of the introduction paragraph. This signals "here\'s what I\'m going to argue" and sets up the body paragraphs that follow.' },
    { question: 'Can I change my thesis after I start writing?', answer: 'Yes, and you probably will. Drafting reveals what your real argument is. Update the thesis to match your final body paragraphs before you submit.' },
    { question: 'Is a question allowed as a thesis?', answer: 'No. A thesis is a claim, not a question. Use a question in the introduction to set up the topic, then state the answer as your thesis.' },
    { question: 'How long should a thesis statement be?', answer: '15-30 words is the sweet spot. Below 15 is usually too vague; above 30 starts compressing too many ideas.' },
    { question: 'What\'s the difference between a thesis and a topic sentence?', answer: 'A thesis controls the entire essay; a topic sentence controls one paragraph. Each body paragraph needs its own topic sentence that ties back to the thesis.' },
    { question: 'Can I use this generator for a graduate-level paper?', answer: 'Yes, the structure works at any level. Grad-level theses are usually narrower and more theoretically grounded; use the generator output as a starting frame and refine.' },
    { question: 'Does it work for a research proposal?', answer: 'Yes, pick "argumentative" or "analytical" and frame your research question as the position. The generator output becomes your hypothesis statement.' },
    { question: 'Will the generated thesis be unique to me?', answer: 'Yes, the output is built from your specific inputs. Two students with different topics and positions get different theses. The generator doesn\'t pull from a template database.' },
  ],
  related: [TOOL_LINKS.outline, TOOL_LINKS.analyze, TOOL_LINKS.grammarChecker, TOOL_LINKS.paraphrase, TOOL_LINKS.citationGenerator, TOOL_LINKS.summarizer],
  closing:
    'The thesis is the single most important sentence in your essay, it\'s the thing your reader uses to decide whether the rest is worth reading. Spending 15 minutes here before drafting saves hours of rewriting later.',
  mistakes: [
    { title: 'Writing a thesis that\'s a fact', body: '"Climate change is real", not a thesis. Nobody reasonable disagrees. A thesis must take a position SOMEONE could disagree with.' },
    { title: 'Writing a thesis that\'s too broad', body: '"Technology has changed society", what technology? what change? Narrow it: "Smartphone notifications have measurably reduced college students\' deep-work capacity."' },
    { title: 'Writing a thesis as a question', body: '"Is climate change reversible?", the thesis is the ANSWER, not the question. State your position: "Climate change is partially reversible through aggressive carbon capture."' },
    { title: 'Writing 3 theses in one', body: 'A thesis with 3 distinct claims becomes 3 essays. Pick the strongest claim and ditch the others.' },
    { title: 'Putting the thesis in the conclusion', body: 'Thesis goes in the introduction (last sentence), so the reader knows what to track in the body. Conclusion RESTATES the thesis, not introduces it.' },
  ],
  examples: [
    { label: 'Weak → strong (argumentative)', before: 'Social media is bad for teenagers.', after: 'Federal regulation of algorithmic content recommendations would reduce teen anxiety more effectively than age-verification laws because algorithms drive engagement-maximization, not well-being.', explanation: 'Specific (federal regulation), debatable (vs age verification), supported (because clause). All three thesis criteria met.' },
    { label: 'Weak → strong (analytical)', before: 'Toni Morrison\'s Beloved is about slavery.', after: 'Morrison\'s use of second-person narration in Beloved forces the reader into Sethe\'s memory loops, making the trauma of slavery experiential rather than historical.', explanation: 'Specific technique (second-person), specific effect (memory loops, experiential trauma), debatable claim a critic could push back on.' },
    { label: 'Weak → strong (compare-contrast)', before: 'Both novels critique consumer culture.', after: 'While Fight Club uses spectacle and violence to critique consumer culture, American Psycho uses psychological horror, and the latter is more effective because it implicates the reader, not just the protagonist.', explanation: 'Compares both works, names the criterion (mode of critique), and stakes a claim (latter is more effective).' },
  ],
  glossary: [
    { term: 'Thesis statement', definition: 'A 1-2 sentence claim that states the central argument of your essay. Always at the end of the introduction.' },
    { term: 'Argumentative thesis', definition: 'Takes a debatable position. "X should/should not Y because Z." Used in argumentative and persuasive essays.' },
    { term: 'Analytical thesis', definition: 'Makes an interpretive claim about a text or concept. "Author X uses technique Y to achieve effect Z."' },
    { term: 'Working thesis', definition: 'A draft thesis you write before drafting the essay. Often gets refined as the essay reveals what your real argument is.' },
    { term: 'Hypothesis', definition: 'A testable prediction in research papers. Same role as a thesis but framed as a question awaiting evidence.' },
    { term: 'Topic sentence', definition: 'First sentence of a body paragraph. Connects back to the thesis and previews what the paragraph will argue.' },
    { term: 'Three-part thesis', definition: 'Older 5-paragraph-essay style: claim + 3 reasons in one sentence. Now considered restrictive, most modern thesis statements are leaner.' },
  ],
};

/* ─── ESSAY OUTLINE GENERATOR ───────────────────────────────────── */
export const essayOutlineSeo: ToolSeoConfig = {
  heading: 'Free Essay Outline Generator, Argumentative, Persuasive, Research, Narrative',
  intro:
    'Build a structured outline for any essay type in 30 seconds. Pick the format, enter your topic and thesis, and the generator returns a ready-to-fill outline with introduction, body paragraphs, transitions, and conclusion sections. Copy it into your draft and start writing the body, not staring at a blank page.',
  steps: [
    { title: 'Choose your essay type', body: 'Argumentative, expository, narrative, persuasive, compare-contrast, or research. The outline structure changes meaningfully, narrative essays use chronological flow; argumentative essays use claim-evidence-rebuttal.' },
    { title: 'Enter your topic and thesis', body: 'A specific topic and thesis produce a more useful outline. If you don\'t have a thesis yet, our thesis generator (linked below) drafts one in seconds.' },
    { title: 'Choose the number of body paragraphs', body: 'Three is standard for a 1,000-1,500 word essay. Five for a 2,000-3,000 word paper. Each body paragraph in the outline gets its own topic sentence stub and supporting-evidence prompts.' },
    { title: 'Copy and start filling', body: 'The outline appears with intro hook, thesis placement, body paragraph stubs, transitions, and conclusion sections. Copy it into your draft and start filling, the structure is already done.' },
  ],
  useCases: [
    { title: 'Beating writer\'s block on a persuasive essay', body: 'Most blank-page paralysis comes from not having a structure. Get the outline first; the words come faster once you know where each paragraph is going.' },
    { title: 'Planning a research paper', body: 'Research papers need a literature review, methodology, results, and discussion. The "research" template lays out all four sections so you don\'t skip the methodology mistake everyone makes their first time.' },
    { title: 'Structuring a compare-contrast essay', body: 'Two organizational choices: block (all of A, then all of B) or point-by-point (A1 vs B1, A2 vs B2). The outline shows you both so you can pick what works for your topic.' },
    { title: 'Preparing for a timed exam essay', body: 'In a 60-minute essay exam, spend the first 5 minutes on a quick outline. Generate one before the exam to memorize the structure, it carries you when the clock is ticking.' },
    { title: 'Building a narrative essay (memoir, college essay)', body: 'Narrative essays need a hook, a "why this matters" turn, and a reflective close. The narrative outline includes all three so your personal statement doesn\'t devolve into "and then I did X, and then I did Y".' },
  ],
  faqs: [
    { question: 'What essay types does the generator support?', answer: 'Argumentative, expository, narrative, persuasive, compare-contrast, and research. Each has a distinct outline structure, pick the closest match for your assignment.' },
    { question: 'How many body paragraphs should my essay have?', answer: 'Three for a 5-paragraph essay (~1,500 words). Five for a 10-page paper (~2,500 words). For research papers, body paragraphs are organized into sections (literature review, methodology, results) rather than counted.' },
    { question: 'Should I follow the outline exactly?', answer: 'Treat it as scaffolding. Most writers tweak as they draft, the outline\'s job is to keep you moving forward, not to constrain you.' },
    { question: 'What goes in the introduction?', answer: 'Hook → context → thesis. The hook grabs attention; the context briefly explains why the topic matters; the thesis (last sentence) states your specific argument.' },
    { question: 'Where does the thesis go?', answer: 'Last sentence of the introduction. The body paragraphs that follow each defend one piece of the thesis.' },
    { question: 'How do I write transitions between paragraphs?', answer: 'Each paragraph\'s last sentence should hint at the next. Avoid rote phrases like "Furthermore" or "In addition", use specific transitions tied to your argument ("This raises the question of whether..." or "But that account misses...").' },
    { question: 'What goes in the conclusion?', answer: 'Restate the thesis (in different words) → summarize key points → end with a "so what", implications, applications, or unanswered questions. Never introduce new evidence in the conclusion.' },
    { question: 'Is this outline AI-generated?', answer: 'The structure templates are pre-built; your topic and thesis are inserted into the template. There\'s no large language model generating original sentences here, that\'s why it\'s instant and free.' },
    { question: 'Will my professor know I used an outline generator?', answer: 'No, the outline is just a structure. Your actual writing fills in the words. Outlines are a normal part of the writing process; using one isn\'t academic dishonesty.' },
    { question: 'Does it work for a college admissions essay?', answer: 'Yes, pick "narrative" for personal statements. The narrative outline gives you the hook, growth arc, and reflective close that admissions readers expect.' },
  ],
  related: [TOOL_LINKS.thesisGen, TOOL_LINKS.analyze, TOOL_LINKS.grammarChecker, TOOL_LINKS.citationGenerator, TOOL_LINKS.wordCounter, TOOL_LINKS.summarizer],
  accent: '#1CB0F6',
  mistakes: [
    { title: 'Outlining at the wrong altitude', body: 'A 50-bullet outline is a draft, not an outline. Aim for high-level structure (intro → 3 body sections → conclusion), then expand only on the body sections.' },
    { title: 'Writing the introduction first', body: 'Most pros write the intro LAST. The body reveals what you actually argued; the intro should preview that. Outline the body, then frame the intro.' },
    { title: 'Forgetting the "so what"', body: 'Every essay needs a "so what" answer. Why does this matter? The conclusion should land on it. If your outline doesn\'t have that ending, you\'re missing the point of the essay.' },
    { title: 'Single-source body paragraphs', body: 'A strong body paragraph weaves 2-3 sources together. If your outline shows one paragraph = one source, you\'re writing summary, not analysis.' },
    { title: 'Skipping transitions', body: 'Each body paragraph should end with a sentence pointing toward the next. Not "Furthermore...", specific transitions that build the argument.' },
  ],
  examples: [
    { label: 'Argumentative essay outline', before: 'Title: Why college should be free', after: 'I. Intro (hook → context → thesis: free college pays back via earnings tax)\nII. Body 1: Cost (evidence on tuition trends)\nIII. Body 2: Earnings (evidence on degree premium)\nIV. Body 3: Counterargument (rebut "moral hazard")\nV. Conclusion (so-what: societal ROI)', explanation: 'Skeleton outline shows 5 sections, each with a clear function. Filling in becomes much easier because you know what each section is for.' },
    { label: 'Compare-contrast: block vs point-by-point', before: 'Topic: 1984 vs Brave New World', after: 'POINT-BY-POINT (better for short essays):\nI. Intro\nII. Theme of control: 1984 vs BNW\nIII. Theme of pleasure: 1984 vs BNW\nIV. Theme of language: 1984 vs BNW\nV. Conclusion', explanation: 'Block format covers all of A, then all of B (better for long essays). Point-by-point alternates by criterion (better for short, focused essays).' },
  ],
  glossary: [
    { term: 'Outline', definition: 'Hierarchical sketch of an essay\'s structure before drafting. Shows the order of ideas and their relationships.' },
    { term: 'Hook', definition: 'Opening sentence designed to grab the reader. Anecdote, question, statistic, or provocative claim.' },
    { term: 'Topic sentence', definition: 'First sentence of each body paragraph. Names the paragraph\'s claim and ties to the thesis.' },
    { term: 'Transition', definition: 'Sentence or phrase that connects paragraphs. Carries the reader from one idea to the next without disorientation.' },
    { term: 'Block format', definition: 'Compare-contrast structure: discuss all of A, then all of B. Better for longer essays where holding distinctions in mind is harder.' },
    { term: 'Point-by-point format', definition: 'Compare-contrast structure: alternate between A and B for each criterion. Better for shorter, focused essays.' },
    { term: 'Five-paragraph essay', definition: 'Intro, three body, conclusion. Standard high-school structure. Limited in college; useful as a starting frame.' },
  ],
};

/* ─── TEXT CASE CONVERTER ───────────────────────────────────────── */
export const textCaseSeo: ToolSeoConfig = {
  heading: 'Free Text Case Converter, UPPERCASE, lowercase, Title Case, Sentence case',
  intro:
    'Switch any text between UPPERCASE, lowercase, Title Case, Sentence case, capitalize Each Word, aLtErNaTiNg, or iNVERSE in one click. Useful for headlines, code constants, social posts, and cleaning up text accidentally typed in caps lock.',
  steps: [
    { title: 'Paste your text', body: 'Drop any block of text into the input. Length doesn\'t matter, the conversion is instant even on 50,000-character documents.' },
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
    { question: 'Is this text case converter free?', answer: 'Yes, completely free, no sign-up, no character limit.' },
    { question: 'What\'s the difference between Title Case and "Capitalize Each Word"?', answer: 'Title Case follows publishing rules, articles ("the", "a"), conjunctions ("and", "but"), and short prepositions ("of", "in") stay lowercase unless they\'re the first or last word. "Capitalize Each Word" puts a capital on every single word, including those.' },
    { question: 'How is sentence case different from Title Case?', answer: 'Sentence case capitalizes only the first word of each sentence and proper nouns ("This is a sentence."). Title Case capitalizes most words ("This Is a Title").' },
    { question: 'Will it preserve special characters and emoji?', answer: 'Yes, case conversion only affects letters. Emoji, numbers, punctuation, and special characters pass through unchanged.' },
    { question: 'Does it handle non-English characters?', answer: 'Yes for most Latin-alphabet languages (French, Spanish, German). Works for Cyrillic and Greek. Does not handle case for languages without case (Chinese, Japanese, Arabic), they pass through unchanged.' },
    { question: 'Is my text uploaded anywhere?', answer: 'No. The conversion runs entirely in your browser using JavaScript string functions.' },
    { question: 'Can I batch-convert multiple paragraphs?', answer: 'Yes, paste them all in at once. The converter treats the input as one string and applies the case rule across the entire block.' },
    { question: 'How does sentence case detect sentence boundaries?', answer: 'It capitalizes the first letter after a period (.), question mark (?), or exclamation mark (!) followed by whitespace. Some abbreviations ("Dr.", "etc.") may be treated as sentence ends, manually fix in those edge cases.' },
    { question: 'Why is my "Title Case" output different from Microsoft Word\'s?', answer: 'Word follows the AP Stylebook by default. We follow the Chicago Manual of Style. Both are valid English title-case standards, but they differ on a handful of edge words ("Up" vs "up", "If" vs "if").' },
  ],
  related: [TOOL_LINKS.wordCounter, TOOL_LINKS.grammarChecker, TOOL_LINKS.readability, TOOL_LINKS.outline, TOOL_LINKS.thesisGen, TOOL_LINKS.paraphrase],
  examples: [
    { label: 'UPPERCASE for code constants', before: 'maxRetryCount, apiBaseUrl, defaultTimeout', after: 'MAX_RETRY_COUNT, API_BASE_URL, DEFAULT_TIMEOUT', explanation: 'Most languages use UPPER_SNAKE_CASE for constants. Convert variable names by replacing camelCase with words separated by underscores, then uppercase the lot.' },
    { label: 'Title Case for headlines', before: 'a journey through the mountains of nepal', after: 'A Journey Through the Mountains of Nepal', explanation: 'Title case capitalizes most words but keeps articles ("the"), conjunctions ("and"), and short prepositions ("of") lowercase, except when they\'re the first or last word.' },
    { label: 'Sentence case for paper titles (APA)', before: 'The Effect of Caffeine on Working Memory in College Students', after: 'The effect of caffeine on working memory in college students', explanation: 'APA reference list titles use sentence case. Only the first word, proper nouns, and the first word after a colon are capitalized.' },
  ],
  glossary: [
    { term: 'UPPERCASE', definition: 'All letters capitalized. Used for emphasis, code constants, and acronyms. AKA "all caps".' },
    { term: 'lowercase', definition: 'No capital letters. Default for body text in most contexts. Sometimes called "smallcaps" though that\'s technically a different concept.' },
    { term: 'Title Case', definition: 'Most words capitalized, except articles (the, a), conjunctions (and, but), and short prepositions (of, in). Used for English headlines and book titles.' },
    { term: 'Sentence case', definition: 'Only the first letter of each sentence and proper nouns capitalized. Used for body text and APA reference titles.' },
    { term: 'camelCase', definition: 'firstWordLowercase, subsequentWordsCapitalized. Used in JavaScript, Java, Swift for variable and function names.' },
    { term: 'PascalCase', definition: 'EveryWordCapitalized, no spaces. Used for class names in most programming languages. AKA UpperCamelCase.' },
    { term: 'snake_case', definition: 'words_separated_by_underscores. Used in Python and Ruby for variable and function names.' },
    { term: 'kebab-case', definition: 'words-separated-by-dashes. Used in URLs, CSS class names, and HTML attributes.' },
    { term: 'CONSTANT_CASE', definition: 'UPPER_SNAKE_CASE, UPPERCASE words separated by underscores. Used for constants in most programming languages.' },
  ],
};

/* ─── PARAPHRASING TIPS ─────────────────────────────────────────── */
export const paraphraseSeo: ToolSeoConfig = {
  heading: 'Free Paraphrasing Tips, Spot Weak Verbs, Wordy Phrases, Passive Voice',
  intro:
    'Paste your essay or paragraph and the analyzer flags overused words, weak verbs, wordy phrases, passive voice, and clichés, the most common style problems in academic writing. You get a list of issues with rewrite suggestions, not a one-click rewrite. The goal is to teach you to paraphrase, not to do it for you.',
  steps: [
    { title: 'Paste your text', body: 'Any paragraph, page, or full essay. The analyzer works best on 100+ words because patterns become statistically meaningful.' },
    { title: 'Read the issue categories', body: 'Each category has a count + examples: overused words, weak verbs, wordy phrases, passive voice, clichés, hedging language, vocabulary diversity score.' },
    { title: 'Apply the fixes', body: 'Each flagged item gets specific rewrite suggestions. "She made a decision" → "She decided". "Due to the fact that" → "Because". Apply selectively, not every flag needs fixing.' },
    { title: 'Recheck and refine', body: 'Re-paste your edited version to see your improvement. A good target: bring your "weak verb" count down 50% on the first pass.' },
  ],
  useCases: [
    { title: 'Paraphrasing a quote without plagiarism', body: 'Plagiarism risk happens when paraphrases stay too close to the original. The analyzer shows you which phrases are wordy boilerplate that any thesaurus would flag, replace those first.' },
    { title: 'Strengthening a college essay', body: 'College essays read flat when they overuse "is", "was", and "are". The weak-verb finder shows you exactly where to swap in active verbs ("argues", "demonstrates", "challenges").' },
    { title: 'Cutting a paper to a word limit', body: 'Wordy phrases ("in order to", "due to the fact that", "for the purpose of") add length without adding meaning. The analyzer finds them, cutting saves hundreds of words on a 2,500-word paper.' },
    { title: 'Active vs passive voice for journalism', body: 'Journalism style guides demand active voice. "Mistakes were made" → "The CEO made mistakes". The passive-voice flag shows you every passive construction in your draft.' },
    { title: 'Improving research paper readability', body: 'Academic writing is famously dense. Paraphrasing toward shorter, more direct sentences raises your readability score and broadens your audience.' },
  ],
  faqs: [
    { question: 'Is this an AI paraphrasing tool?', answer: 'No, it\'s an analysis tool, not a rewrite tool. It tells you what to fix; you rewrite the sentences. This is intentional: AI rewrites often introduce factual errors and trip plagiarism detectors. Learning to paraphrase yourself avoids both.' },
    { question: 'How do I paraphrase without plagiarising?', answer: 'Three-step rule: (1) read the source, (2) close it and write what you understood in your own words, (3) cite the source. Never write with the source open in front of you, that\'s where plagiarism happens.' },
    { question: 'What\'s a "weak verb"?', answer: 'Forms of "to be" (is, was, were, are), generic verbs (do, get, make, have), and stative verbs that don\'t describe action. "She was the writer of the essay" → "She wrote the essay".' },
    { question: 'Should I eliminate all passive voice?', answer: 'No, passive is correct when the actor is unknown ("The bridge was built in 1923") or when the action matters more than the actor ("Mistakes were made", sometimes the political non-attribution is the point). Eliminate it only when active is clearer.' },
    { question: 'What\'s "vocabulary diversity"?', answer: 'The ratio of unique words to total words. A diverse essay uses many distinct words; a repetitive essay uses few. Aim for 50%+ diversity on academic writing.' },
    { question: 'How is this different from Grammarly\'s rephrase feature?', answer: 'Grammarly rewrites sentences for you. We show you what\'s wrong so you learn to rewrite. Different goals, pick the one that matches your aim.' },
    { question: 'Does the tool handle British English?', answer: 'Yes, it ignores spelling differences and treats both UK and US as standard.' },
    { question: 'Will it detect plagiarism?', answer: 'No, for plagiarism detection, use Turnitin (most universities provide it) or our paid AI essay checker, which includes a similarity check against the open web.' },
    { question: 'How long can my text be?', answer: 'Up to ~50,000 characters. Longer texts can be split into sections.' },
    { question: 'Is my text private?', answer: 'Yes, analysis runs in your browser. Nothing is stored.' },
  ],
  related: [TOOL_LINKS.grammarChecker, TOOL_LINKS.readability, TOOL_LINKS.thesisGen, TOOL_LINKS.outline, TOOL_LINKS.analyze, TOOL_LINKS.summarizer],
  accent: '#FF9600',
  comparison: {
    heading: 'WriteScholar vs AI paraphrasing tools',
    intro: 'Paraphrasing tools split into two camps: ones that rewrite for you (Quillbot, Wordtune) and ones that teach you to rewrite (us). Each has its place.',
    columns: ['Feature', 'WriteScholar', 'Quillbot Free', 'Wordtune', 'Manual rewrite'],
    rows: [
      { feature: 'AI rewrites text for you', values: ['No, analysis only', 'Yes', 'Yes', 'No'] },
      { feature: 'Plagiarism risk', values: ['Lowest (you write)', 'Medium (close paraphrasing)', 'Medium', 'Lowest'] },
      { feature: 'Detects passive voice', values: ['Yes', 'Indirectly', 'No', 'Manual'] },
      { feature: 'Identifies overused words', values: ['Yes', 'No', 'No', 'Manual'] },
      { feature: 'Vocabulary diversity score', values: ['Yes', 'No', 'No', 'Manual'] },
      { feature: 'Skill-building (learn from it)', values: ['Yes', 'Limited', 'Limited', 'Yes' ] },
      { feature: 'Sign-up required', values: ['No', 'No (limited)', 'Yes', 'n/a'] },
    ],
  },
  mistakes: [
    { title: 'Just swapping synonyms', body: '"He utilized the methodology" → "He used the method" is fine. But "He thoroughly investigated the matter" → "He completely scrutinized the issue" is patchwriting, same structure, just different words. Plagiarism detectors flag it.' },
    { title: 'Paraphrasing without citing', body: 'Even a fully reworded paraphrase needs a citation. The IDEA isn\'t yours; the wording is. No citation = plagiarism.' },
    { title: 'Over-paraphrasing strong original phrases', body: 'If the source has a uniquely apt phrase ("the banality of evil"), quote it. Paraphrasing diminishes it. Direct quote + citation is better than weakened paraphrase.' },
    { title: 'Eliminating ALL passive voice', body: 'Passive is correct when the actor is unknown ("Bridges were built in the 1920s") or unimportant. Don\'t kill all passive, kill unnecessary passive.' },
    { title: 'Using a thesaurus blindly', body: '"Big" and "enormous" are both synonyms for "large", but they have different connotations. A thesaurus replacement that ignores connotation usually reads worse, not better.' },
  ],
  examples: [
    { label: 'Cutting wordiness', before: 'In view of the fact that the experiment was conducted under controlled conditions, the results can, in some sense, be considered reliable.', after: 'Because the experiment was controlled, the results are reliable.', explanation: '21 words → 9 words. Same meaning. "In view of the fact that" → "Because"; "in some sense, be considered" deleted as filler.' },
    { label: 'Removing weak verbs', before: 'The author makes the argument that climate change has an impact on agriculture.', after: 'The author argues that climate change affects agriculture.', explanation: '"Makes the argument" → "argues". "Has an impact on" → "affects". Strong verbs replace weak verb + noun phrases.' },
    { label: 'Active voice rewrite', before: 'The hypothesis was confirmed by the experiment.', after: 'The experiment confirmed the hypothesis.', explanation: 'Subject and object swap; passive verb becomes active. Tighter, more direct, easier to read.' },
    { label: 'Real paraphrasing (not patchwriting)', before: 'Original: "Climate change is causing rising sea levels, which threaten coastal cities."', after: 'Paraphrase: "Coastal cities face flooding risks as global warming melts polar ice (Author, 2023)."', explanation: 'The structure, vocabulary, and emphasis all differ, but the meaning is preserved and the source is cited. That\'s genuine paraphrasing.' },
  ],
  tips: [
    { title: 'Read, close, write', body: 'Read the source paragraph. CLOSE THE TAB. Write what you understood in your own words. Then add the citation. Never paraphrase with the source open in front of you.' },
    { title: 'Aim for 50%+ vocabulary diversity', body: 'Use the analyzer\'s diversity score. Below 30% = repetitive (you keep using the same words). Above 50% = varied. Academic writing should target 50-65%.' },
    { title: 'Replace 1 weak verb per paragraph', body: 'Even one substitution per paragraph ("makes a decision" → "decides") tightens the writing without overhauling it. Cumulatively, dramatic.' },
    { title: 'Read aloud to spot wordiness', body: 'If you can\'t finish a sentence in one breath, it\'s probably too long. Wordiness reveals itself when spoken.' },
    { title: 'Cite ideas, quote phrasings', body: 'If the original wording is genuinely unique, quote it directly with citation. Trying to paraphrase a brilliant phrase usually weakens it.' },
  ],
  glossary: [
    { term: 'Paraphrasing', definition: 'Restating someone else\'s ideas in your own words and structure, while citing the source. The meaning is preserved; the language is yours.' },
    { term: 'Patchwriting', definition: 'Replacing a few words with synonyms but keeping the original structure. Considered a form of plagiarism by most universities.' },
    { term: 'Direct quote', definition: 'Verbatim words from a source, in quotation marks, with citation. Used when the exact wording matters.' },
    { term: 'Passive voice', definition: 'Sentence structure where the subject receives the action. "The cake was eaten by John." Compare to active: "John ate the cake."' },
    { term: 'Active voice', definition: 'Sentence structure where the subject performs the action. Generally clearer and more direct than passive.' },
    { term: 'Hedge / hedging language', definition: 'Words that soften claims: "may", "might", "could", "tends to". Useful in academic writing but overused dilutes your argument.' },
    { term: 'Cliché', definition: 'An overused phrase that\'s lost its meaning ("at the end of the day", "thinking outside the box"). Replace with specific, original phrasing.' },
    { term: 'Vocabulary diversity', definition: 'The ratio of unique words to total words in a passage. A measure of how varied your word choice is.' },
  ],
};

/* ─── GPA CALCULATOR ────────────────────────────────────────────── */
export const gpaSeo: ToolSeoConfig = {
  heading: 'Free GPA Calculator, Semester and Cumulative GPA',
  intro:
    'Add your courses, credit hours, and letter grades to instantly compute your semester GPA. Add multiple semesters to compute your cumulative GPA. Supports standard 4.0 scale, weighted scales (AP/honors +0.5), and unweighted scales. No sign-up.',
  steps: [
    { title: 'Add a course', body: 'Click "Add Course" and enter the course name, credit hours, and your letter grade. Most US colleges use 3-credit courses for standard classes; lab courses are often 1 credit; senior thesis or capstone classes can be 6.' },
    { title: 'Repeat for every course this semester', body: 'Add each course separately. The GPA recalculates live as you add courses, so you can see how a single grade pulls your average up or down.' },
    { title: 'View your semester GPA', body: 'The headline number is your unweighted GPA on a 4.0 scale. A 3.5 is "B+/A-" territory; a 3.7 is solid A-; a 4.0 is straight As.' },
    { title: 'Add more semesters for cumulative GPA', body: 'Click "Add Semester" to layer in past terms. Cumulative GPA averages across all credit hours, not all semesters, a heavy 18-credit semester pulls more than a light 12-credit semester.' },
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
    { question: 'How do pass/fail courses affect GPA?', answer: 'Most schools exclude pass/fail courses from GPA calculation entirely, a "Pass" doesn\'t add or subtract grade points. Set those courses to 0 credits or omit them.' },
    { question: 'How do withdrawals (W) affect GPA?', answer: 'A "W" doesn\'t count toward GPA, it\'s a transcript notation, not a grade. The course doesn\'t contribute to or detract from your average. Too many Ws can still hurt grad school applications.' },
    { question: 'How do I convert percentages to letter grades?', answer: 'Most US scales: 90-100 = A, 80-89 = B, 70-79 = C, 60-69 = D, below 60 = F. Some schools use 93+ for A. Your school\'s registrar publishes the official conversion.' },
    { question: 'Can I calculate UK or international GPA equivalents?', answer: 'This tool uses the US 4.0 scale. UK first-class honours ≈ 3.7+ US GPA; 2:1 ≈ 3.3-3.7; 2:2 ≈ 2.7-3.3. Conversions are approximate, always check the receiving institution\'s policy.' },
    { question: 'Is my GPA data saved?', answer: 'No, calculations happen in your browser and clear when you close the tab. We don\'t store any of your courses or grades.' },
  ],
  related: [TOOL_LINKS.calc, TOOL_LINKS.conv, TOOL_LINKS.pomodoro, TOOL_LINKS.outline, TOOL_LINKS.analyze, TOOL_LINKS.thesisGen],
  accent: '#58CC02',
  comparison: {
    heading: 'GPA grading scales by region',
    intro: 'GPA isn\'t universal. Here\'s how the same student\'s performance translates across the most common systems.',
    columns: ['Letter / Tier', 'US 4.0', 'US %', 'UK', 'India %', 'Australia'],
    rows: [
      { feature: 'A / A+', values: ['4.0', '93-100', 'First (1st)', '90-100', 'HD'] },
      { feature: 'A-', values: ['3.7', '90-92', 'First (1st)', '85-89', 'HD'] },
      { feature: 'B+', values: ['3.3', '87-89', 'Upper Second (2:1)', '75-84', 'D'] },
      { feature: 'B', values: ['3.0', '83-86', 'Upper Second (2:1)', '65-74', 'D'] },
      { feature: 'B-', values: ['2.7', '80-82', 'Lower Second (2:2)', '60-64', 'C'] },
      { feature: 'C+', values: ['2.3', '77-79', 'Lower Second (2:2)', '55-59', 'C'] },
      { feature: 'C', values: ['2.0', '73-76', 'Third (3rd)', '50-54', 'P'] },
      { feature: 'D / Pass', values: ['1.0', '60-66', 'Pass / Ord.', '40-49', 'P (cond.)'] },
      { feature: 'F', values: ['0.0', '<60', 'Fail', '<40', 'F'] },
    ],
  },
  mistakes: [
    { title: 'Forgetting to weight by credit hours', body: '4 credits of an A and 1 credit of a C is NOT a B. Weight matters: (4×4.0 + 1×2.0) / 5 = 3.6, not 3.0. Most calculators do this automatically; some students miscalculate by hand.' },
    { title: 'Using high school weighted GPA on college apps', body: 'Most colleges recalculate using their own scale (often unweighted). Reporting "5.0 weighted" doesn\'t impress them, they want the unweighted equivalent (typically 4.0).' },
    { title: 'Including pass/fail courses', body: 'Pass/fail courses don\'t count toward GPA at most schools. A "Pass" doesn\'t add or subtract grade points. Set the credit to 0 in the calculator or omit the course.' },
    { title: 'Treating retakes wrong', body: 'Some schools replace the original grade; some average both. Check your registrar\'s policy. The calculator shows the math, but you have to apply your school\'s rule.' },
    { title: 'Confusing semester and cumulative GPA', body: 'Semester GPA = this term only. Cumulative GPA = all terms combined. Many students celebrate a 4.0 semester without realizing their cumulative is still 3.4.' },
    { title: 'Ignoring grade-grub potential', body: 'A 79.4% might round up to 80% (B-) at one school, stay 79% (C+) at another. Always check before assuming you know your final GPA.' },
  ],
  examples: [
    { label: 'Single-semester GPA calculation', before: '5 courses: A (4cr), B+ (3cr), B (4cr), A- (3cr), C+ (1cr)', after: 'Total: (4.0×4) + (3.3×3) + (3.0×4) + (3.7×3) + (2.3×1) = 16 + 9.9 + 12 + 11.1 + 2.3 = 51.3 / 15 credits = 3.42 GPA', explanation: 'Multiply each grade point by credit hours, sum, divide by total credits. NOT a simple average of grade points.' },
    { label: 'Calculating what you need on the final', before: 'Current grade in class: 78% (going into final worth 30%)', after: 'For an A (90%): need 100% on the final. For a B (80%): need 84.7% on the final. For a B- (78%): need 78% (no change).', explanation: 'New grade = (current grade × current weight) + (final score × final weight). Solve for final score given target.' },
    { label: 'Cumulative GPA across semesters', before: 'Sem 1: 3.6 GPA over 15 credits. Sem 2: 3.2 GPA over 18 credits.', after: 'Cumulative: (3.6×15 + 3.2×18) / (15+18) = (54 + 57.6) / 33 = 3.38', explanation: 'Cumulative GPA = sum of (semester GPA × credits) ÷ total credits. NOT the average of semester GPAs.' },
  ],
  tips: [
    { title: 'Aim for 0.1 above the threshold', body: 'Honors at 3.5 means submit at 3.6, not 3.5 exactly. Buffer protects you if a grade is recalculated downward.' },
    { title: 'Front-load hard courses', body: 'A "C" in calc as a freshman hurts less than a "C" senior year for the same reason: it averages over more credits in cumulative GPA. Take the hard ones early when bad grades cost less proportionally.' },
    { title: 'Use the predictor for finals week', body: 'Plug in your current grades to see your projected GPA. Tells you whether retention or graduation honors is at risk before grades are locked in.' },
    { title: 'Track over time, not per assignment', body: 'A bad single test grade panics most students. Plug everything in to see the actual semester impact, usually less than feared.' },
    { title: 'Consider grade replacement carefully', body: 'Some schools allow re-taking a course to replace the original grade. The "replaced" course still appears on the transcript with both grades, only the higher one counts toward GPA. Worth using on a C, less so on a B.' },
  ],
  glossary: [
    { term: 'Grade Point Average (GPA)', definition: 'Numerical average of grade points (A=4.0, B=3.0, etc.) weighted by credit hours. Standard US measure of academic performance.' },
    { term: 'Cumulative GPA', definition: 'GPA across all completed semesters. The number that appears on your transcript and what most employers/grad schools care about.' },
    { term: 'Semester GPA', definition: 'GPA for a single term only. Used for honors lists, scholarship eligibility, and progress tracking.' },
    { term: 'Weighted GPA', definition: 'High school GPA where AP/honors courses get +0.5 or +1.0 grade points. Maximum is 5.0 (or higher). Used for class ranking.' },
    { term: 'Unweighted GPA', definition: 'GPA on a flat 4.0 scale regardless of course difficulty. Used by most colleges in admissions recalculation.' },
    { term: 'Credit hour', definition: 'Unit of academic work. Typical college course = 3 credit hours = 3 hours/week of class for one semester.' },
    { term: 'Honors GPA', definition: 'Threshold for academic honors at most colleges. Cum laude usually 3.5, magna cum laude 3.7, summa cum laude 3.9, but exact thresholds vary.' },
    { term: 'Last 60 GPA', definition: 'GPA across your most recent 60 credit hours. Used by many grad schools because it shows current performance, not freshman struggle.' },
  ],
};

/* ─── POMODORO TIMER ────────────────────────────────────────────── */
export const pomodoroSeo: ToolSeoConfig = {
  heading: 'Free Pomodoro Timer, Focus Sessions and Breaks',
  intro:
    'A Pomodoro timer breaks study time into 25-minute focused sessions ("pomodoros") with 5-minute breaks between them, and a longer 15-30 minute break after every fourth session. The structure is the entire technique, your job is to work for the full focus interval and rest for the full break interval.',
  steps: [
    { title: 'Pick your interval lengths', body: 'Default is 25/5/15 (25-minute focus, 5-minute short break, 15-minute long break after 4 cycles). New to Pomodoro? Stick with the default. Already a power user? Try 50/10 or 90/15 for deeper work.' },
    { title: 'Start the focus timer', body: 'Click Start. For 25 minutes, do nothing but the task you set. No phone, no email, no notifications, no "just one tab". Single-tasking is the entire point of the technique.' },
    { title: 'Take the break', body: 'When the timer rings, stop work mid-sentence if you have to. Stand up, walk, get water, look out a window. Don\'t scroll social media or check email, that\'s context-switching, not rest.' },
    { title: 'Repeat for 4 cycles, then long break', body: 'After four 25-minute sessions, take a 15-30 minute break. Do something genuinely restorative, short walk, lunch, full step away. Then resume.' },
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
    { question: 'What is the Pomodoro Technique?', answer: 'A time-management method by Francesco Cirillo (1980s). Work in 25-minute blocks, break for 5, take a longer break every 4th cycle. The Italian word "pomodoro" means tomato, Cirillo used a tomato-shaped kitchen timer.' },
    { question: 'Why 25 minutes?', answer: 'Short enough to feel manageable, long enough to get into flow. Cirillo experimented with longer and shorter intervals; 25 was the empirical sweet spot for most knowledge work.' },
    { question: 'Can I customize the intervals?', answer: 'Yes, the timer lets you set focus, short-break, and long-break durations independently. Some people prefer 50/10 (longer focus); some prefer 15/3 (shorter focus, less mental fatigue).' },
    { question: 'Should I keep working if I\'m in flow?', answer: 'Cirillo says no, break anyway. The forced break is what makes the next session productive. In practice, finish your current sentence/paragraph/function then break.' },
    { question: 'What should I do during the break?', answer: 'Anything that\'s NOT the same kind of mental work: walk, stretch, get water, look outside. Avoid screens, checking email or social media is context-switching, not rest.' },
    { question: 'Does the timer make a sound when it ends?', answer: 'Yes, there\'s a built-in beep. Toggle it off in the settings if you\'re in a quiet space.' },
    { question: 'Can I track how many Pomodoros I do?', answer: 'Yes, the counter at the top of the timer increments every completed focus cycle. Resets when you close the tab.' },
    { question: 'Is the Pomodoro Technique evidence-based?', answer: 'Mixed evidence. The general principle of breaking work into intervals with rest is well-supported (the "spacing effect" in learning science). The exact 25/5 split is more rule-of-thumb than experimentally validated.' },
    { question: 'What if I get interrupted during a Pomodoro?', answer: 'Cirillo\'s rule: if a real interruption comes, abandon the Pomodoro entirely and start a fresh one when ready. Don\'t pause and resume, it breaks the focus discipline.' },
    { question: 'Can I use it for non-study work?', answer: 'Yes, Pomodoros work for any focused single-tasking work: writing, coding, reading, design, music practice. Less useful for collaborative or meeting-heavy work.' },
  ],
  related: [TOOL_LINKS.gpa, TOOL_LINKS.calc, TOOL_LINKS.outline, TOOL_LINKS.thesisGen, TOOL_LINKS.summarizer, TOOL_LINKS.flashcards],
  comparison: {
    heading: 'Pomodoro variations, pick what fits your brain',
    intro: 'The classic 25/5 isn\'t the only Pomodoro split. Different tasks and different brains benefit from different intervals.',
    columns: ['Variant', 'Focus', 'Short Break', 'Long Break', 'Best for'],
    rows: [
      { feature: 'Classic Pomodoro', values: ['25 min', '5 min', '15-30 min', 'General studying'] },
      { feature: 'Deep Work', values: ['50 min', '10 min', '30 min', 'Coding, writing, research'] },
      { feature: 'Ultradian Rhythm', values: ['90 min', '20 min', 'n/a', 'Single-task creative work'] },
      { feature: 'ADHD-friendly', values: ['15 min', '3 min', '15 min', 'Short attention span'] },
      { feature: 'Animedoro', values: ['40-60 min', '20 min (anime episode)', 'n/a', 'Reward-driven learners'] },
      { feature: '52/17', values: ['52 min', '17 min', 'n/a', 'Office workers (DeskTime study)'] },
    ],
  },
  mistakes: [
    { title: 'Skipping the breaks', body: 'The break is the technique. Working 25/0/25/0/25 is just working continuously and resentment-checking the clock. The break refreshes attention; without it, the second hour is wasted.' },
    { title: 'Doing email or social media on breaks', body: 'Scrolling Instagram doesn\'t reset your focus, it engages a different part of your attention. Walk, drink water, look out a window. Anything that\'s NOT looking at a screen.' },
    { title: 'Multitasking during a Pomodoro', body: 'Defeats the entire point. ONE task per Pomodoro. If your assignment has multiple parts, allocate one Pomodoro per part.' },
    { title: 'Pausing the timer to take a phone call', body: 'Cirillo\'s rule: a Pomodoro is sacred. If interrupted, abandon it and start a fresh one when ready. Pausing breaks the focus discipline.' },
    { title: 'Using it for collaborative work', body: 'Pomodoro is built for solo focus. Meetings, brainstorms, and pair programming need different time structures. Don\'t force it where it doesn\'t fit.' },
    { title: 'Underestimating mental fatigue', body: 'After 4 Pomodoros (2 hours), your effective output drops sharply. Take the long break seriously, 15-30 minutes, walk outside if you can.' },
  ],
  examples: [
    { label: 'Studying for a finals week', before: 'Plan: 8 hours straight on Wednesday', after: 'Plan: 4 sets of 4 Pomodoros = 5 hours of focus + 1 hour of breaks across the day. Stop at 9pm, sleep 8 hours, repeat.', explanation: 'The 8-hour grind almost always degrades to 4 hours of useful work + 4 hours of distracted scrolling. Pomodoro\'s 5 focused hours actually produce more.' },
    { label: 'Writing a 2,000-word essay', before: 'Approach: sit down, write until done', after: 'Approach: 1 Pomodoro outlining + 4 Pomodoros writing (500 words/Pomodoro) + 2 Pomodoros editing. Total: 7 Pomodoros (~3.5 hours).', explanation: 'Breaking the essay into Pomodoro-sized chunks means each session has a clear, finish-able goal. No "I\'ll just write till I\'m done" drift.' },
    { label: 'Beating procrastination', before: '"I\'ll work on the assignment all afternoon" (and then don\'t start)', after: '"I\'ll do ONE Pomodoro on the assignment right now"', explanation: '25 minutes is short enough to commit to. Once started, momentum usually carries you into a second Pomodoro. Procrastination beaten by lowering the activation cost.' },
  ],
  tips: [
    { title: 'Plan your Pomodoros at the start of the day', body: '"I\'ll do 6 Pomodoros today, two each on assignments A, B, C." Beats vague "I\'ll get to it", specific commitment increases follow-through.' },
    { title: 'Use a different room for breaks', body: 'Physical separation between focus and rest cements both. Working at desk, breaking on couch (or outside) helps your brain switch modes.' },
    { title: 'Don\'t use the technique forever', body: 'Heavy Pomodoro use is great for crunch periods. Cirillo himself recommends easing off when you\'re not in deep crunch, the structure becomes its own friction.' },
    { title: 'Track Pomodoro completions, not hours', body: '"I did 8 Pomodoros today" beats "I studied for 4 hours", completions are objective; hours include scrolling and snack breaks.' },
    { title: 'Pair with a single task list', body: 'Each Pomodoro tackles ONE item. If a task takes 3 Pomodoros, that\'s fine, just pick the next sub-step at each break.' },
    { title: 'Long break = phone-off walk', body: 'For the long break, leave your phone behind. 20 minutes outside, no screens, recharges focus far better than 20 minutes scrolling.' },
  ],
  glossary: [
    { term: 'Pomodoro', definition: 'Italian for "tomato". Refers to a single 25-minute focus interval. Named after Francesco Cirillo\'s tomato-shaped kitchen timer.' },
    { term: 'Pomodoro Technique', definition: 'Time-management method by Francesco Cirillo (1980s). Work in 25-minute focused intervals separated by 5-minute breaks; longer break every 4th interval.' },
    { term: 'Time-boxing', definition: 'General term for setting a fixed time for a task. Pomodoro is one specific time-boxing method.' },
    { term: 'Deep work', definition: 'Cal Newport\'s term for focused, distraction-free work. Pomodoro structures deep work in 25-minute intervals.' },
    { term: 'Flow state', definition: 'Mihaly Csikszentmihalyi\'s term for total absorption in a task. Pomodoro purists argue you should still break out of flow at the bell; Cirillo\'s rule is firm on it.' },
    { term: 'Context-switching cost', definition: 'Mental overhead of moving between unrelated tasks. Pomodoro reduces it by enforcing one task per interval.' },
    { term: 'Ultradian rhythm', definition: 'Natural 90-120-minute cycles of human alertness. Long-form Pomodoro variants (90/20) align with these cycles.' },
  ],
};

/* ─── SCIENTIFIC CALCULATOR ─────────────────────────────────────── */
export const calcSeo: ToolSeoConfig = {
  heading: 'Free Online Scientific Calculator, Trig, Log, Exponents',
  intro:
    'A full scientific calculator with trigonometric functions (sin, cos, tan and inverses), logarithms (log, ln), exponents (x², xⁿ, eˣ), square root, factorial (n!), constants (π, e), and degree/radian modes. Works in any browser, no installs, no sign-up.',
  steps: [
    { title: 'Enter the expression', body: 'Type or click buttons to build your expression. Standard order of operations applies (parentheses first, then exponents, then multiplication/division, then addition/subtraction).' },
    { title: 'Switch degree/radian for trig', body: 'For sin/cos/tan, the calculator defaults to degrees. Click "Rad" to switch to radians (used in calculus and physics). Make sure you\'re in the right mode, sin(30°) ≠ sin(30 rad).' },
    { title: 'Press equals', body: 'Hit the = button or press Enter to evaluate. The result displays with up to 12 significant figures. Press it again to reuse the result in a new expression.' },
  ],
  useCases: [
    { title: 'Physics homework, trig and exponentials', body: 'Calculating velocity components, projectile motion, oscillations? You need sin, cos, tan plus the right unit (radians for calculus-based physics; degrees for engineering).' },
    { title: 'Chemistry, pH and pKa calculations', body: 'pH = -log[H⁺]. The log function and inverse log (10ˣ) handle pH, pKa, and equilibrium calculations on the fly.' },
    { title: 'Algebra II / Pre-calc', body: 'Logarithm rules, exponential growth/decay, factorial in combinations and permutations, all the buttons are here.' },
    { title: 'Statistics, combinations and permutations', body: 'C(n,r) = n!/(r!(n-r)!). Use the factorial (!) button to crunch combinations and permutations without installing a stats package.' },
    { title: 'Engineering, quick unit conversions', body: 'Pair this with our unit converter (linked below) for engineering: calculate the value here, convert units there.' },
    { title: 'Math course quick checks', body: 'Doing a problem set by hand? Use the calculator to verify each answer. Faster than firing up Wolfram Alpha for routine arithmetic.' },
  ],
  faqs: [
    { question: 'Is this calculator free?', answer: 'Yes, completely free, no sign-up, runs in your browser.' },
    { question: 'How do I switch between degrees and radians?', answer: 'Click the Deg/Rad toggle near the top. Degrees for most geometry and engineering work; radians for calculus and physics.' },
    { question: 'How do I calculate inverse trig (arcsin, arccos, arctan)?', answer: 'Use sin⁻¹, cos⁻¹, tan⁻¹ buttons. Output respects your current degree/radian mode.' },
    { question: 'What\'s the difference between log and ln?', answer: 'log = base 10. ln = natural log (base e ≈ 2.718). For chemistry pH, use log. For calculus and continuous growth, use ln.' },
    { question: 'How do I compute eˣ?', answer: 'Use the eˣ button (or shift+ln, depending on layout). For e itself, type "e", most calculators have an e constant button.' },
    { question: 'What\'s the maximum number it can handle?', answer: 'JavaScript IEEE 754 doubles, max ~1.8 × 10³⁰⁸. Beyond that you get Infinity. Sufficient for any high school or undergraduate work.' },
    { question: 'Does it support keyboard shortcuts?', answer: 'Yes, number keys for digits, +/-/*//for operators, Enter for equals, Backspace to delete the last character, Escape to clear.' },
    { question: 'Can I see my calculation history?', answer: 'No persistent history, each calculation displays the current expression and result. For homework, copy each result down as you go.' },
    { question: 'How do I compute square root or cube root?', answer: 'Square root has its own button (√). For cube root, use x^(1/3): type 27, then x^, then 1/3, then equals.' },
    { question: 'Can I use it for matrix or graphing?', answer: 'No, this is a scientific calculator, not a graphing or matrix calculator. For matrices try Wolfram Alpha; for graphing try Desmos.' },
  ],
  related: [TOOL_LINKS.conv, TOOL_LINKS.gpa, TOOL_LINKS.pomodoro, TOOL_LINKS.outline, TOOL_LINKS.thesisGen, TOOL_LINKS.flashcards],
  mistakes: [
    { title: 'Wrong angle mode', body: 'sin(30) returns 0.5 in degrees but -0.988 in radians. Always check the Deg/Rad indicator before computing trig functions.' },
    { title: 'Order of operations confusion', body: '2 + 3 × 4 = 14, not 20. Parentheses → exponents → multiply/divide → add/subtract (PEMDAS). The calculator handles it correctly; verify your input matches your intent.' },
    { title: 'Mixing log and ln', body: 'log = base 10. ln = base e. log(100) = 2; ln(100) ≈ 4.6. Wrong button = wrong answer in chemistry pH calculations.' },
    { title: 'Forgetting the parenthesis on exponents', body: '2^1/2 = 0.5 (because the calculator reads it as 2^1 then ÷2). For square root via exponent, type 2^(1/2) = 1.414.' },
    { title: 'Trusting precision past the input', body: 'If you measured a length to 3 significant figures, your calculator answer to 12 decimals is false precision. Round results to match your input precision.' },
  ],
  examples: [
    { label: 'Quadratic formula', before: 'Solve x² + 5x + 6 = 0', after: 'x = (-5 ± √(25 - 24)) / 2 = (-5 ± 1) / 2 → x = -2 or x = -3', explanation: 'Use the calculator step-by-step: compute discriminant (b² - 4ac), take square root, plug into (-b ± √disc) / 2a.' },
    { label: 'pH from concentration', before: '[H⁺] = 1.5 × 10⁻⁴ M', after: 'pH = -log(1.5e-4) = 3.82', explanation: 'pH uses base-10 log. Type your concentration, hit log button, negate the result.' },
    { label: 'Compound interest', before: '$1000 at 5% APR for 10 years, compounded monthly', after: 'A = 1000 × (1 + 0.05/12)^(12×10) = $1,647.01', explanation: 'Use parentheses to enforce order: A = P × (1 + r/n)^(n×t). Calculator handles the exponent on a parenthesized expression.' },
  ],
  glossary: [
    { term: 'Trigonometry', definition: 'Branch of math dealing with angles. Sin, cos, tan and inverses are the core functions.' },
    { term: 'Logarithm', definition: 'Inverse of an exponential. log₁₀(1000) = 3 because 10³ = 1000. ln is base e.' },
    { term: 'Radian', definition: 'Angle unit where π radians = 180°. Used in calculus and physics. 1 rad ≈ 57.3°.' },
    { term: 'Factorial', definition: 'n! = n × (n-1) × ... × 1. 5! = 120. Used in combinations, permutations, and Taylor series.' },
    { term: 'Exponent', definition: 'Power to which a base is raised. 2³ = 8 (2 to the power 3). Calculator uses ^ or x^y button.' },
    { term: 'Order of operations (PEMDAS)', definition: 'Parentheses, Exponents, Multiplication/Division, Addition/Subtraction. Standard rule for evaluating expressions.' },
    { term: 'Significant figures', definition: 'Digits that carry meaningful precision. Round results to match the precision of your inputs.' },
  ],
};

/* ─── UNIT CONVERTER ────────────────────────────────────────────── */
export const converterSeo: ToolSeoConfig = {
  heading: 'Free Unit Converter, Length, Weight, Temperature, Volume, Time',
  intro:
    'Convert between metric and imperial units across length, weight, temperature, volume, area, time, speed, and energy. Pick a category, enter a value, get every common unit at once. No sign-up, instant conversion as you type.',
  steps: [
    { title: 'Pick a category', body: 'Length, weight, temperature, volume, area, time, speed, or energy. Each category has its own preset list of units (length: km, m, cm, mm, in, ft, yd, mi, etc.).' },
    { title: 'Enter your value', body: 'Type a number in any unit field. The other fields update instantly to show the equivalent in every other unit in the category.' },
    { title: 'Copy the conversion', body: 'Click any field to select; copy the value out for use elsewhere. The converter holds your value as long as the tab is open.' },
  ],
  useCases: [
    { title: 'Cooking, converting metric recipes to imperial', body: 'European cookbooks use grams and millilitres; US recipes use cups and tablespoons. Convert 250g flour to cups (≈2) before you start.' },
    { title: 'Travel, kilometres to miles', body: 'European road trips, UK driving, distance estimates for marathons or hikes. 100 km ≈ 62 miles; 5 km ≈ 3.1 miles (a 5K run).' },
    { title: 'Science homework, m/s to mph', body: 'Physics problems often state speeds in m/s; intuition is in mph. 30 m/s ≈ 67 mph (roughly highway speed).' },
    { title: 'Cooking temperature, Celsius to Fahrenheit', body: '180°C = 356°F (medium oven). 200°C = 392°F (hot oven for pizza). Common gotcha: oven temperatures don\'t scale linearly to "feels like", bake at the right unit, not the rough mental conversion.' },
    { title: 'Engineering, feet/yards to meters', body: 'Construction specs in the US are still imperial; international engineering is metric. Quick converter saves you from miscalculating beam lengths.' },
    { title: 'Fitness, pounds to kilograms', body: 'Most US gyms use plates marked in pounds; most workout apps default to kilograms. 45 lb ≈ 20.4 kg (the standard Olympic plate).' },
  ],
  faqs: [
    { question: 'What units does the converter support?', answer: '8 categories: length (mm to mi), weight (g to ton), temperature (°C, °F, K), volume (mL to gal), area (m² to acre), time (sec to year), speed (m/s, km/h, mph, knots), energy (J to kcal).' },
    { question: 'Does it support imperial and metric?', answer: 'Yes, both side by side in every category. No need to switch a unit-system setting.' },
    { question: 'How accurate is it?', answer: 'To 6 significant figures, which is overkill for almost all practical purposes. Conversions use exact NIST-published constants.' },
    { question: 'Why is there both gallon and US gallon?', answer: 'US gallon = 3.785 L. UK (imperial) gallon = 4.546 L. Different units despite the same name. The converter shows both.' },
    { question: 'How do I convert between Fahrenheit and Celsius?', answer: '°C = (°F − 32) × 5/9. °F = (°C × 9/5) + 32. The converter handles this automatically, just type in either field.' },
    { question: 'Does it handle scientific notation?', answer: 'Yes, type "1.5e3" or "1500", both work. Output uses scientific notation for very large or very small numbers (≥10⁶ or ≤10⁻⁴).' },
    { question: 'Can I add custom units?', answer: 'No, only the preset units in each category. For obscure conversions (parsecs, cubits, slugs), search a specialist converter.' },
    { question: 'Is my data uploaded anywhere?', answer: 'No, all conversion math runs in your browser.' },
    { question: 'How do I convert km/h to mph?', answer: 'Speed category, type into km/h field, read mph field. 100 km/h = 62.14 mph.' },
    { question: 'Why doesn\'t pressure or torque show up?', answer: 'Niche units omitted to keep the UI scannable. We\'ll add pressure and torque if there\'s demand, let us know via the contact form.' },
  ],
  related: [TOOL_LINKS.calc, TOOL_LINKS.gpa, TOOL_LINKS.pomodoro, TOOL_LINKS.outline, TOOL_LINKS.summarizer, TOOL_LINKS.flashcards],
  accent: '#1CB0F6',
  mistakes: [
    { title: 'Confusing weight and mass', body: 'Pounds and kilograms aren\'t the same thing, pound is a force unit, kilogram is mass. The everyday conversion (1 kg = 2.2 lb) is technically force vs mass at Earth gravity. On the moon, your kilograms stay the same but your pounds drop.' },
    { title: 'Forgetting US gallon ≠ UK gallon', body: 'US gallon = 3.785 L. UK (imperial) gallon = 4.546 L. Recipes and fuel economy figures often don\'t specify which, check by context (US recipes use cups; UK use ounces by weight).' },
    { title: 'Linear conversion of temperature', body: '°C → °F isn\'t × 1.8, it\'s ×1.8 + 32. Most students try to scale temperature linearly and miss the +32 offset. 0°C = 32°F, not 0°F. The calculator gets it right; doing it in your head usually doesn\'t.' },
    { title: 'Using volume for weight in cooking', body: '1 cup of flour ≠ 1 cup of sugar by weight. Volume conversions don\'t translate to weight conversions. For baking precision, weigh ingredients in grams.' },
    { title: 'Mixing speed units', body: 'm/s vs km/h vs mph, easy to confuse. Highway speed is 100 km/h ≈ 28 m/s ≈ 62 mph. Always specify which unit; physics problems often surprise students by switching mid-problem.' },
  ],
  examples: [
    { label: 'Cooking, recipe conversion', before: '500 grams of flour', after: '4 cups (US), but weighing is more accurate', explanation: 'Volume measures vary by how you scoop and pack. 500g of all-purpose flour is roughly 4 cups loose, 3.5 cups packed. Stick to weight when accuracy matters.' },
    { label: 'Travel, running pace', before: 'Treadmill says 8 mph', after: '12.87 km/h, or 4:39 per km', explanation: '8 mph is roughly a 7:30 mile, marathon-PB pace for many runners. Same speed in km is 12.87 km/h, or 4:39/km.' },
    { label: 'Physics, common units', before: '20 m/s', after: '72 km/h, or 44.74 mph, or 38.88 knots', explanation: '20 m/s is highway-fast (about 70 km/h). When physics problems use SI units (m/s) but you think in mph, the converter saves time.' },
  ],
  glossary: [
    { term: 'SI units', definition: 'International System of Units (metric). Length: meter. Mass: kilogram. Time: second. Used in science worldwide.' },
    { term: 'Imperial units', definition: 'British/US system. Length: inch/foot/yard/mile. Mass: ounce/pound. Used in US everyday measures and some UK contexts.' },
    { term: 'Conversion factor', definition: 'A multiplier that converts between units. 1 mile = 1.609 km is a conversion factor.' },
    { term: 'Celsius (°C)', definition: 'Metric temperature scale. Water freezes at 0°C, boils at 100°C at sea level.' },
    { term: 'Fahrenheit (°F)', definition: 'US temperature scale. Water freezes at 32°F, boils at 212°F. °F = (°C × 9/5) + 32.' },
    { term: 'Kelvin (K)', definition: 'Scientific temperature scale, no offset. K = °C + 273.15. Absolute zero = 0 K.' },
    { term: 'Knot', definition: 'Nautical speed unit. 1 knot = 1.852 km/h. Used by ships and aircraft.' },
  ],
};

/* ─── AI SUMMARIZER ─────────────────────────────────────────────── */
export const summarizerSeo: ToolSeoConfig = {
  heading: 'AI Summarizer, Condense Papers, Articles, and Lecture Notes',
  intro:
    'Paste a long article, research paper, or set of lecture notes and the AI summarizer condenses it into bullet points, a paragraph, a TL;DR, or a detailed structured summary. Free first summary; Pro unlocks unlimited use and longer input lengths.',
  steps: [
    { title: 'Paste your text', body: 'Drop in up to 5,000 words on the free plan, or 15,000 on Pro. Articles, research papers, lecture notes, book chapters, anything in plain text.' },
    { title: 'Pick a summary style', body: 'Bullet (key points only), Paragraph (flowing prose), TL;DR (1-2 sentence essence), or Detailed (multi-paragraph structured summary with section headings).' },
    { title: 'Pick a length', body: 'Short (2-3 sentences/3 bullets), Medium (5-8 bullets/1 paragraph), Long (10+ bullets/multi-paragraph). Longer input = longer summary by default.' },
    { title: 'Read and refine', body: 'Read the summary, copy it, paste into your study notes. If it missed a key point, regenerate, AI summaries are non-deterministic; the same input produces slightly different outputs each time.' },
  ],
  useCases: [
    { title: 'Lit review, summarizing 30 papers fast', body: 'Drop each paper\'s abstract+intro+conclusion in. Get bullet-point summaries you can scan in 10 minutes instead of reading each in full.' },
    { title: 'Lecture catch-up after missing class', body: 'Get the lecture transcript or notes from a classmate, summarize, scan in 5 minutes. You won\'t learn it as deeply as attending, but you\'ll have enough to follow next class.' },
    { title: 'Book chapter summaries for class prep', body: 'Reading 80 pages by Tuesday? Skim, then run a few sections through the summarizer to verify what you missed. Don\'t use it as a replacement for the reading itself.' },
    { title: 'Long blog post or article TL;DRs', body: 'Decision: is this 10,000-word article worth reading in full? Run the TL;DR mode first; if the summary interests you, go back and read.' },
    { title: 'Generating talking points from a research paper', body: 'For a 5-minute presentation, you need 3-4 key points. Detailed summary mode breaks the paper into sections; pick one bullet from each.' },
  ],
  faqs: [
    { question: 'Is the summarizer free?', answer: 'You get one free summary per session on the free plan. Unlimited summaries + 15,000-word inputs are on Pro.' },
    { question: 'How accurate is the summary?', answer: 'AI summaries are usually accurate on the main thesis and key points. They occasionally miss subtleties or miscategorize relative importance. Always cross-reference with the original for anything you\'re going to cite.' },
    { question: 'Will it work for technical or scientific papers?', answer: 'Yes, the model handles most undergrad and graduate-level texts well. Heavy math notation may not summarize cleanly; the model focuses on the prose around equations.' },
    { question: 'Can I summarize a PDF or Word document?', answer: 'Paste the text in. To extract from a PDF, open the file, select all (Cmd/Ctrl+A), copy, paste here. .docx works the same.' },
    { question: 'How long can my input be?', answer: '5,000 words on free, 15,000 words on Pro. Longer than 15,000? Split into sections.' },
    { question: 'What\'s the difference between TL;DR and Bullet summary?', answer: 'TL;DR is 1-2 sentences capturing the essence. Bullet is 5-8 key points. TL;DR for "should I read this?"; bullet for "what does this say?".' },
    { question: 'Is my text private?', answer: 'Text is sent to our servers for processing but isn\'t stored or used for training. Treated like an API call, request, response, gone.' },
    { question: 'Can I summarize non-English text?', answer: 'Yes for major languages (Spanish, French, German, Mandarin, Japanese). Quality drops for less-common languages.' },
    { question: 'Will it cite the source?', answer: 'No, the summarizer doesn\'t output citations. For source-aware research, use our paid Citation Finder, which surfaces sources with formatted citations.' },
    { question: 'Can I use the summary in my essay?', answer: 'Use it for understanding, not as direct text. Pasting an AI-generated summary into your essay risks plagiarism flags and academic-integrity issues. Read, understand, then write your own version.' },
  ],
  related: [TOOL_LINKS.analyze, TOOL_LINKS.thesisGen, TOOL_LINKS.outline, TOOL_LINKS.citationGenerator, TOOL_LINKS.quizGen, TOOL_LINKS.flashcards],
  mistakes: [
    { title: 'Pasting AI summaries into your essay', body: 'The summary is for understanding, not for direct copy-paste. Your professor\'s AI detector will flag it. Read the summary, then write your own version in your own voice with citation.' },
    { title: 'Trusting summaries of conflicting sources', body: 'AI summaries flatten nuance. If your source argues "X is partially true under condition Y", the summary may say "X is true". Always check the summary against the original on critical claims.' },
    { title: 'Summarizing too much at once', body: 'Pasting a 50-page document and asking for 5 bullet points loses too much detail. Summarize section by section, then summarize the section summaries.' },
    { title: 'Skipping the source check', body: 'If a summary says "the study found X", verify "X" exists in the original before citing it. AI sometimes invents specific claims (called "hallucinations").' },
    { title: 'Using bullet summaries when prose is needed', body: 'Bullet summaries are great for understanding, weak for writing. If you\'re summarizing for an essay, use the paragraph mode so the prose can flow into your draft.' },
  ],
  examples: [
    { label: 'Bullet vs paragraph summary', before: 'Style: Bullet (for review)', after: 'Style: Paragraph (for embedding in essay draft)', explanation: 'For reading and understanding, bullet is faster. For drafting an essay where the summary feeds into your prose, paragraph is more useful. Pick by purpose.' },
    { label: 'Length, when to use each', before: 'Short (TL;DR): 1-2 sentences', after: 'Medium: 5-8 bullets. Long: structured multi-paragraph.', explanation: 'TL;DR for "should I read this?". Medium for review notes. Long for replacing reading entirely (use cautiously, you lose nuance).' },
  ],
  glossary: [
    { term: 'Extractive summary', definition: 'Pulls direct sentences from the source. Faithful to the original but can read disjointed.' },
    { term: 'Abstractive summary', definition: 'Generates new sentences capturing the meaning. Reads more naturally but can introduce errors. Most modern AI summaries are abstractive.' },
    { term: 'TL;DR', definition: '"Too Long; Didn\'t Read". Internet shorthand for a 1-2 sentence executive summary at the top of long content.' },
    { term: 'Hallucination', definition: 'When AI invents facts not present in the source. Always verify specific claims against the original.' },
    { term: 'Compression ratio', definition: 'Summary length ÷ original length. A 1,000-word article summarized to 100 words = 10:1 compression.' },
    { term: 'Lossy summarization', definition: 'All summaries are lossy, information is removed. The art is removing the right things.' },
  ],
};

/* ─── AI QUIZ GENERATOR ─────────────────────────────────────────── */
export const quizGenSeo: ToolSeoConfig = {
  heading: 'AI Quiz Generator, Turn Notes Into MCQ, T/F, and Fill-in Quizzes',
  intro:
    'Paste your lecture notes, study guide, or any text and the quiz generator builds multiple-choice, true/false, and fill-in-the-blank questions in seconds. Pick how many questions you want; pick the difficulty. Free to start, no sign-up needed for the first quiz.',
  steps: [
    { title: 'Paste your study material', body: 'Lecture notes, textbook chapter, study guide, anything in text form. Longer is fine, the generator pulls questions from across the full input.' },
    { title: 'Pick question types and count', body: 'Multiple choice (with 3-4 distractors), true/false, fill-in-the-blank. Or mix all three. 10-20 questions is the sweet spot for a study session; 30+ for full exam prep.' },
    { title: 'Set difficulty', body: 'Easy = surface recall ("What year was X?"); Medium = comprehension ("Why did X happen?"); Hard = application ("Given X, predict Y"). Mix levels for thorough prep.' },
    { title: 'Take the quiz', body: 'Answer each question; the generator scores you and shows you which ones you got wrong with the correct answer + explanation. Re-quiz on missed questions to drill.' },
  ],
  useCases: [
    { title: 'Self-quizzing for a final exam', body: 'Paste 4 weeks of lecture notes, generate 30 questions, take the quiz. Identifies exactly what you don\'t know, focus revision there, not on stuff you already know.' },
    { title: 'Active recall study sessions', body: 'Active recall (testing yourself) outperforms passive review (rereading notes) by 50%+ on retention. The quiz generator turns any text into an active-recall session in seconds.' },
    { title: 'Studying with a partner, quiz-each-other format', body: 'Generate one quiz, both partners take it independently, compare answers, debate the ones you disagree on. Spaced-repetition + social accountability.' },
    { title: 'Reviewing a textbook chapter', body: 'After reading a chapter, generate a 15-question quiz on it. Tests whether you actually understood it, scoring under 70% means re-read.' },
    { title: 'Teacher / tutor, assessing student understanding', body: 'Paste the lesson plan, generate diagnostic quiz, give to students at end of class. Faster than writing questions by hand.' },
    { title: 'Quizlet alternative, without flashcard fatigue', body: 'Quizlet flashcards don\'t test you actively unless you use Test mode. AI Quiz generator is closer to actual exam questions and less rote.' },
  ],
  faqs: [
    { question: 'Is the quiz generator free?', answer: 'First quiz is free without sign-up. After that, sign up for a free account to keep generating. Pro unlocks unlimited quizzes + saves them to your library.' },
    { question: 'What question types are supported?', answer: 'Multiple choice (with 3-4 distractors), true/false, and fill-in-the-blank. Short-answer questions are coming.' },
    { question: 'How accurate are the quiz questions?', answer: 'Question accuracy is high, the AI pulls factual content from your input. Answer accuracy can occasionally be wrong if the input is ambiguous. Always cross-check important answers against your original source.' },
    { question: 'Can I edit a generated quiz?', answer: 'On Pro, yes, edit questions, swap distractors, change correct answers. Free plan generates and lets you take, but no editing.' },
    { question: 'How many questions can I generate at once?', answer: 'Up to 30 questions per quiz on free, 50 on Pro.' },
    { question: 'Does it work for math or science?', answer: 'Yes, the AI handles formulas, definitions, and conceptual questions in math, biology, chemistry, physics. Heavy notation (integrals, matrix algebra) may not render perfectly in MCQ format; better to paste the conceptual material rather than the math itself.' },
    { question: 'Can I save my quiz to retake later?', answer: 'On Pro, yes, quizzes save to your library. Free plan: one quiz per session.' },
    { question: 'Is this a Quizlet alternative?', answer: 'Closer to a Quizlet test-mode replacement than a flashcard replacement. For flashcards specifically, use our flashcard maker (linked below).' },
    { question: 'Does it cite sources?', answer: 'No, the quiz pulls questions from your pasted text only. It doesn\'t add external sources. Cite from your original source if you use a question in a study group.' },
    { question: 'Can I export to Anki, Quizlet, or another app?', answer: 'On Pro, export to CSV which Anki and Quizlet both accept.' },
  ],
  related: [TOOL_LINKS.flashcards, TOOL_LINKS.summarizer, TOOL_LINKS.outline, TOOL_LINKS.thesisGen, TOOL_LINKS.analyze, TOOL_LINKS.citationGenerator],
  accent: '#FF9600',
  mistakes: [
    { title: 'Quizzing only on facts you already know', body: 'Generating a quiz from material you\'ve mastered feels good but doesn\'t add learning. Generate from material that\'s still murky for you.' },
    { title: 'Treating wrong answers as failures', body: 'Wrong answers reveal exactly what to study. The whole point of quizzing is finding gaps. Celebrate wrong answers as cheap diagnostics.' },
    { title: 'Skipping the "explain why" step', body: 'After getting a question wrong, don\'t just read the right answer. Articulate WHY the wrong answer was wrong. That\'s where the deepest learning happens.' },
    { title: 'Only testing the day before the exam', body: 'Spaced quizzing (one round 7 days out, another 3 days out, another 1 day out) outperforms cramming the day before by 2-3x on retention.' },
    { title: 'Generating only easy questions', body: 'Easy questions test recognition, not understanding. Mix easy/medium/hard to find your real level.' },
  ],
  examples: [
    { label: 'Easy vs hard difficulty', before: 'Easy: "What year did WWII end?" → 1945', after: 'Hard: "How did the timing of D-Day affect the post-war division of Europe?"', explanation: 'Easy = factual recall. Hard = application and analysis. Hard questions reveal whether you understand or just memorized.' },
    { label: 'Multiple choice vs fill-in-blank', before: 'MCQ: "What is the capital of France?" (a) Paris (b) Lyon (c) Marseille', after: 'Fill-in: "The capital of France is _____."', explanation: 'MCQ tests recognition. Fill-in tests recall. Recall is harder and a better predictor of exam performance.' },
  ],
  glossary: [
    { term: 'Active recall', definition: 'Retrieving information from memory without prompts. The strongest learning technique. Quizzing is active recall.' },
    { term: 'Multiple choice (MCQ)', definition: 'Question with several listed answers. Tests recognition. Easier than recall.' },
    { term: 'Distractor', definition: 'Wrong answer in a multiple-choice question. Good distractors are plausible, they test whether you really know the answer or just guessed.' },
    { term: 'Fill-in-the-blank', definition: 'Question with a missing word or phrase. Tests recall, harder than recognition.' },
    { term: 'True/false', definition: 'Statement evaluated as true or false. Quick to answer, less depth than MCQ. Easy to game with 50/50 guessing.' },
    { term: 'Spaced repetition', definition: 'Reviewing material on increasing intervals (1d, 3d, 7d, 14d, etc.). Locks information into long-term memory.' },
    { term: 'Bloom\'s Taxonomy', definition: 'Hierarchy of cognitive skills: remember → understand → apply → analyze → evaluate → create. Quiz difficulty maps to this hierarchy.' },
  ],
};

/* ─── FLASHCARDS ────────────────────────────────────────────────── */
export const flashcardsSeo: ToolSeoConfig = {
  heading: 'Free Flashcard Maker, Build Custom Decks or Generate from Notes',
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
    { title: 'Med school, drugs, anatomy, pathologies', body: 'Med school IS flashcards. Anki is the standard tool, but our generator turns your lecture notes into flashcards 10x faster than typing them yourself.' },
    { title: 'Memorizing dates, formulas, definitions', body: 'Anything with a clear front (question) and back (answer) is a flashcard candidate. Dates, formulas, definitions, theorem statements, vocabulary, capitals.' },
    { title: 'Studying with a partner, share decks', body: 'On Pro, share decks via link. Two people studying the same deck spaced 24 hours apart cement retention better than either solo.' },
    { title: 'Spaced repetition for long-term retention', body: 'Spaced repetition (reviewing on increasing intervals: 1 day, 3 days, 7 days, 14 days) is proven to lock material into long-term memory. Our scheduler handles the intervals.' },
    { title: 'Quizlet alternative without ads', body: 'Quizlet free has ads everywhere. WriteScholar free has none, the upgrade is unlimited deck count, not ad removal.' },
  ],
  faqs: [
    { question: 'Is the flashcard maker free?', answer: 'Yes, with limits. Free plan: 5 saved decks, manual creation only. Pro: unlimited decks, AI auto-generation from notes, cross-device sync, deck sharing.' },
    { question: 'How does AI deck generation work?', answer: 'Paste your lecture notes or textbook chapter. The AI identifies key concepts, definitions, dates, formulas, and turns them into Q/A flashcards. Output: ~20 cards per 1,000 words of input.' },
    { question: 'Are AI-generated flashcards accurate?', answer: 'Mostly, yes, accuracy is usually 90%+. Always review before studying, the AI occasionally creates a card with a wrong answer or a duplicate concept. Edit or delete those.' },
    { question: 'Does spaced repetition work here?', answer: 'Pro plan includes spaced repetition scheduling, cards you struggle with come up more often; cards you nail come up less. Free plan has shuffle but no scheduling.' },
    { question: 'Can I add images to flashcards?', answer: 'On Pro, yes, drag in images for visual cues (anatomy diagrams, charts, structural formulas). Free plan is text-only.' },
    { question: 'Can I import from Quizlet or Anki?', answer: 'Yes on Pro, paste a CSV of front,back pairs. Quizlet and Anki both export to this format.' },
    { question: 'How is this different from Anki?', answer: 'Anki is desktop-first and intimidating to set up. Our flashcard maker is browser-first, instant, and the AI generation is built in. Anki has more advanced spaced-repetition algorithms; we have a simpler UX.' },
    { question: 'Will my decks sync across devices?', answer: 'On Pro, yes, log in on phone, tablet, laptop and your decks follow you. Free plan stores locally in your browser.' },
    { question: 'Can I share my decks?', answer: 'On Pro, share via link. Recipient can view and study; on Pro+, they can clone your deck into their library.' },
    { question: 'How many cards can a deck have?', answer: 'No hard limit. Most students keep decks under 200 cards for manageability, split larger topics into multiple decks.' },
  ],
  related: [TOOL_LINKS.quizGen, TOOL_LINKS.summarizer, TOOL_LINKS.outline, TOOL_LINKS.thesisGen, TOOL_LINKS.analyze, TOOL_LINKS.pomodoro],
  accent: '#A560E8',
  mistakes: [
    { title: 'Front side too long', body: 'A flashcard front should be ONE question, ONE concept. "Define osmosis and explain its role in cell membranes" = two cards, not one.' },
    { title: 'Just rewriting your notes as cards', body: 'Pasting your notes into card form doesn\'t help retention. Reformulate as questions YOU might be asked. "What is X?" → "When does X fail?".' },
    { title: 'Reviewing in order every time', body: 'Always shuffle. Reviewing in the same order = you\'re memorizing the order, not the cards.' },
    { title: 'Ignoring the cards you keep getting wrong', body: 'The wrong cards are the ones to study most, not skip. Move them to a "trouble" deck and drill them daily.' },
    { title: 'Making decks too big', body: 'A 500-card deck is unwieldy. Split into chapter-sized 50-card decks. Easier to track, easier to schedule.' },
  ],
  examples: [
    { label: 'Bad vs good front side', before: 'Photosynthesis (a multi-step process by which plants and some other organisms convert light energy, usually from the sun, into chemical energy that can be later released to fuel the organism\'s activities)', after: 'What is photosynthesis?', explanation: 'Front: just the question. Back: the answer (the long definition). Front side is for retrieval, not for cramming all the information.' },
    { label: 'Two cards, not one', before: 'What is osmosis and when is it active vs passive transport?', after: 'Card 1: What is osmosis? / Card 2: How does osmosis differ from active transport?', explanation: 'One concept per card. Compound questions break the active recall principle, you\'re really memorizing TWO answers as one chunk.' },
  ],
  glossary: [
    { term: 'Flashcard', definition: 'Two-sided study card. Front: question or term. Back: answer or definition. Active recall prompt.' },
    { term: 'Deck', definition: 'Collection of related flashcards on one topic. Usually 30-200 cards.' },
    { term: 'Spaced repetition (SRS)', definition: 'Reviewing cards on increasing intervals based on recall difficulty. Anki and similar apps schedule reviews automatically.' },
    { term: 'Active recall', definition: 'Retrieving information from memory unprompted. Flashcards are the canonical active recall tool.' },
    { term: 'Passive review', definition: 'Re-reading or highlighting notes without testing. Far less effective than active recall.' },
    { term: 'Cloze deletion', definition: 'Card format with a word or phrase blanked out. "The capital of France is [...]." Tests recall in context.' },
    { term: 'Atomic card', definition: 'A flashcard with one concept, not multiple. Easier to learn, easier to test.' },
  ],
};
