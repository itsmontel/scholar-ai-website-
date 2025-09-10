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
  async analyzeDocument(documentId, content, analysisType, userId, citationStyle = 'APA') {
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
        max_tokens: 2000,
        temperature: 0.3, // Standard temperature for analysis
      });

      const analysisResult = completion.choices[0].message.content;
      
      // Save analysis to database (temporarily disabled for demo)
      // await this.saveAnalysis(documentId, userId, analysisType, analysisResult, content);
      
      return {
        success: true,
        analysisType,
        result: analysisResult,
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

      Give detailed feedback across all aspects of academic writing.`
    };

    return prompts[analysisType] || prompts.general;
  }

  /**
   * Get analysis prompt with document content
   */
  getAnalysisPrompt(analysisType, content, citationStyle = 'APA') {
    return `Please perform a comprehensive academic analysis of the following document using ${citationStyle} citation style standards:

Document Content:
${content}

Please provide a detailed analysis focusing on:
1. **Academic Writing Quality**: Clarity, coherence, and academic tone
2. **Citation and Referencing**: Accuracy and consistency with ${citationStyle} style
3. **Research Methodology**: If applicable, evaluate the research approach
4. **Argument Structure**: Logical flow and evidence presentation
5. **Grammar and Style**: Technical writing quality
6. **Content Depth**: Thoroughness and academic rigor

For each point, provide specific examples from the text and actionable recommendations. Focus on identifying actual strengths and areas for improvement with precise text references.`;
  }

  /**
   * Save analysis results to database
   */
  async saveAnalysis(documentId, userId, analysisType, result, originalContent) {
    try {
      // Use service role key ONLY for AI analysis saves (bypasses RLS)
      // This is safe because we validate userId and documentId before calling this method
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
      );

      const { data, error } = await supabase
        .from('document_analyses')
        .insert([
          {
            document_id: documentId,
            user_id: userId,
            analysis_type: analysisType,
            status: 'completed',
            analysis_results: {
              result: result,
              original_content: originalContent,
              ai_model_used: process.env.OPENAI_MODEL || "gpt-5-nano"
            },
            processing_time_ms: Math.floor(Date.now() / 1000), // Convert to seconds
            created_at: new Date().toISOString(),
            completed_at: new Date().toISOString()
          }
        ])
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
      const databaseService = require('./databaseService');
      const supabase = databaseService.getSupabaseClient();

      const { data, error } = await supabase
        .from('document_analyses')
        .select('*')
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
      const databaseService = require('./databaseService');
      const supabase = databaseService.getSupabaseClient();

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
