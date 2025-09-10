import React, { useState, useEffect, useRef } from 'react';

interface AnalysisPageProps {
  onNavigate?: (page: string) => void;
}

interface Document {
  id: string;
  title: string;
  file_name?: string;
  originalFilename?: string;
  file_type?: string;
  fileType?: string;
  file_size?: number;
  fileSize?: number;
  created_at?: string;
  createdAt?: string;
  content_text?: string;
}

interface AnalysisType {
  id: string;
  name: string;
  description: string;
  icon: string;
  estimatedTime: string;
}

interface Annotation {
  id: string;
  type: 'strong' | 'improve' | 'concern';
  text: string;
  startIndex: number;
  endIndex: number;
  comment: string;
  suggestion?: string;
}

interface AnalysisResult {
  success: boolean;
  data: {
    analysisType: string;
    result: string;
    documentId: string;
    timestamp: string;
    annotations?: Annotation[];
  };
}

const AnalysisPage: React.FC<AnalysisPageProps> = ({ onNavigate }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [analysisTypes, setAnalysisTypes] = useState<AnalysisType[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<string>('');
  const [selectedAnalysisType, setSelectedAnalysisType] = useState<string>('comprehensive');
  const [selectedCitationStyle, setSelectedCitationStyle] = useState<string>('APA');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [documentContent, setDocumentContent] = useState<string>('');
  const [previewContent, setPreviewContent] = useState<string>('');
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);
  const [hoveredAnnotation, setHoveredAnnotation] = useState<string | null>(null);
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const documentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('AnalysisPage: fetchDocuments and fetchAnalysisTypes called');
    fetchDocuments();
    fetchAnalysisTypes();
    
    // Check if there's text content from dashboard
    const textContent = localStorage.getItem('textAnalysisContent');
    if (textContent) {
      setPreviewContent(textContent);
      setDocumentContent(textContent);
      // Clear the stored content after using it
      localStorage.removeItem('textAnalysisContent');
    }
  }, []);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Please log in to access documents');
        return;
      }

      const response = await fetch('http://localhost:3001/api/documents', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }

      const data = await response.json();
      setDocuments(data.data.documents || []);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch documents');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAnalysisTypes = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Please log in to access analysis types');
        return;
      }

      const response = await fetch('http://localhost:3001/api/analysis/types', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analysis types');
      }

      const data = await response.json();
      setAnalysisTypes(data.data || []);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch analysis types');
    }
  };

  const generateAIAnnotations = (content: string, analysisResult: string): Annotation[] => {
    const annotations: Annotation[] = [];
    let annotationId = 1;

    console.log('Generating annotations for content length:', content.length);
    console.log('Analysis result length:', analysisResult.length);

    // Extract specific feedback points with better categorization
    const specificFeedback = extractSpecificFeedback(analysisResult);
    console.log('Extracted specific feedback:', specificFeedback);
    
    // Create annotations based on specific feedback
    specificFeedback.forEach((feedback) => {
      const matchingText = findBestMatchingText(content, feedback.text);
      console.log('Looking for text:', feedback.text, 'Found:', matchingText);
      if (matchingText) {
        annotations.push({
          id: annotationId.toString(),
          type: feedback.type,
          text: matchingText.text,
          startIndex: matchingText.startIndex,
          endIndex: matchingText.endIndex,
          comment: feedback.comment,
          suggestion: feedback.suggestion
        });
        annotationId++;
      }
    });

    // If we still need more annotations, create sentence-based ones
    if (annotations.length < 5) {
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
      const aiInsights = extractDetailedInsights(analysisResult);
      
      sentences.forEach((sentence, index) => {
        if (annotations.length >= 15) return;
        
        const sentenceTrimmed = sentence.trim();
        if (sentenceTrimmed.length > 10) {
          const startIndex = content.indexOf(sentenceTrimmed);
          if (startIndex !== -1 && !isAlreadyAnnotated(annotations, startIndex, startIndex + sentenceTrimmed.length)) {
            const insight = aiInsights[index % aiInsights.length];
            
            annotations.push({
              id: annotationId.toString(),
              type: insight.type,
              text: sentenceTrimmed,
              startIndex: startIndex,
              endIndex: startIndex + sentenceTrimmed.length,
              comment: insight.comment,
              suggestion: insight.suggestion
            });
            annotationId++;
          }
        }
      });
    }


    console.log('Final annotations:', annotations);
    return annotations;
  };

  const extractSpecificFeedback = (analysis: string): Array<{text: string, type: 'strong' | 'improve' | 'concern', comment: string, suggestion: string}> => {
    const feedback: Array<{text: string, type: 'strong' | 'improve' | 'concern', comment: string, suggestion: string}> = [];
    
    // Look for quoted text in the analysis (from structured backend response)
    const quotedTextRegex = /\*\*"([^"]+)"\*\*/g;
    let match;
    
    while ((match = quotedTextRegex.exec(analysis)) !== null) {
      const quotedText = match[1];
      const context = analysis.slice(Math.max(0, match.index - 100), match.index + 200);
      
      // Determine type based on context around the quoted text
      let type: 'strong' | 'improve' | 'concern' = 'improve';
      let comment = '';
      let suggestion = '';
      
      // Look for context clues
      if (/strength|excellent|outstanding|well-written|clear|coherent|logical|thorough|comprehensive|insightful|rigorous|methodical|precise|articulate|compelling|persuasive|well-structured|well-organized|strong argument|solid evidence|good use of|effective|successful|impressive|notable|commendable/i.test(context)) {
        type = 'strong';
        comment = `Strong point: ${context.slice(0, 100)}...`;
        suggestion = 'This demonstrates strong academic writing. Continue using this approach throughout your paper.';
      } else if (/concern|weak|poor|unclear|confusing|vague|inconsistent|incomplete|insufficient|lacking|missing|problem|issue|limitation|critical|fail|detract|undermine|contradict|inaccurate|incorrect|flawed|deficient|inadequate|unconvincing|unsubstantiated/i.test(context)) {
        type = 'concern';
        comment = `Serious concern: ${context.slice(0, 100)}...`;
        suggestion = 'This area needs immediate attention and revision to strengthen your argument.';
      } else {
        type = 'improve';
        comment = `Area for improvement: ${context.slice(0, 100)}...`;
        suggestion = 'Consider enhancing this section with more specific details and supporting evidence.';
      }
      
      feedback.push({
        text: quotedText,
        type: type,
        comment: comment,
        suggestion: suggestion
      });
    }
    
    // If no quoted text found, fall back to line-based extraction
    if (feedback.length === 0) {
      const lines = analysis.split('\n').filter(line => line.trim().length > 0);
      
      lines.forEach(line => {
        const cleanLine = line.trim().replace(/^\*\*|\*\*$|^- |^• |^\d+\./g, '');
        
        if (cleanLine.length > 20 && cleanLine.length < 300) {
          let type: 'strong' | 'improve' | 'concern' = 'improve';
          let suggestion = '';
          
          if (/excellent|outstanding|well-written|clear|coherent|logical|thorough|comprehensive|insightful|rigorous|methodical|precise|articulate|compelling|persuasive|well-structured|well-organized|strong argument|solid evidence|good use of|effective|successful|impressive|notable|commendable/i.test(cleanLine)) {
            type = 'strong';
            suggestion = 'This demonstrates strong academic writing. Continue using this approach throughout your paper.';
          } else if (/weak|poor|unclear|confusing|vague|inconsistent|incomplete|insufficient|lacking|missing|problem|issue|limitation|concern|critical|fail|detract|undermine|contradict|inaccurate|incorrect|flawed|deficient|inadequate|unconvincing|unsubstantiated/i.test(cleanLine)) {
            type = 'concern';
            suggestion = 'This area needs immediate attention and revision to strengthen your argument.';
          } else {
            type = 'improve';
            suggestion = 'Consider enhancing this section with more specific details and supporting evidence.';
          }
          
          const keyTerms = extractKeyTerms(cleanLine);
          
          if (keyTerms.length === 0) {
            const words = cleanLine.toLowerCase().split(/\s+/).filter(word => 
              word.length > 3 && 
              !['this', 'that', 'with', 'from', 'they', 'have', 'been', 'were', 'said', 'each', 'which', 'their', 'will', 'more', 'also', 'into', 'time', 'only', 'could', 'other', 'after', 'first', 'well', 'work', 'such', 'make', 'over', 'think', 'help', 'just', 'like', 'long', 'make', 'much', 'some', 'very', 'when', 'here', 'much', 'take', 'than', 'them', 'these', 'so', 'may', 'say', 'she', 'use', 'her', 'many', 'would', 'there', 'can', 'all', 'but', 'not', 'what', 'all', 'were', 'when', 'your', 'can', 'said', 'each', 'which', 'she', 'do', 'how', 'their', 'if', 'will', 'up', 'other', 'about', 'out', 'many', 'then', 'them', 'these', 'so', 'some', 'her', 'would', 'make', 'like', 'into', 'him', 'time', 'has', 'two', 'more', 'go', 'no', 'way', 'could', 'my', 'than', 'first', 'been', 'call', 'who', 'its', 'now', 'find', 'long', 'down', 'day', 'did', 'get', 'come', 'made', 'may', 'part'].includes(word)
            );
            keyTerms.push(...words.slice(0, 3));
          }
          
          feedback.push({
            text: keyTerms.join(' '),
            type: type,
            comment: cleanLine,
            suggestion: suggestion
          });
        }
      });
    }
    
    return feedback.slice(0, 15);
  };

  const extractKeyTerms = (text: string): string[] => {
    // Extract meaningful terms for text matching
    const terms = text.toLowerCase()
      .split(/\s+/)
      .filter(word => 
        word.length > 3 && 
        !/the|and|or|but|for|with|this|that|these|those|from|they|have|been|were|said|each|which|their|time|will|about|there|could|other|after|first|well|also|new|want|because|any|these|give|day|most|us/i.test(word)
      )
      .slice(0, 3);
    
    return terms;
  };

  const findBestMatchingText = (content: string, keyTerms: string): { text: string; startIndex: number; endIndex: number } | null => {
    const terms = keyTerms.split(' ').filter(term => term.length > 2);
    
    // Try to find exact phrase matches first
    for (const term of terms) {
      const regex = new RegExp(`\\b${term}\\b[^.!?]*[.!?]?`, 'gi');
      const matches = content.match(regex);
      if (matches) {
        for (const match of matches) {
          if (match.length > 10 && match.length < 200) {
            const startIndex = content.indexOf(match);
            return {
              text: match.trim(),
              startIndex: startIndex,
              endIndex: startIndex + match.length
            };
          }
        }
      }
    }
    
    // If no exact matches, try to find sentences containing the terms
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    for (const sentence of sentences) {
      const sentenceLower = sentence.toLowerCase();
      if (terms.some(term => sentenceLower.includes(term.toLowerCase()))) {
        const startIndex = content.indexOf(sentence);
        return {
          text: sentence.trim(),
          startIndex: startIndex,
          endIndex: startIndex + sentence.length
        };
      }
    }
    
    // If still no matches, try to find any sentence that might be relevant
    if (sentences.length > 0) {
      const firstSentence = sentences[0].trim();
      const startIndex = content.indexOf(firstSentence);
      return {
        text: firstSentence,
        startIndex: startIndex,
        endIndex: startIndex + firstSentence.length
      };
    }
    
    return null;
  };

  const isAlreadyAnnotated = (annotations: Annotation[], startIndex: number, endIndex: number): boolean => {
    return annotations.some(ann => 
      (startIndex >= ann.startIndex && startIndex < ann.endIndex) ||
      (endIndex > ann.startIndex && endIndex <= ann.endIndex) ||
      (startIndex <= ann.startIndex && endIndex >= ann.endIndex)
    );
  };

  const extractDetailedInsights = (analysis: string): Array<{type: 'strong' | 'improve' | 'concern', comment: string, suggestion: string}> => {
    const insights: Array<{type: 'strong' | 'improve' | 'concern', comment: string, suggestion: string}> = [];
    const lines = analysis.split('\n').filter(line => line.trim().length > 20);
    
    lines.forEach(line => {
      const cleanLine = line.trim().replace(/^\*\*|\*\*$|^- |^• |^\d+\./g, '');
      if (cleanLine.length > 20 && cleanLine.length < 200) {
        let type: 'strong' | 'improve' | 'concern' = 'improve';
        let suggestion = '';
        
        if (/strength|strong|excellent|good|positive|commendable|effective|clear|well|timely|relevant/i.test(cleanLine)) {
          type = 'strong';
          suggestion = 'This demonstrates strong academic writing practices that enhance the paper\'s credibility.';
        } else if (/concern|weak|lack|missing|insufficient|problem|issue|limitation|critical|fail|detract/i.test(cleanLine)) {
          type = 'concern';
          suggestion = 'This area requires immediate attention and revision to improve the overall quality.';
        } else {
          type = 'improve';
          suggestion = 'Consider enhancing this section with more specific details and supporting evidence.';
        }
        
        insights.push({
          type: type,
          comment: cleanLine,
          suggestion: suggestion
        });
      }
    });
    
    return insights.slice(0, 15); // Limit to 15 insights
  };



  const fetchDocumentContent = async (documentId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Please log in to access documents');
      }

      const response = await fetch(`http://localhost:3001/api/documents/${documentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch document content');
      }

      const data = await response.json();
      console.log('Document response:', data);
      return data.data?.document?.content_text || data.data?.content_text || '';
    } catch (error) {
      console.error('Error fetching document content:', error);
      throw new Error('Failed to fetch document content');
    }
  };

  const handleDocumentSelection = async (documentId: string) => {
    setSelectedDocument(documentId);
    setPreviewContent('');
    
    if (documentId) {
      setIsLoadingPreview(true);
      try {
        const content = await fetchDocumentContent(documentId);
        setPreviewContent(content);
      } catch (error) {
        console.error('Error loading document preview:', error);
        setPreviewContent('Failed to load document preview');
      } finally {
        setIsLoadingPreview(false);
      }
    }
  };

  const handleAnalyze = async () => {
    if (!selectedAnalysisType) {
      setError('Please select an analysis type');
      return;
    }

    // Check if we have text content from dashboard or a selected document
    let content = '';
    if (documentContent && documentContent.trim().length > 0) {
      // Use text content from dashboard
      content = documentContent;
    } else if (selectedDocument) {
      // Use selected document content
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Please log in to analyze documents');
        return;
      }
      content = await fetchDocumentContent(selectedDocument);
      if (!content || content.trim().length === 0) {
        setError('Document content is empty or unavailable');
        return;
      }
      setDocumentContent(content);
    } else {
      setError('Please select a document or provide text content');
      return;
    }

    setIsAnalyzing(true);
    setError('');
    setAnalysisResult('');
    setAnnotations([]);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Please log in to analyze documents');
      }

      const response = await fetch('http://localhost:3001/api/analysis/analyze', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId: selectedDocument || null,
          content: content,
          analysisType: selectedAnalysisType,
          citationStyle: selectedCitationStyle,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Analysis failed');
      }

      const result: AnalysisResult = await response.json();
      setAnalysisResult(result.data.result);
      
      // Use annotations from backend if available, otherwise generate fallback
      if (result.data.annotations && result.data.annotations.length > 0) {
        console.log('Using backend annotations:', result.data.annotations);
        
        // Validate and clean annotations
        const validatedAnnotations = result.data.annotations
          .filter(annotation => {
            // Validate that the annotation has proper indices and text
            const isValid = annotation.startIndex >= 0 && 
                           annotation.endIndex > annotation.startIndex && 
                           annotation.endIndex <= content.length &&
                           annotation.text && 
                           annotation.comment;
            
            if (!isValid) {
              console.warn('Invalid annotation filtered out:', annotation);
            }
            
            return isValid;
          })
          .map(annotation => {
            // Ensure the text matches what's actually in the document
            const actualText = content.slice(annotation.startIndex, annotation.endIndex);
            return {
              ...annotation,
              text: actualText // Use the actual text from the document
            };
          });
        
        console.log('Validated annotations:', validatedAnnotations);
        setAnnotations(validatedAnnotations);
      } else {
        // Fallback to frontend generation if backend doesn't provide annotations
        const aiAnnotations = generateAIAnnotations(content, result.data.result);
        console.log('Generated fallback annotations:', aiAnnotations);
        setAnnotations(aiAnnotations);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };


  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleAnnotationHover = (e: React.MouseEvent, annotationId: string) => {
    setHoveredAnnotation(annotationId);
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
  };

  const scrollToAnnotation = (annotationId: string) => {
    setSelectedAnnotation(annotationId);
    const element = document.getElementById(`annotation-${annotationId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleSaveAnalysis = async () => {
    if (!analysisResult || !documentContent) {
      setError('No analysis to save');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Please log in to save analysis');
        return;
      }

      const response = await fetch('http://localhost:3001/api/analysis/save', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId: selectedDocument,
          content: documentContent,
          analysisResult: analysisResult,
          annotations: annotations,
          analysisType: selectedAnalysisType,
          citationStyle: selectedCitationStyle,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save analysis');
      }

      // Show success message
      alert('Analysis saved successfully!');
      
      // Optionally redirect to analysis history
      // onNavigate('analysis-history');

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save analysis');
    }
  };

  const renderHighlightedText = () => {
    if (!documentContent) {
      return <div className="text-gray-700 leading-relaxed">No document content available.</div>;
    }

    console.log('Rendering text with annotations:', annotations.length);
    console.log('Document content length:', documentContent.length);

    // Always split content into paragraphs first to preserve formatting
    const paragraphs = documentContent.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    if (annotations.length === 0) {
      // Render content with proper paragraph spacing
      return (
        <div className="text-gray-700 leading-relaxed">
          {paragraphs.map((paragraph, index) => (
            <p key={index} className="mb-4 text-justify">
              {paragraph.trim()}
            </p>
          ))}
        </div>
      );
    }

    // Sort annotations by start index and validate them
    const sortedAnnotations = [...annotations]
      .filter(annotation => {
        const isValid = annotation.startIndex >= 0 && 
                       annotation.endIndex > annotation.startIndex && 
                       annotation.endIndex <= documentContent.length;
        
        if (!isValid) {
          console.warn('Invalid annotation filtered out during rendering:', annotation);
        }
        
        return isValid;
      })
      .sort((a, b) => a.startIndex - b.startIndex);

    console.log('Valid annotations for rendering:', sortedAnnotations.length);

    // Render each paragraph separately to preserve spacing
    return (
      <div className="text-gray-700 leading-relaxed">
        {paragraphs.map((paragraph, paragraphIndex) => {
          const paragraphStart = documentContent.indexOf(paragraph);
          const paragraphEnd = paragraphStart + paragraph.length;
          
          // Find annotations that fall within this paragraph
          const paragraphAnnotations = sortedAnnotations.filter(annotation => 
            annotation.startIndex >= paragraphStart && annotation.endIndex <= paragraphEnd
          );
          
          if (paragraphAnnotations.length === 0) {
            // No annotations in this paragraph, render normally
            return (
              <p key={paragraphIndex} className="mb-4 text-justify">
                {paragraph.trim()}
              </p>
            );
          }
          
          // Render paragraph with annotations
          const parts = [];
          let lastIndex = 0;
          
          paragraphAnnotations.forEach((annotation) => {
            // Adjust annotation indices relative to paragraph start
            const relativeStart = annotation.startIndex - paragraphStart;
            const relativeEnd = annotation.endIndex - paragraphStart;
            
            // Add text before this annotation
            if (relativeStart > lastIndex) {
              const textBefore = paragraph.slice(lastIndex, relativeStart);
              if (textBefore.trim()) {
                parts.push(
                  <span key={`text-${paragraphIndex}-${lastIndex}`} className="text-gray-700">
                    {textBefore}
                  </span>
                );
              }
            }

            // Validate annotation indices
            const actualText = paragraph.slice(relativeStart, relativeEnd);
            console.log(`Annotation ${annotation.id}: "${actualText}" (${relativeStart}-${relativeEnd})`);

            const highlightClasses = {
              strong: 'bg-green-100 text-green-900 border-b-2 border-green-400 hover:bg-green-200',
              improve: 'bg-amber-100 text-amber-900 border-b-2 border-amber-400 hover:bg-amber-200',
              concern: 'bg-red-100 text-red-900 border-b-2 border-red-400 hover:bg-red-200'
            };

            parts.push(
              <span
                key={annotation.id}
                id={`annotation-${annotation.id}`}
                className={`${highlightClasses[annotation.type]} px-1 cursor-pointer transition-all duration-200 ${
                  selectedAnnotation === annotation.id ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                }`}
                onMouseEnter={(e) => handleAnnotationHover(e, annotation.id)}
                onMouseLeave={() => setHoveredAnnotation(null)}
                onClick={() => scrollToAnnotation(annotation.id)}
                title={`${annotation.type.toUpperCase()}: ${annotation.comment}`}
              >
                {actualText}
              </span>
            );

            lastIndex = relativeEnd;
          });

          // Add remaining text after the last annotation in this paragraph
          if (lastIndex < paragraph.length) {
            const remainingText = paragraph.slice(lastIndex);
            if (remainingText.trim()) {
              parts.push(
                <span key={`text-${paragraphIndex}-${lastIndex}`} className="text-gray-700">
                  {remainingText}
                </span>
              );
            }
          }

          return (
            <p key={paragraphIndex} className="mb-4 text-justify">
              {parts}
            </p>
          );
        })}
      </div>
    );
  };

  const getAnnotationIcon = (type: string) => {
    switch (type) {
      case 'strong':
        return (
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'improve':
        return (
          <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
      case 'concern':
        return (
          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analysis tools...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Navigation Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => onNavigate?.('dashboard')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back to Dashboard</span>
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => onNavigate?.('analysis-history')}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-100 transition-colors"
              >
                Analysis History
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            AI Scholar Analysis
          </h1>
          <p className="mt-2 text-gray-600">
            Get comprehensive AI-powered feedback on your academic documents
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {!analysisResult ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Analysis Configuration */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Configure Analysis</h2>
              
              {/* Document Selection - Only show if no text content from dashboard */}
              {!documentContent && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Document
                  </label>
                  <select
                    value={selectedDocument}
                    onChange={(e) => handleDocumentSelection(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    disabled={isAnalyzing}
                  >
                    <option value="">Choose a document...</option>
                    {documents.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.title} ({doc.originalFilename || doc.file_name})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Text Content Notice */}
              {documentContent && !selectedDocument && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium text-blue-800">Text Analysis Mode</span>
                  </div>
                  <p className="text-sm text-blue-700 mt-1">
                    Analyzing text content from dashboard. Select citation style and run analysis.
                  </p>
                </div>
              )}

              {/* Analysis Type Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Analysis Type
                </label>
                <div className="space-y-3">
                  {analysisTypes.map((type) => (
                    <div
                      key={type.id}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedAnalysisType === type.id
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }`}
                      onClick={() => setSelectedAnalysisType(type.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{type.icon}</span>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{type.name}</h3>
                          <p className="text-sm text-gray-600">{type.description}</p>
                          <p className="text-xs text-gray-500 mt-1">⏱️ {type.estimatedTime}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 ${
                          selectedAnalysisType === type.id
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedAnalysisType === type.id && (
                            <svg className="w-full h-full text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Citation Style Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Citation Style
                </label>
                <select
                  value={selectedCitationStyle}
                  onChange={(e) => setSelectedCitationStyle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  disabled={isAnalyzing}
                >
                  <option value="APA">APA (American Psychological Association)</option>
                  <option value="Harvard">Harvard</option>
                  <option value="Chicago">Chicago</option>
                  <option value="MLA">MLA (Modern Language Association)</option>
                  <option value="IEEE">IEEE</option>
                  <option value="Vancouver">Vancouver</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Select the citation style used in your document for more accurate analysis
                </p>
              </div>

              {/* Analyze Button */}
              <button
                onClick={handleAnalyze}
                disabled={(!selectedDocument && !documentContent) || !selectedAnalysisType || isAnalyzing}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {isAnalyzing ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Analyzing...</span>
                  </div>
                ) : (
                  'Analyze Document'
                )}
              </button>
            </div>

            {/* Document Preview */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Document Preview</h2>
              
              {!selectedDocument && !documentContent ? (
                <div className="text-center py-16">
                  <div className="mx-auto h-24 w-24 text-gray-300">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="mt-4 text-sm font-medium text-gray-900">No document selected</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Select a document to preview its content
                  </p>
                </div>
              ) : selectedDocument && isLoadingPreview ? (
                <div className="text-center py-16">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-sm text-gray-600">Loading document preview...</p>
                </div>
              ) : previewContent || documentContent ? (
                <div className="max-h-96 overflow-y-auto">
                  <div className="bg-gray-50 rounded-lg p-4 border">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-gray-700">
                        {selectedDocument 
                          ? documents.find(doc => doc.id === selectedDocument)?.title || 'Document Content'
                          : 'Text Content from Dashboard'
                        }
                      </h3>
                      <span className="text-xs text-gray-500">
                        {(previewContent || documentContent).split(' ').length} words
                      </span>
                    </div>
                    <div className="text-sm text-gray-700 leading-relaxed max-h-80 overflow-y-auto">
                      {(previewContent || documentContent).split(/\n\s*\n/).filter(p => p.trim().length > 0).map((paragraph, index) => (
                        <p key={index} className="mb-3 text-justify">
                          {paragraph.trim()}
                        </p>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 text-center">
                    <p className="text-xs text-gray-500">
                      This is the content that will be analyzed. Click "Analyze Document" to begin.
                    </p>
                  </div>
                </div>
              ) : selectedDocument ? (
                <div className="text-center py-16">
                  <div className="mx-auto h-24 w-24 text-gray-300">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                  </div>
                  <h3 className="mt-4 text-sm font-medium text-gray-900">Failed to load preview</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Unable to load document content for preview
                  </p>
              </div>
              ) : null}
            </div>
          </div>
        ) : (
          /* Premium Analysis Results Display */
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
            {/* Results Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                  <h2 className="text-xl font-semibold">
                    {documents.find(doc => doc.id === selectedDocument)?.title || 'Document Analysis'}
                  </h2>
                  <p className="text-blue-100 text-sm mt-1">
                    {analysisTypes.find(type => type.id === selectedAnalysisType)?.name} • Analyzed {formatDate(new Date().toISOString())}
                  </p>
              </div>
              <div className="flex items-center space-x-3">
                <button 
                  onClick={handleSaveAnalysis}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  <span>Save Analysis</span>
                </button>
                <button 
                  onClick={() => {
                    setAnalysisResult('');
                    setAnnotations([]);
                    setDocumentContent('');
                  }}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Close</span>
                </button>
              </div>
              </div>
            </div>

            {/* Legend */}
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-1 bg-green-400 rounded"></div>
                  <span className="text-gray-600">Strong sections</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-1 bg-amber-400 rounded"></div>
                  <span className="text-gray-600">Needs improvement</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-1 bg-red-400 rounded"></div>
                  <span className="text-gray-600">Needs revision</span>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex h-[600px]">
              {/* Document Panel */}
              <div className="flex-1 p-6 overflow-y-auto bg-white" ref={documentRef}>
                <div className="prose max-w-none">
                  <div className="text-sm leading-7">
                    {renderHighlightedText()}
            </div>
          </div>
        </div>

              {/* Annotations Panel */}
              <div className="w-96 bg-gray-50 border-l border-gray-200 overflow-y-auto">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    Annotations
                  </h3>

                  <div className="space-y-6">
                    {/* Strong Points */}
                <div>
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg">
                          {getAnnotationIcon('strong')}
                        </div>
                        <h4 className="font-medium text-green-800">Strong Points ({annotations.filter(a => a.type === 'strong').length})</h4>
                      </div>
                      <div className="space-y-2">
                        {annotations.filter(a => a.type === 'strong').map((annotation) => (
                          <div
                            key={annotation.id}
                            className={`bg-white rounded-lg p-4 border-l-4 border-green-400 shadow-sm hover:shadow-md transition-all cursor-pointer ${
                              selectedAnnotation === annotation.id ? 'ring-2 ring-blue-500' : ''
                            }`}
                            onClick={() => scrollToAnnotation(annotation.id)}
                            onMouseEnter={() => setHoveredAnnotation(annotation.id)}
                            onMouseLeave={() => setHoveredAnnotation(null)}
                          >
                            <p className="text-sm text-gray-700 font-medium mb-1">{annotation.comment}</p>
                            {annotation.suggestion && (
                              <p className="text-xs text-gray-500 italic">{annotation.suggestion}</p>
                            )}
                  </div>
                        ))}
                  </div>
                </div>

                    {/* Areas to Improve */}
                <div>
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-amber-100 rounded-lg">
                          {getAnnotationIcon('improve')}
                        </div>
                        <h4 className="font-medium text-amber-800">Areas to Improve ({annotations.filter(a => a.type === 'improve').length})</h4>
                      </div>
                      <div className="space-y-2">
                        {annotations.filter(a => a.type === 'improve').map((annotation) => (
                          <div
                            key={annotation.id}
                            className={`bg-white rounded-lg p-4 border-l-4 border-amber-400 shadow-sm hover:shadow-md transition-all cursor-pointer ${
                              selectedAnnotation === annotation.id ? 'ring-2 ring-blue-500' : ''
                            }`}
                            onClick={() => scrollToAnnotation(annotation.id)}
                            onMouseEnter={() => setHoveredAnnotation(annotation.id)}
                            onMouseLeave={() => setHoveredAnnotation(null)}
                          >
                            <p className="text-sm text-gray-700 font-medium mb-1">{annotation.comment}</p>
                            {annotation.suggestion && (
                              <p className="text-xs text-gray-500 italic">{annotation.suggestion}</p>
                            )}
                  </div>
                        ))}
                  </div>
                </div>

                    {/* Serious Concerns */}
                <div>
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-lg">
                          {getAnnotationIcon('concern')}
                        </div>
                        <h4 className="font-medium text-red-800">Serious Concerns ({annotations.filter(a => a.type === 'concern').length})</h4>
                      </div>
                      <div className="space-y-2">
                        {annotations.filter(a => a.type === 'concern').map((annotation) => (
                          <div
                            key={annotation.id}
                            className={`bg-white rounded-lg p-4 border-l-4 border-red-400 shadow-sm hover:shadow-md transition-all cursor-pointer ${
                              selectedAnnotation === annotation.id ? 'ring-2 ring-blue-500' : ''
                            }`}
                            onClick={() => scrollToAnnotation(annotation.id)}
                            onMouseEnter={() => setHoveredAnnotation(annotation.id)}
                            onMouseLeave={() => setHoveredAnnotation(null)}
                          >
                            <p className="text-sm text-gray-700 font-medium mb-1">{annotation.comment}</p>
                            {annotation.suggestion && (
                              <p className="text-xs text-gray-500 italic">{annotation.suggestion}</p>
                            )}
                  </div>
                        ))}
                  </div>
                </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Footer */}
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="text-sm">
                    <span className="text-gray-500">Word Count:</span>
                    <span className="ml-2 font-semibold text-gray-900">{documentContent.split(' ').length}</span>
                      </div>
                  <div className="text-sm">
                    <span className="text-gray-500">Citation Style:</span>
                    <span className="ml-2 font-semibold text-gray-900">{selectedCitationStyle}</span>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    Export Report
                  </button>
                  <button className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors">
                    Save Analysis
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hover Tooltip */}
        {hoveredAnnotation && analysisResult && (
          <div 
            className="fixed z-50 pointer-events-none transition-all duration-200"
            style={{
              left: tooltipPosition.x,
              top: tooltipPosition.y,
              transform: 'translate(-50%, -100%)'
            }}
          >
            {(() => {
              const annotation = annotations.find(a => a.id === hoveredAnnotation);
              if (!annotation) return null;
              
              const typeLabels = {
                strong: '✓ Strong Point',
                improve: '⚠ Needs Improvement', 
                concern: '⚠ Serious Concern'
              };
              
              return (
                <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl max-w-xs mb-2">
                  <div className="font-semibold mb-1">
                    {typeLabels[annotation.type]}
                  </div>
                  <div className="mb-2 text-gray-200">
                    "{annotation.text}"
                  </div>
                  <div className="text-gray-100">
                    {annotation.comment}
                  </div>
                  {annotation.suggestion && (
                    <div className="mt-2 text-gray-300 italic">
                      💡 {annotation.suggestion}
                    </div>
                  )}
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                    <div className="border-8 border-transparent border-t-gray-900"></div>
                  </div>
            </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisPage;