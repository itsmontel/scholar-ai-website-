const OpenAI = require('openai');
const subscriptionService = require('./subscriptionService');

class AIAnalysisService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
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
   */
  async saveCitationSearch(userId, researchTopic, citationStyle, searchResults, yearRange = 'all') {
    try {
      console.log('Saving citation search to history:', { userId, researchTopic, citationStyle, yearRange });
      
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
      );

      // Note: yearRange is already included in searchResults.yearRange
      // so we don't need a separate column - it's stored in the JSONB field
      const searchData = {
        user_id: userId,
        research_topic: researchTopic,
        citation_style: citationStyle,
        search_results: searchResults,
        created_at: new Date().toISOString()
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
   */
  async getCitationHistory(userId, limit = 20) {
    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
      );

      const { data, error } = await supabase
        .from('citation_searches')
        .select('*')
        .eq('user_id', userId)
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
   * Save quiz to history
   */
  async saveQuiz(userId, quiz, sourceText) {
    try {
      console.log('Saving quiz to history:', { userId, quizTitle: quiz.title });
      
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
      );

      const quizData = {
        user_id: userId,
        title: quiz.title,
        quiz_type: quiz.quizType,
        difficulty: quiz.difficulty,
        question_count: quiz.questions?.length || quiz.questionCount,
        questions: quiz.questions,
        source_word_count: quiz.sourceWordCount || sourceText?.trim().split(/\s+/).length || 0,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
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
   * Get quiz history for a user
   */
  async getQuizHistory(userId, limit = 20) {
    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
      );

      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('user_id', userId)
        .gt('expires_at', new Date().toISOString()) // Only get non-expired quizzes
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
        .gt('expires_at', new Date().toISOString())
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

      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quizId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting quiz:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Database error in deleteQuiz:', error);
      return false;
    }
  }

  /**
   * Clean up expired quizzes (7+ days old)
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
  async humanizeText(text, mode = 'standard', intensity = 'medium', userPlan = 'starter') {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
      console.log('OpenAI API key not configured - returning original text');
      return text;
    }

    const selectedModel = userPlan === 'premium' ? 'gpt-4.1-mini' : 'gpt-4.1-nano';
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

    const selectedModel = userPlan === 'premium' ? 'gpt-4.1-mini' : 'gpt-4.1-nano';

    const lengthInstructions = {
      short: 'Create a very concise summary (3-5 key points or 50-100 words).',
      medium: 'Create a balanced summary (5-8 key points or 150-250 words).',
      long: 'Create a comprehensive summary (8-12 key points or 300-500 words) that captures nuances and supporting details.'
    };

    const styleInstructions = {
      bullet: `Format the summary as bullet points. Each bullet should be a complete, standalone insight. Use clear, direct language. Group related points under headers if the content covers multiple topics.`,
      paragraph: `Write the summary as flowing paragraphs. Start with the main thesis/argument, then cover key supporting points. End with any conclusions or implications.`,
      tldr: `Create an ultra-concise "TL;DR" summary in 1-3 sentences that captures the absolute essence. Then provide 3-5 "Key Takeaways" as short bullet points.`,
      detailed: `Create a structured summary with:
1. **Overview** (2-3 sentences)
2. **Main Arguments/Points** (organized by theme)
3. **Key Evidence/Examples** mentioned
4. **Conclusions/Implications**
5. **Critical Notes** (any limitations, biases, or gaps)`
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
- Return ONLY the summary, no meta-commentary like "Here is the summary:"`;

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

      const summary = completion.choices[0]?.message?.content;
      if (!summary) {
        throw new Error('No response from OpenAI');
      }

      return {
        summary: summary.trim(),
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
   * @param {number} questionCount - Number of questions to generate
   * @returns {Object} Quiz with questions and answers
   */
  async generateQuiz(text, quizType = 'mixed', difficulty = 'medium', questionCount = 10, userPlan = 'starter') {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
      console.log('OpenAI API key not configured');
      throw new Error('OpenAI API key not configured');
    }

    const selectedModel = userPlan === 'premium' ? 'gpt-4.1-mini' : 'gpt-4.1-nano';

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
        max_tokens: 4000,
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
        questionCount: quiz.questions?.length || questionCount,
        sourceWordCount: text.trim().split(/\s+/).length
      };
    } catch (error) {
      console.error('OpenAI quiz generation error:', error);
      throw new Error('Failed to generate quiz: ' + error.message);
    }
  }
}

module.exports = new AIAnalysisService();
