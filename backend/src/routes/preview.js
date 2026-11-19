/**
 * First result before sign-up: one study pack or one essay grade, built
 * for a visitor with no account. See services/previewStore.js for the
 * limits and for how the result is handed to the account they create.
 *
 * POST /api/preview/study-pack  { inputType: 'topic' | 'notes', topic?, text? }
 * POST /api/preview/grade       { content, gradingStyle?, citationStyle? }
 */
const express = require('express');
const aiAnalysisService = require('../services/aiAnalysisService');
const creditService = require('../services/creditService');
const previewStore = require('../services/previewStore');

const router = express.Router();

const NOTES_MIN_WORDS = 50;
const NOTES_MAX_WORDS = 5000;
const TOPIC_MAX_CHARS = 200;

const wordCountOf = (s) => String(s || '').trim().split(/\s+/).filter(Boolean).length;

/** Rubric scores without the written reasoning, which waits for sign-up. */
function rubricScoresOnly(rubric) {
  if (!rubric || typeof rubric !== 'object') return null;
  const out = {};
  for (const [key, entry] of Object.entries(rubric)) {
    out[key] = entry && typeof entry === 'object' ? { ...entry, feedback: '', feedbackLocked: true } : entry;
  }
  return out;
}

router.post('/study-pack', async (req, res) => {
  const inputType = req.body?.inputType === 'topic' ? 'topic' : 'notes';
  let input = '';

  if (inputType === 'topic') {
    input = String(req.body?.topic ?? req.body?.text ?? '').trim();
    if (!input) return res.status(400).json({ success: false, message: 'Type what the exam is on first.' });
    if (input.length > TOPIC_MAX_CHARS) {
      return res.status(400).json({ success: false, message: `Keep the topic under ${TOPIC_MAX_CHARS} characters.` });
    }
  } else {
    input = String(req.body?.text ?? '').trim();
    const words = wordCountOf(input);
    if (words < NOTES_MIN_WORDS) {
      return res.status(400).json({ success: false, message: `Add at least ${NOTES_MIN_WORDS} words of notes. These have ${words}.` });
    }
    if (words > NOTES_MAX_WORDS) {
      return res.status(400).json({
        success: false,
        message: `Notes can be up to ${NOTES_MAX_WORDS.toLocaleString()} words before you sign up. These have ${words.toLocaleString()}.`,
      });
    }
  }

  const check = previewStore.checkPreview(req.ip);
  if (!check.allowed) return res.status(429).json(previewStore.previewLimitResponse(check.reason));

  previewStore.startPreview(req.ip);
  try {
    const pack = await aiAnalysisService.generateStudyPack(input, 'free', { inputType });
    const token = previewStore.putPreview('pack', { pack, inputType, input });
    res.json({ success: true, token, data: { ...pack, created_at: new Date().toISOString() } });
  } catch (error) {
    console.error('Preview study pack error:', error);
    res.status(500).json({ success: false, message: 'That did not work. Please try again.' });
  } finally {
    previewStore.finishPreview(req.ip);
  }
});

router.post('/grade', async (req, res) => {
  const content = String(req.body?.content ?? '').trim();
  const words = wordCountOf(content);
  if (words < creditService.FREE_GRADE_MIN_WORDS) {
    return res.status(400).json({
      success: false,
      code: 'TOO_SHORT',
      message: `Paste at least ${creditService.FREE_GRADE_MIN_WORDS} words so the grade means something. This has ${words.toLocaleString()}.`,
    });
  }
  if (words > creditService.FREE_GRADE_MAX_WORDS) {
    return res.status(400).json({
      success: false,
      code: 'TOO_LONG',
      message: `Free grades cover up to ${creditService.FREE_GRADE_MAX_WORDS.toLocaleString()} words and this has ${words.toLocaleString()}.`,
    });
  }
  const gradingStyle = typeof req.body?.gradingStyle === 'string' ? req.body.gradingStyle.slice(0, 20) : 'us';
  const citationStyle = typeof req.body?.citationStyle === 'string' ? req.body.citationStyle.slice(0, 20) : 'None';

  const check = previewStore.checkPreview(req.ip);
  if (!check.allowed) return res.status(429).json(previewStore.previewLimitResponse(check.reason));

  previewStore.startPreview(req.ip);
  try {
    const analysisResult = await aiAnalysisService.analyzeDocument(null, content, 'comprehensive', null, citationStyle, gradingStyle);
    const annotations = Array.isArray(analysisResult?.annotations) ? analysisResult.annotations : [];
    const countType = (type) => annotations.filter((a) => a && a.type === type).length;
    const token = previewStore.putPreview('grade', { analysisResult, content, gradingStyle, citationStyle });
    const top = Array.isArray(analysisResult?.top_suggestions) ? analysisResult.top_suggestions : [];
    res.json({
      success: true,
      token,
      data: {
        overall_score: analysisResult?.overall_score ?? null,
        grade_estimate: analysisResult?.grade_estimate ?? null,
        grade_rubric: rubricScoresOnly(analysisResult?.grade_rubric),
        comments: {
          total: annotations.length,
          strong: countType('strong'),
          improve: countType('improve'),
          concern: countType('concern'),
        },
        fixes: top.length,
        wordCount: words,
      },
    });
  } catch (error) {
    console.error('Preview grade error:', error);
    res.status(500).json({ success: false, message: 'That did not work. Please try again.' });
  } finally {
    previewStore.finishPreview(req.ip);
  }
});

module.exports = router;
