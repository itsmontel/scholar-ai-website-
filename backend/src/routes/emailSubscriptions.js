const express = require('express');
const router = express.Router();
const { query } = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');
const { emailSubscriptionLimiter } = require('../middleware/rateLimiting');
const Joi = require('joi');

// Email validation schema
const emailSchema = Joi.string()
  .email({ tlds: { allow: false } })
  .max(255)
  .required()
  .messages({
    'string.email': 'Please provide a valid email address',
    'string.max': 'Email address is too long',
    'any.required': 'Email is required'
  });

// Validate email helper
const validateEmail = (email) => {
  const { error, value } = emailSchema.validate(email);
  if (error) {
    throw new Error(error.details[0].message);
  }
  return value.toLowerCase().trim();
};

// @route   POST /api/email-subscriptions/add
// @desc    Add email to subscription list (for users who signed up but haven't paid)
// @access  Public (but rate limited)
router.post('/add', emailSubscriptionLimiter, async (req, res) => {
  try {
    const { email, userId } = req.body;

    // Validate email format
    let normalizedEmail;
    try {
      normalizedEmail = validateEmail(email);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    // Validate userId if provided (must be UUID)
    if (userId) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID format'
        });
      }
    }

    // Check if email already exists
    const existingResult = await query(
      'SELECT id, is_subscribed FROM email_subscriptions WHERE email = $1',
      [normalizedEmail]
    );

    if (existingResult.rows.length > 0) {
      const existing = existingResult.rows[0];
      
      // If already unsubscribed, don't re-add them
      if (!existing.is_subscribed) {
        return res.status(400).json({
          success: false,
          message: 'This email has been unsubscribed and cannot be added again'
        });
      }

      // Update user_id if provided and not set
      if (userId && !existing.user_id) {
        await query(
          'UPDATE email_subscriptions SET user_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [userId, existing.id]
        );
      }

      return res.json({
        success: true,
        message: 'Email already in subscription list',
        data: { email: normalizedEmail }
      });
    }

    // Insert new email subscription
    const result = await query(
      `INSERT INTO email_subscriptions (email, user_id, is_subscribed, subscription_type, created_at, updated_at)
       VALUES ($1, $2, true, 'marketing', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id, email, is_subscribed, created_at`,
      [normalizedEmail, userId || null]
    );

    res.status(201).json({
      success: true,
      message: 'Email added to subscription list',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error adding email subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add email subscription'
    });
  }
});

// @route   POST /api/email-subscriptions/unsubscribe
// @desc    Unsubscribe email from marketing emails
// @access  Public (but rate limited - standard practice for unsubscribe links)
router.post('/unsubscribe', emailSubscriptionLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email format
    let normalizedEmail;
    try {
      normalizedEmail = validateEmail(email);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    // Check if email exists in subscriptions
    const existingResult = await query(
      'SELECT id, is_subscribed FROM email_subscriptions WHERE email = $1',
      [normalizedEmail]
    );

    if (existingResult.rows.length === 0) {
      // If email doesn't exist, create an entry with is_subscribed = false
      // This prevents them from being added in the future
      await query(
        `INSERT INTO email_subscriptions (email, is_subscribed, unsubscribed_at, created_at, updated_at)
         VALUES ($1, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [normalizedEmail]
      );

      return res.json({
        success: true,
        message: 'Email unsubscribed successfully',
        data: { email: normalizedEmail, unsubscribed: true }
      });
    }

    // Update existing subscription to unsubscribed
    const result = await query(
      `UPDATE email_subscriptions 
       SET is_subscribed = false, 
           unsubscribed_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE email = $1
       RETURNING id, email, is_subscribed, unsubscribed_at`,
      [normalizedEmail]
    );

    res.json({
      success: true,
      message: 'Email unsubscribed successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error unsubscribing email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unsubscribe email'
    });
  }
});

// @route   GET /api/email-subscriptions/list
// @desc    Get list of subscribed emails (for admin/marketing use)
// @access  Private (Requires authentication - consider adding admin role check)
router.get('/list', authenticateToken, emailSubscriptionLimiter, async (req, res) => {
  try {
    // TODO: Add admin role check here
    // Example: if (req.user.role !== 'admin') return res.status(403).json({...});
    
  try {
    const { subscribed_only = 'true', subscription_type = 'marketing', include_all_free_users = 'false' } = req.query;

    // If include_all_free_users is true, get all free users even if not in email_subscriptions
    if (include_all_free_users === 'true') {
      let queryText = `
        SELECT 
          COALESCE(es.id::text, u.id::text) as id,
          u.email,
          u.id as user_id,
          COALESCE(es.is_subscribed, true) as is_subscribed,
          COALESCE(es.subscription_type, 'marketing') as subscription_type,
          es.unsubscribed_at,
          u.created_at,
          u.subscription_plan,
          u.subscription_status
        FROM users u
        LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
        LEFT JOIN email_subscriptions es ON LOWER(TRIM(u.email)) = LOWER(TRIM(es.email))
        WHERE 
          (u.subscription_plan = 'free' OR u.subscription_plan IS NULL OR s.id IS NULL)
          AND u.email IS NOT NULL
          AND TRIM(u.email) != ''
      `;

      const params = [];

      if (subscribed_only === 'true') {
        queryText += ' AND (es.is_subscribed IS NULL OR es.is_subscribed = true)';
      }

      queryText += ' ORDER BY u.created_at DESC';

      const result = await query(queryText, params);

      return res.json({
        success: true,
        data: result.rows,
        count: result.rows.length,
        note: 'Includes all free users from users table'
      });
    }

    // Original query - only emails in email_subscriptions table
    let queryText = `
      SELECT 
        es.id,
        es.email,
        es.user_id,
        es.is_subscribed,
        es.subscription_type,
        es.unsubscribed_at,
        es.created_at,
        u.subscription_plan,
        u.subscription_status
      FROM email_subscriptions es
      LEFT JOIN users u ON es.user_id = u.id
      WHERE es.subscription_type = $1
    `;

    const params = [subscription_type];

    if (subscribed_only === 'true') {
      queryText += ' AND es.is_subscribed = true';
    }

    queryText += ' ORDER BY es.created_at DESC';

    const result = await query(queryText, params);

    // Filter to only show emails of users who haven't paid (free plan or no subscription)
    const filteredResults = result.rows.filter(row => {
      return !row.subscription_plan || 
             row.subscription_plan === 'free' || 
             !row.subscription_status || 
             row.subscription_status === 'active';
    });

    res.json({
      success: true,
      data: filteredResults,
      count: filteredResults.length,
      note: 'Only emails in email_subscriptions table. Use ?include_all_free_users=true to see all free users.'
    });
  } catch (error) {
    console.error('Error fetching email subscriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch email subscriptions'
    });
  }
});

// @route   GET /api/email-subscriptions/check
// @desc    Check if email is subscribed
// @access  Public (but rate limited)
router.get('/check', emailSubscriptionLimiter, async (req, res) => {
  try {
    const { email } = req.query;

    // Validate email format
    let normalizedEmail;
    try {
      normalizedEmail = validateEmail(email);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    const result = await query(
      'SELECT id, email, is_subscribed, unsubscribed_at FROM email_subscriptions WHERE email = $1',
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        data: { email: normalizedEmail, is_subscribed: null, exists: false }
      });
    }

    res.json({
      success: true,
      data: {
        email: result.rows[0].email,
        is_subscribed: result.rows[0].is_subscribed,
        unsubscribed_at: result.rows[0].unsubscribed_at,
        exists: true
      }
    });
  } catch (error) {
    console.error('Error checking email subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check email subscription'
    });
  }
});

module.exports = router;

