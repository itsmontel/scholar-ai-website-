const rateLimit = require('express-rate-limit');

// Skip rate limiting in development
const skip = (req) => {
  return process.env.NODE_ENV === 'development' && req.ip === '::1';
};

// General rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 10000 : 100, // Much higher limit in development
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip
});

// Strict rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : 5, // Much higher limit in development
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip
});

// Moderate rate limiting for analysis endpoints
const analysisLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: process.env.NODE_ENV === 'development' ? 1000 : 10, // Much higher limit in development
  message: {
    success: false,
    message: 'Too many analysis requests, please wait a moment.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip
});

// File upload rate limiting
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: process.env.NODE_ENV === 'development' ? 1000 : 5, // Much higher limit in development
  message: {
    success: false,
    message: 'Too many file uploads, please wait a moment.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip
});

module.exports = {
  generalLimiter,
  authLimiter,
  analysisLimiter,
  uploadLimiter
};
