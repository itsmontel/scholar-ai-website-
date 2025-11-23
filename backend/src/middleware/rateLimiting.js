const rateLimit = require('express-rate-limit');

// Skip rate limiting in development
const skip = (req) => {
  return process.env.NODE_ENV === 'development' && req.ip === '::1';
};

// General rate limiting - Adjusted for bulletproof API retry logic
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 10000 : 1500, // Increased for retry reliability
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: 60 // Suggest retry after 60 seconds
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

// Moderate rate limiting for analysis endpoints - Adjusted for retries
const analysisLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: process.env.NODE_ENV === 'development' ? 1000 : 30, // Increased to allow for retries
  message: {
    success: false,
    message: 'Too many analysis requests, please wait a moment.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip
});

// File upload rate limiting - Adjusted for retry logic
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: process.env.NODE_ENV === 'development' ? 1000 : 15, // Increased to allow for retries
  message: {
    success: false,
    message: 'Too many file uploads, please wait a moment.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip
});

// Rate limiting for email subscription endpoints
const emailSubscriptionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 100 : 10, // 10 requests per 15 minutes in production
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip
});

module.exports = {
  generalLimiter,
  authLimiter,
  analysisLimiter,
  uploadLimiter,
  emailSubscriptionLimiter
};
