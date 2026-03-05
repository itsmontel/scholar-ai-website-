const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { createClient } = require('@supabase/supabase-js');
const { computeStreakFromDates } = require('../services/streakService');

const router = express.Router();

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  );
}

// @route   GET /api/streaks
// @desc    Get user's streak (login-only)
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const supabase = getSupabase();

    const { data: rows, error } = await supabase
      .from('user_login_dates')
      .select('login_date')
      .eq('user_id', userId)
      .order('login_date', { ascending: false });

    if (error) throw error;

    const loginDates = (rows || []).map(r => r.login_date);
    const { currentStreak, longestStreak, totalLoginDays } = computeStreakFromDates(loginDates);

    const today = new Date().toISOString().split('T')[0];
    const hasActivityToday = loginDates.some(d => (d || '').split('T')[0] === today);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const weekStart = sevenDaysAgo.toISOString().split('T')[0];
    const weekActivities = loginDates
      .map(d => (d || '').split('T')[0])
      .filter(d => d >= weekStart);

    res.json({
      success: true,
      data: {
        currentStreak,
        longestStreak,
        totalActivityDays: totalLoginDays,
        hasActivityToday,
        weekActivities
      }
    });
  } catch (error) {
    console.error('Error fetching streak:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch streak'
    });
  }
});

module.exports = router;
