/**
 * Free report: the grade and every rubric score stay; the first quarter
 * of the essay is marked in full; the rest of the essay, most rubric
 * feedback, the extra top suggestions and every rewrite do not.
 */
const { redactAnalysisPayload, redactAnalysisRow, previewCutoffIndex, LOCKED_FEATURES } = require('../analysisRedaction');

// 8 sentences of exactly 40 characters = 320 characters. 25% is index 80,
// the first letter of sentence 3, so the cut carries to the end of
// sentence 3 (index 119).
const sentences = Array.from({ length: 8 }, (_, i) => `S${i + 1} `.padEnd(38, 'w') + '. ');
const essay = sentences.join('');
const at = (i) => i * 40;

const ann = (id, type, sentence, extra = {}) => ({
  id, type, text: `s${sentence}`, startIndex: at(sentence - 1), endIndex: at(sentence - 1) + 30,
  comment: `comment ${id}`, suggestion: `rewrite ${id}`, ...extra,
});

const writtenAnalysis = Array.from({ length: 20 }, (_, i) => `Line ${i + 1} of the written analysis about the whole essay.`).join('\n');

const full = {
  result: writtenAnalysis,
  overall_score: 84,
  grade_estimate: 'B',
  clarity_rating: 'Good',
  top_suggestions: ['Add a counterargument', 'Cite page numbers', 'Tighten the conclusion'],
  grade_rubric: {
    thesis_and_argument: { score: 17, max_score: 20, feedback: 'Clear claim.' },
    response_to_question: { score: 16, max_score: 20, feedback: 'On topic.' },
    use_of_evidence_and_textual_support: { score: 12, max_score: 15, feedback: 'Needs quotes.' },
    analysis_and_critical_thinking: { score: 15, max_score: 20, feedback: 'Goes deeper later.' },
    organization_and_structure: { score: 13, max_score: 15, feedback: 'Transitions.' },
    writing_quality_and_clarity: { score: 9, max_score: 10, feedback: 'Clean prose.' },
  },
  specific_rewrites: [{ original: 'a', rewritten: 'b', reason: 'c' }],
  annotations: [
    ann('1', 'strong', 1),
    ann('2', 'concern', 2, { revised: 'Historians agree' }),
    ann('3', 'improve', 4),
    ann('4', 'concern', 6),
    ann('5', 'concern', 7),
    ann('6', 'strong', 8),
  ],
  strong_points: [{ text: 's1', explanation: 'comment 1' }, { text: 's8', explanation: 'comment 6' }],
  areas_to_improve: [{ text: 's4', explanation: 'comment 3' }],
  serious_concerns: [{ text: 's2', explanation: 'comment 2' }, { text: 's6', explanation: 'comment 4' }],
  rubric_alignment: { met: [] },
  ws_revision_cache: { '2': 'Historians agree' },
  original_content: essay,
};

test('the cut lands at the end of the sentence a quarter of the way in', () => {
  expect(essay.length).toBe(320);
  expect(previewCutoffIndex(essay, full.annotations)).toBe(at(3) - 1);
});

test('keeps the grade, the score and every rubric score', () => {
  const r = redactAnalysisPayload(full);
  expect(r.overall_score).toBe(84);
  expect(r.grade_estimate).toBe('B');
  expect(r.clarity_rating).toBe('Good');
  expect(Object.values(r.grade_rubric).map((e) => e.score)).toEqual([17, 16, 12, 15, 13, 9]);
  expect(r.original_content).toBe(essay);
  expect(r.isPreview).toBe(true);
  expect(r.lockedFeatures).toEqual(LOCKED_FEATURES);
});

test('marks only the first quarter of the essay and counts the rest', () => {
  const r = redactAnalysisPayload(full);
  expect(r.annotations.map((a) => [a.id, a.comment, a.rewriteLocked])).toEqual([
    ['1', 'comment 1', true],
    ['2', 'comment 2', true],
  ]);
  expect(r.preview.hidden).toEqual({ total: 4, strong: 1, improve: 1, concern: 2 });
  expect(r.preview.cutoffIndex).toBeGreaterThanOrEqual(at(1) + 30);
  expect(r.strong_points).toEqual([{ text: 's1', explanation: 'comment 1' }]);
  expect(r.areas_to_improve).toEqual([]);
  expect(r.serious_concerns).toEqual([{ text: 's2', explanation: 'comment 2' }]);
  const text = JSON.stringify(r);
  for (const hidden of ['comment 3', 'comment 4', 'comment 5', 'comment 6']) expect(text).not.toContain(hidden);
});

test('opens rubric feedback on 2 sections and the first top suggestion only', () => {
  const r = redactAnalysisPayload(full);
  const feedback = Object.values(r.grade_rubric).map((e) => e.feedback);
  expect(feedback).toEqual(['Clear claim.', 'On topic.', '', '', '', '']);
  expect(r.preview.rubricFeedbackLocked).toBe(4);
  expect(r.top_suggestions).toEqual(['Add a counterargument']);
  expect(r.preview.topSuggestionsLocked).toBe(2);
});

test('cuts the written analysis to its opening', () => {
  const r = redactAnalysisPayload(full);
  expect(r.result.length).toBeLessThan(writtenAnalysis.length / 2);
  expect(writtenAnalysis.startsWith(r.result)).toBe(true);
  expect(r.result).not.toContain('Line 20');
});

test('removes every rewrite and the rubric check', () => {
  const r = redactAnalysisPayload(full);
  const text = JSON.stringify(r);
  for (const secret of ['rewrite 1', 'rewrite 2', 'Historians agree', 'rewritten']) expect(text).not.toContain(secret);
  expect(r.annotations.every((a) => a.suggestion === '' && !('revised' in a))).toBe(true);
  expect(r.specific_rewrites).toBeNull();
  expect(r.rubric_alignment).toBeNull();
  expect(r.ws_revision_cache).toEqual({});
  expect(r.lockedCounts).toEqual({ comments: 6, rewrites: 7, topSuggestions: 3, rubricCategories: 6 });
});

test('a live response uses the essay passed in when the payload has none', () => {
  const { original_content, ...live } = full;
  const r = redactAnalysisPayload(live, { content: essay });
  expect(r.annotations.map((a) => a.id)).toEqual(['1', '2']);
});

test('redacts saved rows but leaves citation reviews whole', () => {
  const row = { id: 'a', analysis_type: 'comprehensive', analysis_results: full };
  const out = redactAnalysisRow(row).analysis_results;
  expect(out.annotations).toHaveLength(2);
  expect(out.annotations[0].suggestion).toBe('');
  const citation = { id: 'b', analysis_type: 'citation_review', analysis_results: full };
  expect(redactAnalysisRow(citation)).toBe(citation);
});
