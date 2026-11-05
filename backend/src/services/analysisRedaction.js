/**
 * Free report of an essay analysis.
 *
 * A free grade shows the first quarter of the essay exactly as Pro sees
 * it: every highlight and comment there. The rest of the essay comes back
 * with no highlights at all; only the counts of what is hidden there
 * (serious concerns, needs work, strong points) are sent, so the page can
 * say what Pro unlocks. Also for everyone free:
 *
 *   - the grade and the /100 score, whole (the landing page promises them)
 *   - every rubric score; the written feedback on the first 2 sections only
 *   - the first top suggestion only
 *   - the written analysis cut to its opening part
 *   - no rewrites, no rubric check, no export (as before)
 *
 * All of it is cut here, on the server, so the hidden part never reaches
 * the browser. Keys stay present so the web app and the iOS decoders read
 * the same shape as a paid result. The saved row is never changed, so
 * upgrading shows the full analysis straight away.
 */

const LOCKED_FEATURES = ['apply_revisions', 'specific_rewrites', 'rubric_alignment', 'export'];

/** Share of the essay a free grade marks up in full. */
const PREVIEW_SHARE = 0.25;
/** Rubric sections whose written feedback stays open on a free grade. */
const OPEN_RUBRIC_SECTIONS = 2;
/** Top suggestions left open on a free grade. */
const OPEN_TOP_SUGGESTIONS = 1;
/** Share of the written analysis kept for a free grade. */
const WRITTEN_ANALYSIS_SHARE = 0.35;

const TYPES = ['strong', 'improve', 'concern'];

function countOf(list) {
  return Array.isArray(list) ? list.length : 0;
}

function isNum(n) {
  return typeof n === 'number' && Number.isFinite(n);
}

/** Where the open part of the essay ends: 25% in, carried to the end of that sentence. */
function previewCutoffIndex(content, annotations) {
  let length = typeof content === 'string' ? content.length : 0;
  if (!length) {
    // No text to measure (old rows): fall back to how far the highlights reach.
    length = (annotations || []).reduce((m, a) => (a && isNum(a.endIndex) ? Math.max(m, a.endIndex) : m), 0);
  }
  if (!length) return 0;
  const target = Math.floor(length * PREVIEW_SHARE);
  if (typeof content === 'string' && content.length) {
    const rest = content.slice(target);
    const m = rest.match(/[.!?]["”’')\]]*(\s|$)/);
    if (m && typeof m.index === 'number') return Math.min(content.length, target + m.index + m[0].trimEnd().length);
  }
  return target;
}

/** Drop the rewrite from each highlight; the comment itself stays. */
function stripRewrite(a) {
  if (!a || typeof a !== 'object') return a;
  const { suggestion, revised, rewrite, ...keep } = a;
  return { ...keep, suggestion: '', rewriteLocked: true };
}

/**
 * Split the highlights at the cut. A highlight that starts before the cut
 * is kept whole, and the cut moves to its end so it is never sliced.
 */
function splitAnnotations(annotations, cutoff) {
  const open = [];
  const hidden = { total: 0, strong: 0, improve: 0, concern: 0 };
  let end = cutoff;
  for (const a of Array.isArray(annotations) ? annotations : []) {
    if (!a || typeof a !== 'object') continue;
    if (isNum(a.startIndex) && a.startIndex < cutoff) {
      open.push(stripRewrite(a));
      if (isNum(a.endIndex)) end = Math.max(end, a.endIndex);
    } else {
      hidden.total += 1;
      if (TYPES.includes(a.type)) hidden[a.type] += 1;
    }
  }
  return { open, hidden, end };
}

/** Keep every rubric score; blank the written feedback after the first few sections. */
function lockRubricFeedback(rubric) {
  if (!rubric || typeof rubric !== 'object') return { rubric, locked: 0 };
  let locked = 0;
  const out = {};
  Object.keys(rubric).forEach((key, i) => {
    const entry = rubric[key];
    if (i < OPEN_RUBRIC_SECTIONS || !entry || typeof entry !== 'object') {
      out[key] = entry;
      return;
    }
    locked += 1;
    out[key] = { ...entry, feedback: '', feedbackLocked: true };
  });
  return { rubric: out, locked };
}

/** The opening of the written analysis, cut at a line break so markdown stays whole. */
function trimWrittenAnalysis(text) {
  if (typeof text !== 'string' || text.length < 400) return text;
  const target = Math.floor(text.length * WRITTEN_ANALYSIS_SHARE);
  const nl = text.indexOf('\n', target);
  return text.slice(0, nl === -1 ? target : nl).trimEnd();
}

function listFrom(annotations, type) {
  return annotations
    .filter((a) => a && a.type === type)
    .map((a) => ({ text: a.text, explanation: a.comment }));
}

/**
 * Redact one analysis payload. Handles both the live response
 * (camelCase extras, `rubricAlignment`) and a saved analysis_results blob
 * (`rubric_alignment`, `original_content`, strong_points etc).
 * `opts.content` is the essay text when the payload does not carry it.
 */
function redactAnalysisPayload(payload, opts = {}) {
  if (!payload || typeof payload !== 'object') return payload;
  const annotations = Array.isArray(payload.annotations) ? payload.annotations : [];
  const content = typeof opts.content === 'string' ? opts.content : payload.original_content;

  const cutoff = previewCutoffIndex(content, annotations);
  const { open, hidden, end } = splitAnnotations(annotations, cutoff);
  const { rubric, locked: rubricFeedbackLocked } = lockRubricFeedback(payload.grade_rubric);
  const topSuggestions = Array.isArray(payload.top_suggestions) ? payload.top_suggestions : null;

  const lockedCounts = {
    comments: annotations.length,
    rewrites: countOf(payload.specific_rewrites)
      + annotations.filter((a) => a && typeof a === 'object' && (a.suggestion || a.revised || a.rewrite)).length,
    topSuggestions: countOf(topSuggestions),
    rubricCategories: payload.grade_rubric && typeof payload.grade_rubric === 'object' ? Object.keys(payload.grade_rubric).length : 0,
  };

  const out = {
    ...payload,
    annotations: open,
    grade_rubric: rubric ?? payload.grade_rubric ?? null,
    top_suggestions: topSuggestions ? topSuggestions.slice(0, OPEN_TOP_SUGGESTIONS) : payload.top_suggestions ?? null,
    result: trimWrittenAnalysis(payload.result),
    specific_rewrites: null,
    lockedFeatures: LOCKED_FEATURES,
    lockedCounts,
    preview: {
      share: PREVIEW_SHARE,
      cutoffIndex: end,
      hidden,
      rubricFeedbackLocked,
      topSuggestionsLocked: Math.max(0, countOf(topSuggestions) - OPEN_TOP_SUGGESTIONS),
    },
    isPreview: true,
  };
  if ('strong_points' in payload) out.strong_points = listFrom(open, 'strong');
  if ('areas_to_improve' in payload) out.areas_to_improve = listFrom(open, 'improve');
  if ('serious_concerns' in payload) out.serious_concerns = listFrom(open, 'concern');
  if ('rubric_alignment' in payload) out.rubric_alignment = null;
  if ('rubricAlignment' in payload) out.rubricAlignment = null;
  if ('ws_revision_cache' in payload) out.ws_revision_cache = {};
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
  if (out.analysis_results && typeof out.analysis_results === 'object') {
    out.analysis_results = redactAnalysisPayload(out.analysis_results);
  }
  return out;
}

module.exports = {
  LOCKED_FEATURES,
  PREVIEW_SHARE,
  OPEN_RUBRIC_SECTIONS,
  isGradedFeedback,
  previewCutoffIndex,
  redactAnalysisPayload,
  redactAnalysisRow,
};
