/**
 * Streak service - login only.
 * Records when a user logs in. Streak = consecutive days of logging in.
 */
const { createClient } = require('@supabase/supabase-js');

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  );
}

/**
 * Record a login for today. Call this when user successfully logs in.
 * Idempotent - multiple logins same day = one record.
 */
async function recordLogin(userId) {
  if (!userId) return;

  try {
    const supabase = getSupabase();
    const today = new Date().toISOString().split('T')[0];

    const { error } = await supabase
      .from('user_login_dates')
      .insert({ user_id: userId, login_date: today });

    if (error && error.code !== '23505') {
      throw error;
    }
  } catch (err) {
    console.error('Error recording login for streak:', err);
  }
}

/**
 * Compute streak stats from login dates
 */
function computeStreakFromDates(loginDates) {
  const dates = [...new Set(loginDates)].map(d => (d || '').split('T')[0]).filter(Boolean).sort();
  if (dates.length === 0) {
    return { currentStreak: 0, longestStreak: 0, totalLoginDays: 0 };
  }

  const today = new Date().toISOString().split('T')[0];
  const dateSet = new Set(dates);

  // Current streak: count consecutive days ending at today
  let current = 0;
  let d = new Date(today);
  while (true) {
    const ds = d.toISOString().split('T')[0];
    if (!dateSet.has(ds)) break;
    current++;
    d.setDate(d.getDate() - 1);
  }

  // Longest streak
  let longest = 1;
  let run = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]).getTime();
    const curr = new Date(dates[i]).getTime();
    const diffDays = (prev - curr) / (24 * 60 * 60 * 1000);
    if (diffDays === 1) {
      run++;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }

  return {
    currentStreak: current,
    longestStreak: longest,
    totalLoginDays: dates.length
  };
}

module.exports = {
  recordLogin,
  computeStreakFromDates
};
