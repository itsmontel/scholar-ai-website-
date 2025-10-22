import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'span'],
    ALLOWED_ATTR: ['class'],
    KEEP_CONTENT: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
  });
};

/**
 * Sanitize text input to remove potentially dangerous content
 */
export const sanitizeText = (text: string): string => {
  if (typeof text !== 'string') return '';
  
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/data:(?!image\/)/gi, '') // Remove data: URLs except images
    .trim();
};

/**
 * Sanitize user input for display in the UI
 */
export const sanitizeUserInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  // First sanitize as text
  const textSanitized = sanitizeText(input);
  
  // Then sanitize any remaining HTML
  return sanitizeHtml(textSanitized);
};

/**
 * Validate and sanitize file names
 */
export const sanitizeFileName = (fileName: string): string => {
  if (typeof fileName !== 'string') return '';
  
  return fileName
    .replace(/[<>:"/\\|?*]/g, '') // Remove invalid file name characters
    .replace(/\.\./g, '') // Remove path traversal attempts
    .replace(/^\.+/, '') // Remove leading dots
    .trim()
    .substring(0, 255); // Limit length
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

/**
 * Validate URL format
 */
export const isValidUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
};

/**
 * Sanitize object recursively
 */
export const sanitizeObject = (obj: any): any => {
  if (typeof obj === 'string') {
    return sanitizeUserInput(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
};
