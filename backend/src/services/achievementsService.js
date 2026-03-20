const { createClient } = require('@supabase/supabase-js');

/**
 * Get user achievements from Supabase
 */
async function getAchievements(userId) {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data, error } = await supabase
    .from('user_achievements')
    .select('stats, unlocked_badges')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return {
    stats: data?.stats || {},
    unlockedBadges: data?.unlocked_badges || {}
  };
}

/**
 * Upsert user achievements (merge with existing)
 * Takes max of numeric stats, merges badges (earliest date wins)
 */
async function upsertAchievements(userId, { stats = {}, unlockedBadges = {} }) {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const existing = await getAchievements(userId);

  const mergedStats = mergeStats(existing.stats, stats);
  const mergedBadges = mergeBadges(existing.unlockedBadges, unlockedBadges);

  const { data, error } = await supabase
    .from('user_achievements')
    .upsert(
      {
        user_id: userId,
        stats: mergedStats,
        unlocked_badges: mergedBadges,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'user_id' }
    )
    .select('stats, unlocked_badges')
    .single();

  if (error) throw error;

  return {
    stats: data.stats,
    unlockedBadges: data.unlocked_badges
  };
}

function mergeStats(existing, incoming) {
  const numericKeys = [
    'uploads_count', 'analyses_count', 'summaries_count',
    'quizzes_count', 'flashcards_count', 'crosswords_count', 'citations_count',
    'lessons_count',
    'longest_streak', 'current_streak', 'tools_used_session', 'study_tools_session',
    'exports_count', 'copies_count',
    'calendar_events_count', 'friend_requests_sent', 'friends_count', 'shares_count',
    'quick_review_count', 'quick_review_perfect_scores', 'quick_review_current_streak',
    'quick_review_longest_streak', 'crater_blast_games', 'crater_blast_perfect_games',
    'crater_blast_high_score', 'total_study_tools_created', 'total_words_analyzed',
    'documents_in_single_day', 'study_sessions_count',
    'focus_mode_unlocks_count', 'focus_mode_sites_blocked',
    'study_packs_count'
  ];

  const merged = { ...existing };

  for (const key of numericKeys) {
    if (incoming[key] !== undefined) {
      const existingVal = merged[key] ?? 0;
      merged[key] = Math.max(existingVal, incoming[key]);
    }
  }

  const boolKeys = ['used_after_10pm', 'used_before_7am', 'is_paid_user', 'midnight_usage', 'weekend_usage', 'visited_badges', 'first_login'];
  for (const key of boolKeys) {
    if (incoming[key] !== undefined) {
      merged[key] = merged[key] || incoming[key];
    }
  }

  // Merge array fields
  const arrayKeys = ['tools_used_ever', 'unique_friends_shared_with'];
  for (const key of arrayKeys) {
    if (incoming[key] && Array.isArray(incoming[key])) {
      const existingArr = merged[key] || [];
      merged[key] = [...new Set([...existingArr, ...incoming[key]])];
    }
  }

  if (incoming.paid_since) {
    if (!merged.paid_since || new Date(incoming.paid_since) < new Date(merged.paid_since)) {
      merged.paid_since = incoming.paid_since;
    }
  }

  if (incoming.last_active_date) {
    if (!merged.last_active_date || new Date(incoming.last_active_date) > new Date(merged.last_active_date)) {
      merged.last_active_date = incoming.last_active_date;
    }
  }

  return merged;
}

function mergeBadges(existing, incoming) {
  const merged = { ...existing };
  for (const [badgeId, date] of Object.entries(incoming)) {
    if (!merged[badgeId] || (date && new Date(date) < new Date(merged[badgeId]))) {
      merged[badgeId] = date;
    }
  }
  return merged;
}

module.exports = {
  getAchievements,
  upsertAchievements
};
