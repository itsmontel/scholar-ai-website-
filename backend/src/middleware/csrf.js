const crypto = require('crypto');

// Simple CSRF token store (in production, use Redis or database)
const tokenStore = new Map();

// Token expiration time (15 minutes)
const TOKEN_EXPIRY = 15 * 60 * 1000;

/**
 * Generate a CSRF token
 */
const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Middleware to generate and provide CSRF token
 */
const generateCSRFToken = (req, res, next) => {
  // Only generate tokens for authenticated users
  if (!req.user || !req.user.id) {
    return next();
  }

  const token = generateToken();
  const expiry = Date.now() + TOKEN_EXPIRY;
  
  // Store token with expiry
  tokenStore.set(token, {
    userId: req.user.id,
    expiry: expiry
  });
  
  // Clean up expired tokens periodically
  if (Math.random() < 0.1) { // 10% chance
    cleanupExpiredTokens();
  }
  
  // Add token to response headers
  res.setHeader('X-CSRF-Token', token);
  
  next();
};

/**
 * Middleware to validate CSRF token
 */
const validateCSRFToken = (req, res, next) => {
  // Skip validation for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  // Skip validation for webhooks
  if (req.path.includes('/webhooks')) {
    return next();
  }
  
  // Skip validation for unauthenticated requests
  if (!req.user || !req.user.id) {
    return next();
  }
  
  const token = req.headers['x-csrf-token'] || req.body._csrf;
  
  if (!token) {
    return res.status(403).json({
      success: false,
      message: 'CSRF token missing'
    });
  }
  
  const tokenData = tokenStore.get(token);
  
  if (!tokenData) {
    return res.status(403).json({
      success: false,
      message: 'Invalid CSRF token'
    });
  }
  
  // Check if token is expired
  if (Date.now() > tokenData.expiry) {
    tokenStore.delete(token);
    return res.status(403).json({
      success: false,
      message: 'CSRF token expired'
    });
  }
  
  // Check if token belongs to the current user
  if (tokenData.userId !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'CSRF token invalid for user'
    });
  }
  
  // Token is valid, remove it (one-time use)
  tokenStore.delete(token);
  
  next();
};

/**
 * Clean up expired tokens
 */
const cleanupExpiredTokens = () => {
  const now = Date.now();
  for (const [token, data] of tokenStore.entries()) {
    if (now > data.expiry) {
      tokenStore.delete(token);
    }
  }
};

/**
 * Get CSRF token endpoint
 */
const getCSRFToken = (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  
  const token = generateToken();
  const expiry = Date.now() + TOKEN_EXPIRY;
  
  tokenStore.set(token, {
    userId: req.user.id,
    expiry: expiry
  });
  
  res.json({
    success: true,
    token: token,
    expiresIn: TOKEN_EXPIRY
  });
};

module.exports = {
  generateCSRFToken,
  validateCSRFToken,
  getCSRFToken
};
