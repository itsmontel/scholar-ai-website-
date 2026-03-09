const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const passport = require('../config/passport');

const { query } = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');
const { 
  validateRegister, 
  validateLogin 
} = require('../middleware/validation');
const emailService = require('../services/emailService');
const userService = require('../services/userService');
const streakService = require('../services/streakService');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
  );
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', validateRegister, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user already exists
    const existingUser = await userService.findUserByEmail(email);

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');

    // Create user
    const userData = {
      email: email.toLowerCase(),
      password_hash: passwordHash,
      institution: null,
      research_field: null,
      email_verification_token: emailVerificationToken,
      subscription_plan: 'free',
      subscription_status: 'active',
      is_active: true,
      email_verified: false
    };

    const user = await userService.createUser(userData);

    // Add user to email subscription list (only if they haven't unsubscribed)
    try {
      const normalizedEmail = email.toLowerCase().trim();
      
      // Check if email is already unsubscribed
      const unsubscribeCheck = await query(
        'SELECT id, is_subscribed FROM email_subscriptions WHERE email = $1',
        [normalizedEmail]
      );

      if (unsubscribeCheck.rows.length === 0) {
        // Email not in list, add it
        await query(
          `INSERT INTO email_subscriptions (email, user_id, is_subscribed, subscription_type, created_at, updated_at)
           VALUES ($1, $2, true, 'marketing', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
           ON CONFLICT (email) DO UPDATE SET user_id = $2, updated_at = CURRENT_TIMESTAMP`,
          [normalizedEmail, user.id]
        );
      } else if (unsubscribeCheck.rows[0].is_subscribed) {
        // Email exists and is subscribed, update user_id if needed
        await query(
          'UPDATE email_subscriptions SET user_id = $1, updated_at = CURRENT_TIMESTAMP WHERE email = $2',
          [user.id, normalizedEmail]
        );
      }
      // If email is unsubscribed, don't add them back
    } catch (emailSubError) {
      console.error('Error adding user to email subscription list:', emailSubError);
      // Don't fail registration if email subscription fails
    }

    // Send verification email
    const emailResult = await emailService.sendVerificationEmail(email, emailVerificationToken);
    
    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error);
      // Don't fail registration if email fails, but log it
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check your email to verify your account.',
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          subscriptionPlan: user.subscription_plan,
          emailVerified: false
        },
        emailSent: emailResult.success,
        verificationToken: process.env.NODE_ENV === 'development' ? emailVerificationToken : undefined
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await userService.findUserByEmail(email);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is active
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if email is verified
    if (!user.email_verified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email address before logging in. Check your inbox for a verification link.',
        requiresEmailVerification: true
      });
    }

    // Update last login
    await userService.updateUser(user.id, { last_login: new Date().toISOString() });

    // Record streak activity (fire and forget)
    streakService.recordLogin(user.id).catch(() => {});

    // Generate JWT token
    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.first_name,
          lastName: user.last_name,
          subscriptionPlan: user.subscription_plan,
          subscriptionStatus: user.subscription_status,
          emailVerified: user.email_verified,
          onboardingCompleted: user.onboarding_completed || false,
          welcomeTutorialCompleted: user.welcome_tutorial_completed || false
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const achievementsService = require('../services/achievementsService');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    );

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, username, first_name, last_name, name, institution, research_field, subscription_plan, subscription_status, created_at, last_login, email_verified, onboarding_completed, welcome_tutorial_completed')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Record login for streak when user fetches /me (app load = active today)
    streakService.recordLogin(req.user.id).catch(() => {});

    let achievements = { stats: {}, unlockedBadges: {} };
    try {
      achievements = await achievementsService.getAchievements(req.user.id);
    } catch (achErr) {
      console.error('Get achievements error (non-fatal):', achErr);
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.first_name,
          lastName: user.last_name,
          name: user.name,
          institution: user.institution,
          researchField: user.research_field,
          subscriptionPlan: user.subscription_plan,
          subscriptionStatus: user.subscription_status,
          createdAt: user.created_at,
          lastLogin: user.last_login,
          emailVerified: user.email_verified,
          onboardingCompleted: user.onboarding_completed || false,
          welcomeTutorialCompleted: user.welcome_tutorial_completed || false
        },
        achievements: {
          stats: achievements.stats,
          unlockedBadges: achievements.unlockedBadges
        }
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user information'
    });
  }
});

// @route   POST /api/auth/verify-email
// @desc    Verify email address
// @access  Public
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    const result = await query(
      'UPDATE users SET email_verified = true, email_verification_token = NULL WHERE email_verification_token = $1 RETURNING id, email',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    const user = result.rows[0];

    // Send welcome email
    const welcomeResult = await emailService.sendWelcomeEmail(user.email);
    if (!welcomeResult.success) {
      console.error('Failed to send welcome email:', welcomeResult.error);
    }

    res.json({
      success: true,
      message: 'Email verified successfully. Welcome to WriteScholar!',
      data: {
        emailVerified: true,
        welcomeEmailSent: welcomeResult.success
      }
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Email verification failed'
    });
  }
});

// @route   GET /api/auth/verify-email
// @desc    Verify email address via GET (for email links)
// @access  Public
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    if (!token) {
      return res.redirect(`${frontendUrl}/login?error=missing-token`);
    }


    // Use userService to find and update the user
    const user = await userService.findUserByVerificationToken(token);
    
    if (!user) {
      return res.redirect(`${frontendUrl}/login?error=invalid-token`);
    }

    // Update the user to mark email as verified
    await userService.updateUser(user.id, {
      email_verified: true,
      email_verification_token: null
    });

    // Send welcome email
    const welcomeResult = await emailService.sendWelcomeEmail(user.email);
    if (!welcomeResult.success) {
      console.error('Failed to send welcome email:', welcomeResult.error);
    }

    // Redirect to email verification success page (user logs in with password)
    res.redirect(`${frontendUrl}/email-verification?verified=true`);
  } catch (error) {
    console.error('Email verification error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=verification-failed`);
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Request password reset
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const result = await query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      // Don't reveal if email exists or not
      return res.json({
        success: true,
        message: 'If the email exists, a password reset link has been sent'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    await query(
      'UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE email = $3',
      [resetToken, resetExpires, email.toLowerCase()]
    );

    // Send password reset email
    const emailResult = await emailService.sendPasswordResetEmail(email, resetToken);
    
    if (!emailResult.success) {
      console.error('Failed to send password reset email:', emailResult.error);
    }

    res.json({
      success: true,
      message: 'If the email exists, a password reset link has been sent',
      data: {
        emailSent: emailResult.success,
        resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
      }
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Password reset request failed'
    });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password
// @access  Public
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      });
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (newPassword.length < 8 || !passwordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      });
    }

    const result = await query(
      'SELECT id FROM users WHERE password_reset_token = $1 AND password_reset_expires > NOW()',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password and clear reset token
    await query(
      'UPDATE users SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL WHERE id = $2',
      [passwordHash, result.rows[0].id]
    );

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Password reset failed'
    });
  }
});

// @route   POST /api/auth/resend-verification
// @desc    Resend email verification
// @access  Public
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check if user exists and is not verified
    const result = await query(
      'SELECT id, email_verified, email_verification_token FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = result.rows[0];

    if (user.email_verified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Generate new verification token if needed
    let verificationToken = user.email_verification_token;
    if (!verificationToken) {
      verificationToken = crypto.randomBytes(32).toString('hex');
      await query(
        'UPDATE users SET email_verification_token = $1 WHERE id = $2',
        [verificationToken, user.id]
      );
    }

    // Send verification email
    const emailResult = await emailService.sendVerificationEmail(email, verificationToken);
    
    if (!emailResult.success) {
      console.error('Failed to resend verification email:', emailResult.error);
    }

    res.json({
      success: true,
      message: 'Verification email sent successfully',
      data: {
        emailSent: emailResult.success,
        verificationToken: process.env.NODE_ENV === 'development' ? verificationToken : undefined
      }
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend verification email'
    });
  }
});

// @route   POST /api/auth/refresh
// @desc    Refresh JWT token
// @access  Private
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    const newToken = generateToken(req.user.id);

    res.json({
      success: true,
      data: {
        token: newToken
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Token refresh failed'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// @route   GET /api/auth/google
// @desc    Initiate Google OAuth
// @access  Public
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  prompt: 'select_account'
}));

// @route   GET /api/auth/google/callback
// @desc    Google OAuth callback
// @access  Public
router.get('/google/callback', 
  passport.authenticate('google', { session: false }),
  async (req, res) => {
    try {
      // Record streak activity (fire and forget)
      streakService.recordLogin(req.user.id).catch(() => {});

      // Generate JWT token for the user
      const token = generateToken(req.user.id);
      
      // Redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify({
        id: req.user.id,
        email: req.user.email,
        username: req.user.username,
        name: req.user.name,
        profilePicture: req.user.profile_picture,
        onboardingCompleted: req.user.onboarding_completed || false
      }))}`);
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/login?error=oauth_failed`);
    }
  }
);

module.exports = router;
