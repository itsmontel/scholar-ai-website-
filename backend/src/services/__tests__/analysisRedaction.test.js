/**
 * Free preview: highlights and the grade survive, the feedback does not.
 */
const { redactAnalysisPayload, redactAnalysisRow } = require('../analysisRedaction');

const full = {
  result: '## Overall\nStrong thesis, thin evidence.',
  overall_score: 84,
  grade_estimate: 'B',
  clarity_rating: 'Good',
  top_suggestions: ['Add a counterargument', 'Cite page numbers', 'Tighten the conclusion'],
  grade_rubric: {
    thesis_and_argument: { score: 17, max_score: 20, feedback: 'Clear claim.' },
    use_of_evidence_and_textual_support: { score: 12, max_score: 20, feedback: 'Needs quotes.' },
  },
  specific_rewrites: [{ original: 'a', rewritten: 'b', reason: 'c' }],
  annotations: [
    { id: '1', type: 'strong', text: 'In 1914', startIndex: 0, endIndex: 7, comment: 'Good hook', suggestion: 'Keep it' },
    { id: '2', type: 'concern', text: 'everyone knows', startIndex: 20, endIndex: 34, comment: 'Vague', suggestion: 'Cite a source' },
  ],
  strong_points: [{ text: 'In 1914', explanation: 'Good hook' }],
  areas_to_improve: [],
  serious_concerns: [{ text: 'everyone knows', explanation: 'Vague' }],
  rubric_alignment: { met: [] },
  original_content: 'In 1914 the war began and everyone knows why.',
};

test('keeps the highlights and the letter grade, not the score', () => {
  const r = redactAnalysisPayload(full);
  expect(r.overall_score).toBeNull();
  expect(r.grade_estimate).toBe('B');
  expect(r.annotations.map((a) => [a.id, a.type, a.text, a.startIndex, a.endIndex, a.locked])).toEqual([
    ['1', 'strong', 'In 1914', 0, 7, true],
    ['2', 'concern', 'everyone knows', 20, 34, true],
  ]);
  expect(r.original_content).toBe(full.original_content);
});

test('removes every piece of written feedback', () => {
  const r = redactAnalysisPayload(full);
  const text = JSON.stringify(r);
  for (const secret of ['Good hook', 'Keep it', 'Vague', 'Cite a source', 'Clear claim', 'Needs quotes', 'counterargument', 'Strong thesis']) {
    expect(text).not.toContain(secret);
  }
  expect(r.grade_rubric.thesis_and_argument).toEqual({ score: null, max_score: 20, feedback: '', bar: 0.9 });
  expect(r.grade_rubric.use_of_evidence_and_textual_support.bar).toBe(0.6);
  expect(r.top_suggestions).toEqual([]);
  expect(r.specific_rewrites).toBeNull();
  expect(r.clarity_rating).toBeNull();
  expect(r.rubric_alignment).toBeNull();
  expect(r.lockedCounts).toEqual({ comments: 2, topSuggestions: 3, rewrites: 1, rubricCategories: 2 });
});

test('redacts saved rows but leaves citation reviews whole', () => {
  const row = { id: 'a', analysis_type: 'comprehensive', analysis_results: full };
  expect(redactAnalysisRow(row).analysis_results.annotations[0].comment).toBe('');
  const citation = { id: 'b', analysis_type: 'citation_review', analysis_results: full };
  expect(redactAnalysisRow(citation)).toBe(citation);
});
