/**
 * Free preview of an essay analysis.
 *
 * Free accounts see where the feedback is (every highlight, in its
 * colour), the letter grade and a rough bar per rubric section, but not
 * what it says: the /100 score, exact section scores, comments,
 * suggestions, top fixes, rewrites and the written report are removed
 * here, on the server, so they never reach the browser.
 * Keys stay present with empty values so the web app and the iOS
 * decoders read the same shape as a paid result. The saved row is never
 * changed, so upgrading shows the full analysis straight away.
 */

const LOCKED_FEATURES = ['full_annotations', 'grade_rubric', 'specific_rewrites', 'top_suggestions', 'report', 'export', 'history'];

function redactAnnotations(annotations) {
  if (!Array.isArray(annotations)) return annotations ?? [];
  return annotations.map((a) => {
    if (!a || typeof a !== 'object') return a;
    const { comment, suggestion, explanation, revised, rewrite, reason, ...keep } = a;
    return { ...keep, comment: '', suggestion: '', locked: true };
  });
}

function redactPoints(points) {
  if (!Array.isArray(points)) return points ?? [];
  return points.map((p) => (p && typeof p === 'object' ? { ...p, explanation: '' } : p));
}

/** Section strength as a bar fill, rounded to the nearest 10% so the exact score can't be read off it. */
function roughBar(row) {
  const score = Number(row.score);
  const max = Number(row.max_score);
  if (!Number.isFinite(score) || !Number.isFinite(max) || max <= 0) return null;
  return Math.round(Math.max(0, Math.min(1, score / max)) * 10) / 10;
}

function redactRubric(rubric) {
  if (!rubric || typeof rubric !== 'object' || Array.isArray(rubric)) return rubric ?? null;
  const out = {};
  for (const [key, row] of Object.entries(rubric)) {
    if (!row || typeof row !== 'object') continue;
    out[key] = { score: null, max_score: row.max_score ?? null, feedback: '', bar: roughBar(row) };
  }
  return out;
}

function countOf(list) {
  return Array.isArray(list) ? list.length : 0;
}

/**
 * Redact one analysis payload. Handles both the live response
 * (camelCase extras, `rubricAlignment`) and a saved analysis_results blob
 * (`rubric_alignment`, strong_points etc).
 */
function redactAnalysisPayload(payload) {
  if (!payload || typeof payload !== 'object') return payload;
  const lockedCounts = {
    comments: countOf(payload.annotations),
    topSuggestions: countOf(payload.top_suggestions),
    rewrites: countOf(payload.specific_rewrites),
    rubricCategories: payload.grade_rubric && typeof payload.grade_rubric === 'object' ? Object.keys(payload.grade_rubric).length : 0,
  };
  const out = {
    ...payload,
    result: '',
    overall_score: null,
    annotations: redactAnnotations(payload.annotations),
    clarity_rating: null,
    top_suggestions: [],
    grade_rubric: redactRubric(payload.grade_rubric),
    specific_rewrites: null,
    lockedFeatures: LOCKED_FEATURES,
    lockedCounts,
    isPreview: true,
  };
  if ('strong_points' in payload) out.strong_points = redactPoints(payload.strong_points);
  if ('areas_to_improve' in payload) out.areas_to_improve = redactPoints(payload.areas_to_improve);
  if ('serious_concerns' in payload) out.serious_concerns = redactPoints(payload.serious_concerns);
  if ('rubric_alignment' in payload) out.rubric_alignment = null;
  if ('rubricAlignment' in payload) out.rubricAlignment = null;
  if ('ws_revision_cache' in payload) out.ws_revision_cache = {};
  if ('comprehensiveText' in payload) out.comprehensiveText = '';
  if ('recommendations' in payload) out.recommendations = [];
  if ('overall_assessment' in payload) out.overall_assessment = '';
  return out;
}

/** Only the essay grade is a preview; citation reviews come back whole. */
function isGradedFeedback(analysisType) {
  return analysisType !== 'citation_review' && analysisType !== 'citation';
}

/** Redact a document_analyses row (its analysis_results blob). */
function redactAnalysisRow(row) {
  if (!row || typeof row !== 'object' || !isGradedFeedback(row.analysis_type)) return row;
  const out = { ...row };
  // Older rows kept the report in a top-level `result` column.
  if (typeof out.result === 'string') out.result = '';
  if (out.analysis_results && typeof out.analysis_results === 'object') {
    out.analysis_results = redactAnalysisPayload(out.analysis_results);
  }
  return out;
}

module.exports = {
  LOCKED_FEATURES,
  isGradedFeedback,
  redactAnalysisPayload,
  redactAnalysisRow,
};
