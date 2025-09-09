const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

class DocumentParser {
  static async parseDocument(fileBuffer, mimeType, originalName) {
    try {
      let content = '';
      let wordCount = 0;
      let pageCount = 0;

      switch (mimeType) {
        case 'application/pdf':
          const pdfData = await this.parsePDF(fileBuffer);
          content = pdfData.text;
          pageCount = pdfData.numpages;
          break;

        case 'application/msword':
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          const docData = await this.parseWordDocument(fileBuffer);
          content = docData.value;
          break;

        case 'text/plain':
          content = fileBuffer.toString('utf-8');
          break;

        default:
          throw new Error(`Unsupported file type: ${mimeType}`);
      }

      // Clean and process content
      content = this.cleanContent(content);
      wordCount = this.countWords(content);

      return {
        content,
        wordCount,
        pageCount,
        originalName,
        mimeType
      };
    } catch (error) {
      console.error('Document parsing error:', error);
      throw new Error(`Failed to parse document: ${error.message}`);
    }
  }

  static async parsePDF(buffer) {
    try {
      const data = await pdfParse(buffer, {
        // PDF parsing options
        max: 0, // No page limit
        version: 'v1.10.100' // PDF.js version
      });

      return {
        text: data.text,
        numpages: data.numpages,
        info: data.info,
        metadata: data.metadata
      };
    } catch (error) {
      console.error('PDF parsing error:', error);
      throw new Error('Failed to parse PDF file');
    }
  }

  static async parseWordDocument(buffer) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      
      return {
        value: result.value,
        messages: result.messages
      };
    } catch (error) {
      console.error('Word document parsing error:', error);
      throw new Error('Failed to parse Word document');
    }
  }

  static cleanContent(content) {
    if (!content) return '';

    return content
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove special characters that might interfere with analysis
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Normalize line breaks
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Remove multiple consecutive line breaks
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      // Trim whitespace
      .trim();
  }

  static countWords(text) {
    if (!text) return 0;
    
    // Remove extra whitespace and split by spaces
    const words = text
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .filter(word => word.length > 0);
    
    return words.length;
  }

  static extractCitations(text) {
    if (!text) return [];

    const citations = [];
    
    // Common citation patterns
    const patterns = [
      // APA style: (Author, Year)
      /\([A-Za-z\s]+,\s*\d{4}\)/g,
      // MLA style: (Author page)
      /\([A-Za-z\s]+\s+\d+\)/g,
      // Chicago style: (Author Year, page)
      /\([A-Za-z\s]+\s+\d{4},\s*\d+\)/g,
      // Harvard style: (Author Year)
      /\([A-Za-z\s]+\s+\d{4}\)/g,
      // Numbered citations: [1], [2], etc.
      /\[\d+\]/g,
      // Author-Date: Author (Year)
      /[A-Za-z\s]+\(\d{4}\)/g
    ];

    patterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        citations.push(...matches);
      }
    });

    // Remove duplicates
    return [...new Set(citations)];
  }

  static extractReferences(text) {
    if (!text) return [];

    const references = [];
    const lines = text.split('\n');
    
    // Look for reference sections
    let inReferencesSection = false;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Check if we're entering a references section
      if (/^(references?|bibliography|works?\s+cited?)$/i.test(trimmedLine)) {
        inReferencesSection = true;
        continue;
      }
      
      // Check if we're leaving the references section
      if (inReferencesSection && /^(appendix|notes?|acknowledgments?)$/i.test(trimmedLine)) {
        inReferencesSection = false;
        continue;
      }
      
      // If we're in the references section and the line looks like a reference
      if (inReferencesSection && trimmedLine.length > 10) {
        // Basic reference pattern matching
        if (this.looksLikeReference(trimmedLine)) {
          references.push(trimmedLine);
        }
      }
    }
    
    return references;
  }

  static looksLikeReference(text) {
    // Simple heuristics to identify reference entries
    const patterns = [
      // Contains year in parentheses or brackets
      /\(\d{4}\)|\[\d{4}\]/,
      // Contains "et al." or "and"
      /et\s+al\.|and/,
      // Contains common publication words
      /journal|conference|proceedings|book|chapter|article|paper/i,
      // Contains DOI or URL
      /doi:|http|www\./i,
      // Contains volume/issue/page numbers
      /\d+\(\d+\)|\d+:\d+|\d+-\d+/
    ];
    
    return patterns.some(pattern => pattern.test(text));
  }

  static getDocumentStats(content) {
    if (!content) {
      return {
        wordCount: 0,
        characterCount: 0,
        sentenceCount: 0,
        paragraphCount: 0,
        averageWordsPerSentence: 0,
        averageSentencesPerParagraph: 0
      };
    }

    const wordCount = this.countWords(content);
    const characterCount = content.length;
    const sentenceCount = content.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const paragraphCount = content.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
    
    const averageWordsPerSentence = sentenceCount > 0 ? Math.round(wordCount / sentenceCount) : 0;
    const averageSentencesPerParagraph = paragraphCount > 0 ? Math.round(sentenceCount / paragraphCount) : 0;

    return {
      wordCount,
      characterCount,
      sentenceCount,
      paragraphCount,
      averageWordsPerSentence,
      averageSentencesPerParagraph
    };
  }
}

module.exports = DocumentParser;
