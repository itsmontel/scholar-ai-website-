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
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        scriptSrc: ["'self'", "https://js.stripe.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'", "https://api.openai.com", "https://api.stripe.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    permissionsPolicy: {
      features: {
        camera: ["'none'"],
        microphone: ["'none'"],
        geolocation: ["'none'"],
        payment: ["'self'"],
        usb: ["'none'"],
        magnetometer: ["'none'"],
        gyroscope: ["'none'"],
        accelerometer: ["'none'"]
      }
    }
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
      
      // Allow webhooks with specific content types
      if (req.path.includes('/webhooks')) {
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
  },

  // Additional security headers
  (req, res, next) => {
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    
    // XSS Protection (legacy browsers)
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Remove server information
    res.removeHeader('X-Powered-By');
    
    next();
  },

  // Input sanitization for common attack vectors
  (req, res, next) => {
    // Skip sanitization for file uploads to avoid corrupting form data
    if (req.path.includes('/upload')) {
      return next();
    }
    
    if (req.body) {
      // Recursively sanitize all string values in request body
      const sanitizeObject = (obj) => {
        for (const key in obj) {
          if (typeof obj[key] === 'string') {
            // Remove potentially dangerous characters
            obj[key] = obj[key]
              .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
              .replace(/javascript:/gi, '') // Remove javascript: protocol
              .replace(/on\w+\s*=/gi, '') // Remove event handlers
              .trim();
          } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            sanitizeObject(obj[key]);
          }
        }
      };
      
      sanitizeObject(req.body);
    }
    
    next();
  }
];

module.exports = securityMiddleware;
