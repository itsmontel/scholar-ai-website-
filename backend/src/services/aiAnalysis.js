const OpenAI = require('openai');

class AIAnalysisService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    // Academic standards and criteria for top-tier analysis
    this.academicStandards = {
      journals: ['Nature', 'Science', 'Cell', 'NEJM', 'Lancet', 'JAMA', 'PNAS', 'IEEE', 'ACM'],
      citationStyles: ['None', 'APA', 'MLA', 'Chicago', 'Harvard', 'Vancouver', 'IEEE', 'ACS', 'AMA'],
      researchTypes: ['empirical', 'theoretical', 'systematic_review', 'meta_analysis', 'case_study', 'experimental', 'observational'],
      qualityIndicators: ['novelty', 'rigor', 'significance', 'clarity', 'reproducibility', 'ethical_considerations']
    };
  }

  async analyzeDocument(content, analysisType, options = {}) {
    try {
      const { citationStyle = 'None', focusAreas = [], targetJournal, researchField } = options;

      // Use GPT-4 Turbo for highest quality analysis
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(analysisType, targetJournal, researchField)
          },
          {
            role: 'user',
            content: this.buildAdvancedPrompt(content, analysisType, citationStyle, focusAreas, targetJournal, researchField)
          }
        ],
        max_tokens: 6000, // Increased for more detailed analysis
        temperature: 0.2, // Lower temperature for more consistent, academic tone
        top_p: 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.1
      });

      const analysisResult = response.choices[0].message.content;
      
      return this.parseAnalysisResult(analysisResult, analysisType);
    } catch (error) {
      console.error('AI Analysis error:', error);
      throw new Error(`AI analysis failed: ${error.message}`);
    }
  }

  getSystemPrompt(analysisType, targetJournal, researchField) {
    const journalContext = targetJournal ? `Target Journal: ${targetJournal}` : 'General academic standards';
    const fieldContext = researchField ? `Research Field: ${researchField}` : 'Multi-disciplinary';
    
    return `You are an experienced academic writing expert and educator with expertise across multiple disciplines. You have worked with students from undergraduate to graduate levels, as well as researchers and professors. Your analysis is designed to help learners at all academic levels improve their writing and research skills.

Your expertise includes:
- Academic writing instruction for all levels (undergraduate to graduate)
- Research methodology and analysis
- Citation and reference guidance
- Academic writing excellence
- Research ethics and best practices
- Cross-disciplinary knowledge integration
- Student-centered feedback and learning

${journalContext}
${fieldContext}

Provide analysis that is constructive, educational, and appropriate for the academic level. Be thorough, specific, and encouraging. Your feedback should help students and researchers improve their academic writing and research skills.`;
  }

  buildAdvancedPrompt(content, analysisType, citationStyle, focusAreas, targetJournal, researchField) {
    const journalStandards = targetJournal ? `\nTarget Journal Standards: ${targetJournal}` : '';
    const fieldContext = researchField ? `\nResearch Field Context: ${researchField}` : '';
    
    return `Please conduct a comprehensive academic analysis of the following document. This analysis will be used by students and researchers to improve their academic writing and research skills.

Document Statistics:
- Length: ${content.length} characters
- Word Count: Approximately ${Math.round(content.split(' ').length)} words
- Citation Style: ${citationStyle}${journalStandards}${fieldContext}
- Focus Areas: ${focusAreas.length > 0 ? focusAreas.join(', ') : 'Comprehensive analysis'}

Document Content:
${content}

Please provide a thorough, constructive analysis in the following JSON format:`;

    switch (analysisType) {
      case 'general':
        return `${this.buildAdvancedPrompt(content, analysisType, citationStyle, focusAreas, targetJournal, researchField)}
{
  "overall_assessment": "strong|good|needs_improvement|developing",
  "academic_level": "undergraduate|graduate|postgraduate|professional",
  "executive_summary": "Comprehensive assessment of the document's academic quality and areas for improvement",
  "research_contribution": {
    "novelty": "Assessment of originality and innovation",
    "significance": "Evaluation of research impact and importance",
    "rigor": "Analysis of methodological soundness",
    "reproducibility": "Assessment of research reproducibility"
  },
  "manuscript_structure": {
    "abstract": "Detailed feedback on abstract quality and completeness",
    "introduction": "Analysis of literature review, gap identification, and hypothesis formulation",
    "methods": "Evaluation of methodology, experimental design, and statistical approaches",
    "results": "Assessment of data presentation, analysis, and interpretation",
    "discussion": "Review of implications, limitations, and future directions",
    "conclusion": "Evaluation of conclusion strength and contribution summary"
  },
  "academic_excellence": {
    "writing_quality": "Assessment of clarity, precision, and academic tone",
    "logical_flow": "Evaluation of argument structure and coherence",
    "critical_thinking": "Analysis of analytical depth and scholarly rigor",
    "evidence_integration": "Assessment of how evidence supports arguments"
  },
  "technical_quality": {
    "statistical_analysis": "Review of statistical methods and interpretation",
    "data_quality": "Assessment of data collection and validation",
    "methodology": "Evaluation of research design and implementation",
    "ethical_considerations": "Review of ethical compliance and reporting"
  },
  "strengths": [
    "Specific strengths with examples from the text",
    "Areas where the research excels"
  ],
  "critical_issues": [
    "Major issues that must be addressed",
    "Problems that could lead to rejection"
  ],
  "minor_improvements": [
    "Smaller issues that would enhance quality",
    "Polish and refinement suggestions"
  ],
  "improvement_strategy": {
    "priority_areas": ["Ordered list of most important areas for improvement"],
    "learning_resources": ["Suggested resources for skill development"],
    "next_steps": ["Specific actions to take for improvement"]
  },
  "academic_guidance": {
    "strengths_to_build_on": ["Areas where the writer excels"],
    "common_improvements": ["Typical areas for academic writing improvement"],
    "skill_development": ["Ways to enhance academic writing skills"]
  }
}`;

      case 'citation':
        return `${this.buildAdvancedPrompt(content, analysisType, citationStyle, focusAreas, targetJournal, researchField)}
{
  "citation_assessment": "excellent|good|needs_improvement|developing",
  "citation_style_compliance": "Detailed assessment of ${citationStyle} style compliance with specific examples",
  "reference_quality_assessment": {
    "source_authority": "Evaluation of source credibility and academic standing",
    "source_recency": "Assessment of publication dates and currency",
    "source_diversity": "Analysis of source variety and perspective balance",
    "source_relevance": "Evaluation of how well sources support arguments"
  },
  "citation_analysis": {
    "in_text_citations": {
      "formatting_errors": ["Specific formatting issues with examples"],
      "missing_citations": ["Uncited claims that need references"],
      "over_citation": ["Areas with excessive or unnecessary citations"],
      "citation_placement": ["Issues with citation positioning"]
    },
    "reference_list": {
      "completeness": "Assessment of reference list completeness",
      "formatting_consistency": "Evaluation of formatting uniformity",
      "duplicate_references": ["Any duplicate or redundant references"],
      "missing_information": ["Incomplete reference entries"]
    }
  },
  "academic_integrity": {
    "plagiarism_risk": "Assessment of potential plagiarism concerns",
    "attribution_quality": "Evaluation of proper source attribution",
    "originality_indicators": "Analysis of original contribution vs. synthesis",
    "ethical_compliance": "Review of citation ethics and best practices"
  },
  "citation_strategy": {
    "strengthening_arguments": ["How better citations could strengthen arguments"],
    "gap_identification": ["Areas where additional citations are needed"],
    "source_recommendations": ["Suggestions for additional high-quality sources"],
    "citation_optimization": ["Ways to improve citation impact and relevance"]
  },
  "journal_specific_requirements": {
    "style_guidelines": "Assessment against ${citationStyle} style guide",
    "journal_preferences": "Evaluation of alignment with target journal preferences",
    "field_conventions": "Review of discipline-specific citation practices"
  },
  "critical_issues": [
    "Major citation problems that must be fixed",
    "Issues that could lead to rejection"
  ],
  "improvement_recommendations": [
    "Specific actionable citation improvements",
    "Priority fixes for publication readiness"
  ]
}`;

      case 'grammar':
        return `${this.buildAdvancedPrompt(content, analysisType, citationStyle, focusAreas, targetJournal, researchField)}
{
  "writing_assessment": "excellent|good|needs_improvement|developing",
  "academic_writing_excellence": {
    "precision": "Assessment of word choice precision and academic vocabulary",
    "clarity": "Evaluation of sentence clarity and readability",
    "conciseness": "Analysis of writing efficiency and conciseness",
    "formality": "Assessment of appropriate academic tone and formality"
  },
  "grammatical_analysis": {
    "syntax_issues": [
      {
        "type": "specific grammatical error type",
        "location": "approximate location in text",
        "description": "Detailed description of the issue",
        "correction": "Specific correction with explanation",
        "severity": "critical|major|minor"
      }
    ],
    "sentence_structure": {
      "variety": "Assessment of sentence structure variety",
      "complexity": "Evaluation of appropriate complexity for academic writing",
      "flow": "Analysis of sentence-to-sentence transitions",
      "length": "Assessment of sentence length appropriateness"
    }
  },
  "academic_style": {
    "voice_consistency": "Evaluation of active vs. passive voice usage",
    "tense_consistency": "Assessment of verb tense consistency",
    "person_consistency": "Review of first/third person usage",
    "academic_conventions": "Assessment of discipline-specific writing conventions"
  },
  "vocabulary_assessment": {
    "word_choice": "Evaluation of vocabulary appropriateness and precision",
    "technical_terminology": "Assessment of technical term usage and definition",
    "redundancy": "Identification of redundant or repetitive language",
    "clarity": "Analysis of word choice clarity and accessibility"
  },
  "punctuation_analysis": {
    "comma_usage": "Assessment of comma placement and usage",
    "semicolon_colon": "Evaluation of semicolon and colon usage",
    "quotation_marks": "Review of quotation and citation punctuation",
    "hyphenation": "Assessment of hyphen and dash usage"
  },
  "readability_metrics": {
    "sentence_length": "Analysis of average sentence length",
    "paragraph_structure": "Evaluation of paragraph organization",
    "transition_quality": "Assessment of paragraph and section transitions",
    "overall_flow": "Evaluation of document flow and coherence"
  },
  "publication_standards": {
    "journal_requirements": "Assessment against target journal writing standards",
    "field_conventions": "Evaluation of discipline-specific writing norms",
    "international_readability": "Assessment for international audience accessibility"
  },
  "critical_issues": [
    "Major grammatical issues that must be fixed",
    "Problems that could impact publication acceptance"
  ],
  "style_improvements": [
    "Specific suggestions for enhancing academic writing style",
    "Recommendations for improving clarity and impact"
  ]
}`;

      case 'plagiarism':
        return `${this.buildAdvancedPrompt(content, analysisType, citationStyle, focusAreas, targetJournal, researchField)}
{
  "plagiarism_risk": "low|medium|high",
  "academic_integrity_assessment": {
    "originality_score": "Quantitative assessment of original content percentage",
    "synthesis_quality": "Evaluation of how well sources are synthesized vs. copied",
    "attribution_completeness": "Assessment of proper source attribution",
    "ethical_compliance": "Review of academic integrity standards compliance"
  },
  "similarity_analysis": {
    "potential_issues": [
      {
        "text_segment": "Specific text that may have similarity issues",
        "similarity_type": "direct_copy|paraphrase|idea_similarity",
        "risk_level": "high|medium|low",
        "recommendation": "Specific action needed to address the issue"
      }
    ],
    "citation_gaps": [
      "Specific claims or ideas that lack proper attribution",
      "Areas where additional citations are needed"
    ],
    "quotation_analysis": "Assessment of direct quotation usage and attribution"
  },
  "originality_indicators": {
    "unique_contributions": "Identification of original research contributions",
    "synthesis_quality": "Evaluation of how well existing knowledge is synthesized",
    "critical_analysis": "Assessment of original critical thinking and analysis",
    "methodological_innovation": "Identification of novel methodological approaches"
  },
  "attribution_quality": {
    "citation_completeness": "Assessment of citation completeness and accuracy",
    "source_diversity": "Evaluation of source variety and balance",
    "attribution_clarity": "Assessment of how clearly sources are attributed",
    "reference_quality": "Evaluation of reference list quality and completeness"
  },
  "academic_ethics": {
    "self_plagiarism_risk": "Assessment of potential self-plagiarism issues",
    "collaboration_attribution": "Review of proper collaboration and contribution attribution",
    "data_attribution": "Assessment of data source attribution and sharing",
    "methodology_attribution": "Review of methodology and tool attribution"
  },
  "publication_standards": {
    "journal_requirements": "Assessment against target journal originality requirements",
    "field_standards": "Evaluation against discipline-specific originality standards",
    "international_standards": "Assessment against international academic integrity standards"
  },
  "risk_mitigation": {
    "immediate_actions": ["Critical issues that must be addressed immediately"],
    "preventive_measures": ["Strategies to prevent future plagiarism issues"],
    "documentation_improvements": ["Ways to improve source documentation"],
    "attribution_enhancement": ["Methods to strengthen source attribution"]
  },
  "recommendations": [
    "Specific actionable recommendations for improving originality",
    "Priority areas for addressing attribution issues"
  ]
}`;

      case 'comprehensive':
        return `${this.buildAdvancedPrompt(content, analysisType, citationStyle, focusAreas, targetJournal, researchField)}
{
  "overall_assessment": "strong|good|needs_improvement|developing",
  "academic_level": "undergraduate|graduate|postgraduate|professional",
  "executive_summary": "Comprehensive assessment of the document's academic quality and learning opportunities",
  "research_excellence": {
    "novelty_contribution": {
      "assessment": "Evaluation of originality and contribution to the field",
      "strengths": ["Specific innovative aspects"],
      "improvements": ["Areas needing more originality"],
      "significance": "Assessment of research impact and importance"
    },
    "methodological_rigor": {
      "assessment": "Evaluation of research design and methodology",
      "strengths": ["Methodological strengths"],
      "improvements": ["Methodological improvements needed"],
      "reproducibility": "Assessment of research reproducibility"
    },
    "data_quality": {
      "assessment": "Evaluation of data collection and analysis",
      "strengths": ["Data quality strengths"],
      "improvements": ["Data-related improvements needed"],
      "statistical_analysis": "Assessment of statistical methods and interpretation"
    }
  },
  "document_quality": {
    "structure_organization": {
      "assessment": "Document structure and logical flow",
      "strengths": ["Structural strengths"],
      "improvements": ["Structural improvements needed"],
      "section_analysis": "Detailed analysis of each document section"
    },
    "writing_excellence": {
      "assessment": "Writing quality and academic style",
      "strengths": ["Writing strengths"],
      "improvements": ["Writing improvements needed"],
      "clarity_precision": "Assessment of clarity and precision"
    },
    "citation_integrity": {
      "assessment": "Citation quality and academic integrity",
      "strengths": ["Citation strengths"],
      "improvements": ["Citation improvements needed"],
      "originality_assessment": "Evaluation of originality and attribution"
    }
  },
  "improvement_strategy": {
    "learning_priorities": {
      "critical_areas": ["Most important areas for improvement"],
      "skill_development": ["Skills to focus on developing"],
      "learning_resources": ["Suggested resources for improvement"]
    },
    "development_roadmap": {
      "immediate_improvements": ["Quick wins and immediate fixes"],
      "long_term_goals": ["Areas for ongoing development"],
      "practice_suggestions": ["Specific practice recommendations"]
    }
  },
  "academic_guidance": {
    "strengths_to_build_on": ["Areas where the writer shows promise"],
    "common_improvements": ["Typical areas for academic writing improvement"],
    "skill_development": ["Ways to enhance academic writing skills"],
    "next_steps": ["Specific actions to take for improvement"]
  },
  "academic_impact": {
    "contribution_significance": "Assessment of potential academic impact",
    "field_advancement": "Evaluation of how the work advances the field",
    "practical_applications": "Assessment of potential practical applications",
    "future_research": "Suggestions for future research directions"
  },
  "quality_metrics": {
    "readability_assessment": "Assessment of document readability",
    "coherence_evaluation": "Evaluation of logical coherence",
    "evidence_strength": "Assessment of evidence quality and support",
    "argument_robustness": "Evaluation of argument strength and validity"
  },
  "priority_recommendations": [
    "Most important improvements for skill development",
    "Specific actionable steps for learning"
  ],
  "learning_timeline": {
    "immediate_actions": ["Actions to take right away"],
    "short_term_goals": ["Goals for the next few weeks"],
    "long_term_development": "Areas for ongoing skill development"
  }
}`;

      default:
        throw new Error(`Unsupported analysis type: ${analysisType}`);
    }
  }

  parseAnalysisResult(result, analysisType) {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(result);
      return {
        success: true,
        analysisType,
        results: parsed,
        rawResponse: result,
        timestamp: new Date().toISOString()
      };
    } catch (parseError) {
      // If JSON parsing fails, return the raw response
      console.warn('Failed to parse AI response as JSON:', parseError);
      return {
        success: true,
        analysisType,
        results: {
          raw_analysis: result,
          note: "Analysis completed but formatting may be inconsistent"
        },
        rawResponse: result,
        timestamp: new Date().toISOString()
      };
    }
  }

  async generateWritingSuggestions(content, focusArea) {
    try {
      const prompt = `As a world-renowned academic writing expert, provide comprehensive suggestions for improving ${focusArea} in this academic manuscript:

Text: ${content.substring(0, 2000)}...

Provide:
1. Specific examples with before/after comparisons
2. Advanced techniques used by top-tier researchers
3. Discipline-specific best practices
4. Common pitfalls that lead to rejection
5. Strategies for enhancing academic impact

Format as detailed, actionable guidance suitable for publication in top journals.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a distinguished academic writing expert with experience editing manuscripts for Nature, Science, and other top-tier journals. Provide sophisticated, publication-ready writing guidance.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 3000,
        temperature: 0.3
      });

      return {
        success: true,
        focusArea,
        suggestions: response.choices[0].message.content,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Writing suggestions error:', error);
      throw new Error(`Failed to generate writing suggestions: ${error.message}`);
    }
  }

  async performPeerReviewAnalysis(content, targetJournal, researchField) {
    try {
      const prompt = `Conduct a rigorous peer review analysis of this manuscript as if you were reviewing for ${targetJournal || 'a top-tier journal'} in the field of ${researchField || 'academic research'}.

Manuscript: ${content.substring(0, 3000)}...

Provide a comprehensive peer review covering:
1. Overall assessment and recommendation
2. Detailed evaluation of each section
3. Specific concerns and suggestions
4. Comparison to field standards
5. Publication readiness assessment

Format as a formal peer review report.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an experienced peer reviewer for top-tier academic journals. Provide thorough, constructive, and rigorous peer review analysis that meets the highest academic standards.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.2
      });

      return {
        success: true,
        reviewType: 'peer_review',
        targetJournal,
        researchField,
        review: response.choices[0].message.content,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Peer review analysis error:', error);
      throw new Error(`Failed to perform peer review analysis: ${error.message}`);
    }
  }

  async assessPublicationPotential(content, targetJournal, researchField) {
    try {
      const prompt = `Assess the publication potential of this manuscript for ${targetJournal || 'top-tier journals'} in ${researchField || 'academic research'}.

Manuscript: ${content.substring(0, 3000)}...

Evaluate:
1. Novelty and contribution to the field
2. Methodological rigor and soundness
3. Writing quality and clarity
4. Statistical analysis and data presentation
5. Ethical considerations and reproducibility
6. Fit with target journal scope and standards
7. Likelihood of acceptance and potential impact

Provide specific recommendations for improving publication chances.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a senior journal editor with extensive experience evaluating manuscripts for publication in top-tier academic journals. Provide detailed assessment of publication potential and specific guidance for improvement.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 3500,
        temperature: 0.2
      });

      return {
        success: true,
        assessmentType: 'publication_potential',
        targetJournal,
        researchField,
        assessment: response.choices[0].message.content,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Publication potential assessment error:', error);
      throw new Error(`Failed to assess publication potential: ${error.message}`);
    }
  }

  async checkCitationFormat(citations, citationStyle) {
    try {
      const prompt = `Please check the following citations for ${citationStyle} style compliance:

Citations: ${JSON.stringify(citations)}

For each citation, provide:
1. Compliance status (correct/incorrect/needs_improvement)
2. Specific formatting issues
3. Corrected version
4. Explanation of the rules applied

Format as JSON with each citation analyzed.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are an expert in ${citationStyle} citation style. Provide accurate formatting guidance.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 3000,
        temperature: 0.2
      });

      return {
        success: true,
        citationStyle,
        analysis: response.choices[0].message.content,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Citation check error:', error);
      throw new Error(`Failed to check citations: ${error.message}`);
    }
  }

  async summarizeDocument(content) {
    try {
      const prompt = `Please provide a comprehensive summary of the following academic document:

${content}

Include:
1. Main argument/thesis
2. Key supporting points
3. Methodology (if applicable)
4. Main findings/conclusions
5. Overall assessment of the work

Keep the summary concise but comprehensive.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an expert academic reviewer. Provide clear, accurate summaries of academic work.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.3
      });

      return {
        success: true,
        summary: response.choices[0].message.content,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Document summarization error:', error);
      throw new Error(`Failed to summarize document: ${error.message}`);
    }
  }
}

module.exports = new AIAnalysisService();
