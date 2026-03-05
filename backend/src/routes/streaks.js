const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { query } = require('../database/connection');

const router = express.Router();

// Activity types that count towards streaks
const STREAK_ACTIVITIES = [
  'login',
  'essay_analysis',
  'quiz_generated',
  'flashcards_generated',
  'crossword_generated',
  'humanizer_used',
  'summarizer_used',
  'citation_search',
  'document_upload'
];

// @route   GET /api/streaks
// @desc    Get user's streak information
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get or create user streak record
    let streakResult = await query(
      'SELECT * FROM user_streaks WHERE user_id = $1',
      [userId]
    );

    if (streakResult.rows.length === 0) {
      // Create initial streak record
      await query(
        `INSERT INTO user_streaks (user_id, current_streak, longest_streak, total_activity_days)
         VALUES ($1, 0, 0, 0)`,
        [userId]
      );
      streakResult = await query(
        'SELECT * FROM user_streaks WHERE user_id = $1',
        [userId]
      );
    }

    const streak = streakResult.rows[0];

    // Get activities for the last 7 days for calendar view
    const weekActivities = await query(
      `SELECT DISTINCT activity_date 
       FROM streak_activities 
       WHERE user_id = $1 
       AND activity_date >= CURRENT_DATE - INTERVAL '6 days'
       ORDER BY activity_date`,
      [userId]
    );

    // Check if streak needs to be reset (more than 1 day since last activity)
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    let currentStreak = streak.current_streak;
    const lastActivityDate = streak.last_activity_date 
      ? new Date(streak.last_activity_date).toISOString().split('T')[0]
      : null;

    // If last activity was before yesterday, streak is broken
    if (lastActivityDate && lastActivityDate < yesterday) {
      currentStreak = 0;
      await query(
        'UPDATE user_streaks SET current_streak = 0, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1',
        [userId]
      );
    }

    // Check if user has activity today
    const todayActivity = weekActivities.rows.find(a => 
      new Date(a.activity_date).toISOString().split('T')[0] === today
    );

    res.json({
      success: true,
      data: {
        currentStreak,
        longestStreak: streak.longest_streak,
        totalActivityDays: streak.total_activity_days,
        lastActivityDate: streak.last_activity_date,
        hasActivityToday: !!todayActivity,
        weekActivities: weekActivities.rows.map(a => 
          new Date(a.activity_date).toISOString().split('T')[0]
        )
      }
    });

  } catch (error) {
    console.error('Error fetching streak:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch streak information'
    });
  }
});

// @route   POST /api/streaks/record
// @desc    Record a streak-worthy activity
// @access  Private
router.post('/record', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { activityType } = req.body;

    if (!activityType || !STREAK_ACTIVITIES.includes(activityType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid activity type'
      });
    }

    const today = new Date().toISOString().split('T')[0];

    // Check if this activity type was already recorded today
    const existingActivity = await query(
      `SELECT id FROM streak_activities 
       WHERE user_id = $1 AND activity_date = $2 AND activity_type = $3`,
      [userId, today, activityType]
    );

    if (existingActivity.rows.length > 0) {
      // Activity already recorded, just return current streak
      const streak = await query('SELECT * FROM user_streaks WHERE user_id = $1', [userId]);
      return res.json({
        success: true,
        message: 'Activity already recorded today',
        data: {
          currentStreak: streak.rows[0]?.current_streak || 0,
          activityRecorded: false
        }
      });
    }

    // Record the activity
    await query(
      `INSERT INTO streak_activities (user_id, activity_date, activity_type)
       VALUES ($1, $2, $3)`,
      [userId, today, activityType]
    );

    // Check if user already had any activity today
    const todayActivities = await query(
      `SELECT COUNT(*) as count FROM streak_activities 
       WHERE user_id = $1 AND activity_date = $2`,
      [userId, today]
    );

    // Get current streak info
    let streakResult = await query(
      'SELECT * FROM user_streaks WHERE user_id = $1',
      [userId]
    );

    if (streakResult.rows.length === 0) {
      // Create initial streak record
      await query(
        `INSERT INTO user_streaks (user_id, current_streak, longest_streak, total_activity_days, last_activity_date)
         VALUES ($1, 1, 1, 1, $2)`,
        [userId, today]
      );
      return res.json({
        success: true,
        message: 'Streak started!',
        data: {
          currentStreak: 1,
          longestStreak: 1,
          activityRecorded: true,
          isNewStreak: true
        }
      });
    }

    const streak = streakResult.rows[0];
    const lastActivityDate = streak.last_activity_date 
      ? new Date(streak.last_activity_date).toISOString().split('T')[0]
      : null;
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    let newCurrentStreak = streak.current_streak;
    let newLongestStreak = streak.longest_streak;
    let newTotalDays = streak.total_activity_days;
    let streakMessage = 'Activity recorded!';

    // Only count first activity of the day for streak
    if (parseInt(todayActivities.rows[0].count) === 1) {
      newTotalDays += 1;

      if (lastActivityDate === yesterday) {
        // Streak continues
        newCurrentStreak += 1;
        streakMessage = `Streak extended to ${newCurrentStreak} days!`;
      } else if (lastActivityDate === today) {
        // Already counted today, don't change streak
      } else {
        // Streak was broken, start new
        newCurrentStreak = 1;
        streakMessage = 'New streak started!';
      }

      // Update longest streak if needed
      if (newCurrentStreak > newLongestStreak) {
        newLongestStreak = newCurrentStreak;
      }

      // Update streak record
      await query(
        `UPDATE user_streaks 
         SET current_streak = $1, longest_streak = $2, total_activity_days = $3, 
             last_activity_date = $4, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $5`,
        [newCurrentStreak, newLongestStreak, newTotalDays, today, userId]
      );
    }

    res.json({
      success: true,
      message: streakMessage,
      data: {
        currentStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
        totalActivityDays: newTotalDays,
        activityRecorded: true
      }
    });

  } catch (error) {
    console.error('Error recording streak activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record activity'
    });
  }
});

// @route   GET /api/streaks/calendar
// @desc    Get activity calendar for a month
// @access  Private
router.get('/calendar', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { month, year } = req.query;

    const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();

    const activities = await query(
      `SELECT DISTINCT activity_date, array_agg(DISTINCT activity_type) as activities
       FROM streak_activities 
       WHERE user_id = $1 
       AND EXTRACT(MONTH FROM activity_date) = $2
       AND EXTRACT(YEAR FROM activity_date) = $3
       GROUP BY activity_date
       ORDER BY activity_date`,
      [userId, targetMonth, targetYear]
    );

    res.json({
      success: true,
      data: {
        month: targetMonth,
        year: targetYear,
        activities: activities.rows.map(a => ({
          date: new Date(a.activity_date).toISOString().split('T')[0],
          types: a.activities
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching calendar:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch calendar'
    });
  }
});

module.exports = router;
