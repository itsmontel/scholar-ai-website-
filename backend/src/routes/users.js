const express = require('express');
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const { authenticateToken } = require('../middleware/auth');
const { validateUpdateProfile, validateChangePassword } = require('../middleware/validation');
const userService = require('../services/userService');
const achievementsService = require('../services/achievementsService');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase
      .from('users')
      .select('id, email, username, name, first_name, last_name, institution, research_field, subscription_plan, subscription_status, created_at, last_login, email_verified')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: data.id,
          email: data.email,
          username: data.username,
          name: data.name,
          firstName: data.first_name,
          lastName: data.last_name,
          institution: data.institution,
          researchField: data.research_field,
          subscriptionPlan: data.subscription_plan,
          subscriptionStatus: data.subscription_status,
          createdAt: data.created_at,
          lastLogin: data.last_login,
          emailVerified: data.email_verified
        }
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile'
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticateToken, validateUpdateProfile, async (req, res) => {
  try {
    const { firstName, lastName, name, institution, researchField } = req.body;
    const userId = req.user.id;

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const updateData = {};
    if (firstName !== undefined) updateData.first_name = firstName;
    if (lastName !== undefined) updateData.last_name = lastName;
    if (name !== undefined) updateData.name = name;
    if (institution !== undefined) updateData.institution = institution;
    if (researchField !== undefined) updateData.research_field = researchField;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select('id, first_name, last_name, name, institution, research_field, updated_at')
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: data.id,
          firstName: data.first_name,
          lastName: data.last_name,
          name: data.name,
          institution: data.institution,
          researchField: data.research_field,
          updatedAt: data.updated_at
        }
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// @route   POST /api/users/complete-onboarding
// @desc    Mark onboarding as completed for the current user
// @access  Private
router.post('/complete-onboarding', authenticateToken, async (req, res) => {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { error } = await supabase
      .from('users')
      .update({ onboarding_completed: true, updated_at: new Date().toISOString() })
      .eq('id', req.user.id);

    if (error) {
      return res.status(500).json({ success: false, message: 'Failed to save onboarding status' });
    }

    res.json({ success: true, message: 'Onboarding marked as completed' });
  } catch (error) {
    console.error('Complete onboarding error:', error);
    res.status(500).json({ success: false, message: 'Failed to save onboarding status' });
  }
});

// @route   POST /api/users/complete-tutorial
// @desc    Mark welcome tutorial as completed for the current user
// @access  Private
router.post('/complete-tutorial', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Use service role to bypass RLS. userService may fall back to anon key.
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase
      .from('users')
      .update({ welcome_tutorial_completed: true, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select('id, welcome_tutorial_completed')
      .single();

    if (error) {
      console.error('[complete-tutorial] Supabase error:', error.message, error.code, error.details);
      return res.status(500).json({
        success: false,
        message: 'Failed to save tutorial status',
        ...(process.env.NODE_ENV !== 'production' && { debug: error.message })
      });
    }

    if (!data || data.welcome_tutorial_completed !== true) {
      console.error('[complete-tutorial] No row updated. data:', data, 'userId:', userId);
      return res.status(500).json({
        success: false,
        message: 'Failed to save tutorial status (user not found or column missing)'
      });
    }

    res.json({ success: true, message: 'Tutorial marked as completed' });
  } catch (error) {
    console.error('[complete-tutorial] Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to save tutorial status',
      ...(process.env.NODE_ENV !== 'production' && { debug: error.message })
    });
  }
});

// @route   POST /api/users/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', authenticateToken, validateChangePassword, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Get current password hash
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', userId)
      .single();

    if (fetchError || !userData) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userData.password_hash);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        password_hash: newPasswordHash, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', userId);

    if (updateError) {
      throw updateError;
    }

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
});

// @route   GET /api/users/notifications
// @desc    Get user notifications
// @access  Private
router.get('/notifications', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, unreadOnly = false } = req.query;

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (unreadOnly === 'true') {
      query = query.eq('is_read', false);
    }

    const offset = (page - 1) * limit;
    const { data, error, count } = await query
      .range(offset, offset + parseInt(limit) - 1);

    if (error) throw error;

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        notifications: data || [],
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalNotifications: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notifications'
    });
  }
});

// @route   PUT /api/users/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', userId)
      .select('id')
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    });
  }
});

// @route   PUT /api/users/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/notifications/read-all', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read'
    });
  }
});

// @route   GET /api/users/usage-stats
// @desc    Get user usage statistics
// @access  Private
router.get('/usage-stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = '30' } = req.query; // days

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Get document count
    const { count: docCount, error: docError } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (docError) throw docError;

    // Get analysis count
    const { count: analysisCount, error: analysisError } = await supabase
      .from('document_analyses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (analysisError) throw analysisError;

    // Get recent usage (last period days) - simplified for now
    const { data: recentUsage, error: usageError } = await supabase
      .from('usage_tracking')
      .select('action_type, credits_used')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString());

    if (usageError) throw usageError;

    // Get total credits used
    const { data: totalCredits, error: creditsError } = await supabase
      .from('usage_tracking')
      .select('credits_used')
      .eq('user_id', userId);

    if (creditsError) throw creditsError;

    const totalCreditsUsed = totalCredits?.reduce((sum, record) => sum + (record.credits_used || 0), 0) || 0;

    res.json({
      success: true,
      data: {
        totalDocuments: docCount || 0,
        totalAnalyses: analysisCount || 0,
        totalCreditsUsed,
        recentUsage: recentUsage || [],
        period: `${period} days`
      }
    });
  } catch (error) {
    console.error('Get usage stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get usage statistics'
    });
  }
});

// @route   DELETE /api/users/account
// @desc    Delete user account
// @access  Private
router.delete('/account', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Note: Deletes from users table only. trial_usage is intentionally NOT deleted —
    // it tracks emails that have used the first-time offer, so re-registering with the same
    // email cannot grant another discount.
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete account'
    });
  }
});

// @route   GET /api/users/username/check/:username
// @desc    Check if username is available
// @access  Private
router.get('/username/check/:username', authenticateToken, async (req, res) => {
  try {
    const { username } = req.params;
    const userId = req.user.id;

    if (!username || username.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Username must be at least 3 characters'
      });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({
        success: false,
        available: false,
        message: 'Username can only contain letters, numbers, and underscores'
      });
    }

    const isAvailable = await userService.isUsernameAvailable(username.toLowerCase(), userId);

    res.json({
      success: true,
      available: isAvailable,
      message: isAvailable ? 'Username is available' : 'Username is already taken'
    });
  } catch (error) {
    console.error('Check username error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check username availability'
    });
  }
});

// @route   PUT /api/users/username
// @desc    Update username
// @access  Private
router.put('/username', authenticateToken, async (req, res) => {
  try {
    const { username } = req.body;
    const userId = req.user.id;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Username is required'
      });
    }

    const updatedUser = await userService.updateUsername(userId, username);

    res.json({
      success: true,
      message: 'Username updated successfully',
      data: {
        username: updatedUser.username
      }
    });
  } catch (error) {
    console.error('Update username error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update username'
    });
  }
});

// @route   GET /api/users/achievements
// @desc    Get user achievements (stats + unlocked badges)
// @access  Private
router.get('/achievements', authenticateToken, async (req, res) => {
  try {
    const achievements = await achievementsService.getAchievements(req.user.id);
    res.json({
      success: true,
      data: {
        stats: achievements.stats,
        unlockedBadges: achievements.unlockedBadges
      }
    });
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get achievements'
    });
  }
});

// @route   PUT /api/users/achievements
// @desc    Save/merge user achievements
// @access  Private
router.put('/achievements', authenticateToken, async (req, res) => {
  try {
    const { stats, unlockedBadges } = req.body;
    const achievements = await achievementsService.upsertAchievements(req.user.id, {
      stats: stats || {},
      unlockedBadges: unlockedBadges || {}
    });
    res.json({
      success: true,
      data: {
        stats: achievements.stats,
        unlockedBadges: achievements.unlockedBadges
      }
    });
  } catch (error) {
    console.error('Save achievements error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save achievements'
    });
  }
});

module.exports = router;
