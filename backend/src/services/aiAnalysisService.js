const OpenAI = require('openai');
const subscriptionService = require('./subscriptionService');

class AIAnalysisService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
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

  async analyzeDocument(documentId, content, analysisType, userId, citationStyle = 'None') {
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

      // Get user's subscription plan for model and token selection
      let userPlan = 'free';
      let selectedModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';
      let maxTokens = 4000; // Default for free/starter
      
      try {
        const { plan } = await subscriptionService.getUserSubscriptionDetails(userId);
        userPlan = plan;
        
        if (plan === 'premium') {
          // Premium users get better model and more tokens
          selectedModel = process.env.OPENAI_PREMIUM_MODEL || 'gpt-5-mini';
          maxTokens = 8000; // Double tokens for premium
        } else if (plan === 'starter') {
          selectedModel = process.env.OPENAI_STANDARD_MODEL || 'gpt-4o-mini';
          maxTokens = 6000; // 50% more tokens for starter
        } else {
          selectedModel = process.env.OPENAI_STANDARD_MODEL || 'gpt-4o-mini';
          maxTokens = 4000; // Standard for free
        }
      } catch (planErr) {
        // If plan lookup fails, keep defaults
        console.log('Could not fetch plan, using defaults');
      }

      const analysisPrompt = this.getAnalysisPrompt(analysisType, content, citationStyle, userPlan);

      let completion;
      try {
        completion = await this.openai.chat.completions.create({
          model: selectedModel,
        messages: [
          {
              role: 'system',
              content: this.getSystemPrompt(analysisType)
          },
          {
              role: 'user',
            content: analysisPrompt
          }
        ],
        max_tokens: maxTokens,
          temperature: 0.3,
        });
      } catch (modelErr) {
        // If premium/unknown model fails, retry with reliable default
        if (selectedModel !== 'gpt-4o-mini') {
          console.log(`Model ${selectedModel} failed, falling back to gpt-4o-mini`);
          selectedModel = 'gpt-4o-mini';
          completion = await this.openai.chat.completions.create({
            model: selectedModel,
            messages: [
              {
                role: 'system',
                content: this.getSystemPrompt(analysisType)
              },
              {
                role: 'user',
                content: analysisPrompt
              }
            ],
            max_tokens: maxTokens,
            temperature: 0.3,
          });
        } else {
          throw modelErr;
        }
      }

      const analysisResult = completion.choices[0].message.content;
      
      // Parse structured analysis and extract annotations, passing user plan for scaling
      const structuredAnalysis = this.parseStructuredAnalysis(analysisResult, content, userPlan);
      
      // Save analysis to database (temporarily disabled for demo)
      // await this.saveAnalysis(documentId, userId, analysisType, analysisResult, content);
      
      return {
        success: true,
        analysisType,
        result: structuredAnalysis.formattedResult,
        annotations: structuredAnalysis.annotations,
        documentId,
        timestamp: new Date().toISOString(),
        model: selectedModel
      };
    } catch (error) {
      console.error('AI Analysis Error:', error);
      throw new Error(`Analysis failed: ${error.message}`);
    }
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

      Provide actionable, constructive feedback in a professional tone.`,
      
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

      Give detailed feedback across all aspects of academic writing.`,
      
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

    return prompts[analysisType] || prompts.general;
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
  getAnalysisPrompt(analysisType, content, citationStyle = 'None', userPlan = 'free') {
    const citationInstruction = citationStyle === 'None' 
      ? 'This document does not require citations, so focus on content quality, structure, and clarity.'
      : `using ${citationStyle} citation style standards.`;
    
    // Calculate expected annotations based on document length and user plan
    const wordCount = content.split(/\s+/).length;
    let targetAnnotations = 12; // Default for free/short documents
    
    if (userPlan === 'premium') {
      // Premium: Scale more aggressively
      if (wordCount > 5000) targetAnnotations = 30;
      else if (wordCount > 3000) targetAnnotations = 25;
      else if (wordCount > 1500) targetAnnotations = 20;
      else targetAnnotations = 15;
    } else if (userPlan === 'starter') {
      // Starter: Moderate scaling
      if (wordCount > 5000) targetAnnotations = 25;
      else if (wordCount > 3000) targetAnnotations = 20;
      else if (wordCount > 1500) targetAnnotations = 15;
      else targetAnnotations = 12;
    } else {
      // Free: Limited scaling
      if (wordCount > 3000) targetAnnotations = 15;
      else if (wordCount > 1500) targetAnnotations = 12;
      else targetAnnotations = 10;
    }
    
    return `Please perform a comprehensive academic analysis of the following document ${citationInstruction}

IMPORTANT: For each feedback point, you must include the EXACT text from the document that you're referring to, enclosed in double quotes.

ADAPTIVE ANNOTATION GUIDELINES:
- Aim for approximately ${targetAnnotations} total feedback annotations
- **ADAPT YOUR FEEDBACK TO THE ACTUAL QUALITY OF THE WRITING:**
  
  **For EXCELLENT papers (well-written, clear, strong arguments):**
  - Focus primarily on STRENGTHS (60-80% of annotations)
  - Minor improvements only (20-30% of annotations)  
  - Few or NO serious concerns (0-10% of annotations)
  
  **For GOOD papers (solid writing with room for improvement):**
  - Balanced mix of strengths (40-50% of annotations)
  - Areas for improvement (40-50% of annotations)
  - Some concerns (10-20% of annotations)
  
  **For POOR papers (significant issues, unclear writing):**
  - Some strengths where found (20-30% of annotations)
  - Many areas for improvement (40-50% of annotations)
  - Serious concerns for major issues (30-40% of annotations)

- **BE HONEST:** If a paper is genuinely well-written, don't force serious concerns
- **BE HELPFUL:** Focus on the most important feedback for the paper's actual quality level
- For longer documents, provide proportionally more feedback to cover all sections thoroughly

Document Content (${wordCount} words):
${content}

Please provide a detailed analysis in the following JSON format:

{
  "overall_assessment": "Brief overall assessment of the document",
  "detailed_analysis": {
    "academic_writing_quality": {
      "assessment": "Analysis of clarity, coherence, and academic tone",
      "strengths": [
        {
          "text": "EXACT quoted text from document",
          "comment": "Why this is a strength",
          "suggestion": "How to maintain this quality"
        }
      ],
      "improvements": [
        {
          "text": "EXACT quoted text from document",
          "comment": "What needs improvement",
          "suggestion": "Specific recommendation for improvement"
        }
      ],
      "concerns": [
        {
          "text": "EXACT quoted text from document",
          "comment": "What is problematic",
          "suggestion": "How to fix this issue"
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
      "assessment": "Analysis of logical flow and evidence",
      "strengths": [],
      "improvements": [],
      "concerns": []
    },
    "grammar_style": {
      "assessment": "Analysis of technical writing quality",
      "strengths": [],
      "improvements": [],
      "concerns": []
    },
    "content_depth": {
      "assessment": "Analysis of thoroughness and rigor",
      "strengths": [],
      "improvements": [],
      "concerns": []
    }
  },
  "recommendations": [
    "Priority recommendation 1",
    "Priority recommendation 2",
    "Priority recommendation 3"
  ]
}

CRITICAL REQUIREMENTS:
1. Every feedback item MUST include the exact quoted text from the document
2. Categorize feedback as: strengths (green), improvements (amber), concerns (red)
3. Provide specific, actionable suggestions for each point
4. Focus on the most important issues first
5. Ensure all quoted text is exactly as it appears in the document`;
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
  parseStructuredAnalysis(analysisResult, content, userPlan = 'free') {
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
                  comment: item.comment,
                  suggestion: item.suggestion || 'This demonstrates strong academic writing. Continue using this approach.'
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
                  suggestion: item.suggestion || 'Consider enhancing this section with more specific details and supporting evidence.'
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
                  suggestion: item.suggestion || 'This area needs immediate attention and revision to strengthen your argument.'
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
      const finalAnnotations = this.ensureMinimumAnnotations(annotations, content, annotationId, usedTexts, userPlan);

      // Create formatted result for display
      const formattedResult = this.formatAnalysisForDisplay(structuredData);

      console.log('=== BACKEND: ANNOTATION GENERATION COMPLETE ===');
      console.log(`Final annotations: ${finalAnnotations.length}`);
      console.log(`Final strong points: ${finalAnnotations.filter(a => a.type === 'strong').length}`);

      return {
        formattedResult,
        annotations: finalAnnotations.sort((a, b) => a.startIndex - b.startIndex)
      };

    } catch (error) {
      console.error('Error parsing structured analysis:', error);
      // Fallback to bulletproof annotation generation
      console.log('Falling back to bulletproof annotation generation...');
      const fallbackAnnotations = this.generateFallbackAnnotations(content);
      return {
        formattedResult: analysisResult,
        annotations: fallbackAnnotations
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
    let minTotal = 12;
    
    if (userPlan === 'premium') {
      if (wordCount > 5000) minTotal = 30;
      else if (wordCount > 3000) minTotal = 25;
      else if (wordCount > 1500) minTotal = 20;
      else minTotal = 15;
    } else if (userPlan === 'starter') {
      if (wordCount > 5000) minTotal = 25;
      else if (wordCount > 3000) minTotal = 20;
      else if (wordCount > 1500) minTotal = 15;
      else minTotal = 12;
    } else {
      // Free plan: limited scaling
      if (wordCount > 3000) minTotal = 15;
      else if (wordCount > 1500) minTotal = 12;
      else minTotal = 10;
    }
    
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
    const currentTotal = finalAnnotations.length;
      
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
      
      for (let i = 0; i < Math.min(minTotal - currentTotal, remainingSentences.length); i++) {
        const sentence = remainingSentences[i].trim();
        const startIndex = content.indexOf(sentence);
        if (startIndex !== -1) {
          const type = types[i % types.length];
          usedTexts.add(sentence.toLowerCase());
          
          let comment, suggestion;
          if (type === 'strong') {
            // Generate contextual comments for strong points based on paper quality
            if (/\b(research|study|analysis|findings|results|evidence|data)\b/i.test(sentence)) {
              comment = paperQuality === 'excellent' 
                ? 'Excellent use of research terminology that demonstrates sophisticated academic discourse.'
                : 'This sentence effectively incorporates research terminology and demonstrates strong academic writing.';
              suggestion = 'Continue using precise academic language and research-based terminology throughout your work.';
            } else if (/\b(however|furthermore|moreover|therefore|consequently|nevertheless)\b/i.test(sentence)) {
              comment = paperQuality === 'excellent'
                ? 'Outstanding transitional language that creates seamless logical flow between complex ideas.'
                : 'Excellent use of transitional language that creates logical flow between ideas.';
              suggestion = 'This type of clear logical connection strengthens your argument structure.';
            } else if (/\b(demonstrates|indicates|suggests|reveals|shows|establishes)\b/i.test(sentence)) {
              comment = paperQuality === 'excellent'
                ? 'Sophisticated analytical language that presents clear, nuanced interpretation of evidence.'
                : 'Strong analytical language that clearly presents your interpretation of the evidence.';
              suggestion = 'This analytical approach effectively connects evidence to conclusions.';
            } else if (sentence.includes(',') && (sentence.includes('that') || sentence.includes('which'))) {
              comment = paperQuality === 'excellent'
                ? 'Expertly crafted complex sentence that demonstrates mastery of academic writing conventions.'
                : 'Well-structured complex sentence that demonstrates sophisticated academic writing.';
              suggestion = 'This sentence complexity and structure are excellent for academic discourse.';
            } else {
              comment = paperQuality === 'excellent'
                ? 'This sentence exemplifies clear, professional academic writing with excellent structure and vocabulary.'
                : 'This sentence demonstrates clear academic writing with appropriate vocabulary and structure.';
              suggestion = 'The writing style and complexity level are well-suited for academic work.';
            }
          } else if (type === 'improve') {
            // Generate contextual improvement suggestions based on paper quality
            if (paperQuality === 'excellent') {
              // For excellent papers, suggestions should be minor refinements
              if (/\b(however|but|although|while)\b/i.test(sentence)) {
                comment = 'This effective transition could be enhanced with slightly more explicit connection.';
                suggestion = 'Consider adding more specific linking language to make the relationship even clearer.';
              } else if (sentence.length < 30) {
                comment = 'This concise sentence could be expanded for even greater impact.';
                suggestion = 'Consider adding a brief example or elaboration to strengthen this point further.';
              } else {
                comment = 'This well-written section could be enhanced with additional supporting detail.';
                suggestion = 'Consider adding more specific examples or evidence to make this point even stronger.';
              }
            } else {
              // For average/poor papers, more substantial improvements needed
              if (/\b(however|but|although|while)\b/i.test(sentence)) {
                comment = 'This transition could be strengthened with more explicit connection to the previous argument.';
                suggestion = 'Consider adding more specific linking language to clarify the relationship between ideas.';
              } else if (sentence.length < 30) {
                comment = 'This sentence could benefit from more detailed explanation and supporting evidence.';
                suggestion = 'Consider expanding this point with specific examples, data, or citations.';
              } else if (!/\b(research|study|evidence|data|analysis)\b/i.test(sentence)) {
                comment = 'This section could be strengthened with more academic evidence or research support.';
                suggestion = 'Consider adding citations or research evidence to support this claim.';
              } else {
            comment = 'This section could be enhanced with more specific details and supporting evidence.';
            suggestion = 'Consider adding more specific examples, data, or citations to support your point.';
              }
            }
          } else { // concern
            if (sentence.includes('?')) {
              comment = 'Questions in academic writing should typically be rhetorical or immediately answered.';
              suggestion = 'Consider rephrasing as a statement or providing an immediate answer to strengthen your argument.';
            } else if (!/[.!?]$/.test(sentence.trim())) {
              comment = 'This sentence appears incomplete or improperly punctuated.';
              suggestion = 'Ensure proper sentence structure and punctuation for clarity.';
            } else if (/\b(I think|I believe|I feel)\b/i.test(sentence)) {
              comment = 'Avoid first-person language in academic writing for more objective tone.';
              suggestion = 'Rephrase using more objective language such as "The evidence suggests" or "Research indicates".';
          } else {
            comment = 'This section may need attention to strengthen the argument and provide clearer explanations.';
            suggestion = 'Consider providing more specific evidence or clarifying your point to strengthen this section.';
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
        const sentence = availableSentences[0].trim();
        const startIndex = content.indexOf(sentence);
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
            comment = 'This section could benefit from more detailed explanation or supporting evidence.';
            suggestion = 'Consider expanding this point with specific examples, data, or citations.';
          } else {
            comment = 'This section may need attention to strengthen clarity and argument structure.';
            suggestion = 'Consider revising for clearer expression and stronger supporting evidence.';
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
    
    const finalStrongCount = finalAnnotations.filter(a => a.type === 'strong').length;
    const finalImproveCount = finalAnnotations.filter(a => a.type === 'improve').length;
    const finalConcernCount = finalAnnotations.filter(a => a.type === 'concern').length;
    console.log(`🎯 FINAL BACKEND RESULTS:`);
    console.log(`   Total annotations: ${finalAnnotations.length} (target ${minTotal})`);
    console.log(`   Distribution: ${finalStrongCount} strong, ${finalImproveCount} improve, ${finalConcernCount} concern`);
    console.log(`   Quality-adaptive: Strong ratio ${(finalStrongCount / finalAnnotations.length * 100).toFixed(1)}%`);
    
    return finalAnnotations;
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
          suggestion = 'Consider adding more specific examples, data, or citations to support your point.';
        } else {
          comment = 'This section may need attention to strengthen the argument and provide clearer explanations.';
          suggestion = 'Consider providing more specific evidence or clarifying your point to strengthen this section.';
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
    
    return annotations;
  }

  /**
   * Find exact text match in content
   */
  findTextInContent(content, quotedText) {
    // Remove quotes and clean the text
    const cleanText = quotedText.replace(/^["']|["']$/g, '').trim();
    
    // Skip if text is too short or too long
    if (cleanText.length < 5 || cleanText.length > 500) {
      return null;
    }
    
    // Try exact match first (most reliable)
    const exactIndex = content.indexOf(cleanText);
    if (exactIndex !== -1) {
      return {
        text: cleanText,
        startIndex: exactIndex,
        endIndex: exactIndex + cleanText.length
      };
    }

    // Try case-insensitive match (but preserve original case)
    const lowerContent = content.toLowerCase();
    const lowerText = cleanText.toLowerCase();
    const caseInsensitiveIndex = lowerContent.indexOf(lowerText);
    if (caseInsensitiveIndex !== -1) {
      const originalText = content.slice(caseInsensitiveIndex, caseInsensitiveIndex + cleanText.length);
      return {
        text: originalText,
        startIndex: caseInsensitiveIndex,
        endIndex: caseInsensitiveIndex + cleanText.length
      };
    }

    // Try to find the text within sentence boundaries (more conservative approach)
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    for (const sentence of sentences) {
      const sentenceTrimmed = sentence.trim();
      const sentenceLower = sentenceTrimmed.toLowerCase();
      
      // Check if the quoted text appears in this sentence
      if (sentenceLower.includes(lowerText)) {
        const startIndex = content.indexOf(sentenceTrimmed);
        if (startIndex !== -1) {
          return {
            text: sentenceTrimmed,
            startIndex: startIndex,
            endIndex: startIndex + sentenceTrimmed.length
          };
        }
      }
    }

    // Last resort: try to find key words from the quoted text
    const words = cleanText.split(' ').filter(word => word.length > 4);
    if (words.length >= 2) {
      // Look for sentences that contain at least 2 key words
      for (const sentence of sentences) {
        const sentenceLower = sentence.toLowerCase();
        const matchingWords = words.filter(word => sentenceLower.includes(word.toLowerCase()));
        
        if (matchingWords.length >= 2) {
          const sentenceTrimmed = sentence.trim();
          const startIndex = content.indexOf(sentenceTrimmed);
          if (startIndex !== -1 && sentenceTrimmed.length > 10 && sentenceTrimmed.length < 300) {
            return {
              text: sentenceTrimmed,
              startIndex: startIndex,
              endIndex: startIndex + sentenceTrimmed.length
            };
          }
        }
      }
    }

    return null;
  }

  /**
   * Format structured analysis for display
   */
  formatAnalysisForDisplay(structuredData) {
    let formatted = `# Comprehensive Academic Analysis\n\n`;
    formatted += `## Overall Assessment\n${structuredData.overall_assessment}\n\n`;

    Object.entries(structuredData.detailed_analysis).forEach(([category, data]) => {
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
   */
  async saveAnalysis(documentId, userId, analysisType, result, originalContent, annotations = null, citationStyle = null) {
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
          citation_style: citationStyle
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
}

module.exports = new AIAnalysisService();
