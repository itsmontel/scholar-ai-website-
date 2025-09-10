const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

class DocumentParser {
  /**
   * Parse document content based on file type
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} mimeType - File MIME type
   * @param {string} fileName - Original file name
   * @returns {Promise<Object>} Parsed content with metadata
   */
  async parseDocument(fileBuffer, mimeType, fileName) {
    try {
      let content = '';
      let wordCount = 0;
      let pageCount = 0;

      // Determine file type and parse accordingly
      if (mimeType === 'application/pdf') {
        const result = await this.parsePDF(fileBuffer);
        content = result.text;
        pageCount = result.numpages;
        wordCount = this.countWords(content);
      } else if (
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        mimeType === 'application/msword'
      ) {
        const result = await this.parseWordDocument(fileBuffer);
        content = result.value;
        wordCount = this.countWords(content);
        pageCount = this.estimatePages(wordCount);
      } else if (mimeType === 'text/plain') {
        content = fileBuffer.toString('utf-8');
        wordCount = this.countWords(content);
        pageCount = this.estimatePages(wordCount);
      } else {
        throw new Error(`Unsupported file type: ${mimeType}`);
      }

      // Clean up content while preserving paragraph structure
      const cleanedContent = this.cleanContent(content);

      return {
        content: cleanedContent,
        wordCount,
        pageCount,
        fileType: this.getFileType(mimeType),
        parsedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Document parsing error:', error);
      throw new Error(`Failed to parse document: ${error.message}`);
    }
  }

  /**
   * Parse PDF document
   * @param {Buffer} fileBuffer - PDF file buffer
   * @returns {Promise<Object>} PDF parsing result
   */
  async parsePDF(fileBuffer) {
    try {
      const data = await pdfParse(fileBuffer);
      return {
        text: data.text,
        numpages: data.numpages,
        info: data.info,
      };
    } catch (error) {
      console.error('PDF parsing error:', error);
      throw new Error('Failed to parse PDF document');
    }
  }

  /**
   * Parse Word document (DOCX/DOC)
   * @param {Buffer} fileBuffer - Word document buffer
   * @returns {Promise<Object>} Word document parsing result
   */
  async parseWordDocument(fileBuffer) {
    try {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      return {
        value: result.value,
        messages: result.messages,
      };
    } catch (error) {
      console.error('Word document parsing error:', error);
      throw new Error('Failed to parse Word document');
    }
  }

  /**
   * Clean content while preserving paragraph structure
   * @param {string} content - Raw content
   * @returns {string} Cleaned content with preserved paragraphs
   */
  cleanContent(content) {
    if (!content || typeof content !== 'string') return '';
    
    return content
      // Normalize line breaks - convert various line break types to \n
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Remove excessive whitespace but preserve paragraph breaks
      .replace(/[ \t]+/g, ' ') // Replace multiple spaces/tabs with single space
      .replace(/\n[ \t]+/g, '\n') // Remove leading spaces from lines
      .replace(/[ \t]+\n/g, '\n') // Remove trailing spaces from lines
      // Preserve paragraph breaks (double newlines)
      .replace(/\n{3,}/g, '\n\n') // Replace 3+ newlines with 2
      .trim(); // Remove leading/trailing whitespace
  }

  /**
   * Count words in text
   * @param {string} text - Text content
   * @returns {number} Word count
   */
  countWords(text) {
    if (!text || typeof text !== 'string') return 0;
    
    // Remove extra whitespace and split by spaces
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    return words.length;
  }

  /**
   * Estimate page count based on word count
   * @param {number} wordCount - Number of words
   * @returns {number} Estimated page count
   */
  estimatePages(wordCount) {
    // Average academic paper: ~250 words per page
    return Math.ceil(wordCount / 250);
  }

  /**
   * Get file type from MIME type
   * @param {string} mimeType - MIME type
   * @returns {string} File type
   */
  getFileType(mimeType) {
    const typeMap = {
      'application/pdf': 'PDF',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
      'application/msword': 'DOC',
      'text/plain': 'TXT',
    };
    return typeMap[mimeType] || 'UNKNOWN';
  }

  /**
   * Validate file type
   * @param {string} mimeType - MIME type
   * @returns {boolean} Whether file type is supported
   */
  isSupportedFileType(mimeType) {
    const supportedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
    ];
    return supportedTypes.includes(mimeType);
  }

  /**
   * Get file size limits based on type
   * @param {string} mimeType - MIME type
   * @returns {number} Maximum file size in bytes
   */
  getMaxFileSize(mimeType) {
    const sizeLimits = {
      'application/pdf': 50 * 1024 * 1024, // 50MB
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 25 * 1024 * 1024, // 25MB
      'application/msword': 25 * 1024 * 1024, // 25MB
      'text/plain': 10 * 1024 * 1024, // 10MB
    };
    return sizeLimits[mimeType] || 10 * 1024 * 1024; // Default 10MB
  }
}

module.exports = new DocumentParser();