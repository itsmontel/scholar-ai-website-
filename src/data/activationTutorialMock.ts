/**
 * Static mock for the post-signup activation tutorial.
 * Uses the same essay and annotations as landing “Sample B” (Get Out B-grade demo).
 */

import {
  DEMO_B_ANNOTATIONS,
  DEMO_B_ESSAY_CONTENT,
  DEMO_B_RUBRIC,
  type DemoAnnotation,
} from './landingPageDemoAnalysis';

export const ACTIVATION_MOCK_ESSAY_BODY = DEMO_B_ESSAY_CONTENT;

/** Same annotation set as Sample B, with `act-` ids for the analysis page. */
export const ACTIVATION_TUTORIAL_ANNOTATIONS: DemoAnnotation[] = DEMO_B_ANNOTATIONS.map((a) => ({
  ...a,
  id: `act-${a.id}`,
}));

const concern1 = DEMO_B_ANNOTATIONS.find((a) => a.id === 'b-concern-1')!;
const improve3 = DEMO_B_ANNOTATIONS.find((a) => a.id === 'b-improve-3')!;

/** Only these two cards expose Apply during the activation tour (one red, one amber). */
export const ACTIVATION_TUTORIAL_CONCERN_REVISION_ID = 'act-b-concern-1';
export const ACTIVATION_TUTORIAL_IMPROVE_REVISION_ID = 'act-b-improve-3';

export const ACTIVATION_TUTORIAL_APPLYABLE_IDS: readonly string[] = [
  ACTIVATION_TUTORIAL_CONCERN_REVISION_ID,
  ACTIVATION_TUTORIAL_IMPROVE_REVISION_ID,
];

export const ACTIVATION_CONCERN_SPAN = concern1.text;

export const ACTIVATION_CONCERN_REWRITE =
  concern1.demoRevisedText ??
  'The opening establishes racial anxiety through the couple\'s interracial relationship and the Armitage family\'s performative hospitality, which masks a far darker agenda.';

export const ACTIVATION_IMPROVE_SPAN = improve3.text;

export const ACTIVATION_IMPROVE_REWRITE =
  improve3.demoRevisedText ??
  'Chris notes that their exaggerated friendliness masks discomfort with his presence, revealing how race shapes social interactions even in supposedly progressive spaces.';

export const ACTIVATION_CONCERN_REWRITE_REASON =
  'Replaces plot summary with an analytical frame you can defend with evidence from the film.';

export const ACTIVATION_IMPROVE_REWRITE_REASON =
  'Tightens the claim about performative friendliness and makes the racial subtext explicit.';

export function activationMockWordCount(text: string = ACTIVATION_MOCK_ESSAY_BODY): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

/** Matches Sample B demo. */
export const ACTIVATION_DISPLAY_WORD_COUNT = 1619;

export const ACTIVATION_RUBRIC_CATEGORIES = DEMO_B_RUBRIC.map((c) => ({
  name: c.name,
  score: c.score,
  max: c.maxScore,
  feedback: c.feedback,
}));

export const ACTIVATION_OVERALL_SCORE = 82;
export const ACTIVATION_GRADE_LABEL = 'B (80-89%)';

const concern3 = DEMO_B_ANNOTATIONS.find((a) => a.id === 'b-concern-3')!;

export const ACTIVATION_CITATION_ISSUE = {
  quote: concern3.text,
  issue:
    'The citation lacks proper MLA formatting and contains grammatical errors in the surrounding integration.',
  fix: concern3.suggestion,
};

export const ACTIVATION_CITATION_FOLLOWUP =
  'Several citations in this draft need MLA cleanup: author-page in-text, consistent Works Cited.';

/** Markdown for the comprehensive report panel (mock). */
export const ACTIVATION_MOCK_ANALYSIS_MARKDOWN = `## Overview
This essay connects *Get Out* to hegemony, gender, microaggressions, and white privilege. The analysis is ambitious; the main work is tightening claims and MLA integration.

## Strengths
- Clear thesis on covert and overt white supremacy.
- Uses academic sources (Lull, Sue et al., Schrock & Schwalbe) to frame scenes.

## Priority fixes
- Replace vague transitions with scene-specific evidence.
- Correct MLA in-text citations (author-page; integrate quotations smoothly).`;

/** Backend-shaped grade rubric keys. */
export function buildActivationGradeRubric(): Record<
  string,
  { score: number; max_score: number; feedback: string }
> {
  const keys = [
    'thesis_and_argument',
    'response_to_question',
    'organization_and_structure',
    'writing_quality_and_clarity',
    'analysis_and_critical_thinking',
    'use_of_evidence_and_textual_support',
  ] as const;
  const cats = ACTIVATION_RUBRIC_CATEGORIES;
  const out: Record<string, { score: number; max_score: number; feedback: string }> = {};
  keys.forEach((k, i) => {
    const c = cats[i];
    out[k] = { score: c.score, max_score: c.max, feedback: c.feedback };
  });
  return out;
}

export interface ActivationPageAnnotation {
  id: string;
  type: 'strong' | 'improve' | 'concern';
  text: string;
  startIndex: number;
  endIndex: number;
  comment: string;
  suggestion?: string;
}

/** Match essay text even when apostrophes differ (ASCII vs typographic). */
function findAnnotationTextInDocument(
  content: string,
  needle: string
): { start: number; matched: string } | null {
  const candidates = [needle];
  if (needle.includes("'")) {
    candidates.push(needle.replace(/'/g, '\u2019'));
  }
  if (needle.includes('\u2019')) {
    candidates.push(needle.replace(/\u2019/g, "'"));
  }
  for (const c of candidates) {
    const i = content.indexOf(c);
    if (i >= 0) return { start: i, matched: c };
  }
  return null;
}

export function buildActivationAnnotationsForDocument(content: string): ActivationPageAnnotation[] {
  const list: ActivationPageAnnotation[] = [];
  for (const ann of ACTIVATION_TUTORIAL_ANNOTATIONS) {
    const found = findAnnotationTextInDocument(content, ann.text);
    if (!found) continue;
    const { start, matched } = found;
    list.push({
      id: ann.id,
      type: ann.type,
      text: matched,
      startIndex: start,
      endIndex: start + matched.length,
      comment: ann.comment,
      suggestion: ann.suggestion,
    });
  }
  return list;
}

export const ACTIVATION_SPECIFIC_REWRITES: Array<{ original: string; rewritten: string; reason: string }> = [
  {
    original: ACTIVATION_CONCERN_SPAN,
    rewritten: ACTIVATION_CONCERN_REWRITE,
    reason: ACTIVATION_CONCERN_REWRITE_REASON,
  },
  {
    original: ACTIVATION_IMPROVE_SPAN,
    rewritten: ACTIVATION_IMPROVE_REWRITE,
    reason: ACTIVATION_IMPROVE_REWRITE_REASON,
  },
];
