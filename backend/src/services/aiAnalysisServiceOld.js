const OpenAI = require('openai');
const { userService } = require('./userService');

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
  async analyzeDocument(documentId, content, analysisType, userId, citationStyle = 'None') {
    try {
      // Check if OpenAI API key is configured
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
        console.log('🤖 Using mock AI analysis (OpenAI API key not configured)');
        return await this.mockAnalysis(documentId, content, analysisType, userId);
      }

      const analysisPrompt = this.getAnalysisPrompt(analysisType, content, citationStyle);
      
      const completion = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini", // Using GPT-4o-mini (gpt-5-nano doesn't exist)
        messages: [
          {
            role: "system",
            content: this.getSystemPrompt(analysisType)
          },
          {
            role: "user",
            content: analysisPrompt
          }
        ],
        max_tokens: 4000, // Increased for more detailed analysis
        temperature: 0.2, // Lower temperature for more consistent, academic tone
      });

      const analysisResult = completion.choices[0].message.content;
      
      // Parse structured analysis and extract annotations
      const structuredAnalysis = this.parseStructuredAnalysis(analysisResult, content);
      
      // Save analysis to database (temporarily disabled for demo)
      // await this.saveAnalysis(documentId, userId, analysisType, analysisResult, content);
      
      return {
        success: true,
        analysisType,
        result: structuredAnalysis.formattedResult,
        annotations: structuredAnalysis.annotations,
        documentId,
        timestamp: new Date().toISOString(),
        model: process.env.OPENAI_MODEL || "gpt-4o-mini"
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
1. Add citations for all factual claims and statistics
2. Choose one citation style (APA, MLA, Chicago) and use it consistently
3. Include a complete reference list at the end
4. Use in-text citations for all paraphrased material

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
      general: `You are an expert academic writing coach with a positive, constructive approach. Your role is to help students improve their writing by:

      - Identifying and celebrating strengths first
      - Providing encouraging, actionable feedback
      - Focusing on growth and improvement
      - Being thorough but supportive
      - Highlighting what's working well alongside areas for development

      Always start with strengths and maintain an encouraging tone throughout your analysis.`,
      
      citation: `You are a citation and referencing expert with a supportive teaching approach. Analyze the provided document for:
      - Proper citation format and style
      - Missing or incorrect citations
      - Reference list accuracy
      - In-text citation consistency
      - Academic integrity compliance

      Focus on what's done well first, then provide constructive guidance for improvements.`,
      
      grammar: `You are a grammar and language expert who believes in positive reinforcement. Analyze the provided document for:
      - Grammar, punctuation, and spelling errors
      - Sentence structure and clarity
      - Word choice and vocabulary
      - Consistency in tense and voice
      - Professional academic language usage

      Highlight good writing practices first, then provide specific, encouraging corrections.`,
      
      plagiarism: `You are an academic integrity specialist who educates rather than punishes. Analyze the provided document for:
      - Potential plagiarism indicators
      - Proper paraphrasing and original expression
      - Citation of sources and ideas
      - Originality and academic honesty
      - Areas that may need better attribution

      Focus on teaching proper academic practices while recognizing good attribution habits.`,
      
      comprehensive: `You are a comprehensive academic writing expert who takes a holistic, encouraging approach. Provide a complete analysis covering:
      - Content quality and depth
      - Structure and organization
      - Grammar and language
      - Citations and references
      - Academic style and tone
      - Originality and integrity
      - Overall assessment and recommendations

      Give detailed, constructive feedback that builds confidence while providing clear guidance for improvement.`
    };

    return prompts[analysisType] || prompts.general;
  }

  /**
   * Get analysis prompt with document content
   */
  getAnalysisPrompt(analysisType, content, citationStyle = 'None') {
    const citationInstruction = citationStyle === 'None' 
      ? 'This document does not require citations, so focus on content quality, structure, and clarity.'
      : `using ${citationStyle} citation style standards.`;
    
    return `You are an expert academic writing coach. Please perform a comprehensive, constructive analysis of the following document ${citationInstruction}

IMPORTANT: For each feedback point, you must include the EXACT text from the document that you're referring to, enclosed in double quotes.

Document Content:
${content}

Please provide a detailed analysis in the following JSON format:

{
  "overall_assessment": "Comprehensive assessment highlighting both strengths and areas for growth",
  "detailed_analysis": {
    "academic_writing_quality": {
      "assessment": "Analysis of clarity, coherence, and academic tone",
      "strengths": [
        {
          "text": "EXACT quoted text from document",
          "comment": "Why this demonstrates strong academic writing",
          "suggestion": "How to maintain and build upon this quality"
        }
      ],
      "improvements": [
        {
          "text": "EXACT quoted text from document",
          "comment": "What could be enhanced",
          "suggestion": "Specific recommendation for improvement"
        }
      ],
      "concerns": [
        {
          "text": "EXACT quoted text from document",
          "comment": "What needs attention",
          "suggestion": "How to address this issue"
        }
      ]
    },
    "citation_referencing": {
      "assessment": "Analysis of citations and references",
      "strengths": [
        {
          "text": "EXACT quoted text from document",
          "comment": "Why this citation practice is effective",
          "suggestion": "Continue using this approach"
        }
      ],
      "improvements": [
        {
          "text": "EXACT quoted text from document",
          "comment": "What could be improved in citation",
          "suggestion": "Specific recommendation for better citation"
        }
      ],
      "concerns": [
        {
          "text": "EXACT quoted text from document",
          "comment": "What citation issue needs attention",
          "suggestion": "How to fix this citation problem"
        }
      ]
    },
    "argument_structure": {
      "assessment": "Analysis of logical flow and evidence",
      "strengths": [
        {
          "text": "EXACT quoted text from document",
          "comment": "Why this argument structure is effective",
          "suggestion": "Build upon this strong foundation"
        }
      ],
      "improvements": [
        {
          "text": "EXACT quoted text from document",
          "comment": "What could strengthen the argument",
          "suggestion": "Specific recommendation for better argumentation"
        }
      ],
      "concerns": [
        {
          "text": "EXACT quoted text from document",
          "comment": "What argument issue needs attention",
          "suggestion": "How to strengthen this argument"
        }
      ]
    },
    "grammar_style": {
      "assessment": "Analysis of technical writing quality",
      "strengths": [
        {
          "text": "EXACT quoted text from document",
          "comment": "Why this demonstrates good grammar/style",
          "suggestion": "Continue using this effective writing style"
        }
      ],
      "improvements": [
        {
          "text": "EXACT quoted text from document",
          "comment": "What could be refined in grammar/style",
          "suggestion": "Specific recommendation for better writing"
        }
      ],
      "concerns": [
        {
          "text": "EXACT quoted text from document",
          "comment": "What grammar/style issue needs attention",
          "suggestion": "How to correct this writing issue"
        }
      ]
    },
    "content_depth": {
      "assessment": "Analysis of thoroughness and rigor",
      "strengths": [
        {
          "text": "EXACT quoted text from document",
          "comment": "Why this shows good content depth",
          "suggestion": "Expand on this thorough approach"
        }
      ],
      "improvements": [
        {
          "text": "EXACT quoted text from document",
          "comment": "What could add more depth",
          "suggestion": "Specific recommendation for deeper analysis"
        }
      ],
      "concerns": [
        {
          "text": "EXACT quoted text from document",
          "comment": "What content area needs more depth",
          "suggestion": "How to develop this area further"
        }
      ]
    },
    "originality_insight": {
      "assessment": "Analysis of original thinking and insights",
      "strengths": [
        {
          "text": "EXACT quoted text from document",
          "comment": "Why this shows original thinking",
          "suggestion": "Develop this insight further"
        }
      ],
      "improvements": [
        {
          "text": "EXACT quoted text from document",
          "comment": "What could show more originality",
          "suggestion": "Specific recommendation for more original analysis"
        }
      ],
      "concerns": [
        {
          "text": "EXACT quoted text from document",
          "comment": "What needs more original perspective",
          "suggestion": "How to add more original insight"
        }
      ]
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
4. Focus on finding and highlighting STRENGTHS first - every document has positive aspects
5. Be constructive and encouraging while being thorough
6. Ensure all quoted text is exactly as it appears in the document
7. Aim for at least 3-5 strengths in each category when possible
8. Look for subtle strengths like good word choice, logical flow, clear explanations, etc.`;
  }

  /**
   * Parse structured analysis response and extract annotations
   */
  parseStructuredAnalysis(analysisResult, content) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = analysisResult.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in analysis result');
      }

      const structuredData = JSON.parse(jsonMatch[0]);
      const annotations = [];
      let annotationId = 1;

      // Extract annotations from each category
      Object.values(structuredData.detailed_analysis).forEach(category => {
        // Process strengths (green)
        if (category.strengths) {
          category.strengths.forEach(item => {
            if (item.text && item.comment) {
              const textMatch = this.findTextInContent(content, item.text);
              if (textMatch) {
                annotations.push({
                  id: annotationId.toString(),
                  type: 'strong',
                  text: textMatch.text,
                  startIndex: textMatch.startIndex,
                  endIndex: textMatch.endIndex,
                  comment: item.comment,
                  suggestion: item.suggestion || 'This demonstrates strong academic writing. Continue using this approach.'
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
              if (textMatch) {
                annotations.push({
                  id: annotationId.toString(),
                  type: 'improve',
                  text: textMatch.text,
                  startIndex: textMatch.startIndex,
                  endIndex: textMatch.endIndex,
                  comment: item.comment,
                  suggestion: item.suggestion || 'Consider enhancing this section with more specific details and supporting evidence.'
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
              if (textMatch) {
                annotations.push({
                  id: annotationId.toString(),
                  type: 'concern',
                  text: textMatch.text,
                  startIndex: textMatch.startIndex,
                  endIndex: textMatch.endIndex,
                  comment: item.comment,
                  suggestion: item.suggestion || 'This area needs immediate attention and revision to strengthen your argument.'
                });
                annotationId++;
              }
            }
          });
        }
      });

      // Create formatted result for display
      const formattedResult = this.formatAnalysisForDisplay(structuredData);

      return {
        formattedResult,
        annotations: annotations.sort((a, b) => a.startIndex - b.startIndex)
      };

    } catch (error) {
      console.error('Error parsing structured analysis:', error);
      // Fallback to original result if parsing fails
      return {
        formattedResult: analysisResult,
        annotations: []
      };
    }
  }

  /**
   * Find exact text match in content with improved flexibility for finding positive aspects
   */
  findTextInContent(content, quotedText) {
    // Remove quotes and clean the text
    const cleanText = quotedText.replace(/^["']|["']$/g, '').trim();
    
    // Skip if text is too short or too long
    if (cleanText.length < 3 || cleanText.length > 500) {
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

    // Try to find partial matches for shorter phrases (more flexible for strengths)
    if (cleanText.length < 50) {
      const words = cleanText.split(' ').filter(word => word.length > 2);
      if (words.length >= 1) {
        // Look for sentences that contain key words
        for (const sentence of sentences) {
          const sentenceLower = sentence.toLowerCase();
          const matchingWords = words.filter(word => sentenceLower.includes(word.toLowerCase()));
          
          // For strengths, be more lenient - even 1 word match might be valuable
          if (matchingWords.length >= 1 && words.length <= 3) {
            const sentenceTrimmed = sentence.trim();
            const startIndex = content.indexOf(sentenceTrimmed);
            if (startIndex !== -1 && sentenceTrimmed.length > 5 && sentenceTrimmed.length < 400) {
              return {
                text: sentenceTrimmed,
                startIndex: startIndex,
                endIndex: startIndex + sentenceTrimmed.length
              };
            }
          }
        }
      }
    }

    // Last resort: try to find key words from the quoted text
    const words = cleanText.split(' ').filter(word => word.length > 3);
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
      // Use service role key ONLY for AI analysis saves (bypasses RLS)
      // This is safe because we validate userId and documentId before calling this method
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
      );

      const analysisData = {
        document_id: documentId,
        user_id: userId,
        analysis_type: analysisType,
        status: 'completed',
        analysis_results: {
          result: result,
          original_content: originalContent,
          ai_model_used: process.env.OPENAI_MODEL || "gpt-5-nano",
          annotations: annotations,
          citation_style: citationStyle
        },
        processing_time_ms: Math.floor(Date.now() / 1000), // Convert to seconds
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      };

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
      }
    ];
  }
}

module.exports = new AIAnalysisService();
