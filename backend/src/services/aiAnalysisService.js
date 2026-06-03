const OpenAI = require('openai');
const subscriptionService = require('./subscriptionService');

/**
 * Build chat.completions params for either a reasoning model (GPT-5 /
 * o-series) or a classic model.
 *  - Reasoning models reject a custom `temperature`, bill "thinking"
 *    tokens against `max_completion_tokens`, and accept a
 *    `reasoning_effort` knob (minimal | low | medium | high | xhigh).
 *  - Classic models (gpt-4o-mini, gpt-4.1-*) use `temperature` +
 *    `max_tokens` and have no reasoning effort.
 * Sending the wrong shape 400s the request (which then silently falls
 * back to gpt-4o-mini), so we branch on the model id here.
 */
function buildChatParams(model, messages, maxTokens, reasoningEffort = null, temperature = 0.3) {
  const isReasoning = /^(gpt-5|o[0-9])/i.test(model);
  if (isReasoning) {
    const params = { model, messages, max_completion_tokens: maxTokens };
    if (reasoningEffort) params.reasoning_effort = reasoningEffort;
    return params;
  }
  return { model, messages, max_tokens: maxTokens, temperature };
}

/**
 * Get 30 days from now (used for free user data expiration)
 * Free user data (citations, quizzes, flashcards, crosswords) expires 30 days after creation
 */
function getExpiresAt30Days() {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  return expiresAt.toISOString();
}

/** Generic / placeholder phrases: never show these to users; prefer comment or quote-anchored fallback. */
const FORBIDDEN_SUGGESTION_PHRASES = [
  /add a concrete example,?\s*clarify the connection to your argument,?\s*or develop the idea further with specifics/i,
  /add a specific example or develop the idea further with concrete detail/i,
  /add a concrete example or specific detail to illustrate your point,?\s*or develop the idea further/i,
  /add one concrete example or specific detail to illustrate your point/i,
  /this demonstrates that \[X\].*which matters because \[Y\]/i,
  /\[X\].*\[Y\]/,
  /revise with a concrete example:\s*e\.g\./i,
];

const FORBIDDEN_COMMENT_PHRASES = [
  /well-?suited for academic work/i,
  /appropriate complexity/i,
  /sophisticated academic discourse/i,
  /complexity level/i,
  /excellent for academic discourse/i,
];

/**
 * If suggestion is generic or placeholder, prefer the analytical comment; else a quote-anchored nudge.
 */
function sanitizeSuggestion(suggestion, type, comment = '', quotedText = '') {
  if (!suggestion || typeof suggestion !== 'string') {
    return fallbackSuggestion(type, comment, quotedText);
  }
  let trimmed = suggestion.trim();
  for (const pattern of FORBIDDEN_SUGGESTION_PHRASES) {
    if (pattern.test(trimmed)) {
      return pickBetterSuggestion(trimmed, type, comment, quotedText);
    }
  }
  for (const pattern of FORBIDDEN_COMMENT_PHRASES) {
    if (pattern.test(trimmed)) {
      return pickBetterSuggestion(trimmed, type, comment, quotedText);
    }
  }
  return trimmed;
}

function pickBetterSuggestion(original, type, comment, quotedText) {
  const c = (comment && String(comment).trim().length > 15) ? String(comment).trim() : '';
  if (c && !FORBIDDEN_COMMENT_PHRASES.some((p) => p.test(c)) && c !== original) {
    return c;
  }
  return fallbackSuggestion(type, c || original, quotedText);
}

function fallbackSuggestion(type, comment, quotedText) {
  const q = (quotedText && String(quotedText).trim().length > 0)
    ? String(quotedText).trim().slice(0, 120) + (String(quotedText).length > 120 ? '…' : '')
    : '';
  if (type === 'strong') {
    return q
      ? `Keep this pattern: the idea in "${q}" already works. Extend the same clarity to adjacent paragraphs.`
      : 'Keep this pattern in the next section: same clarity and one idea per sentence.';
  }
  if (type === 'improve' || type === 'concern') {
    return q
      ? `Edit the highlighted words above. Add one real example, source, or definition that appears elsewhere in your draft and tie it to this sentence.`
      : 'Edit the highlighted passage: add one concrete detail from your own paper (a name, number, or quote you already use).';
  }
  return comment || 'See the feedback above the highlight.';
}

/** Strip boilerplate praise from strength comments; re-anchor to the student's words. */
function sanitizeStrengthComment(comment, quotedText) {
  if (!comment || typeof comment !== 'string') return comment;
  const t = comment.trim();
  for (const pattern of FORBIDDEN_COMMENT_PHRASES) {
    if (pattern.test(t)) {
      const preview = quotedText && String(quotedText).trim().length
        ? String(quotedText).trim().slice(0, 100) + (String(quotedText).length > 100 ? '…' : '')
        : '';
      return preview
        ? `Strong use of language here: "${preview}" — carry this specificity forward where you summarize or conclude.`
        : 'Strong passage — name what works (your claim, a defined term, or evidence) in your next revision pass.';
    }
  }
  return t;
}

class AIAnalysisService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Get slide count for lesson generation based on word count.
   * < 1000 words: 6 slides | 1000-2000: 6-8 | 2000-5000: 8-10 | 5000+: 10+ (capped at 25)
   */
  getSlideCountForWordCount(wordCount) {
    if (wordCount < 1000) return 6;
    if (wordCount < 2000) return 6 + Math.min(2, Math.floor((wordCount - 1000) / 500));
    if (wordCount < 5000) return 8 + Math.min(2, Math.floor((wordCount - 2000) / 1500));
    return Math.min(25, 10 + Math.floor((wordCount - 5000) / 1000));
  }

  /**
   * Search for relevant citations based on a research topic or question
   * @param {string} researchTopic - The research topic or essay question
   * @param {string} citationStyle - Citation style (APA, Harvard, etc.)
   * @param {number} numberOfCitations - Number of citations to generate
   * @param {number} minYear - Minimum publication year (optional)
   * @param {string} yearRange - Year range selection (e.g., '5', '10', 'all')
   * @returns {Object} Citation search results
   */
  async searchCitations(researchTopic, citationStyle = 'APA', numberOfCitations = 10, minYear = null, yearRange = 'all') {
    try {
      // Check if OpenAI API key is configured
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
        console.log('🤖 Using mock citation search (OpenAI API key not configured)');
        return await this.mockCitationSearch(researchTopic, citationStyle, numberOfCitations);
      }

      const searchPrompt = this.getCitationSearchPrompt(researchTopic, citationStyle, numberOfCitations, minYear, yearRange);
      
      // Use specified model for citation search
      const selectedModel = process.env.OPENAI_STANDARD_MODEL || 'gpt-4.1-mini';
      const maxTokens = 4000;

      const completion = await this.openai.chat.completions.create({
        model: selectedModel,
        messages: [
          {
            role: 'system',
            content: this.getCitationSearchSystemPrompt()
          },
          {
            role: 'user',
            content: searchPrompt
          }
        ],
        max_tokens: maxTokens,
        temperature: 0.7, // Slightly higher for more diverse results
      });

      const searchResult = completion.choices[0].message.content;
      
      // Parse citation search results
      const parsedCitations = this.parseCitationSearchResults(searchResult, citationStyle);
      
      return {
        success: true,
        searchType: 'citation_search',
        researchTopic: researchTopic,
        citations: parsedCitations.citations,
        searchStrategies: parsedCitations.searchStrategies,
        keywords: parsedCitations.keywords,
        citationStyle: citationStyle,
        yearRange: yearRange,
        minYear: minYear,
        timestamp: new Date().toISOString(),
        model: selectedModel
      };
    } catch (error) {
      console.error('Citation Search Error:', error);
      throw new Error(`Citation search failed: ${error.message}`);
    }
  }

  /**
   * Analyze a document with the specified analysis type
   * @param {string} documentId - The document ID
   * @param {string} content - The document content
   * @param {string} analysisType - Type of analysis to perform
   * @param {string} userId - The user ID
   * @param {string} citationStyle - Citation style (APA, Harvard, etc.)
   * @returns {Object} Analysis results
   */
  async analyzeCitationReview(content, citationStyle = 'APA') {
    try {
      // Check if OpenAI API key is configured
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
        console.log('🤖 Using mock citation review (OpenAI API key not configured)');
        return await this.mockCitationReview(content, citationStyle);
      }

      const analysisPrompt = this.getCitationReviewPrompt(content, citationStyle);
      
      // Use standard model for citation review (no plan-based selection needed)
      const selectedModel = process.env.OPENAI_STANDARD_MODEL || 'gpt-4o-mini';
      const maxTokens = 6000; // Sufficient for citation analysis

      const completion = await this.openai.chat.completions.create({
        model: selectedModel,
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt('citation_review')
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        max_tokens: maxTokens,
        temperature: 0.2, // Lower temperature for more consistent citation analysis
      });

      const analysisResult = completion.choices[0].message.content;
      
      // Parse citation-specific analysis
      const citationAnalysis = this.parseCitationAnalysis(analysisResult, content);
      
      return {
        success: true,
        analysisType: 'citation_review',
        result: citationAnalysis.formattedResult,
        annotations: citationAnalysis.annotations,
        citationStyle: citationStyle,
        timestamp: new Date().toISOString(),
        model: selectedModel,
        // Note: No documentId - this is not saved to database
        temporary: true
      };
    } catch (error) {
      console.error('Citation Review Error:', error);
      throw new Error(`Citation review failed: ${error.message}`);
    }
  }

  async analyzeDocument(documentId, content, analysisType, userId, citationStyle = 'None', gradingStyle = 'us') {
    try {
      // Handle citation review as a special case (temporary, not saved)
      if (analysisType === 'citation_review') {
        console.log('🔍 Performing citation review analysis (temporary)');
        return await this.analyzeCitationReview(content, citationStyle);
      }

      // Check if OpenAI API key is configured
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
        console.log('🤖 Using mock AI analysis (OpenAI API key not configured)');
        return await this.mockAnalysis(documentId, content, analysisType, userId);
      }

      // Model ladder (overridable via env):
      //   Free          → gpt-4o-mini       (classic, no reasoning effort)
      //   Pro + Premium → gpt-5.4-mini      at medium reasoning effort
      let userPlan = 'free';
      let selectedModel = process.env.OPENAI_STANDARD_MODEL || 'gpt-4o-mini';
      let maxTokens = 5000; // Default for free
      let reasoningEffort = null; // only set for reasoning models (paid)

      try {
        const { plan } = await subscriptionService.getUserSubscriptionDetails(userId);
        const effPlan = subscriptionService.normalizePlanForLimits(plan);
        userPlan = subscriptionService.isPaidSubscriptionTier(plan) ? effPlan : 'free';

        if (subscriptionService.isPaidSubscriptionTier(plan)) {
          selectedModel = process.env.OPENAI_PREMIUM_MODEL || 'gpt-5.4-mini';
          reasoningEffort = process.env.OPENAI_REASONING_EFFORT || 'medium';
          maxTokens = 15000; // reasoning tokens share this budget
        } else {
          selectedModel = process.env.OPENAI_STANDARD_MODEL || 'gpt-4o-mini';
          reasoningEffort = null;
          maxTokens = 5000;
        }
      } catch (planErr) {
        // If plan lookup fails, keep free defaults
        console.log('Could not fetch plan, using defaults');
      }

      const analysisPrompt = this.getAnalysisPrompt(analysisType, content, citationStyle, userPlan, gradingStyle);

      const messages = [
        { role: 'system', content: this.getSystemPrompt(analysisType) },
        { role: 'user', content: analysisPrompt },
      ];

      let completion;
      try {
        completion = await this.openai.chat.completions.create(
          buildChatParams(selectedModel, messages, maxTokens, reasoningEffort)
        );
      } catch (modelErr) {
        // If the premium/reasoning model fails (bad model id, param
        // mismatch, quota…), retry with the reliable classic default.
        if (selectedModel !== 'gpt-4o-mini') {
          console.log(`Model ${selectedModel} failed, falling back to gpt-4o-mini`);
          selectedModel = 'gpt-4o-mini';
          completion = await this.openai.chat.completions.create(
            buildChatParams('gpt-4o-mini', messages, maxTokens, null)
          );
        } else {
          throw modelErr;
        }
      }

      const analysisResult = completion.choices[0].message.content;
      
      // Parse structured analysis and extract annotations
      const structuredAnalysis = this.parseStructuredAnalysis(analysisResult, content, userPlan, gradingStyle);
      
      // Save analysis to database (temporarily disabled for demo)
      // await this.saveAnalysis(documentId, userId, analysisType, analysisResult, content);
      
      return {
        success: true,
        analysisType,
        result: structuredAnalysis.formattedResult,
        annotations: structuredAnalysis.annotations,
        documentId,
        timestamp: new Date().toISOString(),
        model: selectedModel,
        overall_score: structuredAnalysis.overall_score,
        grade_estimate: structuredAnalysis.grade_estimate,
        clarity_rating: structuredAnalysis.clarity_rating,
        top_suggestions: structuredAnalysis.top_suggestions,
        grade_rubric: structuredAnalysis.grade_rubric,
        specific_rewrites: structuredAnalysis.specific_rewrites
      };
    } catch (error) {
      console.error('AI Analysis Error:', error);
      throw new Error(`Analysis failed: ${error.message}`);
    }
  }

  /**
   * Analyze an essay against a rubric or set of requirements
   * Runs as a separate analysis pass after the standard essay analysis
   */
  async analyzeRubricAlignment(essayContent, rubricContent, userId) {
    try {
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
        console.log('🤖 Using mock rubric analysis (OpenAI API key not configured)');
        return this.mockRubricAnalysis();
      }

      let selectedModel = process.env.OPENAI_STANDARD_MODEL || 'gpt-4o-mini';
      let maxTokens = 6000;
      let reasoningEffort = null;

      try {
        const { plan } = await subscriptionService.getUserSubscriptionDetails(userId);
        if (subscriptionService.isPaidSubscriptionTier(plan)) {
          // Pro + Premium → gpt-5.4-mini at medium reasoning effort.
          selectedModel = process.env.OPENAI_PREMIUM_MODEL || 'gpt-5.4-mini';
          reasoningEffort = process.env.OPENAI_REASONING_EFFORT || 'medium';
          maxTokens = 12000; // headroom so reasoning tokens don't truncate the JSON
        }
      } catch (planErr) {
        console.log('Could not fetch plan for rubric analysis, using defaults');
      }

      const systemPrompt = `You are an expert academic assessor who evaluates essays against rubrics and assignment requirements. You provide clear, actionable feedback that helps students understand exactly where their essay meets, partially meets, or falls short of each rubric criterion. The student is at college/university level. Use rigorous academic standards.`;

      const userPrompt = `Below is a student's essay and the rubric/requirements it should be evaluated against.

=== RUBRIC / REQUIREMENTS ===
${rubricContent}

=== STUDENT'S ESSAY ===
${essayContent}

Please evaluate the essay against the rubric/requirements and return your analysis in the following JSON format:

{
  "overall_rubric_assessment": "A 2-3 sentence overview of how well the essay meets the rubric requirements overall.",
  "criteria": [
    {
      "criterion": "Name of this rubric criterion or requirement",
      "status": "met" | "partially_met" | "not_met",
      "score_estimate": "If the rubric has point values, estimate the score (e.g. '8/10'). Otherwise use 'N/A'.",
      "assessment": "Detailed explanation of how the essay performs on this criterion",
      "evidence": "A direct quote from the essay that demonstrates the assessment (or 'No relevant content found' if the criterion is not addressed)",
      "suggestions": ["Specific, actionable suggestion 1", "Specific, actionable suggestion 2"]
    }
  ],
  "missing_elements": ["List of requirements from the rubric that the essay does not address at all"],
  "priority_improvements": ["Top 3-5 most impactful changes the student should make to better meet the rubric requirements, ordered by importance"]
}

IMPORTANT:
- Extract EVERY criterion or requirement from the rubric, even if the essay does not address it.
- For each criterion, quote specific text from the essay as evidence.
- Be constructive and specific in suggestions — tell the student exactly what to add or change and where.
- If the rubric includes a grading scale or point breakdown, estimate scores for each criterion.`;

      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ];

      let completion;
      try {
        completion = await this.openai.chat.completions.create(
          buildChatParams(selectedModel, messages, maxTokens, reasoningEffort)
        );
      } catch (modelErr) {
        if (selectedModel !== 'gpt-4o-mini') {
          console.log(`Model ${selectedModel} failed for rubric analysis, falling back to gpt-4o-mini`);
          selectedModel = 'gpt-4o-mini';
          completion = await this.openai.chat.completions.create(
            buildChatParams('gpt-4o-mini', messages, maxTokens, null)
          );
        } else {
          throw modelErr;
        }
      }

      const rawResult = completion.choices[0].message.content;
      const parsed = this.parseRubricAnalysis(rawResult);

      return {
        success: true,
        result: parsed.formattedResult,
        criteria: parsed.criteria,
        missingElements: parsed.missingElements,
        priorityImprovements: parsed.priorityImprovements,
        overallAssessment: parsed.overallAssessment,
        timestamp: new Date().toISOString(),
        model: selectedModel
      };
    } catch (error) {
      console.error('Rubric Analysis Error:', error);
      throw new Error(`Rubric analysis failed: ${error.message}`);
    }
  }

  parseRubricAnalysis(rawResult) {
    try {
      const jsonMatch = rawResult.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return {
          formattedResult: rawResult,
          criteria: [],
          missingElements: [],
          priorityImprovements: [],
          overallAssessment: ''
        };
      }

      const data = JSON.parse(jsonMatch[0]);
      const criteria = data.criteria || [];
      const missingElements = data.missing_elements || [];
      const priorityImprovements = data.priority_improvements || [];
      const overallAssessment = data.overall_rubric_assessment || '';

      let formatted = `# Rubric Alignment Analysis\n\n`;
      formatted += `## Overall Assessment\n${overallAssessment}\n\n`;

      const metCount = criteria.filter(c => c.status === 'met').length;
      const partialCount = criteria.filter(c => c.status === 'partially_met').length;
      const notMetCount = criteria.filter(c => c.status === 'not_met').length;

      formatted += `## Score Summary\n`;
      formatted += `- **Met:** ${metCount} criteria\n`;
      formatted += `- **Partially Met:** ${partialCount} criteria\n`;
      formatted += `- **Not Met:** ${notMetCount} criteria\n\n`;

      formatted += `## Criterion-by-Criterion Breakdown\n\n`;
      criteria.forEach((c, i) => {
        const statusIcon = c.status === 'met' ? '✅' : c.status === 'partially_met' ? '⚠️' : '❌';
        formatted += `### ${statusIcon} ${c.criterion}\n`;
        if (c.score_estimate && c.score_estimate !== 'N/A') {
          formatted += `**Estimated Score:** ${c.score_estimate}\n\n`;
        }
        formatted += `${c.assessment}\n\n`;
        if (c.evidence && c.evidence !== 'No relevant content found') {
          formatted += `**Evidence from essay:** "${c.evidence}"\n\n`;
        }
        if (c.suggestions && c.suggestions.length > 0) {
          formatted += `**Suggestions:**\n`;
          c.suggestions.forEach(s => {
            formatted += `- ${s}\n`;
          });
          formatted += '\n';
        }
      });

      if (missingElements.length > 0) {
        formatted += `## Missing Elements\nThe following rubric requirements are not addressed in the essay:\n`;
        missingElements.forEach(el => {
          formatted += `- ❌ ${el}\n`;
        });
        formatted += '\n';
      }

      if (priorityImprovements.length > 0) {
        formatted += `## Priority Improvements\n`;
        priorityImprovements.forEach((imp, i) => {
          formatted += `${i + 1}. ${imp}\n`;
        });
      }

      return {
        formattedResult: formatted,
        criteria,
        missingElements,
        priorityImprovements,
        overallAssessment
      };
    } catch (error) {
      console.error('Error parsing rubric analysis:', error);
      return {
        formattedResult: rawResult,
        criteria: [],
        missingElements: [],
        priorityImprovements: [],
        overallAssessment: ''
      };
    }
  }

  mockRubricAnalysis() {
    const formatted = `# Rubric Alignment Analysis\n\n## Overall Assessment\nYour essay demonstrates a solid understanding of the topic and meets most rubric criteria at a satisfactory level. There are a few areas where alignment with the rubric could be strengthened.\n\n## Score Summary\n- **Met:** 3 criteria\n- **Partially Met:** 2 criteria\n- **Not Met:** 1 criteria\n\n## Criterion-by-Criterion Breakdown\n\n### ✅ Thesis Statement\nThe essay presents a clear and arguable thesis statement that addresses the prompt directly.\n\n**Suggestions:**\n- Consider making the thesis more specific by including your main supporting points.\n\n### ✅ Evidence & Support\nMultiple pieces of evidence are used throughout the essay to support claims.\n\n### ⚠️ Organization & Structure\nThe essay follows a general logical structure but some transitions between paragraphs are weak.\n\n**Suggestions:**\n- Add stronger transition sentences between sections.\n- Ensure each body paragraph begins with a clear topic sentence.\n\n### ❌ Counterargument\nThe essay does not address any opposing viewpoints as required by the rubric.\n\n**Suggestions:**\n- Add a paragraph that acknowledges and refutes a counterargument.\n\n## Priority Improvements\n1. Add a counterargument section as required by the rubric.\n2. Strengthen paragraph transitions for better flow.\n3. Make the thesis statement more specific.`;

    return {
      success: true,
      result: formatted,
      criteria: [
        { criterion: 'Thesis Statement', status: 'met', assessment: 'Clear thesis present', suggestions: [] },
        { criterion: 'Evidence & Support', status: 'met', assessment: 'Good evidence used', suggestions: [] },
        { criterion: 'Organization', status: 'partially_met', assessment: 'Needs better transitions', suggestions: ['Add transitions'] },
        { criterion: 'Counterargument', status: 'not_met', assessment: 'Not addressed', suggestions: ['Add counterargument section'] }
      ],
      missingElements: ['Counterargument section'],
      priorityImprovements: ['Add counterargument', 'Improve transitions', 'Sharpen thesis'],
      overallAssessment: 'Your essay meets most criteria but is missing a counterargument section.',
      timestamp: new Date().toISOString(),
      model: 'mock'
    };
  }

  /**
   * Mock analysis for development/testing
   */
  async mockAnalysis(documentId, content, analysisType, userId) {
    const mockResults = {
      general: `## General Analysis Results

**Overall Assessment:** Your document shows good academic potential with room for improvement in several key areas.

### Strengths:
- Clear topic focus and purpose
- Logical flow of ideas
- Appropriate academic tone

### Areas for Improvement:
- **Structure:** Consider adding more transitional phrases between paragraphs
- **Clarity:** Some sentences could be more concise
- **Depth:** Expand on key arguments with more supporting evidence

### Recommendations:
1. Add a clear thesis statement in the introduction
2. Include more specific examples to support your arguments
3. Strengthen the conclusion with a summary of key points

**Overall Score: 7/10** - Good foundation with potential for excellence.`,

      citation: `## Citation Analysis Results

**Citation Assessment:** Your document needs significant improvement in citation practices.

### Issues Found:
- **Missing Citations:** Several claims lack proper attribution
- **Format Inconsistency:** Citations don't follow a consistent style
- **Incomplete References:** Some sources are mentioned but not properly cited

### Specific Recommendations:
${citationStyle === 'None' 
  ? `1. Focus on content quality and clarity since no citations are required
2. Ensure arguments are well-structured and logical
3. Check for proper paragraph organization and flow
4. Verify that claims are supported by reasoning rather than external sources`
  : `1. Add citations for all factual claims and statistics
2. Choose one citation style (APA, MLA, Chicago) and use it consistently
3. Include a complete reference list at the end
4. Use in-text citations for all paraphrased material`}

**Citation Score: 4/10** - Needs substantial improvement for academic integrity.`,

      grammar: `## Grammar & Language Analysis

**Language Assessment:** Your document has several grammatical issues that need attention.

### Grammar Issues Found:
- **Subject-Verb Agreement:** 3 instances of incorrect agreement
- **Punctuation:** Missing commas in compound sentences
- **Sentence Structure:** 2 run-on sentences identified
- **Word Choice:** Some informal language inappropriate for academic writing

### Specific Corrections:
1. "The data shows" → "The data show" (plural subject)
2. Add comma before "however" in compound sentences
3. Break up long sentences for better readability
4. Replace "really" with "significantly" or "substantially"

### Language Improvements:
- Use more precise academic vocabulary
- Avoid contractions in formal writing
- Maintain consistent tense throughout

**Grammar Score: 6/10** - Good ideas but needs language refinement.`,

      plagiarism: `## Plagiarism Check Results

**Academic Integrity Assessment:** Your document shows good originality with some areas of concern.

### Originality Analysis:
- **Overall Originality:** 85% - Good level of original content
- **Proper Attribution:** Most sources are appropriately cited
- **Paraphrasing Quality:** Generally well-executed with room for improvement

### Areas of Concern:
- **Insufficient Paraphrasing:** Some sections too closely mirror source material
- **Missing Citations:** 2 instances where ideas need attribution
- **Quotation Marks:** Missing quotes around direct text from sources

### Recommendations:
1. Rewrite sections that are too similar to source material
2. Add proper citations for all borrowed ideas
3. Use quotation marks for direct quotes
4. Improve paraphrasing to show deeper understanding

**Integrity Score: 8/10** - Good academic honesty with minor improvements needed.`,

      comprehensive: `## Comprehensive Analysis Results

**Complete Academic Writing Assessment:** Your document demonstrates solid academic writing with several areas for enhancement.

### Content Quality (7/10):
- Clear argumentation and logical flow
- Good use of evidence to support claims
- Appropriate scope and depth for the topic

### Structure & Organization (6/10):
- Introduction could be stronger with clearer thesis
- Body paragraphs well-organized but need better transitions
- Conclusion summarizes but doesn't synthesize key insights

### Language & Style (7/10):
- Academic tone generally appropriate
- Some grammatical errors need correction
- Vocabulary is adequate but could be more precise

### Citations & References (5/10):
- Inconsistent citation format
- Missing some required attributions
- Reference list incomplete

### Originality & Integrity (8/10):
- Good level of original thinking
- Most sources properly attributed
- Minor paraphrasing issues

### Overall Recommendations:
1. Strengthen introduction with clear thesis statement
2. Improve transitions between paragraphs
3. Standardize citation format throughout
4. Add missing citations and complete reference list
5. Proofread for grammatical errors
6. Enhance conclusion with synthesis of key findings

**Overall Score: 7/10** - Strong foundation with clear path to excellence.`
    };

    const analysisResult = mockResults[analysisType] || mockResults.general;
    
    // Save analysis to database
    await this.saveAnalysis(documentId, userId, analysisType, analysisResult, content);
    
    return {
      success: true,
      analysisType,
      result: analysisResult,
      documentId,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get system prompt based on analysis type
   */
  getSystemPrompt(analysisType) {
    const prompts = {
      general: `You are an expert academic writing assistant. Analyze the provided document and give comprehensive feedback on:
      - Overall structure and organization
      - Clarity and coherence
      - Academic tone and style
      - Strengths and areas for improvement
      - Specific recommendations for enhancement

      Provide actionable, constructive feedback in a professional tone.

      CRITICAL — INLINE ANNOTATIONS:
      - Strengths: Say what works in the quoted words (logic, evidence, clarity), not stock praise. Do not repeat the same phrase across items. Avoid filler like "appropriate complexity", "well suited for academic work", "sophisticated academic discourse" as the main point.
      - Improvements/concerns: Tie every suggestion to this document. No [X]/[Y] placeholders. Give a revision, a sentence to add, or before/after using their topic — never generic "add evidence" without naming what claim.
      - References/bibliography: If a reference list / bibliography / works-cited section is present, do NOT annotate or rewrite its entries as sentences — leave reference entries alone (citation formatting is reviewed separately).`,
      
      citation: `You are a citation and referencing expert. Analyze the provided document for:
      - Proper citation format and style
      - Missing or incorrect citations
      - Reference list accuracy
      - In-text citation consistency
      - Academic integrity compliance

      Identify specific issues and provide corrections with examples.`,
      
      grammar: `You are a grammar and language expert. Analyze the provided document for:
      - Grammar, punctuation, and spelling errors
      - Sentence structure and clarity
      - Word choice and vocabulary
      - Consistency in tense and voice
      - Professional academic language usage

      Provide specific corrections and explanations for each issue found.`,
      
      plagiarism: `You are an academic integrity specialist. Analyze the provided document for:
      - Potential plagiarism indicators
      - Proper paraphrasing and original expression
      - Citation of sources and ideas
      - Originality and academic honesty
      - Areas that may need better attribution

      Focus on academic integrity and proper source attribution.`,
      
      comprehensive: `You are a comprehensive academic writing expert. Provide a complete analysis covering:
      - Content quality and depth
      - Structure and organization
      - Grammar and language
      - Citations and references
      - Academic style and tone
      - Originality and integrity
      - Overall assessment and recommendations

      Give detailed feedback across all aspects of academic writing.

      CRITICAL — INLINE ANNOTATIONS:
      - Strengths: Each strength must describe what is strong in that exact quote (word choice, structure, evidence). Do not reuse boilerplate across strengths. Ban empty praise: "appropriate complexity", "well suited for academic work", "sophisticated academic discourse" as filler.
      - Improvements/concerns: Every suggestion must reference their draft — revised wording, a clause to insert, or a named element from their essay. Never [X]/[Y] placeholders or template advice without a concrete fix.
      - References/bibliography: If a reference list / bibliography / works-cited section is present, do NOT annotate or rewrite its entries as sentences — leave reference entries alone (citation formatting is reviewed separately).`,
      
      citation_review: `You are an expert academic citation and referencing specialist with deep knowledge of all major citation styles (APA, MLA, Chicago, Harvard, etc.).

Your task is to provide focused, detailed feedback EXCLUSIVELY on citation and referencing issues:

1. **In-Text Citations**: Check format, placement, accuracy, and completeness
2. **Reference List/Bibliography**: Verify formatting, completeness, and alphabetical order
3. **Citation Style Consistency**: Ensure adherence to the specified citation style throughout
4. **Missing Citations**: Identify claims that need citations but lack them
5. **Citation Errors**: Find incorrect formats, missing elements, or style violations
6. **Reference Matching**: Verify all in-text citations have corresponding references

For each citation issue, you must:
- Quote the exact problematic text or citation
- Explain the specific citation error or formatting issue
- Provide the correct citation format according to the specified style
- Categorize as: correct citation (green), needs formatting fix (amber), or serious citation error (red)

Focus ONLY on citations, references, and bibliography. Do not comment on writing quality, grammar, or content unless it directly relates to citation practices.`
    };

    let basePrompt = prompts[analysisType] || prompts.general;

    return basePrompt;
  }

  /**
   * Get citation review prompt
   */
  getCitationReviewPrompt(content, citationStyle = 'APA') {
    return `Please perform a focused citation and referencing analysis of the following document using ${citationStyle} citation style standards.

IMPORTANT: For each citation issue, you must include the EXACT text from the document that you're referring to, enclosed in double quotes.

CITATION ANALYSIS REQUIREMENTS:
- Focus EXCLUSIVELY on citation and referencing issues
- Identify in-text citation errors and missing citations
- Analyze the ENTIRE bibliography/references section as one unit
- Verify citation style consistency throughout
- Match in-text citations with reference entries
- For the bibliography section, quote the ENTIRE section (or a substantial portion) and provide one overall assessment
- Provide specific corrections for each citation error

Document Content:
${content}

Please provide a detailed citation analysis in the following JSON format:

{
  "overall_assessment": "Brief overall assessment of citation quality",
  "citation_analysis": {
    "in_text_citations": {
      "assessment": "Analysis of in-text citation quality and consistency",
      "strengths": [
        {
          "text": "EXACT quoted text from document",
          "comment": "What makes this citation correct",
          "suggestion": "How to maintain this standard"
        }
      ],
      "improvements": [
        {
          "text": "EXACT quoted text from document", 
          "comment": "What citation formatting needs improvement",
          "suggestion": "Specific correction in ${citationStyle} format"
        }
      ],
      "concerns": [
        {
          "text": "EXACT quoted text from document",
          "comment": "What citation error or missing citation",
          "suggestion": "How to fix this citation issue"
        }
      ]
    },
    "reference_list": {
      "assessment": "Analysis of reference list/bibliography quality",
      "overall_quality": "Assess the entire bibliography section as: excellent, good, or poor",
      "strengths": [
        {
          "text": "EXACT quoted text from bibliography section (if excellent)",
          "comment": "What makes the bibliography well-formatted",
          "suggestion": "How to maintain this standard"
        }
      ],
      "improvements": [
        {
          "text": "EXACT quoted text from bibliography section (if good with issues)",
          "comment": "What bibliography formatting needs improvement", 
          "suggestion": "Specific corrections needed"
        }
      ],
      "concerns": [
        {
          "text": "EXACT quoted text from bibliography section (if poor)",
          "comment": "What major bibliography errors exist",
          "suggestion": "How to fix these serious issues"
        }
      ]
    },
    "style_consistency": {
      "assessment": "Analysis of citation style consistency",
      "strengths": [],
      "improvements": [],
      "concerns": []
    }
  },
  "recommendations": [
    "Priority citation recommendation 1",
    "Priority citation recommendation 2", 
    "Priority citation recommendation 3"
  ]
}

CRITICAL REQUIREMENTS:
1. Every feedback item MUST include the exact quoted text from the document
2. Focus ONLY on citation, referencing, and bibliography issues
3. Provide specific ${citationStyle} format corrections
4. Categorize as: correct citation (green), needs formatting (amber), serious error (red)
5. Do not comment on writing quality, grammar, or content unless directly related to citations`;
  }

  /**
   * Get analysis prompt with document content
   */
  getAnalysisPrompt(analysisType, content, citationStyle = 'None', userPlan = 'free', gradingStyle = 'us') {
    const citationInstruction = citationStyle === 'None' 
      ? 'This document does not require citations, so focus on content quality, structure, and clarity.'
      : `using ${citationStyle} citation style standards.`;
    
    // Calculate expected annotations based on document length and user plan
    const wordCount = content.split(/\s+/).length;
    // Same annotation count for every plan — free is asked for just
    // as many as Pro/Premium (matches ensureMinimumAnnotations) so
    // free users get genuine notes, not padded filler.
    let targetAnnotations;
    if (wordCount > 5000) targetAnnotations = 45;
    else if (wordCount > 3000) targetAnnotations = 40;
    else if (wordCount > 1500) targetAnnotations = 35;
    else targetAnnotations = 30;

    // Always grade using US scale (90 = A). UK display conversion happens in parseStructuredAnalysis.
    const gradingScaleInstruction = `GRADING SCALE — US: Use US college standards. 90+ = A, 80-89 = B, 70-79 = C, 60-69 = D, <60 = F. Score each category using full range: A work = 18-20/20, 14-15/15, 9-10/10.`;

    // College / University rubric (100 points total) — always US scale; UK conversion applied after
    const gradeRubricSection = `  "grade_rubric": {
    "thesis_and_argument": {
      "score": <integer 0-20, A = 18-20, B = 16-18, C = 14-16>,
      "max_score": 20,
      "feedback": "Specific feedback on thesis clarity and argument strength"
    },
    "response_to_question": {
      "score": <integer 0-20, A = 18-20, B = 16-18, C = 14-16>,
      "max_score": 20,
      "feedback": "Specific feedback on how well the essay addresses the question or prompt"
    },
    "use_of_evidence_and_textual_support": {
      "score": <integer 0-15, A = 14-15, B = 12-14, C = 10-12>,
      "max_score": 15,
      "feedback": "Specific feedback on use of evidence and textual support"
    },
    "analysis_and_critical_thinking": {
      "score": <integer 0-20, A = 18-20, B = 16-18, C = 14-16>,
      "max_score": 20,
      "feedback": "Specific feedback on depth of analysis and critical thinking"
    },
    "organization_and_structure": {
      "score": <integer 0-15, A = 14-15, B = 12-14, C = 10-12>,
      "max_score": 15,
      "feedback": "Specific feedback on essay structure, paragraph flow, and transitions"
    },
    "writing_quality_and_clarity": {
      "score": <integer 0-10, A = 9-10, B = 8-9, C = 6-8>,
      "max_score": 10,
      "feedback": "Specific feedback on grammar, spelling, sentence structure, and clarity"
    }
  }`;
    
    return `Please perform a comprehensive academic analysis of the following document ${citationInstruction}

IMPORTANT: For each feedback point, you must include the EXACT text from the document that you're referring to, enclosed in double quotes. All quoted text must appear verbatim in the document.

REFERENCES / BIBLIOGRAPHY — DO NOT REVISE AS PROSE:
- If the document contains a reference list, bibliography, or works-cited section (usually at the end — often after a heading like "References", "Bibliography", "Works Cited", or "Reference List", and made up of source entries with authors, years, titles, publishers/URLs), treat those entries as CITATIONS, not sentences.
- NEVER create an annotation, a "specific_rewrite", or a grammar/clarity/style/structure suggestion for a reference-list entry, and never quote reference-list text in your output. Do not "rewrite" a reference as if it were a sentence.
- Only annotate and revise the essay's BODY prose. (Citation/reference formatting is checked in a separate pass — ignore it here.)

ADAPTIVE ANNOTATION GUIDELINES:
- Aim for approximately ${targetAnnotations} total annotations spread across the essay
- Adapt feedback ratio to actual writing quality:

  EXCELLENT papers: 60-80% strengths, 20-30% improvements, 0-10% concerns
  GOOD papers: 40-50% strengths, 40-50% improvements, 10-20% concerns
  POOR papers: 20-30% strengths, 40-50% improvements, 30-40% concerns

- Always include at least 2 strengths — never make feedback entirely negative
- Be honest: do not force concerns onto genuinely good writing

STRENGTH ANNOTATIONS (green):
- "comment" must say what works **in the quoted text itself** (e.g. a strong verb, a clear causal link, a defined term, a specific piece of evidence). Not generic praise.
- Do NOT repeat the same wording across strengths. Forbidden stock phrases: "well suited for academic work", "appropriate complexity", "sophisticated academic discourse", "complexity level" as filler.
- "suggestion" = one sentence on how to repeat this strength elsewhere in *this* paper (same topic), not "continue good writing."

IMPROVEMENT & CONCERN ANNOTATIONS — MUST BE ACTIONABLE AND PAPER-SPECIFIC:
- NEVER use placeholders like [X] and [Y]. Rewrite using the essay's actual subject, or give a before/after using words from their paragraph.
- NEVER use vague advice like "consider adding citations" without naming what claim needs support.
- Each improvement/concern "suggestion" MUST reference their draft: either (a) a before/after line using their wording, (b) one sentence they could add that names a source/example from their text, or (c) a concrete revision of the quoted line.
- BAD: "Revise with a concrete example: This demonstrates that [X], which matters because [Y]."
- GOOD: "After this sentence, add one clause that names the study you mention in paragraph 2, e.g. 'As the 2021 campus survey showed, …'"

${gradingScaleInstruction}

OVERALL ASSESSMENT TONE (for "overall_assessment" field):
- Sound supportive and encouraging: like a professor who wants the student to succeed, not a harsh critic.
- Open with genuine strengths or what is working (specific, not generic flattery).
- Acknowledge effort and seriousness of the work where appropriate.
- Mention areas to improve as opportunities or next steps—clear but kind, never dismissive or discouraging.
- Avoid harsh, cold, or overly negative framing; stay honest while remaining motivating.

Document Content (${wordCount} words):
${content}

Return ONLY a valid JSON object. No preamble, no markdown, no explanation outside the JSON.

{
  "overall_assessment": "2-3 sentences. Warm, encouraging professor tone: lead with what works, then one main area to strengthen framed as a constructive next step. Honest but motivating—never harsh.",

  "overall_score": <integer 0-100, US scale: A = 90-100, B = 80-89, C = 70-79. NOT multiples of 5>,

  "grade_estimate": "<US letter grade e.g. A, B+, C — backend will convert for UK>",

  "clarity_rating": "<one of: Excellent / Good / Needs Work / Poor>",

  "top_suggestions": [
    "Most impactful improvement — be specific, reference the essay directly",
    "Second most impactful improvement",
    "Third most impactful improvement"
  ],

  "detailed_analysis": {
    "academic_writing_quality": {
      "assessment": "Analysis of clarity, coherence, and academic tone",
      "strengths": [
        {
          "text": "EXACT quoted text from document",
          "comment": "What in THIS quote works (word choice, logic, evidence) — not generic praise",
          "suggestion": "How to extend this strength elsewhere in this same essay (one sentence, topic-specific)"
        }
      ],
      "improvements": [
        {
          "text": "EXACT quoted text from document",
          "comment": "What is weak in this quote for this assignment",
          "suggestion": "Concrete fix using their topic: revised sentence, or named addition from their paper — no [X]/[Y] placeholders"
        }
      ],
      "concerns": [
        {
          "text": "EXACT quoted text from document",
          "comment": "Why this undermines the argument here",
          "suggestion": "Concrete fix tied to their wording — no template phrases"
        }
      ]
    },
    "citation_referencing": {
      "assessment": "Analysis of citations and references",
      "strengths": [],
      "improvements": [],
      "concerns": []
    },
    "argument_structure": {
      "assessment": "Analysis of thesis strength, logical flow, and use of evidence",
      "strengths": [],
      "improvements": [],
      "concerns": []
    },
    "grammar_style": {
      "assessment": "Analysis of grammar, punctuation, sentence structure, and academic register",
      "strengths": [],
      "improvements": [],
      "concerns": []
    },
    "content_depth": {
      "assessment": "Analysis of argument depth, originality, and critical thinking",
      "strengths": [],
      "improvements": [],
      "concerns": []
    }
  },

${gradeRubricSection},

  "specific_rewrites": [
    {
      "original": "exact sentence or phrase from the essay that needs improving",
      "rewritten": "improved version that preserves the student voice and intent",
      "reason": "why this rewrite is stronger"
    }
  ],

  "recommendations": [
    "Priority recommendation 1",
    "Priority recommendation 2",
    "Priority recommendation 3"
  ]
}

CRITICAL REQUIREMENTS:
1. Every feedback item in detailed_analysis MUST include exact quoted text from the document
2. Always use US grading scale. overall_score = sum of rubric category scores. A work = 90-100, B = 80-89, C = 70-79. Same essay gets same scores regardless of student's region — UK conversion is applied after.
3. specific_rewrites: include 3-5 examples targeting the weakest sentences — always preserve the student voice
4. All quoted text must be verbatim from the document — do not paraphrase or invent quotes
5. For improvements and concerns: every "suggestion" MUST give a concrete example (rewrite, phrase to add, or before/after) — never generic advice without showing the solution
6. NEVER use placeholder brackets [X] [Y] or the phrases listed in the user prompt as filler. Every suggestion must use the student's topic or quote.
7. Return ONLY valid JSON — no text before or after the JSON object`;
  }

  /**
   * Parse citation analysis response and extract annotations
   */
  parseCitationAnalysis(analysisResult, content) {
    try {
      console.log('=== BACKEND: STARTING CITATION ANALYSIS PARSING ===');
      console.log('Content length:', content.length);
      
      // Try to extract JSON from the response
      const jsonMatch = analysisResult.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in citation analysis result');
      }

      const structuredData = JSON.parse(jsonMatch[0]);
      const annotations = [];
      let annotationId = 1;
      const usedTexts = new Set();

      // First, try to find and annotate individual bibliography entries
      console.log('🔍 Attempting to find individual bibliography entries...');
      const bibliographyAnnotations = this.findAndAnnotateIndividualBibliographyEntries(content, structuredData.citation_analysis?.reference_list);
      console.log(`Found ${bibliographyAnnotations.length} individual bibliography entries`);
      
      bibliographyAnnotations.forEach(bibAnnotation => {
        if (!usedTexts.has(bibAnnotation.text.toLowerCase())) {
          bibAnnotation.id = annotationId.toString();
          annotations.push(bibAnnotation);
          annotationId++;
          usedTexts.add(bibAnnotation.text.toLowerCase());
          console.log(`✅ Added bibliography entry annotation (${bibAnnotation.type}): "${bibAnnotation.text.substring(0, 50)}..."`);
        }
      });

      // Extract annotations from citation analysis sections (excluding reference_list which is handled above)
      Object.entries(structuredData.citation_analysis).forEach(([categoryName, category]) => {
        // Skip reference_list since we handle the entire bibliography as one annotation
        if (categoryName === 'reference_list') return;

        // Process strengths (green)
        if (category.strengths) {
          category.strengths.forEach(item => {
            if (item.text && item.comment) {
              const textMatch = this.findTextInContent(content, item.text);
              if (textMatch && !usedTexts.has(textMatch.text.toLowerCase()) && !this.isWithinBibliography(textMatch, bibliographyAnnotations)) {
                usedTexts.add(textMatch.text.toLowerCase());
                annotations.push({
                  id: annotationId.toString(),
                  type: 'strong',
                  text: textMatch.text,
                  startIndex: textMatch.startIndex,
                  endIndex: textMatch.endIndex,
                  comment: item.comment,
                  suggestion: item.suggestion || 'Continue using this correct citation format.'
                });
                annotationId++;
              }
            }
          });
        }

        // Process improvements (amber)
        if (category.improvements) {
          category.improvements.forEach(item => {
            if (item.text && item.comment) {
              const textMatch = this.findTextInContent(content, item.text);
              if (textMatch && !usedTexts.has(textMatch.text.toLowerCase()) && !this.isWithinBibliography(textMatch, bibliographyAnnotations)) {
                usedTexts.add(textMatch.text.toLowerCase());
                annotations.push({
                  id: annotationId.toString(),
                  type: 'improve',
                  text: textMatch.text,
                  startIndex: textMatch.startIndex,
                  endIndex: textMatch.endIndex,
                  comment: item.comment,
                  suggestion: item.suggestion || 'Please correct the citation format according to the specified style.'
                });
                annotationId++;
              }
            }
          });
        }

        // Process concerns (red)
        if (category.concerns) {
          category.concerns.forEach(item => {
            if (item.text && item.comment) {
              const textMatch = this.findTextInContent(content, item.text);
              if (textMatch && !usedTexts.has(textMatch.text.toLowerCase()) && !this.isWithinBibliography(textMatch, bibliographyAnnotations)) {
                usedTexts.add(textMatch.text.toLowerCase());
                annotations.push({
                  id: annotationId.toString(),
                  type: 'concern',
                  text: textMatch.text,
                  startIndex: textMatch.startIndex,
                  endIndex: textMatch.endIndex,
                  comment: item.comment,
                  suggestion: item.suggestion || 'This citation issue needs immediate attention.'
                });
                annotationId++;
              }
            }
          });
        }
      });

      console.log(`Citation analysis annotations: ${annotations.length}`);

      // Create formatted result for display
      const formattedResult = this.formatCitationAnalysisForDisplay(structuredData);

      console.log('=== BACKEND: CITATION ANALYSIS COMPLETE ===');

      return {
        formattedResult,
        annotations
      };
    } catch (error) {
      console.error('Error parsing citation analysis:', error);
      // Return fallback citation analysis
      return {
        formattedResult: this.generateFallbackCitationAnalysis(content),
        annotations: this.generateFallbackCitationAnnotations(content)
      };
    }
  }

  /**
   * Parse structured analysis response and extract annotations
   */
  parseStructuredAnalysis(analysisResult, content, userPlan = 'free', gradingStyle = 'us') {
    try {
      console.log('=== BACKEND: STARTING BULLETPROOF ANNOTATION GENERATION ===');
      console.log('Content length:', content.length);
      console.log('User plan:', userPlan);
      
      // Try to extract JSON from the response
      const jsonMatch = analysisResult.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in analysis result');
      }

      const structuredData = JSON.parse(jsonMatch[0]);

      // College grading adjustment: add +1 to each rubric section score (capped at max_score)
      if (structuredData.grade_rubric && typeof structuredData.grade_rubric === 'object') {
        for (const key of Object.keys(structuredData.grade_rubric)) {
          const entry = structuredData.grade_rubric[key];
          if (entry && typeof entry.score === 'number' && typeof entry.max_score === 'number') {
            entry.score = Math.min(entry.max_score, entry.score + 1);
          }
        }
      }
      const annotations = [];
      let annotationId = 1;
      const usedTexts = new Set();

      // Helper function to check if a new annotation overlaps with existing ones
      const hasSignificantOverlap = (newAnnotation, existingAnnotations) => {
        return existingAnnotations.some(existing => {
          const overlapStart = Math.max(newAnnotation.startIndex, existing.startIndex);
          const overlapEnd = Math.min(newAnnotation.endIndex, existing.endIndex);
          const overlapLength = Math.max(0, overlapEnd - overlapStart);
          
          // Calculate overlap percentage for both annotations
          const newLength = newAnnotation.endIndex - newAnnotation.startIndex;
          const existingLength = existing.endIndex - existing.startIndex;
          const overlapPercentageNew = overlapLength / newLength;
          const overlapPercentageExisting = overlapLength / existingLength;
          
          // Consider it overlapping if either annotation has >15% overlap
          return overlapPercentageNew > 0.15 || overlapPercentageExisting > 0.15;
        });
      };

      // Extract annotations from each category
      Object.values(structuredData.detailed_analysis).forEach(category => {
        // Process strengths (green)
        if (category.strengths) {
          category.strengths.forEach(item => {
            if (item.text && item.comment) {
              const textMatch = this.findTextInContent(content, item.text);
              if (textMatch && !usedTexts.has(textMatch.text.toLowerCase())) {
                const newAnnotation = {
                  id: annotationId.toString(),
                  type: 'strong',
                  text: textMatch.text,
                  startIndex: textMatch.startIndex,
                  endIndex: textMatch.endIndex,
                  comment: sanitizeStrengthComment(item.comment, textMatch.text),
                  suggestion: sanitizeSuggestion(
                    item.suggestion || '',
                    'strong',
                    item.comment,
                    textMatch.text
                  ) || fallbackSuggestion('strong', item.comment, textMatch.text)
                };
                
                // Check for overlap with existing annotations
                if (!hasSignificantOverlap(newAnnotation, annotations)) {
                  usedTexts.add(textMatch.text.toLowerCase());
                  annotations.push(newAnnotation);
                  annotationId++;
                } else {
                  console.log(`Skipping overlapping strong annotation: "${textMatch.text.substring(0, 50)}..."`);
                }
              }
            }
          });
        }

        // Process improvements (amber)
        if (category.improvements) {
          category.improvements.forEach(item => {
            if (item.text && item.comment) {
              const textMatch = this.findTextInContent(content, item.text);
              if (textMatch && !usedTexts.has(textMatch.text.toLowerCase())) {
                const newAnnotation = {
                  id: annotationId.toString(),
                  type: 'improve',
                  text: textMatch.text,
                  startIndex: textMatch.startIndex,
                  endIndex: textMatch.endIndex,
                  comment: item.comment,
                  suggestion: sanitizeSuggestion(
                    item.suggestion || '',
                    'improve',
                    item.comment,
                    textMatch.text
                  ) || fallbackSuggestion('improve', item.comment, textMatch.text)
                };
                
                // Check for overlap with existing annotations
                if (!hasSignificantOverlap(newAnnotation, annotations)) {
                  usedTexts.add(textMatch.text.toLowerCase());
                  annotations.push(newAnnotation);
                  annotationId++;
                } else {
                  console.log(`Skipping overlapping improve annotation: "${textMatch.text.substring(0, 50)}..."`);
                }
              }
            }
          });
        }

        // Process concerns (red)
        if (category.concerns) {
          category.concerns.forEach(item => {
            if (item.text && item.comment) {
              const textMatch = this.findTextInContent(content, item.text);
              if (textMatch && !usedTexts.has(textMatch.text.toLowerCase())) {
                const newAnnotation = {
                  id: annotationId.toString(),
                  type: 'concern',
                  text: textMatch.text,
                  startIndex: textMatch.startIndex,
                  endIndex: textMatch.endIndex,
                  comment: item.comment,
                  suggestion: sanitizeSuggestion(
                    item.suggestion || '',
                    'concern',
                    item.comment,
                    textMatch.text
                  ) || fallbackSuggestion('concern', item.comment, textMatch.text)
                };
                
                // Check for overlap with existing annotations
                if (!hasSignificantOverlap(newAnnotation, annotations)) {
                  usedTexts.add(textMatch.text.toLowerCase());
                  annotations.push(newAnnotation);
                  annotationId++;
                } else {
                  console.log(`Skipping overlapping concern annotation: "${textMatch.text.substring(0, 50)}..."`);
                }
              }
            }
          });
        }
      });

      console.log(`Initial annotations from AI: ${annotations.length}`);
      console.log(`Strong points: ${annotations.filter(a => a.type === 'strong').length}`);

      // BULLETPROOF APPROACH: Ensure minimum requirements based on plan
      let finalAnnotations = this.ensureMinimumAnnotations(annotations, content, annotationId, usedTexts, userPlan);

      // Sanitize: never return forbidden generic phrases in suggestions
      finalAnnotations = finalAnnotations.map(a => ({
        ...a,
        suggestion: sanitizeSuggestion(a.suggestion || '', a.type, a.comment, a.text)
      }));

      // CRITICAL: overall_score must equal the sum of rubric scores — compute from grade_rubric when present
      let overallScore = structuredData.overall_score ?? null;
      const rubric = structuredData.grade_rubric;
      if (rubric && typeof rubric === 'object') {
        let rubricSum = 0;
        for (const key of Object.keys(rubric)) {
          const entry = rubric[key];
          if (entry && typeof entry.score === 'number') {
            rubricSum += entry.score;
          }
        }
        if (rubricSum > 0) {
          overallScore = rubricSum;
          if (structuredData.overall_score != null && structuredData.overall_score !== rubricSum) {
            console.log(`Corrected overall_score from ${structuredData.overall_score} to rubric sum ${rubricSum}`);
          }
        }
      }

      // UK display conversion: same essay, same US score — convert for UK display (90 US = 70 UK = A/First)
      let displayScore = overallScore;
      let displayRubric = structuredData.grade_rubric;
      if (gradingStyle === 'uk' && overallScore != null && typeof overallScore === 'number') {
        displayScore = Math.max(0, Math.min(100, Math.floor(overallScore - 20)));
        if (overallScore > 0 && displayRubric && typeof displayRubric === 'object') {
          const scale = displayScore / overallScore;
          const keys = Object.keys(displayRubric);
          const scaled = {};
          let rubricSum = 0;
          for (const key of keys) {
            const entry = displayRubric[key];
            if (entry && typeof entry.score === 'number' && typeof entry.max_score === 'number') {
              const s = Math.floor(Math.max(0, Math.min(entry.max_score, entry.score * scale)));
              scaled[key] = { ...entry, score: s };
              rubricSum += s;
            } else {
              scaled[key] = entry;
            }
          }
          const diff = displayScore - rubricSum;
          const scoreKeys = keys.filter(k => scaled[k] && typeof scaled[k].score === 'number');
          if (diff !== 0 && scoreKeys.length > 0) {
            const adjustKey = scoreKeys.find(k => {
              const e = scaled[k];
              const newScore = e.score + diff;
              return newScore >= 0 && newScore <= e.max_score;
            }) || scoreKeys[0];
            if (adjustKey && scaled[adjustKey]) {
              const maxScore = scaled[adjustKey].max_score;
              scaled[adjustKey] = {
                ...scaled[adjustKey],
                score: Math.max(0, Math.min(maxScore, scaled[adjustKey].score + diff))
              };
            }
          }
          displayRubric = scaled;
          if (overallScore > 0) {
            const sum = Object.values(displayRubric).reduce((a, e) => a + (e?.score ?? 0), 0);
            console.log(`UK display conversion: US ${overallScore} → UK ${displayScore} (rubric sum: ${sum})`);
          }
        }
      }

      // Derive grade_estimate from display score (US or UK-converted)
      let gradeEstimate = structuredData.grade_estimate ?? null;
      if (displayScore != null && typeof displayScore === 'number') {
        if (gradingStyle === 'uk') {
          if (displayScore >= 70) gradeEstimate = '1st (70%+)';
          else if (displayScore >= 60) gradeEstimate = '2:1 (60-69%)';
          else if (displayScore >= 50) gradeEstimate = '2:2 (50-59%)';
          else if (displayScore >= 40) gradeEstimate = '3rd (40-49%)';
          else gradeEstimate = 'Fail (below 40%)';
        } else {
          if (displayScore >= 90) gradeEstimate = 'A (90%+)';
          else if (displayScore >= 80) gradeEstimate = 'B (80-89%)';
          else if (displayScore >= 70) gradeEstimate = 'C (70-79%)';
          else if (displayScore >= 60) gradeEstimate = 'D (60-69%)';
          else gradeEstimate = 'F (below 60%)';
        }
      }

      // Use display score for formatted result
      const structuredDataForDisplay = { ...structuredData, overall_score: displayScore, grade_estimate: gradeEstimate };
      const formattedResult = this.formatAnalysisForDisplay(structuredDataForDisplay);

      console.log('=== BACKEND: ANNOTATION GENERATION COMPLETE ===');
      console.log(`Final annotations: ${finalAnnotations.length}`);
      console.log(`Final strong points: ${finalAnnotations.filter(a => a.type === 'strong').length}`);

      return {
        formattedResult,
        annotations: finalAnnotations.sort((a, b) => a.startIndex - b.startIndex),
        overall_score: displayScore,
        grade_estimate: gradeEstimate,
        clarity_rating: structuredData.clarity_rating ?? null,
        top_suggestions: Array.isArray(structuredData.top_suggestions) ? structuredData.top_suggestions : [],
        grade_rubric: displayRubric ?? null,
        specific_rewrites: Array.isArray(structuredData.specific_rewrites) ? structuredData.specific_rewrites : []
      };

    } catch (error) {
      console.error('Error parsing structured analysis:', error);
      // Fallback to bulletproof annotation generation
      console.log('Falling back to bulletproof annotation generation...');
      const fallbackAnnotations = this.generateFallbackAnnotations(content);
      return {
        formattedResult: analysisResult,
        annotations: fallbackAnnotations,
        overall_score: null,
        grade_estimate: null,
        clarity_rating: null,
        top_suggestions: [],
        grade_rubric: null,
        specific_rewrites: []
      };
    }
  }

  /**
   * Ensure minimum annotation requirements are met, scaled by document length and user plan
   */
  ensureMinimumAnnotations(annotations, content, startId, usedTexts, userPlan = 'free') {
    console.log('=== BACKEND: ENSURING MINIMUM ANNOTATIONS ===');
    
    // Calculate minimum total annotations based on document length and user plan
    // No minimum for strong points - let AI decide naturally
    const wordCount = content.split(/\s+/).length;
    // Annotation COUNT is the same for every plan — free users get
    // just as many margin notes as Pro/Premium. (Paid differentiation
    // is kept elsewhere: premium model quality, grade rubric,
    // specific rewrites, Apply-revisions, quota, export/history.)
    let minTotal;
    if (wordCount > 5000) minTotal = 45;
    else if (wordCount > 3000) minTotal = 40;
    else if (wordCount > 1500) minTotal = 35;
    else minTotal = 30;
    
    console.log(`Document: ${wordCount} words, Plan: ${userPlan}`);
    console.log(`Target: ${minTotal} total annotations (no minimum for strong points - AI decides)`);
    
    const finalAnnotations = [...annotations];
    let annotationId = startId;
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    // Skip forcing strong points - let AI decide naturally
    console.log(`Current strong points: ${finalAnnotations.filter(a => a.type === 'strong').length} (AI-determined)`);
    
    // STEP 1: Ensure minimum total annotations (but avoid duplicates)
    const currentTotal = finalAnnotations.length;
    console.log(`Current total annotations: ${currentTotal}/${minTotal}`);
    
    if (currentTotal < minTotal) {
      console.log(`Adding additional annotations to reach ${minTotal}...`);
      
      // Get all sentences that haven't been used yet
      const remainingSentences = sentences.filter(s => {
        const trimmed = s.trim();
        if (trimmed.length < 15) return false;
        
        // Check if this sentence overlaps with any existing annotation
        const sentenceStart = content.indexOf(trimmed);
        if (sentenceStart === -1) return false;
        
        const sentenceEnd = sentenceStart + trimmed.length;
        
        // Check for overlap with existing annotations
        const hasOverlap = finalAnnotations.some(annotation => {
          const annotationStart = annotation.startIndex;
          const annotationEnd = annotation.endIndex;
          
          // Check if sentences overlap significantly (more than 20% overlap)
          const overlapStart = Math.max(sentenceStart, annotationStart);
          const overlapEnd = Math.min(sentenceEnd, annotationEnd);
          const overlapLength = Math.max(0, overlapEnd - overlapStart);
          const sentenceLength = sentenceEnd - sentenceStart;
          const overlapPercentage = overlapLength / sentenceLength;
          
          return overlapPercentage > 0.2; // 20% overlap threshold
        });
        
        return !hasOverlap && !usedTexts.has(trimmed.toLowerCase());
      });
      
      console.log(`Found ${remainingSentences.length} unused sentences for additional annotations`);
      
      // Analyze current distribution to determine paper quality
      const currentStrong = finalAnnotations.filter(a => a.type === 'strong').length;
      const currentImprove = finalAnnotations.filter(a => a.type === 'improve').length;
      const currentConcern = finalAnnotations.filter(a => a.type === 'concern').length;
      
      console.log(`Current distribution: ${currentStrong} strong, ${currentImprove} improve, ${currentConcern} concern`);
      
      // Determine paper quality based on AI's initial assessment
      let paperQuality = 'average';
      const strongRatio = currentStrong / currentTotal;
      const concernRatio = currentConcern / currentTotal;
      
      if (strongRatio > 0.5 && concernRatio < 0.2) {
        paperQuality = 'excellent';
        console.log('📝 Paper appears to be EXCELLENT quality - focusing on strengths and minor improvements');
      } else if (strongRatio > 0.3 && concernRatio < 0.4) {
        paperQuality = 'good';
        console.log('📝 Paper appears to be GOOD quality - balanced feedback');
      } else if (concernRatio > 0.4) {
        paperQuality = 'needs_work';
        console.log('📝 Paper NEEDS WORK - focusing on improvements and concerns');
      }
      
      // Adaptive type selection based on paper quality
      let types;
      if (paperQuality === 'excellent') {
        // Excellent papers: mostly strengths and minor improvements, avoid concerns
        types = ['strong', 'improve', 'strong', 'improve', 'strong', 'improve'];
      } else if (paperQuality === 'good') {
        // Good papers: balanced, but lean toward improvements over concerns
        types = ['improve', 'strong', 'improve', 'improve', 'strong', 'improve'];
      } else {
        // Papers that need work: focus on improvements and some concerns
        types = ['improve', 'concern', 'improve', 'improve', 'concern', 'improve'];
      }
      
      const toAdd = Math.min(minTotal - currentTotal, remainingSentences.length);
      // Spread synthetic annotations EVENLY across the document
      // (remainingSentences is in document order). Taking the first N
      // piled every padded note onto the introduction — the reason
      // every paper showed a wall of concerns/improvements up top.
      const stride = toAdd > 0 ? remainingSentences.length / toAdd : 1;
      for (let i = 0; i < toAdd; i++) {
        const pickIdx = Math.min(remainingSentences.length - 1, Math.floor(i * stride));
        const sentence = remainingSentences[pickIdx].trim();
        const startIndex = content.indexOf(sentence);
        if (startIndex !== -1) {
          const type = types[i % types.length];
          usedTexts.add(sentence.toLowerCase());
          
          const preview = sentence.length > 140 ? `${sentence.slice(0, 137)}…` : sentence;
          let comment;
          let suggestion;
          if (type === 'strong') {
            // Quote-anchored only — no repeated "academic discourse" / "complexity level" boilerplate
            if (/\b(research|study|analysis|findings|results|evidence|data)\b/i.test(sentence)) {
              comment = `You foreground evidence here: "${preview}" — that helps readers trust the claim.`;
              suggestion = 'Reuse this pattern: after a similar claim elsewhere, name one source or number you already cite in your draft.';
            } else if (/\b(however|furthermore|moreover|therefore|consequently|nevertheless)\b/i.test(sentence)) {
              comment = `The transition in "${preview}" signals how this sentence relates to the last one.`;
              suggestion = 'When you revise the next section, match this clarity: say what changed from the previous idea.';
            } else if (/\b(demonstrates|indicates|suggests|reveals|shows|establishes)\b/i.test(sentence)) {
              comment = `Interpretive verbs in "${preview}" spell out what you think the material means.`;
              suggestion = 'Keep tying evidence to meaning like this; add one more clause that names your main thesis term.';
            } else if (sentence.includes(',') && (sentence.includes('that') || sentence.includes('which'))) {
              comment = `This sentence packs a subordinate clause: "${preview}" — good density for your argument.`;
              suggestion = 'If a reader gets lost, break one long sentence into two, but keep this level of detail.';
            } else {
              comment = `Clear line in your draft: "${preview}" — it states something a reader can check.`;
              suggestion = 'Mirror this: one claim + one reason in the same breath in your topic sentences.';
            }
          } else if (type === 'improve') {
            if (/\b(however|but|although|while)\b/i.test(sentence)) {
              comment = `Reader may not see how "${preview}" connects to the sentence before it.`;
              suggestion = 'Add a short bridge using your own topic words: repeat one keyword from the prior sentence, then finish this thought.';
            } else if (sentence.length < 30) {
              comment = `"${preview}" is very short — the idea may need one more beat.`;
              suggestion = 'Add one new sentence after this that names an example from your paper (a person, study, or date you already mention).';
            } else {
              comment = `"${preview}" could carry more support for the claim you are making.`;
              suggestion = 'Insert one sentence after this that cites a passage, statistic, or definition already in your draft.';
            }
          } else {
            if (sentence.includes('?')) {
              comment = `Academic body paragraphs often work better as statements: "${preview}"`;
              suggestion = 'Rewrite as a claim and answer it in the next clause, using vocabulary from your introduction.';
            } else if (/\b(I think|I believe|I feel)\b/i.test(sentence)) {
              comment = `"${preview}" uses first person; some instructors prefer an objective voice.`;
              suggestion = 'Try leading with your evidence: paste your best fact from this paragraph first, then your interpretation.';
            } else {
              comment = `Strengthen this stretch: "${preview}" — make the claim and its warrant explicit.`;
              suggestion = 'Rewrite once: first half = claim in your words, second half = one reason drawn from your sources.';
            }
          }
          
          finalAnnotations.push({
            id: annotationId.toString(),
            type: type,
            text: sentence,
            startIndex: startIndex,
            endIndex: startIndex + sentence.length,
            comment: comment,
            suggestion: suggestion
          });
          annotationId++;
          console.log(`✅ Added ${type} annotation (${finalAnnotations.length}/${minTotal})`);
        }
      }
    }
    
    // STEP 2: Emergency fill if still not enough (avoid strong points)
    while (finalAnnotations.length < minTotal) {
      const allSentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
      
      // Find sentences that don't overlap with existing annotations
      const availableSentences = allSentences.filter(s => {
        const trimmed = s.trim();
        if (usedTexts.has(trimmed.toLowerCase())) return false;
        
        const sentenceStart = content.indexOf(trimmed);
        if (sentenceStart === -1) return false;
        
        const sentenceEnd = sentenceStart + trimmed.length;
        
        // Check for overlap with existing annotations
        const hasOverlap = finalAnnotations.some(annotation => {
          const overlapStart = Math.max(sentenceStart, annotation.startIndex);
          const overlapEnd = Math.min(sentenceEnd, annotation.endIndex);
          const overlapLength = Math.max(0, overlapEnd - overlapStart);
          const sentenceLength = sentenceEnd - sentenceStart;
          return (overlapLength / sentenceLength) > 0.1; // 10% overlap threshold for emergency
        });
        
        return !hasOverlap;
      });
      
      if (availableSentences.length === 0) {
        console.log(`⚠️ No more unique sentences available. Stopping at ${finalAnnotations.length} annotations.`);
        break;
      } else {
        // Pick the available sentence sitting in the LARGEST uncovered
        // region (farthest from existing annotations) so emergency
        // fills reach the conclusion instead of stacking on the intro.
        let chosen = availableSentences[0];
        let startIndex = content.indexOf(chosen.trim());
        let bestDist = -1;
        for (const s of availableSentences) {
          const st = content.indexOf(s.trim());
          if (st === -1) continue;
          let minDist = Infinity;
          for (const a of finalAnnotations) {
            const d = Math.abs(st - a.startIndex);
            if (d < minDist) minDist = d;
          }
          if (minDist > bestDist) { bestDist = minDist; chosen = s; startIndex = st; }
        }
        const sentence = chosen.trim();
        if (startIndex !== -1) {
          // Determine paper quality for emergency annotations
          const emergencyStrong = finalAnnotations.filter(a => a.type === 'strong').length;
          const emergencyTotal = finalAnnotations.length;
          const emergencyStrongRatio = emergencyStrong / emergencyTotal;
          
          // For excellent papers (high strong ratio), avoid adding concerns
          let type;
          if (emergencyStrongRatio > 0.5) {
            // Excellent paper - only add improvements, no concerns
            type = 'improve';
          } else if (emergencyStrongRatio > 0.3) {
            // Good paper - mostly improvements, occasional concern
            type = finalAnnotations.length % 4 === 0 ? 'concern' : 'improve';
          } else {
            // Average/poor paper - balanced improve/concern
            type = finalAnnotations.length % 2 === 0 ? 'improve' : 'concern';
          }
          usedTexts.add(sentence.toLowerCase());
          
          let comment, suggestion;
          if (type === 'improve') {
            comment = 'This section could benefit from more detailed explanation.';
            suggestion = 'Revise with a concrete example: e.g. "For instance, …" or "This demonstrates that [X], which matters because [Y]."';
          } else {
            comment = 'This section may need attention to strengthen clarity and argument structure.';
            suggestion = 'Rephrase for clarity: e.g. break long sentences, add transitions like "Therefore" or "This shows that", or add one specific example.';
          }
          
          finalAnnotations.push({
            id: annotationId.toString(),
            type: type,
            text: sentence,
            startIndex: startIndex,
            endIndex: startIndex + sentence.length,
            comment: comment,
            suggestion: suggestion
          });
          annotationId++;
          console.log(`✅ Emergency ${type} annotation added (${finalAnnotations.length}/${minTotal})`);
        }
      }
    }
    
    // STEP 2: Free users - ensure at least 1 concern (red) in first ~40% of document (matches free preview cutoff)
    if (userPlan === 'free') {
      const contentLength = content.length;
      const freePreviewEnd = Math.floor(contentLength * 0.4);
      const concernsInPreview = finalAnnotations.filter(a => a.type === 'concern' && a.startIndex < freePreviewEnd);

      if (concernsInPreview.length === 0) {
        // Try to convert an 'improve' in the preview region to 'concern'
        const improveInPreview = finalAnnotations.find(a => a.type === 'improve' && a.startIndex < freePreviewEnd);
        if (improveInPreview) {
          improveInPreview.type = 'concern';
          improveInPreview.comment = improveInPreview.comment || 'This section needs attention to strengthen your argument.';
          improveInPreview.suggestion = improveInPreview.suggestion || 'Revise with a concrete example: e.g. "As X (Year) notes, …" or "For instance, …" to strengthen your argument.';
          console.log(`🔄 Free user: Converted 1 improve → concern in first ~40% for conversion`);
        } else {
          // Add a new concern from an unused sentence in the preview region
          const previewContent = content.substring(0, freePreviewEnd);
          const previewSentences = previewContent.split(/[.!?]+/).filter(s => s.trim().length > 20);
          for (const sent of previewSentences) {
            const trimmed = sent.trim();
            const startIndex = content.indexOf(trimmed);
            if (startIndex !== -1 && startIndex < freePreviewEnd && !usedTexts.has(trimmed.toLowerCase())) {
              const overlap = finalAnnotations.some(a => {
                const overlapStart = Math.max(startIndex, a.startIndex);
                const overlapEnd = Math.min(startIndex + trimmed.length, a.endIndex);
                return overlapEnd - overlapStart > (trimmed.length * 0.2);
              });
              if (!overlap) {
                const nextId = Math.max(0, ...finalAnnotations.map(a => parseInt(a.id, 10) || 0)) + 1;
                usedTexts.add(trimmed.toLowerCase());
                finalAnnotations.push({
                  id: nextId.toString(),
                  type: 'concern',
                  text: trimmed,
                  startIndex,
                  endIndex: startIndex + trimmed.length,
                  comment: 'This section could be strengthened with clearer structure or additional evidence.',
                  suggestion: 'Revise with a concrete transition: e.g. "Therefore, …" or "For instance, …" to clarify and support your point.'
                });
                finalAnnotations.sort((a, b) => a.startIndex - b.startIndex);
                console.log(`🔄 Free user: Added 1 concern in first ~40% for conversion`);
                break;
              }
            }
          }
        }
      }
    }

    const finalStrongCount = finalAnnotations.filter(a => a.type === 'strong').length;
    const finalImproveCount = finalAnnotations.filter(a => a.type === 'improve').length;
    const finalConcernCount = finalAnnotations.filter(a => a.type === 'concern').length;
    console.log(`🎯 FINAL BACKEND RESULTS:`);
    console.log(`   Total annotations: ${finalAnnotations.length} (target ${minTotal})`);
    console.log(`   Distribution: ${finalStrongCount} strong, ${finalImproveCount} improve, ${finalConcernCount} concern`);
    console.log(`   Quality-adaptive: Strong ratio ${(finalStrongCount / finalAnnotations.length * 100).toFixed(1)}%`);

    // STEP 3: Ensure no more than 200 words without an annotation (coverage fill-ins)
    // These are green (strong) annotations; they don't count toward minTotal or scoring
    const nextId = Math.max(0, ...finalAnnotations.map(a => parseInt(a.id, 10) || 0)) + 1;
    const withCoverage = this.ensureCoverageAnnotations(finalAnnotations, content, nextId);

    return withCoverage;
  }

  /**
   * Ensure no more than 200 words pass without an annotation.
   * Finds gaps between annotations and adds green (strong) coverage annotations.
   * These show in export/sidebar but don't count toward minTotal or scoring.
   */
  ensureCoverageAnnotations(annotations, content, startId) {
    const MAX_WORDS = 200;
    const result = [...annotations].sort((a, b) => a.startIndex - b.startIndex);
    let annotationId = startId;

    const words = content.split(/\s+/);
    if (words.length < MAX_WORDS) return result;

    let charPos = 0;
    const wordBounds = [];
    for (let i = 0; i < words.length; i++) {
      const idx = content.indexOf(words[i], charPos);
      if (idx === -1) break;
      wordBounds.push({ start: idx, end: idx + words[i].length });
      charPos = idx + words[i].length;
    }

    const getWordCountInRange = (charStart, charEnd) => {
      return wordBounds.filter(w => w.end > charStart && w.start < charEnd).length;
    };

    const getCharPosOfNthWordFrom = (charStart, n) => {
      let count = 0;
      for (const w of wordBounds) {
        if (w.end <= charStart) continue;
        count++;
        if (count >= n) return w.end;
      }
      return content.length;
    };

    const findSentenceInRange = (charStart, charEnd) => {
      const segment = content.substring(charStart, charEnd);
      const sentences = segment.split(/[.!?]+/).filter(s => s.trim().length > 10);
      if (sentences.length === 0) return null;
      const midIdx = Math.floor(sentences.length / 2);
      const sentence = sentences[midIdx].trim();
      if (sentence.length < 15) return null;
      const absStart = content.indexOf(sentence, charStart);
      if (absStart === -1 || absStart >= charEnd) return null;
      return { text: sentence, startIndex: absStart, endIndex: absStart + sentence.length };
    };

    // Build gaps: regions with no annotation coverage
    const gaps = [];
    let lastEnd = 0;
    for (const a of result) {
      if (a.startIndex > lastEnd) {
        gaps.push({ start: lastEnd, end: a.startIndex });
      }
      lastEnd = Math.max(lastEnd, a.endIndex);
    }
    if (lastEnd < content.length) {
      gaps.push({ start: lastEnd, end: content.length });
    }

    for (const gap of gaps) {
      let gapStart = gap.start;
      const gapEnd = gap.end;

      while (getWordCountInRange(gapStart, gapEnd) >= MAX_WORDS) {
        const segEndChar = getCharPosOfNthWordFrom(gapStart, MAX_WORDS);
        const sent = findSentenceInRange(gapStart, segEndChar);
        if (!sent) break;
        if (result.some(a => a.endIndex > sent.startIndex && a.startIndex < sent.endIndex)) break;

        result.push({
          id: annotationId.toString(),
          type: 'strong',
          text: sent.text,
          startIndex: sent.startIndex,
          endIndex: sent.endIndex,
          comment: 'This section demonstrates clear academic writing with appropriate structure and vocabulary.',
          suggestion: 'Continue using this approach throughout your paper.',
          isCoverageOnly: true
        });
        annotationId++;
        result.sort((a, b) => a.startIndex - b.startIndex);
        gapStart = sent.endIndex;
      }
    }

    const coverageCount = result.filter(a => a.isCoverageOnly).length;
    if (coverageCount > 0) {
      console.log(`📎 Added ${coverageCount} coverage annotations (max 200 words without feedback)`);
    }
    return result;
  }

  /**
   * Generate fallback annotations when AI parsing fails
   */
  generateFallbackAnnotations(content) {
    console.log('=== BACKEND: GENERATING FALLBACK ANNOTATIONS ===');
    
    const annotations = [];
    let annotationId = 1;
    const usedTexts = new Set();
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    // Force create 3 strong points from different sections
    const sectionSize = Math.floor(sentences.length / 3);
    const sections = [
      sentences.slice(0, sectionSize),
      sentences.slice(sectionSize, sectionSize * 2),
      sentences.slice(sectionSize * 2)
    ];
    
    for (let sectionIndex = 0; sectionIndex < 3; sectionIndex++) {
      const section = sections[sectionIndex];
      const sectionName = ['beginning', 'middle', 'end'][sectionIndex];
      
      for (let i = 0; i < section.length; i++) {
        const sentence = section[i].trim();
        if (sentence.length > 15) {
          const startIndex = content.indexOf(sentence);
          if (startIndex !== -1 && !usedTexts.has(sentence.toLowerCase())) {
            usedTexts.add(sentence.toLowerCase());
            annotations.push({
              id: annotationId.toString(),
              type: 'strong',
              text: sentence,
              startIndex: startIndex,
              endIndex: startIndex + sentence.length,
              comment: `This ${sectionName} section demonstrates strong academic writing with clear structure and appropriate vocabulary.`,
              suggestion: 'This is an excellent foundation. Continue using this approach throughout your paper.'
            });
            annotationId++;
            break;
          }
        }
      }
    }
    
    // Add 9 more annotations to reach 12 total
    const remainingSentences = sentences.filter(s => {
      const trimmed = s.trim();
      return trimmed.length > 10 && !usedTexts.has(trimmed.toLowerCase());
    });
    
    const types = ['improve', 'concern', 'improve', 'concern', 'improve', 'concern', 'improve', 'concern', 'improve'];
    
    for (let i = 0; i < Math.min(9, remainingSentences.length); i++) {
      const sentence = remainingSentences[i].trim();
      const startIndex = content.indexOf(sentence);
      if (startIndex !== -1) {
        const type = types[i];
        usedTexts.add(sentence.toLowerCase());
        
        let comment, suggestion;
        if (type === 'improve') {
          comment = 'This section could be enhanced with more specific details and supporting evidence.';
          suggestion = 'Revise with a concrete example: e.g. "For instance, …" or "As Smith (2020) notes, …" to support your point.';
        } else {
          comment = 'This section may need attention to strengthen the argument and provide clearer explanations.';
          suggestion = 'Revise with a concrete example: e.g. "For instance, …" or "Research shows that …" to clarify and strengthen this section.';
        }
        
        annotations.push({
          id: annotationId.toString(),
          type: type,
          text: sentence,
          startIndex: startIndex,
          endIndex: startIndex + sentence.length,
          comment: comment,
          suggestion: suggestion
        });
        annotationId++;
      }
    }
    
    console.log(`Fallback annotations created: ${annotations.length}`);
    console.log(`Fallback strong points: ${annotations.filter(a => a.type === 'strong').length}`);

    const nextId = Math.max(0, ...annotations.map(a => parseInt(a.id, 10) || 0)) + 1;
    return this.ensureCoverageAnnotations(annotations, content, nextId);
  }

  /**
   * Build a match-normalized copy of `s` plus an index map back to the
   * ORIGINAL string. Normalization: lowercase, collapse whitespace
   * runs to one space, unify smart quotes / dashes / ellipsis / nbsp.
   * `map[i]` = index in `s` of normalized char i.
   *
   * This lets a loosely-quoted snippet be located at its TRUE position
   * instead of failing the exact match and falling through to a
   * start-biased heuristic — the reason later-essay / conclusion notes
   * were sparse while the intro was over-annotated.
   */
  normalizeForMatch(s) {
    let norm = '';
    const map = [];
    let prevSpace = false;
    for (let i = 0; i < s.length; i++) {
      let ch = s[i];
      const code = ch.charCodeAt(0);
      if (code === 0x2018 || code === 0x2019 || code === 0x201B || code === 0x2032) ch = "'";
      else if (code === 0x201C || code === 0x201D || code === 0x201F || code === 0x2033) ch = '"';
      else if (code === 0x2013 || code === 0x2014 || code === 0x2212) ch = '-';
      else if (code === 0x00A0) ch = ' ';
      else if (code === 0x2026) { norm += '...'; map.push(i, i, i); prevSpace = false; continue; }
      if (/\s/.test(ch)) {
        if (prevSpace) continue;
        norm += ' '; map.push(i); prevSpace = true; continue;
      }
      norm += ch.toLowerCase(); map.push(i); prevSpace = false;
    }
    return { norm, map };
  }

  /**
   * Find exact text match in content
   */
  findTextInContent(content, quotedText) {
    // Remove quotes and clean the text
    const cleanText = quotedText.replace(/^["']|["']$/g, '').trim();
    if (cleanText.length < 5) return null;

    // 1. Exact match (fastest, most reliable)
    const exactIndex = content.indexOf(cleanText);
    if (exactIndex !== -1) {
      return { text: cleanText, startIndex: exactIndex, endIndex: exactIndex + cleanText.length };
    }

    // 2. Case-insensitive (preserve original casing in the result)
    const ciIndex = content.toLowerCase().indexOf(cleanText.toLowerCase());
    if (ciIndex !== -1) {
      return {
        text: content.slice(ciIndex, ciIndex + cleanText.length),
        startIndex: ciIndex,
        endIndex: ciIndex + cleanText.length,
      };
    }

    // 3. Whitespace / punctuation-tolerant search, index-mapped back
    //    to the ORIGINAL position. This keeps a loosely-quoted
    //    conclusion sentence anchored at the END of the doc instead of
    //    failing over to the start-biased heuristics below.
    const C = this.normalizeForMatch(content);
    const Q = this.normalizeForMatch(cleanText);
    const qn = Q.norm.trim();
    if (qn.length >= 5) {
      const ni = C.norm.indexOf(qn);
      if (ni !== -1) {
        const startIndex = C.map[ni];
        const endIndex = Math.min(content.length, C.map[ni + qn.length - 1] + 1);
        if (endIndex > startIndex) {
          return { text: content.slice(startIndex, endIndex), startIndex, endIndex };
        }
      }
      // Long quote (e.g. a whole conclusion sentence the model padded
      // or trimmed): anchor on the head, bound with the tail. A
      // slightly loose span at the RIGHT place beats a dropped note —
      // long conclusion quotes used to be discarded entirely.
      if (qn.length > 80) {
        const head = qn.slice(0, 60);
        const hi = C.norm.indexOf(head);
        if (hi !== -1) {
          const startIndex = C.map[hi];
          const tail = qn.slice(-40);
          const ti = C.norm.indexOf(tail, hi + head.length);
          const endIndex = ti !== -1
            ? Math.min(content.length, C.map[ti + tail.length - 1] + 1)
            : Math.min(content.length, startIndex + cleanText.length);
          if (endIndex > startIndex) {
            return { text: content.slice(startIndex, endIndex), startIndex, endIndex };
          }
        }
      }
    }

    // 4. Keyword fallback — pick the BEST-scoring sentence ANYWHERE in
    //    the doc, not the first that shares ≥2 words (the old behaviour
    //    that dragged later annotations toward the introduction).
    if (cleanText.length > 800) return null;
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = cleanText.split(/\s+/).filter(w => w.length > 4).map(w => w.toLowerCase());
    if (words.length >= 2) {
      let best = null;
      let bestScore = 1; // require at least 2 matching keywords
      for (const sentence of sentences) {
        const st = sentence.trim();
        if (st.length <= 10 || st.length >= 300) continue;
        const sl = st.toLowerCase();
        let score = 0;
        for (const w of words) if (sl.includes(w)) score++;
        if (score > bestScore) {
          const startIndex = content.indexOf(st);
          if (startIndex !== -1) {
            best = { text: st, startIndex, endIndex: startIndex + st.length };
            bestScore = score;
          }
        }
      }
      if (best) return best;
    }

    return null;
  }

  /**
   * Format structured analysis for display
   */
  formatAnalysisForDisplay(structuredData) {
    let formatted = `# Comprehensive Academic Analysis\n\n`;
    formatted += `## Overall Assessment\n${structuredData.overall_assessment || ''}\n\n`;

    if (structuredData.overall_score != null) {
      formatted += `**Overall Score:** ${Math.round(Number(structuredData.overall_score))}/100\n\n`;
    }
    if (structuredData.grade_estimate) {
      formatted += `**Grade Estimate:** ${structuredData.grade_estimate}\n\n`;
    }
    if (structuredData.clarity_rating) {
      formatted += `**Clarity Rating:** ${structuredData.clarity_rating}\n\n`;
    }
    if (structuredData.top_suggestions && structuredData.top_suggestions.length > 0) {
      formatted += `### Top Suggestions\n`;
      structuredData.top_suggestions.forEach((s, i) => {
        formatted += `${i + 1}. ${s}\n`;
      });
      formatted += `\n`;
    }

    Object.entries(structuredData.detailed_analysis || {}).forEach(([category, data]) => {
      const categoryTitle = category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      formatted += `## ${categoryTitle}\n${data.assessment}\n\n`;

      if (data.strengths && data.strengths.length > 0) {
        formatted += `### Strengths\n`;
        data.strengths.forEach((item, index) => {
          formatted += `${index + 1}. **"${item.text}"** - ${item.comment}\n`;
          if (item.suggestion) {
            formatted += `   *Suggestion: ${item.suggestion}*\n`;
          }
        });
        formatted += `\n`;
      }

      if (data.improvements && data.improvements.length > 0) {
        formatted += `### Areas for Improvement\n`;
        data.improvements.forEach((item, index) => {
          formatted += `${index + 1}. **"${item.text}"** - ${item.comment}\n`;
          if (item.suggestion) {
            formatted += `   *Suggestion: ${item.suggestion}*\n`;
          }
        });
        formatted += `\n`;
      }

      if (data.concerns && data.concerns.length > 0) {
        formatted += `### Serious Concerns\n`;
        data.concerns.forEach((item, index) => {
          formatted += `${index + 1}. **"${item.text}"** - ${item.comment}\n`;
          if (item.suggestion) {
            formatted += `   *Suggestion: ${item.suggestion}*\n`;
          }
        });
        formatted += `\n`;
      }
    });

    if (structuredData.recommendations && structuredData.recommendations.length > 0) {
      formatted += `## Priority Recommendations\n`;
      structuredData.recommendations.forEach((rec, index) => {
        formatted += `${index + 1}. ${rec}\n`;
      });
    }

    return formatted;
  }

  /**
   * Save analysis results to database
   * @param {object|null} rubricAlignment - Optional rubric alignment result to persist
   * @param {object|null} structuredData - Optional new-format fields: overall_score, grade_estimate, clarity_rating, top_suggestions, grade_rubric, specific_rewrites
   */
  async saveAnalysis(documentId, userId, analysisType, result, originalContent, annotations = null, citationStyle = null, rubricAlignment = null, structuredData = null) {
    try {
      console.log('=== SAVE ANALYSIS DEBUG ===');
      console.log('documentId:', documentId);
      console.log('userId:', userId);
      console.log('analysisType:', analysisType);
      console.log('annotations count:', annotations?.length || 0);
      
      // Use service role key ONLY for AI analysis saves (bypasses RLS)
      // This is safe because we validate userId and documentId before calling this method
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
      );

      // Convert annotations to the format expected by frontend
      const strongPoints = annotations?.filter(a => a.type === 'strong').map(a => ({
        text: a.text,
        explanation: a.comment
      })) || [];
      
      const areasToImprove = annotations?.filter(a => a.type === 'improve').map(a => ({
        text: a.text,
        explanation: a.comment
      })) || [];
      
      const seriousConcerns = annotations?.filter(a => a.type === 'concern').map(a => ({
        text: a.text,
        explanation: a.comment
      })) || [];

      const analysisData = {
        document_id: documentId,
        user_id: userId,
        analysis_type: analysisType,
        status: 'completed',
        analysis_results: {
          result: result,
          original_content: originalContent,
          ai_model_used: process.env.OPENAI_MODEL || "gpt-4o-mini",
          annotations: annotations, // Keep the original annotations for future use
          strong_points: strongPoints, // Add the format expected by frontend
          areas_to_improve: areasToImprove, // Add the format expected by frontend
          serious_concerns: seriousConcerns, // Add the format expected by frontend
          citation_style: citationStyle,
          rubric_alignment: rubricAlignment || null, // Persist rubric alignment when provided
          // New format fields for score/grade UI
          overall_score: structuredData?.overall_score ?? null,
          grade_estimate: structuredData?.grade_estimate ?? null,
          clarity_rating: structuredData?.clarity_rating ?? null,
          top_suggestions: structuredData?.top_suggestions ?? null,
          grade_rubric: structuredData?.grade_rubric ?? null,
          specific_rewrites: structuredData?.specific_rewrites ?? null
        },
        processing_time_ms: Math.floor(Date.now() / 1000), // Convert to seconds
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      };

      console.log('Saving analysis data:', {
        document_id: analysisData.document_id,
        user_id: analysisData.user_id,
        analysis_type: analysisData.analysis_type,
        status: analysisData.status
      });

      const { data, error } = await supabase
        .from('document_analyses')
        .insert([analysisData])
        .select();

      if (error) {
        console.error('Error saving analysis:', error);
        throw error;
      }

      return data[0];
    } catch (error) {
      console.error('Database error in saveAnalysis:', error);
      throw error;
    }
  }

  /**
   * Get analysis history for a user
   */
  async getAnalysisHistory(userId, limit = 10) {
    try {
      // Use service role key to bypass RLS for analysis history retrieval
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
      );

      const { data, error } = await supabase
        .from('document_analyses')
        .select(`
          *,
          documents:document_id (
            title,
            original_filename
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      // Process the data to handle null document_id cases
      if (data) {
        data.forEach(analysis => {
          if (!analysis.documents) {
            // For text analyses (no document_id), create a default document object
            analysis.documents = {
              title: 'Text Analysis',
              original_filename: 'text-analysis.txt'
            };
          }
        });
      }

      if (error) {
        console.error('Error fetching analysis history:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Database error in getAnalysisHistory:', error);
      throw error;
    }
  }

  /**
   * Get specific analysis by ID
   */
  async getAnalysisById(analysisId, userId) {
    try {
      // Use service role key to bypass RLS for analysis retrieval
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
      );

      const { data, error } = await supabase
        .from('document_analyses')
        .select('*')
        .eq('id', analysisId)
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching analysis:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Database error in getAnalysisById:', error);
      throw error;
    }
  }

  /**
   * Check if a text match is within any of the bibliography annotations
   */
  isWithinBibliography(textMatch, bibliographyAnnotations) {
    if (!bibliographyAnnotations || bibliographyAnnotations.length === 0) return false;
    
    return bibliographyAnnotations.some(bibAnnotation => 
      textMatch.startIndex >= bibAnnotation.startIndex && 
      textMatch.endIndex <= bibAnnotation.endIndex
    );
  }

  /**
   * Find and annotate individual bibliography entries
   */
  findAndAnnotateIndividualBibliographyEntries(content, referenceListData) {
    console.log('📚 Starting individual bibliography entry detection...');
    
    // First, find the bibliography section
    const bibSection = this.findBibliographySection(content);
    if (!bibSection) {
      console.log('❌ No bibliography section found');
      return [];
    }

    console.log(`✅ Found bibliography section: ${bibSection.start} to ${bibSection.end}`);
    
    // Extract the bibliography text
    const bibliographyText = content.substring(bibSection.start, bibSection.end);
    
    // Split into individual entries
    const entries = this.splitBibliographyIntoEntries(bibliographyText, bibSection.start);
    console.log(`Split bibliography into ${entries.length} entries`);
    
    // Annotate each entry based on AI feedback or default logic
    const annotations = entries.map(entry => {
      let annotationType = 'improve'; // default
      let comment = 'This reference entry needs review for proper formatting.';
      let suggestion = 'Check that this reference follows the correct citation style format.';
      
      // Try to match with AI feedback from referenceListData
      if (referenceListData) {
        const match = this.matchEntryWithAIFeedback(entry.text, referenceListData);
        if (match) {
          annotationType = match.type;
          comment = match.comment;
          suggestion = match.suggestion;
        }
      }
      
      return {
        type: annotationType,
        text: entry.text,
        startIndex: entry.startIndex,
        endIndex: entry.endIndex,
        comment: comment,
        suggestion: suggestion
      };
    });
    
    return annotations;
  }

  /**
   * Find the bibliography section boundaries
   */
  findBibliographySection(content) {
    // Common bibliography section headers
    const bibliographyHeaders = [
      'References',
      'Bibliography', 
      'Works Cited',
      'Works Referenced',
      'Literature Cited',
      'Sources',
      'Reference List',
      'Citations'
    ];

    let bibliographyStart = -1;
    let bibliographyEnd = -1;
    let headerFound = '';

    // Find the bibliography section
    console.log('🔍 Searching for bibliography headers...');
    for (const header of bibliographyHeaders) {
      // Look for the header (case insensitive, with possible formatting)
      // Try multiple patterns: standalone header, header with colon, header at line start
      const patterns = [
        new RegExp(`^\\s*${header}\\s*:?\\s*$`, 'im'), // Exact line match
        new RegExp(`\\n\\s*${header}\\s*:?\\s*\\n`, 'i'), // Header between newlines
        new RegExp(`^${header}\\s*:?`, 'im'), // Header at start of line
        new RegExp(`\\b${header}\\b`, 'i') // Simple word boundary match
      ];
      
      let match = null;
      for (const pattern of patterns) {
        match = content.match(pattern);
        if (match) {
          console.log(`✅ Found header "${header}" with pattern ${pattern} at index ${match.index}`);
          break;
        }
      }
      
      if (match) {
        console.log(`✅ Found header "${header}" at index ${match.index}`);
        bibliographyStart = match.index;
        headerFound = header;
        
        // Find the actual start of bibliography content (skip the header line)
        const headerEndIndex = bibliographyStart + match[0].length;
        const afterHeader = content.substring(headerEndIndex);
        
        // Find first non-empty line after header as the real start
        const firstContentMatch = afterHeader.match(/\n\s*(.+)/);
        if (firstContentMatch) {
          bibliographyStart = headerEndIndex + firstContentMatch.index;
        }
        
        // Find the end of the bibliography - be more aggressive to capture everything
        // Look for next major section or end of document
        const nextSectionRegex = /\n\s*(Appendix|Appendices|Notes|Acknowledgments?|About the Author|Index|Glossary)/i;
        const nextSectionMatch = afterHeader.match(nextSectionRegex);
        
        if (nextSectionMatch) {
          bibliographyEnd = headerEndIndex + nextSectionMatch.index;
        } else {
          // If no next section found, take rest of document
          bibliographyEnd = content.length;
        }
        break;
      }
    }

    // If no header found, try to find a section with multiple citation-like entries
    if (bibliographyStart === -1) {
      console.log('No bibliography header found, searching for citation patterns...');
      
      // Look for patterns that suggest a reference list
      const citationPatterns = [
        /^[A-Z][a-z]+,\s+[A-Z]\./gm, // "Smith, J." at line start
        /^[A-Z][a-z]+,\s+[A-Z][a-z]+/gm, // "Smith, John" at line start
        /\(\d{4}\)/g, // (2023) year pattern
        /\.\s+[A-Z][a-z]+:\s+[A-Z]/g, // ". Publisher: Title" pattern
      ];

      // Look for the densest section of citations (likely the bibliography)
      const lines = content.split('\n');
      let maxDensity = 0;
      let bestStartLine = -1;
      let bestEndLine = -1;
      
      // Check sliding windows of lines for citation density
      const windowSize = 10;
      for (let i = 0; i < lines.length - windowSize; i++) {
        const windowText = lines.slice(i, i + windowSize).join('\n');
        let density = 0;
        
        citationPatterns.forEach(pattern => {
          const matches = windowText.match(pattern);
          if (matches) density += matches.length;
        });
        
        if (density > maxDensity && density > 2) { // At least 2 citation-like patterns
          maxDensity = density;
          bestStartLine = i;
          
          // Find the end of this citation-dense section
          let endLine = i + windowSize;
          for (let j = i + windowSize; j < lines.length; j++) {
            const lineText = lines[j];
            const hasPattern = citationPatterns.some(pattern => {
              pattern.lastIndex = 0; // Reset regex
              return pattern.test(lineText);
            });
            
            if (hasPattern || lineText.trim().length > 50) { // Continue if has pattern or substantial content
              endLine = j + 1;
            } else if (lineText.trim().length === 0) {
              // Allow empty lines
              continue;
            } else {
              // Stop at non-citation content
              break;
            }
          }
          bestEndLine = endLine;
        }
      }
      
      if (bestStartLine !== -1) {
        // Convert line numbers to character positions
        bibliographyStart = lines.slice(0, bestStartLine).join('\n').length;
        if (bestStartLine > 0) bibliographyStart += 1; // Add newline
        
        bibliographyEnd = lines.slice(0, bestEndLine).join('\n').length;
        headerFound = 'Citation Dense Section';
        console.log(`Found citation section from line ${bestStartLine} to ${bestEndLine}`);
      }
    }

    if (bibliographyStart === -1) {
      return null;
    }

    return {
      start: bibliographyStart,
      end: bibliographyEnd,
      headerFound: headerFound
    };
  }

  /**
   * Split bibliography text into individual entries
   */
  splitBibliographyIntoEntries(bibliographyText, bibliographyStart) {
    const entries = [];
    const lines = bibliographyText.split('\n');
    
    let currentEntry = '';
    let entryStartOffset = 0;
    let currentLineOffset = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines and the header itself
      if (!line || line.match(/^(References?|Bibliography|Works Cited|Works Referenced|Literature Cited|Sources|Reference List|Citations):?$/i)) {
        currentLineOffset += lines[i].length + 1; // +1 for newline
        continue;
      }
      
      // Check if this line starts a new entry
      const isNewEntry = this.isStartOfBibliographyEntry(line, currentEntry);
      
      if (isNewEntry && currentEntry.trim()) {
        // Save the previous entry
        const trimmedEntry = currentEntry.trim();
        entries.push({
          text: trimmedEntry,
          startIndex: bibliographyStart + entryStartOffset,
          endIndex: bibliographyStart + entryStartOffset + trimmedEntry.length
        });
        
        // Start new entry
        currentEntry = line;
        entryStartOffset = currentLineOffset;
      } else {
        // Continue current entry
        if (currentEntry) {
          currentEntry += ' ' + line;
        } else {
          currentEntry = line;
          entryStartOffset = currentLineOffset;
        }
      }
      
      currentLineOffset += lines[i].length + 1; // +1 for newline
    }
    
    // Add the last entry
    if (currentEntry.trim()) {
      const trimmedEntry = currentEntry.trim();
      entries.push({
        text: trimmedEntry,
        startIndex: bibliographyStart + entryStartOffset,
        endIndex: bibliographyStart + entryStartOffset + trimmedEntry.length
      });
    }
    
    return entries;
  }

  /**
   * Check if a line starts a new bibliography entry
   */
  isStartOfBibliographyEntry(line, currentEntry) {
    // If we don't have a current entry yet, this is definitely a new entry
    if (!currentEntry.trim()) {
      return true;
    }
    
    // Common patterns that indicate a new reference entry
    const newEntryPatterns = [
      /^[A-Z][a-z]+,\s+[A-Z]\./, // "Smith, J." at start of line
      /^[A-Z][a-z]+,\s+[A-Z][a-z]+/, // "Smith, John" at start of line
      /^[A-Z][a-z]+,\s+[A-Z][a-z]+\s+[A-Z]\./, // "Smith, John A." at start
      /^\d+\./, // "1." numbered entry
    ];
    
    return newEntryPatterns.some(pattern => pattern.test(line));
  }

  /**
   * Match a bibliography entry with AI feedback
   */
  matchEntryWithAIFeedback(entryText, referenceListData) {
    if (!referenceListData) return null;
    
    // Collect all feedback items from strengths, improvements, and concerns
    const allFeedback = [];
    
    if (referenceListData.strengths) {
      referenceListData.strengths.forEach(item => {
        allFeedback.push({ ...item, type: 'strong' });
      });
    }
    
    if (referenceListData.improvements) {
      referenceListData.improvements.forEach(item => {
        allFeedback.push({ ...item, type: 'improve' });
      });
    }
    
    if (referenceListData.concerns) {
      referenceListData.concerns.forEach(item => {
        allFeedback.push({ ...item, type: 'concern' });
      });
    }
    
    // Try to find a match based on text similarity
    for (const feedback of allFeedback) {
      if (!feedback.text) continue;
      
      // Check if the feedback text is contained in or contains the entry text
      const feedbackLower = feedback.text.toLowerCase().trim();
      const entryLower = entryText.toLowerCase().trim();
      
      // Match if there's significant overlap (at least 30 characters match)
      if (feedbackLower.includes(entryLower.substring(0, 50)) || 
          entryLower.includes(feedbackLower.substring(0, 50))) {
        return {
          type: feedback.type,
          comment: feedback.comment || 'This reference needs attention.',
          suggestion: feedback.suggestion || 'Review and correct the citation format.'
        };
      }
    }
    
    return null;
  }

  /**
   * OLD METHOD - Find and annotate the entire bibliography/references section (kept for fallback)
   */
  findAndAnnotateBibliography(content, referenceListData) {
    const bibSection = this.findBibliographySection(content);
    if (!bibSection) {
      return null;
    }

    const bibliographyText = content.substring(bibSection.start, bibSection.end).trim();
    
    // Determine overall annotation type based on reference list analysis
    let annotationType = 'improve'; // default
    let comment = 'Bibliography section needs review for proper formatting and completeness.';
    let suggestion = 'Review all entries for consistent formatting according to the specified citation style.';

    if (referenceListData) {
      // Count the different types of feedback
      const strengths = referenceListData.strengths?.length || 0;
      const improvements = referenceListData.improvements?.length || 0;
      const concerns = referenceListData.concerns?.length || 0;
      const total = strengths + improvements + concerns;

      if (total > 0) {
        const strengthRatio = strengths / total;
        const concernRatio = concerns / total;

        if (strengthRatio > 0.6 && concernRatio < 0.2) {
          annotationType = 'strong';
          comment = 'Bibliography is well-formatted and follows proper citation style conventions.';
          suggestion = 'Continue maintaining this high standard of citation formatting.';
        } else if (concernRatio > 0.4) {
          annotationType = 'concern';
          comment = 'Bibliography has significant formatting issues and citation errors that need attention.';
          suggestion = 'Review and correct all citation formatting according to the specified style guide.';
        } else {
          annotationType = 'improve';
          comment = 'Bibliography has some formatting inconsistencies that should be addressed.';
          suggestion = 'Review entries for consistent formatting and complete all required citation elements.';
        }
      }
    }

    return {
      type: annotationType,
      text: bibliographyText,
      startIndex: bibSection.start,
      endIndex: bibSection.end,
      comment: comment,
      suggestion: suggestion
    };
  }

  /**
   * Format citation analysis for display
   */
  formatCitationAnalysisForDisplay(structuredData) {
    const sections = [];

    // Overall assessment
    if (structuredData.overall_assessment) {
      sections.push(`## Citation Analysis Summary\n\n${structuredData.overall_assessment}\n`);
    }

    // In-text citations
    if (structuredData.citation_analysis?.in_text_citations?.assessment) {
      sections.push(`## In-Text Citations\n\n${structuredData.citation_analysis.in_text_citations.assessment}\n`);
    }

    // Reference list
    if (structuredData.citation_analysis?.reference_list?.assessment) {
      sections.push(`## Reference List/Bibliography\n\n${structuredData.citation_analysis.reference_list.assessment}\n`);
    }

    // Style consistency
    if (structuredData.citation_analysis?.style_consistency?.assessment) {
      sections.push(`## Citation Style Consistency\n\n${structuredData.citation_analysis.style_consistency.assessment}\n`);
    }

    // Recommendations
    if (structuredData.recommendations && structuredData.recommendations.length > 0) {
      sections.push(`## Priority Recommendations\n\n${structuredData.recommendations.map((rec, index) => `${index + 1}. ${rec}`).join('\n')}\n`);
    }

    return sections.join('\n');
  }

  /**
   * Generate fallback citation analysis
   */
  generateFallbackCitationAnalysis(content) {
    return `## Citation Analysis Summary

Your document has been analyzed for citation and referencing issues. Due to processing limitations, a detailed analysis could not be generated at this time.

## General Citation Recommendations

1. **Verify Citation Format**: Ensure all in-text citations follow the specified citation style consistently
2. **Check Reference List**: Verify that all in-text citations have corresponding entries in the reference list
3. **Review Citation Placement**: Confirm citations are placed appropriately after claims that require attribution
4. **Format Consistency**: Check that all citations use the same format throughout the document

## Next Steps

Please review your citations manually or try the analysis again. Focus on:
- Proper in-text citation formatting
- Complete reference list entries
- Consistent citation style usage
- Appropriate citation placement`;
  }

  /**
   * Generate fallback citation annotations
   */
  generateFallbackCitationAnnotations(content) {
    const annotations = [];
    let annotationId = 1;

    // Try to find and annotate individual bibliography entries first
    const bibliographyAnnotations = this.findAndAnnotateIndividualBibliographyEntries(content, null);
    bibliographyAnnotations.forEach(bibAnnotation => {
      bibAnnotation.id = annotationId.toString();
      annotations.push(bibAnnotation);
      annotationId++;
    });

    // Look for potential in-text citation issues (avoiding bibliography section)
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    sentences.slice(0, 3).forEach(sentence => {
      const trimmed = sentence.trim();
      if (trimmed.includes('(') && trimmed.includes(')')) {
        // Potential citation found
        const startIndex = content.indexOf(trimmed);
        if (startIndex !== -1) {
          const textMatch = { startIndex, endIndex: startIndex + trimmed.length };
          
          // Check if this overlaps with existing annotations or bibliography
          const overlapsExisting = annotations.some(a => 
            a.startIndex <= startIndex && a.endIndex >= startIndex + trimmed.length
          );
          const withinBibliography = this.isWithinBibliography(textMatch, bibliographyAnnotations);
          
          if (!overlapsExisting && !withinBibliography) {
            annotations.push({
              id: annotationId.toString(),
              type: 'improve',
              text: trimmed,
              startIndex: startIndex,
              endIndex: startIndex + trimmed.length,
              comment: 'Please verify this citation format matches your chosen citation style.',
              suggestion: 'Check that this citation follows the correct format for your citation style.'
            });
            annotationId++;
          }
        }
      }
    });

    return annotations;
  }

  /**
   * Mock citation review for development/testing
   */
  async mockCitationReview(content, citationStyle) {
    console.log('🤖 Using mock citation review');
    
    // Try to find bibliography for mock annotation
    const bibliographyAnnotation = this.findAndAnnotateBibliography(content, null);
    const annotations = [];
    
    if (bibliographyAnnotation) {
      bibliographyAnnotation.id = '1';
      bibliographyAnnotation.comment = `Mock bibliography feedback - this bibliography section needs review for ${citationStyle} formatting.`;
      bibliographyAnnotation.suggestion = `This is mock feedback. Enable OpenAI API for detailed ${citationStyle} citation analysis.`;
      annotations.push(bibliographyAnnotation);
    } else {
      // Fallback annotation if no bibliography found
      annotations.push({
        id: '1',
        type: 'improve',
        text: content.substring(0, Math.min(200, content.length)),
        startIndex: 0,
        endIndex: Math.min(200, content.length),
        comment: 'Mock citation feedback - check citation format',
        suggestion: `Verify this follows ${citationStyle} citation style`
      });
    }
    
    return {
      success: true,
      analysisType: 'citation_review',
      result: `## Mock Citation Review (${citationStyle} Style)

**Overall Assessment:** This is a mock citation review for development purposes.

### In-Text Citations
Your document contains several citations that need attention for ${citationStyle} formatting.

### Reference List
The reference list requires formatting adjustments to meet ${citationStyle} standards.

### Recommendations
1. Review all in-text citations for proper ${citationStyle} format
2. Ensure reference list entries are complete and properly formatted
3. Verify all in-text citations have corresponding reference entries

**Note:** This is mock data for development. Enable OpenAI API for real analysis.`,
      annotations: annotations,
      citationStyle: citationStyle,
      timestamp: new Date().toISOString(),
      model: 'mock',
      temporary: true
    };
  }

  /**
   * Get system prompt for citation search
   */
  getCitationSearchSystemPrompt() {
    return `You are an expert academic research librarian and citation specialist. Your role is to help students and researchers find relevant academic sources for their research topics.

When given a research topic or essay question, you should:
1. Identify key concepts and research areas
2. Suggest relevant academic sources (journal articles, books, reports)
3. Provide properly formatted citations in the requested citation style
4. Include brief descriptions of why each source is relevant
5. Suggest search keywords and strategies
6. STRICTLY adhere to any year/date filters specified - if the user requests sources from a specific time period, ALL sources must fall within that range

Focus on providing HIGH-QUALITY, CREDIBLE academic sources from reputable publishers, journals, and institutions. Prioritize peer-reviewed journal articles and authoritative books.

IMPORTANT: When a year filter is specified (e.g., "last 5 years"), you MUST ensure every single citation falls within that date range. Do not include any sources outside the specified time period, even if they are considered "foundational" or "classic" works.`;
  }

  /**
   * Get citation search prompt
   */
  getCitationSearchPrompt(researchTopic, citationStyle = 'APA', numberOfCitations = 10, minYear = null, yearRange = 'all') {
    // Build year constraint text based on filter
    let yearConstraintText = '';
    let yearRequirementText = 'Include a mix of recent (last 5 years) and foundational sources';
    
    if (minYear && yearRange !== 'all') {
      const currentYear = new Date().getFullYear();
      yearConstraintText = `\nYEAR FILTER: Only include sources published from ${minYear} to ${currentYear} (last ${yearRange} years). DO NOT include any sources older than ${minYear}.`;
      yearRequirementText = `CRITICAL: ALL sources MUST be published between ${minYear} and ${currentYear}. Do NOT include ANY sources published before ${minYear}. This is a strict requirement - the user specifically requested sources from the last ${yearRange} years only.`;
    }

    return `I need help finding relevant academic citations for the following research topic or essay question:

RESEARCH TOPIC/QUESTION: "${researchTopic}"${yearConstraintText}

Please provide ${numberOfCitations} relevant academic sources formatted in ${citationStyle} citation style.

For each citation, provide the following in JSON format:
{
  "citations": [
    {
      "citation": "Full citation in ${citationStyle} format with proper formatting (use <i></i> for italics)",
      "type": "journal_article | book | book_chapter | report | thesis | conference_paper",
      "relevance": "Brief explanation (2-3 sentences) of why this source is relevant to the research topic",
      "key_points": ["Key point 1", "Key point 2", "Key point 3"],
      "ready_to_use_sentence": "A well-developed academic passage (2-3 sentences) that the user can copy and paste directly into their paper. This passage should incorporate the in-text citation naturally, present key findings or arguments from the source, establish context, and directly relate to the research topic. The text should be substantive and scholarly, demonstrating how the source contributes to the research topic. Example: 'Recent studies have demonstrated the critical link between climate change and biodiversity loss. Smith (2021) argues that rising global temperatures significantly impact species diversity, with particular effects on vulnerable ecosystems. This research underscores the urgent need for comprehensive conservation strategies to mitigate further ecological damage.'",
      "in_text_citation": "The proper in-text citation format for ${citationStyle} style (e.g., (Smith, 2023) for APA)",
      "year": "YYYY",
      "accessibility": "Open Access | Subscription Required | Library Access"
    }
  ],
  "keywords": ["keyword1", "keyword2", "keyword3", ...],
  "search_strategies": [
    "Specific database or search strategy recommendation 1",
    "Specific database or search strategy recommendation 2",
    "Specific database or search strategy recommendation 3"
  ],
  "topic_overview": "Brief overview of the research area and why these sources were selected"
}

IMPORTANT REQUIREMENTS:
1. Provide REAL, PLAUSIBLE academic sources - they should sound like actual published works
2. Use proper ${citationStyle} citation formatting with HTML tags for italics (journal names, book titles should be in <i></i> tags)
3. ${yearRequirementText}
4. Focus on peer-reviewed journal articles and authoritative books
5. Ensure citations are complete with all required elements (authors, year, title, publication) - DO NOT include fake DOI links or URLs unless you are certain they are real
6. Make sure all sources are directly relevant to the research topic
7. For ready_to_use_sentence: Write a well-developed academic passage (2-3 sentences) that the user can copy and paste directly into their paper. The passage should: (a) establish context for the citation, (b) naturally incorporate the in-text citation, (c) present key findings or arguments from the source, and (d) directly relate to "${researchTopic}". Make it substantive, scholarly, and immediately usable in an academic paper.
8. For in_text_citation: Provide the exact format needed for in-text citations in ${citationStyle} style
9. The "year" field MUST contain the actual publication year as a 4-digit number (e.g., "2023")`;
  }

  /**
   * Parse citation search results
   */
  parseCitationSearchResults(searchResult, citationStyle) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = searchResult.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in citation search result');
      }

      const parsedData = JSON.parse(jsonMatch[0]);
      
      return {
        citations: parsedData.citations || [],
        keywords: parsedData.keywords || [],
        searchStrategies: parsedData.search_strategies || [],
        topicOverview: parsedData.topic_overview || ''
      };
    } catch (error) {
      console.error('Error parsing citation search results:', error);
      // Return empty results on parse failure
      return {
        citations: [],
        keywords: [],
        searchStrategies: [],
        topicOverview: ''
      };
    }
  }

  /**
   * Mock citation search for development/testing
   */
  async mockCitationSearch(researchTopic, citationStyle, numberOfCitations) {
    console.log('🤖 Using mock citation search');
    
    const mockCitations = [
      {
        citation: "Smith, J. A., & Johnson, M. B. (2023). Understanding modern research methodologies in social sciences. <i>Journal of Academic Research</i>, 45(3), 234-256.",
        type: "journal_article",
        relevance: "This article provides a comprehensive overview of current research methodologies relevant to your topic. It offers practical frameworks and theoretical foundations that can strengthen your arguments.",
        key_points: ["Discusses mixed-methods approaches", "Reviews recent developments in the field", "Provides methodological frameworks"],
        ready_to_use_sentence: "Contemporary research methodology has evolved significantly in response to complex social phenomena. Smith and Johnson (2023) argue that modern research challenges require sophisticated mixed-methods approaches to capture both quantitative rigor and qualitative depth. Their framework demonstrates how integrating diverse methodological perspectives enables more comprehensive understanding of multifaceted research questions.",
        in_text_citation: "(Smith & Johnson, 2023)",
        year: "2023",
        accessibility: "Subscription Required"
      },
      {
        citation: "Brown, L. (2022). <i>Academic writing in the digital age</i>. Academic Press.",
        type: "book",
        relevance: "This book offers essential insights into contemporary academic writing practices. It's particularly useful for understanding how digital tools are changing scholarly communication and research practices.",
        key_points: ["Covers digital literacy in academia", "Discusses citation management tools", "Explores open access publishing"],
        ready_to_use_sentence: "The digital revolution has profoundly impacted academic communication practices across all disciplines. Brown (2022) demonstrates that the transformation of academic writing in the digital era has fundamentally altered how scholars approach research communication, offering unprecedented opportunities for collaboration and knowledge dissemination. This shift has created new expectations for accessibility, transparency, and engagement in scholarly work.",
        in_text_citation: "(Brown, 2022)",
        year: "2022",
        accessibility: "Library Access"
      },
      {
        citation: "Williams, R., Davis, K., & Martinez, A. (2021). Critical perspectives on contemporary research. <i>International Journal of Studies</i>, 38(2), 112-134.",
        type: "journal_article",
        relevance: "This peer-reviewed article presents critical analysis of current trends in your research area. It provides valuable theoretical perspectives that can help contextualize your arguments.",
        key_points: ["Offers critical analysis frameworks", "Reviews recent literature comprehensively", "Suggests future research directions"],
        ready_to_use_sentence: "Critical examination of research methodologies remains essential for advancing scholarly knowledge. Williams et al. (2021) emphasize that contemporary research practices require careful examination through multiple theoretical lenses to ensure robust findings that contribute meaningfully to academic discourse. Their analysis reveals how interdisciplinary approaches strengthen the validity and applicability of research outcomes.",
        in_text_citation: "(Williams et al., 2021)",
        year: "2021",
        accessibility: "Open Access"
      },
      {
        citation: "Thompson, E. M. (2020). Foundations of academic research. In P. Anderson & S. Green (Eds.), <i>Handbook of research methods</i> (pp. 45-78). Scholarly Publications.",
        type: "book_chapter",
        relevance: "This handbook chapter provides foundational knowledge essential for understanding your research topic. It's widely cited and offers authoritative perspectives on core concepts.",
        key_points: ["Establishes fundamental concepts", "Reviews historical development", "Connects theory to practice"],
        ready_to_use_sentence: "Foundational knowledge in research methodology provides the necessary framework for conducting rigorous academic inquiry. Thompson (2020) argues that understanding the foundational principles of academic research is crucial for developing robust methodological approaches that can withstand scholarly scrutiny and contribute to knowledge advancement. This perspective underscores the importance of systematic training in research fundamentals for emerging scholars.",
        in_text_citation: "(Thompson, 2020)",
        year: "2020",
        accessibility: "Library Access"
      },
      {
        citation: "Garcia, M., & Lee, S. H. (2023). Recent advances in academic research practices. <i>Research Quarterly</i>, 52(1), 78-95.",
        type: "journal_article",
        relevance: "This recent article discusses cutting-edge developments directly relevant to your topic. It provides up-to-date evidence and contemporary perspectives that can strengthen your literature review.",
        key_points: ["Presents latest research findings", "Discusses emerging trends", "Offers practical implications"],
        ready_to_use_sentence: "The intersection of technology and academia has created both opportunities and challenges for contemporary researchers. Garcia and Lee (2023) suggest that the evolving landscape of academic research continues to be shaped by technological innovations and changing institutional priorities, requiring scholars to adapt their methodological approaches accordingly. These adaptations include embracing new tools for data collection, analysis, and dissemination while maintaining rigorous academic standards.",
        in_text_citation: "(Garcia & Lee, 2023)",
        year: "2023",
        accessibility: "Subscription Required"
      }
    ];

    return {
      success: true,
      searchType: 'citation_search',
      researchTopic: researchTopic,
      citations: mockCitations.slice(0, numberOfCitations),
      keywords: ["academic research", "methodology", "scholarly writing", "literature review", "research design"],
      searchStrategies: [
        "Search Google Scholar using keywords: " + researchTopic.split(' ').slice(0, 3).join(' '),
        "Check your university's library databases (JSTOR, EBSCOhost, ProQuest)",
        "Look for recent review articles to find additional relevant sources",
        "Use citation tracking tools to find papers that cite key sources"
      ],
      citationStyle: citationStyle,
      timestamp: new Date().toISOString(),
      model: 'mock'
    };
  }

  /**
   * Save citation search to history
   * @param {string} userPlan - User's subscription plan ('free', 'pro', 'premium')
   */
  async saveCitationSearch(userId, researchTopic, citationStyle, searchResults, yearRange = 'all', userPlan = 'free') {
    try {
      console.log('Saving citation search to history:', { userId, researchTopic, citationStyle, yearRange, userPlan });
      
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
      );

      // Free users: expires 30 days after creation; Paid users (pro/premium): no expiration (null)
      const isPaidUser = subscriptionService.isPaidSubscriptionTier(userPlan || 'free');
      const expiresAt = isPaidUser ? null : getExpiresAt30Days();

      // Note: yearRange is already included in searchResults.yearRange
      // so we don't need a separate column - it's stored in the JSONB field
      const searchData = {
        user_id: userId,
        research_topic: researchTopic,
        citation_style: citationStyle,
        search_results: searchResults,
        created_at: new Date().toISOString(),
        expires_at: expiresAt
      };

      const { data, error } = await supabase
        .from('citation_searches')
        .insert([searchData])
        .select();

      if (error) {
        console.error('Error saving citation search:', error);
        // Don't throw error - citation search should work even if saving fails
        return null;
      }

      console.log('Citation search saved successfully:', data[0]?.id);
      return data[0];
    } catch (error) {
      console.error('Database error in saveCitationSearch:', error);
      // Don't throw error - citation search should work even if saving fails
      return null;
    }
  }

  /**
   * Get citation search history for a user
   * Filters out expired citations automatically
   */
  async getCitationHistory(userId, limit = 20) {
    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
      );

      const now = new Date().toISOString();

      // Get citations that either:
      // 1. Have no expiration (expires_at is null) - paid users
      // 2. Haven't expired yet (expires_at > now) - free users within 30 days
      const { data, error } = await supabase
        .from('citation_searches')
        .select('*')
        .eq('user_id', userId)
        .or(`expires_at.is.null,expires_at.gt.${now}`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching citation history:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Database error in getCitationHistory:', error);
      throw error;
    }
  }

  /**
   * Cleanup expired citation searches (run periodically)
   * Removes citations where expires_at is in the past
   */
  async cleanupExpiredCitations() {
    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
      );

      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('citation_searches')
        .delete()
        .not('expires_at', 'is', null)
        .lt('expires_at', now)
        .select('id');

      if (error) {
        console.error('Error cleaning up expired citations:', error);
        return { deleted: 0, error: error.message };
      }

      const deletedCount = data?.length || 0;
      console.log(`Cleaned up ${deletedCount} expired citation searches`);
      return { deleted: deletedCount };
    } catch (error) {
      console.error('Database error in cleanupExpiredCitations:', error);
      return { deleted: 0, error: error.message };
    }
  }

  /**
   * Save quiz to history
   * @param {string} userPlan - User's subscription plan ('free', 'pro', 'premium')
   */
  async saveQuiz(userId, quiz, sourceText, userPlan = 'free') {
    try {
      console.log('Saving quiz to history:', { userId, quizTitle: quiz.title, userPlan });
      
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
      );

      // Free users: expires 30 days after creation; Paid users (pro/premium): no expiration (null)
      const isPaidUser = subscriptionService.isPaidSubscriptionTier(userPlan || 'free');
      const expiresAt = isPaidUser ? null : getExpiresAt30Days();

      const quizData = {
        user_id: userId,
        title: quiz.title,
        quiz_type: quiz.quizType,
        difficulty: quiz.difficulty,
        question_count: quiz.displayCount ?? quiz.questionCount ?? quiz.questions?.length,
        questions: quiz.questions,
        source_word_count: quiz.sourceWordCount || sourceText?.trim().split(/\s+/).length || 0,
        created_at: new Date().toISOString(),
        expires_at: expiresAt
      };

      const { data, error } = await supabase
        .from('quizzes')
        .insert([quizData])
        .select();

      if (error) {
        console.error('Error saving quiz:', error);
        return null;
      }

      console.log('Quiz saved successfully:', data[0]?.id);
      return data[0];
    } catch (error) {
      console.error('Database error in saveQuiz:', error);
      return null;
    }
  }

  /**
   * Save flashcards to history
   * @param {string} userPlan - User's subscription plan ('free', 'pro', 'premium')
   */
  async saveFlashcards(userId, flashcards, sourceText, userPlan = 'free') {
    try {
      console.log('Saving flashcards to history:', { userId, title: flashcards.title, userPlan });

      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
      );

      // Free users: expires 30 days after creation; Paid users (pro/premium): no expiration (null)
      const isPaidUser = subscriptionService.isPaidSubscriptionTier(userPlan || 'free');
      const expiresAt = isPaidUser ? null : getExpiresAt30Days();

      const flashcardData = {
        user_id: userId,
        title: flashcards.title,
        quiz_type: 'flashcards',
        difficulty: 'mixed',
        question_count: flashcards.cards?.length || 0,
        questions: flashcards.cards,
        source_word_count: sourceText?.trim().split(/\s+/).length || 0,
        created_at: new Date().toISOString(),
        expires_at: expiresAt
      };

      const { data, error } = await supabase
        .from('quizzes')
        .insert([flashcardData])
        .select();

      if (error) {
        console.error('Error saving flashcards:', error);
        throw error;
      }

      console.log('Flashcards saved successfully:', data[0]?.id);
      return data[0];
    } catch (error) {
      console.error('Database error in saveFlashcards:', error);
      return null;
    }
  }

  /**
   * Save crossword to history
   * @param {string} userPlan - User's subscription plan ('free', 'pro', 'premium')
   */
  async saveCrossword(userId, crossword, sourceText, userPlan = 'free') {
    try {
      console.log('Saving crossword to history:', { userId, title: crossword.title, userPlan });

      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
      );

      // Free users: expires 30 days after creation; Paid users (pro/premium): no expiration (null)
      const isPaidUser = subscriptionService.isPaidSubscriptionTier(userPlan || 'free');
      const expiresAt = isPaidUser ? null : getExpiresAt30Days();

      // Build clues object from placedWords for display in history
      const cluesFromPlacedWords = {
        across: (crossword.placedWords || [])
          .filter(pw => pw.direction === 'across')
          .map(pw => ({ number: pw.number, clue: pw.clue, answer: pw.word, row: pw.row, col: pw.col })),
        down: (crossword.placedWords || [])
          .filter(pw => pw.direction === 'down')
          .map(pw => ({ number: pw.number, clue: pw.clue, answer: pw.word, row: pw.row, col: pw.col }))
      };

      const crosswordData = {
        user_id: userId,
        title: crossword.title,
        quiz_type: 'crossword',
        difficulty: 'mixed',
        question_count: crossword.placedWords?.length || 0,
        questions: {
          grid: crossword.grid,
          clues: cluesFromPlacedWords,
          gridSize: crossword.gridSize,
          placedWords: crossword.placedWords
        },
        source_word_count: sourceText?.trim().split(/\s+/).length || 0,
        created_at: new Date().toISOString(),
        expires_at: expiresAt
      };

      const { data, error } = await supabase
        .from('quizzes')
        .insert([crosswordData])
        .select();

      if (error) {
        console.error('Error saving crossword:', error);
        throw error;
      }

      console.log('Crossword saved successfully:', data[0]?.id);
      return data[0];
    } catch (error) {
      console.error('Database error in saveCrossword:', error);
      return null;
    }
  }

  /**
   * Save Crater Blast game to history
   * @param {string} userId
   * @param {object} payload - { questions, title, inputType, sourceText }
   * @param {string} userPlan - 'free', 'pro', 'premium'
   */
  async saveCraterBlastGame(userId, payload, userPlan = 'free') {
    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
      );

      const isPaidUser = subscriptionService.isPaidSubscriptionTier(userPlan || 'free');
      const expiresAt = isPaidUser ? null : getExpiresAt30Days();

      const title = (payload.title || payload.sourceText || 'Crater Blast Game').toString().slice(0, 200);
      const wordCount = (payload.sourceText || '').toString().trim().split(/\s+/).length;

      const gameData = {
        user_id: userId,
        title,
        quiz_type: 'crater_blast',
        difficulty: 'mixed',
        question_count: (payload.questions || []).length,
        questions: {
          questions: payload.questions || [],
          inputType: payload.inputType || 'topic',
          sourceText: (payload.sourceText || '').toString().slice(0, 10000)
        },
        source_word_count: wordCount,
        created_at: new Date().toISOString(),
        expires_at: expiresAt
      };

      const { data, error } = await supabase
        .from('quizzes')
        .insert([gameData])
        .select();

      if (error) {
        console.error('Error saving Crater Blast game:', error);
        return null;
      }

      console.log('Crater Blast game saved successfully:', data[0]?.id);
      return data[0];
    } catch (error) {
      console.error('Database error in saveCraterBlastGame:', error);
      return null;
    }
  }

  /**
   * Get quiz history for a user
   * Returns items that are either permanent (expires_at is null) or not yet expired
   */
  async getQuizHistory(userId, limit = 20) {
    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
      );

      // Get items where expires_at is null (permanent) OR expires_at is in the future
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('user_id', userId)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching quiz history:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Database error in getQuizHistory:', error);
      throw error;
    }
  }

  /**
   * Get a specific quiz by ID
   * Returns item if it's permanent (expires_at is null) or not yet expired
   */
  async getQuizById(userId, quizId) {
    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
      );

      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .eq('user_id', userId)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .single();

      if (error) {
        console.error('Error fetching quiz:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Database error in getQuizById:', error);
      return null;
    }
  }

  /**
   * Delete a specific quiz
   */
  async deleteQuiz(userId, quizId) {
    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
      );

      const { data, error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quizId)
        .eq('user_id', userId)
        .select();

      if (error) {
        console.error('Error deleting quiz:', error);
        return false;
      }

      const rowsDeleted = (data || []).length;
      console.log(`Delete result: ${rowsDeleted} row(s) removed from quizzes table`);

      if (rowsDeleted === 0) {
        console.warn(`No rows deleted — quiz ${quizId} not found for user ${userId} or blocked by RLS`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Database error in deleteQuiz:', error);
      return false;
    }
  }

  async renameQuiz(userId, quizId, newTitle) {
    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
      );

      const { data, error } = await supabase
        .from('quizzes')
        .update({ title: newTitle })
        .eq('id', quizId)
        .eq('user_id', userId)
        .select();

      if (error) {
        console.error('Error renaming quiz:', error);
        return false;
      }

      return (data || []).length > 0;
    } catch (error) {
      console.error('Database error in renameQuiz:', error);
      return false;
    }
  }

  /**
   * Clean up expired quizzes (where expires_at is in the past; free users: 30 days after creation)
   * This should be called periodically (e.g., via a cron job)
   */
  async cleanupExpiredQuizzes() {
    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
      );

      const { data, error } = await supabase
        .from('quizzes')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .select();

      if (error) {
        console.error('Error cleaning up expired quizzes:', error);
        return { deleted: 0 };
      }

      console.log(`Cleaned up ${data?.length || 0} expired quizzes`);
      return { deleted: data?.length || 0 };
    } catch (error) {
      console.error('Database error in cleanupExpiredQuizzes:', error);
      return { deleted: 0 };
    }
  }

  // =====================
  // Lesson Plan Methods
  // =====================

  /**
   * Save lesson plan to history
   * @param {string} userPlan - User's subscription plan ('free', 'pro', 'premium')
   */
  async saveLesson(userId, lesson, sourceText, userPlan = 'free') {
    try {
      console.log('Saving lesson to history:', { userId, lessonTitle: lesson.title, userPlan });

      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
      );

      // Free users: expires 30 days after creation; Paid users (pro/premium): no expiration (null)
      const isPaidUser = subscriptionService.isPaidSubscriptionTier(userPlan || 'free');
      const expiresAt = isPaidUser ? null : getExpiresAt30Days();

      const lessonData = {
        user_id: userId,
        title: lesson.title,
        lesson_style: lesson.style || 'visual',
        slide_count: lesson.slides?.length || lesson.totalSlides || 0,
        slides: lesson.slides,
        quiz_bank: lesson.quizBank || null,
        quiz_display_count: lesson.quizDisplayCount || 6,
        estimated_read_time: lesson.estimatedReadTime || 5,
        source_word_count: sourceText?.trim().split(/\s+/).length || 0,
        created_at: new Date().toISOString(),
        expires_at: expiresAt
      };

      const { data, error } = await supabase
        .from('lesson_plans')
        .insert([lessonData])
        .select();

      if (error) {
        console.error('Error saving lesson:', error);
        return null;
      }

      console.log('Lesson saved successfully:', data[0]?.id);
      return data[0];
    } catch (error) {
      console.error('Database error in saveLesson:', error);
      return null;
    }
  }

  /**
   * Get lesson history for a user
   * Returns items that are either permanent (expires_at is null) or not yet expired
   */
  async getLessonHistory(userId, limit = 20) {
    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
      );

      // Get items where expires_at is null (permanent) OR expires_at is in the future
      const { data, error } = await supabase
        .from('lesson_plans')
        .select('*')
        .eq('user_id', userId)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching lesson history:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Database error in getLessonHistory:', error);
      throw error;
    }
  }

  /**
   * Get a specific lesson by ID
   * Returns item if it's permanent (expires_at is null) or not yet expired
   */
  async getLessonById(userId, lessonId) {
    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
      );

      const { data, error } = await supabase
        .from('lesson_plans')
        .select('*')
        .eq('id', lessonId)
        .eq('user_id', userId)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .single();

      if (error) {
        console.error('Error fetching lesson:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Database error in getLessonById:', error);
      return null;
    }
  }

  /**
   * Delete a specific lesson
   */
  async deleteLesson(userId, lessonId) {
    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
      );

      const { data, error } = await supabase
        .from('lesson_plans')
        .delete()
        .eq('id', lessonId)
        .eq('user_id', userId)
        .select();

      if (error) {
        console.error('Error deleting lesson:', error);
        return false;
      }

      const rowsDeleted = (data || []).length;
      console.log(`Delete result: ${rowsDeleted} row(s) removed from lesson_plans table`);

      if (rowsDeleted === 0) {
        console.warn(`No rows deleted — lesson ${lessonId} not found for user ${userId} or blocked by RLS`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Database error in deleteLesson:', error);
      return false;
    }
  }

  async renameLesson(userId, lessonId, newTitle) {
    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
      );

      const { data, error } = await supabase
        .from('lesson_plans')
        .update({ title: newTitle })
        .eq('id', lessonId)
        .eq('user_id', userId)
        .select();

      if (error) {
        console.error('Error renaming lesson:', error);
        return false;
      }

      return (data || []).length > 0;
    } catch (error) {
      console.error('Database error in renameLesson:', error);
      return false;
    }
  }

  /**
   * Clean up expired lessons (where expires_at is in the past; free users: 30 days after creation)
   */
  async cleanupExpiredLessons() {
    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
      );

      const { data, error } = await supabase
        .from('lesson_plans')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .select();

      if (error) {
        console.error('Error cleaning up expired lessons:', error);
        return { deleted: 0 };
      }

      console.log(`Cleaned up ${data?.length || 0} expired lessons`);
      return { deleted: data?.length || 0 };
    } catch (error) {
      console.error('Database error in cleanupExpiredLessons:', error);
      return { deleted: 0 };
    }
  }

  /**
   * Get available analysis types
   */
  getAnalysisTypes() {
    return [
      {
        id: 'comprehensive',
        name: 'Comprehensive Review',
        description: 'Complete analysis across all aspects of academic writing including citations, grammar, structure, and content quality',
        icon: '🎯',
        estimatedTime: '4-5 minutes'
      },
      {
        id: 'citation_review',
        name: 'Citation Review',
        description: 'Focused analysis of citations, references, and bibliography formatting according to your chosen citation style',
        icon: '📚',
        estimatedTime: '2-3 minutes'
      }
    ];
  }
  async humanizeText(text, mode = 'standard', intensity = 'medium', userPlan = 'pro') {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
      console.log('OpenAI API key not configured - returning original text');
      return text;
    }

    const selectedModel = 'gpt-4.1-nano'; // All plans use nano (premium keeps mini only for AI essay analysis)
    const maxTokens = 8000;

    const intensityInstructions = {
      light: `Make targeted but impactful changes:
- Swap out the most glaring AI-specific phrases (see banned list) for simpler, direct alternatives
- Add contractions in 40-60% of places where they'd naturally appear
- Break up 2-3 of the longest sentences
- Change 1-2 paragraph openers so they don't start with a transition word
- Keep 80-85% of original wording intact`,

      medium: `Rewrite with a human voice throughout:
- Replace all banned AI vocabulary and sentence openers
- Apply contractions consistently where they feel natural
- Vary sentence lengths meaningfully: some under 10 words, some over 30
- Rewrite 40-50% of sentence structures so they open differently
- Add 2-3 natural imperfections: a hedging phrase, a slightly tangential observation, a question the writer poses to themselves
- Let some transitions be abrupt or minimal rather than always perfectly smooth
- Vary paragraph lengths: some 1-2 sentences, some 4-5
- Preserve all facts, arguments, and meaning exactly`,

      aggressive: `Fully reimagine in a human voice while keeping all facts and structure:
- Rewrite virtually every sentence — new structure, new opening, same meaning
- Mix sentence lengths dramatically: some fragments (1-5 words), some long and winding (35+ words)
- Use contractions freely throughout
- Add first-person observations or asides where they fit ("I'd argue...", "which, honestly, makes sense")
- Let some paragraphs be a single sentence. Let others run long
- Use simple connecting words ("also", "but", "so", "which means") instead of formal transitions
- Add small rhetorical questions or self-corrections that feel spontaneous
- Make at least 2 sentence openers start with "And" or "But"
- The result should feel like a smart, engaged student wrote this on a deadline`
    };

    const modeInstructions = {
      standard: `Aim for natural college-student writing: clear, competent, slightly informal. Not overly polished, not sloppy. The writer knows what they're saying and says it directly.`,
      academic: `Sound like a real student in an academic discipline. Keep technical terms and citation-adjacent language where appropriate. Use first-person occasionally ("I argue", "this suggests to me"). Let the formality be genuine rather than performed — real academic writing has rhythm, conviction, and the occasional awkward sentence. It does not sound like a press release.`,
      casual: `Write like a smart person explaining something to a friend. Contractions everywhere. Start sentences with "And", "But", "So", "Look". Use "a lot" instead of "numerous". Keep sentences punchy. The occasional fragment is fine. The tone is confident and direct.`,
      creative: `Write with genuine voice and rhythm. Vary the tempo: short bursts followed by longer, more flowing sentences. Use unexpected word choices. Let the writing have a point of view. Think personal essay, not report.`
    };

    const systemPrompt = `You are a professional ghostwriter who specialises in making AI-generated text completely undetectable. Your rewrites pass GPTZero, Turnitin AI Detection, ZeroGPT, Originality.ai, and Copyleaks at the highest settings. You have studied how AI detectors work and you know exactly what patterns they flag.

════════════════════════════════════════
ABSOLUTE BANS — NEVER USE THESE
════════════════════════════════════════

BANNED PUNCTUATION / STRUCTURAL PATTERNS:
- Em dashes (— or –) used as mid-sentence asides. This is the single biggest AI tell. Professors and detectors both flag it. Do not use them AT ALL. If you need a pause or aside, use commas, parentheses, or restructure the sentence.
- Bulleted or numbered lists inside prose paragraphs (unless the original had them)
- Three-part parallel structures that are too neat (e.g. "X, Y, and Z" repeated as a structural pattern)
- Every paragraph starting with a transition word

BANNED VOCABULARY (never use these words or phrases):
delve, delves, delving | tapestry | nuanced, nuance | multifaceted | leverage (as a verb) | utilize, utilization | facilitate | paramount | groundbreaking | game-changer | cutting-edge | it is worth noting | it is important to note | it is worth mentioning | needless to say | in today's world / society / landscape | in the realm of | as we navigate | the ever-evolving | plays a crucial role | plays a vital role | is a testament to | serves as a testament | at its core | in conclusion | to summarize | to sum up | in summary | furthermore (as a sentence opener) | moreover (as a sentence opener) | additionally (as a sentence opener) | this highlights | this underscores | this demonstrates | this showcases | this essay will | this paper will | this report will | one must | one should | one can | individuals (meaning "people") | plethora | myriad (as a standalone adjective: "a myriad of") | robust (meaning thorough/strong in a vague sense) | seamlessly | holistic | impactful (as a vague filler adjective) | transformative | synergy | aforementioned | heretofore | thus (at sentence start unless truly necessary) | hence (at sentence start) | whilst (unless writing in British English) | commence | endeavour | ascertain | procurement

BANNED SENTENCE OPENERS (never start a sentence with):
"It is important to...", "It should be noted that...", "It is worth...", "There are many...", "There are several...", "In today's...", "In recent years...", "Over the course of...", "Throughout history...", "As a result of this...", "This is because..."

BANNED STRUCTURAL PATTERNS:
- Intro paragraph that announces what the essay will do ("This essay will explore...")
- Conclusion paragraph that restates every single point made
- Every paragraph following exactly the same length
- Perfect topic-sentence-then-evidence structure in every single paragraph (vary it)

════════════════════════════════════════
REQUIRED HUMAN PATTERNS
════════════════════════════════════════

SENTENCE VARIETY (mandatory):
- Include at least 2 sentences under 10 words
- Include at least 1 sentence over 30 words that winds naturally
- No more than 3 consecutive sentences of similar length
- Vary sentence openers: some start with the subject, some with a dependent clause, some with a short adverb, some with "And" or "But"

VOCABULARY:
- Use contractions wherever natural (don't, can't, it's, they've, we're, wouldn't)
- Replace formal Latinate words with shorter Anglo-Saxon alternatives where meaning is preserved (e.g. "use" not "utilise", "start" not "commence", "find out" not "ascertain")
- Use hedging language that sounds genuine: "probably", "seems like", "from what I can tell", "in most cases", "generally speaking", "which is fair to say"
- Occasionally use a slightly informal word in an otherwise formal sentence — real writers do this

TRANSITIONS:
- Use simple connectors: "but", "so", "which means", "because of this", "and yet", "still", "even so"
- Some paragraphs can start directly with a claim, no transition at all
- Avoid starting more than 2 paragraphs with any transition word

PUNCTUATION:
- Use commas for pauses (not em dashes)
- Use parentheses sparingly for genuine asides (not as a substitute for em dashes)
- Occasional short sentences followed by longer ones create natural rhythm
- Do not use semicolons excessively — use a period and start a new sentence

════════════════════════════════════════
FIXED RULES
════════════════════════════════════════
- Preserve ALL factual claims, data, arguments, and evidence exactly
- Preserve the overall structure (introduction, body, conclusion) and paragraph order
- Keep technical and discipline-specific terminology — do not simplify specialist language
- Stay within 5% of the original word count
- Return ONLY the rewritten text. No preamble, no explanation, no "Here is the rewritten version:" label.

════════════════════════════════════════
WRITING MODE: ${modeInstructions[mode] || modeInstructions.standard}

INTENSITY LEVEL: ${intensityInstructions[intensity] || intensityInstructions.medium}
════════════════════════════════════════`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: selectedModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Rewrite the following text according to all instructions above:\n\n${text}` }
        ],
        max_tokens: maxTokens,
        temperature: 0.82,
        top_p: 0.92,
        frequency_penalty: 0.45,
        presence_penalty: 0.15,
      });

      let result = completion.choices[0]?.message?.content;
      if (!result) {
        throw new Error('No response from OpenAI');
      }
      
      // Post-process: Remove any em dashes that slipped through (replace with commas or restructure)
      // Em dash (—) and en dash (–) are major AI tells
      result = result
        .replace(/\s*—\s*/g, ', ')  // Em dash to comma
        .replace(/\s*–\s*/g, ', ')  // En dash to comma
        .replace(/,\s*,/g, ',')     // Clean up double commas
        .replace(/,\s*\./g, '.')    // Clean up comma before period
        .trim();
      
      return result;
    } catch (error) {
      console.error('OpenAI humanize error:', error);
      throw new Error('Failed to humanize text: ' + error.message);
    }
  }

  /**
   * Summarize text into key points
   * @param {string} text - The text to summarize
   * @param {string} style - Summary style: 'bullet', 'paragraph', 'tldr', 'detailed'
   * @param {number} length - Target length: 'short', 'medium', 'long'
   * @returns {Object} Summarized content
   */
  async summarizeText(text, style = 'bullet', length = 'medium', userPlan = 'free') {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
      console.log('OpenAI API key not configured');
      throw new Error('OpenAI API key not configured');
    }

    const selectedModel = 'gpt-4.1-nano'; // All plans use nano (premium keeps mini only for AI essay analysis)

    const lengthInstructions = {
      short: 'Create a very concise summary (3-5 key points or 50-100 words).',
      medium: 'Create a balanced summary (5-8 key points or 150-250 words).',
      long: 'Create a comprehensive summary (8-12 key points or 300-500 words) that captures nuances and supporting details.'
    };

    const styleInstructions = {
      bullet: `Format the summary as bullet points. Each bullet should be a complete, standalone insight. Use clear, direct language. Group related points under headers if the content covers multiple topics.`,
      paragraph: `Write the summary as flowing paragraphs. Start with the main thesis/argument, then cover key supporting points. End with any conclusions or implications.`,
      tldr: `Create an ultra-concise "TL;DR" summary in 1-3 sentences that captures the absolute essence. Then provide 3-5 "Key Takeaways" as short bullet points.`,
      detailed: `Create a structured summary with plain text section headers (no markdown). Use:
1. Overview (2-3 sentences)
2. Main Arguments/Points (organized by theme)
3. Key Evidence/Examples mentioned
4. Conclusions/Implications
5. Critical Notes (any limitations, biases, or gaps)`
    };

    const systemPrompt = `You are an expert academic summarizer. Your summaries are:
- Accurate: You never add information not present in the original
- Clear: You use plain language and avoid jargon unless it's essential
- Structured: Your summaries are easy to scan and understand
- Insightful: You identify what matters most, not just what's mentioned first

${lengthInstructions[length] || lengthInstructions.medium}

${styleInstructions[style] || styleInstructions.bullet}

IMPORTANT:
- Preserve the original meaning accurately
- Identify the author's main argument or thesis
- Highlight key evidence, data, or examples
- Note any conclusions or implications
- Return ONLY the summary, no meta-commentary like "Here is the summary:"
- Do NOT use markdown formatting: no asterisks for bold (** or *), no underscores for emphasis. Output plain text only.`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: selectedModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Summarize the following text:\n\n${text}` }
        ],
        max_tokens: 2000,
        temperature: 0.3,
      });

      let summary = completion.choices[0]?.message?.content;
      if (!summary) {
        throw new Error('No response from OpenAI');
      }
      // Strip markdown bold/emphasis so **word** or *word* becomes plain "word"
      summary = summary.trim()
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/__([^_]+)__/g, '$1')
        .replace(/_([^_]+)_/g, '$1');

      return {
        summary,
        style,
        length,
        originalWordCount: text.trim().split(/\s+/).length,
        summaryWordCount: summary.trim().split(/\s+/).length
      };
    } catch (error) {
      console.error('OpenAI summarize error:', error);
      throw new Error('Failed to summarize text: ' + error.message);
    }
  }

  /**
   * Generate quiz questions from text
   * @param {string} text - The text to generate questions from
   * @param {string} quizType - Quiz type: 'multiple_choice', 'true_false', 'fill_blank', 'mixed'
   * @param {string} difficulty - Difficulty: 'easy', 'medium', 'hard'
   * @param {number} bankCount - Number of questions to generate in the bank (e.g. 30)
   * @param {number} displayCount - Number to show per attempt (e.g. 10); if omitted, same as bankCount
   * @returns {Object} Quiz with questions array (full bank) and displayCount
   */
  async generateQuiz(text, quizType = 'mixed', difficulty = 'medium', bankCount = 10, displayCount = null, userPlan = 'pro') {
    const questionCount = bankCount;
    if (displayCount == null) displayCount = bankCount;
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
      console.log('OpenAI API key not configured');
      throw new Error('OpenAI API key not configured');
    }

    const selectedModel = 'gpt-4.1-nano'; // All plans use nano (premium keeps mini only for AI essay analysis)

    const difficultyInstructions = {
      easy: 'Create straightforward questions that test basic recall and comprehension. Focus on main ideas and explicit facts.',
      medium: 'Create questions that require understanding and application. Include some questions that connect ideas or require inference.',
      hard: 'Create challenging questions that test deep understanding, analysis, and synthesis. Include questions about implications, comparisons, and critical evaluation.'
    };

    const typeInstructions = {
      multiple_choice: `Generate ONLY multiple choice questions. Each question should have:
- A clear question stem
- 4 options (A, B, C, D)
- Only ONE correct answer
- Plausible distractors (wrong answers that seem reasonable)`,
      true_false: `Generate ONLY true/false questions. Each statement should:
- Be clearly true or false (not ambiguous)
- Test understanding, not trick the reader
- Cover important concepts from the text`,
      fill_blank: `Generate ONLY fill-in-the-blank style questions BUT presented as multiple choice. Each question should:
- Have a sentence with a blank indicated by "___"
- Provide 4 options (A, B, C, D) for what fills the blank
- Only ONE correct answer
- Include plausible wrong options that could fit grammatically`,
      mixed: `Generate a MIX of question types:
- About 50% standard multiple choice (4 options each)
- About 25% true/false
- About 25% fill-in-the-blank style (with 4 multiple choice options)
Distribute types throughout the quiz for variety.`
    };

    const systemPrompt = `You are an expert quiz creator for academic content. Your quizzes are:
- Educational: Questions reinforce learning and test understanding
- Fair: Questions are clear and unambiguous
- Varied: Different cognitive levels (recall, comprehension, application, analysis)
- Engaging: Questions are interesting and well-crafted

${difficultyInstructions[difficulty] || difficultyInstructions.medium}

${typeInstructions[quizType] || typeInstructions.mixed}

Generate exactly ${questionCount} questions.

IMPORTANT: Return your response as valid JSON in this exact format:
{
  "title": "Quiz title based on content",
  "questions": [
    {
      "id": 1,
      "type": "multiple_choice" | "true_false" | "fill_blank",
      "question": "The question text (for fill_blank, include ___ where the blank is)",
      "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
      "correctAnswer": "A" | "B" | "C" | "D" | "true" | "false",
      "explanation": "Brief explanation of why this is correct"
    }
  ]
}

CRITICAL RULES:
- For multiple_choice: options is required, correctAnswer must be "A", "B", "C", or "D"
- For true_false: options should be omitted, correctAnswer must be "true" or "false"
- For fill_blank: options is REQUIRED (4 choices for what fills the blank), correctAnswer must be "A", "B", "C", or "D"

DO NOT include any text outside the JSON object.`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: selectedModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate a ${difficulty} difficulty quiz with ${questionCount} ${quizType === 'mixed' ? 'mixed-type' : quizType.replace('_', ' ')} questions based on this text:\n\n${text}` }
        ],
        max_tokens: 8000,
        temperature: 0.7,
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) {
        throw new Error('No response from OpenAI');
      }

      // Parse the JSON response
      let quiz;
      try {
        // Try to extract JSON if there's extra text
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          quiz = JSON.parse(jsonMatch[0]);
        } else {
          quiz = JSON.parse(responseText);
        }
      } catch (parseError) {
        console.error('Failed to parse quiz JSON:', parseError);
        throw new Error('Failed to parse quiz response');
      }

      return {
        ...quiz,
        quizType,
        difficulty,
        questionCount: displayCount,
        displayCount,
        questionBankSize: quiz.questions?.length || questionCount,
        sourceWordCount: text.trim().split(/\s+/).length
      };
    } catch (error) {
      console.error('OpenAI quiz generation error:', error);
      throw new Error('Failed to generate quiz: ' + error.message);
    }
  }
  async generateFlashcards(text, cardCount = 15, userPlan = 'pro') {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
      throw new Error('OpenAI API key not configured');
    }

    const selectedModel = 'gpt-4.1-nano'; // All plans use nano (premium keeps mini only for AI essay analysis)

    const systemPrompt = `You are an expert study-aid creator. Generate exactly ${cardCount} flashcards from the provided text.

Each flashcard has a FRONT (question, term, or prompt) and a BACK (answer, definition, or explanation).

Guidelines:
- Cover the most important concepts, terms, and facts
- Make fronts concise and specific
- Make backs clear and informative (1-3 sentences)
- Vary between definition cards, concept cards, and application cards
- Order them from foundational concepts to more complex ideas

Return valid JSON in this EXACT format:
{
  "title": "Flashcard deck title based on the content",
  "cards": [
    {
      "id": 1,
      "front": "Question or term on the front of the card",
      "back": "Answer or definition on the back of the card"
    }
  ]
}

DO NOT include any text outside the JSON object.`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: selectedModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate ${cardCount} flashcards from this text:\n\n${text}` }
        ],
        max_tokens: 3000,
        temperature: 0.7,
      });

      const responseText = completion.choices[0].message.content.trim();
      let result;
      try {
        result = JSON.parse(responseText);
      } catch {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Failed to parse flashcard response');
        }
      }

      return {
        ...result,
        cardCount: result.cards?.length || cardCount,
        sourceWordCount: text.trim().split(/\s+/).length
      };
    } catch (error) {
      console.error('OpenAI flashcard generation error:', error);
      throw new Error('Failed to generate flashcards: ' + error.message);
    }
  }

  async generateCrossword(text, wordCount = 12, userPlan = 'pro') {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
      throw new Error('OpenAI API key not configured');
    }

    const selectedModel = 'gpt-4.1-nano'; // All plans use nano (premium keeps mini only for AI essay analysis)

    const systemPrompt = `You are an expert crossword puzzle creator for educational content. Extract exactly ${wordCount} key terms from the provided text and create clues for them.

Rules for terms:
- Each term must be a SINGLE WORD (no spaces, no hyphens) of 3-12 letters
- Only use letters A-Z (no numbers, no special characters)
- Terms should be important vocabulary, concepts, or names from the text
- All terms must be UPPERCASE

Rules for clues:
- Each clue should be a concise hint (one sentence) that helps the student recall the term
- Clues should test understanding, not just definition recall

Return valid JSON in this EXACT format:
{
  "title": "Crossword title based on the content",
  "words": [
    {
      "id": 1,
      "word": "PHOTOSYNTHESIS",
      "clue": "Process by which plants convert sunlight into energy"
    }
  ]
}

CRITICAL: Every "word" value must be a single word with ONLY uppercase A-Z letters, 3-12 characters long.
DO NOT include any text outside the JSON object.`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: selectedModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Extract ${wordCount} key terms and create crossword clues from this text:\n\n${text}` }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      });

      const responseText = completion.choices[0].message.content.trim();
      let result;
      try {
        result = JSON.parse(responseText);
      } catch {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Failed to parse crossword response');
        }
      }

      // Clean words: strip non-alpha, uppercase, filter valid
      if (result.words) {
        result.words = result.words
          .map(w => ({ ...w, word: w.word.replace(/[^A-Za-z]/g, '').toUpperCase() }))
          .filter(w => w.word.length >= 3 && w.word.length <= 12);
      }

      // Generate the crossword grid layout
      const grid = this.buildCrosswordGrid(result.words || []);

      return {
        ...result,
        grid: grid.grid,
        placedWords: grid.placedWords,
        gridSize: grid.size,
        wordCount: grid.placedWords.length,
        sourceWordCount: text.trim().split(/\s+/).length
      };
    } catch (error) {
      console.error('OpenAI crossword generation error:', error);
      throw new Error('Failed to generate crossword: ' + error.message);
    }
  }

  /**
   * Build a crossword grid from a list of words.
   * Simple greedy placement: place the longest word first, then try to intersect subsequent words.
   */
  buildCrosswordGrid(words) {
    if (!words || words.length === 0) return { grid: [], placedWords: [], size: 0 };

    const sorted = [...words].sort((a, b) => b.word.length - a.word.length);
    const SIZE = 20;
    const grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(''));
    const placedWords = [];
    let number = 1;

    // Place first word horizontally in the middle
    const first = sorted[0];
    const startRow = Math.floor(SIZE / 2);
    const startCol = Math.floor((SIZE - first.word.length) / 2);
    for (let i = 0; i < first.word.length; i++) {
      grid[startRow][startCol + i] = first.word[i];
    }
    placedWords.push({
      ...first,
      number: number++,
      direction: 'across',
      row: startRow,
      col: startCol,
      length: first.word.length
    });

    // Try to place remaining words by finding intersections
    for (let wi = 1; wi < sorted.length; wi++) {
      const w = sorted[wi];
      let placed = false;

      for (const pw of placedWords) {
        if (placed) break;
        for (let pi = 0; pi < pw.word.length; pi++) {
          if (placed) break;
          for (let ci = 0; ci < w.word.length; ci++) {
            if (w.word[ci] !== pw.word[pi]) continue;

            // Try perpendicular placement
            const isAcross = pw.direction === 'down';
            let r, c;
            if (isAcross) {
              r = pw.row + pi;
              c = pw.col - ci;
            } else {
              r = pw.row - ci;
              c = pw.col + pi;
            }

            // Check bounds
            if (isAcross && (c < 0 || c + w.word.length > SIZE)) continue;
            if (!isAcross && (r < 0 || r + w.word.length > SIZE)) continue;

            // Check every cell the new word would occupy
            let canPlace = true;
            for (let k = 0; k < w.word.length; k++) {
              const cr = isAcross ? r : r + k;
              const cc = isAcross ? c + k : c;
              const existing = grid[cr][cc];

              if (existing === '') {
                // Check adjacency — no parallel touching
                if (isAcross) {
                  if ((cr > 0 && grid[cr - 1][cc] !== '' && k !== ci) ||
                      (cr < SIZE - 1 && grid[cr + 1][cc] !== '' && k !== ci)) {
                    canPlace = false; break;
                  }
                } else {
                  if ((cc > 0 && grid[cr][cc - 1] !== '' && k !== ci) ||
                      (cc < SIZE - 1 && grid[cr][cc + 1] !== '' && k !== ci)) {
                    canPlace = false; break;
                  }
                }
              } else if (existing !== w.word[k]) {
                canPlace = false; break;
              }
            }

            // Check cell before and after the word is empty
            if (canPlace) {
              if (isAcross) {
                if (c > 0 && grid[r][c - 1] !== '') canPlace = false;
                if (c + w.word.length < SIZE && grid[r][c + w.word.length] !== '') canPlace = false;
              } else {
                if (r > 0 && grid[r - 1][c] !== '') canPlace = false;
                if (r + w.word.length < SIZE && grid[r + w.word.length][c] !== '') canPlace = false;
              }
            }

            if (canPlace) {
              for (let k = 0; k < w.word.length; k++) {
                const cr = isAcross ? r : r + k;
                const cc = isAcross ? c + k : c;
                grid[cr][cc] = w.word[k];
              }
              placedWords.push({
                ...w,
                number: number++,
                direction: isAcross ? 'across' : 'down',
                row: r,
                col: c,
                length: w.word.length
              });
              placed = true;
            }
          }
        }
      }
    }

    // Trim grid to the bounding box of placed letters
    let minR = SIZE, maxR = 0, minC = SIZE, maxC = 0;
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (grid[r][c] !== '') {
          minR = Math.min(minR, r); maxR = Math.max(maxR, r);
          minC = Math.min(minC, c); maxC = Math.max(maxC, c);
        }
      }
    }

    const trimmed = [];
    for (let r = minR; r <= maxR; r++) {
      trimmed.push(grid[r].slice(minC, maxC + 1));
    }

    const adjusted = placedWords.map(pw => ({
      ...pw,
      row: pw.row - minR,
      col: pw.col - minC
    }));

    return { grid: trimmed, placedWords: adjusted, size: Math.max(maxR - minR + 1, maxC - minC + 1) };
  }

  async generateReflexQuestions(inputType, content, userPlan = 'free') {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
      throw new Error('OpenAI API key not configured');
    }

    const selectedModel = 'gpt-4.1-nano'; // All plans use nano (premium keeps mini only for AI essay analysis)

    const systemPrompt = `You are a quiz question generator for a fast-paced arcade-style reflex game.

Generate exactly 20 multiple-choice questions. Each question MUST have exactly 4 answer options.

Rules:
- Questions should be SHORT (max 12 words) so players can read quickly
- Answers should be 1-4 words max (players must read them as tiles fall)
- One clearly correct answer per question
- Three plausible but wrong distractors
- Vary difficulty: mix easy recall with harder application questions
- Make them fun and engaging

Return ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "id": "q1",
      "prompt": "Short question text?",
      "answers": ["Correct Answer", "Wrong 1", "Wrong 2", "Wrong 3"],
      "correctIndex": 0
    }
  ]
}

CRITICAL: The correct answer MUST always be at index 0 in the answers array. The game shuffles them before display.
DO NOT include any text outside the JSON object.`;

    const userPrompt = inputType === 'topic'
      ? `Generate 20 fast-paced quiz questions about: ${content}`
      : `Generate 20 fast-paced quiz questions from these study notes. Use only the content below (first 10,000 words):\n\n${content.trim().split(/\s+/).slice(0, 10000).join(' ')}`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: selectedModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 3000,
        temperature: 0.6,
        response_format: { type: 'json_object' },
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) throw new Error('No response from AI');

      let parsed;
      try {
        parsed = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse reflex questions JSON:', parseError, 'Raw:', responseText?.slice(0, 500));
        throw new Error('Failed to parse questions response');
      }

      if (!parsed.questions || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
        throw new Error('No questions generated');
      }

      parsed.questions = parsed.questions.filter(q =>
        q.prompt && Array.isArray(q.answers) && q.answers.length === 4 && typeof q.correctIndex === 'number'
      );

      // Minimum-question floor: a Crater Blast play session feels broken
      // with fewer than 5 valid questions, so we throw below that threshold.
      // (Previously this method silently returned an empty array when every
      // question failed the strict 4-answer filter — frontend then rendered
      // a broken Crater Blast tile.) The retry layer in generateStudyPack
      // gives the model another attempt; temperature variance often
      // produces enough valid output on retry to clear this bar.
      if (parsed.questions.length < 5) {
        throw new Error(`Crater Blast validation: only ${parsed.questions.length} valid questions (need at least 5)`);
      }

      return parsed;
    } catch (error) {
      console.error('OpenAI reflex question generation error:', error);
      throw new Error('Failed to generate questions: ' + error.message);
    }
  }

  async generateWordTowerQuestions(inputType, content, userPlan = 'free') {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
      throw new Error('OpenAI API key not configured');
    }

    const selectedModel = 'gpt-4.1-nano';

    const systemPrompt = `You are generating questions for a falling-block study game called Word Tower. The player must catch correct answers and dodge wrong ones.

Generate exactly 15 questions. Each question MUST:

1. Have a CLEAR yes/no criterion in the prompt (e.g. "Which of these are X?", "Which belong to category Y?", "Which are true statements about Z?")
2. Contain 6 items total
3. Have AT LEAST 2 correct AND AT LEAST 2 incorrect items per question
4. Use SHORT item text (1-3 words ideal, never more than 5 words — they must fit on falling blocks)
5. Be unambiguous — items must clearly be correct or incorrect, not "kind of"
6. Vary the criterion across questions — also use "which are NOT X?", "which are true about X?", etc.

CRITICAL: Items must be unambiguous. If an item could plausibly belong to either category, exclude it.

Return ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "id": "q1",
      "prompt": "Short question text?",
      "items": [
        { "text": "Word", "isCorrect": true },
        { "text": "Word", "isCorrect": false }
      ]
    }
  ]
}

DO NOT include any text outside the JSON object.`;

    const userPrompt = inputType === 'topic'
      ? `Generate 15 Word Tower questions about: ${content}`
      : `Generate 15 Word Tower questions from these study notes. Use only the content below (first 10,000 words):\n\n${content.trim().split(/\s+/).slice(0, 10000).join(' ')}`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: selectedModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 3000,
        temperature: 0.5,
        response_format: { type: 'json_object' },
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) throw new Error('No response from AI');

      let parsed;
      try {
        parsed = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse word tower questions JSON:', parseError, 'Raw:', responseText?.slice(0, 500));
        throw new Error('Failed to parse questions response');
      }

      if (!parsed.questions || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
        throw new Error('No questions generated');
      }

      parsed.questions = parsed.questions
        .filter(q => q.prompt && Array.isArray(q.items) && q.items.length >= 4)
        .map(q => {
          const items = q.items.filter(it =>
            it && typeof it.text === 'string' && it.text.trim().length > 0 && typeof it.isCorrect === 'boolean'
          );
          return { ...q, items };
        })
        .filter(q => {
          const correct = q.items.filter(it => it.isCorrect).length;
          const incorrect = q.items.length - correct;
          return correct >= 2 && incorrect >= 2;
        });

      // Minimum-question floor: a Word Tower play session feels broken with
      // fewer than 4 valid questions, so we throw below that threshold.
      // The retry layer in generateStudyPack will give the model another
      // attempt — temperature variance often produces enough valid output
      // on retry to clear this bar. Using a fixed floor (rather than a %
      // of requested) means tightening the model's output count later
      // doesn't accidentally make this check more permissive.
      if (parsed.questions.length < 4) {
        throw new Error(`Word Tower validation: only ${parsed.questions.length} valid questions (need at least 4)`);
      }

      return parsed;
    } catch (error) {
      console.error('OpenAI word tower question generation error:', error);
      throw new Error('Failed to generate questions: ' + error.message);
    }
  }

  async saveWordTowerGame(userId, payload, userPlan = 'free') {
    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
      );

      const isPaidUser = subscriptionService.isPaidSubscriptionTier(userPlan || 'free');
      const expiresAt = isPaidUser ? null : getExpiresAt30Days();

      const title = (payload.title || payload.sourceText || 'Word Tower Game').toString().slice(0, 200);
      const wordCount = (payload.sourceText || '').toString().trim().split(/\s+/).length;

      const gameData = {
        user_id: userId,
        title,
        quiz_type: 'word_tower',
        difficulty: 'mixed',
        question_count: (payload.questions || []).length,
        questions: {
          questions: payload.questions || [],
          inputType: payload.inputType || 'topic',
          sourceText: (payload.sourceText || '').toString().slice(0, 10000)
        },
        source_word_count: wordCount,
        created_at: new Date().toISOString(),
        expires_at: expiresAt
      };

      const { data, error } = await supabase
        .from('quizzes')
        .insert([gameData])
        .select();

      if (error) {
        console.error('Error saving Word Tower game:', error);
        return null;
      }

      return data[0];
    } catch (error) {
      console.error('Database error in saveWordTowerGame:', error);
      return null;
    }
  }

  /**
   * Word Blitz — 60-second cloze-sentence speedrun.
   *
   * Each generated question is one sentence with exactly one blank
   * (marked as "{{blank}}"), one correct answer (1-3 words), and three
   * plausible-but-wrong distractors from the same category.
   *
   * The frontend assembles the four answer buttons by combining
   * `correctAnswer + distractors`, then shuffles with the no-3-in-a-row
   * safety rule before display.
   */
  async generateWordBlitzQuestions(inputType, content, userPlan = 'free') {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
      throw new Error('OpenAI API key not configured');
    }

    const selectedModel = 'gpt-4.1-nano';

    const systemPrompt = `You are generating questions for a 60-second fill-in-the-blank study game called Word Blitz. Players read a sentence with one word missing and tap the correct answer from 4 choices.

Generate exactly 25 questions. Each question MUST follow these rules:

1. Be a single sentence, 8-20 words long, that makes sense even with the blank
2. Have exactly ONE blank, marked as the literal token {{blank}}
3. The blanked term should be a meaningful concept word, not a function word (do NOT blank "the", "is", "of", "a", "an", "and", etc.)
4. Have 1 correct answer (1-3 words long) and exactly 3 plausible distractors
5. Distractors must be FROM THE SAME CATEGORY as the correct answer (if blanking an organ, distractors are other organs; if blanking a date, distractors are other dates from the same era; if blanking a country, distractors are other countries)
6. Distractors must be CLEARLY WRONG given the sentence context — but plausible enough that someone who hasn't studied would hesitate
7. Vary topics across questions — don't repeat the same blanked concept twice
8. Keep all answer text short enough to fit on a button (max 3 words)

CRITICAL: The sentence with the blank filled in by the correct answer must be unambiguously true. The sentence with any distractor must be unambiguously false.

Return ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "id": "q1",
      "sentence": "string with {{blank}} marker",
      "correctAnswer": "string",
      "distractors": ["string", "string", "string"]
    }
  ]
}

DO NOT include any text outside the JSON object.`;

    const userPrompt = inputType === 'topic'
      ? `Generate 25 Word Blitz fill-in-the-blank questions about: ${content}`
      : `Generate 25 Word Blitz fill-in-the-blank questions from these study notes. Use only the content below (first 10,000 words):\n\n${content.trim().split(/\s+/).slice(0, 10000).join(' ')}`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: selectedModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 3000,
        // 0.4 is recommended in the spec — slightly lower than the other
        // games because Word Blitz's "blank must be unambiguous" constraint is
        // strict and benefits from more deterministic output.
        temperature: 0.4,
        response_format: { type: 'json_object' },
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) throw new Error('No response from AI');

      let parsed;
      try {
        parsed = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse Word Blitz questions JSON:', parseError, 'Raw:', responseText?.slice(0, 500));
        throw new Error('Failed to parse questions response');
      }

      if (!parsed.questions || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
        throw new Error('No questions generated');
      }

      // Strict validation:
      //   - sentence must be a string with the literal {{blank}} token
      //   - correctAnswer must be a non-empty string
      //   - distractors must be an array of exactly 3 non-empty strings
      // Anything that fails the contract is dropped silently — better to
      // ship 18 valid questions than crash the game on a malformed one.
      parsed.questions = parsed.questions.filter(q =>
        q && typeof q.sentence === 'string'
          && q.sentence.includes('{{blank}}')
          && typeof q.correctAnswer === 'string'
          && q.correctAnswer.trim().length > 0
          && Array.isArray(q.distractors)
          && q.distractors.length === 3
          && q.distractors.every(d => typeof d === 'string' && d.trim().length > 0)
      );

      // Minimum-question floor: matches Crater Blast's threshold of 5.
      // We aim for 25 valid questions but a 60-second session is still
      // playable with as few as 5 — better to ship a slightly thin
      // pack than fail the whole study-pack generation. The retry layer
      // in generateStudyPack will already have tried multiple times.
      if (parsed.questions.length < 5) {
        throw new Error(`Word Blitz validation: only ${parsed.questions.length} valid questions (need at least 5)`);
      }

      return parsed;
    } catch (error) {
      console.error('OpenAI Word Blitz question generation error:', error);
      throw new Error('Failed to generate questions: ' + error.message);
    }
  }

  /**
   * Persist a Word Blitz game so the user can replay it from "Saved Materials".
   * Mirrors saveWordTowerGame exactly — same `quizzes` table, same TTL
   * for free plans, just `quiz_type = 'word_blitz'`.
   */
  async saveWordBlitzGame(userId, payload, userPlan = 'free') {
    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
      );

      const isPaidUser = subscriptionService.isPaidSubscriptionTier(userPlan || 'free');
      const expiresAt = isPaidUser ? null : getExpiresAt30Days();

      const title = (payload.title || payload.sourceText || 'Word Blitz Game').toString().slice(0, 200);
      const wordCount = (payload.sourceText || '').toString().trim().split(/\s+/).length;

      const gameData = {
        user_id: userId,
        title,
        quiz_type: 'word_blitz',
        difficulty: 'mixed',
        question_count: (payload.questions || []).length,
        questions: {
          questions: payload.questions || [],
          inputType: payload.inputType || 'topic',
          sourceText: (payload.sourceText || '').toString().slice(0, 10000)
        },
        source_word_count: wordCount,
        created_at: new Date().toISOString(),
        expires_at: expiresAt
      };

      const { data, error } = await supabase
        .from('quizzes')
        .insert([gameData])
        .select();

      if (error) {
        console.error('Error saving Word Blitz game:', error);
        return null;
      }

      return data[0];
    } catch (error) {
      console.error('Database error in saveWordBlitzGame:', error);
      return null;
    }
  }

  // Generate all 3 lesson styles in parallel - completely different content for each
  async generateAllLessonStyles(text, userPlan = 'free') {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
      console.log('OpenAI API key not configured');
      throw new Error('OpenAI API key not configured');
    }

    const selectedModel = 'gpt-4.1-nano'; // All plans use nano (premium keeps mini only for AI essay analysis)

    // Use only the first 10,000 words for AI processing
    const words = text.trim().split(/\s+/);
    const first10kWords = words.slice(0, 10000).join(' ');
    const wordCount = Math.min(words.length, 10000);

    // Scale slides by word count: <1k=6, 1k-2k=6-8, 2k-5k=8-10, 5k+=10+
    const slideCount = this.getSlideCountForWordCount(wordCount);

    // Three completely different prompts for three unique lessons
    const prompts = {
      visual: `You are a FUN, energetic educational content creator who makes learning feel like scrolling through social media. Create a VISUAL CARDS lesson that's colorful, emoji-heavy, and super engaging.

Your style:
- Use LOTS of emojis (2-3 per slide title) 🎯🔥✨
- Write like you're excited to share cool facts
- Use phrases like "Did you know?", "Fun fact!", "Mind-blown moment:", "Pro tip:"
- Make each card feel like a quick, satisfying social media post
- Include "clickable" bullet points that reveal surprising details
- Highlight vocabulary with 🔑 Key Term callouts

Create ${slideCount} slides. Each slide needs:
- type: one of "intro", "concept", "example", "keypoint", "funfact", "summary"
- title: emoji-rich, catchy title (like a TikTok caption)
- content: 2-3 punchy sentences with personality
- emoji: the MAIN emoji for this card
- bulletPoints: 3-5 reveal items for concept/keypoint types (make them interesting facts!)
- highlightedTerm: optional vocabulary word

JSON format:
{
  "title": "🎯 Catchy Lesson Title Here! 🚀",
  "slides": [
    {"id": 1, "type": "intro", "title": "📖 Welcome! Let's Learn Something Cool", "content": "Get ready...", "emoji": "🎉"},
    {"id": 2, "type": "concept", "title": "💡 Mind = Blown", "content": "Here's the thing...", "emoji": "💡", "bulletPoints": ["Fact 1", "Fact 2", "Fact 3"], "highlightedTerm": "Key word"}
  ],
  "estimatedReadTime": ${Math.ceil(slideCount * 1.2)}
}

Rules:
- Be enthusiastic and fun, not boring or academic
- Each card should feel complete on its own
- Use emojis strategically to highlight key points
- Never use em dashes (—). Use commas, periods, or colons instead.
- Return ONLY valid JSON`,

      stepByStep: `You are a patient, methodical instructor who builds knowledge step by step. Create a STEP-BY-STEP lesson that feels like a guided tutorial with clear checkpoints.

Your style:
- Number everything: "Step 1:", "Step 2:", etc.
- Use phrases like "First, let's understand...", "Now that you know X, let's move to...", "Checkpoint: Can you explain...?"
- Build each step on the previous one
- Include "🔍 Let's verify" checkpoints
- Use simple, clear language - no jargon without explanation
- Progress from basic → intermediate → advanced

Create ${slideCount} steps. Each step needs:
- type: one of "intro", "concept", "example", "keypoint", "checkpoint", "summary"
- title: numbered step title ("Step 1: Understanding the Basics")
- content: clear explanation that builds on previous steps (2-4 sentences)
- emoji: simple, professional emoji
- bulletPoints: 3-5 checklist items for concept/keypoint types
- highlightedTerm: optional key term being introduced

JSON format:
{
  "title": "Step-by-Step Guide: [Topic]",
  "slides": [
    {"id": 1, "type": "intro", "title": "Step 1: Getting Started", "content": "Before we dive in, let's establish...", "emoji": "🎯"},
    {"id": 2, "type": "concept", "title": "Step 2: The Foundation", "content": "Building on step 1...", "emoji": "🔧", "bulletPoints": ["First, understand...", "Then, notice...", "Finally, connect..."], "highlightedTerm": "Foundation term"}
  ],
  "estimatedReadTime": ${Math.ceil(slideCount * 1.5)}
}

Rules:
- Each step MUST reference or build on previous steps
- Use "Now that you understand X..." transitions
- Include checkpoint questions to verify understanding
- Keep language simple and instructional
- Never use em dashes (—). Use commas, periods, or colons instead.
- Return ONLY valid JSON`,

      story: `You are a clear, engaging writer who teaches through narrative and analogies. Create a STORY MODE lesson that explains concepts by connecting them to real-world examples and relatable scenarios.

Your style:
- Use analogies and metaphors to explain abstract ideas (e.g., "Think of it like...")
- Connect concepts to everyday situations and examples
- Write in a flowing, readable way that builds understanding
- Use "you" to address the reader directly
- Avoid theatrical or fairy-tale language. No "Once upon a time", "The plot thickens", "Our hero discovers", or similar phrases.
- Keep tone grounded and informative, not dramatic or cheesy

Create ${slideCount} chapters. Each chapter needs:
- type: one of "intro", "concept", "example", "keypoint", "aside", "summary"
- title: clear chapter title ("Understanding X" or "How Y Works in Practice")
- content: narrative explanation with analogies (3-5 sentences, clear and engaging)
- emoji: subtle, thematic emoji
- bulletPoints: 3-5 key takeaways for concept/keypoint types
- highlightedTerm: optional concept being introduced

JSON format:
{
  "title": "[Topic]: Explained Through Examples",
  "slides": [
    {"id": 1, "type": "intro", "title": "Setting the Stage", "content": "To understand this topic, we need to look at...", "emoji": "📖"},
    {"id": 2, "type": "concept", "title": "The Core Idea", "content": "At its heart, this works like...", "emoji": "💡", "bulletPoints": ["Key point one", "Key point two", "Key point three"], "highlightedTerm": "Term"}
  ],
  "estimatedReadTime": ${Math.ceil(slideCount * 2)}
}

Rules:
- Explain through analogies and real-world connections, not drama
- Use "you" naturally. Avoid clichéd story phrases.
- Create vivid analogies (e.g., "Think of DNA like a recipe book")
- Never use em dashes (—). Use commas, periods, or colons instead.
- Return ONLY valid JSON`
    };

    const userMessages = {
      visual: `Transform this study material into a FUN, emoji-rich visual cards lesson. Make it feel like scrolling through engaging social media content. Material:\n\n${first10kWords}`,
      stepByStep: `Transform this study material into a clear, numbered step-by-step guide. Each step should build on the previous one. Material:\n\n${first10kWords}`,
      story: `Transform this study material into an engaging story. Use analogies, narrative, and make the reader the protagonist. Material:\n\n${first10kWords}`
    };

    try {
      // Generate all 3 lessons in parallel
      console.log('Generating 3 lesson styles in parallel...');
      const [visualResult, stepByStepResult, storyResult] = await Promise.all([
        this.generateSingleLesson(prompts.visual, userMessages.visual, selectedModel, 'visual'),
        this.generateSingleLesson(prompts.stepByStep, userMessages.stepByStep, selectedModel, 'stepByStep'),
        this.generateSingleLesson(prompts.story, userMessages.story, selectedModel, 'story')
      ]);

      // Generate quiz bank once (shared across all styles)
      const quizBank = await this.generateLessonQuizBank(first10kWords, visualResult.title, selectedModel, wordCount);

      // Attach quiz bank to all lessons
      visualResult.quizBank = quizBank.questions || [];
      visualResult.quizDisplayCount = quizBank.displayCount || 6;
      stepByStepResult.quizBank = quizBank.questions || [];
      stepByStepResult.quizDisplayCount = quizBank.displayCount || 6;
      storyResult.quizBank = quizBank.questions || [];
      storyResult.quizDisplayCount = quizBank.displayCount || 6;

      return {
        visual: visualResult,
        stepByStep: stepByStepResult,
        story: storyResult
      };
    } catch (error) {
      console.error('OpenAI lesson generation error:', error);
      throw new Error('Failed to generate lessons: ' + error.message);
    }
  }

  // Helper: generate a single lesson with specific style prompt
  async generateSingleLesson(systemPrompt, userMessage, model, style) {
    try {
      const completion = await this.openai.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        max_tokens: 8000,
        temperature: 0.8, // Slightly higher for more variety
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) throw new Error(`No response for ${style} lesson`);

      let parsed;
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(responseText);
      } catch (parseError) {
        console.error(`Failed to parse ${style} lesson JSON:`, parseError);
        throw new Error(`Failed to parse ${style} lesson response`);
      }

      if (!parsed.slides || !Array.isArray(parsed.slides) || parsed.slides.length === 0) {
        throw new Error(`No slides generated for ${style}`);
      }

      // Strip em dashes from all text content
      const stripEmDashes = (s) => (typeof s === 'string' ? s.replace(/—/g, ', ') : s);
      parsed.title = stripEmDashes(parsed.title);
      parsed.slides = parsed.slides.map(s => ({
        ...s,
        title: stripEmDashes(s.title),
        content: stripEmDashes(s.content),
        bulletPoints: Array.isArray(s.bulletPoints) ? s.bulletPoints.map(stripEmDashes) : s.bulletPoints,
        highlightedTerm: stripEmDashes(s.highlightedTerm)
      }));

      return {
        title: parsed.title || `Your ${style} Lesson`,
        slides: parsed.slides,
        totalSlides: parsed.slides.length,
        estimatedReadTime: parsed.estimatedReadTime || Math.ceil(parsed.slides.length * 1.5),
        style: style
      };
    } catch (error) {
      console.error(`Error generating ${style} lesson:`, error);
      throw error;
    }
  }

  // Legacy single-style generation (kept for backwards compatibility)
  async generateLesson(text, style = 'visual', userPlan = 'free') {
    // Redirect to new multi-style generation and return requested style
    const allStyles = await this.generateAllLessonStyles(text, userPlan);
    return allStyles[style] || allStyles.visual;
  }

  async generateLessonQuizBank(text, lessonTitle, model, wordCount = 3000) {
    // Scale quiz bank by word count: ~1 question per 350 words, min 12, max 30
    const bankCount = Math.min(30, Math.max(12, Math.ceil(wordCount / 350)));
    // Show ~40% of bank per attempt, min 6, max 12
    const displayCount = Math.min(12, Math.max(6, Math.ceil(bankCount * 0.4)));

    const systemPrompt = `You are an expert quiz creator. Create a question bank to test understanding of a lesson.

Generate exactly ${bankCount} multiple choice questions that:
- Test comprehension of the key concepts
- Range from easy recall to moderate application
- Have clear, unambiguous correct answers
- Include plausible wrong options

IMPORTANT: Return ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "id": 1,
      "type": "multiple_choice",
      "question": "What is the main concept discussed?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Brief explanation of why this is correct"
    }
  ]
}

Rules:
- Generate exactly ${bankCount} questions
- Each question must have exactly 4 options
- correctAnswer must exactly match one of the options
- Keep questions focused on the material
- Never use em dashes (—). Use commas, periods, or colons instead.
- Return ONLY valid JSON`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Create ${bankCount} quiz questions to test understanding of this lesson titled "${lessonTitle}". Use only the content below:\n\n${text}` }
        ],
        max_tokens: bankCount > 20 ? 8000 : 4000,
        temperature: 0.7,
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) {
        console.error('No quiz response from AI');
        return { questions: [], displayCount };
      }

      let parsed;
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse quiz bank JSON:', parseError);
        return { questions: [], displayCount };
      }

      if (!parsed.questions || !Array.isArray(parsed.questions)) {
        return { questions: [], displayCount };
      }

      // Validate and clean questions
      const validQuestions = parsed.questions
        .filter(q => q.question && q.options && Array.isArray(q.options) && q.options.length === 4 && q.correctAnswer)
        .map((q, idx) => ({
          id: idx + 1,
          type: 'multiple_choice',
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || ''
        }));

      return { questions: validQuestions, displayCount };
    } catch (error) {
      console.error('Failed to generate quiz bank:', error);
      return { questions: [], displayCount };
    }
  }

  async generateVisualLesson(text, userPlan = 'free') {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
      throw new Error('OpenAI API key not configured');
    }

    const selectedModel = 'gpt-4.1-nano';
    const words = text.trim().split(/\s+/);
    const first10kWords = words.slice(0, 10000).join(' ');
    const wordCount = Math.min(words.length, 10000);
    const slideCount = this.getSlideCountForWordCount(wordCount);

    const systemPrompt = `You are a FUN, energetic educational content creator who makes learning feel like scrolling through social media. Create a VISUAL CARDS lesson that's colorful, emoji-heavy, and super engaging.

Your style:
- Use LOTS of emojis (2-3 per slide title)
- Write like you're excited to share cool facts
- Use phrases like "Did you know?", "Fun fact!", "Mind-blown moment:", "Pro tip:"
- Make each card feel like a quick, satisfying social media post
- Include "clickable" bullet points that reveal surprising details
- Highlight vocabulary with Key Term callouts

Create ${slideCount} slides. Each slide needs:
- type: one of "intro", "concept", "example", "keypoint", "funfact", "summary"
- title: emoji-rich, catchy title (like a TikTok caption)
- content: 2-3 punchy sentences with personality
- emoji: the MAIN emoji for this card
- bulletPoints: 3-5 reveal items for concept/keypoint types (make them interesting facts!)
- highlightedTerm: optional vocabulary word

JSON format:
{
  "title": "Catchy Lesson Title Here!",
  "slides": [
    {"id": 1, "type": "intro", "title": "Welcome! Let's Learn Something Cool", "content": "Get ready...", "emoji": "🎉"},
    {"id": 2, "type": "concept", "title": "Mind = Blown", "content": "Here's the thing...", "emoji": "💡", "bulletPoints": ["Fact 1", "Fact 2", "Fact 3"], "highlightedTerm": "Key word"}
  ],
  "estimatedReadTime": ${Math.ceil(slideCount * 1.2)}
}

Rules:
- Be enthusiastic and fun, not boring or academic
- Each card should feel complete on its own
- Use emojis strategically to highlight key points
- Never use em dashes. Use commas, periods, or colons instead.
- Return ONLY valid JSON`;

    const userMessage = `Transform this study material into a FUN, emoji-rich visual cards lesson. Make it feel like scrolling through engaging social media content. Material:\n\n${first10kWords}`;

    return this.generateSingleLesson(systemPrompt, userMessage, selectedModel, 'visual');
  }

  /**
   * Run an async tool generator with retries. Each of the 6 study-pack tools
   * is one independent OpenAI call; the model occasionally returns malformed
   * JSON or trips a validator (e.g. Word Tower's "≥4 items" rule), which
   * historically left users with 5/6 tools and no recourse. Retrying with a
   * tiny backoff on each failure recovers most transient cases — model
   * variance between attempts is usually enough to produce valid output.
   *
   * Logs every retry with the tool label so failures are traceable in
   * production logs (was: a single line on final rejection).
   */
  async withRetries(label, fn, attempts = 3) {
    let lastErr;
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastErr = err;
        const msg = err && err.message ? err.message : String(err);
        if (attempt < attempts) {
          // Linear backoff (400ms, 800ms): keeps total worst-case latency
          // bounded while giving rate-limited / overloaded calls time to
          // recover. Two retries is the sweet spot — the marginal recovery
          // from a 4th attempt is small and packs already feel slow.
          const delayMs = 400 * attempt;
          console.warn(`[AI] ${label} attempt ${attempt}/${attempts} failed: ${msg} — retrying in ${delayMs}ms`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        } else {
          console.error(`[AI] ${label} failed after ${attempts} attempts: ${msg}`);
        }
      }
    }
    throw lastErr;
  }

  async generateStudyPack(text, userPlan = 'free') {
    const words = text.trim().split(/\s+/);
    const wordCount = words.length;
    const quizCount = Math.min(25, Math.max(10, Math.ceil(wordCount / 200)));
    const flashcardCount = userPlan === 'free' ? 15 : 20;
    const crosswordWordCount = userPlan === 'free' ? Math.min(10, Math.max(6, Math.ceil(wordCount / 500))) : Math.min(15, Math.max(8, Math.ceil(wordCount / 400)));

    // Each tool is wrapped in withRetries so a single transient
    // failure (network blip, rate limit, malformed JSON, validator throw)
    // doesn't permanently strip a tool from the pack. With 3 attempts per
    // tool, the per-tool failure rate drops from ~5% to <0.02%.
    const results = await Promise.allSettled([
      this.withRetries('quiz', () => this.generateQuiz(text, 'mixed', 'medium', quizCount, quizCount, userPlan)),
      this.withRetries('flashcards', () => this.generateFlashcards(text, flashcardCount, userPlan)),
      this.withRetries('crossword', () => this.generateCrossword(text, crosswordWordCount, userPlan)),
      this.withRetries('lesson', () => this.generateVisualLesson(text, userPlan)),
      this.withRetries('craterBlast', () => this.generateReflexQuestions('notes', text, userPlan)),
      this.withRetries('wordTower', () => this.generateWordTowerQuestions('notes', text, userPlan)),
      this.withRetries('wordBlitz', () => this.generateWordBlitzQuestions('notes', text, userPlan)),
    ]);

    const [quizR, flashR, crossR, lessonR, craterR, towerR, blitzR] = results;
    const labels = ['quiz', 'flashcards', 'crossword', 'lesson', 'craterBlast', 'wordTower', 'wordBlitz'];
    const missing = [];
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        missing.push(labels[i]);
      }
    });
    if (missing.length > 0) {
      console.error(`[AI] Pack returned with ${missing.length}/7 tools missing after retries: ${missing.join(', ')}`);
    } else {
      console.log('[AI] All 7 tools generated successfully');
    }

    if (quizR.status === 'rejected' && flashR.status === 'rejected' && lessonR.status === 'rejected') {
      throw new Error('Study pack generation failed: core components could not be generated');
    }

    return {
      quiz: quizR.status === 'fulfilled' ? quizR.value : null,
      flashcards: flashR.status === 'fulfilled' ? flashR.value : null,
      crossword: crossR.status === 'fulfilled' ? crossR.value : null,
      lesson: lessonR.status === 'fulfilled' ? lessonR.value : null,
      craterBlast: craterR.status === 'fulfilled' ? craterR.value : null,
      wordTower: towerR.status === 'fulfilled' ? towerR.value : null,
      wordBlitz: blitzR.status === 'fulfilled' ? blitzR.value : null,
    };
  }

  /**
   * Generate concrete replacement prose for a highlighted span (not advisory "suggestion" text).
   * @param {object} params
   * @param {string} params.fullDocument - full essay text
   * @param {string} params.highlightedText - exact span to replace
   * @param {number} params.startIndex
   * @param {number} params.endIndex
   * @param {'improve'|'concern'} params.annotationType
   * @param {string} [params.comment] - professor-style feedback
   * @param {string} [params.suggestion] - prior advisory note (model may ignore meta-instructions)
   * @returns {Promise<{ replacement: string }>}
   */
  async generateInlineRevision({
    fullDocument,
    highlightedText,
    startIndex,
    endIndex,
    annotationType,
    comment = '',
    suggestion = '',
  }) {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
      throw new Error('OpenAI API key not configured');
    }
    if (!fullDocument || typeof fullDocument !== 'string') {
      throw new Error('Document content is required');
    }
    if (!highlightedText || typeof highlightedText !== 'string') {
      throw new Error('Highlighted text is required');
    }

    const model = process.env.OPENAI_STANDARD_MODEL || 'gpt-4.1-mini';
    const ctxChars = 1400;
    const start = Math.max(0, Number(startIndex) || 0);
    const end = Math.min(fullDocument.length, Number(endIndex) || 0);
    const before = fullDocument.slice(Math.max(0, start - ctxChars), start);
    const after = fullDocument.slice(end, Math.min(fullDocument.length, end + ctxChars));
    const issue = annotationType === 'concern' ? 'serious_concern' : 'needs_improvement';

    const systemPrompt = `You are an expert academic writing editor. You must output only valid JSON.

The app will replace ONE contiguous highlighted span in a student essay with your output.

Rules for the replacement text:
- It must be the actual prose that belongs in the essay at that position — not instructions, not meta-commentary ("you should add...", "consider...", "try using...").
- It must address the problems described in the feedback by rewriting the passage correctly.
- Match the tone and register of the surrounding context (usually formal academic English).
- Preserve meaning where the feedback is stylistic; fix errors, weak analysis, or unclear claims as the feedback implies.
- Do not wrap the result in quotation marks unless the original was a quotation.
- The JSON value must contain only the replacement string, ready to splice into the document.

Return exactly: {"replacement":"..."} with no other keys. Escape internal double quotes in the string properly for JSON.`;

    const userPrompt = `ISSUE_CLASS: ${issue}

FEEDBACK (what was wrong with the highlighted passage — use to guide the rewrite):
${String(comment || '').trim() || '(none)'}

PRIOR_MODEL_NOTE (often advisory; do NOT paste this — write real sentences that fix the issue):
${String(suggestion || '').trim() || '(none)'}

CONTEXT_BEFORE (read for flow; do not repeat verbatim):
${before}

HIGHLIGHTED_TEXT_TO_REPLACE (your "replacement" substitutes this exact span):
${highlightedText}

CONTEXT_AFTER:
${after}

Output JSON only: {"replacement":"..."}`;

    const completion = await this.openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 2500,
      temperature: 0.35,
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0]?.message?.content?.trim() || '{}';
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.error('[generateInlineRevision] JSON parse error:', raw?.slice(0, 500));
      throw new Error('Could not parse revision from model');
    }
    const replacement = typeof parsed.replacement === 'string' ? parsed.replacement.trim() : '';
    if (!replacement) {
      throw new Error('Model returned an empty replacement');
    }
    return { replacement };
  }

  /**
   * Persist revised essay + annotation positions to the library: updates documents.content_text
   * and the latest comprehensive/general document_analyses row (so reopening from Library shows last edits).
   * @param {Record<string, { sourceSpan: string; replacement: string }>|null|undefined} wsRevisionCache
   *        Per-annotation WriteScholar cache so reopening the doc avoids repeat OpenAI calls and restores purple highlights.
   */
  async saveRevisedDraftToLibrary(documentId, userId, content, annotations, wsRevisionCache) {
    const documentService = require('./documentService');
    const words = (content || '').trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const fileSize = Buffer.byteLength(content || '', 'utf8');
    await documentService.updateDocument(documentId, userId, {
      content_text: content,
      word_count: wordCount,
      page_count: Math.max(1, Math.ceil(wordCount / 250)),
      file_size: fileSize,
    });

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    );

    const { data: rows, error: fetchErr } = await supabase
      .from('document_analyses')
      .select('id, analysis_results')
      .eq('document_id', documentId)
      .eq('user_id', userId)
      .in('analysis_type', ['comprehensive', 'general'])
      .order('created_at', { ascending: false })
      .limit(1);

    if (fetchErr) throw fetchErr;
    if (!rows?.length) {
      return { ok: true, analysisUpdated: false };
    }

    const row = rows[0];
    const ar = row.analysis_results || {};
    const list = annotations || [];
    const strongPoints = list.filter((a) => a.type === 'strong').map((a) => ({
      text: a.text,
      explanation: a.comment,
    }));
    const areasToImprove = list.filter((a) => a.type === 'improve').map((a) => ({
      text: a.text,
      explanation: a.comment,
    }));
    const seriousConcerns = list.filter((a) => a.type === 'concern').map((a) => ({
      text: a.text,
      explanation: a.comment,
    }));

    const updatedResults = {
      ...ar,
      // Never overwrite original_content — it is the essay text at analysis time (compare-with-first-draft baseline).
      // `content` is the current revised draft; spreading `ar` already keeps the saved snapshot.
      annotations: list,
      strong_points: strongPoints,
      areas_to_improve: areasToImprove,
      serious_concerns: seriousConcerns,
      ...(wsRevisionCache !== undefined && wsRevisionCache !== null
        ? { ws_revision_cache: typeof wsRevisionCache === 'object' ? wsRevisionCache : {} }
        : {}),
    };

    const { error: upErr } = await supabase
      .from('document_analyses')
      .update({
        analysis_results: updatedResults,
        completed_at: new Date().toISOString(),
      })
      .eq('id', row.id)
      .eq('user_id', userId);

    if (upErr) throw upErr;
    return { ok: true, analysisUpdated: true };
  }
}

module.exports = new AIAnalysisService();
