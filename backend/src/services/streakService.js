const { query } = require('../database/connection');

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

/**
 * Record a streak activity for a user
 * This is a fire-and-forget operation that shouldn't block the main response
 */
async function recordActivity(userId, activityType) {
  if (!userId || !activityType || !STREAK_ACTIVITIES.includes(activityType)) {
    return;
  }

  try {
    const today = new Date().toISOString().split('T')[0];

    // Check if this activity type was already recorded today
    const existingActivity = await query(
      `SELECT id FROM streak_activities 
       WHERE user_id = $1 AND activity_date = $2 AND activity_type = $3`,
      [userId, today, activityType]
    );

    if (existingActivity.rows.length > 0) {
      return; // Already recorded today
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

    // Get or create streak info
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
      console.log(`🔥 New streak started for user ${userId}`);
      return;
    }

    const streak = streakResult.rows[0];
    const lastActivityDate = streak.last_activity_date 
      ? new Date(streak.last_activity_date).toISOString().split('T')[0]
      : null;
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    let newCurrentStreak = streak.current_streak;
    let newLongestStreak = streak.longest_streak;
    let newTotalDays = streak.total_activity_days;

    // Only count first activity of the day for streak
    if (parseInt(todayActivities.rows[0].count) === 1) {
      newTotalDays += 1;

      if (lastActivityDate === yesterday) {
        // Streak continues
        newCurrentStreak += 1;
        console.log(`🔥 Streak extended to ${newCurrentStreak} for user ${userId}`);
      } else if (lastActivityDate === today) {
        // Already counted today, don't change streak
      } else {
        // Streak was broken, start new
        newCurrentStreak = 1;
        console.log(`🔥 New streak started for user ${userId}`);
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
  } catch (error) {
    // Log but don't throw - streak recording shouldn't break the main operation
    console.error('Error recording streak activity:', error);
  }
}

module.exports = {
  recordActivity,
  STREAK_ACTIVITIES
};
