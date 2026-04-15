/**
 * Long-form sections (≈900–1,400 words each) to bring blog articles into the 2,500–3,000 word range.
 * Imported by BlogPostContent.tsx per slug.
 */
import React from 'react';

const p = 'mb-4 text-stone-600 dark:text-stone-400 leading-relaxed';
const h2 = 'text-xl font-bold text-stone-800 dark:text-stone-100 mt-8 mb-3';
const h3 = 'text-lg font-semibold text-stone-800 dark:text-stone-100 mt-6 mb-2';
const internalLink = 'text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 underline';
const faqQ = 'font-semibold text-stone-800 dark:text-stone-100 mt-4 mb-2';

type NavigateHandler = (page: string) => (e: React.MouseEvent) => void;

/** check-essay-with-ai-professor-style-feedback */
export const ExpandedCheckEssayAI: React.FC<{ handleNavigate: NavigateHandler }> = ({ handleNavigate }) => (
  <>
    <h2 className={h2}>A revision loop that actually improves your grade</h2>
    <p className={p}>
      Most students run one pass of feedback, tweak a few sentences, and resubmit. That is not revision. It is tinkering. A real revision loop means you treat feedback as a to-do list: you fix one category of problems at a time, re-run the analysis, and check whether the next layer of issues is smaller than the last. Start with thesis and argument, because nothing else matters if your claim is vague or your evidence does not support it. Then move to paragraph structure: one main idea per paragraph, clear topic sentences, transitions that show how each paragraph advances the thesis. Only after those higher-order concerns should you obsess over word-level polish. If you reverse that order, you risk perfecting sentences that belong to a paragraph your professor will still cross out.
    </p>
    <p className={p}>
      AI essay feedback shines when you use it iteratively. First run: read only the red and amber annotations. Ignore green until the second pass, or you will spend emotional energy celebrating while your conclusion still does not answer the prompt. Second run: compare rubric scores to your syllabus. If &quot;evidence&quot; is marked partial, search the draft for claims that lack an author, year, or page. Third run: read the green highlights and ask what pattern they share. Often your best writing clusters in one section; your job is to spread that standard across the whole paper. Tools that align with assignment rubrics make this triage faster because you are not guessing what your instructor weights most.
    </p>
    <p className={p}>
      Timeboxing helps. Give yourself thirty minutes for thesis and outline adjustments, forty-five for evidence and citations, thirty for transitions, then a final pass for tone and grammar. If you only have one hour total, spend forty minutes on argument and evidence and twenty on clarity. Professors rarely fail a paper for a few comma splices; they fail papers that do not argue, cite, or answer the question. Pair the analyzer with an <a href="/tools/essay-outline" onClick={handleNavigate('essay-outline')} className={internalLink}>outline</a> so you can see whether your sections match the assignment&apos;s required sections before you polish prose.
    </p>

    <h2 className={h2}>How to interpret &quot;strengths&quot; versus &quot;needs work&quot;</h2>
    <p className={p}>
      Strengths are not participation trophies. They signal what you should do more of: if your introduction is praised for clarity, study how you wrote that paragraph and try to replicate its structure elsewhere. If a piece of evidence is flagged as strong, ask whether you have that level of specificity in every body paragraph. Weaknesses are not personal attacks; they are predictions of where graders lose patience. &quot;Needs development&quot; usually means the reader cannot see how your claim follows from the previous sentence. &quot;Abrupt transition&quot; means you changed topics without a bridge. &quot;Tone&quot; comments often mean you sound informal, absolute, or vague in places where the discipline expects caution and precision.
    </p>
    <p className={p}>
      When feedback feels contradictory, slow down. Sometimes one paragraph is too conversational while another is appropriately formal; the fix is not to average them out but to raise the whole paper to the level of your best paragraph. If you are unsure which comment to trust, prioritize the comment tied to the rubric criterion worth the most points. If your institution cares about academic integrity, also prioritize any note about citation gaps or unsupported claims. Those are both ethical and grade-critical.
    </p>

    <h2 className={h2}>Combining AI feedback with humans</h2>
    <p className={p}>
      The best submissions usually combine machine speed with human judgment. Use AI feedback to catch structural and argumentative gaps before you book a tutoring appointment, so your human reader spends time on nuance instead of basics. Bring your rubric and the annotated draft to the writing center. Ask targeted questions: &quot;Does my counterargument belong in paragraph three or four?&quot; rather than &quot;Is this good?&quot; Peers are excellent for clarity. If a classmate cannot summarize your thesis in one sentence, your professor will struggle too. None of these replace you doing the writing; they improve the draft you still own.
    </p>
    <p className={p}>
      If your course allows instructor drafts or office hours, use those for assignment-specific questions AI cannot answer: whether a source counts as &quot;scholarly,&quot; whether your case study fits the prompt, or how much theory your professor expects. AI tools can suggest that your analysis is thin; only your instructor can tell you which theorist they wanted you to engage with.
    </p>

    <h2 className={h2}>Academic integrity and responsible use</h2>
    <p className={p}>
      Feedback tools should analyze what you wrote, not replace your voice. Pasting prompts into a generator and submitting the output is both an integrity violation and a missed learning opportunity. The ethical workflow is: you draft, you get feedback, you rewrite in your own words. If your school has an AI policy, follow it closely. When in doubt, disclose tool use to your instructor if your syllabus asks for transparency. Using analysis to find weak reasoning is different from using generation to fill pages; keep that line clear and you stay on the right side of most policies.
    </p>

    <h3 className={h3}>More questions students ask</h3>
    <p className={faqQ}>Should I run analysis before or after grammar checking?</p>
    <p className={p}>
      Run structure and argument feedback first. Fixing commas in a paragraph you later delete wastes time. After you are happy with the argument, run a <a href="/tools/grammar-checker" onClick={handleNavigate('grammar-checker')} className={internalLink}>grammar pass</a> or the built-in style checks, then a final full analysis if your tool allows it.
    </p>
    <p className={faqQ}>How many revision cycles are enough?</p>
    <p className={p}>
      Stop when rubric scores plateau or when the remaining comments are stylistic nitpicks. If you have time, sleep on the draft and read it once cold before submitting. Fresh eyes catch awkward phrasing that tools and tired eyes miss.
    </p>

    <h2 className={h2}>A one-week timeline when the due date is close</h2>
    <p className={p}>
      Seven days out, focus only on thesis, outline, and evidence gaps, not commas. Run a full analysis, list every red and amber item, and sort by rubric weight. Five days out, rewrite the weakest body paragraph entirely rather than patching sentences. Three days out, tighten transitions and check citations against your style guide. Two days out, read the introduction and conclusion side by side: do they answer the same question with the same terms? One day out, read aloud slowly or print; your eye skips errors on screen. The morning of submission, make only emergency fixes, no structural experiments.
    </p>
    <p className={p}>
      If your course requires a cover sheet, abstract, or appendix, build those after the argument is stable. Formatting last reduces thrash when page counts shift. Export to PDF and reopen it to catch font and margin issues your word processor hid. Name the file clearly so you do not upload the wrong draft, an embarrassingly common error during busy weeks.
    </p>

    <h2 className={h2}>What to do when feedback conflicts with your gut</h2>
    <p className={p}>
      Sometimes you disagree with a comment. Pause before dismissing it: ask whether a skeptical reader, your professor, might agree with the tool. If yes, revise. If no, add a footnote or tighten wording so your intent survives skeptical reading. Occasionally the tool is wrong about discipline-specific moves; keep a short list of those cases so you do not waste time fighting the same false positive twice.
    </p>
    <p className={p}>
      Peer readers remain valuable for humor, voice, and context AI cannot access. Use them for the human dimensions; use analysis for scalable structure and argument coverage.
    </p>

    <h2 className={h2}>What to upload alongside long papers</h2>
    <p className={p}>
      If your course allows optional appendices, use them for raw data, extended tables, or survey instruments, never for hiding required analysis in the main word count. Label everything clearly and cite appendices in-text so graders actually read them.
    </p>
  </>
);

/** block-websites-until-you-study-earn-screen-time */
export const ExpandedFocusBlocker: React.FC<{ handleNavigate: NavigateHandler }> = ({ handleNavigate }) => (
  <>
    <h2 className={h2}>Why &quot;just use willpower&quot; fails under stress</h2>
    <p className={p}>
      Willpower is a limited resource. During midterms, when you are sleep-deprived and juggling deadlines, decision quality drops. That is when autoplay, notifications, and infinite feeds win. Systems that rely on you making the &quot;right choice&quot; every time ignore cognitive science: friction shapes behavior more reliably than intention. Blocking distracting sites until you complete a short retrieval task adds friction to procrastination and makes study the path back to distraction-heavy sites. You still choose to open YouTube, but the path goes through five quiz questions from your notes first. Over weeks, that changes what feels normal.
    </p>
    <p className={p}>
      Earned screen time also reduces guilt spirals. Many students doom-scroll and then feel ashamed, which drains energy for the next study block. When breaks are gated behind a quiz you passed, the narrative shifts: you earned the break. That matters psychologically. You are not &quot;bad at discipline&quot;; you are using a structure that matches how attention actually works.
    </p>

    <h2 className={h2}>Designing a block list that matches your real triggers</h2>
    <p className={p}>
      Start with three to five sites that reliably steal more than ten minutes when you are tired. For some people it is video; for others it is forums or messaging. Add those first. Avoid blocking tools you need for school unless you can whitelist URLs. Many students need Google Docs, Canvas, or email open. If you block too broadly, you will disable the whole system. If you block too narrowly, you will route procrastination to a site you forgot to list. Review your block list weekly during busy periods; new rabbit holes appear as your habits shift.
    </p>
    <p className={p}>
      Pair blocking with a clear study target. &quot;Study biology&quot; is vague. &quot;Review lectures 4–6 and answer twenty quiz questions on enzymes&quot; is something a quiz gate can reinforce. The <a href="/tools/quiz-generator" onClick={handleNavigate('quiz-generator')} className={internalLink}>quiz generator</a> helps because your unlock quiz stays aligned with the chapter you are actually responsible for, not random trivia.
    </p>

    <h2 className={h2}>Unlock timers: how long is &quot;enough&quot;?</h2>
    <p className={p}>
      Short unlock windows (five to fifteen minutes) work well for quick mental breaks. Longer windows (thirty to sixty minutes) suit watching a lecture or a show episode. The failure mode is an all-day unlock &quot;because I earned it once.&quot; If you notice that pattern, shorten the timer until breaks feel proportionate to study time. Some students use a hard rule: no entertainment sites until two Pomodoro cycles are complete, then a fifteen-minute unlock. Experiment; the right setting is the one you actually follow.
    </p>

    <h2 className={h2}>When blocking is not enough</h2>
    <p className={p}>
      If you procrastinate by cleaning, messaging, or offline tasks, site blockers will not solve everything. Combine digital friction with environment design: phone in another room, study playlist without lyrics, and a visible clock. If anxiety drives avoidance, smaller study goals and instructor communication often help more than another app. Blocking is one layer in a larger system.
    </p>
    <p className={p}>
      For deep work blocks, consider pairing <a href="/focus-mode" onClick={handleNavigate('focus-mode')} className={internalLink}>Focus Mode</a> with <a href="/tools/pomodoro-timer" onClick={handleNavigate('pomodoro-timer')} className={internalLink}>timed study sessions</a> so your brain expects a defined end point. Predictability reduces the urge to &quot;just check&quot; social media mid-session.
    </p>

    <h3 className={h3}>Extra FAQ</h3>
    <p className={faqQ}>What if I keep disabling the extension?</p>
    <p className={p}>
      That is a signal the settings are too harsh or your study sessions are too long without real breaks. Lower the pass threshold temporarily, shorten unlock timers, or pick easier quiz material until the habit sticks. Sustainable beats heroic.
    </p>
    <p className={faqQ}>Can roommates or family respect the system?</p>
    <p className={p}>
      Share that you are using gated breaks during exam weeks. External accountability plus environmental cues reduces interruptions that push you toward stress-scrolling.
    </p>

    <h2 className={h2}>Accountability without shame</h2>
    <p className={p}>
      Pair Focus Mode with lightweight accountability: text a friend when you start a Pomodoro, text again when you finish. You are not reporting your moral worth, just reducing drift. Study Discord servers and library meetups work the same way; presence nudges you back when attention wanders. If you repeatedly disable blockers, treat that as data. Either your study sessions are too long without rest, your quiz difficulty is too high, or you need a different environment, library versus bedroom, rather than a sterner app.
    </p>
    <p className={p}>
      Parents and partners sometimes misunderstand blockers as punishment. Explain the earn-to-scroll model: you are training retrieval, not asking to be policed. If someone needs you during a block, use legitimate pause features rather than uninstalling. Communication prevents conflict that would otherwise send you straight back to stress-scrolling.
    </p>

    <h2 className={h2}>Seasonal adjustments</h2>
    <p className={p}>
      During finals, tighten unlock windows and shorten entertainment allowances. During breaks, loosen them so the tool does not feel like a prison. You want sustainable use across four years, not a heroic sprint. If you travel, update your block list for sites you use more on the road versus at your desk.
    </p>
    <p className={p}>
      Track correlation subjectively: on weeks you used the gate consistently, did you feel less behind? Did exam scores or sleep improve? Those outcomes justify keeping the system, even when willpower alone fails.
    </p>

    <h2 className={h2}>Complementary habits</h2>
    <p className={p}>
      Blockers work best alongside sleep, meals, and movement. Dehydration and low blood sugar mimic distraction. You will fight the tool when your body needs care. Keep water at your desk and schedule meals like you schedule study. Short walks between blocks reset attention without requiring a social media hit.
    </p>

    <h2 className={h2}>Designing unlock quizzes that feel fair</h2>
    <p className={p}>
      If quizzes are trivially easy, you will breeze through without learning; if they are impossibly hard, you will disable the tool. Aim for items you could answer after a genuine twenty-minute review, not cold recall of minutiae from week one. Mix question types: one definition, one application, one comparison. Rotate chapters so you are not always quizzing what you already love studying.
    </p>
    <p className={p}>
      Update question banks after each exam unit. Stale decks train you on material you will never see again while starving new chapters. Treat the quiz bank like a living document tied to your syllabus schedule.
    </p>

    <h2 className={h2}>Ethical use of friction</h2>
    <p className={p}>
      Friction should help future-you, not punish present-you for being human. If you find yourself angry at the tool daily, revisit design: fewer blocked sites, gentler pass thresholds, or shorter study intervals with more breaks. The system exists to protect deep work, not to become another source of shame.
    </p>
    <p className={p}>
      If you have attention differences or mental health conditions, pair digital tools with campus disability resources, accommodations and coaching can complement blockers when medication or therapy is part of your plan.
    </p>

    <h2 className={h2}>Measuring impact with simple metrics</h2>
    <p className={p}>
      Track weekly: hours of focused study, number of quiz unlocks, self-rated focus (1–5), and sleep hours. Weak correlations tell you to adjust. If unlocks rise but grades fall, your quizzes may be too easy relative to exams. If focus rises but mood crashes, add breaks or social time, rest is not the enemy of discipline.
    </p>
    <p className={p}>
      Avoid comparing your raw screen time to friends; compare progress on assignments and comprehension instead. Tools are means, not scores.
    </p>

    <h2 className={h2}>Integrating physical study spaces</h2>
    <p className={p}>
      Libraries and study halls add social accountability, people around you working reduce the urge to open entertainment tabs. Combine environmental cues with digital blockers: phone in bag, laptop with blocker enabled, headphones without lyrics for deep tasks.
    </p>
  </>
);

/** how-to-avoid-plagiarism */
export const ExpandedPlagiarism: React.FC<{ handleNavigate: NavigateHandler }> = ({ handleNavigate }) => (
  <>
    <h2 className={h2}>The difference between sloppy notes and intentional theft</h2>
    <p className={p}>
      Instructors distinguish careless omission from deliberate misrepresentation, but both can trigger academic integrity processes. Sloppy notes, where you paste a quote without quotation marks or lose the page number, produce papers that look plagiarized even when you did not mean to cheat. The fix is hygienic research habits: every time you touch a source, record author, year, title, and page in the same place you keep the quote or idea. When you outline, tag each bullet with a source ID. When you draft, never paste from PDFs directly into your paper without immediately adding quotation marks and a citation placeholder. Building that pipeline takes minutes per source and saves hours of panic later.
    </p>
    <p className={p}>
      Patchwriting, lightly editing someone else&apos;s sentences, is especially risky because plagiarism detectors and instructors recognize the pattern. If you cannot paraphrase without sticking close to the original, quote and cite instead. It is better to have a shorter paper with honest attribution than a longer paper that reads like a mosaic of other people&apos;s phrasing.
    </p>

    <h2 className={h2}>Group projects and shared documents</h2>
    <p className={p}>
      Collaboration policies vary. In some courses you may share research and outlines but write individual sections alone. In others, only one person touches the final prose. If you paste a teammate&apos;s paragraph into your section without marking it, you may be submitting their words as yours. Clarify expectations early, use comments in shared docs to show who wrote what, and keep a version history. If something goes wrong, that history protects honest students.
    </p>

    <h2 className={h2}>International students and multilingual writers</h2>
    <p className={p}>
      If you are writing in a second language, you may rely more heavily on templates or translation tools. That is legitimate support, but the final submission must still be your analysis and your syntactic choices. Many programs allow grammar help but not sentence-level generation; know your program&apos;s rules. When you use a translator, rewrite the output so it matches your voice and cite any ideas that came from sources you read in another language. Those ideas still need attribution in the language of your paper.
    </p>

    <h2 className={h2}>Building a pre-submission checklist</h2>
    <p className={p}>
      Before you upload, scan for orphan quotes (quotation marks with no author), orphan citations (parentheticals with no matching reference), and ideas that sound smarter than your usual voice. Those may be insufficiently paraphrased. Run your reference list against your style manual&apos;s rules for capitalization, italics, and retrieval dates for online sources. If your instructor requires a specific number of scholarly sources, verify each one meets their definition. Finally, if you used generative AI for brainstorming, confirm whether your syllabus requires a short methods statement. Transparency protects you when policies evolve.
    </p>
    <p className={p}>
      Citation tools help close the gap between &quot;I meant to cite that&quot; and &quot;I did cite that.&quot; Use a <a href="/tools/citation-generator" onClick={handleNavigate('citation-generator-tool')} className={internalLink}>citation generator</a> consistently rather than formatting by hand under deadline pressure. Consistency signals care and reduces accidental mismatch between in-text and reference entries.
    </p>

    <h3 className={h3}>More FAQ</h3>
    <p className={faqQ}>Is common knowledge ever exempt from citation?</p>
    <p className={p}>
      Yes, facts widely available in many sources (capital cities, basic historical dates) may not need a citation, but contested claims, specific statistics, and discipline-specific assertions almost always do. When unsure, cite.
    </p>
    <p className={faqQ}>How do I cite lecture slides or Canvas files?</p>
    <p className={p}>
      Treat them as personal communication or course materials per your style guide. APA, MLA, and Chicago each have patterns for course content; ask your instructor if they prefer a particular format for class slides.
    </p>

    <h2 className={h2}>If you are investigated: practical steps</h2>
    <p className={p}>
      Investigations vary by institution, but patterns are common. You may be asked to submit drafts, search history, or notes. Cooperate calmly; obstruction reads worse than honest mistakes. If you truly forgot a citation, explain your note-taking process and show earlier drafts with the citation partially added. If you used generative AI against policy, honesty with remorse usually lands better than denials contradicted by metadata. Seek your campus advocate or student conduct advisor if you are unsure what to sign or say.
    </p>
    <p className={p}>
      Prevention remains easier than defense. Keep time-stamped drafts, back up files in cloud folders with version history, and screenshot unusual generator outputs if you must prove what you did or did not paste into your paper.
    </p>

    <h2 className={h2}>Citation software and collaboration platforms</h2>
    <p className={p}>
      Reference managers help until someone merges conflicting libraries. Agree on one shared group library for team papers or thesis committees. Tag each entry with the course code so you do not insert the wrong style into the wrong document. When exporting, scan for duplicate entries, two slightly different copies of the same article cause reference-list bloat and mismatched in-text keys.
    </p>
    <p className={p}>
      Cloud writing tools make it easy to invite collaborators; they also make it easy to accidentally retain another author&apos;s paragraph. Before submission, run a final authorship check: highlight every paragraph and confirm the voice and sources match your section assignment.
    </p>

    <h2 className={h2}>Quotations, epigraphs, and images</h2>
    <p className={p}>
      Song lyrics, poems, and extended quotations may require permissions beyond fair use, especially if you publish online or in a thesis repository. When in doubt, ask your professor or library copyright office. Images need attribution, too, cite the creator, license, and source even when the essay is not &quot;about&quot; art.
    </p>
    <p className={p}>
      Translation doubles responsibility: cite the original work, the translator, and note that you are working through translation if you cannot read the source language. Misattributing a translated idea to the wrong edition is still a citation failure.
    </p>

    <h2 className={h2}>Building integrity habits as a career foundation</h2>
    <p className={p}>
      Employers expect honest reporting; graduate programs expect reproducible methods. The habits you build now, citing generously, separating your words from others&apos;, documenting uncertainty, carry into professional life. Plagiarism is not only a school rule; it is a trust violation that follows you. Start small: never paste without a source tag in your notes.
    </p>

    <h2 className={h2}>Reading strategies that reduce accidental copying</h2>
    <p className={p}>
      Read with your notes file open but empty of the article text. Summarize each section before looking back. If you must quote, type quotes manually rather than copying, typing forces slower processing and fewer accidental merges. Color-code your words versus source words in drafts if you are prone to patchwriting.
    </p>
    <p className={p}>
      When synthesizing multiple sources, sketch a matrix: source names on one axis, themes on the other, cells filled with brief notes in your own phrasing. That grid makes it obvious where you still need citations.
    </p>

    <h2 className={h2}>Understanding similarity scores</h2>
    <p className={p}>
      Plagiarism detectors report percentages that confuse students. High overlap with your own bibliography might mean over-quoting; high overlap with the web might mean insufficient paraphrase. There is no magic safe number, context matters. Use reports as maps to inspect lines, not as verdicts.
    </p>
  </>
);

/** how-to-study-effectively-complete-guide; add ~800 words (post already long) */
export const ExpandedStudyEffectively: React.FC<{ handleNavigate: NavigateHandler }> = ({ handleNavigate }) => (
  <>
    <h2 className={h2}>Exam weeks: prioritization when everything feels urgent</h2>
    <p className={p}>
      When multiple finals overlap, students often default to rereading everything equally. That spreads attention thin. A better approach is triage: list every assessment by date and weight, then rank topics within each course by difficulty and past performance. Spend your highest-energy blocks on the highest-weight exams and the concepts you have missed before. Use lower-energy time for flashcard maintenance or light review of material you already know. This feels uncomfortable because it means admitting some chapters will get less polish, but spreading twelve hours of shallow review across five courses often yields worse results than concentrating depth on the two courses where you are most at risk.
    </p>
    <p className={p}>
      Sleep is part of the strategy. All-nighters trade short-term recognition for long-term consolidation. If you must choose, sacrifice a marginal hour of rereading for an extra hour of sleep before a procedural or problem-solving exam. For memory-heavy courses, ending the night with a short self-test (active recall) beats rereading until your eyes blur.
    </p>

    <h2 className={h2}>Study groups: roles that actually help</h2>
    <p className={p}>
      Effective groups assign roles: one person explains a concept aloud, another prepares practice problems, a third checks answers against the textbook. Rotate roles so no one free-rides. The failure mode is passive attendance, sitting in a library with friends while everyone scrolls. If your group becomes social, switch to structured sessions: twenty-five minutes silent work, five minutes discussion, repeat. Tools that generate <a href="/tools/quiz-generator" onClick={handleNavigate('quiz-generator')} className={internalLink}>quizzes</a> from shared notes keep the session focused on retrieval rather than venting about the professor.
    </p>

    <h2 className={h2}>Motivation without toxic hustle culture</h2>
    <p className={p}>
      Sustainable studying acknowledges finite capacity. Build in recovery: walks, meals, and offline hobbies are not rewards for being done. They are part of maintaining focus during the week. If guilt drives you to study every waking hour, burnout follows and exams suffer. Pair ambitious goals with realistic daily targets you can hit even on bad days. Consistency beats spikes.
    </p>

    <h2 className={h2}>Mapping the full semester, not just the next exam</h2>
    <p className={p}>
      Print your syllabus calendar and mark every midterm, final, and large assignment. Work backward two weeks for each milestone and schedule light review sessions so you are not seeing material cold. Cumulative finals reward students who revisit old units once a week instead of once a month. A single spreadsheet with columns for course, topic, last reviewed date, and next review date takes twenty minutes to set up and saves dozens of panic hours.
    </p>
    <p className={p}>
      When professors publish practice exams, use them under timed conditions, not as open-book reading. The gap between your open-book score and timed score tells you how much is recognition versus recall. Close that gap with drills, not more highlighting.
    </p>

    <h2 className={h2}>When life interrupts the plan</h2>
    <p className={p}>
      Illness, work shifts, and family obligations happen. Build slack: one flex night per week with no scheduled study, reserved for catch-up or rest. If you miss multiple days, triage ruthlessly, protect the highest-weight assessments first. Inform instructors early when emergencies stack; many will help students who communicate professionally and rarely abuse extensions.
    </p>

    <h2 className={h2}>Active recall in STEM versus humanities</h2>
    <p className={p}>
      STEM courses often reward problem pattern recognition, drill variations until structure clicks. Humanities courses reward networked understanding, how themes connect across texts. Adjust your flashcards and quizzes accordingly: replace-only drills for formulas; compare-and-contrast prompts for themes. Neither is lazier; they match different knowledge structures.
    </p>
    <p className={p}>
      Language courses need daily micro-sessions; cramming vocabulary fails. Pair spaced repetition with speaking or writing practice so recall is productive, not just recognition of isolated words.
    </p>

    <h2 className={h2}>Using professor feedback on exams</h2>
    <p className={p}>
      When instructors return graded materials, mine them for patterns. Do you lose points on terminology, on skipping steps, on time management? Feed those into your next study plan. Students who treat returned exams as diagnostic data improve faster than those who glance at the grade and file them away.
    </p>

    <h2 className={h2}>Cognitive load and environment</h2>
    <p className={p}>
      Noise, poor lighting, and clutter tax working memory that could otherwise hold formulas or arguments. You do not need a minimalist aesthetic, just enough order that finding materials does not become its own task. Keep one bag with cables, adapters, and pens so library sessions start instantly.
    </p>
    <p className={p}>
      If you study with music, pick instrumental tracks at moderate volume; lyrics compete with verbal memory tasks.
    </p>

    <h2 className={h2}>From cramming to distributed practice: a realistic bridge</h2>
    <p className={p}>
      If you are currently a crammer, do not expect overnight change. Add one weekly review session for each course, even twenty minutes. Layer more over the semester. Small distributed slices beat heroic all-nighters because they respect how memory consolidates.
    </p>
  </>
);

/** ai-study-tools-flashcards-quizzes-crosswords; shorter add (~400–600 words) */
export const ExpandedAiStudyTools: React.FC<{ handleNavigate: NavigateHandler }> = ({ handleNavigate }) => (
  <>
    <h2 className={h2}>Choosing modalities: when flashcards beat quizzes</h2>
    <p className={p}>
      Flashcards excel for discrete facts: vocabulary, definitions, formulas, dates. Quizzes excel for application: multi-step problems, scenario questions, &quot;which concept explains…&quot; items. Crosswords and puzzles trade a bit of efficiency for engagement, useful when you cannot face another block of text but still want light retrieval. Rotate modalities so you do not mistake familiarity with one format for mastery across formats. If you only ever use flashcards, you may freeze on an exam that asks for synthesis instead of definition.
    </p>
    <p className={p}>
      Difficulty should ramp. Start with recognition-level items, move to recall without cues, then mixed review of older decks. Spaced repetition schedules matter more than total hours. Twenty minutes daily beats three hours once a week for most declarative memory. Tools that generate cards and questions from your own notes keep the content aligned with your professor&apos;s emphasis rather than generic banks that may omit half your syllabus.
    </p>

    <h2 className={h2}>Accessibility and mixed-ability study groups</h2>
    <p className={p}>
      Share materials in multiple formats when possible: text for some learners, spoken explanations for others. If someone in your group processes slowly, slow the quiz pace rather than excluding them, teaching is retrieval too. When AI generates questions, scan for bias or errors; models occasionally hallucinate facts. Treat generated items as drafts to verify against your textbook.
    </p>

    <h2 className={h2}>Integrating tools with coursework policies</h2>
    <p className={p}>
      Some instructors prohibit AI-generated quiz questions during take-home assessments. Others encourage practice. Read your syllabus. Using AI to study is different from using AI on the graded artifact. When allowed, link your practice sets to <a href="/library" onClick={handleNavigate('library')} className={internalLink}>saved materials</a> so you can revisit weak areas before the final.
    </p>

    <h2 className={h2}>Quality control on generated materials</h2>
    <p className={p}>
      AI can misread your source text and produce a plausible but wrong flashcard. Always spot-check definitions against the textbook, especially for formulas, dates, and proper nouns. For high-stakes exams, regenerate questions with different difficulty settings and merge the decks, variety exposes gaps a single pass missed.
    </p>
    <p className={p}>
      Crosswords and gamified modes are fun, but verify that every clue still maps to learning objectives. If clues drift into trivia, delete them. The best study games feel slightly effortful; if they feel effortless, you are probably recognizing, not recalling.
    </p>

    <h2 className={h2}>Measuring whether your study stack works</h2>
    <p className={p}>
      Track error rates on quizzes over time. Flat lines mean you need harder questions or new subtopics. Spiking misses on old chapters mean spaced repetition intervals are too long. Adjust weekly; a tool is only as good as the feedback loop you maintain around it.
    </p>
  </>
);

/** students-who-get-as-dont-work-harder */
export const ExpandedStraightAs: React.FC<{ handleNavigate: NavigateHandler }> = ({ handleNavigate }) => (
  <>
    <h2 className={h2}>Leverage: trading brute hours for better loops</h2>
    <p className={p}>
      High performers often study fewer raw hours than people think. They spend more cycles on feedback. They submit drafts earlier, read comments, adjust, and resubmit when policy allows. They ask what a rubric actually measures. They use office hours strategically with specific questions instead of showing up with &quot;I do not get the class.&quot; That leverage multiplies: ten hours with tight feedback loops routinely beats thirty hours of passive rereading without course correction.
    </p>
    <p className={p}>
      Leverage also applies to assignments. If a paper is worth forty percent, it deserves disproportionate scheduling relative to five-percent homework. Students chasing straight A&apos;s protect calendar blocks for high-weight work and automate or batch low-weight tasks. They do not treat all assignments as equal because their gradebook is not equal.
    </p>

    <h2 className={h2}>Metacognition: knowing what you do not know</h2>
    <p className={p}>
      Top students notice confusion early. They mark concepts that felt fuzzy during lecture and revisit them the same week, not the night before the exam. They use self-tests to calibrate: if they cannot explain a topic without notes, they file it as &quot;not yet learned.&quot; That honesty prevents the false confidence that comes from rereading fluent text.
    </p>
    <p className={p}>
      Journaling helps: after each week, write three bullet points of what was new and one question you still have. Bring those questions to discussion or office hours. The habit takes five minutes and prevents small gaps from compounding into exam panic.
    </p>

    <h2 className={h2}>Environment and relationships</h2>
    <p className={p}>
      Peers matter. A strong study group raises everyone&apos;s baseline; a chaotic one drags you into distraction. Choose partners who show up prepared and stay on agenda. Professors matter too, respectful communication builds goodwill that helps when you need an extension or a recommendation. Straight A&apos;s rarely come from isolating yourself; they come from combining solo deep work with selective collaboration.
    </p>

    <h2 className={h2}>Health as a prerequisite, not a reward</h2>
    <p className={p}>
      Sleep, movement, and regular meals stabilize attention and mood. Chronic exhaustion lowers working memory and makes everything feel harder than it is. Students who sustain high performance treat basic health as part of the study plan, not something to &quot;earn&quot; after finals. That does not mean perfect routines. It means refusing the story that suffering equals virtue.
    </p>
    <p className={p}>
      When workload spikes, use tools that reduce friction: <a href="/focus-mode" onClick={handleNavigate('focus-mode')} className={internalLink}>Focus Mode</a> for distraction control, <a href="/tools/quiz-generator" onClick={handleNavigate('quiz-generator')} className={internalLink}>quizzes</a> for fast retrieval practice, and the <a href="/analysis" onClick={handleNavigate('analysis')} className={internalLink}>essay analyzer</a> for papers, so feedback arrives while you still have time to revise.
    </p>

    <h3 className={h3}>Reality check</h3>
    <p className={p}>
      Grades are not moral worth. If you are doing your best and not earning A&apos;s, you may be in unusually harsh curves or heavy life circumstances. The strategies above help you maximize learning and outcomes; they do not guarantee a particular GPA. Measure progress against your past self, not someone else&apos;s highlight reel.
    </p>

    <h2 className={h2}>Exam week logistics</h2>
    <p className={p}>
      Confirm room locations, permitted materials, and calculator policies before you walk in. Pack spare pens, batteries, and chargers the night before. Arrive early enough to settle breathing, rushing spikes cortisol and shrinks working memory. If you blank, skip and circle back; momentum matters more than answering in order during time pressure.
    </p>
    <p className={p}>
      After each exam, do a quick debrief: which study methods predicted the questions well? Where were surprises? Feed that into the next course. You are building a personal playbook, not just surviving one week.
    </p>

    <h2 className={h2}>When straight A&apos;s are not the goal</h2>
    <p className={p}>
      Internships, caregiving, and part-time jobs sometimes cap what is feasible academically. In those seasons, target strategic excellence: ace courses in your major, meet baseline requirements elsewhere, and document projects that future employers care about more than a marginal GPA point. Leverage still applies. It just shifts toward time and energy rather than only grades.
    </p>

    <h2 className={h2}>Note-taking systems that scale</h2>
    <p className={p}>
      Messy notes cost time on Sunday night when you cannot find definitions. Pick a simple convention: heading per lecture, key terms bolded, questions in the margin. Digitize if you lose paper, searchable notes save hours. Link weekly summaries to problem sets so you see which concepts appeared in practice versus which only showed up in lecture.
    </p>
    <p className={p}>
      Avoid copying slides verbatim unless your instructor requires it; paraphrase and add examples. Verbatim slides create false confidence. You recognize fonts, not ideas.
    </p>

    <h2 className={h2}>Talking to professors without wasting office hours</h2>
    <p className={p}>
      Bring one specific problem set question, one draft paragraph, or one reading confusion, not &quot;I am lost.&quot; High-performing students make it easy for faculty to help them quickly. They also send emails with course numbers in subject lines and proofread before sending. Small courtesies increase willingness to help when you need exceptions.
    </p>

    <h2 className={h2}>Using rubrics as score predictors</h2>
    <p className={p}>
      Before starting an assignment, translate the rubric into a checklist. After drafting, self-score honestly. The gap between your self-score and the standard you want tells you where to spend the next hour. High performers iterate until predicted rubric scores match their goals, then submit.
    </p>
    <p className={p}>
      If rubrics are vague, ask clarifying questions early. Ambiguity is not a mystery to endure; it is information you can often resolve in two minutes of email.
    </p>

    <h2 className={h2}>Balancing extracurriculars</h2>
    <p className={p}>
      Leadership roles and clubs matter for scholarships and well-being, but they compete for the same calendar as studying. Choose depth in a few commitments over token membership in many. Protect academic blocks on your calendar the way you protect work shifts.
    </p>
  </>
);

/** free-writing-tools-every-student-needs */
export const ExpandedFreeWritingTools: React.FC<{ handleNavigate: NavigateHandler }> = ({ handleNavigate }) => (
  <>
    <h2 className={h2}>Building a minimal writing stack that covers the whole pipeline</h2>
    <p className={p}>
      You do not need twenty browser extensions. You need coverage across stages: planning, drafting, mechanics, citations, and final polish. At minimum, keep a reliable word counter for assignments with limits, a grammar checker tuned for academic tone, a citation generator aligned with your courses&apos; styles, and a readability tool when prompts ask for &quot;clear&quot; or &quot;accessible&quot; prose. Add an essay feedback tool when you care about argument and structure, not just commas. Missing any stage leaves predictable failure modes: beautiful sentences that do not answer the prompt, or strong ideas buried under citation errors.
    </p>
    <p className={p}>
      Free tiers vary. Some cap daily checks or word counts; some limit advanced features to paid plans. Read the limits before you rely on a tool the night a paper is due. Where possible, batch similar tasks, run grammar on the full draft once, not paragraph by paragraph, to stay within quotas.
    </p>

    <h2 className={h2}>Privacy and data: what &quot;free&quot; can cost</h2>
    <p className={p}>
      Free tools may train on your text or store copies unless their policy says otherwise. For sensitive drafts, prefer vendors that commit not to use your work for model training and offer clear data retention windows. If you cannot verify, avoid pasting unpublished research or proprietary content. Using tools for grammar and local formatting is lower risk than uploading entire theses to opaque servers.
    </p>

    <h2 className={h2}>Cross-checking tools against each other</h2>
    <p className={p}>
      No tool is perfect. Grammar checkers disagree; citation generators sometimes mishandle unusual sources. When stakes are high, run two passes with different tools or verify edge cases against your style manual. Keep a short personal checklist of errors your tools miss, maybe hyphenation in compound adjectives or your discipline&apos;s preferred capitalization, and scan for those manually.
    </p>
    <p className={p}>
      Pair lightweight utilities with deeper ones: use a <a href="/tools/word-counter" onClick={handleNavigate('word-counter')} className={internalLink}>word counter</a> and <a href="/tools/readability-score" onClick={handleNavigate('readability-score')} className={internalLink}>readability analysis</a> for length and clarity, then <a href="/analysis" onClick={handleNavigate('analysis')} className={internalLink}>full essay feedback</a> when you need thesis-level critique.
    </p>

    <h2 className={h2}>Teaching yourself style, not just accepting suggestions</h2>
    <p className={p}>
      The point of grammar and style tools is learning patterns you can reproduce under exam conditions where those tools are unavailable. When a suggestion appears, read the explanation. If there is no explanation, look up the rule briefly. Over a semester, you should need fewer suggestions in your strong areas. If the same error repeats, dedicate a short practice session to that rule with examples you write yourself, not only examples the software fixes for you.
    </p>

    <h2 className={h2}>Assignments across disciplines: what changes</h2>
    <p className={p}>
      Lab reports emphasize precision and tense consistency; literature essays emphasize textual evidence and interpretive language; policy memos emphasize concise recommendations. Your tool stack stays similar, outline, draft, grammar, citations, but the emphasis shifts. Build small style sheets per course: forbidden phrases, preferred citation density, and example sentences your TA praised. Paste those notes at the top of your draft file so tools do not steer you toward the wrong genre.
    </p>
    <p className={p}>
      Word limits punish redundancy; cut nominalizations and filler adverbs before you cut content. If you are long, highlight one paragraph per section that could merge or disappear without losing the argument, often the introduction and conclusion admit trims without damage.
    </p>
  </>
);

/** how-to-write-a-thesis-statement */
export const ExpandedThesisStatement: React.FC<{ handleNavigate: NavigateHandler }> = ({ handleNavigate }) => (
  <>
    <h2 className={h2}>Thesis evolution: from vague idea to testable claim</h2>
    <p className={p}>
      Early drafts often start with a topic, not a thesis. &quot;This paper is about climate policy&quot; is not arguable; it is a label. A thesis specifies your angle: what you are claiming, why it matters, and often how you will support it. Expect to revise the thesis after your first pass through evidence. Research changes what you can responsibly assert. That is normal. The final thesis should be narrow enough to defend in the page limit yet broad enough to matter. If you cannot imagine a reader disagreeing, you probably have a report, not an argument.
    </p>
    <p className={p}>
      Test your thesis with &quot;so what?&quot; If you cannot answer why the claim matters beyond the classroom, push for stakes: policy implications, interpretive consequences, or a gap in existing scholarship you address. Undergraduate papers sometimes stop at description; stronger ones explain significance.
    </p>

    <h2 className={h2}>Placement and forecasting</h2>
    <p className={p}>
      Readers expect the thesis early, often end of the first paragraph in shorter essays, sometimes end of the introduction in longer papers. After stating it, forecast structure: &quot;First, I examine X; then Y; finally Z.&quot; Forecasting keeps you honest; if your body paragraphs wander from that map, either fix the paragraphs or fix the thesis. Mismatch between promise and delivery is a common professor complaint.
    </p>

    <h2 className={h2}>Common thesis failure modes</h2>
    <p className={p}>
      Overly broad theses cannot be supported in five pages. Overly narrow theses may not justify an essay. List theses try to do too much (&quot;This paper will discuss A, B, C, D…&quot;) without integrating claims. Purely factual theses are not arguable. Value judgments without criteria (&quot;X is bad&quot;) invite requests for definition and evidence. If you see these patterns, tighten scope or add an analytical lens: compare, evaluate causes, or interpret texts using a defined method.
    </p>
    <p className={p}>
      Use an <a href="/tools/essay-outline" onClick={handleNavigate('essay-outline')} className={internalLink}>outline</a> to see whether each section supplies evidence for the thesis. If a section drifts, cut it or fold its insight into a section that does support the claim.
    </p>

    <h2 className={h2}>Discipline-specific expectations</h2>
    <p className={p}>
      Humanities theses often foreground interpretation or close reading. Social science theses may emphasize causal mechanisms or theoretical frameworks. Natural science writing may foreground hypotheses or models. Mirror the verbs your field uses: analyze, argue, demonstrate, refute, complicate. If sample papers are available, compare their thesis moves to yours, not to copy content but to match rhetorical expectations.
    </p>

    <h2 className={h2}>From thesis to paragraphs</h2>
    <p className={p}>
      Each body paragraph should advance the thesis. Topic sentences should mini-argue, not merely introduce topics. If a paragraph could appear in a different paper without change, it is probably too generic. Tie evidence back explicitly: show how the quote or data supports your specific wording in the thesis. When revision feels stuck, rewrite the thesis to match your best paragraphs, then adjust weaker paragraphs upward to match. Sometimes the thesis is what needs to move.
    </p>
    <p className={p}>
      After drafting, run <a href="/analysis" onClick={handleNavigate('analysis')} className={internalLink}>essay analysis</a> to surface places where your argument thins or where the thesis and body diverge. Fix those mismatches before line editing.
    </p>

    <h2 className={h2}>Thesis patterns by assignment type</h2>
    <p className={p}>
      Compare-and-contrast essays often need a thesis that names the basis of comparison: &quot;While both authors address climate policy, X emphasizes markets whereas Y emphasizes regulation.&quot; Cause-effect papers need clarity about scope and mechanisms. Literary analysis theses should point to specific devices or themes, not restate the plot. If your thesis could appear on SparkNotes, push for an interpretive claim only your paper makes.
    </p>
    <p className={p}>
      Research proposals sometimes include research questions instead of single-sentence theses, know which genre you are in. Dissertation-level work may place the thesis in a dedicated section; follow your committee&apos;s template even if it feels repetitive.
    </p>

    <h2 className={h2}>When your thesis and conclusion disagree</h2>
    <p className={p}>
      Strong writers often discover their real argument in the final pages. That is fine, update the introduction to match. Readers experience cognitive dissonance when the opening promises one journey and the ending delivers another. If your conclusion introduces a nuance you love, fold it into the thesis explicitly rather than smuggling it only at the end.
    </p>

    <h2 className={h2}>Thesis stress-testing with questions</h2>
    <p className={p}>
      Ask: &quot;So what?&quot; &quot;According to whom?&quot; &quot;On what evidence?&quot; &quot;What would change my mind?&quot; If you cannot answer quickly, the thesis is not ready. For argumentative essays, sketch the strongest objection and ensure your thesis already hints at how you will handle it.
    </p>
    <p className={p}>
      For timed writes, spend two minutes drafting a mini-outline that includes the thesis sentence before you fill pages. Returning to adjust the thesis after the first body paragraph is cheaper than rewriting four pages that wandered off-prompt.
    </p>

    <h2 className={h2}>Thesis templates for common essay archetypes</h2>
    <p className={p}>
      Problem-solution: &quot;Because [problem] harms [stakeholders], [agent] should [action] in order to [outcome].&quot; Evaluation: &quot;Although [many think X], [close reading of Y] shows [Z] because [reasons].&quot; These are training wheels, rewrite in your voice, but ensure the logical slots are filled.
    </p>
  </>
);

/** how-to-write-apa-research-paper */
export const ExpandedApaResearchPaper: React.FC<{ handleNavigate: NavigateHandler }> = ({ handleNavigate }) => (
  <>
    <h2 className={h2}>APA as a communication standard, not decoration</h2>
    <p className={p}>
      Instructors care about APA because it standardizes how readers find your sources and verify your claims. Title page elements, running head rules, heading levels, and reference formatting all serve traceability. Treating APA as a checklist after writing usually creates painful retrofitting. Instead, draft references as you read, use heading styles in your word processor early, and insert citations while you write rather than batching them at the end, where mismatches multiply.
    </p>

    <h2 className={h2}>Method and results: where student papers often break</h2>
    <p className={p}>
      Empirical papers need transparent methods: who participated, what materials, what procedure, what analysis. Results present findings without interpreting them in depth, that belongs in discussion. Mixing interpretation into results reads as disorganized. Figures and tables need captions and in-text pointers; every visual should have a narrative job, not mere decoration.
    </p>
    <p className={p}>
      If you are not running original data collection but writing a literature review, your &quot;method&quot; is your search strategy: databases, keywords, inclusion criteria. Be explicit so readers understand scope and potential bias.
    </p>

    <h2 className={h2}>Bias-free language and precision</h2>
    <p className={p}>
      APA emphasizes respectful, precise descriptors for people and groups. Replace vague labels with specific terms your sources use. Avoid essentializing language. These norms evolve; check current APA guidance for terminology around disability, race, gender, and socioeconomic status. Precision is not political ornament. It reduces ambiguity and aligns with scholarly values of accuracy.
    </p>

    <h2 className={h2}>Common APA pitfalls</h2>
    <p className={p}>
      Heading levels skip or jump inconsistently. In-text citations omit years or use &quot;&amp;&quot; outside parentheses. Reference lists mix database names with publishers incorrectly. DOIs and URLs are formatted inconsistently or left hyperlinked with poor retrieval dates. Quotations over forty words need block format. Statistical reporting has specific patterns (means, SDs, test statistics, degrees of freedom, p-values). Keep a style cheat sheet beside you while drafting.
    </p>
    <p className={p}>
      Use a <a href="/tools/citation-generator" onClick={handleNavigate('citation-generator-tool')} className={internalLink}>citation generator</a> for references, then manually verify unusual sources. Run <a href="/analysis" onClick={handleNavigate('analysis')} className={internalLink}>structure and clarity feedback</a> on your discussion section to ensure claims stay proportional to evidence.
    </p>

    <h2 className={h2}>Revision order for APA papers</h2>
    <p className={p}>
      First, confirm each citation appears in references and vice versa. Second, align headings with your outline. Third, tighten abstract accuracy, many readers only skim it. Fourth, polish discussion implications without overstating causal claims correlational data cannot support. Finally, proofread for double spaces, orphan headings, and table alignment. That sequence prevents polishing prose you later delete when fixing methods or results.
    </p>

    <h2 className={h2}>Tables, figures, and supplemental materials</h2>
    <p className={p}>
      Each table needs a number, title, and note if abbreviations need defining. Refer to every visual in the narrative before it appears or immediately after, do not orphan graphics. For color-dependent figures, ensure grayscale readability or provide patterns for accessibility. Supplemental files hosted online should be cited in the main text with clear retrieval information.
    </p>
    <p className={p}>
      If you adapt a figure from another source, credit the original and confirm you have permission when required. Copyright matters even in student papers when publicly archived.
    </p>

    <h2 className={h2}>APA style beyond the paper: slides and posters</h2>
    <p className={p}>
      Conference posters and slide decks still signal professionalism through clean typography, limited text density, and consistent citation of images and data sources. Even when full APA is not required, borrowing its hierarchy principles, title, author, affiliation, clear section headings, helps audiences scan quickly.
    </p>

    <h2 className={h2}>Reporting statistics accessibly</h2>
    <p className={p}>
      Round responsibly for readability, but do not hide precision you need for replication. Report effect sizes alongside p-values; confidence intervals communicate uncertainty better than stars alone. Use parallel structure when comparing groups so readers can scan tables. Always name your statistical software and version where relevant.
    </p>
    <p className={p}>
      For qualitative work, APA still expects transparency: coding procedures, researcher reflexivity where appropriate, and thick description balanced with parsimony.
    </p>

    <h2 className={h2}>Literature reviews in APA style</h2>
    <p className={p}>
      Synthesis, not serial summary, defines a strong review. Group studies by method or finding, note disagreements, and highlight gaps your project fills. Use thematic headings rather than one subsection per article. Cite clusters fairly; avoid cherry-picking only studies that agree with you.
    </p>
    <p className={p}>
      When transitions feel clunky, name the relationship between studies explicitly: &quot;builds on,&quot; &quot;contradicts,&quot; &quot;extends to a new population.&quot;
    </p>

    <h2 className={h2}>Student papers versus professional manuscripts</h2>
    <p className={p}>
      Course papers sometimes allow appendixes for instruments or extra analyses; journals may not. Learn which elements belong in main text versus supplemental files early so you do not have to restructure entirely when repurposing work.
    </p>
  </>
);

/** citation-checker-academic-writing */
export const ExpandedCitationChecker: React.FC<{ handleNavigate: NavigateHandler }> = ({ handleNavigate }) => (
  <>
    <h2 className={h2}>What automated citation checking can (and cannot) do</h2>
    <p className={p}>
      Automated checkers excel at formatting consistency: punctuation in author lists, italics for book titles, capitalization rules, and year placement. They struggle with judgment calls: whether a source is peer-reviewed, whether a blog qualifies for your assignment, or how to cite a TikTok if your style guide is silent. Treat software as a safety net that catches mechanical errors while you apply course requirements manually.
    </p>
    <p className={p}>
      Checkers also depend on accurate metadata. If you import a reference with a typo in the author name, the formatted output will look perfect and still be wrong. Always compare generated references against the source itself, especially page ranges and edition numbers.
    </p>

    <h2 className={h2}>Synchronizing in-text citations and reference lists</h2>
    <p className={p}>
      One of the fastest ways to lose points is citing &quot;Smith 2019&quot; in text while your reference list has a different year or omits Smith entirely. After any major edit, run a pairing pass: extract every parenthetical or footnote citation and confirm a matching entry. Reference managers help but only if you used them consistently; many students blend manual and generated citations and create ghosts.
    </p>

    <h2 className={h2}>Handling unusual sources</h2>
    <p className={p}>
      You will eventually cite a preprint, a conference paper, a translated work, a government report, or a dataset. Each has quirks: retrieval dates for unstable URLs, editors for anthologies, version numbers for software. When unsure, prioritize the primary style manual over forum posts. Libraries often publish quick guides, use those for edge cases, then log your choice so parallel citations stay consistent.
    </p>
    <p className={p}>
      WriteScholar&apos;s <a href="/tools/citation-generator" onClick={handleNavigate('citation-generator-tool')} className={internalLink}>citation tools</a> cover common types; pair them with instructor guidance when assignments restrict source types.
    </p>

    <h2 className={h2}>Citation ethics beyond formatting</h2>
    <p className={p}>
      Accurate formatting does not fix dishonest practice. Citing a fringe source as if it were consensus misleads readers even if the comma placement is perfect. Evaluate sources for credibility before you worry about italics. Quotation accuracy matters. Verify page numbers against your PDF. Misrepresenting what a source says erodes trust even when the citation line looks flawless.
    </p>

    <h2 className={h2}>Workflow for team papers</h2>
    <p className={p}>
      Shared documents multiply citation errors when people paste references from different libraries. Agree on one reference manager or one generator style up front. Keep a master reference list at the end and forbid floating footnotes that never make it to the bibliography. Before submission, one person should run the merge pass described above.
    </p>

    <h2 className={h2}>DOIs, URLs, and link rot</h2>
    <p className={p}>
      Prefer DOIs when available; they persist longer than many publisher URLs. For web pages without DOIs, record access dates if your style requires them. Archive.org snapshots can support claims if a source later changes. When links break before grading, graders may question whether you verified the source, proactive archiving prevents that headache.
    </p>
    <p className={p}>
      For subscription databases, cite the article metadata, not your library&apos;s proxy prefix in the URL string, style guides offer patterns for stable links when available.
    </p>

    <h2 className={h2}>Graduate and professional expectations</h2>
    <p className={p}>
      Thesis and dissertation committees scrutinize reference sections for completeness and consistency. Start clean habits early: no placeholders like &quot;???&quot; left in drafts, no &quot;forthcoming&quot; entries without updates. Journal reviewers may reject solely for citation sloppiness because it signals carelessness about evidence.
    </p>

    <h2 className={h2}>Field-specific citation culture</h2>
    <p className={p}>
      Medical and life-science writing leans heavily on recent, peer-reviewed journal articles with DOIs. Law review footnotes expect exhaustive citation. Anthropology may privilege ethnographic detail and archival sources. Business cases may use proprietary reports. Your checker cannot know those norms, learn them from your reading list and model papers. When a source type is common in your discipline but rare in general guides, bookmark three examples from reputable journals and mimic them.
    </p>
    <p className={p}>
      Interdisciplinary projects multiply styles. Label each chapter with a style tag or maintain separate reference files per section. Merging at the end without reconciliation creates nightmares, standardize early if your committee allows one style for the whole thesis.
    </p>

    <h2 className={h2}>Citation checks before journal submission (advanced)</h2>
    <p className={p}>
      If you adapt undergraduate work into a manuscript, re-run every DOI, update &quot;in press&quot; items to final pagination, and verify author order matches the published version. Co-author consent may be required before submission. These steps exceed classroom checks but show how citation hygiene scales.
    </p>

    <h2 className={h2}>Teaching assistants: what they look for first</h2>
    <p className={p}>
      TAs grading stacks often skim reference lists for obvious formatting errors before reading closely. Inconsistent italics, mismatched years, or orphan URLs signal rush jobs. Passing an automated citation check first buys you good-faith reading on the argument.
    </p>
  </>
);

/** best-academic-writing-tools-for-students */
export const ExpandedBestAcademicTools: React.FC<{ handleNavigate: NavigateHandler }> = ({ handleNavigate }) => (
  <>
    <h2 className={h2}>Matching tools to course types</h2>
    <p className={p}>
      STEM lab reports benefit from precision checkers, data-consistent terminology, and sometimes LaTeX-friendly workflows. Humanities essays need argument-centered feedback, close reading support, and flexible citation for archival or multimedia sources. Social science papers often blend statistical reporting with narrative analysis, tools should handle both clipped numeric presentation and longer explanatory paragraphs. A &quot;best&quot; stack is contextual: pick what matches your workload, not what ranks highest on generic lists.
    </p>

    <h2 className={h2}>Integration versus tool sprawl</h2>
    <p className={p}>
      Each new tool adds switching costs and login friction. Prefer platforms that cover multiple needs, outline, draft feedback, citations, without forcing you to export through five file formats. When tools do not integrate, define a single source of truth for your draft (usually your word processor) and treat others as side passes you apply sequentially.
    </p>
    <p className={p}>
      Watch for overlapping features you pay for twice. If your grammar checker, citation tool, and essay feedback all flag passive voice, you might not need three separate subscriptions. Choose the one with explanations you actually learn from.
    </p>

    <h2 className={h2}>Evaluating AI features responsibly</h2>
    <p className={p}>
      When vendors advertise &quot;AI writing,&quot; read whether they mean generation or feedback. Generation may violate academic policies. Feedback usually does not, provided you author the final text. Look for transparency about training data use and whether your drafts are stored. Prefer vendors that position AI as coaching rather than ghostwriting.
    </p>
    <p className={p}>
      Explore <a href="/features" onClick={handleNavigate('features')} className={internalLink}>WriteScholar features</a> for feedback-first workflows and compare plans on the <a href="/pricing" onClick={handleNavigate('pricing')} className={internalLink}>pricing page</a> against your actual monthly essay volume.
    </p>

    <h2 className={h2}>Accessibility and equity</h2>
    <p className={p}>
      Tools with strong keyboard navigation, screen reader support, and clear contrast help all students, including those with disabilities mandated accommodations may already cover. Free tiers matter for students on tight budgets, evaluate whether a paid feature is truly necessary or a convenience. If cost blocks you from editing support, prioritize campus writing centers and library workshops as complements.
    </p>

    <h2 className={h2}>Long-term skill building</h2>
    <p className={p}>
      The best academic tools make you less dependent over time. Track which feedback types disappear from your drafts as the semester progresses. If you keep ignoring the same suggestion, schedule targeted practice rather than hoping software fixes it forever. Graduation removes many of these guardrails, internalized skills matter.
    </p>

    <h2 className={h2}>Security, backups, and file hygiene</h2>
    <p className={p}>
      Cloud-synced drafts protect you from lost laptops, enable version history in your editor. For sensitive topics, confirm whether your institution provides secure storage; public tools may not be appropriate for certain data. Naming conventions (&quot;Paper_v3_2026-03-20&quot;) prevent uploading the wrong file to the LMS at 11:58 p.m.
    </p>
    <p className={p}>
      When collaborating internationally, time zones and tool access differ. Agree on a single master document permissions model so someone does not accidentally delete sections while others edit.
    </p>

    <h2 className={h2}>Transitioning from undergraduate to graduate tools</h2>
    <p className={p}>
      Reference managers, LaTeX, and statistical notebooks may enter your workflow later. You do not need them day one, but notice when professors expect reproducible methods sections or archival citations, those moments signal when to upgrade your stack beyond lightweight browser tools.
    </p>

    <h2 className={h2}>Cost-benefit analysis for students on a budget</h2>
    <p className={p}>
      List every subscription you consider: grammar, storage, reference manager, plagiarism checker, AI feedback. If totals exceed a realistic monthly budget, prioritize tools that save the most time on your highest-weight assignments. Often one integrated platform beats three overlapping subscriptions.
    </p>
    <p className={p}>
      Campus libraries sometimes site-license tools, check before paying. Similarly, student discounts vary; verify with your email address before checkout.
    </p>

    <h2 className={h2}>Portability: will your tools travel with you?</h2>
    <p className={p}>
      Cloud tools follow you across devices; desktop-only tools may fail during travel or library computer sessions. If you commute or study abroad, favor workflows that sync cleanly and export to standard formats (DOCX, PDF, BibTeX).
    </p>

    <h2 className={h2}>Career readiness beyond grades</h2>
    <p className={p}>
      Recruiters rarely ask which grammar checker you used, but they notice clarity, professionalism, and whether you can produce clean writing under deadline. Tools that teach you while you edit build that transferable skill, tools that ghostwrite do not.
    </p>
    <p className={p}>
      Build a portfolio of polished writing samples while you have access to academic feedback. Later, those clips matter more than any single exam score in knowledge-work fields.
    </p>
  </>
);

/** grammar-checker-academic-writing */
export const ExpandedGrammarAcademic: React.FC<{ handleNavigate: NavigateHandler }> = ({ handleNavigate }) => (
  <>
    <h2 className={h2}>Academic English is not &quot;fancy English&quot;</h2>
    <p className={p}>
      Students sometimes equate academic tone with long words and passive voice. Many style guides prefer clarity and appropriate hedging over bombast. Good grammar checkers for academic writing flag contractions where your discipline forbids them, pinpoint vague pronouns that confuse readers, and highlight nominalizations that obscure actors. They should not homogenize your voice into corporate blandness. If every sentence becomes equally smooth, you may have over-edited.
    </p>

    <h2 className={h2}>False positives and discipline norms</h2>
    <p className={p}>
      Grammar tools love to flag passive voice, but passive is sometimes standard in methods sections (&quot;Participants were randomly assigned…&quot;). They may flag first person, yet some instructors prefer &quot;we&quot; in group lab reports. They may suggest &quot;which&quot; versus &quot;that&quot; in ways that do not match your style manual. Use judgment; accept suggestions that increase clarity, reject ones that break discipline conventions.
    </p>
    <p className={p}>
      For literature and cultural studies, intentional fragments or stylistic repetition may be rhetorical devices, grammar checkers will not understand that. For creative nonfiction assignments, rules differ from argumentative essays. Always ask which register your instructor expects.
    </p>

    <h2 className={h2}>Sentence-level issues that actually change grades</h2>
    <p className={p}>
      Comma splices and run-ons obscure logical relationships. Faulty parallelism in lists annoys careful readers. Dangling modifiers attach actions to the wrong subject. Pronoun agreement errors confuse who did what. Subject-verb disagreement across long sentences makes prose feel amateurish even when ideas are strong. Tackle these patterns systematically rather than accepting every generic &quot;clarity&quot; suggestion without understanding why.
    </p>
    <p className={p}>
      Pair grammar passes with <a href="/tools/readability-score" onClick={handleNavigate('readability-score')} className={internalLink}>readability checks</a> when assignments cap sentence length or target general audiences. Then use <a href="/analysis" onClick={handleNavigate('analysis')} className={internalLink}>essay-level feedback</a> to ensure sentence-level fixes did not flatten your argument.
    </p>

    <h2 className={h2}>ESL and multilingual writers</h2>
    <p className={p}>
      Grammar tools can help but may misunderstand idioms or mark acceptable constructions as wrong. Work with campus multilingual writing support when available. Keep a personal error log: dated examples of mistakes you make repeatedly. Review that log before finals; it is more efficient than rereading generic grammar rules.
    </p>

    <h2 className={h2}>Proofreading rituals</h2>
    <p className={p}>
      Read aloud, read backward sentence by sentence, or change fonts to disrupt automatic reading. Schedule proofreading separately from drafting, your brain cannot do both at once effectively. If possible, wait a night between drafting and proofing.
    </p>

    <h2 className={h2}>Voice, bias, and inclusive language</h2>
    <p className={p}>
      Academic grammar is not neutral if it erases people or relies on stereotypes. Check whether examples diversify subjects and avoid default male pronouns for hypothetical experts. Grammar checkers may not catch biased examples, human readers will. Inclusive language is both ethical and persuasive; it keeps focus on evidence rather than distracting readers with needless exclusion.
    </p>
    <p className={p}>
      Hedging (&quot;suggests,&quot; &quot;may,&quot;) belongs where evidence warrants it; over-hedging sounds evasive. Match certainty in grammar to certainty in your data, another place human judgment beats automation.
    </p>

    <h2 className={h2}>Publishing and fellowship applications</h2>
    <p className={p}>
      If you adapt class papers into submissions, update tone, tighten literature reviews, and verify every citation against originals. Reviewers expect manuscript-quality prose; what passed for a seminar may not pass peer review. Track which style guide your target venue uses. It may differ from your course.
    </p>

    <h2 className={h2}>A week-by-week grammar habit (low effort, high payoff)</h2>
    <p className={p}>
      Pick one rule per week, articles, comma splices, parallel structure, and write five fresh sentences that follow it without software help. Then run the checker to confirm. Small drills beat marathon cramming because they build automaticity. Keep wrong answers: they show your blind spots more honestly than polished final drafts.
    </p>
    <p className={p}>
      When you edit peers&apos; papers, explain fixes in your own words. Teaching is retrieval; you will internalize rules faster than when you only receive corrections on your own work.
    </p>

    <h2 className={h2}>When grammar feedback conflicts with your instructor</h2>
    <p className={p}>
      Instructors win. If a tool wants Oxford commas and your professor does not, follow the syllabus. Mark those preferences in your style sheet so you do not &quot;fix&quot; your way into penalties.
    </p>

    <h2 className={h2}>Micro-editing versus macro-editing</h2>
    <p className={p}>
      Micro-editing fixes sentences; macro-editing fixes structure. Grammar checkers excel at micro. If your outline is wrong, polishing sentences wastes time. Run macro passes first: Does each section belong? Does each paragraph have a job? Then unleash grammar tools on the surviving text.
    </p>
    <p className={p}>
      Thesis writers sometimes spend weeks on chapter-level clarity while ignoring chapter order. No grammar checker will say &quot;swap chapters three and four,&quot; but that move may matter more than any comma.
    </p>

    <h2 className={h2}>Collaborative writing etiquette</h2>
    <p className={p}>
      When co-authoring, agree on one dialect of English (US versus UK spelling), one hyphenation standard, and one level of formality. Track changes should show who accepted grammar suggestions, avoid anonymous approvals that hide who never read the final pass.
    </p>

    <h2 className={h2}>Grammar and grades: where points actually hide</h2>
    <p className={p}>
      Rubrics often bundle grammar under &quot;style&quot; or &quot;communication.&quot; Even when worth fewer points than analysis, egregious errors undermine reader trust in your analysis. Think of clean grammar as removing static so your ideas transmit clearly.
    </p>
    <p className={p}>
      In timed settings, prioritize subject-verb agreement and sentence completeness over stylistic flourish, readers forgive plain sentences more than confusing ones.
    </p>
  </>
);

/** mla-vs-apa-vs-chicago-citation-style */
export const ExpandedMlaApaChicago: React.FC<{ handleNavigate: NavigateHandler }> = ({ handleNavigate }) => (
  <>
    <h2 className={h2}>Beyond the cheat sheet: why instructors care</h2>
    <p className={p}>
      Citation styles encode values. APA&apos;s author-date system foregrounds recency and empirical conversation (typical in psychology and many social sciences). MLA&apos;s author-page system foregrounds close reading and textual evidence (typical in literature and cultural studies). Chicago&apos;s notes-and-bibliography setup supports historiography and long explanatory footnotes. Using the wrong style signals unfamiliarity with disciplinary norms, not just a formatting slip.
    </p>

    <h2 className={h2}>Hybrid courses and switching costs</h2>
    <p className={p}>
      Students taking STEM and humanities simultaneously must context-switch between styles weekly. Build muscle memory with small rituals: highlight whether the current class uses parentheses or footnotes, title case or sentence case, &quot;References&quot; versus &quot;Works Cited.&quot; Keep separate style notes per course rather than one mega document that mixes rules.
    </p>
    <p className={p}>
      Digital tools reduce but do not eliminate switching costs. Verify each generated entry when courses demand unusual source types.
    </p>

    <h2 className={h2}>Digital objects and evolving rules</h2>
    <p className={p}>
      URLs, DOIs, access dates, and social media handles change faster than print rules evolved. Style manuals update; blog posts lag. When your source does not fit examples in your handbook, prioritize the official manual or your library&apos;s guide, then ask your instructor if ambiguity remains. Document the choice you made so parallel citations stay consistent.
    </p>

    <h2 className={h2}>Tables comparing inline patterns</h2>
    <p className={p}>
      APA in-text emphasizes year for currency; repeated citations may shorten to author plus year. MLA emphasizes page numbers for direct quotes. Chicago notes use superscripts linked to footnotes with full bibliographic detail on first citation and shortened notes thereafter in some variants. Understanding these patterns helps you diagnose mistakes faster than scanning for italics alone.
    </p>
    <p className={p}>
      Practice by taking three identical sources and formatting them in all three styles. The exercise feels tedious but builds fluency faster than memorizing isolated rules.
    </p>

    <h2 className={h2}>Working with picky graders</h2>
    <p className={p}>
      Some instructors treat citation as a gateway skill: errors cost disproportionate points because they reflect attention to detail. Others are lenient if the attempt is visible. Know your audience. When citation is heavily weighted, start references early and schedule a dedicated citation-only review session. Pair manual checks with a <a href="/tools/citation-generator" onClick={handleNavigate('citation-generator-tool')} className={internalLink}>generator</a> to reduce fatigue errors.
    </p>

    <h2 className={h2}>Multimedia and legal sources</h2>
    <p className={p}>
      You will eventually cite podcasts, court opinions, patents, and datasets. Each style has specialized patterns for medium, jurisdiction, and retrieval. Keep a running cheat sheet of examples you have verified with official manuals, copying random blog examples risks subtle errors.
    </p>
    <p className={p}>
      When quoting legislation or treaties, precision matters: article numbers, sections, and amendment states. Small mistakes undermine credibility fast in political science and pre-law courses.
    </p>

    <h2 className={h2}>Citation as reading practice</h2>
    <p className={p}>
      Students who struggle with citations often struggle with reading sources carefully. Slow down: write a one-sentence summary next to each reference entry. If you cannot summarize it, you may not understand it well enough to cite fairly. That habit improves both ethics and grades.
    </p>

    <h2 className={h2}>Annotating style manuals for speed</h2>
    <p className={p}>
      Buy a physical manual or keep a PDF with searchable highlights. Tag the sections you use weekly: in-text patterns, reference list templates, capitalization, DOI display. Speed matters during timed writing; you should know where to look in under ten seconds.
    </p>
    <p className={p}>
      Create a one-page comparison table for the three styles: author format, title capitalization, date placement, page rules, online retrieval. Update it whenever manuals revise. That sheet is worth more than dozens of bookmarked blog posts of uneven quality.
    </p>

    <h2 className={h2}>International editions and translations of manuals</h2>
    <p className={p}>
      If you purchase manuals outside your region, confirm edition numbers match what your department expects. Translation quirks occasionally change examples; always verify against the English authoritative text when grades matter.
    </p>

    <h2 className={h2}>Citation style and argument structure</h2>
    <p className={p}>
      MLA encourages author-focused signal phrases because literary arguments hinge on whose interpretation you follow. APA foregrounds year because currency of evidence matters in empirical work. Chicago notes can carry mini-commentaries at the bottom, useful when you want to debate historiography without cluttering the body. Match citation rhetoric to argument rhetoric.
    </p>
    <p className={p}>
      When you switch styles between courses, you may also switch how often you quote versus paraphrase. Notice that shift; it is not only cosmetic.
    </p>

    <h2 className={h2}>Building a personal style cheat sheet</h2>
    <p className={p}>
      On one page, list: your major&apos;s default style, exceptions your professors announced, and links to official examples you trust. Laminate it metaphorically, keep it open while drafting. Random Google results vary; your sheet should not.
    </p>

    <h2 className={h2}>Long documents: reference list hygiene</h2>
    <p className={p}>
      Sort references alphabetically in styles that require it; verify hanging indents; ensure DOI links are live. For Chicago notes, verify shortened note forms match first citations. These tasks sound tedious because they are, which is why tools plus a final human scan beat either alone.
    </p>
  </>
);

/** ai-writing-assistant-for-students */
export const ExpandedAiWritingAssistant: React.FC<{ handleNavigate: NavigateHandler }> = ({ handleNavigate }) => (
  <>
    <h2 className={h2}>Institutional policies are moving targets</h2>
    <p className={p}>
      Universities update AI policies each term. A practice your roommate said was okay last year may be prohibited now. Read your syllabus, your department&apos;s integrity page, and any AI addenda. When policies conflict or seem vague, email your instructor before relying on a tool for something beyond spell-check. A two-sentence clarification email is cheaper than an academic integrity meeting.
    </p>

    <h2 className={h2}>Feedback literacy: turning suggestions into skill</h2>
    <p className={p}>
      Students who improve fastest treat AI suggestions as mini-lessons. They categorize feedback: grammar, clarity, argument, evidence. They track recurring issues in a spreadsheet or notebook. They rewrite sentences themselves rather than pasting AI rewrites. That discipline converts tool use into durable skill; blind acceptance produces brittle writing that collapses on proctored exams.
    </p>
    <p className={p}>
      If a suggestion changes your meaning, reject it, even good models misread context. If you do not know why a suggestion appeared, pause and look up the underlying concept. That extra minute saves you from repeating the same error across dozens of sentences.
    </p>

    <h2 className={h2}>Collaboration boundaries</h2>
    <p className={p}>
      Group projects amplify AI risks: someone may paste generated text into a shared doc without telling you. Agree on norms: no unvetted AI paragraphs, clear attribution of who drafted what, and a final human pass for voice consistency. For co-authored work, integrity problems can implicate everyone unless roles are clear.
    </p>

    <h2 className={h2}>When to skip AI entirely</h2>
    <p className={p}>
      Timed exams, in-class essays, and some licensing exams prohibit external tools. Practice offline drafting regularly so you are not dependent. If you only write with AI assistance, your unaided fluency may not match your aided fluency, creating a dangerous gap when it matters most.
    </p>
    <p className={p}>
      Creative or reflective assignments may specifically seek your authentic voice; over-editing with AI can flatten personality markers instructors want to assess. In those cases, limit tools to light proofreading or skip them.
    </p>

    <h2 className={h2}>Building a personal policy</h2>
    <p className={p}>
      Write a one-paragraph standard for yourself: which tools you will use, for what tasks, and how you will verify output. Revisit each semester. A clear personal policy keeps you consistent across courses with different rules and reduces anxiety about &quot;accidentally&quot; crossing a line.
    </p>
    <p className={p}>
      WriteScholar focuses on <a href="/analysis" onClick={handleNavigate('analysis')} className={internalLink}>feedback you implement yourself</a> rather than ghostwritten text, aligned with how many institutions prefer students use AI. Review <a href="/pricing" onClick={handleNavigate('pricing')} className={internalLink}>plans</a> if you need higher monthly limits during heavy writing terms.
    </p>

    <h2 className={h2}>Documentation for your own learning</h2>
    <p className={p}>
      Keep a simple log when you use AI assistance: date, assignment, tool, and purpose (&quot;checked passive voice,&quot; &quot;outline feedback&quot;). If a question ever arises, you have a record. Some programs may require similar logs for accreditation; building the habit early costs little.
    </p>
    <p className={p}>
      Reflect weekly: which suggestions did you accept, which did you reject, and what did you learn from the rejects? That meta-journal turns tools into curriculum instead of crutches.
    </p>

    <h2 className={h2}>Looking ahead: workplaces and graduate school</h2>
    <p className={p}>
      Professional environments increasingly specify AI norms. Learning to separate feedback from generation now prepares you for grant writing, client work, and research integrity training later. The students who practice transparent, accountable workflows adapt faster when policies change, because they already treat writing as iterative and documented.
    </p>

    <h2 className={h2}>Sample weekly workflow with feedback tools</h2>
    <p className={p}>
      Monday: outline and thesis in your own words. Tuesday–Wednesday: draft body sections without AI. Thursday: run structure analysis; revise argument and evidence. Friday: grammar and citations. Weekend: read aloud, sleep, final polish. AI enters midweek onward, never as a first draft substitute.
    </p>
    <p className={p}>
      Adjust proportions for shorter assignments; keep the principle that generation belongs to you and machines assist revision. When deadlines compress, shrink drafting time, not integrity steps.
    </p>

    <h2 className={h2}>Red flags that mean you should pause</h2>
    <p className={p}>
      If you cannot explain a paragraph aloud without reading it, you probably did not author it deeply enough. If your vocabulary suddenly exceeds your usual range, verify you are not accidentally pasting generated text. If you feel anxious about submission, run your institution&apos;s integrity checklist or talk to a trusted mentor before uploading.
    </p>
  </>
);

/** essay-checker-plagiarism-research-paper-help-google-searches */
export const ExpandedEssayStudentGoogleSearchGuide: React.FC<{ handleNavigate: NavigateHandler }> = ({ handleNavigate }) => (
  <>
    <h2 className={h2}>When people search “essay checker,” they usually want three different things</h2>
    <p className={p}>
      First, a fast sanity check: spelling, grammar, and whether sentences are readable. Second, argument-level feedback: thesis clarity, evidence, and whether each paragraph advances the claim. Third, integrity comfort: reassurance that paraphrases are not too close to sources and that citations are complete. One search phrase hides a bundle of needs. Tools that only fix commas cannot replace a pass that checks whether your conclusion answers the prompt. Conversely, running a deep structure review before you have complete sentences wastes time. Sequence matters: outline and draft, then structure and citations, then line-level polish with a <a href="/tools/grammar-checker" onClick={handleNavigate('grammar-checker')} className={internalLink}>grammar checker for students</a> and a <a href="/tools/readability-score" onClick={handleNavigate('readability-score')} className={internalLink}>readability check</a>.
    </p>
    <p className={p}>
      If your query is closer to “grade my essay” or “paper rater,” you are really asking for rubric-aligned judgment: what would a grader notice first? That is where professor-style feedback on your own draft helps more than a numeric score with no explanation. Look for tools that tie comments to exact sentences and criteria, not a single opaque number at the end.
    </p>

    <h2 className={h2}>“Plagiarism checker,” “Turnitin,” and “is this paraphrasing okay?”</h2>
    <p className={p}>
      Students search plagiarism-related phrases when they are anxious about accidental copying, patchwriting, or forgotten quotation marks. Automated originality tools can flag overlap, but they do not replace understanding citation rules. The sustainable fix is systematic: every idea that is not common knowledge needs a path back to a source; every direct quote needs quotation marks or block format; every paraphrase still needs a citation when the idea is not yours. Pair habits with a <a href="/tools/citation-generator" onClick={handleNavigate('citation-generator-tool')} className={internalLink}>citation generator</a> so APA or MLA formatting does not break under deadline stress.
    </p>
    <p className={p}>
      When people look for a “paraphrasing tool” or “rewrite my sentence,” the ethical line is whether you are learning to express an idea in your own words or laundering someone else&apos;s prose. Rewriting to understand, then closing the source and drafting fresh, is legitimate study. Pasting text into a rewriter and submitting the output usually violates course policies. If you need phrasing help, use <a href="/tools/paraphrasing-tips" onClick={handleNavigate('paraphrasing-tips')} className={internalLink}>paraphrasing guidance</a> and your own sentences, not auto-generated paragraphs.
    </p>

    <h2 className={h2}>“Research paper help,” “thesis statement,” and “how long should my paper be?”</h2>
    <p className={p}>
      Research paper searches often mix structure questions with anxiety about scope. A strong thesis is specific and contestable; it previews the why, not just the topic. An outline prevents the classic failure mode: beautiful paragraphs that do not add up to an argument. Use an <a href="/tools/essay-outline" onClick={handleNavigate('essay-outline')} className={internalLink}>essay outline</a> to align sections with your prompt before you chase sources. Length questions are usually proxy worries about depth: match page count to the number of claims you can support with evidence, not padding.
    </p>
    <p className={p}>
      For literature reviews and methods-heavy courses, students also search “how to cite multiple authors,” “DOI,” or “APA 7 title page.” Those are style-guide questions; keep the official manual or your department&apos;s template open beside a consistent citation workflow. Tools reduce mechanical errors; they do not read the syllabus for you.
    </p>

    <h2 className={h2}>“Homework help,” “study app,” “flashcards,” and “quizlet alternative”</h2>
    <p className={p}>
      Writing searches spike before due dates; study searches spike before exams. The same student often needs both: retrieval practice with <a href="/tools/quiz-generator" onClick={handleNavigate('quiz-generator')} className={internalLink}>quizzes</a> and <a href="/tools/create-flashcards" onClick={handleNavigate('create-flashcards')} className={internalLink}>flashcards</a> built from lecture notes, plus <a href="/tools/study-pack" onClick={handleNavigate('study-pack')} className={internalLink}>study packs</a> when you want structured review. If distraction is the real bottleneck, pair sessions with <a href="/focus-mode" onClick={handleNavigate('focus-mode')} className={internalLink}>Focus Mode</a> so unlock rules match your actual goals.
    </p>
    <p className={p}>
      Searching “GPA calculator” or “what do I need on the final?” reflects anxiety about weighting, not writing skill. Answer those questions with your syllabus math, then return to preparation: spaced review beats cramming for durable memory.
    </p>

    <h2 className={h2}>“Proofread my paper,” “word counter,” and “English grammar check”</h2>
    <p className={p}>
      These queries are often the last step before upload. That is fine if higher-order issues are already settled. Otherwise you risk “correcting” language in paragraphs your instructor will still mark for missing evidence. Use a <a href="/tools/word-counter" onClick={handleNavigate('word-counter')} className={internalLink}>word counter</a> early to stay inside limits, then proofread late. If you are not a native English speaker, separate global clarity edits from nitpicks so you are not oscillating between two standards in the same sentence.
    </p>

    <h2 className={h2}>“AI homework helper” and “AI essay writer”: read the syllabus twice</h2>
    <p className={p}>
      Institutions distinguish between assistance that strengthens your skills and submission of machine-generated work. Feedback on a draft you wrote (structure, rubric alignment, missing citations) is widely accepted when policies allow tools at all. Submitting text a model composed for you usually is not. When in doubt, ask your instructor before the deadline. WriteScholar is built around <a href="/analysis" onClick={handleNavigate('analysis')} className={internalLink}>feedback on your draft</a> and <a href="/features" onClick={handleNavigate('features')} className={internalLink}>academic workflows</a>, not ghostwriting; see <a href="/pricing" onClick={handleNavigate('pricing')} className={internalLink}>pricing</a> for plans that match how many papers you run per month.
    </p>

    <h2 className={h2}>Turn searches into a repeatable workflow</h2>
    <p className={p}>
      Monday: prompt and rubric in your own words. Tuesday–Wednesday: draft body sections. Midweek: run essay-level feedback; revise thesis and evidence. Later: citations and reference list. End: grammar, readability, and a slow read aloud. Searching Google for shortcuts is normal; turning those shortcuts into an ordered pipeline is what protects both grades and integrity.
    </p>
  </>
);
