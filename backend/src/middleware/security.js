const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

// Security middleware configuration
const securityMiddleware = [
  // Set security headers
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }),

  // Prevent NoSQL injection attacks
  mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
      console.warn(`Sanitized key: ${key} in request:`, req.url);
    },
  }),

  // Prevent XSS attacks
  xss(),

  // Prevent HTTP Parameter Pollution
  hpp(),

  // Custom middleware to validate request size
  (req, res, next) => {
    const contentLength = parseInt(req.get('content-length') || '0');
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (contentLength > maxSize) {
      return res.status(413).json({
        success: false,
        message: 'Request entity too large'
      });
    }

    next();
  },

  // Custom middleware to validate content type for JSON endpoints
  (req, res, next) => {
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      const contentType = req.get('content-type');
      
      // Allow multipart/form-data for file uploads
      if (req.path.includes('/upload') && contentType && contentType.includes('multipart/form-data')) {
        return next();
      }
      
      // For other endpoints, require JSON content type
      if (!contentType || !contentType.includes('application/json')) {
        return res.status(400).json({
          success: false,
          message: 'Content-Type must be application/json'
        });
      }
    }

    next();
  }
];

module.exports = securityMiddleware;
